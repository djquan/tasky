import type { Task, List } from '@tasky/shared';
import { getAllTasks, getAllLists } from './yjs';

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Get start of today (midnight) as timestamp
 */
function getToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/**
 * Get start of tomorrow (midnight) as timestamp
 */
function getTomorrow(): number {
  const today = getToday();
  return today + 24 * 60 * 60 * 1000;
}

/**
 * Check if timestamp is today
 */
function isToday(timestamp: number | null): boolean {
  if (!timestamp) return false;
  const today = getToday();
  const tomorrow = getTomorrow();
  return timestamp >= today && timestamp < tomorrow;
}

/**
 * Check if timestamp is in the past
 */
function isPast(timestamp: number | null): boolean {
  if (!timestamp) return false;
  return timestamp < getToday();
}

/**
 * Check if timestamp is in the future (not today)
 */
function isFuture(timestamp: number | null): boolean {
  if (!timestamp) return false;
  return timestamp >= getTomorrow();
}

// ============================================================================
// Smart List Filters
// ============================================================================

/**
 * Get tasks for Inbox view
 *
 * Inbox is a dynamic category: tasks with no date and no list.
 * Criteria:
 * - No scheduledDate
 * - No deadline
 * - No listId
 * - Not scheduled for today/evening (those go to Today)
 * - Not someday (those go to Someday)
 * - Not completed/canceled
 */
