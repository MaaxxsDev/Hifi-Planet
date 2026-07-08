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

// Material-Stufen statt einfarbigem Verlauf: jede Preisstufe durchlaeuft eine eigene
// "Wertigkeit" wie bei Kreditkarten-/Loyalty-Stufen - Basis (weiss) -> Bronze -> Silber
// -> Gold -> Platin -> Onyx (fast schwarz, mit Gold-Glanz als Kroenung ganz oben). Jede
// Stufe hat sowohl eine Flaechenfarbe (bg) als auch eine dazu passende Akzentfarbe
// (Rahmen/Leucht-Schatten/Preis/Icon) - nur der "Kontakt anfragen"-Button bleibt ueberall
// einheitlich markengruen, damit die Kernaktion auf jeder Karte wiedererkennbar bleibt.
// Zwischen zwei Nachbar-Materialien wird in HSL linear interpoliert, sodass JEDES Paket
// (nicht nur die Materialien selbst) eine eigene Abstufung bekommt.
const MATERIALS_LIGHT = [
  { bg: [0, 0, 100], accent: [88, 63, 40] }, // Basis
  { bg: [24, 42, 55], accent: [24, 58, 42] }, // Bronze
  { bg: [212, 10, 80], accent: [212, 15, 48] }, // Silber
  { bg: [45, 60, 60], accent: [42, 75, 42] }, // Gold
  { bg: [196, 16, 85], accent: [200, 22, 52] }, // Platin
  { bg: [225, 20, 6], accent: [45, 70, 55] }, // Onyx
];
const MATERIALS_DARK = [
  { bg: [0, 0, 9], accent: [88, 55, 48] },
  { bg: [22, 35, 20], accent: [25, 55, 58] },
  { bg: [212, 10, 20], accent: [212, 18, 68] },
  { bg: [45, 42, 22], accent: [42, 68, 58] },
  { bg: [196, 14, 24], accent: [200, 22, 72] },
  { bg: [225, 22, 4], accent: [45, 75, 68] },
];

