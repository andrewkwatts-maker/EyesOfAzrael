# Shader Initialization Trace

## Problem Identified

**ROOT CAUSE**: The main `index.html` file is missing the `shader-themes.js` script include.

### Missing Script Reference
```html
<!-- This line is MISSING from index.html -->
<script src="js/shaders/shader-themes.js"></script>
```

### Current State in index.html (Line 131)
```html
<script src="js/shader-manager.js"></script>  <!-- This file does NOT exist -->
```

The app attempts to load a non-existent `shader-manager.js` file instead of the actual `shader-themes.js` file.

---

## Complete Initialization Sequence

### 1. Script Loading Order (What SHOULD happen)

```
1. Firebase SDK loads
2. Firebase Config loads
3. Core app scripts load
4. shader-themes.js loads → ShaderThemeManager class defined
5. app-init-simple.js executes → Creates ShaderThemeManager instance
6. Shader activates with theme
```

### 2. Constructor Initialization

When `new ShaderThemeManager(options)` is called:

```javascript
ShaderThemeManager Constructor
├─ Initialize properties (enabled, intensity, canvas, gl, program)
├─ Create shader cache (Map)
├─ Configure theme mappings (40+ theme-to-shader mappings)
├─ Set performance settings (quality, FPS target, adaptive quality)
├─ Initialize FPS counter
├─ Check WebGL support
│  ├─ Create test canvas
│  ├─ Try to get WebGL context
│  └─ Return true/false
└─ If WebGL supported → Call init()
```

**Console Output:**
```
[ShaderInit] 🚀 Constructor called with options: {quality: 'auto', targetFPS: 60}
[ShaderInit] ✓ Shader cache initialized
[ShaderInit] ✓ Theme mappings configured: 40 themes
[ShaderInit] ✓ Performance settings: {targetFPS: 60, quality: 'high', adaptiveQuality: true}
[ShaderInit] 🔍 Checking WebGL support...
[ShaderInit] Testing WebGL context creation...
[ShaderInit] WebGL support test result: true
[ShaderInit] WebGL vendor: Google Inc. (NVIDIA)
[ShaderInit] WebGL renderer: ANGLE (NVIDIA GeForce RTX...)
[ShaderInit] WebGL version: WebGL 1.0 (OpenGL ES 2.0 Chromium)
[ShaderInit] ✓ WebGL is supported, initializing...
```

### 3. init() Method

```javascript
init()
├─ Create canvas element
│  ├─ Set id='shader-background'
│  ├─ Apply fixed positioning styles
│  └─ Set z-index=-1
├─ Get WebGL context
│  ├─ Try 'webgl' context
│  ├─ Fallback to 'experimental-webgl'
│  └─ Configure context options (alpha, antialias, etc.)
├─ Setup resize handler
│  ├─ Bind handleResize method
│  ├─ Add window resize listener
│  └─ Call initial resize
└─ Setup visibility change handler
   └─ Pause/resume on tab visibility
```

**Console Output:**
```
[ShaderInit] 🎨 Initializing shader system...
[ShaderInit] Creating canvas element...
[ShaderInit] ✓ Canvas element created: {id: 'shader-background', width: 300, height: 150}
[ShaderInit] Getting WebGL context...
[ShaderInit] ✓ WebGL context obtained
[ShaderInit] Setting up resize handler...
[ShaderInit] 📐 Resizing canvas: {viewportWidth: 1920, viewportHeight: 1080, devicePixelRatio: 2, ...}
[ShaderInit] ✓ Canvas resized and viewport set
[ShaderInit] ✓ Resize handler configured
[ShaderInit] Setting up visibility change handler...
[ShaderInit] ✓ Visibility handler configured
[ShaderInit] ✅ Initialization complete!
```

### 4. activate(themeName) Method

Called from app-init-simple.js (line 105):

```javascript
activate(themeName)
├─ Check WebGL support
├─ Add canvas to DOM
│  └─ Insert as first child of <body>
├─ Call loadTheme(themeName)
│  ├─ Map theme name to shader file
│  ├─ Load shader source from /js/shaders/*.glsl
│  ├─ Compile vertex shader
│  ├─ Compile fragment shader
│  ├─ Link shader program
│  ├─ Setup vertex buffer
│  └─ Get uniform locations
└─ If successful → resume() → Start render loop
```

**Console Output:**
```
[ShaderInit] 🎬 Activating shader theme: night
[ShaderInit] Adding canvas to DOM...
[ShaderInit] ✓ Canvas inserted into DOM as first child of body
[ShaderInit] 🎭 Loading theme: night
[ShaderInit] Shader file for theme: night-shader.glsl
[ShaderInit] 📥 Loading shader source: night-shader.glsl
[ShaderInit] Fetching shader from: /js/shaders/night-shader.glsl
[ShaderInit] Fetch response: {status: 200, statusText: 'OK', ok: true}
[ShaderInit] ✓ Shader source loaded: {filename: 'night-shader.glsl', length: 2847, lines: 89}
[ShaderInit] 🔧 Creating shader program...
[ShaderInit] 🔨 Compiling VERTEX shader...
[ShaderInit] ✓ VERTEX shader compiled successfully
[ShaderInit] 🔨 Compiling FRAGMENT shader...
[ShaderInit] ✓ FRAGMENT shader compiled successfully
[ShaderInit] Linking program...
[ShaderInit] ✓ Shader program created and linked successfully
[ShaderInit] ✓ Shader program activated
[ShaderInit] 📊 Setting up vertex buffer...
[ShaderInit] Position attribute location: 0
[ShaderInit] ✓ Vertex buffer configured
[ShaderInit] Uniform locations: {resolution: 'found', time: 'found', intensity: 'found'}
[ShaderInit] ✅ Theme loaded successfully: night
[ShaderInit] ✓ Theme loaded, starting render loop...
[ShaderInit] ▶️ Resuming render loop
[ShaderInit] ✅ Shader activated and rendering!
```

