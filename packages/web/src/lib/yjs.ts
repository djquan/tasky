import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import type {
  Task,
  Project,
  Area,
  Heading,
  Tag,
  ChecklistItem
} from '@tasky/shared';

// ============================================================================
// Yjs Document Setup
// ============================================================================

// Create the shared Yjs document
export const ydoc = new Y.Doc();

// Create IndexedDB persistence provider
// Note: Using same DB name 'tasky-db' but schema will be incompatible with old version
export const provider = new IndexeddbPersistence('tasky-db', ydoc);

// ============================================================================
// Entity Maps (Y.Map for key-value storage with CRDT properties)
// ============================================================================

// Tasks stored as Map<id, Task>
export const tasksMap = ydoc.getMap<Task>('tasks');

// Projects stored as Map<id, Project>
export const projectsMap = ydoc.getMap<Project>('projects');

// Areas stored as Map<id, Area>
export const areasMap = ydoc.getMap<Area>('areas');

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
export const areasSortOrder = ydoc.getArray<string>('areasSortOrder');
export const projectsSortOrder = ydoc.getArray<string>('projectsSortOrder');
export const tagsSortOrder = ydoc.getArray<string>('tagsSortOrder');

// Task sort orders per container (view-specific)
export const inboxSortOrder = ydoc.getArray<string>('inboxSortOrder');
export const todaySortOrder = ydoc.getArray<string>('todaySortOrder');
export const anytimeSortOrder = ydoc.getArray<string>('anytimeSortOrder');
export const somedaySortOrder = ydoc.getArray<string>('somedaySortOrder');

// Per-project task sort orders stored as Map<projectId, string[]>
export const projectTaskSortOrders = ydoc.getMap<string[]>('projectTaskSortOrders');

// Per-area task sort orders stored as Map<areaId, string[]>
export const areaTaskSortOrders = ydoc.getMap<string[]>('areaTaskSortOrders');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Wait for IndexedDB provider to finish syncing
 */
export const waitForSync = (): Promise<void> => {
  return new Promise((resolve) => {
    if (provider.synced) {
      resolve();
    } else {
      provider.once('synced', () => resolve());
    }
  });
};

/**
 * Clear all data (useful for development/migration)
 */
export const clearAllData = (): void => {
  tasksMap.clear();
  projectsMap.clear();
  areasMap.clear();
  headingsMap.clear();
  tagsMap.clear();
  checklistItemsMap.clear();
  areasSortOrder.delete(0, areasSortOrder.length);
  projectsSortOrder.delete(0, projectsSortOrder.length);
  tagsSortOrder.delete(0, tagsSortOrder.length);
  inboxSortOrder.delete(0, inboxSortOrder.length);
  todaySortOrder.delete(0, todaySortOrder.length);
  anytimeSortOrder.delete(0, anytimeSortOrder.length);
  somedaySortOrder.delete(0, somedaySortOrder.length);
  projectTaskSortOrders.clear();
  areaTaskSortOrders.clear();
};

/**
 * Get all tasks as an array
 */
export const getAllTasks = (): Task[] => {
  return Array.from(tasksMap.values());
};

/**
 * Get all projects as an array
 */
export const getAllProjects = (): Project[] => {
  return Array.from(projectsMap.values());
};

/**
 * Get all areas as an array
 */
export const getAllAreas = (): Area[] => {
  return Array.from(areasMap.values());
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
