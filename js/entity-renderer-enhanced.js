/**
 * Enhanced Entity Renderer
 *
 * Advanced entity detail page rendering with:
 * - Schema.org structured data for SEO
 * - Open Graph tags for social sharing
 * - JSON-LD for rich snippets
 * - Modern tabbed interface
 * - Enhanced metadata display
 * - Interactive relationship graphs
 * - Timeline views for myths
 * - Breadcrumb navigation
 * - Quick actions menu
 */

class EnhancedEntityRenderer extends FirebaseEntityRenderer {
    constructor() {
        super();
        this.activeTab = 'overview';
    }

    /**
     * Enhanced render deity with all modern UX features
     */
    renderDeity(entity, container) {
        // Make container position relative for edit icon
        container.style.position = 'relative';

        const html = `
            ${this.renderEditIcon(entity)}
            ${this.renderBreadcrumbs(entity)}
            ${this.renderHeroSection(entity)}
            ${this.renderQuickActions(entity)}
            ${this.renderMetadataGrid(entity)}
            ${this.renderTabbedContent(entity)}
            ${this.renderRelatedEntitiesEnhanced(entity)}
        `;

        container.innerHTML = html;

        // Inject SEO metadata
        this.injectSEOMetadata(entity);
        this.injectStructuredData(entity);
        this.injectOpenGraph(entity);

        // Attach event listeners
        this.attachTabListeners(container);
        this.initializeInteractiveFeatures(container, entity);
    }

