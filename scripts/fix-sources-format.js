const fs = require('fs').promises;
const path = require('path');

/**
 * Fix Sources Format
 *
 * Fixes malformed sources fields in asset files:
 * - Pattern A: String arrays → Object arrays with title field
 * - Pattern B: Nested objects → Flattened arrays
 * - Pattern C: primarySources with wrong field names → normalized
 */

class SourcesFormatFixer {
  constructor(assetsPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.dryRun = dryRun;
    this.fixes = {
      stringArraysFixed: 0,
      nestedObjectsFlattened: 0,
      primarySourcesNormalized: 0,
      filesModified: 0
    };
    this.issues = [];
  }

  async fixAll() {
    console.log('Fixing sources format issues...\n');

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
        await this.fixAssetFile(category, entryPath);
      }
    }
  }

  async fixSubdirectory(category, dirPath) {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        await this.fixAssetFile(category, path.join(dirPath, file));
      }
    }
  }

  async fixAssetFile(category, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      let data = JSON.parse(content);
      let modified = false;

      // Handle array files (aggregated assets)
      if (Array.isArray(data)) {
        for (const asset of data) {
          if (this.fixAssetSources(asset, filePath)) {
            modified = true;
          }
        }
      } else {
        // Single asset
        if (this.fixAssetSources(data, filePath)) {
          modified = true;
        }
      }

      if (modified) {
        this.fixes.filesModified++;
        if (!this.dryRun) {
          await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        }
      }
    } catch (error) {
      this.issues.push({
        file: filePath,
        error: error.message
      });
    }
  }

  fixAssetSources(asset, filePath) {
    if (!asset || typeof asset !== 'object') return false;
    let modified = false;
    const filename = path.basename(filePath);

    // Fix 'sources' field
    if (asset.sources !== undefined) {
      const result = this.normalizeSourcesField(asset.sources, 'sources', asset.id || filename);
      if (result.fixed) {
        asset.sources = result.normalized;
        modified = true;
      }
    }

    // Fix 'primarySources' field
    if (asset.primarySources !== undefined) {
      const result = this.normalizeSourcesField(asset.primarySources, 'primarySources', asset.id || filename);
      if (result.fixed) {
        asset.primarySources = result.normalized;
        modified = true;
      }
    }

    // Fix 'secondarySources' field
    if (asset.secondarySources !== undefined) {
      const result = this.normalizeSourcesField(asset.secondarySources, 'secondarySources', asset.id || filename);
      if (result.fixed) {
        asset.secondarySources = result.normalized;
        modified = true;
      }
    }

    return modified;
  }

  normalizeSourcesField(sources, fieldName, assetId) {
    // Case 1: Already valid array of objects
    if (Array.isArray(sources) && sources.length > 0) {
      if (typeof sources[0] === 'object' && sources[0] !== null) {
        // Check if objects have proper identifiers
        const needsNormalization = sources.some(s =>
          typeof s === 'object' && !s.title && !s.text && !s.source
        );

        if (needsNormalization) {
          const normalized = sources.map(s => this.normalizeSourceObject(s));
          console.log(`  [${assetId}] ${fieldName}: Normalized object fields`);
          this.fixes.primarySourcesNormalized++;
          return { fixed: true, normalized };
        }
        return { fixed: false };
      }

      // Case 2: Array of strings → Array of objects
      if (typeof sources[0] === 'string') {
        const normalized = sources.map(s => ({ title: s }));
        console.log(`  [${assetId}] ${fieldName}: String array → Object array (${sources.length} items)`);
        this.fixes.stringArraysFixed++;
        return { fixed: true, normalized };
      }
    }

    // Case 3: Nested object → Flattened array
    if (typeof sources === 'object' && sources !== null && !Array.isArray(sources)) {
      const flattened = this.flattenNestedSources(sources);
      console.log(`  [${assetId}] ${fieldName}: Nested object → Flat array (${flattened.length} items)`);
      this.fixes.nestedObjectsFlattened++;
      return { fixed: true, normalized: flattened };
    }

    return { fixed: false };
  }

  normalizeSourceObject(source) {
    if (typeof source !== 'object' || source === null) {
      return { title: String(source) };
    }

    // If already has title/text/source, return as-is
    if (source.title || source.text || source.source) {
      return source;
    }

    // Try to extract identifier from common field names
    const normalized = { ...source };

    // Map common non-standard fields to standard ones
    if (source.name) {
      normalized.title = source.name;
    } else if (source.term) {
      normalized.title = source.term;
    } else if (source.reference) {
      normalized.title = source.reference;
    } else if (source.chapter) {
      normalized.title = source.chapter;
    } else if (source.content) {
      normalized.text = source.content;
    } else if (source.description) {
      normalized.text = source.description;
    }

    // If still no identifier, create one from available data
    if (!normalized.title && !normalized.text && !normalized.source) {
      const keys = Object.keys(source);
      if (keys.length > 0) {
        // Use first string value as title
        for (const key of keys) {
          if (typeof source[key] === 'string' && source[key].length > 0) {
            normalized.title = source[key];
            break;
          }
        }
      }
    }

    return normalized;
  }

  flattenNestedSources(nestedObj) {
    const flattened = [];

    for (const [key, value] of Object.entries(nestedObj)) {
      if (Array.isArray(value)) {
        // Array of items under a category key
        for (const item of value) {
          if (typeof item === 'string') {
            flattened.push({ title: item, category: key });
          } else if (typeof item === 'object' && item !== null) {
            const normalized = this.normalizeSourceObject(item);
            normalized.category = normalized.category || key;
            flattened.push(normalized);
          }
        }
      } else if (typeof value === 'string') {
        // Single string value
        flattened.push({ title: value, category: key });
      } else if (typeof value === 'object' && value !== null) {
        // Nested object - flatten recursively
        const subItems = this.flattenNestedSources(value);
        for (const subItem of subItems) {
          subItem.category = subItem.category || key;
          flattened.push(subItem);
        }
      }
    }

    return flattened;
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('SOURCES FORMAT FIX REPORT');
    console.log('='.repeat(60));
    console.log(`\nFixes Applied:`);
    console.log(`  String arrays converted: ${this.fixes.stringArraysFixed}`);
    console.log(`  Nested objects flattened: ${this.fixes.nestedObjectsFlattened}`);
    console.log(`  Source objects normalized: ${this.fixes.primarySourcesNormalized}`);
    console.log(`  Files modified: ${this.fixes.filesModified}`);

    const totalFixes = this.fixes.stringArraysFixed +
                       this.fixes.nestedObjectsFlattened +
                       this.fixes.primarySourcesNormalized;
    console.log(`\nTotal sources fields fixed: ${totalFixes}`);

    if (this.issues.length > 0) {
      console.log(`\nErrors encountered: ${this.issues.length}`);
      this.issues.slice(0, 5).forEach(issue => {
        console.log(`  ${path.basename(issue.file)}: ${issue.error}`);
      });
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
  const fixer = new SourcesFormatFixer(assetsPath, dryRun);

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

module.exports = { SourcesFormatFixer };
