import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import ImageUploadField from '../../components/ImageUploadField.jsx';

const emptyForm = { name: '', cover_image_path: '', sort_order: 0 };

export default function GalleryBrands() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/gallery-brands').then(setBrands);

  useEffect(() => {
    load();
  }, []);

  const startEdit = (brand) => {
    setEditingId(brand.id);
    setForm({ name: brand.name, cover_image_path: brand.cover_image_path || '', sort_order: brand.sort_order });
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
        await api.put(`/gallery-brands/${editingId}`, form);
      } else {
        await api.post('/gallery-brands', form);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Marke inkl. aller Projekte/Fotos wirklich löschen?')) return;
    await api.delete(`/gallery-brands/${id}`);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">Galerie-Marken</h1>
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2">Bild</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Sortierung</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {brands.map((brand) => (
                <tr key={brand.id} className="bg-white dark:bg-neutral-950">
                  <td className="px-4 py-2">
                    {brand.cover_image_path ? (
                      <img src={brand.cover_image_path} alt="" className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-400 dark:bg-neutral-800">–</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-neutral-800 dark:text-neutral-100">
                    <Link to={`/galerie/${brand.slug}`} target="_blank" className="hover:text-brand-500">
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
                <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Noch keine Galerie-Marken angelegt.</td></tr>
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
