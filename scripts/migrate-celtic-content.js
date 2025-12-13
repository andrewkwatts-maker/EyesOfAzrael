#!/usr/bin/env node

/**
 * CELTIC MYTHOLOGY MIGRATION SCRIPT
 *
 * This script extracts all Celtic mythology content from the old repository
 * and prepares it for Firebase migration.
 *
 * It will:
 * 1. Scan all HTML files in the old Celtic directory
 * 2. Extract deity, hero, creature, and other entity data
 * 3. Transform data into Firebase-compatible JSON format
 * 4. Upload to Firebase with proper metadata
 * 5. Generate a comprehensive migration report
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Configuration
const OLD_CELTIC_DIR = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael\\mythos\\celtic';
const OUTPUT_DIR = path.join(__dirname, '..', 'celtic_migration');
const SERVICE_ACCOUNT_FILE = 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json';

// Initialize Firebase Admin
let db;
try {
  const serviceAccount = require(`../${SERVICE_ACCOUNT_FILE}`);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'eyesofazrael'
  });
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.warn('⚠️  Could not initialize Firebase Admin:', error.message);
  console.log('   Will save data locally only');
}

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Migration statistics
const stats = {
  scannedFiles: 0,
  deities: 0,
  heroes: 0,
  creatures: 0,
  cosmology: 0,
  texts: 0,
  symbols: 0,
  herbs: 0,
  rituals: 0,
  magic: 0,
  figures: 0,
  errors: [],
  warnings: []
};

// Entity collections
const entities = {
  deities: [],
  heroes: [],
  creatures: [],
  cosmology: [],
  texts: [],
  symbols: [],
  herbs: [],
  rituals: [],
  magic: [],
  figures: []
};

/**
 * Parse HTML content to extract deity information
 */
