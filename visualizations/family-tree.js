/**
 * Family Tree Generator
 * Interactive collapsible family trees for mythology
 * Supports Greek Titans → Olympians, Norse Ymir → Aesir/Vanir, etc.
 */

class FamilyTreeGenerator {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            width: options.width || 1200,
            height: options.height || 800,
            nodeRadius: options.nodeRadius || 30,
            levelHeight: options.levelHeight || 150,
            mythology: options.mythology || 'all',
            startEntity: options.startEntity || null,
            ...options
        };

        this.data = null;
        this.svg = null;
        this.treeLayout = null;
        this.root = null;
    }

    async init() {
        try {
            this.data = await VisualizationUtils.loadMythologyData();
            this.buildTree();
            this.render();
        } catch (error) {
            console.error('Error initializing family tree:', error);
            this.showError(error.message);
        }
    }

    buildTree() {
        // Find root entities (those without parents)
        const entities = this.filterByMythology(this.data.entities);
        const rootEntities = this.findRootEntities(entities);

        // Build hierarchical structure
        this.root = {
            name: this.options.mythology === 'all' ? 'All Mythologies' : `${this.options.mythology} Mythology`,
            children: rootEntities.map(entity => this.buildEntityNode(entity, entities, new Set()))
        };
    }

    filterByMythology(entities) {
        if (this.options.mythology === 'all') return entities;

        return Object.fromEntries(
            Object.entries(entities).filter(([id, entity]) =>
                entity.mythology === this.options.mythology
            )
        );
    }

    findRootEntities(entities) {
        const hasParent = new Set();

        // Find all entities that are children
        Object.values(entities).forEach(entity => {
            const parentRels = entity.relationships?.filter(r => r.type === 'parent') || [];
            parentRels.forEach(rel => hasParent.add(entity.id));
        });

        // Return entities without parents
        return Object.values(entities).filter(entity => !hasParent.has(entity.id));
    }

    buildEntityNode(entity, entities, visited) {
        if (visited.has(entity.id)) {
            return {
                name: entity.name,
                id: entity.id,
                circular: true,
                ...entity
            };
        }

        visited.add(entity.id);

        // Find children
        const children = this.findChildren(entity, entities);
        const childNodes = children.map(child =>
            this.buildEntityNode(child, entities, new Set(visited))
        );

        return {
            name: entity.name,
            id: entity.id,
            type: entity.type,
            mythology: entity.mythology,
            domain: entity.domain,
            description: entity.description,
            relationships: entity.relationships,
            children: childNodes.length > 0 ? childNodes : null,
            _collapsed: false,
            ...entity
        };
    }

    findChildren(entity, entities) {
        const children = [];

        Object.values(entities).forEach(other => {
            const parentRels = other.relationships?.filter(r =>
                r.type === 'parent' && r.targetId === entity.id
            ) || [];

            if (parentRels.length > 0) {
                children.push(other);
            }
        });

        return children;
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

        // Create tree layout
        this.treeLayout = d3.tree()
            .size([width - 100, height - 100])
            .separation((a, b) => a.parent === b.parent ? 1 : 1.5);

        // Create container group
        const g = svg.append('g')
            .attr('transform', 'translate(50, 50)');

        // Add zoom
        VisualizationUtils.addZoomControls(g, 0.8);

        // Create hierarchy
        const hierarchy = d3.hierarchy(this.root);
        const treeData = this.treeLayout(hierarchy);

        // Draw links
        this.drawLinks(g, treeData.links());

        // Draw nodes
        this.drawNodes(g, treeData.descendants());

        // Add controls
        this.addControls();
    }

    drawLinks(g, links) {
        const linkGenerator = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y);

        g.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(links)
            .join('path')
            .attr('class', 'tree-link')
            .attr('d', linkGenerator)
            .attr('fill', 'none')
            .attr('stroke', '#999')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6);
    }

    drawNodes(g, nodes) {
        const nodeGroup = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', 'tree-node')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.toggleNode(event, d));

        // Add circles
        nodeGroup.append('circle')
            .attr('r', this.options.nodeRadius)
            .attr('fill', d => {
                if (d.depth === 0) return '#9b59b6';
                return VisualizationUtils.getEntityColor(d.data.type, d.data.mythology);
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 3);

        // Add collapse indicator
        nodeGroup.append('circle')
            .attr('r', 8)
            .attr('cx', this.options.nodeRadius - 5)
            .attr('cy', -this.options.nodeRadius + 5)
            .attr('fill', '#fff')
            .attr('stroke', '#333')
            .attr('stroke-width', 2)
            .style('display', d => d.children || d._children ? 'block' : 'none');

        nodeGroup.append('text')
            .attr('x', this.options.nodeRadius - 5)
            .attr('y', -this.options.nodeRadius + 9)
            .attr('text-anchor', 'middle')
            .attr('font-size', 10)
            .attr('font-weight', 'bold')
            .text(d => d._collapsed ? '+' : '-')
            .style('display', d => d.children || d._children ? 'block' : 'none');

        // Add labels
        nodeGroup.append('text')
            .attr('dy', this.options.nodeRadius + 15)
            .attr('text-anchor', 'middle')
            .attr('font-size', 12)
            .attr('font-weight', 'bold')
            .text(d => d.data.name);

        // Add domain labels
        nodeGroup.append('text')
            .attr('dy', this.options.nodeRadius + 30)
            .attr('text-anchor', 'middle')
            .attr('font-size', 9)
            .attr('fill', '#666')
            .text(d => d.data.domain ? d.data.domain.slice(0, 2).join(', ') : '');

        // Add tooltips
        nodeGroup.append('title')
            .html(d => VisualizationUtils.createTooltip(d.data));

        // Add click to view details
        nodeGroup.on('dblclick', (event, d) => {
            event.stopPropagation();
            this.showEntityDetails(d.data);
        });
    }

    toggleNode(event, d) {
        if (d.children || d._children) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
                d.data._collapsed = true;
            } else {
                d.children = d._children;
                d._children = null;
                d.data._collapsed = false;
            }
            this.update(d);
        }
    }

    update(source) {
        // Recompute the tree layout
        const hierarchy = d3.hierarchy(this.root);
        const treeData = this.treeLayout(hierarchy);

        const svg = d3.select(this.container).select('svg g');

        // Update links
        const links = svg.select('.links')
            .selectAll('path')
            .data(treeData.links(), d => d.target.data.id);

        const linkGenerator = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y);

        links.exit()
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();

        links.enter()
            .append('path')
            .attr('class', 'tree-link')
            .attr('fill', 'none')
            .attr('stroke', '#999')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0)
            .attr('d', linkGenerator)
            .transition()
            .duration(300)
            .attr('stroke-opacity', 0.6);

        links.transition()
            .duration(300)
            .attr('d', linkGenerator);

        // Update nodes
        const nodes = svg.select('.nodes')
            .selectAll('g')
            .data(treeData.descendants(), d => d.data.id);

        nodes.exit()
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();

        const nodesEnter = nodes.enter()
            .append('g')
            .attr('class', 'tree-node')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .attr('opacity', 0);

        // Rebuild node structure (simplified for update)
        this.drawNodes(svg.select('.nodes'), treeData.descendants());

        nodes.transition()
            .duration(300)
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .attr('opacity', 1);
    }

    showEntityDetails(entity) {
        const modal = document.createElement('div');
        modal.className = 'entity-modal';
        modal.innerHTML = `
            <div class="entity-modal-content">
                <span class="entity-modal-close">&times;</span>
                <h2>${entity.name}</h2>
                <p><strong>Type:</strong> ${entity.type}</p>
                <p><strong>Mythology:</strong> ${entity.mythology}</p>
                ${entity.domain ? `<p><strong>Domain:</strong> ${entity.domain.join(', ')}</p>` : ''}
                ${entity.description ? `<p>${entity.description}</p>` : ''}
                <a href="/mythos/${entity.mythology}/deities/${entity.id}.html" class="view-full-link">
                    View Full Entry →
                </a>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.entity-modal-close').onclick = () => {
            document.body.removeChild(modal);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
    }

    addControls() {
        const controls = d3.select(this.container)
            .insert('div', ':first-child')
            .attr('class', 'tree-controls');

        // Expand all button
        controls.append('button')
            .text('Expand All')
            .on('click', () => this.expandAll());

        // Collapse all button
        controls.append('button')
            .text('Collapse All')
            .on('click', () => this.collapseAll());

        // Export button
        controls.append('button')
            .text('Export as Image')
            .on('click', () => this.export());

        // Reset zoom button
        controls.append('button')
            .text('Reset View')
            .on('click', () => this.render());
    }

    expandAll() {
        this.toggleAllNodes(this.root, false);
        this.render();
    }

    collapseAll() {
        this.toggleAllNodes(this.root, true);
        this.render();
    }

    toggleAllNodes(node, collapse) {
        if (node.children || node._children) {
            node._collapsed = collapse;
            if (collapse) {
                node._children = node.children;
                node.children = null;
            } else {
                node.children = node._children || node.children;
                node._children = null;
            }
        }

        const children = node.children || node._children || [];
        children.forEach(child => this.toggleAllNodes(child, collapse));
    }

    async export() {
        const svg = d3.select(this.container).select('svg').node();
        await VisualizationUtils.exportAsImage(svg, 'family-tree.png');
    }

    showError(message) {
        d3.select(this.container)
            .html(`<div class="error-message">Error: ${message}</div>`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FamilyTreeGenerator;
}
