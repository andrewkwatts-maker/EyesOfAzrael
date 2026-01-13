/**
 * Cross-Link Validation and Fix Script
 * Ensures all assets have at least 1 incoming link from other assets
 * Ideally, assets should have multiple navigation links
 */

const fs = require('fs');
const path = require('path');

const ASSET_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Entity types and their relationship fields
const LINK_FIELDS = {
  deities: ['relatedDeities', 'family', 'allies', 'enemies', 'pantheon', 'consort', 'offspring', 'parents'],
  creatures: ['relatedCreatures', 'guardedBy', 'associatedDeities', 'enemies', 'allies'],
  heroes: ['relatedHeroes', 'mentors', 'allies', 'enemies', 'family', 'companions', 'antagonists'],
  items: ['relatedItems', 'wielders', 'creators', 'guardians', 'associatedDeities'],
  places: ['relatedPlaces', 'guardians', 'residents', 'associatedDeities', 'associatedHeroes'],
  archetypes: ['relatedArchetypes', 'manifestations', 'associatedDeities', 'examples'],
  cosmology: ['relatedConcepts', 'realms', 'beings', 'deities'],
  herbs: ['relatedHerbs', 'associatedDeities', 'uses'],
  magic: ['relatedMagic', 'practitioners', 'sources'],
  concepts: ['relatedConcepts', 'examples', 'manifestations']
};

// Load all assets from a directory
function loadAssets(category) {
  const dirPath = path.join(ASSET_DIR, category);
  if (!fs.existsSync(dirPath)) return [];

  const assets = [];
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    if (!file.endsWith('.json') || file.startsWith('_') || file === 'index.json') continue;

    try {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      assets.push({
        id: file.replace('.json', ''),
        category,
        data,
        filePath
      });
    } catch (e) {
      console.error(`Error loading ${file}:`, e.message);
    }
  }

  return assets;
}

// Build a map of all assets
function buildAssetMap(allAssets) {
  const map = new Map();
  for (const asset of allAssets) {
    map.set(asset.id, asset);
    // Also map by name variations
    if (asset.data.name) {
      const normalizedName = asset.data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      map.set(normalizedName, asset);
    }
  }
  return map;
}

// Extract all outgoing links from an asset
function getOutgoingLinks(asset) {
  const links = new Set();
  const fields = LINK_FIELDS[asset.category] || [];

  for (const field of fields) {
    const value = asset.data[field];
    if (!value) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          links.add(item);
        } else if (item && typeof item === 'object') {
          // Handle objects with id, name, or link fields
          if (item.id) links.add(item.id);
          if (item.name) links.add(item.name);
          if (item.link) links.add(item.link);
        }
      }
    } else if (typeof value === 'string') {
      links.add(value);
    } else if (value && typeof value === 'object') {
      if (value.id) links.add(value.id);
      if (value.name) links.add(value.name);
    }
  }

  return links;
}

// Build incoming links map
function buildIncomingLinksMap(allAssets, assetMap) {
  const incomingLinks = new Map();

  // Initialize all assets with empty incoming links
  for (const asset of allAssets) {
    incomingLinks.set(asset.id, new Set());
  }

  // Process all assets and track incoming links
  for (const asset of allAssets) {
    const outgoing = getOutgoingLinks(asset);

    for (const link of outgoing) {
      // Normalize the link
      const normalizedLink = link.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Try to find the target asset
      const target = assetMap.get(normalizedLink) || assetMap.get(link);
      if (target && target.id !== asset.id) {
        const existing = incomingLinks.get(target.id) || new Set();
        existing.add(asset.id);
        incomingLinks.set(target.id, existing);
      }
    }
  }

  return incomingLinks;
}

// Check if category is mythology (not conspiracy/concept)
function isMythologyCategory(category) {
  return ['deities', 'creatures', 'heroes', 'items', 'places', 'archetypes', 'cosmology', 'herbs', 'magic'].includes(category);
}

