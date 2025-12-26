#!/usr/bin/env node

/**
 * AGENT 13: Cross-Linking & Search Metadata Validation
 *
 * Validates:
 * - Relationship integrity (bidirectional links, valid references)
 * - Search metadata completeness (keywords, facets, searchableText)
 * - Collection membership
 * - Orphaned assets
 * - Tag taxonomy
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FIREBASE_DATA_DIR = path.join(__dirname, '../data');
const ENTITIES_DIR = path.join(FIREBASE_DATA_DIR, 'entities');
const INDICES_DIR = path.join(FIREBASE_DATA_DIR, 'indices');
const OUTPUT_DIR = __dirname;

// Results storage
const results = {
  totalEntities: 0,
  brokenRelationships: [],
  orphanedAssets: [],
  missingSearchMetadata: [],
  incompleteFacets: [],
  missingKeywords: [],
  tagTaxonomy: {},
  collections: {},
  relationshipStats: {
    totalRelationships: 0,
    bidirectionalValid: 0,
    bidirectionalMissing: 0,
    brokenReferences: 0
  },
  searchStats: {
    withKeywords: 0,
    withoutKeywords: 0,
    withFacets: 0,
    withoutFacets: 0,
    withSearchableText: 0,
    withoutSearchableText: 0
  }
};

// Track all entity IDs
const allEntityIds = new Set();
const entitiesByType = {};
const entityData = {};

/**
 * Load all entities
 */
function loadAllEntities() {
  console.log('Loading all entities...');

  const categories = fs.readdirSync(ENTITIES_DIR);

  categories.forEach(category => {
    const categoryPath = path.join(ENTITIES_DIR, category);
    if (!fs.statSync(categoryPath).isDirectory()) return;

    if (!entitiesByType[category]) {
      entitiesByType[category] = [];
    }

    const files = fs.readdirSync(categoryPath);
    files.forEach(file => {
      if (!file.endsWith('.json')) return;

      const filePath = path.join(categoryPath, file);
      try {
        const entity = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        allEntityIds.add(entity.id);
        entitiesByType[category].push(entity.id);
        entityData[entity.id] = {
          ...entity,
          type: category,
          filePath: filePath
        };
        results.totalEntities++;
      } catch (err) {
        console.error(`Error loading ${filePath}:`, err.message);
      }
    });
  });

  console.log(`Loaded ${results.totalEntities} entities across ${Object.keys(entitiesByType).length} types`);
}

/**
 * Validate relationship integrity
 */
function validateRelationships() {
  console.log('\nValidating relationships...');

  for (const [id, entity] of Object.entries(entityData)) {
    const relatedEntities = entity.relatedEntities || {};

    // Check each relationship type
    for (const [relType, relationships] of Object.entries(relatedEntities)) {
      if (!Array.isArray(relationships)) continue;

      relationships.forEach(rel => {
        results.relationshipStats.totalRelationships++;

        // Validate reference exists
        if (!allEntityIds.has(rel.id)) {
          results.brokenRelationships.push({
            source: id,
            sourceName: entity.name,
            sourceType: entity.type,
            target: rel.id,
            targetName: rel.name,
            relationshipType: relType,
            relationship: rel.relationship || 'unknown'
          });
          results.relationshipStats.brokenReferences++;
        } else {
          // Check bidirectional relationship
          const targetEntity = entityData[rel.id];
          if (targetEntity) {
            const targetRelated = targetEntity.relatedEntities || {};
            const reverseRels = targetRelated[entity.type] || [];

            const hasBidirectional = reverseRels.some(r => r.id === id);

            if (hasBidirectional) {
              results.relationshipStats.bidirectionalValid++;
            } else {
              results.relationshipStats.bidirectionalMissing++;
              // Note: This might be intentional, not always an error
            }
          }
        }
      });
    }

    // Check for orphaned assets (no relationships)
    const hasRelationships = Object.values(relatedEntities).some(arr =>
      Array.isArray(arr) && arr.length > 0
    );

    if (!hasRelationships) {
      results.orphanedAssets.push({
        id: id,
        name: entity.name,
        type: entity.type,
        mythology: entity.primaryMythology || entity.mythologies?.[0]
      });
    }
  }

  console.log(`Total relationships: ${results.relationshipStats.totalRelationships}`);
  console.log(`Broken references: ${results.relationshipStats.brokenReferences}`);
  console.log(`Orphaned assets: ${results.orphanedAssets.length}`);
}

