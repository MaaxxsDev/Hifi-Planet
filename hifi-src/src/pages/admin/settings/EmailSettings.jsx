import { useEffect, useState } from 'react';
import { api } from '../../../api/client.js';

const emptyForm = {
  mail_host: '',
  mail_port: 587,
  mail_username: '',
  mail_password: '',
  mail_encryption: 'tls',
  mail_from_email: '',
  mail_from_name: '',
  mail_notify_email: '',
  mail_customer_subject: '',
  mail_customer_body: '',
  mail_owner_subject: '',
  mail_owner_body: '',
};

const PLACEHOLDERS = [
  ['{{name}}', 'Name des Kunden'],
  ['{{email}}', 'E-Mail des Kunden'],
  ['{{phone}}', 'Telefonnummer'],
  ['{{vin}}', 'Fahrgestellnummer (FIN)'],
  ['{{message}}', 'Nachricht des Kunden'],
  ['{{brand}}', 'Marke'],
  ['{{model}}', 'Modell'],
  ['{{package}}', 'Paket'],
  ['{{product}}', 'Produkt'],
  ['{{upgrades}}', 'Gewählte Upgrades'],
];

function PlaceholderLegend() {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {PLACEHOLDERS.map(([token, label]) => (
        <span
          key={token}
          title={label}
          className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
        >
          {token}
        </span>
      ))}
    </div>
  );
}

export default function EmailSettings() {
  const [form, setForm] = useState(emptyForm);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [testBusy, setTestBusy] = useState(false);
  const [testError, setTestError] = useState('');
  const [testSuccess, setTestSuccess] = useState('');
  const [testWarning, setTestWarning] = useState('');
  const [testLog, setTestLog] = useState(null);

  useEffect(() => {
    api
      .get('/settings/mail')
      .then((res) => {
        setForm({ ...res, mail_password: '' });
        setHasPassword(res.has_password);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveBusy(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const res = await api.post('/settings/mail', form);
      setForm({ ...res, mail_password: '' });
      setHasPassword(res.has_password);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaveBusy(false);
    }
  };

  const handleTest = async () => {
    setTestBusy(true);
    setTestError('');
    setTestSuccess('');
    setTestWarning('');
    setTestLog(null);
    try {
      const res = await api.post('/settings/mail/test', form);
      setTestSuccess(`Testmail gesendet an ${res.sent_to}. Der Server hat die Mail angenommen - prüfe auch den Spam-Ordner, das ist noch keine Garantie für die Zustellung.`);
      setTestWarning(res.warning || '');
      setTestLog(res.smtp_log || null);
    } catch (err) {
      setTestError(err.message);
    } finally {
      setTestBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-400">Lädt…</p>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">SMTP-Server</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Zugangsdaten deines Mail-Postfachs oder Transactional-Mail-Anbieters. Solange kein Server eingetragen ist,
          werden keine E-Mails verschickt (Kontaktanfragen werden trotzdem in der Datenbank gespeichert).
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Server (Host)</label>
              <input
                value={form.mail_host}
                onChange={(e) => update('mail_host', e.target.value)}
                placeholder="smtp.beispiel.de"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Port</label>
              <input
                type="number"
                value={form.mail_port}
                onChange={(e) => update('mail_port', e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Verschlüsselung</label>
            <select
              value={form.mail_encryption}
              onChange={(e) => update('mail_encryption', e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="tls">STARTTLS</option>
              <option value="ssl">SSL</option>
              <option value="none">Keine</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Benutzername</label>
            <input
              value={form.mail_username}
              onChange={(e) => update('mail_username', e.target.value)}
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
                value={form.mail_password}
                onChange={(e) => update('mail_password', e.target.value)}
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
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Absender-E-Mail</label>
            <input
              type="email"
              value={form.mail_from_email}
              onChange={(e) => update('mail_from_email', e.target.value)}
              placeholder="info@hifi-planet-amorbach.de"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Absender-Name</label>
            <input
              value={form.mail_from_name}
              onChange={(e) => update('mail_from_name', e.target.value)}
              placeholder="HifiPlanet"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </div>

        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          {testError && <p className="mb-2 whitespace-pre-wrap text-sm text-red-600">{testError}</p>}
          {testSuccess && <p className="mb-2 text-sm text-green-600 dark:text-green-400">{testSuccess}</p>}
          {testWarning && (
            <p className="mb-2 rounded-md bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              {testWarning}
            </p>
          )}
          <button
            type="button"
            onClick={handleTest}
            disabled={testBusy}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {testBusy ? 'Sende Testmail…' : 'Verbindung testen'}
          </button>
          {testLog && testLog.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-neutral-500 dark:text-neutral-400">SMTP-Protokoll anzeigen</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-neutral-900 p-3 text-xs text-neutral-200">
                {testLog.join('\n')}
              </pre>
            </details>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Empfänger</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          An diese Adresse geht die Benachrichtigung bei jeder neuen Kontaktanfrage.
        </p>
        <input
          type="email"
          value={form.mail_notify_email}
          onChange={(e) => update('mail_notify_email', e.target.value)}
          placeholder="info@hifi-planet-amorbach.de"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">E-Mail an den Kunden (Bestätigung)</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Geht automatisch an den Kunden, sobald er eine Kontaktanfrage abschickt.
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Betreff</label>
            <input
              value={form.mail_customer_subject}
              onChange={(e) => update('mail_customer_subject', e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Text</label>
            <textarea
              rows={8}
              value={form.mail_customer_body}
              onChange={(e) => update('mail_customer_body', e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </div>
        <PlaceholderLegend />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">E-Mail an den Shop (Benachrichtigung)</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Geht an die oben eingestellte Empfänger-Adresse, sobald eine neue Kontaktanfrage eingeht.
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Betreff</label>
            <input
              value={form.mail_owner_subject}
              onChange={(e) => update('mail_owner_subject', e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Text</label>
            <textarea
              rows={8}
              value={form.mail_owner_body}
              onChange={(e) => update('mail_owner_body', e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </div>
        <PlaceholderLegend />
      </section>

      {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      {saveSuccess && <p className="text-sm text-green-600 dark:text-green-400">Gespeichert.</p>}

      <button
        type="submit"
        disabled={saveBusy}
        className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {saveBusy ? 'Speichere…' : 'Speichern'}
      </button>
    </form>
  );
}
