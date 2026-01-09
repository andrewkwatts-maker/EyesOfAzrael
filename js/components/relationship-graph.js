/**
 * Relationship Graph Component
 *
 * Renders visual relationship maps for mythological entities.
 * Supports various relationship types including family trees,
 * alliances, rivalries, and mythological connections.
 *
 * Features:
 * - Interactive relationship visualization
 * - Multiple layout modes (tree, radial, grid)
 * - Relationship type styling
 * - Click-to-navigate functionality
 * - Responsive design
 * - Accessible markup
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    class RelationshipGraph {
        constructor(options = {}) {
            this.options = {
                containerClass: 'relationship-graph',
                layout: options.layout || 'radial', // 'radial', 'tree', 'grid', 'force'
                showLabels: options.showLabels !== false,
                interactive: options.interactive !== false,
                maxDepth: options.maxDepth || 2,
                compactMode: options.compactMode || false,
                onEntityClick: options.onEntityClick || null,
                ...options
            };

            // Relationship type configurations
            this.relationshipTypes = {
                // Family relationships
                father: { label: 'Father', icon: '\u{1F468}', color: '#4CAF50', lineStyle: 'solid', group: 'family' },
                mother: { label: 'Mother', icon: '\u{1F469}', color: '#4CAF50', lineStyle: 'solid', group: 'family' },
                parent: { label: 'Parent', icon: '\u{1F9D1}\u200D\u{1F467}', color: '#4CAF50', lineStyle: 'solid', group: 'family' },
                child: { label: 'Child', icon: '\u{1F476}', color: '#4CAF50', lineStyle: 'solid', group: 'family' },
                son: { label: 'Son', icon: '\u{1F466}', color: '#4CAF50', lineStyle: 'solid', group: 'family' },
                daughter: { label: 'Daughter', icon: '\u{1F467}', color: '#4CAF50', lineStyle: 'solid', group: 'family' },
                sibling: { label: 'Sibling', icon: '\u{1F46C}', color: '#2196F3', lineStyle: 'solid', group: 'family' },
                brother: { label: 'Brother', icon: '\u{1F468}', color: '#2196F3', lineStyle: 'solid', group: 'family' },
                sister: { label: 'Sister', icon: '\u{1F469}', color: '#2196F3', lineStyle: 'solid', group: 'family' },
                spouse: { label: 'Spouse', icon: '\u{1F48D}', color: '#E91E63', lineStyle: 'double', group: 'family' },
                consort: { label: 'Consort', icon: '\u{1F48D}', color: '#E91E63', lineStyle: 'dashed', group: 'family' },
                lover: { label: 'Lover', icon: '\u2764\uFE0F', color: '#E91E63', lineStyle: 'dotted', group: 'family' },
                offspring: { label: 'Offspring', icon: '\u{1F476}', color: '#4CAF50', lineStyle: 'solid', group: 'family' },

                // Associations
                ally: { label: 'Ally', icon: '\u{1F91D}', color: '#4CAF50', lineStyle: 'dashed', group: 'association' },
                enemy: { label: 'Enemy', icon: '\u2694\uFE0F', color: '#F44336', lineStyle: 'dotted', group: 'association' },
                rival: { label: 'Rival', icon: '\u{1F94A}', color: '#FF9800', lineStyle: 'dotted', group: 'association' },
                companion: { label: 'Companion', icon: '\u{1F465}', color: '#00BCD4', lineStyle: 'solid', group: 'association' },
                servant: { label: 'Servant', icon: '\u{1F64F}', color: '#9E9E9E', lineStyle: 'dashed', group: 'association' },
                master: { label: 'Master', icon: '\u{1F451}', color: '#FFD700', lineStyle: 'dashed', group: 'association' },
                worshipper: { label: 'Worshipper', icon: '\u{1F64F}', color: '#7E57C2', lineStyle: 'dotted', group: 'association' },

                // Mentorship
                mentor: { label: 'Mentor', icon: '\u{1F9D9}', color: '#9C27B0', lineStyle: 'dashed', group: 'mentor' },
                student: { label: 'Student', icon: '\u{1F4DA}', color: '#9C27B0', lineStyle: 'dashed', group: 'mentor' },
                teacher: { label: 'Teacher', icon: '\u{1F9D1}\u200D\u{1F3EB}', color: '#9C27B0', lineStyle: 'dashed', group: 'mentor' },

                // Mythological
                creator: { label: 'Creator', icon: '\u2728', color: '#FFD700', lineStyle: 'solid', group: 'mythological' },
                creation: { label: 'Creation', icon: '\u{1F31F}', color: '#FFD700', lineStyle: 'solid', group: 'mythological' },
                slayer: { label: 'Slayer', icon: '\u{1F5E1}\uFE0F', color: '#F44336', lineStyle: 'solid', group: 'mythological' },
                victim: { label: 'Victim', icon: '\u{1F480}', color: '#607D8B', lineStyle: 'solid', group: 'mythological' },
                aspect: { label: 'Aspect', icon: '\u{1F3AD}', color: '#673AB7', lineStyle: 'dotted', group: 'mythological' },
                avatar: { label: 'Avatar', icon: '\u{1F3AD}', color: '#673AB7', lineStyle: 'dotted', group: 'mythological' },
                syncretism: { label: 'Syncretism', icon: '\u{1F517}', color: '#795548', lineStyle: 'dashed', group: 'mythological' },

                // Default
                related: { label: 'Related', icon: '\u{1F517}', color: '#9E9E9E', lineStyle: 'dotted', group: 'other' },
                default: { label: 'Connected', icon: '\u{1F517}', color: '#9E9E9E', lineStyle: 'dotted', group: 'other' }
            };

            // Entity type icons
            this.entityTypeIcons = {
                deity: '\u{1F451}',
                god: '\u{1F451}',
                goddess: '\u{1F451}',
                hero: '\u2694\uFE0F',
                demigod: '\u{1F31F}',
                creature: '\u{1F409}',
                monster: '\u{1F479}',
                giant: '\u{1F9CC}',
                titan: '\u26C8\uFE0F',
                spirit: '\u{1F47B}',
                nymph: '\u{1F9DA}',
                mortal: '\u{1F9D1}',
                place: '\u{1F3DB}\uFE0F',
                item: '\u{1F48E}',
                default: '\u2B50'
            };
        }

        /**
         * Render a complete relationship graph
         * @param {Object} entity - Central entity
         * @param {Object} relationships - Relationships object
         * @returns {string} HTML string
         */
        render(entity, relationships = null) {
            if (!entity) {
                return this.renderEmpty('No entity data provided');
            }

            const rels = relationships || entity.relationships || this.extractRelationships(entity);
            const nodes = this.buildNodes(entity, rels);

            if (nodes.length <= 1) {
                return this.renderEmpty('No relationships to display');
            }

            const layout = this.options.layout;

            return `
                <div class="${this.options.containerClass} rg-layout--${layout}"
                     data-node-count="${nodes.length}"
                     role="figure"
                     aria-label="Relationship graph for ${this.escapeHtml(entity.name || 'entity')}">
                    ${this.renderGraphByLayout(entity, nodes, layout)}
                    ${this.options.showLabels ? this.renderLegend(nodes) : ''}
                </div>
            `;
        }

        /**
         * Render family tree specifically
         * @param {Object} entity - Central entity
         * @returns {string} HTML string
         */
        renderFamilyTree(entity) {
            if (!entity) return this.renderEmpty('No entity data provided');

            const family = this.extractFamilyRelationships(entity);
            if (Object.keys(family).length === 0) {
                return this.renderEmpty('No family relationships found');
            }

            return `
                <div class="${this.options.containerClass} rg-family-tree">
                    <h4 class="rg-title">Family Tree</h4>
                    ${this.renderFamilyTreeStructure(entity, family)}
                </div>
            `;
        }

        /**
         * Render connections grid (simplified view)
         * @param {Object} entity - Central entity
         * @param {Object} relationships - Relationships object
         * @returns {string} HTML string
         */
        renderConnectionsGrid(entity, relationships = null) {
            const rels = relationships || entity.relationships || this.extractRelationships(entity);
            const groups = this.groupRelationshipsByType(rels);

            if (Object.keys(groups).length === 0) {
                return this.renderEmpty('No connections to display');
            }

            return `
                <div class="${this.options.containerClass} rg-connections-grid">
                    ${Object.entries(groups).map(([groupName, items]) => `
                        <div class="rg-connection-group" data-group="${groupName}">
                            <h4 class="rg-group-title">${this.capitalize(groupName)}</h4>
                            <div class="rg-group-items">
                                ${items.map(item => this.renderConnectionCard(item)).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        /**
         * Build nodes from entity and relationships
         */
        buildNodes(entity, relationships) {
            const nodes = [];

            // Add central entity
            nodes.push({
                id: entity.id || 'central',
                name: entity.name || 'Unknown',
                type: entity.type || 'deity',
                icon: entity.icon,
                isCentral: true
            });

            // Add related entities
            Object.entries(relationships).forEach(([relType, relData]) => {
                const items = Array.isArray(relData) ? relData : [relData];
                items.forEach(item => {
                    if (item && (typeof item === 'string' || item.name || item.id)) {
                        nodes.push({
                            id: item.id || this.slugify(typeof item === 'string' ? item : item.name),
                            name: typeof item === 'string' ? item : (item.name || item.id),
                            type: item.type || this.inferTypeFromRelationship(relType),
                            icon: item.icon,
                            relationshipType: relType,
                            url: item.url,
                            isCentral: false
                        });
                    }
                });
            });

            return nodes;
        }

        /**
         * Render graph by layout type
         */
        renderGraphByLayout(entity, nodes, layout) {
            switch (layout) {
                case 'radial':
                    return this.renderRadialLayout(entity, nodes);
                case 'tree':
                    return this.renderTreeLayout(entity, nodes);
                case 'grid':
                    return this.renderGridLayout(entity, nodes);
                default:
                    return this.renderRadialLayout(entity, nodes);
            }
        }

        /**
         * Render radial layout
         */
        renderRadialLayout(entity, nodes) {
            const central = nodes.find(n => n.isCentral);
            const related = nodes.filter(n => !n.isCentral);
            const angleStep = 360 / related.length;

            return `
                <div class="rg-radial">
                    <div class="rg-radial-center">
                        ${this.renderCentralNode(central)}
                    </div>
                    <div class="rg-radial-orbit" data-count="${related.length}">
                        ${related.map((node, index) => {
                            const angle = index * angleStep;
                            const relConfig = this.relationshipTypes[node.relationshipType] || this.relationshipTypes.default;
                            return `
                                <div class="rg-radial-node" style="--angle: ${angle}deg; --rel-color: ${relConfig.color}">
                                    <div class="rg-connection-line" style="--line-style: ${relConfig.lineStyle}"></div>
                                    ${this.renderNode(node)}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render tree layout
         */
        renderTreeLayout(entity, nodes) {
            const central = nodes.find(n => n.isCentral);
            const grouped = this.groupNodesByRelationship(nodes.filter(n => !n.isCentral));

            return `
                <div class="rg-tree">
                    <!-- Ancestors (parents, grandparents) -->
                    ${grouped.ancestors.length > 0 ? `
                        <div class="rg-tree-level rg-tree-ancestors">
                            ${grouped.ancestors.map(node => this.renderNode(node)).join('')}
                        </div>
                    ` : ''}

                    <!-- Central entity with siblings -->
                    <div class="rg-tree-level rg-tree-center">
                        ${grouped.siblings.length > 0 ? `
                            <div class="rg-siblings-left">
                                ${grouped.siblings.slice(0, Math.ceil(grouped.siblings.length / 2)).map(node => this.renderNode(node)).join('')}
                            </div>
                        ` : ''}
                        ${this.renderCentralNode(central)}
                        ${grouped.siblings.length > 0 ? `
                            <div class="rg-siblings-right">
                                ${grouped.siblings.slice(Math.ceil(grouped.siblings.length / 2)).map(node => this.renderNode(node)).join('')}
                            </div>
                        ` : ''}
                        ${grouped.spouses.length > 0 ? `
                            <div class="rg-spouses">
                                ${grouped.spouses.map(node => this.renderNode(node, 'spouse')).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Descendants (children, grandchildren) -->
                    ${grouped.descendants.length > 0 ? `
                        <div class="rg-tree-level rg-tree-descendants">
                            ${grouped.descendants.map(node => this.renderNode(node)).join('')}
                        </div>
                    ` : ''}

                    <!-- Other relationships -->
                    ${grouped.other.length > 0 ? `
                        <div class="rg-tree-level rg-tree-other">
                            <h5 class="rg-tree-other-title">Other Connections</h5>
                            <div class="rg-tree-other-nodes">
                                ${grouped.other.map(node => this.renderNode(node)).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render grid layout
         */
        renderGridLayout(entity, nodes) {
            const central = nodes.find(n => n.isCentral);
            const related = nodes.filter(n => !n.isCentral);
            const grouped = this.groupByRelationshipGroup(related);

            return `
                <div class="rg-grid">
                    <div class="rg-grid-center">
                        ${this.renderCentralNode(central)}
                    </div>
                    <div class="rg-grid-groups">
                        ${Object.entries(grouped).map(([group, groupNodes]) => `
                            <div class="rg-grid-group" data-group="${group}">
                                <h5 class="rg-grid-group-title">${this.capitalize(group)}</h5>
                                <div class="rg-grid-group-items">
                                    ${groupNodes.map(node => this.renderNode(node)).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render central node
         */
        renderCentralNode(node) {
            const icon = this.getNodeIcon(node);

            return `
                <div class="rg-node rg-node--central" data-entity-id="${this.escapeHtml(node.id)}">
                    <div class="rg-node-icon rg-node-icon--large">
                        ${icon}
                    </div>
                    <span class="rg-node-name">${this.escapeHtml(node.name)}</span>
                    <span class="rg-node-type">${this.capitalize(node.type)}</span>
                </div>
            `;
        }

        /**
         * Render regular node
         */
        renderNode(node, extraClass = '') {
            const icon = this.getNodeIcon(node);
            const relConfig = this.relationshipTypes[node.relationshipType] || this.relationshipTypes.default;
            const isClickable = this.options.interactive && (node.url || this.options.onEntityClick);

            const tag = isClickable ? 'a' : 'div';
            const href = isClickable && node.url ? `href="${this.escapeHtml(node.url)}"` : '';
            const cursor = isClickable ? 'cursor: pointer;' : '';

            return `
                <${tag} class="rg-node rg-node--related ${extraClass}"
                     data-entity-id="${this.escapeHtml(node.id)}"
                     data-relationship="${node.relationshipType || 'related'}"
                     style="--rel-color: ${relConfig.color}; ${cursor}"
                     ${href}
                     title="${this.escapeHtml(relConfig.label)}: ${this.escapeHtml(node.name)}">
                    <div class="rg-node-badge" aria-hidden="true">${relConfig.icon}</div>
                    <div class="rg-node-icon">
                        ${icon}
                    </div>
                    <span class="rg-node-name">${this.escapeHtml(node.name)}</span>
                    <span class="rg-node-rel-label">${relConfig.label}</span>
                </${tag}>
            `;
        }

        /**
         * Render connection card (for grid view)
         */
        renderConnectionCard(item) {
            const relConfig = this.relationshipTypes[item.relationshipType] || this.relationshipTypes.default;
            const isClickable = this.options.interactive && (item.url || this.options.onEntityClick);

            return `
                <div class="rg-connection-card ${isClickable ? 'rg-connection-card--clickable' : ''}"
                     data-entity-id="${this.escapeHtml(item.id || '')}"
                     data-relationship="${item.relationshipType || 'related'}"
                     style="--rel-color: ${relConfig.color}">
                    <span class="rg-connection-icon">${relConfig.icon}</span>
                    <div class="rg-connection-info">
                        <span class="rg-connection-name">${this.escapeHtml(item.name || item.id || '')}</span>
                        <span class="rg-connection-type">${relConfig.label}</span>
                    </div>
                </div>
            `;
        }

        /**
         * Render family tree structure
         */
        renderFamilyTreeStructure(entity, family) {
            return `
                <div class="rg-family-structure">
                    <!-- Parents -->
                    ${family.parents?.length > 0 ? `
                        <div class="rg-family-row rg-family-parents">
                            ${family.parents.map(p => this.renderFamilyMember(p, 'parent')).join('')}
                        </div>
                        <div class="rg-family-connector rg-family-connector--down"></div>
                    ` : ''}

                    <!-- Central with spouse(s) -->
                    <div class="rg-family-row rg-family-central-row">
                        ${family.spouses?.length > 0 ? `
                            <div class="rg-family-spouses-left">
                                ${family.spouses.slice(0, 1).map(s => this.renderFamilyMember(s, 'spouse')).join('')}
                            </div>
                            <div class="rg-family-connector rg-family-connector--spouse"></div>
                        ` : ''}

                        <div class="rg-family-central">
                            ${this.renderFamilyMember({ name: entity.name, type: entity.type, icon: entity.icon }, 'central')}
                        </div>

                        ${family.siblings?.length > 0 ? `
                            <div class="rg-family-connector rg-family-connector--sibling"></div>
                            <div class="rg-family-siblings">
                                ${family.siblings.map(s => this.renderFamilyMember(s, 'sibling')).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Children -->
                    ${family.children?.length > 0 ? `
                        <div class="rg-family-connector rg-family-connector--down"></div>
                        <div class="rg-family-row rg-family-children">
                            ${family.children.map(c => this.renderFamilyMember(c, 'child')).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render family member
         */
        renderFamilyMember(member, relType) {
            const relConfig = this.relationshipTypes[relType] || this.relationshipTypes.default;
            const isCentral = relType === 'central';
            const icon = member.icon || this.entityTypeIcons[member.type] || this.entityTypeIcons.default;

            return `
                <div class="rg-family-member ${isCentral ? 'rg-family-member--central' : ''}"
                     data-relationship="${relType}"
                     style="--rel-color: ${relConfig.color}">
                    <div class="rg-family-member-icon">${icon}</div>
                    <span class="rg-family-member-name">${this.escapeHtml(member.name || '')}</span>
                    ${!isCentral ? `<span class="rg-family-member-rel">${relConfig.label}</span>` : ''}
                </div>
            `;
        }

        /**
         * Render legend
         */
        renderLegend(nodes) {
            const usedTypes = [...new Set(nodes.filter(n => !n.isCentral).map(n => n.relationshipType || 'default'))];
            if (usedTypes.length === 0) return '';

            return `
                <div class="rg-legend">
                    <h5 class="rg-legend-title">Legend</h5>
                    <div class="rg-legend-items">
                        ${usedTypes.map(type => {
                            const config = this.relationshipTypes[type] || this.relationshipTypes.default;
                            return `
                                <div class="rg-legend-item" style="--rel-color: ${config.color}">
                                    <span class="rg-legend-icon">${config.icon}</span>
                                    <span class="rg-legend-label">${config.label}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render empty state
         */
        renderEmpty(message) {
            return `
                <div class="${this.options.containerClass} rg-empty">
                    <p class="rg-empty-message">${this.escapeHtml(message)}</p>
                </div>
            `;
        }

        // ==================== HELPER METHODS ====================

        /**
         * Extract relationships from entity
         */
        extractRelationships(entity) {
            const rels = {};
            const relKeys = ['father', 'mother', 'parents', 'children', 'siblings', 'consorts', 'spouse',
                           'allies', 'enemies', 'rivals', 'companions', 'servants', 'worshippers',
                           'mentor', 'students', 'creator', 'creations'];

            relKeys.forEach(key => {
                if (entity[key] && (Array.isArray(entity[key]) ? entity[key].length > 0 : true)) {
                    rels[key] = entity[key];
                }
            });

            // Check parentage object
            if (entity.parentage) {
                if (entity.parentage.divine) rels.divine_parent = entity.parentage.divine;
                if (entity.parentage.mortal) rels.mortal_parent = entity.parentage.mortal;
            }

            return rels;
        }

        /**
         * Extract family relationships only
         */
        extractFamilyRelationships(entity) {
            const family = {};
            const rels = entity.relationships || {};

            // Parents
            const parents = [];
            if (rels.father) parents.push(this.normalizeEntity(rels.father, 'father'));
            if (rels.mother) parents.push(this.normalizeEntity(rels.mother, 'mother'));
            if (entity.father) parents.push(this.normalizeEntity(entity.father, 'father'));
            if (entity.mother) parents.push(this.normalizeEntity(entity.mother, 'mother'));
            if (rels.parents) parents.push(...this.normalizeEntities(rels.parents, 'parent'));
            if (parents.length > 0) family.parents = parents;

            // Spouses/Consorts
            const spouses = [];
            if (rels.spouse) spouses.push(...this.normalizeEntities(rels.spouse, 'spouse'));
            if (rels.consorts) spouses.push(...this.normalizeEntities(rels.consorts, 'consort'));
            if (entity.spouse) spouses.push(...this.normalizeEntities(entity.spouse, 'spouse'));
            if (entity.consorts) spouses.push(...this.normalizeEntities(entity.consorts, 'consort'));
            if (spouses.length > 0) family.spouses = spouses;

            // Siblings
            const siblings = [];
            if (rels.siblings) siblings.push(...this.normalizeEntities(rels.siblings, 'sibling'));
            if (entity.siblings) siblings.push(...this.normalizeEntities(entity.siblings, 'sibling'));
            if (siblings.length > 0) family.siblings = siblings;

            // Children
            const children = [];
            if (rels.children) children.push(...this.normalizeEntities(rels.children, 'child'));
            if (entity.children) children.push(...this.normalizeEntities(entity.children, 'child'));
            if (rels.offspring) children.push(...this.normalizeEntities(rels.offspring, 'child'));
            if (children.length > 0) family.children = children;

            return family;
        }

        /**
         * Normalize entity to standard format
         */
        normalizeEntity(entity, relType) {
            if (typeof entity === 'string') {
                return { name: entity, relationshipType: relType };
            }
            return { ...entity, relationshipType: relType };
        }

        /**
         * Normalize array of entities
         */
        normalizeEntities(entities, relType) {
            if (!entities) return [];
            const arr = Array.isArray(entities) ? entities : [entities];
            return arr.map(e => this.normalizeEntity(e, relType));
        }

        /**
         * Group relationships by type
         */
        groupRelationshipsByType(relationships) {
            const groups = {};

            Object.entries(relationships).forEach(([relType, items]) => {
                const config = this.relationshipTypes[relType] || this.relationshipTypes.default;
                const group = config.group || 'other';

                if (!groups[group]) groups[group] = [];

                const itemsArr = Array.isArray(items) ? items : [items];
                itemsArr.forEach(item => {
                    groups[group].push({
                        ...this.normalizeEntity(item, relType),
                        relationshipType: relType
                    });
                });
            });

            return groups;
        }

        /**
         * Group nodes by relationship for tree layout
         */
        groupNodesByRelationship(nodes) {
            return {
                ancestors: nodes.filter(n => ['father', 'mother', 'parent', 'divine_parent', 'mortal_parent'].includes(n.relationshipType)),
                siblings: nodes.filter(n => ['sibling', 'brother', 'sister'].includes(n.relationshipType)),
                spouses: nodes.filter(n => ['spouse', 'consort', 'lover'].includes(n.relationshipType)),
                descendants: nodes.filter(n => ['child', 'son', 'daughter', 'offspring'].includes(n.relationshipType)),
                other: nodes.filter(n => !['father', 'mother', 'parent', 'divine_parent', 'mortal_parent', 'sibling', 'brother', 'sister', 'spouse', 'consort', 'lover', 'child', 'son', 'daughter', 'offspring'].includes(n.relationshipType))
            };
        }

        /**
         * Group nodes by relationship group
         */
        groupByRelationshipGroup(nodes) {
            const groups = {};

            nodes.forEach(node => {
                const config = this.relationshipTypes[node.relationshipType] || this.relationshipTypes.default;
                const group = config.group || 'other';

                if (!groups[group]) groups[group] = [];
                groups[group].push(node);
            });

            return groups;
        }

        /**
         * Get node icon
         */
        getNodeIcon(node) {
            if (node.icon) {
                // Check if SVG
                if (node.icon.startsWith('<svg')) {
                    return node.icon;
                }
                return node.icon;
            }
            return this.entityTypeIcons[node.type] || this.entityTypeIcons.default;
        }

        /**
         * Infer entity type from relationship type
         */
        inferTypeFromRelationship(relType) {
            const familyRels = ['father', 'mother', 'parent', 'child', 'sibling', 'spouse', 'consort', 'offspring'];
            if (familyRels.includes(relType)) return 'deity';
            if (['enemy', 'rival', 'ally'].includes(relType)) return 'deity';
            if (['servant', 'worshipper'].includes(relType)) return 'mortal';
            return 'deity';
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
            return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
        }

        /**
         * Slugify string
         */
        slugify(str) {
            if (!str) return '';
            return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        /**
         * Initialize click handlers
         */
        initClickHandlers(container) {
            if (!this.options.onEntityClick) return;

            container.querySelectorAll('.rg-node--related, .rg-connection-card--clickable').forEach(node => {
                node.addEventListener('click', (e) => {
                    if (node.tagName === 'A') return; // Let links work normally
                    e.preventDefault();
                    const entityId = node.dataset.entityId;
                    const relationship = node.dataset.relationship;
                    this.options.onEntityClick({ id: entityId, relationship });
                });
            });
        }
    }

    // Export to window
    window.RelationshipGraph = RelationshipGraph;

    // Also export as module if supported
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RelationshipGraph;
    }

})();
