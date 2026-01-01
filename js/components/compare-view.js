/**
 * Compare View Component - Enhanced Edition
 * Enables sophisticated side-by-side comparison of multiple entities from Firebase
 *
 * Features:
 * - Search and select 2-3 entities for optimal comparison
 * - Filter by mythology and entity type
 * - Side-by-side attribute comparison with synchronized scrolling
 * - Highlight matching/differing attributes with visual indicators
 * - Similarity score and Venn diagram visualization
 * - Export comparison as image or share via URL
 * - Fully responsive (side-by-side on desktop, stacked on mobile)
 * - Mobile swipe gestures for entity navigation
 * - Historic design standards compliance
 *
 * @version 2.0
 * @author Eyes of Azrael Development Team
 */

class CompareView {
    constructor(firestore) {
        this.db = firestore;
        this.selectedEntities = [];
        this.maxEntities = 3; // Optimal for side-by-side comparison
        this.minEntities = 2;
        this.searchResults = [];
        this.currentMobileEntity = 0; // For mobile swipe view

        // Mythology list
        this.mythologies = [
            'egyptian', 'greek', 'norse', 'celtic', 'hindu', 'buddhist',
            'chinese', 'japanese', 'aztec', 'mayan', 'babylonian', 'sumerian',
            'persian', 'roman', 'christian', 'islamic', 'jewish', 'yoruba',
            'native_american', 'apocryphal', 'tarot'
        ];

        // Collection types
        this.collections = {
            'deities': 'Deities',
            'heroes': 'Heroes',
            'creatures': 'Creatures',
            'cosmology': 'Cosmology',
            'rituals': 'Rituals',
            'herbs': 'Herbs',
            'texts': 'Texts',
            'symbols': 'Symbols',
            'items': 'Items',
            'places': 'Places',
            'magic': 'Magic',
            'concepts': 'Concepts',
            'events': 'Events'
        };

        // Touch handling for mobile swipe
        this.touchStartX = 0;
        this.touchEndX = 0;
    }

    /**
     * Main render method
     */
    async render(container) {
        console.log('[CompareView] Rendering...');

        // Parse URL params for pre-selected entities
        await this.parseURLParams();

        container.innerHTML = this.getHTML();
        await this.init();
    }

    /**
     * Parse URL parameters to pre-load entities
     * Format: #/compare?entities=deities:zeus,deities:odin
     */
    async parseURLParams() {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const entitiesParam = params.get('entities');

        if (entitiesParam) {
            const entityRefs = entitiesParam.split(',');
            for (const ref of entityRefs.slice(0, this.maxEntities)) {
                const [collection, id] = ref.split(':');
                if (collection && id) {
                    await this.addEntityById(collection, id);
                }
            }
        }
    }

