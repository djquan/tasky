import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TaskDetail } from '../tasks/TaskDetail';
import { QuickEntry } from '../QuickEntry';
import { useNavigation } from '../../store/navigation';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen, selectedTaskId, toggleQuickEntry } = useNavigation();

  return (
    <div className="flex h-screen overflow-hidden bg-light-bg dark:bg-dark-bg">
      {/* Desktop Sidebar */}
      {sidebarOpen && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-light-surface dark:bg-dark-surface">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Task Detail Panel */}
      {selectedTaskId && <TaskDetail />}

      {/* Quick Entry (Cmd+N) */}
      <QuickEntry />

      {/* Floating Action Button */}
      <button
        onClick={toggleQuickEntry}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
        aria-label="Add new task"
        title="Add new task (Cmd+N)"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}
