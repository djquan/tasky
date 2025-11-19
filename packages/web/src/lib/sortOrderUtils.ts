/**
 * Sort Order Utilities
 *
 * Shared functions for managing task sort orders across different views.
 * Used by both main task operations and undo/redo commands.
 */

import type { Task } from '@tasky/shared';
import {
  inboxSortOrder,
  todaySortOrder,
  anytimeSortOrder,
  somedaySortOrder,
  listTaskSortOrders
} from './yjs';

/**
 * Add task ID to appropriate sort order array
 */
export function addToSortOrder(task: Task): void {
  const id = task.id;

  // Priority: list > when
  if (task.listId) {
    const sortOrder = listTaskSortOrders.get(task.listId) || [];
    listTaskSortOrders.set(task.listId, [...sortOrder, id]);
  } else {
    // Add to appropriate when-based sort order
    switch (task.when) {
      case 'today':
      case 'evening':
        todaySortOrder.push([id]);
        break;
      case 'anytime':
        // All anytime tasks without listId go to anytimeSortOrder
        // The distinction between inbox and anytime views is handled by filter functions
        anytimeSortOrder.push([id]);
        break;
      case 'someday':
        somedaySortOrder.push([id]);
        break;
    }
  }
}

/**
 * Remove task ID from its current sort order array
 */
export function removeFromSortOrder(task: Task): void {
  const id = task.id;

  // Try list sort order
  if (task.listId) {
    const sortOrder = listTaskSortOrders.get(task.listId) || [];
    const filtered = sortOrder.filter(taskId => taskId !== id);
    listTaskSortOrders.set(task.listId, filtered);
    return;
  }

  // Remove from all when-based sort orders
  const arrays = [inboxSortOrder, todaySortOrder, anytimeSortOrder, somedaySortOrder];

  for (const arr of arrays) {
    const index = arr.toArray().indexOf(id);
    if (index !== -1) {
      arr.delete(index, 1);
      return;
    }
  }
}
