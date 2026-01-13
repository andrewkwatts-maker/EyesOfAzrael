const fs = require('fs').promises;
const path = require('path');

/**
 * Audit Content Depth
 *
 * Scores content completeness for all assets based on:
 * - description (30%): 200+ chars for full points
 * - domains/epithets (15%): 3+ items for full points
 * - relatedEntities (20%): 5+ links for full points
 * - sources (15%): 2+ sources for full points
 * - cross_cultural_parallels (10%): 1+ parallel for full points
 * - family/relationships (10%): Has parent/child for full points
 */

class ContentDepthAuditor {
  constructor(assetsPath) {
    this.assetsPath = assetsPath;
    this.assets = [];
    this.stats = {
      totalAssets: 0,
      byCategory: {},
      byMythology: {},
      scoreDistribution: {
        excellent: 0,  // 80-100
        good: 0,       // 60-79
        fair: 0,       // 40-59
        poor: 0,       // 20-39
        minimal: 0     // 0-19
      },
      averageScore: 0,
      fieldCoverage: {
        description: { count: 0, avgLength: 0 },
        domains: { count: 0, avgItems: 0 },
        epithets: { count: 0, avgItems: 0 },
        relatedEntities: { count: 0, avgLinks: 0 },
        sources: { count: 0, avgSources: 0 },
        cross_cultural_parallels: { count: 0, avgParallels: 0 },
        family: { count: 0 }
      }
    };
    this.lowScoreAssets = [];
    this.highScoreAssets = [];
  }

  async audit() {
    console.log('Auditing content depth...\n');

    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts', 'archetypes', 'magic', 'beings',
                       'mythologies'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.auditCategory(category, categoryPath);
    }

