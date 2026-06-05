/**
 * Y-Sweet Sync Provider
 *
 * Manages Y-Sweet provider initialization, connection state, and reconnection logic.
 * Works alongside IndexedDB provider for hybrid local-first + remote sync.
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { getSyncSettings } from './settings';
import { MAX_RECONNECT_ATTEMPTS, INITIAL_RECONNECT_DELAY, MAX_RECONNECT_DELAY } from '../constants';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SyncProvider {
  provider: WebsocketProvider | null;
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  onConnectionStateChange: (listener: (state: ConnectionState) => void) => () => void;
}

interface TokenResponse {
  token: string; // Y-Sweet's internal WebSocket URL (e.g. ws://y-sweet:8091/d/doc-id/ws)
  url?: string;
  docId: string;
}

class YSweetSyncProvider implements SyncProvider {
  private ydoc: Y.Doc;
  private baseUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionStateListeners: Set<(state: ConnectionState) => void> = new Set();

  public provider: WebsocketProvider | null = null;
  public connectionState: ConnectionState = 'disconnected';

  constructor(
    ydoc: Y.Doc,
    baseUrl: string
  ) {
    this.ydoc = ydoc;
    // Ensure base URL has no trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Rewrite internal WebSocket URL to public URL based on configuration
   */
  private rewriteTokenUrl(internalUrl: string): string {
    try {
      // Parse the base URL (configuration)
      const base = new URL(this.baseUrl);
      
      // Parse the internal URL from token server
      // (might be ws://y-sweet:8091/... or similar)
      // We need to handle the case where it's not a valid URL if something goes wrong,
      // but we assume it is valid.
      // Note: The internal URL might use a hostname that is not resolvable here,
      // but we only need its path.
      let internalPath = '';
      try {
        const internalObj = new URL(internalUrl);
        internalPath = internalObj.pathname + internalObj.search;
      } catch {
        // Fallback if internalUrl is not a full URL (unlikely)
        console.warn('[YSweetSync] Could not parse internal URL, using as is:', internalUrl);
        return internalUrl;
      }

      // Determine WebSocket protocol based on HTTP protocol
      const wsProtocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Construct the new URL
      // Use the host from configuration
      const newUrl = `${wsProtocol}//${base.host}${internalPath}`;
      
      return newUrl;
    } catch (error) {
      console.error('[YSweetSync] Error rewriting token URL:', error);
      return internalUrl;
    }
  }

  /**
   * Fetch token and connection details from token server
   */
  private async fetchConnectionInfo(): Promise<{ token: string; docId: string }> {
    const tokenEndpoint = `${this.baseUrl}/token`;
    const response = await fetch(tokenEndpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }
    const data: TokenResponse = await response.json();
    
    // Rewrite the token URL to be accessible from the client
    const publicTokenUrl = this.rewriteTokenUrl(data.token);
    
    return {
      token: publicTokenUrl,
      docId: data.docId
    };
  }

  /**
   * Update connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState === state) return;
    this.connectionState = state;
    this.connectionStateListeners.forEach(listener => listener(state));
  }

  /**
   * Subscribe to connection state changes
   */
  public onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
    this.connectionStateListeners.add(listener);
    return () => {
      this.connectionStateListeners.delete(listener);
    };
  }

  /**
   * Connect to Y-Sweet server
   */
  public async connect(resetAttempts = true): Promise<void> {
    if (this.provider || this.connectionState === 'connecting') {
      return;
    }

    this.setConnectionState('connecting');
    if (resetAttempts) {
      this.reconnectAttempts = 0;
    }

    try {
      // Fetch token and connection details from token server
      const { token, docId } = await this.fetchConnectionInfo();

      // Create WebSocket provider with Y-Sweet's authenticated URL
      this.provider = new WebsocketProvider(token, docId, this.ydoc, {
        connect: true,
      });

      // Listen for connection events
      if (this.provider) {
        this.provider.on('status', (event: { status: 'disconnected' | 'connecting' | 'connected' }) => {
          // WebsocketProvider status events
          if (event.status === 'connected') {
            this.setConnectionState('connected');
            this.reconnectAttempts = 0;
            this.reconnectDelay = INITIAL_RECONNECT_DELAY; // Reset delay on successful connection
          } else if (event.status === 'connecting') {
            this.setConnectionState('connecting');
          } else if (event.status === 'disconnected') {
            this.setConnectionState('disconnected');
            this.scheduleReconnect();
          }
        });

        // Check initial status
        if (this.provider.shouldConnect) {
          this.setConnectionState('connecting');
        }
      }
    } catch (error) {
      console.error('[YSweetSync] Connection failed:', error);
      this.setConnectionState('error');
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Disconnect from Y-Sweet server
   */
  public disconnect(): void {
    this.disconnectProvider(true);
  }

  private disconnectProvider(resetAttempts: boolean): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.provider) {
      try {
        this.provider.destroy();
      } catch (error) {
        console.error('[YSweetSync] Error disconnecting:', error);
      }
      this.provider = null;
    }

    this.setConnectionState('disconnected');
    if (resetAttempts) {
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Schedule reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), MAX_RECONNECT_DELAY);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnect().catch(error => {
        console.error('[YSweetSync] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Reconnect to Y-Sweet server
   */
  public async reconnect(): Promise<void> {
    this.disconnectProvider(false);
    await this.connect(false);
  }
}

/**
 * Create Y-Sweet sync provider instance
 */
export function createYSweetProvider(
  ydoc: Y.Doc,
  baseUrl: string
): SyncProvider {
  return new YSweetSyncProvider(ydoc, baseUrl);
}

/**
 * Check if sync is enabled via settings
 */
export function isSyncEnabled(): boolean {
  const settings = getSyncSettings();
  return settings.enabled && !!settings.syncUrl;
}
