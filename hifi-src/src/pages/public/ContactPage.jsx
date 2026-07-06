import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import ExternalEmbed from '../../components/ExternalEmbed.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';

const formatPrice = (value) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const digitsOnly = (value) => (value || '').replace(/[^\d+]/g, '');

const SHOP_ADDRESS_ENCODED = encodeURIComponent('Boxbrunner Str. 20a, 63916 Amorbach');

export default function ContactPage() {
  const [params] = useSearchParams();
  const { phone, contact_email: contactEmail } = useSiteSettings();
  const [form, setForm] = useState({ name: '', email: '', phone: '', vin: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [upgrades, setUpgrades] = useState([]);
  const [selectedUpgradeIds, setSelectedUpgradeIds] = useState([]);

  const packageId = params.get('packageId');
  const packageTotal = params.get('total') ? Number(params.get('total')) : null;

  useEffect(() => {
    if (!packageId) {
      setUpgrades([]);
      return;
    }
    api.get(`/packages/${packageId}/upgrades`).then(setUpgrades).catch(() => setUpgrades([]));
  }, [packageId]);

  const toggleUpgrade = (id) => {
    setSelectedUpgradeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const upgradesTotal = upgrades
    .filter((u) => selectedUpgradeIds.includes(u.id))
    .reduce((sum, u) => sum + Number(u.price), 0);

  usePageMeta({
    title: 'Kontakt',
    description: 'Kontaktiere HifiPlanet in Amorbach für dein individuelles Car-Hifi Projekt – wir beraten dich gerne unverbindlich.',
    path: '/kontakt',
  });

  const context = {
    brand: params.get('brand') || '',
    model: params.get('model') || '',
    package: params.get('package') || '',
    product: params.get('product') || '',
  };
  const hasContext = context.brand || context.model || context.package || context.product;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setError('');

    try {
      await api.post('/contact', {
        ...form,
        brand_name: context.brand || null,
        model_name: context.model || null,
        package_name: context.package || null,
        product_name: context.product || null,
        package_id: packageId || null,
        package_product_id: params.get('productId') || null,
        upgrade_ids: selectedUpgradeIds,
      });
      setStatus('sent');
    } catch (e) {
      setError(e.message);
      setStatus('idle');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Kontakt aufnehmen</h1>

      <div className="grid gap-10 md:grid-cols-5">
        <div className="md:col-span-3">
          {status === 'sent' ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Danke für deine Anfrage!</h2>
              <p className="text-slate-600 dark:text-slate-300">Wir melden uns so schnell wie möglich bei dir.</p>
            </div>
          ) : (
            <>
              {hasContext && (
                <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 dark:border-brand-900 dark:bg-brand-900/20 dark:text-brand-200">
                  <p className="font-semibold">Deine Anfrage bezieht sich auf:</p>
                  <ul className="mt-1 space-y-0.5">
                    {context.brand && <li>Marke: {context.brand}</li>}
                    {context.model && <li>Modell: {context.model}</li>}
                    {context.package && <li>Paket: {context.package}</li>}
                    {context.product && <li>Produkt: {context.product}</li>}
                  </ul>
                  {packageTotal != null && (
                    <p className="mt-2 font-semibold">
                      Paketpreis: {formatPrice(packageTotal)}
                      {upgradesTotal > 0 && <> + {formatPrice(upgradesTotal)} Upgrades = {formatPrice(packageTotal + upgradesTotal)}</>}
                    </p>
                  )}
                </div>
              )}

              {upgrades.length > 0 && (
                <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Optionale Upgrades</p>
                  <div className="space-y-2">
                    {upgrades.map((u) => (
                      <label key={u.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedUpgradeIds.includes(u.id)}
                          onChange={() => toggleUpgrade(u.id)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="flex-1">
                          <span className="block font-medium text-slate-800 dark:text-slate-100">{u.name}</span>
                          {u.description && <span className="block text-slate-500 dark:text-slate-400">{u.description}</span>}
                        </span>
                        <span className="font-semibold text-brand-600 dark:text-brand-400">+{formatPrice(u.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
                  <input
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">E-Mail *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Telefon</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Fahrgestellnummer (FIN)
                  </label>
                  <input
                    name="vin"
                    value={form.vin}
                    onChange={handleChange}
                    placeholder="Optional – hilft uns bei der genauen Einschätzung deines Fahrzeugs"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nachricht</label>
                  <textarea
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {status === 'sending' ? 'Wird gesendet…' : 'Anfrage senden'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">HifiPlanet Amorbach</h2>
            <dl className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <dt className="font-medium text-slate-800 dark:text-slate-100">Adresse</dt>
                <dd>Boxbrunner Str. 20a, 63916 Amorbach</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800 dark:text-slate-100">Telefon</dt>
                <dd><a href={`tel:${digitsOnly(phone)}`} className="hover:text-brand-500">{phone}</a></dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800 dark:text-slate-100">E-Mail</dt>
                <dd><a href={`mailto:${contactEmail}`} className="hover:text-brand-500">{contactEmail}</a></dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800 dark:text-slate-100">Öffnungszeiten</dt>
                <dd>Mo–Fr: 9:00–18:00 Uhr</dd>
                <dd>Sa: 10:00–13:00 Uhr</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Anfahrt</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <ExternalEmbed name="Die Google-Maps-Karte" className="h-[220px] w-full">
                <iframe
                  title="HifiPlanet Amorbach – Standort"
                  src={`https://www.google.com/maps?q=${SHOP_ADDRESS_ENCODED}&output=embed`}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </ExternalEmbed>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${SHOP_ADDRESS_ENCODED}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Route planen
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
