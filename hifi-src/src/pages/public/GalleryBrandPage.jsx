import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function GalleryBrandPage() {
  const { brandSlug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    api.get(`/gallery-brands/${brandSlug}/projects`).then(setData).catch((e) => setError(e.message));
  }, [brandSlug]);

  usePageMeta({
    title: data ? t('galleryBrandPage.metaTitle')(data.brand.name) : t('galleryBrandPage.metaTitleFallback'),
    description: data ? t('galleryBrandPage.metaDescription')(data.brand.name) : undefined,
    path: `/galerie/${brandSlug}`,
  });

  if (error) {
    return <p className="mx-auto max-w-6xl px-4 py-12 text-red-600 sm:px-6">{error}</p>;
  }

  if (!data) {
    return <p className="mx-auto max-w-6xl px-4 py-12 text-neutral-500 sm:px-6">{t('galleryBrandPage.loading')}</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">
        <Link to="/galerie" className="hover:text-brand-500">{t('galleryBrandPage.breadcrumbGallery')}</Link> / {data.brand.name}
      </p>
      <h1 className="mb-8 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
        {data.brand.name} – {t('galleryBrandPage.titleSuffix')}
      </h1>

      {data.projects.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">{t('galleryBrandPage.empty')}</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {data.projects.map((project) => (
          <Link
            key={project.id}
            to={`/galerie/${brandSlug}/${project.slug}`}
            className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-neutral-900 shadow-sm transition hover:shadow-lg"
          >
            {project.cover_image_path ? (
              <img
                src={project.cover_image_path}
                alt={project.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-200 dark:bg-neutral-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent transition group-hover:from-black/95" />
            <span className="absolute inset-x-0 bottom-0 p-4 text-lg font-extrabold text-white">{project.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
