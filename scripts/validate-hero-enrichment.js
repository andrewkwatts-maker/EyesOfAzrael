/**
 * Hero Metadata Enrichment Validation Script
 *
 * This script validates the enriched hero data for quality and completeness.
 * It checks that all required fields are present and properly formatted.
 *
 * Usage:
 *   node scripts/validate-hero-enrichment.js [--report] [--hero-id=<id>]
 *
 * Examples:
 *   node scripts/validate-hero-enrichment.js                # Run all validations
 *   node scripts/validate-hero-enrichment.js --report       # Generate detailed report
 *   node scripts/validate-hero-enrichment.js --hero-id=greek_achilles
 */

const fs = require('fs');
const path = require('path');

/**
 * Load all hero files from directory
 */
function loadAllHeroes(heroDir) {
  const heroes = [];
  const files = fs.readdirSync(heroDir);

  files.forEach(file => {
    if (file.endsWith('.json') && file !== '_all.json') {
      const filePath = path.join(heroDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        if (Array.isArray(data)) {
          heroes.push(...data.map(hero => ({
            ...hero,
            sourceFile: file,
            isArray: true
          })));
        } else if (data && typeof data === 'object' && data.id) {
          heroes.push({
            ...data,
            sourceFile: file,
            isArray: false
          });
        }
      } catch (error) {
        console.error(`Error loading ${file}:`, error.message);
      }
    }
  });

  return heroes;
}

/**
 * Validate a single hero's metadata
 */
function validateHero(hero) {
  const issues = [];
  const warnings = [];
  const successes = [];

  // Check basic structure
  if (!hero.id) {
    issues.push('Missing required field: id');
  } else {
    successes.push(`ID: ${hero.id}`);
  }

  if (!hero.name && !hero.displayName) {
    issues.push('Missing name or displayName');
  } else {
    successes.push(`Name: ${hero.name || hero.displayName}`);
  }

  // Check enriched fields
  if (hero.quests && Array.isArray(hero.quests)) {
    if (hero.quests.length > 0) {
      successes.push(`Quests: ${hero.quests.length} items`);
    } else {
      warnings.push('Quests array is empty');
    }
  } else {
    warnings.push('Quests field missing or not an array');
  }

  if (hero.allies && Array.isArray(hero.allies)) {
    if (hero.allies.length > 0) {
      successes.push(`Allies: ${hero.allies.length} items`);
    } else {
      warnings.push('Allies array is empty');
    }
  } else if (!hero.relationships?.allies) {
    warnings.push('Allies field missing or not an array');
  }

  if (hero.enemies && Array.isArray(hero.enemies)) {
    if (hero.enemies.length > 0) {
      successes.push(`Enemies: ${hero.enemies.length} items`);
    } else {
      warnings.push('Enemies array is empty');
    }
  } else if (!hero.relationships?.enemies) {
    warnings.push('Enemies field missing or not an array');
  }

  if (hero.weapons && Array.isArray(hero.weapons)) {
    if (hero.weapons.length > 0) {
      successes.push(`Weapons: ${hero.weapons.length} items`);
    } else {
      warnings.push('Weapons array is empty');
    }
  } else {
    warnings.push('Weapons field missing or not an array');
  }

  if (hero.abilities && Array.isArray(hero.abilities)) {
    if (hero.abilities.length > 0) {
      successes.push(`Abilities: ${hero.abilities.length} items`);
    } else {
      warnings.push('Abilities array is empty');
    }
  } else {
    warnings.push('Abilities field missing or not an array');
  }

  if (hero.parentage && typeof hero.parentage === 'object') {
    successes.push('Parentage: Included');
  } else {
    warnings.push('Parentage field missing or not an object');
  }

  // Check metadata
  if (hero.metadata?.enrichedBy === 'hero-metadata-enricher') {
    successes.push('Metadata: Properly enriched');
  } else {
    warnings.push('Metadata enrichment marker missing');
  }

  // Validate content quality
  const checkStringQuality = (arr, fieldName) => {
    if (!Array.isArray(arr)) return;

    arr.forEach((item, idx) => {
      if (typeof item !== 'string') {
        issues.push(`${fieldName}[${idx}]: Not a string`);
      } else if (item.trim().length === 0) {
        issues.push(`${fieldName}[${idx}]: Empty string`);
      } else if (item.length < 3) {
        warnings.push(`${fieldName}[${idx}]: Very short (${item.length} chars)`);
      }
    });
  };

  checkStringQuality(hero.quests, 'quests');
  checkStringQuality(hero.allies, 'allies');
  checkStringQuality(hero.enemies, 'enemies');
  checkStringQuality(hero.weapons, 'weapons');
  checkStringQuality(hero.abilities, 'abilities');

  return {
    id: hero.id,
    name: hero.name || hero.displayName,
    issues,
    warnings,
    successes,
    isValid: issues.length === 0,
    enrichmentScore: calculateEnrichmentScore(hero)
  };
}

