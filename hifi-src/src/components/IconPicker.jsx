import { useMemo, useState } from 'react';
import { iconNames } from 'lucide-react/dynamic';
import DynamicIcon from './DynamicIcon.jsx';

const ALL_ICON_NAMES = [...iconNames].sort();

const DEFAULT_LIMIT = 120;
const SEARCH_LIMIT = 200;

export default function IconPicker({ value, onChange }) {
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_ICON_NAMES.slice(0, DEFAULT_LIMIT);
    return ALL_ICON_NAMES.filter((name) => name.includes(q)).slice(0, SEARCH_LIMIT);
  }, [search]);

  return (
    <div>
      <div className="mb-2 flex items-center gap-3 rounded-md border border-slate-300 p-2 dark:border-slate-700">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
          {value ? <DynamicIcon name={value} className="h-6 w-6" /> : <span className="text-xs text-slate-400">?</span>}
        </div>
        <div className="text-sm">
          <p className="font-medium text-slate-800 dark:text-slate-100">{value || 'Kein Icon gewählt'}</p>
          <p className="text-xs text-slate-400">{ALL_ICON_NAMES.length} Icons verfügbar</p>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Icon suchen (z. B. car, shield, zap)…"
        className="mb-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />

      <div className="grid max-h-64 grid-cols-6 gap-1 overflow-y-auto rounded-md border border-slate-200 p-2 sm:grid-cols-8 dark:border-slate-700">
        {results.map((name) => (
          <button
            type="button"
            key={name}
            title={name}
            onClick={() => onChange(name)}
            className={`flex h-10 w-10 items-center justify-center rounded-md transition ${
              value === name
                ? 'bg-brand-500 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <DynamicIcon name={name} className="h-5 w-5" />
          </button>
        ))}
        {results.length === 0 && (
          <p className="col-span-full py-4 text-center text-sm text-slate-400">Keine Icons gefunden.</p>
        )}
      </div>
      {!search && (
        <p className="mt-1 text-xs text-slate-400">Tipp: Tippe einen Suchbegriff ein, um alle {ALL_ICON_NAMES.length} Icons zu durchsuchen.</p>
      )}
    </div>
  );
}
