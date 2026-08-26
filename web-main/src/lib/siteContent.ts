import { supabase } from './supabase';
import * as defaults from './content';

export async function getSiteContent() {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('content')
      .eq('site', 'web-main')
      .maybeSingle();

    if (error) throw error;

    const overrides = (data?.content || {}) as Partial<typeof defaults>;

    return {
      brand: { ...defaults.brand, ...(overrides.brand || {}) },
      navLinks: overrides.navLinks || defaults.navLinks,
      destinations: overrides.destinations || defaults.destinations,
      categories: overrides.categories || defaults.categories,
      featuredEvents: overrides.featuredEvents || defaults.featuredEvents,
      organizerSpotlights: overrides.organizerSpotlights || defaults.organizerSpotlights,
      impactStats: overrides.impactStats || defaults.impactStats,
      blogPosts: overrides.blogPosts || defaults.blogPosts,
      faq: overrides.faq || defaults.faq,
      supportTopics: overrides.supportTopics || defaults.supportTopics,
    };
  } catch (err) {
    console.error('Error fetching site content, falling back to defaults:', err);
    return { ...defaults };
  }
}