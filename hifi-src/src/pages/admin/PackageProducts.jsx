import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';

const formatPrice = (value) =>
  value == null ? '–' : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const statusBadge = {
  ok: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function PackageProducts() {
  const { packageId } = useParams();
  const [products, setProducts] = useState([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [nameOverride, setNameOverride] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/packages/${packageId}/products`).then(setProducts);

  useEffect(() => {
    load();
  }, [packageId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/products', { package_id: Number(packageId), source_url: sourceUrl, name_override: nameOverride || null });
      setSourceUrl('');
      setNameOverride('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async (id) => {
    setBusy(true);
    try {
      await api.post(`/products/${id}/refresh-price`, {});
      load();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Produkt wirklich entfernen?')) return;
    await api.delete(`/products/${id}`);
    load();
  };

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link to="/admin/packages" className="text-brand-600 hover:underline">← Zurück zu den Paketen</Link>
      </p>
      <h1 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">Produkte im Paket</h1>

      <form onSubmit={handleAdd} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex-1 min-w-[240px]">
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">audio4cars.de Produkt-URL *</label>
          <input
            required
            type="url"
            placeholder="https://www.audio4cars.de/produkt/..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div className="w-56">
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name überschreiben (optional)</label>
          <input
            value={nameOverride}
            onChange={(e) => setNameOverride(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <button disabled={busy} type="submit" className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
          Hinzufügen
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-2">Produkt</th>
              <th className="px-4 py-2">Preis</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Zuletzt aktualisiert</th>
              <th className="px-4 py-2 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {products.map((p) => (
              <tr key={p.id} className="bg-white dark:bg-neutral-950">
                <td className="px-4 py-2">
                  <a href={p.source_url} target="_blank" rel="noreferrer" className="font-medium text-neutral-800 hover:underline dark:text-neutral-100">
                    {p.name_override || p.scraped_name || p.source_url}
                  </a>
                  {p.scrape_status === 'error' && <p className="text-xs text-red-500">{p.scrape_error}</p>}
                </td>
                <td className="px-4 py-2">{formatPrice(p.scraped_price)}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[p.scrape_status]}`}>
                    {p.scrape_status}
                  </span>
                </td>
                <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                  {p.price_updated_at ? new Date(p.price_updated_at.replace(' ', 'T')).toLocaleString('de-DE') : '–'}
                </td>
                <td className="px-4 py-2 text-right">
                  <button disabled={busy} onClick={() => handleRefresh(p.id)} className="mr-3 text-brand-600 hover:underline disabled:opacity-60">
                    Preis aktualisieren
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Entfernen</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-400">Noch keine Produkte im Paket.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
