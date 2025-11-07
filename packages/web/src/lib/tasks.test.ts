import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Task, TaskInput } from '@tasky/shared';
import * as tasks from './tasks';

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

    it('should add task to sort order for list', () => {
      const task = tasks.createTask({ listId: 'list-1', when: 'anytime' });
      const sortOrder = mockListTaskSortOrders.get('list-1');
      expect(sortOrder).toContain(task.id);
    });

    it('should add task to today sort order when when=today', () => {
      const task = tasks.createTask({ when: 'today' });
      expect(mockTodaySortOrder).toContain(task.id);
    });

    it('should add task to anytime sort order when when=anytime', () => {
      const task = tasks.createTask({ when: 'anytime' });
      expect(mockAnytimeSortOrder).toContain(task.id);
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

    it('should handle sort order changes when when changes', () => {
      const task = tasks.createTask({ when: 'anytime' });
      expect(mockAnytimeSortOrder).toContain(task.id);
      
      tasks.updateTask(task.id, { when: 'today' });
      
      expect(mockAnytimeSortOrder).not.toContain(task.id);
      expect(mockTodaySortOrder).toContain(task.id);
    });

    it('should handle sort order changes when listId changes', () => {
      const task = tasks.createTask({ when: 'anytime' });
      expect(mockAnytimeSortOrder).toContain(task.id);
      
      tasks.updateTask(task.id, { listId: 'list-1' });
      
      expect(mockAnytimeSortOrder).not.toContain(task.id);
      const listOrder = mockListTaskSortOrders.get('list-1');
      expect(listOrder).toContain(task.id);
    });

    it('should warn when task not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      tasks.updateTask('non-existent', { title: 'Updated' });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Task not found'));
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

    it('should remove task from sort order', () => {
      const task = tasks.createTask({ when: 'today' });
      expect(mockTodaySortOrder).toContain(task.id);
      
      tasks.deleteTask(task.id);
      
      expect(mockTodaySortOrder).not.toContain(task.id);
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
    it('should reorder task within list', () => {
      const task1 = tasks.createTask({ listId: 'list-1' });
      const task2 = tasks.createTask({ listId: 'list-1' });
      tasks.createTask({ listId: 'list-1' });
      
      const initialOrder = mockListTaskSortOrders.get('list-1') || [];
      expect(initialOrder.indexOf(task1.id)).toBeLessThan(initialOrder.indexOf(task2.id));
      
      // Move task2 to index 0
      tasks.reorderTask(task2.id, 0);
      
      const newOrder = mockListTaskSortOrders.get('list-1') || [];
      expect(newOrder[0]).toBe(task2.id);
    });

    it('should reorder task within when-based container', () => {
      tasks.createTask({ when: 'today' });
      const task2 = tasks.createTask({ when: 'today' });
      
      const initialIndex = mockTodaySortOrder.indexOf(task2.id);
      expect(initialIndex).toBeGreaterThan(-1);
      
      // Move to beginning
      tasks.reorderTask(task2.id, 0);
      
      expect(mockTodaySortOrder[0]).toBe(task2.id);
    });

    it('should do nothing if task not found', () => {
      tasks.reorderTask('non-existent', 0);
      // Should not throw
    });
  });
});
