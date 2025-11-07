import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigation } from '../../store/navigation';
import { useSmartListCounts } from '../../hooks/useSmartLists';
import { useSortedLists } from '../../hooks/useEntities';
import { createList, moveListInSortOrder, moveListToArea } from '../../lib/lists';
import { listsSortOrder } from '../../lib/yjs';
import type { ViewType, ListType, List } from '@tasky/shared';

interface SortableListItemProps {
  list: List;
  level: number;
  currentView: ViewType;
  contextId: string | null;
  setView: (view: ViewType, id?: string) => void;
  isOver?: boolean;
}

function SortableListItem({ list, level, currentView, contextId, setView, isOver }: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const isActive = (currentView === 'project' && contextId === list.id) ||
    (currentView === 'area' && contextId === list.id);

  const icon = list.type === 'project' ? '📁' : '🗂️';
  const viewType = list.type === 'project' ? 'project' : 'area';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={level > 0 ? 'ml-6' : ''}
    >
      <button
        onClick={() => setView(viewType, list.id)}
        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center gap-2 cursor-grab active:cursor-grabbing ${level === 0 && list.type === 'area' ? 'font-medium' : ''
          } ${isActive
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : isOver
              ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-400 dark:ring-blue-500 ring-inset'
              : list.type === 'area'
                ? 'text-gray-700 dark:text-gray-200 hover:bg-light-hover dark:hover:bg-dark-hover'
                : 'text-gray-600 dark:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover'
          }`}
        {...attributes}
        {...listeners}
      >
        <span className="text-base">{icon}</span>
        <span className="flex-1 truncate">{list.title}</span>
      </button>
    </div>
  );
}

function BottomDropZone({ draggedItem }: { draggedItem: { list: List; level: number } | null }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'bottom-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-4 transition-colors ${isOver && draggedItem
          ? 'bg-blue-200 dark:bg-blue-800 border-t-2 border-blue-400 dark:border-blue-600'
          : 'bg-transparent'
        }`}
    />
  );
}

