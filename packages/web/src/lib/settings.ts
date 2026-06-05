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
  syncUrl: string; // The base sync URL (e.g. http://localhost:8080)
}

/**
 * Legacy settings interface for migration
 * @deprecated
 */
interface StoredSyncSettings extends Partial<SyncSettings> {
  enabled?: boolean;
  tokenUrl?: string;
  ySweetUrl?: string;
  documentId?: string;
}

const SETTINGS_KEY = 'tasky-settings';

// Validate environment variable URL
const envSyncUrl = import.meta.env.VITE_SYNC_URL;
const defaultSyncUrl = envSyncUrl && isValidUrl(envSyncUrl)
  ? envSyncUrl
  : 'http://localhost:8080';

const DEFAULT_SETTINGS: SyncSettings = {
  enabled: false,
  syncUrl: defaultSyncUrl,
};

/**
 * Migrates legacy settings to current format
 */
function migrateSettings(settings: StoredSyncSettings): SyncSettings {
  const { tokenUrl, ySweetUrl, documentId, ...current } = settings;
  const migrated: SyncSettings = {
    ...DEFAULT_SETTINGS,
    ...current,
    syncUrl: current.syncUrl ?? tokenUrl ?? DEFAULT_SETTINGS.syncUrl,
    enabled: current.enabled ?? DEFAULT_SETTINGS.enabled,
  };

  // If migration occurred (legacy fields were present), save cleaned settings
  if (tokenUrl !== undefined || ySweetUrl !== undefined || documentId !== undefined) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(migrated));
    } catch (error) {
      console.error('[Settings] Failed to save migrated settings:', error);
    }
  }

  return migrated;
}

/**
 * Load settings from localStorage
 */
export function loadSettings(): SyncSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredSyncSettings;
      // Migrate legacy fields and merge with defaults
      const migrated = migrateSettings(parsed);
      return migrated;
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
    // Validate syncUrl before saving
    if (settings.syncUrl && !isValidUrl(settings.syncUrl)) {
      throw new Error(`Invalid sync URL: ${settings.syncUrl}. Must be a valid http:// or https:// URL.`);
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
