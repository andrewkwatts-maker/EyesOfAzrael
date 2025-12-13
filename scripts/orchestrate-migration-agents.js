#!/usr/bin/env node

/**
 * Migration Agent Orchestrator
 *
 * This script spawns multiple parallel agents to process different mythologies
 * simultaneously, dramatically speeding up the migration process.
 *
 * Each agent:
 * 1. Parses HTML files for its assigned mythology
 * 2. Validates extracted data
 * 3. Uploads to Firestore
 * 4. Reports back with statistics
 *
 * Usage:
 *   node orchestrate-migration-agents.js --parallel=5
 *   node orchestrate-migration-agents.js --validate-only
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const BASE_DIR = path.join(__dirname, '..');
const MYTHOS_DIR = path.join(BASE_DIR, 'mythos');

// Get all mythologies
function getAllMythologies() {
    return fs.readdirSync(MYTHOS_DIR)
        .filter(name => {
            const stat = fs.statSync(path.join(MYTHOS_DIR, name));
            return stat.isDirectory();
        });
}

// Agent task definition
class MigrationAgent {
    constructor(mythologyId, index, total) {
        this.mythologyId = mythologyId;
        this.index = index;
        this.total = total;
        this.status = 'pending';
        this.stats = null;
        this.error = null;
        this.startTime = null;
        this.endTime = null;
    }

    async parse() {
        this.status = 'parsing';
        this.startTime = Date.now();

        return new Promise((resolve, reject) => {
            const parseScript = path.join(__dirname, 'parse-html-to-firestore.js');
            const process = spawn('node', [parseScript, `--mythology=${this.mythologyId}`]);

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
                console.log(`[Agent ${this.index}/${this.total} - ${this.mythologyId}] ${data.toString().trim()}`);
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    this.status = 'parsed';
                    resolve(output);
                } else {
                    this.status = 'parse_failed';
                    this.error = errorOutput || `Process exited with code ${code}`;
                    reject(new Error(this.error));
                }
            });
        });
    }

    async upload(dryRun = false) {
        this.status = 'uploading';

        return new Promise((resolve, reject) => {
            const uploadScript = path.join(__dirname, 'upload-parsed-to-firestore.js');
            const args = [`--mythology=${this.mythologyId}`];
            if (dryRun) args.push('--dry-run');

            const process = spawn('node', [uploadScript, ...args]);

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
                console.log(`[Agent ${this.index}/${this.total} - ${this.mythologyId}] ${data.toString().trim()}`);
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            process.on('close', (code) => {
                this.endTime = Date.now();

                if (code === 0) {
                    this.status = 'completed';
                    resolve(output);
                } else {
                    this.status = 'upload_failed';
                    this.error = errorOutput || `Process exited with code ${code}`;
                    reject(new Error(this.error));
                }
            });
        });
    }

    async execute(dryRun = false) {
        try {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🤖 Agent ${this.index}/${this.total}: Starting ${this.mythologyId}`);
            console.log('='.repeat(60));

            await this.parse();
            console.log(`✅ Agent ${this.index}: Parsing complete for ${this.mythologyId}`);

            await this.upload(dryRun);
            console.log(`✅ Agent ${this.index}: Upload complete for ${this.mythologyId}`);

            const duration = ((this.endTime - this.startTime) / 1000).toFixed(2);
            console.log(`⏱️  Agent ${this.index}: Completed in ${duration}s`);

            return { success: true, duration };

        } catch (error) {
            const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
            console.error(`❌ Agent ${this.index}: Failed ${this.mythologyId} after ${duration}s`);
            console.error(`   Error: ${error.message}`);

            return { success: false, error: error.message, duration };
        }
    }

    getReport() {
        return {
            mythology: this.mythologyId,
            status: this.status,
            duration: this.endTime && this.startTime ?
                ((this.endTime - this.startTime) / 1000).toFixed(2) : null,
            error: this.error
        };
    }
}

// Process mythologies in parallel batches
async function processBatch(mythologies, batchSize, dryRun = false) {
    const agents = mythologies.map((mythId, index) =>
        new MigrationAgent(mythId, index + 1, mythologies.length)
    );

    const results = [];

    // Process in batches
    for (let i = 0; i < agents.length; i += batchSize) {
        const batch = agents.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(agents.length / batchSize);

        console.log(`\n${'█'.repeat(60)}`);
        console.log(`📦 BATCH ${batchNum}/${totalBatches}: Processing ${batch.length} mythologies`);
        console.log('█'.repeat(60));

        // Execute batch in parallel
        const batchResults = await Promise.allSettled(
            batch.map(agent => agent.execute(dryRun))
        );

        batchResults.forEach((result, index) => {
            const agent = batch[index];
            results.push(agent.getReport());
        });

        // Show batch summary
        const succeeded = batchResults.filter(r => r.status === 'fulfilled').length;
        const failed = batchResults.filter(r => r.status === 'rejected').length;

        console.log(`\n📊 Batch ${batchNum} Summary:`);
        console.log(`   ✅ Succeeded: ${succeeded}`);
        console.log(`   ❌ Failed: ${failed}`);
    }

    return results;
}

// Generate final report
function generateReport(results, totalTime) {
    const successful = results.filter(r => r.status === 'completed');
    const failed = results.filter(r => r.status !== 'completed');

    const report = {
        timestamp: new Date().toISOString(),
        totalMythologies: results.length,
        successful: successful.length,
        failed: failed.length,
        totalDuration: (totalTime / 1000).toFixed(2) + 's',
        averageDuration: successful.length > 0 ?
            (successful.reduce((sum, r) => sum + parseFloat(r.duration || 0), 0) / successful.length).toFixed(2) + 's'
            : 'N/A',
        results: results,
        failedMythologies: failed.map(r => ({
            mythology: r.mythology,
            error: r.error
        }))
    };

    return report;
}

// Main orchestration
async function main() {
    const args = process.argv.slice(2);
    const parallelArg = args.find(arg => arg.startsWith('--parallel='));
    const validateOnly = args.includes('--validate-only');
    const dryRun = args.includes('--dry-run') || validateOnly;

    const parallelCount = parallelArg ?
        parseInt(parallelArg.split('=')[1]) : 3; // Default: 3 parallel

    console.log('🚀 Migration Agent Orchestrator');
    console.log('━'.repeat(60));
    console.log(`📋 Parallel processing: ${parallelCount} mythologies at a time`);
    if (dryRun) {
        console.log(`⚠️  DRY RUN MODE: No data will be uploaded`);
    }

    const mythologies = getAllMythologies();
    console.log(`📚 Found ${mythologies.length} mythologies to process\n`);

    const startTime = Date.now();

    const results = await processBatch(mythologies, parallelCount, dryRun);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    const report = generateReport(results, totalTime);

    // Display final summary
    console.log('\n' + '═'.repeat(60));
    console.log('📈 FINAL MIGRATION REPORT');
    console.log('═'.repeat(60));
    console.log(`📊 Total mythologies: ${report.totalMythologies}`);
    console.log(`✅ Successful: ${report.successful}`);
    console.log(`❌ Failed: ${report.failed}`);
    console.log(`⏱️  Total duration: ${report.totalDuration}`);
    console.log(`⏱️  Average duration: ${report.averageDuration}`);

    if (report.failedMythologies.length > 0) {
        console.log('\n❌ Failed mythologies:');
        report.failedMythologies.forEach(fail => {
            console.log(`   - ${fail.mythology}: ${fail.error}`);
        });
    }

    // Save report
    const reportPath = path.join(BASE_DIR, 'parsed_data', 'migration_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}`);

    if (!dryRun) {
        console.log('\n📝 Next steps:');
        console.log('   1. Review migration report');
        console.log('   2. Fix any failed mythologies');
        console.log('   3. Verify data in Firebase Console');
        console.log('   4. Test queries and display');
        console.log('   5. Update frontend to use Firestore data');
    }

    process.exit(report.failed > 0 ? 1 : 0);
}

// Agent Task Descriptions for Claude Code
const AGENT_TASKS = {
    greek: {
        description: "Parse Greek mythology index and deity pages, extract Olympian gods, heroes, creatures",
        priority: "high",
        estimatedTime: "30s"
    },
    norse: {
        description: "Parse Norse mythology, extract Aesir, Vanir, Nine Realms",
        priority: "high",
        estimatedTime: "30s"
    },
    hindu: {
        description: "Parse Hindu mythology, extract Trimurti, avatars, sacred texts",
        priority: "high",
        estimatedTime: "45s"
    },
    egyptian: {
        description: "Parse Egyptian mythology, extract pantheon, cosmology, funerary texts",
        priority: "high",
        estimatedTime: "40s"
    },
    jewish: {
        description: "Parse Jewish/Kabbalah, extract Sefirot, angels, demons, sparks",
        priority: "high",
        estimatedTime: "60s"
    },
    christian: {
        description: "Parse Christian mythology, extract Trinity, angels, saints, Gnostic traditions",
        priority: "medium",
        estimatedTime: "50s"
    },
    buddhist: {
        description: "Parse Buddhist mythology, extract bodhisattvas, realms, concepts",
        priority: "medium",
        estimatedTime: "40s"
    },
    celtic: {
        description: "Parse Celtic mythology, extract Tuatha Dé Danann, heroes",
        priority: "medium",
        estimatedTime: "35s"
    },
    // Add more mythologies...
};

// Export for use by other scripts
module.exports = {
    MigrationAgent,
    processBatch,
    getAllMythologies,
    AGENT_TASKS
};

// Run if called directly
if (require.main === module) {
    main();
}
