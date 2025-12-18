/**
 * Mythology Relationship Graph
 * Force-directed graph showing relationships between mythological entities
 * Powered by D3.js force simulation
 */

class RelationshipGraph {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            width: options.width || 1200,
            height: options.height || 800,
            nodeSize: options.nodeSize || { min: 5, max: 30 },
            linkDistance: options.linkDistance || 100,
            chargeStrength: options.chargeStrength || -300,
            collisionRadius: options.collisionRadius || 50,
            mythology: options.mythology || 'all',
            relationshipTypes: options.relationshipTypes || ['all'],
            ...options
        };

        this.data = null;
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.selectedNode = null;
    }

    async init() {
        try {
            this.data = await VisualizationUtils.loadMythologyData();
            this.processGraphData();
            this.render();
            this.startSimulation();
        } catch (error) {
            console.error('Error initializing relationship graph:', error);
            this.showError(error.message);
        }
    }

    processGraphData() {
        // Filter entities by mythology
        const entities = this.options.mythology === 'all'
            ? this.data.entities
            : Object.fromEntries(
                Object.entries(this.data.entities).filter(([id, e]) =>
                    e.mythology === this.options.mythology
                )
            );

        // Create nodes
        this.nodes = Object.values(entities).map(entity => ({
            id: entity.id,
            name: entity.name,
            type: entity.type,
            mythology: entity.mythology,
            domain: entity.domain,
            description: entity.description,
            connections: 0,
            ...entity
        }));

        // Filter and create links
        this.links = this.data.relationships
            .filter(rel => {
                const sourceExists = entities[rel.source];
                const targetExists = entities[rel.target];
                const typeMatch = this.options.relationshipTypes.includes('all') ||
                                this.options.relationshipTypes.includes(rel.type);
                return sourceExists && targetExists && typeMatch;
            })
            .map(rel => ({
                source: rel.source,
                target: rel.target,
                type: rel.type,
                description: rel.description
            }));

        // Count connections
        this.links.forEach(link => {
            const sourceNode = this.nodes.find(n => n.id === link.source);
            const targetNode = this.nodes.find(n => n.id === link.target);
            if (sourceNode) sourceNode.connections++;
            if (targetNode) targetNode.connections++;
        });

        // Calculate importance (for sizing)
        this.nodes.forEach(node => {
            node.importance = this.calculateImportance(node);
        });
    }

    calculateImportance(node) {
        const baseImportance = 1;
        const connectionWeight = 0.5;
        const typeWeight = {
            deity: 2,
            hero: 1.5,
            creature: 1.2,
            place: 1,
            item: 0.8
        };

        return baseImportance +
               (node.connections * connectionWeight) +
               (typeWeight[node.type] || 1);
    }

    render() {
        // Clear container
        d3.select(this.container).html('');

        // Create SVG
        const { svg, width, height } = VisualizationUtils.createResponsiveSVG(
            this.container,
            this.options.width / this.options.height
        );

        this.svg = svg;

        // Create container group
        const g = svg.append('g');

        // Add zoom
        VisualizationUtils.addZoomControls(g);

        // Create link elements
        this.linkElements = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.links)
            .join('line')
            .attr('class', d => `link link-${d.type}`)
            .attr('stroke', d => this.getLinkColor(d.type))
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6)
            .attr('marker-end', 'url(#arrowhead)');

        // Create node elements
        this.nodeElements = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(this.nodes)
            .join('g')
            .attr('class', 'node')
            .call(this.drag());

        // Add circles
        this.nodeElements.append('circle')
            .attr('r', d => this.getNodeRadius(d))
            .attr('fill', d => VisualizationUtils.getEntityColor(d.type, d.mythology))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .on('click', (event, d) => this.handleNodeClick(event, d))
            .on('dblclick', (event, d) => this.showEntityDetails(event, d));

        // Add labels
        this.nodeElements.append('text')
            .attr('dx', d => this.getNodeRadius(d) + 5)
            .attr('dy', 4)
            .attr('font-size', 11)
            .attr('font-weight', 'bold')
            .text(d => d.name)
            .style('pointer-events', 'none');

        // Add tooltips
        this.nodeElements.append('title')
            .html(d => VisualizationUtils.createTooltip(d));

        // Add arrowhead marker
        svg.append('defs')
            .append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 20)
            .attr('refY', 5)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
            .attr('fill', '#999');

        // Add controls and legend
        this.addControls();
        this.addLegend();
    }

    startSimulation() {
        const width = this.options.width;
        const height = this.options.height;

        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(this.options.linkDistance))
            .force('charge', d3.forceManyBody()
                .strength(this.options.chargeStrength))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => this.getNodeRadius(d) + 10))
            .force('x', d3.forceX(width / 2).strength(0.1))
            .force('y', d3.forceY(height / 2).strength(0.1));

        this.simulation.on('tick', () => this.ticked());
    }

    ticked() {
        this.linkElements
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        this.nodeElements
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }

    getNodeRadius(node) {
        const { min, max } = this.options.nodeSize;
        const importance = node.importance || 1;
        return Math.max(min, Math.min(max, importance * 5));
    }

    getLinkColor(type) {
        const colors = {
            parent: '#e74c3c',
            spouse: '#e91e63',
            sibling: '#9c27b0',
            ally: '#2196f3',
            enemy: '#f44336',
            created: '#4caf50',
            killed: '#ff5722',
            transformed: '#ff9800',
            related: '#9e9e9e'
        };
        return colors[type] || '#999';
    }

    drag() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    handleNodeClick(event, node) {
        // Highlight connected nodes
        if (this.selectedNode === node) {
            this.clearHighlight();
            this.selectedNode = null;
        } else {
            this.highlightConnections(node);
            this.selectedNode = node;
        }
    }

    highlightConnections(node) {
        const connectedIds = new Set();

        // Find all connected nodes
        this.links.forEach(link => {
            if (link.source.id === node.id) connectedIds.add(link.target.id);
            if (link.target.id === node.id) connectedIds.add(link.source.id);
        });

        // Highlight nodes
        this.nodeElements.selectAll('circle')
            .attr('opacity', d => d.id === node.id || connectedIds.has(d.id) ? 1 : 0.2);

        // Highlight links
        this.linkElements
            .attr('stroke-opacity', d =>
                d.source.id === node.id || d.target.id === node.id ? 1 : 0.1
            )
            .attr('stroke-width', d =>
                d.source.id === node.id || d.target.id === node.id ? 3 : 2
            );
    }

    clearHighlight() {
        this.nodeElements.selectAll('circle').attr('opacity', 1);
        this.linkElements
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2);
    }

    showEntityDetails(event, entity) {
        event.stopPropagation();

        const panel = d3.select(this.container)
            .append('div')
            .attr('class', 'entity-details-panel')
            .style('position', 'absolute')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`);

        panel.html(`
            <div class="panel-header">
                <h3>${entity.name}</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="panel-content">
                <p><strong>Type:</strong> ${entity.type}</p>
                <p><strong>Mythology:</strong> ${entity.mythology}</p>
                ${entity.domain ? `<p><strong>Domain:</strong> ${entity.domain.join(', ')}</p>` : ''}
                <p><strong>Connections:</strong> ${entity.connections}</p>
                ${entity.description ? `<p>${entity.description.substring(0, 200)}...</p>` : ''}
                <a href="/mythos/${entity.mythology}/deities/${entity.id}.html">View Full Entry →</a>
            </div>
        `);

        panel.select('.close-btn').on('click', () => panel.remove());
    }

    addControls() {
        const controls = d3.select(this.container)
            .insert('div', ':first-child')
            .attr('class', 'graph-controls');

        // Filter by entity type
        const typeFilter = controls.append('div')
            .attr('class', 'control-group');

        typeFilter.append('label').text('Entity Type:');

        const typeSelect = typeFilter.append('select')
            .on('change', (event) => {
                this.options.entityType = event.target.value;
                this.refresh();
            });

        typeSelect.append('option').attr('value', 'all').text('All Types');
        ['deity', 'hero', 'creature', 'place', 'item'].forEach(type => {
            typeSelect.append('option').attr('value', type).text(type.charAt(0).toUpperCase() + type.slice(1));
        });

        // Filter by relationship type
        const relFilter = controls.append('div')
            .attr('class', 'control-group');

        relFilter.append('label').text('Relationship:');

        const relSelect = relFilter.append('select')
            .on('change', (event) => {
                this.options.relationshipTypes = event.target.value === 'all'
                    ? ['all']
                    : [event.target.value];
                this.refresh();
            });

        relSelect.append('option').attr('value', 'all').text('All Relationships');
        ['parent', 'spouse', 'sibling', 'ally', 'enemy', 'created', 'killed'].forEach(type => {
            relSelect.append('option').attr('value', type).text(type.charAt(0).toUpperCase() + type.slice(1));
        });

        // Pause/Resume button
        controls.append('button')
            .text('Pause')
            .attr('id', 'pause-btn')
            .on('click', () => {
                if (this.simulation.alpha() > 0) {
                    this.simulation.stop();
                    d3.select('#pause-btn').text('Resume');
                } else {
                    this.simulation.restart();
                    d3.select('#pause-btn').text('Pause');
                }
            });

        // Reset button
        controls.append('button')
            .text('Reset')
            .on('click', () => this.refresh());

        // Export button
        controls.append('button')
            .text('Export')
            .on('click', () => this.export());
    }

    addLegend() {
        const legendItems = [
            { color: VisualizationUtils.getEntityColor('deity'), label: 'Deity' },
            { color: VisualizationUtils.getEntityColor('hero'), label: 'Hero' },
            { color: VisualizationUtils.getEntityColor('creature'), label: 'Creature' },
            { color: VisualizationUtils.getEntityColor('place'), label: 'Place' },
            { color: VisualizationUtils.getEntityColor('item'), label: 'Item' }
        ];

        VisualizationUtils.createLegend(this.container, legendItems);
    }

    refresh() {
        if (this.simulation) {
            this.simulation.stop();
        }
        this.init();
    }

    async export() {
        const svg = d3.select(this.container).select('svg').node();
        await VisualizationUtils.exportAsImage(svg, 'relationship-graph.png');
    }

    showError(message) {
        d3.select(this.container)
            .html(`<div class="error-message">Error: ${message}</div>`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RelationshipGraph;
}
