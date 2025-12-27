# Enhanced Shader Integration Guide

Complete developer guide for integrating shader effects into Eyes of Azrael pages and components.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Integration Methods](#integration-methods)
3. [Component Library](#component-library)
4. [Advanced Integration](#advanced-integration)
5. [Migration Guide](#migration-guide)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 5-Minute Setup

**Step 1: Add Required Files**

Add these lines to your HTML `<head>`:

```html
<!-- Required CSS -->
<link rel="stylesheet" href="/css/shader-backgrounds.css">
<link rel="stylesheet" href="/css/panel-shaders.css">
<link rel="stylesheet" href="/css/shader-components.css">
```

**Step 2: Add Shader Script**

Before closing `</body>`:

```html
<!-- Shader System -->
<script src="/js/shaders/shader-themes.js"></script>
<script src="/js/components/shader-panel.js"></script>
```

**Step 3: Initialize**

Add initialization script:

```html
<script>
    // Initialize shader manager
    const shaderManager = new ShaderThemeManager({
        intensity: 0.7,
        quality: 'high',
        adaptiveQuality: true
    });

    // Activate theme
    shaderManager.activate('water');
</script>
```

**Done!** Your page now has shader backgrounds.

---

## Integration Methods

### Method 1: CSS Classes (Simplest)

Use pre-built CSS classes for instant shader integration:

```html
<!-- Glass panel -->
<div class="glass-card">
    <h2>My Content</h2>
    <p>Text appears above shader background</p>
</div>

<!-- Entity panel with mythology accent -->
<div class="entity-panel" data-mythology="greek">
    <h3>Zeus</h3>
    <p>King of the gods</p>
</div>

<!-- Shader-integrated button -->
<button class="shader-btn">Click Me</button>
```

**Pros**: Zero JavaScript, works immediately, minimal code
**Cons**: Limited customization, fixed styles

### Method 2: Utility Classes (Flexible)

Use utility classes for more control:

```html
<div class="shader-glass">
    <!-- Standard glass effect -->
</div>

<div class="shader-frosted">
    <!-- Lighter, more translucent -->
</div>

<div class="shader-heavy">
    <!-- More opaque, less shader visible -->
</div>

<div class="shader-border">
    <div class="shader-border-content">
        <!-- Gradient border effect -->
    </div>
</div>
```

**Pros**: Quick, flexible, no JavaScript
**Cons**: More verbose HTML

### Method 3: Web Components (Modern)

Use custom web components for clean markup:

```html
<!-- Simple shader panel -->
<shader-panel type="glass">
    <h2>Title</h2>
    <p>Content</p>
</shader-panel>

<!-- With mythology accent -->
<shader-panel type="entity" mythology="greek">
    <shader-panel-header icon="⚡" title="Zeus"></shader-panel-header>
    <shader-panel-section title="Overview">
        <p>Zeus is the king of the gods...</p>
    </shader-panel-section>
    <shader-tag>Thunder</shader-tag>
</shader-panel>
```

**Pros**: Clean markup, reusable, encapsulated styles
**Cons**: Requires JavaScript, newer browser feature

### Method 4: Programmatic (Full Control)

Create panels dynamically with JavaScript:

```javascript
// Create panel
const panel = createShaderPanel({
    type: 'glass',
    mythology: 'greek',
    intensity: 0.8,
    content: `
        <h2>Dynamic Panel</h2>
        <p>Created with JavaScript</p>
    `
});

// Add to page
document.body.appendChild(panel);
```

**Pros**: Full control, dynamic creation
**Cons**: Requires JavaScript knowledge

---

## Component Library

### Panels

#### Glass Card
```html
<div class="glass-card">
    <h2>Title</h2>
    <p>Content</p>
</div>
```

#### Entity Panel
```html
<div class="entity-panel" data-mythology="greek">
    <div class="entity-panel-header">
        <span class="entity-icon">⚡</span>
        <h3>Entity Name</h3>
    </div>
    <p>Description</p>
</div>
```

#### Detail Panel
```html
<div class="detail-panel">
    <div class="entity-icon">⚡</div>
    <h1 class="entity-name">Entity Name</h1>
    <p class="entity-subtitle">Subtitle</p>

    <div class="panel-section">
        <h3 class="panel-section-title">Section</h3>
        <p>Content</p>
    </div>
</div>
```

### Buttons

```html
<button class="shader-btn">Primary</button>
<button class="shader-btn-secondary">Secondary</button>
<button class="shader-btn-glass">Glass</button>
```

### Forms

```html
<input type="text" class="shader-input" placeholder="Name">
<textarea class="shader-textarea" placeholder="Message"></textarea>
```

### Badges

```html
<span class="shader-badge">Default</span>
<span class="shader-badge-success">Success</span>
<span class="shader-badge-warning">Warning</span>
<span class="shader-badge-danger">Danger</span>
```

### Hero Section

```html
<div class="shader-hero">
    <h1 class="shader-gradient-text-3">Hero Title</h1>
    <p>Hero description</p>
    <button class="shader-btn">Call to Action</button>
</div>
```

### Modal

```html
<div class="shader-modal-overlay active">
    <div class="shader-modal-content">
        <h2>Modal Title</h2>
        <p>Content</p>
        <button class="shader-btn">Close</button>
    </div>
</div>
```

---

## Advanced Integration

### Route-Based Shader Switching

Automatically change shaders based on current page/route:

```javascript
// Define mythology to shader mapping
const mythologyShaders = {
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

// Auto-switch on route change
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    const match = hash.match(/^#\/([^\/]+)/);

    if (match) {
        const mythology = match[1].toLowerCase();
        const shader = mythologyShaders[mythology] || 'dark';
        shaderManager.activate(shader);
    } else {
        shaderManager.activate('dark'); // Default
    }
});

// Also run on initial load
if (window.location.hash) {
    window.dispatchEvent(new Event('hashchange'));
}
```

### User Preference System

Save and restore user shader preferences:

```javascript
// Initialize with user preferences
function initShaderSystem() {
    const shaderManager = new ShaderThemeManager({
        intensity: parseFloat(localStorage.getItem('shaderIntensity')) || 0.7,
        quality: localStorage.getItem('shaderQuality') || 'high',
        adaptiveQuality: true
    });

    // Check if user has disabled shaders
    if (localStorage.getItem('shadersEnabled') === 'false') {
        shaderManager.deactivate();
        return shaderManager;
    }

    // Activate saved theme or default
    const savedTheme = localStorage.getItem('shaderTheme') || 'dark';
    shaderManager.activate(savedTheme);

    return shaderManager;
}

// Save preferences when changed
function updateShaderPreferences(shaderManager, changes) {
    if (changes.enabled !== undefined) {
        localStorage.setItem('shadersEnabled', changes.enabled);
    }
    if (changes.theme) {
        localStorage.setItem('shaderTheme', changes.theme);
    }
    if (changes.intensity !== undefined) {
        localStorage.setItem('shaderIntensity', changes.intensity);
    }
    if (changes.quality) {
        localStorage.setItem('shaderQuality', changes.quality);
    }
}
```

### Settings Panel Component

Create a user-facing settings panel:

```html
<div class="shader-settings glass-card">
    <h3>Shader Settings</h3>

    <!-- Enable/Disable -->
    <div class="setting-row">
        <label>
            <input type="checkbox" id="shadersEnabled" checked>
            Enable Shader Effects
        </label>
    </div>

    <!-- Intensity Slider -->
    <div class="setting-row">
        <label>
            Intensity: <span id="intensityDisplay">70%</span>
        </label>
        <input type="range" id="shaderIntensity" min="0" max="100" value="70" class="shader-input">
    </div>

    <!-- Quality Select -->
    <div class="setting-row">
        <label>Quality:</label>
        <select id="shaderQuality" class="shader-input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high" selected>High</option>
        </select>
    </div>

    <!-- Theme Picker -->
    <div class="setting-row">
        <label>Theme:</label>
        <select id="shaderTheme" class="shader-input">
            <option value="water">Water</option>
            <option value="fire">Fire</option>
            <option value="night">Night</option>
            <option value="earth">Earth</option>
            <option value="light">Light</option>
            <option value="dark" selected>Dark</option>
        </select>
    </div>

    <button class="shader-btn" onclick="saveShaderSettings()">Save Settings</button>
</div>

<script>
function setupShaderSettings(shaderManager) {
    // Enable/disable
    document.getElementById('shadersEnabled').addEventListener('change', (e) => {
        if (e.target.checked) {
            shaderManager.resume();
        } else {
            shaderManager.pause();
        }
        updateShaderPreferences(shaderManager, { enabled: e.target.checked });
    });

    // Intensity
    document.getElementById('shaderIntensity').addEventListener('input', (e) => {
        const value = e.target.value;
        shaderManager.setIntensity(value / 100);
        document.getElementById('intensityDisplay').textContent = value + '%';
    });

    // Quality
    document.getElementById('shaderQuality').addEventListener('change', (e) => {
        shaderManager.settings.quality = e.target.value;
        shaderManager.handleResize();
        updateShaderPreferences(shaderManager, { quality: e.target.value });
    });

    // Theme
    document.getElementById('shaderTheme').addEventListener('change', (e) => {
        shaderManager.activate(e.target.value);
        updateShaderPreferences(shaderManager, { theme: e.target.value });
    });
}

function saveShaderSettings() {
    const intensity = document.getElementById('shaderIntensity').value / 100;
    updateShaderPreferences(shaderManager, {
        enabled: document.getElementById('shadersEnabled').checked,
        intensity: intensity,
        quality: document.getElementById('shaderQuality').value,
        theme: document.getElementById('shaderTheme').value
    });
    alert('Settings saved!');
}
</script>
```

### Performance Monitoring Dashboard

Track shader performance in real-time:

```javascript
class ShaderMonitor {
    constructor(shaderManager) {
        this.manager = shaderManager;
        this.stats = {
            fps: [],
            quality: [],
            adjustments: 0
        };

        this.startMonitoring();
    }

    startMonitoring() {
        setInterval(() => {
            const status = this.manager.getStatus();

            // Record FPS
            this.stats.fps.push(status.fps);
            if (this.stats.fps.length > 60) {
                this.stats.fps.shift();
            }

            // Record quality changes
            this.stats.quality.push(status.quality);
            if (this.stats.quality.length > 60) {
                this.stats.quality.shift();
            }

            // Detect quality adjustments
            if (this.stats.quality.length > 1) {
                const current = this.stats.quality[this.stats.quality.length - 1];
                const previous = this.stats.quality[this.stats.quality.length - 2];
                if (current !== previous) {
                    this.stats.adjustments++;
                }
            }

            // Update display
            this.updateDisplay();
        }, 1000);
    }

    updateDisplay() {
        const avgFPS = this.stats.fps.reduce((a, b) => a + b, 0) / this.stats.fps.length;
        const minFPS = Math.min(...this.stats.fps);
        const maxFPS = Math.max(...this.stats.fps);

        console.log(`FPS: ${avgFPS.toFixed(1)} (min: ${minFPS}, max: ${maxFPS})`);
        console.log(`Quality adjustments: ${this.stats.adjustments}`);
    }

    getReport() {
        return {
            averageFPS: this.stats.fps.reduce((a, b) => a + b, 0) / this.stats.fps.length,
            minFPS: Math.min(...this.stats.fps),
            maxFPS: Math.max(...this.stats.fps),
            qualityAdjustments: this.stats.adjustments,
            currentQuality: this.stats.quality[this.stats.quality.length - 1]
        };
    }
}

// Usage
const monitor = new ShaderMonitor(shaderManager);
setInterval(() => {
    const report = monitor.getReport();
    console.table(report);
}, 10000);
```

---

## Migration Guide

### Migrating Existing Pages

**Step 1: Identify Current Styling**

Look for existing background styles:
```css
/* Old styles to replace */
.my-panel {
    background: #1a1a2e;
    border: 1px solid #333;
}
```

**Step 2: Replace with Shader Classes**

```html
<!-- Before -->
<div class="my-panel">
    Content
</div>

<!-- After -->
<div class="glass-card">
    Content
</div>
```

**Step 3: Update Custom Styles**

If you have custom CSS, make it shader-aware:

```css
/* Old */
.my-custom-panel {
    background: #1a1a2e;
    border: 1px solid #333;
    padding: 1.5rem;
}

/* New - Shader aware */
.my-custom-panel {
    background: rgba(26, 31, 58, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(139, 127, 255, 0.3);
    padding: 1.5rem;
    border-radius: 1rem;
}
```

**Step 4: Test and Adjust**

1. Test with different shader themes
2. Check text readability
3. Verify on mobile devices
4. Test with shaders disabled (fallback)

### Converting Components

#### Old Component Pattern
```html
<div class="old-card">
    <div class="old-header">
        <h3>Title</h3>
    </div>
    <div class="old-content">
        <p>Content</p>
    </div>
</div>
```

#### New Shader Component
```html
<shader-panel type="glass">
    <shader-panel-header title="Title"></shader-panel-header>
    <shader-panel-section>
        <p>Content</p>
    </shader-panel-section>
</shader-panel>
```

---

## Best Practices

### 1. Performance

**DO:**
- Enable adaptive quality
- Monitor FPS regularly
- Pause shaders when page hidden
- Use appropriate quality settings for device

```javascript
const shaderManager = new ShaderThemeManager({
    quality: /mobile/i.test(navigator.userAgent) ? 'medium' : 'high',
    adaptiveQuality: true
});

// Pause when hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        shaderManager.pause();
    } else if (shaderManager.enabled) {
        shaderManager.resume();
    }
});
```

**DON'T:**
- Force high quality on all devices
- Ignore FPS warnings
- Keep shaders running when invisible

### 2. Accessibility

**DO:**
- Respect prefers-reduced-motion
- Provide disable option
- Ensure text contrast
- Support keyboard navigation

```javascript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shaderManager.deactivate();
}
```

**DON'T:**
- Force shaders on all users
- Ignore accessibility preferences
- Use low-contrast text

### 3. User Experience

**DO:**
- Save user preferences
- Provide visual feedback
- Match shaders to content
- Smooth transitions

```javascript
// Smooth theme transitions
async function smoothShaderTransition(newTheme) {
    const currentIntensity = shaderManager.intensity;

    // Fade out
    for (let i = 10; i >= 0; i--) {
        shaderManager.setIntensity(currentIntensity * (i / 10));
        await new Promise(r => setTimeout(r, 50));
    }

    // Switch
    await shaderManager.loadTheme(newTheme);

    // Fade in
    for (let i = 0; i <= 10; i++) {
        shaderManager.setIntensity(currentIntensity * (i / 10));
        await new Promise(r => setTimeout(r, 50));
    }
}
```

**DON'T:**
- Abrupt theme changes
- Ignore user feedback
- Use inappropriate themes

### 4. Code Organization

**DO:**
- Centralize shader initialization
- Create reusable components
- Document custom shaders
- Use consistent naming

```javascript
// Centralized initialization
class AppShaderSystem {
    constructor() {
        this.manager = new ShaderThemeManager({
            intensity: 0.7,
            quality: 'high',
            adaptiveQuality: true
        });

        this.setupRouteHandling();
        this.setupUserPreferences();
        this.setupAccessibility();
    }

    setupRouteHandling() { /* ... */ }
    setupUserPreferences() { /* ... */ }
    setupAccessibility() { /* ... */ }
}

// Single initialization
const appShaders = new AppShaderSystem();
```

**DON'T:**
- Scatter shader code everywhere
- Duplicate initialization logic
- Hard-code values

---

## Troubleshooting

### Common Issues

#### 1. Shaders Not Appearing

**Symptom**: Page loads but no shader visible

**Checks**:
```javascript
// Check WebGL support
console.log('WebGL Supported:', shaderManager.webglSupported);

// Check shader status
console.log('Status:', shaderManager.getStatus());

// Check for errors
console.error('Check console for shader compilation errors');
```

**Solutions**:
- Verify shader files are accessible (check network tab)
- Check browser WebGL support
- Verify shader-backgrounds.css is loaded
- Check z-index conflicts

#### 2. Low Performance

**Symptom**: Page feels laggy, low FPS

**Diagnosis**:
```javascript
// Check FPS
setInterval(() => {
    const fps = shaderManager.getStatus().fps;
    console.log('FPS:', fps);
    if (fps < 30) {
        console.warn('Low FPS detected!');
    }
}, 1000);
```

**Solutions**:
```javascript
// Reduce quality
shaderManager.settings.quality = 'low';
shaderManager.handleResize();

// Lower intensity
shaderManager.setIntensity(0.5);

// Disable on low-end devices
if (navigator.hardwareConcurrency <= 2) {
    shaderManager.deactivate();
}
```

#### 3. Text Not Readable

**Symptom**: Text hard to read over shader

**Solutions**:
```css
/* Increase panel opacity */
.glass-card {
    background: rgba(26, 31, 58, 0.95); /* More opaque */
}

/* Add text shadow */
h1, h2, h3 {
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
}
```

```javascript
// Reduce shader intensity
shaderManager.setIntensity(0.5);
```

#### 4. Mobile Issues

**Symptom**: Performance problems on mobile

**Solutions**:
```javascript
// Detect mobile and adjust
const isMobile = /mobile/i.test(navigator.userAgent);

const shaderManager = new ShaderThemeManager({
    quality: isMobile ? 'low' : 'high',
    intensity: isMobile ? 0.6 : 0.8,
    adaptiveQuality: true
});
```

```css
/* Mobile-specific styles */
@media (max-width: 768px) {
    .glass-card {
        background: rgba(26, 31, 58, 0.92); /* More opaque on mobile */
    }
}
```

---

## Reference

### File Structure
```
css/
├── shader-backgrounds.css    # Core shader canvas styles
├── panel-shaders.css         # Panel integration styles
└── shader-components.css     # Component utilities

js/
├── shaders/
│   ├── shader-themes.js      # Manager class
│   └── *.glsl                # Shader programs
└── components/
    └── shader-panel.js       # Web components

examples/
└── shader-examples.html      # Live examples
```

### Key Classes
- `.glass-card` - Standard glass panel
- `.entity-panel` - Entity display panel
- `.detail-panel` - Full-page entity view
- `.shader-btn` - Shader-integrated button
- `.shader-input` - Form input
- `.shader-badge` - Tag/badge component

### JavaScript API
```javascript
// Initialize
const manager = new ShaderThemeManager(options);

// Methods
manager.activate(theme)
manager.deactivate()
manager.setIntensity(0-1)
manager.toggle()
manager.getStatus()
manager.pause()
manager.resume()
manager.destroy()
```

### Documentation
- `SHADER_PATTERNS.md` - Complete pattern reference
- `SHADER_SYSTEM_DOCUMENTATION.md` - Full API docs
- `SHADER_QUICK_START.md` - Quick reference
- `shader-demo.html` - Interactive demo
- `examples/shader-examples.html` - Live examples

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the examples in `shader-examples.html`
3. Consult `SHADER_PATTERNS.md` for pattern details
4. Check browser console for error messages

Happy coding! 🎨✨
