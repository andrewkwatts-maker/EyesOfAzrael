/**
 * Domain Icon Extension for Firebase Entity Renderer
 *
 * Extends FirebaseEntityRenderer to use domain-specific icons for deities.
 * This file should be loaded AFTER entity-renderer-firebase.js and deity-domain-icons.js
 */

(function() {
    'use strict';

    // Wait for dependencies to load
    if (!window.FirebaseEntityRenderer) {
        console.error('FirebaseEntityRenderer not found. Load entity-renderer-firebase.js first.');
        return;
    }

    if (!window.deityDomainIcons) {
        console.error('DeityDomainIcons not found. Load deity-domain-icons.js first.');
        return;
    }

    // Store original methods
    const originalRenderDeity = FirebaseEntityRenderer.prototype.renderDeity;
    const originalGetDefaultIcon = FirebaseEntityRenderer.prototype.getDefaultIcon;

    /**
     * Enhanced renderDeity that uses domain icons
     */
    FirebaseEntityRenderer.prototype.renderDeity = async function(entity, container) {
        // Get domain icon for deity if available
        if (window.deityDomainIcons && (!entity.visual?.icon && !entity.icon)) {
            const domainIcon = await window.deityDomainIcons.getDeityIcon(entity);
            if (domainIcon && domainIcon !== '⚡') {
                // Temporarily set icon for rendering
                if (!entity.visual) entity.visual = {};
                entity.visual.icon = domainIcon;
            }
        }

        // Call original render method
        return originalRenderDeity.call(this, entity, container);
    };

    /**
     * Enhanced renderDeityAttributes that shows domain icons
     */
    const originalRenderDeityAttributes = FirebaseEntityRenderer.prototype.renderDeityAttributes;
    FirebaseEntityRenderer.prototype.renderDeityAttributes = function(entity) {
        const attributes = [];

        // Titles
        if (entity.titles?.length || entity.epithets?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Titles</div>
                    <div class="attribute-value">${(entity.titles || entity.epithets || []).join(', ')}</div>
                </div>
            `);
        }

        // Domains with icons
        if (entity.domains?.length && window.deityDomainIcons) {
            // Render domains with icons asynchronously
            const domainContainer = document.createElement('div');
            domainContainer.className = 'subsection-card';
            domainContainer.innerHTML = `
                <div class="attribute-label">Domains</div>
                <div class="attribute-value domains-with-icons" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${entity.domains.map(domain => `<span class="domain-loading">${this.escapeHtml(domain)}</span>`).join('')}
                </div>
            `;

            // Load icons asynchronously
            window.deityDomainIcons.renderDomainIcons(entity.domains).then(html => {
                const valueContainer = domainContainer.querySelector('.attribute-value');
                if (valueContainer) {
                    valueContainer.innerHTML = html;
                }
            });

            // Add to attributes (will be rendered immediately, then updated)
            attributes.push(domainContainer.outerHTML);
        } else if (entity.domains?.length) {
            // Fallback without icons
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Domains</div>
                    <div class="attribute-value">${entity.domains.join(', ')}</div>
                </div>
            `);
        }

        // Symbols
        if (entity.symbols?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Symbols</div>
                    <div class="attribute-value">${entity.symbols.join(', ')}</div>
                </div>
            `);
        }

        // Sacred Animals
        if (entity.sacredAnimals?.length || entity.animals?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Sacred Animals</div>
                    <div class="attribute-value">${(entity.sacredAnimals || entity.animals || []).join(', ')}</div>
                </div>
            `);
        }

        // Sacred Plants
        if (entity.sacredPlants?.length || entity.plants?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Sacred Plants</div>
                    <div class="attribute-value">${(entity.sacredPlants || entity.plants || []).join(', ')}</div>
                </div>
            `);
        }

        // Festivals
        if (entity.festivals?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Festivals</div>
                    <div class="attribute-value">${entity.festivals.join(', ')}</div>
                </div>
            `);
        }

        return attributes.join('');
    };

    console.log('Domain icon extension loaded for FirebaseEntityRenderer');
})();
