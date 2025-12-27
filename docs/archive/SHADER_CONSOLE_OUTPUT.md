# Expected Shader Console Output

This document shows the expected console output when shaders initialize successfully vs. when they fail.

---

## ✅ Successful Initialization

### Complete Console Log Sequence

```
[App] Starting initialization...
[App] Firebase initialized
[App] Firebase services ready
[App] AuthManager initialized
[App] CRUD Manager initialized
[App] Renderer initialized
[App] Navigation initialized
[App] Search initialized

[ShaderInit] 🚀 Constructor called with options: {quality: 'auto', targetFPS: 60}
[ShaderInit] ✓ Shader cache initialized
[ShaderInit] ✓ Theme mappings configured: 40 themes
[ShaderInit] ✓ Performance settings: {targetFPS: 60, quality: 'high', adaptiveQuality: true}
[ShaderInit] 🔍 Checking WebGL support...
[ShaderInit] Testing WebGL context creation...
[ShaderInit] WebGL support test result: true
[ShaderInit] WebGL vendor: Google Inc. (NVIDIA)
[ShaderInit] WebGL renderer: ANGLE (NVIDIA GeForce RTX 3070/PCIe/SSE2)
[ShaderInit] WebGL version: WebGL 1.0 (OpenGL ES 2.0 Chromium)
[ShaderInit] ✓ WebGL is supported, initializing...

[ShaderInit] 🎨 Initializing shader system...
[ShaderInit] Creating canvas element...
[ShaderInit] ✓ Canvas element created: {id: 'shader-background', width: 300, height: 150}
[ShaderInit] Getting WebGL context...
[ShaderInit] ✓ WebGL context obtained
[ShaderInit] Setting up resize handler...
[ShaderInit] Device pixel ratio: 2 Quality setting: high
[ShaderInit] 📐 Resizing canvas: {
    viewportWidth: 1920,
    viewportHeight: 1080,
    devicePixelRatio: 2,
    canvasWidth: 3840,
    canvasHeight: 2160
}
[ShaderInit] ✓ Canvas resized and viewport set
[ShaderInit] ✓ Resize handler configured
[ShaderInit] Setting up visibility change handler...
[ShaderInit] ✓ Visibility handler configured
[ShaderInit] ✅ Initialization complete!

[App] Shaders initialized

[ShaderInit] 🎬 Activating shader theme: night
[ShaderInit] Adding canvas to DOM...
[ShaderInit] ✓ Canvas inserted into DOM as first child of body
[ShaderInit] 🎭 Loading theme: night
[ShaderInit] Shader file for theme: night-shader.glsl
[ShaderInit] 📥 Loading shader source: night-shader.glsl
[ShaderInit] Fetching shader from: /js/shaders/night-shader.glsl
[ShaderInit] Fetch response: {status: 200, statusText: 'OK', ok: true}
[ShaderInit] ✓ Shader source loaded: {
    filename: 'night-shader.glsl',
    length: 2847,
    lines: 89
}
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
[ShaderInit] Uniform locations: {
    resolution: 'found',
    time: 'found',
    intensity: 'found'
}
[ShaderInit] ✅ Theme loaded successfully: night
[ShaderInit] ✓ Theme loaded, starting render loop...
[ShaderInit] ▶️ Resuming render loop
[ShaderInit] ✅ Shader activated and rendering!

[App] Initialization complete

[ShaderRender] FPS: 60
[ShaderRender] FPS: 60
[ShaderRender] FPS: 59
[ShaderRender] FPS: 60
```

### Key Success Indicators

✅ `ShaderInit] ✓ WebGL is supported, initializing...`
✅ `[ShaderInit] ✓ Canvas element created`
✅ `[ShaderInit] ✓ WebGL context obtained`
✅ `[ShaderInit] ✅ Initialization complete!`
✅ `[ShaderInit] ✓ Canvas inserted into DOM`
✅ `[ShaderInit] ✓ Shader source loaded`
✅ `[ShaderInit] ✓ VERTEX shader compiled successfully`
✅ `[ShaderInit] ✓ FRAGMENT shader compiled successfully`
✅ `[ShaderInit] ✅ Theme loaded successfully`
✅ `[ShaderInit] ✅ Shader activated and rendering!`
✅ `[ShaderRender] FPS: 60` (repeating)

