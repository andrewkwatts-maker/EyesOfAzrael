/**
 * Home Page View
 * Displays mythology topic cards loaded from Firebase
 */

class HomeView {
    constructor(firestore) {
        this.db = firestore;
        this.mythologies = [];
    }

    /**
     * Render the home page
     */
    async render(container) {
        console.log('[Home View] Rendering home page...');

        // Show loading state
        container.innerHTML = `
            <div class="loading-container">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">Loading mythologies...</p>
            </div>
        `;

        try {
            // Load mythologies from Firebase
            await this.loadMythologies();

            // Render home page content
            container.innerHTML = this.getHomeHTML();

            // Add event listeners
            this.attachEventListeners();

        } catch (error) {
            console.error('[Home View] Error rendering home page:', error);
            container.innerHTML = this.getErrorHTML(error);
        }
    }

    /**
     * Load mythologies from Firebase
     */
    async loadMythologies() {
        console.log('[Home View] Loading mythologies from Firebase...');

        try {
            // Try to load from mythologies collection
            const snapshot = await this.db.collection('mythologies')
                .orderBy('order', 'asc')
                .get();

            if (!snapshot.empty) {
                this.mythologies = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log(`[Home View] Loaded ${this.mythologies.length} mythologies from Firebase`);
            } else {
                // Use fallback hardcoded list
                console.warn('[Home View] No mythologies found in Firebase, using fallback');
                this.mythologies = this.getFallbackMythologies();
            }

        } catch (error) {
            console.error('[Home View] Error loading from Firebase:', error);
            console.log('[Home View] Using fallback mythologies');
            this.mythologies = this.getFallbackMythologies();
        }
    }

    /**
     * Get fallback mythologies if Firebase fails
     */
    getFallbackMythologies() {
        return [
            {
                id: 'greek',
                name: 'Greek Mythology',
                icon: '🏛️',
                description: 'Gods of Olympus and heroes of ancient Greece',
                color: 'var(--color-primary, #8b7fff)',
                order: 1
            },
            {
                id: 'norse',
                name: 'Norse Mythology',
                icon: '⚔️',
                description: 'Warriors of Asgard and the Nine Realms',
                color: '#4a9eff',
                order: 2
            },
            {
                id: 'egyptian',
                name: 'Egyptian Mythology',
                icon: '𓂀',
                description: 'Keepers of the Nile and guardians of Ma\'at',
                color: '#ffd93d',
                order: 3
            },
            {
                id: 'hindu',
                name: 'Hindu Mythology',
                icon: '🕉️',
                description: 'The Trimurti and cosmic cycles of creation',
                color: '#ff7eb6',
                order: 4
            },
            {
                id: 'buddhist',
                name: 'Buddhist Tradition',
                icon: '☸️',
                description: 'Bodhisattvas and the path to enlightenment',
                color: '#51cf66',
                order: 5
            },
            {
                id: 'chinese',
                name: 'Chinese Mythology',
                icon: '🐉',
                description: 'Dragons, immortals, and celestial bureaucracy',
                color: '#f85a8f',
                order: 6
            },
            {
                id: 'japanese',
                name: 'Japanese Mythology',
                icon: '⛩️',
                description: 'Kami spirits and the creation of Japan',
                color: '#fb9f7f',
                order: 7
            },
            {
                id: 'celtic',
                name: 'Celtic Mythology',
                icon: '🍀',
                description: 'Druids, faeries, and the Tuatha Dé Danann',
                color: '#7fd9d3',
                order: 8
            },
            {
                id: 'babylonian',
                name: 'Babylonian Mythology',
                icon: '🏛️',
                description: 'The Enuma Elish and gods of Mesopotamia',
                color: '#b965e6',
                order: 9
            },
            {
                id: 'persian',
                name: 'Persian Mythology',
                icon: '🔥',
                description: 'Zoroastrian wisdom and the eternal flame',
                color: '#7fb0f9',
                order: 10
            },
            {
                id: 'christian',
                name: 'Christian Tradition',
                icon: '✟',
                description: 'Angels, saints, and biblical narratives',
                color: '#a8edea',
                order: 11
            },
            {
                id: 'islamic',
                name: 'Islamic Tradition',
                icon: '☪️',
                description: 'Prophets, angels, and divine revelation',
                color: '#fed6e3',
                order: 12
            }
        ];
    }

    /**
     * Get home page HTML
     */
    getHomeHTML() {
        return `
            <div class="home-view">
                <!-- Hero Section -->
                <section class="hero-section">
                    <div class="hero-content">
                        <h1 class="hero-title">
                            <span class="hero-icon">👁️</span>
                            Eyes of Azrael
                        </h1>
                        <p class="hero-subtitle">
                            Explore World Mythologies
                        </p>
                        <p class="hero-description">
                            Journey through 6000+ years of human mythology, from ancient Sumer to modern traditions.
                            Discover deities, heroes, creatures, and sacred texts from cultures across the globe.
                        </p>
                        <div class="hero-actions">
                            <a href="#/search" class="btn-primary">
                                🔍 Search Database
                            </a>
                            <a href="#/compare" class="btn-secondary">
                                ⚖️ Compare Traditions
                            </a>
                        </div>
                    </div>
                </section>

                <!-- Mythology Cards Grid -->
                <section class="mythology-grid-section">
                    <h2 class="section-title">Explore Mythologies</h2>
                    <div class="mythology-grid">
                        ${this.mythologies.map(myth => this.getMythologyCardHTML(myth)).join('')}
                    </div>
                </section>

                <!-- Features Section -->
                <section class="features-section">
                    <h2 class="section-title">Database Features</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">📚</div>
                            <h3>Comprehensive Database</h3>
                            <p>Thousands of entities across 12+ mythological traditions</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔗</div>
                            <h3>Cross-Cultural Links</h3>
                            <p>Discover connections between different traditions</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🌿</div>
                            <h3>Sacred Herbalism</h3>
                            <p>Explore plants, rituals, and traditional practices</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">✨</div>
                            <h3>Magic Systems</h3>
                            <p>Study mystical practices and esoteric traditions</p>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }

    /**
     * Get mythology card HTML
     */
    getMythologyCardHTML(mythology) {
        const borderColor = mythology.color || 'var(--color-primary, #8b7fff)';

        return `
            <a href="#/mythology/${mythology.id}" class="mythology-card" data-mythology="${mythology.id}">
                <div class="mythology-card-icon" style="color: ${borderColor};">
                    ${mythology.icon || '📖'}
                </div>
                <h3 class="mythology-card-title">${mythology.name}</h3>
                <p class="mythology-card-description">${mythology.description}</p>
                <div class="mythology-card-arrow" style="color: ${borderColor};">→</div>
            </a>
        `;
    }

    /**
     * Get error HTML
     */
    getErrorHTML(error) {
        return `
            <div class="error-container" style="
                text-align: center;
                padding: 4rem 2rem;
                max-width: 600px;
                margin: 0 auto;
            ">
                <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                <h1>Error Loading Home Page</h1>
                <p style="color: #ef4444; margin: 1rem 0;">${error.message}</p>
                <button onclick="location.reload()" class="btn-primary">Reload Page</button>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Add hover effects or click tracking if needed
        const cards = document.querySelectorAll('.mythology-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                console.log('[Home View] Hovering over:', card.dataset.mythology);
            });
        });
    }
}

// Export for use in SPA navigation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomeView;
}
