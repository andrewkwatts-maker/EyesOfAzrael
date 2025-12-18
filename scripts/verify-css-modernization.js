#!/usr/bin/env node

/**
 * CSS Modernization Verification Script
 *
 * Verifies that all entity pages have been properly modernized.
 * Distinguishes between:
 * - Entity pages (deities, heroes, myths) - Should be fully modernized
 * - Index/List pages - May have custom styling systems
 */

const fs = require('fs');
const path = require('path');

const ENTITY_TYPES = ['deities', 'heroes', 'myths', 'creatures', 'figures'];
const MYTHOLOGY_MAPPINGS = {
    'greek': true,
    'norse': true,
    'egyptian': true,
    'roman': true,
    'hindu': true,
    'buddhist': true,
    'chinese': true,
    'japanese': true,
    'celtic': true,
    'aztec': true,
    'mayan': true,
    'sumerian': true,
    'babylonian': true,
    'persian': true,
    'slavic': true,
    'african': true
};

class CSSVerifier {
    constructor() {
        this.stats = {
            totalFiles: 0,
            entityPages: 0,
            indexPages: 0,
            modernized: 0,
            needsWork: 0,
            byMythology: {}
        };
        this.issues = [];
    }

    isEntityPage(filePath) {
        const basename = path.basename(filePath);

        // Index pages are not entity pages
        if (basename === 'index.html') {
            return false;
        }

        // Check if in entity directory
        const dirname = path.basename(path.dirname(filePath));
        return ENTITY_TYPES.includes(dirname);
    }

    checkFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const isEntity = this.isEntityPage(filePath);

            this.stats.totalFiles++;
            if (isEntity) {
                this.stats.entityPages++;
            } else if (path.basename(filePath) === 'index.html') {
                this.stats.indexPages++;
            }

            // Detect mythology
            const normalizedPath = filePath.replace(/\\/g, '/');
            let mythology = null;
            for (const myth of Object.keys(MYTHOLOGY_MAPPINGS)) {
                if (normalizedPath.includes(`mythos/${myth}/`)) {
                    mythology = myth;
                    break;
                }
            }

            if (mythology) {
                if (!this.stats.byMythology[mythology]) {
                    this.stats.byMythology[mythology] = {
                        total: 0,
                        modernized: 0,
                        needsWork: 0
                    };
                }
                this.stats.byMythology[mythology].total++;
            }

            // Check modernization status
            const hasDataMythology = /data-mythology="/.test(content);
            const hasMythologyColors = /mythology-colors\.css/.test(content);
            const hasOldRoot = /:root\s*\{[\s\S]*?--mythos-primary/.test(content);
            const hasOldClasses = /class="deity-header"|class="attribute-card"/.test(content);

            const isModernized = (hasDataMythology || hasMythologyColors) && !hasOldRoot && !hasOldClasses;

            if (isEntity && !isModernized) {
                this.issues.push({
                    file: path.relative(process.cwd(), filePath),
                    mythology,
                    hasDataMythology,
                    hasMythologyColors,
                    hasOldRoot,
                    hasOldClasses
                });

                this.stats.needsWork++;
                if (mythology) {
                    this.stats.byMythology[mythology].needsWork++;
                }
            } else if (isModernized) {
                this.stats.modernized++;
                if (mythology) {
                    this.stats.byMythology[mythology].modernized++;
                }
            }

        } catch (error) {
            console.error(`Error processing ${filePath}:`, error.message);
        }
    }

    processDirectory(dirPath) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                this.processDirectory(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                this.checkFile(fullPath);
            }
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('CSS MODERNIZATION VERIFICATION REPORT');
        console.log('='.repeat(80));

        console.log('\n📊 OVERALL STATISTICS');
        console.log('-'.repeat(80));
        console.log(`Total HTML Files:        ${this.stats.totalFiles}`);
        console.log(`Entity Pages:            ${this.stats.entityPages}`);
        console.log(`Index Pages:             ${this.stats.indexPages}`);
        console.log(`Modernized:              ${this.stats.modernized}`);
        console.log(`Needs Work:              ${this.stats.needsWork}`);

        const completionRate = this.stats.entityPages > 0
            ? ((this.stats.modernized / this.stats.entityPages) * 100).toFixed(1)
            : 0;
        console.log(`Completion Rate:         ${completionRate}%`);

        console.log('\n📚 BY MYTHOLOGY');
        console.log('-'.repeat(80));
        console.log('Mythology'.padEnd(20) + 'Total'.padEnd(10) + 'Modern'.padEnd(10) + 'Needs Work'.padEnd(15) + 'Progress');
        console.log('-'.repeat(80));

        Object.keys(this.stats.byMythology).sort().forEach(mythology => {
            const stats = this.stats.byMythology[mythology];
            const progress = stats.total > 0
                ? ((stats.modernized / stats.total) * 100).toFixed(0)
                : 0;
            const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));

            console.log(
                mythology.padEnd(20) +
                stats.total.toString().padEnd(10) +
                stats.modernized.toString().padEnd(10) +
                stats.needsWork.toString().padEnd(15) +
                `${bar} ${progress}%`
            );
        });

        if (this.issues.length > 0) {
            console.log('\n⚠️  FILES NEEDING ATTENTION');
            console.log('-'.repeat(80));
            console.log(`Found ${this.issues.length} entity pages that need modernization:\n`);

            this.issues.slice(0, 20).forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.file}`);
                console.log(`   Mythology: ${issue.mythology || 'unknown'}`);
                if (!issue.hasDataMythology && !issue.hasMythologyColors) {
                    console.log(`   ❌ Missing data-mythology and mythology-colors.css`);
                }
                if (issue.hasOldRoot) {
                    console.log(`   ❌ Has old :root { --mythos-primary } styling`);
                }
                if (issue.hasOldClasses) {
                    console.log(`   ❌ Has old class names (deity-header, attribute-card)`);
                }
                console.log('');
            });

            if (this.issues.length > 20) {
                console.log(`... and ${this.issues.length - 20} more files`);
            }
        }

        console.log('\n' + '='.repeat(80));

        if (this.stats.needsWork === 0) {
            console.log('✅ ALL ENTITY PAGES SUCCESSFULLY MODERNIZED!');
        } else {
            console.log(`⚠️  ${this.stats.needsWork} entity pages still need modernization`);
        }

        console.log('='.repeat(80) + '\n');
    }
}

// Main execution
function main() {
    const verifier = new CSSVerifier();

    console.log('🔍 Verifying CSS modernization...\n');

    const mythosPath = path.resolve('mythos');
    verifier.processDirectory(mythosPath);
    verifier.generateReport();

    // Exit with error code if there are issues
    process.exit(verifier.stats.needsWork > 0 ? 1 : 0);
}

if (require.main === module) {
    main();
}

module.exports = CSSVerifier;
