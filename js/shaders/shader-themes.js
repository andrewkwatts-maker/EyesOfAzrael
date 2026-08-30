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

        // Per-shader resolution scale (multiplied against effective DPR)
        this._shaderResolutionScale = {
            'chaos': 0.6,
            'earth': 0.75,
            'dark':  0.8,
        };

        // Performance settings
        this.settings = {
            targetFPS: 60,
            quality: options.quality || 'high', // 'low', 'medium', 'high'
            adaptiveQuality: options.adaptiveQuality !== false
        };

        this.fpsCounter = {
            frames: 0,
            lastTime: performance.now(),
            fps: 60
        };

        // ── Continuous self-monitoring governor ─────────────────────────────
        // Beyond the low/medium/high tiers, a dynamic resolution scale
        // (0.35–1.0) and a ray-march step budget (u_steps) let the same
        // shader degrade smoothly on weak GPUs and recover when there is
        // headroom. If even the floor can't hold a usable frame rate, the
        // shader deactivates for the session and the CSS background stands.
        this._dynScale = 1.0;        // multiplies the quality-tier DPR
        this._dynScaleMin = 0.35;
        this._headroomSeconds = 0;   // consecutive seconds above recover threshold
        this._starvedSeconds = 0;    // consecutive seconds below give-up threshold
        this._stepBudgetFactor = 1.0; // fraction of the shader's STEPS ceiling

        // prefers-reduced-motion: render a single static frame, no animation.
        this._reducedMotion = false;
        if (window.matchMedia) {
            const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
            this._reducedMotion = mq.matches;
            const onChange = (e) => {
                this._reducedMotion = e.matches;
                if (this.enabled) {
                    if (e.matches) { this.renderOnce(); }
                    else { this.resume(); }
                }
            };
            if (mq.addEventListener) mq.addEventListener('change', onChange);
            else if (mq.addListener) mq.addListener(onChange);
        }

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
            z-index: 0;
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
     * Get appropriate device pixel ratio based on quality settings,
     * further scaled by per-shader resolution scale.
     */
    getDevicePixelRatio() {
        const dpr = window.devicePixelRatio || 1;

        let effectiveDpr;
        switch (this.settings.quality) {
            case 'low':
                effectiveDpr = Math.min(dpr, 1);
                break;
            case 'medium':
                effectiveDpr = Math.min(dpr, 1.5);
                break;
            case 'high':
            default:
                effectiveDpr = Math.min(dpr, 2);
        }

        // Apply per-shader resolution scale, then the dynamic governor scale
        const shaderScale = this._shaderResolutionScale[this.currentTheme] ?? 1.0;
        return Math.max(0.1, effectiveDpr * shaderScale * this._dynScale);
    }

    /**
     * Load a shader from file
     */
    isLowPowerDevice() {
        // Low-power detection: small viewport OR coarse pointer (touch) OR mobile UA OR <=4 hw threads
        const ua = navigator.userAgent || '';
        if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return true;
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
        if (window.innerWidth < 768) return true;
        if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) return true;
        return false;
    }

    async loadShaderSource(filename) {
        // Substitute mobile variants for heavy shaders on low-power devices
        if (filename === 'chaos-shader.glsl' && this.isLowPowerDevice()
            && window.SHADER_SOURCES && window.SHADER_SOURCES['chaos-mobile-shader.glsl']) {
            filename = 'chaos-mobile-shader.glsl';
            console.log('[ShaderThemes] Low-power device: using chaos-mobile-shader.glsl');
        }
        if (this.shaderCache.has(filename)) {
            return this.shaderCache.get(filename);
        }

        // Check inline sources first (avoids Firebase Hosting rewrite issue)
        if (window.SHADER_SOURCES && window.SHADER_SOURCES[filename]) {
            const source = window.SHADER_SOURCES[filename];
            this.shaderCache.set(filename, source);
            console.log(`[ShaderThemes] Loaded inline shader: ${filename} (${source.length} chars)`);
            return source;
        }

        try {
            const response = await fetch(`/js/shaders/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load shader: ${filename} (HTTP ${response.status})`);
            }
            const source = await response.text();
            if (!source || source.trim().length === 0) {
                throw new Error(`Shader file is empty: ${filename}`);
            }
            // Detect if Firebase Hosting returned HTML instead of GLSL
            if (source.trim().startsWith('<!') || source.trim().startsWith('<html')) {
                throw new Error(`Got HTML instead of GLSL for ${filename} (Firebase rewrite)`);
            }
            this.shaderCache.set(filename, source);
            console.log(`[ShaderThemes] Loaded shader source: ${filename} (${source.length} chars)`);
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

        // Get uniform locations (u_steps is null for shaders without a march
        // loop — uniform1f on a null location is a silent no-op, by spec)
        this.uniforms = {
            resolution: this.gl.getUniformLocation(program, 'u_resolution'),
            time: this.gl.getUniformLocation(program, 'u_time'),
            intensity: this.gl.getUniformLocation(program, 'u_intensity'),
            steps: this.gl.getUniformLocation(program, 'u_steps')
        };

        // Fresh theme: reset the governor so a heavy previous theme doesn't
        // penalize a light successor.
        this._dynScale = 1.0;
        this._stepBudgetFactor = this._initialStepFactor();
        this._headroomSeconds = 0;
        this._starvedSeconds = 0;

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

        // The governor gave up on this theme earlier in the session — the GPU
        // could not hold a usable frame rate even at minimum quality.
        try {
            if (sessionStorage.getItem(`eoa-shader-disabled-${themeName}`)) {
                console.log(`[ShaderThemes] ${themeName} disabled this session (GPU starved)`);
                return false;
            }
        } catch (e) { /* private mode */ }

        // Guard against duplicate canvas elements
        if (!this.canvas.parentElement) {
            const existing = document.getElementById('shader-background');
            if (existing && existing !== this.canvas) {
                existing.remove();
            }
            document.body.insertBefore(this.canvas, document.body.firstChild);
        }

        // Load theme and start rendering
        const success = await this.loadTheme(themeName);
        if (success) {
            this.enabled = true;
            if (this._reducedMotion) {
                // Respect prefers-reduced-motion: one static frame, no loop.
                this.renderOnce();
            } else {
                this.resume();
            }
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

        // Calculate time — performance.now() gives sub-ms precision and isn't
        // throttled by background-tab Date.now() coalescing, so animations stay smooth.
        const currentTime = performance.now();
        if (this._perfStart === undefined) { this._perfStart = currentTime; }
        const elapsedTime = (currentTime - this._perfStart) / 1000.0;

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
        if (this.uniforms.steps) {
            this.gl.uniform1f(this.uniforms.steps, this._currentStepBudget());
        }

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        // Reduced motion: one static frame is enough.
        if (this._reducedMotion) {
            this.animationId = null;
            return;
        }

        // Continue animation
        this.animationId = requestAnimationFrame(() => this.render());
    }

    /**
     * Render a single frame without scheduling animation (reduced motion).
     */
    renderOnce() {
        this.pause();
        const wasReduced = this._reducedMotion;
        this._reducedMotion = true;
        this.render();
        this._reducedMotion = wasReduced;
    }

    /**
     * Initial step-budget fraction from the quality tier.
     */
    _initialStepFactor() {
        switch (this.settings.quality) {
            case 'low': return 0.5;
            case 'medium': return 0.75;
            default: return 1.0;
        }
    }

    /**
     * Current ray-march step budget (shader clamps to its own STEPS ceiling:
     * 75 desktop chaos, 60 mobile). high tier ≈ uncapped, medium ≈ −10%,
     * low ≈ −40%, sliding further as the resolution scale drops.
     */
    _currentStepBudget() {
        const base = 90 * this._stepBudgetFactor * (0.5 + 0.5 * this._dynScale);
        return Math.max(16, Math.round(base));
    }

    /**
     * Continuous self-monitoring governor. Runs once per second from render().
     *
     * Escalation ladder when starved:   quality tier ▸ dynamic resolution
     * scale (to 0.35×) ▸ step budget rides the same scale ▸ after 6 s below
     * 24 fps at the floor, deactivate for the session (CSS background stands).
     * Recovery ladder mirrors it upward after 3 s of headroom.
     */
    adjustQuality() {
        const fps = this.fpsCounter.fps;

        if (fps < 40) {
            this._headroomSeconds = 0;

            if (this.settings.quality !== 'low') {
                console.log(`[ShaderThemes] ${fps}fps — dropping quality tier`);
                this.settings.quality = this.settings.quality === 'high' ? 'medium' : 'low';
                this._stepBudgetFactor = this._initialStepFactor();
                this.handleResize();
            } else if (this._dynScale > this._dynScaleMin) {
                this._dynScale = Math.max(this._dynScaleMin,
                    this._dynScale * (fps < 28 ? 0.75 : 0.88));
                console.log(`[ShaderThemes] ${fps}fps — resolution scale → ${this._dynScale.toFixed(2)}`);
                this.handleResize();
            } else if (fps < 24) {
                // At the floor and still starved — count down to giving up.
                this._starvedSeconds++;
                if (this._starvedSeconds >= 6) {
                    console.warn('[ShaderThemes] GPU cannot sustain the shader at minimum '
                        + 'quality — deactivating for this session (CSS background remains).');
                    try {
                        sessionStorage.setItem(`eoa-shader-disabled-${this.currentTheme}`, '1');
                    } catch (e) { /* private mode */ }
                    this.deactivate();
                }
            }
            return;
        }

        this._starvedSeconds = 0;

        if (fps > 55) {
            this._headroomSeconds++;
            if (this._headroomSeconds >= 3) {
                this._headroomSeconds = 0;
                if (this._dynScale < 1.0) {
                    this._dynScale = Math.min(1.0, this._dynScale * 1.15);
                    console.log(`[ShaderThemes] headroom — resolution scale → ${this._dynScale.toFixed(2)}`);
                    this.handleResize();
                } else if (this.settings.quality === 'low') {
                    console.log('[ShaderThemes] headroom — quality → medium');
                    this.settings.quality = 'medium';
                    this._stepBudgetFactor = this._initialStepFactor();
                    this.handleResize();
                }
                // Deliberately never climbs back to 'high' on its own: the
                // medium tier is visually close, and re-probing high risks
                // a visible stutter loop on borderline hardware.
            }
        } else {
            this._headroomSeconds = 0;
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
            intensity: this.intensity,
            resolutionScale: this._dynScale,
            stepBudget: this._currentStepBudget(),
            reducedMotion: this._reducedMotion
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ShaderThemeManager = ShaderThemeManager;
}
