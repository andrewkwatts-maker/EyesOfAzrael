/**
 * Metadata Chronological Component
 *
 * Specialized component for displaying chronological/temporal metadata including:
 * - Era and cultural periods
 * - Mythological vs historical dates
 * - First attestation with source
 * - Peak popularity periods
 * - Literary references timeline
 * - Interactive timeline visualization
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    class MetadataChronological {
        constructor(options = {}) {
            this.showTimeline = options.showTimeline !== false;
            this.timelineProvider = options.timelineProvider || 'native';
            this.dateFormat = options.dateFormat || 'era'; // 'era', 'year', 'full'
            this.onPeriodClick = options.onPeriodClick || null;
        }

        /**
         * Main render method for chronological data
         * @param {Object} temporal - The temporal data object
         * @returns {string} Rendered HTML
         */
        render(temporal) {
            if (!temporal || Object.keys(temporal).length === 0) {
                return '';
            }

            return `
                <div class="chrono-metadata-container">
                    ${this.renderOverview(temporal)}
                    ${this.renderDates(temporal)}
                    ${this.renderFirstAttestation(temporal.firstAttestation)}
                    ${this.renderPeakPopularity(temporal.peakPopularity)}
                    ${this.renderEvolution(temporal.evolution || temporal.development)}
                    ${this.renderLiteraryReferences(temporal.literaryReferences)}
                    ${this.renderTimelineVisualization(temporal)}
                </div>
            `;
        }

        /**
         * Render chronological overview cards
         */
        renderOverview(temporal) {
            const hasOverviewData = temporal.culturalPeriod || temporal.era ||
                                   temporal.epoch || temporal.dynasty;

            if (!hasOverviewData) return '';

            return `
                <div class="chrono-overview">
                    <div class="chrono-cards-grid">
                        ${temporal.era ? `
                            <div class="chrono-card chrono-era">
                                <div class="chrono-card-icon" aria-hidden="true">&#128336;</div>
                                <div class="chrono-card-content">
                                    <span class="chrono-card-label">Era</span>
                                    <span class="chrono-card-value">${this.escapeHtml(temporal.era)}</span>
                                </div>
                            </div>
                        ` : ''}

                        ${temporal.culturalPeriod ? `
                            <div class="chrono-card chrono-period">
                                <div class="chrono-card-icon" aria-hidden="true">&#127963;</div>
                                <div class="chrono-card-content">
                                    <span class="chrono-card-label">Cultural Period</span>
                                    <span class="chrono-card-value">${this.escapeHtml(temporal.culturalPeriod)}</span>
                                </div>
                            </div>
                        ` : ''}

                        ${temporal.epoch ? `
                            <div class="chrono-card chrono-epoch">
                                <div class="chrono-card-icon" aria-hidden="true">&#9202;</div>
                                <div class="chrono-card-content">
                                    <span class="chrono-card-label">Epoch</span>
                                    <span class="chrono-card-value">${this.escapeHtml(temporal.epoch)}</span>
                                </div>
                            </div>
                        ` : ''}

                        ${temporal.dynasty ? `
                            <div class="chrono-card chrono-dynasty">
                                <div class="chrono-card-icon" aria-hidden="true">&#128081;</div>
                                <div class="chrono-card-content">
                                    <span class="chrono-card-label">Dynasty</span>
                                    <span class="chrono-card-value">${this.escapeHtml(temporal.dynasty)}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    ${temporal.historicalContext ? `
                        <div class="chrono-context">
                            <h4 class="chrono-subsection-title">Historical Context</h4>
                            <p class="context-text">${this.escapeHtml(temporal.historicalContext)}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render mythological and historical dates
         */
        renderDates(temporal) {
            const hasDates = temporal.mythologicalDate || temporal.historicalDate ||
                            temporal.dateRange || temporal.approximateDate;

            if (!hasDates) return '';

            return `
                <div class="chrono-dates-section">
                    <h4 class="chrono-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128197;</span>
                        Dates &amp; Dating
                    </h4>
                    <div class="dates-grid">
                        ${temporal.mythologicalDate ? `
                            <div class="date-card date-mythological">
                                <div class="date-type">
                                    <span class="date-icon" aria-hidden="true">&#10024;</span>
                                    Mythological Date
                                </div>
                                <div class="date-value">${this.formatDateObject(temporal.mythologicalDate)}</div>
                                ${temporal.mythologicalDate.context ? `
                                    <div class="date-context">${this.escapeHtml(temporal.mythologicalDate.context)}</div>
                                ` : ''}
                            </div>
                        ` : ''}

                        ${temporal.historicalDate ? `
                            <div class="date-card date-historical">
                                <div class="date-type">
                                    <span class="date-icon" aria-hidden="true">&#128220;</span>
                                    Historical Date
                                </div>
                                <div class="date-value">${this.formatDateObject(temporal.historicalDate)}</div>
                                ${temporal.historicalDate.confidence ? `
                                    <div class="date-confidence confidence-${temporal.historicalDate.confidence}">
                                        ${this.renderConfidenceIndicator(temporal.historicalDate.confidence)}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}

                        ${temporal.dateRange ? `
                            <div class="date-card date-range">
                                <div class="date-type">
                                    <span class="date-icon" aria-hidden="true">&#8596;</span>
                                    Active Period
                                </div>
                                <div class="date-value">
                                    ${this.formatDateObject(temporal.dateRange.start)}
                                    <span class="date-separator">to</span>
                                    ${this.formatDateObject(temporal.dateRange.end)}
                                </div>
                            </div>
                        ` : ''}

                        ${temporal.approximateDate ? `
                            <div class="date-card date-approximate">
                                <div class="date-type">
                                    <span class="date-icon" aria-hidden="true">&#126;</span>
                                    Approximate Date
                                </div>
                                <div class="date-value">c. ${this.formatDateObject(temporal.approximateDate)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render first attestation details
         */
        renderFirstAttestation(attestation) {
            if (!attestation) return '';

            return `
                <div class="chrono-attestation-section">
                    <h4 class="chrono-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128196;</span>
                        First Attestation
                    </h4>
                    <div class="attestation-card">
                        <div class="attestation-main">
                            ${attestation.date?.display ? `
                                <div class="attestation-date">
                                    <span class="date-badge">${this.escapeHtml(attestation.date.display)}</span>
                                </div>
                            ` : ''}

                            ${attestation.source ? `
                                <div class="attestation-source">
                                    <strong>Source:</strong>
                                    <span class="source-name">${this.escapeHtml(attestation.source)}</span>
                                </div>
                            ` : ''}

                            ${attestation.author ? `
                                <div class="attestation-author">
                                    <strong>Author:</strong> ${this.escapeHtml(attestation.author)}
                                </div>
                            ` : ''}
                        </div>

                        <div class="attestation-meta">
                            ${attestation.type ? `
                                <span class="attestation-type-badge type-${attestation.type.toLowerCase()}">
                                    ${this.getAttestationTypeIcon(attestation.type)}
                                    ${this.escapeHtml(attestation.type)}
                                </span>
                            ` : ''}

                            ${attestation.confidence ? `
                                <span class="attestation-confidence confidence-${attestation.confidence}">
                                    ${this.renderConfidenceIndicator(attestation.confidence)}
                                    <span class="confidence-label">${this.escapeHtml(attestation.confidence)}</span>
                                </span>
                            ` : ''}

                            ${attestation.language ? `
                                <span class="attestation-language">${this.escapeHtml(attestation.language)}</span>
                            ` : ''}
                        </div>

                        ${attestation.description ? `
                            <div class="attestation-description">
                                <p>${this.escapeHtml(attestation.description)}</p>
                            </div>
                        ` : ''}

                        ${attestation.passage ? `
                            <blockquote class="attestation-passage">
                                "${this.escapeHtml(attestation.passage)}"
                            </blockquote>
                        ` : ''}

                        ${attestation.location ? `
                            <div class="attestation-location">
                                <span class="location-icon" aria-hidden="true">&#128205;</span>
                                ${this.escapeHtml(attestation.location)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render peak popularity information
         */
        renderPeakPopularity(peak) {
            if (!peak) return '';

            return `
                <div class="chrono-peak-section">
                    <h4 class="chrono-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128200;</span>
                        Peak Popularity
                    </h4>
                    <div class="peak-card">
                        <div class="peak-period">
                            ${peak.display ? `
                                <span class="period-badge">${this.escapeHtml(peak.display)}</span>
                            ` : peak.start && peak.end ? `
                                <span class="period-range">
                                    ${this.formatDateObject(peak.start)} - ${this.formatDateObject(peak.end)}
                                </span>
                            ` : ''}
                        </div>

                        ${peak.context ? `
                            <p class="peak-context">${this.escapeHtml(peak.context)}</p>
                        ` : ''}

                        ${peak.factors?.length > 0 ? `
                            <div class="peak-factors">
                                <strong>Contributing Factors:</strong>
                                <ul class="factors-list">
                                    ${peak.factors.map(factor => `
                                        <li>${this.escapeHtml(factor)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${peak.evidence ? `
                            <div class="peak-evidence">
                                <strong>Evidence:</strong> ${this.escapeHtml(peak.evidence)}
                            </div>
                        ` : ''}

                        ${this.renderPopularityChart(peak)}
                    </div>
                </div>
            `;
        }

        /**
         * Render simplified popularity chart
         */
        renderPopularityChart(peak) {
            if (!peak.levels) return '';

            return `
                <div class="popularity-chart">
                    <div class="chart-bars">
                        ${peak.levels.map((level, i) => `
                            <div class="chart-bar-group">
                                <div class="chart-bar" style="height: ${level.value || 50}%"
                                     title="${this.escapeAttr(level.period || '')}: ${level.value || 50}%">
                                </div>
                                <span class="chart-label">${this.escapeHtml(level.period || i + 1)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render evolution/development over time
         */
        renderEvolution(evolution) {
            if (!evolution || (Array.isArray(evolution) && evolution.length === 0)) return '';

            const phases = Array.isArray(evolution) ? evolution : [evolution];

            return `
                <div class="chrono-evolution-section">
                    <h4 class="chrono-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128257;</span>
                        Evolution Over Time
                    </h4>
                    <div class="evolution-timeline">
                        ${phases.map((phase, index) => `
                            <div class="evolution-phase" data-index="${index}">
                                <div class="phase-marker-wrapper">
                                    <div class="phase-marker ${index === 0 ? 'phase-start' : ''} ${index === phases.length - 1 ? 'phase-end' : ''}">
                                        ${index + 1}
                                    </div>
                                    ${index < phases.length - 1 ? `<div class="phase-connector"></div>` : ''}
                                </div>
                                <div class="phase-content">
                                    ${phase.period || phase.name ? `
                                        <h5 class="phase-title">${this.escapeHtml(phase.period || phase.name)}</h5>
                                    ` : ''}
                                    ${phase.date?.display ? `
                                        <span class="phase-date">${this.escapeHtml(phase.date.display)}</span>
                                    ` : ''}
                                    ${phase.description ? `
                                        <p class="phase-description">${this.escapeHtml(phase.description)}</p>
                                    ` : ''}
                                    ${phase.changes?.length > 0 ? `
                                        <ul class="phase-changes">
                                            ${phase.changes.map(change => `
                                                <li>${this.escapeHtml(change)}</li>
                                            `).join('')}
                                        </ul>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render literary references timeline
         */
        renderLiteraryReferences(references) {
            if (!references || references.length === 0) return '';

            // Sort by date if possible
            const sortedRefs = [...references].sort((a, b) => {
                const yearA = a.date?.year || 0;
                const yearB = b.date?.year || 0;
                return yearA - yearB;
            });

            return `
                <div class="chrono-literary-section">
                    <h4 class="chrono-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128218;</span>
                        Literary References Timeline
                    </h4>
                    <div class="literary-timeline">
                        ${sortedRefs.map((ref, index) => `
                            <div class="literary-entry" data-index="${index}">
                                <div class="entry-timeline-marker">
                                    <div class="timeline-dot"></div>
                                    ${index < sortedRefs.length - 1 ? `<div class="timeline-line"></div>` : ''}
                                </div>
                                <div class="entry-content">
                                    <div class="entry-header">
                                        <h5 class="entry-title">${this.escapeHtml(ref.work || ref.title)}</h5>
                                        ${ref.date?.display ? `
                                            <span class="entry-date">${this.escapeHtml(ref.date.display)}</span>
                                        ` : ''}
                                    </div>
                                    ${ref.author ? `
                                        <div class="entry-author">by ${this.escapeHtml(ref.author)}</div>
                                    ` : ''}
                                    ${ref.significance ? `
                                        <p class="entry-significance">${this.escapeHtml(ref.significance)}</p>
                                    ` : ''}
                                    ${ref.passage ? `
                                        <blockquote class="entry-passage">"${this.escapeHtml(ref.passage)}"</blockquote>
                                    ` : ''}
                                    ${ref.type ? `
                                        <span class="entry-type badge">${this.escapeHtml(ref.type)}</span>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render interactive timeline visualization
         */
        renderTimelineVisualization(temporal) {
            if (!this.showTimeline) return '';

            const timelineData = this.prepareTimelineData(temporal);
            if (timelineData.events.length === 0) return '';

            return `
                <div class="chrono-timeline-section">
                    <h4 class="chrono-subsection-title">
                        <span class="title-icon" aria-hidden="true">&#128200;</span>
                        Interactive Timeline
                    </h4>
                    <div class="timeline-container"
                         id="chrono-timeline-${Date.now()}"
                         data-timeline-config='${JSON.stringify(timelineData)}'>
                        <div class="timeline-placeholder-overlay">
                            <div class="timeline-loading-content">
                                <div class="timeline-icon-large" aria-hidden="true">&#128197;</div>
                                <p>Timeline with ${timelineData.events.length} events</p>
                                <button class="btn-load-interactive-timeline"
                                        onclick="window.loadChronologicalTimeline && window.loadChronologicalTimeline(this.closest('.timeline-container'))">
                                    <span class="btn-icon" aria-hidden="true">&#9202;</span>
                                    Load Interactive Timeline
                                </button>
                            </div>
                        </div>
                        <div class="timeline-render-target"></div>

                        <!-- Simple fallback timeline -->
                        <div class="timeline-simple-fallback">
                            ${this.renderSimpleTimeline(timelineData.events)}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Render a simple fallback timeline
         */
        renderSimpleTimeline(events) {
            if (events.length === 0) return '';

            // Find date range
            const years = events.filter(e => e.year !== undefined).map(e => e.year);
            if (years.length === 0) return '';

            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            const range = maxYear - minYear || 1;

            return `
                <div class="simple-timeline">
                    <div class="timeline-axis">
                        <span class="axis-start">${this.formatYear(minYear)}</span>
                        <div class="axis-line"></div>
                        <span class="axis-end">${this.formatYear(maxYear)}</span>
                    </div>
                    <div class="timeline-events">
                        ${events.map(event => {
                            const position = ((event.year - minYear) / range) * 100;
                            return `
                                <div class="timeline-event-marker event-${event.type}"
                                     style="left: ${position}%"
                                     title="${this.escapeAttr(event.label)}: ${this.formatYear(event.year)}">
                                    <div class="marker-dot"></div>
                                    <div class="marker-label">${this.escapeHtml(event.label)}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Prepare data for timeline visualization
         */
        prepareTimelineData(temporal) {
            const events = [];

            // First attestation
            if (temporal.firstAttestation?.date?.year !== undefined) {
                events.push({
                    type: 'attestation',
                    label: 'First Attestation',
                    year: temporal.firstAttestation.date.year,
                    description: temporal.firstAttestation.source
                });
            }

            // Historical date
            if (temporal.historicalDate?.year !== undefined) {
                events.push({
                    type: 'historical',
                    label: 'Historical Reference',
                    year: temporal.historicalDate.year,
                    description: temporal.historicalDate.display
                });
            }

            // Peak popularity
            if (temporal.peakPopularity?.start?.year !== undefined) {
                events.push({
                    type: 'peak',
                    label: 'Peak Period Start',
                    year: temporal.peakPopularity.start.year
                });
            }
            if (temporal.peakPopularity?.end?.year !== undefined) {
                events.push({
                    type: 'peak',
                    label: 'Peak Period End',
                    year: temporal.peakPopularity.end.year
                });
            }

            // Literary references
            if (temporal.literaryReferences?.length > 0) {
                temporal.literaryReferences.forEach(ref => {
                    if (ref.date?.year !== undefined) {
                        events.push({
                            type: 'literary',
                            label: ref.work || ref.title,
                            year: ref.date.year,
                            description: ref.author
                        });
                    }
                });
            }

            // Sort by year
            events.sort((a, b) => a.year - b.year);

            return {
                events,
                provider: this.timelineProvider
            };
        }

        /**
         * Format date object for display
         */
        formatDateObject(dateObj) {
            if (!dateObj) return '';

            if (typeof dateObj === 'string') {
                return this.escapeHtml(dateObj);
            }

            if (dateObj.display) {
                return this.escapeHtml(dateObj.display);
            }

            if (dateObj.year !== undefined) {
                return this.formatYear(dateObj.year, dateObj.circa);
            }

            if (dateObj.start?.display && dateObj.end?.display) {
                return `${this.escapeHtml(dateObj.start.display)} - ${this.escapeHtml(dateObj.end.display)}`;
            }

            return '';
        }

        /**
         * Format a year for display
         */
        formatYear(year, circa = false) {
            if (year === undefined || year === null) return '';

            const prefix = circa ? 'c. ' : '';
            const suffix = year < 0 ? ' BCE' : ' CE';
            return `${prefix}${Math.abs(year)}${suffix}`;
        }

        /**
         * Render confidence indicator
         */
        renderConfidenceIndicator(confidence) {
            const levels = {
                'certain': { filled: 4, color: '#10b981' },
                'probable': { filled: 3, color: '#3b82f6' },
                'possible': { filled: 2, color: '#f59e0b' },
                'speculative': { filled: 1, color: '#ef4444' }
            };

            const config = levels[confidence?.toLowerCase()] || { filled: 2, color: '#888' };

            return `
                <span class="confidence-dots" title="Confidence: ${this.escapeAttr(confidence || 'Unknown')}">
                    ${Array(4).fill(0).map((_, i) => `
                        <span class="conf-dot ${i < config.filled ? 'filled' : ''}"
                              style="${i < config.filled ? `background: ${config.color}` : ''}"></span>
                    `).join('')}
                </span>
            `;
        }

        /**
         * Get attestation type icon
         */
        getAttestationTypeIcon(type) {
            const icons = {
                'textual': '&#128220;',
                'archaeological': '&#9937;',
                'epigraphic': '&#128196;',
                'iconographic': '&#128444;',
                'numismatic': '&#129689;',
                'oral': '&#128483;',
                'literary': '&#128214;',
                'religious': '&#128722;'
            };
            return icons[type?.toLowerCase()] || '&#128203;';
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
    window.MetadataChronological = MetadataChronological;

})();
