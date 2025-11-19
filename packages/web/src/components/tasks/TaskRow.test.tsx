import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskRow } from './TaskRow';
import { createMockTask, renderWithProviders } from '../../test/component-utils';
import * as tasks from '../../lib/tasks';
import * as useEntitiesHooks from '../../hooks/useEntities';
import * as navigationStore from '../../store/navigation';

// Mock modules
vi.mock('../../lib/tasks', () => ({
  toggleTask: vi.fn(),
}));

vi.mock('../../hooks/useEntities', () => ({
  useTags: vi.fn(),
}));

vi.mock('../../store/navigation', () => ({
  useNavigation: vi.fn(),
}));

describe('TaskRow', () => {
  const mockNavigationFunctions = {
    selectTask: vi.fn(),
    toggleTaskSelection: vi.fn(),
    selectTaskRange: vi.fn(),
    openTaskDetail: vi.fn(),
    currentView: 'inbox' as const,
    selectedTaskIds: new Set<string>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(useEntitiesHooks.useTags).mockReturnValue({
      tags: [],
      isLoading: false,
    });

    vi.mocked(navigationStore.useNavigation).mockReturnValue({
      ...mockNavigationFunctions,
      selectedTaskIds: new Set<string>(),
      // Add other required navigation properties with default values
      currentView: 'inbox',
      currentListId: null,
      currentTagId: null,
      taskDetailOpen: false,
      searchPopupOpen: false,
      sidebarOpen: false,
      setView: vi.fn(),
      selectTask: mockNavigationFunctions.selectTask,
      toggleTaskSelection: mockNavigationFunctions.toggleTaskSelection,
      selectTaskRange: mockNavigationFunctions.selectTaskRange,
      openTaskDetail: mockNavigationFunctions.openTaskDetail,
      closeTaskDetail: vi.fn(),
      openSearchPopup: vi.fn(),
      closeSearchPopup: vi.fn(),
      toggleSidebar: vi.fn(),
    });
  });

  it('renders task title', () => {
    const task = createMockTask({ title: 'Test Task' });
    renderWithProviders(<TaskRow task={task} allTaskIds={[task.id]} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders task notes when present', () => {
    const task = createMockTask({
      title: 'Test Task',
      notes: 'These are my notes'
    });
    renderWithProviders(<TaskRow task={task} allTaskIds={[task.id]} />);

    expect(screen.getByText('These are my notes')).toBeInTheDocument();
  });

  it('toggles task completion when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const task = createMockTask({ id: 'task-1' });
    renderWithProviders(<TaskRow task={task} allTaskIds={[task.id]} />);

    const checkbox = screen.getByRole('button', { name: '' });
    await user.click(checkbox);

    expect(tasks.toggleTask).toHaveBeenCalledWith('task-1');
  });

  it('selects task on regular click', async () => {
    const user = userEvent.setup();
    const task = createMockTask({ id: 'task-1' });
    renderWithProviders(<TaskRow task={task} allTaskIds={[task.id]} />);

    const row = screen.getByText('Test Task').closest('[data-task-row]');
    expect(row).toBeInTheDocument();
    await user.click(row!);

    expect(mockNavigationFunctions.selectTask).toHaveBeenCalledWith('task-1');
  });

  it('toggles selection on meta/ctrl+click', () => {
    const task = createMockTask({ id: 'task-1' });
    renderWithProviders(<TaskRow task={task} allTaskIds={[task.id]} />);

    const row = screen.getByText('Test Task').closest('[data-task-row]');
    expect(row).toBeInTheDocument();

    // Simulate Ctrl+click (Windows/Linux)
    fireEvent.click(row!, { ctrlKey: true });

    expect(mockNavigationFunctions.toggleTaskSelection).toHaveBeenCalledWith('task-1');
  });

  it('selects range on shift+click', () => {
    const task = createMockTask({ id: 'task-1' });
    const allTaskIds = ['task-0', 'task-1', 'task-2'];
    renderWithProviders(<TaskRow task={task} allTaskIds={allTaskIds} />);

    const row = screen.getByText('Test Task').closest('[data-task-row]');
    expect(row).toBeInTheDocument();

    // Simulate Shift+click
    fireEvent.click(row!, { shiftKey: true });

    expect(mockNavigationFunctions.selectTaskRange).toHaveBeenCalledWith('task-1', allTaskIds);
  });

  it('opens detail on second click of selected task', async () => {
    const user = userEvent.setup();
    const task = createMockTask({ id: 'task-1' });

    // Mock task as already selected
    vi.mocked(navigationStore.useNavigation).mockReturnValue({
      ...mockNavigationFunctions,
      selectedTaskIds: new Set(['task-1']),
      currentView: 'inbox',
      currentListId: null,
      currentTagId: null,
      taskDetailOpen: false,
      searchPopupOpen: false,
      sidebarOpen: false,
      setView: vi.fn(),
      selectTask: mockNavigationFunctions.selectTask,
      toggleTaskSelection: mockNavigationFunctions.toggleTaskSelection,
      selectTaskRange: mockNavigationFunctions.selectTaskRange,
      openTaskDetail: mockNavigationFunctions.openTaskDetail,
      closeTaskDetail: vi.fn(),
      openSearchPopup: vi.fn(),
      closeSearchPopup: vi.fn(),
      toggleSidebar: vi.fn(),
    });

    renderWithProviders(<TaskRow task={task} allTaskIds={[task.id]} />);

    const row = screen.getByText('Test Task').closest('[data-task-row]');
    expect(row).toBeInTheDocument();
    await user.click(row!);

    expect(mockNavigationFunctions.openTaskDetail).toHaveBeenCalled();
  });

  it('applies selected styles when task is selected', () => {
    const task = createMockTask({ id: 'task-1' });

    vi.mocked(navigationStore.useNavigation).mockReturnValue({
      ...mockNavigationFunctions,
      selectedTaskIds: new Set(['task-1']),
      currentView: 'inbox',
      currentListId: null,
      currentTagId: null,
      taskDetailOpen: false,
      searchPopupOpen: false,
      sidebarOpen: false,
      setView: vi.fn(),
      selectTask: mockNavigationFunctions.selectTask,
      toggleTaskSelection: mockNavigationFunctions.toggleTaskSelection,
      selectTaskRange: mockNavigationFunctions.selectTaskRange,
      openTaskDetail: mockNavigationFunctions.openTaskDetail,
      closeTaskDetail: vi.fn(),
      openSearchPopup: vi.fn(),
      closeSearchPopup: vi.fn(),
      toggleSidebar: vi.fn(),
    });

    renderWithProviders(<TaskRow task={task} allTaskIds={[task.id]} />);

    const row = screen.getByText('Test Task').closest('[data-task-row]');
    expect(row).toHaveClass('bg-blue-600');
  });

  it('displays scheduled date when present', () => {
    const tomorrow = Date.now() + 86400000; // Tomorrow
    const task = createMockTask({ scheduledDate: tomorrow });
    renderWithProviders(<TaskRow task={task} allTaskIds={[task.id]} />);

    // Check for calendar icon
    expect(screen.getByText(/📅/)).toBeInTheDocument();
  });

  it('displays tags when present', () => {
    const task = createMockTask({ tags: ['tag-1'] });

    vi.mocked(useEntitiesHooks.useTags).mockReturnValue({
      tags: [{ id: 'tag-1', name: 'Important', parentId: null, color: '#ff0000', createdAt: 0, updatedAt: 0, sortOrder: 0 }],
      isLoading: false,
    });

    renderWithProviders(<TaskRow task={task} allTaskIds={[task.id]} />);

    expect(screen.getByText('Important')).toBeInTheDocument();
  });
});
