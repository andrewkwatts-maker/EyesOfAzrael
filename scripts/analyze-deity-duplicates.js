const fs = require('fs');
const path = require('path');

// Find the most recent backup
function findLatestBackup() {
  const backupsDir = path.join(__dirname, '..', 'backups');

  if (!fs.existsSync(backupsDir)) {
    throw new Error('No backups directory found. Run backup-firestore.js first.');
  }

  const backups = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('backup-'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    throw new Error('No backups found. Run backup-firestore.js first.');
  }

  return path.join(backupsDir, backups[0]);
}

// Load collection data
function loadCollection(backupDir, collectionName) {
  const filePath = path.join(backupDir, `${collectionName}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    console.error(`Error loading ${collectionName}:`, error.message);
    return null;
  }
}

// Calculate data quality score
function calculateQualityScore(deity) {
  let score = 0;
  const data = deity.data;

  // Basic fields (1 point each)
  if (data.name && data.name.trim()) score += 1;
  if (data.description && data.description.length > 50) score += 2;
  if (data.description && data.description.length > 200) score += 1;
  if (data.description && data.description.length > 500) score += 2;

  // Rich content (2 points each)
  if (data.archetype) score += 2;
  if (data.category) score += 1;
  if (data.mythology) score += 1;
  if (data.domain) score += 2;
  if (data.symbols && data.symbols.length > 0) score += 2;
  if (data.attributes && Object.keys(data.attributes).length > 0) score += 2;

  // Relationships (valuable data)
  if (data.parents && data.parents.length > 0) score += 3;
  if (data.children && data.children.length > 0) score += 3;
  if (data.siblings && data.siblings.length > 0) score += 2;
  if (data.consorts && data.consorts.length > 0) score += 2;
  if (data.relationships && data.relationships.length > 0) score += 3;

  // Alternative names
  if (data.alternateNames && data.alternateNames.length > 0) score += 2;
  if (data.alternateNames && data.alternateNames.length > 3) score += 2;

  // Source attribution
  if (data.sourceFile) score += 1;
  if (data.sources && data.sources.length > 0) score += 2;

  // Rich metadata
  if (data.powers && data.powers.length > 0) score += 2;
  if (data.epithets && data.epithets.length > 0) score += 2;
  if (data.sacred_animals && data.sacred_animals.length > 0) score += 1;
  if (data.sacred_plants && data.sacred_plants.length > 0) score += 1;

  return score;
}

// Normalize deity name for comparison
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

// Check if two deities are the same
function isSameDeity(name1, name2, deity1Data, deity2Data) {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);

  // Direct name match
  if (norm1 === norm2) return true;

  // Check alternate names
  const alt1 = deity1Data.alternateNames || [];
  const alt2 = deity2Data.alternateNames || [];

  for (const alt of alt1) {
    if (normalizeName(alt) === norm2) return true;
  }

  for (const alt of alt2) {
    if (normalizeName(alt) === norm1) return true;
  }

  // Check cross-references in alternate names
  for (const alt of alt1) {
    for (const alt2Name of alt2) {
      if (normalizeName(alt) === normalizeName(alt2Name)) return true;
    }
  }

  return false;
}

// Analyze duplicates
async function analyzeDuplicates(backupDir) {
  console.log('='.repeat(80));
  console.log('DEITY DUPLICATE ANALYSIS');
  console.log('='.repeat(80));
  console.log('Backup Directory:', backupDir);
  console.log('='.repeat(80));

  // Load manifest to see all collections
  const manifestPath = path.join(backupDir, 'MANIFEST.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  console.log(`\nTotal collections in backup: ${manifest.collections.length}\n`);

  // Load deities collection
  const deitiesCollection = loadCollection(backupDir, 'deities');
  console.log(`Loaded 'deities' collection: ${deitiesCollection ? deitiesCollection.length : 0} documents`);

  // Identify mythology-specific collections
  const mythologyCollections = [
    'greek', 'norse', 'egyptian', 'roman', 'hindu', 'buddhist',
    'japanese', 'celtic', 'chinese', 'aztec', 'mayan', 'sumerian',
    'babylonian', 'persian', 'slavic', 'african', 'polynesian'
  ];

  const availableMythologies = [];
  const mythologyData = {};

  for (const myth of mythologyCollections) {
    const data = loadCollection(backupDir, myth);
    if (data && data.length > 0) {
      availableMythologies.push(myth);
      mythologyData[myth] = data;
      console.log(`Loaded '${myth}' collection: ${data.length} documents`);
    }
  }

  console.log(`\nFound ${availableMythologies.length} mythology-specific collections\n`);

  // Analysis results
  const duplicates = [];
  const uniqueToDeities = [];
  const uniqueToMythology = {};
  let totalDuplicates = 0;

  // Initialize unique tracking
  availableMythologies.forEach(myth => {
    uniqueToMythology[myth] = [];
  });

  // Analyze each mythology collection
  for (const mythology of availableMythologies) {
    console.log(`\nAnalyzing ${mythology} collection...`);
    const mythDeities = mythologyData[mythology];

    for (const mythDeity of mythDeities) {
      const mythName = mythDeity.data.name;
      if (!mythName) continue;

      // Check if exists in main deities collection
      let foundInDeities = null;

      if (deitiesCollection) {
        for (const deity of deitiesCollection) {
          if (isSameDeity(mythName, deity.data.name, mythDeity.data, deity.data)) {
            foundInDeities = deity;
            break;
          }
        }
      }

      if (foundInDeities) {
        // It's a duplicate!
        const deityScore = calculateQualityScore(foundInDeities);
        const mythScore = calculateQualityScore(mythDeity);

        const duplicate = {
          name: mythName,
          mythology: mythology,
          deities: {
            id: foundInDeities.id,
            score: deityScore,
            descriptionLength: foundInDeities.data.description?.length || 0,
            relationshipCount: (foundInDeities.data.relationships?.length || 0) +
                             (foundInDeities.data.parents?.length || 0) +
                             (foundInDeities.data.children?.length || 0) +
                             (foundInDeities.data.siblings?.length || 0) +
                             (foundInDeities.data.consorts?.length || 0),
            sourceFile: foundInDeities.data.sourceFile || 'unknown',
            hasArchetype: !!foundInDeities.data.archetype,
            hasSymbols: !!(foundInDeities.data.symbols?.length),
            data: foundInDeities.data
          },
          mythologyCollection: {
            id: mythDeity.id,
            score: mythScore,
            descriptionLength: mythDeity.data.description?.length || 0,
            relationshipCount: (mythDeity.data.relationships?.length || 0) +
                             (mythDeity.data.parents?.length || 0) +
                             (mythDeity.data.children?.length || 0) +
                             (mythDeity.data.siblings?.length || 0) +
                             (mythDeity.data.consorts?.length || 0),
            sourceFile: mythDeity.data.sourceFile || 'unknown',
            hasArchetype: !!mythDeity.data.archetype,
            hasSymbols: !!(mythDeity.data.symbols?.length),
            data: mythDeity.data
          },
          recommendation: deityScore > mythScore ? 'keep-deities' :
                         mythScore > deityScore ? 'keep-mythology' : 'merge',
          scoreDifference: Math.abs(deityScore - mythScore),
          betterSource: deityScore > mythScore ? 'deities' :
                       mythScore > deityScore ? mythology : 'equal'
        };

        duplicates.push(duplicate);
        totalDuplicates++;
      } else {
        // Unique to mythology collection
        uniqueToMythology[mythology].push({
          id: mythDeity.id,
          name: mythName,
          score: calculateQualityScore(mythDeity),
          data: mythDeity.data
        });
      }
    }
  }

  // Check for deities unique to main collection
  if (deitiesCollection) {
    for (const deity of deitiesCollection) {
      const deityName = deity.data.name;
      if (!deityName) continue;

      let foundInMythology = false;

      for (const mythology of availableMythologies) {
        for (const mythDeity of mythologyData[mythology]) {
          if (isSameDeity(deityName, mythDeity.data.name, deity.data, mythDeity.data)) {
            foundInMythology = true;
            break;
          }
        }
        if (foundInMythology) break;
      }

      if (!foundInMythology) {
        uniqueToDeities.push({
          id: deity.id,
          name: deityName,
          mythology: deity.data.mythology,
          score: calculateQualityScore(deity),
          data: deity.data
        });
      }
    }
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));

  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      backupDirectory: backupDir,
      totalDuplicates,
      uniqueToDeities: uniqueToDeities.length,
      uniqueToMythologyCollections: Object.values(uniqueToMythology).reduce((sum, arr) => sum + arr.length, 0),
      mythologiesAnalyzed: availableMythologies
    },
    duplicates,
    uniqueToDeities,
    uniqueToMythology,
    recommendations: {
      keepDeities: duplicates.filter(d => d.recommendation === 'keep-deities').length,
      keepMythology: duplicates.filter(d => d.recommendation === 'keep-mythology').length,
      merge: duplicates.filter(d => d.recommendation === 'merge').length
    }
  };

  console.log(`\nDuplicates found: ${totalDuplicates}`);
  console.log(`Unique to deities collection: ${uniqueToDeities.length}`);
  console.log(`Unique to mythology collections: ${report.summary.uniqueToMythologyCollections}`);
  console.log(`\nRecommendations:`);
  console.log(`  Keep deities version: ${report.recommendations.keepDeities}`);
  console.log(`  Keep mythology version: ${report.recommendations.keepMythology}`);
  console.log(`  Merge both: ${report.recommendations.merge}`);

  return report;
}

// Generate markdown report
function generateMarkdownReport(report, backupDir) {
  const lines = [];

  lines.push('# DEITY DUPLICATE ANALYSIS REPORT');
  lines.push('');
  lines.push(`**Generated:** ${report.summary.timestamp}`);
  lines.push(`**Backup Directory:** ${report.summary.backupDirectory}`);
  lines.push('');

  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`- **Total Duplicates Found:** ${report.summary.totalDuplicates}`);
  lines.push(`- **Unique to /deities/ collection:** ${report.summary.uniqueToDeities}`);
  lines.push(`- **Unique to mythology collections:** ${report.summary.uniqueToMythologyCollections}`);
  lines.push(`- **Mythologies Analyzed:** ${report.summary.mythologiesAnalyzed.join(', ')}`);
  lines.push('');

  lines.push('## Recommendations Summary');
  lines.push('');
  lines.push(`- **Keep deities version:** ${report.recommendations.keepDeities} cases`);
  lines.push(`- **Keep mythology version:** ${report.recommendations.keepMythology} cases`);
  lines.push(`- **Merge both versions:** ${report.recommendations.merge} cases`);
  lines.push('');

  lines.push('## Detailed Duplicate Analysis');
  lines.push('');

  if (report.duplicates.length === 0) {
    lines.push('*No duplicates found.*');
  } else {
    // Group by mythology
    const byMythology = {};
    report.duplicates.forEach(dup => {
      if (!byMythology[dup.mythology]) {
        byMythology[dup.mythology] = [];
      }
      byMythology[dup.mythology].push(dup);
    });

    for (const [mythology, dups] of Object.entries(byMythology)) {
      lines.push(`### ${mythology.toUpperCase()} Mythology`);
      lines.push('');
      lines.push(`Found ${dups.length} duplicates in ${mythology} collection:`);
      lines.push('');

      dups.forEach(dup => {
        lines.push(`#### ${dup.name}`);
        lines.push('');
        lines.push('| Source | Quality Score | Description Length | Relationships | Archetype | Symbols | Source File |');
        lines.push('|--------|--------------|-------------------|--------------|-----------|---------|-------------|');
        lines.push(`| /deities/ | ${dup.deities.score} | ${dup.deities.descriptionLength} chars | ${dup.deities.relationshipCount} | ${dup.deities.hasArchetype ? 'Yes' : 'No'} | ${dup.deities.hasSymbols ? 'Yes' : 'No'} | ${dup.deities.sourceFile} |`);
        lines.push(`| /${mythology}/ | ${dup.mythologyCollection.score} | ${dup.mythologyCollection.descriptionLength} chars | ${dup.mythologyCollection.relationshipCount} | ${dup.mythologyCollection.hasArchetype ? 'Yes' : 'No'} | ${dup.mythologyCollection.hasSymbols ? 'Yes' : 'No'} | ${dup.mythologyCollection.sourceFile} |`);
        lines.push('');

        const recommendation = dup.recommendation === 'keep-deities' ?
          '**Recommendation:** Keep /deities/ version (higher quality)' :
          dup.recommendation === 'keep-mythology' ?
          `**Recommendation:** Keep /${mythology}/ version (higher quality)` :
          '**Recommendation:** Merge both versions (equal quality)';

        lines.push(recommendation);
        lines.push(`**Score Difference:** ${dup.scoreDifference} points`);
        lines.push('');

        // Data that would be lost
        lines.push('**Potential Data Loss Analysis:**');
        lines.push('');

        const deityFields = Object.keys(dup.deities.data);
        const mythFields = Object.keys(dup.mythologyCollection.data);

        const uniqueToDeity = deityFields.filter(f => !mythFields.includes(f));
        const uniqueToMyth = mythFields.filter(f => !deityFields.includes(f));

        if (uniqueToDeity.length > 0) {
          lines.push(`Fields unique to /deities/: ${uniqueToDeity.join(', ')}`);
        }

        if (uniqueToMyth.length > 0) {
          lines.push(`Fields unique to /${mythology}/: ${uniqueToMyth.join(', ')}`);
        }

        if (uniqueToDeity.length === 0 && uniqueToMyth.length === 0) {
          lines.push('*Both versions have the same fields*');
        }

        lines.push('');
        lines.push('---');
        lines.push('');
      });
    }
  }

  lines.push('## Unique Entities');
  lines.push('');

  lines.push('### Unique to /deities/ Collection');
  lines.push('');
  if (report.uniqueToDeities.length === 0) {
    lines.push('*No unique deities in main collection.*');
  } else {
    lines.push(`Found ${report.uniqueToDeities.length} deities only in /deities/ collection:`);
    lines.push('');
    report.uniqueToDeities.forEach(deity => {
      lines.push(`- **${deity.name}** (${deity.mythology || 'unknown mythology'}) - Quality Score: ${deity.score}`);
    });
  }
  lines.push('');

  lines.push('### Unique to Mythology Collections');
  lines.push('');
  let hasUnique = false;
  for (const [mythology, deities] of Object.entries(report.uniqueToMythology)) {
    if (deities.length > 0) {
      hasUnique = true;
      lines.push(`#### ${mythology.toUpperCase()}`);
      lines.push('');
      lines.push(`Found ${deities.length} deities only in /${mythology}/ collection:`);
      lines.push('');
      deities.forEach(deity => {
        lines.push(`- **${deity.name}** - Quality Score: ${deity.score}`);
      });
      lines.push('');
    }
  }

  if (!hasUnique) {
    lines.push('*No unique deities in mythology collections.*');
    lines.push('');
  }

  lines.push('## Data Loss Prevention Strategy');
  lines.push('');
  lines.push('Before deleting any mythology-named collections, ensure:');
  lines.push('');
  lines.push('1. **All unique deities** from mythology collections are migrated to /deities/');
  lines.push('2. **Higher quality data** is preserved when duplicates exist');
  lines.push('3. **Unique fields** from both sources are merged');
  lines.push('4. **Relationships** are consolidated and deduplicated');
  lines.push('5. **Source attribution** is maintained for provenance');
  lines.push('');

  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. Review duplicate analysis for each mythology');
  lines.push('2. Create merge scripts for equal-quality duplicates');
  lines.push('3. Migrate unique deities from mythology collections to /deities/');
  lines.push('4. Enhance /deities/ records with unique fields from mythology collections');
  lines.push('5. Create backup before any deletion');
  lines.push('6. Delete mythology collections only after verification');
  lines.push('');

  return lines.join('\n');
}

// Main execution
async function main() {
  try {
    const backupDir = findLatestBackup();
    console.log('Using backup:', backupDir);
    console.log('');

    const report = await analyzeDuplicates(backupDir);

    // Save JSON report
    const jsonPath = path.join(__dirname, '..', 'DUPLICATE_ANALYSIS_REPORT.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`\nJSON report saved to: ${jsonPath}`);

    // Save Markdown report
    const markdown = generateMarkdownReport(report, backupDir);
    const mdPath = path.join(__dirname, '..', 'DUPLICATE_ANALYSIS_REPORT.md');
    fs.writeFileSync(mdPath, markdown);
    console.log(`Markdown report saved to: ${mdPath}`);

    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS COMPLETE!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

main();
