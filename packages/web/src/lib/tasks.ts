import { generateId, now, type Task, type TaskInput, type WhenValue } from '@tasky/shared';
import {
  tasksMap,
  inboxSortOrder,
  todaySortOrder,
  anytimeSortOrder,
  somedaySortOrder,
  listTaskSortOrders
} from './yjs';
import { undoManager } from './undo';
import {
  CreateTaskCommand,
  UpdateTaskCommand,
  DeleteTaskCommand,
  ToggleTaskCommand,
  CancelTaskCommand,
  MoveTaskCommand,
  ReorderTaskCommand
} from './undo/commands/task';

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Internal implementation - create task without undo tracking
 */
function _createTaskInternal(input: Partial<TaskInput>): Task {
  const id = generateId();
  const timestamp = now();

  const task: Task = {
    id,
    title: input.title || '',
    notes: input.notes || '',
    when: input.when || 'anytime',  // Default to anytime (not inbox - inbox is dynamic)
    scheduledDate: input.scheduledDate ?? null,
    deadline: input.deadline ?? null,
    tags: input.tags || [],
    checklistItems: input.checklistItems || [],
    listId: input.listId ?? null,
    headingId: input.headingId ?? null,
    completed: input.completed || false,
    canceled: input.canceled || false,
    createdAt: timestamp,
    completedAt: null,
    updatedAt: timestamp,
    sortOrder: input.sortOrder || timestamp
  };

  tasksMap.set(id, task);

  // Add to appropriate sort order array
  addToSortOrder(task);

  return task;
}

/**
 * Create a new task
 */
export function createTask(input: Partial<TaskInput>): Task {
  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    return _createTaskInternal(input);
  }

  // Create task object but don't add to map yet - command will do that
  const id = generateId();
  const timestamp = now();
  const task: Task = {
    id,
    title: input.title || '',
    notes: input.notes || '',
    when: input.when || 'anytime',
    scheduledDate: input.scheduledDate ?? null,
    deadline: input.deadline ?? null,
    tags: input.tags || [],
    checklistItems: input.checklistItems || [],
    listId: input.listId ?? null,
    headingId: input.headingId ?? null,
    completed: input.completed || false,
    canceled: input.canceled || false,
    createdAt: timestamp,
    completedAt: null,
    updatedAt: timestamp,
    sortOrder: input.sortOrder || timestamp
  };

  const command = new CreateTaskCommand(task);
  undoManager.execute(command);
  return task;
}

/**
 * Get a task by ID
 */
export function getTask(id: string): Task | undefined {
  return tasksMap.get(id);
}

/**
 * Internal implementation - update task without undo tracking
 */
function _updateTaskInternal(id: string, updates: Partial<Task>): void {
  const task = tasksMap.get(id);
  if (!task) {
    console.warn(`[updateTask] Task not found: ${id}`);
    return;
  }

  const oldWhen = task.when;
  const oldListId = task.listId;

  const updatedTask: Task = {
    ...task,
    ...updates,
    updatedAt: now()
  };

  tasksMap.set(id, updatedTask);

  // Handle sort order changes if container changed
  const whenChanged = updates.when && updates.when !== oldWhen;
  const listChanged = updates.listId !== undefined && updates.listId !== oldListId;

  if (whenChanged || listChanged) {
    removeFromSortOrder(task);
    addToSortOrder(updatedTask);
  }
}

/**
 * Update a task
 */
