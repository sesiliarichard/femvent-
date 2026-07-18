/**
 * Invoice API - Generate Invoice
 * POST /api/invoices/generate
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { InvoiceGenerationRequest, InvoiceItem } from '@/types/tax';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            eventId,
            customerId,
            items,
            customerInfo,
            discountAmount = 0,
            notes,
        }: InvoiceGenerationRequest = req.body;

        if (!eventId || !customerId || !items || !customerInfo) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: event, error: eventError } = await supabaseAdmin
            .from('events')
            .select('title, host_id')
            .eq('id', eventId)
            .single();

        if (eventError || !event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const invoiceItems: InvoiceItem[] = [];
        let subtotal = 0;
        let totalTax = 0;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemTotal = item.quantity * item.unitPrice;
            const taxRate = 0.08; // should come from tax/calculate API
            const taxAmount = itemTotal * taxRate;

            invoiceItems.push({
                id: `item-${i + 1}`,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate,
                taxAmount: Math.round(taxAmount * 100) / 100,
                total: Math.round((itemTotal + taxAmount) * 100) / 100,
            });

            subtotal += itemTotal;
            totalTax += taxAmount;
        }

        subtotal = Math.round(subtotal * 100) / 100;
        totalTax = Math.round(totalTax * 100) / 100;
        const total = Math.round((subtotal + totalTax - discountAmount) * 100) / 100;

        // Atomic sequence — no collision risk, unlike the old timestamp-slice approach
        const { data: seqRow, error: seqError } = await supabaseAdmin.rpc('nextval_invoice_number');
        if (seqError) throw seqError;
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(seqRow).padStart(5, '0')}`;

        const now = new Date().toISOString();

        const { data: invoice, error: insertError } = await supabaseAdmin
            .from('invoices')
            .insert({
                invoice_number: invoiceNumber,
                event_id: eventId,
                event_title: event.title,
                host_id: event.host_id,
                customer_id: customerId,
                customer_email: customerInfo.email,
                items: invoiceItems,
                subtotal,
                tax_amount: totalTax,
                discount_amount: discountAmount,
                total,
                currency: 'USD',
                tax_breakdown: [
                    { jurisdiction: 'State Tax', rate: 0.08, amount: totalTax, type: 'sales_tax' },
                ],
                status: 'sent',
                issued_at: now,
                due_at: now,
                notes,
            })
            .select('id')
            .single();

        if (insertError) throw insertError;

        // Generate PDF (implement separately)

        return res.status(201).json({
            success: true,
            invoiceId: invoice.id,
            invoiceNumber,
            total,
            message: 'Invoice generated successfully',
        });
    } catch (error: any) {
        console.error('Error generating invoice:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate invoice' });
    }
}