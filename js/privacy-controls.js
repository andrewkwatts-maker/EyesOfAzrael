/**
 * Privacy Controls
 * Eyes of Azrael - User privacy settings and analytics opt-out
 */

(function() {
  'use strict';

  /**
   * Privacy Controls Manager
   * Handles user consent and privacy preferences
   */
  class PrivacyControls {
    constructor() {
      this.initialized = false;
      this.consentKey = 'analytics_consent';
      this.modalId = 'privacy-modal';
    }

    /**
     * Initialize privacy controls
     */
    initialize() {
      if (this.initialized) return;

      // Check for first visit
      if (!this.hasSeenBanner()) {
        this.showConsentBanner();
      }

      // Add privacy settings link to footer
      this.addFooterLink();

      // Listen for privacy modal requests
      this.setupEventListeners();

      this.initialized = true;
      console.log('[Privacy] Privacy controls initialized');
    }

    /**
     * Check if user has seen consent banner
     */
    hasSeenBanner() {
      return localStorage.getItem('consent_banner_seen') === 'true';
    }

    /**
     * Show consent banner on first visit
     */
    showConsentBanner() {
      const banner = document.createElement('div');
      banner.id = 'consent-banner';
      banner.className = 'consent-banner';
      banner.innerHTML = `
        <div class="consent-content">
          <div class="consent-text">
            <h3>Privacy & Analytics</h3>
            <p>We use analytics to improve your experience. Your data is anonymized and never sold.
            <a href="#/privacy" class="privacy-link">Learn more</a></p>
          </div>
          <div class="consent-actions">
            <button class="btn-secondary btn-sm" id="consent-customize">Customize</button>
            <button class="btn-primary btn-sm" id="consent-accept">Accept</button>
            <button class="btn-text btn-sm" id="consent-decline">Decline</button>
          </div>
        </div>
      `;

      // Add CSS
      this.addConsentStyles();

      // Add to page
      document.body.appendChild(banner);

      // Event listeners
      document.getElementById('consent-accept').addEventListener('click', () => {
        this.acceptAnalytics();
        this.hideBanner();
      });

      document.getElementById('consent-decline').addEventListener('click', () => {
        this.declineAnalytics();
        this.hideBanner();
      });

      document.getElementById('consent-customize').addEventListener('click', () => {
        this.hideBanner();
        this.showPrivacyModal();
      });
    }

    /**
     * Add consent banner styles
     */
    addConsentStyles() {
      if (document.getElementById('consent-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'consent-styles';
      styles.textContent = `
        .consent-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.98);
          backdrop-filter: blur(20px);
          border-top: 2px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
          padding: 1.5rem;
          z-index: 10000;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .consent-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }

        .consent-text h3 {
          margin: 0 0 0.5rem 0;
          color: var(--color-text-primary, #f8f9fa);
          font-size: 1.1rem;
        }

        .consent-text p {
          margin: 0;
          color: var(--color-text-secondary, #adb5bd);
          font-size: 0.95rem;
        }

        .privacy-link {
          color: var(--color-primary, #8b7fff);
          text-decoration: none;
        }

        .privacy-link:hover {
          text-decoration: underline;
        }

        .consent-actions {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .consent-content {
            flex-direction: column;
            align-items: stretch;
          }

          .consent-actions {
            flex-direction: column;
          }
        }
      `;

      document.head.appendChild(styles);
    }

    /**
     * Hide consent banner
     */
    hideBanner() {
      const banner = document.getElementById('consent-banner');
      if (banner) {
        banner.style.animation = 'slideDown 0.3s ease-in';
        setTimeout(() => banner.remove(), 300);
      }
      localStorage.setItem('consent_banner_seen', 'true');
    }

    /**
     * Accept analytics
     */
    acceptAnalytics() {
      localStorage.setItem(this.consentKey, 'true');
      if (window.AnalyticsManager) {
        window.AnalyticsManager.setConsent(true);
      }
      this.showToast('Analytics enabled. Thank you!', 'success');
    }

    /**
     * Decline analytics
     */
    declineAnalytics() {
      localStorage.setItem(this.consentKey, 'false');
      if (window.AnalyticsManager) {
        window.AnalyticsManager.setConsent(false);
      }
      this.showToast('Analytics disabled. Your privacy is respected.', 'info');
    }

    /**
     * Add privacy settings link to footer
     */
    addFooterLink() {
      const footer = document.querySelector('.footer-links');
      if (!footer) return;

      // Check if link already exists
      if (footer.querySelector('#privacy-settings-link')) return;

      const link = document.createElement('a');
      link.id = 'privacy-settings-link';
      link.href = '#';
      link.textContent = 'Privacy Settings';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPrivacyModal();
      });

      footer.appendChild(link);
    }

    /**
     * Show privacy settings modal
     */
    showPrivacyModal() {
      // Remove existing modal if present
      const existing = document.getElementById(this.modalId);
      if (existing) existing.remove();

      const currentConsent = localStorage.getItem(this.consentKey);
      const analyticsEnabled = currentConsent === null || currentConsent === 'true';

      const modal = document.createElement('div');
      modal.id = this.modalId;
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content privacy-modal">
          <div class="modal-header">
            <h2>Privacy Settings</h2>
            <button class="modal-close" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="privacy-section">
              <h3>Analytics & Tracking</h3>
              <p>We use analytics to understand how you use our site and improve your experience.
              All data is anonymized and we never sell your information.</p>

              <div class="toggle-setting">
                <label>
                  <input type="checkbox" id="analytics-toggle" ${analyticsEnabled ? 'checked' : ''}>
                  <span class="toggle-label">Enable Analytics</span>
                </label>
                <p class="toggle-description">
                  Helps us improve the site by tracking page views, search queries, and feature usage.
                </p>
              </div>
            </div>

            <div class="privacy-section">
              <h3>What We Track</h3>
              <ul class="privacy-list">
                <li><strong>Page Views:</strong> Which pages you visit</li>
                <li><strong>Search Queries:</strong> What you search for (to improve results)</li>
                <li><strong>Interactions:</strong> Buttons clicked, features used</li>
                <li><strong>Performance:</strong> Load times, errors</li>
                <li><strong>Device Info:</strong> Browser, OS, screen size</li>
              </ul>
            </div>

            <div class="privacy-section">
              <h3>What We DON'T Track</h3>
              <ul class="privacy-list">
                <li>Personal information (names, addresses, etc.)</li>
                <li>Content of your contributions</li>
                <li>Precise location (GPS)</li>
                <li>Cross-site browsing history</li>
              </ul>
            </div>

            <div class="privacy-section">
              <h3>Your Data Rights</h3>
              <p>You have the right to:</p>
              <ul class="privacy-list">
                <li>Access your data</li>
                <li>Request deletion</li>
                <li>Opt out of tracking</li>
                <li>Export your data</li>
              </ul>
              <p>
                <a href="#/privacy" class="privacy-link">Read our full Privacy Policy</a>
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="privacy-cancel">Cancel</button>
            <button class="btn-primary" id="privacy-save">Save Preferences</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Event listeners
      modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
      modal.querySelector('#privacy-cancel').addEventListener('click', () => this.hideModal());
      modal.querySelector('#privacy-save').addEventListener('click', () => {
        const enabled = document.getElementById('analytics-toggle').checked;
        if (enabled) {
          this.acceptAnalytics();
        } else {
          this.declineAnalytics();
        }
        this.hideModal();
      });

      // Close on overlay click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hideModal();
      });

      // Close on escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.hideModal();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);

      // Add modal styles
      this.addModalStyles();
    }

    /**
     * Hide privacy modal
     */
    hideModal() {
      const modal = document.getElementById(this.modalId);
      if (modal) modal.remove();
    }

    /**
     * Add modal styles
     */
    addModalStyles() {
      if (document.getElementById('privacy-modal-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'privacy-modal-styles';
      styles.textContent = `
        .privacy-modal {
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .privacy-section {
          margin: 1.5rem 0;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.5);
        }

        .privacy-section:last-child {
          border-bottom: none;
        }

        .privacy-section h3 {
          margin: 0 0 0.75rem 0;
          color: var(--color-text-primary, #f8f9fa);
          font-size: 1.1rem;
        }

        .privacy-section p {
          margin: 0.5rem 0;
          color: var(--color-text-secondary, #adb5bd);
          line-height: 1.6;
        }

        .privacy-list {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
          color: var(--color-text-secondary, #adb5bd);
        }

        .privacy-list li {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .toggle-setting {
          background: rgba(var(--color-bg-secondary-rgb, 21, 26, 53), 0.5);
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .toggle-setting label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: 500;
        }

        .toggle-setting input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .toggle-description {
          margin: 0.5rem 0 0 2.25rem;
          font-size: 0.9rem;
          color: var(--color-text-secondary, #adb5bd);
        }
      `;

      document.head.appendChild(styles);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Listen for hash changes to privacy page
      window.addEventListener('hashchange', () => {
        if (window.location.hash === '#/privacy-settings') {
          this.showPrivacyModal();
        }
      });
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
      if (window.showToast) {
        window.showToast(message, type);
      } else {
        console.log(`[Privacy] ${message}`);
      }
    }
  }

  // Create global instance
  window.PrivacyControls = new PrivacyControls();

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.PrivacyControls.initialize();
    });
  } else {
    window.PrivacyControls.initialize();
  }

  console.log('[Privacy] Privacy controls module loaded');

})();
