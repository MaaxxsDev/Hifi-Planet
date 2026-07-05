import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'hifiplanet-cookie-consent';

const defaultConsent = { necessary: true, external: false };

const CookieConsentContext = createContext({
  consent: defaultConsent,
  decided: false,
  settingsOpen: false,
  acceptAll: () => {},
  rejectNonEssential: () => {},
  saveCustom: () => {},
  openSettings: () => {},
  closeSettings: () => {},
});

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(defaultConsent);
  const [decided, setDecided] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setConsent({ necessary: true, external: !!parsed.external });
        setDecided(true);
      }
    } catch {
      // beschädigter Storage-Eintrag -> Banner wird erneut angezeigt
    }
  }, []);

  const persist = useCallback((next) => {
    setConsent(next);
    setDecided(true);
    setSettingsOpen(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, decidedAt: new Date().toISOString() }));
  }, []);

  const acceptAll = useCallback(() => persist({ necessary: true, external: true }), [persist]);
  const rejectNonEssential = useCallback(() => persist({ necessary: true, external: false }), [persist]);
  const saveCustom = useCallback((partial) => persist({ necessary: true, external: !!partial.external }), [persist]);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <CookieConsentContext.Provider
      value={{ consent, decided, settingsOpen, acceptAll, rejectNonEssential, saveCustom, openSettings, closeSettings }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}
