/**
 * Migration Validation Script
 * Validates all entities and generates comprehensive migration report
 */

const fs = require('fs');
const path = require('path');

const ENTITIES_DIR = path.join(__dirname, '../data/entities');
const MYTHOS_DIR = path.join(__dirname, '../mythos');
const THEORIES_DIR = path.join(__dirname, '../theories');

/**
 * Load all entities from filesystem
 */
function loadAllEntities() {
  const entities = [];
  const errors = [];

  const types = fs.readdirSync(ENTITIES_DIR).filter(name => {
    const stat = fs.statSync(path.join(ENTITIES_DIR, name));
    return stat.isDirectory();
  });

  for (const type of types) {
    const typeDir = path.join(ENTITIES_DIR, type);
    const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      try {
        const filePath = path.join(typeDir, file);
        const entity = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        entities.push({ ...entity, _file: filePath });
      } catch (error) {
        errors.push({
          file: path.join(type, file),
          error: error.message
        });
      }
    }
  }

  return { entities, errors };
}

/**
 * Count HTML pages in mythos directory
 */
function countMythosPages() {
  const mythologies = {};

  if (!fs.existsSync(MYTHOS_DIR)) {
    return { total: 0, byMythology: {} };
  }

  const mythDirs = fs.readdirSync(MYTHOS_DIR).filter(name => {
    const stat = fs.statSync(path.join(MYTHOS_DIR, name));
    return stat.isDirectory();
  });

  let total = 0;
  for (const myth of mythDirs) {
    const mythDir = path.join(MYTHOS_DIR, myth);
    const htmlFiles = fs.readdirSync(mythDir).filter(f => f.endsWith('.html'));
    mythologies[myth] = htmlFiles.length;
    total += htmlFiles.length;
  }

  return { total, byMythology: mythologies };
}

/**
 * Count theory pages
 */
function countTheoryPages() {
  if (!fs.existsSync(THEORIES_DIR)) {
    return 0;
  }

  const count = (dir) => {
    let total = 0;
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        total += count(fullPath);
      } else if (item.endsWith('.html')) {
        total++;
      }
    }

    return total;
  };

  return count(THEORIES_DIR);
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(entity) {
  const fields = [
    !!entity.id,
    !!entity.type,
    !!entity.name,
    !!entity.mythologies?.length,
    !!entity.shortDescription,
    !!(entity.longDescription || entity.fullDescription),
    !!entity.icon,
    !!entity.colors?.primary,
    !!entity.sources?.length,
    !!entity.tags?.length,
    !!entity.linguistic?.originalName,
    !!entity.geographical?.primaryLocation,
    !!entity.temporal?.firstAttestation,
    !!entity.cultural?.worshipPractices?.length,
    !!entity.metaphysicalProperties?.primaryElement,
    !!entity.archetypes?.length,
    !!(entity.relatedEntities && Object.keys(entity.relatedEntities).length)
  ];

  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Validate entity structure
 */
function validateEntity(entity) {
  const issues = [];

  // Required fields
  if (!entity.id) issues.push('Missing id');
  if (!entity.type) issues.push('Missing type');
  if (!entity.name) issues.push('Missing name');

  // Recommended fields
  if (!entity.mythologies || entity.mythologies.length === 0) {
    issues.push('Missing mythologies');
  }
  if (!entity.shortDescription) issues.push('Missing shortDescription');
  if (!entity.longDescription && !entity.fullDescription) {
    issues.push('Missing longDescription/fullDescription');
  }

  // Check for duplicate content
  if (entity.longDescription && entity.fullDescription) {
    if (entity.longDescription === entity.fullDescription) {
      issues.push('Duplicate content in longDescription and fullDescription');
    }
  }

  return issues;
}

/**
 * Generate migration validation report
 */
function generateReport() {
  console.log('Loading entities...');
  const { entities, errors: loadErrors } = loadAllEntities();

  console.log('Counting HTML pages...');
  const mythosPages = countMythosPages();
  const theoryPages = countTheoryPages();

  console.log('Analyzing entities...');

  // Entity statistics
  const stats = {
    totalEntities: entities.length,
    byType: {},
    byMythology: {},
    completeness: {
      high: 0,     // 80-100%
      medium: 0,   // 50-79%
      low: 0       // 0-49%
    },
    averageCompleteness: 0,
    validationIssues: [],
    duplicateIds: []
  };

  const idMap = new Map();
  let totalCompleteness = 0;

  // Analyze each entity
  for (const entity of entities) {
    // Count by type
    stats.byType[entity.type] = (stats.byType[entity.type] || 0) + 1;

    // Count by mythology
    if (entity.mythologies) {
      entity.mythologies.forEach(myth => {
        stats.byMythology[myth] = (stats.byMythology[myth] || 0) + 1;
      });
    }

    // Calculate completeness
    const completeness = calculateCompleteness(entity);
    totalCompleteness += completeness;

    if (completeness >= 80) stats.completeness.high++;
    else if (completeness >= 50) stats.completeness.medium++;
    else stats.completeness.low++;

    entity.completeness = completeness;

    // Validate entity
    const issues = validateEntity(entity);
    if (issues.length > 0) {
      stats.validationIssues.push({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        issues
      });
    }

    // Check for duplicate IDs
    if (idMap.has(entity.id)) {
      stats.duplicateIds.push({
        id: entity.id,
        files: [idMap.get(entity.id), entity._file]
      });
    } else {
      idMap.set(entity.id, entity._file);
    }
  }

  stats.averageCompleteness = Math.round(totalCompleteness / entities.length);

  // Content coverage analysis
  const coverage = {
    totalHtmlPages: mythosPages.total + theoryPages,
    mythosPages: mythosPages.total,
    theoryPages: theoryPages,
    totalJsonEntities: entities.length,
    htmlToJsonRatio: ((entities.length / (mythosPages.total + theoryPages)) * 100).toFixed(1) + '%',
    mythologyBreakdown: mythosPages.byMythology
  };

  // Generate detailed entity list
  const entityList = entities.map(e => ({
    id: e.id,
    name: e.name,
    type: e.type,
    mythologies: e.mythologies || [],
    completeness: e.completeness,
    hasDescription: !!(e.shortDescription && (e.longDescription || e.fullDescription)),
    hasMetadata: !!(e.linguistic || e.geographical || e.temporal),
    hasRelationships: !!(e.relatedEntities && Object.keys(e.relatedEntities).length > 0)
  })).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

  // Create report
  const report = {
    generated: new Date().toISOString(),
    summary: {
      status: stats.duplicateIds.length === 0 && loadErrors.length === 0 ? 'PASS' : 'FAIL',
      totalEntities: stats.totalEntities,
      averageCompleteness: stats.averageCompleteness,
      loadErrors: loadErrors.length,
      duplicateIds: stats.duplicateIds.length,
      validationIssues: stats.validationIssues.length
    },
    statistics: stats,
    coverage,
    loadErrors,
    entities: entityList,
    recommendations: []
  };

  // Generate recommendations
  if (stats.completeness.low > 0) {
    report.recommendations.push({
      priority: 'HIGH',
      category: 'Completeness',
      message: `${stats.completeness.low} entities have low completeness (<50%). Consider enriching these entities with more metadata.`
    });
  }

  if (stats.duplicateIds.length > 0) {
    report.recommendations.push({
      priority: 'CRITICAL',
      category: 'Data Integrity',
      message: `${stats.duplicateIds.length} duplicate IDs found. These must be resolved before upload.`,
      details: stats.duplicateIds
    });
  }

  if (loadErrors.length > 0) {
    report.recommendations.push({
      priority: 'CRITICAL',
      category: 'Data Quality',
      message: `${loadErrors.length} files failed to load due to JSON errors. These must be fixed.`,
      details: loadErrors
    });
  }

  if (coverage.htmlToJsonRatio < 50) {
    report.recommendations.push({
      priority: 'MEDIUM',
      category: 'Content Coverage',
      message: `Only ${coverage.htmlToJsonRatio} of HTML pages have corresponding JSON entities. Consider migrating more content.`
    });
  }

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('=== Migration Validation ===\n');

  const report = generateReport();

  // Save report
  const reportPath = path.join(__dirname, '../MIGRATION_VALIDATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  // Print summary
  console.log('\n=== SUMMARY ===');
  console.log(`Status: ${report.summary.status}`);
  console.log(`Total Entities: ${report.summary.totalEntities}`);
  console.log(`Average Completeness: ${report.summary.averageCompleteness}%`);
  console.log(`Load Errors: ${report.summary.loadErrors}`);
  console.log(`Duplicate IDs: ${report.summary.duplicateIds}`);
  console.log(`Validation Issues: ${report.summary.validationIssues}`);

  console.log('\n=== COMPLETENESS ===');
  console.log(`High (80-100%): ${report.statistics.completeness.high}`);
  console.log(`Medium (50-79%): ${report.statistics.completeness.medium}`);
  console.log(`Low (0-49%): ${report.statistics.completeness.low}`);

  console.log('\n=== ENTITIES BY TYPE ===');
  Object.entries(report.statistics.byType).sort().forEach(([type, count]) => {
    console.log(`${type}: ${count}`);
  });

  console.log('\n=== CONTENT COVERAGE ===');
  console.log(`HTML Pages: ${report.coverage.totalHtmlPages}`);
  console.log(`JSON Entities: ${report.coverage.totalJsonEntities}`);
  console.log(`Coverage Ratio: ${report.coverage.htmlToJsonRatio}`);

  if (report.recommendations.length > 0) {
    console.log('\n=== RECOMMENDATIONS ===');
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority}] ${rec.category}: ${rec.message}`);
    });
  }

  console.log('\n=== VALIDATION COMPLETE ===\n');

  return report.summary.status === 'PASS' ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { generateReport, validateEntity, calculateCompleteness };
