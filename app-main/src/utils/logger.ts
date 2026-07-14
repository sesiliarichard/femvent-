/**
 * Comprehensive Logging System for Events App (React Native)
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

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
  screen?: string;
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
  private currentScreen?: string;

  constructor(app: string, platform: 'web' | 'mobile' | 'server' = 'mobile') {
    this.app = app;
    this.platform = platform;
    this.sessionId = this.generateSessionId();
    this.isDevelopment = __DEV__;
    this.enableFirestoreLogging = !this.isDevelopment || process.env.EXPO_PUBLIC_ENABLE_FIRESTORE_LOGS === 'true';
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

  setScreen(screen: string) {
    this.currentScreen = screen;
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
      await addDoc(collection(db, 'applicationLogs'), {
        ...entry,
        timestamp: Timestamp.fromDate(entry.timestamp),
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Failed to log to Firestore:', error);
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
      screen?: string;
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
      screen: options?.screen || this.currentScreen,
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

  debug(message: string, options?: { context?: string; operation?: string; metadata?: Record<string, any>; screen?: string }) {
    return this.createLogEntry('debug', message, options);
  }

  info(message: string, options?: { context?: string; operation?: string; metadata?: Record<string, any>; screen?: string }) {
    return this.createLogEntry('info', message, options);
  }

  warn(message: string, options?: { context?: string; operation?: string; metadata?: Record<string, any>; screen?: string }) {
    return this.createLogEntry('warn', message, options);
  }

  error(message: string, options?: { context?: string; operation?: string; metadata?: Record<string, any>; error?: Error; screen?: string }) {
    return this.createLogEntry('error', message, options);
  }

  logUserAction(action: string, metadata?: Record<string, any>) {
    return this.info(`User action: ${action}`, {
      context: 'user_action',
      operation: action,
      metadata,
    });
  }

  logNavigation(from: string, to: string, metadata?: Record<string, any>) {
    return this.info(`Navigation: ${from} → ${to}`, {
      context: 'navigation',
      operation: 'navigate',
      metadata: {
        from,
        to,
        ...metadata,
      },
    });
  }

  logScreenView(screen: string, metadata?: Record<string, any>) {
    this.setScreen(screen);
    return this.info(`Screen view: ${screen}`, {
      context: 'navigation',
      operation: 'screen_view',
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

export const logger = new Logger('events-app', 'mobile');
export { Logger };

