/**
 * WebGL Shader Theme Manager
 * Provides high-quality shader-based backgrounds for mythology themes
 */

class ShaderThemeManager {
    constructor(options = {}) {
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

            // Earth/Nature themes (ENHANCED with meadow features)
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

            // Chaos themes
            chaos: 'chaos-shader.glsl',
            void: 'dark-shader.glsl',
            abyss: 'dark-shader.glsl',

            // Order/Divine themes
            order: 'order-shader.glsl',
            divine: 'order-shader.glsl',
            sacred: 'order-shader.glsl',
            angelic: 'order-shader.glsl',
            heaven: 'order-shader.glsl',

            // Aurora themes
            aurora: 'aurora-shader.glsl',
            northernlights: 'aurora-shader.glsl',

            // Storm themes
            storm: 'storm-shader.glsl',
            thunder: 'storm-shader.glsl',
            lightning: 'storm-shader.glsl',

            // Cosmic themes
            cosmic: 'cosmic-shader.glsl',
            nebula: 'cosmic-shader.glsl',
            galaxy: 'cosmic-shader.glsl',
            space: 'cosmic-shader.glsl'
        };

        // Performance settings
        this.settings = {
            targetFPS: 60,
            quality: options.quality || 'high', // 'low', 'medium', 'high'
            adaptiveQuality: options.adaptiveQuality !== false
        };

        this.fpsCounter = {
            frames: 0,
            lastTime: Date.now(),
            fps: 60
        };

        // Check WebGL support
        this.webglSupported = this.checkWebGLSupport();

        if (this.webglSupported) {
            this.init();
        } else {
            console.warn('[ShaderThemes] WebGL not supported, falling back to CSS backgrounds');
        }
    }

    /**
     * Check if WebGL is supported
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }

    /**
     * Initialize the shader system
     */
    init() {
        // Create canvas
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

        // Get WebGL context
        this.gl = this.canvas.getContext('webgl', {
            alpha: true,
            antialias: false, // Disable for performance
            depth: false,
            stencil: false,
            premultipliedAlpha: true
        }) || this.canvas.getContext('experimental-webgl');

        if (!this.gl) {
            console.error('[ShaderThemes] Failed to get WebGL context');
            this.webglSupported = false;
            return;
        }

        // Setup resize handler
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        this.handleResize();

        // Setup visibility change handler to pause when hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else if (this.enabled) {
                this.resume();
            }
        });
    }

    /**
     * Handle canvas resize
     */
    handleResize() {
        if (!this.canvas || !this.gl) return;

        const dpr = this.getDevicePixelRatio();
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Get appropriate device pixel ratio based on quality settings
     */
    getDevicePixelRatio() {
        const dpr = window.devicePixelRatio || 1;

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
        if (this.shaderCache.has(filename)) {
            return this.shaderCache.get(filename);
        }

        try {
            const response = await fetch(`/js/shaders/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load shader: ${filename}`);
            }
            const source = await response.text();
            this.shaderCache.set(filename, source);
            return source;
        } catch (error) {
            console.error('[ShaderThemes] Error loading shader:', error);
            return null;
        }
    }

    /**
     * Compile a shader
     */
    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('[ShaderThemes] Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    /**
     * Create shader program
     */
    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('[ShaderThemes] Program link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    /**
     * Setup vertex buffer (full-screen quad)
     */
    setupVertexBuffer(program) {
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
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    /**
     * Load and activate a theme
     */
    async loadTheme(themeName) {
        if (!this.webglSupported) {
            console.warn('[ShaderThemes] WebGL not supported');
            return false;
        }

        const shaderFile = this.themeShaders[themeName.toLowerCase()];
        if (!shaderFile) {
            console.warn(`[ShaderThemes] No shader defined for theme: ${themeName}`);
            return false;
        }

        // Load fragment shader source
        const fragmentSource = await this.loadShaderSource(shaderFile);
        if (!fragmentSource) {
            return false;
        }

        // Simple vertex shader (full-screen quad)
        const vertexSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        // Create program
        const program = this.createProgram(vertexSource, fragmentSource);
        if (!program) {
            return false;
        }

        // Clean up old program
        if (this.program) {
            this.gl.deleteProgram(this.program);
        }

        this.program = program;
        this.currentTheme = themeName;
        this.gl.useProgram(program);

        // Setup vertex buffer
        this.setupVertexBuffer(program);

        // Get uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(program, 'u_resolution'),
            time: this.gl.getUniformLocation(program, 'u_time'),
            intensity: this.gl.getUniformLocation(program, 'u_intensity')
        };

        console.log(`[ShaderThemes] Loaded theme: ${themeName}`);
        return true;
    }

    /**
     * Activate shader background
     * @returns {Promise<boolean>} True if shader was activated successfully
     */
    async activate(themeName) {
        if (!this.webglSupported) {
            return false;
        }

        // Add canvas to DOM if not already added
        if (!this.canvas.parentElement) {
            document.body.insertBefore(this.canvas, document.body.firstChild);
        }

        // Load theme and start rendering
        const success = await this.loadTheme(themeName);
        if (success) {
            this.enabled = true;
            this.resume();

            // Add class to indicate shader is actually rendering
            document.body.classList.add('shader-rendering');
            return true;
        }

        return false;
    }

    /**
     * Deactivate shader background
     */
    deactivate() {
        this.pause();
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
        this.enabled = false;

        // Remove shader-rendering class when deactivating
        document.body.classList.remove('shader-rendering');
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
            console.log('[ShaderThemes] Low FPS detected, reducing quality');
            this.settings.quality = 'low';
            this.handleResize();
        } else if (this.fpsCounter.fps > 55 && this.settings.quality === 'low') {
            console.log('[ShaderThemes] Good FPS, increasing quality');
            this.settings.quality = 'medium';
            this.handleResize();
        }
    }

    /**
     * Pause rendering
     */
    pause() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Resume rendering
     */
    resume() {
        if (!this.animationId && this.enabled) {
            this.render();
        }
    }

    /**
     * Set intensity (0.0 to 1.0)
     */
    setIntensity(value) {
        this.intensity = Math.max(0, Math.min(1, value));
    }

    /**
     * Toggle shader on/off
     */
    toggle() {
        this.enabled = !this.enabled;
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
}
