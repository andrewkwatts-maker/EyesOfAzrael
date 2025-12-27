/**
 * Test Display Rendering
 *
 * Tests that sample entities render correctly in all display modes
 */

const fs = require('fs');
const path = require('path');

// Import renderer (simplified version for Node.js testing)
class TestRenderer {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    /**
     * Test if entity has required fields for a display mode
     */
    testDisplayMode(entity, mode) {
        const requirements = {
            page: ['name', 'fullDescription', 'type', 'primaryMythology'],
            panel: ['name', 'fullDescription', 'icon', 'type'],
            card: ['name', 'icon', 'type'],
            'table-row': ['name', 'type', 'primaryMythology'],
            'short-description': ['name', 'shortDescription'],
            link: ['name', 'id']
        };

        const required = requirements[mode];
        if (!required) {
            return { pass: false, error: `Unknown mode: ${mode}` };
        }

        const missing = [];
        const issues = [];

        required.forEach(field => {
            const value = this.getNestedValue(entity, field);

            if (!value) {
                missing.push(field);
            } else {
                // Check length requirements
                if (field === 'fullDescription' && value.length < 100) {
                    issues.push(`${field} too short (${value.length} chars)`);
                }
                if (field === 'shortDescription' && value.length < 50) {
                    issues.push(`${field} too short (${value.length} chars)`);
                }
            }
        });

        const pass = missing.length === 0 && issues.length === 0;

        return {
            pass,
            missing,
            issues,
            mode,
            entity: entity.name
        };
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Test entity in all display modes
     */
    testEntity(entity) {
        const modes = ['page', 'panel', 'card', 'table-row', 'short-description', 'link'];
        const results = {
            entity: entity.name,
            id: entity.id,
            type: entity.type,
            modes: {}
        };

        let allPass = true;

        modes.forEach(mode => {
            const result = this.testDisplayMode(entity, mode);
            results.modes[mode] = result;

            if (result.pass) {
                this.testResults.passed++;
            } else {
                this.testResults.failed++;
                allPass = false;
            }
        });

        results.allPass = allPass;
        this.testResults.tests.push(results);

        return results;
    }

    /**
     * Print test results
     */
    printResults(entityResults) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Testing: ${entityResults.entity} (${entityResults.id})`);
        console.log(`${'='.repeat(80)}\n`);

        Object.entries(entityResults.modes).forEach(([mode, result]) => {
            const status = result.pass ? '✅' : '❌';
            console.log(`${status} ${mode.padEnd(20)}`);

            if (!result.pass) {
                if (result.missing?.length > 0) {
                    console.log(`   Missing: ${result.missing.join(', ')}`);
                }
                if (result.issues?.length > 0) {
                    console.log(`   Issues: ${result.issues.join(', ')}`);
                }
            }
        });

        console.log(`\nOverall: ${entityResults.allPass ? '✅ PASS' : '❌ FAIL'}\n`);
    }

    /**
     * Print summary
     */
    printSummary() {
        console.log(`\n${'='.repeat(80)}`);
        console.log('SUMMARY');
        console.log(`${'='.repeat(80)}\n`);

        const total = this.testResults.passed + this.testResults.failed;
        const passRate = ((this.testResults.passed / total) * 100).toFixed(2);

        console.log(`Tests Passed:  ${this.testResults.passed}`);
        console.log(`Tests Failed:  ${this.testResults.failed}`);
        console.log(`Total Tests:   ${total}`);
        console.log(`Pass Rate:     ${passRate}%\n`);

        const entitiesPass = this.testResults.tests.filter(t => t.allPass).length;
        const entitiesTotal = this.testResults.tests.length;

        console.log(`Entities Passed: ${entitiesPass}/${entitiesTotal}\n`);

        if (this.testResults.failed === 0) {
            console.log('✅ All tests passed!\n');
        } else {
            console.log('❌ Some tests failed. See details above.\n');
        }
    }
}

// Main test function
async function main() {
    const renderer = new TestRenderer();

    console.log('\n🧪 TESTING DISPLAY MODE RENDERING\n');

    // Sample entities to test (one of each type)
    const testEntities = [
        'data/entities/deity/zeus.json',
        'data/entities/hero/achilles.json',
        'data/entities/creature/cerberus.json',
        'data/entities/place/mount-olympus.json',
        'data/entities/item/mjolnir.json',
        'data/entities/concept/karma.json',
        'data/entities/magic/alchemy.json'
    ];

    // Test each entity
    for (const entityPath of testEntities) {
        try {
            const fullPath = path.join('H:/Github/EyesOfAzrael', entityPath);
            const content = fs.readFileSync(fullPath, 'utf8');
            const entity = JSON.parse(content);

            const result = renderer.testEntity(entity);
            renderer.printResults(result);
        } catch (error) {
            console.error(`❌ Error testing ${entityPath}:`, error.message);
        }
    }

    // Print summary
    renderer.printSummary();

    // Exit with error code if any tests failed
    process.exit(renderer.testResults.failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
