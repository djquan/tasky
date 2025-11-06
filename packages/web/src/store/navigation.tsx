import { createContext, useContext, useState, ReactNode } from 'react';
import type { ViewType } from '@tasky/shared';

interface NavigationState {
  currentView: ViewType;
  contextId: string | null;
  sidebarOpen: boolean;
  selectedTaskId: string | null;
  quickEntryOpen: boolean;
}

interface NavigationActions {
  setView: (view: ViewType, contextId?: string | null) => void;
  toggleSidebar: () => void;
  selectTask: (taskId: string | null) => void;
  toggleQuickEntry: () => void;
}

type NavigationContextType = NavigationState & NavigationActions;

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('inbox');
  const [contextId, setContextId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);

  const setView = (view: ViewType, id: string | null = null) => {
    setCurrentView(view);
    setContextId(id);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const selectTask = (taskId: string | null) => setSelectedTaskId(taskId);
  const toggleQuickEntry = () => setQuickEntryOpen(!quickEntryOpen);

  return (
    <NavigationContext.Provider
      value={{
        currentView,
        contextId,
        sidebarOpen,
        selectedTaskId,
        quickEntryOpen,
        setView,
        toggleSidebar,
        selectTask,
        toggleQuickEntry
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
