/**
 * Prepare Generation Context
 *
 * Extracts rich context from broken links report to prepare
 * for generating missing entities with Gemini API.
 *
 * Input: reports/broken-links.json
 * Output: reports/generation-queue.json
 */

const fs = require('fs').promises;
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

// Map relationshipType to entity type
const TYPE_MAPPING = {
  'deities': 'deity',
  'heroes': 'hero',
  'creatures': 'creature',
  'places': 'place',
  'items': 'item',
  'rituals': 'ritual',
  'texts': 'text',
  'symbols': 'symbol',
  'concepts': 'concept',
  'cosmology': 'cosmology',
  'archetypes': 'archetype',
  'collections': 'mythology',
  'children': 'deity',
  'parents': 'deity',
  'siblings': 'deity',
  'consorts': 'deity',
  'relatedIds': 'concept',
  'enemies': 'creature',
};

// Valid mythologies
const VALID_MYTHOLOGIES = new Set([
  'greek', 'norse', 'egyptian', 'hindu', 'buddhist', 'christian', 'islamic',
  'babylonian', 'sumerian', 'persian', 'roman', 'celtic', 'chinese', 'japanese',
  'aztec', 'mayan', 'yoruba', 'native_american', 'jewish', 'tarot', 'apocryphal',
  'comparative', 'african', 'polynesian', 'slavic', 'finnish', 'mesopotamian'
]);

class ContextPreparer {
  constructor() {
    this.brokenLinks = [];
    this.assetCache = new Map();
    this.generationQueue = [];
  }

  async loadBrokenLinks() {
    const reportPath = path.join(REPORTS_DIR, 'broken-links.json');
    const content = await fs.readFile(reportPath, 'utf8');
    const report = JSON.parse(content);
    this.brokenLinks = report.links || [];
    console.log('Loaded ' + this.brokenLinks.length + ' broken links');
  }

  async loadAsset(assetId) {
    if (this.assetCache.has(assetId)) {
      return this.assetCache.get(assetId);
    }

    const categories = await fs.readdir(ASSETS_DIR);
    for (const category of categories) {
      const categoryPath = path.join(ASSETS_DIR, category);
      try {
        const stat = await fs.stat(categoryPath);
        if (!stat.isDirectory()) continue;

        const filePath = path.join(categoryPath, assetId + '.json');
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const asset = JSON.parse(content);
          this.assetCache.set(assetId, asset);
          return asset;
        } catch {
          // File not found in this category
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  inferType(relationshipTypes) {
    const counts = {};
    for (const rt of relationshipTypes) {
      const type = TYPE_MAPPING[rt] || 'concept';
      counts[type] = (counts[type] || 0) + 1;
    }

    let maxType = 'concept';
    let maxCount = 0;
    for (const [type, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    }

    return maxType;
  }

  toDisplayName(id) {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/_/g, ' ');
  }

  async prepare() {
    await this.loadBrokenLinks();

    // Group broken links by targetId
    const grouped = new Map();

    for (const link of this.brokenLinks) {
      const targetId = link.targetId;
      if (!targetId || targetId.length > 50) continue;

      if (!grouped.has(targetId)) {
        grouped.set(targetId, {
          targetId,
          displayName: link.link?.value?.name || this.toDisplayName(targetId),
          mythologies: new Set(),
          relationshipTypes: [],
          sourceAssets: new Set(),
          relationships: [],
          count: 0
        });
      }

      const entry = grouped.get(targetId);
      entry.count++;
      entry.sourceAssets.add(link.assetId);
      entry.mythologies.add(link.assetMythology);

      if (link.link?.relationshipType) {
        entry.relationshipTypes.push(link.link.relationshipType);
      }
      if (link.link?.value?.relationship) {
        entry.relationships.push(link.link.value.relationship);
      }
    }

    console.log('Grouped into ' + grouped.size + ' unique missing entities');

    // Build generation queue with context
    for (const [targetId, data] of grouped) {
      const mythologies = [...data.mythologies].filter(m => VALID_MYTHOLOGIES.has(m));
      const inferredMythology = mythologies[0] || 'comparative';
      const inferredType = this.inferType(data.relationshipTypes);

      // Load source assets to get domain context
      const domains = new Set();
      const relatedEntities = new Set();

      for (const sourceId of [...data.sourceAssets].slice(0, 5)) {
        const sourceAsset = await this.loadAsset(sourceId);
        if (sourceAsset) {
          if (sourceAsset.domains) {
            sourceAsset.domains.forEach(d => domains.add(d));
          }
          if (sourceAsset.relatedEntities) {
            for (const category of Object.values(sourceAsset.relatedEntities)) {
              if (Array.isArray(category)) {
                category.slice(0, 3).forEach(e => {
                  if (e.id && e.id !== targetId) {
                    relatedEntities.add(e.id);
                  }
                });
              }
            }
          }
        }
      }

      this.generationQueue.push({
        targetId,
        displayName: data.displayName,
        inferredType,
        inferredMythology,
        referenceCount: data.count,
        context: {
          sourceAssets: [...data.sourceAssets].slice(0, 10),
          relationshipTypes: [...new Set(data.relationshipTypes)],
          relationships: [...new Set(data.relationships)],
          relatedDomains: [...domains].slice(0, 10),
          relatedEntities: [...relatedEntities].slice(0, 10)
        }
      });
    }

    // Sort by reference count
    this.generationQueue.sort((a, b) => b.referenceCount - a.referenceCount);

    // Save queue
    const outputPath = path.join(REPORTS_DIR, 'generation-queue.json');
    await fs.writeFile(outputPath, JSON.stringify(this.generationQueue, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('GENERATION QUEUE PREPARED');
    console.log('='.repeat(60));
    console.log('Total entities to generate: ' + this.generationQueue.length);

    const typeBreakdown = {};
    for (const item of this.generationQueue) {
      typeBreakdown[item.inferredType] = (typeBreakdown[item.inferredType] || 0) + 1;
    }
    console.log('\nBy Type:');
    for (const [type, count] of Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1])) {
      console.log('  ' + type + ': ' + count);
    }

    const mythBreakdown = {};
    for (const item of this.generationQueue) {
      mythBreakdown[item.inferredMythology] = (mythBreakdown[item.inferredMythology] || 0) + 1;
    }
    console.log('\nBy Mythology:');
    for (const [myth, count] of Object.entries(mythBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      console.log('  ' + myth + ': ' + count);
    }

    console.log('\nTop 10 Most Referenced:');
    for (const item of this.generationQueue.slice(0, 10)) {
      console.log('  ' + item.targetId + ' (' + item.referenceCount + ' refs) - ' + item.inferredType + '/' + item.inferredMythology);
    }

    console.log('\nOutput saved to: ' + outputPath);
  }
}

async function main() {
  const preparer = new ContextPreparer();
  await preparer.prepare();
}

main().catch(console.error);
