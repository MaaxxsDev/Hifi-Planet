import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

const emptyForm = { username: '', password: '', is_super_admin: false, permissions: [], group_ids: [] };

export default function AdminUsers() {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/admin-users').then(setUsers);
    api.get('/permissions/catalog').then(setCatalog);
    if (hasPermission('permission_groups.manage') || hasPermission('users.manage')) {
      api.get('/permission-groups').then(setGroups);
    }
  };

  useEffect(load, []);

  const startEdit = (u) => {
    setEditingId(u.id);
    setForm({
      username: u.username,
      password: '',
      is_super_admin: u.is_super_admin,
      permissions: u.permissions,
      group_ids: u.groups.map((g) => g.id),
    });
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

  const toggleGroup = (id) => {
    setForm((f) => ({
      ...f,
      group_ids: f.group_ids.includes(id) ? f.group_ids.filter((g) => g !== id) : [...f.group_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/admin-users/${editingId}`, form);
      } else {
        if (form.password.length < 8) {
          setError('Passwort muss mindestens 8 Zeichen lang sein');
          return;
        }
        await api.post('/admin-users', form);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Diesen Benutzer wirklich löschen?')) return;
    try {
      await api.delete(`/admin-users/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Benutzer</h1>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Jeder Mitarbeiter bekommt ein eigenes Konto mit genau den Rechten, die er braucht.
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2">Benutzername</th>
                <th className="px-4 py-2">Rolle</th>
                <th className="px-4 py-2">Berechtigungsgruppen</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="bg-white dark:bg-slate-950">
                  <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">
                    {u.username}
                    {u.id === currentUser?.id && <span className="ml-1 text-xs text-slate-400">(du)</span>}
                  </td>
                  <td className="px-4 py-2">
                    {u.is_super_admin ? (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        Super-Admin
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">{u.permissions.length} Einzelrechte</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {u.groups.map((g) => (
                        <span key={g.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {g.name}
                        </span>
                      ))}
                      {u.groups.length === 0 && '–'}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => startEdit(u)} className="mr-3 text-brand-600 hover:underline">Bearbeiten</button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">Löschen</button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Noch keine Benutzer angelegt.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-white">{editingId ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Benutzername *</label>
          <input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Passwort {editingId ? '(leer lassen = unverändert)' : '*'}
          </label>
          <input
            type="password"
            required={!editingId}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        {currentUser?.is_super_admin && (
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.is_super_admin}
              onChange={(e) => setForm({ ...form, is_super_admin: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Super-Admin (hat automatisch alle Rechte)
          </label>
        )}

        {!form.is_super_admin && (
          <>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Einzelne Berechtigungen</p>
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

            <div>
              <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Berechtigungsgruppen</p>
              <div className="space-y-1.5 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                {groups.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.group_ids.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {g.name}
                  </label>
                ))}
                {groups.length === 0 && <p className="text-sm text-slate-400">Noch keine Berechtigungsgruppen angelegt.</p>}
              </div>
            </div>
          </>
        )}

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
