import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';

// Prüft bei jedem Seitenaufruf, ob die Ersteinrichtung (Datenbank, Struktur, erster
// Admin-Account) schon abgeschlossen ist. Falls nicht, wird - egal welche URL
// aufgerufen wurde - auf /setup umgeleitet. Ist die Einrichtung bereits
// abgeschlossen, kommt man umgekehrt nicht mehr auf /setup rein.
//
// Der Status wird zusammen mit dem Pfad gespeichert, für den er ermittelt wurde:
// direkt nach einem Pfadwechsel ist der zuletzt bekannte Stand noch der des ALTEN
// Pfads. Würde man den sofort auswerten, könnte das kurzzeitig zu einer falschen
// Umleitung führen (z.B. zurück auf /setup, obwohl man gerade fertig eingerichtet
// hat und eigentlich zu /admin/login navigiert). Deshalb wird erst wieder
// entschieden, wenn der Stand nachweislich für den aktuellen Pfad frisch ist.
export default function SetupGate({ children }) {
  const [state, setState] = useState({ pathname: null, needsSetup: null });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    api
      .get('/setup/status')
      .then((status) => {
        if (!cancelled) setState({ pathname: location.pathname, needsSetup: status.needs_setup });
      })
      .catch(() => {
        if (!cancelled) setState({ pathname: location.pathname, needsSetup: false });
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (state.pathname !== location.pathname || state.needsSetup === null) {
    return <div className="min-h-screen bg-white dark:bg-neutral-950" />;
  }

  if (state.needsSetup && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }
  if (!state.needsSetup && location.pathname === '/setup') {
    return <Navigate to="/" replace />;
  }

  return children;
}
