import { supabase } from './supabase';
import * as defaults from './content';

export async function getSiteContent(): Promise<{
  home: Record<string, any>;
  about: Record<string, any>;
  pricingPlans: Array<{ id: string; name: string; price: string; description: string; badge: string }>;
  brand: typeof defaults.brand;
  navLinks: typeof defaults.navLinks;
  destinations: typeof defaults.destinations;
  categories: typeof defaults.categories;
  featuredEvents: typeof defaults.featuredEvents;
  organizerSpotlights: typeof defaults.organizerSpotlights;
  impactStats: typeof defaults.impactStats;
  blogPosts: typeof defaults.blogPosts;
  faq: typeof defaults.faq;
  supportTopics: typeof defaults.supportTopics;
}> {

  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('content')
      .eq('site', 'web-main')
      .maybeSingle();

    if (error) throw error;

    const overrides = (data?.content || {}) as Partial<typeof defaults> & {
      home?: Record<string, any>;
      about?: Record<string, any>;
      pricingPlans?: Array<{ id: string; name: string; price: string; description: string; badge: string }>;
    };

    const DEFAULT_PLANS = [
      { id: 'starter', name: 'Starter', price: '$29/mo', description: 'For new organizers launching their first event.', badge: 'Best for first-time hosts' },
      { id: 'growth', name: 'Growth', price: '$79/mo', description: 'For growing communities managing more than one event.', badge: 'Popular for scaling teams' },
      { id: 'pro', name: 'Pro', price: '$149/mo', description: 'Advanced automation, analytics, and premium support.', badge: 'Built for full-scale operations' },
    ];

return {
  home: overrides.home || {},
  about: overrides.about || {},
  pricingPlans: overrides.pricingPlans || DEFAULT_PLANS,
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
    const DEFAULT_PLANS = [
      { id: 'starter', name: 'Starter', price: '$29/mo', description: 'For new organizers launching their first event.', badge: 'Best for first-time hosts' },
      { id: 'growth', name: 'Growth', price: '$79/mo', description: 'For growing communities managing more than one event.', badge: 'Popular for scaling teams' },
      { id: 'pro', name: 'Pro', price: '$149/mo', description: 'Advanced automation, analytics, and premium support.', badge: 'Built for full-scale operations' },
    ];
    return { home: {}, about: {}, pricingPlans: DEFAULT_PLANS, ...defaults };
  }
}