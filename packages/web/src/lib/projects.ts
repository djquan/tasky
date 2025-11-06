import { generateId, now, type Project, type ProjectInput } from '@tasky/shared';
import { projectsMap, projectsSortOrder, projectTaskSortOrders } from './yjs';

/**
 * Create a new project
 */
export function createProject(input: Partial<ProjectInput>): Project {
  const id = generateId();
  const timestamp = now();

  const project: Project = {
    id,
    title: input.title || '',
    notes: input.notes || '',
    when: input.when || 'anytime',
    scheduledDate: input.scheduledDate ?? null,
    deadline: input.deadline ?? null,
    areaId: input.areaId ?? null,
    tags: input.tags || [],
    completed: input.completed || false,
    canceled: input.canceled || false,
    createdAt: timestamp,
    completedAt: null,
    updatedAt: timestamp,
    sortOrder: input.sortOrder || timestamp
  };

  projectsMap.set(id, project);
  projectsSortOrder.push([id]);

  // Initialize empty task sort order for this project
  projectTaskSortOrders.set(id, []);

  return project;
}

/**
 * Get a project by ID
 */
export function getProject(id: string): Project | undefined {
  return projectsMap.get(id);
}

/**
 * Update a project
 */
export function updateProject(id: string, updates: Partial<Project>): void {
  const project = projectsMap.get(id);
  if (!project) return;

  const updated: Project = {
    ...project,
    ...updates,
    updatedAt: now()
  };

  projectsMap.set(id, updated);
}

/**
 * Delete a project and all its tasks
 */
export function deleteProject(id: string): void {
  const project = projectsMap.get(id);
  if (!project) return;

  // Remove from sort order
  const sortArray = projectsSortOrder.toArray();
  const index = sortArray.indexOf(id);
  if (index !== -1) {
    projectsSortOrder.delete(index, 1);
  }

  // Remove task sort order
  projectTaskSortOrders.delete(id);

  // Delete the project
  projectsMap.delete(id);

  // Note: Tasks with this projectId will need to be handled separately
  // by the caller (either deleted or moved to inbox)
}

/**
 * Complete a project
 */
export function completeProject(id: string): void {
  const project = projectsMap.get(id);
  if (!project) return;

  const timestamp = now();
  const updated: Project = {
    ...project,
    completed: true,
    completedAt: timestamp,
    updatedAt: timestamp
  };

  projectsMap.set(id, updated);
}

/**
 * Cancel a project
 */
export function cancelProject(id: string): void {
  const project = projectsMap.get(id);
  if (!project) return;

  const timestamp = now();
  const updated: Project = {
    ...project,
    canceled: true,
    completedAt: timestamp,
    updatedAt: timestamp
  };

  projectsMap.set(id, updated);
}
