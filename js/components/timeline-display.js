/**
 * Timeline Display Component
 *
 * Renders chronological timeline visualizations for mythological entities.
 * Supports various timeline types including:
 * - Key moments and events
 * - Era spans
 * - Geographic spread over time
 * - Worship periods
 *
 * Features:
 * - Interactive timeline with hover effects
 * - Responsive design for all screen sizes
 * - Supports BCE/CE dates
 * - Multiple visualization modes
 * - Accessible markup with ARIA
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    class TimelineDisplay {
        constructor(options = {}) {
            this.options = {
                containerClass: 'timeline-display',
                animateOnScroll: options.animateOnScroll !== false,
                showLabels: options.showLabels !== false,
                compactMode: options.compactMode || false,
                orientation: options.orientation || 'vertical', // 'vertical' or 'horizontal'
                colorScheme: options.colorScheme || 'default',
                onEventClick: options.onEventClick || null,
                ...options
            };

            // Event type configurations
            this.eventTypes = {
                birth: { icon: '\u{1F476}', color: '#4CAF50', label: 'Birth' },
                death: { icon: '\u{1F480}', color: '#607D8B', label: 'Death' },
                creation: { icon: '\u2728', color: '#FFD700', label: 'Creation' },
                battle: { icon: '\u2694\uFE0F', color: '#F44336', label: 'Battle' },
                quest: { icon: '\u{1F5FA}\uFE0F', color: '#2196F3', label: 'Quest' },
                discovery: { icon: '\u{1F4A1}', color: '#00BCD4', label: 'Discovery' },
                founding: { icon: '\u{1F3DB}\uFE0F', color: '#9C27B0', label: 'Founding' },
                marriage: { icon: '\u{1F48D}', color: '#E91E63', label: 'Marriage' },
                transformation: { icon: '\u{1F504}', color: '#FF9800', label: 'Transformation' },
                worship: { icon: '\u{1F64F}', color: '#7E57C2', label: 'Worship' },
                victory: { icon: '\u{1F3C6}', color: '#FFD700', label: 'Victory' },
                defeat: { icon: '\u{1F494}', color: '#795548', label: 'Defeat' },
                prophecy: { icon: '\u{1F52E}', color: '#673AB7', label: 'Prophecy' },
                miracle: { icon: '\u2728', color: '#FFC107', label: 'Miracle' },
                trial: { icon: '\u{1F525}', color: '#FF5722', label: 'Trial' },
                ascension: { icon: '\u{1F320}', color: '#00E676', label: 'Ascension' },
                attestation: { icon: '\u{1F4DC}', color: '#8D6E63', label: 'First Attestation' },
                peak: { icon: '\u{1F4C8}', color: '#4CAF50', label: 'Peak Popularity' },
                decline: { icon: '\u{1F4C9}', color: '#FF9800', label: 'Decline' },
                default: { icon: '\u{1F31F}', color: '#667eea', label: 'Event' }
            };

            // Era configurations
            this.eras = {
                primordial: { label: 'Primordial Age', color: '#212121' },
                golden: { label: 'Golden Age', color: '#FFD700' },
                silver: { label: 'Silver Age', color: '#C0C0C0' },
                bronze: { label: 'Bronze Age', color: '#CD7F32' },
                heroic: { label: 'Heroic Age', color: '#9C27B0' },
                iron: { label: 'Iron Age', color: '#607D8B' },
                archaic: { label: 'Archaic Period', color: '#8D6E63' },
                classical: { label: 'Classical Period', color: '#1976D2' },
                hellenistic: { label: 'Hellenistic Period', color: '#7B1FA2' },
                roman: { label: 'Roman Period', color: '#C62828' },
                medieval: { label: 'Medieval Period', color: '#5D4037' },
                modern: { label: 'Modern Era', color: '#00796B' }
            };
        }

        /**
         * Render a complete timeline from entity data
         * @param {Object} entity - Entity with temporal data
         * @returns {string} HTML string
         */
        render(entity) {
            if (!entity) {
                return this.renderEmpty('No entity data provided');
            }

            const temporal = entity.temporal || {};
            const timeline = this.buildTimelineData(entity, temporal);

            if (timeline.events.length === 0) {
                return this.renderEmpty('No timeline data available');
            }

            const orientation = this.options.orientation;

            return `
                <div class="${this.options.containerClass} timeline--${orientation}"
                     data-event-count="${timeline.events.length}">
                    ${timeline.era ? this.renderEraHeader(timeline.era) : ''}
                    ${this.renderTimelineScale(timeline)}
                    <div class="timeline__track">
                        ${timeline.events.map((event, index) => this.renderEvent(event, index, timeline.events.length)).join('')}
                    </div>
                    ${this.options.showLabels ? this.renderLegend(timeline.events) : ''}
                </div>
            `;
        }

        /**
         * Render timeline from explicit events array
         * @param {Array} events - Array of event objects
         * @param {Object} options - Rendering options
         * @returns {string} HTML string
         */
        renderEvents(events, options = {}) {
            if (!events || events.length === 0) {
                return this.renderEmpty('No events to display');
            }

            const sortedEvents = this.sortEvents([...events]);
            const orientation = options.orientation || this.options.orientation;

            return `
                <div class="${this.options.containerClass} timeline--${orientation}"
                     data-event-count="${sortedEvents.length}">
                    ${this.renderTimelineScale({ events: sortedEvents })}
                    <div class="timeline__track">
                        ${sortedEvents.map((event, index) => this.renderEvent(event, index, sortedEvents.length)).join('')}
                    </div>
                    ${this.options.showLabels ? this.renderLegend(sortedEvents) : ''}
                </div>
            `;
        }

        /**
         * Render a key moments timeline
         * @param {Array} moments - Array of key moment objects
         * @returns {string} HTML string
         */
        renderKeyMoments(moments) {
            if (!moments || moments.length === 0) return '';

            const events = moments.map(moment => ({
                type: moment.type || 'default',
                date: moment.date,
                title: moment.event || moment.title,
                description: moment.significance || moment.description,
                source: moment.source
            }));

            return this.renderEvents(events);
        }

        /**
         * Render spread timeline (geographic spread over time)
         * @param {Array} spreadPath - Array of spread point objects
         * @returns {string} HTML string
         */
        renderSpreadTimeline(spreadPath) {
            if (!spreadPath || spreadPath.length === 0) return '';

            return `
                <div class="${this.options.containerClass} timeline--spread">
                    <h4 class="timeline__title">Geographic Spread</h4>
                    <div class="timeline__track timeline__track--spread">
                        ${spreadPath.map((point, index) => `
                            <div class="timeline__spread-point" data-index="${index}">
                                <div class="timeline__spread-marker">
                                    <span class="timeline__spread-number">${index + 1}</span>
                                </div>
                                <div class="timeline__spread-content">
                                    ${point.location?.name ? `<strong class="timeline__spread-location">${this.escapeHtml(point.location.name)}</strong>` : ''}
                                    ${point.date?.display ? `<span class="timeline__spread-date">${this.escapeHtml(point.date.display)}</span>` : ''}
                                    ${point.mechanism ? `<span class="timeline__spread-mechanism badge">${this.escapeHtml(point.mechanism)}</span>` : ''}
                                    ${point.strength ? `<span class="timeline__spread-strength badge badge--${point.strength.toLowerCase()}">${this.escapeHtml(point.strength)}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render worship period timeline
         * @param {Object} temporal - Temporal data object
         * @returns {string} HTML string
         */
        renderWorshipPeriod(temporal) {
            if (!temporal) return '';

            const periods = [];

            if (temporal.firstAttestation) {
                periods.push({
                    type: 'attestation',
                    date: temporal.firstAttestation.date,
                    title: 'First Attestation',
                    description: temporal.firstAttestation.source || ''
                });
            }

            if (temporal.peakPopularity) {
                periods.push({
                    type: 'peak',
                    date: temporal.peakPopularity,
                    title: 'Peak Popularity',
                    description: temporal.peakPopularity.context || ''
                });
            }

            if (periods.length === 0) return '';

            return this.renderEvents(periods, { orientation: 'horizontal' });
        }

        /**
         * Build timeline data from entity
         */
        buildTimelineData(entity, temporal) {
            const events = [];

            // Add first attestation
            if (temporal.firstAttestation) {
                events.push({
                    type: 'attestation',
                    date: temporal.firstAttestation.date,
                    title: 'First Attestation',
                    description: temporal.firstAttestation.source || temporal.firstAttestation.description,
                    confidence: temporal.firstAttestation.confidence
                });
            }

            // Add peak popularity
            if (temporal.peakPopularity) {
                events.push({
                    type: 'peak',
                    date: temporal.peakPopularity,
                    title: 'Peak Popularity',
                    description: temporal.peakPopularity.context
                });
            }

            // Add key moments
            if (temporal.timelinePosition?.keyMoments) {
                temporal.timelinePosition.keyMoments.forEach(moment => {
                    events.push({
                        type: moment.type || 'default',
                        date: moment.date,
                        title: moment.event,
                        description: moment.significance
                    });
                });
            }

            // Add mythological dates
            if (temporal.mythologicalDate) {
                events.push({
                    type: 'creation',
                    date: temporal.mythologicalDate,
                    title: 'Mythological Origin',
                    description: ''
                });
            }

            return {
                events: this.sortEvents(events),
                era: temporal.culturalPeriod || temporal.era
            };
        }

        /**
         * Sort events chronologically
         */
        sortEvents(events) {
            return events.sort((a, b) => {
                const yearA = this.getYear(a.date);
                const yearB = this.getYear(b.date);
                return yearA - yearB;
            });
        }

        /**
         * Extract year from date object
         */
        getYear(dateObj) {
            if (!dateObj) return 0;
            if (typeof dateObj === 'number') return dateObj;
            if (typeof dateObj === 'string') {
                const match = dateObj.match(/-?\d+/);
                return match ? parseInt(match[0]) : 0;
            }
            if (dateObj.year !== undefined) return dateObj.year;
            if (dateObj.start !== undefined) return dateObj.start;
            return 0;
        }

        /**
         * Render era header
         */
        renderEraHeader(era) {
            const eraConfig = this.eras[era?.toLowerCase()] || { label: this.capitalize(era), color: '#667eea' };

            return `
                <div class="timeline__era-header" style="--era-color: ${eraConfig.color}">
                    <span class="timeline__era-label">${this.escapeHtml(eraConfig.label)}</span>
                </div>
            `;
        }

        /**
         * Render timeline scale
         */
        renderTimelineScale(timeline) {
            if (!timeline.events || timeline.events.length < 2) return '';

            const years = timeline.events.map(e => this.getYear(e.date)).filter(y => y !== 0);
            if (years.length < 2) return '';

            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            const range = maxYear - minYear;

            // Generate scale markers
            const markers = this.generateScaleMarkers(minYear, maxYear);

            return `
                <div class="timeline__scale" data-min="${minYear}" data-max="${maxYear}">
                    ${markers.map(marker => `
                        <div class="timeline__scale-marker" style="--position: ${((marker - minYear) / range) * 100}%">
                            <span class="timeline__scale-label">${this.formatYear(marker)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        /**
         * Generate scale markers
         */
        generateScaleMarkers(min, max) {
            const range = max - min;
            const markers = [];

            // Determine appropriate interval
            let interval;
            if (range > 2000) interval = 500;
            else if (range > 1000) interval = 250;
            else if (range > 500) interval = 100;
            else if (range > 100) interval = 50;
            else interval = 25;

            const start = Math.ceil(min / interval) * interval;
            for (let year = start; year <= max; year += interval) {
                markers.push(year);
            }

            // Ensure we have at least start and end
            if (markers.length === 0 || markers[0] > min + interval / 2) {
                markers.unshift(min);
            }
            if (markers.length === 0 || markers[markers.length - 1] < max - interval / 2) {
                markers.push(max);
            }

            return markers;
        }

        /**
         * Render single event
         */
        renderEvent(event, index, total) {
            const eventConfig = this.eventTypes[event.type] || this.eventTypes.default;
            const dateDisplay = this.formatDateDisplay(event.date);
            const delay = index * 0.1;

            return `
                <div class="timeline__event"
                     data-type="${event.type || 'default'}"
                     data-index="${index}"
                     style="--event-color: ${eventConfig.color}; --animation-delay: ${delay}s"
                     role="article"
                     aria-label="${this.escapeHtml(event.title || 'Event')}">
                    <div class="timeline__event-marker">
                        <span class="timeline__event-icon" aria-hidden="true">${eventConfig.icon}</span>
                    </div>
                    <div class="timeline__event-connector"></div>
                    <div class="timeline__event-content">
                        ${dateDisplay ? `<time class="timeline__event-date">${this.escapeHtml(dateDisplay)}</time>` : ''}
                        <h4 class="timeline__event-title">${this.escapeHtml(event.title || eventConfig.label)}</h4>
                        ${event.description ? `<p class="timeline__event-description">${this.escapeHtml(event.description)}</p>` : ''}
                        ${event.source ? `<cite class="timeline__event-source">${this.escapeHtml(event.source)}</cite>` : ''}
                        ${event.confidence ? `<span class="timeline__event-confidence badge badge--${event.confidence.toLowerCase()}">${this.escapeHtml(event.confidence)}</span>` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render legend
         */
        renderLegend(events) {
            const usedTypes = [...new Set(events.map(e => e.type || 'default'))];
            if (usedTypes.length <= 1) return '';

            return `
                <div class="timeline__legend">
                    <h5 class="timeline__legend-title">Legend</h5>
                    <div class="timeline__legend-items">
                        ${usedTypes.map(type => {
                            const config = this.eventTypes[type] || this.eventTypes.default;
                            return `
                                <div class="timeline__legend-item" style="--event-color: ${config.color}">
                                    <span class="timeline__legend-icon">${config.icon}</span>
                                    <span class="timeline__legend-label">${config.label}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render empty state
         */
        renderEmpty(message) {
            return `
                <div class="${this.options.containerClass} timeline--empty">
                    <p class="timeline__empty-message">${this.escapeHtml(message)}</p>
                </div>
            `;
        }

        /**
         * Format date for display
         */
        formatDateDisplay(dateObj) {
            if (!dateObj) return '';
            if (typeof dateObj === 'string') return dateObj;
            if (dateObj.display) return dateObj.display;

            const year = dateObj.year || dateObj.start;
            if (year !== undefined) {
                const circa = dateObj.circa ? 'c. ' : '';
                return `${circa}${this.formatYear(year)}`;
            }

            return '';
        }

        /**
         * Format year with BCE/CE
         */
        formatYear(year) {
            if (year < 0) {
                return `${Math.abs(year)} BCE`;
            } else if (year < 1000) {
                return `${year} CE`;
            }
            return String(year);
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
         * Initialize animations for timeline
         */
        initAnimations(container) {
            if (!this.options.animateOnScroll) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('timeline__event--visible');
                    }
                });
            }, { threshold: 0.2 });

            container.querySelectorAll('.timeline__event').forEach(event => {
                observer.observe(event);
            });
        }

        /**
         * Initialize click handlers
         */
        initClickHandlers(container) {
            if (!this.options.onEventClick) return;

            container.querySelectorAll('.timeline__event').forEach(event => {
                event.addEventListener('click', () => {
                    const eventData = {
                        type: event.dataset.type,
                        index: parseInt(event.dataset.index)
                    };
                    this.options.onEventClick(eventData);
                });
                event.style.cursor = 'pointer';
            });
        }
    }

    // Export to window
    window.TimelineDisplay = TimelineDisplay;

    // Also export as module if supported
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TimelineDisplay;
    }

})();
