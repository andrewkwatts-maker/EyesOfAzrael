#!/usr/bin/env node
/**
 * Check for Missing Script Dependencies
 *
 * Scans JS files for class instantiations (new ClassName)
 * and checks if those classes are defined in scripts loaded by index.html.
 *
 * Usage: node scripts/check-missing-scripts.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');

// Classes that are external (Firebase, etc.) - skip these
const EXTERNAL_CLASSES = [
    'Promise', 'Map', 'Set', 'Array', 'Object', 'Date', 'Error',
    'RegExp', 'Function', 'Boolean', 'Number', 'String', 'Symbol',
    'WeakMap', 'WeakSet', 'Proxy', 'Reflect', 'ArrayBuffer',
    'DataView', 'Int8Array', 'Uint8Array', 'Float32Array', 'Float64Array',
    'URL', 'URLSearchParams', 'Headers', 'Request', 'Response',
    'FormData', 'Blob', 'File', 'FileReader', 'Worker',
    'XMLHttpRequest', 'WebSocket', 'EventSource',
    'MutationObserver', 'IntersectionObserver', 'ResizeObserver',
    'CustomEvent', 'Event', 'MouseEvent', 'KeyboardEvent',
    'Image', 'Audio', 'Video', 'Canvas',
    // Firebase
    'firebase',
    // Third-party
    'THREE', 'PIXI', 'gsap'
];

/**
 * Extract script paths from index.html
 */
function getLoadedScripts() {
    const content = fs.readFileSync(INDEX_HTML, 'utf8');
    const scriptRegex = /<script[^>]+src="([^"]+)"[^>]*>/g;
    const scripts = [];
    let match;

    while ((match = scriptRegex.exec(content)) !== null) {
        const src = match[1];
        // Skip external scripts
        if (!src.startsWith('http') && !src.startsWith('//')) {
            scripts.push(src);
        }
    }

    return scripts;
}

/**
 * Extract class definitions from a file
 */
function getClassDefinitions(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const classRegex = /class\s+([A-Z][a-zA-Z0-9_]*)/g;
    const classes = [];
    let match;

    while ((match = classRegex.exec(content)) !== null) {
        classes.push(match[1]);
    }

    // Also check for window.ClassName = assignments
    const windowRegex = /window\.([A-Z][a-zA-Z0-9_]*)\s*=/g;
    while ((match = windowRegex.exec(content)) !== null) {
        if (!classes.includes(match[1])) {
            classes.push(match[1]);
        }
    }

    return classes;
}

/**
 * Extract class usages from a file
 */
function getClassUsages(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const usageRegex = /new\s+([A-Z][a-zA-Z0-9_]*)\s*\(/g;
    const usages = [];
    let match;

    while ((match = usageRegex.exec(content)) !== null) {
        const className = match[1];
        if (!EXTERNAL_CLASSES.includes(className)) {
            usages.push(className);
        }
    }

    // Also check for typeof ClassName !== 'undefined'
    const typeofRegex = /typeof\s+([A-Z][a-zA-Z0-9_]*)\s*[!=]==\s*['"]undefined['"]/g;
    while ((match = typeofRegex.exec(content)) !== null) {
        const className = match[1];
        if (!EXTERNAL_CLASSES.includes(className) && !usages.includes(className)) {
            usages.push(className);
        }
    }

    return [...new Set(usages)];
}

/**
 * Recursively get all JS files in a directory
 */
function getAllJsFiles(dir) {
    const files = [];

    if (!fs.existsSync(dir)) {
        return files;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Skip node_modules, backups, reports, etc.
            if (!['node_modules', 'backups', 'reports', '_archive', 'firebase-assets-downloaded'].includes(item)) {
                files.push(...getAllJsFiles(fullPath));
            }
        } else if (item.endsWith('.js') && !item.endsWith('.min.js')) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Main
 */
function main() {
    console.log('Checking for Missing Script Dependencies');
    console.log('=========================================\n');

    // Get scripts loaded in index.html
    const loadedScripts = getLoadedScripts();
    console.log(`Found ${loadedScripts.length} scripts in index.html\n`);

    // Build set of defined classes from loaded scripts
    const definedClasses = new Set();

    for (const script of loadedScripts) {
        const scriptPath = path.join(ROOT_DIR, script);
        const classes = getClassDefinitions(scriptPath);

        for (const cls of classes) {
            definedClasses.add(cls);
        }
    }

    console.log(`Found ${definedClasses.size} class definitions in loaded scripts\n`);

    // Scan all JS files for class usages
    const jsDir = path.join(ROOT_DIR, 'js');
    const allJsFiles = getAllJsFiles(jsDir);

    console.log(`Scanning ${allJsFiles.length} JS files for class usages...\n`);

    const missingDeps = new Map(); // className -> [files that use it]

    for (const file of allJsFiles) {
        const usages = getClassUsages(file);
        const relativePath = path.relative(ROOT_DIR, file);

        for (const className of usages) {
            if (!definedClasses.has(className)) {
                if (!missingDeps.has(className)) {
                    missingDeps.set(className, []);
                }
                missingDeps.get(className).push(relativePath);
            }
        }
    }

    // Report findings
    if (missingDeps.size === 0) {
        console.log('✅ No missing dependencies found!\n');
    } else {
        console.log(`⚠️  Found ${missingDeps.size} potentially missing classes:\n`);

        for (const [className, files] of [...missingDeps.entries()].sort()) {
            console.log(`  ❌ ${className}`);
            for (const file of files.slice(0, 3)) {
                console.log(`     - Used in: ${file}`);
            }
            if (files.length > 3) {
                console.log(`     ... and ${files.length - 3} more files`);
            }
            console.log('');
        }

        console.log('\nTo fix:');
        console.log('1. Add missing script to index.html');
        console.log('2. Ensure the script defines the class and exports to window');
        console.log('3. Check script load order (dependencies must load first)');
    }

    // Also check for scripts in js/services not loaded
    console.log('\n--- Services Check ---\n');
    const servicesDir = path.join(ROOT_DIR, 'js', 'services');
    if (fs.existsSync(servicesDir)) {
        const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
        const loadedServices = loadedScripts.filter(s => s.includes('js/services/'));

        for (const serviceFile of serviceFiles) {
            const servicePath = `js/services/${serviceFile}`;
            const isLoaded = loadedServices.some(s => s.includes(serviceFile));

            if (isLoaded) {
                console.log(`  ✅ ${serviceFile}`);
            } else {
                console.log(`  ❌ ${serviceFile} - NOT LOADED in index.html`);
            }
        }
    }

    console.log('\n=========================================');
    console.log('Check complete.\n');
}

main();
