import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Task, TaskInput } from '@tasky/shared';
import * as tasks from './tasks';
import { undoManager } from './undo';

// Mock yjs module
const mockTasksMap = new Map<string, Task>();
const mockInboxSortOrder: string[] = [];
const mockTodaySortOrder: string[] = [];
const mockAnytimeSortOrder: string[] = [];
const mockSomedaySortOrder: string[] = [];
const mockListTaskSortOrders = new Map<string, string[]>();

vi.mock('./yjs', () => ({
  tasksMap: {
    get: (id: string) => mockTasksMap.get(id),
    set: (id: string, task: Task) => {
      mockTasksMap.set(id, task);
    },
    delete: (id: string) => {
      mockTasksMap.delete(id);
    },
    values: () => mockTasksMap.values(),
  },
  inboxSortOrder: {
    push: (items: string[]) => {
      mockInboxSortOrder.push(...items);
    },
    toArray: () => [...mockInboxSortOrder],
    delete: (index: number, length: number) => {
      mockInboxSortOrder.splice(index, length);
    },
    insert: (index: number, items: string[]) => {
      mockInboxSortOrder.splice(index, 0, ...items);
    },
    length: 0,
  },
  todaySortOrder: {
    push: (items: string[]) => {
      mockTodaySortOrder.push(...items);
    },
    toArray: () => [...mockTodaySortOrder],
    delete: (index: number, length: number) => {
      mockTodaySortOrder.splice(index, length);
    },
    insert: (index: number, items: string[]) => {
      mockTodaySortOrder.splice(index, 0, ...items);
    },
    indexOf: (id: string) => mockTodaySortOrder.indexOf(id),
    length: 0,
  },
  anytimeSortOrder: {
    push: (items: string[]) => {
      // Yjs push takes an array and pushes its contents
      mockAnytimeSortOrder.push(...items);
    },
    toArray: () => [...mockAnytimeSortOrder],
    delete: (index: number, length: number) => {
      mockAnytimeSortOrder.splice(index, length);
    },
    insert: (index: number, items: string[]) => {
      mockAnytimeSortOrder.splice(index, 0, ...items);
    },
    indexOf: (id: string) => mockAnytimeSortOrder.indexOf(id),
    length: 0,
  },
  somedaySortOrder: {
    push: (items: string[]) => {
      mockSomedaySortOrder.push(...items);
    },
    toArray: () => [...mockSomedaySortOrder],
    delete: (index: number, length: number) => {
      mockSomedaySortOrder.splice(index, length);
    },
    insert: (index: number, items: string[]) => {
      mockSomedaySortOrder.splice(index, 0, ...items);
    },
    indexOf: (id: string) => mockSomedaySortOrder.indexOf(id),
    length: 0,
  },
  listTaskSortOrders: {
    get: (listId: string) => mockListTaskSortOrders.get(listId),
    set: (listId: string, order: string[]) => {
      mockListTaskSortOrders.set(listId, order);
    },
  },
}));

