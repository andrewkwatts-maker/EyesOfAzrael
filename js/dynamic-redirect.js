/**
 * Dynamic Redirect System - Eyes of Azrael
 *
 * Implements a hybrid approach for static-to-dynamic page transition:
 * - Detects JavaScript support
 * - Auto-redirects to Firebase dynamic version for users with JS
 * - Falls back to static HTML for bots/no-JS users
 * - Provides manual toggle option
 *
 * Usage: Include this script at the top of static HTML pages
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Enable automatic redirect to dynamic version
        enableAutoRedirect: true,

        // Delay before redirect (ms) - allows SEO crawlers to see static content first
        redirectDelay: 100,

        // Store user preference
        preferenceKey: 'eyesofazrael_prefer_dynamic',

        // Detect if this is a bot/crawler
        isBot: /bot|crawler|spider|crawling/i.test(navigator.userAgent),

        // Enable console logging
        debug: true
    };

    /**
     * Log debug message
     */
    function log(message, data) {
        if (CONFIG.debug) {
            console.log(`[DynamicRedirect] ${message}`, data || '');
        }
    }

    /**
     * Get user preference for dynamic version
     */
    function getUserPreference() {
        try {
            return localStorage.getItem(CONFIG.preferenceKey);
        } catch (e) {
            log('Error reading preference:', e);
            return null;
        }
    }

    /**
     * Set user preference
     */
    function setUserPreference(prefer) {
        try {
            localStorage.setItem(CONFIG.preferenceKey, prefer ? 'true' : 'false');
            log('Preference saved:', prefer);
        } catch (e) {
            log('Error saving preference:', e);
        }
    }

    /**
     * Extract entity information from current page URL/meta
     */
    function extractEntityInfo() {
        // Try to extract from URL path
        // Expected format: /mythos/{mythology}/{type}s/{id}.html
        const path = window.location.pathname;
        const match = path.match(/\/mythos\/([^\/]+)\/([^\/]+)\/([^\/]+)\.html$/);

        if (match) {
            const mythology = match[1];
            const typePlural = match[2];
            const id = match[3];

            // Remove plural 's' from type
            const type = typePlural.endsWith('s') ? typePlural.slice(0, -1) : typePlural;

            return { mythology, type, id };
        }

        // Try to extract from meta tags
        const mythologyMeta = document.querySelector('meta[name="mythology"]');
        const typeMeta = document.querySelector('meta[name="entity-type"]');
        const idMeta = document.querySelector('meta[name="entity-id"]');

        if (mythologyMeta && typeMeta && idMeta) {
            return {
                mythology: mythologyMeta.content,
                type: typeMeta.content,
                id: idMeta.content
            };
        }

        // Try to extract from page title
        const titleMatch = document.title.match(/^([^-]+)\s*-\s*([^-]+)/);
        if (titleMatch) {
            return {
                mythology: null,
                type: null,
                id: titleMatch[1].trim().toLowerCase().replace(/\s+/g, '-')
            };
        }

        log('Could not extract entity info from page');
        return null;
    }

    /**
     * Build dynamic page URL
     */
    function buildDynamicUrl(entityInfo) {
        if (!entityInfo) return null;

        const params = new URLSearchParams();

        if (entityInfo.type) {
            params.set('type', entityInfo.type);
        }
        if (entityInfo.id) {
            params.set('id', entityInfo.id);
        }
        if (entityInfo.mythology) {
            params.set('mythology', entityInfo.mythology);
        }

        return `/entity-dynamic.html?${params.toString()}`;
    }

    /**
     * Check if we should redirect to dynamic version
     */
    function shouldRedirect() {
        // Don't redirect if auto-redirect is disabled
        if (!CONFIG.enableAutoRedirect) {
            log('Auto-redirect disabled');
            return false;
        }

        // Don't redirect bots/crawlers
        if (CONFIG.isBot) {
            log('Bot detected, staying on static page');
            return false;
        }

        // Check user preference
        const preference = getUserPreference();
        if (preference === 'false') {
            log('User prefers static version');
            return false;
        }

        // Check if already on dynamic page
        if (window.location.pathname.includes('entity-dynamic.html')) {
            log('Already on dynamic page');
            return false;
        }

        // Check if this looks like an entity page
        const entityInfo = extractEntityInfo();
        if (!entityInfo) {
            log('Not an entity page');
            return false;
        }

        return true;
    }

    /**
     * Perform redirect to dynamic version
     */
    function redirectToDynamic() {
        const entityInfo = extractEntityInfo();
        const dynamicUrl = buildDynamicUrl(entityInfo);

        if (!dynamicUrl) {
            log('Could not build dynamic URL');
            return;
        }

        log('Redirecting to dynamic version:', dynamicUrl);

        // Add a marker to prevent redirect loops
        const url = new URL(dynamicUrl, window.location.origin);
        url.searchParams.set('from', 'static');

        setTimeout(() => {
            window.location.href = url.toString();
        }, CONFIG.redirectDelay);
    }

    /**
     * Add toggle button to page
     */
    function addToggleButton() {
        // Don't add button if already on dynamic page
        if (window.location.pathname.includes('entity-dynamic.html')) {
            return;
        }

        // Check if button already exists
        if (document.getElementById('dynamic-version-toggle')) {
            return;
        }

        const entityInfo = extractEntityInfo();
        if (!entityInfo) {
            return;
        }

        const dynamicUrl = buildDynamicUrl(entityInfo);
        if (!dynamicUrl) {
            return;
        }

        // Create toggle button
        const button = document.createElement('a');
        button.id = 'dynamic-version-toggle';
        button.href = dynamicUrl;
        button.className = 'dynamic-version-btn';
        button.innerHTML = `
            <span class="dynamic-btn-icon">🔄</span>
            <span class="dynamic-btn-text">Load Dynamic Version</span>
        `;

        button.onclick = function(e) {
            e.preventDefault();
            setUserPreference(true);
            window.location.href = dynamicUrl;
        };

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .dynamic-version-btn {
                position: fixed;
                bottom: 2rem;
                left: 2rem;
                padding: var(--spacing-md, 0.75rem) var(--spacing-lg, 1rem);
                background: rgba(var(--color-secondary-rgb, 100, 200, 100), 0.9);
                backdrop-filter: blur(10px);
                border: 2px solid var(--color-secondary, #64c864);
                border-radius: var(--radius-lg, 12px);
                color: white;
                font-weight: 600;
                text-decoration: none;
                box-shadow: var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.3));
                transition: all 0.3s ease;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
            }

            .dynamic-version-btn:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-xl, 0 15px 35px rgba(0,0,0,0.4));
                background: rgba(var(--color-secondary-rgb, 100, 200, 100), 1);
            }

            .dynamic-btn-icon {
                font-size: 1.2rem;
            }

            @media (max-width: 768px) {
                .dynamic-version-btn {
                    bottom: 1rem;
                    left: 1rem;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.8rem;
                }

                .dynamic-btn-text {
                    display: none;
                }
            }
        `;

        // Add to page
        document.head.appendChild(style);
        document.body.appendChild(button);

        log('Toggle button added');
    }

    /**
     * Add SEO-friendly notice
     */
    function addSEONotice() {
        // Only add for non-bot visitors
        if (CONFIG.isBot) {
            return;
        }

        // Add invisible notice for crawlers
        const notice = document.createElement('div');
        notice.style.display = 'none';
        notice.setAttribute('data-dynamic-version-available', 'true');
        notice.setAttribute('data-content-source', 'firebase');
        document.body.appendChild(notice);

        // Add structured data for dynamic version
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        const entityInfo = extractEntityInfo();
        if (entityInfo) {
            const dynamicUrl = buildDynamicUrl(entityInfo);
            script.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "url": window.location.href,
                "alternateName": "Dynamic Firebase Version",
                "relatedLink": dynamicUrl
            });
            document.head.appendChild(script);
        }
    }

    /**
     * Initialize the redirect system
     */
    function initialize() {
        log('Initializing dynamic redirect system');

        // Check if we came from a redirect
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('from') === 'static') {
            log('Came from static redirect, staying on dynamic page');
            return;
        }

        // Add SEO notice
        addSEONotice();

        // Check if we should redirect
        if (shouldRedirect()) {
            redirectToDynamic();
            return;
        }

        // Add toggle button for manual switching
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addToggleButton);
        } else {
            addToggleButton();
        }

        log('Initialization complete');
    }

    // Public API
    window.DynamicRedirect = {
        enable: () => {
            CONFIG.enableAutoRedirect = true;
            setUserPreference(true);
            log('Auto-redirect enabled');
        },
        disable: () => {
            CONFIG.enableAutoRedirect = false;
            setUserPreference(false);
            log('Auto-redirect disabled');
        },
        toggle: () => {
            const current = getUserPreference() !== 'false';
            setUserPreference(!current);
            window.location.reload();
        },
        redirectNow: redirectToDynamic,
        getPreference: getUserPreference,
        setPreference: setUserPreference
    };

    // Initialize on script load
    initialize();

})();
