/**
 * Smart Links - Dropdown Hyperlink System
 * Provides contextual navigation with corpus search integration
 */

(function() {
    'use strict';

    // Corpus search configurations by mythos
    const CORPUS_CONFIG = {
        greek: {
            name: 'Ancient Greek',
            icon: '🏛️',
            lang: 'Greek',
            path: '/mythos/greek/corpus-search.html',
            repo: 'gcelano/LemmatizedAncientGreekXML'
        },
        norse: {
            name: 'Old Norse',
            icon: '⚔️',
            lang: 'Old Norse',
            path: '/mythos/norse/corpus-search.html',
            repo: 'Norse Texts'
        },
        egyptian: {
            name: 'Egyptian',
            icon: '🏺',
            lang: 'Hieroglyphic/Demotic',
            path: '/mythos/egyptian/corpus-search.html',
            repo: 'Egyptian Texts'
        },
        hindu: {
            name: 'Sanskrit',
            icon: '🕉️',
            lang: 'Sanskrit',
            path: '/mythos/hindu/corpus-search.html',
            repo: 'Sanskrit Texts'
        },
        jewish: {
            name: 'Hebrew',
            icon: '✡️',
            lang: 'Hebrew/Aramaic',
            path: '/mythos/jewish/corpus-search.html',
            repo: 'Hebrew Texts'
        },
        sumerian: {
            name: 'Sumerian',
            icon: '📜',
            lang: 'Sumerian/Akkadian',
            path: '/mythos/sumerian/corpus-search.html',
            repo: 'Cuneiform Texts'
        },
        babylonian: {
            name: 'Babylonian',
            icon: '🌙',
            lang: 'Akkadian',
            path: '/mythos/babylonian/corpus-search.html',
            repo: 'Babylonian Texts'
        },
        chinese: {
            name: 'Chinese',
            icon: '🐉',
            lang: 'Classical Chinese',
            path: '/mythos/chinese/corpus-search.html',
            repo: 'Chinese Classics'
        },
        buddhist: {
            name: 'Buddhist',
            icon: '☸️',
            lang: 'Pali/Sanskrit',
            path: '/mythos/buddhist/corpus-search.html',
            repo: 'Pali Canon'
        },
        roman: {
            name: 'Latin',
            icon: '🦅',
            lang: 'Latin',
            path: '/mythos/roman/corpus-search.html',
            repo: 'Latin Texts'
        },
        christian: {
            name: 'Biblical',
            icon: '✝️',
            lang: 'Greek/Latin/Hebrew',
            path: '/mythos/christian/corpus-search.html',
            repo: 'Biblical Texts'
        }
    };

    // Page relationship map (populated dynamically)
    let pageRelationships = {};

    class SmartLinkManager {
        constructor() {
            this.activeDropdown = null;
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;

            // Build page relationships from interlink panels
            this.buildPageRelationships();

            // Convert existing links to smart links
            this.convertExistingLinks();

            // Add event listeners
            this.setupEventListeners();

            this.initialized = true;
            console.log('SmartLinkManager initialized');
        }

        buildPageRelationships() {
            // Scan interlink panels for relationships
            const interlinkPanels = document.querySelectorAll('.interlink-panel, .interlink-grid');
            interlinkPanels.forEach(panel => {
                const links = panel.querySelectorAll('a[href]');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    const text = link.textContent.trim();
                    if (href && text) {
                        if (!pageRelationships[text.toLowerCase()]) {
                            pageRelationships[text.toLowerCase()] = [];
                        }
                        pageRelationships[text.toLowerCase()].push({
                            href: href,
                            text: text,
                            context: panel.querySelector('h3, h4')?.textContent || 'Related'
                        });
                    }
                });
            });
        }

        convertExistingLinks() {
            // Convert links with data-smart attribute
            document.querySelectorAll('a[data-smart], .smart-link-target').forEach(link => {
                this.convertToSmartLink(link);
            });

            // Convert h2, h3, h4 links in content sections
            document.querySelectorAll('main h2 a, main h3 a, main h4 a, .glass-card h3 a, .glass-card h4 a').forEach(link => {
                if (!link.closest('.smart-link')) {
                    this.convertToSmartLink(link);
                }
            });

            // Convert corpus-link elements
            document.querySelectorAll('.corpus-link').forEach(link => {
                this.convertCorpusLink(link);
            });
        }

        convertToSmartLink(element) {
            const href = element.getAttribute('href');
            const text = element.textContent.trim();
            const primaryTarget = element.dataset.primary || href;
            const mythos = element.dataset.mythos || this.detectMythos(href);

            // Create smart link wrapper
            const wrapper = document.createElement('span');
            wrapper.className = 'smart-link';
            wrapper.dataset.term = text.toLowerCase();

            // Main link
            const mainLink = document.createElement('a');
            mainLink.className = 'smart-link-text';
            mainLink.href = primaryTarget;
            mainLink.textContent = text;

            // Dropdown toggle
            const toggle = document.createElement('span');
            toggle.className = 'smart-link-toggle';
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('aria-label', 'Show link options');
            toggle.setAttribute('tabindex', '0');

            // Create dropdown
            const dropdown = this.createDropdown(text, href, mythos);

            wrapper.appendChild(mainLink);
            wrapper.appendChild(toggle);
            wrapper.appendChild(dropdown);

            // Replace original element
            element.parentNode.insertBefore(wrapper, element);
            element.remove();
        }

        convertCorpusLink(element) {
            const href = element.getAttribute('href');
            const text = element.textContent.replace('📖', '').trim();
            const mythos = element.dataset.corpus || this.detectMythos(href);

            // Create keyword link with dropdown
            const wrapper = document.createElement('span');
            wrapper.className = 'smart-link keyword-variant';
            wrapper.dataset.term = text.toLowerCase();

            const mainLink = document.createElement('a');
            mainLink.className = 'smart-link-text keyword-link';
            mainLink.href = href;
            mainLink.textContent = text;

            const toggle = document.createElement('span');
            toggle.className = 'smart-link-toggle';
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('aria-label', 'Show search options');

            const dropdown = this.createDropdown(text, href, mythos, true);

            wrapper.appendChild(mainLink);
            wrapper.appendChild(toggle);
            wrapper.appendChild(dropdown);

            element.parentNode.insertBefore(wrapper, element);
            element.remove();
        }

        createDropdown(term, primaryHref, mythos, isCorpusLink = false) {
            const dropdown = document.createElement('div');
            dropdown.className = 'smart-link-dropdown';

            let html = '';

            // Section A: Primary destination
            html += `
                <div class="dropdown-section dropdown-primary">
                    <div class="dropdown-section-label">
                        <span class="section-icon">⭐</span> Primary
                    </div>
                    <a href="${primaryHref}" class="dropdown-item">
                        <span class="dropdown-item-title">${term}</span>
                        <span class="dropdown-item-desc">Go to main page</span>
                    </a>
                </div>
            `;

            // Section B: Related pages
            const related = this.getRelatedPages(term);
            if (related.length > 0) {
                html += `
                    <div class="dropdown-section dropdown-related">
                        <div class="dropdown-section-label">
                            <span class="section-icon">🔗</span> Related Pages
                        </div>
                `;
                related.slice(0, 5).forEach(page => {
                    html += `
                        <a href="${page.href}" class="dropdown-item">
                            <span class="dropdown-item-title">${page.text}</span>
                            <span class="dropdown-item-meta">
                                <span class="dropdown-item-badge">${page.context}</span>
                            </span>
                        </a>
                    `;
                });
                html += '</div>';
            }

            // Section C: Corpus search options
            const corpusOptions = this.getCorpusOptions(term, mythos);
            if (corpusOptions.length > 0) {
                html += `
                    <div class="dropdown-section dropdown-corpus">
                        <div class="dropdown-section-label">
                            <span class="section-icon">📚</span> Search in Corpus
                        </div>
                `;
                corpusOptions.forEach(corpus => {
                    const searchUrl = `${corpus.path}?term=${encodeURIComponent(term)}`;
                    html += `
                        <a href="${searchUrl}" class="corpus-option">
                            <span class="corpus-option-icon">${corpus.icon}</span>
                            <span class="corpus-option-info">
                                <span class="corpus-option-name">${corpus.name}</span>
                                <span class="corpus-option-lang">${corpus.lang}</span>
                            </span>
                            <span class="corpus-option-arrow">→</span>
                        </a>
                    `;
                });
                html += '</div>';
            }

            dropdown.innerHTML = html;
            return dropdown;
        }

        getRelatedPages(term) {
            const termLower = term.toLowerCase();
            const related = pageRelationships[termLower] || [];

            // Also search for partial matches
            Object.keys(pageRelationships).forEach(key => {
                if (key.includes(termLower) || termLower.includes(key)) {
                    related.push(...pageRelationships[key]);
                }
            });

            // Deduplicate
            const seen = new Set();
            return related.filter(page => {
                if (seen.has(page.href)) return false;
                seen.add(page.href);
                return true;
            });
        }

        getCorpusOptions(term, primaryMythos) {
            const options = [];

            // Add primary mythos first if specified
            if (primaryMythos && CORPUS_CONFIG[primaryMythos]) {
                options.push(CORPUS_CONFIG[primaryMythos]);
            }

            // Detect relevant corpora based on current page
            const currentPath = window.location.pathname;
            Object.keys(CORPUS_CONFIG).forEach(key => {
                if (currentPath.includes(`/mythos/${key}/`) && !options.find(o => o.name === CORPUS_CONFIG[key].name)) {
                    options.unshift(CORPUS_CONFIG[key]);
                }
            });

            // Add commonly relevant corpora
            const commonCorpora = ['greek', 'hebrew', 'latin'];
            commonCorpora.forEach(key => {
                if (CORPUS_CONFIG[key] && !options.find(o => o.name === CORPUS_CONFIG[key].name)) {
                    options.push(CORPUS_CONFIG[key]);
                }
            });

            return options.slice(0, 4);
        }

        detectMythos(href) {
            if (!href) return null;
            const match = href.match(/\/mythos\/([^\/]+)\//);
            return match ? match[1] : null;
        }

        setupEventListeners() {
            // Toggle dropdown on click
            document.addEventListener('click', (e) => {
                const toggle = e.target.closest('.smart-link-toggle');
                if (toggle) {
                    e.preventDefault();
                    e.stopPropagation();
                    const smartLink = toggle.closest('.smart-link');
                    this.toggleDropdown(smartLink);
                    return;
                }

                // Close on outside click
                if (!e.target.closest('.smart-link-dropdown')) {
                    this.closeAllDropdowns();
                }
            });

            // Keyboard support
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeAllDropdowns();
                }

                if (e.key === 'Enter' && e.target.classList.contains('smart-link-toggle')) {
                    e.preventDefault();
                    const smartLink = e.target.closest('.smart-link');
                    this.toggleDropdown(smartLink);
                }
            });

            // Reposition dropdowns on scroll/resize
            let ticking = false;
            const onScrollResize = () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.repositionDropdowns();
                        ticking = false;
                    });
                    ticking = true;
                }
            };
            window.addEventListener('scroll', onScrollResize, { passive: true });
            window.addEventListener('resize', onScrollResize, { passive: true });
        }

        toggleDropdown(smartLink) {
            if (!smartLink) return;

            const isActive = smartLink.classList.contains('active');

            // Close all other dropdowns
            this.closeAllDropdowns();

            if (!isActive) {
                smartLink.classList.add('active');
                this.activeDropdown = smartLink;
                this.positionDropdown(smartLink);
            }
        }

        closeAllDropdowns() {
            document.querySelectorAll('.smart-link.active').forEach(link => {
                link.classList.remove('active');
            });
            this.activeDropdown = null;
        }

        positionDropdown(smartLink) {
            const dropdown = smartLink.querySelector('.smart-link-dropdown');
            if (!dropdown) return;

            const rect = smartLink.getBoundingClientRect();
            const dropdownRect = dropdown.getBoundingClientRect();

            // Check if dropdown would overflow right edge
            if (rect.left + dropdownRect.width > window.innerWidth - 20) {
                dropdown.classList.add('align-right');
            } else {
                dropdown.classList.remove('align-right');
            }
        }

        repositionDropdowns() {
            if (this.activeDropdown) {
                this.positionDropdown(this.activeDropdown);
            }
        }
    }

    // Auto-initialize on DOM ready
    const manager = new SmartLinkManager();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => manager.init());
    } else {
        manager.init();
    }

    // Expose for manual initialization
    window.SmartLinkManager = manager;

    // Utility function to convert any link to smart link
    window.createSmartLink = function(element) {
        manager.convertToSmartLink(element);
    };

})();
