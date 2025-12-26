/**
 * Home Page View - ENHANCED WITH DIAGNOSTIC LOGGING
 * Displays mythology topic cards loaded from Firebase
 *
 * This version includes detailed logging to diagnose Firebase query issues.
 * Use this temporarily to identify problems, then revert to home-view.js
 */

class HomeViewEnhanced {
    constructor(firestore) {
        console.log('[HomeView ENHANCED] 🔍 Constructor called');
        console.log('[HomeView ENHANCED] 🔍 Firestore object:', firestore);
        console.log('[HomeView ENHANCED] 🔍 Firestore type:', typeof firestore);

        this.db = firestore;
        this.mythologies = [];
        this.dataSource = 'unknown'; // Track where data came from

        // Validate Firestore
        if (!firestore) {
            console.error('[HomeView ENHANCED] ❌ Firestore is null/undefined!');
        } else if (typeof firestore.collection !== 'function') {
            console.error('[HomeView ENHANCED] ❌ Firestore missing collection() method!');
        } else {
            console.log('[HomeView ENHANCED] ✅ Firestore validated');
        }
    }

    /**
     * Render the home page
     */
    async render(container) {
        console.log('[HomeView ENHANCED] 🎨 Render called');
        console.log('[HomeView ENHANCED] 🎨 Container:', container);
        console.log('[HomeView ENHANCED] 🎨 Container type:', typeof container);

        if (!container) {
            console.error('[HomeView ENHANCED] ❌ Container is null/undefined!');
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div class="loading-container">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">Loading mythologies...</p>
                <p style="font-size: 0.8rem; color: #888; margin-top: 1rem;">🔍 Enhanced diagnostics active</p>
            </div>
        `;

        console.log('[HomeView ENHANCED] 🎨 Loading spinner displayed');

        try {
            // Load mythologies from Firebase
            console.log('[HomeView ENHANCED] 📊 Starting loadMythologies()...');
            const startTime = performance.now();

            await this.loadMythologies();

            const duration = performance.now() - startTime;
            console.log(`[HomeView ENHANCED] 📊 loadMythologies() completed in ${duration.toFixed(2)}ms`);
            console.log('[HomeView ENHANCED] 📊 Mythologies loaded:', this.mythologies.length);
            console.log('[HomeView ENHANCED] 📊 Data source:', this.dataSource);

            // Render home page content
            console.log('[HomeView ENHANCED] 🎨 Generating HTML...');
            const html = this.getHomeHTML();
            console.log('[HomeView ENHANCED] 🎨 HTML length:', html.length, 'characters');

            container.innerHTML = html;
            console.log('[HomeView ENHANCED] 🎨 HTML injected into container');

            // Add event listeners
            console.log('[HomeView ENHANCED] 🖱️ Attaching event listeners...');
            this.attachEventListeners();
            console.log('[HomeView ENHANCED] 🖱️ Event listeners attached');

            console.log('[HomeView ENHANCED] ✅ Render complete');

        } catch (error) {
            console.error('[HomeView ENHANCED] ❌ ERROR in render():', error);
            console.error('[HomeView ENHANCED] ❌ Error name:', error.name);
            console.error('[HomeView ENHANCED] ❌ Error message:', error.message);
            console.error('[HomeView ENHANCED] ❌ Error stack:', error.stack);

            container.innerHTML = this.getErrorHTML(error);
        }
    }

    /**
     * Load mythologies from Firebase
     */
    async loadMythologies() {
        console.log('[HomeView ENHANCED] 🔥 loadMythologies() START');
        console.log('[HomeView ENHANCED] 🔥 Database object:', this.db);

        // Pre-flight checks
        if (!this.db) {
            console.error('[HomeView ENHANCED] 🔥 ❌ Database is null/undefined!');
            console.log('[HomeView ENHANCED] 🔥 Falling back to hardcoded mythologies');
            this.mythologies = this.getFallbackMythologies();
            this.dataSource = 'fallback-no-db';
            return;
        }

        try {
            console.log('[HomeView ENHANCED] 🔥 Attempting Firebase query...');
            console.log('[HomeView ENHANCED] 🔥 Collection: "mythologies"');
            console.log('[HomeView ENHANCED] 🔥 OrderBy: "order" ASC');

            // Try to access collection
            console.log('[HomeView ENHANCED] 🔥 Step 1: Getting collection reference...');
            const collectionRef = this.db.collection('mythologies');
            console.log('[HomeView ENHANCED] 🔥 ✅ Collection reference obtained:', collectionRef);

            // Add orderBy
            console.log('[HomeView ENHANCED] 🔥 Step 2: Adding orderBy clause...');
            const query = collectionRef.orderBy('order', 'asc');
            console.log('[HomeView ENHANCED] 🔥 ✅ Query object created:', query);

            // Execute query
            console.log('[HomeView ENHANCED] 🔥 Step 3: Executing query with .get()...');
            const queryStartTime = performance.now();

            const snapshot = await query.get();

            const queryDuration = performance.now() - queryStartTime;
            console.log(`[HomeView ENHANCED] 🔥 ✅ Query completed in ${queryDuration.toFixed(2)}ms`);
            console.log('[HomeView ENHANCED] 🔥 Snapshot:', snapshot);
            console.log('[HomeView ENHANCED] 🔥 Snapshot.empty:', snapshot.empty);
            console.log('[HomeView ENHANCED] 🔥 Snapshot.size:', snapshot.size);
            console.log('[HomeView ENHANCED] 🔥 Snapshot.docs.length:', snapshot.docs.length);

            if (!snapshot.empty) {
                console.log('[HomeView ENHANCED] 🔥 ✅ Documents found, processing...');

                this.mythologies = snapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    console.log(`[HomeView ENHANCED] 🔥 Document ${index + 1}:`, {
                        id: doc.id,
                        name: data.name,
                        order: data.order,
                        icon: data.icon
                    });

                    return {
                        id: doc.id,
                        ...data
                    };
                });

                console.log(`[HomeView ENHANCED] 🔥 ✅ Loaded ${this.mythologies.length} mythologies from Firebase`);
                this.dataSource = 'firebase';

                // Validate data structure
                this.mythologies.forEach((myth, i) => {
                    if (!myth.name) console.warn(`[HomeView ENHANCED] 🔥 ⚠️ Mythology ${i} missing 'name'`);
                    if (!myth.icon) console.warn(`[HomeView ENHANCED] 🔥 ⚠️ Mythology ${i} missing 'icon'`);
                    if (!myth.description) console.warn(`[HomeView ENHANCED] 🔥 ⚠️ Mythology ${i} missing 'description'`);
                    if (typeof myth.order !== 'number') console.warn(`[HomeView ENHANCED] 🔥 ⚠️ Mythology ${i} 'order' is not a number`);
                });

            } else {
                console.warn('[HomeView ENHANCED] 🔥 ⚠️ Query succeeded but returned EMPTY results');
                console.warn('[HomeView ENHANCED] 🔥 ⚠️ Collection "mythologies" exists but has no documents');
                console.warn('[HomeView ENHANCED] 🔥 ⚠️ Using fallback mythologies');

                this.mythologies = this.getFallbackMythologies();
                this.dataSource = 'fallback-empty';
            }

        } catch (error) {
            console.error('[HomeView ENHANCED] 🔥 ❌ ERROR loading from Firebase');
            console.error('[HomeView ENHANCED] 🔥 ❌ Error type:', error.constructor.name);
            console.error('[HomeView ENHANCED] 🔥 ❌ Error code:', error.code);
            console.error('[HomeView ENHANCED] 🔥 ❌ Error message:', error.message);
            console.error('[HomeView ENHANCED] 🔥 ❌ Full error:', error);

            // Specific error diagnosis
            if (error.code === 'permission-denied') {
                console.error('[HomeView ENHANCED] 🔥 ❌ PERMISSION DENIED - Check Firestore rules');
                console.error('[HomeView ENHANCED] 🔥 ❌ Ensure user is authenticated');
                console.error('[HomeView ENHANCED] 🔥 ❌ Ensure rules allow read on /mythologies');
            } else if (error.code === 'failed-precondition') {
                console.error('[HomeView ENHANCED] 🔥 ❌ FAILED PRECONDITION - Index required');
                console.error('[HomeView ENHANCED] 🔥 ❌ Create index for collection: mythologies, field: order, direction: ASC');
                console.error('[HomeView ENHANCED] 🔥 ❌ Check Firebase Console for index creation link');
            } else if (error.code === 'unavailable') {
                console.error('[HomeView ENHANCED] 🔥 ❌ UNAVAILABLE - Network or Firestore issue');
                console.error('[HomeView ENHANCED] 🔥 ❌ Check internet connection');
                console.error('[HomeView ENHANCED] 🔥 ❌ Check Firebase status');
            }

            console.log('[HomeView ENHANCED] 🔥 Using fallback mythologies');
            this.mythologies = this.getFallbackMythologies();
            this.dataSource = 'fallback-error';
        }

        console.log('[HomeView ENHANCED] 🔥 loadMythologies() END');
        console.log('[HomeView ENHANCED] 🔥 Final mythology count:', this.mythologies.length);
        console.log('[HomeView ENHANCED] 🔥 Data source:', this.dataSource);
    }

    /**
     * Get fallback mythologies if Firebase fails
     */
    getFallbackMythologies() {
        console.log('[HomeView ENHANCED] 📦 Using fallback mythologies');

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
        console.log('[HomeView ENHANCED] 🎨 Generating home HTML');

        // Add data source indicator
        const dataSourceBadge = this.getDataSourceBadge();

        return `
            <div class="home-view">
                <!-- Data Source Indicator -->
                ${dataSourceBadge}

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
     * Get data source badge for diagnostic purposes
     */
    getDataSourceBadge() {
        const badges = {
            'firebase': {
                icon: '🔥',
                text: 'Live Firebase Data',
                color: '#10b981',
                bg: '#d1fae5'
            },
            'fallback-empty': {
                icon: '📦',
                text: 'Fallback Data (Empty Collection)',
                color: '#f59e0b',
                bg: '#fef3c7'
            },
            'fallback-error': {
                icon: '⚠️',
                text: 'Fallback Data (Error)',
                color: '#ef4444',
                bg: '#fee2e2'
            },
            'fallback-no-db': {
                icon: '❌',
                text: 'Fallback Data (No Database)',
                color: '#ef4444',
                bg: '#fee2e2'
            },
            'unknown': {
                icon: '❓',
                text: 'Unknown Data Source',
                color: '#6b7280',
                bg: '#f3f4f6'
            }
        };

        const badge = badges[this.dataSource] || badges.unknown;

        return `
            <div style="
                position: fixed;
                top: 80px;
                right: 20px;
                background: ${badge.bg};
                color: ${badge.color};
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>${badge.icon}</span>
                <span>${badge.text}</span>
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
                <div style="background: #fee2e2; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
                    <strong>Debug Info:</strong>
                    <pre style="overflow: auto; font-size: 0.875rem;">${error.stack}</pre>
                </div>
                <button onclick="location.reload()" class="btn-primary">Reload Page</button>
                <p style="margin-top: 1rem; color: #888; font-size: 0.875rem;">
                    Check browser console (F12) for detailed logs
                </p>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        console.log('[HomeView ENHANCED] 🖱️ attachEventListeners() called');

        // Add hover effects or click tracking if needed
        const cards = document.querySelectorAll('.mythology-card');
        console.log('[HomeView ENHANCED] 🖱️ Found', cards.length, 'mythology cards');

        cards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                console.log('[HomeView ENHANCED] 🖱️ Hover:', card.dataset.mythology);
            });

            card.addEventListener('click', (e) => {
                console.log('[HomeView ENHANCED] 🖱️ Click:', card.dataset.mythology);
            });
        });

        console.log('[HomeView ENHANCED] 🖱️ Event listeners attached to all cards');
    }
}

// Export for use in SPA navigation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomeViewEnhanced;
}

// Also expose globally
window.HomeViewEnhanced = HomeViewEnhanced;

console.log('[HomeView ENHANCED] 🔍 Module loaded and ready');
