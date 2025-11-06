import { NavigationProvider } from './store/navigation';
import { AppLayout } from './components/layout/AppLayout';
import { ViewRouter } from './components/ViewRouter';

function App() {
  return (
    <NavigationProvider>
      <AppLayout>
        <ViewRouter />
      </AppLayout>
    </NavigationProvider>
  );
}

export default App;
