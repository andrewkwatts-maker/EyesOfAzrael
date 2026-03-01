/**
 * Admin Field Edit Icons
 *
 * Injects small pencil icons next to editable fields on entity pages.
 * Only visible when the current user is an admin (via adminStatusChanged event).
 *
 * Usage: After entity HTML is rendered, call:
 *   AdminFieldEditIcons.inject(container, entity);
 *
 * This scans for elements with [data-editable-field] and appends
 * a clickable pencil icon next to each one.
 */

class AdminFieldEditIcons {
    constructor() {
        this.isAdmin = false;
        this._boundHandleAdminChange = this._handleAdminChange.bind(this);
    }

    init() {
        // Listen for admin status changes
        window.addEventListener('adminStatusChanged', this._boundHandleAdminChange);

        // Check immediately if admin moderation service exists
        if (window.moderationService) {
            window.moderationService.getAdminStatus().then(isAdmin => {
                this.isAdmin = isAdmin;
                if (isAdmin) this._showAllIcons();
            }).catch(() => {});
        }

        console.log('[AdminFieldEditIcons] Initialized');
    }

    _handleAdminChange(e) {
        this.isAdmin = e.detail?.isAdmin || false;
        if (this.isAdmin) {
            this._showAllIcons();
        } else {
            this._hideAllIcons();
        }
    }

    /**
     * Inject edit icons into a rendered entity container
     * Call this AFTER the entity HTML has been set on the container.
     *
     * @param {HTMLElement} container - The entity detail container
     * @param {Object} entity - The entity data object
     */
    inject(container, entity) {
        if (!container || !entity) return;

        const collection = this._getCollectionName(entity.type);

        // Define which fields are editable and their types
        const editableFields = this._getEditableFieldsForType(entity.type, entity);

        editableFields.forEach(field => {
            // Find the target element for this field
            const targets = this._findFieldTargets(container, field, entity);

            targets.forEach(target => {
                // Skip if already has an edit icon
                if (target.querySelector('.admin-field-edit-icon')) return;

                // Make the target relatively positioned if needed
                const style = window.getComputedStyle(target);
                if (style.position === 'static') {
                    target.style.position = 'relative';
                }

                // Create the edit icon
                const icon = document.createElement('button');
                icon.className = 'admin-field-edit-icon';
                icon.setAttribute('aria-label', `Edit ${field.label}`);
                icon.setAttribute('title', `Edit: ${field.label}`);
                icon.dataset.fieldName = field.name;
                icon.dataset.fieldType = field.type;
                icon.dataset.collection = collection;
                icon.dataset.entityId = entity.id;
                icon.dataset.entityName = entity.name || entity.title || entity.id;
                icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;

                // Only show if admin
                if (!this.isAdmin) {
                    icon.style.display = 'none';
                }

                target.appendChild(icon);
            });
        });
    }

    /**
     * Get editable fields based on entity type
     */
    _getEditableFieldsForType(type, entity) {
        // Only include fields the entity actually has
        const fields = [];

        if (entity.description !== undefined) {
            fields.push({ name: 'description', label: 'Description', type: 'string', sectionMatch: 'hero-section' });
        }
        if (entity.subtitle !== undefined) {
            fields.push({ name: 'subtitle', label: 'Subtitle', type: 'string', sectionMatch: 'hero-section' });
        }
        if (entity.fullDescription !== undefined) {
            fields.push({ name: 'fullDescription', label: 'Full Description', type: 'string', sectionMatch: 'description' });
        }
        if (entity.overview !== undefined) {
            fields.push({ name: 'overview', label: 'Overview', type: 'string', sectionMatch: 'overview' });
        }
        if (entity.appearance !== undefined) {
            fields.push({ name: 'appearance', label: 'Appearance', type: 'string', headerMatch: 'Appearance' });
        }
        if (entity.behavior !== undefined) {
            fields.push({ name: 'behavior', label: 'Behavior', type: 'string', headerMatch: 'Behavior' });
        }
        if (entity.habitat !== undefined) {
            fields.push({ name: 'habitat', label: 'Habitat', type: 'string', headerMatch: 'Habitat' });
        }
        if (entity.worship !== undefined) {
            fields.push({ name: 'worship', label: 'Worship', type: 'string', headerMatch: 'Worship' });
        }
        if (entity.content !== undefined) {
            fields.push({ name: 'content', label: 'Content', type: 'string', headerMatch: 'Content' });
        }
        if (entity.keyMyths?.length) {
            fields.push({ name: 'keyMyths', label: 'Key Myths', type: 'keyMyths', headerMatch: 'Key Myths' });
        }
        if (entity.extendedContent?.length) {
            fields.push({ name: 'extendedContent', label: 'Extended Content', type: 'extendedContent', headerMatch: 'Extended' });
        }
        if (entity.sources?.length) {
            fields.push({ name: 'sources', label: 'Sources', type: 'sources', headerMatch: 'Source' });
        }

        return fields;
    }

    /**
     * Find the DOM element(s) that correspond to a given field
     */
    _findFieldTargets(container, field, entity) {
        const targets = [];

        // Strategy 1: Match by section header text
        if (field.headerMatch) {
            const headers = container.querySelectorAll('h2, h3');
            headers.forEach(h => {
                if (h.textContent.includes(field.headerMatch)) {
                    // Use the parent section element
                    const section = h.closest('section') || h.parentElement;
                    if (section) targets.push(section);
                }
            });
        }

        // Strategy 2: Match by section class
        if (field.sectionMatch && targets.length === 0) {
            const sections = container.querySelectorAll(`.${field.sectionMatch}, [class*="${field.sectionMatch}"]`);
            sections.forEach(s => targets.push(s));
        }

        // Strategy 3: For description/subtitle, target the hero section
        if (targets.length === 0 && (field.name === 'description' || field.name === 'subtitle')) {
            const hero = container.querySelector('.hero-section, section:first-of-type');
            if (hero) targets.push(hero);
        }

        return targets;
    }

    /**
     * Show all edit icons (admin logged in)
     */
    _showAllIcons() {
        document.querySelectorAll('.admin-field-edit-icon').forEach(icon => {
            icon.style.display = '';
        });
    }

    /**
     * Hide all edit icons (not admin)
     */
    _hideAllIcons() {
        document.querySelectorAll('.admin-field-edit-icon').forEach(icon => {
            icon.style.display = 'none';
        });
    }

    /**
     * Get Firestore collection name from entity type
     */
    _getCollectionName(type) {
        const map = {
            'deity': 'deities', 'hero': 'heroes', 'creature': 'creatures',
            'item': 'items', 'place': 'places', 'concept': 'concepts',
            'magic': 'magic', 'ritual': 'rituals', 'text': 'texts',
            'archetype': 'archetypes', 'symbol': 'symbols', 'herb': 'herbs',
            'cosmology': 'cosmology', 'event': 'events'
        };
        return map[type] || type;
    }
}

// Auto-initialize
(function() {
    function initFieldEditIcons() {
        if (window._adminFieldEditIcons) return;
        window._adminFieldEditIcons = new AdminFieldEditIcons();
        window._adminFieldEditIcons.init();

        // Public API
        window.AdminFieldEditIcons = {
            inject: (container, entity) => window._adminFieldEditIcons.inject(container, entity),
            isAdmin: () => window._adminFieldEditIcons.isAdmin
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFieldEditIcons);
    } else {
        initFieldEditIcons();
    }
})();
