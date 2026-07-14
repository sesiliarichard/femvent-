/**
 * FEATURE 3: Tax & Invoicing System
 * 
 * Step 3.1: Type Definitions for Tax and Invoicing
 * ================================================
 * 
 * This feature handles:
 * - Automatic tax calculation based on location
 * - Professional PDF invoice generation
 * - Tax reports for event hosts
 * - Multi-region tax support (Sales Tax, VAT, GST)
 * - Stripe Tax integration for accuracy
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

// Tax rate configuration
export interface TaxRate {
    id: string;
    country: string; // "US", "UK", "CA"
    state?: string; // For US: "NY", "CA"
    city?: string; // Optional city-level tax
    rate: number; // 0.08 = 8%
    name: string; // "Sales Tax", "VAT", "GST"
    type: 'sales_tax' | 'vat' | 'gst' | 'other';
    validFrom: Timestamp;
    validUntil?: Timestamp; // null = indefinite
    isActive: boolean;
    createdAt: Timestamp;
}

// Invoice document
export interface Invoice {
    id: string;
    invoiceNumber: string; // "INV-2024-00001"
    eventId: string;
    eventTitle: string;
    hostId: string; // Event organizer
    customerId: string; // Ticket purchaser
    customerEmail: string;

    // Line items
    items: InvoiceItem[];

    // Financial details
    subtotal: number; // Before tax
    taxAmount: number;
    discountAmount: number;
    total: number;
    currency: string; // "USD", "GBP", "EUR"

    // Tax breakdown
    taxBreakdown: TaxBreakdown[];

    // Status & dates
    status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'refunded';
    issuedAt: Timestamp;
    dueAt: Timestamp;
    paidAt?: Timestamp;

    // Payment details
    paymentMethod?: string;
    transactionId?: string;

    // PDF
    pdfUrl?: string;
    pdfGeneratedAt?: Timestamp;

    // Metadata
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Invoice line item
export interface InvoiceItem {
    id: string;
    description: string; // "VIP Ticket - Tech Conference 2024"
    quantity: number;
    unitPrice: number;
    taxRate: number;
    taxAmount: number;
    total: number; // (quantity * unitPrice) + taxAmount - discount
    discountAmount?: number;
}

// Tax breakdown by jurisdiction
export interface TaxBreakdown {
    jurisdiction: string; // "New York State", "NYC", "Federal"
    rate: number;
    amount: number;
    type: 'sales_tax' | 'vat' | 'gst' | 'other';
}

// Tax calculation request
export interface TaxCalculationRequest {
    amount: number;
    country: string;
    state?: string;
    city?: string;
    zipCode?: string;
    productType?: 'ticket' | 'merchandise';
}

// Tax calculation result
export interface TaxCalculationResult {
    subtotal: number;
    taxAmount: number;
    total: number;
    breakdown: TaxBreakdown[];
    appliedRates: TaxRate[];
}

// Invoice generation request
export interface InvoiceGenerationRequest {
    eventId: string;
    customerId: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
    }[];
    customerInfo: {
        name: string;
        email: string;
        address?: {
            line1: string;
            line2?: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        };
    };
    discountAmount?: number;
    notes?: string;
}

// PDF generation options
export interface PDFOptions {
    includeHeader: boolean;
    includeLogo: boolean;
    includeFooter: boolean;
    logoUrl?: string;
    companyName?: string;
    companyAddress?: string;
    customTemplate?: string;
}

// Tax report for hosts
export interface TaxReport {
    id: string;
    hostId: string;
    period: {
        startDate: Timestamp;
        endDate: Timestamp;
    };
    totalRevenue: number;
    totalTaxCollected: number;
    taxByJurisdiction: {
        [jurisdiction: string]: {
            revenue: number;
            tax: number;
            transactionCount: number;
        };
    };
    invoiceCount: number;
    generatedAt: Timestamp;
    pdfUrl?: string;
}
