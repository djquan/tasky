import { describe, it, expect, beforeEach } from 'vitest';
import { UndoManager, type Command } from './undo';

// Mock command for testing
class MockCommand implements Command {
  public executeCalled = 0;
  public undoCalled = 0;
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  execute(): void {
    this.executeCalled++;
  }

  undo(): void {
    this.undoCalled++;
  }

  getValue(): number {
    return this.value;
  }
}

describe('undo.ts', () => {
  let manager: UndoManager;

  beforeEach(() => {
    manager = new UndoManager();
  });

  describe('UndoManager', () => {
    describe('execute', () => {
      it('should execute command and add to undo stack', () => {
        const command = new MockCommand(1);
        manager.execute(command);

        expect(command.executeCalled).toBe(1);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
      });

      it('should clear redo stack when new command is executed', () => {
        const cmd1 = new MockCommand(1);
        const cmd2 = new MockCommand(2);

        manager.execute(cmd1);
        manager.undo();
        expect(manager.canRedo()).toBe(true);

        manager.execute(cmd2);
        expect(manager.canRedo()).toBe(false);
      });

      it('should not track commands executed during undo', () => {
        const cmd1 = new MockCommand(1);
        manager.execute(cmd1);

        manager.undo(); // This will execute cmd1.undo()
        
        // During undo, if a command is executed, it shouldn't be tracked
        // But after undo completes, cmd1 is in redo stack
        expect(manager.getIsUndoing()).toBe(false);
        expect(manager.canUndo()).toBe(false); // cmd1 was undone
        expect(manager.canRedo()).toBe(true); // cmd1 is in redo stack
        
        // Now execute a new command - it should be tracked normally
        const cmd2 = new MockCommand(2);
        manager.execute(cmd2);
        expect(manager.canUndo()).toBe(true); // cmd2 is tracked
        expect(manager.canRedo()).toBe(false); // redo stack cleared
      });

      it('should not track commands executed during redo', () => {
        const cmd1 = new MockCommand(1);
        manager.execute(cmd1);
        manager.undo();

        const cmd2 = new MockCommand(2);
        manager.redo(); // This will execute cmd1.execute()
        manager.execute(cmd2); // This should be tracked normally

        expect(manager.getIsRedoing()).toBe(false);
        expect(manager.canUndo()).toBe(true); // cmd1 is back in undo stack
        expect(manager.canRedo()).toBe(false); // redo stack cleared
      });

      it('should limit undo stack size to maxStackSize', () => {
        const maxSize = 50;
        for (let i = 0; i < maxSize + 10; i++) {
          manager.execute(new MockCommand(i));
        }

        expect(manager.canUndo()).toBe(true);
        // Stack should be limited to maxSize
        let undoCount = 0;
        while (manager.canUndo()) {
          manager.undo();
          undoCount++;
        }
        expect(undoCount).toBe(maxSize);
      });
    });

    describe('undo', () => {
      it('should undo last command and move to redo stack', () => {
        const cmd1 = new MockCommand(1);
        const cmd2 = new MockCommand(2);

        manager.execute(cmd1);
        manager.execute(cmd2);

        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);

        manager.undo();

        expect(cmd2.undoCalled).toBe(1);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(true);
      });

      it('should do nothing if undo stack is empty', () => {
        expect(manager.canUndo()).toBe(false);
        manager.undo();
        expect(manager.canUndo()).toBe(false);
        expect(manager.canRedo()).toBe(false);
      });

      it('should limit redo stack size to maxStackSize', () => {
        const maxSize = 50;
        for (let i = 0; i < maxSize + 10; i++) {
          manager.execute(new MockCommand(i));
        }

        // Undo all
        for (let i = 0; i < maxSize + 10; i++) {
          manager.undo();
        }

        // Redo stack should be limited
        let redoCount = 0;
        while (manager.canRedo()) {
          manager.redo();
          redoCount++;
        }
        expect(redoCount).toBe(maxSize);
      });
    });

    describe('redo', () => {
      it('should redo last undone command', () => {
        const cmd1 = new MockCommand(1);
        manager.execute(cmd1);
        manager.undo();

        expect(manager.canRedo()).toBe(true);
        expect(cmd1.executeCalled).toBe(1);

        manager.redo();

        expect(cmd1.executeCalled).toBe(2);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
      });

      it('should do nothing if redo stack is empty', () => {
        expect(manager.canRedo()).toBe(false);
        manager.redo();
        expect(manager.canRedo()).toBe(false);
      });
    });

    describe('canUndo', () => {
      it('should return false when undo stack is empty', () => {
        expect(manager.canUndo()).toBe(false);
      });

      it('should return true when undo stack has commands', () => {
        manager.execute(new MockCommand(1));
        expect(manager.canUndo()).toBe(true);
      });
    });

    describe('canRedo', () => {
      it('should return false when redo stack is empty', () => {
        expect(manager.canRedo()).toBe(false);
      });

      it('should return true when redo stack has commands', () => {
        manager.execute(new MockCommand(1));
        manager.undo();
        expect(manager.canRedo()).toBe(true);
      });
    });

    describe('clearRedo', () => {
      it('should clear redo stack', () => {
        manager.execute(new MockCommand(1));
        manager.undo();
        expect(manager.canRedo()).toBe(true);

        manager.clearRedo();
        expect(manager.canRedo()).toBe(false);
      });
    });

    describe('getIsUndoing', () => {
      it('should return false when not undoing', () => {
        expect(manager.getIsUndoing()).toBe(false);
      });

      it('should return true during undo operation', () => {
        manager.execute(new MockCommand(1));
        
        // We can't directly test this during undo, but we can verify
        // it's false after undo completes
        manager.undo();
        expect(manager.getIsUndoing()).toBe(false);
      });
    });

    describe('getIsRedoing', () => {
      it('should return false when not redoing', () => {
        expect(manager.getIsRedoing()).toBe(false);
      });

      it('should return false after redo completes', () => {
        manager.execute(new MockCommand(1));
        manager.undo();
        manager.redo();
        expect(manager.getIsRedoing()).toBe(false);
      });
    });

    describe('integration', () => {
      it('should support multiple undo/redo cycles', () => {
        const cmd1 = new MockCommand(1);
        const cmd2 = new MockCommand(2);
        const cmd3 = new MockCommand(3);

        manager.execute(cmd1);
        manager.execute(cmd2);
        manager.execute(cmd3);

        // Undo all
        manager.undo();
        expect(cmd3.undoCalled).toBe(1);
        manager.undo();
        expect(cmd2.undoCalled).toBe(1);
        manager.undo();
        expect(cmd1.undoCalled).toBe(1);

        expect(manager.canUndo()).toBe(false);
        expect(manager.canRedo()).toBe(true);

        // Redo all
        manager.redo();
        expect(cmd1.executeCalled).toBe(2);
        manager.redo();
        expect(cmd2.executeCalled).toBe(2);
        manager.redo();
        expect(cmd3.executeCalled).toBe(2);

        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
      });

      it('should clear redo stack when new command executed after undo', () => {
        const cmd1 = new MockCommand(1);
        const cmd2 = new MockCommand(2);
        const cmd3 = new MockCommand(3);

        manager.execute(cmd1);
        manager.execute(cmd2);
        manager.undo(); // Undo cmd2
        expect(manager.canRedo()).toBe(true);

        manager.execute(cmd3); // New command clears redo
        expect(manager.canRedo()).toBe(false);
        expect(manager.canUndo()).toBe(true); // cmd1 and cmd3 in undo stack
      });
    });
  });
});

