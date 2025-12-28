const fs = require('fs').promises;
const path = require('path');

/**
 * Fix Broken Firebase Cross-Links Script
 *
 * Removes links to non-existent assets from Firebase data
 */

class FirebaseBrokenLinkFixer {
  constructor(assetsPath, reportPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.reportPath = reportPath;
    this.dryRun = dryRun;
    this.allAssetIds = new Set();
    this.fixedFiles = new Set();
    this.fixCount = 0;
  }

  async loadAssetIndex() {
    console.log('Loading asset index...');

    // Load all asset IDs
    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      try {
        await this.indexCategory(categoryPath);
      } catch (error) {
        // Category might not exist
      }
    }

    console.log(`Indexed ${this.allAssetIds.size} assets`);
  }

  async indexCategory(categoryPath) {
    const stats = await fs.stat(categoryPath).catch(() => null);
    if (!stats || !stats.isDirectory()) return;

    const items = await fs.readdir(categoryPath);

    for (const item of items) {
      if (item.startsWith('_') || item.startsWith('.')) continue;

      const itemPath = path.join(categoryPath, item);
      const itemStats = await fs.stat(itemPath).catch(() => null);

      if (itemStats && itemStats.isDirectory()) {
        const files = await fs.readdir(itemPath);
        for (const file of files) {
          if (file.endsWith('.json') && !file.startsWith('_')) {
            await this.indexFile(path.join(itemPath, file));
          }
        }
      } else if (item.endsWith('.json') && !item.startsWith('_')) {
        await this.indexFile(itemPath);
      }
    }
  }

  async indexFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (data.id) {
        this.allAssetIds.add(data.id);
      } else if (Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            this.allAssetIds.add(item.id);
          }
        }
      } else if (data.assets && Array.isArray(data.assets)) {
        for (const item of data.assets) {
          if (item && item.id) {
            this.allAssetIds.add(item.id);
          }
        }
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  async loadBrokenLinksReport() {
    console.log('Loading broken links report...');

    const content = await fs.readFile(this.reportPath, 'utf8');
    const report = JSON.parse(content);

    return report.links || report.brokenLinks || [];
  }

  async fixBrokenLinks() {
    const brokenLinks = await this.loadBrokenLinksReport();
    console.log(`Found ${brokenLinks.length} broken links to fix`);

    if (this.dryRun) {
      console.log('\n*** DRY RUN MODE - No files will be modified ***\n');
    }

    // Group by source asset
    const byAsset = new Map();
    for (const broken of brokenLinks) {
      if (!byAsset.has(broken.assetId)) {
        byAsset.set(broken.assetId, []);
      }
      byAsset.get(broken.assetId).push(broken);
    }

    for (const [assetId, links] of byAsset) {
      await this.fixAssetLinks(assetId, links);
    }

    console.log(`\nFixed ${this.fixCount} broken links across ${this.fixedFiles.size} files`);

    if (this.dryRun) {
      console.log('\nRun with --apply flag to actually modify files');
    }
  }

  async fixAssetLinks(assetId, brokenLinks) {
    // Find the asset file
    const assetFile = await this.findAssetFile(assetId);
    if (!assetFile) {
      console.log(`Could not find file for asset ${assetId}`);
      return;
    }

    // Load the file
    const content = await fs.readFile(assetFile, 'utf8');
    let data = JSON.parse(content);

    // Handle both single asset and array formats
    let assets = Array.isArray(data) ? data : [data];
    let modified = false;

    for (const asset of assets) {
      if (asset.id !== assetId) continue;

      for (const broken of brokenLinks) {
        const removed = this.removeBrokenLink(asset, broken.field, broken.targetId);
        if (removed) {
          modified = true;
          this.fixCount++;
          console.log(`  Removed broken link: ${assetId}.${broken.field} -> ${broken.targetId}`);
        }
      }
    }

    if (modified && !this.dryRun) {
      // Write back
      const newContent = JSON.stringify(Array.isArray(data) ? assets : assets[0], null, 2);
      await fs.writeFile(assetFile, newContent, 'utf8');
      this.fixedFiles.add(assetFile);
      console.log(`Updated ${assetFile}`);
    } else if (modified) {
      console.log(`Would update ${assetFile}`);
    }
  }

  removeBrokenLink(asset, field, targetId) {
    if (!asset[field]) return false;

    let removed = false;

    if (Array.isArray(asset[field])) {
      const originalLength = asset[field].length;
      asset[field] = asset[field].filter(link => {
        const linkId = this.extractLinkId(link);
        return linkId !== targetId;
      });
      removed = asset[field].length < originalLength;
    } else if (typeof asset[field] === 'object') {
      // Handle relationship objects
      for (const [key, value] of Object.entries(asset[field])) {
        if (Array.isArray(value)) {
          const originalLength = value.length;
          asset[field][key] = value.filter(link => {
            const linkId = this.extractLinkId(link);
            return linkId !== targetId;
          });
          if (asset[field][key].length < originalLength) {
            removed = true;
          }
        } else {
          const linkId = this.extractLinkId(value);
          if (linkId === targetId) {
            delete asset[field][key];
            removed = true;
          }
        }
      }
    }

    return removed;
  }

  extractLinkId(link) {
    if (typeof link === 'string') {
      return link.includes('/') ? this.extractIdFromPath(link) : link;
    } else if (typeof link === 'object' && link !== null) {
      return link.id || this.extractIdFromPath(link.link);
    }
    return null;
  }

  extractIdFromPath(path) {
    if (!path) return null;

    const match = path.match(/\/([^\/]+)\/([^\/]+)\/([^\/]+)\.html/);
    if (match) {
      const [, mythology, category, name] = match;
      return `${mythology}_${category.replace(/s$/, '')}_${name}`;
    }

    return null;
  }

  async findAssetFile(assetId) {
    // Try to determine file from ID
    const parts = assetId.split('_');
    if (parts.length >= 3) {
      const mythology = parts[0];
      const category = parts[1] + 's'; // pluralize
      const name = parts.slice(2).join('_');

      // Try individual file
      const individualPath = path.join(this.assetsPath, category, mythology, `${name}.json`);
      const exists = await fs.stat(individualPath).catch(() => null);
      if (exists) return individualPath;

      // Try aggregated file
      const aggregatedPath = path.join(this.assetsPath, category, `${mythology}_${category}_enhanced.json`);
      const aggExists = await fs.stat(aggregatedPath).catch(() => null);
      if (aggExists) return aggregatedPath;
    }

    // Fallback: search all files
    return await this.searchForAsset(assetId);
  }

  async searchForAsset(assetId) {
    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      const result = await this.searchCategory(categoryPath, assetId);
      if (result) return result;
    }

    return null;
  }

  async searchCategory(categoryPath, assetId) {
    const stats = await fs.stat(categoryPath).catch(() => null);
    if (!stats || !stats.isDirectory()) return null;

    const items = await fs.readdir(categoryPath);

    for (const item of items) {
      if (item.startsWith('_') || item.startsWith('.')) continue;

      const itemPath = path.join(categoryPath, item);
      const itemStats = await fs.stat(itemPath).catch(() => null);

      if (itemStats && itemStats.isDirectory()) {
        const files = await fs.readdir(itemPath);
        for (const file of files) {
          if (file.endsWith('.json') && !file.startsWith('_')) {
            const filePath = path.join(itemPath, file);
            if (await this.fileContainsAsset(filePath, assetId)) {
              return filePath;
            }
          }
        }
      } else if (item.endsWith('.json') && !item.startsWith('_')) {
        const filePath = path.join(categoryPath, item);
        if (await this.fileContainsAsset(filePath, assetId)) {
          return filePath;
        }
      }
    }

    return null;
  }

  async fileContainsAsset(filePath, assetId) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (data.id === assetId) return true;

      if (Array.isArray(data)) {
        return data.some(item => item && item.id === assetId);
      }

      if (data.assets && Array.isArray(data.assets)) {
        return data.assets.some(item => item && item.id === assetId);
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const assetsPath = path.join(__dirname, '..', 'firebase-assets-enhanced');
  const reportPath = path.join(__dirname, '..', 'reports', 'broken-links.json');

  const fixer = new FirebaseBrokenLinkFixer(assetsPath, reportPath, dryRun);

  try {
    await fixer.loadAssetIndex();
    await fixer.fixBrokenLinks();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { FirebaseBrokenLinkFixer };
