import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import Reveal from '../../components/Reveal.jsx';
import Lightbox from '../../components/Lightbox.jsx';

export default function GalleryProjectPage() {
  const { brandSlug, projectSlug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    api
      .get(`/gallery-brands/${brandSlug}/${projectSlug}/photos`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [brandSlug, projectSlug]);

  usePageMeta({
    title: data ? `${data.project.name} – ${data.project.brand_name}` : 'Bildergalerie',
    description: data ? `Fotos unseres ${data.project.name} Umbaus.` : undefined,
    path: `/galerie/${brandSlug}/${projectSlug}`,
  });

  const navigate = (delta) => {
    setOpenIndex((i) => {
      const total = data.photos.length;
      return (i + delta + total) % total;
    });
  };

  if (error) {
    return <p className="mx-auto max-w-6xl px-4 py-12 text-red-600 sm:px-6">{error}</p>;
  }

  if (!data) {
    return <p className="mx-auto max-w-6xl px-4 py-12 text-neutral-500 sm:px-6">Lädt…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">
        <Link to="/galerie" className="hover:text-brand-500">Galerie</Link> /{' '}
        <Link to={`/galerie/${brandSlug}`} className="hover:text-brand-500">{data.project.brand_name}</Link> / {data.project.name}
      </p>
      <h1 className="mb-8 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">{data.project.name}</h1>

      {data.photos.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">Für dieses Projekt sind noch keine Fotos hinterlegt.</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {data.photos.map((photo, i) => (
          <Reveal key={photo.id} index={i % 6} shine className="aspect-square overflow-hidden rounded-xl">
            <button
              onClick={() => setOpenIndex(i)}
              className="block h-full w-full"
              aria-label={photo.caption || 'Bild vergrößern'}
            >
              <img
                src={photo.image_path}
                alt={photo.caption || ''}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
              />
            </button>
          </Reveal>
        ))}
      </div>

      <Lightbox photos={data.photos} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={navigate} />
    </div>
  );
}
