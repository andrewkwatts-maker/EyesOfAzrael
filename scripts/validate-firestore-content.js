#!/usr/bin/env node

/**
 * Firestore Content Validation Script
 *
 * Validates that all local HTML content exists in Firestore
 * and generates a comprehensive diff report.
 *
 * Usage: node scripts/validate-firestore-content.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Initialize Firebase Admin
const serviceAccount = require('../FIREBASE/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

// Content type configurations
const CONTENT_TYPES = {
  deities: {
    directory: 'deities',
    firestoreCollection: 'deities',
    singularName: 'deity',
    pluralName: 'deities'
  },
  heroes: {
    directory: 'heroes',
    firestoreCollection: 'heroes',
    singularName: 'hero',
    pluralName: 'heroes'
  },
  creatures: {
    directory: 'creatures',
    firestoreCollection: 'creatures',
    singularName: 'creature',
    pluralName: 'creatures'
  },
  cosmology: {
    directory: 'cosmology',
    firestoreCollection: 'cosmology',
    singularName: 'cosmology concept',
    pluralName: 'cosmology'
  },
  texts: {
    directory: 'texts',
    firestoreCollection: 'texts',
    singularName: 'text',
    pluralName: 'texts'
  },
  herbs: {
    directory: 'herbs',
    firestoreCollection: 'herbs',
    singularName: 'herb',
    pluralName: 'herbs'
  },
  rituals: {
    directory: 'rituals',
    firestoreCollection: 'rituals',
    singularName: 'ritual',
    pluralName: 'rituals'
  },
  symbols: {
    directory: 'symbols',
    firestoreCollection: 'symbols',
    singularName: 'symbol',
    pluralName: 'symbols'
  },
  concepts: {
    directory: 'concepts',
    firestoreCollection: 'concepts',
    singularName: 'concept',
    pluralName: 'concepts'
  },
  myths: {
    directory: 'myths',
    firestoreCollection: 'myths',
    singularName: 'myth',
    pluralName: 'myths'
  },
  magic: {
    directory: 'magic',
    firestoreCollection: 'magic',
    singularName: 'magic practice',
    pluralName: 'magic'
  },
  angels: {
    directory: 'angels',
    firestoreCollection: 'angels',
    singularName: 'angel',
    pluralName: 'angels'
  },
  figures: {
    directory: 'figures',
    firestoreCollection: 'figures',
    singularName: 'figure',
    pluralName: 'figures'
  }
};

// Mythology directories to scan
const MYTHOLOGIES = [
  'apocryphal', 'aztec', 'babylonian', 'buddhist', 'celtic', 'chinese',
  'christian', 'egyptian', 'greek', 'hindu', 'islamic', 'japanese',
  'jewish', 'mayan', 'norse', 'persian', 'roman', 'sumerian', 'tarot'
];

/**
 * Extract metadata from HTML file
 */
function extractMetadata(htmlPath, mythology, contentType) {
  try {
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const $ = cheerio.load(html);

    // Extract title - try multiple selectors
    let title = $('title').text().trim();

    // Remove mythology prefix from title (e.g., "Babylonian - Marduk" -> "Marduk")
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      title = parts.length > 1 ? parts[1] : parts[0];
    }

    // If no title from <title>, try h1
    if (!title || title === '') {
      title = $('h1').first().text().trim();
    }

    // Extract name from filename if title still empty
    if (!title || title === '') {
      const fileName = path.basename(htmlPath, '.html');
      title = fileName.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }

    // Extract description from first paragraph or meta description
    let description = $('meta[name="description"]').attr('content') || '';
    if (!description) {
      description = $('main p').first().text().trim().substring(0, 200);
    }

    // Extract icon/emoji if present
    const icon = $('h1 .deity-icon').text().trim() ||
                 $('h1').first().text().match(/^[\p{Emoji}]/u)?.[0] || '';

    return {
      title: title || 'Unknown',
      mythology,
      contentType,
      description,
      icon,
      filePath: htmlPath,
      fileName: path.basename(htmlPath)
    };
  } catch (error) {
    console.warn(`Warning: Could not parse ${htmlPath}: ${error.message}`);
    return null;
  }
}

/**
 * Scan local content files
 */
