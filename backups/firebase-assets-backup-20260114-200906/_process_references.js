const fs = require('fs');
const path = require('path');

const baseDir = 'H:/Github/EyesOfAzrael/firebase-assets-downloaded';

// Load the asset index
const assetIndex = JSON.parse(fs.readFileSync(path.join(baseDir, '_asset_index.json'), 'utf-8'));
const knownIds = new Set(Object.keys(assetIndex));

console.log('Loaded index with', knownIds.size, 'known IDs');

// Track stats
let totalRefsChecked = 0;
let brokenLinksFound = 0;
let filesModified = 0;
const missingIdCounts = {};

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
                        missingIdCounts[ref.id] = (missingIdCounts[ref.id] || 0) + 1;
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

// Get folder from command line or default to 'items'
const targetFolder = process.argv[2] || 'items';
const targetDir = path.join(baseDir, targetFolder);

if (!fs.existsSync(targetDir)) {
    console.error('Folder not found:', targetDir);
    process.exit(1);
}

const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.json'));

console.log('\nProcessing', targetFolder, 'folder (' + files.length + ' files)...');

files.forEach(file => {
    const result = processAsset(path.join(targetDir, file));
    totalRefsChecked += result.checked;
    brokenLinksFound += result.broken;
    if (result.modified) filesModified++;
});

console.log('\nResults for', targetFolder + ':');
console.log('  References checked:', totalRefsChecked);
console.log('  Broken links found:', brokenLinksFound);
console.log('  Files modified:', filesModified);

// Save results
const results = {
    folder: targetFolder,
    totalRefsChecked,
    brokenLinksFound,
    filesModified,
    topMissingIds: Object.entries(missingIdCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
};

fs.writeFileSync(path.join(baseDir, '_' + targetFolder + '_unverified_report.json'), JSON.stringify(results, null, 2));

console.log('\nTop missing IDs:');
results.topMissingIds.forEach(([id, count]) => console.log('  ' + id + ': ' + count + ' references'));
