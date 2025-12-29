/**
 * Topic Panels Component
 * Renders rich, expandable content panels for entity detail pages
 * Eyes of Azrael - Mythology Knowledge Base
 */

class TopicPanels {
    constructor() {
        this.panels = [];
    }

    /**
     * Render topic panels for an entity
     * @param {Object} entity - Entity data from Firebase
     * @param {HTMLElement} container - Container to render panels into
     */
    render(entity, container) {
        if (!entity || !container) {
            console.error('TopicPanels: Missing entity or container');
            return;
        }

        // Generate topic panel data from entity
        const panelData = this.generatePanelData(entity);

        // Build HTML
        const html = this.buildPanelsHTML(panelData);

        // Insert into container
        container.innerHTML = html;

        // Initialize interactivity
        this.initializePanels(container);
    }

    /**
     * Generate panel data from entity
     * @param {Object} entity - Entity data
     * @returns {Object} Panel data
     */
    generatePanelData(entity) {
        const type = entity.type || 'entity';
        const mythology = entity.primaryMythology || entity.mythologies?.[0] || 'unknown';

        return {
            background: this.generateBackground(entity, type, mythology),
            significance: this.generateSignificance(entity, type, mythology),
            related: this.generateRelatedContent(entity),
            didYouKnow: this.generateDidYouKnow(entity, type),
            sources: this.generateSources(entity)
        };
    }

    /**
     * Generate background content
     */
    generateBackground(entity, type, mythology) {
        const contexts = entity.mythologyContexts || [];
        const mainContext = contexts.find(c => c.mythology === mythology) || contexts[0];

        let content = '';

        // Add origin/birth story for deities
        if (type === 'deity' && entity.fullDescription) {
            const birthMatch = entity.fullDescription.match(/born|birth|emerged|created/i);
            if (birthMatch) {
                const sentences = entity.fullDescription.split(/\.\s+/);
                const birthSentences = sentences.filter(s => /born|birth|emerged|created/i.test(s));
                if (birthSentences.length > 0) {
                    content += `<h4>Origins</h4><p>${birthSentences.join('. ')}.</p>`;
                }
            }
        }

        // Add symbolism
        if (mainContext?.symbolism) {
            content += `<h4>Symbolism</h4><p>${mainContext.symbolism}</p>`;
        }

        // Add general description if no specific content
        if (!content && entity.fullDescription) {
            content = `<p>${entity.fullDescription}</p>`;
        }

        // Add etymology if available
        if (entity.linguistic?.etymology?.derivation) {
            content += `<h4>Etymology</h4><p>${entity.linguistic.etymology.derivation}</p>`;
        }

        return content || '<p>Background information is being researched.</p>';
    }

    /**
     * Generate cultural significance content
     */
    generateSignificance(entity, type, mythology) {
        const contexts = entity.mythologyContexts || [];
        const mainContext = contexts.find(c => c.mythology === mythology) || contexts[0];

        let content = '';

        // Cultural significance from context
        if (mainContext?.culturalSignificance) {
            content += `<p>${mainContext.culturalSignificance}</p>`;
        }

        // Add archetype information
        if (entity.archetypes && entity.archetypes.length > 0) {
            content += '<h4>Archetypal Significance</h4>';
            const primaryArchetype = entity.archetypes[0];
            content += `<p>This ${type} embodies the <strong>${primaryArchetype.name}</strong> archetype`;
            if (primaryArchetype.context) {
                content += `: ${primaryArchetype.context}`;
            }
            content += '</p>';

            if (primaryArchetype.examples && primaryArchetype.examples.length > 0) {
                content += '<ul>';
                primaryArchetype.examples.slice(0, 3).forEach(example => {
                    content += `<li>${example}</li>`;
                });
                content += '</ul>';
            }
        }

        // Add geographical/temporal significance
        if (entity.geographical?.cultCenters && entity.geographical.cultCenters.length > 0) {
            content += '<h4>Sacred Sites</h4>';
            content += '<p>Major centers of worship included:</p><ul>';
            entity.geographical.cultCenters.forEach(center => {
                content += `<li><strong>${center.name}</strong>`;
                if (center.description) {
                    content += ` — ${center.description}`;
                }
                content += '</li>';
            });
            content += '</ul>';
        }

        return content || '<p>Cultural significance information is being compiled.</p>';
    }

