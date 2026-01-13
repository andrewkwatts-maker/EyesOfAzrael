/**
 * Fix HTML Entities in Asset Data
 *
 * Converts HTML entities back to their actual characters:
 * - &amp; → &
 * - &lt; → <
 * - &gt; → >
 * - &quot; → "
 * - &#39; → '
 * - &nbsp; → (space)
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// HTML entity replacements
const HTML_ENTITIES = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#160;': ' '
};

// Create regex pattern for all entities
const ENTITY_PATTERN = new RegExp(Object.keys(HTML_ENTITIES).join('|'), 'gi');

let totalFixed = 0;
let filesFixed = 0;

function decodeHtmlEntities(str) {
    if (typeof str !== 'string') return str;
    return str.replace(ENTITY_PATTERN, match => HTML_ENTITIES[match.toLowerCase()] || match);
}

function processValue(value) {
    if (typeof value === 'string') {
        return decodeHtmlEntities(value);
    } else if (Array.isArray(value)) {
        return value.map(processValue);
    } else if (value && typeof value === 'object') {
        return processObject(value);
    }
    return value;
}

function processObject(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = processValue(value);
    }
    return result;
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check if file contains any HTML entities
        if (!ENTITY_PATTERN.test(content)) {
            return false;
        }

        const data = JSON.parse(content);
        const fixed = processValue(data);
        const fixedContent = JSON.stringify(fixed, null, 2);

        // Only write if content changed
        if (content !== fixedContent) {
            fs.writeFileSync(filePath, fixedContent);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

function walkDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            walkDirectory(fullPath);
        } else if (entry.name.endsWith('.json')) {
            if (processFile(fullPath)) {
                filesFixed++;
                console.log(`✓ Fixed: ${path.relative(ASSETS_DIR, fullPath)}`);
            }
        }
    }
}

console.log('='.repeat(60));
console.log('HTML Entity Fixer');
console.log('='.repeat(60));
console.log(`\nScanning: ${ASSETS_DIR}\n`);

walkDirectory(ASSETS_DIR);

console.log('\n' + '='.repeat(60));
console.log(`COMPLETE: Fixed ${filesFixed} files`);
console.log('='.repeat(60));
