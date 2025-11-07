import { useState, useEffect, useMemo } from 'react';
import { useTask, useProjects, useAreas } from '../../hooks/useEntities';
import { useNavigation } from '../../store/navigation';
import { updateTask, deleteTask, toggleTask } from '../../lib/tasks';
import { WhenPicker } from '../pickers/WhenPicker';
import { ProjectAreaPicker } from '../pickers/ProjectAreaPicker';
import type { WhenValue } from '@tasky/shared';

export function TaskDetail() {
  const { selectedTaskId, selectTask } = useNavigation();
  const { task } = useTask(selectedTaskId);
  const { projects } = useProjects();
  const { areas } = useAreas();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes);
    }
  }, [task]);

  // Determine if task.listId is a project or area
  const { projectId, areaId, list } = useMemo(() => {
    if (!task?.listId) return { projectId: null, areaId: null, list: null };
    const project = projects.find(p => p.id === task.listId);
    const area = areas.find(a => a.id === task.listId);
    return {
      projectId: project ? project.id : null,
      areaId: area ? area.id : null,
      list: project || area || null
    };
  }, [task?.listId, projects, areas]);

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeSection) {
        setActiveSection(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection]);

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

  if (!selectedTaskId || !task) {
    return null;
  }

  const formatDeadline = (timestamp: number) => {
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
    if (task.scheduledDate) {
      return { icon: '📅', text: formatScheduledDate(task.scheduledDate) };
    }
    if (task.deadline) {
      const isOverdue = task.deadline < Date.now();
      return {
        icon: isOverdue ? '⚠️' : '📅',
        text: formatDeadline(task.deadline),
        isOverdue
      };
    }
    if (task.when === 'today') {
      return { icon: '⭐', text: 'Today' };
    }
    if (task.when === 'evening') {
      return { icon: '🌙', text: 'This Evening' };
    }
    if (task.when === 'someday') {
      return { icon: '🌙', text: 'Someday' };
    }
    return null;
  };

  const whenDisplay = getWhenDisplay();

  const handleClose = () => {
    selectTask(null);
  };

  const handleSave = () => {
    if (title.trim()) {
      updateTask(task.id, { title: title.trim(), notes: notes.trim() });
    }
  };

  const handleWhenChange = (when: WhenValue) => {
    updateTask(task.id, { when });
    setActiveSection(null);
  };

  const handleScheduledDateChange = (scheduledDate: number | null) => {
    updateTask(task.id, { scheduledDate });
    setActiveSection(null);
  };

  const handleProjectChange = (id: string | null) => {
    // Always update - if id is null, it means we're clearing (only called when deselecting)
    updateTask(task.id, { listId: id });
  };

  const handleAreaChange = (id: string | null) => {
    // Always update - if id is null, it means we're clearing (only called when deselecting)
    updateTask(task.id, { listId: id });
  };

  const handleDeleteTask = () => {
    deleteTask(task.id);
    handleClose();
  };

  const handleToggleComplete = () => {
    toggleTask(task.id);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-60 z-50 flex items-start justify-center pt-32"
        onClick={handleClose}
      >
        {/* Detail Modal */}
        <div
          className="w-full max-w-2xl bg-light-surface dark:bg-dark-surface rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Content */}
          <div className="p-6">
            {/* Task Title with Checkbox */}
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={handleToggleComplete}
                className={`flex-shrink-0 w-5 h-5 border transition-colors flex items-center justify-center rounded ${task.completed
                  ? 'border-blue-600 dark:border-blue-400 bg-blue-600 dark:bg-blue-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                  }`}
                title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {task.completed && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                className={`flex-1 text-2xl font-medium focus:outline-none bg-transparent placeholder-gray-500 dark:placeholder-gray-400 ${task.completed
                  ? 'line-through text-gray-400 dark:text-gray-500'
                  : 'text-gray-900 dark:text-white'
                  }`}
                placeholder="New To-Do"
              />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSave}
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
                    <span className="text-sm">{whenDisplay.icon}</span>
                    <span className={`text-sm ${whenDisplay.isOverdue
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : ''
                      }`}>
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
                      value={task.when}
                      scheduledDate={task.scheduledDate}
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
                    <span className="text-sm">{list.type === 'project' ? '📁' : '🗂️'}</span>
                    <span className="text-sm">
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
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDeleteTask}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Delete
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
