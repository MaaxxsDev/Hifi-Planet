import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import usePageMeta from '../../hooks/usePageMeta.js';
import Reveal from '../../components/Reveal.jsx';
import DynamicIcon from '../../components/DynamicIcon.jsx';
import MaintenanceNotice from '../../components/MaintenanceNotice.jsx';
import MaintenanceBypassBanner from '../../components/MaintenanceBypassBanner.jsx';
import { useMaintenance } from '../../context/MaintenanceContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../api/client.js';

export default function Leistungen() {
  const [services, setServices] = useState([]);
  const maintenance = useMaintenance();
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/services').then(setServices).catch(() => setServices([]));
  }, []);

  usePageMeta({
    title: t('leistungen.metaTitle'),
    description: t('leistungen.metaDescription'),
    path: '/leistungen',
  });

  if (maintenance.services.enabled && !maintenance.bypass) {
    return <MaintenanceNotice message={maintenance.services.message} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {maintenance.services.enabled && maintenance.bypass && <MaintenanceBypassBanner inline />}
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">{t('leistungen.title')}</h1>
      <p className="mb-10 max-w-2xl text-neutral-600 dark:text-neutral-300">
        {t('leistungen.intro')}
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => (
          <Reveal
            key={service.id}
            index={i % 3}
            shine
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="relative aspect-[4/3]">
              {service.image_path && (
                <img src={service.image_path} alt={service.title} className="h-full w-full object-cover" loading="lazy" />
              )}
              <div className="absolute -bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg ring-4 ring-white dark:ring-neutral-900">
                <DynamicIcon name={service.icon_name} className="h-6 w-6" />
              </div>
            </div>
            <div className="p-6 pt-8">
              <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">{service.title}</h2>
              <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-300">{service.description}</p>
              {service.cta_label && service.cta_url && (
                <Link to={service.cta_url} className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
                  {service.cta_label} →
                </Link>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
        <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">{t('leistungen.notListedTitle')}</h2>
        <p className="mb-5 text-neutral-600 dark:text-neutral-300">{t('leistungen.notListedText')}</p>
        <Link to="/kontakt" className="inline-block rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600">
          {t('leistungen.contact')}
        </Link>
      </div>
    </div>
  );
}
