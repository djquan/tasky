/**
 * Settings Store
 *
 * Manages app settings stored in localStorage (not synced via CRDT).
 * Settings are per-device and persist between sessions.
 */

/**
 * Validates that a URL is valid and uses http/https protocol
 */
function isValidUrl(urlString: string): boolean {
  if (!urlString) return false;

  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface SyncSettings {
  enabled: boolean;
  tokenUrl: string; // Now represents the base Sync URL (e.g. http://localhost:8080)
  // Legacy fields for backward compatibility (no longer shown in UI)
  ySweetUrl?: string;
  documentId?: string;
}

const SETTINGS_KEY = 'tasky-settings';

// Validate environment variable URL
const envSyncUrl = import.meta.env.VITE_SYNC_URL;
const defaultTokenUrl = envSyncUrl && isValidUrl(envSyncUrl)
  ? envSyncUrl
  : 'http://localhost:8080';

const DEFAULT_SETTINGS: SyncSettings = {
  enabled: false,
  tokenUrl: defaultTokenUrl,
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
    // Validate tokenUrl before saving
    if (settings.tokenUrl && !isValidUrl(settings.tokenUrl)) {
      throw new Error(`Invalid sync URL: ${settings.tokenUrl}. Must be a valid http:// or https:// URL.`);
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[Settings] Failed to save settings:', error);
    throw error; // Re-throw to allow caller to handle validation errors
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
