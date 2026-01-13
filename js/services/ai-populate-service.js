/**
 * AI Populate Service
 *
 * Uses Gemini 1.5 Pro to auto-fill entity fields based on type and description.
 * Leverages Firebase OAuth for authentication (no separate API key needed).
 *
 * Features:
 * - Schema-aware prompting for each entity type
 * - Preserves user-provided fields
 * - Only fills empty/missing fields
 * - Mythologically accurate content generation
 *
 * @requires Firebase Auth (Google OAuth)
 * @version 1.0.0
 */

class AIPopulateService {
    constructor() {
        this.model = 'gemini-1.5-pro';
        this.apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
        this.auth = null;
        this.maxRetries = 2;
        this.retryDelay = 1500;

        // Schema definitions for each entity type
        this.schemaDefinitions = this.initializeSchemas();

        // Initialize Firebase Auth
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
     * Check if user is authenticated
     */
    isAuthenticated() {
        if (!this.auth && typeof firebase !== 'undefined' && firebase.auth) {
            this.auth = firebase.auth();
        }
        return !!(this.auth && this.auth.currentUser);
    }

    /**
     * Get current user's OAuth token
     */
    async getCurrentUserToken() {
        if (!this.auth && typeof firebase !== 'undefined' && firebase.auth) {
            this.auth = firebase.auth();
        }

        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }

        // Wait for auth state to be ready
        await new Promise(resolve => {
            if (this.auth.currentUser) {
                resolve();
            } else {
                const unsubscribe = this.auth.onAuthStateChanged(() => {
                    unsubscribe();
                    resolve();
                });
            }
        });

        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated. Please sign in first.');
        }

