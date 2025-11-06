import { useToday, useThisEvening } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { AddTaskInput } from '../tasks/AddTaskInput';
import { ListView } from './ListView';

export function TodayView() {
  const { tasks: todayTasks, isLoading: todayLoading } = useToday();
  const { tasks: eveningTasks } = useThisEvening();

  const mainTasks = todayTasks.filter(t => t.when !== 'evening');

  if (todayLoading) {
    return (
      <ListView title="Today" icon="⭐">
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </ListView>
    );
  }

  return (
    <ListView title="Today" icon="⭐">
      <AddTaskInput when="today" placeholder="New task for today..." />

      {/* Main tasks */}
      <TaskList tasks={mainTasks} emptyMessage="No tasks for today" />

      {/* This Evening section */}
      {eveningTasks.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-700">This Evening</h2>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <TaskList tasks={eveningTasks} />
        </div>
      )}
    </ListView>
  );
}
