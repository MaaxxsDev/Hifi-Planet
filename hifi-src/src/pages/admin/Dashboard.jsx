import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

const ICONS = {
  tag: 'M4 4h7l9 9-7 7-9-9V4Zm3.5 3.5h.01',
  car: 'M3 13.5 4.5 9A2 2 0 0 1 6.4 7.5h11.2A2 2 0 0 1 19.5 9L21 13.5M3 13.5v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4M3 13.5h18M6.5 16.5h.01M17.5 16.5h.01',
  box: 'M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9M12 12 4 7.5',
  mail: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 0 8 7 8-7',
};

const Icon = ({ path, className = 'h-6 w-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (hasPermission('brands.manage')) api.get('/brands').then((rows) => setStats((s) => ({ ...s, brands: rows.length })));
    if (hasPermission('models.manage') || hasPermission('packages.manage')) {
      api.get('/models').then((rows) => setStats((s) => ({ ...s, models: rows.length })));
    }
    if (hasPermission('packages.manage')) api.get('/packages').then((rows) => setStats((s) => ({ ...s, packages: rows.length })));
    if (hasPermission('contact.manage')) {
      api.get('/contact').then((rows) => setStats((s) => ({ ...s, newContacts: rows.filter((c) => c.status === 'new').length })));
    }
  }, []);

  const cards = [
    { key: 'brands', label: 'Marken', icon: 'tag', hint: 'Die Hersteller, z. B. Audi oder BMW.', value: stats.brands, to: '/admin/brands', show: hasPermission('brands.manage') },
    { key: 'models', label: 'Modelle', icon: 'car', hint: 'Die Fahrzeuge einer Marke, z. B. A4.', value: stats.models, to: '/admin/models', show: hasPermission('models.manage') },
    { key: 'packages', label: 'Pakete', icon: 'box', hint: 'Die Sound-Pakete für ein Modell.', value: stats.packages, to: '/admin/packages', show: hasPermission('packages.manage') },
    { key: 'contacts', label: 'Neue Anfragen', icon: 'mail', hint: 'Kunden, die noch auf Antwort warten.', value: stats.newContacts, to: '/admin/contact-requests', show: hasPermission('contact.manage'), highlight: true },
  ].filter((c) => c.show);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Willkommen, {user?.username}!</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Hier siehst du auf einen Blick, wie viel in deinem Shop hinterlegt ist. Klicke auf eine Kachel, um dorthin zu gelangen.
      </p>
      {cards.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          Für deinen Account sind noch keine Bereiche freigeschaltet. Bitte wende dich an einen Administrator.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.key}
              to={card.to}
              className={`rounded-xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                card.highlight && card.value > 0
                  ? 'border-brand-300 bg-brand-50 dark:border-brand-900 dark:bg-brand-900/20'
                  : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
              }`}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                <Icon path={ICONS[card.icon]} />
              </div>
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{card.label}</p>
              <p className="mt-1 text-3xl font-extrabold text-brand-600 dark:text-brand-400">{card.value ?? '…'}</p>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{card.hint}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
