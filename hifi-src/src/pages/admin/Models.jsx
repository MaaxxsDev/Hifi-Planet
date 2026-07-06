import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';

const emptyForm = { name: '', brand_id: '', sort_order: 0 };

export default function Models() {
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');

  const filteredModels = useMemo(
    () => (brandFilter === 'all' ? models : models.filter((m) => String(m.brand_id) === brandFilter)),
    [models, brandFilter]
  );

  const load = () => {
    api.get('/models').then(setModels);
    api.get('/brands').then(setBrands);
  };

  useEffect(load, []);

  const startEdit = (model) => {
    setEditingId(model.id);
    setForm({ name: model.name, brand_id: model.brand_id, sort_order: model.sort_order });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, brand_id: Number(form.brand_id) };
    try {
      if (editingId) {
        await api.put(`/models/${editingId}`, payload);
      } else {
        await api.post('/models', payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Modell inkl. aller Pakete/Produkte wirklich löschen?')) return;
    await api.delete(`/models/${id}`);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">Modelle</h1>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Nach Marke filtern:</label>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="all">Alle Marken</option>
            {brands.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
          </select>
          {brandFilter !== 'all' && (
            <button onClick={() => setBrandFilter('all')} className="text-sm text-brand-600 hover:underline">
              Filter zurücksetzen
            </button>
          )}
          <span className="text-sm text-neutral-400">{filteredModels.length} von {models.length}</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2">Marke</th>
                <th className="px-4 py-2">Modell</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredModels.map((model) => (
                <tr key={model.id} className="bg-white dark:bg-neutral-950">
                  <td className="px-4 py-2">{model.brand_name}</td>
                  <td className="px-4 py-2 font-medium text-neutral-800 dark:text-neutral-100">{model.name}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => startEdit(model)} className="mr-3 text-brand-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => handleDelete(model.id)} className="text-red-600 hover:underline">Löschen</button>
                  </td>
                </tr>
              ))}
              {filteredModels.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                  {models.length === 0 ? 'Noch keine Modelle angelegt.' : 'Keine Modelle für diese Marke.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-bold text-neutral-900 dark:text-white">{editingId ? 'Modell bearbeiten' : 'Neues Modell'}</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Marke *</label>
          <select
            required
            value={form.brand_id}
            onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Bitte wählen…</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Modellname *</label>
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
