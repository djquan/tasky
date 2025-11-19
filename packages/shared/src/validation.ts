/**
 * Input Validation Utilities
 *
 * Centralized validation constants and functions for user input.
 * Prevents potential DoS via massive inputs and enforces data quality.
 */

// Length limits for user inputs
export const INPUT_LIMITS = {
  TASK_TITLE: 500,
  TASK_NOTES: 10000,
  LIST_TITLE: 200,
  LIST_NOTES: 10000,
  TAG_NAME: 100,
  HEADING_TITLE: 200,
  CHECKLIST_ITEM_TITLE: 500,
} as const;

/**
 * Validates and truncates a string to a maximum length
 */
export function validateLength(
  value: string,
  maxLength: number,
  fieldName: string = 'Input'
): { valid: boolean; value: string; error?: string } {
  if (value.length <= maxLength) {
    return { valid: true, value };
  }

  return {
    valid: false,
    value: value.slice(0, maxLength),
    error: `${fieldName} exceeds maximum length of ${maxLength} characters`,
  };
}

/**
 * Sanitizes user input by trimming and normalizing whitespace
 */
export function sanitizeInput(value: string): string {
  // Normalize whitespace and trim
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Validates a task title
 */
export function validateTaskTitle(title: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(title);

  if (sanitized.length === 0) {
    return { valid: false, error: 'Task title cannot be empty' };
  }

  if (sanitized.length > INPUT_LIMITS.TASK_TITLE) {
    return {
      valid: false,
      error: `Task title cannot exceed ${INPUT_LIMITS.TASK_TITLE} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validates a list (project/area) title
 */
export function validateListTitle(title: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(title);

  if (sanitized.length === 0) {
    return { valid: false, error: 'List title cannot be empty' };
  }

  if (sanitized.length > INPUT_LIMITS.LIST_TITLE) {
    return {
      valid: false,
      error: `List title cannot exceed ${INPUT_LIMITS.LIST_TITLE} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validates a tag name
 */
export function validateTagName(name: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(name);

  if (sanitized.length === 0) {
    return { valid: false, error: 'Tag name cannot be empty' };
  }

  if (sanitized.length > INPUT_LIMITS.TAG_NAME) {
    return {
      valid: false,
      error: `Tag name cannot exceed ${INPUT_LIMITS.TAG_NAME} characters`,
    };
  }

  return { valid: true };
}
