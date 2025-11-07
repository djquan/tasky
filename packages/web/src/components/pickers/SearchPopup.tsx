import { useState, useEffect, useRef, RefObject, useMemo } from 'react';
import { useNavigation } from '../../store/navigation';
import { useTasks } from '../../hooks/useEntities';
import { useSortedLists } from '../../hooks/useEntities';
import { fuzzyMatch } from '../../lib/search';
import type { Task, List } from '@tasky/shared';

interface SearchPopupProps {
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

interface SearchResult {
  type: 'task' | 'list';
  id: string;
  title: string;
  subtitle?: string;
  score: number;
  item: Task | List;
}

export function SearchPopup({ buttonRef }: SearchPopupProps) {
  const { searchPopupOpen, closeSearchPopup, setView, selectTask } = useNavigation();
  const { tasks } = useTasks();
  const { lists } = useSortedLists();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Get lists map for quick lookup
  const listsMap = useMemo(() => new Map(lists.map(list => [list.id, list])), [lists]);

  // Focus input when popup opens and position is set
  useEffect(() => {
    if (searchPopupOpen && position) {
      // Use setTimeout to ensure the DOM is ready after render
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select(); // Select any existing text
        }
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [searchPopupOpen, position]);

  // Reset query and selected index when popup opens
  useEffect(() => {
    if (searchPopupOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [searchPopupOpen]);

  // Calculate position at top center of screen, ensuring it stays within viewport
  useEffect(() => {
    if (!searchPopupOpen) return;

    const updatePosition = () => {
      // Position popup at top center, but ensure it doesn't go off-screen
      const popupHeight = 400; // max-h-[400px] from the popup
      const topOffset = 100; // Desired offset from top
      const minTop = 20; // Minimum top position to ensure visibility

      // Calculate top position ensuring popup stays in viewport
      const top = Math.max(minTop, Math.min(topOffset, window.innerHeight - popupHeight - 20));

      setPosition({
        top: top,
        left: window.innerWidth / 2 // Center horizontally
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [searchPopupOpen]);

  // Perform fuzzy search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];

    // Search tasks
    tasks.forEach(task => {
      // Exclude canceled (deleted) and completed tasks
      if (task.canceled || task.completed) return;

      const titleScore = fuzzyMatch(query, task.title);
      const notesScore = task.notes ? fuzzyMatch(query, task.notes) : 0;
      const maxScore = Math.max(titleScore, notesScore);

      if (maxScore > 0) {
        searchResults.push({
          type: 'task',
          id: task.id,
          title: task.title,
          subtitle: task.notes ? task.notes.substring(0, 50) : undefined,
          score: maxScore,
          item: task
        });
      }
    });

    // Search lists
    lists.forEach(list => {
      if (list.completed || list.canceled) return;

      const titleScore = fuzzyMatch(query, list.title);
      const notesScore = list.notes ? fuzzyMatch(query, list.notes) : 0;
      const maxScore = Math.max(titleScore, notesScore);

      if (maxScore > 0) {
        searchResults.push({
          type: 'list',
          id: list.id,
          title: list.title,
          subtitle: list.type === 'project' ? 'Project' : 'Area',
          score: maxScore,
          item: list
        });
      }
    });

    // Sort by score (highest first)
    searchResults.sort((a, b) => b.score - a.score);

    // Limit to top 10 results
    setResults(searchResults.slice(0, 10));
    setSelectedIndex(0);
  }, [query, tasks, lists]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!searchPopupOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearchPopup();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          handleSelectResult(selected);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchPopupOpen, results, selectedIndex, closeSearchPopup]);

  // Close when clicking outside
  useEffect(() => {
    if (!searchPopupOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const popup = document.querySelector('[data-search-popup]');
      if (popup && !popup.contains(target)) {
        // Don't close if clicking the search button
        if (buttonRef?.current && buttonRef.current.contains(target)) {
          return;
        }
        closeSearchPopup();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchPopupOpen, closeSearchPopup, buttonRef]);

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'task') {
      const task = result.item as Task;
      selectTask(task.id);

      // Navigate to appropriate view based on task properties
      if (task.listId) {
        const list = listsMap.get(task.listId);
        if (list) {
          setView(list.type === 'project' ? 'project' : 'area', list.id);
        } else {
          setView('inbox');
        }
      } else {
        setView('inbox');
      }

      closeSearchPopup();
    } else {
      const list = result.item as List;
      setView(list.type === 'project' ? 'project' : 'area', list.id);
      closeSearchPopup();
    }
  };

  if (!searchPopupOpen || !position) return null;

  return (
    <div
      data-search-popup
      className="fixed z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)' // Only center horizontally, don't move up
      }}
    >
      <div
        className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-xl w-[500px] max-h-[400px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-light-border dark:border-dark-border">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks and lists..."
            className="w-full px-3 py-2 border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
          />
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {results.length === 0 && query.trim() && (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No results found
            </div>
          )}
          {results.length === 0 && !query.trim() && (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Start typing to search...
            </div>
          )}
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelectResult(result)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {result.type === 'task' ? '✓' : (result.item as List).type === 'project' ? '📁' : '🗂️'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${
                    index === selectedIndex
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {result.subtitle}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-light-border dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">
            {results.length} result{results.length !== 1 ? 's' : ''} • Use ↑↓ to navigate, Enter to select
          </div>
        )}
      </div>
    </div>
  );
}

