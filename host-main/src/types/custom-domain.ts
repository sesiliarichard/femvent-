/**
 * FEATURE 9: Custom Domains for Events
 * 
 * Step 9.1: Type Definitions
 * ===========================
 * 
 * This feature enables:
 * - Host events on custom domains (events.yourcompany.com)
 * - DNS verification
 * - SSL certificate provisioning (Let's Encrypt)
 * - White-label branding
 * - Domain routing and middleware
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

// Custom domain configuration
export interface CustomDomain {
    id: string;
    eventId: string;
    hostId: string;

    // Domain details
    domain: string; // "events.company.com" or "conference2024.com"
    subdomain?: string; // If using subdomain

    // DNS verification
    verified: boolean;
    verificationMethod: 'cname' | 'a_record' | 'txt';
    verificationValue: string; // Expected DNS record value
    verificationKey: string; // Unique key for verification

    // SSL/TLS
    sslEnabled: boolean;
    sslStatus: 'pending' | 'provisioning' | 'active' | 'failed';
    sslProvider: 'letsencrypt' | 'cloudflare' | 'custom';
    sslCertExpiresAt?: Timestamp;
    sslAutoRenew: boolean;

    // Routing
    routingEnabled: boolean;
    targetUrl: string; // Original event URL

    // Branding
    whiteLabel: {
        enabled: boolean;
        hidePlatformBranding: boolean;
        customLogo?: string;
        customFavicon?: string;
        customCSS?: string;
    };

    // Status
    status: 'pending_verification' | 'active' | 'suspended' | 'expired';
    lastVerificationCheck?: Timestamp;

    // Analytics
    stats: {
        totalVisits: number;
        uniqueVisitors: number;
        lastAccess?: Timestamp;
    };

    // Dates
    activatedAt?: Timestamp;
    expiresAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// DNS record for verification
export interface DNSVerificationRecord {
    type: 'CNAME' | 'A' | 'TXT';
    name: string; // Hostname
    value: string; // Points to
    ttl: number; // Time to live
    priority?: number; // For MX records
}

// Domain verification status check
export interface DomainVerificationCheck {
    id: string;
    domainId: string;

    // Check results
    dnsResolved: boolean;
    expectedValue: string;
    actualValue?: string;
    matched: boolean;

    // SSL check
    sslValid: boolean;
    sslIssuer?: string;
    sslExpiresAt?: Date;

    // Error details
    errors: string[];
    warnings: string[];

    checkedAt: Timestamp;
}
