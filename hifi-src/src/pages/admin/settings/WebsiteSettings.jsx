import { useEffect, useState } from 'react';
import { api } from '../../../api/client.js';
import ImageUploadField from '../../../components/ImageUploadField.jsx';

const emptyForm = {
  phone: '',
  whatsapp: '',
  contact_email: '',
  hero_image_path: '',
  ga_measurement_id: '',
  package_card_theme: 'graphite',
};

const PACKAGE_CARD_THEMES = [
  { value: 'graphite', label: 'Graphite Green', description: 'Graphit über Bronze/Silber/Gold/Platin bis zur Onyx-Krönung.' },
  { value: 'deep-blue', label: 'Deep Blue Luxury', description: 'Kühles Blau, das sich über Grün zu Gold erwärmt.' },
  { value: 'warm-bronze', label: 'Warm Bronze', description: 'Durchgehend warmes Kupfer/Bronze/Amber bis zum Gold.' },
];

export default function WebsiteSettings() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [gaPropertyId, setGaPropertyId] = useState('');
  const [gaServiceAccountJson, setGaServiceAccountJson] = useState('');
  const [gaHasCredentials, setGaHasCredentials] = useState(false);
  const [gaBusy, setGaBusy] = useState(false);
  const [gaError, setGaError] = useState('');
  const [gaSaved, setGaSaved] = useState(false);

  useEffect(() => {
    api
      .get('/site-settings')
      .then((res) =>
        setForm({
          phone: res.phone || '',
          whatsapp: res.whatsapp || '',
          contact_email: res.contact_email || '',
          hero_image_path: res.hero_image_path || '',
          ga_measurement_id: res.ga_measurement_id || '',
          package_card_theme: res.package_card_theme || 'graphite',
        })
      )
      .finally(() => setLoading(false));
    api.get('/settings/analytics').then((res) => {
      setGaPropertyId(res.ga_property_id || '');
      setGaHasCredentials(res.has_credentials);
    });
  }, []);

  const handleGaDashboardSave = async () => {
    setGaBusy(true);
    setGaError('');
    setGaSaved(false);
    try {
      const res = await api.post('/settings/analytics', {
        ga_property_id: gaPropertyId,
        service_account_json: gaServiceAccountJson,
      });
      setGaHasCredentials(res.has_credentials);
      setGaServiceAccountJson('');
      setGaSaved(true);
    } catch (err) {
      setGaError(err.message);
    } finally {
      setGaBusy(false);
    }
  };

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

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Paket-Kachel-Design</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Bestimmt die Farbgebung der Paket-Stufen auf jeder Fahrzeug-Modell-Seite (von der günstigsten bis zur
          teuersten Option).
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {PACKAGE_CARD_THEMES.map((theme) => (
            <label
              key={theme.value}
              className={`cursor-pointer rounded-lg border p-3 text-sm transition ${
                form.package_card_theme === theme.value
                  ? 'border-brand-500 ring-2 ring-brand-500/40'
                  : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600'
              }`}
            >
              <input
                type="radio"
                name="package_card_theme"
                value={theme.value}
                checked={form.package_card_theme === theme.value}
                onChange={(e) => update('package_card_theme', e.target.value)}
                className="sr-only"
              />
              <p className="font-semibold text-neutral-900 dark:text-white">{theme.label}</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{theme.description}</p>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Google Analytics</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Wird erst geladen, nachdem ein Besucher der Statistik-Kategorie im Cookie-Banner zugestimmt hat. Leer
          lassen, um Google Analytics zu deaktivieren.
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Measurement-ID</label>
          <input
            value={form.ga_measurement_id}
            onChange={(e) => update('ga_measurement_id', e.target.value)}
            placeholder="G-XXXXXXXXXX"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <div className="mt-5 border-t border-neutral-200 pt-5 dark:border-neutral-800">
          <h3 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-white">Dashboard-Anbindung (optional)</h3>
          <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            Zeigt Besucherzahlen direkt in deinem Admin-Dashboard an. Braucht ein Google-Cloud-Service-Account mit
            Lesezugriff auf diese GA4-Property.
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Property-ID</label>
              <input
                value={gaPropertyId}
                onChange={(e) => { setGaPropertyId(e.target.value); setGaSaved(false); }}
                placeholder="z. B. 123456789"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
              <p className="mt-1 text-xs text-neutral-400">Nicht die Measurement-ID (G-...) - zu finden unter GA4 → Verwaltung → Property-Details.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Service-Account-JSON-Schlüssel {gaHasCredentials ? '(leer lassen = unverändert)' : ''}
              </label>
              <textarea
                rows={4}
                value={gaServiceAccountJson}
                onChange={(e) => { setGaServiceAccountJson(e.target.value); setGaSaved(false); }}
                placeholder={gaHasCredentials ? '{ "type": "service_account", ... } (bereits hinterlegt)' : '{ "type": "service_account", ... }'}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          </div>
          {gaError && <p className="mt-2 text-sm text-red-600">{gaError}</p>}
          {gaSaved && <p className="mt-2 text-sm text-green-600 dark:text-green-400">Gespeichert.</p>}
          <button
            type="button"
            onClick={handleGaDashboardSave}
            disabled={gaBusy}
            className="mt-3 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {gaBusy ? 'Speichere…' : 'Dashboard-Anbindung speichern'}
          </button>
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
