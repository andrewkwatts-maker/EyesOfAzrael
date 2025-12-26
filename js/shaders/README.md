# Eyes of Azrael - WebGL Shader Theme System

High-quality, performance-optimized WebGL shaders that replace plain CSS backgrounds with subtle, sophisticated visual effects.

## Features

- **6 Unique Themes**: Water, Fire, Night Sky, Earth, Light, Dark
- **60 FPS Performance**: Optimized for modern devices
- **Adaptive Quality**: Automatically adjusts based on device capability
- **Graceful Fallback**: CSS gradients when WebGL unavailable
- **Accessibility First**: Respects user preferences
- **Mobile Optimized**: Reduced quality on mobile devices

## Quick Start

```javascript
// Initialize
const shaderManager = new ShaderThemeManager();

// Activate theme
shaderManager.activate('water');
```

## Shader Themes

### 🌊 Water
Gentle waves, subtle caustics, rising bubbles
- **Use for**: Greek, Norse, ocean mythologies

### 🔥 Fire
Flickering flames, rising embers
- **Use for**: Hindu, Persian, Aztec mythologies

### ✨ Night
Twinkling stars, slow aurora
- **Use for**: Chinese, Babylonian, celestial mythologies

### 🌿 Earth
Organic patterns, flowing particles
- **Use for**: Celtic, Sumerian, Mayan, nature traditions

### ☀️ Light
Glowing particles, gentle light rays
- **Use for**: Egyptian, Buddhist, Roman mythologies

### 🌑 Dark
Flowing shadows, dark particles
- **Use for**: Default dark mode, underworld themes

## Files

```
js/shaders/
├── shader-themes.js              # Main manager (8KB)
├── water-shader.glsl             # Water effect (2KB)
├── fire-shader.glsl              # Fire effect (2KB)
├── night-shader.glsl             # Night sky (2KB)
├── earth-shader.glsl             # Earth patterns (2KB)
├── light-shader.glsl             # Light theme (2KB)
├── dark-shader.glsl              # Dark theme (2KB)
└── shader-integration-example.js # Integration examples
```

## Techniques Used

- **SDF (Signed Distance Fields)** - Efficient shape rendering
- **FBM (Fractal Brownian Motion)** - Organic noise patterns
- **Domain Warping** - Fluid, natural motion
- **Voronoi Patterns** - Cellular textures
- **Proper Hash Functions** - Consistent pseudo-randomness
- **Multiple Octaves** - Depth and detail

## Performance

| Quality | Pixel Ratio | Target | Devices |
|---------|-------------|--------|---------|
| Low     | 1.0x        | 60 FPS | Budget/Mobile |
| Medium  | 1.5x        | 60 FPS | Mid-range |
| High    | 2.0x        | 60 FPS | High-end |

## Browser Support

- Chrome 56+ ✓
- Firefox 51+ ✓
- Safari 11+ ✓
- Edge 79+ ✓

## Documentation

- **Quick Start**: `../../SHADER_QUICK_START.md`
- **Full Docs**: `../../SHADER_SYSTEM_DOCUMENTATION.md`
- **Demo**: `../../shader-demo.html`

## API

```javascript
// Initialize
const manager = new ShaderThemeManager({
    intensity: 0.8,
    quality: 'high',
    adaptiveQuality: true
});

// Methods
manager.activate('water');
manager.setIntensity(0.5);
manager.toggle();
manager.getStatus();
manager.destroy();
```

## Customization

All shaders accept these uniforms:
- `u_resolution` (vec2) - Canvas size
- `u_time` (float) - Elapsed time
- `u_intensity` (float) - Effect intensity (0-1)

## Creating Custom Shaders

1. Create `custom-shader.glsl`
2. Use required uniforms
3. Register in `shader-themes.js`

```glsl
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    vec3 color = vec3(0.0);
    // Your shader code

    color *= u_intensity;
    gl_FragColor = vec4(color, 1.0);
}
```

## Design Philosophy

1. **Subtle > Flashy** - Effects should enhance, not distract
2. **Performance Matters** - 60fps is the target
3. **User Control** - Always allow disable/adjust
4. **Accessibility** - Respect user preferences
5. **Graceful Degradation** - Work without WebGL

## Credits

Created for Eyes of Azrael by the development team.
Inspired by ShaderToy community techniques, all implementations original.

## License

Part of the Eyes of Azrael project. All rights reserved.
