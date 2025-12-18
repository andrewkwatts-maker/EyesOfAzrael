#!/usr/bin/env node

/**
 * CSS Modernization Script
 *
 * Converts old mythology-specific inline CSS to modern data-attribute system.
 *
 * Old pattern:
 *   <style>:root { --mythos-primary: #color; }</style>
 *   <div class="deity-header">
 *
 * New pattern:
 *   <section data-mythology="greek">
 *   <div class="hero-section">
 */

const fs = require('fs');
const path = require('path');

// Mythology color mappings (must match themes/mythology-colors.css)
const MYTHOLOGY_MAPPINGS = {
    'greek': { primary: '#DAA520', secondary: '#FFD700' },
    'norse': { primary: '#4682B4', secondary: '#87CEEB' },
    'egyptian': { primary: '#D4AF37', secondary: '#CD853F' },
    'roman': { primary: '#8B0000', secondary: '#DC143C' },
    'hindu': { primary: '#FF6347', secondary: '#FFA500' },
    'buddhist': { primary: '#FFD700', secondary: '#FFA500' },
    'chinese': { primary: '#DC143C', secondary: '#FFD700' },
    'japanese': { primary: '#C41E3A', secondary: '#FFD700' },
    'celtic': { primary: '#228B22', secondary: '#32CD32' },
    'aztec': { primary: '#8B4513', secondary: '#DAA520' },
    'mayan': { primary: '#2E8B57', secondary: '#90EE90' },
    'sumerian': { primary: '#4682B4', secondary: '#87CEEB' },
    'babylonian': { primary: '#191970', secondary: '#4169E1' },
    'persian': { primary: '#800080', secondary: '#9370DB' },
    'slavic': { primary: '#708090', secondary: '#B0C4DE' },
    'african': { primary: '#CD853F', secondary: '#F4A460' },
    'christian': { primary: '#8B4513', secondary: '#DAA520' },
    'zoroastrian': { primary: '#FF4500', secondary: '#FFA500' },
    'yoruba': { primary: '#228B22', secondary: '#FFD700' },
    'vodou': { primary: '#8B0000', secondary: '#FFD700' },
    'polynesian': { primary: '#4682B4', secondary: '#87CEEB' },
    'aboriginal': { primary: '#CD853F', secondary: '#F4A460' }
};

class CSSModernizer {
    constructor(options = {}) {
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
        this.stats = {
            processed: 0,
            modified: 0,
            errors: 0,
            skipped: 0
        };
    }

    /**
     * Detect mythology from file path
     */
    detectMythology(filePath) {
        // Normalize path separators for cross-platform compatibility
        const normalizedPath = filePath.replace(/\\/g, '/');

        for (const mythology of Object.keys(MYTHOLOGY_MAPPINGS)) {
            if (normalizedPath.includes(`mythos/${mythology}/`)) {
                return mythology;
            }
        }
        return null;
    }

