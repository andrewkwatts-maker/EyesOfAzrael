/**
 * Icon Picker Component
 * Allows users to select emojis or custom icon classes for panel headers
 * Matches the frosted glass design system
 */

class IconPicker {
    constructor(options = {}) {
        this.onSelect = options.onSelect || (() => {});
        this.currentIcon = options.currentIcon || '';
        this.allowCustomClass = options.allowCustomClass !== false; // default true

        // Emoji categories
        this.categories = {
            symbols: {
                name: 'Symbols',
                emojis: ['⚡', '🌟', '✨', '💫', '⭐', '🔥', '💎', '👁️', '☀️', '🌙', '⚔️', '🛡️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '☦️', '⛩️', '🕎', '☯️', '☮️', '🪬', '🧿', '📿', '⚛️', '🔱', '⚜️', '〽️', '✴️', '❇️', '💠', '🔰', '⭕', '🚫', '❌', '⭕', '💯', '🆕', '🔱']
            },
            nature: {
                name: 'Nature',
                emojis: ['🌊', '🌲', '🌺', '🦅', '🐉', '🦁', '🐍', '🌸', '🍃', '🌾', '🌳', '🌴', '🌵', '🌿', '🍀', '🌹', '🌷', '🌻', '🦋', '🐝', '🦚', '🦢', '🦉', '🕊️', '🐺', '🐅', '🐆', '🦌', '🐘', '🐪', '🦒', '🦙', '🐛', '🦂', '🕷️', '🐚', '🪶', '🦴']
            },
            objects: {
                name: 'Objects',
                emojis: ['📖', '📜', '🏺', '⚱️', '🗿', '🏛️', '⛩️', '🕯️', '🔮', '📿', '🎭', '🗝️', '⚙️', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🗡️', '🏹', '🛡️', '👑', '💍', '📯', '🎺', '🪕', '🥁', '🪘', '🎨', '🖼️', '🗺️', '🧭', '⚖️', '⚗️', '🔬', '🔭', '📡', '💊', '🧪']
            },
            activities: {
                name: 'Activities',
                emojis: ['🙏', '🧘', '⚖️', '🎭', '🎨', '🎵', '🎶', '💃', '🕺', '🤝', '🤲', '👐', '🙌', '👏', '✊', '✋', '🖐️', '☝️', '👆', '👇', '👈', '👉', '🤘', '✌️', '🤞', '🫶', '💪', '🦾']
            },
            celestial: {
                name: 'Celestial',
                emojis: ['☀️', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '⭐', '🌟', '✨', '💫', '☄️', '🌠', '🌌', '🌃', '🌆', '🌇', '🌉', '⚡', '🔥', '💥', '✴️', '🌈']
            },
            mythical: {
                name: 'Mythical',
                emojis: ['🐉', '🐲', '🦄', '🦅', '🦉', '🦚', '🦢', '🕊️', '🦇', '👼', '😇', '👹', '👺', '💀', '☠️', '👻', '👽', '🛸', '🔱', '⚡', '🔥', '💎', '👑', '🗿', '🏛️', '⛩️']
            }
        };

        // Track recent selections (from localStorage)
        this.recentEmojis = this.loadRecentEmojis();

        // Create modal
        this.createModal();
    }

    /**
     * Create the modal structure
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'icon-picker-modal';
        this.modal.innerHTML = `
            <div class="icon-picker-overlay"></div>
            <div class="icon-picker-content">
                <div class="icon-picker-header">
                    <h3 class="icon-picker-title">Choose Icon</h3>
                    <button type="button" class="icon-picker-close" aria-label="Close">&times;</button>
                </div>

                <div class="icon-picker-search">
                    <input type="text"
                           class="icon-picker-search-input"
                           placeholder="Search emojis..."
                           aria-label="Search emojis">
                </div>

                <div class="icon-picker-tabs">
                    ${this.recentEmojis.length > 0 ? '<button type="button" class="icon-picker-tab active" data-category="recent">Recent</button>' : ''}
                    ${Object.keys(this.categories).map((key, index) => {
                        const isActive = this.recentEmojis.length === 0 && index === 0;
                        return `<button type="button" class="icon-picker-tab ${isActive ? 'active' : ''}" data-category="${key}">${this.categories[key].name}</button>`;
                    }).join('')}
                    ${this.allowCustomClass ? '<button type="button" class="icon-picker-tab" data-category="custom">Custom Class</button>' : ''}
                </div>

                <div class="icon-picker-body">
                    ${this.renderCategoryContent()}
                </div>

                <div class="icon-picker-footer">
                    <div class="icon-picker-preview">
                        <span class="icon-picker-preview-label">Selected:</span>
                        <span class="icon-picker-preview-icon">${this.currentIcon || 'None'}</span>
                    </div>
                    <div class="icon-picker-actions">
                        <button type="button" class="icon-picker-btn icon-picker-btn-clear">Clear</button>
                        <button type="button" class="icon-picker-btn icon-picker-btn-primary">Select</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.attachEventListeners();
    }

    /**
     * Render category content
     */
    renderCategoryContent() {
        let content = '';

        // Recent category
        if (this.recentEmojis.length > 0) {
            content += `
                <div class="icon-picker-category active" data-category="recent">
                    <div class="icon-picker-grid">
                        ${this.recentEmojis.map(emoji =>
                            `<button type="button" class="icon-picker-emoji ${emoji === this.currentIcon ? 'selected' : ''}" data-emoji="${emoji}">${emoji}</button>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        // Standard categories
        Object.keys(this.categories).forEach((key, index) => {
            const category = this.categories[key];
            const isActive = this.recentEmojis.length === 0 && index === 0;
            content += `
                <div class="icon-picker-category ${isActive ? 'active' : ''}" data-category="${key}">
                    <div class="icon-picker-grid">
                        ${category.emojis.map(emoji =>
                            `<button type="button" class="icon-picker-emoji ${emoji === this.currentIcon ? 'selected' : ''}" data-emoji="${emoji}">${emoji}</button>`
                        ).join('')}
                    </div>
                </div>
            `;
        });

        // Custom class category
        if (this.allowCustomClass) {
            content += `
                <div class="icon-picker-category" data-category="custom">
                    <div class="icon-picker-custom">
                        <label class="icon-picker-custom-label">
                            Enter custom icon class (e.g., "fas fa-star"):
                        </label>
                        <input type="text"
                               class="icon-picker-custom-input"
                               placeholder="fas fa-star"
                               value="${this.currentIcon && !this.isEmoji(this.currentIcon) ? this.currentIcon : ''}">
                        <small class="icon-picker-custom-hint">
                            Supports Font Awesome, Material Icons, or any custom icon font classes
                        </small>
                    </div>
                </div>
            `;
        }

        return content;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        this.modal.querySelector('.icon-picker-close').addEventListener('click', () => this.hide());

        // Overlay click to close
        this.modal.querySelector('.icon-picker-overlay').addEventListener('click', () => this.hide());

        // Tab switching
        this.modal.querySelectorAll('.icon-picker-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.category));
        });

        // Emoji selection
        this.modal.querySelectorAll('.icon-picker-emoji').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectEmoji(e.target.dataset.emoji));
        });

        // Search
        const searchInput = this.modal.querySelector('.icon-picker-search-input');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Custom class input
        const customInput = this.modal.querySelector('.icon-picker-custom-input');
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                this.currentIcon = e.target.value.trim();
                this.updatePreview();
            });
        }

        // Clear button
        this.modal.querySelector('.icon-picker-btn-clear').addEventListener('click', () => {
            this.currentIcon = '';
            this.updatePreview();
            this.modal.querySelectorAll('.icon-picker-emoji').forEach(btn => btn.classList.remove('selected'));
        });

        // Select button
        this.modal.querySelector('.icon-picker-btn-primary').addEventListener('click', () => {
            if (this.currentIcon) {
                this.addToRecent(this.currentIcon);
            }
            this.onSelect(this.currentIcon);
            this.hide();
        });

        // Keyboard navigation
        this.modal.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * Switch between tabs
     */
    switchTab(category) {
        // Update tab buttons
        this.modal.querySelectorAll('.icon-picker-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        // Update category content
        this.modal.querySelectorAll('.icon-picker-category').forEach(cat => {
            cat.classList.toggle('active', cat.dataset.category === category);
        });
    }

    /**
     * Select an emoji
     */
    selectEmoji(emoji) {
        this.currentIcon = emoji;
        this.updatePreview();

        // Update selected state
        this.modal.querySelectorAll('.icon-picker-emoji').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.emoji === emoji);
        });
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) {
            // Show all emojis
            this.modal.querySelectorAll('.icon-picker-emoji').forEach(btn => {
                btn.style.display = '';
            });
            return;
        }

        // Filter emojis (very basic - just shows all since we can't search emoji meaning easily)
        // In a production app, you'd have emoji metadata to search
        this.modal.querySelectorAll('.icon-picker-emoji').forEach(btn => {
            btn.style.display = '';
        });
    }

    /**
     * Update preview display
     */
    updatePreview() {
        const previewIcon = this.modal.querySelector('.icon-picker-preview-icon');
        if (this.currentIcon) {
            if (this.isEmoji(this.currentIcon)) {
                previewIcon.textContent = this.currentIcon;
                previewIcon.innerHTML = this.currentIcon;
            } else {
                previewIcon.textContent = '';
                previewIcon.innerHTML = `<i class="${this.currentIcon}"></i> ${this.currentIcon}`;
            }
        } else {
            previewIcon.textContent = 'None';
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
        if (e.key === 'Escape') {
            this.hide();
        }
    }

    /**
     * Check if string is an emoji (simple check)
     */
    isEmoji(str) {
        // Simple heuristic: if it's very short and not starting with common icon class prefixes
        return str.length <= 4 && !str.match(/^(fa|fas|far|fal|fab|material-icons|mdi|ion|icon)/);
    }

    /**
     * Load recent emojis from localStorage
     */
    loadRecentEmojis() {
        try {
            const stored = localStorage.getItem('iconPicker_recent');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Add emoji to recent list
     */
    addToRecent(icon) {
        if (!this.isEmoji(icon)) return; // Only store emojis in recent

        let recent = this.loadRecentEmojis();

        // Remove if already exists
        recent = recent.filter(e => e !== icon);

        // Add to front
        recent.unshift(icon);

        // Keep only last 20
        recent = recent.slice(0, 20);

        // Save
        try {
            localStorage.setItem('iconPicker_recent', JSON.stringify(recent));
        } catch (e) {
            // Ignore storage errors
        }

        this.recentEmojis = recent;
    }

    /**
     * Show the modal
     */
    show() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus search input
        const searchInput = this.modal.querySelector('.icon-picker-search-input');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    }

    /**
     * Hide the modal
     */
    hide() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Destroy the modal
     */
    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }
}

// Export globally
window.IconPicker = IconPicker;
