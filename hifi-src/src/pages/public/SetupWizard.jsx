import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import logo from '../../assets/logo.png';

const emptyDbForm = { host: '', name: '', user: '', password: '', charset: 'utf8mb4' };
const emptyAdminForm = { username: '', password: '', password_confirmation: '' };

export default function SetupWizard() {
  usePageMeta({ title: 'Ersteinrichtung', path: '/setup' });

  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [password, setPassword] = useState('');
  const [dbForm, setDbForm] = useState(emptyDbForm);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [migrateActions, setMigrateActions] = useState(null);

  // Wird NACH erfolgreicher Passwort-Prüfung (und nach jedem Schritt) aufgerufen,
  // um zu bestimmen, bei welchem Schritt der Assistent weitermachen soll.
  const loadStepStatus = () =>
    api.get('/setup/status').then((status) => {
      if (!status.needs_setup) {
        setPhase('locked');
      } else if (status.steps.admin.ok) {
        setPhase('done');
      } else if (!status.steps.schema.ok) {
        setPhase(status.steps.database.ok ? 'schema' : 'database');
      } else {
        setPhase('admin');
      }
      return status;
    });

  // Initialer Check beim Laden der Seite: nur ermitteln, ob überhaupt noch eine
  // Einrichtung nötig ist (kein Passwort erforderlich) - Details gibt's erst danach.
  useEffect(() => {
    api
      .get('/setup/status')
      .then((status) => setPhase(status.needs_setup ? 'password' : 'locked'))
      .catch(() => setPhase('locked'));
  }, []);

  const handlePassword = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/setup/verify-password', { password });
      await loadStepStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDatabase = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/setup/database', dbForm);
      await loadStepStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleMigrate = async () => {
    setError('');
    setBusy(true);
    try {
      const result = await api.post('/setup/migrate', {});
      setMigrateActions(result.actions);
      if (result.status.steps.schema.ok) {
        setPhase('admin');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAdmin = async (e) => {
    e.preventDefault();
    setError('');
    if (adminForm.password !== adminForm.password_confirmation) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }
    setBusy(true);
    try {
      await api.post('/setup/admin', adminForm);
      setPhase('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900';
  const labelClass = 'mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300';

  const steps = [
    { key: 'database', label: 'Datenbank' },
    { key: 'schema', label: 'Struktur' },
    { key: 'admin', label: 'Admin-Account' },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === phase);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4 py-12 dark:bg-neutral-950">
      <img src={logo} alt="HifiPlanet" className="h-16 w-auto sm:h-20" />

      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {phase === 'loading' && <p className="text-center text-sm text-neutral-400">Lädt…</p>}

        {phase === 'locked' && (
          <div className="text-center">
            <h1 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">Bereits eingerichtet</h1>
            <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
              Diese Seite wurde bereits vollständig eingerichtet. Der Assistent ist deshalb gesperrt.
            </p>
            <Link to="/admin/login" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
              Zum Login
            </Link>
          </div>
        )}

        {['database', 'schema', 'admin'].includes(phase) && (
          <div className="mb-6 flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    i < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : i === currentStepIndex
                        ? 'bg-brand-500 text-white'
                        : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                  }`}
                >
                  {i < currentStepIndex ? '✓' : i + 1}
                </span>
                {i < steps.length - 1 && <span className="h-px w-6 bg-neutral-300 dark:bg-neutral-700" />}
              </div>
            ))}
          </div>
        )}

        {phase === 'password' && (
          <form onSubmit={handlePassword}>
            <h1 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">Ersteinrichtung</h1>
            <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
              Gib das Einmalpasswort ein, das in <code>config/setup.php</code> hinterlegt ist.
            </p>
            <div className="mb-4">
              <label className={labelClass}>Einmalpasswort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className={inputClass}
              />
            </div>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {busy ? 'Prüfe…' : 'Weiter'}
            </button>
          </form>
        )}

        {phase === 'database' && (
          <form onSubmit={handleDatabase}>
            <h1 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">Datenbank-Zugangsdaten</h1>
            <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
              Trage die Zugangsdaten der Datenbank auf diesem Server ein. Die Verbindung wird vor dem Speichern
              getestet.
            </p>
            <div className="mb-3">
              <label className={labelClass}>Host *</label>
              <input
                required
                value={dbForm.host}
                onChange={(e) => setDbForm({ ...dbForm, host: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Datenbankname *</label>
              <input
                required
                value={dbForm.name}
                onChange={(e) => setDbForm({ ...dbForm, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Benutzer *</label>
              <input
                required
                value={dbForm.user}
                onChange={(e) => setDbForm({ ...dbForm, user: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Passwort</label>
              <input
                type="password"
                value={dbForm.password}
                onChange={(e) => setDbForm({ ...dbForm, password: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Zeichensatz</label>
              <input
                value={dbForm.charset}
                onChange={(e) => setDbForm({ ...dbForm, charset: e.target.value })}
                className={inputClass}
              />
            </div>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {busy ? 'Teste Verbindung…' : 'Verbindung testen & speichern'}
            </button>
          </form>
        )}

        {phase === 'schema' && (
          <div>
            <h1 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">Datenbankstruktur</h1>
            <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
              Die Datenbankverbindung funktioniert. Jetzt legen wir die benötigten Tabellen an.
            </p>
            {migrateActions && (
              <ul className="mb-4 space-y-1 rounded-md bg-neutral-50 p-3 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {migrateActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={handleMigrate}
              disabled={busy}
              className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {busy ? 'Richte ein…' : 'Datenbankstruktur einrichten'}
            </button>
          </div>
        )}

        {phase === 'admin' && (
          <form onSubmit={handleAdmin}>
            <h1 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">Erster Admin-Account</h1>
            <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
              Lege den ersten Super-Admin-Account an, mit dem du dich anschließend einloggen kannst.
            </p>
            <div className="mb-3">
              <label className={labelClass}>Benutzername</label>
              <input
                required
                autoFocus
                value={adminForm.username}
                onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Passwort</label>
              <input
                type="password"
                required
                minLength={8}
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Passwort wiederholen</label>
              <input
                type="password"
                required
                minLength={8}
                value={adminForm.password_confirmation}
                onChange={(e) => setAdminForm({ ...adminForm, password_confirmation: e.target.value })}
                className={inputClass}
              />
            </div>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {busy ? 'Lege an…' : 'Admin-Account anlegen'}
            </button>
          </form>
        )}

        {phase === 'done' && (
          <div className="text-center">
            <h1 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">Fertig!</h1>
            <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
              Die Ersteinrichtung ist abgeschlossen. Du kannst dich jetzt mit deinem neuen Admin-Account anmelden.
            </p>
            <Link
              to="/admin/login"
              className="inline-block w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Zum Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
