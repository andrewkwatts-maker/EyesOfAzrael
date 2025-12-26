#!/usr/bin/env node

/**
 * HTML Migration Detection Script
 *
 * Scans the repository for HTML files that should be migrated to Firebase assets.
 * Creates a comprehensive backlog of files that need migration, updates, or deletion.
 *
 * Usage:
 *   node scripts/detect-html-migrations.js
 *   node scripts/detect-html-migrations.js --verbose
 *   node scripts/detect-html-migrations.js --check-firebase (requires Firebase credentials)
 */

const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const { glob } = require('glob');
const admin = require('firebase-admin');

// Command line arguments
const args = process.argv.slice(2);
const flags = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  checkFirebase: args.includes('--check-firebase'),
  skipFirebase: args.includes('--skip-firebase')
};

// Analysis results
const results = {
  infrastructure: [], // Infrastructure pages (keep as-is)
  newMigrations: [],  // Need full migration to Firebase
  updates: [],        // Firebase exists but content differs
  complete: [],       // Firebase is up-to-date, can delete HTML
  errors: [],         // Failed to analyze
  statistics: {
    totalHtml: 0,
    infrastructure: 0,
    needsMigration: 0,
    needsUpdate: 0,
    canDelete: 0,
    errors: 0
  }
};

// Firebase database reference
let db = null;

/**
 * Infrastructure pages that should NOT be migrated
 */
const INFRASTRUCTURE_PATTERNS = [
  // Root level infrastructure
  /^index\.html$/,
  /^about\.html$/,
  /^compare\.html$/,
  /^dashboard\.html$/,
  /^search.*\.html$/,
  /^login\.html$/,
  /^auth.*\.html$/,
  /^admin.*\.html$/,
  /^progress.*\.html$/,

  // Component and template directories
  /\/templates\//,
  /\/components\//,
  /\/tests?\//,
  /\/test.*\//,
  /_test\./,
  /\.test\./,

  // Index pages (category listings)
  /\/index\.html$/,

  // Corpus search pages
  /corpus-search\.html$/,

  // Special pages
  /browse\.html$/,
  /submit\.html$/,
  /view\.html$/,
  /edit\.html$/,
  /upload\.html$/,

  // FIREBASE folder (already migrated)
  /^FIREBASE\//,

  // Backup and development
  /backup/i,
  /_old/i,
  /_dev/i,
  /\.backup\./
];

/**
 * Asset type detection patterns
 */
const ASSET_TYPE_PATTERNS = {
  deity: ['/deities/', '/gods/', '/goddesses/'],
  hero: ['/heroes/', '/figures/', '/saints/', '/disciples/'],
  creature: ['/creatures/', '/beings/', '/angels/', '/demons/'],
  place: ['/places/', '/locations/', '/realms/', '/cosmology/'],
  item: ['/items/', '/artifacts/', '/relics/', '/weapons/', '/herbs/'],
  text: ['/texts/', '/scriptures/', '/books/'],
  ritual: ['/rituals/', '/ceremonies/', '/practices/'],
  concept: ['/concepts/', '/teachings/', '/theology/', '/magic/', '/symbols/'],
  event: ['/events/', '/myths/', '/stories/']
};

/**
 * Mythology detection patterns
 */
const MYTHOLOGY_PATTERNS = {
  'greek': /\/mythos\/greek\//,
  'roman': /\/mythos\/roman\//,
  'norse': /\/mythos\/norse\//,
  'egyptian': /\/mythos\/egyptian\//,
  'babylonian': /\/mythos\/babylonian\//,
  'sumerian': /\/mythos\/sumerian\//,
  'hindu': /\/mythos\/hindu\//,
  'buddhist': /\/mythos\/buddhist\//,
  'celtic': /\/mythos\/celtic\//,
  'jewish': /\/mythos\/jewish\//,
  'christian': /\/mythos\/christian\//,
  'islamic': /\/mythos\/islamic\//,
  'chinese': /\/mythos\/chinese\//,
  'japanese': /\/mythos\/japanese\//,
  'aztec': /\/mythos\/aztec\//,
  'mayan': /\/mythos\/mayan\//,
  'persian': /\/mythos\/persian\//,
  'yoruba': /\/mythos\/yoruba\//,
  'native_american': /\/mythos\/native_american\//,
  'tarot': /\/mythos\/tarot\//,
  'freemasons': /\/mythos\/freemasons\//,
  'apocryphal': /\/mythos\/apocryphal\//,
  'comparative': /\/mythos\/comparative\//,
  'archetype': /\/archetypes\//
};

