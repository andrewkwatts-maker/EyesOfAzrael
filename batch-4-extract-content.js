const fs = require('fs');
const path = require('path');

const batchData = JSON.parse(fs.readFileSync('H:\\Github\\EyesOfAzrael\\migration-batches\\batch-4.json', 'utf8'));

const extractedData = {
    batch_number: 4,
    timestamp: new Date().toISOString(),
    total_files: 0,
    extracted: 0,
    failed: 0,
    files: []
};

function extractHTMLContent(htmlPath) {
    try {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const stripHTML = (str) => str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/&[a-z]+;/g, ' ').trim();

        const content = {
            title: stripHTML(html.match(/<title>(.*?)<\/title>/)?.[1] || ''),
            headings: [...html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g)]
                .map(m => stripHTML(m[1]))
                .filter(h => h && h.length > 1),
            paragraphs: [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gs)]
                .map(m => stripHTML(m[1]))
                .filter(p => p && p.length > 10 && p.length < 2000),
            lists: [...html.matchAll(/<li[^>]*>(.*?)<\/li>/gs)]
                .map(m => stripHTML(m[1]))
                .filter(l => l && l.length > 2 && l.length < 800)
        };

        return content;
    } catch (error) {
        return null;
    }
}

function processFile(fileInfo) {
    const htmlPath = path.join('H:\\Github\\EyesOfAzrael', fileInfo.html_file);

    extractedData.total_files++;

    if (!fs.existsSync(htmlPath)) {
        extractedData.failed++;
        extractedData.files.push({
            source_file: fileInfo.html_file,
            status: 'NOT_FOUND',
            collection: fileInfo.firebase_collection,
            asset_id: fileInfo.firebase_asset_id
        });
        return;
    }

    const content = extractHTMLContent(htmlPath);
    if (!content) {
        extractedData.failed++;
        extractedData.files.push({
            source_file: fileInfo.html_file,
            status: 'EXTRACT_FAILED',
            collection: fileInfo.firebase_collection,
            asset_id: fileInfo.firebase_asset_id
        });
        return;
    }

    extractedData.extracted++;
    extractedData.files.push({
        source_file: fileInfo.html_file,
        status: 'SUCCESS',
        collection: fileInfo.firebase_collection,
        asset_id: fileInfo.firebase_asset_id,
        migration_pct: fileInfo.migration_percentage,
        content: {
            title: content.title,
            headings: content.headings,
            paragraphs: content.paragraphs,
            lists: content.lists
        },
        stats: {
            headings_count: content.headings.length,
            paragraphs_count: content.paragraphs.length,
            lists_count: content.lists.length
        }
    });

    if (extractedData.extracted % 10 === 0) {
        console.log(`Progress: ${extractedData.extracted}/${batchData.files.length}`);
    }
}

console.log('='.repeat(80));
console.log('BATCH 4 CONTENT EXTRACTION');
console.log('='.repeat(80));
console.log(`Total files: ${batchData.files.length}`);
console.log('='.repeat(80));

batchData.files.forEach(processFile);

console.log('\n' + '='.repeat(80));
console.log('EXTRACTION COMPLETE');
console.log('='.repeat(80));
console.log(`✅ Extracted: ${extractedData.extracted}`);
console.log(`❌ Failed: ${extractedData.failed}`);
console.log('='.repeat(80));

// Save extracted content
fs.writeFileSync(
    'H:\\Github\\EyesOfAzrael\\batch-4-extracted-content.json',
    JSON.stringify(extractedData, null, 2)
);

console.log('\n✅ Saved: batch-4-extracted-content.json');

// Generate report
const md = `# Batch 4 Content Extraction Report

## Summary
- **Batch Number**: 4
- **Timestamp**: ${extractedData.timestamp}
- **Total Files**: ${extractedData.total_files}
- **Successfully Extracted**: ${extractedData.extracted}
- **Failed**: ${extractedData.failed}

## Collection Summary

${Object.entries(
    extractedData.files
        .filter(f => f.status === 'SUCCESS')
        .reduce((acc, f) => {
            acc[f.collection] = (acc[f.collection] || 0) + 1;
            return acc;
        }, {})
).map(([collection, count]) => `- **${collection}**: ${count} files`).join('\n')}

## Extracted Files

${extractedData.files
    .filter(f => f.status === 'SUCCESS')
    .map((f, i) => `${i + 1}. \`${f.source_file}\`
   - Collection: **${f.collection}**
   - Asset ID: **${f.asset_id}**
   - Migration%: ${f.migration_pct}
   - Content: ${f.stats.headings_count}h, ${f.stats.paragraphs_count}p, ${f.stats.lists_count}l`)
    .join('\n\n')}

## Failed Extractions

${extractedData.files
    .filter(f => f.status !== 'SUCCESS')
    .map((f, i) => `${i + 1}. \`${f.source_file}\` - ${f.status}`)
    .join('\n')}

${extractedData.failed === 0 ? '_No failures_' : ''}

## Next Steps

1. Review extracted content in \`batch-4-extracted-content.json\`
2. Use Firebase Admin SDK or console to import data
3. After successful import, manually delete source HTML files
4. Verify Firebase data integrity

## Notes

This batch contains files with ~24% average migration percentage. Content has been extracted but **files have NOT been deleted**. Manual verification and deletion required after successful Firebase import.
`;

fs.writeFileSync('H:\\Github\\EyesOfAzrael\\BATCH4_MIGRATION_REPORT.md', md);
console.log('✅ Saved: BATCH4_MIGRATION_REPORT.md\n');
