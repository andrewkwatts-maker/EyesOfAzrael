# WebGL Shader Theme System Documentation

## Overview

The Eyes of Azrael shader system replaces plain CSS gradient backgrounds with high-quality, subtle WebGL shader effects that enhance the atmospheric experience without distracting from content.

## Features

- **6 Unique Shader Themes**: Water, Fire, Night, Earth, Light, Dark
- **High Performance**: Optimized for 60fps on modern devices
- **Adaptive Quality**: Automatically adjusts quality based on performance
- **Graceful Fallback**: CSS gradients when WebGL unavailable
- **Accessibility**: Respects `prefers-reduced-motion` and other user preferences
- **Mobile Optimized**: Reduced quality settings for mobile devices
- **Easy Integration**: Works seamlessly with existing theme system

## File Structure

```
js/shaders/
├── shader-themes.js              # Main shader manager class
├── water-shader.glsl             # Water/ocean effect
├── fire-shader.glsl              # Fire/ember effect
├── night-shader.glsl             # Night sky with stars & aurora
├── earth-shader.glsl             # Organic earth patterns
├── light-shader.glsl             # Light rays & particles
├── dark-shader.glsl              # Flowing shadows
└── shader-integration-example.js # Integration examples

css/
└── shader-backgrounds.css        # Shader integration styles
```

## Installation

### 1. Add CSS to your HTML

```html
<link rel="stylesheet" href="css/shader-backgrounds.css">
```

### 2. Add JavaScript

```html
<!-- Add before closing </body> tag -->
<script src="js/shaders/shader-themes.js"></script>
```

### 3. Initialize

```javascript
// Simple initialization
const shaderManager = new ShaderThemeManager();
shaderManager.activate('water');
```

## Shader Themes

### Water Theme
- Gentle waves at top
- Subtle caustics across surface
- Rising bubbles
- **Best for**: Greek, Norse, Ocean-related mythologies

### Fire Theme
- Small flames around edges
- Rising embers throughout
- Flickering effect
- **Best for**: Hindu, Persian, Aztec mythologies

### Night Theme
- Twinkling stars (multiple layers for depth)
- Slow-moving aurora in upper portion
- **Best for**: Norse, Chinese, Babylonian mythologies

### Earth Theme
- Organic Voronoi patterns
- Flowing particles along curved paths
- Natural texture
- **Best for**: Celtic, Sumerian, Mayan, Yoruba mythologies

### Light Theme
- Soft glowing particles
- Gentle light rays from center
- Pulsing glow effect
- **Best for**: Egyptian, Buddhist, Roman mythologies

### Dark Theme
- Flowing shadow patterns
- Drifting dark particles
- Subtle vignette
- **Best for**: Default dark mode, underworld themes

## API Reference

### ShaderThemeManager

#### Constructor

```javascript
new ShaderThemeManager(options)
```

**Options:**
- `intensity` (number, 0-1): Effect intensity (default: 1.0)
- `quality` (string): 'low', 'medium', 'high' (default: 'high')
- `adaptiveQuality` (boolean): Auto-adjust quality based on FPS (default: true)

#### Methods

##### activate(themeName)
Loads and activates a shader theme.

```javascript
shaderManager.activate('water');
```

**Parameters:**
- `themeName` (string): 'water', 'fire', 'night', 'earth', 'light', 'dark'

##### deactivate()
Stops rendering and removes canvas.

```javascript
shaderManager.deactivate();
```

##### setIntensity(value)
Adjusts effect intensity.

```javascript
shaderManager.setIntensity(0.5); // 50% intensity
```

**Parameters:**
- `value` (number): 0.0 to 1.0

##### toggle()
Toggles shaders on/off.

```javascript
const isEnabled = shaderManager.toggle();
```

**Returns:** boolean - current enabled state

##### getStatus()
Returns current shader status.

```javascript
const status = shaderManager.getStatus();
console.log(status);
// {
//   enabled: true,
//   supported: true,
//   theme: 'water',
//   fps: 60,
//   quality: 'high',
//   intensity: 1.0
// }
```

##### destroy()
Cleanup and remove all resources.

```javascript
shaderManager.destroy();
```

## Integration Examples

### Example 1: Basic Setup

```javascript
// Initialize shader manager
const shaderManager = new ShaderThemeManager({
    intensity: 0.8,
    quality: 'high'
});

// Activate water theme
shaderManager.activate('water');
```

### Example 2: Theme Mapping

```javascript
// Map mythology to shader themes
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
    'sumerian': 'earth'
};

function changeTheme(mythology) {
    const shaderTheme = mythologyShaderMap[mythology] || 'dark';
    shaderManager.activate(shaderTheme);
}
```

### Example 3: User Controls

