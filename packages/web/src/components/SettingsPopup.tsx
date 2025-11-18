import { useState, useEffect } from 'react';
import { useNavigation } from '../store/navigation';
import { getSyncSettings, updateSyncSettings, resetSettings, type SyncSettings } from '../lib/settings';
import { getSyncState, reinitializeSync } from '../lib/yjs';

export function SettingsPopup() {
  const { settingsOpen, closeSettings } = useNavigation();
  const [settings, setSettings] = useState<SyncSettings>(getSyncSettings());
  const [syncState, setSyncState] = useState<'disabled' | 'disconnected' | 'connecting' | 'connected' | 'error'>('disabled');
  const [isSaving, setIsSaving] = useState(false);

  // Update sync state periodically
  useEffect(() => {
    if (!settingsOpen) return;

    const updateState = () => {
      setSyncState(getSyncState());
    };

    updateState();
    const interval = setInterval(updateState, 1000);

    return () => clearInterval(interval);
  }, [settingsOpen]);

  // Load settings when popup opens
  useEffect(() => {
    if (settingsOpen) {
      setSettings(getSyncSettings());
      setSyncState(getSyncState());
    }
  }, [settingsOpen]);

  if (!settingsOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateSyncSettings(settings);

      // Reinitialize sync with new settings
      await reinitializeSync();

      closeSettings();
    } catch (error) {
      console.error('[Settings] Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = getSyncSettings();
    resetSettings();
    setSettings({ ...defaults });
  };

  const getSyncStatusColor = () => {
    switch (syncState) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'disconnected':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-400 dark:text-gray-600';
    }
  };

  const getSyncStatusText = () => {
    switch (syncState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Disabled';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-light-bg dark:bg-dark-bg rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
            <button
              onClick={closeSettings}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Sync Settings Section */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Multi-Device Sync
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Configure Y-Sweet sync server for multi-device synchronization. Settings are stored locally and not synced.
            </p>

            {/* Enable Sync Toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable sync
                </span>
              </label>
            </div>

            {/* Sync Status */}
            {settings.enabled && (
              <div className="mb-4 p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getSyncStatusColor()}`}>
                    Status: {getSyncStatusText()}
                  </span>
                </div>
              </div>
            )}

            {/* Token Server URL - the only field needed! */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sync Server URL
              </label>
              <input
                type="text"
                value={settings.tokenUrl}
                onChange={(e) => setSettings({ ...settings, tokenUrl: e.target.value })}
                placeholder="http://localhost:8093/token"
                className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface dark:bg-dark-surface text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                URL of your sync server (provides connection details and tokens)
              </p>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-light-border dark:border-dark-border flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={closeSettings}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

