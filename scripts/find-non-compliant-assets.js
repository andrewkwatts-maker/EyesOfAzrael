/**
 * Find Non-Compliant Assets Script
 *
 * Scans all assets in firebase-assets-downloaded/ and identifies assets
 * that are missing relatedEntities field.
 *
 * Reports include:
 * - Grouping by mythology
 * - Grouping by asset type
 * - Content completeness scores
 *
 * Usage: node scripts/find-non-compliant-assets.js
 */

const fs = require('fs');
const path = require('path');

class NonCompliantAssetFinder {
  constructor() {
    this.assetsPath = this.findAssetsPath();
    this.nonCompliantAssets = [];
    this.allAssets = new Map();

    // Valid mythologies to group by
    this.mythologies = [
      'greek', 'norse', 'celtic', 'egyptian', 'hindu',
      'chinese', 'japanese', 'sumerian', 'roman', 'persian',
      'aztec', 'mayan', 'buddhist', 'christian', 'islamic',
      'jewish', 'tarot'
    ];

    // Asset types to scan
    this.assetTypes = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
      'events', 'concepts', 'archetypes', 'magic', 'angels',
      'beings', 'figures', 'teachings'
    ];
  }

  findAssetsPath() {
    // Prefer firebase-assets-downloaded in project root
    const projectDir = path.join(__dirname, '..');
    const mainAssetsPath = path.join(projectDir, 'firebase-assets-downloaded');

    if (fs.existsSync(path.join(mainAssetsPath, 'deities'))) {
      return mainAssetsPath;
    }

    // Fallback to backups directory
    const backupsDir = path.join(projectDir, 'backups');

    try {
      const dirs = fs.readdirSync(backupsDir);
      const assetDirs = dirs
        .filter(d => d.startsWith('firebase-assets'))
        .sort()
        .reverse();

      for (const dir of assetDirs) {
        const fullPath = path.join(backupsDir, dir);
        const deitiesPath = path.join(fullPath, 'deities');
        if (fs.existsSync(deitiesPath)) {
          return fullPath;
        }
      }
    } catch (e) {
      // Fallback
    }

    return path.join(backupsDir, 'firebase-assets-pre-enrichment');
  }

  loadAllAssets() {
    console.log('Loading assets from:', this.assetsPath);

    for (const assetType of this.assetTypes) {
      const typePath = path.join(this.assetsPath, assetType);
      this.loadAssetType(assetType, typePath);
    }

    console.log(`Loaded ${this.allAssets.size} assets total`);
  }

  loadAssetType(assetType, typePath) {
    if (!fs.existsSync(typePath)) {
      return;
    }

    const entries = fs.readdirSync(typePath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) {
        continue;
      }

      const entryPath = path.join(typePath, entry.name);

      if (entry.isDirectory()) {
        // Scan subdirectory
        this.loadSubdirectory(assetType, entryPath);
      } else if (entry.name.endsWith('.json')) {
        this.loadAssetFile(entryPath, assetType);
      }
    }
  }

  loadSubdirectory(assetType, dirPath) {
    try {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        if (file.endsWith('.json') && !file.startsWith('_')) {
          this.loadAssetFile(path.join(dirPath, file), assetType);
        }
      }
    } catch (error) {
      console.error(`Error reading subdirectory ${dirPath}:`, error.message);
    }
  }

  loadAssetFile(filePath, assetType) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const asset = JSON.parse(content);

      if (asset.id) {
        asset._filePath = filePath;
        asset._assetType = assetType;
        this.allAssets.set(asset.id, asset);
      }
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error.message);
    }
  }

  isNonCompliant(asset) {
    // Non-compliant if relatedEntities is missing or empty
    if (!asset.relatedEntities) {
      return true;
    }

    // Check if it's an empty array
    if (Array.isArray(asset.relatedEntities) && asset.relatedEntities.length === 0) {
      return true;
    }

    // Check if it's an empty object
    if (typeof asset.relatedEntities === 'object' && !Array.isArray(asset.relatedEntities)) {
      const values = Object.values(asset.relatedEntities);
      if (values.length === 0) {
        return true;
      }
      // Check if all arrays inside are empty
      const hasContent = values.some(v => Array.isArray(v) && v.length > 0);
      if (!hasContent) {
        return true;
      }
    }

    return false;
  }

  calculateContentScore(asset) {
    const missing = [];
    let score = 0;
    const maxScore = 100;

    // Description length (25 points)
    const description = asset.description || asset.summary || '';
    if (description.length >= 200) {
      score += 25;
    } else if (description.length >= 100) {
      score += 15;
    } else if (description.length > 0) {
      score += 5;
    } else {
      missing.push('description');
    }

    // Has keyMyths (20 points)
    if (asset.keyMyths && Array.isArray(asset.keyMyths) && asset.keyMyths.length > 0) {
      score += 20;
    } else if (asset.myths && Array.isArray(asset.myths) && asset.myths.length > 0) {
      score += 20;
    } else if (asset.worship?.festivals && asset.worship.festivals.length > 0) {
      score += 10; // Partial credit for related content
    } else {
      missing.push('keyMyths');
    }

    // Has family/relationships (20 points)
    if (asset.family && Object.keys(asset.family).length > 0) {
      score += 20;
    } else if (asset.relationships && typeof asset.relationships === 'object') {
      const relKeys = Object.keys(asset.relationships).filter(k =>
        !['relatedIds', 'collections'].includes(k)
      );
      if (relKeys.length > 0) {
        score += 15;
      } else {
        missing.push('family');
      }
    } else {
      missing.push('family');
    }

    // Has domains (15 points)
    if (asset.domains && Array.isArray(asset.domains) && asset.domains.length > 0) {
      score += 15;
    } else if (asset.role) {
      score += 10; // Partial credit
    } else {
      missing.push('domains');
    }

    // Has symbols (10 points)
    if (asset.symbols && Array.isArray(asset.symbols) && asset.symbols.length > 0) {
      score += 10;
    } else if (asset.symbolism && Array.isArray(asset.symbolism) && asset.symbolism.length > 0) {
      score += 10;
    } else {
      missing.push('symbols');
    }

    // Has sources/references (10 points)
    if (asset.primarySources && Array.isArray(asset.primarySources) && asset.primarySources.length > 0) {
      score += 10;
    } else if (asset.sources && Array.isArray(asset.sources) && asset.sources.length > 0) {
      score += 10;
    } else {
      missing.push('sources');
    }

    return {
      score: Math.round(score),
      missing
    };
  }

  normalizeMythology(mythology) {
    if (!mythology) return 'unknown';

    // Ensure mythology is a string
    if (typeof mythology !== 'string') {
      if (mythology.id) {
        mythology = mythology.id;
      } else if (mythology.name) {
        mythology = mythology.name;
      } else {
        return 'unknown';
      }
    }

    const normalized = mythology.toLowerCase().trim();

    // Map variations to standard names
    const mappings = {
      'greco-roman': 'greek',
      'greco_roman': 'greek',
      'abrahamic': 'jewish',
      'zoroastrian': 'persian',
      'babylonian': 'sumerian',
      'mesopotamian': 'sumerian',
      'mesoamerican': 'aztec',
      'tibetan': 'buddhist',
      'zen': 'buddhist',
      'theravada': 'buddhist',
      'mahayana': 'buddhist',
      'vedic': 'hindu',
      'shinto': 'japanese',
      'taoist': 'chinese',
      'taoism': 'chinese'
    };

    if (mappings[normalized]) {
      return mappings[normalized];
    }

    if (this.mythologies.includes(normalized)) {
      return normalized;
    }

    return 'other';
  }

  normalizeAssetType(assetType) {
    // Convert plural to singular for consistent grouping
    const mappings = {
      'deities': 'deity',
      'heroes': 'hero',
      'creatures': 'creature',
      'items': 'item',
      'places': 'place',
      'texts': 'text',
      'rituals': 'ritual',
      'herbs': 'herb',
      'symbols': 'symbol',
      'events': 'event',
      'concepts': 'concept',
      'archetypes': 'archetype',
      'angels': 'angel',
      'beings': 'being',
      'figures': 'figure',
      'teachings': 'teaching'
    };

    return mappings[assetType] || assetType;
  }

  findNonCompliantAssets() {
    console.log('\nScanning for non-compliant assets...');

    for (const [id, asset] of this.allAssets) {
      if (this.isNonCompliant(asset)) {
        this.nonCompliantAssets.push({
          id,
          name: asset.name || asset.displayName || id,
          mythology: this.normalizeMythology(asset.mythology),
          type: this.normalizeAssetType(asset._assetType),
          filePath: asset._filePath,
          contentScore: this.calculateContentScore(asset)
        });
      }
    }

    console.log(`Found ${this.nonCompliantAssets.length} non-compliant assets`);
  }

  generateReport() {
    // Group by mythology
    const byMythology = {};
    const assetsByMythology = {};

    for (const mythology of [...this.mythologies, 'other', 'unknown']) {
      byMythology[mythology] = 0;
      assetsByMythology[mythology] = [];
    }

    // Group by type
    const byType = {};

    // Content scores
    const contentScores = {};

    for (const asset of this.nonCompliantAssets) {
      // Count by mythology
      const myth = asset.mythology;
      if (byMythology[myth] !== undefined) {
        byMythology[myth]++;
        assetsByMythology[myth].push(asset.id);
      } else {
        byMythology['other']++;
        assetsByMythology['other'].push(asset.id);
      }

      // Count by type
      if (!byType[asset.type]) {
        byType[asset.type] = 0;
      }
      byType[asset.type]++;

      // Store content score
      contentScores[asset.id] = asset.contentScore;
    }

    // Clean up empty mythology groups
    for (const myth of Object.keys(byMythology)) {
      if (byMythology[myth] === 0) {
        delete byMythology[myth];
        delete assetsByMythology[myth];
      }
    }

    // Sort type counts descending
    const sortedByType = {};
    Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, value]) => {
        sortedByType[key] = value;
      });

    // Sort mythology counts descending
    const sortedByMythology = {};
    Object.entries(byMythology)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, value]) => {
        sortedByMythology[key] = value;
      });

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.nonCompliantAssets.length,
        totalAssetsScanned: this.allAssets.size,
        complianceRate: Math.round((1 - this.nonCompliantAssets.length / this.allAssets.size) * 100) + '%',
        byMythology: sortedByMythology,
        byType: sortedByType
      },
      assets: assetsByMythology,
      contentScores: contentScores
    };

    return report;
  }

  saveReport(report) {
    const reportsDir = path.join(__dirname, 'reports');

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, 'non-compliant-assets.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\nReport saved to: ${reportPath}`);
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('NON-COMPLIANT ASSETS REPORT');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Total assets scanned: ${report.summary.totalAssetsScanned}`);
    console.log(`Non-compliant (missing relatedEntities): ${report.summary.total}`);
    console.log(`Compliance rate: ${report.summary.complianceRate}`);

    console.log('\n--- BY MYTHOLOGY ---');
    for (const [myth, count] of Object.entries(report.summary.byMythology)) {
      console.log(`  ${myth}: ${count}`);
    }

    console.log('\n--- BY ASSET TYPE ---');
    for (const [type, count] of Object.entries(report.summary.byType)) {
      console.log(`  ${type}: ${count}`);
    }

    // Show lowest content scores
    console.log('\n--- LOWEST CONTENT SCORES (need most work) ---');
    const sortedScores = Object.entries(report.contentScores)
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, 15);

    for (const [id, scoreInfo] of sortedScores) {
      console.log(`  ${id}: ${scoreInfo.score}% (missing: ${scoreInfo.missing.join(', ')})`);
    }

    console.log('\n' + '='.repeat(60));
  }

  run() {
    console.log('Non-Compliant Asset Finder');
    console.log('==========================\n');

    this.loadAllAssets();
    this.findNonCompliantAssets();

    const report = this.generateReport();
    this.saveReport(report);
    this.printSummary(report);

    return report;
  }
}

// Main execution
if (require.main === module) {
  const finder = new NonCompliantAssetFinder();
  finder.run();
}

module.exports = { NonCompliantAssetFinder };
