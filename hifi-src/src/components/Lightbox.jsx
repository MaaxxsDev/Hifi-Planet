import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Lightbox({ photos, index, onClose, onNavigate }) {
  const { t } = useLanguage();
  useEffect(() => {
    if (index == null) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate(1);
      if (e.key === 'ArrowLeft') onNavigate(-1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, onClose, onNavigate]);

  if (index == null) return null;
  const photo = photos[index];
  const stop = (e) => e.stopPropagation();

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button
        onClick={(e) => { stop(e); onClose(); }}
        aria-label={t('lightbox.close')}
        className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      {photos.length > 1 && (
        <button
          onClick={(e) => { stop(e); onNavigate(-1); }}
          aria-label={t('lightbox.previous')}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white sm:left-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}

      <img
        src={photo.image_path}
        alt={photo.caption || ''}
        onClick={stop}
        className="max-h-[85vh] max-w-full rounded-lg object-contain"
      />

      {photos.length > 1 && (
        <button
          onClick={(e) => { stop(e); onNavigate(1); }}
          aria-label={t('lightbox.next')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white sm:right-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}

      {photo.caption && (
        <p onClick={stop} className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
          {photo.caption}
        </p>
      )}
    </div>,
    document.body
  );
}
