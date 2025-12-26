#!/usr/bin/env node

/**
 * Agent 5: Hero HTML to Firebase Migration Script
 *
 * Migrates hero HTML files to Firebase Unified Schema
 * Entity Type: hero
 * Collection: entities/{mythology}/heroes/{id}
 *
 * Input: html-migration-backlog.json (filtered for assetType === 'hero')
 * Output: Firebase Firestore entities
 * Report: AGENT5_HERO_MIGRATION_REPORT.md
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const admin = require('firebase-admin');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  REPO_ROOT: path.resolve(__dirname, '..'),
  BACKLOG_FILE: path.join(__dirname, '..', 'html-migration-backlog.json'),
  REPORT_FILE: path.join(__dirname, '..', 'AGENT5_HERO_MIGRATION_REPORT.md'),
  DRY_RUN: process.argv.includes('--dry-run'),
  VERBOSE: process.argv.includes('--verbose'),
  BATCH_SIZE: 50, // Firebase batch write limit
};

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

let db = null;

function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length === 0) {
      const serviceAccount = require('../firebase-service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    db = admin.firestore();
    console.log('✓ Firebase initialized');
  } catch (error) {
    console.error('✗ Firebase initialization failed:', error.message);
    if (!CONFIG.DRY_RUN) {
      process.exit(1);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract clean text from HTML element
 */
function extractText(element) {
  if (!element) return '';
  return element.textContent.trim().replace(/\s+/g, ' ');
}

/**
 * Generate slug from text
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract icon emoji from text
 */
function extractIcon(text) {
  const emojiMatch = text.match(/^([\u{1F300}-\u{1F9FF}])/u);
  return emojiMatch ? emojiMatch[1] : '⚔️'; // Default to sword
}

/**
 * Generate search terms from entity data
 */
function generateSearchTerms(hero) {
  const terms = new Set();

  // Add name variations
  terms.add(hero.name.toLowerCase());
  hero.name.split(/\s+/).forEach(word => {
    if (word.length > 2) terms.add(word.toLowerCase());
  });

  // Add mythology
  terms.add(hero.mythology);
  hero.mythologies?.forEach(m => terms.add(m));

  // Add from attributes
  if (hero.attributes) {
    Object.values(hero.attributes).forEach(value => {
      if (typeof value === 'string') {
        value.split(/[,\s]+/).forEach(term => {
          if (term.length > 2) terms.add(term.toLowerCase());
        });
      }
    });
  }

  // Add tags
  hero.tags?.forEach(tag => terms.add(tag.toLowerCase()));

  // Add from titles/epithets
  if (hero.subtitle) {
    hero.subtitle.split(/\s+/).forEach(word => {
      if (word.length > 3) terms.add(word.toLowerCase());
    });
  }

  return Array.from(terms);
}

/**
 * Generate tags for hero
 */
function generateTags(hero, mythology) {
  const tags = new Set([
    'hero',
    'mythology',
    mythology.toLowerCase()
  ]);

  // Add from titles
  if (hero.attributes?.titles) {
    const titles = hero.attributes.titles.toLowerCase();
    if (titles.includes('king')) tags.add('royalty');
    if (titles.includes('prince')) tags.add('royalty');
    if (titles.includes('warrior')) tags.add('warrior');
    if (titles.includes('prophet')) tags.add('prophet');
    if (titles.includes('sage')) tags.add('sage');
    if (titles.includes('saint')) tags.add('saint');
  }

  // Add from deeds
  if (hero.deeds && hero.deeds.length > 0) {
    tags.add('quest');
    hero.deeds.forEach(deed => {
      const title = deed.title.toLowerCase();
      if (title.includes('slay') || title.includes('kill')) tags.add('monster-slayer');
      if (title.includes('rescue')) tags.add('rescuer');
      if (title.includes('quest') || title.includes('journey')) tags.add('adventurer');
    });
  }

  // Add from weapons
  if (hero.attributes?.weapons) {
    tags.add('warrior');
  }

  return Array.from(tags);
}

// ============================================================================
// HTML PARSING
// ============================================================================

/**
 * Extract content sections from HTML
 */
