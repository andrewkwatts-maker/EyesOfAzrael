const fs = require('fs');
const https = require('https');
const path = require('path');

const PROJECT_ID = 'eyesofazrael';
const BASE_URL = `firestore.googleapis.com`;
const BASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const batchData = JSON.parse(fs.readFileSync('H:\\Github\\EyesOfAzrael\\migration-batches\\batch-4.json', 'utf8'));

const migrationLog = [];
let successCount = 0;
let failCount = 0;
let deletedCount = 0;

function makeFirebaseRequest(method, docPath, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            path: `${BASE_PATH}/${docPath}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            const jsonData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(body ? JSON.parse(body) : {});
                    } catch (e) {
                        resolve({});
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

function extractHTMLContent(htmlPath) {
    try {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const stripHTML = (str) => str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

        const content = {
            title: stripHTML(html.match(/<title>(.*?)<\/title>/)?.[1] || ''),
            headings: [...html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g)]
                .map(m => stripHTML(m[1]))
                .filter(h => h && h.length > 1),
            paragraphs: [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gs)]
                .map(m => stripHTML(m[1]))
                .filter(p => p && p.length > 10 && p.length < 1000),
            lists: [...html.matchAll(/<li[^>]*>(.*?)<\/li>/gs)]
                .map(m => stripHTML(m[1]))
                .filter(l => l && l.length > 2 && l.length < 500)
        };

        return content;
    } catch (error) {
        console.error(`Error reading ${htmlPath}:`, error.message);
        return null;
    }
}

function toFirestoreValue(value) {
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'number') return { doubleValue: value };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(v => toFirestoreValue(v))
            }
        };
    }
    if (value && typeof value === 'object') {
        return {
            mapValue: {
                fields: Object.entries(value).reduce((acc, [k, v]) => {
                    acc[k] = toFirestoreValue(v);
                    return acc;
                }, {})
            }
        };
    }
    return { nullValue: null };
}

async function migrateFile(fileInfo) {
    const htmlPath = path.join('H:\\Github\\EyesOfAzrael', fileInfo.html_file);

    console.log(`\n[${fileInfo.html_file}]`);

    if (!fs.existsSync(htmlPath)) {
        console.log('  ⚠️  File not found');
        migrationLog.push({
            file: fileInfo.html_file,
            status: 'SKIPPED',
            reason: 'File not found'
        });
        return;
    }

    const content = extractHTMLContent(htmlPath);
    if (!content) {
        console.log('  ❌ Failed to extract content');
        failCount++;
        migrationLog.push({
            file: fileInfo.html_file,
            status: 'FAILED',
            reason: 'Content extraction failed'
        });
        return;
    }

    console.log(`  📄 ${content.headings.length}h, ${content.paragraphs.length}p, ${content.lists.length}l`);

    const collection = fileInfo.firebase_collection;
    const assetId = fileInfo.firebase_asset_id;
    const firestorePath = `${collection}/${assetId}`;

    try {
        console.log(`  📥 ${collection}/${assetId}`);
        let existingDoc;
        try {
            existingDoc = await makeFirebaseRequest('GET', firestorePath);
        } catch (error) {
            if (error.message.includes('404')) {
                console.log(`  ℹ️  Creating new document`);
                existingDoc = { fields: {} };
            } else {
                throw error;
            }
        }

        const fields = existingDoc.fields || {};

        if (!fields.html_sources) {
            fields.html_sources = { arrayValue: { values: [] } };
        }

        const migrationEntry = {
            source_file: fileInfo.html_file,
            migrated_at: new Date().toISOString(),
            migration_pct: fileInfo.migration_percentage,
            title: content.title,
            headings: content.headings.slice(0, 15),
            paragraphs: content.paragraphs.slice(0, 8),
            lists: content.lists.slice(0, 20)
        };

        fields.html_sources.arrayValue.values.push(toFirestoreValue(migrationEntry));
        fields.last_updated = toFirestoreValue(new Date().toISOString());
        fields.migration_batch = toFirestoreValue(4);

        // Update document - fix the query parameter format
        console.log(`  💾 Updating...`);
        const updatePath = `${firestorePath}?updateMask.fieldPaths=html_sources&updateMask.fieldPaths=last_updated&updateMask.fieldPaths=migration_batch`;
        await makeFirebaseRequest('PATCH', updatePath, { fields });

        console.log(`  ✅ Migrated`);
        successCount++;

        console.log(`  🗑️  Deleting...`);
        fs.unlinkSync(htmlPath);
        deletedCount++;
        console.log(`  ✅ Deleted`);

        migrationLog.push({
            file: fileInfo.html_file,
            status: 'SUCCESS',
            collection: collection,
            assetId: assetId,
            contentExtracted: {
                headings: content.headings.length,
                paragraphs: content.paragraphs.length,
                lists: content.lists.length
            },
            deleted: true
        });

    } catch (error) {
        console.log(`  ❌ ${error.message.substring(0, 100)}`);
        failCount++;
        migrationLog.push({
            file: fileInfo.html_file,
            status: 'FAILED',
            reason: error.message.substring(0, 200),
            collection: collection,
            assetId: assetId,
            deleted: false
        });
    }
}

async function runMigration() {
    console.log('='.repeat(80));
    console.log('BATCH 4 MIGRATION - HTML to Firebase with Deletion');
    console.log('='.repeat(80));
    console.log(`Files: ${batchData.files.length} | Avg Migration: ${batchData.avg_migration_pct.toFixed(2)}%`);
    console.log('='.repeat(80));

    for (let i = 0; i < batchData.files.length; i++) {
        console.log(`\n[${i + 1}/${batchData.files.length}]`);
        await migrateFile(batchData.files[i]);
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log('\n' + '='.repeat(80));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`✅ Success: ${successCount} | 🗑️  Deleted: ${deletedCount}`);
    console.log(`❌ Failed: ${failCount} | ⚠️  Skipped: ${migrationLog.filter(l => l.status === 'SKIPPED').length}`);
    console.log('='.repeat(80));

    const report = {
        batch_number: 4,
        timestamp: new Date().toISOString(),
        summary: {
            total_files: batchData.files.length,
            successful: successCount,
            failed: failCount,
            skipped: migrationLog.filter(l => l.status === 'SKIPPED').length,
            deleted: deletedCount,
            avg_migration_pct: batchData.avg_migration_pct
        },
        migrations: migrationLog
    };

    fs.writeFileSync('H:\\Github\\EyesOfAzrael\\batch-4-migration-log.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Log: batch-4-migration-log.json');

    generateMarkdownReport(report);
}

function generateMarkdownReport(report) {
    const successList = report.migrations.filter(m => m.status === 'SUCCESS');
    const failList = report.migrations.filter(m => m.status === 'FAILED');
    const skipList = report.migrations.filter(m => m.status === 'SKIPPED');

    const md = `# Batch 4 Migration Report

## Summary
- **Batch Number**: 4
- **Timestamp**: ${report.timestamp}
- **Total Files**: ${report.summary.total_files}
- **Average Migration**: ${report.summary.avg_migration_pct.toFixed(2)}%

## Results
- ✅ **Successful Migrations**: ${report.summary.successful}
- 🗑️ **Files Deleted**: ${report.summary.deleted}
- ❌ **Failed Migrations**: ${report.summary.failed}
- ⚠️ **Skipped Files**: ${report.summary.skipped}

## Success Rate
- **Migration Success**: ${((report.summary.successful / report.summary.total_files) * 100).toFixed(1)}%
- **Deletion Success**: ${((report.summary.deleted / report.summary.total_files) * 100).toFixed(1)}%

## Successful Migrations

${successList.length > 0 ? successList.map((m, i) =>
    `${i + 1}. **${m.file}**
   - Collection: \`${m.collection}\`
   - Asset ID: \`${m.assetId}\`
   - Content: ${m.contentExtracted.headings}h, ${m.contentExtracted.paragraphs}p, ${m.contentExtracted.lists}l
   - Deleted: ✅`
).join('\n\n') : '_No successful migrations_'}

## Failed Migrations

${failList.length > 0 ? failList.map((m, i) =>
    `${i + 1}. **${m.file}**
   - Collection: \`${m.collection}\`
   - Asset ID: \`${m.assetId}\`
   - Reason: ${m.reason.substring(0, 150)}`
).join('\n\n') : '_No failures_'}

## Skipped Files

${skipList.length > 0 ? skipList.map((m, i) =>
    `${i + 1}. **${m.file}** - ${m.reason}`
).join('\n') : '_No skipped files_'}

## Firebase Collections Updated

${[...new Set(successList.map(m => m.collection))].map(col => {
    const count = successList.filter(m => m.collection === col).length;
    return `- \`${col}\`: ${count} document${count > 1 ? 's' : ''}`;
}).join('\n')}

## Notes

All HTML files have been migrated to Firebase in the \`html_sources\` field. Successfully migrated files have been deleted.

Migration batch 4 focused on files with ~24% migration percentage.
`;

    fs.writeFileSync('H:\\Github\\EyesOfAzrael\\BATCH4_MIGRATION_REPORT.md', md);
    console.log('📝 Report: BATCH4_MIGRATION_REPORT.md');
}

runMigration().catch(console.error);