---

## ❌ Failed Initialization - Missing Script

### Console Output When shader-themes.js Not Loaded

```
[App] Starting initialization...
[App] Firebase initialized
[App] Firebase services ready
[App] AuthManager initialized
[App] CRUD Manager initialized
[App] Renderer initialized
[App] Navigation initialized
[App] Search initialized
[App] ⚠️ ShaderThemeManager not found, skipping
[App] Initialization complete
```

### Key Failure Indicators

❌ `[App] ⚠️ ShaderThemeManager not found, skipping`
❌ No `[ShaderInit]` messages at all
❌ No canvas created
❌ No WebGL context
❌ No shaders loaded

### How to Identify

```javascript
// Check in console
typeof ShaderThemeManager
// Returns: "undefined" (FAIL) or "function" (SUCCESS)

window.EyesOfAzrael?.shaders
// Returns: undefined (FAIL) or ShaderThemeManager instance (SUCCESS)
```

---

## ❌ Failed Initialization - WebGL Not Supported

### Console Output

```
[App] Starting initialization...
[App] Firebase initialized
[App] Firebase services ready

[ShaderInit] 🚀 Constructor called with options: {quality: 'auto', targetFPS: 60}
[ShaderInit] ✓ Shader cache initialized
[ShaderInit] ✓ Theme mappings configured: 40 themes
[ShaderInit] ✓ Performance settings: {targetFPS: 60, quality: 'high', adaptiveQuality: true}
[ShaderInit] 🔍 Checking WebGL support...
[ShaderInit] Testing WebGL context creation...
[ShaderInit] WebGL support test result: false
[ShaderInit] ⚠️ WebGL not supported, falling back to CSS backgrounds

[App] Shaders initialized
[App] Initialization complete
```

### Key Failure Indicators

❌ `[ShaderInit] WebGL support test result: false`
❌ `[ShaderInit] ⚠️ WebGL not supported, falling back to CSS backgrounds`
❌ No `init()` method called
❌ No canvas created
❌ No themes loaded

---

## ❌ Failed Initialization - Shader File Not Found

### Console Output

```
[ShaderInit] 🎬 Activating shader theme: night
[ShaderInit] Adding canvas to DOM...
[ShaderInit] ✓ Canvas inserted into DOM as first child of body
[ShaderInit] 🎭 Loading theme: night
[ShaderInit] Shader file for theme: night-shader.glsl
[ShaderInit] 📥 Loading shader source: night-shader.glsl
[ShaderInit] Fetching shader from: /js/shaders/night-shader.glsl
[ShaderInit] Fetch response: {status: 404, statusText: 'Not Found', ok: false}
[ShaderInit] ❌ Error loading shader: Error: Failed to load shader: night-shader.glsl (404)
[ShaderInit] ❌ Failed to load theme
```

### Key Failure Indicators

❌ `[ShaderInit] Fetch response: {status: 404, ...}`
❌ `[ShaderInit] ❌ Error loading shader`
❌ `[ShaderInit] ❌ Failed to load theme`
❌ No shader compilation
❌ No render loop started

---

## ❌ Failed Initialization - Shader Compilation Error

### Console Output

```
[ShaderInit] 🔧 Creating shader program...
[ShaderInit] 🔨 Compiling VERTEX shader...
[ShaderInit] ✓ VERTEX shader compiled successfully
[ShaderInit] 🔨 Compiling FRAGMENT shader...
[ShaderInit] ❌ Shader compile error: ERROR: 0:15: 'undeclaredVariable' : undeclared identifier
ERROR: 0:15: '=' : cannot convert from 'const mediump float' to 'temp highp 4-component vector of float'

[ShaderInit] Shader source:
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
...
[ShaderInit] ❌ Shader compilation failed
[ShaderInit] ❌ Failed to create shader program
[ShaderInit] ❌ Failed to load theme
```

