import { useAnytime } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { ListView } from './ListView';
import { useProjects, useAreas } from '../../hooks/useEntities';
import { useMemo } from 'react';
import type { Task } from '@tasky/shared';

export function AnytimeView() {
  const { tasks, isLoading } = useAnytime();
  const { projects } = useProjects();
  const { areas } = useAreas();

  // Group tasks by list (project or area)
  const tasksByList = useMemo(() => {
    const grouped: Record<string, { list: { id: string; title: string; type: 'project' | 'area' } | null; tasks: Task[] }> = {};
    const noList: Task[] = [];

    for (const task of tasks) {
      if (task.listId) {
        const project = projects.find(p => p.id === task.listId);
        const area = areas.find(a => a.id === task.listId);
        const list = project || area;

        if (list) {
          if (!grouped[list.id]) {
            grouped[list.id] = {
              list: {
                id: list.id,
                title: list.title,
                type: list.type
              },
              tasks: []
            };
          }
          grouped[list.id].tasks.push(task);
        } else {
          noList.push(task);
        }
      } else {
        noList.push(task);
      }
    }

    return { grouped, noList };
  }, [tasks, projects, areas]);

  if (isLoading) {
    return (
      <ListView title="Anytime" icon="📋">
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading...</div>
      </ListView>
    );
  }

  return (
    <ListView title="Anytime" icon="📋">
      {/* Tasks grouped by list */}
      {Object.values(tasksByList.grouped).map(({ list, tasks }, index, array) => {
        const isLastGrouped = index === array.length - 1;
        const hasMoreSections = tasksByList.noList.length > 0;
        const showSeparator = !isLastGrouped || hasMoreSections;

        return (
          <div key={list!.id} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{list!.type === 'project' ? '📁' : '🗂️'}</span>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">{list!.title}</h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <TaskList tasks={tasks} />
            {showSeparator && (
              <div className="h-px bg-gray-200 dark:bg-gray-700 mt-4"></div>
            )}
          </div>
        );
      })}

      {/* Tasks without list */}
      {tasksByList.noList.length > 0 && (
        <div className="mb-6">
          <TaskList tasks={tasksByList.noList} />
        </div>
      )}

      {tasks.length === 0 && (
        <TaskList tasks={[]} emptyMessage="No tasks in Anytime" />
      )}
    </ListView>
  );
}