/**
 * Initialize Firebase (optional)
 */
async function initializeFirebase() {
  if (flags.skipFirebase) {
    console.log('⏭️  Skipping Firebase checks (--skip-firebase flag)');
    return null;
  }

  try {
    if (admin.apps.length === 0) {
      const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    console.log('✅ Firebase initialized successfully');
    return admin.firestore();
  } catch (error) {
    console.log('⚠️  Firebase not available:', error.message);
    console.log('   Running without Firebase checks. Use --skip-firebase to suppress this warning.');
    return null;
  }
}

/**
 * Check if file is infrastructure
 */
function isInfrastructure(filePath) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');

  return INFRASTRUCTURE_PATTERNS.some(pattern => pattern.test(relativePath));
}

/**
 * Detect asset type from file path
 */
function detectAssetType(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const [assetType, patterns] of Object.entries(ASSET_TYPE_PATTERNS)) {
    if (patterns.some(pattern => normalizedPath.includes(pattern))) {
      return assetType;
    }
  }

  return null;
}

/**
 * Detect mythology from file path
 */
function detectMythology(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const [mythology, pattern] of Object.entries(MYTHOLOGY_PATTERNS)) {
    if (pattern.test(normalizedPath)) {
      return mythology;
    }
  }

  return null;
}

/**
 * Generate asset ID from file path
 */
function generateAssetId(filePath, mythology) {
  const fileName = path.basename(filePath, '.html');
  const slug = fileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return mythology ? `${mythology}-${slug}` : slug;
}

/**
 * Extract basic metadata from HTML file
 */
async function extractMetadata(filePath) {
  try {
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text() || $('h1').first().text() || '';

    // Extract meta tags
    const metaMythology = $('meta[name="mythology"]').attr('content');
    const metaEntityType = $('meta[name="entity-type"]').attr('content');
    const metaEntityId = $('meta[name="entity-id"]').attr('content');

    // Extract summary
    const summary = $('.subtitle').first().text() ||
                   $('main p').first().text().substring(0, 200) || '';

    // Count content sections
    const sectionCount = $('main section').length;
    const panelCount = $('.glass-card, .deity-card, .attribute-card').length;

    // Get file stats
    const stats = await fs.stat(filePath);

    return {
      title: title.trim(),
      metaMythology,
      metaEntityType,
      metaEntityId,
      summary: summary.trim(),
      sectionCount,
      panelCount,
      fileSize: stats.size,
      lastModified: stats.mtime
    };
  } catch (error) {
    throw new Error(`Failed to extract metadata: ${error.message}`);
  }
}

/**
 * Check if asset exists in Firebase
 */
async function checkFirebaseAsset(assetId) {
  if (!db) return null;

  try {
    const docRef = db.collection('assets').doc(assetId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { exists: false };
    }

    const data = doc.data();
    return {
      exists: true,
      name: data.name,
      assetType: data.assetType,
      mythology: data.mythology,
      panelCount: data.richContent?.panels?.length || 0,
      updatedAt: data.updatedAt || data.migratedAt || data.createdAt,
      isComplete: data.richContent?.panels?.length > 0
    };
  } catch (error) {
    console.warn(`  ⚠️  Firebase check failed for ${assetId}:`, error.message);
    return null;
  }
}

/**
 * Analyze single HTML file
 */
