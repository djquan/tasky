import { useNavigation } from '../../store/navigation';
import { useSmartListCounts } from '../../hooks/useSmartLists';
import type { ViewType } from '@tasky/shared';

export function BottomNav() {
  const { currentView, setView } = useNavigation();
  const { counts } = useSmartListCounts();

  const navItems: Array<{ view: ViewType; label: string; count: number; icon: string }> = [
    { view: 'inbox', label: 'Inbox', count: counts.inbox, icon: '📥' },
    { view: 'today', label: 'Today', count: counts.today, icon: '⭐' },
    { view: 'upcoming', label: 'Upcoming', count: counts.upcoming, icon: '📅' },
    { view: 'anytime', label: 'Anytime', count: counts.anytime, icon: '📋' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map(({ view, label, count, icon }) => (
          <button
            key={view}
            onClick={() => setView(view)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors ${
              currentView === view
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <div className="relative">
              <span className="text-xl">{icon}</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-medium bg-blue-600 text-white rounded-full px-1">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
