/**
 * FEATURE 7: Event Merchandising
 * 
 * Step 7.1: Type Definitions
 * ===========================
 * 
 * This feature enables:
 * - Sell event-related products (t-shirts, books, etc.)
 * - Product catalog per event
 * - Inventory management
 * - Size/color variants
 * - Shipping options
 * - Merch revenue tracking
 * - Bundle with tickets
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

// Product in event store
export interface EventProduct {
    id: string;
    eventId: string;

    // Basic info
    name: string;
    description: string;
    category: 'apparel' | 'accessories' | 'books' | 'digital' | 'other';

    // Pricing
    basePrice: number;
    currency: string;

    // Media
    images: string[]; // Image URLs
    primaryImage: string;

    // Variants (sizes, colors, etc.)
    hasVariants: boolean;
    variants: ProductVariant[];

    // Inventory
    trackInventory: boolean;
    totalStock?: number;
    lowStockThreshold?: number;

    // Availability
    available: boolean;
    availableFrom?: Timestamp;
    availableUntil?: Timestamp;

    // Shipping
    requiresShipping: boolean;
    weight?: number; // in kg for shipping calculation
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };

    // Stats
    stats: {
        totalSold: number;
        totalRevenue: number;
        averageRating?: number;
        reviewCount?: number;
    };

    // SEO
    slug?: string;
    metaDescription?: string;

    // Dates
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Product variant (size, color, etc.)
export interface ProductVariant {
    id: string;
    sku: string; // Stock keeping unit
    name: string; // "Small / Red"
    attributes: {
        size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
        color?: string;
        [key: string]: any; // Custom attributes
    };
    priceAdjustment: number; // +/- from base price
    stock: number;
    sold: number;
    available: boolean;
    imageUrl?: string; // Variant-specific image
}

// Merch order
export interface MerchOrder {
    id: string;
    eventId: string;
    userId: string;

    // Items
    items: MerchOrderItem[];

    // Financial
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;

    // Shipping
    shippingAddress: {
        name: string;
        email: string;
        phone: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };

    shippingMethod: 'standard' | 'express' | 'pickup';
    trackingNumber?: string;
    carrier?: string;

    // Status
    status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

    // Payment
    paymentId?: string;
    paymentMethod?: string;

    // Fulfillment
    processedAt?: Timestamp;
    shippedAt?: Timestamp;
    deliveredAt?: Timestamp;

    // Notes
    customerNotes?: string;
    internalNotes?: string;

    // Dates
    orderedAt: Timestamp;
    updatedAt: Timestamp;
}

// Merch order item
export interface MerchOrderItem {
    id: string;
    productId: string;
    variantId?: string;

    name: string;
    variant?: string; // "Large / Blue"

    quantity: number;
    unitPrice: number;
    total: number;

    imageUrl?: string;
}

// Shipping rate
export interface ShippingRate {
    id: string;
    name: string; // "Standard Shipping", "Express"
    description?: string;

    // Pricing
    type: 'flat' | 'calculated' | 'free';
    flatRate?: number; // If type is 'flat'

    // Free shipping threshold
    freeShippingMinimum?: number;

    // Calculation (if type is 'calculated')
    baseRate?: number;
    perKgRate?: number;

    // Delivery time
    estimatedDays: {
        min: number;
        max: number;
    };

    // Availability
    countries: string[]; // Empty array = all countries
    active: boolean;
}

// Inventory alert
export interface InventoryAlert {
    id: string;
    productId: string;
    variantId?: string;

    type: 'low_stock' | 'out_of_stock' | 'back_in_stock';
    currentStock: number;
    threshold?: number;

    notified: boolean;
    notifiedAt?: Timestamp;

    createdAt: Timestamp;
}
