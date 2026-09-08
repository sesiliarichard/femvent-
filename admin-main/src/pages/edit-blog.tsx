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
    setContent({ ...content, blogPosts: [...content.blogPosts, { title: '', excerpt: '', author: '', date: '', image: '' }] });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen bg-[#FBF3FA]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#D9C9E0] border-t-[#9B1F5C]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2E1F45]">Edit Blog Page</h1>
        <p className="text-sm text-[#5C4A6B] mt-1">Update the text and images shown on femvents.netlify.app/blog.</p>
      </div>

      <div className="bg-white rounded-sm border border-[#D9C9E0] mb-5 overflow-hidden">
        <div className="px-6 py-3 bg-[#4A3B78] text-[#FBF3FA] font-bold text-sm">Blog Posts</div>
        <div className="p-6 space-y-4">
          {content.blogPosts.map((post, i) => (
            <div key={i} className="border border-[#D9C9E0] rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-start">
                <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider">Post {i + 1} — Title</label>
                <button onClick={() => removePost(i)} className="text-xs text-[#9B1F5C] font-bold hover:opacity-70">Remove</button>
              </div>
              <input type="text" value={post.title} onChange={(e) => updatePost(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
              <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider">Excerpt</label>
              <textarea value={post.excerpt} onChange={(e) => updatePost(i, 'excerpt', e.target.value)} rows={2} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider mb-1">Author</label>
                  <input type="text" value={post.author} onChange={(e) => updatePost(i, 'author', e.target.value)} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider mb-1">Date</label>
                  <input type="text" value={post.date} onChange={(e) => updatePost(i, 'date', e.target.value)} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
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
          <button onClick={addPost} className="w-full py-2 border-2 border-dashed border-[#D9C9E0] rounded-sm text-sm font-medium text-[#8A7A96] hover:border-[#9B1F5C] hover:text-[#9B1F5C] transition-colors">
            + Add blog post
          </button>
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-[#2E1F45] text-[#FBF3FA] rounded-sm hover:bg-[#3D2A5C] disabled:opacity-50 font-bold text-sm shadow-lg">
          {saving ? 'Saving...' : 'Save Blog Page'}
        </button>
      </div>
    </AdminLayout>
  );
}