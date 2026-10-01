import { supabase } from './supabase';
import * as defaults from './content';

export async function getSiteContent(): Promise<{
  home: Record<string, any>;
  about: Record<string, any>;
  organizersHero: Record<string, any>;
  howItWorks: string[];
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
      howItWorks?: string[];
      pricingPlans?: Array<{ id: string; name: string; price: string; description: string; badge: string; features?: { label: string; value: string }[] }>;
    };

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
      howItWorks: overrides.howItWorks || DEFAULT_WORKFLOW,
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
    const DEFAULT_WORKFLOW = [
      "Describe your gathering: why you're gathering, who it's for, and how people can join",
      "Add access and participation details: languages, accessibility, and any support available",
      "Publish your gathering and share the link with your community",
      "Welcome participants and follow up after the gathering",
    ];
    return { home: {}, about: {}, organizersHero: {}, howItWorks: DEFAULT_WORKFLOW, ...defaults };
  }
}