```javascript
// Create toggle button
const toggleBtn = document.createElement('button');
toggleBtn.textContent = 'Toggle Shaders';
toggleBtn.onclick = () => {
    const enabled = shaderManager.toggle();
    toggleBtn.textContent = enabled ? 'Disable Shaders' : 'Enable Shaders';
};

// Create intensity slider
const slider = document.createElement('input');
slider.type = 'range';
slider.min = 0;
slider.max = 100;
slider.value = 80;
slider.oninput = (e) => {
    shaderManager.setIntensity(e.target.value / 100);
};
```

### Example 4: Performance Monitoring

```javascript
setInterval(() => {
    const status = shaderManager.getStatus();

    if (status.fps < 30) {
        console.warn('Low FPS detected:', status.fps);
        // Optionally reduce quality or disable
        shaderManager.settings.quality = 'low';
    }
}, 5000);
```

### Example 5: Respect User Preferences

```javascript
// Check for reduced motion preference
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shaderManager.deactivate();
}

// Save user preference
localStorage.setItem('shadersEnabled', 'true');

// Restore on page load
if (localStorage.getItem('shadersEnabled') === 'false') {
    shaderManager.deactivate();
}
```

## Performance Optimization

### Automatic Quality Adjustment

The shader system automatically adjusts quality based on FPS:

- **FPS < 30**: Reduces to low quality
- **FPS > 55**: Increases to medium quality (if currently low)

### Manual Quality Control

```javascript
// Set quality manually
shaderManager.settings.quality = 'low';
shaderManager.handleResize(); // Apply changes

// Disable adaptive quality
shaderManager.settings.adaptiveQuality = false;
```

### Quality Levels

- **Low**: 1x pixel ratio, minimal performance impact
- **Medium**: 1.5x pixel ratio, balanced quality/performance
- **High**: 2x pixel ratio, maximum quality

### Mobile Optimization

On mobile devices:
- Automatically uses lower pixel ratio
- Reduced opacity (0.8 instead of 1.0)
- Stronger panel backgrounds for better readability

## Accessibility

### Reduced Motion Support

Shaders automatically disable when user has `prefers-reduced-motion: reduce` set.

```css
@media (prefers-reduced-motion: reduce) {
    #shader-background {
        display: none;
    }
}
```

### High Contrast Mode

Panel backgrounds become more opaque in high contrast mode:

```css
@media (prefers-contrast: high) {
    .glass-card {
        background: rgba(26, 31, 58, 0.98);
    }
}
```

## Browser Support

### WebGL Support
- Chrome 56+
- Firefox 51+
- Safari 11+
- Edge 79+

### Fallback Behavior

When WebGL is not supported:
1. Shader canvas is hidden
2. CSS gradient backgrounds are used
3. `no-webgl` class added to body
4. Theme-specific gradient fallbacks applied

## Customization

### Creating New Shaders

1. Create a new `.glsl` file in `js/shaders/`
2. Use the fragment shader template:

```glsl
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Your shader code here

    vec3 color = vec3(0.0); // Calculate your color

    color *= u_intensity; // Apply intensity

    gl_FragColor = vec4(color, 1.0);
}
```

3. Register in shader manager:

```javascript
this.themeShaders = {
    // ... existing themes
    'custom': 'custom-shader.glsl'
};
```

### Shader Techniques Used

- **SDF (Signed Distance Fields)**: For sharp, efficient shapes
- **FBM (Fractal Brownian Motion)**: For organic noise
- **Domain Warping**: For fluid, natural motion
- **Voronoi Patterns**: For cellular/organic textures
- **Proper Hash Functions**: For consistent pseudo-randomness

## Troubleshooting

### Shaders not appearing

1. Check WebGL support:
```javascript
console.log(shaderManager.webglSupported);
```

2. Check console for errors
3. Verify shader files are accessible (check network tab)
4. Check if reduced motion is enabled

### Poor Performance

1. Lower quality setting:
```javascript
shaderManager.settings.quality = 'low';
shaderManager.handleResize();
```

2. Reduce intensity:
```javascript
shaderManager.setIntensity(0.5);
```

3. Check FPS:
```javascript
console.log(shaderManager.getStatus().fps);
```

### Shader compilation errors

- Check browser console for GLSL errors
- Verify uniform names match in shader and JavaScript
- Ensure shader syntax is valid GLSL ES 1.0

## Best Practices

1. **Subtlety First**: Effects should enhance, not distract
2. **Performance Matters**: Target 60fps on modern devices
3. **Graceful Degradation**: Always provide CSS fallbacks
4. **User Control**: Allow users to disable/adjust effects
5. **Accessibility**: Respect user preferences
6. **Mobile Consideration**: Lower quality on mobile by default

## Examples in the Wild

See `shader-integration-example.js` for complete working examples of:
- Basic activation
- Theme picker integration
- UI controls creation
- Performance monitoring
- User preference handling
- Complete initialization with error handling

## License

Part of the Eyes of Azrael project. All rights reserved.

## Credits

Shader techniques inspired by ShaderToy community, but all implementations are original and optimized for the Eyes of Azrael use case.