/**
 * Calculate enrichment score (0-100)
 */
function calculateEnrichmentScore(hero) {
  let score = 0;
  const maxPoints = 6;

  if (hero.quests?.length > 0) score++;
  if (hero.allies?.length > 0 || hero.relationships?.allies?.length > 0) score++;
  if (hero.enemies?.length > 0 || hero.relationships?.enemies?.length > 0) score++;
  if (hero.weapons?.length > 0) score++;
  if (hero.abilities?.length > 0) score++;
  if (hero.parentage) score++;

  return Math.round((score / maxPoints) * 100);
}

/**
 * Generate validation report
 */
function generateReport(heroes, showDetails = false) {
  console.log('\n' + '='.repeat(80));
  console.log('HERO METADATA ENRICHMENT VALIDATION REPORT');
  console.log('='.repeat(80) + '\n');

  const results = heroes.map(hero => validateHero(hero));

  // Statistics
  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = results.filter(r => !r.isValid).length;
  const enrichedCount = results.filter(r => r.enrichmentScore === 100).length;
  const partialCount = results.filter(r => r.enrichmentScore > 0 && r.enrichmentScore < 100).length;
  const unenrichedCount = results.filter(r => r.enrichmentScore === 0).length;

  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.enrichmentScore, 0) / results.length
  );

  console.log('VALIDATION SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Total heroes:        ${results.length}`);
  console.log(`Valid entries:       ${validCount} (${((validCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`Invalid entries:     ${invalidCount} (${((invalidCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`\nENRICHMENT STATISTICS`);
  console.log('-'.repeat(80));
  console.log(`Fully enriched:      ${enrichedCount} (${((enrichedCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`Partially enriched:  ${partialCount} (${((partialCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`Not enriched:        ${unenrichedCount} (${((unenrichedCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`Average enrichment:  ${avgScore}%`);

  // Details if requested
  if (showDetails) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('DETAILED VALIDATION RESULTS');
    console.log('='.repeat(80));

    results.forEach(result => {
      console.log(`\n${result.name} (${result.id})`);
      console.log(`Enrichment Score: ${result.enrichmentScore}%`);

      if (result.successes.length > 0) {
        console.log('✓ Successes:');
        result.successes.forEach(s => console.log(`  - ${s}`));
      }

      if (result.warnings.length > 0) {
        console.log('⚠ Warnings:');
        result.warnings.forEach(w => console.log(`  - ${w}`));
      }

      if (result.issues.length > 0) {
        console.log('✗ Issues:');
        result.issues.forEach(i => console.log(`  - ${i}`));
      }
    });
  }

  // Top enriched
  console.log(`\n${'='.repeat(80)}`);
  console.log('TOP 10 ENRICHED HEROES');
  console.log('='.repeat(80));

  results
    .sort((a, b) => b.enrichmentScore - a.enrichmentScore)
    .slice(0, 10)
    .forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.name} - ${result.enrichmentScore}%`);
    });

  // Issues summary
  const heroesWithIssues = results.filter(r => r.issues.length > 0);
  if (heroesWithIssues.length > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`HEROES WITH ISSUES (${heroesWithIssues.length})`);
    console.log('='.repeat(80));
    heroesWithIssues.forEach(result => {
      console.log(`\n${result.name}:`);
      result.issues.forEach(issue => console.log(`  ✗ ${issue}`));
    });
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Main validation process
 */
function main() {
  const args = process.argv.slice(2);
  const showReport = args.includes('--report');
  const heroIdArg = args.find(arg => arg.startsWith('--hero-id='));
  const targetHeroId = heroIdArg ? heroIdArg.split('=')[1] : null;

  const heroDir = path.join(__dirname, '../firebase-assets-downloaded/heroes');

  if (!fs.existsSync(heroDir)) {
    console.error(`Hero directory not found: ${heroDir}`);
    process.exit(1);
  }

  console.log('Loading hero data for validation...');
  let heroes = loadAllHeroes(heroDir);

  if (targetHeroId) {
    heroes = heroes.filter(h => h.id === targetHeroId);
    if (heroes.length === 0) {
      console.error(`Hero not found: ${targetHeroId}`);
      process.exit(1);
    }
  }

  generateReport(heroes, showReport);

  // Exit with appropriate code
  const hasIssues = heroes.some(h => {
    const result = validateHero(h);
    return result.issues.length > 0;
  });

  process.exit(hasIssues ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  validateHero,
  calculateEnrichmentScore,
  generateReport,
  loadAllHeroes
};
