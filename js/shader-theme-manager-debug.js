/**
 * WebGL Shader Theme Manager - DEBUG VERSION
 * Enhanced with comprehensive logging for initialization tracking
 */

class ShaderThemeManager {
    constructor(options = {}) {
        console.log('[ShaderInit] 🚀 Constructor called with options:', options);

        this.enabled = true;
        this.intensity = options.intensity || 1.0;
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.currentTheme = null;
        this.animationId = null;
        this.startTime = Date.now();

        // Shader cache
        this.shaderCache = new Map();
        console.log('[ShaderInit] ✓ Shader cache initialized');

        // Theme to shader mapping
        this.themeShaders = {
            // Water/Ocean themes
            water: 'water-shader.glsl',
            ocean: 'water-shader.glsl',
            sea: 'water-shader.glsl',

            // Fire themes
            fire: 'fire-shader.glsl',
            flame: 'fire-shader.glsl',

            // Night/Sky themes
            night: 'night-shader.glsl',
            sky: 'night-shader.glsl',
            stars: 'night-shader.glsl',

            // Earth/Nature themes
            earth: 'earth-shader.glsl',
            forest: 'earth-shader.glsl',
            nature: 'earth-shader.glsl',
            meadow: 'earth-shader.glsl',

            // Light themes
            light: 'light-shader.glsl',

            // Day/Daylight themes
            day: 'day-shader.glsl',
            daylight: 'day-shader.glsl',
            sunshine: 'day-shader.glsl',

            // Dark/Shadow themes
            dark: 'dark-shader.glsl',
            shadow: 'dark-shader.glsl',

            // Air/Wind themes
            air: 'air-shader.glsl',
            wind: 'air-shader.glsl',

            // Chaos/Void themes
            chaos: 'chaos-shader.glsl',
            void: 'chaos-shader.glsl',
            abyss: 'chaos-shader.glsl',

            // Order/Divine themes
            order: 'order-shader.glsl',
            divine: 'order-shader.glsl',
            sacred: 'order-shader.glsl',
            angelic: 'order-shader.glsl',
            heaven: 'order-shader.glsl'
        };
        console.log('[ShaderInit] ✓ Theme mappings configured:', Object.keys(this.themeShaders).length, 'themes');

        // Performance settings
        this.settings = {
            targetFPS: 60,
            quality: options.quality || 'high',
            adaptiveQuality: options.adaptiveQuality !== false
        };
        console.log('[ShaderInit] ✓ Performance settings:', this.settings);

        this.fpsCounter = {
            frames: 0,
            lastTime: Date.now(),
            fps: 60
        };

        // Check WebGL support
        console.log('[ShaderInit] 🔍 Checking WebGL support...');
        this.webglSupported = this.checkWebGLSupport();

        if (this.webglSupported) {
            console.log('[ShaderInit] ✓ WebGL is supported, initializing...');
            this.init();
        } else {
            console.warn('[ShaderInit] ⚠️ WebGL not supported, falling back to CSS backgrounds');
        }
    }

