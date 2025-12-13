#!/usr/bin/env node

/**
 * Compare Local vs Firestore Content
 *
 * This script compares all local HTML content with Firestore database
 * to ensure everything has been migrated before deleting local files.
 *
 * Usage: node scripts/compare-local-vs-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../FIREBASE/firebase-service-account.json');
const MYTHOS_DIR = path.join(__dirname, '../mythos');
const OUTPUT_REPORT = path.join(__dirname, '../LOCAL_VS_FIRESTORE_DIFF.md');

// Initialize Firebase Admin
let db;
try {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  console.log('✓ Firebase Admin initialized\n');
} catch (error) {
  console.error('✗ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

// Content types and their collection mappings
const CONTENT_TYPES = {
  'deities': 'deities',
  'heroes': 'heroes',
  'creatures': 'creatures',
  'cosmology': 'cosmology',
  'texts': 'texts',
  'herbs': 'herbs',
  'rituals': 'rituals',
  'symbols': 'symbols',
  'concepts': 'concepts',
  'myths': 'myths',
  'events': 'events'
};

/**
 * Scan local mythology directories for HTML files
 */
async function scanLocalContent() {
  console.log('📁 Scanning local content...\n');

  const localContent = {
    byType: {},
    byMythology: {},
    total: 0
  };

  // Initialize counters
  Object.keys(CONTENT_TYPES).forEach(type => {
    localContent.byType[type] = [];
  });

  // Scan each mythology directory
  const mythologies = fs.readdirSync(MYTHOS_DIR).filter(dir => {
    const fullPath = path.join(MYTHOS_DIR, dir);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const mythology of mythologies) {
    const mythologyPath = path.join(MYTHOS_DIR, mythology);
    localContent.byMythology[mythology] = {
      total: 0,
      byType: {}
    };

    // Scan each content type directory
    for (const [dirName, collectionName] of Object.entries(CONTENT_TYPES)) {
      const contentPath = path.join(mythologyPath, dirName);

      if (!fs.existsSync(contentPath)) {
        continue;
      }

      const files = fs.readdirSync(contentPath).filter(f =>
        f.endsWith('.html') && f !== 'index.html'
      );

      files.forEach(file => {
        const filePath = path.join(contentPath, file);
        const fileName = file.replace('.html', '');
        const id = `${mythology}_${fileName}`;

        const item = {
          id,
          mythology,
          contentType: collectionName.slice(0, -1), // singular
          fileName,
          filePath,
          title: extractTitle(filePath)
        };

        localContent.byType[dirName].push(item);

        if (!localContent.byMythology[mythology].byType[dirName]) {
          localContent.byMythology[mythology].byType[dirName] = [];
        }
        localContent.byMythology[mythology].byType[dirName].push(item);

        localContent.byMythology[mythology].total++;
        localContent.total++;
      });
    }
  }

  return localContent;
}

/**
 * Extract title from HTML file
 */
function extractTitle(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const titleElement = dom.window.document.querySelector('h1, h2, title');
    return titleElement ? titleElement.textContent.trim() : 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Query all content from Firestore
 */
async function queryFirestoreContent() {
  console.log('☁️  Querying Firestore content...\n');

  const firestoreContent = {
    byType: {},
    byMythology: {},
    total: 0
  };

  // Query each collection
  for (const [dirName, collectionName] of Object.entries(CONTENT_TYPES)) {
    try {
      const snapshot = await db.collection(collectionName).get();

      firestoreContent.byType[dirName] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const mythology = data.mythology || 'unknown';

        firestoreContent.byType[dirName].push({
          id: doc.id,
          mythology,
          contentType: data.contentType,
          name: data.name,
          displayName: data.displayName
        });

        // Group by mythology
        if (!firestoreContent.byMythology[mythology]) {
          firestoreContent.byMythology[mythology] = {
            total: 0,
            byType: {}
          };
        }

        if (!firestoreContent.byMythology[mythology].byType[dirName]) {
          firestoreContent.byMythology[mythology].byType[dirName] = [];
        }

        firestoreContent.byMythology[mythology].byType[dirName].push({
          id: doc.id,
          name: data.name
        });

        firestoreContent.byMythology[mythology].total++;
        firestoreContent.total++;
      });

      console.log(`  ✓ ${collectionName}: ${snapshot.size} documents`);
    } catch (error) {
      console.error(`  ✗ Error querying ${collectionName}:`, error.message);
    }
  }

  console.log();
  return firestoreContent;
}

