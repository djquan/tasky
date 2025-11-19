import {
  generateId,
  now,
  type List,
  type ListInput,
  type ListType,
  INPUT_LIMITS,
  sanitizeInput
} from '@tasky/shared';
import { listsMap, listsSortOrder, listTaskSortOrders, getAllLists } from './yjs';
import { undoManager } from './undo';
import {
  CreateListCommand,
  UpdateListCommand,
  DeleteListCommand,
  MoveListInSortOrderCommand,
  MoveListToAreaCommand
} from './undo/commands/list';

/**
 * Calculate the insert index for a new list without actually inserting
 */
function calculateListInsertIndex(parentListId: string | null | undefined): number {
  if (parentListId) {
    // Insert after parent area
    const parentIndex = listsSortOrder.toArray().indexOf(parentListId);
    if (parentIndex !== -1) {
      // Find the position after the parent and all its current children
      const sortArray = listsSortOrder.toArray();
      let insertIndex = parentIndex + 1;

      for (let i = parentIndex + 1; i < sortArray.length; i++) {
        const item = listsMap.get(sortArray[i]);
        if (item && item.parentListId === parentListId) {
          insertIndex = i + 1;
        } else {
          break;
        }
      }

      return insertIndex;
    } else {
      // Parent not found in sort order, append
      return listsSortOrder.length;
    }
  } else {
    // Top-level item - append to end
    return listsSortOrder.length;
  }
}

/**
 * Internal implementation - create list without undo tracking
 */
function _createListInternal(input: Partial<ListInput>): { list: List; insertIndex: number } {
  const id = generateId();
  const timestamp = now();

  // Sanitize and validate inputs
  const title = sanitizeInput(input.title || '').slice(0, INPUT_LIMITS.LIST_TITLE);
  const notes = sanitizeInput(input.notes || '').slice(0, INPUT_LIMITS.LIST_NOTES);

  const list: List = {
    id,
    type: input.type || 'project',
    title,
    notes,
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

  // Insert into sort order at appropriate position
  const insertIndex = calculateListInsertIndex(input.parentListId);
  if (input.parentListId) {
    const parentIndex = listsSortOrder.toArray().indexOf(input.parentListId);
    if (parentIndex !== -1) {
      listsSortOrder.insert(insertIndex, [id]);
    } else {
      listsSortOrder.push([id]);
    }
  } else {
    listsSortOrder.push([id]);
  }

  // Initialize empty task sort order for this list
  listTaskSortOrders.set(id, []);

  return { list, insertIndex };
}

/**
 * Create a new list (project or area)
 */
export function createList(input: Partial<ListInput>): List {
  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    return _createListInternal(input).list;
  }

  // Sanitize and validate inputs
  const title = sanitizeInput(input.title || '').slice(0, INPUT_LIMITS.LIST_TITLE);
  const notes = sanitizeInput(input.notes || '').slice(0, INPUT_LIMITS.LIST_NOTES);

  // Create list object but don't add to map yet - command will do that
  const id = generateId();
  const timestamp = now();
  const list: List = {
    id,
    type: input.type || 'project',
    title,
    notes,
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

  const insertIndex = calculateListInsertIndex(input.parentListId);
  const command = new CreateListCommand(list, insertIndex);
  undoManager.execute(command);
  return list;
}

/**
 * Get a list by ID
 */
export function getList(id: string): List | undefined {
  return listsMap.get(id);
}

/**
 * Internal implementation - update list without undo tracking
 */
function _updateListInternal(id: string, updates: Partial<List>): void {
  const list = listsMap.get(id);
  if (!list) {
    console.warn(`[updateList] List not found: ${id}`);
    return;
  }

  // Sanitize and validate string inputs if provided
  const sanitizedUpdates = { ...updates };
  if (updates.title !== undefined) {
    sanitizedUpdates.title = sanitizeInput(updates.title).slice(0, INPUT_LIMITS.LIST_TITLE);
  }
  if (updates.notes !== undefined) {
    sanitizedUpdates.notes = sanitizeInput(updates.notes).slice(0, INPUT_LIMITS.LIST_NOTES);
  }

  const updated: List = {
    ...list,
    ...sanitizedUpdates,
    updatedAt: now()
  };

  listsMap.set(id, updated);

  // If parentListId changed, update sort order
  if (updates.parentListId !== undefined && updates.parentListId !== list.parentListId) {
    _moveListToAreaInternal(id, updates.parentListId);
  }
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

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _updateListInternal(id, updates);
    return;
  }

  // Sanitize and validate string inputs if provided
  const sanitizedUpdates = { ...updates };
  if (updates.title !== undefined) {
    sanitizedUpdates.title = sanitizeInput(updates.title).slice(0, INPUT_LIMITS.LIST_TITLE);
  }
  if (updates.notes !== undefined) {
    sanitizedUpdates.notes = sanitizeInput(updates.notes).slice(0, INPUT_LIMITS.LIST_NOTES);
  }

  const oldList = { ...list };
  const command = new UpdateListCommand(oldList, sanitizedUpdates);
  undoManager.execute(command);
}

