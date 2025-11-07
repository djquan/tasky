import { generateId, now, type ChecklistItem, type ChecklistItemInput } from '@tasky/shared';
import { checklistItemsMap } from './yjs';
import { undoManager } from './undo';
import {
  CreateChecklistItemCommand,
  UpdateChecklistItemCommand,
  DeleteChecklistItemCommand,
  ToggleChecklistItemCommand
} from './undo/commands/checklist';

/**
 * Internal implementation - create checklist item without undo tracking
 */
function _createChecklistItemInternal(input: Partial<ChecklistItemInput>): ChecklistItem {
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
 * Create a new checklist item
 */
export function createChecklistItem(input: Partial<ChecklistItemInput>): ChecklistItem {
  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    return _createChecklistItemInternal(input);
  }

  // Create item object but don't add to map yet - command will do that
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

  const command = new CreateChecklistItemCommand(item);
  undoManager.execute(command);
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
 * Internal implementation - update checklist item without undo tracking
 */
function _updateChecklistItemInternal(id: string, updates: Partial<ChecklistItem>): void {
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
 * Update a checklist item
 */
export function updateChecklistItem(id: string, updates: Partial<ChecklistItem>): void {
  const item = checklistItemsMap.get(id);
  if (!item) {
    console.warn(`[updateChecklistItem] Checklist item not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _updateChecklistItemInternal(id, updates);
    return;
  }

  const oldItem = { ...item };
  const command = new UpdateChecklistItemCommand(oldItem, updates);
  undoManager.execute(command);
}

/**
 * Internal implementation - toggle checklist item without undo tracking
 */
function _toggleChecklistItemInternal(id: string): void {
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
 * Toggle checklist item completion
 */
export function toggleChecklistItem(id: string): void {
  const item = checklistItemsMap.get(id);
  if (!item) {
    console.warn(`[toggleChecklistItem] Checklist item not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _toggleChecklistItemInternal(id);
    return;
  }

  const command = new ToggleChecklistItemCommand(item);
  undoManager.execute(command);
}

/**
 * Internal implementation - delete checklist item without undo tracking
 */
function _deleteChecklistItemInternal(id: string): void {
  checklistItemsMap.delete(id);
}

/**
 * Delete a checklist item
 */
export function deleteChecklistItem(id: string): void {
  const item = checklistItemsMap.get(id);
  if (!item) {
    console.warn(`[deleteChecklistItem] Checklist item not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _deleteChecklistItemInternal(id);
    return;
  }

  const command = new DeleteChecklistItemCommand(item);
  undoManager.execute(command);
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
