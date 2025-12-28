/**
 * Service Worker Update Notifier
 * Enhanced notification system for service worker updates
 */

class ServiceWorkerUpdateNotifier {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.notificationElement = null;

    this.init();
  }

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.log('[SW Notifier] Service workers not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      this.checkForUpdates();
      this.setupListeners();

      console.log('[SW Notifier] Initialized successfully');
    } catch (error) {
      console.error('[SW Notifier] Initialization failed:', error);
    }
  }

  setupListeners() {
    // Listen for update found
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;

      console.log('[SW Notifier] Update found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW Notifier] New version installed');
          this.updateAvailable = true;
          this.showUpdateNotification();
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        this.showUpdateNotification();
      }
    });
  }

  checkForUpdates() {
    if (this.registration.waiting) {
      console.log('[SW Notifier] Update already waiting');
      this.updateAvailable = true;
      this.showUpdateNotification();
    }
  }

  showUpdateNotification() {
    if (this.notificationElement) {
      // Notification already shown
      return;
    }

    this.notificationElement = this.createNotificationElement();
    document.body.appendChild(this.notificationElement);

    // Animate in
    setTimeout(() => {
      this.notificationElement.classList.add('visible');
    }, 100);

    // Track notification shown
    this.trackEvent('update_notification_shown');
  }

  createNotificationElement() {
    const notification = document.createElement('div');
    notification.className = 'sw-update-notification';
    notification.innerHTML = `
      <div class="sw-update-banner">
        <div class="sw-update-header">
          <div class="sw-update-icon-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </div>
          <div class="sw-update-info">
            <h3 class="sw-update-title">New Version Available! <‰</h3>
            <p class="sw-update-message">
              We've made improvements to Eyes of Azrael. Update now for the best experience.
            </p>
          </div>
          <button class="sw-update-close" onclick="this.closest('.sw-update-notification').remove();" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"/>
            </svg>
          </button>
        </div>
        <div class="sw-update-actions">
          <button class="sw-update-btn sw-update-btn-primary" onclick="window.ServiceWorkerUpdateNotifier.instance.updateNow()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.5 1.5v4h-4M2.5 14.5v-4h4M2 7.5a6 6 0 0 1 11-3.2M14 8.5a6 6 0 0 1-11 3.2"/>
            </svg>
            Update Now
          </button>
          <button class="sw-update-btn sw-update-btn-secondary" onclick="window.ServiceWorkerUpdateNotifier.instance.remindLater()">
            Remind Me Later
          </button>
        </div>
      </div>
    `;

    // Add styles
    this.injectStyles();

    return notification;
  }

  updateNow() {
    console.log('[SW Notifier] Updating now...');

    // Track update accepted
    this.trackEvent('update_accepted');

    // Show loading state
    if (this.notificationElement) {
      const updateBtn = this.notificationElement.querySelector('.sw-update-btn-primary');
      if (updateBtn) {
        updateBtn.innerHTML = '<span class="sw-spinner"></span> Updating...';
        updateBtn.disabled = true;
      }
    }

    // Skip waiting and activate new service worker
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Reload will happen automatically when controller changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  remindLater() {
    console.log('[SW Notifier] Remind later');

    // Track reminder set
    this.trackEvent('update_deferred');

    // Hide notification
    if (this.notificationElement) {
      this.notificationElement.classList.remove('visible');
      setTimeout(() => {
        this.notificationElement.remove();
        this.notificationElement = null;
      }, 300);
    }

    // Show again in 1 hour
    setTimeout(() => {
      if (this.updateAvailable) {
        this.showUpdateNotification();
      }
    }, 3600000); // 1 hour
  }

  injectStyles() {
    if (document.getElementById('sw-notifier-styles')) {
      return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'sw-notifier-styles';
    style.textContent = `
      .sw-update-notification {
        position: fixed;
        top: -200px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        max-width: 600px;
        width: calc(100% - 2rem);
        transition: top 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .sw-update-notification.visible {
        top: 1rem;
      }

      .sw-update-banner {
        background: linear-gradient(135deg, rgba(26, 26, 26, 0.98), rgba(42, 42, 58, 0.98));
        backdrop-filter: blur(30px);
        border: 2px solid rgba(139, 127, 255, 0.4);
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6),
                    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      }

      .sw-update-header {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .sw-update-icon-pulse {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #8b7fff, #6a5acd);
        border-radius: 50%;
        color: white;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(139, 127, 255, 0.7);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 0 0 10px rgba(139, 127, 255, 0);
        }
      }

      .sw-update-info {
        flex: 1;
        min-width: 0;
      }

      .sw-update-title {
        margin: 0 0 0.5rem 0;
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 700;
        line-height: 1.3;
      }

      .sw-update-message {
        margin: 0;
        color: #c0c0c0;
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .sw-update-close {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: #888;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .sw-update-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .sw-update-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
      }

      .sw-update-btn {
        flex: 1;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .sw-update-btn-primary {
        background: linear-gradient(135deg, #8b7fff, #6a5acd);
        color: white;
        box-shadow: 0 4px 15px rgba(139, 127, 255, 0.3);
      }

      .sw-update-btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(139, 127, 255, 0.5);
      }

      .sw-update-btn-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .sw-update-btn-secondary {
        background: rgba(255, 255, 255, 0.08);
        color: #c0c0c0;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .sw-update-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.12);
        color: white;
      }

      .sw-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @media (max-width: 640px) {
        .sw-update-notification {
          width: calc(100% - 1rem);
        }

        .sw-update-banner {
          padding: 1.25rem;
        }

        .sw-update-actions {
          flex-direction: column;
        }

        .sw-update-btn {
          width: 100%;
        }

        .sw-update-title {
          font-size: 1rem;
        }

        .sw-update-message {
          font-size: 0.85rem;
        }
      }
    `;

    document.head.appendChild(style);
  }

  trackEvent(eventName) {
    // Use analytics if available
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'service_worker',
        event_label: 'update_notification'
      });
    }

    console.log('[SW Notifier] Event tracked:', eventName);
  }

  // Public API
  show() {
    this.showUpdateNotification();
  }

  hide() {
    this.remindLater();
  }
}

// Create singleton instance
if (typeof window !== 'undefined') {
  window.ServiceWorkerUpdateNotifier = {
    instance: new ServiceWorkerUpdateNotifier(),
    show: function() {
      this.instance.show();
    },
    hide: function() {
      this.instance.hide();
    }
  };

  console.log('[SW Notifier] Update notifier loaded and ready');
}
