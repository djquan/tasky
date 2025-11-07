/**
 * Settings Store
 *
 * Manages app settings stored in localStorage (not synced via CRDT).
 * Settings are per-device and persist between sessions.
 */

export interface SyncSettings {
  enabled: boolean;
  tokenUrl: string;
  // Legacy fields for backward compatibility (no longer shown in UI)
  ySweetUrl?: string;
  documentId?: string;
}

const SETTINGS_KEY = 'tasky-settings';

const DEFAULT_SETTINGS: SyncSettings = {
  enabled: false,
  tokenUrl: 'http://localhost:3001/token',
};

/**
 * Load settings from localStorage
 */
export function loadSettings(): SyncSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle missing fields
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('[Settings] Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: SyncSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[Settings] Failed to save settings:', error);
  }
}

/**
 * Get sync settings
 */
export function getSyncSettings(): SyncSettings {
  return loadSettings();
}

/**
 * Update sync settings
 */
export function updateSyncSettings(updates: Partial<SyncSettings>): void {
  const current = loadSettings();
  const updated = { ...current, ...updates };
  saveSettings(updated);
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): void {
  saveSettings({ ...DEFAULT_SETTINGS });
}