export function Sidebar() {
  const { currentView, contextId, setView } = useNavigation();
  const { counts } = useSmartListCounts();
  const { lists: sortedLists } = useSortedLists();
  const [showListTypePopup, setShowListTypePopup] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeProjects = sortedLists.filter(p => p.type === 'project' && !p.completed && !p.canceled);

  // Build hierarchical structure from sorted lists
  const listItems: Array<{ list: List; level: number }> = [];
  for (const list of sortedLists) {
    if (list.completed || list.canceled) continue;

    if (list.type === 'area') {
      listItems.push({ list, level: 0 });
      // Add child projects
      const children = activeProjects.filter(p => p.parentListId === list.id);
      for (const child of children) {
        listItems.push({ list: child, level: 1 });
      }
    } else if (!list.parentListId) {
      // Top-level project
      listItems.push({ list, level: 0 });
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || over.id === 'bottom-drop-zone') {
      setOverId(null);
      return;
    }

    const draggedItem = listItems.find(item => item.list.id === active.id);
    const overItem = listItems.find(item => item.list.id === over.id);

    if (!draggedItem || !overItem) {
      setOverId(null);
      return;
    }

    const draggedList = sortedLists.find(l => l.id === active.id);
    const overList = sortedLists.find(l => l.id === over.id);

    if (!draggedList || !overList) {
      setOverId(null);
      return;
    }

    // Determine what should be highlighted based on the actual drop logic
    let highlightId: string | null = null;

    // If dragging level 0 over level 1, highlight the parent area (not the nested project)
    if (draggedItem.level === 0 && overItem.level === 1 && overList.parentListId) {
      highlightId = overList.parentListId;
    }
    // If dragging area into top-level project, don't highlight (invalid)
    else if (draggedList.type === 'area' && overList.type === 'project' && !overList.parentListId) {
      highlightId = null;
    }
    // For same-level reordering, highlight based on where it will actually be inserted
    else if (draggedItem.level === overItem.level) {
      const draggedVisualIndex = listItems.findIndex(item => item.list.id === active.id);
      const overVisualIndex = listItems.findIndex(item => item.list.id === over.id);

      if (draggedVisualIndex !== -1 && overVisualIndex !== -1) {
        // When dragging down, item will be inserted AFTER the target
        // When dragging up, item will be inserted AT the target position (before it)
        // Highlight the item that will be immediately after the insertion point
        if (draggedVisualIndex < overVisualIndex) {
          // Dragging down: will insert after target, so highlight target (it will be before inserted item)
          highlightId = over.id as string;
        } else {
          // Dragging up: will insert at target position, so highlight target (it will be after inserted item)
          highlightId = over.id as string;
        }
      }
    }
    // Otherwise highlight the item being dragged over
    else {
      highlightId = over.id as string;
    }

    setOverId(highlightId);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const draggedList = sortedLists.find(l => l.id === active.id);

    // Handle dropping on bottom drop zone
    if (over.id === 'bottom-drop-zone') {
      if (!draggedList) return;
      const draggedItem = listItems.find(item => item.list.id === active.id);
      if (!draggedItem) return;

      // If dragging a nested project to bottom, un-nest it first
      if (draggedList.type === 'project' && draggedList.parentListId) {
        // Find the last top-level item
        const sortArray = listsSortOrder.toArray();
        let lastTopLevelIndex = -1;
        for (let i = sortArray.length - 1; i >= 0; i--) {
          const item = sortedLists.find(l => l.id === sortArray[i]);
          if (item && !item.parentListId) {
            lastTopLevelIndex = i;
            break;
          }
        }
        if (lastTopLevelIndex !== -1) {
          moveListToArea(draggedList.id, null, lastTopLevelIndex + 1);
        } else {
          moveListToArea(draggedList.id, null);
        }
        return;
      }

      // Move to end of same level
      const sameLevelItems = listItems.filter(item => item.level === draggedItem.level);
      if (sameLevelItems.length > 0) {
        const lastItem = sameLevelItems[sameLevelItems.length - 1];
        const sortArray = listsSortOrder.toArray();
        const targetIndex = sortArray.indexOf(lastItem.list.id);
        if (targetIndex !== -1) {
          moveListInSortOrder(draggedList.id, targetIndex + 1);
        }
      }
      return;
    }

    const overList = sortedLists.find(l => l.id === over.id);

    if (!draggedList) return;

    // Get item info for level checking
    const draggedItem = listItems.find(item => item.list.id === active.id);
    const overItem = listItems.find(item => item.list.id === over.id);

    if (!draggedItem || !overItem) return;

    // Prevent invalid operations: cannot drag area into a top-level project
    // (But allow dragging over nested projects - handled below)
    if (draggedList.type === 'area' && overList && overList.type === 'project' && !overList.parentListId) {
      // Cannot drag area into top-level project
      return;
    }

    // If dragging a level 0 item (area or top-level project) over a level 1 item (nested project),
    // always insert after the parent area and all its children
    if (draggedItem.level === 0 && overItem.level === 1) {
      if (!overList || !overList.parentListId) {
        return;
      }

      const parentArea = sortedLists.find(l => l.id === overList.parentListId && l.type === 'area');
      if (parentArea) {
        const sortArray = listsSortOrder.toArray();
        const parentSortIndex = sortArray.indexOf(parentArea.id);

        if (parentSortIndex !== -1) {
          // Find the last child of the parent area
          let lastChildIndex = parentSortIndex;
          for (let i = parentSortIndex + 1; i < sortArray.length; i++) {
            const item = sortedLists.find(l => l.id === sortArray[i]);
            if (item && item.parentListId === parentArea.id) {
              lastChildIndex = i;
            } else {
              break;
            }
          }
          // Always insert after the last child when dragging over a nested project
          moveListInSortOrder(draggedList.id, lastChildIndex + 1);
        }
        return;
      }
    }

    // If dragging a nested project (level 1) onto a top-level item (level 0), un-nest it
    if (draggedList.type === 'project' && draggedList.parentListId && overItem.level === 0) {
      // Find the target index in the sort order array (not sortedLists, which filters completed/canceled)
      const sortArray = listsSortOrder.toArray();
      const targetIndex = sortArray.indexOf(overList?.id || '');
      if (targetIndex !== -1) {
        moveListToArea(draggedList.id, null, targetIndex);
      } else {
        moveListToArea(draggedList.id, null);
      }
      return;
    }

    // Check if dropping on an area (to nest project)
    if (overList && overList.type === 'area' && draggedList.type === 'project') {
      // Prevent circular reference and don't nest if already nested in this area
      if (draggedList.parentListId !== overList.id) {
        moveListToArea(draggedList.id, overList.id);
      }
      return;
    }

    // Only allow reordering within the same level
    if (draggedItem.level !== overItem.level) {
      return;
    }

    // Find visual positions in listItems (the hierarchical structure we're displaying)
    const draggedVisualIndex = listItems.findIndex(item => item.list.id === draggedList.id);
    const overVisualIndex = listItems.findIndex(item => item.list.id === overList?.id);

    if (draggedVisualIndex === -1 || overVisualIndex === -1) return;

    // Find indices in the actual sort order array
    const sortArray = listsSortOrder.toArray();
    const currentSortIndex = sortArray.indexOf(draggedList.id);
    const overSortIndex = sortArray.indexOf(overList?.id || '');

    if (currentSortIndex === -1 || overSortIndex === -1) return;

    // Determine if we're dragging down visually (draggedVisualIndex < overVisualIndex)
    // Standard drag-and-drop behavior:
    // - Dragging down: insert AFTER the target (target stays above)
    // - Dragging up: insert BEFORE the target (target moves down)
    const insertIndex = draggedVisualIndex < overVisualIndex
      ? overSortIndex + 1  // Dragging down: insert after target
      : overSortIndex;     // Dragging up: insert at target position (before it)

    moveListInSortOrder(draggedList.id, insertIndex);
  };

  const handleCreateList = (type: ListType) => {
    const newList = createList({
      type,
      title: type === 'project' ? 'New Project' : 'New Area',
      notes: '',
      when: 'anytime',
      scheduledDate: null,
      deadline: null,
      parentListId: null,
      tags: [],
      completed: false,
      canceled: false,
      sortOrder: Date.now()
    });
    setView(type === 'project' ? 'project' : 'area', newList.id);
    setShowListTypePopup(false);
  };

  const smartLists: Array<{ view: ViewType; label: string; count: number; icon: string }> = [
    { view: 'inbox', label: 'Inbox', count: counts.inbox, icon: '📥' },
    { view: 'today', label: 'Today', count: counts.today, icon: '⭐' },
    { view: 'upcoming', label: 'Upcoming', count: counts.upcoming, icon: '📅' },
    { view: 'anytime', label: 'Anytime', count: counts.anytime, icon: '📋' },
    { view: 'someday', label: 'Someday', count: counts.someday, icon: '🌙' }
  ];

  return (
    <aside className="w-64 bg-light-bg dark:bg-dark-bg border-r border-light-border dark:border-dark-border h-screen flex flex-col">
      {/* Smart Lists */}
      <nav className="p-4 flex-shrink-0">
        <div className="space-y-1">
          {smartLists.map(({ view, label, count, icon }) => (
            <button
              key={view}
              onClick={() => setView(view)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${currentView === view
                ? 'bg-gray-700 dark:bg-gray-700 text-white font-medium'
                : 'text-gray-700 dark:text-gray-200 hover:bg-light-hover dark:hover:bg-dark-hover'
                }`}
            >
              <span className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{label}</span>
              </span>
              {count > 0 && view !== 'anytime' && view !== 'upcoming' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-light-hover dark:bg-dark-hover text-gray-600 dark:text-gray-400">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Separator */}
      <div className="border-t border-light-border dark:border-dark-border my-2 flex-shrink-0" />

      {/* Logbook & Trash */}
      <nav className="p-4 flex-shrink-0">
        <div className="space-y-1">
          <button
            onClick={() => setView('logbook')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${currentView === 'logbook'
              ? 'bg-gray-700 dark:bg-gray-700 text-white font-medium'
              : 'text-gray-700 dark:text-gray-200 hover:bg-light-hover dark:hover:bg-dark-hover'
              }`}
          >
            <span className="flex items-center gap-2">
              <span>✓</span>
              <span>Logbook</span>
            </span>
          </button>
          <button
            onClick={() => setView('trash')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${currentView === 'trash'
              ? 'bg-gray-700 dark:bg-gray-700 text-white font-medium'
              : 'text-gray-700 dark:text-gray-200 hover:bg-light-hover dark:hover:bg-dark-hover'
              }`}
          >
            <span className="flex items-center gap-2">
              <span>🗑️</span>
              <span>Trash</span>
            </span>
            {counts.trash > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-light-hover dark:bg-dark-hover text-gray-600 dark:text-gray-400">
                {counts.trash}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Separator */}
      <div className="border-t border-light-border dark:border-dark-border my-2 flex-shrink-0" />

      {/* Lists (Projects & Areas) */}
      <div className="p-4 relative flex-1 overflow-y-auto">
        {listItems.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={listItems.map(item => item.list.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {listItems.map(({ list, level }) => (
                  <SortableListItem
                    key={list.id}
                    list={list}
                    level={level}
                    currentView={currentView}
                    contextId={contextId}
                    setView={setView}
                    isOver={overId === list.id}
                  />
                ))}
                <BottomDropZone
                  draggedItem={activeId ? listItems.find(item => item.list.id === activeId) || null : null}
                />
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                (() => {
                  const activeList = sortedLists.find(l => l.id === activeId);
                  if (!activeList) return null;
                  const icon = activeList.type === 'project' ? '📁' : '🗂️';
                  return (
                    <div className="px-2 py-1 rounded text-sm flex items-center gap-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-lg">
                      <span className="text-base">{icon}</span>
                      <span className="flex-1 truncate">{activeList.title}</span>
                    </div>
                  );
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-light-border dark:border-dark-border p-4 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setShowListTypePopup(!showListTypePopup)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          + New List
        </button>
        <button
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          title="Filters"
          aria-label="Filters"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* List Type Popup */}
      {showListTypePopup && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowListTypePopup(false)}
          />
          <div className="absolute bottom-16 left-4 right-4 z-50 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-xl p-2 min-w-[160px]">
            <button
              onClick={() => handleCreateList('project')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📁</span>
              <span>New Project</span>
            </button>
            <button
              onClick={() => handleCreateList('area')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors flex items-center gap-2"
            >
              <span>🗂️</span>
              <span>New Area</span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}