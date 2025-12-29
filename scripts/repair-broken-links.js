const fs = require('fs').promises;
const path = require('path');

/**
 * CROSS-LINK REPAIR SYSTEM
 *
 * Automatically repairs broken cross-links in Firebase assets.
 *
 * Error Patterns Fixed:
 * 1. ID prefix mismatches (_cosmology_duat -> egyptian_duat)
 * 2. Malformed relationship strings (newlines, parentheses, colons)
 * 3. Spaces in entity names
 * 4. Missing target entities
 *
 * @author Agent 2
 */

class LinkRepairer {
  constructor(assetsPath, options = {}) {
    this.assetsPath = assetsPath;
    this.dryRun = options.dryRun !== false;
    this.verbose = options.verbose || false;

    this.allAssets = new Map(); // id -> asset
    this.assetsByMythology = new Map(); // mythology -> [assets]

    this.stats = {
      totalAssets: 0,
      totalLinksProcessed: 0,
      fixedLinks: 0,
      removedLinks: 0,
      errors: [],
      fixesByPattern: {
        prefix_underscore: 0,
        contains_newline: 0,
        contains_colon: 0,
        contains_parentheses: 0,
        contains_spaces: 0,
        malformed_relationships: 0,
        other: 0
      }
    };
  }

  /**
   * Load all assets from disk
   */
  async loadAllAssets() {
    console.log('Loading all Firebase assets...');

    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      try {
        await this.loadCategory(category, categoryPath);
      } catch (error) {
        // Category might not exist, skip
      }
    }

