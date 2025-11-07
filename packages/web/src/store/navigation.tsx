import { createContext, useContext, useState, ReactNode } from 'react';
import type { ViewType } from '@tasky/shared';

interface NavigationState {
  currentView: ViewType;
  contextId: string | null;
  sidebarOpen: boolean;
  selectedTaskIds: Set<string>;
  lastSelectedTaskId: string | null;
  taskDetailOpen: boolean;
  whenPopupOpen: boolean;
  listPopupOpen: boolean;
  searchPopupOpen: boolean;
  quickEntryOpen: boolean;
}

interface NavigationActions {
  setView: (view: ViewType, contextId?: string | null) => void;
  toggleSidebar: () => void;
  selectTask: (taskId: string | null) => void;
  toggleTaskSelection: (taskId: string) => void;
  selectTaskRange: (taskId: string, allTasks: string[]) => void;
  clearSelection: () => void;
  openTaskDetail: () => void;
  closeTaskDetail: () => void;
  openWhenPopup: () => void;
  closeWhenPopup: () => void;
  openListPopup: () => void;
  closeListPopup: () => void;
  openSearchPopup: () => void;
  closeSearchPopup: () => void;
  toggleQuickEntry: () => void;
}

type NavigationContextType = NavigationState & NavigationActions;

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('inbox');
  const [contextId, setContextId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [lastSelectedTaskId, setLastSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [whenPopupOpen, setWhenPopupOpen] = useState(false);
  const [listPopupOpen, setListPopupOpen] = useState(false);
  const [searchPopupOpen, setSearchPopupOpen] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);

  const setView = (view: ViewType, id: string | null = null) => {
    setCurrentView(view);
    setContextId(id);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const selectTask = (taskId: string | null) => {
    if (taskId === null) {
      setSelectedTaskIds(new Set());
      setLastSelectedTaskId(null);
      setTaskDetailOpen(false);
      setWhenPopupOpen(false);
      setListPopupOpen(false);
    } else {
      setSelectedTaskIds(new Set([taskId]));
      setLastSelectedTaskId(taskId);
      setTaskDetailOpen(false);
      setWhenPopupOpen(false);
      setListPopupOpen(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
        if (lastSelectedTaskId === taskId) {
          setLastSelectedTaskId(newSet.size > 0 ? Array.from(newSet)[newSet.size - 1] : null);
        }
      } else {
        newSet.add(taskId);
        setLastSelectedTaskId(taskId);
      }
      return newSet;
    });
    setTaskDetailOpen(false);
    setWhenPopupOpen(false);
    setListPopupOpen(false);
  };

  const selectTaskRange = (taskId: string, allTasks: string[]) => {
    if (!lastSelectedTaskId) {
      // If no previous selection, just select this task
      setSelectedTaskIds(new Set([taskId]));
      setLastSelectedTaskId(taskId);
      return;
    }

    const lastIndex = allTasks.indexOf(lastSelectedTaskId);
    const currentIndex = allTasks.indexOf(taskId);

    if (lastIndex === -1 || currentIndex === -1) {
      // Fallback to single selection
      setSelectedTaskIds(new Set([taskId]));
      setLastSelectedTaskId(taskId);
      return;
    }

    const start = Math.min(lastIndex, currentIndex);
    const end = Math.max(lastIndex, currentIndex);
    const range = allTasks.slice(start, end + 1);

    setSelectedTaskIds(new Set(range));
    setLastSelectedTaskId(taskId);
    setTaskDetailOpen(false);
    setWhenPopupOpen(false);
    setListPopupOpen(false);
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
    setLastSelectedTaskId(null);
    setTaskDetailOpen(false);
    setWhenPopupOpen(false);
    setListPopupOpen(false);
  };

  const openTaskDetail = () => {
    if (selectedTaskIds.size === 1) {
      setTaskDetailOpen(true);
    }
  };

  const closeTaskDetail = () => {
    setTaskDetailOpen(false);
    // Don't clear selection when closing detail
  };

  const openWhenPopup = () => {
    if (selectedTaskIds.size > 0) {
      setWhenPopupOpen(true);
    }
  };

  const closeWhenPopup = () => {
    setWhenPopupOpen(false);
  };

  const openListPopup = () => {
    if (selectedTaskIds.size > 0) {
      setListPopupOpen(true);
    }
  };

  const closeListPopup = () => {
    setListPopupOpen(false);
  };

  const openSearchPopup = () => {
    setSearchPopupOpen(true);
  };

  const closeSearchPopup = () => {
    setSearchPopupOpen(false);
  };

  const toggleQuickEntry = () => setQuickEntryOpen(!quickEntryOpen);

  return (
    <NavigationContext.Provider
      value={{
        currentView,
        contextId,
        sidebarOpen,
        selectedTaskIds,
        lastSelectedTaskId,
        taskDetailOpen,
        whenPopupOpen,
        listPopupOpen,
        searchPopupOpen,
        quickEntryOpen,
        setView,
        toggleSidebar,
        selectTask,
        toggleTaskSelection,
        selectTaskRange,
        clearSelection,
        openTaskDetail,
        closeTaskDetail,
        openWhenPopup,
        closeWhenPopup,
        openListPopup,
        closeListPopup,
        openSearchPopup,
        closeSearchPopup,
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