describe('tasks.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear maps and arrays
    mockTasksMap.clear();
    mockInboxSortOrder.length = 0;
    mockTodaySortOrder.length = 0;
    mockAnytimeSortOrder.length = 0;
    mockSomedaySortOrder.length = 0;
    mockListTaskSortOrders.clear();
  });

  describe('createTask', () => {
    it('should create a task with default values', () => {
      const task = tasks.createTask({});
      
      expect(task).toBeDefined();
      expect(task.id).toBeTruthy();
      expect(task.title).toBe('');
      expect(task.notes).toBe('');
      expect(task.when).toBe('anytime');
      expect(task.scheduledDate).toBeNull();
      expect(task.deadline).toBeNull();
      expect(task.tags).toEqual([]);
      expect(task.checklistItems).toEqual([]);
      expect(task.listId).toBeNull();
      expect(task.headingId).toBeNull();
      expect(task.completed).toBe(false);
      expect(task.canceled).toBe(false);
      expect(task.createdAt).toBeGreaterThan(0);
      expect(task.completedAt).toBeNull();
      expect(task.updatedAt).toBeGreaterThan(0);
      expect(task.sortOrder).toBeGreaterThan(0);
    });

    it('should create a task with provided values', () => {
      const input: Partial<TaskInput> = {
        title: 'Test Task',
        notes: 'Test notes',
        when: 'today',
        scheduledDate: 1000,
        deadline: 2000,
        tags: ['tag1'],
        checklistItems: ['item1'],
        listId: 'list-1',
        headingId: 'heading-1',
        completed: false,
        canceled: false,
        sortOrder: 5000,
      };

      const task = tasks.createTask(input);
      
      expect(task.title).toBe('Test Task');
      expect(task.notes).toBe('Test notes');
      expect(task.when).toBe('today');
      expect(task.scheduledDate).toBe(1000);
      expect(task.deadline).toBe(2000);
      expect(task.tags).toEqual(['tag1']);
      expect(task.checklistItems).toEqual(['item1']);
      expect(task.listId).toBe('list-1');
      expect(task.headingId).toBe('heading-1');
      expect(task.sortOrder).toBe(5000);
    });

    it('should add task to sort order for list', async () => {
      const task = tasks.createTask({ listId: 'list-1', when: 'anytime' });
      const yjs = await import('./yjs');
      const sortOrder = yjs.listTaskSortOrders.get('list-1');
      expect(sortOrder).toContain(task.id);
    });

    it('should add task to today sort order when when=today', async () => {
      const task = tasks.createTask({ when: 'today' });
      const yjs = await import('./yjs');
      expect(yjs.todaySortOrder.toArray()).toContain(task.id);
    });

    it('should add task to anytime sort order when when=anytime', async () => {
      const task = tasks.createTask({ when: 'anytime' });
      const yjs = await import('./yjs');
      expect(yjs.anytimeSortOrder.toArray()).toContain(task.id);
    });
  });

  describe('getTask', () => {
    it('should return task by ID', () => {
      const task = tasks.createTask({ title: 'Test' });
      const retrieved = tasks.getTask(task.id);
      
      expect(retrieved).toEqual(task);
    });

    it('should return undefined for non-existent task', () => {
      const retrieved = tasks.getTask('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    it('should update task properties', async () => {
      const task = tasks.createTask({ title: 'Original' });
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay to ensure timestamp difference
      tasks.updateTask(task.id, { title: 'Updated' });
      
      const updated = tasks.getTask(task.id);
      expect(updated?.title).toBe('Updated');
      expect(updated?.updatedAt).toBeGreaterThan(task.updatedAt);
    });

    it('should handle sort order changes when when changes', async () => {
      const task = tasks.createTask({ when: 'anytime' });
      const yjs = await import('./yjs');
      expect(yjs.anytimeSortOrder.toArray()).toContain(task.id);
      
      tasks.updateTask(task.id, { when: 'today' });
      
      expect(yjs.anytimeSortOrder.toArray()).not.toContain(task.id);
      expect(yjs.todaySortOrder.toArray()).toContain(task.id);
    });

    it('should handle sort order changes when listId changes', async () => {
      const task = tasks.createTask({ when: 'anytime' });
      const yjs = await import('./yjs');
      expect(yjs.anytimeSortOrder.toArray()).toContain(task.id);
      
      tasks.updateTask(task.id, { listId: 'list-1' });
      
      expect(yjs.anytimeSortOrder.toArray()).not.toContain(task.id);
      const listOrder = yjs.listTaskSortOrders.get('list-1');
      expect(listOrder).toContain(task.id);
    });

    it('should log error when task not found', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      tasks.updateTask('non-existent', { title: 'Updated' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', () => {
      const task = tasks.createTask({ title: 'To Delete' });
      tasks.deleteTask(task.id);
      
      const retrieved = tasks.getTask(task.id);
      expect(retrieved).toBeUndefined();
    });

    it('should remove task from sort order', async () => {
      const task = tasks.createTask({ when: 'today' });
      const yjs = await import('./yjs');
      expect(yjs.todaySortOrder.toArray()).toContain(task.id);
      
      tasks.deleteTask(task.id);
      
      expect(yjs.todaySortOrder.toArray()).not.toContain(task.id);
    });

    it('should warn when task not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      tasks.deleteTask('non-existent');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Task not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('toggleTask', () => {
    it('should toggle completion status', () => {
      const task = tasks.createTask({ completed: false });
      tasks.toggleTask(task.id);
      
      const updated = tasks.getTask(task.id);
      expect(updated?.completed).toBe(true);
      expect(updated?.completedAt).toBeTruthy();
    });

    it('should uncomplete a completed task', () => {
      const task = tasks.createTask({ completed: true });
      tasks.toggleTask(task.id);
      
      const updated = tasks.getTask(task.id);
      expect(updated?.completed).toBe(false);
      expect(updated?.completedAt).toBeNull();
    });

    it('should handle recurring tasks completion', async () => {
      const task = tasks.createTask({
        title: 'Recurring Task',
        completed: false,
        recurrenceRule: { frequency: 'daily', interval: 1 },
        scheduledDate: Date.now()
      });
      
      // Verify initial state
      expect(task.recurrenceRule).toBeDefined();
      
      // Complete the task
      tasks.toggleTask(task.id);
      
      // Check if current task is completed
      const completedTask = tasks.getTask(task.id);
      expect(completedTask?.completed).toBe(true);
      expect(completedTask?.completedAt).toBeTruthy();
      
      // Verify a new task was created
      const allTasks = Array.from(mockTasksMap.values());
      const nextTask = allTasks.find(t => t.id !== task.id && t.title === 'Recurring Task');
      
      expect(nextTask).toBeDefined();
      expect(nextTask?.completed).toBe(false);
      expect(nextTask?.recurrenceSeriesId).toBe(task.id); // Or however series ID is initialized
      expect(nextTask?.scheduledDate).toBeGreaterThan(task.scheduledDate || 0);
    });

    it('should undo recurring task completion', () => {
      const task = tasks.createTask({
        title: 'Recurring Task Undo',
        completed: false,
        recurrenceRule: { frequency: 'daily', interval: 1 },
        scheduledDate: Date.now()
      });
      
      // Complete
      tasks.toggleTask(task.id);
      
      // Verify new task exists
      const allTasksBeforeUndo = Array.from(mockTasksMap.values());
      expect(allTasksBeforeUndo.length).toBe(2); // Original + Next
      
      // Undo
      undoManager.undo();
      
      // Verify state restored
      const originalTask = tasks.getTask(task.id);
      expect(originalTask?.completed).toBe(false);
      
      const allTasksAfterUndo = Array.from(mockTasksMap.values());
      expect(allTasksAfterUndo.length).toBe(1); // Only original remains
      expect(allTasksAfterUndo[0].id).toBe(task.id);
    });

    it('should warn when task not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      tasks.toggleTask('non-existent');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Task not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('moveTask', () => {
    it('should move task to different when value', () => {
      const task = tasks.createTask({ when: 'anytime' });
      tasks.moveTask(task.id, { when: 'today' });
      
      const updated = tasks.getTask(task.id);
      expect(updated?.when).toBe('today');
    });

    it('should move task to different list', () => {
      const task = tasks.createTask({ listId: 'list-1' });
      tasks.moveTask(task.id, { listId: 'list-2' });
      
      const updated = tasks.getTask(task.id);
      expect(updated?.listId).toBe('list-2');
    });

    it('should move task to null listId (inbox)', () => {
      const task = tasks.createTask({ listId: 'list-1' });
      tasks.moveTask(task.id, { listId: null });
      
      const updated = tasks.getTask(task.id);
      expect(updated?.listId).toBeNull();
    });
  });

  describe('cancelTask', () => {
    it('should cancel a task', () => {
      const task = tasks.createTask({ canceled: false });
      tasks.cancelTask(task.id);
      
      const updated = tasks.getTask(task.id);
      expect(updated?.canceled).toBe(true);
      expect(updated?.completedAt).toBeTruthy();
    });

    it('should warn when task not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      tasks.cancelTask('non-existent');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Task not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('reorderTask', () => {
    it('should reorder task within list', async () => {
      const task1 = tasks.createTask({ listId: 'list-1' });
      const task2 = tasks.createTask({ listId: 'list-1' });
      tasks.createTask({ listId: 'list-1' });
      const yjs = await import('./yjs');
      
      const initialOrder = yjs.listTaskSortOrders.get('list-1') || [];
      expect(initialOrder.indexOf(task1.id)).toBeLessThan(initialOrder.indexOf(task2.id));
      
      // Move task2 to index 0
      tasks.reorderTask(task2.id, 0);
      
      const newOrder = yjs.listTaskSortOrders.get('list-1') || [];
      expect(newOrder[0]).toBe(task2.id);
    });

    it('should reorder task within when-based container', async () => {
      tasks.createTask({ when: 'today' });
      const task2 = tasks.createTask({ when: 'today' });
      const yjs = await import('./yjs');
      
      const initialIndex = yjs.todaySortOrder.toArray().indexOf(task2.id);
      expect(initialIndex).toBeGreaterThan(-1);
      
      // Move to beginning
      tasks.reorderTask(task2.id, 0);
      
      expect(yjs.todaySortOrder.toArray()[0]).toBe(task2.id);
    });

    it('should do nothing if task not found', () => {
      tasks.reorderTask('non-existent', 0);
      // Should not throw
    });
  });

  describe('undo/redo integration', () => {
    beforeEach(() => {
      // Clear undo/redo stacks before each test
      while (undoManager.canUndo()) {
        undoManager.undo();
      }
      while (undoManager.canRedo()) {
        undoManager.redo();
      }
      undoManager.clearRedo();
    });

    it('should undo task creation', () => {
      const task = tasks.createTask({ title: 'Test Task' });
      expect(tasks.getTask(task.id)).toBeDefined();
      expect(undoManager.canUndo()).toBe(true);

      undoManager.undo();
      expect(tasks.getTask(task.id)).toBeUndefined();
      expect(undoManager.canRedo()).toBe(true);
    });

    it('should redo task creation', () => {
      const task = tasks.createTask({ title: 'Test Task' });
      undoManager.undo();
      expect(tasks.getTask(task.id)).toBeUndefined();

      undoManager.redo();
      expect(tasks.getTask(task.id)).toBeDefined();
      expect(tasks.getTask(task.id)?.title).toBe('Test Task');
    });

    it('should undo task update', () => {
      const task = tasks.createTask({ title: 'Original' });
      tasks.updateTask(task.id, { title: 'Updated' });
      expect(tasks.getTask(task.id)?.title).toBe('Updated');

      undoManager.undo();
      expect(tasks.getTask(task.id)?.title).toBe('Original');
    });

    it('should undo task deletion', () => {
      const task = tasks.createTask({ title: 'Test Task' });
      tasks.deleteTask(task.id);
      expect(tasks.getTask(task.id)).toBeUndefined();

      undoManager.undo();
      expect(tasks.getTask(task.id)).toBeDefined();
      expect(tasks.getTask(task.id)?.title).toBe('Test Task');
    });

    it('should undo task toggle', () => {
      const task = tasks.createTask({ completed: false });
      tasks.toggleTask(task.id);
      expect(tasks.getTask(task.id)?.completed).toBe(true);

      undoManager.undo();
      expect(tasks.getTask(task.id)?.completed).toBe(false);
    });

    it('should undo task move', () => {
      const task = tasks.createTask({ listId: 'list-1' });
      tasks.moveTask(task.id, { listId: 'list-2' });
      expect(tasks.getTask(task.id)?.listId).toBe('list-2');

      undoManager.undo();
      expect(tasks.getTask(task.id)?.listId).toBe('list-1');
    });

    it('should undo task cancel', () => {
      const task = tasks.createTask({ canceled: false });
      tasks.cancelTask(task.id);
      expect(tasks.getTask(task.id)?.canceled).toBe(true);

      undoManager.undo();
      expect(tasks.getTask(task.id)?.canceled).toBe(false);
    });

    it('should support multiple undo operations', () => {
      const task1 = tasks.createTask({ title: 'Task 1' });
      const task2 = tasks.createTask({ title: 'Task 2' });
      const task3 = tasks.createTask({ title: 'Task 3' });

      expect(tasks.getTask(task1.id)).toBeDefined();
      expect(tasks.getTask(task2.id)).toBeDefined();
      expect(tasks.getTask(task3.id)).toBeDefined();

      undoManager.undo();
      expect(tasks.getTask(task3.id)).toBeUndefined();
      expect(tasks.getTask(task2.id)).toBeDefined();

      undoManager.undo();
      expect(tasks.getTask(task2.id)).toBeUndefined();
      expect(tasks.getTask(task1.id)).toBeDefined();

      undoManager.undo();
      expect(tasks.getTask(task1.id)).toBeUndefined();
    });

    it('should clear redo stack when new operation occurs', () => {
      tasks.createTask({ title: 'Task 1' });
      undoManager.undo();
      expect(undoManager.canRedo()).toBe(true);

      tasks.createTask({ title: 'Task 2' });
      expect(undoManager.canRedo()).toBe(false);
      expect(undoManager.canUndo()).toBe(true);
    });

    it('should handle undo with sort order changes', () => {
      const task = tasks.createTask({ when: 'anytime' });
      tasks.updateTask(task.id, { when: 'today' });
      expect(tasks.getTask(task.id)?.when).toBe('today');

      undoManager.undo();
      expect(tasks.getTask(task.id)?.when).toBe('anytime');
    });

    it('should handle undo with list changes', () => {
      const task = tasks.createTask({ listId: 'list-1' });
      tasks.updateTask(task.id, { listId: 'list-2' });
      expect(tasks.getTask(task.id)?.listId).toBe('list-2');

      undoManager.undo();
      expect(tasks.getTask(task.id)?.listId).toBe('list-1');
    });

    it('should handle undo of reorder operation', async () => {
      // Clear any existing tasks for this list first
      const yjs = await import('./yjs');
      const existingOrder = yjs.listTaskSortOrders.get('list-1') || [];
      existingOrder.forEach(taskId => {
        if (mockTasksMap.has(taskId)) {
          mockTasksMap.delete(taskId);
        }
      });
      yjs.listTaskSortOrders.set('list-1', []);

      const task1 = tasks.createTask({ listId: 'list-1' });
      const task2 = tasks.createTask({ listId: 'list-1' });
      
      const originalOrder = yjs.listTaskSortOrders.get('list-1') || [];
      expect(originalOrder.length).toBe(2);
      expect(originalOrder).toContain(task1.id);
      expect(originalOrder).toContain(task2.id);
      
      // Move task2 to index 0
      tasks.reorderTask(task2.id, 0);
      const reordered = yjs.listTaskSortOrders.get('list-1') || [];
      expect(reordered[0]).toBe(task2.id);
      expect(reordered.length).toBe(2);

      undoManager.undo();
      const restoredOrder = yjs.listTaskSortOrders.get('list-1') || [];
      // Order should be restored - both tasks should still be present
      expect(restoredOrder).toContain(task1.id);
      expect(restoredOrder).toContain(task2.id);
      expect(restoredOrder.length).toBe(2);
    });

    it('should handle undo of task update with when change', () => {
      const task = tasks.createTask({ when: 'anytime' });
      tasks.updateTask(task.id, { when: 'someday' });
      expect(tasks.getTask(task.id)?.when).toBe('someday');

      undoManager.undo();
      expect(tasks.getTask(task.id)?.when).toBe('anytime');
    });

    it('should handle undo of task update with both when and listId change', () => {
      const task = tasks.createTask({ when: 'anytime', listId: null });
      tasks.updateTask(task.id, { when: 'today', listId: 'list-1' });
      expect(tasks.getTask(task.id)?.when).toBe('today');
      expect(tasks.getTask(task.id)?.listId).toBe('list-1');

      undoManager.undo();
      expect(tasks.getTask(task.id)?.when).toBe('anytime');
      expect(tasks.getTask(task.id)?.listId).toBeNull();
    });

    it('should handle undo of reorder for task in when-based container', async () => {
      const task1 = tasks.createTask({ when: 'today' });
      const task2 = tasks.createTask({ when: 'today' });
      const yjs = await import('./yjs');
      
      const originalOrder = yjs.todaySortOrder.toArray();
      expect(originalOrder).toContain(task1.id);
      expect(originalOrder).toContain(task2.id);
      
      tasks.reorderTask(task2.id, 0);
      const reordered = yjs.todaySortOrder.toArray();
      expect(reordered[0]).toBe(task2.id);

      undoManager.undo();
      const restoredOrder = yjs.todaySortOrder.toArray();
      expect(restoredOrder).toContain(task1.id);
      expect(restoredOrder).toContain(task2.id);
    });

    it('should handle undo when task not found during update', () => {
      const task = tasks.createTask({ title: 'Original' });
      tasks.updateTask(task.id, { title: 'Updated' });
      undoManager.undo();
      
      expect(tasks.getTask(task.id)?.title).toBe('Original');
    });

    it('should handle undo when task not found during delete', () => {
      const task = tasks.createTask({ title: 'Test Task' });
      tasks.deleteTask(task.id);
      undoManager.undo();
      
      expect(tasks.getTask(task.id)).toBeDefined();
    });

    it('should handle undo when task not found during toggle', () => {
      const task = tasks.createTask({ completed: false });
      tasks.toggleTask(task.id);
      undoManager.undo();
      
      expect(tasks.getTask(task.id)?.completed).toBe(false);
    });

    it('should handle undo when task not found during cancel', () => {
      const task = tasks.createTask({ canceled: false });
      tasks.cancelTask(task.id);
      undoManager.undo();
      
      expect(tasks.getTask(task.id)?.canceled).toBe(false);
    });
  });
});