        return await user.getIdToken(true);
    }

    /**
     * Initialize schema definitions for each entity type
     */
    initializeSchemas() {
        return {
            deity: {
                fields: [
                    'domains', 'epithets', 'symbols', 'sacredAnimals', 'sacredPlants',
                    'attributes', 'aspects', 'functions', 'worship', 'festivals',
                    'temples', 'iconography', 'colors', 'numbers'
                ],
                arrayFields: [
                    'domains', 'epithets', 'symbols', 'sacredAnimals', 'sacredPlants',
                    'attributes', 'aspects', 'functions', 'festivals', 'colors', 'numbers'
                ],
                objectFields: ['worship', 'iconography'],
                description: 'Divine being or god/goddess from mythology'
            },
            creature: {
                fields: [
                    'abilities', 'weaknesses', 'habitat', 'diet', 'classification',
                    'physicalDescription', 'behavior', 'origins', 'symbolism',
                    'characteristics', 'dangerLevel'
                ],
                arrayFields: ['abilities', 'weaknesses', 'characteristics'],
                objectFields: ['classification'],
                description: 'Mythical creature or beast'
            },
            hero: {
                fields: [
                    'achievements', 'quests', 'weapons', 'companions', 'skills',
                    'titles', 'birthplace', 'fate', 'lineage', 'enemies',
                    'virtues', 'flaws'
                ],
                arrayFields: [
                    'achievements', 'quests', 'weapons', 'companions', 'skills',
                    'titles', 'enemies', 'virtues', 'flaws'
                ],
                objectFields: ['lineage'],
                description: 'Legendary hero or mortal figure'
            },
            item: {
                fields: [
                    'powers', 'materials', 'creators', 'owners', 'history',
                    'itemType', 'location', 'properties', 'significance',
                    'appearance', 'curses', 'blessings'
                ],
                arrayFields: ['powers', 'materials', 'creators', 'owners', 'properties', 'curses', 'blessings'],
                objectFields: [],
                description: 'Magical artifact or sacred item'
            },
            place: {
                fields: [
                    'features', 'inhabitants', 'events', 'significance',
                    'placeType', 'access', 'geography', 'atmosphere',
                    'dangers', 'treasures'
                ],
                arrayFields: ['features', 'inhabitants', 'events', 'dangers', 'treasures'],
                objectFields: ['geography'],
                description: 'Sacred location or mythical realm'
            },
            ritual: {
                fields: [
                    'steps', 'materials', 'timing', 'participants', 'purpose',
                    'symbolism', 'origins', 'variations', 'prohibitions',
                    'effects', 'duration'
                ],
                arrayFields: ['steps', 'materials', 'participants', 'variations', 'prohibitions', 'effects'],
                objectFields: ['timing'],
                description: 'Sacred ceremony or ritual practice'
            },
            text: {
                fields: [
                    'contents', 'themes', 'chapters', 'author', 'dateWritten',
                    'language', 'translations', 'influence', 'interpretations',
                    'keyPassages', 'structure'
                ],
                arrayFields: ['themes', 'chapters', 'translations', 'interpretations', 'keyPassages'],
                objectFields: [],
                description: 'Sacred text or mythological scripture'
            },
            symbol: {
                fields: [
                    'elements', 'colors', 'meanings', 'usage', 'variations',
                    'origins', 'associations', 'geometry', 'occurrences'
                ],
                arrayFields: ['elements', 'colors', 'meanings', 'variations', 'associations', 'occurrences'],
                objectFields: ['geometry'],
                description: 'Sacred symbol or sigil'
            },
            herb: {
                fields: [
                    'botanical', 'properties', 'uses', 'preparations', 'warnings',
                    'harvest', 'mythology', 'correspondences', 'folklore'
                ],
                arrayFields: ['properties', 'uses', 'preparations', 'warnings', 'correspondences'],
                objectFields: ['botanical', 'harvest'],
                description: 'Sacred plant or herb'
            },
            archetype: {
                fields: [
                    'characteristics', 'examples', 'shadow', 'journey',
                    'symbols', 'challenges', 'gifts', 'psychology',
                    'mythology', 'modernExamples'
                ],
                arrayFields: ['characteristics', 'examples', 'symbols', 'challenges', 'gifts', 'modernExamples'],
                objectFields: ['psychology', 'shadow'],
                description: 'Universal mythological archetype'
            },
            magic: {
                fields: [
                    'type', 'source', 'effects', 'components', 'practitioners',
                    'limitations', 'traditions', 'spells', 'symbols'
                ],
                arrayFields: ['effects', 'components', 'practitioners', 'limitations', 'traditions', 'spells'],
                objectFields: [],
                description: 'Magical system or practice'
            }
        };
    }

    /**
     * Build the prompt for AI population
     */
    buildPrompt(entityType, existingData) {
        const schema = this.schemaDefinitions[entityType] || this.schemaDefinitions.deity;

        // Find fields that need to be filled
        const fieldsToFill = schema.fields.filter(field => {
            const value = existingData[field];
            if (value === undefined || value === null || value === '') return true;
            if (Array.isArray(value) && value.length === 0) return true;
            if (typeof value === 'object' && Object.keys(value).length === 0) return true;
            return false;
        });

        if (fieldsToFill.length === 0) {
            return null; // Nothing to fill
        }

        const mythology = existingData.mythology || existingData.primaryMythology || 'world';

        const prompt = `You are an expert mythology scholar and encyclopedist. Generate accurate, scholarly mythological data for a ${entityType} (${schema.description}) from ${mythology} mythology.

ENTITY INFORMATION PROVIDED:
- Name: ${existingData.name || 'Unknown'}
- Mythology/Tradition: ${mythology}
- Type: ${entityType}
${existingData.shortDescription ? `- Brief Description: ${existingData.shortDescription}` : ''}
${existingData.description ? `- Full Description: ${existingData.description}` : ''}
${existingData.longDescription ? `- Detailed Description: ${existingData.longDescription}` : ''}
${existingData.domains?.length ? `- Known Domains: ${existingData.domains.join(', ')}` : ''}
${existingData.tags?.length ? `- Tags: ${existingData.tags.join(', ')}` : ''}
${existingData.epithets?.length ? `- Epithets: ${existingData.epithets.join(', ')}` : ''}

FIELDS TO POPULATE (generate ONLY these fields):
${fieldsToFill.map(f => `- ${f}${schema.arrayFields.includes(f) ? ' (array)' : ''}`).join('\n')}

REQUIREMENTS:
1. Return ONLY valid JSON with the requested fields
2. For array fields, provide 3-5 items unless fewer are historically accurate
3. Be mythologically accurate to the ${mythology} tradition
4. Use scholarly but accessible language
5. Do NOT include fields that weren't listed above
6. Do NOT include explanatory text - JSON only
7. Ensure all string values are properly escaped

IMPORTANT: Return ONLY the raw JSON object. No markdown code blocks, no explanations, no prefix text.

Example output format:
{"domains": ["thunder", "sky"], "symbols": ["eagle", "lightning bolt"]}`;

        return prompt;
    }

    /**
     * Populate entity fields using AI
     * @param {string} entityType - Type of entity (deity, creature, etc.)
     * @param {Object} existingData - Current form data (user's selections preserved)
     * @returns {Promise<Object>} Result with populated fields
     */
    async populateFields(entityType, existingData) {
        console.log('[AIPopulateService] Starting field population for:', entityType);

        if (!this.isAuthenticated()) {
            return {
                success: false,
                error: 'Please sign in to use AI auto-fill',
                needsAuth: true
            };
        }

        try {
            // Build prompt
            const prompt = this.buildPrompt(entityType, existingData);

            if (!prompt) {
                return {
                    success: true,
                    data: {},
                    message: 'All fields already filled - nothing to populate'
                };
            }

            console.log('[AIPopulateService] Calling Gemini API...');

            // Get token
            const token = await this.getCurrentUserToken();

            // Make API call
            const response = await this.callGeminiAPI(prompt, token);

            if (!response.success) {
                return response;
            }

            // Parse and validate response
            const populatedData = this.parseResponse(response.content, entityType);

            console.log('[AIPopulateService] Populated fields:', Object.keys(populatedData));

            return {
                success: true,
                data: populatedData,
                fieldsPopulated: Object.keys(populatedData)
            };

        } catch (error) {
            console.error('[AIPopulateService] Error:', error);
            return {
                success: false,
                error: error.message || 'Failed to populate fields'
            };
        }
    }

    /**
     * Call Gemini API with retry logic
     */
    async callGeminiAPI(prompt, token) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096
            }
        };

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`[AIPopulateService] API attempt ${attempt}/${this.maxRetries}`);

                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[AIPopulateService] API error:', response.status, errorText);

                    if (response.status === 429) {
                        // Rate limited - wait and retry
                        await this.sleep(this.retryDelay * attempt * 2);
                        continue;
                    }

                    if (response.status === 401 || response.status === 403) {
                        return {
                            success: false,
                            error: 'Authentication failed. Please sign out and sign in again.',
                            needsAuth: true
                        };
                    }

                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!content) {
                    throw new Error('No content in API response');
                }

                return { success: true, content };

            } catch (error) {
                console.error(`[AIPopulateService] Attempt ${attempt} failed:`, error.message);

                if (attempt === this.maxRetries) {
                    return { success: false, error: error.message };
                }

                await this.sleep(this.retryDelay * attempt);
            }
        }

        return { success: false, error: 'Max retries exceeded' };
    }

    /**
     * Parse AI response to extract JSON
     */
    parseResponse(content, entityType) {
        // Clean up the response
        let jsonStr = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^\s*\n/gm, '')
            .trim();

        // Try to find JSON object
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        try {
            const data = JSON.parse(jsonStr);
            const schema = this.schemaDefinitions[entityType] || this.schemaDefinitions.deity;
            const validatedData = {};

            for (const [key, value] of Object.entries(data)) {
                // Only include known fields
                if (schema.fields.includes(key)) {
                    // Ensure arrays are arrays
                    if (schema.arrayFields.includes(key)) {
                        if (!Array.isArray(value)) {
                            validatedData[key] = value ? [value] : [];
                        } else {
                            validatedData[key] = value;
                        }
                    } else {
                        validatedData[key] = value;
                    }
                }
            }

            return validatedData;

        } catch (error) {
            console.error('[AIPopulateService] JSON parse error:', error);
            console.error('[AIPopulateService] Raw content:', content.substring(0, 500));
            return {};
        }
    }

    /**
     * Generate keyMyths for an entity
     */
    async generateKeyMyths(entityType, existingData, count = 3) {
        console.log('[AIPopulateService] Generating keyMyths for:', existingData.name);

        if (!this.isAuthenticated()) {
            return { success: false, error: 'Please sign in to use AI', needsAuth: true };
        }

        const mythology = existingData.mythology || existingData.primaryMythology || 'world';

        const prompt = `You are a mythology expert. Generate ${count} key myths/stories about "${existingData.name}" from ${mythology} mythology.

CONTEXT:
- Name: ${existingData.name}
- Type: ${entityType}
- Mythology: ${mythology}
${existingData.description ? `- Description: ${existingData.description}` : ''}
${existingData.domains?.length ? `- Domains: ${existingData.domains.join(', ')}` : ''}

Generate ${count} important myths as a JSON array with this structure:
[
  {
    "title": "Myth title",
    "description": "2-3 sentence summary of the myth",
    "source": "Primary source text or tradition"
  }
]

Return ONLY the JSON array, no markdown or explanations.`;

        try {
            const token = await this.getCurrentUserToken();
            const response = await this.callGeminiAPI(prompt, token);

            if (!response.success) {
                return response;
            }

            // Parse array response
            let jsonStr = response.content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                const myths = JSON.parse(arrayMatch[0]);
                return { success: true, data: myths };
            }

            return { success: false, error: 'Could not parse myths response' };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export globally
if (typeof window !== 'undefined') {
    window.AIPopulateService = AIPopulateService;
    window.aiPopulateService = new AIPopulateService();
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIPopulateService;
}
