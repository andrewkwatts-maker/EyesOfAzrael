#!/usr/bin/env node

/**
 * Firebase Link Validation and Repair Script
 * Eyes of Azrael
 *
 * Validates and fixes broken internal links in Firebase entity assets.
 *
 * Features:
 * - Downloads all Firebase entity data
 * - Builds comprehensive index of valid entity IDs by collection
 * - Validates all link fields (relatedEntities, relatedDeities, etc.)
 * - Fuzzy matching to find similar entities for broken links
 * - Generates fix script and validation report
 * - Batch updates with verification
 *
 * Usage:
 *   node scripts/validate-fix-links.js --scan        # Scan only, no fixes
 *   node scripts/validate-fix-links.js --fix         # Scan and apply fixes
 *   node scripts/validate-fix-links.js --mythology greek  # Specific mythology
 *   node scripts/validate-fix-links.js --report      # Generate detailed report
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const FIREBASE_DATA_DIR = path.join(__dirname, '../FIREBASE/data/entities');
const INDICES_DIR = path.join(__dirname, '../FIREBASE/data/indices');
const OUTPUT_DIR = path.join(__dirname, '../FIREBASE/link-validation');
const REPORT_PATH = path.join(OUTPUT_DIR, 'link-validation-report.json');
const FIXES_PATH = path.join(OUTPUT_DIR, 'link-fixes.json');
const SUMMARY_PATH = path.join(OUTPUT_DIR, 'LINK_VALIDATION_SUMMARY.md');

// Link fields to validate
const LINK_FIELDS = [
  'relatedEntities',
  'relatedDeities',
  'relatedHeroes',
  'relatedCreatures',
  'relatedPlaces',
  'relatedItems',
  'relatedConcepts',
  'relatedRituals',
  'relatedTexts',
  'parents',
  'children',
  'siblings',
  'spouse',
  'consort',
  'sources',
  'associatedDeities',
  'companions'
];

// Nested link fields (inside objects/arrays)
const NESTED_LINK_PATHS = [
  'relatedEntities.deities',
  'relatedEntities.heroes',
  'relatedEntities.creatures',
  'relatedEntities.places',
  'relatedEntities.items',
  'relatedEntities.concepts',
  'relatedEntities.rituals',
  'relatedEntities.texts',
  'mythologyContexts[].associatedDeities',
  'mythologyContexts[].relatedHeroes',
  'mythologyContexts[].relatedCreatures'
];

// Fuzzy matching threshold (0-1, lower is more strict)
const FUZZY_THRESHOLD = 0.3;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Get all JSON files recursively
 */
function getAllJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Normalize string for comparison
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Calculate similarity score (0-1, 1 is exact match)
 */
function calculateSimilarity(str1, str2) {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);

  if (norm1 === norm2) return 1;

  const maxLen = Math.max(norm1.length, norm2.length);
  const distance = levenshteinDistance(norm1, norm2);

  return 1 - (distance / maxLen);
}

/**
 * Extract value from nested path
 */
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (part.endsWith('[]')) {
      const key = part.slice(0, -2);
      if (!Array.isArray(current[key])) return [];
      return current[key];
    } else {
      if (!current || typeof current !== 'object') return null;
      current = current[part];
    }
  }

  return current;
}

/**
 * Set nested value
 */
function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part.endsWith('[]')) {
      const key = part.slice(0, -2);
      if (!Array.isArray(current[key])) {
        current[key] = [];
      }
      // Handle array case - we'll need to update each element
      return;
    } else {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

// ============================================================================
// INDEX BUILDING
// ============================================================================

/**
 * Build comprehensive index of all valid entities
 */
function buildEntityIndex() {
  console.log('📚 Building entity index...');

  const index = {
    byId: {},           // id -> entity metadata
    byType: {},         // type -> [ids]
    byMythology: {},    // mythology -> [ids]
    byName: {},         // normalized name -> [ids]
    totalCount: 0
  };

  const jsonFiles = getAllJsonFiles(FIREBASE_DATA_DIR);

  for (const filePath of jsonFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (!data.id || !data.name) {
        console.warn(`   ⚠️  Skipping ${filePath}: missing id or name`);
        continue;
      }

      const entityType = data.type || 'unknown';
      const mythology = data.primaryMythology || data.mythology || 'unknown';
      const normalizedName = normalizeString(data.name);

      // Add to byId index
      index.byId[data.id] = {
        id: data.id,
        name: data.name,
        type: entityType,
        mythology: mythology,
        mythologies: data.mythologies || [mythology],
        filePath: path.relative(FIREBASE_DATA_DIR, filePath),
        normalizedName: normalizedName
      };

      // Add to byType index
      if (!index.byType[entityType]) {
        index.byType[entityType] = [];
      }
      index.byType[entityType].push(data.id);

      // Add to byMythology index
      const mythologies = data.mythologies || [mythology];
      mythologies.forEach(myth => {
        if (!index.byMythology[myth]) {
          index.byMythology[myth] = [];
        }
        index.byMythology[myth].push(data.id);
      });

      // Add to byName index
      if (!index.byName[normalizedName]) {
        index.byName[normalizedName] = [];
      }
      index.byName[normalizedName].push(data.id);

      index.totalCount++;

    } catch (error) {
      console.warn(`   ⚠️  Error reading ${filePath}: ${error.message}`);
    }
  }

  console.log(`   ✅ Indexed ${index.totalCount} entities`);
  console.log(`   📊 ${Object.keys(index.byType).length} types, ${Object.keys(index.byMythology).length} mythologies`);

  return index;
}