async function analyzeFile(filePath) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');

  if (flags.verbose) {
    console.log(`\n📄 Analyzing: ${relativePath}`);
  }

  try {
    // Check if infrastructure
    if (isInfrastructure(filePath)) {
      results.infrastructure.push({
        file: relativePath,
        reason: 'Infrastructure page (not migrateable)'
      });
      results.statistics.infrastructure++;

      if (flags.verbose) {
        console.log('  ℹ️  Infrastructure - skipping');
      }
      return;
    }

    // Detect asset type
    const assetType = detectAssetType(filePath);
    if (!assetType) {
      results.infrastructure.push({
        file: relativePath,
        reason: 'Could not determine asset type'
      });
      results.statistics.infrastructure++;

      if (flags.verbose) {
        console.log('  ℹ️  Unknown type - treating as infrastructure');
      }
      return;
    }

    // Detect mythology
    const mythology = detectMythology(filePath);
    if (!mythology) {
      results.infrastructure.push({
        file: relativePath,
        reason: 'Could not determine mythology'
      });
      results.statistics.infrastructure++;

      if (flags.verbose) {
        console.log('  ℹ️  Unknown mythology - treating as infrastructure');
      }
      return;
    }

    // Extract metadata
    const metadata = await extractMetadata(filePath);

    // Generate asset ID
    const assetId = generateAssetId(filePath, mythology);

    // Check Firebase
    let firebaseStatus = null;
    if (db && flags.checkFirebase) {
      firebaseStatus = await checkFirebaseAsset(assetId);
    }

    // Build analysis result
    const analysis = {
      file: relativePath,
      assetId,
      assetType,
      mythology,
      title: metadata.title,
      summary: metadata.summary.substring(0, 150),
      sections: metadata.sectionCount,
      fileSize: metadata.fileSize,
      lastModified: metadata.lastModified.toISOString(),
      firebase: firebaseStatus
    };

    // Categorize based on Firebase status
    if (!firebaseStatus || !firebaseStatus.exists) {
      // NEW: Needs migration
      analysis.priority = calculatePriority(metadata, assetType);
      results.newMigrations.push(analysis);
      results.statistics.needsMigration++;

      if (flags.verbose) {
        console.log(`  🆕 NEW - Priority ${analysis.priority}/10`);
      }
    } else if (!firebaseStatus.isComplete || firebaseStatus.panelCount < metadata.sectionCount) {
      // UPDATE: Firebase exists but incomplete
      analysis.priority = calculatePriority(metadata, assetType);
      analysis.firebasePanels = firebaseStatus.panelCount;
      analysis.htmlSections = metadata.sectionCount;
      results.updates.push(analysis);
      results.statistics.needsUpdate++;

      if (flags.verbose) {
        console.log(`  🔄 UPDATE - Firebase has ${firebaseStatus.panelCount} panels, HTML has ${metadata.sectionCount} sections`);
      }
    } else {
      // COMPLETE: Can potentially delete
      results.complete.push(analysis);
      results.statistics.canDelete++;

      if (flags.verbose) {
        console.log('  ✅ COMPLETE - Firebase up-to-date');
      }
    }

  } catch (error) {
    results.errors.push({
      file: relativePath,
      error: error.message
    });
    results.statistics.errors++;

    console.error(`  ❌ Error: ${error.message}`);
  }
}

/**
 * Calculate migration priority (1-10)
 */
function calculatePriority(metadata, assetType) {
  let priority = 5; // Base priority

  // Higher priority for deities and heroes
  if (assetType === 'deity') priority += 3;
  else if (assetType === 'hero') priority += 2;
  else if (assetType === 'creature') priority += 1;

  // Higher priority for content-rich pages
  if (metadata.sectionCount > 5) priority += 2;
  else if (metadata.sectionCount > 3) priority += 1;

  // Higher priority for larger files (more content)
  if (metadata.fileSize > 50000) priority += 1;

  // Cap at 10
  return Math.min(10, priority);
}

/**
 * Find all HTML files
 */
async function findAllHtmlFiles() {
  const baseDir = path.join(__dirname, '..');

  console.log('🔍 Scanning repository for HTML files...\n');

  const files = await glob('**/*.html', {
    cwd: baseDir,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/backups/**',
      '**/BACKUP_*/**',
      '**/*.backup.html',
      '**/*_old*.html',
      '**/*-old*.html',
      '**/test-*/**'
    ]
  });

  return files;
}