### Key Failure Indicators

❌ `[ShaderInit] ❌ Shader compile error: ...`
❌ Detailed GLSL error message shown
❌ `[ShaderInit] ❌ Shader compilation failed`
❌ Full shader source logged for debugging
❌ No program created

---

## ❌ Failed Initialization - Program Link Error

### Console Output

```
[ShaderInit] 🔧 Creating shader program...
[ShaderInit] 🔨 Compiling VERTEX shader...
[ShaderInit] ✓ VERTEX shader compiled successfully
[ShaderInit] 🔨 Compiling FRAGMENT shader...
[ShaderInit] ✓ FRAGMENT shader compiled successfully
[ShaderInit] Linking program...
[ShaderInit] ❌ Program link error: Fragment shader is not compatible with vertex shader
[ShaderInit] ❌ Shader compilation failed
[ShaderInit] ❌ Failed to load theme
```

### Key Failure Indicators

❌ `[ShaderInit] ❌ Program link error: ...`
❌ Shaders compile but don't link
❌ Usually indicates varying mismatch

---

## ⚠️ Warning - Low FPS Detected

### Console Output

```
[ShaderRender] FPS: 60
[ShaderRender] FPS: 59
[ShaderRender] FPS: 28
[ShaderInit] ⚠️ Low FPS detected, reducing quality
[ShaderInit] Device pixel ratio: 2 Quality setting: low
[ShaderInit] 📐 Resizing canvas: {
    viewportWidth: 1920,
    viewportHeight: 1080,
    devicePixelRatio: 1,
    canvasWidth: 1920,
    canvasHeight: 1080
}
[ShaderInit] ✓ Canvas resized and viewport set
[ShaderRender] FPS: 42
[ShaderRender] FPS: 55
[ShaderRender] FPS: 59
```

### Key Indicators

⚠️ `[ShaderInit] ⚠️ Low FPS detected, reducing quality`
⚠️ Quality automatically adjusted
✅ Performance recovered

---

## 🌙 Page Visibility Changes

### When Tab Becomes Hidden

```
[ShaderInit] 🌙 Page hidden, pausing shaders
[ShaderInit] ⏸️ Pausing render loop
```

### When Tab Becomes Visible

```
[ShaderInit] 🌞 Page visible, resuming shaders
[ShaderInit] ▶️ Resuming render loop
```

---

## 🎨 Theme Switching

### Switching from Night to Water

```
[ShaderInit] 🎬 Activating shader theme: water
[ShaderInit] Canvas already in DOM
[ShaderInit] 🎭 Loading theme: water
[ShaderInit] Shader file for theme: water-shader.glsl
[ShaderInit] 📥 Loading shader source: water-shader.glsl
[ShaderInit] Fetching shader from: /js/shaders/water-shader.glsl
[ShaderInit] Fetch response: {status: 200, statusText: 'OK', ok: true}
[ShaderInit] ✓ Shader source loaded: {
    filename: 'water-shader.glsl',
    length: 3124,
    lines: 98
}
[ShaderInit] 🔧 Creating shader program...
[ShaderInit] Cleaning up old shader program
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
[ShaderInit] Uniform locations: {
    resolution: 'found',
    time: 'found',
    intensity: 'found'
}
[ShaderInit] ✅ Theme loaded successfully: water
[ShaderInit] ✓ Theme loaded, starting render loop...
[ShaderInit] ▶️ Resuming render loop
[ShaderInit] ✅ Shader activated and rendering!
```

---

## 🔧 Debug Commands

### Check Initialization Status

```javascript
// Check if class exists
typeof ShaderThemeManager !== 'undefined'
// Expected: true

// Check if instance exists
window.EyesOfAzrael?.shaders
// Expected: ShaderThemeManager {enabled: true, intensity: 1, ...}

// Get full status
window.EyesOfAzrael?.shaders?.getStatus()
// Expected: {
//   enabled: true,
//   supported: true,
//   theme: "night",
//   fps: 60,
//   quality: "high",
//   intensity: 1
// }

// Check canvas in DOM
document.getElementById('shader-background')
// Expected: <canvas id="shader-background" ...>

// Check if rendering
window.EyesOfAzrael?.shaders?.animationId
// Expected: number (not null)

// Check WebGL context
window.EyesOfAzrael?.shaders?.gl
// Expected: WebGLRenderingContext {canvas: canvas, ...}

// Check current program
window.EyesOfAzrael?.shaders?.program
// Expected: WebGLProgram {}
```

