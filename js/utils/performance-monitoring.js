/**
 * Performance Monitoring Utility
 * Track performance metrics and send to Sentry
 */

import * as Sentry from '@sentry/browser';
import { addBreadcrumb } from '../error-monitoring.js';

/**
 * Track a performance transaction
 * @param {string} name - Transaction name
 * @param {string} operation - Operation type (e.g., 'page.load', 'http.request')
 * @returns {Object} Transaction controller
 */
export function trackPerformance(name, operation = 'task') {
  const transaction = Sentry.startTransaction({
    name,
    op: operation,
    trimEnd: true,
  });

  return {
    /**
     * Finish the transaction
     */
    finish: () => {
      transaction.finish();

      addBreadcrumb('performance', `Completed: ${name}`, {
        operation,
        duration: transaction.endTimestamp ?
          (transaction.endTimestamp - transaction.startTimestamp) * 1000 : 0
      });
    },

    /**
     * Set custom data on the transaction
     * @param {string} key - Data key
     * @param {any} value - Data value
     */
    setData: (key, value) => {
      transaction.setData(key, value);
    },

    /**
     * Set a tag on the transaction
     * @param {string} key - Tag key
     * @param {string} value - Tag value
     */
    setTag: (key, value) => {
      transaction.setTag(key, value);
    },

    /**
     * Set the transaction status
     * @param {string} status - Status (ok, error, cancelled, etc.)
     */
    setStatus: (status) => {
      transaction.setStatus(status);
    },

    /**
     * Create a child span
     * @param {string} spanName - Span name
     * @param {string} spanOp - Span operation
     * @returns {Object} Span controller
     */
    createSpan: (spanName, spanOp = 'task') => {
      const span = transaction.startChild({
        op: spanOp,
        description: spanName,
      });

      return {
        finish: () => span.finish(),
        setData: (key, value) => span.setData(key, value),
        setTag: (key, value) => span.setTag(key, value),
        setStatus: (status) => span.setStatus(status),
      };
    },

    /**
     * Get the raw transaction object
     */
    getTransaction: () => transaction,
  };
}

/**
 * Track an async operation with automatic timing
 * @param {string} name - Operation name
 * @param {string} operation - Operation type
 * @param {Function} fn - Async function to track
 * @returns {Promise<any>} Function result
 */
export async function trackAsyncOperation(name, operation, fn) {
  const perf = trackPerformance(name, operation);
  const startTime = performance.now();

  try {
    const result = await fn();

    const duration = performance.now() - startTime;
    perf.setData('success', true);
    perf.setData('duration_ms', duration);
    perf.setStatus('ok');

    console.log(`[Performance] ${name} completed in ${duration.toFixed(2)}ms`);

    return result;

  } catch (error) {
    const duration = performance.now() - startTime;
    perf.setData('success', false);
    perf.setData('duration_ms', duration);
    perf.setData('error', error.message);
    perf.setStatus('internal_error');

    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error);

    throw error;

  } finally {
    perf.finish();
  }
}

/**
 * Track a Firebase operation
 * @param {string} name - Operation name
 * @param {Function} fn - Firebase function to track
 * @returns {Promise<any>} Function result
 */
export async function trackFirebaseOperation(name, fn) {
  return trackAsyncOperation(name, 'firebase.operation', fn);
}

/**
 * Track page load performance
 */
