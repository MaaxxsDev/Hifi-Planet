import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/admin/settings/website', label: 'Website' },
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
        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
    }`;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Einstellungen</h1>
      <p className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
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
