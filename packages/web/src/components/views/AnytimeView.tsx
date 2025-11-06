import { useAnytime } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { AddTaskInput } from '../tasks/AddTaskInput';
import { ListView } from './ListView';

export function AnytimeView() {
  const { tasks, isLoading } = useAnytime();

  if (isLoading) {
    return (
      <ListView title="Anytime" icon="📋">
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </ListView>
    );
  }

  return (
    <ListView title="Anytime" icon="📋">
      <AddTaskInput when="anytime" placeholder="New task for anytime..." />
      <TaskList tasks={tasks} emptyMessage="No tasks in Anytime" />
    </ListView>
  );
}
