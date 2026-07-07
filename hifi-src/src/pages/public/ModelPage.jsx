import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import MaintenanceNotice from '../../components/MaintenanceNotice.jsx';
import MaintenanceBypassBanner from '../../components/MaintenanceBypassBanner.jsx';
import DynamicIcon from '../../components/DynamicIcon.jsx';
import { useMaintenance } from '../../context/MaintenanceContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function ModelPage() {
  const { brandSlug, modelSlug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const maintenance = useMaintenance();
  const { t, language } = useLanguage();
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
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative flex flex-col rounded-xl border bg-white p-6 shadow-sm dark:bg-neutral-900 ${
              pkg.is_featured
                ? 'border-brand-500 ring-2 ring-brand-500/50 dark:border-brand-400 dark:ring-brand-400/40'
                : 'border-neutral-200 dark:border-neutral-800'
            }`}
          >
            {pkg.is_featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow">
                {t('modelPage.featuredBadge')}
              </span>
            )}

            {pkg.icon_name && (
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                <DynamicIcon name={pkg.icon_name} className="h-6 w-6" />
              </div>
            )}

            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{pkg.name}</h2>
            {pkg.tagline && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{pkg.tagline}</p>}

            <div className="my-4">
              <p className="text-xs uppercase tracking-wide text-neutral-400">{t('modelPage.totalPrice')}</p>
              <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{formatPrice(pkg.total_price)}</p>
            </div>

            <ul className="mb-5 flex-1 list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
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
                pkg.is_featured ? 'bg-brand-600 hover:bg-brand-700' : 'bg-brand-500 hover:bg-brand-600'
              }`}
            >
              {t('modelPage.requestContact')}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
