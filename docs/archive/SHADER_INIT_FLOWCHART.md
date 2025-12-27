# Shader Initialization Flowchart

## Complete Initialization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     PAGE LOADS                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Load HTML & Scripts                            │
│  1. Firebase SDK                                            │
│  2. Firebase Config                                         │
│  3. Core App Scripts                                        │
│  4. shader-themes.js ◄─── MISSING! (Line 131 issue)        │
│  5. app-init-simple.js                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ DOM Ready?         │
         └────────┬───────────┘
                  │ Yes
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           app-init-simple.js Executes                       │
│                                                             │
│  if (typeof ShaderThemeManager !== 'undefined') {          │
│      window.EyesOfAzrael.shaders = new ShaderThemeManager  │
│  } else {                                                   │
│      console.warn('ShaderThemeManager not found')          │
│      ◄─── CURRENTLY THIS BRANCH EXECUTES                   │
│  }                                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│        ShaderThemeManager Constructor                       │
│                                                             │
│  1. Initialize properties                                  │
│  2. Setup shader cache (Map)                               │
│  3. Configure theme mappings (40+ themes)                  │
│  4. Set performance settings                               │
│  5. Initialize FPS counter                                 │
│                                                             │
│  6. Check WebGL Support                                    │
│     ├─ Create test canvas                                  │
│     ├─ Get WebGL context                                   │
│     └─ Return true/false                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ WebGL Supported?   │
         └────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
        Yes               No
         │                 │
         ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│  init()      │  │  Fallback to CSS │
│              │  │  (Silent)        │
└──────┬───────┘  └──────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    init() Method                            │
│                                                             │
│  1. Create Canvas                                          │
│     ├─ createElement('canvas')                             │
│     ├─ Set id='shader-background'                          │
│     ├─ Apply CSS (position:fixed, z-index:-1)              │
│     └─ NOT YET IN DOM                                      │
│                                                             │
│  2. Get WebGL Context                                      │
│     ├─ canvas.getContext('webgl')                          │
│     ├─ Fallback to 'experimental-webgl'                    │
│     └─ Configure (alpha, antialias, etc.)                  │
│                                                             │
│  3. Setup Resize Handler                                   │
│     ├─ Bind handleResize()                                 │
│     ├─ Add window.resize listener                          │
│     └─ Call initial resize                                 │
│                                                             │
│  4. Setup Visibility Handler                               │
│     └─ Pause/resume on tab visibility                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│          Auto-activate shader (app-init-simple.js)         │
│                                                             │
│  const hour = new Date().getHours();                       │
│  const theme = (hour >= 6 && hour < 18) ? 'day' : 'night' │
│  shaders.activate(theme)                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              activate(themeName) Method                     │
│                                                             │
│  1. Check WebGL Support                                    │
│     └─ If not supported, exit                              │
│                                                             │
│  2. Insert Canvas into DOM                                 │
│     ├─ Check if already in DOM                             │
│     └─ document.body.insertBefore(canvas, body.firstChild) │
│                                                             │
│  3. Call loadTheme(themeName)                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│             loadTheme(themeName) Method                     │
│                                                             │
│  1. Map theme to shader file                               │
│     'night' → 'night-shader.glsl'                          │
│                                                             │
│  2. Load Shader Source                                     │
│     ├─ Check cache                                         │
│     ├─ fetch('/js/shaders/night-shader.glsl')              │
│     └─ Store in cache                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ Fetch Successful?  │
         └────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
        Yes               No (404)
         │                 │
         ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│  Continue    │  │  Log Error       │
│              │  │  Return false    │
└──────┬───────┘  └──────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Compile Shaders                                │
│                                                             │
│  1. Create Vertex Shader                                   │
│     ├─ gl.createShader(VERTEX_SHADER)                      │
│     ├─ gl.shaderSource(shader, source)                     │
│     ├─ gl.compileShader(shader)                            │
│     └─ Check compile status                                │
│                                                             │
│  2. Create Fragment Shader                                 │
│     ├─ gl.createShader(FRAGMENT_SHADER)                    │
│     ├─ gl.shaderSource(shader, fragmentSource)             │
│     ├─ gl.compileShader(shader)                            │
│     └─ Check compile status                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ Shaders Compiled?  │
         └────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
        Yes               No
         │                 │
         ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│  Link        │  │  Log GLSL Error  │
