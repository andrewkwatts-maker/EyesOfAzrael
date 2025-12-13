/**
 * Smart Links - Dropdown Hyperlink System
 * Priority: 1) Matching pages, 2) Related pages, 3) Corpus search (last)
 * Also handles fixing broken corpus-results links
 */

(function() {
    'use strict';

    // Corpus search configurations
    const CORPUS_CONFIG = {
        greek: { name: 'Greek Texts', icon: '🏛️', lang: 'Ancient Greek', path: '/mythos/greek/corpus-search.html' },
        norse: { name: 'Norse Texts', icon: '⚔️', lang: 'Old Norse', path: '/mythos/norse/corpus-search.html' },
        egyptian: { name: 'Egyptian Texts', icon: '🏺', lang: 'Hieroglyphic', path: '/mythos/egyptian/corpus-search.html' },
        hindu: { name: 'Sanskrit Texts', icon: '🕉️', lang: 'Sanskrit', path: '/mythos/hindu/corpus-search.html' },
        jewish: { name: 'Hebrew Texts', icon: '✡️', lang: 'Hebrew', path: '/mythos/jewish/corpus-search.html' },
        sumerian: { name: 'Cuneiform Texts', icon: '📜', lang: 'Sumerian', path: '/mythos/sumerian/corpus-search.html' },
        babylonian: { name: 'Babylonian Texts', icon: '🌙', lang: 'Akkadian', path: '/mythos/babylonian/corpus-search.html' },
        chinese: { name: 'Chinese Classics', icon: '🐉', lang: 'Classical Chinese', path: '/mythos/chinese/corpus-search.html' },
        buddhist: { name: 'Buddhist Texts', icon: '☸️', lang: 'Pali/Sanskrit', path: '/mythos/buddhist/corpus-search.html' },
        roman: { name: 'Latin Texts', icon: '🦅', lang: 'Latin', path: '/mythos/roman/corpus-search.html' },
        christian: { name: 'Biblical Texts', icon: '✝️', lang: 'Greek/Hebrew', path: '/mythos/christian/corpus-search.html' },
        persian: { name: 'Persian Texts', icon: '🔥', lang: 'Avestan', path: '/mythos/persian/corpus-search.html' },
        celtic: { name: 'Celtic Texts', icon: '☘️', lang: 'Old Irish', path: '/mythos/celtic/corpus-search.html' },
        tarot: { name: 'Hermetic Texts', icon: '🃏', lang: 'Latin/English', path: '/mythos/tarot/corpus-search.html' },
        japanese: { name: 'Japanese Texts', icon: '⛩️', lang: 'Japanese', path: '/mythos/japanese/corpus-search.html' },
        aztec: { name: 'Aztec Texts', icon: '🦅', lang: 'Nahuatl', path: '/mythos/aztec/corpus-search.html' }
    };

    /**
     * Fix broken corpus-results links by converting them to corpus-search URLs
     */
    function fixCorpusLinkHref(link) {
        const href = link.getAttribute('href') || '';

        // Only fix corpus-results links that don't point to corpus-search
        if (!href.includes('corpus-results/') || href.includes('corpus-search.html')) {
            return href;
        }

        // Extract tradition from href or data attributes
        let tradition = link.dataset.tradition || link.dataset.corpus;
        if (!tradition) {
            const match = href.match(/corpus-results\/([^\/]+)\//);
            if (match) tradition = match[1].toLowerCase();
        }

        // Extract term from href or data attributes
        let term = link.dataset.term;
        if (!term) {
            const match = href.match(/corpus-results\/[^\/]+\/([^\.]+)\.html/);
            if (match) {
                term = match[1].replace(/-/g, ' ');
            }
        }
        if (!term) {
            term = link.textContent.replace('📖', '').trim();
        }

        // Build corrected URL
        if (tradition && term && CORPUS_CONFIG[tradition]) {
            const newHref = `${CORPUS_CONFIG[tradition].path}?term=${encodeURIComponent(term)}`;
            link.setAttribute('href', newHref);
            return newHref;
        }

        // Fallback: try to detect tradition from current page path
        if (term) {
            const currentPath = window.location.pathname;
            const tradMatch = currentPath.match(/\/mythos\/([^\/]+)\//);
            if (tradMatch) {
                tradition = tradMatch[1];
                if (CORPUS_CONFIG[tradition]) {
                    const newHref = `${CORPUS_CONFIG[tradition].path}?term=${encodeURIComponent(term)}`;
                    link.setAttribute('href', newHref);
                    return newHref;
                }
            }
        }

        return href;
    }

    // Page index built from all links on the page
    let pageIndex = {};
    let categoryMap = {};

    class SmartLinkManager {
        constructor() {
            this.activeDropdown = null;
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;

            this.buildPageIndex();
            this.convertExistingLinks();
            this.setupEventListeners();

            this.initialized = true;
        }

        // Build index of all pages from links on the current page
        buildPageIndex() {
            document.querySelectorAll('a[href]').forEach(link => {
                const href = link.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

                const text = link.textContent.trim();
                if (!text || text.length < 2) return;

                // Extract category from path
                const category = this.extractCategory(href);
                const fileName = this.extractFileName(href);

                const key = text.toLowerCase();
                if (!pageIndex[key]) {
                    pageIndex[key] = [];
                }

                // Avoid duplicates
                if (!pageIndex[key].find(p => p.href === href)) {
                    pageIndex[key].push({
                        href: href,
                        title: text,
                        fileName: fileName,
                        category: category
                    });
                }
            });
        }

        extractCategory(href) {
            // Extract meaningful category from path
            const parts = href.split('/').filter(p => p && !p.includes('.html'));
            if (parts.length >= 2) {
                // Get the parent folder as category
                const cat = parts[parts.length - 1] || parts[parts.length - 2];
                return this.formatCategory(cat);
            }
            return '';
        }

        extractFileName(href) {
            const match = href.match(/([^\/]+)\.html$/);
            if (match) {
                return this.formatCategory(match[1]);
            }
            return '';
        }

        formatCategory(str) {
            return str
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        }

        convertExistingLinks() {
            // First, fix all broken corpus-link hrefs
            document.querySelectorAll('.corpus-link').forEach(link => {
                fixCorpusLinkHref(link);
            });

            // Convert links with data-smart attribute
            document.querySelectorAll('a[data-smart]').forEach(link => {
                if (!link.closest('.smart-link')) {
                    this.convertToSmartLink(link);
                }
            });

            // Convert corpus-link elements
            document.querySelectorAll('.corpus-link').forEach(link => {
                if (!link.closest('.smart-link')) {
                    this.convertToSmartLink(link);
                }
            });
        }

        convertToSmartLink(element) {
            const href = element.getAttribute('href');
            const text = element.textContent.replace('📖', '').trim();
            const mythos = element.dataset.mythos || element.dataset.corpus || this.detectMythos(href);

            // Create wrapper
            const wrapper = document.createElement('span');
            wrapper.className = 'smart-link';
            wrapper.dataset.term = text.toLowerCase();

            // Main link (clicking goes to primary destination)
            const mainLink = document.createElement('a');
            mainLink.className = 'smart-link-text';
            mainLink.href = href;
            mainLink.textContent = text;

            // Single dropdown toggle
            const toggle = document.createElement('span');
            toggle.className = 'smart-link-toggle';
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('aria-label', 'Show options');
            toggle.setAttribute('tabindex', '0');

            // Create dropdown with priority ordering
            const dropdown = this.createDropdown(text, href, mythos);

            wrapper.appendChild(mainLink);
            wrapper.appendChild(toggle);
            wrapper.appendChild(dropdown);

            element.parentNode.insertBefore(wrapper, element);
            element.remove();
        }

        createDropdown(term, primaryHref, mythos) {
            const dropdown = document.createElement('div');
            dropdown.className = 'smart-link-dropdown';

            let html = '';
            const termLower = term.toLowerCase();

            // 1. Find exact matching pages (prioritize over corpus)
            const exactMatches = this.findExactMatches(termLower, primaryHref);

            // 2. Find pages containing the term
            const relatedPages = this.findRelatedPages(termLower, primaryHref, exactMatches);

            // Show primary match if we have one
            if (exactMatches.length > 0) {
                html += `
                    <div class="dropdown-section dropdown-primary">
                        <div class="dropdown-section-label">
                            <span class="section-icon">→</span> Go to
                        </div>
                `;
                exactMatches.slice(0, 1).forEach(page => {
                    html += this.renderPageItem(page, true);
                });
                html += '</div>';
            }

            // Show related pages (title / category format)
            if (relatedPages.length > 0) {
                html += `
                    <div class="dropdown-section dropdown-related">
                        <div class="dropdown-section-label">
                            <span class="section-icon">◇</span> Also appears in
                        </div>
                `;
                relatedPages.slice(0, 6).forEach(page => {
                    html += this.renderPageItem(page, false);
                });
                html += '</div>';
            }

            // 3. Corpus search ALWAYS at the end (only if we have corpus options)
            const corpusOptions = this.getCorpusOptions(mythos);
            if (corpusOptions.length > 0) {
                html += `
                    <div class="dropdown-section dropdown-corpus">
                        <div class="dropdown-section-label">
                            <span class="section-icon">⌕</span> Search in texts
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

            // If no matches at all, show the primary href
            if (exactMatches.length === 0 && relatedPages.length === 0 && corpusOptions.length === 0) {
                html += `
                    <div class="dropdown-section dropdown-primary">
                        <a href="${primaryHref}" class="dropdown-item">
                            <span class="dropdown-item-title">${term}</span>
                            <span class="dropdown-item-meta">
                                <span class="dropdown-item-category">View page</span>
                            </span>
                        </a>
                    </div>
                `;
            }

            dropdown.innerHTML = html;
            return dropdown;
        }

        renderPageItem(page, isPrimary) {
            return `
                <a href="${page.href}" class="dropdown-item">
                    <span class="dropdown-item-title">${page.title}</span>
                    <span class="dropdown-item-meta">
                        <span class="dropdown-item-category">${page.category || page.fileName || ''}</span>
                    </span>
                </a>
            `;
        }

        findExactMatches(termLower, excludeHref) {
            const matches = [];

            // Check page index for exact term match
            if (pageIndex[termLower]) {
                pageIndex[termLower].forEach(page => {
                    if (page.href !== excludeHref && !page.href.includes('corpus-search')) {
                        matches.push(page);
                    }
                });
            }

            return matches;
        }

        findRelatedPages(termLower, excludeHref, excludeMatches) {
            const related = [];
            const excludeHrefs = new Set([excludeHref, ...excludeMatches.map(m => m.href)]);

            // Search all indexed pages for partial matches
            Object.keys(pageIndex).forEach(key => {
                if (key.includes(termLower) || termLower.includes(key)) {
                    pageIndex[key].forEach(page => {
                        if (!excludeHrefs.has(page.href) &&
                            !page.href.includes('corpus-search') &&
                            !related.find(r => r.href === page.href)) {
                            related.push(page);
                        }
                    });
                }
            });

            return related;
        }

        getCorpusOptions(primaryMythos) {
            const options = [];
            const currentPath = window.location.pathname;

            // Add primary mythos first if specified
            if (primaryMythos && CORPUS_CONFIG[primaryMythos]) {
                options.push(CORPUS_CONFIG[primaryMythos]);
            }

            // Add current page's mythos
            Object.keys(CORPUS_CONFIG).forEach(key => {
                if (currentPath.includes(`/mythos/${key}/`) &&
                    !options.find(o => o.path === CORPUS_CONFIG[key].path)) {
                    options.unshift(CORPUS_CONFIG[key]);
                }
            });

            return options.slice(0, 3);
        }

        detectMythos(href) {
            if (!href) return null;
            const match = href.match(/\/mythos\/([^\/]+)\//);
            return match ? match[1] : null;
        }

        setupEventListeners() {
            document.addEventListener('click', (e) => {
                const toggle = e.target.closest('.smart-link-toggle');
                if (toggle) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleDropdown(toggle.closest('.smart-link'));
                    return;
                }

                if (!e.target.closest('.smart-link-dropdown')) {
                    this.closeAllDropdowns();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeAllDropdowns();
                }
            });
        }

        toggleDropdown(smartLink) {
            if (!smartLink) return;
            const isActive = smartLink.classList.contains('active');
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
            if (rect.left + 260 > window.innerWidth - 20) {
                dropdown.classList.add('align-right');
            } else {
                dropdown.classList.remove('align-right');
            }
        }
    }

    // Initialize
    const manager = new SmartLinkManager();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => manager.init());
    } else {
        manager.init();
    }

    window.SmartLinkManager = manager;
})();
