import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import IconPicker from '../../components/IconPicker.jsx';
import DynamicIcon from '../../components/DynamicIcon.jsx';

const emptyForm = {
  name: '',
  car_model_id: '',
  description: '',
  markup_type: 'none',
  markup_value: 0,
  icon_name: '',
  tagline: '',
  is_featured: false,
  sort_order: 0,
};

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');

  const load = () => {
    api.get('/packages').then(setPackages);
    api.get('/models').then(setModels);
  };

  useEffect(load, []);

  const modelById = useMemo(() => new Map(models.map((m) => [m.id, m])), [models]);

  const brandOptions = useMemo(() => {
    const seen = new Map();
    models.forEach((m) => {
      if (!seen.has(m.brand_id)) seen.set(m.brand_id, m.brand_name);
    });
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [models]);

  const modelOptions = useMemo(
    () =>
      models
        .filter((m) => brandFilter === 'all' || String(m.brand_id) === brandFilter)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [models, brandFilter]
  );

  const handleBrandFilterChange = (value) => {
    setBrandFilter(value);
    setModelFilter('all');
  };

  const filteredPackages = useMemo(
    () =>
      packages.filter((pkg) => {
        const model = modelById.get(pkg.car_model_id);
        if (brandFilter !== 'all' && String(model?.brand_id) !== brandFilter) return false;
        if (modelFilter !== 'all' && String(pkg.car_model_id) !== modelFilter) return false;
        return true;
      }),
    [packages, modelById, brandFilter, modelFilter]
  );

  const startEdit = (pkg) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      car_model_id: pkg.car_model_id,
      description: pkg.description || '',
      markup_type: pkg.markup_type || 'none',
      markup_value: pkg.markup_value || 0,
      icon_name: pkg.icon_name || '',
      tagline: pkg.tagline || '',
      is_featured: !!pkg.is_featured,
      sort_order: pkg.sort_order,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, car_model_id: Number(form.car_model_id), markup_value: Number(form.markup_value) };
    try {
      if (editingId) {
        await api.put(`/packages/${editingId}`, payload);
      } else {
        await api.post('/packages', payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Paket inkl. aller Produkte wirklich löschen?')) return;
    await api.delete(`/packages/${id}`);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">Pakete</h1>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Filtern:</label>
          <select
            value={brandFilter}
            onChange={(e) => handleBrandFilterChange(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="all">Alle Marken</option>
            {brandOptions.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
          </select>
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="all">Alle Modelle</option>
            {modelOptions.map((m) => <option key={m.id} value={String(m.id)}>{m.brand_name} {m.name}</option>)}
          </select>
          {(brandFilter !== 'all' || modelFilter !== 'all') && (
            <button onClick={() => handleBrandFilterChange('all')} className="text-sm text-brand-600 hover:underline">
              Filter zurücksetzen
            </button>
          )}
          <span className="text-sm text-neutral-400">{filteredPackages.length} von {packages.length}</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2">Marke / Modell</th>
                <th className="px-4 py-2">Paket</th>
                <th className="px-4 py-2">Aufschlag</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id} className="bg-white dark:bg-neutral-950">
                  <td className="px-4 py-2">{pkg.brand_name} {pkg.model_name}</td>
                  <td className="px-4 py-2 font-medium text-neutral-800 dark:text-neutral-100">
                    <span className="inline-flex items-center gap-1.5">
                      {pkg.icon_name && <DynamicIcon name={pkg.icon_name} className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                      {pkg.name}
                      {pkg.is_featured && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                          Empfohlen
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                    {pkg.markup_type === 'fixed' && `+${pkg.markup_value} €`}
                    {pkg.markup_type === 'percent' && `+${pkg.markup_value} %`}
                    {(!pkg.markup_type || pkg.markup_type === 'none') && '–'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link to={`/admin/packages/${pkg.id}/products`} className="mr-3 text-brand-600 hover:underline">Produkte</Link>
                    <Link to={`/admin/packages/${pkg.id}/upgrades`} className="mr-3 text-brand-600 hover:underline">Upgrades</Link>
                    <button onClick={() => startEdit(pkg)} className="mr-3 text-brand-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => handleDelete(pkg.id)} className="text-red-600 hover:underline">Löschen</button>
                  </td>
                </tr>
              ))}
              {filteredPackages.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                  {packages.length === 0 ? 'Noch keine Pakete angelegt.' : 'Keine Pakete für diesen Filter.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-bold text-neutral-900 dark:text-white">{editingId ? 'Paket bearbeiten' : 'Neues Paket'}</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Modell *</label>
          <select
            required
            value={form.car_model_id}
            onChange={(e) => setForm({ ...form, car_model_id: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Bitte wählen…</option>
            {models.map((m) => <option key={m.id} value={m.id}>{m.brand_name} {m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Paketname *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Beschreibung</label>
          <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Jede Zeile erscheint als eigener Stichpunkt zusammen mit den Bauteilen.</p>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Icon (optional)</label>
          <IconPicker value={form.icon_name} onChange={(name) => setForm({ ...form, icon_name: name })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Kurzer Slogan (optional)</label>
          <input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            placeholder="z. B. Perfekt für den Einstieg"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
          />
          Als empfohlen hervorheben
        </label>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Aufschlag</label>
          <div className="flex gap-2">
            <select
              value={form.markup_type}
              onChange={(e) => setForm({ ...form, markup_type: e.target.value })}
              className="w-40 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="none">Kein Aufschlag</option>
              <option value="fixed">Fester Betrag (€)</option>
              <option value="percent">Prozent (%)</option>
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={form.markup_type === 'none'}
              value={form.markup_value}
              onChange={(e) => setForm({ ...form, markup_value: e.target.value })}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Wird auf die Summe der Bauteilpreise aufgeschlagen und ergibt den Gesamtpreis für den Kunden.</p>
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
