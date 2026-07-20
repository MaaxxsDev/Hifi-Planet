import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import ExternalEmbed from '../../components/ExternalEmbed.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCookieConsent } from '../../context/CookieConsentContext.jsx';
import { User, Mail, Phone, Car, Package, Send, MapPin, ExternalLink } from 'lucide-react';
import grungeBg from '../../assets/contact/grunge.png';
import splatterBg from '../../assets/contact/splatter.png';
import carPhoto from '../../assets/contact/car-light.png';

const digitsOnly = (value) => (value || '').replace(/[^\d+]/g, '');
const waHref = (whatsapp) => `https://wa.me/${digitsOnly(whatsapp).replace(/^0/, '49').replace('+', '')}`;

const SHOP_ADDRESS_ENCODED = encodeURIComponent('Boxbrunner Str. 20a, 63916 Amorbach');
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${SHOP_ADDRESS_ENCODED}`;

const michroma = { fontFamily: "'Michroma', sans-serif" };

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 5-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-2.6.7.7-2.5-.2-.3A8 8 0 0 1 12 4zm4.3 9.9c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.7.7-.9 1.6-.6 2.7.5 1.7 1.6 3.1 3.4 4.2 1.7 1 2.5 1 3.4.9.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1z" />
    </svg>
  );
}

// Die 4 Feature-Icons aus dem Referenzdesign - kein 1:1-Lucide-Pendant fuer alle,
// daher als rohe Pfade uebernommen statt einem angenaeherten Lucide-Icon.
function FeatureIcon({ path, className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const FEATURE_ICON_PATHS = {
  premium: 'M4 12v3M8 8v11M12 4v16M16 8v11M20 12v3',
  germany: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19',
  individual: 'M6 3h12l4 6-10 12L2 9z M11 3 8 9l4 12 4-12-3-6M2 9h20',
  experts: 'M20 6 9 17l-5-5',
};

// Michroma hat kein Euro-Zeichen-Glyph (rendert als Tofu/"O"-Ersatzform) - das
// Waehrungssymbol bekommt darum immer die System-Schrift, nur Ziffern/Komma bleiben
// in Michroma. Robust gegen beide Symbolpositionen (de-DE: "999,00 €", en-US: "€999.00").
function PriceMichroma({ formatted, color }) {
  const [pre, post] = formatted.split('€');
  return (
    <span style={{ ...michroma, color }}>
      {pre}
      <span style={{ fontFamily: "'Barlow', sans-serif" }}>€</span>
      {post}
    </span>
  );
}

function Field({ icon: Icon, label, name, type = 'text', required, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={`kf-${name}`}
        className="text-xs font-semibold uppercase tracking-[2px]"
        style={{ color: 'var(--kf-label)' }}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <Icon className="pointer-events-none absolute left-[14px] h-[17px] w-[17px]" style={{ color: 'var(--kf-fieldicon)' }} />
        <input
          id={`kf-${name}`}
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-lg border py-3.5 pl-[42px] pr-4 text-[15px] outline-none transition-colors"
          style={{ background: 'var(--kf-field)', borderColor: 'var(--kf-fieldbrd)', color: 'var(--kf-text2)' }}
        />
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [params] = useSearchParams();
  const { phone, whatsapp, contact_email: contactEmail } = useSiteSettings();
  const { t, language } = useLanguage();
  const { consent } = useCookieConsent();
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
  };
  const hasPackage = Boolean(context.brand && context.model && context.package);

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
        product_name: params.get('product') || null,
        package_id: packageId || null,
        package_product_id: params.get('productId') || null,
        upgrade_ids: selectedUpgradeIds,
      });
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', vin: '', message: '' });
    } catch (e) {
      setError(e.message);
      setStatus('idle');
    }
  };

  const features = [
    { key: 'premium', title: t('contactPage.featurePremiumTitle'), sub: t('contactPage.featurePremiumSub') },
    { key: 'germany', title: t('contactPage.featureGermanyTitle'), sub: t('contactPage.featureGermanySub') },
    { key: 'individual', title: t('contactPage.featureIndividualTitle'), sub: t('contactPage.featureIndividualSub') },
    { key: 'experts', title: t('contactPage.featureExpertsTitle'), sub: t('contactPage.featureExpertsSub') },
  ];

  return (
    <div
      className="kf-page relative w-full overflow-hidden px-4 pb-10 sm:px-10"
      style={{ background: 'var(--kf-pagebg)', color: 'var(--kf-text2)' }}
    >
      {/* Dark Mode: Grunge-Textur + Splatter + Bogen (Assets aus dem Handoff) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-cover bg-center dark:block"
        style={{ backgroundImage: `url(${grungeBg})` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[4%] -top-[8%] hidden h-[122%] w-[46%] bg-contain bg-right bg-no-repeat dark:block"
        style={{ backgroundImage: `url(${splatterBg})`, filter: 'drop-shadow(0 0 22px rgba(164,212,23,0.35))' }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 600 1000"
        preserveAspectRatio="xMaxYMid slice"
        className="pointer-events-none absolute right-0 top-0 hidden h-full w-[60%] dark:block"
      >
        <path d="M 900 -200 A 720 720 0 0 1 900 1200" fill="none" stroke="rgba(168,225,12,0.5)" strokeWidth="1.5" />
        <path d="M 860 -160 A 700 700 0 0 1 860 1160" fill="none" stroke="rgba(168,225,12,0.18)" strokeWidth="1" strokeDasharray="2 9" />
      </svg>

      {/* Light Mode: Auto-Foto unten links verankert + gruener Lichtstreifen rechts (ab 981px, s. README).
          Maske uebernimmt die weiche Ausblendung nach oben (kein harter oberer Rand bei
          voller Hoehe), der Scrim obendrauf das weiche Verlaufen nach rechts in die Seite. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 hidden h-full w-[34%] dark:!hidden min-[981px]:block"
      >
        <div
          className="h-full w-full bg-cover"
          style={{
            backgroundImage: `url(${carPhoto})`,
            backgroundPosition: 'left bottom',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 40%)',
            maskImage: 'linear-gradient(180deg, transparent 0%, black 40%)',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'var(--kf-scrim)' }} />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[4%] top-0 hidden h-full w-[26%] rotate-6 dark:!hidden min-[981px]:block"
      >
        <div
          className="absolute right-1/2 top-0 h-full w-[3px] opacity-80 blur-[1px]"
          style={{ background: 'linear-gradient(180deg, transparent, #b6e619 30%, #cfef5a 55%, transparent)' }}
        />
        <div
          className="absolute right-1/2 top-0 h-full w-[90px] translate-x-1/2 opacity-70 blur-[26px]"
          style={{ background: 'linear-gradient(180deg, transparent, #cfef5a 40%, transparent)' }}
        />
        <div
          className="absolute right-[40%] top-0 h-full w-[2px] opacity-60 blur-[1px]"
          style={{ background: 'linear-gradient(180deg, transparent, #b6e619 35%, transparent)' }}
        />
        <div
          className="absolute right-1/2 top-1/3 h-[420px] w-[420px] translate-x-1/2 rounded-full opacity-70 blur-[40px]"
          style={{ background: 'radial-gradient(circle, rgba(207,239,90,0.35), transparent 70%)' }}
        />
      </div>
      {/* Light Mode: dezente Topo-Wellenlinien oben links (README "Hintergruende"). */}
      <svg
        aria-hidden="true"
        viewBox="0 0 360 280"
        className="pointer-events-none absolute left-0 top-0 block h-[280px] w-[360px] opacity-50 dark:hidden"
        fill="none"
        stroke="var(--kf-topo)"
        strokeWidth="1"
      >
        <path d="M -20 40 C 60 10, 140 70, 220 40 S 360 10, 400 50" />
        <path d="M -20 90 C 70 55, 150 115, 230 85 S 370 60, 400 100" />
        <path d="M -20 140 C 60 105, 150 165, 235 135 S 365 110, 400 150" />
        <path d="M -20 190 C 70 155, 145 215, 230 185 S 370 160, 400 200" />
        <path d="M -20 240 C 60 205, 150 265, 235 235 S 365 210, 400 250" />
      </svg>

      <div className="relative z-10 mx-auto max-w-[1280px] pt-10 sm:pt-14">
        {/* Hero */}
        <div
          className="mb-3 text-[13px] font-semibold uppercase tracking-[6px]"
          style={{ color: 'var(--kf-accent2)' }}
        >
          {t('contactPage.heroEyebrow')}
        </div>
        <h1
          className="text-[34px] leading-[1.08] sm:text-[46px] lg:text-[60px]"
          style={{ ...michroma, color: 'var(--kf-text)' }}
        >
          {t('contactPage.heroTitlePre')} <span style={{ color: 'var(--kf-accent2)' }}>{t('contactPage.heroTitleAccent')}</span> {t('contactPage.heroTitlePost')}
        </h1>
        <p className="mb-10 mt-5 max-w-[520px] text-lg leading-[1.55]" style={{ color: 'var(--kf-muted)' }}>
          {t('contactPage.heroSubtitle')}
        </p>

        {/* Hauptraster */}
        <div className="grid grid-cols-1 items-start gap-10 min-[981px]:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
          {/* Formular-Karte */}
          <div>
            <div
              className="rounded-2xl border p-[22px] sm:p-10"
              style={{ background: 'var(--kf-card)', borderColor: 'var(--kf-cardbrd)', boxShadow: 'var(--kf-shadow)' }}
            >
              {hasPackage && (
                <div
                  className="mb-8 rounded-xl border px-6 py-[22px]"
                  style={{ background: 'var(--kf-pkgbg)', borderColor: 'var(--kf-pkgbrd)' }}
                >
                  <div
                    className="mb-3.5 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[2px]"
                    style={{ color: 'var(--kf-accent2)' }}
                  >
                    <Package className="h-4 w-4" />
                    {t('contactPage.packageBoxTitle')}
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[15px]">
                    <span style={{ color: 'var(--kf-label)' }}>{t('contactPage.contextBrand')}</span>
                    <span className="font-semibold" style={{ color: 'var(--kf-text2)' }}>{context.brand}</span>
                    <span style={{ color: 'var(--kf-label)' }}>{t('contactPage.contextModel')}</span>
                    <span className="font-semibold" style={{ color: 'var(--kf-text2)' }}>{context.model}</span>
                    <span style={{ color: 'var(--kf-label)' }}>{t('contactPage.contextPackage')}</span>
                    <span className="font-semibold" style={{ color: 'var(--kf-text2)' }}>{context.package}</span>
                  </div>
                  <div
                    className="mt-3.5 flex items-baseline justify-between border-t pt-3.5"
                    style={{ borderColor: 'var(--kf-pkgbrd)' }}
                  >
                    <span className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: 'var(--kf-muted)' }}>
                      {t('contactPage.packagePrice')}
                    </span>
                    <span className="text-xl">
                      {packageTotal != null ? <PriceMichroma formatted={formatPrice(packageTotal)} color="var(--kf-text)" /> : '—'}
                    </span>
                  </div>
                </div>
              )}

              {upgrades.length > 0 && (
                <div
                  className="mb-8 rounded-xl border p-5"
                  style={{ background: 'var(--kf-field)', borderColor: 'var(--kf-fieldbrd)' }}
                >
                  <div className="mb-3 text-xs font-bold uppercase tracking-[2px]" style={{ color: 'var(--kf-accent2)' }}>
                    {t('contactPage.optionalUpgrades')}
                  </div>
                  <div className="space-y-2">
                    {upgrades.map((u) => (
                      <label
                        key={u.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"
                        style={{ borderColor: 'var(--kf-fieldbrd)' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUpgradeIds.includes(u.id)}
                          onChange={() => toggleUpgrade(u.id)}
                          className="mt-0.5 h-4 w-4 rounded"
                          style={{ accentColor: 'var(--kf-accent)' }}
                        />
                        <span className="flex-1">
                          <span className="block font-semibold" style={{ color: 'var(--kf-text2)' }}>{u.name}</span>
                          {u.description && (
                            <span className="block text-xs" style={{ color: 'var(--kf-muted)' }}>{u.description}</span>
                          )}
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--kf-accent2)' }}>+{formatPrice(u.price)}</span>
                      </label>
                    ))}
                  </div>
                  {selectedUpgradeIds.length > 0 && packageTotal != null && (
                    <div
                      className="mt-3 flex items-baseline justify-between border-t pt-3 text-sm"
                      style={{ borderColor: 'var(--kf-pkgbrd)' }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--kf-muted)' }}>
                        {t('contactPage.totalWithUpgrades')}
                      </span>
                      <PriceMichroma formatted={formatPrice(packageTotal + upgradesTotal)} color="var(--kf-text)" />
                    </div>
                  )}
                </div>
              )}

              <h2 className="mb-8 text-xl" style={{ ...michroma, color: 'var(--kf-text)' }}>
                {t('contactPage.formTitle')}
              </h2>

              {status === 'sent' && (
                <div
                  className="mb-6 rounded-[10px] border p-5"
                  style={{ borderColor: 'var(--kf-accent)', background: 'var(--kf-accentsoft)' }}
                >
                  <div className="text-base font-bold" style={{ color: 'var(--kf-accent2)' }}>
                    {t('contactPage.sentTitle')}
                  </div>
                  <div className="mt-1 text-sm" style={{ color: 'var(--kf-muted)' }}>
                    {t('contactPage.sentText')}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 min-[641px]:grid-cols-2">
                  <Field
                    icon={User}
                    label={t('contactPage.nameLabel')}
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t('contactPage.namePlaceholder')}
                  />
                  <Field
                    icon={Mail}
                    label={t('contactPage.emailLabel')}
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t('contactPage.emailPlaceholder')}
                  />
                  <Field
                    icon={Phone}
                    label={t('contactPage.phoneLabel')}
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder={t('contactPage.phonePlaceholder')}
                  />
                  <Field
                    icon={Car}
                    label={t('contactPage.vinLabel')}
                    name="vin"
                    value={form.vin}
                    onChange={handleChange}
                    placeholder={t('contactPage.vinPlaceholder')}
                  />
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <label
                    htmlFor="kf-message"
                    className="text-xs font-semibold uppercase tracking-[2px]"
                    style={{ color: 'var(--kf-label)' }}
                  >
                    {t('contactPage.messageLabel')}
                  </label>
                  <textarea
                    id="kf-message"
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder={t('contactPage.messagePlaceholder')}
                    className="w-full resize-y rounded-lg border px-4 py-3.5 text-[15px] outline-none"
                    style={{ background: 'var(--kf-field)', borderColor: 'var(--kf-fieldbrd)', color: 'var(--kf-text2)' }}
                  />
                </div>

                {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex items-center gap-3 rounded-lg px-8 py-4 text-sm font-bold uppercase tracking-[3px] transition-[filter,box-shadow] hover:brightness-110 disabled:opacity-60"
                    style={{
                      background: 'var(--kf-accent)',
                      color: 'var(--kf-btntext)',
                      boxShadow: '0 10px 24px rgba(150,200,20,0.32)',
                    }}
                  >
                    <Send className="h-[18px] w-[18px]" />
                    {status === 'sending' ? t('contactPage.sending') : t('contactPage.submit')}
                  </button>
                  <div className="text-[13px]" style={{ color: 'var(--kf-label)' }}>
                    {t('contactPage.requiredHint')}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Rechte Spalte */}
          <div className="flex flex-col gap-6">
            <div
              className="relative overflow-hidden rounded-2xl border px-[22px] py-[26px] sm:px-8 sm:py-[34px]"
              style={{ background: 'var(--kf-card)', borderColor: 'var(--kf-cardbrd)', boxShadow: 'var(--kf-shadow)' }}
            >
              <div
                className="pointer-events-none absolute -right-[60px] -top-[60px] h-[190px] w-[190px] rounded-full border border-dashed"
                style={{ borderColor: 'var(--kf-pkgbrd)' }}
              />
              <h2 className="mb-7 text-[17px]" style={{ ...michroma, color: 'var(--kf-text)' }}>
                {t('contactPage.cardTitle')}
              </h2>

              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'var(--kf-accentsoft)' }}
                  >
                    <Phone className="h-[18px] w-[18px]" style={{ color: 'var(--kf-accent2)' }} />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[3px]" style={{ color: 'var(--kf-accent2)' }}>
                      {t('contactPage.phone')}
                    </div>
                    <a href={`tel:${digitsOnly(phone)}`} className="text-base font-semibold" style={{ color: 'var(--kf-text2)' }}>
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'var(--kf-accentsoft)' }}
                  >
                    <Mail className="h-[18px] w-[18px]" style={{ color: 'var(--kf-accent2)' }} />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[3px]" style={{ color: 'var(--kf-accent2)' }}>
                      {t('contactPage.email')}
                    </div>
                    <a href={`mailto:${contactEmail}`} className="text-base font-semibold" style={{ color: 'var(--kf-text2)' }}>
                      {contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'var(--kf-accentsoft)' }}
                  >
                    <MapPin className="h-[18px] w-[18px]" style={{ color: 'var(--kf-accent2)' }} />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[3px]" style={{ color: 'var(--kf-accent2)' }}>
                      {t('contactPage.address')}
                    </div>
                    <div className="text-base font-semibold leading-[1.4]" style={{ color: 'var(--kf-text2)' }}>
                      Boxbrunner Straße 20a<br />63916 Amorbach
                    </div>
                  </div>
                </div>

                {whatsapp && (
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: 'var(--kf-accentsoft)' }}
                    >
                      <WhatsAppIcon className="h-[18px] w-[18px]" style={{ color: 'var(--kf-accent2)' }} />
                    </div>
                    <div>
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[3px]" style={{ color: 'var(--kf-accent2)' }}>
                        {t('nav.whatsapp')}
                      </div>
                      <a href={waHref(whatsapp)} className="text-base font-semibold" style={{ color: 'var(--kf-text2)' }}>
                        {whatsapp}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-7 border-t pt-6" style={{ borderColor: 'var(--kf-divider)' }}>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[3px]" style={{ color: 'var(--kf-accent2)' }}>
                  {t('contactPage.hours')}
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[15px]">
                  <span style={{ color: 'var(--kf-label)' }}>{t('contactPage.hoursWeekDays')}</span>
                  <span>{t('contactPage.hoursWeekTime')}</span>
                  <span style={{ color: 'var(--kf-label)' }}>{t('contactPage.hoursSatDay')}</span>
                  <span>{t('contactPage.hoursSatTime')}</span>
                </div>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-2xl border"
              style={{ background: 'var(--kf-card)', borderColor: 'var(--kf-cardbrd)', boxShadow: 'var(--kf-shadow)' }}
            >
              {consent.external && (
                <a
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute left-3.5 top-3.5 z-10 inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-semibold hover:border-[var(--kf-accent)]"
                  style={{ background: 'var(--kf-pill)', borderColor: 'var(--kf-pillbrd)', color: 'var(--kf-text2)', boxShadow: 'var(--kf-shadow2)' }}
                >
                  {t('contactPage.mapOpenChip')}
                  <ExternalLink className="h-3.5 w-3.5" style={{ color: 'var(--kf-accent2)' }} />
                </a>
              )}
              <ExternalEmbed name={t('contactPage.mapEmbedName')} className="h-[210px] w-full">
                {/* iframe hoeher als der sichtbare Ausschnitt + negativer margin-top:
                    schneidet Googles eigenes Overlay (oben links) weg, damit nur unser
                    "In Maps oeffnen"-Chip zu sehen ist - wie im Prototyp. */}
                <div className="h-[210px] overflow-hidden">
                  <iframe
                    title="HifiPlanet Amorbach – Standort"
                    src={`https://www.google.com/maps?q=${SHOP_ADDRESS_ENCODED}&output=embed`}
                    width="100%"
                    height="280"
                    style={{ border: 0, display: 'block', marginTop: '-70px' }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </ExternalEmbed>
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 border-t px-4 py-4 text-[13px] font-bold uppercase tracking-[3px] hover:bg-[var(--kf-accentsoft)]"
                style={{ borderColor: 'var(--kf-divider)', color: 'var(--kf-accent2)' }}
              >
                {t('contactPage.routePlan')} →
              </a>
            </div>
          </div>
        </div>

        {/* Feature-Leiste */}
        <div
          className="mt-10 grid grid-cols-1 overflow-hidden rounded-2xl border min-[641px]:grid-cols-2 min-[901px]:grid-cols-4"
          style={{ background: 'var(--kf-card)', borderColor: 'var(--kf-cardbrd)', boxShadow: 'var(--kf-shadow2)' }}
        >
          {features.map((f) => (
            <div
              key={f.key}
              className="flex items-center gap-4 border-b p-6 last:border-b-0 min-[641px]:border-b-0 min-[641px]:border-r min-[641px]:last:border-r-0"
              style={{ borderColor: 'var(--kf-divider)' }}
            >
              <div
                className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px]"
                style={{ borderColor: 'var(--kf-pkgbrd)', color: 'var(--kf-accent2)' }}
              >
                <FeatureIcon path={FEATURE_ICON_PATHS[f.key]} className="h-[22px] w-[22px]" />
              </div>
              <div>
                <div className="text-[15px] font-bold" style={{ color: 'var(--kf-text)' }}>{f.title}</div>
                <div className="mt-0.5 text-[13px]" style={{ color: 'var(--kf-muted)' }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
