import { Link, useLocation } from 'react-router-dom';
import DynamicIcon from './DynamicIcon.jsx';
import { useCookieConsent } from '../context/CookieConsentContext.jsx';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const digitsOnly = (value) => (value || '').replace(/[^\d+]/g, '');

const SHOP_ADDRESS_ENCODED = encodeURIComponent('Boxbrunner Str. 20a, 63916 Amorbach');
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${SHOP_ADDRESS_ENCODED}`;

function isOpenNow() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay(); // 0 = Sonntag, 1-5 = Mo-Fr, 6 = Sa
  if (day === 0) return false;
  if (day === 6) return minutes >= 10 * 60 && minutes < 13 * 60;
  return minutes >= 9 * 60 && minutes < 18 * 60;
}

export default function Footer() {
  const open = isOpenNow();
  const { openSettings } = useCookieConsent();
  // Auf der Startseite blendet sich unten eine fixierte CTA-Leiste ein, die
  // sonst die letzte Footer-Zeile (Impressum-Links) verdeckt - deshalb dort
  // zusätzlichen Platz für sie freihalten.
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const { phone, contact_email: contactEmail } = useSiteSettings();
  const { t } = useLanguage();

  const HOURS = [
    { key: 'monFri', days: t('footer.days.monFri'), label: t('contactPage.hoursWeek') },
    { key: 'sat', days: t('footer.days.sat'), label: t('contactPage.hoursSat') },
    { key: 'sun', days: t('footer.days.sun'), label: t('footer.closed') },
  ];

  return (
    <footer
      className={`border-t border-neutral-200 bg-neutral-50 py-10 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 ${
        isHome ? 'pb-24' : ''
      }`}
    >
      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center gap-2">
            <DynamicIcon name="map-pin" className="h-4 w-4 text-brand-500" />
            <p className="font-semibold text-neutral-900 dark:text-white">HifiPlanet</p>
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
            {t('footer.routePlan')}
          </a>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center gap-2">
            <DynamicIcon name="phone" className="h-4 w-4 text-brand-500" />
            <p className="font-semibold text-neutral-900 dark:text-white">{t('footer.contactHeading')}</p>
          </div>
          <p>
            <a href={`tel:${digitsOnly(phone)}`} className="hover:text-brand-500">{phone}</a>
          </p>
          <p>
            <a href={`mailto:${contactEmail}`} className="hover:text-brand-500">{contactEmail}</a>
          </p>
          <Link
            to="/kontakt"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-brand-500 hover:text-brand-600 dark:border-neutral-700 dark:text-neutral-200"
          >
            {t('footer.contactForm')}
          </Link>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DynamicIcon name="clock" className="h-4 w-4 text-brand-500" />
              <p className="font-semibold text-neutral-900 dark:text-white">{t('footer.hoursHeading')}</p>
            </div>
            <span
              className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                open
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-green-500' : 'bg-neutral-400'}`} />
              {open ? t('footer.open') : t('footer.closed')}
            </span>
          </div>
          <dl className="space-y-1.5">
            {HOURS.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500 dark:text-neutral-400">{row.days}</dt>
                <dd className="font-medium text-neutral-700 dark:text-neutral-200">{row.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-neutral-200 px-4 pt-6 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 sm:px-6">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>{t('footer.copyright')(new Date().getFullYear())}</span>
          <span>·</span>
          <Link to="/impressum" className="hover:text-brand-500">{t('footer.imprint')}</Link>
          <span>·</span>
          <Link to="/datenschutz" className="hover:text-brand-500">{t('footer.privacy')}</Link>
          <span>·</span>
          <Link to="/agb" className="hover:text-brand-500">{t('footer.terms')}</Link>
          <span>·</span>
          <button type="button" onClick={openSettings} className="hover:text-brand-500">
            {t('footer.cookieSettings')}
          </button>
        </p>
      </div>
    </footer>
  );
}
