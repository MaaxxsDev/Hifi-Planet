import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';

const emptyForm = { name: '', sort_order: 0 };

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/brands').then(setBrands);

  useEffect(() => {
    load();
  }, []);

  const startEdit = (brand) => {
    setEditingId(brand.id);
    setForm({ name: brand.name, sort_order: brand.sort_order });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/brands/${editingId}`, form);
      } else {
        await api.post('/brands', form);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Marke inkl. aller Modelle/Pakete/Produkte wirklich löschen?')) return;
    await api.delete(`/brands/${id}`);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">Marken</h1>
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Sortierung</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {brands.map((brand) => (
                <tr key={brand.id} className="bg-white dark:bg-neutral-950">
                  <td className="px-4 py-2 font-medium text-neutral-800 dark:text-neutral-100">
                    <Link to={`/marken/${brand.slug}`} target="_blank" className="hover:text-brand-500">
                      {brand.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{brand.sort_order}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => startEdit(brand)} className="mr-3 text-brand-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => handleDelete(brand.id)} className="text-red-600 hover:underline">Löschen</button>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-neutral-400">Noch keine Marken angelegt.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-bold text-neutral-900 dark:text-white">{editingId ? 'Marke bearbeiten' : 'Neue Marke'}</h2>
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
