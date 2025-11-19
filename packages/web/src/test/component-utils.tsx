/**
 * React Component Test Utilities
 *
 * Helper functions for testing React components with common providers and wrappers.
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import type { Task, List, Tag } from '@tasky/shared';

/**
 * Custom render function that wraps components with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // For now, just use the standard render
  // In the future, this can include context providers like NavigationProvider
  return render(ui, options);
}

/**
 * Creates a mock task for testing
 */
export function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: 'task-1',
    title: 'Test Task',
    notes: '',
    when: 'anytime',
    scheduledDate: null,
    deadline: null,
    tags: [],
    checklistItems: [],
    listId: null,
    headingId: null,
    completed: false,
    canceled: false,
    createdAt: Date.now(),
    completedAt: null,
    updatedAt: Date.now(),
    sortOrder: Date.now(),
    ...overrides,
  };
}

/**
 * Creates a mock list for testing
 */
export function createMockList(overrides?: Partial<List>): List {
  return {
    id: 'list-1',
    type: 'project',
    title: 'Test Project',
    notes: '',
    when: 'anytime',
    scheduledDate: null,
    deadline: null,
    parentListId: null,
    tags: [],
    completed: false,
    canceled: false,
    createdAt: Date.now(),
    completedAt: null,
    updatedAt: Date.now(),
    sortOrder: Date.now(),
    ...overrides,
  };
}

/**
 * Creates a mock tag for testing
 */
export function createMockTag(overrides?: Partial<Tag>): Tag {
  return {
    id: 'tag-1',
    name: 'Test Tag',
    parentId: null,
    color: '#3b82f6',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sortOrder: Date.now(),
    ...overrides,
  };
}

/**
 * Waits for the next tick (useful for async state updates)
 */
export function nextTick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}
