import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { ImageUploadWidget } from '../components/ImageUploadWidget';

interface BlogPost {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  image: string;
}

interface BlogContent {
  blogPosts: BlogPost[];
}

const DEFAULTS: BlogContent = {
  blogPosts: [
    { title: "How to Create Events People Actually Want to Attend", excerpt: "Tips from successful event organizers on creating memorable experiences that keep people coming back.", author: "Sarah Johnson", date: "Jan 20, 2026", image: "" },
    { title: "Event Trends We're Seeing in 2026", excerpt: "From hybrid events to community-focused gatherings, here's what's working for organizers this year.", author: "Michael Ochieng", date: "Jan 12, 2026", image: "" },
    { title: "Success Story: How Bloom Gatherings Grew Their Events", excerpt: "Learn how one organizer went from small local meetups to hosting events across three cities in under a year.", author: "FemVents Team", date: "Jan 5, 2026", image: "" },
  ],
};

export default function EditBlogPage() {
  const [content, setContent] = useState<BlogContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('site', 'web-main')
        .maybeSingle();

      if (error) throw error;

      if (data?.content) {
        setContent({
          blogPosts: data.content.blogPosts || DEFAULTS.blogPosts,
        });
      }
    } catch (err) {
      console.error('Error fetching blog content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_content')
        .select('content')
        .eq('site', 'web-main')
        .maybeSingle();

      const mergedContent = {
        ...(existing?.content || {}),
        blogPosts: content.blogPosts,
      };

      const { error } = await supabase
        .from('site_content')
        .upsert(
          { site: 'web-main', content: mergedContent, updated_at: new Date().toISOString() },
          { onConflict: 'site' }
        );

      if (error) throw error;
      alert('Blog page saved!');
    } catch (err) {
      console.error('Error saving blog content:', err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updatePost = (i: number, field: keyof BlogPost, value: string) => {
    const updated = [...content.blogPosts];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, blogPosts: updated });
  };

  const removePost = (i: number) => {
    const updated = [...content.blogPosts];
    updated.splice(i, 1);
    setContent({ ...content, blogPosts: updated });
  };

  const addPost = () => {
    setContent({ ...content, blogPosts: [...content.blogPosts, { title: '', excerpt: '', author: '', date: '', image: '' }] });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Edit Blog Page</h1>
        <p className="text-sm text-gray-500 mt-1">Update the text and images shown on femvents.netlify.app/blog.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 mb-5 overflow-hidden">
        <div className="px-6 py-3.5 bg-primary-600 text-white font-extrabold text-sm">Blog Posts</div>
        <div className="p-6 space-y-4">
          {content.blogPosts.map((post, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Post {i + 1} — Title</label>
                <button onClick={() => removePost(i)} className="text-xs text-secondary-600 font-bold hover:opacity-70">Remove</button>
              </div>
              <input type="text" value={post.title} onChange={(e) => updatePost(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Excerpt</label>
              <textarea value={post.excerpt} onChange={(e) => updatePost(i, 'excerpt', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Author</label>
                  <input type="text" value={post.author} onChange={(e) => updatePost(i, 'author', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                  <input type="text" value={post.date} onChange={(e) => updatePost(i, 'date', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <ImageUploadWidget
                label="Post Image"
                value={post.image}
                onChange={(url) => updatePost(i, 'image', url)}
                folder="blog"
              />
            </div>
          ))}
          <button onClick={addPost} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
            + Add blog post
          </button>
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl disabled:opacity-50 font-bold text-sm transition-colors shadow-lg">
          {saving ? 'Saving...' : 'Save Blog Page'}
        </button>
      </div>
    </AdminLayout>
  );
}