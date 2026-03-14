/**
 * Admin Gemini Content Populate Button
 *
 * Shows a "Populate with AI" button on sparse entity pages for admin users.
 * Uses Google Gemini to generate rich content (extendedContent, keyMyths,
 * associations, cultural, cross_cultural_parallels) and saves to Firebase.
 */

class AdminPopulateButton {
    constructor(container, entity) {
        this.container = container;
        this.entity = entity;
        this.model = 'gemini-2.0-flash';
        this.apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
        this.isGenerating = false;
    }

    /**
     * Initialize - only render if admin and entity is sparse
     */
    init() {
        if (!this._isAdmin()) return;

        const missing = this._getMissingFields();
        if (missing.length < 2) return; // Entity has enough content

        this._render(missing);
    }

    _isAdmin() {
        const user = firebase.auth?.()?.currentUser;
        return user?.email === 'andrewkwatts@gmail.com';
    }

    _getMissingFields() {
        const e = this.entity;
        const missing = [];
        if (!e.extendedContent?.length) missing.push('extendedContent');
        if (!e.keyMyths?.length) missing.push('keyMyths');
        if (!e.associations?.length) missing.push('associations');
        if (!e.cultural) missing.push('cultural');
        if (!e.cross_cultural_parallels?.length) missing.push('cross_cultural_parallels');
        if (!e.symbolism) missing.push('symbolism');
        if (!e.companions?.length) missing.push('companions');
        return missing;
    }

    _render(missing) {
        const btn = document.createElement('div');
        btn.className = 'admin-populate-wrapper';
        btn.innerHTML = `
            <button class="admin-populate-btn" id="adminPopulateBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>
                Populate with AI
                <span class="populate-badge">${missing.length} fields</span>
            </button>
            <div class="admin-populate-status" id="adminPopulateStatus" style="display:none;"></div>
        `;

        // Insert after hero section
        const hero = this.container.querySelector('.hero-section');
        if (hero) {
            hero.insertAdjacentElement('afterend', btn);
        } else {
            this.container.prepend(btn);
        }

        document.getElementById('adminPopulateBtn').addEventListener('click', () => this._onPopulate(missing));
    }

