import { Link, useLocation } from 'react-router-dom';
import DynamicIcon from './DynamicIcon.jsx';
import { useCookieConsent } from '../context/CookieConsentContext.jsx';

const SHOP_ADDRESS_ENCODED = encodeURIComponent('Boxbrunner Str. 20a, 63916 Amorbach');
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${SHOP_ADDRESS_ENCODED}`;

const HOURS = [
  { days: 'Montag – Freitag', from: 9 * 60, to: 18 * 60, label: '9:00–18:00 Uhr' },
  { days: 'Samstag', from: 10 * 60, to: 13 * 60, label: '10:00–13:00 Uhr' },
  { days: 'Sonntag', from: null, to: null, label: 'Geschlossen' },
];

function isOpenNow() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay(); // 0 = Sonntag, 1-5 = Mo-Fr, 6 = Sa
  const todayHours = day === 0 ? HOURS[2] : day === 6 ? HOURS[1] : HOURS[0];
  return todayHours.from !== null && minutes >= todayHours.from && minutes < todayHours.to;
}

export default function Footer() {
  const open = isOpenNow();
  const { openSettings } = useCookieConsent();
  // Auf der Startseite blendet sich unten eine fixierte CTA-Leiste ein, die
  // sonst die letzte Footer-Zeile (Impressum-Links) verdeckt - deshalb dort
  // zusätzlichen Platz für sie freihalten.
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <footer
      className={`border-t border-slate-200 bg-slate-50 py-10 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 ${
        isHome ? 'pb-24' : ''
      }`}
    >
      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <DynamicIcon name="map-pin" className="h-4 w-4 text-brand-500" />
            <p className="font-semibold text-slate-900 dark:text-white">HifiPlanet</p>
          </div>
          <p>Boxbrunner Str. 20a</p>
          <p>63916 Amorbach</p>
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-md bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600"
          >
            <DynamicIcon name="navigation" className="h-3.5 w-3.5" />
            Route planen
          </a>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <DynamicIcon name="phone" className="h-4 w-4 text-brand-500" />
            <p className="font-semibold text-slate-900 dark:text-white">Kontakt</p>
          </div>
          <p>
            <a href="tel:+4993732062390" className="hover:text-brand-500">09373 20 62 390</a>
          </p>
          <p>
            <a href="mailto:info@hifi-planet-amorbach.de" className="hover:text-brand-500">info@hifi-planet-amorbach.de</a>
          </p>
          <Link
            to="/kontakt"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200"
          >
            Kontaktformular
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DynamicIcon name="clock" className="h-4 w-4 text-brand-500" />
              <p className="font-semibold text-slate-900 dark:text-white">Öffnungszeiten</p>
            </div>
            <span
              className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                open
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-green-500' : 'bg-slate-400'}`} />
              {open ? 'Geöffnet' : 'Geschlossen'}
            </span>
          </div>
          <dl className="space-y-1.5">
            {HOURS.map((row) => (
              <div key={row.days} className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{row.days}</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-200">{row.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-slate-200 px-4 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-6">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>© {new Date().getFullYear()} HifiPlanet. Alle Angaben ohne Gewähr.</span>
          <span>·</span>
          <Link to="/impressum" className="hover:text-brand-500">Impressum</Link>
          <span>·</span>
          <Link to="/datenschutz" className="hover:text-brand-500">Datenschutz</Link>
          <span>·</span>
          <Link to="/agb" className="hover:text-brand-500">AGB</Link>
          <span>·</span>
          <button type="button" onClick={openSettings} className="hover:text-brand-500">
            Cookie-Einstellungen
          </button>
        </p>
      </div>
    </footer>
  );
}
