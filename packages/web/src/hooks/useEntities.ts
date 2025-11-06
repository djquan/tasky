import { useEffect, useState } from 'react';
import type { Task, Project, Area, Tag, Heading, ChecklistItem } from '@tasky/shared';
import {
  tasksMap,
  projectsMap,
  areasMap,
  tagsMap,
  headingsMap,
  checklistItemsMap,
  waitForSync
} from '../lib/yjs';

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
      setTask(null);
      setIsLoading(false);
      return;
    }

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

  return { task, isLoading };
}

/**
 * Subscribe to all projects
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    waitForSync().then(() => {
      setProjects(Array.from(projectsMap.values()));
      setIsLoading(false);
    });

    const observer = () => {
      setProjects(Array.from(projectsMap.values()));
    };

    projectsMap.observe(observer);

    return () => {
      projectsMap.unobserve(observer);
    };
  }, []);

  return { projects, isLoading };
}

/**
 * Subscribe to a single project
 */
export function useProject(id: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setProject(null);
      setIsLoading(false);
      return;
    }

    waitForSync().then(() => {
      setProject(projectsMap.get(id) || null);
      setIsLoading(false);
    });

    const observer = () => {
      setProject(projectsMap.get(id) || null);
    };

    projectsMap.observe(observer);

    return () => {
      projectsMap.unobserve(observer);
    };
  }, [id]);

  return { project, isLoading };
}

/**
 * Subscribe to all areas
 */
export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    waitForSync().then(() => {
      setAreas(Array.from(areasMap.values()));
      setIsLoading(false);
    });

    const observer = () => {
      setAreas(Array.from(areasMap.values()));
    };

    areasMap.observe(observer);

    return () => {
      areasMap.unobserve(observer);
    };
  }, []);

  return { areas, isLoading };
}

/**
 * Subscribe to a single area
 */
export function useArea(id: string | null) {
  const [area, setArea] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setArea(null);
      setIsLoading(false);
      return;
    }

    waitForSync().then(() => {
      setArea(areasMap.get(id) || null);
      setIsLoading(false);
    });

    const observer = () => {
      setArea(areasMap.get(id) || null);
    };

    areasMap.observe(observer);

    return () => {
      areasMap.unobserve(observer);
    };
  }, [id]);

  return { area, isLoading };
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
 * Subscribe to headings for a project
 */
export function useHeadings(projectId: string | null) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setHeadings([]);
      setIsLoading(false);
      return;
    }

    const updateHeadings = () => {
      const allHeadings = Array.from(headingsMap.values());
      const filtered = allHeadings
        .filter(h => h.projectId === projectId && !h.archived)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      setHeadings(filtered);
    };

    waitForSync().then(() => {
      updateHeadings();
      setIsLoading(false);
    });

    headingsMap.observe(updateHeadings);

    return () => {
      headingsMap.unobserve(updateHeadings);
    };
  }, [projectId]);

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
      setItems([]);
      setIsLoading(false);
      return;
    }

    const updateItems = () => {
      const allItems = Array.from(checklistItemsMap.values());
      const filtered = allItems
        .filter(item => item.taskId === taskId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      setItems(filtered);
    };

    waitForSync().then(() => {
      updateItems();
      setIsLoading(false);
    });

    checklistItemsMap.observe(updateItems);

    return () => {
      checklistItemsMap.unobserve(updateItems);
    };
  }, [taskId]);

  return { items, isLoading };
}
