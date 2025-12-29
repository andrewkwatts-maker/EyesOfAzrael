#!/usr/bin/env node

/**
 * Verify Topic Panels System
 * Checks that all entities can generate topic panel content
 * Eyes of Azrael - Mythology Knowledge Base
 */

const fs = require('fs');
const path = require('path');

// Import TopicPanels class (simulated for Node.js)
class TopicPanelsVerifier {
    constructor() {
        this.stats = {
            total: 0,
            withBackground: 0,
            withSignificance: 0,
            withRelated: 0,
            withDidYouKnow: 0,
            withSources: 0,
            byType: {}
        };
    }

    /**
     * Verify all entity files
     */
    verifyAllEntities(dataDir) {
        const entities = this.loadAllEntities(dataDir);

        console.log(`\n📊 Verifying Topic Panel Content Generation`);
        console.log(`═══════════════════════════════════════════════\n`);
        console.log(`Found ${entities.length} entity files\n`);

        entities.forEach(entity => {
            this.verifyEntity(entity);
        });

        this.printReport();
    }

    /**
     * Load all entity JSON files
     */
    loadAllEntities(dataDir) {
        const entities = [];

        function scanDirectory(dir) {
            const files = fs.readdirSync(dir);

            files.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (file.endsWith('.json')) {
                    try {
                        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                        if (data.type && data.name) {
                            entities.push(data);
                        }
                    } catch (err) {
                        console.warn(`Warning: Could not parse ${fullPath}`);
                    }
                }
            });
        }

        scanDirectory(dataDir);
        return entities;
    }

    /**
     * Verify single entity can generate content
     */
    verifyEntity(entity) {
        this.stats.total++;

        const type = entity.type || 'unknown';
        if (!this.stats.byType[type]) {
            this.stats.byType[type] = 0;
        }
        this.stats.byType[type]++;

        // Check background content
        if (this.canGenerateBackground(entity)) {
            this.stats.withBackground++;
        }

        // Check significance content
        if (this.canGenerateSignificance(entity)) {
            this.stats.withSignificance++;
        }

        // Check related entities
        if (this.hasRelatedEntities(entity)) {
            this.stats.withRelated++;
        }

        // Check "Did You Know" facts
        if (this.canGenerateDidYouKnow(entity)) {
            this.stats.withDidYouKnow++;
        }

        // Check sources
        if (this.hasSources(entity)) {
            this.stats.withSources++;
        }
    }

    /**
     * Check if entity can generate background content
     */
    canGenerateBackground(entity) {
        return !!(
            entity.fullDescription ||
            entity.mythologyContexts?.some(c => c.symbolism) ||
            entity.linguistic?.etymology?.derivation
        );
    }

    /**
     * Check if entity can generate significance content
     */
    canGenerateSignificance(entity) {
        return !!(
            entity.mythologyContexts?.some(c => c.culturalSignificance) ||
            entity.archetypes?.length > 0 ||
            entity.geographical?.cultCenters?.length > 0
        );
    }

    /**
     * Check if entity has related entities
     */
    hasRelatedEntities(entity) {
        if (!entity.relatedEntities) return false;

        return Object.values(entity.relatedEntities).some(
            category => Array.isArray(category) && category.length > 0
        );
    }

    /**
     * Check if entity can generate "Did You Know" facts
     */
    canGenerateDidYouKnow(entity) {
        return !!(
            entity.mythologyContexts?.some(c => c.names?.length > 1) ||
            entity.properties?.length > 0 ||
            entity.temporal?.firstAttestation ||
            entity.linguistic?.originalScript ||
            entity.archetypes?.length > 0 ||
            entity.tags?.length > 5
        );
    }

    /**
     * Check if entity has sources
     */
    hasSources(entity) {
        return !!(
            entity.sources?.length > 0 ||
            entity.mythologyContexts?.some(c => c.textReferences?.length > 0)
        );
    }

    /**
     * Print verification report
     */
    printReport() {
        console.log(`\n📋 VERIFICATION REPORT`);
        console.log(`═══════════════════════════════════════════════\n`);

        console.log(`Total Entities: ${this.stats.total}`);
        console.log(`\nContent Coverage:`);
        console.log(`  ✅ Background:       ${this.stats.withBackground} (${this.percentage(this.stats.withBackground)}%)`);
        console.log(`  ✅ Significance:     ${this.stats.withSignificance} (${this.percentage(this.stats.withSignificance)}%)`);
        console.log(`  ✅ Related:          ${this.stats.withRelated} (${this.percentage(this.stats.withRelated)}%)`);
        console.log(`  ✅ Did You Know:     ${this.stats.withDidYouKnow} (${this.percentage(this.stats.withDidYouKnow)}%)`);
        console.log(`  ✅ Sources:          ${this.stats.withSources} (${this.percentage(this.stats.withSources)}%)`);

        console.log(`\nBy Entity Type:`);
        Object.entries(this.stats.byType)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                console.log(`  ${type.padEnd(20)} ${count}`);
            });

        const avgCoverage = (
            (this.stats.withBackground +
             this.stats.withSignificance +
             this.stats.withRelated +
             this.stats.withDidYouKnow +
             this.stats.withSources) / (this.stats.total * 5) * 100
        ).toFixed(1);

        console.log(`\n🎯 Overall Coverage: ${avgCoverage}%`);

        if (avgCoverage >= 90) {
            console.log(`✅ EXCELLENT: Topic panels will be rich and engaging!`);
        } else if (avgCoverage >= 70) {
            console.log(`⚠️  GOOD: Most entities have solid content.`);
        } else {
            console.log(`❌ NEEDS WORK: Many entities lack sufficient data.`);
        }

        console.log(`\n`);
    }

    percentage(count) {
        return ((count / this.stats.total) * 100).toFixed(1);
    }
}

// Run verification
if (require.main === module) {
    const dataDir = path.join(__dirname, '../FIREBASE/data/entities');

    if (!fs.existsSync(dataDir)) {
        console.error(`❌ Data directory not found: ${dataDir}`);
        process.exit(1);
    }

    const verifier = new TopicPanelsVerifier();
    verifier.verifyAllEntities(dataDir);
}

module.exports = TopicPanelsVerifier;
