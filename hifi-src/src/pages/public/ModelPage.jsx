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
import textureGraphite from '../../assets/textures/metal-graphite.webp';
import textureDeepBlue from '../../assets/textures/metal-deep-blue.webp';
import textureWarmBronze from '../../assets/textures/metal-warm-bronze.webp';

// Eine generierte, gebuerstete Metall-Oberflaechenstruktur je Theme (statt Fotos pro
// Paket, die es fuer echte Kundenpakete nicht gibt) - wird per "overlay"-Blendmodus mit
// dem bestehenden Farbverlauf kombiniert, sodass die Preis-Staffelung weiterhin die
// Farbe/Helligkeit steuert, die Textur nur die Material-Oberflaeche liefert.
const PACKAGE_TEXTURES = {
  graphite: textureGraphite,
  'deep-blue': textureDeepBlue,
  'warm-bronze': textureWarmBronze,
};

// Material-Stufen statt einfarbigem Verlauf: jede Preisstufe durchlaeuft eine eigene
// "Wertigkeit" wie bei Kreditkarten-/Loyalty-Stufen. Die Karten bleiben durchgehend dunkel
// (wie eine Fahrzeugkonfigurator-Buehne) - die Preis-Staffelung zeigt sich nicht in
// Hell/Dunkel, sondern im Farbton: jedes Theme wandert ueber die 6 Stufen durch eine
// eigene Farbfamilie (z.B. Graphit: kuehles Grau -> Petrol -> Gruen -> Gold), angelehnt
// an das vom Kunden gezeigte Referenzbild. Jede Stufe hat eine Flaechenfarbe (bg) und
// eine dazu passende, hellere Akzentfarbe (Rahmen/Leucht-Schatten/Preis/Icon) - nur der
// "Kontakt anfragen"-Button bleibt ueberall einheitlich markengruen, damit die
// Kernaktion auf jeder Karte wiedererkennbar bleibt. Zwischen zwei Nachbar-Materialien
// wird in RGB linear interpoliert (siehe materialRgbAt), sodass JEDES Paket (nicht nur
// die Materialien selbst) eine eigene Abstufung bekommt. Welches Farbschema verwendet
// wird, waehlt der Kunde selbst unter Admin -> Einstellungen -> Website
// ("Paket-Kachel-Design").
const PACKAGE_THEMES = {
  graphite: [
    { bg: [220, 8, 22], accent: [220, 10, 60] },
    { bg: [195, 18, 20], accent: [195, 35, 58] },
    { bg: [175, 35, 19], accent: [175, 55, 58] },
    { bg: [150, 40, 17], accent: [150, 55, 56] },
    { bg: [120, 38, 15], accent: [120, 55, 55] },
    { bg: [42, 55, 18], accent: [42, 75, 60] },
  ],
  'deep-blue': [
    { bg: [210, 8, 22], accent: [210, 12, 58] },
    { bg: [195, 30, 19], accent: [195, 45, 58] },
    { bg: [210, 45, 17], accent: [210, 60, 58] },
    { bg: [220, 55, 15], accent: [220, 65, 60] },
    { bg: [230, 58, 12], accent: [230, 68, 62] },
    { bg: [240, 62, 10], accent: [240, 72, 65] },
  ],
  'warm-bronze': [
    { bg: [30, 8, 22], accent: [30, 12, 58] },
    { bg: [38, 35, 20], accent: [38, 55, 60] },
    { bg: [30, 50, 18], accent: [30, 65, 60] },
    { bg: [20, 50, 15], accent: [20, 65, 60] },
    { bg: [10, 48, 13], accent: [10, 62, 60] },
    { bg: [0, 45, 11], accent: [0, 58, 62] },
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
  const { package_card_theme: packageCardTheme, package_card_layout: packageCardLayout } = useSiteSettings();
  const MATERIALS = PACKAGE_THEMES[packageCardTheme] || PACKAGE_THEMES.graphite;
  const cardTexture = PACKAGE_TEXTURES[packageCardTheme] || PACKAGE_TEXTURES.graphite;
  const isStripLayout = packageCardLayout !== 'grid';
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
  const rankById = new Map(
    [...packages].sort((a, b) => a.total_price - b.total_price).map((p, i) => [p.id, i])
  );
  const styleOf = (pkg) => {
    const n = packages.length;
    const rank = rankById.get(pkg.id) ?? 0;
    const tierT = n <= 1 ? 0 : rank / (n - 1);

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
    // Der "Lichtweg" im Kartenhintergrund faengt bei der Einstiegsstufe kaum sichtbar an
    // und wird zur teuersten Stufe hin kraeftiger/leuchtender - genau wie der Rahmen-Glow.
    const roadOpacity = 0.14 + tierT * 0.22;
    const roadGlowOpacity = 0.15 + tierT * 0.55;
    // Die Metall-Textur wird als eigene Ebene mit eigener Deckkraft gefahren (statt fest
    // per background-blend-mode verschmolzen) - bei der hellen Einstiegsstufe bleibt sie
    // kaum sichtbar, damit die Karte wirklich hell/weiss bleibt statt durch die dunkle
    // Textur grau anzulaufen; zur teuersten Stufe hin wird sie praesenter.
    const textureOpacity = (0.05 + tierT * 0.32).toFixed(2);

    // Leichter "Lichtschein" von oben rechts statt flacher Flaeche - kommt von oben
    // rechts, weil dort nie Text steht (Titel/Preis/Liste sind linksbuendig), damit die
    // Aufhellung die Lesbarkeit nirgends beeintraechtigt.
    const highlight = hslToRgb(bgHsl[0], Math.max(bgHsl[1] - 8, 0), Math.min(bgL + 16, 99));

    return {
      isDarkCard,
      mutedColor,
      accentColor: `rgb(${accentRgb.join(', ')})`,
      priceColor: `rgb(${priceRgb.join(', ')})`,
      roadOpacity,
      roadGlowOpacity,
      textureStyle: {
        backgroundImage: `url(${cardTexture})`,
        backgroundSize: '480px 480px',
        mixBlendMode: 'overlay',
        opacity: textureOpacity,
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

            <div
              className={
                isStripLayout
                  ? 'flex items-stretch gap-5 overflow-x-auto pb-2 snap-x snap-mandatory'
                  : 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3'
              }
            >
              {packages.map((pkg) => {
                const {
                  style,
                  priceColor,
                  mutedColor,
                  accentColor,
                  glowLineStyle,
                  roadOpacity,
                  roadGlowOpacity,
                  textureStyle,
                  isDarkCard,
                } = styleOf(pkg);

                return (
                  <div
                    key={pkg.id}
                    style={style}
                    className={
                      isStripLayout
                        ? 'relative flex w-[190px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border p-6 sm:w-[210px]'
                        : 'relative flex flex-col overflow-hidden rounded-xl border p-8'
                    }
                  >
                    {/* Abstrakter "Lichtweg" im Hintergrund - je teurer die Stufe, desto praesenter/leuchtender.
                        Fixe Aspect-Ratio + "slice" statt "none", damit Strich/Kurve bei jeder Kartenhoehe
                        gleichmaessig aussieht statt verzerrt gestreckt zu werden. */}
                    <svg
                      viewBox="0 0 200 260"
                      preserveAspectRatio="xMidYMid slice"
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      aria-hidden="true"
                    >
                      <path
                        d="M 20 250 C 60 250 70 190 100 150 C 130 110 160 130 175 90 C 185 65 190 40 195 10"
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="14"
                        strokeLinecap="round"
                        style={{ opacity: roadGlowOpacity, filter: 'blur(7px)' }}
                      />
                      <path
                        d="M 20 250 C 60 250 70 190 100 150 C 130 110 160 130 175 90 C 185 65 190 40 195 10"
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        style={{ opacity: roadOpacity }}
                      />
                    </svg>

                    {/* Metall-Textur als eigene Ebene mit eigener, stufenabhaengiger Deckkraft -
                        so bleibt die helle Einstiegsstufe wirklich hell statt durch die dunkle
                        Textur grau anzulaufen. */}
                    <div className="pointer-events-none absolute inset-0" style={textureStyle} aria-hidden="true" />

                    {pkg.is_featured && (
                      <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow">
                        {t('modelPage.featuredBadge')}
                      </span>
                    )}

                    {/* Eigener Stapelkontext ueber dem Lichtweg-SVG, damit der Text IMMER lesbar
                        oben liegt statt vom absolut positionierten Hintergrund verdeckt zu werden. */}
                    <div className="relative z-10 flex flex-1 flex-col text-center">
                      <h3 className={`text-lg font-bold uppercase tracking-wide ${isDarkCard ? 'text-white' : 'text-neutral-900'}`}>
                        {pkg.name}
                      </h3>
                      <div style={glowLineStyle} className="mx-auto mt-3 h-px w-10" />
                      {pkg.tagline && (
                        <p style={{ color: mutedColor }} className="mx-auto mt-3 max-w-[16ch] text-sm">
                          {pkg.tagline}
                        </p>
                      )}

                      {/* Leerraum, der den Lichtweg im Hintergrund zur Geltung bringt - erst
                          darunter folgen Stichpunkte und Preis, ganz wie im Referenzbild. */}
                      <div className="flex-1" />

                      <ul className="mb-4 space-y-2.5 text-left text-sm">
                        {pkg.products.map((product) => (
                          <li key={product.id} className="flex items-start gap-2.5">
                            <DynamicIcon name="check" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: priceColor }} />
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
                              <DynamicIcon name="check" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: priceColor }} />
                              <span style={{ color: mutedColor }} className="leading-snug">
                                {line}
                              </span>
                            </li>
                          ))}
                      </ul>

                      <div className="mb-4">
                        <p style={{ color: mutedColor }} className="text-xs uppercase tracking-wide">
                          {t('modelPage.totalPrice')}
                        </p>
                        <p style={{ color: priceColor }} className="text-2xl font-extrabold">
                          {formatPrice(pkg.total_price)}
                        </p>
                      </div>

                      <Link
                        to={contactUrl(pkg)}
                        className="inline-block rounded-md bg-brand-500 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400"
                      >
                        {t('modelPage.requestContact')}
                      </Link>
                    </div>
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
