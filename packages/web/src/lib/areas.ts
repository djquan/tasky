import { generateId, now, type Area, type AreaInput } from '@tasky/shared';
import { areasMap, areasSortOrder, areaTaskSortOrders } from './yjs';

/**
 * Create a new area
 */
export function createArea(input: Partial<AreaInput>): Area {
  const id = generateId();
  const timestamp = now();

  const area: Area = {
    id,
    title: input.title || '',
    tags: input.tags || [],
    createdAt: timestamp,
    updatedAt: timestamp,
    sortOrder: input.sortOrder || timestamp
  };

  areasMap.set(id, area);
  areasSortOrder.push([id]);

  // Initialize empty task sort order for this area
  areaTaskSortOrders.set(id, []);

  return area;
}

/**
 * Get an area by ID
 */
export function getArea(id: string): Area | undefined {
  return areasMap.get(id);
}

/**
 * Update an area
 */
export function updateArea(id: string, updates: Partial<Area>): void {
  const area = areasMap.get(id);
  if (!area) return;

  const updated: Area = {
    ...area,
    ...updates,
    updatedAt: now()
  };

  areasMap.set(id, updated);
}

/**
 * Delete an area
 */
export function deleteArea(id: string): void {
  const area = areasMap.get(id);
  if (!area) return;

  // Remove from sort order
  const sortArray = areasSortOrder.toArray();
  const index = sortArray.indexOf(id);
  if (index !== -1) {
    areasSortOrder.delete(index, 1);
  }

  // Remove task sort order
  areaTaskSortOrders.delete(id);

  // Delete the area
  areasMap.delete(id);

  // Note: Projects and tasks with this areaId will need to be handled
  // by the caller (either deleted or moved to null area)
}
