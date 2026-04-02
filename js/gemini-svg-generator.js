/**
 * Gemini SVG Generator
 * Uses Google Gemini API to generate mythology-themed SVG graphics
 * Eyes of Azrael Project
 */

class GeminiSVGGenerator {
    constructor() {
        this.model = 'gemini-1.5-flash'; // Cost-effective model for SVG generation
        this.apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.auth = null;

        // Rate limiting
        this.rateLimitWindow = 60000; // 1 minute
        this.maxRequestsPerWindow = 10;
        this.requestTimestamps = [];

        // SVG cache key prefix
        this.cachePrefix = 'eoa_svg_cache_';
        this.cacheMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        // System instructions for mythology-focused SVG generation
        this.systemInstructions = `You are an expert SVG artist specializing in mythology and sacred symbolism.
Generate clean, semantic SVG code with these requirements:
- ViewBox: 0 0 400 400
- Use vibrant colors: #f59e0b (orange), #8b7fff (purple), #fbbf24 (gold), #ef4444 (red), #10b981 (green)
- No external dependencies or scripts
- Inline styles only (no CSS classes or external stylesheets)
- Include aria-label for accessibility
- Mythologically accurate symbolism
- Professional illustration quality
- No text unless specifically requested
- Simple, clean geometric shapes preferred
- Use gradients for depth and visual interest
- Ensure all paths are closed and valid
- Return ONLY the SVG code, no markdown formatting or explanations`;

        // Initialize Firebase Auth reference
        this.initializeAuth();
    }

