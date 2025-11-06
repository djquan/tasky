import { generateId, now, type Task, type TaskInput, type WhenValue } from '@tasky/shared';
import {
  tasksMap,
  inboxSortOrder,
  todaySortOrder,
  anytimeSortOrder,
  somedaySortOrder,
  projectTaskSortOrders,
  areaTaskSortOrders
} from './yjs';

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new task
 */
export function createTask(input: Partial<TaskInput>): Task {
  const id = generateId();
  const timestamp = now();

  // Enforce mutual exclusivity: project OR area, not both
  let projectId = input.projectId ?? null;
  let areaId = input.areaId ?? null;

  if (projectId && areaId) {
    // If both provided, prefer project
    areaId = null;
  }

  const task: Task = {
    id,
    title: input.title || '',
    notes: input.notes || '',
    when: input.when || 'anytime',  // Default to anytime (not inbox - inbox is dynamic)
    scheduledDate: input.scheduledDate ?? null,
    deadline: input.deadline ?? null,
    tags: input.tags || [],
    checklistItems: input.checklistItems || [],
    projectId,
    areaId,
    headingId: input.headingId ?? null,
    completed: input.completed || false,
    canceled: input.canceled || false,
    createdAt: timestamp,
    completedAt: null,
    updatedAt: timestamp,
    sortOrder: input.sortOrder || timestamp
  };

  tasksMap.set(id, task);

  // Add to appropriate sort order array
  addToSortOrder(task);

  return task;
}

/**
 * Get a task by ID
 */
export function getTask(id: string): Task | undefined {
  return tasksMap.get(id);
}

/**
 * Update a task
 */
export function updateTask(id: string, updates: Partial<Task>): void {
  const task = tasksMap.get(id);
  if (!task) return;

  const oldWhen = task.when;
  const oldProjectId = task.projectId;
  const oldAreaId = task.areaId;

  // Enforce mutual exclusivity: if setting projectId, clear areaId; if setting areaId, clear projectId
  const finalUpdates = { ...updates };

  if (updates.projectId !== undefined && updates.projectId !== null) {
    // Setting a project, clear area
    finalUpdates.areaId = null;
    finalUpdates.headingId = finalUpdates.headingId ?? null; // Headings only valid in projects
  } else if (updates.areaId !== undefined && updates.areaId !== null) {
    // Setting an area, clear project and heading
    finalUpdates.projectId = null;
    finalUpdates.headingId = null;  // Headings not valid without project
  }

  const updatedTask: Task = {
    ...task,
    ...finalUpdates,
    updatedAt: now()
  };

  tasksMap.set(id, updatedTask);

  // Handle sort order changes if container changed
  const whenChanged = updates.when && updates.when !== oldWhen;
  const projectChanged = updates.projectId !== undefined && updates.projectId !== oldProjectId;
  const areaChanged = updates.areaId !== undefined && updates.areaId !== oldAreaId;

  if (whenChanged || projectChanged || areaChanged) {
    removeFromSortOrder(task);
    addToSortOrder(updatedTask);
  }
}

/**
 * Delete a task
 */
export function deleteTask(id: string): void {
  const task = tasksMap.get(id);
  if (!task) return;

  removeFromSortOrder(task);
  tasksMap.delete(id);
}

/**
 * Toggle task completion
 */
export function toggleTask(id: string): void {
  const task = tasksMap.get(id);
  if (!task) return;

  const timestamp = now();
  const updated: Task = {
    ...task,
    completed: !task.completed,
    completedAt: !task.completed ? timestamp : null,
    updatedAt: timestamp
  };

  tasksMap.set(id, updated);
}

/**
 * Move task to a different container (when/project/area)
 */
export function moveTask(
  id: string,
  target: {
    when?: WhenValue;
    projectId?: string | null;
    areaId?: string | null;
    headingId?: string | null;
  }
): void {
  updateTask(id, target);
}

/**
 * Cancel a task (soft delete)
 */
export function cancelTask(id: string): void {
  const task = tasksMap.get(id);
  if (!task) return;

  const updated: Task = {
    ...task,
    canceled: true,
    completedAt: now(),
    updatedAt: now()
  };

  tasksMap.set(id, updated);
}

// ============================================================================
// Sort Order Management
// ============================================================================

/**
 * Add task ID to appropriate sort order array
 */
function addToSortOrder(task: Task): void {
  const id = task.id;

  // Priority: project > area > when
  if (task.projectId) {
    const sortOrder = projectTaskSortOrders.get(task.projectId) || [];
    projectTaskSortOrders.set(task.projectId, [...sortOrder, id]);
  } else if (task.areaId) {
    const sortOrder = areaTaskSortOrders.get(task.areaId) || [];
    areaTaskSortOrders.set(task.areaId, [...sortOrder, id]);
  } else {
    // Add to appropriate when-based sort order
    switch (task.when) {
      case 'inbox':
        inboxSortOrder.push([id]);
        break;
      case 'today':
      case 'evening':
        todaySortOrder.push([id]);
        break;
      case 'anytime':
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
function removeFromSortOrder(task: Task): void {
  const id = task.id;

  // Try project sort order
  if (task.projectId) {
    const sortOrder = projectTaskSortOrders.get(task.projectId) || [];
    const filtered = sortOrder.filter(taskId => taskId !== id);
    projectTaskSortOrders.set(task.projectId, filtered);
    return;
  }

  // Try area sort order
  if (task.areaId) {
    const sortOrder = areaTaskSortOrders.get(task.areaId) || [];
    const filtered = sortOrder.filter(taskId => taskId !== id);
    areaTaskSortOrders.set(task.areaId, filtered);
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

/**
 * Reorder task within its container
 */
export function reorderTask(id: string, newIndex: number): void {
  const task = tasksMap.get(id);
  if (!task) return;

  // Get appropriate sort order array
  let sortOrderArray: string[] | undefined;

  if (task.projectId) {
    sortOrderArray = projectTaskSortOrders.get(task.projectId);
  } else if (task.areaId) {
    sortOrderArray = areaTaskSortOrders.get(task.areaId);
  } else {
    // Handle when-based reordering
    let yjsArray;
    switch (task.when) {
      case 'inbox':
        yjsArray = inboxSortOrder;
        break;
      case 'today':
      case 'evening':
        yjsArray = todaySortOrder;
        break;
      case 'anytime':
        yjsArray = anytimeSortOrder;
        break;
      case 'someday':
        yjsArray = somedaySortOrder;
        break;
      default:
        return;
    }

    const arr = yjsArray.toArray();
    const currentIndex = arr.indexOf(id);
    if (currentIndex === -1) return;

    yjsArray.delete(currentIndex, 1);
    yjsArray.insert(newIndex, [id]);
    return;
  }

  if (!sortOrderArray) return;

  // Reorder in map-based sort order
  const currentIndex = sortOrderArray.indexOf(id);
  if (currentIndex === -1) return;

  const newArray = [...sortOrderArray];
  newArray.splice(currentIndex, 1);
  newArray.splice(newIndex, 0, id);

  if (task.projectId) {
    projectTaskSortOrders.set(task.projectId, newArray);
  } else if (task.areaId) {
    areaTaskSortOrders.set(task.areaId, newArray);
  }
}
