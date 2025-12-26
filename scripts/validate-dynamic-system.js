#!/usr/bin/env node

/**
 * Dynamic Firebase System Validation Script
 *
 * Validates that pages work with the Firebase dynamic system:
 * 1. Checks if content is in Firebase (not hardcoded in HTML)
 * 2. Validates dynamic routing components exist
 * 3. Ensures pages use Firebase SDK properly
 * 4. Identifies pages that need migration from static to dynamic
 */

const fs = require('fs');
const path = require('path');

class DynamicSystemValidator {
    constructor() {
        this.baseDir = path.resolve(__dirname, '..');
        this.results = {
            totalPages: 0,
            dynamicReady: [],
            needsMigration: [],
            staticContent: [],
            missingFirebaseData: [],
            validationErrors: []
        };
    }

    /**
     * Find all HTML files
     */
    findAllHTMLFiles(dir = path.join(this.baseDir, 'mythos')) {
        const htmlFiles = [];

        const scan = (currentDir) => {
            try {
                const entries = fs.readdirSync(currentDir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(currentDir, entry.name);

                    if (entry.isDirectory()) {
                        scan(fullPath);
                    } else if (entry.name.endsWith('.html')) {
                        htmlFiles.push(fullPath);
                    }
                }
            } catch (error) {
                console.error(`Error scanning ${currentDir}: ${error.message}`);
            }
        };

        scan(dir);
        return htmlFiles;
    }

    /**
     * Validate a single page
     */
    validatePage(filePath) {
        const relativePath = path.relative(this.baseDir, filePath);
        const content = fs.readFileSync(filePath, 'utf-8');

        const validation = {
            path: relativePath,
            hasDynamicComponents: false,
            hasFirebaseSDK: false,
            hasStaticContent: false,
            contentIndicators: {
                hasHardcodedDeities: false,
                hasHardcodedTables: false,
                hasHardcodedLists: false,
                hasStaticEntityData: false
            },
            migrationNeeded: false,
            issues: []
        };

        // Check for Firebase SDK
        validation.hasFirebaseSDK = content.includes('firebase-app-compat.js');

        // Check for dynamic components
        validation.hasDynamicComponents =
            content.includes('dynamic-router.js') ||
            content.includes('entity-type-browser.js') ||
            content.includes('universal-entity-renderer.js');

        // Check for hardcoded content patterns

        // Pattern 1: Hardcoded deity cards/tables
        const deityCardPattern = /<div[^>]*class="[^"]*deity-card[^"]*"[^>]*>/gi;
        const deityMatches = content.match(deityCardPattern);
        if (deityMatches && deityMatches.length > 1) {
            validation.contentIndicators.hasHardcodedDeities = true;
            validation.issues.push(`Found ${deityMatches.length} hardcoded deity cards`);
        }

        // Pattern 2: Hardcoded HTML tables with content
        const tablePattern = /<table[^>]*>[\s\S]*?<tbody[^>]*>[\s\S]*?<tr[^>]*>[\s\S]*?<\/table>/gi;
        const tableMatches = content.match(tablePattern);
        if (tableMatches && tableMatches.length > 0) {
            // Check if tables have actual data (not just structure)
            const hasDataInTables = tableMatches.some(table => {
                const rowCount = (table.match(/<tr/gi) || []).length;
                return rowCount > 2; // More than just header row
            });
            if (hasDataInTables) {
                validation.contentIndicators.hasHardcodedTables = true;
                validation.issues.push(`Found ${tableMatches.length} tables with hardcoded data`);
            }
        }

        // Pattern 3: Hardcoded lists of entities
        const entityListPattern = /<ul[^>]*class="[^"]*entity-list[^"]*"[^>]*>[\s\S]*?<li/gi;
        const listMatches = content.match(entityListPattern);
        if (listMatches && listMatches.length > 0) {
            validation.contentIndicators.hasHardcodedLists = true;
            validation.issues.push('Found hardcoded entity lists');
        }

        // Pattern 4: Static JSON data embedded in page
        const jsonDataPattern = /<script[^>]*>[\s\S]*?const\s+(?:deities|entities|items)\s*=\s*\[[\s\S]*?\]/gi;
        const jsonMatches = content.match(jsonDataPattern);
        if (jsonMatches && jsonMatches.length > 0) {
            validation.contentIndicators.hasStaticEntityData = true;
            validation.issues.push('Found embedded static entity data');
        }

        // Determine if static content exists
        validation.hasStaticContent = Object.values(validation.contentIndicators).some(v => v);

        // Determine if migration needed
        validation.migrationNeeded =
            validation.hasStaticContent &&
            !validation.hasDynamicComponents;

        return validation;
    }

