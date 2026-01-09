/**
 * Metadata Display Standard Component
 *
 * A unified metadata display system for all asset types in Eyes of Azrael.
 * Uses the configuration from metadata-sections.js to render consistent
 * metadata displays across all entity types.
 *
 * Features:
 * - Standardized sections for all metadata types
 * - Consistent styling across all asset types
 * - Graceful handling of missing data
 * - Collapsible sections
 * - Print-friendly output
 * - Responsive design
 * - Accessible markup
 *
 * @version 1.0.0
 * @requires js/config/metadata-sections.js
 */

(function() {
    'use strict';

    class MetadataDisplayStandard {
        constructor(options = {}) {
            this.config = window.MetadataSections || {};
            this.options = {
                baseUrl: options.baseUrl || '',
                showEditButton: options.showEditButton || false,
                collapsibleSections: options.collapsibleSections !== false,
                showEmptySections: options.showEmptySections || false,
                compactMode: options.compactMode || false,
                printFriendly: options.printFriendly || false,
                onEntityClick: options.onEntityClick || null,
                ...options
            };
        }

        /**
         * Render complete metadata display for an entity
         * @param {Object} entity - The entity data object
         * @param {string} assetType - The type of asset (deity, creature, etc.)
         * @returns {string} Complete HTML string
         */
        render(entity, assetType = null) {
            if (!entity) {
                return this.renderError('No entity data provided');
            }

            const type = assetType || entity.type || 'deity';
            const config = this.config.getSectionsForType ? this.config.getSectionsForType(type) : { sections: {}, hiddenFields: [], specialFields: {} };
            const colors = entity.colors || this.config.getEntityColors ? this.config.getEntityColors(type) : { primary: '#667eea', secondary: '#764ba2' };

            const sections = this.renderAllSections(entity, config);

            return `
                <div class="metadata-display-standard"
                     data-entity-type="${this.escapeHtml(type)}"
                     data-entity-id="${this.escapeHtml(entity.id || '')}"
                     style="--md-primary: ${colors.primary}; --md-secondary: ${colors.secondary}; --md-glow: ${colors.glow || 'rgba(102, 126, 234, 0.3)'};">
                    ${sections}
                </div>
            `;
        }

        /**
         * Render all sections based on configuration
         */
        renderAllSections(entity, config) {
            const sections = [];
            const sectionConfig = config.sections || this.config.SECTIONS || {};

            // Sort sections by priority
            const sortedSections = Object.values(sectionConfig)
                .sort((a, b) => (a.priority || 99) - (b.priority || 99));

            for (const section of sortedSections) {
                if (this.shouldRenderSection(entity, section, config.hiddenFields)) {
                    const sectionHtml = this.renderSection(entity, section, config);
                    if (sectionHtml) {
                        sections.push(sectionHtml);
                    }
                }
            }

            return sections.join('');
        }

        /**
         * Check if a section should be rendered
         */
        shouldRenderSection(entity, section, hiddenFields = []) {
            if (!section || !section.fields) return false;

            // Check if any field in this section has data
            const hasData = section.fields.some(field => {
                if (hiddenFields.includes(field)) return false;

                // Check root level
                if (this.hasData(entity[field])) return true;

                // Check nested objects (linguistic, geographical, etc.)
                if (section.id && entity[section.id] && this.hasData(entity[section.id][field])) return true;

                return false;
            });

            return this.options.showEmptySections || hasData;
        }

        /**
         * Render a single section
         */
        renderSection(entity, section, config) {
            const sectionId = section.id;
            const icon = section.emoji || this.getIcon(sectionId);
            const isPrimary = section.isPrimary;
            const isCollapsible = this.options.collapsibleSections && section.collapsible;
            const isExpanded = section.defaultExpanded !== false;

            const content = this.renderSectionContent(entity, section, config);
            if (!content && !this.options.showEmptySections) return '';

            return `
                <section class="md-section md-section--${sectionId} ${isPrimary ? 'md-section--primary' : 'md-section--secondary'} ${isCollapsible ? 'md-section--collapsible' : ''}"
                         data-section="${sectionId}"
                         data-expanded="${isExpanded}">
                    <header class="md-section__header" ${isCollapsible ? 'role="button" tabindex="0" aria-expanded="' + isExpanded + '"' : ''}>
                        <h2 class="md-section__title">
                            <span class="md-section__icon" aria-hidden="true">${icon}</span>
                            ${this.escapeHtml(section.title)}
                        </h2>
                        ${isCollapsible ? '<span class="md-section__toggle" aria-hidden="true"></span>' : ''}
                    </header>
                    <div class="md-section__content" ${isCollapsible && !isExpanded ? 'hidden' : ''}>
                        ${content || '<p class="md-empty">No data available</p>'}
                    </div>
                </section>
            `;
        }

        /**
         * Render section content based on section type
         */
        renderSectionContent(entity, section, config) {
            const sectionId = section.id;

            // Use specialized renderers for specific sections
            switch (sectionId) {
                case 'identity':
                    return this.renderIdentitySection(entity, section, config);
                case 'classification':
                    return this.renderClassificationSection(entity, section, config);
                case 'linguistic':
                    return this.renderLinguisticSection(entity, section);
                case 'geographical':
                    return this.renderGeographicalSection(entity, section);
                case 'chronological':
                    return this.renderChronologicalSection(entity, section);
                case 'relationships':
                    return this.renderRelationshipsSection(entity, section);
                case 'attributes':
                    return this.renderAttributesSection(entity, section, config);
                case 'cultural':
                    return this.renderCulturalSection(entity, section);
                case 'metaphysical':
                    return this.renderMetaphysicalSection(entity, section);
                case 'sources':
                    return this.renderSourcesSection(entity, section);
                case 'content':
                    return this.renderContentSection(entity, section);
                case 'relatedEntities':
                    return this.renderRelatedEntitiesSection(entity, section);
                default:
                    return this.renderGenericSection(entity, section);
            }
        }

        /**
         * Render Identity Section
         */
        renderIdentitySection(entity, section, config) {
            const items = [];

            // Name and display name are handled in the hero, but we include aliases and titles
            if (this.hasData(entity.aliases)) {
                items.push(this.renderField('Aliases', entity.aliases, 'list', { style: 'tags' }));
            }
            if (this.hasData(entity.alternateNames) || this.hasData(entity.alternativeNames)) {
                const names = entity.alternateNames || entity.alternativeNames || [];
                items.push(this.renderField('Alternate Names', names, 'list', { style: 'tags' }));
            }
            if (this.hasData(entity.titles)) {
                items.push(this.renderField('Titles', entity.titles, 'list', { style: 'inline' }));
            }
            if (this.hasData(entity.epithets)) {
                items.push(this.renderField('Epithets', entity.epithets, 'list', { style: 'tags', className: 'md-epithets' }));
            }

            return items.length > 0 ? `<div class="md-grid md-grid--identity">${items.join('')}</div>` : '';
        }

        /**
         * Render Classification Section
         */
        renderClassificationSection(entity, section, config) {
            const items = [];

            if (this.hasData(entity.type)) {
                items.push(this.renderField('Type', entity.type, 'badge', { style: 'type' }));
            }
            if (this.hasData(entity.subtype)) {
                items.push(this.renderField('Subtype', entity.subtype, 'badge'));
            }
            if (this.hasData(entity.category)) {
                items.push(this.renderField('Category', entity.category, 'text'));
            }
            if (this.hasData(entity.domains)) {
                items.push(this.renderField('Domains', entity.domains, 'list', { style: 'tags', className: 'md-domains' }));
            }
            if (this.hasData(entity.aspects)) {
                items.push(this.renderField('Aspects', entity.aspects, 'list', { style: 'tags' }));
            }
            if (this.hasData(entity.archetypes)) {
                items.push(this.renderField('Archetypes', entity.archetypes, 'list', { style: 'tags', className: 'md-archetypes' }));
            }
            if (this.hasData(entity.tags)) {
                items.push(this.renderField('Tags', entity.tags, 'list', { style: 'tags', className: 'md-tags' }));
            }

            return items.length > 0 ? `<div class="md-grid md-grid--classification">${items.join('')}</div>` : '';
        }

        /**
         * Render Linguistic Section
         */
        renderLinguisticSection(entity, section) {
            const linguistic = entity.linguistic || {};
            const items = [];

            if (this.hasData(linguistic.originalName) || this.hasData(linguistic.originalScript)) {
                items.push(this.renderField('Original Name', linguistic.originalName || linguistic.originalScript, 'text', { className: 'md-original-script' }));
            }
            if (this.hasData(linguistic.transliteration)) {
                items.push(this.renderField('Transliteration', linguistic.transliteration, 'text'));
            }
            if (this.hasData(linguistic.pronunciation)) {
                items.push(this.renderField('Pronunciation', linguistic.pronunciation, 'text', { className: 'md-pronunciation' }));
            }
            if (this.hasData(entity.meaning) || this.hasData(linguistic.etymology?.meaning)) {
                items.push(this.renderField('Meaning', entity.meaning || linguistic.etymology?.meaning, 'text'));
            }

            // Etymology subsection
            if (this.hasData(linguistic.etymology)) {
                items.push(this.renderEtymology(linguistic.etymology));
            }

            // Cognates
            if (this.hasData(linguistic.cognates)) {
                items.push(this.renderCognates(linguistic.cognates));
            }

            return items.length > 0 ? `<div class="md-grid md-grid--linguistic">${items.join('')}</div>` : '';
        }

        /**
         * Render Etymology
         */
        renderEtymology(etymology) {
            if (!etymology) return '';

            const parts = [];
            if (etymology.origin || etymology.rootLanguage) {
                parts.push(`<p><strong>Root Language:</strong> ${this.escapeHtml(etymology.origin || etymology.rootLanguage)}</p>`);
            }
            if (etymology.derivation) {
                parts.push(`<p><strong>Derivation:</strong> ${this.escapeHtml(etymology.derivation)}</p>`);
            }
            if (etymology.development) {
                parts.push(`<p><strong>Development:</strong> ${this.escapeHtml(etymology.development)}</p>`);
            }
            if (etymology.historicalForms && etymology.historicalForms.length > 0) {
                parts.push(this.renderHistoricalForms(etymology.historicalForms));
            }

            return parts.length > 0 ? `
                <div class="md-field md-field--full">
                    <div class="md-etymology">
                        <h4 class="md-subsection-title">Etymology</h4>
                        ${parts.join('')}
                    </div>
                </div>
            ` : '';
        }

        /**
         * Render Historical Forms
         */
        renderHistoricalForms(forms) {
            return `
                <div class="md-historical-forms">
                    <h5>Historical Forms</h5>
                    <ul class="md-forms-list">
                        ${forms.map(form => `
                            <li class="md-form-item">
                                <span class="md-form-text">${this.escapeHtml(form.form)}</span>
                                <span class="md-form-period">${this.escapeHtml(form.period || '')} ${form.date ? `(${this.escapeHtml(form.date)})` : ''}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        /**
         * Render Cognates
         */
        renderCognates(cognates) {
            if (!cognates || cognates.length === 0) return '';

            return `
                <div class="md-field md-field--full">
                    <div class="md-cognates">
                        <h4 class="md-subsection-title">Cognates</h4>
                        <ul class="md-cognates-list">
                            ${cognates.map(cognate => `
                                <li class="md-cognate-item">
                                    <span class="md-cognate-term">${this.escapeHtml(cognate.term || cognate.word)}</span>
                                    <span class="md-cognate-lang">(${this.escapeHtml(cognate.language)})</span>
                                    ${cognate.meaning ? `<span class="md-cognate-meaning">- ${this.escapeHtml(cognate.meaning)}</span>` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }

        /**
         * Render Geographical Section
         */
        renderGeographicalSection(entity, section) {
            const geo = entity.geographical || {};
            const items = [];

            if (this.hasData(entity.origin) || this.hasData(geo.origin)) {
                items.push(this.renderField('Origin', entity.origin || geo.origin, 'text'));
            }
            if (this.hasData(geo.region)) {
                items.push(this.renderField('Region', geo.region, 'text'));
            }
            if (this.hasData(geo.culturalArea)) {
                items.push(this.renderField('Cultural Area', geo.culturalArea, 'text'));
            }
            if (this.hasData(entity.temples) || this.hasData(geo.temples)) {
                items.push(this.renderField('Temples', entity.temples || geo.temples, 'list', { style: 'location-tags' }));
            }
            if (this.hasData(entity.sacredSites) || this.hasData(geo.sacredSites)) {
                items.push(this.renderField('Sacred Sites', entity.sacredSites || geo.sacredSites, 'list', { style: 'location-tags' }));
            }
            if (this.hasData(geo.modernCountries)) {
                items.push(this.renderField('Modern Countries', geo.modernCountries, 'list', { style: 'tags' }));
            }

            // Coordinates
            if (this.hasData(geo.coordinates)) {
                items.push(this.renderCoordinates(geo.coordinates));
            }

            // Spread path
            if (this.hasData(geo.spreadPath)) {
                items.push(this.renderSpreadPath(geo.spreadPath));
            }

            return items.length > 0 ? `<div class="md-grid md-grid--geographical">${items.join('')}</div>` : '';
        }

        /**
         * Render Coordinates
         */
        renderCoordinates(coords) {
            if (!coords) return '';

            const lat = coords.latitude || coords.lat;
            const lon = coords.longitude || coords.lng || coords.lon;

            if (lat === undefined || lon === undefined) return '';

            return `
                <div class="md-field md-field--coordinates">
                    <span class="md-field__label">Coordinates</span>
                    <div class="md-coordinates">
                        <span class="md-coordinates__icon">\u{1F4CD}</span>
                        <span class="md-coordinates__value">${lat.toFixed(4)}, ${lon.toFixed(4)}</span>
                        ${coords.accuracy ? `<span class="md-coordinates__accuracy">(${this.escapeHtml(coords.accuracy)})</span>` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render Spread Path
         */
        renderSpreadPath(spreadPath) {
            if (!spreadPath || spreadPath.length === 0) return '';

            return `
                <div class="md-field md-field--full">
                    <div class="md-spread-path">
                        <h4 class="md-subsection-title">Geographic Spread</h4>
                        <div class="md-spread-timeline">
                            ${spreadPath.map((point, index) => `
                                <div class="md-spread-point" data-index="${index}">
                                    <div class="md-spread-marker"></div>
                                    <div class="md-spread-content">
                                        ${point.location?.name ? `<strong>${this.escapeHtml(point.location.name)}</strong>` : ''}
                                        ${point.date?.display ? `<span class="md-spread-date">${this.escapeHtml(point.date.display)}</span>` : ''}
                                        ${point.mechanism ? `<span class="md-badge">${this.escapeHtml(point.mechanism)}</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Render Chronological Section
         */
        renderChronologicalSection(entity, section) {
            const temporal = entity.temporal || {};
            const items = [];

            if (this.hasData(temporal.era) || this.hasData(entity.era)) {
                items.push(this.renderField('Era', temporal.era || entity.era, 'text'));
            }
            if (this.hasData(temporal.period) || this.hasData(entity.period)) {
                items.push(this.renderField('Period', temporal.period || entity.period, 'text'));
            }
            if (this.hasData(temporal.culturalPeriod)) {
                items.push(this.renderField('Cultural Period', temporal.culturalPeriod, 'text'));
            }
            if (this.hasData(temporal.mythologicalDate)) {
                items.push(this.renderField('Mythological Date', this.formatDate(temporal.mythologicalDate), 'text'));
            }
            if (this.hasData(temporal.historicalDate)) {
                items.push(this.renderField('Historical Date', this.formatDate(temporal.historicalDate), 'text'));
            }

            // First Attestation
            if (this.hasData(temporal.firstAttestation)) {
                items.push(this.renderFirstAttestation(temporal.firstAttestation));
            }

            // Peak Popularity
            if (this.hasData(temporal.peakPopularity)) {
                items.push(this.renderPeakPopularity(temporal.peakPopularity));
            }

            // Timeline (key moments)
            if (this.hasData(temporal.timelinePosition?.keyMoments)) {
                items.push(this.renderKeyMoments(temporal.timelinePosition.keyMoments));
            }

            return items.length > 0 ? `<div class="md-grid md-grid--chronological">${items.join('')}</div>` : '';
        }

        /**
         * Render First Attestation
         */
        renderFirstAttestation(attestation) {
            return `
                <div class="md-field md-field--full">
                    <div class="md-attestation">
                        <h4 class="md-subsection-title">First Attestation</h4>
                        <div class="md-attestation-content">
                            ${attestation.date?.display ? `<p><strong>Date:</strong> ${this.escapeHtml(attestation.date.display)}</p>` : ''}
                            ${attestation.source ? `<p><strong>Source:</strong> ${this.escapeHtml(attestation.source)}</p>` : ''}
                            ${attestation.type ? `<span class="md-badge md-badge--type">${this.escapeHtml(attestation.type)}</span>` : ''}
                            ${attestation.confidence ? `<span class="md-badge md-badge--confidence md-badge--${attestation.confidence}">${this.escapeHtml(attestation.confidence)}</span>` : ''}
                            ${attestation.description ? `<p class="md-attestation-desc">${this.escapeHtml(attestation.description)}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Render Peak Popularity
         */
        renderPeakPopularity(peak) {
            return `
                <div class="md-field md-field--full">
                    <div class="md-peak-popularity">
                        <h4 class="md-subsection-title">Peak Popularity</h4>
                        ${peak.display ? `<p><strong>Period:</strong> ${this.escapeHtml(peak.display)}</p>` : ''}
                        ${peak.context ? `<p>${this.escapeHtml(peak.context)}</p>` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render Key Moments
         */
        renderKeyMoments(moments) {
            if (!moments || moments.length === 0) return '';

            return `
                <div class="md-field md-field--full">
                    <div class="md-timeline">
                        <h4 class="md-subsection-title">Key Moments</h4>
                        <div class="md-timeline-items">
                            ${moments.map(moment => `
                                <div class="md-timeline-item">
                                    <div class="md-timeline-marker"></div>
                                    <div class="md-timeline-content">
                                        <span class="md-timeline-date">${this.escapeHtml(moment.date?.display || '')}</span>
                                        <strong class="md-timeline-event">${this.escapeHtml(moment.event || '')}</strong>
                                        ${moment.significance ? `<p class="md-timeline-significance">${this.escapeHtml(moment.significance)}</p>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Render Relationships Section
         */
        renderRelationshipsSection(entity, section) {
            const relationships = entity.relationships || {};
            const parentage = entity.parentage || {};
            const items = [];

            // Family relationships
            const familyTypes = ['father', 'mother', 'parents', 'children', 'siblings', 'consorts', 'spouse', 'son', 'offspring'];
            familyTypes.forEach(relType => {
                const value = relationships[relType] || parentage[relType] || entity[relType];
                if (this.hasData(value)) {
                    items.push(this.renderRelationship(this.capitalize(relType), value, relType));
                }
            });

            // Association relationships
            const assocTypes = ['allies', 'enemies', 'servants', 'worshippers', 'companions', 'rivals'];
            assocTypes.forEach(relType => {
                const value = relationships[relType] || entity[relType];
                if (this.hasData(value)) {
                    items.push(this.renderRelationship(this.capitalize(relType), value, relType));
                }
            });

            // Parentage object (special handling)
            if (this.hasData(parentage.divine) || this.hasData(parentage.mortal) || this.hasData(parentage.heritage)) {
                items.push(this.renderParentage(parentage));
            }

            return items.length > 0 ? `<div class="md-grid md-grid--relationships">${items.join('')}</div>` : '';
        }

        /**
         * Render a single relationship
         */
        renderRelationship(label, value, type) {
            const icon = this.getRelationshipIcon(type);
            const values = Array.isArray(value) ? value : [value];

            return `
                <div class="md-field md-field--relationship">
                    <span class="md-field__label">
                        <span class="md-relationship-icon">${icon}</span>
                        ${this.escapeHtml(label)}
                    </span>
                    <div class="md-relationship-values">
                        ${values.map(v => {
                            if (typeof v === 'object' && v !== null) {
                                return `<a href="${v.url || '#'}" class="md-relationship-link">${this.escapeHtml(v.name || v.id || JSON.stringify(v))}</a>`;
                            }
                            return `<span class="md-relationship-value">${this.escapeHtml(String(v))}</span>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render Parentage Object
         */
        renderParentage(parentage) {
            return `
                <div class="md-field md-field--full">
                    <div class="md-parentage">
                        <h4 class="md-subsection-title">Parentage</h4>
                        <div class="md-parentage-content">
                            ${parentage.divine ? `<p><strong>Divine:</strong> ${this.escapeHtml(parentage.divine)}</p>` : ''}
                            ${parentage.mortal ? `<p><strong>Mortal:</strong> ${this.escapeHtml(parentage.mortal)}</p>` : ''}
                            ${parentage.heritage ? `<p><strong>Heritage:</strong> ${this.escapeHtml(parentage.heritage)}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Render Attributes Section
         */
        renderAttributesSection(entity, section, config) {
            const items = [];

            if (this.hasData(entity.powers)) {
                items.push(this.renderField('Powers', entity.powers, 'list', { style: 'cards', className: 'md-powers' }));
            }
            if (this.hasData(entity.abilities)) {
                items.push(this.renderField('Abilities', entity.abilities, 'list', { style: 'cards', className: 'md-abilities' }));
            }
            if (this.hasData(entity.symbols)) {
                items.push(this.renderField('Symbols', entity.symbols, 'list', { style: 'icons' }));
            }
            if (this.hasData(entity.animals)) {
                items.push(this.renderField('Sacred Animals', entity.animals, 'list', { style: 'icons' }));
            }
            if (this.hasData(entity.plants)) {
                items.push(this.renderField('Sacred Plants', entity.plants, 'list', { style: 'icons' }));
            }
            if (this.hasData(entity.weapons)) {
                items.push(this.renderField('Weapons', entity.weapons, 'list', { style: 'cards' }));
            }
            if (this.hasData(entity.attributes)) {
                items.push(this.renderField('Attributes', entity.attributes, 'list', { style: 'tags' }));
            }

            // Special fields from config
            if (config.specialFields) {
                Object.keys(config.specialFields).forEach(fieldKey => {
                    if (this.hasData(entity[fieldKey]) && !items.some(i => i.includes(fieldKey))) {
                        const fieldConfig = config.specialFields[fieldKey];
                        items.push(this.renderField(fieldConfig.label || this.capitalize(fieldKey), entity[fieldKey], fieldConfig.type || 'list'));
                    }
                });
            }

            return items.length > 0 ? `<div class="md-grid md-grid--attributes">${items.join('')}</div>` : '';
        }

        /**
         * Render Cultural Section
         */
        renderCulturalSection(entity, section) {
            const cultural = entity.cultural || {};
            const items = [];

            if (this.hasData(entity.worshipPractices) || this.hasData(cultural.worshipPractices)) {
                items.push(this.renderField('Worship Practices', entity.worshipPractices || cultural.worshipPractices, 'list'));
            }
            if (this.hasData(entity.rituals) || this.hasData(cultural.rituals)) {
                items.push(this.renderRituals(entity.rituals || cultural.rituals));
            }
            if (this.hasData(entity.festivals) || this.hasData(cultural.festivals)) {
                items.push(this.renderFestivals(entity.festivals || cultural.festivals));
            }
            if (this.hasData(entity.cultCenters) || this.hasData(cultural.cultCenters)) {
                items.push(this.renderField('Cult Centers', entity.cultCenters || cultural.cultCenters, 'list', { style: 'location-tags' }));
            }
            if (this.hasData(cultural.socialRole)) {
                items.push(this.renderField('Social Role', cultural.socialRole, 'text'));
            }
            if (this.hasData(cultural.modernLegacy)) {
                items.push(this.renderModernLegacy(cultural.modernLegacy));
            }

            return items.length > 0 ? `<div class="md-grid md-grid--cultural">${items.join('')}</div>` : '';
        }

        /**
         * Render Rituals
         */
        renderRituals(rituals) {
            if (!rituals || rituals.length === 0) return '';

            return `
                <div class="md-field md-field--full">
                    <span class="md-field__label">Rituals</span>
                    <div class="md-rituals-grid">
                        ${rituals.map(ritual => {
                            if (typeof ritual === 'string') {
                                return `<div class="md-ritual-item">${this.escapeHtml(ritual)}</div>`;
                            }
                            return `
                                <div class="md-ritual-card">
                                    <h5 class="md-ritual-name">${this.escapeHtml(ritual.name || '')}</h5>
                                    ${ritual.description ? `<p class="md-ritual-desc">${this.escapeHtml(this.truncate(ritual.description, 150))}</p>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render Festivals
         */
        renderFestivals(festivals) {
            if (!festivals || festivals.length === 0) return '';

            return `
                <div class="md-field md-field--full">
                    <span class="md-field__label">Festivals</span>
                    <div class="md-festivals-grid">
                        ${festivals.map(festival => {
                            if (typeof festival === 'string') {
                                return `<div class="md-festival-item"><span class="md-festival-icon">\u{1F389}</span>${this.escapeHtml(festival)}</div>`;
                            }
                            return `
                                <div class="md-festival-card">
                                    <h5 class="md-festival-name">${this.escapeHtml(festival.name || '')}</h5>
                                    ${festival.date ? `<span class="md-festival-date">${this.escapeHtml(festival.date)}</span>` : ''}
                                    ${festival.description ? `<p class="md-festival-desc">${this.escapeHtml(this.truncate(festival.description, 150))}</p>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render Modern Legacy
         */
        renderModernLegacy(legacy) {
            if (typeof legacy === 'string') {
                return `
                    <div class="md-field md-field--full">
                        <span class="md-field__label">Modern Legacy</span>
                        <p>${this.escapeHtml(legacy)}</p>
                    </div>
                `;
            }

            const parts = [];
            if (legacy.literature) parts.push(`<p><strong>Literature:</strong> ${this.escapeHtml(legacy.literature)}</p>`);
            if (legacy.art) parts.push(`<p><strong>Art:</strong> ${this.escapeHtml(legacy.art)}</p>`);
            if (legacy.popCulture) parts.push(`<p><strong>Pop Culture:</strong> ${this.escapeHtml(legacy.popCulture)}</p>`);
            if (legacy.culturalImpact) parts.push(`<p><strong>Cultural Impact:</strong> ${this.escapeHtml(legacy.culturalImpact)}</p>`);

            return parts.length > 0 ? `
                <div class="md-field md-field--full">
                    <div class="md-modern-legacy">
                        <h4 class="md-subsection-title">Modern Legacy</h4>
                        ${parts.join('')}
                    </div>
                </div>
            ` : '';
        }

        /**
         * Render Metaphysical Section
         */
        renderMetaphysicalSection(entity, section) {
            const meta = entity.metaphysicalProperties || {};
            const items = [];

            const element = meta.primaryElement || meta.element || entity.element;
            if (this.hasData(element)) {
                items.push(this.renderField('Element', element, 'badge', { style: 'element', className: `md-element--${element.toLowerCase()}` }));
            }
            if (this.hasData(meta.energyType)) {
                items.push(this.renderField('Energy Type', meta.energyType, 'text'));
            }
            if (this.hasData(meta.chakra)) {
                items.push(this.renderField('Chakra', this.formatChakra(meta.chakra), 'badge', { style: 'chakra' }));
            }
            if (this.hasData(meta.planet)) {
                items.push(this.renderField('Planet', this.formatPlanet(meta.planet), 'badge', { style: 'planet' }));
            }
            if (this.hasData(meta.zodiac)) {
                items.push(this.renderField('Zodiac', meta.zodiac, 'list', { style: 'zodiac-tags' }));
            }
            if (this.hasData(meta.sefirot)) {
                items.push(this.renderField('Sefirot', meta.sefirot, 'list', { style: 'tags' }));
            }
            if (this.hasData(meta.domains)) {
                items.push(this.renderField('Domains', meta.domains, 'list', { style: 'tags' }));
            }

            return items.length > 0 ? `<div class="md-grid md-grid--metaphysical">${items.join('')}</div>` : '';
        }

        /**
         * Render Sources Section
         */
        renderSourcesSection(entity, section) {
            const items = [];

            if (this.hasData(entity.primarySources)) {
                items.push(this.renderCitations('Primary Sources', entity.primarySources));
            }
            if (this.hasData(entity.sources)) {
                items.push(this.renderCitations('Sources', entity.sources));
            }
            if (this.hasData(entity.bibliography)) {
                items.push(this.renderBibliography(entity.bibliography));
            }

            // Mythology contexts with text references
            if (this.hasData(entity.mythologyContexts)) {
                entity.mythologyContexts.forEach(context => {
                    if (context.textReferences && context.textReferences.length > 0) {
                        items.push(this.renderTextReferences(context.textReferences, context.mythology));
                    }
                });
            }

            return items.length > 0 ? `<div class="md-grid md-grid--sources">${items.join('')}</div>` : '';
        }

        /**
         * Render Citations
         */
        renderCitations(label, citations) {
            if (!citations || citations.length === 0) return '';

            return `
                <div class="md-field md-field--full">
                    <span class="md-field__label">${this.escapeHtml(label)}</span>
                    <ul class="md-citations-list">
                        ${citations.map(cite => {
                            if (typeof cite === 'string') {
                                return `<li class="md-citation-item">${this.escapeHtml(cite)}</li>`;
                            }
                            return `
                                <li class="md-citation-item">
                                    ${cite.author ? `<span class="md-cite-author">${this.escapeHtml(cite.author)}</span>` : ''}
                                    ${cite.text || cite.title ? `<em class="md-cite-title">${this.escapeHtml(cite.text || cite.title)}</em>` : ''}
                                    ${cite.passage ? `<span class="md-cite-passage">(${this.escapeHtml(cite.passage)})</span>` : ''}
                                    ${cite.corpusUrl ? `<a href="${this.escapeHtml(cite.corpusUrl)}" class="md-cite-link" target="_blank">Search Corpus</a>` : ''}
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
            `;
        }

        /**
         * Render Bibliography
         */
        renderBibliography(bibliography) {
            if (!bibliography || bibliography.length === 0) return '';

            return `
                <div class="md-field md-field--full">
                    <span class="md-field__label">Bibliography</span>
                    <ul class="md-bibliography-list">
                        ${bibliography.map(item => `<li class="md-bib-item">${this.escapeHtml(item)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        /**
         * Render Text References
         */
        renderTextReferences(references, mythology) {
            return `
                <div class="md-field md-field--full">
                    <span class="md-field__label">Text References ${mythology ? `(${this.capitalize(mythology)})` : ''}</span>
                    <ul class="md-text-refs-list">
                        ${references.map(ref => `
                            <li class="md-text-ref-item">
                                <strong>${this.escapeHtml(ref.text)}</strong>
                                ${ref.passage ? `<span class="md-ref-passage">(${this.escapeHtml(ref.passage)})</span>` : ''}
                                ${ref.context ? `<p class="md-ref-context">${this.escapeHtml(ref.context)}</p>` : ''}
                                ${ref.corpusUrl ? `<a href="${this.escapeHtml(ref.corpusUrl)}" class="md-ref-link">View in Corpus</a>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        /**
         * Render Content Section
         */
        renderContentSection(entity, section) {
            const items = [];

            const description = entity.longDescription || entity.fullDescription || entity.description;
            if (this.hasData(description)) {
                items.push(`
                    <div class="md-field md-field--full md-description">
                        <div class="md-description-content">
                            ${this.formatText(description)}
                        </div>
                    </div>
                `);
            }

            if (this.hasData(entity.symbolism)) {
                items.push(`
                    <div class="md-field md-field--full">
                        <h4 class="md-subsection-title">Symbolism</h4>
                        <div class="md-symbolism-content">
                            ${this.formatText(entity.symbolism)}
                        </div>
                    </div>
                `);
            }

            if (this.hasData(entity.significance)) {
                items.push(`
                    <div class="md-field md-field--full">
                        <h4 class="md-subsection-title">Significance</h4>
                        <p>${this.escapeHtml(entity.significance)}</p>
                    </div>
                `);
            }

            // Extended content sections
            if (this.hasData(entity.extendedContent)) {
                items.push(this.renderExtendedContent(entity.extendedContent));
            }

            return items.length > 0 ? `<div class="md-grid md-grid--content">${items.join('')}</div>` : '';
        }

        /**
         * Render Extended Content
         */
        renderExtendedContent(content) {
            if (Array.isArray(content)) {
                return content.map(section => `
                    <div class="md-field md-field--full md-extended-section">
                        ${section.title ? `<h4 class="md-subsection-title">${this.escapeHtml(section.title)}</h4>` : ''}
                        <div class="md-extended-content">${this.formatText(section.content || '')}</div>
                    </div>
                `).join('');
            }

            if (typeof content === 'object') {
                const parts = [];
                if (content.overview) parts.push(`<p>${this.formatText(content.overview)}</p>`);
                if (content.description) parts.push(`<p>${this.formatText(content.description)}</p>`);
                if (content.fullDescription) parts.push(`<div>${this.formatText(content.fullDescription)}</div>`);

                return parts.length > 0 ? `
                    <div class="md-field md-field--full md-extended-content">
                        ${parts.join('')}
                    </div>
                ` : '';
            }

            return '';
        }

        /**
         * Render Related Entities Section
         */
        renderRelatedEntitiesSection(entity, section) {
            const related = entity.relatedEntities || {};
            if (!this.hasData(related)) return '';

            const categories = section.categories || this.config.SECTIONS?.relatedEntities?.categories || [
                { key: 'deities', label: 'Related Deities', icon: '\u{1F451}' },
                { key: 'heroes', label: 'Related Heroes', icon: '\u2694\uFE0F' },
                { key: 'creatures', label: 'Related Creatures', icon: '\u{1F409}' },
                { key: 'places', label: 'Related Places', icon: '\u{1F3DB}\uFE0F' },
                { key: 'items', label: 'Related Items', icon: '\u2728' },
                { key: 'concepts', label: 'Related Concepts', icon: '\u{1F4A1}' }
            ];

            const groups = categories
                .filter(cat => this.hasData(related[cat.key]))
                .map(cat => this.renderRelatedEntityGroup(cat, related[cat.key]));

            return groups.length > 0 ? `<div class="md-related-entities">${groups.join('')}</div>` : '';
        }

        /**
         * Render Related Entity Group
         */
        renderRelatedEntityGroup(category, entities) {
            if (!entities || entities.length === 0) return '';

            return `
                <div class="md-related-group" data-category="${category.key}">
                    <h4 class="md-related-group-title">
                        <span class="md-related-icon">${category.icon}</span>
                        ${this.escapeHtml(category.label)}
                    </h4>
                    <div class="md-related-entities-list">
                        ${entities.map(entity => this.renderRelatedEntity(entity, category.key)).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render Related Entity
         */
        renderRelatedEntity(entity, type) {
            if (typeof entity === 'string') {
                return `<span class="md-related-entity md-related-entity--simple">${this.escapeHtml(entity)}</span>`;
            }

            const icon = entity.icon || this.getIcon(type) || '\u{1F517}';
            const url = entity.url || `#/${type}/${entity.id}`;

            return `
                <a href="${this.escapeHtml(url)}" class="md-related-entity-card" data-entity-id="${this.escapeHtml(entity.id || '')}" data-entity-type="${this.escapeHtml(entity.type || type)}">
                    <span class="md-entity-icon">${icon}</span>
                    <span class="md-entity-name">${this.escapeHtml(entity.name || entity.id || '')}</span>
                    ${entity.mythology ? `<span class="md-entity-mythology">${this.escapeHtml(this.capitalize(entity.mythology))}</span>` : ''}
                </a>
            `;
        }

        /**
         * Render Generic Section (fallback)
         */
        renderGenericSection(entity, section) {
            const items = [];

            section.fields.forEach(field => {
                const value = entity[field] || (entity[section.id] && entity[section.id][field]);
                if (this.hasData(value)) {
                    const fieldConfig = section.fieldConfig?.[field] || {};
                    const fieldType = fieldConfig.type || (Array.isArray(value) ? 'list' : 'text');
                    items.push(this.renderField(fieldConfig.label || this.capitalize(field), value, fieldType, fieldConfig));
                }
            });

            return items.length > 0 ? `<div class="md-grid">${items.join('')}</div>` : '';
        }

        /**
         * Render a generic field
         */
        renderField(label, value, type = 'text', options = {}) {
            const className = options.className || '';
            const style = options.style || '';

            let content = '';

            switch (type) {
                case 'text':
                    content = `<span class="md-field__value">${this.escapeHtml(String(value))}</span>`;
                    break;
                case 'badge':
                    content = `<span class="md-badge md-badge--${style}">${this.escapeHtml(String(value))}</span>`;
                    break;
                case 'list':
                    content = this.renderList(value, style);
                    break;
                case 'entityList':
                    content = this.renderEntityList(value);
                    break;
                default:
                    content = `<span class="md-field__value">${this.escapeHtml(String(value))}</span>`;
            }

            return `
                <div class="md-field ${className}">
                    <span class="md-field__label">${this.escapeHtml(label)}</span>
                    ${content}
                </div>
            `;
        }

        /**
         * Render a list
         */
        renderList(items, style = 'bullet') {
            if (!items || items.length === 0) return '';

            const values = Array.isArray(items) ? items : [items];

            switch (style) {
                case 'tags':
                    return `<div class="md-tags">${values.map(v => `<span class="md-tag">${this.escapeHtml(String(v))}</span>`).join('')}</div>`;
                case 'inline':
                    return `<span class="md-inline-list">${values.map(v => this.escapeHtml(String(v))).join(', ')}</span>`;
                case 'cards':
                    return `<div class="md-cards-list">${values.map(v => `<div class="md-card-item">${this.escapeHtml(String(v))}</div>`).join('')}</div>`;
                case 'icons':
                    return `<div class="md-icon-list">${values.map(v => `<span class="md-icon-item">${this.escapeHtml(String(v))}</span>`).join('')}</div>`;
                case 'location-tags':
                    return `<div class="md-location-tags">${values.map(v => `<span class="md-location-tag"><span class="md-loc-icon">\u{1F4CD}</span>${this.escapeHtml(String(v))}</span>`).join('')}</div>`;
                case 'zodiac-tags':
                    return `<div class="md-zodiac-tags">${values.map(v => `<span class="md-zodiac-tag">${this.formatZodiac(v)}</span>`).join('')}</div>`;
                default:
                    return `<ul class="md-list">${values.map(v => `<li>${this.escapeHtml(String(v))}</li>`).join('')}</ul>`;
            }
        }

        /**
         * Render Entity List
         */
        renderEntityList(entities) {
            if (!entities || entities.length === 0) return '';

            return `
                <div class="md-entity-list">
                    ${entities.map(entity => {
                        if (typeof entity === 'string') {
                            return `<span class="md-entity-item">${this.escapeHtml(entity)}</span>`;
                        }
                        return `<a href="${entity.url || '#'}" class="md-entity-link">${this.escapeHtml(entity.name || entity.id)}</a>`;
                    }).join('')}
                </div>
            `;
        }

        // ==================== UTILITY METHODS ====================

        /**
         * Check if value has data
         */
        hasData(value) {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object') return Object.keys(value).length > 0;
            return true;
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
        truncate(text, maxLength = 150) {
            if (!text || text.length <= maxLength) return text || '';
            return text.substring(0, maxLength).trim() + '...';
        }

        /**
         * Format text with basic HTML
         */
        formatText(text) {
            if (!text) return '';
            // Basic paragraph formatting
            const escaped = this.escapeHtml(text);
            return escaped.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
        }

        /**
         * Format date object
         */
        formatDate(dateObj) {
            if (!dateObj) return '';
            if (typeof dateObj === 'string') return dateObj;
            if (dateObj.display) return dateObj.display;
            if (dateObj.year) {
                const circa = dateObj.circa ? 'c. ' : '';
                const bce = dateObj.year < 0 ? ' BCE' : '';
                return `${circa}${Math.abs(dateObj.year)}${bce}`;
            }
            return '';
        }

        /**
         * Format chakra
         */
        formatChakra(chakra) {
            const chakraNames = {
                root: 'Root (Muladhara)',
                sacral: 'Sacral (Svadhisthana)',
                solar: 'Solar Plexus (Manipura)',
                heart: 'Heart (Anahata)',
                throat: 'Throat (Vishuddha)',
                third_eye: 'Third Eye (Ajna)',
                crown: 'Crown (Sahasrara)'
            };
            return chakraNames[chakra?.toLowerCase()] || this.capitalize(chakra);
        }

        /**
         * Format planet
         */
        formatPlanet(planet) {
            const planetIcons = {
                sun: '\u2600\uFE0F Sun',
                moon: '\u{1F319} Moon',
                mercury: '\u263F Mercury',
                venus: '\u2640\uFE0F Venus',
                mars: '\u2642\uFE0F Mars',
                jupiter: '\u2643 Jupiter',
                saturn: '\u2644 Saturn',
                uranus: '\u26E2 Uranus',
                neptune: '\u2646 Neptune',
                pluto: '\u2647 Pluto'
            };
            return planetIcons[planet?.toLowerCase()] || this.capitalize(planet);
        }

        /**
         * Format zodiac
         */
        formatZodiac(sign) {
            const zodiacIcons = {
                aries: '\u2648 Aries',
                taurus: '\u2649 Taurus',
                gemini: '\u264A Gemini',
                cancer: '\u264B Cancer',
                leo: '\u264C Leo',
                virgo: '\u264D Virgo',
                libra: '\u264E Libra',
                scorpio: '\u264F Scorpio',
                sagittarius: '\u2650 Sagittarius',
                capricorn: '\u2651 Capricorn',
                aquarius: '\u2652 Aquarius',
                pisces: '\u2653 Pisces'
            };
            return zodiacIcons[sign?.toLowerCase()] || this.capitalize(sign);
        }

        /**
         * Get icon for a key
         */
        getIcon(key) {
            if (this.config.ICONS && this.config.ICONS[key]) {
                return this.config.ICONS[key];
            }
            return '\u{1F4CB}'; // clipboard
        }

        /**
         * Get relationship icon
         */
        getRelationshipIcon(type) {
            const icons = {
                father: '\u{1F468}',
                mother: '\u{1F469}',
                parents: '\u{1F46A}',
                children: '\u{1F476}',
                siblings: '\u{1F46C}',
                consorts: '\u{1F48D}',
                spouse: '\u{1F48D}',
                son: '\u{1F466}',
                offspring: '\u{1F476}',
                allies: '\u{1F91D}',
                enemies: '\u2694\uFE0F',
                servants: '\u{1F64F}',
                worshippers: '\u{1F64F}',
                companions: '\u{1F465}',
                rivals: '\u2694\uFE0F'
            };
            return icons[type] || '\u{1F517}';
        }

        /**
         * Render error message
         */
        renderError(message) {
            return `
                <div class="md-error">
                    <span class="md-error__icon">\u26A0\uFE0F</span>
                    <span class="md-error__message">${this.escapeHtml(message)}</span>
                </div>
            `;
        }

        /**
         * Initialize collapsible sections
         */
        initCollapsible(container) {
            const headers = container.querySelectorAll('.md-section--collapsible .md-section__header');

            headers.forEach(header => {
                header.addEventListener('click', () => this.toggleSection(header));
                header.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleSection(header);
                    }
                });
            });
        }

        /**
         * Toggle section
         */
        toggleSection(header) {
            const section = header.closest('.md-section');
            const content = section.querySelector('.md-section__content');
            const isExpanded = section.dataset.expanded === 'true';

            section.dataset.expanded = !isExpanded;
            header.setAttribute('aria-expanded', !isExpanded);
            content.hidden = isExpanded;
        }
    }

    // Export to window
    window.MetadataDisplayStandard = MetadataDisplayStandard;

    // Also export as module if supported
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MetadataDisplayStandard;
    }

})();
