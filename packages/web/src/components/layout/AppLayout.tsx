import { ReactNode, useRef, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TaskDetail } from '../tasks/TaskDetail';
import { QuickEntry } from '../QuickEntry';
import { WhenPopup } from '../pickers/WhenPopup';
import { ListPopup } from '../pickers/ListPopup';
import { SearchPopup } from '../pickers/SearchPopup';
import { useNavigation } from '../../store/navigation';
import { cancelTask } from '../../lib/tasks';
import { tasksMap } from '../../lib/yjs';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen, taskDetailOpen, selectedTaskIds, openWhenPopup, openListPopup, openSearchPopup, toggleQuickEntry, whenPopupOpen, listPopupOpen, searchPopupOpen, clearSelection } = useNavigation();
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const listButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  // Track if any selected task is canceled (trashed)
  const [hasTrashedTask, setHasTrashedTask] = useState(false);

  // Check if any selected task is canceled (trashed) and subscribe to changes
  useEffect(() => {
    const checkTrashedTasks = () => {
      if (selectedTaskIds.size === 0) {
        setHasTrashedTask(false);
        return;
      }
      const hasTrashed = Array.from(selectedTaskIds).some(taskId => {
        const task = tasksMap.get(taskId);
        return task?.canceled === true;
      });
      setHasTrashedTask(hasTrashed);
    };

    checkTrashedTasks();

    // Subscribe to task changes
    tasksMap.observe(checkTrashedTasks);

    return () => {
      tasksMap.unobserve(checkTrashedTasks);
    };
  }, [selectedTaskIds]);

  // Keyboard shortcuts: Cmd+K/Ctrl+K or Cmd+F/Ctrl+F to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isMetaKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+K/Ctrl+K or Cmd+F/Ctrl+F to open search
      if (isMetaKey && (e.key === 'k' || e.key === 'f')) {
        e.preventDefault();
        openSearchPopup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearchPopup]);

  const handleMainClick = (e: React.MouseEvent) => {
    // Clear selection when clicking on empty space (not on a task or popup)
    const target = e.target as HTMLElement;
    if (
      selectedTaskIds.size > 0 &&
      !target.closest('[data-task-row]') &&
      !target.closest('[data-when-popup]') &&
      !target.closest('[data-list-popup]') &&
      !target.closest('[data-search-popup]') &&
      !target.closest('[data-task-detail]') &&
      !target.closest('button')
    ) {
      clearSelection();
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTaskIds.size === 0) return;

    // Cancel (soft delete) all selected tasks - they'll appear in trash
    selectedTaskIds.forEach(taskId => {
      cancelTask(taskId);
    });

    // Clear selection after deletion
    clearSelection();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-light-bg dark:bg-dark-bg">
      {/* Desktop Sidebar */}
      {sidebarOpen && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto pb-20 md:pb-16 bg-light-surface dark:bg-dark-surface relative"
        onClick={handleMainClick}
      >
        {children}

        {/* Bottom Bar (Desktop) */}
        <div className={`hidden md:flex fixed bottom-0 bg-light-bg dark:bg-dark-bg border-t border-light-border dark:border-dark-border px-6 py-3 items-center justify-start gap-6 ${sidebarOpen ? 'left-64' : 'left-0'} right-0`}>
          <button
            onClick={toggleQuickEntry}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            aria-label="Add new task"
            title="Add new task (Cmd+N)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="relative">
            <button
              ref={calendarButtonRef}
              onClick={openWhenPopup}
              disabled={selectedTaskIds.size === 0}
              className={`transition-colors ${selectedTaskIds.size > 0
                ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                } ${whenPopupOpen ? 'text-blue-600 dark:text-blue-400' : ''}`}
              aria-label="Schedule task"
              title={selectedTaskIds.size > 0 ? `Schedule ${selectedTaskIds.size} selected task${selectedTaskIds.size > 1 ? 's' : ''}` : 'Select a task to schedule'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            {whenPopupOpen && (
              <WhenPopup buttonRef={calendarButtonRef} />
            )}
          </div>
          <div className="relative">
            <button
              ref={listButtonRef}
              onClick={openListPopup}
              disabled={selectedTaskIds.size === 0}
              className={`transition-colors ${selectedTaskIds.size > 0
                ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                } ${listPopupOpen ? 'text-blue-600 dark:text-blue-400' : ''}`}
              aria-label="Move to list"
              title={selectedTaskIds.size > 0 ? `Move ${selectedTaskIds.size} selected task${selectedTaskIds.size > 1 ? 's' : ''} to list` : 'Select a task to move'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {listPopupOpen && (
              <ListPopup buttonRef={listButtonRef} />
            )}
          </div>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedTaskIds.size === 0 || hasTrashedTask}
            className={`transition-colors ${selectedTaskIds.size > 0 && !hasTrashedTask
              ? 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
            aria-label="Delete selected tasks"
            title={hasTrashedTask ? 'Cannot delete trashed tasks' : selectedTaskIds.size > 0 ? `Delete ${selectedTaskIds.size} selected task${selectedTaskIds.size > 1 ? 's' : ''}` : 'Select a task to delete'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <div className="relative">
            <button
              ref={searchButtonRef}
              onClick={openSearchPopup}
              className={`transition-colors ${searchPopupOpen
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              aria-label="Search"
              title="Search tasks and lists (Cmd+F or Cmd+K)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {searchPopupOpen && (
              <SearchPopup buttonRef={searchButtonRef} />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Task Detail Panel */}
      {taskDetailOpen && <TaskDetail />}

      {/* Quick Entry (Cmd+N) */}
      <QuickEntry />
    </div>
  );
}