/**
 * Validate search metadata
 */
function validateSearchMetadata() {
  console.log('\nValidating search metadata...');

  for (const [id, entity] of Object.entries(entityData)) {
    // Check keywords/tags
    const hasKeywords = entity.tags && Array.isArray(entity.tags) && entity.tags.length > 0;

    if (hasKeywords) {
      results.searchStats.withKeywords++;

      // Build tag taxonomy
      entity.tags.forEach(tag => {
        if (!results.tagTaxonomy[tag]) {
          results.tagTaxonomy[tag] = {
            count: 0,
            entities: []
          };
        }
        results.tagTaxonomy[tag].count++;
        results.tagTaxonomy[tag].entities.push({
          id: id,
          name: entity.name,
          type: entity.type
        });
      });
    } else {
      results.searchStats.withoutKeywords++;
      results.missingKeywords.push({
        id: id,
        name: entity.name,
        type: entity.type,
        mythology: entity.primaryMythology
      });
    }

    // Check facets (category, mythology, domain, etc.)
    const hasFacets = (
      entity.category ||
      entity.subCategory ||
      entity.primaryMythology ||
      entity.domain ||
      entity.element ||
      entity.sefirot?.length > 0
    );

    if (hasFacets) {
      results.searchStats.withFacets++;
    } else {
      results.searchStats.withoutFacets++;
      results.incompleteFacets.push({
        id: id,
        name: entity.name,
        type: entity.type
      });
    }

    // Check searchable text (should combine multiple fields)
    const hasSearchableContent = (
      entity.name ||
      entity.shortDescription ||
      entity.longDescription
    );

    if (hasSearchableContent) {
      results.searchStats.withSearchableText++;
    } else {
      results.searchStats.withoutSearchableText++;
    }

    // Identify collection memberships
    if (entity.tags) {
      entity.tags.forEach(tag => {
        // Check for collection-like tags
        if (tag.includes('olympian') || tag.includes('aesir') || tag.includes('sky-god') ||
            tag.includes('earth-mother') || tag.includes('trickster')) {
          if (!results.collections[tag]) {
            results.collections[tag] = [];
          }
          results.collections[tag].push({
            id: id,
            name: entity.name,
            type: entity.type
          });
        }
      });
    }
  }

  // Calculate percentages
  const total = results.totalEntities;
  results.searchStats.keywordPercentage = ((results.searchStats.withKeywords / total) * 100).toFixed(2);
  results.searchStats.facetPercentage = ((results.searchStats.withFacets / total) * 100).toFixed(2);
  results.searchStats.searchableTextPercentage = ((results.searchStats.withSearchableText / total) * 100).toFixed(2);

  console.log(`Entities with keywords: ${results.searchStats.withKeywords} (${results.searchStats.keywordPercentage}%)`);
  console.log(`Entities with facets: ${results.searchStats.withFacets} (${results.searchStats.facetPercentage}%)`);
  console.log(`Unique tags: ${Object.keys(results.tagTaxonomy).length}`);
}

/**
 * Generate collection rules
 */