/**
 * Compare local and Firestore content
 */
function compareContent(localContent, firestoreContent) {
  console.log('🔍 Comparing content...\n');

  const comparison = {
    summary: {
      localTotal: localContent.total,
      firestoreTotal: firestoreContent.total,
      inLocalOnly: [],
      inFirestoreOnly: [],
      inBoth: []
    },
    byType: {},
    byMythology: {}
  };

  // Compare by content type
  for (const dirName of Object.keys(CONTENT_TYPES)) {
    const localItems = localContent.byType[dirName] || [];
    const firestoreItems = firestoreContent.byType[dirName] || [];

    const localIds = new Set(localItems.map(i => i.id));
    const firestoreIds = new Set(firestoreItems.map(i => i.id));

    const onlyLocal = localItems.filter(i => !firestoreIds.has(i.id));
    const onlyFirestore = firestoreItems.filter(i => !localIds.has(i.id));
    const inBoth = localItems.filter(i => firestoreIds.has(i.id));

    comparison.byType[dirName] = {
      local: localItems.length,
      firestore: firestoreItems.length,
      onlyLocal: onlyLocal.length,
      onlyFirestore: onlyFirestore.length,
      inBoth: inBoth.length,
      onlyLocalItems: onlyLocal,
      onlyFirestoreItems: onlyFirestore
    };

    comparison.summary.inLocalOnly.push(...onlyLocal);
    comparison.summary.inFirestoreOnly.push(...onlyFirestore);
    comparison.summary.inBoth.push(...inBoth);
  }

  return comparison;
}

/**
 * Generate markdown report
 */
