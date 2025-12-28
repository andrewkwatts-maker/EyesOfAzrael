/**
 * Cosmology Diagram Renderer
 *
 * Advanced SVG-based renderer for visualizing mythological cosmological structures:
 * - Tree diagrams (Yggdrasil, Tree of Life, Sacred Trees)
 * - Realm maps (Nine Realms, Greek Underworld, Egyptian Duat)
 * - Genealogy trees (deity family trees, lineages)
 * - Cosmic structure diagrams (heavenly layers, underworld levels)
 *
 * Features:
 * - Responsive SVG with container-based scaling
 * - Interactive elements with click-to-navigate
 * - Zoom/pan controls for complex diagrams
 * - Mobile-optimized touch interactions
 * - Firebase data integration
 * - Export to PNG/SVG
 *
 * Usage:
 *   <div data-cosmology-diagram
 *        data-type="tree"
 *        data-mythology="norse"
 *        data-structure="yggdrasil"></div>
 */

class CosmologyDiagramRenderer {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.diagrams = new Map();

        // Default configuration
        this.config = {
            width: 1200,
            height: 800,
            padding: 50,
            nodeRadius: 40,
            fontSize: 12,
            linkColor: '#999',
            linkWidth: 2,
            animationDuration: 300
        };

        // Diagram type handlers
        this.handlers = {
            tree: this.renderTree.bind(this),
            realm_map: this.renderRealmMap.bind(this),
            genealogy: this.renderGenealogy.bind(this),
            cosmic_layers: this.renderCosmicLayers.bind(this)
        };
    }

    /**
     * Initialize Firebase connection
     */
    async initFirebase() {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            this.db = firebase.firestore();
            this.initialized = true;
            return true;
        }
        return false;
    }

    /**
     * Initialize all diagram elements on the page
     */
    async initializeAll() {
        await this.initFirebase();

        const elements = document.querySelectorAll('[data-cosmology-diagram]');
        for (const element of elements) {
            await this.initialize(element);
        }
    }

    /**
     * Initialize a single diagram element
     */
    async initialize(element) {
        const type = element.getAttribute('data-type') || 'tree';
        const mythology = element.getAttribute('data-mythology');
        const structure = element.getAttribute('data-structure');
        const entityId = element.getAttribute('data-entity-id');

        if (!mythology || !structure) {
            console.error('Cosmology diagram: missing mythology or structure');
            element.innerHTML = '<div class="error-message">Missing required attributes</div>';
            return;
        }

        try {
            // Show loading state
            element.innerHTML = '<div class="loading-spinner">Loading cosmology diagram...</div>';

            // Load data
            let data;
            if (entityId && this.db) {
                data = await this.loadFromFirebase(mythology, structure, entityId);
            } else {
                data = await this.loadStaticData(mythology, structure);
            }

            if (!data) {
                element.innerHTML = '<div class="error-message">Cosmology data not found</div>';
                return;
            }

            // Render diagram
            const handler = this.handlers[type];
            if (handler) {
                await handler(element, data, { mythology, structure });
            } else {
                throw new Error(`Unknown diagram type: ${type}`);
            }

            // Store reference
            this.diagrams.set(element, { type, mythology, structure, data });

        } catch (error) {
            console.error('Error initializing cosmology diagram:', error);
            element.innerHTML = `<div class="error-message">Error loading diagram: ${error.message}</div>`;
        }
    }

    /**
     * Load cosmology data from Firebase
     */
    async loadFromFirebase(mythology, structure, entityId) {
        try {
            const docRef = this.db
                .collection('entities')
                .doc(mythology)
                .collection('cosmology')
                .doc(entityId);

            const doc = await docRef.get();
            if (!doc.exists) return null;

            return doc.data();
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            return null;
        }
    }

    /**
     * Load static cosmology data
     */
    async loadStaticData(mythology, structure) {
        // Return predefined structures for common cosmologies
        return this.getPredefinedStructure(mythology, structure);
    }

    /**
     * Get predefined cosmological structures
     */
    getPredefinedStructure(mythology, structure) {
        const structures = {
            norse: {
                yggdrasil: {
                    type: 'tree',
                    name: 'Yggdrasil - The World Tree',
                    description: 'The cosmic ash tree connecting the Nine Realms',
                    root: {
                        name: 'Yggdrasil',
                        type: 'cosmic_tree',
                        children: [
                            {
                                name: 'Asgard',
                                type: 'realm',
                                description: 'Realm of the Aesir gods',
                                color: '#FFD700',
                                position: 'crown',
                                inhabitants: ['Odin', 'Thor', 'Frigg']
                            },
                            {
                                name: 'Vanaheim',
                                type: 'realm',
                                description: 'Realm of the Vanir gods',
                                color: '#2ECC71',
                                position: 'upper_branches'
                            },
                            {
                                name: 'Alfheim',
                                type: 'realm',
                                description: 'Realm of the Light Elves',
                                color: '#F1C40F',
                                position: 'upper_branches'
                            },
                            {
                                name: 'Midgard',
                                type: 'realm',
                                description: 'Realm of humans',
                                color: '#95A5A6',
                                position: 'middle',
                                inhabitants: ['Humans']
                            },
                            {
                                name: 'Jotunheim',
                                type: 'realm',
                                description: 'Realm of the Giants',
                                color: '#7F8C8D',
                                position: 'middle'
                            },
                            {
                                name: 'Svartalfheim',
                                type: 'realm',
                                description: 'Realm of the Dark Elves',
                                color: '#34495E',
                                position: 'lower_branches'
                            },
                            {
                                name: 'Niflheim',
                                type: 'realm',
                                description: 'Realm of ice and mist',
                                color: '#3498DB',
                                position: 'roots'
                            },
                            {
                                name: 'Muspelheim',
                                type: 'realm',
                                description: 'Realm of fire',
                                color: '#E74C3C',
                                position: 'roots'
                            },
                            {
                                name: 'Helheim',
                                type: 'realm',
                                description: 'Realm of the dead',
                                color: '#2C3E50',
                                position: 'roots',
                                ruler: 'Hel'
                            }
                        ]
                    },
                    connections: [
                        { from: 'Asgard', to: 'Midgard', type: 'Bifrost', description: 'Rainbow bridge' },
                        { from: 'Midgard', to: 'Helheim', type: 'path', description: 'Path of the dead' }
                    ]
                },
                nine_realms: {
                    type: 'realm_map',
                    name: 'The Nine Realms',
                    description: 'Cosmic structure of Norse cosmology',
                    layout: 'vertical',
                    realms: [
                        { name: 'Asgard', level: 3, x: 50, y: 10 },
                        { name: 'Vanaheim', level: 2, x: 20, y: 25 },
                        { name: 'Alfheim', level: 2, x: 80, y: 25 },
                        { name: 'Midgard', level: 1, x: 50, y: 50 },
                        { name: 'Jotunheim', level: 1, x: 20, y: 50 },
                        { name: 'Svartalfheim', level: 1, x: 80, y: 50 },
                        { name: 'Niflheim', level: 0, x: 20, y: 85 },
                        { name: 'Muspelheim', level: 0, x: 80, y: 85 },
                        { name: 'Helheim', level: 0, x: 50, y: 90 }
                    ]
                }
            },
            jewish: {
                tree_of_life: {
                    type: 'tree',
                    name: 'Kabbalistic Tree of Life',
                    description: 'The ten Sefirot representing divine emanations',
                    root: {
                        name: 'Keter',
                        type: 'sefirah',
                        meaning: 'Crown',
                        description: 'Divine will, the source',
                        color: '#FFFFFF',
                        children: [
                            {
                                name: 'Chokmah',
                                type: 'sefirah',
                                meaning: 'Wisdom',
                                color: '#3498DB',
                                path: 'right'
                            },
                            {
                                name: 'Binah',
                                type: 'sefirah',
                                meaning: 'Understanding',
                                color: '#2C3E50',
                                path: 'left',
                                children: [
                                    {
                                        name: 'Chesed',
                                        type: 'sefirah',
                                        meaning: 'Loving-kindness',
                                        color: '#2ECC71',
                                        path: 'right'
                                    },
                                    {
                                        name: 'Gevurah',
                                        type: 'sefirah',
                                        meaning: 'Strength/Judgment',
                                        color: '#E74C3C',
                                        path: 'left',
                                        children: [
                                            {
                                                name: 'Tiferet',
                                                type: 'sefirah',
                                                meaning: 'Beauty/Harmony',
                                                color: '#F39C12',
                                                path: 'center',
                                                children: [
                                                    {
                                                        name: 'Netzach',
                                                        type: 'sefirah',
                                                        meaning: 'Victory/Eternity',
                                                        color: '#9B59B6',
                                                        path: 'right'
                                                    },
                                                    {
                                                        name: 'Hod',
                                                        type: 'sefirah',
                                                        meaning: 'Glory/Splendor',
                                                        color: '#E67E22',
                                                        path: 'left',
                                                        children: [
                                                            {
                                                                name: 'Yesod',
                                                                type: 'sefirah',
                                                                meaning: 'Foundation',
                                                                color: '#8E44AD',
                                                                path: 'center',
                                                                children: [
                                                                    {
                                                                        name: 'Malkhut',
                                                                        type: 'sefirah',
                                                                        meaning: 'Kingdom/Sovereignty',
                                                                        color: '#95A5A6',
                                                                        path: 'center'
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    paths: [
                        { from: 'Keter', to: 'Chokmah', number: 11 },
                        { from: 'Keter', to: 'Binah', number: 12 },
                        { from: 'Chokmah', to: 'Binah', number: 14 },
                        { from: 'Chokmah', to: 'Tiferet', number: 17 },
                        { from: 'Binah', to: 'Tiferet', number: 19 },
                        { from: 'Chesed', to: 'Gevurah', number: 18 },
                        { from: 'Chesed', to: 'Tiferet', number: 20 },
                        { from: 'Gevurah', to: 'Tiferet', number: 22 },
                        { from: 'Tiferet', to: 'Netzach', number: 24 },
                        { from: 'Tiferet', to: 'Hod', number: 26 },
                        { from: 'Netzach', to: 'Hod', number: 27 },
                        { from: 'Netzach', to: 'Yesod', number: 28 },
                        { from: 'Hod', to: 'Yesod', number: 30 },
                        { from: 'Yesod', to: 'Malkhut', number: 32 }
                    ]
                }
            },
            greek: {
                underworld: {
                    type: 'realm_map',
                    name: 'The Greek Underworld',
                    description: 'Hades and its regions',
                    layout: 'vertical',
                    realms: [
                        {
                            name: 'Earth',
                            level: 0,
                            description: 'The mortal world',
                            color: '#2ECC71'
                        },
                        {
                            name: 'Entrance - River Styx',
                            level: 1,
                            description: 'Charon ferries souls across',
                            color: '#34495E'
                        },
                        {
                            name: 'Asphodel Meadows',
                            level: 2,
                            description: 'Where ordinary souls dwell',
                            color: '#95A5A6'
                        },
                        {
                            name: 'Elysium',
                            level: 2,
                            description: 'Paradise for the virtuous',
                            color: '#F1C40F',
                            position: 'left'
                        },
                        {
                            name: 'Tartarus',
                            level: 3,
                            description: 'Prison of the Titans and wicked',
                            color: '#C0392B',
                            position: 'right'
                        }
                    ],
                    guardians: [
                        { name: 'Cerberus', guards: 'Entrance' },
                        { name: 'Hades', rules: 'Underworld' },
                        { name: 'Persephone', rules: 'Underworld' }
                    ]
                },
                olympian_genealogy: {
                    type: 'genealogy',
                    name: 'Olympian Family Tree',
                    description: 'Genealogy from Chaos to the Olympians',
                    root: {
                        name: 'Chaos',
                        generation: 0,
                        children: [
                            {
                                name: 'Gaia',
                                generation: 1,
                                partner: 'Uranus',
                                children: [
                                    {
                                        name: 'Cronus',
                                        generation: 2,
                                        partner: 'Rhea',
                                        children: [
                                            { name: 'Zeus', generation: 3, domain: ['Sky', 'Thunder'] },
                                            { name: 'Poseidon', generation: 3, domain: ['Sea'] },
                                            { name: 'Hades', generation: 3, domain: ['Underworld'] },
                                            { name: 'Hera', generation: 3, domain: ['Marriage'] },
                                            { name: 'Demeter', generation: 3, domain: ['Agriculture'] },
                                            { name: 'Hestia', generation: 3, domain: ['Hearth'] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            egyptian: {
                duat: {
                    type: 'realm_map',
                    name: 'The Duat - Egyptian Underworld',
                    description: 'The twelve hours of the night journey',
                    layout: 'horizontal',
                    hours: [
                        { hour: 1, name: 'First Hour', description: 'Entrance to Duat' },
                        { hour: 2, name: 'Second Hour', description: 'Waters of Osiris' },
                        { hour: 3, name: 'Third Hour', description: 'Chamber of Fire' },
                        { hour: 4, name: 'Fourth Hour', description: 'Difficult paths' },
                        { hour: 5, name: 'Fifth Hour', description: 'Cavern of Sokar' },
                        { hour: 6, name: 'Sixth Hour', description: 'Deepest point' },
                        { hour: 7, name: 'Seventh Hour', description: 'Defeat of Apophis' },
                        { hour: 8, name: 'Eighth Hour', description: 'Clothing chamber' },
                        { hour: 9, name: 'Ninth Hour', description: 'Rowing gods' },
                        { hour: 10, name: 'Tenth Hour', description: 'Waters deepen' },
                        { hour: 11, name: 'Eleventh Hour', description: 'Preparation for rebirth' },
                        { hour: 12, name: 'Twelfth Hour', description: 'Rebirth and dawn' }
                    ]
                }
            }
        };

        return structures[mythology]?.[structure] || null;
    }

    /**
     * Render tree diagram (e.g., Yggdrasil, Tree of Life)
     */
    async renderTree(element, data, options) {
        const container = this.createContainer(element);
        const { svg, width, height } = this.createSVG(container);

        // Create main group with zoom/pan
        const g = svg.append('g').attr('class', 'diagram-group');
        this.addZoomPan(svg, g);

        // Calculate tree layout
        const treeLayout = d3.tree()
            .size([width - this.config.padding * 2, height - this.config.padding * 2])
            .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

        const root = d3.hierarchy(data.root);
        const treeData = treeLayout(root);

        // Center the tree
        g.attr('transform', `translate(${this.config.padding}, ${this.config.padding})`);

        // Draw connections/paths
        if (data.paths) {
            this.drawPaths(g, data.paths, treeData);
        } else {
            this.drawLinks(g, treeData.links(), data);
        }

        // Draw nodes
        this.drawNodes(g, treeData.descendants(), data, options);

        // Add legend
        this.addLegend(container, data);

        // Add controls
        this.addControls(container, element, data);
    }

    /**
     * Render realm map (e.g., Nine Realms, Underworld)
     */
    async renderRealmMap(element, data, options) {
        const container = this.createContainer(element);
        const { svg, width, height } = this.createSVG(container);

        const g = svg.append('g').attr('class', 'diagram-group');
        this.addZoomPan(svg, g);

        if (data.layout === 'vertical') {
            this.renderVerticalRealmMap(g, data, width, height);
        } else if (data.layout === 'horizontal') {
            this.renderHorizontalRealmMap(g, data, width, height);
        }

        this.addLegend(container, data);
        this.addControls(container, element, data);
    }

    /**
     * Render genealogy tree
     */
    async renderGenealogy(element, data, options) {
        const container = this.createContainer(element);
        const { svg, width, height } = this.createSVG(container);

        const g = svg.append('g').attr('class', 'diagram-group');
        this.addZoomPan(svg, g);

        // Use hierarchical layout
        const treeLayout = d3.tree()
            .size([width - this.config.padding * 2, height - this.config.padding * 2]);

        const root = d3.hierarchy(data.root);
        const treeData = treeLayout(root);

        g.attr('transform', `translate(${this.config.padding}, ${this.config.padding})`);

        // Draw family connections
        this.drawFamilyLinks(g, treeData.links(), data);
        this.drawFamilyNodes(g, treeData.descendants(), data, options);

        this.addLegend(container, data);
        this.addControls(container, element, data);
    }

    /**
     * Render cosmic layers (e.g., Seven Heavens)
     */
    async renderCosmicLayers(element, data, options) {
        const container = this.createContainer(element);
        const { svg, width, height } = this.createSVG(container);

        const g = svg.append('g').attr('class', 'diagram-group');

        const layers = data.layers || [];
        const layerHeight = (height - this.config.padding * 2) / layers.length;

        layers.forEach((layer, index) => {
            const y = this.config.padding + (index * layerHeight);

            // Draw layer background
            g.append('rect')
                .attr('x', this.config.padding)
                .attr('y', y)
                .attr('width', width - this.config.padding * 2)
                .attr('height', layerHeight - 10)
                .attr('fill', layer.color || '#95A5A6')
                .attr('opacity', 0.3)
                .attr('rx', 10);

            // Draw layer label
            g.append('text')
                .attr('x', width / 2)
                .attr('y', y + layerHeight / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', 18)
                .attr('font-weight', 'bold')
                .text(layer.name);

            // Add description on hover
            const layerGroup = g.append('g')
                .attr('class', 'layer-interactive')
                .style('cursor', 'pointer');

            layerGroup.append('rect')
                .attr('x', this.config.padding)
                .attr('y', y)
                .attr('width', width - this.config.padding * 2)
                .attr('height', layerHeight - 10)
                .attr('fill', 'transparent')
                .on('click', () => this.showLayerInfo(layer));
        });

        this.addControls(container, element, data);
    }

    /**
     * Draw links between nodes
     */
    drawLinks(g, links, data) {
        const linkGenerator = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y);

        g.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(links)
            .join('path')
            .attr('d', linkGenerator)
            .attr('fill', 'none')
            .attr('stroke', data.linkColor || this.config.linkColor)
            .attr('stroke-width', this.config.linkWidth)
            .attr('stroke-opacity', 0.6);
    }

    /**
     * Draw paths with labels (for Tree of Life)
     */
    drawPaths(g, paths, treeData) {
        const nodes = {};
        treeData.descendants().forEach(d => {
            nodes[d.data.name] = d;
        });

        paths.forEach(path => {
            const source = nodes[path.from];
            const target = nodes[path.to];

            if (source && target) {
                g.append('line')
                    .attr('x1', source.x)
                    .attr('y1', source.y)
                    .attr('x2', target.x)
                    .attr('y2', target.y)
                    .attr('stroke', '#999')
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '5,5')
                    .attr('opacity', 0.4);
            }
        });
    }

    /**
     * Draw tree nodes
     */
    drawNodes(g, nodes, data, options) {
        const nodeGroups = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.handleNodeClick(event, d, options));

        // Draw circles
        nodeGroups.append('circle')
            .attr('r', this.config.nodeRadius)
            .attr('fill', d => d.data.color || '#3498DB')
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .on('mouseenter', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', this.config.nodeRadius * 1.2);
            }.bind(this))
            .on('mouseleave', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', this.config.nodeRadius);
            }.bind(this));

        // Draw labels
        nodeGroups.append('text')
            .attr('dy', this.config.nodeRadius + 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', this.config.fontSize)
            .attr('font-weight', 'bold')
            .attr('fill', '#333')
            .text(d => d.data.name);

        // Add sublabels (meaning, domain, etc.)
        nodeGroups.append('text')
            .attr('dy', this.config.nodeRadius + 35)
            .attr('text-anchor', 'middle')
            .attr('font-size', this.config.fontSize - 2)
            .attr('fill', '#666')
            .text(d => d.data.meaning || (d.data.domain ? d.data.domain.join(', ') : ''));

        // Add tooltips
        nodeGroups.append('title')
            .text(d => this.createTooltipText(d.data));
    }

    /**
     * Draw family links (includes partner relationships)
     */
    drawFamilyLinks(g, links, data) {
        links.forEach(link => {
            const line = g.append('path')
                .attr('d', this.createFamilyPath(link))
                .attr('fill', 'none')
                .attr('stroke', '#999')
                .attr('stroke-width', 2);

            // Add marriage indicators
            if (link.source.data.partner) {
                g.append('text')
                    .attr('x', (link.source.x + link.target.x) / 2)
                    .attr('y', (link.source.y + link.target.y) / 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', 10)
                    .attr('fill', '#E74C3C')
                    .text('♥');
            }
        });
    }

    /**
     * Create family path (curved for visual clarity)
     */
    createFamilyPath(link) {
        const sx = link.source.x;
        const sy = link.source.y;
        const tx = link.target.x;
        const ty = link.target.y;

        return `M${sx},${sy} C${sx},${(sy + ty) / 2} ${tx},${(sy + ty) / 2} ${tx},${ty}`;
    }

    /**
     * Draw family nodes with generation indicators
     */
    drawFamilyNodes(g, nodes, data, options) {
        const nodeGroups = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.handleNodeClick(event, d, options));

        // Color by generation
        nodeGroups.append('circle')
            .attr('r', this.config.nodeRadius)
            .attr('fill', d => this.getGenerationColor(d.data.generation || d.depth))
            .attr('stroke', '#fff')
            .attr('stroke-width', 3);

        // Add name
        nodeGroups.append('text')
            .attr('dy', this.config.nodeRadius + 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', this.config.fontSize)
            .attr('font-weight', 'bold')
            .text(d => d.data.name);

        // Add generation label
        nodeGroups.append('text')
            .attr('dy', -this.config.nodeRadius - 10)
            .attr('text-anchor', 'middle')
            .attr('font-size', 10)
            .attr('fill', '#666')
            .text(d => `Gen ${d.data.generation || d.depth}`);
    }

    /**
     * Render vertical realm map
     */
    renderVerticalRealmMap(g, data, width, height) {
        const realms = data.realms || [];
        const levels = Math.max(...realms.map(r => r.level || 0)) + 1;
        const levelHeight = (height - this.config.padding * 2) / levels;

        realms.forEach(realm => {
            const y = height - this.config.padding - ((realm.level || 0) * levelHeight) - levelHeight / 2;
            const x = ((realm.x || 50) / 100) * (width - this.config.padding * 2) + this.config.padding;

            // Draw realm
            const realmGroup = g.append('g')
                .attr('class', 'realm')
                .attr('transform', `translate(${x},${y})`)
                .style('cursor', 'pointer')
                .on('click', () => this.showRealmInfo(realm));

            realmGroup.append('circle')
                .attr('r', 50)
                .attr('fill', realm.color || '#3498DB')
                .attr('opacity', 0.7)
                .attr('stroke', '#fff')
                .attr('stroke-width', 3);

            realmGroup.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', 5)
                .attr('font-size', 14)
                .attr('font-weight', 'bold')
                .attr('fill', '#fff')
                .text(realm.name);
        });

        // Draw connections
        if (data.connections) {
            this.drawRealmConnections(g, data.connections, realms, width, height, levels, levelHeight);
        }
    }

    /**
     * Render horizontal realm map (for journey-type cosmologies)
     */
    renderHorizontalRealmMap(g, data, width, height) {
        const hours = data.hours || [];
        const stepWidth = (width - this.config.padding * 2) / hours.length;

        // Draw path
        const pathY = height / 2;
        g.append('path')
            .attr('d', `M${this.config.padding},${pathY} L${width - this.config.padding},${pathY}`)
            .attr('stroke', '#999')
            .attr('stroke-width', 4)
            .attr('stroke-dasharray', '10,5');

        // Draw hour markers
        hours.forEach((hour, index) => {
            const x = this.config.padding + (index * stepWidth) + stepWidth / 2;

            const hourGroup = g.append('g')
                .attr('class', 'hour')
                .attr('transform', `translate(${x},${pathY})`)
                .style('cursor', 'pointer')
                .on('click', () => this.showHourInfo(hour));

            hourGroup.append('circle')
                .attr('r', 30)
                .attr('fill', '#F39C12')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);

            hourGroup.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', 5)
                .attr('font-size', 16)
                .attr('font-weight', 'bold')
                .attr('fill', '#fff')
                .text(hour.hour);

            hourGroup.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', 50)
                .attr('font-size', 11)
                .text(hour.name);
        });
    }

    /**
     * Draw connections between realms
     */
    drawRealmConnections(g, connections, realms, width, height, levels, levelHeight) {
        const realmPositions = {};
        realms.forEach(realm => {
            const y = height - this.config.padding - ((realm.level || 0) * levelHeight) - levelHeight / 2;
            const x = ((realm.x || 50) / 100) * (width - this.config.padding * 2) + this.config.padding;
            realmPositions[realm.name] = { x, y };
        });

        connections.forEach(conn => {
            const source = realmPositions[conn.from];
            const target = realmPositions[conn.to];

            if (source && target) {
                g.append('line')
                    .attr('x1', source.x)
                    .attr('y1', source.y)
                    .attr('x2', target.x)
                    .attr('y2', target.y)
                    .attr('stroke', conn.type === 'Bifrost' ? '#FFD700' : '#999')
                    .attr('stroke-width', conn.type === 'Bifrost' ? 4 : 2)
                    .attr('stroke-dasharray', conn.type === 'Bifrost' ? '0' : '5,5')
                    .attr('opacity', 0.6);

                // Add label
                g.append('text')
                    .attr('x', (source.x + target.x) / 2)
                    .attr('y', (source.y + target.y) / 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', 10)
                    .attr('fill', '#666')
                    .text(conn.type);
            }
        });
    }

    /**
     * Create container with title and description
     */
    createContainer(element) {
        element.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'cosmology-diagram-container';

        const header = document.createElement('div');
        header.className = 'diagram-header';
        container.appendChild(header);

        const content = document.createElement('div');
        content.className = 'diagram-content';
        container.appendChild(content);

        element.appendChild(container);

        return content;
    }

    /**
     * Create responsive SVG
     */
    createSVG(container) {
        const width = container.clientWidth || this.config.width;
        const height = this.config.height;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('class', 'cosmology-svg');

        // Make responsive
        window.addEventListener('resize', () => {
            const newWidth = container.clientWidth;
            svg.attr('width', newWidth);
        });

        return { svg, width, height };
    }

    /**
     * Add zoom and pan controls
     */
    addZoomPan(svg, g) {
        const zoom = d3.zoom()
            .scaleExtent([0.3, 5])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Set initial transform
        svg.call(zoom.transform, d3.zoomIdentity.scale(0.8));

        // Touch-friendly: add pinch zoom
        if ('ontouchstart' in window) {
            svg.on('touchstart', function(event) {
                if (event.touches.length === 2) {
                    event.preventDefault();
                }
            });
        }
    }

    /**
     * Add legend
     */
    addLegend(container, data) {
        if (!data.legend && !data.realms) return;

        const legend = document.createElement('div');
        legend.className = 'diagram-legend';

        let items = [];
        if (data.legend) {
            items = data.legend;
        } else if (data.realms) {
            items = data.realms.map(r => ({
                label: r.name,
                color: r.color || '#3498DB'
            }));
        }

        items.forEach(item => {
            const entry = document.createElement('div');
            entry.className = 'legend-entry';
            entry.innerHTML = `
                <span class="legend-color" style="background-color: ${item.color}"></span>
                <span class="legend-label">${item.label}</span>
            `;
            legend.appendChild(entry);
        });

        container.parentElement.insertBefore(legend, container);
    }

    /**
     * Add control buttons
     */
    addControls(container, element, data) {
        const controls = document.createElement('div');
        controls.className = 'diagram-controls';

        // Reset zoom button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn-control';
        resetBtn.textContent = 'Reset View';
        resetBtn.onclick = () => {
            const svg = d3.select(container).select('svg');
            const g = svg.select('.diagram-group');
            svg.call(d3.zoom().transform, d3.zoomIdentity.scale(0.8));
        };
        controls.appendChild(resetBtn);

        // Export PNG button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn-control';
        exportBtn.textContent = 'Export PNG';
        exportBtn.onclick = () => this.exportDiagram(container, 'cosmology-diagram.png');
        controls.appendChild(exportBtn);

        // Fullscreen button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'btn-control';
        fullscreenBtn.textContent = 'Fullscreen';
        fullscreenBtn.onclick = () => this.toggleFullscreen(element);
        controls.appendChild(fullscreenBtn);

        container.parentElement.insertBefore(controls, container);
    }

    /**
     * Handle node click
     */
    handleNodeClick(event, node, options) {
        event.stopPropagation();

        // Navigate to entity page if mythology is specified
        if (options.mythology && node.data.type === 'realm') {
            const url = `/mythos/${options.mythology}/cosmology/${node.data.name.toLowerCase().replace(/\s+/g, '-')}.html`;
            window.location.href = url;
        } else {
            this.showNodeInfo(node);
        }
    }

    /**
     * Show node information modal
     */
    showNodeInfo(node) {
        const modal = document.createElement('div');
        modal.className = 'cosmology-modal';
        modal.innerHTML = `
            <div class="cosmology-modal-content">
                <span class="cosmology-modal-close">&times;</span>
                <h2>${node.data.name}</h2>
                ${node.data.meaning ? `<p class="meaning"><em>${node.data.meaning}</em></p>` : ''}
                ${node.data.description ? `<p>${node.data.description}</p>` : ''}
                ${node.data.ruler ? `<p><strong>Ruler:</strong> ${node.data.ruler}</p>` : ''}
                ${node.data.inhabitants ? `<p><strong>Inhabitants:</strong> ${node.data.inhabitants.join(', ')}</p>` : ''}
                ${node.data.domain ? `<p><strong>Domain:</strong> ${node.data.domain.join(', ')}</p>` : ''}
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.cosmology-modal-close').onclick = () => {
            document.body.removeChild(modal);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
    }

    /**
     * Show realm information
     */
    showRealmInfo(realm) {
        this.showNodeInfo({ data: realm });
    }

    /**
     * Show hour information (for journey maps)
     */
    showHourInfo(hour) {
        this.showNodeInfo({ data: hour });
    }

    /**
     * Show layer information
     */
    showLayerInfo(layer) {
        this.showNodeInfo({ data: layer });
    }

    /**
     * Get color for generation
     */
    getGenerationColor(generation) {
        const colors = ['#9B59B6', '#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#95A5A6'];
        return colors[generation % colors.length];
    }

    /**
     * Create tooltip text
     */
    createTooltipText(data) {
        const parts = [data.name];
        if (data.meaning) parts.push(data.meaning);
        if (data.description) parts.push(data.description);
        if (data.domain) parts.push(`Domain: ${data.domain.join(', ')}`);
        return parts.join('\n');
    }

    /**
     * Export diagram as PNG
     */
    async exportDiagram(container, filename) {
        const svg = container.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = svg.clientWidth;
            canvas.height = svg.clientHeight;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            canvas.toBlob((blob) => {
                const link = document.createElement('a');
                link.download = filename;
                link.href = URL.createObjectURL(blob);
                link.click();
            });
        };

        img.src = url;
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen(element) {
        if (!document.fullscreenElement) {
            element.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof d3 === 'undefined') {
        console.error('D3.js not loaded. Cosmology diagrams require D3.js v7+');
        return;
    }

    const renderer = new CosmologyDiagramRenderer();
    await renderer.initializeAll();

    // Expose globally for manual initialization
    window.CosmologyDiagramRenderer = renderer;
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CosmologyDiagramRenderer;
}
