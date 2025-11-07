import { useNavigation } from '../../store/navigation';
import { useArea } from '../../hooks/useEntities';
import { useAreaTasks } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { ListView } from './ListView';
import { updateList } from '../../lib/lists';

export function AreaView() {
  const { contextId } = useNavigation();
  const { area, isLoading: areaLoading } = useArea(contextId);
  const { tasks, isLoading: tasksLoading } = useAreaTasks(contextId || '');

  if (areaLoading || tasksLoading) {
    return (
      <ListView title="Area" icon="🗂️">
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading...</div>
      </ListView>
    );
  }

  if (!area) {
    return (
      <ListView title="Area" icon="🗂️">
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Area not found</div>
      </ListView>
    );
  }

  const handleTitleChange = (newTitle: string) => {
    if (contextId) {
      updateList(contextId, { title: newTitle });
    }
  };

  return (
    <ListView
      title={area.title}
      icon="🗂️"
      onTitleChange={handleTitleChange}
      autoEdit={area.title === 'New Area'}
    >
      {/* Direct tasks in this area */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Tasks</h2>
        <TaskList tasks={tasks} emptyMessage="No tasks in this area" />
      </div>
    </ListView>
  );
}
