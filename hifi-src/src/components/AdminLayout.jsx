import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import ThemeToggle from './ThemeToggle.jsx';
import logo from '../assets/logo.png';

const ICONS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9',
  tag: 'M4 4h7l9 9-7 7-9-9V4Zm3.5 3.5h.01',
  car: 'M3 13.5 4.5 9A2 2 0 0 1 6.4 7.5h11.2A2 2 0 0 1 19.5 9L21 13.5M3 13.5v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4M3 13.5h18M6.5 16.5h.01M17.5 16.5h.01',
  box: 'M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9M12 12 4 7.5',
  mail: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 0 8 7 8-7',
  users: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-4 6c-4 0-7 2-7 4.5V19h14v-1.5C19 15 16 13 12 13Z',
  shield: 'M12 3 4 6v6c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V6l-8-3Zm-1.5 9.5 4-4 1 1-5 5-2.5-2.5 1-1 1.5 1.5Z',
  lock: 'M6 10V8a6 6 0 1 1 12 0v2m-13 0h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Zm7 5v2',
  briefcase: 'M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm4 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18',
  sliders: 'M4 6h16M4 6a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm16 6H4m10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM4 18h16m-12 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z',
};

const Icon = ({ path }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export default function AdminLayout() {
  const { logout, user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newContactCount, setNewContactCount] = useState(0);

  useEffect(() => {
    if (!hasPermission('contact.manage')) return;
    api.get('/contact').then((rows) => setNewContactCount(rows.filter((r) => r.status === 'new').length)).catch(() => {});
  }, []);

  const navGroups = [
    {
      title: null,
      links: [
        { to: '/admin', label: 'Dashboard', icon: 'home', end: true },
        { to: '/admin/account', label: 'Mein Konto', icon: 'lock' },
      ],
    },
    {
      title: 'Fahrzeug-Katalog',
      links: [
        { to: '/admin/brands', label: 'Marken', icon: 'tag', permission: 'brands.manage' },
        { to: '/admin/models', label: 'Modelle', icon: 'car', permission: 'models.manage' },
        { to: '/admin/packages', label: 'Pakete', icon: 'box', permission: 'packages.manage' },
      ],
    },
    {
      title: 'Website',
      links: [
        { to: '/admin/services', label: 'Leistungen', icon: 'briefcase', permission: 'services.manage' },
      ],
    },
    {
      title: 'Kunden',
      links: [
        { to: '/admin/contact-requests', label: 'Kontaktanfragen', icon: 'mail', permission: 'contact.manage', badge: newContactCount },
      ],
    },
    {
      title: 'Verwaltung',
      links: [
        { to: '/admin/users', label: 'Benutzer', icon: 'users', permission: 'users.manage' },
        { to: '/admin/permission-groups', label: 'Berechtigungsgruppen', icon: 'shield', permission: 'permission_groups.manage' },
        { to: '/admin/settings', label: 'Einstellungen', icon: 'sliders', permission: 'settings.manage' },
      ],
    },
  ]
    .map((group) => ({ ...group, links: group.links.filter((l) => !l.permission || hasPermission(l.permission)) }))
    .filter((group) => group.links.length > 0);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-500 text-white'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;

  const NavLinks = ({ onNavigate }) => (
    <nav className="space-y-5">
      {navGroups.map((group, i) => (
        <div key={i}>
          {group.title && (
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {group.title}
            </p>
          )}
          <div className="space-y-1">
            {group.links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass} onClick={onNavigate}>
                <span className="flex items-center gap-2.5">
                  <Icon path={ICONS[link.icon]} />
                  {link.label}
                </span>
                {!!link.badge && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{link.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 p-4 dark:border-slate-800 sm:block">
        <div className="mb-6 flex items-center gap-2 px-3">
          <span className="rounded-lg px-2 py-1 dark:bg-white">
            <img src={logo} alt="HifiPlanet" className="h-7 w-auto" />
          </span>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Admin</span>
        </div>
        <NavLinks />
      </aside>

      <div className="flex-1">
        <header className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 sm:hidden">
              <button
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Menü öffnen"
                className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="rounded-lg px-1.5 py-0.5 dark:bg-white">
                <img src={logo} alt="HifiPlanet" className="h-6 w-auto" />
              </span>
            </div>
            <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
              Angemeldet als {user?.username}{user?.is_super_admin ? ' · Super-Admin' : ''}
            </p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Abmelden
              </button>
            </div>
          </div>
          {mobileOpen && (
            <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:hidden">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
          )}
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
