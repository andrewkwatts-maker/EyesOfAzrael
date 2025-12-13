const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, 'reports', 'hindu-migration-report-2025-12-13T08-42-42.json');
const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const minimal = [];
const complete = [];
const redirects = [];

for (const [cat, entities] of Object.entries(data.entities)) {
    entities.forEach(e => {
        const issues = [];

        if (!e.description || e.description.length < 50) {
            issues.push('short_description');
        }

        if (e.myths.length === 0) {
            issues.push('no_myths');
        }

        if (Object.keys(e.attributes).length === 0) {
            issues.push('no_attributes');
        }

        if (Object.keys(e.relationships).length === 0) {
            issues.push('no_relationships');
        }

        if (Object.keys(e.worship).length === 0) {
            issues.push('no_worship_info');
        }

        if (e.name.includes('Redirecting')) {
            redirects.push({name: e.name, category: cat, file: e.metadata.sourceFile});
        } else if (issues.length > 0) {
            minimal.push({name: e.name, category: cat, issues});
        } else {
            complete.push({name: e.name, category: cat});
        }
    });
}

console.log('='.repeat(60));
console.log('HINDU CONTENT ANALYSIS');
console.log('='.repeat(60));
console.log(`\nComplete entities: ${complete.length}`);
console.log(`Entities needing enrichment: ${minimal.length}`);
console.log(`Redirect files: ${redirects.length}`);

console.log('\n' + '-'.repeat(60));
console.log('COMPLETE ENTITIES (Ready for Firebase):');
console.log('-'.repeat(60));
complete.forEach(e => console.log(`  ✓ ${e.name} (${e.category})`));

console.log('\n' + '-'.repeat(60));
console.log('ENTITIES NEEDING ENRICHMENT:');
console.log('-'.repeat(60));
minimal.forEach(e => {
    console.log(`  ⚠️  ${e.name} (${e.category})`);
    console.log(`      Issues: ${e.issues.join(', ')}`);
});

if (redirects.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('REDIRECT FILES (Need cleanup):');
    console.log('-'.repeat(60));
    redirects.forEach(r => {
        console.log(`  ⭕ ${r.name} (${r.category})`);
        console.log(`      File: ${path.basename(r.file)}`);
    });
}

// Save analysis
const analysis = {
    summary: {
        complete: complete.length,
        needsEnrichment: minimal.length,
        redirects: redirects.length,
        total: data.summary.totalEntities
    },
    complete,
    needsEnrichment: minimal,
    redirectFiles: redirects
};

const outputPath = path.join(__dirname, 'reports', 'hindu-content-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
console.log(`\n✅ Analysis saved to: ${outputPath}`);
