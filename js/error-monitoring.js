/**
 * Error Monitoring System
 * Comprehensive error tracking and performance monitoring using Sentry
 */

import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Initialize Sentry error monitoring
 * Only runs in production environments
 */
export function initErrorMonitoring() {
  // Only initialize in production
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('[Error Monitoring] Disabled in development environment');
    return;
  }

  try {
    Sentry.init({
      // TODO: Replace with your Sentry DSN from dashboard
      dsn: 'YOUR_SENTRY_DSN_HERE',

      // Environment detection
      environment: window.location.hostname.includes('staging') ? 'staging' : 'production',

      // Release tracking (update with your versioning system)
      release: 'eyes-of-azrael@1.0.0',

      // Integrations
      integrations: [
        new BrowserTracing({
          // Track navigation and user interactions
          tracingOrigins: ['localhost', window.location.hostname],
          routingInstrumentation: Sentry.routingInstrumentation,
        }),
        new Sentry.Replay({
          // Privacy settings for session replay
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: 0.2, // Capture 20% of transactions for performance monitoring

      // Session Replay
      replaysSessionSampleRate: 0.1, // Capture 10% of normal sessions
      replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors

      // Filter and enhance events before sending
      beforeSend(event, hint) {
        // Don't send errors from browser extensions
        if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
          frame => frame.filename && (
            frame.filename.includes('chrome-extension://') ||
            frame.filename.includes('moz-extension://') ||
            frame.filename.includes('safari-extension://')
          )
        )) {
          console.log('[Error Monitoring] Ignoring extension error');
          return null;
        }

        // Add Firebase user context if available
        try {
          if (window.firebase && firebase.auth && firebase.auth().currentUser) {
            const user = firebase.auth().currentUser;
            event.user = {
              id: user.uid,
              email: user.email,
              username: user.displayName || 'Anonymous',
            };
          }
        } catch (err) {
          console.warn('[Error Monitoring] Could not add user context:', err);
        }

        // Add custom application context
        event.contexts = {
          ...event.contexts,
          app: {
            route: window.location.hash || window.location.pathname,
            theme: document.body.className,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            userAgent: navigator.userAgent,
          },
          performance: {
            memory: performance.memory ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            } : 'not available',
          }
        };

        return event;
      },

      // Ignore common non-critical errors
      ignoreErrors: [
        // Browser internal errors
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',

        // Promise rejections that aren't actual errors
        'Non-Error promise rejection captured',
        'Non-Error exception captured',

        // Network errors (handled separately)
        'AbortError',
        'Network request failed',
        'Failed to fetch',
        'NetworkError',
        'Load failed',

        // Browser navigation
        'Navigation cancelled',
        'Document is not focused',

        // Third-party scripts
        'Script error.',
        'undefined is not an object',

        // Ad blockers
        'AdBlocker',
        'adsbygoogle',
      ],

      // Deny list for URLs to ignore
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,

        // Third-party scripts
        /google-analytics\.com/i,
        /googletagmanager\.com/i,
        /facebook\.net/i,
        /doubleclick\.net/i,
      ],
    });

    // Set up global error handlers
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[Error Monitoring] Unhandled promise rejection:', event.reason);
      Sentry.captureException(event.reason, {
        contexts: {
          promise: {
            type: 'unhandled_rejection',
            promise: event.promise,
          }
        }
      });
    });

    // Track page load
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: 'Page loaded',
      level: 'info',
      data: {
        url: window.location.href,
        referrer: document.referrer,
      }
    });

    // Track hash changes (SPA navigation)
    window.addEventListener('hashchange', (event) => {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: 'Hash changed',
        level: 'info',
        data: {
          from: event.oldURL,
          to: event.newURL,
        }
      });
    });

    console.log('[Error Monitoring] Sentry initialized successfully');

  } catch (error) {
    console.error('[Error Monitoring] Failed to initialize Sentry:', error);
  }
}

/**
 * Manually capture an error with custom context
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context data
 */
export function captureError(error, context = {}) {
  console.error('[Error Monitoring] Capturing error:', error, context);

  Sentry.captureException(error, {
    contexts: {
      custom: context,
      timestamp: { captured_at: new Date().toISOString() }
    },
    tags: {
      custom_error: true,
      ...context.tags
    }
  });
}

/**
 * Capture a message for logging and tracking
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 * @param {Object} context - Additional context data
 */
export function captureMessage(message, level = 'info', context = {}) {
  console.log(`[Error Monitoring] Capturing message [${level}]:`, message);

  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
      timestamp: { captured_at: new Date().toISOString() }
    },
    tags: {
      custom_message: true,
      ...context.tags
    }
  });
}

/**
 * Add a breadcrumb for tracking user actions
 * @param {string} category - Category of the breadcrumb
 * @param {string} message - Breadcrumb message
 * @param {Object} data - Additional data
 */
export function addBreadcrumb(category, message, data = {}) {
  Sentry.addBreadcrumb({
    category,
    message,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
    },
    level: 'info'
  });
}

/**
 * Set user context for error tracking
 * @param {Object} user - User data
 */
export function setUser(user) {
  if (user) {
    Sentry.setUser({
      id: user.uid || user.id,
      email: user.email,
      username: user.displayName || user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Set custom tags for filtering in Sentry
 * @param {Object} tags - Key-value pairs of tags
 */
export function setTags(tags) {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Set custom context data
 * @param {string} name - Context name
 * @param {Object} data - Context data
 */
export function setContext(name, data) {
  Sentry.setContext(name, data);
}

/**
 * Get the last event ID (useful for user feedback)
 * @returns {string|null} Last event ID
 */
export function getLastEventId() {
  return Sentry.lastEventId();
}

/**
 * Show user feedback dialog
 */
export function showFeedbackDialog() {
  const eventId = Sentry.lastEventId();

  if (eventId) {
    Sentry.showReportDialog({
      eventId,
      user: {
        email: firebase.auth()?.currentUser?.email || '',
        name: firebase.auth()?.currentUser?.displayName || ''
      },
      title: 'It looks like we\'re having issues.',
      subtitle: 'Our team has been notified.',
      subtitle2: 'If you\'d like to help, tell us what happened below.',
      labelName: 'Name',
      labelEmail: 'Email',
      labelComments: 'What happened?',
      labelClose: 'Close',
      labelSubmit: 'Submit',
      errorGeneric: 'An error occurred while submitting your report. Please try again.',
      errorFormEntry: 'Some fields were invalid. Please correct the errors and try again.',
      successMessage: 'Your feedback has been sent. Thank you!',
    });
  }
}

// Export Sentry instance for advanced usage
export { Sentry };
