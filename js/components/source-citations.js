/**
 * Source Citations Component
 *
 * Renders formatted academic citations and source references
 * for mythological entities. Supports multiple citation formats
 * and source types.
 *
 * Features:
 * - Multiple citation formats (APA, MLA, Chicago)
 * - Primary and secondary source distinction
 * - Corpus search integration
 * - Text passage references
 * - Bibliography generation
 * - Accessible markup
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    class SourceCitations {
        constructor(options = {}) {
            this.options = {
                containerClass: 'source-citations',
                format: options.format || 'chicago', // 'apa', 'mla', 'chicago', 'simple'
                showCorpusLinks: options.showCorpusLinks !== false,
                groupByType: options.groupByType !== false,
                collapsible: options.collapsible || false,
                maxVisible: options.maxVisible || 10,
                onCitationClick: options.onCitationClick || null,
                ...options
            };

            // Source type configurations
            this.sourceTypes = {
                primary: {
                    label: 'Primary Sources',
                    icon: '\u{1F4DC}',
                    description: 'Ancient texts and original sources',
                    color: '#FFD700'
                },
                secondary: {
                    label: 'Secondary Sources',
                    icon: '\u{1F4DA}',
                    description: 'Scholarly analysis and commentary',
                    color: '#4CAF50'
                },
                modern: {
                    label: 'Modern References',
                    icon: '\u{1F4D6}',
                    description: 'Contemporary studies and interpretations',
                    color: '#2196F3'
                },
                archaeological: {
                    label: 'Archaeological Evidence',
                    icon: '\u{1F3DB}\uFE0F',
                    description: 'Physical artifacts and archaeological findings',
                    color: '#795548'
                },
                epigraphic: {
                    label: 'Epigraphic Sources',
                    icon: '\u{1F5FF}',
                    description: 'Inscriptions and written records',
                    color: '#607D8B'
                },
                iconographic: {
                    label: 'Iconographic Sources',
                    icon: '\u{1F5BC}\uFE0F',
                    description: 'Visual representations and imagery',
                    color: '#9C27B0'
                },
                oral: {
                    label: 'Oral Traditions',
                    icon: '\u{1F5E3}\uFE0F',
                    description: 'Oral histories and folk traditions',
                    color: '#FF9800'
                },
                default: {
                    label: 'Sources',
                    icon: '\u{1F4DA}',
                    description: 'Reference materials',
                    color: '#9E9E9E'
                }
            };

            // Citation format templates
            this.formatters = {
                chicago: this.formatChicago.bind(this),
                apa: this.formatAPA.bind(this),
                mla: this.formatMLA.bind(this),
                simple: this.formatSimple.bind(this)
            };
        }

        /**
         * Render complete citations display
         * @param {Object} entity - Entity with source data
         * @returns {string} HTML string
         */
        render(entity) {
            if (!entity) {
                return this.renderEmpty('No entity data provided');
            }

            const sources = this.extractSources(entity);

            if (Object.keys(sources).length === 0) {
                return this.renderEmpty('No sources available');
            }

            const grouped = this.options.groupByType ? sources : { all: this.flattenSources(sources) };

            return `
                <div class="${this.options.containerClass}">
                    ${Object.entries(grouped).map(([type, items]) => this.renderSourceGroup(type, items)).join('')}
                    ${this.renderBibliographyFooter(sources)}
                </div>
            `;
        }

        /**
         * Render a single citation
         * @param {Object} source - Source object
         * @param {string} format - Citation format
         * @returns {string} HTML string
         */
        renderCitation(source, format = null) {
            const formatter = this.formatters[format || this.options.format] || this.formatters.simple;
            const citation = formatter(source);

            return `
                <div class="citation-item" data-source-type="${source.type || 'default'}">
                    <div class="citation-text">${citation}</div>
                    ${this.renderCitationMeta(source)}
                </div>
            `;
        }

        /**
         * Render text references (with passages)
         * @param {Array} references - Array of text references
         * @param {string} mythology - Associated mythology
         * @returns {string} HTML string
         */
        renderTextReferences(references, mythology = '') {
            if (!references || references.length === 0) return '';

            return `
                <div class="${this.options.containerClass} sc-text-refs">
                    <h4 class="sc-section-title">
                        <span class="sc-section-icon">\u{1F4DC}</span>
                        Text References ${mythology ? `(${this.capitalize(mythology)})` : ''}
                    </h4>
                    <div class="sc-refs-list">
                        ${references.map(ref => this.renderTextReference(ref)).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render a single text reference
         */
        renderTextReference(ref) {
            return `
                <div class="sc-text-ref">
                    <div class="sc-ref-header">
                        <span class="sc-ref-icon">\u{1F4D6}</span>
                        <strong class="sc-ref-title">${this.escapeHtml(ref.text || ref.title || '')}</strong>
                        ${ref.passage ? `<span class="sc-ref-passage">(${this.escapeHtml(ref.passage)})</span>` : ''}
                    </div>
                    ${ref.context ? `<p class="sc-ref-context">${this.escapeHtml(ref.context)}</p>` : ''}
                    ${ref.quote ? `<blockquote class="sc-ref-quote">"${this.escapeHtml(ref.quote)}"</blockquote>` : ''}
                    ${ref.corpusUrl && this.options.showCorpusLinks ? `
                        <a href="${this.escapeHtml(ref.corpusUrl)}" class="sc-corpus-link" target="_blank" rel="noopener">
                            \u{1F50D} Search in Corpus
                        </a>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render corpus queries section
         * @param {Object} corpusQueries - Corpus query configuration
         * @returns {string} HTML string
         */
        renderCorpusQueries(corpusQueries) {
            if (!corpusQueries) return '';

            const queries = [];

            if (corpusQueries.canonical) {
                queries.push({ type: 'canonical', term: corpusQueries.canonical });
            }
            if (corpusQueries.variants?.length > 0) {
                corpusQueries.variants.forEach(v => queries.push({ type: 'variant', term: v }));
            }
            if (corpusQueries.epithets?.length > 0) {
                corpusQueries.epithets.forEach(e => queries.push({ type: 'epithet', term: e }));
            }
            if (corpusQueries.domains?.length > 0) {
                corpusQueries.domains.forEach(d => queries.push({ type: 'domain', term: d }));
            }

            if (queries.length === 0) return '';

            return `
                <div class="${this.options.containerClass} sc-corpus-queries">
                    <h4 class="sc-section-title">
                        <span class="sc-section-icon">\u{1F50D}</span>
                        Corpus Search Terms
                    </h4>
                    <p class="sc-section-desc">Use these terms to search ancient text databases</p>
                    <div class="sc-query-tags">
                        ${queries.map(q => `
                            <span class="sc-query-tag sc-query-tag--${q.type}" title="${this.capitalize(q.type)}">
                                ${this.escapeHtml(q.term)}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render bibliography
         * @param {Array} bibliography - Array of bibliography entries
         * @returns {string} HTML string
         */
        renderBibliography(bibliography) {
            if (!bibliography || bibliography.length === 0) return '';

            const sorted = [...bibliography].sort((a, b) => {
                const authorA = (typeof a === 'string' ? a : a.author || '').toLowerCase();
                const authorB = (typeof b === 'string' ? b : b.author || '').toLowerCase();
                return authorA.localeCompare(authorB);
            });

            return `
                <div class="${this.options.containerClass} sc-bibliography">
                    <h4 class="sc-section-title">
                        <span class="sc-section-icon">\u{1F4DA}</span>
                        Bibliography
                    </h4>
                    <ol class="sc-bib-list">
                        ${sorted.map(entry => `
                            <li class="sc-bib-entry">${this.formatBibEntry(entry)}</li>
                        `).join('')}
                    </ol>
                </div>
            `;
        }

        /**
         * Render source group
         */
        renderSourceGroup(type, sources) {
            if (!sources || sources.length === 0) return '';

            const typeConfig = this.sourceTypes[type] || this.sourceTypes.default;
            const visible = sources.slice(0, this.options.maxVisible);
            const hidden = sources.slice(this.options.maxVisible);
            const isCollapsible = this.options.collapsible && hidden.length > 0;

            return `
                <div class="sc-source-group" data-type="${type}" style="--group-color: ${typeConfig.color}">
                    <div class="sc-group-header">
                        <span class="sc-group-icon">${typeConfig.icon}</span>
                        <h4 class="sc-group-title">${typeConfig.label}</h4>
                        <span class="sc-group-count">(${sources.length})</span>
                    </div>
                    ${typeConfig.description ? `<p class="sc-group-desc">${typeConfig.description}</p>` : ''}
                    <ul class="sc-source-list">
                        ${visible.map(source => `
                            <li class="sc-source-item">${this.renderCitation(source)}</li>
                        `).join('')}
                        ${isCollapsible ? `
                            <li class="sc-source-item sc-source-more" hidden>
                                ${hidden.map(source => this.renderCitation(source)).join('')}
                            </li>
                            <li class="sc-show-more">
                                <button type="button" class="sc-show-more-btn" data-hidden="${hidden.length}">
                                    Show ${hidden.length} more sources
                                </button>
                            </li>
                        ` : ''}
                    </ul>
                </div>
            `;
        }

        /**
         * Render citation metadata
         */
        renderCitationMeta(source) {
            const meta = [];

            if (source.reliability) {
                meta.push(`<span class="sc-reliability sc-reliability--${source.reliability.toLowerCase()}">${this.capitalize(source.reliability)}</span>`);
            }
            if (source.language) {
                meta.push(`<span class="sc-language">${this.escapeHtml(source.language)}</span>`);
            }
            if (source.corpusUrl && this.options.showCorpusLinks) {
                meta.push(`<a href="${this.escapeHtml(source.corpusUrl)}" class="sc-corpus-link" target="_blank" rel="noopener">\u{1F50D} Corpus</a>`);
            }
            if (source.url) {
                meta.push(`<a href="${this.escapeHtml(source.url)}" class="sc-source-link" target="_blank" rel="noopener">\u{1F517} Link</a>`);
            }

            if (meta.length === 0) return '';

            return `<div class="sc-citation-meta">${meta.join('')}</div>`;
        }

        /**
         * Render bibliography footer
         */
        renderBibliographyFooter(sources) {
            const total = Object.values(sources).reduce((sum, arr) => sum + arr.length, 0);
            if (total < 3) return '';

            return `
                <div class="sc-footer">
                    <p class="sc-total">Total sources: ${total}</p>
                </div>
            `;
        }

        /**
         * Render empty state
         */
        renderEmpty(message) {
            return `
                <div class="${this.options.containerClass} sc-empty">
                    <span class="sc-empty-icon">\u{1F4DA}</span>
                    <p class="sc-empty-message">${this.escapeHtml(message)}</p>
                </div>
            `;
        }

        // ==================== FORMATTERS ====================

        /**
         * Format citation in Chicago style
         */
        formatChicago(source) {
            if (typeof source === 'string') return this.escapeHtml(source);

            const parts = [];

            // Author
            if (source.author) {
                parts.push(this.escapeHtml(source.author));
            }

            // Title (italicized for books, quoted for articles)
            if (source.title || source.text) {
                const title = source.title || source.text;
                if (source.type === 'article' || source.type === 'chapter') {
                    parts.push(`"${this.escapeHtml(title)}"`);
                } else {
                    parts.push(`<em>${this.escapeHtml(title)}</em>`);
                }
            }

            // Editor/Translator
            if (source.editor) {
                parts.push(`ed. ${this.escapeHtml(source.editor)}`);
            }
            if (source.translator) {
                parts.push(`trans. ${this.escapeHtml(source.translator)}`);
            }

            // Publication info
            if (source.publisher || source.place) {
                const pubInfo = [];
                if (source.place) pubInfo.push(source.place);
                if (source.publisher) pubInfo.push(source.publisher);
                if (pubInfo.length > 0) parts.push(this.escapeHtml(pubInfo.join(': ')));
            }

            // Date
            if (source.date || source.year) {
                parts.push(this.escapeHtml(String(source.date || source.year)));
            }

            // Passage
            if (source.passage) {
                parts.push(this.escapeHtml(source.passage));
            }

            return parts.join(', ') + '.';
        }

        /**
         * Format citation in APA style
         */
        formatAPA(source) {
            if (typeof source === 'string') return this.escapeHtml(source);

            const parts = [];

            // Author (Last, F. M.)
            if (source.author) {
                parts.push(this.escapeHtml(source.author));
            }

            // Year in parentheses
            if (source.date || source.year) {
                parts.push(`(${this.escapeHtml(String(source.date || source.year))})`);
            }

            // Title (italicized)
            if (source.title || source.text) {
                parts.push(`<em>${this.escapeHtml(source.title || source.text)}</em>`);
            }

            // Publisher
            if (source.publisher) {
                parts.push(this.escapeHtml(source.publisher));
            }

            return parts.join('. ') + '.';
        }

        /**
         * Format citation in MLA style
         */
        formatMLA(source) {
            if (typeof source === 'string') return this.escapeHtml(source);

            const parts = [];

            // Author
            if (source.author) {
                parts.push(this.escapeHtml(source.author) + '.');
            }

            // Title (italicized)
            if (source.title || source.text) {
                parts.push(`<em>${this.escapeHtml(source.title || source.text)}</em>.`);
            }

            // Publisher, Year
            const pubParts = [];
            if (source.publisher) pubParts.push(source.publisher);
            if (source.date || source.year) pubParts.push(String(source.date || source.year));
            if (pubParts.length > 0) {
                parts.push(this.escapeHtml(pubParts.join(', ')) + '.');
            }

            return parts.join(' ');
        }

        /**
         * Format citation in simple style
         */
        formatSimple(source) {
            if (typeof source === 'string') return this.escapeHtml(source);

            const parts = [];

            if (source.author) parts.push(this.escapeHtml(source.author));
            if (source.title || source.text) parts.push(`<em>${this.escapeHtml(source.title || source.text)}</em>`);
            if (source.passage) parts.push(`(${this.escapeHtml(source.passage)})`);
            if (source.date || source.year) parts.push(`[${this.escapeHtml(String(source.date || source.year))}]`);

            return parts.join(', ');
        }

        /**
         * Format bibliography entry
         */
        formatBibEntry(entry) {
            if (typeof entry === 'string') return this.escapeHtml(entry);
            return this.formatChicago(entry);
        }

        // ==================== HELPER METHODS ====================

        /**
         * Extract sources from entity
         */
        extractSources(entity) {
            const sources = {};

            // Primary sources
            if (entity.primarySources?.length > 0) {
                sources.primary = entity.primarySources.map(s => ({ ...this.normalizeSource(s), type: 'primary' }));
            }

            // Secondary sources
            if (entity.secondarySources?.length > 0) {
                sources.secondary = entity.secondarySources.map(s => ({ ...this.normalizeSource(s), type: 'secondary' }));
            }

            // Modern references
            if (entity.modernReferences?.length > 0) {
                sources.modern = entity.modernReferences.map(s => ({ ...this.normalizeSource(s), type: 'modern' }));
            }

            // Generic sources
            if (entity.sources?.length > 0) {
                const genericSources = entity.sources.map(s => this.normalizeSource(s));
                // Try to categorize them
                genericSources.forEach(s => {
                    const type = s.type || 'default';
                    if (!sources[type]) sources[type] = [];
                    sources[type].push(s);
                });
            }

            // Mythology contexts with text references
            if (entity.mythologyContexts) {
                entity.mythologyContexts.forEach(context => {
                    if (context.textReferences?.length > 0) {
                        if (!sources.primary) sources.primary = [];
                        context.textReferences.forEach(ref => {
                            sources.primary.push({
                                ...this.normalizeSource(ref),
                                type: 'primary',
                                mythology: context.mythology
                            });
                        });
                    }
                });
            }

            return sources;
        }

        /**
         * Normalize source to standard format
         */
        normalizeSource(source) {
            if (typeof source === 'string') {
                return { text: source, title: source };
            }
            return {
                author: source.author,
                title: source.title || source.text || source.work,
                text: source.text || source.title,
                passage: source.passage,
                date: source.date || source.year,
                year: source.year || source.date,
                publisher: source.publisher,
                place: source.place,
                translator: source.translator,
                editor: source.editor,
                type: source.type,
                reliability: source.reliability,
                language: source.language,
                corpusUrl: source.corpusUrl,
                url: source.url,
                context: source.context,
                quote: source.quote,
                relevance: source.relevance
            };
        }

        /**
         * Flatten sources into single array
         */
        flattenSources(sources) {
            return Object.values(sources).flat();
        }

        /**
         * Escape HTML
         */
        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = String(text);
            return div.innerHTML;
        }

        /**
         * Capitalize string
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        /**
         * Initialize show more functionality
         */
        initShowMore(container) {
            container.querySelectorAll('.sc-show-more-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const group = btn.closest('.sc-source-group');
                    const hidden = group.querySelector('.sc-source-more');
                    if (hidden) {
                        hidden.hidden = !hidden.hidden;
                        btn.textContent = hidden.hidden
                            ? `Show ${btn.dataset.hidden} more sources`
                            : 'Show fewer sources';
                    }
                });
            });
        }

        /**
         * Initialize citation click handlers
         */
        initClickHandlers(container) {
            if (!this.options.onCitationClick) return;

            container.querySelectorAll('.sc-source-item').forEach(item => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', (e) => {
                    if (e.target.tagName === 'A') return;
                    const title = item.querySelector('.citation-text')?.textContent;
                    this.options.onCitationClick({ title });
                });
            });
        }
    }

    // Export to window
    window.SourceCitations = SourceCitations;

    // Also export as module if supported
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SourceCitations;
    }

})();
