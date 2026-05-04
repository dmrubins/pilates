import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import OfflineBanner from './OfflineBanner.jsx';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <OfflineBanner />
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
