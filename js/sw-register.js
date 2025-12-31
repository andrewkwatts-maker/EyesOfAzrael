/**
 * Service Worker Registration
 * Registers and manages the service worker for PWA capabilities
 */

(function() {
  'use strict';

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  // Register service worker on page load
  window.addEventListener('load', () => {
    registerServiceWorker();
  });

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log(' [SW] Service Worker registered successfully:', registration.scope);

      // Check for updates immediately
      registration.update();

      // Check for updates periodically (every hour)
      setInterval(() => {
        console.log('[SW] Checking for updates...');
        registration.update();
      }, 3600000); // 1 hour

      // Listen for update found
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[SW] Update found, installing new service worker...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker installed - auto-activate and refresh
            console.log('[SW] New version available - auto-updating...');

            // Skip waiting to activate new SW immediately
            newWorker.postMessage({ type: 'SKIP_WAITING' });

            // The controllerchange event will trigger the page reload
            // But show a brief notification first
            showToast('Updating to new version...', 'info');
          }
        });
      });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('= [SW] Service Worker updated, page will reload...');

        // Show brief notification before reload
        showToast('App updated! Reloading...', 'success');

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('[SW] Cache updated:', event.data.url);
        }
      });

    } catch (error) {
      console.error('L [SW] Service Worker registration failed:', error);
    }
  }

  function notifyUpdate() {
    // Check if update notifier is available
    if (window.ServiceWorkerUpdateNotifier) {
      window.ServiceWorkerUpdateNotifier.show();
    } else {
      // Fallback: show browser notification
      showUpdatePrompt();
    }
  }

  function showUpdatePrompt() {
    const updatePrompt = document.createElement('div');
    updatePrompt.className = 'sw-update-prompt';
    updatePrompt.innerHTML = `
      <div class="sw-update-content">
        <div class="sw-update-icon"><�</div>
        <div class="sw-update-text">
          <h3>Update Available!</h3>
          <p>A new version of Eyes of Azrael is ready.</p>
        </div>
        <div class="sw-update-actions">
          <button class="btn-update" onclick="this.closest('.sw-update-prompt').style.display='none'; navigator.serviceWorker.getRegistration().then(reg => reg.waiting.postMessage({type: 'SKIP_WAITING'}));">
            Update Now
          </button>
          <button class="btn-dismiss" onclick="this.closest('.sw-update-prompt').style.display='none';">
            Later
          </button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .sw-update-prompt {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 10000;
        background: rgba(26, 26, 26, 0.98);
        backdrop-filter: blur(20px);
        border: 2px solid rgba(139, 127, 255, 0.5);
        border-radius: 16px;
        padding: 1.5rem;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideInUp 0.3s ease-out;
      }

      @keyframes slideInUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .sw-update-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .sw-update-icon {
        font-size: 3rem;
        text-align: center;
      }

      .sw-update-text h3 {
        margin: 0 0 0.5rem 0;
        color: #8b7fff;
        font-size: 1.25rem;
      }

      .sw-update-text p {
        margin: 0;
        color: #c0c0c0;
        font-size: 0.95rem;
      }

      .sw-update-actions {
        display: flex;
        gap: 0.75rem;
      }

      .sw-update-actions button {
        flex: 1;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-update {
        background: linear-gradient(135deg, #8b7fff, #6a5acd);
        color: white;
      }

      .btn-update:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(139, 127, 255, 0.4);
      }

      .btn-dismiss {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .btn-dismiss:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      @media (max-width: 768px) {
        .sw-update-prompt {
          bottom: 1rem;
          right: 1rem;
          left: 1rem;
          max-width: none;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(updatePrompt);

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      if (updatePrompt.parentNode) {
        updatePrompt.style.opacity = '0';
        setTimeout(() => updatePrompt.remove(), 300);
      }
    }, 30000);
  }

  function showToast(message, type = 'info') {
    // Use existing toast system if available
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`[Toast] ${message}`);
    }
  }

  // Expose registration status
  window.serviceWorkerReady = new Promise((resolve) => {
    if (navigator.serviceWorker.controller) {
      resolve(navigator.serviceWorker.controller);
    } else {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve(navigator.serviceWorker.controller);
      });
    }
  });

  // Debug utilities (available in console)
  window.swDebug = {
    async getRegistration() {
      return await navigator.serviceWorker.getRegistration();
    },

    async unregister() {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        console.log('[SW] Service worker unregistered');
      }
    },

    async clearCaches() {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
      console.log('[SW] All caches cleared');
    },

    async getCacheInfo() {
      const keys = await caches.keys();
      const info = {};

      for (const key of keys) {
        const cache = await caches.open(key);
        const requests = await cache.keys();
        info[key] = {
          count: requests.length,
          urls: requests.map(req => req.url)
        };
      }

      return info;
    }
  };

  console.log('[SW] Registration script loaded. Debug utilities available via window.swDebug');
})();
