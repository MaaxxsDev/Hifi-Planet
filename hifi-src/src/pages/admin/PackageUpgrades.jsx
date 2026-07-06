import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';

const formatPrice = (value) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const emptyForm = { name: '', description: '', price: 0, sort_order: 0 };

export default function PackageUpgrades() {
  const { packageId } = useParams();
  const [upgrades, setUpgrades] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get(`/packages/${packageId}/upgrades`).then(setUpgrades);

  useEffect(() => {
    load();
  }, [packageId]);

  const startEdit = (u) => {
    setEditingId(u.id);
    setForm({ name: u.name, description: u.description || '', price: u.price, sort_order: u.sort_order });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, package_id: Number(packageId), price: Number(form.price) };
    try {
      if (editingId) {
        await api.put(`/package-upgrades/${editingId}`, payload);
      } else {
        await api.post('/package-upgrades', payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Upgrade wirklich löschen?')) return;
    await api.delete(`/package-upgrades/${id}`);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <p className="mb-2 text-sm">
          <Link to="/admin/packages" className="text-brand-600 hover:underline">← Zurück zu den Paketen</Link>
        </p>
        <h1 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Optionale Upgrades</h1>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Diese Upgrades erscheinen nicht in der öffentlichen Paketübersicht, sondern erst als Auswahl im Kontaktformular.
        </p>
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Preis</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {upgrades.map((u) => (
                <tr key={u.id} className="bg-white dark:bg-neutral-950">
                  <td className="px-4 py-2">
                    <p className="font-medium text-neutral-800 dark:text-neutral-100">{u.name}</p>
                    {u.description && <p className="text-xs text-neutral-500 dark:text-neutral-400">{u.description}</p>}
                  </td>
                  <td className="px-4 py-2">{formatPrice(u.price)}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => startEdit(u)} className="mr-3 text-brand-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">Löschen</button>
                  </td>
                </tr>
              ))}
              {upgrades.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-neutral-400">Noch keine Upgrades hinterlegt.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-bold text-neutral-900 dark:text-white">{editingId ? 'Upgrade bearbeiten' : 'Neues Upgrade'}</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Beschreibung</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Preis (€) *</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Sortierung</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            {editingId ? 'Speichern' : 'Anlegen'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">
              Abbrechen
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