// ============================================================================
// LINK VALIDATION
// ============================================================================

/**
 * Validate a single link reference
 */
function validateLink(linkRef, entityIndex, context = {}) {
  // Handle null/undefined
  if (!linkRef) {
    return {
      valid: false,
      issue: 'null_or_undefined',
      original: linkRef
    };
  }

  // Handle empty string
  if (typeof linkRef === 'string' && linkRef.trim() === '') {
    return {
      valid: false,
      issue: 'empty_string',
      original: linkRef
    };
  }

  // Extract ID from different formats
  let entityId;
  let linkFormat;

  if (typeof linkRef === 'string') {
    // Could be just an ID or a path
    if (linkRef.includes('/')) {
      // Extract from path like "/mythos/greek/deities/zeus.html"
      const parts = linkRef.split('/').filter(Boolean);
      entityId = parts[parts.length - 1].replace('.html', '');
      linkFormat = 'path';
    } else {
      entityId = linkRef;
      linkFormat = 'id';
    }
  } else if (typeof linkRef === 'object' && linkRef.id) {
    entityId = linkRef.id;
    linkFormat = 'object';
  } else {
    return {
      valid: false,
      issue: 'invalid_format',
      original: linkRef,
      format: typeof linkRef
    };
  }

  // Check if entity exists
  if (entityIndex.byId[entityId]) {
    return {
      valid: true,
      entityId: entityId,
      format: linkFormat,
      entity: entityIndex.byId[entityId]
    };
  }

  // Try fuzzy matching
  const suggestions = findSimilarEntities(entityId, entityIndex, context);

  return {
    valid: false,
    issue: 'entity_not_found',
    entityId: entityId,
    original: linkRef,
    format: linkFormat,
    suggestions: suggestions.slice(0, 3)
  };
}

/**
 * Find similar entities using fuzzy matching
 */
function findSimilarEntities(searchId, entityIndex, context = {}) {
  const normalizedSearch = normalizeString(searchId);
  const { mythology, type } = context;

  const candidates = [];

  // Search through all entities
  for (const [id, entity] of Object.entries(entityIndex.byId)) {
    // Filter by mythology if provided
    if (mythology && !entity.mythologies.includes(mythology)) {
      continue;
    }

    // Filter by type if provided
    if (type && entity.type !== type) {
      continue;
    }

    // Calculate similarity
    const idSimilarity = calculateSimilarity(searchId, id);
    const nameSimilarity = calculateSimilarity(searchId, entity.name);
    const maxSimilarity = Math.max(idSimilarity, nameSimilarity);

    if (maxSimilarity >= (1 - FUZZY_THRESHOLD)) {
      candidates.push({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        mythology: entity.mythology,
        similarity: maxSimilarity,
        matchType: idSimilarity > nameSimilarity ? 'id' : 'name'
      });
    }
  }

  // Sort by similarity (highest first)
  candidates.sort((a, b) => b.similarity - a.similarity);

  return candidates;
}

/**
 * Validate all links in an entity
 */
