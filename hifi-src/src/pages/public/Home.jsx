import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import usePageMeta from '../../hooks/usePageMeta.js';
import Reveal from '../../components/Reveal.jsx';
import Accordion from '../../components/Accordion.jsx';
import StarRating from '../../components/StarRating.jsx';
import TestimonialSlider from '../../components/TestimonialSlider.jsx';
import ExternalEmbed from '../../components/ExternalEmbed.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';
import defaultHeroImage from '../../assets/photos/hero-trunk.jpg';
import galleryAmp from '../../assets/photos/gallery-amp-purple.jpg';
import gallerySpeaker from '../../assets/photos/gallery-speaker.jpg';
import gallerySubs from '../../assets/photos/gallery-subs.jpg';
import galleryDash from '../../assets/photos/gallery-dash.jpg';
import galleryDash2 from '../../assets/photos/gallery-dash2.jpg';
import galleryRear from '../../assets/photos/gallery-rear.jpg';
import heroHighlight from '../../assets/leistungen/hero-highlight.jpg';

const YOUTUBE_URL = 'https://www.youtube.com/@hifiplanet2812';
const YOUTUBE_VIDEO_ID = 'ostj2mKDVUc';

const stats = [
  { value: 'Seit 2010', label: 'in Amorbach' },
  { value: '20+', label: '3D-Drucker im Haus' },
  { value: 'Eigene', label: 'CNC- & Laserwerkstatt' },
  { value: 'Bundesweit', label: 'anerkannter Car-Hifi-Spezialist' },
];

const brands = ['Focal', 'Helix', 'Ground Zero', 'Mosconi', 'Hifonics', 'Audison'];

const steps = [
  { title: 'Marke & Modell wählen', text: 'Finde dein Fahrzeug in wenigen Klicks.' },
  { title: 'Sound-Paket entdecken', text: 'Passende Pakete inkl. aktueller Preise auf einen Blick.' },
  { title: 'Unverbindlich anfragen', text: 'Wir melden uns zeitnah mit allen Details bei dir.' },
];

const gallery = [
  { src: gallerySubs, alt: 'Individueller Subwoofer-Bau mit Ground Zero Bässen' },
  { src: galleryAmp, alt: 'Endstufen-Einbau mit violetter Ambiente-Beleuchtung' },
  { src: gallerySpeaker, alt: 'Hochtöner- und Mitteltöner-Einbau von Focal Utopia' },
  { src: galleryDash, alt: 'Sony Navigationssystem mit Apple CarPlay im Cockpit' },
  { src: galleryRear, alt: 'Verbauter Hochtöner im Kofferraum' },
  { src: galleryDash2, alt: 'Individuell beleuchtetes Cockpit mit Soundsystem' },
];

const testimonials = [
  { name: 'Thomas K.', text: 'Über YouTube auf dieses Klang-Juwel gestoßen. Beratung und Empfehlungen sind erstklassig – der Tesla-Vorführwagen hat meine Leidenschaft für guten Sound neu entfacht.' },
  { name: 'Andreas I.', text: 'Sehr professionelle Beratung und Service. Obwohl ich von VAG zu Mercedes gewechselt bin, wurde alles reibungslos angepasst. Die 3-Wege-Lautsprecher und zwei Subwoofer liefern außergewöhnliche Leistung.' },
  { name: 'Thomas F.', text: 'Kompletter Audi A4 B9 Umbau hat meine Erwartungen übertroffen. Von Anfang bis Ende professionell, mit tadelloser Verarbeitung und Klangqualität.' },
  { name: 'Drago G.', text: 'Beeindruckt von der CNC-Arbeit, die auf YouTube gezeigt wird. Angefangen mit 3D-gedruckten Lautsprecherringen für meinen Ford Mustang – daraus wurde ein viel größeres Projekt.' },
  { name: 'Leonardo B.', text: 'Toller Service und meisterhafte Handwerkskunst. Saubere Installation, Leidenschaft in jedem Detail erkennbar.' },
  { name: 'Marcel S.', text: 'Unschlagbares Preis-Leistungs-Verhältnis. Das Team hat sich viel Zeit genommen, um genau die Lösung für mein Budget zu finden.' },
  { name: 'Julia W.', text: 'Endlich ein Betrieb, der auch Wohnmobile ernst nimmt. Die Soundanlage in unserem Camper klingt jetzt wie im Wohnzimmer.' },
  { name: 'Kevin R.', text: 'Dashcam und Alarmanlage in einem Termin sauber verbaut, keine sichtbaren Kabel. Absolute Empfehlung für alle, die Wert auf Verarbeitung legen.' },
  { name: 'Sabrina H.', text: 'Mein Oldtimer hat jetzt modernen Sound, ohne dass es dem Original-Look geschadet hätte. Genau das habe ich gesucht.' },
  { name: 'Niklas P.', text: 'Von der ersten Anfrage bis zum fertigen Umbau lief alles reibungslos. Ehrliche Beratung ohne Verkaufsdruck.' },
];

