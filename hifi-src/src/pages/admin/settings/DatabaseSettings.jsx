import { useEffect, useState } from 'react';
import { api } from '../../../api/client.js';

export default function DatabaseSettings() {
  const [form, setForm] = useState({ host: '', name: '', user: '', password: '', charset: 'utf8mb4' });
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [schemaReport, setSchemaReport] = useState(null);
  const [schemaChecking, setSchemaChecking] = useState(true);
  const [schemaMigrating, setSchemaMigrating] = useState(false);
  const [schemaActions, setSchemaActions] = useState(null);

  const loadDbConfig = () => {
    setLoading(true);
    api.get('/settings/database').then((res) => {
      setForm({ ...res.config, password: '' });
      setHasPassword(res.has_password);
    }).finally(() => setLoading(false));
  };

  const checkSchema = () => {
    setSchemaChecking(true);
    api.get('/settings/schema-check')
      .then(setSchemaReport)
      .catch((err) => setSchemaReport({ ok: false, error: err.message, tables: [] }))
      .finally(() => setSchemaChecking(false));
  };

  useEffect(() => {
    loadDbConfig();
    checkSchema();
  }, []);

  const handleMigrateSchema = async () => {
    setSchemaMigrating(true);
    setSchemaActions(null);
    try {
      const result = await api.post('/settings/schema-migrate', {});
      setSchemaActions(result.actions);
      setSchemaReport(result.report);
    } catch (err) {
      setSchemaActions(['Fehler: ' + err.message]);
    } finally {
      setSchemaMigrating(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveBusy(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await api.post('/settings/database', form);
      setSaveSuccess(true);
      setForm((f) => ({ ...f, password: '' }));
      setHasPassword(true);
      checkSchema();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Datenbank-Zugangsdaten</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Wichtig für einen Umzug auf einen anderen Server/Webspace: Trage hier die Zugangsdaten der dortigen
          Datenbank ein. Die Verbindung wird vor dem Speichern getestet, damit du dich nicht aussperrst.
        </p>

        {loading ? (
          <p className="text-sm text-neutral-400">Lädt…</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Host *</label>
              <input
                required
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Datenbankname *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Benutzer *</label>
              <input
                required
                value={form.user}
                onChange={(e) => setForm({ ...form, user: e.target.value })}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Passwort {hasPassword ? '(leer lassen = unverändert)' : ''}
              </label>
              <div className="flex gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={hasPassword ? '••••••••' : ''}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="shrink-0 rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700"
                >
                  {showPassword ? 'Verbergen' : 'Anzeigen'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Zeichensatz</label>
              <input
                value={form.charset}
                onChange={(e) => setForm({ ...form, charset: e.target.value })}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            {saveSuccess && <p className="text-sm text-green-600 dark:text-green-400">Verbindung erfolgreich getestet und gespeichert.</p>}

            <button
              type="submit"
              disabled={saveBusy}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saveBusy ? 'Teste & speichere…' : 'Verbindung testen & speichern'}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-neutral-900 dark:text-white">Datenbankstruktur</h2>
          {!schemaChecking && schemaReport && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                schemaReport.ok
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              }`}
            >
              {schemaReport.ok ? 'Datenbank OK' : 'Datenbank nicht OK'}
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Prüft, ob diese Datenbank alle Tabellen und Spalten hat, die der aktuelle Code-Stand braucht – wichtig,
          wenn deine Live-Version auf einem anderen Server einen älteren Stand hat.
        </p>

        {schemaChecking && <p className="text-sm text-neutral-400">Prüfe…</p>}

        {!schemaChecking && schemaReport && !schemaReport.ok && (
          <ul className="mb-4 space-y-1 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {schemaReport.tables.filter((t) => !t.ok).map((t) => (
              <li key={t.table}>
                {!t.exists ? (
                  <>Tabelle <code className="font-mono">{t.table}</code> fehlt komplett</>
                ) : (
                  <>Tabelle <code className="font-mono">{t.table}</code>: Spalte(n) fehlen – {t.missing_columns.join(', ')}</>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={checkSchema}
            disabled={schemaChecking}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Erneut prüfen
          </button>
          {schemaReport && !schemaReport.ok && (
            <button
              onClick={handleMigrateSchema}
              disabled={schemaMigrating}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {schemaMigrating ? 'Aktualisiere…' : 'Datenbankstruktur aktualisieren'}
            </button>
          )}
        </div>

        {schemaActions && (
          <ul className="mt-3 space-y-1 rounded-md bg-neutral-50 p-3 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {schemaActions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
