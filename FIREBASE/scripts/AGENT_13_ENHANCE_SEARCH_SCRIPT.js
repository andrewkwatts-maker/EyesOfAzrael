#!/usr/bin/env node

/**
 * AGENT 13: Enhance Search Metadata Script
 *
 * Enhances:
 * - Missing keywords/tags
 * - Searchable text generation
 * - Facets (category, domain, element)
 * - Tag standardization
 * - Alternative names/aliases
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FIREBASE_DATA_DIR = path.join(__dirname, '../data');
const ENTITIES_DIR = path.join(FIREBASE_DATA_DIR, 'entities');
const DRY_RUN = process.argv.includes('--dry-run');

// Stats
const stats = {
  entitiesProcessed: 0,
  keywordsAdded: 0,
  facetsAdded: 0,
  searchableTextGenerated: 0,
  tagsStandardized: 0,
  errors: []
};

// Entity data
const entityData = {};

/**
 * Load all entities
 */
function loadAllEntities() {
  console.log('Loading all entities...');

  const categories = fs.readdirSync(ENTITIES_DIR);
  let count = 0;

  categories.forEach(category => {
    const categoryPath = path.join(ENTITIES_DIR, category);
    if (!fs.statSync(categoryPath).isDirectory()) return;

    const files = fs.readdirSync(categoryPath);
    files.forEach(file => {
      if (!file.endsWith('.json')) return;

      const filePath = path.join(categoryPath, file);
      try {
        const entity = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        entityData[entity.id] = {
          ...entity,
          type: category,
          filePath: filePath
        };
        count++;
      } catch (err) {
        stats.errors.push({
          file: filePath,
          error: err.message
        });
      }
    });
  });

  console.log(`Loaded ${count} entities`);
}

/**
 * Generate keywords from entity data
 */
function generateKeywords(entity) {
  const keywords = new Set();

  // Add entity ID
  if (entity.id) {
    keywords.add(entity.id);
  }

  // Add name variations
  if (entity.name) {
    keywords.add(entity.name.toLowerCase());

    // Split compound names
    const nameParts = entity.name.split(/[\s-]+/);
    nameParts.forEach(part => {
      if (part.length > 2) {
        keywords.add(part.toLowerCase());
      }
    });
  }

  // Add linguistic alternatives
  if (entity.linguistic) {
    if (entity.linguistic.originalName) {
      keywords.add(entity.linguistic.originalName);
    }
    if (entity.linguistic.transliteration) {
      keywords.add(entity.linguistic.transliteration.toLowerCase());
    }
    if (entity.linguistic.alternativeNames) {
      entity.linguistic.alternativeNames.forEach(alt => {
        if (alt.name) {
          keywords.add(alt.name.toLowerCase());
        }
      });
    }
  }

  // Add mythology
  if (entity.primaryMythology) {
    keywords.add(entity.primaryMythology);
  }
  if (entity.mythologies && Array.isArray(entity.mythologies)) {
    entity.mythologies.forEach(m => keywords.add(m));
  }

  // Add category/domain
  if (entity.category) keywords.add(entity.category);
  if (entity.subCategory) keywords.add(entity.subCategory);
  if (entity.domain) {
    if (Array.isArray(entity.domain)) {
      entity.domain.forEach(d => keywords.add(d));
    } else {
      keywords.add(entity.domain);
    }
  }

  // Add type
  if (entity.type) keywords.add(entity.type);

  // Add significant description words
  if (entity.shortDescription) {
    const significantWords = extractSignificantWords(entity.shortDescription);
    significantWords.forEach(w => keywords.add(w));
  }

  // Add element
  if (entity.element) keywords.add(entity.element);

  // Add metaphysical properties
  if (entity.metaphysicalProperties) {
    const mp = entity.metaphysicalProperties;
    if (mp.primaryElement) keywords.add(mp.primaryElement);
    if (mp.sefirot) mp.sefirot.forEach(s => keywords.add(s));
    if (mp.chakras) mp.chakras.forEach(c => keywords.add(c));
    if (mp.planets) mp.planets.forEach(p => keywords.add(p.toLowerCase()));
  }

  // Add related entity names (for context)
  if (entity.relatedEntities) {
    Object.values(entity.relatedEntities).forEach(relArray => {
      if (Array.isArray(relArray)) {
        relArray.forEach(rel => {
          if (rel.relationship) {
            const relWords = rel.relationship.split(/[\s-]+/);
            relWords.forEach(w => {
              if (w.length > 3) keywords.add(w.toLowerCase());
            });
          }
        });
      }
    });
  }

  return Array.from(keywords);
}

/**
 * Extract significant words from text
 */
