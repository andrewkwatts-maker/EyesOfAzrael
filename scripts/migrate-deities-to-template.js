/**
 * Migrate Deities to Universal Entity Template
 *
 * This script migrates all deity entities in the Firebase deities collection
 * to conform to the Universal Entity Template defined in UNIVERSAL_ENTITY_TEMPLATE.md
 *
 * Key transformations:
 * - Add missing required fields (title, subtitle, description, content, etc.)
 * - Migrate old field names to new standard names
 * - Ensure all metadata fields are properly structured
 * - Add status, authorId, createdAt, updatedAt timestamps
 * - Convert single mythology to mythologies array
 * - Standardize cross-references format
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEITIES_DIR = path.join(__dirname, '../FIREBASE/data/entities/deity');
const BACKUP_DIR = path.join(__dirname, '../backups/deity-migration-' + Date.now());
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Statistics
const stats = {
  total: 0,
  migrated: 0,
  errors: 0,
  warnings: [],
  changes: {}
};

/**
 * Generate subtitle from deity properties
 */
function generateSubtitle(deity) {
  // Check for existing shortDescription
  if (deity.shortDescription && deity.shortDescription.length <= 150) {
    return deity.shortDescription;
  }

  // Try to extract from properties
  const domainsProperty = deity.properties?.find(p => p.name === 'Domains');
  if (domainsProperty?.value) {
    const domains = domainsProperty.value.split(',')[0].trim();
    return `God/Goddess of ${domains}`;
  }

  // Try subCategory
  if (deity.subCategory) {
    const readable = deity.subCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return readable;
  }

  // Fallback
  return `Deity from ${deity.primaryMythology || deity.mythology || 'ancient mythology'}`;
}

/**
 * Generate merged content from existing fields
 */
function generateContent(deity) {
  const sections = [];

  // Start with fullDescription
  if (deity.fullDescription) {
    sections.push(deity.fullDescription);
  }

  // Add mythology contexts if rich content exists
  if (deity.mythologyContexts && deity.mythologyContexts.length > 0) {
    deity.mythologyContexts.forEach(ctx => {
      if (ctx.symbolism) {
        sections.push(`\n## Symbolism\n\n${ctx.symbolism}`);
      }
      if (ctx.culturalSignificance) {
        sections.push(`\n## Cultural Significance\n\n${ctx.culturalSignificance}`);
      }
    });
  }

  return sections.join('\n\n').trim() || deity.shortDescription || 'No detailed content available.';
}

/**
 * Ensure mythologies is an array containing mythology
 */
function normalizeMythologies(deity) {
  if (Array.isArray(deity.mythologies) && deity.mythologies.length > 0) {
    return deity.mythologies;
  }

  if (deity.primaryMythology) {
    return [deity.primaryMythology];
  }

  if (deity.mythology) {
    return [deity.mythology];
  }

  return ['unknown'];
}

/**
 * Generate domains array from properties or other sources
 */
function extractDomains(deity) {
  // Check properties
  const domainsProperty = deity.properties?.find(p => p.name === 'Domains');
  if (domainsProperty?.value) {
    return domainsProperty.value.split(',').map(d => d.trim().toLowerCase());
  }

  // Check uses field
  if (deity.uses && Array.isArray(deity.uses)) {
    return deity.uses;
  }

  return [];
}

/**
 * Extract symbols from properties
 */
function extractSymbols(deity) {
  const symbolsProperty = deity.properties?.find(p => p.name === 'Symbols');
  if (symbolsProperty?.value) {
    return symbolsProperty.value.split(',').map(s => s.trim());
  }
  return [];
}

/**
 * Extract sacred animals
 */
function extractSacredAnimals(deity) {
  const animalsProperty = deity.properties?.find(p => p.name === 'Sacred Animals');
  if (animalsProperty?.value) {
    return animalsProperty.value.split(',').map(a => a.trim());
  }
  return [];
}

/**
 * Extract sacred plants
 */
function extractSacredPlants(deity) {
  const plantsProperty = deity.properties?.find(p => p.name === 'Sacred Plants');
  if (plantsProperty?.value) {
    return plantsProperty.value.split(',').map(p => p.trim());
  }
  return [];
}

/**
 * Extract epithets from names in mythology contexts
 */
function extractEpithets(deity) {
  const epithets = [];

  if (deity.mythologyContexts && deity.mythologyContexts.length > 0) {
    deity.mythologyContexts.forEach(ctx => {
      if (ctx.names && Array.isArray(ctx.names)) {
        // Filter out the main name
        ctx.names.forEach(name => {
          if (name !== deity.name && !epithets.includes(name)) {
            epithets.push(name);
          }
        });
      }
    });
  }

  return epithets;
}

/**
 * Normalize relationships structure
 */
function normalizeRelationships(deity) {
  const relationships = {};

  // This would need to be extracted from the data or added manually
  // For now, return empty structure
  return relationships;
}

/**
 * Extract gender from properties or infer
 */
function extractGender(deity) {
  // Check properties first
  const genderProperty = deity.properties?.find(p => p.name === 'Gender');
  if (genderProperty?.value) {
    return genderProperty.value.toLowerCase();
  }

  // Infer from pronouns in description
  const desc = deity.fullDescription || deity.shortDescription || '';
  if (desc.match(/\b(he|his|him)\b/i)) return 'male';
  if (desc.match(/\b(she|her|hers)\b/i)) return 'female';

  return 'unknown';
}

