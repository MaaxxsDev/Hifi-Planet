import { useCookieConsent } from '../context/CookieConsentContext.jsx';

export default function ExternalEmbed({ name, description, className = '', children }) {
  const { consent, acceptAll, openSettings } = useCookieConsent();

  if (consent.external) {
    return children;
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center dark:border-neutral-800 dark:bg-neutral-900/40 ${className}`}
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
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
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
        >
          Cookie-Einstellungen
        </button>
      </div>
    </div>
  );
}
