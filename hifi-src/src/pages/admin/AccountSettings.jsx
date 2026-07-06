import { useState } from 'react';
import QRCode from 'qrcode';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

const emptyPasswordForm = {
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
  two_factor_code: '',
};

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [phase, setPhase] = useState('idle'); // idle | setup | recovery-codes | disable | regenerate
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setPasswordError('Die neuen Passwörter stimmen nicht überein');
      return;
    }

    setPasswordBusy(true);
    try {
      await api.post('/auth/change-password', passwordForm);
      setPasswordForm(emptyPasswordForm);
      setPasswordSuccess('Passwort erfolgreich geändert.');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordBusy(false);
    }
  };

  const startSetup = async () => {
    setError('');
    setBusy(true);
    try {
      const data = await api.get('/auth/2fa/setup');
      setSecret(data.secret);
      setQrDataUrl(await QRCode.toDataURL(data.otpauth_url));
      setCode('');
      setPhase('setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api.post('/auth/2fa/enable', { code });
      setRecoveryCodes(data.recovery_codes);
      setPhase('recovery-codes');
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const finishRecoveryCodes = () => {
    setPhase('idle');
    setRecoveryCodes([]);
    setPassword('');
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/2fa/disable', { password });
      setPassword('');
      setPhase('idle');
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api.post('/auth/2fa/recovery-codes', { password });
      setRecoveryCodes(data.recovery_codes);
      setPhase('recovery-codes');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Mein Konto</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Angemeldet als <strong>{user?.username}</strong>{user?.is_super_admin ? ' (Super-Admin)' : ''}.
      </p>

      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Passwort ändern</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Vergib ein neues Passwort für dein Konto.
          {user?.two_factor_enabled && ' Da 2FA aktiv ist, musst du die Änderung zusätzlich mit deinem Code bestätigen.'}
        </p>
        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Aktuelles Passwort
            </label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              required
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Neues Passwort
            </label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              required
              minLength={8}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Neues Passwort wiederholen
            </label>
            <input
              type="password"
              value={passwordForm.new_password_confirmation}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
              required
              minLength={8}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          {user?.two_factor_enabled && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                2FA-Code zur Bestätigung
              </label>
              <input
                value={passwordForm.two_factor_code}
                onChange={(e) => setPasswordForm({ ...passwordForm, two_factor_code: e.target.value })}
                required
                inputMode="numeric"
                placeholder="123456 oder Wiederherstellungscode"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          )}
          {passwordError && <p className="mb-4 text-sm text-red-600">{passwordError}</p>}
          {passwordSuccess && <p className="mb-4 text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>}
          <button
            type="submit"
            disabled={passwordBusy}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {passwordBusy ? 'Wird geändert…' : 'Passwort ändern'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Zwei-Faktor-Authentifizierung</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Schützt dein Konto zusätzlich mit einem Code aus der Google Authenticator App.
        </p>

        {phase === 'idle' && (
          <>
            <p className="mb-4 text-sm">
              Status:{' '}
              {user?.two_factor_enabled ? (
                <span className="font-semibold text-green-600 dark:text-green-400">Aktiv</span>
              ) : (
                <span className="font-semibold text-neutral-500 dark:text-neutral-400">Nicht aktiv</span>
              )}
            </p>
            {user?.two_factor_enabled ? (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setPhase('regenerate'); setError(''); }}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Neue Wiederherstellungscodes erzeugen
                </button>
                <button
                  onClick={() => { setPhase('disable'); setError(''); }}
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
                >
                  2FA deaktivieren
                </button>
              </div>
            ) : (
              <button
                onClick={startSetup}
                disabled={busy}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                2FA aktivieren
              </button>
            )}
          </>
        )}

        {phase === 'setup' && (
          <form onSubmit={confirmSetup}>
            <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
              <li>Öffne die Google Authenticator App (oder eine kompatible App).</li>
              <li>Scanne den folgenden QR-Code:</li>
            </ol>
            <div className="mb-4 flex justify-center">
              {qrDataUrl && <img src={qrDataUrl} alt="QR-Code für Zwei-Faktor-Authentifizierung" className="h-48 w-48 rounded-lg border border-neutral-200 dark:border-neutral-700" />}
            </div>
            <p className="mb-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
              Geht das Scannen nicht? Gib diesen Code manuell ein: <br />
              <code className="mt-1 inline-block rounded bg-neutral-100 px-2 py-1 font-mono tracking-wider dark:bg-neutral-800">{secret}</code>
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Bestätigungscode aus der App
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
                inputMode="numeric"
                placeholder="123456"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-center text-lg tracking-widest dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
                Bestätigen & aktivieren
              </button>
              <button type="button" onClick={() => setPhase('idle')} className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">
                Abbrechen
              </button>
            </div>
          </form>
        )}

        {phase === 'recovery-codes' && (
          <div>
            <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
              Wiederherstellungscodes – jetzt sicher speichern!
            </p>
            <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
              Jeder Code funktioniert einmalig, falls du keinen Zugriff mehr auf die Authenticator-App hast.
              Diese Codes werden nur jetzt angezeigt.
            </p>
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-md bg-neutral-100 p-4 font-mono text-sm dark:bg-neutral-800">
              {recoveryCodes.map((c) => <span key={c}>{c}</span>)}
            </div>
            <button onClick={finishRecoveryCodes} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
              Ich habe die Codes gespeichert
            </button>
          </div>
        )}

        {phase === 'disable' && (
          <form onSubmit={handleDisable}>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Passwort zur Bestätigung
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                2FA jetzt deaktivieren
              </button>
              <button type="button" onClick={() => { setPhase('idle'); setPassword(''); }} className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">
                Abbrechen
              </button>
            </div>
          </form>
        )}

        {phase === 'regenerate' && (
          <form onSubmit={handleRegenerate}>
            <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
              Die bisherigen Wiederherstellungscodes werden ungültig.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Passwort zur Bestätigung
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
                Neue Codes erzeugen
              </button>
              <button type="button" onClick={() => { setPhase('idle'); setPassword(''); }} className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
