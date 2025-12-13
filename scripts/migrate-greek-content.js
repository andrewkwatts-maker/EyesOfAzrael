/**
 * Greek Mythology Content Migration Script
 * Migrates all Greek content from old HTML format to entity-schema-v2.0 JSON
 *
 * Usage:
 *   node scripts/migrate-greek-content.js
 *   node scripts/migrate-greek-content.js --validate
 *   node scripts/migrate-greek-content.js --firebase-export
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Paths
const OLD_GREEK_DIR = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael\\mythos\\greek';
const NEW_ENTITIES_DIR = path.join(__dirname, '../data/entities');
const TEMPLATE_GENERATOR = path.join(__dirname, 'entity-template-generator.js');

// Entity type mappings
const CATEGORY_TO_TYPE = {
  'deities': 'deity',
  'heroes': 'hero',
  'creatures': 'creature',
  'beings': 'creature',
  'places': 'place',
  'herbs': 'item',
  'rituals': 'magic',
  'cosmology': 'concept',
  'figures': 'hero',
  'myths': 'concept'
};

// Greek color palette
const GREEK_COLORS = {
  'deity': { primary: '#DAA520', secondary: '#FFD700' }, // Gold
  'hero': { primary: '#C0392B', secondary: '#E74C3C' },   // Red
  'creature': { primary: '#8E44AD', secondary: '#9B59B6' }, // Purple
  'place': { primary: '#3498DB', secondary: '#5DADE2' },  // Blue
  'item': { primary: '#27AE60', secondary: '#52BE80' },   // Green
  'magic': { primary: '#E67E22', secondary: '#F39C12' },  // Orange
  'concept': { primary: '#95A5A6', secondary: '#BDC3C7' } // Gray
};

// Statistics
const stats = {
  total: 0,
  migrated: 0,
  failed: 0,
  byType: {},
  validationResults: []
};

/**
 * Extract text content from HTML element
 */
function extractText(element, selector) {
  if (!element) return '';
  const selected = selector ? element.querySelector(selector) : element;
  return selected ? selected.textContent.trim() : '';
}

/**
 * Extract all text content from multiple elements
 */
function extractAllText(element, selector) {
  if (!element) return [];
  const elements = element.querySelectorAll(selector);
  return Array.from(elements).map(el => el.textContent.trim()).filter(Boolean);
}

/**
 * Parse HTML file and extract entity data
 */
