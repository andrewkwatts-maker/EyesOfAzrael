/**
 * Shared utilities for mythology visualizations
 * Provides common functions for data loading, rendering, and interactions
 */

class VisualizationUtils {
    static async loadMythologyData() {
        try {
            // Load from Firebase if available
            if (window.db) {
                return await this.loadFromFirebase();
            }
            // Fallback to static data
            return await this.loadStaticData();
        } catch (error) {
            console.error('Error loading mythology data:', error);
            return this.getFallbackData();
        }
    }

    static async loadFromFirebase() {
        const collections = ['deities', 'places', 'creatures', 'items', 'texts'];
        const data = {};

        for (const collection of collections) {
            const snapshot = await window.db.collection(collection).get();
            data[collection] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }

        return this.processData(data);
    }

    static async loadStaticData() {
        // Load from data directory
        const response = await fetch('/data/mythology-graph-data.json');
        return await response.json();
    }

    static processData(rawData) {
        // Build relationship graph
        const entities = {};
        const relationships = [];

        // Process each collection
        Object.entries(rawData).forEach(([type, items]) => {
            items.forEach(item => {
                entities[item.id] = {
                    ...item,
                    type,
                    connections: []
                };

                // Extract relationships
                if (item.relationships) {
                    item.relationships.forEach(rel => {
                        relationships.push({
                            source: item.id,
                            target: rel.targetId,
                            type: rel.type,
                            description: rel.description
                        });
                    });
                }
            });
        });

        return { entities, relationships };
    }

    static getFallbackData() {
        // Minimal fallback data for demonstration
        return {
            entities: {
                'zeus': { id: 'zeus', name: 'Zeus', type: 'deity', mythology: 'greek', domain: ['Sky', 'Thunder'] },
                'hera': { id: 'hera', name: 'Hera', type: 'deity', mythology: 'greek', domain: ['Marriage', 'Family'] },
                'odin': { id: 'odin', name: 'Odin', type: 'deity', mythology: 'norse', domain: ['Wisdom', 'War'] },
                'thor': { id: 'thor', name: 'Thor', type: 'deity', mythology: 'norse', domain: ['Thunder', 'Strength'] }
            },
            relationships: [
                { source: 'zeus', target: 'hera', type: 'spouse', description: 'Married' },
                { source: 'odin', target: 'thor', type: 'parent', description: 'Father' }
            ]
        };
    }

    // Color schemes for different entity types
    static getEntityColor(type, mythology) {
        const typeColors = {
            deity: '#FFD700',
            hero: '#FF6B6B',
            creature: '#4ECDC4',
            place: '#95E1D3',
            item: '#F38181',
            text: '#AA96DA'
        };

        const mythologyColors = {
            greek: '#3498db',
            norse: '#e74c3c',
            egyptian: '#f39c12',
            hindu: '#e67e22',
            chinese: '#2ecc71',
            japanese: '#9b59b6',
            celtic: '#16a085',
            mayan: '#d35400',
            aztec: '#c0392b'
        };

        return typeColors[type] || mythologyColors[mythology] || '#95a5a6';
    }

    // Get entity size based on importance
    static getEntitySize(entity) {
        const baseSize = 10;
        const connectionMultiplier = 2;

        const connections = entity.connections ? entity.connections.length : 0;
        return baseSize + (connections * connectionMultiplier);
    }

    // Format entity for display
    static formatEntityLabel(entity) {
        const name = entity.name || entity.id;
        const mythology = entity.mythology ? `(${entity.mythology})` : '';
        return `${name} ${mythology}`.trim();
    }

    // Create tooltip content
    static createTooltip(entity) {
        const parts = [
            `<strong>${entity.name || entity.id}</strong>`,
            entity.mythology ? `<em>${entity.mythology} mythology</em>` : '',
            entity.type ? `Type: ${entity.type}` : '',
            entity.domain ? `Domain: ${entity.domain.join(', ')}` : '',
            entity.description ? entity.description.substring(0, 150) + '...' : ''
        ];

        return parts.filter(p => p).join('<br>');
    }

    // Pan and zoom controls
    static addZoomControls(svg, initialScale = 1) {
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {
                svg.attr('transform', event.transform);
            });

        svg.call(zoom);
        svg.call(zoom.transform, d3.zoomIdentity.scale(initialScale));

        return zoom;
    }

    // Filter entities by criteria
    static filterEntities(entities, filters) {
        return Object.values(entities).filter(entity => {
            if (filters.mythology && entity.mythology !== filters.mythology) return false;
            if (filters.type && entity.type !== filters.type) return false;
            if (filters.search && !this.matchesSearch(entity, filters.search)) return false;
            return true;
        });
    }

    static matchesSearch(entity, search) {
        const searchLower = search.toLowerCase();
        const name = (entity.name || '').toLowerCase();
        const description = (entity.description || '').toLowerCase();
        const domains = (entity.domain || []).join(' ').toLowerCase();

        return name.includes(searchLower) ||
               description.includes(searchLower) ||
               domains.includes(searchLower);
    }

    // Export visualization as image
    static async exportAsImage(svgElement, filename) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
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

    // Create legend
    static createLegend(container, items) {
        const legend = d3.select(container)
            .append('div')
            .attr('class', 'visualization-legend');

        items.forEach(item => {
            const entry = legend.append('div')
                .attr('class', 'legend-entry');

            entry.append('span')
                .attr('class', 'legend-color')
                .style('background-color', item.color);

            entry.append('span')
                .attr('class', 'legend-label')
                .text(item.label);
        });

        return legend;
    }

    // Debounce function for search/filter
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Calculate hierarchy depth
    static calculateDepth(entity, entities, visited = new Set()) {
        if (visited.has(entity.id)) return 0;
        visited.add(entity.id);

        const parents = entity.relationships?.filter(r => r.type === 'parent') || [];
        if (parents.length === 0) return 0;

        const parentDepths = parents.map(p => {
            const parent = entities[p.targetId];
            return parent ? this.calculateDepth(parent, entities, visited) : 0;
        });

        return Math.max(...parentDepths, 0) + 1;
    }

    // Format date for timeline
    static formatTimelineDate(date) {
        if (!date) return 'Unknown';
        if (typeof date === 'string') return date;
        if (date.year) {
            const suffix = date.year < 0 ? ' BCE' : ' CE';
            return `${Math.abs(date.year)}${suffix}`;
        }
        return 'Unknown';
    }

    // Create responsive SVG
    static createResponsiveSVG(container, aspectRatio = 1.5) {
        const containerNode = d3.select(container).node();
        const width = containerNode.clientWidth;
        const height = width / aspectRatio;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Handle resize
        window.addEventListener('resize', () => {
            const newWidth = containerNode.clientWidth;
            const newHeight = newWidth / aspectRatio;
            svg.attr('width', newWidth).attr('height', newHeight);
        });

        return { svg, width, height };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualizationUtils;
}
