# Shader Patterns Documentation

Complete reference for applying shader effects to panels, backgrounds, and UI components in Eyes of Azrael.

## Table of Contents
1. [Overview](#overview)
2. [Core Pattern: Full-Screen Background](#core-pattern-full-screen-background)
3. [Panel Shader Integration](#panel-shader-integration)
4. [Component Patterns](#component-patterns)
5. [HTML Patterns](#html-patterns)
6. [CSS Patterns](#css-patterns)
7. [JavaScript Patterns](#javascript-patterns)
8. [Advanced Patterns](#advanced-patterns)
9. [Best Practices](#best-practices)

---

## Overview

The shader system consists of:
- **WebGL Canvas**: Full-screen shader background (`#shader-background`)
- **Glass-morphism Panels**: Semi-transparent panels that sit above shaders
- **Theme Integration**: Mythology-specific shader themes
- **Performance Management**: Adaptive quality and FPS monitoring

### Available Shaders

| Shader | File | Effect | Best For |
|--------|------|--------|----------|
| Water | `water-shader.glsl` | Waves, caustics, bubbles | Greek, Norse |
| Fire | `fire-shader.glsl` | Flames, embers | Hindu, Persian, Aztec |
| Night | `night-shader.glsl` | Stars, aurora | Chinese, Babylonian |
| Earth | `earth-shader.glsl` | Organic patterns, particles | Celtic, Sumerian, Mayan |
| Light | `light-shader.glsl` | Glowing particles, rays | Egyptian, Buddhist, Roman |
| Dark | `dark-shader.glsl` | Shadows, dark particles | Default, underworld |
| Day | `day-shader.glsl` | Sunlight, clouds | Daytime themes |
| Air | `air-shader.glsl` | Wind, flowing air | Air element |
| Chaos | `chaos-shader.glsl` | Swirling chaos, void | Chaos/void themes |
| Order | `order-shader.glsl` | Sacred geometry, divine patterns | Divine/angelic themes |

---

## Core Pattern: Full-Screen Background

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Required CSS -->
    <link rel="stylesheet" href="css/shader-backgrounds.css">
    <link rel="stylesheet" href="css/panel-shaders.css">
</head>
<body>
    <!-- Shader canvas (auto-created by shader manager) -->
    <!-- Content panels go here -->

    <!-- Required JavaScript -->
    <script src="js/shaders/shader-themes.js"></script>
    <script>
        // Initialize shader system
        const shaderManager = new ShaderThemeManager({
            intensity: 0.8,
            quality: 'high',
            adaptiveQuality: true
        });

        // Activate theme
        shaderManager.activate('water');
    </script>
</body>
</html>
```

### What Happens
1. `ShaderThemeManager` creates a `<canvas id="shader-background">` element
2. Canvas is positioned fixed at z-index: -1 (behind all content)
3. WebGL shader renders continuously at 60fps
4. Canvas auto-resizes with window

---

## Panel Shader Integration

### Pattern 1: Glass-Morphism Panel (Most Common)

**When to use**: Content cards, deity panels, search results

```html
<div class="glass-card">
    <h2>Panel Title</h2>
    <p>Content that sits above the shader background</p>
</div>
```

**CSS Applied** (from `panel-shaders.css`):
```css
.glass-card {
    background: rgba(26, 31, 58, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(139, 127, 255, 0.3);
    border-radius: var(--radius-xl);
    padding: var(--spacing-lg);
}
```

**Key Features**:
- Semi-transparent background (85% opacity)
- Backdrop blur creates frosted glass effect
- Shader visible through panel
- Readable text with proper contrast

### Pattern 2: Entity Panel

**When to use**: Individual deity/hero/creature displays

```html
<div class="entity-panel" data-mythology="greek">
    <div class="entity-panel-header">
        <span class="entity-icon">⚡</span>
        <h2>Zeus</h2>
    </div>
    <div class="panel-section">
        <h3 class="panel-section-title">Description</h3>
        <p>King of the gods...</p>
    </div>
</div>
```

**CSS Features**:
- Mythology-specific accent colors
- Hover effects that complement shaders
- Section dividers
- Icon integration

### Pattern 3: Detail Panel

**When to use**: Full-page entity details

```html
<div class="detail-panel">
    <div class="entity-icon">⚡</div>
    <h1 class="entity-name">Zeus</h1>
    <p class="entity-subtitle">King of the Gods</p>

    <div class="panel-section">
        <!-- Content sections -->
    </div>
</div>
```

**CSS Features**:
- Centered layout
- Large iconic representation
- Gradient text effects
- Organized sections

---

## Component Patterns

### Pattern 4: Mythology Card Grid

```html
<div class="entity-grid">
    <div class="mythology-card" data-mythology="greek">
        <h3>Greek Mythology</h3>
        <p>Explore the pantheon...</p>
    </div>
    <div class="mythology-card" data-mythology="norse">
        <h3>Norse Mythology</h3>
        <p>Journey to Asgard...</p>
    </div>
</div>
```

**Responsive**:
- Auto-fit grid layout
- Collapses to single column on mobile
- Colored accents per mythology

### Pattern 5: Search Results

```html
<div class="search-result-item">
    <h4>Result Title</h4>
    <p class="excerpt">Preview text...</p>
    <div class="entity-tag">Tag</div>
</div>
```

---

## HTML Patterns

### Full Page Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entity Page - Eyes of Azrael</title>

    <!-- Core Styles -->
    <link rel="stylesheet" href="../../themes/theme-base.css">
    <link rel="stylesheet" href="../../css/shader-backgrounds.css">
    <link rel="stylesheet" href="../../css/panel-shaders.css">
</head>
<body>
    <!-- Content -->
    <main class="view-container">
        <div class="detail-panel">
            <div class="entity-icon">🌊</div>
            <h1 class="entity-name">Poseidon</h1>
            <p class="entity-subtitle">God of the Seas</p>

            <div class="panel-section">
                <h3 class="panel-section-title">Overview</h3>
                <p>Poseidon rules the oceans...</p>
            </div>

            <div class="panel-section">
                <h3 class="panel-section-title">Symbols</h3>
                <div class="entity-tag">Trident</div>
                <div class="entity-tag">Horse</div>
                <div class="entity-tag">Dolphin</div>
            </div>
        </div>
    </main>

    <!-- Shader System -->
    <script src="../../js/shaders/shader-themes.js"></script>
    <script>
        // Initialize with water theme for Poseidon
        const shaderManager = new ShaderThemeManager({
            intensity: 0.7,
            quality: 'high'
        });
        shaderManager.activate('water');
    </script>
</body>
</html>
```

### Modal/Overlay Pattern

```html
<!-- Modal with shader-aware styling -->
<div class="modal-overlay">
    <div class="modal-content glass-card">
        <h2>Modal Title</h2>
        <p>Content...</p>
        <button class="panel-action-btn">Close</button>
    </div>
</div>
```

```css
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    max-width: 600px;
    width: 90%;
}
```

---

## CSS Patterns

### Custom Panel with Shader Support

```css
.my-custom-panel {
    /* Base shader-aware styling */
    position: relative;
    background: rgba(26, 31, 58, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(139, 127, 255, 0.3);
    border-radius: 1rem;
    padding: 1.5rem;

    /* Optional: Gradient overlay */
    position: relative;
    overflow: hidden;
}

.my-custom-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        135deg,
        rgba(102, 126, 234, 0.05) 0%,
        rgba(118, 75, 162, 0.05) 100%
    );
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
}

.my-custom-panel:hover::before {
    opacity: 1;
}

/* Ensure content above overlay */
.my-custom-panel > * {
    position: relative;
    z-index: 1;
}
```

### Shader Border Effect

```css
.shader-border-panel {
    position: relative;
    background: rgba(26, 31, 58, 0.9);
    border-radius: 1rem;
    padding: 2px; /* Space for border */
}

.shader-border-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 1rem;
    padding: 2px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
}

.shader-border-panel-content {
    position: relative;
    background: rgba(26, 31, 58, 0.9);
    border-radius: calc(1rem - 2px);
    padding: 1.5rem;
}
```

### Text Readability Over Shaders

```css
.shader-text-shadow {
    text-shadow:
        0 0 20px rgba(0, 0, 0, 0.8),
        0 2px 4px rgba(0, 0, 0, 0.9),
        0 0 10px rgba(102, 126, 234, 0.5);
}

.shader-gradient-text {
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(102, 126, 234, 0.3);
}
```

---

## JavaScript Patterns

### Pattern 1: Basic Initialization

```javascript
// Simple setup
const shaderManager = new ShaderThemeManager();
shaderManager.activate('water');
```

### Pattern 2: Route-Based Theme Switching

```javascript
// Initialize shader system
const shaderManager = new ShaderThemeManager({
    intensity: 0.7,
    quality: 'high',
    adaptiveQuality: true
});

// Map routes to shaders
const routeShaderMap = {
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
    'christian': 'order',
    'apocryphal': 'chaos'
};

// Listen for route changes
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    const match = hash.match(/^#\/([^\/]+)/);

    if (match) {
        const mythology = match[1].toLowerCase();
        const shader = routeShaderMap[mythology] || 'dark';
        shaderManager.activate(shader);
    } else {
        shaderManager.activate('dark');
    }
});
```

### Pattern 3: User Controls

```javascript
// Create UI controls
function createShaderControls() {
    const controls = document.createElement('div');
    controls.className = 'shader-controls';
    controls.innerHTML = `
        <button id="shaderToggle" class="active">Shaders: ON</button>
        <div class="shader-intensity-slider">
            <label>Intensity: <span id="intensityValue">80%</span></label>
            <input type="range" id="shaderIntensity" min="0" max="100" value="80">
        </div>
        <div class="shader-info">
            <div>FPS: <span class="fps good" id="shaderFPS">60</span></div>
        </div>
    `;
    document.body.appendChild(controls);

    // Toggle button
    document.getElementById('shaderToggle').addEventListener('click', () => {
        const enabled = shaderManager.toggle();
        const btn = document.getElementById('shaderToggle');
        btn.textContent = enabled ? 'Shaders: ON' : 'Shaders: OFF';
        btn.classList.toggle('active', enabled);
        localStorage.setItem('shadersEnabled', enabled);
    });

    // Intensity slider
    document.getElementById('shaderIntensity').addEventListener('input', (e) => {
        const value = e.target.value;
        shaderManager.setIntensity(value / 100);
        document.getElementById('intensityValue').textContent = value + '%';
    });

    // Update FPS display
    setInterval(() => {
        const status = shaderManager.getStatus();
        const fpsElem = document.getElementById('shaderFPS');
        fpsElem.textContent = status.fps;
        fpsElem.className = 'fps ' + (status.fps >= 50 ? 'good' : 'warning');
    }, 1000);
}

// Initialize controls
if (shaderManager.webglSupported) {
    createShaderControls();
}
```

### Pattern 4: Performance Monitoring

```javascript
// Monitor and respond to performance
function setupPerformanceMonitoring() {
    setInterval(() => {
        const status = shaderManager.getStatus();

        if (status.fps < 20) {
            console.warn('Low FPS detected, reducing quality');
            shaderManager.settings.quality = 'low';
            shaderManager.handleResize();

            // Optionally show warning to user
            showPerformanceWarning();
        }
    }, 5000);
}

function showPerformanceWarning() {
    const warning = document.createElement('div');
    warning.className = 'shader-performance-warning';
    warning.innerHTML = `
        <strong>Performance Notice</strong>
        <p>Shader effects may be impacting performance. Reduce quality?</p>
        <button onclick="shaderManager.settings.quality='low'; shaderManager.handleResize(); this.parentElement.remove();">
            Reduce Quality
        </button>
        <button onclick="this.parentElement.remove();">Keep Current</button>
    `;
    document.body.appendChild(warning);

    setTimeout(() => warning.remove(), 10000);
}
```

### Pattern 5: Accessibility Support

```javascript
// Respect user preferences
function setupAccessibility() {
    // Reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log('Reduced motion preferred, disabling shaders');
        shaderManager.deactivate();
        return;
    }

    // Restore user preference
    const savedEnabled = localStorage.getItem('shadersEnabled');
    if (savedEnabled === 'false') {
        shaderManager.deactivate();
    }

    // Low battery mode
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            if (battery.level < 0.2) {
                console.log('Low battery, reducing shader quality');
                shaderManager.settings.quality = 'low';
                shaderManager.handleResize();
            }
        });
    }

    // Page visibility (pause when hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            shaderManager.pause();
        } else if (shaderManager.enabled) {
            shaderManager.resume();
        }
    });
}
```

---

## Advanced Patterns

### Pattern 6: Panel with Localized Shader Effect

Create a panel that has its own shader effect (not full-screen):

```html
<div class="panel-with-local-shader">
    <canvas class="panel-shader-canvas"></canvas>
    <div class="panel-content">
        <h2>Content</h2>
    </div>
</div>
```

```javascript
// Create localized shader for panel
class PanelShader {
    constructor(container, shaderName) {
        this.container = container;
        this.canvas = container.querySelector('.panel-shader-canvas');
        this.gl = this.canvas.getContext('webgl');

        // Setup similar to ShaderThemeManager but scoped to panel
        this.setupCanvas();
        this.loadShader(shaderName);
    }

    setupCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    // ... similar methods to ShaderThemeManager
}

// Usage
const panelShader = new PanelShader(
    document.querySelector('.panel-with-local-shader'),
    'water'
);
```

### Pattern 7: Shader Transitions

Smoothly transition between shader themes:

```javascript
class ShaderTransitioner {
    constructor(shaderManager) {
        this.manager = shaderManager;
        this.transitioning = false;
    }

    async transitionTo(newTheme, duration = 1000) {
        if (this.transitioning) return;
        this.transitioning = true;

        const canvas = this.manager.canvas;
        const originalIntensity = this.manager.intensity;

        // Fade out
        await this.fadeIntensity(originalIntensity, 0, duration / 2);

        // Switch theme
        await this.manager.loadTheme(newTheme);

        // Fade in
        await this.fadeIntensity(0, originalIntensity, duration / 2);

        this.transitioning = false;
    }

    fadeIntensity(from, to, duration) {
        return new Promise(resolve => {
            const start = Date.now();
            const animate = () => {
                const elapsed = Date.now() - start;
                const progress = Math.min(elapsed / duration, 1);
                const intensity = from + (to - from) * progress;

                this.manager.setIntensity(intensity);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }
}

// Usage
const transitioner = new ShaderTransitioner(shaderManager);
transitioner.transitionTo('fire', 1500);
```

### Pattern 8: Dynamic Shader Parameters

Modify shader parameters in real-time:

```javascript
// Custom shader manager with parameter controls
class ParametricShaderManager extends ShaderThemeManager {
    constructor(options) {
        super(options);
        this.customParams = {};
    }

    setCustomParam(name, value) {
        this.customParams[name] = value;

        // Get uniform location if program exists
        if (this.program && this.gl) {
            const location = this.gl.getUniformLocation(this.program, name);
            if (location) {
                this.gl.uniform1f(location, value);
            }
        }
    }

    render() {
        if (!this.enabled || !this.program || !this.gl) return;

        // Call parent render
        super.render();

        // Apply custom parameters
        for (const [name, value] of Object.entries(this.customParams)) {
            const location = this.gl.getUniformLocation(this.program, name);
            if (location) {
                this.gl.uniform1f(location, value);
            }
        }
    }
}

// Usage
const paramManager = new ParametricShaderManager();
paramManager.activate('water');
paramManager.setCustomParam('u_waveSpeed', 0.5);
paramManager.setCustomParam('u_waveHeight', 2.0);
```

---

## Best Practices

### 1. Performance

- **Always use adaptive quality**: Let the system adjust based on device capability
- **Monitor FPS**: Check regularly and adjust if needed
- **Pause when hidden**: Use visibility API to pause rendering
- **Mobile considerations**: Lower quality automatically on mobile

```javascript
const shaderManager = new ShaderThemeManager({
    intensity: 0.7,
    quality: /mobile/i.test(navigator.userAgent) ? 'medium' : 'high',
    adaptiveQuality: true
});
```

### 2. Accessibility

- **Respect prefers-reduced-motion**: Always check and disable if set
- **Provide toggle controls**: Let users disable shaders
- **Ensure readability**: Test text contrast over shaders
- **Keyboard navigation**: Ensure controls are keyboard-accessible

```javascript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shaderManager.deactivate();
}
```

### 3. Visual Design

- **Subtle over flashy**: Shaders should enhance, not distract
- **Consistent opacity**: Use 0.85-0.92 for panel backgrounds
- **Proper contrast**: Ensure text is readable
- **Themed shaders**: Match shader to mythology/content

```css
.glass-card {
    background: rgba(26, 31, 58, 0.85); /* Good contrast */
    backdrop-filter: blur(12px); /* Frosted glass effect */
}
```

### 4. Development

- **Test without WebGL**: Ensure graceful fallback
- **Test on mobile**: Performance varies greatly
- **Version control**: Keep shader files in git
- **Document custom shaders**: Add comments to GLSL files

### 5. User Experience

- **Save preferences**: Use localStorage for user settings
- **Show status**: Display FPS and quality in debug mode
- **Smooth transitions**: Fade when changing themes
- **Clear feedback**: Show loading states

```javascript
// Save user preference
localStorage.setItem('shadersEnabled', shaderManager.enabled);
localStorage.setItem('shaderIntensity', shaderManager.intensity);

// Restore on load
const savedEnabled = localStorage.getItem('shadersEnabled') !== 'false';
const savedIntensity = parseFloat(localStorage.getItem('shaderIntensity')) || 0.8;

if (savedEnabled) {
    shaderManager.setIntensity(savedIntensity);
    shaderManager.activate('dark');
}
```

---

## Troubleshooting

### Shaders Not Appearing

1. Check WebGL support:
```javascript
console.log('WebGL Supported:', shaderManager.webglSupported);
```

2. Check shader file paths:
```javascript
// Ensure files are accessible
fetch('/js/shaders/water-shader.glsl')
    .then(r => console.log('Shader accessible:', r.ok))
    .catch(e => console.error('Shader not found:', e));
```

3. Check console for errors:
- GLSL compilation errors
- File loading errors
- WebGL context errors

### Low Performance

1. Reduce quality:
```javascript
shaderManager.settings.quality = 'low';
shaderManager.handleResize();
```

2. Lower intensity:
```javascript
shaderManager.setIntensity(0.5);
```

3. Check FPS:
```javascript
setInterval(() => {
    console.log('FPS:', shaderManager.getStatus().fps);
}, 1000);
```

### Text Not Readable

1. Increase panel opacity:
```css
.glass-card {
    background: rgba(26, 31, 58, 0.95); /* Darker */
}
```

2. Add text shadow:
```css
h1, h2, h3 {
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
}
```

3. Reduce shader intensity:
```javascript
shaderManager.setIntensity(0.6);
```

---

## Quick Reference

### HTML Classes
- `.glass-card` - Semi-transparent panel
- `.entity-panel` - Entity display panel
- `.detail-panel` - Full-page entity details
- `.mythology-card` - Mythology selection card
- `.panel-section` - Content section in panel
- `.entity-tag` - Tag/badge element

### CSS Variables (Use in Custom Styles)
```css
--color-primary: #667eea
--color-secondary: #764ba2
--color-surface-rgb: 26, 31, 58
--radius-xl: 1rem
--spacing-lg: 1.5rem
```

### JavaScript API
```javascript
// Initialize
const shaderManager = new ShaderThemeManager(options);

// Methods
shaderManager.activate(themeName)
shaderManager.deactivate()
shaderManager.setIntensity(value)
shaderManager.toggle()
shaderManager.getStatus()
shaderManager.destroy()
shaderManager.pause()
shaderManager.resume()
```

### File Structure
```
css/
├── shader-backgrounds.css  # Core shader styles
└── panel-shaders.css       # Panel integration styles

js/shaders/
├── shader-themes.js        # Manager class
├── water-shader.glsl       # Water theme
├── fire-shader.glsl        # Fire theme
├── night-shader.glsl       # Night theme
├── earth-shader.glsl       # Earth theme
├── light-shader.glsl       # Light theme
├── dark-shader.glsl        # Dark theme
├── day-shader.glsl         # Day theme
├── air-shader.glsl         # Air theme
├── chaos-shader.glsl       # Chaos theme
└── order-shader.glsl       # Order theme
```

---

## Examples Summary

1. **Full-Screen Background**: Standard pattern for entire page
2. **Glass Panel**: Most common content container
3. **Entity Panel**: Deity/hero/creature display
4. **Detail Panel**: Full-page entity view
5. **Modal**: Overlay with shader support
6. **Localized Panel Shader**: Shader effect within panel
7. **Smooth Transitions**: Fade between themes
8. **Dynamic Parameters**: Real-time shader control

---

## Support

For additional help:
- See `SHADER_SYSTEM_DOCUMENTATION.md` for full API reference
- See `SHADER_QUICK_START.md` for quick setup
- See `shader-demo.html` for live examples
- Check `js/shaders/README.md` for shader details
