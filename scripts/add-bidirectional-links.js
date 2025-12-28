const fs = require('fs').promises;
const path = require('path');

/**
 * Add Bidirectional Links Script
 *
 * Adds missing reverse links to maintain bidirectional relationships
 */

class BidirectionalLinkAdder {
  constructor(assetsPath, reportPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.reportPath = reportPath;
    this.dryRun = dryRun;
    this.assetFiles = new Map(); // id -> file path
    this.assetData = new Map(); // id -> asset data
    this.fixedFiles = new Set();
    this.addCount = 0;
  }

  async loadAllAssets() {
    console.log('Loading all assets...');

    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      try {
        await this.loadCategory(category, categoryPath);
      } catch (error) {
        // Category might not exist
      }
    }

    console.log(`Loaded ${this.assetData.size} assets`);
  }

  async loadCategory(category, categoryPath) {
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
            await this.loadAssetFile(path.join(itemPath, file));
          }
        }
      } else if (item.endsWith('.json') && !item.startsWith('_')) {
        await this.loadAggregatedFile(itemPath);
      }
    }
  }

  async loadAssetFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const asset = JSON.parse(content);

      if (asset.id) {
        this.assetFiles.set(asset.id, filePath);
        this.assetData.set(asset.id, asset);
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  async loadAggregatedFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      const assets = Array.isArray(data) ? data :
                     data.assets ? data.assets :
                     Object.values(data);

      if (Array.isArray(assets)) {
        for (const asset of assets) {
          if (asset && asset.id) {
            this.assetFiles.set(asset.id, filePath);
            this.assetData.set(asset.id, asset);
          }
        }
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  async loadBidirectionalReport() {
    console.log('Loading bidirectional issues report...');

    const content = await fs.readFile(this.reportPath, 'utf8');
    const report = JSON.parse(content);

    return report.bidirectionalIssues || [];
  }

  async addMissingLinks() {
    const issues = await this.loadBidirectionalReport();
    console.log(`Found ${issues.length} missing bidirectional links`);

    if (this.dryRun) {
      console.log('\n*** DRY RUN MODE - No files will be modified ***\n');
    }

    // Group by target asset (where we need to add the link)
    const byTarget = new Map();
    for (const issue of issues) {
      if (!byTarget.has(issue.targetId)) {
        byTarget.set(issue.targetId, []);
      }
      byTarget.get(issue.targetId).push(issue);
    }

    for (const [targetId, links] of byTarget) {
      await this.addLinksToAsset(targetId, links);
    }

    console.log(`\nAdded ${this.addCount} bidirectional links across ${this.fixedFiles.size} files`);

    if (this.dryRun) {
      console.log('\nRun with --apply flag to actually modify files');
    }
  }

  async addLinksToAsset(targetId, missingLinks) {
    const asset = this.assetData.get(targetId);
    if (!asset) {
      console.log(`Asset not found: ${targetId}`);
      return;
    }

    const filePath = this.assetFiles.get(targetId);
    if (!filePath) {
      console.log(`File not found for asset: ${targetId}`);
      return;
    }

    let modified = false;

    for (const link of missingLinks) {
      const added = this.addLink(asset, link.reverseField, link.sourceId, link.sourceName, link.sourceCategory);
      if (added) {
        modified = true;
        this.addCount++;
        console.log(`  Added link: ${targetId}.${link.reverseField} -> ${link.sourceId}`);
      }
    }

    if (modified) {
      await this.saveAsset(filePath, asset);
    }
  }

  addLink(asset, field, targetId, targetName, targetCategory) {
    // Initialize field if it doesn't exist
    if (!asset[field]) {
      asset[field] = [];
    }

    // Check if link already exists
    if (this.hasLink(asset, field, targetId)) {
      return false; // Already exists
    }

    // Create link object
    const link = {
      id: targetId,
      name: targetName,
      type: targetCategory
    };

    // Add to array
    if (Array.isArray(asset[field])) {
      asset[field].push(link);
    } else {
      // Convert to array if it's not
      asset[field] = [link];
    }

    return true;
  }

  hasLink(asset, field, targetId) {
    if (!asset[field]) return false;

    if (Array.isArray(asset[field])) {
      return asset[field].some(link => {
        if (typeof link === 'string') {
          return link === targetId;
        } else if (typeof link === 'object' && link !== null) {
          return link.id === targetId;
        }
        return false;
      });
    }

    return false;
  }

  async saveAsset(filePath, asset) {
    if (this.dryRun) {
      console.log(`Would update ${filePath}`);
      return;
    }

    try {
      // Read the file to determine format
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      let newData;

      if (Array.isArray(data)) {
        // Find and replace asset in array
        const index = data.findIndex(a => a.id === asset.id);
        if (index >= 0) {
          data[index] = asset;
        }
        newData = data;
      } else {
        // Single asset file
        newData = asset;
      }

      const newContent = JSON.stringify(newData, null, 2);
      await fs.writeFile(filePath, newContent, 'utf8');
      this.fixedFiles.add(filePath);
      console.log(`Updated ${filePath}`);
    } catch (error) {
      console.error(`Error saving ${filePath}:`, error.message);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const assetsPath = path.join(__dirname, '..', 'firebase-assets-enhanced');
  const reportPath = path.join(__dirname, '..', 'reports', 'cross-link-validation-report.json');

  const adder = new BidirectionalLinkAdder(assetsPath, reportPath, dryRun);

  try {
    await adder.loadAllAssets();
    await adder.addMissingLinks();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BidirectionalLinkAdder };
