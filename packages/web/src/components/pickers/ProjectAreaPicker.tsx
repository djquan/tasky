import { useProjects, useAreas } from '../../hooks/useEntities';

interface ProjectAreaPickerProps {
  projectId: string | null;
  areaId: string | null;
  onChangeProject: (projectId: string | null) => void;
  onChangeArea: (areaId: string | null) => void;
}

export function ProjectAreaPicker({
  projectId,
  areaId,
  onChangeProject,
  onChangeArea
}: ProjectAreaPickerProps) {
  const { projects } = useProjects();
  const { areas } = useAreas();

  const activeProjects = projects.filter(p => !p.completed && !p.canceled);
  const activeAreas = areas;

  const handleSelectProject = (id: string | null) => {
    onChangeProject(id);
    // Selecting a project clears direct area assignment (mutually exclusive)
    if (id !== null) {
      onChangeArea(null);
    }
  };

  const handleSelectArea = (id: string | null) => {
    onChangeArea(id);
    // Selecting an area clears project assignment (mutually exclusive)
    if (id !== null) {
      onChangeProject(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-gray-700 dark:text-gray-300">
        <strong>Note:</strong> A task can belong to either a project OR an area, not both.
      </div>

      {/* Project selector */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Project {projectId && '(task will be in this project)'}
        </label>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelectProject(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              projectId === null
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            None
          </button>
          {activeProjects.map(project => (
            <button
              type="button"
              key={project.id}
              onClick={() => handleSelectProject(project.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                projectId === project.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {project.title}
              {project.areaId && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  ({activeAreas.find(a => a.id === project.areaId)?.title})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
        <span className="text-xs">OR</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
      </div>

      {/* Area selector */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Area {areaId && '(task will be directly in this area)'}
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => handleSelectArea(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              areaId === null
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            None
          </button>
          {activeAreas.map(area => (
            <button
              type="button"
              key={area.id}
              onClick={() => handleSelectArea(area.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                areaId === area.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {area.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
