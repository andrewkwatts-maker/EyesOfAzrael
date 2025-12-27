# Shader CSS and DOM Fixes

## Quick Fix Summary

Three critical issues must be fixed to make shaders visible:

1. **Fix script path** in index.html (line 131)
2. **Remove duplicate canvas** in index.html (line 54)
3. **Let JavaScript create the canvas** (it handles everything correctly)

---

## Fix 1: Correct Script Reference

### CURRENT (index.html line 131)
```html
<script src="js/shader-manager.js"></script>
```

### FIXED
```html
<script src="js/shaders/shader-themes.js"></script>
```

**Why**: The file `js/shader-manager.js` doesn't exist. The actual shader system is in `js/shaders/shader-themes.js`.

---

## Fix 2: Remove Static Canvas

### CURRENT (index.html line 54)
```html
<!-- Shader Background Canvas -->
<canvas id="shader-canvas" class="shader-background"></canvas>
```

### FIXED
```html
<!-- Shader canvas will be created dynamically by ShaderThemeManager -->
```

**Why**: The ShaderThemeManager creates its own canvas with proper configuration. Having a static canvas causes duplication and confusion.

---

## Fix 3: Verify CSS (No Changes Needed)

The CSS in `css/shader-backgrounds.css` is **already correct**:

```css
#shader-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
    opacity: 1;
    transition: opacity 0.5s ease;
}
```

This targets the JavaScript-created canvas with `id="shader-background"`.

---

## Complete Fixed index.html

### Before (lines 50-55)
```html
</head>
<body>
    <!-- Shader Background Canvas -->
    <canvas id="shader-canvas" class="shader-background"></canvas>

    <!-- Skip to main content (Accessibility) -->
```

### After (lines 50-53)
```html
</head>
<body>
    <!-- Shader canvas created dynamically by ShaderThemeManager -->

    <!-- Skip to main content (Accessibility) -->
```

### Before (lines 128-133)
```html
    <script src="js/spa-navigation.js"></script>
    <script src="js/shader-manager.js"></script>
    <script src="js/theme-manager.js"></script>

    <!-- CRUD System -->
```

### After (lines 128-133)
```html
    <script src="js/spa-navigation.js"></script>
    <script src="js/shaders/shader-themes.js"></script>
    <script src="js/theme-manager.js"></script>

    <!-- CRUD System -->
```

---

## Verification After Fixes

### 1. Open Browser Console
Press F12 and check for errors. You should see:
```
[App] Shaders initialized
[ShaderThemes] Loaded theme: night
```

### 2. Check Canvas Existence
Run in console:
```javascript
document.getElementById('shader-background')
```
Should return: `<canvas id="shader-background">...</canvas>`

### 3. Check WebGL Context
Run in console:
```javascript
const canvas = document.getElementById('shader-background');
canvas.getContext('webgl')
```
Should return: `WebGLRenderingContext {...}`

### 4. Check Shader Manager
Run in console:
```javascript
window.EyesOfAzrael.shaders.getStatus()
```
Should return:
```javascript
{
  enabled: true,
  supported: true,
  theme: "night",
  fps: 60,
  quality: "high",
  intensity: 1
}
```

### 5. Visual Verification
You should see animated shader background behind the page content.

---

## Optional: Add Shader Controls UI

If you want user controls for shaders, add this to index.html before `</body>`:

```html
<!-- Shader Controls (Optional) -->
<div class="shader-controls" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
    <button onclick="window.EyesOfAzrael.shaders.toggle()">Toggle Shaders</button>
    <button onclick="window.EyesOfAzrael.shaders.activate('water')">Water</button>
    <button onclick="window.EyesOfAzrael.shaders.activate('fire')">Fire</button>
    <button onclick="window.EyesOfAzrael.shaders.activate('night')">Night</button>
</div>
```

The CSS for shader controls is already in `css/shader-backgrounds.css` (lines 68-223).

---

## Testing Individual Panel Shaders

