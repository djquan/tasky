import { useUpcoming } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { ListView } from './ListView';
import type { Task } from '@tasky/shared';

export function UpcomingView() {
  const { tasks, isLoading } = useUpcoming();

  if (isLoading) {
    return (
      <ListView title="Upcoming" icon="📅">
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading...</div>
      </ListView>
    );
  }

  // Group tasks by date
  const groupedTasks = tasks.reduce((groups, task) => {
    const date = task.scheduledDate || task.deadline;
    if (!date) return groups;

    const dateStr = new Date(date).toDateString();
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(task);
    return groups;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(groupedTasks).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <ListView title="Upcoming" icon="📅">
      {sortedDates.length === 0 ? (
        <TaskList tasks={[]} emptyMessage="No upcoming tasks" />
      ) : (
        <div className="space-y-8">
          {sortedDates.map(dateStr => (
            <div key={dateStr}>
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                {formatDate(dateStr)}
              </h2>
              <TaskList tasks={groupedTasks[dateStr]} />
            </div>
          ))}
        </div>
      )}
    </ListView>
  );
}
