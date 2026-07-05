import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/admin/settings/database', label: 'Datenbank' },
  { to: '/admin/settings/export-import', label: 'Export & Import' },
  { to: '/admin/settings/maintenance', label: 'Wartungsmodus' },
  { to: '/admin/settings/reset', label: 'Zurücksetzen' },
];

export default function SettingsLayout() {
  const tabClass = ({ isActive }) =>
    `rounded-md px-4 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-500 text-white'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Einstellungen</h1>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        Werkzeuge rund um Datenbank, Server-Umzug und Zurücksetzen dieser Seite.
      </p>
      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={tabClass}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
