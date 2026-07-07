import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

const emptyForm = {
  question_de: '',
  answer_de: '',
  question_en: '',
  answer_en: '',
  sort_order: 0,
};

export default function Faqs() {
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/faqs').then(setFaqs);

  useEffect(load, []);

  const startEdit = (f) => {
    setEditingId(f.id);
    setForm({
      question_de: f.question_de,
      answer_de: f.answer_de,
      question_en: f.question_en,
      answer_en: f.answer_en,
      sort_order: f.sort_order,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, sort_order: Number(form.sort_order) };
    try {
      if (editingId) {
        await api.put(`/faqs/${editingId}`, payload);
      } else {
        await api.post('/faqs', payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Diese Frage wirklich löschen?')) return;
    await api.delete(`/faqs/${id}`);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Häufig gestellte Fragen</h1>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Diese Fragen erscheinen im FAQ-Bereich der Startseite, jeweils in der aktuell gewählten Sprache. Die 6
          mitgelieferten Einträge sind die Standard-Einstellung – du kannst sie bearbeiten, löschen und beliebig
          neue hinzufügen.
        </p>
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2">Frage (DE)</th>
                <th className="px-4 py-2">Sortierung</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {faqs.map((f) => (
                <tr key={f.id} className="bg-white dark:bg-neutral-950">
                  <td className="px-4 py-2 font-medium text-neutral-800 dark:text-neutral-100">{f.question_de}</td>
                  <td className="px-4 py-2">{f.sort_order}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => startEdit(f)} className="mr-3 text-brand-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => handleDelete(f.id)} className="text-red-600 hover:underline">Löschen</button>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-neutral-400">Noch keine Fragen angelegt.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-bold text-neutral-900 dark:text-white">{editingId ? 'Frage bearbeiten' : 'Neue Frage'}</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Frage (Deutsch) *</label>
          <input
            required
            value={form.question_de}
            onChange={(e) => setForm({ ...form, question_de: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Antwort (Deutsch) *</label>
          <textarea
            required
            rows={3}
            value={form.answer_de}
            onChange={(e) => setForm({ ...form, answer_de: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Frage (Englisch) *</label>
          <input
            required
            value={form.question_en}
            onChange={(e) => setForm({ ...form, question_en: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Antwort (Englisch) *</label>
          <textarea
            required
            rows={3}
            value={form.answer_en}
            onChange={(e) => setForm({ ...form, answer_en: e.target.value })}
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
