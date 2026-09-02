/**
 * DomainTabs
 *
 * Top-level switcher between the four datasets — mythology, esoteric, history
 * and conspiracy. Everything below the tab is the same interface operating on a
 * different dataset; the tab only changes which collections are in scope.
 *
 * Two deliberate properties:
 *
 * 1. **No router changes.** Routes are already `#/browse/{collection}`, and
 *    prefixing makes collection names globally unique, so `#/browse/hist_figures`
 *    is unambiguous without a domain segment. The active domain is *derived* from
 *    the route rather than tracked beside it, so the two can never disagree —
 *    including when a reader follows a cross-domain link straight into a
 *    different dataset, which simply lights up that dataset's tab.
 *
 * 2. **Tabs appear when their data does.** A domain with nothing in the manifest
 *    is not rendered, so this ships today showing mythology and esoteric, and
 *    history and conspiracy appear on their own once their seeds are promoted and
 *    the base is re-exported. An empty tab that leads to a blank page is worse
 *    than no tab.
 *
 * Usage:
 *   const tabs = new DomainTabs();
 *   await tabs.mount(document.getElementById('domain-tabs'));
 */

class DomainTabs {
    constructor(options = {}) {
        this.registry = options.registry
            || (typeof window !== 'undefined' ? window.DOMAINS : null);
        this.loader = options.loader
            || (typeof window !== 'undefined' ? window.entityBaseLoader : null);
        this.container = null;
        this._available = null;
    }

    /**
     * Domains that have at least one collection in the static base.
     *
     * Falls back to the default domain alone if the manifest cannot be read —
     * showing one working tab beats showing four, three of which lead nowhere.
     *
     * @returns {Promise<object[]>}
     */
    async getAvailableDomains() {
        if (this._available) return this._available;
        if (!this.registry) return [];

        let manifest = null;
        try {
            if (this.loader) manifest = await this.loader.getManifest();
        } catch (err) {
            console.warn('[DomainTabs] Manifest unavailable, showing default domain only:', err.message);
        }

        if (!manifest || !manifest.collections) {
            this._available = [this.registry.default()].filter(Boolean);
            return this._available;
        }

        const present = new Set(Object.keys(manifest.collections));
        this._available = this.registry.list().filter(domain =>
            domain.collections.some(c => present.has(c))
        );

        // The manifest existing but matching no registered domain means the two
        // have drifted apart. Rendering nothing would remove all navigation, so
        // fall back rather than leave the user stranded.
        if (this._available.length === 0) {
            console.warn('[DomainTabs] No registered domain matches the manifest; falling back to default.');
            this._available = [this.registry.default()].filter(Boolean);
        }

        return this._available;
    }

    /**
     * Which domain the current route belongs to, derived from its collection.
     *
     * @param {string} [hash] defaults to the live location hash
     * @returns {object|null} the domain, or the default when the route names no collection
     */
    activeDomain(hash) {
        if (!this.registry) return null;

        const raw = hash !== undefined
            ? hash
            : (typeof window !== 'undefined' ? window.location.hash : '');

        // #/browse/{collection} and #/browse/{collection}/{filter}
        const match = String(raw || '').match(/^#?\/browse\/([^/]+)/);
        if (match) {
            const domain = this.registry.domainForCollection(decodeURIComponent(match[1]));
            if (domain) return domain;
        }

        return this.registry.default();
    }

    /** Where a tab points: the domain's first collection that actually has data. */
    async routeForDomain(domain) {
        if (!domain || !domain.collections.length) return '#/';

        let present = null;
        try {
            const manifest = this.loader ? await this.loader.getManifest() : null;
            if (manifest && manifest.collections) present = new Set(Object.keys(manifest.collections));
        } catch (_) {
            // Fall through to the first declared collection.
        }

        const target = present
            ? (domain.collections.find(c => present.has(c)) || domain.collections[0])
            : domain.collections[0];

        return `#/browse/${target}`;
    }

    // ── rendering ────────────────────────────────────────────────────────────

    async render() {
        const domains = await this.getAvailableDomains();

        // One dataset is not a choice; rendering a single tab is visual noise.
        if (domains.length < 2) return '';

        const active = this.activeDomain();
        const routes = await Promise.all(domains.map(d => this.routeForDomain(d)));

        const tabs = domains.map((domain, i) => {
            const isActive = active && domain.id === active.id;
            return `
                <a class="domain-tab${isActive ? ' domain-tab--active' : ''}"
                   href="${routes[i]}"
                   role="tab"
                   id="domain-tab-${this._escape(domain.id)}"
                   aria-selected="${isActive ? 'true' : 'false'}"
                   ${isActive ? '' : 'tabindex="-1"'}
                   title="${this._escape(domain.blurb || domain.label)}">
                    <span class="domain-tab__label">${this._escape(domain.label)}</span>
                </a>`;
        }).join('');

        return `<nav class="domain-tabs" role="tablist" aria-label="Dataset">${tabs}</nav>`;
    }

    async mount(container) {
        if (!container) return false;
        this.container = container;

        const html = await this.render();
        container.innerHTML = html;
        if (!html) return false;

        this._bindKeyboard(container);

        if (typeof window !== 'undefined') {
            // Re-render on navigation so the highlight follows cross-domain links.
            this._onHashChange = () => this.refresh();
            window.addEventListener('hashchange', this._onHashChange);
        }
        return true;
    }

    /** Re-render in place, e.g. after navigation. */
    async refresh() {
        if (!this.container) return;
        this.container.innerHTML = await this.render();
        this._bindKeyboard(this.container);
    }

    destroy() {
        if (typeof window !== 'undefined' && this._onHashChange) {
            window.removeEventListener('hashchange', this._onHashChange);
            this._onHashChange = null;
        }
        this.container = null;
    }

    /**
     * Arrow-key movement between tabs, as the tablist role implies. Without this
     * a keyboard user must tab through every tab to reach the last one, and
     * `tabindex="-1"` on inactive tabs would make them unreachable entirely.
     */
    _bindKeyboard(container) {
        const tabs = Array.from(container.querySelectorAll('.domain-tab'));
        if (!tabs.length) return;

        container.addEventListener('keydown', (e) => {
            const current = tabs.indexOf(document.activeElement);
            if (current === -1) return;

            let next = null;
            if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
            else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
            else if (e.key === 'Home') next = 0;
            else if (e.key === 'End') next = tabs.length - 1;
            if (next === null) return;

            e.preventDefault();
            tabs[next].focus();
        });
    }

    _escape(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /** Drop the cached availability so the next render re-reads the manifest. */
    invalidate() {
        this._available = null;
    }
}

if (typeof window !== 'undefined') {
    window.DomainTabs = DomainTabs;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DomainTabs;
}