### 5. Render Loop

```javascript
render() (called via requestAnimationFrame)
├─ Check if enabled and program exists
├─ Calculate elapsed time
├─ Update FPS counter (every 1000ms)
├─ Clear canvas
├─ Set uniforms (resolution, time, intensity)
├─ Draw full-screen quad (TRIANGLE_STRIP, 4 vertices)
└─ Schedule next frame
```

**Console Output (periodic):**
```
[ShaderRender] FPS: 60
[ShaderRender] FPS: 60
[ShaderRender] FPS: 59
```

---

## Failure Points and Silent Failures

### 1. Script Not Loaded
**Symptom**: `ShaderThemeManager is not defined`

```javascript
// In app-init-simple.js line 95
if (typeof ShaderThemeManager !== 'undefined') {
    // This block is SKIPPED if shader-themes.js isn't loaded
    window.EyesOfAzrael.shaders = new ShaderThemeManager({...});
} else {
    console.warn('[App] ShaderThemeManager not found, skipping');
}
```

**Silent Failure**: The app continues without shaders, no error thrown.

### 2. WebGL Not Supported
**Symptom**: Constructor exits early

```javascript
if (this.webglSupported) {
    this.init();
} else {
    console.warn('[ShaderThemes] WebGL not supported, falling back to CSS');
}
```

**Silent Failure**: Shader system doesn't initialize, but app continues.

### 3. Shader File 404
**Symptom**: Shader fails to load

```javascript
const response = await fetch(`/js/shaders/${filename}`);
if (!response.ok) {
    throw new Error(`Failed to load shader: ${filename}`);
}
```

**Expected**: Console error, promise rejection
**Result**: Theme doesn't activate, but no crash

### 4. Shader Compilation Error
**Symptom**: GLSL syntax error

```javascript
if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
    console.error('[ShaderThemes] Shader compile error:',
                  this.gl.getShaderInfoLog(shader));
    this.gl.deleteShader(shader);
    return null;
}
```

**Result**: Shader program creation fails, theme doesn't activate

### 5. Canvas Not in DOM
**Symptom**: Canvas exists but not visible

```javascript
if (!this.canvas.parentElement) {
    document.body.insertBefore(this.canvas, document.body.firstChild);
}
```

**Check**: Canvas must be first child of body to appear behind content

---

## Timing Issues

### Race Conditions

1. **DOM Not Ready**: If scripts load before DOM ready
   ```javascript
   // app-init-simple.js handles this
   if (document.readyState === 'loading') {
       await new Promise(resolve =>
           document.addEventListener('DOMContentLoaded', resolve));
   }
   ```

2. **Firebase Not Ready**: If shader code runs before Firebase loads
   ```javascript
   if (typeof firebase === 'undefined') {
       throw new Error('Firebase SDK not loaded');
   }
   ```

3. **Canvas Insertion Before Body**: Can't insert if body doesn't exist yet
   - **Solution**: All initialization happens after DOMContentLoaded

---

## Verification Checklist

### Required for Shaders to Work

- [ ] `js/shaders/shader-themes.js` is loaded in HTML
- [ ] Script loads BEFORE `app-init-simple.js`
- [ ] WebGL is supported in browser
- [ ] GLSL shader files exist in `/js/shaders/` directory
- [ ] Canvas is inserted into DOM
- [ ] Canvas has z-index: -1 (behind content)
- [ ] Canvas has position: fixed
- [ ] Canvas has pointer-events: none
- [ ] Render loop is running (check FPS logs)
- [ ] No shader compilation errors

### Debug Commands

```javascript
// Check if class is defined
typeof ShaderThemeManager !== 'undefined'

// Check if instance exists
window.EyesOfAzrael?.shaders !== undefined

// Get shader status
window.EyesOfAzrael?.shaders?.getStatus()

// Check canvas in DOM
document.getElementById('shader-background')

// Check if rendering
window.EyesOfAzrael?.shaders?.animationId !== null
```

---

## Common Error Messages

### "ShaderThemeManager is not defined"
**Cause**: shader-themes.js not loaded
**Fix**: Add `<script src="js/shaders/shader-themes.js"></script>` to HTML

### "Failed to load shader: *.glsl"
**Cause**: Shader file missing or wrong path
**Fix**: Verify file exists at `/js/shaders/*.glsl`

### "Failed to get WebGL context"
**Cause**: WebGL disabled or not supported
**Fix**: Enable WebGL in browser, or use different browser

### "Shader compile error"
**Cause**: GLSL syntax error in shader file
**Fix**: Check shader file for syntax errors, review GLSL logs

### Canvas exists but not visible
**Cause**: CSS z-index or positioning issue
**Fix**: Verify canvas styles and insertion point

---

## Performance Monitoring

### FPS Tracking
```javascript
this.fpsCounter = {
    frames: 0,
    lastTime: Date.now(),
    fps: 60
};
```

Logs FPS every 1000ms:
```
[ShaderRender] FPS: 60
```

### Adaptive Quality
If FPS < 30: Reduce quality to "low"
If FPS > 55: Increase quality to "medium"

---

## Fix Summary

### Required Change to index.html

**Before (Line 131):**
```html
<script src="js/shader-manager.js"></script>
```

**After:**
```html
<script src="js/shaders/shader-themes.js"></script>
```

### Alternative: Use Debug Version

For enhanced logging during development:
```html
<script src="js/shader-theme-manager-debug.js"></script>
```

This version includes comprehensive console logging for every step of initialization.
