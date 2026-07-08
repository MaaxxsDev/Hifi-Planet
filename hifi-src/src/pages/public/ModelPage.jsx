import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import MaintenanceNotice from '../../components/MaintenanceNotice.jsx';
import MaintenanceBypassBanner from '../../components/MaintenanceBypassBanner.jsx';
import { useMaintenance } from '../../context/MaintenanceContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';
import textureGraphite from '../../assets/textures/metal-graphite.webp';
import textureDeepBlue from '../../assets/textures/metal-deep-blue.webp';
import textureWarmBronze from '../../assets/textures/metal-warm-bronze.webp';
import roadGlowTexture from '../../assets/textures/road-glow.webp';

// Eine generierte, gebuerstete Metall-Oberflaechenstruktur je Theme (statt Fotos pro
// Paket, die es fuer echte Kundenpakete nicht gibt) - wird per "overlay"-Blendmodus mit
// dem bestehenden Farbverlauf kombiniert, sodass die Preis-Staffelung weiterhin die
// Farbe/Helligkeit steuert, die Textur nur die Material-Oberflaeche liefert.
const PACKAGE_TEXTURES = {
  graphite: textureGraphite,
  'deep-blue': textureDeepBlue,
  'warm-bronze': textureWarmBronze,
};

const hslToRgb = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
};
const mixRgb = (c1, c2, t) => [0, 1, 2].map((i) => c1[i] + (c2[i] - c1[i]) * t);
// Fuer die Themes ohne eigene Kunden-Referenzfarben wird der Rahmen aus der Flaechenfarbe
// abgeleitet (etwas heller) statt von Hand 8 weitere Werte zu pflegen - im Referenzdesign
// liegt der Rahmenton durchgaengig ca. 15-25 Helligkeitsstufen ueber der Flaeche.
const deriveBorder = (bg) => bg.map((c) => Math.min(c + 18, 255));
const hslStops = (stops) =>
  stops.map(({ bg, accent }) => {
    const bgRgb = hslToRgb(...bg);
    return { bg: bgRgb, accent: hslToRgb(...accent), border: deriveBorder(bgRgb) };
  });

// Material-Stufen statt einfarbigem Verlauf: jede Preisstufe durchlaeuft eine eigene
// "Wertigkeit" wie bei Kreditkarten-/Loyalty-Stufen. Die Karten bleiben durchgehend dunkel
// (wie eine Fahrzeugkonfigurator-Buehne) - die Preis-Staffelung zeigt sich nicht in
// Hell/Dunkel, sondern im Farbton. "graphite" uebernimmt die exakten 8 Referenzfarben aus
// dem vom Kunden gelieferten Kachel-Design (Base/Clear/Drive/Prime/Elite R/Apex/The
// Statement/Limitless: kuehles Grau -> Petrol -> Gruen -> Gold); die anderen beiden Themes
// sind eigene Farbfamilien im selben Aufbau. Jede Stufe hat eine Flaechenfarbe (bg), eine
// Akzentfarbe (Name/Unterstrich/Lichtweg) und eine Rahmenfarbe (border) - nur der "Kontakt
// anfragen"-Button bleibt ueberall einheitlich markengruen. Zwischen zwei Nachbar-
// Materialien wird in RGB linear interpoliert (siehe materialRgbAt), sodass JEDES Paket
// (nicht nur die Materialien selbst) eine eigene Abstufung bekommt, egal ob ein Modell 2
// oder 12 Pakete hat. Welches Farbschema verwendet wird, waehlt der Kunde selbst unter
// Admin -> Einstellungen -> Website ("Paket-Kachel-Design").
const PACKAGE_THEMES = {
  graphite: [
    { bg: [28, 28, 28], accent: [182, 182, 182], border: [42, 42, 42] },
    { bg: [33, 33, 33], accent: [211, 211, 211], border: [46, 46, 46] },
    { bg: [22, 40, 43], accent: [143, 184, 189], border: [38, 56, 59] },
    { bg: [18, 41, 22], accent: [111, 191, 115], border: [31, 58, 36] },
    { bg: [18, 51, 18], accent: [99, 211, 79], border: [32, 74, 28] },
    { bg: [23, 58, 15], accent: [139, 234, 60], border: [43, 85, 24] },
    { bg: [51, 39, 13], accent: [217, 168, 60], border: [74, 58, 22] },
    { bg: [61, 47, 12], accent: [242, 193, 78], border: [90, 71, 24] },
  ],
  'deep-blue': hslStops([
    { bg: [210, 8, 22], accent: [210, 12, 58] },
    { bg: [195, 30, 19], accent: [195, 45, 58] },
    { bg: [210, 45, 17], accent: [210, 60, 58] },
    { bg: [220, 55, 15], accent: [220, 65, 60] },
    { bg: [230, 58, 12], accent: [230, 68, 62] },
    { bg: [240, 62, 10], accent: [240, 72, 65] },
  ]),
  'warm-bronze': hslStops([
    { bg: [30, 8, 22], accent: [30, 12, 58] },
    { bg: [38, 35, 20], accent: [38, 55, 60] },
    { bg: [30, 50, 18], accent: [30, 65, 60] },
    { bg: [20, 50, 15], accent: [20, 65, 60] },
    { bg: [10, 48, 13], accent: [10, 62, 60] },
    { bg: [0, 45, 11], accent: [0, 58, 62] },
  ]),
};

