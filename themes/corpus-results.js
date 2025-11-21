/**
 * Corpus Results - Enhanced Multi-Term Search UI
 * Handles expand/collapse interactions for term sections and related terms
 */

(function() {
    'use strict';

    /**
     * Toggle a term results section (expand/collapse)
     */
    window.toggleSection = function(termSlug) {
        const section = document.getElementById('results-' + termSlug);
        if (!section) return;

        const content = section.querySelector('.results-content');
        const icon = section.querySelector('.expand-icon');

        if (section.classList.contains('expanded')) {
            // Collapse
            section.classList.remove('expanded');
            section.classList.add('collapsed');
            content.style.display = 'none';
            icon.textContent = '▶';
        } else {
            // Expand
            section.classList.remove('collapsed');
            section.classList.add('expanded');
            content.style.display = 'block';
            icon.textContent = '▼';
        }
    };

    /**
     * Toggle additional related terms visibility
     */
    window.toggleAdditionalTerms = function() {
        const additional = document.getElementById('additional-terms');
        const btn = document.querySelector('.expand-btn');

        if (!additional || !btn) return;

        const text = document.getElementById('expand-text');
        const icon = btn.querySelector('.expand-icon');

        if (additional.classList.contains('collapsed')) {
            // Expand
            additional.classList.remove('collapsed');
            text.textContent = 'Show fewer terms';
            icon.textContent = '▲';
        } else {
            // Collapse
            additional.classList.add('collapsed');

            // Get count from data attribute or calculate
            const count = additional.querySelectorAll('.term-tag').length;
            text.textContent = `Show ${count} more related terms`;
            icon.textContent = '▼';
        }
    };

    /**
     * Scroll to a specific term section
     */
    window.scrollToTerm = function(termSlug) {
        const section = document.getElementById('results-' + termSlug);
        if (!section) return;

        // Expand the section if collapsed
        if (section.classList.contains('collapsed')) {
            toggleSection(termSlug);
        }

        // Smooth scroll to section
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // Highlight animation
        section.style.transition = 'box-shadow 0.3s ease';
        section.style.boxShadow = '0 0 20px rgba(var(--corpus-link-color-rgb, 139, 127, 255), 0.5)';

        setTimeout(() => {
            section.style.boxShadow = '';
        }, 1500);
    };

    /**
     * Handle term tag clicks
     */
    function initTermTagHandlers() {
        document.querySelectorAll('.term-tag').forEach(tag => {
            tag.addEventListener('click', function() {
                const termSlug = this.getAttribute('data-term');
                if (termSlug) {
                    scrollToTerm(termSlug);
                }
            });
        });
    }

    /**
     * Expand/collapse all sections
     */
    window.expandAllSections = function() {
        document.querySelectorAll('.term-results.collapsed').forEach(section => {
            const termSlug = section.id.replace('results-', '');
            toggleSection(termSlug);
        });
    };

    window.collapseAllSections = function() {
        document.querySelectorAll('.term-results.expanded').forEach(section => {
            const termSlug = section.id.replace('results-', '');
            // Don't collapse primary term (first section)
            if (section !== document.querySelector('.term-results')) {
                toggleSection(termSlug);
            }
        });
    };

    /**
     * Keyboard navigation
     */
    function initKeyboardNav() {
        document.addEventListener('keydown', function(e) {
            // Alt+E: Expand all
            if (e.altKey && e.key === 'e') {
                e.preventDefault();
                expandAllSections();
            }

            // Alt+C: Collapse all
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                collapseAllSections();
            }

            // Alt+T: Toggle additional terms
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                toggleAdditionalTerms();
            }
        });
    }

    /**
     * Search within results
     */
    function initResultsSearch() {
        const searchInput = document.getElementById('results-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();

            if (!query) {
                // Show all results
                document.querySelectorAll('.result-item').forEach(item => {
                    item.style.display = '';
                });
                return;
            }

            // Filter results
            document.querySelectorAll('.result-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = '';

                    // Expand parent section if collapsed
                    const section = item.closest('.term-results');
                    if (section && section.classList.contains('collapsed')) {
                        const termSlug = section.id.replace('results-', '');
                        toggleSection(termSlug);
                    }
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    /**
     * Copy citation to clipboard
     */
    window.copyCitation = function(resultElement) {
        const textName = resultElement.querySelector('.text-name')?.textContent.trim();
        const context = resultElement.querySelector('.context-text')?.textContent.trim();
        const url = resultElement.querySelector('.corpus-source-link')?.href;

        const citation = `${textName}\n\n"${context}"\n\nSource: ${url}`;

        navigator.clipboard.writeText(citation).then(() => {
            // Show feedback
            const btn = resultElement.querySelector('.copy-citation-btn');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = '✓ Copied!';
                btn.style.background = 'var(--color-success, #28a745)';

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy citation:', err);
        });
    };

    /**
     * Track result interactions for analytics
     */
    function trackInteraction(action, data) {
        // Placeholder for analytics integration
        console.log('Corpus Interaction:', action, data);
    }

    /**
     * Handle external link clicks
     */
    function initExternalLinkTracking() {
        document.querySelectorAll('.corpus-source-link, .external-link').forEach(link => {
            link.addEventListener('click', function() {
                trackInteraction('external_link_click', {
                    url: this.href,
                    text: this.textContent
                });
            });
        });
    }

    /**
     * Initialize result counters
     */
    function updateResultCounters() {
        document.querySelectorAll('.term-results').forEach(section => {
            const count = section.querySelectorAll('.result-item').length;
            const counterEl = section.querySelector('.result-count');
            if (counterEl) {
                counterEl.textContent = `(${count} reference${count !== 1 ? 's' : ''})`;
            }
        });
    }

    /**
     * Lazy load result content
     */
    function initLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    section.classList.add('loaded');
                    observer.unobserve(section);
                }
            });
        }, {
            rootMargin: '100px'
        });

        document.querySelectorAll('.term-results').forEach(section => {
            observer.observe(section);
        });
    }

    /**
     * Initialize print styles
     */
    function initPrintMode() {
        window.addEventListener('beforeprint', function() {
            // Expand all sections before printing
            document.querySelectorAll('.term-results.collapsed').forEach(section => {
                section.classList.add('print-expanded');
                section.querySelector('.results-content').style.display = 'block';
            });
        });

        window.addEventListener('afterprint', function() {
            // Restore collapsed state after printing
            document.querySelectorAll('.term-results.print-expanded').forEach(section => {
                section.classList.remove('print-expanded');
                section.querySelector('.results-content').style.display = 'none';
            });
        });
    }

    /**
     * Initialize on DOM ready
     */
    function init() {
        // Core functionality
        initTermTagHandlers();
        initKeyboardNav();
        initResultsSearch();
        initExternalLinkTracking();

        // Enhancement features
        updateResultCounters();
        initLazyLoading();
        initPrintMode();

        // Add keyboard shortcut hint
        const hint = document.createElement('div');
        hint.className = 'keyboard-hint';
        hint.innerHTML = `
            <small style="color: var(--color-text-secondary); opacity: 0.7;">
                Keyboard shortcuts: Alt+E (expand all) | Alt+C (collapse all) | Alt+T (toggle terms)
            </small>
        `;
        hint.style.textAlign = 'center';
        hint.style.padding = 'var(--space-4)';
        hint.style.marginTop = 'var(--space-8)';

        const container = document.querySelector('.corpus-results-container');
        if (container) {
            container.appendChild(hint);
        }

        console.log('✓ Corpus Results UI initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
