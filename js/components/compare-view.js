/**
 * Compare View Component
 * Enables side-by-side comparison of multiple entities from Firebase
 *
 * Features:
 * - Search and select 2-6 entities
 * - Filter by mythology and entity type
 * - Side-by-side attribute comparison
 * - Highlight matching/differing attributes
 * - Export comparison as image
 * - Share link with URL parameters
 * - Fully responsive (stacks on mobile)
 */

class CompareView {
    constructor(firestore) {
        this.db = firestore;
        this.selectedEntities = [];
        this.maxEntities = 6;
        this.minEntities = 2;
        this.searchResults = [];
        this.mythologies = [
            'egyptian', 'greek', 'norse', 'celtic', 'hindu', 'buddhist',
            'chinese', 'japanese', 'aztec', 'mayan', 'babylonian', 'sumerian',
            'persian', 'roman', 'christian', 'islamic', 'jewish', 'yoruba',
            'native_american', 'apocryphal'
        ];
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
            'concepts': 'Concepts'
        };
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
     * Generate main HTML
     */
    getHTML() {
        return `
            <div class="compare-view">
                <div class="compare-header">
                    <h1>Compare Entities</h1>
                    <div class="compare-actions">
                        <button id="share-compare" class="btn-secondary" ${this.selectedEntities.length < this.minEntities ? 'disabled' : ''}>
                            🔗 Share
                        </button>
                        <button id="export-compare" class="btn-secondary" ${this.selectedEntities.length < this.minEntities ? 'disabled' : ''}>
                            📥 Export
                        </button>
                        <button id="clear-compare" class="btn-secondary" ${this.selectedEntities.length === 0 ? 'disabled' : ''}>
                            🗑️ Clear All
                        </button>
                    </div>
                </div>

                <div class="entity-selector-panel">
                    <h3>Add Entities to Compare (${this.selectedEntities.length}/${this.maxEntities})</h3>

                    <div class="selector-controls">
                        <div class="search-input-wrapper">
                            <input type="text"
                                   id="entity-search"
                                   placeholder="Search entities by name..."
                                   ${this.selectedEntities.length >= this.maxEntities ? 'disabled' : ''}>
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

                    <div id="search-results" class="search-results">
                        ${this.selectedEntities.length >= this.maxEntities
                            ? '<p class="max-entities-msg">Maximum entities reached. Remove one to add more.</p>'
                            : '<p class="search-hint">Use the search and filters above to find entities</p>'}
                    </div>
                </div>

                <div id="comparison-section" class="comparison-section">
                    ${this.renderComparisonContent()}
                </div>
            </div>
        `;
    }

    /**
     * Render comparison table or empty state
     */
    renderComparisonContent() {
        if (this.selectedEntities.length === 0) {
            return this.renderEmptyState();
        } else if (this.selectedEntities.length === 1) {
            return this.renderSingleEntity();
        } else {
            return this.renderComparisonTable();
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
                <p class="hint">Try searching for "Zeus" and "Odin" to compare Greek and Norse gods!</p>
            </div>
        `;
    }

    /**
     * Show message when only one entity selected
     */
    renderSingleEntity() {
        return `
            <div class="single-entity-state">
                <div class="single-entity-icon">📌</div>
                <h2>One Entity Selected</h2>
                <p>Add at least one more entity to enable comparison.</p>
            </div>
        `;
    }

    /**
     * Render full comparison table
     */
    renderComparisonTable() {
        const attributes = this.getCommonAttributes();

        return `
            <div class="comparison-table-wrapper">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th class="attribute-column">Attribute</th>
                            ${this.selectedEntities.map((entity, idx) => `
                                <th class="entity-column entity-${idx}" data-mythology="${entity.mythology}">
                                    <div class="entity-header">
                                        ${entity.icon ? `<div class="entity-icon">${entity.icon}</div>` : ''}
                                        <div class="entity-info">
                                            <div class="entity-name">${entity.name || 'Unknown'}</div>
                                            <div class="entity-meta">
                                                <span class="mythology-badge">${this.capitalize(entity.mythology || 'Unknown')}</span>
                                                <span class="type-badge">${this.capitalize(entity.type || 'Entity')}</span>
                                            </div>
                                        </div>
                                        <button class="remove-entity-btn" data-index="${idx}" title="Remove">✕</button>
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
                <td class="attribute-name">${attribute.label}</td>
                ${values.map((val, idx) => `
                    <td class="entity-value entity-${idx}" data-mythology="${this.selectedEntities[idx].mythology}">
                        ${val.isEmpty ? '<span class="empty-value">—</span>' : val.display}
                    </td>
                `).join('')}
            </tr>
        `;
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
            if (e.target.classList.contains('remove-entity-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.removeEntity(index);
            }
        });

        console.log('[CompareView] Initialized');
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
        resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';

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
        return `
            <div class="search-result-card"
                 data-collection="${entity.collection}"
                 data-id="${entity.id}"
                 data-entity='${JSON.stringify(entity)}'>
                <div class="result-header">
                    ${entity.icon ? `<span class="result-icon">${entity.icon}</span>` : ''}
                    <div class="result-info">
                        <div class="result-name">${entity.name || 'Unknown'}</div>
                        <div class="result-meta">
                            <span class="mythology-badge">${this.capitalize(entity.mythology || 'Unknown')}</span>
                            <span class="type-badge">${this.capitalize(entity.type || entity.collection)}</span>
                        </div>
                    </div>
                </div>
                ${entity.title ? `<div class="result-title">${entity.title}</div>` : ''}
                ${entity.description ? `<div class="result-description">${this.truncate(entity.description, 100)}</div>` : ''}
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
            this.refresh();
        }
    }

    /**
     * Clear all selected entities
     */
    clearAll() {
        if (confirm('Clear all selected entities?')) {
            this.selectedEntities = [];
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
                this.showToast('Share link copied to clipboard!');
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

        this.showToast('Export feature requires html2canvas library. This is a placeholder.');

        // TODO: Implement html2canvas export
        // For now, show a "Save as PDF" instruction
        console.log('[CompareView] Export triggered - use browser Print > Save as PDF');
        window.print();
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
        } else {
            alert(message);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompareView;
}
