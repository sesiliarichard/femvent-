import { supabase } from './supabase';
import * as defaults from './content';

export async function getSiteContent(): Promise<{
  home: Record<string, any>;
  about: Record<string, any>;
  organizersHero: Record<string, any>;
  principles: Record<string, any>;
  shape: Record<string, any>;
  movementsPage: Record<string, any>;
  opportunitiesPage: Record<string, any>;
  howItWorks: string[];
  pricingPlans: Array<{ id: string; name: string; price: string; description: string; badge: string; features?: { label: string; value: string }[] }>;
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
      organizersHero?: Record<string, any>;
      principles?: Record<string, any>;
      shape?: Record<string, any>;
      movementsPage?: Record<string, any>;
      opportunitiesPage?: Record<string, any>;
      howItWorks?: string[];
      pricingPlans?: Array<{ id: string; name: string; price: string; description: string; badge: string; features?: { label: string; value: string }[] }>;
    };

    const DEFAULT_PLANS = [
      { id: 'starter', name: 'Starter', price: '$29/mo', description: 'For new organizers launching their first event.', badge: 'Best for first-time hosts' },
      { id: 'growth', name: 'Growth', price: '$79/mo', description: 'For growing communities managing more than one event.', badge: 'Popular for scaling teams' },
      { id: 'pro', name: 'Pro', price: '$149/mo', description: 'Advanced automation, analytics, and premium support.', badge: 'Built for full-scale operations' },
    ];

    const DEFAULT_WORKFLOW = [
      "Describe your gathering: why you're gathering, who it's for, and how people can join",
      "Add access and participation details: languages, accessibility, and any support available",
      "Publish your gathering and share the link with your community",
      "Welcome participants and follow up after the gathering",
    ];

    return {
      home: overrides.home || {},
      about: overrides.about || {},
      organizersHero: overrides.organizersHero || {},
      principles: overrides.principles || {},
      shape: overrides.shape || {},
      movementsPage: overrides.movementsPage || {},
      opportunitiesPage: overrides.opportunitiesPage || {},
      howItWorks: overrides.howItWorks || DEFAULT_WORKFLOW,
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
    const DEFAULT_WORKFLOW = [
      "Describe your gathering: why you're gathering, who it's for, and how people can join",
      "Add access and participation details: languages, accessibility, and any support available",
      "Publish your gathering and share the link with your community",
      "Welcome participants and follow up after the gathering",
    ];
    return {
      home: {},
      about: {},
      organizersHero: {},
      principles: {},
      shape: {},
      movementsPage: {},
      opportunitiesPage: {},
      howItWorks: DEFAULT_WORKFLOW,
      pricingPlans: DEFAULT_PLANS,
      ...defaults,
    };
  }
}