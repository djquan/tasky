import type { Tag } from '@tasky/shared';
import type { Command } from '../../undo';
import { tagsMap, tagsSortOrder } from '../../yjs';
import { now } from '@tasky/shared';

/**
 * Get the index of a tag in the sort order array
 */
function getTagSortIndex(tagId: string): number {
  return tagsSortOrder.toArray().indexOf(tagId);
}

/**
 * Capture current sort order state
 */
function captureTagSortOrderState(tagId: string): {
  sortOrderArray: string[];
  index: number;
} | null {
  const index = getTagSortIndex(tagId);
  if (index === -1) return null;
  return {
    sortOrderArray: [...tagsSortOrder.toArray()],
    index
  };
}

/**
 * Restore sort order state
 */
function restoreTagSortOrderState(state: { sortOrderArray: string[] }): void {
  tagsSortOrder.delete(0, tagsSortOrder.length);
  tagsSortOrder.insert(0, state.sortOrderArray);
}

export class CreateTagCommand implements Command {
  private tag: Tag;

  constructor(tag: Tag) {
    this.tag = { ...tag };
  }

  execute(): void {
    tagsMap.set(this.tag.id, this.tag);
    tagsSortOrder.push([this.tag.id]);
  }

  undo(): void {
    const index = getTagSortIndex(this.tag.id);
    if (index !== -1) {
      tagsSortOrder.delete(index, 1);
    }
    tagsMap.delete(this.tag.id);
  }
}

export class UpdateTagCommand implements Command {
  private tagId: string;
  private oldTag: Tag;
  private newTag: Tag;

  constructor(oldTag: Tag, updates: Partial<Tag>) {
    this.tagId = oldTag.id;
    this.oldTag = { ...oldTag };
    this.newTag = {
      ...oldTag,
      ...updates,
      updatedAt: now()
    };
  }

  execute(): void {
    tagsMap.set(this.tagId, this.newTag);
  }

  undo(): void {
    tagsMap.set(this.tagId, this.oldTag);
  }
}

export class DeleteTagCommand implements Command {
  private tag: Tag;
  private sortOrderState: ReturnType<typeof captureTagSortOrderState>;

  constructor(tag: Tag) {
    this.tag = { ...tag };
    this.sortOrderState = captureTagSortOrderState(tag.id);
  }

  execute(): void {
    const index = getTagSortIndex(this.tag.id);
    if (index !== -1) {
      tagsSortOrder.delete(index, 1);
    }
    tagsMap.delete(this.tag.id);
  }

  undo(): void {
    tagsMap.set(this.tag.id, this.tag);
    if (this.sortOrderState) {
      restoreTagSortOrderState(this.sortOrderState);
    } else {
      tagsSortOrder.push([this.tag.id]);
    }
  }
}

