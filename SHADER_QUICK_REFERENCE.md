# Shader Themes - Quick Reference

## All Available Shaders (10 Total)

### Existing Shaders (6)
1. **water** - Ocean waves, caustics, bubbles, god rays
2. **fire** - Flames, sparks, heat distortion  
3. **night** - Starfield, nebula, cosmic dust
4. **light** - Soft glow, light particles
5. **dark** - Deep shadows, subtle movement
6. **earth** - Organic patterns, growth (ENHANCED)

### NEW Shaders (4)
7. **day** - Bright sky, wispy clouds, sun rays
8. **air** - Wind patterns, floating particles, currents
9. **chaos** - Black hole, accretion disk, reality distortions
10. **order** - Sacred geometry, golden light, mandalas

## Theme Name Shortcuts (24 mappings)

| Use This | To Get |
|----------|--------|
| `water`, `ocean`, `sea` | Water shader |
| `fire`, `flame` | Fire shader |
| `night`, `sky`, `stars` | Night shader |
| `earth`, `forest`, `nature`, `meadow` | Earth shader (ENHANCED) |
| `light` | Light shader |
| `day`, `daylight`, `sunshine` | Day shader (NEW) |
| `dark`, `shadow` | Dark shader |
| `air`, `wind` | Air shader (NEW) |
| `chaos`, `void`, `abyss` | Chaos shader (NEW) |
| `order`, `divine`, `sacred`, `angelic`, `heaven` | Order shader (NEW) |

## Quick Start

```javascript
const shaderManager = new ShaderThemeManager();

// Use any theme name
shaderManager.activate('day');     // Bright sky
shaderManager.activate('chaos');   // Black hole
shaderManager.activate('order');   // Sacred geometry
shaderManager.activate('air');     // Wind
shaderManager.activate('meadow');  // Living earth
```

## Earth Shader Enhancements

The earth shader now includes:
- 30 swaying grass blades at bottom edge
- 8 dandelion seeds floating upward
- 12 flowers growing at borders
- Creates a living meadow atmosphere

## Color Palettes

**Day**: Sky blue (#87CEEB) to golden (#FDB863)
**Air**: Very light blue (#E8F4F8) to soft blue (#B8D8E8)
**Chaos**: Pure black (#000000) to deep purple (#1a0a1f) to chaos purple (#4a1545)
**Order**: Pure white (#FFFFFF) to pearl (#FFE4B5) to gold (#FFD700)
**Earth**: Dark soil to greens with grass (#409e3a), flowers (#725926), seeds (#D9D9D1)

## Performance

All shaders:
- Target 60fps
- Use adaptive quality
- Respect intensity control
- Pause when page hidden
- Monitor FPS automatically

## Files Created

```
js/shaders/
├── day-shader.glsl        (5.5K, 184 lines) NEW
├── air-shader.glsl        (7.6K, 247 lines) NEW
├── chaos-shader.glsl      (8.8K, 272 lines) NEW
├── order-shader.glsl      (8.3K, 271 lines) NEW
└── earth-shader.glsl      (12K, 374 lines)  ENHANCED
```

Total: 2,459 lines of production GLSL code across 10 shaders
