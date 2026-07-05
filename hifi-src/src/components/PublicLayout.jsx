import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import ScrollProgress from './ScrollProgress.jsx';
import MaintenanceNotice from './MaintenanceNotice.jsx';
import MaintenanceBypassBanner from './MaintenanceBypassBanner.jsx';
import CookieConsentBanner from './CookieConsentBanner.jsx';
import { MaintenanceProvider } from '../context/MaintenanceContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

const FALLBACK_STATUS = {
  global: { enabled: false, message: null },
  services: { enabled: false, message: null },
  vehicles: { enabled: false, message: null },
};

// Das Impressum (und die anderen rechtlichen Pflichtseiten) müssen laut § 5 DDG
// "leicht erkennbar und unmittelbar erreichbar" bleiben – auch während der
// generellen Wartung darf diese Erreichbarkeit nicht durch die Wartungsseite
// verdeckt werden.
const LEGAL_PATHS = ['/impressum', '/datenschutz', '/agb'];

export default function PublicLayout() {
  const [status, setStatus] = useState(null);
  const { loading: authLoading, hasPermission } = useAuth();
  const location = useLocation();

  useEffect(() => {
    api.get('/maintenance').then(setStatus).catch(() => setStatus(FALLBACK_STATUS));
  }, []);

  if (status === null || authLoading) {
    return <div className="min-h-screen bg-white dark:bg-slate-950" />;
  }

  const bypass = hasPermission('maintenance.bypass');
  const isLegalPage = LEGAL_PATHS.includes(location.pathname);

  if (status.global.enabled && !bypass && !isLegalPage) {
    return <MaintenanceNotice message={status.global.message} fullScreen />;
  }

  return (
    <MaintenanceProvider value={{ ...status, bypass }}>
      <div className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {bypass && status.global.enabled && <MaintenanceBypassBanner />}
        <ScrollProgress />
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CookieConsentBanner />
      </div>
    </MaintenanceProvider>
  );
}
