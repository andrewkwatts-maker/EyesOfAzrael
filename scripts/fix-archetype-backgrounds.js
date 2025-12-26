/**
 * Fix Archetype Page Backgrounds
 * Removes white backgrounds and ensures glass-morphism
 */

const fs = require('fs');
const path = require('path');

function getAllHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getAllHtmlFiles(filePath, fileList);
        } else if (file === 'index.html') {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function getDepthFromArchetypes(filePath) {
    const parts = filePath.split(path.sep);
    const idx = parts.indexOf('archetypes');
    return parts.length - idx - 2; // -2 for archetypes folder and index.html
}

function getSpinnerPath(depth) {
    if (depth === 0) return '../css/spinner.css';
    return '../'.repeat(depth + 1) + 'css/spinner.css';
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    let changes = [];

    // 1. Fix white rgba backgrounds
    const whiteRgbaRegex = /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([\d.]+)\s*\)/gi;
    if (content.match(whiteRgbaRegex)) {
        content = content.replace(whiteRgbaRegex, (match, opacity) => {
            return `rgba(var(--color-surface-rgb), ${opacity})`;
        });
        changes.push('Fixed white rgba backgrounds');
    }

    // 2. Add spinner.css if missing
    if (!content.includes('spinner.css')) {
        const depth = getDepthFromArchetypes(filePath);
        const spinnerPath = getSpinnerPath(depth);

        // Add after theme-base.css
        if (content.includes('theme-base.css')) {
            content = content.replace(
                /(<link\s+rel="stylesheet"\s+href="[^"]*theme-base\.css">)/,
                `$1\n    <link rel="stylesheet" href="${spinnerPath}">`
            );
            changes.push(`Added spinner.css (${spinnerPath})`);
        }
    }

    // 3. Fix codex-search-content backgrounds
    if (content.includes('.codex-search-content')) {
        const oldCodexBg = /\.codex-search-content\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*[\d.]+\)[^}]*}/gi;
        if (content.match(oldCodexBg)) {
            content = content.replace(
                /(\.codex-search-content\s*{[^}]*)background:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)([^}]*})/gi,
                (match, before, opacity, after) => {
                    return `${before}background: rgba(var(--color-surface-rgb), ${opacity})${after}`;
                }
            );
            changes.push('Fixed codex-search-content background');
        }
    }

    // 4. Fix breadcrumb backgrounds
    const breadcrumbBgRegex = /(\.breadcrumb\s*{[^}]*)background:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)([^}]*})/gi;
    if (content.match(breadcrumbBgRegex)) {
        content = content.replace(
            breadcrumbBgRegex,
            (match, before, opacity, after) => {
                return `${before}background: rgba(var(--color-surface-rgb), ${opacity})${after}`;
            }
        );
        changes.push('Fixed breadcrumb background');
    }

    // 5. Fix content-box backgrounds
    const contentBoxBgRegex = /(\.content-box\s*{[^}]*)background:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)([^}]*})/gi;
    if (content.match(contentBoxBgRegex)) {
        content = content.replace(
            contentBoxBgRegex,
            (match, before, opacity, after) => {
                return `${before}background: rgba(var(--color-surface-rgb), ${opacity})${after}`;
            }
        );
        changes.push('Fixed content-box background');
    }

    // 6. Fix inline style white backgrounds
    const inlineWhiteBg = /style="[^"]*background:\s*rgba\(255,\s*255,\s*255,\s*[\d.]+\)[^"]*"/gi;
    if (content.match(inlineWhiteBg)) {
        content = content.replace(
            /background:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/gi,
            (match, opacity) => {
                return `background: rgba(var(--color-surface-rgb), ${opacity})`;
            }
        );
        changes.push('Fixed inline style white backgrounds');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        return { changed: true, changes, file: filePath };
    }

    return { changed: false, file: filePath };
}

function main() {
    const archetypesDir = path.join(__dirname, '..', 'archetypes');

    console.log('='.repeat(70));
    console.log('Fixing Archetype Page Backgrounds - Glass-morphism Update');
    console.log('='.repeat(70));
    console.log('');
    console.log(`Scanning: ${archetypesDir}`);
    console.log('');

    const files = getAllHtmlFiles(archetypesDir);
    console.log(`Found ${files.length} index.html files`);
    console.log('');

    const results = {
        changed: [],
        unchanged: []
    };

    files.forEach(file => {
        const relativePath = path.relative(archetypesDir, file);
        const result = fixFile(file);

        if (result.changed) {
            console.log(`✓ ${relativePath}`);
            result.changes.forEach(c => console.log(`  - ${c}`));
            results.changed.push(result);
        } else {
            console.log(`- ${relativePath} (no changes)`);
            results.unchanged.push(result);
        }
    });

    console.log('');
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total files: ${files.length}`);
    console.log(`Changed: ${results.changed.length}`);
    console.log(`Unchanged: ${results.unchanged.length}`);
    console.log('');

    if (results.changed.length > 0) {
        console.log('Updated files:');
        results.changed.forEach(r => {
            const rel = path.relative(archetypesDir, r.file);
            console.log(`  ✓ ${rel}`);
        });
    }

    console.log('');
    console.log('Done!');
}

main();
