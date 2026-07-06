import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function GalleryOverview() {
  const [brands, setBrands] = useState(null);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  usePageMeta({
    title: t('galleryOverview.metaTitle'),
    description: t('galleryOverview.metaDescription'),
    path: '/galerie',
  });

  useEffect(() => {
    api.get('/gallery-brands').then(setBrands).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">{t('galleryOverview.title')}</h1>
      <p className="mb-8 text-neutral-600 dark:text-neutral-300">
        {t('galleryOverview.intro')}
      </p>

      {error && <p className="text-red-600">{error}</p>}
      {!brands && !error && <p className="text-neutral-500 dark:text-neutral-400">{t('galleryOverview.loading')}</p>}
      {brands && brands.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">{t('galleryOverview.empty')}</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {brands?.map((brand) => (
          <Link
            key={brand.id}
            to={`/galerie/${brand.slug}`}
            className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-neutral-900 shadow-sm transition hover:shadow-lg"
          >
            {brand.cover_image_path ? (
              <img
                src={brand.cover_image_path}
                alt={brand.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-200 dark:bg-neutral-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent transition group-hover:from-black/95" />
            <span className="absolute inset-x-0 bottom-0 p-4 text-lg font-extrabold text-white">{brand.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
