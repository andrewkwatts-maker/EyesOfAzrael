/**
 * Analytics Module
 * Eyes of Azrael - Comprehensive Analytics & Monitoring System
 *
 * Integrates Google Analytics 4 and Firebase Analytics to track:
 * - Page views and navigation
 * - User interactions and engagement
 * - Search queries and results
 * - Mythology comparisons
 * - Performance metrics
 * - Error tracking
 * - User journeys and conversion funnels
 *
 * Privacy-compliant with opt-out support and data minimization
 */

(function() {
  'use strict';

  /**
   * Analytics Manager
   * Central hub for all analytics tracking
   */
  class AnalyticsManager {
    constructor() {
      this.initialized = false;
      this.analyticsEnabled = true;
      this.debugMode = false;
      this.sessionStartTime = Date.now();
      this.pageLoadTime = null;
      this.performanceMetrics = {};
      this.eventQueue = [];

      // User consent state
      this.consentGiven = this.checkConsent();

      // Check for debug mode
      this.debugMode = window.location.hostname === 'localhost' ||
                       window.location.search.includes('debug=true');
    }

    /**
     * Initialize analytics services
     */
    async initialize() {
      if (this.initialized) {
        return;
      }

      console.log('[Analytics] Initializing analytics services...');

      try {
        // Check user consent
        if (!this.consentGiven) {
          console.log('[Analytics] User has not given consent. Analytics disabled.');
          this.analyticsEnabled = false;
          return;
        }

        // Initialize Google Analytics 4
        await this.initializeGA4();

        // Initialize Firebase Analytics
        await this.initializeFirebaseAnalytics();

        // Set up performance monitoring
        this.setupPerformanceMonitoring();

        // Set up error tracking
        this.setupErrorTracking();

        // Set up user interaction tracking
        this.setupInteractionTracking();

        // Track initial page load
        this.trackPageLoad();

        this.initialized = true;
        console.log('[Analytics] Analytics services initialized successfully');

        // Process any queued events
        this.processEventQueue();

      } catch (error) {
        console.error('[Analytics] Initialization error:', error);
      }
    }

    /**
     * Initialize Google Analytics 4
     */
    async initializeGA4() {
      if (typeof gtag === 'undefined') {
        console.warn('[Analytics] Google Analytics not loaded');
        return;
      }

      // Configure GA4
      gtag('config', 'G-ECC98XJ9W9', {
        send_page_view: false, // We'll send manually for SPA
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });

      // Set custom dimensions
      gtag('set', 'user_properties', {
        theme_preference: this.getThemePreference(),
        user_type: this.getUserType()
      });

      console.log('[Analytics] Google Analytics 4 initialized');
    }

    /**
     * Initialize Firebase Analytics
     */
    async initializeFirebaseAnalytics() {
      if (typeof firebase === 'undefined' || !firebase.analytics) {
        console.warn('[Analytics] Firebase Analytics not available');
        return;
      }

      // Firebase Analytics is initialized with Firebase app
      // Just verify it's available
      this.firebaseAnalytics = firebase.analytics();

      // Set user properties
      this.firebaseAnalytics.setUserProperties({
        theme_preference: this.getThemePreference(),
        user_type: this.getUserType()
      });

      console.log('[Analytics] Firebase Analytics initialized');
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
      // Capture page load metrics
      if (window.performance && window.performance.timing) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
            const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
            const tcpTime = perfData.connectEnd - perfData.connectStart;

            this.performanceMetrics = {
              pageLoadTime,
              domReadyTime,
              dnsTime,
              tcpTime
            };

            this.trackPerformance('page_load', {
              page_load_time: pageLoadTime,
              dom_ready_time: domReadyTime,
              dns_time: dnsTime,
              tcp_time: tcpTime
            });
          }, 0);
        });
      }

      // Monitor Firebase operations
      this.setupFirebasePerformanceMonitoring();
    }

    /**
     * Setup Firebase Performance Monitoring
     */
    setupFirebasePerformanceMonitoring() {
      // Track database read/write times
      if (window.db) {
        const originalGet = window.db.collection.prototype.get;
        window.db.collection.prototype.get = async function(...args) {
          const startTime = performance.now();
          try {
            const result = await originalGet.apply(this, args);
            const duration = performance.now() - startTime;

            window.AnalyticsManager?.trackPerformance('firestore_read', {
              collection: this.path,
              duration: Math.round(duration),
              success: true
            });

            return result;
          } catch (error) {
            const duration = performance.now() - startTime;
            window.AnalyticsManager?.trackPerformance('firestore_read', {
              collection: this.path,
              duration: Math.round(duration),
              success: false,
              error: error.message
            });
            throw error;
          }
        };
      }
    }

    /**
     * Setup error tracking
     */
    setupErrorTracking() {
      // Global error handler
      window.addEventListener('error', (event) => {
        this.trackError({
          type: 'javascript_error',
          message: event.message,
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack
        });
      });

      // Promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          type: 'unhandled_promise_rejection',
          message: event.reason?.message || event.reason,
          stack: event.reason?.stack
        });
      });

      // Firebase error tracking
      if (window.FirebaseService) {
        window.addEventListener('firebaseAuthStateChanged', (event) => {
          if (event.detail.error) {
            this.trackError({
              type: 'firebase_auth_error',
              message: event.detail.error.message,
              code: event.detail.error.code
            });
          }
        });
      }
    }

    /**
     * Setup user interaction tracking
     */
    setupInteractionTracking() {
      // Track all button clicks
      document.addEventListener('click', (e) => {
        const button = e.target.closest('button, a.btn, .card, .deity-card');
        if (button) {
          const label = button.textContent.trim() ||
                       button.getAttribute('aria-label') ||
                       button.id ||
                       button.className;

          this.trackInteraction('button_click', {
            label: label.substring(0, 100),
            element_type: button.tagName.toLowerCase(),
            location: window.location.hash
          });
        }
      });

      // Track form submissions
      document.addEventListener('submit', (e) => {
        const form = e.target;
        const formId = form.id || form.className;

        this.trackInteraction('form_submit', {
          form_id: formId,
          location: window.location.hash
        });
      });

      // Track search usage
      const searchInput = document.querySelector('#searchInput, [name="search"]');
      if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            if (e.target.value.length >= 3) {
              this.trackSearch(e.target.value);
            }
          }, 1000);
        });
      }

      // Track scroll depth
      this.setupScrollTracking();

      // Track time on page
      this.setupTimeTracking();
    }

    /**
     * Setup scroll depth tracking
     */
    setupScrollTracking() {
      let maxScroll = 0;
      const milestones = [25, 50, 75, 90, 100];
      const reached = new Set();

      window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / scrollHeight) * 100;

        if (scrolled > maxScroll) {
          maxScroll = scrolled;

          milestones.forEach(milestone => {
            if (scrolled >= milestone && !reached.has(milestone)) {
              reached.add(milestone);
              this.trackInteraction('scroll_depth', {
                depth: milestone,
                page: window.location.hash
              });
            }
          });
        }
      });
    }

    /**
     * Setup time tracking
     */
    setupTimeTracking() {
      let timeOnPage = 0;
      let isActive = true;
      let lastActiveTime = Date.now();

      // Track active time (user is interacting)
      const resetActivityTimer = () => {
        if (!isActive) {
          isActive = true;
          lastActiveTime = Date.now();
        }
      };

      document.addEventListener('mousemove', resetActivityTimer);
      document.addEventListener('keydown', resetActivityTimer);
      document.addEventListener('scroll', resetActivityTimer);
      document.addEventListener('click', resetActivityTimer);

      // Check periodically and track time
      setInterval(() => {
        if (isActive) {
          const now = Date.now();
          timeOnPage += (now - lastActiveTime);
          lastActiveTime = now;
        }
      }, 1000);

      // Track time when user leaves
      window.addEventListener('beforeunload', () => {
        this.trackInteraction('time_on_page', {
          duration: Math.round(timeOnPage / 1000),
          page: window.location.hash
        });
      });

      // Detect inactivity
      setInterval(() => {
        if (isActive && (Date.now() - lastActiveTime > 30000)) {
          isActive = false;
        }
      }, 5000);
    }

    /**
     * Track page view
     */
    trackPageView(pagePath, pageTitle) {
      if (!this.analyticsEnabled) return;

      const path = pagePath || window.location.hash || '/';
      const title = pageTitle || document.title;

      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
          page_path: path,
          page_title: title,
          page_location: window.location.href
        });
      }

      // Firebase Analytics
      if (this.firebaseAnalytics) {
        this.firebaseAnalytics.logEvent('page_view', {
          page_path: path,
          page_title: title
        });
      }

      this.log('Page View', { path, title });
    }

    /**
     * Track initial page load
     */
    trackPageLoad() {
      this.trackPageView();

      this.trackEvent('app_initialized', {
        load_time: Date.now() - this.sessionStartTime,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`
      });
    }

    /**
     * Track custom event
     */
    trackEvent(eventName, eventParams = {}) {
      if (!this.analyticsEnabled) {
        this.eventQueue.push({ eventName, eventParams });
        return;
      }

      // Add standard parameters
      const params = {
        ...eventParams,
        timestamp: new Date().toISOString(),
        page: window.location.hash
      };

      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, params);
      }

      // Firebase Analytics
      if (this.firebaseAnalytics) {
        this.firebaseAnalytics.logEvent(eventName, params);
      }

      this.log('Event', eventName, params);
    }

    /**
     * Track mythology-specific events
     */
    trackMythologyView(mythology, entityType, entityId) {
      this.trackEvent('mythology_viewed', {
        mythology,
        entity_type: entityType,
        entity_id: entityId
      });
    }

    trackDeityView(mythology, deityName) {
      this.trackEvent('deity_viewed', {
        mythology,
        deity_name: deityName
      });
    }

    trackEntityDetail(entityType, entityId, mythology) {
      this.trackEvent('entity_detail_opened', {
        entity_type: entityType,
        entity_id: entityId,
        mythology
      });
    }

    /**
     * Track search events
     */
    trackSearch(query, filters = {}, resultsCount = null) {
      this.trackEvent('search', {
        search_term: query,
        filters: JSON.stringify(filters),
        results_count: resultsCount
      });
    }

    trackSearchResult(query, resultId, resultType, position) {
      this.trackEvent('search_result_clicked', {
        search_term: query,
        result_id: resultId,
        result_type: resultType,
        position
      });
    }

    /**
     * Track comparison events
     */
    trackComparison(mythologies, entityTypes) {
      this.trackEvent('mythology_comparison', {
        mythologies: mythologies.join(','),
        entity_types: entityTypes.join(','),
        comparison_count: mythologies.length
      });
    }

    trackComparisonView(mythology1, mythology2, comparisonType) {
      this.trackEvent('comparison_viewed', {
        mythology_1: mythology1,
        mythology_2: mythology2,
        comparison_type: comparisonType
      });
    }

    /**
     * Track user contributions
     */
    trackTheorySubmission(theoryType, mythology = null) {
      this.trackEvent('theory_submitted', {
        theory_type: theoryType,
        mythology
      });
    }

    trackEntitySubmission(entityType, mythology) {
      this.trackEvent('entity_submitted', {
        entity_type: entityType,
        mythology
      });
    }

    trackContribution(contributionType, details = {}) {
      this.trackEvent('user_contribution', {
        contribution_type: contributionType,
        ...details
      });
    }

    /**
     * Track user interactions
     */
    trackInteraction(interactionType, details = {}) {
      this.trackEvent('user_interaction', {
        interaction_type: interactionType,
        ...details
      });
    }

    /**
     * Track performance metrics
     */
    trackPerformance(metricName, metricData) {
      this.trackEvent('performance_metric', {
        metric_name: metricName,
        ...metricData
      });
    }

    /**
     * Track errors
     */
    trackError(errorData) {
      this.trackEvent('error', {
        ...errorData,
        user_agent: navigator.userAgent,
        url: window.location.href
      });

      // Also log to console in debug mode
      if (this.debugMode) {
        console.error('[Analytics] Error tracked:', errorData);
      }
    }

    /**
     * Track conversion events
     */
    trackConversion(conversionType, value = null) {
      const params = {
        conversion_type: conversionType
      };

      if (value !== null) {
        params.value = value;
      }

      this.trackEvent('conversion', params);
    }

    /**
     * Track user engagement
     */
    trackEngagement(engagementType, duration = null) {
      const params = {
        engagement_type: engagementType
      };

      if (duration !== null) {
        params.engagement_time: duration;
      }

      this.trackEvent('user_engagement', params);
    }

    /**
     * Set user properties
     */
    setUserProperty(propertyName, propertyValue) {
      if (!this.analyticsEnabled) return;

      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('set', 'user_properties', {
          [propertyName]: propertyValue
        });
      }

      // Firebase Analytics
      if (this.firebaseAnalytics) {
        this.firebaseAnalytics.setUserProperties({
          [propertyName]: propertyValue
        });
      }

      this.log('User Property Set', propertyName, propertyValue);
    }

    /**
     * Set user ID for cross-device tracking
     */
    setUserId(userId) {
      if (!this.analyticsEnabled) return;

      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('config', 'G-ECC98XJ9W9', {
          user_id: userId
        });
      }

      // Firebase Analytics
      if (this.firebaseAnalytics) {
        this.firebaseAnalytics.setUserId(userId);
      }

      this.log('User ID Set', userId);
    }

    /**
     * Check user consent
     */
    checkConsent() {
      const consent = localStorage.getItem('analytics_consent');
      return consent === null || consent === 'true'; // Default to true if not set
    }

    /**
     * Set user consent
     */
    setConsent(consent) {
      localStorage.setItem('analytics_consent', consent.toString());
      this.consentGiven = consent;
      this.analyticsEnabled = consent;

      if (consent && !this.initialized) {
        this.initialize();
      }

      this.log('Consent updated', consent);
    }

    /**
     * Opt out of analytics
     */
    optOut() {
      this.setConsent(false);

      // Disable Google Analytics
      window['ga-disable-G-ECC98XJ9W9'] = true;

      console.log('[Analytics] User opted out of analytics');
    }

    /**
     * Process queued events
     */
    processEventQueue() {
      if (this.eventQueue.length > 0) {
        console.log(`[Analytics] Processing ${this.eventQueue.length} queued events`);

        this.eventQueue.forEach(({ eventName, eventParams }) => {
          this.trackEvent(eventName, eventParams);
        });

        this.eventQueue = [];
      }
    }

    /**
     * Get theme preference
     */
    getThemePreference() {
      return localStorage.getItem('theme') || 'dark';
    }

    /**
     * Get user type
     */
    getUserType() {
      if (window.FirebaseService?.isAuthenticated()) {
        return 'authenticated';
      }
      return 'anonymous';
    }

    /**
     * Log to console in debug mode
     */
    log(...args) {
      if (this.debugMode) {
        console.log('[Analytics]', ...args);
      }
    }

    /**
     * Get analytics summary
     */
    getSummary() {
      return {
        initialized: this.initialized,
        analyticsEnabled: this.analyticsEnabled,
        consentGiven: this.consentGiven,
        debugMode: this.debugMode,
        sessionDuration: Date.now() - this.sessionStartTime,
        performanceMetrics: this.performanceMetrics,
        queuedEvents: this.eventQueue.length
      };
    }
  }

  // Create global instance
  window.AnalyticsManager = new AnalyticsManager();

  // Auto-initialize when Firebase is ready
  if (window.FirebaseService) {
    window.AnalyticsManager.initialize();
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.AnalyticsManager.initialize();
      }, 1000);
    });
  }

  // Expose convenience methods
  window.trackEvent = (name, params) => window.AnalyticsManager.trackEvent(name, params);
  window.trackPageView = (path, title) => window.AnalyticsManager.trackPageView(path, title);
  window.trackSearch = (query, filters, count) => window.AnalyticsManager.trackSearch(query, filters, count);
  window.trackMythologyView = (m, t, i) => window.AnalyticsManager.trackMythologyView(m, t, i);

  console.log('[Analytics] Analytics module loaded');

})();
