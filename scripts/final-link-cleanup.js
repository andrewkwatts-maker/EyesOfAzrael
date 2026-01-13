/**
 * Final Link Cleanup
 *
 * Handles remaining broken links:
 * 1. Removes malformed IDs (those with special characters)
 * 2. Marks remaining missing entities as _unverified
 */

const fs = require('fs').promises;
const path = require('path');

const ASSET_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

class FinalLinkCleanup {
  constructor(dryRun = true) {
    this.dryRun = dryRun;
    this.allAssets = new Map();
    this.stats = {
      malformedRemoved: 0,
      markedUnverified: 0,
      filesModified: 0
    };
  }

  // Check if ID is malformed
  isMalformedId(id) {
    if (!id || typeof id !== 'string') return true;
    // Malformed if contains special chars, spaces, or is too long
    return /[^a-z0-9_-]/i.test(id) || id.length > 100 || id.includes(' ');
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

  assetExists(id) {
    return id && this.allAssets.has(id);
  }

  async fix() {
    await this.loadAssets();

    // Load broken links report
    const reportsPath = path.join(__dirname, '..', 'reports', 'broken-links.json');
    let brokenLinks;

    try {
      const content = await fs.readFile(reportsPath, 'utf8');
      brokenLinks = JSON.parse(content);
    } catch {
      console.error('Could not load broken-links.json. Run validate-cross-links.js first.');
      return;
    }

    console.log(`\nProcessing ${brokenLinks.count} broken links...`);

    // Group by source asset
    const byAsset = new Map();
    for (const link of brokenLinks.links) {
      // Skip already unverified
      if (link.link?.value?._unverified) continue;

      if (!byAsset.has(link.assetId)) {
        byAsset.set(link.assetId, []);
      }
      byAsset.get(link.assetId).push(link);
    }

    console.log(`Processing links in ${byAsset.size} assets\n`);

    // Process each asset
    for (const [assetId, links] of byAsset) {
      const assetData = this.allAssets.get(assetId);
      if (!assetData) continue;

      const { asset, filePath } = assetData;
      let modified = false;

      for (const link of links) {
        const result = this.processLink(asset, link);
        if (result) {
          modified = true;
        }
      }

      if (modified) {
        this.stats.filesModified++;
        if (!this.dryRun) {
          await fs.writeFile(filePath, JSON.stringify(asset, null, 2));
        }
      }
    }

    this.printReport();
  }

  processLink(asset, link) {
    const { targetId, field } = link;

    // Remove malformed IDs
    if (this.isMalformedId(targetId)) {
      const removed = this.removeReference(asset, field, targetId);
      if (removed) {
        this.stats.malformedRemoved++;
        return true;
      }
    }

    // Mark valid but missing as unverified
    if (!this.assetExists(targetId)) {
      const marked = this.markAsUnverified(asset, field, targetId);
      if (marked) {
        this.stats.markedUnverified++;
        return true;
      }
    }

    return false;
  }

  removeReference(asset, field, targetId) {
    return this.modifyField(asset, field, targetId, 'remove');
  }

  markAsUnverified(asset, field, targetId) {
    return this.modifyField(asset, field, targetId, 'unverify');
  }

  modifyField(asset, field, targetId, action) {
    // Handle relatedEntities - search all subcategories
    if (field === 'relatedEntities' && asset.relatedEntities) {
      let modified = false;
      for (const [category, refs] of Object.entries(asset.relatedEntities)) {
        if (Array.isArray(refs)) {
          modified = this.processArray(refs, targetId, action) || modified;
        }
      }
      return modified;
    }

    // Handle relationships - search all subtypes
    if (field === 'relationships' && asset.relationships) {
      let modified = false;
      for (const [relType, refs] of Object.entries(asset.relationships)) {
        if (Array.isArray(refs)) {
          modified = this.processArray(refs, targetId, action) || modified;
        }
      }
      return modified;
    }

    // Handle simple field paths
    const parts = field.split('.');
    let obj = asset;

    // Navigate to parent
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) return false;
      obj = obj[parts[i]];
    }

    const lastKey = parts[parts.length - 1];
    const value = obj[lastKey];

    if (Array.isArray(value)) {
      return this.processArray(value, targetId, action);
    } else if (typeof value === 'object' && value) {
      if (value.id === targetId && action === 'unverify' && !value._unverified) {
        value._unverified = true;
        value._unverifiedReason = 'Target entity not found';
        return true;
      }
    }

    return false;
  }

  processArray(arr, targetId, action) {
    let modified = false;

    for (let i = arr.length - 1; i >= 0; i--) {
      const item = arr[i];
      const itemId = typeof item === 'string' ? item : item?.id;

      if (itemId === targetId) {
        if (action === 'remove') {
          arr.splice(i, 1);
          modified = true;
        } else if (action === 'unverify') {
          if (typeof item === 'string') {
            // Convert string to object and mark unverified
            arr[i] = {
              id: item,
              _unverified: true,
              _unverifiedReason: 'Target entity not found'
            };
            modified = true;
          } else if (typeof item === 'object' && !item._unverified) {
            item._unverified = true;
            item._unverifiedReason = 'Target entity not found';
            modified = true;
          }
        }
      }
    }

    return modified;
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('FINAL LINK CLEANUP REPORT');
    console.log('='.repeat(60));
    console.log(`\nActions Taken:`);
    console.log(`  Malformed references removed: ${this.stats.malformedRemoved}`);
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

const cleanup = new FinalLinkCleanup(dryRun);
cleanup.fix().catch(console.error);
