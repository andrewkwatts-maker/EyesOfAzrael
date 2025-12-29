const fs = require('fs').promises;
const path = require('path');

/**
 * Cross-Link Validation System
 *
 * Scans all Firebase assets and validates cross-linking integrity:
 * 1. Link field validation
 * 2. Link format standardization
 * 3. Link resolution (target exists)
 * 4. Bidirectional link completeness
 */

class CrossLinkValidator {
  constructor(assetsPath) {
    this.assetsPath = assetsPath;
    this.allAssets = new Map(); // id -> asset
    this.assetsByMythology = new Map(); // mythology -> [assets]
    this.assetsByType = new Map(); // type -> [assets]

    // Link fields to check
    this.linkFields = [
      'related_deities',
      'related_heroes',
      'related_creatures',
      'related_items',
      'related_places',
      'related_texts',
      'associated_deities',
      'associated_places',
      'associated_heroes',
      'mythology_links',
      'relatedEntities',
      'relationships'
    ];

    // Results
    this.stats = {
      totalAssets: 0,
      totalLinks: 0,
      linksByType: {},
      brokenLinks: [],
      formatIssues: [],
      bidirectionalIssues: [],
      suggestions: []
    };
  }

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
        console.log(`Category ${category} not found or error: ${error.message}`);
      }
    }

    this.stats.totalAssets = this.allAssets.size;
    console.log(`Loaded ${this.stats.totalAssets} assets`);
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
        // It's a direct JSON file or aggregated file
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

  async loadAggregatedFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      // Handle both array and object formats
      const assets = Array.isArray(data) ? data :
                     data.assets ? data.assets :
                     Object.values(data);

      if (Array.isArray(assets)) {
        for (const asset of assets) {
          if (asset && asset.id) {
            asset._category = category;
            asset._filePath = filePath;
            this.indexAsset(asset);
          }
        }
      }
    } catch (error) {
      console.error(`Error loading aggregated file ${filePath}: ${error.message}`);
    }
  }

  indexAsset(asset) {
    this.allAssets.set(asset.id, asset);

    // Index by mythology
    if (asset.mythology) {
      if (!this.assetsByMythology.has(asset.mythology)) {
        this.assetsByMythology.set(asset.mythology, []);
      }
      this.assetsByMythology.get(asset.mythology).push(asset);
    }

    // Index by type/category
    const type = asset.type || asset._category || 'unknown';
    if (!this.assetsByType.has(type)) {
      this.assetsByType.set(type, []);
    }
    this.assetsByType.get(type).push(asset);
  }

  async validateAllLinks() {
    console.log('\nValidating cross-links...');

    for (const [id, asset] of this.allAssets) {
      await this.validateAssetLinks(asset);
    }

    console.log(`\nValidation complete!`);
    console.log(`- Total links analyzed: ${this.stats.totalLinks}`);
    console.log(`- Broken links: ${this.stats.brokenLinks.length}`);
    console.log(`- Format issues: ${this.stats.formatIssues.length}`);
    console.log(`- Bidirectional issues: ${this.stats.bidirectionalIssues.length}`);
  }

  async validateAssetLinks(asset) {
    for (const field of this.linkFields) {
      if (!asset[field]) continue;

      const links = this.extractLinks(asset[field], field);

      for (const link of links) {
        this.stats.totalLinks++;

        // Track by type
        const linkType = this.getLinkType(field);
        this.stats.linksByType[linkType] = (this.stats.linksByType[linkType] || 0) + 1;

        // Validate format
        const formatIssue = this.validateLinkFormat(link, field, asset);
        if (formatIssue) {
          this.stats.formatIssues.push(formatIssue);
        }

        // Validate resolution (target exists)
        const brokenLink = this.validateLinkResolution(link, field, asset);
        if (brokenLink) {
          this.stats.brokenLinks.push(brokenLink);
        }

        // Check bidirectional
        const bidirectionalIssue = this.checkBidirectional(link, field, asset);
        if (bidirectionalIssue) {
          this.stats.bidirectionalIssues.push(bidirectionalIssue);
        }
      }
    }
  }

  extractLinks(value, field) {
    const links = [];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          links.push({ type: 'string', value: item });
        } else if (typeof item === 'object' && item !== null) {
          links.push({ type: 'object', value: item });
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Handle relationship objects
      for (const [key, val] of Object.entries(value)) {
        if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === 'string') {
              links.push({ type: 'string', value: item, relationshipType: key });
            } else if (typeof item === 'object' && item !== null) {
              links.push({ type: 'object', value: item, relationshipType: key });
            }
          }
        } else if (typeof val === 'string') {
          links.push({ type: 'string', value: val, relationshipType: key });
        }
      }
    }

    return links;
  }

  getLinkType(field) {
    if (field.includes('deities') || field.includes('deity')) return 'deity';
    if (field.includes('heroes') || field.includes('hero')) return 'hero';
    if (field.includes('creatures') || field.includes('creature')) return 'creature';
    if (field.includes('items') || field.includes('item')) return 'item';
    if (field.includes('places') || field.includes('place')) return 'place';
    if (field.includes('texts') || field.includes('text')) return 'text';
    return 'other';
  }

  validateLinkFormat(link, field, sourceAsset) {
    // Ideal format: {id: "...", name: "...", type: "..."}
    if (link.type === 'object') {
      const obj = link.value;

      // Check for recommended fields
      if (!obj.id && !obj.name && !obj.link) {
        return {
          assetId: sourceAsset.id,
          assetName: sourceAsset.name,
          field: field,
          issue: 'Object link missing id, name, and link fields',
          link: obj
        };
      }

      // If has 'link' but not 'id', extract ID from link
      if (obj.link && !obj.id) {
        return {
          assetId: sourceAsset.id,
          assetName: sourceAsset.name,
          field: field,
          issue: 'Object has link field but missing id field',
          link: obj,
          suggestion: this.extractIdFromLink(obj.link)
        };
      }
    } else if (link.type === 'string') {
      // String links should ideally be IDs, but check if they're URLs
      if (link.value.includes('/') || link.value.includes('.html')) {
        return {
          assetId: sourceAsset.id,
          assetName: sourceAsset.name,
          field: field,
          issue: 'String link appears to be URL instead of ID',
          link: link.value,
          suggestion: this.extractIdFromLink(link.value)
        };
      }
    }

    return null;
  }

  extractIdFromLink(link) {
    if (!link) return null;

    // Extract from HTML link: "../../greek/deities/zeus.html" -> "greek_deity_zeus"
    const match = link.match(/\/([^\/]+)\/([^\/]+)\/([^\/]+)\.html/);
    if (match) {
      const [, mythology, category, name] = match;
      return `${mythology}_${category.replace(/s$/, '')}_${name}`;
    }

    // Extract from path
    const parts = link.split('/').filter(p => p && p !== '..' && p !== '.');
    if (parts.length >= 2) {
      const name = parts[parts.length - 1].replace('.html', '');
      const category = parts[parts.length - 2];
      const mythology = parts[parts.length - 3] || '';
      return `${mythology}_${category.replace(/s$/, '')}_${name}`;
    }

    return null;
  }

  validateLinkResolution(link, field, sourceAsset) {
    const targetId = this.getTargetId(link);
    if (!targetId) return null;

    // Check if target exists
    if (!this.allAssets.has(targetId)) {
      return {
        assetId: sourceAsset.id,
        assetName: sourceAsset.name,
        assetMythology: sourceAsset.mythology,
        field: field,
        targetId: targetId,
        issue: 'Target asset not found',
        link: link
      };
    }

    // Validate mythology consistency
    const targetAsset = this.allAssets.get(targetId);
    if (sourceAsset.mythology && targetAsset.mythology) {
      if (sourceAsset.mythology !== targetAsset.mythology) {
        // Cross-mythology link - not necessarily broken, but note it
        this.stats.suggestions.push({
          type: 'cross-mythology',
          sourceId: sourceAsset.id,
          sourceMythology: sourceAsset.mythology,
          targetId: targetId,
          targetMythology: targetAsset.mythology,
          field: field
        });
      }
    }

    return null;
  }

  getTargetId(link) {
    if (link.type === 'object') {
      return link.value.id || this.extractIdFromLink(link.value.link);
    } else if (link.type === 'string') {
      return link.value.includes('/') ? this.extractIdFromLink(link.value) : link.value;
    }
    return null;
  }

  checkBidirectional(link, field, sourceAsset) {
    const targetId = this.getTargetId(link);
    if (!targetId) return null;

    const targetAsset = this.allAssets.get(targetId);
    if (!targetAsset) return null; // Already reported as broken

    // Determine reverse field
    const reverseField = this.getReverseField(field, sourceAsset._category);
    if (!reverseField) return null; // Some links don't need to be bidirectional

    // Check if reverse link exists
    const hasReverseLink = this.hasLinkTo(targetAsset, reverseField, sourceAsset.id);

    if (!hasReverseLink) {
      return {
        sourceId: sourceAsset.id,
        sourceName: sourceAsset.name,
        sourceCategory: sourceAsset._category,
        targetId: targetId,
        targetName: targetAsset.name,
        targetCategory: targetAsset._category,
        field: field,
        reverseField: reverseField,
        issue: 'Missing bidirectional link'
      };
    }

    return null;
  }

  getReverseField(field, sourceCategory) {
    // Map fields to their reverse equivalents
    const reverseMap = {
      'related_deities': 'related_deities',
      'related_heroes': 'related_heroes',
      'related_creatures': 'related_creatures',
      'related_items': 'related_items',
      'related_places': 'related_places',
      'related_texts': 'related_texts',
      'associated_deities': `related_${sourceCategory}`,
      'associated_places': `related_${sourceCategory}`,
      'relatedEntities': 'relatedEntities'
    };

    return reverseMap[field] || null;
  }

  hasLinkTo(asset, field, targetId) {
    if (!asset[field]) return false;

    const links = this.extractLinks(asset[field], field);

    for (const link of links) {
      const linkTargetId = this.getTargetId(link);
      if (linkTargetId === targetId) {
        return true;
      }
    }

    return false;
  }

  async generateSuggestions() {
    console.log('\nGenerating link suggestions...');

    // Suggest links based on mythology and domain overlap
    for (const [id, asset] of this.allAssets) {
      if (!asset.mythology) continue;

      const sameMyth = this.assetsByMythology.get(asset.mythology) || [];

      for (const candidate of sameMyth) {
        if (candidate.id === id) continue;
        if (candidate._category === asset._category) continue; // Same category

        // Check for domain/symbol overlap
        const overlap = this.calculateOverlap(asset, candidate);

        if (overlap.score > 0.3) {
          this.stats.suggestions.push({
            type: 'domain-overlap',
            sourceId: asset.id,
            sourceName: asset.name,
            sourceCategory: asset._category,
            targetId: candidate.id,
            targetName: candidate.name,
            targetCategory: candidate._category,
            mythology: asset.mythology,
            overlapScore: overlap.score,
            overlappingTerms: overlap.terms,
            suggestedField: `related_${candidate._category}`
          });
        }
      }
    }

    console.log(`Generated ${this.stats.suggestions.length} link suggestions`);
  }

  calculateOverlap(asset1, asset2) {
    // Safely get arrays, handling both array and object types
    const getArray = (obj, key) => {
      const val = obj[key];
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'object') return Object.values(val);
      if (typeof val === 'string') return [val];
      return [];
    };

    const terms1 = new Set([
      ...getArray(asset1, 'domains'),
      ...getArray(asset1, 'symbols'),
      ...getArray(asset1, 'attributes')
    ].map(t => t.toString().toLowerCase()));

    const terms2 = new Set([
      ...getArray(asset2, 'domains'),
      ...getArray(asset2, 'symbols'),
      ...getArray(asset2, 'attributes')
    ].map(t => t.toString().toLowerCase()));

    const overlap = [...terms1].filter(t => terms2.has(t));
    const union = new Set([...terms1, ...terms2]);

    return {
      score: union.size > 0 ? overlap.length / union.size : 0,
      terms: overlap
    };
  }

  async generateReports() {
    console.log('\nGenerating reports...');

    const reportDir = path.join(process.cwd(), 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    // Main validation report
    const validationReport = {
      summary: {
        totalAssets: this.stats.totalAssets,
        totalLinks: this.stats.totalLinks,
        linksByType: this.stats.linksByType,
        brokenLinksCount: this.stats.brokenLinks.length,
        formatIssuesCount: this.stats.formatIssues.length,
        bidirectionalIssuesCount: this.stats.bidirectionalIssues.length,
        suggestionsCount: this.stats.suggestions.length,
        bidirectionalCompleteness: this.calculateBidirectionalCompleteness()
      },
      brokenLinks: this.stats.brokenLinks,
      formatIssues: this.stats.formatIssues,
      bidirectionalIssues: this.stats.bidirectionalIssues,
      suggestions: this.stats.suggestions.slice(0, 100), // Top 100 suggestions
      assetCoverage: this.generateAssetCoverage(),
      mythologyCoverage: this.generateMythologyCoverage()
    };

    await fs.writeFile(
      path.join(reportDir, 'cross-link-validation-report.json'),
      JSON.stringify(validationReport, null, 2)
    );

    // Broken links report
    await fs.writeFile(
      path.join(reportDir, 'broken-links.json'),
      JSON.stringify({
        count: this.stats.brokenLinks.length,
        links: this.stats.brokenLinks
      }, null, 2)
    );

    // Suggestions report
    await fs.writeFile(
      path.join(reportDir, 'link-suggestions.json'),
      JSON.stringify({
        count: this.stats.suggestions.length,
        suggestions: this.stats.suggestions
          .sort((a, b) => (b.overlapScore || 0) - (a.overlapScore || 0))
          .slice(0, 200) // Top 200 suggestions
      }, null, 2)
    );

    console.log(`Reports saved to ${reportDir}/`);
  }

  calculateBidirectionalCompleteness() {
    const total = this.stats.totalLinks;
    const missing = this.stats.bidirectionalIssues.length;
    return total > 0 ? ((total - missing) / total * 100).toFixed(2) + '%' : '0%';
  }

  generateAssetCoverage() {
    const coverage = {};

    for (const [id, asset] of this.allAssets) {
      const linkCount = this.countAssetLinks(asset);
      const category = asset._category || 'unknown';

      if (!coverage[category]) {
        coverage[category] = {
          total: 0,
          withLinks: 0,
          avgLinks: 0,
          totalLinks: 0
        };
      }

      coverage[category].total++;
      coverage[category].totalLinks += linkCount;

      if (linkCount > 0) {
        coverage[category].withLinks++;
      }
    }

    // Calculate averages
    for (const category of Object.keys(coverage)) {
      const data = coverage[category];
      data.avgLinks = data.total > 0 ? (data.totalLinks / data.total).toFixed(2) : 0;
      data.linkCoverage = data.total > 0 ? ((data.withLinks / data.total) * 100).toFixed(2) + '%' : '0%';
    }

    return coverage;
  }

  generateMythologyCoverage() {
    const coverage = {};

    for (const [mythology, assets] of this.assetsByMythology) {
      const totalLinks = assets.reduce((sum, asset) => sum + this.countAssetLinks(asset), 0);
      const assetsWithLinks = assets.filter(asset => this.countAssetLinks(asset) > 0).length;

      coverage[mythology] = {
        totalAssets: assets.length,
        assetsWithLinks: assetsWithLinks,
        totalLinks: totalLinks,
        avgLinks: assets.length > 0 ? (totalLinks / assets.length).toFixed(2) : 0,
        linkCoverage: assets.length > 0 ? ((assetsWithLinks / assets.length) * 100).toFixed(2) + '%' : '0%'
      };
    }

    return coverage;
  }

  countAssetLinks(asset) {
    let count = 0;

    for (const field of this.linkFields) {
      if (!asset[field]) continue;
      const links = this.extractLinks(asset[field], field);
      count += links.length;
    }

    return count;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('CROSS-LINK VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Assets Scanned: ${this.stats.totalAssets}`);
    console.log(`Total Links Analyzed: ${this.stats.totalLinks}`);
    console.log('');
    console.log('Links by Type:');
    for (const [type, count] of Object.entries(this.stats.linksByType)) {
      console.log(`  ${type}: ${count}`);
    }
    console.log('');
    console.log(`Broken Links: ${this.stats.brokenLinks.length}`);
    console.log(`Format Issues: ${this.stats.formatIssues.length}`);
    console.log(`Bidirectional Issues: ${this.stats.bidirectionalIssues.length}`);
    console.log(`Bidirectional Completeness: ${this.calculateBidirectionalCompleteness()}`);
    console.log(`Link Suggestions: ${this.stats.suggestions.length}`);
    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const assetsPath = path.join(__dirname, '..', 'firebase-assets-enhanced');
  const validator = new CrossLinkValidator(assetsPath);

  try {
    await validator.loadAllAssets();
    await validator.validateAllLinks();
    await validator.generateSuggestions();
    await validator.generateReports();
    validator.printSummary();

    console.log('\nValidation complete! Check the reports/ directory for detailed results.');
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CrossLinkValidator };