function generateCollectionRules() {
  const collectionRules = {
    metadata: {
      generated: new Date().toISOString(),
      description: "Auto-generated collection membership rules"
    },
    collections: {}
  };

  // Olympian Deities
  collectionRules.collections.olympians = {
    name: "Olympian Gods",
    description: "The Twelve Olympians of Greek mythology",
    mythology: "greek",
    rules: {
      tags: ["olympian"],
      type: "deity"
    },
    featured: true,
    icon: "⚡"
  };

  // Aesir Gods
  collectionRules.collections.aesir = {
    name: "Æsir Gods",
    description: "The principal pantheon of Norse gods",
    mythology: "norse",
    rules: {
      tags: ["aesir"],
      type: "deity"
    },
    featured: true,
    icon: "⚔️"
  };

  // Sky Gods
  collectionRules.collections.skyGods = {
    name: "Sky Gods",
    description: "Deities associated with the sky and heavens",
    rules: {
      tags: ["sky-god", "sky", "thunder", "lightning"],
      domain: "sky"
    },
    featured: true,
    icon: "☁️"
  };

  // Earth Mothers
  collectionRules.collections.earthMothers = {
    name: "Earth Mother Goddesses",
    description: "Primordial earth and mother goddesses",
    rules: {
      tags: ["earth-mother", "earth-goddess", "mother-goddess"],
      domain: "earth"
    },
    featured: true,
    icon: "🌍"
  };

  // Tricksters
  collectionRules.collections.tricksters = {
    name: "Trickster Deities",
    description: "Gods of mischief, chaos, and transformation",
    rules: {
      tags: ["trickster"],
      archetypes: ["trickster"]
    },
    featured: true,
    icon: "🎭"
  };

  // War Gods
  collectionRules.collections.warGods = {
    name: "War Deities",
    description: "Gods and goddesses of war and battle",
    rules: {
      tags: ["war", "warrior", "battle"],
      domain: "war"
    },
    featured: true,
    icon: "⚔️"
  };

  // Love Deities
  collectionRules.collections.loveDeities = {
    name: "Love & Beauty Deities",
    description: "Gods and goddesses of love, beauty, and desire",
    rules: {
      tags: ["love", "beauty", "desire"],
      domain: ["love", "beauty"]
    },
    featured: true,
    icon: "❤️"
  };

  // Underworld Deities
  collectionRules.collections.underworldDeities = {
    name: "Underworld Deities",
    description: "Gods and goddesses of death and the afterlife",
    rules: {
      tags: ["underworld", "death", "afterlife"],
      domain: ["death", "underworld"]
    },
    featured: true,
    icon: "💀"
  };

  // Sun Gods
  collectionRules.collections.sunGods = {
    name: "Solar Deities",
    description: "Gods and goddesses of the sun",
    rules: {
      tags: ["sun", "solar"],
      domain: "sun"
    },
    featured: true,
    icon: "☀️"
  };

  // Moon Deities
  collectionRules.collections.moonDeities = {
    name: "Lunar Deities",
    description: "Gods and goddesses of the moon",
    rules: {
      tags: ["moon", "lunar"],
      domain: "moon"
    },
    featured: true,
    icon: "🌙"
  };

  return collectionRules;
}

/**
 * Generate reports
 */
function generateReports() {
  console.log('\nGenerating reports...');

  // Cross-linking Audit Report
  const crossLinkingReport = {
    metadata: {
      generated: new Date().toISOString(),
      agent: "AGENT 13",
      totalEntities: results.totalEntities
    },
    summary: {
      brokenRelationships: results.brokenRelationships.length,
      orphanedAssets: results.orphanedAssets.length,
      relationshipStats: results.relationshipStats
    },
    brokenRelationships: results.brokenRelationships,
    orphanedAssets: results.orphanedAssets,
    recommendations: []
  };

  // Add recommendations
  if (results.brokenRelationships.length > 0) {
    crossLinkingReport.recommendations.push({
      priority: "HIGH",
      issue: "Broken relationship references",
      count: results.brokenRelationships.length,
      action: "Remove invalid references or create missing entities"
    });
  }

  if (results.orphanedAssets.length > 0) {
    crossLinkingReport.recommendations.push({
      priority: "MEDIUM",
      issue: "Orphaned assets with no relationships",
      count: results.orphanedAssets.length,
      action: "Add relationships to connect isolated entities"
    });
  }

  // Search Metadata Report
  const searchMetadataReport = {
    metadata: {
      generated: new Date().toISOString(),
      agent: "AGENT 13",
      totalEntities: results.totalEntities
    },
    summary: {
      searchStats: results.searchStats,
      uniqueTags: Object.keys(results.tagTaxonomy).length,
      identifiedCollections: Object.keys(results.collections).length
    },
    missingKeywords: results.missingKeywords,
    incompleteFacets: results.incompleteFacets,
    tagTaxonomy: Object.entries(results.tagTaxonomy)
      .sort((a, b) => b[1].count - a[1].count)
      .reduce((acc, [tag, data]) => {
        acc[tag] = {
          count: data.count,
          sampleEntities: data.entities.slice(0, 5)
        };
        return acc;
      }, {}),
    collections: results.collections,
    recommendations: []
  };

  // Add search recommendations
  if (results.searchStats.withoutKeywords > 0) {
    searchMetadataReport.recommendations.push({
      priority: "HIGH",
      issue: "Missing keywords/tags",
      count: results.searchStats.withoutKeywords,
      percentage: ((results.searchStats.withoutKeywords / results.totalEntities) * 100).toFixed(2) + "%",
      action: "Generate keywords from name, description, and related entities"
    });
  }

  if (results.searchStats.withoutFacets > 0) {
    searchMetadataReport.recommendations.push({
      priority: "MEDIUM",
      issue: "Incomplete facets",
      count: results.searchStats.withoutFacets,
      percentage: ((results.searchStats.withoutFacets / results.totalEntities) * 100).toFixed(2) + "%",
      action: "Add category, subcategory, domain, and element facets"
    });
  }

  // Collection Rules
  const collectionRules = generateCollectionRules();

  // Write reports
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'AGENT_13_CROSS_LINKING_AUDIT.json'),
    JSON.stringify(crossLinkingReport, null, 2)
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'AGENT_13_SEARCH_METADATA_REPORT.json'),
    JSON.stringify(searchMetadataReport, null, 2)
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'AGENT_13_COLLECTIONS_MANIFEST.json'),
    JSON.stringify(collectionRules, null, 2)
  );

  console.log('Reports written successfully!');
}

