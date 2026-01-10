const fs = require('fs');
const path = require('path');

const baseDir = 'H:/Github/EyesOfAzrael/firebase-assets-downloaded';

// Load the asset index
const assetIndex = JSON.parse(fs.readFileSync(path.join(baseDir, '_asset_index.json'), 'utf-8'));
const knownIds = new Set(Object.keys(assetIndex));

console.log('Loaded index with', knownIds.size, 'known IDs');

// Track global stats
let globalTotalRefsChecked = 0;
let globalBrokenLinksFound = 0;
let globalFilesModified = 0;
const globalMissingIdCounts = {};
const folderResults = [];

function processAsset(filePath) {
    let modified = false;
    const content = fs.readFileSync(filePath, 'utf-8');
    let asset;
    try {
        asset = JSON.parse(content);
    } catch (e) {
        console.error('JSON parse error:', filePath);
        return { checked: 0, broken: 0, modified: false };
    }

    let checked = 0;
    let broken = 0;

    // Check relatedEntities array
    if (asset.relatedEntities && Array.isArray(asset.relatedEntities)) {
        asset.relatedEntities.forEach(ref => {
            if (ref && ref.id) {
                checked++;
                if (!knownIds.has(ref.id)) {
                    // Mark as unverified if not already
                    if (!ref._unverified) {
                        ref._unverified = true;
                        ref._unverifiedReason = 'Referenced entity not found in database';
                        modified = true;
                        broken++;
                        globalMissingIdCounts[ref.id] = (globalMissingIdCounts[ref.id] || 0) + 1;
                    }
                }
            }
        });
    }

    if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(asset, null, 2));
    }

    return { checked, broken, modified };
}

function processFolder(folderName) {
    const targetDir = path.join(baseDir, folderName);

    if (!fs.existsSync(targetDir)) {
        return null;
    }

    const stat = fs.statSync(targetDir);
    if (!stat.isDirectory()) {
        return null;
    }

    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
        return null;
    }

    let totalRefsChecked = 0;
    let brokenLinksFound = 0;
    let filesModified = 0;

    files.forEach(file => {
        const result = processAsset(path.join(targetDir, file));
        totalRefsChecked += result.checked;
        brokenLinksFound += result.broken;
        if (result.modified) filesModified++;
    });

    globalTotalRefsChecked += totalRefsChecked;
    globalBrokenLinksFound += brokenLinksFound;
    globalFilesModified += filesModified;

    return {
        folder: folderName,
        filesCount: files.length,
        totalRefsChecked,
        brokenLinksFound,
        filesModified
    };
}

// Get all subdirectories
const entries = fs.readdirSync(baseDir, { withFileTypes: true });
const folders = entries.filter(e => e.isDirectory() && !e.name.startsWith('_')).map(e => e.name);

console.log('\nProcessing', folders.length, 'folders...\n');

folders.forEach(folder => {
    const result = processFolder(folder);
    if (result && result.totalRefsChecked > 0) {
        folderResults.push(result);
        console.log(folder + ':', result.totalRefsChecked, 'refs,', result.brokenLinksFound, 'broken,', result.filesModified, 'files modified');
    }
});

// Sort by broken links
folderResults.sort((a, b) => b.brokenLinksFound - a.brokenLinksFound);

// Generate final report
const finalReport = {
    summary: {
        totalRefsChecked: globalTotalRefsChecked,
        brokenLinksFound: globalBrokenLinksFound,
        filesModified: globalFilesModified,
        totalKnownAssets: knownIds.size
    },
    byFolder: folderResults,
    topMissingIds: Object.entries(globalMissingIdCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([id, count]) => ({ id, referenceCount: count }))
};

fs.writeFileSync(path.join(baseDir, '_unverified_references_report.json'), JSON.stringify(finalReport, null, 2));

console.log('\n========================================');
console.log('FINAL REPORT');
console.log('========================================');
console.log('Total references checked:', globalTotalRefsChecked);
console.log('Broken links found:', globalBrokenLinksFound);
console.log('Files modified:', globalFilesModified);
console.log('Known assets in index:', knownIds.size);
console.log('\nTop 20 most referenced missing IDs:');
finalReport.topMissingIds.slice(0, 20).forEach((item, i) => {
    console.log('  ' + (i + 1) + '. ' + item.id + ' (' + item.referenceCount + ' references)');
});
console.log('\nDetailed report saved to: _unverified_references_report.json');
