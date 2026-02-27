/**
 * Debug Data Panel
 * Shows a right-hand side column with the current page's Firebase data.
 * Activated via the admin menu. Displays expandable JSON for the main
 * entity and any sub-assets (related entities, sections, etc.).
 *
 * Toggle: window.DebugDataPanel.toggle()
 */

class DebugDataPanel {
    constructor() {
        this.isActive = false;
        this.panelEl = null;
        this.currentData = null;
        this.currentRoute = null;
        this.db = null;
    }

    /**
     * Initialize the debug panel - create DOM, bind events
     */
    init() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            this.db = firebase.firestore();
        }

        this._createPanel();
        this._bindEvents();
        this._injectAdminToggle();

        // Restore state from session
        if (sessionStorage.getItem('eoa_debug_mode') === 'true') {
            this.activate();
        }

        console.log('[DebugDataPanel] Initialized');
    }

    /**
     * Create the panel DOM structure
     */
    _createPanel() {
        const panel = document.createElement('div');
        panel.className = 'debug-data-panel';
        panel.id = 'debugDataPanel';
        panel.innerHTML = `
            <div class="debug-panel-header">
                <h3>Debug Inspector</h3>
                <button class="debug-panel-close" id="debugPanelClose" title="Close debug panel">ESC</button>
            </div>
            <div class="debug-route-info">
                <div class="debug-route-label">Current Route</div>
                <div class="debug-route-path" id="debugRoutePath">—</div>
            </div>
            <div class="debug-panel-content" id="debugPanelContent">
                <div class="debug-empty-state">Navigate to a page to inspect its data</div>
            </div>
            <div class="debug-panel-footer">
                <span id="debugTimestamp">—</span>
                <button id="debugCopyAll" title="Copy all data as JSON">Copy JSON</button>
            </div>
        `;
        document.body.appendChild(panel);
        this.panelEl = panel;
    }

    /**
     * Bind navigation and UI events
     */
    _bindEvents() {
        // Close button
        document.getElementById('debugPanelClose').addEventListener('click', () => this.deactivate());

        // Copy button
        document.getElementById('debugCopyAll').addEventListener('click', () => this._copyAllData());

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.deactivate();
            }
        });

        // Listen for navigation completion to refresh data
        document.addEventListener('first-render-complete', (e) => {
            if (this.isActive) {
                setTimeout(() => this._refreshData(), 100);
            }
        });

        document.addEventListener('navigation-complete', (e) => {
            if (this.isActive) {
                setTimeout(() => this._refreshData(), 200);
            }
        });

        // Also listen for hashchange as a fallback
        window.addEventListener('hashchange', () => {
            if (this.isActive) {
                setTimeout(() => this._refreshData(), 500);
            }
        });
    }

    /**
     * Inject a toggle button into the admin area (header actions)
     * Uses the same pattern as AdminModerationPanel
     */
    _injectAdminToggle() {
        // Wait for admin status, then show the button
        window.addEventListener('adminStatusChanged', (e) => {
            if (e.detail && e.detail.isAdmin) {
                this._showToggleButton();
            }
        });

        // Also check immediately if admin moderation service exists
        if (window.moderationService) {
            window.moderationService.getAdminStatus().then(isAdmin => {
                if (isAdmin) this._showToggleButton();
            }).catch(() => {});
        }
    }

    _showToggleButton() {
        if (document.getElementById('debugToggleBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'debugToggleBtn';
        btn.className = 'debug-toggle-btn';
        btn.setAttribute('aria-label', 'Toggle debug data panel');
        btn.setAttribute('title', 'Debug Inspector');
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="M12 16v.01M12 8v4"/>
        </svg><span>Debug</span>`;
        btn.addEventListener('click', () => this.toggle());

        if (this.isActive) btn.classList.add('active');

        // Insert into header actions, before the hamburger menu button
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            const extendedMenuBtn = document.getElementById('extendedMenuBtn');
            if (extendedMenuBtn) {
                headerActions.insertBefore(btn, extendedMenuBtn);
            } else {
                headerActions.appendChild(btn);
            }
        }
    }

    /**
     * Toggle debug mode on/off
     */
    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    /**
     * Activate debug mode
     */
    activate() {
        this.isActive = true;
        document.body.classList.add('debug-mode-active');
        sessionStorage.setItem('eoa_debug_mode', 'true');
        const btn = document.getElementById('debugToggleBtn');
        if (btn) btn.classList.add('active');
        this._refreshData();
    }

    /**
     * Deactivate debug mode
     */
    deactivate() {
        this.isActive = false;
        document.body.classList.remove('debug-mode-active');
        sessionStorage.setItem('eoa_debug_mode', 'false');
        const btn = document.getElementById('debugToggleBtn');
        if (btn) btn.classList.remove('active');
    }

    /**
     * Refresh data based on current route
     */
    async _refreshData() {
        const hash = window.location.hash || '#/';
        const path = hash.replace('#', '');
        this.currentRoute = path;

        document.getElementById('debugRoutePath').textContent = path || '/';
        document.getElementById('debugTimestamp').textContent =
            'Updated ' + new Date().toLocaleTimeString();

        const contentEl = document.getElementById('debugPanelContent');
        contentEl.innerHTML = '<div class="debug-empty-state">Loading data...</div>';

        try {
            const pageData = await this._resolvePageData(path);
            this.currentData = pageData;
            this._renderSections(pageData, contentEl);
        } catch (err) {
            console.error('[DebugDataPanel] Error loading data:', err);
            contentEl.innerHTML = `<div class="debug-empty-state">Error: ${err.message}</div>`;
        }
    }

    /**
     * Resolve what Firebase data corresponds to the current route
     * Returns an object with labeled sections of data
     */
    async _resolvePageData(path) {
        const sections = {};

        // Home page
        if (!path || path === '/' || path === '') {
            sections['Page Info'] = { route: '/', type: 'home', description: 'Landing page view' };

            // Try to load the pages/home document
            if (this.db) {
                try {
                    const doc = await this.db.collection('pages').doc('home').get();
                    if (doc.exists) {
                        sections['pages/home (Firebase)'] = { id: doc.id, ...doc.data() };
                    } else {
                        sections['pages/home (Firebase)'] = { _note: 'Document does not exist - using static LandingPageView' };
                    }
                } catch (e) {
                    sections['pages/home (Firebase)'] = { _error: e.message };
                }
            }
            return sections;
        }

        // Mythologies list
        const mythologiesMatch = path.match(/^\/?mythologies\/?$/);
        if (mythologiesMatch) {
            sections['Page Info'] = { route: path, type: 'mythologies-list' };
            if (this.db) {
                try {
                    const snap = await this.db.collection('mythologies').orderBy('order').get();
                    const items = [];
                    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
                    sections[`mythologies (${items.length} docs)`] = items;
                } catch (e) {
                    sections['mythologies'] = { _error: e.message };
                }
            }
            return sections;
        }

        // Single mythology page: /mythology/:name
        const mythologyMatch = path.match(/^\/?mythology\/([^\/]+)\/?$/);
        if (mythologyMatch) {
            const mythName = mythologyMatch[1];
            sections['Page Info'] = { route: path, type: 'mythology-detail', mythology: mythName };
            if (this.db) {
                try {
                    const doc = await this.db.collection('mythologies').doc(mythName).get();
                    if (doc.exists) {
                        sections[`mythologies/${mythName}`] = { id: doc.id, ...doc.data() };
                    } else {
                        sections[`mythologies/${mythName}`] = { _note: 'Document not found' };
                    }
                } catch (e) {
                    sections[`mythologies/${mythName}`] = { _error: e.message };
                }
            }
            return sections;
        }

        // Browse category: /browse/:category or /browse/:category/:mythology
        const browseMatch = path.match(/^\/?browse\/([^\/]+)(?:\/([^\/]+))?\/?$/);
        if (browseMatch) {
            const category = browseMatch[1];
            const mythology = browseMatch[2];
            sections['Page Info'] = { route: path, type: 'browse-category', category, mythology: mythology || 'all' };

            if (this.db) {
                try {
                    let query = this.db.collection(category);
                    if (mythology) {
                        query = query.where('mythology', '==', mythology);
                    }
                    const snap = await query.limit(50).get();
                    const items = [];
                    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
                    sections[`${category} (${items.length} shown, limit 50)`] = items;
                } catch (e) {
                    sections[category] = { _error: e.message };
                }
            }
            return sections;
        }

        // Entity pages - multiple URL formats
        // #/entity/collection/id
        const entitySimple = path.match(/^\/?entity\/([^\/]+)\/([^\/]+)\/?$/);
        // #/mythology/myth/collection/id
        const entityFull = path.match(/^\/?mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/);
        // #/entity/collection/mythology/id
        const entityAlt = path.match(/^\/?entity\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/);

        let collection, entityId, mythology;

        if (entityFull) {
            mythology = entityFull[1];
            collection = entityFull[2];
            entityId = entityFull[3];
        } else if (entitySimple) {
            collection = entitySimple[1];
            entityId = entitySimple[2];
        } else if (entityAlt) {
            collection = entityAlt[1];
            mythology = entityAlt[2];
            entityId = entityAlt[3];
        }

        if (collection && entityId) {
            // Normalize collection name (singular -> plural)
            const collectionName = this._pluralize(collection);
            sections['Page Info'] = {
                route: path,
                type: 'entity-detail',
                collection: collectionName,
                entityId,
                mythology: mythology || 'auto-detected'
            };

            if (this.db) {
                // Fetch main entity
                try {
                    const doc = await this.db.collection(collectionName).doc(entityId).get();
                    if (doc.exists) {
                        const data = { id: doc.id, ...doc.data() };
                        sections[`${collectionName}/${entityId}`] = data;

                        // Extract and fetch related sub-assets
                        await this._fetchSubAssets(data, sections);
                    } else {
                        sections[`${collectionName}/${entityId}`] = { _note: 'Document not found' };
                    }
                } catch (e) {
                    sections[`${collectionName}/${entityId}`] = { _error: e.message };
                }
            }
            return sections;
        }

        // Category page: /mythology/:myth/:category
        const categoryMatch = path.match(/^\/?mythology\/([^\/]+)\/([^\/]+)\/?$/);
        if (categoryMatch) {
            mythology = categoryMatch[1];
            const cat = categoryMatch[2];
            sections['Page Info'] = { route: path, type: 'category-list', mythology, category: cat };
            if (this.db) {
                try {
                    const snap = await this.db.collection(cat).where('mythology', '==', mythology).limit(50).get();
                    const items = [];
                    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
                    sections[`${cat} (${items.length} shown, limit 50)`] = items;
                } catch (e) {
                    sections[cat] = { _error: e.message };
                }
            }
            return sections;
        }

        // Fallback for other routes
        sections['Page Info'] = { route: path, type: 'unknown', _note: 'Route not matched for data extraction' };
        return sections;
    }

    /**
     * Look through entity data for references to other entities and fetch them
     */
    async _fetchSubAssets(entityData, sections) {
        if (!this.db || !entityData) return;

        const relatedFields = [
            { key: 'relatedEntities', label: 'Related Entities' },
            { key: 'related_entities', label: 'Related Entities' },
            { key: 'relationships', label: 'Relationships' },
            { key: 'children', label: 'Children' },
            { key: 'parents', label: 'Parents' },
            { key: 'siblings', label: 'Siblings' },
            { key: 'allies', label: 'Allies' },
            { key: 'enemies', label: 'Enemies' },
            { key: 'associated_deities', label: 'Associated Deities' },
            { key: 'associatedDeities', label: 'Associated Deities' },
            { key: 'guardians', label: 'Guardians' },
            { key: 'inhabitants', label: 'Inhabitants' },
            { key: 'connectedPlaces', label: 'Connected Places' },
            { key: 'connected_places', label: 'Connected Places' },
            { key: 'sacredItems', label: 'Sacred Items' },
            { key: 'sacred_items', label: 'Sacred Items' },
        ];

        for (const field of relatedFields) {
            const value = entityData[field.key];
            if (!value) continue;

            // If it's an array of references (strings or objects with id/collection)
            if (Array.isArray(value) && value.length > 0) {
                const resolved = [];
                for (const ref of value.slice(0, 10)) { // limit to 10 sub-fetches
                    if (typeof ref === 'string') {
                        resolved.push({ _ref: ref });
                    } else if (ref && typeof ref === 'object') {
                        // Already have the data inline
                        resolved.push(ref);
                    }
                }
                if (resolved.length > 0) {
                    sections[`Sub: ${field.label} (${value.length})`] = resolved;
                }
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                sections[`Sub: ${field.label}`] = value;
            }
        }
    }

    /**
     * Render data sections into the panel
     */
    _renderSections(pageData, container) {
        if (!pageData || Object.keys(pageData).length === 0) {
            container.innerHTML = '<div class="debug-empty-state">No data found for this route</div>';
            return;
        }

        container.innerHTML = '';

        for (const [sectionName, sectionData] of Object.entries(pageData)) {
            const section = document.createElement('div');
            section.className = 'debug-section';

            const isPageInfo = sectionName === 'Page Info';
            if (isPageInfo) section.classList.add('expanded');

            // Count keys/items for badge
            let badge = '';
            if (Array.isArray(sectionData)) {
                badge = `${sectionData.length} items`;
            } else if (sectionData && typeof sectionData === 'object') {
                badge = `${Object.keys(sectionData).length} keys`;
            }

            section.innerHTML = `
                <div class="debug-section-header">
                    <span class="debug-section-title">
                        <span class="debug-section-toggle">\u25B6</span>
                        ${this._escapeHtml(sectionName)}
                    </span>
                    ${badge ? `<span class="debug-section-badge">${badge}</span>` : ''}
                </div>
                <div class="debug-section-body"></div>
            `;

            const body = section.querySelector('.debug-section-body');
            const tree = this._buildJsonTree(sectionData, isPageInfo ? 2 : 0);
            body.appendChild(tree);

            // Toggle expand/collapse
            section.querySelector('.debug-section-header').addEventListener('click', () => {
                section.classList.toggle('expanded');
            });

            container.appendChild(section);
        }
    }

    /**
     * Build an expandable JSON tree DOM element
     * @param {*} data - The data to render
     * @param {number} expandDepth - How many levels deep to auto-expand (0 = collapsed)
     * @param {number} currentDepth - Internal tracking
     * @returns {HTMLElement}
     */
    _buildJsonTree(data, expandDepth = 0, currentDepth = 0) {
        const container = document.createElement('div');
        container.className = 'json-tree';

        if (data === null || data === undefined) {
            container.innerHTML = '<span class="json-null">null</span>';
            return container;
        }

        if (typeof data !== 'object') {
            container.appendChild(this._renderPrimitive(data));
            return container;
        }

        const entries = Array.isArray(data)
            ? data.map((v, i) => [i, v])
            : Object.entries(data);

        if (entries.length === 0) {
            container.innerHTML = `<span class="json-null">${Array.isArray(data) ? '[]' : '{}'}</span>`;
            return container;
        }

        for (const [key, value] of entries) {
            const item = document.createElement('div');
            item.className = 'json-tree-item';

            if (value !== null && typeof value === 'object') {
                // Expandable node
                const isAutoExpanded = currentDepth < expandDepth;
                const childCount = Array.isArray(value) ? value.length : Object.keys(value).length;
                const typeHint = Array.isArray(value) ? `[${childCount}]` : `{${childCount}}`;

                const toggle = document.createElement('span');
                toggle.className = 'json-toggle' + (isAutoExpanded ? ' expanded' : '');
                toggle.textContent = '\u25B6';

                const keySpan = document.createElement('span');
                keySpan.className = 'json-key-expandable';
                if (Array.isArray(data)) {
                    keySpan.innerHTML = `<span class="json-array-index">[${key}]</span>`;
                } else {
                    keySpan.textContent = key;
                }

                const hint = document.createElement('span');
                hint.className = 'json-type-hint';
                hint.textContent = ' ' + typeHint;

                const children = document.createElement('div');
                children.className = 'json-children' + (isAutoExpanded ? ' expanded' : '');

                // Build children lazily for collapsed nodes to improve performance
                let childrenBuilt = isAutoExpanded;
                if (isAutoExpanded) {
                    const childTree = this._buildJsonTree(value, expandDepth, currentDepth + 1);
                    children.appendChild(childTree);
                }

                const toggleExpand = () => {
                    const expanding = !children.classList.contains('expanded');
                    children.classList.toggle('expanded');
                    toggle.classList.toggle('expanded');

                    // Lazy build on first expand
                    if (expanding && !childrenBuilt) {
                        const childTree = this._buildJsonTree(value, 0, currentDepth + 1);
                        children.appendChild(childTree);
                        childrenBuilt = true;
                    }
                };

                toggle.addEventListener('click', toggleExpand);
                keySpan.addEventListener('click', toggleExpand);

                item.appendChild(toggle);
                item.appendChild(keySpan);
                item.appendChild(document.createTextNode(': '));
                item.appendChild(hint);
                item.appendChild(children);
            } else {
                // Leaf node
                const keySpan = document.createElement('span');
                keySpan.className = 'json-key';
                if (Array.isArray(data)) {
                    keySpan.innerHTML = `<span class="json-array-index">[${key}]</span>`;
                } else {
                    keySpan.textContent = key;
                }

                item.appendChild(document.createTextNode('  ')); // spacer for alignment
                item.appendChild(keySpan);
                item.appendChild(document.createTextNode(': '));
                item.appendChild(this._renderPrimitive(value));
            }

            container.appendChild(item);
        }

        return container;
    }

    /**
     * Render a primitive value with syntax coloring
     */
    _renderPrimitive(value) {
        const span = document.createElement('span');
        if (value === null || value === undefined) {
            span.className = 'json-null';
            span.textContent = 'null';
        } else if (typeof value === 'string') {
            span.className = 'json-string';
            // Truncate long strings in display
            const display = value.length > 120 ? value.substring(0, 120) + '...' : value;
            span.textContent = `"${display}"`;
            if (value.length > 120) {
                span.title = value;
                span.style.cursor = 'help';
            }
        } else if (typeof value === 'number') {
            span.className = 'json-number';
            span.textContent = String(value);
        } else if (typeof value === 'boolean') {
            span.className = 'json-boolean';
            span.textContent = String(value);
        } else {
            span.textContent = String(value);
        }
        return span;
    }

    /**
     * Pluralize a collection name (singular -> plural)
     */
    _pluralize(name) {
        const mapping = {
            deity: 'deities', hero: 'heroes', creature: 'creatures',
            item: 'items', place: 'places', concept: 'concepts',
            magic: 'magic', theory: 'theories', ritual: 'rituals',
            text: 'texts', archetype: 'archetypes', symbol: 'symbols',
            herb: 'herbs', mythology: 'mythologies', being: 'beings',
            event: 'events', cosmology: 'cosmology',
        };
        const lower = name.toLowerCase();
        return mapping[lower] || lower;
    }

    /**
     * Copy all current data as formatted JSON
     */
    _copyAllData() {
        if (!this.currentData) return;
        const json = JSON.stringify(this.currentData, null, 2);
        navigator.clipboard.writeText(json).then(() => {
            const btn = document.getElementById('debugCopyAll');
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = original, 1500);
        }).catch(err => {
            console.error('[DebugDataPanel] Copy failed:', err);
        });
    }

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Auto-initialize
(function() {
    function initDebugPanel() {
        if (window._debugDataPanel) return;
        window._debugDataPanel = new DebugDataPanel();
        window._debugDataPanel.init();

        // Public API
        window.DebugDataPanel = {
            toggle: () => window._debugDataPanel.toggle(),
            activate: () => window._debugDataPanel.activate(),
            deactivate: () => window._debugDataPanel.deactivate(),
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebugPanel);
    } else {
        initDebugPanel();
    }
})();