/**
 * Generate JSON reports
 */
async function generateReports() {
  const reportDir = path.join(__dirname, '..');

  // Full analysis report
  const fullReport = {
    generated: new Date().toISOString(),
    flags,
    statistics: results.statistics,
    infrastructure: results.infrastructure,
    newMigrations: results.newMigrations,
    updates: results.updates,
    complete: results.complete,
    errors: results.errors
  };

  await fs.writeFile(
    path.join(reportDir, 'html-migration-report.json'),
    JSON.stringify(fullReport, null, 2)
  );

  // Migration backlog (sorted by priority)
  const backlog = [
    ...results.newMigrations.sort((a, b) => b.priority - a.priority),
    ...results.updates.sort((a, b) => b.priority - a.priority)
  ];

  await fs.writeFile(
    path.join(reportDir, 'html-migration-backlog.json'),
    JSON.stringify(backlog, null, 2)
  );

  // Files safe to delete
  const deletionList = results.complete.map(item => ({
    file: item.file,
    assetId: item.assetId,
    warning: 'VERIFY IN FIREBASE BEFORE DELETION'
  }));

  await fs.writeFile(
    path.join(reportDir, 'html-files-to-delete.json'),
    JSON.stringify(deletionList, null, 2)
  );

  // Markdown summary
  const markdown = generateMarkdownReport();
  await fs.writeFile(
    path.join(reportDir, 'HTML_MIGRATION_REPORT.md'),
    markdown
  );

  console.log('\n📊 Reports generated:');
  console.log('   - html-migration-report.json (full analysis)');
  console.log('   - html-migration-backlog.json (prioritized migration list)');
  console.log('   - html-files-to-delete.json (safe to delete after verification)');
  console.log('   - HTML_MIGRATION_REPORT.md (readable summary)');
}

/**
 * Generate Markdown summary report
 */
