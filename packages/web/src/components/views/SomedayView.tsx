import { useSomeday } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { ListView } from './ListView';

export function SomedayView() {
  const { tasks, isLoading } = useSomeday();

  if (isLoading) {
    return (
      <ListView title="Someday" icon="🌙">
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading...</div>
      </ListView>
    );
  }

  return (
    <ListView title="Someday" icon="🌙">
      <TaskList
        tasks={tasks}
        emptyMessage="No tasks in Someday. Add ideas you'll tackle later."
      />
    </ListView>
  );
}
