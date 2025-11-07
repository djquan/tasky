import type { Task, WhenValue } from '@tasky/shared';
import type { Command } from '../../undo';
import {
  tasksMap,
  inboxSortOrder,
  todaySortOrder,
  anytimeSortOrder,
  somedaySortOrder,
  listTaskSortOrders
} from '../../yjs';
import { now } from '@tasky/shared';

/**
 * Helper to add task to sort order
 */
function addToSortOrder(task: Task): void {
  const id = task.id;

  if (task.listId) {
    const sortOrder = listTaskSortOrders.get(task.listId) || [];
    listTaskSortOrders.set(task.listId, [...sortOrder, id]);
  } else {
    switch (task.when) {
      case 'today':
      case 'evening':
        todaySortOrder.push([id]);
        break;
      case 'anytime':
        anytimeSortOrder.push([id]);
        break;
      case 'someday':
        somedaySortOrder.push([id]);
        break;
    }
  }
}

/**
 * Helper to remove task from sort order
 */
function removeFromSortOrder(task: Task): void {
  const id = task.id;

  if (task.listId) {
    const sortOrder = listTaskSortOrders.get(task.listId) || [];
    const filtered = sortOrder.filter(taskId => taskId !== id);
    listTaskSortOrders.set(task.listId, filtered);
    return;
  }

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
 * Capture current sort order state for a task
 */
function captureSortOrderState(task: Task): {
  listId: string | null;
  when: WhenValue;
  sortOrderArray: string[];
  index: number;
} | null {
  const id = task.id;

  if (task.listId) {
    const sortOrder = listTaskSortOrders.get(task.listId) || [];
    const index = sortOrder.indexOf(id);
    if (index === -1) return null;
    return {
      listId: task.listId,
      when: task.when,
      sortOrderArray: [...sortOrder],
      index
    };
  }

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
      return null;
  }

  const arr = yjsArray.toArray();
  const index = arr.indexOf(id);
  if (index === -1) return null;

  return {
    listId: null,
    when: task.when,
    sortOrderArray: [...arr],
    index
  };
}

/**
 * Restore sort order state
 */
function restoreSortOrderState(
  state: { listId: string | null; when: WhenValue; sortOrderArray: string[]; index: number }
): void {
  if (state.listId) {
    listTaskSortOrders.set(state.listId, state.sortOrderArray);
  } else {
    let yjsArray;
    switch (state.when) {
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

    // Clear and restore
    yjsArray.delete(0, yjsArray.length);
    yjsArray.insert(0, state.sortOrderArray);
  }
}

export class CreateTaskCommand implements Command {
  constructor(private task: Task) {}

  execute(): void {
    tasksMap.set(this.task.id, this.task);
    addToSortOrder(this.task);
  }

  undo(): void {
    removeFromSortOrder(this.task);
    tasksMap.delete(this.task.id);
  }
}

export class UpdateTaskCommand implements Command {
  private oldTask: Task;
  private newTask: Task;
  private oldSortOrderState: ReturnType<typeof captureSortOrderState>;
  private newSortOrderState: ReturnType<typeof captureSortOrderState>;

  constructor(oldTask: Task, updates: Partial<Task>) {
    this.oldTask = { ...oldTask };
    this.newTask = {
      ...oldTask,
      ...updates,
      updatedAt: now()
    };

    // Capture sort order states
    this.oldSortOrderState = captureSortOrderState(oldTask);

    // Check if sort order will change
    const whenChanged = updates.when && updates.when !== oldTask.when;
    const listChanged = updates.listId !== undefined && updates.listId !== oldTask.listId;

    if (whenChanged || listChanged) {
      // Remove from old sort order
      removeFromSortOrder(oldTask);
      // Add to new sort order
      addToSortOrder(this.newTask);
      this.newSortOrderState = captureSortOrderState(this.newTask);
    } else {
      this.newSortOrderState = this.oldSortOrderState;
    }
  }

  execute(): void {
    tasksMap.set(this.newTask.id, this.newTask);
    if (this.newSortOrderState && this.newSortOrderState !== this.oldSortOrderState) {
      restoreSortOrderState(this.newSortOrderState);
    }
  }

  undo(): void {
    tasksMap.set(this.oldTask.id, this.oldTask);
    if (this.oldSortOrderState) {
      restoreSortOrderState(this.oldSortOrderState);
    }
  }
}

export class DeleteTaskCommand implements Command {
  private task: Task;
  private sortOrderState: ReturnType<typeof captureSortOrderState>;

  constructor(task: Task) {
    this.task = { ...task };
    this.sortOrderState = captureSortOrderState(task);
  }

  execute(): void {
    removeFromSortOrder(this.task);
    tasksMap.delete(this.task.id);
  }

  undo(): void {
    tasksMap.set(this.task.id, this.task);
    if (this.sortOrderState) {
      restoreSortOrderState(this.sortOrderState);
    } else {
      addToSortOrder(this.task);
    }
  }
}

export class ToggleTaskCommand implements Command {
  private taskId: string;
  private oldCompleted: boolean;
  private oldCompletedAt: number | null;

  constructor(task: Task) {
    this.taskId = task.id;
    this.oldCompleted = task.completed;
    this.oldCompletedAt = task.completedAt;
  }

  execute(): void {
    const task = tasksMap.get(this.taskId);
    if (!task) return;

    const timestamp = now();
    const updated: Task = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? timestamp : null,
      updatedAt: timestamp
    };
    tasksMap.set(this.taskId, updated);
  }

  undo(): void {
    const task = tasksMap.get(this.taskId);
    if (!task) return;

    const updated: Task = {
      ...task,
      completed: this.oldCompleted,
      completedAt: this.oldCompletedAt,
      updatedAt: now()
    };
    tasksMap.set(this.taskId, updated);
  }
}

