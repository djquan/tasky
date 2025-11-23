import {
  generateId,
  now,
  type Task,
  type TaskInput,
  type WhenValue,
  INPUT_LIMITS,
  sanitizeInput,
  getNextOccurrenceTimestamp
} from '@tasky/shared';
import {
  tasksMap,
  todaySortOrder,
  anytimeSortOrder,
  somedaySortOrder,
  listTaskSortOrders
} from './yjs';
import { undoManager } from './undo';
import { addToSortOrder, removeFromSortOrder } from './sortOrderUtils';
import { handleOperationError } from './errorHandler';
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

  // Sanitize and validate inputs
  const title = sanitizeInput(input.title || '').slice(0, INPUT_LIMITS.TASK_TITLE);
  const notes = sanitizeInput(input.notes || '').slice(0, INPUT_LIMITS.TASK_NOTES);

  const task: Task = {
    id,
    title,
    notes,
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
    sortOrder: input.sortOrder || timestamp,
    recurrenceRule: input.recurrenceRule ?? null,
    recurrenceSeriesId: input.recurrenceSeriesId ?? null,
    recurrenceInstance: input.recurrenceInstance ?? null
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

  // Sanitize and validate inputs
  const title = sanitizeInput(input.title || '').slice(0, INPUT_LIMITS.TASK_TITLE);
  const notes = sanitizeInput(input.notes || '').slice(0, INPUT_LIMITS.TASK_NOTES);

  // Create task object but don't add to map yet - command will do that
  const id = generateId();
  const timestamp = now();
  const task: Task = {
    id,
    title,
    notes,
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
    sortOrder: input.sortOrder || timestamp,
    recurrenceRule: input.recurrenceRule ?? null,
    recurrenceSeriesId: input.recurrenceSeriesId ?? null,
    recurrenceInstance: input.recurrenceInstance ?? null
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
    handleOperationError('updateTask', new Error(`Task not found: ${id}`), {
      entityType: 'task',
      entityId: id,
    });
    return;
  }

  const oldWhen = task.when;
  const oldListId = task.listId;

  // Sanitize and validate string inputs if provided
  const sanitizedUpdates = { ...updates };
  if (updates.title !== undefined) {
    sanitizedUpdates.title = sanitizeInput(updates.title).slice(0, INPUT_LIMITS.TASK_TITLE);
  }
  if (updates.notes !== undefined) {
    sanitizedUpdates.notes = sanitizeInput(updates.notes).slice(0, INPUT_LIMITS.TASK_NOTES);
  }

  // Auto-initialize recurrence series if adding recurrence for the first time
  if (updates.recurrenceRule && !task.recurrenceRule) {
    sanitizedUpdates.recurrenceSeriesId = task.recurrenceSeriesId ?? task.id;
    sanitizedUpdates.recurrenceInstance = task.recurrenceInstance ?? 1;
  }

  const updatedTask: Task = {
    ...task,
    ...sanitizedUpdates,
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
    handleOperationError('updateTask', new Error(`Task not found: ${id}`), {
      entityType: 'task',
      entityId: id,
    });
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _updateTaskInternal(id, updates);
    return;
  }

  // Sanitize and validate string inputs if provided
  const sanitizedUpdates = { ...updates };
  if (updates.title !== undefined) {
    sanitizedUpdates.title = sanitizeInput(updates.title).slice(0, INPUT_LIMITS.TASK_TITLE);
  }
  if (updates.notes !== undefined) {
    sanitizedUpdates.notes = sanitizeInput(updates.notes).slice(0, INPUT_LIMITS.TASK_NOTES);
  }

  // Auto-initialize recurrence series if adding recurrence for the first time
  if (updates.recurrenceRule && !task.recurrenceRule) {
    sanitizedUpdates.recurrenceSeriesId = task.recurrenceSeriesId ?? task.id;
    sanitizedUpdates.recurrenceInstance = task.recurrenceInstance ?? 1;
  }

  const oldTask = { ...task };
  const command = new UpdateTaskCommand(oldTask, sanitizedUpdates);
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

  // Handle recurring tasks: if completing, check for recurrence
  // Note: We don't track undo for this internal method, so we just do the update.
  if (!task.completed && task.recurrenceRule) {
    // 1. Complete current task
    const completedTask: Task = {
      ...task,
      completed: true,
      completedAt: timestamp,
      updatedAt: timestamp,
      recurrenceSeriesId: task.recurrenceSeriesId ?? task.id,
      recurrenceInstance: task.recurrenceInstance ?? 1
    };
    tasksMap.set(id, completedTask);

    // 2. Calculate next occurrence
    const baseDate = task.scheduledDate ?? task.deadline ?? task.createdAt;
    const nextTs = getNextOccurrenceTimestamp(baseDate, task.recurrenceRule, timestamp);

    if (nextTs !== null) {
      // 3. Create next instance
      const nextId = generateId();
      const nextTask: Task = {
        ...completedTask,
        id: nextId,
        createdAt: timestamp,
        updatedAt: timestamp,
        completed: false,
        completedAt: null,
        scheduledDate: nextTs,
        recurrenceSeriesId: completedTask.recurrenceSeriesId,
        recurrenceInstance: (completedTask.recurrenceInstance ?? 1) + 1,
        sortOrder: timestamp
      };

      tasksMap.set(nextId, nextTask);
      addToSortOrder(nextTask);
    }
    return;
  }

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
// Sort order functions moved to sortOrderUtils.ts for sharing with undo commands

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
