/**
 * Smart Field Components
 * Renders intelligent form fields that adapt based on context
 * - Hierarchical selects (parent-child relationships)
 * - Multi-selects with categories
 * - Coordinate inputs (lat/long for Earth locations)
 * - User history integration
 */

class SmartFields {
    constructor() {
        this.db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
        this.auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
        this.userHistoryCache = {};
    }

    /**
     * Render a hierarchical select field
     * Shows options with parent-child relationships, indented appropriately
     * @param {Object} config - Field configuration from formConfig
     * @param {string} fieldName - Name of the field
     * @param {string} currentValue - Currently selected value
     * @param {Array} userHistory - User's previously used values
     */
    renderHierarchicalSelect(config, fieldName, currentValue = '', userHistory = []) {
        const options = config.options || [];
        const allowCustom = config.allowCustom !== false;

        // Build hierarchical structure
        const rootOptions = options.filter(opt => !opt.parent);
        const childrenMap = {};

        options.forEach(opt => {
            if (opt.parent) {
                if (!childrenMap[opt.parent]) {
                    childrenMap[opt.parent] = [];
                }
                childrenMap[opt.parent].push(opt);
            }
        });

        // Render options recursively
        const renderOption = (option, depth = 0) => {
            const indent = '  '.repeat(depth);
            const disabled = option.type === 'separator' ? 'disabled' : '';
            const selected = option.value === currentValue ? 'selected' : '';
            const label = option.type === 'separator' ? option.label : `${indent}${option.label}`;

            let html = `<option value="${this.escapeHtml(option.value)}" ${disabled} ${selected}>${this.escapeHtml(label)}</option>`;

            // Add children if any
            if (childrenMap[option.value]) {
                childrenMap[option.value].forEach(child => {
                    html += renderOption(child, depth + 1);
                });
            }

            return html;
        };

        // Build the select HTML
        let selectHTML = `
            <select class="smart-field hierarchical-select"
                    name="${fieldName}"
                    id="${fieldName}"
                    data-field-type="hierarchical">
                <option value="">-- Select ${config.label || fieldName} --</option>
        `;

        // Add root options and their children
        rootOptions.forEach(opt => {
            selectHTML += renderOption(opt);
        });

        // Add user history section if available
        if (userHistory.length > 0) {
            selectHTML += `<option value="" disabled>--- My Previous Choices ---</option>`;
            userHistory.forEach(value => {
                const isSelected = value === currentValue ? 'selected' : '';
                selectHTML += `<option value="${this.escapeHtml(value)}" ${isSelected}>${this.escapeHtml(value)} ⭐</option>`;
            });
        }

        // Add custom option if allowed
        if (allowCustom) {
            const customOption = options.find(opt => opt.type === 'custom');
            if (customOption) {
                selectHTML += `<option value="__custom__">${this.escapeHtml(customOption.label)}</option>`;
            }
        }

        selectHTML += `</select>`;

        // Add custom input field (hidden by default)
        if (allowCustom) {
            selectHTML += `
                <input type="text"
                       class="smart-field custom-input"
                       id="${fieldName}-custom"
                       name="${fieldName}-custom"
                       placeholder="Enter custom ${config.label || fieldName}"
                       style="display: none; margin-top: var(--spacing-sm);">
            `;
        }

        return selectHTML;
    }

    /**
     * Render a multi-select field with categories
     * @param {Object} config - Field configuration
     * @param {string} fieldName - Name of the field
     * @param {Array} currentValues - Currently selected values
     * @param {Array} userHistory - User's previously used values
     */
    renderMultiSelect(config, fieldName, currentValues = [], userHistory = []) {
        const options = config.options || [];
        const categories = {};

        // Group options by category
        options.forEach(opt => {
            const category = opt.category || 'other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(opt);
        });

        let html = `
            <div class="smart-field multi-select-container" data-field-type="multi-select">
                <div class="multi-select-options">
        `;

        // Render options by category
        Object.keys(categories).forEach(category => {
            html += `
                <div class="multi-select-category">
                    <div class="category-label">${this.escapeHtml(category)}</div>
                    <div class="category-options">
            `;

            categories[category].forEach(opt => {
                if (opt.type === 'custom') return; // Skip custom option in main list

                const checked = currentValues.includes(opt.value) ? 'checked' : '';
                const optionId = `${fieldName}-${opt.value}`;

                html += `
                    <label class="multi-select-option">
                        <input type="checkbox"
                               name="${fieldName}[]"
                               value="${this.escapeHtml(opt.value)}"
                               id="${optionId}"
                               ${checked}>
                        <span class="option-label">${this.escapeHtml(opt.label)}</span>
                    </label>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        // Add user history section
        if (userHistory.length > 0) {
            html += `
                <div class="multi-select-category">
                    <div class="category-label">⭐ My Previous Choices</div>
                    <div class="category-options">
            `;

            userHistory.forEach(value => {
                // Skip if already in main options
                if (options.find(opt => opt.value === value)) return;

                const checked = currentValues.includes(value) ? 'checked' : '';
                const optionId = `${fieldName}-history-${value.replace(/\s+/g, '-')}`;

                html += `
                    <label class="multi-select-option">
                        <input type="checkbox"
                               name="${fieldName}[]"
                               value="${this.escapeHtml(value)}"
                               id="${optionId}"
                               ${checked}>
                        <span class="option-label">${this.escapeHtml(value)}</span>
                    </label>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        // Add custom input if allowed
        if (config.allowCustom) {
            html += `
                <div class="multi-select-custom">
                    <input type="text"
                           class="smart-field custom-input"
                           id="${fieldName}-custom"
                           placeholder="${config.placeholder || 'Add custom value'}">
                    <button type="button"
                            class="btn-add-custom"
                            data-field="${fieldName}">+ Add</button>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Render coordinate input fields (latitude/longitude)
     * @param {string} fieldName - Base field name
     * @param {Object} currentValue - Current coordinates {lat, lng}
     */
    renderCoordinateInput(fieldName, currentValue = {}) {
        const lat = currentValue.lat || '';
        const lng = currentValue.lng || '';

        return `
            <div class="smart-field coordinate-input" data-field-type="coordinates">
                <div class="coordinate-fields">
                    <div class="coordinate-field">
                        <label for="${fieldName}-lat">Latitude</label>
                        <input type="number"
                               id="${fieldName}-lat"
                               name="${fieldName}[lat]"
                               value="${lat}"
                               min="-90"
                               max="90"
                               step="any"
                               placeholder="e.g., 40.7128"
                               class="coordinate-lat">
                        <small class="field-hint">-90° to 90°</small>
                    </div>
                    <div class="coordinate-field">
                        <label for="${fieldName}-lng">Longitude</label>
                        <input type="number"
                               id="${fieldName}-lng"
                               name="${fieldName}[lng]"
                               value="${lng}"
                               min="-180"
                               max="180"
                               step="any"
                               placeholder="e.g., -74.0060"
                               class="coordinate-lng">
                        <small class="field-hint">-180° to 180°</small>
                    </div>
                </div>
                <div class="coordinate-preview" id="${fieldName}-preview">
                    ${lat && lng ? `<small>📍 ${lat}, ${lng}</small>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render a smart field based on configuration
     * Automatically determines the appropriate rendering method
     * @param {Object} config - Field configuration from formConfig
     * @param {string} fieldName - Name of the field
     * @param {*} currentValue - Current value(s)
     * @param {Array} userHistory - User's previously used values
     */
    async renderSmartField(config, fieldName, currentValue, userHistory = []) {
        const fieldType = config.type || 'text';

        // Fetch user history if not provided
        if (userHistory.length === 0 && this.auth && this.auth.currentUser) {
            userHistory = await this.getUserFieldHistory(fieldName);
        }

        switch (fieldType) {
            case 'hierarchical':
                return this.renderHierarchicalSelect(config, fieldName, currentValue, userHistory);

            case 'multi-select':
                return this.renderMultiSelect(config, fieldName, currentValue, userHistory);

            case 'coordinates':
                return this.renderCoordinateInput(fieldName, currentValue);

            default:
                // Fallback to simple text input
                return `<input type="text" name="${fieldName}" id="${fieldName}" value="${this.escapeHtml(currentValue || '')}" class="smart-field">`;
        }
    }

    /**
     * Get user's field history from Firestore
     * @param {string} fieldName - Field to get history for
     * @returns {Promise<Array>} Array of previously used values
     */
    async getUserFieldHistory(fieldName) {
        if (!this.db || !this.auth || !this.auth.currentUser) {
            return [];
        }

        // Check cache first
        const cacheKey = `${this.auth.currentUser.uid}-${fieldName}`;
        if (this.userHistoryCache[cacheKey]) {
            return this.userHistoryCache[cacheKey];
        }

        try {
            const userId = this.auth.currentUser.uid;

            // Query user's theories for this field
            const snapshot = await this.db.collection('theories')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            const values = new Set();

            snapshot.docs.forEach(doc => {
                const data = doc.data();

                // Check in assetMetadata
                if (data.assetMetadata && data.assetMetadata[fieldName]) {
                    const value = data.assetMetadata[fieldName];
                    if (Array.isArray(value)) {
                        value.forEach(v => values.add(v));
                    } else {
                        values.add(value);
                    }
                }

                // Check in top-level metadata
                if (data.metadata && data.metadata[fieldName]) {
                    const value = data.metadata[fieldName];
                    if (Array.isArray(value)) {
                        value.forEach(v => values.add(v));
                    } else {
                        values.add(value);
                    }
                }

                // Check direct field
                if (data[fieldName]) {
                    const value = data[fieldName];
                    if (Array.isArray(value)) {
                        value.forEach(v => values.add(v));
                    } else {
                        values.add(value);
                    }
                }
            });

            const history = Array.from(values).filter(v => v && v !== '');

            // Cache the result
            this.userHistoryCache[cacheKey] = history;

            return history;
        } catch (error) {
            console.error('Error fetching user field history:', error);
            return [];
        }
    }

    /**
     * Initialize event listeners for smart fields
     * Handles custom input toggling, multi-select add buttons, etc.
     */
    initializeEventListeners() {
        // Handle hierarchical select custom option
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('hierarchical-select')) {
                const customInput = document.getElementById(`${e.target.id}-custom`);
                if (customInput) {
                    if (e.target.value === '__custom__') {
                        customInput.style.display = 'block';
                        customInput.required = true;
                        customInput.focus();
                    } else {
                        customInput.style.display = 'none';
                        customInput.required = false;
                        customInput.value = '';
                    }
                }
            }
        });

        // Handle multi-select custom add button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-custom')) {
                const fieldName = e.target.dataset.field;
                const customInput = document.getElementById(`${fieldName}-custom`);

                if (customInput && customInput.value.trim()) {
                    const value = customInput.value.trim();
                    const container = e.target.closest('.multi-select-container');
                    const optionsContainer = container.querySelector('.category-options');

                    // Add checkbox for custom value
                    const optionId = `${fieldName}-custom-${value.replace(/\s+/g, '-')}`;
                    const optionHTML = `
                        <label class="multi-select-option">
                            <input type="checkbox"
                                   name="${fieldName}[]"
                                   value="${this.escapeHtml(value)}"
                                   id="${optionId}"
                                   checked>
                            <span class="option-label">${this.escapeHtml(value)}</span>
                        </label>
                    `;

                    // Find or create custom values category
                    let customCategory = container.querySelector('.custom-values-category');
                    if (!customCategory) {
                        customCategory = document.createElement('div');
                        customCategory.className = 'multi-select-category custom-values-category';
                        customCategory.innerHTML = `
                            <div class="category-label">Custom Values</div>
                            <div class="category-options"></div>
                        `;
                        container.querySelector('.multi-select-options').appendChild(customCategory);
                    }

                    customCategory.querySelector('.category-options').insertAdjacentHTML('beforeend', optionHTML);
                    customInput.value = '';
                }
            }
        });

        // Handle coordinate input updates (show preview)
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('coordinate-lat') || e.target.classList.contains('coordinate-lng')) {
                const container = e.target.closest('.coordinate-input');
                const latInput = container.querySelector('.coordinate-lat');
                const lngInput = container.querySelector('.coordinate-lng');
                const preview = container.querySelector('.coordinate-preview');

                if (latInput.value && lngInput.value) {
                    preview.innerHTML = `<small>📍 ${latInput.value}, ${lngInput.value}</small>`;
                } else {
                    preview.innerHTML = '';
                }
            }
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.smartFields = new SmartFields();

// Initialize event listeners when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.smartFields.initializeEventListeners();
    });
} else {
    window.smartFields.initializeEventListeners();
}
