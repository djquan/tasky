import { generateId, now, type Heading, type HeadingInput } from '@tasky/shared';
import { headingsMap } from './yjs';
import { undoManager } from './undo';
import {
  CreateHeadingCommand,
  UpdateHeadingCommand,
  DeleteHeadingCommand,
  ArchiveHeadingCommand
} from './undo/commands/heading';

/**
 * Internal implementation - create heading without undo tracking
 */
function _createHeadingInternal(input: Partial<HeadingInput>): Heading {
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
 * Create a new heading
 */
export function createHeading(input: Partial<HeadingInput>): Heading {
  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    return _createHeadingInternal(input);
  }

  // Create heading object but don't add to map yet - command will do that
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

  const command = new CreateHeadingCommand(heading);
  undoManager.execute(command);
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
 * Internal implementation - update heading without undo tracking
 */
function _updateHeadingInternal(id: string, updates: Partial<Heading>): void {
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
 * Update a heading
 */
export function updateHeading(id: string, updates: Partial<Heading>): void {
  const heading = headingsMap.get(id);
  if (!heading) {
    console.warn(`[updateHeading] Heading not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _updateHeadingInternal(id, updates);
    return;
  }

  const oldHeading = { ...heading };
  const command = new UpdateHeadingCommand(oldHeading, updates);
  undoManager.execute(command);
}

/**
 * Internal implementation - delete heading without undo tracking
 */
function _deleteHeadingInternal(id: string): void {
  headingsMap.delete(id);
}

/**
 * Delete a heading
 */
export function deleteHeading(id: string): void {
  const heading = headingsMap.get(id);
  if (!heading) {
    console.warn(`[deleteHeading] Heading not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _deleteHeadingInternal(id);
    return;
  }

  const command = new DeleteHeadingCommand(heading);
  undoManager.execute(command);
}

/**
 * Internal implementation - archive heading without undo tracking
 */
function _archiveHeadingInternal(id: string): void {
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

/**
 * Archive a heading
 */
export function archiveHeading(id: string): void {
  const heading = headingsMap.get(id);
  if (!heading) {
    console.warn(`[archiveHeading] Heading not found: ${id}`);
    return;
  }

  if (undoManager.getIsUndoing() || undoManager.getIsRedoing()) {
    _archiveHeadingInternal(id);
    return;
  }

  const command = new ArchiveHeadingCommand(heading);
  undoManager.execute(command);
}
