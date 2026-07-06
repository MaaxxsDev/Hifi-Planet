import { useState } from 'react';
import { api } from '../api/client.js';

export default function ImageUploadField({ value, onChange, label = 'Bild' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.post('/uploads', formData);
      onChange(result.path);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="" className="h-12 w-12 rounded-md object-cover" />}
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="text-sm" />
        {uploading && <span className="text-sm text-neutral-500">Lädt hoch…</span>}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