function parseHTMLToEntity(htmlPath, category) {
  try {
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract basic info
    const title = extractText(document, 'title').replace('Greek - ', '');
    const id = path.basename(htmlPath, '.html');
    const type = CATEGORY_TO_TYPE[category] || 'concept';

    // Extract icon
    const iconElement = document.querySelector('.deity-icon, .hero-icon, .hero-icon-display');
    const icon = iconElement ? iconElement.textContent.trim() : '';

    // Extract subtitle/short description
    const subtitleElement = document.querySelector('.subtitle, .hero-description, p.hero-description');
    const shortDescription = subtitleElement ? subtitleElement.textContent.trim() : '';

    // Extract main description
    const mainSection = document.querySelector('main section');
    let fullDescription = '';
    const descParagraphs = document.querySelectorAll('main section p');
    if (descParagraphs.length > 0) {
      fullDescription = Array.from(descParagraphs)
        .slice(0, 3)
        .map(p => p.textContent.trim())
        .filter(Boolean)
        .join('\n\n');
    }

    // Extract attributes
    const attributes = {};
    const attributeCards = document.querySelectorAll('.attribute-card');
    attributeCards.forEach(card => {
      const label = extractText(card, '.attribute-label');
      const value = extractText(card, '.attribute-value');
      if (label && value) {
        attributes[label.toLowerCase()] = value;
      }
    });

    // Extract relationships
    const relatedEntities = {
      deities: [],
      heroes: [],
      creatures: [],
      places: [],
      items: []
    };

    // Parse "See Also" links
    const seeAlsoLinks = document.querySelectorAll('.see-also-link');
    seeAlsoLinks.forEach(link => {
      const href = link.getAttribute('href');
      const name = link.textContent.trim();
      if (href && name) {
        const linkCategory = href.includes('/deities/') ? 'deities' :
                            href.includes('/heroes/') ? 'heroes' :
                            href.includes('/creatures/') ? 'creatures' :
                            href.includes('/places/') || href.includes('/cosmology/') ? 'places' :
                            href.includes('/herbs/') ? 'items' : null;

        if (linkCategory && name !== 'All Heroes' && name !== 'All Creatures') {
          const linkId = path.basename(href, '.html');
          relatedEntities[linkCategory].push({
            id: linkId,
            name: name.replace(/[^\w\s-]/g, '').trim()
          });
        }
      }
    });

    // Extract sources
    const sources = [];
    const citationElement = document.querySelector('.citation strong');
    if (citationElement) {
      const citationText = citationElement.nextSibling?.textContent || '';
      const sourceMatches = citationText.match(/[\w\s']+(?:'s)?\s*<em>[^<]+<\/em>/g);
      if (sourceMatches) {
        sourceMatches.forEach(match => {
          const authorMatch = match.match(/([\w\s']+)(?:'s)?\s*<em>([^<]+)<\/em>/);
          if (authorMatch) {
            sources.push({
              title: authorMatch[2].trim(),
              author: authorMatch[1].trim(),
              type: 'primary',
              relevance: 'comprehensive'
            });
          }
        });
      }
    }

    // Extract domains/symbols/titles from attributes
    const tags = [id, 'greek'];
    if (attributes.domains) {
      tags.push(...attributes.domains.split(',').map(d => d.trim().toLowerCase().replace(/\s+/g, '-')));
    }
    if (attributes.titles) {
      tags.push(...attributes.titles.split(',').slice(0, 2).map(t => t.trim().toLowerCase().replace(/\s+/g, '-')));
    }

    // Build entity
    const entity = {
      id: id,
      type: type,
      name: title,
      icon: icon,
      mythologies: ['greek'],
      primaryMythology: 'greek',
      shortDescription: shortDescription.slice(0, 200),
      fullDescription: fullDescription || shortDescription,
      tags: Array.from(new Set(tags)).filter(Boolean),
      colors: GREEK_COLORS[type] || GREEK_COLORS['concept'],

      linguistic: {
        originalName: '',
        originalScript: 'greek',
        transliteration: title,
        pronunciation: '',
        languageCode: 'grc',
        alternativeNames: [],
        etymology: {
          rootLanguage: 'Ancient Greek',
          meaning: '',
          derivation: ''
        }
      },

      geographical: {
        primaryLocation: {
          name: '',
          coordinates: {
            latitude: 38.0,
            longitude: 23.0,
            accuracy: 'general_area'
          },
          type: 'temple',
          description: '',
          significance: ''
        },
        region: 'Mediterranean',
        culturalArea: 'Ancient Greece',
        modernCountries: ['Greece']
      },

      temporal: {
        mythologicalDate: {
          display: 'Mythological Age'
        },
        historicalDate: {
          display: 'c. 800 BCE - 400 CE'
        },
        firstAttestation: {
          date: { year: -800, circa: true, display: 'c. 800 BCE' },
          source: sources.length > 0 ? sources[0].title : 'Homer',
          type: 'literary',
          confidence: 'probable'
        },
        culturalPeriod: 'Classical Period'
      },

      cultural: {
        worshipPractices: [],
        festivals: [],
        socialRole: '',
        demographicAppeal: [],
        modernLegacy: {}
      },

      metaphysicalProperties: {},

      relatedEntities: relatedEntities,

      sources: sources,

      archetypes: [],

      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '2.0',
        completeness: 0, // Will be calculated after entity is fully built
        migratedFrom: htmlPath
      }
    };

    // Add specific attributes based on type
    if (type === 'deity' || type === 'hero') {
      if (attributes.domains) {
        entity.cultural.socialRole = attributes.domains;
      }
      if (attributes.symbols) {
        entity.tags.push(...attributes.symbols.split(',').map(s => s.trim().toLowerCase()));
      }
    }

    // Calculate completeness after entity is fully built
    entity.metadata.completeness = calculateCompleteness(entity);

    return entity;

  } catch (error) {
    console.error(`Error parsing ${htmlPath}:`, error.message);
    return null;
  }
}

/**
 * Calculate completeness percentage
 */