export function trackPageLoad() {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];

      if (!perfData) {
        console.warn('[Performance] No navigation timing data available');
        return;
      }

      const transaction = Sentry.startTransaction({
        name: window.location.pathname,
        op: 'pageload',
      });

      // DNS lookup
      if (perfData.domainLookupEnd && perfData.domainLookupStart) {
        const dnsSpan = transaction.startChild({
          op: 'dns',
          description: 'DNS Lookup',
        });
        dnsSpan.startTimestamp = perfData.domainLookupStart / 1000;
        dnsSpan.endTimestamp = perfData.domainLookupEnd / 1000;
        dnsSpan.finish();
      }

      // TCP connection
      if (perfData.connectEnd && perfData.connectStart) {
        const tcpSpan = transaction.startChild({
          op: 'tcp',
          description: 'TCP Connection',
        });
        tcpSpan.startTimestamp = perfData.connectStart / 1000;
        tcpSpan.endTimestamp = perfData.connectEnd / 1000;
        tcpSpan.finish();
      }

      // Request/Response
      if (perfData.responseEnd && perfData.requestStart) {
        const requestSpan = transaction.startChild({
          op: 'http.request',
          description: 'HTTP Request',
        });
        requestSpan.startTimestamp = perfData.requestStart / 1000;
        requestSpan.endTimestamp = perfData.responseEnd / 1000;
        requestSpan.finish();
      }

      // DOM Processing
      if (perfData.domContentLoadedEventEnd && perfData.domContentLoadedEventStart) {
        const domSpan = transaction.startChild({
          op: 'browser.processing',
          description: 'DOM Processing',
        });
        domSpan.startTimestamp = perfData.domContentLoadedEventStart / 1000;
        domSpan.endTimestamp = perfData.domContentLoadedEventEnd / 1000;
        domSpan.finish();
      }

      // Add metrics
      transaction.setData('ttfb', perfData.responseStart - perfData.requestStart);
      transaction.setData('domContentLoaded', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart);
      transaction.setData('loadComplete', perfData.loadEventEnd - perfData.loadEventStart);

      transaction.finish();

      console.log('[Performance] Page load tracked:', {
        ttfb: perfData.responseStart - perfData.requestStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      });

    }, 0);
  });
}

/**
 * Track resource loading
 */
export function trackResourceLoading() {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource') {
        // Only track important resources
        if (entry.initiatorType === 'script' ||
            entry.initiatorType === 'link' ||
            entry.initiatorType === 'img') {

          addBreadcrumb('resource', `Loaded: ${entry.name}`, {
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize,
          });
        }
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (error) {
    console.warn('[Performance] Could not observe resource loading:', error);
  }
}

/**
 * Track long tasks (>50ms)
 */
export function trackLongTasks() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);

          addBreadcrumb('performance', 'Long task detected', {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.warn('[Performance] Long task tracking not supported:', error);
  }
}

/**
 * Track memory usage
 */
export function trackMemoryUsage() {
  if (!performance.memory) {
    return;
  }

  const memoryInfo = {
    usedJSHeapSize: performance.memory.usedJSHeapSize,
    totalJSHeapSize: performance.memory.totalJSHeapSize,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100,
  };

  addBreadcrumb('performance', 'Memory usage snapshot', memoryInfo);

  // Warn if memory usage is high
  if (memoryInfo.usagePercentage > 90) {
    console.warn('[Performance] High memory usage:', memoryInfo);
  }

  return memoryInfo;
}

/**
 * Track First Contentful Paint (FCP)
 */
export function trackFCP() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          console.log(`[Performance] FCP: ${entry.startTime.toFixed(2)}ms`);

          addBreadcrumb('performance', 'First Contentful Paint', {
            fcp: entry.startTime,
          });

          observer.disconnect();
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  } catch (error) {
    console.warn('[Performance] Could not track FCP:', error);
  }
}

/**
 * Initialize all performance monitoring
 */
export function initPerformanceMonitoring() {
  console.log('[Performance] Initializing performance monitoring...');

  trackPageLoad();
  trackResourceLoading();
  trackLongTasks();
  trackFCP();

  // Track memory usage every 30 seconds
  setInterval(() => {
    trackMemoryUsage();
  }, 30000);

  console.log('[Performance] Performance monitoring initialized');
}

/**
 * Create a performance mark
 * @param {string} name - Mark name
 */
export function mark(name) {
  if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure time between two marks
 * @param {string} name - Measurement name
 * @param {string} startMark - Start mark name
 * @param {string} endMark - End mark name
 * @returns {number} Duration in milliseconds
 */
export function measure(name, startMark, endMark) {
  if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);

      if (entries.length > 0) {
        const duration = entries[entries.length - 1].duration;
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

        addBreadcrumb('performance', name, {
          duration,
          startMark,
          endMark,
        });

        return duration;
      }
    } catch (error) {
      console.warn(`[Performance] Could not measure ${name}:`, error);
    }
  }

  return 0;
}
