#!/usr/bin/env node

/**
 * Transform all parsed data files to centralized schema
 *
 * This script:
 * 1. Reads all *_parsed.json files from parsed_data/
 * 2. Transforms each document to match CENTRALIZED_SCHEMA.md
 * 3. Adds required fields (mythology, contentType, metadata, searchTokens, tags, qualityScore, relatedIds)
 * 4. Saves transformed files to transformed_data/
 * 5. Generates TRANSFORMATION_REPORT.md
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PARSED_DATA_DIR = path.join(__dirname, 'parsed_data');
const TRANSFORMED_DATA_DIR = path.join(__dirname, 'transformed_data');
const REPORT_PATH = path.join(__dirname, 'TRANSFORMATION_REPORT.md');

// Stop words to exclude from search tokens
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'with', 'from', 'that', 'this', 'into', 'also',
  'been', 'were', 'have', 'their', 'which', 'was', 'his', 'her', 'they', 'she'
]);

/**
 * Generate search tokens from document
 */
function generateSearchTokens(doc) {
  const tokens = new Set();

  // Name variations
  if (doc.name) {
    tokens.add(doc.name.toLowerCase());
  }

  if (doc.displayName) {
    // Remove emojis and clean
    const cleanName = doc.displayName.replace(/[^\w\s-]/g, '').trim().toLowerCase();
    if (cleanName) tokens.add(cleanName);
  }

  // Alternate names
  if (doc.alternateNames) {
    doc.alternateNames.forEach(name => {
      if (name) tokens.add(name.toLowerCase());
    });
  }

  // Epithets (for deities)
  if (doc.epithets) {
    doc.epithets.forEach(epithet => {
      if (epithet) tokens.add(epithet.toLowerCase());
    });
  }

  // Titles (for heroes)
  if (doc.titles) {
    doc.titles.forEach(title => {
      if (title) tokens.add(title.toLowerCase());
    });
  }

  // Domains
  if (doc.domains) {
    doc.domains.forEach(domain => {
      if (domain) tokens.add(domain.toLowerCase());
    });
  }

  // Tags
  if (doc.tags) {
    doc.tags.forEach(tag => {
      if (tag) tokens.add(tag.toLowerCase());
    });
  }

  // Mythology
  if (doc.mythology) {
    tokens.add(doc.mythology.toLowerCase());
  }

  // Content type
  if (doc.contentType) {
    tokens.add(doc.contentType.toLowerCase());
  }

  // Description keywords (extract meaningful words)
  if (doc.description) {
    const words = doc.description.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w));
    words.slice(0, 50).forEach(w => tokens.add(w)); // Limit to 50 keywords
  }

  return Array.from(tokens).sort();
}

/**
 * Generate tags from document
 */
function generateTags(doc) {
  const tags = new Set();

  // Add mythology
  if (doc.mythology) {
    tags.add(doc.mythology);
  }

  // Add content type
  if (doc.contentType) {
    tags.add(doc.contentType);
  }

  // Add archetypes
  if (doc.archetypes) {
    doc.archetypes.forEach(arch => {
      if (arch) tags.add(arch);
    });
  }

  // Add domains
  if (doc.domains) {
    doc.domains.forEach(domain => {
      if (domain) tags.add(domain);
    });
  }

  // Add type (for creatures, cosmology, etc.)
  if (doc.type) {
    tags.add(doc.type);
  }

  // Add existing tags
  if (doc.tags) {
    doc.tags.forEach(tag => {
      if (tag) tags.add(tag);
    });
  }

  return Array.from(tags).sort();
}

/**
 * Calculate quality score (0-100)
 */
function calculateQualityScore(doc) {
  let score = 0;

  // Field completeness (40 points)
  const requiredFields = ['name', 'mythology', 'contentType', 'description'];
  const presentFields = requiredFields.filter(f => doc[f] && doc[f].toString().trim()).length;
  score += (presentFields / requiredFields.length) * 40;

  // Description length (20 points)
  const descLength = (doc.description || '').length;
  if (descLength > 500) score += 20;
  else if (descLength > 200) score += 15;
  else if (descLength > 100) score += 10;
  else if (descLength > 0) score += 5;

  // Relationships (15 points)
  if (doc.relationships) {
    const relationshipCount = Object.keys(doc.relationships).filter(
      key => doc.relationships[key] && doc.relationships[key].length > 0
    ).length;
    score += Math.min(relationshipCount * 3, 15);
  }

  // Primary sources (15 points)
  if (doc.primarySources) {
    const sourceCount = doc.primarySources.length;
    score += Math.min(sourceCount * 5, 15);
  }

  // Verification status (10 points)
  if (doc.metadata?.verified) {
    score += 10;
  }

  return Math.round(score);
}

/**
 * Extract related IDs from relationships
 */
