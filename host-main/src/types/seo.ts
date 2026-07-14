/**
 * FEATURE 6: SEO Optimization
 * 
 * Step 6.1: Type Definitions for SEO
 * ==================================
 * 
 * This feature enables:
 * - Meta tags editor (title, description, keywords)
 * - Open Graph tags for social sharing
 * - Twitter Card optimization
 * - Structured data (JSON-LD) for rich snippets
 * - Auto-generated sitemaps
 * - SEO score checker
 * - Image optimization
 * - Canonical URL management
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

// SEO metadata for an event page
export interface EventSEO {
    id: string;
    eventId: string;

    // Basic meta tags
    metaTitle: string; // "Tech Conference 2024 | Register Now"
    metaDescription: string; // ~160 characters
    metaKeywords: string[]; // ["tech", "conference", "2024"]

    // Open Graph (Facebook, LinkedIn)
    ogTitle?: string; // Defaults to metaTitle
    ogDescription?: string; // Defaults to metaDescription
    ogImage?: string; // URL to image (1200x630px recommended)
    ogType: 'website' | 'article' | 'event';
    ogUrl: string; // Canonical URL

    // Twitter Card
    twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    twitterSite?: string; // @handle
    twitterCreator?: string; // @handle

    // Structured Data (JSON-LD)
    structuredData: EventStructuredData;

    // Technical SEO
    canonicalUrl: string;
    alternateUrls?: { lang: string; url: string }[]; // For multi-language
    robotsDirective: 'index,follow' | 'noindex,nofollow' | 'index,nofollow' | 'noindex,follow';

    // Performance
    imageOptimization: {
        enabled: boolean;
        format: 'webp' | 'jpeg' | 'png';
        quality: number; // 1-100
    };

    // SEO Score
    seoScore?: number; // 0-100
    scoreBreakdown?: {
        titleScore: number;
        descriptionScore: number;
        imageScore: number;
        structuredDataScore: number;
        performanceScore: number;
    };

    // Dates
    lastAnalyzed?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Event structured data for Google rich snippets
export interface EventStructuredData {
    '@context': 'https://schema.org';
    '@type': 'Event';
    name: string;
    description: string;
    startDate: string; // ISO 8601 format
    endDate?: string;
    eventStatus: 'EventScheduled' | 'EventCancelled' | 'EventPostponed' | 'EventRescheduled';
    eventAttendanceMode: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
    location: {
        '@type': 'Place';
        name: string;
        address?: {
            '@type': 'PostalAddress';
            streetAddress?: string;
            addressLocality?: string;
            addressRegion?: string;
            postalCode?: string;
            addressCountry?: string;
        };
    } | {
        '@type': 'VirtualLocation';
        url: string;
    };
    image: string[];
    organizer: {
        '@type': 'Organization' | 'Person';
        name: string;
        url?: string;
    };
    offers?: {
        '@type': 'Offer';
        price: string;
        priceCurrency: string;
        availability: 'InStock' | 'SoldOut' | 'PreOrder';
        url: string;
        validFrom: string;
    }[];
    performer?: {
        '@type': 'Person' | 'PerformingGroup';
        name: string;
    }[];
    aggregateRating?: {
        '@type': 'AggregateRating';
        ratingValue: number;
        reviewCount: number;
    };
}

// Sitemap entry
export interface SitemapEntry {
    url: string;
    lastModified: Date;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number; // 0.0 - 1.0
}

// SEO analysis result
export interface SEOAnalysis {
    id: string;
    eventId: string;
    url: string;

    // Scores
    overallScore: number; // 0-100
    titleScore: number;
    descriptionScore: number;
    keywordsScore: number;
    imageScore: number;
    structuredDataScore: number;
    mobileScore: number;
    performanceScore: number;

    // Issues
    issues: SEOIssue[];
    warnings: SEOIssue[];
    suggestions: SEOIssue[];

    // Analysis date
    analyzedAt: Timestamp;
}

// SEO issue/recommendation
export interface SEOIssue {
    type: 'error' | 'warning' | 'suggestion';
    category: 'meta' | 'content' | 'technical' | 'performance' | 'structured_data';
    message: string;
    impact: 'high' | 'medium' | 'low';
    howToFix?: string;
}
