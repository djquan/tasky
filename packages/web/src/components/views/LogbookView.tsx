import { useLogbook } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { ListView } from './ListView';

export function LogbookView() {
  const { tasks, isLoading } = useLogbook();

  if (isLoading) {
    return (
      <ListView title="Logbook" icon="✓">
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </ListView>
    );
  }

  return (
    <ListView title="Logbook" icon="✓">
      <p className="text-sm text-gray-600 mb-6">
        Completed and canceled tasks are archived here.
      </p>
      <TaskList tasks={tasks} emptyMessage="No completed tasks yet" />
    </ListView>
  );
}
