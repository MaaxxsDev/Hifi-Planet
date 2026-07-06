import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';

export default function GalleryPhotos() {
  const { projectId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef(null);

  const load = () => api.get(`/gallery-projects/${projectId}/photos`).then(setPhotos);

  useEffect(() => {
    load();
  }, [projectId]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Lade Bild ${i + 1} von ${files.length} hoch…`);
        const formData = new FormData();
        formData.append('file', files[i]);
        const result = await api.post('/uploads', formData);
        await api.post('/gallery-photos', {
          gallery_project_id: Number(projectId),
          image_path: result.path,
          sort_order: photos.length + i,
        });
      }
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCaptionChange = (photo, caption) => {
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, caption } : p)));
  };

  const handleSortChange = (photo, sort_order) => {
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, sort_order } : p)));
  };

  const handleSave = async (photo) => {
    await api.put(`/gallery-photos/${photo.id}`, { caption: photo.caption, sort_order: photo.sort_order });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Foto wirklich entfernen?')) return;
    await api.delete(`/gallery-photos/${id}`);
    load();
  };

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link to="/admin/gallery-projects" className="text-brand-600 hover:underline">← Zurück zu den Projekten</Link>
      </p>
      <h1 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">Fotos im Projekt</h1>

      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Fotos hinzufügen (Mehrfachauswahl möglich)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFiles}
          disabled={uploading}
          className="text-sm"
        />
        {uploading && <p className="mt-2 text-sm text-neutral-500">{uploadProgress}</p>}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <img src={photo.image_path} alt={photo.caption || ''} className="aspect-square w-full object-cover" />
            <div className="space-y-2 p-3">
              <input
                value={photo.caption || ''}
                onChange={(e) => handleCaptionChange(photo, e.target.value)}
                onBlur={() => handleSave(photo)}
                placeholder="Bildunterschrift (optional)"
                className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={photo.sort_order}
                  onChange={(e) => handleSortChange(photo, Number(e.target.value))}
                  onBlur={() => handleSave(photo)}
                  className="w-16 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button onClick={() => handleDelete(photo.id)} className="text-xs text-red-600 hover:underline">Entfernen</button>
              </div>
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <p className="col-span-full py-6 text-center text-neutral-400">Noch keine Fotos in diesem Projekt.</p>
        )}
      </div>
    </div>
  );
}
