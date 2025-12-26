/**
 * Main Application Initialization
 * Integrates Auth, Navigation, Search, and Shaders
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
        db: null
    };

    /**
     * Initialize Firebase and app components
     */
    async function initializeApp() {
        console.log('Initializing Eyes of Azrael...');

        try {
            // Initialize Firebase
            const app = firebase.initializeApp(firebaseConfig);
            window.EyesOfAzrael.db = firebase.firestore();

            // Initialize Authentication Manager
            console.log('Setting up authentication...');
            window.EyesOfAzrael.auth = new AuthManager(app);

            // Wait for auth state
            await waitForAuth();

            // User is authenticated, initialize app components
            console.log('Initializing app components...');

            // Initialize Universal Display Renderer
            window.EyesOfAzrael.renderer = new UniversalDisplayRenderer({
                enableHover: true,
                enableExpand: true,
                enableCorpusLinks: true
            });

            // Initialize SPA Navigation
            window.EyesOfAzrael.navigation = new SPANavigation(
                window.EyesOfAzrael.db,
                window.EyesOfAzrael.auth,
                window.EyesOfAzrael.renderer
            );

            // Initialize Corpus Search
            window.EyesOfAzrael.search = new EnhancedCorpusSearch(window.EyesOfAzrael.db);

            // Initialize Shader Theme Manager
            console.log('Initializing shader themes...');
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

            console.log('App initialized successfully!');

            // Prefetch popular entities
            window.EyesOfAzrael.search.prefetchPopularEntities().catch(console.error);

        } catch (error) {
            console.error('App initialization error:', error);
            showInitError(error);
        }
    }

    /**
     * Wait for authentication
     */
    function waitForAuth() {
        return new Promise((resolve, reject) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    console.log('User authenticated:', user.displayName);
                    resolve(user);
                    unsubscribe();
                } else {
                    console.log('User not authenticated, redirecting to login...');
                    // Allow a brief moment for redirect result
                    setTimeout(() => {
                        if (!firebase.auth().currentUser) {
                            window.location.href = '/login.html';
                        }
                    }, 500);
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
            theme = 'water';
        } else if (hash.includes('norse')) {
            theme = 'night';
        } else if (hash.includes('egyptian')) {
            theme = 'day';
        } else if (hash.includes('hindu') || hash.includes('buddhist')) {
            theme = 'order';
        } else if (hash.includes('celtic')) {
            theme = 'earth';
        } else if (hash.includes('babylonian') || hash.includes('sumerian')) {
            theme = 'chaos';
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
            let isDark = localStorage.getItem('darkMode') === 'true';

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
     * Show initialization error
     */
    function showInitError(error) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-container">
                    <h1>Initialization Error</h1>
                    <p>${error.message}</p>
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
            db: window.EyesOfAzrael.db
        };
    };

    console.log('App initialization script loaded. Use debugApp() for debugging.');
})();
