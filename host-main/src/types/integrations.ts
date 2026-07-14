/**
 * FEATURE 16: OAuth Integrations
 * 
 * Complete OAuth integration setup for major platforms
 * =====================================================
 * 
 * Integrations:
 * 1. Google Calendar - Auto-add events to calendar
 * 2. Mailchimp - Sync attendees to mailing list
 * 3. Stripe Connect - Direct payouts to hosts
 * 4. Zoom - OAuth for meeting creation
 * 5. Slack - Send event notifications
 * 6. Facebook Pixel - Track conversions
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

// OAuth connection
export interface OAuthConnection {
    id: string;
    userId: string;
    provider: 'google' | 'mailchimp' | 'stripe' | 'zoom' | 'slack' | 'facebook';

    // Tokens
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Timestamp;

    // Provider-specific data
    providerUserId: string;
    providerEmail?: string;
    scope: string[];

    // Status
    status: 'active' | 'expired' | 'revoked';

    // Metadata
    accountName?: string;
    metadata?: any; // Provider-specific metadata

    // Dates
    connectedAt: Timestamp;
    lastUsedAt?: Timestamp;
    updatedAt: Timestamp;
}

// Google Calendar integration
export interface GoogleCalendarIntegration {
    enabled: boolean;
    calendarId: string;
    autoAddEvents: boolean;
    sendReminders: boolean;
    oauthConnectionId: string;
}

// Mailchimp integration
export interface MailchimpIntegration {
    enabled: boolean;
    listId: string;
    apiKey: string;
    autoSyncAttendees: boolean;
    tagAttendees: boolean;
    defaultTags: string[];
    oauthConnectionId?: string;
}

// Stripe Connect
export interface StripeConnectAccount {
    id: string;
    userId: string;
    stripeAccountId: string;

    // Account status
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;

    // Settings
    defaultCurrency: string;
    country: string;

    // Onboarding
    onboardingComplete: boolean;
    onboardingUrl?: string;

    connectedAt: Timestamp;
    updatedAt: Timestamp;
}

// Zoom OAuth
export interface ZoomOAuthConnection {
    enabled: boolean;
    accountId: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Timestamp;
}

// Integration event
export interface IntegrationEvent {
    id: string;
    userId: string;
    provider: string;
    action: string; // "event_created", "attendee_synced", etc.
    status: 'success' | 'failed';
    errorMessage?: string;
    metadata?: any;
    occurredAt: Timestamp;
}
