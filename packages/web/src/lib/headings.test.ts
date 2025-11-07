import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Heading, HeadingInput } from '@tasky/shared';
import * as headings from './headings';
import { undoManager } from './undo';

// Mock yjs module
const mockHeadingsMap = new Map<string, Heading>();

vi.mock('./yjs', () => ({
  headingsMap: {
    get: (id: string) => mockHeadingsMap.get(id),
    set: (id: string, heading: Heading) => {
      mockHeadingsMap.set(id, heading);
    },
    delete: (id: string) => {
      mockHeadingsMap.delete(id);
    },
    values: () => mockHeadingsMap.values(),
  },
}));

describe('headings.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeadingsMap.clear();
  });

  describe('createHeading', () => {
    it('should create a heading with default values', () => {
      const heading = headings.createHeading({ listId: 'list-1' });
      
      expect(heading).toBeDefined();
      expect(heading.id).toBeTruthy();
      expect(heading.title).toBe('');
      expect(heading.listId).toBe('list-1');
      expect(heading.archived).toBe(false);
      expect(heading.createdAt).toBeGreaterThan(0);
      expect(heading.updatedAt).toBeGreaterThan(0);
      expect(heading.sortOrder).toBeGreaterThan(0);
    });

    it('should create a heading with provided values', () => {
      const input: Partial<HeadingInput> = {
        title: 'Test Heading',
        listId: 'list-1',
        archived: false,
        sortOrder: 5000,
      };

      const heading = headings.createHeading(input);
      
      expect(heading.title).toBe('Test Heading');
      expect(heading.listId).toBe('list-1');
      expect(heading.sortOrder).toBe(5000);
    });
  });

  describe('getHeading', () => {
    it('should return heading by ID', () => {
      const heading = headings.createHeading({ listId: 'list-1', title: 'Test' });
      const retrieved = headings.getHeading(heading.id);
      
      expect(retrieved).toEqual(heading);
    });

    it('should return undefined for non-existent heading', () => {
      const retrieved = headings.getHeading('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getListHeadings', () => {
    it('should return headings for a specific list', () => {
      const heading1 = headings.createHeading({ listId: 'list-1', title: 'Heading 1' });
      const heading2 = headings.createHeading({ listId: 'list-1', title: 'Heading 2' });
      const otherHeading = headings.createHeading({ listId: 'list-2', title: 'Other' });
      
      const listHeadings = headings.getListHeadings('list-1');
      
      expect(listHeadings).toHaveLength(2);
      expect(listHeadings.map(h => h.id)).toContain(heading1.id);
      expect(listHeadings.map(h => h.id)).toContain(heading2.id);
      expect(listHeadings.map(h => h.id)).not.toContain(otherHeading.id);
    });

    it('should exclude archived headings', () => {
      const active = headings.createHeading({ listId: 'list-1', title: 'Active' });
      headings.createHeading({ listId: 'list-1', title: 'Archived', archived: true });
      
      const listHeadings = headings.getListHeadings('list-1');
      
      expect(listHeadings).toHaveLength(1);
      expect(listHeadings[0].id).toBe(active.id);
    });

    it('should sort by sortOrder', () => {
      headings.createHeading({ listId: 'list-1', sortOrder: 300 });
      headings.createHeading({ listId: 'list-1', sortOrder: 100 });
      headings.createHeading({ listId: 'list-1', sortOrder: 200 });
      
      const listHeadings = headings.getListHeadings('list-1');
      
      expect(listHeadings[0].sortOrder).toBe(100);
      expect(listHeadings[1].sortOrder).toBe(200);
      expect(listHeadings[2].sortOrder).toBe(300);
    });
  });

  describe('updateHeading', () => {
    it('should update heading properties', async () => {
      const heading = headings.createHeading({ listId: 'list-1', title: 'Original' });
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay to ensure timestamp difference
      headings.updateHeading(heading.id, { title: 'Updated' });
      
      const updated = headings.getHeading(heading.id);
      expect(updated?.title).toBe('Updated');
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(heading.updatedAt);
    });

    it('should warn when heading not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      headings.updateHeading('non-existent', { title: 'Updated' });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Heading not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('deleteHeading', () => {
    it('should delete a heading', () => {
      const heading = headings.createHeading({ listId: 'list-1', title: 'To Delete' });
      headings.deleteHeading(heading.id);
      
      const retrieved = headings.getHeading(heading.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('archiveHeading', () => {
    it('should archive a heading', async () => {
      const heading = headings.createHeading({ listId: 'list-1', archived: false });
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay to ensure timestamp difference
      headings.archiveHeading(heading.id);
      
      const updated = headings.getHeading(heading.id);
      expect(updated?.archived).toBe(true);
      expect(updated?.updatedAt).toBeGreaterThan(heading.updatedAt);
    });

    it('should warn when heading not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      headings.archiveHeading('non-existent');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Heading not found'));
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

    it('should undo heading creation', () => {
      const heading = headings.createHeading({ listId: 'list-1', title: 'Test Heading' });
      expect(headings.getHeading(heading.id)).toBeDefined();
      expect(undoManager.canUndo()).toBe(true);

      undoManager.undo();
      expect(headings.getHeading(heading.id)).toBeUndefined();
      expect(undoManager.canRedo()).toBe(true);
    });

    it('should undo heading update', () => {
      const heading = headings.createHeading({ listId: 'list-1', title: 'Original' });
      headings.updateHeading(heading.id, { title: 'Updated' });
      expect(headings.getHeading(heading.id)?.title).toBe('Updated');

      undoManager.undo();
      expect(headings.getHeading(heading.id)?.title).toBe('Original');
    });

    it('should undo heading deletion', () => {
      const heading = headings.createHeading({ listId: 'list-1', title: 'Test Heading' });
      headings.deleteHeading(heading.id);
      expect(headings.getHeading(heading.id)).toBeUndefined();

      undoManager.undo();
      expect(headings.getHeading(heading.id)).toBeDefined();
      expect(headings.getHeading(heading.id)?.title).toBe('Test Heading');
    });

    it('should undo heading archive', () => {
      const heading = headings.createHeading({ listId: 'list-1', archived: false });
      headings.archiveHeading(heading.id);
      expect(headings.getHeading(heading.id)?.archived).toBe(true);

      undoManager.undo();
      expect(headings.getHeading(heading.id)?.archived).toBe(false);
    });

    it('should handle undo when heading not found during update', () => {
      const heading = headings.createHeading({ listId: 'list-1', title: 'Original' });
      headings.updateHeading(heading.id, { title: 'Updated' });
      undoManager.undo();
      
      expect(headings.getHeading(heading.id)?.title).toBe('Original');
    });

    it('should handle undo when heading not found during delete', () => {
      const heading = headings.createHeading({ listId: 'list-1', title: 'Test' });
      headings.deleteHeading(heading.id);
      undoManager.undo();
      
      expect(headings.getHeading(heading.id)).toBeDefined();
    });

    it('should handle undo when heading not found during archive', () => {
      const heading = headings.createHeading({ listId: 'list-1', archived: false });
      headings.archiveHeading(heading.id);
      undoManager.undo();
      
      expect(headings.getHeading(heading.id)?.archived).toBe(false);
    });
  });
});
