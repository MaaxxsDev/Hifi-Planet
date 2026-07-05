import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import MaintenanceNotice from '../../components/MaintenanceNotice.jsx';
import MaintenanceBypassBanner from '../../components/MaintenanceBypassBanner.jsx';
import { useMaintenance } from '../../context/MaintenanceContext.jsx';

const formatPrice = (value) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

export default function ModelPage() {
  const { brandSlug, modelSlug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const maintenance = useMaintenance();

  useEffect(() => {
    if (maintenance.vehicles.enabled && !maintenance.bypass) return;
    api
      .get(`/models/${brandSlug}/${modelSlug}/packages`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [brandSlug, modelSlug, maintenance.vehicles.enabled, maintenance.bypass]);

  usePageMeta({
    title: data ? `${data.model.brand_name} ${data.model.name} Sound-Pakete` : 'Sound-Pakete',
    description: data
      ? `Car-Hifi Sound-Pakete für ${data.model.brand_name} ${data.model.name} inkl. aktueller Preise – von HifiPlanet unverbindlich anfragen.`
      : undefined,
    path: `/fahrzeuge/${brandSlug}/${modelSlug}`,
  });

  if (maintenance.vehicles.enabled && !maintenance.bypass) {
    return <MaintenanceNotice message={maintenance.vehicles.message} />;
  }

  if (error) {
    return <p className="mx-auto max-w-6xl px-4 py-12 text-red-600 sm:px-6">{error}</p>;
  }

  if (!data) {
    return <p className="mx-auto max-w-6xl px-4 py-12 text-slate-500 sm:px-6">Lädt…</p>;
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
      <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/fahrzeuge" className="hover:text-brand-500">Fahrzeuge</Link> /{' '}
        <Link to={`/fahrzeuge/${brandSlug}`} className="hover:text-brand-500">{model.brand_name}</Link> / {model.name}
      </p>
      <h1 className="mb-8 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        {model.brand_name} {model.name} – Sound-Pakete
      </h1>

      {packages.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">Für dieses Modell sind noch keine Pakete hinterlegt.</p>
      )}

      <div className="space-y-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{pkg.name}</h2>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">Gesamtpreis (ca.)</p>
                <p className="text-xl font-extrabold text-brand-600 dark:text-brand-400">{formatPrice(pkg.total_price)}</p>
              </div>
            </div>

            <ul className="mb-5 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {pkg.products.map((product) => (
                <li key={product.id}>
                  {product.name_override || product.scraped_name || 'Produkt wird geladen…'}
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
              className="inline-block rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Kontakt anfragen
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
