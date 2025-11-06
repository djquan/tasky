import { useNavigation } from '../../store/navigation';
import { useSmartListCounts } from '../../hooks/useSmartLists';
import { useAreas, useProjects } from '../../hooks/useEntities';
import type { ViewType } from '@tasky/shared';

export function Sidebar() {
  const { currentView, setView, toggleQuickEntry } = useNavigation();
  const { counts } = useSmartListCounts();
  const { areas } = useAreas();
  const { projects } = useProjects();

  const activeProjects = projects.filter(p => !p.completed && !p.canceled);
  const activeAreas = areas; // Show all areas (tasks can be directly in areas now)

  const smartLists: Array<{ view: ViewType; label: string; count: number; icon: string }> = [
    { view: 'inbox', label: 'Inbox', count: counts.inbox, icon: '📥' },
    { view: 'today', label: 'Today', count: counts.today, icon: '⭐' },
    { view: 'upcoming', label: 'Upcoming', count: counts.upcoming, icon: '📅' },
    { view: 'anytime', label: 'Anytime', count: counts.anytime, icon: '📋' },
    { view: 'someday', label: 'Someday', count: counts.someday, icon: '🌙' }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      {/* Smart Lists */}
      <nav className="p-4">
        <div className="space-y-1">
          {smartLists.map(({ view, label, count, icon }) => (
            <button
              key={view}
              onClick={() => setView(view)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                currentView === view
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{label}</span>
              </span>
              {count > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Separator */}
      <div className="border-t border-gray-200 my-2" />

      {/* Projects & Areas */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Projects
          </h2>
          <button
            onClick={toggleQuickEntry}
            className="text-gray-400 hover:text-gray-600"
            title="Quick Entry (Cmd+Space)"
          >
            <span className="text-lg">+</span>
          </button>
        </div>

        {/* Projects without area */}
        {activeProjects.filter(p => !p.areaId).length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">No projects yet</p>
        ) : (
          <div className="space-y-1 mb-4">
            {activeProjects
              .filter(p => !p.areaId)
              .map(project => (
                <button
                  key={project.id}
                  onClick={() => setView('project', project.id)}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                    currentView === 'project' && project.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {project.title}
                </button>
              ))}
          </div>
        )}

        {/* Areas */}
        {activeAreas.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">
              Areas
            </h3>
            <div className="space-y-3">
              {activeAreas.map(area => {
                const areaProjects = activeProjects.filter(p => p.areaId === area.id);
                return (
                  <div key={area.id}>
                    <button
                      onClick={() => setView('area', area.id)}
                      className={`w-full text-left px-2 py-1 rounded text-sm font-medium transition-colors ${
                        currentView === 'area' && area.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {area.title}
                    </button>

                    {areaProjects.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {areaProjects.map(project => (
                          <button
                            key={project.id}
                            onClick={() => setView('project', project.id)}
                            className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                              currentView === 'project' && project.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {project.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200 my-2" />

      {/* Logbook */}
      <nav className="p-4">
        <button
          onClick={() => setView('logbook')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            currentView === 'logbook'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>✓</span>
            <span>Logbook</span>
          </span>
          {counts.logbook > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
              {counts.logbook}
            </span>
          )}
        </button>
      </nav>
    </aside>
  );
}
