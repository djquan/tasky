import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListView } from './ListView';
import { renderWithProviders } from '../../test/component-utils';
import * as navigationStore from '../../store/navigation';

vi.mock('../../store/navigation', () => ({
  useNavigation: vi.fn(),
}));

describe('ListView', () => {
  const mockToggleSidebar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(navigationStore.useNavigation).mockReturnValue({
      toggleSidebar: mockToggleSidebar,
      currentView: 'inbox',
      contextId: null,
      lastSelectedTaskId: null,
      selectedTaskIds: new Set<string>(),
      taskDetailOpen: false,
      whenPopupOpen: false,
      listPopupOpen: false,
      searchPopupOpen: false,
      quickEntryOpen: false,
      settingsOpen: false,
      sidebarOpen: false,
      setView: vi.fn(),
      selectTask: vi.fn(),
      toggleTaskSelection: vi.fn(),
      selectTaskRange: vi.fn(),
      clearSelection: vi.fn(),
      openTaskDetail: vi.fn(),
      closeTaskDetail: vi.fn(),
      openWhenPopup: vi.fn(),
      closeWhenPopup: vi.fn(),
      openListPopup: vi.fn(),
      closeListPopup: vi.fn(),
      openSearchPopup: vi.fn(),
      closeSearchPopup: vi.fn(),
      toggleQuickEntry: vi.fn(),
      openSettings: vi.fn(),
      closeSettings: vi.fn(),
    });
  });

  it('renders title', () => {
    renderWithProviders(
      <ListView title="Test View">
        <div>Content</div>
      </ListView>
    );

    expect(screen.getByText('Test View')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    renderWithProviders(
      <ListView title="Test View" icon="📁">
        <div>Content</div>
      </ListView>
    );

    expect(screen.getByText('📁')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderWithProviders(
      <ListView title="Test View">
        <div data-testid="child-content">Test Content</div>
      </ListView>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('toggles sidebar when hamburger button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ListView title="Test View">
        <div>Content</div>
      </ListView>
    );

    const hamburgerButton = screen.getByRole('button', { name: 'Toggle sidebar' });
    await user.click(hamburgerButton);

    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('allows editing title when onTitleChange is provided', async () => {
    const user = userEvent.setup();
    const handleTitleChange = vi.fn();

    renderWithProviders(
      <ListView title="Test View" onTitleChange={handleTitleChange}>
        <div>Content</div>
      </ListView>
    );

    const title = screen.getByText('Test View');
    await user.click(title);

    // Check that input appears
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Test View');
  });

  it('saves edited title on blur', async () => {
    const user = userEvent.setup();
    const handleTitleChange = vi.fn();

    renderWithProviders(
      <ListView title="Test View" onTitleChange={handleTitleChange}>
        <div>Content</div>
      </ListView>
    );

    const title = screen.getByText('Test View');
    await user.click(title);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'New Title');
    await user.tab(); // Blur the input

    expect(handleTitleChange).toHaveBeenCalledWith('New Title');
  });

  it('saves edited title on Enter key', async () => {
    const user = userEvent.setup();
    const handleTitleChange = vi.fn();

    renderWithProviders(
      <ListView title="Test View" onTitleChange={handleTitleChange}>
        <div>Content</div>
      </ListView>
    );

    const title = screen.getByText('Test View');
    await user.click(title);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'New Title{Enter}');

    expect(handleTitleChange).toHaveBeenCalledWith('New Title');
  });

  it('cancels editing on Escape key', async () => {
    const user = userEvent.setup();
    const handleTitleChange = vi.fn();

    renderWithProviders(
      <ListView title="Test View" onTitleChange={handleTitleChange}>
        <div>Content</div>
      </ListView>
    );

    const title = screen.getByText('Test View');
    await user.click(title);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'New Title{Escape}');

    expect(handleTitleChange).not.toHaveBeenCalled();
    expect(screen.getByText('Test View')).toBeInTheDocument();
  });

  it('does not allow editing when onTitleChange is not provided', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ListView title="Test View">
        <div>Content</div>
      </ListView>
    );

    const title = screen.getByText('Test View');
    await user.click(title);

    // Input should not appear
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('auto-enables editing for default project name', () => {
    renderWithProviders(
      <ListView title="New Project" onTitleChange={vi.fn()}>
        <div>Content</div>
      </ListView>
    );

    // Should automatically show input for editing
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('New Project');
  });

  it('auto-enables editing for default area name', () => {
    renderWithProviders(
      <ListView title="New Area" onTitleChange={vi.fn()}>
        <div>Content</div>
      </ListView>
    );

    // Should automatically show input for editing
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('New Area');
  });
});
