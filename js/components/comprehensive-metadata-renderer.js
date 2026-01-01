/**
 * Comprehensive Metadata Renderer
 *
 * Handles rendering of ALL entity metadata fields from the schema:
 * 1. Basic: id, type, name, icon, mythologies, primaryMythology
 * 2. Descriptions: shortDescription, fullDescription
 * 3. Linguistic: originalName, meaning, alternateNames, epithets, etymology
 * 4. Geographical: coordinates, region, associatedLocations
 * 5. Temporal: dates, era, culturalPeriod, historicalContext
 * 6. Cultural: worshipPractices, festivals, cult_centers, modernLegacy, rituals
 * 7. Related: deities, heroes, creatures, places, items, concepts
 * 8. Sources: text citations with links
 * 9. Corpus queries: research queries
 * 10. Archetypes: mythological archetypes
 * 11. Colors and visual theming
 *
 * Features:
 * - Only displays sections that have data
 * - Graceful handling of missing fields
 * - Consistent styling across all entity types
 * - Proper formatting for dates, coordinates, and complex objects
 *
 * @version 2.0.0
 */

(function() {
    'use strict';

    class ComprehensiveMetadataRenderer {
        constructor(options = {}) {
            this.baseUrl = options.baseUrl || '';
            this.showEditButton = options.showEditButton || false;
            this.onEntityClick = options.onEntityClick || null;
        }

        /**
         * Main render method - generates complete HTML for an entity
         * @param {Object} entity - The entity data object
         * @returns {string} Complete HTML string
         */
        render(entity) {
            if (!entity) {
                return this.renderError('No entity data provided');
            }

            const colors = entity.colors || {};
            const primaryColor = colors.primary || '#667eea';
            const secondaryColor = colors.secondary || '#764ba2';

            let html = `
                <article class="entity-detail-container"
                         data-entity-id="${this.escapeHtml(entity.id)}"
                         data-entity-type="${this.escapeHtml(entity.type || 'unknown')}"
                         style="--entity-primary: ${primaryColor}; --entity-secondary: ${secondaryColor}; --entity-primary-rgb: ${this.hexToRgb(primaryColor)}; --entity-secondary-rgb: ${this.hexToRgb(secondaryColor)};">

                    <!-- Hero Header Section -->
                    ${this.renderHeroSection(entity)}

                    <div class="entity-detail-body">
                        <div class="entity-main-content">
                            <!-- Descriptions -->
                            ${this.renderDescriptions(entity)}

                            <!-- Linguistic Information -->
                            ${this.renderLinguistic(entity.linguistic, entity)}

                            <!-- Geographical Information -->
                            ${this.renderGeographical(entity.geographical)}

                            <!-- Temporal Information -->
                            ${this.renderTemporal(entity.temporal)}

                            <!-- Cultural Information -->
                            ${this.renderCultural(entity.cultural)}

                            <!-- Metaphysical Properties -->
                            ${this.renderMetaphysical(entity.metaphysicalProperties)}

                            <!-- Related Entities -->
                            ${this.renderRelatedEntities(entity.relatedEntities)}

                            <!-- Corpus Queries -->
                            ${this.renderCorpusQueries(entity.corpusQueries)}

                            <!-- Archetypes -->
                            ${this.renderArchetypes(entity.archetypes)}

                            <!-- Sources -->
                            ${this.renderSources(entity.sources)}
                        </div>

                        <!-- Sidebar with metadata -->
                        <aside class="entity-sidebar">
                            ${this.renderMetadataSidebar(entity)}
                        </aside>
                    </div>
                </article>
            `;

            return html;
        }

        /**
         * Render hero header section
         */
        renderHeroSection(entity) {
            const mythologies = entity.mythologies || [entity.primaryMythology || entity.mythology];
            const primaryMythology = entity.primaryMythology || entity.mythology || 'unknown';

            return `
                <header class="entity-hero-header">
                    <div class="entity-hero-background"></div>
                    <div class="entity-hero-content">
                        ${entity.icon ? `<div class="entity-icon-display ${this.isSvg(entity.icon) ? 'entity-icon-svg' : ''}">${this.renderIcon(entity.icon)}</div>` : ''}

                        <h1 class="entity-name-title">${this.escapeHtml(entity.name || entity.title || 'Unknown Entity')}</h1>

                        ${entity.linguistic?.originalName ? `
                            <div class="entity-original-name">${this.escapeHtml(entity.linguistic.originalName)}</div>
                        ` : ''}

                        <div class="entity-badge-row">
                            <span class="entity-type-badge type-${this.escapeHtml(entity.type || 'unknown')}">${this.capitalize(entity.type || 'Entity')}</span>
                            <span class="entity-mythology-badge">${this.capitalize(primaryMythology)}</span>
                            ${mythologies.length > 1 ? `
                                <span class="entity-multi-mythology">+${mythologies.length - 1} more</span>
                            ` : ''}
                        </div>

                        ${entity.shortDescription ? `
                            <p class="entity-hero-description">${this.escapeHtml(entity.shortDescription.substring(0, 250))}${entity.shortDescription.length > 250 ? '...' : ''}</p>
                        ` : ''}
                    </div>
                </header>
            `;
        }

        /**
         * Render descriptions section
         */
        renderDescriptions(entity) {
            if (!entity.fullDescription && !entity.description) return '';

            const description = entity.fullDescription || entity.description;

            return `
                <section class="entity-section entity-description-section">
                    <h2 class="section-heading">
                        <span class="section-icon">📖</span>
                        Overview
                    </h2>
                    <div class="description-content">
                        ${this.formatMarkdown(description)}
                    </div>
                </section>
            `;
        }

        /**
         * Render linguistic information
         */
        renderLinguistic(linguistic, entity) {
            // Check for any linguistic data from either linguistic object or entity root
            const hasLinguistic = linguistic && (
                linguistic.originalName ||
                linguistic.transliteration ||
                linguistic.pronunciation ||
                linguistic.etymology ||
                linguistic.alternativeNames?.length > 0
            );

            const hasAlternateNames = entity.alternateNames?.length > 0 || entity.alternativeNames?.length > 0;
            const hasEpithets = entity.epithets?.length > 0;
            const hasMeaning = entity.meaning || linguistic?.etymology?.meaning;

            if (!hasLinguistic && !hasAlternateNames && !hasEpithets && !hasMeaning) return '';

            return `
                <section class="entity-section entity-linguistic-section">
                    <h2 class="section-heading">
                        <span class="section-icon">🔤</span>
                        Linguistic Information
                    </h2>
                    <div class="linguistic-grid">
                        ${linguistic?.originalName ? `
                            <div class="linguistic-item">
                                <span class="linguistic-label">Original Name</span>
                                <span class="linguistic-value original-script">${this.escapeHtml(linguistic.originalName)}</span>
                            </div>
                        ` : ''}

                        ${linguistic?.transliteration ? `
                            <div class="linguistic-item">
                                <span class="linguistic-label">Transliteration</span>
                                <span class="linguistic-value">${this.escapeHtml(linguistic.transliteration)}</span>
                            </div>
                        ` : ''}

                        ${linguistic?.pronunciation ? `
                            <div class="linguistic-item">
                                <span class="linguistic-label">Pronunciation</span>
                                <span class="linguistic-value pronunciation">${this.escapeHtml(linguistic.pronunciation)}</span>
                            </div>
                        ` : ''}

                        ${linguistic?.languageCode ? `
                            <div class="linguistic-item">
                                <span class="linguistic-label">Language</span>
                                <span class="linguistic-value">${this.escapeHtml(linguistic.originalScript || linguistic.languageCode)}</span>
                            </div>
                        ` : ''}

                        ${hasMeaning ? `
                            <div class="linguistic-item full-width">
                                <span class="linguistic-label">Meaning</span>
                                <span class="linguistic-value">${this.escapeHtml(entity.meaning || linguistic?.etymology?.meaning)}</span>
                            </div>
                        ` : ''}
                    </div>

                    ${this.renderEtymology(linguistic?.etymology)}

                    ${hasAlternateNames ? `
                        <div class="alternate-names-section">
                            <h3 class="subsection-heading">Alternative Names</h3>
                            <div class="name-tags">
                                ${(entity.alternateNames || entity.alternativeNames || linguistic?.alternativeNames || []).map(name => {
                                    if (typeof name === 'object') {
                                        return `<span class="name-tag" title="${this.escapeHtml(name.context || name.language || '')}">${this.escapeHtml(name.name)}</span>`;
                                    }
                                    return `<span class="name-tag">${this.escapeHtml(name)}</span>`;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${hasEpithets ? `
                        <div class="epithets-section">
                            <h3 class="subsection-heading">Epithets &amp; Titles</h3>
                            <ul class="epithets-list">
                                ${entity.epithets.map(epithet => `
                                    <li class="epithet-item">${this.escapeHtml(epithet)}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </section>
            `;
        }

        /**
         * Render etymology details
         */
        renderEtymology(etymology) {
            if (!etymology) return '';

            const hasEtymology = etymology.rootLanguage || etymology.meaning || etymology.derivation || etymology.cognates?.length > 0;
            if (!hasEtymology) return '';

            return `
                <div class="etymology-section">
                    <h3 class="subsection-heading">Etymology</h3>
                    <div class="etymology-content">
                        ${etymology.rootLanguage ? `
                            <p><strong>Root Language:</strong> ${this.escapeHtml(etymology.rootLanguage)}</p>
                        ` : ''}
                        ${etymology.meaning ? `
                            <p><strong>Meaning:</strong> ${this.escapeHtml(etymology.meaning)}</p>
                        ` : ''}
                        ${etymology.derivation ? `
                            <p><strong>Derivation:</strong> ${this.escapeHtml(etymology.derivation)}</p>
                        ` : ''}
                        ${etymology.cognates?.length > 0 ? `
                            <div class="cognates-section">
                                <strong>Cognates:</strong>
                                <ul class="cognates-list">
                                    ${etymology.cognates.map(cognate => `
                                        <li><em>${this.escapeHtml(cognate.word)}</em> (${this.escapeHtml(cognate.language)})${cognate.meaning ? ` - ${this.escapeHtml(cognate.meaning)}` : ''}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render geographical information
         */
        renderGeographical(geographical) {
            if (!geographical) return '';

            const hasData = geographical.originPoint || geographical.primaryLocation ||
                           geographical.region || geographical.culturalArea ||
                           geographical.modernCountries?.length > 0 || geographical.spreadPath?.length > 0;

            if (!hasData) return '';

            return `
                <section class="entity-section entity-geographical-section">
                    <h2 class="section-heading">
                        <span class="section-icon">🌍</span>
                        Geographical Information
                    </h2>
                    <div class="geographical-content">
                        ${this.renderLocation(geographical.originPoint || geographical.primaryLocation)}

                        ${geographical.region ? `
                            <div class="geo-item">
                                <span class="geo-label">Region</span>
                                <span class="geo-value">${this.escapeHtml(geographical.region)}</span>
                            </div>
                        ` : ''}

                        ${geographical.culturalArea ? `
                            <div class="geo-item">
                                <span class="geo-label">Cultural Area</span>
                                <span class="geo-value">${this.escapeHtml(geographical.culturalArea)}</span>
                            </div>
                        ` : ''}

                        ${geographical.modernCountries?.length > 0 ? `
                            <div class="geo-item">
                                <span class="geo-label">Modern Countries</span>
                                <span class="geo-value">${geographical.modernCountries.map(c => this.escapeHtml(c)).join(', ')}</span>
                            </div>
                        ` : ''}

                        ${this.renderSpreadPath(geographical.spreadPath)}
                    </div>
                </section>
            `;
        }

        /**
         * Render a single location with coordinates
         */
        renderLocation(location) {
            if (!location) return '';

            const coords = location.coordinates;
            const hasCoords = coords && (coords.latitude !== undefined || coords.lat !== undefined);

            return `
                <div class="location-card">
                    ${location.name ? `<h3 class="location-name">${this.escapeHtml(location.name)}</h3>` : ''}
                    ${location.description ? `<p class="location-description">${this.escapeHtml(this.truncateText(location.description, 200))}</p>` : ''}
                    ${location.type ? `<span class="location-type-badge">${this.escapeHtml(location.type)}</span>` : ''}
                    ${location.significance ? `<p class="location-significance"><em>${this.escapeHtml(location.significance)}</em></p>` : ''}
                    ${hasCoords ? `
                        <div class="coordinates-display">
                            <span class="coord-icon">📍</span>
                            <span class="coord-value">${this.formatCoordinates(coords)}</span>
                            ${coords.accuracy ? `<span class="coord-accuracy">(${this.escapeHtml(coords.accuracy)})</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render spread path (for entities that spread geographically over time)
         */
        renderSpreadPath(spreadPath) {
            if (!spreadPath || spreadPath.length === 0) return '';

            return `
                <div class="spread-path-section">
                    <h3 class="subsection-heading">Geographic Spread</h3>
                    <div class="spread-timeline">
                        ${spreadPath.map((point, index) => `
                            <div class="spread-point" data-index="${index}">
                                <div class="spread-marker"></div>
                                <div class="spread-content">
                                    ${point.location?.name ? `<strong>${this.escapeHtml(point.location.name)}</strong>` : ''}
                                    ${point.date?.display ? `<span class="spread-date">${this.escapeHtml(point.date.display)}</span>` : ''}
                                    ${point.mechanism ? `<span class="spread-mechanism badge">${this.escapeHtml(point.mechanism)}</span>` : ''}
                                    ${point.strength ? `<span class="spread-strength badge">${this.escapeHtml(point.strength)}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render temporal information
         */
        renderTemporal(temporal) {
            if (!temporal) return '';

            const hasData = temporal.mythologicalDate || temporal.historicalDate ||
                           temporal.firstAttestation || temporal.peakPopularity ||
                           temporal.culturalPeriod || temporal.literaryReferences?.length > 0;

            if (!hasData) return '';

            return `
                <section class="entity-section entity-temporal-section">
                    <h2 class="section-heading">
                        <span class="section-icon">📅</span>
                        Temporal Information
                    </h2>
                    <div class="temporal-content">
                        ${temporal.mythologicalDate ? `
                            <div class="temporal-item">
                                <span class="temporal-label">Mythological Date</span>
                                <span class="temporal-value">${this.formatDateObject(temporal.mythologicalDate)}</span>
                            </div>
                        ` : ''}

                        ${temporal.historicalDate ? `
                            <div class="temporal-item">
                                <span class="temporal-label">Historical Date</span>
                                <span class="temporal-value">${this.formatDateObject(temporal.historicalDate)}</span>
                            </div>
                        ` : ''}

                        ${temporal.culturalPeriod ? `
                            <div class="temporal-item">
                                <span class="temporal-label">Cultural Period</span>
                                <span class="temporal-value">${this.escapeHtml(temporal.culturalPeriod)}</span>
                            </div>
                        ` : ''}

                        ${this.renderFirstAttestation(temporal.firstAttestation)}
                        ${this.renderPeakPopularity(temporal.peakPopularity)}
                        ${this.renderLiteraryReferences(temporal.literaryReferences)}
                    </div>
                </section>
            `;
        }

        /**
         * Render first attestation
         */
        renderFirstAttestation(attestation) {
            if (!attestation) return '';

            return `
                <div class="attestation-card">
                    <h3 class="subsection-heading">First Attestation</h3>
                    ${attestation.date?.display ? `<p><strong>Date:</strong> ${this.escapeHtml(attestation.date.display)}</p>` : ''}
                    ${attestation.source ? `<p><strong>Source:</strong> ${this.escapeHtml(attestation.source)}</p>` : ''}
                    ${attestation.type ? `<span class="attestation-type badge">${this.escapeHtml(attestation.type)}</span>` : ''}
                    ${attestation.confidence ? `<span class="attestation-confidence badge confidence-${attestation.confidence}">${this.escapeHtml(attestation.confidence)}</span>` : ''}
                    ${attestation.description ? `<p class="attestation-description">${this.escapeHtml(this.truncateText(attestation.description, 200))}</p>` : ''}
                </div>
            `;
        }

        /**
         * Render peak popularity period
         */
        renderPeakPopularity(peak) {
            if (!peak) return '';

            return `
                <div class="peak-popularity-card">
                    <h3 class="subsection-heading">Peak Popularity</h3>
                    ${peak.display ? `<p><strong>Period:</strong> ${this.escapeHtml(peak.display)}</p>` : ''}
                    ${peak.context ? `<p>${this.escapeHtml(peak.context)}</p>` : ''}
                </div>
            `;
        }

        /**
         * Render literary references
         */
        renderLiteraryReferences(references) {
            if (!references || references.length === 0) return '';

            return `
                <div class="literary-references-section">
                    <h3 class="subsection-heading">Literary References</h3>
                    <ul class="literary-references-list">
                        ${references.map(ref => `
                            <li class="literary-ref-item">
                                <strong>${this.escapeHtml(ref.work)}</strong>
                                ${ref.author ? ` by ${this.escapeHtml(ref.author)}` : ''}
                                ${ref.date?.display ? ` (${this.escapeHtml(ref.date.display)})` : ''}
                                ${ref.significance ? `<p class="ref-significance">${this.escapeHtml(ref.significance)}</p>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        /**
         * Render cultural information
         */
        renderCultural(cultural) {
            if (!cultural) return '';

            const hasData = cultural.worshipPractices?.length > 0 ||
                           cultural.festivals?.length > 0 ||
                           cultural.cultCenters?.length > 0 || cultural.cult_centers?.length > 0 ||
                           cultural.rituals?.length > 0 ||
                           cultural.socialRole ||
                           cultural.modernLegacy;

            if (!hasData) return '';

            return `
                <section class="entity-section entity-cultural-section">
                    <h2 class="section-heading">
                        <span class="section-icon">🏛️</span>
                        Cultural Context
                    </h2>
                    <div class="cultural-content">
                        ${cultural.socialRole ? `
                            <div class="cultural-item social-role">
                                <h3 class="subsection-heading">Social Role</h3>
                                <p>${this.escapeHtml(cultural.socialRole)}</p>
                            </div>
                        ` : ''}

                        ${this.renderWorshipPractices(cultural.worshipPractices)}
                        ${this.renderFestivals(cultural.festivals)}
                        ${this.renderCultCenters(cultural.cultCenters || cultural.cult_centers)}
                        ${this.renderRituals(cultural.rituals)}
                        ${this.renderModernLegacy(cultural.modernLegacy)}
                        ${this.renderDemographicAppeal(cultural.demographicAppeal)}
                    </div>
                </section>
            `;
        }

        /**
         * Render worship practices
         */
        renderWorshipPractices(practices) {
            if (!practices || practices.length === 0) return '';

            return `
                <div class="worship-practices-section">
                    <h3 class="subsection-heading">Worship Practices</h3>
                    <ul class="worship-list">
                        ${practices.map(practice => `
                            <li class="worship-item">${this.escapeHtml(practice)}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        /**
         * Render festivals
         */
        renderFestivals(festivals) {
            if (!festivals || festivals.length === 0) return '';

            return `
                <div class="festivals-section">
                    <h3 class="subsection-heading">Festivals</h3>
                    <div class="festivals-list">
                        ${festivals.map(festival => {
                            if (typeof festival === 'string') {
                                return `<div class="festival-item"><span class="festival-icon">🎉</span> ${this.escapeHtml(festival)}</div>`;
                            }
                            return `
                                <div class="festival-card">
                                    <strong>${this.escapeHtml(festival.name)}</strong>
                                    ${festival.date ? `<span class="festival-date">${this.escapeHtml(festival.date)}</span>` : ''}
                                    ${festival.description ? `<p>${this.escapeHtml(this.truncateText(festival.description, 150))}</p>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render cult centers
         */
        renderCultCenters(centers) {
            if (!centers || centers.length === 0) return '';

            return `
                <div class="cult-centers-section">
                    <h3 class="subsection-heading">Cult Centers</h3>
                    <div class="cult-centers-list">
                        ${centers.map(center => `
                            <span class="cult-center-tag"><span class="center-icon">🏛️</span> ${this.escapeHtml(center)}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render rituals
         */
        renderRituals(rituals) {
            if (!rituals || rituals.length === 0) return '';

            return `
                <div class="rituals-section">
                    <h3 class="subsection-heading">Rituals</h3>
                    <div class="rituals-list">
                        ${rituals.map(ritual => {
                            if (typeof ritual === 'string') {
                                return `<div class="ritual-item">${this.escapeHtml(ritual)}</div>`;
                            }
                            return `
                                <div class="ritual-card">
                                    <strong>${this.escapeHtml(ritual.name)}</strong>
                                    ${ritual.description ? `<p>${this.escapeHtml(this.truncateText(ritual.description, 150))}</p>` : ''}
                                    ${ritual.url ? `<a href="${this.escapeHtml(ritual.url)}" class="ritual-link">Learn more</a>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render modern legacy
         */
        renderModernLegacy(legacy) {
            if (!legacy) return '';

            if (typeof legacy === 'string') {
                return `
                    <div class="modern-legacy-section">
                        <h3 class="subsection-heading">Modern Legacy</h3>
                        <p>${this.escapeHtml(legacy)}</p>
                    </div>
                `;
            }

            const hasData = legacy.literature || legacy.philosophy || legacy.education ||
                           legacy.art || legacy.popCulture || legacy.references?.length > 0;
            if (!hasData) return '';

            return `
                <div class="modern-legacy-section">
                    <h3 class="subsection-heading">Modern Legacy</h3>
                    <div class="legacy-grid">
                        ${legacy.literature ? `
                            <div class="legacy-item">
                                <span class="legacy-label">Literature</span>
                                <span class="legacy-value">${this.escapeHtml(legacy.literature)}</span>
                            </div>
                        ` : ''}
                        ${legacy.philosophy ? `
                            <div class="legacy-item">
                                <span class="legacy-label">Philosophy</span>
                                <span class="legacy-value">${this.escapeHtml(legacy.philosophy)}</span>
                            </div>
                        ` : ''}
                        ${legacy.education ? `
                            <div class="legacy-item">
                                <span class="legacy-label">Education</span>
                                <span class="legacy-value">${this.escapeHtml(legacy.education)}</span>
                            </div>
                        ` : ''}
                        ${legacy.art ? `
                            <div class="legacy-item">
                                <span class="legacy-label">Art</span>
                                <span class="legacy-value">${this.escapeHtml(legacy.art)}</span>
                            </div>
                        ` : ''}
                        ${legacy.popCulture ? `
                            <div class="legacy-item">
                                <span class="legacy-label">Pop Culture</span>
                                <span class="legacy-value">${this.escapeHtml(legacy.popCulture)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render demographic appeal
         */
        renderDemographicAppeal(demographics) {
            if (!demographics || demographics.length === 0) return '';

            return `
                <div class="demographic-appeal-section">
                    <h3 class="subsection-heading">Demographic Appeal</h3>
                    <ul class="demographic-list">
                        ${demographics.map(demo => `
                            <li class="demographic-item">${this.escapeHtml(demo)}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        /**
         * Render metaphysical properties
         */
        renderMetaphysical(metaphysical) {
            if (!metaphysical) return '';

            const hasData = metaphysical.primaryElement || metaphysical.element ||
                           metaphysical.domains?.length > 0 || metaphysical.energyType ||
                           metaphysical.chakra || metaphysical.planet || metaphysical.zodiac?.length > 0 ||
                           metaphysical.sefirot?.length > 0;

            if (!hasData) return '';

            return `
                <section class="entity-section entity-metaphysical-section">
                    <h2 class="section-heading">
                        <span class="section-icon">✨</span>
                        Metaphysical Properties
                    </h2>
                    <div class="metaphysical-grid">
                        ${metaphysical.primaryElement || metaphysical.element ? `
                            <div class="metaphysical-item">
                                <span class="metaphysical-label">Element</span>
                                <span class="metaphysical-value element-${(metaphysical.primaryElement || metaphysical.element).toLowerCase()}">${this.capitalize(metaphysical.primaryElement || metaphysical.element)}</span>
                            </div>
                        ` : ''}

                        ${metaphysical.energyType ? `
                            <div class="metaphysical-item">
                                <span class="metaphysical-label">Energy Type</span>
                                <span class="metaphysical-value">${this.capitalize(metaphysical.energyType)}</span>
                            </div>
                        ` : ''}

                        ${metaphysical.chakra ? `
                            <div class="metaphysical-item">
                                <span class="metaphysical-label">Chakra</span>
                                <span class="metaphysical-value chakra-${metaphysical.chakra}">${this.formatChakra(metaphysical.chakra)}</span>
                            </div>
                        ` : ''}

                        ${metaphysical.planet ? `
                            <div class="metaphysical-item">
                                <span class="metaphysical-label">Planet</span>
                                <span class="metaphysical-value">${this.formatPlanet(metaphysical.planet)}</span>
                            </div>
                        ` : ''}

                        ${metaphysical.domains?.length > 0 ? `
                            <div class="metaphysical-item full-width">
                                <span class="metaphysical-label">Domains</span>
                                <div class="domain-tags">
                                    ${metaphysical.domains.map(domain => `
                                        <span class="domain-tag">${this.escapeHtml(domain)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${metaphysical.zodiac?.length > 0 ? `
                            <div class="metaphysical-item">
                                <span class="metaphysical-label">Zodiac</span>
                                <div class="zodiac-tags">
                                    ${metaphysical.zodiac.map(sign => `
                                        <span class="zodiac-tag">${this.formatZodiac(sign)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${metaphysical.sefirot?.length > 0 ? `
                            <div class="metaphysical-item">
                                <span class="metaphysical-label">Sefirot</span>
                                <div class="sefirot-tags">
                                    ${metaphysical.sefirot.map(sefirah => `
                                        <span class="sefirah-tag">${this.capitalize(sefirah)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render related entities
         */
        renderRelatedEntities(related) {
            if (!related) return '';

            const categories = [
                { key: 'deities', label: 'Related Deities', icon: '👑' },
                { key: 'heroes', label: 'Related Heroes', icon: '🦸' },
                { key: 'creatures', label: 'Related Creatures', icon: '🐉' },
                { key: 'places', label: 'Related Places', icon: '🏛️' },
                { key: 'items', label: 'Related Items', icon: '⚔️' },
                { key: 'concepts', label: 'Related Concepts', icon: '💡' },
                { key: 'archetypes', label: 'Related Archetypes', icon: '🎭' }
            ];

            const hasAnyRelated = categories.some(cat => related[cat.key]?.length > 0);
            if (!hasAnyRelated) return '';

            return `
                <section class="entity-section entity-related-section">
                    <h2 class="section-heading">
                        <span class="section-icon">🔗</span>
                        Related Entities
                    </h2>
                    <div class="related-entities-container">
                        ${categories.map(cat => this.renderRelatedCategory(related[cat.key], cat.label, cat.icon, cat.key)).join('')}
                    </div>
                </section>
            `;
        }

        /**
         * Render a category of related entities
         */
        renderRelatedCategory(entities, label, icon, type) {
            if (!entities || entities.length === 0) return '';

            return `
                <div class="related-category related-${type}">
                    <h3 class="subsection-heading">${icon} ${label}</h3>
                    <div class="related-cards-grid">
                        ${entities.map(entity => `
                            <a href="${this.getEntityUrl(entity, type)}"
                               class="related-entity-card"
                               data-entity-id="${this.escapeHtml(entity.id)}"
                               data-entity-type="${type.replace(/s$/, '')}">
                                ${entity.icon ? `<span class="related-icon ${this.isSvg(entity.icon) ? 'entity-icon-svg' : ''}">${this.renderIcon(entity.icon)}</span>` : ''}
                                <span class="related-name">${this.escapeHtml(entity.name)}</span>
                                ${entity.relationship ? `<span class="related-relationship">${this.escapeHtml(this.truncateText(entity.relationship, 50))}</span>` : ''}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render corpus queries
         */
        renderCorpusQueries(queries) {
            if (!queries || queries.length === 0) return '';

            return `
                <section class="entity-section entity-corpus-section">
                    <h2 class="section-heading">
                        <span class="section-icon">🔍</span>
                        Research Queries
                    </h2>
                    <p class="section-intro">Explore primary sources and related texts with these curated searches:</p>
                    <div class="corpus-queries-grid">
                        ${queries.map(query => `
                            <div class="corpus-query-card" data-query-id="${this.escapeHtml(query.id)}">
                                <h4 class="query-label">${this.escapeHtml(query.label)}</h4>
                                ${query.description ? `<p class="query-description">${this.escapeHtml(this.truncateText(query.description, 150))}</p>` : ''}
                                ${query.category ? `<span class="query-category badge">${this.escapeHtml(query.category)}</span>` : ''}
                                <button class="btn-run-query" onclick="window.runCorpusQuery && window.runCorpusQuery('${this.escapeHtml(query.id)}')">
                                    Run Search
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }

        /**
         * Render archetypes
         */
        renderArchetypes(archetypes) {
            if (!archetypes || archetypes.length === 0) return '';

            return `
                <section class="entity-section entity-archetypes-section">
                    <h2 class="section-heading">
                        <span class="section-icon">🎭</span>
                        Mythological Archetypes
                    </h2>
                    <div class="archetypes-grid">
                        ${archetypes.map(archetype => {
                            const archetypeName = typeof archetype === 'string' ? archetype : archetype.name;
                            const archetypeId = typeof archetype === 'string' ? archetype : archetype.id;
                            return `
                                <a href="/archetypes/${this.escapeHtml(archetypeId)}/index.html" class="archetype-card">
                                    <span class="archetype-icon">🎭</span>
                                    <span class="archetype-name">${this.capitalize(archetypeName.replace(/-/g, ' '))}</span>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </section>
            `;
        }

        /**
         * Render sources
         */
        renderSources(sources) {
            if (!sources || sources.length === 0) return '';

            return `
                <section class="entity-section entity-sources-section">
                    <h2 class="section-heading">
                        <span class="section-icon">📚</span>
                        Sources &amp; References
                    </h2>
                    <div class="sources-list">
                        ${sources.map(source => this.renderSourceItem(source)).join('')}
                    </div>
                </section>
            `;
        }

        /**
         * Render a single source item
         */
        renderSourceItem(source) {
            if (typeof source === 'string') {
                return `<div class="source-item simple">${this.escapeHtml(source)}</div>`;
            }

            return `
                <div class="source-item detailed">
                    <div class="source-header">
                        <span class="source-title">${this.escapeHtml(source.text || source.title)}</span>
                        ${source.author ? `<span class="source-author">by ${this.escapeHtml(source.author)}</span>` : ''}
                    </div>
                    ${source.passage ? `<div class="source-passage">${this.escapeHtml(this.truncateText(source.passage, 300))}</div>` : ''}
                    ${source.description ? `<p class="source-description">${this.escapeHtml(this.truncateText(source.description, 200))}</p>` : ''}
                    ${source.mythology ? `<span class="source-mythology badge">${this.capitalize(source.mythology)}</span>` : ''}
                    ${source.corpusUrl || source.url ? `
                        <a href="${this.escapeHtml(source.corpusUrl || source.url)}" class="source-link" target="_blank" rel="noopener">
                            View in Corpus
                        </a>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render metadata sidebar
         */
        renderMetadataSidebar(entity) {
            return `
                <div class="sidebar-section entity-quick-info">
                    <h3 class="sidebar-heading">Quick Info</h3>
                    <dl class="quick-info-list">
                        <dt>Type</dt>
                        <dd>${this.capitalize(entity.type || 'Unknown')}</dd>

                        <dt>Mythology</dt>
                        <dd>${this.capitalize(entity.primaryMythology || entity.mythology || 'Unknown')}</dd>

                        ${entity.mythologies?.length > 1 ? `
                            <dt>Also in</dt>
                            <dd>${entity.mythologies.filter(m => m !== entity.primaryMythology).map(m => this.capitalize(m)).join(', ')}</dd>
                        ` : ''}

                        ${entity.temporal?.culturalPeriod ? `
                            <dt>Period</dt>
                            <dd>${this.escapeHtml(entity.temporal.culturalPeriod)}</dd>
                        ` : ''}

                        ${entity.geographical?.region ? `
                            <dt>Region</dt>
                            <dd>${this.escapeHtml(entity.geographical.region)}</dd>
                        ` : ''}
                    </dl>
                </div>

                ${entity.tags?.length > 0 ? `
                    <div class="sidebar-section entity-tags-section">
                        <h3 class="sidebar-heading">Tags</h3>
                        <div class="tags-cloud">
                            ${entity.tags.map(tag => `
                                <span class="entity-tag">${this.escapeHtml(tag)}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${entity.metadata ? `
                    <div class="sidebar-section entity-metadata-section">
                        <h3 class="sidebar-heading">Metadata</h3>
                        <dl class="metadata-list">
                            ${entity.metadata.version ? `
                                <dt>Version</dt>
                                <dd>${this.escapeHtml(entity.metadata.version)}</dd>
                            ` : ''}
                            ${entity.metadata.contributor ? `
                                <dt>Contributor</dt>
                                <dd>${this.escapeHtml(entity.metadata.contributor)}</dd>
                            ` : ''}
                            ${entity.metadata.completeness !== undefined ? `
                                <dt>Completeness</dt>
                                <dd>
                                    <div class="completeness-bar" title="${entity.metadata.completeness}%">
                                        <div class="completeness-fill" style="width: ${entity.metadata.completeness}%"></div>
                                    </div>
                                    <span class="completeness-text">${entity.metadata.completeness}%</span>
                                </dd>
                            ` : ''}
                            ${entity.metadata.lastModified ? `
                                <dt>Updated</dt>
                                <dd>${this.formatDate(entity.metadata.lastModified)}</dd>
                            ` : ''}
                        </dl>
                    </div>
                ` : ''}

                ${entity.colors ? `
                    <div class="sidebar-section entity-colors-section">
                        <h3 class="sidebar-heading">Visual Theme</h3>
                        <div class="color-swatches">
                            ${entity.colors.primary ? `
                                <div class="color-swatch" style="background: ${entity.colors.primary}" title="Primary: ${entity.colors.primary}"></div>
                            ` : ''}
                            ${entity.colors.secondary ? `
                                <div class="color-swatch" style="background: ${entity.colors.secondary}" title="Secondary: ${entity.colors.secondary}"></div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            `;
        }

        // ==================== UTILITY METHODS ====================

        /**
         * Check if a string is an SVG
         * @param {string} str - String to check
         * @returns {boolean} True if the string starts with '<svg'
         */
        isSvg(str) {
            if (!str || typeof str !== 'string') return false;
            return str.trim().toLowerCase().startsWith('<svg');
        }

        /**
         * Render an icon, handling both SVG and emoji/text icons
         * @param {string} icon - The icon string (SVG or emoji/text)
         * @returns {string} Rendered icon HTML
         */
        renderIcon(icon) {
            if (!icon) return '';
            // If it's an SVG, render directly without escaping
            if (this.isSvg(icon)) {
                return icon;
            }
            // Otherwise escape as text (emoji or other characters)
            return this.escapeHtml(icon);
        }

        /**
         * Truncate text to a maximum length
         * @param {string} text - Text to truncate
         * @param {number} maxLength - Maximum length (default 100)
         * @returns {string} Truncated text with ellipsis if needed
         */
        truncateText(text, maxLength = 100) {
            if (!text || typeof text !== 'string') return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength).trim() + '...';
        }

        /**
         * Format coordinates for display
         */
        formatCoordinates(coords) {
            const lat = coords.latitude ?? coords.lat;
            const lng = coords.longitude ?? coords.lng;
            if (lat === undefined || lng === undefined) return 'Unknown';

            const latDir = lat >= 0 ? 'N' : 'S';
            const lngDir = lng >= 0 ? 'E' : 'W';
            return `${Math.abs(lat).toFixed(2)}° ${latDir}, ${Math.abs(lng).toFixed(2)}° ${lngDir}`;
        }

        /**
         * Format date object for display
         */
        formatDateObject(dateObj) {
            if (!dateObj) return '';
            if (dateObj.display) return this.escapeHtml(dateObj.display);
            if (dateObj.start?.display && dateObj.end?.display) {
                return `${this.escapeHtml(dateObj.start.display)} - ${this.escapeHtml(dateObj.end.display)}`;
            }
            if (dateObj.year) {
                const yearStr = dateObj.year < 0 ? `${Math.abs(dateObj.year)} BCE` : `${dateObj.year} CE`;
                return dateObj.circa ? `c. ${yearStr}` : yearStr;
            }
            return '';
        }

        /**
         * Format a date string or timestamp
         */
        formatDate(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (e) {
                return dateStr;
            }
        }

        /**
         * Format chakra name
         */
        formatChakra(chakra) {
            const chakraMap = {
                'root': 'Root (Muladhara)',
                'sacral': 'Sacral (Svadhisthana)',
                'solar-plexus': 'Solar Plexus (Manipura)',
                'heart': 'Heart (Anahata)',
                'throat': 'Throat (Vishuddha)',
                'third-eye': 'Third Eye (Ajna)',
                'crown': 'Crown (Sahasrara)'
            };
            return chakraMap[chakra] || this.capitalize(chakra);
        }

        /**
         * Format planet name with symbol
         */
        formatPlanet(planet) {
            const planetSymbols = {
                'sun': '☉ Sun',
                'moon': '☽ Moon',
                'mercury': '☿ Mercury',
                'venus': '♀ Venus',
                'mars': '♂ Mars',
                'jupiter': '♃ Jupiter',
                'saturn': '♄ Saturn',
                'uranus': '♅ Uranus',
                'neptune': '♆ Neptune',
                'pluto': '♇ Pluto'
            };
            return planetSymbols[planet?.toLowerCase()] || this.capitalize(planet);
        }

        /**
         * Format zodiac sign with symbol
         */
        formatZodiac(sign) {
            const zodiacSymbols = {
                'aries': '♈ Aries',
                'taurus': '♉ Taurus',
                'gemini': '♊ Gemini',
                'cancer': '♋ Cancer',
                'leo': '♌ Leo',
                'virgo': '♍ Virgo',
                'libra': '♎ Libra',
                'scorpio': '♏ Scorpio',
                'sagittarius': '♐ Sagittarius',
                'capricorn': '♑ Capricorn',
                'aquarius': '♒ Aquarius',
                'pisces': '♓ Pisces'
            };
            return zodiacSymbols[sign?.toLowerCase()] || this.capitalize(sign);
        }

        /**
         * Get entity URL
         */
        getEntityUrl(entity, type) {
            if (entity.url) return entity.url;
            const mythology = entity.mythology || 'shared';
            const entityType = type?.replace(/s$/, '') || 'entity';
            return `${this.baseUrl}/mythos/${mythology}/${entityType}s/${entity.id}.html`;
        }

        /**
         * Convert hex color to RGB string
         */
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result) {
                return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
            }
            return '102, 126, 234'; // Default
        }

        /**
         * Format markdown-like text to HTML
         */
        formatMarkdown(text) {
            if (!text) return '';

            // Split into paragraphs
            const paragraphs = text.split(/\n\n+/);

            return paragraphs.map(p => {
                // Handle headers
                if (p.startsWith('# ')) {
                    return `<h3>${this.escapeHtml(p.substring(2))}</h3>`;
                }
                if (p.startsWith('## ')) {
                    return `<h4>${this.escapeHtml(p.substring(3))}</h4>`;
                }

                // Handle lists
                if (p.startsWith('- ')) {
                    const items = p.split('\n').filter(line => line.startsWith('- '));
                    return `<ul>${items.map(item => `<li>${this.escapeHtml(item.substring(2))}</li>`).join('')}</ul>`;
                }

                // Regular paragraph
                return `<p>${this.escapeHtml(p)}</p>`;
            }).join('\n');
        }

        /**
         * Capitalize string
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
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
         * Render error message
         */
        renderError(message) {
            return `
                <div class="entity-error-container">
                    <div class="error-icon">⚠️</div>
                    <h2>Error Loading Entity</h2>
                    <p>${this.escapeHtml(message)}</p>
                </div>
            `;
        }
    }

    // Export to window
    window.ComprehensiveMetadataRenderer = ComprehensiveMetadataRenderer;

})();
