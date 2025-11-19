import { useEffect, useState } from 'react';
import type { Task, List, ListType, Tag, Heading, ChecklistItem } from '@tasky/shared';
import {
  tasksMap,
  listsMap,
  tagsMap,
  headingsMap,
  checklistItemsMap,
  listsSortOrder,
  waitForSync
} from '../lib/yjs';
import { getSortedLists } from '../lib/lists';

// ============================================================================
// Entity Hooks
// ============================================================================

/**
 * Subscribe to all tasks
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load after IndexedDB sync
    waitForSync().then(() => {
      setTasks(Array.from(tasksMap.values()));
      setIsLoading(false);
    });

    // Subscribe to changes
    const observer = () => {
      setTasks(Array.from(tasksMap.values()));
    };

    tasksMap.observe(observer);

    return () => {
      tasksMap.unobserve(observer);
    };
  }, []);

  return { tasks, isLoading };
}

/**
 * Subscribe to a single task
 */
export function useTask(id: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      // Reset state when id becomes null - done via separate effect
      return;
    }

    setIsLoading(true);
    waitForSync().then(() => {
      setTask(tasksMap.get(id) || null);
      setIsLoading(false);
    });

    const observer = () => {
      setTask(tasksMap.get(id) || null);
    };

    tasksMap.observe(observer);

    return () => {
      tasksMap.unobserve(observer);
    };
  }, [id]);

  // Reset state when id becomes null
  useEffect(() => {
    if (!id) {
      setTask(null);
      setIsLoading(false);
    }
  }, [id]);

  return { task, isLoading };
}

/**
 * Subscribe to all lists
 */
export function useLists(type?: ListType) {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateLists = () => {
      const allLists = Array.from(listsMap.values());
      const filtered = type ? allLists.filter(list => list.type === type) : allLists;
      setLists(filtered);
    };

    waitForSync().then(() => {
      updateLists();
      setIsLoading(false);
    });

    listsMap.observe(updateLists);

    return () => {
      listsMap.unobserve(updateLists);
    };
  }, [type]);

  return { lists, isLoading };
}

/**
 * Subscribe to a single list
 */
export function useList(id: string | null) {
  const [list, setList] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      // Reset state when id becomes null - done via separate effect
      return;
    }

    setIsLoading(true);
    waitForSync().then(() => {
      setList(listsMap.get(id) || null);
      setIsLoading(false);
    });

    const observer = () => {
      setList(listsMap.get(id) || null);
    };

    listsMap.observe(observer);

    return () => {
      listsMap.unobserve(observer);
    };
  }, [id]);

  // Reset state when id becomes null
  useEffect(() => {
    if (!id) {
      setList(null);
      setIsLoading(false);
    }
  }, [id]);

  return { list, isLoading };
}

/**
 * Subscribe to all projects (convenience wrapper)
 */
export function useProjects() {
  const { lists, isLoading } = useLists('project');
  return { projects: lists, isLoading };
}

/**
 * Subscribe to a single project (convenience wrapper)
 */
export function useProject(id: string | null) {
  const { list, isLoading } = useList(id);
  return { project: list, isLoading };
}

/**
 * Subscribe to all areas (convenience wrapper)
 */
export function useAreas() {
  const { lists, isLoading } = useLists('area');
  return { areas: lists, isLoading };
}

/**
 * Subscribe to a single area (convenience wrapper)
 */
export function useArea(id: string | null) {
  const { list, isLoading } = useList(id);
  return { area: list, isLoading };
}

/**
 * Subscribe to sorted lists (ordered by listsSortOrder array)
 */
export function useSortedLists() {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateLists = () => {
      setLists(getSortedLists());
    };

    waitForSync().then(() => {
      updateLists();
      setIsLoading(false);
    });

    // Subscribe to both listsMap and listsSortOrder changes
    listsMap.observe(updateLists);
    listsSortOrder.observe(updateLists);

    return () => {
      listsMap.unobserve(updateLists);
      listsSortOrder.unobserve(updateLists);
    };
  }, []);

  return { lists, isLoading };
}

/**
 * Subscribe to all tags
 */
export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    waitForSync().then(() => {
      setTags(Array.from(tagsMap.values()));
      setIsLoading(false);
    });

    const observer = () => {
      setTags(Array.from(tagsMap.values()));
    };

    tagsMap.observe(observer);

    return () => {
      tagsMap.unobserve(observer);
    };
  }, []);

  return { tags, isLoading };
}

/**
 * Subscribe to headings for a list (project)
 */
export function useHeadings(listId: string | null) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!listId) {
      // Reset state when listId becomes null - done via separate effect
      return;
    }

    const updateHeadings = () => {
      const allHeadings = Array.from(headingsMap.values());
      const filtered = allHeadings
        .filter(h => h.listId === listId && !h.archived)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      setHeadings(filtered);
    };

    setIsLoading(true);
    waitForSync().then(() => {
      updateHeadings();
      setIsLoading(false);
    });

    headingsMap.observe(updateHeadings);

    return () => {
      headingsMap.unobserve(updateHeadings);
    };
  }, [listId]);

  // Reset state when listId becomes null
  useEffect(() => {
    if (!listId) {
      setHeadings([]);
      setIsLoading(false);
    }
  }, [listId]);

  return { headings, isLoading };
}

/**
 * Subscribe to checklist items for a task
 */
export function useChecklistItems(taskId: string | null) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      // Reset state when taskId becomes null - done via separate effect
      return;
    }

    const updateItems = () => {
      const allItems = Array.from(checklistItemsMap.values());
      const filtered = allItems
        .filter(item => item.taskId === taskId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      setItems(filtered);
    };

    setIsLoading(true);
    waitForSync().then(() => {
      updateItems();
      setIsLoading(false);
    });

    checklistItemsMap.observe(updateItems);

    return () => {
      checklistItemsMap.unobserve(updateItems);
    };
  }, [taskId]);

  // Reset state when taskId becomes null
  useEffect(() => {
    if (!taskId) {
      setItems([]);
      setIsLoading(false);
    }
  }, [taskId]);

  return { items, isLoading };
}
