/**
 * Centralized Error Tracking Utility for Events App (React Native)
 */

import * as Sentry from '@sentry/react-native';

export interface UserContext {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

export function setUserContext(user: UserContext | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    tags: {
      ...context,
      trackedBy: 'errorTracking',
      app: 'events-app',
    },
    extra: context,
  });
}

export function trackMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level,
    tags: {
      ...context,
      trackedBy: 'errorTracking',
      app: 'events-app',
    },
    extra: context,
  });
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  Sentry.captureMessage(`Event: ${eventName}`, {
    level: 'info',
    tags: {
      eventType: 'user_action',
      eventName,
      app: 'events-app',
    },
    extra: properties,
  });
}

export function trackPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
  Sentry.captureMessage(`Performance: ${operation}`, {
    level: 'info',
    tags: {
      eventType: 'performance',
      operation,
      app: 'events-app',
    },
    extra: {
      duration,
      ...metadata,
    },
  });
}

export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      trackError(error as Error, {
        function: fn.name,
        context,
        args: JSON.stringify(args),
      });
      throw error;
    }
  }) as T;
}

export function addBreadcrumb(message: string, category: string = 'user', data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

