/**
 * Corpus Search Loader
 *
 * Dynamically loads the corpus search components if not already loaded.
 * This provides a fallback loading mechanism.
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    // Scripts to load
    const scripts = [
        'js/corpus-query-templates.js',
        'js/components/asset-corpus-search.js',
        'js/components/corpus-search-integration.js'
    ];

    /**
     * Load a script dynamically
     * @param {string} src - Script source
     * @returns {Promise<void>}
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Load all corpus search scripts
     */
    async function loadCorpusSearchScripts() {
        // Check if components already exist
        if (typeof CorpusQueryTemplates !== 'undefined' &&
            typeof AssetCorpusSearch !== 'undefined' &&
            typeof CorpusSearchIntegration !== 'undefined') {
            console.log('[CorpusSearchLoader] Components already loaded');
            return;
        }

        console.log('[CorpusSearchLoader] Loading corpus search components...');

        try {
            // Load scripts sequentially to maintain dependencies
            for (const src of scripts) {
                await loadScript(src);
            }
            console.log('[CorpusSearchLoader] All components loaded successfully');
        } catch (error) {
            console.error('[CorpusSearchLoader] Error loading components:', error);
        }
    }

    // Load when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCorpusSearchScripts);
    } else {
        loadCorpusSearchScripts();
    }
})();
