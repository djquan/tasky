import { describe, it, expect } from 'vitest';
import { getNextOccurrenceTimestamp } from './recurrence';
import type { RecurrenceRule } from './types';

describe('getNextOccurrenceTimestamp', () => {
  const createDate = (str: string) => new Date(str).getTime();
  
  // Helper to format date for easier debugging
  const fmt = (ts: number | null) => ts ? new Date(ts).toISOString().split('T')[0] : 'null';

  it('calculates next daily occurrence', () => {
    const base = createDate('2024-01-01T10:00:00Z');
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1 };
    
    // Next day
    const next = getNextOccurrenceTimestamp(base, rule, base);
    expect(fmt(next)).toBe('2024-01-02');
  });

  it('calculates next weekly occurrence', () => {
    const base = createDate('2024-01-01T10:00:00Z'); // Monday
    const rule: RecurrenceRule = { frequency: 'weekly', interval: 1 };
    
    const next = getNextOccurrenceTimestamp(base, rule, base);
    expect(fmt(next)).toBe('2024-01-08'); // Next Monday
  });

  it('calculates next monthly occurrence', () => {
    const base = createDate('2024-01-01T10:00:00Z');
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1 };
    
    const next = getNextOccurrenceTimestamp(base, rule, base);
    expect(fmt(next)).toBe('2024-02-01');
  });

  it('handles monthly end-of-month edge cases (Jan 31 -> Feb 29 in leap year)', () => {
    const base = createDate('2024-01-31T10:00:00Z'); // 2024 is a leap year
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1 };
    
    const next = getNextOccurrenceTimestamp(base, rule, base);
    expect(fmt(next)).toBe('2024-02-29');
  });

  it('handles monthly end-of-month edge cases (Jan 31 -> Feb 28 in non-leap year)', () => {
    const base = createDate('2023-01-31T10:00:00Z'); // 2023 is not a leap year
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1 };
    
    const next = getNextOccurrenceTimestamp(base, rule, base);
    expect(fmt(next)).toBe('2023-02-28');
  });

  it('calculates next yearly occurrence', () => {
    const base = createDate('2024-01-01T10:00:00Z');
    const rule: RecurrenceRule = { frequency: 'yearly', interval: 1 };
    
    const next = getNextOccurrenceTimestamp(base, rule, base);
    expect(fmt(next)).toBe('2025-01-01');
  });

  it('calculates weekdays (skipping weekend)', () => {
    // Friday -> Monday
    const friday = createDate('2024-01-05T10:00:00Z');
    const rule: RecurrenceRule = { frequency: 'weekdays', interval: 1 };
    
    const next = getNextOccurrenceTimestamp(friday, rule, friday);
    expect(fmt(next)).toBe('2024-01-08'); // Monday
  });

  it('respects interval > 1', () => {
    const base = createDate('2024-01-01T10:00:00Z');
    const rule: RecurrenceRule = { frequency: 'daily', interval: 2 };
    
    const next = getNextOccurrenceTimestamp(base, rule, base);
    expect(fmt(next)).toBe('2024-01-03');
  });

  it('respects endsAt', () => {
    const base = createDate('2024-01-01T10:00:00Z');
    const end = createDate('2024-01-01T20:00:00Z'); // Same day evening
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1, endsAt: end };
    
    const next = getNextOccurrenceTimestamp(base, rule, base);
    expect(next).toBeNull();
  });

  it('catches up if base date is in the past', () => {
    // Task scheduled for Jan 1
    const base = createDate('2024-01-01T10:00:00Z');
    // It is now Jan 5
    const now = createDate('2024-01-05T10:00:00Z');
    
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1 };
    
    // For daily tasks, if we missed a few days, the logic resets to "Tomorrow" (Jan 6)
    // relative to "Today" (Jan 5) in the implementation
    const next = getNextOccurrenceTimestamp(base, rule, now);
    expect(fmt(next)).toBe('2024-01-06');
  });

  it('catches up correctly for weekly tasks in the past', () => {
    // Task scheduled for Monday Jan 1
    const base = createDate('2024-01-01T10:00:00Z');
    // It is now Wednesday Jan 10 (missed Jan 8 occurrence)
    const now = createDate('2024-01-10T10:00:00Z');
    
    const rule: RecurrenceRule = { frequency: 'weekly', interval: 1 };
    
    // Should find next Monday (Jan 15)
    const next = getNextOccurrenceTimestamp(base, rule, now);
    expect(fmt(next)).toBe('2024-01-15');
  });
});
