import { generateId, now, type ChecklistItem, type ChecklistItemInput } from '@tasky/shared';
import { checklistItemsMap } from './yjs';

/**
 * Create a new checklist item
 */
export function createChecklistItem(input: Partial<ChecklistItemInput>): ChecklistItem {
  const id = generateId();
  const timestamp = now();

  const item: ChecklistItem = {
    id,
    taskId: input.taskId || '',
    title: input.title || '',
    completed: input.completed || false,
    canceled: input.canceled || false,
    createdAt: timestamp,
    updatedAt: timestamp,
    sortOrder: input.sortOrder || timestamp
  };

  checklistItemsMap.set(id, item);

  return item;
}

/**
 * Get a checklist item by ID
 */
export function getChecklistItem(id: string): ChecklistItem | undefined {
  return checklistItemsMap.get(id);
}

/**
 * Get all checklist items for a task
 */
export function getTaskChecklistItems(taskId: string): ChecklistItem[] {
  const items = Array.from(checklistItemsMap.values());
  return items
    .filter(item => item.taskId === taskId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Update a checklist item
 */
export function updateChecklistItem(id: string, updates: Partial<ChecklistItem>): void {
  const item = checklistItemsMap.get(id);
  if (!item) {
    console.warn(`[updateChecklistItem] Checklist item not found: ${id}`);
    return;
  }

  const updated: ChecklistItem = {
    ...item,
    ...updates,
    updatedAt: now()
  };

  checklistItemsMap.set(id, updated);
}

/**
 * Toggle checklist item completion
 */
export function toggleChecklistItem(id: string): void {
  const item = checklistItemsMap.get(id);
  if (!item) {
    console.warn(`[toggleChecklistItem] Checklist item not found: ${id}`);
    return;
  }

  const updated: ChecklistItem = {
    ...item,
    completed: !item.completed,
    updatedAt: now()
  };

  checklistItemsMap.set(id, updated);
}

/**
 * Delete a checklist item
 */
export function deleteChecklistItem(id: string): void {
  checklistItemsMap.delete(id);
}

/**
 * Cancel a checklist item
 */
export function cancelChecklistItem(id: string): void {
  const item = checklistItemsMap.get(id);
  if (!item) {
    console.warn(`[cancelChecklistItem] Checklist item not found: ${id}`);
    return;
  }

  const updated: ChecklistItem = {
    ...item,
    canceled: true,
    updatedAt: now()
  };

  checklistItemsMap.set(id, updated);
}
