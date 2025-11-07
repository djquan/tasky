import { useState, useEffect } from 'react';
import { useTask } from '../../hooks/useEntities';
import { useNavigation } from '../../store/navigation';
import { updateTask, deleteTask } from '../../lib/tasks';
import { WhenPicker } from '../pickers/WhenPicker';
import { ProjectAreaPicker } from '../pickers/ProjectAreaPicker';
import type { WhenValue } from '@tasky/shared';

export function TaskDetail() {
  const { selectedTaskId, selectTask } = useNavigation();
  const { task } = useTask(selectedTaskId);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes);
    }
  }, [task]);

  if (!selectedTaskId || !task) {
    return null;
  }

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

  const handleListChange = (listId: string | null) => {
    updateTask(task.id, { listId });
  };

  const handleDeleteTask = () => {
    deleteTask(task.id);
    handleClose();
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
            {/* Task Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="w-full text-xl font-normal focus:outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 mb-4"
              placeholder="Task title"
            />

            {/* Notes */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSave}
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
                  aria-label="Schedule task"
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
                      value={task.when}
                      scheduledDate={task.scheduledDate}
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
                  aria-label="Assign to project or area"
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
                      projectId={task.listId}
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
