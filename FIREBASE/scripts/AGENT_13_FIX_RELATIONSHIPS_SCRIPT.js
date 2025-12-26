#!/usr/bin/env node

/**
 * AGENT 13: Fix Relationships Script
 *
 * Repairs:
 * - Broken relationship references
 * - Missing bidirectional links
 * - Missing mythology references
 * - Collection memberships
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
  brokenLinksRemoved: 0,
  bidirectionalLinksAdded: 0,
  mythologyFieldsAdded: 0,
  collectionsAdded: 0,
  errors: []
};

// Track all entity IDs
const allEntityIds = new Set();
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

    const files = fs.readdirSync(categoryPath);
    files.forEach(file => {
      if (!file.endsWith('.json')) return;

      const filePath = path.join(categoryPath, file);
      try {
        const entity = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        allEntityIds.add(entity.id);
        entityData[entity.id] = {
          ...entity,
          type: category,
          filePath: filePath
        };
      } catch (err) {
        stats.errors.push({
          file: filePath,
          error: err.message
        });
      }
    });
  });

  console.log(`Loaded ${allEntityIds.size} entities`);
}

/**
 * Remove broken relationship references
 */
function removeBrokenReferences(entity) {
  let changed = false;

  if (!entity.relatedEntities) return changed;

  for (const [relType, relationships] of Object.entries(entity.relatedEntities)) {
    if (!Array.isArray(relationships)) continue;

    const originalLength = relationships.length;
    entity.relatedEntities[relType] = relationships.filter(rel => {
      const exists = allEntityIds.has(rel.id);
      if (!exists) {
        console.log(`  Removing broken reference: ${entity.id} -> ${rel.id} (${rel.name})`);
        stats.brokenLinksRemoved++;
      }
      return exists;
    });

    if (entity.relatedEntities[relType].length !== originalLength) {
      changed = true;
    }

    // Remove empty arrays
    if (entity.relatedEntities[relType].length === 0) {
      delete entity.relatedEntities[relType];
    }
  }

  return changed;
}

/**
 * Add missing bidirectional relationships
 */
function addBidirectionalLinks(entity) {
  let changed = false;

  if (!entity.relatedEntities) return changed;

  for (const [relType, relationships] of Object.entries(entity.relatedEntities)) {
    if (!Array.isArray(relationships)) continue;

    relationships.forEach(rel => {
      if (!allEntityIds.has(rel.id)) return;

      const targetEntity = entityData[rel.id];
      if (!targetEntity) return;

      // Check if reverse relationship exists
      if (!targetEntity.relatedEntities) {
        targetEntity.relatedEntities = {};
      }

      if (!targetEntity.relatedEntities[entity.type]) {
        targetEntity.relatedEntities[entity.type] = [];
      }

      const hasReverseLink = targetEntity.relatedEntities[entity.type].some(r => r.id === entity.id);

      if (!hasReverseLink) {
        // Add reverse relationship
        targetEntity.relatedEntities[entity.type].push({
          id: entity.id,
          name: entity.name,
          relationship: getReverseRelationship(rel.relationship)
        });

        console.log(`  Adding bidirectional link: ${targetEntity.id} -> ${entity.id}`);
        stats.bidirectionalLinksAdded++;
        changed = true;
      }
    });
  }

  return changed;
}

/**
 * Get reverse relationship description
 */
function getReverseRelationship(relationship) {
  if (!relationship) return 'related to';

  const reverseMap = {
    'parent of': 'child of',
    'child of': 'parent of',
    'spouse of': 'spouse of',
    'sibling of': 'sibling of',
    'wielded by': 'wields',
    'wields': 'wielded by',
    'created by': 'creator of',
    'creator of': 'created by',
    'associated with': 'associated with',
    'home of': 'resides in',
    'resides in': 'home of',
    'defeated by': 'defeated',
    'defeated': 'defeated by'
  };

  return reverseMap[relationship.toLowerCase()] || relationship;
}

/**
 * Add missing mythology references
 */
function addMythologyReferences(entity) {
  let changed = false;

  // Ensure mythologies array exists
  if (!entity.mythologies || !Array.isArray(entity.mythologies) || entity.mythologies.length === 0) {
    // Try to infer from file path or other metadata
    const inferred = inferMythology(entity);
    if (inferred) {
      entity.mythologies = [inferred];
      entity.primaryMythology = inferred;
      changed = true;
      stats.mythologyFieldsAdded++;
      console.log(`  Added mythology: ${entity.id} -> ${inferred}`);
    }
  }

  // Ensure primaryMythology exists
  if (!entity.primaryMythology && entity.mythologies && entity.mythologies.length > 0) {
    entity.primaryMythology = entity.mythologies[0];
    changed = true;
  }

  return changed;
}

/**
 * Infer mythology from entity data
 */
function inferMythology(entity) {
  // Check file path
  if (entity.filePath) {
    const pathParts = entity.filePath.split(/[/\\]/);
    const possibleMythologies = ['greek', 'norse', 'egyptian', 'hindu', 'celtic',
      'chinese', 'japanese', 'babylonian', 'sumerian', 'persian',
      'christian', 'jewish', 'islamic', 'buddhist', 'aztec', 'mayan'];

    for (const myth of possibleMythologies) {
      if (pathParts.some(part => part.toLowerCase().includes(myth))) {
        return myth;
      }
    }
  }

  // Check tags
  if (entity.tags && Array.isArray(entity.tags)) {
    const mythTags = entity.tags.filter(tag =>
      ['greek', 'norse', 'egyptian', 'hindu', 'celtic', 'roman',
       'chinese', 'japanese', 'babylonian', 'sumerian'].includes(tag)
    );
    if (mythTags.length > 0) {
      return mythTags[0];
    }
  }

  return null;
}

/**
 * Add collection memberships based on tags
 */
function addCollectionMemberships(entity) {
  let changed = false;

  // This is handled by tags, but we could add explicit collection fields
  // For now, collections are derived from tags, so no changes needed

  return changed;
}

/**
 * Process all entities
 */
function processAllEntities() {
  console.log('\nProcessing entities...');

  for (const [id, entity] of Object.entries(entityData)) {
    let entityChanged = false;

    // Remove broken references
    if (removeBrokenReferences(entity)) {
      entityChanged = true;
    }

    // Add mythology references
    if (addMythologyReferences(entity)) {
      entityChanged = true;
    }

    // Add bidirectional links (do this last as it modifies other entities)
    if (addBidirectionalLinks(entity)) {
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

  const reportPath = path.join(__dirname, 'AGENT_13_FIX_RELATIONSHIPS_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('RELATIONSHIP FIX COMPLETE');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes made)' : 'LIVE (changes saved)'}`);
  console.log(`Entities processed: ${stats.entitiesProcessed}`);
  console.log(`Broken links removed: ${stats.brokenLinksRemoved}`);
  console.log(`Bidirectional links added: ${stats.bidirectionalLinksAdded}`);
  console.log(`Mythology fields added: ${stats.mythologyFieldsAdded}`);
  console.log(`Errors: ${stats.errors.length}`);
  console.log(`\nReport saved to: ${reportPath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(60));
  console.log('AGENT 13: Fix Relationships Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  loadAllEntities();
  processAllEntities();
  generateReport();
}

main();
