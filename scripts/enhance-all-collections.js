#!/usr/bin/env node

/**
 * Master Collection Enhancement Script
 *
 * Runs all collection-specific enhancement scripts and generates
 * a comprehensive report across all 8 collections.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORT_FILE = path.join(__dirname, '../COLLECTION_METADATA_ENHANCED.md');

const collections = [
  { name: 'items', script: 'enhance-items-metadata.js', priority: 1 },
  { name: 'creatures', script: 'enhance-creatures-metadata.js', priority: 2 },
  { name: 'heroes', script: 'enhance-heroes-metadata.js', priority: 3 },
  { name: 'places', script: 'enhance-places-metadata.js', priority: 4 },
  { name: 'herbs', script: 'enhance-herbs-metadata.js', priority: 5 },
  { name: 'rituals', script: 'enhance-rituals-metadata.js', priority: 6 },
  { name: 'texts', script: 'enhance-texts-metadata.js', priority: 7 },
  { name: 'symbols', script: 'enhance-symbols-metadata.js', priority: 8 }
];

console.log('========================================');
console.log('COLLECTION METADATA ENHANCEMENT');
console.log('========================================\n');

const results = {};
const startTime = Date.now();

// Run each enhancement script
for (const collection of collections) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${collection.name.toUpperCase()}`);
  console.log('='.repeat(60));

  try {
    const scriptPath = path.join(__dirname, collection.script);
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });

    // Read the generated report
    const reportPath = path.join(__dirname, `../firebase-assets-enhanced/${collection.name}/enhancement-report.json`);

    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      results[collection.name] = report;
      console.log(`✓ ${collection.name} enhancement complete`);
    } else {
      console.log(`⚠ No report found for ${collection.name}`);
      results[collection.name] = { skipped: true };
    }

  } catch (error) {
    console.error(`✗ Error processing ${collection.name}: ${error.message}`);
    results[collection.name] = { error: error.message };
  }
}

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

// Generate comprehensive report
let report = `# Collection Metadata Enhancement Report

**Generated:** ${new Date().toISOString()}
**Duration:** ${duration} seconds

## Executive Summary

This report documents the metadata enhancement process across all 8 entity collections in the Eyes of Azrael mythology database.

### Enhancement Objectives

1. **Standardize metadata** across all collection types
2. **Improve completeness** by adding missing fields
3. **Ensure icon assignment** for better UI rendering
4. **Validate data quality** across collections

## Collection Overview

| Collection | Total Items | Enhanced | Enhancement Rate | Completeness Improvement |
|------------|-------------|----------|------------------|--------------------------|
`;

// Calculate totals
let totalItems = 0;
let totalEnhanced = 0;
let totalBefore = { complete: 0, partial: 0, minimal: 0 };
let totalAfter = { complete: 0, partial: 0, minimal: 0 };

for (const [collectionName, data] of Object.entries(results)) {
  if (data.skipped || data.error) continue;

  const stats = data.statistics || {};
  const summary = data.summary || {};

  totalItems += stats.total || 0;
  totalEnhanced += stats.enhanced || 0;

  if (stats.before) {
    totalBefore.complete += stats.before.complete || 0;
    totalBefore.partial += stats.before.partial || 0;
    totalBefore.minimal += stats.before.minimal || 0;
  }

  if (stats.after) {
    totalAfter.complete += stats.after.complete || 0;
    totalAfter.partial += stats.after.partial || 0;
    totalAfter.minimal += stats.after.minimal || 0;
  }

  const beforePercent = stats.total > 0 ? ((stats.before?.complete || 0) / stats.total * 100).toFixed(1) : '0';
  const afterPercent = stats.total > 0 ? ((stats.after?.complete || 0) / stats.total * 100).toFixed(1) : '0';
  const improvement = (parseFloat(afterPercent) - parseFloat(beforePercent)).toFixed(1);

  report += `| ${collectionName} | ${stats.total || 0} | ${stats.enhanced || 0} | ${summary.enhancement_rate || '0%'} | ${beforePercent}% → ${afterPercent}% (+${improvement}%) |\n`;
}

const overallRate = totalItems > 0 ? ((totalEnhanced / totalItems) * 100).toFixed(1) : '0';
const beforeCompletePercent = totalItems > 0 ? ((totalBefore.complete / totalItems) * 100).toFixed(1) : '0';
const afterCompletePercent = totalItems > 0 ? ((totalAfter.complete / totalItems) * 100).toFixed(1) : '0';
const overallImprovement = (parseFloat(afterCompletePercent) - parseFloat(beforeCompletePercent)).toFixed(1);

report += `| **TOTAL** | **${totalItems}** | **${totalEnhanced}** | **${overallRate}%** | **${beforeCompletePercent}% → ${afterCompletePercent}% (+${overallImprovement}%)** |\n\n`;

report += `## Key Metrics

- **Total Entities Processed:** ${totalItems}
- **Entities Enhanced:** ${totalEnhanced}
- **Overall Enhancement Rate:** ${overallRate}%
- **Completeness Improvement:** +${overallImprovement}%

### Completeness Distribution

**Before Enhancement:**
- Complete (7-8 fields): ${totalBefore.complete} (${beforeCompletePercent}%)
- Partial (4-6 fields): ${totalBefore.partial} (${totalItems > 0 ? ((totalBefore.partial / totalItems) * 100).toFixed(1) : '0'}%)
- Minimal (0-3 fields): ${totalBefore.minimal} (${totalItems > 0 ? ((totalBefore.minimal / totalItems) * 100).toFixed(1) : '0'}%)

**After Enhancement:**
- Complete (7-8 fields): ${totalAfter.complete} (${afterCompletePercent}%)
- Partial (4-6 fields): ${totalAfter.partial} (${totalItems > 0 ? ((totalAfter.partial / totalItems) * 100).toFixed(1) : '0'}%)
- Minimal (0-3 fields): ${totalAfter.minimal} (${totalItems > 0 ? ((totalAfter.minimal / totalItems) * 100).toFixed(1) : '0'}%)

`;

// Detailed breakdown by collection
report += `## Detailed Collection Reports

`;

for (const [collectionName, data] of Object.entries(results)) {
  if (data.skipped) {
    report += `### ${collectionName.toUpperCase()}\n\n**Status:** Skipped (directory not found)\n\n`;
    continue;
  }

  if (data.error) {
    report += `### ${collectionName.toUpperCase()}\n\n**Status:** Error - ${data.error}\n\n`;
    continue;
  }

  const stats = data.statistics || {};
  const fieldsAdded = stats.fieldsAdded || {};

  report += `### ${collectionName.toUpperCase()}\n\n`;
  report += `**Total Files:** ${stats.total || 0}  \n`;
  report += `**Files Enhanced:** ${stats.enhanced || 0}  \n`;
  report += `**Enhancement Rate:** ${data.summary?.enhancement_rate || '0%'}\n\n`;

  // Fields added
  report += `**Fields Added:**\n\n`;
  const fieldEntries = Object.entries(fieldsAdded).filter(([_, count]) => count > 0);

  if (fieldEntries.length > 0) {
    for (const [field, count] of fieldEntries) {
      report += `- ${field}: ${count}\n`;
    }
  } else {
    report += `- None (all items already complete)\n`;
  }

  report += `\n`;
}

// Metadata field definitions
report += `## Metadata Field Definitions

### Items
- **powers:** Array of item abilities and magical properties
- **wielders:** Who has used or currently uses the item
- **origin:** Creation story or discovery narrative
- **material:** What the item is made from
- **item_category:** Classification (weapon, armor, relic, etc.)

### Creatures
- **abilities:** Special powers and skills
- **habitat:** Where the creature lives
- **weaknesses:** Vulnerabilities
- **appearance:** Physical description
- **creature_category:** Type classification

### Heroes
- **achievements:** Heroic deeds and accomplishments
- **associated_deities:** Gods connected to the hero
- **weapons:** Items and weapons used
- **quests:** Major journeys and tasks undertaken

### Places
- **significance:** Importance in mythology
- **location:** Geographic or cosmological position
- **associated_deities:** Gods connected to the place
- **events:** Major events that occurred there

### Herbs
- **uses:** Medicinal and ritual applications
- **preparation:** How the herb is prepared
- **associated_deities:** Gods connected to the herb
- **effects:** Physical and spiritual effects

### Rituals
- **purpose:** Intent of the ritual
- **steps:** Procedural instructions
- **participants:** Who performs the ritual
- **timing:** When the ritual is performed

### Texts
- **author:** Who wrote the text
- **date:** When it was written
- **content_summary:** Overview of contents
- **significance:** Importance in tradition

### Symbols
- **meaning:** What the symbol represents
- **usage:** How and where it's used
- **variations:** Different forms
- **cultural_context:** Cultural background

## Common Fields (All Collections)

- **summary:** 1-2 sentence overview
- **cultural_significance:** Importance in cultural context
- **primary_sources:** Ancient texts that mention the entity
- **icon:** Emoji or symbol for UI rendering
- **metadata:** Technical tracking information

## Enhancement Process

Each collection was processed with a specialized enhancement script that:

1. **Scanned** all JSON files in the collection directory
2. **Analyzed** existing metadata completeness
3. **Extracted** missing fields from descriptions using pattern matching
4. **Generated** intelligent defaults where extraction failed
5. **Validated** field formats and data quality
6. **Saved** enhanced files with tracking metadata

## Next Steps

1. **Review** enhanced metadata for accuracy
2. **Upload** to Firebase database
3. **Validate** UI rendering with new metadata
4. **Monitor** completeness metrics over time
5. **Add** user contribution workflows for missing data

---

*Enhancement completed in ${duration} seconds*
`;

// Write report
fs.writeFileSync(REPORT_FILE, report, 'utf8');

console.log('\n' + '='.repeat(60));
console.log('ALL ENHANCEMENTS COMPLETE');
console.log('='.repeat(60));
console.log(`\nTotal collections processed: ${Object.keys(results).length}`);
console.log(`Total items processed: ${totalItems}`);
console.log(`Total items enhanced: ${totalEnhanced}`);
console.log(`Overall enhancement rate: ${overallRate}%`);
console.log(`Completeness improvement: +${overallImprovement}%`);
console.log(`\nComprehensive report saved to:`);
console.log(`  ${REPORT_FILE}`);