    this.calculateStats();
    this.printReport();
    await this.saveReport();
  }

  async auditCategory(category, categoryPath) {
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
        await this.auditSubdirectory(category, entryPath);
      } else if (entry.name.endsWith('.json')) {
        await this.auditAssetFile(category, entryPath);
      }
    }
  }

  async auditSubdirectory(category, dirPath) {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        await this.auditAssetFile(category, path.join(dirPath, file));
      }
    }
  }

  async auditAssetFile(category, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        for (const asset of data) {
          if (asset && asset.id) {
            this.scoreAsset(asset, category, filePath);
          }
        }
      } else if (data.id) {
        this.scoreAsset(data, category, filePath);
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  scoreAsset(asset, category, filePath) {
    const scores = {
      description: this.scoreDescription(asset),
      domainsEpithets: this.scoreDomainsEpithets(asset),
      relatedEntities: this.scoreRelatedEntities(asset),
      sources: this.scoreSources(asset),
      crossCultural: this.scoreCrossCultural(asset),
      family: this.scoreFamily(asset)
    };

    // Weighted total
    const total = Math.round(
      scores.description * 0.30 +
      scores.domainsEpithets * 0.15 +
      scores.relatedEntities * 0.20 +
      scores.sources * 0.15 +
      scores.crossCultural * 0.10 +
      scores.family * 0.10
    );

    const assetData = {
      id: asset.id,
      name: asset.name || asset.id,
      category,
      mythology: this.getMythology(asset),
      score: total,
      scores,
      filePath: path.relative(this.assetsPath, filePath)
    };

    this.assets.push(assetData);
    this.updateFieldCoverage(asset);
  }

  scoreDescription(asset) {
    const desc = asset.description || '';
    const length = desc.length;

    if (length >= 500) return 100;
    if (length >= 300) return 80;
    if (length >= 200) return 60;
    if (length >= 100) return 40;
    if (length > 0) return 20;
    return 0;
  }

  scoreDomainsEpithets(asset) {
    const domains = Array.isArray(asset.domains) ? asset.domains.length : 0;
    const epithets = Array.isArray(asset.epithets) ? asset.epithets.length : 0;
    const total = domains + epithets;

    if (total >= 6) return 100;
    if (total >= 4) return 80;
    if (total >= 3) return 60;
    if (total >= 2) return 40;
    if (total >= 1) return 20;
    return 0;
  }

  scoreRelatedEntities(asset) {
    let count = 0;

    // Count related entities in various fields
    if (asset.relatedEntities) {
      for (const [key, entities] of Object.entries(asset.relatedEntities)) {
        if (Array.isArray(entities)) {
          count += entities.length;
        }
      }
    }

    // Also count family members
    if (asset.family) {
      for (const [key, members] of Object.entries(asset.family)) {
        if (Array.isArray(members)) {
          count += members.length;
        } else if (typeof members === 'object' && members !== null) {
          count += 1;
        }
      }
    }

    // Count direct links
    if (Array.isArray(asset.associations)) count += asset.associations.length;
    if (Array.isArray(asset.symbols)) count += asset.symbols.length;

    if (count >= 10) return 100;
    if (count >= 7) return 80;
    if (count >= 5) return 60;
    if (count >= 3) return 40;
    if (count >= 1) return 20;
    return 0;
  }

  scoreSources(asset) {
    let count = 0;

    if (Array.isArray(asset.sources)) count += asset.sources.length;
    if (Array.isArray(asset.primarySources)) count += asset.primarySources.length;
    if (Array.isArray(asset.secondarySources)) count += asset.secondarySources.length;

    if (count >= 5) return 100;
    if (count >= 3) return 80;
    if (count >= 2) return 60;
    if (count >= 1) return 40;
    return 0;
  }

  scoreCrossCultural(asset) {
    const parallels = asset.cross_cultural_parallels;
    if (!Array.isArray(parallels)) return 0;

    if (parallels.length >= 5) return 100;
    if (parallels.length >= 3) return 80;
    if (parallels.length >= 2) return 60;
    if (parallels.length >= 1) return 40;
    return 0;
  }

  scoreFamily(asset) {
    const family = asset.family;
    if (!family || typeof family !== 'object') return 0;

    let hasData = false;

    // Check for various family fields
    const fields = ['parents', 'children', 'siblings', 'consorts', 'spouse', 'father', 'mother'];
    for (const field of fields) {
      if (family[field]) {
        if (Array.isArray(family[field]) && family[field].length > 0) {
          hasData = true;
        } else if (typeof family[field] === 'object' || typeof family[field] === 'string') {
          hasData = true;
        }
      }
    }

    return hasData ? 100 : 0;
  }

  getMythology(asset) {
    if (asset.mythology && typeof asset.mythology === 'string') {
      return asset.mythology.toLowerCase();
    }

    // Extract from ID
    const idParts = asset.id.split(/[_-]/);
    const mythologies = ['greek', 'norse', 'roman', 'hindu', 'egyptian', 'celtic',
                        'aztec', 'mayan', 'japanese', 'chinese', 'sumerian', 'babylonian',
                        'persian', 'slavic', 'yoruba', 'polynesian', 'buddhist', 'christian',
                        'islamic', 'jewish', 'tarot'];

    for (const myth of mythologies) {
      if (idParts[0].toLowerCase() === myth) {
        return myth;
      }
    }

    return 'universal';
  }

  updateFieldCoverage(asset) {
    const fc = this.stats.fieldCoverage;

    // Description
    if (asset.description) {
      fc.description.count++;
      fc.description.avgLength += asset.description.length;
    }

    // Domains
    if (Array.isArray(asset.domains) && asset.domains.length > 0) {
      fc.domains.count++;
      fc.domains.avgItems += asset.domains.length;
    }

    // Epithets
    if (Array.isArray(asset.epithets) && asset.epithets.length > 0) {
      fc.epithets.count++;
      fc.epithets.avgItems += asset.epithets.length;
    }

    // Related entities
    if (asset.relatedEntities && Object.keys(asset.relatedEntities).length > 0) {
      fc.relatedEntities.count++;
      let totalLinks = 0;
      for (const entities of Object.values(asset.relatedEntities)) {
        if (Array.isArray(entities)) totalLinks += entities.length;
      }
      fc.relatedEntities.avgLinks += totalLinks;
    }

    // Sources
    const sourceCount = (Array.isArray(asset.sources) ? asset.sources.length : 0) +
                       (Array.isArray(asset.primarySources) ? asset.primarySources.length : 0);
    if (sourceCount > 0) {
      fc.sources.count++;
      fc.sources.avgSources += sourceCount;
    }

    // Cross-cultural parallels
    if (Array.isArray(asset.cross_cultural_parallels) && asset.cross_cultural_parallels.length > 0) {
      fc.cross_cultural_parallels.count++;
      fc.cross_cultural_parallels.avgParallels += asset.cross_cultural_parallels.length;
    }

    // Family
    if (asset.family && Object.keys(asset.family).length > 0) {
      fc.family.count++;
    }
  }

  calculateStats() {
    this.stats.totalAssets = this.assets.length;

    // Score distribution
    for (const asset of this.assets) {
      if (asset.score >= 80) this.stats.scoreDistribution.excellent++;
      else if (asset.score >= 60) this.stats.scoreDistribution.good++;
      else if (asset.score >= 40) this.stats.scoreDistribution.fair++;
      else if (asset.score >= 20) this.stats.scoreDistribution.poor++;
      else this.stats.scoreDistribution.minimal++;

      // Category stats
      if (!this.stats.byCategory[asset.category]) {
        this.stats.byCategory[asset.category] = { count: 0, totalScore: 0 };
      }
      this.stats.byCategory[asset.category].count++;
      this.stats.byCategory[asset.category].totalScore += asset.score;

      // Mythology stats
      if (!this.stats.byMythology[asset.mythology]) {
        this.stats.byMythology[asset.mythology] = { count: 0, totalScore: 0 };
      }
      this.stats.byMythology[asset.mythology].count++;
      this.stats.byMythology[asset.mythology].totalScore += asset.score;
    }

    // Average score
    const totalScore = this.assets.reduce((sum, a) => sum + a.score, 0);
    this.stats.averageScore = Math.round(totalScore / this.assets.length * 10) / 10;

    // Calculate averages for field coverage
    const fc = this.stats.fieldCoverage;
    if (fc.description.count > 0) fc.description.avgLength = Math.round(fc.description.avgLength / fc.description.count);
    if (fc.domains.count > 0) fc.domains.avgItems = Math.round(fc.domains.avgItems / fc.domains.count * 10) / 10;
    if (fc.epithets.count > 0) fc.epithets.avgItems = Math.round(fc.epithets.avgItems / fc.epithets.count * 10) / 10;
    if (fc.relatedEntities.count > 0) fc.relatedEntities.avgLinks = Math.round(fc.relatedEntities.avgLinks / fc.relatedEntities.count * 10) / 10;
    if (fc.sources.count > 0) fc.sources.avgSources = Math.round(fc.sources.avgSources / fc.sources.count * 10) / 10;
    if (fc.cross_cultural_parallels.count > 0) fc.cross_cultural_parallels.avgParallels = Math.round(fc.cross_cultural_parallels.avgParallels / fc.cross_cultural_parallels.count * 10) / 10;

    // Calculate category averages
    for (const [cat, data] of Object.entries(this.stats.byCategory)) {
      data.avgScore = Math.round(data.totalScore / data.count * 10) / 10;
    }

    // Calculate mythology averages
    for (const [myth, data] of Object.entries(this.stats.byMythology)) {
      data.avgScore = Math.round(data.totalScore / data.count * 10) / 10;
    }

    // Top and bottom assets
    this.assets.sort((a, b) => b.score - a.score);
    this.highScoreAssets = this.assets.slice(0, 20);
    this.lowScoreAssets = this.assets.filter(a => a.score < 30).slice(0, 50);
  }

  printReport() {
    console.log('='.repeat(70));
    console.log('CONTENT DEPTH AUDIT REPORT');
    console.log('='.repeat(70));

    console.log(`\nTotal Assets Audited: ${this.stats.totalAssets}`);
    console.log(`Average Content Score: ${this.stats.averageScore}/100`);

    console.log('\n--- Score Distribution ---');
    const dist = this.stats.scoreDistribution;
    const total = this.stats.totalAssets;
    console.log(`  Excellent (80-100): ${dist.excellent} (${(dist.excellent / total * 100).toFixed(1)}%)`);
    console.log(`  Good (60-79):       ${dist.good} (${(dist.good / total * 100).toFixed(1)}%)`);
    console.log(`  Fair (40-59):       ${dist.fair} (${(dist.fair / total * 100).toFixed(1)}%)`);
    console.log(`  Poor (20-39):       ${dist.poor} (${(dist.poor / total * 100).toFixed(1)}%)`);
    console.log(`  Minimal (0-19):     ${dist.minimal} (${(dist.minimal / total * 100).toFixed(1)}%)`);

    console.log('\n--- Field Coverage ---');
    const fc = this.stats.fieldCoverage;
    console.log(`  Description:    ${fc.description.count} assets (${(fc.description.count / total * 100).toFixed(1)}%), avg ${fc.description.avgLength} chars`);
    console.log(`  Domains:        ${fc.domains.count} assets (${(fc.domains.count / total * 100).toFixed(1)}%), avg ${fc.domains.avgItems} items`);
    console.log(`  Epithets:       ${fc.epithets.count} assets (${(fc.epithets.count / total * 100).toFixed(1)}%), avg ${fc.epithets.avgItems} items`);
    console.log(`  Related Ent.:   ${fc.relatedEntities.count} assets (${(fc.relatedEntities.count / total * 100).toFixed(1)}%), avg ${fc.relatedEntities.avgLinks} links`);
    console.log(`  Sources:        ${fc.sources.count} assets (${(fc.sources.count / total * 100).toFixed(1)}%), avg ${fc.sources.avgSources} sources`);
    console.log(`  Cross-Cultural: ${fc.cross_cultural_parallels.count} assets (${(fc.cross_cultural_parallels.count / total * 100).toFixed(1)}%), avg ${fc.cross_cultural_parallels.avgParallels} parallels`);
    console.log(`  Family:         ${fc.family.count} assets (${(fc.family.count / total * 100).toFixed(1)}%)`);

    console.log('\n--- By Category (Top 10 by avg score) ---');
    const sortedCategories = Object.entries(this.stats.byCategory)
      .sort((a, b) => b[1].avgScore - a[1].avgScore)
      .slice(0, 10);
    for (const [cat, data] of sortedCategories) {
      console.log(`  ${cat.padEnd(15)} ${data.count.toString().padStart(5)} assets, avg score: ${data.avgScore}`);
    }

    console.log('\n--- By Mythology (Top 10 by avg score) ---');
    const sortedMythologies = Object.entries(this.stats.byMythology)
      .sort((a, b) => b[1].avgScore - a[1].avgScore)
      .slice(0, 10);
    for (const [myth, data] of sortedMythologies) {
      console.log(`  ${myth.padEnd(15)} ${data.count.toString().padStart(5)} assets, avg score: ${data.avgScore}`);
    }

    console.log('\n--- Highest Scoring Assets (Top 10) ---');
    for (const asset of this.highScoreAssets.slice(0, 10)) {
      console.log(`  ${asset.score.toString().padStart(3)}: ${asset.id} (${asset.category})`);
    }

    console.log('\n--- Lowest Scoring Assets (Bottom 10) ---');
    for (const asset of this.lowScoreAssets.slice(0, 10)) {
      console.log(`  ${asset.score.toString().padStart(3)}: ${asset.id} (${asset.category})`);
    }

    console.log('\n--- Priority Enrichment List ---');
    // Assets with moderate content that could be improved
    const priorityList = this.assets
      .filter(a => a.score >= 20 && a.score < 50)
      .filter(a => ['deities', 'heroes', 'creatures'].includes(a.category))
      .slice(0, 20);

    console.log('  High-value assets needing enrichment:');
    for (const asset of priorityList) {
      console.log(`    ${asset.score.toString().padStart(3)}: ${asset.id} - missing: ${this.getMissingFields(asset.scores).join(', ')}`);
    }

    console.log('\n' + '='.repeat(70));
  }

  getMissingFields(scores) {
    const missing = [];
    if (scores.description < 40) missing.push('description');
    if (scores.domainsEpithets < 40) missing.push('domains/epithets');
    if (scores.relatedEntities < 40) missing.push('related entities');
    if (scores.sources < 40) missing.push('sources');
    if (scores.crossCultural < 40) missing.push('cross-cultural');
    if (scores.family < 40) missing.push('family');
    return missing;
  }

  async saveReport() {
    const reportsPath = path.join(__dirname, '..', 'reports');
    try {
      await fs.mkdir(reportsPath, { recursive: true });
    } catch {}

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAssets: this.stats.totalAssets,
        averageScore: this.stats.averageScore,
        scoreDistribution: this.stats.scoreDistribution,
        fieldCoverage: this.stats.fieldCoverage
      },
      byCategory: this.stats.byCategory,
      byMythology: this.stats.byMythology,
      highScoreAssets: this.highScoreAssets.slice(0, 50),
      lowScoreAssets: this.lowScoreAssets.slice(0, 100),
      priorityEnrichment: this.assets
        .filter(a => a.score >= 20 && a.score < 50)
        .filter(a => ['deities', 'heroes', 'creatures'].includes(a.category))
        .slice(0, 100)
    };

    const reportPath = path.join(reportsPath, 'content-depth-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
  }
}

// Main
async function main() {
  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const auditor = new ContentDepthAuditor(assetsPath);

  try {
    await auditor.audit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ContentDepthAuditor };
