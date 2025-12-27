# Shader System Quick Start Guide

## 5-Minute Setup

### Step 1: Add Files to Your HTML

```html
<!-- In <head> -->
<link rel="stylesheet" href="css/shader-backgrounds.css">

<!-- Before </body> -->
<script src="js/shaders/shader-themes.js"></script>
```

### Step 2: Initialize

```javascript
// Initialize shader manager
const shaderManager = new ShaderThemeManager();

// Activate a theme
shaderManager.activate('water');
```

Done! Your background now has beautiful shader effects.

## Common Use Cases

### Use Case 1: Different Shader per Mythology

```javascript
const mythologyShaders = {
    'greek': 'water',
    'norse': 'night',
    'egyptian': 'light',
    'hindu': 'fire',
    'celtic': 'earth'
};

function switchMythology(name) {
    const shader = mythologyShaders[name] || 'dark';
    shaderManager.activate(shader);
}
```

### Use Case 2: Add User Control

```html
<button onclick="shaderManager.toggle()">
    Toggle Shaders
</button>

<input type="range"
       min="0" max="100" value="80"
       oninput="shaderManager.setIntensity(this.value / 100)">
```

### Use Case 3: Check Performance

```javascript
setInterval(() => {
    const status = shaderManager.getStatus();
    console.log(`FPS: ${status.fps}`);

    if (status.fps < 30) {
        // Reduce quality or disable
        shaderManager.settings.quality = 'low';
        shaderManager.handleResize();
    }
}, 5000);
```

## Available Themes

| Theme | Best For | Effect |
|-------|----------|---------|
| `water` | Greek, Norse | Waves, caustics, bubbles |
| `fire` | Hindu, Persian, Aztec | Flames, embers |
| `night` | Chinese, Babylonian | Stars, aurora |
| `earth` | Celtic, Sumerian, Mayan | Organic patterns, particles |
| `light` | Egyptian, Buddhist, Roman | Light rays, glowing particles |
| `dark` | Default, underworld | Shadows, dark particles |

## Configuration Options

```javascript
const shaderManager = new ShaderThemeManager({
    intensity: 0.8,        // 0.0 to 1.0
    quality: 'high',       // 'low', 'medium', 'high'
    adaptiveQuality: true  // Auto-adjust based on FPS
});
```

## Key Methods

```javascript
// Activate theme
shaderManager.activate('water');

// Change intensity
shaderManager.setIntensity(0.5);

// Toggle on/off
shaderManager.toggle();

// Get status
const status = shaderManager.getStatus();

// Cleanup
shaderManager.destroy();
```

## Troubleshooting

**Problem:** Shaders not showing
**Solution:** Check WebGL support
```javascript
console.log(shaderManager.webglSupported);
```

**Problem:** Low FPS
**Solution:** Reduce quality
```javascript
shaderManager.settings.quality = 'low';
shaderManager.handleResize();
```

**Problem:** Too intense
**Solution:** Reduce intensity
```javascript
shaderManager.setIntensity(0.3);
```

## Demo Page

See `shader-demo.html` for a live interactive demo of all shader themes.

## Full Documentation

See `SHADER_SYSTEM_DOCUMENTATION.md` for complete API reference and advanced usage.