    this.stats.totalAssets = this.allAssets.size;
    console.log(`Loaded ${this.stats.totalAssets} assets\n`);
  }

  async loadCategory(category, categoryPath) {
    const stats = await fs.stat(categoryPath).catch(() => null);
    if (!stats || !stats.isDirectory()) return;

    const files = await fs.readdir(categoryPath);

    for (const file of files) {
      if (file.startsWith('_') || file.startsWith('.')) continue;

      const filePath = path.join(categoryPath, file);
      const fileStats = await fs.stat(filePath).catch(() => null);

      if (fileStats && fileStats.isDirectory()) {
        // It's a mythology subdirectory, load files from it
        const mythologyFiles = await fs.readdir(filePath);
        for (const mythFile of mythologyFiles) {
          if (mythFile.endsWith('.json') && !mythFile.startsWith('_')) {
            const mythFilePath = path.join(filePath, mythFile);
            await this.loadAssetFile(mythFilePath, category);
          }
        }
      } else if (file.endsWith('.json')) {
        // It's a direct JSON file
        await this.loadAssetFile(filePath, category);
      }
    }
  }

  async loadAssetFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const asset = JSON.parse(content);

      if (asset.id) {
        asset._category = category;
        asset._filePath = filePath;
        this.indexAsset(asset);
      }
    } catch (error) {
      console.error(`Error loading ${filePath}: ${error.message}`);
    }
  }

  indexAsset(asset) {
    this.allAssets.set(asset.id, asset);

    if (asset.mythology) {
      if (!this.assetsByMythology.has(asset.mythology)) {
        this.assetsByMythology.set(asset.mythology, []);
      }
      this.assetsByMythology.get(asset.mythology).push(asset);
    }
  }

  /**
   * Repair all broken links
   */
  async repairAllLinks() {
    console.log('Repairing broken links...\n');

    for (const [id, asset] of this.allAssets) {
      await this.repairAssetLinks(asset);
    }

    console.log('\nRepair complete!');
    console.log(`- Total assets processed: ${this.stats.totalAssets}`);
    console.log(`- Total links processed: ${this.stats.totalLinksProcessed}`);
    console.log(`- Fixed links: ${this.stats.fixedLinks}`);
    console.log(`- Removed invalid links: ${this.stats.removedLinks}`);
    console.log(`\nFixes by pattern:`);
    Object.entries(this.stats.fixesByPattern).forEach(([pattern, count]) => {
      if (count > 0) {
        console.log(`  ${pattern}: ${count}`);
      }
    });
  }

  /**
   * Repair links in a single asset
   */
  async repairAssetLinks(asset) {
    let modified = false;

    // Repair relatedEntities
    if (asset.relatedEntities && Array.isArray(asset.relatedEntities)) {
      const repaired = this.repairEntityLinks(asset.relatedEntities, asset);
      if (repaired.modified) {
        asset.relatedEntities = repaired.links;
        modified = true;
      }
    }

    // Repair relationships (complex object with relationship types)
    if (asset.relationships && typeof asset.relationships === 'object') {
      const repaired = this.repairRelationships(asset.relationships, asset);
      if (repaired.modified) {
        asset.relationships = repaired.relationships;
        modified = true;
      }
    }

    // Repair other link fields
    const linkFields = [
      'related_deities', 'related_heroes', 'related_creatures',
      'related_items', 'related_places', 'related_texts',
      'associated_deities', 'associated_places', 'associated_heroes',
      'mythology_links'
    ];

    for (const field of linkFields) {
      if (asset[field] && Array.isArray(asset[field])) {
        const repaired = this.repairEntityLinks(asset[field], asset);
        if (repaired.modified) {
          asset[field] = repaired.links;
          modified = true;
        }
      }
    }

    // Save if modified
    if (modified && !this.dryRun) {
      await this.saveAsset(asset);
    }
  }

  /**
   * Repair entity links (relatedEntities format)
   */
  repairEntityLinks(links, asset) {
    const repairedLinks = [];
    let modified = false;

    for (const link of links) {
      this.stats.totalLinksProcessed++;

      // Handle string links
      if (typeof link === 'string') {
        const repaired = this.repairStringLink(link, asset);
        if (repaired) {
          repairedLinks.push(repaired);
          modified = true;
          this.stats.fixedLinks++;
        } else {
          this.stats.removedLinks++;
          modified = true;
        }
        continue;
      }

      // Handle object links
      if (typeof link === 'object' && link !== null) {
        // Extract target ID from link
        const targetId = this.extractTargetId(link, asset);
        if (!targetId) {
          this.stats.removedLinks++;
          modified = true;
          continue;
        }

        // Try to repair the target ID
        const repairedId = this.repairTargetId(targetId, asset);

        // Check if target exists
        if (this.allAssets.has(repairedId)) {
          // Link is valid (or was repaired)
          if (repairedId !== targetId) {
            // ID was repaired
            const targetAsset = this.allAssets.get(repairedId);
            repairedLinks.push({
              type: targetAsset.type || targetAsset._category,
              name: targetAsset.displayName || targetAsset.name,
              id: repairedId
            });
            modified = true;
            this.stats.fixedLinks++;
            this.categorizeFixPattern(targetId);
          } else {
            // Link is already valid
            repairedLinks.push(link);
          }
        } else {
          // Target doesn't exist, remove link
          this.stats.removedLinks++;
          modified = true;
          if (this.verbose) {
            console.log(`  Removed broken link: ${targetId} (from ${asset.id})`);
          }
        }
      }
    }

    return { links: repairedLinks, modified };
  }

  /**
   * Repair relationships object
   */
  repairRelationships(relationships, asset) {
    const repairedRelationships = {};
    let modified = false;

    for (const [relType, value] of Object.entries(relationships)) {
      // Handle string values
      if (typeof value === 'string') {
        const cleaned = this.cleanRelationshipString(value);
        if (cleaned && cleaned !== value) {
          repairedRelationships[relType] = cleaned;
          modified = true;
          this.stats.fixedLinks++;
          this.stats.fixesByPattern.malformed_relationships++;
        } else if (cleaned) {
          repairedRelationships[relType] = cleaned;
        }
        this.stats.totalLinksProcessed++;
        continue;
      }

      // Handle array values
      if (Array.isArray(value)) {
        const cleanedArray = [];
        let arrayModified = false;

        for (const item of value) {
          this.stats.totalLinksProcessed++;

          if (typeof item === 'string') {
            const cleaned = this.cleanRelationshipString(item);
            if (cleaned) {
              cleanedArray.push(cleaned);
              if (cleaned !== item) {
                arrayModified = true;
                this.stats.fixedLinks++;
                this.stats.fixesByPattern.malformed_relationships++;
              }
            } else {
              arrayModified = true;
              this.stats.removedLinks++;
            }
          } else {
            cleanedArray.push(item);
          }
        }

        if (cleanedArray.length > 0) {
          repairedRelationships[relType] = cleanedArray;
          if (arrayModified) {
            modified = true;
          }
        } else if (cleanedArray.length === 0 && value.length > 0) {
          modified = true;
        }
      } else {
        // Keep other types as-is
        repairedRelationships[relType] = value;
      }
    }

    return { relationships: repairedRelationships, modified };
  }

  /**
   * Clean malformed relationship strings
   */
  cleanRelationshipString(str) {
    if (!str || typeof str !== 'string') return null;

    // Remove newlines and excessive whitespace
    let cleaned = str.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // Remove if it contains invalid patterns
    if (cleaned.includes('siblings:') ||
        cleaned.includes('consort:') ||
        cleaned.includes('consort(s):') ||
        cleaned.includes('father:') ||
        cleaned.includes('mother:') ||
        cleaned.includes('allies:') ||
        cleaned.includes('enemies:') ||
        cleaned.includes('stepchildren:')) {
      // These are relationship type markers, not entity names
      return null;
    }

    // Remove if it's too generic
    const generic = ['various', 'none', 'unknown', 'multiple', 'many', 'possibly others'];
    if (generic.includes(cleaned.toLowerCase())) {
      return null;
    }

    // Remove if it's a description rather than a name
    if (cleaned.length > 100) {
      return null;
    }

    // Remove if it's clearly a fragment (starts/ends with special chars)
    if (cleaned.endsWith('(') || cleaned.startsWith(')') ||
        cleaned.endsWith(',') || cleaned === 'of' ||
        cleaned.length <= 2 || cleaned.match(/^[^\w\s]+$/)) {
      return null;
    }

    // Remove if it's a common word rather than a name
    const commonWords = ['protection', 'wisdom', 'disease', 'music', 'lotus',
                         'children', 'enemy', 'murderer', 'advisor', 'advises',
                         'including', 'deception', 'mothers', 'honesty while loki embodies cunning'];
    if (commonWords.includes(cleaned.toLowerCase())) {
      return null;
    }

    return cleaned;
  }

  /**
   * Repair string link (convert to proper format)
   */
  repairStringLink(str, asset) {
    const cleaned = this.cleanRelationshipString(str);
    if (!cleaned) return null;

    // Extract entity name from "name (description)" format
    let entityName = cleaned;
    const parenMatch = cleaned.match(/^([^(]+)\s*\(/);
    if (parenMatch) {
      entityName = parenMatch[1].trim();
    }

    // Try to find matching asset
    let targetId = this.repairTargetId(entityName.toLowerCase().replace(/\s+/g, '-'), asset);

    if (this.allAssets.has(targetId)) {
      const targetAsset = this.allAssets.get(targetId);
      return {
        type: targetAsset.type || targetAsset._category,
        name: targetAsset.displayName || targetAsset.name,
        id: targetId
      };
    }

    // Try without descriptions/notes
    if (entityName !== cleaned) {
      targetId = this.repairTargetId(entityName.toLowerCase().replace(/\s+/g, '-'), asset);
      if (this.allAssets.has(targetId)) {
        const targetAsset = this.allAssets.get(targetId);
        return {
          type: targetAsset.type || targetAsset._category,
          name: targetAsset.displayName || targetAsset.name,
          id: targetId
        };
      }
    }

    return null;
  }

  /**
   * Extract target ID from a link object
   */
  extractTargetId(link, asset) {
    // Check common link formats
    if (link.id) return link.id;
    if (link.targetId) return link.targetId;

    // Try to derive from link path
    if (link.link && typeof link.link === 'string') {
      // Extract from path like "../cosmology/duat.html"
      const match = link.link.match(/\/([^/]+)\.html$/);
      if (match) {
        return match[1];
      }
    }

    // Try to derive from name
    if (link.name && asset.mythology) {
      const id = link.name.toLowerCase().replace(/\s+/g, '-');
      return `${asset.mythology}_${id}`;
    }

    return null;
  }

  /**
   * Repair target ID patterns
   */
  repairTargetId(targetId, asset) {
    if (!targetId) return targetId;

    let repaired = targetId;

    // Fix underscore prefix patterns
    if (repaired.startsWith('_')) {
      // Remove leading underscore
      repaired = repaired.substring(1);

      // Convert _cosmology_duat to egyptian_duat (or other mythology)
      if (repaired.startsWith('cosmology_') && asset.mythology) {
        const conceptName = repaired.replace('cosmology_', '');
        repaired = `${asset.mythology}_${conceptName}`;
      }
    }

    // Try mythology prefix if asset has mythology
    if (!this.allAssets.has(repaired) && asset.mythology) {
      const withMythology = `${asset.mythology}_${repaired}`;
      if (this.allAssets.has(withMythology)) {
        repaired = withMythology;
      }
    }

    return repaired;
  }

  /**
   * Categorize fix pattern for statistics
   */
  categorizeFixPattern(originalId) {
    if (originalId.startsWith('_')) {
      this.stats.fixesByPattern.prefix_underscore++;
    } else if (originalId.includes('\n')) {
      this.stats.fixesByPattern.contains_newline++;
    } else if (originalId.includes(':')) {
      this.stats.fixesByPattern.contains_colon++;
    } else if (originalId.includes('(') && originalId.includes(')')) {
      this.stats.fixesByPattern.contains_parentheses++;
    } else if (originalId.includes(' ')) {
      this.stats.fixesByPattern.contains_spaces++;
    } else {
      this.stats.fixesByPattern.other++;
    }
  }

  /**
   * Save repaired asset to disk
   */
  async saveAsset(asset) {
    try {
      const filePath = asset._filePath;

      // Remove internal fields before saving
      const toSave = { ...asset };
      delete toSave._category;
      delete toSave._filePath;

      await fs.writeFile(filePath, JSON.stringify(toSave, null, 2) + '\n', 'utf8');

      if (this.verbose) {
        const fileName = filePath.split(path.sep).pop();
        console.log(`Saved repairs to ${fileName}`);
      }
    } catch (error) {
      this.stats.errors.push({
        asset: asset.id,
        error: error.message
      });
      console.error(`Error saving ${asset.id}: ${error.message}`);
    }
  }

  /**
   * Generate repair report
   */
  async generateReport() {
    const reportPath = path.join(__dirname, '../reports/link-repair-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      dryRun: this.dryRun,
      stats: this.stats
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
    console.log(`\nReport saved to ${reportPath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const verbose = args.includes('--verbose');

  console.log('='.repeat(60));
  console.log('CROSS-LINK REPAIR SYSTEM');
  console.log('='.repeat(60));
  console.log();

  if (dryRun) {
    console.log('DRY RUN MODE - No files will be modified');
    console.log('Use --apply to actually fix the links\n');
  } else {
    console.log('APPLY MODE - Files will be modified!\n');
  }

  // Allow specifying assets path via argument
  let assetsPath = args.find(arg => arg.startsWith('--path='));
  if (assetsPath) {
    assetsPath = assetsPath.replace('--path=', '');
  } else {
    assetsPath = path.join(__dirname, '../firebase-assets-enhanced');
  }

  console.log(`Assets path: ${assetsPath}\n`);
  const repairer = new LinkRepairer(assetsPath, { dryRun, verbose });

  await repairer.loadAllAssets();
  await repairer.repairAllLinks();
  await repairer.generateReport();

  console.log('\n' + '='.repeat(60));

  if (dryRun) {
    console.log('To apply these fixes, run: node scripts/repair-broken-links.js --apply');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