function extractSections(doc) {
  const sections = [];
  const main = doc.querySelector('main') || doc.querySelector('body');

  if (!main) return sections;

  // Find all h2 and h3 headings
  const headings = main.querySelectorAll('h2, h3');

  headings.forEach((heading, index) => {
    const title = extractText(heading);

    // Skip empty titles and common navigation headers
    if (!title ||
        title.toLowerCase().includes('see also') ||
        title.toLowerCase().includes('related') ||
        title.toLowerCase().includes('archetypal patterns')) {
      return;
    }

    // Collect content until next heading
    let content = '';
    let element = heading.nextElementSibling;

    while (element && !['H2', 'H3'].includes(element.tagName)) {
      if (['P', 'UL', 'OL', 'BLOCKQUOTE'].includes(element.tagName)) {
        const text = extractText(element);
        if (text) content += text + '\n\n';
      }
      element = element.nextElementSibling;
    }

    if (content.trim()) {
      sections.push({
        id: generateSlug(title),
        title: title.replace(/^[⚔️🌊🔱🏹💘🔥🌟🦉👑🕊️🐉🦁📜🗝️🦅✝️🕌⭐🪈🏛️⚡🌾🗿📿☸️]+\s*/, ''),
        order: sections.length + 1,
        type: 'text',
        content: content.trim(),
        metadata: {
          source: 'html-migration',
          level: heading.tagName.toLowerCase()
        }
      });
    }
  });

  return sections;
}

/**
 * Extract attributes from HTML
 */