    /**
     * Generate related content
     */
    generateRelatedContent(entity) {
        const related = entity.relatedEntities || {};
        const allRelated = [];

        // Collect all related entities
        Object.entries(related).forEach(([category, entities]) => {
            if (Array.isArray(entities)) {
                entities.forEach(e => {
                    allRelated.push({
                        ...e,
                        category: category
                    });
                });
            }
        });

        if (allRelated.length === 0) {
            return [];
        }

        // Limit to top 12 for display
        return allRelated.slice(0, 12);
    }

    /**
     * Generate "Did You Know?" facts
     */
    generateDidYouKnow(entity, type) {
        const facts = [];

        // Name variations
        const contexts = entity.mythologyContexts || [];
        const mainContext = contexts[0];
        if (mainContext?.names && mainContext.names.length > 1) {
            facts.push(`This ${type} is also known as <strong>${mainContext.names.slice(1, 3).join('</strong>, <strong>')}</strong>.`);
        }

        // Symbol information
        if (entity.properties) {
            const symbolProp = entity.properties.find(p => p.name === 'Symbols');
            if (symbolProp && symbolProp.value) {
                const symbols = symbolProp.value.split(',').slice(0, 2).join(' and');
                facts.push(`Sacred symbols include <strong>${symbols}</strong>.`);
            }

            // Sacred animals
            const animalProp = entity.properties.find(p => p.name === 'Sacred Animals');
            if (animalProp && animalProp.value) {
                const animals = animalProp.value.split(',')[0];
                facts.push(`The <strong>${animals}</strong> is sacred to this deity.`);
            }
        }

        // First attestation
        if (entity.temporal?.firstAttestation?.date?.display) {
            const date = entity.temporal.firstAttestation.date.display;
            facts.push(`First attested in written records around <strong>${date}</strong>.`);
        }

        // Linguistic fact
        if (entity.linguistic?.originalScript) {
            facts.push(`Written in original script as <strong>${entity.linguistic.originalScript}</strong>.`);
        }

        // Archetype strength
        if (entity.archetypes && entity.archetypes.length > 0) {
            const strongArchetypes = entity.archetypes.filter(a => a.score >= 90);
            if (strongArchetypes.length > 0) {
                const names = strongArchetypes.map(a => a.name).join('</strong> and <strong>');
                facts.push(`Strongly embodies the <strong>${names}</strong> archetype${strongArchetypes.length > 1 ? 's' : ''}.`);
            }
        }

        // Tags as interesting facts
        if (entity.tags && entity.tags.length > 5) {
            const interestingTags = entity.tags.filter(t =>
                !['deity', 'hero', 'creature', 'item', 'place'].includes(t.toLowerCase())
            ).slice(0, 3);
            if (interestingTags.length > 0) {
                facts.push(`Associated with <strong>${interestingTags.join('</strong>, <strong>')}</strong>.`);
            }
        }

        // Special properties for creatures
        if (type === 'creature' && entity.properties) {
            const specialPower = entity.properties.find(p =>
                p.name.toLowerCase().includes('power') || p.name.toLowerCase().includes('special')
            );
            if (specialPower) {
                facts.push(`Possesses the unique ability: <strong>${specialPower.value}</strong>.`);
            }
        }

        return facts.slice(0, 6); // Limit to 6 facts
    }

    /**
     * Generate sources list
     */
    generateSources(entity) {
        const sources = entity.sources || [];

        // Also include text references from contexts
        const contexts = entity.mythologyContexts || [];
        const textRefs = contexts.flatMap(c => c.textReferences || []);

        const allSources = [];

        // Add primary sources
        sources.forEach(source => {
            allSources.push({
                title: source.text,
                author: source.author,
                citation: source.passage,
                url: source.corpusUrl
            });
        });

        // Add unique text references
        textRefs.forEach(ref => {
            if (!allSources.find(s => s.title === ref.text)) {
                allSources.push({
                    title: ref.text,
                    author: ref.text.split('-')[0]?.trim() || 'Unknown',
                    citation: ref.passage || ref.context,
                    url: ref.corpusUrl,
                    context: ref.context
                });
            }
        });

        return allSources.slice(0, 8); // Limit to 8 sources
    }

