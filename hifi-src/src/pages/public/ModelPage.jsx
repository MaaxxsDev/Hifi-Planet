import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import MaintenanceNotice from '../../components/MaintenanceNotice.jsx';
import MaintenanceBypassBanner from '../../components/MaintenanceBypassBanner.jsx';
import DynamicIcon from '../../components/DynamicIcon.jsx';
import { useMaintenance } from '../../context/MaintenanceContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

// Farbverlauf fuer die Paket-Kacheln: von schlicht/hell (guenstigste Option) bis
// dunkel/schwarz (teuerste Option). Die FLAECHE bleibt dabei fast neutral grau/schwarz
// (nur ein Hauch Gruenstich) - ein voll gesaettigter Gruenverlauf in der Mitte sah nicht
// premium aus, sondern kollidierte mit dem gruenen Preistext/Rahmen. Gruen bleibt der
// alleinige Akzent (Rahmen + Leucht-Schatten). Interpoliert wird in HSL statt RGB (drei
// Stuetzpunkte bei t=0/0.5/1, dazwischen linear) - dadurch bekommt JEDES Paket eine
// eigene Abstufung statt nur 2-3 fester Stile, egal ob ein Modell 2 oder 12 Pakete hat.
const LIGHT_STOPS = {
  bg: [
    [0, 0, 100],
    [90, 6, 85],
    [95, 10, 7],
  ],
  border: [
    [0, 0, 88],
    [85, 55, 62],
    [88, 63, 42],
  ],
};
const DARK_STOPS = {
  bg: [
    [0, 0, 9],
    [95, 8, 18],
    [100, 12, 4],
  ],
  border: [
    [0, 0, 16],
    [95, 42, 34],
    [92, 62, 56],
  ],
};

const hslToRgb = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
};
const mixHsl = (c1, c2, t) => [0, 1, 2].map((i) => c1[i] + (c2[i] - c1[i]) * t);
// Liefert sowohl die interpolierte HSL-Lightness (fuer die Textfarben-Entscheidung -
// verlaesslicher als ein RGB-Luminanz-Naeherungswert, da satte Mitteltoene sonst
// faelschlich als "hell genug fuer dunklen Text" gelten wuerden) als auch die RGB-Werte.
const stopColor = (stops, t) => {
  const hsl = t <= 0.5 ? mixHsl(stops[0], stops[1], t / 0.5) : mixHsl(stops[1], stops[2], (t - 0.5) / 0.5);
  return { rgb: hslToRgb(...hsl), lightness: hsl[2], hsl };
};

