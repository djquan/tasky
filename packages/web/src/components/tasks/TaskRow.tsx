import { toggleTask } from '../../lib/tasks';
import { useTags } from '../../hooks/useEntities';
import { useNavigation } from '../../store/navigation';
import type { Task } from '@tasky/shared';

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
  const { selectTask, currentView, selectedTaskId } = useNavigation();
  const { tags } = useTags();

  const taskTags = tags.filter(t => task.tags.includes(t.id));
  const isSelected = selectedTaskId === task.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTask(task.id);
  };

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
    // Don't show when info on Today or Upcoming screens - it's redundant
    if (currentView === 'today' || currentView === 'upcoming') {
      return null;
    }

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

  return (
    <div
      onClick={() => selectTask(task.id)}
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

        {/* When info - only show if not on Today/Upcoming */}
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
