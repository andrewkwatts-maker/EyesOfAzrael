# Shader Quick Fix Guide

## The Problem in One Sentence

**index.html** loads a non-existent file `js/shader-manager.js` instead of the correct `js/shaders/shader-themes.js`.

---

## The Fix (One Line Change)

### Open File
```
h:\Github\EyesOfAzrael\index.html
```

### Find Line 131
```html
<script src="js/shader-manager.js"></script>
```

### Replace With
```html
<script src="js/shaders/shader-themes.js"></script>
```

**That's it!** The shader system will now load and work immediately.

---

## Verification Steps

### 1. Open Browser Console
After making the change, reload the page and check the console.

### You Should See
```
[ShaderThemes] Loaded theme: day
```
or
```
[ShaderThemes] Loaded theme: night
```

### You Should NOT See
```
[App] ShaderThemeManager not found, skipping
```

### 2. Check for WebGL Canvas
Open DevTools → Elements → Look for:
```html
<canvas id="shader-background" style="position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; z-index: -1; pointer-events: none;"></canvas>
```

This canvas should be inserted as the first child of `<body>`.

### 3. Visual Check
You should see:
- **If daytime (6am-6pm)**: Bright sky with wispy clouds moving gently
- **If nighttime (6pm-6am)**: Starfield with twinkling stars and subtle aurora

### 4. Performance Check
Open console and run:
```javascript
window.EyesOfAzrael.shaders.getStatus()
```

Should return something like:
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

---

## What Happens After Fix

### Immediate Changes
1. **ShaderThemeManager loads** → Class becomes available
2. **app-init-simple.js detects it** → Creates shader manager instance
3. **Auto-activation** → Picks day or night theme based on current hour
4. **Canvas renders** → WebGL shader background appears
5. **Panels become glass-like** → Backdrop-filter shows shader through blur

### Visual Impact
- Subtle animated background behind all content
- Panels appear semi-transparent with blurred shader
- Smooth 60 FPS animation
- Professional, atmospheric feel

---

## Testing the Fix

### Test Different Themes
Open browser console and try:

```javascript
// Test water theme (ocean waves)
window.EyesOfAzrael.shaders.activate('water');

// Test fire theme (flames and embers)
window.EyesOfAzrael.shaders.activate('fire');

// Test night theme (stars and aurora)
window.EyesOfAzrael.shaders.activate('night');

// Test earth theme (living meadow with grass/flowers)
window.EyesOfAzrael.shaders.activate('earth');

// Test chaos theme (black hole effect)
window.EyesOfAzrael.shaders.activate('chaos');

// Test order theme (sacred geometry)
window.EyesOfAzrael.shaders.activate('order');

// Test day theme (sunny sky with clouds)
window.EyesOfAzrael.shaders.activate('day');

// Test air theme (wind patterns)
window.EyesOfAzrael.shaders.activate('air');

// Test light theme (glowing particles)
window.EyesOfAzrael.shaders.activate('light');

// Test dark theme (flowing shadows)
window.EyesOfAzrael.shaders.activate('dark');
```

### Adjust Intensity
```javascript
// Make it more subtle
window.EyesOfAzrael.shaders.setIntensity(0.5);

// Make it stronger
window.EyesOfAzrael.shaders.setIntensity(1.0);
```

### Toggle On/Off
```javascript
// Turn off
window.EyesOfAzrael.shaders.toggle();

// Turn on
window.EyesOfAzrael.shaders.toggle();
```

### Check Performance
```javascript
// Monitor FPS
setInterval(() => {
    const status = window.EyesOfAzrael.shaders.getStatus();
    console.log(`FPS: ${status.fps}, Quality: ${status.quality}`);
}, 1000);
```

---

## Advanced Testing

### Open Demo Pages

#### Diagnostic Test Page
```
http://localhost/shader-test.html
```
- Runs automated tests
- Shows detailed status
- Tests all shader files
- Displays FPS and quality metrics

#### Interactive Demo Page
```
http://localhost/shader-demo.html
```
- Visual theme picker
- Intensity slider
- Quality controls
- Real-time performance stats

---

## Troubleshooting

### If Shaders Still Don't Appear

#### Check 1: WebGL Support
```javascript
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
console.log('WebGL supported:', !!gl);
```

If false, your browser doesn't support WebGL. The system will use CSS gradient fallbacks instead.

#### Check 2: File Accessibility
Open Network tab in DevTools and check if these files load successfully:
- `js/shaders/shader-themes.js` (should be 200 OK)
- `js/shaders/night-shader.glsl` or `js/shaders/day-shader.glsl` (should be 200 OK)

#### Check 3: Console Errors
Look for:
- CORS errors → Check server allows local file access
- Compile errors → Check shader GLSL syntax
- WebGL context errors → Check browser compatibility

#### Check 4: Reduced Motion Preference
```javascript
console.log(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
```

If true, shaders are intentionally disabled for accessibility. This is expected behavior.

### If Performance Is Poor

#### Lower Quality
```javascript
window.EyesOfAzrael.shaders.settings.quality = 'low';
window.EyesOfAzrael.shaders.handleResize();
```

#### Reduce Intensity
```javascript
window.EyesOfAzrael.shaders.setIntensity(0.3);
```

#### Check FPS
```javascript
console.log(window.EyesOfAzrael.shaders.getStatus().fps);
```

The system auto-adjusts quality if FPS < 30, but you can manually control it.

---

## Optional Enhancements (Not Required)

### Add User Control Button
If you want users to toggle shaders, add to header:

```html
<button id="shaderToggle" class="icon-btn" aria-label="Toggle shader effects">
    ✨
</button>
```

Then add to app-init-simple.js:
```javascript
const shaderToggle = document.getElementById('shaderToggle');
if (shaderToggle && window.EyesOfAzrael.shaders) {
    shaderToggle.addEventListener('click', () => {
        const enabled = window.EyesOfAzrael.shaders.toggle();
        shaderToggle.style.opacity = enabled ? '1' : '0.5';
    });
}
```

### Map Mythologies to Shaders
To activate different shaders for different mythology pages, add to app-init-simple.js:

```javascript
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
    'sumerian': 'earth',
    'mayan': 'earth',
    'aztec': 'fire',
    'yoruba': 'earth',
    'buddhist': 'light',
    'christian': 'light'
};

window.addEventListener('hashchange', () => {
    if (!window.EyesOfAzrael.shaders) return;

    const hash = window.location.hash;
    const match = hash.match(/^#\/mythos\/([^\/]+)/);

    if (match) {
        const mythology = match[1].toLowerCase();
        const shader = mythologyShaderMap[mythology] || 'dark';
        window.EyesOfAzrael.shaders.activate(shader);
    }
});
```

---

## Summary

**Required Change**: 1 line in index.html (line 131)
- **From**: `<script src="js/shader-manager.js"></script>`
- **To**: `<script src="js/shaders/shader-themes.js"></script>`

**Expected Result**: Animated shader background appears immediately

**Verification**: Check console for `[ShaderThemes] Loaded theme: ...`

**Testing**: Use demo pages (shader-test.html, shader-demo.html)

**Documentation**: See SHADER_DIAGNOSIS.md for complete analysis

---

## Next Steps After Fix

1. ✅ **Make the one-line change** in index.html
2. ✅ **Reload the page** in browser
3. ✅ **Verify shaders appear** (subtle animated background)
4. ✅ **Test different themes** using console commands
5. ✅ **Check performance** (should be 60 FPS)
6. ⭐ **Optional**: Add user controls
7. ⭐ **Optional**: Map mythologies to specific shaders

The system is production-ready and will work immediately after the fix!