│  Program     │  │  Return null     │
└──────┬───────┘  └──────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                Link Shader Program                          │
│                                                             │
│  1. Create Program                                         │
│     ├─ gl.createProgram()                                  │
│     ├─ gl.attachShader(program, vertexShader)              │
│     ├─ gl.attachShader(program, fragmentShader)            │
│     └─ gl.linkProgram(program)                             │
│                                                             │
│  2. Check Link Status                                      │
│     └─ If failed, log error and return                     │
│                                                             │
│  3. Use Program                                            │
│     └─ gl.useProgram(program)                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Setup Vertex Buffer                            │
│                                                             │
│  1. Create vertices for full-screen quad                   │
│     [-1,-1, 1,-1, -1,1, 1,1]                               │
│                                                             │
│  2. Create and bind buffer                                 │
│  3. Get attribute location (a_position)                    │
│  4. Enable vertex attrib array                             │
│  5. Set vertex attrib pointer                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                Get Uniform Locations                        │
│                                                             │
│  uniforms = {                                              │
│    resolution: gl.getUniformLocation('u_resolution'),      │
│    time: gl.getUniformLocation('u_time'),                  │
│    intensity: gl.getUniformLocation('u_intensity')         │
│  }                                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│            Theme Loaded Successfully!                       │
│            Return to activate()                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  resume() Method                            │
│                                                             │
│  Start render loop:                                        │
│    this.animationId = requestAnimationFrame(() => render())│
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   render() Loop                             │
│  ┌───────────────────────────────────────────┐             │
│  │ 1. Check enabled & program exists         │◄────┐       │
│  │ 2. Calculate elapsed time                 │     │       │
│  │ 3. Update FPS counter (every 1000ms)      │     │       │
│  │ 4. Clear canvas                            │     │       │
│  │ 5. Set uniforms (resolution, time, etc)   │     │       │
│  │ 6. Draw (gl.drawArrays TRIANGLE_STRIP)    │     │       │
│  │ 7. Request next frame ────────────────────┴─────┘       │
│  └───────────────────────────────────────────┘             │
│                                                             │
│  Renders at ~60 FPS indefinitely                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Failure Flow - Script Not Loaded

```
┌─────────────────────────────────────────────────────────────┐
│                     PAGE LOADS                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Load HTML & Scripts                            │
│  1. Firebase SDK                                            │
│  2. Firebase Config                                         │
│  3. Core App Scripts                                        │
│  4. ❌ js/shader-manager.js (DOES NOT EXIST!)              │
│  5. app-init-simple.js                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ Script Loads?      │
         └────────┬───────────┘
                  │ 404 Error
                  ▼
┌─────────────────────────────────────────────────────────────┐
│        ShaderThemeManager Not Defined                       │
│        typeof ShaderThemeManager === 'undefined'            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           app-init-simple.js Executes                       │
│                                                             │
│  if (typeof ShaderThemeManager !== 'undefined') {          │
│      // This block is SKIPPED                              │
│  } else {                                                   │
│      console.warn('ShaderThemeManager not found')          │
│      // App continues WITHOUT shaders ◄─── SILENT FAILURE  │
│  }                                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              App Continues                                  │
│              No shaders                                     │
│              No visual effects                              │
│              No errors thrown                               │
│              ❌ SILENT FAILURE                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Success vs Failure Decision Points

```
                    ┌─────────────────┐
                    │  PAGE LOADS     │
                    └────────┬────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ shader-themes.js     │
                  │ loaded correctly?    │
                  └──────┬───────┬───────┘
                         │       │
                    Yes  │       │  No
                         │       │
                         ▼       ▼
              ┌─────────────┐ ┌──────────────────┐
              │ Constructor │ │ ❌ Class not     │
              │ called      │ │    defined       │
              └──────┬──────┘ │ Silent failure   │
                     │         └──────────────────┘
                     ▼
          ┌────────────────────┐
          │ WebGL supported?   │
          └──────┬─────┬───────┘
                 │     │
            Yes  │     │  No
                 │     │
                 ▼     ▼
     ┌──────────────┐ ┌──────────────────┐
     │ init()       │ │ ⚠️ Fallback to   │
     │ creates      │ │    CSS           │
     │ canvas & GL  │ │ Warned but       │
     └──────┬───────┘ │ continues        │
            │         └──────────────────┘
            ▼
  ┌────────────────────┐
  │ activate() called  │
  └──────┬─────────────┘
         │
         ▼
  ┌────────────────────┐
  │ Shader file        │
  │ exists?            │
  └──────┬─────┬───────┘
         │     │
    Yes  │     │  No (404)
         │     │
         ▼     ▼
