import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChecklistItem, ChecklistItemInput } from '@tasky/shared';
import * as checklists from './checklists';
import { undoManager } from './undo';

// Mock yjs module
const mockChecklistItemsMap = new Map<string, ChecklistItem>();

vi.mock('./yjs', () => ({
  checklistItemsMap: {
    get: (id: string) => mockChecklistItemsMap.get(id),
    set: (id: string, item: ChecklistItem) => {
      mockChecklistItemsMap.set(id, item);
    },
    delete: (id: string) => {
      mockChecklistItemsMap.delete(id);
    },
    values: () => mockChecklistItemsMap.values(),
  },
}));

describe('checklists.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChecklistItemsMap.clear();
  });

  describe('createChecklistItem', () => {
    it('should create a checklist item with default values', () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1' });
      
      expect(item).toBeDefined();
      expect(item.id).toBeTruthy();
      expect(item.taskId).toBe('task-1');
      expect(item.title).toBe('');
      expect(item.completed).toBe(false);
      expect(item.canceled).toBe(false);
      expect(item.createdAt).toBeGreaterThan(0);
      expect(item.updatedAt).toBeGreaterThan(0);
      expect(item.sortOrder).toBeGreaterThan(0);
    });

    it('should create a checklist item with provided values', () => {
      const input: Partial<ChecklistItemInput> = {
        taskId: 'task-1',
        title: 'Test Item',
        completed: true,
        canceled: false,
        sortOrder: 5000,
      };

      const item = checklists.createChecklistItem(input);
      
      expect(item.title).toBe('Test Item');
      expect(item.completed).toBe(true);
      expect(item.sortOrder).toBe(5000);
    });
  });

  describe('getChecklistItem', () => {
    it('should return checklist item by ID', () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1', title: 'Test' });
      const retrieved = checklists.getChecklistItem(item.id);
      
      expect(retrieved).toEqual(item);
    });

    it('should return undefined for non-existent item', () => {
      const retrieved = checklists.getChecklistItem('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getTaskChecklistItems', () => {
    it('should return checklist items for a specific task', () => {
      const item1 = checklists.createChecklistItem({ taskId: 'task-1', title: 'Item 1' });
      const item2 = checklists.createChecklistItem({ taskId: 'task-1', title: 'Item 2' });
      const otherItem = checklists.createChecklistItem({ taskId: 'task-2', title: 'Other' });
      
      const taskItems = checklists.getTaskChecklistItems('task-1');
      
      expect(taskItems).toHaveLength(2);
      expect(taskItems.map(i => i.id)).toContain(item1.id);
      expect(taskItems.map(i => i.id)).toContain(item2.id);
      expect(taskItems.map(i => i.id)).not.toContain(otherItem.id);
    });

    it('should sort by sortOrder', () => {
      checklists.createChecklistItem({ taskId: 'task-1', sortOrder: 300 });
      checklists.createChecklistItem({ taskId: 'task-1', sortOrder: 100 });
      checklists.createChecklistItem({ taskId: 'task-1', sortOrder: 200 });
      
      const taskItems = checklists.getTaskChecklistItems('task-1');
      
      expect(taskItems[0].sortOrder).toBe(100);
      expect(taskItems[1].sortOrder).toBe(200);
      expect(taskItems[2].sortOrder).toBe(300);
    });
  });

  describe('updateChecklistItem', () => {
    it('should update checklist item properties', async () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1', title: 'Original' });
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay to ensure timestamp difference
      checklists.updateChecklistItem(item.id, { title: 'Updated' });
      
      const updated = checklists.getChecklistItem(item.id);
      expect(updated?.title).toBe('Updated');
      expect(updated?.updatedAt).toBeGreaterThan(item.updatedAt);
    });

    it('should warn when item not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      checklists.updateChecklistItem('non-existent', { title: 'Updated' });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Checklist item not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('toggleChecklistItem', () => {
    it('should toggle completion status', () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1', completed: false });
      checklists.toggleChecklistItem(item.id);
      
      const updated = checklists.getChecklistItem(item.id);
      expect(updated?.completed).toBe(true);
    });

    it('should uncomplete a completed item', () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1', completed: true });
      checklists.toggleChecklistItem(item.id);
      
      const updated = checklists.getChecklistItem(item.id);
      expect(updated?.completed).toBe(false);
    });

    it('should warn when item not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      checklists.toggleChecklistItem('non-existent');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Checklist item not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('deleteChecklistItem', () => {
    it('should delete a checklist item', () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1', title: 'To Delete' });
      checklists.deleteChecklistItem(item.id);
      
      const retrieved = checklists.getChecklistItem(item.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('cancelChecklistItem', () => {
    it('should cancel a checklist item', async () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1', canceled: false });
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay to ensure timestamp difference
      checklists.cancelChecklistItem(item.id);
      
      const updated = checklists.getChecklistItem(item.id);
      expect(updated?.canceled).toBe(true);
      expect(updated?.updatedAt).toBeGreaterThan(item.updatedAt);
    });

    it('should warn when item not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      checklists.cancelChecklistItem('non-existent');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Checklist item not found'));
      consoleSpy.mockRestore();
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

    it('should undo checklist item creation', () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1', title: 'Test Item' });
      expect(checklists.getChecklistItem(item.id)).toBeDefined();
      expect(undoManager.canUndo()).toBe(true);

      undoManager.undo();
      expect(checklists.getChecklistItem(item.id)).toBeUndefined();
      expect(undoManager.canRedo()).toBe(true);
    });

    it('should undo checklist item update', () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1', title: 'Original' });
      checklists.updateChecklistItem(item.id, { title: 'Updated' });
      expect(checklists.getChecklistItem(item.id)?.title).toBe('Updated');

      undoManager.undo();
      expect(checklists.getChecklistItem(item.id)?.title).toBe('Original');
    });

    it('should undo checklist item deletion', () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1', title: 'Test Item' });
      checklists.deleteChecklistItem(item.id);
      expect(checklists.getChecklistItem(item.id)).toBeUndefined();

      undoManager.undo();
      expect(checklists.getChecklistItem(item.id)).toBeDefined();
      expect(checklists.getChecklistItem(item.id)?.title).toBe('Test Item');
    });

    it('should undo checklist item toggle', () => {
      const item = checklists.createChecklistItem({ taskId: 'task-1', completed: false });
      checklists.toggleChecklistItem(item.id);
      expect(checklists.getChecklistItem(item.id)?.completed).toBe(true);

      undoManager.undo();
      expect(checklists.getChecklistItem(item.id)?.completed).toBe(false);
    });
  });
});
