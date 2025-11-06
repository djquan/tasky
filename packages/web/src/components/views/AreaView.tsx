import { useNavigation } from '../../store/navigation';
import { useArea, useProjects } from '../../hooks/useEntities';
import { useAreaTasks } from '../../hooks/useSmartLists';
import { getAreaProjects } from '../../lib/filters';
import { TaskList } from '../tasks/TaskList';
import { AddTaskInput } from '../tasks/AddTaskInput';
import { ListView } from './ListView';
import { createProject } from '../../lib/projects';
import { useState } from 'react';

export function AreaView() {
  const { contextId, setView } = useNavigation();
  const { area, isLoading: areaLoading } = useArea(contextId);
  const { tasks, isLoading: tasksLoading } = useAreaTasks(contextId || '');
  const { projects: allProjects } = useProjects();
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);

  if (areaLoading || tasksLoading) {
    return (
      <ListView title="Area" icon="🗂️">
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </ListView>
    );
  }

  if (!area) {
    return (
      <ListView title="Area" icon="🗂️">
        <div className="text-center py-12 text-gray-400">Area not found</div>
      </ListView>
    );
  }

  const areaProjects = getAreaProjects(area.id);

  const handleCreateProject = () => {
    if (!newProjectTitle.trim() || !contextId) return;

    const project = createProject({
      title: newProjectTitle.trim(),
      notes: '',
      when: 'anytime',
      scheduledDate: null,
      deadline: null,
      areaId: contextId,
      tags: [],
      completed: false,
      canceled: false,
      sortOrder: Date.now()
    });

    setNewProjectTitle('');
    setShowNewProject(false);

    // Navigate to the new project
    setView('project', project.id);
  };

  return (
    <ListView title={area.title} icon="🗂️">
      {/* Projects in this area */}
      {areaProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Projects</h2>
          <div className="grid gap-2">
            {areaProjects.map(project => (
              <button
                key={project.id}
                onClick={() => setView('project', project.id)}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all text-left group"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{project.title}</h3>
                  {project.notes && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{project.notes}</p>
                  )}
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add project button */}
      <div className="mb-8">
        {showNewProject ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') setShowNewProject(false);
              }}
              placeholder="Project name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
            <button
              onClick={handleCreateProject}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewProject(false);
                setNewProjectTitle('');
              }}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <span className="text-lg">+</span>
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Direct tasks in this area (not in projects) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Tasks</h2>
        <AddTaskInput
          areaId={area.id}
          placeholder="New task in this area..."
        />
        <TaskList tasks={tasks} emptyMessage="No tasks in this area" />
      </div>
    </ListView>
  );
}
