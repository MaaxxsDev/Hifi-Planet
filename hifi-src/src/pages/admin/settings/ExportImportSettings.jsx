import { useState } from 'react';
import { api, API_BASE } from '../../../api/client.js';

// Gruppierung muss zur Backend-Konstante SettingsController::IMPORT_SECTIONS passen.
// Tabellen innerhalb einer Gruppe haengen per Fremdschluessel voneinander ab, darum
// werden sie beim Import immer zusammen ersetzt (nie einzeln).
const SECTIONS = [
  {
    key: 'catalog',
    label: 'Fahrzeug-Katalog',
    hint: 'Marken, Modelle, Pakete, Produkte, Upgrades',
    tables: ['brands', 'car_models', 'packages', 'package_products', 'package_upgrades'],
  },
  { key: 'services', label: 'Leistungen', hint: 'Die Leistungen-Übersicht', tables: ['services'] },
  { key: 'faqs', label: 'FAQs', hint: 'Häufig gestellte Fragen', tables: ['faqs'] },
  {
    key: 'gallery',
    label: 'Bildergalerie',
    hint: 'Galerie-Marken, Projekte und Fotos (inkl. Bilder)',
    tables: ['gallery_brands', 'gallery_projects', 'gallery_photos'],
  },
];

const TABLE_LABELS = {
  brands: 'Marken',
  car_models: 'Modelle',
  packages: 'Pakete',
  package_products: 'Produkte',
  package_upgrades: 'Upgrades',
  services: 'Leistungen',
  faqs: 'FAQs',
  gallery_brands: 'Galerie-Marken',
  gallery_projects: 'Galerie-Projekte',
  gallery_photos: 'Galerie-Fotos',
};

// Kurze, lesbare Zusammenfassung ("3 Marken, 12 Modelle, 45 Pakete") aus den im Export
// enthaltenen Zeilen einer Sektion - reine Vorschau, keine Validierung.
const summarize = (parsedData, tables) => {
  if (!parsedData) return null;
  const parts = tables
    .map((t) => [t, Array.isArray(parsedData[t]) ? parsedData[t].length : 0])
    .filter(([, count]) => count > 0)
    .map(([t, count]) => `${count} ${TABLE_LABELS[t] || t}`);
  return parts.length ? parts.join(', ') : 'leer in dieser Datei';
};

export default function ExportImportSettings() {
  const [importFile, setImportFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState('');
  const [selectedSections, setSelectedSections] = useState(() => new Set(SECTIONS.map((s) => s.key)));
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setImportFile(file);
    setImportResult(null);
    setImportError('');
    setParsedData(null);
    setParseError('');
    setSelectedSections(new Set(SECTIONS.map((s) => s.key)));
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed.data !== 'object') throw new Error('kein gültiges Export-Format');
      setParsedData(parsed.data);
    } catch {
      // Vorschau ist nur ein Komfort-Feature - schlaegt sie fehl, importiert der
      // Server trotzdem ganz normal alle Bereiche; die eigentliche Validierung
      // passiert ohnehin serverseitig.
      setParseError('Datei konnte nicht gelesen werden – Vorschau der Inhalte nicht möglich. Import würde trotzdem versucht (alle Bereiche).');
    }
  };

  const toggleSection = (key) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile || !importConfirmed || selectedSections.size === 0) return;
    setImportBusy(true);
    setImportError('');
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('sections', JSON.stringify([...selectedSections]));
      const result = await api.post('/settings/import', formData);
      setImportResult(result);
      setImportFile(null);
      setParsedData(null);
      setImportConfirmed(false);
      e.target.reset();
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportBusy(false);
    }
  };

  const selectedLabels = SECTIONS.filter((s) => selectedSections.has(s.key)).map((s) => s.label);

  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Daten exportieren</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Lädt eine Datei mit allen Marken, Modellen, Paketen, Produkten, Upgrades, Leistungen, FAQs und der
          kompletten Bildergalerie (inkl. Bilder) herunter. Benutzerkonten und Kontaktanfragen sind bewusst
          <strong> nicht</strong> enthalten.
        </p>
        <a
          href={`${API_BASE}/settings/export`}
          className="inline-block rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Jetzt exportieren
        </a>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Daten importieren</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Lädt eine zuvor exportierte Datei auf diesen Server. Ersetzt dabei die ausgewählten Bereiche komplett
          durch den Inhalt der Datei – das kann nicht rückgängig gemacht werden. Kontaktanfragen und
          Benutzerkonten bleiben immer unangetastet.
        </p>
        <form onSubmit={handleImport} className="space-y-4">
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="text-sm"
          />

          {importFile && (
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="border-b border-neutral-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                Was soll importiert werden?
              </div>
              {parseError && <p className="px-4 pt-3 text-sm text-amber-600 dark:text-amber-400">{parseError}</p>}
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {SECTIONS.map((section) => (
                  <label
                    key={section.key}
                    className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSections.has(section.key)}
                      onChange={() => toggleSection(section.key)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">
                        {section.label}
                      </span>
                      <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                        {parsedData ? summarize(parsedData, section.tables) : section.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={importConfirmed}
              onChange={(e) => setImportConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            Mir ist bewusst, dass dies{' '}
            {selectedLabels.length ? <strong>{selectedLabels.join(', ')}</strong> : 'die ausgewählten Bereiche'} auf
            diesem Server unwiderruflich ersetzt.
          </label>
          <button
            type="submit"
            disabled={!importFile || !importConfirmed || importBusy || selectedSections.size === 0}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {importBusy ? 'Importiere…' : 'Importieren'}
          </button>
        </form>
        {importError && <p className="mt-3 text-sm text-red-600">{importError}</p>}
        {importResult && (
          <div className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <p className="mb-1 font-semibold">Import erfolgreich:</p>
            <ul className="list-disc pl-5">
              {Object.entries(importResult.counts).map(([table, count]) => (
                <li key={table}>
                  {count} {TABLE_LABELS[table] || table}
                </li>
              ))}
              {importResult.images_restored > 0 && <li>{importResult.images_restored} Bilder wiederhergestellt</li>}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