/**
 * Migrate a single deity entity
 */
function migrateDeity(deity, filename) {
  const changes = [];

  // Create migrated deity with all required fields
  const migrated = {
    // Core required fields
    id: deity.id || filename.replace('.json', ''),
    type: 'deity',
    name: deity.name,
    title: deity.title || deity.name, // Backwards compatibility
    subtitle: deity.subtitle || generateSubtitle(deity),
    description: deity.shortDescription || deity.fullDescription?.substring(0, 500) || '',
    content: deity.fullDescription || generateContent(deity),
    mythology: deity.primaryMythology || deity.mythology || (deity.mythologies && deity.mythologies[0]) || 'unknown',
    mythologies: normalizeMythologies(deity),
    category: 'deity', // Backwards compatibility
    status: deity.status || 'published',
    createdAt: deity.createdAt || new Date().toISOString(),
    updatedAt: deity.updatedAt || new Date().toISOString(),
    authorId: deity.authorId || 'official',

    // Deity-specific fields
    domains: extractDomains(deity),
    symbols: extractSymbols(deity),
    element: deity.metaphysicalProperties?.element || deity.element || null,
    gender: extractGender(deity),
    generation: deity.generation || null,
    relationships: normalizeRelationships(deity),
    sacredAnimals: extractSacredAnimals(deity),
    sacredPlants: extractSacredPlants(deity),
    epithets: extractEpithets(deity),

    // Preserve existing rich fields
    icon: deity.icon || '🔷',
    slug: deity.slug || deity.id,
    colors: deity.colors || { primary: '#64ffda', secondary: '#00d4ff' },
    tags: deity.tags || [],
    archetypes: deity.archetypes || [],

    // Metadata fields (preserve if they exist)
    linguistic: deity.linguistic || null,
    geographical: deity.geographical || null,
    temporal: deity.temporal || null,
    cultural: deity.cultural || null,
    metaphysicalProperties: deity.metaphysicalProperties || null,

    // Cross-references
    relatedEntities: deity.relatedEntities || {
      deities: [],
      heroes: [],
      creatures: [],
      items: [],
      places: [],
      concepts: [],
      magic: []
    },

    // Sources
    sources: deity.sources || [],

    // Visual data
    visual: deity.visual || null,

    // Preserve legacy fields for backwards compatibility
    properties: deity.properties || [],
    uses: deity.uses || [],
    mythologyContexts: deity.mythologyContexts || []
  };

  // Track what changed
  if (!deity.title) changes.push('added title');
  if (!deity.subtitle) changes.push('added subtitle');
  if (!deity.type || deity.type !== 'deity') changes.push('set type=deity');
  if (!deity.category) changes.push('added category');
  if (!deity.status) changes.push('added status');
  if (!deity.authorId) changes.push('added authorId');
  if (!deity.createdAt) changes.push('added createdAt');
  if (!deity.updatedAt) changes.push('added updatedAt');
  if (!Array.isArray(deity.mythologies)) changes.push('normalized mythologies array');

  return { migrated, changes };
}

/**
 * Main migration function
 */
async function migrateAllDeities() {
  console.log('🔄 Starting Deity Migration to Universal Template\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no files will be changed)' : 'LIVE MIGRATION'}\n`);

  // Create backup directory
  if (!DRY_RUN) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Backup directory: ${BACKUP_DIR}\n`);
  }

  // Get all deity files
  const files = fs.readdirSync(DEITIES_DIR).filter(f => f.endsWith('.json'));
  stats.total = files.length;

  console.log(`📊 Found ${files.length} deity files\n`);

  // Process each deity
  for (const file of files) {
    try {
      const filePath = path.join(DEITIES_DIR, file);
      const deity = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Backup original
      if (!DRY_RUN) {
        fs.writeFileSync(
          path.join(BACKUP_DIR, file),
          JSON.stringify(deity, null, 2)
        );
      }

      // Migrate
      const { migrated, changes } = migrateDeity(deity, file);

      // Track changes
      if (changes.length > 0) {
        stats.changes[file] = changes;
        stats.migrated++;
      }

      // Write migrated version
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2));
      }

      if (VERBOSE) {
        console.log(`✅ ${file}: ${changes.length > 0 ? changes.join(', ') : 'no changes needed'}`);
      } else {
        process.stdout.write('.');
      }

    } catch (error) {
      console.error(`\n❌ Error processing ${file}:`, error.message);
      stats.errors++;
    }
  }

  // Print summary
  console.log('\n\n📈 Migration Summary:\n');
  console.log(`Total files: ${stats.total}`);
  console.log(`Migrated: ${stats.migrated}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Unchanged: ${stats.total - stats.migrated - stats.errors}`);

  if (Object.keys(stats.changes).length > 0) {
    console.log('\n📝 Changes by file:');
    Object.entries(stats.changes).forEach(([file, changes]) => {
      console.log(`  ${file}: ${changes.join(', ')}`);
    });
  }

  console.log(`\n${DRY_RUN ? '💡 This was a dry run. Run without --dry-run to apply changes.' : '✅ Migration complete!'}`);
}

// Run migration
migrateAllDeities().catch(console.error);
