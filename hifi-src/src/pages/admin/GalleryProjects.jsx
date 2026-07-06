import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import ImageUploadField from '../../components/ImageUploadField.jsx';

const emptyForm = { name: '', gallery_brand_id: '', cover_image_path: '', sort_order: 0 };

export default function GalleryProjects() {
  const [projects, setProjects] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');

  const filteredProjects = useMemo(
    () => (brandFilter === 'all' ? projects : projects.filter((p) => String(p.gallery_brand_id) === brandFilter)),
    [projects, brandFilter]
  );

  const load = () => {
    api.get('/gallery-projects').then(setProjects);
    api.get('/gallery-brands').then(setBrands);
  };

  useEffect(load, []);

  const startEdit = (project) => {
    setEditingId(project.id);
    setForm({
      name: project.name,
      gallery_brand_id: project.gallery_brand_id,
      cover_image_path: project.cover_image_path || '',
      sort_order: project.sort_order,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, gallery_brand_id: Number(form.gallery_brand_id) };
    try {
      if (editingId) {
        await api.put(`/gallery-projects/${editingId}`, payload);
      } else {
        await api.post('/gallery-projects', payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Projekt inkl. aller Fotos wirklich löschen?')) return;
    await api.delete(`/gallery-projects/${id}`);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">Galerie-Projekte</h1>

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
          <span className="text-sm text-neutral-400">{filteredProjects.length} von {projects.length}</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2">Marke</th>
                <th className="px-4 py-2">Projekt</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="bg-white dark:bg-neutral-950">
                  <td className="px-4 py-2">{project.brand_name}</td>
                  <td className="px-4 py-2 font-medium text-neutral-800 dark:text-neutral-100">{project.name}</td>
                  <td className="px-4 py-2 text-right">
                    <Link to={`/admin/gallery-projects/${project.id}/photos`} className="mr-3 text-brand-600 hover:underline">Fotos</Link>
                    <button onClick={() => startEdit(project)} className="mr-3 text-brand-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:underline">Löschen</button>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                  {projects.length === 0 ? 'Noch keine Projekte angelegt.' : 'Keine Projekte für diese Marke.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-bold text-neutral-900 dark:text-white">{editingId ? 'Projekt bearbeiten' : 'Neues Projekt'}</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Marke *</label>
          <select
            required
            value={form.gallery_brand_id}
            onChange={(e) => setForm({ ...form, gallery_brand_id: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Bitte wählen…</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Projektname *</label>
          <input
            required
            placeholder="z. B. Audi TT"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <ImageUploadField
          value={form.cover_image_path}
          onChange={(path) => setForm({ ...form, cover_image_path: path })}
          label="Titelbild (optional)"
        />
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