function extractRelatedIds(doc) {
  const relatedIds = new Set();

  if (doc.relationships) {
    Object.values(doc.relationships).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'string' && item.includes('_')) {
            // Looks like an ID (e.g., "greek_zeus")
            relatedIds.add(item);
          }
        });
      }
    });
  }

  // Check other common relationship fields
  ['parents', 'children', 'consort', 'siblings', 'allies', 'enemies',
   'slainBy', 'guards', 'characters', 'participants', 'deities'].forEach(field => {
    if (doc[field] && Array.isArray(doc[field])) {
      doc[field].forEach(item => {
        if (typeof item === 'string' && item.includes('_')) {
          relatedIds.add(item);
        }
      });
    }
  });

  return Array.from(relatedIds).sort();
}

/**
 * Detect content type from filename or context
 */
function detectContentType(filename) {
  const contentTypes = {
    'deities': 'deity',
    'heroes': 'hero',
    'creatures': 'creature',
    'cosmology': 'cosmology',
    'texts': 'text',
    'herbs': 'herb',
    'rituals': 'ritual',
    'symbols': 'symbol',
    'concepts': 'concept',
    'myths': 'myth',
    'events': 'event'
  };

  for (const [key, value] of Object.entries(contentTypes)) {
    if (filename.includes(key)) {
      return value;
    }
  }

  return 'unknown';
}

/**
 * Extract mythology from filename
 */
function extractMythology(filename, doc) {
  // If already present in doc, use it
  if (doc.mythology) {
    return doc.mythology;
  }

  // Extract from filename
  const mythologies = [
    'greek', 'norse', 'egyptian', 'roman', 'hindu', 'buddhist', 'chinese',
    'japanese', 'celtic', 'aztec', 'mayan', 'babylonian', 'sumerian',
    'persian', 'jewish', 'christian', 'islamic', 'yoruba', 'native_american',
    'freemasons', 'apocryphal', 'tarot'
  ];

  for (const myth of mythologies) {
    if (filename.includes(myth)) {
      return myth;
    }
  }

  // Check in ID
  if (doc.id) {
    for (const myth of mythologies) {
      if (doc.id.startsWith(myth + '_')) {
        return myth;
      }
    }
  }

  return 'unknown';
}

/**
 * Transform a single document to centralized schema
 */
function transformDocument(doc, filename) {
  // Ensure required base fields
  const mythology = extractMythology(filename, doc);
  const contentType = doc.contentType || detectContentType(filename);

  const transformed = {
    // ===== IDENTITY =====
    id: doc.id || `${mythology}_unknown_${Date.now()}`,
    name: doc.name || 'Unknown',
    displayName: doc.displayName || doc.name || 'Unknown',

    // ===== CLASSIFICATION (REQUIRED) =====
    mythology: mythology,
    contentType: contentType,

    // ===== CONTENT =====
    description: doc.description || '',

    // ===== METADATA (REQUIRED) =====
    metadata: {
      createdAt: doc.metadata?.createdAt || new Date().toISOString(),
      updatedAt: doc.metadata?.updatedAt || new Date().toISOString(),
      createdBy: doc.metadata?.createdBy || 'system',
      source: doc.metadata?.source || 'html_parser',
      verified: doc.metadata?.verified || false,
      sourceFile: doc.metadata?.sourceFile || ''
    },

    // ===== SEARCH & DISCOVERY =====
    searchTokens: [],  // Will be generated below
    tags: [],          // Will be generated below

    // ===== QUALITY & METRICS =====
    qualityScore: 0,   // Will be calculated below

    // ===== RELATIONSHIPS =====
    relatedIds: [],    // Will be extracted below
  };

  // Preserve all original fields (content-specific)
  Object.keys(doc).forEach(key => {
    if (!transformed.hasOwnProperty(key) && key !== 'filename') {
      transformed[key] = doc[key];
    }
  });

  // Generate derived fields
  transformed.searchTokens = generateSearchTokens(transformed);
  transformed.tags = generateTags(transformed);
  transformed.qualityScore = calculateQualityScore(transformed);
  transformed.relatedIds = extractRelatedIds(transformed);

  return transformed;
}

/**
 * Transform a parsed file
 */