async function scanLocalContent() {
  console.log('🔍 Scanning local content files...\n');

  const localContent = {
    byType: {},
    byMythology: {},
    total: 0
  };

  // Initialize structures
  Object.keys(CONTENT_TYPES).forEach(type => {
    localContent.byType[type] = [];
  });

  MYTHOLOGIES.forEach(mythology => {
    localContent.byMythology[mythology] = {};
    Object.keys(CONTENT_TYPES).forEach(type => {
      localContent.byMythology[mythology][type] = [];
    });
  });

  // Scan each mythology directory
  for (const mythology of MYTHOLOGIES) {
    const mythologyPath = path.join(__dirname, '..', 'mythos', mythology);

    if (!fs.existsSync(mythologyPath)) {
      continue;
    }

    // Scan each content type
    for (const [typeKey, typeConfig] of Object.entries(CONTENT_TYPES)) {
      const contentPath = path.join(mythologyPath, typeConfig.directory);

      if (!fs.existsSync(contentPath)) {
        continue;
      }

      // Read all HTML files in this directory
      const files = fs.readdirSync(contentPath)
        .filter(file => file.endsWith('.html') && file !== 'index.html');

      for (const file of files) {
        const filePath = path.join(contentPath, file);
        const metadata = extractMetadata(filePath, mythology, typeKey);

        if (metadata) {
          localContent.byType[typeKey].push(metadata);
          localContent.byMythology[mythology][typeKey].push(metadata);
          localContent.total++;

          console.log(`  ✓ ${mythology}/${typeKey}/${file} - "${metadata.title}"`);
        }
      }
    }
  }

  console.log(`\n✅ Scanned ${localContent.total} local content files\n`);
  return localContent;
}

/**
 * Query Firestore for all content
 */
async function queryFirestoreContent() {
  console.log('🔍 Querying Firestore content...\n');

  const firestoreContent = {
    byType: {},
    byMythology: {},
    total: 0,
    collections: []
  };

  // Initialize structures
  Object.keys(CONTENT_TYPES).forEach(type => {
    firestoreContent.byType[type] = [];
  });

  MYTHOLOGIES.forEach(mythology => {
    firestoreContent.byMythology[mythology] = {};
    Object.keys(CONTENT_TYPES).forEach(type => {
      firestoreContent.byMythology[mythology][type] = [];
    });
  });

  try {
    // Get all collections
    const collections = await db.listCollections();
    console.log(`Found ${collections.length} Firestore collections`);

    for (const collection of collections) {
      const collectionName = collection.id;
      firestoreContent.collections.push(collectionName);

      console.log(`\n  Querying collection: ${collectionName}`);

      const snapshot = await collection.get();
      console.log(`  Found ${snapshot.size} documents`);

      snapshot.forEach(doc => {
        const data = doc.data();

        // Determine content type and mythology
        const contentType = data.contentType || data.type || collectionName;
        const mythology = data.mythology || data.mythologyId || 'unknown';

        const firestoreDoc = {
          id: doc.id,
          title: data.name || data.title || doc.id,
          mythology,
          contentType,
          description: data.description || '',
          collection: collectionName,
          data
        };

        // Add to appropriate buckets
        if (firestoreContent.byType[contentType]) {
          firestoreContent.byType[contentType].push(firestoreDoc);
        }

        if (firestoreContent.byMythology[mythology]) {
          if (!firestoreContent.byMythology[mythology][contentType]) {
            firestoreContent.byMythology[mythology][contentType] = [];
          }
          firestoreContent.byMythology[mythology][contentType].push(firestoreDoc);
        }

        firestoreContent.total++;
      });
    }

    console.log(`\n✅ Retrieved ${firestoreContent.total} Firestore documents\n`);
  } catch (error) {
    console.error('❌ Error querying Firestore:', error);
    throw error;
  }

  return firestoreContent;
}

/**
 * Compare local and Firestore content
 */