function validateEntityLinks(entity, entityIndex) {
  const issues = [];
  const validLinks = [];

  // Direct link fields
  for (const field of LINK_FIELDS) {
    if (!entity[field]) continue;

    const links = Array.isArray(entity[field]) ? entity[field] : [entity[field]];

    links.forEach((link, index) => {
      const result = validateLink(link, entityIndex, {
        mythology: entity.primaryMythology || entity.mythology,
        type: field.replace(/^related/, '').toLowerCase().replace(/s$/, '')
      });

      if (!result.valid) {
        issues.push({
          field: field,
          index: index,
          issue: result.issue,
          original: result.original,
          entityId: result.entityId,
          suggestions: result.suggestions || []
        });
      } else {
        validLinks.push({
          field: field,
          index: index,
          entityId: result.entityId
        });
      }
    });
  }

  // Nested link paths
  for (const nestedPath of NESTED_LINK_PATHS) {
    const value = getNestedValue(entity, nestedPath);

    if (!value) continue;

    const links = Array.isArray(value) ? value : [value];

    links.forEach((link, index) => {
      const result = validateLink(link, entityIndex, {
        mythology: entity.primaryMythology || entity.mythology,
        type: nestedPath.split('.').pop().replace(/s$/, '')
      });

      if (!result.valid) {
        issues.push({
          field: nestedPath,
          index: index,
          issue: result.issue,
          original: result.original,
          entityId: result.entityId,
          suggestions: result.suggestions || []
        });
      } else {
        validLinks.push({
          field: nestedPath,
          index: index,
          entityId: result.entityId
        });
      }
    });
  }

  return {
    entityId: entity.id,
    entityName: entity.name,
    totalLinks: validLinks.length + issues.length,
    validLinks: validLinks.length,
    brokenLinks: issues.length,
    issues: issues
  };
}

// ============================================================================
// FIX GENERATION
// ============================================================================

/**
 * Generate fixes for broken links
 */
function generateFixes(validationResults, entityIndex) {
  console.log('\n🔧 Generating fixes...');

  const fixes = [];
  let autoFixable = 0;
  let needsReview = 0;
  let unfixable = 0;

  for (const result of validationResults) {
    if (result.brokenLinks === 0) continue;

    const entityFixes = {
      entityId: result.entityId,
      entityName: result.entityName,
      fixes: []
    };

    for (const issue of result.issues) {
      let fix = {
        field: issue.field,
        index: issue.index,
        issue: issue.issue,
        original: issue.original,
        action: null,
        newValue: null,
        confidence: null,
        needsReview: false
      };

      if (issue.issue === 'null_or_undefined' || issue.issue === 'empty_string') {
        // Remove null/empty entries
        fix.action = 'remove';
        fix.confidence = 'high';
        autoFixable++;
      } else if (issue.issue === 'entity_not_found' && issue.suggestions.length > 0) {
        const topSuggestion = issue.suggestions[0];

        if (topSuggestion.similarity >= 0.9) {
          // High confidence match
          fix.action = 'replace';
          fix.newValue = topSuggestion.id;
          fix.confidence = 'high';
          fix.suggestion = topSuggestion;
          autoFixable++;
        } else if (topSuggestion.similarity >= 0.7) {
          // Medium confidence - needs review
          fix.action = 'replace';
          fix.newValue = topSuggestion.id;
          fix.confidence = 'medium';
          fix.suggestion = topSuggestion;
          fix.needsReview = true;
          needsReview++;
        } else {
          // Low confidence - manual review required
          fix.action = 'review';
          fix.confidence = 'low';
          fix.suggestions = issue.suggestions;
          fix.needsReview = true;
          needsReview++;
        }
      } else {
        // Can't auto-fix
        fix.action = 'remove';
        fix.confidence = 'low';
        fix.needsReview = true;
        unfixable++;
      }

      entityFixes.fixes.push(fix);
    }

    if (entityFixes.fixes.length > 0) {
      fixes.push(entityFixes);
    }
  }

  console.log(`   ✅ Auto-fixable: ${autoFixable}`);
  console.log(`   ⚠️  Needs review: ${needsReview}`);
  console.log(`   ❌ Unfixable: ${unfixable}`);

  return fixes;
}

/**
 * Apply fixes to entities
 */
