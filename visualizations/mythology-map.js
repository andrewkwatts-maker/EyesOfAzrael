/**
 * Geographic Mythology Map
 * Interactive world map showing mythology origins and cultural exchanges
 * Uses Leaflet.js for mapping functionality
 */

class MythologyMap {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            center: options.center || [30, 0],
            zoom: options.zoom || 2,
            minZoom: 2,
            maxZoom: 10,
            showTimeline: options.showTimeline !== false,
            showMigrations: options.showMigrations !== false,
            timeRange: options.timeRange || { start: -3000, end: 2000 },
            ...options
        };

        this.map = null;
        this.markers = [];
        this.currentYear = options.timeRange.start;
        this.mythologyData = this.getMythologyLocations();
        this.migrationRoutes = this.getMigrationRoutes();
    }

    async init() {
        try {
            this.createMap();
            this.addControls();
            if (this.options.showTimeline) {
                this.addTimeline();
            }
            this.renderMythologies();
            if (this.options.showMigrations) {
                this.renderMigrations();
            }
        } catch (error) {
            console.error('Error initializing mythology map:', error);
            this.showError(error.message);
        }
    }

    createMap() {
        // Create map container
        const mapDiv = document.createElement('div');
        mapDiv.id = 'mythology-map';
        mapDiv.style.width = '100%';
        mapDiv.style.height = '600px';
        this.container.appendChild(mapDiv);

        // Initialize Leaflet map
        this.map = L.map('mythology-map', {
            center: this.options.center,
            zoom: this.options.zoom,
            minZoom: this.options.minZoom,
            maxZoom: this.options.maxZoom,
            worldCopyJump: true
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add custom styling for ancient feel
        const style = document.createElement('style');
        style.textContent = `
            #mythology-map {
                filter: sepia(0.2) contrast(1.1);
            }
            .mythology-marker {
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                cursor: pointer;
                transition: transform 0.2s;
            }
            .mythology-marker:hover {
                transform: scale(1.2);
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);
    }

    getMythologyLocations() {
        return {
            greek: {
                name: 'Greek Mythology',
                locations: [
                    { coords: [37.9838, 23.7275], name: 'Athens', period: { start: -800, end: 400 } },
                    { coords: [37.6381, 21.6298], name: 'Olympia', period: { start: -1000, end: 400 } },
                    { coords: [38.0824, 22.4218], name: 'Delphi', period: { start: -800, end: 400 } },
                    { coords: [37.0294, 25.3664], name: 'Delos', period: { start: -1000, end: 400 } }
                ],
                color: '#3498db',
                description: 'Ancient Greek mythology centered in the Aegean region'
            },
            norse: {
                name: 'Norse Mythology',
                locations: [
                    { coords: [59.9139, 10.7522], name: 'Norway', period: { start: -200, end: 1100 } },
                    { coords: [62.0, 15.0], name: 'Sweden', period: { start: -200, end: 1100 } },
                    { coords: [64.9631, -19.0208], name: 'Iceland', period: { start: 800, end: 1400 } },
                    { coords: [55.6761, 12.5683], name: 'Denmark', period: { start: -200, end: 1100 } }
                ],
                color: '#e74c3c',
                description: 'Norse mythology of Scandinavia and Iceland'
            },
            egyptian: {
                name: 'Egyptian Mythology',
                locations: [
                    { coords: [29.9792, 31.1342], name: 'Cairo/Memphis', period: { start: -3000, end: 400 } },
                    { coords: [25.7188, 32.6396], name: 'Luxor/Thebes', period: { start: -2000, end: 400 } },
                    { coords: [27.1809, 31.1859], name: 'Alexandria', period: { start: -332, end: 400 } },
                    { coords: [24.0889, 32.8998], name: 'Aswan', period: { start: -3000, end: 400 } }
                ],
                color: '#f39c12',
                description: 'Ancient Egyptian mythology along the Nile'
            },
            hindu: {
                name: 'Hindu Mythology',
                locations: [
                    { coords: [25.3176, 82.9739], name: 'Varanasi', period: { start: -1500, end: 2000 } },
                    { coords: [19.0760, 72.8777], name: 'Mumbai', period: { start: -1500, end: 2000 } },
                    { coords: [13.0827, 80.2707], name: 'Chennai', period: { start: -1000, end: 2000 } },
                    { coords: [27.1751, 78.0421], name: 'Agra', period: { start: -1500, end: 2000 } }
                ],
                color: '#e67e22',
                description: 'Hindu mythology across the Indian subcontinent'
            },
            chinese: {
                name: 'Chinese Mythology',
                locations: [
                    { coords: [39.9042, 116.4074], name: 'Beijing', period: { start: -2000, end: 2000 } },
                    { coords: [34.3416, 108.9398], name: "Xi'an", period: { start: -2000, end: 2000 } },
                    { coords: [31.2304, 121.4737], name: 'Shanghai', period: { start: -1500, end: 2000 } },
                    { coords: [30.5728, 104.0668], name: 'Chengdu', period: { start: -2000, end: 2000 } }
                ],
                color: '#2ecc71',
                description: 'Chinese mythology throughout East Asia'
            },
            japanese: {
                name: 'Japanese Mythology',
                locations: [
                    { coords: [35.6762, 139.6503], name: 'Tokyo', period: { start: -500, end: 2000 } },
                    { coords: [34.6937, 135.5023], name: 'Kyoto', period: { start: -500, end: 2000 } },
                    { coords: [33.6064, 130.4183], name: 'Izumo', period: { start: -500, end: 2000 } },
                    { coords: [34.3853, 132.4553], name: 'Ise', period: { start: -500, end: 2000 } }
                ],
                color: '#9b59b6',
                description: 'Japanese Shinto and Buddhist mythology'
            },
            celtic: {
                name: 'Celtic Mythology',
                locations: [
                    { coords: [53.3498, -6.2603], name: 'Ireland', period: { start: -500, end: 500 } },
                    { coords: [55.9533, -3.1883], name: 'Scotland', period: { start: -500, end: 500 } },
                    { coords: [52.4862, -1.8904], name: 'Wales', period: { start: -500, end: 500 } },
                    { coords: [47.2184, -1.5536], name: 'Brittany', period: { start: -500, end: 500 } }
                ],
                color: '#16a085',
                description: 'Celtic mythology across the British Isles and France'
            },
            mayan: {
                name: 'Mayan Mythology',
                locations: [
                    { coords: [17.5450, -88.0681], name: 'Tikal', period: { start: -2000, end: 900 } },
                    { coords: [20.6843, -88.5678], name: 'Chichen Itza', period: { start: -600, end: 1200 } },
                    { coords: [20.3598, -89.9498], name: 'Uxmal', period: { start: -500, end: 1000 } },
                    { coords: [16.9007, -92.0442], name: 'Palenque', period: { start: -100, end: 800 } }
                ],
                color: '#d35400',
                description: 'Mayan mythology in Mesoamerica'
            },
            aztec: {
                name: 'Aztec Mythology',
                locations: [
                    { coords: [19.4326, -99.1332], name: 'Tenochtitlan', period: { start: 1200, end: 1521 } },
                    { coords: [19.6926, -98.8439], name: 'Teotihuacan', period: { start: -200, end: 750 } },
                    { coords: [19.0514, -98.3081], name: 'Cholula', period: { start: -200, end: 1521 } },
                    { coords: [20.5888, -100.3899], name: 'Tula', period: { start: 800, end: 1200 } }
                ],
                color: '#c0392b',
                description: 'Aztec mythology in central Mexico'
            }
        };
    }

    getMigrationRoutes() {
        return [
            {
                name: 'Indo-European Migration',
                path: [[50, 50], [45, 35], [40, 20], [35, 15]],
                period: { start: -4000, end: -2000 },
                color: '#3498db',
                description: 'Spread of Indo-European peoples and myths'
            },
            {
                name: 'Greek to Roman',
                path: [[37.98, 23.73], [40.85, 14.27], [41.90, 12.50]],
                period: { start: -500, end: 100 },
                color: '#9b59b6',
                description: 'Greek mythology influencing Roman culture'
            },
            {
                name: 'Buddhist Spread',
                path: [[27.70, 85.30], [29.65, 91.10], [30.04, 102.71], [35.68, 139.65]],
                period: { start: -500, end: 700 },
                color: '#f39c12',
                description: 'Spread of Buddhism and its myths across Asia'
            },
            {
                name: 'Viking Expansion',
                path: [[59.91, 10.75], [64.96, -19.02], [61.22, -149.90]],
                period: { start: 700, end: 1100 },
                color: '#e74c3c',
                description: 'Norse expansion and cultural exchange'
            }
        ];
    }

    renderMythologies() {
        Object.entries(this.mythologyData).forEach(([key, mythology]) => {
            mythology.locations.forEach(location => {
                if (this.isInTimePeriod(location.period)) {
                    this.addMythologyMarker(location, mythology);
                }
            });
        });
    }

    isInTimePeriod(period) {
        return this.currentYear >= period.start && this.currentYear <= period.end;
    }

    addMythologyMarker(location, mythology) {
        const icon = L.divIcon({
            className: 'mythology-marker',
            html: `<div style="background-color: ${mythology.color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker(location.coords, { icon })
            .addTo(this.map)
            .bindPopup(this.createPopupContent(location, mythology));

        marker.on('click', () => {
            this.showMythologyInfo(mythology);
        });

        this.markers.push(marker);
    }

    createPopupContent(location, mythology) {
        return `
            <div class="mythology-popup">
                <h3>${location.name}</h3>
                <p><strong>${mythology.name}</strong></p>
                <p>${mythology.description}</p>
                <p><em>Period: ${this.formatYear(location.period.start)} - ${this.formatYear(location.period.end)}</em></p>
                <button onclick="window.mythologyMap.exploreMythology('${mythology.name.toLowerCase().split(' ')[0]}')">
                    Explore Mythology →
                </button>
            </div>
        `;
    }

    renderMigrations() {
        this.migrationRoutes.forEach(route => {
            if (this.isInTimePeriod(route.period)) {
                const polyline = L.polyline(route.path, {
                    color: route.color,
                    weight: 3,
                    opacity: 0.6,
                    dashArray: '10, 10'
                }).addTo(this.map);

                polyline.bindPopup(`
                    <div class="migration-popup">
                        <h4>${route.name}</h4>
                        <p>${route.description}</p>
                        <p><em>${this.formatYear(route.period.start)} - ${this.formatYear(route.period.end)}</em></p>
                    </div>
                `);

                this.markers.push(polyline);
            }
        });
    }

    addTimeline() {
        const timelineDiv = document.createElement('div');
        timelineDiv.className = 'timeline-control';
        timelineDiv.innerHTML = `
            <div class="timeline-container">
                <label>Time Period: <span id="current-year">${this.formatYear(this.currentYear)}</span></label>
                <input type="range"
                    id="timeline-slider"
                    min="${this.options.timeRange.start}"
                    max="${this.options.timeRange.end}"
                    value="${this.currentYear}"
                    step="50">
                <div class="timeline-labels">
                    <span>${this.formatYear(this.options.timeRange.start)}</span>
                    <span>${this.formatYear(this.options.timeRange.end)}</span>
                </div>
                <button id="play-timeline">▶ Play</button>
            </div>
        `;

        this.container.insertBefore(timelineDiv, this.container.firstChild);

        // Add event listeners
        const slider = document.getElementById('timeline-slider');
        const yearDisplay = document.getElementById('current-year');
        const playButton = document.getElementById('play-timeline');

        slider.addEventListener('input', (e) => {
            this.currentYear = parseInt(e.target.value);
            yearDisplay.textContent = this.formatYear(this.currentYear);
            this.updateMap();
        });

        let isPlaying = false;
        let playInterval;

        playButton.addEventListener('click', () => {
            if (!isPlaying) {
                isPlaying = true;
                playButton.textContent = '⏸ Pause';
                playInterval = setInterval(() => {
                    this.currentYear += 50;
                    if (this.currentYear > this.options.timeRange.end) {
                        this.currentYear = this.options.timeRange.start;
                    }
                    slider.value = this.currentYear;
                    yearDisplay.textContent = this.formatYear(this.currentYear);
                    this.updateMap();
                }, 500);
            } else {
                isPlaying = false;
                playButton.textContent = '▶ Play';
                clearInterval(playInterval);
            }
        });
    }

    updateMap() {
        // Clear existing markers
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];

        // Re-render
        this.renderMythologies();
        if (this.options.showMigrations) {
            this.renderMigrations();
        }
    }

    addControls() {
        const controls = document.createElement('div');
        controls.className = 'map-controls';
        controls.innerHTML = `
            <div class="control-group">
                <label>Filter Mythologies:</label>
                <div id="mythology-filters"></div>
            </div>
        `;

        this.container.insertBefore(controls, this.container.firstChild);

        const filtersContainer = document.getElementById('mythology-filters');

        Object.entries(this.mythologyData).forEach(([key, mythology]) => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `filter-${key}`;
            checkbox.checked = true;
            checkbox.addEventListener('change', () => this.updateMap());

            const label = document.createElement('label');
            label.htmlFor = `filter-${key}`;
            label.textContent = mythology.name;
            label.style.color = mythology.color;

            const wrapper = document.createElement('div');
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            filtersContainer.appendChild(wrapper);
        });
    }

    showMythologyInfo(mythology) {
        const infoPanel = document.createElement('div');
        infoPanel.className = 'mythology-info-panel';
        infoPanel.innerHTML = `
            <div class="info-panel-content">
                <button class="close-btn">&times;</button>
                <h2>${mythology.name}</h2>
                <p>${mythology.description}</p>
                <h3>Key Locations:</h3>
                <ul>
                    ${mythology.locations.map(loc => `
                        <li>${loc.name} (${this.formatYear(loc.period.start)} - ${this.formatYear(loc.period.end)})</li>
                    `).join('')}
                </ul>
            </div>
        `;

        document.body.appendChild(infoPanel);

        infoPanel.querySelector('.close-btn').onclick = () => {
            document.body.removeChild(infoPanel);
        };
    }

    exploreMythology(mythology) {
        window.location.href = `/mythos/${mythology}/`;
    }

    formatYear(year) {
        if (year < 0) {
            return `${Math.abs(year)} BCE`;
        } else {
            return `${year} CE`;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `Error: ${message}`;
        this.container.appendChild(errorDiv);
    }
}

// Export and make globally accessible
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MythologyMap;
}

// Make available globally for popup callbacks
if (typeof window !== 'undefined') {
    window.MythologyMap = MythologyMap;
}
