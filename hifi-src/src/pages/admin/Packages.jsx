import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import IconPicker from '../../components/IconPicker.jsx';
import DynamicIcon from '../../components/DynamicIcon.jsx';
import { PACKAGE_TIERS, tierSortOrder } from '../../constants/packageTiers.js';

const inputCls =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900';

const formFromPkg = (pkg) => ({
  description: pkg.description || '',
  markup_type: pkg.markup_type || 'none',
  markup_value: pkg.markup_value || 0,
  icon_name: pkg.icon_name || '',
  tagline: pkg.tagline || '',
  price_text: pkg.price_text || '',
  is_featured: !!pkg.is_featured,
  sort_order: pkg.sort_order ?? 0,
});

const emptyRowForm = (tierIndex) => ({
  description: '',
  markup_type: 'none',
  markup_value: 0,
  icon_name: '',
  tagline: '',
  price_text: '',
  is_featured: false,
  sort_order: tierSortOrder(tierIndex),
});

const FORM_FIELDS = ['description', 'markup_type', 'markup_value', 'icon_name', 'tagline', 'price_text', 'is_featured', 'sort_order'];

// Eine Zeile gilt als "zu speichern", wenn sie neu angehakt ist oder sich
// gegenueber dem geladenen Stand (existing) etwas geaendert hat.
const isRowDirty = (row) => {
  if (!row.existing) return row.checked;
  const base = formFromPkg(row.existing);
  return FORM_FIELDS.some((f) =>
    f === 'is_featured' ? !!base[f] !== !!row.form[f] : String(base[f]) !== String(row.form[f])
  );
};

// Baut die Editor-Zeilen fuer ein Modell: die 8 Standard-Stufen in
// Leiter-Reihenfolge (bestehende Pakete case-insensitiv per Name zugeordnet,
// jedes hoechstens einmal), dahinter alle uebrigen Pakete mit Alt-Namen.
const buildRows = (modelId, packages) => {
  const modelPkgs = packages
    .filter((p) => p.car_model_id === modelId)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const used = new Set();
  const tierRows = PACKAGE_TIERS.map((tier, i) => {
    const match = modelPkgs.find((p) => !used.has(p.id) && p.name.trim().toLowerCase() === tier.toLowerCase());
    if (match) used.add(match.id);
    return {
      key: `tier-${i}`,
      tierName: tier,
      existing: match || null,
      checked: !!match,
      form: match ? formFromPkg(match) : emptyRowForm(i),
    };
  });
  const legacyRows = modelPkgs
    .filter((p) => !used.has(p.id))
    .map((p) => ({ key: `legacy-${p.id}`, tierName: null, existing: p, checked: true, form: formFromPkg(p) }));
  return [...tierRows, ...legacyRows];
};