function applyFixes(fixes, dryRun = true) {
  console.log(`\n${dryRun ? '🔍 DRY RUN:' : '✏️  APPLYING:'} Processing ${fixes.length} entities...`);

  const stats = {
    entitiesModified: 0,
    linksFixed: 0,
    linksRemoved: 0,
    needsReview: 0
  };

  for (const entityFix of fixes) {
    const filePath = path.join(
      FIREBASE_DATA_DIR,
      entityIndex.byId[entityFix.entityId].filePath
    );

    try {
      const entity = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let modified = false;

      for (const fix of entityFix.fixes) {
        if (fix.needsReview && !dryRun) {
          stats.needsReview++;
          continue; // Skip fixes that need manual review
        }

        const field = fix.field;
        let value = entity[field];

        if (Array.isArray(value)) {
          if (fix.action === 'remove') {
            value.splice(fix.index, 1);
            stats.linksRemoved++;
            modified = true;
          } else if (fix.action === 'replace' && fix.newValue) {
            value[fix.index] = fix.newValue;
            stats.linksFixed++;
            modified = true;
          }

          // Clean up empty arrays
          if (value.length === 0) {
            delete entity[field];
          } else {
            entity[field] = value;
          }
        }
      }

      if (modified) {
        if (!dryRun) {
          fs.writeFileSync(filePath, JSON.stringify(entity, null, 2));
        }
        stats.entitiesModified++;
      }

    } catch (error) {
      console.error(`   ❌ Error processing ${entityFix.entityId}: ${error.message}`);
    }
  }

  return stats;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate validation report
 */
function generateReport(validationResults, fixes, stats) {
  console.log('\n📊 Generating report...');

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalEntities: validationResults.length,
      totalLinks: validationResults.reduce((sum, r) => sum + r.totalLinks, 0),
      validLinks: validationResults.reduce((sum, r) => sum + r.validLinks, 0),
      brokenLinks: validationResults.reduce((sum, r) => sum + r.brokenLinks, 0),
      entitiesWithIssues: validationResults.filter(r => r.brokenLinks > 0).length
    },
    issuesByType: {},
    issuesByMythology: {},
    topProblematicEntities: [],
    fixes: {
      autoFixable: 0,
      needsReview: 0,
      unfixable: 0
    },
    validationResults: validationResults.filter(r => r.brokenLinks > 0)
  };

  // Count issues by type
  for (const result of validationResults) {
    for (const issue of result.issues) {
      if (!report.issuesByType[issue.issue]) {
        report.issuesByType[issue.issue] = 0;
      }
      report.issuesByType[issue.issue]++;
    }
  }

  // Top problematic entities
  report.topProblematicEntities = validationResults
    .filter(r => r.brokenLinks > 0)
    .sort((a, b) => b.brokenLinks - a.brokenLinks)
    .slice(0, 20)
    .map(r => ({
      id: r.entityId,
      name: r.entityName,
      brokenLinks: r.brokenLinks,
      totalLinks: r.totalLinks
    }));

  // Count fixes
  for (const entityFix of fixes) {
    for (const fix of entityFix.fixes) {
      if (fix.confidence === 'high' && !fix.needsReview) {
        report.fixes.autoFixable++;
      } else if (fix.needsReview) {
        report.fixes.needsReview++;
      } else {
        report.fixes.unfixable++;
      }
    }
  }

  return report;
}

/**
 * Generate markdown summary
 */
