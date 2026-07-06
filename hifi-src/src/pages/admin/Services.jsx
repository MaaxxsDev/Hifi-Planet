import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import ImageUploadField from '../../components/ImageUploadField.jsx';
import IconPicker from '../../components/IconPicker.jsx';
import DynamicIcon from '../../components/DynamicIcon.jsx';

const emptyForm = {
  icon_name: '',
  title: '',
  description: '',
  image_path: '',
  cta_label: '',
  cta_url: '',
  sort_order: 0,
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/services').then(setServices);

  useEffect(load, []);

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      icon_name: s.icon_name,
      title: s.title,
      description: s.description,
      image_path: s.image_path || '',
      cta_label: s.cta_label || '',
      cta_url: s.cta_url || '',
      sort_order: s.sort_order,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.icon_name) {
      setError('Bitte ein Icon auswählen');
      return;
    }
    const payload = { ...form, sort_order: Number(form.sort_order) };
    try {
      if (editingId) {
        await api.put(`/services/${editingId}`, payload);
      } else {
        await api.post('/services', payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Diese Leistung wirklich löschen?')) return;
    await api.delete(`/services/${id}`);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Leistungen</h1>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Diese Karten erscheinen auf der öffentlichen Leistungen-Seite. Die 8 mitgelieferten Einträge sind die
          Standard-Einstellung – du kannst sie bearbeiten, löschen und beliebig neue hinzufügen.
        </p>
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2">Icon</th>
                <th className="px-4 py-2">Titel</th>
                <th className="px-4 py-2">Sortierung</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {services.map((s) => (
                <tr key={s.id} className="bg-white dark:bg-neutral-950">
                  <td className="px-4 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                      <DynamicIcon name={s.icon_name} className="h-5 w-5" />
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium text-neutral-800 dark:text-neutral-100">{s.title}</td>
                  <td className="px-4 py-2">{s.sort_order}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => startEdit(s)} className="mr-3 text-brand-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Löschen</button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Noch keine Leistungen angelegt.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-bold text-neutral-900 dark:text-white">{editingId ? 'Leistung bearbeiten' : 'Neue Leistung'}</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Icon *</label>
          <IconPicker value={form.icon_name} onChange={(name) => setForm({ ...form, icon_name: name })} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Beschreibung *</label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <ImageUploadField value={form.image_path} onChange={(path) => setForm({ ...form, image_path: path })} label="Bild" />

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Button-Text (optional)</label>
          <input
            value={form.cta_label}
            onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
            placeholder="z. B. Fahrzeug konfigurieren"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Button-Link (optional)</label>
          <input
            value={form.cta_url}
            onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
            placeholder="z. B. /fahrzeuge"
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
