import { useInbox } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { ListView } from './ListView';

export function InboxView() {
  const { tasks, isLoading } = useInbox();

  if (isLoading) {
    return (
      <ListView title="Inbox" icon="📥">
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading...</div>
      </ListView>
    );
  }

  return (
    <ListView title="Inbox" icon="📥">
      <TaskList tasks={tasks} emptyMessage="Inbox is empty. You're all organized!" />
    </ListView>
  );
}
