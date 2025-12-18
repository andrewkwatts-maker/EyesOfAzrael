/**
 * Pantheon Hierarchy Visualization
 * Tree diagram showing divine hierarchies across mythologies
 * Greek: Chaos → Titans → Olympians
 * Norse: Ymir → Aesir/Vanir
 * Egyptian: Ennead structure
 * Hindu: Trimurti structure
 */

class PantheonHierarchy {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            width: options.width || 1200,
            height: options.height || 900,
            nodeSize: options.nodeSize || 60,
            levelHeight: options.levelHeight || 180,
            mythology: options.mythology || 'greek',
            layout: options.layout || 'tree', // 'tree', 'sunburst', 'radial'
            ...options
        };

        this.data = null;
        this.svg = null;
        this.root = null;
    }

    async init() {
        try {
            this.data = this.getPantheonData(this.options.mythology);
            this.render();
        } catch (error) {
            console.error('Error initializing pantheon hierarchy:', error);
            this.showError(error.message);
        }
    }

    getPantheonData(mythology) {
        const pantheons = {
            greek: {
                name: 'Greek Pantheon',
                description: 'From primordial chaos to the Olympian gods',
                hierarchy: {
                    name: 'Chaos',
                    tier: 'Primordial',
                    domain: ['Void', 'Beginning'],
                    children: [
                        {
                            name: 'Gaia',
                            tier: 'Primordial',
                            domain: ['Earth'],
                            children: [
                                {
                                    name: 'Uranus',
                                    tier: 'Primordial',
                                    domain: ['Sky'],
                                    children: [
                                        {
                                            name: 'Titans',
                                            tier: 'Titan',
                                            children: [
                                                {
                                                    name: 'Cronus',
                                                    tier: 'Titan',
                                                    domain: ['Time'],
                                                    children: [
                                                        {
                                                            name: 'Zeus',
                                                            tier: 'Olympian',
                                                            domain: ['Sky', 'Thunder', 'King of Gods']
                                                        },
                                                        {
                                                            name: 'Poseidon',
                                                            tier: 'Olympian',
                                                            domain: ['Sea', 'Earthquakes']
                                                        },
                                                        {
                                                            name: 'Hades',
                                                            tier: 'Olympian',
                                                            domain: ['Underworld', 'Dead']
                                                        },
                                                        {
                                                            name: 'Hera',
                                                            tier: 'Olympian',
                                                            domain: ['Marriage', 'Family']
                                                        },
                                                        {
                                                            name: 'Demeter',
                                                            tier: 'Olympian',
                                                            domain: ['Agriculture', 'Harvest']
                                                        },
                                                        {
                                                            name: 'Hestia',
                                                            tier: 'Olympian',
                                                            domain: ['Hearth', 'Home']
                                                        }
                                                    ]
                                                },
                                                {
                                                    name: 'Oceanus',
                                                    tier: 'Titan',
                                                    domain: ['Ocean']
                                                },
                                                {
                                                    name: 'Hyperion',
                                                    tier: 'Titan',
                                                    domain: ['Light']
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: 'Nyx',
                            tier: 'Primordial',
                            domain: ['Night']
                        },
                        {
                            name: 'Erebus',
                            tier: 'Primordial',
                            domain: ['Darkness']
                        }
                    ]
                }
            },
            norse: {
                name: 'Norse Pantheon',
                description: 'From Ymir to the Aesir and Vanir',
                hierarchy: {
                    name: 'Ymir',
                    tier: 'Primordial Giant',
                    domain: ['First Being'],
                    children: [
                        {
                            name: 'Búri',
                            tier: 'First God',
                            children: [
                                {
                                    name: 'Borr',
                                    tier: 'Second Generation',
                                    children: [
                                        {
                                            name: 'Odin',
                                            tier: 'Aesir',
                                            domain: ['Wisdom', 'War', 'Death', 'Poetry'],
                                            children: [
                                                {
                                                    name: 'Thor',
                                                    tier: 'Aesir',
                                                    domain: ['Thunder', 'Strength', 'Protection']
                                                },
                                                {
                                                    name: 'Baldr',
                                                    tier: 'Aesir',
                                                    domain: ['Light', 'Beauty', 'Love']
                                                }
                                            ]
                                        },
                                        {
                                            name: 'Vili',
                                            tier: 'Aesir',
                                            domain: ['Will']
                                        },
                                        {
                                            name: 'Vé',
                                            tier: 'Aesir',
                                            domain: ['Sanctity']
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: 'Vanir',
                            tier: 'Vanir Gods',
                            children: [
                                {
                                    name: 'Njörðr',
                                    tier: 'Vanir',
                                    domain: ['Sea', 'Wind', 'Wealth']
                                },
                                {
                                    name: 'Freyr',
                                    tier: 'Vanir',
                                    domain: ['Fertility', 'Prosperity']
                                },
                                {
                                    name: 'Freyja',
                                    tier: 'Vanir',
                                    domain: ['Love', 'Beauty', 'War']
                                }
                            ]
                        }
                    ]
                }
            },
            egyptian: {
                name: 'Egyptian Pantheon',
                description: 'The Ennead and divine hierarchy',
                hierarchy: {
                    name: 'Atum',
                    tier: 'Creator',
                    domain: ['Creation', 'Self-Created'],
                    children: [
                        {
                            name: 'Shu',
                            tier: 'First Generation',
                            domain: ['Air', 'Light'],
                            children: [
                                {
                                    name: 'Geb',
                                    tier: 'Second Generation',
                                    domain: ['Earth'],
                                    children: [
                                        {
                                            name: 'Osiris',
                                            tier: 'Third Generation',
                                            domain: ['Afterlife', 'Resurrection']
                                        },
                                        {
                                            name: 'Isis',
                                            tier: 'Third Generation',
                                            domain: ['Magic', 'Motherhood']
                                        },
                                        {
                                            name: 'Set',
                                            tier: 'Third Generation',
                                            domain: ['Chaos', 'Desert', 'Storms']
                                        },
                                        {
                                            name: 'Nephthys',
                                            tier: 'Third Generation',
                                            domain: ['Death', 'Service']
                                        }
                                    ]
                                },
                                {
                                    name: 'Nut',
                                    tier: 'Second Generation',
                                    domain: ['Sky', 'Stars']
                                }
                            ]
                        },
                        {
                            name: 'Tefnut',
                            tier: 'First Generation',
                            domain: ['Moisture', 'Rain']
                        }
                    ]
                }
            },
            hindu: {
                name: 'Hindu Pantheon',
                description: 'The Trimurti and divine manifestations',
                hierarchy: {
                    name: 'Brahman',
                    tier: 'Ultimate Reality',
                    domain: ['Absolute', 'Supreme Being'],
                    children: [
                        {
                            name: 'Brahma',
                            tier: 'Trimurti',
                            domain: ['Creation', 'Knowledge']
                        },
                        {
                            name: 'Vishnu',
                            tier: 'Trimurti',
                            domain: ['Preservation', 'Dharma'],
                            children: [
                                {
                                    name: 'Rama',
                                    tier: 'Avatar',
                                    domain: ['Righteousness', 'Virtue']
                                },
                                {
                                    name: 'Krishna',
                                    tier: 'Avatar',
                                    domain: ['Love', 'Compassion']
                                }
                            ]
                        },
                        {
                            name: 'Shiva',
                            tier: 'Trimurti',
                            domain: ['Destruction', 'Transformation'],
                            children: [
                                {
                                    name: 'Ganesha',
                                    tier: 'Deva',
                                    domain: ['Wisdom', 'Obstacles']
                                },
                                {
                                    name: 'Kartikeya',
                                    tier: 'Deva',
                                    domain: ['War', 'Victory']
                                }
                            ]
                        }
                    ]
                }
            }
        };

        return pantheons[mythology] || pantheons.greek;
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

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .attr('font-size', 24)
            .attr('font-weight', 'bold')
            .attr('fill', '#333')
            .text(this.data.name);

        // Create container group
        const g = svg.append('g')
            .attr('transform', 'translate(50, 60)');

        // Add zoom
        VisualizationUtils.addZoomControls(g, 0.9);

        // Render based on layout type
        switch (this.options.layout) {
            case 'sunburst':
                this.renderSunburst(g, width - 100, height - 120);
                break;
            case 'radial':
                this.renderRadial(g, width - 100, height - 120);
                break;
            case 'tree':
            default:
                this.renderTree(g, width - 100, height - 120);
                break;
        }

        // Add controls
        this.addControls();
    }

    renderTree(g, width, height) {
        // Create tree layout
        const treeLayout = d3.tree()
            .size([width, height])
            .separation((a, b) => a.parent === b.parent ? 1 : 1.5);

        // Create hierarchy
        const root = d3.hierarchy(this.data.hierarchy);
        const treeData = treeLayout(root);

        // Draw links
        const linkGenerator = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y);

        g.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(treeData.links())
            .join('path')
            .attr('d', linkGenerator)
            .attr('fill', 'none')
            .attr('stroke', d => this.getTierColor(d.target.data.tier))
            .attr('stroke-width', 3)
            .attr('stroke-opacity', 0.6);

        // Draw nodes
        const nodes = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(treeData.descendants())
            .join('g')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.showNodeInfo(event, d));

        // Add circles
        nodes.append('circle')
            .attr('r', d => this.getNodeSize(d.depth))
            .attr('fill', d => this.getTierColor(d.data.tier))
            .attr('stroke', '#fff')
            .attr('stroke-width', 3);

        // Add labels
        nodes.append('text')
            .attr('dy', d => this.getNodeSize(d.depth) + 18)
            .attr('text-anchor', 'middle')
            .attr('font-size', 12)
            .attr('font-weight', 'bold')
            .text(d => d.data.name);

        // Add tier labels
        nodes.append('text')
            .attr('dy', d => this.getNodeSize(d.depth) + 32)
            .attr('text-anchor', 'middle')
            .attr('font-size', 9)
            .attr('fill', '#666')
            .text(d => d.data.tier);

        // Add tooltips
        nodes.append('title')
            .text(d => {
                const parts = [d.data.name, d.data.tier];
                if (d.data.domain) {
                    parts.push(`Domain: ${d.data.domain.join(', ')}`);
                }
                return parts.join('\n');
            });
    }

    renderSunburst(g, width, height) {
        const radius = Math.min(width, height) / 2;

        // Create partition layout
        const partition = d3.partition()
            .size([2 * Math.PI, radius]);

        // Create hierarchy
        const root = d3.hierarchy(this.data.hierarchy)
            .sum(d => d.children ? 0 : 1)
            .sort((a, b) => b.value - a.value);

        partition(root);

        // Create arc generator
        const arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1);

        // Center the sunburst
        g.attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Draw arcs
        g.selectAll('path')
            .data(root.descendants())
            .join('path')
            .attr('d', arc)
            .attr('fill', d => this.getTierColor(d.data.tier))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.showNodeInfo(event, d))
            .append('title')
            .text(d => `${d.data.name}\n${d.data.tier}`);
    }

    renderRadial(g, width, height) {
        const radius = Math.min(width, height) / 2 - 100;

        // Create radial tree layout
        const tree = d3.tree()
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

        // Create hierarchy
        const root = d3.hierarchy(this.data.hierarchy);
        tree(root);

        // Center the radial tree
        g.attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Draw links
        g.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(root.links())
            .join('path')
            .attr('d', d3.linkRadial()
                .angle(d => d.x)
                .radius(d => d.y))
            .attr('fill', 'none')
            .attr('stroke', d => this.getTierColor(d.target.data.tier))
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6);

        // Draw nodes
        const nodes = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(root.descendants())
            .join('g')
            .attr('transform', d => `
                rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.y},0)
            `)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.showNodeInfo(event, d));

        nodes.append('circle')
            .attr('r', d => this.getNodeSize(d.depth))
            .attr('fill', d => this.getTierColor(d.data.tier))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        nodes.append('text')
            .attr('dy', '0.31em')
            .attr('x', d => d.x < Math.PI === !d.children ? 6 : -6)
            .attr('text-anchor', d => d.x < Math.PI === !d.children ? 'start' : 'end')
            .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
            .attr('font-size', 11)
            .text(d => d.data.name);
    }

    getTierColor(tier) {
        const colors = {
            'Primordial': '#9b59b6',
            'Primordial Giant': '#8e44ad',
            'Creator': '#f39c12',
            'Ultimate Reality': '#e74c3c',
            'First God': '#3498db',
            'First Generation': '#1abc9c',
            'Second Generation': '#16a085',
            'Titan': '#e67e22',
            'Olympian': '#3498db',
            'Aesir': '#e74c3c',
            'Vanir': '#2ecc71',
            'Vanir Gods': '#27ae60',
            'Third Generation': '#2980b9',
            'Trimurti': '#c0392b',
            'Avatar': '#9b59b6',
            'Deva': '#16a085'
        };

        return colors[tier] || '#95a5a6';
    }

    getNodeSize(depth) {
        return Math.max(15, this.options.nodeSize - (depth * 8));
    }

    showNodeInfo(event, node) {
        const panel = d3.select(this.container)
            .append('div')
            .attr('class', 'pantheon-info-panel')
            .style('position', 'absolute')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);

        panel.html(`
            <button class="close-btn">&times;</button>
            <h3>${node.data.name}</h3>
            <p><strong>Tier:</strong> ${node.data.tier}</p>
            ${node.data.domain ? `<p><strong>Domain:</strong> ${node.data.domain.join(', ')}</p>` : ''}
            <p><strong>Level:</strong> ${node.depth}</p>
            ${node.children ? `<p><strong>Children:</strong> ${node.children.length}</p>` : ''}
        `);

        panel.select('.close-btn').on('click', () => panel.remove());
    }

    addControls() {
        const controls = d3.select(this.container)
            .insert('div', ':first-child')
            .attr('class', 'pantheon-controls');

        // Mythology selector
        controls.append('label').text('Mythology:');

        const mythSelect = controls.append('select')
            .on('change', (event) => {
                this.options.mythology = event.target.value;
                this.data = this.getPantheonData(this.options.mythology);
                this.render();
            });

        ['greek', 'norse', 'egyptian', 'hindu'].forEach(myth => {
            mythSelect.append('option')
                .attr('value', myth)
                .property('selected', myth === this.options.mythology)
                .text(myth.charAt(0).toUpperCase() + myth.slice(1));
        });

        // Layout selector
        controls.append('label').text('Layout:');

        const layoutSelect = controls.append('select')
            .on('change', (event) => {
                this.options.layout = event.target.value;
                this.render();
            });

        ['tree', 'radial', 'sunburst'].forEach(layout => {
            layoutSelect.append('option')
                .attr('value', layout)
                .property('selected', layout === this.options.layout)
                .text(layout.charAt(0).toUpperCase() + layout.slice(1));
        });

        // Export button
        controls.append('button')
            .text('Export')
            .on('click', () => this.export());
    }

    async export() {
        const svg = d3.select(this.container).select('svg').node();
        await VisualizationUtils.exportAsImage(svg, `${this.options.mythology}-pantheon.png`);
    }

    showError(message) {
        d3.select(this.container)
            .html(`<div class="error-message">Error: ${message}</div>`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PantheonHierarchy;
}