// Beschreibungs-Textarea waechst beim Tippen mit dem Inhalt mit.
const autoGrow = (e) => {
  e.target.style.height = 'auto';
  e.target.style.height = `${e.target.scrollHeight}px`;
};

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [models, setModels] = useState([]);
  const [brandSel, setBrandSel] = useState('');
  const [modelSel, setModelSel] = useState('');
  const [rows, setRows] = useState([]);
  const [rowErrors, setRowErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [globalMsg, setGlobalMsg] = useState(null); // { kind: 'ok' | 'error', text }
  const [copySource, setCopySource] = useState('');
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyResult, setCopyResult] = useState(null); // { text } | { error }
  const [brandFilter, setBrandFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');

  const load = async () => {
    const [pkgs, mdls] = await Promise.all([api.get('/packages'), api.get('/models')]);
    setPackages(pkgs);
    setModels(mdls);
    return pkgs;
  };

  useEffect(() => {
    load();
  }, []);

  const modelById = useMemo(() => new Map(models.map((m) => [m.id, m])), [models]);

  const brandOptions = useMemo(() => {
    const seen = new Map();
    models.forEach((m) => {
      if (!seen.has(m.brand_id)) seen.set(m.brand_id, m.brand_name);
    });
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [models]);

  const pickerModelOptions = useMemo(
    () =>
      models
        .filter((m) => !brandSel || String(m.brand_id) === brandSel)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [models, brandSel]
  );

  const activeModel = modelSel ? modelById.get(Number(modelSel)) : null;

  const isDirty = useMemo(() => rows.some(isRowDirty), [rows]);

  const confirmDiscard = () => !isDirty || confirm('Ungespeicherte Änderungen verwerfen?');

  const openModel = (brandId, modelId, pkgs = packages) => {
    setBrandSel(String(brandId));
    setModelSel(String(modelId));
    setRows(buildRows(Number(modelId), pkgs));
    setRowErrors({});
    setGlobalMsg(null);
    setCopySource('');
    setCopyResult(null);
  };

  const handleBrandSelect = (value) => {
    if (!confirmDiscard()) return;
    setBrandSel(value);
    setModelSel('');
    setRows([]);
    setRowErrors({});
    setGlobalMsg(null);
    setCopyResult(null);
  };

  const handleModelSelect = (value) => {
    if (!confirmDiscard()) return;
    if (!value) {
      setModelSel('');
      setRows([]);
      return;
    }
    const model = modelById.get(Number(value));
    openModel(model ? model.brand_id : brandSel, value);
  };

  const toggleRow = (key, checked) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, checked } : r)));

  const updateRowForm = (key, patch) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, form: { ...r.form, ...patch } } : r)));

  const rowPayload = (row) => ({
    name: row.tierName ?? row.existing.name,
    car_model_id: Number(modelSel),
    ...row.form,
    markup_value: Number(row.form.markup_value),
    sort_order: Number(row.form.sort_order),
  });

  const handleSaveAll = async () => {
    setSaving(true);
    setGlobalMsg(null);
    const errors = {};
    const preSaveRows = rows;
    let created = 0;
    let updated = 0;

    // Bewusst sequentiell: max. ~8 Requests, die PHP-Session serialisiert ohnehin,
    // und Fehler lassen sich so eindeutig einer Zeile zuordnen.
    for (const row of rows) {
      try {
        if (row.existing) {
          if (isRowDirty(row)) {
            await api.put(`/packages/${row.existing.id}`, rowPayload(row));
            updated += 1;
          }
        } else if (row.checked) {
          await api.post('/packages', rowPayload(row));
          created += 1;
        }
      } catch (err) {
        errors[row.key] = err.message;
      }
    }

    const pkgs = await load();
    // Fehlgeschlagene Zeilen behalten ihre Eingaben, damit nichts verloren geht.
    const rebuilt = buildRows(Number(modelSel), pkgs).map((r) => {
      if (!errors[r.key]) return r;
      const old = preSaveRows.find((p) => p.key === r.key);
      return old ? { ...r, checked: old.checked, form: old.form } : r;
    });
    setRows(rebuilt);
    setRowErrors(errors);

    const failed = Object.keys(errors).length;
    const parts = [];
    if (created) parts.push(`${created} neu angelegt`);
    if (updated) parts.push(`${updated} aktualisiert`);
    if (!parts.length && !failed) parts.push('Keine Änderungen');
    setGlobalMsg(
      failed
        ? { kind: 'error', text: `${parts.join(', ') || 'Nichts gespeichert'} – ${failed} Paket(e) fehlgeschlagen (Details an der Zeile).` }
        : { kind: 'ok', text: `${parts.join(', ')}.` }
    );
    setSaving(false);
  };

  const handleDeleteRow = async (row) => {
    if (!confirm(`Paket "${row.tierName ?? row.existing.name}" inkl. aller Produkte wirklich löschen?`)) return;
    await api.delete(`/packages/${row.existing.id}`);
    const pkgs = await load();
    setRows(buildRows(Number(modelSel), pkgs));
    setGlobalMsg(null);
  };

  const handleDeleteFromTable = async (pkg) => {
    if (!confirm('Paket inkl. aller Produkte wirklich löschen?')) return;
    await api.delete(`/packages/${pkg.id}`);
    const pkgs = await load();
    if (modelSel) setRows(buildRows(Number(modelSel), pkgs));
  };

  const handleCopy = async () => {
    if (!copySource || !confirmDiscard()) return;
    const src = modelById.get(Number(copySource));
    const tgt = modelById.get(Number(modelSel));
    if (
      !confirm(
        `Alle Pakete von "${src.brand_name} ${src.name}" inkl. verknüpfter Produkte nach "${tgt.brand_name} ${tgt.name}" kopieren?\n\nBereits vorhandene Paketstufen werden übersprungen. Upgrades werden nicht mitkopiert.`
      )
    ) {
      return;
    }
    setCopyBusy(true);
    setCopyResult(null);
    try {
      const res = await api.post(`/models/${modelSel}/copy-packages`, { source_model_id: Number(copySource) });
      const productCount = res.copied.reduce((sum, c) => sum + c.products, 0);
      const parts = [`${res.copied.length} Paket(e) kopiert (${productCount} Produkte)`];
      if (res.skipped.length) parts.push(`übersprungen: ${res.skipped.join(', ')}`);
      setCopyResult({ text: `${parts.join(' – ')}.` });
      const pkgs = await load();
      setRows(buildRows(Number(modelSel), pkgs));
      setRowErrors({});
    } catch (err) {
      setCopyResult({ error: err.message });
    }
    setCopyBusy(false);
  };

  // Zusammenfassung fuer die Speichern-Leiste
  const createCount = rows.filter((r) => !r.existing && r.checked).length;
  const updateCount = rows.filter((r) => r.existing && isRowDirty(r)).length;

  // ---- Uebersichtstabelle (bestehende Ansicht, bleibt als Nachschlagewerk) ----
  const filterModelOptions = useMemo(
    () =>
      models
        .filter((m) => brandFilter === 'all' || String(m.brand_id) === brandFilter)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [models, brandFilter]
  );

  const filteredPackages = useMemo(
    () =>
      packages.filter((pkg) => {
        const model = modelById.get(pkg.car_model_id);
        if (brandFilter !== 'all' && String(model?.brand_id) !== brandFilter) return false;
        if (modelFilter !== 'all' && String(pkg.car_model_id) !== modelFilter) return false;
        return true;
      }),
    [packages, modelById, brandFilter, modelFilter]
  );

  const overviewTable = (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Filtern:</label>
        <select
          value={brandFilter}
          onChange={(e) => {
            setBrandFilter(e.target.value);
            setModelFilter('all');
          }}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="all">Alle Marken</option>
          {brandOptions.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
        </select>
        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="all">Alle Modelle</option>
          {filterModelOptions.map((m) => <option key={m.id} value={String(m.id)}>{m.brand_name} {m.name}</option>)}
        </select>
        {(brandFilter !== 'all' || modelFilter !== 'all') && (
          <button
            onClick={() => {
              setBrandFilter('all');
              setModelFilter('all');
            }}
            className="text-sm text-brand-600 hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
        <span className="text-sm text-neutral-400">{filteredPackages.length} von {packages.length}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-2">Marke / Modell</th>
              <th className="px-4 py-2">Paket</th>
              <th className="px-4 py-2">Aufschlag</th>
              <th className="px-4 py-2 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredPackages.map((pkg) => (
              <tr key={pkg.id} className="bg-white dark:bg-neutral-950">
                <td className="px-4 py-2">{pkg.brand_name} {pkg.model_name}</td>
                <td className="px-4 py-2 font-medium text-neutral-800 dark:text-neutral-100">
                  <span className="inline-flex items-center gap-1.5">
                    {pkg.icon_name && <DynamicIcon name={pkg.icon_name} className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                    {pkg.name}
                    {pkg.is_featured && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                        Empfohlen
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                  {pkg.markup_type === 'fixed' && `+${pkg.markup_value} €`}
                  {pkg.markup_type === 'percent' && `+${pkg.markup_value} %`}
                  {(!pkg.markup_type || pkg.markup_type === 'none') && '–'}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link to={`/admin/packages/${pkg.id}/products`} className="mr-3 text-brand-600 hover:underline">Produkte</Link>
                  <Link to={`/admin/packages/${pkg.id}/upgrades`} className="mr-3 text-brand-600 hover:underline">Upgrades</Link>
                  <button
                    onClick={() => {
                      if (!confirmDiscard()) return;
                      const model = modelById.get(pkg.car_model_id);
                      openModel(model.brand_id, pkg.car_model_id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="mr-3 text-brand-600 hover:underline"
                  >
                    Bearbeiten
                  </button>
                  <button onClick={() => handleDeleteFromTable(pkg)} className="text-red-600 hover:underline">Löschen</button>
                </td>
              </tr>
            ))}
            {filteredPackages.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                {packages.length === 0 ? 'Noch keine Pakete angelegt.' : 'Keine Pakete für diesen Filter.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Pakete</h1>

      {/* Modell-Auswahl: der Batch-Editor arbeitet immer auf genau einem Modell. */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 font-bold text-neutral-900 dark:text-white">Modell wählen</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={brandSel}
            onChange={(e) => handleBrandSelect(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Marke wählen…</option>
            {brandOptions.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
          </select>
          <select
            value={modelSel}
            onChange={(e) => handleModelSelect(e.target.value)}
            className="min-w-[220px] rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Modell wählen…</option>
            {pickerModelOptions.map((m) => <option key={m.id} value={String(m.id)}>{m.brand_name} {m.name}</option>)}
          </select>
        </div>
        {!modelSel && (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Modell auswählen, um dessen Pakete anzulegen oder zu bearbeiten – die Standard-Paketstufen stehen dann als Checkliste bereit.
          </p>
        )}
      </div>

      {/* Batch-Editor */}
      {activeModel && (
        <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2 className="font-bold text-neutral-900 dark:text-white">
              Pakete für {activeModel.brand_name} {activeModel.name}
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Paketstufen anhaken, Beschreibung und Aufschlag ausfüllen, unten alles auf einmal speichern.
            </p>

            {/* Kopieren von anderem Modell */}
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Pakete von anderem Modell kopieren:</span>
              <select
                value={copySource}
                onChange={(e) => setCopySource(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">Quellmodell wählen…</option>
                {models
                  .filter((m) => String(m.id) !== modelSel)
                  .sort((a, b) => `${a.brand_name} ${a.name}`.localeCompare(`${b.brand_name} ${b.name}`))
                  .map((m) => <option key={m.id} value={String(m.id)}>{m.brand_name} {m.name}</option>)}
              </select>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!copySource || copyBusy}
                className="rounded-md border border-brand-500 px-3 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 disabled:opacity-50 dark:hover:bg-brand-900/20"
              >
                {copyBusy ? 'Kopiert…' : 'Kopieren'}
              </button>
              <span className="text-xs text-neutral-400">inkl. Produkte, ohne Upgrades</span>
              {copyResult && (
                <span className={`w-full text-sm ${copyResult.error ? 'text-red-600' : 'text-brand-600 dark:text-brand-400'}`}>
                  {copyResult.error || copyResult.text}
                </span>
              )}
            </div>
          </div>

          {/* Paket-Zeilen */}
          <div>
            {rows.map((row, idx) => (
              <div key={row.key}>
                {row.tierName === null && idx > 0 && rows[idx - 1].tierName !== null && (
                  <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
                    Weitere Pakete (alte Namen)
                  </div>
                )}
                <div className={`border-t border-neutral-100 dark:border-neutral-800 ${row.checked ? '' : 'opacity-70'}`}>
                  <div className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        disabled={!!row.existing || saving}
                        onChange={(e) => toggleRow(row.key, e.target.checked)}
                        className="h-5 w-5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 disabled:opacity-60"
                      />
                      <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                        {row.form.icon_name && <DynamicIcon name={row.form.icon_name} className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                        {row.tierName ?? row.existing.name}
                      </span>
                    </label>
                    {row.tierName === null && <span className="text-xs text-neutral-400">(alter Name)</span>}
                    {row.existing ? (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        Vorhanden
                      </span>
                    ) : (
                      row.checked && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                          Neu
                        </span>
                      )
                    )}
                    {row.form.is_featured && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                        Empfohlen
                      </span>
                    )}
                    {row.existing && (
                      <span className="ml-auto flex items-center gap-3 text-sm">
                        <Link to={`/admin/packages/${row.existing.id}/products`} className="text-brand-600 hover:underline">Produkte</Link>
                        <Link to={`/admin/packages/${row.existing.id}/upgrades`} className="text-brand-600 hover:underline">Upgrades</Link>
                        <button type="button" onClick={() => handleDeleteRow(row)} className="text-red-600 hover:underline">Löschen</button>
                      </span>
                    )}
                  </div>

                  {row.checked && (
                    <div className="space-y-4 px-5 pb-5 sm:pl-[52px]">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Beschreibung</label>
                        <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">
                          Jede Zeile erscheint als eigener Stichpunkt zusammen mit den Bauteilen.
                        </p>
                        <textarea
                          rows={10}
                          value={row.form.description}
                          onChange={(e) => updateRowForm(row.key, { description: e.target.value })}
                          onInput={autoGrow}
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Aufschlag</label>
                        <div className="flex max-w-md gap-2">
                          <select
                            value={row.form.markup_type}
                            onChange={(e) => updateRowForm(row.key, { markup_type: e.target.value })}
                            className="w-40 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                          >
                            <option value="none">Kein Aufschlag</option>
                            <option value="fixed">Fester Betrag (€)</option>
                            <option value="percent">Prozent (%)</option>
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            disabled={row.form.markup_type === 'none'}
                            value={row.form.markup_value}
                            onChange={(e) => updateRowForm(row.key, { markup_value: e.target.value })}
                            className={`${inputCls} disabled:opacity-50`}
                          />
                        </div>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          Wird auf die Summe der Bauteilpreise aufgeschlagen und ergibt den Gesamtpreis für den Kunden.
                        </p>
                      </div>

                      <details className="rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                          Weitere Optionen (Icon, Slogan, Preis-Text, Sortierung)
                        </summary>
                        <div className="space-y-4 border-t border-neutral-200 p-3 dark:border-neutral-800">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Icon (optional)</label>
                            <IconPicker value={row.form.icon_name} onChange={(name) => updateRowForm(row.key, { icon_name: name })} />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Kurzer Slogan (optional)</label>
                            <input
                              value={row.form.tagline}
                              onChange={(e) => updateRowForm(row.key, { tagline: e.target.value })}
                              placeholder="z. B. Perfekt für den Einstieg"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Preis-Text (optional)</label>
                            <input
                              value={row.form.price_text}
                              onChange={(e) => updateRowForm(row.key, { price_text: e.target.value })}
                              placeholder='z. B. "Coming soon" oder "Preis auf Anfrage"'
                              className={inputCls}
                            />
                            <p className="mt-1 text-xs text-neutral-400">Ersetzt auf der Kachel den berechneten Preis, solange ausgefüllt.</p>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                            <input
                              type="checkbox"
                              checked={row.form.is_featured}
                              onChange={(e) => updateRowForm(row.key, { is_featured: e.target.checked })}
                              className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                            />
                            Als empfohlen hervorheben
                          </label>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Sortierung</label>
                            <input
                              type="number"
                              value={row.form.sort_order}
                              onChange={(e) => updateRowForm(row.key, { sort_order: e.target.value })}
                              className={`${inputCls} max-w-[160px]`}
                            />
                          </div>
                        </div>
                      </details>

                      {rowErrors[row.key] && <p className="text-sm text-red-600">{rowErrors[row.key]}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Speichern-Leiste */}
          <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-b-xl border-t border-neutral-200 bg-white px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving || !isDirty}
              className="rounded-md bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'Speichert…' : 'Alle speichern'}
            </button>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {createCount} neu, {updateCount} geändert
            </span>
            {globalMsg && (
              <span className={`text-sm ${globalMsg.kind === 'error' ? 'text-red-600' : 'text-brand-600 dark:text-brand-400'}`}>
                {globalMsg.text}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Uebersicht aller Pakete: prominent ohne Modellauswahl, sonst eingeklappt. */}
      {activeModel ? (
        <details className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <summary className="cursor-pointer select-none px-5 py-3 font-bold text-neutral-900 dark:text-white">
            Alle Pakete (Übersicht)
          </summary>
          <div className="border-t border-neutral-200 p-5 dark:border-neutral-800">{overviewTable}</div>
        </details>
      ) : (
        overviewTable
      )}
    </div>
  );
}
