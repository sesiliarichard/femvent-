/**
 * Utility Functions
 * 
 * Shared utilities used across enterprise features
 */

/**
 * Get or create session ID for tracking
 * Used by: Affiliate tracking, Seat booking, A/B testing
 */
export function getSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem('session-id');
    if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('session-id', sessionId);
    }
    return sessionId;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
    }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 10): string {
    return Math.random().toString(36).substring(2, length + 2).toUpperCase();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
}

/**
 * Get query parameter
 */
export function getQueryParam(param: string): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * 100) / 100;
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}
