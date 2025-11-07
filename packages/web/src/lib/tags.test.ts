import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Tag, TagInput } from '@tasky/shared';
import * as tags from './tags';

// Mock yjs module
const mockTagsMap = new Map<string, Tag>();
const mockTagsSortOrder: string[] = [];

vi.mock('./yjs', () => ({
  tagsMap: {
    get: (id: string) => mockTagsMap.get(id),
    set: (id: string, tag: Tag) => {
      mockTagsMap.set(id, tag);
    },
    delete: (id: string) => {
      mockTagsMap.delete(id);
    },
    values: () => mockTagsMap.values(),
  },
  tagsSortOrder: {
    push: (items: string[]) => {
      mockTagsSortOrder.push(...items);
    },
    toArray: () => [...mockTagsSortOrder],
    delete: (index: number, length: number) => {
      mockTagsSortOrder.splice(index, length);
    },
  },
}));

vi.mock('../constants', () => ({
  DEFAULT_TAG_COLOR: '#3b82f6',
}));

describe('tags.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTagsMap.clear();
    mockTagsSortOrder.length = 0;
  });

  describe('createTag', () => {
    it('should create a tag with default values', () => {
      const tag = tags.createTag({});
      
      expect(tag).toBeDefined();
      expect(tag.id).toBeTruthy();
      expect(tag.name).toBe('');
      expect(tag.parentId).toBeNull();
      expect(tag.color).toBe('#3b82f6');
      expect(tag.createdAt).toBeGreaterThan(0);
      expect(tag.updatedAt).toBeGreaterThan(0);
      expect(tag.sortOrder).toBeGreaterThan(0);
    });

    it('should create a tag with provided values', () => {
      const input: Partial<TagInput> = {
        name: 'Test Tag',
        parentId: 'parent-1',
        color: '#ff0000',
        sortOrder: 5000,
      };

      const tag = tags.createTag(input);
      
      expect(tag.name).toBe('Test Tag');
      expect(tag.parentId).toBe('parent-1');
      expect(tag.color).toBe('#ff0000');
      expect(tag.sortOrder).toBe(5000);
    });

    it('should add tag to sort order', () => {
      const tag = tags.createTag({ name: 'Test' });
      expect(mockTagsSortOrder).toContain(tag.id);
    });
  });

  describe('getTag', () => {
    it('should return tag by ID', () => {
      const tag = tags.createTag({ name: 'Test' });
      const retrieved = tags.getTag(tag.id);
      
      expect(retrieved).toEqual(tag);
    });

    it('should return undefined for non-existent tag', () => {
      const retrieved = tags.getTag('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getTagByName', () => {
    it('should return tag by name (case-insensitive)', () => {
      const tag = tags.createTag({ name: 'Test Tag' });
      const retrieved = tags.getTagByName('test tag');
      
      expect(retrieved).toEqual(tag);
    });

    it('should return undefined for non-existent tag name', () => {
      const retrieved = tags.getTagByName('Non Existent');
      expect(retrieved).toBeUndefined();
    });

    it('should handle case sensitivity', () => {
      const tag = tags.createTag({ name: 'TestTag' });
      expect(tags.getTagByName('testtag')).toEqual(tag);
      expect(tags.getTagByName('TESTTAG')).toEqual(tag);
      expect(tags.getTagByName('TestTag')).toEqual(tag);
    });
  });

  describe('updateTag', () => {
    it('should update tag properties', async () => {
      const tag = tags.createTag({ name: 'Original' });
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay to ensure timestamp difference
      tags.updateTag(tag.id, { name: 'Updated' });
      
      const updated = tags.getTag(tag.id);
      expect(updated?.name).toBe('Updated');
      expect(updated?.updatedAt).toBeGreaterThan(tag.updatedAt);
    });

    it('should warn when tag not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      tags.updateTag('non-existent', { name: 'Updated' });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Tag not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag', () => {
      const tag = tags.createTag({ name: 'To Delete' });
      tags.deleteTag(tag.id);
      
      const retrieved = tags.getTag(tag.id);
      expect(retrieved).toBeUndefined();
    });

    it('should remove tag from sort order', () => {
      const tag = tags.createTag({ name: 'Test' });
      expect(mockTagsSortOrder).toContain(tag.id);
      
      tags.deleteTag(tag.id);
      
      expect(mockTagsSortOrder).not.toContain(tag.id);
    });

    it('should warn when tag not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      tags.deleteTag('non-existent');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Tag not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('getChildTags', () => {
    it('should return child tags of a parent', () => {
      const parent = tags.createTag({ name: 'Parent' });
      const child1 = tags.createTag({ name: 'Child 1', parentId: parent.id });
      const child2 = tags.createTag({ name: 'Child 2', parentId: parent.id });
      const unrelated = tags.createTag({ name: 'Unrelated' });
      
      const children = tags.getChildTags(parent.id);
      
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toContain(child1.id);
      expect(children.map(c => c.id)).toContain(child2.id);
      expect(children.map(c => c.id)).not.toContain(unrelated.id);
    });

    it('should return empty array when no children', () => {
      const parent = tags.createTag({ name: 'Parent' });
      const children = tags.getChildTags(parent.id);
      
      expect(children).toEqual([]);
    });
  });

  describe('getRootTags', () => {
    it('should return tags with no parent', () => {
      const root1 = tags.createTag({ name: 'Root 1' });
      const root2 = tags.createTag({ name: 'Root 2' });
      const parent = tags.createTag({ name: 'Parent' });
      const child = tags.createTag({ name: 'Child', parentId: parent.id });
      
      const roots = tags.getRootTags();
      
      expect(roots.length).toBeGreaterThanOrEqual(3);
      expect(roots.map(r => r.id)).toContain(root1.id);
      expect(roots.map(r => r.id)).toContain(root2.id);
      expect(roots.map(r => r.id)).toContain(parent.id);
      expect(roots.map(r => r.id)).not.toContain(child.id);
    });
  });
});