export class CancelTaskCommand implements Command {
  private taskId: string;
  private oldCanceled: boolean;
  private oldCompletedAt: number | null;

  constructor(task: Task) {
    this.taskId = task.id;
    this.oldCanceled = task.canceled;
    this.oldCompletedAt = task.completedAt;
  }

  execute(): void {
    const task = tasksMap.get(this.taskId);
    if (!task) return;

    const updated: Task = {
      ...task,
      canceled: true,
      completedAt: now(),
      updatedAt: now()
    };
    tasksMap.set(this.taskId, updated);
  }

  undo(): void {
    const task = tasksMap.get(this.taskId);
    if (!task) return;

    const updated: Task = {
      ...task,
      canceled: this.oldCanceled,
      completedAt: this.oldCompletedAt,
      updatedAt: now()
    };
    tasksMap.set(this.taskId, updated);
  }
}

export class MoveTaskCommand implements Command {
  private taskId: string;
  private oldWhen: WhenValue;
  private oldListId: string | null;
  private oldHeadingId: string | null;
  private newWhen: WhenValue;
  private newListId: string | null;
  private newHeadingId: string | null;
  private oldSortOrderState: ReturnType<typeof captureSortOrderState>;

  constructor(
    task: Task,
    target: { when?: WhenValue; listId?: string | null; headingId?: string | null }
  ) {
    this.taskId = task.id;
    this.oldWhen = task.when;
    this.oldListId = task.listId;
    this.oldHeadingId = task.headingId;
    this.newWhen = target.when ?? task.when;
    this.newListId = target.listId !== undefined ? target.listId : task.listId;
    this.newHeadingId = target.headingId !== undefined ? target.headingId : task.headingId;
    this.oldSortOrderState = captureSortOrderState(task);
  }

  execute(): void {
    const task = tasksMap.get(this.taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      when: this.newWhen,
      listId: this.newListId,
      headingId: this.newHeadingId,
      updatedAt: now()
    };

    // Handle sort order changes
    const whenChanged = this.newWhen !== this.oldWhen;
    const listChanged = this.newListId !== this.oldListId;

    if (whenChanged || listChanged) {
      removeFromSortOrder(task);
      addToSortOrder(updatedTask);
    }

    tasksMap.set(this.taskId, updatedTask);
  }

  undo(): void {
    const task = tasksMap.get(this.taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      when: this.oldWhen,
      listId: this.oldListId,
      headingId: this.oldHeadingId,
      updatedAt: now()
    };

    // Restore sort order
    if (this.oldSortOrderState) {
      restoreSortOrderState(this.oldSortOrderState);
    }

    tasksMap.set(this.taskId, updatedTask);
  }
}

export class ReorderTaskCommand implements Command {
  private taskId: string;
  private newIndex: number;
  private listId: string | null;
  private when: WhenValue;
  private oldSortOrderArray: string[];

  constructor(task: Task, newIndex: number) {
    this.taskId = task.id;
    this.listId = task.listId;
    this.when = task.when;

    // Capture current sort order
    const sortOrderState = captureSortOrderState(task);
    if (!sortOrderState) {
      throw new Error('Task not found in sort order');
    }

    this.newIndex = newIndex;
    this.oldSortOrderArray = [...sortOrderState.sortOrderArray];
  }

  execute(): void {
    if (this.listId) {
      const sortOrder = listTaskSortOrders.get(this.listId) || [];
      const currentIndex = sortOrder.indexOf(this.taskId);
      if (currentIndex === -1) return;

      const newArray = [...sortOrder];
      newArray.splice(currentIndex, 1);
      newArray.splice(this.newIndex, 0, this.taskId);
      listTaskSortOrders.set(this.listId, newArray);
    } else {
      let yjsArray;
      switch (this.when) {
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
      const currentIndex = arr.indexOf(this.taskId);
      if (currentIndex === -1) return;

      yjsArray.delete(currentIndex, 1);
      yjsArray.insert(this.newIndex, [this.taskId]);
    }
  }

  undo(): void {
    if (this.listId) {
      listTaskSortOrders.set(this.listId, this.oldSortOrderArray);
    } else {
      let yjsArray;
      switch (this.when) {
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

      yjsArray.delete(0, yjsArray.length);
      yjsArray.insert(0, this.oldSortOrderArray);
    }
  }
}

