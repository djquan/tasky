/**
 * Date Formatting Utilities
 *
 * Shared date formatting functions for consistent display across the app.
 */

/**
 * Format a timestamp as a date string with today/tomorrow shortcuts
 * Returns "Today", "Tomorrow", or "Mon DD" format
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Alias for formatDate for backwards compatibility
 * @deprecated Use formatDate() instead
 */
export const formatDeadline = formatDate;

/**
 * Alias for formatDate for backwards compatibility
 * @deprecated Use formatDate() instead
 */
export const formatScheduledDate = formatDate;

/**
 * Parsed date result from text input
 */
export interface ParsedDate {
  /** The detected date as a timestamp */
  date: number;
  /** The matched text that was detected as a date */
  matchedText: string;
  /** Display text for the suggestion */
  displayText: string;
  /** Text with the date portion removed */
  remainingText: string;
}

/**
 * Parse natural language dates from text input
 * Detects dates like "tomorrow", "next monday", "jan 15", etc.
 * Also supports partial matches (e.g., "tom" matches "tomorrow")
 */
export function parseNaturalDate(text: string): ParsedDate | null {
  const lowerText = text.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to create a date at midnight
  const createDate = (year: number, month: number, day: number): number => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  // Helper to find next occurrence of a weekday
  const getNextWeekday = (targetDay: number): number => {
    const result = new Date(today);
    const currentDay = result.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    result.setDate(result.getDate() + daysToAdd);
    return result.getTime();
  };

  // Check for partial matches on any word (not just the last)
  const words = lowerText.split(/\s+/);

  // Partial match candidates (min 3 characters)
  const partialMatches: Array<{
    keywords: string[];
    minLength: number;
    handler: (matchedWord: string, wordIndex: number) => ParsedDate;
  }> = [
    {
      keywords: ['tomorrow', 'tmrw', 'tmr'],
      minLength: 3,
      handler: (matchedWord: string, wordIndex: number) => {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const remainingWords = [...words];
        remainingWords.splice(wordIndex, 1);
        return {
          date: tomorrow.getTime(),
          matchedText: matchedWord,
          displayText: 'Tomorrow',
          remainingText: remainingWords.join(' ').trim()
        };
      }
    },
    {
      keywords: ['today', 'tday'],
      minLength: 3,
      handler: (matchedWord: string, wordIndex: number) => {
        const remainingWords = [...words];
        remainingWords.splice(wordIndex, 1);
        return {
          date: today.getTime(),
          matchedText: matchedWord,
          displayText: 'Today',
          remainingText: remainingWords.join(' ').trim()
        };
      }
    },
    {
      keywords: ['monday', 'mon'],
      minLength: 3,
      handler: (matchedWord: string, wordIndex: number) => {
        const nextDate = getNextWeekday(1);
        const date = new Date(nextDate);
        const remainingWords = [...words];
        remainingWords.splice(wordIndex, 1);
        return {
          date: nextDate,
          matchedText: matchedWord,
          displayText: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          remainingText: remainingWords.join(' ').trim()
        };
      }
    },
    {
      keywords: ['tuesday', 'tue', 'tues'],
      minLength: 3,
      handler: (matchedWord: string, wordIndex: number) => {
        const nextDate = getNextWeekday(2);
        const date = new Date(nextDate);
        const remainingWords = [...words];
        remainingWords.splice(wordIndex, 1);
        return {
          date: nextDate,
          matchedText: matchedWord,
          displayText: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          remainingText: remainingWords.join(' ').trim()
        };
      }
    },
    {
      keywords: ['wednesday', 'wed'],
      minLength: 3,
      handler: (matchedWord: string, wordIndex: number) => {
        const nextDate = getNextWeekday(3);
        const date = new Date(nextDate);
        const remainingWords = [...words];
        remainingWords.splice(wordIndex, 1);
        return {
          date: nextDate,
          matchedText: matchedWord,
          displayText: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          remainingText: remainingWords.join(' ').trim()
        };
      }
    },
    {
      keywords: ['thursday', 'thu', 'thurs'],
      minLength: 3,
      handler: (matchedWord: string, wordIndex: number) => {
        const nextDate = getNextWeekday(4);
        const date = new Date(nextDate);
        const remainingWords = [...words];
        remainingWords.splice(wordIndex, 1);
        return {
          date: nextDate,
          matchedText: matchedWord,
          displayText: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          remainingText: remainingWords.join(' ').trim()
        };
      }
    },
    {
      keywords: ['friday', 'fri'],
      minLength: 3,
      handler: (matchedWord: string, wordIndex: number) => {
        const nextDate = getNextWeekday(5);
        const date = new Date(nextDate);
        const remainingWords = [...words];
        remainingWords.splice(wordIndex, 1);
        return {
          date: nextDate,
          matchedText: matchedWord,
          displayText: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          remainingText: remainingWords.join(' ').trim()
        };
      }
    },
    {
      keywords: ['saturday', 'sat'],
      minLength: 3,
      handler: (matchedWord: string, wordIndex: number) => {
        const nextDate = getNextWeekday(6);
        const date = new Date(nextDate);
        const remainingWords = [...words];
        remainingWords.splice(wordIndex, 1);
        return {
          date: nextDate,
          matchedText: matchedWord,
          displayText: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          remainingText: remainingWords.join(' ').trim()
        };
      }
    },
    {
      keywords: ['sunday', 'sun'],
      minLength: 3,
      handler: (matchedWord: string, wordIndex: number) => {
        const nextDate = getNextWeekday(0);
        const date = new Date(nextDate);
        const remainingWords = [...words];
        remainingWords.splice(wordIndex, 1);
        return {
          date: nextDate,
          matchedText: matchedWord,
          displayText: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          remainingText: remainingWords.join(' ').trim()
        };
      }
    }
  ];

  // Check for partial matches across all words
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (const { keywords, minLength, handler } of partialMatches) {
      if (word.length >= minLength) {
        for (const keyword of keywords) {
          if (keyword.startsWith(word)) {
            return handler(word, i);
          }
        }
      }
    }
  }

  // Pattern matchers (order matters - more specific patterns first)
  const patterns: Array<{
    regex: RegExp;
    handler: (match: RegExpMatchArray) => ParsedDate | null;
  }> = [
    // Tomorrow
    {
      regex: /\b(tomorrow|tmrw|tmr)\b/i,
      handler: (match) => {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          date: tomorrow.getTime(),
          matchedText: match[0],
          displayText: 'Tomorrow',
          remainingText: text.replace(match[0], '').trim()
        };
      }
    },
    // Today
    {
      regex: /\b(today|tday)\b/i,
      handler: (match) => {
        return {
          date: today.getTime(),
          matchedText: match[0],
          displayText: 'Today',
          remainingText: text.replace(match[0], '').trim()
        };
      }
    },
    // Next [weekday]
    {
      regex: /\bnext\s+(monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat|sunday|sun)\b/i,
      handler: (match) => {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayAbbr: Record<string, number> = {
          sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
          tues: 2, thurs: 4
        };

        const dayStr = match[1].toLowerCase();
        let targetDay = dayNames.findIndex(d => d.startsWith(dayStr));
        if (targetDay === -1) {
          targetDay = dayAbbr[dayStr] ?? -1;
        }

        if (targetDay === -1) return null;

        const nextDate = getNextWeekday(targetDay);
        const date = new Date(nextDate);

        return {
          date: nextDate,
          matchedText: match[0],
          displayText: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          remainingText: text.replace(match[0], '').trim()
        };
      }
    },
    // Weekday names (without "next")
    {
      regex: /\b(monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat|sunday|sun)\b/i,
      handler: (match) => {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayAbbr: Record<string, number> = {
          sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
          tues: 2, thurs: 4
        };

        const dayStr = match[1].toLowerCase();
        let targetDay = dayNames.findIndex(d => d.startsWith(dayStr));
        if (targetDay === -1) {
          targetDay = dayAbbr[dayStr] ?? -1;
        }

        if (targetDay === -1) return null;

        const nextDate = getNextWeekday(targetDay);
        const date = new Date(nextDate);

        return {
          date: nextDate,
          matchedText: match[0],
          displayText: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          remainingText: text.replace(match[0], '').trim()
        };
      }
    },
    // Month Day (e.g., "jan 15", "january 15")
    {
      regex: /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\b/i,
      handler: (match) => {
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

        const monthStr = match[1].toLowerCase();
        let month = monthNames.findIndex(m => m.startsWith(monthStr));
        if (month === -1) {
          month = monthAbbr.findIndex(m => m === monthStr || monthStr.startsWith(m));
        }

        const day = parseInt(match[2], 10);
        let year = today.getFullYear();

        // If the date has passed this year, use next year
        const testDate = createDate(year, month, day);
        if (testDate < today.getTime()) {
          year++;
        }

        const date = createDate(year, month, day);
        const dateObj = new Date(date);

        return {
          date,
          matchedText: match[0],
          displayText: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          remainingText: text.replace(match[0], '').trim()
        };
      }
    },
    // M/D or M/D/YY or M/D/YYYY
    {
      regex: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,
      handler: (match) => {
        const month = parseInt(match[1], 10) - 1; // 0-indexed
        const day = parseInt(match[2], 10);
        let year = today.getFullYear();

        if (match[3]) {
          year = parseInt(match[3], 10);
          if (year < 100) {
            year += 2000;
          }
        } else {
          // If no year specified and date has passed, use next year
          const testDate = createDate(year, month, day);
          if (testDate < today.getTime()) {
            year++;
          }
        }

        const date = createDate(year, month, day);
        const dateObj = new Date(date);

        return {
          date,
          matchedText: match[0],
          displayText: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          remainingText: text.replace(match[0], '').trim()
        };
      }
    }
  ];

  // Try each pattern
  for (const { regex, handler } of patterns) {
    const match = lowerText.match(regex);
    if (match) {
      const result = handler(match);
      if (result) {
        return result;
      }
    }
  }

  return null;
}
