const fs = require('fs').promises;
const path = require('path');

/**
 * Fix Renderability Issues
 *
 * Fixes critical issues that would break rendering:
 * 1. object_instead_of_string - Fix mythology/type/culture fields
 * 2. script_tag - Remove <script> tags
 * 3. missing_id - Generate ID from filename
 */

class RenderabilityFixer {
  constructor(assetsPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.dryRun = dryRun;
    this.fixes = {
      mythologyFixed: 0,
      scriptRemoved: 0,
      idAdded: 0,
      nameAdded: 0
    };
    this.modifiedFiles = new Set();
  }

  async fixAll() {
    console.log('Fixing renderability issues...\n');

    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts', 'archetypes', 'magic', 'beings',
                       'mythologies'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.fixCategory(category, categoryPath);
    }

    this.printReport();
  }

  async fixCategory(category, categoryPath) {
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
        await this.fixSubdirectory(category, entryPath);
      } else if (entry.name.endsWith('.json')) {
        await this.fixAssetFile(category, entryPath, entry.name);
      }
    }
  }

  async fixSubdirectory(category, dirPath) {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        await this.fixAssetFile(category, path.join(dirPath, file), file);
      }
    }
  }

  async fixAssetFile(category, filePath, filename) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      let data = JSON.parse(content);
      let modified = false;

      // Handle array files (aggregated assets)
      if (Array.isArray(data)) {
        for (const asset of data) {
          if (this.fixSingleAsset(asset, category, filename)) {
            modified = true;
          }
        }
        if (modified) {
          this.modifiedFiles.add(filePath);
          if (!this.dryRun) {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
          }
        }
        return;
      }

      // Single asset file
      let asset = data;

      // Fix 1: Add missing id
      if (!asset.id) {
        asset.id = filename.replace('.json', '');
        this.fixes.idAdded++;
        modified = true;
        console.log(`  Added id: ${asset.id}`);
      }

      // Fix 2: Add missing name
      if (!asset.name) {
        asset.name = this.formatName(asset.id);
        this.fixes.nameAdded++;
        modified = true;
        console.log(`  Added name: ${asset.name} (from ${asset.id})`);
      }

      // Fix 3: Fix mythology field if it's an object
      if (asset.mythology && typeof asset.mythology === 'object') {
        const oldMythology = asset.mythology;
        // Try to extract mythology from id or use category context
        asset.mythology = this.extractMythologyString(asset.id, category);
        // Store the complex mythology data elsewhere if valuable
        if (Object.keys(oldMythology).length > 0) {
          if (!asset.mythologyDetails) {
            asset.mythologyDetails = oldMythology;
          }
        }
        this.fixes.mythologyFixed++;
        modified = true;
        console.log(`  Fixed mythology for ${asset.id}: object -> "${asset.mythology}"`);
      }

      // Fix 4: Fix culture field if it's an object
      if (asset.culture && typeof asset.culture === 'object') {
        asset.culture = this.extractCultureString(asset.id) || 'general';
        modified = true;
      }

      // Fix 5: Fix type field if it's an object
      if (asset.type && typeof asset.type === 'object') {
        asset.type = category.replace(/s$/, ''); // deities -> deity
        modified = true;
      }

      // Fix 6: Remove script tags from all string fields
      const scriptsRemoved = this.removeScriptTags(asset);
      if (scriptsRemoved > 0) {
        this.fixes.scriptRemoved += scriptsRemoved;
        modified = true;
        console.log(`  Removed ${scriptsRemoved} script tags from ${asset.id}`);
      }

      // Fix 7: Fix tableDisplay.columns if they have object values
      if (asset.tableDisplay?.columns) {
        for (const [key, value] of Object.entries(asset.tableDisplay.columns)) {
          if (typeof value === 'object' && value !== null) {
            // Extract just the label or key name
            asset.tableDisplay.columns[key] = value.label || key;
            modified = true;
          }
        }
      }

      // Save if modified
      if (modified) {
        this.modifiedFiles.add(filePath);
        if (!this.dryRun) {
          await fs.writeFile(filePath, JSON.stringify(asset, null, 2));
        }
      }
    } catch (error) {
      console.error(`  Error processing ${filePath}: ${error.message}`);
    }
  }

  fixSingleAsset(asset, category, filename) {
    if (!asset || typeof asset !== 'object') return false;
    let modified = false;

    // Fix mythology field if it's an object
    if (asset.mythology && typeof asset.mythology === 'object') {
      const oldMythology = asset.mythology;
      asset.mythology = this.extractMythologyString(asset.id || '', category);
      if (Object.keys(oldMythology).length > 0 && !asset.mythologyDetails) {
        asset.mythologyDetails = oldMythology;
      }
      this.fixes.mythologyFixed++;
      modified = true;
      console.log(`  Fixed mythology for ${asset.id}: object -> "${asset.mythology}"`);
    }

    // Fix culture field if it's an object
    if (asset.culture && typeof asset.culture === 'object') {
      asset.culture = this.extractCultureString(asset.id || '') || 'general';
      modified = true;
    }

    // Fix type field if it's an object
    if (asset.type && typeof asset.type === 'object') {
      asset.type = category.replace(/s$/, '');
      modified = true;
    }

    // Remove script tags
    const scriptsRemoved = this.removeScriptTags(asset);
    if (scriptsRemoved > 0) {
      this.fixes.scriptRemoved += scriptsRemoved;
      modified = true;
    }

    return modified;
  }

  extractMythologyString(id, category) {
    // Common mythology prefixes
    const mythologies = [
      'greek', 'norse', 'egyptian', 'hindu', 'buddhist', 'christian', 'islamic',
      'jewish', 'roman', 'celtic', 'japanese', 'chinese', 'aztec', 'mayan',
      'sumerian', 'babylonian', 'persian', 'african', 'slavic', 'finnish',
      'polynesian', 'inuit', 'native_american', 'korean', 'vietnamese', 'thai',
      'indonesian', 'australian', 'arthurian', 'welsh', 'irish', 'scottish',
      'germanic', 'arabian', 'tibetan', 'mesoamerican', 'incan', 'yoruba'
    ];

    const idLower = id.toLowerCase();
    for (const myth of mythologies) {
      if (idLower.startsWith(myth + '_') || idLower.startsWith(myth + '-')) {
        return myth;
      }
    }

    // Try to infer from category
    if (category === 'concepts') {
      return 'general';
    }

    return 'general';
  }

  extractCultureString(id) {
    const cultures = [
      'american', 'global', 'british', 'european', 'german', 'french',
      'chinese', 'russian', 'indian', 'jewish', 'canadian', 'italian',
      'japanese', 'australian', 'catholic', 'scientific', 'african'
    ];

    const idLower = id.toLowerCase();
    for (const culture of cultures) {
      if (idLower.startsWith(culture + '_') || idLower.startsWith(culture + '-')) {
        return culture;
      }
    }

    return null;
  }

  formatName(id) {
    // Convert id to readable name
    return id
      .replace(/^[a-z]+_/, '') // Remove mythology prefix
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  removeScriptTags(obj, depth = 0) {
    if (depth > 20) return 0; // Prevent infinite recursion

    let removed = 0;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (value.includes('<script')) {
          // Remove script tags
          obj[key] = value.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
          removed++;
        }
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === 'string' && value[i].includes('<script')) {
            value[i] = value[i].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
            removed++;
          } else if (typeof value[i] === 'object' && value[i] !== null) {
            removed += this.removeScriptTags(value[i], depth + 1);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        removed += this.removeScriptTags(value, depth + 1);
      }
    }

    return removed;
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('RENDERABILITY FIX REPORT');
    console.log('='.repeat(60));
    console.log(`\nFixes Applied:`);
    console.log(`  Mythology fields fixed: ${this.fixes.mythologyFixed}`);
    console.log(`  Script tags removed: ${this.fixes.scriptRemoved}`);
    console.log(`  IDs added: ${this.fixes.idAdded}`);
    console.log(`  Names added: ${this.fixes.nameAdded}`);
    console.log(`\nFiles Modified: ${this.modifiedFiles.size}`);
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
  const fixer = new RenderabilityFixer(assetsPath, dryRun);

  try {
    await fixer.fixAll();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { RenderabilityFixer };
