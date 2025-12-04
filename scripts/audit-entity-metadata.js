#!/usr/bin/env node

/**
 * Entity Metadata Audit
 * Analyzes all entities to identify missing geographical, temporal, and linguistic metadata
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const ENTITIES_DIR = path.join(process.cwd(), 'data', 'entities');

// Metadata field groups to audit
const METADATA_FIELDS = {
  linguistic: [
    'linguistic.originalName',
    'linguistic.transliteration',
    'linguistic.pronunciation',
    'linguistic.alternativeNames',
    'linguistic.etymology'
  ],
  geographical: [
    'geographical.primaryLocation',
    'geographical.primaryLocation.coordinates',
    'geographical.region',
    'geographical.culturalArea',
    'geographical.modernCountries'
  ],
  temporal: [
    'temporal.mythologicalDate',
    'temporal.historicalDate',
    'temporal.firstAttestation',
    'temporal.culturalPeriod'
  ],
  cultural: [
    'cultural.worshipPractices',
    'cultural.socialRole',
    'cultural.modernLegacy'
  ]
};

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => {
    return current && current[prop] !== undefined ? current[prop] : undefined;
  }, obj);
}

function hasValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function loadAllEntities() {
  const entities = [];
  const entityTypes = fs.readdirSync(ENTITIES_DIR);

  entityTypes.forEach(type => {
    const typePath = path.join(ENTITIES_DIR, type);
    if (!fs.statSync(typePath).isDirectory()) return;

    const files = fs.readdirSync(typePath).filter(f => f.endsWith('.json'));

    files.forEach(file => {
      const filePath = path.join(typePath, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        entities.push({
          id: data.id,
          type: type,
          name: data.name,
          mythology: data.primaryMythology || (data.mythologies && data.mythologies[0]),
          filePath: path.relative(ENTITIES_DIR, filePath),
          data: data
        });
      } catch (e) {
        log(`⚠️  Error loading ${filePath}: ${e.message}`, 'yellow');
      }
    });
  });

  return entities;
}

function auditEntity(entity) {
  const audit = {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    mythology: entity.mythology,
    completeness: {
      linguistic: 0,
      geographical: 0,
      temporal: 0,
      cultural: 0,
      overall: 0
    },
    missing: {
      linguistic: [],
      geographical: [],
      temporal: [],
      cultural: []
    },
    present: {
      linguistic: [],
      geographical: [],
      temporal: [],
      cultural: []
    }
  };

  // Check each metadata field
  for (const [category, fields] of Object.entries(METADATA_FIELDS)) {
    let presentCount = 0;

    fields.forEach(fieldPath => {
      const value = getNestedValue(entity.data, fieldPath);
      const fieldName = fieldPath.split('.').pop();

      if (hasValue(value)) {
        audit.present[category].push(fieldName);
        presentCount++;
      } else {
        audit.missing[category].push(fieldName);
      }
    });

    audit.completeness[category] = Math.round((presentCount / fields.length) * 100);
  }

  // Calculate overall completeness
  const allCategories = Object.keys(METADATA_FIELDS);
  const totalCompleteness = allCategories.reduce((sum, cat) => sum + audit.completeness[cat], 0);
  audit.completeness.overall = Math.round(totalCompleteness / allCategories.length);

  // Special checks for place entities (should have coordinates)
  if (entity.type === 'place') {
    audit.requiresGeolocation = !hasValue(getNestedValue(entity.data, 'geographical.primaryLocation.coordinates'));
  }

  return audit;
}

function generateReport(audits) {
  log('\n' + '='.repeat(80), 'cyan');
  log('ENTITY METADATA AUDIT REPORT', 'cyan');
  log('='.repeat(80) + '\n', 'cyan');

  const summary = {
    total: audits.length,
    byType: {},
    byMythology: {},
    completeness: {
      linguistic: 0,
      geographical: 0,
      temporal: 0,
      cultural: 0,
      overall: 0
    },
    highPriority: [], // Places missing coordinates, deities missing dates
    mediumPriority: [], // Items/places missing geographical data
    lowPriority: [] // Everything else
  };

  // Aggregate statistics
  audits.forEach(audit => {
    // By type
    if (!summary.byType[audit.type]) {
      summary.byType[audit.type] = { count: 0, avgCompleteness: 0 };
    }
    summary.byType[audit.type].count++;
    summary.byType[audit.type].avgCompleteness += audit.completeness.overall;

    // By mythology
    if (audit.mythology) {
      if (!summary.byMythology[audit.mythology]) {
        summary.byMythology[audit.mythology] = { count: 0, avgCompleteness: 0 };
      }
      summary.byMythology[audit.mythology].count++;
      summary.byMythology[audit.mythology].avgCompleteness += audit.completeness.overall;
    }

    // Aggregate completeness
    Object.keys(summary.completeness).forEach(key => {
      summary.completeness[key] += audit.completeness[key];
    });

    // Prioritize entities needing metadata
    if (audit.type === 'place' && audit.requiresGeolocation) {
      summary.highPriority.push(audit);
    } else if ((audit.type === 'deity' || audit.type === 'hero') && audit.completeness.temporal < 50) {
      summary.highPriority.push(audit);
    } else if ((audit.type === 'item' || audit.type === 'place') && audit.completeness.geographical < 30) {
      summary.mediumPriority.push(audit);
    } else if (audit.completeness.overall < 40) {
      summary.mediumPriority.push(audit);
    } else if (audit.completeness.overall < 70) {
      summary.lowPriority.push(audit);
    }
  });

  // Calculate averages
  Object.keys(summary.byType).forEach(type => {
    summary.byType[type].avgCompleteness = Math.round(
      summary.byType[type].avgCompleteness / summary.byType[type].count
    );
  });

  Object.keys(summary.byMythology).forEach(myth => {
    summary.byMythology[myth].avgCompleteness = Math.round(
      summary.byMythology[myth].avgCompleteness / summary.byMythology[myth].count
    );
  });

  Object.keys(summary.completeness).forEach(key => {
    summary.completeness[key] = Math.round(summary.completeness[key] / audits.length);
  });

  // Print Summary
  log('OVERVIEW', 'bright');
  log(`Total Entities: ${summary.total}`, 'blue');
  log(`Overall Metadata Completeness: ${summary.completeness.overall}%\n`,
    summary.completeness.overall >= 70 ? 'green' :
    summary.completeness.overall >= 40 ? 'yellow' : 'red');

  log('COMPLETENESS BY CATEGORY', 'bright');
  log(`  Linguistic:    ${summary.completeness.linguistic}%`,
    summary.completeness.linguistic >= 50 ? 'green' : 'yellow');
  log(`  Geographical:  ${summary.completeness.geographical}%`,
    summary.completeness.geographical >= 50 ? 'green' : 'yellow');
  log(`  Temporal:      ${summary.completeness.temporal}%`,
    summary.completeness.temporal >= 50 ? 'green' : 'yellow');
  log(`  Cultural:      ${summary.completeness.cultural}%\n`,
    summary.completeness.cultural >= 50 ? 'green' : 'yellow');

  log('COMPLETENESS BY ENTITY TYPE', 'bright');
  Object.entries(summary.byType)
    .sort((a, b) => b[1].avgCompleteness - a[1].avgCompleteness)
    .forEach(([type, stats]) => {
      log(`  ${type.padEnd(12)} ${stats.count.toString().padStart(3)} entities  ${stats.avgCompleteness}% complete`,
        stats.avgCompleteness >= 60 ? 'green' : stats.avgCompleteness >= 40 ? 'yellow' : 'red');
    });

  log('\nCOMPLETENESS BY MYTHOLOGY', 'bright');
  Object.entries(summary.byMythology)
    .sort((a, b) => b[1].avgCompleteness - a[1].avgCompleteness)
    .forEach(([myth, stats]) => {
      log(`  ${myth.padEnd(15)} ${stats.count.toString().padStart(3)} entities  ${stats.avgCompleteness}% complete`,
        stats.avgCompleteness >= 60 ? 'green' : stats.avgCompleteness >= 40 ? 'yellow' : 'red');
    });

  log('\n' + '='.repeat(80), 'cyan');
  log('PRIORITY RECOMMENDATIONS', 'cyan');
  log('='.repeat(80) + '\n', 'cyan');

  if (summary.highPriority.length > 0) {
    log(`🔴 HIGH PRIORITY (${summary.highPriority.length} entities)`, 'red');
    log('Places missing coordinates or deities/heroes missing temporal data\n', 'red');
    summary.highPriority.slice(0, 10).forEach(entity => {
      log(`  ${entity.name} (${entity.type})`, 'red');
      log(`    Mythology: ${entity.mythology || 'unknown'}`, 'red');
      log(`    Missing: ${entity.missing.geographical.concat(entity.missing.temporal).join(', ')}`, 'red');
    });
    if (summary.highPriority.length > 10) {
      log(`  ... and ${summary.highPriority.length - 10} more\n`, 'red');
    }
  }

  if (summary.mediumPriority.length > 0) {
    log(`\n🟡 MEDIUM PRIORITY (${summary.mediumPriority.length} entities)`, 'yellow');
    log('Items/places missing geographical data or overall <40% complete\n', 'yellow');
    summary.mediumPriority.slice(0, 5).forEach(entity => {
      log(`  ${entity.name} (${entity.type}) - ${entity.completeness.overall}% complete`, 'yellow');
    });
    if (summary.mediumPriority.length > 5) {
      log(`  ... and ${summary.mediumPriority.length - 5} more\n`, 'yellow');
    }
  }

  if (summary.lowPriority.length > 0) {
    log(`\n🟢 LOW PRIORITY (${summary.lowPriority.length} entities)`, 'green');
    log('Entities 40-70% complete - nice-to-have metadata\n', 'green');
  }

  // Most complete entities (examples of good metadata)
  log('\n' + '='.repeat(80), 'cyan');
  log('TOP 10 MOST COMPLETE ENTITIES (Examples to Follow)', 'cyan');
  log('='.repeat(80) + '\n', 'cyan');

  const topEntities = audits
    .sort((a, b) => b.completeness.overall - a.completeness.overall)
    .slice(0, 10);

  topEntities.forEach((entity, i) => {
    log(`${(i + 1).toString().padStart(2)}. ${entity.name} (${entity.type}) - ${entity.completeness.overall}%`, 'green');
    log(`    Linguistic: ${entity.completeness.linguistic}% | Geo: ${entity.completeness.geographical}% | Temporal: ${entity.completeness.temporal}% | Cultural: ${entity.completeness.cultural}%`, 'cyan');
  });

  return { summary, audits };
}

function saveDetailedReport(audits, summary) {
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    entities: audits
  };

  // Save full report
  const reportPath = 'entity-metadata-audit.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'green');

  // Save high priority list (CSV for easy editing)
  if (summary.highPriority.length > 0) {
    const csvLines = [
      'ID,Name,Type,Mythology,Overall%,Missing Fields'
    ];

    summary.highPriority.forEach(entity => {
      const missingFields = [
        ...entity.missing.linguistic,
        ...entity.missing.geographical,
        ...entity.missing.temporal,
        ...entity.missing.cultural
      ].join('; ');

      csvLines.push(
        `${entity.id},${entity.name},${entity.type},${entity.mythology || ''},${entity.completeness.overall},${missingFields}`
      );
    });

    const csvPath = 'high-priority-metadata.csv';
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    log(`📄 High priority list saved to: ${csvPath}`, 'green');
  }
}

function main() {
  log('\n🔍 Loading entities...\n', 'bright');

  const entities = loadAllEntities();

  if (entities.length === 0) {
    log('❌ No entities found!', 'red');
    process.exit(1);
  }

  log(`Found ${entities.length} entities\n`, 'green');
  log('Auditing metadata completeness...\n', 'cyan');

  const audits = entities.map(auditEntity);
  const { summary } = generateReport(audits);
  saveDetailedReport(audits, summary);

  log('\n✅ Audit complete!\n', 'green');
}

if (require.main === module) {
  main();
}

module.exports = { auditEntity, loadAllEntities };
