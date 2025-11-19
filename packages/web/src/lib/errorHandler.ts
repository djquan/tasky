/**
 * Error Handling Utilities
 *
 * Centralized error logging and handling for consistent error management
 * across the application.
 */

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  operation?: string;
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
}

/**
 * Log an error with context
 */
export function logError(
  error: Error | unknown,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  context?: ErrorContext
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logData = {
    severity,
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
  };

  // In development, always log to console
  if (import.meta.env.DEV) {
    switch (severity) {
      case ErrorSeverity.INFO:
        console.info('[Error Handler]', logData);
        break;
      case ErrorSeverity.WARNING:
        console.warn('[Error Handler]', logData);
        break;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        console.error('[Error Handler]', logData);
        break;
    }
  } else {
    // In production, only log warnings and errors
    if (severity !== ErrorSeverity.INFO) {
      console.error('[Error Handler]', logData);
      // TODO: In future, send to error tracking service (Sentry, etc.)
    }
  }
}

/**
 * Handle common operation errors
 */
export function handleOperationError(
  operation: string,
  error: Error | unknown,
  context?: Omit<ErrorContext, 'operation'>
): void {
  logError(error, ErrorSeverity.ERROR, {
    operation,
    ...context,
  });
}

/**
 * Handle data sync errors
 */
export function handleSyncError(
  error: Error | unknown,
  context?: ErrorContext
): void {
  logError(error, ErrorSeverity.WARNING, {
    operation: 'sync',
    ...context,
  });
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  message: string,
  context?: ErrorContext
): void {
  logError(new Error(message), ErrorSeverity.WARNING, {
    operation: 'validation',
    ...context,
  });
}
