# Shader System Integration Guide for Eyes of Azrael

## Step-by-Step Integration

### Step 1: Add CSS to index.html

Add this line to the `<head>` section of `index.html`, after the existing theme CSS:

```html
<!-- Existing theme CSS -->
<link rel="stylesheet" href="themes/theme-base.css">

<!-- Add shader backgrounds CSS -->
<link rel="stylesheet" href="css/shader-backgrounds.css">
```

### Step 2: Add JavaScript to index.html

Add this line before the closing `</body>` tag, after Firebase initialization but before app initialization:

```html
<!-- Firebase Config and Initialization -->
<script src="firebase-config.js"></script>
<script src="js/firebase-init.js"></script>

<!-- Add Shader System -->
<script src="js/shaders/shader-themes.js"></script>

<!-- Core Scripts -->
<script src="js/seo-manager.js"></script>
```

### Step 3: Initialize Shader Manager

Add this code inside the `initApp()` function in `index.html`, after the router is initialized:

```javascript
// Initialize router
const router = new DynamicRouter({
    viewContainer: document.getElementById('main-content'),
    breadcrumbContainer: document.getElementById('breadcrumb-nav')
});

// ADD THIS: Initialize shader manager
let shaderManager = null;
if (typeof ShaderThemeManager !== 'undefined') {
    shaderManager = new ShaderThemeManager({
        intensity: 0.7, // Subtle by default
        quality: 'high',
        adaptiveQuality: true
    });

    // Activate default theme
    shaderManager.activate('dark');
}
```

### Step 4: Connect to Route Changes (Optional)

If you want different shaders for different mythologies, add this code:

```javascript
// Map mythology routes to shader themes
const mythologyShaderMap = {
    'greek': 'water',
    'norse': 'night',
    'egyptian': 'light',
    'hindu': 'fire',
    'celtic': 'earth',
    'persian': 'fire',
    'chinese': 'night',
    'babylonian': 'night',
    'roman': 'light',
    'sumerian': 'earth',
    'mayan': 'earth',
    'aztec': 'fire',
    'yoruba': 'earth',
    'buddhist': 'light',
    'christian': 'light'
};

// Listen for route changes
window.addEventListener('hashchange', () => {
    if (!shaderManager) return;

    const hash = window.location.hash;
    const match = hash.match(/^#\/([^\/]+)/);

    if (match) {
        const mythology = match[1].toLowerCase();
        const shader = mythologyShaderMap[mythology];

        if (shader) {
            shaderManager.activate(shader);
        }
    }
});
```

### Step 5: Add User Controls (Optional)

Add a shader toggle button to the header:

```html
<div class="header-actions">
    <!-- Existing theme toggle -->
    <button id="themeToggle" class="icon-btn" aria-label="Toggle theme">
        🌙
    </button>

    <!-- Add shader toggle -->
    <button id="shaderToggle" class="icon-btn" aria-label="Toggle shader effects">
        ✨
    </button>

    <!-- Rest of header actions... -->
</div>
```

Then add this JavaScript:

```javascript
// Setup shader toggle
function setupShaderToggle() {
    const shaderToggle = document.getElementById('shaderToggle');
    if (!shaderToggle || !shaderManager) return;

    // Get saved preference
    const savedEnabled = localStorage.getItem('shadersEnabled');
    if (savedEnabled === 'false') {
        shaderManager.deactivate();
        shaderToggle.style.opacity = '0.5';
    }

    shaderToggle.addEventListener('click', () => {
        const enabled = shaderManager.toggle();
        localStorage.setItem('shadersEnabled', enabled);
        shaderToggle.style.opacity = enabled ? '1' : '0.5';
    });
}

// Call after shaderManager is initialized
setupShaderToggle();
```

## Complete Integration Example

Here's a complete example showing all the pieces together:

