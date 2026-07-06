import { useEffect, useRef } from 'react';
import { useCookieConsent } from '../context/CookieConsentContext.jsx';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';

// Laedt gtag.js erst, nachdem der Besucher der Statistik-Kategorie im Cookie-Banner
// zugestimmt hat (wie Google Maps/YouTube ueber ExternalEmbed) - keine Anfrage an
// Google, keine Cookies, solange keine Einwilligung vorliegt.
export default function GoogleAnalytics() {
  const { consent } = useCookieConsent();
  const { ga_measurement_id: measurementId } = useSiteSettings();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!measurementId || !consent.analytics || loadedRef.current) return;
    loadedRef.current = true;

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId, { anonymize_ip: true });
  }, [measurementId, consent.analytics]);

  return null;
}
