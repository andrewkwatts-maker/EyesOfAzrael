/**
 * Mythology Link Validator
 *
 * Validates that links within each mythology are correct and consistent:
 * - Egyptian deities reference Egyptian places, items, etc.
 * - Greek heroes reference Greek deities correctly
 * - Cross-mythology links are intentional and valid
 */

const fs = require('fs').promises;
const path = require('path');

class MythologyLinkValidator {
  constructor(assetsPath) {
    this.assetsPath = assetsPath || path.join(__dirname, '..', 'firebase-assets-downloaded');
    this.allAssets = new Map();
    this.assetsByMythology = new Map();
    this.assetsByType = new Map();

    // Known mythologies
    this.mythologies = [
      'greek', 'roman', 'norse', 'egyptian', 'celtic', 'hindu', 'buddhist',
      'babylonian', 'sumerian', 'persian', 'chinese', 'japanese', 'aztec',
      'mayan', 'islamic', 'christian', 'jewish', 'tarot', 'native_american'
    ];

    // Known valid cross-mythology connections
    this.validCrossMythologyPairs = [
      ['greek', 'roman'], // Zeus/Jupiter equivalents
      ['sumerian', 'babylonian'], // Shared pantheon
      ['hindu', 'buddhist'], // Shared concepts
      ['christian', 'jewish'], // Shared figures
      ['aztec', 'mayan'], // Mesoamerican connections
    ];

    this.results = {
      totalAssets: 0,
      totalLinks: 0,
      validLinks: 0,
      invalidLinks: [],
      suspiciousCrossMythology: [],
      missingMythology: [],
      byMythology: {},
      recommendations: []
    };
  }

