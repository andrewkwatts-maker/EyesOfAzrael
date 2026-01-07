/**
 * Relationship Suggestion Form Component
 *
 * Modal form for suggesting relationships between mythology entities.
 * Allows users to propose connections like "Zeus is the father of Heracles"
 * or "Mjolnir is wielded by Thor".
 *
 * Features:
 * - Entity search with autocomplete
 * - Relationship type selection
 * - Description with markdown support
 * - Evidence/source links
 * - Bidirectional relationship option
 * - Preview before submission
 */

class RelationshipSuggestionForm {
    constructor(options = {}) {
        this.modal = null;
        this.isOpen = false;
        this.isSubmitting = false;

        // Source entity (the entity page we're on)
        this.sourceEntity = null;
        this.sourceCollection = null;

        // Selected target entity
        this.targetEntity = null;

        // Options
        this.options = {
            onSubmit: options.onSubmit || null,
            onClose: options.onClose || null,
            ...options
        };

        // Relationship type definitions
        this.relationshipTypes = [
            { value: 'parent', label: 'Parent/Child', icon: '👨‍👧', description: 'Family relationship' },
            { value: 'sibling', label: 'Sibling', icon: '👥', description: 'Brother/sister relationship' },
            { value: 'spouse', label: 'Spouse/Consort', icon: '💑', description: 'Marriage or romantic relationship' },
            { value: 'creator', label: 'Creator/Creation', icon: '🎨', description: 'Made or gave birth to' },
            { value: 'wielder', label: 'Wielder/Weapon', icon: '⚔️', description: 'Uses or possesses item' },
            { value: 'ruler', label: 'Ruler/Domain', icon: '👑', description: 'Rules over or governs' },
            { value: 'enemy', label: 'Enemy/Rival', icon: '⚔️', description: 'Opposition or conflict' },
            { value: 'ally', label: 'Ally/Friend', icon: '🤝', description: 'Alliance or friendship' },
            { value: 'teacher', label: 'Teacher/Student', icon: '📚', description: 'Mentorship relationship' },
            { value: 'transformation', label: 'Transformation', icon: '🔄', description: 'Became or transformed into' },
            { value: 'parallel', label: 'Parallel/Equivalent', icon: '🔀', description: 'Similar across mythologies' },
            { value: 'aspect', label: 'Aspect/Avatar', icon: '🎭', description: 'Different form or manifestation' },
            { value: 'slayer', label: 'Slayer/Victim', icon: '💀', description: 'Killed or defeated' },
            { value: 'location', label: 'Location', icon: '📍', description: 'Associated with place' },
            { value: 'symbol', label: 'Symbol', icon: '✨', description: 'Represented by or associated with' },
            { value: 'other', label: 'Other', icon: '🔗', description: 'Custom relationship type' }
        ];

        // Search debounce
        this.searchTimeout = null;
        this.searchResults = [];

        // Bound handlers
        this._handleEscape = this._handleEscape.bind(this);
        this._handleClickOutside = this._handleClickOutside.bind(this);
    }

    /**
     * Open the form for a source entity
     */
    open(sourceEntity, sourceCollection) {
        this.sourceEntity = sourceEntity;
        this.sourceCollection = sourceCollection;
        this.targetEntity = null;

        this._createModal();
        this._bindEvents();

        // Add to DOM
        document.body.appendChild(this.modal);

        // Trigger open animation
        requestAnimationFrame(() => {
            this.modal.classList.add('relationship-form--open');
        });

        this.isOpen = true;

        // Focus search input
        setTimeout(() => {
            const searchInput = this.modal.querySelector('.relationship-form__search-input');
            if (searchInput) searchInput.focus();
        }, 150);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the form
     */
    close() {
        if (!this.isOpen) return;

        this.modal.classList.remove('relationship-form--open');

        setTimeout(() => {
            if (this.modal && this.modal.parentNode) {
                this.modal.parentNode.removeChild(this.modal);
            }
            this.modal = null;
        }, 200);

        this.isOpen = false;
        document.body.style.overflow = '';

        // Remove event listeners
        document.removeEventListener('keydown', this._handleEscape);

        if (this.options.onClose) {
            this.options.onClose();
        }
    }

    /**
     * Create the modal HTML
     */
    _createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'relationship-form';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'relationship-form-title');

        const sourceName = this.sourceEntity?.name || this.sourceEntity?.id || 'Entity';

