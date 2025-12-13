#!/usr/bin/env node

/**
 * CELTIC MIGRATION VERIFICATION SCRIPT
 *
 * This script verifies that all Celtic content has been properly migrated
 * and generates a comprehensive report.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

// Expected Celtic content from old repository
const expectedContent = {
  deities: [
    'aengus', 'brigid', 'cernunnos', 'dagda', 'danu',
    'lugh', 'manannan', 'morrigan', 'nuada', 'ogma'
  ],
  cosmology: ['creation', 'afterlife'],
  // Other entity types exist in index files but don't have individual pages
  heroes: [],
  creatures: [],
  texts: [],
  symbols: [],
  herbs: [],
  rituals: [],
  magic: [],
  figures: []
};

const report = {
  timestamp: new Date().toISOString(),
  summary: {},
  details: {},
  missing: {},
  extra: {},
  completeness: {}
};

async function verifyCollection(collectionName, expectedIds) {
  console.log(`\n📋 Verifying ${collectionName}...`);

  try {
    const snapshot = await db.collection(collectionName)
      .where('mythology', '==', 'celtic')
      .get();

    const foundIds = [];
    const entities = [];

    snapshot.forEach(doc => {
      foundIds.push(doc.id);
      entities.push({
        id: doc.id,
        ...doc.data()
      });
    });

    const missing = expectedIds.filter(id => !foundIds.includes(id));
    const extra = foundIds.filter(id => !expectedIds.includes(id));

    console.log(`  Found: ${foundIds.length} ${collectionName}`);
    console.log(`  Expected: ${expectedIds.length} ${collectionName}`);
    console.log(`  Missing: ${missing.length}`);
    console.log(`  Extra: ${extra.length}`);

    report.summary[collectionName] = {
      found: foundIds.length,
      expected: expectedIds.length,
      missing: missing.length,
      extra: extra.length
    };

    report.details[collectionName] = entities;
    report.missing[collectionName] = missing;
    report.extra[collectionName] = extra;

    // Check completeness of each entity
    const completenessScores = [];
    for (const entity of entities) {
      const score = calculateCompletenessScore(entity);
      completenessScores.push({
        id: entity.id,
        name: entity.name || entity.displayName,
        score: score.percentage,
        issues: score.issues
      });
    }

    report.completeness[collectionName] = completenessScores;

    return {
      found: foundIds.length,
      expected: expectedIds.length,
      missing,
      extra,
      entities
    };

  } catch (error) {
    console.error(`  ❌ Error verifying ${collectionName}:`, error.message);
    report.summary[collectionName] = { error: error.message };
    return null;
  }
}

function calculateCompletenessScore(entity) {
  const issues = [];
  let score = 0;
  const maxScore = 100;

  // Required fields (40 points)
  if (entity.name) score += 10; else issues.push('Missing name');
  if (entity.displayName) score += 10; else issues.push('Missing displayName');
  if (entity.description && entity.description.length > 50) score += 20;
  else if (entity.description) {
    score += 10;
    issues.push('Description too short');
  } else {
    issues.push('Missing description');
  }

  // Important fields (30 points)
  if (entity.domains && entity.domains.length > 0) score += 10;
  else issues.push('Missing domains');

  if (entity.symbols && entity.symbols.length > 0) score += 10;
  else issues.push('Missing symbols');

  if (entity.archetypes && entity.archetypes.length > 0) score += 10;
  else issues.push('Missing archetypes');

  // Nice to have fields (30 points)
  if (entity.alternateNames && entity.alternateNames.length > 0) score += 5;
  if (entity.epithets && entity.epithets.length > 0) score += 5;
  if (entity.relationships && Object.keys(entity.relationships).length > 0) score += 5;
  if (entity.colors) score += 5;
  if (entity.element) score += 5;
  if (entity.icon) score += 5;

  return {
    score,
    percentage: Math.round((score / maxScore) * 100),
    issues
  };
}

async function generateReport() {
  console.log('🚀 CELTIC MIGRATION VERIFICATION');
  console.log('='.repeat(80));

  // Verify each collection
  for (const [collectionName, expectedIds] of Object.entries(expectedContent)) {
    if (expectedIds.length === 0 && collectionName !== 'deities') {
      console.log(`\n⏭️  Skipping ${collectionName} (no expected content)`);
      continue;
    }
    await verifyCollection(collectionName, expectedIds);
  }

  // Calculate overall statistics
  const totalExpected = Object.values(expectedContent).reduce((sum, arr) => sum + arr.length, 0);
  const totalFound = Object.values(report.summary).reduce((sum, s) => sum + (s.found || 0), 0);
  const totalMissing = Object.values(report.summary).reduce((sum, s) => sum + (s.missing || 0), 0);

  report.overallSummary = {
    totalExpected,
    totalFound,
    totalMissing,
    completionPercentage: Math.round((totalFound / totalExpected) * 100)
  };

  // Save report
  const reportPath = path.join(__dirname, '..', 'celtic_migration', 'VERIFICATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate markdown report
  const mdReport = generateMarkdownReport();
  const mdReportPath = path.join(__dirname, '..', 'celtic_migration', 'VERIFICATION_REPORT.md');
  fs.writeFileSync(mdReportPath, mdReport);

  console.log('\n' + '='.repeat(80));
  console.log('✅ VERIFICATION COMPLETE');
  console.log('='.repeat(80));
  console.log(`\nOverall Completion: ${report.overallSummary.completionPercentage}%`);
  console.log(`Total Found: ${totalFound}/${totalExpected}`);
  console.log(`Total Missing: ${totalMissing}`);
  console.log(`\n📄 Reports saved:`);
  console.log(`   - ${reportPath}`);
  console.log(`   - ${mdReportPath}`);

  process.exit(0);
}

function generateMarkdownReport() {
  const { overallSummary, summary, completeness, missing, extra } = report;

  let md = `# CELTIC MYTHOLOGY MIGRATION VERIFICATION REPORT

**Generated:** ${report.timestamp}
**Overall Completion:** ${overallSummary.completionPercentage}%

## Executive Summary

- **Total Expected Entities:** ${overallSummary.totalExpected}
- **Total Found in Firebase:** ${overallSummary.totalFound}
- **Total Missing:** ${overallSummary.totalMissing}
- **Completion Rate:** ${overallSummary.completionPercentage}%

## Status by Collection

| Collection | Expected | Found | Missing | Extra | Status |
|------------|----------|-------|---------|-------|--------|
`;

  for (const [name, stats] of Object.entries(summary)) {
    if (stats.error) {
      md += `| ${name} | - | - | - | - | ❌ Error |\n`;
    } else {
      const status = stats.missing === 0 ? '✅' : stats.missing > 0 ? '⚠️' : '✅';
      md += `| ${name} | ${stats.expected} | ${stats.found} | ${stats.missing} | ${stats.extra} | ${status} |\n`;
    }
  }

  md += `\n## Deities - Completeness Analysis\n\n`;

  if (completeness.deities && completeness.deities.length > 0) {
    md += `| Deity | Completeness | Issues |\n|-------|--------------|--------|\n`;

    for (const deity of completeness.deities) {
      const status = deity.score >= 90 ? '🟢' : deity.score >= 70 ? '🟡' : '🔴';
      const issuesStr = deity.issues.length > 0 ? deity.issues.join(', ') : 'None';
      md += `| ${deity.name} | ${status} ${deity.score}% | ${issuesStr} |\n`;
    }
  }

  md += `\n## Missing Entities\n\n`;
  for (const [collection, items] of Object.entries(missing)) {
    if (items.length > 0) {
      md += `### ${collection}\n\n`;
      items.forEach(item => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }
  }

  if (Object.values(missing).every(arr => arr.length === 0)) {
    md += `✅ No missing entities detected!\n\n`;
  }

  md += `## Extra Entities (Not in Old Repository)\n\n`;
  for (const [collection, items] of Object.entries(extra)) {
    if (items.length > 0) {
      md += `### ${collection}\n\n`;
      items.forEach(item => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }
  }

  if (Object.values(extra).every(arr => arr.length === 0)) {
    md += `No extra entities found.\n\n`;
  }

  md += `## Recommendations

1. **Missing Content:** ${overallSummary.totalMissing === 0 ? '✅ All expected content has been migrated' : `⚠️ ${overallSummary.totalMissing} entities still need to be migrated`}
2. **Data Quality:** ${completeness.deities ? `Average deity completeness: ${Math.round(completeness.deities.reduce((sum, d) => sum + d.score, 0) / completeness.deities.length)}%` : 'N/A'}
3. **Next Steps:**
   - Review entities with completeness scores below 70%
   - Add missing metadata fields (icons, colors, elements)
   - Expand relationship data
   - Create search index entries for all entities
   - Add cross-references to other mythologies

## Data Quality Details

### Deities with Issues

`;

  if (completeness.deities) {
    const deitiesWithIssues = completeness.deities.filter(d => d.issues.length > 0);

    if (deitiesWithIssues.length > 0) {
      deitiesWithIssues.forEach(deity => {
        md += `#### ${deity.name} (${deity.score}%)\n\n`;
        deity.issues.forEach(issue => {
          md += `- ${issue}\n`;
        });
        md += `\n`;
      });
    } else {
      md += `✅ All deities have complete data!\n\n`;
    }
  }

  md += `---

**Verification Script:** verify-celtic-migration.js
**Database:** Firebase Firestore (eyesofazrael)
`;

  return md;
}

// Run verification
if (require.main === module) {
  generateReport().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyCollection, calculateCompletenessScore };