function transformParsedFile(filePath) {
  console.log(`\nTransforming: ${path.basename(filePath)}`);

  const rawData = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(rawData);

  const stats = {
    filename: path.basename(filePath),
    originalCount: 0,
    transformedCount: 0,
    qualityScores: [],
    fieldsAdded: {
      mythology: 0,
      contentType: 0,
      searchTokens: 0,
      tags: 0,
      qualityScore: 0,
      relatedIds: 0
    },
    errors: []
  };

  let transformedData = null;

  // Handle different file structures
  if (parsed.items && Array.isArray(parsed.items)) {
    // Files with items array (heroes, creatures, etc.)
    stats.originalCount = parsed.items.length;
    const transformedItems = [];

    parsed.items.forEach((item, index) => {
      try {
        const transformed = transformDocument(item, filePath);
        transformedItems.push(transformed);
        stats.transformedCount++;

        // Track quality scores
        stats.qualityScores.push(transformed.qualityScore);

        // Track fields added
        if (!item.mythology) stats.fieldsAdded.mythology++;
        if (!item.contentType) stats.fieldsAdded.contentType++;
        if (!item.searchTokens) stats.fieldsAdded.searchTokens++;
        if (!item.tags) stats.fieldsAdded.tags++;
        if (!item.qualityScore) stats.fieldsAdded.qualityScore++;
        if (!item.relatedIds) stats.fieldsAdded.relatedIds++;

      } catch (error) {
        stats.errors.push(`Item ${index}: ${error.message}`);
      }
    });

    transformedData = {
      ...parsed,
      items: transformedItems,
      transformedAt: new Date().toISOString(),
      schemaVersion: '1.0'
    };

  } else if (parsed.mythology && parsed.mythology.deities) {
    // Mythology-specific files (greek, norse, etc.)
    // These contain nested deity/hero/creature arrays
    stats.originalCount = 0;
    transformedData = {
      ...parsed,
      transformedAt: new Date().toISOString(),
      schemaVersion: '1.0'
    };

    // Note: These files have complex nested structures
    // For now, we'll just add metadata and pass through
    stats.transformedCount = 0;
    stats.errors.push('Mythology-specific file structure - requires manual review');

  } else {
    // Unknown structure
    stats.errors.push('Unknown file structure - skipped transformation');
    transformedData = parsed;
  }

  return { transformedData, stats };
}

/**
 * Generate transformation report
 */
