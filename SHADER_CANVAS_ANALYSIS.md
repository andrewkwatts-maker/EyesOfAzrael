# Shader Canvas DOM and CSS Analysis

## Executive Summary

The shader system is not visible due to **mismatched canvas IDs** and **missing script references**. The canvas element in the HTML uses `id="shader-canvas"` while the JavaScript creates a canvas with `id="shader-background"`. Additionally, the wrong script file is referenced.

---

## 1. DOM Structure Issues

### Current State (index.html line 54)
```html
<canvas id="shader-canvas" class="shader-background"></canvas>
```

### What JavaScript Creates (shader-themes.js lines 112-122)
```javascript
this.canvas = document.createElement('canvas');
this.canvas.id = 'shader-background';  // DIFFERENT ID!
this.canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
`;
```

### The Problem
1. **Two canvases exist**: The static HTML canvas AND the dynamically created one
2. **CSS targets wrong ID**: CSS looks for `#shader-background` (the JS-created one)
3. **Static canvas is unstyled**: The `#shader-canvas` has no positioning CSS
4. **Dynamic canvas replaces static**: When JS runs, it creates a second canvas

---

## 2. Script Reference Issues

### Current State (index.html line 131)
```html
<script src="js/shader-manager.js"></script>
```

### Actual File Location
```
H:\Github\EyesOfAzrael\js\shaders\shader-themes.js  ← CORRECT
H:\Github\EyesOfAzrael\js\shader-manager.js         ← DOES NOT EXIST
```

### The Problem
1. **404 Error**: Script fails to load
2. **ShaderThemeManager undefined**: Class never loads
3. **app-init-simple.js fails**: Lines 95-108 try to use undefined ShaderThemeManager

---

## 3. CSS Visibility Issues

### shader-backgrounds.css (lines 7-17)
```css
#shader-background {  /* ← Looking for JS-created canvas */
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

### What's Missing
```css
#shader-canvas {  /* ← Static HTML canvas has NO styles */
    /* No rules defined! */
}
```

### Z-Index Analysis
```
z-index: -1     ← Shader canvas (behind everything)
z-index: 0      ← Default (body, containers)
z-index: 1      ← Panel content (relative positioning)
z-index: 10     ← Headers, footers
z-index: 1000   ← Modals, controls
```

**The z-index is correct** - shaders should be behind content at `-1`.

---

## 4. WebGL Context Analysis

### Initialization Check (shader-themes.js lines 125-131)
```javascript
this.gl = this.canvas.getContext('webgl', {
    alpha: true,           // ✓ Allows transparency
    antialias: false,      // ✓ Better performance
    depth: false,          // ✓ Not needed for 2D
    stencil: false,        // ✓ Not needed
    premultipliedAlpha: true
});
```

**WebGL configuration is correct.**

---

## 5. Canvas Insertion Analysis

### Where Canvas is Added (shader-themes.js lines 340-342)
```javascript
if (!this.canvas.parentElement) {
    document.body.insertBefore(this.canvas, document.body.firstChild);
}
```

**Problem**: This inserts the JS-created canvas BEFORE the existing static canvas, creating duplication.

### Expected DOM Structure
```
<body>
    #shader-background (JS-created, positioned, WebGL context) ← ACTIVE
    #shader-canvas (static HTML, no styles, no WebGL)         ← DEAD
    <header>
    <main>
    <footer>
</body>
```

---

## 6. Shader Application to Panels

### Current State
Shaders are **background-only** - they don't apply to individual panels.

### What panel-shaders.css Does
```css
.entity-panel, .detail-panel {
    background: rgba(26, 31, 58, 0.85);  /* Semi-transparent */
    backdrop-filter: blur(12px);          /* Glass effect */
}
```

**This creates glass-morphism over the shader background, NOT panel-specific shaders.**

### To Apply Shaders to Individual Panels
You would need:
1. A canvas element per panel
2. Each canvas positioned `position: absolute` within the panel
3. Panel positioned `position: relative` to contain canvas
4. Z-index layering to put canvas behind panel content

**Current system does NOT support panel-specific shaders.**

---

## 7. Render Loop Analysis

### Animation Frame (shader-themes.js lines 402)
```javascript
this.animationId = requestAnimationFrame(() => this.render());
```

**This is correct and efficient.**

### FPS Monitoring (shader-themes.js lines 377-387)
```javascript
this.fpsCounter.frames++;
if (currentTime - this.fpsCounter.lastTime >= 1000) {
    this.fpsCounter.fps = this.fpsCounter.frames;
    // Adaptive quality adjustment
}
```

**Performance monitoring works correctly.**

---

## 8. Critical Path Analysis

### Expected Loading Sequence
1. ✗ Load `js/shader-manager.js` (404 - file doesn't exist)
2. ✗ ShaderThemeManager class undefined
3. ✗ app-init-simple.js fails to create shader instance
4. ✗ No shader rendering occurs

### What Should Happen
1. ✓ Load `js/shaders/shader-themes.js`
2. ✓ ShaderThemeManager class defined
3. ✓ app-init-simple.js creates instance
4. ✓ ShaderThemeManager creates canvas
5. ✓ Canvas inserted into DOM
6. ✓ WebGL context initialized
7. ✓ Shader loads and renders

---

## 9. Browser Console Errors (Expected)

```
GET http://localhost/js/shader-manager.js 404 (Not Found)
ReferenceError: ShaderThemeManager is not defined
    at app-init-simple.js:96
```

---

## 10. Root Cause Summary

| Issue | Location | Impact | Priority |
|-------|----------|--------|----------|
| Wrong script path | index.html:131 | Script doesn't load | CRITICAL |
| Duplicate canvas IDs | index.html:54 vs shader-themes.js:113 | Confusion, duplication | HIGH |
| Static canvas unused | index.html:54 | Wasted element | MEDIUM |
| No panel-shader support | N/A | Can't apply to panels | LOW |

---

## 11. Files Analyzed

```
H:\Github\EyesOfAzrael\index.html
H:\Github\EyesOfAzrael\js\shaders\shader-themes.js
H:\Github\EyesOfAzrael\js\shaders\shader-integration-example.js
H:\Github\EyesOfAzrael\js\app-init-simple.js
H:\Github\EyesOfAzrael\css\shader-backgrounds.css
H:\Github\EyesOfAzrael\css\panel-shaders.css
H:\Github\EyesOfAzrael\shader-test.html (working test file)
H:\Github\EyesOfAzrael\shader-demo.html (working demo file)
```

---

## 12. Verification Steps

### Step 1: Check Script Loading
```javascript
console.log(typeof ShaderThemeManager); // Should be "function"
```

### Step 2: Check Canvas Creation
```javascript
console.log(document.getElementById('shader-background')); // Should be canvas element
```

### Step 3: Check WebGL Context
```javascript
const canvas = document.getElementById('shader-background');
console.log(canvas?.getContext('webgl')); // Should be WebGLRenderingContext
```

### Step 4: Check Shader Manager Instance
```javascript
console.log(window.EyesOfAzrael?.shaders); // Should be ShaderThemeManager instance
```

---

## 13. Next Steps

See **SHADER_CSS_FIX.md** for exact fixes required.
