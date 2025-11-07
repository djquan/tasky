import { useEffect, useState, RefObject, useRef } from 'react';
import { useNavigation } from '../../store/navigation';
import { useTask } from '../../hooks/useEntities';
import { updateTask } from '../../lib/tasks';
import { WhenPicker } from './WhenPicker';
import type { WhenValue } from '@tasky/shared';

interface WhenPopupProps {
  buttonRef: RefObject<HTMLButtonElement | null>;
}

export function WhenPopup({ buttonRef }: WhenPopupProps) {
  const { selectedTaskIds, whenPopupOpen, closeWhenPopup } = useNavigation();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Use a ref to always have the latest selectedTaskIds
  const selectedTaskIdsRef = useRef(selectedTaskIds);
  useEffect(() => {
    selectedTaskIdsRef.current = selectedTaskIds;
  }, [selectedTaskIds]);

  // Get the first selected task to show current values (for display purposes)
  const firstTaskId = selectedTaskIds.size > 0 ? Array.from(selectedTaskIds)[0] : null;
  const { task: firstTask } = useTask(firstTaskId);

  // Calculate position relative to button
  useEffect(() => {
    if (!whenPopupOpen || !buttonRef.current) return;

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
  }, [whenPopupOpen, buttonRef]);

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && whenPopupOpen) {
        closeWhenPopup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [whenPopupOpen, closeWhenPopup]);

  // Close when clicking outside
  useEffect(() => {
    if (!whenPopupOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        const popup = document.querySelector('[data-when-popup]');
        if (popup && !popup.contains(target)) {
          closeWhenPopup();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [whenPopupOpen, closeWhenPopup, buttonRef]);

  if (!whenPopupOpen || selectedTaskIds.size === 0 || !position || !firstTask) return null;

  const handleWhenChange = (when: WhenValue) => {
    // Always read from ref to get the latest selectedTaskIds
    const taskIds = Array.from(selectedTaskIdsRef.current);
    taskIds.forEach(taskId => {
      updateTask(taskId, {
        when,
        scheduledDate: null // Clear scheduledDate when setting a when value
      });
    });
    // Don't auto-close, let user close manually
  };

  const handleScheduledDateChange = (scheduledDate: number | null) => {
    // Always read from ref to get the latest selectedTaskIds
    const taskIds = Array.from(selectedTaskIdsRef.current);
    taskIds.forEach(taskId => {
      // When setting a scheduledDate, we keep the when value but scheduledDate takes priority in display
      updateTask(taskId, { scheduledDate });
    });
    // Don't auto-close, let user close manually
  };

  return (
    <div
      data-when-popup
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
            Updating {selectedTaskIds.size} tasks
          </div>
        )}
        <WhenPicker
          value={firstTask.when}
          scheduledDate={firstTask.scheduledDate}
          onChange={handleWhenChange}
          onScheduledDateChange={handleScheduledDateChange}
        />
      </div>
    </div>
  );
}

