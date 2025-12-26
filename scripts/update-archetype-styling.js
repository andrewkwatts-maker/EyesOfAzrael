/**
 * Update Archetype Pages - Modern Styling System
 *
 * This script updates all archetype pages to ensure:
 * 1. Glass-morphism backgrounds (no white backgrounds)
 * 2. Spinner.css is included
 * 3. Consistent hero sections with proper theming
 * 4. Proper CSS variable usage
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color schemes for different archetype categories
const ARCHETYPE_COLORS = {
    // Elemental
    'water': { primary: '#3b82f6', light: '#60a5fa', dark: '#2563eb', darker: '#1e40af' },
    'fire': { primary: '#ef4444', light: '#f87171', dark: '#dc2626', darker: '#b91c1c' },
    'earth': { primary: '#22c55e', light: '#4ade80', dark: '#16a34a', darker: '#15803d' },
    'air': { primary: '#06b6d4', light: '#22d3ee', dark: '#0891b2', darker: '#0e7490' },
    'divine-light': { primary: '#fbbf24', light: '#fcd34d', dark: '#f59e0b', darker: '#d97706' },
    'chaos-void': { primary: '#7c3aed', light: '#a78bfa', dark: '#6d28d9', darker: '#5b21b6' },

    // Deity
    'war': { primary: '#dc143c', light: '#ff6b6b', dark: '#8b0000', darker: '#3a0000' },
    'primordial': { primary: '#7c3aed', light: '#a78bfa', dark: '#6d28d9', darker: '#4c1d95' },
    'cosmic-creator': { primary: '#a855f7', light: '#c084fc', dark: '#9333ea', darker: '#7e22ce' },

    // Story (hero journey theme - warm gradient)
    'story': { primary: '#c0392b', light: '#e74c3c', dark: '#a93226', darker: '#7b241c' },

    // Journey (adventure theme)
    'journey': { primary: '#2563eb', light: '#3b82f6', dark: '#1d4ed8', darker: '#1e40af' },

    // Prophecy (mystical theme)
    'prophecy': { primary: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed', darker: '#6d28d9' },

    // Place (earthy theme)
    'place': { primary: '#059669', light: '#10b981', dark: '#047857', darker: '#065f46' },

    // Default
    'default': { primary: '#9370DB', light: '#B19CD9', dark: '#7B68EE', darker: '#483D8B' }
};

function getArchetypeCategory(filePath) {
    if (filePath.includes('elemental-archetypes/water')) return 'water';
    if (filePath.includes('elemental-archetypes/fire')) return 'fire';
    if (filePath.includes('elemental-archetypes/earth')) return 'earth';
    if (filePath.includes('elemental-archetypes/air')) return 'air';
    if (filePath.includes('elemental-archetypes/divine-light')) return 'divine-light';
    if (filePath.includes('elemental-archetypes/chaos-void')) return 'chaos-void';
    if (filePath.includes('war')) return 'war';
    if (filePath.includes('primordial')) return 'primordial';
    if (filePath.includes('cosmic-creator')) return 'cosmic-creator';
    if (filePath.includes('story-archetypes')) return 'story';
    if (filePath.includes('journey-archetypes')) return 'journey';
    if (filePath.includes('prophecy-archetypes')) return 'prophecy';
    if (filePath.includes('place-archetypes')) return 'place';
    return 'default';
}

function getDepthLevel(filePath) {
    const parts = filePath.split(path.sep);
    const archetypesIndex = parts.indexOf('archetypes');
    if (archetypesIndex === -1) return 2;
    return parts.length - archetypesIndex - 1;
}

function getSpinnerCssPath(filePath) {
    const depth = getDepthLevel(filePath);
    return '../'.repeat(depth) + 'css/spinner.css';
}

function fixWhiteBackgrounds(content) {
    // Replace white rgba backgrounds with proper glass-morphism
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.\d+\)/gi, (match) => {
        const opacity = match.match(/0\.\d+/)[0];
        return `rgba(var(--color-surface-rgb), ${opacity})`;
    });

    // Fix inline white backgrounds
    content = content.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*[\d.]+\)/gi, (match) => {
        const opacity = match.match(/[\d.]+(?=\))/)[0];
        return `background: rgba(var(--color-surface-rgb), ${opacity})`;
    });

    // Fix gradient backgrounds that include white
    content = content.replace(/linear-gradient\([^)]*\)/gi, (match) => {
        // Don't change archetype-primary gradients
        if (match.includes('--archetype-primary')) return match;

        // Fix body background gradients in story archetypes
        if (match.includes('#c0392b') || match.includes('#e74c3c')) {
            return match; // Keep story archetype gradients
        }

        return match;
    });

    return content;
}

function ensureSpinnerCss(content, filePath) {
    const spinnerPath = getSpinnerCssPath(filePath);

    // Check if spinner.css is already included
    if (content.includes('spinner.css')) {
        return content;
    }

    // Add spinner.css after theme-base.css
    content = content.replace(
        /(<link\s+rel="stylesheet"\s+href="[^"]*themes\/theme-base\.css">)/,
        `$1\n    <link rel="stylesheet" href="${spinnerPath}">`
    );

    return content;
}

function fixHeroSection(content, category) {
    // If using old-style gradient body background (story archetypes), keep it
    if (content.includes('body {') && content.includes('background: linear-gradient')) {
        return content;
    }

    // Ensure header has glass-morphism
    if (content.includes('header {')) {
        content = content.replace(
            /header\s*\{[^}]*\}/s,
            (match) => {
                if (!match.includes('backdrop-filter')) {
                    match = match.replace('}', '    backdrop-filter: blur(10px);\n}');
                }
                if (!match.includes('--archetype-surface') && !match.includes('archetype-surface')) {
                    match = match.replace(/background:[^;]+;/, 'background: var(--archetype-surface);');
                }
                return match;
            }
        );
    }

    return content;
}

function fixSectionBackgrounds(content) {
    // Ensure sections use var(--color-surface) not white
    content = content.replace(
        /section\s*\{[^}]*background:[^;]*;/g,
        (match) => {
            if (match.includes('var(--color-surface)')) return match;
            return match.replace(/background:[^;]*;/, 'background: var(--color-surface);');
        }
    );

    return content;
}

function fixCodexSearchSections(content) {
    // Fix expandable codex search sections to use proper theming
    if (content.includes('.codex-search-content')) {
        content = content.replace(
            /\.codex-search-content\s*\{[^}]*background:[^;]*;/,
            (match) => {
                if (match.includes('rgba(255, 255, 255')) {
                    return match.replace(/background:[^;]*;/, 'background: rgba(var(--color-surface-rgb), 0.03);');
                }
                return match;
            }
        );
    }

    return content;
}

function processFile(filePath) {
    console.log(`Processing: ${filePath}`);

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        const category = getArchetypeCategory(filePath);

        // Apply fixes
        content = fixWhiteBackgrounds(content);
        content = ensureSpinnerCss(content, filePath);
        content = fixHeroSection(content, category);
        content = fixSectionBackgrounds(content);
        content = fixCodexSearchSections(content);

        // Only write if changed
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Updated: ${filePath}`);
            return { updated: true, file: filePath };
        } else {
            console.log(`- No changes needed: ${filePath}`);
            return { updated: false, file: filePath };
        }
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        return { updated: false, file: filePath, error: error.message };
    }
}

function main() {
    console.log('='.repeat(60));
    console.log('Updating Archetype Pages - Modern Styling System');
    console.log('='.repeat(60));
    console.log('');

    const rootDir = path.resolve(__dirname, '..');
    const archetypesPattern = path.join(rootDir, 'archetypes', '**', 'index.html');

    console.log(`Searching for archetype files in: ${archetypesPattern}`);
    console.log('');

    const files = glob.sync(archetypesPattern);
    console.log(`Found ${files.length} archetype pages`);
    console.log('');

    const results = {
        updated: [],
        unchanged: [],
        errors: []
    };

    files.forEach(file => {
        const result = processFile(file);
        if (result.error) {
            results.errors.push(result);
        } else if (result.updated) {
            results.updated.push(result.file);
        } else {
            results.unchanged.push(result.file);
        }
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total files processed: ${files.length}`);
    console.log(`Updated: ${results.updated.length}`);
    console.log(`Unchanged: ${results.unchanged.length}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log('');

    if (results.updated.length > 0) {
        console.log('Updated files:');
        results.updated.forEach(f => console.log(`  ✓ ${path.relative(rootDir, f)}`));
        console.log('');
    }

    if (results.errors.length > 0) {
        console.log('Errors:');
        results.errors.forEach(r => console.log(`  ✗ ${path.relative(rootDir, r.file)}: ${r.error}`));
        console.log('');
    }

    console.log('Done!');
}

main();
