# Shader Fix - Quick Start Guide

## 🎯 The Problem

Shaders aren't appearing on the site.

## 🔍 Root Cause

**Missing Script**: `index.html` references a non-existent file.

```
index.html line 131:
❌ <script src="js/shader-manager.js"></script>  ← This file doesn't exist
```

## ✅ The Fix

### Step 1: Open index.html

Navigate to: `H:\Github\EyesOfAzrael\index.html`

### Step 2: Find Line 131

Look for:
```html
<script src="js/shader-manager.js"></script>
```

### Step 3: Replace With

```html
<script src="js/shaders/shader-themes.js"></script>
```

### Step 4: Save and Test

1. Save the file
2. Reload your browser
3. Open DevTools Console (F12)
4. Look for these success messages:

```
[ShaderInit] 🚀 Constructor called
[ShaderInit] ✓ WebGL is supported, initializing...
[ShaderInit] ✅ Initialization complete!
[ShaderInit] ✅ Shader activated and rendering!
[ShaderRender] FPS: 60
```

5. Visual confirmation: You should see animated shader background

## 🧪 Test It

Open this test page in your browser:
```
file:///H:/Github/EyesOfAzrael/test-shader-init.html
```

Click "Run Full Test" - all tests should pass ✅

## 🐛 Still Not Working?

### Quick Diagnostics

Open browser console and run:
```javascript
// Should return "function"
typeof ShaderThemeManager

// Should return an object with shader info
window.EyesOfAzrael.shaders.getStatus()

// Should return the canvas element
document.getElementById('shader-background')
```

### Check These Files Exist

- ✅ `js/shaders/shader-themes.js`
- ✅ `js/shaders/water-shader.glsl`
- ✅ `js/shaders/fire-shader.glsl`
- ✅ `js/shaders/night-shader.glsl`
- ✅ `js/shaders/day-shader.glsl`
- ✅ (and other .glsl files)

## 📚 Need More Info?

- **Detailed trace**: See `SHADER_INIT_TRACE.md`
- **Expected console output**: See `SHADER_CONSOLE_OUTPUT.md`
- **Full report**: See `SHADER_INITIALIZATION_COMPLETE_REPORT.md`
- **Enhanced debugging**: Use `js/shader-theme-manager-debug.js` instead

## 🎨 Available Themes

Once working, test different themes:

```javascript
// Try these in console:
window.EyesOfAzrael.shaders.activate('water')   // 🌊
window.EyesOfAzrael.shaders.activate('fire')    // 🔥
window.EyesOfAzrael.shaders.activate('night')   // 🌙
window.EyesOfAzrael.shaders.activate('day')     // ☀️
window.EyesOfAzrael.shaders.activate('earth')   // 🌿
window.EyesOfAzrael.shaders.activate('air')     // 💨
window.EyesOfAzrael.shaders.activate('chaos')   // 🌀
window.EyesOfAzrael.shaders.activate('order')   // ⚜️
```

## ✨ That's It!

One line change fixes everything. Happy coding! 🚀
