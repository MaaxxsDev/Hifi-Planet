import { createContext, useContext, useEffect, useState } from 'react';
import { dictionaries } from '../i18n/index.js';

function detectDefaultLanguage() {
  const stored = localStorage.getItem('hifi-lang');
  if (stored === 'de' || stored === 'en') return stored;
  const browserLang = (navigator.language || 'de').toLowerCase();
  return browserLang.startsWith('de') ? 'de' : 'en';
}

function lookup(dict, key) {
  return key.split('.').reduce((obj, part) => (obj == null ? undefined : obj[part]), dict);
}

// Default-Wert (nicht null) analog zu MaintenanceContext/SiteSettingsContext, damit
// Komponenten, die sowohl im öffentlichen Bereich (mit Provider) als auch im
// Admin-Panel (ohne Provider, bleibt bewusst Deutsch) verwendet werden - z. B.
// ThemeToggle - nicht abstürzen, wenn kein LanguageProvider im Baum ist.
const LanguageContext = createContext({
  language: 'de',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => {
    const value = lookup(dictionaries.de, key);
    return value !== undefined ? value : key;
  },
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(detectDefaultLanguage);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem('hifi-lang', language);
  }, [language]);

  const toggleLanguage = () => setLanguage((l) => (l === 'de' ? 'en' : 'de'));

  const t = (key) => {
    const dict = dictionaries[language] || dictionaries.de;
    const value = lookup(dict, key);
    if (value !== undefined) return value;
    const fallback = lookup(dictionaries.de, key);
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
