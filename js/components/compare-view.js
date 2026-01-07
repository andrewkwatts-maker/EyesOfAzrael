/**
 * Compare View Component - Polished Edition v4.0
 * Side-by-side entity comparison with enhanced UX
 *
 * Features:
 * - Search and select 2-3 entities for comparison
 * - Dropdown/search entity selector with recent comparisons
 * - Filter by mythology and entity type
 * - Side-by-side attribute comparison with synchronized scrolling
 * - Difference highlighting with visual indicators (green/red/orange)
 * - Text truncation with expandable sections
 * - Similarity score and Venn diagram visualization
 * - Shared attributes section for quick overview
 * - Share comparison via URL
 * - Add to compare tray from entity cards
 * - Swap entities button with animation
 * - Mobile: Stacked cards with tab switching and swipe
 * - Comparison persists across navigation (sessionStorage)
 * - Print-friendly styling
 * - WCAG AA accessibility compliance
 *
 * @version 4.0
 * @author Eyes of Azrael Development Team
 */

class CompareView {
    constructor(firestore) {
        this.db = firestore;
        this.maxEntities = 3;
        this.minEntities = 2;
        this.searchResults = [];
        this.currentMobileEntity = 0;
        this.suggestedEntities = [];

        // Load persisted state
        this.selectedEntities = this.loadPersistedEntities();
        this.recentComparisons = this.loadRecentComparisons();

        // Mythology list with display names
        this.mythologies = [
            { id: 'egyptian', name: 'Egyptian', color: '#CD853F' },
            { id: 'greek', name: 'Greek', color: '#DAA520' },
            { id: 'norse', name: 'Norse', color: '#4682B4' },
            { id: 'celtic', name: 'Celtic', color: '#228B22' },
            { id: 'hindu', name: 'Hindu', color: '#FF6B35' },
            { id: 'buddhist', name: 'Buddhist', color: '#9C27B0' },
            { id: 'chinese', name: 'Chinese', color: '#DC143C' },
            { id: 'japanese', name: 'Japanese', color: '#FF5722' },
            { id: 'aztec', name: 'Aztec', color: '#00BCD4' },
            { id: 'mayan', name: 'Mayan', color: '#009688' },
            { id: 'babylonian', name: 'Babylonian', color: '#795548' },
            { id: 'sumerian', name: 'Sumerian', color: '#8D6E63' },
            { id: 'persian', name: 'Persian', color: '#3F51B5' },
            { id: 'roman', name: 'Roman', color: '#B71C1C' },
            { id: 'christian', name: 'Christian', color: '#1565C0' },
            { id: 'islamic', name: 'Islamic', color: '#2E7D32' },
            { id: 'jewish', name: 'Jewish', color: '#0D47A1' },
            { id: 'yoruba', name: 'Yoruba', color: '#E65100' },
            { id: 'native_american', name: 'Native American', color: '#5D4037' },
            { id: 'apocryphal', name: 'Apocryphal', color: '#37474F' },
            { id: 'tarot', name: 'Tarot', color: '#7B1FA2' }
        ];

        // Collection types
        this.collections = {
            'deities': { label: 'Deities', icon: 'crown' },
            'heroes': { label: 'Heroes', icon: 'shield' },
            'creatures': { label: 'Creatures', icon: 'dragon' },
            'items': { label: 'Sacred Items', icon: 'gem' },
            'places': { label: 'Sacred Places', icon: 'mountain' },
            'texts': { label: 'Sacred Texts', icon: 'scroll' },
            'symbols': { label: 'Symbols', icon: 'star' },
            'rituals': { label: 'Rituals', icon: 'fire' },
            'herbs': { label: 'Sacred Herbs', icon: 'leaf' },
            'cosmology': { label: 'Cosmology', icon: 'globe' },
            'concepts': { label: 'Concepts', icon: 'lightbulb' },
            'events': { label: 'Events', icon: 'calendar' }
        };

        // Touch handling for mobile swipe
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchStartY = 0;
        this.touchEndY = 0;

        // Truncation settings
        this.descriptionMaxLines = 3;
        this.arrayMaxItems = 5;
        this.nameMaxLines = 2;

        // Persist state on page unload
        this.setupPersistence();
    }

    /**
     * Load persisted entities from sessionStorage
     */
    loadPersistedEntities() {
        try {
            const stored = sessionStorage.getItem('eoa_compare_entities');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length <= this.maxEntities) {
                    console.log('[CompareView] Loaded persisted entities:', parsed.length);
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('[CompareView] Failed to load persisted entities:', e);
        }
        return [];
    }

    /**
     * Persist entities to sessionStorage
     */
    persistEntities() {
        try {
            sessionStorage.setItem('eoa_compare_entities', JSON.stringify(this.selectedEntities));
        } catch (e) {
            console.warn('[CompareView] Failed to persist entities:', e);
        }
    }

    /**
     * Setup persistence on page navigation
     */
    setupPersistence() {
        // Save state before page unload
        window.addEventListener('beforeunload', () => this.persistEntities());

        // Also persist when hash changes (SPA navigation)
        window.addEventListener('hashchange', () => this.persistEntities());
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

        // Load suggestions if entities selected
        if (this.selectedEntities.length === 1) {
            await this.loadSuggestions();
        }
    }

