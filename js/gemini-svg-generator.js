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
        // Try to reinitialize auth if not set
        if (!this.auth && typeof firebase !== 'undefined' && firebase.auth) {
            this.auth = firebase.auth();
        }
        return !!(this.auth && this.auth.currentUser);
    }

    /**
     * Check if configured (user is signed in)
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
     * Generate SVG from a text prompt
     * @param {string} prompt - User's description of desired SVG
     * @param {Object} options - Generation options (style, colorScheme, etc.)
     * @returns {Promise<Object>} - {success: boolean, svgCode: string, error: string}
     */
    async generateSVG(prompt, options = {}) {
        if (!this.isAuthenticated()) {
            return {
                success: false,
                error: 'Not authenticated',
                needsAuth: true,
                configInstructions: this.getConfigInstructions()
            };
        }

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
                            error: `Generated SVG was invalid: ${validation.errors.join(', ')}`
                        };
                    }
                } else {
                    // API error
                    if (attempt < this.maxRetries && result.retryable) {
                        console.warn(`Attempt ${attempt}: API error, retrying...`, result.error);
                        await this.sleep(this.retryDelay * attempt); // Exponential backoff
                        continue;
                    }
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
                    error: `Generation failed: ${error.message}`
                };
            }
        }

        return {
            success: false,
            error: 'Maximum retries exceeded'
        };
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
     * Call Gemini API using OAuth token
     */
    async callGeminiAPI(prompt) {
        try {
            // Get current user's OAuth token
            const token = await this.getCurrentUserToken();
            if (!token) {
                return {
                    success: false,
                    error: 'Failed to get authentication token. Please try signing in again.',
                    retryable: false,
                    needsAuth: true
                };
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

            // Call Gemini API with OAuth token in Authorization header
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Check for specific error types
                if (response.status === 401 || response.status === 403) {
                    // Try to refresh token and retry once
                    const refreshedToken = await this.getCurrentUserToken();
                    if (refreshedToken && refreshedToken !== token) {
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
