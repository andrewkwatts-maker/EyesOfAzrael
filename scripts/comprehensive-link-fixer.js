/**
 * Comprehensive Link Fixer
 *
 * Fixes multiple data quality issues:
 * 1. Removes malformed references (descriptions stored as IDs)
 * 2. Converts string references to proper entityReference objects
 * 3. Adds bidirectional links where missing
 * 4. Marks legitimate missing entities as _unverified
 */

const fs = require('fs').promises;
const path = require('path');

const ASSET_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

class ComprehensiveLinkFixer {
  constructor(dryRun = true) {
    this.dryRun = dryRun;
    this.allAssets = new Map();
    this.assetIndex = new Map();
    this.stats = {
      malformedRemoved: 0,
      stringRefsConverted: 0,
      bidirectionalAdded: 0,
      markedUnverified: 0,
      filesModified: 0
    };
  }

  // Patterns that indicate malformed data (not real entity IDs)
  isMalformedReference(value) {
    if (typeof value !== 'string') return false;

    const malformedPatterns = [
      /^(consort|parent|child|sibling|ally|enemy|related):/i,  // Label prefixes
      / - /,                                                     // Descriptions with dashes
      /\s{2,}/,                                                  // Multiple spaces
      /[()].*[()]/,                                              // Multiple parentheses (descriptions)
      /^(allies|enemies|family|relationships)\s*&/i,            // Category labels
      /\b(the|of|and|or|with|from|for|to|by|in|as)\b.*\b(the|of|and|or|with|from|for|to|by|in|as)\b/i,  // Long phrases
      /^(especially|particularly|including|such as|also|some)/i, // Description starters
      /-gr$/,                                                    // Truncated references
      /^\w+\s+\w+\s+\w+\s+\w+\s+\w+/,                           // 5+ words
      /[!?;]/,                                                   // Punctuation that shouldn't be in IDs
    ];

    return malformedPatterns.some(p => p.test(value));
  }

  // Check if a string looks like a valid entity ID
  isValidEntityId(value) {
    if (typeof value !== 'string') return false;
    if (value.length < 2 || value.length > 100) return false;

    // Valid IDs are lowercase with hyphens/underscores, possibly with mythology prefix
    const validPattern = /^[a-z0-9][a-z0-9_-]*$/i;
    return validPattern.test(value) && !this.isMalformedReference(value);
  }

  async loadAssets() {
    console.log('Loading all assets...');

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places', 'texts',
      'cosmology', 'rituals', 'herbs', 'symbols', 'events', 'concepts',
      'archetypes', 'magic', 'beings', 'mythologies'
    ];

    for (const category of categories) {
      await this.loadCategory(category);
    }

