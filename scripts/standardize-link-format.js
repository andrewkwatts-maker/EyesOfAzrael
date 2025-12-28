const fs = require('fs').promises;
const path = require('path');

/**
 * Standardize Link Format Script
 *
 * Converts all link formats to standard {id, name, type} objects
 */

class LinkFormatStandardizer {
  constructor(assetsPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.dryRun = dryRun;
    this.assetIndex = new Map(); // id -> {name, type, mythology}
    this.fixedFiles = new Set();
    this.standardizeCount = 0;

    // Link fields to standardize
    this.linkFields = [
      'related_deities',
      'related_heroes',
      'related_creatures',
      'related_items',
      'related_places',
      'related_texts',
      'associated_deities',
      'associated_places',
      'associated_heroes',
      'mythology_links'
    ];
  }

  async buildAssetIndex() {
    console.log('Building asset index...');

    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      try {
        await this.indexCategory(category, categoryPath);
      } catch (error) {
        // Category might not exist
      }
    }

    console.log(`Indexed ${this.assetIndex.size} assets`);
  }

  async indexCategory(category, categoryPath) {
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
            await this.indexFile(path.join(itemPath, file), category);
          }
        }
      } else if (item.endsWith('.json') && !item.startsWith('_')) {
        await this.indexAggregatedFile(itemPath, category);
      }
    }
  }

  async indexFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const asset = JSON.parse(content);

      if (asset.id) {
        this.assetIndex.set(asset.id, {
          name: asset.name || asset.displayName || asset.id,
          type: category.replace(/s$/, ''), // singular
          mythology: asset.mythology
        });
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  async indexAggregatedFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      const assets = Array.isArray(data) ? data :
                     data.assets ? data.assets :
                     Object.values(data);

      if (Array.isArray(assets)) {
        for (const asset of assets) {
          if (asset && asset.id) {
            this.assetIndex.set(asset.id, {
              name: asset.name || asset.displayName || asset.id,
              type: category.replace(/s$/, ''), // singular
              mythology: asset.mythology
            });
          }
        }
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  async standardizeAllLinks() {
    console.log('Standardizing link formats...');

    if (this.dryRun) {
      console.log('\n*** DRY RUN MODE - No files will be modified ***\n');
    }

    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      try {
        await this.processCategory(categoryPath);
      } catch (error) {
        // Category might not exist
      }
    }

    console.log(`\nStandardized ${this.standardizeCount} links across ${this.fixedFiles.size} files`);

    if (this.dryRun) {
      console.log('\nRun with --apply flag to actually modify files');
    }
  }

  async processCategory(categoryPath) {
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
            await this.processFile(path.join(itemPath, file));
          }
        }
      } else if (item.endsWith('.json') && !item.startsWith('_')) {
        await this.processFile(itemPath);
      }
    }
  }

  async processFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      let modified = false;

      if (data.id) {
        // Single asset
        if (this.standardizeAssetLinks(data)) {
          modified = true;
        }
      } else if (Array.isArray(data)) {
        // Array of assets
        for (const asset of data) {
          if (asset && asset.id) {
            if (this.standardizeAssetLinks(asset)) {
              modified = true;
            }
          }
        }
      }

      if (modified) {
        if (!this.dryRun) {
          const newContent = JSON.stringify(data, null, 2);
          await fs.writeFile(filePath, newContent, 'utf8');
          this.fixedFiles.add(filePath);
          console.log(`Updated ${filePath}`);
        } else {
          console.log(`Would update ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }

  standardizeAssetLinks(asset) {
    let modified = false;

    for (const field of this.linkFields) {
      if (!asset[field]) continue;

      if (Array.isArray(asset[field])) {
        const standardized = [];
        let fieldModified = false;

        for (const link of asset[field]) {
          const standardLink = this.standardizeLink(link);
          if (standardLink) {
            standardized.push(standardLink);
            if (!this.areLinksEqual(link, standardLink)) {
              fieldModified = true;
              this.standardizeCount++;
            }
          }
        }

        if (fieldModified) {
          asset[field] = standardized;
          modified = true;
        }
      }
    }

    // Special handling for relatedEntities (might have different structure)
    if (asset.relatedEntities && Array.isArray(asset.relatedEntities)) {
      const standardized = [];
      let fieldModified = false;

      for (const link of asset.relatedEntities) {
        const standardLink = this.standardizeLink(link);
        if (standardLink) {
          standardized.push(standardLink);
          if (!this.areLinksEqual(link, standardLink)) {
            fieldModified = true;
            this.standardizeCount++;
          }
        }
      }

      if (fieldModified) {
        asset.relatedEntities = standardized;
        modified = true;
      }
    }

    return modified;
  }

  standardizeLink(link) {
    if (typeof link === 'string') {
      // String link - convert to object
      const id = link.includes('/') ? this.extractIdFromPath(link) : link;
      if (!id) return null;

      const info = this.assetIndex.get(id);
      return {
        id: id,
        name: info ? info.name : id,
        type: info ? info.type : 'unknown'
      };
    } else if (typeof link === 'object' && link !== null) {
      // Object link - ensure all required fields
      let id = link.id;

      // If no ID, try to extract from link field
      if (!id && link.link) {
        id = this.extractIdFromPath(link.link);
      }

      if (!id) return null;

      const info = this.assetIndex.get(id);

      return {
        id: id,
        name: link.name || (info ? info.name : id),
        type: link.type || (info ? info.type : 'unknown')
      };
    }

    return null;
  }

  extractIdFromPath(pathStr) {
    if (!pathStr) return null;

    // Extract from HTML link: "../../greek/deities/zeus.html" -> "greek_deity_zeus"
    const match = pathStr.match(/\/([^\/]+)\/([^\/]+)\/([^\/]+)\.html/);
    if (match) {
      const [, mythology, category, name] = match;
      return `${mythology}_${category.replace(/s$/, '')}_${name}`;
    }

    // Extract from path without .html
    const parts = pathStr.split('/').filter(p => p && p !== '..' && p !== '.');
    if (parts.length >= 2) {
      const name = parts[parts.length - 1].replace('.html', '');
      const category = parts[parts.length - 2];
      const mythology = parts[parts.length - 3] || '';
      return mythology ? `${mythology}_${category.replace(/s$/, '')}_${name}` : null;
    }

    return null;
  }

  areLinksEqual(link1, link2) {
    if (typeof link1 === 'string' && typeof link2 === 'object') {
      return false; // Format changed
    }

    if (typeof link1 === 'object' && typeof link2 === 'object') {
      // Check if object already has all required fields
      return link1.id === link2.id &&
             link1.name === link2.name &&
             link1.type === link2.type;
    }

    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const assetsPath = path.join(__dirname, '..', 'firebase-assets-enhanced');

  const standardizer = new LinkFormatStandardizer(assetsPath, dryRun);

  try {
    await standardizer.buildAssetIndex();
    await standardizer.standardizeAllLinks();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { LinkFormatStandardizer };
