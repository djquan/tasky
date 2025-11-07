import { generateId, now, type Heading, type HeadingInput } from '@tasky/shared';
import { headingsMap } from './yjs';

/**
 * Create a new heading
 */
export function createHeading(input: Partial<HeadingInput>): Heading {
  const id = generateId();
  const timestamp = now();

  const heading: Heading = {
    id,
    title: input.title || '',
    listId: input.listId || '',
    archived: input.archived || false,
    createdAt: timestamp,
    updatedAt: timestamp,
    sortOrder: input.sortOrder || timestamp
  };

  headingsMap.set(id, heading);

  return heading;
}

/**
 * Get a heading by ID
 */
export function getHeading(id: string): Heading | undefined {
  return headingsMap.get(id);
}

/**
 * Get all headings for a list (project)
 */
export function getListHeadings(listId: string): Heading[] {
  const headings = Array.from(headingsMap.values());
  return headings
    .filter(h => h.listId === listId && !h.archived)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// Legacy function name
export const getProjectHeadings = getListHeadings;

/**
 * Update a heading
 */
export function updateHeading(id: string, updates: Partial<Heading>): void {
  const heading = headingsMap.get(id);
  if (!heading) {
    console.warn(`[updateHeading] Heading not found: ${id}`);
    return;
  }

  const updated: Heading = {
    ...heading,
    ...updates,
    updatedAt: now()
  };

  headingsMap.set(id, updated);
}

/**
 * Delete a heading
 */
export function deleteHeading(id: string): void {
  headingsMap.delete(id);

  // Note: Tasks with this headingId will need to be updated
  // by the caller to set headingId to null
}

/**
 * Archive a heading
 */
export function archiveHeading(id: string): void {
  const heading = headingsMap.get(id);
  if (!heading) {
    console.warn(`[archiveHeading] Heading not found: ${id}`);
    return;
  }

  const updated: Heading = {
    ...heading,
    archived: true,
    updatedAt: now()
  };

  headingsMap.set(id, updated);
}
