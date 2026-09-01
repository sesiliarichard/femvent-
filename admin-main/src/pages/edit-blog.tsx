import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface BlogPost {
  title: string;
  excerpt: string;
  author: string;
  date: string;
}

interface BlogContent {
  blogPosts: BlogPost[];
}

const DEFAULTS: BlogContent = {
  blogPosts: [
    { title: "How to Create Events People Actually Want to Attend", excerpt: "Tips from successful event organizers on creating memorable experiences that keep people coming back.", author: "Sarah Johnson", date: "Jan 20, 2026" },
    { title: "Event Trends We're Seeing in 2026", excerpt: "From hybrid events to community-focused gatherings, here's what's working for organizers this year.", author: "Michael Ochieng", date: "Jan 12, 2026" },
    { title: "Success Story: How Bloom Gatherings Grew Their Events", excerpt: "Learn how one organizer went from small local meetups to hosting events across three cities in under a year.", author: "FemVents Team", date: "Jan 5, 2026" },
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
      alert('✅ Blog page saved!');
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
    setContent({ ...content, blogPosts: [...content.blogPosts, { title: '', excerpt: '', author: '', date: '' }] });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Blog Page</h1>
        <p className="text-sm text-gray-500">Update the text shown on femvents.netlify.app/blog.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">Blog Posts</div>
        <div className="p-6 space-y-4">
          {content.blogPosts.map((post, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <label className="block text-xs font-medium text-gray-500">Post {i + 1} — Title</label>
                <button onClick={() => removePost(i)} className="text-xs text-red-600 font-semibold hover:text-red-700">Remove</button>
              </div>
              <input type="text" value={post.title} onChange={(e) => updatePost(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <label className="block text-xs font-medium text-gray-500">Excerpt</label>
              <textarea value={post.excerpt} onChange={(e) => updatePost(i, 'excerpt', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Author</label>
                  <input type="text" value={post.author} onChange={(e) => updatePost(i, 'author', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Date</label>
                  <input type="text" value={post.date} onChange={(e) => updatePost(i, 'date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addPost} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
            + Add blog post
          </button>
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-lg">
          {saving ? 'Saving...' : '💾 Save Blog Page'}
        </button>
      </div>
    </AdminLayout>
  );
}