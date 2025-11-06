import { useInbox } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { AddTaskInput } from '../tasks/AddTaskInput';
import { ListView } from './ListView';

export function InboxView() {
  const { tasks, isLoading } = useInbox();

  if (isLoading) {
    return (
      <ListView title="Inbox" icon="📥">
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </ListView>
    );
  }

  return (
    <ListView title="Inbox" icon="📥">
      {/* Inbox tasks: no when/date/project/area (defaults will create inbox task) */}
      <AddTaskInput placeholder="New task..." />
      <TaskList tasks={tasks} emptyMessage="Inbox is empty. You're all organized!" />
    </ListView>
  );
}
