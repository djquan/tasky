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
