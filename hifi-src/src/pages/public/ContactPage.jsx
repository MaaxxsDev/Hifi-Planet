import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import ExternalEmbed from '../../components/ExternalEmbed.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const digitsOnly = (value) => (value || '').replace(/[^\d+]/g, '');

const SHOP_ADDRESS_ENCODED = encodeURIComponent('Boxbrunner Str. 20a, 63916 Amorbach');

export default function ContactPage() {
  const [params] = useSearchParams();
  const { phone, contact_email: contactEmail } = useSiteSettings();
  const { t, language } = useLanguage();
  const formatPrice = (value) =>
    new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' }).format(value);
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
    title: t('contactPage.metaTitle'),
    description: t('contactPage.metaDescription'),
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
      <h1 className="mb-8 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">{t('contactPage.title')}</h1>

      <div className="grid gap-10 md:grid-cols-5">
        <div className="md:col-span-3">
          {status === 'sent' ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">{t('contactPage.sentTitle')}</h2>
              <p className="text-neutral-600 dark:text-neutral-300">{t('contactPage.sentText')}</p>
            </div>
          ) : (
            <>
              {hasContext && (
                <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 dark:border-brand-900 dark:bg-brand-900/20 dark:text-brand-200">
                  <p className="font-semibold">{t('contactPage.contextIntro')}</p>
                  <ul className="mt-1 space-y-0.5">
                    {context.brand && <li>{t('contactPage.contextBrand')}: {context.brand}</li>}
                    {context.model && <li>{t('contactPage.contextModel')}: {context.model}</li>}
                    {context.package && <li>{t('contactPage.contextPackage')}: {context.package}</li>}
                    {context.product && <li>{t('contactPage.contextProduct')}: {context.product}</li>}
                  </ul>
                  {packageTotal != null && (
                    <p className="mt-2 font-semibold">
                      {t('contactPage.packagePrice')}: {formatPrice(packageTotal)}
                      {upgradesTotal > 0 && <> + {formatPrice(upgradesTotal)} {t('contactPage.upgrades')} = {formatPrice(packageTotal + upgradesTotal)}</>}
                    </p>
                  )}
                </div>
              )}

              {upgrades.length > 0 && (
                <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">{t('contactPage.optionalUpgrades')}</p>
                  <div className="space-y-2">
                    {upgrades.map((u) => (
                      <label key={u.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 p-3 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                        <input
                          type="checkbox"
                          checked={selectedUpgradeIds.includes(u.id)}
                          onChange={() => toggleUpgrade(u.id)}
                          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="flex-1">
                          <span className="block font-medium text-neutral-800 dark:text-neutral-100">{u.name}</span>
                          {u.description && <span className="block text-neutral-500 dark:text-neutral-400">{u.description}</span>}
                        </span>
                        <span className="font-semibold text-brand-600 dark:text-brand-400">+{formatPrice(u.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('contactPage.nameLabel')}</label>
                  <input
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('contactPage.emailLabel')}</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('contactPage.phoneLabel')}</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t('contactPage.vinLabel')}
                  </label>
                  <input
                    name="vin"
                    value={form.vin}
                    onChange={handleChange}
                    placeholder={t('contactPage.vinPlaceholder')}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('contactPage.messageLabel')}</label>
                  <textarea
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {status === 'sending' ? t('contactPage.sending') : t('contactPage.submit')}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 font-semibold text-neutral-900 dark:text-white">{t('contactPage.cardTitle')}</h2>
            <dl className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
              <div>
                <dt className="font-medium text-neutral-800 dark:text-neutral-100">{t('contactPage.address')}</dt>
                <dd>Boxbrunner Str. 20a, 63916 Amorbach</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-800 dark:text-neutral-100">{t('contactPage.phone')}</dt>
                <dd><a href={`tel:${digitsOnly(phone)}`} className="inline-block py-1 hover:text-brand-500">{phone}</a></dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-800 dark:text-neutral-100">{t('contactPage.email')}</dt>
                <dd><a href={`mailto:${contactEmail}`} className="inline-block py-1 hover:text-brand-500">{contactEmail}</a></dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-800 dark:text-neutral-100">{t('contactPage.hours')}</dt>
                <dd>{t('contactPage.hoursWeek')}</dd>
                <dd>{t('contactPage.hoursSat')}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 font-semibold text-neutral-900 dark:text-white">{t('contactPage.directionsTitle')}</h2>
            <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
              <ExternalEmbed name={t('contactPage.mapEmbedName')} className="h-[220px] w-full">
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
              {t('contactPage.routePlan')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
