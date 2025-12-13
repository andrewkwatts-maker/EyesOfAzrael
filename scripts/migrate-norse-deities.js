#!/usr/bin/env node

/**
 * Norse Deity Migration Script
 *
 * Migrates Norse deity HTML files from old repository to JSON format for Firebase
 *
 * Usage:
 *   node migrate-norse-deities.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const OLD_REPO_PATH = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael\\mythos\\norse\\deities';
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'entities', 'deity');
const FIREBASE_OUTPUT_DIR = path.join(__dirname, '..', 'FIREBASE', 'data', 'entities', 'deity');

// Deity icon mapping
const DEITY_ICONS = {
  'odin': '🧙',
  'thor': '⚡',
  'freya': '💖',
  'freyja': '💖',
  'frigg': '👑',
  'loki': '🎭',
  'baldr': '☀️',
  'tyr': '⚔️',
  'heimdall': '👁️',
  'hel': '💀',
  'skadi': '❄️',
  'eir': '🌿',
  'hod': '🌑',
  'jord': '🌍',
  'laufey': '🍂',
  'nari': '🔗',
  'vali': '🏹'
};

/**
 * Clean HTML content, removing tags and fixing special characters
 */
function cleanText(text) {
  if (!text) return '';

  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract text content from DOM element
 */
function extractText(element) {
  if (!element) return '';
  return cleanText(element.textContent);
}

/**
 * Extract attribute card values
 */
function extractAttributeCard(doc, label) {
  const cards = Array.from(doc.querySelectorAll('.attribute-card'));
  const card = cards.find(c => {
    const labelEl = c.querySelector('.attribute-label');
    return labelEl && extractText(labelEl).toLowerCase().includes(label.toLowerCase());
  });

  if (!card) return null;

  const valueEl = card.querySelector('.attribute-value');
  return extractText(valueEl);
}

/**
 * Parse deity HTML file
 */
function parseDeityHTML(filePath, deityId) {
  console.log(`\n📖 Parsing ${deityId}...`);

  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Extract basic info
  const icon = doc.querySelector('.deity-icon')?.textContent?.trim() || DEITY_ICONS[deityId] || '⚪';
  const headerH2 = doc.querySelector('.deity-header h2');
  const nameText = headerH2 ? extractText(headerH2).split('(')[0].trim() : deityId;
  const subtitle = doc.querySelector('.subtitle');
  const headerP = doc.querySelector('.deity-header p:not(.subtitle)');

  // Extract attributes
  const titles = extractAttributeCard(doc, 'titles');
  const domains = extractAttributeCard(doc, 'domains');
  const symbols = extractAttributeCard(doc, 'symbols');
  const sacredAnimals = extractAttributeCard(doc, 'sacred animals');
  const sacredPlants = extractAttributeCard(doc, 'sacred plants');
  const colors = extractAttributeCard(doc, 'colors');

  // Extract mythology section
  const mythologySection = doc.querySelector('section h2[style*="color"]');
  let mythologyText = '';
  if (mythologySection && mythologySection.textContent.includes('Mythology')) {
    const section = mythologySection.closest('section');
    const paragraphs = section.querySelectorAll('p');
    mythologyText = Array.from(paragraphs).map(p => extractText(p)).join('\n\n');
  }

  // Extract key myths
  const allH3s = Array.from(doc.querySelectorAll('h3'));
  const keyMythsList = allH3s.find(h => h.textContent.includes('Key Myths'));
  let keyMyths = '';
  if (keyMythsList) {
    const mythsUl = keyMythsList.nextElementSibling;
    if (mythsUl && mythsUl.tagName === 'UL') {
      const mythItems = Array.from(mythsUl.querySelectorAll('li'));
      keyMyths = mythItems.map(li => extractText(li)).join('\n\n');
    }
  }

  // Extract relationships
  let familyInfo = '';
  let alliesInfo = '';
  let enemiesInfo = '';

  const relationshipsH2 = Array.from(doc.querySelectorAll('h2')).find(h =>
    h.textContent.includes('Relationships')
  );

  if (relationshipsH2) {
    const section = relationshipsH2.closest('section') || relationshipsH2.parentElement;
    const familyH3 = Array.from(section.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Family')
    );
    const alliesH3 = Array.from(section.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Allies')
    );

    if (familyH3 && familyH3.nextElementSibling) {
      familyInfo = extractText(familyH3.nextElementSibling);
    }
    if (alliesH3 && alliesH3.nextElementSibling) {
      const alliesList = extractText(alliesH3.nextElementSibling);
      const lines = alliesList.split('\n');
      alliesInfo = lines.find(l => l.includes('Allies:')) || '';
      enemiesInfo = lines.find(l => l.includes('Enemies:')) || '';
    }
  }

  // Extract worship section
  let sacredSites = '';
  let festivals = '';
  let offerings = '';

  const worshipH2 = Array.from(doc.querySelectorAll('h2')).find(h =>
    h.textContent.includes('Worship')
  );

  if (worshipH2) {
    const section = worshipH2.closest('section') || worshipH2.parentElement;
    const sacredH3 = Array.from(section.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Sacred Sites')
    );
    const festivalsH3 = Array.from(section.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Festivals')
    );
    const offeringsH3 = Array.from(section.querySelectorAll('h3')).find(h =>
      h.textContent.includes('Offerings')
    );

    if (sacredH3 && sacredH3.nextElementSibling) {
      sacredSites = extractText(sacredH3.nextElementSibling);
    }
    if (festivalsH3 && festivalsH3.nextElementSibling) {
      festivals = extractText(festivalsH3.nextElementSibling);
    }
    if (offeringsH3 && offeringsH3.nextElementSibling) {
      offerings = extractText(offeringsH3.nextElementSibling);
    }
  }

  // Build the summary from available content
  let summary = '';
  if (headerP) {
    summary = extractText(headerP);
  }
  if (!summary && mythologyText) {
    summary = mythologyText.split('\n\n')[0];
  }

  // Build rich content
  const fullMythology = [mythologyText, keyMyths].filter(Boolean).join('\n\n');

  const richContent = {
    panels: []
  };

  // Attributes panel
  if (titles || domains || symbols || sacredAnimals || sacredPlants || colors) {
    richContent.panels.push({
      type: 'attributes',
      title: 'Divine Attributes',
      content: {
        ...(titles && { titles }),
        ...(domains && { domains: domains.split(',').map(d => d.trim()) }),
        ...(symbols && { symbols: symbols.split(',').map(s => s.trim()) }),
        ...(sacredAnimals && { sacredAnimals: sacredAnimals.split(',').map(a => a.trim()) }),
        ...(sacredPlants && { sacredPlants: sacredPlants.split(',').map(p => p.trim()) }),
        ...(colors && { colors: colors.split(',').map(c => c.trim()) })
      }
    });
  }

  // Mythology panel
  if (fullMythology) {
    richContent.panels.push({
      type: 'text',
      title: 'Mythology & Stories',
      content: fullMythology
    });
  }

  // Relationships panel
  if (familyInfo || alliesInfo || enemiesInfo) {
    richContent.panels.push({
      type: 'relationships',
      title: 'Divine Relationships',
      content: {
        ...(familyInfo && { family: familyInfo }),
        ...(alliesInfo && { allies: alliesInfo }),
        ...(enemiesInfo && { enemies: enemiesInfo })
      }
    });
  }

  // Worship panel
  if (sacredSites || festivals || offerings) {
    richContent.panels.push({
      type: 'worship',
      title: 'Worship & Rituals',
      content: {
        ...(sacredSites && { sacredSites }),
        ...(festivals && { festivals }),
        ...(offerings && { offerings })
      }
    });
  }

  // Build final entity
  const entity = {
    id: deityId,
    displayName: nameText,
    category: 'deity',
    mythology: 'norse',
    mythologyName: 'Norse Mythology',
    subtitle: subtitle ? extractText(subtitle) : '',
    summary: summary || `${nameText} is a deity in Norse mythology.`,
    richContent: richContent,
    icon: icon,
    attributes: {
      ...(titles && { titles }),
      ...(domains && { domains: domains.split(',').map(d => d.trim()) }),
      ...(symbols && { symbols: symbols.split(',').map(s => s.trim()) }),
      ...(sacredAnimals && { sacredAnimals: sacredAnimals.split(',').map(a => a.trim()) }),
      ...(sacredPlants && { sacredPlants: sacredPlants.split(',').map(p => p.trim()) }),
      ...(colors && { colors: colors.split(',').map(c => c.trim()) })
    },
    tags: [
      'deity',
      'norse',
      ...(domains ? domains.split(',').map(d => d.trim()).slice(0, 3) : [])
    ],
    relatedContent: [],
    relatedMythologies: [],
    sources: 'Poetic Edda, Prose Edda, Icelandic Sagas',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  console.log(`✓ Parsed ${nameText}`);
  console.log(`  Icon: ${icon}`);
  console.log(`  Panels: ${richContent.panels.length}`);
  console.log(`  Summary length: ${summary.length} chars`);

  return entity;
}

/**
 * Main migration function
 */
function migrateDeities() {
  console.log('🔱 Norse Deity Migration Starting...\n');
  console.log(`📁 Source: ${OLD_REPO_PATH}`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`📁 Firebase: ${FIREBASE_OUTPUT_DIR}\n`);

  // Ensure output directories exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(FIREBASE_OUTPUT_DIR)) {
    fs.mkdirSync(FIREBASE_OUTPUT_DIR, { recursive: true });
  }

  // Get all HTML files from old repo
  const files = fs.readdirSync(OLD_REPO_PATH)
    .filter(f => f.endsWith('.html') && f !== 'index.html');

  console.log(`Found ${files.length} deity files to migrate\n`);

  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  files.forEach(file => {
    const deityId = path.basename(file, '.html');
    const filePath = path.join(OLD_REPO_PATH, file);
    const outputPath = path.join(OUTPUT_DIR, `${deityId}.json`);
    const firebaseOutputPath = path.join(FIREBASE_OUTPUT_DIR, `${deityId}.json`);

    // Check if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Skipping ${deityId} (already exists)`);
      results.skipped.push(deityId);
      return;
    }

    try {
      const entity = parseDeityHTML(filePath, deityId);

      // Write to both locations
      fs.writeFileSync(outputPath, JSON.stringify(entity, null, 2));
      fs.writeFileSync(firebaseOutputPath, JSON.stringify(entity, null, 2));

      results.successful.push(deityId);
      console.log(`✅ Created ${deityId}.json`);

    } catch (error) {
      console.error(`❌ Failed to parse ${deityId}:`, error.message);
      results.failed.push({ id: deityId, error: error.message });
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.successful.length > 0) {
    console.log('\n✅ Successfully migrated:');
    results.successful.forEach(id => console.log(`   - ${id}`));
  }

  if (results.skipped.length > 0) {
    console.log('\n⏭️  Skipped (already exist):');
    results.skipped.forEach(id => console.log(`   - ${id}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed to migrate:');
    results.failed.forEach(({id, error}) => console.log(`   - ${id}: ${error}`));
  }

  console.log('\n🎉 Migration complete!\n');

  return results;
}

// Run migration
if (require.main === module) {
  migrateDeities();
}

module.exports = { migrateDeities, parseDeityHTML };
