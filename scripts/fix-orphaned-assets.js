const fs = require('fs').promises;
const path = require('path');

/**
 * Fix Orphaned Assets Script
 *
 * Identifies assets with no inbound links and adds them to appropriate parent entities.
 * Ensures every asset has at least 1 inbound link for discoverability.
 */

class OrphanFixer {
  constructor(assetsPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.dryRun = dryRun;
    this.assets = new Map(); // id -> {data, filePath, category}
    this.inboundLinks = new Map(); // id -> Set of source ids
    this.orphans = [];
    this.fixes = [];
    this.modifiedFiles = new Set();
  }

  async loadAllAssets() {
    console.log('Loading all assets...');

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
      'events', 'concepts', 'archetypes', 'magic', 'beings',
      'mythologies'
    ];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.loadCategory(category, categoryPath);
    }

    console.log(`Loaded ${this.assets.size} assets`);
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
        // Subdirectory (e.g., deities/greek/)
        await this.loadSubdirectory(category, entryPath);
      } else if (entry.name.endsWith('.json')) {
        await this.loadAssetFile(entryPath, category);
      }
    }
  }

  async loadSubdirectory(category, dirPath) {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        await this.loadAssetFile(path.join(dirPath, file), category);
      }
    }
  }

  async loadAssetFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (data.id) {
        this.assets.set(data.id, {
          data,
          filePath,
          category,
          mythology: data.mythology || this.extractMythology(filePath)
        });
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  extractMythology(filePath) {
    // Extract mythology from path like /deities/greek/zeus.json
    const parts = filePath.split(path.sep);
    const categoryIndex = parts.findIndex(p =>
      ['deities', 'heroes', 'creatures', 'items', 'places', 'concepts'].includes(p)
    );
    if (categoryIndex >= 0 && parts[categoryIndex + 1] && !parts[categoryIndex + 1].endsWith('.json')) {
      return parts[categoryIndex + 1];
    }
    return null;
  }

  buildInboundLinkMap() {
    console.log('Building inbound link map...');

    // Initialize all assets with empty inbound links
    for (const id of this.assets.keys()) {
      this.inboundLinks.set(id, new Set());
    }

    // Scan all assets for outbound links
    for (const [sourceId, asset] of this.assets) {
      const links = this.extractAllLinks(asset.data);

      for (const targetId of links) {
        if (this.inboundLinks.has(targetId)) {
          this.inboundLinks.get(targetId).add(sourceId);
        }
      }
    }
  }

  extractAllLinks(data) {
    const links = new Set();

    // Check relatedEntities
    if (data.relatedEntities) {
      if (Array.isArray(data.relatedEntities)) {
        for (const item of data.relatedEntities) {
          if (typeof item === 'string') links.add(item);
          else if (item?.id) links.add(item.id);
        }
      } else if (typeof data.relatedEntities === 'object') {
        for (const category of Object.values(data.relatedEntities)) {
          if (Array.isArray(category)) {
            for (const item of category) {
              if (typeof item === 'string') links.add(item);
              else if (item?.id) links.add(item.id);
            }
          }
        }
      }
    }

    // Check family relationships
    if (data.family) {
      for (const relation of Object.values(data.family)) {
        if (Array.isArray(relation)) {
          for (const item of relation) {
            if (typeof item === 'string') links.add(item);
            else if (item?.id) links.add(item.id);
          }
        }
      }
    }

    // Check relationships
    if (data.relationships) {
      for (const relation of Object.values(data.relationships)) {
        if (Array.isArray(relation)) {
          for (const item of relation) {
            if (typeof item === 'string') links.add(item);
            else if (item?.id) links.add(item.id);
          }
        }
      }
    }

    // Check associatedDeities
    if (data.associatedDeities && Array.isArray(data.associatedDeities)) {
      for (const item of data.associatedDeities) {
        if (typeof item === 'string') links.add(item);
        else if (item?.id) links.add(item.id);
      }
    }

    // Check cross_cultural_parallels
    if (data.cross_cultural_parallels && Array.isArray(data.cross_cultural_parallels)) {
      for (const item of data.cross_cultural_parallels) {
        if (typeof item === 'string') links.add(item);
        else if (item?.id) links.add(item.id);
      }
    }

    return links;
  }

  findOrphans() {
    console.log('Finding orphaned assets...');

    for (const [id, inbound] of this.inboundLinks) {
      if (inbound.size === 0) {
        const asset = this.assets.get(id);
        if (asset) {
          this.orphans.push({
            id,
            name: asset.data.name,
            category: asset.category,
            mythology: asset.mythology,
            filePath: asset.filePath
          });
        }
      }
    }

    console.log(`Found ${this.orphans.length} orphaned assets`);
  }

  findParentForOrphan(orphan) {
    // Strategy: Find a related asset in the same mythology that can link to this orphan
    const candidates = [];

    for (const [id, asset] of this.assets) {
      if (id === orphan.id) continue;

      // Same mythology is preferred
      if (orphan.mythology && asset.mythology === orphan.mythology) {
        // Calculate relevance score
        let score = 0;

        // Same category gets lower score (we want cross-category links)
        if (asset.category === orphan.category) {
          score += 1;
        } else {
          score += 3;
        }

        // Deities make good parents for everything
        if (asset.category === 'deities') {
          score += 2;
        }

        // Assets with many outbound links are good hubs
        const outboundCount = this.extractAllLinks(asset.data).size;
        if (outboundCount > 5) {
          score += 1;
        }

        candidates.push({ id, asset, score });
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Return top candidate
    return candidates[0] || null;
  }

  async fixOrphans() {
    console.log('Fixing orphaned assets...');

    for (const orphan of this.orphans) {
      const parent = this.findParentForOrphan(orphan);

      if (parent) {
        // Add orphan to parent's relatedEntities
        const fix = {
          parentId: parent.id,
          parentFile: parent.asset.filePath,
          orphanId: orphan.id,
          orphanName: orphan.name,
          orphanCategory: orphan.category
        };

        this.fixes.push(fix);

        if (!this.dryRun) {
          await this.addLinkToAsset(parent.asset, orphan);
        }
      } else {
        console.log(`  No parent found for: ${orphan.id} (${orphan.mythology})`);
      }
    }

    console.log(`Created ${this.fixes.length} fixes`);
  }

  async addLinkToAsset(parentAssetInfo, orphan) {
    const { data, filePath } = parentAssetInfo;

    // Ensure relatedEntities exists and is an object
    if (!data.relatedEntities) {
      data.relatedEntities = {};
    }

    // Ensure the category array exists
    const categoryKey = orphan.category;
    if (!data.relatedEntities[categoryKey]) {
      data.relatedEntities[categoryKey] = [];
    }

    // Check if link already exists
    const existing = data.relatedEntities[categoryKey].find(
      item => (typeof item === 'string' && item === orphan.id) ||
              (item?.id === orphan.id)
    );

    if (!existing) {
      // Add the link
      data.relatedEntities[categoryKey].push({
        id: orphan.id,
        name: orphan.name,
        type: this.categoryToType(orphan.category),
        relationship: 'related'
      });

      // Save the file
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      this.modifiedFiles.add(filePath);
    }
  }

  categoryToType(category) {
    const typeMap = {
      'deities': 'deity',
      'heroes': 'hero',
      'creatures': 'creature',
      'items': 'item',
      'places': 'place',
      'concepts': 'concept',
      'cosmology': 'cosmology',
      'rituals': 'ritual',
      'herbs': 'herb',
      'texts': 'text',
      'symbols': 'symbol',
      'events': 'event',
      'archetypes': 'archetype',
      'magic': 'magic'
    };
    return typeMap[category] || category;
  }

  async generateReport() {
    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    const report = {
      timestamp: new Date().toISOString(),
      mode: this.dryRun ? 'dry-run' : 'applied',
      summary: {
        totalAssets: this.assets.size,
        orphanedAssets: this.orphans.length,
        fixesGenerated: this.fixes.length,
        filesModified: this.modifiedFiles.size
      },
      orphans: this.orphans,
      fixes: this.fixes.slice(0, 100) // First 100 fixes
    };

    await fs.writeFile(
      path.join(reportDir, 'orphan-fix-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`\nReport saved to reports/orphan-fix-report.json`);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('ORPHAN FIX SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Assets: ${this.assets.size}`);
    console.log(`Orphaned Assets: ${this.orphans.length}`);
    console.log(`Fixes Generated: ${this.fixes.length}`);
    if (!this.dryRun) {
      console.log(`Files Modified: ${this.modifiedFiles.size}`);
    }
    console.log('='.repeat(60));

    if (this.dryRun) {
      console.log('\nDRY RUN - No files modified');
      console.log('Run with --apply flag to fix orphans');
    }

    // Show sample orphans by category
    console.log('\nOrphans by category:');
    const byCategory = {};
    for (const orphan of this.orphans) {
      byCategory[orphan.category] = (byCategory[orphan.category] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count}`);
    }
  }

  async run() {
    await this.loadAllAssets();
    this.buildInboundLinkMap();
    this.findOrphans();
    await this.fixOrphans();
    await this.generateReport();
    this.printSummary();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const fixer = new OrphanFixer(assetsPath, dryRun);

  try {
    await fixer.run();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { OrphanFixer };
