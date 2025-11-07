import { useState } from 'react';
import { useNavigation } from '../../store/navigation';
import { useSmartListCounts } from '../../hooks/useSmartLists';
import { useAreas, useProjects } from '../../hooks/useEntities';
import { createList } from '../../lib/lists';
import type { ViewType, ListType } from '@tasky/shared';

export function Sidebar() {
  const { currentView, setView, toggleQuickEntry } = useNavigation();
  const { counts } = useSmartListCounts();
  const { areas } = useAreas();
  const { projects } = useProjects();
  const [showListTypePopup, setShowListTypePopup] = useState(false);

  const activeProjects = projects.filter(p => !p.completed && !p.canceled);
  const activeAreas = areas; // Show all areas (tasks can be directly in areas now)

  const handleCreateList = (type: ListType) => {
    const newList = createList({
      type,
      title: type === 'project' ? 'New Project' : 'New Area',
      notes: '',
      when: 'anytime',
      scheduledDate: null,
      deadline: null,
      parentListId: null,
      tags: [],
      completed: false,
      canceled: false,
      sortOrder: Date.now()
    });
    setView(type === 'project' ? 'project' : 'area', newList.id);
    setShowListTypePopup(false);
  };

  const smartLists: Array<{ view: ViewType; label: string; count: number; icon: string }> = [
    { view: 'inbox', label: 'Inbox', count: counts.inbox, icon: '📥' },
    { view: 'today', label: 'Today', count: counts.today, icon: '⭐' },
    { view: 'upcoming', label: 'Upcoming', count: counts.upcoming, icon: '📅' },
    { view: 'anytime', label: 'Anytime', count: counts.anytime, icon: '📋' },
    { view: 'someday', label: 'Someday', count: counts.someday, icon: '🌙' }
  ];

  return (
    <aside className="w-64 bg-light-bg dark:bg-dark-bg border-r border-light-border dark:border-dark-border h-screen overflow-y-auto">
      {/* Smart Lists */}
      <nav className="p-4">
        <div className="space-y-1">
          {smartLists.map(({ view, label, count, icon }) => (
            <button
              key={view}
              onClick={() => setView(view)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                currentView === view
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-light-hover dark:hover:bg-dark-hover'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{label}</span>
              </span>
              {count > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-light-hover dark:bg-dark-hover text-gray-600 dark:text-gray-400">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Separator */}
      <div className="border-t border-light-border dark:border-dark-border my-2" />

      {/* Lists (Projects & Areas) */}
      <div className="p-4 relative">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Lists
          </h2>
          <button
            onClick={() => setShowListTypePopup(!showListTypePopup)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            title="Add List"
          >
            <span className="text-lg">+</span>
          </button>
        </div>

        {/* List Type Popup */}
        {showListTypePopup && (
          <div className="absolute top-8 right-4 z-50 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-xl p-2 min-w-[160px]">
            <button
              onClick={() => handleCreateList('project')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📁</span>
              <span>New Project</span>
            </button>
            <button
              onClick={() => handleCreateList('area')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors flex items-center gap-2"
            >
              <span>🗂️</span>
              <span>New Area</span>
            </button>
          </div>
        )}

        {/* Click outside to close popup */}
        {showListTypePopup && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowListTypePopup(false)}
          />
        )}

        {/* Projects without parent area */}
        {activeProjects.filter(p => !p.parentListId).length === 0 && activeAreas.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">No lists yet</p>
        ) : (
          <>
            {activeProjects.filter(p => !p.parentListId).length > 0 && (
              <div className="space-y-1 mb-4">
                {activeProjects
                  .filter(p => !p.parentListId)
                  .map(project => (
                    <button
                      key={project.id}
                      onClick={() => setView('project', project.id)}
                      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center gap-2 ${
                        currentView === 'project' && project.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover'
                      }`}
                    >
                      <span className="text-base">📁</span>
                      <span className="flex-1 truncate">{project.title}</span>
                    </button>
                  ))}
              </div>
            )}

            {/* Areas */}
            {activeAreas.length > 0 && (
              <div className="space-y-3">
                {activeAreas.map(area => {
                  const areaProjects = activeProjects.filter(p => p.parentListId === area.id);
                  return (
                    <div key={area.id}>
                      <button
                        onClick={() => setView('area', area.id)}
                        className={`w-full text-left px-2 py-1 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                          currentView === 'area' && area.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-light-hover dark:hover:bg-dark-hover'
                        }`}
                      >
                        <span className="text-base">🗂️</span>
                        <span className="flex-1 truncate">{area.title}</span>
                      </button>

                      {areaProjects.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {areaProjects.map(project => (
                            <button
                              key={project.id}
                              onClick={() => setView('project', project.id)}
                              className={`w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center gap-2 ${
                                currentView === 'project' && project.id
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-light-hover dark:hover:bg-dark-hover'
                              }`}
                            >
                              <span className="text-base">📁</span>
                              <span className="flex-1 truncate">{project.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-light-border dark:border-dark-border my-2" />

      {/* Logbook */}
      <nav className="p-4">
        <button
          onClick={() => setView('logbook')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            currentView === 'logbook'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
              : 'text-gray-700 dark:text-gray-200 hover:bg-light-hover dark:hover:bg-dark-hover'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>✓</span>
            <span>Logbook</span>
          </span>
          {counts.logbook > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-light-hover dark:bg-dark-hover text-gray-600 dark:text-gray-400">
              {counts.logbook}
            </span>
          )}
        </button>
      </nav>
    </aside>
  );
}
