/**
 * FEATURE 5: Affiliate & Referral Tracking
 * 
 * Step 5.1: Type Definitions
 * ===========================
 * 
 * This feature enables:
 * - Affiliate program management
 * - Unique referral codes per affiliate
 * - Click tracking and conversion attribution
 * - Commission calculation and payouts
 * - Affiliate dashboard with analytics
 * - Multi-tier affiliate programs
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

// Affiliate account
export interface Affiliate {
    id: string;
    userId: string;

    // Identity
    name: string;
    email: string;
    company?: string;

    // Referral code
    code: string; // Unique: "JOHN2024"
    customCode?: string; // Custom vanity code

    // Permissions
    eventIds: string[]; // Events they can promote (empty = all)

    // Commission structure
    commissionType: 'percentage' | 'fixed';
    commissionRate: number; // 0.10 = 10% or $10 per sale
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';

    // Stats (cached for performance)
    stats: {
        totalClicks: number;
        totalConversions: number;
        totalRevenue: number;
        totalCommission: number;
        conversionRate: number; // percentage
        averageOrderValue: number;
    };

    // Payout information
    payoutInfo: {
        method: 'paypal' | 'bank_transfer' | 'stripe';
        email?: string; // For PayPal
        accountNumber?: string; // For bank
        routingNumber?: string;
        stripeAccountId?: string;
    };

    // Status
    status: 'active' | 'suspended' | 'pending_approval';
    suspensionReason?: string;

    // Dates
    approvedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Affiliate click (tracking)
export interface AffiliateClick {
    id: string;
    affiliateId: string;
    referralCode: string;

    // Event context
    eventId?: string; // If clicked on specific event page

    // Visitor info
    userId?: string; // If logged in
    sessionId: string; // Browser session
    ipAddress: string;
    userAgent: string;

    // Referrer
    referrer?: string; // Where they came from
    landingPage: string; // Where they landed

    // UTM parameters
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;

    // Conversion tracking
    converted: boolean;
    ticketId?: string; // If converted
    orderId?: string;
    revenue?: number; // Sale amount
    commissionEarned?: number;
    convertedAt?: Timestamp;

    // Timestamps
    clickedAt: Timestamp;
}

// Commission record
export interface Commission {
    id: string;
    affiliateId: string;
    clickId: string;

    // Transaction details
    orderId: string;
    ticketId: string;
    eventId: string;
    customerId: string;

    // Financial
    orderTotal: number;
    commissionRate: number;
    commissionAmount: number;
    currency: string;

    // Status
    status: 'pending' | 'approved' | 'paid' | 'cancelled';

    // Payout
    payoutId?: string;
    paidAt?: Timestamp;

    // Dates
    earnedAt: Timestamp;
    approvedAt?: Timestamp;
}

// Payout batch
export interface Payout {
    id: string;
    affiliateId: string;

    // Payment details
    amount: number;
    currency: string;
    method: 'paypal' | 'bank_transfer' | 'stripe';

    // Included commissions
    commissionIds: string[];
    commissionCount: number;

    // Status
    status: 'pending' | 'processing' | 'completed' | 'failed';

    // Payment details
    transactionId?: string; // External payment ID
    paymentDetails?: any;

    // Dates
    requestedAt: Timestamp;
    processedAt?: Timestamp;
    completedAt?: Timestamp;

    // Error tracking
    errorMessage?: string;
}

// Affiliate tier configuration
export interface AffiliateTier {
    id: string;
    name: 'bronze' | 'silver' | 'gold' | 'platinum';
    commissionRate: number;
    requirements: {
        minimumSales?: number;
        minimumRevenue?: number;
        minimumConversions?: number;
    };
    benefits: string[];
    color: string; // For UI display
}

// Referral link analytics
export interface ReferralAnalytics {
    id: string;
    affiliateId: string;
    period: {
        startDate: Timestamp;
        endDate: Timestamp;
    };
    metrics: {
        clicks: number;
        conversions: number;
        revenue: number;
        commission: number;
        conversionRate: number;
        averageOrderValue: number;
    };
    topEvents: {
        eventId: string;
        eventTitle: string;
        clicks: number;
        conversions: number;
        revenue: number;
    }[];
    trafficSources: {
        source: string;
        clicks: number;
        conversions: number;
    }[];
    generatedAt: Timestamp;
}
