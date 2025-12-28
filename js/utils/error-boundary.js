/**
 * Error Boundary Utility
 * Wraps components to catch and handle errors gracefully
 */

import { captureError } from '../error-monitoring.js';

/**
 * Error Boundary Class
 * Provides error handling and fallback UI for components
 */
export class ErrorBoundary {
  /**
   * @param {Object} component - Component instance to wrap
   * @param {Function} fallbackUI - Custom fallback UI function
   */
  constructor(component, fallbackUI = null) {
    this.component = component;
    this.fallbackUI = fallbackUI || this.getDefaultFallback();
    this.errorCount = 0;
    this.lastError = null;
  }

  /**
   * Execute a component method with error handling
   * @param {string} method - Method name to execute
   * @param {...any} args - Arguments to pass to the method
   * @returns {Promise<any>} Method result or null on error
   */
  async execute(method, ...args) {
    try {
      const result = await this.component[method](...args);

      // Reset error count on successful execution
      if (this.errorCount > 0) {
        console.log(`[ErrorBoundary] ${this.component.constructor.name}.${method} recovered`);
        this.errorCount = 0;
        this.lastError = null;
      }

      return result;

    } catch (error) {
      this.errorCount++;
      this.lastError = error;

      console.error(`[ErrorBoundary] Error in ${this.component.constructor.name}.${method}:`, error);

      // Capture error with context
      captureError(error, {
        component: this.component.constructor.name,
        method,
        args: this.sanitizeArgs(args),
        errorCount: this.errorCount,
        timestamp: Date.now(),
      });

      // Render error UI
      this.renderError(error, method);

      // If too many errors, disable component
      if (this.errorCount > 5) {
        console.error(`[ErrorBoundary] Component ${this.component.constructor.name} disabled after ${this.errorCount} errors`);
        this.disableComponent();
      }

      return null;
    }
  }

  /**
   * Synchronous method execution with error handling
   * @param {string} method - Method name to execute
   * @param {...any} args - Arguments to pass to the method
   * @returns {any} Method result or null on error
   */
  executeSync(method, ...args) {
    try {
      const result = this.component[method](...args);

      // Reset error count on successful execution
      if (this.errorCount > 0) {
        console.log(`[ErrorBoundary] ${this.component.constructor.name}.${method} recovered`);
        this.errorCount = 0;
        this.lastError = null;
      }

      return result;

    } catch (error) {
      this.errorCount++;
      this.lastError = error;

      console.error(`[ErrorBoundary] Error in ${this.component.constructor.name}.${method}:`, error);

      // Capture error with context
      captureError(error, {
        component: this.component.constructor.name,
        method,
        args: this.sanitizeArgs(args),
        errorCount: this.errorCount,
        timestamp: Date.now(),
      });

      // Render error UI
      this.renderError(error, method);

      // If too many errors, disable component
      if (this.errorCount > 5) {
        console.error(`[ErrorBoundary] Component ${this.component.constructor.name} disabled after ${this.errorCount} errors`);
        this.disableComponent();
      }

      return null;
    }
  }

  /**
   * Render error UI
   * @param {Error} error - The error that occurred
   * @param {string} method - Method where error occurred
   */
  renderError(error, method = '') {
    const container = this.component.container || this.component.element;

    if (container && container instanceof HTMLElement) {
      container.innerHTML = this.fallbackUI(error, method);
      container.classList.add('error-boundary-active');
    } else {
      console.warn('[ErrorBoundary] No container found to render error UI');
    }
  }

  /**
   * Disable component completely
   */
  disableComponent() {
    const container = this.component.container || this.component.element;

    if (container && container instanceof HTMLElement) {
      container.innerHTML = `
        <div class="error-boundary error-boundary-disabled">
          <h3>⚠️ Component Disabled</h3>
          <p>This component has encountered too many errors and has been disabled.</p>
          <button onclick="window.location.reload()" class="btn-primary">
            Reload Page
          </button>
        </div>
      `;
    }
  }

  /**
   * Get default fallback UI
   * @returns {Function} Fallback UI function
   */
  getDefaultFallback() {
    return (error, method = '') => {
      const isDevelopment = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';

      return `
        <div class="error-boundary" style="
          padding: 2rem;
          margin: 1rem;
          background: linear-gradient(135deg, rgba(255,59,48,0.1) 0%, rgba(255,149,0,0.1) 100%);
          border: 2px solid rgba(255,59,48,0.3);
          border-radius: 12px;
          text-align: center;
        ">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
          <h2 style="color: #ff3b30; margin-bottom: 1rem;">Something went wrong</h2>
          <p style="color: #666; margin-bottom: 1.5rem;">
            We've been notified and are working on a fix.
            ${method ? `<br><small>Error in method: <code>${method}</code></small>` : ''}
          </p>

          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button onclick="window.location.reload()" class="btn-primary" style="
              padding: 0.75rem 1.5rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">
              🔄 Reload Page
            </button>

            <button onclick="history.back()" class="btn-secondary" style="
              padding: 0.75rem 1.5rem;
              background: rgba(102, 126, 234, 0.1);
              color: #667eea;
              border: 2px solid #667eea;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">
              ← Go Back
            </button>
          </div>

          ${isDevelopment ? `
            <details style="
              margin-top: 1.5rem;
              text-align: left;
              background: rgba(0,0,0,0.05);
              padding: 1rem;
              border-radius: 8px;
            ">
              <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">
                🔍 Error Details (Development Only)
              </summary>
              <pre style="
                overflow-x: auto;
                background: #1e1e1e;
                color: #d4d4d4;
                padding: 1rem;
                border-radius: 4px;
                font-size: 0.875rem;
              ">${this.escapeHtml(error.stack || error.message || String(error))}</pre>
            </details>
          ` : ''}
        </div>
      `;
    };
  }

  /**
   * Sanitize arguments for error reporting
   * @param {Array} args - Arguments to sanitize
   * @returns {Array} Sanitized arguments
   */
  sanitizeArgs(args) {
    return args.map(arg => {
      if (arg instanceof HTMLElement) {
        return `[HTMLElement: ${arg.tagName}]`;
      } else if (arg instanceof Event) {
        return `[Event: ${arg.type}]`;
      } else if (typeof arg === 'function') {
        return `[Function: ${arg.name || 'anonymous'}]`;
      } else if (arg && typeof arg === 'object') {
        try {
          return JSON.parse(JSON.stringify(arg));
        } catch {
          return '[Complex Object]';
        }
      }
      return arg;
    });
  }

  /**
   * Escape HTML for safe display
   * @param {string} html - HTML string to escape
   * @returns {string} Escaped HTML
   */
  escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Reset error boundary state
   */
  reset() {
    this.errorCount = 0;
    this.lastError = null;

    const container = this.component.container || this.component.element;
    if (container && container instanceof HTMLElement) {
      container.classList.remove('error-boundary-active');
    }
  }

  /**
   * Get error statistics
   * @returns {Object} Error stats
   */
  getStats() {
    return {
      errorCount: this.errorCount,
      lastError: this.lastError ? {
        message: this.lastError.message,
        stack: this.lastError.stack,
        timestamp: Date.now(),
      } : null,
      component: this.component.constructor.name,
    };
  }
}

/**
 * Create an error boundary wrapped component
 * @param {Object} component - Component to wrap
 * @param {Function} fallbackUI - Custom fallback UI
 * @returns {ErrorBoundary} Error boundary instance
 */
export function withErrorBoundary(component, fallbackUI = null) {
  return new ErrorBoundary(component, fallbackUI);
}

/**
 * Async function wrapper with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} context - Error context
 * @returns {Function} Wrapped function
 */
export function withErrorHandler(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('[ErrorHandler] Error in wrapped function:', error);
      captureError(error, {
        ...context,
        function: fn.name || 'anonymous',
        args: args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.parse(JSON.stringify(arg));
            } catch {
              return '[Complex Object]';
            }
          }
          return arg;
        }),
      });
      throw error;
    }
  };
}
