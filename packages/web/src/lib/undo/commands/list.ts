import type { List } from '@tasky/shared';
import type { Command } from '../../undo';
import { listsMap, listsSortOrder, listTaskSortOrders } from '../../yjs';
import { now } from '@tasky/shared';

/**
 * Get the index of a list in the sort order array
 */
function getListSortIndex(listId: string): number {
  return listsSortOrder.toArray().indexOf(listId);
}

/**
 * Insert list into sort order at appropriate position
 */
function insertListIntoSortOrder(list: List, insertIndex: number): void {
  listsSortOrder.insert(insertIndex, [list.id]);
}

/**
 * Remove list from sort order
 */
function removeListFromSortOrder(listId: string): void {
  const index = getListSortIndex(listId);
  if (index !== -1) {
    listsSortOrder.delete(index, 1);
  }
}

/**
 * Capture current sort order state
 */
function captureListSortOrderState(listId: string): {
  sortOrderArray: string[];
  index: number;
} | null {
  const index = getListSortIndex(listId);
  if (index === -1) return null;
  return {
    sortOrderArray: [...listsSortOrder.toArray()],
    index
  };
}

/**
 * Restore sort order state
 */
function restoreListSortOrderState(state: { sortOrderArray: string[] }): void {
  listsSortOrder.delete(0, listsSortOrder.length);
  listsSortOrder.insert(0, state.sortOrderArray);
}

export class CreateListCommand implements Command {
  private list: List;
  private insertIndex: number;
  private hadTaskSortOrder: boolean;

  constructor(list: List, insertIndex: number) {
    this.list = { ...list };
    this.insertIndex = insertIndex;
    // Check if task sort order exists by checking if get returns undefined
    this.hadTaskSortOrder = listTaskSortOrders.get(list.id) !== undefined;
  }

  execute(): void {
    listsMap.set(this.list.id, this.list);
    insertListIntoSortOrder(this.list, this.insertIndex);
    if (!this.hadTaskSortOrder) {
      listTaskSortOrders.set(this.list.id, []);
    }
  }

  undo(): void {
    removeListFromSortOrder(this.list.id);
    listsMap.delete(this.list.id);
    if (!this.hadTaskSortOrder) {
      listTaskSortOrders.delete(this.list.id);
    }
  }
}

export class UpdateListCommand implements Command {
  private listId: string;
  private oldList: List;
  private newList: List;

  constructor(oldList: List, updates: Partial<List>) {
    this.listId = oldList.id;
    this.oldList = { ...oldList };
    this.newList = {
      ...oldList,
      ...updates,
      updatedAt: now()
    };
  }

  execute(): void {
    listsMap.set(this.listId, this.newList);
  }

  undo(): void {
    listsMap.set(this.listId, this.oldList);
  }
}

export class DeleteListCommand implements Command {
  private list: List;
  private sortOrderState: ReturnType<typeof captureListSortOrderState>;
  private taskSortOrder: string[] | undefined;

  constructor(list: List) {
    this.list = { ...list };
    this.sortOrderState = captureListSortOrderState(list.id);
    this.taskSortOrder = listTaskSortOrders.get(list.id);
  }

  execute(): void {
    removeListFromSortOrder(this.list.id);
    if (this.taskSortOrder !== undefined) {
      listTaskSortOrders.delete(this.list.id);
    }
    listsMap.delete(this.list.id);
  }

  undo(): void {
    listsMap.set(this.list.id, this.list);
    if (this.sortOrderState) {
      restoreListSortOrderState(this.sortOrderState);
    }
    if (this.taskSortOrder !== undefined) {
      listTaskSortOrders.set(this.list.id, this.taskSortOrder);
    }
  }
}

export class MoveListInSortOrderCommand implements Command {
  private listId: string;
  private newIndex: number;
  private oldSortOrderArray: string[];

  constructor(listId: string, newIndex: number) {
    this.listId = listId;
    const oldState = captureListSortOrderState(listId);
    if (!oldState) {
      throw new Error('List not found in sort order');
    }
    this.newIndex = newIndex;
    this.oldSortOrderArray = [...oldState.sortOrderArray];
  }

  execute(): void {
    const currentIndex = getListSortIndex(this.listId);
    if (currentIndex === -1) return;

    // Remove from current position
    listsSortOrder.delete(currentIndex, 1);

    // Calculate adjusted index after removal
    let adjustedIndex: number;
    if (currentIndex < this.newIndex) {
      adjustedIndex = this.newIndex - 1;
    } else {
      adjustedIndex = this.newIndex;
    }

    // Clamp to valid range
    const maxIndex = listsSortOrder.length;
    adjustedIndex = Math.max(0, Math.min(adjustedIndex, maxIndex));

    // Insert at new position
    listsSortOrder.insert(adjustedIndex, [this.listId]);
  }

  undo(): void {
    restoreListSortOrderState({ sortOrderArray: this.oldSortOrderArray });
  }
}

export class MoveListToAreaCommand implements Command {
  private listId: string;
  private oldParentListId: string | null;
  private newParentListId: string | null;
  private oldSortOrderState: ReturnType<typeof captureListSortOrderState>;

  constructor(listId: string, newParentListId: string | null) {
    this.listId = listId;
    const list = listsMap.get(listId);
    if (!list) {
      throw new Error('List not found');
    }
    this.oldParentListId = list.parentListId;
    this.newParentListId = newParentListId;
    this.oldSortOrderState = captureListSortOrderState(listId);
  }

  execute(): void {
    const list = listsMap.get(this.listId);
    if (!list) return;

    // Update parentListId
    const updated: List = {
      ...list,
      parentListId: this.newParentListId,
      updatedAt: now()
    };
    listsMap.set(this.listId, updated);

    // Reposition in sort array
    const currentIndex = getListSortIndex(this.listId);
    if (currentIndex === -1) return;

    if (this.newParentListId === null) {
      // Moving to top level - find position after last top-level item
      const sortArray = listsSortOrder.toArray();
      let insertIndex = sortArray.length;

      for (let i = sortArray.length - 1; i >= 0; i--) {
        const item = listsMap.get(sortArray[i]);
        if (item && !item.parentListId) {
          insertIndex = i + 1;
          break;
        }
      }

      listsSortOrder.delete(currentIndex, 1);
      const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
      listsSortOrder.insert(adjustedIndex, [this.listId]);
    } else {
      // Moving into an area - position right after the area
      const areaIndex = getListSortIndex(this.newParentListId);
      if (areaIndex === -1) return;

      const sortArray = listsSortOrder.toArray();
      let insertIndex = areaIndex + 1;

      // Find the last child of this area
      for (let i = areaIndex + 1; i < sortArray.length; i++) {
        const item = listsMap.get(sortArray[i]);
        if (item && item.parentListId === this.newParentListId) {
          insertIndex = i + 1;
        } else if (item && !item.parentListId) {
          break;
        } else if (item && item.parentListId !== this.newParentListId) {
          break;
        }
      }

      listsSortOrder.delete(currentIndex, 1);
      const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
      listsSortOrder.insert(adjustedIndex, [this.listId]);
    }
  }

  undo(): void {
    const list = listsMap.get(this.listId);
    if (!list) return;

    // Restore parentListId
    const updated: List = {
      ...list,
      parentListId: this.oldParentListId,
      updatedAt: now()
    };
    listsMap.set(this.listId, updated);

    // Restore sort order
    if (this.oldSortOrderState) {
      restoreListSortOrderState(this.oldSortOrderState);
    }
  }
}