    /**
     * Render enhanced hero section with large icon
     */
    renderHeroSection(entity) {
        const icon = entity.visual?.icon || entity.icon || this.getDefaultIcon(entity.type);

        return `
            <section class="entity-hero-enhanced">
                <div class="hero-icon-large" style="font-size: 6rem; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3));">
                    ${icon}
                </div>
                <div class="hero-content-enhanced">
                    <h1 class="entity-name-hero">${this.escapeHtml(entity.name || entity.title)}</h1>
                    ${entity.subtitle ? `
                        <p class="entity-subtitle-hero">${this.escapeHtml(entity.subtitle)}</p>
                    ` : ''}
                    ${entity.epithets?.length ? `
                        <div class="entity-epithets-hero">
                            ${entity.epithets.slice(0, 3).map(epithet =>
                                `<span class="epithet-badge">${this.escapeHtml(epithet)}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                    ${entity.description ? `
                        <p class="entity-description-hero">${this.escapeHtml(entity.description)}</p>
                    ` : ''}
                </div>
            </section>
        `;
    }

    /**
     * Render breadcrumb navigation
     */
    renderBreadcrumbs(entity) {
        const mythology = this.mythology || entity.mythology || 'unknown';
        const type = entity.type || 'entity';
        const name = entity.name || 'Unknown';

        return `
            <nav class="breadcrumb-enhanced" aria-label="Breadcrumb">
                <a href="/" class="breadcrumb-link">🏠 Home</a>
                <span class="breadcrumb-separator">→</span>
                <a href="/mythos/${mythology}/index.html" class="breadcrumb-link">${this.capitalize(mythology)}</a>
                <span class="breadcrumb-separator">→</span>
                <a href="/mythos/${mythology}/${type}s/index.html" class="breadcrumb-link">${this.capitalize(type)}s</a>
                <span class="breadcrumb-separator">→</span>
                <span class="breadcrumb-current">${this.escapeHtml(name)}</span>
            </nav>
        `;
    }

    /**
     * Render quick actions menu
     */
    renderQuickActions(entity) {
        const mythology = this.mythology || entity.mythology || 'unknown';

        return `
            <div class="quick-actions-bar">
                <button class="quick-action-btn" data-action="compare" title="Compare with similar deities">
                    <span class="action-icon">⚖️</span>
                    <span class="action-label">Compare</span>
                </button>
                <button class="quick-action-btn" data-action="context" title="View in mythology context">
                    <span class="action-icon">🗺️</span>
                    <span class="action-label">Context</span>
                </button>
                <button class="quick-action-btn" data-action="related" title="See all related entities">
                    <span class="action-icon">🔗</span>
                    <span class="action-label">Related</span>
                </button>
                <button class="quick-action-btn" data-action="share" title="Share this page">
                    <span class="action-icon">📤</span>
                    <span class="action-label">Share</span>
                </button>
                <button class="quick-action-btn" data-action="bookmark" title="Bookmark this entity">
                    <span class="action-icon">⭐</span>
                    <span class="action-label">Bookmark</span>
                </button>
            </div>
        `;
    }

    /**
     * Render metadata grid with key information
     */
    renderMetadataGrid(entity) {
        const metadata = [];

        // Type
        metadata.push({
            label: 'Type',
            value: this.capitalize(entity.type || 'Entity'),
            icon: this.getTypeIcon(entity.type)
        });

        // Mythology
        if (entity.mythology || this.mythology) {
            metadata.push({
                label: 'Mythology',
                value: this.capitalize(entity.mythology || this.mythology),
                icon: this.getMythologyIcon(entity.mythology || this.mythology)
            });
        }

        // Domains
        if (entity.domains?.length) {
            metadata.push({
                label: 'Domains',
                value: entity.domains.join(', '),
                icon: '⚡'
            });
        }

        // Cultural Period
        if (entity.period || entity.historicalPeriod) {
            metadata.push({
                label: 'Period',
                value: entity.period || entity.historicalPeriod,
                icon: '📅'
            });
        }

        // Geographic Region
        if (entity.region || entity.geographicRegion) {
            metadata.push({
                label: 'Region',
                value: entity.region || entity.geographicRegion,
                icon: '🌍'
            });
        }

        // Cultural Significance
        if (entity.significance || entity.culturalSignificance) {
            metadata.push({
                label: 'Significance',
                value: entity.significance || entity.culturalSignificance,
                icon: '✨'
            });
        }

        return `
            <section class="metadata-grid-enhanced">
                ${metadata.map(item => `
                    <div class="metadata-card">
                        <div class="metadata-icon">${item.icon}</div>
                        <div class="metadata-content">
                            <div class="metadata-label">${item.label}</div>
                            <div class="metadata-value">${this.escapeHtml(item.value)}</div>
                        </div>
                    </div>
                `).join('')}
            </section>
        `;
    }

    /**
     * Render tabbed content sections
     */
    renderTabbedContent(entity) {
        const tabs = this.getTabs(entity);

        return `
            <section class="tabbed-content-enhanced">
                <div class="tab-navigation">
                    ${tabs.map((tab, index) => `
                        <button class="tab-button ${index === 0 ? 'active' : ''}"
                                data-tab="${tab.id}"
                                aria-selected="${index === 0}">
                            <span class="tab-icon">${tab.icon}</span>
                            <span class="tab-label">${tab.label}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="tab-content-container">
                    ${tabs.map((tab, index) => `
                        <div class="tab-panel ${index === 0 ? 'active' : ''}"
                             data-tab-content="${tab.id}"
                             role="tabpanel"
                             aria-hidden="${index !== 0}">
                            ${this.renderTabContent(tab.id, entity)}
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Get tabs based on entity type and available data
     */
    getTabs(entity) {
        const tabs = [
            { id: 'overview', label: 'Overview', icon: '📖' }
        ];

        if (entity.mythsAndLegends?.length || entity.myths?.length || entity.stories?.length) {
            tabs.push({ id: 'mythology', label: 'Mythology', icon: '📜' });
        }

        if (entity.family || entity.relationships || entity.allies || entity.enemies) {
            tabs.push({ id: 'relationships', label: 'Relationships', icon: '👥' });
        }

        if (entity.worship || entity.cultCenters || entity.rituals || entity.festivals) {
            tabs.push({ id: 'worship', label: 'Worship', icon: '🏛️' });
        }

        if (entity.texts?.length || entity.sources?.length || entity.primarySources?.length) {
            tabs.push({ id: 'sources', label: 'Sources', icon: '📚' });
        }

        return tabs;
    }

    /**
     * Render content for a specific tab
     */
    renderTabContent(tabId, entity) {
        switch (tabId) {
            case 'overview':
                return this.renderOverviewTab(entity);
            case 'mythology':
                return this.renderMythologyTab(entity);
            case 'relationships':
                return this.renderRelationshipsTab(entity);
            case 'worship':
                return this.renderWorshipTab(entity);
            case 'sources':
                return this.renderSourcesTab(entity);
            default:
                return '<p>Content not available</p>';
        }
    }

    /**
     * Overview tab content
     */
    renderOverviewTab(entity) {
        return `
            <div class="overview-content">
                ${entity.content ? `
                    <div class="entity-full-description">
                        ${this.renderMarkdown(entity.content)}
                    </div>
                ` : ''}

                ${this.renderDeityAttributes(entity) !== '<p style="color: var(--color-text-secondary);">No attributes recorded yet.</p>' ? `
                    <h3 class="section-heading">Attributes & Symbols</h3>
                    <div class="attribute-grid-enhanced">
                        ${this.renderDeityAttributes(entity)}
                    </div>
                ` : ''}

                ${entity.alternativeNames?.length ? `
                    <h3 class="section-heading">Alternative Names</h3>
                    <div class="alternative-names-list">
                        ${entity.alternativeNames.map(name => `
                            <span class="alt-name-badge">${this.escapeHtml(name)}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Mythology tab with timeline view
     */
    renderMythologyTab(entity) {
        const myths = entity.mythsAndLegends || entity.myths || entity.stories || [];

        return `
            <div class="mythology-content">
                <h3 class="section-heading">Myths & Legends</h3>
                ${myths.length > 0 ? `
                    <div class="mythology-timeline">
                        ${myths.map((myth, index) => `
                            <div class="timeline-item" data-myth-index="${index}">
                                <div class="timeline-marker">${index + 1}</div>
                                <div class="timeline-content">
                                    <h4 class="myth-title">${this.escapeHtml(myth.title || myth.name)}</h4>
                                    <p class="myth-description">${this.escapeHtml(myth.description || myth.summary)}</p>
                                    ${myth.source ? `
                                        <div class="myth-source">
                                            <span class="source-icon">📖</span>
                                            <em>${this.escapeHtml(myth.source)}</em>
                                        </div>
                                    ` : ''}
                                    ${myth.period ? `
                                        <div class="myth-period">
                                            <span class="period-icon">📅</span>
                                            ${this.escapeHtml(myth.period)}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <p class="no-content">No myths recorded yet.</p>
                `}
            </div>
        `;
    }

    /**
     * Relationships tab with interactive graph
     */
    renderRelationshipsTab(entity) {
        return `
            <div class="relationships-content">
                ${entity.family ? `
                    <h3 class="section-heading">Family Tree</h3>
                    <div class="family-tree-container">
                        ${this.renderFamilyTree(entity.family, entity.name)}
                    </div>
                ` : ''}

                ${entity.allies?.length || entity.enemies?.length ? `
                    <h3 class="section-heading">Allies & Enemies</h3>
                    <div class="allies-enemies-grid">
                        ${entity.allies?.length ? `
                            <div class="allies-section">
                                <h4 class="subsection-heading">⚔️ Allies</h4>
                                <div class="relationship-cards">
                                    ${entity.allies.map(ally => `
                                        <div class="relationship-card ally-card">
                                            <span class="relationship-icon">🤝</span>
                                            <span class="relationship-name">${this.escapeHtml(ally)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${entity.enemies?.length ? `
                            <div class="enemies-section">
                                <h4 class="subsection-heading">⚡ Enemies</h4>
                                <div class="relationship-cards">
                                    ${entity.enemies.map(enemy => `
                                        <div class="relationship-card enemy-card">
                                            <span class="relationship-icon">⚔️</span>
                                            <span class="relationship-name">${this.escapeHtml(enemy)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                ${!entity.family && !entity.allies?.length && !entity.enemies?.length ? `
                    <p class="no-content">No relationship data available.</p>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render interactive family tree
     */
    renderFamilyTree(family, entityName) {
        return `
            <div class="family-tree-visual">
                ${family.parents?.length ? `
                    <div class="tree-level tree-parents">
                        <div class="tree-level-label">Parents</div>
                        <div class="tree-nodes">
                            ${family.parents.map(parent => `
                                <div class="tree-node parent-node">${this.escapeHtml(parent)}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tree-connector"></div>
                ` : ''}

                <div class="tree-level tree-self">
                    <div class="tree-node self-node highlighted">${this.escapeHtml(entityName)}</div>
                </div>

                ${family.consorts?.length || family.spouses?.length ? `
                    <div class="tree-connector"></div>
                    <div class="tree-level tree-consorts">
                        <div class="tree-level-label">Consort(s)</div>
                        <div class="tree-nodes">
                            ${(family.consorts || family.spouses || []).map(consort => `
                                <div class="tree-node consort-node">${this.escapeHtml(consort)}</div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${family.children?.length || family.offspring?.length ? `
                    <div class="tree-connector"></div>
                    <div class="tree-level tree-children">
                        <div class="tree-level-label">Children</div>
                        <div class="tree-nodes">
                            ${(family.children || family.offspring || []).slice(0, 8).map(child => `
                                <div class="tree-node child-node">${this.escapeHtml(child)}</div>
                            `).join('')}
                            ${(family.children || family.offspring || []).length > 8 ? `
                                <div class="tree-node child-node more-node">+${(family.children || family.offspring || []).length - 8} more</div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${family.siblings?.length ? `
                    <div class="tree-connector"></div>
                    <div class="tree-level tree-siblings">
                        <div class="tree-level-label">Siblings</div>
                        <div class="tree-nodes">
                            ${family.siblings.map(sibling => `
                                <div class="tree-node sibling-node">${this.escapeHtml(sibling)}</div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Worship tab content
     */
    renderWorshipTab(entity) {
        return `
            <div class="worship-content">
                ${entity.worship || entity.cultCenters?.length ? `
                    <h3 class="section-heading">Sacred Sites</h3>
                    ${entity.worship ? `<p class="worship-description">${this.escapeHtml(entity.worship)}</p>` : ''}
                    ${entity.cultCenters?.length ? `
                        <div class="cult-centers-grid">
                            ${entity.cultCenters.map(center => `
                                <div class="cult-center-card">
                                    <span class="center-icon">🏛️</span>
                                    <span class="center-name">${this.escapeHtml(center)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                ` : ''}

                ${entity.festivals?.length ? `
                    <h3 class="section-heading">Festivals & Celebrations</h3>
                    <div class="festivals-list">
                        ${entity.festivals.map(festival => `
                            <div class="festival-card">
                                <h4 class="festival-name">${this.escapeHtml(festival.name || festival.title)}</h4>
                                <p class="festival-description">${this.escapeHtml(festival.description || '')}</p>
                                ${festival.date ? `
                                    <div class="festival-date">
                                        <span class="date-icon">📅</span>
                                        ${this.escapeHtml(festival.date)}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${!entity.worship && !entity.cultCenters?.length && !entity.festivals?.length ? `
                    <p class="no-content">No worship information available.</p>
                ` : ''}
            </div>
        `;
    }

    /**
     * Sources tab with primary sources
     */
    renderSourcesTab(entity) {
        const sources = entity.texts || entity.sources || entity.primarySources || [];

        return `
            <div class="sources-content">
                <h3 class="section-heading">Primary Sources</h3>
                ${sources.length > 0 ? `
                    <div class="sources-list-enhanced">
                        ${sources.map((source, index) => {
                            const isObject = typeof source === 'object';
                            return `
                                <div class="source-card-enhanced">
                                    <div class="source-number">${index + 1}</div>
                                    <div class="source-content">
                                        ${isObject ? `
                                            <div class="source-citation">
                                                ${this.escapeHtml(source.source || source.title || 'Unknown')}
                                                ${source.section ? ` - ${this.escapeHtml(source.section)}` : ''}
                                                ${source.lines ? ` (Lines ${this.escapeHtml(source.lines)})` : ''}
                                            </div>
                                            ${source.text || source.content || source.verse ? `
                                                <blockquote class="source-quote">
                                                    ${this.escapeHtml(source.text || source.content || source.verse)}
                                                </blockquote>
                                            ` : ''}
                                            ${source.reference ? `
                                                <div class="source-reference">
                                                    📖 ${this.escapeHtml(source.reference)}
                                                </div>
                                            ` : ''}
                                        ` : `
                                            <div class="source-citation">${this.escapeHtml(source)}</div>
                                        `}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <p class="no-content">No primary sources documented yet.</p>
                `}

                ${entity.modernInterpretations?.length ? `
                    <h3 class="section-heading">Modern Interpretations</h3>
                    <div class="modern-interpretations-list">
                        ${entity.modernInterpretations.map(interpretation => `
                            <div class="interpretation-card">
                                <p>${this.escapeHtml(interpretation)}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Enhanced related entities with thumbnails
     */
    renderRelatedEntitiesEnhanced(entity) {
        if (!entity.relatedEntities?.length) {
            return '';
        }

        return `
            <section class="related-entities-enhanced">
                <h2 class="section-heading-large">🔗 Related Entities</h2>
                <div class="related-entities-grid-enhanced">
                    ${entity.relatedEntities.map(related => `
                        <div class="related-entity-card-enhanced">
                            <div class="related-entity-icon">${related.icon || '✨'}</div>
                            <div class="related-entity-content">
                                <h4 class="related-entity-name">${this.escapeHtml(related.name)}</h4>
                                ${related.relationship ? `
                                    <p class="related-entity-relationship">${this.escapeHtml(related.relationship)}</p>
                                ` : ''}
                                ${related.description ? `
                                    <p class="related-entity-description">${this.escapeHtml(related.description)}</p>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Inject Schema.org structured data
     */
    injectStructuredData(entity) {
        const mythology = this.mythology || entity.mythology || 'unknown';

        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": entity.name || entity.title,
            "description": entity.description || entity.subtitle,
            "additionalType": `https://en.wikipedia.org/wiki/${entity.type}`,
            "knowsAbout": entity.domains || [],
            "alternateName": entity.epithets || entity.alternativeNames || [],
            "sameAs": entity.externalLinks || []
        };

        if (entity.family) {
            if (entity.family.parents?.length) {
                structuredData.parent = entity.family.parents.map(p => ({ "@type": "Person", "name": p }));
            }
            if (entity.family.children?.length) {
                structuredData.children = entity.family.children.map(c => ({ "@type": "Person", "name": c }));
            }
            if (entity.family.consorts?.length) {
                structuredData.spouse = entity.family.consorts.map(s => ({ "@type": "Person", "name": s }));
            }
        }

        // Check if script already exists
        let scriptTag = document.getElementById('entity-structured-data');
        if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.id = 'entity-structured-data';
            scriptTag.type = 'application/ld+json';
            document.head.appendChild(scriptTag);
        }

        scriptTag.textContent = JSON.stringify(structuredData, null, 2);
    }

    /**
     * Inject Open Graph metadata for social sharing
     */
    injectOpenGraph(entity) {
        const ogTags = {
            'og:title': `${entity.name} - ${this.capitalize(this.mythology)} Mythology`,
            'og:description': entity.description || entity.subtitle || `Learn about ${entity.name} in ${this.mythology} mythology`,
            'og:type': 'article',
            'og:url': window.location.href,
            'og:site_name': 'Eyes of Azrael - World Mythology Database'
        };

        // Twitter Card
        const twitterTags = {
            'twitter:card': 'summary_large_image',
            'twitter:title': ogTags['og:title'],
            'twitter:description': ogTags['og:description']
        };

        // Inject Open Graph tags
        Object.entries(ogTags).forEach(([property, content]) => {
            let metaTag = document.querySelector(`meta[property="${property}"]`);
            if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.setAttribute('property', property);
                document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', content);
        });

        // Inject Twitter Card tags
        Object.entries(twitterTags).forEach(([name, content]) => {
            let metaTag = document.querySelector(`meta[name="${name}"]`);
            if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.setAttribute('name', name);
                document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', content);
        });
    }

    /**
     * Inject SEO metadata
     */
    injectSEOMetadata(entity) {
        // Already handled in parent class, but enhance it
        const keywords = [
            entity.name,
            this.mythology,
            entity.type,
            ...(entity.domains || []),
            ...(entity.epithets || []).slice(0, 3)
        ].filter(Boolean).join(', ');

        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            document.head.appendChild(metaKeywords);
        }
        metaKeywords.content = keywords;
    }

    /**
     * Attach tab navigation listeners
     */
    attachTabListeners(container) {
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabPanels = container.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                // Deactivate all tabs
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                    panel.setAttribute('aria-hidden', 'true');
                });

                // Activate selected tab
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');

                const targetPanel = container.querySelector(`[data-tab-content="${targetTab}"]`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    targetPanel.setAttribute('aria-hidden', 'false');
                }

                this.activeTab = targetTab;
            });
        });
    }

    /**
     * Initialize interactive features
     */
    initializeInteractiveFeatures(container, entity) {
        // Quick actions
        const quickActionButtons = container.querySelectorAll('.quick-action-btn');
        quickActionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                this.handleQuickAction(action, entity);
            });
        });

        // Relationship graph interactions
        const relationshipCards = container.querySelectorAll('.relationship-card');
        relationshipCards.forEach(card => {
            card.addEventListener('click', () => {
                const name = card.querySelector('.relationship-name').textContent;
                console.log('Navigate to:', name);
                // TODO: Implement navigation
            });
        });
    }

    /**
     * Handle quick action button clicks
     */
    handleQuickAction(action, entity) {
        switch (action) {
            case 'compare':
                console.log('Compare action:', entity.name);
                alert(`Compare ${entity.name} with similar deities (feature coming soon)`);
                break;
            case 'context':
                const mythology = this.mythology || entity.mythology;
                window.location.href = `/mythos/${mythology}/index.html`;
                break;
            case 'related':
                const relatedSection = document.querySelector('.related-entities-enhanced');
                if (relatedSection) {
                    relatedSection.scrollIntoView({ behavior: 'smooth' });
                }
                break;
            case 'share':
                if (navigator.share) {
                    navigator.share({
                        title: `${entity.name} - ${this.capitalize(this.mythology)} Mythology`,
                        text: entity.description || entity.subtitle,
                        url: window.location.href
                    }).catch(err => console.log('Share failed:', err));
                } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                }
                break;
            case 'bookmark':
                // Store in localStorage
                const bookmarks = JSON.parse(localStorage.getItem('entity-bookmarks') || '[]');
                const bookmark = {
                    id: entity.id,
                    name: entity.name,
                    type: entity.type,
                    mythology: this.mythology,
                    url: window.location.href
                };

                if (!bookmarks.find(b => b.id === entity.id)) {
                    bookmarks.push(bookmark);
                    localStorage.setItem('entity-bookmarks', JSON.stringify(bookmarks));
                    alert(`Bookmarked ${entity.name}!`);
                } else {
                    alert(`${entity.name} is already bookmarked.`);
                }
                break;
        }
    }

    /**
     * Get icon for entity type
     */
    getTypeIcon(type) {
        const icons = {
            'deity': '⚡',
            'hero': '🗡️',
            'creature': '🐉',
            'item': '⚔️',
            'place': '🏛️',
            'concept': '💭',
            'magic': '🔮'
        };
        return icons[type] || '✨';
    }

    /**
     * Get icon for mythology
     */
    getMythologyIcon(mythology) {
        const icons = {
            'greek': '🏛️',
            'roman': '🦅',
            'norse': '⚔️',
            'egyptian': '𓂀',
            'hindu': '🕉️',
            'buddhist': '☸️',
            'chinese': '🐉',
            'japanese': '⛩️',
            'celtic': '☘️',
            'babylonian': '🌙',
            'sumerian': '⭐',
            'persian': '🔥',
            'aztec': '☀️',
            'mayan': '🌎',
            'christian': '✝️',
            'jewish': '✡️',
            'islamic': '☪️'
        };
        return icons[mythology?.toLowerCase()] || '🌍';
    }
}

// Make globally available
window.EnhancedEntityRenderer = EnhancedEntityRenderer;

// Auto-enhance existing pages
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const enhance = params.get('enhance') === 'true';
    const type = params.get('type');
    const id = params.get('id');
    const mythology = params.get('mythology');

    if (enhance && type && id) {
        const container = document.querySelector('main') || document.body;
        const renderer = new EnhancedEntityRenderer();
        await renderer.loadAndRender(type, id, mythology, container);
    }
});
