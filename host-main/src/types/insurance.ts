/**
 * FEATURE 13: Event Insurance
 * 
 * Type Definitions
 * ================
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps
export interface EventInsurance {
    id: string;
    eventId: string;
    userId: string;

    // Policy details
    policyNumber: string;
    provider: 'event_helper' | 'wedsafe' | 'custom';
    coverageType: 'cancellation' | 'liability' | 'weather' | 'comprehensive';

    // Coverage amount
    coverageAmount: number;
    premium: number;
    currency: string;

    // Coverage period
    effectiveFrom: Timestamp;
    effectiveUntil: Timestamp;

    // Policy details
    policyDocument?: string; // PDF URL
    terms: string;

    // Status
    status: 'quote' | 'pending' | 'active' | 'expired' | 'claimed' | 'cancelled';

    // Claim
    claimFiled?: boolean;
    claimAmount?: number;
    claimStatus?: 'pending' | 'approved' | 'denied' | 'paid';
    claimFiledAt?: Timestamp;

    purchasedAt: Timestamp;
    createdAt: Timestamp;
}

export interface InsuranceQuote {
    id: string;
    eventId: string;

    coverageType: string;
    eventCost: number;
    attendeeCount: number;

    // Quote details
    premium: number;
    coverageAmount: number;
    deductible: number;

    validUntil: Timestamp;
    createdAt: Timestamp;
}