### Manual Shader Operations

```javascript
// Activate a theme
window.EyesOfAzrael.shaders.activate('fire')

// Change intensity
window.EyesOfAzrael.shaders.setIntensity(0.5)

// Toggle on/off
window.EyesOfAzrael.shaders.toggle()

// Pause rendering
window.EyesOfAzrael.shaders.pause()

// Resume rendering
window.EyesOfAzrael.shaders.resume()

// Destroy and cleanup
window.EyesOfAzrael.shaders.destroy()
```

---

## 📊 Performance Monitoring

### Normal Operation

```
[ShaderRender] FPS: 60
[ShaderRender] FPS: 60
[ShaderRender] FPS: 59
[ShaderRender] FPS: 60
```

### Performance Issue Detected

```
[ShaderRender] FPS: 60
[ShaderRender] FPS: 45
[ShaderRender] FPS: 28
[ShaderInit] ⚠️ Low FPS detected, reducing quality
```

### Performance Recovery

```
[ShaderRender] FPS: 42
[ShaderRender] FPS: 55
[ShaderRender] FPS: 58
[ShaderInit] ✓ Good FPS, increasing quality
[ShaderRender] FPS: 60
```

---

## 🎯 Comparison Summary

| Scenario | Console Messages | Shaders Visible? | FPS Logs? |
|----------|-----------------|------------------|-----------|
| **Success** | All ✅ messages | Yes | Yes (60 FPS) |
| **Script Missing** | `ShaderThemeManager not found` | No | No |
| **WebGL Not Supported** | `WebGL not supported` | No | No |
| **Shader 404** | `Failed to load shader (404)` | No | No |
| **Compile Error** | `Shader compile error` | No | No |
| **Link Error** | `Program link error` | No | No |

---

## 🔍 Quick Diagnostic Checklist

Run these checks in order:

1. **Is the class defined?**
   ```javascript
   typeof ShaderThemeManager
   ```
   - ✅ "function" → Class loaded
   - ❌ "undefined" → Script not loaded

2. **Is there an instance?**
   ```javascript
   window.EyesOfAzrael?.shaders
   ```
   - ✅ Object exists → Instance created
   - ❌ undefined → Not initialized

3. **Is WebGL supported?**
   ```javascript
   window.EyesOfAzrael.shaders.webglSupported
   ```
   - ✅ true → WebGL available
   - ❌ false → No WebGL

4. **Is canvas in DOM?**
   ```javascript
   document.getElementById('shader-background')
   ```
   - ✅ Element exists → Canvas inserted
   - ❌ null → Canvas not added

5. **Is render loop running?**
   ```javascript
   window.EyesOfAzrael.shaders.animationId
   ```
   - ✅ Number → Rendering active
   - ❌ null → Not rendering

If all checks pass but shaders still not visible:
- Check canvas z-index (should be -1)
- Check canvas position (should be fixed)
- Check canvas opacity
- Inspect shader program for errors
- Check browser console for WebGL warnings

---

## 💡 Tips for Debugging

1. **Use the debug version** for development:
   ```html
   <script src="js/shader-theme-manager-debug.js"></script>
   ```

2. **Enable verbose logging** in production temporarily to diagnose issues

3. **Check Network tab** for 404s on .glsl files

4. **Monitor FPS** to detect performance issues

5. **Use test page** (`test-shader-init.html`) for comprehensive diagnostics

6. **Check WebGL errors** with:
   ```javascript
   const error = window.EyesOfAzrael.shaders.gl.getError();
   console.log('WebGL Error:', error); // 0 = NO_ERROR
   ```
