import { useSomeday } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { AddTaskInput } from '../tasks/AddTaskInput';
import { ListView } from './ListView';

export function SomedayView() {
  const { tasks, isLoading } = useSomeday();

  if (isLoading) {
    return (
      <ListView title="Someday" icon="🌙">
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </ListView>
    );
  }

  return (
    <ListView title="Someday" icon="🌙">
      <AddTaskInput when="someday" placeholder="New task for someday..." />
      <TaskList
        tasks={tasks}
        emptyMessage="No tasks in Someday. Add ideas you'll tackle later."
      />
    </ListView>
  );
}