┌──────────┐ ┌──────────────────┐
│ Compile  │ │ ❌ Load failed   │
│ shaders  │ │ Error logged     │
└────┬─────┘ └──────────────────┘
     │
     ▼
┌────────────────────┐
│ Compilation        │
│ successful?        │
└──────┬─────┬───────┘
       │     │
  Yes  │     │  No
       │     │
       ▼     ▼
┌─────────┐ ┌──────────────────┐
│ Link    │ │ ❌ Compile error │
│ program │ │ GLSL error shown │
└────┬────┘ └──────────────────┘
     │
     ▼
┌────────────────────┐
│ Link               │
│ successful?        │
└──────┬─────┬───────┘
       │     │
  Yes  │     │  No
       │     │
       ▼     ▼
┌─────────┐ ┌──────────────────┐
│ Start   │ │ ❌ Link error    │
│ render  │ │ Error logged     │
│ loop    │ └──────────────────┘
└────┬────┘
     │
     ▼
┌─────────────────────────────────┐
│ ✅ SHADERS WORKING!             │
│ - Canvas visible in DOM         │
│ - WebGL context active          │
│ - Render loop running           │
│ - FPS: 60                       │
│ - Visual effects showing        │
└─────────────────────────────────┘
```

---

## Quick Diagnostic Flowchart

```
┌─────────────────────────────────┐
│ Are shaders appearing?          │
└──────┬─────────────────┬────────┘
       │                 │
      No                Yes
       │                 │
       ▼                 ▼
┌─────────────────┐ ┌─────────────┐
│ Open Console    │ │ ✅ Working! │
└──────┬──────────┘ └─────────────┘
       │
       ▼
┌───────────────────────────────────────┐
│ typeof ShaderThemeManager             │
└──────┬────────────────────────┬───────┘
       │                        │
   "function"              "undefined"
       │                        │
       ▼                        ▼
┌─────────────────┐ ┌─────────────────────────┐
│ Class loaded    │ │ ❌ Script not loaded    │
│ Check WebGL     │ │                         │
└──────┬──────────┘ │ FIX: Add script to HTML │
       │            │ <script src="js/shaders │
       ▼            │ /shader-themes.js">     │
┌─────────────────┐ └─────────────────────────┘
│ shaders.        │
│ webglSupported  │
└──────┬──────────┘
       │
┌──────┴──────┐
│             │
true        false
│             │
▼             ▼
┌───────┐ ┌─────────────────────┐
│Check  │ │ ❌ WebGL disabled   │
│canvas │ │                     │
└───┬───┘ │ FIX: Enable WebGL   │
    │     │ or use diff browser │
    ▼     └─────────────────────┘
