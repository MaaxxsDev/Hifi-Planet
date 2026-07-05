import { useEffect, useState } from 'react';
import { api } from '../../../api/client.js';

const emptyStatus = {
  global: { enabled: false, message: '' },
  services: { enabled: false, message: '' },
  vehicles: { enabled: false, message: '' },
};

export default function MaintenanceSettings() {
  const [status, setStatus] = useState(emptyStatus);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/maintenance').then((res) => {
      setStatus({
        global: { enabled: res.global.enabled, message: res.global.message || '' },
        services: { enabled: res.services.enabled, message: res.services.message || '' },
        vehicles: { enabled: res.vehicles.enabled, message: res.vehicles.message || '' },
      });
    }).finally(() => setLoading(false));
  }, []);

  const update = (scope, field, value) => {
    setStatus((s) => ({ ...s, [scope]: { ...s[scope], [field]: value } }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const result = await api.post('/maintenance', status);
      setStatus({
        global: { enabled: result.global.enabled, message: result.global.message || '' },
        services: { enabled: result.services.enabled, message: result.services.message || '' },
        vehicles: { enabled: result.vehicles.enabled, message: result.vehicles.message || '' },
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sections = [
    {
      key: 'global',
      title: 'Gesamte Seite',
      hint: 'Besucher sehen nur noch eine Wartungsmeldung – egal welche Seite sie aufrufen. Das Admin-Panel bleibt für dich erreichbar.',
    },
    {
      key: 'services',
      title: 'Nur Leistungen',
      hint: 'Nur die Leistungen-Seite zeigt eine Wartungsmeldung, der Rest der Website funktioniert normal.',
    },
    {
      key: 'vehicles',
      title: 'Nur Fahrzeugkatalog',
      hint: 'Nur die Fahrzeugauswahl (Marke → Modell → Pakete) zeigt eine Wartungsmeldung, der Rest der Website funktioniert normal.',
    },
  ];

  if (loading) {
    return <p className="text-sm text-slate-400">Lädt…</p>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Ist "Gesamte Seite" aktiv, gewinnt das immer – die beiden anderen Schalter spielen dann keine Rolle mehr.
      </p>

      {sections.map((section) => (
        <section key={section.key} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900 dark:text-white">{section.title}</h2>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={status[section.key].enabled}
                onChange={(e) => update(section.key, 'enabled', e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-brand-500 dark:bg-slate-700" />
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
            </label>
          </div>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{section.hint}</p>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Eigene Nachricht (optional)
          </label>
          <textarea
            rows={2}
            value={status[section.key].message}
            onChange={(e) => update(section.key, 'message', e.target.value)}
            placeholder="z. B. Wir aktualisieren gerade unser Angebot. Schau bald wieder vorbei!"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </section>
      ))}

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