/**
 * Internal implementation - delete list without undo tracking
 */
function _deleteListInternal(id: string): void {
  const list = listsMap.get(id);
  if (!list) {
    console.warn(`[deleteList] List not found: ${id}`);
    return;
  }

  // Remove from sort order
  removeListFromSortOrder(id);

  // Remove task sort order
  listTaskSortOrders.delete(id);

  // Delete the list
  listsMap.delete(id);
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

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _deleteListInternal(id);
    return;
  }

  const command = new DeleteListCommand(list);
  undoManager.execute(command);
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

// ============================================================================
// Sort Order Utilities
// ============================================================================

/**
 * Get lists ordered by sort order array, grouped by hierarchy
 * Returns a flat array with areas first, followed by their child projects
 */
export function getSortedLists(): List[] {
  const allLists = getAllLists();
  const activeLists = allLists.filter(list => !list.completed && !list.canceled);
  const sortArray = listsSortOrder.toArray();

  // Create a map for quick lookup
  const listMap = new Map(activeLists.map(list => [list.id, list]));

  // Filter sort array to only include active lists
  const sortedIds = sortArray.filter(id => listMap.has(id));

  // Add any active lists that aren't in sort order (shouldn't happen, but handle gracefully)
  const missingIds = activeLists
    .filter(list => !sortedIds.includes(list.id))
    .map(list => list.id);

  // Combine sorted IDs with missing IDs
  const allSortedIds = [...sortedIds, ...missingIds];

  // Return lists in sort order
  return allSortedIds
    .map(id => listMap.get(id))
    .filter((list): list is List => list !== undefined);
}

/**
 * Get the index of a list in the sort order array
 */
function getListSortIndex(listId: string): number {
  return listsSortOrder.toArray().indexOf(listId);
}

/**
 * Internal implementation - move list in sort order without undo tracking
 */
function _moveListInSortOrderInternal(listId: string, newIndex: number): void {
  const currentIndex = getListSortIndex(listId);
  if (currentIndex === -1) {
    console.warn(`[moveListInSortOrder] List not found in sort order: ${listId}`);
    return;
  }

  // If already at the target position, do nothing
  if (currentIndex === newIndex) {
    return;
  }

  // Remove from current position
  listsSortOrder.delete(currentIndex, 1);

  // Calculate adjusted index after removal
  let adjustedIndex: number;
  if (currentIndex < newIndex) {
    adjustedIndex = newIndex - 1;
  } else {
    adjustedIndex = newIndex;
  }

  // Clamp to valid range
  const maxIndex = listsSortOrder.length;
  adjustedIndex = Math.max(0, Math.min(adjustedIndex, maxIndex));

  // Insert at new position
  listsSortOrder.insert(adjustedIndex, [listId]);
}

/**
 * Move a list to a new position in the sort order array
 * @param listId - ID of the list to move
 * @param newIndex - Target index in the sort order array (before removal)
 */
export function moveListInSortOrder(listId: string, newIndex: number): void {
  const currentIndex = getListSortIndex(listId);
  if (currentIndex === -1) {
    console.warn(`[moveListInSortOrder] List not found in sort order: ${listId}`);
    return;
  }

  if (currentIndex === newIndex) {
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _moveListInSortOrderInternal(listId, newIndex);
    return;
  }

  try {
    const command = new MoveListInSortOrderCommand(listId, newIndex);
    undoManager.execute(command);
  } catch {
    _moveListInSortOrderInternal(listId, newIndex);
  }
}

/**
 * Internal implementation - move list to area without undo tracking
 */
