/**
 * Entity Detail Page Component
 *
 * Renders complete entity detail pages using the standardized metadata system.
 * This component integrates all the metadata display components:
 * - MetadataDisplayStandard - Main metadata sections
 * - TimelineDisplay - Chronological visualization
 * - RelationshipGraph - Visual relationship mapping
 * - GeographyDisplay - Map/region display
 * - SourceCitations - Formatted citations
 *
 * Features:
 * - Unified detail page for all entity types
 * - Hero section with entity branding
 * - Tabbed or scrolling content layout
 * - Responsive design
 * - Print-friendly
 * - Accessible markup
 *
 * @version 1.0.0
 * @requires js/config/metadata-sections.js
 * @requires js/components/metadata-display-standard.js
 * @requires js/components/timeline-display.js
 * @requires js/components/relationship-graph.js
 * @requires js/components/geography-display.js
 * @requires js/components/source-citations.js
 */

(function() {
    'use strict';

    class EntityDetailPage {
        constructor(options = {}) {
            this.options = {
                layout: options.layout || 'scroll', // 'scroll' or 'tabs'
                showHero: options.showHero !== false,
                showTimeline: options.showTimeline !== false,
                showRelationships: options.showRelationships !== false,
                showGeography: options.showGeography !== false,
                showSources: options.showSources !== false,
                compactMode: options.compactMode || false,
                printFriendly: options.printFriendly || false,
                onEntityClick: options.onEntityClick || null,
                onNavigate: options.onNavigate || null,
                ...options
            };

            // Initialize sub-components
            this.metadataRenderer = new (window.MetadataDisplayStandard || this.getStubComponent('MetadataDisplayStandard'))(this.options);
            this.timelineRenderer = new (window.TimelineDisplay || this.getStubComponent('TimelineDisplay'))(this.options);
            this.relationshipRenderer = new (window.RelationshipGraph || this.getStubComponent('RelationshipGraph'))(this.options);
            this.geographyRenderer = new (window.GeographyDisplay || this.getStubComponent('GeographyDisplay'))(this.options);
            this.citationsRenderer = new (window.SourceCitations || this.getStubComponent('SourceCitations'))(this.options);

            // Get configuration
            this.config = window.MetadataSections || {};
        }

        /**
         * Stub component for when dependencies aren't loaded
         */
        getStubComponent(name) {
            return class StubComponent {
                render() { return `<!-- ${name} not loaded -->`; }
            };
        }

        /**
         * Render complete entity detail page
         * @param {Object} entity - The entity data object
         * @param {Object} options - Additional rendering options
         * @returns {string} Complete HTML string
         */
        render(entity, options = {}) {
            if (!entity) {
                return this.renderError('No entity data provided');
            }

            const mergedOptions = { ...this.options, ...options };
            const entityType = entity.type || entity.entityType || 'deity';
            const colors = this.getEntityColors(entity, entityType);

            return `
                <article class="entity-detail-page"
                         data-entity-type="${this.escapeHtml(entityType)}"
                         data-entity-id="${this.escapeHtml(entity.id || '')}"
                         data-layout="${mergedOptions.layout}"
                         style="--edp-primary: ${colors.primary}; --edp-secondary: ${colors.secondary}; --edp-glow: ${colors.glow};">

                    ${mergedOptions.showHero ? this.renderHeroSection(entity, entityType, colors) : ''}

                    ${mergedOptions.layout === 'tabs' ? this.renderTabbedContent(entity, entityType, mergedOptions) : this.renderScrollContent(entity, entityType, mergedOptions)}

                </article>
            `;
        }

        /**
         * Render hero section
         */
        renderHeroSection(entity, entityType, colors) {
            const icon = this.getEntityIcon(entity, entityType);
            const mythologies = entity.mythologies || [entity.primaryMythology || entity.mythology];
            const primaryMythology = entity.primaryMythology || entity.mythology || '';

            return `
                <header class="edp-hero" style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});">
                    <div class="edp-hero-pattern"></div>
                    <div class="edp-hero-content">
                        ${icon ? `<div class="edp-hero-icon ${this.isSvg(icon) ? 'edp-hero-icon--svg' : ''}">${this.renderIcon(icon)}</div>` : ''}

                        <h1 class="edp-hero-title">${this.escapeHtml(entity.name || entity.title || 'Unknown Entity')}</h1>

                        ${entity.linguistic?.originalName ? `
                            <div class="edp-hero-original">${this.escapeHtml(entity.linguistic.originalName)}</div>
                        ` : ''}

                        <div class="edp-hero-badges">
                            <span class="edp-badge edp-badge--type">${this.getTypeIcon(entityType)} ${this.capitalize(entityType)}</span>
                            ${primaryMythology ? `<span class="edp-badge edp-badge--mythology">${this.getMythologyIcon(primaryMythology)} ${this.capitalize(primaryMythology)}</span>` : ''}
                            ${mythologies.length > 1 ? `<span class="edp-badge edp-badge--more">+${mythologies.length - 1} mythologies</span>` : ''}
                        </div>

                        ${entity.shortDescription ? `
                            <p class="edp-hero-description">${this.escapeHtml(this.truncate(entity.shortDescription, 300))}</p>
                        ` : ''}

                        ${this.renderQuickStats(entity, entityType)}
                    </div>
                </header>
            `;
        }

        /**
         * Render quick stats bar
         */
        renderQuickStats(entity, entityType) {
            const stats = [];

            // Domains/Aspects
            if (entity.domains?.length > 0) {
                stats.push({ label: 'Domains', value: entity.domains.length, icon: '\u2728' });
            }

            // Relationships count
            const relCount = this.countRelationships(entity);
            if (relCount > 0) {
                stats.push({ label: 'Connections', value: relCount, icon: '\u{1F517}' });
            }

            // Sacred sites
            const sitesCount = (entity.temples?.length || 0) + (entity.sacredSites?.length || 0) + (entity.cultCenters?.length || 0);
            if (sitesCount > 0) {
                stats.push({ label: 'Sacred Sites', value: sitesCount, icon: '\u{1F3DB}\uFE0F' });
            }

            // Sources count
            const sourcesCount = this.countSources(entity);
            if (sourcesCount > 0) {
                stats.push({ label: 'Sources', value: sourcesCount, icon: '\u{1F4DA}' });
            }

            if (stats.length === 0) return '';

            return `
                <div class="edp-quick-stats">
                    ${stats.map(stat => `
                        <div class="edp-stat">
                            <span class="edp-stat-icon">${stat.icon}</span>
                            <span class="edp-stat-value">${stat.value}</span>
                            <span class="edp-stat-label">${stat.label}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        /**
         * Render scrolling content layout
         */
        renderScrollContent(entity, entityType, options) {
            const sections = [];

            // Main metadata sections
            sections.push(`
                <div class="edp-section edp-metadata">
                    ${this.metadataRenderer.render(entity, entityType)}
                </div>
            `);

            // Timeline section
            if (options.showTimeline && this.hasTimelineData(entity)) {
                sections.push(`
                    <div class="edp-section edp-timeline">
                        <div class="edp-section-header">
                            <h2 class="edp-section-title">
                                <span class="edp-section-icon">\u{1F4C5}</span>
                                Timeline
                            </h2>
                        </div>
                        ${this.timelineRenderer.render(entity)}
                    </div>
                `);
            }

            // Relationships section
            if (options.showRelationships && this.hasRelationships(entity)) {
                sections.push(`
                    <div class="edp-section edp-relationships">
                        <div class="edp-section-header">
                            <h2 class="edp-section-title">
                                <span class="edp-section-icon">\u{1F465}</span>
                                Relationships
                            </h2>
                        </div>
                        ${this.relationshipRenderer.render(entity)}
                    </div>
                `);
            }

            // Geography section
            if (options.showGeography && this.hasGeographyData(entity)) {
                sections.push(`
                    <div class="edp-section edp-geography">
                        <div class="edp-section-header">
                            <h2 class="edp-section-title">
                                <span class="edp-section-icon">\u{1F30D}</span>
                                Geography
                            </h2>
                        </div>
                        ${this.geographyRenderer.render(entity)}
                    </div>
                `);
            }

            // Sources section
            if (options.showSources && this.hasSources(entity)) {
                sections.push(`
                    <div class="edp-section edp-sources">
                        <div class="edp-section-header">
                            <h2 class="edp-section-title">
                                <span class="edp-section-icon">\u{1F4DA}</span>
                                Sources & References
                            </h2>
                        </div>
                        ${this.citationsRenderer.render(entity)}
                    </div>
                `);
            }

            return `
                <div class="edp-content edp-content--scroll">
                    ${sections.join('')}
                </div>
            `;
        }

        /**
         * Render tabbed content layout
         */
        renderTabbedContent(entity, entityType, options) {
            const tabs = [
                { id: 'overview', label: 'Overview', icon: '\u{1F4CB}', always: true },
                { id: 'timeline', label: 'Timeline', icon: '\u{1F4C5}', show: options.showTimeline && this.hasTimelineData(entity) },
                { id: 'relationships', label: 'Relationships', icon: '\u{1F465}', show: options.showRelationships && this.hasRelationships(entity) },
                { id: 'geography', label: 'Geography', icon: '\u{1F30D}', show: options.showGeography && this.hasGeographyData(entity) },
                { id: 'sources', label: 'Sources', icon: '\u{1F4DA}', show: options.showSources && this.hasSources(entity) }
            ].filter(tab => tab.always || tab.show);

            return `
                <div class="edp-content edp-content--tabs">
                    <nav class="edp-tabs" role="tablist">
                        ${tabs.map((tab, index) => `
                            <button class="edp-tab ${index === 0 ? 'edp-tab--active' : ''}"
                                    role="tab"
                                    id="tab-${tab.id}"
                                    aria-controls="panel-${tab.id}"
                                    aria-selected="${index === 0}">
                                <span class="edp-tab-icon">${tab.icon}</span>
                                <span class="edp-tab-label">${tab.label}</span>
                            </button>
                        `).join('')}
                    </nav>

                    <div class="edp-tab-panels">
                        ${tabs.map((tab, index) => `
                            <div class="edp-tab-panel ${index === 0 ? 'edp-tab-panel--active' : ''}"
                                 role="tabpanel"
                                 id="panel-${tab.id}"
                                 aria-labelledby="tab-${tab.id}"
                                 ${index !== 0 ? 'hidden' : ''}>
                                ${this.renderTabContent(tab.id, entity, entityType, options)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render content for a specific tab
         */
        renderTabContent(tabId, entity, entityType, options) {
            switch (tabId) {
                case 'overview':
                    return this.metadataRenderer.render(entity, entityType);
                case 'timeline':
                    return this.timelineRenderer.render(entity);
                case 'relationships':
                    return this.relationshipRenderer.render(entity);
                case 'geography':
                    return this.geographyRenderer.render(entity);
                case 'sources':
                    return this.citationsRenderer.render(entity);
                default:
                    return '';
            }
        }

        /**
         * Render error state
         */
        renderError(message) {
            return `
                <div class="edp-error">
                    <span class="edp-error-icon">\u26A0\uFE0F</span>
                    <h2 class="edp-error-title">Unable to Load Entity</h2>
                    <p class="edp-error-message">${this.escapeHtml(message)}</p>
                </div>
            `;
        }

        // ==================== HELPER METHODS ====================

        /**
         * Get entity colors
         */
        getEntityColors(entity, entityType) {
            // Check if entity has custom colors
            if (entity.colors) {
                return {
                    primary: entity.colors.primary || '#667eea',
                    secondary: entity.colors.secondary || '#764ba2',
                    glow: entity.colors.glow || 'rgba(102, 126, 234, 0.3)'
                };
            }

            // Get from config
            if (this.config.getEntityColors) {
                return this.config.getEntityColors(entityType);
            }

            // Default colors by type
            const typeColors = {
                deity: { primary: '#FFD700', secondary: '#FFA500', glow: 'rgba(255, 215, 0, 0.3)' },
                creature: { primary: '#4CAF50', secondary: '#8BC34A', glow: 'rgba(76, 175, 80, 0.3)' },
                hero: { primary: '#CD7F32', secondary: '#D2691E', glow: 'rgba(205, 127, 50, 0.3)' },
                item: { primary: '#9C27B0', secondary: '#E91E63', glow: 'rgba(156, 39, 176, 0.3)' },
                place: { primary: '#2196F3', secondary: '#03A9F4', glow: 'rgba(33, 150, 243, 0.3)' },
                text: { primary: '#795548', secondary: '#A1887F', glow: 'rgba(121, 85, 72, 0.3)' },
                symbol: { primary: '#FF5722', secondary: '#FF7043', glow: 'rgba(255, 87, 34, 0.3)' },
                herb: { primary: '#388E3C', secondary: '#66BB6A', glow: 'rgba(56, 142, 60, 0.3)' },
                ritual: { primary: '#7B1FA2', secondary: '#AB47BC', glow: 'rgba(123, 31, 162, 0.3)' },
                archetype: { primary: '#607D8B', secondary: '#90A4AE', glow: 'rgba(96, 125, 139, 0.3)' }
            };

            return typeColors[entityType] || { primary: '#667eea', secondary: '#764ba2', glow: 'rgba(102, 126, 234, 0.3)' };
        }

        /**
         * Get entity icon
         */
        getEntityIcon(entity, entityType) {
            if (entity.icon) return entity.icon;

            const icons = {
                deity: '\u{1F451}',
                creature: '\u{1F409}',
                hero: '\u2694\uFE0F',
                item: '\u{1F48E}',
                place: '\u{1F3DB}\uFE0F',
                text: '\u{1F4DC}',
                symbol: '\u{1F4FF}',
                herb: '\u{1F33F}',
                ritual: '\u{1F56F}\uFE0F',
                archetype: '\u{1F3AD}'
            };

            return icons[entityType] || '\u2B50';
        }

        /**
         * Get type icon
         */
        getTypeIcon(type) {
            const icons = {
                deity: '\u{1F451}',
                creature: '\u{1F409}',
                hero: '\u2694\uFE0F',
                item: '\u{1F48E}',
                place: '\u{1F3DB}\uFE0F',
                text: '\u{1F4DC}',
                symbol: '\u{1F4FF}',
                herb: '\u{1F33F}',
                ritual: '\u{1F56F}\uFE0F',
                archetype: '\u{1F3AD}'
            };
            return icons[type] || '\u2B50';
        }

        /**
         * Get mythology icon
         */
        getMythologyIcon(mythology) {
            const icons = {
                greek: '\u26A1',
                roman: '\u{1F985}',
                norse: '\u{1F528}',
                egyptian: '\u{1F3DB}\uFE0F',
                hindu: '\u{1F549}\uFE0F',
                buddhist: '\u2638\uFE0F',
                celtic: '\u2618\uFE0F',
                chinese: '\u{1F409}',
                japanese: '\u26E9\uFE0F',
                christian: '\u271D\uFE0F',
                jewish: '\u2721\uFE0F',
                islamic: '\u262A\uFE0F'
            };
            return icons[mythology?.toLowerCase()] || '\u{1F30D}';
        }

        /**
         * Check if entity has timeline data
         */
        hasTimelineData(entity) {
            const temporal = entity.temporal || {};
            return !!(
                temporal.firstAttestation ||
                temporal.peakPopularity ||
                temporal.timelinePosition?.keyMoments?.length > 0 ||
                temporal.mythologicalDate ||
                temporal.historicalDate
            );
        }

        /**
         * Check if entity has relationships
         */
        hasRelationships(entity) {
            const rels = entity.relationships || {};
            const familyFields = ['father', 'mother', 'parents', 'children', 'siblings', 'consorts', 'spouse'];
            const assocFields = ['allies', 'enemies', 'servants', 'worshippers', 'companions', 'rivals'];

            const hasFamily = familyFields.some(f => entity[f] || rels[f]);
            const hasAssoc = assocFields.some(f => entity[f] || rels[f]);
            const hasParentage = entity.parentage && Object.keys(entity.parentage).length > 0;

            return hasFamily || hasAssoc || hasParentage;
        }

        /**
         * Count relationships
         */
        countRelationships(entity) {
            let count = 0;
            const fields = ['father', 'mother', 'parents', 'children', 'siblings', 'consorts', 'spouse',
                           'allies', 'enemies', 'servants', 'worshippers', 'companions', 'rivals'];

            fields.forEach(field => {
                const value = entity[field] || entity.relationships?.[field];
                if (value) {
                    count += Array.isArray(value) ? value.length : 1;
                }
            });

            return count;
        }

        /**
         * Check if entity has geography data
         */
        hasGeographyData(entity) {
            const geo = entity.geographical || {};
            return !!(
                entity.origin || geo.origin ||
                geo.region ||
                entity.temples?.length > 0 || geo.temples?.length > 0 ||
                entity.sacredSites?.length > 0 || geo.sacredSites?.length > 0 ||
                entity.cultCenters?.length > 0 || geo.cultCenters?.length > 0 ||
                geo.spreadPath?.length > 0 ||
                geo.modernCountries?.length > 0
            );
        }

        /**
         * Check if entity has sources
         */
        hasSources(entity) {
            return !!(
                entity.sources?.length > 0 ||
                entity.primarySources?.length > 0 ||
                entity.secondarySources?.length > 0 ||
                entity.modernReferences?.length > 0 ||
                entity.bibliography?.length > 0 ||
                entity.mythologyContexts?.some(c => c.textReferences?.length > 0)
            );
        }

        /**
         * Count sources
         */
        countSources(entity) {
            let count = 0;
            count += entity.sources?.length || 0;
            count += entity.primarySources?.length || 0;
            count += entity.secondarySources?.length || 0;
            count += entity.modernReferences?.length || 0;
            count += entity.bibliography?.length || 0;
            entity.mythologyContexts?.forEach(c => {
                count += c.textReferences?.length || 0;
            });
            return count;
        }

        /**
         * Check if value is SVG
         */
        isSvg(value) {
            return typeof value === 'string' && value.trim().startsWith('<svg');
        }

        /**
         * Render icon (handles both emoji and SVG)
         */
        renderIcon(icon) {
            if (!icon) return '';
            if (this.isSvg(icon)) {
                return icon; // SVG is already HTML
            }
            return icon; // Emoji or text
        }

        /**
         * Escape HTML
         */
        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = String(text);
            return div.innerHTML;
        }

        /**
         * Capitalize string
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        /**
         * Truncate text
         */
        truncate(text, maxLength = 150) {
            if (!text || text.length <= maxLength) return text || '';
            return text.substring(0, maxLength).trim() + '...';
        }

        /**
         * Initialize tab functionality
         */
        initTabs(container) {
            const tabs = container.querySelectorAll('.edp-tab');
            const panels = container.querySelectorAll('.edp-tab-panel');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Deactivate all
                    tabs.forEach(t => {
                        t.classList.remove('edp-tab--active');
                        t.setAttribute('aria-selected', 'false');
                    });
                    panels.forEach(p => {
                        p.classList.remove('edp-tab-panel--active');
                        p.hidden = true;
                    });

                    // Activate clicked
                    tab.classList.add('edp-tab--active');
                    tab.setAttribute('aria-selected', 'true');

                    const panelId = tab.getAttribute('aria-controls');
                    const panel = container.querySelector(`#${panelId}`);
                    if (panel) {
                        panel.classList.add('edp-tab-panel--active');
                        panel.hidden = false;
                    }
                });
            });
        }

        /**
         * Initialize all interactive functionality
         */
        init(container) {
            if (typeof container === 'string') {
                container = document.getElementById(container);
            }
            if (!container) return;

            // Init tabs if using tab layout
            if (container.querySelector('.edp-tabs')) {
                this.initTabs(container);
            }

            // Init collapsible sections in metadata
            const metadataContainer = container.querySelector('.md-sections');
            if (metadataContainer && this.metadataRenderer.initCollapsible) {
                this.metadataRenderer.initCollapsible(metadataContainer);
            }
        }
    }

    // Export to window
    window.EntityDetailPage = EntityDetailPage;

    // Also export as module if supported
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EntityDetailPage;
    }

})();
