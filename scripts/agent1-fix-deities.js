/**
 * Agent 1: Fix Incomplete Deities in Firebase
 *
 * This script systematically fixes all incomplete deity assets in Firebase by:
 * 1. Downloading all deities from Firebase
 * 2. Identifying missing fields per the UNIFIED_ASSET_TEMPLATE.md
 * 3. Populating missing fields with intelligent defaults and inferred values
 * 4. Updating Firebase with completed deity data
 *
 * Usage:
 *   node scripts/agent1-fix-deities.js               # Execute updates
 *   node scripts/agent1-fix-deities.js --dry-run     # Preview changes only
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose') || DRY_RUN;
const REPORT_DIR = path.join(__dirname, '..');

console.log('='.repeat(80));
console.log('AGENT 1: DEITY COMPLETENESS FIX');
console.log('='.repeat(80));
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`);
console.log(`Verbose: ${VERBOSE ? 'YES' : 'NO'}`);
console.log('='.repeat(80));
console.log('');

// ============================================================================
// INITIALIZE FIREBASE
// ============================================================================

console.log('Initializing Firebase Admin SDK...');
const serviceAccount = require('../FIREBASE/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();
console.log('Firebase initialized successfully.\n');

// ============================================================================
// UNIFIED TEMPLATE REQUIREMENTS
// ============================================================================

const REQUIRED_FIELDS = {
  // Core Identity (critical)
  'id': { type: 'string', critical: true, weight: 10 },
  'type': { type: 'string', critical: true, weight: 10, default: 'deity' },
  'name': { type: 'string', critical: true, weight: 10 },

  // Display (important for UI)
  'icon': { type: 'string', critical: false, weight: 3, default: '⚡' },
  'color': { type: 'string', critical: false, weight: 1, default: '#8b7fff' },

  // Content (valuable for users)
  'description': { type: 'string', critical: false, weight: 8 },
  'summary': { type: 'string', critical: false, weight: 5 },
  'content': { type: 'string', critical: false, weight: 5 },

  // Metadata (essential for organization)
  'metadata.category': { type: 'string', critical: false, weight: 4, default: 'deity' },
  'metadata.tags': { type: 'array', critical: false, weight: 4, default: [] },
  'metadata.status': { type: 'string', critical: false, weight: 2, default: 'published' },
  'metadata.visibility': { type: 'string', critical: false, weight: 1, default: 'public' },
  'metadata.importance': { type: 'number', critical: false, weight: 3, default: 50 },
  'metadata.featured': { type: 'boolean', critical: false, weight: 1, default: false },
  'metadata.created': { type: 'timestamp', critical: false, weight: 1 },
  'metadata.updated': { type: 'timestamp', critical: false, weight: 1 },

  // Relationships (critical for cross-linking)
  'relationships.mythology': { type: 'string', critical: false, weight: 5 },
  'relationships.relatedIds': { type: 'array', critical: false, weight: 4, default: [] },
  'relationships.collections': { type: 'array', critical: false, weight: 3, default: [] },

  // Search (essential for discovery)
  'search.keywords': { type: 'array', critical: false, weight: 4, default: [] },
  'search.aliases': { type: 'array', critical: false, weight: 3, default: [] },
  'search.facets': { type: 'object', critical: false, weight: 3, default: {} },
  'search.searchableText': { type: 'string', critical: false, weight: 2 },

  // Rendering (for UI flexibility)
  'rendering.modes': { type: 'object', critical: false, weight: 2, default: {
    hyperlink: true,
    expandableRow: true,
    panelCard: true,
    subsection: true,
    fullPage: true
  }},
  'rendering.defaultMode': { type: 'string', critical: false, weight: 1, default: 'panelCard' },
  'rendering.defaultAction': { type: 'string', critical: false, weight: 1, default: 'page' }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get nested value from object by path
 */
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set nested value in object by path
 */
function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Check if a value is empty
 */