const hslToRgb = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
};
const rgbToHsl = (r, g, b) => {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  return [h, s * 100, l * 100];
};
const mixRgb = (c1, c2, t) => [0, 1, 2].map((i) => c1[i] + (c2[i] - c1[i]) * t);
// Findet die zwei Nachbar-Materialien fuer einen Preis-Rang t (0..1) und mischt linear
// dazwischen - dadurch bekommt jedes Paket eine eigene Abstufung, nicht nur die 6
// Materialien selbst, egal ob ein Modell 2 oder 12 Pakete hat. Gemischt wird in RGB statt
// HSL: der Farbton zweier benachbarter Materialien (z.B. Bronze 24° -> Silber 212°) liegt
// oft weit auseinander, eine HSL-Interpolation liefe dann mitten durch fremde Farbtoene
// (Gelb/Gruen) statt sauber zwischen den beiden Materialien zu vermitteln.
const materialRgbAt = (materials, t, key) => {
  const n = materials.length;
  const pos = t * (n - 1);
  const idx = Math.min(Math.floor(pos), n - 2);
  const frac = pos - idx;
  return mixRgb(hslToRgb(...materials[idx][key]), hslToRgb(...materials[idx + 1][key]), frac);
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
  // die guenstigste Option bleibt schlicht/weiss, jede weitere Preisstufe durchlaeuft
  // eine eigene Materialstufe (Bronze/Silber/Gold/Platin) bis zur Onyx-Kroenung ganz
  // oben. Das braucht keine zusaetzliche Admin-Einstellung und passt sich automatisch
  // an jede Paketanzahl an.
  const materials = theme === 'dark' ? MATERIALS_DARK : MATERIALS_LIGHT;
  const tierLabels = t('modelPage.tierLabels');
  const rankById = new Map(
    [...packages].sort((a, b) => a.total_price - b.total_price).map((p, i) => [p.id, i])
  );
  const styleOf = (pkg) => {
    const n = packages.length;
    const rank = rankById.get(pkg.id) ?? 0;
    const tierT = n <= 1 ? 0 : rank / (n - 1);
    const tierNumber = String(rank + 1).padStart(2, '0');
    const tierLabel = tierLabels[Math.min(Math.floor(tierT * tierLabels.length), tierLabels.length - 1)];

    const bgRgb = materialRgbAt(materials, tierT, 'bg').map(Math.round);
    const accentRgbFloat = materialRgbAt(materials, tierT, 'accent');
    const accentRgb = accentRgbFloat.map(Math.round);
    const bgHsl = rgbToHsl(...bgRgb);
    const accentHsl = rgbToHsl(...accentRgbFloat);
    const bgL = bgHsl[2];
    // Ab hier reicht der Hintergrund nicht mehr zum Kontrastieren mit dunklem Text -
    // Bronze/Gold-Mitteltoene brauchen (wie die Buttons) helle statt dunkle Schrift.
    // Diese Entscheidung haengt bewusst an der Flaechenfarbe, nicht am Lichtschein
    // unten, damit der Text unabhaengig vom Material IMMER gut lesbar bleibt.
    const isDarkCard = bgL < 60;
    // Garantiert einen Mindestabstand zur tatsaechlichen Hintergrund-Helligkeit statt
    // sich auf einen festen Hell/Dunkel-Klassenwechsel zu verlassen - sonst kann ein
    // Hintergrund GENAU im Grenzbereich (z.B. ein kuehles Mittelgrau nahe der 60%-Schwelle)
    // eine "eigentlich helle" Textfarbe bekommen, die kaum noch Kontrast zum Hintergrund hat.
    const contrastingL = (delta) => (isDarkCard ? Math.min(bgL + delta, 92) : Math.max(bgL - delta, 10));
    // Preis/Icon brauchen den kraeftigsten Kontrast, da sie die Kernaussage der Karte sind.
    const priceRgb = hslToRgb(accentHsl[0], Math.min(accentHsl[1] + 10, 90), contrastingL(48));
    // Dezente Texte (Label/Slogan/Liste) bleiben neutral-grau, aber ebenfalls mit
    // garantiertem Abstand zur Flaeche - kein fixes Tailwind-Grau mehr, das zufaellig auf
    // gleicher Helligkeit wie der Hintergrund landen und unsichtbar werden koennte.
    const mutedColor = `rgb(${hslToRgb(0, 0, contrastingL(38)).join(', ')})`;
    const glowAlpha = (0.1 + tierT * 0.3).toFixed(2);

    // Leichter "Lichtschein" von oben rechts statt flacher Flaeche - kommt von oben
    // rechts, weil dort nie Text steht (Titel/Preis/Liste sind linksbuendig), damit die
    // Aufhellung die Lesbarkeit nirgends beeintraechtigt.
    const highlight = hslToRgb(bgHsl[0], Math.max(bgHsl[1] - 8, 0), Math.min(bgL + 16, 99));

    return {
      isDarkCard,
      mutedColor,
      tierNumber,
      tierLabel,
      priceColor: `rgb(${priceRgb.join(', ')})`,
      iconChipStyle: {
        backgroundColor: `rgba(${accentRgb.join(', ')}, 0.16)`,
        color: `rgb(${priceRgb.join(', ')})`,
        boxShadow: `inset 0 0 0 1px rgba(${accentRgb.join(', ')}, 0.45)`,
      },
      style: {
        backgroundColor: `rgb(${bgRgb.join(', ')})`,
        backgroundImage: `radial-gradient(135% 160% at 88% -20%, rgb(${highlight.join(', ')}) 0%, rgb(${bgRgb.join(', ')}) 55%)`,
        borderColor: `rgb(${accentRgb.join(', ')})`,
        borderWidth: tierT > 0.08 ? 2 : 1,
        boxShadow:
          tierT > 0.04
            ? `0 ${Math.round(6 + tierT * 14)}px ${Math.round(20 + tierT * 45)}px -10px rgba(${accentRgb.join(', ')}, ${glowAlpha})`
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
          const { isDarkCard, style, priceColor, mutedColor, iconChipStyle, tierNumber, tierLabel } = styleOf(pkg);

          return (
            <div key={pkg.id} style={style} className="relative flex flex-col rounded-xl border p-6">
              {pkg.is_featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow">
                  {t('modelPage.featuredBadge')}
                </span>
              )}

              <p style={{ color: mutedColor }} className="mb-2 text-xs font-semibold uppercase tracking-wider">
                {tierNumber} · {tierLabel}
              </p>

              {pkg.icon_name && (
                <div style={iconChipStyle} className="mb-3 flex h-11 w-11 items-center justify-center rounded-full">
                  <DynamicIcon name={pkg.icon_name} className="h-6 w-6" />
                </div>
              )}

              <h2 className={`text-lg font-bold ${isDarkCard ? 'text-white' : 'text-neutral-900'}`}>
                {pkg.name}
              </h2>
              {pkg.tagline && (
                <p style={{ color: mutedColor }} className="mt-1 text-sm">
                  {pkg.tagline}
                </p>
              )}

              <div className="my-4">
                <p style={{ color: mutedColor }} className="text-xs uppercase tracking-wide">
                  {t('modelPage.totalPrice')}
                </p>
                <p style={{ color: priceColor }} className="text-2xl font-extrabold">
                  {formatPrice(pkg.total_price)}
                </p>
              </div>

              <ul style={{ color: mutedColor }} className="mb-5 flex-1 list-disc space-y-1 pl-5 text-sm">
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
