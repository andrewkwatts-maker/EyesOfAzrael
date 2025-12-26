/**
 * Add Submission Cards to Entity Grids
 * Automated script to integrate "+ Add Entity" cards to all mythology entity grids
 *
 * Usage:
 *   node scripts/add-submission-cards-to-grids.js [--dry-run] [--mythology=greek]
 *
 * Options:
 *   --dry-run: Preview changes without modifying files
 *   --mythology=NAME: Only process specific mythology
 *   --entity-type=TYPE: Only process specific entity type (deities, heroes, etc.)
 *   --verbose: Show detailed processing information
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class GridSubmissionIntegrator {
    constructor(options = {}) {
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
        this.filterMythology = options.mythology || null;
        this.filterEntityType = options.entityType || null;

        this.mythosDir = path.join(__dirname, '..', 'mythos');
        this.stats = {
            processed: 0,
            modified: 0,
            skipped: 0,
            errors: 0
        };

        // Entity types to process
        this.entityTypes = [
            'deities',
            'heroes',
            'creatures',
            'herbs',
            'rituals',
            'texts',
            'symbols',
            'figures',
            'beings',
            'items',
            'places'
        ];

        // Mythologies to process
        this.mythologies = [
            'greek', 'norse', 'egyptian', 'roman', 'celtic',
            'hindu', 'buddhist', 'chinese', 'japanese',
            'aztec', 'mayan', 'sumerian', 'babylonian',
            'persian', 'christian', 'jewish', 'islamic',
            'yoruba', 'tarot', 'apocryphal'
        ];
    }

    /**
     * Main execution method
     */
    async run() {
        console.log('\n🎯 Grid Submission Integration Script');
        console.log('=====================================\n');

        if (this.dryRun) {
            console.log('⚠️  DRY RUN MODE - No files will be modified\n');
        }

        const mythologiesToProcess = this.filterMythology
            ? [this.filterMythology]
            : this.mythologies;

        const entityTypesToProcess = this.filterEntityType
            ? [this.filterEntityType]
            : this.entityTypes;

        for (const mythology of mythologiesToProcess) {
            const mythologyPath = path.join(this.mythosDir, mythology);

            if (!fs.existsSync(mythologyPath)) {
                if (this.verbose) {
                    console.log(`⏭️  Skipping ${mythology} (directory not found)`);
                }
                continue;
            }

            console.log(`\n📚 Processing ${mythology.toUpperCase()} mythology...`);

            for (const entityType of entityTypesToProcess) {
                await this.processEntityIndex(mythology, entityType);
            }
        }

        this.printSummary();
    }

    /**
     * Process a single entity index page
     */
    async processEntityIndex(mythology, entityType) {
        const indexPath = path.join(this.mythosDir, mythology, entityType, 'index.html');

        if (!fs.existsSync(indexPath)) {
            if (this.verbose) {
                console.log(`  ⏭️  ${entityType}/index.html not found`);
            }
            return;
        }

        this.stats.processed++;

        try {
            const html = fs.readFileSync(indexPath, 'utf8');

            // Check if submission card already exists
            if (this.hasSubmissionCard(html)) {
                if (this.verbose) {
                    console.log(`  ✓ ${entityType}/index.html already has submission card`);
                }
                this.stats.skipped++;
                return;
            }

            // Add submission card
            const modifiedHtml = this.addSubmissionCard(html, mythology, entityType);

            if (!this.dryRun) {
                fs.writeFileSync(indexPath, modifiedHtml, 'utf8');
            }

            console.log(`  ✅ Added submission card to ${entityType}/index.html`);
            this.stats.modified++;

        } catch (error) {
            console.error(`  ❌ Error processing ${entityType}/index.html:`, error.message);
            this.stats.errors++;
        }
    }

    /**
     * Check if HTML already has submission card
     */
    hasSubmissionCard(html) {
        return html.includes('add-entity-card.js') ||
               html.includes('data-add-entity-auto') ||
               html.includes('renderAddEntityCard');
    }

    /**
     * Add submission card to HTML
     */
    addSubmissionCard(html, mythology, entityType) {
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Find the entity grid
        const gridSelectors = [
            '.pantheon-grid',
            '.deities-grid',
            '.heroes-grid',
            '.creatures-grid',
            `.${entityType}-grid`,
            '.entity-grid',
            '[class*="-grid"]'
        ];

        let grid = null;
        for (const selector of gridSelectors) {
            grid = document.querySelector(selector);
            if (grid) break;
        }

        if (!grid) {
            console.warn(`    ⚠️  Could not find entity grid in ${entityType}/index.html`);
            return html;
        }

        // Add ID to grid if it doesn't have one
        if (!grid.id) {
            grid.id = `${entityType}-grid`;
        }

        // Check if scripts are already included
        const hasCardScript = document.querySelector('script[src*="add-entity-card.js"]');
        const hasCardCSS = document.querySelector('link[href*="add-entity-card.css"]');

        // Add CSS if not present
        if (!hasCardCSS) {
            const head = document.querySelector('head');
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = '../../../css/add-entity-card.css';
            head.appendChild(cssLink);
            head.appendChild(document.createTextNode('\n'));
        }

        // Add script if not present
        if (!hasCardScript) {
            const body = document.querySelector('body');
            const script = document.createElement('script');
            script.defer = true;
            script.src = '../../../js/components/add-entity-card.js';

            // Insert before closing body tag
            const lastScript = Array.from(body.querySelectorAll('script')).pop();
            if (lastScript) {
                lastScript.parentNode.insertBefore(script, lastScript.nextSibling);
                lastScript.parentNode.insertBefore(document.createTextNode('\n'), lastScript.nextSibling);
            } else {
                body.appendChild(document.createTextNode('\n'));
                body.appendChild(script);
                body.appendChild(document.createTextNode('\n'));
            }
        }

        // Add initialization script
        const initScript = this.generateInitScript(grid.id, mythology, entityType);
        const scriptElement = document.createElement('script');
        scriptElement.textContent = initScript;

        const body = document.querySelector('body');
        body.appendChild(document.createTextNode('\n'));
        body.appendChild(scriptElement);
        body.appendChild(document.createTextNode('\n'));

        return dom.serialize();
    }

    /**
     * Generate initialization script for the card
     */
    generateInitScript(gridId, mythology, entityType) {
        const singularType = this.getSingularEntityType(entityType);

        return `
// Initialize Add Entity Card
document.addEventListener('DOMContentLoaded', () => {
    if (window.renderAddEntityCard) {
        window.renderAddEntityCard({
            containerId: '${gridId}',
            entityType: '${singularType}',
            mythology: '${mythology}',
            position: 'end',
            showForGuests: true,
            redirectUrl: '/theories/user-submissions/edit.html'
        });
    }
});
`.trim();
    }

    /**
     * Convert plural entity type to singular
     */
    getSingularEntityType(entityType) {
        if (entityType.endsWith('ies')) {
            return entityType.slice(0, -3) + 'y';
        }
        if (entityType.endsWith('s')) {
            return entityType.slice(0, -1);
        }
        return entityType;
    }

    /**
     * Print summary statistics
     */
    printSummary() {
        console.log('\n\n📊 Summary');
        console.log('=====================================');
        console.log(`Total pages processed: ${this.stats.processed}`);
        console.log(`Pages modified: ${this.stats.modified}`);
        console.log(`Pages skipped (already have cards): ${this.stats.skipped}`);
        console.log(`Errors: ${this.stats.errors}`);
        console.log('=====================================\n');

        if (this.dryRun) {
            console.log('⚠️  This was a DRY RUN - no files were actually modified');
            console.log('Run without --dry-run to apply changes\n');
        } else if (this.stats.modified > 0) {
            console.log('✅ Integration complete! Submission cards added successfully.\n');
        }
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        dryRun: args.includes('--dry-run'),
        verbose: args.includes('--verbose'),
        mythology: null,
        entityType: null
    };

    // Parse mythology filter
    const mythologyArg = args.find(arg => arg.startsWith('--mythology='));
    if (mythologyArg) {
        options.mythology = mythologyArg.split('=')[1];
    }

    // Parse entity type filter
    const entityTypeArg = args.find(arg => arg.startsWith('--entity-type='));
    if (entityTypeArg) {
        options.entityType = entityTypeArg.split('=')[1];
    }

    const integrator = new GridSubmissionIntegrator(options);
    integrator.run().catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = GridSubmissionIntegrator;