function compareContent(localContent, firestoreContent) {
  console.log('🔍 Comparing local and Firestore content...\n');

  const comparison = {
    missingInFirestore: [],
    extraInFirestore: [],
    matching: [],
    metadataMismatches: [],
    byMythology: {},
    byType: {}
  };

  // Compare by content type
  for (const [typeKey, typeConfig] of Object.entries(CONTENT_TYPES)) {
    const localItems = localContent.byType[typeKey] || [];
    const firestoreItems = firestoreContent.byType[typeKey] || [];

    comparison.byType[typeKey] = {
      local: localItems.length,
      firestore: firestoreItems.length,
      missing: 0,
      extra: 0,
      matching: 0
    };

    // Check for missing items (in local but not in Firestore)
    for (const localItem of localItems) {
      const normalizedLocalTitle = localItem.title.toLowerCase().trim();

      const firestoreMatch = firestoreItems.find(fsItem => {
        const normalizedFsTitle = fsItem.title.toLowerCase().trim();
        return normalizedFsTitle === normalizedLocalTitle &&
               fsItem.mythology.toLowerCase() === localItem.mythology.toLowerCase();
      });

      if (!firestoreMatch) {
        comparison.missingInFirestore.push({
          ...localItem,
          type: typeKey
        });
        comparison.byType[typeKey].missing++;
      } else {
        comparison.matching.push({
          local: localItem,
          firestore: firestoreMatch,
          type: typeKey
        });
        comparison.byType[typeKey].matching++;

        // Check for metadata mismatches
        if (localItem.description !== firestoreMatch.description) {
          comparison.metadataMismatches.push({
            title: localItem.title,
            mythology: localItem.mythology,
            type: typeKey,
            field: 'description',
            local: localItem.description,
            firestore: firestoreMatch.description
          });
        }
      }
    }

    // Check for extra items (in Firestore but not in local)
    for (const fsItem of firestoreItems) {
      const normalizedFsTitle = fsItem.title.toLowerCase().trim();

      const localMatch = localItems.find(localItem => {
        const normalizedLocalTitle = localItem.title.toLowerCase().trim();
        return normalizedLocalTitle === normalizedFsTitle &&
               localItem.mythology.toLowerCase() === fsItem.mythology.toLowerCase();
      });

      if (!localMatch) {
        comparison.extraInFirestore.push({
          ...fsItem,
          type: typeKey
        });
        comparison.byType[typeKey].extra++;
      }
    }
  }

  // Compare by mythology
  for (const mythology of MYTHOLOGIES) {
    const localMythology = localContent.byMythology[mythology];
    const firestoreMythology = firestoreContent.byMythology[mythology];

    let localTotal = 0;
    let firestoreTotal = 0;

    Object.keys(CONTENT_TYPES).forEach(type => {
      localTotal += (localMythology[type] || []).length;
      firestoreTotal += (firestoreMythology[type] || []).length;
    });

    comparison.byMythology[mythology] = {
      local: localTotal,
      firestore: firestoreTotal,
      missing: comparison.missingInFirestore.filter(item => item.mythology === mythology).length,
      extra: comparison.extraInFirestore.filter(item => item.mythology === mythology).length
    };
  }

  console.log('✅ Comparison complete\n');
  return comparison;
}

/**
 * Validate content quality
 */
function validateQuality(localContent, firestoreContent) {
  const validation = {
    missingCriticalFields: [],
    missingMythology: [],
    missingContentType: [],
    missingName: [],
    emptyDescriptions: [],
    qualityScores: {}
  };

  // Validate Firestore documents
  for (const [typeKey, items] of Object.entries(firestoreContent.byType)) {
    for (const item of items) {
      const doc = item.data;
      const score = {
        id: item.id,
        title: item.title,
        mythology: item.mythology,
        type: typeKey,
        score: 100,
        issues: []
      };

      // Check critical fields
      if (!doc.mythology && !doc.mythologyId) {
        validation.missingMythology.push(item);
        score.issues.push('Missing mythology field');
        score.score -= 30;
      }

      if (!doc.contentType && !doc.type) {
        validation.missingContentType.push(item);
        score.issues.push('Missing contentType field');
        score.score -= 30;
      }

      if (!doc.name && !doc.title) {
        validation.missingName.push(item);
        score.issues.push('Missing name/title field');
        score.score -= 40;
      }

      if (!doc.description || doc.description.length < 20) {
        validation.emptyDescriptions.push(item);
        score.issues.push('Description missing or too short');
        score.score -= 20;
      }

      if (!doc.searchIndex) {
        score.issues.push('Missing search index');
        score.score -= 10;
      }

      if (!doc.version) {
        score.issues.push('Missing version number');
        score.score -= 5;
      }

      validation.qualityScores[item.id] = score;
    }
  }

  return validation;
}

/**
 * Generate markdown report
 */
