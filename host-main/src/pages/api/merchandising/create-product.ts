/**
 * Merchandising API - Create Product
 * POST /api/merchandising/create-product
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            eventId,
            name,
            description,
            category,
            basePrice,
            hasVariants,
            variants,
            trackInventory,
            totalStock,
            requiresShipping,
            images,
            primaryImage,
        } = req.body;

        if (!eventId || !name || basePrice == null) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: product, error } = await supabaseAdmin
            .from('event_products')
            .insert({
                event_id: eventId,
                name,
                description: description || '',
                category: category || 'other',
                base_price: Number(basePrice),
                currency: 'USD',
                images: images || [],
                primary_image: primaryImage || '',
                has_variants: hasVariants || false,
                variants: variants || [],
                track_inventory: trackInventory !== false,
                total_stock: Number(totalStock) || 0,
                low_stock_threshold: 10,
                available: true,
                requires_shipping: requiresShipping !== false,
                weight: 0,
                total_sold: 0,
                total_revenue: 0,
                average_rating: 0,
                review_count: 0,
            })
            .select('id')
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            productId: product.id,
            message: 'Product created successfully',
        });
    } catch (error: any) {
        console.error('Error creating product:', error);
        return res.status(500).json({ error: error.message });
    }
}