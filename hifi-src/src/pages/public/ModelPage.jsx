import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import MaintenanceNotice from '../../components/MaintenanceNotice.jsx';
import MaintenanceBypassBanner from '../../components/MaintenanceBypassBanner.jsx';
import DynamicIcon from '../../components/DynamicIcon.jsx';
import { useMaintenance } from '../../context/MaintenanceContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';
import roadGlowTexture from '../../assets/textures/road-glow.webp';
// Die 8 fertigen "Straßen"-Glow-Bilder aus dem Kunden-Referenzdesign (Kacheln.html) -
// je Preisstufe ein eigenes Bild (Grau -> Petrol -> Gruen -> Gold). Wurden 1:1 aus der
// Referenzdatei extrahiert und nur PNG->WebP optimiert (Motiv unveraendert).
import roadBase from '../../assets/roads/base.webp';
import roadClear from '../../assets/roads/clear.webp';
import roadDrive from '../../assets/roads/drive.webp';
import roadPrime from '../../assets/roads/prime.webp';
import roadEliteR from '../../assets/roads/elite_r.webp';
import roadApex from '../../assets/roads/apex.webp';
import roadStatement from '../../assets/roads/statement.webp';
import roadLimitless from '../../assets/roads/limitless.webp';

const hslToRgb = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
};
const hslCss = (h, s, l) => `rgb(${hslToRgb(h, s, l).join(', ')})`;
// Baut aus [bgH,bgS,bgL, acH,acS,acL]-Zeilen eine Stufenliste ohne eigenes Straßenbild
// (fuer die beiden nicht im Referenzdesign enthaltenen Themes) - Rahmenfarbe = Flaeche
// etwas heller, wie im Referenzdesign.
const gen = (rows) =>
  rows.map(([bh, bs, bl, ah, as, al]) => ({
    bgTop: hslCss(bh, bs, bl),
    border: hslCss(bh, bs, bl + 8),
    accent: hslCss(ah, as, al),
    img: null,
  }));

// "graphite" = exakt die 8 Referenz-Kacheln (Farben + Straßenbild) aus Kacheln.html:
// Base / Clear / Drive / Prime / Elite R / Apex / The Statement / Limitless. Jede Stufe
// hat eine Flaechenfarbe oben im Verlauf (bgTop), eine Rahmenfarbe (border) und eine
// Akzentfarbe (Name + Trennlinie). Welche Stufe ein Paket bekommt, ergibt sich aus seinem
// Preis-Rang (siehe tierOf). Die beiden anderen Themes sind eigene Farbfamilien im selben
// Aufbau, nutzen aber (mangels eigener Referenzbilder) das neutrale, umfaerbbare Glow-Motiv.
const PACKAGE_THEMES = {
  graphite: [
    { accent: '#b6b6b6', border: '#2a2a2a', bgTop: '#1c1c1c', img: roadBase },
    { accent: '#d3d3d3', border: '#2e2e2e', bgTop: '#212121', img: roadClear },
    { accent: '#8fb8bd', border: '#26383b', bgTop: '#16282b', img: roadDrive },
    { accent: '#6fbf73', border: '#1f3a24', bgTop: '#122916', img: roadPrime },
    { accent: '#63d34f', border: '#204a1c', bgTop: '#123312', img: roadEliteR },
    { accent: '#8bea3c', border: '#2b5518', bgTop: '#173a0f', img: roadApex },
    { accent: '#d9a83c', border: '#4a3a16', bgTop: '#33270d', img: roadStatement },
    { accent: '#f2c14e', border: '#5a4718', bgTop: '#3d2f0c', img: roadLimitless },
  ],
  'deep-blue': gen([
    [215, 18, 11, 210, 15, 60],
    [212, 25, 11, 208, 32, 60],
    [210, 38, 12, 206, 46, 60],
    [212, 46, 12, 205, 56, 61],
    [214, 52, 12, 205, 63, 62],
    [216, 58, 12, 205, 68, 63],
    [220, 62, 12, 212, 73, 65],
    [226, 66, 12, 216, 78, 68],
  ]),
  'warm-bronze': gen([
    [30, 15, 11, 34, 22, 60],
    [34, 32, 11, 34, 46, 60],
    [32, 46, 12, 30, 58, 60],
    [26, 52, 12, 24, 65, 60],
    [20, 55, 12, 18, 68, 60],
    [14, 55, 12, 12, 68, 61],
    [8, 52, 12, 6, 64, 62],
    [2, 50, 12, 358, 60, 63],
  ]),
};

