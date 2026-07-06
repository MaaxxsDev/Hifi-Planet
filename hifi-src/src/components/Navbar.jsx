import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import DynamicIcon from './DynamicIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';
import logo from '../assets/logo.png';

const SHOP_URL = 'https://www.audio4cars.de/';

const digitsOnly = (value) => (value || '').replace(/[^\d+]/g, '');

const ITEM_DELAY_MS = 70;
const FLY_DURATION_MS = 500;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { user } = useAuth();
  const { phone, whatsapp } = useSiteSettings();
  const totalItems = whatsapp ? 8 : 7;
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
      aria-label="Zum Admin-Panel"
      title="Zum Admin-Panel"
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
            aria-label="Menü öffnen"
            className={`rounded-md p-2 transition ${
              transparent ? 'text-white hover:bg-white/10' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <Link to="/" className={`flex items-center justify-self-center rounded-lg px-2 py-1 dark:bg-white ${transparent ? 'bg-white' : ''}`}>
          <img src={logo} alt="HifiPlanet" className="h-14 w-auto sm:h-16" />
        </Link>

        <div className="flex items-center justify-self-end gap-1">
          {AdminIcon}
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
                aria-label="Menü schließen"
                className="absolute left-6 top-8 flex items-center gap-2 text-neutral-600 hover:text-brand-600 sm:left-8 sm:top-[65px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wide">Schließen</span>
              </button>

              <Link to="/fahrzeuge" onClick={() => setOpen(false)} className={`text-3xl font-extrabold tracking-tight text-neutral-900 hover:text-brand-600 ${flyIn()}`} style={flyInStyle(0)}>
              Fahrzeuge
            </Link>
            <Link to="/leistungen" onClick={() => setOpen(false)} className={`text-3xl font-extrabold tracking-tight text-neutral-900 hover:text-brand-600 ${flyIn()}`} style={flyInStyle(1)}>
              Leistungen
            </Link>
            <Link to="/galerie" onClick={() => setOpen(false)} className={`text-3xl font-extrabold tracking-tight text-neutral-900 hover:text-brand-600 ${flyIn()}`} style={flyInStyle(2)}>
              Galerie
            </Link>
            <Link to="/kontakt" onClick={() => setOpen(false)} className={`text-3xl font-extrabold tracking-tight text-neutral-900 hover:text-brand-600 ${flyIn()}`} style={flyInStyle(3)}>
              Kontakt
            </Link>

            <div className={`h-px w-16 bg-brand-500/60 ${flyIn()}`} style={flyInStyle(4)} />

            {phone && (
              <a href={`tel:${digitsOnly(phone)}`} className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-600 hover:text-brand-600 ${flyIn()}`} style={flyInStyle(5)}>
                <DynamicIcon name="phone" className="h-4 w-4" />
                {phone}
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${digitsOnly(whatsapp).replace(/^0/, '49').replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-600 hover:text-brand-600 ${flyIn()}`}
                style={flyInStyle(6)}
              >
                <DynamicIcon name="message-circle" className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-600 hover:text-brand-600 ${flyIn()}`}
              style={flyInStyle(whatsapp ? 7 : 6)}
            >
              <DynamicIcon name="shopping-bag" className="h-4 w-4" />
              Zum Shop
              </a>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
