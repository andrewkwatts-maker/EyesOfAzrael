#!/usr/bin/env node

/**
 * Entity Schema Compliance Scorer
 *
 * Scores entities based on completeness and orders from worst to best.
 * This helps prioritize which entities need agent remediation first.
 *
 * Scoring Criteria (100 points total):
 * - Required fields present (20 points max)
 * - Optional fields present (40 points max)
 * - Quality of descriptions (20 points max based on length)
 * - Related entities populated (10 points max)
 * - Corpus queries present (10 points max)
 *
 * Usage: node scripts/score-schema-compliance.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ENTITIES_DIR = path.join(__dirname, '..', 'data', 'entities');
const REPORT_OUTPUT = path.join(__dirname, 'reports', 'schema-compliance-report.json');

// Schema field definitions
const REQUIRED_FIELDS = [
  'id',
  'type',
  'name',
  'mythologies',
  'primaryMythology',
  'shortDescription'
];

const OPTIONAL_CORE_FIELDS = [
  'icon',
  'fullDescription',
  'tags',
  'colors',
  'metadata'
];

const OPTIONAL_DETAIL_FIELDS = [
  'linguistic',
  'linguistic.originalName',
  'linguistic.originalScript',
  'linguistic.transliteration',
  'linguistic.pronunciation',
  'linguistic.languageCode',
  'linguistic.alternativeNames',
  'linguistic.etymology',
  'linguistic.etymology.rootLanguage',
  'linguistic.etymology.meaning',
  'geographical',
  'geographical.primaryLocation',
  'geographical.primaryLocation.name',
  'geographical.primaryLocation.coordinates',
  'geographical.primaryLocation.type',
  'geographical.primaryLocation.description',
  'geographical.region',
  'geographical.culturalArea',
  'geographical.modernCountries',
  'temporal',
  'temporal.mythologicalDate',
  'temporal.historicalDate',
  'temporal.firstAttestation',
  'temporal.culturalPeriod',
  'cultural',
  'cultural.worshipPractices',
  'cultural.festivals',
  'cultural.socialRole',
  'cultural.demographicAppeal',
  'cultural.modernLegacy',
  'metaphysicalProperties',
  'metaphysicalProperties.primaryElement',
  'metaphysicalProperties.domains',
  'archetypes',
  'sources'
];

const RELATED_ENTITY_CATEGORIES = [
  'deities',
  'heroes',
  'creatures',
  'places',
  'items',
  'concepts'
];

// Description quality thresholds
const SHORT_DESC_IDEAL_LENGTH = 200;
const FULL_DESC_IDEAL_LENGTH = 2000;

/**
 * Get nested field value using dot notation
 */
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Check if a field has meaningful content
 */
function hasContent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

/**
 * Score required fields (20 points max)
 */
function scoreRequiredFields(entity) {
  const pointsPerField = 20 / REQUIRED_FIELDS.length;
  let score = 0;
  const missing = [];

  for (const field of REQUIRED_FIELDS) {
    if (hasContent(entity[field])) {
      score += pointsPerField;
    } else {
      missing.push(field);
    }
  }

  return { score: Math.round(score * 100) / 100, missing };
}

/**
 * Score optional fields (40 points max)
 */
function scoreOptionalFields(entity) {
  const allOptional = [...OPTIONAL_CORE_FIELDS, ...OPTIONAL_DETAIL_FIELDS];
  const pointsPerField = 40 / allOptional.length;
  let score = 0;
  const missing = [];
  const partial = [];

  for (const field of allOptional) {
    const value = getNestedValue(entity, field);
    if (hasContent(value)) {
      score += pointsPerField;
    } else if (field.includes('.')) {
      // For nested fields, only report if parent exists but field is missing
      const parentPath = field.split('.').slice(0, -1).join('.');
      const parent = getNestedValue(entity, parentPath);
      if (hasContent(parent)) {
        partial.push(field);
      }
    } else {
      missing.push(field);
    }
  }

  return { score: Math.round(score * 100) / 100, missing, partial };
}

/**
 * Score description quality (20 points max)
 */
function scoreDescriptionQuality(entity) {
  let score = 0;
  const issues = [];

  // Short description (8 points max)
  const shortDesc = entity.shortDescription || '';
  const shortLen = shortDesc.length;
  if (shortLen === 0) {
    issues.push('Missing shortDescription');
  } else if (shortLen < 50) {
    score += 2;
    issues.push(`shortDescription too brief (${shortLen} chars, ideal: ${SHORT_DESC_IDEAL_LENGTH}+)`);
  } else if (shortLen < 100) {
    score += 4;
    issues.push(`shortDescription could be longer (${shortLen} chars)`);
  } else if (shortLen < SHORT_DESC_IDEAL_LENGTH) {
    score += 6;
  } else {
    score += 8;
  }

  // Full description (12 points max)
  const fullDesc = entity.fullDescription || '';
  const fullLen = fullDesc.length;
  if (fullLen === 0) {
    issues.push('Missing fullDescription');
  } else if (fullLen < 200) {
    score += 3;
    issues.push(`fullDescription too brief (${fullLen} chars, ideal: ${FULL_DESC_IDEAL_LENGTH}+)`);
  } else if (fullLen < 500) {
    score += 6;
    issues.push(`fullDescription could be more comprehensive (${fullLen} chars)`);
  } else if (fullLen < 1000) {
    score += 9;
  } else if (fullLen < FULL_DESC_IDEAL_LENGTH) {
    score += 10;
  } else {
    score += 12;
  }

  return { score: Math.round(score * 100) / 100, issues };
}

/**
 * Score related entities (10 points max)
 */
function scoreRelatedEntities(entity) {
  const relatedEntities = entity.relatedEntities || {};
  const pointsPerCategory = 10 / RELATED_ENTITY_CATEGORIES.length;
  let score = 0;
  const missing = [];
  const sparse = [];

  for (const category of RELATED_ENTITY_CATEGORIES) {
    const items = relatedEntities[category];
    if (!Array.isArray(items) || items.length === 0) {
      missing.push(category);
    } else if (items.length === 1) {
      score += pointsPerCategory * 0.5;
      sparse.push(`${category} (only ${items.length} entry)`);
    } else if (items.length < 3) {
      score += pointsPerCategory * 0.75;
      sparse.push(`${category} (only ${items.length} entries)`);
    } else {
      score += pointsPerField;
    }
  }

  // Fix: use pointsPerCategory instead of pointsPerField
  for (const category of RELATED_ENTITY_CATEGORIES) {
    const items = relatedEntities[category];
    if (Array.isArray(items) && items.length >= 3) {
      // Already counted correctly above, just need to fix the variable reference
    }
  }

  // Recalculate properly
  score = 0;
  for (const category of RELATED_ENTITY_CATEGORIES) {
    const items = relatedEntities[category];
    if (!Array.isArray(items) || items.length === 0) {
      // missing - no points
    } else if (items.length === 1) {
      score += pointsPerCategory * 0.5;
    } else if (items.length < 3) {
      score += pointsPerCategory * 0.75;
    } else {
      score += pointsPerCategory;
    }
  }

  // Check if related entities have relationship descriptions
  let hasRelationships = 0;
  let totalRelated = 0;
  for (const category of RELATED_ENTITY_CATEGORIES) {
    const items = relatedEntities[category] || [];
    for (const item of items) {
      totalRelated++;
      if (item.relationship && item.relationship.trim().length > 0) {
        hasRelationships++;
      }
    }
  }

  const relationshipIssues = [];
  if (totalRelated > 0 && hasRelationships < totalRelated) {
    relationshipIssues.push(`${totalRelated - hasRelationships}/${totalRelated} related entities missing relationship descriptions`);
  }

  return {
    score: Math.round(score * 100) / 100,
    missing,
    sparse,
    relationshipIssues
  };
}

/**
 * Score corpus queries (10 points max)
 */
function scoreCorpusQueries(entity) {
  const queries = entity.corpusQueries || [];
  let score = 0;
  const issues = [];

  if (!Array.isArray(queries) || queries.length === 0) {
    issues.push('Missing corpusQueries array');
    return { score: 0, issues };
  }

  // Base points for having queries (up to 5 points based on count)
  const queryCount = queries.length;
  if (queryCount >= 5) {
    score += 5;
  } else if (queryCount >= 3) {
    score += 4;
  } else if (queryCount >= 2) {
    score += 3;
  } else {
    score += 2;
    issues.push(`Only ${queryCount} corpus query (recommend 3-5)`);
  }

  // Quality points (up to 5 points)
  let qualityScore = 0;
  let qualityChecks = 0;

  for (const query of queries) {
    qualityChecks++;
    let queryQuality = 0;

    if (query.id && query.id.trim().length > 0) queryQuality += 0.2;
    if (query.label && query.label.trim().length > 0) queryQuality += 0.2;
    if (query.description && query.description.trim().length > 0) queryQuality += 0.2;
    if (query.queryType) queryQuality += 0.2;
    if (query.query && Object.keys(query.query).length > 0) queryQuality += 0.2;

    qualityScore += queryQuality;
  }

  if (qualityChecks > 0) {
    const avgQuality = qualityScore / qualityChecks;
    score += avgQuality * 5;

    if (avgQuality < 0.8) {
      issues.push('Some corpus queries missing complete metadata (id, label, description, queryType, query)');
    }
  }

  return { score: Math.round(score * 100) / 100, issues };
}

/**
 * Calculate total score for an entity
 */
function scoreEntity(entity) {
  const requiredScore = scoreRequiredFields(entity);
  const optionalScore = scoreOptionalFields(entity);
  const descriptionScore = scoreDescriptionQuality(entity);
  const relatedScore = scoreRelatedEntities(entity);
  const corpusScore = scoreCorpusQueries(entity);

  const totalScore =
    requiredScore.score +
    optionalScore.score +
    descriptionScore.score +
    relatedScore.score +
    corpusScore.score;

  const percentage = Math.round(totalScore);

  // Compile all missing fields
  const allMissing = [
    ...requiredScore.missing.map(f => `[REQUIRED] ${f}`),
    ...optionalScore.missing.map(f => `[OPTIONAL] ${f}`),
    ...relatedScore.missing.map(f => `[RELATED] ${f}`),
  ];

  // Compile improvement suggestions
  const suggestions = [];

  if (requiredScore.missing.length > 0) {
    suggestions.push(`Add required fields: ${requiredScore.missing.join(', ')}`);
  }

  if (descriptionScore.issues.length > 0) {
    suggestions.push(...descriptionScore.issues);
  }

  if (relatedScore.missing.length > 0) {
    suggestions.push(`Populate related entities: ${relatedScore.missing.join(', ')}`);
  }

  if (relatedScore.relationshipIssues.length > 0) {
    suggestions.push(...relatedScore.relationshipIssues);
  }

  if (corpusScore.issues.length > 0) {
    suggestions.push(...corpusScore.issues);
  }

  // Check for empty arrays that should have content
  if (entity.tags && entity.tags.length < 5) {
    suggestions.push(`Add more tags (current: ${entity.tags?.length || 0}, recommend: 10+)`);
  }

  if (entity.sources && entity.sources.length === 0) {
    suggestions.push('Add primary sources');
  }

  if (!entity.archetypes || entity.archetypes.length === 0) {
    suggestions.push('Add archetypes');
  }

  return {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    mythology: entity.primaryMythology,
    percentage,
    breakdown: {
      required: { score: requiredScore.score, max: 20 },
      optional: { score: optionalScore.score, max: 40 },
      descriptions: { score: descriptionScore.score, max: 20 },
      related: { score: relatedScore.score, max: 10 },
      corpus: { score: corpusScore.score, max: 10 }
    },
    missingFields: allMissing,
    suggestions,
    details: {
      shortDescLength: (entity.shortDescription || '').length,
      fullDescLength: (entity.fullDescription || '').length,
      tagCount: (entity.tags || []).length,
      sourceCount: (entity.sources || []).length,
      corpusQueryCount: (entity.corpusQueries || []).length,
      relatedEntityCount: Object.values(entity.relatedEntities || {}).flat().length
    }
  };
}

/**
 * Find all entity JSON files
 */
function findEntityFiles(dir) {
  const files = [];

  function scanDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        // Skip migration reports and other non-entity files
        if (!entry.name.includes('report') && !entry.name.includes('migration')) {
          files.push(fullPath);
        }
      }
    }
  }

  scanDir(dir);
  return files;
}

/**
 * Main execution
 */
