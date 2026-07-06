import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

const formatPrice = (value) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const statusLabel = { new: 'Neu', in_progress: 'In Bearbeitung', done: 'Erledigt' };
const statusBadge = {
  new: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-.8 12.1a1 1 0 0 1-1 .9H7.8a1 1 0 0 1-1-.9L6 7h12ZM10 11v6M14 11v6" />
  </svg>
);

export default function ContactRequests() {
  const { hasPermission } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = () => api.get('/contact').then(setRequests);

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id, status) => {
    await api.patch(`/contact/${id}`, { status });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Diese Kontaktanfrage wirklich unwiderruflich löschen?')) return;
    await api.delete(`/contact/${id}`);
    load();
  };

  const counts = useMemo(
    () => ({
      all: requests.length,
      new: requests.filter((r) => r.status === 'new').length,
      in_progress: requests.filter((r) => r.status === 'in_progress').length,
      done: requests.filter((r) => r.status === 'done').length,
    }),
    [requests]
  );

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const tabs = [
    { value: 'all', label: 'Alle' },
    { value: 'new', label: 'Neu' },
    { value: 'in_progress', label: 'In Bearbeitung' },
    { value: 'done', label: 'Erledigt' },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Kontaktanfragen</h1>
      <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        Alle Anfragen deiner Kunden. Wähle oben einen Reiter, um nur bestimmte Anfragen zu sehen.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === tab.value
                ? 'bg-brand-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            {tab.label} ({counts[tab.value]})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-neutral-800 dark:text-neutral-100">{r.name} · {r.email}{r.phone ? ` · ${r.phone}` : ''}</p>
                {r.vin && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">FIN: <span className="font-mono">{r.vin}</span></p>
                )}
                <p className="text-xs text-neutral-400">{new Date(r.created_at.replace(' ', 'T')).toLocaleString('de-DE')}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  className={`rounded-full border-0 px-3 py-1 text-xs font-medium ${statusBadge[r.status]}`}
                >
                  {Object.entries(statusLabel).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {hasPermission('contact.delete') && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    aria-label="Anfrage löschen"
                    title="Anfrage löschen"
                    className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>

            {(r.brand_name || r.model_name || r.package_name || r.product_name) && (
              <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
                {[r.brand_name, r.model_name, r.package_name, r.product_name].filter(Boolean).join(' · ')}
              </p>
            )}

            {r.selected_upgrades?.length > 0 && (
              <div className="mb-2 rounded-md bg-brand-50 p-2 text-sm text-brand-800 dark:bg-brand-900/20 dark:text-brand-200">
                <p className="font-semibold">Gewünschte Upgrades:</p>
                <ul className="list-disc pl-5">
                  {r.selected_upgrades.map((u) => (
                    <li key={u.id}>{u.name} – {formatPrice(u.price)}</li>
                  ))}
                </ul>
              </div>
            )}

            {r.message && <p className="text-sm text-neutral-700 dark:text-neutral-300">{r.message}</p>}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-neutral-400">
            {filter === 'all' ? 'Noch keine Kontaktanfragen eingegangen.' : 'Keine Anfragen mit diesem Status.'}
          </p>
        )}
      </div>
    </div>
  );
}