const faqs = [
  { question: 'Was kostet eine Beratung?', answer: 'Beratung und Preisanfrage sind für dich komplett kostenlos und unverbindlich.' },
  { question: 'Muss ich mein Fahrzeug vorbeibringen?', answer: 'Für eine erste Einschätzung reicht oft deine Anfrage über die Website. Für den Einbau selbst vereinbaren wir gemeinsam einen Termin bei uns in Amorbach.' },
  { question: 'Wie lange dauert ein Umbau?', answer: 'Das hängt vom Umfang ab – von einem einfachen Lautsprecher-Tausch in wenigen Stunden bis zum aufwendigen Komplettumbau über mehrere Tage.' },
  { question: 'Bietet ihr auch Lösungen für Leasingfahrzeuge?', answer: 'Ja, auf Wunsch bauen wir reversibel um, sodass dein Fahrzeug bei Rückgabe wieder in den Originalzustand versetzt werden kann.' },
  { question: 'Arbeitet ihr nur mit bestimmten Marken?', answer: 'Nein, wir sind herstellerunabhängig und wählen die Komponenten, die am besten zu deinem Anspruch und Budget passen.' },
  { question: 'Was ist, wenn mein Fahrzeug nicht gelistet ist?', answer: 'Kein Problem – schreib uns einfach über das Kontaktformular, wir finden für jedes Fahrzeug eine passende Lösung.' },
];