        this.modal.innerHTML = `
            <div class="relationship-form__backdrop"></div>

            <div class="relationship-form__content">
                <header class="relationship-form__header">
                    <h2 id="relationship-form-title" class="relationship-form__title">
                        Suggest a Relationship
                    </h2>
                    <button type="button" class="relationship-form__close" aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </header>

                <form class="relationship-form__body" id="relationship-suggestion-form">
                    <!-- Source Entity (locked) -->
                    <div class="relationship-form__field">
                        <label class="relationship-form__label">From Entity</label>
                        <div class="relationship-form__source-entity">
                            <span class="relationship-form__entity-badge">
                                ${this._escapeHtml(sourceName)}
                            </span>
                            <span class="relationship-form__entity-type">
                                ${this._escapeHtml(this.sourceCollection || '')}
                            </span>
                        </div>
                    </div>

                    <!-- Relationship Type -->
                    <div class="relationship-form__field">
                        <label class="relationship-form__label" for="relationship-type">
                            Relationship Type <span class="required">*</span>
                        </label>
                        <select id="relationship-type" name="relationshipType"
                                class="relationship-form__select" required>
                            <option value="">Select relationship type...</option>
                            ${this.relationshipTypes.map(type => `
                                <option value="${type.value}">
                                    ${type.icon} ${type.label} - ${type.description}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Target Entity Search -->
                    <div class="relationship-form__field">
                        <label class="relationship-form__label" for="target-search">
                            To Entity <span class="required">*</span>
                        </label>
                        <div class="relationship-form__search">
                            <input type="text"
                                   id="target-search"
                                   class="relationship-form__search-input"
                                   placeholder="Search for an entity..."
                                   autocomplete="off"
                                   required>
                            <div class="relationship-form__search-results" aria-live="polite">
                            </div>
                        </div>
                        <div class="relationship-form__selected-target" style="display: none;">
                            <span class="relationship-form__target-name"></span>
                            <button type="button" class="relationship-form__target-remove"
                                    aria-label="Remove selected entity">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="relationship-form__field">
                        <label class="relationship-form__label" for="relationship-description">
                            Description <span class="required">*</span>
                        </label>
                        <textarea id="relationship-description"
                                  name="description"
                                  class="relationship-form__textarea"
                                  rows="3"
                                  placeholder="Explain how these entities are related..."
                                  required
                                  minlength="20"
                                  maxlength="1000"></textarea>
                        <div class="relationship-form__char-count">
                            <span class="current">0</span>/1000
                        </div>
                    </div>

                    <!-- Evidence/Sources -->
                    <div class="relationship-form__field">
                        <label class="relationship-form__label" for="relationship-evidence">
                            Evidence/Sources (optional)
                        </label>
                        <textarea id="relationship-evidence"
                                  name="evidence"
                                  class="relationship-form__textarea"
                                  rows="2"
                                  placeholder="Cite sources, myths, or texts that support this relationship..."
                                  maxlength="500"></textarea>
                    </div>

                    <!-- Tags -->
                    <div class="relationship-form__field">
                        <label class="relationship-form__label" for="relationship-tags">
                            Tags (optional)
                        </label>
                        <input type="text"
                               id="relationship-tags"
                               name="tags"
                               class="relationship-form__input"
                               placeholder="e.g., greek, family, olympian (comma-separated)">
                    </div>

                    <!-- Bidirectional Option -->
                    <div class="relationship-form__field relationship-form__checkbox-field">
                        <label class="relationship-form__checkbox-label">
                            <input type="checkbox"
                                   id="relationship-bidirectional"
                                   name="bidirectional"
                                   class="relationship-form__checkbox">
                            <span class="relationship-form__checkbox-text">
                                Suggest reciprocal relationship
                            </span>
                        </label>
                        <p class="relationship-form__hint">
                            If checked, the reverse relationship will also be suggested
                            (e.g., "A is parent of B" and "B is child of A")
                        </p>
                    </div>

                    <!-- Error Message -->
                    <div class="relationship-form__error" role="alert" style="display: none;"></div>