```javascript
(async function initApp() {
    'use strict';

    console.log('[App] Initializing Eyes of Azrael Dynamic SPA...');

    // Wait for Firebase...
    await new Promise(resolve => {
        // Firebase initialization code...
    });

    const db = firebase.firestore();

    // Initialize router
    const router = new DynamicRouter({
        viewContainer: document.getElementById('main-content'),
        breadcrumbContainer: document.getElementById('breadcrumb-nav')
    });

    // Initialize shader system
    let shaderManager = null;
    if (typeof ShaderThemeManager !== 'undefined') {
        shaderManager = new ShaderThemeManager({
            intensity: 0.7,
            quality: 'high',
            adaptiveQuality: true
        });

        // Activate default theme
        shaderManager.activate('dark');

        // Map mythologies to shaders
        const mythologyShaderMap = {
            'greek': 'water',
            'norse': 'night',
            'egyptian': 'light',
            'hindu': 'fire',
            'celtic': 'earth',
            'persian': 'fire',
            'chinese': 'night',
            'babylonian': 'night',
            'roman': 'light',
            'sumerian': 'earth',
            'mayan': 'earth',
            'aztec': 'fire',
            'yoruba': 'earth',
            'buddhist': 'light'
        };

        // Listen for route changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            const match = hash.match(/^#\/([^\/]+)/);

            if (match) {
                const mythology = match[1].toLowerCase();
                const shader = mythologyShaderMap[mythology];
                if (shader) {
                    shaderManager.activate(shader);
                }
            } else {
                // Default to dark on home page
                shaderManager.activate('dark');
            }
        });

        // Respect user preferences
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            shaderManager.deactivate();
        }

        // Check saved preference
        if (localStorage.getItem('shadersEnabled') === 'false') {
            shaderManager.deactivate();
        }
    }

    // Register view components...
    const mythologyBrowser = new MythologyBrowser({ db, router });
    // ... rest of initialization

    // Setup shader toggle button
    function setupShaderToggle() {
        const shaderToggle = document.getElementById('shaderToggle');
        if (!shaderToggle || !shaderManager) return;

        const savedEnabled = localStorage.getItem('shadersEnabled');
        if (savedEnabled === 'false') {
            shaderToggle.style.opacity = '0.5';
        }

        shaderToggle.addEventListener('click', () => {
            const enabled = shaderManager.toggle();
            localStorage.setItem('shadersEnabled', enabled);
            shaderToggle.style.opacity = enabled ? '1' : '0.5';
        });
    }

    setupAuthUI();
    setupThemeToggle();
    setupShaderToggle(); // Add this

    console.log('[App] Initialization complete');
})();
```

## Testing

1. **Open shader-test.html** in a browser to verify all shaders work
2. **Open shader-demo.html** to see interactive demo
3. **Test on mobile** to verify performance
4. **Test with reduced motion** preference enabled
5. **Test WebGL fallback** by disabling WebGL in browser

## Performance Tips

1. **Mobile devices**: The system automatically reduces quality on mobile
2. **Low FPS**: If you notice low FPS, reduce intensity or quality:
   ```javascript
   shaderManager.setIntensity(0.5);
   // or
   shaderManager.settings.quality = 'medium';
   shaderManager.handleResize();
   ```
3. **Battery saver**: Consider disabling on low battery
4. **User preference**: Always respect user's choice to disable

## Troubleshooting

**Problem**: Shaders not appearing
- Check browser console for errors
- Verify WebGL support: `console.log(shaderManager.webglSupported)`
- Check shader files are accessible (Network tab)

**Problem**: Low performance
- Check FPS: `console.log(shaderManager.getStatus().fps)`
- Try lower quality: `shaderManager.settings.quality = 'low'`
- Reduce intensity: `shaderManager.setIntensity(0.5)`

**Problem**: Conflicts with existing CSS
- Check z-index of shader canvas (should be -1)
- Verify panel backgrounds have proper opacity
- Check backdrop-filter is supported

## Customization

### Change Default Intensity
```javascript
shaderManager = new ShaderThemeManager({
    intensity: 0.5 // 50% intensity
});
```

### Change Mythology Mapping
```javascript
const mythologyShaderMap = {
    'greek': 'water',    // Change to 'night' if you prefer
    'norse': 'night',
    // ... customize as needed
};
```

### Add Custom Shader
1. Create new `.glsl` file in `js/shaders/`
2. Add to `themeShaders` in `shader-themes.js`
3. Use like any other theme: `shaderManager.activate('custom')`

## Support

See full documentation in:
- `SHADER_SYSTEM_DOCUMENTATION.md` - Complete API reference
- `SHADER_QUICK_START.md` - Quick reference
- `js/shaders/README.md` - Shader directory overview

## Demo Pages

- `shader-test.html` - Diagnostic test page
- `shader-demo.html` - Interactive demo with all themes