function generateReport(localContent, firestoreContent, comparison, validation) {
  let report = `# Firestore Content Validation Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `---\n\n`;

  // Executive Summary
  report += `## Executive Summary\n\n`;

  const totalMissing = comparison.missingInFirestore.length;
  const totalExtra = comparison.extraInFirestore.length;
  const totalMatching = comparison.matching.length;
  const completeness = localContent.total > 0
    ? ((totalMatching / localContent.total) * 100).toFixed(2)
    : 0;

  const validationStatus = totalMissing === 0 &&
    validation.missingCriticalFields.length === 0
    ? '✅ PASS' : '❌ FAIL';

  report += `### Validation Status: ${validationStatus}\n\n`;

  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| **Local Content Files** | ${localContent.total} |\n`;
  report += `| **Firestore Documents** | ${firestoreContent.total} |\n`;
  report += `| **Matching Content** | ${totalMatching} |\n`;
  report += `| **Missing in Firestore** | ${totalMissing} |\n`;
  report += `| **Extra in Firestore** | ${totalExtra} |\n`;
  report += `| **Metadata Mismatches** | ${comparison.metadataMismatches.length} |\n`;
  report += `| **Completeness** | ${completeness}% |\n\n`;

  report += `### Quality Metrics\n\n`;
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| **Missing Mythology Field** | ${validation.missingMythology.length} |\n`;
  report += `| **Missing ContentType Field** | ${validation.missingContentType.length} |\n`;
  report += `| **Missing Name/Title Field** | ${validation.missingName.length} |\n`;
  report += `| **Empty/Short Descriptions** | ${validation.emptyDescriptions.length} |\n\n`;

  const avgScore = Object.values(validation.qualityScores)
    .reduce((sum, item) => sum + item.score, 0) /
    Math.max(Object.values(validation.qualityScores).length, 1);

  report += `**Average Quality Score:** ${avgScore.toFixed(2)}/100\n\n`;

  report += `---\n\n`;

  // Content by Mythology
  report += `## 1. Content Distribution by Mythology\n\n`;
  report += `| Mythology | Local Files | Firestore Docs | Missing | Extra | Status |\n`;
  report += `|-----------|-------------|----------------|---------|-------|--------|\n`;

  for (const mythology of MYTHOLOGIES) {
    const stats = comparison.byMythology[mythology];
    const status = stats.missing === 0 ? '✅' : '⚠️';
    report += `| **${mythology}** | ${stats.local} | ${stats.firestore} | ${stats.missing} | ${stats.extra} | ${status} |\n`;
  }

  report += `\n---\n\n`;

  // Content by Type
  report += `## 2. Content Distribution by Type\n\n`;
  report += `| Content Type | Local Files | Firestore Docs | Missing | Extra | Matching | Status |\n`;
  report += `|--------------|-------------|----------------|---------|-------|----------|--------|\n`;

  for (const [typeKey, typeConfig] of Object.entries(CONTENT_TYPES)) {
    const stats = comparison.byType[typeKey];
    const status = stats.missing === 0 ? '✅' : '⚠️';
    report += `| **${typeConfig.pluralName}** | ${stats.local} | ${stats.firestore} | ${stats.missing} | ${stats.extra} | ${stats.matching} | ${status} |\n`;
  }

  report += `\n---\n\n`;

  // Missing Content
  report += `## 3. Content Missing in Firestore\n\n`;

  if (totalMissing === 0) {
    report += `✅ **No missing content!** All local files exist in Firestore.\n\n`;
  } else {
    report += `❌ **${totalMissing} files** found locally but NOT in Firestore:\n\n`;

    // Group by mythology
    const missingByMythology = {};
    comparison.missingInFirestore.forEach(item => {
      if (!missingByMythology[item.mythology]) {
        missingByMythology[item.mythology] = {};
      }
      if (!missingByMythology[item.mythology][item.type]) {
        missingByMythology[item.mythology][item.type] = [];
      }
      missingByMythology[item.mythology][item.type].push(item);
    });

    for (const mythology of Object.keys(missingByMythology).sort()) {
      report += `### ${mythology}\n\n`;

      for (const type of Object.keys(missingByMythology[mythology]).sort()) {
        const items = missingByMythology[mythology][type];
        report += `#### ${CONTENT_TYPES[type].pluralName} (${items.length})\n\n`;

        items.forEach(item => {
          report += `- **${item.title}**\n`;
          report += `  - File: \`${item.fileName}\`\n`;
          report += `  - Path: \`${item.filePath}\`\n`;
          if (item.description) {
            report += `  - Description: ${item.description.substring(0, 100)}...\n`;
          }
        });

        report += `\n`;
      }
    }
  }

  report += `---\n\n`;

  // Extra Content
  report += `## 4. Content in Firestore but NOT in Local Files\n\n`;

  if (totalExtra === 0) {
    report += `✅ **No extra content!** All Firestore documents have corresponding local files.\n\n`;
  } else {
    report += `⚠️ **${totalExtra} documents** found in Firestore but NOT in local files:\n\n`;

    // Group by mythology
    const extraByMythology = {};
    comparison.extraInFirestore.forEach(item => {
      if (!extraByMythology[item.mythology]) {
        extraByMythology[item.mythology] = {};
      }
      if (!extraByMythology[item.mythology][item.type]) {
        extraByMythology[item.mythology][item.type] = [];
      }
      extraByMythology[item.mythology][item.type].push(item);
    });

    for (const mythology of Object.keys(extraByMythology).sort()) {
      report += `### ${mythology}\n\n`;

      for (const type of Object.keys(extraByMythology[mythology]).sort()) {
        const items = extraByMythology[mythology][type];
        report += `#### ${CONTENT_TYPES[type]?.pluralName || type} (${items.length})\n\n`;

        items.forEach(item => {
          report += `- **${item.title}** (ID: \`${item.id}\`)\n`;
          report += `  - Collection: \`${item.collection}\`\n`;
          if (item.description) {
            report += `  - Description: ${item.description.substring(0, 100)}...\n`;
          }
        });

        report += `\n`;
      }
    }
  }

  report += `---\n\n`;

  // Metadata Mismatches
  report += `## 5. Metadata Mismatches\n\n`;

  if (comparison.metadataMismatches.length === 0) {
    report += `✅ **No metadata mismatches!**\n\n`;
  } else {
    report += `⚠️ Found ${comparison.metadataMismatches.length} metadata mismatches:\n\n`;

    comparison.metadataMismatches.forEach(mismatch => {
      report += `### ${mismatch.title} (${mismatch.mythology})\n\n`;
      report += `- **Field:** ${mismatch.field}\n`;
      report += `- **Local:** ${mismatch.local.substring(0, 100)}...\n`;
      report += `- **Firestore:** ${mismatch.firestore.substring(0, 100)}...\n\n`;
    });
  }

  report += `---\n\n`;

  // Quality Issues
  report += `## 6. Quality Validation Issues\n\n`;

  if (validation.missingMythology.length > 0) {
    report += `### Missing Mythology Field (${validation.missingMythology.length})\n\n`;
    validation.missingMythology.slice(0, 20).forEach(item => {
      report += `- **${item.title}** (ID: \`${item.id}\`, Collection: \`${item.collection}\`)\n`;
    });
    if (validation.missingMythology.length > 20) {
      report += `\n... and ${validation.missingMythology.length - 20} more\n`;
    }
    report += `\n`;
  }

  if (validation.missingContentType.length > 0) {
    report += `### Missing ContentType Field (${validation.missingContentType.length})\n\n`;
    validation.missingContentType.slice(0, 20).forEach(item => {
      report += `- **${item.title}** (ID: \`${item.id}\`, Collection: \`${item.collection}\`)\n`;
    });
    if (validation.missingContentType.length > 20) {
      report += `\n... and ${validation.missingContentType.length - 20} more\n`;
    }
    report += `\n`;
  }

  if (validation.emptyDescriptions.length > 0) {
    report += `### Empty or Short Descriptions (${validation.emptyDescriptions.length})\n\n`;
    validation.emptyDescriptions.slice(0, 20).forEach(item => {
      report += `- **${item.title}** (${item.mythology})\n`;
    });
    if (validation.emptyDescriptions.length > 20) {
      report += `\n... and ${validation.emptyDescriptions.length - 20} more\n`;
    }
    report += `\n`;
  }

  report += `---\n\n`;

  // Quality Scores
  report += `## 7. Quality Scores\n\n`;

  const lowScores = Object.values(validation.qualityScores)
    .filter(item => item.score < 80)
    .sort((a, b) => a.score - b.score);

  if (lowScores.length > 0) {
    report += `### Documents with Quality Score < 80 (${lowScores.length})\n\n`;

    lowScores.slice(0, 30).forEach(item => {
      report += `#### ${item.title} (${item.mythology}) - Score: ${item.score}/100\n\n`;
      report += `**Issues:**\n`;
      item.issues.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += `\n`;
    });

    if (lowScores.length > 30) {
      report += `\n... and ${lowScores.length - 30} more\n\n`;
    }
  } else {
    report += `✅ **All documents have quality score >= 80!**\n\n`;
  }

  report += `---\n\n`;

  // Action Items
  report += `## 8. Action Items\n\n`;

  if (totalMissing > 0) {
    report += `### 🔴 HIGH PRIORITY\n\n`;
    report += `1. **Upload ${totalMissing} missing files to Firestore**\n`;
    report += `   - See section 3 for complete list\n`;
    report += `   - Use migration script to upload missing content\n\n`;
  }

  if (validation.missingCriticalFields.length > 0) {
    report += `2. **Fix ${validation.missingCriticalFields.length} documents with missing critical fields**\n`;
    report += `   - Add required fields: mythology, contentType, name\n\n`;
  }

  if (totalExtra > 0) {
    report += `### 🟡 MEDIUM PRIORITY\n\n`;
    report += `3. **Review ${totalExtra} extra Firestore documents**\n`;
    report += `   - Either create local HTML files or remove from Firestore\n`;
    report += `   - See section 4 for complete list\n\n`;
  }

  if (validation.emptyDescriptions.length > 0) {
    report += `4. **Add descriptions to ${validation.emptyDescriptions.length} documents**\n`;
    report += `   - Improve search and user experience\n\n`;
  }

  if (comparison.metadataMismatches.length > 0) {
    report += `### 🟢 LOW PRIORITY\n\n`;
    report += `5. **Sync ${comparison.metadataMismatches.length} metadata mismatches**\n`;
    report += `   - Decide which is canonical (local or Firestore)\n`;
    report += `   - Update accordingly\n\n`;
  }

  if (totalMissing === 0 && validation.missingCriticalFields.length === 0) {
    report += `### ✅ NO ACTION REQUIRED\n\n`;
    report += `All local content exists in Firestore and all critical fields are present!\n\n`;
  }

  report += `---\n\n`;

  // Firestore Collections
  report += `## 9. Firestore Collections\n\n`;
  report += `Found ${firestoreContent.collections.length} collections:\n\n`;
  firestoreContent.collections.forEach(collection => {
    report += `- \`${collection}\`\n`;
  });

  report += `\n---\n\n`;
  report += `*End of Validation Report*\n`;

  return report;
}

