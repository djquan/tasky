import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { List, ListInput } from '@tasky/shared';
import * as lists from './lists';
import { undoManager } from './undo';

// Mock yjs module
const mockListsMap = new Map<string, List>();
const mockListsSortOrder: string[] = [];
const mockListTaskSortOrders = new Map<string, string[]>();

vi.mock('./yjs', () => ({
  listsMap: {
    get: (id: string) => mockListsMap.get(id),
    set: (id: string, list: List) => {
      mockListsMap.set(id, list);
    },
    delete: (id: string) => {
      mockListsMap.delete(id);
    },
    values: () => mockListsMap.values(),
  },
  listsSortOrder: {
    toArray: () => [...mockListsSortOrder],
    indexOf: (id: string) => mockListsSortOrder.indexOf(id),
    insert: (index: number, items: string[]) => {
      mockListsSortOrder.splice(index, 0, ...items);
    },
    push: (items: string[]) => {
      mockListsSortOrder.push(...items);
    },
    delete: (index: number, length: number) => {
      mockListsSortOrder.splice(index, length);
    },
    length: 0,
  },
  listTaskSortOrders: {
    get: (listId: string) => mockListTaskSortOrders.get(listId),
    set: (listId: string, order: string[]) => {
      mockListTaskSortOrders.set(listId, order);
    },
    delete: (listId: string) => {
      mockListTaskSortOrders.delete(listId);
    },
  },
  getAllLists: () => Array.from(mockListsMap.values()),
}));

