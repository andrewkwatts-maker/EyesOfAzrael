/**
 * Submission Context Detection Module
 * Detects page context for pre-filling submission forms
 * Eyes of Azrael - Theory Submission System
 *
 * @module submission-context
 * @version 2.0.0
 */

(function(window) {
    'use strict';

    /**
     * SubmissionContext class
     * Analyzes current page to extract contextual data for pre-filling submission forms
     */
    class SubmissionContext {
        constructor() {
            this.context = null;
            this.pageTaxonomy = null;
            this.initialized = false;
        }

        /**
         * Initialize the context detector
         * Loads page taxonomy and detects current context
         *
         * @returns {Promise<Object>} The detected context object
         */
        async initialize() {
            if (this.initialized) {
                return this.context;
            }

            // Load page taxonomy if available
            await this.loadPageTaxonomy();

            // Detect current page context
            this.context = this.detectContext();
            this.initialized = true;

            return this.context;
        }

        /**
         * Load page taxonomy data
         * @private
         * @returns {Promise<void>}
         */
        async loadPageTaxonomy() {
            try {
                // Try to use existing window.pageTaxonomy first
                if (window.pageTaxonomy) {
                    this.pageTaxonomy = window.pageTaxonomy;
                    return;
                }

                // Otherwise fetch it
                const response = await fetch('/data/page-taxonomy.json');
                if (response.ok) {
                    this.pageTaxonomy = await response.json();
                    window.pageTaxonomy = this.pageTaxonomy;
                } else {
                    console.warn('Could not load page taxonomy');
                    this.pageTaxonomy = {};
                }
            } catch (error) {
                console.error('Error loading page taxonomy:', error);
                this.pageTaxonomy = {};
            }
        }

        /**
         * Detect page context from URL, breadcrumbs, and page metadata
         *
         * @returns {Object} Context object with mythology, section, topic, etc.
         */
        detectContext() {
            const urlContext = this.detectFromURL();
            const breadcrumbContext = this.detectFromBreadcrumbs();
            const metaContext = this.detectFromPageMetadata();

            // Merge all context sources, with URL taking precedence
            const merged = {
                ...metaContext,
                ...breadcrumbContext,
                ...urlContext
            };

            // Infer contribution type from section
            merged.suggestedType = this.inferContributionType(merged);

            // Determine which fields should be locked
            merged.locks = this.determineLocks(merged);

            return merged;
        }

        /**
         * Detect context from URL path
         * Analyzes path like /mythos/egyptian/deities/ra.html
         *
         * @private
         * @returns {Object} Context extracted from URL
         */
        detectFromURL() {
            const path = window.location.pathname;
            const context = {
                mythology: null,
                section: null,
                topic: null,
                isDetailPage: false,
                isIndexPage: false,
                isMythologyHome: false
            };

            // Remove leading/trailing slashes and split
            const segments = path.replace(/^\/|\/$/g, '').split('/');

            // Check if we're in mythos section
            const mythosIndex = segments.indexOf('mythos');
            if (mythosIndex === -1) {
                return context;
            }

            // Next segment after 'mythos' is the mythology/tradition
            if (segments.length > mythosIndex + 1) {
                const mythologySlug = segments[mythosIndex + 1];
                context.mythology = this.normalizeMythologyName(mythologySlug);
                context.mythologySlug = mythologySlug;
            }

            // Next segment is the section (deities, heroes, cosmology, etc.)
            if (segments.length > mythosIndex + 2) {
                const sectionSlug = segments[mythosIndex + 2];

                // Check if it's index.html (section page)
                if (sectionSlug === 'index.html') {
                    context.isMythologyHome = true;
                } else {
                    context.section = this.normalizeSectionName(sectionSlug);
                    context.sectionSlug = sectionSlug;
                }
            }

            // Next segment might be a topic (specific deity, hero, etc.)
            if (segments.length > mythosIndex + 3) {
                const topicSegment = segments[mythosIndex + 3];

                if (topicSegment && topicSegment !== 'index.html') {
                    // It's a detail page
                    const topicName = topicSegment.replace('.html', '');
                    context.topic = this.normalizeTopicName(topicName);
                    context.topicSlug = topicName;
                    context.isDetailPage = true;
                } else if (topicSegment === 'index.html') {
                    context.isIndexPage = true;
                }
            }

            // Verify against taxonomy if available
            if (this.pageTaxonomy && context.mythologySlug) {
                const taxonomyEntry = this.pageTaxonomy[context.mythologySlug];
                if (taxonomyEntry) {
                    context.mythologyFull = taxonomyEntry.name;
                    context.mythologyPath = taxonomyEntry.path;

                    // Verify section
                    if (context.sectionSlug && taxonomyEntry.sections) {
                        const sectionEntry = taxonomyEntry.sections[context.sectionSlug];
                        if (sectionEntry) {
                            context.sectionFull = sectionEntry.name;
                            context.sectionPath = sectionEntry.path;

                            // Verify topic
                            if (context.topicSlug && sectionEntry.topics) {
                                const topicEntry = sectionEntry.topics[context.topicSlug];
                                if (topicEntry) {
                                    context.topicFull = topicEntry.name;
                                    context.topicPath = topicEntry.path;
                                }
                            }
                        }
                    }
                }
            }

            return context;
        }

        /**
         * Detect context from breadcrumb navigation
         *
         * @private
         * @returns {Object} Context extracted from breadcrumbs
         */
        detectFromBreadcrumbs() {
            const context = {
                mythology: null,
                section: null,
                topic: null
            };

            const breadcrumb = document.querySelector('.breadcrumb, nav[aria-label="Breadcrumb"]');
            if (!breadcrumb) {
                return context;
            }

            const links = breadcrumb.querySelectorAll('a');
            const spans = breadcrumb.querySelectorAll('span');

            // Common pattern: Home → Mythology → Section → Topic
            if (links.length >= 1) {
                // Second link (index 1) is usually mythology
                if (links[1]) {
                    const mythologyText = links[1].textContent.trim();
                    if (!context.mythology) {
                        context.mythology = mythologyText;
                    }
                }

                // Third link (index 2) is usually section
                if (links[2]) {
                    const sectionText = links[2].textContent.trim();
                    if (!context.section) {
                        context.section = sectionText;
                    }
                }
            }

            // Last span is usually the current page (topic)
            if (spans.length > 0 && !context.topic) {
                const lastSpan = spans[spans.length - 1];
                const topicText = lastSpan.textContent.trim();
                if (topicText && topicText !== 'Home') {
                    // Check if it's not already captured as section
                    if (topicText !== context.section && topicText !== context.mythology) {
                        context.topic = topicText;
                    }
                }
            }

            return context;
        }

        /**
         * Detect context from page metadata (meta tags, data attributes, etc.)
         *
         * @private
         * @returns {Object} Context extracted from page metadata
         */
        detectFromPageMetadata() {
            const context = {
                mythology: null,
                section: null,
                topic: null,
                pageTitle: null
            };

            // Try data attributes on body/html
            const body = document.body;
            if (body) {
                if (body.dataset.mythology) {
                    context.mythology = body.dataset.mythology;
                }
                if (body.dataset.section) {
                    context.section = body.dataset.section;
                }
                if (body.dataset.topic) {
                    context.topic = body.dataset.topic;
                }
            }

            // Try meta tags
            const mythologyMeta = document.querySelector('meta[name="mythology"]');
            if (mythologyMeta && !context.mythology) {
                context.mythology = mythologyMeta.content;
            }

            const sectionMeta = document.querySelector('meta[name="section"]');
            if (sectionMeta && !context.section) {
                context.section = sectionMeta.content;
            }

            // Extract from page title
            const pageTitle = document.title;
            if (pageTitle) {
                context.pageTitle = pageTitle;

                // Try to extract mythology from title
                // Pattern: "Topic - Section - Mythology"
                const titleParts = pageTitle.split('-').map(p => p.trim());
                if (titleParts.length >= 2 && !context.mythology) {
                    // Last part is often site name or mythology
                    const lastPart = titleParts[titleParts.length - 1];
                    if (this.isMythologyName(lastPart)) {
                        context.mythology = lastPart;
                    }
                }
            }

            return context;
        }

        /**
         * Infer contribution type from detected context
         *
         * @private
         * @param {Object} context - The detected context
         * @returns {string|null} Suggested contribution type
         */
        inferContributionType(context) {
            if (!context.section) {
                return null;
            }

            const section = context.section.toLowerCase();

            // Map sections to contribution types
            const sectionMap = {
                'deities': 'deity',
                'gods': 'deity',
                'goddesses': 'deity',
                'pantheon': 'deity',

                'heroes': 'hero',
                'figures': 'hero',
                'prophets': 'hero',
                'saints': 'hero',
                'disciples': 'hero',

                'creatures': 'creature',
                'beings': 'creature',
                'angels': 'creature',
                'demons': 'creature',
                'spirits': 'creature',
                'monsters': 'creature',

                'places': 'place',
                'locations': 'place',
                'realms': 'place',
                'geography': 'place',
                'temples': 'place',
                'mountains': 'place',

                'items': 'item',
                'artifacts': 'item',
                'relics': 'item',
                'tools': 'item',
                'weapons': 'item',

                'herbs': 'herb',
                'plants': 'herb',
                'sacred plants': 'herb',
                'botanicals': 'herb',

                'texts': 'text',
                'scriptures': 'text',
                'books': 'text',
                'writings': 'text',

                'concepts': 'concept',
                'teachings': 'concept',
                'theology': 'concept',
                'philosophy': 'concept',
                'cosmology': 'concept',
                'eschatology': 'concept'
            };

            for (const [key, type] of Object.entries(sectionMap)) {
                if (section.includes(key)) {
                    return type;
                }
            }

            // Default to theory if no specific match
            return 'theory';
        }

        /**
         * Determine which fields should be locked based on context
         *
         * @private
         * @param {Object} context - The detected context
         * @returns {Object} Object with field names as keys and lock reasons as values
         */
        determineLocks(context) {
            const locks = {};

            // If on a specific mythology page, lock the mythology field
            if (context.mythology && context.mythology !== 'Home') {
                locks.mythology = {
                    locked: true,
                    value: context.mythologySlug || context.mythology,
                    reason: `Auto-filled from current page (${context.mythology})`
                };
            }

            // If on a specific section page, lock the section field
            if (context.section && !context.isDetailPage) {
                locks.section = {
                    locked: true,
                    value: context.sectionSlug || context.section,
                    reason: `Auto-filled from current section (${context.section})`
                };
            }

            // If viewing a specific topic/detail page, lock mythology, section, and suggest topic
            if (context.isDetailPage && context.topic) {
                locks.topic = {
                    locked: false, // Suggest but don't lock
                    value: context.topicSlug || context.topic,
                    reason: `Suggested from current page (${context.topic})`
                };

                // Also lock parent fields
                if (context.section) {
                    locks.section = {
                        locked: true,
                        value: context.sectionSlug || context.section,
                        reason: `Auto-filled from current page context`
                    };
                }
            }

            return locks;
        }

        /**
         * Get current context (initializes if needed)
         *
         * @returns {Promise<Object>} Current context object
         */
        async getCurrentContext() {
            if (!this.initialized) {
                await this.initialize();
            }
            return this.context;
        }

        /**
         * Generate URL for submission form with context parameters
         *
         * @param {string} [baseUrl] - Base URL for submit page (defaults to /theories/user-submissions/submit.html)
         * @returns {Promise<string>} Complete URL with context parameters
         */
        async getSubmissionUrl(baseUrl = '/theories/user-submissions/submit.html') {
            if (!this.initialized) {
                await this.initialize();
            }

            const params = new URLSearchParams();

            // Add mythology/page (use 'context' parameter for consistency with existing code)
            if (this.context.mythologySlug) {
                params.append('context', this.context.mythologySlug);
            } else if (this.context.mythology) {
                params.append('context', this.slugify(this.context.mythology));
            }

            // Add section
            if (this.context.sectionSlug) {
                params.append('section', this.context.sectionSlug);
            } else if (this.context.section) {
                params.append('section', this.slugify(this.context.section));
            }

            // Add topic (as suggestion, not required)
            if (this.context.topicSlug) {
                params.append('topic', this.context.topicSlug);
            } else if (this.context.topic) {
                params.append('topic', this.slugify(this.context.topic));
            }

            // Add suggested contribution type
            if (this.context.suggestedType) {
                params.append('type', this.context.suggestedType);
            }

            // Build final URL
            const queryString = params.toString();
            if (queryString) {
                return `${baseUrl}?${queryString}`;
            }

            return baseUrl;
        }

        /**
         * Check if a field should be locked based on current context
         *
         * @param {string} fieldName - Name of the field to check
         * @returns {Promise<Object|null>} Lock info object or null if not locked
         */
        async isContextLocked(fieldName) {
            if (!this.initialized) {
                await this.initialize();
            }

            const normalizedField = this.normalizeFieldName(fieldName);
            return this.context.locks[normalizedField] || null;
        }

        /**
         * Get all locked fields
         *
         * @returns {Promise<Object>} Object with all field locks
         */
        async getLockedFields() {
            if (!this.initialized) {
                await this.initialize();
            }

            return this.context.locks || {};
        }

        /**
         * Apply context to a form
         * Pre-fills and locks fields based on detected context
         *
         * @param {HTMLFormElement} form - The form element to apply context to
         * @returns {Promise<void>}
         */
        async applyContextToForm(form) {
            if (!this.initialized) {
                await this.initialize();
            }

            // Pre-fill mythology/page field
            if (this.context.locks.mythology) {
                const pageField = form.querySelector('#taxonomy-page, [name="page"]');
                if (pageField) {
                    pageField.value = this.context.locks.mythology.value;
                    if (this.context.locks.mythology.locked) {
                        pageField.disabled = true;
                        pageField.setAttribute('data-context-locked', 'true');
                        pageField.setAttribute('title', this.context.locks.mythology.reason);
                    }
                    // Trigger change event for cascading selects
                    pageField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            // Pre-fill section field
            if (this.context.locks.section) {
                const sectionField = form.querySelector('#taxonomy-section, [name="section"]');
                if (sectionField) {
                    // Wait for section options to populate (from page change)
                    setTimeout(() => {
                        sectionField.value = this.context.locks.section.value;
                        if (this.context.locks.section.locked) {
                            sectionField.disabled = true;
                            sectionField.setAttribute('data-context-locked', 'true');
                            sectionField.setAttribute('title', this.context.locks.section.reason);
                        }
                        // Trigger change event
                        sectionField.dispatchEvent(new Event('change', { bubbles: true }));
                    }, 100);
                }
            }

            // Suggest topic (don't lock)
            if (this.context.locks.topic) {
                const topicField = form.querySelector('#taxonomy-topic, [name="topic"]');
                if (topicField) {
                    setTimeout(() => {
                        topicField.value = this.context.locks.topic.value;
                        topicField.setAttribute('title', this.context.locks.topic.reason);
                        // Add visual indicator that it's suggested
                        topicField.style.borderColor = 'var(--color-accent)';
                    }, 200);
                }
            }

            // Pre-select contribution type if suggested
            if (this.context.suggestedType) {
                const typeField = form.querySelector('#contribution-type, [name="contributionType"]');
                if (typeField) {
                    typeField.value = this.context.suggestedType;
                    typeField.setAttribute('title', `Suggested based on current section (${this.context.section})`);
                    typeField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            // Add context indicator to form
            this.addContextIndicator(form);
        }

        /**
         * Add visual context indicator to form
         *
         * @private
         * @param {HTMLFormElement} form - The form element
         */
        addContextIndicator(form) {
            // Check if indicator already exists
            if (form.querySelector('.context-indicator')) {
                return;
            }

            const hasContext = this.context.mythology || this.context.section || this.context.topic;
            if (!hasContext) {
                return;
            }

            const indicator = document.createElement('div');
            indicator.className = 'context-indicator';
            indicator.style.cssText = `
                background: rgba(var(--color-accent-rgb, 139, 127, 255), 0.1);
                border-left: 4px solid var(--color-accent);
                padding: var(--spacing-md);
                margin-bottom: var(--spacing-lg);
                border-radius: var(--radius-md);
                font-size: var(--font-size-sm);
            `;

            let contextParts = [];
            if (this.context.mythology) {
                contextParts.push(`<strong>Mythology:</strong> ${this.context.mythology}`);
            }
            if (this.context.section) {
                contextParts.push(`<strong>Section:</strong> ${this.context.section}`);
            }
            if (this.context.topic) {
                contextParts.push(`<strong>Topic:</strong> ${this.context.topic}`);
            }

            indicator.innerHTML = `
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    <span style="font-size: 1.2rem;">📍</span>
                    <div>
                        <div style="font-weight: var(--font-semibold); margin-bottom: var(--spacing-xs);">
                            Context Detected
                        </div>
                        <div style="opacity: 0.9;">
                            ${contextParts.join(' • ')}
                        </div>
                    </div>
                </div>
            `;

            // Insert at the beginning of the form
            form.insertBefore(indicator, form.firstChild);
        }

        /**
         * Normalize field name for lookup
         *
         * @private
         * @param {string} fieldName - Raw field name
         * @returns {string} Normalized field name
         */
        normalizeFieldName(fieldName) {
            const map = {
                'page': 'mythology',
                'taxonomy-page': 'mythology',
                'taxonomy-section': 'section',
                'taxonomy-topic': 'topic'
            };

            return map[fieldName] || fieldName;
        }

        /**
         * Normalize mythology name from slug or full name
         *
         * @private
         * @param {string} name - Mythology name or slug
         * @returns {string} Normalized mythology name
         */
        normalizeMythologyName(name) {
            const map = {
                'greek': 'Greek',
                'norse': 'Norse',
                'egyptian': 'Egyptian',
                'roman': 'Roman',
                'celtic': 'Celtic',
                'hindu': 'Hindu',
                'buddhist': 'Buddhist',
                'chinese': 'Chinese',
                'japanese': 'Japanese',
                'jewish': 'Jewish',
                'christian': 'Christian',
                'islamic': 'Islamic',
                'aztec': 'Aztec',
                'mayan': 'Mayan',
                'babylonian': 'Babylonian',
                'mesopotamian': 'Mesopotamian',
                'apocryphal': 'Apocryphal',
                'gnostic': 'Gnostic'
            };

            const slug = name.toLowerCase();
            return map[slug] || this.capitalize(name);
        }

        /**
         * Normalize section name from slug
         *
         * @private
         * @param {string} name - Section name or slug
         * @returns {string} Normalized section name
         */
        normalizeSectionName(name) {
            return this.capitalize(name.replace(/-/g, ' '));
        }

        /**
         * Normalize topic name from slug
         *
         * @private
         * @param {string} name - Topic name or slug
         * @returns {string} Normalized topic name
         */
        normalizeTopicName(name) {
            return this.capitalize(name.replace(/-/g, ' '));
        }

        /**
         * Check if a string looks like a mythology name
         *
         * @private
         * @param {string} str - String to check
         * @returns {boolean} True if it looks like a mythology name
         */
        isMythologyName(str) {
            const mythologies = [
                'greek', 'norse', 'egyptian', 'roman', 'celtic', 'hindu',
                'buddhist', 'chinese', 'japanese', 'jewish', 'christian',
                'islamic', 'aztec', 'mayan', 'babylonian', 'mesopotamian',
                'apocryphal', 'gnostic', 'mythology', 'mythos'
            ];

            const lower = str.toLowerCase();
            return mythologies.some(myth => lower.includes(myth));
        }

        /**
         * Convert string to slug
         *
         * @private
         * @param {string} str - String to slugify
         * @returns {string} Slugified string
         */
        slugify(str) {
            return str
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        /**
         * Capitalize first letter of each word
         *
         * @private
         * @param {string} str - String to capitalize
         * @returns {string} Capitalized string
         */
        capitalize(str) {
            return str
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
    }

    // Export to window
    window.SubmissionContext = SubmissionContext;

    // Create global instance for convenience
    window.submissionContext = new SubmissionContext();

    // Legacy API compatibility (for existing code that uses window.SubmissionContext.detect(), etc.)
    window.SubmissionContext.detect = function() {
        return window.submissionContext.initialized
            ? window.submissionContext.context
            : null;
    };

    window.SubmissionContext.getLink = async function() {
        return await window.submissionContext.getSubmissionUrl();
    };

    window.SubmissionContext.getTitle = function() {
        const context = window.submissionContext.context;
        if (!context) return 'Share Your Theory';

        const parts = [];
        if (context.topic) parts.push(context.topic);
        if (context.section) parts.push(context.section);
        if (context.mythology) parts.push(context.mythology);

        return parts.length > 0 ? parts.join(' - ') : 'Share Your Theory';
    };

    window.SubmissionContext.buildURL = function(context) {
        const params = new URLSearchParams();
        if (context.tradition) params.set('context', context.tradition);
        if (context.category) params.set('section', context.category);
        if (context.entity) params.set('topic', context.entity);

        const baseURL = '/theories/user-submissions/submit.html';
        const queryString = params.toString();
        return queryString ? `${baseURL}?${queryString}` : baseURL;
    };

})(window);