    /**
     * Check if WebGL is supported
     */
    checkWebGLSupport() {
        console.log('[ShaderInit] Testing WebGL context creation...');
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            const supported = !!gl;
            console.log('[ShaderInit] WebGL support test result:', supported);
            if (gl) {
                console.log('[ShaderInit] WebGL vendor:', gl.getParameter(gl.VENDOR));
                console.log('[ShaderInit] WebGL renderer:', gl.getParameter(gl.RENDERER));
                console.log('[ShaderInit] WebGL version:', gl.getParameter(gl.VERSION));
            }
            return supported;
        } catch (e) {
            console.error('[ShaderInit] ❌ WebGL support check failed:', e);
            return false;
        }
    }

    /**
     * Initialize the shader system
     */
    init() {
        console.log('[ShaderInit] 🎨 Initializing shader system...');

        // Create canvas
        console.log('[ShaderInit] Creating canvas element...');
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'shader-background';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        `;
        console.log('[ShaderInit] ✓ Canvas element created:', {
            id: this.canvas.id,
            width: this.canvas.width,
            height: this.canvas.height
        });

        // Get WebGL context
        console.log('[ShaderInit] Getting WebGL context...');
        this.gl = this.canvas.getContext('webgl', {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: true
        }) || this.canvas.getContext('experimental-webgl');

        if (!this.gl) {
            console.error('[ShaderInit] ❌ Failed to get WebGL context');
            this.webglSupported = false;
            return;
        }
        console.log('[ShaderInit] ✓ WebGL context obtained');

        // Setup resize handler
        console.log('[ShaderInit] Setting up resize handler...');
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
        console.log('[ShaderInit] ✓ Resize handler configured');

        // Setup visibility change handler
        console.log('[ShaderInit] Setting up visibility change handler...');
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('[ShaderInit] 🌙 Page hidden, pausing shaders');
                this.pause();
            } else if (this.enabled) {
                console.log('[ShaderInit] 🌞 Page visible, resuming shaders');
                this.resume();
            }
        });
        console.log('[ShaderInit] ✓ Visibility handler configured');

        console.log('[ShaderInit] ✅ Initialization complete!');
    }

    /**
     * Handle canvas resize
     */
    handleResize() {
        if (!this.canvas || !this.gl) {
            console.warn('[ShaderInit] ⚠️ Cannot resize: canvas or gl not available');
            return;
        }

        const dpr = this.getDevicePixelRatio();
        const width = window.innerWidth;
        const height = window.innerHeight;

        console.log('[ShaderInit] 📐 Resizing canvas:', {
            viewportWidth: width,
            viewportHeight: height,
            devicePixelRatio: dpr,
            canvasWidth: width * dpr,
            canvasHeight: height * dpr
        });

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        console.log('[ShaderInit] ✓ Canvas resized and viewport set');
    }

    /**
     * Get appropriate device pixel ratio based on quality settings
     */
    getDevicePixelRatio() {
        const dpr = window.devicePixelRatio || 1;
        console.log('[ShaderInit] Device pixel ratio:', dpr, 'Quality setting:', this.settings.quality);

        switch (this.settings.quality) {
            case 'low':
                return Math.min(dpr, 1);
            case 'medium':
                return Math.min(dpr, 1.5);
            case 'high':
            default:
                return Math.min(dpr, 2);
        }
    }

    /**
     * Load a shader from file
     */
    async loadShaderSource(filename) {
        console.log('[ShaderInit] 📥 Loading shader source:', filename);

        if (this.shaderCache.has(filename)) {
            console.log('[ShaderInit] ✓ Shader loaded from cache:', filename);
            return this.shaderCache.get(filename);
        }

        try {
            const url = `/js/shaders/${filename}`;
            console.log('[ShaderInit] Fetching shader from:', url);

            const response = await fetch(url);
            console.log('[ShaderInit] Fetch response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                throw new Error(`Failed to load shader: ${filename} (${response.status})`);
            }

            const source = await response.text();
            console.log('[ShaderInit] ✓ Shader source loaded:', {
                filename,
                length: source.length,
                lines: source.split('\n').length
            });

            this.shaderCache.set(filename, source);
            return source;
        } catch (error) {
            console.error('[ShaderInit] ❌ Error loading shader:', error);
            return null;
        }
    }

    /**
     * Compile a shader
     */
    compileShader(source, type) {
        const typeName = type === this.gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
        console.log('[ShaderInit] 🔨 Compiling', typeName, 'shader...');

        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!success) {
            const error = this.gl.getShaderInfoLog(shader);
            console.error('[ShaderInit] ❌ Shader compile error:', error);
            console.error('[ShaderInit] Shader source:', source);
            this.gl.deleteShader(shader);
            return null;
        }

        console.log('[ShaderInit] ✓', typeName, 'shader compiled successfully');
        return shader;
    }

    /**
     * Create shader program
     */
    createProgram(vertexSource, fragmentSource) {
        console.log('[ShaderInit] 🔧 Creating shader program...');

        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            console.error('[ShaderInit] ❌ Shader compilation failed');
            return null;
        }

        console.log('[ShaderInit] Linking program...');
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
        if (!success) {
            const error = this.gl.getProgramInfoLog(program);
            console.error('[ShaderInit] ❌ Program link error:', error);
            this.gl.deleteProgram(program);
            return null;
        }

        console.log('[ShaderInit] ✓ Shader program created and linked successfully');
        return program;
    }

    /**
     * Setup vertex buffer (full-screen quad)
     */
    setupVertexBuffer(program) {
        console.log('[ShaderInit] 📊 Setting up vertex buffer...');

        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(program, 'a_position');
        console.log('[ShaderInit] Position attribute location:', positionLocation);

        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        console.log('[ShaderInit] ✓ Vertex buffer configured');
    }

    /**
     * Load and activate a theme
     */
    async loadTheme(themeName) {
        console.log('[ShaderInit] 🎭 Loading theme:', themeName);

        if (!this.webglSupported) {
            console.warn('[ShaderInit] ⚠️ WebGL not supported, cannot load theme');
            return false;
        }

        const shaderFile = this.themeShaders[themeName.toLowerCase()];
        if (!shaderFile) {
            console.warn(`[ShaderInit] ⚠️ No shader defined for theme: ${themeName}`);
            console.log('[ShaderInit] Available themes:', Object.keys(this.themeShaders));
            return false;
        }
        console.log('[ShaderInit] Shader file for theme:', shaderFile);

        // Load fragment shader source
        const fragmentSource = await this.loadShaderSource(shaderFile);
        if (!fragmentSource) {
            console.error('[ShaderInit] ❌ Failed to load shader source');
            return false;
        }

        // Simple vertex shader (full-screen quad)
        const vertexSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        console.log('[ShaderInit] Using default vertex shader');

        // Create program
        const program = this.createProgram(vertexSource, fragmentSource);
        if (!program) {
            console.error('[ShaderInit] ❌ Failed to create shader program');
            return false;
        }

        // Clean up old program
        if (this.program) {
            console.log('[ShaderInit] Cleaning up old shader program');
            this.gl.deleteProgram(this.program);
        }

        this.program = program;
        this.currentTheme = themeName;
        this.gl.useProgram(program);
        console.log('[ShaderInit] ✓ Shader program activated');

        // Setup vertex buffer
        this.setupVertexBuffer(program);

        // Get uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(program, 'u_resolution'),
            time: this.gl.getUniformLocation(program, 'u_time'),
            intensity: this.gl.getUniformLocation(program, 'u_intensity')
        };
        console.log('[ShaderInit] Uniform locations:', {
            resolution: this.uniforms.resolution !== null ? 'found' : 'not found',
            time: this.uniforms.time !== null ? 'found' : 'not found',
            intensity: this.uniforms.intensity !== null ? 'found' : 'not found'
        });

        console.log(`[ShaderInit] ✅ Theme loaded successfully: ${themeName}`);
        return true;
    }

    /**
     * Activate shader background
     */
    activate(themeName) {
        console.log('[ShaderInit] 🎬 Activating shader theme:', themeName);

        if (!this.webglSupported) {
            console.warn('[ShaderInit] ⚠️ WebGL not supported, cannot activate');
            return;
        }

        // Add canvas to DOM if not already added
        if (!this.canvas.parentElement) {
            console.log('[ShaderInit] Adding canvas to DOM...');
            document.body.insertBefore(this.canvas, document.body.firstChild);
            console.log('[ShaderInit] ✓ Canvas inserted into DOM as first child of body');
        } else {
            console.log('[ShaderInit] Canvas already in DOM');
        }

        // Load theme and start rendering
        this.loadTheme(themeName).then(success => {
            if (success) {
                console.log('[ShaderInit] ✓ Theme loaded, starting render loop...');
                this.enabled = true;
                this.resume();
                console.log('[ShaderInit] ✅ Shader activated and rendering!');
            } else {
                console.error('[ShaderInit] ❌ Failed to load theme');
            }
        });
    }

    /**
     * Deactivate shader background
     */
    deactivate() {
        console.log('[ShaderInit] 🛑 Deactivating shaders...');
        this.pause();
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
            console.log('[ShaderInit] ✓ Canvas removed from DOM');
        }
        this.enabled = false;
        console.log('[ShaderInit] ✓ Shaders deactivated');
    }

    /**
     * Render frame
     */
    render() {
        if (!this.enabled || !this.program || !this.gl) {
            return;
        }

        // Calculate time
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.startTime) / 1000.0;

        // Update FPS counter
        this.fpsCounter.frames++;
        if (currentTime - this.fpsCounter.lastTime >= 1000) {
            this.fpsCounter.fps = this.fpsCounter.frames;
            console.log('[ShaderRender] FPS:', this.fpsCounter.fps);
            this.fpsCounter.frames = 0;
            this.fpsCounter.lastTime = currentTime;

            // Adaptive quality adjustment
            if (this.settings.adaptiveQuality) {
                this.adjustQuality();
            }
        }

        // Clear canvas
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Set uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, elapsedTime);
        this.gl.uniform1f(this.uniforms.intensity, this.intensity);

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        // Continue animation
        this.animationId = requestAnimationFrame(() => this.render());
    }

    /**
     * Adjust quality based on FPS
     */
    adjustQuality() {
        if (this.fpsCounter.fps < 30 && this.settings.quality !== 'low') {
            console.log('[ShaderInit] ⚠️ Low FPS detected, reducing quality');
            this.settings.quality = 'low';
            this.handleResize();
        } else if (this.fpsCounter.fps > 55 && this.settings.quality === 'low') {
            console.log('[ShaderInit] ✓ Good FPS, increasing quality');
            this.settings.quality = 'medium';
            this.handleResize();
        }
    }

    /**
     * Pause rendering
     */
    pause() {
        if (this.animationId) {
            console.log('[ShaderInit] ⏸️ Pausing render loop');
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Resume rendering
     */
    resume() {
        if (!this.animationId && this.enabled) {
            console.log('[ShaderInit] ▶️ Resuming render loop');
            this.render();
        }
    }

    /**
     * Set intensity (0.0 to 1.0)
     */
    setIntensity(value) {
        this.intensity = Math.max(0, Math.min(1, value));
        console.log('[ShaderInit] Intensity set to:', this.intensity);
    }

    /**
     * Toggle shader on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        console.log('[ShaderInit] Shader toggled:', this.enabled ? 'ON' : 'OFF');
        if (this.enabled) {
            this.resume();
        } else {
            this.pause();
        }
        return this.enabled;
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        console.log('[ShaderInit] 🗑️ Destroying shader manager...');
        this.pause();

        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }

        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }

        window.removeEventListener('resize', this.handleResize);

        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.shaderCache.clear();

        console.log('[ShaderInit] ✓ Shader manager destroyed');
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            enabled: this.enabled,
            supported: this.webglSupported,
            theme: this.currentTheme,
            fps: this.fpsCounter.fps,
            quality: this.settings.quality,
            intensity: this.intensity
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ShaderThemeManager = ShaderThemeManager;
    console.log('[ShaderInit] ✅ ShaderThemeManager class registered globally');
}
