import { memo, useCallback, useMemo } from 'react';
import { toggleTask } from '../../lib/tasks';
import { useTags } from '../../hooks/useEntities';
import { useNavigation } from '../../store/navigation';
import { formatDate } from '../../lib/dateUtils';
import type { Task } from '@tasky/shared';

interface TaskRowProps {
  task: Task;
  allTaskIds: string[];
}

function TaskRowComponent({ task, allTaskIds }: TaskRowProps) {
  const { selectTask, toggleTaskSelection, selectTaskRange, openTaskDetail, currentView, selectedTaskIds } = useNavigation();
  const { tags } = useTags();

  const taskTags = useMemo(
    () => tags.filter(t => task.tags.includes(t.id)),
    [tags, task.tags]
  );
  const isSelected = selectedTaskIds.has(task.id);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTask(task.id);
  }, [task.id]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isMetaKey = isMac ? e.metaKey : e.ctrlKey;
    const isShiftKey = e.shiftKey;

    if (isMetaKey) {
      // Cmd/Ctrl+click: toggle selection
      e.preventDefault();
      toggleTaskSelection(task.id);
    } else if (isShiftKey) {
      // Shift+click: select range
      e.preventDefault();
      selectTaskRange(task.id, allTaskIds);
    } else {
      // Regular click: single select or open detail
      if (isSelected && selectedTaskIds.size === 1) {
        // Second click on already selected task - open detail popup
        openTaskDetail();
      } else {
        // First click - select the task
        selectTask(task.id);
      }
    }
  }, [task.id, allTaskIds, isSelected, selectedTaskIds.size, toggleTaskSelection, selectTaskRange, selectTask, openTaskDetail]);

  const whenDisplay = useMemo(() => {
    // Don't show when info on Today, Upcoming, or Someday screens - it's redundant
    if (currentView === 'today' || currentView === 'upcoming' || currentView === 'someday') {
      return null;
    }

    // Priority: scheduledDate > deadline > when
    if (task.scheduledDate) {
      return { icon: '📅', text: formatDate(task.scheduledDate) };
    }
    if (task.deadline) {
      const now = Date.now();
      const isOverdue = task.deadline < now;
      return {
        icon: isOverdue ? '⚠️' : '📅',
        text: formatDate(task.deadline),
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
  }, [currentView, task.scheduledDate, task.deadline, task.when]);

  return (
    <div
      data-task-row
      onClick={handleClick}
      className={`flex items-start gap-3 py-2 px-1 rounded-lg transition-colors cursor-pointer ${isSelected
        ? 'bg-blue-600 dark:bg-blue-700'
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`flex-shrink-0 mt-0.5 w-5 h-5 border transition-colors flex items-center justify-center rounded ${isSelected
          ? 'border-white'
          : 'border-gray-400 dark:border-gray-500'
          }`}
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

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={`text-sm ${task.completed
            ? 'line-through text-gray-400 dark:text-gray-500'
            : isSelected
              ? 'text-white'
              : 'text-gray-900 dark:text-white'
            }`}
        >
          {task.title}
        </h3>

        {/* Tags as sub-text */}
        {taskTags.length > 0 && (
          <p className={`text-xs mt-0.5 ${isSelected
            ? 'text-blue-100'
            : 'text-gray-500 dark:text-gray-400'
            }`}>
            {taskTags.map(t => t.name).join(', ')}
          </p>
        )}

        {/* Notes */}
        {task.notes && (
          <p className={`text-xs mt-0.5 line-clamp-1 ${isSelected
            ? 'text-blue-100'
            : 'text-gray-500 dark:text-gray-400'
            }`}>
            {task.notes}
          </p>
        )}

        {/* When info - only show if not on Today/Upcoming/Someday */}
        {whenDisplay && (
          <div className={`flex items-center gap-1.5 mt-1 ${isSelected
            ? 'text-blue-100'
            : 'text-gray-500 dark:text-gray-400'
            }`}>
            <span className="text-xs">{whenDisplay.icon}</span>
            <span className={`text-xs ${whenDisplay.isOverdue && !isSelected
              ? 'text-red-600 dark:text-red-400 font-medium'
              : ''
              }`}>
              {whenDisplay.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize TaskRow to prevent unnecessary re-renders
export const TaskRow = memo(TaskRowComponent);