    /**
     * Run validation on all pages
     */
    async run() {
        console.log('='.repeat(80));
        console.log('DYNAMIC FIREBASE SYSTEM VALIDATION');
        console.log('='.repeat(80));

        console.log('\n🔍 Scanning for HTML pages...');
        const htmlFiles = this.findAllHTMLFiles();
        this.results.totalPages = htmlFiles.length;
        console.log(`Found ${htmlFiles.length} pages\n`);

        console.log('📋 Validating pages...\n');

        for (const filePath of htmlFiles) {
            const validation = this.validatePage(filePath);

            if (validation.migrationNeeded) {
                this.results.needsMigration.push(validation);
                console.log(`🔄 MIGRATION NEEDED: ${validation.path}`);
                validation.issues.forEach(issue => console.log(`   • ${issue}`));
            } else if (validation.hasStaticContent && validation.hasDynamicComponents) {
                this.results.staticContent.push(validation);
                console.log(`⚠️  HAS STATIC CONTENT: ${validation.path} (but has dynamic components)`);
            } else if (!validation.hasFirebaseSDK) {
                this.results.validationErrors.push(validation);
                console.log(`❌ NO FIREBASE SDK: ${validation.path}`);
            } else {
                this.results.dynamicReady.push(validation);
                console.log(`✅ DYNAMIC READY: ${validation.path}`);
            }
        }

        this.generateReport();
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('VALIDATION REPORT');
        console.log('='.repeat(80));

        console.log(`\nTotal Pages Scanned: ${this.results.totalPages}`);
        console.log(`✅ Dynamic Ready: ${this.results.dynamicReady.length}`);
        console.log(`⚠️  Has Static Content (but dynamic): ${this.results.staticContent.length}`);
        console.log(`🔄 Needs Migration: ${this.results.needsMigration.length}`);
        console.log(`❌ Missing Firebase SDK: ${this.results.validationErrors.length}`);

        const readyPercentage = ((this.results.dynamicReady.length / this.results.totalPages) * 100).toFixed(1);
        console.log(`\n📊 Dynamic System Readiness: ${readyPercentage}%`);

        if (this.results.needsMigration.length > 0) {
            console.log(`\n🔄 Pages Requiring Migration to Firebase Dynamic System:`);
            console.log('=' .repeat(80));

            // Group by type
            const byType = {};
            this.results.needsMigration.forEach(page => {
                const parts = page.path.split(/[\\/]/);
                const type = parts[parts.length - 2] || 'other';
                if (!byType[type]) byType[type] = [];
                byType[type].push(page);
            });

            Object.entries(byType).forEach(([type, pages]) => {
                console.log(`\n  ${type.toUpperCase()} (${pages.length} pages):`);
                pages.forEach(page => {
                    console.log(`    • ${page.path}`);
                    page.issues.forEach(issue => console.log(`      - ${issue}`));
                });
            });
        }

        // Save detailed report
        const reportPath = path.join(this.baseDir, 'DYNAMIC_SYSTEM_VALIDATION.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2), 'utf-8');
        console.log(`\n📄 Detailed report saved to: DYNAMIC_SYSTEM_VALIDATION.json`);

        // Create migration task list
        if (this.results.needsMigration.length > 0) {
            this.createMigrationTaskList();
        }

        console.log('\n' + '='.repeat(80));
    }

    /**
     * Create migration task list
     */
    createMigrationTaskList() {
        const taskList = {
            totalTasks: this.results.needsMigration.length,
            completed: 0,
            tasks: this.results.needsMigration.map((page, index) => ({
                id: index + 1,
                path: page.path,
                status: 'pending',
                issues: page.issues,
                migrationSteps: this.generateMigrationSteps(page)
            }))
        };

        const taskPath = path.join(this.baseDir, 'MIGRATION_TASK_LIST.json');
        fs.writeFileSync(taskPath, JSON.stringify(taskList, null, 2), 'utf-8');
        console.log(`📝 Migration task list created: MIGRATION_TASK_LIST.json`);
    }

    /**
     * Generate migration steps for a page
     */
    generateMigrationSteps(validation) {
        const steps = [];

        if (validation.contentIndicators.hasHardcodedDeities) {
            steps.push('Extract deity data to Firebase deities collection');
            steps.push('Replace hardcoded deity cards with universal-entity-renderer');
        }

        if (validation.contentIndicators.hasHardcodedTables) {
            steps.push('Extract table data to Firebase');
            steps.push('Replace static tables with dynamic Firebase queries');
        }

        if (validation.contentIndicators.hasHardcodedLists) {
            steps.push('Extract list data to Firebase');
            steps.push('Use entity-type-browser component for lists');
        }

        if (validation.contentIndicators.hasStaticEntityData) {
            steps.push('Remove embedded JSON data');
            steps.push('Query data from Firebase Firestore');
        }

        if (!validation.hasFirebaseSDK) {
            steps.push('Add Firebase SDK scripts');
        }

        if (!validation.hasDynamicComponents) {
            steps.push('Add dynamic router components');
            steps.push('Implement dynamic view loading');
        }

        return steps;
    }
}

// Run if executed directly
if (require.main === module) {
    const validator = new DynamicSystemValidator();
    validator.run().catch(console.error);
}

module.exports = DynamicSystemValidator;
