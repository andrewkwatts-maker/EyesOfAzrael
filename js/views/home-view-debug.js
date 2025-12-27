/**
 * Home Page View - Enhanced Debug Version
 * Displays mythology topic cards loaded from Firebase with comprehensive logging
 *
 * DEBUG FEATURES:
 * - Extensive console logging at every step
 * - Visual debug panel showing Firebase status
 * - Loading timeout protection
 * - Detailed error messages
 * - Fallback cascade system
 */

class HomeViewDebug {
    constructor(firestore) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏠 [HomeViewDebug] Constructor called');
        console.log('📅 Timestamp:', new Date().toISOString());

        this.db = firestore;
        this.mythologies = [];
        this.loadStartTime = null;
        this.loadTimeout = 10000; // 10 second timeout
        this.debugInfo = {
            firebaseAttempted: false,
            firebaseSuccess: false,
            firebaseError: null,
            fallbackUsed: false,
            totalMythologies: 0,
            loadDuration: 0
        };

        console.log('✅ [HomeViewDebug] Constructor complete');
        console.log('🔍 Firestore instance provided:', !!this.db);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    /**
     * Render the home page
     */
    async render(container) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎨 [HomeViewDebug] render() called');
        console.log('📅 Timestamp:', new Date().toISOString());
        console.log('📦 Container element:', container?.tagName || 'NOT PROVIDED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (!container) {
            console.error('❌ [HomeViewDebug] CRITICAL: No container provided!');
            return;
        }

        // Show loading state
        console.log('🔄 [HomeViewDebug] Showing loading state...');
        this.loadStartTime = Date.now();
        container.innerHTML = this.getLoadingHTML();

        // Set timeout protection
        const timeoutId = setTimeout(() => {
            console.error('⏰ [HomeViewDebug] TIMEOUT: Loading exceeded 10 seconds');
            console.error('🔍 Current debug info:', this.debugInfo);
            this.renderTimeoutError(container);
        }, this.loadTimeout);

