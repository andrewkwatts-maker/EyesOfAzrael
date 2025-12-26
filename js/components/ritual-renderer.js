/**
 * Ritual Renderer Component
 *
 * Dynamically loads and renders ritual/ceremony content from Firebase
 * Supports: procedures, timing, materials, participants, significance
 *
 * Usage:
 * <div data-ritual-content data-mythology="greek" data-entity="eleusinian-mysteries" data-allow-edit="true"></div>
 */

class RitualRenderer {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.cache = new Map();
    }

    /**
     * Initialize all ritual content sections on the page
     */
    init() {
        const ritualSections = document.querySelectorAll('[data-ritual-content]');
        ritualSections.forEach(section => {
            const mythology = section.dataset.mythology;
            const entityId = section.dataset.entity;
            const allowEdit = section.dataset.allowEdit === 'true';

            this.renderRitual(section, mythology, entityId, allowEdit);
        });
    }

    /**
     * Fetch ritual data from Firestore
     */
    async fetchRitual(mythology, entityId) {
        const cacheKey = `${mythology}/${entityId}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const docRef = this.db
                .collection('entities')
                .doc(mythology)
                .collection('ritual')
                .doc(entityId);

            const doc = await docRef.get();

            if (!doc.exists) {
                console.warn(`Ritual not found: ${mythology}/${entityId}`);
                return null;
            }

            const data = doc.data();
            this.cache.set(cacheKey, data);
            return data;

        } catch (error) {
            console.error('Error fetching ritual:', error);
            return null;
        }
    }

    /**
     * Render ritual content
     */
    async renderRitual(container, mythology, entityId, allowEdit = false) {
        container.innerHTML = '<div class="loading-spinner">Loading ritual data...</div>';

        const ritual = await this.fetchRitual(mythology, entityId);

        if (!ritual) {
            container.innerHTML = '<div class="error-message">Ritual data not found. Content will load from HTML.</div>';
            return;
        }

        let html = '';

        // Header section
        html += this.renderHeader(ritual);

        // Purpose/Significance
        if (ritual.purpose || ritual.significance) {
            html += this.renderPurpose(ritual.purpose || ritual.significance);
        }

        // Timing information
        if (ritual.timing) {
            html += this.renderTiming(ritual.timing);
        }

        // Procedure/Steps
        if (ritual.procedure) {
            html += this.renderProcedure(ritual.procedure);
        }

        // Participants
        if (ritual.procedure && ritual.procedure.participants && ritual.procedure.participants.length > 0) {
            html += this.renderParticipants(ritual.procedure.participants);
        }

        // Materials/Offerings
        if (ritual.procedure && ritual.procedure.materials && ritual.procedure.materials.length > 0) {
            html += this.renderMaterials(ritual.procedure.materials);
        }

        // Symbolism
        if (ritual.symbolism) {
            html += this.renderSymbolism(ritual.symbolism);
        }

        // General content sections
        if (ritual.sections && ritual.sections.length > 0) {
            html += this.renderSections(ritual.sections);
        }

        // Sources
        if (ritual.sources && ritual.sources.length > 0) {
            html += this.renderSources(ritual.sources);
        }

        // Edit button (if allowed)
        if (allowEdit) {
            html += this.renderEditButton(mythology, entityId);
        }

        container.innerHTML = html;
    }

    /**
     * Render header with title and description
     */
    renderHeader(ritual) {
        return `
            <div class="ritual-header">
                <h1>${ritual.icon || '🎭'} ${ritual.name}</h1>
                ${ritual.subtitle ? `<p class="subtitle">${ritual.subtitle}</p>` : ''}
                ${ritual.shortDescription ? `<p class="short-description">${ritual.shortDescription}</p>` : ''}
                ${ritual.ritualType ? `<span class="ritual-type-badge">${ritual.ritualType}</span>` : ''}
            </div>
        `;
    }

    /**
     * Render purpose/significance
     */
    renderPurpose(purpose) {
        let html = '<section class="ritual-purpose"><h2>🎯 Purpose & Significance</h2>';
        html += this.renderContent(purpose);
        html += '</section>';
        return html;
    }

    /**
     * Render timing information
     */
    renderTiming(timing) {
        let html = '<section class="ritual-timing"><h2>📅 Timing</h2>';

        if (timing.occasions && timing.occasions.length > 0) {
            html += '<div class="timing-card"><h3>Occasions</h3><ul>';
            timing.occasions.forEach(occasion => {
                html += `<li>${occasion}</li>`;
            });
            html += '</ul></div>';
        }

        if (timing.frequency) {
            html += `<div class="timing-card"><h3>Frequency</h3><p>${timing.frequency}</p></div>`;
        }

        if (timing.seasonalTiming) {
            html += `<div class="timing-card"><h3>Seasonal Timing</h3><p>${timing.seasonalTiming}</p></div>`;
        }

        if (timing.duration) {
            html += `<div class="timing-card"><h3>Duration</h3><p>${timing.duration}</p></div>`;
        }

        html += '</section>';
        return html;
    }

    /**
     * Render procedure/steps
     */
    renderProcedure(procedure) {
        if (!procedure.steps || procedure.steps.length === 0) {
            return '';
        }

        let html = '<section class="ritual-procedure"><h2>📋 Ritual Procedure</h2>';
        html += '<div class="procedure-steps">';

        const sortedSteps = [...procedure.steps].sort((a, b) => (a.step || 0) - (b.step || 0));

        sortedSteps.forEach((step, index) => {
            html += `
                <div class="procedure-step">
                    <div class="step-number">${step.step || index + 1}</div>
                    <div class="step-content">
                        <h3>${step.instruction || step.title || `Step ${index + 1}`}</h3>
                        ${step.details ? `<p>${step.details}</p>` : ''}
                        ${step.description ? `<p>${step.description}</p>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div></section>';
        return html;
    }

    /**
     * Render participants
     */
    renderParticipants(participants) {
        let html = '<section class="ritual-participants"><h2>👥 Participants & Roles</h2>';
        html += '<div class="participants-grid">';

        participants.forEach(participant => {
            if (typeof participant === 'string') {
                html += `<div class="participant-card"><p>${participant}</p></div>`;
            } else if (participant.role) {
                html += `
                    <div class="participant-card">
                        <h3>${participant.role}</h3>
                        ${participant.description ? `<p>${participant.description}</p>` : ''}
                    </div>
                `;
            }
        });

        html += '</div></section>';
        return html;
    }

    /**
     * Render materials/offerings
     */
    renderMaterials(materials) {
        let html = '<section class="ritual-materials"><h2>🎁 Required Materials & Offerings</h2>';
        html += '<ul class="materials-list">';

        materials.forEach(material => {
            if (typeof material === 'string') {
                html += `<li>${material}</li>`;
            } else if (material.item) {
                html += `<li><strong>${material.item}</strong>`;
                if (material.purpose) html += ` - ${material.purpose}`;
                html += `</li>`;
            }
        });

        html += '</ul></section>';
        return html;
    }

    /**
     * Render symbolism
     */
    renderSymbolism(symbolism) {
        let html = '<section class="ritual-symbolism"><h2>🔮 Symbolism</h2>';

        if (typeof symbolism === 'string') {
            html += `<p>${symbolism}</p>`;
        } else if (typeof symbolism === 'object') {
            if (symbolism.meaning) {
                html += `<div class="symbolism-card"><h3>Meaning</h3><p>${symbolism.meaning}</p></div>`;
            }
            if (symbolism.elements && symbolism.elements.length > 0) {
                html += '<div class="symbolism-card"><h3>Symbolic Elements</h3><ul>';
                symbolism.elements.forEach(elem => {
                    if (typeof elem === 'string') {
                        html += `<li>${elem}</li>`;
                    } else if (elem.element && elem.symbolism) {
                        html += `<li><strong>${elem.element}:</strong> ${elem.symbolism}</li>`;
                    }
                });
                html += '</ul></div>';
            }
        }

        html += '</section>';
        return html;
    }

    /**
     * Render general content sections
     */
    renderSections(sections) {
        let html = '';

        sections.forEach(section => {
            html += `<section class="content-section">`;
            html += `<h2>${section.title}</h2>`;
            html += this.renderContent(section.content);
            html += `</section>`;
        });

        return html;
    }

    /**
     * Render content (handles arrays and strings)
     */
    renderContent(content) {
        if (Array.isArray(content)) {
            return content.map(p => `<p>${p}</p>`).join('');
        } else if (typeof content === 'string') {
            return `<p>${content}</p>`;
        }
        return '';
    }

    /**
     * Render sources section
     */
    renderSources(sources) {
        let html = '<section class="sources-section"><h2>📚 Sources</h2><ul class="sources-list">';

        sources.forEach(source => {
            if (typeof source === 'string') {
                html += `<li>${source}</li>`;
            } else if (source.title) {
                html += `<li><strong>${source.title}</strong>`;
                if (source.author) html += ` by ${source.author}`;
                if (source.date) html += ` (${source.date})`;
                html += `</li>`;
            }
        });

        html += '</ul></section>';
        return html;
    }

    /**
     * Render edit button
     */
    renderEditButton(mythology, entityId) {
        return `
            <div class="edit-controls">
                <button class="btn-edit" onclick="window.location.href='/admin/edit-ritual.html?mythology=${mythology}&id=${entityId}'">
                    ✏️ Edit Ritual
                </button>
            </div>
        `;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const renderer = new RitualRenderer();
        renderer.init();
    });
} else {
    const renderer = new RitualRenderer();
    renderer.init();
}

// Export for use in other scripts
window.RitualRenderer = RitualRenderer;
