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
import { useLanguage } from '../../context/LanguageContext.jsx';
import defaultHeroImage from '../../assets/photos/gallery-dash2.jpg';
import galleryAmp from '../../assets/photos/gallery-amp-purple.jpg';
import gallerySpeaker from '../../assets/photos/gallery-speaker.jpg';
import gallerySubs from '../../assets/photos/gallery-subs.jpg';
import galleryDash from '../../assets/photos/gallery-dash.jpg';
import galleryTrunk from '../../assets/photos/hero-trunk.jpg';
import galleryRear from '../../assets/photos/gallery-rear.jpg';
import heroHighlight from '../../assets/leistungen/hero-highlight.jpg';

const YOUTUBE_URL = 'https://www.youtube.com/@hifiplanet2812';
const YOUTUBE_VIDEO_ID = 'ostj2mKDVUc';

const brands = ['Focal', 'Helix', 'Ground Zero', 'Mosconi', 'Hifonics', 'Audison'];

const galleryImages = [gallerySubs, galleryAmp, gallerySpeaker, galleryDash, galleryRear, galleryTrunk];

export default function Home() {
  const { hero_image_path: heroImagePath } = useSiteSettings();
  const heroImage = heroImagePath || defaultHeroImage;
  const { t, language } = useLanguage();

  const stats = t('home.stats');
  const steps = t('home.steps');
  const galleryAlts = t('home.galleryAlts');
  const gallery = galleryImages.map((src, i) => ({ src, alt: galleryAlts[i] }));
  const testimonials = t('home.testimonials');
  const faqs = t('home.faqs');

  usePageMeta({
    title: t('home.metaTitle'),
    description: t('home.metaDescription'),
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
  }, [language]);

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

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <h2 className="mb-8 text-center text-2xl font-bold text-neutral-900 dark:text-white">{t('home.howItWorks')}</h2>
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
        style={{ backgroundImage: 'linear-gradient(to bottom, transparent, #0a0a0a 3%, #0a0a0a 97%, transparent)' }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <Reveal direction="left" className="text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
              </svg>
              {t('home.youtubeBadge')}
            </div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{t('home.youtubeTitle')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-300 lg:mx-0">
              {t('home.youtubeText')}
            </p>
            <ul className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-2 text-sm text-neutral-300 sm:flex-row sm:flex-wrap sm:justify-center lg:mx-0 lg:justify-start">
              {t('home.youtubeChecklist').map((item) => (
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
              {t('home.youtubeCta')}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0-4 4m4-4H3" />
              </svg>
            </a>
          </Reveal>

          <Reveal direction="right" index={1} className="overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40">
            <div className="aspect-video w-full">
              <ExternalEmbed name={t('home.youtubeEmbedName')} className="h-full w-full">
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
              <img src={gallerySubs} alt={t('home.craftImageAlt')} className="w-full rounded-xl object-cover" style={{ maxHeight: 380 }} />
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
              <img src={galleryAmp} alt={t('home.adviceImageAlt')} className="w-full rounded-xl object-cover" style={{ maxHeight: 380 }} />
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
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('home.reviewsRating')}</h2>
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
            <img src={heroHighlight} alt={t('home.moreImageAlt')} className="h-full w-full object-cover" loading="lazy" />
          </Reveal>
          <Reveal direction="right" index={1} className="text-center md:text-left">
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

      <section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
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
