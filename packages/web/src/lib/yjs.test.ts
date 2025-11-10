import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as yjs from './yjs';
import * as sync from './sync';

vi.mock('./sync', () => ({
  createYSweetProvider: vi.fn(),
  isSyncEnabled: vi.fn(),
}));

describe('yjs.ts sync integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sync.isSyncEnabled).mockReturnValue(false);
  });

  afterEach(() => {
    // Clean up localStorage
    localStorage.removeItem('tasky-settings');
  });

  describe('initializeSync', () => {
    it('should not initialize when sync is disabled', async () => {
      vi.mocked(sync.isSyncEnabled).mockReturnValue(false);

      await yjs.initializeSync();

      expect(sync.createYSweetProvider).not.toHaveBeenCalled();
    });

    it('should initialize sync provider when enabled', async () => {
      vi.mocked(sync.isSyncEnabled).mockReturnValue(true);
      const mockProvider = {
        connect: vi.fn().mockResolvedValue(undefined),
        connectionState: 'disconnected' as const,
        provider: null,
        disconnect: vi.fn(),
        reconnect: vi.fn().mockResolvedValue(undefined),
        onConnectionStateChange: vi.fn(),
      };
      vi.mocked(sync.createYSweetProvider).mockReturnValue(mockProvider);

      // Mock settings in localStorage
      localStorage.setItem('tasky-settings', JSON.stringify({
        enabled: true,
        tokenUrl: 'http://localhost:8092/token'
      }));

      await yjs.initializeSync();

      expect(sync.createYSweetProvider).toHaveBeenCalledWith(
        yjs.ydoc,
        'http://localhost:8092/token'
      );
      expect(mockProvider.connect).toHaveBeenCalled();

      localStorage.removeItem('tasky-settings');
    });

    it('should handle initialization errors gracefully', async () => {
      vi.mocked(sync.isSyncEnabled).mockReturnValue(true);
      const mockProvider = {
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
        connectionState: 'error' as const,
        provider: null,
        disconnect: vi.fn(),
        reconnect: vi.fn().mockResolvedValue(undefined),
        onConnectionStateChange: vi.fn(),
      };
      vi.mocked(sync.createYSweetProvider).mockReturnValue(mockProvider);

      localStorage.setItem('tasky-settings', JSON.stringify({
        enabled: true,
        tokenUrl: 'http://localhost:8092/token'
      }));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      await yjs.initializeSync();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();

      localStorage.removeItem('tasky-settings');
    });
  });

  describe('getSyncState', () => {
    it('should return disabled when sync is not enabled', () => {
      vi.mocked(sync.isSyncEnabled).mockReturnValue(false);

      expect(yjs.getSyncState()).toBe('disabled');
    });

    it('should return provider state when sync is enabled', async () => {
      vi.mocked(sync.isSyncEnabled).mockReturnValue(true);
      const mockProvider = {
        connectionState: 'connected' as const,
        provider: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
        reconnect: vi.fn(),
        onConnectionStateChange: vi.fn(),
      };
      vi.mocked(sync.createYSweetProvider).mockReturnValue(mockProvider);

      localStorage.setItem('tasky-settings', JSON.stringify({
        enabled: true,
        tokenUrl: 'http://localhost:8092/token'
      }));

      // Initialize sync to set syncProvider
      await yjs.initializeSync();

      expect(yjs.getSyncState()).toBe('connected');

      localStorage.removeItem('tasky-settings');
    });
  });

  describe('waitForSync', () => {
    it('should wait for IndexedDB sync', async () => {
      vi.mocked(sync.isSyncEnabled).mockReturnValue(false);

      // Mock IndexedDB provider synced state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (yjs.provider as any).synced = true;

      await yjs.waitForSync();

      // When sync is disabled, should just wait for IndexedDB
      expect(sync.createYSweetProvider).not.toHaveBeenCalled();
    });
  });
});