  async loadAllAssets() {
    console.log('Loading assets from:', this.assetsPath);

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
      'archetypes', 'concepts', 'events', 'magic'
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

    const entries = await fs.readdir(categoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

      const entryPath = path.join(categoryPath, entry.name);

      if (entry.isDirectory()) {
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
        this.allAssets.set(asset.id, asset);

        // Index by mythology
        const mythology = this.extractMythology(asset);
        if (mythology) {
          if (!this.assetsByMythology.has(mythology)) {
            this.assetsByMythology.set(mythology, []);
          }
          this.assetsByMythology.get(mythology).push(asset);
        }

        // Index by type
        if (!this.assetsByType.has(category)) {
          this.assetsByType.set(category, []);
        }
        this.assetsByType.get(category).push(asset);
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  extractMythology(asset) {
    // Helper to get string value from field that might be string or object
    const getString = (val) => {
      if (!val) return null;
      if (typeof val === 'string') return val.toLowerCase();
      if (typeof val === 'object' && val.name) return val.name.toLowerCase();
      if (typeof val === 'object' && val.id) return val.id.toLowerCase();
      return null;
    };

    // Try various fields
    if (asset.mythology) {
      const myth = getString(asset.mythology);
      if (myth) return myth;
    }
    if (asset.primaryMythology) {
      const myth = getString(asset.primaryMythology);
      if (myth) return myth;
    }

    // Try to extract from ID
    for (const myth of this.mythologies) {
      if (asset.id && asset.id.toLowerCase().includes(myth)) {
        return myth;
      }
    }

    // Try mythologies array
    if (asset.mythologies && asset.mythologies.length > 0) {
      const first = asset.mythologies[0];
      const myth = getString(first);
      if (myth) return myth;
    }

    return null;
  }

  async validateAllLinks() {
    console.log('\nValidating mythology links...');

    for (const [id, asset] of this.allAssets) {
      const sourceMythology = this.extractMythology(asset);
      this.validateAssetLinks(asset, sourceMythology);
    }

    this.generateStatistics();
    console.log(`Validated ${this.results.totalLinks} links`);
  }

  validateAssetLinks(asset, sourceMythology) {
    // Check relatedEntities
    if (asset.relatedEntities && typeof asset.relatedEntities === 'object') {
      for (const [category, entities] of Object.entries(asset.relatedEntities)) {
        if (Array.isArray(entities)) {
          for (const entity of entities) {
            this.validateLink(asset, entity, sourceMythology, `relatedEntities.${category}`);
          }
        }
      }
    }

    // Check family
    if (asset.family && typeof asset.family === 'object') {
      const familyFields = ['parents', 'children', 'siblings', 'consorts', 'ancestors', 'descendants'];
      for (const field of familyFields) {
        if (Array.isArray(asset.family[field])) {
          for (const entity of asset.family[field]) {
            this.validateLink(asset, entity, sourceMythology, `family.${field}`);
          }
        }
      }
    }

    // Check allies/enemies
    for (const field of ['allies', 'enemies']) {
      if (Array.isArray(asset[field])) {
        for (const entity of asset[field]) {
          this.validateLink(asset, entity, sourceMythology, field);
        }
      }
    }
  }

  validateLink(sourceAsset, targetRef, sourceMythology, fieldPath) {
    this.results.totalLinks++;

    if (!targetRef || typeof targetRef !== 'object') return;

    const targetId = targetRef.id;
    if (!targetId) return;

    // Check if target exists
    const targetAsset = this.allAssets.get(targetId);
    const targetMythology = targetAsset
      ? this.extractMythology(targetAsset)
      : this.extractMythologyFromId(targetId);

    // Track valid links
    if (targetAsset) {
      this.results.validLinks++;
    }

    // Check mythology consistency
    if (sourceMythology && targetMythology) {
      if (sourceMythology !== targetMythology) {
        // Check if this is a valid cross-mythology connection
        const isValid = this.isValidCrossMythology(sourceMythology, targetMythology);

        if (!isValid) {
          this.results.suspiciousCrossMythology.push({
            sourceAsset: {
              id: sourceAsset.id,
              name: sourceAsset.name,
              mythology: sourceMythology
            },
            targetRef: {
              id: targetId,
              name: targetRef.name,
              mythology: targetMythology
            },
            field: fieldPath,
            reason: `Cross-mythology link: ${sourceMythology} -> ${targetMythology}`
          });
        }
      }
    }

    // Check for likely errors based on naming
    this.checkNamingConsistency(sourceAsset, targetRef, sourceMythology, fieldPath);
  }

  extractMythologyFromId(id) {
    if (!id) return null;
    const lower = id.toLowerCase();

    for (const myth of this.mythologies) {
      if (lower.startsWith(myth + '_') || lower.startsWith(myth + '-')) {
        return myth;
      }
    }

    return null;
  }

  isValidCrossMythology(myth1, myth2) {
    for (const [a, b] of this.validCrossMythologyPairs) {
      if ((myth1 === a && myth2 === b) || (myth1 === b && myth2 === a)) {
        return true;
      }
    }
    return false;
  }

  checkNamingConsistency(sourceAsset, targetRef, sourceMythology, fieldPath) {
    // Check for common naming errors
    const targetName = (targetRef.name || '').toLowerCase();
    const targetId = (targetRef.id || '').toLowerCase();

    // Egyptian-specific checks
    if (sourceMythology === 'egyptian') {
      const greekNames = ['zeus', 'apollo', 'athena', 'hera', 'poseidon', 'hades'];
      for (const name of greekNames) {
        if (targetName.includes(name) || targetId.includes(name)) {
          if (!targetId.includes('egyptian')) {
            this.results.invalidLinks.push({
              source: { id: sourceAsset.id, mythology: sourceMythology },
              target: { id: targetRef.id, name: targetRef.name },
              field: fieldPath,
              issue: `Egyptian asset referencing Greek deity: ${targetRef.name}`,
              suggestion: 'Check if this should be an Egyptian equivalent'
            });
          }
        }
      }
    }

    // Greek-specific checks
    if (sourceMythology === 'greek') {
      const romanNames = ['jupiter', 'mars', 'venus', 'mercury', 'neptune', 'pluto'];
      for (const name of romanNames) {
        if (targetName.includes(name) || targetId.includes(name)) {
          if (!targetId.includes('roman')) {
            this.results.invalidLinks.push({
              source: { id: sourceAsset.id, mythology: sourceMythology },
              target: { id: targetRef.id, name: targetRef.name },
              field: fieldPath,
              issue: `Greek asset referencing Roman deity: ${targetRef.name}`,
              suggestion: 'Check if this should be the Greek equivalent'
            });
          }
        }
      }
    }

    // Norse-specific checks
    if (sourceMythology === 'norse') {
      const nonNorseNames = ['zeus', 'ra', 'vishnu', 'buddha'];
      for (const name of nonNorseNames) {
        if (targetName.includes(name) || targetId.includes(name)) {
          this.results.invalidLinks.push({
            source: { id: sourceAsset.id, mythology: sourceMythology },
            target: { id: targetRef.id, name: targetRef.name },
            field: fieldPath,
            issue: `Norse asset referencing non-Norse deity: ${targetRef.name}`,
            suggestion: 'Verify this cross-mythology reference is intentional'
          });
        }
      }
    }
  }

  generateStatistics() {
    // Stats by mythology
    for (const [mythology, assets] of this.assetsByMythology) {
      let totalLinks = 0;
      let internalLinks = 0;
      let externalLinks = 0;

      for (const asset of assets) {
        const links = this.countAssetLinks(asset);
        totalLinks += links.total;

        for (const targetId of links.targetIds) {
          const targetAsset = this.allAssets.get(targetId);
          const targetMythology = targetAsset
            ? this.extractMythology(targetAsset)
            : this.extractMythologyFromId(targetId);

          if (targetMythology === mythology) {
            internalLinks++;
          } else {
            externalLinks++;
          }
        }
      }

      this.results.byMythology[mythology] = {
        assetCount: assets.length,
        totalLinks,
        internalLinks,
        externalLinks,
        internalRatio: totalLinks > 0 ? ((internalLinks / totalLinks) * 100).toFixed(1) + '%' : 'N/A'
      };
    }

    // Generate recommendations
    this.generateRecommendations();
  }

  countAssetLinks(asset) {
    const targetIds = [];

    const extractIds = (obj) => {
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (item && typeof item === 'object' && item.id) {
            targetIds.push(item.id);
          }
        }
      }
    };

    if (asset.relatedEntities) {
      for (const entities of Object.values(asset.relatedEntities)) {
        extractIds(entities);
      }
    }

    if (asset.family) {
      for (const members of Object.values(asset.family)) {
        extractIds(members);
      }
    }

    extractIds(asset.allies);
    extractIds(asset.enemies);

    return { total: targetIds.length, targetIds };
  }

  generateRecommendations() {
    // Low internal link ratio
    for (const [mythology, stats] of Object.entries(this.results.byMythology)) {
      const ratio = parseFloat(stats.internalRatio);
      if (ratio < 50 && stats.totalLinks > 10) {
        this.results.recommendations.push({
          mythology,
          issue: `Low internal link ratio (${stats.internalRatio})`,
          suggestion: `Review ${mythology} assets - most links point to other mythologies`
        });
      }
    }

    // Too many suspicious cross-mythology links
    const crossMythByCulprit = new Map();
    for (const issue of this.results.suspiciousCrossMythology) {
      const key = issue.sourceAsset.id;
      if (!crossMythByCulprit.has(key)) {
        crossMythByCulprit.set(key, 0);
      }
      crossMythByCulprit.set(key, crossMythByCulprit.get(key) + 1);
    }

    for (const [assetId, count] of crossMythByCulprit) {
      if (count >= 3) {
        this.results.recommendations.push({
          assetId,
          issue: `${count} suspicious cross-mythology links`,
          suggestion: 'Review this asset for incorrect mythology references'
        });
      }
    }
  }

  async generateReport() {
    console.log('\nGenerating mythology link report...');

    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    // JSON report
    await fs.writeFile(
      path.join(reportDir, 'mythology-links-report.json'),
      JSON.stringify(this.results, null, 2)
    );

    // Markdown summary
    const md = this.generateMarkdownReport();
    await fs.writeFile(
      path.join(reportDir, 'mythology-links-summary.md'),
      md
    );

    console.log('Reports saved to scripts/reports/');
  }

  generateMarkdownReport() {
    let md = '# Mythology Link Validation Report\n\n';
    md += `**Generated:** ${new Date().toISOString()}\n\n`;

    md += '## Summary\n\n';
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Assets | ${this.results.totalAssets} |\n`;
    md += `| Total Links | ${this.results.totalLinks} |\n`;
    md += `| Valid Links | ${this.results.validLinks} |\n`;
    md += `| Invalid Links | ${this.results.invalidLinks.length} |\n`;
    md += `| Suspicious Cross-Mythology | ${this.results.suspiciousCrossMythology.length} |\n\n`;

    md += '## Links by Mythology\n\n';
    md += '| Mythology | Assets | Total Links | Internal | External | Internal Ratio |\n';
    md += '|-----------|--------|-------------|----------|----------|----------------|\n';
    for (const [myth, stats] of Object.entries(this.results.byMythology)) {
      md += `| ${myth} | ${stats.assetCount} | ${stats.totalLinks} | ${stats.internalLinks} | ${stats.externalLinks} | ${stats.internalRatio} |\n`;
    }
    md += '\n';

    if (this.results.invalidLinks.length > 0) {
      md += '## Invalid Links (Action Required)\n\n';
      for (const link of this.results.invalidLinks.slice(0, 30)) {
        md += `- **${link.source.id}** (${link.source.mythology})\n`;
        md += `  - Target: ${link.target.name} (${link.target.id})\n`;
        md += `  - Issue: ${link.issue}\n`;
        md += `  - Suggestion: ${link.suggestion}\n\n`;
      }
    }

    if (this.results.recommendations.length > 0) {
      md += '## Recommendations\n\n';
      for (const rec of this.results.recommendations) {
        md += `- **${rec.mythology || rec.assetId}**: ${rec.issue}\n`;
        md += `  - ${rec.suggestion}\n\n`;
      }
    }

    return md;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('MYTHOLOGY LINK VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Assets: ${this.results.totalAssets}`);
    console.log(`Total Links: ${this.results.totalLinks}`);
    console.log(`Valid Links: ${this.results.validLinks}`);
    console.log('');
    console.log('Issues Found:');
    console.log(`  - Invalid Links: ${this.results.invalidLinks.length}`);
    console.log(`  - Suspicious Cross-Mythology: ${this.results.suspiciousCrossMythology.length}`);
    console.log(`  - Recommendations: ${this.results.recommendations.length}`);
    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const assetsPath = args[0];

  const validator = new MythologyLinkValidator(assetsPath);

  try {
    await validator.loadAllAssets();
    await validator.validateAllLinks();
    await validator.generateReport();
    validator.printSummary();

    // Exit with error if critical issues found
    if (validator.results.invalidLinks.length > 0) {
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

module.exports = { MythologyLinkValidator };
