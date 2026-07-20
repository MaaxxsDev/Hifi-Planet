import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import Reveal from '../../components/Reveal.jsx';
import Accordion from '../../components/Accordion.jsx';
import StarRating from '../../components/StarRating.jsx';
import TestimonialSlider from '../../components/TestimonialSlider.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import defaultHeroImage from '../../assets/photos/gallery-dash2.webp';
import galleryAmp from '../../assets/photos/gallery-amp-purple.webp';
import gallerySpeaker from '../../assets/photos/gallery-speaker.webp';
import gallerySubs from '../../assets/photos/gallery-subs.webp';
import galleryDash from '../../assets/photos/gallery-dash.webp';
import galleryTrunk from '../../assets/photos/hero-trunk.webp';
import galleryRear from '../../assets/photos/gallery-rear.webp';
import heroHighlight from '../../assets/leistungen/hero-highlight.webp';
import youtubeVideo from '../../assets/videos/youtube-hintergrund.mp4';

const YOUTUBE_URL = 'https://www.youtube.com/@hifiplanet2812';
const YOUTUBE_VIDEO_ID = 'ostj2mKDVUc';

const brands = ['Ground Zero Audio', 'Audison', 'Hertz', 'Helix', 'Brax', 'Gladen', 'Alpine', 'Pioneer', 'Kenwood', 'JVC'];

// Native Pixelmasse der Bilder unten - nur fuer die width/height-Attribute auf <img>,
// damit der Browser vor dem Laden Platz reserviert (verhindert Layout-Sprung). Die
// tatsaechliche Anzeigegroesse wird weiterhin komplett per CSS (aspect-square etc.)
// bestimmt, diese Werte muessen also nicht exakt zum gerenderten Seitenverhaeltnis passen.
const galleryImages = [
  { src: gallerySubs, width: 900, height: 600 },
  { src: galleryAmp, width: 900, height: 600 },
  { src: gallerySpeaker, width: 900, height: 1200 },
  { src: galleryDash, width: 900, height: 814 },
  { src: galleryRear, width: 900, height: 1200 },
  { src: galleryTrunk, width: 1920, height: 1280 },
];

export default function Home() {
  const { hero_image_path: heroImagePath } = useSiteSettings();
  const heroImage = heroImagePath || defaultHeroImage;
  const { t, language } = useLanguage();

  const stats = t('home.stats');
  const galleryAlts = t('home.galleryAlts');
  const gallery = galleryImages.map((img, i) => ({ ...img, alt: galleryAlts[i] }));
  const [faqs, setFaqs] = useState([]);
  // Solange noch keine Google-Rezensionen konfiguriert/erfolgreich abgerufen wurden
  // (googleReviews === null), zeigt die Seite die festen Beispiel-Texte aus den
  // Uebersetzungen - danach die echten, im Admin-Bereich zwischengespeicherten Rezensionen.
  const [googleReviews, setGoogleReviews] = useState(null);
  const testimonials = googleReviews
    ? googleReviews.reviews
        // Manche Google-Rezensionen sind reine Sterne-Bewertungen ohne Text - als
        // Zitat-Karte ohne Zitat waeren die nur eine leere Huelle.
        .filter((r) => r.review_text)
        .map((r) => ({ name: r.author_name, text: r.review_text, rating: r.rating }))
    : t('home.testimonials');

  useEffect(() => {
    api
      .get('/faqs')
      .then((rows) => {
        setFaqs(
          rows.map((f) => ({
            question: language === 'de' ? f.question_de : f.question_en,
            answer: language === 'de' ? f.answer_de : f.answer_en,
          }))
        );
      })
      .catch(() => {});
  }, [language]);

  useEffect(() => {
    api
      .get('/google-reviews')
      .then((res) => {
        // Nur uebernehmen, wenn mindestens eine Rezension auch echten Text hat -
        // sonst bliebe die Zitat-Karten-Liste leer (siehe testimonials-Filter oben).
        if (res.rating != null && res.reviews.some((r) => r.review_text)) setGoogleReviews(res);
      })
      .catch(() => {});
  }, []);

  usePageMeta({
    title: t('home.metaTitle'),
    description: t('home.metaDescription'),
    path: '/',
  });

  useEffect(() => {
    if (faqs.length === 0) return;

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
  }, [faqs]);

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
            {t('home.stickyCta')}
          </p>
          <div className="flex w-full gap-3 sm:w-auto">
            <Link
              to="/fahrzeuge"
              className="flex-1 rounded-md bg-brand-500 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-600 sm:flex-none"
            >
              {t('home.selectVehicle')}
            </Link>
            <Link
              to="/kontakt"
              className="flex-1 rounded-md border border-neutral-300 px-5 py-2.5 text-center text-sm font-semibold text-neutral-700 transition hover:-translate-y-0.5 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 sm:flex-none"
            >
              {t('home.getInTouch')}
            </Link>
          </div>
        </div>
      </motion.div>

      <section ref={heroRef} className="relative -mt-[89px] h-dvh min-h-[560px] overflow-hidden sm:-mt-[97px]">
        <motion.img
          style={{ y: heroImageY, scale: 1.15 }}
          src={heroImage}
          alt={t('home.heroImageAlt')}
          className="absolute inset-0 h-full w-full object-cover"
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
              {t('home.welcome')}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              {t('home.heroTitle')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-200 sm:text-lg">
              {t('home.heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/fahrzeuge"
                className="rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg"
              >
                {t('home.selectVehicle')}
              </Link>
              <Link
                to="/kontakt"
                className="rounded-md border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                {t('home.getInTouch')}
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
            {t('home.brandsHeading')}
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

      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden sm:min-h-[85vh]">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={galleryDash}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={youtubeVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/55" />

        <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-200 sm:text-sm">
            {t('home.youtubeBadge')}
          </p>
          <h2 className="text-3xl font-bold uppercase tracking-wide text-white sm:text-5xl">
            {t('home.youtubeTitle')}
          </h2>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-200 sm:text-sm">
            {t('home.youtubeText')}
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-xs font-bold uppercase tracking-wide text-neutral-900 transition hover:-translate-y-0.5 hover:bg-neutral-100"
          >
            {t('home.youtubeCta')}
          </a>
        </Reveal>
      </section>

      <section className="grain-band border-y border-neutral-200 bg-neutral-50 py-16 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl space-y-16 overflow-hidden px-4 sm:px-6">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <Reveal direction="left" shine className="rounded-xl shadow-lg">
              <img
                src={gallerySubs}
                alt={t('home.craftImageAlt')}
                width={900}
                height={600}
                className="w-full rounded-xl object-cover"
                style={{ maxHeight: 380 }}
              />
            </Reveal>
            <Reveal direction="right" index={1}>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{t('home.craftEyebrow')}</p>
              <h2 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white">{t('home.craftTitle')}</h2>
              <p className="text-neutral-600 dark:text-neutral-300">
                {t('home.craftText')}
              </p>
            </Reveal>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-2">
            <Reveal direction="left" className="order-2 md:order-1">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{t('home.adviceEyebrow')}</p>
              <h2 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white">{t('home.adviceTitle')}</h2>
              <p className="text-neutral-600 dark:text-neutral-300">
                {t('home.adviceText')}
              </p>
            </Reveal>
            <Reveal direction="right" index={1} shine className="order-1 md:order-2 rounded-xl shadow-lg">
              <img
                src={galleryAmp}
                alt={t('home.adviceImageAlt')}
                width={900}
                height={600}
                className="w-full rounded-xl object-cover"
                style={{ maxHeight: 380 }}
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('home.insightsTitle')}</h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">
            {t('home.insightsText')}
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((img, i) => (
            <Reveal key={img.src} index={i % 3} shine className="aspect-square overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
              <img
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="grain-band border-y border-neutral-200 bg-neutral-50 py-16 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mb-10 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <StarRating className="h-6 w-6" count={googleReviews ? Math.round(googleReviews.rating) : 5} />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {googleReviews ? t('home.reviewsRatingDynamic')(googleReviews.rating, googleReviews.rating_count) : t('home.reviewsRating')}
            </h2>
            <p className="mt-1 text-neutral-600 dark:text-neutral-300">{t('home.reviewsText')}</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Hifi+Planet+Amorbach+Boxbrunner+Stra%C3%9Fe+20a"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              {t('home.reviewsLink')}
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
            <img
              src={heroHighlight}
              alt={t('home.moreImageAlt')}
              width={1600}
              height={905}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </Reveal>
          <Reveal
            direction="right"
            index={1}
            className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:text-left"
          >
            <h2 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white">{t('home.moreTitle')}</h2>
            <p className="mx-auto mb-8 max-w-2xl text-neutral-600 dark:text-neutral-300 md:mx-0">
              {t('home.moreText')}
            </p>
            <Link
              to="/leistungen"
              className="inline-block rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:-translate-y-0.5 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {t('home.moreCta')}
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-neutral-300 py-16 dark:border-neutral-700">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('home.faqHeading')}</h2>
          </Reveal>
          <Reveal index={1}>
            <Accordion items={faqs} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