    /**
     * Generate main HTML structure
     */
    getHTML() {
        return `
            <div class="compare-view">
                <!-- Header Section -->
                <div class="compare-header">
                    <div class="compare-title-section">
                        <h1>Compare Entities</h1>
                        <p class="compare-subtitle">Discover similarities and differences across mythologies</p>
                    </div>
                    <div class="compare-actions">
                        <button id="share-compare" class="btn-secondary" ${this.selectedEntities.length < this.minEntities ? 'disabled' : ''} title="Share this comparison">
                            <span class="btn-icon">🔗</span>
                            <span class="btn-text">Share</span>
                        </button>
                        <button id="export-compare" class="btn-secondary" ${this.selectedEntities.length < this.minEntities ? 'disabled' : ''} title="Export as image">
                            <span class="btn-icon">📥</span>
                            <span class="btn-text">Export</span>
                        </button>
                        <button id="clear-compare" class="btn-secondary" ${this.selectedEntities.length === 0 ? 'disabled' : ''} title="Clear all entities">
                            <span class="btn-icon">🗑️</span>
                            <span class="btn-text">Clear</span>
                        </button>
                    </div>
                </div>

                <!-- Entity Selector Panel -->
                <div class="entity-selector-panel">
                    <div class="selector-header">
                        <h3>Select Entities to Compare</h3>
                        <div class="entity-counter">
                            <span class="counter-current">${this.selectedEntities.length}</span>
                            <span class="counter-separator">/</span>
                            <span class="counter-max">${this.maxEntities}</span>
                        </div>
                    </div>

                    <!-- Selected Entities Preview -->
                    ${this.selectedEntities.length > 0 ? `
                        <div class="selected-entities-preview">
                            ${this.selectedEntities.map((entity, idx) => `
                                <div class="selected-entity-chip" data-index="${idx}">
                                    ${entity.icon ? this.renderIcon(entity.icon, 'chip-icon') : ''}
                                    <span class="chip-name">${entity.name || 'Unknown'}</span>
                                    <button class="chip-remove" data-index="${idx}" title="Remove">×</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- Search Controls -->
                    <div class="selector-controls">
                        <div class="search-input-wrapper">
                            <input type="text"
                                   id="entity-search"
                                   placeholder="Search entities by name..."
                                   ${this.selectedEntities.length >= this.maxEntities ? 'disabled' : ''}
                                   autocomplete="off">
                            <span class="search-icon">🔍</span>
                        </div>

                        <select id="mythology-filter">
                            <option value="">All Mythologies</option>
                            ${this.mythologies.map(m => `
                                <option value="${m}">${this.capitalize(m)}</option>
                            `).join('')}
                        </select>

                        <select id="type-filter">
                            <option value="">All Types</option>
                            ${Object.entries(this.collections).map(([key, label]) => `
                                <option value="${key}">${label}</option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Search Results -->
                    <div id="search-results" class="search-results">
                        ${this.selectedEntities.length >= this.maxEntities
                            ? '<p class="max-entities-msg">Maximum entities reached. Remove one to add more.</p>'
                            : '<p class="search-hint">🔎 Use the search above to find entities to compare</p>'}
                    </div>
                </div>

                <!-- Comparison Section -->
                <div id="comparison-section" class="comparison-section">
                    ${this.renderComparisonContent()}
                </div>
            </div>
        `;
    }

    /**
     * Render comparison content based on selected entities
     */
    renderComparisonContent() {
        if (this.selectedEntities.length === 0) {
            return this.renderEmptyState();
        } else if (this.selectedEntities.length === 1) {
            return this.renderSingleEntity();
        } else {
            return this.renderFullComparison();
        }
    }

    /**
     * Empty state when no entities selected
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">⚖️</div>
                <h2>No Entities Selected</h2>
                <p>Select at least ${this.minEntities} entities to compare their attributes side-by-side.</p>
                <div class="example-suggestions">
                    <p class="hint">💡 Try comparing:</p>
                    <ul class="suggestion-list">
                        <li>"Zeus" and "Odin" to see Greek vs Norse sky gods</li>
                        <li>"Ra" and "Amaterasu" for Egyptian vs Japanese sun deities</li>
                        <li>"Gilgamesh" and "Heracles" to compare ancient heroes</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Show message when only one entity selected
     */
    renderSingleEntity() {
        const entity = this.selectedEntities[0];
        return `
            <div class="single-entity-state">
                <div class="single-entity-icon">📌</div>
                <h2>One Entity Selected</h2>
                <p>You've selected <strong>${entity.name}</strong> from ${this.capitalize(entity.mythology || 'Unknown')} mythology.</p>
                <p>Add at least one more entity to enable comparison.</p>
            </div>
        `;
    }

    /**
     * Render full comparison with all features
     */
    renderFullComparison() {
        return `
            <!-- Similarity Visualization -->
            ${this.renderSimilaritySection()}

            <!-- Mobile Entity Selector (Tabs) -->
            <div class="mobile-entity-tabs">
                ${this.selectedEntities.map((entity, idx) => `
                    <button class="mobile-tab ${idx === this.currentMobileEntity ? 'active' : ''}"
                            data-index="${idx}">
                        ${entity.icon ? this.renderIcon(entity.icon, 'tab-icon') : '<span class="tab-icon">📜</span>'} ${entity.name}
                    </button>
                `).join('')}
            </div>

            <!-- Desktop: Side-by-side comparison table -->
            <div class="desktop-comparison">
                ${this.renderComparisonTable()}
            </div>

            <!-- Mobile: Stacked cards with swipe -->
            <div class="mobile-comparison">
                <div class="swipe-hint">← Swipe to switch entities →</div>
                <div class="mobile-cards-container" data-current="${this.currentMobileEntity}">
                    ${this.selectedEntities.map((entity, idx) =>
                        this.renderMobileEntityCard(entity, idx)
                    ).join('')}
                </div>
                <div class="mobile-navigation">
                    <button class="nav-prev" ${this.currentMobileEntity === 0 ? 'disabled' : ''}>← Previous</button>
                    <span class="nav-indicator">${this.currentMobileEntity + 1} of ${this.selectedEntities.length}</span>
                    <button class="nav-next" ${this.currentMobileEntity === this.selectedEntities.length - 1 ? 'disabled' : ''}>Next →</button>
                </div>
            </div>
        `;
    }

    /**
     * Render similarity score and Venn diagram visualization
     */
    renderSimilaritySection() {
        const similarity = this.calculateSimilarity();

        return `
            <div class="similarity-section">
                <h3>Similarity Analysis</h3>

                <div class="similarity-metrics">
                    <div class="metric-card">
                        <div class="metric-label">Overall Match</div>
                        <div class="metric-value">${similarity.overallScore}%</div>
                        <div class="metric-bar">
                            <div class="metric-bar-fill" style="width: ${similarity.overallScore}%"></div>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-label">Shared Attributes</div>
                        <div class="metric-value">${similarity.sharedAttributes}</div>
                        <div class="metric-description">out of ${similarity.totalAttributes}</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-label">Unique Attributes</div>
                        <div class="metric-value">${similarity.uniqueAttributes}</div>
                        <div class="metric-description">differences found</div>
                    </div>
                </div>

                <!-- Venn Diagram Visualization -->
                <div class="venn-diagram-container">
                    <h4>Attribute Overlap</h4>
                    ${this.renderVennDiagram(similarity)}
                </div>

                <!-- Key Similarities and Differences -->
                <div class="insights-grid">
                    <div class="insight-box similarities">
                        <h4>✓ Key Similarities</h4>
                        <ul>
                            ${similarity.similarities.slice(0, 5).map(sim => `
                                <li>${sim}</li>
                            `).join('') || '<li>No major similarities found</li>'}
                        </ul>
                    </div>

                    <div class="insight-box differences">
                        <h4>✗ Key Differences</h4>
                        <ul>
                            ${similarity.differences.slice(0, 5).map(diff => `
                                <li>${diff}</li>
                            `).join('') || '<li>No major differences found</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Calculate similarity metrics between entities
     */
    calculateSimilarity() {
        const attributes = this.getCommonAttributes();
        let sharedCount = 0;
        let totalCount = 0;
        const similarities = [];
        const differences = [];

        // Analyze each attribute
        attributes.forEach(attr => {
            const values = this.selectedEntities.map(e => e[attr.key]);
            const nonEmptyValues = values.filter(v =>
                v !== null && v !== undefined &&
                (Array.isArray(v) ? v.length > 0 : true)
            );

            if (nonEmptyValues.length > 0) {
                totalCount++;

                // Check if all non-empty values match
                const firstValue = JSON.stringify(nonEmptyValues[0]);
                const allMatch = nonEmptyValues.every(v => JSON.stringify(v) === firstValue);

                if (allMatch && nonEmptyValues.length === this.selectedEntities.length) {
                    sharedCount++;
                    similarities.push(`All share similar ${attr.label.toLowerCase()}`);
                } else {
                    differences.push(`Different ${attr.label.toLowerCase()}`);
                }
            }
        });

        const overallScore = totalCount > 0 ? Math.round((sharedCount / totalCount) * 100) : 0;

        return {
            overallScore,
            sharedAttributes: sharedCount,
            totalAttributes: totalCount,
            uniqueAttributes: totalCount - sharedCount,
            similarities,
            differences
        };
    }

    /**
     * Render Venn diagram visualization
     */
    renderVennDiagram(similarity) {
        // Simple Venn diagram representation using CSS
        const entities = this.selectedEntities;

        if (entities.length === 2) {
            return `
                <div class="venn-diagram venn-2">
                    <div class="venn-circle venn-circle-1" data-mythology="${entities[0].mythology}">
                        <span class="venn-label">${entities[0].name}</span>
                    </div>
                    <div class="venn-circle venn-circle-2" data-mythology="${entities[1].mythology}">
                        <span class="venn-label">${entities[1].name}</span>
                    </div>
                    <div class="venn-overlap">
                        <span class="venn-overlap-text">${similarity.sharedAttributes}</span>
                    </div>
                </div>
            `;
        } else if (entities.length === 3) {
            return `
                <div class="venn-diagram venn-3">
                    <div class="venn-circle venn-circle-1" data-mythology="${entities[0].mythology}">
                        <span class="venn-label">${entities[0].name}</span>
                    </div>
                    <div class="venn-circle venn-circle-2" data-mythology="${entities[1].mythology}">
                        <span class="venn-label">${entities[1].name}</span>
                    </div>
                    <div class="venn-circle venn-circle-3" data-mythology="${entities[2].mythology}">
                        <span class="venn-label">${entities[2].name}</span>
                    </div>
                    <div class="venn-center">
                        <span class="venn-center-text">${similarity.sharedAttributes}</span>
                    </div>
                </div>
            `;
        }

        return '<p>Venn diagram available for 2-3 entities</p>';
    }

    /**
     * Render desktop comparison table with synchronized scrolling
     */
    renderComparisonTable() {
        const attributes = this.getCommonAttributes();

        return `
            <div class="comparison-table-wrapper" id="comparison-table-wrapper">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th class="attribute-column sticky-column">Attribute</th>
                            ${this.selectedEntities.map((entity, idx) => `
                                <th class="entity-column entity-${idx}" data-mythology="${entity.mythology}">
                                    <div class="entity-header">
                                        ${entity.icon ? `<div class="entity-icon">${this.renderIcon(entity.icon)}</div>` : ''}
                                        <div class="entity-info">
                                            <div class="entity-name">${entity.name || 'Unknown'}</div>
                                            <div class="entity-meta">
                                                <span class="mythology-badge">${this.capitalize(entity.mythology || 'Unknown')}</span>
                                                <span class="type-badge">${this.capitalize(entity.type || 'Entity')}</span>
                                            </div>
                                        </div>
                                        <button class="remove-entity-btn" data-index="${idx}" title="Remove">×</button>
                                    </div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${attributes.map(attr => this.renderAttributeRow(attr)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render mobile entity card for swipe view
     */
    renderMobileEntityCard(entity, index) {
        const attributes = this.getCommonAttributes();
        const isActive = index === this.currentMobileEntity;

        return `
            <div class="mobile-entity-card ${isActive ? 'active' : ''}" data-index="${index}">
                <div class="mobile-card-header" data-mythology="${entity.mythology}">
                    ${entity.icon ? `<div class="card-icon">${this.renderIcon(entity.icon)}</div>` : ''}
                    <div class="card-info">
                        <h3 class="card-name">${entity.name || 'Unknown'}</h3>
                        <div class="card-meta">
                            <span class="mythology-badge">${this.capitalize(entity.mythology || 'Unknown')}</span>
                            <span class="type-badge">${this.capitalize(entity.type || 'Entity')}</span>
                        </div>
                    </div>
                    <button class="card-remove" data-index="${index}" title="Remove">×</button>
                </div>

                <div class="mobile-card-body">
                    ${attributes.map(attr => {
                        let value = entity[attr.key];
                        let displayValue = '—';

                        if (value !== null && value !== undefined) {
                            if (Array.isArray(value)) {
                                displayValue = value.length > 0 ? value.join(', ') : '—';
                            } else if (typeof value === 'object') {
                                displayValue = JSON.stringify(value);
                            } else {
                                displayValue = String(value);
                            }
                        }

                        // Truncate long values (especially descriptions)
                        const truncatedValue = typeof displayValue === 'string' && displayValue.length > 150
                            ? this.truncate(displayValue, 150)
                            : displayValue;

                        return `
                            <div class="mobile-attribute-row">
                                <div class="mobile-attr-label">${attr.label}</div>
                                <div class="mobile-attr-value">${truncatedValue}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render a single attribute comparison row
     */
    renderAttributeRow(attribute) {
        const values = this.selectedEntities.map(entity => {
            let value = entity[attribute.key];

            // Handle different data types
            if (value === null || value === undefined) {
                return { raw: null, display: '—', isEmpty: true };
            }

            if (Array.isArray(value)) {
                return {
                    raw: value,
                    display: value.length > 0 ? value.join(', ') : '—',
                    isEmpty: value.length === 0
                };
            }

            if (typeof value === 'object') {
                return {
                    raw: value,
                    display: JSON.stringify(value),
                    isEmpty: Object.keys(value).length === 0
                };
            }

            return { raw: value, display: String(value), isEmpty: false };
        });

        // Determine if values match (for highlighting)
        const highlightClass = this.getHighlightClass(values);

        return `
            <tr class="attribute-row ${highlightClass}">
                <td class="attribute-name sticky-column">${attribute.label}</td>
                ${values.map((val, idx) => `
                    <td class="entity-value entity-${idx}" data-mythology="${this.selectedEntities[idx].mythology}">
                        ${val.isEmpty ? '<span class="empty-value">—</span>' : this.formatValue(val.display)}
                    </td>
                `).join('')}
            </tr>
        `;
    }

    /**
     * Format value for display (truncate if too long)
     */
    formatValue(value) {
        if (typeof value === 'string' && value.length > 200) {
            return `
                <div class="long-value">
                    <div class="value-preview">${value.substring(0, 200)}...</div>
                    <button class="expand-value-btn">Show more</button>
                    <div class="value-full" style="display: none;">${value}</div>
                </div>
            `;
        }
        return value;
    }

    /**
     * Get CSS class for highlighting matching/unique attributes
     */
    getHighlightClass(values) {
        const nonEmptyValues = values.filter(v => !v.isEmpty);

        if (nonEmptyValues.length === 0) {
            return 'all-empty';
        }

        // Compare raw values
        const firstValue = JSON.stringify(nonEmptyValues[0].raw);
        const allMatch = nonEmptyValues.every(v => JSON.stringify(v.raw) === firstValue);

        if (allMatch && nonEmptyValues.length === values.length) {
            return 'all-match';
        } else if (allMatch) {
            return 'some-match';
        } else {
            return 'all-differ';
        }
    }

    /**
     * Get list of common attributes to compare
     */
    getCommonAttributes() {
        const baseAttributes = [
            { key: 'name', label: 'Name' },
            { key: 'mythology', label: 'Mythology' },
            { key: 'type', label: 'Type' },
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description' },
            { key: 'domain', label: 'Domain' },
            { key: 'domains', label: 'Domains' },
            { key: 'symbols', label: 'Symbols' },
            { key: 'attributes', label: 'Attributes' },
            { key: 'powers', label: 'Powers' },
            { key: 'epithets', label: 'Epithets' },
            { key: 'family', label: 'Family' },
            { key: 'parents', label: 'Parents' },
            { key: 'children', label: 'Children' },
            { key: 'consort', label: 'Consort' },
            { key: 'siblings', label: 'Siblings' },
            { key: 'sacred_animals', label: 'Sacred Animals' },
            { key: 'sacred_plants', label: 'Sacred Plants' },
            { key: 'festivals', label: 'Festivals' },
            { key: 'temples', label: 'Temples' },
            { key: 'weapons', label: 'Weapons' },
            { key: 'myths', label: 'Associated Myths' },
            { key: 'cultural_significance', label: 'Cultural Significance' },
            { key: 'modern_influence', label: 'Modern Influence' }
        ];

        // Filter to only attributes that at least one entity has
        return baseAttributes.filter(attr =>
            this.selectedEntities.some(entity => {
                const value = entity[attr.key];
                return value !== null && value !== undefined &&
                       (!Array.isArray(value) || value.length > 0) &&
                       (typeof value !== 'object' || Object.keys(value).length > 0);
            })
        );
    }

    /**
     * Initialize event listeners and functionality
     */
    async init() {
        console.log('[CompareView] Initializing...');

        // Search input with debounce
        const searchInput = document.getElementById('entity-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
        }

        // Filter dropdowns
        const mythologyFilter = document.getElementById('mythology-filter');
        const typeFilter = document.getElementById('type-filter');

        if (mythologyFilter) {
            mythologyFilter.addEventListener('change', () => {
                const searchValue = searchInput ? searchInput.value : '';
                this.performSearch(searchValue);
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                const searchValue = searchInput ? searchInput.value : '';
                this.performSearch(searchValue);
            });
        }

        // Action buttons
        const clearBtn = document.getElementById('clear-compare');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }

        const shareBtn = document.getElementById('share-compare');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareComparison());
        }

        const exportBtn = document.getElementById('export-compare');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportComparison());
        }

        // Remove entity buttons (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-entity-btn') ||
                e.target.classList.contains('chip-remove') ||
                e.target.classList.contains('card-remove')) {
                const index = parseInt(e.target.dataset.index);
                this.removeEntity(index);
            }

            // Expand value button
            if (e.target.classList.contains('expand-value-btn')) {
                this.toggleValueExpand(e.target);
            }
        });

        // Setup synchronized scrolling for comparison table
        this.setupSynchronizedScrolling();

        // Setup mobile swipe gestures
        this.setupMobileSwipe();

        // Mobile tab navigation
        this.setupMobileTabs();

        console.log('[CompareView] Initialized');
    }

