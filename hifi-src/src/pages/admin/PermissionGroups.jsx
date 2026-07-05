import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

const emptyForm = { name: '', description: '', permissions: [] };

export default function PermissionGroups() {
  const [groups, setGroups] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/permission-groups').then(setGroups);
    api.get('/permissions/catalog').then(setCatalog);
  };

  useEffect(load, []);

  const startEdit = (g) => {
    setEditingId(g.id);
    setForm({ name: g.name, description: g.description || '', permissions: g.permissions });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const togglePermission = (key) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter((p) => p !== key) : [...f.permissions, key],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/permission-groups/${editingId}`, form);
      } else {
        await api.post('/permission-groups', form);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Diese Berechtigungsgruppe wirklich löschen? Benutzer behalten ihre sonstigen Rechte.')) return;
    await api.delete(`/permission-groups/${id}`);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Berechtigungsgruppen</h1>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Fasse mehrere Berechtigungen zu einer Gruppe zusammen (z. B. „Werkstatt"), die du dann bequem einem
          oder mehreren Benutzern zuweisen kannst.
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Berechtigungen</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {groups.map((g) => (
                <tr key={g.id} className="bg-white dark:bg-slate-950">
                  <td className="px-4 py-2">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{g.name}</p>
                    {g.description && <p className="text-xs text-slate-500 dark:text-slate-400">{g.description}</p>}
                  </td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{g.permissions.length} von {catalog.length}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => startEdit(g)} className="mr-3 text-brand-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => handleDelete(g.id)} className="text-red-600 hover:underline">Löschen</button>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Noch keine Berechtigungsgruppen angelegt.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-white">{editingId ? 'Gruppe bearbeiten' : 'Neue Gruppe'}</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Beschreibung</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Berechtigungen</p>
          <div className="space-y-1.5 rounded-md border border-slate-200 p-3 dark:border-slate-700">
            {catalog.map((p) => (
              <label key={p.key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.permissions.includes(p.key)}
                  onChange={() => togglePermission(p.key)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            {editingId ? 'Speichern' : 'Anlegen'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-700">
              Abbrechen
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
