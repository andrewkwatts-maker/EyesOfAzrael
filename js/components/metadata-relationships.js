/**
 * Metadata Relationships Component
 *
 * Specialized component for displaying relationship metadata including:
 * - Family tree (parents, children, siblings, consorts)
 * - Allies and enemies
 * - Related entities (deities, heroes, creatures, items, places)
 * - Relationship graph visualization
 * - Interactive family tree diagram
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    class MetadataRelationships {
        constructor(options = {}) {
            this.showFamilyTree = options.showFamilyTree !== false;
            this.showRelationshipGraph = options.showRelationshipGraph !== false;
            this.graphProvider = options.graphProvider || 'native';
            this.maxRelatedVisible = options.maxRelatedVisible || 12;
            this.onEntityClick = options.onEntityClick || null;
            this.baseUrl = options.baseUrl || '';
        }

        /**
         * Main render method for relationship data
         * @param {Object} entity - The full entity object containing relationships
         * @returns {string} Rendered HTML
         */
        render(entity) {
            if (!entity) return '';

            const family = entity.family || {};
            const related = entity.relatedEntities || {};
            const allies = entity.allies || [];
            const enemies = entity.enemies || [];

            const hasFamily = this.hasAnyFamilyData(family);
            const hasRelated = this.hasAnyRelatedData(related);
            const hasAlliesEnemies = allies.length > 0 || enemies.length > 0;

            if (!hasFamily && !hasRelated && !hasAlliesEnemies) {
                return '';
            }

            return `
                <div class="rel-metadata-container">
                    ${hasFamily ? this.renderFamilySection(family, entity) : ''}
                    ${hasAlliesEnemies ? this.renderAlliesEnemies(allies, enemies) : ''}
                    ${hasRelated ? this.renderRelatedEntities(related) : ''}
                    ${this.showRelationshipGraph ? this.renderRelationshipGraph(entity) : ''}
                </div>
            `;
        }

        /**
         * Check if any family data exists
         */
        hasAnyFamilyData(family) {
            return family.parents?.length > 0 ||
                   family.children?.length > 0 ||
                   family.siblings?.length > 0 ||
                   family.consorts?.length > 0 ||
                   family.ancestors?.length > 0 ||
                   family.descendants?.length > 0;
        }

        /**
         * Check if any related entities exist
         */
        hasAnyRelatedData(related) {
            return related.deities?.length > 0 ||
                   related.heroes?.length > 0 ||
                   related.creatures?.length > 0 ||
                   related.places?.length > 0 ||
                   related.items?.length > 0 ||
                   related.concepts?.length > 0 ||
                   related.archetypes?.length > 0 ||
                   related.myths?.length > 0;
        }

        /**
         * Render family tree section
         */
        renderFamilySection(family, entity) {
            return `
                <div class="rel-family-section">
                    <h4 class="rel-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128106;</span>
                        Family Tree
                    </h4>

                    ${this.showFamilyTree ? this.renderFamilyTreeDiagram(family, entity) : ''}

                    <div class="family-groups-grid">
                        ${this.renderFamilyGroup(family.parents, 'Parents', '&#128102;&#128103;', 'parents')}
                        ${this.renderFamilyGroup(family.consorts, 'Consorts/Spouses', '&#128149;', 'consorts')}
                        ${this.renderFamilyGroup(family.siblings, 'Siblings', '&#128109;', 'siblings')}
                        ${this.renderFamilyGroup(family.children, 'Children', '&#128118;', 'children')}
                        ${this.renderFamilyGroup(family.ancestors, 'Notable Ancestors', '&#128100;', 'ancestors')}
                        ${this.renderFamilyGroup(family.descendants, 'Notable Descendants', '&#128101;', 'descendants')}
                    </div>

                    ${family.notes ? `
                        <div class="family-notes">
                            <strong>Notes:</strong> ${this.escapeHtml(family.notes)}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render family tree diagram visualization
         */
        renderFamilyTreeDiagram(family, entity) {
            const treeData = this.prepareFamilyTreeData(family, entity);

            return `
                <div class="family-tree-container"
                     id="family-tree-${Date.now()}"
                     data-tree-config='${JSON.stringify(treeData)}'>
                    <div class="tree-placeholder-overlay">
                        <div class="tree-loading-content">
                            <div class="tree-icon-large" aria-hidden="true">&#127795;</div>
                            <p>Interactive family tree</p>
                            <button class="btn-load-family-tree"
                                    onclick="window.loadFamilyTreeDiagram && window.loadFamilyTreeDiagram(this.closest('.family-tree-container'))">
                                <span class="btn-icon" aria-hidden="true">&#128101;</span>
                                Load Family Tree
                            </button>
                        </div>
                    </div>
                    <div class="tree-render-target"></div>

                    <!-- Simple fallback diagram -->
                    <div class="tree-simple-fallback">
                        ${this.renderSimpleFamilyDiagram(family, entity)}
                    </div>
                </div>
            `;
        }

        /**
         * Render simplified family diagram (fallback)
         */
        renderSimpleFamilyDiagram(family, entity) {
            return `
                <div class="simple-family-diagram">
                    <!-- Ancestors/Parents Row -->
                    ${family.parents?.length > 0 ? `
                        <div class="diagram-row diagram-parents">
                            ${family.parents.map(p => this.renderDiagramNode(p, 'parent')).join('')}
                        </div>
                        <div class="diagram-connector vertical"></div>
                    ` : ''}

                    <!-- Central Entity Row -->
                    <div class="diagram-row diagram-center">
                        ${family.siblings?.filter(s => this.isBefore(s, entity)).map(s => this.renderDiagramNode(s, 'sibling')).join('')}

                        <div class="diagram-entity-self">
                            <div class="self-icon" aria-hidden="true">${entity.icon ? this.renderIcon(entity.icon) : '&#9733;'}</div>
                            <span class="self-name">${this.escapeHtml(entity.name)}</span>
                            <span class="self-badge">Current</span>
                        </div>

                        ${family.consorts?.length > 0 ? `
                            <div class="diagram-connector horizontal"></div>
                            ${family.consorts.map(c => this.renderDiagramNode(c, 'consort')).join('')}
                        ` : ''}

                        ${family.siblings?.filter(s => !this.isBefore(s, entity)).map(s => this.renderDiagramNode(s, 'sibling')).join('')}
                    </div>

                    <!-- Children Row -->
                    ${family.children?.length > 0 ? `
                        <div class="diagram-connector vertical"></div>
                        <div class="diagram-row diagram-children">
                            ${family.children.map(c => this.renderDiagramNode(c, 'child')).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render a node in the family diagram
         */
        renderDiagramNode(entity, relation) {
            if (!entity) return '';

            const name = typeof entity === 'string' ? entity : entity.name;
            const id = typeof entity === 'object' ? entity.id : null;
            const icon = typeof entity === 'object' ? entity.icon : null;
            const url = id ? this.getEntityUrl(entity) : '#';

            return `
                <a href="${this.escapeAttr(url)}" class="diagram-node node-${relation}" data-entity-id="${this.escapeAttr(id || '')}">
                    <div class="node-icon" aria-hidden="true">${icon ? this.renderIcon(icon) : this.getRelationIcon(relation)}</div>
                    <span class="node-name">${this.escapeHtml(name)}</span>
                    <span class="node-relation">${this.formatRelation(relation)}</span>
                </a>
            `;
        }

        /**
         * Simple helper to determine order
         */
        isBefore(entity, reference) {
            // Simple alphabetical ordering as fallback
            const nameA = typeof entity === 'string' ? entity : entity.name || '';
            const nameB = reference.name || '';
            return nameA.localeCompare(nameB) < 0;
        }

        /**
         * Render a family group
         */
        renderFamilyGroup(members, title, icon, relation) {
            if (!members || members.length === 0) return '';

            return `
                <div class="family-group family-${relation}">
                    <h5 class="group-title">
                        <span class="group-icon" aria-hidden="true">${icon}</span>
                        ${title}
                    </h5>
                    <div class="group-members">
                        ${members.map(member => this.renderFamilyMember(member, relation)).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render a single family member
         */
        renderFamilyMember(member, relation) {
            if (!member) return '';

            const name = typeof member === 'string' ? member : member.name;
            const id = typeof member === 'object' ? member.id : null;
            const icon = typeof member === 'object' ? member.icon : null;
            const mythology = typeof member === 'object' ? member.mythology : null;
            const relationship = typeof member === 'object' ? member.relationship : null;
            const url = id ? this.getEntityUrl(member) : '#';

            return `
                <a href="${this.escapeAttr(url)}"
                   class="family-member-card"
                   data-entity-id="${this.escapeAttr(id || '')}"
                   data-relation="${relation}">
                    <div class="member-icon" aria-hidden="true">
                        ${icon ? this.renderIcon(icon) : this.getRelationIcon(relation)}
                    </div>
                    <div class="member-info">
                        <span class="member-name">${this.escapeHtml(name)}</span>
                        ${mythology ? `<span class="member-mythology">${this.escapeHtml(mythology)}</span>` : ''}
                        ${relationship ? `<span class="member-relationship">${this.escapeHtml(relationship)}</span>` : ''}
                    </div>
                </a>
            `;
        }

        /**
         * Render allies and enemies section
         */
        renderAlliesEnemies(allies, enemies) {
            return `
                <div class="rel-allies-enemies-section">
                    <h4 class="rel-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#9876;</span>
                        Allies &amp; Enemies
                    </h4>
                    <div class="allies-enemies-grid">
                        ${allies.length > 0 ? `
                            <div class="allies-group">
                                <h5 class="group-title allies-title">
                                    <span class="group-icon" aria-hidden="true">&#129309;</span>
                                    Allies
                                </h5>
                                <div class="group-members">
                                    ${allies.map(ally => this.renderAllyEnemy(ally, 'ally')).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${enemies.length > 0 ? `
                            <div class="enemies-group">
                                <h5 class="group-title enemies-title">
                                    <span class="group-icon" aria-hidden="true">&#128481;</span>
                                    Enemies
                                </h5>
                                <div class="group-members">
                                    ${enemies.map(enemy => this.renderAllyEnemy(enemy, 'enemy')).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render a single ally or enemy
         */
        renderAllyEnemy(entity, type) {
            if (!entity) return '';

            const name = typeof entity === 'string' ? entity : entity.name;
            const id = typeof entity === 'object' ? entity.id : null;
            const icon = typeof entity === 'object' ? entity.icon : null;
            const reason = typeof entity === 'object' ? entity.reason || entity.description : null;
            const url = id ? this.getEntityUrl(entity) : '#';

            return `
                <a href="${this.escapeAttr(url)}"
                   class="relation-card relation-${type}"
                   data-entity-id="${this.escapeAttr(id || '')}">
                    <div class="relation-icon ${type}-icon" aria-hidden="true">
                        ${icon ? this.renderIcon(icon) : (type === 'ally' ? '&#129309;' : '&#128481;')}
                    </div>
                    <div class="relation-info">
                        <span class="relation-name">${this.escapeHtml(name)}</span>
                        ${reason ? `<span class="relation-reason">${this.escapeHtml(reason)}</span>` : ''}
                    </div>
                </a>
            `;
        }

        /**
         * Render related entities section
         */
        renderRelatedEntities(related) {
            const categories = [
                { key: 'deities', label: 'Related Deities', icon: '&#128081;' },
                { key: 'heroes', label: 'Related Heroes', icon: '&#129409;' },
                { key: 'creatures', label: 'Related Creatures', icon: '&#128009;' },
                { key: 'places', label: 'Related Places', icon: '&#127963;' },
                { key: 'items', label: 'Related Items', icon: '&#9876;' },
                { key: 'concepts', label: 'Related Concepts', icon: '&#128161;' },
                { key: 'archetypes', label: 'Related Archetypes', icon: '&#127917;' },
                { key: 'myths', label: 'Associated Myths', icon: '&#128220;' },
                { key: 'rituals', label: 'Associated Rituals', icon: '&#128722;' },
                { key: 'symbols', label: 'Associated Symbols', icon: '&#10070;' }
            ];

            const hasAny = categories.some(cat => related[cat.key]?.length > 0);
            if (!hasAny) return '';

            return `
                <div class="rel-related-entities-section">
                    <h4 class="rel-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128279;</span>
                        Related Entities
                    </h4>
                    <div class="related-categories-grid">
                        ${categories.map(cat => this.renderRelatedCategory(related[cat.key], cat)).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render a category of related entities
         */
        renderRelatedCategory(entities, category) {
            if (!entities || entities.length === 0) return '';

            const visibleEntities = entities.slice(0, this.maxRelatedVisible);
            const hasMore = entities.length > this.maxRelatedVisible;

            return `
                <div class="related-category related-${category.key}">
                    <h5 class="category-title">
                        <span class="category-icon" aria-hidden="true">${category.icon}</span>
                        ${category.label}
                        <span class="category-count">(${entities.length})</span>
                    </h5>
                    <div class="category-entities">
                        ${visibleEntities.map(entity => this.renderRelatedEntity(entity, category.key)).join('')}
                    </div>
                    ${hasMore ? `
                        <button class="btn-show-more" data-category="${category.key}">
                            Show ${entities.length - this.maxRelatedVisible} more
                        </button>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render a single related entity card
         */
        renderRelatedEntity(entity, type) {
            if (!entity) return '';

            const name = typeof entity === 'string' ? entity : entity.name;
            const id = typeof entity === 'object' ? entity.id : null;
            const icon = typeof entity === 'object' ? entity.icon : null;
            const relationship = typeof entity === 'object' ? entity.relationship : null;
            const mythology = typeof entity === 'object' ? entity.mythology : null;
            const url = id ? this.getEntityUrl(entity, type) : '#';

            return `
                <a href="${this.escapeAttr(url)}"
                   class="related-entity-card"
                   data-entity-id="${this.escapeAttr(id || '')}"
                   data-entity-type="${type.replace(/s$/, '')}">
                    <div class="entity-icon" aria-hidden="true">
                        ${icon ? this.renderIcon(icon) : this.getCategoryIcon(type)}
                    </div>
                    <div class="entity-info">
                        <span class="entity-name">${this.escapeHtml(name)}</span>
                        ${relationship ? `<span class="entity-relationship">${this.escapeHtml(relationship)}</span>` : ''}
                        ${mythology ? `<span class="entity-mythology">${this.capitalize(mythology)}</span>` : ''}
                    </div>
                </a>
            `;
        }

        /**
         * Render relationship graph visualization
         */
        renderRelationshipGraph(entity) {
            const graphData = this.prepareGraphData(entity);

            if (graphData.nodes.length < 2) return '';

            return `
                <div class="rel-graph-section">
                    <h4 class="rel-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128424;</span>
                        Relationship Graph
                    </h4>
                    <div class="graph-container"
                         id="rel-graph-${Date.now()}"
                         data-graph-config='${JSON.stringify(graphData)}'>
                        <div class="graph-placeholder-overlay">
                            <div class="graph-loading-content">
                                <div class="graph-icon-large" aria-hidden="true">&#128424;</div>
                                <p>Interactive relationship graph with ${graphData.nodes.length} entities</p>
                                <button class="btn-load-graph"
                                        onclick="window.loadRelationshipGraph && window.loadRelationshipGraph(this.closest('.graph-container'))">
                                    <span class="btn-icon" aria-hidden="true">&#128279;</span>
                                    Load Relationship Graph
                                </button>
                            </div>
                        </div>
                        <div class="graph-render-target"></div>
                    </div>
                    <div class="graph-legend">
                        <span class="legend-item legend-family">
                            <span class="legend-line family"></span>
                            Family
                        </span>
                        <span class="legend-item legend-ally">
                            <span class="legend-line ally"></span>
                            Ally
                        </span>
                        <span class="legend-item legend-enemy">
                            <span class="legend-line enemy"></span>
                            Enemy
                        </span>
                        <span class="legend-item legend-related">
                            <span class="legend-line related"></span>
                            Related
                        </span>
                    </div>
                </div>
            `;
        }

        /**
         * Prepare data for relationship graph
         */
        prepareGraphData(entity) {
            const nodes = [];
            const edges = [];
            const addedIds = new Set();

            // Add central entity
            const centralId = entity.id || 'central';
            nodes.push({
                id: centralId,
                label: entity.name,
                type: 'central',
                icon: entity.icon
            });
            addedIds.add(centralId);

            // Helper to add node and edge
            const addRelation = (related, relationType) => {
                if (!related) return;

                const items = Array.isArray(related) ? related : [related];
                items.forEach(item => {
                    const itemId = typeof item === 'object' ? item.id : item;
                    const itemName = typeof item === 'object' ? item.name : item;

                    if (!addedIds.has(itemId)) {
                        nodes.push({
                            id: itemId || itemName,
                            label: itemName,
                            type: relationType,
                            icon: typeof item === 'object' ? item.icon : null
                        });
                        addedIds.add(itemId || itemName);
                    }

                    edges.push({
                        source: centralId,
                        target: itemId || itemName,
                        type: relationType,
                        label: typeof item === 'object' ? item.relationship : null
                    });
                });
            };

            // Add family relations
            const family = entity.family || {};
            addRelation(family.parents, 'parent');
            addRelation(family.children, 'child');
            addRelation(family.siblings, 'sibling');
            addRelation(family.consorts, 'consort');

            // Add allies and enemies
            addRelation(entity.allies, 'ally');
            addRelation(entity.enemies, 'enemy');

            // Add related entities (limit to avoid overcrowding)
            const related = entity.relatedEntities || {};
            Object.entries(related).forEach(([type, items]) => {
                if (items && items.length > 0) {
                    addRelation(items.slice(0, 5), type.replace(/s$/, ''));
                }
            });

            return {
                nodes,
                edges,
                provider: this.graphProvider
            };
        }

        /**
         * Prepare family tree data
         */
        prepareFamilyTreeData(family, entity) {
            return {
                central: {
                    id: entity.id,
                    name: entity.name,
                    icon: entity.icon
                },
                parents: family.parents || [],
                children: family.children || [],
                siblings: family.siblings || [],
                consorts: family.consorts || [],
                provider: this.graphProvider
            };
        }

        /**
         * Get entity URL
         */
        getEntityUrl(entity, type) {
            if (entity.url) return entity.url;
            const mythology = entity.mythology || 'shared';
            const entityType = type?.replace(/s$/, '') || entity.type || 'entity';
            return `${this.baseUrl}#/mythos/${mythology}/${entityType}s/${entity.id}`;
        }

        /**
         * Get relation icon
         */
        getRelationIcon(relation) {
            const icons = {
                'parent': '&#128102;',
                'parents': '&#128102;',
                'child': '&#128118;',
                'children': '&#128118;',
                'sibling': '&#128109;',
                'siblings': '&#128109;',
                'consort': '&#128149;',
                'consorts': '&#128149;',
                'ancestor': '&#128100;',
                'ancestors': '&#128100;',
                'descendant': '&#128101;',
                'descendants': '&#128101;',
                'ally': '&#129309;',
                'enemy': '&#128481;'
            };
            return icons[relation] || '&#128100;';
        }

        /**
         * Get category icon
         */
        getCategoryIcon(type) {
            const icons = {
                'deities': '&#128081;',
                'deity': '&#128081;',
                'heroes': '&#129409;',
                'hero': '&#129409;',
                'creatures': '&#128009;',
                'creature': '&#128009;',
                'places': '&#127963;',
                'place': '&#127963;',
                'items': '&#9876;',
                'item': '&#9876;',
                'concepts': '&#128161;',
                'concept': '&#128161;',
                'archetypes': '&#127917;',
                'archetype': '&#127917;',
                'myths': '&#128220;',
                'myth': '&#128220;',
                'rituals': '&#128722;',
                'ritual': '&#128722;',
                'symbols': '&#10070;',
                'symbol': '&#10070;'
            };
            return icons[type] || '&#9733;';
        }

        /**
         * Format relation for display
         */
        formatRelation(relation) {
            const labels = {
                'parent': 'Parent',
                'child': 'Child',
                'sibling': 'Sibling',
                'consort': 'Consort',
                'ancestor': 'Ancestor',
                'descendant': 'Descendant',
                'ally': 'Ally',
                'enemy': 'Enemy'
            };
            return labels[relation] || this.capitalize(relation);
        }

        /**
         * Check if string is SVG
         */
        isSvg(str) {
            if (!str || typeof str !== 'string') return false;
            return str.trim().toLowerCase().startsWith('<svg');
        }

        /**
         * Render icon
         */
        renderIcon(icon) {
            if (!icon) return '';
            if (this.isSvg(icon)) return icon;
            return this.escapeHtml(icon);
        }

        /**
         * Capitalize string
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
        }

        /**
         * Escape HTML special characters
         */
        escapeHtml(text) {
            if (!text) return '';
            if (typeof text !== 'string') text = String(text);
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Escape attribute value
         */
        escapeAttr(text) {
            if (!text) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
    }

    // Export to window
    window.MetadataRelationships = MetadataRelationships;

})();
