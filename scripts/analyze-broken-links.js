/**
 * Analyze broken link patterns to understand how to fix them
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, 'reports', 'connection-validation-report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

// Analyze broken link patterns
const patterns = {
    containsRelationship: [],
    textInsteadOfId: [],
    validLooking: [],
    other: []
};

const relationshipWords = ['mother', 'father', 'sister', 'brother', 'wife', 'husband', 'son', 'daughter', 'half-', 'through', 'consort'];
const descriptionIndicators = ['none', 'various', 'prominently', 'named', 'mythology', 'associated', 'connected', 'related', 'unknown', 'unclear'];

report.brokenLinks.forEach(link => {
    const id = link.targetId || '';
    const name = link.targetName || '';

    if (relationshipWords.some(w => id.toLowerCase().includes(w))) {
        patterns.containsRelationship.push({ id, name, source: link.assetId, field: link.field });
    }
    else if (descriptionIndicators.some(w => id.toLowerCase().includes(w)) || id.length > 40) {
        patterns.textInsteadOfId.push({ id, name, source: link.assetId, field: link.field });
    }
    else if (id.match(/^[a-z][a-z0-9_-]+$/i) && id.length < 40) {
        patterns.validLooking.push({ id, name, source: link.assetId, field: link.field });
    }
    else {
        patterns.other.push({ id, name, source: link.assetId, field: link.field });
    }
});

console.log('=== Broken Link Pattern Analysis ===\n');
console.log('Total broken links:', report.brokenLinks.length, '\n');

console.log('Contains relationship words:', patterns.containsRelationship.length);
patterns.containsRelationship.slice(0, 8).forEach(p => {
    console.log('   ', p.id, 'from', p.source);
});

console.log('\nText instead of ID:', patterns.textInsteadOfId.length);
patterns.textInsteadOfId.slice(0, 8).forEach(p => {
    console.log('   ', p.id, 'from', p.source);
});

console.log('\nValid looking IDs:', patterns.validLooking.length);
patterns.validLooking.slice(0, 15).forEach(p => {
    console.log('   ', p.id, 'from', p.source);
});

console.log('\nOther patterns:', patterns.other.length);
patterns.other.slice(0, 8).forEach(p => {
    console.log('   ', p.id, 'from', p.source);
});

// Count by source asset
const bySource = {};
report.brokenLinks.forEach(link => {
    bySource[link.assetId] = (bySource[link.assetId] || 0) + 1;
});

const topSources = Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

console.log('\n=== Assets with most broken links ===');
topSources.forEach(([id, count]) => {
    console.log(' ', id + ':', count, 'broken links');
});

// Save patterns
fs.writeFileSync(
    path.join(__dirname, 'reports', 'broken-link-patterns.json'),
    JSON.stringify({
        summary: {
            total: report.brokenLinks.length,
            containsRelationship: patterns.containsRelationship.length,
            textInsteadOfId: patterns.textInsteadOfId.length,
            validLooking: patterns.validLooking.length,
            other: patterns.other.length
        },
        containsRelationship: patterns.containsRelationship,
        textInsteadOfId: patterns.textInsteadOfId,
        validLooking: patterns.validLooking,
        other: patterns.other
    }, null, 2)
);

console.log('\nPatterns saved to scripts/reports/broken-link-patterns.json');