    /**
     * Check if file needs modernization
     */
    needsModernization(content) {
        // Check for old patterns
        const hasOldRoot = /:root\s*\{/.test(content);
        const hasOldDeityHeader = /class="deity-header"/.test(content);
        const hasOldAttributeCard = /class="attribute-card"/.test(content);

        // Check if already modernized
        const hasDataMythology = /data-mythology="/.test(content);
        const hasHeroSection = /class="hero-section"/.test(content);

        return (hasOldRoot || hasOldDeityHeader || hasOldAttributeCard) && !hasDataMythology;
    }

    /**
     * Remove old inline <style> block
     */
    removeOldStyleBlock(content) {
        // Remove entire <style> block with :root variables
        return content.replace(
            /<style>[\s\S]*?:root\s*\{[\s\S]*?\}[\s\S]*?<\/style>/g,
            ''
        );
    }

    /**
     * Replace old class names with new ones
     */
    replaceClassNames(content) {
        let modified = content;

        // deity-header → hero-section
        modified = modified.replace(
            /class="deity-header"/g,
            'class="hero-section"'
        );

        // Add hero-icon-display to deity icons
        modified = modified.replace(
            /<div class="deity-icon">/g,
            '<div class="hero-icon-display">'
        );

        // attribute-card → subsection-card or glass-card
        modified = modified.replace(
            /class="attribute-card"/g,
            'class="subsection-card"'
        );

        return modified;
    }

    /**
     * Replace old CSS variable references
     */
    replaceOldVariables(content) {
        let modified = content;

        // Replace var(--mythos-primary) with var(--color-primary)
        modified = modified.replace(
            /var\(--mythos-primary\)/g,
            'var(--color-primary)'
        );

        modified = modified.replace(
            /var\(--mythos-secondary\)/g,
            'var(--color-secondary)'
        );

        modified = modified.replace(
            /var\(--mythos-accent\)/g,
            'var(--color-accent)'
        );

        return modified;
    }

    /**
     * Add data-mythology attribute to main section
     */
    addDataMythologyAttribute(content, mythology) {
        // Find <main> tag and add data-mythology
        const mainRegex = /<main([^>]*)>/;

        if (mainRegex.test(content)) {
            return content.replace(
                mainRegex,
                `<main$1 data-mythology="${mythology}">`
            );
        }

        // If no <main>, add to <body>
        const bodyRegex = /<body([^>]*)>/;
        if (bodyRegex.test(content)) {
            return content.replace(
                bodyRegex,
                `<body$1 data-mythology="${mythology}">`
            );
        }

        return content;
    }

    /**
     * Add mythology-colors.css link if missing
     */
    addMythologyColorsCSS(content) {
        // Check if already included
        if (content.includes('mythology-colors.css')) {
            return content;
        }

        // Find theme-base.css and add after it
        const themBaseRegex = /(<link[^>]*href="[^"]*theme-base\.css"[^>]*>)/;

        if (themBaseRegex.test(content)) {
            return content.replace(
                themBaseRegex,
                '$1\n    <link rel="stylesheet" href="../../../themes/mythology-colors.css">'
            );
        }

        // Otherwise add in <head>
        return content.replace(
            '</head>',
            '    <link rel="stylesheet" href="../../../themes/mythology-colors.css">\n</head>'
        );
    }

    /**
     * Modernize a single file
     */
    modernizeFile(filePath) {
        try {
            const originalContent = fs.readFileSync(filePath, 'utf8');

            // Check if needs modernization
            if (!this.needsModernization(originalContent)) {
                if (this.verbose) {
                    console.log(`⏭️  Skipped (already modern): ${path.relative(process.cwd(), filePath)}`);
                }
                this.stats.skipped++;
                return;
            }

            // Detect mythology
            const mythology = this.detectMythology(filePath);
            if (!mythology) {
                console.log(`⚠️  Cannot detect mythology: ${filePath}`);
                this.stats.skipped++;
                return;
            }

            // Apply transformations
            let content = originalContent;
            content = this.removeOldStyleBlock(content);
            content = this.replaceClassNames(content);
            content = this.replaceOldVariables(content);
            content = this.addDataMythologyAttribute(content, mythology);
            content = this.addMythologyColorsCSS(content);

            // Write file
            if (!this.dryRun) {
                fs.writeFileSync(filePath, content, 'utf8');
            }

            const relativePath = path.relative(process.cwd(), filePath);
            console.log(`✅ Modernized: ${relativePath} (${mythology})`);
            this.stats.modified++;

        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
            this.stats.errors++;
        } finally {
            this.stats.processed++;
        }
    }

    /**
     * Process directory recursively
     */
    processDirectory(dirPath) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                this.processDirectory(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                this.modernizeFile(fullPath);
            }
        }
    }

    /**
     * Print statistics
     */
    printStats() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 CSS Modernization Statistics');
        console.log('='.repeat(60));
        console.log(`Total Processed:  ${this.stats.processed}`);
        console.log(`Modified:         ${this.stats.modified}`);
        console.log(`Skipped:          ${this.stats.skipped}`);
        console.log(`Errors:           ${this.stats.errors}`);
        console.log('='.repeat(60));

        if (this.dryRun) {
            console.log('\n⚠️  DRY RUN MODE - No files were actually modified');
        }
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        dryRun: false,
        verbose: false,
        mythology: null,
        path: null
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--mythology':
            case '-m':
                options.mythology = args[++i];
                break;
            case '--path':
            case '-p':
                options.path = args[++i];
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
        }
    }

    return options;
}

function printHelp() {
    console.log(`
CSS Modernization Script

Usage: node modernize-css.js [options]

Options:
  --dry-run           Preview changes without modifying files
  --verbose, -v       Show detailed output
  --mythology, -m     Process specific mythology only
  --path, -p          Process specific directory
  --help, -h          Show this help message

Examples:
  node modernize-css.js --dry-run
  node modernize-css.js --mythology aztec
  node modernize-css.js --path mythos/babylonian --verbose
`);
}

// Main execution
function main() {
    const options = parseArgs();
    const modernizer = new CSSModernizer(options);

    console.log('🚀 CSS Modernization Script\n');

    if (options.dryRun) {
        console.log('⚠️  DRY RUN MODE - No files will be modified\n');
    }

    // Determine path to process
    let targetPath;
    if (options.path) {
        targetPath = path.resolve(options.path);
    } else if (options.mythology) {
        targetPath = path.resolve('mythos', options.mythology);
    } else {
        targetPath = path.resolve('mythos');
    }

    if (!fs.existsSync(targetPath)) {
        console.error(`❌ Path not found: ${targetPath}`);
        process.exit(1);
    }

    console.log(`📂 Processing: ${targetPath}\n`);

    // Process files
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
        modernizer.processDirectory(targetPath);
    } else {
        modernizer.modernizeFile(targetPath);
    }

    // Print results
    modernizer.printStats();

    // Exit code
    process.exit(modernizer.stats.errors > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = CSSModernizer;