function generateReport(comparison, localContent, firestoreContent) {
  console.log('📝 Generating report...\n');

  let report = `# Local vs Firestore Content Comparison

**Generated:** ${new Date().toISOString()}

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total Local Files** | ${comparison.summary.localTotal} |
| **Total Firestore Docs** | ${comparison.summary.firestoreTotal} |
| **In Both** | ${comparison.summary.inBoth.length} |
| **Only in Local** | ${comparison.summary.inLocalOnly.length} |
| **Only in Firestore** | ${comparison.summary.inFirestoreOnly.length} |

`;

  if (comparison.summary.inLocalOnly.length === 0 &&
      comparison.summary.inFirestoreOnly.length === 0) {
    report += `\n✅ **VALIDATION PASSED** - All local content is in Firestore!\n\n`;
  } else {
    report += `\n⚠️ **VALIDATION WARNING** - Discrepancies found!\n\n`;
  }

  // By content type
  report += `## Comparison by Content Type\n\n`;
  report += `| Content Type | Local | Firestore | Only Local | Only Firestore | In Both |\n`;
  report += `|--------------|-------|-----------|------------|----------------|----------|\n`;

  for (const [type, data] of Object.entries(comparison.byType)) {
    report += `| ${type} | ${data.local} | ${data.firestore} | ${data.onlyLocal} | ${data.onlyFirestore} | ${data.inBoth} |\n`;
  }

  // Missing from Firestore
  if (comparison.summary.inLocalOnly.length > 0) {
    report += `\n## ⚠️ Content in Local but NOT in Firestore (${comparison.summary.inLocalOnly.length})\n\n`;

    const byType = {};
    comparison.summary.inLocalOnly.forEach(item => {
      if (!byType[item.contentType]) byType[item.contentType] = [];
      byType[item.contentType].push(item);
    });

    for (const [type, items] of Object.entries(byType)) {
      report += `### ${type} (${items.length})\n\n`;
      items.forEach(item => {
        report += `- **${item.id}** - ${item.title} (${item.mythology})\n`;
        report += `  - File: \`${item.filePath}\`\n`;
      });
      report += `\n`;
    }
  }

  // Extra in Firestore
  if (comparison.summary.inFirestoreOnly.length > 0) {
    report += `\n## ℹ️ Content in Firestore but NOT in Local (${comparison.summary.inFirestoreOnly.length})\n\n`;
    report += `These may be from previous uploads or Phase 2 content.\n\n`;

    const byType = {};
    comparison.summary.inFirestoreOnly.forEach(item => {
      if (!byType[item.contentType]) byType[item.contentType] = [];
      byType[item.contentType].push(item);
    });

    for (const [type, items] of Object.entries(byType)) {
      report += `### ${type} (${items.length})\n\n`;
      items.slice(0, 10).forEach(item => {
        report += `- **${item.id}** - ${item.name || item.displayName} (${item.mythology})\n`;
      });
      if (items.length > 10) {
        report += `- ... and ${items.length - 10} more\n`;
      }
      report += `\n`;
    }
  }

  // By mythology
  report += `\n## Comparison by Mythology\n\n`;
  report += `| Mythology | Local Files | Firestore Docs |\n`;
  report += `|-----------|-------------|----------------|\n`;

  const allMythologies = new Set([
    ...Object.keys(localContent.byMythology),
    ...Object.keys(firestoreContent.byMythology)
  ]);

  for (const mythology of Array.from(allMythologies).sort()) {
    const localCount = localContent.byMythology[mythology]?.total || 0;
    const firestoreCount = firestoreContent.byMythology[mythology]?.total || 0;
    report += `| ${mythology} | ${localCount} | ${firestoreCount} |\n`;
  }

  // Recommendations
  report += `\n## Recommendations\n\n`;

  if (comparison.summary.inLocalOnly.length > 0) {
    report += `⚠️ **Action Required:**\n`;
    report += `- ${comparison.summary.inLocalOnly.length} local files are NOT in Firestore\n`;
    report += `- Upload these files before deleting local content\n`;
    report += `- Use migration scripts to upload missing content\n\n`;
  } else {
    report += `✅ **Safe to Proceed:**\n`;
    report += `- All local content is in Firestore\n`;
    report += `- Safe to delete local HTML files after final verification\n\n`;
  }

  if (comparison.summary.inFirestoreOnly.length > 0) {
    report += `ℹ️ **Additional Content in Firestore:**\n`;
    report += `- ${comparison.summary.inFirestoreOnly.length} documents in Firestore have no local source\n`;
    report += `- These may be from Phase 2 migrations (heroes, texts, etc.)\n`;
    report += `- Verify these are intentional before proceeding\n\n`;
  }

  report += `---\n\n`;
  report += `**Next Steps:**\n`;
  report += `1. Review this report carefully\n`;
  report += `2. Upload any missing content to Firestore\n`;
  report += `3. Re-run this script to verify\n`;
  report += `4. Only proceed with file deletion when validation passes\n`;

  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Local vs Firestore Content Comparison');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Scan local content
    const localContent = await scanLocalContent();
    console.log(`✓ Found ${localContent.total} local files\n`);

    // Query Firestore
    const firestoreContent = await queryFirestoreContent();
    console.log(`✓ Found ${firestoreContent.total} Firestore documents\n`);

    // Compare
    const comparison = compareContent(localContent, firestoreContent);

    // Generate report
    const report = generateReport(comparison, localContent, firestoreContent);

    // Save report
    fs.writeFileSync(OUTPUT_REPORT, report);
    console.log(`✓ Report saved: ${OUTPUT_REPORT}\n`);

    // Print summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Summary');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Local Files:        ${comparison.summary.localTotal}`);
    console.log(`Firestore Docs:     ${comparison.summary.firestoreTotal}`);
    console.log(`In Both:            ${comparison.summary.inBoth.length}`);
    console.log(`Only in Local:      ${comparison.summary.inLocalOnly.length}`);
    console.log(`Only in Firestore:  ${comparison.summary.inFirestoreOnly.length}\n`);

    if (comparison.summary.inLocalOnly.length === 0) {
      console.log('✅ VALIDATION PASSED - All local content is in Firestore!\n');
      process.exit(0);
    } else {
      console.log('⚠️  VALIDATION WARNING - Some local content is missing from Firestore!\n');
      console.log(`See ${OUTPUT_REPORT} for details.\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
