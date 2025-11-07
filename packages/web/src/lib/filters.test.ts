import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Task, List } from '@tasky/shared';
import * as filters from './filters';
import * as yjs from './yjs';

// Mock yjs module
vi.mock('./yjs');

// Helper to create mock tasks
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-' + Math.random(),
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

// Helper to create mock lists
function createMockList(overrides: Partial<List> = {}): List {
  return {
    id: 'list-' + Math.random(),
    type: 'project',
    title: 'Test List',
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

// Get timestamps for testing
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
const tomorrow = today + 24 * 60 * 60 * 1000;
const yesterday = today - 24 * 60 * 60 * 1000;
const nextWeek = today + 7 * 24 * 60 * 60 * 1000;

describe('filters.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInboxTasks', () => {
    it('should return tasks with no list, no dates, and when=anytime', () => {
      const tasks = [
        createMockTask({ when: 'anytime', listId: null }),
        createMockTask({ when: 'anytime', listId: 'list-1' }), // has list - excluded
        createMockTask({ when: 'today' }), // today - excluded
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getInboxTasks();
      
      expect(result).toHaveLength(1);
      expect(result[0].listId).toBeNull();
      expect(result[0].when).toBe('anytime');
    });

    it('should exclude tasks with scheduledDate', () => {
      const tasks = [
        createMockTask({ when: 'anytime', scheduledDate: today }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getInboxTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should exclude tasks with deadline', () => {
      const tasks = [
        createMockTask({ when: 'anytime', deadline: today }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getInboxTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should exclude completed and canceled tasks', () => {
      const tasks = [
        createMockTask({ when: 'anytime', completed: true }),
        createMockTask({ when: 'anytime', canceled: true }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getInboxTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should exclude someday tasks', () => {
      const tasks = [
        createMockTask({ when: 'someday' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getInboxTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should sort by createdAt newest first', () => {
      const tasks = [
        createMockTask({ when: 'anytime', createdAt: 1000 }),
        createMockTask({ when: 'anytime', createdAt: 3000 }),
        createMockTask({ when: 'anytime', createdAt: 2000 }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getInboxTasks();
      
      expect(result[0].createdAt).toBe(3000);
      expect(result[1].createdAt).toBe(2000);
      expect(result[2].createdAt).toBe(1000);
    });
  });

  describe('getTodayTasks', () => {
    it('should return tasks with when=today', () => {
      const tasks = [
        createMockTask({ when: 'today' }),
        createMockTask({ when: 'anytime' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getTodayTasks();
      
      expect(result).toHaveLength(1);
      expect(result[0].when).toBe('today');
    });

    it('should return tasks with when=evening', () => {
      const tasks = [
        createMockTask({ when: 'evening' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getTodayTasks();
      
      expect(result).toHaveLength(1);
      expect(result[0].when).toBe('evening');
    });

    it('should return tasks with scheduledDate today', () => {
      const tasks = [
        createMockTask({ when: 'anytime', scheduledDate: today + 1000 }), // same day
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getTodayTasks();
      
      expect(result).toHaveLength(1);
    });

    it('should return tasks with deadline today', () => {
      const tasks = [
        createMockTask({ when: 'anytime', deadline: today + 1000 }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getTodayTasks();
      
      expect(result).toHaveLength(1);
    });

    it('should return tasks with overdue deadline', () => {
      const tasks = [
        createMockTask({ when: 'anytime', deadline: yesterday }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getTodayTasks();
      
      expect(result).toHaveLength(1);
    });

    it('should exclude completed and canceled tasks', () => {
      const tasks = [
        createMockTask({ when: 'today', completed: true }),
        createMockTask({ when: 'today', canceled: true }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getTodayTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should sort evening tasks to bottom', () => {
      const tasks = [
        createMockTask({ when: 'today', createdAt: 1000 }),
        createMockTask({ when: 'evening', createdAt: 2000 }),
        createMockTask({ when: 'today', createdAt: 3000 }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getTodayTasks();
      
      expect(result[0].when).toBe('today');
      expect(result[1].when).toBe('today');
      expect(result[2].when).toBe('evening');
    });

    it('should sort by deadline first', () => {
      const tasks = [
        createMockTask({ when: 'today', deadline: tomorrow }),
        createMockTask({ when: 'today', deadline: today }),
        createMockTask({ when: 'today' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getTodayTasks();
      
      expect(result[0].deadline).toBe(today);
      expect(result[1].deadline).toBe(tomorrow);
      expect(result[2].deadline).toBeNull();
    });
  });

  describe('getThisEveningTasks', () => {
    it('should return only evening tasks from today', () => {
      const tasks = [
        createMockTask({ when: 'today' }),
        createMockTask({ when: 'evening' }),
        createMockTask({ when: 'anytime' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getThisEveningTasks();
      
      expect(result).toHaveLength(1);
      expect(result[0].when).toBe('evening');
    });
  });

  describe('getAnytimeTasks', () => {
    it('should return tasks with listId and when=anytime', () => {
      const tasks = [
        createMockTask({ when: 'anytime', listId: 'list-1' }),
        createMockTask({ when: 'anytime', listId: null }), // no list - excluded
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getAnytimeTasks();
      
      expect(result).toHaveLength(1);
      expect(result[0].listId).toBe('list-1');
    });

    it('should exclude tasks without listId', () => {
      const tasks = [
        createMockTask({ when: 'anytime', listId: null }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getAnytimeTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should exclude someday tasks', () => {
      const tasks = [
        createMockTask({ when: 'someday', listId: 'list-1' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getAnytimeTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should exclude today/evening tasks', () => {
      const tasks = [
        createMockTask({ when: 'today', listId: 'list-1' }),
        createMockTask({ when: 'evening', listId: 'list-1' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getAnytimeTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should exclude future scheduled tasks', () => {
      const tasks = [
        createMockTask({ when: 'anytime', listId: 'list-1', scheduledDate: nextWeek }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getAnytimeTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should exclude future deadline tasks', () => {
      const tasks = [
        createMockTask({ when: 'anytime', listId: 'list-1', deadline: nextWeek }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getAnytimeTasks();
      
      expect(result).toHaveLength(0);
    });
  });

  describe('getSomedayTasks', () => {
    it('should return tasks with when=someday', () => {
      const tasks = [
        createMockTask({ when: 'someday' }),
        createMockTask({ when: 'anytime' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getSomedayTasks();
      
      expect(result).toHaveLength(1);
      expect(result[0].when).toBe('someday');
    });

    it('should exclude completed and canceled tasks', () => {
      const tasks = [
        createMockTask({ when: 'someday', completed: true }),
        createMockTask({ when: 'someday', canceled: true }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getSomedayTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should sort by createdAt newest first', () => {
      const tasks = [
        createMockTask({ when: 'someday', createdAt: 1000 }),
        createMockTask({ when: 'someday', createdAt: 3000 }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getSomedayTasks();
      
      expect(result[0].createdAt).toBe(3000);
    });
  });

  describe('getUpcomingTasks', () => {
    it('should return tasks with future scheduledDate', () => {
      const tasks = [
        createMockTask({ scheduledDate: nextWeek }),
        createMockTask({ scheduledDate: today }), // today - excluded
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getUpcomingTasks();
      
      expect(result).toHaveLength(1);
      expect(result[0].scheduledDate).toBe(nextWeek);
    });

    it('should return tasks with future deadline', () => {
      const tasks = [
        createMockTask({ deadline: nextWeek }),
        createMockTask({ deadline: today }), // today - excluded
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getUpcomingTasks();
      
      expect(result).toHaveLength(1);
      expect(result[0].deadline).toBe(nextWeek);
    });

    it('should exclude completed and canceled tasks', () => {
      const tasks = [
        createMockTask({ scheduledDate: nextWeek, completed: true }),
        createMockTask({ deadline: nextWeek, canceled: true }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getUpcomingTasks();
      
      expect(result).toHaveLength(0);
    });

    it('should sort by earliest date', () => {
      const tasks = [
        createMockTask({ scheduledDate: nextWeek + 1000 }),
        createMockTask({ deadline: tomorrow }),
        createMockTask({ scheduledDate: nextWeek }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getUpcomingTasks();
      
      expect(result[0].deadline).toBe(tomorrow);
      expect(result[1].scheduledDate).toBe(nextWeek);
    });
  });

  describe('getLogbookTasks', () => {
    it('should return completed tasks', () => {
      const tasks = [
        createMockTask({ completed: true }),
        createMockTask({ completed: false }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getLogbookTasks();
      
      expect(result).toHaveLength(1);
      expect(result[0].completed).toBe(true);
    });

    it('should exclude canceled tasks (those go to trash)', () => {
      const tasks = [
        createMockTask({ completed: true, canceled: false }),
        createMockTask({ completed: false, canceled: true }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getLogbookTasks();
      
      expect(result).toHaveLength(1);
      expect(result[0].completed).toBe(true);
      expect(result[0].canceled).toBe(false);
    });

    it('should sort by completedAt newest first', () => {
      const tasks = [
        createMockTask({ completed: true, completedAt: 1000 }),
        createMockTask({ completed: true, completedAt: 3000 }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getLogbookTasks();
      
      expect(result[0].completedAt).toBe(3000);
    });
  });

  describe('getListTasks', () => {
    it('should return tasks for specific listId', () => {
      const tasks = [
        createMockTask({ listId: 'list-1' }),
        createMockTask({ listId: 'list-2' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getListTasks('list-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].listId).toBe('list-1');
    });

    it('should exclude canceled tasks', () => {
      const tasks = [
        createMockTask({ listId: 'list-1', canceled: true }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getListTasks('list-1');
      
      expect(result).toHaveLength(0);
    });

    it('should sort by sortOrder', () => {
      const tasks = [
        createMockTask({ listId: 'list-1', sortOrder: 300 }),
        createMockTask({ listId: 'list-1', sortOrder: 100 }),
        createMockTask({ listId: 'list-1', sortOrder: 200 }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getListTasks('list-1');
      
      expect(result[0].sortOrder).toBe(100);
      expect(result[1].sortOrder).toBe(200);
      expect(result[2].sortOrder).toBe(300);
    });
  });

  describe('getChildLists', () => {
    it('should return lists with matching parentListId', () => {
      const lists = [
        createMockList({ parentListId: 'area-1' }),
        createMockList({ parentListId: 'area-2' }),
      ];
      vi.mocked(yjs.getAllLists).mockReturnValue(lists);

      const result = filters.getChildLists('area-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].parentListId).toBe('area-1');
    });

    it('should exclude completed and canceled lists', () => {
      const lists = [
        createMockList({ parentListId: 'area-1', completed: true }),
        createMockList({ parentListId: 'area-1', canceled: true }),
      ];
      vi.mocked(yjs.getAllLists).mockReturnValue(lists);

      const result = filters.getChildLists('area-1');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('getTasksByTag', () => {
    it('should return tasks with specific tag', () => {
      const tasks = [
        createMockTask({ tags: ['tag-1', 'tag-2'] }),
        createMockTask({ tags: ['tag-2'] }),
        createMockTask({ tags: [] }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getTasksByTag('tag-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('tag-1');
    });

    it('should exclude completed and canceled tasks', () => {
      const tasks = [
        createMockTask({ tags: ['tag-1'], completed: true }),
        createMockTask({ tags: ['tag-1'], canceled: true }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getTasksByTag('tag-1');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('getActiveLists', () => {
    it('should return all active lists', () => {
      const lists = [
        createMockList({ type: 'project' }),
        createMockList({ type: 'area' }),
        createMockList({ type: 'project', completed: true }),
      ];
      vi.mocked(yjs.getAllLists).mockReturnValue(lists);

      const result = filters.getActiveLists();
      
      expect(result).toHaveLength(2);
    });

    it('should filter by type when specified', () => {
      const lists = [
        createMockList({ type: 'project' }),
        createMockList({ type: 'area' }),
      ];
      vi.mocked(yjs.getAllLists).mockReturnValue(lists);

      const result = filters.getActiveLists('project');
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('project');
    });
  });

  describe('getCompletedLists', () => {
    it('should return completed and canceled lists', () => {
      const lists = [
        createMockList({ completed: true }),
        createMockList({ canceled: true }),
        createMockList({ completed: false }),
      ];
      vi.mocked(yjs.getAllLists).mockReturnValue(lists);

      const result = filters.getCompletedLists();
      
      expect(result).toHaveLength(2);
    });
  });

  describe('getSmartListCounts', () => {
    it('should count inbox tasks correctly', () => {
      const tasks = [
        createMockTask({ when: 'anytime', listId: null }),
        createMockTask({ when: 'anytime', listId: null }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getSmartListCounts();
      
      expect(result.inbox).toBe(2);
    });

    it('should count today tasks correctly', () => {
      const tasks = [
        createMockTask({ when: 'today' }),
        createMockTask({ when: 'evening' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getSmartListCounts();
      
      expect(result.today).toBe(2);
    });

    it('should count logbook tasks correctly (completed but not canceled)', () => {
      const tasks = [
        createMockTask({ completed: true }),
        createMockTask({ completed: true }),
        createMockTask({ canceled: true }), // goes to trash, not logbook
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getSmartListCounts();
      
      expect(result.logbook).toBe(2);
      expect(result.trash).toBe(1);
    });

    it('should not double-count tasks', () => {
      const tasks = [
        createMockTask({ when: 'today' }),
        createMockTask({ when: 'anytime', listId: 'list-1' }),
      ];
      vi.mocked(yjs.getAllTasks).mockReturnValue(tasks);

      const result = filters.getSmartListCounts();
      
      const total = result.inbox + result.today + result.anytime + result.someday + result.upcoming;
      expect(total).toBe(2);
    });
  });
});