    console.log(`Loaded ${this.allAssets.size} assets`);
    this.buildIndex();
  }

  async loadCategory(category) {
    const categoryPath = path.join(ASSET_DIR, category);

    try {
      const stats = await fs.stat(categoryPath);
      if (!stats.isDirectory()) return;
    } catch {
      return;
    }

    const entries = await fs.readdir(categoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

      const entryPath = path.join(categoryPath, entry.name);

      if (entry.isDirectory()) {
        const files = await fs.readdir(entryPath);
        for (const file of files) {
          if (file.endsWith('.json') && !file.startsWith('_')) {
            await this.loadAssetFile(category, path.join(entryPath, file));
          }
        }
      } else if (entry.name.endsWith('.json')) {
        await this.loadAssetFile(category, entryPath);
      }
    }
  }

  async loadAssetFile(category, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        for (const asset of data) {
          if (asset?.id) {
            this.allAssets.set(asset.id, { asset, category, filePath });
          }
        }
      } else if (data.id) {
        this.allAssets.set(data.id, { asset: data, category, filePath });
      }
    } catch {
      // Skip invalid files
    }
  }

  buildIndex() {
    for (const [id, data] of this.allAssets) {
      this.assetIndex.set(id.toLowerCase(), id);

      // Also index by name
      if (data.asset.name) {
        const nameLower = data.asset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (!this.assetIndex.has(nameLower)) {
          this.assetIndex.set(nameLower, id);
        }
      }
    }
    console.log(`Built index with ${this.assetIndex.size} lookup keys`);
  }

  assetExists(id) {
    if (!id) return false;
    const lower = id.toLowerCase();
    return this.assetIndex.has(lower) || this.allAssets.has(id);
  }

  findAsset(id) {
    if (!id) return null;
    const lower = id.toLowerCase();
    const actualId = this.assetIndex.get(lower) || id;
    return this.allAssets.has(actualId) ? actualId : null;
  }

  async fix() {
    await this.loadAssets();

    console.log('\nPhase 1: Cleaning malformed references...');
    await this.cleanMalformedReferences();

    console.log('\nPhase 2: Converting string references to objects...');
    await this.convertStringReferences();

    console.log('\nPhase 3: Adding bidirectional links...');
    await this.addBidirectionalLinks();

    this.printReport();
  }

  async cleanMalformedReferences() {
    for (const [assetId, { asset, filePath }] of this.allAssets) {
      let modified = false;

      // Clean relatedEntities
      if (asset.relatedEntities) {
        for (const [category, refs] of Object.entries(asset.relatedEntities)) {
          if (Array.isArray(refs)) {
            const cleaned = refs.filter(ref => {
              const id = typeof ref === 'string' ? ref : ref?.id;
              if (this.isMalformedReference(id)) {
                this.stats.malformedRemoved++;
                modified = true;
                return false;
              }
              return true;
            });
            if (cleaned.length !== refs.length) {
              asset.relatedEntities[category] = cleaned;
            }
          }
        }
      }

      // Clean relationships
      if (asset.relationships) {
        for (const [relType, refs] of Object.entries(asset.relationships)) {
          if (Array.isArray(refs)) {
            const cleaned = refs.filter(ref => {
              const id = typeof ref === 'string' ? ref : ref?.id;
              if (this.isMalformedReference(id)) {
                this.stats.malformedRemoved++;
                modified = true;
                return false;
              }
              return true;
            });
            if (cleaned.length !== refs.length) {
              asset.relationships[relType] = cleaned;
            }
          } else if (typeof refs === 'string' && this.isMalformedReference(refs)) {
            delete asset.relationships[relType];
            this.stats.malformedRemoved++;
            modified = true;
          }
        }
      }

      // Clean family references
      if (asset.family) {
        for (const [relType, refs] of Object.entries(asset.family)) {
          if (Array.isArray(refs)) {
            const cleaned = refs.filter(ref => {
              const id = typeof ref === 'string' ? ref : ref?.id;
              if (this.isMalformedReference(id)) {
                this.stats.malformedRemoved++;
                modified = true;
                return false;
              }
              return true;
            });
            if (cleaned.length !== refs.length) {
              asset.family[relType] = cleaned;
            }
          }
        }
      }

      if (modified) {
        this.stats.filesModified++;
        if (!this.dryRun) {
          await fs.writeFile(filePath, JSON.stringify(asset, null, 2));
        }
      }
    }
  }

  async convertStringReferences() {
    for (const [assetId, { asset, filePath, category }] of this.allAssets) {
      let modified = false;
      const mythology = asset.mythology || this.inferMythology(category, assetId);

      // Convert family string refs
      if (asset.family) {
        for (const [relType, refs] of Object.entries(asset.family)) {
          if (Array.isArray(refs)) {
            const converted = refs.map(ref => {
              if (typeof ref === 'string' && this.isValidEntityId(ref)) {
                const actualId = this.findAsset(ref);
                if (actualId) {
                  this.stats.stringRefsConverted++;
                  modified = true;
                  return { id: actualId, category: this.allAssets.get(actualId)?.category };
                } else {
                  // Mark as unverified
                  this.stats.markedUnverified++;
                  modified = true;
                  return {
                    id: ref,
                    _unverified: true,
                    _unverifiedReason: 'Target entity not found'
                  };
                }
              }
              return ref;
            });
            asset.family[relType] = converted;
          }
        }
      }

      if (modified) {
        if (!this.dryRun) {
          await fs.writeFile(filePath, JSON.stringify(asset, null, 2));
        }
      }
    }
  }

  inferMythology(category, assetId) {
    // Try to infer mythology from asset ID prefix
    const prefixes = ['greek', 'norse', 'egyptian', 'hindu', 'buddhist', 'celtic',
                      'japanese', 'chinese', 'roman', 'persian', 'sumerian', 'babylonian',
                      'aztec', 'mayan', 'islamic', 'christian', 'jewish', 'yoruba'];
    for (const prefix of prefixes) {
      if (assetId.toLowerCase().startsWith(prefix + '_') ||
          assetId.toLowerCase().startsWith(prefix + '-')) {
        return prefix;
      }
    }
    return null;
  }

  async addBidirectionalLinks() {
    const linksToAdd = [];

    // Build a map of all outgoing links
    for (const [assetId, { asset, category }] of this.allAssets) {
      // Check relatedEntities
      if (asset.relatedEntities) {
        for (const [targetCategory, refs] of Object.entries(asset.relatedEntities)) {
          if (!Array.isArray(refs)) continue;

          for (const ref of refs) {
            const targetId = typeof ref === 'string' ? ref : ref?.id;
            if (!targetId || !this.assetExists(targetId)) continue;

            const actualTargetId = this.findAsset(targetId);
            if (actualTargetId) {
              linksToAdd.push({
                from: assetId,
                fromCategory: category,
                to: actualTargetId,
                toCategory: targetCategory
              });
            }
          }
        }
      }

      // Check family relationships
      if (asset.family) {
        for (const [relType, refs] of Object.entries(asset.family)) {
          if (!Array.isArray(refs)) continue;

          for (const ref of refs) {
            const targetId = typeof ref === 'string' ? ref : ref?.id;
            if (!targetId || !this.assetExists(targetId)) continue;

            const actualTargetId = this.findAsset(targetId);
            if (actualTargetId) {
              const inverseRel = this.getInverseRelationship(relType);
              linksToAdd.push({
                from: assetId,
                fromCategory: category,
                to: actualTargetId,
                relationship: relType,
                inverseRelationship: inverseRel
              });
            }
          }
        }
      }
    }

    // Now add missing reverse links
    for (const link of linksToAdd) {
      const targetData = this.allAssets.get(link.to);
      if (!targetData) continue;

      const { asset: targetAsset, filePath } = targetData;

      // Check if reverse link already exists
      const hasReverseLink = this.hasLinkTo(targetAsset, link.from);
      if (hasReverseLink) continue;

      // Add the reverse link
      if (!targetAsset.relatedEntities) {
        targetAsset.relatedEntities = {};
      }
      if (!targetAsset.relatedEntities[link.fromCategory]) {
        targetAsset.relatedEntities[link.fromCategory] = [];
      }

      // Check if already in array
      const existingIds = targetAsset.relatedEntities[link.fromCategory]
        .map(r => typeof r === 'string' ? r : r?.id);

      if (!existingIds.includes(link.from)) {
        targetAsset.relatedEntities[link.fromCategory].push({
          id: link.from,
          relationship: link.inverseRelationship || 'related'
        });
        this.stats.bidirectionalAdded++;

        if (!this.dryRun) {
          await fs.writeFile(filePath, JSON.stringify(targetAsset, null, 2));
        }
      }
    }
  }

  hasLinkTo(asset, targetId) {
    // Check relatedEntities
    if (asset.relatedEntities) {
      for (const refs of Object.values(asset.relatedEntities)) {
        if (Array.isArray(refs)) {
          for (const ref of refs) {
            const id = typeof ref === 'string' ? ref : ref?.id;
            if (id === targetId) return true;
          }
        }
      }
    }

    // Check family
    if (asset.family) {
      for (const refs of Object.values(asset.family)) {
        if (Array.isArray(refs)) {
          for (const ref of refs) {
            const id = typeof ref === 'string' ? ref : ref?.id;
            if (id === targetId) return true;
          }
        }
      }
    }

    return false;
  }

  getInverseRelationship(relType) {
    const inverses = {
      'parents': 'children',
      'children': 'parents',
      'consorts': 'consorts',
      'siblings': 'siblings',
      'allies': 'allies',
      'enemies': 'enemies',
      'mentors': 'students',
      'students': 'mentors',
      'creator': 'creations',
      'creations': 'creator'
    };
    return inverses[relType] || 'related';
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('COMPREHENSIVE LINK FIXER REPORT');
    console.log('='.repeat(60));
    console.log(`\nFixes Applied:`);
    console.log(`  Malformed references removed: ${this.stats.malformedRemoved}`);
    console.log(`  String refs converted: ${this.stats.stringRefsConverted}`);
    console.log(`  Bidirectional links added: ${this.stats.bidirectionalAdded}`);
    console.log(`  Marked as unverified: ${this.stats.markedUnverified}`);
    console.log(`  Files modified: ${this.stats.filesModified}`);
    console.log('='.repeat(60));

    if (this.dryRun) {
      console.log('\nDRY RUN - No files modified');
      console.log('Run with --apply flag to apply fixes');
    }
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

const fixer = new ComprehensiveLinkFixer(dryRun);
fixer.fix().catch(console.error);
