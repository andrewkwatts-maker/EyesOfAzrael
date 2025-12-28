/**
 * Simple Application Initialization
 * Ensures proper loading order and error handling
 */

(async function() {
    'use strict';

    console.log('[App] Starting initialization...');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded');
        }

        // Initialize Firebase if not already initialized
        let app;
        if (firebase.apps.length === 0) {
            if (typeof firebaseConfig === 'undefined') {
                throw new Error('Firebase config not found');
            }
            app = firebase.initializeApp(firebaseConfig);
            console.log('[App] Firebase initialized');
        } else {
            app = firebase.app();
            console.log('[App] Using existing Firebase app');
        }

        // Get Firebase services
        const db = firebase.firestore();
        const auth = firebase.auth();

        console.log('[App] Firebase services ready');

        // Make services available globally
        window.EyesOfAzrael = window.EyesOfAzrael || {};
        window.EyesOfAzrael.db = db;
        window.EyesOfAzrael.firebaseAuth = auth;

        // Check if AuthManager exists
        if (typeof AuthManager !== 'undefined') {
            window.EyesOfAzrael.auth = new AuthManager(app);
            console.log('[App] AuthManager initialized');
        } else {
            console.warn('[App] AuthManager not found, skipping');
        }

        // Check if FirebaseCRUDManager exists
        if (typeof FirebaseCRUDManager !== 'undefined') {
            window.EyesOfAzrael.crudManager = new FirebaseCRUDManager(db, auth);
            console.log('[App] CRUD Manager initialized');
        } else {
            console.warn('[App] FirebaseCRUDManager not found, skipping');
        }

        // Check if UniversalDisplayRenderer exists
        if (typeof UniversalDisplayRenderer !== 'undefined') {
            window.EyesOfAzrael.renderer = new UniversalDisplayRenderer({
                enableHover: true,
                enableExpand: true,
                enableCorpusLinks: true
            });
            console.log('[App] Renderer initialized');
        } else {
            console.warn('[App] UniversalDisplayRenderer not found, skipping');
        }

        // Check if SPANavigation exists
        if (typeof SPANavigation !== 'undefined' && window.EyesOfAzrael.renderer) {
            window.EyesOfAzrael.navigation = new SPANavigation(
                db,
                window.EyesOfAzrael.auth,
                window.EyesOfAzrael.renderer
            );
            console.log('[App] Navigation initialized');
        } else {
            console.warn('[App] SPANavigation not found, skipping');
        }

        // Check if EnhancedCorpusSearch exists
        if (typeof EnhancedCorpusSearch !== 'undefined') {
            window.EyesOfAzrael.search = new EnhancedCorpusSearch(db);
            console.log('[App] Search initialized');
        } else {
            console.warn('[App] EnhancedCorpusSearch not found, skipping');
        }

        // Check if ShaderThemeManager exists
        if (typeof ShaderThemeManager !== 'undefined') {
            window.EyesOfAzrael.shaders = new ShaderThemeManager({
                quality: 'auto',
                targetFPS: 60
            });
            console.log('[App] Shaders initialized');

            // Auto-activate shader
            const hour = new Date().getHours();
            const theme = (hour >= 6 && hour < 18) ? 'day' : 'night';
            window.EyesOfAzrael.shaders.activate(theme);
        } else {
            console.warn('[App] ShaderThemeManager not found, skipping');
        }

        // Setup auth UI if auth manager exists
        if (window.EyesOfAzrael.auth) {
            setupAuthUI(auth);
        }

        // Setup simple theme toggle (removed - now handled by simple-theme-toggle.js)
        // Note: SimpleThemeToggle will auto-initialize when loaded

        // Setup global error tracking
        setupErrorTracking();

        // Setup global edit icon handler
        setupEditIconHandler();

        console.log('[App] Initialization complete');

        // Emit app-initialized event
        document.dispatchEvent(new CustomEvent('app-initialized'));

        // Don't hide loading immediately - wait for content to render
        // This prevents blank white screen before SPANavigation renders content
        // const loadingContainer = document.querySelector('.loading-container');
        // if (loadingContainer) {
        //     loadingContainer.style.display = 'none';
        // }

        // Listen for first render complete from SPANavigation
        document.addEventListener('first-render-complete', () => {
            console.log('[App Init] First render complete, hiding loading container');
            const loadingContainer = document.querySelector('.loading-container');
            if (loadingContainer) {
                // Smooth fade-out transition
                loadingContainer.style.opacity = '0';
                loadingContainer.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    loadingContainer.style.display = 'none';
                    console.log('[App Init] Loading container hidden');
                }, 300);
            }
        }, { once: true }); // Use once to ensure it only fires once

    } catch (error) {
        console.error('[App] ❌ Initialization error:', error);
        showError(error);
    }

    /**
     * Setup authentication UI
     */
    function setupAuthUI(auth) {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const signOutBtn = document.getElementById('signOutBtn');

        if (!userInfo) return;

        auth.onAuthStateChanged((user) => {
            if (user) {
                userInfo.style.display = 'flex';
                userName.textContent = user.displayName || user.email;
                if (userAvatar && user.photoURL) {
                    userAvatar.src = user.photoURL;
                }
            } else {
                userInfo.style.display = 'none';
            }
        });

        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                try {
                    await auth.signOut();
                } catch (error) {
                    console.error('[Auth] Sign out error:', error);
                }
            });
        }
    }

    /**
     * REMOVED: setupThemeToggle() function
     * Now handled by js/simple-theme-toggle.js
     * See SimpleThemeToggle class for new implementation
     */

    /**
     * Setup global error tracking
     */
    function setupErrorTracking() {
        // Track uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            if (window.AnalyticsManager) {
                window.AnalyticsManager.trackCustomError(event.error || new Error(event.message), {
                    fatal: true,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    type: 'javascript_error'
                });
            }
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            if (window.AnalyticsManager) {
                window.AnalyticsManager.trackCustomError(
                    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
                    {
                        fatal: false,
                        type: 'unhandled_promise_rejection'
                    }
                );
            }
        });

        console.log('[App] Global error tracking enabled');
    }

    /**
     * Setup global edit icon click handler
     */
    function setupEditIconHandler() {
        // Wire up edit icons globally using event delegation
        document.addEventListener('click', async (e) => {
            // Check if click was on edit icon button or inside it
            const editBtn = e.target.matches('.edit-icon-btn')
                ? e.target
                : e.target.closest('.edit-icon-btn');

            if (!editBtn) return;

            // Stop propagation to prevent card navigation
            e.preventDefault();
            e.stopPropagation();

            const entityId = editBtn.dataset.entityId;
            const collection = editBtn.dataset.collection;

            if (!entityId || !collection) {
                console.error('[EditIcon] Missing entity ID or collection');
                return;
            }

            // Check if EditEntityModal is available
            if (typeof EditEntityModal === 'undefined') {
                console.error('[EditIcon] EditEntityModal not loaded');
                alert('Edit functionality not available. Please ensure all scripts are loaded.');
                return;
            }

            // Check if CRUD manager is available
            if (!window.EyesOfAzrael || !window.EyesOfAzrael.crudManager) {
                console.error('[EditIcon] CRUD Manager not initialized');
                alert('Edit functionality not available. Please ensure the app is properly initialized.');
                return;
            }

            // Open edit modal
            try {
                const modal = new EditEntityModal(window.EyesOfAzrael.crudManager);
                await modal.open(entityId, collection);
            } catch (error) {
                console.error('[EditIcon] Error opening edit modal:', error);
                alert('Failed to open edit modal: ' + error.message);
            }
        });

        console.log('[App] Global edit icon handler initialized');
    }

    /**
     * Show error message
     */
    function showError(error) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-container" style="
                    text-align: center;
                    padding: 3rem;
                    max-width: 600px;
                    margin: 0 auto;
                ">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                    <h1>Initialization Error</h1>
                    <p style="color: #ef4444; margin: 1rem 0;">${error.message}</p>
                    <button onclick="location.reload()" class="btn-primary">Reload Page</button>
                </div>
            `;
        }
    }

    // Expose debug function
    window.debugApp = function() {
        return window.EyesOfAzrael || {};
    };

})();