function parseDeityHTML(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    stats.scannedFiles++;

    // Extract deity ID from filename
    const deityId = fileName.replace('.html', '');

    // Skip index files
    if (deityId === 'index') return null;

    console.log(`  Parsing deity: ${deityId}`);

    // Extract title
    const titleMatch = content.match(/<title>Celtic - ([^<]+)<\/title>/);
    const name = titleMatch ? titleMatch[1].trim() : deityId;

    // Extract main description from deity-header section
    const headerMatch = content.match(/<section class="deity-header">([\s\S]*?)<\/section>/);
    let description = '';
    let displayName = name;
    let subtitle = '';
    let alternateNames = [];

    if (headerMatch) {
      const headerContent = headerMatch[1];

      // Extract display name with alternate names
      const nameMatch = headerContent.match(/<h2>.*?([^<(]+)(?:\(([^)]+)\))?<\/h2>/);
      if (nameMatch) {
        displayName = nameMatch[1].replace(/🔥/g, '').trim();
        if (nameMatch[2]) {
          alternateNames = nameMatch[2].split(',').map(n => n.trim());
        }
      }

      // Extract subtitle
      const subtitleMatch = headerContent.match(/<p class="subtitle"[^>]*>([^<]+)<\/p>/);
      if (subtitleMatch) {
        subtitle = subtitleMatch[1].trim();
      }

      // Extract main description
      const descMatch = headerContent.match(/<p[^>]*>((?:(?!<\/p>).)*)<\/p>\s*<\/section>/s);
      if (descMatch) {
        description = descMatch[1]
          .replace(/<a[^>]*>/g, '')
          .replace(/<\/a>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    // Extract domains
    const domainsMatch = content.match(/<div class="attribute-label">Domains<\/div>\s*<div class="attribute-value">([^<]+)<\/div>/);
    const domains = domainsMatch
      ? domainsMatch[1].split(',').map(d => d.trim().toLowerCase())
      : [];

    // Extract symbols
    const symbolsMatch = content.match(/<div class="attribute-label">Symbols<\/div>\s*<div class="attribute-value">([^<]+)<\/div>/);
    const symbols = symbolsMatch
      ? symbolsMatch[1].split(',').map(s => s.trim())
      : [];

    // Extract archetypes (infer from subtitle and domains)
    const archetypes = inferArchetypes(subtitle, domains);

    // Extract relationships
    const relationships = {};
    const parentMatch = content.match(/daughter of <a[^>]*>([^<]+)<\/a>/i) ||
                       content.match(/son of <a[^>]*>([^<]+)<\/a>/i);
    if (parentMatch) {
      relationships.parent = parentMatch[1].toLowerCase().replace(/\s+/g, '-');
    }

    // Extract epithets from titles
    const titlesMatch = content.match(/<div class="attribute-label">Titles<\/div>\s*<div class="attribute-value">([^<]+)<\/div>/);
    const epithets = titlesMatch
      ? titlesMatch[1].split(',').map(t => t.trim())
      : [];

    // Create deity object
    const deity = {
      id: deityId,
      name: displayName,
      displayName: displayName,
      alternateNames: alternateNames,
      mythology: 'celtic',
      category: 'deity',
      description: description,
      subtitle: subtitle,
      domains: domains,
      symbols: symbols,
      archetypes: archetypes,
      epithets: epithets,
      relationships: relationships,
      metadata: {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'celtic_migration',
        source: 'old_repository_html',
        verified: false,
        submissionType: 'system',
        migrationDate: new Date().toISOString(),
        originalFile: filePath
      }
    };

    stats.deities++;
    return deity;

  } catch (error) {
    stats.errors.push({
      file: filePath,
      error: error.message
    });
    console.error(`  ❌ Error parsing ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Infer archetypes from deity information
 */
function inferArchetypes(subtitle, domains) {
  const archetypes = [];
  const subtitleLower = subtitle.toLowerCase();
  const domainsStr = domains.join(' ').toLowerCase();

  // Define archetype patterns
  const patterns = {
    'fire-deity': ['fire', 'flame', 'hearth'],
    'triple-goddess': ['triple', 'three'],
    'mother-goddess': ['mother', 'fertility', 'childbirth'],
    'sky-father': ['sky', 'thunder', 'storm', 'king'],
    'sun-deity': ['sun', 'light', 'solar'],
    'warrior-god': ['war', 'battle', 'warrior'],
    'trickster': ['trickster', 'mischief', 'cunning'],
    'death-deity': ['death', 'underworld', 'afterlife'],
    'sea-deity': ['sea', 'ocean', 'water'],
    'earth-mother': ['earth', 'land', 'nature'],
    'craft-deity': ['craft', 'smithing', 'forge'],
    'wisdom-deity': ['wisdom', 'knowledge', 'poetry'],
    'healing-deity': ['healing', 'medicine', 'health']
  };

  for (const [archetype, keywords] of Object.entries(patterns)) {
    const found = keywords.some(keyword =>
      subtitleLower.includes(keyword) || domainsStr.includes(keyword)
    );
    if (found) {
      archetypes.push({
        category: archetype,
        score: 15,
        inferred: true
      });
    }
  }

  return archetypes;
}

/**
 * Parse index files to extract entity lists
 */
function parseIndexHTML(filePath, entityType) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    stats.scannedFiles++;

    console.log(`  Parsing ${entityType} index`);

    // Extract all links that might be entities
    const linkPattern = /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    const entities = [];
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
      const href = match[1];
      const text = match[2];

      // Skip navigation links
      if (href.includes('../') || href.includes('index.html')) continue;

      // Extract entity info from the content around the link
      entities.push({
        name: text.trim(),
        href: href
      });
    }

    return entities;

  } catch (error) {
    stats.errors.push({
      file: filePath,
      error: error.message
    });
    console.error(`  ❌ Error parsing ${entityType} index:`, error.message);
    return [];
  }
}

/**
 * Scan directory for all HTML files
 */
function scanDirectory(dirPath, entityType) {
  console.log(`\n📂 Scanning ${entityType} directory...`);

  try {
    const files = fs.readdirSync(dirPath);
    const htmlFiles = files.filter(f => f.endsWith('.html') && !f.endsWith('.bak'));

    console.log(`  Found ${htmlFiles.length} HTML files`);

    for (const file of htmlFiles) {
      const filePath = path.join(dirPath, file);

      if (entityType === 'deities') {
        const deity = parseDeityHTML(filePath, file);
        if (deity) {
          entities.deities.push(deity);
        }
      } else if (file === 'index.html') {
        const indexEntities = parseIndexHTML(filePath, entityType);
        stats[entityType] += indexEntities.length;

        // Store basic info for index-only entities
        entities[entityType] = indexEntities.map(e => ({
          id: e.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          name: e.name,
          mythology: 'celtic',
          category: entityType,
          metadata: {
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: 'celtic_migration',
            source: 'old_repository_index',
            verified: false,
            submissionType: 'system',
            migrationDate: new Date().toISOString(),
            needsExpansion: true
          }
        }));
      }
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`  ℹ️  Directory not found: ${dirPath}`);
    } else {
      stats.errors.push({
        directory: dirPath,
        error: error.message
      });
      console.error(`  ❌ Error scanning directory:`, error.message);
    }
  }
}

/**
 * Upload entities to Firebase
 */
async function uploadToFirebase() {
  if (!db) {
    console.log('\n⚠️  Firebase not initialized, skipping upload');
    return;
  }

  console.log('\n📤 Uploading to Firebase...');

  try {
    // Upload deities
    if (entities.deities.length > 0) {
      console.log(`\n  Uploading ${entities.deities.length} deities...`);
      const batch = db.batch();

      for (const deity of entities.deities) {
        const docRef = db.collection('deities').doc(deity.id);

        // Check if deity already exists
        const existing = await docRef.get();
        if (existing.exists) {
          console.log(`    ℹ️  Deity ${deity.id} already exists, merging...`);
          batch.update(docRef, {
            ...deity,
            metadata: {
              ...existing.data().metadata,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              celticMigrationDate: new Date().toISOString()
            }
          });
        } else {
          batch.set(docRef, deity);
        }
      }

      await batch.commit();
      console.log(`  ✅ Uploaded ${entities.deities.length} deities`);
    }

    // Upload other entity types
    for (const [entityType, entityList] of Object.entries(entities)) {
      if (entityType === 'deities' || entityList.length === 0) continue;

      console.log(`\n  Uploading ${entityList.length} ${entityType}...`);
      const batch = db.batch();

      for (const entity of entityList) {
        const docRef = db.collection(entityType).doc(entity.id);
        batch.set(docRef, entity, { merge: true });
      }

      await batch.commit();
      console.log(`  ✅ Uploaded ${entityList.length} ${entityType}`);
    }

  } catch (error) {
    console.error('\n❌ Firebase upload error:', error.message);
    stats.errors.push({
      stage: 'firebase_upload',
      error: error.message
    });
  }
}

/**
 * Save entities to local JSON files
 */
function saveToLocal() {
  console.log('\n💾 Saving to local files...');

  try {
    // Save each entity type
    for (const [entityType, entityList] of Object.entries(entities)) {
      if (entityList.length === 0) continue;

      const filePath = path.join(OUTPUT_DIR, `${entityType}.json`);
      fs.writeFileSync(filePath, JSON.stringify(entityList, null, 2));
      console.log(`  ✅ Saved ${entityList.length} ${entityType} to ${filePath}`);
    }

    // Save all entities in one file
    const allEntitiesPath = path.join(OUTPUT_DIR, 'all_celtic_entities.json');
    fs.writeFileSync(allEntitiesPath, JSON.stringify(entities, null, 2));
    console.log(`  ✅ Saved all entities to ${allEntitiesPath}`);

  } catch (error) {
    console.error('\n❌ Local save error:', error.message);
    stats.errors.push({
      stage: 'local_save',
      error: error.message
    });
  }
}

/**
 * Generate migration report
 */
function generateReport() {
  console.log('\n📊 Generating migration report...');

  const totalEntities = Object.values(entities).reduce((sum, list) => sum + list.length, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    oldRepository: OLD_CELTIC_DIR,
    statistics: {
      scannedFiles: stats.scannedFiles,
      totalEntities: totalEntities,
      deities: entities.deities.length,
      heroes: entities.heroes.length,
      creatures: entities.creatures.length,
      cosmology: entities.cosmology.length,
      texts: entities.texts.length,
      symbols: entities.symbols.length,
      herbs: entities.herbs.length,
      rituals: entities.rituals.length,
      magic: entities.magic.length,
      figures: entities.figures.length,
      errors: stats.errors.length,
      warnings: stats.warnings.length
    },
    entities: entities,
    errors: stats.errors,
    warnings: stats.warnings
  };

  const reportPath = path.join(OUTPUT_DIR, 'MIGRATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate markdown report
  const mdReport = `# CELTIC MYTHOLOGY MIGRATION REPORT

**Generated:** ${new Date().toISOString()}
**Old Repository:** ${OLD_CELTIC_DIR}

## Summary

This report documents the migration of Celtic mythology content from the old repository to Firebase.

## Statistics

- **Files Scanned:** ${stats.scannedFiles}
- **Total Entities:** ${totalEntities}

### Entities by Type

- **Deities:** ${entities.deities.length}
- **Heroes:** ${entities.heroes.length}
- **Creatures:** ${entities.creatures.length}
- **Cosmology:** ${entities.cosmology.length}
- **Texts:** ${entities.texts.length}
- **Symbols:** ${entities.symbols.length}
- **Herbs:** ${entities.herbs.length}
- **Rituals:** ${entities.rituals.length}
- **Magic:** ${entities.magic.length}
- **Figures:** ${entities.figures.length}

## Deities Migrated

${entities.deities.map(d => `- **${d.displayName}** (${d.id})
  - Subtitle: ${d.subtitle}
  - Domains: ${d.domains.join(', ')}
  - Archetypes: ${d.archetypes.map(a => a.category).join(', ')}
`).join('\n')}

## Issues

### Errors: ${stats.errors.length}

${stats.errors.map((e, i) => `${i + 1}. ${e.file || e.directory || e.stage}: ${e.error}`).join('\n')}

### Warnings: ${stats.warnings.length}

${stats.warnings.map((w, i) => `${i + 1}. ${w.message}`).join('\n')}

## Next Steps

1. Review migrated entities in Firebase Console
2. Expand stub entries that only have index data
3. Add missing metadata (icons, colors, elements)
4. Verify relationships between entities
5. Add cross-references to other mythologies
6. Create search index entries

## Files Generated

- \`${OUTPUT_DIR}/deities.json\` - All deity entities
- \`${OUTPUT_DIR}/all_celtic_entities.json\` - All entities combined
- \`${OUTPUT_DIR}/MIGRATION_REPORT.json\` - This report in JSON format
- \`${OUTPUT_DIR}/MIGRATION_REPORT.md\` - This report

---

**Migration Script:** migrate-celtic-content.js
`;

  const mdReportPath = path.join(OUTPUT_DIR, 'MIGRATION_REPORT.md');
  fs.writeFileSync(mdReportPath, mdReport);

  console.log(`\n✅ Reports saved:`);
  console.log(`   - ${reportPath}`);
  console.log(`   - ${mdReportPath}`);
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 CELTIC MYTHOLOGY MIGRATION');
  console.log('='.repeat(80));
  console.log(`Old Repository: ${OLD_CELTIC_DIR}`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log('='.repeat(80));

  // Scan all entity directories
  scanDirectory(path.join(OLD_CELTIC_DIR, 'deities'), 'deities');
  scanDirectory(path.join(OLD_CELTIC_DIR, 'heroes'), 'heroes');
  scanDirectory(path.join(OLD_CELTIC_DIR, 'creatures'), 'creatures');
  scanDirectory(path.join(OLD_CELTIC_DIR, 'cosmology'), 'cosmology');
  scanDirectory(path.join(OLD_CELTIC_DIR, 'texts'), 'texts');
  scanDirectory(path.join(OLD_CELTIC_DIR, 'symbols'), 'symbols');
  scanDirectory(path.join(OLD_CELTIC_DIR, 'herbs'), 'herbs');
  scanDirectory(path.join(OLD_CELTIC_DIR, 'rituals'), 'rituals');
  scanDirectory(path.join(OLD_CELTIC_DIR, 'magic'), 'magic');
  scanDirectory(path.join(OLD_CELTIC_DIR, 'figures'), 'figures');

  // Save locally
  saveToLocal();

  // Upload to Firebase
  await uploadToFirebase();

  // Generate report
  generateReport();

  console.log('\n' + '='.repeat(80));
  console.log('✅ MIGRATION COMPLETE!');
  console.log('='.repeat(80));
  console.log(`\nTotal entities migrated: ${Object.values(entities).reduce((sum, list) => sum + list.length, 0)}`);
  console.log(`Errors encountered: ${stats.errors.length}`);

  if (db) {
    process.exit(0);
  }
}

// Run migration
if (require.main === module) {
  runMigration().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };
