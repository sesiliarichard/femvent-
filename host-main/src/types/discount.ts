/**
 * Discount Code Types
 * Database schema for discount codes system
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

export interface DiscountCode {
    id: string;
    eventId: string;
    code: string; // Uppercase, unique: "EARLY2024", "FRIEND20"
    type: 'percentage' | 'fixed' | 'free';
    value: number; // 20 (for 20%) or 50 (for $50 off)
    maxUses: number | null; // null = unlimited
    currentUses: number;
    startDate: Timestamp;
    endDate: Timestamp;
    minimumPurchase?: number; // Minimum order value
    applicableTicketTypes?: string[]; // null = all ticket types
    status: 'active' | 'expired' | 'disabled';
    createdBy: string; // UserId
    affiliateId?: string; // For tracking affiliate codes
    description?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface DiscountUsage {
    id: string;
    discountCodeId: string;
    code: string;
    userId: string;
    eventId: string;
    ticketId: string;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    usedAt: Timestamp;
}

export interface DiscountValidationResult {
    valid: boolean;
    error?: string;
    discount?: {
        code: string;
        type: 'percentage' | 'fixed' | 'free';
        value: number;
        discountAmount: number;
        finalPrice: number;
    };
}
