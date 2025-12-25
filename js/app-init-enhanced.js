/**
 * Enhanced Application Initialization
 * Integrates Auth, Navigation, Search, Shaders, and CRUD
 */

(function() {
    'use strict';

    // Global app state
    window.EyesOfAzrael = {
        auth: null,
        navigation: null,
        search: null,
        renderer: null,
        shaders: null,
        db: null,
        crudManager: null,
        dashboard: null
    };

    /**
     * Initialize Firebase and app components
     */
    async function initializeApp() {
        console.log('[App] Initializing Eyes of Azrael...');

        try {
            // Initialize Firebase
            const app = firebase.initializeApp(firebaseConfig);
            window.EyesOfAzrael.db = firebase.firestore();

            // Initialize Authentication Manager
            console.log('[App] Setting up authentication...');
            window.EyesOfAzrael.auth = new AuthManager(app);

            // Wait for auth state (optional for testing, can be made required)
            const user = await waitForAuth();

            // Initialize app components
            console.log('[App] Initializing app components...');

            // Initialize CRUD Manager
            window.EyesOfAzrael.crudManager = new FirebaseCRUDManager(
                window.EyesOfAzrael.db,
                firebase.auth()
            );

            // Initialize Universal Display Renderer
            window.EyesOfAzrael.renderer = new UniversalDisplayRenderer({
                enableHover: true,
                enableExpand: true,
                enableCorpusLinks: true,
                crudManager: window.EyesOfAzrael.crudManager
            });

            // Initialize SPA Navigation
            window.EyesOfAzrael.navigation = new SPANavigation(
                window.EyesOfAzrael.db,
                window.EyesOfAzrael.auth,
                window.EyesOfAzrael.renderer
            );

            // Register dashboard route
            window.EyesOfAzrael.navigation.registerRoute('dashboard', async () => {
                if (!window.EyesOfAzrael.dashboard) {
                    window.EyesOfAzrael.dashboard = new UserDashboard({
                        crudManager: window.EyesOfAzrael.crudManager,
                        auth: firebase.auth()
                    });
                }

                const html = await window.EyesOfAzrael.dashboard.render();
                const container = document.getElementById('main-content');
                container.innerHTML = html;
                window.EyesOfAzrael.dashboard.initialize(container.querySelector('.user-dashboard'));
            });

            // Initialize Corpus Search
            window.EyesOfAzrael.search = new EnhancedCorpusSearch(window.EyesOfAzrael.db);

            // Initialize Shader Theme Manager
            console.log('[App] Initializing shader themes...');
            window.EyesOfAzrael.shaders = new ShaderThemeManager({
                quality: 'auto',
                targetFPS: 60,
                enableStats: false
            });

            // Auto-activate shader based on current mythology or time of day
            activateAutoShader();

            // Setup auth UI handlers
            window.EyesOfAzrael.auth.initAuthUI();

            // Setup theme controls
            setupThemeControls();

            // Setup CRUD action handlers
            setupCRUDHandlers();

            console.log('[App] Initialization complete!');

            // Prefetch popular entities
            window.EyesOfAzrael.search.prefetchPopularEntities().catch(console.error);

        } catch (error) {
            console.error('[App] Initialization error:', error);
            showInitError(error);
        }
    }

    /**
     * Wait for authentication
     * Optional: Remove timeout to make authentication required
     */
    function waitForAuth() {
        return new Promise((resolve, reject) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    console.log('[App] User authenticated:', user.displayName);
                    resolve(user);
                    unsubscribe();
                } else {
                    console.log('[App] No user authenticated');
                    // Optional: Uncomment to require authentication
                    // setTimeout(() => {
                    //     if (!firebase.auth().currentUser) {
                    //         window.location.href = '/login.html';
                    //     }
                    // }, 500);

                    // Allow browsing without auth
                    resolve(null);
                    unsubscribe();
                }
            });
        });
    }

    /**
     * Auto-activate shader based on context
     */
    function activateAutoShader() {
        // Check if user has saved theme preference
        const savedTheme = localStorage.getItem('preferredShaderTheme');
        if (savedTheme) {
            window.EyesOfAzrael.shaders.activate(savedTheme);
            return;
        }

        // Auto-detect based on current route
        const hash = window.location.hash;
        let theme = null;

        if (hash.includes('greek')) {
            theme = 'light';
        } else if (hash.includes('norse')) {
            theme = 'night';
        } else if (hash.includes('egyptian')) {
            theme = 'order';
        } else if (hash.includes('hindu')) {
            theme = 'fire';
        } else if (hash.includes('buddhist')) {
            theme = 'order';
        } else if (hash.includes('celtic')) {
            theme = 'earth';
        } else if (hash.includes('babylonian') || hash.includes('sumerian')) {
            theme = 'chaos';
        } else if (hash.includes('chinese')) {
            theme = 'air';
        } else if (hash.includes('japanese') || hash.includes('polynesian')) {
            theme = 'water';
        } else {
            // Default to time-based
            const hour = new Date().getHours();
            if (hour >= 6 && hour < 18) {
                theme = 'day';
            } else {
                theme = 'night';
            }
        }

        window.EyesOfAzrael.shaders.activate(theme, {
            intensity: 0.7,
            speed: 1.0
        });
    }

    /**
     * Setup theme controls
     */
    function setupThemeControls() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            let isDark = localStorage.getItem('darkMode') !== 'false';

            const updateTheme = () => {
                if (isDark) {
                    document.body.classList.add('dark-mode');
                    themeToggle.textContent = '☀️';
                } else {
                    document.body.classList.remove('dark-mode');
                    themeToggle.textContent = '🌙';
                }
                localStorage.setItem('darkMode', isDark);
            };

            themeToggle.addEventListener('click', () => {
                isDark = !isDark;
                updateTheme();
            });

            updateTheme();
        }

        // Shader controls menu (if exists)
        const shaderMenu = document.getElementById('shader-menu');
        if (shaderMenu) {
            const themes = [
                { id: 'water', name: 'Water', icon: '🌊' },
                { id: 'fire', name: 'Fire', icon: '🔥' },
                { id: 'night', name: 'Night', icon: '🌙' },
                { id: 'day', name: 'Day', icon: '☀️' },
                { id: 'earth', name: 'Earth', icon: '🌿' },
                { id: 'air', name: 'Air', icon: '💨' },
                { id: 'light', name: 'Light', icon: '✨' },
                { id: 'dark', name: 'Dark', icon: '🌑' },
                { id: 'order', name: 'Order', icon: '⚜️' },
                { id: 'chaos', name: 'Chaos', icon: '🕳️' }
            ];

            shaderMenu.innerHTML = themes.map(theme => `
                <button class="shader-theme-btn" data-theme="${theme.id}">
                    ${theme.icon} ${theme.name}
                </button>
            `).join('');

            shaderMenu.addEventListener('click', (e) => {
                if (e.target.classList.contains('shader-theme-btn')) {
                    const theme = e.target.dataset.theme;
                    window.EyesOfAzrael.shaders.activate(theme);
                    localStorage.setItem('preferredShaderTheme', theme);
                }
            });
        }
    }

    /**
     * Setup CRUD action handlers
     */
    function setupCRUDHandlers() {
        // Listen for global CRUD actions (edit, delete buttons on entity panels)
        document.addEventListener('click', async (e) => {
            const action = e.target.closest('[data-crud-action]');
            if (!action) return;

            const actionType = action.dataset.crudAction;
            const collection = action.dataset.collection;
            const entityId = action.dataset.entityId;

            switch (actionType) {
                case 'edit':
                    await handleEditEntity(collection, entityId);
                    break;

                case 'delete':
                    await handleDeleteEntity(collection, entityId);
                    break;

                case 'create':
                    await handleCreateEntity(collection);
                    break;
            }
        });
    }

    /**
     * Handle edit entity
     * @param {string} collection - Collection name
     * @param {string} entityId - Entity ID
     */
    async function handleEditEntity(collection, entityId) {
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('Please sign in to edit entities', 'error');
            return;
        }

        // Create form modal
        const modal = document.createElement('div');
        modal.className = 'form-overlay';
        document.body.appendChild(modal);

        const form = new EntityForm({
            crudManager: window.EyesOfAzrael.crudManager,
            collection,
            entityId,
            onSuccess: async (result) => {
                modal.remove();
                showToast('Entity updated successfully!', 'success');

                // Refresh current view
                if (window.EyesOfAzrael.navigation) {
                    await window.EyesOfAzrael.navigation.navigate(window.location.hash);
                }
            },
            onCancel: () => {
                modal.remove();
            }
        });

        const html = await form.render();
        modal.innerHTML = html;
        const formElement = modal.querySelector('.entity-form-container');
        form.initialize(formElement);
    }

    /**
     * Handle delete entity
     * @param {string} collection - Collection name
     * @param {string} entityId - Entity ID
     */
    async function handleDeleteEntity(collection, entityId) {
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('Please sign in to delete entities', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this entity?')) {
            return;
        }

        const result = await window.EyesOfAzrael.crudManager.delete(collection, entityId);

        if (result.success) {
            showToast('Entity deleted successfully', 'success');

            // Refresh current view
            if (window.EyesOfAzrael.navigation) {
                await window.EyesOfAzrael.navigation.navigate(window.location.hash);
            }
        } else {
            showToast(`Failed to delete: ${result.error}`, 'error');
        }
    }

    /**
     * Handle create entity
     * @param {string} collection - Collection name
     */
    async function handleCreateEntity(collection) {
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('Please sign in to create entities', 'error');
            return;
        }

        // Create form modal
        const modal = document.createElement('div');
        modal.className = 'form-overlay';
        document.body.appendChild(modal);

        const form = new EntityForm({
            crudManager: window.EyesOfAzrael.crudManager,
            collection,
            onSuccess: async (result) => {
                modal.remove();
                showToast('Entity created successfully!', 'success');

                // Navigate to new entity
                if (window.EyesOfAzrael.navigation && result.id) {
                    const categoryType = collection.slice(0, -1);
                    await window.EyesOfAzrael.navigation.navigate(`#/entity/${collection}/${result.id}`);
                }
            },
            onCancel: () => {
                modal.remove();
            }
        });

        const html = await form.render();
        modal.innerHTML = html;
        const formElement = modal.querySelector('.entity-form-container');
        form.initialize(formElement);
    }

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Type (success, error, info)
     */
    function showToast(message, type = 'info') {
        if (window.toast) {
            window.toast[type](message);
        } else {
            console.log(`[Toast ${type}]`, message);
            alert(message);
        }
    }

    /**
     * Show initialization error
     */
    function showInitError(error) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <h1>Initialization Error</h1>
                    <p class="error-message">${error.message}</p>
                    <button onclick="location.reload()" class="btn-primary">Reload Page</button>
                </div>
            `;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

    // Handle navigation updates for shader theme
    window.addEventListener('hashchange', () => {
        // Auto-switch shader based on mythology if no saved preference
        if (!localStorage.getItem('preferredShaderTheme')) {
            activateAutoShader();
        }
    });

    // Expose global functions for debugging
    window.debugApp = function() {
        return {
            auth: window.EyesOfAzrael.auth,
            navigation: window.EyesOfAzrael.navigation,
            search: window.EyesOfAzrael.search,
            renderer: window.EyesOfAzrael.renderer,
            shaders: window.EyesOfAzrael.shaders,
            db: window.EyesOfAzrael.db,
            crudManager: window.EyesOfAzrael.crudManager,
            dashboard: window.EyesOfAzrael.dashboard
        };
    };

    // Expose CRUD functions globally for console access
    window.createEntity = async (collection) => {
        await handleCreateEntity(collection);
    };

    window.editEntity = async (collection, id) => {
        await handleEditEntity(collection, id);
    };

    window.deleteEntity = async (collection, id) => {
        await handleDeleteEntity(collection, id);
    };

    console.log('[App] Initialization script loaded');
    console.log('[App] Debug: Use debugApp() to inspect app state');
    console.log('[App] CRUD: Use createEntity(collection), editEntity(collection, id), deleteEntity(collection, id)');
})();
