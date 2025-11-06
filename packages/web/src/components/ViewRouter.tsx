import { useNavigation } from '../store/navigation';
import { InboxView } from './views/InboxView';
import { TodayView } from './views/TodayView';
import { AnytimeView } from './views/AnytimeView';
import { SomedayView } from './views/SomedayView';
import { UpcomingView } from './views/UpcomingView';
import { LogbookView } from './views/LogbookView';
import { ProjectView } from './views/ProjectView';
import { AreaView } from './views/AreaView';

export function ViewRouter() {
  const { currentView } = useNavigation();

  switch (currentView) {
    case 'inbox':
      return <InboxView />;
    case 'today':
      return <TodayView />;
    case 'anytime':
      return <AnytimeView />;
    case 'someday':
      return <SomedayView />;
    case 'upcoming':
      return <UpcomingView />;
    case 'logbook':
      return <LogbookView />;
    case 'project':
      return <ProjectView />;
    case 'area':
      return <AreaView />;
    case 'tag':
      return <div className="p-8">Tag view coming soon</div>;
    default:
      return <InboxView />;
  }
}
