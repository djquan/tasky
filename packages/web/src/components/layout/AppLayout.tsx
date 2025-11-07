import { ReactNode, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TaskDetail } from '../tasks/TaskDetail';
import { QuickEntry } from '../QuickEntry';
import { WhenPopup } from '../pickers/WhenPopup';
import { ListPopup } from '../pickers/ListPopup';
import { useNavigation } from '../../store/navigation';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen, taskDetailOpen, selectedTaskIds, openWhenPopup, openListPopup, toggleQuickEntry, whenPopupOpen, listPopupOpen, clearSelection } = useNavigation();
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const listButtonRef = useRef<HTMLButtonElement>(null);

  const handleMainClick = (e: React.MouseEvent) => {
    // Clear selection when clicking on empty space (not on a task or popup)
    const target = e.target as HTMLElement;
    if (
      selectedTaskIds.size > 0 &&
      !target.closest('[data-task-row]') &&
      !target.closest('[data-when-popup]') &&
      !target.closest('[data-list-popup]') &&
      !target.closest('[data-task-detail]') &&
      !target.closest('button')
    ) {
      clearSelection();
    }
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
              className={`transition-colors ${
                selectedTaskIds.size > 0
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
              className={`transition-colors ${
                selectedTaskIds.size > 0
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
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors ml-auto"
            aria-label="Search"
            title="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
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