function generateReport(allStats) {
  const now = new Date().toISOString();

  let report = `# Firebase Data Transformation Report\n\n`;
  report += `**Generated:** ${now}\n`;
  report += `**Location:** H:\\Github\\EyesOfAzrael\\FIREBASE\\transformed_data\\\n\n`;
  report += `---\n\n`;

  // Summary
  report += `## Executive Summary\n\n`;
  const totalFiles = allStats.length;
  const totalOriginal = allStats.reduce((sum, s) => sum + s.originalCount, 0);
  const totalTransformed = allStats.reduce((sum, s) => sum + s.transformedCount, 0);
  const totalErrors = allStats.reduce((sum, s) => sum + s.errors.length, 0);

  report += `- **Files Processed:** ${totalFiles}\n`;
  report += `- **Documents Original:** ${totalOriginal}\n`;
  report += `- **Documents Transformed:** ${totalTransformed}\n`;
  report += `- **Errors:** ${totalErrors}\n\n`;

  // Quality Score Distribution
  const allScores = allStats.flatMap(s => s.qualityScores);
  if (allScores.length > 0) {
    const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    const minScore = Math.min(...allScores);
    const maxScore = Math.max(...allScores);

    const excellent = allScores.filter(s => s >= 80).length;
    const good = allScores.filter(s => s >= 60 && s < 80).length;
    const fair = allScores.filter(s => s >= 40 && s < 60).length;
    const poor = allScores.filter(s => s < 40).length;

    report += `## Quality Score Distribution\n\n`;
    report += `- **Average Quality Score:** ${avgScore}/100\n`;
    report += `- **Range:** ${minScore} - ${maxScore}\n\n`;
    report += `### Distribution by Grade\n\n`;
    report += `| Grade | Range | Count | Percentage |\n`;
    report += `|-------|-------|-------|------------|\n`;
    report += `| Excellent | 80-100 | ${excellent} | ${Math.round(excellent/allScores.length*100)}% |\n`;
    report += `| Good | 60-79 | ${good} | ${Math.round(good/allScores.length*100)}% |\n`;
    report += `| Fair | 40-59 | ${fair} | ${Math.round(fair/allScores.length*100)}% |\n`;
    report += `| Poor | 0-39 | ${poor} | ${Math.round(poor/allScores.length*100)}% |\n\n`;
  }

  // Fields Added Summary
  report += `## Fields Added Summary\n\n`;
  const totalFieldsAdded = allStats.reduce((acc, s) => {
    Object.keys(s.fieldsAdded).forEach(field => {
      acc[field] = (acc[field] || 0) + s.fieldsAdded[field];
    });
    return acc;
  }, {});

  report += `| Field | Documents Updated |\n`;
  report += `|-------|------------------|\n`;
  Object.entries(totalFieldsAdded).forEach(([field, count]) => {
    report += `| ${field} | ${count} |\n`;
  });
  report += `\n`;

  // File-by-File Details
  report += `## File Transformation Details\n\n`;
  report += `| File | Original Docs | Transformed | Avg Quality | Errors |\n`;
  report += `|------|---------------|-------------|-------------|--------|\n`;

  allStats.forEach(stat => {
    const avgQuality = stat.qualityScores.length > 0
      ? Math.round(stat.qualityScores.reduce((a, b) => a + b, 0) / stat.qualityScores.length)
      : 'N/A';
    report += `| ${stat.filename} | ${stat.originalCount} | ${stat.transformedCount} | ${avgQuality} | ${stat.errors.length} |\n`;
  });
  report += `\n`;

  // Errors and Warnings
  if (totalErrors > 0) {
    report += `## Errors and Warnings\n\n`;
    allStats.forEach(stat => {
      if (stat.errors.length > 0) {
        report += `### ${stat.filename}\n\n`;
        stat.errors.forEach(error => {
          report += `- ${error}\n`;
        });
        report += `\n`;
      }
    });
  }

  // Next Steps
  report += `## Next Steps\n\n`;
  report += `1. **Review Transformed Data**\n`;
  report += `   - Check transformed files in \`transformed_data/\` directory\n`;
  report += `   - Verify quality scores are accurate\n`;
  report += `   - Review any errors or warnings above\n\n`;

  report += `2. **Address Low Quality Scores**\n`;
  report += `   - Documents with scores < 40 need attention\n`;
  report += `   - Add missing descriptions\n`;
  report += `   - Add primary sources\n`;
  report += `   - Fill in relationships\n\n`;

  report += `3. **Prepare for Firebase Upload**\n`;
  report += `   - Review CENTRALIZED_SCHEMA.md\n`;
  report += `   - Run validation script\n`;
  report += `   - Create Firebase indexes\n`;
  report += `   - Upload in batches\n\n`;

  report += `---\n\n`;
  report += `**Status:** Transformation Complete - Ready for Review\n`;

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(80));
  console.log('Firebase Data Transformation Script');
  console.log('='.repeat(80));

  // Create transformed_data directory if it doesn't exist
  if (!fs.existsSync(TRANSFORMED_DATA_DIR)) {
    fs.mkdirSync(TRANSFORMED_DATA_DIR, { recursive: true });
    console.log(`\nCreated directory: ${TRANSFORMED_DATA_DIR}`);
  }

  // Get all parsed files
  const files = fs.readdirSync(PARSED_DATA_DIR)
    .filter(f => f.endsWith('_parsed.json'))
    .map(f => path.join(PARSED_DATA_DIR, f));

  console.log(`\nFound ${files.length} parsed files to transform\n`);

  // Transform each file
  const allStats = [];

  files.forEach(filePath => {
    const { transformedData, stats } = transformParsedFile(filePath);
    allStats.push(stats);

    // Save transformed data
    const outputPath = path.join(
      TRANSFORMED_DATA_DIR,
      path.basename(filePath).replace('_parsed.json', '_transformed.json')
    );
    fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));
    console.log(`  ✓ Saved: ${path.basename(outputPath)}`);
    console.log(`    - Transformed: ${stats.transformedCount} documents`);
    if (stats.qualityScores.length > 0) {
      const avgQuality = Math.round(stats.qualityScores.reduce((a, b) => a + b, 0) / stats.qualityScores.length);
      console.log(`    - Avg Quality: ${avgQuality}/100`);
    }
    if (stats.errors.length > 0) {
      console.log(`    - Errors: ${stats.errors.length}`);
    }
  });

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('Generating Transformation Report...');
  console.log('='.repeat(80));

  const report = generateReport(allStats);
  fs.writeFileSync(REPORT_PATH, report);
  console.log(`\n✓ Report saved: ${REPORT_PATH}\n`);

  // Summary
  const totalTransformed = allStats.reduce((sum, s) => sum + s.transformedCount, 0);
  const totalErrors = allStats.reduce((sum, s) => sum + s.errors.length, 0);
  const allScores = allStats.flatMap(s => s.qualityScores);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  console.log('='.repeat(80));
  console.log('TRANSFORMATION COMPLETE');
  console.log('='.repeat(80));
  console.log(`\n✓ ${files.length} files processed`);
  console.log(`✓ ${totalTransformed} documents transformed`);
  console.log(`✓ Average quality score: ${avgScore}/100`);
  if (totalErrors > 0) {
    console.log(`⚠ ${totalErrors} warnings/errors (see report)`);
  }
  console.log(`\nTransformed files: ${TRANSFORMED_DATA_DIR}`);
  console.log(`Report: ${REPORT_PATH}\n`);
}

// Run the script
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = {
  transformDocument,
  generateSearchTokens,
  calculateQualityScore,
  extractRelatedIds
};
