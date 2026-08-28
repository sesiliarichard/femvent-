import React, { useRef, useState } from 'react';
import { supabase } from '@/services/supabase';

interface ImageUploadWidgetProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({
  value,
  onChange,
  folder = 'general',
  label,
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from('site-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from('site-images').getPublicUrl(path);
      onChange(data.publicUrl);
      setUrlDraft(data.publicUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Upload failed. Try the "Paste URL" tab instead.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        <div className="flex border-b-2 border-gray-200">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === 'upload' ? 'text-blue-600 bg-white border-b-2 border-blue-500 -mb-0.5' : 'text-gray-400 bg-gray-50'
            }`}
          >
            📤 Upload from Device
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === 'url' ? 'text-blue-600 bg-white border-b-2 border-blue-500 -mb-0.5' : 'text-gray-400 bg-gray-50'
            }`}
          >
            🔗 Paste URL
          </button>
        </div>

        <div className="p-4">
          {tab === 'upload' ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) upload(file);
              }}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => inputRef.current?.click()}
            >
              <p className="text-sm text-gray-400 mb-2">
                {uploading ? 'Uploading...' : 'Drag & drop an image here, or'}
              </p>
              {!uploading && (
                <span className="inline-block px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold">
                  Choose File
                </span>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                  e.target.value = '';
                }}
              />
            </div>
          ) : (
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onBlur={() => onChange(urlDraft)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>

        {value && (
          <div className="relative border-t-2 border-gray-200 p-3">
            <img src={value} alt="Preview" className="w-full max-h-40 object-cover rounded" />
            <button
              type="button"
              onClick={() => { onChange(''); setUrlDraft(''); }}
              className="absolute top-5 right-5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};