function isEmpty(value) {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Extract mythology from deity ID or existing data
 */
function extractMythology(deity) {
  // Check if already set
  if (deity.relationships?.mythology) {
    return deity.relationships.mythology;
  }

  // Try to infer from ID (e.g., "greek-zeus" -> "greek")
  const id = deity.id || '';
  const mythologies = ['greek', 'roman', 'norse', 'egyptian', 'hindu', 'buddhist',
                       'celtic', 'japanese', 'chinese', 'babylonian', 'sumerian',
                       'aztec', 'mayan', 'persian', 'christian', 'islamic', 'jewish'];

  for (const mythology of mythologies) {
    if (id.includes(mythology)) {
      return mythology;
    }
  }

  // Try to infer from tags
  if (deity.metadata?.tags) {
    for (const tag of deity.metadata.tags) {
      const tagLower = tag.toLowerCase();
      for (const mythology of mythologies) {
        if (tagLower.includes(mythology)) {
          return mythology;
        }
      }
    }
  }

  return null;
}

/**
 * Generate searchable text from deity data
 */
function generateSearchableText(deity) {
  const parts = [
    deity.name,
    deity.title,
    deity.subtitle,
    deity.description,
    deity.summary,
    deity.content,
    ...(deity.search?.keywords || []),
    ...(deity.search?.aliases || []),
    ...(deity.metadata?.tags || [])
  ].filter(Boolean);

  return parts.join(' ').toLowerCase();
}

/**
 * Generate keywords from deity name and description
 */
function generateKeywords(deity) {
  const keywords = new Set();

  // Add name variations
  if (deity.name) {
    keywords.add(deity.name.toLowerCase());
    // Add individual words from name
    deity.name.split(/\s+/).forEach(word => {
      if (word.length > 2) keywords.add(word.toLowerCase());
    });
  }

  // Add from aliases if they exist
  if (deity.search?.aliases) {
    deity.search.aliases.forEach(alias => keywords.add(alias.toLowerCase()));
  }

  // Add from tags
  if (deity.metadata?.tags) {
    deity.metadata.tags.forEach(tag => keywords.add(tag.toLowerCase()));
  }

  return Array.from(keywords);
}

/**
 * Infer facets from deity data
 */
function inferFacets(deity) {
  const facets = deity.search?.facets || {};

  // Infer culture from mythology
  const mythology = extractMythology(deity);
  if (mythology && !facets.culture) {
    facets.culture = mythology;
  }

  // Infer from attributes if they exist
  if (deity.attributes) {
    if (deity.attributes.domains && !facets.domain) {
      facets.domain = deity.attributes.domains[0];
    }
    if (deity.attributes.gender && !facets.gender) {
      facets.gender = deity.attributes.gender;
    }
  }

  // Default power level if not set
  if (!facets.power) {
    // Base power on importance if available
    const importance = deity.metadata?.importance || 50;
    if (importance >= 80) facets.power = 'high';
    else if (importance >= 50) facets.power = 'medium';
    else facets.power = 'low';
  }

  return facets;
}

/**
 * Analyze deity and identify missing fields
 */
function analyzeDeity(deity) {
  const analysis = {
    id: deity.id || 'unknown',
    name: deity.name || 'Unknown',
    completeness: 0,
    maxScore: 0,
    actualScore: 0,
    missingFields: [],
    fieldsToAdd: {}
  };

  // Check each required field
  Object.entries(REQUIRED_FIELDS).forEach(([fieldPath, spec]) => {
    analysis.maxScore += spec.weight;

    const currentValue = getNestedValue(deity, fieldPath);

    if (!isEmpty(currentValue)) {
      // Field exists and has value
      analysis.actualScore += spec.weight;
    } else {
      // Field missing - needs to be added
      analysis.missingFields.push({
        path: fieldPath,
        weight: spec.weight,
        critical: spec.critical
      });

      // Determine value to add
      let valueToAdd = null;

      // Special handling for specific fields
      if (fieldPath === 'type') {
        valueToAdd = 'deity';
      } else if (fieldPath === 'metadata.category') {
        valueToAdd = 'deity';
      } else if (fieldPath === 'metadata.status') {
        valueToAdd = 'published';
      } else if (fieldPath === 'metadata.visibility') {
        valueToAdd = 'public';
      } else if (fieldPath === 'metadata.created' || fieldPath === 'metadata.updated') {
        valueToAdd = admin.firestore.Timestamp.now();
      } else if (fieldPath === 'relationships.mythology') {
        valueToAdd = extractMythology(deity);
      } else if (fieldPath === 'search.searchableText') {
        valueToAdd = generateSearchableText(deity);
      } else if (fieldPath === 'search.keywords') {
        valueToAdd = generateKeywords(deity);
      } else if (fieldPath === 'search.facets') {
        valueToAdd = inferFacets(deity);
      } else if (fieldPath === 'summary' && deity.description) {
        // Use description as summary if summary is missing
        valueToAdd = deity.description;
      } else if (fieldPath === 'description' && deity.summary) {
        // Extract first sentence from summary as description
        const firstSentence = deity.summary.split(/[.!?]/)[0];
        valueToAdd = firstSentence ? firstSentence.trim() + '.' : deity.summary.substring(0, 150);
      } else if (spec.default !== undefined) {
        valueToAdd = spec.default;
      }

      if (valueToAdd !== null && valueToAdd !== undefined) {
        analysis.fieldsToAdd[fieldPath] = valueToAdd;
      }
    }
  });

  // Calculate completeness
  analysis.completeness = analysis.maxScore > 0
    ? Math.round((analysis.actualScore / analysis.maxScore) * 100)
    : 0;

  return analysis;
}

/**
 * Apply fixes to deity object
 */
function applyFixes(deity, analysis) {
  const updatedDeity = JSON.parse(JSON.stringify(deity)); // Deep clone

  // Apply each field to add
  Object.entries(analysis.fieldsToAdd).forEach(([fieldPath, value]) => {
    setNestedValue(updatedDeity, fieldPath, value);
  });

  // Update searchable text and keywords (always regenerate these)
  if (!updatedDeity.search) updatedDeity.search = {};
  updatedDeity.search.searchableText = generateSearchableText(updatedDeity);
  updatedDeity.search.keywords = generateKeywords(updatedDeity);
  updatedDeity.search.facets = inferFacets(updatedDeity);

  // Update timestamp
  if (!updatedDeity.metadata) updatedDeity.metadata = {};
  updatedDeity.metadata.updated = admin.firestore.Timestamp.now();

  return updatedDeity;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const startTime = Date.now();

  console.log('Step 1: Downloading all deities from Firebase...\n');

  const snapshot = await db.collection('deities').get();
  const deities = [];

  snapshot.forEach(doc => {
    deities.push({
      id: doc.id,
      ...doc.data()
    });
  });

  console.log(`Found ${deities.length} deities in Firebase.\n`);

  console.log('Step 2: Analyzing deities for completeness...\n');

  const analyses = deities.map(deity => analyzeDeity(deity));
  const incompleteDeities = analyses.filter(a => a.completeness < 100);

  console.log(`Complete deities: ${deities.length - incompleteDeities.length}`);
  console.log(`Incomplete deities: ${incompleteDeities.length}\n`);

  // Sort by completeness (lowest first - most work needed)
  incompleteDeities.sort((a, b) => a.completeness - b.completeness);

  // Statistics
  const beforeAvg = Math.round(
    analyses.reduce((sum, a) => sum + a.completeness, 0) / analyses.length
  );

  console.log(`Average completeness BEFORE: ${beforeAvg}%\n`);

  if (incompleteDeities.length === 0) {
    console.log('All deities are already complete! Nothing to do.\n');
    process.exit(0);
  }

  console.log('Step 3: Applying fixes...\n');

  const fixResults = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
    changes: []
  };

  for (const analysis of incompleteDeities) {
    fixResults.attempted++;

    try {
      // Find original deity
      const originalDeity = deities.find(d => d.id === analysis.id);

      // Apply fixes
      const updatedDeity = applyFixes(originalDeity, analysis);

      // Calculate new completeness
      const newAnalysis = analyzeDeity(updatedDeity);

      if (VERBOSE) {
        console.log(`[${fixResults.attempted}/${incompleteDeities.length}] ${analysis.name}`);
        console.log(`  Before: ${analysis.completeness}% → After: ${newAnalysis.completeness}%`);
        console.log(`  Added fields: ${Object.keys(analysis.fieldsToAdd).length}`);
      }

      // Update in Firebase (unless dry run)
      if (!DRY_RUN) {
        const { id, ...dataToUpdate } = updatedDeity;
        await db.collection('deities').doc(id).set(dataToUpdate, { merge: true });
      }

      fixResults.succeeded++;
      fixResults.changes.push({
        id: analysis.id,
        name: analysis.name,
        beforeCompleteness: analysis.completeness,
        afterCompleteness: newAnalysis.completeness,
        fieldsAdded: Object.keys(analysis.fieldsToAdd),
        fieldCount: Object.keys(analysis.fieldsToAdd).length
      });

    } catch (error) {
      fixResults.failed++;
      fixResults.errors.push({
        id: analysis.id,
        name: analysis.name,
        error: error.message
      });

      console.error(`  ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('PROCESSING COMPLETE');
  console.log('='.repeat(80));

  // Calculate after statistics
  const afterDeities = await db.collection('deities').get();
  const afterAnalyses = [];
  afterDeities.forEach(doc => {
    afterAnalyses.push(analyzeDeity({ id: doc.id, ...doc.data() }));
  });

  const afterAvg = Math.round(
    afterAnalyses.reduce((sum, a) => sum + a.completeness, 0) / afterAnalyses.length
  );

  console.log(`Total deities: ${deities.length}`);
  console.log(`Attempted fixes: ${fixResults.attempted}`);
  console.log(`Successful: ${fixResults.succeeded}`);
  console.log(`Failed: ${fixResults.failed}`);
  console.log(`\nCompleteness:`);
  console.log(`  Before: ${beforeAvg}%`);
  console.log(`  After: ${DRY_RUN ? '(dry run - no changes)' : afterAvg + '%'}`);
  console.log(`  Improvement: ${DRY_RUN ? 'N/A' : '+' + (afterAvg - beforeAvg) + '%'}`);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nDuration: ${duration}s`);
  console.log('='.repeat(80));

  // Generate report
  console.log('\nGenerating report...');

  const report = {
    timestamp: new Date().toISOString(),
    mode: DRY_RUN ? 'dry-run' : 'live',
    statistics: {
      totalDeities: deities.length,
      incompleteDeities: incompleteDeities.length,
      completeDeities: deities.length - incompleteDeities.length,
      beforeAverage: beforeAvg,
      afterAverage: DRY_RUN ? null : afterAvg,
      improvement: DRY_RUN ? null : afterAvg - beforeAvg
    },
    processing: {
      attempted: fixResults.attempted,
      succeeded: fixResults.succeeded,
      failed: fixResults.failed,
      duration: duration + 's'
    },
    changes: fixResults.changes,
    errors: fixResults.errors,
    topImprovements: fixResults.changes
      .sort((a, b) => (b.afterCompleteness - b.beforeCompleteness) - (a.afterCompleteness - a.beforeCompleteness))
      .slice(0, 10),
    mostFieldsAdded: fixResults.changes
      .sort((a, b) => b.fieldCount - a.fieldCount)
      .slice(0, 10)
  };

  // Save JSON report
  const reportPath = path.join(REPORT_DIR, 'AGENT1_DEITY_FIX_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`JSON report saved: ${reportPath}`);

  // Generate markdown report
  const md = generateMarkdownReport(report);
  const mdPath = path.join(REPORT_DIR, 'AGENT1_DEITY_FIX_REPORT.md');
  fs.writeFileSync(mdPath, md);
  console.log(`Markdown report saved: ${mdPath}`);

  console.log('\n✅ Agent 1 complete!\n');

  process.exit(0);
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report) {
  const md = [];

  md.push('# Agent 1: Deity Completeness Fix Report');
  md.push('');
  md.push(`**Generated:** ${report.timestamp}`);
  md.push(`**Mode:** ${report.mode.toUpperCase()}`);
  md.push('');

  md.push('## Executive Summary');
  md.push('');
  md.push('Agent 1 has systematically processed all deity assets in Firebase to ensure compliance with the unified template schema.');
  md.push('');

  md.push('### Statistics');
  md.push('');
  md.push(`- **Total Deities:** ${report.statistics.totalDeities}`);
  md.push(`- **Complete Deities:** ${report.statistics.completeDeities}`);
  md.push(`- **Incomplete Deities:** ${report.statistics.incompleteDeities}`);
  md.push('');
  md.push('### Completeness');
  md.push('');
  md.push(`- **Before:** ${report.statistics.beforeAverage}%`);
  if (report.mode === 'live') {
    md.push(`- **After:** ${report.statistics.afterAverage}%`);
    md.push(`- **Improvement:** +${report.statistics.improvement}%`);
  } else {
    md.push(`- **After:** N/A (dry run)`);
  }
  md.push('');

  md.push('### Processing Results');
  md.push('');
  md.push(`- **Attempted:** ${report.processing.attempted} deities`);
  md.push(`- **Succeeded:** ${report.processing.succeeded} deities`);
  md.push(`- **Failed:** ${report.processing.failed} deities`);
  md.push(`- **Duration:** ${report.processing.duration}`);
  md.push('');

  if (report.errors.length > 0) {
    md.push('## Errors');
    md.push('');
    report.errors.forEach(err => {
      md.push(`- **${err.name}** (${err.id}): ${err.error}`);
    });
    md.push('');
  }

  md.push('## Top 10 Improvements');
  md.push('');
  md.push('These deities had the greatest completeness improvement:');
  md.push('');
  md.push('| Deity | Before | After | Improvement | Fields Added |');
  md.push('|-------|--------|-------|-------------|--------------|');

  report.topImprovements.forEach(change => {
    const improvement = change.afterCompleteness - change.beforeCompleteness;
    md.push(`| ${change.name} | ${change.beforeCompleteness}% | ${change.afterCompleteness}% | +${improvement}% | ${change.fieldCount} |`);
  });
  md.push('');

  md.push('## Most Fields Added');
  md.push('');
  md.push('These deities had the most fields added:');
  md.push('');
  md.push('| Deity | Fields Added | Before | After |');
  md.push('|-------|--------------|--------|-------|');

  report.mostFieldsAdded.forEach(change => {
    md.push(`| ${change.name} | ${change.fieldCount} | ${change.beforeCompleteness}% | ${change.afterCompleteness}% |`);
  });
  md.push('');

  md.push('## Fields Added');
  md.push('');
  md.push('Common fields that were added across deities:');
  md.push('');

  // Count field additions
  const fieldCounts = {};
  report.changes.forEach(change => {
    change.fieldsAdded.forEach(field => {
      fieldCounts[field] = (fieldCounts[field] || 0) + 1;
    });
  });

  const sortedFields = Object.entries(fieldCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  md.push('| Field | Added To |');
  md.push('|-------|----------|');
  sortedFields.forEach(([field, count]) => {
    md.push(`| ${field} | ${count} deities |`);
  });
  md.push('');

  md.push('## Next Steps');
  md.push('');
  md.push('1. Review any errors encountered during processing');
  md.push('2. Manually verify a sample of updated deities for accuracy');
  md.push('3. Proceed to Agent 2 for next collection processing');
  md.push('');

  return md.join('\n');
}

// Run the script
main().catch(error => {
  console.error('\n' + '='.repeat(80));
  console.error('FATAL ERROR');
  console.error('='.repeat(80));
  console.error(error);
  process.exit(1);
});