function generateMarkdownSummary(report) {
  const lines = [];

  lines.push('# Firebase Link Validation Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date(report.timestamp).toLocaleString()}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Entities:** ${report.summary.totalEntities.toLocaleString()}`);
  lines.push(`- **Total Links:** ${report.summary.totalLinks.toLocaleString()}`);
  lines.push(`- **Valid Links:** ${report.summary.validLinks.toLocaleString()} (${((report.summary.validLinks / report.summary.totalLinks) * 100).toFixed(1)}%)`);
  lines.push(`- **Broken Links:** ${report.summary.brokenLinks.toLocaleString()} (${((report.summary.brokenLinks / report.summary.totalLinks) * 100).toFixed(1)}%)`);
  lines.push(`- **Entities with Issues:** ${report.summary.entitiesWithIssues.toLocaleString()}`);
  lines.push('');

  lines.push('## Issues by Type');
  lines.push('');
  lines.push('| Issue Type | Count |');
  lines.push('|-----------|-------|');

  Object.entries(report.issuesByType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      lines.push(`| ${type} | ${count.toLocaleString()} |`);
    });

  lines.push('');
  lines.push('## Fix Summary');
  lines.push('');
  lines.push(`- **Auto-fixable (high confidence):** ${report.fixes.autoFixable.toLocaleString()}`);
  lines.push(`- **Needs Manual Review:** ${report.fixes.needsReview.toLocaleString()}`);
  lines.push(`- **Unfixable:** ${report.fixes.unfixable.toLocaleString()}`);
  lines.push('');

  lines.push('## Top 20 Problematic Entities');
  lines.push('');
  lines.push('| Entity | Broken Links | Total Links | Error Rate |');
  lines.push('|--------|-------------|-------------|-----------|');

  report.topProblematicEntities.forEach(entity => {
    const errorRate = ((entity.brokenLinks / entity.totalLinks) * 100).toFixed(1);
    lines.push(`| ${entity.name} (\`${entity.id}\`) | ${entity.brokenLinks} | ${entity.totalLinks} | ${errorRate}% |`);
  });

  lines.push('');
  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. Review the detailed JSON reports in `FIREBASE/link-validation/`');
  lines.push('2. Run with `--fix` flag to apply auto-fixable changes');
  lines.push('3. Manually review fixes marked as "needs review"');
  lines.push('4. Update broken links that could not be auto-fixed');
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

let entityIndex; // Global index

/**
 * Scan all entities for broken links
 */
function scanLinks(options = {}) {
  const { mythology } = options;

  console.log('🔍 Scanning Firebase entities for broken links...');
  console.log('='.repeat(80));

  // Build index
  entityIndex = buildEntityIndex();

  // Get entities to scan
  const jsonFiles = getAllJsonFiles(FIREBASE_DATA_DIR);
  console.log(`\n📂 Found ${jsonFiles.length} entity files`);

  const validationResults = [];
  let scanned = 0;

  for (const filePath of jsonFiles) {
    try {
      const entity = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Filter by mythology if specified
      if (mythology && entity.primaryMythology !== mythology && entity.mythology !== mythology) {
        continue;
      }

      const result = validateEntityLinks(entity, entityIndex);
      validationResults.push(result);

      scanned++;

      if (scanned % 50 === 0) {
        process.stdout.write(`\r   Progress: ${scanned}/${jsonFiles.length}`);
      }

    } catch (error) {
      console.warn(`\n   ⚠️  Error scanning ${filePath}: ${error.message}`);
    }
  }

  console.log(`\r   ✅ Scanned ${scanned} entities`);

  return validationResults;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  const options = {
    scan: args.includes('--scan'),
    fix: args.includes('--fix'),
    report: args.includes('--report'),
    mythology: args.find(arg => arg.startsWith('--mythology='))?.split('=')[1],
    help: args.includes('--help') || args.includes('-h')
  };

  if (options.help) {
    console.log(`
Firebase Link Validation Script
${'='.repeat(80)}

Validates and fixes broken internal links in Firebase entity assets.

Usage:
  node scripts/validate-fix-links.js [options]

Options:
  --scan              Scan only, no fixes
  --fix               Scan and apply auto-fixes
  --report            Generate detailed report
  --mythology=<name>  Filter by mythology
  --help, -h          Show this help

Examples:
  # Scan all entities
  node scripts/validate-fix-links.js --scan

  # Scan and fix Greek mythology
  node scripts/validate-fix-links.js --fix --mythology=greek

  # Generate comprehensive report
  node scripts/validate-fix-links.js --report
    `);
    return;
  }

  ensureOutputDir();

  // Scan for broken links
  const validationResults = scanLinks(options);

  // Generate fixes
  const fixes = generateFixes(validationResults, entityIndex);

  // Apply fixes if requested
  let applyStats = null;
  if (options.fix) {
    applyStats = applyFixes(fixes, false);
    console.log('\n✅ Fixes applied!');
    console.log(`   Modified: ${applyStats.entitiesModified} entities`);
    console.log(`   Fixed: ${applyStats.linksFixed} links`);
    console.log(`   Removed: ${applyStats.linksRemoved} links`);
    console.log(`   Needs review: ${applyStats.needsReview} links`);
  }

  // Generate reports
  const report = generateReport(validationResults, fixes, applyStats);
  const markdown = generateMarkdownSummary(report);

  // Save reports
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  fs.writeFileSync(FIXES_PATH, JSON.stringify(fixes, null, 2));
  fs.writeFileSync(SUMMARY_PATH, markdown);

  console.log('\n📄 Reports saved:');
  console.log(`   ${REPORT_PATH}`);
  console.log(`   ${FIXES_PATH}`);
  console.log(`   ${SUMMARY_PATH}`);

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Entities: ${report.summary.totalEntities}`);
  console.log(`Total Links: ${report.summary.totalLinks}`);
  console.log(`Valid Links: ${report.summary.validLinks} (${((report.summary.validLinks / report.summary.totalLinks) * 100).toFixed(1)}%)`);
  console.log(`Broken Links: ${report.summary.brokenLinks} (${((report.summary.brokenLinks / report.summary.totalLinks) * 100).toFixed(1)}%)`);
  console.log(`Entities with Issues: ${report.summary.entitiesWithIssues}`);
  console.log('\nFixes:');
  console.log(`  Auto-fixable: ${report.fixes.autoFixable}`);
  console.log(`  Needs review: ${report.fixes.needsReview}`);
  console.log(`  Unfixable: ${report.fixes.unfixable}`);
  console.log('');
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  buildEntityIndex,
  validateEntityLinks,
  generateFixes,
  scanLinks
};
