import type { ChecklistItem } from '@tasky/shared';
import type { Command } from '../../undo';
import { checklistItemsMap } from '../../yjs';
import { now } from '@tasky/shared';

export class CreateChecklistItemCommand implements Command {
  private item: ChecklistItem;

  constructor(item: ChecklistItem) {
    this.item = { ...item };
  }

  execute(): void {
    checklistItemsMap.set(this.item.id, this.item);
  }

  undo(): void {
    checklistItemsMap.delete(this.item.id);
  }
}

export class UpdateChecklistItemCommand implements Command {
  private itemId: string;
  private oldItem: ChecklistItem;
  private newItem: ChecklistItem;

  constructor(oldItem: ChecklistItem, updates: Partial<ChecklistItem>) {
    this.itemId = oldItem.id;
    this.oldItem = { ...oldItem };
    this.newItem = {
      ...oldItem,
      ...updates,
      updatedAt: now()
    };
  }

  execute(): void {
    checklistItemsMap.set(this.itemId, this.newItem);
  }

  undo(): void {
    checklistItemsMap.set(this.itemId, this.oldItem);
  }
}

export class DeleteChecklistItemCommand implements Command {
  private item: ChecklistItem;

  constructor(item: ChecklistItem) {
    this.item = { ...item };
  }

  execute(): void {
    checklistItemsMap.delete(this.item.id);
  }

  undo(): void {
    checklistItemsMap.set(this.item.id, this.item);
  }
}

export class ToggleChecklistItemCommand implements Command {
  private itemId: string;
  private oldCompleted: boolean;

  constructor(item: ChecklistItem) {
    this.itemId = item.id;
    this.oldCompleted = item.completed;
  }

  execute(): void {
    const item = checklistItemsMap.get(this.itemId);
    if (!item) return;

    const updated: ChecklistItem = {
      ...item,
      completed: !item.completed,
      updatedAt: now()
    };
    checklistItemsMap.set(this.itemId, updated);
  }

  undo(): void {
    const item = checklistItemsMap.get(this.itemId);
    if (!item) return;

    const updated: ChecklistItem = {
      ...item,
      completed: this.oldCompleted,
      updatedAt: now()
    };
    checklistItemsMap.set(this.itemId, updated);
  }
}

