/**
 * Comprehensive Logging System for Admin Dashboard
 */

import { supabase } from '../services/supabase';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  operation?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  app: string;
  platform: 'web' | 'mobile' | 'server';
  sessionId?: string;
  url?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private app: string;
  private platform: 'web' | 'mobile' | 'server';
  private sessionId: string;
  private userId?: string;
  private userEmail?: string;
  private userRole?: string;
  private isDevelopment: boolean;
  private enableFirestoreLogging: boolean;

  constructor(app: string, platform: 'web' | 'mobile' | 'server' = 'web') {
    this.app = app;
    this.platform = platform;
    this.sessionId = this.generateSessionId();
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.enableFirestoreLogging = !this.isDevelopment || process.env.NEXT_PUBLIC_ENABLE_FIRESTORE_LOGS === 'true';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUser(userId?: string, email?: string, role?: string) {
    this.userId = userId;
    this.userEmail = email;
    this.userRole = role;
  }

  clearUser() {
    this.userId = undefined;
    this.userEmail = undefined;
    this.userRole = undefined;
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case 'debug':
        return console.debug;
      case 'info':
        return console.info;
      case 'warn':
        return console.warn;
      case 'error':
        return console.error;
      default:
        return console.log;
    }
  }

  private formatConsoleMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.level.toUpperCase()}]`,
      entry.context ? `[${entry.context}]` : '',
      entry.operation ? `[${entry.operation}]` : '',
      entry.message,
    ].filter(Boolean);

    return parts.join(' ');
  }

  private async logToFirestore(entry: LogEntry): Promise<void> {
    if (!this.enableFirestoreLogging) return;

    try {
      const { error } = await supabase.from('application_logs').insert({
        level: entry.level,
        message: entry.message,
        context: entry.context,
        operation: entry.operation,
        user_id: entry.userId,
        user_email: entry.userEmail,
        user_role: entry.userRole,
        app: entry.app,
        platform: entry.platform,
        metadata: {
          ...entry.metadata,
          sessionId: entry.sessionId,
          url: entry.url,
          error: entry.error,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to log to Supabase:', error);
    }
  }

  private async createLogEntry(
    level: LogLevel,
    message: string,
    options?: {
      context?: string;
      operation?: string;
      metadata?: Record<string, any>;
      error?: Error;
      url?: string;
    }
  ): Promise<void> {
    const entry: LogEntry = {
      level,
      message,
      context: options?.context,
      operation: options?.operation,
      userId: this.userId,
      userEmail: this.userEmail,
      userRole: this.userRole,
      metadata: options?.metadata,
      timestamp: new Date(),
      app: this.app,
      platform: this.platform,
      sessionId: this.sessionId,
      url: options?.url || (typeof window !== 'undefined' ? window.location.href : undefined),
      error: options?.error
        ? {
            name: options.error.name,
            message: options.error.message,
            stack: options.error.stack,
          }
        : undefined,
    };

    if (this.isDevelopment) {
      const consoleMethod = this.getConsoleMethod(level);
      const formattedMessage = this.formatConsoleMessage(entry);
      if (options?.error) {
        consoleMethod(formattedMessage, options.error, options.metadata || {});
      } else {
        consoleMethod(formattedMessage, options?.metadata || {});
      }
    }

    await this.logToFirestore(entry);
  }

  debug(message: string, options?: { context?: string; operation?: string; metadata?: Record<string, any> }) {
    return this.createLogEntry('debug', message, options);
  }

  info(message: string, options?: { context?: string; operation?: string; metadata?: Record<string, any> }) {
    return this.createLogEntry('info', message, options);
  }

  warn(message: string, options?: { context?: string; operation?: string; metadata?: Record<string, any> }) {
    return this.createLogEntry('warn', message, options);
  }

  error(message: string, options?: { context?: string; operation?: string; metadata?: Record<string, any>; error?: Error }) {
    return this.createLogEntry('error', message, options);
  }

  logUserAction(action: string, metadata?: Record<string, any>) {
    return this.info(`User action: ${action}`, {
      context: 'user_action',
      operation: action,
      metadata,
    });
  }

  logApiCall(endpoint: string, method: string, statusCode?: number, duration?: number, metadata?: Record<string, any>) {
    return this.info(`API ${method} ${endpoint}`, {
      context: 'api_call',
      operation: `${method.toLowerCase()}_${endpoint}`,
      metadata: {
        endpoint,
        method,
        statusCode,
        duration,
        ...metadata,
      },
    });
  }

  logDatabaseOperation(operation: string, collection: string, metadata?: Record<string, any>) {
    return this.info(`Database ${operation}`, {
      context: 'database',
      operation: `${operation}_${collection}`,
      metadata: {
        operation,
        collection,
        ...metadata,
      },
    });
  }

  logPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
    return this.info(`Performance: ${operation}`, {
      context: 'performance',
      operation,
      metadata: {
        duration,
        ...metadata,
      },
    });
  }

  logAdminAction(action: string, targetUserId?: string, metadata?: Record<string, any>) {
    return this.info(`Admin action: ${action}`, {
      context: 'admin_action',
      operation: action,
      metadata: {
        targetUserId,
        ...metadata,
      },
    });
  }

  logAuthEvent(event: string, metadata?: Record<string, any>) {
    return this.info(`Auth event: ${event}`, {
      context: 'authentication',
      operation: event,
      metadata,
    });
  }

  logEventOperation(operation: string, eventId: string, metadata?: Record<string, any>) {
    return this.info(`Event ${operation}`, {
      context: 'event',
      operation,
      metadata: {
        eventId,
        ...metadata,
      },
    });
  }

  logPaymentOperation(operation: string, paymentId?: string, amount?: number, metadata?: Record<string, any>) {
    return this.info(`Payment ${operation}`, {
      context: 'payment',
      operation,
      metadata: {
        paymentId,
        amount,
        ...metadata,
      },
    });
  }
}

export const logger = new Logger('admin', 'web');
export { Logger };