// Find suggested links for orphan assets
function findSuggestedLinks(orphan, allAssets) {
  const suggestions = [];
  const orphanMythology = orphan.data.mythology || orphan.data.culture || orphan.data.tradition;
  const orphanType = orphan.category;

  for (const asset of allAssets) {
    if (asset.id === orphan.id) continue;

    // IMPORTANT: Mythology assets should NOT link to concepts
    // Concepts can link to mythology, but not vice versa
    if (isMythologyCategory(orphanType) && asset.category === 'concepts') {
      continue; // Skip concepts as suggestions for mythology assets
    }

    const assetMythology = asset.data.mythology || asset.data.culture || asset.data.tradition;

    // Same mythology = good candidate
    if (orphanMythology && assetMythology &&
        String(orphanMythology).toLowerCase() === String(assetMythology).toLowerCase()) {
      suggestions.push({
        asset,
        reason: 'Same mythology',
        score: 3
      });
    }

    // Same category = decent candidate
    if (asset.category === orphanType) {
      const existing = suggestions.find(s => s.asset.id === asset.id);
      if (existing) {
        existing.score += 1;
        existing.reason += ' + same category';
      } else {
        suggestions.push({
          asset,
          reason: 'Same category',
          score: 1
        });
      }
    }
  }

  // Sort by score and return top 5
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// Add a link to an asset
function addLinkToAsset(sourceAsset, targetId, targetName) {
  const linkField = getAppropriateField(sourceAsset.category, targetId);

  if (!sourceAsset.data[linkField]) {
    sourceAsset.data[linkField] = [];
  }

  // Check if link already exists
  const existing = sourceAsset.data[linkField].some(item => {
    if (typeof item === 'string') return item === targetId || item === targetName;
    return item.id === targetId || item.name === targetName;
  });

  if (!existing) {
    sourceAsset.data[linkField].push({
      id: targetId,
      name: targetName
    });
    return true;
  }
  return false;
}

// Get appropriate field for linking based on category
function getAppropriateField(category, targetId) {
  const fieldMap = {
    deities: 'relatedDeities',
    creatures: 'relatedCreatures',
    heroes: 'relatedHeroes',
    items: 'relatedItems',
    places: 'relatedPlaces',
    archetypes: 'relatedArchetypes',
    cosmology: 'relatedConcepts',
    herbs: 'relatedHerbs',
    magic: 'relatedMagic',
    concepts: 'relatedConcepts'
  };
  return fieldMap[category] || 'related';
}

// Save asset back to file
function saveAsset(asset) {
  fs.writeFileSync(asset.filePath, JSON.stringify(asset.data, null, 2));
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fix = args.includes('--fix');
  const minLinks = parseInt(args.find(a => a.startsWith('--min-links='))?.split('=')[1] || '1');

  console.log('\n============================================================');
  console.log('  CROSS-LINK VALIDATION');
  console.log('============================================================');
  console.log(`  Mode: ${dryRun ? 'DRY RUN' : fix ? 'FIX' : 'ANALYSIS'}`);
  console.log(`  Minimum incoming links required: ${minLinks}`);
  console.log('');

  // Load all assets
  const categories = Object.keys(LINK_FIELDS);
  const allAssets = [];

  for (const category of categories) {
    const assets = loadAssets(category);
    allAssets.push(...assets);
    console.log(`  Loaded ${assets.length} ${category}`);
  }

  console.log(`\n  Total assets: ${allAssets.length}\n`);

  // Build maps
  const assetMap = buildAssetMap(allAssets);
  const incomingLinks = buildIncomingLinksMap(allAssets, assetMap);

  // Analyze
  const stats = {
    orphans: [],      // 0 incoming links
    underlinked: [],  // < minLinks incoming links
    wellLinked: [],   // >= minLinks incoming links
    fixed: 0
  };

  for (const asset of allAssets) {
    const incoming = incomingLinks.get(asset.id) || new Set();
    const count = incoming.size;

    if (count === 0) {
      stats.orphans.push({ asset, count });
    } else if (count < minLinks) {
      stats.underlinked.push({ asset, count, from: [...incoming] });
    } else {
      stats.wellLinked.push({ asset, count });
    }
  }

  // Report
  console.log('============================================================');
  console.log('  ANALYSIS RESULTS');
  console.log('============================================================');
  console.log(`  Orphan assets (0 links): ${stats.orphans.length}`);
  console.log(`  Underlinked (< ${minLinks} links): ${stats.underlinked.length}`);
  console.log(`  Well-linked (>= ${minLinks} links): ${stats.wellLinked.length}`);
  console.log('');

  // Show orphans by category
  const orphansByCategory = {};
  for (const { asset } of stats.orphans) {
    orphansByCategory[asset.category] = (orphansByCategory[asset.category] || 0) + 1;
  }

  console.log('  Orphans by category:');
  for (const [cat, count] of Object.entries(orphansByCategory).sort((a,b) => b[1] - a[1])) {
    console.log(`    ${cat}: ${count}`);
  }
  console.log('');

  // Fix orphans if requested
  if (fix && !dryRun && stats.orphans.length > 0) {
    console.log('============================================================');
    console.log('  FIXING ORPHAN ASSETS');
    console.log('============================================================');

    for (const { asset } of stats.orphans) {
      const suggestions = findSuggestedLinks(asset, allAssets);

      if (suggestions.length > 0) {
        // Add the orphan to the top suggestion's related list
        const topSuggestion = suggestions[0];
        const added = addLinkToAsset(
          topSuggestion.asset,
          asset.id,
          asset.data.name || asset.id
        );

        if (added) {
          saveAsset(topSuggestion.asset);
          stats.fixed++;
          console.log(`  ✓ Linked ${asset.id} from ${topSuggestion.asset.id} (${topSuggestion.reason})`);
        }
      }
    }

    console.log(`\n  Fixed ${stats.fixed} orphan assets`);
  }

  // Show sample orphans for manual review
  if (stats.orphans.length > 0 && !fix) {
    console.log('\n  Sample orphan assets (first 20):');
    for (const { asset } of stats.orphans.slice(0, 20)) {
      const suggestions = findSuggestedLinks(asset, allAssets);
      const suggestionText = suggestions.length > 0
        ? `(suggest: ${suggestions[0].asset.id})`
        : '(no suggestions)';
      console.log(`    - ${asset.category}/${asset.id} ${suggestionText}`);
    }
  }

  // Statistics summary
  console.log('\n============================================================');
  console.log('  SUMMARY');
  console.log('============================================================');
  const coverage = ((stats.wellLinked.length + stats.underlinked.length) / allAssets.length * 100).toFixed(1);
  console.log(`  Total assets: ${allAssets.length}`);
  console.log(`  Assets with links: ${stats.wellLinked.length + stats.underlinked.length} (${coverage}%)`);
  console.log(`  Orphan assets: ${stats.orphans.length}`);
  if (fix) {
    console.log(`  Fixed: ${stats.fixed}`);
  }
  console.log('');

  // Save report
  const reportPath = path.join(__dirname, 'crosslink-report.json');
  const report = {
    generatedAt: new Date().toISOString(),
    stats: {
      total: allAssets.length,
      orphans: stats.orphans.length,
      underlinked: stats.underlinked.length,
      wellLinked: stats.wellLinked.length,
      fixed: stats.fixed
    },
    orphansByCategory,
    orphansList: stats.orphans.map(o => ({
      id: o.asset.id,
      category: o.asset.category,
      name: o.asset.data.name
    }))
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`  Report saved to: ${reportPath}`);
  console.log('');

  // Usage hints
  if (!fix && stats.orphans.length > 0) {
    console.log('  Run with --fix to automatically add links to orphan assets');
    console.log('  Run with --dry-run to preview changes without saving');
    console.log('  Run with --min-links=N to set minimum link threshold');
  }
}

main().catch(console.error);
