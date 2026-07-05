import { useAuth } from '../context/AuthContext.jsx';

export default function RequirePermission({ permission, children }) {
  const { hasPermission } = useAuth();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const allowed = permissions.some((p) => hasPermission(p));

  if (!allowed) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Keine Berechtigung</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Du hast keinen Zugriff auf diesen Bereich. Bitte wende dich an einen Administrator, falls du hier
          Zugriff brauchst.
        </p>
      </div>
    );
  }

  return children;
}
