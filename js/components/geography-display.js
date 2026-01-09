/**
 * Geography Display Component
 *
 * Renders geographical information for mythological entities including:
 * - Origin locations
 * - Sacred sites and temples
 * - Cultural spread regions
 * - Modern country associations
 *
 * Features:
 * - Interactive map placeholder (can integrate with mapping libraries)
 * - Region visualization
 * - Spread path visualization
 * - Coordinate display
 * - Responsive design
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    class GeographyDisplay {
        constructor(options = {}) {
            this.options = {
                containerClass: 'geography-display',
                showMap: options.showMap || false, // Map integration optional
                showCoordinates: options.showCoordinates !== false,
                compactMode: options.compactMode || false,
                onLocationClick: options.onLocationClick || null,
                ...options
            };

            // Region icon mapping
            this.regionIcons = {
                // Geographic regions
                europe: '\u{1F30D}',
                asia: '\u{1F30F}',
                africa: '\u{1F30D}',
                americas: '\u{1F30E}',
                oceania: '\u{1F30F}',
                middleEast: '\u{1F3DC}\uFE0F',
                mediterranean: '\u{1F30A}',
                nordic: '\u2744\uFE0F',
                celtic: '\u2618\uFE0F',
                slavic: '\u{1F33E}',

                // Mythological realms
                underworld: '\u{1F525}',
                heaven: '\u2728',
                olympus: '\u26C8\uFE0F',
                asgard: '\u{1F528}',
                avalon: '\u{1F33F}',
                valhalla: '\u2694\uFE0F',
                elysium: '\u{1F33C}',
                tartarus: '\u{1F480}',

                // Location types
                mountain: '\u26F0\uFE0F',
                sea: '\u{1F30A}',
                river: '\u{1F4A7}',
                forest: '\u{1F332}',
                desert: '\u{1F3DC}\uFE0F',
                island: '\u{1F3DD}\uFE0F',
                temple: '\u{1F3DB}\uFE0F',
                city: '\u{1F3D9}\uFE0F',
                cave: '\u{1F5FF}',
                lake: '\u{1F4A7}',
                volcano: '\u{1F30B}',

                default: '\u{1F4CD}'
            };

            // Country/culture associations
            this.cultureRegions = {
                greek: { name: 'Greece', region: 'mediterranean', icon: '\u{1F3DB}\uFE0F' },
                roman: { name: 'Roman Empire', region: 'mediterranean', icon: '\u{1F985}' },
                norse: { name: 'Scandinavia', region: 'nordic', icon: '\u2744\uFE0F' },
                egyptian: { name: 'Egypt', region: 'africa', icon: '\u{1F3DB}\uFE0F' },
                hindu: { name: 'Indian Subcontinent', region: 'asia', icon: '\u{1F549}\uFE0F' },
                buddhist: { name: 'Asia', region: 'asia', icon: '\u2638\uFE0F' },
                chinese: { name: 'China', region: 'asia', icon: '\u{1F409}' },
                japanese: { name: 'Japan', region: 'asia', icon: '\u26E9\uFE0F' },
                celtic: { name: 'Celtic Regions', region: 'europe', icon: '\u2618\uFE0F' },
                mesopotamian: { name: 'Mesopotamia', region: 'middleEast', icon: '\u{1F4DC}' },
                mesoamerican: { name: 'Mesoamerica', region: 'americas', icon: '\u{1F985}' },
                polynesian: { name: 'Polynesia', region: 'oceania', icon: '\u{1F30A}' }
            };
        }

        /**
         * Render complete geography display
         * @param {Object} entity - Entity with geographical data
         * @returns {string} HTML string
         */
        render(entity) {
            if (!entity) {
                return this.renderEmpty('No entity data provided');
            }

            const geo = entity.geographical || this.extractGeography(entity);

            if (!this.hasGeographyData(geo)) {
                return this.renderEmpty('No geographical data available');
            }

            return `
                <div class="${this.options.containerClass}">
                    ${this.renderOriginSection(geo, entity)}
                    ${this.renderRegionsSection(geo, entity)}
                    ${this.renderSacredSitesSection(geo, entity)}
                    ${this.renderSpreadSection(geo)}
                    ${this.renderModernAssociations(geo, entity)}
                </div>
            `;
        }

        /**
         * Render origin section
         */
        renderOriginSection(geo, entity) {
            const origin = geo.originPoint || geo.primaryLocation || geo.origin;
            if (!origin) return '';

            const originData = typeof origin === 'string' ? { name: origin } : origin;

            return `
                <div class="geo-section geo-origin">
                    <h4 class="geo-section-title">
                        <span class="geo-section-icon">\u{1F4CD}</span>
                        Origin
                    </h4>
                    <div class="geo-origin-content">
                        ${this.renderLocationCard(originData, 'origin')}
                    </div>
                </div>
            `;
        }

        /**
         * Render regions section
         */
        renderRegionsSection(geo, entity) {
            const regions = [];

            if (geo.region) regions.push({ name: geo.region, type: 'region' });
            if (geo.culturalArea) regions.push({ name: geo.culturalArea, type: 'cultural' });

            // Add mythology-based region
            const mythology = entity.primaryMythology || entity.mythology;
            if (mythology && this.cultureRegions[mythology]) {
                const culture = this.cultureRegions[mythology];
                if (!regions.some(r => r.name === culture.name)) {
                    regions.push({ name: culture.name, type: 'culture', icon: culture.icon });
                }
            }

            if (regions.length === 0) return '';

            return `
                <div class="geo-section geo-regions">
                    <h4 class="geo-section-title">
                        <span class="geo-section-icon">\u{1F30D}</span>
                        Regions
                    </h4>
                    <div class="geo-regions-list">
                        ${regions.map(region => `
                            <div class="geo-region-tag" data-type="${region.type}">
                                <span class="geo-region-icon">${region.icon || this.getRegionIcon(region.name)}</span>
                                <span class="geo-region-name">${this.escapeHtml(region.name)}</span>
                                <span class="geo-region-type">${this.capitalize(region.type)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render sacred sites section
         */
        renderSacredSitesSection(geo, entity) {
            const sites = [];

            // Collect temples
            const temples = geo.temples || entity.temples || [];
            (Array.isArray(temples) ? temples : [temples]).forEach(t => {
                sites.push({ ...(typeof t === 'string' ? { name: t } : t), type: 'temple' });
            });

            // Collect sacred sites
            const sacredSites = geo.sacredSites || entity.sacredSites || [];
            (Array.isArray(sacredSites) ? sacredSites : [sacredSites]).forEach(s => {
                sites.push({ ...(typeof s === 'string' ? { name: s } : s), type: 'sacred' });
            });

            // Cult centers
            const cultCenters = geo.cultCenters || entity.cultCenters || entity.cult_centers || [];
            (Array.isArray(cultCenters) ? cultCenters : [cultCenters]).forEach(c => {
                sites.push({ ...(typeof c === 'string' ? { name: c } : c), type: 'cult' });
            });

            if (sites.length === 0) return '';

            return `
                <div class="geo-section geo-sacred-sites">
                    <h4 class="geo-section-title">
                        <span class="geo-section-icon">\u{1F3DB}\uFE0F</span>
                        Sacred Sites
                    </h4>
                    <div class="geo-sites-grid">
                        ${sites.map(site => this.renderSiteCard(site)).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render site card
         */
        renderSiteCard(site) {
            const icon = this.getSiteIcon(site.type || site.locationType);
            const typeLabel = this.getSiteTypeLabel(site.type);

            return `
                <div class="geo-site-card" data-type="${site.type || 'site'}">
                    <div class="geo-site-icon">${icon}</div>
                    <div class="geo-site-info">
                        <span class="geo-site-name">${this.escapeHtml(site.name)}</span>
                        <span class="geo-site-type">${typeLabel}</span>
                        ${site.description ? `<p class="geo-site-desc">${this.escapeHtml(this.truncate(site.description, 100))}</p>` : ''}
                        ${site.significance ? `<p class="geo-site-significance"><em>${this.escapeHtml(this.truncate(site.significance, 100))}</em></p>` : ''}
                    </div>
                    ${site.coordinates ? this.renderMiniCoordinates(site.coordinates) : ''}
                </div>
            `;
        }

        /**
         * Render spread section
         */
        renderSpreadSection(geo) {
            const spread = geo.spreadPath || geo.spread;
            if (!spread || spread.length === 0) return '';

            return `
                <div class="geo-section geo-spread">
                    <h4 class="geo-section-title">
                        <span class="geo-section-icon">\u{1F5FA}\uFE0F</span>
                        Geographic Spread
                    </h4>
                    <div class="geo-spread-timeline">
                        ${spread.map((point, index) => `
                            <div class="geo-spread-point" data-index="${index}">
                                <div class="geo-spread-marker">
                                    <span class="geo-spread-number">${index + 1}</span>
                                </div>
                                <div class="geo-spread-line"></div>
                                <div class="geo-spread-content">
                                    <strong class="geo-spread-location">
                                        ${this.escapeHtml(point.location?.name || point.name || point)}
                                    </strong>
                                    ${point.date?.display ? `<span class="geo-spread-date">${this.escapeHtml(point.date.display)}</span>` : ''}
                                    <div class="geo-spread-meta">
                                        ${point.mechanism ? `<span class="geo-badge geo-badge--mechanism">${this.escapeHtml(point.mechanism)}</span>` : ''}
                                        ${point.strength ? `<span class="geo-badge geo-badge--strength geo-badge--${point.strength.toLowerCase()}">${this.escapeHtml(point.strength)}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render modern associations
         */
        renderModernAssociations(geo, entity) {
            const countries = geo.modernCountries || [];
            if (countries.length === 0) return '';

            return `
                <div class="geo-section geo-modern">
                    <h4 class="geo-section-title">
                        <span class="geo-section-icon">\u{1F3F3}\uFE0F</span>
                        Modern Associations
                    </h4>
                    <div class="geo-countries-list">
                        ${countries.map(country => `
                            <span class="geo-country-tag">
                                ${this.getCountryFlag(country)}
                                ${this.escapeHtml(country)}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render location card
         */
        renderLocationCard(location, type = 'location') {
            if (!location) return '';

            const icon = this.getLocationIcon(location);
            const coords = location.coordinates;

            return `
                <div class="geo-location-card geo-location-card--${type}">
                    <div class="geo-location-header">
                        <span class="geo-location-icon">${icon}</span>
                        <div class="geo-location-title">
                            <h5 class="geo-location-name">${this.escapeHtml(location.name || 'Unknown')}</h5>
                            ${location.type ? `<span class="geo-location-type-badge">${this.escapeHtml(location.type)}</span>` : ''}
                        </div>
                    </div>
                    ${location.description ? `
                        <p class="geo-location-description">${this.escapeHtml(location.description)}</p>
                    ` : ''}
                    ${location.significance ? `
                        <p class="geo-location-significance"><em>${this.escapeHtml(location.significance)}</em></p>
                    ` : ''}
                    ${coords && this.options.showCoordinates ? this.renderCoordinates(coords) : ''}
                </div>
            `;
        }

        /**
         * Render coordinates
         */
        renderCoordinates(coords) {
            if (!coords) return '';

            const lat = coords.latitude || coords.lat;
            const lon = coords.longitude || coords.lng || coords.lon;

            if (lat === undefined || lon === undefined) return '';

            const latDir = lat >= 0 ? 'N' : 'S';
            const lonDir = lon >= 0 ? 'E' : 'W';

            return `
                <div class="geo-coordinates">
                    <span class="geo-coordinates-icon">\u{1F4CD}</span>
                    <span class="geo-coordinates-value">
                        ${Math.abs(lat).toFixed(4)}${latDir}, ${Math.abs(lon).toFixed(4)}${lonDir}
                    </span>
                    ${coords.accuracy ? `<span class="geo-coordinates-accuracy">(${this.escapeHtml(coords.accuracy)})</span>` : ''}
                    ${this.options.showMap ? `
                        <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=10"
                           class="geo-map-link"
                           target="_blank"
                           rel="noopener">
                            View Map \u2197
                        </a>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render mini coordinates (inline)
         */
        renderMiniCoordinates(coords) {
            if (!coords) return '';

            const lat = coords.latitude || coords.lat;
            const lon = coords.longitude || coords.lng || coords.lon;

            if (lat === undefined || lon === undefined) return '';

            return `
                <span class="geo-mini-coords" title="Coordinates">
                    \u{1F4CD} ${Math.abs(lat).toFixed(2)}, ${Math.abs(lon).toFixed(2)}
                </span>
            `;
        }

        /**
         * Render a simple region map (CSS-based visualization)
         * @param {string} mythology - The mythology/culture
         * @returns {string} HTML string
         */
        renderRegionMap(mythology) {
            const culture = this.cultureRegions[mythology];
            if (!culture) return '';

            return `
                <div class="geo-region-map" data-region="${culture.region}">
                    <div class="geo-map-icon">${culture.icon}</div>
                    <div class="geo-map-label">${culture.name}</div>
                </div>
            `;
        }

        /**
         * Render empty state
         */
        renderEmpty(message) {
            return `
                <div class="${this.options.containerClass} geo-empty">
                    <span class="geo-empty-icon">\u{1F30D}</span>
                    <p class="geo-empty-message">${this.escapeHtml(message)}</p>
                </div>
            `;
        }

        // ==================== HELPER METHODS ====================

        /**
         * Extract geography from entity
         */
        extractGeography(entity) {
            return {
                origin: entity.origin,
                region: entity.region,
                culturalArea: entity.culturalArea,
                temples: entity.temples,
                sacredSites: entity.sacredSites,
                cultCenters: entity.cultCenters || entity.cult_centers,
                modernCountries: entity.modernCountries,
                coordinates: entity.coordinates,
                spreadPath: entity.spreadPath || entity.spread
            };
        }

        /**
         * Check if entity has geography data
         */
        hasGeographyData(geo) {
            return geo && (
                geo.origin ||
                geo.region ||
                geo.culturalArea ||
                (geo.temples && geo.temples.length > 0) ||
                (geo.sacredSites && geo.sacredSites.length > 0) ||
                (geo.cultCenters && geo.cultCenters.length > 0) ||
                (geo.modernCountries && geo.modernCountries.length > 0) ||
                (geo.spreadPath && geo.spreadPath.length > 0)
            );
        }

        /**
         * Get region icon
         */
        getRegionIcon(region) {
            if (!region) return this.regionIcons.default;
            const key = region.toLowerCase().replace(/\s+/g, '');
            return this.regionIcons[key] || this.regionIcons.default;
        }

        /**
         * Get location icon
         */
        getLocationIcon(location) {
            if (!location) return this.regionIcons.default;
            const type = (location.type || location.locationType || '').toLowerCase();
            return this.regionIcons[type] || this.regionIcons.default;
        }

        /**
         * Get site icon
         */
        getSiteIcon(type) {
            const icons = {
                temple: '\u{1F3DB}\uFE0F',
                sacred: '\u2728',
                cult: '\u{1F56F}\uFE0F',
                shrine: '\u26E9\uFE0F',
                oracle: '\u{1F52E}',
                sanctuary: '\u{1F3DB}\uFE0F',
                default: '\u{1F4CD}'
            };
            return icons[type] || icons.default;
        }

        /**
         * Get site type label
         */
        getSiteTypeLabel(type) {
            const labels = {
                temple: 'Temple',
                sacred: 'Sacred Site',
                cult: 'Cult Center',
                shrine: 'Shrine',
                oracle: 'Oracle',
                sanctuary: 'Sanctuary'
            };
            return labels[type] || 'Site';
        }

        /**
         * Get country flag emoji (simplified mapping)
         */
        getCountryFlag(country) {
            const flags = {
                'greece': '\u{1F1EC}\u{1F1F7}',
                'italy': '\u{1F1EE}\u{1F1F9}',
                'egypt': '\u{1F1EA}\u{1F1EC}',
                'india': '\u{1F1EE}\u{1F1F3}',
                'china': '\u{1F1E8}\u{1F1F3}',
                'japan': '\u{1F1EF}\u{1F1F5}',
                'norway': '\u{1F1F3}\u{1F1F4}',
                'sweden': '\u{1F1F8}\u{1F1EA}',
                'denmark': '\u{1F1E9}\u{1F1F0}',
                'iceland': '\u{1F1EE}\u{1F1F8}',
                'ireland': '\u{1F1EE}\u{1F1EA}',
                'uk': '\u{1F1EC}\u{1F1E7}',
                'france': '\u{1F1EB}\u{1F1F7}',
                'germany': '\u{1F1E9}\u{1F1EA}',
                'turkey': '\u{1F1F9}\u{1F1F7}',
                'iran': '\u{1F1EE}\u{1F1F7}',
                'iraq': '\u{1F1EE}\u{1F1F6}',
                'mexico': '\u{1F1F2}\u{1F1FD}',
                'peru': '\u{1F1F5}\u{1F1EA}'
            };
            const key = country.toLowerCase().trim();
            return flags[key] || '\u{1F3F3}\uFE0F';
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
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        /**
         * Truncate text
         */
        truncate(text, maxLength = 100) {
            if (!text || text.length <= maxLength) return text || '';
            return text.substring(0, maxLength).trim() + '...';
        }

        /**
         * Initialize click handlers
         */
        initClickHandlers(container) {
            if (!this.options.onLocationClick) return;

            container.querySelectorAll('.geo-location-card, .geo-site-card').forEach(card => {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    const name = card.querySelector('.geo-location-name, .geo-site-name')?.textContent;
                    this.options.onLocationClick({ name });
                });
            });
        }
    }

    // Export to window
    window.GeographyDisplay = GeographyDisplay;

    // Also export as module if supported
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GeographyDisplay;
    }

})();
