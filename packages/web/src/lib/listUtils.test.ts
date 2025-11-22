import { describe, it, expect } from 'vitest';
import { parseListReference } from './listUtils';
import type { List } from '@tasky/shared';

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

describe('parseListReference', () => {
  const workProject = createMockList({ id: 'work-1', title: 'Work Project', type: 'project' });
  const homeArea = createMockList({ id: 'home-1', title: 'Home', type: 'area' });
  const personalProject = createMockList({ id: 'personal-1', title: 'Personal Development', type: 'project' });
  const teamProject = createMockList({ id: 'team-1', title: 'Team Collaboration', type: 'project' });

  const lists = [workProject, homeArea, personalProject, teamProject];

  describe('exact matches', () => {
    it('should match exact list title', () => {
      const result = parseListReference('Fix bug #home', lists);
      expect(result).not.toBeNull();
      expect(result?.list.id).toBe('home-1');
      expect(result?.list.title).toBe('Home');
      expect(result?.matchedText).toBe('#home');
      expect(result?.remainingText).toBe('Fix bug');
    });

    it('should match case-insensitively', () => {
      const result = parseListReference('Task #HOME', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Home');
    });
  });

  describe('starts with matches', () => {
    it('should match list starting with search term', () => {
      const result = parseListReference('Meeting #work', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Work Project');
      expect(result?.matchedText).toBe('#work');
      expect(result?.remainingText).toBe('Meeting');
    });

    it('should match partial word at start', () => {
      const result = parseListReference('Task #per', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Personal Development');
    });

    it('should match with multiple words', () => {
      const result = parseListReference('Review #personal', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Personal Development');
      expect(result?.matchedText).toBe('#personal');
      expect(result?.remainingText).toBe('Review');
    });
  });

  describe('contains matches', () => {
    it('should match list containing search term', () => {
      const result = parseListReference('Meeting #collab', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Team Collaboration');
      expect(result?.matchedText).toBe('#collab');
      expect(result?.remainingText).toBe('Meeting');
    });

    it('should match word in middle of title', () => {
      const result = parseListReference('Task #development', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Personal Development');
    });
  });

  describe('priority ordering', () => {
    it('should prefer exact match over starts with', () => {
      const exactList = createMockList({ id: 'exact-1', title: 'Work', type: 'project' });
      const startsWithList = createMockList({ id: 'starts-1', title: 'Work Project', type: 'project' });
      const testLists = [startsWithList, exactList];

      const result = parseListReference('Task #work', testLists);
      expect(result).not.toBeNull();
      expect(result?.list.id).toBe('exact-1');
      expect(result?.list.title).toBe('Work');
    });

    it('should prefer starts with over contains', () => {
      const startsWithList = createMockList({ id: 'starts-1', title: 'Home Renovation', type: 'project' });
      const containsList = createMockList({ id: 'contains-1', title: 'Buy Home Supplies', type: 'project' });
      const testLists = [containsList, startsWithList];

      const result = parseListReference('Task #home', testLists);
      expect(result).not.toBeNull();
      expect(result?.list.id).toBe('starts-1');
    });
  });

  describe('position handling', () => {
    it('should handle # at the beginning', () => {
      const result = parseListReference('#work Fix critical bug', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Work Project');
      expect(result?.remainingText).toBe('Fix critical bug');
    });

    it('should handle # at the end', () => {
      const result = parseListReference('Fix critical bug #work', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Work Project');
      expect(result?.remainingText).toBe('Fix critical bug');
    });

    it('should handle # in the middle', () => {
      const result = parseListReference('Fix #work critical bug', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Work Project');
      expect(result?.remainingText).toBe('Fix critical bug');
    });
  });

  describe('edge cases', () => {
    it('should return null for empty string', () => {
      const result = parseListReference('', lists);
      expect(result).toBeNull();
    });

    it('should return null if no # symbol', () => {
      const result = parseListReference('Fix bug work', lists);
      expect(result).toBeNull();
    });

    it('should return null if search term too short', () => {
      const result = parseListReference('Fix bug #w', lists);
      expect(result).toBeNull();
    });

    it('should return null if no matching list', () => {
      const result = parseListReference('Fix bug #nonexistent', lists);
      expect(result).toBeNull();
    });

    it('should return null for empty lists array', () => {
      const result = parseListReference('Fix bug #work', []);
      expect(result).toBeNull();
    });

    it('should handle multiple # symbols and use first', () => {
      const result = parseListReference('Fix #work bug #home', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Work Project');
      expect(result?.remainingText).toBe('Fix bug #home');
    });

    it('should handle whitespace around #', () => {
      const result = parseListReference('Fix bug  #work  task', lists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Work Project');
    });

    it('should handle numbers in search term', () => {
      const projectWithNumber = createMockList({ id: 'q4-1', title: 'Q4 Goals', type: 'project' });
      const testLists = [...lists, projectWithNumber];

      const result = parseListReference('Review #q4', testLists);
      expect(result).not.toBeNull();
      expect(result?.list.title).toBe('Q4 Goals');
    });
  });

  describe('project vs area distinction', () => {
    it('should correctly identify project type', () => {
      const result = parseListReference('Task #work', lists);
      expect(result).not.toBeNull();
      expect(result?.list.type).toBe('project');
    });

    it('should correctly identify area type', () => {
      const result = parseListReference('Task #home', lists);
      expect(result).not.toBeNull();
      expect(result?.list.type).toBe('area');
    });
  });
});
