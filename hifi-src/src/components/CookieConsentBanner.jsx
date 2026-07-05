import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCookieConsent } from '../context/CookieConsentContext.jsx';

function SettingsModal({ onClose }) {
  const { consent, saveCustom } = useCookieConsent();
  const [external, setExternal] = useState(consent.external);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">Cookie-Einstellungen</h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Lege fest, welche Kategorien du zulassen möchtest. Mehr dazu in unserer{' '}
          <Link to="/datenschutz" className="underline hover:text-brand-500" onClick={onClose}>
            Datenschutzerklärung
          </Link>
          .
        </p>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notwendig</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Für den Betrieb der Website erforderlich (z. B. Login-Session, Theme- und Cookie-Einstellung).
                Kann nicht deaktiviert werden.
              </p>
            </div>
            <input type="checkbox" checked disabled className="mt-1 h-4 w-4 shrink-0" />
          </div>
          <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Externe Medien</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Google Maps und YouTube-Videos. Beim Laden werden Daten (u. a. deine IP-Adresse) an Google
                übertragen.
              </p>
            </div>
            <input
              type="checkbox"
              checked={external}
              onChange={(e) => setExternal(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => saveCustom({ external })}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Auswahl speichern
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CookieConsentBanner() {
  const { decided, settingsOpen, acceptAll, rejectNonEssential, openSettings, closeSettings } = useCookieConsent();

  return (
    <>
      {!decided && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:p-5">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Wir verwenden nur technisch notwendige Cookies. Für Google Maps und YouTube-Videos benötigen wir
              zusätzlich deine Zustimmung, da dabei Daten an Google übertragen werden. Mehr dazu in unserer{' '}
              <Link to="/datenschutz" className="underline hover:text-brand-500">
                Datenschutzerklärung
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={openSettings}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
              >
                Einstellungen
              </button>
              <button
                type="button"
                onClick={rejectNonEssential}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
              >
                Nur notwendige
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Alle akzeptieren
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && <SettingsModal onClose={closeSettings} />}
    </>
  );
}
