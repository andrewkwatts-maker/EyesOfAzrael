#!/usr/bin/env node

/**
 * Concept Enrichment Validation Script
 *
 * Validates that all concepts have been properly enriched with
 * the required metadata fields.
 *
 * Usage:
 *   node scripts/validate-concept-enrichment.js
 *   node scripts/validate-concept-enrichment.js --strict
 *   node scripts/validate-concept-enrichment.js --concept buddhist_bodhisattva
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'definition',
  'examples',
  'practitioners',
  'texts',
  'applications',
  'relatedConcepts'
];

const MIN_ITEMS = {
  'examples': 3,
  'practitioners': 3,
  'texts': 3,
  'applications': 3,
  'relatedConcepts': 5
};

const MIN_LENGTH = {
  'definition': 80
};

class ConceptValidator {
  constructor(strict = false) {
    this.strict = strict;
    this.conceptsPath = path.join(__dirname, '..', 'firebase-assets-downloaded', 'concepts');
    this.results = {
      total: 0,
      enriched: 0,
      partial: 0,
      missing: 0,
      issues: []
    };
  }

  /**
   * Validate a single concept
   */
  validateConcept(filename) {
    const filePath = path.join(this.conceptsPath, `${filename}.json`);

    if (!fs.existsSync(filePath)) {
      this.results.missing++;
      this.results.issues.push({
        concept: filename,
        severity: 'error',
        message: 'File not found'
      });
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const concept = JSON.parse(content);

      return this.validateData(concept, filename);
    } catch (err) {
      this.results.issues.push({
        concept: filename,
        severity: 'error',
        message: `JSON parse error: ${err.message}`
      });
      return false;
    }
  }

  /**
   * Validate concept data structure
   */
  validateData(concept, filename) {
    let isEnriched = true;
    const issues = [];

    // Check if marked as enriched
    if (!concept.isEnriched) {
      isEnriched = false;
      issues.push('Not marked as enriched (isEnriched: false)');
    }

    // Check enrichment metadata
    if (!concept.metadata?.enrichedAt) {
      issues.push('Missing metadata.enrichedAt timestamp');
    }
    if (!concept.metadata?.enrichedBy) {
      issues.push('Missing metadata.enrichedBy field');
    }

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!concept[field]) {
        isEnriched = false;
        issues.push(`Missing field: ${field}`);
      }
    }

    // Check field contents
    if (typeof concept.definition !== 'string' || concept.definition.length < MIN_LENGTH.definition) {
      issues.push(`Definition too short (min ${MIN_LENGTH.definition} chars)`);
    }

    for (const [field, minCount] of Object.entries(MIN_ITEMS)) {
      if (!Array.isArray(concept[field]) || concept[field].length < minCount) {
        issues.push(`Field ${field} has fewer than ${minCount} items`);
      }
    }

    // Report results
    if (issues.length === 0) {
      this.results.enriched++;
    } else if (isEnriched && issues.length > 0) {
      this.results.partial++;
      issues.forEach(issue => {
        this.results.issues.push({
          concept: filename,
          severity: 'warning',
          message: issue
        });
      });
    } else {
      this.results.partial++;
      issues.forEach(issue => {
        this.results.issues.push({
          concept: filename,
          severity: 'error',
          message: issue
        });
      });
    }

    return issues.length === 0;
  }

  /**
   * Get all concept files
   */
  getAllConcepts() {
    if (!fs.existsSync(this.conceptsPath)) {
      return [];
    }

    return fs.readdirSync(this.conceptsPath)
      .filter(f => f.endsWith('.json') && f !== '_all.json')
      .map(f => f.replace('.json', ''));
  }

  /**
   * Validate single concept
   */
  validateOne(filename) {
    console.log(`Validating concept: ${filename}`);
    console.log('=' .repeat(50));

    this.results.total = 1;
    const isValid = this.validateConcept(filename);

    this.printResults();
    return isValid;
  }

  /**
   * Validate all concepts
   */
  validateAll() {
    const concepts = this.getAllConcepts();

    console.log('Concept Enrichment Validation');
    console.log('=' .repeat(50));
    console.log(`Found ${concepts.length} concept files`);
    console.log('');

    this.results.total = concepts.length;

    concepts.forEach(concept => {
      this.validateConcept(concept);
    });

    this.printResults();
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('');
    console.log('=' .repeat(50));
    console.log('Validation Results');
    console.log('=' .repeat(50));
    console.log(`Total concepts: ${this.results.total}`);
    console.log(`Fully enriched: ${this.results.enriched} ✅`);
    console.log(`Partially enriched: ${this.results.partial} ⚠️`);
    console.log(`Missing/Invalid: ${this.results.missing} ❌`);

    if (this.results.issues.length > 0) {
      console.log('');
      console.log('Issues Found:');
      console.log('-' .repeat(50));

      // Group by severity
      const errors = this.results.issues.filter(i => i.severity === 'error');
      const warnings = this.results.issues.filter(i => i.severity === 'warning');

      if (errors.length > 0) {
        console.log(`\n❌ Errors (${errors.length}):`);
        errors.forEach(issue => {
          console.log(`  ${issue.concept}: ${issue.message}`);
        });
      }

      if (warnings.length > 0 && !this.strict) {
        console.log(`\n⚠️  Warnings (${warnings.length}):`);
        warnings.forEach(issue => {
          console.log(`  ${issue.concept}: ${issue.message}`);
        });
      } else if (warnings.length > 0) {
        console.log(`\n⚠️  Warnings (${warnings.length}):`);
        warnings.forEach(issue => {
          console.log(`  ${issue.concept}: ${issue.message}`);
        });
      }
    } else {
      console.log('');
      console.log('✨ All concepts properly enriched!');
    }

    // Summary
    const completeness = ((this.results.enriched / this.results.total) * 100).toFixed(1);
    console.log('');
    console.log('=' .repeat(50));
    console.log(`Overall Enrichment: ${completeness}% complete`);

    if (this.strict && this.results.issues.length > 0) {
      console.log('Strict mode: Validation FAILED');
      process.exit(1);
    }
  }

  /**
   * Get enrichment statistics
   */
  getStats() {
    return {
      total: this.results.total,
      enriched: this.results.enriched,
      partial: this.results.partial,
      missing: this.results.missing,
      completeness: this.results.total > 0
        ? ((this.results.enriched / this.results.total) * 100).toFixed(1)
        : 0,
      issues: this.results.issues
    };
  }

  /**
   * Generate report
   */
  generateReport() {
    const stats = this.getStats();
    const concepts = this.getAllConcepts();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: stats.total,
        fullyEnriched: stats.enriched,
        partiallyEnriched: stats.partial,
        missing: stats.missing,
        completeness: `${stats.completeness}%`
      },
      concepts: concepts.map(name => {
        const filePath = path.join(this.conceptsPath, `${name}.json`);
        const concept = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        return {
          id: concept.id || name,
          name: concept.displayName || name,
          enriched: concept.isEnriched === true,
          hasDefinition: !!concept.definition,
          examplesCount: Array.isArray(concept.examples) ? concept.examples.length : 0,
          practitionersCount: Array.isArray(concept.practitioners) ? concept.practitioners.length : 0,
          textsCount: Array.isArray(concept.texts) ? concept.texts.length : 0,
          applicationsCount: Array.isArray(concept.applications) ? concept.applications.length : 0,
          relatedConceptsCount: Array.isArray(concept.relatedConcepts) ? concept.relatedConcepts.length : 0,
          enrichedAt: concept.metadata?.enrichedAt || null
        };
      }),
      issues: stats.issues
    };

    return report;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const specificConcept = args.find(arg => !arg.startsWith('--'))?.replace('.json', '');
  const report = args.includes('--report');

  const validator = new ConceptValidator(strict);

  if (specificConcept) {
    const isValid = validator.validateOne(specificConcept);
    process.exit(isValid ? 0 : 1);
  } else if (report) {
    console.log('Generating enrichment validation report...');
    const reportData = validator.generateReport();
    const reportPath = path.join(__dirname, '..', 'concept-enrichment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`Report saved to: ${reportPath}`);

    validator.validateAll();
  } else {
    validator.validateAll();
    process.exit(validator.results.issues.length > 0 && strict ? 1 : 0);
  }
}

main();
