/**
 * Simple fuzzy search algorithm
 * Returns a score indicating how well the query matches the text
 * Higher score = better match
 */
export function fuzzyMatch(query: string, text: string): number {
  if (!query) return 0;
  if (!text) return 0;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match gets highest score
  if (textLower === queryLower) return 1000;

  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 500;

  // Check if all query characters appear in order
  let queryIndex = 0;
  let textIndex = 0;
  let matchCount = 0;
  let totalDistance = 0;
  let lastMatchIndex = -1;

  while (queryIndex < queryLower.length && textIndex < textLower.length) {
    if (queryLower[queryIndex] === textLower[textIndex]) {
      matchCount++;
      if (lastMatchIndex >= 0) {
        totalDistance += textIndex - lastMatchIndex;
      }
      lastMatchIndex = textIndex;
      queryIndex++;
    }
    textIndex++;
  }

  // If not all characters matched, return 0
  if (matchCount < queryLower.length) return 0;

  // Calculate score based on match count and proximity
  // More matches and closer together = higher score
  const proximityScore = matchCount > 1 ? Math.max(0, 100 - totalDistance) : 100;
  const matchRatio = matchCount / queryLower.length;

  return proximityScore * matchRatio;
}

