import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import DynamicIcon from './DynamicIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import logo from '../assets/logo.png';

const SHOP_URL = 'https://www.audio4cars.de/';

const digitsOnly = (value) => (value || '').replace(/[^\d+]/g, '');

const ITEM_DELAY_MS = 70;
const FLY_DURATION_MS = 500;

function FlagDE({ className }) {
  return (
    <svg viewBox="0 0 3 2" className={className} aria-hidden="true">
      <rect width="3" height="0.667" y="0" fill="#000" />
      <rect width="3" height="0.667" y="0.667" fill="#D00" />
      <rect width="3" height="0.666" y="1.334" fill="#FFCE00" />
    </svg>
  );
}

function FlagGB({ className }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden="true">
      <clipPath id="fgb-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#00247d" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#fgb-t)" stroke="#cf142b" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6" />
    </svg>
  );
}

const LANGUAGE_OPTIONS = [
  { code: 'de', label: 'Deutsch', Flag: FlagDE },
  { code: 'en', label: 'English', Flag: FlagGB },
];

function LanguageSwitcher({ overHero = false, variant = 'header', onOpenChange }) {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpenState] = useState(false);
  const containerRef = useRef(null);
  const current = LANGUAGE_OPTIONS.find((opt) => opt.code === language) || LANGUAGE_OPTIONS[0];
  const isHeader = variant === 'header';

  const setIsOpen = (value) => {
    setIsOpenState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      onOpenChange?.(next);
      return next;
    });
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('languageToggle.label')}
        className={
          isHeader
            ? `flex items-center gap-1 rounded-full p-1.5 transition ${overHero ? 'hover:bg-white/10' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`
            : 'flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-600 hover:text-brand-600'
        }
      >
        <span
          className={`block h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ${
            isHeader && overHero ? 'ring-white/50' : 'ring-neutral-300 dark:ring-neutral-600'
          }`}
        >
          <current.Flag className="h-full w-full" />
        </span>
        {!isHeader && current.label}
        {isHeader && (
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`h-3 w-3 transition-transform ${overHero ? 'text-white/70' : 'text-neutral-400'} ${isOpen ? 'rotate-180' : ''}`}
          >
            <path fillRule="evenodd" clipRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 mt-2 min-w-[9rem] overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 ${
            isHeader ? 'right-0' : 'left-0'
          }`}
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              type="button"
              role="option"
              aria-selected={opt.code === language}
              onClick={() => {
                setLanguage(opt.code);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                opt.code === language ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-neutral-700 dark:text-neutral-200'
              }`}
            >
              <span className="block h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-neutral-300 dark:ring-neutral-600">
                <opt.Flag className="h-full w-full" />
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { user } = useAuth();
  const { phone, whatsapp } = useSiteSettings();
  const { t } = useLanguage();
  const totalItems = whatsapp ? 9 : 8;
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(!isHome);

  // Auf der Startseite beginnt der Header transparent, verschmolzen mit dem Hero-Bild,
  // und wird erst zur weissen/dunklen Leiste, sobald man zu scrollen beginnt.
  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const transparent = isHome && !scrolled;

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Doppeltes rAF: nach dem Mounten braucht der Browser einen echten Paint mit der
      // "versteckten" Ausgangsposition, bevor wir auf "sichtbar" umschalten - sonst
      // fasst er beide Zustandsänderungen in einem Frame zusammen und es gibt keinen
      // sichtbaren Übergang (kein Fade-in).
      let rafInner;
      const rafOuter = requestAnimationFrame(() => {
        rafInner = requestAnimationFrame(() => setMenuVisible(true));
      });
      return () => {
        cancelAnimationFrame(rafOuter);
        if (rafInner) cancelAnimationFrame(rafInner);
      };
    }
    setMenuVisible(false);
    const closeDuration = FLY_DURATION_MS + (totalItems - 1) * ITEM_DELAY_MS;
    const id = setTimeout(() => setMounted(false), closeDuration);
    return () => clearTimeout(id);
  }, [open, totalItems]);

  const flyIn = () => `transition-all duration-500 ease-out ${menuVisible ? 'opacity-100' : 'opacity-0'}`;
  // Wie flyIn(), aber lässt sich zusätzlich per langMenuOpen abdunkeln - eine einzelne
  // opacity-Klasse statt zwei nebeneinander gesetzten, da bei gleichzeitig vorhandenen
  // Tailwind-opacity-Klassen die Reihenfolge im generierten CSS (nicht im class-Attribut)
  // entscheidet und "opacity-100" die Abdunklung sonst zufällig überschreiben kann.
  const flyInDimmable = () =>
    `transition-all duration-500 ease-out ${
      !menuVisible ? 'opacity-0' : langMenuOpen ? 'pointer-events-none opacity-20' : 'opacity-100'
    }`;
  const flyInStyle = (index) => {
    const delayIndex = menuVisible ? index : totalItems - 1 - index;
    return {
      transitionDelay: `${delayIndex * ITEM_DELAY_MS}ms`,
      transform: menuVisible ? 'translateY(0)' : 'translateY(-140px)',
    };
  };

  const AdminIcon = user && (
    <Link
      to="/admin"
      aria-label={t('nav.adminPanel')}
      title={t('nav.adminPanel')}
      className={`rounded-full p-2 transition ${
        transparent ? 'text-white hover:bg-white/10' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
      }`}
    >
      <DynamicIcon name="layout-dashboard" className="h-5 w-5" />
    </Link>
  );

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-colors duration-300 ${
        transparent
          ? 'border-transparent bg-transparent'
          : 'border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90'
      }`}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-self-start">
          <button
            onClick={() => setOpen(true)}
            aria-label={t('nav.openMenu')}
            className={`rounded-md p-2 transition ${
              transparent ? 'text-white hover:bg-white/10' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <Link to="/" className="flex items-center justify-self-center rounded-lg px-2 py-1 dark:bg-white">
          <img src={logo} alt="HifiPlanet" className="h-14 w-auto sm:h-16" />
        </Link>

        <div className="flex items-center justify-self-end gap-1">
          {AdminIcon}
          {!open && <LanguageSwitcher overHero={transparent} variant="header" />}
          <ThemeToggle overHero={transparent} />
        </div>
      </div>

      {mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] overflow-y-auto text-left backdrop-blur-xl"
            style={{ background: 'linear-gradient(135deg, rgba(241,245,249,0.55) 0%, rgba(227,240,207,0.55) 50%, rgba(248,250,252,0.55) 100%)' }}
          >
            <div className="relative mx-auto flex min-h-full max-w-6xl flex-col items-start justify-center gap-5 py-24 pl-6 pr-8 sm:pl-8">
              <button
                onClick={() => setOpen(false)}
                aria-label={t('nav.closeMenu')}
                className="absolute left-6 top-8 flex items-center gap-2 text-neutral-600 hover:text-brand-600 sm:left-8 sm:top-[65px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wide">{t('nav.close')}</span>
              </button>

              <Link to="/fahrzeuge" onClick={() => setOpen(false)} className={`text-3xl font-extrabold tracking-tight text-neutral-900 hover:text-brand-600 ${flyIn()}`} style={flyInStyle(0)}>
                {t('nav.vehicles')}
              </Link>
              <Link to="/leistungen" onClick={() => setOpen(false)} className={`text-3xl font-extrabold tracking-tight text-neutral-900 hover:text-brand-600 ${flyIn()}`} style={flyInStyle(1)}>
                {t('nav.services')}
              </Link>
              <Link to="/galerie" onClick={() => setOpen(false)} className={`text-3xl font-extrabold tracking-tight text-neutral-900 hover:text-brand-600 ${flyIn()}`} style={flyInStyle(2)}>
                {t('nav.gallery')}
              </Link>
              <Link to="/kontakt" onClick={() => setOpen(false)} className={`text-3xl font-extrabold tracking-tight text-neutral-900 hover:text-brand-600 ${flyIn()}`} style={flyInStyle(3)}>
                {t('nav.contact')}
              </Link>

              <div className={`h-px w-16 bg-brand-500/60 ${flyIn()}`} style={flyInStyle(4)} />

              <div className={flyIn()} style={flyInStyle(5)}>
                <LanguageSwitcher variant="menu" onOpenChange={setLangMenuOpen} />
              </div>

              {phone && (
                <a
                  href={`tel:${digitsOnly(phone)}`}
                  className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-600 hover:text-brand-600 ${flyInDimmable()}`}
                  style={flyInStyle(6)}
                >
                  <DynamicIcon name="phone" className="h-4 w-4" />
                  {phone}
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${digitsOnly(whatsapp).replace(/^0/, '49').replace('+', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-600 hover:text-brand-600 ${flyInDimmable()}`}
                  style={flyInStyle(7)}
                >
                  <DynamicIcon name="message-circle" className="h-4 w-4" />
                  {t('nav.whatsapp')}
                </a>
              )}
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-600 hover:text-brand-600 ${flyIn()}`}
                style={flyInStyle(whatsapp ? 8 : 7)}
              >
                <DynamicIcon name="shopping-bag" className="h-4 w-4" />
                {t('nav.shop')}
              </a>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