export default function ModelPage() {
  const { brandSlug, modelSlug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const maintenance = useMaintenance();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const formatPrice = (value) =>
    new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' }).format(value);

  useEffect(() => {
    if (maintenance.vehicles.enabled && !maintenance.bypass) return;
    api
      .get(`/models/${brandSlug}/${modelSlug}/packages`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [brandSlug, modelSlug, maintenance.vehicles.enabled, maintenance.bypass]);

  usePageMeta({
    title: data ? t('modelPage.metaTitle')(data.model.brand_name, data.model.name) : t('modelPage.metaTitleFallback'),
    description: data ? t('modelPage.metaDescription')(data.model.brand_name, data.model.name) : undefined,
    path: `/fahrzeuge/${brandSlug}/${modelSlug}`,
  });

  if (maintenance.vehicles.enabled && !maintenance.bypass) {
    return <MaintenanceNotice message={maintenance.vehicles.message} />;
  }

  if (error) {
    return <p className="mx-auto max-w-6xl px-4 py-12 text-red-600 sm:px-6">{error}</p>;
  }

  if (!data) {
    return <p className="mx-auto max-w-6xl px-4 py-12 text-neutral-500 sm:px-6">{t('modelPage.loading')}</p>;
  }

  const { model, packages } = data;

  // Preis-Rang innerhalb dieses Modells bestimmt die optische Wucht der Kachel:
  // die guenstigste Option bleibt schlicht/hell, jede weitere Preisstufe wird
  // kontinuierlich dunkler/leuchtender bis zur teuersten Option. Das braucht keine
  // zusaetzliche Admin-Einstellung und passt sich automatisch an jede Paketanzahl an.
  const stops = theme === 'dark' ? DARK_STOPS : LIGHT_STOPS;
  const rankById = new Map(
    [...packages].sort((a, b) => a.total_price - b.total_price).map((p, i) => [p.id, i])
  );
  const styleOf = (pkg) => {
    const n = packages.length;
    const rank = rankById.get(pkg.id) ?? 0;
    const tierT = n <= 1 ? 0 : rank / (n - 1);

    const bg = stopColor(stops.bg, tierT);
    const border = stopColor(stops.border, tierT);
    // Ab hier reicht der Hintergrund nicht mehr zum Kontrastieren mit dunklem Text -
    // satte gruene Mitteltoene brauchen (wie die Buttons) helle statt dunkle Schrift.
    // Diese Entscheidung haengt bewusst an der Basis-Farbe, nicht am Lichtschein unten,
    // damit der Text unabhaengig vom Verlauf IMMER gut lesbar bleibt.
    const isDarkCard = bg.lightness < 60;
    const glowAlpha = (0.05 + tierT * 0.35).toFixed(2);

    // Leichter "Lichtschein" von oben rechts statt flacher Flaeche - kommt von oben
    // rechts, weil dort nie Text steht (Titel/Preis/Liste sind linksbuendig), damit die
    // Aufhellung die Lesbarkeit nirgends beeintraechtigt.
    const [bh, bs, bl] = bg.hsl;
    const highlight = hslToRgb(bh, Math.max(bs - 8, 0), Math.min(bl + 16, 99));

    return {
      isDarkCard,
      style: {
        backgroundColor: `rgb(${bg.rgb.join(', ')})`,
        backgroundImage: `radial-gradient(135% 160% at 88% -20%, rgb(${highlight.join(', ')}) 0%, rgb(${bg.rgb.join(', ')}) 55%)`,
        borderColor: `rgb(${border.rgb.join(', ')})`,
        borderWidth: tierT > 0.12 ? 2 : 1,
        boxShadow:
          tierT > 0.08
            ? `0 ${Math.round(6 + tierT * 14)}px ${Math.round(20 + tierT * 45)}px -10px rgba(107, 166, 38, ${glowAlpha})`
            : undefined,
      },
    };
  };

  const contactUrl = (pkg) => {
    const params = new URLSearchParams({
      brand: model.brand_name,
      model: model.name,
      package: pkg.name,
      packageId: pkg.id,
      total: pkg.total_price,
    });
    return `/kontakt?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {maintenance.vehicles.enabled && maintenance.bypass && <MaintenanceBypassBanner inline />}
      <p className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">
        <Link to="/fahrzeuge" className="hover:text-brand-500">{t('modelPage.breadcrumbVehicles')}</Link> /{' '}
        <Link to={`/fahrzeuge/${brandSlug}`} className="hover:text-brand-500">{model.brand_name}</Link> / {model.name}
      </p>
      <h1 className="mb-8 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
        {model.brand_name} {model.name} – {t('modelPage.titleSuffix')}
      </h1>

      {packages.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">{t('modelPage.empty')}</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {packages.map((pkg) => {
          const { isDarkCard, style } = styleOf(pkg);

          return (
            <div key={pkg.id} style={style} className="relative flex flex-col rounded-xl border p-6">
              {pkg.is_featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow">
                  {t('modelPage.featuredBadge')}
                </span>
              )}

              {pkg.icon_name && (
                <div
                  className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${
                    isDarkCard
                      ? 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/40'
                      : 'bg-brand-100 text-brand-600'
                  }`}
                >
                  <DynamicIcon name={pkg.icon_name} className="h-6 w-6" />
                </div>
              )}

              <h2 className={`text-lg font-bold ${isDarkCard ? 'text-white' : 'text-neutral-900'}`}>
                {pkg.name}
              </h2>
              {pkg.tagline && (
                <p className={`mt-1 text-sm ${isDarkCard ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  {pkg.tagline}
                </p>
              )}

              <div className="my-4">
                <p className={`text-xs uppercase tracking-wide ${isDarkCard ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  {t('modelPage.totalPrice')}
                </p>
                <p className={`text-2xl font-extrabold ${isDarkCard ? 'text-brand-400' : 'text-brand-600'}`}>
                  {formatPrice(pkg.total_price)}
                </p>
              </div>

              <ul
                className={`mb-5 flex-1 list-disc space-y-1 pl-5 text-sm ${
                  isDarkCard ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                {pkg.products.map((product) => (
                  <li key={product.id}>
                    {product.name_override || product.scraped_name || t('modelPage.productLoading')}
                  </li>
                ))}
                {pkg.description
                  ?.split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line, i) => <li key={`desc-${i}`}>{line}</li>)}
              </ul>

              <Link
                to={contactUrl(pkg)}
                className={`inline-block rounded-md px-4 py-2 text-center text-sm font-semibold text-white ${
                  isDarkCard ? 'bg-brand-500 shadow-lg shadow-brand-500/30 hover:bg-brand-400' : 'bg-brand-500 hover:bg-brand-600'
                }`}
              >
                {t('modelPage.requestContact')}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