function generateMarkdownReport() {
  const { statistics, newMigrations, updates, complete } = results;

  let md = `# HTML Migration Report

Generated: ${new Date().toLocaleString()}

## Summary Statistics

| Category | Count |
|----------|-------|
| Total HTML Files | ${statistics.totalHtml} |
| Infrastructure Pages | ${statistics.infrastructure} |
| **Needs Migration** | **${statistics.needsMigration}** |
| **Needs Update** | **${statistics.needsUpdate}** |
| Can Delete (verified) | ${statistics.canDelete} |
| Errors | ${statistics.errors} |

## Migration Status

### 🆕 New Migrations Required: ${statistics.needsMigration}

These HTML files have NO Firebase equivalent and need full migration:

`;

  // Top 20 new migrations
  const topNew = newMigrations.slice(0, 20);
  if (topNew.length > 0) {
    md += '| Priority | File | Type | Mythology | Sections |\n';
    md += '|----------|------|------|-----------|----------|\n';
    topNew.forEach(item => {
      md += `| ${item.priority}/10 | \`${item.file}\` | ${item.assetType} | ${item.mythology} | ${item.sections} |\n`;
    });

    if (newMigrations.length > 20) {
      md += `\n*... and ${newMigrations.length - 20} more files*\n`;
    }
  }

  md += `\n### 🔄 Updates Required: ${statistics.needsUpdate}

These HTML files have Firebase assets but content differs or is incomplete:

`;

  // Top 20 updates
  const topUpdates = updates.slice(0, 20);
  if (topUpdates.length > 0) {
    md += '| Priority | File | Firebase Panels | HTML Sections |\n';
    md += '|----------|------|-----------------|---------------|\n';
    topUpdates.forEach(item => {
      md += `| ${item.priority}/10 | \`${item.file}\` | ${item.firebasePanels || 0} | ${item.htmlSections} |\n`;
    });

    if (updates.length > 20) {
      md += `\n*... and ${updates.length - 20} more files*\n`;
    }
  }

  md += `\n### ✅ Complete (can delete): ${statistics.canDelete}

These HTML files have complete Firebase equivalents and may be safe to delete after verification:

`;

  // List complete files
  const topComplete = complete.slice(0, 30);
  if (topComplete.length > 0) {
    md += '| File | Asset ID | Type |\n';
    md += '|------|----------|------|\n';
    topComplete.forEach(item => {
      md += `| \`${item.file}\` | ${item.assetId} | ${item.assetType} |\n`;
    });

    if (complete.length > 30) {
      md += `\n*... and ${complete.length - 30} more files*\n`;
    }
  }

  md += `\n## Breakdown by Asset Type

`;

  // Count by asset type
  const byType = {};
  [...newMigrations, ...updates].forEach(item => {
    byType[item.assetType] = (byType[item.assetType] || 0) + 1;
  });

  md += '| Type | Count |\n';
  md += '|------|-------|\n';
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      md += `| ${type} | ${count} |\n`;
    });

  md += `\n## Breakdown by Mythology

`;

  // Count by mythology
  const byMythology = {};
  [...newMigrations, ...updates].forEach(item => {
    byMythology[item.mythology] = (byMythology[item.mythology] || 0) + 1;
  });

  md += '| Mythology | Count |\n';
  md += '|-----------|-------|\n';
  Object.entries(byMythology)
    .sort((a, b) => b[1] - a[1])
    .forEach(([mythology, count]) => {
      md += `| ${mythology} | ${count} |\n`;
    });

  if (results.errors.length > 0) {
    md += `\n## ⚠️ Errors (${results.errors.length})

`;
    results.errors.slice(0, 20).forEach(err => {
      md += `- **${err.file}**: ${err.error}\n`;
    });

    if (results.errors.length > 20) {
      md += `\n*... and ${results.errors.length - 20} more errors*\n`;
    }
  }

  md += `\n## Next Steps

1. **Review** \`html-migration-backlog.json\` for prioritized migration list
2. **Run migration** on high-priority files first (priority 8-10)
3. **Verify** Firebase assets are complete before deleting HTML files
4. **Update** any incomplete Firebase assets
5. **Clean up** HTML files once Firebase migration is confirmed

## Notes

${flags.checkFirebase ? '- Firebase checks were performed ✅' : '- Firebase checks were skipped (use --check-firebase to enable)'}
- Infrastructure pages are excluded from migration
- Priority is calculated based on asset type and content richness
- Always verify in Firebase before deleting HTML files

---
*Generated by detect-html-migrations.js*
`;

  return md;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 HTML Migration Detection Script\n');
  console.log('=' .repeat(60));

  // Initialize Firebase if requested
  if (flags.checkFirebase) {
    db = await initializeFirebase();
  }

  // Find all HTML files
  const files = await findAllHtmlFiles();
  results.statistics.totalHtml = files.length;

  console.log(`Found ${files.length} HTML files\n`);
  console.log('=' .repeat(60));

  // Analyze each file
  console.log('\nAnalyzing files...\n');

  let processed = 0;
  for (const file of files) {
    await analyzeFile(file);
    processed++;

    if (!flags.verbose && processed % 50 === 0) {
      console.log(`Progress: ${processed}/${files.length}`);
    }
  }

  // Generate reports
  console.log('\n' + '='.repeat(60));
  console.log('📊 Analysis Complete\n');
  console.log(`Total HTML Files:     ${results.statistics.totalHtml}`);
  console.log(`Infrastructure:       ${results.statistics.infrastructure}`);
  console.log(`Needs Migration:      ${results.statistics.needsMigration}`);
  console.log(`Needs Update:         ${results.statistics.needsUpdate}`);
  console.log(`Can Delete:           ${results.statistics.canDelete}`);
  console.log(`Errors:               ${results.statistics.errors}`);
  console.log('='.repeat(60));

  await generateReports();

  console.log('\n✅ Detection complete!\n');

  // Close Firebase
  if (db) {
    await admin.app().delete();
  }
}

// Run
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
