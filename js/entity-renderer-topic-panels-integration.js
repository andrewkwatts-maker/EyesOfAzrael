/**
 * Topic Panels Integration for Firebase Entity Renderer
 * Extends the entity renderer with topic panel functionality
 * Eyes of Azrael - Mythology Knowledge Base
 */

(function() {
    'use strict';

    // Wait for FirebaseEntityRenderer to be available
    function integrateTopicPanels() {
        if (!window.FirebaseEntityRenderer) {
            console.warn('FirebaseEntityRenderer not found, retrying...');
            setTimeout(integrateTopicPanels, 100);
            return;
        }

        const renderer = window.FirebaseEntityRenderer.prototype;

        // Store original render methods
        const originalRenderDeity = renderer.renderDeity;
        const originalRenderCreature = renderer.renderCreature;
        const originalRenderGenericEntity = renderer.renderGenericEntity;

        /**
         * Enhanced deity renderer with topic panels
         */
        renderer.renderDeity = function(entity, container) {
            // Call original render
            originalRenderDeity.call(this, entity, container);

            // Add topic panels section before closing
            const panelsSection = document.createElement('div');
            panelsSection.id = 'topic-panels-section';
            container.appendChild(panelsSection);

            // Render topic panels
            this.renderTopicPanels(entity, panelsSection);
        };

        /**
         * Enhanced creature renderer with topic panels
         */
        renderer.renderCreature = function(entity, container) {
            // Call original render
            originalRenderCreature.call(this, entity, container);

            // Add topic panels section
            const panelsSection = document.createElement('div');
            panelsSection.id = 'topic-panels-section';
            container.appendChild(panelsSection);

            // Render topic panels
            this.renderTopicPanels(entity, panelsSection);
        };

        /**
         * Enhanced generic entity renderer with topic panels
         */
        renderer.renderGenericEntity = function(entity, container) {
            // Call original render
            originalRenderGenericEntity.call(this, entity, container);

            // Add topic panels section
            const panelsSection = document.createElement('div');
            panelsSection.id = 'topic-panels-section';
            container.appendChild(panelsSection);

            // Render topic panels
            this.renderTopicPanels(entity, panelsSection);
        };

        /**
         * Add topic panels rendering method
         */
        renderer.renderTopicPanels = function(entity, container) {
            // Ensure topic-panels.css is loaded
            if (!document.querySelector('link[href*="topic-panels.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/css/topic-panels.css';
                document.head.appendChild(link);
            }

            // Ensure topic-panels.js is loaded
            if (!window.TopicPanels) {
                const script = document.createElement('script');
                script.src = '/js/components/topic-panels.js';
                script.onload = () => {
                    const topicPanels = new window.TopicPanels();
                    topicPanels.render(entity, container);
                };
                document.head.appendChild(script);
            } else {
                const topicPanels = new window.TopicPanels();
                topicPanels.render(entity, container);
            }
        };

        console.log('✅ Topic Panels integration complete');
    }

    // Start integration
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', integrateTopicPanels);
    } else {
        integrateTopicPanels();
    }
})();