function _moveListToAreaInternal(listId: string, areaId: string | null, targetIndex?: number): void {
  const list = listsMap.get(listId);
  if (!list) {
    console.warn(`[moveListToArea] List not found: ${listId}`);
    return;
  }

  // Prevent invalid operations
  if (list.type === 'area' && areaId !== null) {
    console.warn(`[moveListToArea] Cannot move area into another area`);
    return;
  }

  // Prevent circular references
  if (areaId !== null) {
    const area = listsMap.get(areaId);
    if (!area || area.type !== 'area') {
      console.warn(`[moveListToArea] Invalid area ID: ${areaId}`);
      return;
    }

    // Check for circular reference (area being moved into its own child)
    let currentParentId = area.parentListId;
    while (currentParentId !== null) {
      if (currentParentId === listId) {
        console.warn(`[moveListToArea] Circular reference detected`);
        return;
      }
      const parent = listsMap.get(currentParentId);
      if (!parent) break;
      currentParentId = parent.parentListId;
    }
  }

  // Update parentListId directly (avoid calling updateList to prevent circular dependency)
  const updated: List = {
    ...list,
    parentListId: areaId,
    updatedAt: now()
  };
  listsMap.set(listId, updated);

  // Reposition in sort array
  const currentIndex = getListSortIndex(listId);
  if (currentIndex === -1) {
    console.warn(`[moveListToArea] List not found in sort order: ${listId}`);
    return;
  }

  if (areaId === null) {
    // Moving to top level
    let insertIndex: number;

    if (targetIndex !== undefined) {
      // Use provided target index
      insertIndex = targetIndex;
    } else {
      // Find position after last top-level item
      const sortArray = listsSortOrder.toArray();
      insertIndex = sortArray.length;

      // Find the last top-level item (no parentListId)
      for (let i = sortArray.length - 1; i >= 0; i--) {
        const item = listsMap.get(sortArray[i]);
        if (item && !item.parentListId) {
          insertIndex = i + 1;
          break;
        }
      }
    }

    // Remove from current position and insert at new position
    listsSortOrder.delete(currentIndex, 1);
    const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
    listsSortOrder.insert(adjustedIndex, [listId]);
  } else {
    // Moving into an area - position right after the area
    const areaIndex = getListSortIndex(areaId);
    if (areaIndex === -1) {
      console.warn(`[moveListToArea] Area not found in sort order: ${areaId}`);
      return;
    }

    // Find the position after the area and all its current children
    const sortArray = listsSortOrder.toArray();
    let insertIndex = areaIndex + 1;

    // Find the last child of this area
    for (let i = areaIndex + 1; i < sortArray.length; i++) {
      const item = listsMap.get(sortArray[i]);
      if (item && item.parentListId === areaId) {
        insertIndex = i + 1;
      } else if (item && !item.parentListId) {
        // Hit a top-level item, stop here
        break;
      } else if (item && item.parentListId !== areaId) {
        // Hit an item from a different area, stop here
        break;
      }
    }

    // Remove from current position and insert at new position
    listsSortOrder.delete(currentIndex, 1);
    const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
    listsSortOrder.insert(adjustedIndex, [listId]);
  }
}

/**
 * Move a project into an area (update parentListId and reposition in sort array)
 * @param listId - ID of the list to move
 * @param areaId - ID of the area to move into, or null to move to top level
 * @param targetIndex - Optional target index in sortedLists for positioning (used when un-nesting)
 */
export function moveListToArea(listId: string, areaId: string | null, targetIndex?: number): void {
  const list = listsMap.get(listId);
  if (!list) {
    console.warn(`[moveListToArea] List not found: ${listId}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _moveListToAreaInternal(listId, areaId, targetIndex);
    return;
  }

  const command = new MoveListToAreaCommand(listId, areaId);
  undoManager.execute(command);
}

/**
 * Remove a list from the sort order array
 */
export function removeListFromSortOrder(listId: string): void {
  const index = getListSortIndex(listId);
  if (index !== -1) {
    listsSortOrder.delete(index, 1);
  }
}

/**
 * Ensure sort order integrity - rebuild sort array from existing lists if corrupted
 * This is a migration helper that should be called if sort order gets out of sync
 */
export function ensureSortOrderIntegrity(): void {
  const allLists = getAllLists();
  const activeLists = allLists.filter(list => !list.completed && !list.canceled);
  const sortArray = listsSortOrder.toArray();

  // Check if all active lists are in sort order
  const missingIds = activeLists.filter(list => !sortArray.includes(list.id));
  const orphanedIds = sortArray.filter(id => !activeLists.find(list => list.id === id));

  if (missingIds.length === 0 && orphanedIds.length === 0) {
    return; // Sort order is intact
  }

  // Remove orphaned IDs
  orphanedIds.forEach(id => {
    const index = sortArray.indexOf(id);
    if (index !== -1) {
      listsSortOrder.delete(index, 1);
    }
  });

  // Rebuild sort order: areas first (by creation), then projects grouped by area
  const areas = activeLists.filter(list => list.type === 'area' && !list.parentListId);
  const topLevelProjects = activeLists.filter(list => list.type === 'project' && !list.parentListId);

  // Sort areas and projects by their current position in sort array, or by createdAt
  const sortById = (a: List, b: List) => {
    const aIndex = sortArray.indexOf(a.id);
    const bIndex = sortArray.indexOf(b.id);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.createdAt - b.createdAt;
  };

  const sortedAreas = [...areas].sort(sortById);
  const sortedTopLevelProjects = [...topLevelProjects].sort(sortById);

  // Clear and rebuild
  listsSortOrder.delete(0, listsSortOrder.length);

  // Add areas first
  sortedAreas.forEach(area => {
    listsSortOrder.push([area.id]);

    // Add projects under this area
    const areaProjects = activeLists
      .filter(list => list.type === 'project' && list.parentListId === area.id)
      .sort(sortById);
    areaProjects.forEach(project => {
      listsSortOrder.push([project.id]);
    });
  });

  // Add remaining top-level projects
  sortedTopLevelProjects.forEach(project => {
    listsSortOrder.push([project.id]);
  });
}
