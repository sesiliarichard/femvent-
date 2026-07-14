/**
 * Email Sending Service
 * 
 * Feature 4 Completion: Send emails via SendGrid or Resend
 * Supports HTML templates, attachments, and tracking
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';

// Using Resend (simpler than SendGrid)
const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface EmailOptions {
    to: string | string[];
    from?: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
    }>;
}

/**
 * Send email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<string> {
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: options.from || 'Events <noreply@yourplatform.com>',
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                html: options.html,
                text: options.text,
                reply_to: options.replyTo,
                attachments: options.attachments
            })
        });

        if (!response.ok) {
            throw new Error(`Email sending failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.id; // Email ID from Resend
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

/**
 * Send workflow email
 */
export async function sendWorkflowEmail(
    workflowId: string,
    stepId: string,
    recipientEmail: string,
    templateData: any
): Promise<void> {
    try {
        // Get workflow and step details
        const workflowDoc = await getDoc(doc(db, 'emailWorkflows', workflowId));
        if (!workflowDoc.exists()) throw new Error('Workflow not found');

        const workflow = workflowDoc.data();
        const step = workflow.steps.find((s: any) => s.id === stepId);
        if (!step) throw new Error('Step not found');

        // Replace template variables
        let subject = step.subject;
        let content = step.content;

        Object.entries(templateData).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
            content = content.replace(new RegExp(placeholder, 'g'), String(value));
        });

        // Send email
        const emailId = await sendEmail({
            to: recipientEmail,
            subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="white-space: pre-wrap;">${content}</div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #6b7280;">
            <a href="{{unsubscribeUrl}}" style="color: #6b7280;">Unsubscribe</a>
          </p>
        </div>
      `,
            text: content
        });

        // Log sent email
        await addDoc(collection(db, 'emailSentLog'), {
            workflowId,
            stepId,
            recipientEmail,
            emailId,
            subject,
            status: 'sent',
            sentAt: Timestamp.now()
        });

        // Update workflow stats
        await updateDoc(doc(db, 'emailWorkflows', workflowId), {
            'stats.sent': (workflow.stats?.sent || 0) + 1
        });

    } catch (error) {
        console.error('Error sending workflow email:', error);
        throw error;
    }
}

/**
 * Send transactional email (ticket confirmation, etc.)
 */
export async function sendTransactionalEmail(
    type: 'ticket_confirmation' | 'event_reminder' | 'event_update',
    recipientEmail: string,
    data: any
): Promise<void> {
    const templates = {
        ticket_confirmation: {
            subject: `Your ticket for ${data.eventTitle}`,
            html: `
        <h1>Ticket Confirmed!</h1>
        <p>Thank you for registering for <strong>${data.eventTitle}</strong></p>
        <p><strong>Date:</strong> ${data.eventDate}</p>
        <p><strong>Location:</strong> ${data.location}</p>
        <p><strong>Ticket Type:</strong> ${data.ticketType}</p>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
      `
        },
        event_reminder: {
            subject: `Reminder: ${data.eventTitle} is coming up!`,
            html: `
        <h1>Don't forget!</h1>
        <p><strong>${data.eventTitle}</strong> starts in ${data.daysUntil} days</p>
        <p><strong>Date:</strong> ${data.eventDate}</p>
        <p><strong>Time:</strong> ${data.eventTime}</p>
      `
        },
        event_update: {
            subject: `Update: ${data.eventTitle}`,
            html: `
        <h1>Event Update</h1>
        <p>There's been an update to <strong>${data.eventTitle}</strong></p>
        <p>${data.updateMessage}</p>
      `
        }
    };

    const template = templates[type];

    await sendEmail({
        to: recipientEmail,
        subject: template.subject,
        html: template.html
    });
}
