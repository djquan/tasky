/**
 * List/Project Parsing Utilities
 *
 * Functions for parsing list references from text input
 */

import type { List } from '@tasky/shared';

/**
 * Parsed list result from text input
 */
export interface ParsedList {
  /** The matched list */
  list: List;
  /** The matched text that was detected as a list reference */
  matchedText: string;
  /** Text with the list reference removed */
  remainingText: string;
}

/**
 * Parse list/project references from text input
 * Detects patterns like "#project name" and matches against existing lists
 * Supports partial matches (e.g., "#work" matches "Work Project")
 */
export function parseListReference(
  text: string,
  lists: List[]
): ParsedList | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Match # followed by text (at least 2 characters after #)
  const hashMatch = trimmed.match(/#([a-z0-9][a-z0-9\s]*?)(?:\s|$)/i);
  if (!hashMatch) return null;

  const searchTerm = hashMatch[1].trim().toLowerCase();
  if (searchTerm.length < 2) return null;

  // Find matching lists
  // Priority: exact match > starts with > contains
  let bestMatch: List | null = null;
  let matchScore = 0;

  for (const list of lists) {
    const listTitle = list.title.toLowerCase();
    let score = 0;

    // Exact match (score: 3)
    if (listTitle === searchTerm) {
      score = 3;
    }
    // Starts with (score: 2)
    else if (listTitle.startsWith(searchTerm)) {
      score = 2;
    }
    // Contains (score: 1)
    else if (listTitle.includes(searchTerm)) {
      score = 1;
    }

    if (score > matchScore) {
      matchScore = score;
      bestMatch = list;
    }
  }

  if (!bestMatch) return null;

  // Build the remaining text by removing the matched portion
  const fullMatch = hashMatch[0];
  const remainingText = trimmed.replace(fullMatch, '').trim();

  return {
    list: bestMatch,
    matchedText: fullMatch.trim(),
    remainingText
  };
}