    /**
     * Build panels HTML
     */
    buildPanelsHTML(data) {
        return `
            <div class="topic-panels-container">
                <h2 class="topic-panels-title">Deep Dive</h2>

                <!-- Background Panel -->
                <div class="topic-panel" data-panel="background">
                    <div class="topic-panel-header">
                        <div class="panel-icon-title">
                            <span class="panel-icon">📖</span>
                            <h3 class="panel-title">Background & Origins</h3>
                        </div>
                        <span class="expand-icon">▼</span>
                    </div>
                    <div class="topic-panel-content">
                        <div class="panel-content-body">
                            ${data.background}
                        </div>
                    </div>
                </div>

                <!-- Cultural Significance Panel -->
                <div class="topic-panel" data-panel="significance">
                    <div class="topic-panel-header">
                        <div class="panel-icon-title">
                            <span class="panel-icon">⭐</span>
                            <h3 class="panel-title">Cultural Significance</h3>
                        </div>
                        <span class="expand-icon">▼</span>
                    </div>
                    <div class="topic-panel-content">
                        <div class="panel-content-body">
                            ${data.significance}
                        </div>
                    </div>
                </div>

                ${data.related.length > 0 ? `
                <!-- Related Content Panel -->
                <div class="topic-panel" data-panel="related">
                    <div class="topic-panel-header">
                        <div class="panel-icon-title">
                            <span class="panel-icon">🔗</span>
                            <h3 class="panel-title">Related Entities</h3>
                        </div>
                        <span class="expand-icon">▼</span>
                    </div>
                    <div class="topic-panel-content">
                        <div class="panel-content-body">
                            <div class="related-entities-grid">
                                ${data.related.map(entity => `
                                    <div class="related-entity-card" onclick="window.location.href='${entity.url}'">
                                        <div class="related-entity-icon">${entity.icon || '✨'}</div>
                                        <div class="related-entity-name">${this.escapeHtml(entity.name)}</div>
                                        <div class="related-entity-type">${entity.type}</div>
                                        ${entity.relationship ? `<div class="related-entity-relationship">${this.escapeHtml(entity.relationship)}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${data.didYouKnow.length > 0 ? `
                <!-- Did You Know Panel -->
                <div class="topic-panel" data-panel="did-you-know">
                    <div class="topic-panel-header">
                        <div class="panel-icon-title">
                            <span class="panel-icon">💡</span>
                            <h3 class="panel-title">Did You Know?</h3>
                        </div>
                        <span class="expand-icon">▼</span>
                    </div>
                    <div class="topic-panel-content">
                        <div class="panel-content-body">
                            <ul class="did-you-know-list">
                                ${data.didYouKnow.map(fact => `
                                    <li>${fact}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${data.sources.length > 0 ? `
                <!-- Sources Panel -->
                <div class="topic-panel" data-panel="sources">
                    <div class="topic-panel-header">
                        <div class="panel-icon-title">
                            <span class="panel-icon">📚</span>
                            <h3 class="panel-title">Sources & Further Reading</h3>
                        </div>
                        <span class="expand-icon">▼</span>
                    </div>
                    <div class="topic-panel-content">
                        <div class="panel-content-body">
                            <div class="sources-list">
                                ${data.sources.map(source => `
                                    <div class="source-item">
                                        <div class="source-title">${this.escapeHtml(source.title)}</div>
                                        ${source.author ? `<div class="source-author">by ${this.escapeHtml(source.author)}</div>` : ''}
                                        ${source.citation ? `<div class="source-citation">${this.escapeHtml(source.citation)}</div>` : ''}
                                        ${source.url ? `<a href="${source.url}" class="source-link">View in Corpus →</a>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Initialize panel interactivity
     */
    initializePanels(container) {
        const headers = container.querySelectorAll('.topic-panel-header');

        headers.forEach(header => {
            header.addEventListener('click', () => {
                this.togglePanel(header);
            });

            // Add keyboard accessibility
            header.setAttribute('role', 'button');
            header.setAttribute('tabindex', '0');
            header.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.togglePanel(header);
                }
            });
        });

        // Auto-expand first panel
        const firstHeader = headers[0];
        if (firstHeader) {
            this.togglePanel(firstHeader);
        }
    }

    /**
     * Toggle panel expansion
     */
    togglePanel(header) {
        const panel = header.parentElement;
        const content = panel.querySelector('.topic-panel-content');
        const icon = header.querySelector('.expand-icon');

        const isExpanded = panel.classList.contains('expanded');

        if (isExpanded) {
            // Collapse
            panel.classList.remove('expanded');
            content.style.maxHeight = '0';
            icon.style.transform = 'rotate(0deg)';
            header.setAttribute('aria-expanded', 'false');
        } else {
            // Expand
            panel.classList.add('expanded');
            content.style.maxHeight = content.scrollHeight + 'px';
            icon.style.transform = 'rotate(180deg)';
            header.setAttribute('aria-expanded', 'true');
        }
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TopicPanels;
}

// Global instance
window.TopicPanels = TopicPanels;