function extractSignificantWords(text) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'who', 'which', 'what', 'where', 'when', 'why',
    'how', 'most', 'associated', 'known'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  return words;
}

/**
 * Add or enhance keywords/tags
 */
function enhanceKeywords(entity) {
  let changed = false;

  const generatedKeywords = generateKeywords(entity);

  if (!entity.tags || !Array.isArray(entity.tags)) {
    entity.tags = [];
  }

  const existingTags = new Set(entity.tags.map(t => t.toLowerCase()));
  let addedCount = 0;

  generatedKeywords.forEach(keyword => {
    if (!existingTags.has(keyword.toLowerCase())) {
      entity.tags.push(keyword);
      existingTags.add(keyword.toLowerCase());
      addedCount++;
      changed = true;
    }
  });

  if (addedCount > 0) {
    console.log(`  Added ${addedCount} keywords to ${entity.id}`);
    stats.keywordsAdded += addedCount;
  }

  return changed;
}

/**
 * Add or enhance facets
 */
function enhanceFacets(entity) {
  let changed = false;

  // Ensure category exists
  if (!entity.category) {
    const inferredCategory = inferCategory(entity);
    if (inferredCategory) {
      entity.category = inferredCategory;
      changed = true;
      stats.facetsAdded++;
      console.log(`  Added category to ${entity.id}: ${inferredCategory}`);
    }
  }

  // Ensure domain exists for deities
  if (entity.type === 'deity' && !entity.domain) {
    const inferredDomain = inferDomain(entity);
    if (inferredDomain) {
      entity.domain = inferredDomain;
      changed = true;
      stats.facetsAdded++;
      console.log(`  Added domain to ${entity.id}: ${inferredDomain}`);
    }
  }

  // Ensure element exists where appropriate
  if (!entity.element && entity.tags) {
    const elements = ['fire', 'water', 'earth', 'air', 'aether', 'wood', 'metal'];
    const tagElements = entity.tags.filter(t => elements.includes(t.toLowerCase()));
    if (tagElements.length > 0) {
      entity.element = tagElements[0].toLowerCase();
      changed = true;
      stats.facetsAdded++;
      console.log(`  Added element to ${entity.id}: ${entity.element}`);
    }
  }

  return changed;
}

/**
 * Infer category from entity data
 */
function inferCategory(entity) {
  // Use existing subcategory or tags
  if (entity.subCategory) {
    return entity.subCategory;
  }

  // Check tags for category-like terms
  if (entity.tags && Array.isArray(entity.tags)) {
    const categoryPatterns = {
      'olympian': 'olympian-deity',
      'aesir': 'aesir-deity',
      'primordial': 'primordial-deity',
      'titan': 'titan',
      'dragon': 'dragon',
      'temple': 'temple',
      'mountain': 'sacred-mountain',
      'river': 'sacred-river'
    };

    for (const [pattern, category] of Object.entries(categoryPatterns)) {
      if (entity.tags.some(t => t.toLowerCase().includes(pattern))) {
        return category;
      }
    }
  }

  // Default categories by type
  const typeDefaults = {
    'deity': 'deity',
    'hero': 'hero',
    'creature': 'creature',
    'item': 'artifact',
    'place': 'location',
    'concept': 'philosophical-concept',
    'magic': 'ritual'
  };

  return typeDefaults[entity.type] || 'general';
}

/**
 * Infer domain from entity data
 */
function inferDomain(entity) {
  if (!entity.tags) return null;

  const domainKeywords = {
    'sky': ['sky', 'thunder', 'lightning', 'storm', 'weather'],
    'war': ['war', 'battle', 'warrior', 'combat'],
    'love': ['love', 'beauty', 'desire', 'romance'],
    'death': ['death', 'underworld', 'afterlife', 'grave'],
    'wisdom': ['wisdom', 'knowledge', 'intelligence', 'learning'],
    'sea': ['sea', 'ocean', 'water', 'marine'],
    'sun': ['sun', 'solar', 'light'],
    'moon': ['moon', 'lunar', 'night'],
    'earth': ['earth', 'fertility', 'agriculture', 'harvest'],
    'fire': ['fire', 'forge', 'smithing', 'flame'],
    'healing': ['healing', 'medicine', 'health']
  };

  const tags = entity.tags.map(t => t.toLowerCase());

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(kw => tags.includes(kw))) {
      return domain;
    }
  }

  return null;
}

/**
 * Generate searchable text
 */
