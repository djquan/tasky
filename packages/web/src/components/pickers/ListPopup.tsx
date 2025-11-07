import { useEffect, useState, RefObject, useRef } from 'react';
import { useNavigation } from '../../store/navigation';
import { useTask, useProjects, useAreas } from '../../hooks/useEntities';
import { updateTask } from '../../lib/tasks';
import { ProjectAreaPicker } from './ProjectAreaPicker';

interface ListPopupProps {
  buttonRef: RefObject<HTMLButtonElement | null>;
}

export function ListPopup({ buttonRef }: ListPopupProps) {
  const { selectedTaskIds, listPopupOpen, closeListPopup } = useNavigation();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Use a ref to always have the latest selectedTaskIds
  const selectedTaskIdsRef = useRef(selectedTaskIds);
  useEffect(() => {
    selectedTaskIdsRef.current = selectedTaskIds;
  }, [selectedTaskIds]);

  // Get the first selected task to show current values (for display purposes)
  const firstTaskId = selectedTaskIds.size > 0 ? Array.from(selectedTaskIds)[0] : null;
  const { task: firstTask } = useTask(firstTaskId);
  const { projects } = useProjects();
  const { areas } = useAreas();

  // Determine if first task's listId is a project or area
  const { projectId, areaId } = (() => {
    if (!firstTask?.listId) return { projectId: null, areaId: null };
    const project = projects.find(p => p.id === firstTask.listId);
    const area = areas.find(a => a.id === firstTask.listId);
    return {
      projectId: project ? project.id : null,
      areaId: area ? area.id : null
    };
  })();

  // Calculate position relative to button
  useEffect(() => {
    if (!listPopupOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top - 10, // Position above the button with some spacing
          left: rect.left + rect.width / 2 // Center horizontally on button
        });
      }
    };

    updatePosition();

    // Update position on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [listPopupOpen, buttonRef]);

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && listPopupOpen) {
        closeListPopup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listPopupOpen, closeListPopup]);

  // Close when clicking outside
  useEffect(() => {
    if (!listPopupOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        const popup = document.querySelector('[data-list-popup]');
        if (popup && !popup.contains(target)) {
          closeListPopup();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [listPopupOpen, closeListPopup, buttonRef]);

  if (!listPopupOpen || selectedTaskIds.size === 0 || !position) return null;

  const handleProjectChange = (id: string | null) => {
    // Apply to all selected tasks - always read from ref to get the latest selectedTaskIds
    const taskIds = Array.from(selectedTaskIdsRef.current);
    taskIds.forEach(taskId => {
      updateTask(taskId, { listId: id });
    });
    // Don't auto-close, let user close manually
  };

  const handleAreaChange = (id: string | null) => {
    // Apply to all selected tasks - always read from ref to get the latest selectedTaskIds
    const taskIds = Array.from(selectedTaskIdsRef.current);
    taskIds.forEach(taskId => {
      updateTask(taskId, { listId: id });
    });
    // Don't auto-close, let user close manually
  };

  return (
    <div
      data-list-popup
      className="fixed z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div
        className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-xl p-4 min-w-[320px]"
        onClick={(e) => e.stopPropagation()}
      >
        {selectedTaskIds.size > 1 && (
          <div className="mb-3 text-xs text-gray-600 dark:text-gray-400">
            Moving {selectedTaskIds.size} tasks
          </div>
        )}
        <ProjectAreaPicker
          projectId={projectId}
          areaId={areaId}
          onChangeProject={handleProjectChange}
          onChangeArea={handleAreaChange}
        />
      </div>
    </div>
  );
}

