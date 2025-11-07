import { useEffect, useState } from 'react';
import type { Task, ViewType, SmartListCounts } from '@tasky/shared';
import { tasksMap, waitForSync } from '../lib/yjs';
import {
  getInboxTasks,
  getTodayTasks,
  getThisEveningTasks,
  getAnytimeTasks,
  getSomedayTasks,
  getUpcomingTasks,
  getLogbookTasks,
  getTrashTasks,
  getProjectTasks,
  getAreaTasks,
  getTasksByTag,
  getSmartListCounts
} from '../lib/filters';

// ============================================================================
// Smart List Hooks
// ============================================================================

/**
 * Subscribe to a smart list
 */
export function useSmartList(view: ViewType, contextId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateTasks = () => {
      let filtered: Task[];

      switch (view) {
        case 'inbox':
          filtered = getInboxTasks();
          break;
        case 'today':
          filtered = getTodayTasks();
          break;
        case 'anytime':
          filtered = getAnytimeTasks();
          break;
        case 'someday':
          filtered = getSomedayTasks();
          break;
        case 'upcoming':
          filtered = getUpcomingTasks();
          break;
        case 'logbook':
          filtered = getLogbookTasks();
          break;
        case 'trash':
          filtered = getTrashTasks();
          break;
        case 'project':
          filtered = contextId ? getProjectTasks(contextId) : [];
          break;
        case 'area':
          filtered = contextId ? getAreaTasks(contextId) : [];
          break;
        case 'tag':
          filtered = contextId ? getTasksByTag(contextId) : [];
          break;
        default:
          filtered = [];
      }

      setTasks(filtered);
    };

    waitForSync().then(() => {
      updateTasks();
      setIsLoading(false);
    });

    // Subscribe to task changes
    tasksMap.observe(updateTasks);

    return () => {
      tasksMap.unobserve(updateTasks);
    };
  }, [view, contextId]);

  return { tasks, isLoading };
}

/**
 * Get inbox tasks
 */
export function useInbox() {
  return useSmartList('inbox');
}

/**
 * Get today tasks
 */
export function useToday() {
  return useSmartList('today');
}

/**
 * Get this evening tasks (subset of today)
 */
export function useThisEvening() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateTasks = () => {
      setTasks(getThisEveningTasks());
    };

    waitForSync().then(() => {
      updateTasks();
      setIsLoading(false);
    });

    tasksMap.observe(updateTasks);

    return () => {
      tasksMap.unobserve(updateTasks);
    };
  }, []);

  return { tasks, isLoading };
}

/**
 * Get anytime tasks
 */
export function useAnytime() {
  return useSmartList('anytime');
}

/**
 * Get someday tasks
 */
export function useSomeday() {
  return useSmartList('someday');
}

/**
 * Get upcoming tasks
 */
export function useUpcoming() {
  return useSmartList('upcoming');
}

/**
 * Get logbook tasks
 */
export function useLogbook() {
  return useSmartList('logbook');
}

/**
 * Get trash tasks
 */
export function useTrash() {
  return useSmartList('trash');
}

/**
 * Get tasks for a specific project
 */
export function useProjectTasks(projectId: string) {
  return useSmartList('project', projectId);
}

/**
 * Get tasks for a specific area
 */
export function useAreaTasks(areaId: string) {
  return useSmartList('area', areaId);
}

/**
 * Get tasks with a specific tag
 */
export function useTagTasks(tagId: string) {
  return useSmartList('tag', tagId);
}

/**
 * Get counts for all smart lists (for sidebar badges)
 */
export function useSmartListCounts() {
  const [counts, setCounts] = useState<SmartListCounts>({
    inbox: 0,
    today: 0,
    anytime: 0,
    someday: 0,
    upcoming: 0,
    logbook: 0,
    trash: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateCounts = () => {
      setCounts(getSmartListCounts());
    };

    waitForSync().then(() => {
      updateCounts();
      setIsLoading(false);
    });

    tasksMap.observe(updateCounts);

    return () => {
      tasksMap.unobserve(updateCounts);
    };
  }, []);

  return { counts, isLoading };
}
