import { generateId, now, type List, type ListInput, type ListType } from '@tasky/shared';
import { listsMap, listsSortOrder, listTaskSortOrders } from './yjs';

/**
 * Create a new list (project or area)
 */
export function createList(input: Partial<ListInput>): List {
  const id = generateId();
  const timestamp = now();

  const list: List = {
    id,
    type: input.type || 'project',
    title: input.title || '',
    notes: input.notes || '',
    when: input.when || 'anytime',
    scheduledDate: input.scheduledDate ?? null,
    deadline: input.deadline ?? null,
    parentListId: input.parentListId ?? null,
    tags: input.tags || [],
    completed: input.completed || false,
    canceled: input.canceled || false,
    createdAt: timestamp,
    completedAt: null,
    updatedAt: timestamp,
    sortOrder: input.sortOrder || timestamp
  };

  listsMap.set(id, list);
  listsSortOrder.push([id]);

  // Initialize empty task sort order for this list
  listTaskSortOrders.set(id, []);

  return list;
}

/**
 * Get a list by ID
 */
export function getList(id: string): List | undefined {
  return listsMap.get(id);
}

/**
 * Update a list
 */
export function updateList(id: string, updates: Partial<List>): void {
  const list = listsMap.get(id);
  if (!list) {
    console.warn(`[updateList] List not found: ${id}`);
    return;
  }

  const updated: List = {
    ...list,
    ...updates,
    updatedAt: now()
  };

  listsMap.set(id, updated);
}

/**
 * Delete a list and all its tasks
 */
export function deleteList(id: string): void {
  const list = listsMap.get(id);
  if (!list) {
    console.warn(`[deleteList] List not found: ${id}`);
    return;
  }

  // Remove from sort order
  const sortArray = listsSortOrder.toArray();
  const index = sortArray.indexOf(id);
  if (index !== -1) {
    listsSortOrder.delete(index, 1);
  }

  // Remove task sort order
  listTaskSortOrders.delete(id);

  // Delete the list
  listsMap.delete(id);

  // Note: Tasks with this listId will need to be handled separately
  // by the caller (either deleted or moved to inbox)
}

/**
 * Complete a list
 */
export function completeList(id: string): void {
  const list = listsMap.get(id);
  if (!list) {
    console.warn(`[completeList] List not found: ${id}`);
    return;
  }

  const timestamp = now();
  const updated: List = {
    ...list,
    completed: true,
    completedAt: timestamp,
    updatedAt: timestamp
  };

  listsMap.set(id, updated);
}

/**
 * Cancel a list
 */
export function cancelList(id: string): void {
  const list = listsMap.get(id);
  if (!list) {
    console.warn(`[cancelList] List not found: ${id}`);
    return;
  }

  const timestamp = now();
  const updated: List = {
    ...list,
    canceled: true,
    completedAt: timestamp,
    updatedAt: timestamp
  };

  listsMap.set(id, updated);
}

// ============================================================================
// Convenience functions for specific list types
// ============================================================================

/**
 * Create a new project (convenience wrapper)
 */
export function createProject(input: Partial<Omit<ListInput, 'type'>>) {
  return createList({ ...input, type: 'project' });
}

/**
 * Create a new area (convenience wrapper)
 */
export function createArea(input: Partial<Omit<ListInput, 'type'>>) {
  return createList({ ...input, type: 'area' });
}

/**
 * Get all lists of a specific type
 */
export function getListsByType(type: ListType): List[] {
  return Array.from(listsMap.values()).filter(list => list.type === type);
}

/**
 * Get all projects
 */
export function getAllProjects(): List[] {
  return getListsByType('project');
}

/**
 * Get all areas
 */
export function getAllAreas(): List[] {
  return getListsByType('area');
}
