import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface EditableImageProps {
  src: string;
  onChange: (url: string) => void;
  alt?: string;
  className?: string;
  imgClassName?: string;
  folder?: string;
}

export const EditableImage: React.FC<EditableImageProps> = ({
  src,
  onChange,
  alt = '',
  className = '',
  imgClassName = '',
  folder = 'general',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('site-images').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`group relative ${className}`}>
      <img src={src} alt={alt} className={imgClassName} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all"
      >
        {uploading ? 'Uploading...' : '📷 Replace image'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};