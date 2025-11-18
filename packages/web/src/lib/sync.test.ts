import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';
import { createYSweetProvider, isSyncEnabled, type SyncProvider } from './sync';
import { WebsocketProvider } from 'y-websocket';

// Mock y-websocket
vi.mock('y-websocket', () => {
  return {
    WebsocketProvider: vi.fn(function (_url, _docId, _ydoc, _options) {
      return {
        on: vi.fn(),
        destroy: vi.fn(),
        shouldConnect: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }),
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('sync.ts', () => {
  let ydoc: Y.Doc;

  beforeEach(() => {
    ydoc = new Y.Doc();
    vi.clearAllMocks();
    // Reset environment variables
    vi.stubEnv('VITE_SYNC_ENABLED', 'false');
    vi.stubEnv('VITE_YSWEET_URL', '');
    vi.stubEnv('VITE_YSWEET_TOKEN_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('isSyncEnabled', () => {
    it('should return false when sync is disabled', () => {
      // Use default settings (disabled)
      expect(isSyncEnabled()).toBe(false);
    });

    it('should return false when sync enabled but token URL missing', () => {
      localStorage.setItem('tasky-settings', JSON.stringify({ enabled: true, tokenUrl: '' }));
      expect(isSyncEnabled()).toBe(false);
      localStorage.removeItem('tasky-settings');
    });

    it('should return true when sync enabled and token URL provided', () => {
      localStorage.setItem('tasky-settings', JSON.stringify({ enabled: true, tokenUrl: 'http://localhost:8080' }));
      expect(isSyncEnabled()).toBe(true);
      localStorage.removeItem('tasky-settings');
    });
  });

  describe('createYSweetProvider', () => {
    it('should create a sync provider instance', () => {
      const provider = createYSweetProvider(
        ydoc,
        'http://localhost:8080'
      );

      expect(provider).toBeDefined();
      expect(provider.connectionState).toBe('disconnected');
      expect(provider.provider).toBeNull();
    });
  });

  describe('SyncProvider', () => {
    let provider: SyncProvider;
    const baseUrl = 'http://localhost:8080';

    beforeEach(() => {
      provider = createYSweetProvider(
        ydoc,
        baseUrl
      );
    });

    describe('connect', () => {
      it('should fetch connection info and rewrite URL for WebSocket provider', async () => {
        // Mock internal URL returned by token server
        const mockResponse = {
          token: 'ws://y-sweet:8091/d/test-doc/ws', 
          url: 'ws://localhost:8091',
          docId: 'test-doc'
        };
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        await provider.connect();

        // Should fetch from /token endpoint
        expect(fetch).toHaveBeenCalledWith('http://localhost:8080/token');
        
        // Should rewrite ws://y-sweet:8091... to ws://localhost:8080...
        expect(WebsocketProvider).toHaveBeenCalledWith(
          'ws://localhost:8080/d/test-doc/ws',
          'test-doc',
          ydoc,
          { connect: true }
        );
        expect(provider.provider).toBeDefined();
      });

      it('should rewrite URL correctly when using HTTPS', async () => {
        const httpsProvider = createYSweetProvider(ydoc, 'https://api.tasky.app');
        
        const mockResponse = {
          token: 'ws://y-sweet:8091/d/test-doc/ws',
          docId: 'test-doc'
        };
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        await httpsProvider.connect();

        expect(fetch).toHaveBeenCalledWith('https://api.tasky.app/token');
        
        // Should rewrite to wss:// and use the host from config
        expect(WebsocketProvider).toHaveBeenCalledWith(
          'wss://api.tasky.app/d/test-doc/ws',
          'test-doc',
          ydoc,
          { connect: true }
        );
      });

      it('should handle token fetch failure', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        await expect(provider.connect()).rejects.toThrow();
        expect(provider.connectionState).toBe('error');
      });

      it('should not connect if already connecting', async () => {
        const mockResponse = {
          token: 'ws://y-sweet:8091/d/test-doc/ws',
          docId: 'test-doc'
        };
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const connectPromise1 = provider.connect();
        const connectPromise2 = provider.connect();

        await Promise.all([connectPromise1, connectPromise2]);

        // Should only fetch connection info once
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('disconnect', () => {
      it('should destroy provider and reset state', async () => {
        const mockResponse = {
          token: 'ws://y-sweet:8091/d/test-doc/ws',
          docId: 'test-doc'
        };
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        await provider.connect();
        const mockProvider = provider.provider;
        expect(mockProvider).toBeDefined();

        provider.disconnect();

        expect(mockProvider?.destroy).toHaveBeenCalled();
        expect(provider.provider).toBeNull();
        expect(provider.connectionState).toBe('disconnected');
      });
    });

    describe('reconnect', () => {
      it('should disconnect and reconnect', async () => {
        const mockResponse = {
          token: 'ws://y-sweet:8091/d/test-doc/ws',
          docId: 'test-doc'
        };
        vi.mocked(fetch)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          } as Response);

        await provider.connect();
        const initialProvider = provider.provider;

        await provider.reconnect();

        expect(initialProvider?.destroy).toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
