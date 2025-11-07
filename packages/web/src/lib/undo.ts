/**
 * Undo/Redo System
 *
 * Implements a Command Pattern-based undo/redo system for tracking
 * all mutations to Yjs data structures.
 */

export interface Command {
  /**
   * Execute the command (or redo if previously undone)
   */
  execute(): void;

  /**
   * Undo the command
   */
  undo(): void;
}

export class UndoManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxStackSize = 50;
  private isUndoing = false;
  private isRedoing = false;

  /**
   * Execute a command and add it to the undo stack
   */
  execute(command: Command): void {
    if (this.isUndoing || this.isRedoing) {
      // Don't track commands executed during undo/redo
      command.execute();
      return;
    }

    // Clear redo stack when new operation occurs
    this.clearRedo();

    // Execute the command
    command.execute();

    // Add to undo stack
    this.undoStack.push(command);

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo the last command
   */
  undo(): void {
    if (this.undoStack.length === 0) {
      return;
    }

    this.isUndoing = true;
    try {
      const command = this.undoStack.pop()!;
      command.undo();
      this.redoStack.push(command);

      // Limit redo stack size
      if (this.redoStack.length > this.maxStackSize) {
        this.redoStack.shift();
      }
    } finally {
      this.isUndoing = false;
    }
  }

  /**
   * Redo the last undone command
   */
  redo(): void {
    if (this.redoStack.length === 0) {
      return;
    }

    this.isRedoing = true;
    try {
      const command = this.redoStack.pop()!;
      command.execute();
      this.undoStack.push(command);

      // Limit undo stack size
      if (this.undoStack.length > this.maxStackSize) {
        this.undoStack.shift();
      }
    } finally {
      this.isRedoing = false;
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear the redo stack
   */
  clearRedo(): void {
    this.redoStack = [];
  }

  /**
   * Check if currently undoing (to prevent tracking undo operations)
   */
  getIsUndoing(): boolean {
    return this.isUndoing;
  }

  /**
   * Check if currently redoing (to prevent tracking redo operations)
   */
  getIsRedoing(): boolean {
    return this.isRedoing;
  }
}

// Singleton instance
export const undoManager = new UndoManager();

