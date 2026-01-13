const fs = require('fs').promises;
const path = require('path');

/**
 * Fix Conspiracy-Mythology Linking Direction
 *
 * Ensures mythology assets don't link TO conspiracy content,
 * while allowing conspiracy content to link TO mythology.
 *
 * Rules:
 * 1. Mythology entities should not reference conspiracy content
 * 2. Conspiracy content CAN reference mythology entities
 * 3. Bidirectional links must be converted to one-way (conspiracy → mythology)
 */

class ConspiracyLinkFixer {
  constructor(assetsPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.dryRun = dryRun;
    this.allAssets = new Map();
    this.fixes = {
      linksRemoved: 0,
      assetsModified: 0
    };

    // Categories considered legitimate mythology
    this.mythologyCategories = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'cosmology', 'rituals', 'texts', 'herbs', 'symbols',
      'archetypes', 'events'
    ];

    // Conspiracy-related keywords - MUST be explicit conspiracy references
    // These terms indicate actual conspiracy content, not mythology
    this.conspiracyKeywords = [
      'conspiracy',           // Explicit conspiracy label
      'illuminati-conspiracy',
      'nwo-conspiracy',
      'new-world-order-conspiracy',
      'reptilian-conspiracy',
      'ancient-aliens-conspiracy',
      'deep-state',
      'satanic-panic',
      'blood-libel'
    ];

    // Legitimate mythological uses of similar terms (not conspiracies)
    this.legitimateTerms = [
      'annunaki', 'anunnaki',  // Legitimate Sumerian mythology
      'nephilim',              // Biblical mythology
      'freemason',             // Historical context
      'templars', 'templar'    // Historical Knights Templar
    ];
  }

  async loadAssets() {
    console.log('Loading all assets...');

    for (const category of [...this.mythologyCategories, 'concepts', 'magic', 'beings', 'mythologies']) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.loadCategory(category, categoryPath);
    }

    console.log(`Loaded ${this.allAssets.size} assets`);
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
            this.allAssets.set(asset.id, { asset, category, filePath, isArray: true });
          }
        }
      } else if (data.id) {
        this.allAssets.set(data.id, { asset: data, category, filePath, isArray: false });
      }
    } catch {
      // Skip invalid files
    }
  }

  isConspiracyRelated(assetId, assetName = '', assetDescription = '') {
    const idLower = assetId.toLowerCase();
    const nameLower = (assetName || '').toLowerCase();

    // Only check ID and name for conspiracy keywords (not description - too many false positives)
    for (const keyword of this.conspiracyKeywords) {
      // Check if keyword appears as a word boundary in the ID
      const keywordVariants = [
        keyword,
        keyword.replace(/-/g, '_'),
        keyword.replace(/-/g, '')
      ];

      for (const variant of keywordVariants) {
        // Match as complete segment (separated by - or _) or at start/end
        const patterns = [
          new RegExp(`(^|[-_])${variant}([-_]|$)`, 'i'),
          new RegExp(`\\b${variant}\\b`, 'i')
        ];

        for (const pattern of patterns) {
          if (pattern.test(idLower) || pattern.test(nameLower)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  isMythologyAsset(category) {
    return this.mythologyCategories.includes(category);
  }

  async fixLinks() {
    await this.loadAssets();

    console.log('\nScanning for conspiracy link violations...\n');

    const modifiedFiles = new Map();

    for (const [assetId, data] of this.allAssets) {
      const { asset, category, filePath } = data;

      // Only check mythology assets
      if (!this.isMythologyAsset(category)) continue;

      // Skip if the asset itself is conspiracy-related
      if (this.isConspiracyRelated(assetId, asset.name, asset.description)) continue;

      // Check all links
      const violations = this.findViolatingLinks(asset);

      if (violations.length > 0) {
        console.log(`${assetId}: Found ${violations.length} conspiracy link(s)`);

        for (const violation of violations) {
          console.log(`  - Removing link to: ${violation.targetId} (${violation.field})`);
          this.removeLink(asset, violation.field, violation.targetId);
          this.fixes.linksRemoved++;
        }

        if (!modifiedFiles.has(filePath)) {
          modifiedFiles.set(filePath, []);
        }
        modifiedFiles.get(filePath).push(asset);
        this.fixes.assetsModified++;
      }
    }

    // Save modified files
    if (!this.dryRun) {
      for (const [filePath, modifiedAssets] of modifiedFiles) {
        const content = await fs.readFile(filePath, 'utf8');
        let data = JSON.parse(content);

        if (Array.isArray(data)) {
          for (const modifiedAsset of modifiedAssets) {
            const idx = data.findIndex(a => a.id === modifiedAsset.id);
            if (idx >= 0) {
              data[idx] = modifiedAsset;
            }
          }
        } else {
          data = modifiedAssets[0];
        }

        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      }
    }

    this.printReport();
  }

  findViolatingLinks(asset) {
    const violations = [];

    // Check relatedEntities
    const related = asset.relatedEntities || {};
    for (const [field, entities] of Object.entries(related)) {
      if (!Array.isArray(entities)) continue;

      for (const entity of entities) {
        const targetId = typeof entity === 'string' ? entity : entity?.id;
        if (!targetId) continue;

        // Check if target is conspiracy-related
        const targetData = this.allAssets.get(targetId);
        if (targetData) {
          const { asset: targetAsset } = targetData;
          if (this.isConspiracyRelated(targetId, targetAsset.name, targetAsset.description)) {
            violations.push({
              field: `relatedEntities.${field}`,
              targetId
            });
          }
        } else if (this.isConspiracyRelated(targetId)) {
          // Target doesn't exist but ID looks conspiracy-related
          violations.push({
            field: `relatedEntities.${field}`,
            targetId
          });
        }
      }
    }

    // Check family links
    const family = asset.family || {};
    for (const [field, members] of Object.entries(family)) {
      const memberList = Array.isArray(members) ? members : [members];
      for (const member of memberList) {
        const targetId = typeof member === 'string' ? member : member?.id;
        if (targetId && this.isConspiracyRelated(targetId)) {
          violations.push({
            field: `family.${field}`,
            targetId
          });
        }
      }
    }

    return violations;
  }

  removeLink(asset, fieldPath, targetId) {
    const parts = fieldPath.split('.');
    let current = asset;

    // Navigate to parent of the array
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
      if (!current) return;
    }

    const lastField = parts[parts.length - 1];
    const arr = current[lastField];

    if (Array.isArray(arr)) {
      current[lastField] = arr.filter(item => {
        const id = typeof item === 'string' ? item : item?.id;
        return id !== targetId;
      });

      // Remove empty arrays
      if (current[lastField].length === 0) {
        delete current[lastField];
      }
    }
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('CONSPIRACY LINK FIX REPORT');
    console.log('='.repeat(60));
    console.log(`\nLinks removed: ${this.fixes.linksRemoved}`);
    console.log(`Assets modified: ${this.fixes.assetsModified}`);
    console.log('='.repeat(60));

    if (this.dryRun) {
      console.log('\nDRY RUN - No files modified');
      console.log('Run with --apply flag to apply fixes');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const fixer = new ConspiracyLinkFixer(assetsPath, dryRun);

  try {
    await fixer.fixLinks();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ConspiracyLinkFixer };
