import { useSortedLists } from '../../hooks/useEntities';

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
  const { lists: sortedLists } = useSortedLists();

  const activeProjects = sortedLists.filter(p => p.type === 'project' && !p.completed && !p.canceled);

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

  // Build hierarchical list structure from sorted lists
  const allLists: Array<{ id: string; title: string; listType: 'project' | 'area'; icon: string; level: number }> = [];

  for (const list of sortedLists) {
    if (list.completed || list.canceled) continue;

    if (list.type === 'area') {
      allLists.push({
        id: list.id,
        title: list.title,
        listType: 'area',
        icon: '🗂️',
        level: 0
      });
      // Add child projects
      const children = activeProjects.filter(p => p.parentListId === list.id);
      for (const child of children) {
        allLists.push({
          id: child.id,
          title: child.title,
          listType: 'project',
          icon: '📁',
          level: 1
        });
      }
    } else if (!list.parentListId) {
      // Top-level project
      allLists.push({
        id: list.id,
        title: list.title,
        listType: 'project',
        icon: '📁',
        level: 0
      });
    }
  }

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
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${list.level > 0 ? 'ml-4' : ''
              } ${currentListId === list.id
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
