/**
 * Diagram Builder Component
 * Interactive diagram creation tool for visualizing mythological relationships
 *
 * Features:
 * - Entity relationship diagrams
 * - Family tree views (deity genealogies)
 * - Mythology comparison charts
 * - Timeline views for historical periods
 * - Drag and drop entity cards
 * - Connection lines with labels
 * - Auto-layout algorithms
 * - Export as SVG or PNG
 * - Save diagrams to user profile
 *
 * @version 1.0.0
 * @requires D3.js v7+
 */

(function() {
    'use strict';

    // Diagram type configurations
    const DIAGRAM_TYPES = {
        relationship: {
            name: 'Relationship Diagram',
            icon: '🔗',
            description: 'Visualize connections between entities',
            layout: 'force'
        },
        familyTree: {
            name: 'Family Tree',
            icon: '👨‍👩‍👧‍👦',
            description: 'Deity genealogies and lineages',
            layout: 'tree'
        },
        comparison: {
            name: 'Comparison Chart',
            icon: '⚖️',
            description: 'Compare entities across mythologies',
            layout: 'radial'
        },
        timeline: {
            name: 'Timeline',
            icon: '📅',
            description: 'Historical periods and events',
            layout: 'timeline'
        }
    };

    // Relationship types with colors
    const RELATIONSHIP_TYPES = {
        parent: { label: 'Parent of', color: '#3498db', icon: '⬆️' },
        child: { label: 'Child of', color: '#2ecc71', icon: '⬇️' },
        spouse: { label: 'Spouse', color: '#e74c3c', icon: '❤️' },
        sibling: { label: 'Sibling', color: '#9b59b6', icon: '↔️' },
        ally: { label: 'Ally', color: '#27ae60', icon: '🤝' },
        enemy: { label: 'Enemy', color: '#c0392b', icon: '⚔️' },
        creator: { label: 'Created by', color: '#f39c12', icon: '✨' },
        aspect: { label: 'Aspect of', color: '#1abc9c', icon: '🔄' },
        equivalent: { label: 'Equivalent to', color: '#8e44ad', icon: '≈' },
        successor: { label: 'Succeeded by', color: '#34495e', icon: '➡️' },
        custom: { label: 'Custom', color: '#95a5a6', icon: '🏷️' }
    };

    // Entity type icons
    const ENTITY_ICONS = {
        deity: '👑',
        hero: '🦸',
        creature: '🐉',
        place: '🏛️',
        item: '⚔️',
        concept: '💭',
        event: '📜',
        ritual: '🕯️',
        text: '📖',
        symbol: '☯️',
        default: '✨'
    };

    class DiagramBuilder {
        constructor(options = {}) {
            // Core references
            this.container = options.container || null;
            this.db = options.db || (window.firebase && firebase.firestore());
            this.auth = options.auth || (window.firebase && firebase.auth());

            // Diagram state
            this.diagramId = options.diagramId || null;
            this.diagramType = options.type || 'relationship';
            this.nodes = [];
            this.links = [];
            this.selectedNode = null;
            this.selectedLink = null;

            // Canvas settings
            this.width = options.width || 1200;
            this.height = options.height || 800;
            this.zoom = 1;
            this.panX = 0;
            this.panY = 0;

            // D3 references
            this.svg = null;
            this.mainGroup = null;
            this.simulation = null;

            // UI state
            this.isEditing = true;
            this.isDragging = false;
            this.isConnecting = false;
            this.connectSource = null;

            // Undo/redo history
            this.history = [];
            this.historyIndex = -1;
            this.maxHistory = 50;

            // Auto-save
            this.autoSaveEnabled = options.autoSave !== false;
            this.autoSaveInterval = options.autoSaveInterval || 30000; // 30 seconds
            this.autoSaveTimer = null;
            this.isDirty = false;

            // Event callbacks
            this.onNodeSelect = options.onNodeSelect || null;
            this.onLinkSelect = options.onLinkSelect || null;
            this.onDiagramSave = options.onDiagramSave || null;
            this.onDiagramLoad = options.onDiagramLoad || null;

            // Bind methods
            this._handleDragStart = this._handleDragStart.bind(this);
            this._handleDrag = this._handleDrag.bind(this);
            this._handleDragEnd = this._handleDragEnd.bind(this);
        }

        /**
         * Initialize the diagram builder
         */
        async init() {
            if (!this.container) {
                throw new Error('Container element required');
            }

            // Check for D3.js
            if (typeof d3 === 'undefined') {
                console.error('D3.js is required for DiagramBuilder');
                this._showError('D3.js library is required. Please include d3.js v7+');
                return;
            }

            // Build UI
            this._buildUI();

            // Initialize SVG canvas
            this._initCanvas();

            // Setup event listeners
            this._setupEventListeners();

            // Load diagram if ID provided
            if (this.diagramId) {
                await this.loadDiagram(this.diagramId);
            }

            // Start auto-save
            if (this.autoSaveEnabled) {
                this._startAutoSave();
            }

            console.log('[DiagramBuilder] Initialized');
        }

        /**
         * Build the main UI structure
         */
        _buildUI() {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (!containerEl) {
                throw new Error('Container element not found');
            }

            containerEl.innerHTML = `
                <div class="diagram-builder">
                    <!-- Toolbar -->
                    <div class="diagram-toolbar">
                        <div class="toolbar-section toolbar-left">
                            <button class="toolbar-btn" id="btnNewDiagram" title="New Diagram">
                                <span class="btn-icon">📄</span>
                                <span class="btn-label">New</span>
                            </button>
                            <button class="toolbar-btn" id="btnSave" title="Save Diagram">
                                <span class="btn-icon">💾</span>
                                <span class="btn-label">Save</span>
                            </button>
                            <button class="toolbar-btn" id="btnLoad" title="Load Diagram">
                                <span class="btn-icon">📂</span>
                                <span class="btn-label">Load</span>
                            </button>
                            <div class="toolbar-divider"></div>
                            <button class="toolbar-btn" id="btnUndo" title="Undo (Ctrl+Z)" disabled>
                                <span class="btn-icon">↩️</span>
                            </button>
                            <button class="toolbar-btn" id="btnRedo" title="Redo (Ctrl+Y)" disabled>
                                <span class="btn-icon">↪️</span>
                            </button>
                        </div>

                        <div class="toolbar-section toolbar-center">
                            <select id="diagramType" class="toolbar-select" title="Diagram Type">
                                ${Object.entries(DIAGRAM_TYPES).map(([key, type]) => `
                                    <option value="${key}" ${key === this.diagramType ? 'selected' : ''}>
                                        ${type.icon} ${type.name}
                                    </option>
                                `).join('')}
                            </select>
                            <input type="text" id="diagramTitle" class="diagram-title-input"
                                   placeholder="Untitled Diagram" value="" />
                        </div>

                        <div class="toolbar-section toolbar-right">
                            <button class="toolbar-btn" id="btnZoomIn" title="Zoom In">
                                <span class="btn-icon">🔍+</span>
                            </button>
                            <button class="toolbar-btn" id="btnZoomOut" title="Zoom Out">
                                <span class="btn-icon">🔍-</span>
                            </button>
                            <button class="toolbar-btn" id="btnFitView" title="Fit to View">
                                <span class="btn-icon">⬜</span>
                            </button>
                            <div class="toolbar-divider"></div>
                            <button class="toolbar-btn" id="btnAutoLayout" title="Auto Layout">
                                <span class="btn-icon">🎯</span>
                                <span class="btn-label">Layout</span>
                            </button>
                            <button class="toolbar-btn" id="btnExport" title="Export">
                                <span class="btn-icon">📥</span>
                                <span class="btn-label">Export</span>
                            </button>
                        </div>
                    </div>

                    <!-- Main Content Area -->
                    <div class="diagram-main">
                        <!-- Left Panel: Entity Palette -->
                        <div class="diagram-panel panel-left">
                            <div class="panel-header">
                                <h3>Add Entities</h3>
                                <button class="panel-toggle" id="toggleLeftPanel" title="Toggle Panel">◀</button>
                            </div>
                            <div class="panel-content">
                                <!-- Search -->
                                <div class="entity-search">
                                    <input type="text" id="entitySearch"
                                           placeholder="Search entities..."
                                           autocomplete="off" />
                                    <span class="search-icon">🔍</span>
                                </div>

                                <!-- Filters -->
                                <div class="entity-filters">
                                    <select id="mythologyFilter" class="filter-select">
                                        <option value="">All Mythologies</option>
                                    </select>
                                    <select id="typeFilter" class="filter-select">
                                        <option value="">All Types</option>
                                        <option value="deity">Deities</option>
                                        <option value="hero">Heroes</option>
                                        <option value="creature">Creatures</option>
                                        <option value="place">Places</option>
                                        <option value="item">Items</option>
                                    </select>
                                </div>

                                <!-- Entity List -->
                                <div id="entityList" class="entity-list">
                                    <div class="entity-list-placeholder">
                                        Search for entities to add to your diagram
                                    </div>
                                </div>

                                <!-- Recently Used -->
                                <div class="recently-used">
                                    <h4>Recently Added</h4>
                                    <div id="recentEntities" class="recent-entities-list">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Canvas -->
                        <div class="diagram-canvas-container" id="canvasContainer">
                            <div class="canvas-background"></div>
                            <div id="diagramCanvas" class="diagram-canvas"></div>

                            <!-- Canvas Controls Overlay -->
                            <div class="canvas-controls">
                                <div class="zoom-indicator" id="zoomIndicator">100%</div>
                            </div>

                            <!-- Help Overlay -->
                            <div class="canvas-help" id="canvasHelp">
                                <div class="help-content">
                                    <p><strong>Getting Started:</strong></p>
                                    <ul>
                                        <li>Search and drag entities from the left panel</li>
                                        <li>Click and drag between nodes to create connections</li>
                                        <li>Right-click nodes or links for more options</li>
                                        <li>Use mouse wheel to zoom, drag canvas to pan</li>
                                    </ul>
                                    <button class="dismiss-help" id="dismissHelp">Got it!</button>
                                </div>
                            </div>
                        </div>

                        <!-- Right Panel: Properties -->
                        <div class="diagram-panel panel-right">
                            <div class="panel-header">
                                <h3 id="propertiesPanelTitle">Properties</h3>
                                <button class="panel-toggle" id="toggleRightPanel" title="Toggle Panel">▶</button>
                            </div>
                            <div class="panel-content" id="propertiesContent">
                                <div class="properties-placeholder">
                                    Select a node or connection to view its properties
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Status Bar -->
                    <div class="diagram-statusbar">
                        <div class="status-left">
                            <span id="nodeCount">0 nodes</span>
                            <span class="status-divider">|</span>
                            <span id="linkCount">0 connections</span>
                        </div>
                        <div class="status-center">
                            <span id="saveStatus"></span>
                        </div>
                        <div class="status-right">
                            <span id="cursorPosition">0, 0</span>
                        </div>
                    </div>

                    <!-- Modals -->
                    <div id="diagramModals"></div>
                </div>
            `;

            this.containerEl = containerEl;
        }

        /**
         * Initialize the SVG canvas with D3
         */
        _initCanvas() {
            const canvasEl = document.getElementById('diagramCanvas');
            if (!canvasEl) return;

            // Clear existing
            canvasEl.innerHTML = '';

            // Create SVG
            this.svg = d3.select(canvasEl)
                .append('svg')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('class', 'diagram-svg')
                .attr('tabindex', '0');

            // Add defs for markers and gradients
            const defs = this.svg.append('defs');

            // Arrow marker for links
            Object.entries(RELATIONSHIP_TYPES).forEach(([type, config]) => {
                defs.append('marker')
                    .attr('id', `arrow-${type}`)
                    .attr('viewBox', '0 -5 10 10')
                    .attr('refX', 25)
                    .attr('refY', 0)
                    .attr('markerWidth', 6)
                    .attr('markerHeight', 6)
                    .attr('orient', 'auto')
                    .append('path')
                    .attr('d', 'M0,-5L10,0L0,5')
                    .attr('fill', config.color);
            });

            // Add grid pattern
            const pattern = defs.append('pattern')
                .attr('id', 'grid')
                .attr('width', 40)
                .attr('height', 40)
                .attr('patternUnits', 'userSpaceOnUse');

            pattern.append('path')
                .attr('d', 'M 40 0 L 0 0 0 40')
                .attr('fill', 'none')
                .attr('stroke', 'var(--color-border, #2a2f4a)')
                .attr('stroke-width', 0.5);

            // Background with grid
            this.svg.append('rect')
                .attr('class', 'canvas-grid')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('fill', 'url(#grid)');

            // Main group for zoom/pan
            this.mainGroup = this.svg.append('g')
                .attr('class', 'main-group');

            // Links layer (rendered first, so below nodes)
            this.linksGroup = this.mainGroup.append('g')
                .attr('class', 'links-layer');

            // Nodes layer
            this.nodesGroup = this.mainGroup.append('g')
                .attr('class', 'nodes-layer');

            // Temporary connection line for drawing connections
            this.tempLine = this.mainGroup.append('line')
                .attr('class', 'temp-connection')
                .style('display', 'none');

            // Setup zoom behavior
            this.zoomBehavior = d3.zoom()
                .scaleExtent([0.1, 4])
                .on('zoom', (event) => {
                    this.mainGroup.attr('transform', event.transform);
                    this.zoom = event.transform.k;
                    this.panX = event.transform.x;
                    this.panY = event.transform.y;
                    this._updateZoomIndicator();
                });

            this.svg.call(this.zoomBehavior);

            // Get canvas dimensions
            const rect = canvasEl.getBoundingClientRect();
            this.width = rect.width || 1200;
            this.height = rect.height || 800;
        }

        /**
         * Setup event listeners
         */
        _setupEventListeners() {
            // Toolbar buttons
            document.getElementById('btnNewDiagram')?.addEventListener('click', () => this.newDiagram());
            document.getElementById('btnSave')?.addEventListener('click', () => this.saveDiagram());
            document.getElementById('btnLoad')?.addEventListener('click', () => this._showLoadModal());
            document.getElementById('btnUndo')?.addEventListener('click', () => this.undo());
            document.getElementById('btnRedo')?.addEventListener('click', () => this.redo());
            document.getElementById('btnZoomIn')?.addEventListener('click', () => this.zoomIn());
            document.getElementById('btnZoomOut')?.addEventListener('click', () => this.zoomOut());
            document.getElementById('btnFitView')?.addEventListener('click', () => this.fitToView());
            document.getElementById('btnAutoLayout')?.addEventListener('click', () => this.autoLayout());
            document.getElementById('btnExport')?.addEventListener('click', () => this._showExportModal());

            // Diagram type change
            document.getElementById('diagramType')?.addEventListener('change', (e) => {
                this.diagramType = e.target.value;
                this._recordHistory('changeDiagramType');
                this.autoLayout();
            });

            // Title change
            document.getElementById('diagramTitle')?.addEventListener('change', () => {
                this.isDirty = true;
            });

            // Entity search
            let searchTimeout;
            document.getElementById('entitySearch')?.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this._searchEntities(e.target.value);
                }, 300);
            });

            // Filters
            document.getElementById('mythologyFilter')?.addEventListener('change', () => {
                const query = document.getElementById('entitySearch')?.value || '';
                this._searchEntities(query);
            });
            document.getElementById('typeFilter')?.addEventListener('change', () => {
                const query = document.getElementById('entitySearch')?.value || '';
                this._searchEntities(query);
            });

            // Panel toggles
            document.getElementById('toggleLeftPanel')?.addEventListener('click', () => {
                this._togglePanel('left');
            });
            document.getElementById('toggleRightPanel')?.addEventListener('click', () => {
                this._togglePanel('right');
            });

            // Help dismiss
            document.getElementById('dismissHelp')?.addEventListener('click', () => {
                document.getElementById('canvasHelp')?.classList.add('hidden');
                localStorage.setItem('diagramBuilderHelpDismissed', 'true');
            });

            // Check if help should be shown
            if (localStorage.getItem('diagramBuilderHelpDismissed') === 'true') {
                document.getElementById('canvasHelp')?.classList.add('hidden');
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (!this.containerEl.contains(document.activeElement)) return;

                if (e.ctrlKey || e.metaKey) {
                    switch (e.key.toLowerCase()) {
                        case 'z':
                            e.preventDefault();
                            if (e.shiftKey) {
                                this.redo();
                            } else {
                                this.undo();
                            }
                            break;
                        case 'y':
                            e.preventDefault();
                            this.redo();
                            break;
                        case 's':
                            e.preventDefault();
                            this.saveDiagram();
                            break;
                        case 'a':
                            e.preventDefault();
                            this._selectAll();
                            break;
                    }
                } else if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (this.selectedNode || this.selectedLink) {
                        e.preventDefault();
                        this._deleteSelected();
                    }
                } else if (e.key === 'Escape') {
                    this._cancelConnection();
                    this._deselectAll();
                }
            });

            // Canvas mouse events
            const canvasContainer = document.getElementById('canvasContainer');
            canvasContainer?.addEventListener('mousemove', (e) => {
                this._updateCursorPosition(e);
                if (this.isConnecting) {
                    this._updateTempLine(e);
                }
            });

            // Load mythologies for filter
            this._loadMythologies();
        }

        /**
         * Load mythologies for the filter dropdown
         */
        async _loadMythologies() {
            const mythologies = [
                'greek', 'norse', 'egyptian', 'celtic', 'hindu', 'buddhist',
                'chinese', 'japanese', 'roman', 'aztec', 'mayan', 'sumerian',
                'babylonian', 'persian', 'christian', 'islamic', 'jewish', 'yoruba'
            ];

            const select = document.getElementById('mythologyFilter');
            if (select) {
                mythologies.forEach(m => {
                    const option = document.createElement('option');
                    option.value = m;
                    option.textContent = this._capitalize(m);
                    select.appendChild(option);
                });
            }
        }

        /**
         * Search for entities to add
         */
        async _searchEntities(query) {
            const listEl = document.getElementById('entityList');
            if (!listEl) return;

            if (!query || query.length < 2) {
                listEl.innerHTML = '<div class="entity-list-placeholder">Enter at least 2 characters to search</div>';
                return;
            }

            listEl.innerHTML = '<div class="entity-list-loading">Searching...</div>';

            const mythology = document.getElementById('mythologyFilter')?.value || '';
            const type = document.getElementById('typeFilter')?.value || '';

            try {
                const results = await this._fetchEntities(query, mythology, type);

                if (results.length === 0) {
                    listEl.innerHTML = '<div class="entity-list-placeholder">No entities found</div>';
                    return;
                }

                listEl.innerHTML = results.map(entity => this._renderEntityCard(entity)).join('');

                // Add drag handlers
                listEl.querySelectorAll('.entity-card').forEach(card => {
                    card.draggable = true;
                    card.addEventListener('dragstart', (e) => {
                        const entityData = card.dataset.entity;
                        e.dataTransfer.setData('application/json', entityData);
                        e.dataTransfer.effectAllowed = 'copy';
                    });

                    // Double-click to add
                    card.addEventListener('dblclick', () => {
                        const entity = JSON.parse(card.dataset.entity);
                        this._addEntityToCanvas(entity);
                    });
                });
            } catch (error) {
                console.error('[DiagramBuilder] Search error:', error);
                listEl.innerHTML = '<div class="entity-list-error">Error searching entities</div>';
            }
        }

        /**
         * Fetch entities from Firebase or local data
         */
        async _fetchEntities(query, mythology = '', type = '') {
            const results = [];
            const queryLower = query.toLowerCase();

            // Try Firebase first
            if (this.db) {
                const collections = type ? [this._getCollectionName(type)] :
                    ['deities', 'heroes', 'creatures', 'places', 'items'];

                for (const collection of collections) {
                    try {
                        let queryRef = this.db.collection(collection).limit(20);

                        if (mythology) {
                            queryRef = queryRef.where('mythology', '==', mythology);
                        }

                        const snapshot = await queryRef.get();
                        snapshot.docs.forEach(doc => {
                            const data = doc.data();
                            const name = (data.name || '').toLowerCase();
                            if (name.includes(queryLower)) {
                                results.push({
                                    id: doc.id,
                                    collection,
                                    type: data.type || this._getTypeFromCollection(collection),
                                    ...data
                                });
                            }
                        });
                    } catch (err) {
                        console.warn(`[DiagramBuilder] Could not search ${collection}:`, err);
                    }
                }
            }

            return results.slice(0, 50);
        }

        /**
         * Render an entity card for the palette
         */
        _renderEntityCard(entity) {
            const icon = entity.icon || ENTITY_ICONS[entity.type] || ENTITY_ICONS.default;
            const mythology = entity.mythology ? this._capitalize(entity.mythology) : '';

            return `
                <div class="entity-card"
                     data-entity='${JSON.stringify(entity).replace(/'/g, "&apos;")}'
                     data-id="${entity.id}"
                     title="Drag to add, or double-click">
                    <div class="entity-card-icon">${icon}</div>
                    <div class="entity-card-info">
                        <div class="entity-card-name">${this._escapeHtml(entity.name || 'Unknown')}</div>
                        <div class="entity-card-meta">
                            <span class="entity-type">${this._capitalize(entity.type || 'entity')}</span>
                            ${mythology ? `<span class="entity-mythology">${mythology}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Add an entity to the canvas as a node
         */
        _addEntityToCanvas(entity, position = null) {
            // Calculate position if not provided
            if (!position) {
                const rect = document.getElementById('diagramCanvas')?.getBoundingClientRect();
                position = {
                    x: (rect?.width || this.width) / 2 + (Math.random() - 0.5) * 100,
                    y: (rect?.height || this.height) / 2 + (Math.random() - 0.5) * 100
                };
            }

            // Create node
            const node = {
                id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                entityId: entity.id,
                entityType: entity.type || 'entity',
                collection: entity.collection,
                name: entity.name || 'Unknown',
                icon: entity.icon || ENTITY_ICONS[entity.type] || ENTITY_ICONS.default,
                mythology: entity.mythology || '',
                x: position.x,
                y: position.y,
                data: entity
            };

            this.nodes.push(node);
            this._recordHistory('addNode', { node });
            this._render();
            this._updateStatusCounts();
            this.isDirty = true;

            // Add to recently used
            this._addToRecentlyUsed(entity);

            // Auto-suggest relationships
            this._suggestRelationships(node);

            return node;
        }

        /**
         * Add a connection between two nodes
         */
        _addConnection(sourceNode, targetNode, relationType = 'custom', label = '') {
            // Check if connection already exists
            const exists = this.links.some(link =>
                (link.source.id === sourceNode.id && link.target.id === targetNode.id) ||
                (link.source.id === targetNode.id && link.target.id === sourceNode.id)
            );

            if (exists) {
                console.warn('[DiagramBuilder] Connection already exists');
                return null;
            }

            const link = {
                id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                source: sourceNode,
                target: targetNode,
                type: relationType,
                label: label || RELATIONSHIP_TYPES[relationType]?.label || '',
                color: RELATIONSHIP_TYPES[relationType]?.color || '#95a5a6'
            };

            this.links.push(link);
            this._recordHistory('addLink', { link });
            this._render();
            this._updateStatusCounts();
            this.isDirty = true;

            return link;
        }

        /**
         * Suggest relationships based on entity data
         */
        _suggestRelationships(newNode) {
            const entity = newNode.data;
            if (!entity) return;

            const suggestions = [];

            // Check relationships in entity data
            const relationships = entity.relationships || {};

            // Look for parent relationships
            if (relationships.parents || relationships.father || relationships.mother) {
                const parents = [
                    ...(relationships.parents || []),
                    relationships.father,
                    relationships.mother
                ].filter(Boolean);

                parents.forEach(parentName => {
                    const parentNode = this.nodes.find(n =>
                        n.id !== newNode.id &&
                        n.name.toLowerCase().includes(parentName.toLowerCase())
                    );
                    if (parentNode) {
                        suggestions.push({
                            source: parentNode,
                            target: newNode,
                            type: 'parent',
                            label: 'Parent of'
                        });
                    }
                });
            }

            // Check for children
            if (relationships.children) {
                relationships.children.forEach(childName => {
                    const childNode = this.nodes.find(n =>
                        n.id !== newNode.id &&
                        n.name.toLowerCase().includes(childName.toLowerCase())
                    );
                    if (childNode) {
                        suggestions.push({
                            source: newNode,
                            target: childNode,
                            type: 'parent',
                            label: 'Parent of'
                        });
                    }
                });
            }

            // Check for spouse/consort
            if (relationships.spouse || relationships.consort) {
                const spouseName = relationships.spouse || relationships.consort;
                const spouseNode = this.nodes.find(n =>
                    n.id !== newNode.id &&
                    n.name.toLowerCase().includes(spouseName.toLowerCase())
                );
                if (spouseNode) {
                    suggestions.push({
                        source: newNode,
                        target: spouseNode,
                        type: 'spouse',
                        label: 'Spouse'
                    });
                }
            }

            // Check cross-cultural parallels
            if (entity.cross_cultural_parallels) {
                entity.cross_cultural_parallels.forEach(parallel => {
                    const parallelNode = this.nodes.find(n =>
                        n.id !== newNode.id &&
                        n.name.toLowerCase() === parallel.name.toLowerCase()
                    );
                    if (parallelNode) {
                        suggestions.push({
                            source: newNode,
                            target: parallelNode,
                            type: 'equivalent',
                            label: `${parallel.tradition} equivalent`
                        });
                    }
                });
            }

            // Show suggestions if any
            if (suggestions.length > 0) {
                this._showRelationshipSuggestions(newNode, suggestions);
            }
        }

        /**
         * Show relationship suggestions popup
         */
        _showRelationshipSuggestions(node, suggestions) {
            const existingPopup = document.querySelector('.suggestion-popup');
            if (existingPopup) existingPopup.remove();

            const popup = document.createElement('div');
            popup.className = 'suggestion-popup';
            popup.innerHTML = `
                <div class="suggestion-header">
                    <span>Suggested Connections</span>
                    <button class="suggestion-close">&times;</button>
                </div>
                <div class="suggestion-list">
                    ${suggestions.map((s, idx) => `
                        <div class="suggestion-item" data-index="${idx}">
                            <span class="suggestion-icon">${RELATIONSHIP_TYPES[s.type]?.icon || '🔗'}</span>
                            <span class="suggestion-text">
                                Connect to <strong>${s.target.name}</strong> as ${s.label}
                            </span>
                            <button class="suggestion-apply">Add</button>
                        </div>
                    `).join('')}
                </div>
            `;

            // Position near the node
            const canvasRect = document.getElementById('diagramCanvas')?.getBoundingClientRect();
            if (canvasRect) {
                popup.style.left = `${canvasRect.left + node.x * this.zoom + this.panX + 80}px`;
                popup.style.top = `${canvasRect.top + node.y * this.zoom + this.panY - 20}px`;
            }

            document.body.appendChild(popup);

            // Event handlers
            popup.querySelector('.suggestion-close')?.addEventListener('click', () => popup.remove());

            popup.querySelectorAll('.suggestion-apply').forEach((btn, idx) => {
                btn.addEventListener('click', () => {
                    const s = suggestions[idx];
                    this._addConnection(s.source, s.target, s.type, s.label);
                    popup.remove();
                });
            });

            // Auto-dismiss after 10 seconds
            setTimeout(() => popup.remove(), 10000);
        }

        /**
         * Render the diagram
         */
        _render() {
            if (!this.linksGroup || !this.nodesGroup) return;

            // Render links
            const linkSelection = this.linksGroup.selectAll('.link-group')
                .data(this.links, d => d.id);

            // Exit
            linkSelection.exit().remove();

            // Enter
            const linkEnter = linkSelection.enter()
                .append('g')
                .attr('class', 'link-group')
                .style('cursor', 'pointer')
                .on('click', (event, d) => this._selectLink(d))
                .on('contextmenu', (event, d) => {
                    event.preventDefault();
                    this._showLinkContextMenu(event, d);
                });

            linkEnter.append('line')
                .attr('class', 'link-line')
                .attr('marker-end', d => `url(#arrow-${d.type})`);

            linkEnter.append('text')
                .attr('class', 'link-label')
                .attr('text-anchor', 'middle')
                .attr('dy', -8);

            // Update
            const linkUpdate = linkEnter.merge(linkSelection);

            linkUpdate.select('.link-line')
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y)
                .attr('stroke', d => d.color)
                .attr('stroke-width', d => this.selectedLink?.id === d.id ? 4 : 2);

            linkUpdate.select('.link-label')
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2)
                .text(d => d.label);

            // Render nodes
            const nodeSelection = this.nodesGroup.selectAll('.node-group')
                .data(this.nodes, d => d.id);

            // Exit
            nodeSelection.exit().remove();

            // Enter
            const nodeEnter = nodeSelection.enter()
                .append('g')
                .attr('class', 'node-group')
                .style('cursor', 'grab')
                .call(d3.drag()
                    .on('start', this._handleDragStart)
                    .on('drag', this._handleDrag)
                    .on('end', this._handleDragEnd)
                )
                .on('click', (event, d) => {
                    event.stopPropagation();
                    this._selectNode(d);
                })
                .on('dblclick', (event, d) => {
                    event.stopPropagation();
                    this._editNode(d);
                })
                .on('contextmenu', (event, d) => {
                    event.preventDefault();
                    this._showNodeContextMenu(event, d);
                })
                .on('mousedown', (event, d) => {
                    // Right-click or ctrl+click starts connection
                    if (event.ctrlKey || event.button === 2) {
                        event.preventDefault();
                        this._startConnection(d);
                    }
                })
                .on('mouseup', (event, d) => {
                    if (this.isConnecting && this.connectSource && this.connectSource.id !== d.id) {
                        this._completeConnection(d);
                    }
                });

            // Node background
            nodeEnter.append('rect')
                .attr('class', 'node-bg')
                .attr('rx', 8)
                .attr('ry', 8);

            // Node icon
            nodeEnter.append('text')
                .attr('class', 'node-icon')
                .attr('x', 16)
                .attr('y', 32)
                .attr('font-size', 24);

            // Node name
            nodeEnter.append('text')
                .attr('class', 'node-name')
                .attr('x', 48)
                .attr('y', 28);

            // Node mythology badge
            nodeEnter.append('text')
                .attr('class', 'node-mythology')
                .attr('x', 48)
                .attr('y', 42)
                .attr('font-size', 10);

            // Update
            const nodeUpdate = nodeEnter.merge(nodeSelection);

            nodeUpdate.attr('transform', d => `translate(${d.x - 70}, ${d.y - 25})`);

            nodeUpdate.select('.node-bg')
                .attr('width', 140)
                .attr('height', 50)
                .attr('stroke', d => this.selectedNode?.id === d.id ? 'var(--color-primary, #8b7fff)' : 'transparent')
                .attr('stroke-width', d => this.selectedNode?.id === d.id ? 3 : 0);

            nodeUpdate.select('.node-icon')
                .text(d => d.icon);

            nodeUpdate.select('.node-name')
                .text(d => this._truncate(d.name, 15));

            nodeUpdate.select('.node-mythology')
                .text(d => d.mythology ? this._capitalize(d.mythology) : '');

            // Update simulation if using force layout
            if (this.diagramType === 'relationship' && this.simulation) {
                this.simulation.nodes(this.nodes);
                this.simulation.force('link').links(this.links);
                this.simulation.alpha(0.3).restart();
            }
        }

        /**
         * Handle drag start
         */
        _handleDragStart(event, d) {
            this.isDragging = true;
            d3.select(event.sourceEvent.target.closest('.node-group'))
                .raise()
                .style('cursor', 'grabbing');

            if (this.simulation) {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
        }

        /**
         * Handle drag
         */
        _handleDrag(event, d) {
            d.x = event.x;
            d.y = event.y;
            if (this.simulation) {
                d.fx = event.x;
                d.fy = event.y;
            }
            this._render();
        }

        /**
         * Handle drag end
         */
        _handleDragEnd(event, d) {
            this.isDragging = false;
            d3.select(event.sourceEvent.target.closest('.node-group'))
                .style('cursor', 'grab');

            if (this.simulation) {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }

            this._recordHistory('moveNode', { nodeId: d.id, x: d.x, y: d.y });
            this.isDirty = true;
        }

        /**
         * Start connection mode
         */
        _startConnection(node) {
            this.isConnecting = true;
            this.connectSource = node;
            this.tempLine
                .style('display', 'block')
                .attr('x1', node.x)
                .attr('y1', node.y)
                .attr('x2', node.x)
                .attr('y2', node.y);

            document.body.style.cursor = 'crosshair';
        }

        /**
         * Update temporary connection line
         */
        _updateTempLine(event) {
            if (!this.isConnecting || !this.connectSource) return;

            const canvasRect = document.getElementById('diagramCanvas')?.getBoundingClientRect();
            if (!canvasRect) return;

            const x = (event.clientX - canvasRect.left - this.panX) / this.zoom;
            const y = (event.clientY - canvasRect.top - this.panY) / this.zoom;

            this.tempLine
                .attr('x2', x)
                .attr('y2', y);
        }

        /**
         * Complete connection to target node
         */
        _completeConnection(targetNode) {
            if (!this.connectSource || this.connectSource.id === targetNode.id) {
                this._cancelConnection();
                return;
            }

            // Show relationship type selector
            this._showRelationshipTypeSelector(this.connectSource, targetNode);
            this._cancelConnection();
        }

        /**
         * Cancel connection mode
         */
        _cancelConnection() {
            this.isConnecting = false;
            this.connectSource = null;
            this.tempLine.style('display', 'none');
            document.body.style.cursor = '';
        }

        /**
         * Show relationship type selector modal
         */
        _showRelationshipTypeSelector(source, target) {
            const modalContainer = document.getElementById('diagramModals');
            if (!modalContainer) return;

            modalContainer.innerHTML = `
                <div class="diagram-modal-overlay">
                    <div class="diagram-modal">
                        <div class="modal-header">
                            <h3>Create Connection</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p class="connection-summary">
                                <strong>${source.name}</strong>
                                <span class="connection-arrow">→</span>
                                <strong>${target.name}</strong>
                            </p>

                            <div class="relationship-type-grid">
                                ${Object.entries(RELATIONSHIP_TYPES).map(([key, type]) => `
                                    <button class="relationship-type-btn" data-type="${key}">
                                        <span class="type-icon">${type.icon}</span>
                                        <span class="type-label">${type.label}</span>
                                    </button>
                                `).join('')}
                            </div>

                            <div class="custom-label-input" style="display: none;">
                                <label>Custom Label:</label>
                                <input type="text" id="customRelationLabel" placeholder="Enter relationship label" />
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-cancel">Cancel</button>
                            <button class="btn-confirm" id="confirmConnection">Add Connection</button>
                        </div>
                    </div>
                </div>
            `;

            let selectedType = null;

            // Type selection
            modalContainer.querySelectorAll('.relationship-type-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    modalContainer.querySelectorAll('.relationship-type-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedType = btn.dataset.type;

                    // Show custom label input for custom type
                    const customInput = modalContainer.querySelector('.custom-label-input');
                    if (customInput) {
                        customInput.style.display = selectedType === 'custom' ? 'block' : 'none';
                    }
                });
            });

            // Close handlers
            const closeModal = () => modalContainer.innerHTML = '';

            modalContainer.querySelector('.modal-close')?.addEventListener('click', closeModal);
            modalContainer.querySelector('.btn-cancel')?.addEventListener('click', closeModal);
            modalContainer.querySelector('.diagram-modal-overlay')?.addEventListener('click', (e) => {
                if (e.target.classList.contains('diagram-modal-overlay')) closeModal();
            });

            // Confirm
            modalContainer.querySelector('#confirmConnection')?.addEventListener('click', () => {
                if (!selectedType) {
                    alert('Please select a relationship type');
                    return;
                }

                let label = RELATIONSHIP_TYPES[selectedType]?.label || '';
                if (selectedType === 'custom') {
                    label = document.getElementById('customRelationLabel')?.value || 'Related';
                }

                this._addConnection(source, target, selectedType, label);
                closeModal();
            });
        }

        /**
         * Select a node
         */
        _selectNode(node) {
            this.selectedNode = node;
            this.selectedLink = null;
            this._render();
            this._showNodeProperties(node);

            if (this.onNodeSelect) {
                this.onNodeSelect(node);
            }
        }

        /**
         * Select a link
         */
        _selectLink(link) {
            this.selectedLink = link;
            this.selectedNode = null;
            this._render();
            this._showLinkProperties(link);

            if (this.onLinkSelect) {
                this.onLinkSelect(link);
            }
        }

        /**
         * Deselect all
         */
        _deselectAll() {
            this.selectedNode = null;
            this.selectedLink = null;
            this._render();
            this._showDefaultProperties();
        }

        /**
         * Show node properties in right panel
         */
        _showNodeProperties(node) {
            const panel = document.getElementById('propertiesContent');
            const title = document.getElementById('propertiesPanelTitle');
            if (!panel || !title) return;

            title.textContent = 'Node Properties';

            panel.innerHTML = `
                <div class="properties-section">
                    <div class="property-row">
                        <label>Name</label>
                        <input type="text" id="propNodeName" value="${this._escapeHtml(node.name)}" />
                    </div>
                    <div class="property-row">
                        <label>Icon</label>
                        <input type="text" id="propNodeIcon" value="${node.icon}" maxlength="4" />
                    </div>
                    <div class="property-row">
                        <label>Type</label>
                        <span class="property-value">${this._capitalize(node.entityType)}</span>
                    </div>
                    <div class="property-row">
                        <label>Mythology</label>
                        <span class="property-value">${this._capitalize(node.mythology) || 'N/A'}</span>
                    </div>
                    <div class="property-row">
                        <label>Position</label>
                        <span class="property-value">X: ${Math.round(node.x)}, Y: ${Math.round(node.y)}</span>
                    </div>
                </div>

                <div class="properties-section">
                    <h4>Connections (${this._getNodeConnections(node).length})</h4>
                    <div class="connections-list">
                        ${this._getNodeConnections(node).map(link => `
                            <div class="connection-item">
                                <span class="connection-icon">${RELATIONSHIP_TYPES[link.type]?.icon || '🔗'}</span>
                                <span class="connection-text">
                                    ${link.source.id === node.id ? link.target.name : link.source.name}
                                </span>
                            </div>
                        `).join('') || '<p class="no-connections">No connections</p>'}
                    </div>
                </div>

                <div class="properties-actions">
                    <button class="btn-action" id="btnViewEntity">View Entity</button>
                    <button class="btn-action btn-danger" id="btnDeleteNode">Delete Node</button>
                </div>
            `;

            // Event handlers
            document.getElementById('propNodeName')?.addEventListener('change', (e) => {
                node.name = e.target.value;
                this._recordHistory('editNode', { nodeId: node.id, field: 'name', value: e.target.value });
                this._render();
                this.isDirty = true;
            });

            document.getElementById('propNodeIcon')?.addEventListener('change', (e) => {
                node.icon = e.target.value;
                this._recordHistory('editNode', { nodeId: node.id, field: 'icon', value: e.target.value });
                this._render();
                this.isDirty = true;
            });

            document.getElementById('btnViewEntity')?.addEventListener('click', () => {
                if (node.entityId && node.collection) {
                    const url = `#/${node.mythology || 'shared'}/${node.collection}/${node.entityId}`;
                    window.open(url, '_blank');
                }
            });

            document.getElementById('btnDeleteNode')?.addEventListener('click', () => {
                if (confirm(`Delete "${node.name}" and all its connections?`)) {
                    this._deleteNode(node);
                }
            });
        }

        /**
         * Show link properties in right panel
         */
        _showLinkProperties(link) {
            const panel = document.getElementById('propertiesContent');
            const title = document.getElementById('propertiesPanelTitle');
            if (!panel || !title) return;

            title.textContent = 'Connection Properties';

            panel.innerHTML = `
                <div class="properties-section">
                    <div class="property-row">
                        <label>From</label>
                        <span class="property-value">${link.source.name}</span>
                    </div>
                    <div class="property-row">
                        <label>To</label>
                        <span class="property-value">${link.target.name}</span>
                    </div>
                    <div class="property-row">
                        <label>Type</label>
                        <select id="propLinkType">
                            ${Object.entries(RELATIONSHIP_TYPES).map(([key, type]) => `
                                <option value="${key}" ${link.type === key ? 'selected' : ''}>
                                    ${type.icon} ${type.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="property-row">
                        <label>Label</label>
                        <input type="text" id="propLinkLabel" value="${this._escapeHtml(link.label)}" />
                    </div>
                </div>

                <div class="properties-actions">
                    <button class="btn-action" id="btnReverseLink">Reverse Direction</button>
                    <button class="btn-action btn-danger" id="btnDeleteLink">Delete Connection</button>
                </div>
            `;

            // Event handlers
            document.getElementById('propLinkType')?.addEventListener('change', (e) => {
                const newType = e.target.value;
                link.type = newType;
                link.color = RELATIONSHIP_TYPES[newType]?.color || '#95a5a6';
                if (newType !== 'custom') {
                    link.label = RELATIONSHIP_TYPES[newType]?.label || '';
                    document.getElementById('propLinkLabel').value = link.label;
                }
                this._recordHistory('editLink', { linkId: link.id, field: 'type', value: newType });
                this._render();
                this.isDirty = true;
            });

            document.getElementById('propLinkLabel')?.addEventListener('change', (e) => {
                link.label = e.target.value;
                this._recordHistory('editLink', { linkId: link.id, field: 'label', value: e.target.value });
                this._render();
                this.isDirty = true;
            });

            document.getElementById('btnReverseLink')?.addEventListener('click', () => {
                const temp = link.source;
                link.source = link.target;
                link.target = temp;
                this._recordHistory('reverseLink', { linkId: link.id });
                this._render();
                this.isDirty = true;
            });

            document.getElementById('btnDeleteLink')?.addEventListener('click', () => {
                if (confirm('Delete this connection?')) {
                    this._deleteLink(link);
                }
            });
        }

        /**
         * Show default properties panel
         */
        _showDefaultProperties() {
            const panel = document.getElementById('propertiesContent');
            const title = document.getElementById('propertiesPanelTitle');
            if (!panel || !title) return;

            title.textContent = 'Properties';
            panel.innerHTML = `
                <div class="properties-placeholder">
                    Select a node or connection to view its properties
                </div>
            `;
        }

        /**
         * Get connections for a node
         */
        _getNodeConnections(node) {
            return this.links.filter(link =>
                link.source.id === node.id || link.target.id === node.id
            );
        }

        /**
         * Delete a node and its connections
         */
        _deleteNode(node) {
            // Remove connections
            this.links = this.links.filter(link =>
                link.source.id !== node.id && link.target.id !== node.id
            );

            // Remove node
            this.nodes = this.nodes.filter(n => n.id !== node.id);

            this._recordHistory('deleteNode', { node, links: this._getNodeConnections(node) });
            this.selectedNode = null;
            this._render();
            this._updateStatusCounts();
            this._showDefaultProperties();
            this.isDirty = true;
        }

        /**
         * Delete a link
         */
        _deleteLink(link) {
            this.links = this.links.filter(l => l.id !== link.id);

            this._recordHistory('deleteLink', { link });
            this.selectedLink = null;
            this._render();
            this._updateStatusCounts();
            this._showDefaultProperties();
            this.isDirty = true;
        }

        /**
         * Delete selected item
         */
        _deleteSelected() {
            if (this.selectedNode) {
                this._deleteNode(this.selectedNode);
            } else if (this.selectedLink) {
                this._deleteLink(this.selectedLink);
            }
        }

        /**
         * Auto layout the diagram
         */
        autoLayout() {
            if (this.nodes.length === 0) return;

            switch (this.diagramType) {
                case 'relationship':
                    this._forceLayout();
                    break;
                case 'familyTree':
                    this._treeLayout();
                    break;
                case 'comparison':
                    this._radialLayout();
                    break;
                case 'timeline':
                    this._timelineLayout();
                    break;
                default:
                    this._forceLayout();
            }
        }

        /**
         * Force-directed layout
         */
        _forceLayout() {
            this.simulation = d3.forceSimulation(this.nodes)
                .force('link', d3.forceLink(this.links).id(d => d.id).distance(150))
                .force('charge', d3.forceManyBody().strength(-300))
                .force('center', d3.forceCenter(this.width / 2, this.height / 2))
                .force('collision', d3.forceCollide().radius(80))
                .on('tick', () => this._render());

            this.simulation.alpha(1).restart();
        }

        /**
         * Tree layout for family trees
         */
        _treeLayout() {
            if (this.nodes.length === 0) return;

            // Find root nodes (nodes with no incoming parent links)
            const hasParent = new Set();
            this.links.forEach(link => {
                if (link.type === 'parent') {
                    hasParent.add(link.target.id);
                }
            });

            const roots = this.nodes.filter(n => !hasParent.has(n.id));
            if (roots.length === 0) {
                // If no clear root, use first node
                roots.push(this.nodes[0]);
            }

            // Build hierarchy
            const buildHierarchy = (node, visited = new Set()) => {
                if (visited.has(node.id)) return null;
                visited.add(node.id);

                const children = this.links
                    .filter(l => l.type === 'parent' && l.source.id === node.id)
                    .map(l => buildHierarchy(l.target, visited))
                    .filter(Boolean);

                return { ...node, children: children.length > 0 ? children : undefined };
            };

            // Use D3 tree layout
            const treeWidth = this.width - 200;
            const treeHeight = this.height - 100;

            roots.forEach((root, rootIdx) => {
                const hierarchy = d3.hierarchy(buildHierarchy(root));
                const treeLayout = d3.tree().size([treeWidth / roots.length, treeHeight]);
                const tree = treeLayout(hierarchy);

                const offsetX = (rootIdx * treeWidth / roots.length) + 100;

                tree.descendants().forEach(d => {
                    const node = this.nodes.find(n => n.id === d.data.id);
                    if (node) {
                        node.x = d.x + offsetX;
                        node.y = d.y + 50;
                    }
                });
            });

            this._render();
        }

        /**
         * Radial layout for comparison charts
         */
        _radialLayout() {
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            const radius = Math.min(this.width, this.height) / 3;

            this.nodes.forEach((node, i) => {
                const angle = (2 * Math.PI * i) / this.nodes.length - Math.PI / 2;
                node.x = centerX + radius * Math.cos(angle);
                node.y = centerY + radius * Math.sin(angle);
            });

            this._render();
        }

        /**
         * Timeline layout
         */
        _timelineLayout() {
            const padding = 100;
            const usableWidth = this.width - padding * 2;
            const centerY = this.height / 2;

            // Sort nodes by any date/period if available, otherwise by order added
            this.nodes.forEach((node, i) => {
                node.x = padding + (usableWidth * i) / Math.max(1, this.nodes.length - 1);
                node.y = centerY + (i % 2 === 0 ? -40 : 40);
            });

            this._render();
        }

        /**
         * Zoom controls
         */
        zoomIn() {
            this.svg.transition().call(this.zoomBehavior.scaleBy, 1.3);
        }

        zoomOut() {
            this.svg.transition().call(this.zoomBehavior.scaleBy, 0.7);
        }

        fitToView() {
            if (this.nodes.length === 0) return;

            const bounds = this._getBounds();
            const padding = 50;
            const width = bounds.maxX - bounds.minX + padding * 2;
            const height = bounds.maxY - bounds.minY + padding * 2;

            const canvasRect = document.getElementById('diagramCanvas')?.getBoundingClientRect();
            if (!canvasRect) return;

            const scale = Math.min(
                canvasRect.width / width,
                canvasRect.height / height,
                2 // Max zoom
            ) * 0.9;

            const centerX = (bounds.minX + bounds.maxX) / 2;
            const centerY = (bounds.minY + bounds.maxY) / 2;

            this.svg.transition().duration(500).call(
                this.zoomBehavior.transform,
                d3.zoomIdentity
                    .translate(canvasRect.width / 2, canvasRect.height / 2)
                    .scale(scale)
                    .translate(-centerX, -centerY)
            );
        }

        /**
         * Get bounds of all nodes
         */
        _getBounds() {
            if (this.nodes.length === 0) {
                return { minX: 0, minY: 0, maxX: this.width, maxY: this.height };
            }

            return {
                minX: Math.min(...this.nodes.map(n => n.x - 70)),
                minY: Math.min(...this.nodes.map(n => n.y - 25)),
                maxX: Math.max(...this.nodes.map(n => n.x + 70)),
                maxY: Math.max(...this.nodes.map(n => n.y + 25))
            };
        }

        /**
         * Update zoom indicator
         */
        _updateZoomIndicator() {
            const indicator = document.getElementById('zoomIndicator');
            if (indicator) {
                indicator.textContent = `${Math.round(this.zoom * 100)}%`;
            }
        }

        /**
         * Update cursor position display
         */
        _updateCursorPosition(event) {
            const canvasRect = document.getElementById('diagramCanvas')?.getBoundingClientRect();
            if (!canvasRect) return;

            const x = Math.round((event.clientX - canvasRect.left - this.panX) / this.zoom);
            const y = Math.round((event.clientY - canvasRect.top - this.panY) / this.zoom);

            const posEl = document.getElementById('cursorPosition');
            if (posEl) {
                posEl.textContent = `${x}, ${y}`;
            }
        }

        /**
         * Update status bar counts
         */
        _updateStatusCounts() {
            const nodeCountEl = document.getElementById('nodeCount');
            const linkCountEl = document.getElementById('linkCount');

            if (nodeCountEl) {
                nodeCountEl.textContent = `${this.nodes.length} node${this.nodes.length !== 1 ? 's' : ''}`;
            }
            if (linkCountEl) {
                linkCountEl.textContent = `${this.links.length} connection${this.links.length !== 1 ? 's' : ''}`;
            }
        }

        /**
         * Record action in history for undo/redo
         */
        _recordHistory(action, data = {}) {
            // Remove any redo history
            this.history = this.history.slice(0, this.historyIndex + 1);

            // Add new action
            this.history.push({
                action,
                data,
                nodes: JSON.parse(JSON.stringify(this.nodes)),
                links: JSON.parse(JSON.stringify(this.links.map(l => ({
                    ...l,
                    source: l.source.id,
                    target: l.target.id
                }))))
            });

            // Limit history size
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }

            this.historyIndex = this.history.length - 1;
            this._updateUndoRedoButtons();
        }

        /**
         * Undo last action
         */
        undo() {
            if (this.historyIndex <= 0) return;

            this.historyIndex--;
            this._restoreFromHistory(this.historyIndex);
            this._updateUndoRedoButtons();
        }

        /**
         * Redo action
         */
        redo() {
            if (this.historyIndex >= this.history.length - 1) return;

            this.historyIndex++;
            this._restoreFromHistory(this.historyIndex);
            this._updateUndoRedoButtons();
        }

        /**
         * Restore diagram state from history
         */
        _restoreFromHistory(index) {
            const state = this.history[index];
            if (!state) return;

            this.nodes = JSON.parse(JSON.stringify(state.nodes));

            // Restore links with node references
            this.links = state.links.map(l => ({
                ...l,
                source: this.nodes.find(n => n.id === l.source),
                target: this.nodes.find(n => n.id === l.target)
            })).filter(l => l.source && l.target);

            this._render();
            this._updateStatusCounts();
            this.isDirty = true;
        }

        /**
         * Update undo/redo button states
         */
        _updateUndoRedoButtons() {
            const undoBtn = document.getElementById('btnUndo');
            const redoBtn = document.getElementById('btnRedo');

            if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
            if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }

        /**
         * Add to recently used entities
         */
        _addToRecentlyUsed(entity) {
            const recentEl = document.getElementById('recentEntities');
            if (!recentEl) return;

            // Get current recent list from storage
            let recent = JSON.parse(localStorage.getItem('diagramBuilderRecent') || '[]');

            // Add new entity, remove duplicates
            recent = recent.filter(e => e.id !== entity.id);
            recent.unshift(entity);
            recent = recent.slice(0, 5);

            localStorage.setItem('diagramBuilderRecent', JSON.stringify(recent));

            // Update UI
            recentEl.innerHTML = recent.map(e => this._renderEntityCard(e)).join('');
        }

        /**
         * Toggle panel visibility
         */
        _togglePanel(side) {
            const panel = document.querySelector(`.panel-${side}`);
            if (panel) {
                panel.classList.toggle('collapsed');
            }
        }

        /**
         * Show node context menu
         */
        _showNodeContextMenu(event, node) {
            this._removeContextMenu();

            const menu = document.createElement('div');
            menu.className = 'context-menu';
            menu.innerHTML = `
                <div class="context-menu-item" data-action="connect">
                    <span class="menu-icon">🔗</span> Connect to...
                </div>
                <div class="context-menu-item" data-action="edit">
                    <span class="menu-icon">✏️</span> Edit
                </div>
                <div class="context-menu-item" data-action="view">
                    <span class="menu-icon">👁️</span> View Entity
                </div>
                <div class="context-menu-divider"></div>
                <div class="context-menu-item danger" data-action="delete">
                    <span class="menu-icon">🗑️</span> Delete
                </div>
            `;

            menu.style.left = `${event.pageX}px`;
            menu.style.top = `${event.pageY}px`;
            document.body.appendChild(menu);

            // Handle clicks
            menu.addEventListener('click', (e) => {
                const action = e.target.closest('.context-menu-item')?.dataset.action;
                if (!action) return;

                switch (action) {
                    case 'connect':
                        this._startConnection(node);
                        break;
                    case 'edit':
                        this._editNode(node);
                        break;
                    case 'view':
                        if (node.entityId && node.collection) {
                            window.open(`#/${node.mythology}/${node.collection}/${node.entityId}`, '_blank');
                        }
                        break;
                    case 'delete':
                        if (confirm(`Delete "${node.name}"?`)) {
                            this._deleteNode(node);
                        }
                        break;
                }

                this._removeContextMenu();
            });

            // Close on click outside
            setTimeout(() => {
                document.addEventListener('click', this._removeContextMenu, { once: true });
            }, 100);
        }

        /**
         * Show link context menu
         */
        _showLinkContextMenu(event, link) {
            this._removeContextMenu();

            const menu = document.createElement('div');
            menu.className = 'context-menu';
            menu.innerHTML = `
                <div class="context-menu-item" data-action="edit">
                    <span class="menu-icon">✏️</span> Edit
                </div>
                <div class="context-menu-item" data-action="reverse">
                    <span class="menu-icon">🔄</span> Reverse Direction
                </div>
                <div class="context-menu-divider"></div>
                <div class="context-menu-item danger" data-action="delete">
                    <span class="menu-icon">🗑️</span> Delete
                </div>
            `;

            menu.style.left = `${event.pageX}px`;
            menu.style.top = `${event.pageY}px`;
            document.body.appendChild(menu);

            menu.addEventListener('click', (e) => {
                const action = e.target.closest('.context-menu-item')?.dataset.action;
                if (!action) return;

                switch (action) {
                    case 'edit':
                        this._selectLink(link);
                        break;
                    case 'reverse':
                        const temp = link.source;
                        link.source = link.target;
                        link.target = temp;
                        this._render();
                        this.isDirty = true;
                        break;
                    case 'delete':
                        if (confirm('Delete this connection?')) {
                            this._deleteLink(link);
                        }
                        break;
                }

                this._removeContextMenu();
            });

            setTimeout(() => {
                document.addEventListener('click', this._removeContextMenu, { once: true });
            }, 100);
        }

        /**
         * Remove context menu
         */
        _removeContextMenu() {
            document.querySelectorAll('.context-menu').forEach(m => m.remove());
        }

        /**
         * Edit node (show quick edit modal)
         */
        _editNode(node) {
            this._selectNode(node);
            // Focus on name input in properties panel
            document.getElementById('propNodeName')?.focus();
        }

        /**
         * New diagram
         */
        newDiagram() {
            if (this.isDirty && !confirm('Create a new diagram? Unsaved changes will be lost.')) {
                return;
            }

            this.nodes = [];
            this.links = [];
            this.diagramId = null;
            this.history = [];
            this.historyIndex = -1;
            this.isDirty = false;

            document.getElementById('diagramTitle').value = '';

            this._render();
            this._updateStatusCounts();
            this._updateUndoRedoButtons();
            this._showDefaultProperties();
            this._updateSaveStatus('');
        }

        /**
         * Save diagram to Firebase
         */
        async saveDiagram() {
            if (!this.auth?.currentUser) {
                alert('Please sign in to save diagrams');
                return;
            }

            if (this.nodes.length === 0) {
                alert('Add some entities before saving');
                return;
            }

            const title = document.getElementById('diagramTitle')?.value || 'Untitled Diagram';

            const diagramData = {
                title,
                type: this.diagramType,
                nodes: this.nodes.map(n => ({
                    id: n.id,
                    entityId: n.entityId,
                    entityType: n.entityType,
                    collection: n.collection,
                    name: n.name,
                    icon: n.icon,
                    mythology: n.mythology,
                    x: n.x,
                    y: n.y
                })),
                links: this.links.map(l => ({
                    id: l.id,
                    sourceId: l.source.id,
                    targetId: l.target.id,
                    type: l.type,
                    label: l.label,
                    color: l.color
                })),
                userId: this.auth.currentUser.uid,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                this._updateSaveStatus('Saving...');

                if (this.diagramId) {
                    // Update existing
                    await this.db.collection('user_diagrams').doc(this.diagramId).update(diagramData);
                } else {
                    // Create new
                    diagramData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    const docRef = await this.db.collection('user_diagrams').add(diagramData);
                    this.diagramId = docRef.id;
                }

                this.isDirty = false;
                this._updateSaveStatus('Saved');

                if (this.onDiagramSave) {
                    this.onDiagramSave(this.diagramId);
                }

                console.log('[DiagramBuilder] Diagram saved:', this.diagramId);
            } catch (error) {
                console.error('[DiagramBuilder] Save error:', error);
                this._updateSaveStatus('Save failed');
                alert('Failed to save diagram. Please try again.');
            }
        }

        /**
         * Load diagram from Firebase
         */
        async loadDiagram(diagramId) {
            if (!this.db) {
                console.error('[DiagramBuilder] Firestore not available');
                return;
            }

            try {
                const doc = await this.db.collection('user_diagrams').doc(diagramId).get();

                if (!doc.exists) {
                    console.error('[DiagramBuilder] Diagram not found:', diagramId);
                    return;
                }

                const data = doc.data();

                // Restore nodes
                this.nodes = data.nodes || [];

                // Restore links with node references
                this.links = (data.links || []).map(l => ({
                    ...l,
                    source: this.nodes.find(n => n.id === l.sourceId),
                    target: this.nodes.find(n => n.id === l.targetId)
                })).filter(l => l.source && l.target);

                this.diagramId = diagramId;
                this.diagramType = data.type || 'relationship';

                // Update UI
                document.getElementById('diagramTitle').value = data.title || '';
                document.getElementById('diagramType').value = this.diagramType;

                this._render();
                this._updateStatusCounts();
                this.fitToView();
                this.isDirty = false;

                if (this.onDiagramLoad) {
                    this.onDiagramLoad(data);
                }

                console.log('[DiagramBuilder] Diagram loaded:', diagramId);
            } catch (error) {
                console.error('[DiagramBuilder] Load error:', error);
                alert('Failed to load diagram');
            }
        }

        /**
         * Show load diagram modal
         */
        async _showLoadModal() {
            if (!this.auth?.currentUser || !this.db) {
                alert('Please sign in to load diagrams');
                return;
            }

            const modalContainer = document.getElementById('diagramModals');
            if (!modalContainer) return;

            modalContainer.innerHTML = `
                <div class="diagram-modal-overlay">
                    <div class="diagram-modal load-modal">
                        <div class="modal-header">
                            <h3>Load Diagram</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="diagrams-loading">Loading your diagrams...</div>
                        </div>
                    </div>
                </div>
            `;

            const closeModal = () => modalContainer.innerHTML = '';
            modalContainer.querySelector('.modal-close')?.addEventListener('click', closeModal);

            try {
                const snapshot = await this.db.collection('user_diagrams')
                    .where('userId', '==', this.auth.currentUser.uid)
                    .orderBy('updatedAt', 'desc')
                    .limit(20)
                    .get();

                const diagrams = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const body = modalContainer.querySelector('.modal-body');
                if (!body) return;

                if (diagrams.length === 0) {
                    body.innerHTML = '<p class="no-diagrams">No saved diagrams found</p>';
                    return;
                }

                body.innerHTML = `
                    <div class="diagrams-list">
                        ${diagrams.map(d => `
                            <div class="diagram-list-item" data-id="${d.id}">
                                <div class="diagram-item-info">
                                    <div class="diagram-item-title">${this._escapeHtml(d.title)}</div>
                                    <div class="diagram-item-meta">
                                        ${DIAGRAM_TYPES[d.type]?.icon || '📊'} ${DIAGRAM_TYPES[d.type]?.name || d.type}
                                        <span class="meta-divider">|</span>
                                        ${d.nodes?.length || 0} nodes
                                    </div>
                                </div>
                                <button class="btn-load-diagram">Load</button>
                            </div>
                        `).join('')}
                    </div>
                `;

                body.querySelectorAll('.diagram-list-item').forEach(item => {
                    item.querySelector('.btn-load-diagram')?.addEventListener('click', async () => {
                        if (this.isDirty && !confirm('Load diagram? Unsaved changes will be lost.')) {
                            return;
                        }
                        await this.loadDiagram(item.dataset.id);
                        closeModal();
                    });
                });
            } catch (error) {
                console.error('[DiagramBuilder] Error loading diagrams list:', error);
                modalContainer.querySelector('.modal-body').innerHTML =
                    '<p class="error">Failed to load diagrams</p>';
            }
        }

        /**
         * Show export modal
         */
        _showExportModal() {
            const modalContainer = document.getElementById('diagramModals');
            if (!modalContainer) return;

            modalContainer.innerHTML = `
                <div class="diagram-modal-overlay">
                    <div class="diagram-modal export-modal">
                        <div class="modal-header">
                            <h3>Export Diagram</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="export-options">
                                <button class="export-option" data-format="svg">
                                    <span class="export-icon">📄</span>
                                    <span class="export-label">SVG</span>
                                    <span class="export-desc">Vector graphics, scalable</span>
                                </button>
                                <button class="export-option" data-format="png">
                                    <span class="export-icon">🖼️</span>
                                    <span class="export-label">PNG</span>
                                    <span class="export-desc">Raster image, web-ready</span>
                                </button>
                                <button class="export-option" data-format="json">
                                    <span class="export-icon">📋</span>
                                    <span class="export-label">JSON</span>
                                    <span class="export-desc">Data export, re-importable</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const closeModal = () => modalContainer.innerHTML = '';
            modalContainer.querySelector('.modal-close')?.addEventListener('click', closeModal);
            modalContainer.querySelector('.diagram-modal-overlay')?.addEventListener('click', (e) => {
                if (e.target.classList.contains('diagram-modal-overlay')) closeModal();
            });

            modalContainer.querySelectorAll('.export-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    this._exportDiagram(btn.dataset.format);
                    closeModal();
                });
            });
        }

        /**
         * Export diagram in specified format
         */
        async _exportDiagram(format) {
            const title = document.getElementById('diagramTitle')?.value || 'diagram';
            const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

            switch (format) {
                case 'svg':
                    this._exportSVG(filename);
                    break;
                case 'png':
                    await this._exportPNG(filename);
                    break;
                case 'json':
                    this._exportJSON(filename);
                    break;
            }
        }

        /**
         * Export as SVG
         */
        _exportSVG(filename) {
            const svgEl = document.querySelector('.diagram-svg');
            if (!svgEl) return;

            const svgClone = svgEl.cloneNode(true);

            // Add styles inline
            const styles = `
                .node-bg { fill: var(--color-bg-card, #1a1f3a); stroke: var(--color-border, #2a2f4a); stroke-width: 1; }
                .node-icon { fill: var(--color-text-primary, #f8f9fa); }
                .node-name { fill: var(--color-text-primary, #f8f9fa); font-size: 14px; font-weight: 600; }
                .node-mythology { fill: var(--color-text-secondary, #a8adb3); }
                .link-line { stroke-width: 2; }
                .link-label { fill: var(--color-text-secondary, #a8adb3); font-size: 11px; }
            `;

            const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleEl.textContent = styles;
            svgClone.insertBefore(styleEl, svgClone.firstChild);

            const svgData = new XMLSerializer().serializeToString(svgClone);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            this._downloadBlob(blob, `${filename}.svg`);
        }

        /**
         * Export as PNG
         */
        async _exportPNG(filename) {
            const svgEl = document.querySelector('.diagram-svg');
            if (!svgEl) return;

            const bounds = this._getBounds();
            const padding = 50;
            const width = bounds.maxX - bounds.minX + padding * 2;
            const height = bounds.maxY - bounds.minY + padding * 2;

            const canvas = document.createElement('canvas');
            canvas.width = width * 2; // 2x for retina
            canvas.height = height * 2;
            const ctx = canvas.getContext('2d');
            ctx.scale(2, 2);

            // Background
            ctx.fillStyle = '#0a0f1e';
            ctx.fillRect(0, 0, width, height);

            // Convert SVG to image
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const img = new Image();

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            });

            ctx.drawImage(img, -bounds.minX + padding, -bounds.minY + padding);

            canvas.toBlob(blob => {
                this._downloadBlob(blob, `${filename}.png`);
            }, 'image/png');
        }

        /**
         * Export as JSON
         */
        _exportJSON(filename) {
            const data = {
                title: document.getElementById('diagramTitle')?.value || 'Untitled',
                type: this.diagramType,
                exportedAt: new Date().toISOString(),
                nodes: this.nodes,
                links: this.links.map(l => ({
                    ...l,
                    source: l.source.id,
                    target: l.target.id
                }))
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            this._downloadBlob(blob, `${filename}.json`);
        }

        /**
         * Download blob as file
         */
        _downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        /**
         * Start auto-save timer
         */
        _startAutoSave() {
            if (this.autoSaveTimer) {
                clearInterval(this.autoSaveTimer);
            }

            this.autoSaveTimer = setInterval(() => {
                if (this.isDirty && this.auth?.currentUser && this.nodes.length > 0) {
                    this.saveDiagram();
                }
            }, this.autoSaveInterval);
        }

        /**
         * Update save status display
         */
        _updateSaveStatus(message) {
            const statusEl = document.getElementById('saveStatus');
            if (statusEl) {
                statusEl.textContent = message;
                if (message === 'Saved') {
                    setTimeout(() => {
                        if (statusEl.textContent === 'Saved') {
                            statusEl.textContent = '';
                        }
                    }, 3000);
                }
            }
        }

        /**
         * Show error message
         */
        _showError(message) {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (containerEl) {
                containerEl.innerHTML = `
                    <div class="diagram-error">
                        <div class="error-icon">⚠️</div>
                        <h3>Error</h3>
                        <p>${this._escapeHtml(message)}</p>
                    </div>
                `;
            }
        }

        /**
         * Utility: Get collection name from type
         */
        _getCollectionName(type) {
            const map = {
                deity: 'deities',
                hero: 'heroes',
                creature: 'creatures',
                place: 'places',
                item: 'items',
                concept: 'concepts',
                ritual: 'rituals',
                text: 'texts',
                symbol: 'symbols'
            };
            return map[type] || type + 's';
        }

        /**
         * Utility: Get type from collection name
         */
        _getTypeFromCollection(collection) {
            const map = {
                deities: 'deity',
                heroes: 'hero',
                creatures: 'creature',
                places: 'place',
                items: 'item',
                concepts: 'concept',
                rituals: 'ritual',
                texts: 'text',
                symbols: 'symbol'
            };
            return map[collection] || collection.replace(/s$/, '');
        }

        /**
         * Utility: Capitalize string
         */
        _capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        /**
         * Utility: Truncate string
         */
        _truncate(str, maxLength) {
            if (!str || str.length <= maxLength) return str;
            return str.substring(0, maxLength) + '...';
        }

        /**
         * Utility: Escape HTML
         */
        _escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Cleanup
         */
        destroy() {
            if (this.autoSaveTimer) {
                clearInterval(this.autoSaveTimer);
            }
            if (this.simulation) {
                this.simulation.stop();
            }
            this._removeContextMenu();
        }
    }

    // Export
    window.DiagramBuilder = DiagramBuilder;
    window.DIAGRAM_TYPES = DIAGRAM_TYPES;
    window.RELATIONSHIP_TYPES = RELATIONSHIP_TYPES;

})();