export function getInboxTasks(): Task[] {
  const tasks = getAllTasks();
  return tasks
    .filter(task => {
      if (task.completed || task.canceled) return false;

      // Exclude if has organization (list)
      if (task.listId) return false;

      // Exclude if has explicit dates
      if (task.scheduledDate || task.deadline) return false;

      // Exclude if scheduled for today/evening (goes to Today view)
      if (task.when === 'today' || task.when === 'evening') return false;

      // Exclude if someday (goes to Someday view)
      if (task.when === 'someday') return false;

      // Everything else is inbox
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt); // Newest first
}

/**
 * Get tasks for Today view
 *
 * Criteria:
 * - when='today' OR when='evening', OR
 * - scheduledDate is today, OR
 * - deadline is today
 * AND not completed/canceled
 */
export function getTodayTasks(): Task[] {
  const tasks = getAllTasks();

  return tasks
    .filter(task => {
      if (task.completed || task.canceled) return false;

      // Explicitly scheduled for today
      if (task.when === 'today' || task.when === 'evening') return true;

      // Scheduled date is today
      if (task.scheduledDate && isToday(task.scheduledDate)) return true;

      // Deadline is today
      if (task.deadline && isToday(task.deadline)) return true;

      // Overdue deadline
      if (task.deadline && isPast(task.deadline)) return true;

      return false;
    })
    .sort((a, b) => {
      // Sort evening tasks to bottom
      if (a.when === 'evening' && b.when !== 'evening') return 1;
      if (b.when === 'evening' && a.when !== 'evening') return -1;

      // Sort by deadline first (overdue tasks first)
      if (a.deadline && b.deadline) {
        return a.deadline - b.deadline;
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;

      // Then by scheduled date
      if (a.scheduledDate && b.scheduledDate) {
        return a.scheduledDate - b.scheduledDate;
      }

      // Finally by creation date
      return a.createdAt - b.createdAt;
    });
}

/**
 * Get tasks for This Evening section within Today view
 */
export function getThisEveningTasks(): Task[] {
  const tasks = getTodayTasks();
  return tasks.filter(task => task.when === 'evening');
}

/**
 * Get tasks for Anytime view
 *
 * Anytime contains tasks with organization (list) but no specific schedule.
 * Criteria:
 * - Has listId (organized tasks)
 * - when='anytime'
 * - NOT scheduled for future
 * - NOT in Someday
 * - NOT in Today
 * AND not completed/canceled
 */
export function getAnytimeTasks(): Task[] {
  const tasks = getAllTasks();

  return tasks
    .filter(task => {
      if (task.completed || task.canceled) return false;

      // Must have organization (list)
      if (!task.listId) return false;

      // Exclude someday
      if (task.when === 'someday') return false;

      // Exclude today/evening
      if (task.when === 'today' || task.when === 'evening') return false;

      // Future scheduled tasks are "hibernating" (go to Upcoming)
      if (task.scheduledDate && isFuture(task.scheduledDate)) return false;

      // Future deadlines go to Upcoming
      if (task.deadline && isFuture(task.deadline)) return false;

      return true;
    })
    .sort((a, b) => {
      // Sort by list, then creation date
      if (a.listId && !b.listId) return -1;
      if (!a.listId && b.listId) return 1;
      return b.createdAt - a.createdAt;
    });
}

/**
 * Get tasks for Someday view
 *
 * Criteria: when='someday' AND not completed/canceled
 */
export function getSomedayTasks(): Task[] {
  const tasks = getAllTasks();
  return tasks
    .filter(task =>
      task.when === 'someday' &&
      !task.completed &&
      !task.canceled
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get tasks for Upcoming view
 *
 * Criteria:
 * - scheduledDate in future OR deadline in future
 * AND not completed/canceled
 */
export function getUpcomingTasks(): Task[] {
  const tasks = getAllTasks();
  const tomorrow = getTomorrow();

  return tasks
    .filter(task => {
      if (task.completed || task.canceled) return false;

      // Future scheduled date
      if (task.scheduledDate && task.scheduledDate >= tomorrow) return true;

      // Future deadline
      if (task.deadline && task.deadline >= tomorrow) return true;

      return false;
    })
    .sort((a, b) => {
      // Sort by earliest relevant date
      const aDate = a.scheduledDate || a.deadline || Infinity;
      const bDate = b.scheduledDate || b.deadline || Infinity;
      return aDate - bDate;
    });
}

/**
 * Get tasks for Logbook view
 *
 * Criteria: completed=true OR canceled=true
 */
export function getLogbookTasks(): Task[] {
  const tasks = getAllTasks();
  return tasks
    .filter(task => task.completed || task.canceled)
    .sort((a, b) => {
      const aCompleted = a.completedAt || a.updatedAt;
      const bCompleted = b.completedAt || b.updatedAt;
      return bCompleted - aCompleted; // Newest first
    });
}

/**
 * Get tasks for a specific list
 */
export function getListTasks(listId: string): Task[] {
  const tasks = getAllTasks();
  return tasks
    .filter(task => task.listId === listId && !task.canceled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// Legacy function names for backward compatibility
export const getProjectTasks = getListTasks;
export const getAreaTasks = getListTasks;

/**
 * Get lists (projects) for a specific parent list (area)
 */
export function getChildLists(parentListId: string): List[] {
  const lists = getAllLists();
  return lists
    .filter(list =>
      list.parentListId === parentListId &&
      !list.completed &&
      !list.canceled
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// Legacy function name
export const getAreaProjects = getChildLists;

/**
 * Get tasks with a specific tag
 */
export function getTasksByTag(tagId: string): Task[] {
  const tasks = getAllTasks();
  return tasks
    .filter(task =>
      task.tags.includes(tagId) &&
      !task.completed &&
      !task.canceled
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get all active lists of a specific type (not completed/canceled)
 */
export function getActiveLists(type?: 'project' | 'area'): List[] {
  const lists = getAllLists();
  return lists
    .filter(list => {
      if (type && list.type !== type) return false;
      return !list.completed && !list.canceled;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get all completed lists of a specific type
 */
export function getCompletedLists(type?: 'project' | 'area'): List[] {
  const lists = getAllLists();
  return lists
    .filter(list => {
      if (type && list.type !== type) return false;
      return list.completed || list.canceled;
    })
    .sort((a, b) => {
      const aCompleted = a.completedAt || a.updatedAt;
      const bCompleted = b.completedAt || b.updatedAt;
      return bCompleted - aCompleted;
    });
}

// Legacy function names
export const getActiveProjects = () => getActiveLists('project');
export const getCompletedProjects = () => getCompletedLists('project');

// ============================================================================
// Count Helpers
// ============================================================================

/**
 * Get counts for all smart lists
 */
export function getSmartListCounts() {
  const tasks = getAllTasks();
  const tomorrow = getTomorrow();

  const counts = {
    inbox: 0,
    today: 0,
    anytime: 0,
    someday: 0,
    upcoming: 0,
    logbook: 0
  };

  for (const task of tasks) {
    if (task.completed || task.canceled) {
      counts.logbook++;
      continue;
    }

    // Today
    if (
      task.when === 'today' ||
      task.when === 'evening' ||
      (task.scheduledDate && isToday(task.scheduledDate)) ||
      (task.deadline && (isToday(task.deadline) || isPast(task.deadline)))
    ) {
      counts.today++;
      continue;
    }

    // Upcoming
    if (
      (task.scheduledDate && task.scheduledDate >= tomorrow) ||
      (task.deadline && task.deadline >= tomorrow)
    ) {
      counts.upcoming++;
      continue;
    }

    // Inbox (tasks with no list, no dates, when='anytime')
    if (
      task.when === 'anytime' &&
      !task.listId &&
      !task.scheduledDate &&
      !task.deadline
    ) {
      counts.inbox++;
      continue;
    }

    // Someday
    if (task.when === 'someday') {
      counts.someday++;
      continue;
    }

    // Anytime (tasks with listId not already counted)
    if (task.listId && task.when === 'anytime') {
      counts.anytime++;
    }
  }

  return counts;
}
