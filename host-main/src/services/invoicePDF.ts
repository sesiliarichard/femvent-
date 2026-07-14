/**
 * Invoice PDF Generation Service
 * 
 * Feature 3 Completion: Generate professional PDF invoices
 * Using jsPDF library for PDF creation
 */

import { jsPDF } from 'jspdf';
import type { Invoice } from '@/types/tax';

export async function generateInvoicePDF(invoice: Invoice): Promise<string> {
    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text('EVENT PLATFORM', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('123 Event Street', 20, 28);
    doc.text('New York, NY 10001', 20, 33);
    doc.text('contact@eventplatform.com', 20, 38);

    // Invoice Title
    doc.setFontSize(28);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 140, 20);

    // Invoice Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 140, 30);
    doc.text(`Date: ${invoice.issuedAt.toDate().toLocaleDateString()}`, 140, 36);
    doc.text(`Due Date: ${invoice.dueAt.toDate().toLocaleDateString()}`, 140, 42);

    // Customer Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Bill To:', 20, 55);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(invoice.customerEmail, 20, 62);

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 75, 190, 75);

    // Table Header
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 80, 170, 8, 'F');

    doc.text('Description', 22, 85);
    doc.text('Qty', 120, 85);
    doc.text('Price', 140, 85);
    doc.text('Total', 170, 85, { align: 'right' });

    // Line Items
    let yPos = 95;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    invoice.items.forEach((item, index) => {
        doc.text(item.description, 22, yPos);
        doc.text(item.quantity.toString(), 120, yPos);
        doc.text(`$${item.unitPrice.toFixed(2)}`, 140, yPos);
        doc.text(`$${item.total.toFixed(2)}`, 188, yPos, { align: 'right' });

        yPos += 8;

        // Add page break if needed
        if (yPos > 250 && index < invoice.items.length - 1) {
            doc.addPage();
            yPos = 20;
        }
    });

    // Totals Section
    yPos += 10;
    doc.line(120, yPos, 190, yPos);
    yPos += 8;

    // Subtotal
    doc.text('Subtotal:', 120, yPos);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, 188, yPos, { align: 'right' });
    yPos += 6;

    // Tax breakdown
    invoice.taxBreakdown.forEach(tax => {
        doc.text(`${tax.jurisdiction} (${(tax.rate * 100).toFixed(1)}%):`, 120, yPos);
        doc.text(`$${tax.amount.toFixed(2)}`, 188, yPos, { align: 'right' });
        yPos += 6;
    });

    // Discount
    if (invoice.discountAmount > 0) {
        doc.setTextColor(0, 150, 0);
        doc.text('Discount:', 120, yPos);
        doc.text(`-$${invoice.discountAmount.toFixed(2)}`, 188, yPos, { align: 'right' });
        doc.setTextColor(60, 60, 60);
        yPos += 6;
    }

    // Total
    yPos += 2;
    doc.setDrawColor(79, 70, 229);
    doc.line(120, yPos, 190, yPos);
    yPos += 8;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Total:', 120, yPos);
    doc.text(`$${invoice.total.toFixed(2)}`, 188, yPos, { align: 'right' });

    // Payment Status
    yPos += 10;
    doc.setFontSize(10);
    if (invoice.paidAt) {
        doc.setTextColor(0, 150, 0);
        doc.text(`PAID - ${invoice.paidAt.toDate().toLocaleDateString()}`, 120, yPos);
    } else {
        doc.setTextColor(220, 38, 38);
        doc.text('UNPAID', 120, yPos);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    doc.text('Questions? Contact us at support@eventplatform.com', 105, 285, { align: 'center' });

    // Generate PDF as data URL
    const pdfData = doc.output('dataurlstring');

    return pdfData;
}

// Alternative: Generate and upload to Firebase Storage
export async function generateAndUploadInvoicePDF(
    invoice: Invoice,
    storage: any // Firebase storage instance
): Promise<string> {
    const pdfDataUrl = await generateInvoicePDF(invoice);

    // Convert data URL to blob
    const base64 = pdfDataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });

    // Upload to Firebase Storage
    const fileName = `invoices/${invoice.invoiceNumber}.pdf`;
    const fileRef = storage.ref().child(fileName);

    await fileRef.put(blob);
    const downloadURL = await fileRef.getDownloadURL();

    return downloadURL;
}