    /**
     * Setup synchronized scrolling between table columns
     */
    setupSynchronizedScrolling() {
        const wrapper = document.getElementById('comparison-table-wrapper');
        if (!wrapper) return;

        let isScrolling = false;

        wrapper.addEventListener('scroll', () => {
            if (isScrolling) return;
            isScrolling = true;

            // Store scroll position for restoration
            localStorage.setItem('compareScrollTop', wrapper.scrollTop);
            localStorage.setItem('compareScrollLeft', wrapper.scrollLeft);

            // Smooth scroll animation
            requestAnimationFrame(() => {
                isScrolling = false;
            });
        });

        // Restore scroll position if returning to page
        const savedTop = localStorage.getItem('compareScrollTop');
        const savedLeft = localStorage.getItem('compareScrollLeft');
        if (savedTop) wrapper.scrollTop = parseInt(savedTop);
        if (savedLeft) wrapper.scrollLeft = parseInt(savedLeft);
    }

    /**
     * Setup mobile swipe gestures
     */
    setupMobileSwipe() {
        const container = document.querySelector('.mobile-cards-container');
        if (!container) return;

        container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        });

        container.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });

        // Navigation buttons
        const prevBtn = document.querySelector('.nav-prev');
        const nextBtn = document.querySelector('.nav-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateMobile(-1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateMobile(1));
        }
    }

    /**
     * Handle swipe gesture
     */
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next entity
                this.navigateMobile(1);
            } else {
                // Swipe right - previous entity
                this.navigateMobile(-1);
            }
        }
    }

    /**
     * Navigate between mobile entity cards
     */
    navigateMobile(direction) {
        const newIndex = this.currentMobileEntity + direction;

        if (newIndex >= 0 && newIndex < this.selectedEntities.length) {
            this.currentMobileEntity = newIndex;
            this.updateMobileView();
        }
    }

    /**
     * Update mobile view to show current entity
     */
    updateMobileView() {
        // Update active card
        document.querySelectorAll('.mobile-entity-card').forEach((card, idx) => {
            card.classList.toggle('active', idx === this.currentMobileEntity);
        });

        // Update navigation buttons
        const prevBtn = document.querySelector('.nav-prev');
        const nextBtn = document.querySelector('.nav-next');
        const indicator = document.querySelector('.nav-indicator');

        if (prevBtn) prevBtn.disabled = this.currentMobileEntity === 0;
        if (nextBtn) nextBtn.disabled = this.currentMobileEntity === this.selectedEntities.length - 1;
        if (indicator) indicator.textContent = `${this.currentMobileEntity + 1} of ${this.selectedEntities.length}`;

        // Update tabs
        document.querySelectorAll('.mobile-tab').forEach((tab, idx) => {
            tab.classList.toggle('active', idx === this.currentMobileEntity);
        });
    }

    /**
     * Setup mobile tab navigation
     */
    setupMobileTabs() {
        document.querySelectorAll('.mobile-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.currentMobileEntity = index;
                this.updateMobileView();
            });
        });
    }

    /**
     * Toggle expanded view for long values
     */
    toggleValueExpand(button) {
        const parent = button.closest('.long-value');
        const preview = parent.querySelector('.value-preview');
        const full = parent.querySelector('.value-full');

        if (full.style.display === 'none') {
            preview.style.display = 'none';
            full.style.display = 'block';
            button.textContent = 'Show less';
        } else {
            preview.style.display = 'block';
            full.style.display = 'none';
            button.textContent = 'Show more';
        }
    }

    /**
     * Perform entity search
     */
    async performSearch(query) {
        const mythologyFilter = document.getElementById('mythology-filter')?.value || '';
        const typeFilter = document.getElementById('type-filter')?.value || '';
        const resultsContainer = document.getElementById('search-results');

        if (!resultsContainer) return;

        // Show loading state
        resultsContainer.innerHTML = '<div class="search-loading">🔍 Searching...</div>';

        try {
            const results = await this.searchEntities(query, mythologyFilter, typeFilter);
            this.searchResults = results;

            if (results.length === 0) {
                resultsContainer.innerHTML = '<p class="no-results">No entities found matching your criteria.</p>';
            } else {
                resultsContainer.innerHTML = `
                    <div class="search-results-grid">
                        ${results.map(entity => this.renderSearchResult(entity)).join('')}
                    </div>
                `;

                // Add click handlers
                resultsContainer.querySelectorAll('.search-result-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const collection = card.dataset.collection;
                        const id = card.dataset.id;
                        const entityData = JSON.parse(card.dataset.entity);
                        this.addEntity(entityData, collection);
                    });
                });
            }
        } catch (error) {
            console.error('[CompareView] Search error:', error);
            resultsContainer.innerHTML = '<p class="search-error">Error performing search. Please try again.</p>';
        }
    }

    /**
     * Search entities in Firebase
     */
    async searchEntities(query, mythologyFilter, typeFilter) {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }

        const results = [];
        const collections = typeFilter ? [typeFilter] : Object.keys(this.collections);
        const searchLower = query.toLowerCase();

        for (const collectionName of collections) {
            try {
                let queryRef = this.db.collection(collectionName);

                // Apply mythology filter
                if (mythologyFilter) {
                    queryRef = queryRef.where('mythology', '==', mythologyFilter);
                }

                // Limit results per collection
                queryRef = queryRef.limit(20);

                const snapshot = await queryRef.get();

                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const name = (data.name || '').toLowerCase();

                    // Filter by query (client-side since Firestore doesn't support full-text search)
                    if (!query || name.includes(searchLower)) {
                        // Skip already selected entities
                        const alreadySelected = this.selectedEntities.some(e =>
                            e.id === doc.id && e._collection === collectionName
                        );

                        if (!alreadySelected) {
                            results.push({
                                id: doc.id,
                                collection: collectionName,
                                ...data
                            });
                        }
                    }
                });
            } catch (error) {
                console.error(`[CompareView] Error searching ${collectionName}:`, error);
            }
        }

        return results.slice(0, 50); // Limit total results
    }

    /**
     * Render search result card
     */
    renderSearchResult(entity) {
        // Truncate description for display
        const truncatedDescription = entity.description
            ? this.truncate(entity.description, 120)
            : '';

        return `
            <div class="search-result-card"
                 data-collection="${entity.collection}"
                 data-id="${entity.id}"
                 data-entity='${JSON.stringify(entity).replace(/'/g, "&apos;")}'>
                <div class="result-header">
                    ${entity.icon ? this.renderIcon(entity.icon, 'result-icon') : ''}
                    <div class="result-info">
                        <div class="result-name">${entity.name || 'Unknown'}</div>
                        <div class="result-meta">
                            <span class="mythology-badge">${this.capitalize(entity.mythology || 'Unknown')}</span>
                            <span class="type-badge">${this.capitalize(entity.type || entity.collection)}</span>
                        </div>
                    </div>
                </div>
                ${entity.title ? `<div class="result-title">${this.truncate(entity.title, 80)}</div>` : ''}
                ${truncatedDescription ? `<div class="result-description">${truncatedDescription}</div>` : ''}
            </div>
        `;
    }

    /**
     * Add entity to comparison by ID
     */
    async addEntityById(collection, id) {
        if (!this.db) return;

        try {
            const doc = await this.db.collection(collection).doc(id).get();
            if (doc.exists) {
                const entityData = { id: doc.id, ...doc.data() };
                this.addEntity(entityData, collection);
            }
        } catch (error) {
            console.error('[CompareView] Error loading entity:', error);
        }
    }

    /**
     * Add entity to comparison
     */
    addEntity(entityData, collection) {
        if (this.selectedEntities.length >= this.maxEntities) {
            this.showToast('Maximum entities reached. Remove one to add more.');
            return;
        }

        // Add collection reference
        entityData._collection = collection;

        this.selectedEntities.push(entityData);
        console.log('[CompareView] Added entity:', entityData.name);

        // Track comparison when 2+ entities selected
        if (this.selectedEntities.length >= this.minEntities && window.AnalyticsManager) {
            const entityIds = this.selectedEntities.map(e => e.id);
            const entityTypes = this.selectedEntities.map(e => e.type || e._collection);
            window.AnalyticsManager.trackEntityComparison(entityIds, entityTypes);
        }

        this.refresh();
    }

    /**
     * Remove entity from comparison
     */
    removeEntity(index) {
        if (index >= 0 && index < this.selectedEntities.length) {
            const removed = this.selectedEntities.splice(index, 1)[0];
            console.log('[CompareView] Removed entity:', removed.name);

            // Reset mobile view if needed
            if (this.currentMobileEntity >= this.selectedEntities.length) {
                this.currentMobileEntity = Math.max(0, this.selectedEntities.length - 1);
            }

            this.refresh();
        }
    }

    /**
     * Clear all selected entities
     */
    clearAll() {
        if (confirm('Clear all selected entities?')) {
            this.selectedEntities = [];
            this.currentMobileEntity = 0;
            console.log('[CompareView] Cleared all entities');
            this.refresh();
        }
    }

    /**
     * Share comparison via URL
     */
    shareComparison() {
        if (this.selectedEntities.length < this.minEntities) {
            this.showToast('Select at least 2 entities to share.');
            return;
        }

        // Build URL with entity references
        const entityRefs = this.selectedEntities.map(e =>
            `${e._collection}:${e.id}`
        ).join(',');

        const url = `${window.location.origin}${window.location.pathname}#/compare?entities=${entityRefs}`;

        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('✓ Share link copied to clipboard!');
            }).catch(err => {
                console.error('[CompareView] Copy failed:', err);
                this.showToast('Failed to copy link.');
            });
        } else {
            // Fallback
            prompt('Copy this URL:', url);
        }
    }

    /**
     * Export comparison as image
     */
    async exportComparison() {
        if (this.selectedEntities.length < this.minEntities) {
            this.showToast('Select at least 2 entities to export.');
            return;
        }

        // Use browser print function as fallback
        this.showToast('💡 Use your browser\'s Print function (Ctrl+P) and select "Save as PDF"');

        // Trigger print dialog
        setTimeout(() => {
            window.print();
        }, 500);
    }

    /**
     * Refresh the view
     */
    refresh() {
        const container = document.querySelector('.compare-view');
        if (!container) return;

        const parent = container.parentElement;
        this.render(parent);
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        // Use existing toast system if available
        if (window.showToast) {
            window.showToast(message);
        } else if (window.ToastManager) {
            window.ToastManager.show(message, 'info');
        } else {
            // Fallback: create simple toast
            const toast = document.createElement('div');
            toast.className = 'compare-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                background: var(--color-bg-card, #1a1f3a);
                color: var(--color-text-primary, #f8f9fa);
                padding: 1rem 1.5rem;
                border-radius: 8px;
                border: 1px solid var(--color-primary, #8b7fff);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                animation: slideInUp 0.3s ease;
            `;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideOutDown 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Truncate string
     */
    truncate(str, length) {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    }

    /**
     * Render entity icon with inline SVG support
     * @param {string} icon - Icon value (emoji, URL, or inline SVG)
     * @param {string} cssClass - Optional CSS class to add
     * @returns {string} HTML for the icon
     */
    renderIcon(icon, cssClass = '') {
        if (!icon) return '';

        // Check if icon is inline SVG
        if (typeof icon === 'string' && icon.trim().startsWith('<svg')) {
            return `<span class="entity-icon-svg ${cssClass}">${icon}</span>`;
        }

        // Check if icon is a URL
        if (typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))) {
            return `<img src="${icon}" alt="icon" class="entity-icon-img ${cssClass}" />`;
        }

        // Default: treat as emoji or text
        return `<span class="${cssClass}">${icon}</span>`;
    }
}

// CommonJS export for Node.js (Jest tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompareView;
}

// Browser global export
if (typeof window !== 'undefined') {
    window.CompareView = CompareView;
}
