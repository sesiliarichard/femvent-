/**
 * FEATURE 4: Automated Email Marketing Workflows
 * 
 * Step 4.1: Type Definitions for Email Workflows
 * ==============================================
 * 
 * This feature enables:
 * - Visual workflow builder for automated email sequences
 * - Trigger-based campaigns (registration, date-based, action-based)
 * - A/B testing for email campaigns
 * - Open/click tracking
 * - Template library with variables
 * - Unsubscribe management
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

// Email workflow definition
export interface EmailWorkflow {
    id: string;
    eventId: string;
    name: string; // "Welcome Series", "Reminder Campaign"
    description?: string;
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    status: 'active' | 'paused' | 'draft' | 'completed';

    // Analytics
    stats: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        bounced: number;
        unsubscribed: number;
    };

    // Settings
    settings: {
        timezone: string;
        sendWindowStart?: string; // "09:00"
        sendWindowEnd?: string; // "18:00"
        skipWeekends: boolean;
    };

    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastRunAt?: Timestamp;
}

// Workflow trigger configuration
export interface WorkflowTrigger {
    type: 'registration' | 'date_based' | 'action_based' | 'manual';
    config: {
        // For registration trigger
        onRegistration?: boolean;

        // For date-based trigger
        daysBeforeEvent?: number;
        hoursBeforeEvent?: number;
        daysAfterEvent?: number;
        specificDate?: Timestamp;

        // For action-based trigger
        action?: 'ticket_purchase' | 'event_view' | 'abandoned_cart' | 'waitlist_join';
        delayAfterAction?: number; // minutes

        // Conditions
        conditions?: TriggerCondition[];
    };
}

// Trigger conditions (who receives)
export interface TriggerCondition {
    field: string; // "ticketType", "spentAmount", "attendeeCount"
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
}

// Individual workflow step
export interface WorkflowStep {
    id: string;
    order: number;
    delay: number; // Minutes to wait after trigger or previous step
    emailTemplateId: string;
    subject: string;
    content: string; // HTML content

    // A/B testing
    abTest?: {
        enabled: boolean;
        variantA: {
            subject: string;
            content: string;
            percentage: number; // 50 = 50% get this variant
        };
        variantB: {
            subject: string;
            content: string;
            percentage: number;
        };
        winnerMetric: 'open_rate' | 'click_rate' | 'conversion_rate';
    };

    // Analytics per step
    stats: {
        sent: number;
        opened: number;
        clicked: number;
    };
}

// Email template
export interface EmailTemplate {
    id: string;
    name: string;
    category: 'welcome' | 'reminder' | 'confirmation' | 'update' | 'promotional' | 'transactional';
    subject: string;
    preheader?: string; // Email preview text
    htmlContent: string;
    textContent: string; // Plain text fallback

    // Variables available in template
    variables: TemplateVariable[];

    // Preview
    thumbnailUrl?: string;

    isPublic: boolean; // Available to all hosts
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Template variable
export interface TemplateVariable {
    key: string; // "{{eventTitle}}", "{{userName}}"
    description: string;
    example: string;
    required: boolean;
}

// Scheduled email (individual email in queue)
export interface ScheduledEmail {
    id: string;
    workflowId: string;
    stepId: string;

    // Recipient
    userId: string;
    email: string;

    // Content
    subject: string;
    htmlContent: string;
    textContent: string;

    // Scheduling
    scheduledFor: Timestamp;
    sentAt?: Timestamp;

    // Status
    status: 'queued' | 'sending' | 'sent' | 'failed' | 'bounced';

    // Analytics
    openedAt?: Timestamp;
    clickedAt?: Timestamp;
    unsubscribedAt?: Timestamp;

    // A/B test variant
    abVariant?: 'A' | 'B';

    // Error tracking
    errorMessage?: string;
    retryCount: number;

    createdAt: Timestamp;
}

// Unsubscribe management
export interface EmailUnsubscribe {
    id: string;
    email: string;
    userId?: string;
    reason?: string;
    unsubscribedFrom: 'all' | 'event' | 'workflow';
    eventId?: string;
    workflowId?: string;
    unsubscribedAt: Timestamp;
}

// Email analytics
export interface EmailAnalytics {
    id: string;
    workflowId: string;
    stepId?: string;
    period: {
        startDate: Timestamp;
        endDate: Timestamp;
    };
    metrics: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        bounced: number;
        unsubscribed: number;
        openRate: number; // percentage
        clickRate: number; // percentage
        clickToOpenRate: number; // percentage
    };
    topLinks: {
        url: string;
        clicks: number;
    }[];
    deviceBreakdown: {
        desktop: number;
        mobile: number;
        tablet: number;
    };
    generatedAt: Timestamp;
}
