import { useNavigation } from '../../store/navigation';
import { useProject, useHeadings } from '../../hooks/useEntities';
import { useProjectTasks } from '../../hooks/useSmartLists';
import { TaskList } from '../tasks/TaskList';
import { AddTaskInput } from '../tasks/AddTaskInput';
import { ListView } from './ListView';
import { createHeading, deleteHeading } from '../../lib/headings';
import { useState } from 'react';
import type { Task } from '@tasky/shared';

export function ProjectView() {
  const { contextId } = useNavigation();
  const { project, isLoading: projectLoading } = useProject(contextId);
  const { headings, isLoading: headingsLoading } = useHeadings(contextId);
  const { tasks, isLoading: tasksLoading } = useProjectTasks(contextId || '');
  const [newHeadingTitle, setNewHeadingTitle] = useState('');
  const [showNewHeading, setShowNewHeading] = useState(false);

  if (projectLoading || tasksLoading) {
    return (
      <ListView title="Project" icon="📁">
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </ListView>
    );
  }

  if (!project) {
    return (
      <ListView title="Project" icon="📁">
        <div className="text-center py-12 text-gray-400">Project not found</div>
      </ListView>
    );
  }

  const handleCreateHeading = () => {
    if (!newHeadingTitle.trim() || !contextId) return;

    createHeading({
      title: newHeadingTitle.trim(),
      projectId: contextId,
      archived: false,
      sortOrder: Date.now()
    });

    setNewHeadingTitle('');
    setShowNewHeading(false);
  };

  // Group tasks by heading
  const tasksWithoutHeading = tasks.filter(t => !t.headingId);
  const tasksByHeading = headings.reduce((acc, heading) => {
    acc[heading.id] = tasks.filter(t => t.headingId === heading.id);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <ListView title={project.title} icon="📁">
      {/* Project notes */}
      {project.notes && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">{project.notes}</p>
        </div>
      )}

      {/* Add task input */}
      <AddTaskInput
        projectId={project.id}
        placeholder="New task in this project..."
      />

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
            <h2 className="text-lg font-semibold text-gray-700">{heading.title}</h2>
            <div className="flex-1 h-px bg-gray-200"></div>
            <button
              onClick={() => {
                if (confirm('Delete this heading and move its tasks to the top?')) {
                  deleteHeading(heading.id);
                }
              }}
              className="text-xs text-gray-400 hover:text-red-600"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
            <button
              onClick={handleCreateHeading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowNewHeading(false);
                setNewHeadingTitle('');
              }}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewHeading(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">+</span>
            <span>Add Heading</span>
          </button>
        )}
      </div>
    </ListView>
  );
}