    async _onPopulate(missing) {
        if (this.isGenerating) return;
        this.isGenerating = true;

        const btn = document.getElementById('adminPopulateBtn');
        const status = document.getElementById('adminPopulateStatus');
        btn.disabled = true;
        btn.textContent = 'Generating...';
        status.style.display = 'block';

        try {
            const generated = {};
            const total = missing.length;

            for (let i = 0; i < missing.length; i++) {
                const field = missing[i];
                status.innerHTML = `<span class="populate-progress">Generating ${field} (${i + 1}/${total})...</span>`;

                const result = await this._generateField(field);
                if (result) {
                    generated[field] = result;
                }

                // Rate limit
                if (i < missing.length - 1) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            if (Object.keys(generated).length === 0) {
                status.innerHTML = '<span class="populate-error">No content generated. Check console for errors.</span>';
                return;
            }

            // Show preview
            status.innerHTML = this._renderPreview(generated);

            // Bind confirm/cancel
            document.getElementById('populateConfirm')?.addEventListener('click', () => this._saveToFirebase(generated));
            document.getElementById('populateCancel')?.addEventListener('click', () => {
                status.style.display = 'none';
                btn.disabled = false;
                btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Populate with AI`;
                this.isGenerating = false;
            });

        } catch (err) {
            console.error('[AdminPopulate] Error:', err);
            status.innerHTML = `<span class="populate-error">Error: ${err.message}</span>`;
        }
    }

    async _generateField(field) {
        const e = this.entity;
        const context = `Entity: ${e.name || e.title}\nType: ${e.type}\nMythology: ${e.mythology || 'Unknown'}\nDescription: ${e.description || ''}\n`;

        const prompts = {
            extendedContent: `${context}\nGenerate 3-4 detailed content sections about this ${e.type} from ${e.mythology || 'world'} mythology. Each section should have 2-4 paragraphs of well-researched, encyclopedic content.\n\nReturn JSON array: [{"title": "Section Title", "content": "Detailed multi-paragraph content..."}]`,

            keyMyths: `${context}\nGenerate 3-5 key myths and legends involving this ${e.type}. Include the myth title, a 2-3 sentence description, and the primary source text.\n\nReturn JSON array: [{"title": "Myth Title", "description": "Description...", "source": "Primary Source"}]`,

            associations: `${context}\nGenerate 4-6 symbolic associations for this ${e.type}. Include the category (element, animal, plant, color, number, celestial body, etc.), the specific item, and a brief explanation.\n\nReturn JSON array: [{"category": "Category", "item": "Item", "description": "Explanation..."}]`,

            cultural: `${context}\nGenerate a cultural impact section covering: worship practices (if deity/hero), modern references, artistic depictions, and legacy in popular culture.\n\nReturn JSON object: {"worshipPractices": "...", "modernReferences": "...", "artisticDepictions": "...", "legacy": "..."}`,

            cross_cultural_parallels: `${context}\nGenerate 3-4 cross-cultural parallels - similar figures, themes, or roles in OTHER mythological traditions. Include the tradition name, the parallel figure, and explanation of the connection.\n\nReturn JSON array: [{"tradition": "Mythology Name", "figure": "Parallel Figure", "connection": "Explanation of parallel..."}]`,

            symbolism: `${context}\nGenerate a rich symbolism analysis covering what this ${e.type} represents symbolically, psychologically (Jungian archetype if applicable), and in comparative mythology.\n\nReturn JSON object: {"overview": "...", "primarySymbols": ["..."], "psychologicalMeaning": "...", "archetypeRole": "..."}`,

            companions: `${context}\nGenerate 3-5 companions, allies, or closely associated figures for this ${e.type}. Include their name, relationship type, and a brief description.\n\nReturn JSON array: [{"name": "Name", "relationship": "ally/companion/servant/mount", "description": "Brief description..."}]`
        };

        const prompt = prompts[field];
        if (!prompt) return null;

        try {
            const token = await firebase.auth().currentUser.getIdToken(true);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt + '\n\nIMPORTANT: Return ONLY valid JSON, no markdown formatting.' }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048
                    }
                })
            });

            if (!response.ok) {
                console.error(`[AdminPopulate] API error for ${field}:`, response.status);
                return null;
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Extract JSON from response
            return this._parseJsonResponse(text);
        } catch (err) {
            console.error(`[AdminPopulate] Error generating ${field}:`, err);
            return null;
        }
    }

    _parseJsonResponse(text) {
        // Try direct parse
        try {
            return JSON.parse(text.trim());
        } catch (e) {
            // Try extracting from markdown code block
            const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match) {
                try {
                    return JSON.parse(match[1].trim());
                } catch (e2) { /* fall through */ }
            }
            // Try finding first [ or {
            const start = text.indexOf('[') !== -1 ? text.indexOf('[') : text.indexOf('{');
            const end = text.lastIndexOf(']') !== -1 ? text.lastIndexOf(']') + 1 : text.lastIndexOf('}') + 1;
            if (start >= 0 && end > start) {
                try {
                    return JSON.parse(text.substring(start, end));
                } catch (e3) { /* fall through */ }
            }
        }
        return null;
    }

    _renderPreview(generated) {
        const fieldNames = {
            extendedContent: 'Extended Content',
            keyMyths: 'Key Myths',
            associations: 'Associations',
            cultural: 'Cultural Impact',
            cross_cultural_parallels: 'Cross-Cultural Parallels',
            symbolism: 'Symbolism',
            companions: 'Companions'
        };

        const sections = Object.entries(generated).map(([field, data]) => {
            const name = fieldNames[field] || field;
            const preview = Array.isArray(data)
                ? `${data.length} items generated`
                : typeof data === 'object'
                    ? `${Object.keys(data).length} sections generated`
                    : 'Content generated';

            return `<div class="populate-preview-item"><strong>${name}:</strong> ${preview}</div>`;
        }).join('');

        return `
            <div class="populate-preview">
                <h3>Generated Content Preview</h3>
                ${sections}
                <div class="populate-actions">
                    <button class="populate-confirm-btn" id="populateConfirm">Save to Firebase</button>
                    <button class="populate-cancel-btn" id="populateCancel">Cancel</button>
                </div>
            </div>
        `;
    }

    async _saveToFirebase(generated) {
        const status = document.getElementById('adminPopulateStatus');
        status.innerHTML = '<span class="populate-progress">Saving to Firebase...</span>';

        try {
            const db = firebase.firestore();
            const collection = this.entity.type + 's'; // deities, creatures, etc.
            const docId = this.entity.id;

            // Merge generated fields
            const updateData = {
                ...generated,
                enrichedAt: new Date().toISOString(),
                enrichedBy: 'admin-gemini-populate'
            };

            await db.collection(collection).doc(docId).update(updateData);

            status.innerHTML = '<span class="populate-success">Content saved! Refreshing page...</span>';

            // Reload after a moment
            setTimeout(() => window.location.reload(), 1500);

        } catch (err) {
            console.error('[AdminPopulate] Save error:', err);
            status.innerHTML = `<span class="populate-error">Save failed: ${err.message}</span>`;
        }
    }
}

window.AdminPopulateButton = AdminPopulateButton;
