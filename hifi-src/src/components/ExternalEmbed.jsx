import { useCookieConsent } from '../context/CookieConsentContext.jsx';

export default function ExternalEmbed({ name, description, className = '', children }) {
  const { consent, acceptAll, openSettings } = useCookieConsent();

  if (consent.external) {
    return children;
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/40 ${className}`}
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {description || `${name} wird erst nach deiner Zustimmung geladen, da dabei Daten an Google übertragen werden.`}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={acceptAll}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Laden erlauben
        </button>
        <button
          type="button"
          onClick={openSettings}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
        >
          Cookie-Einstellungen
        </button>
      </div>
    </div>
  );
}
