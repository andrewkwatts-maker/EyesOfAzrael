const fs = require('fs').promises;
const path = require('path');

/**
 * Fix Broken Entity References
 *
 * Resolves broken entity references by:
 * 1. Finding matching assets with mythology prefixes (asha → persian_asha)
 * 2. Fuzzy matching similar IDs
 * 3. Marking unresolvable references as _unverified
 */

class BrokenEntityRefsFixer {
  constructor(assetsPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.dryRun = dryRun;
    this.allAssets = new Map();
    this.assetIndex = new Map(); // Normalized ID → actual ID
    this.fixes = {
      prefixMatched: 0,
      fuzzyMatched: 0,
      alreadyMarkedUnverified: 0,
      markedUnverified: 0,
      removed: 0,
      filesModified: 0
    };
    this.unfixable = [];
  }

  async loadAssets() {
    console.log('Loading all assets...');

    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts', 'archetypes', 'magic', 'beings',
                       'mythologies'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.loadCategory(category, categoryPath);
    }

    console.log(`Loaded ${this.allAssets.size} assets`);
    this.buildIndex();
  }

  async loadCategory(category, categoryPath) {
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
          if (asset && asset.id) {
            this.allAssets.set(asset.id, { asset, category, filePath });
          }
        }
      } else if (data.id) {
        this.allAssets.set(data.id, { asset: data, category, filePath });
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  buildIndex() {
    console.log('Building asset index...');

    for (const [id, data] of this.allAssets) {
      // Store exact ID
      this.assetIndex.set(id.toLowerCase(), id);

      // Also store without mythology prefix
      const parts = id.split(/[_-]/);
      if (parts.length > 1) {
        // Store just the entity name part
        const entityName = parts.slice(1).join('-').toLowerCase();
        if (!this.assetIndex.has(entityName)) {
          this.assetIndex.set(entityName, id);
        }
      }

      // Store name-based lookups too
      if (data.asset.name) {
        const nameLower = data.asset.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        if (!this.assetIndex.has(nameLower)) {
          this.assetIndex.set(nameLower, id);
        }
      }
    }

    console.log(`Built index with ${this.assetIndex.size} lookup keys`);
  }

  findMatchingAsset(targetId, assetMythology) {
    const targetLower = targetId.toLowerCase();

    // 1. Exact match
    if (this.allAssets.has(targetId)) {
      return targetId;
    }

    // 2. Case-insensitive exact match
    const exactMatch = this.assetIndex.get(targetLower);
    if (exactMatch && this.allAssets.has(exactMatch)) {
      return exactMatch;
    }

    // 3. Try with mythology prefix
    if (assetMythology) {
      const withPrefix = `${assetMythology}_${targetId}`.toLowerCase();
      const prefixMatch = this.assetIndex.get(withPrefix);
      if (prefixMatch && this.allAssets.has(prefixMatch)) {
        return prefixMatch;
      }

      // Try hyphenated
      const withHyphen = `${assetMythology}-${targetId}`.toLowerCase();
      const hyphenMatch = this.assetIndex.get(withHyphen);
      if (hyphenMatch && this.allAssets.has(hyphenMatch)) {
        return hyphenMatch;
      }
    }

    // 4. Fuzzy match - look for similar IDs
    const fuzzyMatch = this.fuzzyFind(targetLower);
    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    return null;
  }

  fuzzyFind(target) {
    // Look for IDs that end with the target
    for (const [key, id] of this.assetIndex) {
      if (key.endsWith(`_${target}`) || key.endsWith(`-${target}`)) {
        if (this.allAssets.has(id)) {
          return id;
        }
      }
    }

    return null;
  }

  async fixBrokenLinks() {
    await this.loadAssets();

    // Load broken links report
    const reportsPath = path.join(__dirname, '..', 'reports', 'broken-links.json');
    let brokenLinks;

    try {
      const content = await fs.readFile(reportsPath, 'utf8');
      brokenLinks = JSON.parse(content);
    } catch (error) {
      console.error('Could not load broken-links.json. Run validate-cross-links.js first.');
      return;
    }

    console.log(`\nProcessing ${brokenLinks.count} broken links...`);

    // Group by source asset
    const byAsset = new Map();
    for (const link of brokenLinks.links) {
      if (!byAsset.has(link.assetId)) {
        byAsset.set(link.assetId, []);
      }
      byAsset.get(link.assetId).push(link);
    }

    console.log(`Broken links in ${byAsset.size} assets\n`);

    // Process each asset
    for (const [assetId, links] of byAsset) {
      const assetData = this.allAssets.get(assetId);
      if (!assetData) continue;

      const { asset, filePath } = assetData;
      let modified = false;

      for (const link of links) {
        const result = this.fixLink(asset, link);
        if (result) {
          modified = true;
        }
      }

      if (modified) {
        this.fixes.filesModified++;
        if (!this.dryRun) {
          await fs.writeFile(filePath, JSON.stringify(asset, null, 2));
        }
      }
    }

    this.printReport();
  }

  fixLink(asset, link) {
    const { targetId, field, assetMythology } = link;

    // Find matching asset
    const matchedId = this.findMatchingAsset(targetId, assetMythology);

    if (matchedId && matchedId !== targetId) {
      // Found a match with different ID - update the reference
      const updated = this.updateReference(asset, field, targetId, matchedId);
      if (updated) {
        if (matchedId.includes('_') || matchedId.includes('-')) {
          this.fixes.prefixMatched++;
        } else {
          this.fixes.fuzzyMatched++;
        }
        console.log(`  Fixed: ${targetId} → ${matchedId}`);
        return true;
      }
    }

    // Check if already marked as unverified
    if (link.link?.value?._unverified) {
      this.fixes.alreadyMarkedUnverified++;
      return false;
    }

    // Mark as unverified
    const marked = this.markAsUnverified(asset, field, targetId);
    if (marked) {
      this.fixes.markedUnverified++;
      return true;
    }

    this.unfixable.push({ assetId: asset.id, targetId, field });
    return false;
  }

  updateReference(asset, field, oldId, newId) {
    return this.recursiveUpdate(asset, oldId, newId);
  }

  recursiveUpdate(obj, oldId, newId, depth = 0) {
    if (depth > 10 || !obj || typeof obj !== 'object') return false;

    let updated = false;

    for (const [key, value] of Object.entries(obj)) {
      if (value === oldId) {
        obj[key] = newId;
        updated = true;
      } else if (typeof value === 'object' && value !== null) {
        if (value.id === oldId) {
          value.id = newId;
          delete value._unverified;
          delete value._unverifiedReason;
          updated = true;
        }
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            if (value[i] === oldId) {
              value[i] = newId;
              updated = true;
            } else if (typeof value[i] === 'object' && value[i]?.id === oldId) {
              value[i].id = newId;
              delete value[i]._unverified;
              delete value[i]._unverifiedReason;
              updated = true;
            }
          }
        }
        if (this.recursiveUpdate(value, oldId, newId, depth + 1)) {
          updated = true;
        }
      }
    }

    return updated;
  }

  markAsUnverified(asset, field, targetId) {
    return this.recursiveMark(asset, targetId);
  }

  recursiveMark(obj, targetId, depth = 0) {
    if (depth > 10 || !obj || typeof obj !== 'object') return false;

    let marked = false;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        if (value.id === targetId && !value._unverified) {
          value._unverified = true;
          value._unverifiedReason = 'Target entity not found in database';
          marked = true;
        }
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'object' && item?.id === targetId && !item._unverified) {
              item._unverified = true;
              item._unverifiedReason = 'Target entity not found in database';
              marked = true;
            }
          }
        }
        if (this.recursiveMark(value, targetId, depth + 1)) {
          marked = true;
        }
      }
    }

    return marked;
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('BROKEN ENTITY REFERENCES FIX REPORT');
    console.log('='.repeat(60));
    console.log(`\nFixes Applied:`);
    console.log(`  Prefix matches (e.g., asha → persian_asha): ${this.fixes.prefixMatched}`);
    console.log(`  Fuzzy matches: ${this.fixes.fuzzyMatched}`);
    console.log(`  Already marked unverified: ${this.fixes.alreadyMarkedUnverified}`);
    console.log(`  Newly marked unverified: ${this.fixes.markedUnverified}`);
    console.log(`  Files modified: ${this.fixes.filesModified}`);

    const totalFixed = this.fixes.prefixMatched + this.fixes.fuzzyMatched + this.fixes.markedUnverified;
    console.log(`\nTotal links resolved: ${totalFixed}`);

    if (this.unfixable.length > 0) {
      console.log(`\nUnprocessed: ${this.unfixable.length}`);
      this.unfixable.slice(0, 10).forEach(u => {
        console.log(`  ${u.assetId}: ${u.targetId} (${u.field})`);
      });
      if (this.unfixable.length > 10) {
        console.log(`  ... and ${this.unfixable.length - 10} more`);
      }
    }

    console.log('='.repeat(60));

    if (this.dryRun) {
      console.log('\nDRY RUN - No files modified');
      console.log('Run with --apply flag to apply fixes');
    }
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const fixer = new BrokenEntityRefsFixer(assetsPath, dryRun);

  try {
    await fixer.fixBrokenLinks();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BrokenEntityRefsFixer };
