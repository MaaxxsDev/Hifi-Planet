import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import MaintenanceNotice from '../../components/MaintenanceNotice.jsx';
import MaintenanceBypassBanner from '../../components/MaintenanceBypassBanner.jsx';
import { useMaintenance } from '../../context/MaintenanceContext.jsx';

export default function BrandPage() {
  const { brandSlug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const maintenance = useMaintenance();

  useEffect(() => {
    if (maintenance.vehicles.enabled && !maintenance.bypass) return;
    api
      .get(`/brands/${brandSlug}/models`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [brandSlug, maintenance.vehicles.enabled, maintenance.bypass]);

  usePageMeta({
    title: data ? `${data.brand.name} Modelle` : 'Modell auswählen',
    description: data
      ? `Wähle dein ${data.brand.name} Modell und entdecke passende Car-Hifi Sound-Pakete von HifiPlanet.`
      : undefined,
    path: `/fahrzeuge/${brandSlug}`,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {maintenance.vehicles.enabled && maintenance.bypass && <MaintenanceBypassBanner inline />}
      <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/fahrzeuge" className="hover:text-brand-500">Fahrzeuge</Link> / {data.brand.name}
      </p>
      <h1 className="mb-8 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        {data.brand.name} – Modell wählen
      </h1>

      {data.models.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">Für diese Marke sind noch keine Modelle hinterlegt.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {data.models.map((model) => (
          <Link
            key={model.id}
            to={`/fahrzeuge/${brandSlug}/${model.slug}`}
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-8 text-center font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            {model.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