// Referenz-Werte fuer die Preis-Sektion (unabhaengig von der Preisstufe, wie im Design):
const PRICE_COLOR = '#f2f2f2';
const LABEL_COLOR = '#8a8a8a';
const BULLET_COLOR = '#c4c4c4';

// Mehr sichtbare Stichpunkte wuerden das Straßenbild verdraengen - gerade bei den teuren
// Paketen (die laut Kunde die laengsten Listen haben) soll die Kachel ruhig bleiben. Der
// Rest steckt hinter einem "+X weitere Leistungen"-Toggle, dessen Zaehler selbst als
// Wertigkeitssignal wirkt.
const VISIBLE_BULLETS = 5;

function PackageCard({ pkg, tier, tierT, layout, bullets, formatPrice, contactUrl, t }) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = bullets.length - VISIBLE_BULLETS;
  const shownBullets = expanded ? bullets : bullets.slice(0, VISIBLE_BULLETS);

  // Fuer die Themes ohne eigenes Straßenbild: neutrales Glow-Motiv, per Maske
  // in die Akzentfarbe eingefaerbt (zwei Ebenen: weicher Halo + scharfe Kontur).
  const glowMask = tier.img
    ? null
    : {
        backgroundColor: tier.accent,
        WebkitMaskImage: `url(${roadGlowTexture})`,
        maskImage: `url(${roadGlowTexture})`,
        maskMode: 'luminance',
        WebkitMaskSize: 'cover',
        maskSize: 'cover',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      };

  return (
    <div
      style={{
        borderColor: tier.border,
        background: `linear-gradient(180deg, ${tier.bgTop} 0%, #0b0b0b 55%, #080808 100%)`,
      }}
      className={
        layout === 'strip'
          ? 'relative flex min-h-[640px] grow shrink basis-[190px] min-w-[190px] max-w-[240px] snap-start flex-col overflow-hidden rounded-[18px] border shadow-xl shadow-neutral-900/20 dark:shadow-black/40 sm:basis-[210px]'
          : layout === 'coverflow'
            ? // Feste Breite + snap-center: die 3D-Transformation (rotateY/scale/translateZ)
              // setzt der Scroll-Handler in ModelPage direkt per style.transform.
              'relative flex min-h-[640px] w-[230px] shrink-0 snap-center flex-col overflow-hidden rounded-[18px] border shadow-xl shadow-neutral-900/20 will-change-transform dark:shadow-black/40'
            : 'relative flex min-h-[640px] flex-col overflow-hidden rounded-[18px] border shadow-xl shadow-neutral-900/20 dark:shadow-black/40'
      }
    >
      {/* Vollflaechiges Straßen-Glow-Bild der Preisstufe (Referenzdesign). */}
      {tier.img ? (
        <img
          src={tier.img}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ ...glowMask, opacity: 0.2 + tierT * 0.45, filter: 'blur(18px)' }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ ...glowMask, opacity: 0.55 + tierT * 0.45 }}
            aria-hidden="true"
          />
        </>
      )}

      {pkg.is_featured && (
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow">
          {t('modelPage.featuredBadge')}
        </span>
      )}

      {/* Kopf: Name + Trennlinie (exakt Referenz). */}
      <div className="relative z-10 text-center" style={{ padding: '34px 20px 0' }}>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '30px',
            letterSpacing: '3px',
            fontWeight: 600,
            color: tier.accent,
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          {pkg.name}
        </div>
        <div
          style={{
            width: '44px',
            height: '2px',
            margin: '14px auto 0',
            background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${tier.accent} 50%, rgba(255,255,255,0) 100%)`,
          }}
        />
      </div>

      {/* Stichpunkte direkt unter dem Kopf, leicht abgedunkelter Hintergrund fuer
          Lesbarkeit ueber dem Straßenbild - aufgeklappt deckender, da die Liste dann
          weiter ins helle Bildzentrum hineinreicht. */}
      {bullets.length > 0 && (
        <div
          className="relative z-10"
          style={{
            padding: '18px 20px 14px',
            background: expanded
              ? 'linear-gradient(180deg, rgba(8,8,8,0.7) 0%, rgba(8,8,8,0.62) 94%, rgba(8,8,8,0) 100%)'
              : 'linear-gradient(180deg, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0.48) 92%, rgba(8,8,8,0) 100%)',
          }}
        >
          <ul className="space-y-1.5 text-left">
            {shownBullets.map((line, i) => (
              <li key={i} className="flex items-start gap-2" style={{ fontSize: '13px', color: BULLET_COLOR }}>
                <DynamicIcon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: tier.accent }} />
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-2.5 flex items-center gap-1 hover:opacity-80"
              style={{ fontSize: '13px', color: tier.accent }}
            >
              {expanded ? t('modelPage.lessBullets') : t('modelPage.moreBullets')(hiddenCount)}
              <DynamicIcon name={expanded ? 'chevron-up' : 'chevron-down'} className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Freiraum, damit das Straßenbild zur Geltung kommt. */}
      <div className="relative z-10 flex-1" />

      {/* Preis-Sektion mit dunklem Verlauf (Referenz): "ab ca." + Preis + CTA. */}
      <div
        className="relative z-10"
        style={{
          padding: '20px 20px 28px',
          background: 'linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(8,8,8,0.85) 45%, rgba(8,8,8,0.95) 100%)',
        }}
      >
        <div className="text-center">
          {/* Optionaler Admin-Freitext (z. B. "Coming soon") ersetzt "ab ca." + Preis. */}
          {!pkg.price_text && <div style={{ fontSize: '13px', color: LABEL_COLOR }}>{t('modelPage.totalPrice')}</div>}
          <div
            style={{
              marginTop: '4px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '30px',
              fontWeight: 600,
              letterSpacing: '1px',
              color: PRICE_COLOR,
            }}
          >
            {pkg.price_text || formatPrice(pkg.total_price)}
          </div>
          <Link
            to={contactUrl(pkg)}
            className="mt-4 inline-block rounded-md bg-brand-500 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400"
          >
            {t('modelPage.requestContact')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ModelPage() {
  const { brandSlug, modelSlug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const maintenance = useMaintenance();
  const { t, language } = useLanguage();
  const { package_card_theme: packageCardTheme, package_card_layout: packageCardLayout } = useSiteSettings();
  const TIERS = PACKAGE_THEMES[packageCardTheme] || PACKAGE_THEMES.graphite;
  const layout = ['grid', 'strip', 'coverflow'].includes(packageCardLayout) ? packageCardLayout : 'strip';
  const scrollerRef = useRef(null);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const hintPlayedRef = useRef(false);
  const formatPrice = (value) =>
    new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' }).format(value);

  useEffect(() => {
    if (maintenance.vehicles.enabled && !maintenance.bypass) return;
    api
      .get(`/models/${brandSlug}/${modelSlug}/packages`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [brandSlug, modelSlug, maintenance.vehicles.enabled, maintenance.bypass]);

  // 3D-Coverflow: pro Scroll-Frame bekommt jede Karte abhaengig vom Abstand ihrer Mitte
  // zur Containermitte eine Drehung/Skalierung/Tiefe - die mittlere Karte steht frontal,
  // die Nachbarn drehen raeumlich weg. rAF-gedrosselt; der ResizeObserver deckt auch
  // Hoehenaenderungen ab (z. B. wenn eine Karte ihre Stichpunkte aufklappt).
  useEffect(() => {
    const el = scrollerRef.current;
    if (layout !== 'coverflow' || !el) return undefined;
    let rafId = 0;
    const apply = () => {
      rafId = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      for (const card of el.children) {
        const center = card.offsetLeft + card.offsetWidth / 2;
        const d = Math.max(-1, Math.min(1, (center - mid) / (card.offsetWidth * 1.4)));
        const abs = Math.abs(d);
        card.style.transform = `rotateY(${(-d * 35).toFixed(2)}deg) scale(${(1 - abs * 0.13).toFixed(3)}) translateZ(${(-abs * 60).toFixed(1)}px)`;
        card.style.zIndex = String(100 - Math.round(abs * 50));
      }
    };
    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(apply);
    };
    apply();
    el.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', schedule);
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [layout, data]);

  // Kein Karten-Drag per Maus mehr (Kundenfeedback: fuehlte sich in Kombination mit der
  // 3D-Transformation im Coverflow nicht gut an). Auf dem Desktop navigiert man
  // stattdessen ueber die eigene Scroll-Leiste unten; Touch-Geraete behalten ohnehin
  // das native, fluessige Wisch-Scrolling der scroll-snap-Kartenreihe.
  //
  // Stattdessen: einmaliger kurzer Wisch-Hinweis beim ersten Laden auf Touch-Geraeten
  // (Kundenwunsch) - die Reihe faehrt kurz ein Stueck nach rechts und wieder zurueck,
  // damit sofort klar ist, dass sich die Kacheln wischen lassen. Nur einmal pro
  // Seitenaufruf, nur auf echten Touch-Geraeten, nicht bei reduzierter Bewegung.
  useEffect(() => {
    const el = scrollerRef.current;
    if (layout === 'grid' || !el || hintPlayedRef.current) return undefined;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isTouch || reducedMotion) return undefined;
    hintPlayedRef.current = true;
    const peek = Math.min(el.clientWidth * 0.4, 160);
    const t1 = setTimeout(() => el.scrollTo({ left: peek, behavior: 'smooth' }), 500);
    const t2 = setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 1250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [layout, data]);

  // Eigene, zum Design passende Scroll-Leiste unter der Kartenreihe (Strip + Coverflow):
  // die native Browser-Leiste ist ausgeblendet, stattdessen ein schmaler zentrierter
  // Track mit markengruenem, leuchtendem Daumen. Daumen ist ziehbar, Klick auf den
  // Track springt an die Stelle. Bei zu wenig Inhalt (kein Overflow) blendet sie aus.
  useEffect(() => {
    const el = scrollerRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (layout === 'grid' || !el || !track || !thumb) return undefined;
    let rafId = 0;

    const update = () => {
      rafId = 0;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 1) {
        track.style.opacity = '0';
        track.style.pointerEvents = 'none';
        return;
      }
      track.style.opacity = '1';
      track.style.pointerEvents = 'auto';
      const trackW = track.clientWidth;
      const thumbW = Math.max(32, (el.clientWidth / el.scrollWidth) * trackW);
      thumb.style.width = `${thumbW}px`;
      thumb.style.transform = `translateX(${((el.scrollLeft / maxScroll) * (trackW - thumbW)).toFixed(1)}px)`;
    };
    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };
    update();
    el.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(el);

    let dragging = false;
    let grabOffset = 0;
    const scrollToPointer = (clientX) => {
      const rect = track.getBoundingClientRect();
      const thumbW = thumb.clientWidth;
      const x = Math.min(Math.max(clientX - rect.left - grabOffset, 0), rect.width - thumbW);
      el.scrollLeft = (x / (rect.width - thumbW)) * (el.scrollWidth - el.clientWidth);
    };
    const onDown = (e) => {
      dragging = true;
      track.setPointerCapture(e.pointerId);
      el.style.scrollSnapType = 'none';
      const tr = thumb.getBoundingClientRect();
      // Auf dem Daumen: relative Griffposition merken; daneben: Daumen unter den Zeiger springen.
      grabOffset = e.clientX >= tr.left && e.clientX <= tr.right ? e.clientX - tr.left : thumb.clientWidth / 2;
      if (!(e.clientX >= tr.left && e.clientX <= tr.right)) scrollToPointer(e.clientX);
    };
    const onMove = (e) => {
      if (dragging) scrollToPointer(e.clientX);
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      if (track.hasPointerCapture?.(e.pointerId)) track.releasePointerCapture(e.pointerId);
      el.style.scrollSnapType = '';
    };
    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onUp);
    track.addEventListener('pointercancel', onUp);

    return () => {
      el.removeEventListener('scroll', schedule);
      ro.disconnect();
      cancelAnimationFrame(rafId);
      track.removeEventListener('pointerdown', onDown);
      track.removeEventListener('pointermove', onMove);
      track.removeEventListener('pointerup', onUp);
      track.removeEventListener('pointercancel', onUp);
    };
  }, [layout, data]);

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

  // Preis-Rang innerhalb dieses Modells waehlt die Referenz-Stufe: die guenstigste Option
  // bekommt die erste Kachel (Base), die teuerste die letzte (Limitless), der Rest wird
  // gleichmaessig auf die dazwischenliegenden Stufen verteilt. Da jede Stufe ihr eigenes
  // Straßenbild hat (und Bilder sich nicht mischen lassen), wird die naechstgelegene Stufe
  // gewaehlt statt zwischen zwei Stufen zu interpolieren - so passen Bild und Farbe immer
  // exakt zur Referenz, egal ob ein Modell 2, 8 oder 12 Pakete hat.
  const rankById = new Map(
    [...packages].sort((a, b) => a.total_price - b.total_price).map((p, i) => [p.id, i])
  );
  const tierOf = (pkg) => {
    const n = packages.length;
    const rank = rankById.get(pkg.id) ?? 0;
    const tierT = n <= 1 ? 0 : rank / (n - 1);
    const idx = Math.round(tierT * (TIERS.length - 1));
    return { tier: TIERS[idx], tierT };
  };

  // Stichpunkte einer Kachel = die Produkte des Pakets plus die Freitext-Zeilen der
  // Beschreibung (je Zeile ein Punkt). Das ist der einzige Zusatz zum Referenzdesign.
  const bulletsOf = (pkg) => [
    ...pkg.products.map((p) => p.name_override || p.scraped_name || t('modelPage.productLoading')),
    ...(pkg.description || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  ];

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
        // Die Sektion folgt dem hellen/dunklen Seiten-Theme - nur die Kacheln selbst
        // bleiben dunkel (Referenzdesign), wodurch sie auf heller Flaeche als eigenstaendige
        // "Karten" wirken. Der Scrollbalken-Stil unten passt sich per dark: mit an.
        <section className="py-10 sm:py-14" style={{ fontFamily: "'Barlow', sans-serif" }}>
          <div className={layout === 'grid' ? 'mx-auto max-w-6xl px-4 sm:px-6' : 'mx-auto max-w-[1880px] px-4 sm:px-6'}>
            <div
              ref={layout === 'grid' ? undefined : scrollerRef}
              className={
                layout === 'grid'
                  ? 'grid items-start gap-[18px] sm:grid-cols-2 xl:grid-cols-3'
                  : // items-start statt items-stretch: klappt jemand eine Kachel auf, waechst
                    // nur DIESE in die Hoehe - die Nachbarn behalten ihre Referenzhoehe.
                    // Die native Scroll-Leiste ist ausgeblendet - darunter sitzt die eigene
                    // Track/Daumen-Leiste. select-none, damit Drag keinen Text markiert.
                    'flex select-none items-start gap-[18px] overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              }
              style={
                layout === 'coverflow'
                  ? // Perspektive fuer die 3D-Drehung; das seitliche Padding erlaubt es,
                    // auch die erste/letzte Karte in die Mitte zu scrollen (Kartenbreite
                    // 230px -> halbe Breite 115px). pt schafft Luft fuer die Skalierung.
                    { perspective: '1200px', paddingLeft: 'calc(50% - 115px)', paddingRight: 'calc(50% - 115px)', paddingTop: '10px' }
                  : undefined
              }
            >
              {packages.map((pkg) => {
                const { tier, tierT } = tierOf(pkg);
                return (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    tier={tier}
                    tierT={tierT}
                    layout={layout}
                    bullets={bulletsOf(pkg)}
                    formatPrice={formatPrice}
                    contactUrl={contactUrl}
                    t={t}
                  />
                );
              })}
            </div>

            {/* Eigene Scroll-Leiste: zentrierter Track, markengruener leuchtender Daumen.
                Ziehbar + klickbar (Logik im Scrollbar-Effekt); blendet aus, wenn alle
                Karten ohne Scrollen passen. touch-action none fuer sauberes Pointer-Ziehen. */}
            {layout !== 'grid' && (
              <div
                ref={trackRef}
                className="relative mx-auto mt-5 h-2 w-56 max-w-full cursor-pointer rounded-full bg-neutral-900/10 transition-opacity duration-200 dark:bg-white/10"
                style={{ touchAction: 'none' }}
                aria-hidden="true"
              >
                <div
                  ref={thumbRef}
                  className="absolute left-0 top-0 h-full rounded-full bg-brand-500 shadow-[0_0_10px_rgba(107,166,38,0.7)]"
                  style={{ width: '48px' }}
                />
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