function generateSearchableText(entity) {
  let changed = false;

  // Combine all searchable fields
  const searchParts = [];

  if (entity.name) searchParts.push(entity.name);
  if (entity.shortDescription) searchParts.push(entity.shortDescription);
  if (entity.longDescription) searchParts.push(entity.longDescription);

  if (entity.linguistic) {
    if (entity.linguistic.originalName) searchParts.push(entity.linguistic.originalName);
    if (entity.linguistic.transliteration) searchParts.push(entity.linguistic.transliteration);
    if (entity.linguistic.alternativeNames) {
      entity.linguistic.alternativeNames.forEach(alt => {
        if (alt.name) searchParts.push(alt.name);
      });
    }
  }

  if (entity.tags) {
    searchParts.push(entity.tags.join(' '));
  }

  const searchableText = searchParts.join(' ').toLowerCase();

  if (!entity.search) {
    entity.search = {};
  }

  if (entity.search.searchableText !== searchableText) {
    entity.search.searchableText = searchableText;
    changed = true;
    stats.searchableTextGenerated++;
    console.log(`  Generated searchable text for ${entity.id}`);
  }

  // Add facets to search object
  if (!entity.search.facets) {
    entity.search.facets = {};
    changed = true;
  }

  if (entity.primaryMythology && entity.search.facets.mythology !== entity.primaryMythology) {
    entity.search.facets.mythology = entity.primaryMythology;
    changed = true;
  }

  if (entity.type && entity.search.facets.type !== entity.type) {
    entity.search.facets.type = entity.type;
    changed = true;
  }

  if (entity.category && entity.search.facets.category !== entity.category) {
    entity.search.facets.category = entity.category;
    changed = true;
  }

  if (entity.domain && !entity.search.facets.domain) {
    entity.search.facets.domain = Array.isArray(entity.domain) ? entity.domain[0] : entity.domain;
    changed = true;
  }

  return changed;
}

/**
 * Standardize tags
 */
function standardizeTags(entity) {
  let changed = false;

  if (!entity.tags || !Array.isArray(entity.tags)) {
    return changed;
  }

  const tagReplacements = {
    'olympians': 'olympian',
    'sky god': 'sky-god',
    'war god': 'war-god',
    'earth mother': 'earth-mother',
    'sun god': 'sun-god',
    'moon goddess': 'moon-deity',
    'underworld god': 'underworld-deity'
  };

  const originalTags = [...entity.tags];
  entity.tags = entity.tags.map(tag => {
    const lowerTag = tag.toLowerCase();
    return tagReplacements[lowerTag] || tag;
  });

  // Remove duplicates (case-insensitive)
  const seen = new Set();
  entity.tags = entity.tags.filter(tag => {
    const lower = tag.toLowerCase();
    if (seen.has(lower)) {
      return false;
    }
    seen.add(lower);
    return true;
  });

  if (JSON.stringify(originalTags) !== JSON.stringify(entity.tags)) {
    changed = true;
    stats.tagsStandardized++;
    console.log(`  Standardized tags for ${entity.id}`);
  }

  return changed;
}

/**
 * Process all entities
 */
function processAllEntities() {
  console.log('\nEnhancing search metadata...');

  for (const [id, entity] of Object.entries(entityData)) {
    let entityChanged = false;

    // Enhance keywords
    if (enhanceKeywords(entity)) {
      entityChanged = true;
    }

    // Enhance facets
    if (enhanceFacets(entity)) {
      entityChanged = true;
    }

    // Generate searchable text
    if (generateSearchableText(entity)) {
      entityChanged = true;
    }

    // Standardize tags
    if (standardizeTags(entity)) {
      entityChanged = true;
    }

    if (entityChanged) {
      stats.entitiesProcessed++;

      if (!DRY_RUN) {
        // Write updated entity back to file
        try {
          fs.writeFileSync(
            entity.filePath,
            JSON.stringify(entity, null, 2)
          );
        } catch (err) {
          stats.errors.push({
            entity: id,
            error: err.message
          });
        }
      }
    }
  }
}

/**
 * Generate report
 */
function generateReport() {
  const report = {
    metadata: {
      generated: new Date().toISOString(),
      dryRun: DRY_RUN
    },
    stats: stats,
    errors: stats.errors
  };

  const reportPath = path.join(__dirname, 'AGENT_13_ENHANCE_SEARCH_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('SEARCH METADATA ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes made)' : 'LIVE (changes saved)'}`);
  console.log(`Entities processed: ${stats.entitiesProcessed}`);
  console.log(`Keywords added: ${stats.keywordsAdded}`);
  console.log(`Facets added: ${stats.facetsAdded}`);
  console.log(`Searchable text generated: ${stats.searchableTextGenerated}`);
  console.log(`Tags standardized: ${stats.tagsStandardized}`);
  console.log(`Errors: ${stats.errors.length}`);
  console.log(`\nReport saved to: ${reportPath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(60));
  console.log('AGENT 13: Enhance Search Metadata Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  loadAllEntities();
  processAllEntities();
  generateReport();
}

main();
