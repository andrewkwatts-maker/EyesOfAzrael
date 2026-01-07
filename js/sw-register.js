/**
 * Service Worker Registration - Polished Edition
 * Registers and manages the service worker for PWA capabilities
 *
 * Features:
 * - Auto-update with user notification
 * - Background sync status tracking
 * - Cache statistics and management
 * - Offline state detection
 * - Update prompt with progress indicator
 * - Debug utilities for development
 */

(function() {
  'use strict';

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  // Configuration
  const CONFIG = {
    updateCheckInterval: 60 * 60 * 1000, // 1 hour
    updatePromptDelay: 500,              // Delay before showing update prompt
    autoReloadDelay: 1500,               // Delay before auto-reload
    maxRetryAttempts: 3,                 // Max retries for registration
    retryDelay: 2000                     // Delay between retries
  };

  // State
  let registration = null;
  let updateAvailable = false;
  let pendingWorker = null;
  let retryCount = 0;

  // Register service worker on page load
  window.addEventListener('load', () => {
    registerServiceWorker();
  });

  /**
   * Register the service worker with retry logic
   */
  async function registerServiceWorker() {
    try {
      registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Always check server for SW updates
      });

      console.log('[SW] Service Worker registered successfully:', registration.scope);

      // Reset retry count on success
      retryCount = 0;

      // Setup event listeners
      setupRegistrationListeners(registration);

      // Check for updates immediately
      registration.update().catch(() => {});

      // Periodic update checks
      setInterval(() => {
        if (navigator.onLine) {
          console.log('[SW] Checking for updates...');
          registration.update().catch(() => {});
        }
      }, CONFIG.updateCheckInterval);

      // Listen for messages from service worker
      setupMessageListener();

      // Request background sync permission if available
      requestBackgroundSyncPermission();

    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);

      // Retry registration
      if (retryCount < CONFIG.maxRetryAttempts) {
        retryCount++;
        console.log(`[SW] Retrying registration (attempt ${retryCount}/${CONFIG.maxRetryAttempts})...`);
        setTimeout(registerServiceWorker, CONFIG.retryDelay);
      }
    }
  }

  /**
   * Setup registration event listeners
   */
  function setupRegistrationListeners(reg) {
    // Listen for update found
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      console.log('[SW] Update found, installing new service worker...');

      newWorker.addEventListener('statechange', () => {
        switch (newWorker.state) {
          case 'installed':
            if (navigator.serviceWorker.controller) {
              // New content available
              updateAvailable = true;
              pendingWorker = newWorker;
              console.log('[SW] New version available');
              showUpdateNotification(newWorker);
            } else {
              // First install
              console.log('[SW] Service Worker installed for the first time');
              showToast('App ready for offline use', 'success');
            }
            break;

          case 'activated':
            console.log('[SW] Service Worker activated');
            break;

          case 'redundant':
            console.log('[SW] Service Worker became redundant');
            break;
        }
      });
    });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Service Worker updated, preparing to reload...');

      // Show brief notification before reload
      showToast('App updated! Reloading...', 'success');

      setTimeout(() => {
        window.location.reload();
      }, CONFIG.autoReloadDelay);
    });
  }

  /**
   * Setup message listener for SW communication
   */
  function setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { data } = event;
      if (!data || !data.type) return;

      switch (data.type) {
        case 'SW_ACTIVATED':
          console.log('[SW] New version activated:', data.version);
          break;

        case 'CACHE_UPDATED':
          console.log('[SW] Cache updated:', data.url);
          // Optionally notify user of background updates
          break;

        case 'SYNC_COMPLETE':
          console.log(`[SW] Sync complete: ${data.synced}/${data.total} requests synced`);
          if (data.synced > 0) {
            showToast(`Synced ${data.synced} pending ${data.synced === 1 ? 'request' : 'requests'}`, 'success');
          }
          break;

        case 'CACHE_STATS':
          console.log('[SW] Cache stats:', data.stats);
          window.dispatchEvent(new CustomEvent('sw-cache-stats', { detail: data.stats }));
          break;

        case 'CACHE_CLEARED':
          console.log('[SW] Cache cleared');
          showToast('Cache cleared successfully', 'info');
          break;

        case 'CACHE_COMPLETE':
          console.log(`[SW] Cached ${data.urls} URLs`);
          break;

        case 'VERSION_INFO':
          console.log('[SW] Version:', data.version, 'Caches:', data.caches);
          window.dispatchEvent(new CustomEvent('sw-version', { detail: data }));
          break;
      }
    });
  }

  /**
   * Request background sync permission
   */
  async function requestBackgroundSyncPermission() {
    if ('permissions' in navigator && 'sync' in registration) {
      try {
        const status = await navigator.permissions.query({ name: 'background-sync' });
        console.log('[SW] Background sync permission:', status.state);
      } catch (e) {
        // Permission API might not support background-sync query
      }
    }
  }

  /**
   * Show update notification with polished UI
   */
  function showUpdateNotification(newWorker) {
    // Remove any existing notification
    const existing = document.querySelector('.sw-update-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'sw-update-notification';
    notification.setAttribute('role', 'alertdialog');
    notification.setAttribute('aria-labelledby', 'sw-update-title');
    notification.setAttribute('aria-describedby', 'sw-update-desc');

    notification.innerHTML = `
      <div class="sw-update-notification__backdrop"></div>
      <div class="sw-update-notification__card">
        <div class="sw-update-notification__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <div class="sw-update-notification__pulse"></div>
        </div>

        <div class="sw-update-notification__content">
          <h3 id="sw-update-title" class="sw-update-notification__title">Update Available</h3>
          <p id="sw-update-desc" class="sw-update-notification__desc">
            A new version of Eyes of Azrael is ready. Update now for the latest features and improvements.
          </p>
        </div>

        <div class="sw-update-notification__actions">
          <button class="sw-update-notification__btn sw-update-notification__btn--primary" id="sw-update-now">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
            <span>Update Now</span>
          </button>
          <button class="sw-update-notification__btn sw-update-notification__btn--secondary" id="sw-update-later">
            Later
          </button>
        </div>

        <div class="sw-update-notification__progress" id="sw-update-progress" style="display: none;">
          <div class="sw-update-notification__progress-bar"></div>
          <span class="sw-update-notification__progress-text">Installing update...</span>
        </div>
      </div>
    `;

    // Add styles
    addUpdateNotificationStyles();

    // Add to document
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('sw-update-notification--visible');
    });

    // Button handlers
    const updateBtn = notification.querySelector('#sw-update-now');
    const laterBtn = notification.querySelector('#sw-update-later');
    const progress = notification.querySelector('#sw-update-progress');
    const actions = notification.querySelector('.sw-update-notification__actions');

    updateBtn.addEventListener('click', () => {
      // Show progress
      actions.style.display = 'none';
      progress.style.display = 'flex';

      // Skip waiting to activate new SW
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    });

    laterBtn.addEventListener('click', () => {
      dismissUpdateNotification(notification);
    });

    // Backdrop click to dismiss
    notification.querySelector('.sw-update-notification__backdrop').addEventListener('click', () => {
      dismissUpdateNotification(notification);
    });

    // ESC key to dismiss
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        dismissUpdateNotification(notification);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // Focus the update button for accessibility
    setTimeout(() => updateBtn.focus(), 100);
  }

  /**
   * Dismiss update notification with animation
   */
  function dismissUpdateNotification(notification) {
    notification.classList.remove('sw-update-notification--visible');
    notification.classList.add('sw-update-notification--hiding');

    setTimeout(() => {
      notification.remove();
    }, 300);
  }

  /**
   * Add update notification styles
   */
  function addUpdateNotificationStyles() {
    if (document.getElementById('sw-update-styles')) return;

    const style = document.createElement('style');
    style.id = 'sw-update-styles';
    style.textContent = `
      .sw-update-notification {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .sw-update-notification--visible {
        opacity: 1;
        visibility: visible;
      }

      .sw-update-notification--hiding {
        opacity: 0;
      }

      .sw-update-notification__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
      }

      .sw-update-notification__card {
        position: relative;
        background: linear-gradient(145deg, rgba(26, 31, 58, 0.98), rgba(15, 20, 40, 0.98));
        border: 1px solid rgba(139, 127, 255, 0.3);
        border-radius: 20px;
        padding: 2rem;
        max-width: 420px;
        width: 100%;
        box-shadow:
          0 25px 80px rgba(0, 0, 0, 0.5),
          0 0 60px rgba(139, 127, 255, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
        transform: translateY(20px) scale(0.95);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .sw-update-notification--visible .sw-update-notification__card {
        transform: translateY(0) scale(1);
      }

      .sw-update-notification__icon {
        position: relative;
        width: 64px;
        height: 64px;
        margin: 0 auto 1.5rem;
        background: linear-gradient(135deg, rgba(139, 127, 255, 0.2), rgba(106, 90, 205, 0.2));
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sw-update-notification__icon svg {
        width: 32px;
        height: 32px;
        color: #8b7fff;
        animation: sw-bounce 2s ease-in-out infinite;
      }

      @keyframes sw-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }

      .sw-update-notification__pulse {
        position: absolute;
        inset: -4px;
        border-radius: 20px;
        border: 2px solid rgba(139, 127, 255, 0.4);
        animation: sw-pulse 2s ease-out infinite;
      }

      @keyframes sw-pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.2); opacity: 0; }
      }

      .sw-update-notification__content {
        text-align: center;
        margin-bottom: 1.5rem;
      }

      .sw-update-notification__title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.75rem;
        letter-spacing: -0.01em;
      }

      .sw-update-notification__desc {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.6;
        margin: 0;
      }

      .sw-update-notification__actions {
        display: flex;
        gap: 0.75rem;
        flex-direction: column;
      }

      .sw-update-notification__btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.875rem 1.5rem;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .sw-update-notification__btn svg {
        width: 18px;
        height: 18px;
      }

      .sw-update-notification__btn--primary {
        background: linear-gradient(135deg, #8b7fff, #6a5acd);
        color: white;
        box-shadow: 0 4px 15px rgba(139, 127, 255, 0.4);
      }

      .sw-update-notification__btn--primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(139, 127, 255, 0.5);
      }

      .sw-update-notification__btn--primary:active {
        transform: translateY(0);
      }

      .sw-update-notification__btn--secondary {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .sw-update-notification__btn--secondary:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
      }

      .sw-update-notification__progress {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding-top: 0.5rem;
      }

      .sw-update-notification__progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
        position: relative;
      }

      .sw-update-notification__progress-bar::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, #8b7fff, #6a5acd, #8b7fff);
        background-size: 200% 100%;
        animation: sw-progress 1.5s ease-in-out infinite;
      }

      @keyframes sw-progress {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .sw-update-notification__progress-text {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.6);
      }

      @media (max-width: 480px) {
        .sw-update-notification__card {
          padding: 1.5rem;
          margin: 1rem;
          border-radius: 16px;
        }

        .sw-update-notification__title {
          font-size: 1.25rem;
        }

        .sw-update-notification__desc {
          font-size: 0.9rem;
        }

        .sw-update-notification__btn {
          padding: 0.75rem 1.25rem;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Show toast notification
   */
  function showToast(message, type = 'info') {
    // Use existing toast system if available
    if (window.toast) {
      window.toast[type] ? window.toast[type](message) : window.toast.show(message, { type });
    } else if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`[Toast] ${type}: ${message}`);
    }
  }

  /**
   * Expose service worker ready promise
   */
  window.serviceWorkerReady = new Promise((resolve) => {
    if (navigator.serviceWorker.controller) {
      resolve(navigator.serviceWorker.controller);
    } else {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve(navigator.serviceWorker.controller);
      });
    }
  });

  /**
   * Public API for cache management
   */
  window.swCache = {
    /**
     * Clear all caches
     */
    async clearAll() {
      const sw = await navigator.serviceWorker.ready;
      sw.active.postMessage({ type: 'CLEAR_CACHE' });
    },

    /**
     * Clear specific cache type
     */
    async clearType(cacheType) {
      const sw = await navigator.serviceWorker.ready;
      sw.active.postMessage({ type: 'CLEAR_CACHE_TYPE', cacheType });
    },

    /**
     * Get cache statistics
     */
    async getStats() {
      return new Promise(async (resolve) => {
        const sw = await navigator.serviceWorker.ready;

        const handler = (event) => {
          if (event.data?.type === 'CACHE_STATS') {
            window.removeEventListener('sw-cache-stats', handler);
            resolve(event.detail);
          }
        };

        window.addEventListener('sw-cache-stats', handler);
        sw.active.postMessage({ type: 'GET_CACHE_STATS' });

        // Timeout fallback
        setTimeout(() => {
          window.removeEventListener('sw-cache-stats', handler);
          resolve(null);
        }, 5000);
      });
    },

    /**
     * Pre-cache specific URLs
     */
    async warmCache(urls, cacheType = 'dynamic') {
      const sw = await navigator.serviceWorker.ready;
      sw.active.postMessage({ type: 'WARM_CACHE', urls });
    },

    /**
     * Cleanup expired cache entries
     */
    async cleanupExpired() {
      const sw = await navigator.serviceWorker.ready;
      sw.active.postMessage({ type: 'CLEANUP_EXPIRED' });
    },

    /**
     * Get SW version
     */
    async getVersion() {
      return new Promise(async (resolve) => {
        const sw = await navigator.serviceWorker.ready;

        const handler = (event) => {
          window.removeEventListener('sw-version', handler);
          resolve(event.detail);
        };

        window.addEventListener('sw-version', handler);
        sw.active.postMessage({ type: 'GET_VERSION' });

        // Timeout fallback
        setTimeout(() => {
          window.removeEventListener('sw-version', handler);
          resolve(null);
        }, 2000);
      });
    }
  };

  /**
   * Debug utilities (available in console)
   */
  window.swDebug = {
    /**
     * Get current registration
     */
    async getRegistration() {
      return await navigator.serviceWorker.getRegistration();
    },

    /**
     * Unregister service worker
     */
    async unregister() {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.unregister();
        console.log('[SW] Service worker unregistered');
        return true;
      }
      return false;
    },

    /**
     * Force update check
     */
    async checkForUpdate() {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        console.log('[SW] Update check complete');
      }
    },

    /**
     * Get all cache names and sizes
     */
    async getCacheInfo() {
      const keys = await caches.keys();
      const info = {};

      for (const key of keys) {
        const cache = await caches.open(key);
        const requests = await cache.keys();
        info[key] = {
          count: requests.length,
          urls: requests.slice(0, 20).map(req => req.url) // Limit to first 20
        };
      }

      return info;
    },

    /**
     * Clear all caches (browser level)
     */
    async clearAllCaches() {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
      console.log('[SW] All caches cleared');
    },

    /**
     * Show update notification manually (for testing)
     */
    async showUpdatePrompt() {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.waiting) {
        showUpdateNotification(reg.waiting);
      } else {
        console.log('[SW] No pending update available');
      }
    },

    /**
     * Force skip waiting on pending worker
     */
    async skipWaiting() {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('[SW] Skip waiting sent');
      }
    },

    /**
     * Get sync queue status (if using IndexedDB)
     */
    async getSyncQueue() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('eoa-sync-db', 1);
        request.onerror = () => resolve([]);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('sync-queue')) {
            resolve([]);
            return;
          }
          const tx = db.transaction('sync-queue', 'readonly');
          const store = tx.objectStore('sync-queue');
          const getAll = store.getAll();
          getAll.onsuccess = () => resolve(getAll.result);
          getAll.onerror = () => resolve([]);
        };
      });
    }
  };

  console.log('[SW] Registration script loaded. APIs: window.swCache, window.swDebug');
})();
