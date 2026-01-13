const fs = require('fs').promises;
const path = require('path');

/**
 * Audit Content Standards
 *
 * Enforces high content standards:
 * - Minimum 3 pages of content (~4500 chars description)
 * - Rich metadata (domains, epithets, sources)
 * - Proper relationship linking
 * - No mythology → conspiracy links (conspiracies can link to mythology)
 */

class ContentStandardsAuditor {
  constructor(assetsPath) {
    this.assetsPath = assetsPath;
    this.assets = [];
    this.issues = {
      belowStandard: [],
      conspiracyLinkViolations: [],
      missingCriticalFields: [],
      thinContent: []
    };
    this.stats = {
      total: 0,
      meetsStandard: 0,
      needsEnhancement: 0,
      byCategory: {},
      byMythology: {}
    };

    // Content standards (3 pages ≈ 4500 chars, but we'll use tiered thresholds)
    this.standards = {
      description: {
        excellent: 4500,  // 3+ pages
        good: 2000,       // 1-2 pages
        minimum: 500,     // Basic content
        critical: 100     // Needs immediate attention
      },
      domains: { minimum: 3 },
      sources: { minimum: 2 },
      relatedEntities: { minimum: 3 }
    };

    // Categories that are conspiracy-related
    this.conspiracyIndicators = [
      'conspiracy', 'illuminati', 'nwo', 'new world order',
      'reptilian', 'annunaki', 'ancient aliens', 'nephilim conspiracy',
      'secret society', 'freemason conspiracy', 'templars conspiracy'
    ];
  }

  async audit() {
    console.log('Auditing content standards...\n');

    const categories = ['deities', 'heroes', 'creatures', 'items', 'places',
                       'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
                       'events', 'concepts', 'archetypes', 'magic', 'beings',
                       'mythologies'];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.auditCategory(category, categoryPath);
    }

