/**
 * Entity Page Dynamic Loader
 * Loads entity data from Firebase and enhances the page with dynamic content
 * Preserves existing static content as fallback
 */

(function() {
    'use strict';

    // Wait for DOM and Firebase to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Check if this is an entity page
        const isEntityPage = document.querySelector('[data-entity-page="true"]') ||
                            document.querySelector('meta[name="entity-type"]');

        if (!isEntityPage) {
            return; // Not an entity page, exit
        }

        // Wait for Firebase to be ready
        waitForFirebase().then(() => {
            loadEntityData();
        }).catch(error => {
            console.warn('Firebase not available, using static content:', error);
            // Keep static content, no need to do anything
        });
    }

    function waitForFirebase(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            function check() {
                if (window.firebaseDb) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Firebase initialization timeout'));
                } else {
                    setTimeout(check, 100);
                }
            }

            check();
        });
    }

    function getEntityMetadata() {
        // Try to get from meta tags
        const mythologyMeta = document.querySelector('meta[name="mythology"]');
        const typeMeta = document.querySelector('meta[name="entity-type"]');
        const idMeta = document.querySelector('meta[name="entity-id"]');

        if (mythologyMeta && typeMeta && idMeta) {
            return {
                mythology: mythologyMeta.content,
                type: typeMeta.content,
                id: idMeta.content,
                collection: typeMeta.content + 's' // deities, heroes, etc.
            };
        }

        // Try to get from data attributes
        const main = document.querySelector('main[data-entity-page="true"]');
        if (main) {
            return {
                mythology: main.dataset.mythology,
                type: main.dataset.entityType,
                id: main.dataset.entityId,
                collection: main.dataset.entityType + 's'
            };
        }

        return null;
    }

    async function loadEntityData() {
        const metadata = getEntityMetadata();

        if (!metadata) {
            console.warn('Could not extract entity metadata from page');
            return;
        }

        console.log('Loading entity data:', metadata);

        try {
            // Try to load from Firebase
            const db = window.firebaseDb;

            // Build document path: {collection}/{mythology}_{id}
            const docId = `${metadata.mythology}_${metadata.id}`;
            const docRef = db.collection(metadata.collection).doc(docId);

            const doc = await docRef.get();

            if (doc.exists) {
                const entityData = doc.data();
                console.log('✅ Entity loaded from Firebase:', entityData);

                // Enhance page with Firebase data
                enhancePageWithData(entityData, metadata);

                // Add "Powered by Firebase" indicator
                addFirebaseIndicator();

            } else {
                console.log('Entity not found in Firebase, using static content');
                // Keep existing static content
            }

        } catch (error) {
            console.error('Error loading entity from Firebase:', error);
            // Keep existing static content on error
        }
    }

    function enhancePageWithData(data, metadata) {
        // Update page title if available
        if (data.name) {
            const h1 = document.querySelector('h1');
            if (h1 && data.icon) {
                h1.innerHTML = `${data.icon} ${data.name}`;
            }
        }

        // Update hero section subtitle
        if (data.subtitle || data.title) {
            const subtitle = document.querySelector('.hero-section .subtitle');
            if (subtitle) {
                subtitle.textContent = data.subtitle || data.title;
            }
        }

        // Update description if available
        if (data.description) {
            const heroSection = document.querySelector('.hero-section p:not(.subtitle)');
            if (heroSection) {
                heroSection.textContent = data.description;
            }
        }

        // Populate attribute grids with dynamic data
        populateAttributeGrids(data);

        // Add dynamic relationship links if available
        if (data.related || data.relationships) {
            enhanceRelationships(data.related || data.relationships);
        }

        // Add tags/categories if available
        if (data.tags) {
            addDynamicTags(data.tags);
        }
    }

    function populateAttributeGrids(data) {
        // Find attribute grids with data-attribute-grid attribute
        const grids = document.querySelectorAll('[data-attribute-grid]');

        grids.forEach(grid => {
            // Check if it's waiting for Firebase data
            const placeholder = grid.querySelector('.loading-placeholder');
            if (!placeholder) {
                return; // Already has content
            }

            // Build attribute cards from data
            const attributes = extractAttributes(data);

            if (attributes.length > 0) {
                grid.innerHTML = '';

                attributes.forEach(attr => {
                    const card = createAttributeCard(attr.label, attr.value);
                    grid.appendChild(card);
                });
            } else {
                placeholder.textContent = 'No additional attributes available';
            }
        });
    }

    function extractAttributes(data) {
        const attributes = [];
        const excludedKeys = ['id', 'name', 'type', 'mythology', 'description', 'icon',
                             'subtitle', 'title', 'related', 'relationships', 'tags',
                             'createdAt', 'updatedAt', 'userId', 'userName'];

        // Extract key-value pairs that make sense as attributes
        for (const [key, value] of Object.entries(data)) {
            if (excludedKeys.includes(key)) continue;
            if (value === null || value === undefined || value === '') continue;

            // Format the label (capitalize, add spaces)
            const label = key.replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim();

            // Format the value
            let formattedValue = value;
            if (Array.isArray(value)) {
                formattedValue = value.join(', ');
            } else if (typeof value === 'object') {
                formattedValue = JSON.stringify(value);
            }

            if (formattedValue) {
                attributes.push({ label, value: formattedValue });
            }
        }

        return attributes;
    }

    function createAttributeCard(label, value) {
        const card = document.createElement('div');
        card.className = 'subsection-card';

        card.innerHTML = `
            <div class="attribute-label">${label}</div>
            <div class="attribute-value">${value}</div>
        `;

        return card;
    }

    function enhanceRelationships(relationships) {
        // This would populate relationship sections
        // Implementation depends on your data structure
        console.log('Relationships:', relationships);
    }

    function addDynamicTags(tags) {
        // Find a place to add tags if not already present
        const main = document.querySelector('main');
        if (!main) return;

        // Check if tags section already exists
        if (document.querySelector('.entity-tags')) return;

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'entity-tags';
        tagsContainer.style.cssText = 'margin-top: 2rem; display: flex; flex-wrap: wrap; gap: 0.5rem;';

        tags.forEach(tag => {
            const tagBadge = document.createElement('span');
            tagBadge.className = 'tag-badge';
            tagBadge.textContent = tag;
            tagBadge.style.cssText = `
                background: var(--color-primary, #9370DB);
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 1rem;
                font-size: 0.85rem;
                font-weight: 500;
            `;
            tagsContainer.appendChild(tagBadge);
        });

        // Insert before footer or at end of main
        const footer = document.querySelector('footer');
        if (footer) {
            footer.parentNode.insertBefore(tagsContainer, footer);
        } else {
            main.appendChild(tagsContainer);
        }
    }

    function addFirebaseIndicator() {
        // Add subtle indicator that content is enhanced by Firebase
        const indicator = document.createElement('div');
        indicator.className = 'firebase-indicator';
        indicator.innerHTML = '⚡ Enhanced with live data';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(147, 112, 219, 0.9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            font-size: 0.75rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            opacity: 0;
            animation: fadeInOut 3s ease-in-out;
        `;

        // Add fade animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0%, 100% { opacity: 0; }
                10%, 90% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(indicator);

        // Remove after animation
        setTimeout(() => {
            indicator.remove();
        }, 3000);
    }

})();