                    <!-- Actions -->
                    <div class="relationship-form__actions">
                        <button type="button"
                                class="relationship-form__btn relationship-form__btn--secondary"
                                data-action="cancel">
                            Cancel
                        </button>
                        <button type="submit"
                                class="relationship-form__btn relationship-form__btn--primary"
                                disabled>
                            <span class="btn-text">Submit Suggestion</span>
                            <span class="btn-loading" style="display: none;">
                                <svg class="spinner" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor"
                                            stroke-width="3" fill="none" stroke-dasharray="60" />
                                </svg>
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    _bindEvents() {
        const form = this.modal.querySelector('#relationship-suggestion-form');
        const backdrop = this.modal.querySelector('.relationship-form__backdrop');
        const closeBtn = this.modal.querySelector('.relationship-form__close');
        const cancelBtn = this.modal.querySelector('[data-action="cancel"]');
        const searchInput = this.modal.querySelector('.relationship-form__search-input');
        const descriptionInput = this.modal.querySelector('#relationship-description');
        const targetRemoveBtn = this.modal.querySelector('.relationship-form__target-remove');

        // Close handlers
        backdrop.addEventListener('click', () => this.close());
        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        document.addEventListener('keydown', this._handleEscape);

        // Form submission
        form.addEventListener('submit', (e) => this._handleSubmit(e));

        // Entity search
        searchInput.addEventListener('input', (e) => this._handleSearch(e));
        searchInput.addEventListener('focus', () => this._showSearchResults());

        // Character count for description
        descriptionInput.addEventListener('input', (e) => this._updateCharCount(e));

        // Target removal
        targetRemoveBtn.addEventListener('click', () => this._removeTarget());

        // Form validation
        form.addEventListener('input', () => this._validateForm());
    }

    /**
     * Handle escape key
     */
    _handleEscape(e) {
        if (e.key === 'Escape' && this.isOpen) {
            this.close();
        }
    }

    /**
     * Handle click outside
     */
    _handleClickOutside(e) {
        if (e.target.classList.contains('relationship-form__backdrop')) {
            this.close();
        }
    }

    /**
     * Handle entity search
     */
    async _handleSearch(e) {
        const query = e.target.value.trim();

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Hide results if query is too short
        if (query.length < 2) {
            this._hideSearchResults();
            return;
        }

        // Debounce search
        this.searchTimeout = setTimeout(async () => {
            await this._performSearch(query);
        }, 300);
    }