┌─────────────────────┐
│ Canvas in DOM?      │
│ getElementById      │
│ ('shader-background│
│  ')                 │
└──────┬──────────────┘
       │
┌──────┴──────┐
│             │
Found      null
│             │
▼             ▼
┌──────┐ ┌──────────────────┐
│Check │ │ ❌ Canvas not    │
│render│ │    inserted      │
└───┬──┘ │                  │
    │    │ Check activate() │
    ▼    │ was called       │
┌─────────────────┐ └────────┘
│ animationId     │
│ !== null?       │
└──────┬──────────┘
       │
┌──────┴──────┐
│             │
Yes          No
│             │
▼             ▼
┌──────┐ ┌──────────────────┐
│Check │ │ ❌ Render loop   │
│FPS   │ │    not started   │
└───┬──┘ │                  │
    │    │ Check console    │
    ▼    │ for errors       │
┌─────────────┐ └────────────┘
│ FPS logs    │
│ appearing?  │
└──────┬──────┘
       │
┌──────┴──────┐
│             │
Yes          No
│             │
▼             ▼
┌──────┐ ┌──────────────────┐
│✅ All│ │ ❌ Rendering     │
│ good!│ │    stopped       │
└──────┘ │                  │
         │ Check shader     │
         │ compile errors   │
         └──────────────────┘
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ Firebase   │  │ shader-    │  │ app-init-simple.js │   │
│  │ SDK        │  │ themes.js  │  │                    │   │
│  └─────┬──────┘  └─────┬──────┘  └──────────┬─────────┘   │
│        │               │                     │             │
└────────┼───────────────┼─────────────────────┼─────────────┘
         │               │                     │
         ▼               ▼                     ▼
    ┌─────────┐   ┌────────────────┐   ┌────────────┐
    │Firebase │   │ShaderTheme     │   │Initialize  │
    │Services │   │Manager         │   │App         │
    │         │   │Class           │   │Components  │
    └─────────┘   └────────┬───────┘   └─────┬──────┘
                           │                   │
                           │                   │
                           │      Creates      │
                           │◄──────────────────┤
                           │                   │
                           ▼                   │
                  ┌─────────────────┐          │
                  │Instance:        │          │
                  │EyesOfAzrael     │          │
                  │.shaders         │          │
                  └────────┬────────┘          │
                           │                   │
                           │   activate()      │
                           ├───────────────────┤
                           │                   │
                           ▼                   │
                  ┌─────────────────┐          │
                  │Load & Compile   │          │
                  │Shader Files     │          │
                  │(.glsl)          │          │
                  └────────┬────────┘          │
                           │                   │
                           ▼                   │
                  ┌─────────────────┐          │
                  │WebGL Context    │          │
                  │& Canvas         │          │
                  └────────┬────────┘          │
                           │                   │
                           ▼                   │
                  ┌─────────────────┐          │
                  │Render Loop      │          │
                  │(60 FPS)         │          │
                  └────────┬────────┘          │
                           │                   │
                           ▼                   ▼
                  ┌─────────────────────────────┐
                  │     Visual Shader Effects   │
                  │     Displayed on Screen     │
                  └─────────────────────────────┘
```

---

## File Structure Overview

```
EyesOfAzrael/
├── index.html                    ◄─── FIX LINE 131 HERE
│   └── Scripts:
│       ├── Firebase SDK          ✅
│       ├── Firebase Config        ✅
│       ├── shader-manager.js     ❌ DOES NOT EXIST
│       └── app-init-simple.js    ✅
│
├── js/
│   ├── app-init-simple.js        ✅ Calls ShaderThemeManager
│   │
│   ├── shaders/
│   │   ├── shader-themes.js      ✅ ACTUAL FILE (not loaded!)
│   │   ├── water-shader.glsl     ✅
│   │   ├── fire-shader.glsl      ✅
│   │   ├── night-shader.glsl     ✅
│   │   ├── day-shader.glsl       ✅
│   │   ├── earth-shader.glsl     ✅
│   │   └── ... (more .glsl)      ✅
│   │
│   └── shader-theme-manager-debug.js  ✅ NEW: Enhanced logging
│
├── test-shader-init.html         ✅ NEW: Test suite
├── SHADER_INIT_TRACE.md          ✅ NEW: Documentation
├── SHADER_CONSOLE_OUTPUT.md      ✅ NEW: Expected output
├── SHADER_FIX_QUICK_START.md     ✅ NEW: Quick fix guide
└── SHADER_INIT_FLOWCHART.md      ✅ THIS FILE
```

---

## Summary

**The Problem**: `index.html` line 131 references non-existent `js/shader-manager.js`

**The Solution**: Change to `js/shaders/shader-themes.js`

**Result**: Complete shader system activation with WebGL rendering at 60 FPS
