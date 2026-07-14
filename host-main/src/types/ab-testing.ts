/**
 * FEATURE 8: A/B Testing for Event Pages
 * 
 * Step 8.1: Type Definitions
 * ===========================
 * 
 * This feature enables:
 * - Create page variants (A vs B)
 * - Split traffic between variants
 * - Track conversion rates
 * - Statistical significance calculator
 * - Auto-declare winner
 * - Test headlines, images, pricing, CTAs
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

// A/B test configuration
export interface ABTest {
    id: string;
    eventId: string;

    // Test details
    name: string;
    description?: string;
    hypothesis: string; // "Changing the CTA to 'Join Now' will increase conversions"

    // Test type
    testType: 'headline' | 'image' | 'price' | 'cta' | 'layout' | 'multi_variant';

    // Variants
    variants: ABTestVariant[];

    // Traffic allocation
    trafficAllocation: {
        [variantId: string]: number; // Percentage (total must = 100)
    };

    // Goal/Success metric
    goalMetric: 'registration' | 'ticket_purchase' | 'page_time' | 'click_through';
    goalValue?: number; // For specific goals

    // Statistical settings
    confidenceLevel: number; // 95, 99, etc.
    minimumSampleSize: number; // Minimum visitors per variant

    // Status
    status: 'draft' | 'running' | 'paused' | 'completed';
    winner?: string; // Variant ID

    // Results
    results: {
        totalVisitors: number;
        totalConversions: number;
        conversionRate: number;
        statisticalSignificance: number; // p-value
        confidenceInterval: {
            lower: number;
            upper: number;
        };
    };

    // Dates
    startedAt?: Timestamp;
    endedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Test variant
export interface ABTestVariant {
    id: string;
    name: string; // "Control", "Variant A", "Variant B"
    isControl: boolean;

    // Changes being tested
    changes: VariantChanges;

    // Performance data
    visitors: number;
    conversions: number;
    conversionRate: number;

    // Statistical metrics
    impressions: number;
    clicks: number;
    bounceRate: number;
    averageTimeOnPage: number; // seconds
}

// Specific changes in variant
export interface VariantChanges {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaColor?: string;
    heroImage?: string;
    price?: number;
    layout?: 'default' | 'split' | 'carousel';
    customCSS?: string;
    customHTML?: string;
}

// Visitor assignment
export interface ABTestAssignment {
    id: string;
    testId: string;
    variantId: string;
    userId?: string;
    sessionId: string;

    // Tracking
    converted: boolean;
    conversionValue?: number;
    convertedAt?: Timestamp;

    // Engagement
    pageViews: number;
    timeOnPage: number; // seconds
    clickedCTA: boolean;
    bounced: boolean;

    assignedAt: Timestamp;
}

// Test report
export interface ABTestReport {
    id: string;
    testId: string;

    // Summary
    summary: {
        duration: number; // days
        totalVisitors: number;
        totalConversions: number;
        winner: string; // Variant name
        improvement: number; // Percentage improvement over control
    };

    // Variant comparison
    variantResults: {
        variantId: string;
        variantName: string;
        visitors: number;
        conversions: number;
        conversionRate: number;
        improvement: number; // vs control
        statisticalSignificance: number;
        confidenceInterval: [number, number];
    }[];

    // Timeline
    timeline: {
        date: string;
        variants: {
            [variantId: string]: {
                visitors: number;
                conversions: number;
                conversionRate: number;
            };
        };
    }[];

    // Insights
    insights: string[];
    recommendations: string[];

    generatedAt: Timestamp;
}