The current system applies shaders **globally as a background**.

To test panel-specific shaders, open:
```
H:\Github\EyesOfAzrael\test-shader-panel.html
```

This demonstrates:
- Multiple canvases (one per panel)
- Each with its own shader instance
- Positioned absolutely within panels
- Panel content layered above shaders

---

## Performance Considerations

### Expected Performance
- **60 FPS** on modern hardware
- **30-45 FPS** on older devices
- Automatic quality reduction if FPS drops

### If Performance is Poor
The system has adaptive quality built-in, but you can also:

```javascript
// Reduce quality manually
window.EyesOfAzrael.shaders.settings.quality = 'low';
window.EyesOfAzrael.shaders.handleResize();

// Reduce intensity
window.EyesOfAzrael.shaders.setIntensity(0.5);

// Disable shaders
window.EyesOfAzrael.shaders.deactivate();
```

---

## Common Issues After Fixes

### Issue: "ShaderThemeManager is not defined"
**Cause**: Script didn't load
**Fix**: Check browser console for 404 error on script load

### Issue: Canvas visible but no animation
**Cause**: Shader files not loading
**Fix**: Check network tab for 404s on `.glsl` files in `/js/shaders/`

### Issue: Black canvas, no shader
**Cause**: Shader compilation error
**Fix**: Check console for shader compilation errors

### Issue: Canvas appears above content
**Cause**: Z-index issue
**Fix**: Ensure canvas has `z-index: -1` and content has positive z-index

---

## Z-Index Strategy

```
-1   ← Shader canvas (background)
0    ← Body, default elements
1    ← Panels, cards (position: relative)
10   ← Header, footer
100  ← Dropdowns, tooltips
1000 ← Modals, overlays
```

All shader canvases must be at `z-index: -1` to stay behind content.

---

## File Locations Reference

```
CSS Files:
  H:\Github\EyesOfAzrael\css\shader-backgrounds.css    ← Global shader canvas
  H:\Github\EyesOfAzrael\css\panel-shaders.css         ← Panel styling (no actual shaders)

JavaScript Files:
  H:\Github\EyesOfAzrael\js\shaders\shader-themes.js   ← Main shader manager
  H:\Github\EyesOfAzrael\js\app-init-simple.js         ← Initializes shaders (lines 95-108)

Shader Source Files:
  H:\Github\EyesOfAzrael\js\shaders\water-shader.glsl
  H:\Github\EyesOfAzrael\js\shaders\fire-shader.glsl
  H:\Github\EyesOfAzrael\js\shaders\night-shader.glsl
  H:\Github\EyesOfAzrael\js\shaders\earth-shader.glsl
  H:\Github\EyesOfAzrael\js\shaders\light-shader.glsl
  H:\Github\EyesOfAzrael\js\shaders\dark-shader.glsl
  H:\Github\EyesOfAzrael\js\shaders\day-shader.glsl
  H:\Github\EyesOfAzrael\js\shaders\air-shader.glsl
  H:\Github\EyesOfAzrael\js\shaders\chaos-shader.glsl
  H:\Github\EyesOfAzrael\js\shaders\order-shader.glsl

Test Files:
  H:\Github\EyesOfAzrael\test-shader-panel.html        ← Panel shader test
  H:\Github\EyesOfAzrael\shader-test.html              ← Basic shader test
  H:\Github\EyesOfAzrael\shader-demo.html              ← Full demo with controls
```

---

## Next Steps

1. Apply fixes to index.html
2. Reload page in browser
3. Check console for initialization messages
4. Verify shader background is visible
5. Test theme switching
6. Monitor FPS and performance

---

## Summary of Changes

| File | Line | Change | Reason |
|------|------|--------|--------|
| index.html | 54 | Remove `<canvas id="shader-canvas">` | Duplicate canvas |
| index.html | 131 | Change to `js/shaders/shader-themes.js` | Correct path |

That's it! Just two small changes to fix shader visibility.
