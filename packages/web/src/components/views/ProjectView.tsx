import { useNavigation } from '../../store/navigation';
import { useProject, useHeadings } from '../../hooks/useEntities';
import { useProjectTasks } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { ListView } from './ListView';
import { createHeading, deleteHeading } from '../../lib/headings';
import { updateList } from '../../lib/lists';
import { useState } from 'react';
import type { Task } from '@tasky/shared';

export function ProjectView() {
  const { contextId } = useNavigation();
  const { project, isLoading: projectLoading } = useProject(contextId);
  const { headings } = useHeadings(contextId);
  const { tasks, isLoading: tasksLoading } = useProjectTasks(contextId || '');
  const [newHeadingTitle, setNewHeadingTitle] = useState('');
  const [showNewHeading, setShowNewHeading] = useState(false);

  if (projectLoading || tasksLoading) {
    return (
      <ListView title="Project" icon="📁">
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading...</div>
      </ListView>
    );
  }

  if (!project) {
    return (
      <ListView title="Project" icon="📁">
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Project not found</div>
      </ListView>
    );
  }

  const handleCreateHeading = () => {
    if (!newHeadingTitle.trim() || !contextId) return;

    createHeading({
      title: newHeadingTitle.trim(),
      listId: contextId,
      archived: false,
      sortOrder: Date.now()
    });

    setNewHeadingTitle('');
    setShowNewHeading(false);
  };

  const handleTitleChange = (newTitle: string) => {
    if (contextId) {
      updateList(contextId, { title: newTitle });
    }
  };

  // Group tasks by heading
  const tasksWithoutHeading = tasks.filter(t => !t.headingId);
  const tasksByHeading = headings.reduce((acc, heading) => {
    acc[heading.id] = tasks.filter(t => t.headingId === heading.id);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <ListView title={project.title} icon="📁" onTitleChange={handleTitleChange}>
      {/* Project notes */}
      {project.notes && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">{project.notes}</p>
        </div>
      )}

      {/* Tasks without heading */}
      {tasksWithoutHeading.length > 0 && (
        <div className="mb-8">
          <TaskList tasks={tasksWithoutHeading} />
        </div>
      )}

      {/* Headings with their tasks */}
      {headings.map(heading => (
        <div key={heading.id} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{heading.title}</h2>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <button
              onClick={() => deleteHeading(heading.id)}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
            >
              Delete
            </button>
          </div>
          <TaskList
            tasks={tasksByHeading[heading.id] || []}
            emptyMessage="No tasks in this heading"
          />
        </div>
      ))}

      {/* Add heading button */}
      <div className="mt-6">
        {showNewHeading ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newHeadingTitle}
              onChange={(e) => setNewHeadingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateHeading();
                if (e.key === 'Escape') setShowNewHeading(false);
              }}
              placeholder="Heading name..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
              autoFocus
            />
            <button
              onClick={handleCreateHeading}
              className="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 text-sm"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowNewHeading(false);
                setNewHeadingTitle('');
              }}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewHeading(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-lg">+</span>
            <span>Add Heading</span>
          </button>
        )}
      </div>
    </ListView>
  );
}
