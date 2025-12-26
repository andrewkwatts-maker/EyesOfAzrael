/**
 * Shader Theme Integration Example
 * Shows how to integrate shader backgrounds with the Eyes of Azrael theme system
 */

// Initialize the shader manager
const shaderManager = new ShaderThemeManager({
    intensity: 0.8,
    quality: 'high',
    adaptiveQuality: true
});

// Example 1: Basic activation with a specific theme
function activateShaderTheme(themeName) {
    shaderManager.activate(themeName);
}

// Example 2: Integration with existing theme picker
function integrateWithThemePicker() {
    // Listen for theme changes
    document.addEventListener('themeChanged', (event) => {
        const theme = event.detail.theme;

        // Map theme to shader type
        const shaderMap = {
            'greek': 'water',      // Greek mythology -> Ocean/Water
            'norse': 'night',      // Norse mythology -> Night sky
            'egyptian': 'light',   // Egyptian mythology -> Desert sun/light
            'hindu': 'fire',       // Hindu mythology -> Sacred fire
            'celtic': 'earth',     // Celtic mythology -> Earth/Forest
            'persian': 'fire',     // Persian mythology -> Sacred fire
            'chinese': 'night',    // Chinese mythology -> Night sky
            'babylonian': 'night', // Babylonian mythology -> Night sky
            'roman': 'light',      // Roman mythology -> Light
            'sumerian': 'earth',   // Sumerian mythology -> Earth
            'mayan': 'earth',      // Mayan mythology -> Forest/Earth
            'aztec': 'fire',       // Aztec mythology -> Fire
            'yoruba': 'earth',     // Yoruba mythology -> Earth
            'buddhist': 'light'    // Buddhist -> Enlightenment/Light
        };

        const shaderTheme = shaderMap[theme.toLowerCase()] || 'dark';
        shaderManager.activate(shaderTheme);
    });
}

// Example 3: Create UI controls
function createShaderControls() {
    const controlsHTML = `
        <div class="shader-controls">
            <button id="shaderToggle" class="active">Shaders: ON</button>

            <div class="shader-intensity-slider">
                <label>Intensity</label>
                <input type="range" id="shaderIntensity" min="0" max="100" value="80">
            </div>

            <div class="shader-info">
                <div>FPS: <span class="fps good" id="shaderFPS">60</span></div>
                <div>Quality: <span id="shaderQuality">High</span></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', controlsHTML);

    // Setup event listeners
    const toggleBtn = document.getElementById('shaderToggle');
    const intensitySlider = document.getElementById('shaderIntensity');
    const fpsDisplay = document.getElementById('shaderFPS');
    const qualityDisplay = document.getElementById('shaderQuality');

    toggleBtn.addEventListener('click', () => {
        const enabled = shaderManager.toggle();
        toggleBtn.textContent = enabled ? 'Shaders: ON' : 'Shaders: OFF';
        toggleBtn.classList.toggle('active', enabled);
    });

    intensitySlider.addEventListener('input', (e) => {
        shaderManager.setIntensity(e.target.value / 100);
    });

    // Update info display
    setInterval(() => {
        const status = shaderManager.getStatus();
        fpsDisplay.textContent = status.fps;
        fpsDisplay.className = status.fps < 30 ? 'fps low' : 'fps good';
        qualityDisplay.textContent = status.quality.charAt(0).toUpperCase() + status.quality.slice(1);
    }, 1000);
}

// Example 4: Respect user preferences
function respectUserPreferences() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log('[Shaders] Reduced motion preferred, disabling shaders');
        shaderManager.deactivate();
        return;
    }

    // Check for battery saver mode (if available)
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            if (battery.level < 0.2) {
                console.log('[Shaders] Low battery, reducing quality');
                shaderManager.settings.quality = 'low';
                shaderManager.handleResize();
            }
        });
    }

    // Save user preference
    const savedEnabled = localStorage.getItem('shadersEnabled');
    if (savedEnabled === 'false') {
        shaderManager.deactivate();
    }
}

// Example 5: Performance monitoring and warnings
function setupPerformanceMonitoring() {
    setInterval(() => {
        const status = shaderManager.getStatus();

        if (status.fps < 20) {
            showPerformanceWarning();
        }
    }, 5000);
}

function showPerformanceWarning() {
    const warning = document.createElement('div');
    warning.className = 'shader-performance-warning';
    warning.innerHTML = `
        <strong>Low Performance Detected</strong>
        <p>Shader effects may be impacting performance. Would you like to disable them?</p>
        <button onclick="disableShaders()">Disable Shaders</button>
        <button onclick="this.parentElement.remove()">Keep Enabled</button>
    `;
    document.body.appendChild(warning);

    setTimeout(() => {
        if (warning.parentElement) {
            warning.remove();
        }
    }, 10000);
}

function disableShaders() {
    shaderManager.deactivate();
    localStorage.setItem('shadersEnabled', 'false');
    document.querySelector('.shader-performance-warning')?.remove();
}

// Example 6: Complete initialization with error handling
function initializeShaderSystem() {
    try {
        // Check WebGL support
        if (!shaderManager.webglSupported) {
            console.warn('[Shaders] WebGL not supported, using CSS fallbacks');
            document.body.classList.add('no-webgl');
            return;
        }

        // Integrate with theme system
        integrateWithThemePicker();

        // Create UI controls
        createShaderControls();

        // Respect user preferences
        respectUserPreferences();

        // Setup performance monitoring
        setupPerformanceMonitoring();

        // Activate default theme
        shaderManager.activate('dark');

        console.log('[Shaders] System initialized successfully');
    } catch (error) {
        console.error('[Shaders] Initialization error:', error);
        document.body.classList.add('no-webgl');
    }
}

// Example 7: Clean shutdown
function shutdownShaderSystem() {
    shaderManager.destroy();
    document.querySelector('.shader-controls')?.remove();
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ShaderIntegration = {
        init: initializeShaderSystem,
        shutdown: shutdownShaderSystem,
        manager: shaderManager,
        activateTheme: activateShaderTheme,
        createControls: createShaderControls
    };
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeShaderSystem);
} else {
    initializeShaderSystem();
}