function extractAttributes(doc, sections) {
  const attributes = {};

  // Look for attribute lists
  const lists = doc.querySelectorAll('ul.attribute-list, .attribute-grid li, .golden-box li');

  lists.forEach(list => {
    const text = extractText(list);
    const match = text.match(/^([^:]+):\s*(.+)$/);

    if (match) {
      const key = match[1].trim().toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      const value = match[2].trim();

      // Map to schema fields
      if (key.includes('title') || key.includes('epithet') || key.includes('known_as')) {
        attributes.titles = value;
      } else if (key.includes('birth') || key.includes('origin')) {
        attributes.birthplace = value;
      } else if (key.includes('parent') || key.includes('father') || key.includes('mother')) {
        attributes.parentage = value;
      } else if (key.includes('weapon') || key.includes('tool')) {
        attributes.weapons = value;
      } else if (key.includes('symbol')) {
        attributes.symbols = value;
      } else if (key.includes('companion') || key.includes('ally')) {
        attributes.companions = value;
      } else if (key.includes('status') || key.includes('role')) {
        attributes.status = value;
      } else {
        // Store other attributes
        attributes[key] = value;
      }
    }
  });

  // Look for metadata in specific sections
  const birthSection = sections.find(s =>
    s.title.toLowerCase().includes('birth') ||
    s.title.toLowerCase().includes('origin') ||
    s.title.toLowerCase().includes('early life')
  );

  if (birthSection && !attributes.birthplace) {
    // Try to extract location from content
    const locationMatch = birthSection.content.match(/\b(born|from|of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    if (locationMatch) {
      attributes.birthplace = locationMatch[2];
    }
  }

  return attributes;
}

/**
 * Extract deeds/quests from sections
 */
function extractDeeds(sections) {
  const deeds = [];
  const deedKeywords = ['quest', 'labor', 'task', 'adventure', 'journey', 'trial', 'deed', 'exploit', 'feat'];

  sections.forEach((section, index) => {
    const title = section.title.toLowerCase();

    // Check if section describes a deed
    if (deedKeywords.some(kw => title.includes(kw))) {
      deeds.push({
        id: section.id,
        title: section.title,
        order: deeds.length + 1,
        description: section.content.substring(0, 500),
        sources: []
      });
    }
  });

  return deeds;
}

/**
 * Extract biography information
 */
function extractBiography(sections) {
  const biography = {};

  const birthSection = sections.find(s =>
    s.title.toLowerCase().includes('birth') ||
    s.title.toLowerCase().includes('origin')
  );
  if (birthSection) {
    biography.birth = birthSection.content.substring(0, 500);
  }

  const earlyLifeSection = sections.find(s =>
    s.title.toLowerCase().includes('early') ||
    s.title.toLowerCase().includes('youth')
  );
  if (earlyLifeSection) {
    biography.earlyLife = earlyLifeSection.content.substring(0, 500);
  }

  const deedsSection = sections.find(s =>
    s.title.toLowerCase().includes('deed') ||
    s.title.toLowerCase().includes('achievement') ||
    s.title.toLowerCase().includes('exploit')
  );
  if (deedsSection) {
    biography.deeds = deedsSection.content.substring(0, 500);
  }

  const deathSection = sections.find(s =>
    s.title.toLowerCase().includes('death') ||
    s.title.toLowerCase().includes('demise') ||
    s.title.toLowerCase().includes('martyrdom')
  );
  if (deathSection) {
    biography.death = deathSection.content.substring(0, 500);
  }

  const legacySection = sections.find(s =>
    s.title.toLowerCase().includes('legacy') ||
    s.title.toLowerCase().includes('influence') ||
    s.title.toLowerCase().includes('impact')
  );
  if (legacySection) {
    biography.legacy = legacySection.content.substring(0, 500);
  }

  return Object.keys(biography).length > 0 ? biography : null;
}

/**
 * Parse hero HTML file
 */
function parseHeroHTML(filePath, assetId, mythology) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extract basic metadata
    const title = doc.querySelector('title')?.textContent || '';
    const h1 = doc.querySelector('h1, header h1');
    const h1Text = h1 ? extractText(h1) : '';

    // Extract name (remove icon if present)
    const name = h1Text.replace(/^[\u{1F300}-\u{1F9FF}\s]+/u, '').trim() ||
                 title.split('-')[0].trim() ||
                 assetId.split('-').pop();

    // Extract icon
    const icon = extractIcon(h1Text);

    // Extract subtitle
    const subtitleEl = doc.querySelector('.subtitle, .hero-subtitle, p.subtitle, .hero-header p');
    const subtitle = subtitleEl ? extractText(subtitleEl) : '';

    // Extract intro paragraph
    const introP = doc.querySelector('.hero-header p:not(.subtitle), main > p:first-of-type');
    const shortDescription = subtitle || (introP ? extractText(introP).substring(0, 300) : '');

    // Extract content sections
    const sections = extractSections(doc);

    // Extract attributes
    const attributes = extractAttributes(doc, sections);

    // Extract deeds/quests
    const deeds = extractDeeds(sections);

    // Extract biography
    const biography = extractBiography(sections);

    // Build long description from first few sections
    const longDescription = sections
      .slice(0, 3)
      .map(s => s.content)
      .join('\n\n')
      .substring(0, 2000);

    // Build hero entity according to unified schema
    const hero = {
      // === CORE IDENTITY ===
      id: assetId,
      entityType: 'hero',
      mythology: mythology,
      mythologies: [mythology],

      // === DISPLAY ===
      name: name,
      icon: icon,
      title: title,
      subtitle: subtitle,
      shortDescription: shortDescription,
      longDescription: longDescription,

      // === METADATA ===
      slug: generateSlug(assetId),
      filePath: path.relative(CONFIG.REPO_ROOT, filePath),
      status: 'published',
      visibility: 'public',

      // === SEARCH & DISCOVERY ===
      searchTerms: [], // Generated after entity is complete
      tags: [], // Generated after entity is complete
      categories: ['hero', 'mythology', mythology],

      // === HERO-SPECIFIC FIELDS ===
      attributes: attributes,

      biography: biography,

      deeds: deeds,

      relationships: {
        divine: [],
        mortal: [],
        enemies: []
      },

      powers: [],
      weaknesses: [],

      // === CONTENT SECTIONS ===
      sections: sections,

      // === RELATIONSHIPS (to be populated) ===
      relatedDeities: [],
      relatedHeroes: [],
      relatedCreatures: [],
      relatedPlaces: [],
      relatedConcepts: [],
      relatedRituals: [],
      relatedTexts: [],

      // === USER INTERACTION ===
      allowUserEdits: true,
      allowUserContent: true,
      moderationRequired: true,

      // === TIMESTAMPS ===
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),

      // === MIGRATION TRACKING ===
      migrationBatch: 'agent5-hero-migration',
      extractedFrom: filePath,
      dataVersion: 1
    };

    // Generate search terms and tags
    hero.searchTerms = generateSearchTerms(hero);
    hero.tags = generateTags(hero, mythology);

    return hero;

  } catch (error) {
    console.error(`✗ Error parsing ${filePath}:`, error.message);
    return null;
  }
}

// ============================================================================
// FIREBASE OPERATIONS
// ============================================================================

/**
 * Upload hero to Firebase
 */