    /**
     * Initialize Firebase Auth reference
     */
    initializeAuth() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            this.auth = firebase.auth();
        }
    }

    /**
     * Get current user's OAuth access token
     * @returns {Promise<string|null>} OAuth access token or null
     */
    async getCurrentUserToken() {
        // Try to get auth from global window object if not initialized
        if (!this.auth && typeof firebase !== 'undefined' && firebase.auth) {
            this.auth = firebase.auth();
        }

        if (!this.auth) {
            console.error('Firebase Auth not initialized');
            return null;
        }

        // Wait for auth state to be ready
        await new Promise(resolve => {
            if (this.auth.currentUser) {
                resolve();
            } else {
                const unsubscribe = this.auth.onAuthStateChanged(user => {
                    unsubscribe();
                    resolve();
                });
            }
        });

        const user = this.auth.currentUser;
        if (!user) {
            console.log('No user signed in');
            return null;
        }

        try {
            // Get ID token (this is the OAuth token)
            const token = await user.getIdToken(true); // true = force refresh
            console.log('Got user token successfully');
            return token;
        } catch (error) {
            console.error('Error getting user token:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        // Direct API key takes precedence — no Firebase auth needed
        if (window.EOA_GEMINI_KEY) return true;

        // Try to reinitialize auth if not set
        if (!this.auth && typeof firebase !== 'undefined' && firebase.auth) {
            this.auth = firebase.auth();
        }
        return !!(this.auth && this.auth.currentUser);
    }

    /**
     * Check if configured (API key present or user is signed in)
     */
    isConfigured() {
        return this.isAuthenticated();
    }

    /**
     * Get configuration instructions for users
     */
    getConfigInstructions() {
        return {
            title: 'Sign In Required',
            message: 'To use AI SVG generation, you need to sign in with your Google account. Your Google account OAuth token will be used to access the Gemini API.',
            steps: [
                '1. Click the "Sign In with Google" button in the top right',
                '2. Sign in with your Google account',
                '3. Once signed in, the AI Generator will be enabled',
                '4. No API key needed - your Google OAuth token is used automatically'
            ],
            note: 'The Gemini 1.5 Flash model is free for moderate usage and very cost-effective for SVG generation.'
        };
    }

    /**
     * Check if rate limit has been exceeded
     * @returns {Object} {allowed: boolean, retryAfter: number, message: string}
     */
    checkRateLimit() {
        const now = Date.now();
        // Remove timestamps outside the window
        this.requestTimestamps = this.requestTimestamps.filter(t => now - t < this.rateLimitWindow);

        if (this.requestTimestamps.length >= this.maxRequestsPerWindow) {
            const oldestInWindow = this.requestTimestamps[0];
            const retryAfter = Math.ceil((this.rateLimitWindow - (now - oldestInWindow)) / 1000);
            return {
                allowed: false,
                retryAfter: retryAfter,
                message: `Rate limit reached. You can generate up to ${this.maxRequestsPerWindow} images per minute. Please wait ${retryAfter} seconds.`
            };
        }
        return { allowed: true, retryAfter: 0, message: '' };
    }

    /**
     * Get cached SVG from localStorage
     * @param {string} prompt - The prompt used to generate the SVG
     * @param {Object} options - Generation options
     * @returns {string|null} Cached SVG code or null
     */
    getCachedSVG(prompt, options) {
        try {
            const cacheKey = this.cachePrefix + this.hashPrompt(prompt, options);
            const cached = localStorage.getItem(cacheKey);
            if (!cached) return null;

            const parsed = JSON.parse(cached);
            // Check expiry
            if (Date.now() - parsed.timestamp > this.cacheMaxAge) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            return parsed.svgCode;
        } catch (e) {
            return null;
        }
    }

    /**
     * Cache SVG in localStorage
     * @param {string} prompt - The prompt used
     * @param {Object} options - Generation options
     * @param {string} svgCode - The generated SVG
     */
    cacheSVG(prompt, options, svgCode) {
        try {
            const cacheKey = this.cachePrefix + this.hashPrompt(prompt, options);
            localStorage.setItem(cacheKey, JSON.stringify({
                svgCode: svgCode,
                prompt: prompt,
                timestamp: Date.now()
            }));
        } catch (e) {
            // localStorage might be full; clean old entries and try again
            this.cleanSVGCache();
            try {
                const cacheKey = this.cachePrefix + this.hashPrompt(prompt, options);
                localStorage.setItem(cacheKey, JSON.stringify({
                    svgCode: svgCode,
                    prompt: prompt,
                    timestamp: Date.now()
                }));
            } catch (e2) {
                console.warn('[GeminiSVG] Could not cache SVG:', e2.message);
            }
        }
    }

    /**
     * Clean old SVG cache entries from localStorage
     */
    cleanSVGCache() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cachePrefix)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (Date.now() - data.timestamp > this.cacheMaxAge) {
                        keysToRemove.push(key);
                    }
                } catch (e) {
                    keysToRemove.push(key);
                }
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Simple hash for cache key generation
     */
    hashPrompt(prompt, options) {
        const str = prompt + JSON.stringify(options || {});
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Get HTML for auth prompt overlay
     * @returns {string} HTML string for login prompt
     */
    getAuthPromptHTML() {
        const instructions = this.getConfigInstructions();
        return `
            <div class="svg-auth-prompt" style="
                text-align: center;
                padding: 2rem;
                background: rgba(0,0,0,0.6);
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.1);
                max-width: 400px;
                margin: 2rem auto;
            ">
                <div style="font-size: 2rem; margin-bottom: 1rem;">&#128274;</div>
                <h3 style="color: var(--color-primary, #8b7fff); margin-bottom: 0.5rem;">${instructions.title}</h3>
                <p style="color: var(--color-text-secondary, #aaa); margin-bottom: 1.5rem; font-size: 0.95rem;">
                    ${instructions.message}
                </p>
                <button onclick="document.querySelector('.auth-login-btn')?.click(); document.getElementById('login-overlay')?.classList.remove('hidden');" style="
                    background: var(--color-primary, #8b7fff);
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                    font-weight: 600;
                ">Sign In with Google</button>
                <p style="color: var(--color-text-secondary, #777); font-size: 0.8rem; margin-top: 1rem;">
                    ${instructions.note}
                </p>
            </div>
        `;
    }

    /**
     * Get HTML for rate limit message
     * @param {number} retryAfter - Seconds until rate limit resets
     * @returns {string} HTML string
     */
    getRateLimitHTML(retryAfter) {
        return `
            <div class="svg-rate-limit" style="
                text-align: center;
                padding: 1.5rem;
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 12px;
                max-width: 400px;
                margin: 1rem auto;
            ">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">&#9203;</div>
                <p style="color: #f59e0b; font-weight: 600;">Rate Limit Reached</p>
                <p style="color: var(--color-text-secondary, #aaa); font-size: 0.9rem;">
                    Please wait <strong>${retryAfter}</strong> seconds before generating another image.
                    You can generate up to ${this.maxRequestsPerWindow} images per minute.
                </p>
            </div>
        `;
    }

    /**
     * Get HTML for error message
     * @param {string} error - Error message
     * @param {boolean} needsAuth - Whether the error is auth-related
     * @returns {string} HTML string
     */
    getErrorHTML(error, needsAuth) {
        if (needsAuth) return this.getAuthPromptHTML();

        return `
            <div class="svg-error" style="
                text-align: center;
                padding: 1.5rem;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 12px;
                max-width: 400px;
                margin: 1rem auto;
            ">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">&#9888;&#65039;</div>
                <p style="color: #ef4444; font-weight: 600;">Generation Failed</p>
                <p style="color: var(--color-text-secondary, #aaa); font-size: 0.9rem;">${error}</p>
            </div>
        `;
    }

    /**
     * Generate SVG from a text prompt
     * @param {string} prompt - User's description of desired SVG
     * @param {Object} options - Generation options (style, colorScheme, etc.)
     * @returns {Promise<Object>} - {success: boolean, svgCode: string, error: string}
     */
    async generateSVG(prompt, options = {}) {
        if (!this.isAuthenticated()) {
            // Try geometric fallback before returning error
            const fallback = this._tryGeometricFallback(prompt, options);
            if (fallback) return fallback;

            return {
                success: false,
                error: 'API key required. Set window.EOA_GEMINI_KEY or sign in with Google to use AI image generation.',
                needsAuth: true,
                authPromptHTML: this.getAuthPromptHTML(),
                configInstructions: this.getConfigInstructions()
            };
        }

        // Check rate limit
        const rateCheck = this.checkRateLimit();
        if (!rateCheck.allowed) {
            return {
                success: false,
                error: rateCheck.message,
                rateLimited: true,
                retryAfter: rateCheck.retryAfter,
                rateLimitHTML: this.getRateLimitHTML(rateCheck.retryAfter)
            };
        }

        // Check localStorage cache first
        const cached = this.getCachedSVG(prompt, options);
        if (cached) {
            console.log('[GeminiSVG] Returning cached SVG');
            return {
                success: true,
                svgCode: cached,
                prompt: prompt,
                options: options,
                fromCache: true
            };
        }

        // Record this request for rate limiting
        this.requestTimestamps.push(Date.now());

        // Build enhanced prompt with style preferences
        const enhancedPrompt = this.buildEnhancedPrompt(prompt, options);

        // Try generation with retries
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const result = await this.callGeminiAPI(enhancedPrompt);

                if (result.success) {
                    // Validate SVG
                    const validation = this.validateSVG(result.svgCode);
                    if (validation.valid) {
                        // Cache the successful result
                        this.cacheSVG(prompt, options, result.svgCode);

                        return {
                            success: true,
                            svgCode: result.svgCode,
                            prompt: prompt,
                            options: options
                        };
                    } else {
                        // Invalid SVG, retry
                        console.warn(`Attempt ${attempt}: Invalid SVG generated`, validation.errors);
                        if (attempt < this.maxRetries) {
                            await this.sleep(this.retryDelay);
                            continue;
                        }
                        return {
                            success: false,
                            error: `Generated SVG was invalid: ${validation.errors.join(', ')}`,
                            errorHTML: this.getErrorHTML(`The AI generated invalid SVG code. Please try again with a different prompt.`)
                        };
                    }
                } else {
                    // API error
                    if (attempt < this.maxRetries && result.retryable) {
                        console.warn(`Attempt ${attempt}: API error, retrying...`, result.error);
                        await this.sleep(this.retryDelay * attempt); // Exponential backoff
                        continue;
                    }
                    result.errorHTML = this.getErrorHTML(result.error, result.needsAuth);
                    return result;
                }
            } catch (error) {
                console.error(`Attempt ${attempt}: Exception during generation`, error);
                if (attempt < this.maxRetries) {
                    await this.sleep(this.retryDelay * attempt);
                    continue;
                }
                return {
                    success: false,
                    error: `Generation failed: ${error.message}`,
                    errorHTML: this.getErrorHTML(`An unexpected error occurred: ${error.message}`)
                };
            }
        }

        // Try geometric fallback before giving up
        const fallback = this._tryGeometricFallback(prompt, options);
        if (fallback) return fallback;

        return {
            success: false,
            error: 'Maximum retries exceeded. The AI service may be temporarily unavailable.',
            errorHTML: this.getErrorHTML('Maximum retries exceeded. The AI service may be temporarily unavailable. Please try again later.')
        };
    }

    /**
     * Try geometric fallback via IconGenerator when Gemini is unavailable
     * @param {string} prompt - Original prompt
     * @param {Object} options - Generation options
     * @returns {Object|null} Fallback result or null if unavailable
     */
    _tryGeometricFallback(prompt, options) {
        if (typeof window === 'undefined' || !window.IconGenerator) return null;

        try {
            // Extract mythology hint from prompt for better geometric output
            const mythology = options.mythology || 'greek';
            const svgCode = window.IconGenerator.generateForMythology(mythology);

            if (svgCode) {
                console.log('[GeminiSVG] Using geometric fallback via IconGenerator');
                if (typeof window.ToastNotifications !== 'undefined') {
                    window.ToastNotifications.show(
                        'AI generation unavailable — using geometric fallback',
                        'warning'
                    );
                }
                return {
                    success: true,
                    svgCode: svgCode,
                    prompt: prompt,
                    options: options,
                    isGeometricFallback: true,
                    fallbackNote: 'Geometric fallback (not AI-generated)'
                };
            }
        } catch (e) {
            console.warn('[GeminiSVG] Geometric fallback failed:', e.message);
        }

        return null;
    }

    /**
     * Build enhanced prompt with style and color preferences
     */
    buildEnhancedPrompt(basePrompt, options) {
        let prompt = basePrompt;

        // Add style guidance
        if (options.style) {
            const styleGuides = {
                'symbolic': 'Use simple, iconic symbols with clean lines and minimal detail. Focus on archetypal representation.',
                'detailed': 'Include intricate details, patterns, and textures. Make it visually rich and complex.',
                'minimalist': 'Use minimal shapes and elements. Clean, modern aesthetic with lots of negative space.',
                'geometric': 'Use geometric shapes, sacred geometry patterns, and mathematical precision. Emphasize symmetry.'
            };
            prompt += ` Style: ${styleGuides[options.style] || ''}`;
        }

        // Add color scheme guidance
        if (options.colorScheme) {
            const colorSchemes = {
                'fire': 'Use warm colors: oranges (#f59e0b, #fb923c), reds (#ef4444), and gold (#fbbf24). Fiery, energetic palette.',
                'divine': 'Use purple (#8b7fff, #a78bfa), gold (#fbbf24), and white. Divine, mystical palette.',
                'nature': 'Use greens (#10b981, #22c55e), browns (#92400e, #78350f), and earth tones. Natural, grounded palette.',
                'water': 'Use blues (#3b82f6, #0ea5e9), teals (#14b8a6), and aqua tones. Calm, flowing palette.',
                'monochrome': 'Use shades of purple (#8b7fff) with white and dark accents. Elegant, unified palette.'
            };
            prompt += ` Colors: ${colorSchemes[options.colorScheme] || ''}`;
        }

        // Remind it to return only SVG code
        prompt += '\n\nIMPORTANT: Return ONLY the complete SVG code starting with <svg and ending with </svg>. No explanations, no markdown code blocks, just the raw SVG code.';

        return prompt;
    }

    /**
     * Call Gemini API using API key or OAuth token
     */
    async callGeminiAPI(prompt) {
        try {
            let authHeader;
            let requestUrl = this.apiEndpoint;

            if (window.EOA_GEMINI_KEY) {
                // Use direct API key — append as query param (Gemini REST API style)
                requestUrl = `${this.apiEndpoint}?key=${encodeURIComponent(window.EOA_GEMINI_KEY)}`;
                authHeader = null;
            } else {
                // Fall back to Firebase OAuth token
                const token = await this.getCurrentUserToken();
                if (!token) {
                    return {
                        success: false,
                        error: 'API key required. Set window.EOA_GEMINI_KEY or sign in with Google.',
                        retryable: false,
                        needsAuth: true
                    };
                }
                authHeader = `Bearer ${token}`;
            }

            const requestBody = {
                contents: [{
                    parts: [{
                        text: `${this.systemInstructions}\n\nUser Request: ${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.9, // Higher creativity for art
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                }
            };

            // Call Gemini API — with API key in URL or OAuth token in header
            const fetchHeaders = { 'Content-Type': 'application/json' };
            if (authHeader) fetchHeaders['Authorization'] = authHeader;

            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: fetchHeaders,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Check for specific error types
                if (response.status === 401 || response.status === 403) {
                    // Try to refresh token and retry once
                    const refreshedToken = await this.getCurrentUserToken();
                    if (refreshedToken) {
                        // Token was refreshed, retry the request
                        return this.callGeminiAPI(prompt);
                    }

                    return {
                        success: false,
                        error: 'Authentication failed. Your session may have expired. Please sign in again.',
                        retryable: false,
                        needsAuth: true
                    };
                } else if (response.status === 429) {
                    return {
                        success: false,
                        error: 'Rate limit exceeded. Please wait a moment and try again.',
                        retryable: true
                    };
                } else if (response.status >= 500) {
                    return {
                        success: false,
                        error: 'Google API server error. Please try again.',
                        retryable: true
                    };
                } else if (response.status === 400) {
                    return {
                        success: false,
                        error: `API request error: ${errorData.error?.message || 'Invalid request'}`,
                        retryable: false
                    };
                }

                return {
                    success: false,
                    error: `API error: ${errorData.error?.message || response.statusText}`,
                    retryable: false
                };
            }

            const data = await response.json();

            // Extract SVG code from response
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                return {
                    success: false,
                    error: 'No content generated by API',
                    retryable: true
                };
            }

            const generatedText = data.candidates[0].content.parts[0].text;
            const svgCode = this.extractSVGFromResponse(generatedText);

            if (!svgCode) {
                return {
                    success: false,
                    error: 'Failed to extract valid SVG from API response',
                    retryable: true
                };
            }

            return {
                success: true,
                svgCode: svgCode
            };

        } catch (error) {
            return {
                success: false,
                error: `Network error: ${error.message}`,
                retryable: true
            };
        }
    }

    /**
     * Extract SVG code from API response
     * Handles markdown code blocks and other formatting
     */
    extractSVGFromResponse(text) {
        // Remove markdown code blocks if present
        let cleaned = text.replace(/```svg\n?/g, '').replace(/```\n?/g, '');

        // Find SVG tags
        const svgMatch = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
        if (svgMatch) {
            return svgMatch[0].trim();
        }

        return null;
    }

    /**
     * Validate SVG code
     */
    validateSVG(svgCode) {
        const errors = [];

        if (!svgCode) {
            errors.push('SVG code is empty');
            return { valid: false, errors };
        }

        // Check if it starts and ends with svg tags
        if (!svgCode.trim().toLowerCase().startsWith('<svg')) {
            errors.push('SVG must start with <svg tag');
        }

        if (!svgCode.trim().toLowerCase().endsWith('</svg>')) {
            errors.push('SVG must end with </svg> tag');
        }

        // Check for viewBox attribute
        if (!svgCode.includes('viewBox')) {
            errors.push('SVG should have a viewBox attribute');
        }

        // Try to parse as XML
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgCode, 'image/svg+xml');

            // Check for parse errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                errors.push('SVG contains XML parse errors');
            }
        } catch (error) {
            errors.push(`XML parsing failed: ${error.message}`);
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Sleep utility for retries
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get example prompts for UI
     */
    static getExamplePrompts() {
        return [
            {
                text: 'Zeus hurling a lightning bolt',
                style: 'detailed',
                colorScheme: 'fire'
            },
            {
                text: 'Tree of Life with 10 spheres representing the Sefirot',
                style: 'geometric',
                colorScheme: 'divine'
            },
            {
                text: 'Ouroboros serpent eating its tail in circular form',
                style: 'symbolic',
                colorScheme: 'monochrome'
            },
            {
                text: 'Phoenix rising from flames',
                style: 'detailed',
                colorScheme: 'fire'
            },
            {
                text: 'Yggdrasil world tree connecting nine realms',
                style: 'detailed',
                colorScheme: 'nature'
            },
            {
                text: 'Sacred Lotus flower with mystical light',
                style: 'minimalist',
                colorScheme: 'divine'
            },
            {
                text: 'Eye of Horus with sacred geometry',
                style: 'geometric',
                colorScheme: 'divine'
            },
            {
                text: 'Metatron\'s Cube sacred geometry pattern',
                style: 'geometric',
                colorScheme: 'divine'
            }
        ];
    }
}

// Export globally
window.GeminiSVGGenerator = GeminiSVGGenerator;
