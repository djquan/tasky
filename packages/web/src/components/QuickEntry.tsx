import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../store/navigation';
import { createTask } from '../lib/tasks';
import { WhenPicker } from './pickers/WhenPicker';
import { ProjectAreaPicker } from './pickers/ProjectAreaPicker';
import type { WhenValue } from '@tasky/shared';

export function QuickEntry() {
  const { quickEntryOpen, toggleQuickEntry } = useNavigation();

  const [input, setInput] = useState('');
  const [notes, setNotes] = useState('');
  const [when, setWhen] = useState<WhenValue>('anytime');  // Default to anytime
  const [scheduledDate, setScheduledDate] = useState<number | null>(null);
  const [listId, setListId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (quickEntryOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [quickEntryOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+N or Ctrl+N to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        toggleQuickEntry();
      }

      // Escape to close
      if (e.code === 'Escape' && quickEntryOpen) {
        toggleQuickEntry();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickEntryOpen, toggleQuickEntry]);

  if (!quickEntryOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    createTask({
      title: input.trim(),
      notes: notes.trim(),
      when,
      scheduledDate,
      deadline: null,
      tags: [],
      checklistItems: [],
      listId,
      headingId: null,
      completed: false,
      canceled: false,
      sortOrder: Date.now()
    });

    // Reset and close
    setInput('');
    setNotes('');
    setWhen('anytime');
    setScheduledDate(null);
    setListId(null);
    setActiveSection(null);
    toggleQuickEntry();
  };

  const handleWhenChange = (newWhen: WhenValue) => {
    setWhen(newWhen);
    setActiveSection(null);
  };

  const handleScheduledDateChange = (date: number | null) => {
    setScheduledDate(date);
    setActiveSection(null);
  };

  const handleListChange = (id: string | null) => {
    setListId(id);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-60 z-50 flex items-start justify-center pt-32"
        onClick={toggleQuickEntry}
      >
        {/* Quick Entry Modal */}
        <div
          className="w-full max-w-2xl bg-light-surface dark:bg-dark-surface rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            {/* Main Content */}
            <div className="p-6">
              {/* Title Input */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="New task..."
                className="w-full text-xl font-normal focus:outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 mb-4"
              />

              {/* Notes */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-light-border dark:border-dark-border bg-transparent text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm mb-4"
                placeholder="Notes"
              />

              {/* Icon Buttons Row */}
              <div className="flex items-center gap-2">
                {/* Calendar Icon */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'when' ? null : 'when')}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors"
                    title="Schedule"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {/* When Popover */}
                  {activeSection === 'when' && (
                    <div
                      className="absolute top-full left-0 mt-2 z-20 p-4 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-xl min-w-[320px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <WhenPicker
                        value={when}
                        scheduledDate={scheduledDate}
                        onChange={handleWhenChange}
                        onScheduledDateChange={handleScheduledDateChange}
                      />
                    </div>
                  )}
                </div>

                {/* Project/List Icon */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'project' ? null : 'project')}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors"
                    title="Project"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </button>

                  {/* List Popover */}
                  {activeSection === 'project' && (
                    <div
                      className="absolute top-full left-0 mt-2 z-20 p-4 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-xl min-w-[320px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ProjectAreaPicker
                        projectId={listId}
                        areaId={null}
                        onChangeProject={handleListChange}
                        onChangeArea={handleListChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-light-border dark:border-dark-border">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <kbd className="px-2 py-1 bg-light-hover dark:bg-dark-hover rounded text-xs">Cmd</kbd> +{' '}
                <kbd className="px-2 py-1 bg-light-hover dark:bg-dark-hover rounded text-xs">N</kbd> to close
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleQuickEntry}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Add Task
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