        try {
            // Load mythologies from Firebase
            console.log('📡 [HomeViewDebug] Starting loadMythologies()...');
            await this.loadMythologies();

            clearTimeout(timeoutId); // Cancel timeout on success

            // Calculate load duration
            this.debugInfo.loadDuration = Date.now() - this.loadStartTime;
            this.debugInfo.totalMythologies = this.mythologies.length;

            console.log('✅ [HomeViewDebug] Load complete!');
            console.log('⏱️  Load duration:', this.debugInfo.loadDuration, 'ms');
            console.log('📊 Mythologies loaded:', this.debugInfo.totalMythologies);

            // Render home page content
            console.log('🎨 [HomeViewDebug] Rendering HTML...');
            container.innerHTML = this.getHomeHTML();

            // Add debug panel
            console.log('🐛 [HomeViewDebug] Adding debug panel...');
            this.addDebugPanel(container);

            // Add event listeners
            console.log('🔗 [HomeViewDebug] Attaching event listeners...');
            this.attachEventListeners();

            console.log('✅ [HomeViewDebug] Render complete!\n');

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('\n❌❌❌ [HomeViewDebug] RENDER ERROR ❌❌❌');
            console.error('Error:', error);
            console.error('Stack:', error.stack);
            console.error('Debug Info:', this.debugInfo);
            console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌\n');
            container.innerHTML = this.getErrorHTML(error);
        }
    }

    /**
     * Load mythologies from Firebase
     */
    async loadMythologies() {
        console.log('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
        console.log('┃  📡 FIREBASE QUERY STARTING           ┃');
        console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');

        this.debugInfo.firebaseAttempted = true;

        // Check if Firestore is available
        if (!this.db) {
            console.error('❌ [HomeViewDebug] Firestore instance is NULL!');
            console.error('💡 This means Firebase was not initialized properly');
            this.debugInfo.firebaseError = 'Firestore instance not provided';
            this.debugInfo.fallbackUsed = true;
            this.mythologies = this.getFallbackMythologies();
            console.log('🔄 [HomeViewDebug] Using fallback mythologies:', this.mythologies.length);
            return;
        }

        console.log('✅ [HomeViewDebug] Firestore instance available');
        console.log('🔍 [HomeViewDebug] Firestore object type:', typeof this.db);
        console.log('🔍 [HomeViewDebug] Has collection method:', typeof this.db.collection === 'function');

        try {
            console.log('📝 [HomeViewDebug] Query details:');
            console.log('   Collection: mythologies');
            console.log('   OrderBy: order (ascending)');
            console.log('   Method: get()');

            console.log('\n⏳ [HomeViewDebug] Executing query...');
            const queryStart = Date.now();

            // Try to load from mythologies collection
            const snapshot = await this.db.collection('mythologies')
                .orderBy('order', 'asc')
                .get();

            const queryDuration = Date.now() - queryStart;
            console.log('✅ [HomeViewDebug] Query completed in', queryDuration, 'ms');

            console.log('\n📊 [HomeViewDebug] Query results:');
            console.log('   Snapshot empty:', snapshot.empty);
            console.log('   Document count:', snapshot.size);
            console.log('   Snapshot type:', typeof snapshot);

            if (!snapshot.empty) {
                console.log('✅ [HomeViewDebug] Documents found! Processing...');

                this.mythologies = snapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    console.log(`   📄 Document ${index + 1}:`, {
                        id: doc.id,
                        name: data.name,
                        order: data.order,
                        hasIcon: !!data.icon,
                        hasColor: !!data.color
                    });
                    return {
                        id: doc.id,
                        ...data
                    };
                });

                this.debugInfo.firebaseSuccess = true;
                console.log(`✅ [HomeViewDebug] Loaded ${this.mythologies.length} mythologies from Firebase`);

            } else {
                console.warn('⚠️  [HomeViewDebug] Query returned EMPTY!');
                console.warn('💡 The "mythologies" collection exists but has no documents');
                console.warn('🔄 Falling back to hardcoded mythologies');

                this.debugInfo.firebaseSuccess = false;
                this.debugInfo.fallbackUsed = true;
                this.mythologies = this.getFallbackMythologies();
                console.log('📋 [HomeViewDebug] Fallback loaded:', this.mythologies.length, 'mythologies');
            }

        } catch (error) {
            console.error('\n❌ [HomeViewDebug] FIREBASE QUERY ERROR');
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Full error:', error);

            // Detailed error analysis
            if (error.code === 'permission-denied') {
                console.error('🔒 PERMISSION DENIED');
                console.error('💡 Firestore security rules may be blocking this query');
                console.error('💡 Check Firebase Console → Firestore → Rules');
            } else if (error.code === 'failed-precondition') {
                console.error('📊 INDEX REQUIRED');
                console.error('💡 Firestore needs a composite index for this query');
                console.error('💡 Check the error message for the index creation link');
            } else if (error.code === 'unavailable') {
                console.error('🌐 NETWORK ERROR');
                console.error('💡 Cannot reach Firebase servers');
                console.error('💡 Check internet connection');
            } else {
                console.error('❓ UNKNOWN ERROR');
                console.error('💡 See full error details above');
            }

            this.debugInfo.firebaseError = error.message;
            this.debugInfo.fallbackUsed = true;

            console.log('\n🔄 [HomeViewDebug] Using fallback mythologies');
            this.mythologies = this.getFallbackMythologies();
            console.log('📋 [HomeViewDebug] Fallback loaded:', this.mythologies.length, 'mythologies');
        }

        console.log('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
        console.log('┃  ✅ FIREBASE QUERY COMPLETE          ┃');
        console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');
    }

    /**
     * Get fallback mythologies if Firebase fails
     */
    getFallbackMythologies() {
        console.log('📋 [HomeViewDebug] getFallbackMythologies() called');
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
     * Get loading HTML
     */
    getLoadingHTML() {
        return `
            <div class="loading-container">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">Loading mythologies from Firebase...</p>
                <p class="loading-submessage" style="color: #888; font-size: 0.9rem; margin-top: 0.5rem;">
                    Check console (F12) for detailed loading information
                </p>
            </div>
        `;
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
                max-width: 800px;
                margin: 0 auto;
                background: rgba(255, 0, 0, 0.1);
                border: 2px solid rgba(255, 0, 0, 0.3);
                border-radius: 16px;
            ">
                <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                <h1>Error Loading Home Page</h1>
                <p style="color: #ef4444; margin: 1rem 0; font-family: monospace;">
                    ${error.message}
                </p>
                <details style="text-align: left; margin: 2rem 0; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
                    <summary style="cursor: pointer; font-weight: bold;">Technical Details</summary>
                    <pre style="margin-top: 1rem; overflow-x: auto; font-size: 0.85rem;">${JSON.stringify(this.debugInfo, null, 2)}</pre>
                    <pre style="margin-top: 1rem; overflow-x: auto; font-size: 0.85rem;">${error.stack}</pre>
                </details>
                <button onclick="location.reload()" class="btn-primary">Reload Page</button>
                <p style="margin-top: 1rem; color: #888;">
                    Check browser console (F12) for detailed error information
                </p>
            </div>
        `;
    }

    /**
     * Render timeout error
     */
    renderTimeoutError(container) {
        container.innerHTML = `
            <div class="error-container" style="
                text-align: center;
                padding: 4rem 2rem;
                max-width: 800px;
                margin: 0 auto;
                background: rgba(255, 165, 0, 0.1);
                border: 2px solid rgba(255, 165, 0, 0.3);
                border-radius: 16px;
            ">
                <div style="font-size: 4rem; margin-bottom: 1rem;">⏰</div>
                <h1>Loading Timeout</h1>
                <p style="color: #ff9800; margin: 1rem 0;">
                    The page took too long to load. This usually indicates a Firebase connection issue.
                </p>
                <details style="text-align: left; margin: 2rem 0; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
                    <summary style="cursor: pointer; font-weight: bold;">Debug Information</summary>
                    <pre style="margin-top: 1rem; overflow-x: auto; font-size: 0.85rem;">${JSON.stringify(this.debugInfo, null, 2)}</pre>
                </details>
                <div style="margin-top: 2rem;">
                    <button onclick="location.reload()" class="btn-primary">Retry</button>
                </div>
                <p style="margin-top: 1rem; color: #888;">
                    Check browser console (F12) for detailed loading information
                </p>
            </div>
        `;
    }

    /**
     * Add debug panel to page
     */
    addDebugPanel(container) {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'home-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            padding: 1rem;
            border-radius: 8px;
            font-family: monospace;
            font-size: 0.85rem;
            max-width: 400px;
            z-index: 10000;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
            border: 1px solid #0f0;
        `;

        const statusIcon = this.debugInfo.firebaseSuccess ? '✅' :
                          this.debugInfo.fallbackUsed ? '⚠️' : '❌';

        debugPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong>🐛 Debug Info</strong>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: 1px solid #0f0;
                    color: #0f0;
                    cursor: pointer;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                ">✕</button>
            </div>
            <div style="line-height: 1.6;">
                <div>${statusIcon} Firebase: ${this.debugInfo.firebaseSuccess ? 'Connected' : 'Failed'}</div>
                <div>📊 Mythologies: ${this.debugInfo.totalMythologies}</div>
                <div>⏱️  Load time: ${this.debugInfo.loadDuration}ms</div>
                <div>🔄 Fallback: ${this.debugInfo.fallbackUsed ? 'Yes' : 'No'}</div>
                ${this.debugInfo.firebaseError ? `<div style="color: #f00;">❌ Error: ${this.debugInfo.firebaseError}</div>` : ''}
            </div>
        `;

        container.appendChild(debugPanel);
        console.log('🐛 [HomeViewDebug] Debug panel added to page');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const cards = document.querySelectorAll('.mythology-card');
        console.log('🔗 [HomeViewDebug] Found', cards.length, 'mythology cards');

        cards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                console.log(`🖱️  [HomeViewDebug] Hovering over card ${index + 1}:`, card.dataset.mythology);
            });
        });

        console.log('✅ [HomeViewDebug] Event listeners attached');
    }
}

// Export for use in SPA navigation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomeViewDebug;
}

console.log('✅ home-view-debug.js loaded successfully');
