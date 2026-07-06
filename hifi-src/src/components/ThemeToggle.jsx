import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ overHero = false }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Theme umschalten"
      className={`rounded-full p-2 transition ${
        overHero ? 'text-white hover:bg-white/10' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
      }`}
    >
      {theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm0 15a5 5 0 100-10 5 5 0 000 10zm9-6a1 1 0 010 2h-1a1 1 0 110-2h1zM4 12a1 1 0 010 2H3a1 1 0 110-2h1zm14.36-7.36a1 1 0 011.42 1.42l-.71.7a1 1 0 11-1.41-1.4l.7-.72zM5.64 18.36a1 1 0 011.41 1.41l-.7.71a1 1 0 11-1.42-1.41l.71-.71zm12.72 0l.71.7a1 1 0 11-1.41 1.42l-.71-.71a1 1 0 011.41-1.41zM6.34 5.64l-.7-.7A1 1 0 117.05 3.5l.7.71A1 1 0 016.34 5.64zM12 6a1 1 0 011-1v0a1 1 0 01-1 1zm0 12a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M9.53 2.25a.75.75 0 01.19.82 8.25 8.25 0 0011.03 11.03.75.75 0 011.01.99A10.5 10.5 0 1112.9 2.1a.75.75 0 011.63-.85z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
