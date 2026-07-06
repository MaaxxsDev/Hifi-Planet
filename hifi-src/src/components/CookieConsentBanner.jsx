import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCookieConsent } from '../context/CookieConsentContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

function SettingsModal({ onClose }) {
  const { consent, saveCustom } = useCookieConsent();
  const [external, setExternal] = useState(consent.external);
  const { t } = useLanguage();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold text-neutral-900 dark:text-white">{t('cookieConsent.modalTitle')}</h2>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-300">
          {t('cookieConsent.modalIntro')}{' '}
          <Link to="/datenschutz" className="underline hover:text-brand-500" onClick={onClose}>
            {t('cookieConsent.privacyPolicy')}
          </Link>
          .
        </p>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            <div>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{t('cookieConsent.necessaryTitle')}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('cookieConsent.necessaryDesc')}
              </p>
            </div>
            <input type="checkbox" checked disabled className="mt-1 h-4 w-4 shrink-0" />
          </div>
          <div className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            <div>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{t('cookieConsent.externalTitle')}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('cookieConsent.externalDesc')}
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
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          >
            {t('cookieConsent.cancel')}
          </button>
          <button
            type="button"
            onClick={() => saveCustom({ external })}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {t('cookieConsent.saveSelection')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CookieConsentBanner() {
  const { decided, settingsOpen, acceptAll, rejectNonEssential, openSettings, closeSettings } = useCookieConsent();
  const { t } = useLanguage();

  return (
    <>
      {!decided && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 sm:p-5">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {t('cookieConsent.bannerText')} {t('cookieConsent.moreInfo')}{' '}
              <Link to="/datenschutz" className="underline hover:text-brand-500">
                {t('cookieConsent.privacyPolicy')}
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={openSettings}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
              >
                {t('cookieConsent.settings')}
              </button>
              <button
                type="button"
                onClick={rejectNonEssential}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
              >
                {t('cookieConsent.onlyNecessary')}
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                {t('cookieConsent.acceptAll')}
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && <SettingsModal onClose={closeSettings} />}
    </>
  );
}