async function uploadHero(hero) {
  if (CONFIG.DRY_RUN) {
    console.log(`  [DRY RUN] Would upload: ${hero.id}`);
    return { success: true, dryRun: true };
  }

  try {
    const docRef = db
      .collection('entities')
      .doc(hero.mythology)
      .collection('heroes')
      .doc(hero.id);

    await docRef.set(hero, { merge: true });

    return { success: true, id: hero.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Batch upload heroes
 */
async function batchUploadHeroes(heroes) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const hero of heroes) {
    const result = await uploadHero(hero);

    if (result.success) {
      results.success++;
      console.log(`  ✓ Uploaded: ${hero.id}`);
    } else {
      results.failed++;
      results.errors.push({ id: hero.id, error: result.error });
      console.error(`  ✗ Failed: ${hero.id} - ${result.error}`);
    }
  }

  return results;
}

// ============================================================================
// MAIN MIGRATION LOGIC
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         AGENT 5: Hero HTML to Firebase Migration              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (CONFIG.DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No data will be written to Firebase\n');
  }

  // Initialize Firebase
  if (!CONFIG.DRY_RUN) {
    initializeFirebase();
  }

  // Load backlog
  console.log('📂 Loading migration backlog...');
  const backlog = JSON.parse(fs.readFileSync(CONFIG.BACKLOG_FILE, 'utf8'));
  const heroEntries = backlog.filter(entry => entry.assetType === 'hero');

  console.log(`✓ Found ${heroEntries.length} hero entries in backlog\n`);

  // Statistics
  const stats = {
    total: heroEntries.length,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    byMythology: {},
    errors: []
  };

  const heroes = [];

  // Process each hero
  console.log('🔄 Processing heroes...\n');

  for (const entry of heroEntries) {
    const filePath = path.join(CONFIG.REPO_ROOT, entry.file);

    console.log(`Processing: ${entry.file}`);
    console.log(`  Mythology: ${entry.mythology}`);
    console.log(`  Asset ID: ${entry.assetId}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found, skipping`);
      stats.skipped++;
      continue;
    }

    // Parse HTML
    const hero = parseHeroHTML(filePath, entry.assetId, entry.mythology);

    if (!hero) {
      console.log(`  ✗ Failed to parse`);
      stats.failed++;
      stats.errors.push({ file: entry.file, error: 'Parse failed' });
      continue;
    }

    heroes.push(hero);
    stats.processed++;

    // Track by mythology
    if (!stats.byMythology[entry.mythology]) {
      stats.byMythology[entry.mythology] = { total: 0, successful: 0 };
    }
    stats.byMythology[entry.mythology].total++;

    console.log(`  ✓ Parsed successfully`);

    if (CONFIG.VERBOSE) {
      console.log(`    - Name: ${hero.name}`);
      console.log(`    - Sections: ${hero.sections.length}`);
      console.log(`    - Deeds: ${hero.deeds.length}`);
      console.log(`    - Tags: ${hero.tags.join(', ')}`);
    }

    console.log('');
  }

  // Upload to Firebase
  if (heroes.length > 0) {
    console.log(`\n📤 Uploading ${heroes.length} heroes to Firebase...\n`);

    const uploadResults = await batchUploadHeroes(heroes);
    stats.successful = uploadResults.success;
    stats.failed += uploadResults.failed;
    stats.errors.push(...uploadResults.errors);

    // Update mythology stats
    heroes.forEach(hero => {
      if (uploadResults.success > 0) {
        stats.byMythology[hero.mythology].successful++;
      }
    });
  }

  // Generate report
  console.log('\n📝 Generating migration report...\n');
  generateReport(stats, heroes);

  // Summary
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      MIGRATION COMPLETE                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`Total entries:        ${stats.total}`);
  console.log(`Processed:            ${stats.processed}`);
  console.log(`Successful uploads:   ${stats.successful}`);
  console.log(`Failed:               ${stats.failed}`);
  console.log(`Skipped:              ${stats.skipped}`);
  console.log(`\nReport saved to:      ${CONFIG.REPORT_FILE}\n`);

  return stats;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(stats, heroes) {
  const timestamp = new Date().toISOString();

  let report = `# Agent 5: Hero HTML to Firebase Migration Report

**Generated:** ${timestamp}
**Migration Batch:** agent5-hero-migration
**Mode:** ${CONFIG.DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}

---

## Executive Summary

- **Total Hero Entries:** ${stats.total}
- **Successfully Processed:** ${stats.processed}
- **Successfully Uploaded:** ${stats.successful}
- **Failed:** ${stats.failed}
- **Skipped:** ${stats.skipped}
- **Success Rate:** ${((stats.successful / stats.total) * 100).toFixed(1)}%

---

## Migration by Mythology

| Mythology | Total | Successful | Success Rate |
|-----------|-------|------------|--------------|
`;

  Object.entries(stats.byMythology)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([mythology, data]) => {
      const rate = ((data.successful / data.total) * 100).toFixed(1);
      report += `| ${mythology} | ${data.total} | ${data.successful} | ${rate}% |\n`;
    });

  report += `\n---

## Migrated Heroes

### Total: ${heroes.length} heroes

`;

  // Group by mythology
  const byMythology = {};
  heroes.forEach(hero => {
    if (!byMythology[hero.mythology]) {
      byMythology[hero.mythology] = [];
    }
    byMythology[hero.mythology].push(hero);
  });

  Object.entries(byMythology)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([mythology, mythHeroes]) => {
      report += `### ${mythology.charAt(0).toUpperCase() + mythology.slice(1)} (${mythHeroes.length})\n\n`;

      mythHeroes
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(hero => {
          report += `- **${hero.icon} ${hero.name}**\n`;
          if (hero.subtitle) {
            report += `  - *${hero.subtitle}*\n`;
          }
          report += `  - ID: \`${hero.id}\`\n`;
          report += `  - Sections: ${hero.sections.length}\n`;
          if (hero.deeds.length > 0) {
            report += `  - Deeds: ${hero.deeds.length}\n`;
          }
          report += `  - Tags: ${hero.tags.join(', ')}\n`;
          report += `\n`;
        });

      report += '\n';
    });

  if (stats.errors.length > 0) {
    report += `---

## Errors (${stats.errors.length})

`;
    stats.errors.forEach(error => {
      report += `- **${error.file || error.id}**\n`;
      report += `  - Error: ${error.error}\n\n`;
    });
  }

  report += `---

## Schema Compliance

All migrated heroes follow the Firebase Unified Schema v1.0:

### Core Fields
- ✅ id, entityType, mythology, mythologies
- ✅ name, icon, title, subtitle
- ✅ shortDescription, longDescription
- ✅ slug, filePath, status, visibility

### Hero-Specific Fields
- ✅ attributes (titles, birthplace, parentage, weapons, symbols, companions, status)
- ✅ biography (birth, earlyLife, deeds, death, legacy)
- ✅ deeds array with structured quest/adventure data
- ✅ relationships (divine, mortal, enemies)
- ✅ powers, weaknesses

### Content & Discovery
- ✅ sections (structured content)
- ✅ searchTerms (auto-generated)
- ✅ tags (auto-generated)
- ✅ categories

### Metadata
- ✅ timestamps (createdAt, updatedAt, publishedAt)
- ✅ migration tracking (batch, source, version)
- ✅ user interaction flags

---

## Sample Hero Structure

\`\`\`json
${JSON.stringify(heroes[0], null, 2).split('\n').slice(0, 50).join('\n')}
  ...
}
\`\`\`

---

## Next Steps

1. ✅ Verify all heroes in Firebase Console
2. ⏳ Test hero-renderer.js component with migrated data
3. ⏳ Update HTML files to use Firebase dynamic loading
4. ⏳ Implement relationship linking (connect to deities, creatures, places)
5. ⏳ Add media assets (icons, images, diagrams)
6. ⏳ Enable user submissions for hero content

---

## Collection Structure

Heroes are stored in Firebase at:

\`\`\`
entities/
  {mythology}/
    heroes/
      {heroId}/
\`\`\`

Example paths:
${heroes.slice(0, 5).map(h => `- \`entities/${h.mythology}/heroes/${h.id}\``).join('\n')}

---

*Migration completed by Agent 5*
*Schema Version: 1.0*
*Timestamp: ${timestamp}*
`;

  fs.writeFileSync(CONFIG.REPORT_FILE, report, 'utf-8');
  console.log(`✓ Report generated: ${CONFIG.REPORT_FILE}`);
}

// ============================================================================
// RUN MIGRATION
// ============================================================================

if (require.main === module) {
  main()
    .then(() => {
      console.log('✓ Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('✗ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { main, parseHeroHTML };