    this.generateReport();
    await this.saveResults();
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
        const files = await fs.readdir(entryPath);
        for (const file of files) {
          if (file.endsWith('.json') && !file.startsWith('_')) {
            await this.auditAssetFile(category, path.join(entryPath, file));
          }
        }
      } else if (entry.name.endsWith('.json')) {
        await this.auditAssetFile(category, entryPath);
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
            this.auditAsset(asset, category, filePath);
          }
        }
      } else if (data.id) {
        this.auditAsset(data, category, filePath);
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  auditAsset(asset, category, filePath) {
    this.stats.total++;

    const issues = [];
    // Check both description and longDescription for content depth
    const descLength = (asset.description || '').length;
    const longDescLength = (asset.longDescription || '').length;
    const totalContentLength = descLength + longDescLength;
    const mythology = this.getMythology(asset);

    // Track by category and mythology
    if (!this.stats.byCategory[category]) {
      this.stats.byCategory[category] = { total: 0, meetsStandard: 0, avgDescLength: 0 };
    }
    this.stats.byCategory[category].total++;
    this.stats.byCategory[category].avgDescLength += totalContentLength;

    if (!this.stats.byMythology[mythology]) {
      this.stats.byMythology[mythology] = { total: 0, meetsStandard: 0 };
    }
    this.stats.byMythology[mythology].total++;

    // Check total content length (description + longDescription)
    if (totalContentLength < this.standards.description.critical) {
      issues.push({
        field: 'content',
        severity: 'critical',
        message: `Content too short: ${totalContentLength} chars (need ${this.standards.description.minimum}+)`,
        currentValue: totalContentLength
      });
    } else if (totalContentLength < this.standards.description.minimum) {
      issues.push({
        field: 'content',
        severity: 'warning',
        message: `Content below minimum: ${totalContentLength} chars (need ${this.standards.description.minimum}+)`,
        currentValue: totalContentLength
      });
    } else if (totalContentLength < this.standards.description.good) {
      issues.push({
        field: 'content',
        severity: 'info',
        message: `Content could be richer: ${totalContentLength} chars (target ${this.standards.description.good}+)`,
        currentValue: totalContentLength
      });
    }

    // Check domains
    const domainCount = Array.isArray(asset.domains) ? asset.domains.length : 0;
    if (domainCount < this.standards.domains.minimum && ['deities', 'heroes', 'creatures'].includes(category)) {
      issues.push({
        field: 'domains',
        severity: 'warning',
        message: `Insufficient domains: ${domainCount} (need ${this.standards.domains.minimum}+)`,
        currentValue: domainCount
      });
    }

    // Check sources
    const sourceCount = this.countSources(asset);
    if (sourceCount < this.standards.sources.minimum) {
      issues.push({
        field: 'sources',
        severity: 'warning',
        message: `Insufficient sources: ${sourceCount} (need ${this.standards.sources.minimum}+)`,
        currentValue: sourceCount
      });
    }

    // Check for conspiracy linking violations
    const linkViolations = this.checkConspiracyLinking(asset, category);
    if (linkViolations.length > 0) {
      this.issues.conspiracyLinkViolations.push({
        id: asset.id,
        name: asset.name,
        category,
        violations: linkViolations,
        filePath: path.relative(this.assetsPath, filePath)
      });
    }

    // Determine if asset meets standard (using total content length)
    const meetsStandard = totalContentLength >= this.standards.description.good &&
                         issues.filter(i => i.severity === 'critical' || i.severity === 'warning').length === 0;

    if (meetsStandard) {
      this.stats.meetsStandard++;
      this.stats.byCategory[category].meetsStandard++;
      this.stats.byMythology[mythology].meetsStandard++;
    } else {
      this.stats.needsEnhancement++;

      // Categorize the issue
      if (totalContentLength < this.standards.description.critical) {
        this.issues.thinContent.push({
          id: asset.id,
          name: asset.name || asset.id,
          category,
          mythology,
          descriptionLength: totalContentLength,
          issues,
          filePath: path.relative(this.assetsPath, filePath),
          priority: this.calculatePriority(asset, category, totalContentLength)
        });
      } else if (issues.some(i => i.severity === 'critical')) {
        this.issues.missingCriticalFields.push({
          id: asset.id,
          name: asset.name || asset.id,
          category,
          mythology,
          issues,
          filePath: path.relative(this.assetsPath, filePath)
        });
      } else {
        this.issues.belowStandard.push({
          id: asset.id,
          name: asset.name || asset.id,
          category,
          mythology,
          descriptionLength: totalContentLength,
          issues,
          filePath: path.relative(this.assetsPath, filePath),
          priority: this.calculatePriority(asset, category, totalContentLength)
        });
      }
    }
  }

  checkConspiracyLinking(asset, category) {
    const violations = [];
    const isConspiracyRelated = this.isConspiracyContent(asset);
    const isMythologyContent = !isConspiracyRelated &&
      ['deities', 'heroes', 'creatures', 'items', 'places', 'cosmology', 'rituals'].includes(category);

    if (!isMythologyContent) return violations;

    // Check all related entities for conspiracy content
    const related = asset.relatedEntities || {};
    for (const [relationType, entities] of Object.entries(related)) {
      if (!Array.isArray(entities)) continue;

      for (const entity of entities) {
        const targetId = typeof entity === 'string' ? entity : entity?.id;
        if (!targetId) continue;

        // Check if linked entity appears to be conspiracy-related
        const targetLower = targetId.toLowerCase();
        for (const indicator of this.conspiracyIndicators) {
          if (targetLower.includes(indicator.replace(/\s+/g, '-')) ||
              targetLower.includes(indicator.replace(/\s+/g, '_'))) {
            violations.push({
              type: 'mythology_to_conspiracy',
              field: `relatedEntities.${relationType}`,
              targetId,
              message: `Mythology asset links to conspiracy-related content: ${targetId}`
            });
          }
        }
      }
    }

    return violations;
  }

  isConspiracyContent(asset) {
    const textToCheck = [
      asset.id,
      asset.name,
      asset.description,
      ...(asset.tags || [])
    ].join(' ').toLowerCase();

    return this.conspiracyIndicators.some(indicator => textToCheck.includes(indicator));
  }

  countSources(asset) {
    let count = 0;
    if (Array.isArray(asset.sources)) count += asset.sources.length;
    if (Array.isArray(asset.primarySources)) count += asset.primarySources.length;
    if (Array.isArray(asset.secondarySources)) count += asset.secondarySources.length;
    return count;
  }

  calculatePriority(asset, category, descLength) {
    let priority = 0;

    // High-value categories get higher priority
    if (['deities', 'heroes'].includes(category)) priority += 30;
    else if (['creatures', 'items'].includes(category)) priority += 20;
    else if (['places', 'cosmology'].includes(category)) priority += 10;

    // More content = lower priority (it's already better)
    priority -= Math.min(descLength / 100, 30);

    // Named entities are higher priority
    if (asset.name && asset.name.length > 0) priority += 10;

    // Entities with existing relationships are higher priority
    const relatedCount = Object.values(asset.relatedEntities || {})
      .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    priority += Math.min(relatedCount * 2, 20);

    return Math.round(priority);
  }

  getMythology(asset) {
    if (asset.mythology && typeof asset.mythology === 'string') {
      return asset.mythology.toLowerCase();
    }
    const idParts = asset.id.split(/[_-]/);
    const mythologies = ['greek', 'norse', 'roman', 'hindu', 'egyptian', 'celtic',
                        'aztec', 'mayan', 'japanese', 'chinese', 'sumerian', 'babylonian',
                        'persian', 'slavic', 'yoruba', 'polynesian', 'buddhist', 'christian',
                        'islamic', 'jewish', 'tarot'];
    for (const myth of mythologies) {
      if (idParts[0].toLowerCase() === myth) return myth;
    }
    return 'universal';
  }

  generateReport() {
    console.log('='.repeat(70));
    console.log('CONTENT STANDARDS AUDIT REPORT');
    console.log('='.repeat(70));

    console.log(`\nTotal Assets: ${this.stats.total}`);
    console.log(`Meets Standard (2000+ chars): ${this.stats.meetsStandard} (${(this.stats.meetsStandard / this.stats.total * 100).toFixed(1)}%)`);
    console.log(`Needs Enhancement: ${this.stats.needsEnhancement} (${(this.stats.needsEnhancement / this.stats.total * 100).toFixed(1)}%)`);

    console.log('\n--- Issues by Severity ---');
    console.log(`  Thin Content (<100 chars): ${this.issues.thinContent.length}`);
    console.log(`  Missing Critical Fields: ${this.issues.missingCriticalFields.length}`);
    console.log(`  Below Standard: ${this.issues.belowStandard.length}`);
    console.log(`  Conspiracy Link Violations: ${this.issues.conspiracyLinkViolations.length}`);

    console.log('\n--- By Category ---');
    const sortedCategories = Object.entries(this.stats.byCategory)
      .sort((a, b) => b[1].total - a[1].total);
    for (const [cat, data] of sortedCategories.slice(0, 10)) {
      const pct = (data.meetsStandard / data.total * 100).toFixed(1);
      const avgLen = Math.round(data.avgDescLength / data.total);
      console.log(`  ${cat.padEnd(15)} ${data.total.toString().padStart(5)} assets, ${pct}% meet standard, avg ${avgLen} chars`);
    }

    console.log('\n--- Priority Enhancement Queue (Top 20) ---');
    const priorityQueue = [...this.issues.belowStandard, ...this.issues.thinContent]
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 20);

    for (const asset of priorityQueue) {
      console.log(`  [P${asset.priority.toString().padStart(2)}] ${asset.id} (${asset.category}) - ${asset.descriptionLength} chars`);
    }

    if (this.issues.conspiracyLinkViolations.length > 0) {
      console.log('\n--- Conspiracy Link Violations ---');
      for (const violation of this.issues.conspiracyLinkViolations.slice(0, 10)) {
        console.log(`  ${violation.id}: ${violation.violations.length} violation(s)`);
        for (const v of violation.violations.slice(0, 3)) {
          console.log(`    - ${v.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
  }

  async saveResults() {
    const reportsPath = path.join(__dirname, '..', 'reports');
    try {
      await fs.mkdir(reportsPath, { recursive: true });
    } catch {}

    // Save full report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.stats.total,
        meetsStandard: this.stats.meetsStandard,
        needsEnhancement: this.stats.needsEnhancement,
        percentageMeetsStandard: (this.stats.meetsStandard / this.stats.total * 100).toFixed(1)
      },
      byCategory: this.stats.byCategory,
      byMythology: this.stats.byMythology,
      issues: this.issues
    };

    await fs.writeFile(
      path.join(reportsPath, 'content-standards-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Save enhancement queue (priority sorted)
    const enhancementQueue = [...this.issues.belowStandard, ...this.issues.thinContent]
      .sort((a, b) => b.priority - a.priority);

    await fs.writeFile(
      path.join(reportsPath, 'enhancement-queue.json'),
      JSON.stringify(enhancementQueue, null, 2)
    );

    console.log(`\nReports saved to ${reportsPath}/`);
    console.log(`  - content-standards-report.json`);
    console.log(`  - enhancement-queue.json (${enhancementQueue.length} assets)`);
  }
}

async function main() {
  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const auditor = new ContentStandardsAuditor(assetsPath);

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

module.exports = { ContentStandardsAuditor };