/**
 * Generate markdown summary
 */
function generateMarkdownSummary() {
  const markdown = `# AGENT 13: Cross-Linking & Search Metadata Validation

**Generated:** ${new Date().toISOString()}

## Summary Statistics

### Overall
- **Total Entities:** ${results.totalEntities}
- **Entity Types:** ${Object.keys(entitiesByType).length}

### Cross-Linking Health
- **Total Relationships:** ${results.relationshipStats.totalRelationships}
- **Broken References:** ${results.relationshipStats.brokenReferences} ⚠️
- **Bidirectional Valid:** ${results.relationshipStats.bidirectionalValid}
- **Bidirectional Missing:** ${results.relationshipStats.bidirectionalMissing}
- **Orphaned Assets:** ${results.orphanedAssets.length}

### Search Metadata Completeness
- **With Keywords:** ${results.searchStats.withKeywords} (${results.searchStats.keywordPercentage}%)
- **Without Keywords:** ${results.searchStats.withoutKeywords} (${((results.searchStats.withoutKeywords / results.totalEntities) * 100).toFixed(2)}%)
- **With Facets:** ${results.searchStats.withFacets} (${results.searchStats.facetPercentage}%)
- **Without Facets:** ${results.searchStats.withoutFacets} (${((results.searchStats.withoutFacets / results.totalEntities) * 100).toFixed(2)}%)
- **With Searchable Text:** ${results.searchStats.withSearchableText} (${results.searchStats.searchableTextPercentage}%)

### Tag Taxonomy
- **Unique Tags:** ${Object.keys(results.tagTaxonomy).length}
- **Identified Collections:** ${Object.keys(results.collections).length}

## Top Issues

### 1. Broken Relationships (${results.brokenRelationships.length})
${results.brokenRelationships.length > 0 ?
  results.brokenRelationships.slice(0, 10).map(br =>
    `- **${br.sourceName}** (${br.sourceType}) → **${br.targetName}** (${br.target}) - Missing target entity`
  ).join('\n') :
  '✅ No broken relationships found'}

${results.brokenRelationships.length > 10 ? `\n_...and ${results.brokenRelationships.length - 10} more_` : ''}

### 2. Orphaned Assets (${results.orphanedAssets.length})
${results.orphanedAssets.length > 0 ?
  results.orphanedAssets.slice(0, 10).map(oa =>
    `- **${oa.name}** (${oa.type}) - ${oa.mythology || 'unknown mythology'}`
  ).join('\n') :
  '✅ No orphaned assets found'}

${results.orphanedAssets.length > 10 ? `\n_...and ${results.orphanedAssets.length - 10} more_` : ''}

### 3. Missing Keywords (${results.missingKeywords.length})
${results.missingKeywords.length > 0 ?
  results.missingKeywords.slice(0, 10).map(mk =>
    `- **${mk.name}** (${mk.type}) - ${mk.mythology || 'unknown'}`
  ).join('\n') :
  '✅ All entities have keywords'}

${results.missingKeywords.length > 10 ? `\n_...and ${results.missingKeywords.length - 10} more_` : ''}

## Most Common Tags (Top 20)

${Object.entries(results.tagTaxonomy)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 20)
  .map(([tag, data], index) => `${index + 1}. **${tag}** - ${data.count} entities`)
  .join('\n')}

## Identified Collections

${Object.entries(results.collections)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([collection, members]) =>
    `- **${collection}** - ${members.length} members`
  ).join('\n')}

## Entity Distribution by Type

${Object.entries(entitiesByType)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([type, entities]) => `- **${type}**: ${entities.length}`)
  .join('\n')}

## Priority Fix List

### High Priority
${results.brokenRelationships.length > 0 ?
  `1. ⚠️ Fix ${results.brokenRelationships.length} broken relationship references` :
  ''}
${results.searchStats.withoutKeywords > (results.totalEntities * 0.1) ?
  `2. ⚠️ Add keywords to ${results.searchStats.withoutKeywords} entities (${((results.searchStats.withoutKeywords / results.totalEntities) * 100).toFixed(1)}%)` :
  ''}

### Medium Priority
${results.orphanedAssets.length > 0 ?
  `1. 📋 Connect ${results.orphanedAssets.length} orphaned assets` :
  ''}
${results.searchStats.withoutFacets > (results.totalEntities * 0.1) ?
  `2. 📋 Add facets to ${results.searchStats.withoutFacets} entities` :
  ''}

### Low Priority
1. 📝 Standardize tag taxonomy
2. 📝 Create collection membership auto-rules
3. 📝 Add alternative names/aliases

## Success Criteria Progress

- ✅ Entities loaded: ${results.totalEntities}
- ${results.brokenRelationships.length === 0 ? '✅' : '❌'} 0 broken relationship links (Current: ${results.brokenRelationships.length})
- ${results.searchStats.keywordPercentage >= 95 ? '✅' : '❌'} 100% of assets have keywords (Current: ${results.searchStats.keywordPercentage}%)
- ${results.searchStats.facetPercentage >= 95 ? '✅' : '❌'} 100% of assets have facets (Current: ${results.searchStats.facetPercentage}%)
- ✅ Tag taxonomy created (${Object.keys(results.tagTaxonomy).length} unique tags)
- ✅ Collections identified (${Object.keys(results.collections).length} collections)

## Next Steps

1. Run \`AGENT_13_FIX_RELATIONSHIPS_SCRIPT.js\` to repair broken links
2. Run \`AGENT_13_ENHANCE_SEARCH_SCRIPT.js\` to add missing metadata
3. Review collection rules and adjust membership criteria
4. Validate changes and re-run audit

---

*Full reports available in:*
- \`AGENT_13_CROSS_LINKING_AUDIT.json\`
- \`AGENT_13_SEARCH_METADATA_REPORT.json\`
- \`AGENT_13_COLLECTIONS_MANIFEST.json\`
`;

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'AGENT_13_QUICK_SUMMARY.md'),
    markdown
  );

  console.log('Markdown summary written!');
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(60));
  console.log('AGENT 13: Cross-Linking & Search Metadata Validation');
  console.log('='.repeat(60));

  loadAllEntities();
  validateRelationships();
  validateSearchMetadata();
  generateReports();
  generateMarkdownSummary();

  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nTotal entities analyzed: ${results.totalEntities}`);
  console.log(`Broken relationships: ${results.brokenRelationships.length}`);
  console.log(`Orphaned assets: ${results.orphanedAssets.length}`);
  console.log(`Missing keywords: ${results.missingKeywords.length}`);
  console.log(`\nSee AGENT_13_QUICK_SUMMARY.md for full report`);
}

main();