    /**
     * Perform entity search
     */
    async _performSearch(query) {
        const resultsContainer = this.modal.querySelector('.relationship-form__search-results');

        // Show loading
        resultsContainer.innerHTML = `
            <div class="relationship-form__search-loading">
                Searching...
            </div>
        `;
        resultsContainer.style.display = 'block';

        try {
            // Search across collections
            const results = await this._searchEntities(query);
            this.searchResults = results;

            if (results.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="relationship-form__search-empty">
                        No entities found for "${this._escapeHtml(query)}"
                    </div>
                `;
            } else {
                resultsContainer.innerHTML = results.map((entity, index) => `
                    <button type="button"
                            class="relationship-form__search-result"
                            data-index="${index}"
                            data-id="${entity.id}"
                            data-collection="${entity.collection}">
                        <span class="result-name">${this._escapeHtml(entity.name)}</span>
                        <span class="result-type">${this._escapeHtml(entity.type || entity.collection)}</span>
                        ${entity.mythology ? `<span class="result-mythology">${this._escapeHtml(entity.mythology)}</span>` : ''}
                    </button>
                `).join('');

                // Add click handlers
                resultsContainer.querySelectorAll('.relationship-form__search-result').forEach(btn => {
                    btn.addEventListener('click', (e) => this._selectTarget(e));
                });
            }
        } catch (error) {
            console.error('[RelationshipSuggestionForm] Search error:', error);
            resultsContainer.innerHTML = `
                <div class="relationship-form__search-error">
                    Search failed. Please try again.
                </div>
            `;
        }
    }

    /**
     * Search entities across collections
     */
    async _searchEntities(query) {
        const results = [];
        const queryLower = query.toLowerCase();

        // Collections to search
        const collections = [
            'deities', 'heroes', 'creatures', 'items', 'places',
            'texts', 'rituals', 'herbs', 'symbols', 'concepts', 'cosmology'
        ];

        if (typeof firebase === 'undefined' || !firebase.firestore) {
            return results;
        }

        const db = firebase.firestore();

        // Search each collection (limited for performance)
        for (const collection of collections) {
            try {
                const snapshot = await db.collection(collection)
                    .orderBy('name')
                    .startAt(query)
                    .endAt(query + '\uf8ff')
                    .limit(5)
                    .get();

                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Don't include the source entity
                    if (doc.id !== this.sourceEntity?.id) {
                        results.push({
                            id: doc.id,
                            collection: collection,
                            name: data.name || doc.id,
                            type: data.type || collection,
                            mythology: data.mythology || data.origin
                        });
                    }
                });
            } catch (e) {
                // Collection might not have 'name' index, continue
            }
        }

        // Sort by relevance (exact matches first)
        results.sort((a, b) => {
            const aExact = a.name.toLowerCase() === queryLower;
            const bExact = b.name.toLowerCase() === queryLower;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return a.name.localeCompare(b.name);
        });

        return results.slice(0, 15);
    }

    /**
     * Show search results
     */
    _showSearchResults() {
        const resultsContainer = this.modal.querySelector('.relationship-form__search-results');
        if (this.searchResults.length > 0) {
            resultsContainer.style.display = 'block';
        }
    }

    /**
     * Hide search results
     */
    _hideSearchResults() {
        const resultsContainer = this.modal.querySelector('.relationship-form__search-results');
        resultsContainer.style.display = 'none';
    }

    /**
     * Select a target entity
     */
    _selectTarget(e) {
        const btn = e.currentTarget;
        const index = parseInt(btn.dataset.index, 10);
        const entity = this.searchResults[index];

        if (!entity) return;

        this.targetEntity = entity;

        // Update UI
        const searchInput = this.modal.querySelector('.relationship-form__search-input');
        const searchContainer = this.modal.querySelector('.relationship-form__search');
        const selectedContainer = this.modal.querySelector('.relationship-form__selected-target');
        const targetName = this.modal.querySelector('.relationship-form__target-name');

        searchInput.value = '';
        searchContainer.style.display = 'none';
        selectedContainer.style.display = 'flex';
        targetName.textContent = `${entity.name} (${entity.collection})`;

        this._hideSearchResults();
        this._validateForm();
    }

    /**
     * Remove selected target
     */
    _removeTarget() {
        this.targetEntity = null;

        const searchContainer = this.modal.querySelector('.relationship-form__search');
        const selectedContainer = this.modal.querySelector('.relationship-form__selected-target');
        const searchInput = this.modal.querySelector('.relationship-form__search-input');

        searchContainer.style.display = 'block';
        selectedContainer.style.display = 'none';

        searchInput.focus();
        this._validateForm();
    }

    /**
     * Update character count
     */
    _updateCharCount(e) {
        const count = e.target.value.length;
        const counter = this.modal.querySelector('.relationship-form__char-count .current');
        counter.textContent = count;

        if (count > 900) {
            counter.classList.add('warning');
        } else {
            counter.classList.remove('warning');
        }
    }

    /**
     * Validate form and update submit button
     */
    _validateForm() {
        const form = this.modal.querySelector('#relationship-suggestion-form');
        const submitBtn = this.modal.querySelector('.relationship-form__btn--primary');
        const typeSelect = form.querySelector('[name="relationshipType"]');
        const description = form.querySelector('[name="description"]');

        const isValid =
            this.targetEntity !== null &&
            typeSelect.value !== '' &&
            description.value.length >= 20;

        submitBtn.disabled = !isValid;
    }

    /**
     * Handle form submission
     */
    async _handleSubmit(e) {
        e.preventDefault();

        if (this.isSubmitting) return;

        const form = e.target;
        const submitBtn = this.modal.querySelector('.relationship-form__btn--primary');
        const errorContainer = this.modal.querySelector('.relationship-form__error');

        // Get form data
        const formData = {
            relationshipType: form.relationshipType.value,
            description: form.description.value.trim(),
            evidence: form.evidence.value.trim(),
            tags: form.tags.value.split(',').map(t => t.trim()).filter(t => t),
            bidirectional: form.bidirectional.checked
        };

        // Validate
        if (!this.targetEntity) {
            this._showError('Please select a target entity');
            return;
        }

        if (!formData.relationshipType) {
            this._showError('Please select a relationship type');
            return;
        }

        if (formData.description.length < 20) {
            this._showError('Description must be at least 20 characters');
            return;
        }

        // Show loading
        this.isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').style.display = 'none';
        submitBtn.querySelector('.btn-loading').style.display = 'flex';
        errorContainer.style.display = 'none';

        try {
            // Submit via RelationshipService if available
            if (typeof window.RelationshipService !== 'undefined') {
                const service = new window.RelationshipService();
                await service.init();

                const relationship = await service.suggestRelationship(
                    {
                        entityId: this.sourceEntity.id || this.sourceEntity,
                        entityType: this.sourceCollection,
                        entityCollection: this.sourceCollection
                    },
                    {
                        entityId: this.targetEntity.id,
                        entityType: this.targetEntity.type,
                        entityCollection: this.targetEntity.collection
                    },
                    {
                        relationshipType: formData.relationshipType,
                        title: this._getRelationshipTitle(formData.relationshipType),
                        description: formData.description,
                        evidence: formData.evidence ? [formData.evidence] : [],
                        tags: formData.tags
                    }
                );

                // If bidirectional, suggest reverse relationship
                if (formData.bidirectional) {
                    const reverseType = this._getReverseRelationshipType(formData.relationshipType);
                    await service.suggestRelationship(
                        {
                            entityId: this.targetEntity.id,
                            entityType: this.targetEntity.type,
                            entityCollection: this.targetEntity.collection
                        },
                        {
                            entityId: this.sourceEntity.id || this.sourceEntity,
                            entityType: this.sourceCollection,
                            entityCollection: this.sourceCollection
                        },
                        {
                            relationshipType: reverseType,
                            title: this._getRelationshipTitle(reverseType),
                            description: `Reciprocal relationship: ${formData.description}`,
                            evidence: formData.evidence ? [formData.evidence] : [],
                            tags: formData.tags
                        }
                    );
                }

                // Success callback
                if (this.options.onSubmit) {
                    this.options.onSubmit(relationship);
                }

                // Show success and close
                this._showSuccess('Relationship suggestion submitted!');
                setTimeout(() => this.close(), 1500);

            } else {
                throw new Error('RelationshipService not available');
            }

        } catch (error) {
            console.error('[RelationshipSuggestionForm] Submit error:', error);
            this._showError(error.message || 'Failed to submit. Please try again.');

            this.isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').style.display = '';
            submitBtn.querySelector('.btn-loading').style.display = 'none';
        }
    }

    /**
     * Get relationship title from type
     */
    _getRelationshipTitle(type) {
        const typeObj = this.relationshipTypes.find(t => t.value === type);
        return typeObj ? typeObj.label : type;
    }

    /**
     * Get reverse relationship type
     */
    _getReverseRelationshipType(type) {
        const reverseMap = {
            'parent': 'child',
            'child': 'parent',
            'creator': 'created_by',
            'created_by': 'creator',
            'wielder': 'wielded_by',
            'wielded_by': 'wielder',
            'ruler': 'ruled_by',
            'ruled_by': 'ruler',
            'teacher': 'student',
            'student': 'teacher',
            'slayer': 'slain_by',
            'slain_by': 'slayer'
        };
        return reverseMap[type] || type;
    }

    /**
     * Show error message
     */
    _showError(message) {
        const errorContainer = this.modal.querySelector('.relationship-form__error');
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Show success message
     */
    _showSuccess(message) {
        const errorContainer = this.modal.querySelector('.relationship-form__error');
        errorContainer.textContent = message;
        errorContainer.className = 'relationship-form__success';
        errorContainer.style.display = 'block';
    }

    /**
     * Escape HTML
     */
    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// CSS for the relationship suggestion form
const relationshipFormStyles = `
.relationship-form {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
}

.relationship-form--open {
    opacity: 1;
    visibility: visible;
}

.relationship-form__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
}

.relationship-form__content {
    position: relative;
    background: var(--color-surface, #1f2937);
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
    border-radius: 16px;
    width: 100%;
    max-width: 540px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
    transform: scale(0.95) translateY(20px);
    transition: transform 0.2s;
}

.relationship-form--open .relationship-form__content {
    transform: scale(1) translateY(0);
}

.relationship-form__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.relationship-form__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text, white);
    margin: 0;
}

.relationship-form__close {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary, #9ca3af);
    cursor: pointer;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
}

.relationship-form__close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text, white);
}

.relationship-form__close svg {
    width: 20px;
    height: 20px;
}

.relationship-form__body {
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.relationship-form__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.relationship-form__label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text, white);
}

.relationship-form__label .required {
    color: #ef4444;
}

.relationship-form__source-entity {
    display: flex;
    align-items: center;
    gap: 8px;
}

.relationship-form__entity-badge {
    padding: 8px 16px;
    background: var(--color-primary, #6366f1);
    color: white;
    border-radius: 20px;
    font-weight: 500;
}

.relationship-form__entity-type {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #9ca3af);
    text-transform: capitalize;
}

.relationship-form__select,
.relationship-form__input,
.relationship-form__textarea {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
    border-radius: 8px;
    color: var(--color-text, white);
    font-size: 1rem;
    transition: border-color 0.15s, background 0.15s;
}

.relationship-form__select:focus,
.relationship-form__input:focus,
.relationship-form__textarea:focus {
    outline: none;
    border-color: var(--color-primary, #6366f1);
    background: rgba(255, 255, 255, 0.08);
}

.relationship-form__select option {
    background: var(--color-surface, #1f2937);
    color: var(--color-text, white);
}

.relationship-form__textarea {
    resize: vertical;
    min-height: 80px;
}

.relationship-form__char-count {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #9ca3af);
    text-align: right;
}

.relationship-form__char-count .current.warning {
    color: #f59e0b;
}

/* Search */
.relationship-form__search {
    position: relative;
}

.relationship-form__search-input {
    width: 100%;
}

.relationship-form__search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-surface, #1f2937);
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
    border-radius: 8px;
    margin-top: 4px;
    max-height: 240px;
    overflow-y: auto;
    z-index: 10;
    display: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.relationship-form__search-result {
    width: 100%;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.05));
    color: var(--color-text, white);
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: background 0.15s;
}

.relationship-form__search-result:last-child {
    border-bottom: none;
}

.relationship-form__search-result:hover {
    background: rgba(255, 255, 255, 0.1);
}

.relationship-form__search-result .result-name {
    flex: 1;
    font-weight: 500;
}

.relationship-form__search-result .result-type {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #9ca3af);
    text-transform: capitalize;
}

.relationship-form__search-result .result-mythology {
    font-size: 0.75rem;
    color: var(--color-primary, #6366f1);
}

.relationship-form__search-loading,
.relationship-form__search-empty,
.relationship-form__search-error {
    padding: 16px;
    text-align: center;
    color: var(--color-text-secondary, #9ca3af);
    font-size: 0.875rem;
}

.relationship-form__search-error {
    color: #ef4444;
}

/* Selected Target */
.relationship-form__selected-target {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid var(--color-primary, #6366f1);
    border-radius: 8px;
}

.relationship-form__target-name {
    flex: 1;
    color: var(--color-text, white);
    font-weight: 500;
}

.relationship-form__target-remove {
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-secondary, #9ca3af);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
}

.relationship-form__target-remove:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

.relationship-form__target-remove svg {
    width: 14px;
    height: 14px;
}

/* Checkbox */
.relationship-form__checkbox-field {
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
}

.relationship-form__checkbox-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}

.relationship-form__checkbox {
    width: 18px;
    height: 18px;
    accent-color: var(--color-primary, #6366f1);
}

.relationship-form__checkbox-text {
    color: var(--color-text, white);
    font-weight: 500;
}

.relationship-form__hint {
    margin-top: 8px;
    font-size: 0.75rem;
    color: var(--color-text-secondary, #9ca3af);
    line-height: 1.5;
}

/* Error/Success */
.relationship-form__error {
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #ef4444;
    font-size: 0.875rem;
}

.relationship-form__success {
    padding: 12px 16px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    color: #10b981;
    font-size: 0.875rem;
}

/* Actions */
.relationship-form__actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 8px;
    border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.relationship-form__btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, opacity 0.15s;
}

.relationship-form__btn:active {
    transform: scale(0.98);
}

.relationship-form__btn--secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text, white);
}

.relationship-form__btn--secondary:hover {
    background: rgba(255, 255, 255, 0.15);
}

.relationship-form__btn--primary {
    background: var(--color-primary, #6366f1);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 160px;
}

.relationship-form__btn--primary:hover:not(:disabled) {
    background: var(--color-primary-dark, #4f46e5);
}

.relationship-form__btn--primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.relationship-form__btn--primary .spinner {
    width: 18px;
    height: 18px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Mobile */
@media (max-width: 640px) {
    .relationship-form {
        padding: 8px;
    }

    .relationship-form__content {
        max-height: 95vh;
        border-radius: 12px;
    }

    .relationship-form__header {
        padding: 16px;
    }

    .relationship-form__body {
        padding: 16px;
        gap: 16px;
    }

    .relationship-form__actions {
        flex-direction: column-reverse;
    }

    .relationship-form__btn {
        width: 100%;
    }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('relationship-form-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'relationship-form-styles';
    styleSheet.textContent = relationshipFormStyles;
    document.head.appendChild(styleSheet);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RelationshipSuggestionForm };
}

if (typeof window !== 'undefined') {
    window.RelationshipSuggestionForm = RelationshipSuggestionForm;
}