    /**
     * Parse URL parameters to pre-load entities
     * Supports formats:
     * - #/compare?entities=deities:zeus,deities:odin
     * - #/compare/deities:zeus/deities:odin
     */
    async parseURLParams() {
        const hash = window.location.hash;
        let entityRefs = [];

        // Check query param format
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const entitiesParam = params.get('entities');

        if (entitiesParam) {
            entityRefs = entitiesParam.split(',');
        } else {
            // Check path format: #/compare/entity1/entity2
            const pathMatch = hash.match(/#\/compare\/([^?]+)/);
            if (pathMatch) {
                entityRefs = pathMatch[1].split('/').filter(Boolean);
            }
        }

        for (const ref of entityRefs.slice(0, this.maxEntities)) {
            const [collection, id] = ref.split(':');
            if (collection && id) {
                await this.addEntityById(collection, id);
            }
        }
    }

    /**
     * Generate main HTML structure
     */
    getHTML() {
        const hasEnoughEntities = this.selectedEntities.length >= this.minEntities;

        return `
            <div class="compare-view" role="main" aria-label="Entity Comparison">
                <!-- Header Section -->
                <header class="compare-header">
                    <div class="compare-title-section">
                        <h1>
                            <span class="compare-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                                    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0-6v6"/>
                                </svg>
                            </span>
                            Compare Entities
                        </h1>
                        <p class="compare-subtitle">Discover connections across mythologies</p>
                    </div>
                    <div class="compare-actions" role="toolbar" aria-label="Comparison actions">
                        <button id="swap-entities"
                                class="btn-action btn-swap"
                                ${this.selectedEntities.length !== 2 ? 'disabled' : ''}
                                title="Swap entity positions"
                                aria-label="Swap entity positions">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
                            </svg>
                            <span class="btn-text">Swap</span>
                        </button>
                        <button id="share-compare"
                                class="btn-action btn-share"
                                ${!hasEnoughEntities ? 'disabled' : ''}
                                title="Share comparison link"
                                aria-label="Share comparison link">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            <span class="btn-text">Share</span>
                        </button>
                        <button id="print-compare"
                                class="btn-action btn-print"
                                ${!hasEnoughEntities ? 'disabled' : ''}
                                title="Print comparison"
                                aria-label="Print comparison">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                <rect x="6" y="14" width="12" height="8"/>
                            </svg>
                            <span class="btn-text">Print</span>
                        </button>
                        <button id="clear-compare"
                                class="btn-action btn-clear"
                                ${this.selectedEntities.length === 0 ? 'disabled' : ''}
                                title="Clear all entities"
                                aria-label="Clear all entities">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            <span class="btn-text">Clear</span>
                        </button>
                    </div>
                </header>

                <!-- Entity Selector Panel -->
                <section class="entity-selector-panel" aria-label="Entity selection">
                    <div class="selector-header">
                        <h2>Select Entities to Compare</h2>
                        <div class="entity-counter" role="status" aria-live="polite">
                            <span class="counter-current">${this.selectedEntities.length}</span>
                            <span class="counter-separator">/</span>
                            <span class="counter-max">${this.maxEntities}</span>
                            <span class="sr-only">entities selected</span>
                        </div>
                    </div>

                    <!-- Entity Slots -->
                    <div class="entity-slots" role="list" aria-label="Selected entities">
                        ${this.renderEntitySlots()}
                    </div>

                    <!-- Search Controls -->
                    <div class="selector-controls">
                        <div class="search-input-wrapper">
                            <label for="entity-search" class="sr-only">Search entities</label>
                            <input type="text"
                                   id="entity-search"
                                   placeholder="Search entities by name..."
                                   ${this.selectedEntities.length >= this.maxEntities ? 'disabled' : ''}
                                   autocomplete="off"
                                   aria-describedby="search-help">
                            <span class="search-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                            </span>
                            <span id="search-help" class="sr-only">Type to search for entities to compare</span>
                        </div>

                        <div class="filter-controls">
                            <label for="mythology-filter" class="sr-only">Filter by mythology</label>
                            <select id="mythology-filter" aria-label="Filter by mythology">
                                <option value="">All Mythologies</option>
                                ${this.mythologies.map(m => `
                                    <option value="${m.id}">${m.name}</option>
                                `).join('')}
                            </select>

                            <label for="type-filter" class="sr-only">Filter by entity type</label>
                            <select id="type-filter" aria-label="Filter by entity type">
                                <option value="">All Types</option>
                                ${Object.entries(this.collections).map(([key, val]) => `
                                    <option value="${key}">${val.label}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Search Results / Suggestions -->
                    <div id="search-results" class="search-results" role="listbox" aria-label="Search results">
                        ${this.renderSearchResultsContent()}
                    </div>
                </section>

                <!-- Comparison Section -->
                <section id="comparison-section" class="comparison-section" aria-label="Comparison results">
                    ${this.renderComparisonContent()}
                </section>

                <!-- Compare Tray (for add-to-compare functionality) -->
                ${this.renderCompareTray()}
            </div>
        `;
    }

    /**
     * Render entity selection slots
     */
    renderEntitySlots() {
        const slots = [];

        for (let i = 0; i < this.maxEntities; i++) {
            const entity = this.selectedEntities[i];

            if (entity) {
                slots.push(`
                    <div class="entity-slot entity-slot-filled"
                         data-index="${i}"
                         role="listitem"
                         data-mythology="${entity.mythology || 'unknown'}">
                        <div class="slot-content">
                            <div class="slot-icon">
                                ${this.renderIcon(entity.icon, 'slot-icon-inner')}
                            </div>
                            <div class="slot-info">
                                <span class="slot-name" title="${entity.name}">${this.truncateText(entity.name, 25)}</span>
                                <span class="slot-meta">
                                    <span class="mythology-badge">${this.capitalize(entity.mythology || 'Unknown')}</span>
                                </span>
                            </div>
                            <button class="slot-change"
                                    data-index="${i}"
                                    title="Change entity"
                                    aria-label="Change ${entity.name}">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </button>
                            <button class="slot-remove"
                                    data-index="${i}"
                                    title="Remove entity"
                                    aria-label="Remove ${entity.name}">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `);
            } else {
                slots.push(`
                    <div class="entity-slot entity-slot-empty"
                         data-index="${i}"
                         role="listitem"
                         tabindex="0"
                         aria-label="Empty slot ${i + 1}, click to add entity">
                        <div class="slot-placeholder">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                            <span>Add Entity ${i + 1}</span>
                        </div>
                    </div>
                `);
            }
        }

        return slots.join('');
    }

    /**
     * Render search results content
     */
    renderSearchResultsContent() {
        if (this.selectedEntities.length >= this.maxEntities) {
            return `
                <div class="search-message max-entities">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>Maximum entities selected. Remove one to add more.</span>
                </div>
            `;
        }

        // Show recent comparisons if no search
        if (this.recentComparisons.length > 0 && this.selectedEntities.length === 0) {
            return this.renderRecentComparisons();
        }

        // Show suggestions if one entity selected
        if (this.selectedEntities.length === 1 && this.suggestedEntities.length > 0) {
            return this.renderSuggestions();
        }

        return `
            <div class="search-message hint">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span>Search for entities to compare, or select from the filters above</span>
            </div>
        `;
    }

    /**
     * Render recent comparisons section
     */
    renderRecentComparisons() {
        return `
            <div class="recent-comparisons">
                <h4>Recent Comparisons</h4>
                <div class="recent-list">
                    ${this.recentComparisons.slice(0, 5).map(comparison => `
                        <button class="recent-item"
                                data-entities="${comparison.entities.join(',')}"
                                aria-label="Compare ${comparison.names.join(' vs ')}">
                            <span class="recent-entities">${comparison.names.join(' vs ')}</span>
                            <span class="recent-mythologies">${comparison.mythologies.join(', ')}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render suggested entities
     */
    renderSuggestions() {
        const currentEntity = this.selectedEntities[0];

        return `
            <div class="entity-suggestions">
                <h4>Suggested Comparisons for ${currentEntity.name}</h4>
                <div class="suggestions-grid">
                    ${this.suggestedEntities.slice(0, 6).map(entity => `
                        <button class="suggestion-card"
                                data-collection="${entity.collection}"
                                data-id="${entity.id}"
                                data-entity='${JSON.stringify(entity).replace(/'/g, "&apos;")}'
                                aria-label="Add ${entity.name} to comparison">
                            <div class="suggestion-icon">
                                ${this.renderIcon(entity.icon, 'suggestion-icon-inner')}
                            </div>
                            <div class="suggestion-info">
                                <span class="suggestion-name">${entity.name}</span>
                                <span class="suggestion-reason">${entity.reason || this.capitalize(entity.mythology)}</span>
                            </div>
                        </button>
                    `).join('')}
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
            <div class="empty-state" role="status">
                <div class="empty-state-visual">
                    <svg viewBox="0 0 120 80" width="120" height="80" class="empty-illustration">
                        <rect x="5" y="10" width="45" height="60" rx="4" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                        <rect x="70" y="10" width="45" height="60" rx="4" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                        <path d="M55 40 L65 40" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/>
                        <text x="27" y="45" font-size="10" fill="currentColor" text-anchor="middle" opacity="0.5">?</text>
                        <text x="92" y="45" font-size="10" fill="currentColor" text-anchor="middle" opacity="0.5">?</text>
                    </svg>
                </div>
                <h2>No Entities Selected</h2>
                <p>Select at least ${this.minEntities} entities to compare their attributes side-by-side.</p>
                <div class="example-suggestions">
                    <p class="hint-label">Try comparing:</p>
                    <ul class="suggestion-list" role="list">
                        <li><strong>Zeus</strong> and <strong>Odin</strong> - Greek vs Norse sky gods</li>
                        <li><strong>Ra</strong> and <strong>Amaterasu</strong> - Egyptian vs Japanese sun deities</li>
                        <li><strong>Gilgamesh</strong> and <strong>Heracles</strong> - Ancient hero archetypes</li>
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
            <div class="single-entity-state" role="status">
                <div class="single-entity-preview">
                    <div class="preview-icon" data-mythology="${entity.mythology}">
                        ${this.renderIcon(entity.icon, 'preview-icon-inner')}
                    </div>
                    <div class="preview-info">
                        <h3>${entity.name}</h3>
                        <span class="mythology-badge">${this.capitalize(entity.mythology || 'Unknown')}</span>
                    </div>
                </div>
                <div class="single-entity-message">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                    </svg>
                    <p>Add at least one more entity to start comparing</p>
                </div>
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

            <!-- Shared Attributes Section -->
            ${this.renderSharedAttributesSection()}

            <!-- Mobile Entity Tabs -->
            <div class="mobile-entity-tabs" role="tablist" aria-label="Entity tabs">
                ${this.selectedEntities.map((entity, idx) => `
                    <button class="mobile-tab ${idx === this.currentMobileEntity ? 'active' : ''}"
                            role="tab"
                            aria-selected="${idx === this.currentMobileEntity}"
                            aria-controls="mobile-card-${idx}"
                            data-index="${idx}"
                            data-mythology="${entity.mythology}">
                        ${this.renderIcon(entity.icon, 'tab-icon')}
                        <span class="tab-name">${this.truncateText(entity.name, 12)}</span>
                    </button>
                `).join('')}
            </div>

            <!-- Desktop: Side-by-side comparison table -->
            <div class="desktop-comparison">
                ${this.renderComparisonTable()}
            </div>

            <!-- Mobile: Stacked cards with swipe -->
            <div class="mobile-comparison" aria-label="Mobile comparison view">
                <div class="swipe-hint" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Swipe to switch
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </div>
                <div class="mobile-cards-container" data-current="${this.currentMobileEntity}">
                    ${this.selectedEntities.map((entity, idx) =>
                        this.renderMobileEntityCard(entity, idx)
                    ).join('')}
                </div>
                <div class="mobile-navigation" role="navigation" aria-label="Entity navigation">
                    <button class="nav-btn nav-prev"
                            ${this.currentMobileEntity === 0 ? 'disabled' : ''}
                            aria-label="Previous entity">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <span class="nav-indicator" role="status">
                        <span class="nav-current">${this.currentMobileEntity + 1}</span>
                        <span class="nav-sep">/</span>
                        <span class="nav-total">${this.selectedEntities.length}</span>
                    </span>
                    <button class="nav-btn nav-next"
                            ${this.currentMobileEntity === this.selectedEntities.length - 1 ? 'disabled' : ''}
                            aria-label="Next entity">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render similarity score and visualization
     */
    renderSimilaritySection() {
        const similarity = this.calculateSimilarity();

        return `
            <div class="similarity-section">
                <div class="similarity-header">
                    <h3>Similarity Analysis</h3>
                    <div class="similarity-score-badge" data-score="${similarity.overallScore}">
                        ${similarity.overallScore}% Match
                    </div>
                </div>

                <div class="similarity-metrics">
                    <div class="metric-card metric-overall">
                        <div class="metric-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        </div>
                        <div class="metric-content">
                            <div class="metric-label">Overall Match</div>
                            <div class="metric-bar" role="progressbar" aria-valuenow="${similarity.overallScore}" aria-valuemin="0" aria-valuemax="100">
                                <div class="metric-bar-fill" style="width: ${similarity.overallScore}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="metric-card metric-shared">
                        <div class="metric-value">${similarity.sharedAttributes}</div>
                        <div class="metric-label">Shared</div>
                    </div>

                    <div class="metric-card metric-unique">
                        <div class="metric-value">${similarity.uniqueAttributes}</div>
                        <div class="metric-label">Different</div>
                    </div>
                </div>

                <!-- Venn Diagram -->
                <div class="venn-diagram-container">
                    ${this.renderVennDiagram(similarity)}
                </div>

                <!-- Key Insights -->
                <div class="insights-grid">
                    <div class="insight-box similarities">
                        <h4>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Key Similarities
                        </h4>
                        <ul>
                            ${similarity.similarities.slice(0, 5).map(sim => `
                                <li>${sim}</li>
                            `).join('') || '<li class="empty-insight">No major similarities found</li>'}
                        </ul>
                    </div>

                    <div class="insight-box differences">
                        <h4>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Key Differences
                        </h4>
                        <ul>
                            ${similarity.differences.slice(0, 5).map(diff => `
                                <li>${diff}</li>
                            `).join('') || '<li class="empty-insight">No major differences found</li>'}
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

        attributes.forEach(attr => {
            const values = this.selectedEntities.map(e => e[attr.key]);
            const nonEmptyValues = values.filter(v =>
                v !== null && v !== undefined &&
                (Array.isArray(v) ? v.length > 0 : true) &&
                (typeof v === 'string' ? v.trim() !== '' : true)
            );

            if (nonEmptyValues.length > 0) {
                totalCount++;

                const firstValue = this.normalizeValue(nonEmptyValues[0]);
                const allMatch = nonEmptyValues.every(v => this.normalizeValue(v) === firstValue);

                if (allMatch && nonEmptyValues.length === this.selectedEntities.length) {
                    sharedCount++;
                    if (attr.key !== 'name' && attr.key !== 'id') {
                        similarities.push(`Same ${attr.label.toLowerCase()}`);
                    }
                } else if (nonEmptyValues.length > 1) {
                    differences.push(`Different ${attr.label.toLowerCase()}`);
                }
            }
        });

        // Check for domain/power overlaps
        const domainOverlap = this.findArrayOverlap('domains');
        if (domainOverlap.length > 0) {
            similarities.unshift(`Both associated with: ${domainOverlap.slice(0, 3).join(', ')}`);
        }

        const symbolOverlap = this.findArrayOverlap('symbols');
        if (symbolOverlap.length > 0) {
            similarities.push(`Share symbols: ${symbolOverlap.slice(0, 3).join(', ')}`);
        }

        const overallScore = totalCount > 0 ? Math.round((sharedCount / totalCount) * 100) : 0;

        return {
            overallScore,
            sharedAttributes: sharedCount,
            totalAttributes: totalCount,
            uniqueAttributes: totalCount - sharedCount,
            similarities: [...new Set(similarities)],
            differences: [...new Set(differences)]
        };
    }

    /**
     * Render shared attributes quick overview section
     */
    renderSharedAttributesSection() {
        const sharedAttrs = this.getSharedAttributeValues();

        if (sharedAttrs.length === 0) {
            return '';
        }

        return `
            <div class="shared-attributes-section">
                <div class="shared-attributes-header">
                    <h3>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Shared Attributes
                    </h3>
                    <span class="shared-count">${sharedAttrs.length} in common</span>
                </div>
                <div class="shared-attributes-grid">
                    ${sharedAttrs.slice(0, 8).map(attr => `
                        <div class="shared-attribute-card">
                            <div class="shared-attr-label">${attr.label}</div>
                            <div class="shared-attr-value">${this.formatSharedValue(attr.value)}</div>
                        </div>
                    `).join('')}
                </div>
                ${sharedAttrs.length > 8 ? `
                    <button class="show-more-shared" data-expanded="false">
                        Show ${sharedAttrs.length - 8} more shared attributes
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get list of attributes with matching values across all entities
     */
    getSharedAttributeValues() {
        const attributes = this.getCommonAttributes();
        const shared = [];

        attributes.forEach(attr => {
            if (attr.key === 'name' || attr.key === 'id') return;

            const values = this.selectedEntities.map(e => e[attr.key]);
            const nonEmptyValues = values.filter(v =>
                v !== null && v !== undefined &&
                (Array.isArray(v) ? v.length > 0 : true) &&
                (typeof v === 'string' ? v.trim() !== '' : true)
            );

            if (nonEmptyValues.length === this.selectedEntities.length) {
                const firstValue = this.normalizeValue(nonEmptyValues[0]);
                const allMatch = nonEmptyValues.every(v => this.normalizeValue(v) === firstValue);

                if (allMatch) {
                    shared.push({
                        key: attr.key,
                        label: attr.label,
                        value: nonEmptyValues[0]
                    });
                }
            }
        });

        return shared;
    }

    /**
     * Format shared value for display in compact form
     */
    formatSharedValue(value) {
        if (Array.isArray(value)) {
            if (value.length === 0) return '-';
            if (value.length <= 3) {
                return value.map(v => this.escapeHtml(String(v))).join(', ');
            }
            return `${value.slice(0, 2).map(v => this.escapeHtml(String(v))).join(', ')} +${value.length - 2}`;
        }

        if (typeof value === 'object' && value !== null) {
            const keys = Object.keys(value);
            if (keys.length === 0) return '-';
            return `${keys.length} properties`;
        }

        const strValue = String(value);
        if (strValue.length > 50) {
            return this.escapeHtml(strValue.substring(0, 50)) + '...';
        }

        return this.escapeHtml(strValue);
    }

    /**
     * Find overlapping items in array attributes
     */
    findArrayOverlap(key) {
        const arrays = this.selectedEntities
            .map(e => e[key])
            .filter(arr => Array.isArray(arr) && arr.length > 0);

        if (arrays.length < 2) return [];

        return arrays.reduce((overlap, arr) =>
            overlap.filter(item =>
                arr.some(a => this.normalizeValue(a) === this.normalizeValue(item))
            )
        );
    }

    /**
     * Normalize value for comparison
     */
    normalizeValue(value) {
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) {
            return value.map(v => String(v).toLowerCase().trim()).sort().join(',');
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value).toLowerCase().trim();
    }

    /**
     * Render Venn diagram visualization
     */
    renderVennDiagram(similarity) {
        const entities = this.selectedEntities;
        const overlapPercent = Math.min(60, similarity.overallScore * 0.6);

        if (entities.length === 2) {
            return `
                <div class="venn-diagram venn-2" role="img" aria-label="Venn diagram showing ${similarity.sharedAttributes} shared attributes">
                    <div class="venn-circle venn-circle-1"
                         data-mythology="${entities[0].mythology}"
                         style="--overlap: ${overlapPercent}%">
                        <span class="venn-label">${this.truncateText(entities[0].name, 10)}</span>
                    </div>
                    <div class="venn-circle venn-circle-2"
                         data-mythology="${entities[1].mythology}"
                         style="--overlap: ${overlapPercent}%">
                        <span class="venn-label">${this.truncateText(entities[1].name, 10)}</span>
                    </div>
                    <div class="venn-overlap" style="--overlap: ${overlapPercent}%">
                        <span class="venn-overlap-value">${similarity.sharedAttributes}</span>
                        <span class="venn-overlap-label">shared</span>
                    </div>
                </div>
            `;
        } else if (entities.length === 3) {
            return `
                <div class="venn-diagram venn-3" role="img" aria-label="Venn diagram showing overlap between 3 entities">
                    <div class="venn-circle venn-circle-1" data-mythology="${entities[0].mythology}">
                        <span class="venn-label">${this.truncateText(entities[0].name, 8)}</span>
                    </div>
                    <div class="venn-circle venn-circle-2" data-mythology="${entities[1].mythology}">
                        <span class="venn-label">${this.truncateText(entities[1].name, 8)}</span>
                    </div>
                    <div class="venn-circle venn-circle-3" data-mythology="${entities[2].mythology}">
                        <span class="venn-label">${this.truncateText(entities[2].name, 8)}</span>
                    </div>
                    <div class="venn-center">
                        <span class="venn-center-value">${similarity.sharedAttributes}</span>
                    </div>
                </div>
            `;
        }

        return '';
    }

    /**
     * Render desktop comparison table
     */
    renderComparisonTable() {
        const attributes = this.getCommonAttributes();

        return `
            <!-- Diff Legend -->
            <div class="diff-legend" aria-label="Color legend for comparison">
                <div class="diff-legend-item">
                    <span class="diff-legend-dot match"></span>
                    <span>Same Value</span>
                </div>
                <div class="diff-legend-item">
                    <span class="diff-legend-dot differ"></span>
                    <span>Different</span>
                </div>
                <div class="diff-legend-item">
                    <span class="diff-legend-dot unique"></span>
                    <span>Unique</span>
                </div>
                <div class="diff-legend-item">
                    <span class="diff-legend-dot partial"></span>
                    <span>Partial Match</span>
                </div>
            </div>

            <div class="comparison-table-wrapper" id="comparison-table-wrapper">
                <table class="comparison-table" role="grid">
                    <thead>
                        <tr>
                            <th class="attribute-column sticky-column" scope="col">Attribute</th>
                            ${this.selectedEntities.map((entity, idx) => `
                                <th class="entity-column entity-${idx}"
                                    scope="col"
                                    data-mythology="${entity.mythology}">
                                    <div class="entity-header">
                                        <div class="entity-icon">
                                            ${this.renderIcon(entity.icon, 'header-icon')}
                                        </div>
                                        <div class="entity-info">
                                            <div class="entity-name">${this.truncateText(entity.name, 20)}</div>
                                            <div class="entity-meta">
                                                <span class="mythology-badge">${this.capitalize(entity.mythology || 'Unknown')}</span>
                                                <span class="type-badge">${this.capitalize(entity.type || entity._collection || 'Entity')}</span>
                                            </div>
                                        </div>
                                        <button class="remove-entity-btn"
                                                data-index="${idx}"
                                                title="Remove ${entity.name}"
                                                aria-label="Remove ${entity.name}">
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>
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
            <div class="mobile-entity-card ${isActive ? 'active' : ''}"
                 id="mobile-card-${index}"
                 role="tabpanel"
                 aria-labelledby="mobile-tab-${index}"
                 data-index="${index}"
                 ${!isActive ? 'hidden' : ''}>
                <div class="mobile-card-header" data-mythology="${entity.mythology}">
                    <div class="card-icon">
                        ${this.renderIcon(entity.icon, 'mobile-card-icon')}
                    </div>
                    <div class="card-info">
                        <h3 class="card-name">${entity.name}</h3>
                        <div class="card-meta">
                            <span class="mythology-badge">${this.capitalize(entity.mythology || 'Unknown')}</span>
                            <span class="type-badge">${this.capitalize(entity.type || entity._collection || 'Entity')}</span>
                        </div>
                    </div>
                    <button class="card-remove" data-index="${index}" title="Remove" aria-label="Remove ${entity.name}">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div class="mobile-card-body">
                    ${attributes.map(attr => {
                        const value = entity[attr.key];
                        const formatted = this.formatAttributeValue(value, attr.key);
                        const otherValues = this.selectedEntities
                            .filter((_, i) => i !== index)
                            .map(e => this.normalizeValue(e[attr.key]));
                        const currentNormalized = this.normalizeValue(value);
                        const isUnique = otherValues.every(v => v !== currentNormalized);
                        const isEmpty = formatted.isEmpty;

                        return `
                            <div class="mobile-attribute-row ${isEmpty ? 'empty' : ''} ${isUnique && !isEmpty ? 'unique' : ''}">
                                <div class="mobile-attr-label">${attr.label}</div>
                                <div class="mobile-attr-value">
                                    ${isEmpty ? '<span class="empty-value">-</span>' : formatted.display}
                                </div>
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
            return this.formatAttributeValue(entity[attribute.key], attribute.key);
        });

        const highlightClass = this.getHighlightClass(values);

        return `
            <tr class="attribute-row ${highlightClass}">
                <td class="attribute-name sticky-column">${attribute.label}</td>
                ${values.map((val, idx) => `
                    <td class="entity-value entity-${idx} ${val.isEmpty ? 'empty-cell' : ''} ${val.isUnique ? 'unique-value' : ''}"
                        data-entity-index="${idx}"
                        data-mythology="${this.selectedEntities[idx].mythology}">
                        ${val.isEmpty ? '<span class="empty-value">-</span>' : val.display}
                    </td>
                `).join('')}
            </tr>
        `;
    }

    /**
     * Format attribute value for display
     */
    formatAttributeValue(value, key) {
        if (value === null || value === undefined) {
            return { raw: null, display: '', isEmpty: true };
        }

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return { raw: [], display: '', isEmpty: true };
            }

            const maxItems = this.arrayMaxItems;
            const displayItems = value.slice(0, maxItems);
            const remaining = value.length - maxItems;

            let display = `<ul class="value-list">
                ${displayItems.map(item => `<li>${this.escapeHtml(String(item))}</li>`).join('')}
            </ul>`;

            if (remaining > 0) {
                display += `<button class="show-more-btn" data-items='${JSON.stringify(value.slice(maxItems)).replace(/'/g, "&apos;")}'>+${remaining} more</button>`;
            }

            return { raw: value, display, isEmpty: false };
        }

        if (typeof value === 'object') {
            const display = this.formatObjectValue(value);
            return { raw: value, display, isEmpty: Object.keys(value).length === 0 };
        }

        const strValue = String(value);

        // Handle long text (descriptions)
        if (key === 'description' || strValue.length > 200) {
            const lines = strValue.split('\n');
            const truncated = lines.slice(0, this.descriptionMaxLines).join('\n');
            const needsTruncation = lines.length > this.descriptionMaxLines || strValue.length > 300;

            if (needsTruncation) {
                return {
                    raw: value,
                    display: `
                        <div class="expandable-value">
                            <div class="value-preview">${this.escapeHtml(this.truncateText(truncated, 280))}</div>
                            <button class="expand-btn" aria-expanded="false">
                                <span class="expand-text">Show more</span>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </button>
                            <div class="value-full" hidden>${this.escapeHtml(strValue)}</div>
                        </div>
                    `,
                    isEmpty: false
                };
            }
        }

        return { raw: value, display: this.escapeHtml(strValue), isEmpty: strValue.trim() === '' };
    }

    /**
     * Format object value for display
     */
    formatObjectValue(obj) {
        const entries = Object.entries(obj);
        if (entries.length === 0) return '';

        return `<dl class="object-value">
            ${entries.slice(0, 5).map(([k, v]) => `
                <div class="object-entry">
                    <dt>${this.capitalize(k)}</dt>
                    <dd>${this.escapeHtml(String(v))}</dd>
                </div>
            `).join('')}
            ${entries.length > 5 ? `<div class="object-more">+${entries.length - 5} more</div>` : ''}
        </dl>`;
    }

    /**
     * Get CSS class for highlighting matching/unique attributes
     */
    getHighlightClass(values) {
        const nonEmptyValues = values.filter(v => !v.isEmpty);

        if (nonEmptyValues.length === 0) {
            return 'all-empty';
        }

        const firstValue = this.normalizeValue(nonEmptyValues[0].raw);
        const allMatch = nonEmptyValues.every(v => this.normalizeValue(v.raw) === firstValue);

        if (allMatch && nonEmptyValues.length === values.length) {
            return 'all-match';
        } else if (allMatch && nonEmptyValues.length > 1) {
            return 'some-match';
        } else if (nonEmptyValues.length === 1) {
            // Mark unique values
            values.forEach((v, i) => {
                if (!v.isEmpty) {
                    v.isUnique = true;
                }
            });
            return 'has-unique';
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
            { key: 'title', label: 'Title' },
            { key: 'mythology', label: 'Mythology' },
            { key: 'type', label: 'Type' },
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
            { key: 'modern_influence', label: 'Modern Influence' },
            { key: 'related_entities', label: 'Related Entities' }
        ];

        return baseAttributes.filter(attr =>
            this.selectedEntities.some(entity => {
                const value = entity[attr.key];
                return value !== null && value !== undefined &&
                       (!Array.isArray(value) || value.length > 0) &&
                       (typeof value !== 'object' || Object.keys(value).length > 0) &&
                       (typeof value !== 'string' || value.trim() !== '');
            })
        );
    }

    /**
     * Render compare tray for add-to-compare functionality
     */
    renderCompareTray() {
        if (this.selectedEntities.length === 0) {
            return '';
        }

        return `
            <div class="compare-tray ${this.selectedEntities.length >= this.minEntities ? 'ready' : ''}"
                 role="complementary"
                 aria-label="Compare tray">
                <div class="tray-content">
                    <div class="tray-entities">
                        ${this.selectedEntities.map((entity, idx) => `
                            <div class="tray-entity" data-index="${idx}" data-mythology="${entity.mythology}">
                                ${this.renderIcon(entity.icon, 'tray-icon')}
                                <span class="tray-name">${this.truncateText(entity.name, 10)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="tray-actions">
                        ${this.selectedEntities.length >= this.minEntities ? `
                            <button class="tray-compare-btn" onclick="document.querySelector('.comparison-section').scrollIntoView({behavior: 'smooth'})">
                                View Comparison
                            </button>
                        ` : `
                            <span class="tray-hint">Add ${this.minEntities - this.selectedEntities.length} more</span>
                        `}
                    </div>
                </div>
            </div>
        `;
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

            // Clear search on escape
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.clearSearchResults();
                }
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
        this.setupActionButtons();

        // Delegated event listeners
        this.setupDelegatedEvents();

        // Setup synchronized scrolling
        this.setupSynchronizedScrolling();

        // Setup mobile interactions
        this.setupMobileSwipe();
        this.setupMobileTabs();

        // Keyboard navigation
        this.setupKeyboardNavigation();

        console.log('[CompareView] Initialized');
    }

    /**
     * Setup action button handlers
     */
    setupActionButtons() {
        const clearBtn = document.getElementById('clear-compare');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }

        const shareBtn = document.getElementById('share-compare');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareComparison());
        }

        const printBtn = document.getElementById('print-compare');
        if (printBtn) {
            printBtn.addEventListener('click', () => this.printComparison());
        }

        const swapBtn = document.getElementById('swap-entities');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => this.swapEntities());
        }
    }

    /**
     * Setup delegated event handlers
     */
    setupDelegatedEvents() {
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Remove entity buttons
            if (target.closest('.remove-entity-btn') ||
                target.closest('.chip-remove') ||
                target.closest('.card-remove') ||
                target.closest('.slot-remove')) {
                const btn = target.closest('[data-index]');
                const index = parseInt(btn.dataset.index);
                this.removeEntity(index);
            }

            // Expand value buttons
            if (target.closest('.expand-btn')) {
                this.toggleValueExpand(target.closest('.expand-btn'));
            }

            // Show more array items
            if (target.closest('.show-more-btn')) {
                this.showMoreItems(target.closest('.show-more-btn'));
            }

            // Search result cards
            if (target.closest('.search-result-card')) {
                const card = target.closest('.search-result-card');
                const entityData = JSON.parse(card.dataset.entity);
                this.addEntity(entityData, card.dataset.collection);
            }

            // Suggestion cards
            if (target.closest('.suggestion-card')) {
                const card = target.closest('.suggestion-card');
                const entityData = JSON.parse(card.dataset.entity);
                this.addEntity(entityData, card.dataset.collection);
            }

            // Recent comparison items
            if (target.closest('.recent-item')) {
                const item = target.closest('.recent-item');
                const entities = item.dataset.entities.split(',');
                this.loadRecentComparison(entities);
            }

            // Empty slot click
            if (target.closest('.entity-slot-empty')) {
                const searchInput = document.getElementById('entity-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    /**
     * Setup synchronized scrolling for comparison table
     */
    setupSynchronizedScrolling() {
        const wrapper = document.getElementById('comparison-table-wrapper');
        if (!wrapper) return;

        // Restore scroll position
        const savedTop = sessionStorage.getItem('compareScrollTop');
        const savedLeft = sessionStorage.getItem('compareScrollLeft');
        if (savedTop) wrapper.scrollTop = parseInt(savedTop);
        if (savedLeft) wrapper.scrollLeft = parseInt(savedLeft);

        // Save scroll position on scroll
        let scrollTimeout;
        wrapper.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                sessionStorage.setItem('compareScrollTop', wrapper.scrollTop);
                sessionStorage.setItem('compareScrollLeft', wrapper.scrollLeft);
            }, 100);
        });
    }

    /**
     * Setup mobile swipe gestures
     */
    setupMobileSwipe() {
        const container = document.querySelector('.mobile-cards-container');
        if (!container) return;

        container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: true });

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
        const diffX = this.touchStartX - this.touchEndX;
        const diffY = Math.abs(this.touchStartY - this.touchEndY);

        // Only handle horizontal swipes
        if (Math.abs(diffX) > swipeThreshold && diffY < 100) {
            if (diffX > 0) {
                this.navigateMobile(1);
            } else {
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
            const isActive = idx === this.currentMobileEntity;
            card.classList.toggle('active', isActive);
            card.hidden = !isActive;
        });

        // Update navigation buttons
        const prevBtn = document.querySelector('.nav-prev');
        const nextBtn = document.querySelector('.nav-next');

        if (prevBtn) prevBtn.disabled = this.currentMobileEntity === 0;
        if (nextBtn) nextBtn.disabled = this.currentMobileEntity === this.selectedEntities.length - 1;

        // Update indicator
        const currentEl = document.querySelector('.nav-current');
        if (currentEl) currentEl.textContent = this.currentMobileEntity + 1;

        // Update tabs
        document.querySelectorAll('.mobile-tab').forEach((tab, idx) => {
            const isActive = idx === this.currentMobileEntity;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });
    }

    /**
     * Setup mobile tab navigation
     */
    setupMobileTabs() {
        document.querySelectorAll('.mobile-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const index = parseInt(tab.dataset.index);
                this.currentMobileEntity = index;
                this.updateMobileView();
            });
        });
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Arrow key navigation for mobile view
            if (window.innerWidth <= 768) {
                if (e.key === 'ArrowLeft') {
                    this.navigateMobile(-1);
                } else if (e.key === 'ArrowRight') {
                    this.navigateMobile(1);
                }
            }
        });
    }

    /**
     * Toggle expanded view for long values
     */
    toggleValueExpand(button) {
        const container = button.closest('.expandable-value');
        const preview = container.querySelector('.value-preview');
        const full = container.querySelector('.value-full');
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        preview.hidden = !isExpanded;
        full.hidden = isExpanded;
        button.setAttribute('aria-expanded', !isExpanded);
        button.querySelector('.expand-text').textContent = isExpanded ? 'Show more' : 'Show less';
        button.querySelector('svg').style.transform = isExpanded ? '' : 'rotate(180deg)';
    }

    /**
     * Show more array items
     */
    showMoreItems(button) {
        const items = JSON.parse(button.dataset.items);
        const list = button.previousElementSibling;

        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            list.appendChild(li);
        });

        button.remove();
    }

    /**
     * Perform entity search
     */
    async performSearch(query) {
        const mythologyFilter = document.getElementById('mythology-filter')?.value || '';
        const typeFilter = document.getElementById('type-filter')?.value || '';
        const resultsContainer = document.getElementById('search-results');

        if (!resultsContainer) return;

        // Minimum query length
        if (!query && !mythologyFilter && !typeFilter) {
            this.clearSearchResults();
            return;
        }

        // Show loading state
        resultsContainer.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <span>Searching...</span>
            </div>
        `;

        try {
            const results = await this.searchEntities(query, mythologyFilter, typeFilter);
            this.searchResults = results;

            if (results.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="search-message no-results">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>No entities found matching your criteria</span>
                    </div>
                `;
            } else {
                resultsContainer.innerHTML = `
                    <div class="search-results-header">
                        <span class="results-count">${results.length} result${results.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="search-results-grid">
                        ${results.map(entity => this.renderSearchResult(entity)).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('[CompareView] Search error:', error);
            resultsContainer.innerHTML = `
                <div class="search-message error">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span>Error searching. Please try again.</span>
                </div>
            `;
        }
    }

    /**
     * Clear search results
     */
    clearSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = this.renderSearchResultsContent();
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

                if (mythologyFilter) {
                    queryRef = queryRef.where('mythology', '==', mythologyFilter);
                }

                queryRef = queryRef.limit(25);

                const snapshot = await queryRef.get();

                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const name = (data.name || '').toLowerCase();
                    const title = (data.title || '').toLowerCase();

                    if (!query || name.includes(searchLower) || title.includes(searchLower)) {
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

        return results.slice(0, 50);
    }

    /**
     * Render search result card
     */
    renderSearchResult(entity) {
        const truncatedDescription = entity.description
            ? this.truncateText(entity.description, 100)
            : '';

        return `
            <div class="search-result-card"
                 data-collection="${entity.collection}"
                 data-id="${entity.id}"
                 data-entity='${JSON.stringify(entity).replace(/'/g, "&apos;")}'
                 role="option"
                 tabindex="0"
                 aria-label="Add ${entity.name} to comparison">
                <div class="result-header">
                    <div class="result-icon">
                        ${this.renderIcon(entity.icon, 'result-icon-inner')}
                    </div>
                    <div class="result-info">
                        <div class="result-name">${entity.name || 'Unknown'}</div>
                        <div class="result-meta">
                            <span class="mythology-badge">${this.capitalize(entity.mythology || 'Unknown')}</span>
                            <span class="type-badge">${this.capitalize(entity.type || entity.collection)}</span>
                        </div>
                    </div>
                    <div class="result-add-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                    </div>
                </div>
                ${entity.title ? `<div class="result-title">${this.truncateText(entity.title, 60)}</div>` : ''}
                ${truncatedDescription ? `<div class="result-description">${truncatedDescription}</div>` : ''}
            </div>
        `;
    }

    /**
     * Load suggestions based on selected entity
     */
    async loadSuggestions() {
        if (this.selectedEntities.length !== 1 || !this.db) return;

        const currentEntity = this.selectedEntities[0];
        this.suggestedEntities = [];

        try {
            // Suggest similar entities from same mythology
            const sameMyth = await this.db.collection(currentEntity._collection)
                .where('mythology', '==', currentEntity.mythology)
                .limit(3)
                .get();

            sameMyth.docs.forEach(doc => {
                if (doc.id !== currentEntity.id) {
                    this.suggestedEntities.push({
                        id: doc.id,
                        collection: currentEntity._collection,
                        reason: 'Same mythology',
                        ...doc.data()
                    });
                }
            });

            // Suggest entities with similar domains
            if (currentEntity.domains && currentEntity.domains.length > 0) {
                const domain = currentEntity.domains[0];
                const similarDomain = await this.db.collection(currentEntity._collection)
                    .where('domains', 'array-contains', domain)
                    .limit(3)
                    .get();

                similarDomain.docs.forEach(doc => {
                    if (doc.id !== currentEntity.id &&
                        !this.suggestedEntities.some(e => e.id === doc.id)) {
                        this.suggestedEntities.push({
                            id: doc.id,
                            collection: currentEntity._collection,
                            reason: `Also ${domain}`,
                            ...doc.data()
                        });
                    }
                });
            }
        } catch (error) {
            console.error('[CompareView] Error loading suggestions:', error);
        }
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
            this.showToast('Maximum entities reached. Remove one to add more.', 'warning');
            return;
        }

        // Check for duplicates
        if (this.selectedEntities.some(e => e.id === entityData.id && e._collection === collection)) {
            this.showToast('Entity already selected.', 'info');
            return;
        }

        entityData._collection = collection;
        this.selectedEntities.push(entityData);
        console.log('[CompareView] Added entity:', entityData.name);

        // Persist to sessionStorage
        this.persistEntities();

        // Save to recent comparisons when 2+ selected
        if (this.selectedEntities.length >= this.minEntities) {
            this.saveRecentComparison();

            if (window.AnalyticsManager) {
                const entityIds = this.selectedEntities.map(e => e.id);
                const entityTypes = this.selectedEntities.map(e => e.type || e._collection);
                window.AnalyticsManager.trackEntityComparison(entityIds, entityTypes);
            }
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

            if (this.currentMobileEntity >= this.selectedEntities.length) {
                this.currentMobileEntity = Math.max(0, this.selectedEntities.length - 1);
            }

            // Persist to sessionStorage
            this.persistEntities();

            this.refresh();
        }
    }

    /**
     * Swap entity positions (only for 2 entities)
     */
    swapEntities() {
        if (this.selectedEntities.length === 2) {
            // Add swap animation class
            const slots = document.querySelectorAll('.entity-slot-filled');
            slots.forEach(slot => slot.classList.add('swapping'));

            setTimeout(() => {
                this.selectedEntities.reverse();
                console.log('[CompareView] Swapped entities');
                this.persistEntities();
                this.refresh();
            }, 300);
        }
    }

    /**
     * Clear all selected entities
     */
    clearAll() {
        if (this.selectedEntities.length === 0) return;

        this.selectedEntities = [];
        this.currentMobileEntity = 0;
        this.suggestedEntities = [];

        // Persist to sessionStorage
        this.persistEntities();

        console.log('[CompareView] Cleared all entities');
        this.refresh();
    }

    /**
     * Share comparison via URL
     */
    shareComparison() {
        if (this.selectedEntities.length < this.minEntities) {
            this.showToast('Select at least 2 entities to share.', 'warning');
            return;
        }

        const entityRefs = this.selectedEntities.map(e =>
            `${e._collection}:${e.id}`
        ).join('/');

        const url = `${window.location.origin}${window.location.pathname}#/compare/${entityRefs}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Share link copied to clipboard!', 'success');
            }).catch(err => {
                console.error('[CompareView] Copy failed:', err);
                this.fallbackCopyUrl(url);
            });
        } else {
            this.fallbackCopyUrl(url);
        }
    }

    /**
     * Fallback URL copy method
     */
    fallbackCopyUrl(url) {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        this.showToast('Share link copied!', 'success');
    }

    /**
     * Print comparison
     */
    printComparison() {
        if (this.selectedEntities.length < this.minEntities) {
            this.showToast('Select at least 2 entities to print.', 'warning');
            return;
        }

        window.print();
    }

    /**
     * Load recent comparisons from storage
     */
    loadRecentComparisons() {
        try {
            const stored = localStorage.getItem('eoa_recent_comparisons');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Save current comparison to recent
     */
    saveRecentComparison() {
        const comparison = {
            entities: this.selectedEntities.map(e => `${e._collection}:${e.id}`),
            names: this.selectedEntities.map(e => e.name),
            mythologies: [...new Set(this.selectedEntities.map(e => this.capitalize(e.mythology)))],
            timestamp: Date.now()
        };

        // Remove duplicate
        this.recentComparisons = this.recentComparisons.filter(c =>
            c.entities.join(',') !== comparison.entities.join(',')
        );

        // Add to front
        this.recentComparisons.unshift(comparison);

        // Keep only last 10
        this.recentComparisons = this.recentComparisons.slice(0, 10);

        try {
            localStorage.setItem('eoa_recent_comparisons', JSON.stringify(this.recentComparisons));
        } catch (e) {
            console.error('[CompareView] Error saving recent comparisons:', e);
        }
    }

    /**
     * Load a recent comparison
     */
    async loadRecentComparison(entityRefs) {
        this.selectedEntities = [];

        for (const ref of entityRefs) {
            const [collection, id] = ref.split(':');
            if (collection && id) {
                await this.addEntityById(collection, id);
            }
        }
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
    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        if (window.ToastManager) {
            window.ToastManager.show(message, type);
            return;
        }

        // Fallback toast
        const existing = document.querySelector('.compare-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `compare-toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        document.body.appendChild(toast);

        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Utility: Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Utility: Truncate text
     */
    truncateText(str, length) {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.substring(0, length).trim() + '...';
    }

    /**
     * Utility: Escape HTML
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Render entity icon with inline SVG support
     */
    renderIcon(icon, cssClass = '') {
        if (!icon) {
            return `<span class="icon-placeholder ${cssClass}" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            </span>`;
        }

        // Inline SVG
        if (typeof icon === 'string' && icon.trim().startsWith('<svg')) {
            return `<span class="entity-icon-svg ${cssClass}" aria-hidden="true">${icon}</span>`;
        }

        // URL
        if (typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))) {
            return `<img src="${icon}" alt="" class="entity-icon-img ${cssClass}" loading="lazy" />`;
        }

        // Emoji or text
        return `<span class="entity-icon-emoji ${cssClass}" aria-hidden="true">${icon}</span>`;
    }
}

/**
 * Static method to add entity to comparison from anywhere in the app
 * Used by entity cards and other components
 */
CompareView.addToComparison = function(entity, collection) {
    // Load current entities from sessionStorage
    let entities = [];
    try {
        const stored = sessionStorage.getItem('eoa_compare_entities');
        if (stored) {
            entities = JSON.parse(stored);
        }
    } catch (e) {
        console.warn('[CompareView] Failed to load compare entities:', e);
    }

    const maxEntities = 3;

    // Check if already at max
    if (entities.length >= maxEntities) {
        if (window.showToast) {
            window.showToast('Maximum 3 entities for comparison. Remove one first.', 'warning');
        } else if (window.ToastManager) {
            window.ToastManager.show('Maximum 3 entities for comparison. Remove one first.', 'warning');
        } else {
            alert('Maximum 3 entities for comparison. Remove one first.');
        }
        return false;
    }

    // Check for duplicates
    const isDuplicate = entities.some(e =>
        e.id === entity.id && e._collection === collection
    );

    if (isDuplicate) {
        if (window.showToast) {
            window.showToast('Entity already in comparison.', 'info');
        }
        return false;
    }

    // Add entity
    entity._collection = collection;
    entities.push(entity);

    // Save to sessionStorage
    try {
        sessionStorage.setItem('eoa_compare_entities', JSON.stringify(entities));
    } catch (e) {
        console.warn('[CompareView] Failed to save compare entities:', e);
    }

    // Show success message
    if (window.showToast) {
        window.showToast(`Added "${entity.name}" to comparison (${entities.length}/3)`, 'success');
    } else if (window.ToastManager) {
        window.ToastManager.show(`Added "${entity.name}" to comparison (${entities.length}/3)`, 'success');
    }

    // Dispatch event for any listeners
    window.dispatchEvent(new CustomEvent('compareEntityAdded', {
        detail: { entity, totalCount: entities.length }
    }));

    return true;
};

/**
 * Static method to check if entity is in comparison
 */
CompareView.isInComparison = function(entityId, collection) {
    try {
        const stored = sessionStorage.getItem('eoa_compare_entities');
        if (stored) {
            const entities = JSON.parse(stored);
            return entities.some(e => e.id === entityId && e._collection === collection);
        }
    } catch (e) {
        console.warn('[CompareView] Failed to check compare entities:', e);
    }
    return false;
};

/**
 * Static method to get comparison count
 */
CompareView.getComparisonCount = function() {
    try {
        const stored = sessionStorage.getItem('eoa_compare_entities');
        if (stored) {
            return JSON.parse(stored).length;
        }
    } catch (e) {
        console.warn('[CompareView] Failed to get compare count:', e);
    }
    return 0;
};

// CommonJS export for Node.js (Jest tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompareView;
}

// Browser global export
if (typeof window !== 'undefined') {
    window.CompareView = CompareView;
}