/**
 * Main validation function
 */
async function validateFirestoreContent() {
  console.log('\n🚀 Starting Firestore Content Validation...\n');
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // Step 1: Scan local content
    const localContent = await scanLocalContent();

    // Step 2: Query Firestore
    const firestoreContent = await queryFirestoreContent();

    // Step 3: Compare
    const comparison = compareContent(localContent, firestoreContent);

    // Step 4: Validate quality
    const validation = validateQuality(localContent, firestoreContent);

    // Step 5: Generate report
    console.log('📝 Generating validation report...\n');
    const report = generateReport(localContent, firestoreContent, comparison, validation);

    // Step 6: Save report
    const reportPath = path.join(__dirname, '..', 'FIRESTORE_VALIDATION_REPORT.md');
    fs.writeFileSync(reportPath, report);

    console.log('='.repeat(60));
    console.log('\n✅ Validation complete!\n');
    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Print summary
    console.log('📊 SUMMARY:\n');
    console.log(`   Local Files:         ${localContent.total}`);
    console.log(`   Firestore Documents: ${firestoreContent.total}`);
    console.log(`   Matching:            ${comparison.matching.length}`);
    console.log(`   Missing in Firestore: ${comparison.missingInFirestore.length}`);
    console.log(`   Extra in Firestore:   ${comparison.extraInFirestore.length}`);

    const avgScore = Object.values(validation.qualityScores)
      .reduce((sum, item) => sum + item.score, 0) /
      Math.max(Object.values(validation.qualityScores).length, 1);

    console.log(`   Avg Quality Score:    ${avgScore.toFixed(2)}/100`);

    const completeness = localContent.total > 0
      ? ((comparison.matching.length / localContent.total) * 100).toFixed(2)
      : 0;

    console.log(`   Completeness:         ${completeness}%`);

    const status = comparison.missingInFirestore.length === 0 ? '✅ PASS' : '❌ FAIL';
    console.log(`\n   Status: ${status}\n`);

    console.log('='.repeat(60));
    console.log('\n');

    process.exit(comparison.missingInFirestore.length === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Check if cheerio is installed
try {
  require.resolve('cheerio');
} catch (e) {
  console.error('❌ Missing dependency: cheerio');
  console.error('Please install it with: npm install cheerio');
  process.exit(1);
}

// Run validation
validateFirestoreContent();
