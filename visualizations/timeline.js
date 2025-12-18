/**
 * Historical Timeline Visualization
 * Interactive timeline showing mythology periods, events, and cultural influences
 * Uses D3.js for rendering
 */

class HistoricalTimeline {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            width: options.width || 1400,
            height: options.height || 600,
            margin: { top: 40, right: 40, bottom: 60, left: 60 },
            timeRange: options.timeRange || { start: -3000, end: 2000 },
            mythology: options.mythology || 'all',
            ...options
        };

        this.data = null;
        this.svg = null;
        this.xScale = null;
        this.yScale = null;
    }

    async init() {
        try {
            this.data = this.getTimelineData();
            this.render();
        } catch (error) {
            console.error('Error initializing timeline:', error);
            this.showError(error.message);
        }
    }

    getTimelineData() {
        return {
            periods: [
                {
                    id: 'sumerian',
                    name: 'Sumerian Mythology',
                    start: -3500,
                    end: -2000,
                    mythology: 'mesopotamian',
                    color: '#8e44ad',
                    description: 'Earliest written mythology, creation myths, Gilgamesh'
                },
                {
                    id: 'egyptian-old',
                    name: 'Egyptian Old Kingdom',
                    start: -2686,
                    end: -2181,
                    mythology: 'egyptian',
                    color: '#f39c12',
                    description: 'Pyramid texts, Ra worship, Osiris myths'
                },
                {
                    id: 'vedic',
                    name: 'Vedic Period',
                    start: -1500,
                    end: -500,
                    mythology: 'hindu',
                    color: '#e67e22',
                    description: 'Composition of the Vedas, Indra and early deities'
                },
                {
                    id: 'greek-archaic',
                    name: 'Greek Archaic Period',
                    start: -800,
                    end: -480,
                    mythology: 'greek',
                    color: '#3498db',
                    description: 'Homer, Hesiod, establishment of Olympic pantheon'
                },
                {
                    id: 'greek-classical',
                    name: 'Greek Classical Period',
                    start: -480,
                    end: -323,
                    mythology: 'greek',
                    color: '#2980b9',
                    description: 'Golden age of Greek tragedy, philosophy'
                },
                {
                    id: 'roman-republic',
                    name: 'Roman Republic',
                    start: -509,
                    end: -27,
                    mythology: 'roman',
                    color: '#c0392b',
                    description: 'Adoption of Greek myths, Roman interpretations'
                },
                {
                    id: 'roman-empire',
                    name: 'Roman Empire',
                    start: -27,
                    end: 476,
                    mythology: 'roman',
                    color: '#e74c3c',
                    description: 'Imperial cult, spread across Europe'
                },
                {
                    id: 'norse-viking',
                    name: 'Viking Age',
                    start: 793,
                    end: 1066,
                    mythology: 'norse',
                    color: '#e74c3c',
                    description: 'Norse expansion, Eddas composed'
                },
                {
                    id: 'mayan-classic',
                    name: 'Mayan Classic Period',
                    start: 250,
                    end: 900,
                    mythology: 'mayan',
                    color: '#d35400',
                    description: 'Peak of Mayan civilization, Popol Vuh traditions'
                },
                {
                    id: 'aztec-empire',
                    name: 'Aztec Empire',
                    start: 1428,
                    end: 1521,
                    mythology: 'aztec',
                    color: '#c0392b',
                    description: 'Human sacrifice, Quetzalcoatl worship'
                }
            ],
            events: [
                {
                    year: -1200,
                    name: 'Trojan War',
                    mythology: 'greek',
                    description: 'Legendary war between Greeks and Trojans',
                    type: 'legendary'
                },
                {
                    year: -776,
                    name: 'First Olympic Games',
                    mythology: 'greek',
                    description: 'Games dedicated to Zeus at Olympia',
                    type: 'historical'
                },
                {
                    year: -700,
                    name: "Hesiod's Theogony",
                    mythology: 'greek',
                    description: 'Systematic account of Greek creation myths',
                    type: 'literary'
                },
                {
                    year: -500,
                    name: 'Mahabharat composed',
                    mythology: 'hindu',
                    description: 'Great Indian epic finalized',
                    type: 'literary'
                },
                {
                    year: -27,
                    name: 'Augustus becomes Emperor',
                    mythology: 'roman',
                    description: 'Beginning of imperial cult',
                    type: 'historical'
                },
                {
                    year: 30,
                    name: 'Christianity emerges',
                    mythology: 'christian',
                    description: 'New religious movement begins',
                    type: 'religious'
                },
                {
                    year: 622,
                    name: 'Islamic Hijra',
                    mythology: 'islamic',
                    description: 'Migration of Muhammad to Medina',
                    type: 'religious'
                },
                {
                    year: 1220,
                    name: 'Snorri Sturluson writes Prose Edda',
                    mythology: 'norse',
                    description: 'Preservation of Norse mythology',
                    type: 'literary'
                }
            ],
            influences: [
                {
                    from: 'greek',
                    to: 'roman',
                    period: { start: -300, end: 100 },
                    description: 'Roman adoption of Greek pantheon'
                },
                {
                    from: 'hindu',
                    to: 'buddhist',
                    period: { start: -500, end: 500 },
                    description: 'Buddhist mythology emerges from Hinduism'
                },
                {
                    from: 'mesopotamian',
                    to: 'hebrew',
                    period: { start: -1500, end: -500 },
                    description: 'Flood myths and creation stories'
                }
            ]
        };
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

        const innerWidth = width - this.options.margin.left - this.options.margin.right;
        const innerHeight = height - this.options.margin.top - this.options.margin.bottom;

        // Create scales
        this.xScale = d3.scaleLinear()
            .domain([this.options.timeRange.start, this.options.timeRange.end])
            .range([0, innerWidth]);

        // Assign vertical positions to periods
        const mythologyTracks = {};
        let trackCount = 0;

        this.data.periods.forEach(period => {
            if (!mythologyTracks[period.mythology]) {
                mythologyTracks[period.mythology] = trackCount++;
            }
        });

        this.yScale = d3.scaleLinear()
            .domain([0, trackCount])
            .range([50, innerHeight - 100]);

        // Create main group
        const g = svg.append('g')
            .attr('transform', `translate(${this.options.margin.left},${this.options.margin.top})`);

        // Add zoom
        VisualizationUtils.addZoomControls(g);

        // Draw time axis
        this.drawAxis(g, innerWidth, innerHeight);

        // Draw periods
        this.drawPeriods(g, mythologyTracks);

        // Draw events
        this.drawEvents(g, innerHeight);

        // Draw influences
        this.drawInfluences(g, mythologyTracks);

        // Add legend
        this.addLegend();

        // Add controls
        this.addControls();
    }

    drawAxis(g, width, height) {
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d => this.formatYear(d))
            .ticks(10);

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height - 80})`)
            .call(xAxis)
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        // Add gridlines
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${height - 80})`)
            .call(d3.axisBottom(this.xScale)
                .tickSize(-height + 80)
                .tickFormat('')
            )
            .style('stroke-opacity', 0.1);
    }

    drawPeriods(g, mythologyTracks) {
        const periodHeight = 40;

        const periods = g.append('g')
            .attr('class', 'periods')
            .selectAll('g')
            .data(this.data.periods)
            .join('g')
            .attr('class', 'period');

        // Draw period rectangles
        periods.append('rect')
            .attr('x', d => this.xScale(d.start))
            .attr('y', d => this.yScale(mythologyTracks[d.mythology]) - periodHeight / 2)
            .attr('width', d => this.xScale(d.end) - this.xScale(d.start))
            .attr('height', periodHeight)
            .attr('fill', d => d.color)
            .attr('opacity', 0.7)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('rx', 5)
            .on('mouseover', (event, d) => this.showPeriodTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());

        // Add period labels
        periods.append('text')
            .attr('x', d => this.xScale(d.start) + (this.xScale(d.end) - this.xScale(d.start)) / 2)
            .attr('y', d => this.yScale(mythologyTracks[d.mythology]))
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', 11)
            .attr('font-weight', 'bold')
            .attr('fill', '#fff')
            .text(d => d.name)
            .style('pointer-events', 'none');
    }

    drawEvents(g, height) {
        const events = g.append('g')
            .attr('class', 'events')
            .selectAll('g')
            .data(this.data.events)
            .join('g')
            .attr('class', 'event')
            .attr('transform', d => `translate(${this.xScale(d.year)},${height - 80})`);

        // Draw event markers
        events.append('circle')
            .attr('r', 6)
            .attr('fill', d => {
                const colors = {
                    legendary: '#e74c3c',
                    historical: '#3498db',
                    literary: '#9b59b6',
                    religious: '#f39c12'
                };
                return colors[d.type] || '#95a5a6';
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // Draw event lines
        events.append('line')
            .attr('y1', 0)
            .attr('y2', -height + 160)
            .attr('stroke', '#999')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,2')
            .attr('opacity', 0.3);

        // Add event labels
        events.append('text')
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', 9)
            .attr('transform', 'rotate(-45)')
            .text(d => d.name)
            .on('mouseover', (event, d) => this.showEventTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());
    }

    drawInfluences(g, mythologyTracks) {
        const influences = g.append('g')
            .attr('class', 'influences')
            .selectAll('path')
            .data(this.data.influences)
            .join('path')
            .attr('d', d => {
                const x1 = this.xScale(d.period.start);
                const x2 = this.xScale(d.period.end);
                const y1 = this.yScale(mythologyTracks[d.from]);
                const y2 = this.yScale(mythologyTracks[d.to]);

                return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - 50} ${x2} ${y2}`;
            })
            .attr('fill', 'none')
            .attr('stroke', '#9b59b6')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('opacity', 0.4)
            .on('mouseover', (event, d) => this.showInfluenceTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());
    }

    showPeriodTooltip(event, period) {
        const tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'timeline-tooltip')
            .style('position', 'absolute')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);

        tooltip.html(`
            <strong>${period.name}</strong><br>
            ${this.formatYear(period.start)} - ${this.formatYear(period.end)}<br>
            ${period.description}
        `);
    }

    showEventTooltip(event, eventData) {
        const tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'timeline-tooltip')
            .style('position', 'absolute')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);

        tooltip.html(`
            <strong>${eventData.name}</strong><br>
            ${this.formatYear(eventData.year)}<br>
            Type: ${eventData.type}<br>
            ${eventData.description}
        `);
    }

    showInfluenceTooltip(event, influence) {
        const tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'timeline-tooltip')
            .style('position', 'absolute')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);

        tooltip.html(`
            <strong>Cultural Influence</strong><br>
            ${influence.from} → ${influence.to}<br>
            ${this.formatYear(influence.period.start)} - ${this.formatYear(influence.period.end)}<br>
            ${influence.description}
        `);
    }

    hideTooltip() {
        d3.selectAll('.timeline-tooltip').remove();
    }

    addLegend() {
        const legendItems = [
            { color: '#e74c3c', label: 'Legendary Events' },
            { color: '#3498db', label: 'Historical Events' },
            { color: '#9b59b6', label: 'Literary Works' },
            { color: '#f39c12', label: 'Religious Events' }
        ];

        VisualizationUtils.createLegend(this.container, legendItems);
    }

    addControls() {
        const controls = d3.select(this.container)
            .insert('div', ':first-child')
            .attr('class', 'timeline-controls');

        // Filter by mythology
        controls.append('label').text('Filter Mythology:');

        const select = controls.append('select')
            .on('change', (event) => {
                this.options.mythology = event.target.value;
                this.filterData();
            });

        select.append('option').attr('value', 'all').text('All');
        ['greek', 'roman', 'norse', 'egyptian', 'hindu', 'mayan', 'aztec'].forEach(myth => {
            select.append('option').attr('value', myth).text(
                myth.charAt(0).toUpperCase() + myth.slice(1)
            );
        });

        // Zoom controls
        controls.append('button')
            .text('Reset View')
            .on('click', () => this.render());

        // Export button
        controls.append('button')
            .text('Export')
            .on('click', () => this.export());
    }

    filterData() {
        // Re-render with filtered data
        this.render();
    }

    formatYear(year) {
        if (year < 0) {
            return `${Math.abs(year)} BCE`;
        } else {
            return `${year} CE`;
        }
    }

    async export() {
        const svg = d3.select(this.container).select('svg').node();
        await VisualizationUtils.exportAsImage(svg, 'mythology-timeline.png');
    }

    showError(message) {
        d3.select(this.container)
            .html(`<div class="error-message">Error: ${message}</div>`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoricalTimeline;
}
