import { generateId, now, type Tag, type TagInput } from '@tasky/shared';
import { tagsMap, tagsSortOrder } from './yjs';
import { DEFAULT_TAG_COLOR } from '../constants';
import { undoManager } from './undo';
import {
  CreateTagCommand,
  UpdateTagCommand,
  DeleteTagCommand
} from './undo/commands/tag';

/**
 * Internal implementation - create tag without undo tracking
 */
function _createTagInternal(input: Partial<TagInput>): Tag {
  const id = generateId();
  const timestamp = now();

  const tag: Tag = {
    id,
    name: input.name || '',
    parentId: input.parentId ?? null,
    color: input.color || DEFAULT_TAG_COLOR,
    createdAt: timestamp,
    updatedAt: timestamp,
    sortOrder: input.sortOrder || timestamp
  };

  tagsMap.set(id, tag);
  tagsSortOrder.push([id]);

  return tag;
}

/**
 * Create a new tag
 */
export function createTag(input: Partial<TagInput>): Tag {
  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    return _createTagInternal(input);
  }

  // Create tag object but don't add to map yet - command will do that
  const id = generateId();
  const timestamp = now();
  const tag: Tag = {
    id,
    name: input.name || '',
    parentId: input.parentId ?? null,
    color: input.color || DEFAULT_TAG_COLOR,
    createdAt: timestamp,
    updatedAt: timestamp,
    sortOrder: input.sortOrder || timestamp
  };

  const command = new CreateTagCommand(tag);
  undoManager.execute(command);
  return tag;
}

/**
 * Get a tag by ID
 */
export function getTag(id: string): Tag | undefined {
  return tagsMap.get(id);
}

/**
 * Get a tag by name (case-insensitive)
 */
export function getTagByName(name: string): Tag | undefined {
  const normalizedName = name.toLowerCase();
  const tags = Array.from(tagsMap.values());
  return tags.find(tag => tag.name.toLowerCase() === normalizedName);
}

/**
 * Internal implementation - update tag without undo tracking
 */
function _updateTagInternal(id: string, updates: Partial<Tag>): void {
  const tag = tagsMap.get(id);
  if (!tag) {
    console.warn(`[updateTag] Tag not found: ${id}`);
    return;
  }

  const updated: Tag = {
    ...tag,
    ...updates,
    updatedAt: now()
  };

  tagsMap.set(id, updated);
}

/**
 * Update a tag
 */
export function updateTag(id: string, updates: Partial<Tag>): void {
  const tag = tagsMap.get(id);
  if (!tag) {
    console.warn(`[updateTag] Tag not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _updateTagInternal(id, updates);
    return;
  }

  const oldTag = { ...tag };
  const command = new UpdateTagCommand(oldTag, updates);
  undoManager.execute(command);
}

/**
 * Internal implementation - delete tag without undo tracking
 */
function _deleteTagInternal(id: string): void {
  const tag = tagsMap.get(id);
  if (!tag) {
    console.warn(`[deleteTag] Tag not found: ${id}`);
    return;
  }

  // Remove from sort order
  const sortArray = tagsSortOrder.toArray();
  const index = sortArray.indexOf(id);
  if (index !== -1) {
    tagsSortOrder.delete(index, 1);
  }

  // Delete the tag
  tagsMap.delete(id);
}

/**
 * Delete a tag
 */
export function deleteTag(id: string): void {
  const tag = tagsMap.get(id);
  if (!tag) {
    console.warn(`[deleteTag] Tag not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _deleteTagInternal(id);
    return;
  }

  const command = new DeleteTagCommand(tag);
  undoManager.execute(command);
}

/**
 * Get child tags of a parent tag
 */
export function getChildTags(parentId: string): Tag[] {
  const tags = Array.from(tagsMap.values());
  return tags.filter(tag => tag.parentId === parentId);
}

/**
 * Get root tags (no parent)
 */
export function getRootTags(): Tag[] {
  const tags = Array.from(tagsMap.values());
  return tags.filter(tag => tag.parentId === null);
}