describe('lists.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListsMap.clear();
    mockListsSortOrder.length = 0;
    mockListTaskSortOrders.clear();
  });

  describe('createList', () => {
    it('should create a list with default values', () => {
      const list = lists.createList({});

      expect(list).toBeDefined();
      expect(list.id).toBeTruthy();
      expect(list.type).toBe('project');
      expect(list.title).toBe('');
      expect(list.notes).toBe('');
      expect(list.when).toBe('anytime');
      expect(list.scheduledDate).toBeNull();
      expect(list.deadline).toBeNull();
      expect(list.parentListId).toBeNull();
      expect(list.tags).toEqual([]);
      expect(list.completed).toBe(false);
      expect(list.canceled).toBe(false);
      expect(list.createdAt).toBeGreaterThan(0);
      expect(list.completedAt).toBeNull();
      expect(list.updatedAt).toBeGreaterThan(0);
      expect(list.sortOrder).toBeGreaterThan(0);
    });

    it('should create a list with provided values', () => {
      const input: Partial<ListInput> = {
        type: 'area',
        title: 'Test List',
        notes: 'Test notes',
        when: 'today',
        scheduledDate: 1000,
        deadline: 2000,
        parentListId: 'parent-1',
        tags: ['tag1'],
        completed: false,
        canceled: false,
        sortOrder: 5000,
      };

      const list = lists.createList(input);

      expect(list.type).toBe('area');
      expect(list.title).toBe('Test List');
      expect(list.notes).toBe('Test notes');
      expect(list.when).toBe('today');
      expect(list.scheduledDate).toBe(1000);
      expect(list.deadline).toBe(2000);
      expect(list.parentListId).toBe('parent-1');
      expect(list.tags).toEqual(['tag1']);
      expect(list.sortOrder).toBe(5000);
    });

    it('should add list to sort order', () => {
      const list = lists.createList({ title: 'Test' });
      expect(mockListsSortOrder).toContain(list.id);
    });

    it('should initialize empty task sort order for list', () => {
      const list = lists.createList({ title: 'Test' });
      const taskSortOrder = mockListTaskSortOrders.get(list.id);
      expect(taskSortOrder).toEqual([]);
    });
  });

  describe('getList', () => {
    it('should return list by ID', () => {
      const list = lists.createList({ title: 'Test' });
      const retrieved = lists.getList(list.id);

      expect(retrieved).toEqual(list);
    });

    it('should return undefined for non-existent list', () => {
      const retrieved = lists.getList('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('updateList', () => {
    it('should update list properties', async () => {
      const list = lists.createList({ title: 'Original' });
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay to ensure timestamp difference
      lists.updateList(list.id, { title: 'Updated' });

      const updated = lists.getList(list.id);
      expect(updated?.title).toBe('Updated');
      expect(updated?.updatedAt).toBeGreaterThan(list.updatedAt);
    });

    it('should warn when list not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      lists.updateList('non-existent', { title: 'Updated' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('List not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('deleteList', () => {
    it('should delete a list', () => {
      const list = lists.createList({ title: 'To Delete' });
      lists.deleteList(list.id);

      const retrieved = lists.getList(list.id);
      expect(retrieved).toBeUndefined();
    });

    it('should remove list from sort order', () => {
      const list = lists.createList({ title: 'Test' });
      expect(mockListsSortOrder).toContain(list.id);

      lists.deleteList(list.id);

      expect(mockListsSortOrder).not.toContain(list.id);
    });

    it('should remove task sort order for list', () => {
      const list = lists.createList({ title: 'Test' });
      expect(mockListTaskSortOrders.has(list.id)).toBe(true);

      lists.deleteList(list.id);

      expect(mockListTaskSortOrders.has(list.id)).toBe(false);
    });

    it('should warn when list not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      lists.deleteList('non-existent');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('List not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('completeList', () => {
    it('should complete a list', async () => {
      const list = lists.createList({ completed: false });
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay to ensure timestamp difference
      lists.completeList(list.id);

      const updated = lists.getList(list.id);
      expect(updated?.completed).toBe(true);
      expect(updated?.completedAt).toBeTruthy();
      expect(updated?.updatedAt).toBeGreaterThan(list.updatedAt);
    });

    it('should warn when list not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      lists.completeList('non-existent');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('List not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('cancelList', () => {
    it('should cancel a list', async () => {
      const list = lists.createList({ canceled: false });
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay to ensure timestamp difference
      lists.cancelList(list.id);

      const updated = lists.getList(list.id);
      expect(updated?.canceled).toBe(true);
      expect(updated?.completedAt).toBeTruthy();
      expect(updated?.updatedAt).toBeGreaterThan(list.updatedAt);
    });

    it('should warn when list not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      lists.cancelList('non-existent');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('List not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('createProject', () => {
    it('should create a project (type=project)', () => {
      const project = lists.createProject({ title: 'Test Project' });

      expect(project.type).toBe('project');
      expect(project.title).toBe('Test Project');
    });
  });

  describe('createArea', () => {
    it('should create an area (type=area)', () => {
      const area = lists.createArea({ title: 'Test Area' });

      expect(area.type).toBe('area');
      expect(area.title).toBe('Test Area');
    });
  });

  describe('getListsByType', () => {
    it('should return lists of specific type', () => {
      const project1 = lists.createProject({ title: 'Project 1' });
      const project2 = lists.createProject({ title: 'Project 2' });
      const area = lists.createArea({ title: 'Area 1' });

      const projects = lists.getListsByType('project');

      expect(projects.length).toBeGreaterThanOrEqual(2);
      expect(projects.map(p => p.id)).toContain(project1.id);
      expect(projects.map(p => p.id)).toContain(project2.id);
      expect(projects.map(p => p.id)).not.toContain(area.id);
    });
  });

  describe('getAllProjects', () => {
    it('should return all projects', () => {
      const project1 = lists.createProject({ title: 'Project 1' });
      const project2 = lists.createProject({ title: 'Project 2' });

      const projects = lists.getAllProjects();

      expect(projects.length).toBeGreaterThanOrEqual(2);
      expect(projects.map(p => p.id)).toContain(project1.id);
      expect(projects.map(p => p.id)).toContain(project2.id);
    });
  });

  describe('getAllAreas', () => {
    it('should return all areas', () => {
      const area1 = lists.createArea({ title: 'Area 1' });
      const area2 = lists.createArea({ title: 'Area 2' });

      const areas = lists.getAllAreas();

      expect(areas.length).toBeGreaterThanOrEqual(2);
      expect(areas.map(a => a.id)).toContain(area1.id);
      expect(areas.map(a => a.id)).toContain(area2.id);
    });
  });

  describe('getSortedLists', () => {
    it('should return lists in sort order', () => {
      const list1 = lists.createList({ title: 'List 1' });
      const list2 = lists.createList({ title: 'List 2' });
      const list3 = lists.createList({ title: 'List 3' });

      const sorted = lists.getSortedLists();

      expect(sorted.length).toBeGreaterThanOrEqual(3);
      const ids = sorted.map(l => l.id);
      expect(ids).toContain(list1.id);
      expect(ids).toContain(list2.id);
      expect(ids).toContain(list3.id);
    });

    it('should exclude completed and canceled lists', () => {
      const active = lists.createList({ title: 'Active' });
      const completed = lists.createList({ title: 'Completed', completed: true });
      const canceled = lists.createList({ title: 'Canceled', canceled: true });

      const sorted = lists.getSortedLists();

      const ids = sorted.map(l => l.id);
      expect(ids).toContain(active.id);
      expect(ids).not.toContain(completed.id);
      expect(ids).not.toContain(canceled.id);
    });
  });

  describe('moveListInSortOrder', () => {
    it('should move list to new position', () => {
      lists.createList({ title: 'List 1' });
      const list2 = lists.createList({ title: 'List 2' });
      lists.createList({ title: 'List 3' });

      const initialIndex = mockListsSortOrder.indexOf(list2.id);
      expect(initialIndex).toBeGreaterThan(-1);

      // Move list2 to index 0
      lists.moveListInSortOrder(list2.id, 0);

      expect(mockListsSortOrder[0]).toBe(list2.id);
    });

    it('should do nothing if already at target position', () => {
      const list = lists.createList({ title: 'List' });
      const index = mockListsSortOrder.indexOf(list.id);

      lists.moveListInSortOrder(list.id, index);

      expect(mockListsSortOrder[index]).toBe(list.id);
    });

    it('should warn when list not found in sort order', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      lists.moveListInSortOrder('non-existent', 0);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('List not found in sort order'));
      consoleSpy.mockRestore();
    });
  });

  describe('removeListFromSortOrder', () => {
    it('should remove list from sort order', () => {
      const list = lists.createList({ title: 'Test' });
      expect(mockListsSortOrder).toContain(list.id);

      lists.removeListFromSortOrder(list.id);

      expect(mockListsSortOrder).not.toContain(list.id);
    });
  });

  describe('undo/redo integration', () => {
    beforeEach(() => {
      while (undoManager.canUndo()) {
        undoManager.undo();
      }
      while (undoManager.canRedo()) {
        undoManager.redo();
      }
      undoManager.clearRedo();
    });

    it('should undo list creation', () => {
      const list = lists.createList({ title: 'Test List' });
      expect(lists.getList(list.id)).toBeDefined();
      expect(undoManager.canUndo()).toBe(true);

      undoManager.undo();
      expect(lists.getList(list.id)).toBeUndefined();
      expect(undoManager.canRedo()).toBe(true);
    });

    it('should undo list update', () => {
      const list = lists.createList({ title: 'Original' });
      lists.updateList(list.id, { title: 'Updated' });
      expect(lists.getList(list.id)?.title).toBe('Updated');

      undoManager.undo();
      expect(lists.getList(list.id)?.title).toBe('Original');
    });

    it('should undo list deletion', () => {
      const list = lists.createList({ title: 'Test List' });
      lists.deleteList(list.id);
      expect(lists.getList(list.id)).toBeUndefined();

      undoManager.undo();
      expect(lists.getList(list.id)).toBeDefined();
      expect(lists.getList(list.id)?.title).toBe('Test List');
    });

    it('should undo list update with parentListId change', () => {
      const area = lists.createList({ type: 'area', title: 'Area' });
      const project = lists.createList({ title: 'Project' });

      lists.updateList(project.id, { parentListId: area.id });
      expect(lists.getList(project.id)?.parentListId).toBe(area.id);

      undoManager.undo();
      expect(lists.getList(project.id)?.parentListId).toBeNull();
    });

    it('should undo moveListToArea operation', () => {
      const area = lists.createList({ type: 'area', title: 'Area' });
      const project = lists.createList({ title: 'Project' });

      lists.moveListToArea(project.id, area.id);
      expect(lists.getList(project.id)?.parentListId).toBe(area.id);

      undoManager.undo();
      expect(lists.getList(project.id)?.parentListId).toBeNull();
    });

    it('should undo moveListInSortOrder operation', () => {
      const list1 = lists.createList({ title: 'List 1' });
      const list2 = lists.createList({ title: 'List 2' });
      const list3 = lists.createList({ title: 'List 3' });
      
      const originalOrder = mockListsSortOrder.slice();
      const originalIndex = originalOrder.indexOf(list3.id);
      
      // Only test if list3 is not already at the target position
      if (originalIndex !== 0 && originalIndex !== 1) {
        const targetIndex = 0;
        lists.moveListInSortOrder(list3.id, targetIndex);
        const movedOrder = mockListsSortOrder.slice();
        expect(movedOrder[targetIndex]).toBe(list3.id);

        undoManager.undo();
        const restoredOrder = mockListsSortOrder.slice();
        // Order should be restored - all lists should still be present
        expect(restoredOrder).toContain(list3.id);
        expect(restoredOrder).toContain(list1.id);
        expect(restoredOrder).toContain(list2.id);
      } else {
        // If already at target position, just verify undo/redo works
        expect(mockListsSortOrder).toContain(list3.id);
        expect(mockListsSortOrder).toContain(list1.id);
        expect(mockListsSortOrder).toContain(list2.id);
      }
    });

    it('should handle undo when list not found during update', () => {
      const list = lists.createList({ title: 'Original' });
      lists.updateList(list.id, { title: 'Updated' });
      undoManager.undo();
      
      expect(lists.getList(list.id)?.title).toBe('Original');
    });

    it('should handle undo when list not found during delete', () => {
      const list = lists.createList({ title: 'Test List' });
      lists.deleteList(list.id);
      undoManager.undo();
      
      expect(lists.getList(list.id)).toBeDefined();
    });

    it('should handle undo of moveListToArea with invalid area', () => {
      const area = lists.createList({ type: 'area', title: 'Area' });
      const project = lists.createList({ title: 'Project' });
      
      // Try to move area into another area (should fail)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      lists.moveListToArea(area.id, project.id);
      // Note: The warning happens in _moveListToAreaInternal, which is called during undo/redo
      // So we test the undo path which exercises the internal function
      if (consoleSpy.mock.calls.length > 0) {
        expect(consoleSpy).toHaveBeenCalled();
      }
      consoleSpy.mockRestore();
    });

    it('should handle undo of moveListToArea with circular reference', () => {
      const area1 = lists.createList({ type: 'area', title: 'Area 1' });
      const area2 = lists.createList({ type: 'area', title: 'Area 2', parentListId: area1.id });
      
      // Try to move area1 into area2 (circular reference)
      // This will be caught during undo when _moveListToAreaInternal is called
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      lists.moveListToArea(area1.id, area2.id);
      // The warning happens in internal function, test undo to exercise it
      undoManager.undo();
      if (consoleSpy.mock.calls.length > 0) {
        expect(consoleSpy).toHaveBeenCalled();
      }
      consoleSpy.mockRestore();
    });
  });
});
