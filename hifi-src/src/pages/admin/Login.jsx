import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '../../assets/logo.png';
import logoDark from '../../assets/logo-dark.png';

export default function Login() {
  const { user, login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(username, password);
      if (result.requires2fa) {
        setStep('code');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyTwoFactor(code);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4 dark:bg-neutral-950">
      <img src={logo} alt="HifiPlanet" className="h-16 w-auto dark:hidden sm:h-20" />
      <img src={logoDark} alt="HifiPlanet" className="hidden h-16 w-auto dark:block sm:h-20" />
      {step === 'credentials' ? (
        <form onSubmit={handleCredentials} className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="mb-6 text-xl font-bold text-neutral-900 dark:text-white">Admin-Login</h1>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Benutzername</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCode} className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">Bestätigungscode</h1>
          <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
            Öffne die Google Authenticator App und gib den 6-stelligen Code ein. Alternativ kannst du auch
            einen deiner Wiederherstellungscodes verwenden.
          </p>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
              inputMode="numeric"
              placeholder="123456"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-center text-lg tracking-widest focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? 'Prüfe…' : 'Bestätigen'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('credentials'); setCode(''); setError(''); }}
            className="mt-3 w-full text-sm text-neutral-500 hover:underline dark:text-neutral-400"
          >
            Zurück zum Login
          </button>
        </form>
      )}
    </div>
  );
}
