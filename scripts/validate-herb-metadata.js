/**
 * Herb Metadata Validation Script
 * Validates herb entities against the standardized metadata schema
 *
 * Usage:
 *   node scripts/validate-herb-metadata.js [herbId]
 *   node scripts/validate-herb-metadata.js              # Validate all herbs
 *   node scripts/validate-herb-metadata.js buddhist_lotus # Validate single herb
 */

const fs = require('fs');
const path = require('path');

// Validation schema definition
const METADATA_SCHEMA = {
  required: [
    'id', 'type', 'name', 'primaryMythology', 'description',
    'properties', 'preparations', 'associations', 'harvesting', 'dangers', 'substitutes', 'botanicalInfo'
  ],
  sections: {
    properties: {
      fields: ['magical', 'medicinal', 'spiritual'],
      types: 'array'
    },
    preparations: {
      fields: ['primary', 'alternative', 'dosage'],
      types: 'mixed'
    },
    associations: {
      fields: ['deities', 'concepts', 'elements', 'chakras'],
      types: 'array'
    },
    harvesting: {
      fields: ['season', 'method', 'conditions'],
      types: 'string'
    },
    dangers: {
      fields: ['toxicity', 'warnings', 'contraindications'],
      types: 'mixed'
    },
    substitutes: {
      type: 'array',
      itemFields: ['name', 'reason', 'tradition']
    },
    botanicalInfo: {
      fields: ['scientificName', 'family', 'nativeRegion', 'commonNames'],
      types: 'mixed'
    }
  }
};

class HerbMetadataValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      total: 0,
      valid: 0,
      warnings: 0,
      errors: 0
    };
  }

  /**
   * Validate a single herb record
   */
  validateHerb(herbData, herbId) {
    this.errors = [];
    this.warnings = [];

    const results = {
      id: herbId,
      valid: true,
      completeness: 0,
      errors: [],
      warnings: []
    };

    // 1. Check required top-level fields
    this.validateRequiredFields(herbData, results);

    // 2. Check properties section
    this.validateProperties(herbData, results);

    // 3. Check preparations section
    this.validatePreparations(herbData, results);

    // 4. Check associations section
    this.validateAssociations(herbData, results);

    // 5. Check harvesting section
    this.validateHarvesting(herbData, results);

    // 6. Check dangers section
    this.validateDangers(herbData, results);

    // 7. Check substitutes section
    this.validateSubstitutes(herbData, results);

    // 8. Check botanical info
    this.validateBotanicalInfo(herbData, results);

    // 9. Calculate completeness score
    results.completeness = this.calculateCompleteness(herbData);

    // Set validity
    results.valid = results.errors.length === 0;
    results.errors = this.errors;
    results.warnings = this.warnings;

    return results;
  }

  validateRequiredFields(herbData, results) {
    const missing = [];
    for (const field of METADATA_SCHEMA.required) {
      if (!herbData.hasOwnProperty(field)) {
        missing.push(field);
        this.errors.push(`Missing required field: ${field}`);
      }
    }
    if (missing.length > 0) {
      results.missingFields = missing;
    }
  }

  validateProperties(herbData, results) {
    if (!herbData.properties) {
      this.errors.push('Missing properties section');
      return;
    }

    const props = herbData.properties;
    const required = ['magical', 'medicinal', 'spiritual'];

    for (const field of required) {
      if (!props.hasOwnProperty(field)) {
        this.warnings.push(`properties.${field} is missing`);
      } else if (!Array.isArray(props[field]) || props[field].length === 0) {
        this.warnings.push(`properties.${field} is empty or not an array`);
      }
    }
  }

  validatePreparations(herbData, results) {
    if (!herbData.preparations) {
      this.errors.push('Missing preparations section');
      return;
    }

    const prep = herbData.preparations;

    if (!Array.isArray(prep.primary) || prep.primary.length === 0) {
      this.errors.push('preparations.primary must be non-empty array');
    }

    if (prep.alternative && !Array.isArray(prep.alternative)) {
      this.errors.push('preparations.alternative must be array');
    }

    if (!prep.dosage || typeof prep.dosage !== 'string') {
      this.warnings.push('preparations.dosage is missing or not a string');
    }
  }

  validateAssociations(herbData, results) {
    if (!herbData.associations) {
      this.errors.push('Missing associations section');
      return;
    }

    const assoc = herbData.associations;
    const fields = ['deities', 'concepts', 'elements', 'chakras'];

    for (const field of fields) {
      if (!assoc.hasOwnProperty(field)) {
        this.warnings.push(`associations.${field} is missing`);
      } else if (!Array.isArray(assoc[field])) {
        this.errors.push(`associations.${field} must be an array`);
      }
    }
  }

  validateHarvesting(herbData, results) {
    if (!herbData.harvesting) {
      this.errors.push('Missing harvesting section');
      return;
    }

    const harvest = herbData.harvesting;
    const required = ['season', 'method', 'conditions'];

    for (const field of required) {
      if (!harvest.hasOwnProperty(field)) {
        this.warnings.push(`harvesting.${field} is missing`);
      } else if (typeof harvest[field] !== 'string' || harvest[field].length === 0) {
        this.errors.push(`harvesting.${field} must be a non-empty string`);
      }
    }
  }

  validateDangers(herbData, results) {
    if (!herbData.dangers) {
      this.errors.push('Missing dangers section');
      return;
    }

    const dangers = herbData.dangers;

    if (!dangers.hasOwnProperty('toxicity')) {
      this.errors.push('dangers.toxicity is required');
    } else if (typeof dangers.toxicity !== 'string') {
      this.errors.push('dangers.toxicity must be a string');
    }

    if (!Array.isArray(dangers.warnings)) {
      this.errors.push('dangers.warnings must be an array');
    }

    if (!Array.isArray(dangers.contraindications)) {
      this.errors.push('dangers.contraindications must be an array');
    }

    if (dangers.warnings.length === 0 && dangers.contraindications.length === 0) {
      this.warnings.push('dangers section has no warnings or contraindications');
    }
  }

  validateSubstitutes(herbData, results) {
    if (!herbData.substitutes) {
      this.errors.push('Missing substitutes section');
      return;
    }

    if (!Array.isArray(herbData.substitutes)) {
      this.errors.push('substitutes must be an array');
      return;
    }

    herbData.substitutes.forEach((sub, index) => {
      if (!sub.name) {
        this.errors.push(`substitutes[${index}].name is required`);
      }
      if (!sub.reason) {
        this.errors.push(`substitutes[${index}].reason is required`);
      }
      if (!sub.tradition) {
        this.warnings.push(`substitutes[${index}].tradition is missing`);
      }
    });
  }

  validateBotanicalInfo(herbData, results) {
    if (!herbData.botanicalInfo) {
      this.errors.push('Missing botanicalInfo section');
      return;
    }

    const bot = herbData.botanicalInfo;
    const required = ['scientificName', 'family', 'nativeRegion', 'commonNames'];

    for (const field of required) {
      if (!bot.hasOwnProperty(field)) {
        this.warnings.push(`botanicalInfo.${field} is missing`);
      }
    }

    if (bot.commonNames && !Array.isArray(bot.commonNames)) {
      this.errors.push('botanicalInfo.commonNames must be an array');
    }
  }

  calculateCompleteness(herbData) {
    let totalFields = 0;
    let filledFields = 0;

    const sections = [
      'properties.magical',
      'properties.medicinal',
      'properties.spiritual',
      'preparations.primary',
      'preparations.alternative',
      'preparations.dosage',
      'associations.deities',
      'associations.concepts',
      'associations.elements',
      'associations.chakras',
      'harvesting.season',
      'harvesting.method',
      'harvesting.conditions',
      'dangers.toxicity',
      'dangers.warnings',
      'dangers.contraindications',
      'substitutes',
      'botanicalInfo.scientificName',
      'botanicalInfo.family',
      'botanicalInfo.nativeRegion',
      'botanicalInfo.commonNames'
    ];

    for (const section of sections) {
      totalFields++;
      const [main, sub] = section.split('.');

      if (sub) {
        const value = herbData[main]?.[sub];
        if (value !== undefined && value !== null &&
            (Array.isArray(value) ? value.length > 0 : value !== '')) {
          filledFields++;
        }
      } else {
        if (herbData[section]) {
          filledFields++;
        }
      }
    }

    return Math.round((filledFields / totalFields) * 100);
  }

  /**
   * Read and validate all herbs
   */
  validateAllHerbs() {
    const herbDir = './firebase-assets-downloaded/herbs';
    const files = fs.readdirSync(herbDir).filter(f => f.endsWith('.json') && f !== '_all.json');

    const results = [];

    for (const file of files) {
      const filePath = path.join(herbDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const herbData = JSON.parse(content);
      const result = this.validateHerb(herbData, herbData.id);
      results.push(result);

      this.stats.total++;
      if (result.valid) {
        this.stats.valid++;
      }
      if (result.warnings.length > 0) {
        this.stats.warnings++;
      }
      if (result.errors.length > 0) {
        this.stats.errors++;
      }
    }

    return results;
  }

  /**
   * Validate a single herb by ID
   */
  validateSingleHerb(herbId) {
    const filePath = path.join('./firebase-assets-downloaded/herbs', `${herbId}.json`);

    if (!fs.existsSync(filePath)) {
      console.error(`Herb not found: ${herbId}`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const herbData = JSON.parse(content);
    return this.validateHerb(herbData, herbData.id);
  }

  /**
   * Format and display results
   */
  displayResults(results) {
    if (Array.isArray(results)) {
      // Multiple herbs
      console.log('\n===============================================');
      console.log('HERB METADATA VALIDATION REPORT');
      console.log('===============================================\n');

      // Summary
      console.log('SUMMARY');
      console.log('-------');
      console.log(`Total herbs: ${this.stats.total}`);
      console.log(`Valid: ${this.stats.valid} ✓`);
      console.log(`With warnings: ${this.stats.warnings} ⚠`);
      console.log(`With errors: ${this.stats.errors} ✗`);
      console.log(`Validation rate: ${((this.stats.valid / this.stats.total) * 100).toFixed(1)}%\n`);

      // Herb details
      console.log('DETAILED RESULTS');
      console.log('----------------');

      // Sort by completeness (descending)
      results.sort((a, b) => b.completeness - a.completeness);

      for (const result of results) {
        const status = result.valid ? '✓' : '✗';
        const completeness = `${result.completeness}%`;
        console.log(`\n${status} ${result.id}`);
        console.log(`  Completeness: ${completeness}`);

        if (result.errors.length > 0) {
          console.log(`  Errors (${result.errors.length}):`);
          result.errors.forEach(err => console.log(`    • ${err}`));
        }

        if (result.warnings.length > 0) {
          console.log(`  Warnings (${result.warnings.length}):`);
          result.warnings.forEach(warn => console.log(`    ⚠ ${warn}`));
        }
      }
    } else if (results) {
      // Single herb
      console.log('\n===============================================');
      console.log(`VALIDATION: ${results.id}`);
      console.log('===============================================\n');

      console.log(`Status: ${results.valid ? 'VALID ✓' : 'INVALID ✗'}`);
      console.log(`Completeness: ${results.completeness}%\n`);

      if (results.errors.length > 0) {
        console.log('ERRORS:');
        results.errors.forEach(err => console.log(`  ✗ ${err}`));
        console.log();
      }

      if (results.warnings.length > 0) {
        console.log('WARNINGS:');
        results.warnings.forEach(warn => console.log(`  ⚠ ${warn}`));
        console.log();
      }

      if (results.valid && results.warnings.length === 0) {
        console.log('All validations passed!');
      }
    }
  }
}

// Main execution
const validator = new HerbMetadataValidator();
const herbId = process.argv[2];

if (herbId) {
  const result = validator.validateSingleHerb(herbId);
  validator.displayResults(result);
} else {
  const results = validator.validateAllHerbs();
  validator.displayResults(results);
}
