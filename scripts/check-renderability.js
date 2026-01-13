const fs = require('fs').promises;
const path = require('path');

/**
 * Check Asset Renderability
 *
 * Validates that all asset fields can be safely rendered:
 * - No deeply nested objects that would show as [object Object]
 * - No circular references
 * - No extremely long text fields
 * - Required fields present
 * - Valid data types
 */

class RenderabilityChecker {
  constructor(assetsPath) {
    this.assetsPath = assetsPath;
    this.issues = [];
    this.assetCount = 0;
    this.fieldStats = {};
  }

  async loadAndCheck() {
    console.log('Checking asset renderability...\n');

    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts', 'archetypes', 'magic', 'beings',
                       'mythologies'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.checkCategory(category, categoryPath);
    }

    this.printReport();
  }

  async checkCategory(category, categoryPath) {
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
        await this.checkSubdirectory(category, entryPath);
      } else if (entry.name.endsWith('.json')) {
        await this.checkAssetFile(category, entryPath);
      }
    }
  }

  async checkSubdirectory(category, dirPath) {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        await this.checkAssetFile(category, path.join(dirPath, file));
      }
    }
  }

  async checkAssetFile(category, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      // Handle array files (aggregated assets)
      if (Array.isArray(data)) {
        for (const asset of data) {
          if (asset && typeof asset === 'object') {
            this.assetCount++;
            this.checkAsset(asset, category, filePath);
          }
        }
        return;
      }

      this.assetCount++;
      this.checkAsset(data, category, filePath);
    } catch (error) {
      this.issues.push({
        file: filePath,
        type: 'parse_error',
        message: error.message
      });
    }
  }

  checkAsset(asset, category, filePath) {
    // Required fields
    if (!asset.id) {
      this.issues.push({ file: filePath, type: 'missing_id', message: 'Missing id field' });
    }
    if (!asset.name && !asset.id) {
      this.issues.push({ file: filePath, type: 'missing_name', message: 'Missing name field' });
    }

    // Check all fields recursively
    this.checkFields(asset, '', filePath);
  }

  checkFields(obj, prefix, filePath, depth = 0) {
    if (depth > 10) {
      this.issues.push({
        file: filePath,
        type: 'deep_nesting',
        field: prefix,
        message: 'Deeply nested object (>10 levels)'
      });
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      // Track field usage
      this.fieldStats[key] = (this.fieldStats[key] || 0) + 1;

      if (value === null || value === undefined) {
        // Null values are fine, will render as empty
        continue;
      }

      if (typeof value === 'string') {
        // Check for extremely long strings
        if (value.length > 50000) {
          this.issues.push({
            file: filePath,
            type: 'long_string',
            field: fieldPath,
            message: `Very long string (${value.length} chars)`
          });
        }
        // Check for HTML that might break rendering
        if (value.includes('<script')) {
          this.issues.push({
            file: filePath,
            type: 'script_tag',
            field: fieldPath,
            message: 'Contains <script> tag'
          });
        }
      } else if (Array.isArray(value)) {
        // Check array items
        value.forEach((item, i) => {
          if (typeof item === 'object' && item !== null) {
            // Check if object has renderable properties
            if (!item.id && !item.name && !item.label && !item.title && !item.text) {
              // Check if it's a complex object that won't render well
              const keys = Object.keys(item);
              if (keys.length > 0 && !this.isRenderableObject(item)) {
                // Only flag if it's not a known structure
                if (!this.isKnownStructure(key, item)) {
                  this.issues.push({
                    file: filePath,
                    type: 'unrenderable_array_item',
                    field: `${fieldPath}[${i}]`,
                    message: `Array item without id/name/label - has keys: ${keys.slice(0, 5).join(', ')}`
                  });
                }
              }
            }
          }
        });
      } else if (typeof value === 'object') {
        // Check if the field value is an object where we expect a string
        // Skip fields inside display config (tableDisplay, listDisplay, sections, etc.)
        const stringFields = ['mythology', 'culture', 'type', 'category', 'icon'];
        const isDisplayConfig = prefix.includes('Display') || prefix.includes('columns') || prefix.includes('sections') || prefix.includes('extendedContent');
        if (stringFields.includes(key) && typeof value === 'object' && !isDisplayConfig) {
          this.issues.push({
            file: filePath,
            type: 'object_instead_of_string',
            field: fieldPath,
            message: `Expected string but got object with keys: ${Object.keys(value).slice(0, 3).join(', ')}`
          });
        }
        // Recurse into nested objects
        this.checkFields(value, fieldPath, filePath, depth + 1);
      }
    }
  }

  isRenderableObject(obj) {
    // Objects that have commonly used renderable properties
    return obj.id || obj.name || obj.label || obj.title || obj.text || obj.description;
  }

  isKnownStructure(key, obj) {
    // Known field patterns that have specific structure
    const knownPatterns = {
      'sources': ['title', 'url', 'type'],
      'primarySources': ['title', 'url'],
      'family': ['id', 'name', 'relationship'],
      'symbolism': ['meaning', 'context'],
      'rituals': ['name', 'description'],
      'domains': true, // domains can have any structure
      'attributes': true,
      'metadata': true
    };

    return knownPatterns[key] !== undefined;
  }

  printReport() {
    console.log('='.repeat(60));
    console.log('RENDERABILITY CHECK REPORT');
    console.log('='.repeat(60));
    console.log(`\nAssets Checked: ${this.assetCount}`);
    console.log(`Issues Found: ${this.issues.length}`);

    // Group issues by type
    const byType = {};
    for (const issue of this.issues) {
      if (!byType[issue.type]) byType[issue.type] = [];
      byType[issue.type].push(issue);
    }

    console.log('\nIssues by Type:');
    for (const [type, issues] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${type}: ${issues.length}`);
    }

    // Show sample issues
    if (this.issues.length > 0) {
      console.log('\nSample Issues (first 20):');
      this.issues.slice(0, 20).forEach(issue => {
        const filename = path.basename(issue.file);
        console.log(`  [${issue.type}] ${filename}: ${issue.field || ''} - ${issue.message}`);
      });
    }

    // Critical issues that need fixing
    const critical = this.issues.filter(i =>
      i.type === 'object_instead_of_string' ||
      i.type === 'script_tag' ||
      i.type === 'parse_error'
    );

    if (critical.length > 0) {
      console.log(`\n⚠️ CRITICAL ISSUES (${critical.length}):`)
      critical.slice(0, 10).forEach(issue => {
        console.log(`  ${path.basename(issue.file)}: ${issue.message}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Main
async function main() {
  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const checker = new RenderabilityChecker(assetsPath);

  try {
    await checker.loadAndCheck();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { RenderabilityChecker };
