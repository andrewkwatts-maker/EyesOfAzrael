/**
 * MYTHOLOGY NAVIGATION COMPONENT
 * Handles base/advanced mythology navigation
 * Supports nested mythology structures (e.g., Jewish -> Kabbalah, Christian -> Gnostic)
 */

class MythologyNav {
    /**
     * Creates a "Back to Base Mythology" navigation element
     * @param {Object} config - Configuration object
     * @param {string} config.baseUrl - URL to base mythology (e.g., '../index.html')
     * @param {string} config.baseName - Display name of base mythology (e.g., 'Judaism')
     * @param {string} config.baseIcon - Icon for base mythology (e.g., '✡️')
     * @param {string} config.advancedName - Display name of advanced section (e.g., 'Kabbalah')
     * @returns {HTMLElement} The back link element
     */
    static createBackLink(config) {
        const {
            baseUrl,
            baseName,
            baseIcon = '←',
            advancedName
        } = config;

        // Create container
        const container = document.createElement('div');
        container.className = 'mythology-back-link';
        container.innerHTML = `
            <a href="${baseUrl}" class="back-to-base">
                <span class="back-icon">${baseIcon}</span>
                <div class="back-content">
                    <span class="back-label">Return to General</span>
                    <span class="back-name">${baseName}</span>
                </div>
            </a>
            <div class="current-section">
                <span class="section-badge">Advanced Study</span>
                <span class="section-name">${advancedName}</span>
            </div>
        `;

        return container;
    }

    /**
     * Creates an "Explore Advanced Section" card
     * @param {Object} config - Configuration object
     * @param {string} config.advancedUrl - URL to advanced section (e.g., 'kabbalah/index.html')
     * @param {string} config.advancedName - Display name of advanced section (e.g., 'Kabbalah')
     * @param {string} config.advancedIcon - Icon for advanced section (e.g., '🔯')
     * @param {string} config.description - Description of advanced section
     * @param {string} config.buttonText - Button text (default: 'Explore')
     * @param {Array<string>} config.highlights - Array of key highlights to display
     * @returns {HTMLElement} The advanced section card
     */
    static createAdvancedCard(config) {
        const {
            advancedUrl,
            advancedName,
            advancedIcon,
            description,
            buttonText = `Explore ${advancedName}`,
            highlights = []
        } = config;

        // Create container
        const container = document.createElement('div');
        container.className = 'mythology-advanced-card';

        // Build highlights HTML if provided
        let highlightsHtml = '';
        if (highlights.length > 0) {
            highlightsHtml = `
                <div class="advanced-highlights">
                    ${highlights.map(h => `<div class="highlight-item">✦ ${h}</div>`).join('')}
                </div>
            `;
        }

        container.innerHTML = `
            <div class="advanced-badge">
                <span class="badge-icon">🔐</span>
                <span class="badge-text">Advanced Esoteric Study</span>
            </div>
            <div class="advanced-header">
                <span class="advanced-icon">${advancedIcon}</span>
                <h3 class="advanced-title">${advancedName}</h3>
            </div>
            <p class="advanced-description">${description}</p>
            ${highlightsHtml}
            <a href="${advancedUrl}" class="advanced-button">
                ${buttonText} <span class="button-arrow">→</span>
            </a>
        `;

        return container;
    }

    /**
     * Injects a back link into the page (typically after breadcrumb)
     * @param {Object} config - Configuration for createBackLink
     * @param {string} selector - CSS selector where to inject (default: after breadcrumb)
     */
    static injectBackLink(config, selector = '.breadcrumb') {
        const targetElement = document.querySelector(selector);
        if (!targetElement) {
            console.warn('[MythologyNav] Target element not found:', selector);
            return;
        }

        const backLink = this.createBackLink(config);
        targetElement.insertAdjacentElement('afterend', backLink);
    }

    /**
     * Injects an advanced section card into the page
     * @param {Object} config - Configuration for createAdvancedCard
     * @param {string} selector - CSS selector where to inject
     * @param {string} position - Insert position (beforeend, afterbegin, etc.)
     */
    static injectAdvancedCard(config, selector = 'main', position = 'beforeend') {
        const targetElement = document.querySelector(selector);
        if (!targetElement) {
            console.warn('[MythologyNav] Target element not found:', selector);
            return;
        }

        const advancedCard = this.createAdvancedCard(config);
        targetElement.insertAdjacentElement(position, advancedCard);
    }

    /**
     * Automatically initializes navigation based on data attributes
     * Add data-mythology-nav="back" or "advanced" to elements
     */
    static autoInit() {
        // Look for back link markers
        const backElements = document.querySelectorAll('[data-mythology-nav="back"]');
        backElements.forEach(el => {
            const config = {
                baseUrl: el.dataset.baseUrl,
                baseName: el.dataset.baseName,
                baseIcon: el.dataset.baseIcon,
                advancedName: el.dataset.advancedName
            };
            const backLink = this.createBackLink(config);
            el.replaceWith(backLink);
        });

        // Look for advanced card markers
        const advancedElements = document.querySelectorAll('[data-mythology-nav="advanced"]');
        advancedElements.forEach(el => {
            const config = {
                advancedUrl: el.dataset.advancedUrl,
                advancedName: el.dataset.advancedName,
                advancedIcon: el.dataset.advancedIcon,
                description: el.dataset.description,
                buttonText: el.dataset.buttonText,
                highlights: el.dataset.highlights ? JSON.parse(el.dataset.highlights) : []
            };
            const advancedCard = this.createAdvancedCard(config);
            el.replaceWith(advancedCard);
        });
    }
}

// Auto-initialize on DOM load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        MythologyNav.autoInit();
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MythologyNav;
}

// Global window export
if (typeof window !== 'undefined') {
    window.MythologyNav = MythologyNav;
}
