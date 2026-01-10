/**
 * Duplicate Asset Checker
 *
 * Identifies duplicate assets by:
 * 1. Exact ID matches across categories
 * 2. Similar names (fuzzy matching)
 * 3. Same name in different mythologies
 * 4. Potential merge candidates
 */

const fs = require('fs').promises;
const path = require('path');

class DuplicateChecker {
  constructor(assetsPath) {
    this.assetsPath = assetsPath || path.join(__dirname, '..', 'firebase-assets-downloaded');
    this.allAssets = new Map(); // id -> asset
    this.assetsByName = new Map(); // normalized name -> [assets]
    this.assetsByCategory = new Map(); // category -> [assets]

    this.results = {
      totalAssets: 0,
      exactIdDuplicates: [],
      similarNames: [],
      crossCategoryDuplicates: [],
      sameMythologyDuplicates: [],
      potentialMerges: [],
      stats: {}
    };
  }

  async loadAllAssets() {
    console.log('Loading assets from:', this.assetsPath);

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
      'archetypes', 'concepts', 'events', 'magic', 'beings',
      'angels', 'figures', 'teachings', 'path'
    ];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.loadCategory(category, categoryPath);
    }

    this.results.totalAssets = this.allAssets.size;
    console.log(`Loaded ${this.results.totalAssets} assets`);
  }

  async loadCategory(category, categoryPath) {
    try {
      const stats = await fs.stat(categoryPath);
      if (!stats.isDirectory()) return;
    } catch {
      return;
    }

    if (!this.assetsByCategory.has(category)) {
      this.assetsByCategory.set(category, []);
    }

    const entries = await fs.readdir(categoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

      const entryPath = path.join(categoryPath, entry.name);

      if (entry.isDirectory()) {
        // Mythology subdirectory
        const subFiles = await fs.readdir(entryPath);
        for (const file of subFiles) {
          if (file.endsWith('.json') && !file.startsWith('_')) {
            await this.loadAssetFile(path.join(entryPath, file), category);
          }
        }
      } else if (entry.name.endsWith('.json')) {
        await this.loadAssetFile(entryPath, category);
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
        asset._fileName = path.basename(filePath);

        // Check for exact ID duplicate
        if (this.allAssets.has(asset.id)) {
          const existing = this.allAssets.get(asset.id);
          this.results.exactIdDuplicates.push({
            id: asset.id,
            locations: [
              { category: existing._category, file: existing._fileName },
              { category: category, file: asset._fileName }
            ]
          });
        }

        this.allAssets.set(asset.id, asset);
        this.assetsByCategory.get(category).push(asset);

        // Index by normalized name
        const normalizedName = this.normalizeName(asset.name || asset.id);
        if (!this.assetsByName.has(normalizedName)) {
          this.assetsByName.set(normalizedName, []);
        }
        this.assetsByName.get(normalizedName).push(asset);
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  normalizeName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;

    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.8;
    }

    // Levenshtein distance
    const matrix = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[s1.length][s2.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - distance / maxLength;
  }

  async findDuplicates() {
    console.log('\nAnalyzing for duplicates...');

    // Find exact name matches across different files
    for (const [normalizedName, assets] of this.assetsByName) {
      if (assets.length > 1) {
        // Group by mythology
        const byMythology = new Map();
        for (const asset of assets) {
          const myth = asset.mythology || 'unknown';
          if (!byMythology.has(myth)) {
            byMythology.set(myth, []);
          }
          byMythology.get(myth).push(asset);
        }

        // Same mythology duplicates
        for (const [mythology, mythAssets] of byMythology) {
          if (mythAssets.length > 1) {
            this.results.sameMythologyDuplicates.push({
              name: assets[0].name,
              normalizedName,
              mythology,
              count: mythAssets.length,
              assets: mythAssets.map(a => ({
                id: a.id,
                name: a.name,
                category: a._category,
                file: a._fileName
              }))
            });
          }
        }

        // Cross-category duplicates (same name, different category)
        const categories = new Set(assets.map(a => a._category));
        if (categories.size > 1) {
          this.results.crossCategoryDuplicates.push({
            name: assets[0].name,
            normalizedName,
            count: assets.length,
            categories: [...categories],
            assets: assets.map(a => ({
              id: a.id,
              name: a.name,
              category: a._category,
              mythology: a.mythology,
              file: a._fileName
            }))
          });
        }
      }
    }

    // Find similar names (fuzzy matching)
    const names = [...this.assetsByName.keys()];
    const checked = new Set();

    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const key = `${names[i]}|${names[j]}`;
        if (checked.has(key)) continue;
        checked.add(key);

        const similarity = this.calculateSimilarity(names[i], names[j]);

        if (similarity >= 0.7 && similarity < 1) {
          const assets1 = this.assetsByName.get(names[i]);
          const assets2 = this.assetsByName.get(names[j]);

          // Check if they're from the same mythology
          const myth1 = new Set(assets1.map(a => a.mythology));
          const myth2 = new Set(assets2.map(a => a.mythology));
          const sharedMythology = [...myth1].filter(m => myth2.has(m));

          if (sharedMythology.length > 0) {
            this.results.similarNames.push({
              similarity: (similarity * 100).toFixed(1) + '%',
              names: [assets1[0].name, assets2[0].name],
              sharedMythology,
              assets: [
                ...assets1.map(a => ({ id: a.id, name: a.name, category: a._category, mythology: a.mythology })),
                ...assets2.map(a => ({ id: a.id, name: a.name, category: a._category, mythology: a.mythology }))
              ]
            });
          }
        }
      }
    }

    // Identify potential merges (same entity in different contexts)
    this.identifyMergeCandidates();

    // Generate stats
    this.results.stats = {
      totalAssets: this.results.totalAssets,
      uniqueNames: this.assetsByName.size,
      exactIdDuplicates: this.results.exactIdDuplicates.length,
      sameMythologyDuplicates: this.results.sameMythologyDuplicates.length,
      crossCategoryDuplicates: this.results.crossCategoryDuplicates.length,
      similarNames: this.results.similarNames.length,
      potentialMerges: this.results.potentialMerges.length
    };
  }

  identifyMergeCandidates() {
    // Look for patterns like "greek_zeus" and "zeus" or "zeus.json" and "greek/zeus.json"
    const idPatterns = new Map();

    for (const [id, asset] of this.allAssets) {
      // Extract base name from ID
      const parts = id.split(/[_-]/);
      const baseName = parts[parts.length - 1];

      if (!idPatterns.has(baseName)) {
        idPatterns.set(baseName, []);
      }
      idPatterns.get(baseName).push(asset);
    }

    for (const [baseName, assets] of idPatterns) {
      if (assets.length > 1 && baseName.length > 2) {
        // Check if they might be the same entity
        const mythologies = new Set(assets.map(a => a.mythology));

        if (mythologies.size === 1 || assets.every(a => !a.mythology)) {
          this.results.potentialMerges.push({
            baseName,
            count: assets.length,
            mythology: [...mythologies][0] || 'unknown',
            assets: assets.map(a => ({
              id: a.id,
              name: a.name,
              category: a._category,
              file: a._fileName,
              contentSize: JSON.stringify(a).length
            }))
          });
        }
      }
    }

    // Sort by count descending
    this.results.potentialMerges.sort((a, b) => b.count - a.count);
  }

  async generateReport() {
    console.log('\nGenerating duplicate report...');

    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    // JSON report
    await fs.writeFile(
      path.join(reportDir, 'duplicate-assets-report.json'),
      JSON.stringify(this.results, null, 2)
    );

    // Markdown summary
    const md = this.generateMarkdownReport();
    await fs.writeFile(
      path.join(reportDir, 'duplicate-assets-summary.md'),
      md
    );

    console.log('Reports saved to scripts/reports/');
  }

  generateMarkdownReport() {
    let md = '# Duplicate Assets Report\n\n';
    md += `**Generated:** ${new Date().toISOString()}\n\n`;

    md += '## Summary\n\n';
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Assets | ${this.results.stats.totalAssets} |\n`;
    md += `| Unique Names | ${this.results.stats.uniqueNames} |\n`;
    md += `| Exact ID Duplicates | ${this.results.stats.exactIdDuplicates} |\n`;
    md += `| Same Mythology Duplicates | ${this.results.stats.sameMythologyDuplicates} |\n`;
    md += `| Cross-Category Duplicates | ${this.results.stats.crossCategoryDuplicates} |\n`;
    md += `| Similar Names | ${this.results.stats.similarNames} |\n`;
    md += `| Potential Merges | ${this.results.stats.potentialMerges} |\n\n`;

    if (this.results.exactIdDuplicates.length > 0) {
      md += '## Exact ID Duplicates (CRITICAL)\n\n';
      md += 'These assets have the exact same ID and should be investigated immediately:\n\n';
      for (const dup of this.results.exactIdDuplicates) {
        md += `- **${dup.id}**\n`;
        for (const loc of dup.locations) {
          md += `  - ${loc.category}/${loc.file}\n`;
        }
      }
      md += '\n';
    }

    if (this.results.sameMythologyDuplicates.length > 0) {
      md += '## Same Mythology Duplicates\n\n';
      md += 'These assets have the same name within the same mythology:\n\n';
      for (const dup of this.results.sameMythologyDuplicates.slice(0, 20)) {
        md += `### ${dup.name} (${dup.mythology})\n`;
        for (const asset of dup.assets) {
          md += `- \`${asset.id}\` in ${asset.category}/${asset.file}\n`;
        }
        md += '\n';
      }
    }

    if (this.results.crossCategoryDuplicates.length > 0) {
      md += '## Cross-Category Duplicates\n\n';
      md += 'Same name appearing in different categories:\n\n';
      for (const dup of this.results.crossCategoryDuplicates.slice(0, 20)) {
        md += `### ${dup.name}\n`;
        md += `Categories: ${dup.categories.join(', ')}\n`;
        for (const asset of dup.assets) {
          md += `- \`${asset.id}\` (${asset.category}) - ${asset.mythology || 'no mythology'}\n`;
        }
        md += '\n';
      }
    }

    if (this.results.potentialMerges.length > 0) {
      md += '## Potential Merge Candidates\n\n';
      md += 'These assets might represent the same entity:\n\n';
      for (const merge of this.results.potentialMerges.slice(0, 20)) {
        md += `### ${merge.baseName} (${merge.mythology})\n`;
        for (const asset of merge.assets) {
          md += `- \`${asset.id}\` (${asset.category}) - ${asset.contentSize} bytes\n`;
        }
        md += '\n';
      }
    }

    return md;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('DUPLICATE ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Assets: ${this.results.stats.totalAssets}`);
    console.log(`Unique Names: ${this.results.stats.uniqueNames}`);
    console.log('');
    console.log('Issues Found:');
    console.log(`  - Exact ID Duplicates: ${this.results.stats.exactIdDuplicates}`);
    console.log(`  - Same Mythology Duplicates: ${this.results.stats.sameMythologyDuplicates}`);
    console.log(`  - Cross-Category Duplicates: ${this.results.stats.crossCategoryDuplicates}`);
    console.log(`  - Similar Names: ${this.results.stats.similarNames}`);
    console.log(`  - Potential Merges: ${this.results.stats.potentialMerges}`);
    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const assetsPath = args[0];

  const checker = new DuplicateChecker(assetsPath);

  try {
    await checker.loadAllAssets();
    await checker.findDuplicates();
    await checker.generateReport();
    checker.printSummary();

    // Exit with error if critical duplicates found
    if (checker.results.exactIdDuplicates.length > 0) {
      console.log('\nWARNING: Exact ID duplicates found!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DuplicateChecker };
