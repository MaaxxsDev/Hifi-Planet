import { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import logo from '../assets/logo.png';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center rounded-lg px-2 py-1 dark:bg-white">
          <img src={logo} alt="HifiPlanet" className="h-8 w-auto sm:h-10" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <Link to="/fahrzeuge" className="hover:text-brand-500">Fahrzeuge</Link>
          <Link to="/leistungen" className="hover:text-brand-500">Leistungen</Link>
          <Link to="/kontakt" className="hover:text-brand-500">Kontakt</Link>
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menü öffnen"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300 md:hidden">
          <Link to="/fahrzeuge" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Fahrzeuge</Link>
          <Link to="/leistungen" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Leistungen</Link>
          <Link to="/kontakt" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Kontakt</Link>
        </nav>
      )}
    </header>
  );
}
