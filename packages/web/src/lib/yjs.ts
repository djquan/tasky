import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import type {
  Task,
  List,
  Heading,
  Tag,
  ChecklistItem
} from '@tasky/shared';
import { createYSweetProvider, isSyncEnabled, type SyncProvider } from './sync';
import { getSyncSettings } from './settings';

// ============================================================================
// Yjs Document Setup
// ============================================================================

// Create the shared Yjs document
export const ydoc = new Y.Doc();

// Create IndexedDB persistence provider (always enabled for local-first)
// Note: Using same DB name 'tasky-db' but schema will be incompatible with old version
export const provider = new IndexeddbPersistence('tasky-db', ydoc);

// Y-Sweet sync provider (optional, enabled via settings)
export let syncProvider: SyncProvider | null = null;

/**
 * Initialize Y-Sweet sync provider if enabled
 */
export async function initializeSync(): Promise<void> {
  if (!isSyncEnabled()) {
    return;
  }

  const settings = getSyncSettings();
  const { backendUrl } = settings;

  if (!backendUrl) {
    console.warn('[Yjs] Sync enabled but missing backend URL');
    return;
  }

  try {
    syncProvider = createYSweetProvider(ydoc, backendUrl);
    await syncProvider.connect();
    console.log('[Yjs] Y-Sweet sync provider initialized');
  } catch (error) {
    console.error('[Yjs] Failed to initialize Y-Sweet sync:', error);
    // Continue without sync - IndexedDB will still work
  }
}

/**
 * Reinitialize sync (useful when settings change)
 */
export async function reinitializeSync(): Promise<void> {
  // Disconnect existing provider if any
  if (syncProvider) {
    syncProvider.disconnect();
    syncProvider = null;
  }

  // Initialize with new settings
  await initializeSync();
}

/**
 * Get sync connection state
 */
export function getSyncState(): 'disabled' | 'disconnected' | 'connecting' | 'connected' | 'error' {
  if (!isSyncEnabled() || !syncProvider) {
    return 'disabled';
  }
  return syncProvider.connectionState;
}

// ============================================================================
// Entity Maps (Y.Map for key-value storage with CRDT properties)
// ============================================================================

// Tasks stored as Map<id, Task>
export const tasksMap = ydoc.getMap<Task>('tasks');

// Lists (projects and areas) stored as Map<id, List>
export const listsMap = ydoc.getMap<List>('lists');

// Headings stored as Map<id, Heading>
export const headingsMap = ydoc.getMap<Heading>('headings');

// Tags stored as Map<id, Tag>
export const tagsMap = ydoc.getMap<Tag>('tags');

// Checklist items stored as Map<id, ChecklistItem>
export const checklistItemsMap = ydoc.getMap<ChecklistItem>('checklistItems');

// ============================================================================
// Sort Order Arrays (for maintaining user-defined ordering)
// ============================================================================

// Global sort orders for top-level entities
export const listsSortOrder = ydoc.getArray<string>('listsSortOrder');
export const tagsSortOrder = ydoc.getArray<string>('tagsSortOrder');

// Task sort orders per container (view-specific)
export const inboxSortOrder = ydoc.getArray<string>('inboxSortOrder');
export const todaySortOrder = ydoc.getArray<string>('todaySortOrder');
export const anytimeSortOrder = ydoc.getArray<string>('anytimeSortOrder');
export const somedaySortOrder = ydoc.getArray<string>('somedaySortOrder');

// Per-list task sort orders stored as Map<listId, string[]>
export const listTaskSortOrders = ydoc.getMap<string[]>('listTaskSortOrders');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Wait for IndexedDB provider to finish syncing
 * Also waits for Y-Sweet sync if enabled
 */
export const waitForSync = async (): Promise<void> => {
  // Wait for IndexedDB first (always enabled)
  await new Promise<void>((resolve) => {
    if (provider.synced) {
      resolve();
    } else {
      provider.once('synced', () => resolve());
    }
  });

  // Initialize sync provider if enabled
  if (isSyncEnabled() && !syncProvider) {
    await initializeSync();
  }
};

/**
 * Clear all data (useful for development/migration)
 */
export const clearAllData = (): void => {
  tasksMap.clear();
  listsMap.clear();
  headingsMap.clear();
  tagsMap.clear();
  checklistItemsMap.clear();
  listsSortOrder.delete(0, listsSortOrder.length);
  tagsSortOrder.delete(0, tagsSortOrder.length);
  inboxSortOrder.delete(0, inboxSortOrder.length);
  todaySortOrder.delete(0, todaySortOrder.length);
  anytimeSortOrder.delete(0, anytimeSortOrder.length);
  somedaySortOrder.delete(0, somedaySortOrder.length);
  listTaskSortOrders.clear();
};

/**
 * Get all tasks as an array
 */
export const getAllTasks = (): Task[] => {
  return Array.from(tasksMap.values());
};

/**
 * Get all lists as an array
 */
export const getAllLists = (): List[] => {
  return Array.from(listsMap.values());
};

/**
 * Get all tags as an array
 */
export const getAllTags = (): Tag[] => {
  return Array.from(tagsMap.values());
};

/**
 * Get all headings as an array
 */
export const getAllHeadings = (): Heading[] => {
  return Array.from(headingsMap.values());
};

/**
 * Get all checklist items as an array
 */
export const getAllChecklistItems = (): ChecklistItem[] => {
  return Array.from(checklistItemsMap.values());
};
