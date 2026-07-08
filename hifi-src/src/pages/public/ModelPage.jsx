import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import MaintenanceNotice from '../../components/MaintenanceNotice.jsx';
import MaintenanceBypassBanner from '../../components/MaintenanceBypassBanner.jsx';
import DynamicIcon from '../../components/DynamicIcon.jsx';
import { useMaintenance } from '../../context/MaintenanceContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';

// Material-Stufen statt einfarbigem Verlauf: jede Preisstufe durchlaeuft eine eigene
// "Wertigkeit" wie bei Kreditkarten-/Loyalty-Stufen. Die Paket-Sektion sitzt bewusst IMMER
// auf einer dunklen Buehne (unabhaengig vom Hell/Dunkel-Modus der Seite, wie ein
// Fahrzeugkonfigurator) - das ist der groesste Hebel fuer den edlen/luxurioesen Eindruck,
// den flache helle Kacheln nicht liefern konnten. Jede Stufe hat eine Flaechenfarbe (bg)
// und eine dazu passende Akzentfarbe (Rahmen/Leucht-Schatten/Preis/Icon) - nur der
// "Kontakt anfragen"-Button bleibt ueberall einheitlich markengruen, damit die Kernaktion
// auf jeder Karte wiedererkennbar bleibt. Zwischen zwei Nachbar-Materialien wird in RGB
// linear interpoliert (siehe materialRgbAt), sodass JEDES Paket (nicht nur die Materialien
// selbst) eine eigene Abstufung bekommt. Welches Farbschema verwendet wird, waehlt der
// Kunde selbst unter Admin -> Einstellungen -> Website ("Paket-Kachel-Design") - alle drei
// laufen bewusst auf dieselbe Onyx+Gold-Kroenung bei der teuersten Stufe zu.
const PACKAGE_THEMES = {
  graphite: [
    { bg: [0, 0, 14], accent: [88, 45, 55] }, // Graphit (Einstieg)
    { bg: [24, 32, 22], accent: [24, 55, 58] }, // Bronze
    { bg: [212, 10, 24], accent: [212, 18, 68] }, // Silber
    { bg: [45, 38, 24], accent: [42, 68, 58] }, // Gold
    { bg: [196, 12, 27], accent: [200, 20, 72] }, // Platin
    { bg: [225, 22, 5], accent: [45, 78, 68] }, // Onyx
  ],
  'deep-blue': [
    { bg: [212, 30, 16], accent: [205, 45, 62] }, // Eisblau (Einstieg)
    { bg: [212, 35, 20], accent: [205, 50, 64] }, // Tiefblau
    { bg: [190, 30, 22], accent: [190, 45, 62] }, // Petrol
    { bg: [160, 30, 20], accent: [150, 45, 58] }, // Seegruen
    { bg: [95, 30, 20], accent: [95, 50, 58] }, // Markengruen
    { bg: [225, 22, 5], accent: [45, 78, 68] }, // Onyx
  ],
  'warm-bronze': [
    { bg: [28, 22, 16], accent: [32, 40, 55] }, // Warmes Graphit (Einstieg)
    { bg: [26, 38, 22], accent: [28, 58, 55] }, // Bronze
    { bg: [32, 42, 24], accent: [34, 62, 56] }, // Kupfer
    { bg: [38, 45, 24], accent: [38, 66, 58] }, // Amber
    { bg: [42, 48, 24], accent: [42, 70, 60] }, // Reiches Gold
    { bg: [225, 22, 5], accent: [45, 78, 68] }, // Onyx
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
  const { package_card_theme: packageCardTheme } = useSiteSettings();
  const MATERIALS = PACKAGE_THEMES[packageCardTheme] || PACKAGE_THEMES.graphite;
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

  // Preis-Rang innerhalb dieses Modells bestimmt die optische Wucht der Kachel: die
  // guenstigste Option bleibt schlichtes Graphit, jede weitere Preisstufe durchlaeuft
  // eine eigene Materialstufe (Bronze/Silber/Gold/Platin) bis zur Onyx-Kroenung ganz
  // oben. Das braucht keine zusaetzliche Admin-Einstellung und passt sich automatisch
  // an jede Paketanzahl an.
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

    const bgRgb = materialRgbAt(MATERIALS, tierT, 'bg').map(Math.round);
    const accentRgbFloat = materialRgbAt(MATERIALS, tierT, 'accent');
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
      mutedColor,
      tierNumber,
      tierLabel,
      accentColor: `rgb(${accentRgb.join(', ')})`,
      priceColor: `rgb(${priceRgb.join(', ')})`,
      iconChipStyle: {
        backgroundColor: `rgba(${accentRgb.join(', ')}, 0.16)`,
        color: `rgb(${priceRgb.join(', ')})`,
        boxShadow: `inset 0 0 0 1px rgba(${accentRgb.join(', ')}, 0.45)`,
      },
      // Duenne, gleichbleibende Haarlinie statt dickerem Rahmen - die zunehmende Wertigkeit
      // zeigt sich in Farbe/Leucht-Schatten, nicht in der Strichstaerke. Wirkt ruhiger/edler.
      glowLineStyle: {
        background: `linear-gradient(90deg, transparent, rgba(${accentRgb.join(', ')}, 0.9), transparent)`,
        boxShadow: `0 0 ${Math.round(6 + tierT * 14)}px rgba(${accentRgb.join(', ')}, ${(0.25 + tierT * 0.45).toFixed(2)})`,
      },
      style: {
        backgroundColor: `rgb(${bgRgb.join(', ')})`,
        backgroundImage: `radial-gradient(135% 160% at 88% -20%, rgb(${highlight.join(', ')}) 0%, rgb(${bgRgb.join(', ')}) 55%)`,
        borderColor: `rgb(${accentRgb.join(', ')})`,
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
    <>
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        {maintenance.vehicles.enabled && maintenance.bypass && <MaintenanceBypassBanner inline />}
        <p className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">
          <Link to="/fahrzeuge" className="hover:text-brand-500">{t('modelPage.breadcrumbVehicles')}</Link> /{' '}
          <Link to={`/fahrzeuge/${brandSlug}`} className="hover:text-brand-500">{model.brand_name}</Link> / {model.name}
        </p>
        <h1 className={`text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl ${packages.length ? 'mb-2' : 'mb-8'}`}>
          {model.brand_name} {model.name} – {t('modelPage.titleSuffix')}
        </h1>

        {packages.length === 0 && (
          <p className="pb-12 text-neutral-500 dark:text-neutral-400">{t('modelPage.empty')}</p>
        )}
      </div>

      {packages.length > 0 && (
        // Die Paket-Sektion bekommt bewusst eine eigene, immer dunkle Buehne (wie ein
        // Fahrzeugkonfigurator) statt der hellen/dunklen Seiten-Textur zu folgen - das
        // ist der Haupthebel fuer den edlen Eindruck, den flache Kacheln nicht liefern.
        <section className="bg-neutral-950 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center sm:mb-14">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('modelPage.tiersHeading')(packages.length)}</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-400">{t('modelPage.tiersSubheading')}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {packages.map((pkg) => {
                const { style, priceColor, mutedColor, iconChipStyle, tierNumber, tierLabel, accentColor, glowLineStyle } =
                  styleOf(pkg);

                return (
                  <div key={pkg.id} style={style} className="relative flex flex-col rounded-xl border p-8">
                    {pkg.is_featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow">
                        {t('modelPage.featuredBadge')}
                      </span>
                    )}

                    <div className="mb-4 flex items-baseline gap-3">
                      <span style={{ color: mutedColor }} className="text-3xl font-extralight leading-none">
                        {tierNumber}
                      </span>
                      <span style={{ color: accentColor }} className="text-xs font-semibold uppercase tracking-[0.2em]">
                        {tierLabel}
                      </span>
                    </div>

                    {pkg.icon_name && (
                      <div style={iconChipStyle} className="mb-4 flex h-11 w-11 items-center justify-center rounded-full">
                        <DynamicIcon name={pkg.icon_name} className="h-6 w-6" />
                      </div>
                    )}

                    <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                    {pkg.tagline && (
                      <p style={{ color: mutedColor }} className="mt-1 text-sm">
                        {pkg.tagline}
                      </p>
                    )}

                    <div style={glowLineStyle} className="my-5 h-px w-full" />

                    <div className="mb-4">
                      <p style={{ color: mutedColor }} className="text-xs uppercase tracking-wide">
                        {t('modelPage.totalPrice')}
                      </p>
                      <p style={{ color: priceColor }} className="text-2xl font-extrabold">
                        {formatPrice(pkg.total_price)}
                      </p>
                    </div>

                    <ul className="mb-6 flex-1 space-y-2.5 text-sm">
                      {pkg.products.map((product) => (
                        <li key={product.id} className="flex items-start gap-2.5">
                          <DynamicIcon name="check" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentColor }} />
                          <span style={{ color: mutedColor }} className="leading-snug">
                            {product.name_override || product.scraped_name || t('modelPage.productLoading')}
                          </span>
                        </li>
                      ))}
                      {pkg.description
                        ?.split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line, i) => (
                          <li key={`desc-${i}`} className="flex items-start gap-2.5">
                            <DynamicIcon name="check" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentColor }} />
                            <span style={{ color: mutedColor }} className="leading-snug">
                              {line}
                            </span>
                          </li>
                        ))}
                    </ul>

                    <Link
                      to={contactUrl(pkg)}
                      className="inline-block rounded-md bg-brand-500 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400"
                    >
                      {t('modelPage.requestContact')}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