export default function Home() {
  const { hero_image_path: heroImagePath } = useSiteSettings();
  const heroImage = heroImagePath || defaultHeroImage;

  usePageMeta({
    title: 'Car-Hifi Umbauten nach Maß',
    description:
      'HifiPlanet – dein Car-Hifi Spezialist in Amorbach. Marke und Modell wählen, passende Sound-Pakete entdecken und unverbindlich anfragen.',
    path: '/',
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroImageY = useTransform(heroProgress, [0, 1], ['-6%', '6%']);
  const heroTextY = useTransform(heroProgress, [0, 1], ['0%', '60%']);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);
  const ctaOpacity = useTransform(heroProgress, [0.5, 1], [0, 1]);
  const ctaPointerEvents = useTransform(ctaOpacity, (v) => (v > 0.05 ? 'auto' : 'none'));
  const ctaY = useTransform(heroProgress, [0.5, 1], [16, 0]);

  return (
    <div>
      <motion.div
        style={{ opacity: ctaOpacity, pointerEvents: ctaPointerEvents, y: ctaY }}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 sm:px-6"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="hidden text-sm font-medium text-neutral-600 dark:text-neutral-300 sm:block">
            Bereit für deinen Sound-Umbau?
          </p>
          <div className="flex w-full gap-3 sm:w-auto">
            <Link
              to="/fahrzeuge"
              className="flex-1 rounded-md bg-brand-500 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-600 sm:flex-none"
            >
              Fahrzeug auswählen
            </Link>
            <Link
              to="/kontakt"
              className="flex-1 rounded-md border border-neutral-300 px-5 py-2.5 text-center text-sm font-semibold text-neutral-700 transition hover:-translate-y-0.5 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 sm:flex-none"
            >
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      </motion.div>

      <section ref={heroRef} className="relative h-[85vh] min-h-[560px] overflow-hidden">
        <motion.img
          style={{ y: heroImageY }}
          src={heroImage}
          alt="Individueller Subwoofer-Einbau mit LED-Beleuchtung im Kofferraum"
          className="absolute inset-0 h-full w-full scale-110 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/40" />

        <motion.div
          style={{ y: heroTextY, opacity: heroOpacity }}
          className="relative flex h-full max-w-6xl flex-col items-center justify-center px-4 mx-auto text-center sm:px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-400">
              Willkommen bei HifiPlanet
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Audiophil aus Prinzip
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-200 sm:text-lg">
              Dein Car-Hifi Spezialist für individuelle Sound-Umbauten. Wähle dein Fahrzeug,
              entdecke passende Pakete und frag unverbindlich an – wir kümmern uns um den Rest.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/fahrzeuge"
                className="rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg"
              >
                Fahrzeug auswählen
              </Link>
              <Link
                to="/kontakt"
                className="rounded-md border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                Kontakt aufnehmen
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="border-b border-neutral-200 bg-neutral-950 py-8 dark:border-neutral-800">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 text-center sm:grid-cols-4 sm:px-6">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} index={i}>
              <p className="text-2xl font-extrabold text-brand-400 sm:text-3xl">{stat.value}</p>
              <p className="text-sm text-neutral-400">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-b border-neutral-200 py-8 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Marken, mit denen wir arbeiten
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {brands.map((brand, i) => (
              <Reveal key={brand} index={i} className="text-lg font-bold text-neutral-400 dark:text-neutral-600">
                {brand}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <h2 className="mb-8 text-center text-2xl font-bold text-neutral-900 dark:text-white">So funktioniert's</h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.title} index={i} className="rounded-xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mb-1 font-semibold text-neutral-900 dark:text-white">{step.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{step.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        className="relative overflow-hidden py-20 sm:py-28"
        style={{ backgroundImage: 'linear-gradient(to bottom, transparent, #0a0a0a 12%, #0a0a0a 88%, transparent)' }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <Reveal direction="left" className="text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
              </svg>
              HifiPlanet auf YouTube
            </div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Sieh dir unsere Umbauten in Aktion an</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-300 lg:mx-0">
              Umbauten, Soundchecks und Verstärker-Tests aus unserer Werkstatt – „Den besten Sound gibt es nicht ab Werk!"
            </p>
            <ul className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-2 text-sm text-neutral-300 sm:flex-row sm:flex-wrap sm:justify-center lg:mx-0 lg:justify-start">
              {['Umbauten Schritt für Schritt', 'Soundchecks & Vergleiche', 'Verstärker- & Komponenten-Tests'].map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 flex-none">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/40 transition hover:-translate-y-0.5 hover:bg-brand-400"
            >
              Zum YouTube-Kanal
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0-4 4m4-4H3" />
              </svg>
            </a>
          </Reveal>

          <Reveal direction="right" index={1} className="overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40">
            <div className="aspect-video w-full">
              <ExternalEmbed name="Das YouTube-Video" className="h-full w-full">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}`}
                  title="HifiPlanet Amorbach – Car-Hifi Umbauten"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </ExternalEmbed>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50 py-16 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl space-y-16 overflow-hidden px-4 sm:px-6">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <Reveal direction="left" shine className="rounded-xl shadow-lg">
              <img src={gallerySubs} alt="Individueller Subwoofer-Bau" className="w-full rounded-xl object-cover" style={{ maxHeight: 380 }} />
            </Reveal>
            <Reveal direction="right" index={1}>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Handwerk</p>
              <h2 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white">Präzisionsarbeit in jedem Detail</h2>
              <p className="text-neutral-600 dark:text-neutral-300">
                Ob eigens gefertigte Subwoofer-Gehäuse, integrierte Beleuchtung oder unsichtbar verlegte Kabelwege –
                dank eigener CNC-, Laser- und 3D-Druck-Fertigung entstehen bei uns Lösungen, die es von der Stange nicht gibt.
              </p>
            </Reveal>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-2">
            <Reveal direction="left" className="order-2 md:order-1">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Beratung</p>
              <h2 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white">Von der ersten Idee bis zum letzten Schliff</h2>
              <p className="text-neutral-600 dark:text-neutral-300">
                Jedes Fahrzeug und jeder Anspruch ist anders. Deshalb beraten wir dich persönlich und unverbindlich –
                vom dezenten Upgrade bis zum kompromisslosen High-End-System.
              </p>
            </Reveal>
            <Reveal direction="right" index={1} shine className="order-1 md:order-2 rounded-xl shadow-lg">
              <img src={galleryAmp} alt="Endstufen-Einbau mit Ambiente-Beleuchtung" className="w-full rounded-xl object-cover" style={{ maxHeight: 380 }} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Einblicke in unsere Umbauten</h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">
            Vom unauffälligen Sound-Upgrade bis zum aufwendigen Komplettumbau – Handarbeit aus unserer Werkstatt in Amorbach.
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((img, i) => (
            <Reveal key={img.src} index={i % 3} shine className="aspect-square overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
              <img src={img.src} alt={img.alt} loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-105" />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50 py-16 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mb-10 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <StarRating className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">5,0 von 181 Kunden bewertet</h2>
            <p className="mt-1 text-neutral-600 dark:text-neutral-300">Das sagen unsere Kunden über uns.</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Hifi+Planet+Amorbach+Boxbrunner+Stra%C3%9Fe+20a"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Alle Bewertungen auf Google ansehen →
            </a>
          </Reveal>
          <Reveal>
            <TestimonialSlider testimonials={testimonials} />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl overflow-hidden px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal direction="left" shine className="overflow-hidden rounded-xl shadow-lg">
            <img src={heroHighlight} alt="Hochwertige Endstufe und Subwoofer, Studioaufnahme" className="h-full w-full object-cover" loading="lazy" />
          </Reveal>
          <Reveal direction="right" index={1} className="text-center md:text-left">
            <h2 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white">Mehr als nur Car-Hifi</h2>
            <p className="mx-auto mb-8 max-w-2xl text-neutral-600 dark:text-neutral-300 md:mx-0">
              Neben individuellen Sound-Umbauten bieten wir CNC-Zerspanung, Lasertechnik, 3D-Druck und mehr –
              alles aus einer Hand in unserer eigenen Werkstatt.
            </p>
            <Link
              to="/leistungen"
              className="inline-block rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:-translate-y-0.5 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Alle Leistungen entdecken
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Häufig gestellte Fragen</h2>
          </Reveal>
          <Reveal index={1}>
            <Accordion items={faqs} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