export function updateTask(id: string, updates: Partial<Task>): void {
  const task = tasksMap.get(id);
  if (!task) {
    console.warn(`[updateTask] Task not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _updateTaskInternal(id, updates);
    return;
  }

  const oldTask = { ...task };
  const command = new UpdateTaskCommand(oldTask, updates);
  undoManager.execute(command);
}

/**
 * Internal implementation - delete task without undo tracking
 */
function _deleteTaskInternal(id: string): void {
  const task = tasksMap.get(id);
  if (!task) {
    console.warn(`[deleteTask] Task not found: ${id}`);
    return;
  }

  removeFromSortOrder(task);
  tasksMap.delete(id);
}

/**
 * Delete a task
 */
export function deleteTask(id: string): void {
  const task = tasksMap.get(id);
  if (!task) {
    console.warn(`[deleteTask] Task not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _deleteTaskInternal(id);
    return;
  }

  const command = new DeleteTaskCommand(task);
  undoManager.execute(command);
}

/**
 * Internal implementation - toggle task without undo tracking
 */
function _toggleTaskInternal(id: string): void {
  const task = tasksMap.get(id);
  if (!task) {
    console.warn(`[toggleTask] Task not found: ${id}`);
    return;
  }

  const timestamp = now();
  const updated: Task = {
    ...task,
    completed: !task.completed,
    completedAt: !task.completed ? timestamp : null,
    updatedAt: timestamp
  };

  tasksMap.set(id, updated);
}

/**
 * Toggle task completion
 */
export function toggleTask(id: string): void {
  const task = tasksMap.get(id);
  if (!task) {
    console.warn(`[toggleTask] Task not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _toggleTaskInternal(id);
    return;
  }

  const command = new ToggleTaskCommand(task);
  undoManager.execute(command);
}

/**
 * Move task to a different container (when/list)
 */
export function moveTask(
  id: string,
  target: {
    when?: WhenValue;
    listId?: string | null;
    headingId?: string | null;
  }
): void {
  const task = tasksMap.get(id);
  if (!task) {
    console.warn(`[moveTask] Task not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _updateTaskInternal(id, target);
    return;
  }

  const command = new MoveTaskCommand(task, target);
  undoManager.execute(command);
}

/**
 * Internal implementation - cancel task without undo tracking
 */
function _cancelTaskInternal(id: string): void {
  const task = tasksMap.get(id);
  if (!task) {
    console.warn(`[cancelTask] Task not found: ${id}`);
    return;
  }

  const updated: Task = {
    ...task,
    canceled: true,
    completedAt: now(),
    updatedAt: now()
  };

  tasksMap.set(id, updated);
}

/**
 * Cancel a task (soft delete)
 */
export function cancelTask(id: string): void {
  const task = tasksMap.get(id);
  if (!task) {
    console.warn(`[cancelTask] Task not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _cancelTaskInternal(id);
    return;
  }

  const command = new CancelTaskCommand(task);
  undoManager.execute(command);
}

// ============================================================================
// Sort Order Management
// ============================================================================

/**
 * Add task ID to appropriate sort order array
 */
function addToSortOrder(task: Task): void {
  const id = task.id;

  // Priority: list > when
  if (task.listId) {
    const sortOrder = listTaskSortOrders.get(task.listId) || [];
    listTaskSortOrders.set(task.listId, [...sortOrder, id]);
  } else {
    // Add to appropriate when-based sort order
    switch (task.when) {
      case 'today':
      case 'evening':
        todaySortOrder.push([id]);
        break;
      case 'anytime':
        // All anytime tasks without listId go to anytimeSortOrder
        // The distinction between inbox and anytime views is handled by filter functions
        anytimeSortOrder.push([id]);
        break;
      case 'someday':
        somedaySortOrder.push([id]);
        break;
    }
  }
}

/**
 * Remove task ID from its current sort order array
 */
function removeFromSortOrder(task: Task): void {
  const id = task.id;

  // Try list sort order
  if (task.listId) {
    const sortOrder = listTaskSortOrders.get(task.listId) || [];
    const filtered = sortOrder.filter(taskId => taskId !== id);
    listTaskSortOrders.set(task.listId, filtered);
    return;
  }

  // Remove from all when-based sort orders
  const arrays = [inboxSortOrder, todaySortOrder, anytimeSortOrder, somedaySortOrder];

  for (const arr of arrays) {
    const index = arr.toArray().indexOf(id);
    if (index !== -1) {
      arr.delete(index, 1);
      return;
    }
  }
}

/**
 * Internal implementation - reorder task without undo tracking
 */
function _reorderTaskInternal(id: string, newIndex: number): void {
  const task = tasksMap.get(id);
  if (!task) return;

  // Get appropriate sort order array
  let sortOrderArray: string[] | undefined;

  if (task.listId) {
    sortOrderArray = listTaskSortOrders.get(task.listId);
  } else {
    // Handle when-based reordering
    let yjsArray;
    switch (task.when) {
      case 'today':
      case 'evening':
        yjsArray = todaySortOrder;
        break;
      case 'anytime':
        yjsArray = anytimeSortOrder;
        break;
      case 'someday':
        yjsArray = somedaySortOrder;
        break;
      default:
        return;
    }

    const arr = yjsArray.toArray();
    const currentIndex = arr.indexOf(id);
    if (currentIndex === -1) return;

    yjsArray.delete(currentIndex, 1);
    yjsArray.insert(newIndex, [id]);
    return;
  }

  if (!sortOrderArray) return;

  // Reorder in map-based sort order
  const currentIndex = sortOrderArray.indexOf(id);
  if (currentIndex === -1) return;

  const newArray = [...sortOrderArray];
  newArray.splice(currentIndex, 1);
  newArray.splice(newIndex, 0, id);

  if (task.listId) {
    listTaskSortOrders.set(task.listId, newArray);
  }
}

/**
 * Reorder task within its container
 */
export function reorderTask(id: string, newIndex: number): void {
  const task = tasksMap.get(id);
  if (!task) return;

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _reorderTaskInternal(id, newIndex);
    return;
  }

  try {
    const command = new ReorderTaskCommand(task, newIndex);
    undoManager.execute(command);
  } catch {
    // If command creation fails (e.g., task not in sort order), fall back to internal
    _reorderTaskInternal(id, newIndex);
  }
}
