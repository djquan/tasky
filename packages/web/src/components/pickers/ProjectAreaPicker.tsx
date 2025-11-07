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

  const currentListId = projectId || areaId;

  const handleSelectList = (id: string, type: 'project' | 'area', e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Toggle: if clicking the same list, deselect it
    const isCurrentlySelected = (type === 'project' && projectId === id) || (type === 'area' && areaId === id);

    if (isCurrentlySelected) {
      // Deselecting - clear both
      onChangeProject(null);
      onChangeArea(null);
    } else {
      // Selecting a new list - just set the new value, don't clear the other type
      // The new value will overwrite the old one
      if (type === 'project') {
        onChangeProject(id);
      } else {
        onChangeArea(id);
      }
    }
  };

  // Combine all lists with their type
  const allLists = [
    ...activeAreas.map(area => ({ ...area, listType: 'area' as const, icon: '🗂️' })),
    ...activeProjects.map(project => ({ ...project, listType: 'project' as const, icon: '📁' }))
  ];

  return (
    <div>
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
        List
      </label>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {allLists.map(list => (
          <button
            type="button"
            key={list.id}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleSelectList(list.id, list.listType, e);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${currentListId === list.id
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <span>{list.icon}</span>
            <span className="flex-1">{list.title}</span>
            {currentListId === list.id && (
              <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
            )}
          </button>
        ))}
        {allLists.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2 px-3">
            No lists available
          </p>
        )}
      </div>
    </div>
  );
}
