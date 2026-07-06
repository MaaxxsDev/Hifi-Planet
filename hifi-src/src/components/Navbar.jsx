import { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import DynamicIcon from './DynamicIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';
import logo from '../assets/logo.png';

const SHOP_URL = 'https://www.audio4cars.de/';

const digitsOnly = (value) => (value || '').replace(/[^\d+]/g, '');

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { phone, whatsapp } = useSiteSettings();

  const AdminIcon = user && (
    <Link
      to="/admin"
      aria-label="Zum Admin-Panel"
      title="Zum Admin-Panel"
      className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <DynamicIcon name="layout-dashboard" className="h-5 w-5" />
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      {/* Schmale Kontakt-Leiste (Telefon/WhatsApp/Shop) - auf kleinen Screens ausgeblendet,
          steht dort stattdessen im aufklappbaren mobilen Menü. */}
      <div className="hidden border-b border-slate-100 bg-slate-50 px-4 py-1.5 text-xs text-slate-600 dark:border-slate-900 dark:bg-slate-900/40 dark:text-slate-400 sm:px-6 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-5">
          {phone && (
            <a href={`tel:${digitsOnly(phone)}`} className="flex items-center gap-1.5 hover:text-brand-500">
              <DynamicIcon name="phone" className="h-3.5 w-3.5" />
              {phone}
            </a>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${digitsOnly(whatsapp).replace(/^0/, '49').replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-brand-500"
            >
              <DynamicIcon name="message-circle" className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          )}
          <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-500">
            <DynamicIcon name="shopping-bag" className="h-3.5 w-3.5" />
            Zum Shop
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-self-start">
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <Link to="/fahrzeuge" className="hover:text-brand-500">Fahrzeuge</Link>
            <Link to="/leistungen" className="hover:text-brand-500">Leistungen</Link>
            <Link to="/kontakt" className="hover:text-brand-500">Kontakt</Link>
          </nav>

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menü öffnen"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <Link to="/" className="flex items-center justify-self-center rounded-lg px-2 py-1 dark:bg-white">
          <img src={logo} alt="HifiPlanet" className="h-11 w-auto sm:h-14" />
        </Link>

        <div className="flex items-center justify-self-end gap-1">
          {AdminIcon}
          <ThemeToggle />
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300 md:hidden">
          <Link to="/fahrzeuge" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Fahrzeuge</Link>
          <Link to="/leistungen" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Leistungen</Link>
          <Link to="/kontakt" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Kontakt</Link>
          <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
          {phone && (
            <a href={`tel:${digitsOnly(phone)}`} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <DynamicIcon name="phone" className="h-4 w-4" />
              {phone}
            </a>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${digitsOnly(whatsapp).replace(/^0/, '49').replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <DynamicIcon name="message-circle" className="h-4 w-4" />
              WhatsApp
            </a>
          )}
          <a
            href={SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <DynamicIcon name="shopping-bag" className="h-4 w-4" />
            Zum Shop
          </a>
        </nav>
      )}
    </header>
  );
}
