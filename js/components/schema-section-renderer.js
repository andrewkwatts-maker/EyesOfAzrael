/**
 * Schema Section Renderer
 *
 * Comprehensive renderer for all schema sections in entity assets.
 * Handles: extendedContent, keyMyths, relatedEntities (nested objects),
 * tables, SVG icons, tags, sources, corpus search, and more.
 */
class SchemaSectionRenderer {
    constructor(options = {}) {
        this.mythology = options.mythology || '';
        this.entityType = options.entityType || '';
        this.baseUrl = options.baseUrl || '';
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

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_]/g, ' ');
    }

    /**
     * Format field name for display
     */
    formatFieldName(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/[-_]/g, ' ')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    // ==========================================
    // ICON RENDERING
    // ==========================================

    /**
     * Render SVG icon from string or URL
     */
    renderIcon(icon, fallback = '✨', size = '64px') {
        if (!icon) return `<span class="icon-fallback" style="font-size: ${size};">${fallback}</span>`;

        // Inline SVG
        if (typeof icon === 'string' && icon.trim().startsWith('<svg')) {
            return `<div class="entity-icon-svg" style="width: ${size}; height: ${size};">${icon}</div>`;
        }

        // SVG or image URL
        if (typeof icon === 'string' && (icon.includes('.svg') || icon.includes('.png') || icon.includes('.jpg') || icon.startsWith('http'))) {
            // Escape fallback for safe use in onerror handler (prevent XSS)
            const safeFallback = this.escapeHtml(fallback).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            return `<img src="${this.escapeHtml(icon)}" alt="" class="entity-icon-img" style="width: ${size}; height: ${size};" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='${safeFallback}'">`;
        }

        // Emoji or text
        return `<span class="icon-emoji" style="font-size: ${size};">${this.escapeHtml(icon)}</span>`;
    }

    // ==========================================
    // EXTENDED CONTENT SECTIONS
    // ==========================================

    /**
     * Render extendedContent array - titled content blocks
     */
    renderExtendedContent(extendedContent) {
        if (!Array.isArray(extendedContent) || extendedContent.length === 0) return '';

        return `
            <section class="extended-content-section">
                ${extendedContent.map((section, index) => `
                    <div class="glass-card extended-content-block" style="margin-bottom: 1.5rem; padding: 1.5rem;">
                        ${section.title ? `
                            <h3 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 1rem 0; font-size: 1.25rem; border-bottom: 1px solid var(--mythos-border, rgba(255,255,255,0.1)); padding-bottom: 0.5rem;">
                                ${this.escapeHtml(section.title)}
                            </h3>
                        ` : ''}
                        <div class="extended-content-text" style="line-height: 1.8; white-space: pre-wrap;">
                            ${this.renderFormattedText(section.content || section.text || '')}
                        </div>
                    </div>
                `).join('')}
            </section>
        `;
    }

    /**
     * Render formatted text with basic markdown-like support
     */
    renderFormattedText(text) {
        if (!text) return '';

        return this.escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^### (.*$)/gim, '<h4 style="color: var(--mythos-secondary, var(--color-secondary)); margin: 1rem 0 0.5rem;">$1</h4>')
            .replace(/^## (.*$)/gim, '<h3 style="color: var(--mythos-primary, var(--color-primary)); margin: 1.5rem 0 0.75rem;">$1</h3>')
            .replace(/^# (.*$)/gim, '<h2 style="margin: 1.5rem 0 1rem;">$1</h2>')
            .replace(/\n\n/g, '</p><p style="margin: 1rem 0;">')
            .replace(/\n/g, '<br>')
            .replace(/^— (.*)$/gm, '<blockquote style="border-left: 3px solid var(--mythos-primary, var(--color-primary)); padding-left: 1rem; margin: 1rem 0; font-style: italic; opacity: 0.9;">$1</blockquote>');
    }

    // ==========================================
    // KEY MYTHS / LEGENDS SECTION
    // ==========================================

    /**
     * Render keyMyths array with expandable details
     */
    renderKeyMyths(keyMyths, sectionTitle = 'Key Myths & Legends') {
        if (!Array.isArray(keyMyths) || keyMyths.length === 0) return '';

        return `
            <section class="key-myths-section" style="margin-top: 2rem;">
                <h2 style="color: var(--mythos-primary, var(--color-primary)); margin-bottom: 1.5rem;">
                    <span style="margin-right: 0.5rem;">📖</span>
                    ${this.escapeHtml(sectionTitle)}
                </h2>
                <div class="myths-grid" style="display: flex; flex-direction: column; gap: 1rem;">
                    ${keyMyths.map((myth, index) => `
                        <div class="glass-card myth-card" style="padding: 1.25rem; border-left: 4px solid var(--mythos-primary, var(--color-primary));">
                            <h4 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 0.75rem 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <span class="myth-number" style="background: var(--mythos-primary, var(--color-primary)); color: var(--color-background, #0a0e27); width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;">
                                    ${index + 1}
                                </span>
                                ${this.escapeHtml(myth.title || myth.name || 'Untitled Myth')}
                            </h4>
                            <p style="margin: 0; line-height: 1.7; opacity: 0.9;">
                                ${this.escapeHtml(myth.description || myth.summary || '')}
                            </p>
                            ${myth.source ? `
                                <div class="myth-source" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--mythos-border, rgba(255,255,255,0.1)); font-size: 0.85rem; opacity: 0.7;">
                                    <strong>Source:</strong> <em>${this.escapeHtml(myth.source)}</em>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    // ==========================================
    // FEATURES / SIGNIFICANCE / LISTS
    // ==========================================

    /**
     * Render a simple array as styled pills/badges
     */
    renderPillsList(items, title, icon = '🏷️', colorVar = '--mythos-primary') {
        if (!Array.isArray(items) || items.length === 0) return '';

        return `
            <div class="pills-section" style="margin-bottom: 1.5rem;">
                <h4 style="color: var(${colorVar}, var(--color-primary)); margin: 0 0 0.75rem 0; font-size: 0.95rem;">
                    <span style="margin-right: 0.5rem;">${icon}</span>
                    ${this.escapeHtml(title)}
                </h4>
                <div class="pills-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${items.map(item => `
                        <span class="pill-badge" style="background: rgba(var(--mythos-primary-rgb, var(--color-primary-rgb, 139, 127, 255)), 0.15); color: var(${colorVar}, var(--color-primary)); padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; border: 1px solid rgba(var(--mythos-primary-rgb, var(--color-primary-rgb, 139, 127, 255)), 0.3);">
                            ${this.escapeHtml(typeof item === 'object' ? (item.name || item.id) : item)}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render features/significance as an info grid
     */
    renderInfoGrid(data, title, icon = '📋') {
        if (!data) return '';

        // Handle array of strings
        if (Array.isArray(data)) {
            return this.renderPillsList(data, title, icon);
        }

        // Handle object with key-value pairs
        if (typeof data === 'object') {
            const entries = Object.entries(data).filter(([k, v]) => v !== null && v !== undefined);
            if (entries.length === 0) return '';

            return `
                <div class="info-grid-section" style="margin-bottom: 1.5rem;">
                    <h4 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 0.75rem 0; font-size: 0.95rem;">
                        <span style="margin-right: 0.5rem;">${icon}</span>
                        ${this.escapeHtml(title)}
                    </h4>
                    <div class="info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                        ${entries.map(([key, value]) => `
                            <div class="info-item" style="background: rgba(var(--mythos-primary-rgb, var(--color-primary-rgb, 139, 127, 255)), 0.05); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--mythos-border, rgba(255,255,255,0.1));">
                                <div class="info-label" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; margin-bottom: 0.25rem;">
                                    ${this.formatFieldName(key)}
                                </div>
                                <div class="info-value" style="font-weight: 500;">
                                    ${this.escapeHtml(Array.isArray(value) ? value.join(', ') : String(value))}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Handle plain string
        return `
            <div class="info-text-section" style="margin-bottom: 1.5rem;">
                <h4 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 0.5rem 0; font-size: 0.95rem;">
                    <span style="margin-right: 0.5rem;">${icon}</span>
                    ${this.escapeHtml(title)}
                </h4>
                <p style="margin: 0; opacity: 0.9;">${this.escapeHtml(data)}</p>
            </div>
        `;
    }

    // ==========================================
    // RELATED ENTITIES (Nested Object Format)
    // ==========================================

    /**
     * Render relatedEntities as categorized sections
     * Handles the nested object format: { deities: [...], heroes: [...], places: [...] }
     */
    renderCategorizedRelatedEntities(relatedEntities, title = 'Related Entities') {
        if (!relatedEntities || typeof relatedEntities !== 'object') return '';

        const categories = Object.entries(relatedEntities).filter(([key, value]) =>
            Array.isArray(value) && value.length > 0
        );

        if (categories.length === 0) return '';

        const categoryIcons = {
            deities: '⚡',
            heroes: '🗡️',
            creatures: '🐉',
            items: '⚔️',
            places: '🏛️',
            locations: '📍',
            concepts: '💭',
            events: '📅',
            texts: '📜',
            objects: '🔮',
            characters: '👤',
            mythologies: '🌍'
        };

        return `
            <section class="related-entities-section" style="margin-top: 2rem;">
                <h2 style="color: var(--mythos-primary, var(--color-primary)); margin-bottom: 1.5rem;">
                    <span style="margin-right: 0.5rem;">🔗</span>
                    ${this.escapeHtml(title)}
                </h2>
                <div class="related-categories" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    ${categories.map(([category, entities]) => `
                        <div class="related-category">
                            <h3 style="color: var(--mythos-secondary, var(--color-secondary)); margin: 0 0 1rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <span>${categoryIcons[category.toLowerCase()] || '📎'}</span>
                                ${this.capitalize(category)}
                                <span style="background: var(--mythos-primary, var(--color-primary)); color: var(--color-bg); padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">
                                    ${entities.length}
                                </span>
                            </h3>
                            <div class="related-entities-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem;">
                                ${entities.map(entity => this.renderEntityCard(entity, category)).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Render a single entity card
     */
    renderEntityCard(entity, category = '') {
        const name = entity.name || entity.id || 'Unknown';
        const relationship = entity.relationship || '';
        const id = entity.id || '';
        const icon = entity.icon || this.getDefaultIcon(category);
        const unverified = entity._unverified ? `<span style="color: #f59e0b; font-size: 0.75rem;" title="Unverified reference">⚠️</span>` : '';

        // Build link URL if entity has an ID
        const linkUrl = id ? `#/mythology/${this.mythology || 'universal'}/${category || 'entity'}/${id}` : '#';
        const isClickable = !!id;

        return `
            <a href="${linkUrl}" class="glass-card entity-card-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; text-decoration: none; color: inherit; border-radius: 8px; transition: all 0.2s; ${!isClickable ? 'pointer-events: none;' : ''}" ${!isClickable ? '' : 'data-entity-link'}>
                <span class="entity-card-icon" style="font-size: 1.25rem; flex-shrink: 0;">${icon}</span>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <strong style="color: var(--mythos-primary, var(--color-primary)); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${this.escapeHtml(name)}
                        </strong>
                        ${unverified}
                    </div>
                    ${relationship ? `
                        <span style="font-size: 0.75rem; opacity: 0.7; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${this.escapeHtml(relationship)}
                        </span>
                    ` : ''}
                </div>
                ${isClickable ? '<span style="opacity: 0.4; font-size: 0.8rem;">→</span>' : ''}
            </a>
        `;
    }

    /**
     * Get default icon for entity type
     */
    getDefaultIcon(type) {
        const icons = {
            'deity': '⚡', 'deities': '⚡',
            'hero': '🗡️', 'heroes': '🗡️',
            'creature': '🐉', 'creatures': '🐉',
            'item': '⚔️', 'items': '⚔️',
            'place': '🏛️', 'places': '🏛️', 'locations': '📍',
            'concept': '💭', 'concepts': '💭',
            'event': '📅', 'events': '📅',
            'text': '📜', 'texts': '📜',
            'ritual': '🕯️', 'rituals': '🕯️',
            'symbol': '☯️', 'symbols': '☯️',
            'archetype': '🎭', 'archetypes': '🎭',
            'character': '👤', 'characters': '👤',
            'mythology': '🌍', 'mythologies': '🌍'
        };
        return icons[type?.toLowerCase()] || '✨';
    }

    // ==========================================
    // SOURCES / BIBLIOGRAPHY TABLE
    // ==========================================

    /**
     * Render sources as a proper bibliography table
     */
    renderSourcesTable(sources, title = 'Sources & References') {
        if (!Array.isArray(sources) || sources.length === 0) return '';

        return `
            <section class="sources-section" style="margin-top: 2rem;">
                <h2 style="color: var(--mythos-primary, var(--color-primary)); margin-bottom: 1rem;">
                    <span style="margin-right: 0.5rem;">📚</span>
                    ${this.escapeHtml(title)}
                </h2>
                <div class="glass-card sources-table-container" style="padding: 0; overflow: hidden; border-radius: 8px;">
                    <table class="sources-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: rgba(var(--mythos-primary-rgb, var(--color-primary-rgb, 139, 127, 255)), 0.1);">
                                <th style="text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: var(--mythos-primary, var(--color-primary)); border-bottom: 2px solid var(--mythos-border, rgba(255,255,255,0.1));">
                                    Title
                                </th>
                                <th style="text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: var(--mythos-primary, var(--color-primary)); border-bottom: 2px solid var(--mythos-border, rgba(255,255,255,0.1));">
                                    Author
                                </th>
                                <th style="text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: var(--mythos-primary, var(--color-primary)); border-bottom: 2px solid var(--mythos-border, rgba(255,255,255,0.1)); display: ${sources.some(s => s.description) ? 'table-cell' : 'none'};">
                                    Notes
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sources.map((source, index) => `
                                <tr style="border-bottom: 1px solid var(--mythos-border, rgba(255,255,255,0.05)); ${index % 2 === 1 ? 'background: rgba(255,255,255,0.02);' : ''}">
                                    <td style="padding: 0.75rem 1rem; font-weight: 500;">
                                        <em>${this.escapeHtml(source.title || source.work || source.name || 'Unknown')}</em>
                                    </td>
                                    <td style="padding: 0.75rem 1rem; opacity: 0.8;">
                                        ${this.escapeHtml(source.author || 'Unknown')}
                                    </td>
                                    <td style="padding: 0.75rem 1rem; font-size: 0.85rem; opacity: 0.7; display: ${sources.some(s => s.description) ? 'table-cell' : 'none'};">
                                        ${this.escapeHtml(source.description || source.text || '')}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    // ==========================================
    // CORPUS SEARCH SECTION
    // ==========================================

    /**
     * Render corpus search terms for entity
     */
    renderCorpusSearch(corpusSearch, entityName) {
        if (!corpusSearch || (!corpusSearch.canonical?.length && !corpusSearch.variants?.length)) {
            return '';
        }

        const allTerms = [
            ...(corpusSearch.canonical || []),
            ...(corpusSearch.variants || [])
        ];

        return `
            <section class="corpus-search-section glass-card" style="margin-top: 2rem; padding: 1.5rem;">
                <h3 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
                    <span>🔍</span>
                    Search Ancient Texts
                </h3>
                <p style="margin: 0 0 1rem 0; opacity: 0.8; font-size: 0.9rem;">
                    Find references to ${this.escapeHtml(entityName)} in primary sources:
                </p>
                <div class="corpus-search-terms" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                    ${allTerms.map(term => `
                        <a href="/corpus-explorer.html?term=${encodeURIComponent(term)}"
                           class="corpus-term-link"
                           style="background: rgba(var(--mythos-primary-rgb, var(--color-primary-rgb, 139, 127, 255)), 0.15); color: var(--mythos-primary, var(--color-primary)); padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; text-decoration: none; border: 1px solid rgba(var(--mythos-primary-rgb, var(--color-primary-rgb, 139, 127, 255)), 0.3); transition: all 0.2s;">
                            "${this.escapeHtml(term)}"
                        </a>
                    `).join('')}
                </div>
                <a href="/corpus-explorer.html?term=${encodeURIComponent(entityName)}"
                   style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--mythos-primary, var(--color-primary)); color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-size: 0.9rem; font-weight: 500;">
                    <span>📜</span>
                    Open Corpus Explorer
                </a>
            </section>
        `;
    }

    // ==========================================
    // TAGS / SEARCH TERMS
    // ==========================================

    /**
     * Render tags and search terms
     */
    renderTags(tags, searchTerms) {
        const allTags = [
            ...(Array.isArray(tags) ? tags : []),
            ...(Array.isArray(searchTerms) ? searchTerms : [])
        ].filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates

        if (allTags.length === 0) return '';

        return `
            <div class="tags-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--mythos-border, rgba(255,255,255,0.1));">
                <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center;">
                    <span style="font-size: 0.8rem; opacity: 0.6; margin-right: 0.5rem;">Tags:</span>
                    ${allTags.slice(0, 10).map(tag => `
                        <span class="tag-chip" style="background: rgba(128, 128, 128, 0.15); color: var(--color-text-secondary); padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem;">
                            ${this.escapeHtml(tag)}
                        </span>
                    `).join('')}
                    ${allTags.length > 10 ? `<span style="font-size: 0.75rem; opacity: 0.6;">+${allTags.length - 10} more</span>` : ''}
                </div>
            </div>
        `;
    }

    // ==========================================
    // SYMBOLISM / LONG DESCRIPTION
    // ==========================================

    /**
     * Render symbolism or long description as expandable content
     */
    renderSymbolism(symbolism, title = 'Symbolism & Meaning') {
        if (!symbolism) return '';

        // Truncate for preview
        const previewLength = 500;
        const isLong = symbolism.length > previewLength;
        const preview = isLong ? symbolism.substring(0, previewLength) + '...' : symbolism;
        const uniqueId = `symbolism-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return `
            <section class="symbolism-section" style="margin-top: 2rem;">
                <h2 style="color: var(--mythos-primary, var(--color-primary)); margin-bottom: 1rem;">
                    <span style="margin-right: 0.5rem;">🔮</span>
                    ${this.escapeHtml(title)}
                </h2>
                <div class="glass-card symbolism-content" style="padding: 1.5rem;">
                    <div class="symbolism-preview" id="${uniqueId}-preview" style="${isLong ? '' : 'display: none;'}">
                        <div style="line-height: 1.8; white-space: pre-wrap;">${this.renderFormattedText(preview)}</div>
                        ${isLong ? `
                            <button onclick="document.getElementById('${uniqueId}-preview').style.display='none'; document.getElementById('${uniqueId}-full').style.display='block';"
                                    style="margin-top: 1rem; background: transparent; border: 1px solid var(--mythos-primary, var(--color-primary)); color: var(--mythos-primary, var(--color-primary)); padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                                Read More ↓
                            </button>
                        ` : ''}
                    </div>
                    <div class="symbolism-full" id="${uniqueId}-full" style="${isLong ? 'display: none;' : ''}">
                        <div style="line-height: 1.8; white-space: pre-wrap;">${this.renderFormattedText(symbolism)}</div>
                        ${isLong ? `
                            <button onclick="document.getElementById('${uniqueId}-full').style.display='none'; document.getElementById('${uniqueId}-preview').style.display='block';"
                                    style="margin-top: 1rem; background: transparent; border: 1px solid var(--mythos-primary, var(--color-primary)); color: var(--mythos-primary, var(--color-primary)); padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                                Show Less ↑
                            </button>
                        ` : ''}
                    </div>
                </div>
            </section>
        `;
    }

    // ==========================================
    // RITUAL SPECIFIC SECTIONS
    // ==========================================

    /**
     * Render ritual-specific fields
     */
    renderRitualDetails(entity) {
        const sections = [];

        // Purpose
        if (entity.purpose) {
            sections.push(this.renderInfoGrid(entity.purpose, 'Purpose', '🎯'));
        }

        // Timing
        if (entity.timing) {
            sections.push(this.renderInfoGrid(entity.timing, 'Timing & Season', '📅'));
        }

        // Participants
        if (entity.participants?.length) {
            sections.push(this.renderPillsList(entity.participants, 'Participants', '👥'));
        }

        // Steps/Procedure
        if (entity.steps?.length || entity.procedure) {
            const stepsContent = entity.steps?.length
                ? entity.steps.map((step, i) => `${i + 1}. ${typeof step === 'object' ? (step.description || step.name) : step}`).join('\n')
                : entity.procedure;

            if (stepsContent) {
                sections.push(`
                    <div class="ritual-steps-section" style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 0.75rem 0; font-size: 0.95rem;">
                            <span style="margin-right: 0.5rem;">📋</span>
                            Ritual Procedure
                        </h4>
                        <div class="glass-card" style="padding: 1rem;">
                            <div style="line-height: 1.8; white-space: pre-wrap;">${this.renderFormattedText(stepsContent)}</div>
                        </div>
                    </div>
                `);
            }
        }

        // Tools/Materials
        if (entity.tools?.length || entity.materials?.length) {
            const items = [...(entity.tools || []), ...(entity.materials || [])];
            sections.push(this.renderPillsList(items, 'Required Tools & Materials', '🔧'));
        }

        // Prohibitions
        if (entity.prohibitions?.length) {
            sections.push(`
                <div class="prohibitions-section" style="margin-bottom: 1.5rem;">
                    <h4 style="color: #ef4444; margin: 0 0 0.75rem 0; font-size: 0.95rem;">
                        <span style="margin-right: 0.5rem;">⚠️</span>
                        Prohibitions & Taboos
                    </h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${entity.prohibitions.map(item => `
                            <span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; border: 1px solid rgba(239, 68, 68, 0.3);">
                                ${this.escapeHtml(typeof item === 'object' ? (item.name || item.description) : item)}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `);
        }

        // Related deities for ritual
        if (entity.deities?.length) {
            sections.push(this.renderPillsList(
                entity.deities.filter(d => d && !d.startsWith('-')),
                'Associated Deities',
                '⚡'
            ));
        }

        return sections.length > 0 ? `
            <section class="ritual-details-section" style="margin-top: 2rem;">
                <h2 style="color: var(--mythos-primary, var(--color-primary)); margin-bottom: 1.5rem;">
                    <span style="margin-right: 0.5rem;">🕯️</span>
                    Ritual Details
                </h2>
                <div class="glass-card" style="padding: 1.5rem;">
                    ${sections.join('')}
                </div>
            </section>
        ` : '';
    }

    // ==========================================
    // PLACE SPECIFIC SECTIONS
    // ==========================================

    /**
     * Render place-specific fields
     */
    renderPlaceDetails(entity) {
        const sections = [];

        // Features
        if (entity.features?.length) {
            sections.push(this.renderPillsList(entity.features, 'Notable Features', '🏔️'));
        }

        // Significance
        if (entity.significance) {
            sections.push(this.renderInfoGrid(entity.significance, 'Significance', '⭐'));
        }

        // Associated Deities
        if (entity.associatedDeities?.length) {
            sections.push(this.renderPillsList(entity.associatedDeities, 'Associated Deities', '⚡'));
        }

        // Inhabitants
        if (entity.inhabitants?.length) {
            sections.push(this.renderPillsList(entity.inhabitants, 'Inhabitants', '👥'));
        }

        // Related Places
        if (entity.relatedPlaces?.length) {
            const validPlaces = entity.relatedPlaces.filter(p => p && p.name && p.name !== 'undefined');
            if (validPlaces.length > 0) {
                sections.push(`
                    <div class="related-places-section" style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 0.75rem 0; font-size: 0.95rem;">
                            <span style="margin-right: 0.5rem;">📍</span>
                            Related Places
                        </h4>
                        <div class="related-places-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.5rem;">
                            ${validPlaces.slice(0, 12).map(place => `
                                <a href="#/mythology/${this.mythology}/place/${place.id}"
                                   class="glass-card"
                                   style="padding: 0.5rem 0.75rem; text-decoration: none; color: inherit; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; border-radius: 6px;">
                                    <span>🏛️</span>
                                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(place.name)}</span>
                                </a>
                            `).join('')}
                            ${validPlaces.length > 12 ? `<span style="padding: 0.5rem; font-size: 0.8rem; opacity: 0.6;">+${validPlaces.length - 12} more</span>` : ''}
                        </div>
                    </div>
                `);
            }
        }

        return sections.length > 0 ? `
            <section class="place-details-section" style="margin-top: 2rem;">
                ${sections.join('')}
            </section>
        ` : '';
    }

    // ==========================================
    // ITEM SPECIFIC SECTIONS
    // ==========================================

    /**
     * Render item-specific fields
     */
    renderItemDetails(entity) {
        const sections = [];

        // Item Type
        if (entity.itemType || entity.subtype) {
            sections.push(this.renderInfoGrid({
                Type: entity.itemType,
                Subtype: entity.subtype
            }, 'Classification', '📦'));
        }

        // Materials
        if (entity.materials?.length) {
            sections.push(this.renderPillsList(entity.materials, 'Materials', '🔩'));
        }

        // Powers
        if (entity.powers?.length) {
            sections.push(this.renderPillsList(entity.powers, 'Powers & Abilities', '✨'));
        }

        // Related Items
        if (entity.relatedItems?.length) {
            const validItems = entity.relatedItems.filter(item => item && item.name && item.name !== 'undefined' && item.name !== 'unknown');
            if (validItems.length > 0) {
                sections.push(`
                    <div class="related-items-section" style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 0.75rem 0; font-size: 0.95rem;">
                            <span style="margin-right: 0.5rem;">⚔️</span>
                            Related Artifacts
                        </h4>
                        <div class="related-items-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem;">
                            ${validItems.slice(0, 12).map(item => `
                                <a href="#/mythology/${this.mythology}/item/${item.id}"
                                   class="glass-card"
                                   style="padding: 0.5rem 0.75rem; text-decoration: none; color: inherit; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; border-radius: 6px;">
                                    <span>⚔️</span>
                                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(item.name)}</span>
                                </a>
                            `).join('')}
                            ${validItems.length > 12 ? `<span style="padding: 0.5rem; font-size: 0.8rem; opacity: 0.6;">+${validItems.length - 12} more</span>` : ''}
                        </div>
                    </div>
                `);
            }
        }

        return sections.length > 0 ? `
            <section class="item-details-section" style="margin-top: 2rem;">
                ${sections.join('')}
            </section>
        ` : '';
    }

    // ==========================================
    // CROSS-CULTURAL PARALLELS
    // ==========================================

    /**
     * Render cross-cultural parallels section
     */
    renderCrossCulturalParallels(parallels) {
        if (!Array.isArray(parallels) || parallels.length === 0) return '';

        const validParallels = parallels.filter(p => p && (p.name || p.id));

        if (validParallels.length === 0) return '';

        return `
            <section class="cross-cultural-section" style="margin-top: 2rem;">
                <h2 style="color: var(--mythos-primary, var(--color-primary)); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>🌐</span>
                    Cross-Cultural Parallels
                </h2>
                <div class="glass-card" style="padding: 1.5rem;">
                    <p style="opacity: 0.8; margin-bottom: 1rem; font-size: 0.9rem;">
                        Similar deities and figures across world mythologies:
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem;">
                        ${validParallels.map(p => `
                            <a href="#/entity/deities/${p.id || this.slugify(p.name)}"
                               class="glass-card parallel-card"
                               style="padding: 0.75rem 1rem; text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 0.25rem; border-radius: 8px; transition: all 0.2s;">
                                <span style="font-weight: 600; color: var(--mythos-primary, var(--color-primary));">
                                    ${this.escapeHtml(p.name || p.id)}
                                </span>
                                ${p.tradition ? `<span style="font-size: 0.8rem; opacity: 0.7;">📍 ${this.escapeHtml(p.tradition)}</span>` : ''}
                                ${p.archetype ? `<span style="font-size: 0.75rem; opacity: 0.6;">🎭 ${this.escapeHtml(p.archetype)}</span>` : ''}
                            </a>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Convert string to URL-friendly slug
     */
    slugify(str) {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // ==========================================
    // CULTURAL PRACTICES & FESTIVALS
    // ==========================================

    /**
     * Render cultural section (worship practices, festivals, modern legacy)
     */
    renderCulturalSection(cultural) {
        if (!cultural || typeof cultural !== 'object') return '';

        const sections = [];

        // Worship Practices
        if (cultural.worshipPractices?.length) {
            const practices = Array.isArray(cultural.worshipPractices)
                ? cultural.worshipPractices
                : [cultural.worshipPractices];
            sections.push(`
                <div class="worship-practices" style="margin-bottom: 1.5rem;">
                    <h4 style="color: var(--mythos-secondary, var(--color-secondary)); margin: 0 0 0.75rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span>🛕</span> Worship Practices
                    </h4>
                    ${practices.map(p => `
                        <div class="glass-card" style="padding: 1rem; margin-bottom: 0.5rem; line-height: 1.7;">
                            ${this.renderFormattedText(typeof p === 'object' ? p.description : p)}
                        </div>
                    `).join('')}
                </div>
            `);
        }

        // Festivals
        if (cultural.festivals?.length) {
            sections.push(`
                <div class="festivals" style="margin-bottom: 1.5rem;">
                    <h4 style="color: var(--mythos-secondary, var(--color-secondary)); margin: 0 0 0.75rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span>🎉</span> Festivals & Ceremonies
                    </h4>
                    <div style="display: grid; gap: 0.75rem;">
                        ${cultural.festivals.map(f => `
                            <div class="glass-card festival-card" style="padding: 1rem; border-radius: 8px;">
                                <h5 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 0.5rem 0; font-size: 1rem;">
                                    ${this.escapeHtml(f.name || 'Festival')}
                                </h5>
                                <p style="margin: 0; opacity: 0.9; line-height: 1.6; font-size: 0.9rem;">
                                    ${this.escapeHtml(f.description || '')}
                                </p>
                                ${f.timing ? `<p style="margin: 0.5rem 0 0; opacity: 0.7; font-size: 0.85rem;">📅 ${this.escapeHtml(f.timing)}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `);
        }

        // Modern Legacy
        if (cultural.modernLegacy) {
            const legacy = typeof cultural.modernLegacy === 'object'
                ? cultural.modernLegacy.culturalImpact || cultural.modernLegacy.description
                : cultural.modernLegacy;
            if (legacy) {
                sections.push(`
                    <div class="modern-legacy" style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--mythos-secondary, var(--color-secondary)); margin: 0 0 0.75rem 0; display: flex; align-items: center; gap: 0.5rem;">
                            <span>🌟</span> Modern Legacy
                        </h4>
                        <div class="glass-card" style="padding: 1rem; line-height: 1.7;">
                            ${this.renderFormattedText(legacy)}
                        </div>
                    </div>
                `);
            }
        }

        if (sections.length === 0) return '';

        return `
            <section class="cultural-section" style="margin-top: 2rem;">
                <h2 style="color: var(--mythos-primary, var(--color-primary)); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>🏛️</span>
                    Cultural Context
                </h2>
                <div class="cultural-content">
                    ${sections.join('')}
                </div>
            </section>
        `;
    }

    // ==========================================
    // RELATED DEITIES (SIMPLE ARRAY)
    // ==========================================

    /**
     * Render related deities as a linked grid
     */
    renderRelatedDeities(relatedDeities, mythology) {
        if (!Array.isArray(relatedDeities) || relatedDeities.length === 0) return '';

        const validDeities = relatedDeities.filter(d => d && (d.name || d.id));
        if (validDeities.length === 0) return '';

        const myth = mythology || this.mythology || 'greek';

        return `
            <section class="related-deities-section" style="margin-top: 2rem;">
                <h2 style="color: var(--mythos-primary, var(--color-primary)); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>⚡</span>
                    Related Deities
                </h2>
                <div class="related-deities-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem;">
                    ${validDeities.map(deity => `
                        <a href="#/entity/deities/${deity.id || this.slugify(deity.name)}"
                           class="glass-card deity-link"
                           style="padding: 0.75rem 1rem; text-decoration: none; color: inherit; text-align: center; border-radius: 8px; transition: all 0.2s;">
                            <span style="font-size: 1.5rem; display: block; margin-bottom: 0.25rem;">⚡</span>
                            <span style="font-weight: 500;">${this.escapeHtml(deity.name || deity.id)}</span>
                        </a>
                    `).join('')}
                </div>
            </section>
        `;
    }

    // ==========================================
    // ASSOCIATIONS (SIMPLE ARRAY)
    // ==========================================

    /**
     * Render associations as pills with icons
     */
    renderAssociations(associations) {
        if (!Array.isArray(associations) || associations.length === 0) return '';

        return `
            <section class="associations-section" style="margin-top: 1.5rem;">
                <h3 style="color: var(--mythos-secondary, var(--color-secondary)); margin: 0 0 0.75rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>🔗</span>
                    Associations
                </h3>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${associations.map(a => `
                        <span class="association-pill" style="background: rgba(var(--mythos-primary-rgb, var(--color-primary-rgb, 139, 127, 255)), 0.1); color: var(--color-text-primary); padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; border: 1px solid rgba(var(--mythos-primary-rgb, var(--color-primary-rgb, 139, 127, 255)), 0.2);">
                            ${this.escapeHtml(a)}
                        </span>
                    `).join('')}
                </div>
            </section>
        `;
    }

    // ==========================================
    // QUESTS, FEATS, COMPANIONS (ARRAY OF OBJECTS)
    // ==========================================

    /**
     * Render quests/feats/adventures as expandable cards
     */
    renderQuestsOrFeats(items, title = 'Notable Feats', icon = '⚔️') {
        if (!Array.isArray(items) || items.length === 0) return '';

        return `
            <section class="feats-section" style="margin-top: 2rem;">
                <h2 style="color: var(--mythos-primary, var(--color-primary)); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>${icon}</span>
                    ${this.escapeHtml(title)}
                </h2>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${items.map((item, i) => `
                        <div class="glass-card feat-card" style="padding: 1.25rem; border-radius: 8px;">
                            <div style="display: flex; align-items: flex-start; gap: 1rem;">
                                <span style="font-size: 1.5rem; opacity: 0.8;">${i + 1}.</span>
                                <div style="flex: 1;">
                                    <h4 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 0.5rem 0;">
                                        ${this.escapeHtml(item.title || item.name || `${title} ${i + 1}`)}
                                    </h4>
                                    <p style="margin: 0; opacity: 0.9; line-height: 1.7;">
                                        ${this.renderFormattedText(item.description || item.content || item.summary || '')}
                                    </p>
                                    ${item.source ? `<p style="margin: 0.75rem 0 0; font-size: 0.85rem; opacity: 0.7;">📜 ${this.escapeHtml(item.source)}</p>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Render companions/allies as cards
     */
    renderCompanions(companions) {
        if (!Array.isArray(companions) || companions.length === 0) return '';

        return `
            <section class="companions-section" style="margin-top: 2rem;">
                <h2 style="color: var(--mythos-primary, var(--color-primary)); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>👥</span>
                    Companions & Allies
                </h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem;">
                    ${companions.map(c => `
                        <div class="glass-card companion-card" style="padding: 1rem; border-radius: 8px;">
                            <h4 style="color: var(--mythos-primary, var(--color-primary)); margin: 0 0 0.5rem 0; font-size: 1rem;">
                                ${this.escapeHtml(c.name || c.id || 'Companion')}
                            </h4>
                            ${c.role ? `<p style="margin: 0 0 0.5rem; font-size: 0.85rem; opacity: 0.8;">🎭 ${this.escapeHtml(c.role)}</p>` : ''}
                            ${c.description ? `<p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">${this.escapeHtml(c.description)}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    // ==========================================
    // UNIVERSAL FIELD RENDERER
    // ==========================================

    /**
     * Auto-detect and render any schema field
     */
    renderField(fieldName, value, entity) {
        if (value === null || value === undefined || value === '') return '';

        // Skip internal/meta fields
        const skipFields = ['id', 'type', 'mythology', 'createdAt', 'updatedAt', 'authorId',
            'metadata', '_modified', '_created', '_enhanced', '_uploadedAt', 'status',
            'migratedFrom', 'migrationDate', 'enrichedAt', 'enrichedBy', 'iconType',
            'generatedBy', 'enhancedBy', 'visibility', 'authoredAt', 'updated_at',
            'filename', 'slug', 'primaryMythology', '_syncedAt', '_syncedBy', 'mediaReferences'];

        if (skipFields.includes(fieldName)) return '';

        // Handle known field types
        switch (fieldName) {
            case 'extendedContent':
                return this.renderExtendedContent(value);
            case 'keyMyths':
                return this.renderKeyMyths(value);
            case 'relatedEntities':
                return this.renderCategorizedRelatedEntities(value);
            case 'sources':
                return this.renderSourcesTable(value);
            case 'corpusSearch':
                return this.renderCorpusSearch(value, entity.name);
            case 'symbolism':
            case 'longDescription':
                return this.renderSymbolism(value, fieldName === 'symbolism' ? 'Symbolism & Meaning' : 'Detailed Description');
            case 'tags':
            case 'searchTerms':
                return ''; // Handled separately at bottom
            case 'features':
            case 'significance':
            case 'associatedDeities':
            case 'inhabitants':
                return ''; // Handled in place-specific section
            case 'materials':
            case 'powers':
            case 'relatedItems':
                return ''; // Handled in item-specific section
            case 'relatedPlaces':
                return ''; // Handled in place-specific section
            case 'relatedConcepts':
                return Array.isArray(value) ? this.renderPillsList(value, 'Related Concepts', '💭') : '';

            // NEW: Cultural section
            case 'cultural':
                return this.renderCulturalSection(value);

            // NEW: Cross-cultural parallels
            case 'cross_cultural_parallels':
            case 'crossCulturalParallels':
                return this.renderCrossCulturalParallels(value);

            // NEW: Related deities (simple array)
            case 'relatedDeities':
                return this.renderRelatedDeities(value, entity.mythology);

            // NEW: Associations
            case 'associations':
                return this.renderAssociations(value);

            // NEW: Quests, feats, adventures
            case 'quests':
                return this.renderQuestsOrFeats(value, 'Quests & Journeys', '🗺️');
            case 'feats':
                return this.renderQuestsOrFeats(value, 'Notable Feats', '🏆');
            case 'adventures':
                return this.renderQuestsOrFeats(value, 'Adventures', '⚔️');

            // NEW: Companions
            case 'companions':
            case 'allies':
                return this.renderCompanions(value);

            // Usage/description variants
            case 'usage':
                return value ? this.renderSymbolism(value, 'Usage & Function') : '';

            case 'mythologies':
            case 'mythologyContexts':
            case 'mythologyCollection':
                return Array.isArray(value) && value.length > 0
                    ? this.renderPillsList(value.map(m => typeof m === 'object' ? m.name : m), 'Mythological Traditions', '🌍')
                    : '';

            default:
                // Generic rendering for unknown fields
                if (Array.isArray(value) && value.length > 0) {
                    // Array of objects - try to render intelligently
                    if (typeof value[0] === 'object') {
                        // Check if it looks like entity references
                        if (value[0].name || value[0].id) {
                            return this.renderQuestsOrFeats(value, this.formatFieldName(fieldName), '📋');
                        }
                        return ''; // Skip complex arrays we don't know how to render
                    }
                    // Array of strings
                    return this.renderPillsList(value, this.formatFieldName(fieldName), '📎');
                }
                // Skip objects we don't know how to render
                if (typeof value === 'object') {
                    return '';
                }
                return '';
        }
    }

    /**
     * Render all remaining fields not explicitly handled
     */
    renderRemainingFields(entity, handledFields = []) {
        const defaultHandled = [
            'id', 'name', 'type', 'mythology', 'description', 'shortDescription',
            'subtitle', 'icon', 'iconType', 'content', 'domains', 'symbols',
            'epithets', 'titles', 'family', 'worship', 'cultCenters', 'mythsAndLegends',
            'texts', 'quests', 'adventures', 'weapons', 'equipment', 'geography',
            'realm', 'region', 'locationType', 'placeType', 'attributes', 'characteristics',
            'category', 'gender', 'sacredAnimals', 'sacredPlants', 'sacredPlaces'
        ];

        const allHandled = [...new Set([...defaultHandled, ...handledFields])];
        const sections = [];

        for (const [fieldName, value] of Object.entries(entity)) {
            if (!allHandled.includes(fieldName)) {
                const rendered = this.renderField(fieldName, value, entity);
                if (rendered) {
                    sections.push(rendered);
                }
            }
        }

        return sections.join('');
    }
}

// Export globally
window.SchemaSectionRenderer = SchemaSectionRenderer;
