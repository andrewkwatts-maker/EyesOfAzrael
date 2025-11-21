// Search functionality for 288 Sparks documentation

class SparkSearch {
    constructor() {
        this.searchBox = document.getElementById('searchBox');
        this.resultsContainer = document.getElementById('searchResults');
        this.allCards = [];

        if (this.searchBox) {
            this.init();
        }
    }

    init() {
        // Collect all searchable cards
        this.allCards = Array.from(document.querySelectorAll('.card'));

        // Add search event listener with debouncing
        let debounceTimer;
        this.searchBox.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });

        // Initial state
        this.showAllCards();
    }

    performSearch(query) {
        query = query.toLowerCase().trim();

        if (query === '') {
            this.showAllCards();
            return;
        }

        let visibleCount = 0;

        this.allCards.forEach(card => {
            const searchableText = this.getSearchableText(card);

            if (searchableText.includes(query)) {
                card.style.display = 'block';
                this.highlightText(card, query);
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Show count
        this.updateResultCount(visibleCount, query);
    }

    getSearchableText(card) {
        // Extract all text content from card for searching
        const title = card.querySelector('h3')?.textContent || '';
        const subtitle = card.querySelector('.subtitle')?.textContent || '';
        const description = card.querySelector('.description')?.textContent || '';
        const attributes = Array.from(card.querySelectorAll('.tag'))
            .map(tag => tag.textContent)
            .join(' ');

        return `${title} ${subtitle} ${description} ${attributes}`.toLowerCase();
    }

    highlightText(card, query) {
        // Remove existing highlights
        card.querySelectorAll('.highlight').forEach(el => {
            el.outerHTML = el.textContent;
        });

        // Add new highlights
        const walker = document.createTreeWalker(
            card,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const nodesToHighlight = [];
        let node;

        while (node = walker.nextNode()) {
            if (node.nodeValue.toLowerCase().includes(query)) {
                nodesToHighlight.push(node);
            }
        }

        nodesToHighlight.forEach(node => {
            const text = node.nodeValue;
            const lowerText = text.toLowerCase();
            const index = lowerText.indexOf(query);

            if (index !== -1) {
                const span = document.createElement('span');
                span.innerHTML = text.substring(0, index) +
                    '<span class="highlight">' +
                    text.substring(index, index + query.length) +
                    '</span>' +
                    text.substring(index + query.length);

                node.parentNode.replaceChild(span, node);
            }
        });
    }

    showAllCards() {
        this.allCards.forEach(card => {
            card.style.display = 'block';
            // Remove highlights
            card.querySelectorAll('.highlight').forEach(el => {
                el.outerHTML = el.textContent;
            });
        });
        this.updateResultCount(this.allCards.length, '');
    }

    updateResultCount(count, query) {
        const countElement = document.getElementById('resultCount');
        if (countElement) {
            if (query) {
                countElement.textContent = `Found ${count} result${count !== 1 ? 's' : ''} for "${query}"`;
            } else {
                countElement.textContent = `Showing all ${count} items`;
            }
        }
    }
}

// Advanced filtering
class SparkFilter {
    constructor() {
        this.filters = {
            sefirah: null,
            world: null,
            attribute: null
        };
    }

    addFilter(type, value) {
        this.filters[type] = value;
        this.applyFilters();
    }

    removeFilter(type) {
        this.filters[type] = null;
        this.applyFilters();
    }

    clearFilters() {
        this.filters = {
            sefirah: null,
            world: null,
            attribute: null
        };
        this.applyFilters();
    }

    applyFilters() {
        const cards = document.querySelectorAll('.card');

        cards.forEach(card => {
            let show = true;

            // Check each active filter
            if (this.filters.sefirah) {
                const cardSefirah = card.dataset.sefirah;
                if (cardSefirah !== this.filters.sefirah) {
                    show = false;
                }
            }

            if (this.filters.world) {
                const cardWorld = card.dataset.world;
                if (cardWorld !== this.filters.world) {
                    show = false;
                }
            }

            if (this.filters.attribute) {
                const attributes = card.dataset.attributes?.split(',') || [];
                if (!attributes.includes(this.filters.attribute)) {
                    show = false;
                }
            }

            card.style.display = show ? 'block' : 'none';
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.sparkSearch = new SparkSearch();
    window.sparkFilter = new SparkFilter();
});

// Utility functions for navigation
function navigateToSpark(sparkId) {
    window.location.href = `sparks/${sparkId}.html`;
}

function navigateToSefirah(sefirahId) {
    window.location.href = `sefirot/${sefirahId}.html`;
}

function navigateToWorld(worldId) {
    window.location.href = `worlds/${worldId}.html`;
}

function navigateToName(nameId) {
    window.location.href = `names/${nameId}.html`;
}

// Back to top button
function addBackToTop() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'back-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--accent);
        color: var(--bg-primary);
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
    `;

    document.body.appendChild(button);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            button.style.opacity = '1';
        } else {
            button.style.opacity = '0';
        }
    });

    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

document.addEventListener('DOMContentLoaded', addBackToTop);
