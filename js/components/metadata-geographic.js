/**
 * Metadata Geographic Component
 *
 * Specialized component for displaying geographic metadata including:
 * - Origins, regions, and cultural areas
 * - Modern country mappings
 * - Coordinate display with optional map integration
 * - Geographic spread visualization (timeline of spread)
 * - Sacred sites and temple locations
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    class MetadataGeographic {
        constructor(options = {}) {
            this.mapProvider = options.mapProvider || 'leaflet'; // or 'google', 'mapbox'
            this.showInteractiveMap = options.showInteractiveMap !== false;
            this.enableMapClick = options.enableMapClick || false;
            this.onLocationClick = options.onLocationClick || null;
        }

        /**
         * Main render method for geographic data
         * @param {Object} geographical - The geographical data object
         * @returns {string} Rendered HTML
         */
        render(geographical) {
            if (!geographical || Object.keys(geographical).length === 0) {
                return '';
            }

            return `
                <div class="geo-metadata-container">
                    ${this.renderOverview(geographical)}
                    ${this.renderOriginLocation(geographical.originPoint || geographical.primaryLocation)}
                    ${this.renderRegions(geographical)}
                    ${this.renderSacredSites(geographical.sacredSites || geographical.temples || geographical.cultCenters)}
                    ${this.renderSpreadPath(geographical.spreadPath)}
                    ${this.renderMapVisualization(geographical)}
                </div>
            `;
        }

        /**
         * Render geographic overview cards
         */
        renderOverview(geo) {
            const hasOverviewData = geo.region || geo.culturalArea ||
                                   geo.modernCountries?.length > 0 || geo.continent;

            if (!hasOverviewData) return '';

            return `
                <div class="geo-overview">
                    <div class="geo-cards-grid">
                        ${geo.continent ? `
                            <div class="geo-card">
                                <div class="geo-card-icon" aria-hidden="true">&#127758;</div>
                                <div class="geo-card-content">
                                    <span class="geo-card-label">Continent</span>
                                    <span class="geo-card-value">${this.escapeHtml(geo.continent)}</span>
                                </div>
                            </div>
                        ` : ''}

                        ${geo.region ? `
                            <div class="geo-card">
                                <div class="geo-card-icon" aria-hidden="true">&#128506;</div>
                                <div class="geo-card-content">
                                    <span class="geo-card-label">Region</span>
                                    <span class="geo-card-value">${this.escapeHtml(geo.region)}</span>
                                </div>
                            </div>
                        ` : ''}

                        ${geo.culturalArea ? `
                            <div class="geo-card">
                                <div class="geo-card-icon" aria-hidden="true">&#127963;</div>
                                <div class="geo-card-content">
                                    <span class="geo-card-label">Cultural Area</span>
                                    <span class="geo-card-value">${this.escapeHtml(geo.culturalArea)}</span>
                                </div>
                            </div>
                        ` : ''}

                        ${geo.historicalRegion ? `
                            <div class="geo-card">
                                <div class="geo-card-icon" aria-hidden="true">&#128220;</div>
                                <div class="geo-card-content">
                                    <span class="geo-card-label">Historical Region</span>
                                    <span class="geo-card-value">${this.escapeHtml(geo.historicalRegion)}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    ${geo.modernCountries?.length > 0 ? `
                        <div class="geo-countries">
                            <h4 class="geo-subsection-title">Modern Countries</h4>
                            <div class="country-flags">
                                ${geo.modernCountries.map(country => `
                                    <span class="country-chip" title="${this.escapeAttr(country)}">
                                        ${this.getCountryFlag(country)}
                                        <span class="country-name">${this.escapeHtml(country)}</span>
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render origin/primary location with details
         */
        renderOriginLocation(location) {
            if (!location) return '';

            const coords = location.coordinates;
            const hasCoords = coords && (coords.latitude !== undefined || coords.lat !== undefined);

            return `
                <div class="geo-origin-section">
                    <h4 class="geo-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128205;</span>
                        Origin Location
                    </h4>
                    <div class="origin-card">
                        <div class="origin-main">
                            ${location.name ? `
                                <h5 class="origin-name">${this.escapeHtml(location.name)}</h5>
                            ` : ''}
                            ${location.ancientName ? `
                                <span class="origin-ancient-name">Ancient: ${this.escapeHtml(location.ancientName)}</span>
                            ` : ''}
                            ${location.type ? `
                                <span class="origin-type-badge">${this.escapeHtml(location.type)}</span>
                            ` : ''}
                        </div>

                        ${location.description ? `
                            <p class="origin-description">${this.escapeHtml(location.description)}</p>
                        ` : ''}

                        ${location.significance ? `
                            <div class="origin-significance">
                                <strong>Significance:</strong> ${this.escapeHtml(location.significance)}
                            </div>
                        ` : ''}

                        ${hasCoords ? `
                            <div class="origin-coordinates">
                                <span class="coord-icon" aria-hidden="true">&#127760;</span>
                                <span class="coord-value">${this.formatCoordinates(coords)}</span>
                                ${coords.accuracy ? `
                                    <span class="coord-accuracy">(${this.escapeHtml(coords.accuracy)})</span>
                                ` : ''}
                                ${this.enableMapClick ? `
                                    <button class="btn-view-on-map"
                                            onclick="window.openLocationMap && window.openLocationMap(${coords.latitude || coords.lat}, ${coords.longitude || coords.lng})"
                                            aria-label="View on map">
                                        View on Map
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}

                        ${location.modernLocation ? `
                            <div class="origin-modern">
                                <strong>Modern Location:</strong> ${this.escapeHtml(location.modernLocation)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render region and area details
         */
        renderRegions(geo) {
            const associatedRegions = geo.associatedRegions || geo.regions || [];
            const territories = geo.territories || [];

            if (associatedRegions.length === 0 && territories.length === 0) return '';

            return `
                <div class="geo-regions-section">
                    ${associatedRegions.length > 0 ? `
                        <div class="regions-block">
                            <h4 class="geo-subsection-title">Associated Regions</h4>
                            <div class="regions-grid">
                                ${associatedRegions.map(region => `
                                    <div class="region-card">
                                        <span class="region-icon" aria-hidden="true">&#128506;</span>
                                        <span class="region-name">${this.escapeHtml(typeof region === 'string' ? region : region.name)}</span>
                                        ${typeof region === 'object' && region.period ? `
                                            <span class="region-period">${this.escapeHtml(region.period)}</span>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${territories.length > 0 ? `
                        <div class="territories-block">
                            <h4 class="geo-subsection-title">Territories of Influence</h4>
                            <div class="territories-list">
                                ${territories.map(territory => `
                                    <div class="territory-item">
                                        <span class="territory-name">${this.escapeHtml(typeof territory === 'string' ? territory : territory.name)}</span>
                                        ${typeof territory === 'object' && territory.type ? `
                                            <span class="territory-type badge">${this.escapeHtml(territory.type)}</span>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render sacred sites, temples, and cult centers
         */
        renderSacredSites(sites) {
            if (!sites || sites.length === 0) return '';

            return `
                <div class="geo-sacred-sites-section">
                    <h4 class="geo-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#127963;</span>
                        Sacred Sites &amp; Temples
                    </h4>
                    <div class="sacred-sites-grid">
                        ${sites.map(site => this.renderSitesCard(site)).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render a single sacred site card
         */
        renderSitesCard(site) {
            if (typeof site === 'string') {
                return `
                    <div class="site-card site-simple">
                        <span class="site-icon" aria-hidden="true">&#127963;</span>
                        <span class="site-name">${this.escapeHtml(site)}</span>
                    </div>
                `;
            }

            const coords = site.coordinates;
            const hasCoords = coords && (coords.latitude !== undefined || coords.lat !== undefined);

            return `
                <div class="site-card">
                    <div class="site-header">
                        <span class="site-icon" aria-hidden="true">${this.getSiteIcon(site.type)}</span>
                        <h5 class="site-name">${this.escapeHtml(site.name)}</h5>
                    </div>

                    ${site.ancientName ? `
                        <div class="site-ancient-name">
                            <em>${this.escapeHtml(site.ancientName)}</em>
                        </div>
                    ` : ''}

                    ${site.type ? `
                        <span class="site-type-badge">${this.escapeHtml(site.type)}</span>
                    ` : ''}

                    ${site.description ? `
                        <p class="site-description">${this.escapeHtml(site.description)}</p>
                    ` : ''}

                    ${site.period ? `
                        <div class="site-period">
                            <strong>Active Period:</strong> ${this.escapeHtml(site.period)}
                        </div>
                    ` : ''}

                    ${site.significance ? `
                        <div class="site-significance">
                            <strong>Significance:</strong> ${this.escapeHtml(site.significance)}
                        </div>
                    ` : ''}

                    ${site.modernLocation || site.location ? `
                        <div class="site-location">
                            <span class="location-icon" aria-hidden="true">&#128205;</span>
                            ${this.escapeHtml(site.modernLocation || site.location)}
                        </div>
                    ` : ''}

                    ${hasCoords ? `
                        <div class="site-coordinates">
                            <span class="coord-mini">${this.formatCoordinates(coords, true)}</span>
                        </div>
                    ` : ''}

                    ${site.status ? `
                        <span class="site-status status-${site.status.toLowerCase()}">${this.escapeHtml(site.status)}</span>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render geographic spread path as timeline
         */
        renderSpreadPath(spreadPath) {
            if (!spreadPath || spreadPath.length === 0) return '';

            return `
                <div class="geo-spread-section">
                    <h4 class="geo-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128640;</span>
                        Geographic Spread Over Time
                    </h4>
                    <div class="spread-timeline-container">
                        <div class="spread-timeline">
                            ${spreadPath.map((point, index) => `
                                <div class="spread-node" data-index="${index}">
                                    <div class="spread-marker-wrapper">
                                        <div class="spread-marker ${index === 0 ? 'spread-origin' : ''} ${index === spreadPath.length - 1 ? 'spread-final' : ''}">
                                            ${index + 1}
                                        </div>
                                        ${index < spreadPath.length - 1 ? `
                                            <div class="spread-connector"></div>
                                        ` : ''}
                                    </div>
                                    <div class="spread-content">
                                        ${point.location?.name ? `
                                            <strong class="spread-location">${this.escapeHtml(point.location.name)}</strong>
                                        ` : ''}
                                        ${point.date?.display ? `
                                            <span class="spread-date">${this.escapeHtml(point.date.display)}</span>
                                        ` : ''}
                                        ${point.mechanism ? `
                                            <span class="spread-mechanism badge badge-${point.mechanism.toLowerCase()}">${this.escapeHtml(point.mechanism)}</span>
                                        ` : ''}
                                        ${point.strength ? `
                                            <span class="spread-strength">${this.renderStrengthIndicator(point.strength)}</span>
                                        ` : ''}
                                        ${point.description ? `
                                            <p class="spread-description">${this.escapeHtml(point.description)}</p>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Render map visualization placeholder
         */
        renderMapVisualization(geographical) {
            if (!this.showInteractiveMap) return '';

            const hasMapData = geographical.originPoint?.coordinates ||
                              geographical.primaryLocation?.coordinates ||
                              geographical.sacredSites?.some(s => s.coordinates) ||
                              geographical.spreadPath?.some(p => p.location?.coordinates);

            if (!hasMapData) return '';

            // Prepare map data
            const mapData = this.prepareMapData(geographical);

            return `
                <div class="geo-map-section">
                    <h4 class="geo-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#127757;</span>
                        Geographic Visualization
                    </h4>
                    <div class="map-container"
                         id="geo-map-${Date.now()}"
                         data-map-config='${JSON.stringify(mapData)}'>
                        <div class="map-placeholder-overlay">
                            <div class="map-loading-content">
                                <div class="map-icon-large" aria-hidden="true">&#127758;</div>
                                <p>Interactive map with ${mapData.markers?.length || 0} locations</p>
                                <button class="btn-load-interactive-map"
                                        onclick="window.loadGeographicMap && window.loadGeographicMap(this.closest('.map-container'))">
                                    <span class="btn-icon" aria-hidden="true">&#128506;</span>
                                    Load Interactive Map
                                </button>
                            </div>
                        </div>
                        <div class="map-render-target"></div>
                    </div>
                    <div class="map-legend">
                        <span class="legend-item legend-origin">
                            <span class="legend-marker"></span>
                            Origin
                        </span>
                        <span class="legend-item legend-site">
                            <span class="legend-marker"></span>
                            Sacred Site
                        </span>
                        <span class="legend-item legend-spread">
                            <span class="legend-marker"></span>
                            Spread Path
                        </span>
                    </div>
                </div>
            `;
        }

        /**
         * Prepare data for map rendering
         */
        prepareMapData(geographical) {
            const markers = [];
            const paths = [];

            // Origin marker
            const origin = geographical.originPoint || geographical.primaryLocation;
            if (origin?.coordinates) {
                markers.push({
                    type: 'origin',
                    name: origin.name || 'Origin',
                    lat: origin.coordinates.latitude || origin.coordinates.lat,
                    lng: origin.coordinates.longitude || origin.coordinates.lng,
                    description: origin.description
                });
            }

            // Sacred sites markers
            const sites = geographical.sacredSites || geographical.temples || [];
            sites.forEach(site => {
                if (site.coordinates) {
                    markers.push({
                        type: 'site',
                        name: site.name,
                        lat: site.coordinates.latitude || site.coordinates.lat,
                        lng: site.coordinates.longitude || site.coordinates.lng,
                        description: site.description,
                        siteType: site.type
                    });
                }
            });

            // Spread path
            if (geographical.spreadPath?.length > 0) {
                const pathCoords = [];
                geographical.spreadPath.forEach((point, index) => {
                    if (point.location?.coordinates) {
                        const coords = point.location.coordinates;
                        pathCoords.push({
                            lat: coords.latitude || coords.lat,
                            lng: coords.longitude || coords.lng
                        });
                        markers.push({
                            type: 'spread',
                            name: point.location.name,
                            lat: coords.latitude || coords.lat,
                            lng: coords.longitude || coords.lng,
                            date: point.date?.display,
                            mechanism: point.mechanism,
                            order: index + 1
                        });
                    }
                });
                if (pathCoords.length > 1) {
                    paths.push(pathCoords);
                }
            }

            return {
                markers,
                paths,
                provider: this.mapProvider,
                bounds: this.calculateBounds(markers)
            };
        }

        /**
         * Calculate map bounds from markers
         */
        calculateBounds(markers) {
            if (markers.length === 0) return null;

            let minLat = Infinity, maxLat = -Infinity;
            let minLng = Infinity, maxLng = -Infinity;

            markers.forEach(m => {
                if (m.lat < minLat) minLat = m.lat;
                if (m.lat > maxLat) maxLat = m.lat;
                if (m.lng < minLng) minLng = m.lng;
                if (m.lng > maxLng) maxLng = m.lng;
            });

            return {
                sw: { lat: minLat, lng: minLng },
                ne: { lat: maxLat, lng: maxLng }
            };
        }

        /**
         * Render strength indicator for spread
         */
        renderStrengthIndicator(strength) {
            const levels = {
                'strong': { bars: 4, class: 'strength-strong' },
                'moderate': { bars: 3, class: 'strength-moderate' },
                'weak': { bars: 2, class: 'strength-weak' },
                'minimal': { bars: 1, class: 'strength-minimal' }
            };

            const config = levels[strength?.toLowerCase()] || levels.moderate;

            return `
                <span class="strength-indicator ${config.class}" title="${this.escapeAttr(strength || 'Unknown')} presence">
                    ${Array(4).fill(0).map((_, i) => `
                        <span class="strength-bar ${i < config.bars ? 'active' : ''}"></span>
                    `).join('')}
                </span>
            `;
        }

        /**
         * Get site type icon
         */
        getSiteIcon(type) {
            const icons = {
                'temple': '&#127963;',
                'shrine': '&#9961;',
                'sanctuary': '&#128720;',
                'oracle': '&#128302;',
                'mountain': '&#9968;',
                'river': '&#127754;',
                'lake': '&#128166;',
                'cave': '&#128376;',
                'forest': '&#127794;',
                'island': '&#127965;',
                'city': '&#127961;',
                'necropolis': '&#9904;',
                'pyramid': '&#9651;',
                'ruins': '&#127960;'
            };
            return icons[type?.toLowerCase()] || '&#128205;';
        }

        /**
         * Get country flag emoji (simplified)
         */
        getCountryFlag(country) {
            const flags = {
                'greece': '&#127468;&#127479;',
                'italy': '&#127470;&#127481;',
                'egypt': '&#127466;&#127468;',
                'turkey': '&#127481;&#127479;',
                'iran': '&#127470;&#127479;',
                'iraq': '&#127470;&#127478;',
                'india': '&#127470;&#127475;',
                'japan': '&#127471;&#127477;',
                'china': '&#127464;&#127475;',
                'norway': '&#127475;&#127476;',
                'sweden': '&#127480;&#127466;',
                'denmark': '&#127465;&#127472;',
                'iceland': '&#127470;&#127480;',
                'ireland': '&#127470;&#127466;',
                'uk': '&#127468;&#127463;',
                'france': '&#127467;&#127479;',
                'germany': '&#127465;&#127466;',
                'mexico': '&#127474;&#127485;',
                'peru': '&#127477;&#127466;',
                'israel': '&#127470;&#127473;',
                'lebanon': '&#127473;&#127463;',
                'syria': '&#127480;&#127486;'
            };
            const key = country.toLowerCase().replace(/\s+/g, '');
            return flags[key] || '&#127760;';
        }

        /**
         * Format coordinates for display
         */
        formatCoordinates(coords, compact = false) {
            const lat = coords.latitude ?? coords.lat;
            const lng = coords.longitude ?? coords.lng;

            if (lat === undefined || lng === undefined) return 'Unknown';

            const latDir = lat >= 0 ? 'N' : 'S';
            const lngDir = lng >= 0 ? 'E' : 'W';

            if (compact) {
                return `${Math.abs(lat).toFixed(2)}${latDir}, ${Math.abs(lng).toFixed(2)}${lngDir}`;
            }

            return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
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
    window.MetadataGeographic = MetadataGeographic;

})();
