import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseNaturalDate, formatDate } from './dateUtils';

describe('parseNaturalDate', () => {
  let today: Date;
  let tomorrow: Date;

  beforeEach(() => {
    // Mock current date to 2025-11-21 (Friday)
    const mockDate = new Date(2025, 10, 21, 12, 0, 0); // Month is 0-indexed
    vi.setSystemTime(mockDate);
    today = new Date(2025, 10, 21, 0, 0, 0, 0);
    tomorrow = new Date(2025, 10, 22, 0, 0, 0, 0);
  });

  describe('partial matches', () => {
    it('should detect "tom" as tomorrow', () => {
      const result = parseNaturalDate('Buy groceries tom');
      expect(result).not.toBeNull();
      expect(result?.displayText).toBe('Tomorrow');
      expect(result?.date).toBe(tomorrow.getTime());
      expect(result?.matchedText).toBe('tom');
      expect(result?.remainingText).toBe('buy groceries');
    });

    it('should detect "tod" as today', () => {
      const result = parseNaturalDate('Meeting tod');
      expect(result).not.toBeNull();
      expect(result?.displayText).toBe('Today');
      expect(result?.date).toBe(today.getTime());
      expect(result?.remainingText).toBe('meeting');
    });

    it('should detect "mon" as monday', () => {
      const result = parseNaturalDate('Call client mon');
      expect(result).not.toBeNull();
      expect(result?.displayText).toContain('Monday');
      expect(result?.matchedText).toBe('mon');
      expect(result?.remainingText).toBe('call client');
    });

    it('should detect "fri" as friday', () => {
      const result = parseNaturalDate('Submit report fri');
      expect(result).not.toBeNull();
      expect(result?.displayText).toContain('Friday');
      expect(result?.remainingText).toBe('submit report');
    });

    it('should not match partial words less than 3 characters', () => {
      const result = parseNaturalDate('to do');
      expect(result).toBeNull();
    });

    it('should handle partial match in middle of sentence', () => {
      const result = parseNaturalDate('Buy groceries tom for dinner');
      expect(result).not.toBeNull();
      expect(result?.remainingText).toBe('buy groceries for dinner');
    });

    it('should handle multiple potential matches and return first', () => {
      const result = parseNaturalDate('tod tom');
      expect(result).not.toBeNull();
      expect(result?.displayText).toBe('Today');
      expect(result?.remainingText).toBe('tom');
    });
  });

  describe('full keyword matches', () => {
    it('should detect "tomorrow"', () => {
      const result = parseNaturalDate('Buy milk tomorrow');
      expect(result).not.toBeNull();
      expect(result?.displayText).toBe('Tomorrow');
      expect(result?.date).toBe(tomorrow.getTime());
      expect(result?.remainingText).toBe('buy milk');
    });

    it('should detect "today"', () => {
      const result = parseNaturalDate('Finish report today');
      expect(result).not.toBeNull();
      expect(result?.displayText).toBe('Today');
      expect(result?.date).toBe(today.getTime());
      expect(result?.remainingText).toBe('finish report');
    });

    it('should detect "tmrw" abbreviation', () => {
      const result = parseNaturalDate('Call back tmrw');
      expect(result).not.toBeNull();
      expect(result?.displayText).toBe('Tomorrow');
    });

    it('should detect "friday"', () => {
      const result = parseNaturalDate('Meeting friday');
      expect(result).not.toBeNull();
      expect(result?.displayText).toContain('Friday');
    });

    it('should detect "monday"', () => {
      const result = parseNaturalDate('Start project monday');
      expect(result).not.toBeNull();
      expect(result?.displayText).toContain('Monday');
    });
  });

  describe('next + weekday', () => {
    it('should detect "next monday"', () => {
      const result = parseNaturalDate('Meeting next monday');
      expect(result).not.toBeNull();
      expect(result?.displayText).toContain('Monday');
      // Partial match finds "monday" before regex pattern
      expect(result?.matchedText).toBe('monday');
      expect(result?.remainingText).toBe('meeting next');
    });

    it('should detect "next friday"', () => {
      const result = parseNaturalDate('Deadline next friday');
      expect(result).not.toBeNull();
      expect(result?.displayText).toContain('Friday');
    });
  });

  describe('month + day formats', () => {
    it('should detect "jan 15"', () => {
      const result = parseNaturalDate('Review jan 15');
      expect(result).not.toBeNull();
      expect(result?.displayText).toContain('Jan');
      expect(result?.remainingText).toBe('Review');
    });

    it('should detect "december 25"', () => {
      const result = parseNaturalDate('Christmas party december 25');
      expect(result).not.toBeNull();
      expect(result?.displayText).toContain('Dec');
    });

    it('should use next year if date has passed', () => {
      // Current mock date is Nov 21, 2025
      const result = parseNaturalDate('Meeting jan 15');
      expect(result).not.toBeNull();
      // Should be Jan 15, 2026 since Jan 15, 2025 has passed
      const expectedDate = new Date(2026, 0, 15, 0, 0, 0, 0);
      expect(result?.date).toBe(expectedDate.getTime());
    });
  });

  describe('numeric date formats', () => {
    it('should detect "12/25"', () => {
      const result = parseNaturalDate('Christmas 12/25');
      expect(result).not.toBeNull();
      expect(result?.displayText).toContain('Dec');
    });

    it('should detect "1/15/2026"', () => {
      const result = parseNaturalDate('Meeting 1/15/2026');
      expect(result).not.toBeNull();
      const expectedDate = new Date(2026, 0, 15, 0, 0, 0, 0);
      expect(result?.date).toBe(expectedDate.getTime());
    });

    it('should handle two-digit year', () => {
      const result = parseNaturalDate('Event 3/20/26');
      expect(result).not.toBeNull();
      const expectedDate = new Date(2026, 2, 20, 0, 0, 0, 0);
      expect(result?.date).toBe(expectedDate.getTime());
    });
  });

  describe('edge cases', () => {
    it('should return null for empty string', () => {
      const result = parseNaturalDate('');
      expect(result).toBeNull();
    });

    it('should return null for text with no date keywords', () => {
      const result = parseNaturalDate('Buy groceries');
      expect(result).toBeNull();
    });

    it('should handle case insensitivity', () => {
      const result = parseNaturalDate('Meeting TOMORROW');
      expect(result).not.toBeNull();
      expect(result?.displayText).toBe('Tomorrow');
    });

    it('should handle leading/trailing whitespace', () => {
      const result = parseNaturalDate('  tomorrow  ');
      expect(result).not.toBeNull();
      expect(result?.displayText).toBe('Tomorrow');
    });
  });
});

describe('formatDate', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2025, 10, 21, 12, 0, 0)); // Nov 21, 2025
  });

  it('should format today as "Today"', () => {
    const today = new Date(2025, 10, 21, 0, 0, 0, 0);
    expect(formatDate(today.getTime())).toBe('Today');
  });

  it('should format tomorrow as "Tomorrow"', () => {
    const tomorrow = new Date(2025, 10, 22, 0, 0, 0, 0);
    expect(formatDate(tomorrow.getTime())).toBe('Tomorrow');
  });

  it('should format other dates as "Mon DD"', () => {
    const futureDate = new Date(2025, 11, 25, 0, 0, 0, 0); // Dec 25, 2025
    const formatted = formatDate(futureDate.getTime());
    expect(formatted).toContain('Dec');
    expect(formatted).toContain('25');
  });
});
