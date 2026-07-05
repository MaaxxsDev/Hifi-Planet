import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import MaintenanceNotice from '../../components/MaintenanceNotice.jsx';
import MaintenanceBypassBanner from '../../components/MaintenanceBypassBanner.jsx';
import { useMaintenance } from '../../context/MaintenanceContext.jsx';

export default function VehicleSelect() {
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState('');
  const maintenance = useMaintenance();

  usePageMeta({
    title: 'Fahrzeug auswählen',
    description: 'Wähle deine Fahrzeugmarke und dein Modell und entdecke passende Car-Hifi Sound-Pakete von HifiPlanet.',
    path: '/fahrzeuge',
  });

  useEffect(() => {
    if (maintenance.vehicles.enabled && !maintenance.bypass) return;
    api.get('/brands').then(setBrands).catch((e) => setError(e.message));
  }, [maintenance.vehicles.enabled, maintenance.bypass]);

  if (maintenance.vehicles.enabled && !maintenance.bypass) {
    return <MaintenanceNotice message={maintenance.vehicles.message} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {maintenance.vehicles.enabled && maintenance.bypass && <MaintenanceBypassBanner inline />}
      <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Fahrzeug auswählen</h1>
      <p className="mb-8 text-slate-600 dark:text-slate-300">
        Wähle zuerst deine Marke, dann dein Modell – wir zeigen dir direkt die passenden Sound-Pakete.
      </p>

      {error && <p className="text-red-600">{error}</p>}

      {brands.length === 0 && !error && (
        <p className="text-slate-500 dark:text-slate-400">Es sind noch keine Marken hinterlegt.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            to={`/fahrzeuge/${brand.slug}`}
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-8 text-center font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            {brand.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
