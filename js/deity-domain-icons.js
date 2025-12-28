/**
 * Deity Domain Icon System
 *
 * Provides domain-specific SVG icons for deities across all mythologies.
 * Icons are loaded from /icons/deity-domains/ and mapped to common deity domains.
 */

class DeityDomainIcons {
    constructor() {
        this.iconMap = null;
        this.svgCache = {};
    }

    /**
     * Initialize the domain icon system
     */
    async init() {
        if (this.iconMap) return;

        try {
            const response = await fetch('/icons/deity-domains/deity-domain-icons.json');
            this.iconMap = await response.json();
        } catch (error) {
            console.warn('Failed to load domain icon mapping:', error);
            this.iconMap = {};
        }
    }

    /**
     * Get icon path for a domain
     * @param {string} domain - Domain name (e.g., "war", "wisdom", "love")
     * @returns {string|null} - Path to SVG icon or null if not found
     */
    getIconPath(domain) {
        if (!this.iconMap) return null;

        const normalizedDomain = domain.toLowerCase().trim();
        return this.iconMap[normalizedDomain] || null;
    }

    /**
     * Get primary domain from a list of domains
     * Prioritizes domains that have icons
     * @param {Array<string>} domains - List of domain names
     * @returns {string|null} - Primary domain name or null
     */
    getPrimaryDomain(domains) {
        if (!domains || !domains.length) return null;

        // First, try to find a domain with an icon
        for (const domain of domains) {
            const iconPath = this.getIconPath(domain);
            if (iconPath) return domain;
        }

        // If no domain has an icon, return the first domain
        return domains[0];
    }

    /**
     * Load SVG content from file
     * @param {string} iconPath - Path to SVG file
     * @returns {Promise<string>} - SVG markup
     */
    async loadSVG(iconPath) {
        // Check cache first
        if (this.svgCache[iconPath]) {
            return this.svgCache[iconPath];
        }

        try {
            const response = await fetch('/' + iconPath);
            const svgContent = await response.text();
            this.svgCache[iconPath] = svgContent;
            return svgContent;
        } catch (error) {
            console.warn(`Failed to load SVG: ${iconPath}`, error);
            return null;
        }
    }

    /**
     * Get SVG icon for a domain (returns SVG markup)
     * @param {string} domain - Domain name
     * @returns {Promise<string|null>} - SVG markup or null
     */
    async getIconSVG(domain) {
        const iconPath = this.getIconPath(domain);
        if (!iconPath) return null;

        return await this.loadSVG(iconPath);
    }

    /**
     * Get icon for deity based on their domains
     * Falls back to default deity icon if no domain icon found
     * @param {Object} deity - Deity entity with domains array
     * @returns {Promise<string>} - SVG markup or emoji fallback
     */
    async getDeityIcon(deity) {
        // If deity has a custom icon, use it
        if (deity.visual?.icon || deity.icon) {
            return deity.visual?.icon || deity.icon;
        }

        // Try to get icon from domains
        if (deity.domains && deity.domains.length) {
            const primaryDomain = this.getPrimaryDomain(deity.domains);
            if (primaryDomain) {
                const svg = await this.getIconSVG(primaryDomain);
                if (svg) return svg;
            }
        }

        // Fallback to default deity icon
        return '⚡';
    }

    /**
     * Render domain icons for deity attributes section
     * @param {Array<string>} domains - List of domains
     * @returns {Promise<string>} - HTML markup with domain icons
     */
    async renderDomainIcons(domains) {
        if (!domains || !domains.length) return '';

        const iconPromises = domains.map(async (domain) => {
            const iconPath = this.getIconPath(domain);
            if (!iconPath) {
                return `<span class="domain-badge">${this.escapeHtml(domain)}</span>`;
            }

            const svg = await this.loadSVG(iconPath);
            if (!svg) {
                return `<span class="domain-badge">${this.escapeHtml(domain)}</span>`;
            }

            return `
                <span class="domain-badge" title="${this.escapeHtml(domain)}">
                    <span class="domain-icon" style="width: 1.2em; height: 1.2em; display: inline-block; vertical-align: middle; margin-right: 0.3em;">
                        ${svg}
                    </span>
                    ${this.escapeHtml(domain)}
                </span>
            `;
        });

        const icons = await Promise.all(iconPromises);
        return icons.join(' ');
    }

    /**
     * Get all available domain icons
     * @returns {Object} - Map of domain names to icon paths
     */
    getAllDomains() {
        return this.iconMap || {};
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.deityDomainIcons = new DeityDomainIcons();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.deityDomainIcons.init();
    });
} else {
    window.deityDomainIcons.init();
}
