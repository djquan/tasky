import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../store/navigation';
import { createTask } from '../lib/tasks';
import { createProject } from '../lib/projects';
import { createArea } from '../lib/areas';
import { useProjects, useAreas } from '../hooks/useEntities';
import { WhenPicker } from './pickers/WhenPicker';
import type { WhenValue } from '@tasky/shared';

type QuickEntryMode = 'task' | 'project' | 'area';

export function QuickEntry() {
  const { quickEntryOpen, toggleQuickEntry } = useNavigation();
  const { projects } = useProjects();
  const { areas } = useAreas();

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<QuickEntryMode>('task');
  const [when, setWhen] = useState<WhenValue>('anytime');  // Default to anytime
  const [scheduledDate, setScheduledDate] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [areaId, setAreaId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (quickEntryOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [quickEntryOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Space or Ctrl+Space to toggle
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        toggleQuickEntry();
      }

      // Escape to close
      if (e.code === 'Escape' && quickEntryOpen) {
        toggleQuickEntry();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickEntryOpen, toggleQuickEntry]);

  if (!quickEntryOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    switch (mode) {
      case 'task':
        createTask({
          title: input.trim(),
          notes: '',
          when,
          scheduledDate,
          deadline: null,
          tags: [],
          checklistItems: [],
          projectId,
          areaId,
          headingId: null,
          completed: false,
          canceled: false,
          sortOrder: Date.now()
        });
        break;

      case 'project':
        createProject({
          title: input.trim(),
          notes: '',
          when: 'anytime',
          scheduledDate: null,
          deadline: null,
          areaId,
          tags: [],
          completed: false,
          canceled: false,
          sortOrder: Date.now()
        });
        break;

      case 'area':
        createArea({
          title: input.trim(),
          tags: [],
          sortOrder: Date.now()
        });
        break;
    }

    // Reset and close
    setInput('');
    setMode('task');
    setWhen('anytime');
    setScheduledDate(null);
    setProjectId(null);
    setAreaId(null);
    toggleQuickEntry();
  };

  const activeProjects = projects.filter(p => !p.completed && !p.canceled);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-start justify-center pt-32"
        onClick={toggleQuickEntry}
      >
        {/* Quick Entry Modal */}
        <div
          className="w-full max-w-2xl bg-white rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            {/* Main Input */}
            <div className="p-6">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`New ${mode}...`}
                className="w-full text-2xl font-medium focus:outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Mode Selector */}
            <div className="px-6 pb-4 flex gap-2 border-b border-gray-200">
              {(['task', 'project', 'area'] as QuickEntryMode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    mode === m
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Options (for tasks) */}
            {mode === 'task' && (
              <div className="p-6 space-y-4 border-b border-gray-200">
                {/* When selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    When
                  </label>
                  <WhenPicker
                    value={when}
                    scheduledDate={scheduledDate}
                    onChange={setWhen}
                    onScheduledDateChange={setScheduledDate}
                  />
                </div>

                {/* Project selector */}
                {activeProjects.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                      Project
                    </label>
                    <select
                      value={projectId || ''}
                      onChange={(e) => setProjectId(e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">None</option>
                      {activeProjects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Options (for projects) */}
            {mode === 'project' && areas.length > 0 && (
              <div className="p-6 space-y-4 border-b border-gray-200">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Area
                  </label>
                  <select
                    value={areaId || ''}
                    onChange={(e) => setAreaId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">None</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd</kbd> +{' '}
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd> to close
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleQuickEntry}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Add {mode}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
