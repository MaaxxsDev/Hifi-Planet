import { useEffect, useState } from 'react';
import { api } from '../../../api/client.js';
import ImageUploadField from '../../../components/ImageUploadField.jsx';

const emptyForm = { phone: '', whatsapp: '', contact_email: '', hero_image_path: '' };

export default function WebsiteSettings() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/site-settings')
      .then((res) =>
        setForm({
          phone: res.phone || '',
          whatsapp: res.whatsapp || '',
          contact_email: res.contact_email || '',
          hero_image_path: res.hero_image_path || '',
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await api.post('/site-settings', form);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-400">Lädt…</p>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Startseiten-Bild</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Das große Hero-Bild ganz oben auf der Startseite. Ohne eigenes Bild wird das Standardbild verwendet.
        </p>
        <ImageUploadField
          value={form.hero_image_path}
          onChange={(path) => update('hero_image_path', path)}
          label="Bild"
        />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Kontaktdaten</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Wird im Header, Footer und auf der Kontaktseite angezeigt.
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Telefon</label>
            <input
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="09373 20 62 390"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              WhatsApp Business Nummer
            </label>
            <input
              value={form.whatsapp}
              onChange={(e) => update('whatsapp', e.target.value)}
              placeholder="z. B. 09373 20 62 390"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <p className="mt-1 text-xs text-neutral-400">Leer lassen, um den WhatsApp-Link im Header auszublenden.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">E-Mail</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => update('contact_email', e.target.value)}
              placeholder="info@hifi-planet-amorbach.de"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Gespeichert.</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {busy ? 'Speichere…' : 'Speichern'}
      </button>
    </form>
  );
}
