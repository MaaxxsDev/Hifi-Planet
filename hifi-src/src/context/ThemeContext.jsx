import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

// Hellmodus 6:30-21:00 Uhr, sonst Dunkelmodus - gilt nur als Startwert, solange noch
// keine manuelle Wahl gespeichert ist (die manuelle Umschaltung bleibt danach bestehen,
// genau wie bei der Spracherkennung).
function detectDefaultTheme() {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  return hour >= 6.5 && hour < 21 ? 'light' : 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('hifi-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return detectDefaultTheme();
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('hifi-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
