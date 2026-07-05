import { useState } from 'react';
import { api } from '../../../api/client.js';

export default function ExportImportSettings() {
  const [importFile, setImportFile] = useState(null);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile || !importConfirmed) return;
    setImportBusy(true);
    setImportError('');
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const result = await api.post('/settings/import', formData);
      setImportResult(result);
      setImportFile(null);
      setImportConfirmed(false);
      e.target.reset();
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 font-semibold text-slate-900 dark:text-white">Daten exportieren</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Lädt eine Datei mit allen Marken, Modellen, Paketen, Produkten, Upgrades und Leistungen (inkl. Bilder)
          herunter. Benutzerkonten und Kontaktanfragen sind bewusst <strong>nicht</strong> enthalten.
        </p>
        <a
          href="/hifi/api/settings/export"
          className="inline-block rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Jetzt exportieren
        </a>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 font-semibold text-slate-900 dark:text-white">Daten importieren</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Lädt eine zuvor exportierte Datei auf diesen Server. <strong>Ersetzt dabei alle</strong> aktuellen
          Marken, Modelle, Pakete, Produkte, Upgrades und Leistungen auf diesem Server – das kann nicht
          rückgängig gemacht werden. Kontaktanfragen und Benutzerkonten bleiben unangetastet.
        </p>
        <form onSubmit={handleImport} className="space-y-3">
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={importConfirmed}
              onChange={(e) => setImportConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Mir ist bewusst, dass dies alle aktuellen Marken, Modelle, Pakete, Produkte, Upgrades und
            Leistungen auf diesem Server unwiderruflich ersetzt.
          </label>
          <button
            type="submit"
            disabled={!importFile || !importConfirmed || importBusy}
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
              <li>{importResult.counts.brands} Marken</li>
              <li>{importResult.counts.car_models} Modelle</li>
              <li>{importResult.counts.packages} Pakete</li>
              <li>{importResult.counts.package_products} Produkte</li>
              <li>{importResult.counts.package_upgrades} Upgrades</li>
              <li>{importResult.counts.services} Leistungen</li>
              <li>{importResult.images_restored} Bilder wiederhergestellt</li>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
