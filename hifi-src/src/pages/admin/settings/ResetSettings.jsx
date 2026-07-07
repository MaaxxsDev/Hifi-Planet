import { useState } from 'react';
import { api } from '../../../api/client.js';

export default function ResetSettings() {
  const [servicesBusy, setServicesBusy] = useState(false);
  const [servicesMessage, setServicesMessage] = useState('');

  const [faqsBusy, setFaqsBusy] = useState(false);
  const [faqsMessage, setFaqsMessage] = useState('');

  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState('');

  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState('');

  const [allBusy, setAllBusy] = useState(false);
  const [allMessage, setAllMessage] = useState('');

  const handleResetServices = async () => {
    if (!confirm('Alle aktuellen Leistungen werden gelöscht und durch die 8 Standard-Leistungen ersetzt. Fortfahren?')) return;
    setServicesBusy(true);
    setServicesMessage('');
    try {
      const result = await api.post('/settings/reset-services', {});
      setServicesMessage(`${result.count} Standard-Leistungen wiederhergestellt.`);
    } catch (err) {
      setServicesMessage('Fehler: ' + err.message);
    } finally {
      setServicesBusy(false);
    }
  };

  const handleResetFaqs = async () => {
    if (!confirm('Alle aktuellen FAQ-Einträge werden gelöscht und durch die 6 Standard-Fragen ersetzt. Fortfahren?')) return;
    setFaqsBusy(true);
    setFaqsMessage('');
    try {
      const result = await api.post('/settings/reset-faqs', {});
      setFaqsMessage(`${result.count} Standard-Fragen wiederhergestellt.`);
    } catch (err) {
      setFaqsMessage('Fehler: ' + err.message);
    } finally {
      setFaqsBusy(false);
    }
  };

  const handleResetGallery = async () => {
    if (!confirm('Die komplette Bildergalerie wird gelöscht und durch die 13 Marken/29 Projekte/207 Fotos der alten hifi-planet.de-Seite ersetzt. Fortfahren?')) return;
    setGalleryBusy(true);
    setGalleryMessage('');
    try {
      const result = await api.post('/settings/reset-gallery', {});
      setGalleryMessage(`${result.photos} Fotos wiederhergestellt.`);
    } catch (err) {
      setGalleryMessage('Fehler: ' + err.message);
    } finally {
      setGalleryBusy(false);
    }
  };

  const handleResetCatalog = async () => {
    if (!confirm('Alle Marken, Modelle, Pakete, Produkte und Upgrades werden unwiderruflich gelöscht. Leistungen und Kontaktanfragen bleiben erhalten. Fortfahren?')) return;
    setCatalogBusy(true);
    setCatalogMessage('');
    try {
      const result = await api.post('/settings/reset-catalog', {});
      setCatalogMessage(`Fahrzeugkatalog geleert (${result.brands_removed} Marken entfernt).`);
    } catch (err) {
      setCatalogMessage('Fehler: ' + err.message);
    } finally {
      setCatalogBusy(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm('WIRKLICH ALLES zurücksetzen? Marken, Modelle, Pakete, Produkte und Upgrades werden gelöscht, Leistungen, FAQs und die Bildergalerie auf Standard zurückgesetzt. Kontaktanfragen und Benutzerkonten bleiben erhalten. Das kann nicht rückgängig gemacht werden!')) return;
    setAllBusy(true);
    setAllMessage('');
    try {
      const result = await api.post('/settings/reset-all', {});
      setAllMessage(`Erledigt: ${result.brands_removed} Marken entfernt, ${result.services_reset} Standard-Leistungen, ${result.faqs_reset} Standard-Fragen und ${result.gallery_photos_reset} Galerie-Fotos wiederhergestellt.`);
    } catch (err) {
      setAllMessage('Fehler: ' + err.message);
    } finally {
      setAllBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Nur Leistungen zurücksetzen</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Löscht alle aktuellen Leistungen-Karten und stellt die 8 mitgelieferten Standard-Leistungen wieder her.
          Marken, Modelle und Pakete bleiben unangetastet.
        </p>
        <button
          onClick={handleResetServices}
          disabled={servicesBusy}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-900/20"
        >
          {servicesBusy ? 'Setze zurück…' : 'Leistungen auf Standard zurücksetzen'}
        </button>
        {servicesMessage && <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{servicesMessage}</p>}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Nur FAQs zurücksetzen</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Löscht alle aktuellen Fragen und stellt die 6 mitgelieferten Standard-Fragen (Deutsch &amp; Englisch)
          wieder her. Leistungen, Marken, Modelle und Pakete bleiben unangetastet.
        </p>
        <button
          onClick={handleResetFaqs}
          disabled={faqsBusy}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-900/20"
        >
          {faqsBusy ? 'Setze zurück…' : 'FAQs auf Standard zurücksetzen'}
        </button>
        {faqsMessage && <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{faqsMessage}</p>}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Nur Bildergalerie zurücksetzen</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Löscht alle aktuellen Galerie-Marken, -Projekte und -Fotos und stellt die komplette Galerie der alten
          hifi-planet.de-Seite wieder her (13 Marken, 29 Projekte, 207 Fotos). Fahrzeugkatalog, Leistungen und
          FAQs bleiben unangetastet.
        </p>
        <button
          onClick={handleResetGallery}
          disabled={galleryBusy}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-900/20"
        >
          {galleryBusy ? 'Setze zurück…' : 'Galerie auf Standard zurücksetzen'}
        </button>
        {galleryMessage && <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{galleryMessage}</p>}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-900 dark:text-white">Nur Fahrzeugkatalog leeren</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Löscht alle Marken, Modelle, Pakete, Produkte und Upgrades unwiderruflich. Leistungen, Kontaktanfragen
          und Benutzerkonten bleiben erhalten.
        </p>
        <button
          onClick={handleResetCatalog}
          disabled={catalogBusy}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-900/20"
        >
          {catalogBusy ? 'Leere…' : 'Fahrzeugkatalog leeren'}
        </button>
        {catalogMessage && <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{catalogMessage}</p>}
      </section>

      <section className="rounded-xl border border-red-300 bg-red-50/40 p-6 dark:border-red-900 dark:bg-red-900/10">
        <h2 className="mb-1 font-semibold text-red-700 dark:text-red-300">Alles zurücksetzen</h2>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-300">
          Kombiniert alles: Fahrzeugkatalog wird komplett geleert <strong>und</strong> Leistungen, FAQs sowie die
          Bildergalerie werden auf Standard zurückgesetzt. Kontaktanfragen und Benutzerkonten bleiben erhalten.
          Nicht rückgängig zu machen.
        </p>
        <button
          onClick={handleResetAll}
          disabled={allBusy}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {allBusy ? 'Setze zurück…' : 'Wirklich alles zurücksetzen'}
        </button>
        {allMessage && <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">{allMessage}</p>}
      </section>
    </div>
  );
}
