const fs = require('fs');
const https = require('https');
const path = require('path');

const PROJECT_ID = 'eyesofazrael';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const batchData = JSON.parse(fs.readFileSync('H:\\Github\\EyesOfAzrael\\migration-batches\\batch-4.json', 'utf8'));

const migrationLog = [];
let successCount = 0;
let failCount = 0;
let deletedCount = 0;

function makeFirebaseRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
        }

        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body || '{}'));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
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

        // Extract various content types
        const content = {
            title: html.match(/<title>(.*?)<\/title>/)?.[1] || '',
            headings: [...html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim()),
            paragraphs: [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gs)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(p => p && p.length > 10),
            lists: [...html.matchAll(/<li[^>]*>(.*?)<\/li>/gs)].map(m => m[1].replace(/<[^>]+>/g, '').trim()),
            metadata: {}
        };

        // Extract meta tags
        const metaTags = [...html.matchAll(/<meta\s+name="([^"]+)"\s+content="([^"]+)"/g)];
        metaTags.forEach(([, name, value]) => {
            content.metadata[name] = value;
        });

        return content;
    } catch (error) {
        console.error(`Error reading ${htmlPath}:`, error.message);
        return null;
    }
}

async function migrateFile(fileInfo) {
    const htmlPath = path.join('H:\\Github\\EyesOfAzrael', fileInfo.html_file);

    console.log(`\n[${fileInfo.html_file}]`);

    // Check if file exists
    if (!fs.existsSync(htmlPath)) {
        console.log('  ⚠️  File not found, skipping');
        migrationLog.push({
            file: fileInfo.html_file,
            status: 'SKIPPED',
            reason: 'File not found'
        });
        return;
    }

    // Extract content
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

    // Prepare Firebase update
    const collection = fileInfo.firebase_collection;
    const assetId = fileInfo.firebase_asset_id;
    const firestorePath = `${collection}/${assetId}`;

    try {
        // Get existing document
        console.log(`  📥 Fetching existing document: ${collection}/${assetId}`);
        let existingDoc;
        try {
            existingDoc = await makeFirebaseRequest('GET', firestorePath);
        } catch (error) {
            console.log(`  ⚠️  Document doesn't exist, will create new one`);
            existingDoc = { fields: {} };
        }

        // Merge content
        const fields = existingDoc.fields || {};

        // Add HTML content to a migration field
        if (!fields.html_migrations) {
            fields.html_migrations = { arrayValue: { values: [] } };
        }

        const migrationEntry = {
            mapValue: {
                fields: {
                    source_file: { stringValue: fileInfo.html_file },
                    migrated_at: { stringValue: new Date().toISOString() },
                    title: { stringValue: content.title },
                    headings: { arrayValue: { values: content.headings.slice(0, 20).map(h => ({ stringValue: h })) } },
                    paragraphs: { arrayValue: { values: content.paragraphs.slice(0, 10).map(p => ({ stringValue: p })) } },
                    lists: { arrayValue: { values: content.lists.slice(0, 30).map(l => ({ stringValue: l })) } }
                }
            }
        };

        fields.html_migrations.arrayValue.values.push(migrationEntry);

        // Update last_modified
        fields.last_modified = { stringValue: new Date().toISOString() };

        // Save to Firebase
        console.log(`  💾 Updating Firebase document...`);
        await makeFirebaseRequest('PATCH', `${firestorePath}?updateMask.fieldPaths=html_migrations&updateMask.fieldPaths=last_modified`, { fields });

        console.log(`  ✅ Successfully migrated to Firebase`);
        successCount++;

        // Delete HTML file
        console.log(`  🗑️  Deleting HTML file...`);
        fs.unlinkSync(htmlPath);
        deletedCount++;
        console.log(`  ✅ File deleted`);

        migrationLog.push({
            file: fileInfo.html_file,
            status: 'SUCCESS',
            collection: collection,
            assetId: assetId,
            contentExtracted: {
                headings: content.headings.length,
                paragraphs: content.paragraphs.length,
                lists: content.lists.length
            }
        });

    } catch (error) {
        console.log(`  ❌ Migration failed: ${error.message}`);
        failCount++;
        migrationLog.push({
            file: fileInfo.html_file,
            status: 'FAILED',
            reason: error.message,
            collection: collection,
            assetId: assetId
        });
    }
}

async function runMigration() {
    console.log('='.repeat(80));
    console.log('BATCH 4 MIGRATION - HTML to Firebase with Deletion');
    console.log('='.repeat(80));
    console.log(`Total files to process: ${batchData.files.length}`);
    console.log(`Average migration percentage: ${batchData.avg_migration_pct.toFixed(2)}%`);
    console.log('='.repeat(80));

    for (let i = 0; i < batchData.files.length; i++) {
        const fileInfo = batchData.files[i];
        console.log(`\n[${i + 1}/${batchData.files.length}] Processing...`);
        await migrateFile(fileInfo);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Generate report
    console.log('\n' + '='.repeat(80));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`✅ Successful migrations: ${successCount}`);
    console.log(`🗑️  Files deleted: ${deletedCount}`);
    console.log(`❌ Failed migrations: ${failCount}`);
    console.log(`⚠️  Skipped files: ${migrationLog.filter(l => l.status === 'SKIPPED').length}`);
    console.log('='.repeat(80));

    // Save report
    const report = {
        batch_number: 4,
        timestamp: new Date().toISOString(),
        summary: {
            total_files: batchData.files.length,
            successful: successCount,
            failed: failCount,
            skipped: migrationLog.filter(l => l.status === 'SKIPPED').length,
            deleted: deletedCount
        },
        migrations: migrationLog
    };

    fs.writeFileSync('H:\\Github\\EyesOfAzrael\\batch-4-migration-log.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed log saved to: batch-4-migration-log.json');
}

runMigration().catch(console.error);
