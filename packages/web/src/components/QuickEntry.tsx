import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigation } from '../store/navigation';
import { createTask } from '../lib/tasks';
import { WhenPicker } from './pickers/WhenPicker';
import { ProjectAreaPicker } from './pickers/ProjectAreaPicker';
import { useProjects, useAreas } from '../hooks/useEntities';
import type { WhenValue } from '@tasky/shared';

export function QuickEntry() {
  const { quickEntryOpen, toggleQuickEntry } = useNavigation();
  const { projects } = useProjects();
  const { areas } = useAreas();

  const [input, setInput] = useState('');
  const [notes, setNotes] = useState('');
  const [when, setWhen] = useState<WhenValue>('anytime');  // Default to anytime
  const [scheduledDate, setScheduledDate] = useState<number | null>(null);
  const [listId, setListId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if listId is a project or area
  const { projectId, areaId, list } = useMemo(() => {
    if (!listId) return { projectId: null, areaId: null, list: null };
    const project = projects.find(p => p.id === listId);
    const area = areas.find(a => a.id === listId);
    return {
      projectId: project ? project.id : null,
      areaId: area ? area.id : null,
      list: project || area || null
    };
  }, [listId, projects, areas]);

  const formatScheduledDate = (timestamp: number) => {
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
  };

  const getWhenDisplay = () => {
    // Priority: scheduledDate > deadline > when
    if (scheduledDate) {
      return { icon: '📅', text: formatScheduledDate(scheduledDate) };
    }
    if (when === 'today') {
      return { icon: '⭐', text: 'Today' };
    }
    if (when === 'evening') {
      return { icon: '🌙', text: 'This Evening' };
    }
    if (when === 'someday') {
      return { icon: '🌙', text: 'Someday' };
    }
    return null;
  };

  const whenDisplay = getWhenDisplay();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeSection) {
        const target = e.target as HTMLElement;
        // Check if click is outside the dropdown container
        const dropdownContainer = target.closest('[data-dropdown]');
        if (!dropdownContainer) {
          setActiveSection(null);
        }
      }
    };

    if (activeSection) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeSection]);

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

      // Escape to close modal or dropdowns
      if (e.key === 'Escape') {
        if (activeSection) {
          setActiveSection(null);
        } else if (quickEntryOpen) {
          toggleQuickEntry();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickEntryOpen, toggleQuickEntry, activeSection]);

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

  const handleProjectChange = (id: string | null) => {
    // Always update - if id is null, it means we're clearing (only called when deselecting)
    setListId(id);
  };

  const handleAreaChange = (id: string | null) => {
    // Always update - if id is null, it means we're clearing (only called when deselecting)
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
                placeholder="New To-Do"
                className="w-full text-2xl font-medium focus:outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mb-3"
              />

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-0 py-0 border-0 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-0 text-sm resize-none"
                  placeholder=""
                />
              </div>

              {/* Icon Buttons Row */}
              <div className="flex items-center gap-3">
                {/* Calendar Icon with When Display */}
                <div className="relative" data-dropdown>
                  {whenDisplay ? (
                    <button
                      type="button"
                      onClick={() => setActiveSection(activeSection === 'when' ? null : 'when')}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      title="Schedule"
                      aria-label="Schedule task"
                    >
                      <span className="text-xs">{whenDisplay.icon}</span>
                      <span className="text-xs">
                        {whenDisplay.text}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSection(activeSection === 'when' ? null : 'when')}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors"
                      title="Schedule"
                      aria-label="Schedule task"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}

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

                {/* Project/List Icon with List Display */}
                <div className="relative" data-dropdown>
                  {list ? (
                    <button
                      type="button"
                      onClick={() => setActiveSection(activeSection === 'project' ? null : 'project')}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      title="Project"
                      aria-label="Assign to project or area"
                    >
                      <span className="text-xs">{list.type === 'project' ? '📁' : '🗂️'}</span>
                      <span className="text-xs">
                        {list.title}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSection(activeSection === 'project' ? null : 'project')}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors"
                      title="Project"
                      aria-label="Assign to project or area"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                    </button>
                  )}

                  {/* List Popover */}
                  {activeSection === 'project' && (
                    <div
                      className="absolute top-full left-0 mt-2 z-20 p-4 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-xl min-w-[320px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ProjectAreaPicker
                        projectId={projectId}
                        areaId={areaId}
                        onChangeProject={handleProjectChange}
                        onChangeArea={handleAreaChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 flex items-center justify-end border-t border-light-border dark:border-dark-border">
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