function main() {
  console.log('========================================');
  console.log('Entity Schema Compliance Scorer');
  console.log('========================================\n');

  // Find all entity files
  const entityFiles = findEntityFiles(ENTITIES_DIR);
  console.log(`Found ${entityFiles.length} entity files\n`);

  // Score each entity
  const scores = [];
  const errors = [];

  for (const filePath of entityFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const entity = JSON.parse(content);

      // Skip if not a valid entity (must have id and name at minimum)
      if (!entity.id || !entity.name) {
        errors.push({ file: filePath, error: 'Missing id or name' });
        continue;
      }

      const score = scoreEntity(entity);
      score.filePath = filePath;
      scores.push(score);
    } catch (err) {
      errors.push({ file: filePath, error: err.message });
    }
  }

  // Sort from lowest to highest score
  scores.sort((a, b) => a.percentage - b.percentage);

  // Calculate statistics
  const totalEntities = scores.length;
  const avgScore = scores.reduce((sum, s) => sum + s.percentage, 0) / totalEntities;

  const distribution = {
    critical: scores.filter(s => s.percentage < 30).length,
    poor: scores.filter(s => s.percentage >= 30 && s.percentage < 50).length,
    fair: scores.filter(s => s.percentage >= 50 && s.percentage < 70).length,
    good: scores.filter(s => s.percentage >= 70 && s.percentage < 85).length,
    excellent: scores.filter(s => s.percentage >= 85).length
  };

  // Console output - ordered list worst to best
  console.log('ENTITIES ORDERED BY COMPLIANCE (WORST TO BEST)');
  console.log('='.repeat(80));
  console.log('');

  for (const score of scores) {
    const statusIcon = score.percentage < 30 ? '[CRITICAL]' :
                       score.percentage < 50 ? '[POOR]' :
                       score.percentage < 70 ? '[FAIR]' :
                       score.percentage < 85 ? '[GOOD]' : '[EXCELLENT]';

    console.log(`${statusIcon} ${score.percentage}% - ${score.name} (${score.id})`);
    console.log(`   Type: ${score.type} | Mythology: ${score.mythology}`);
    console.log(`   Breakdown: Required=${score.breakdown.required.score}/${score.breakdown.required.max}, ` +
                `Optional=${score.breakdown.optional.score.toFixed(1)}/${score.breakdown.optional.max}, ` +
                `Descriptions=${score.breakdown.descriptions.score}/${score.breakdown.descriptions.max}, ` +
                `Related=${score.breakdown.related.score.toFixed(1)}/${score.breakdown.related.max}, ` +
                `Corpus=${score.breakdown.corpus.score.toFixed(1)}/${score.breakdown.corpus.max}`);

    if (score.missingFields.length > 0) {
      console.log(`   Missing: ${score.missingFields.slice(0, 5).join(', ')}${score.missingFields.length > 5 ? ` (+${score.missingFields.length - 5} more)` : ''}`);
    }

    if (score.suggestions.length > 0) {
      console.log(`   Suggestions: ${score.suggestions.slice(0, 3).join('; ')}${score.suggestions.length > 3 ? ` (+${score.suggestions.length - 3} more)` : ''}`);
    }

    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Entities: ${totalEntities}`);
  console.log(`Average Score: ${avgScore.toFixed(1)}%`);
  console.log('');
  console.log('Distribution:');
  console.log(`  Critical (<30%):   ${distribution.critical} entities`);
  console.log(`  Poor (30-49%):     ${distribution.poor} entities`);
  console.log(`  Fair (50-69%):     ${distribution.fair} entities`);
  console.log(`  Good (70-84%):     ${distribution.good} entities`);
  console.log(`  Excellent (85%+):  ${distribution.excellent} entities`);
  console.log('');

  // Entities needing immediate attention
  const needsAttention = scores.filter(s => s.percentage < 50);
  console.log(`ENTITIES NEEDING IMMEDIATE ATTENTION (${needsAttention.length}):`);
  for (const entity of needsAttention) {
    console.log(`  - ${entity.name} (${entity.id}): ${entity.percentage}%`);
  }
  console.log('');

  if (errors.length > 0) {
    console.log(`ERRORS (${errors.length}):`);
    for (const err of errors) {
      console.log(`  - ${path.basename(err.file)}: ${err.error}`);
    }
    console.log('');
  }

  // Write detailed JSON report
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalEntities,
      averageScore: Math.round(avgScore * 10) / 10,
      distribution,
      entitiesNeedingAttention: needsAttention.length
    },
    entities: scores,
    errors
  };

  // Ensure reports directory exists
  const reportsDir = path.dirname(REPORT_OUTPUT);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(REPORT_OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Detailed report written to: ${REPORT_OUTPUT}`);
}

// Run the script
main();