// Findet die zwei Nachbar-Materialien fuer einen Preis-Rang t (0..1) und mischt linear
// dazwischen - dadurch bekommt jedes Paket eine eigene Abstufung, nicht nur die Materialien
// selbst. Gemischt wird in RGB statt HSL: der Farbton zweier benachbarter Materialien (z.B.
// Bronze 24° -> Silber 212°) liegt oft weit auseinander, eine HSL-Interpolation liefe dann
// mitten durch fremde Farbtoene (Gelb/Gruen) statt sauber zwischen den beiden zu vermitteln.
const materialRgbAt = (materials, t, key) => {
  const n = materials.length;
  const pos = t * (n - 1);
  const idx = Math.min(Math.floor(pos), n - 2);
  const frac = pos - idx;
  return mixRgb(materials[idx][key], materials[idx + 1][key], frac);
};

// Feste Preis-/Label-Farbe unabhaengig von der Preisstufe (wie im Referenzdesign) - nur
// der Name/Unterstrich/Lichtweg wandert farblich mit der Preisstufe, der Preis selbst
// bleibt auf jeder Karte gleich lesbar in neutralem Hell.
const PRICE_COLOR = 'rgb(242, 242, 242)';
const LABEL_COLOR = 'rgb(138, 138, 138)';

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
    const accentRgb = materialRgbAt(MATERIALS, tierT, 'accent').map(Math.round);
    const borderRgb = materialRgbAt(MATERIALS, tierT, 'border').map(Math.round);
    // Der "Lichtweg" im Kartenhintergrund ist ein generiertes, fotografisches Glow-Motiv
    // (weisser Lichtstreif auf Schwarz) statt einer duennen Vektorlinie - per CSS-Maske
    // wird die weisse Kurve zur Alphamaske fuer die jeweilige Akzentfarbe, sodass das
    // Motiv bei JEDER Preisstufe/JEDEM Theme automatisch in der richtigen Farbe leuchtet.
    // Schon die Einstiegsstufe bleibt sichtbar praesent statt fast unsichtbar - die
    // Preis-Staffelung zeigt sich in der Intensitaet, nicht im "Ob ueberhaupt sichtbar".
    const roadOpacity = (0.55 + tierT * 0.45).toFixed(2);
    const roadGlowOpacity = (0.2 + tierT * 0.45).toFixed(2);
    const roadMaskStyle = {
      backgroundColor: `rgb(${accentRgb.join(', ')})`,
      WebkitMaskImage: `url(${roadGlowTexture})`,
      maskImage: `url(${roadGlowTexture})`,
      // WebP-Dateien bringen einen (durchgehend deckenden) Alphakanal mit - ohne explizites
      // "luminance" bevorzugt CSS per Default den Alphakanal statt der Helligkeit, wodurch
      // die Maske komplett deckend (= volle Flaeche statt duenner Kurve) gerendert wuerde.
      maskMode: 'luminance',
      WebkitMaskSize: 'cover',
      maskSize: 'cover',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
    };
    // Die Metall-Textur wird als eigene Ebene mit eigener Deckkraft gefahren (statt fest
    // per background-blend-mode verschmolzen) - bei der hellen Einstiegsstufe bleibt sie
    // kaum sichtbar, damit die Karte wirklich hell/weiss bleibt statt durch die dunkle
    // Textur grau anzulaufen; zur teuersten Stufe hin wird sie praesenter.
    const textureOpacity = (0.05 + tierT * 0.32).toFixed(2);

    return {
      accentColor: `rgb(${accentRgb.join(', ')})`,
      roadOpacity,
      roadGlowOpacity,
      roadMaskStyle,
      textureStyle: {
        backgroundImage: `url(${cardTexture})`,
        backgroundSize: '480px 480px',
        mixBlendMode: 'overlay',
        opacity: textureOpacity,
      },
      // Duenne Haarlinie unter dem Namen statt dickerem Rahmen - wie im Referenzdesign:
      // ein 44px breiter Verlauf, der zu beiden Seiten in Transparenz auslaeuft.
      glowLineStyle: {
        background: `linear-gradient(90deg, transparent, rgb(${accentRgb.join(', ')}), transparent)`,
      },
      style: {
        // Vertikaler Verlauf wie im Referenzdesign: oben die Materialfarbe der Preisstufe,
        // darunter schnell in Richtung Schwarz - so bleibt der untere Kartenbereich (Preis)
        // unabhaengig vom Theme immer gut lesbar dunkel.
        backgroundImage: `linear-gradient(180deg, rgb(${bgRgb.join(', ')}) 0%, #0b0b0b 55%, #080808 100%)`,
        borderColor: `rgb(${borderRgb.join(', ')})`,
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
          </div>

          {/* Eigener, deutlich breiterer Rahmen fuer die Kartenreihe im Scroll-Band-Modus:
              die restliche Seite haelt sich an die normale Lesebreite (max-w-6xl), aber
              die Kacheln sollen auf breiten Bildschirmen wirklich die volle Breite nutzen
              koennen, statt unnoetig frueh in den Scroll-Modus zu wechseln. */}
          <div className={isStripLayout ? 'mx-auto max-w-[1800px] px-4 sm:px-6' : 'mx-auto max-w-6xl px-4 sm:px-6'}>
            <div
              className={
                isStripLayout
                  ? // flex statt fixer Breite: Kacheln teilen sich die volle Zeilenbreite und
                    // wachsen bis max-w, sobald genug Platz da ist - erst wenn selbst die
                    // Mindestbreite nicht mehr fuer alle passt, greift das seitliche Scrollen.
                    // Der Scrollbalken bekommt ein dezentes, zum dunklen Design passendes
                    // Styling statt des vollen System-Scrollbalkens.
                    'flex items-stretch gap-5 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25'
                  : 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3'
              }
            >
              {packages.map((pkg) => {
                const { style, accentColor, glowLineStyle, roadOpacity, roadGlowOpacity, roadMaskStyle, textureStyle } =
                  styleOf(pkg);

                return (
                  <div
                    key={pkg.id}
                    style={{ ...style, fontFamily: "'Barlow', sans-serif" }}
                    className={
                      isStripLayout
                        ? 'relative flex min-h-[640px] grow shrink basis-[190px] min-w-[190px] max-w-[240px] snap-start flex-col overflow-hidden rounded-[18px] border sm:basis-[210px]'
                        : 'relative flex min-h-[640px] flex-col overflow-hidden rounded-[18px] border'
                    }
                  >
                    {/* Abstrakter "Lichtweg" im Hintergrund - ein generiertes Foto-Glow-Motiv
                        (weisser Lichtstreif auf Schwarz), per CSS-Maske in die jeweilige
                        Akzentfarbe eingefaerbt. Zwei Ebenen: eine weich verwischte Halo-Ebene
                        fuer die Tiefe darunter, eine scharfe Ebene fuer die Kontur darueber -
                        je teurer die Stufe, desto praesenter/leuchtender beide. */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ ...roadMaskStyle, opacity: roadGlowOpacity, filter: 'blur(18px)' }}
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ ...roadMaskStyle, opacity: roadOpacity }}
                      aria-hidden="true"
                    />

                    {/* Metall-Textur als eigene Ebene mit eigener, stufenabhaengiger Deckkraft -
                        so bleibt die helle Einstiegsstufe wirklich hell statt durch die dunkle
                        Textur grau anzulaufen. */}
                    <div className="pointer-events-none absolute inset-0" style={textureStyle} aria-hidden="true" />

                    {pkg.is_featured && (
                      <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow">
                        {t('modelPage.featuredBadge')}
                      </span>
                    )}

                    {/* Name + Unterstrich oben, dann Leerraum, der den Lichtweg im Hintergrund
                        zur Geltung bringt - eigener Stapelkontext, damit der Text IMMER lesbar
                        oben liegt statt vom absolut positionierten Hintergrund verdeckt zu werden. */}
                    <div className="relative z-10 px-5 pt-8 text-center">
                      <h3
                        style={{ color: accentColor, fontFamily: "'Barlow Condensed', sans-serif" }}
                        className="text-2xl font-semibold uppercase tracking-[3px] sm:text-[28px]"
                      >
                        {pkg.name}
                      </h3>
                      <div style={glowLineStyle} className="mx-auto mt-3.5 h-0.5 w-11" />
                    </div>

                    <div className="relative z-10 flex-1" />

                    {/* Dunkler Verlauf hinter Label/Preis, damit sie ueber dem Lichtweg-Foto
                        immer lesbar bleiben - wie im Referenzdesign. */}
                    <div
                      className="relative z-10 px-5 pb-7 pt-5 text-center"
                      style={{ background: 'linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(8,8,8,0.85) 45%, rgba(8,8,8,0.95) 100%)' }}
                    >
                      <p style={{ color: LABEL_COLOR }} className="text-[13px]">
                        {t('modelPage.totalPrice')}
                      </p>
                      <p
                        style={{ color: PRICE_COLOR, fontFamily: "'Barlow Condensed', sans-serif" }}
                        className="mt-1 text-[28px] font-semibold tracking-wide sm:text-[30px]"
                      >
                        {formatPrice(pkg.total_price)}
                      </p>
                      <Link
                        to={contactUrl(pkg)}
                        className="mt-4 inline-block rounded-md bg-brand-500 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400"
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
