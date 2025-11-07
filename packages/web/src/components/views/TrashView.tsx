import { useTrash } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { ListView } from './ListView';

export function TrashView() {
  const { tasks, isLoading } = useTrash();

  if (isLoading) {
    return (
      <ListView title="Trash" icon="🗑️">
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading...</div>
      </ListView>
    );
  }

  return (
    <ListView title="Trash" icon="🗑️">
      <TaskList tasks={tasks} emptyMessage="Trash is empty" />
    </ListView>
  );
}