function calculateCompleteness(entity) {
  const totalFields = 20;
  let filledFields = 0;

  if (entity.id) filledFields++;
  if (entity.type) filledFields++;
  if (entity.name) filledFields++;
  if (entity.mythologies?.length) filledFields++;
  if (entity.shortDescription) filledFields++;
  if (entity.fullDescription) filledFields++;
  if (entity.icon) filledFields++;
  if (entity.colors?.primary) filledFields++;
  if (entity.sources?.length) filledFields++;
  if (entity.tags?.length > 2) filledFields++;
  if (entity.linguistic?.originalName) filledFields++;
  if (entity.geographical?.primaryLocation) filledFields++;
  if (entity.temporal?.firstAttestation) filledFields++;
  if (entity.cultural?.worshipPractices?.length) filledFields++;
  if (entity.metaphysicalProperties && Object.keys(entity.metaphysicalProperties).length) filledFields++;
  if (entity.archetypes?.length) filledFields++;
  if (entity.relatedEntities && Object.values(entity.relatedEntities).some(arr => arr.length > 0)) filledFields++;

  return Math.round((filledFields / totalFields) * 100);
}

/**
 * Migrate a single category
 */
function migrateCategory(category) {
  const categoryPath = path.join(OLD_GREEK_DIR, category);

  if (!fs.existsSync(categoryPath)) {
    console.log(`⚠️  Category not found: ${category}`);
    return;
  }

  const files = fs.readdirSync(categoryPath)
    .filter(file => file.endsWith('.html') && file !== 'index.html');

  console.log(`\n=== Migrating ${category} (${files.length} files) ===`);

  const type = CATEGORY_TO_TYPE[category] || 'concept';
  const outputDir = path.join(NEW_ENTITIES_DIR, type);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  files.forEach(file => {
    stats.total++;
    const htmlPath = path.join(categoryPath, file);
    const entity = parseHTMLToEntity(htmlPath, category);

    if (entity) {
      const outputPath = path.join(outputDir, `${entity.id}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(entity, null, 2));

      const completeness = entity.metadata.completeness;
      const status = completeness >= 80 ? '✅' : completeness >= 60 ? '⚠️' : '❌';

      console.log(`${status} ${entity.name} (${completeness}% complete)`);

      stats.migrated++;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.validationResults.push({
        id: entity.id,
        name: entity.name,
        type: type,
        completeness: completeness
      });
    } else {
      stats.failed++;
      console.log(`❌ Failed to migrate: ${file}`);
    }
  });
}

/**
 * Main migration function
 */
function main() {
  console.log('\n=== Greek Mythology Content Migration ===');
  console.log('From:', OLD_GREEK_DIR);
  console.log('To:', NEW_ENTITIES_DIR);
  console.log('\nStarting migration...\n');

  const categories = [
    'deities',
    'heroes',
    'creatures',
    'beings',
    'places',
    'herbs',
    'rituals',
    'cosmology',
    'figures'
  ];

  categories.forEach(category => {
    migrateCategory(category);
  });

  // Generate report
  console.log('\n=== Migration Report ===');
  console.log(`Total files processed: ${stats.total}`);
  console.log(`Successfully migrated: ${stats.migrated}`);
  console.log(`Failed: ${stats.failed}`);
  console.log('\nBy Type:');
  Object.entries(stats.byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Completeness statistics
  const completenessStats = stats.validationResults.reduce((acc, item) => {
    if (item.completeness >= 80) acc.high++;
    else if (item.completeness >= 60) acc.medium++;
    else acc.low++;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  console.log('\nCompleteness:');
  console.log(`  ≥80% complete: ${completenessStats.high} (${Math.round(completenessStats.high/stats.migrated*100)}%)`);
  console.log(`  60-79% complete: ${completenessStats.medium} (${Math.round(completenessStats.medium/stats.migrated*100)}%)`);
  console.log(`  <60% complete: ${completenessStats.low} (${Math.round(completenessStats.low/stats.migrated*100)}%)`);

  // Save report
  const reportPath = path.join(NEW_ENTITIES_DIR, 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats: stats,
    completenessBreakdown: completenessStats
  }, null, 2));

  console.log(`\n✅ Migration complete!`);
  console.log(`Report saved to: ${reportPath}`);
}

// Run if called directly
if (require.main === module) {
  // Check if jsdom is available
  try {
    require.resolve('jsdom');
    main();
  } catch (e) {
    console.error('Error: jsdom is required for HTML parsing.');
    console.error('Install it with: npm install jsdom');
    process.exit(1);
  }
}

module.exports = { parseHTMLToEntity, calculateCompleteness };
