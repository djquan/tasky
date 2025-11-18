/**
 * Y-Sweet Sync Provider
 *
 * Manages Y-Sweet provider initialization, connection state, and reconnection logic.
 * Works alongside IndexedDB provider for hybrid local-first + remote sync.
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { getSyncSettings } from './settings';

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
  docId: string; // Document ID
  path: string; // WebSocket path (e.g., /d/doc-id/ws)
}

class YSweetSyncProvider implements SyncProvider {
  private ydoc: Y.Doc;
  private backendUrl: string; // Base backend URL (e.g., http://localhost:8080)
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionStateListeners: Set<(state: ConnectionState) => void> = new Set();

  public provider: WebsocketProvider | null = null;
  public connectionState: ConnectionState = 'disconnected';

  constructor(
    ydoc: Y.Doc,
    backendUrl: string
  ) {
    this.ydoc = ydoc;
    // Normalize backend URL (remove trailing slash)
    this.backendUrl = backendUrl.replace(/\/$/, '');
  }

  /**
   * Fetch token and connection details from token server
   * Returns docId and path - client constructs full WebSocket URL
   */
  private async fetchConnectionInfo(): Promise<TokenResponse> {
    // Automatically append /token to backend URL
    const tokenUrl = `${this.backendUrl}/token`;
    const response = await fetch(tokenUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  }

  /**
   * Construct WebSocket URL from backend URL
   * Converts http://host:port → ws://host:port
   *         https://host → wss://host
   */
  private getWebSocketBaseUrl(): string {
    const url = new URL(this.backendUrl);
    const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${url.host}`;
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
  public async connect(): Promise<void> {
    if (this.provider || this.connectionState === 'connecting') {
      return;
    }

    this.setConnectionState('connecting');
    this.reconnectAttempts = 0;

    try {
      // Fetch path and docId from token server
      const { docId, path } = await this.fetchConnectionInfo();

      // Construct full WebSocket URL using backend URL
      // Example: http://localhost:8080 → ws://localhost:8080 + /d/tasky-main/ws
      const wsBaseUrl = this.getWebSocketBaseUrl();
      const wsUrl = `${wsBaseUrl}${path}`;

      console.log('[YSweetSync] Backend:', this.backendUrl);
      console.log('[YSweetSync] Connecting to:', wsUrl);

      // Create WebSocket provider with constructed URL
      this.provider = new WebsocketProvider(wsUrl, docId, this.ydoc, {
        connect: true,
      });

      // Listen for connection events
      if (this.provider) {
        this.provider.on('status', (event: { status: 'disconnected' | 'connecting' | 'connected' }) => {
          // WebsocketProvider status events
          if (event.status === 'connected') {
            this.setConnectionState('connected');
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000; // Reset delay on successful connection
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
    this.reconnectAttempts = 0;
  }

  /**
   * Schedule reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

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
    this.disconnect();
    await this.connect();
  }
}

/**
 * Create Y-Sweet sync provider instance
 */
export function createYSweetProvider(
  ydoc: Y.Doc,
  backendUrl: string
): SyncProvider {
  return new YSweetSyncProvider(ydoc, backendUrl);
}

/**
 * Check if sync is enabled via settings
 */
export function isSyncEnabled(): boolean {
  const settings = getSyncSettings();
  return settings.enabled && !!settings.backendUrl;
}

