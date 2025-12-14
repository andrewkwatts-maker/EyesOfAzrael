/**
 * Validate Deity Template Compliance
 *
 * This script validates deity entities against the Universal Entity Template
 * defined in UNIVERSAL_ENTITY_TEMPLATE.md
 *
 * Features:
 * - Validates all required fields exist
 * - Checks field types match schema
 * - Validates cross-references are valid IDs
 * - Reports completeness score (0-100%)
 * - Generates detailed validation report
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEITIES_DIR = path.join(__dirname, '../FIREBASE/data/entities/deity');
const REPORT_PATH = path.join(__dirname, '../reports/deity-validation-report.json');
const VERBOSE = process.argv.includes('--verbose');
const ONLY_ERRORS = process.argv.includes('--only-errors');

// Validation statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  completeness: {},
  missingFields: {},
  invalidTypes: {}
};

// Required fields per Universal Entity Template
const REQUIRED_FIELDS = {
  core: [
    'id',
    'type',
    'name',
    'title',
    'subtitle',
    'description',
    'content',
    'mythology',
    'mythologies',
    'category',
    'status',
    'createdAt',
    'updatedAt',
    'authorId'
  ],
  deity: [
    'domains',
    'symbols'
  ]
};

// Recommended fields (for completeness score)
const RECOMMENDED_FIELDS = {
  metadata: [
    'linguistic',
    'geographical',
    'temporal',
    'cultural',
    'visual'
  ],
  deity: [
    'element',
    'gender',
    'generation',
    'relationships',
    'sacredAnimals',
    'sacredPlants',
    'epithets',
    'cultCenters',
    'archetypes'
  ],
  crossReferences: [
    'relatedEntities'
  ],
  sources: [
    'sources'
  ]
};

// Valid field types
const FIELD_TYPES = {
  id: 'string',
  type: 'string',
  name: 'string',
  title: 'string',
  subtitle: 'string',
  description: 'string',
  content: 'string',
  mythology: 'string',
  mythologies: 'array',
  category: 'string',
  status: 'string',
  createdAt: 'string',
  updatedAt: 'string',
  authorId: 'string',
  domains: 'array',
  symbols: 'array',
  element: ['string', 'null'],
  gender: 'string',
  generation: ['string', 'null'],
  relationships: 'object',
  sacredAnimals: 'array',
  sacredPlants: 'array',
  epithets: 'array',
  cultCenters: 'array',
  archetypes: 'array',
  linguistic: ['object', 'null'],
  geographical: ['object', 'null'],
  temporal: ['object', 'null'],
  cultural: ['object', 'null'],
  visual: ['object', 'null'],
  relatedEntities: 'object',
  sources: 'array'
};

// Valid values for specific fields
const VALID_VALUES = {
  type: ['deity'],
  status: ['draft', 'published', 'approved'],
  element: ['fire', 'water', 'earth', 'air', 'aether', 'wood', 'metal', null],
  gender: ['male', 'female', 'non-binary', 'fluid', 'unknown']
};

/**
 * Get the type of a value
 */
function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Check if a field type is valid
 */
function isValidType(field, value) {
  const expectedType = FIELD_TYPES[field];
  const actualType = getType(value);

  if (!expectedType) return true; // Unknown field, skip type check

  if (Array.isArray(expectedType)) {
    return expectedType.includes(actualType);
  }

  return expectedType === actualType;
}

/**
 * Check if a field value is valid
 */
function isValidValue(field, value) {
  const validValues = VALID_VALUES[field];
  if (!validValues) return true; // No restrictions

  return validValues.includes(value);
}

/**
 * Validate subtitle length
 */
function validateSubtitle(subtitle) {
  if (!subtitle) return { valid: false, message: 'Subtitle is required' };
  if (subtitle.length < 10) return { valid: false, message: 'Subtitle too short (min 10 chars)' };
  if (subtitle.length > 150) return { valid: false, message: 'Subtitle too long (max 150 chars)' };
  return { valid: true };
}

/**
 * Validate description length
 */
function validateDescription(description) {
  if (!description) return { valid: false, message: 'Description is required' };
  if (description.length < 200) return { valid: false, message: 'Description too short (min 200 chars)' };
  if (description.length > 2000) return { valid: false, message: 'Description too long (max 2000 chars)' };
  return { valid: true };
}

/**
 * Validate mythology consistency
 */
function validateMythologies(deity) {
  const errors = [];

  if (!Array.isArray(deity.mythologies)) {
    errors.push('mythologies must be an array');
  } else if (deity.mythologies.length === 0) {
    errors.push('mythologies array cannot be empty');
  } else if (deity.mythology && !deity.mythologies.includes(deity.mythology)) {
    errors.push(`mythology "${deity.mythology}" must be included in mythologies array`);
  }

  return errors;
}

/**
 * Validate cross-references structure
 */
function validateRelatedEntities(relatedEntities) {
  const errors = [];

  if (!relatedEntities) {
    return ['relatedEntities field is missing'];
  }

  if (typeof relatedEntities !== 'object' || Array.isArray(relatedEntities)) {
    return ['relatedEntities must be an object'];
  }

  const expectedKeys = ['deities', 'heroes', 'creatures', 'items', 'places', 'concepts', 'magic', 'theories', 'mythologies'];

  expectedKeys.forEach(key => {
    if (relatedEntities[key] && !Array.isArray(relatedEntities[key])) {
      errors.push(`relatedEntities.${key} must be an array`);
    }

    if (Array.isArray(relatedEntities[key])) {
      relatedEntities[key].forEach((ref, index) => {
        if (!ref.id || !ref.name) {
          errors.push(`relatedEntities.${key}[${index}] missing required id or name`);
        }
      });
    }
  });

  return errors;
}

/**
 * Validate linguistic data structure
 */
function validateLinguistic(linguistic) {
  const errors = [];

  if (!linguistic) return errors; // Optional field

  if (linguistic.etymology && typeof linguistic.etymology !== 'object') {
    errors.push('linguistic.etymology must be an object');
  }

  if (linguistic.cognates && !Array.isArray(linguistic.cognates)) {
    errors.push('linguistic.cognates must be an array');
  }

  return errors;
}

/**
 * Validate geographical data structure
 */
function validateGeographical(geographical) {
  const errors = [];

  if (!geographical) return errors; // Optional field

  if (geographical.primaryLocation) {
    const loc = geographical.primaryLocation;
    if (loc.coordinates) {
      if (typeof loc.coordinates.latitude !== 'number' ||
          loc.coordinates.latitude < -90 || loc.coordinates.latitude > 90) {
        errors.push('Invalid latitude in geographical.primaryLocation');
      }
      if (typeof loc.coordinates.longitude !== 'number' ||
          loc.coordinates.longitude < -180 || loc.coordinates.longitude > 180) {
        errors.push('Invalid longitude in geographical.primaryLocation');
      }
    }
  }

  return errors;
}

/**
 * Validate temporal data structure
 */
function validateTemporal(temporal) {
  const errors = [];

  if (!temporal) return errors; // Optional field

  if (temporal.firstAttestation) {
    const attestation = temporal.firstAttestation;
    if (!attestation.date && !attestation.source) {
      errors.push('temporal.firstAttestation must have date or source');
    }
  }

  return errors;
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(deity) {
  let totalFields = 0;
  let filledFields = 0;

  // Count core required fields
  REQUIRED_FIELDS.core.forEach(field => {
    totalFields++;
    if (deity[field]) filledFields++;
  });

  REQUIRED_FIELDS.deity.forEach(field => {
    totalFields++;
    if (deity[field] && deity[field].length > 0) filledFields++;
  });

  // Count recommended fields
  Object.values(RECOMMENDED_FIELDS).forEach(fieldList => {
    fieldList.forEach(field => {
      totalFields++;
      const value = deity[field];
      if (value) {
        if (Array.isArray(value)) {
          if (value.length > 0) filledFields++;
        } else if (typeof value === 'object' && value !== null) {
          if (Object.keys(value).length > 0) filledFields++;
        } else {
          filledFields++;
        }
      }
    });
  });

  return Math.round((filledFields / totalFields) * 100);
}

/**
 * Validate a single deity entity
 */
function validateDeity(deity, filename) {
  const errors = [];
  const warnings = [];
  const missing = [];

  // Check required core fields
  REQUIRED_FIELDS.core.forEach(field => {
    if (!deity[field]) {
      missing.push(field);
      errors.push(`Missing required field: ${field}`);
    } else if (!isValidType(field, deity[field])) {
      errors.push(`Invalid type for ${field}: expected ${FIELD_TYPES[field]}, got ${getType(deity[field])}`);
    } else if (!isValidValue(field, deity[field])) {
      errors.push(`Invalid value for ${field}: ${deity[field]}`);
    }
  });

  // Check required deity fields
  REQUIRED_FIELDS.deity.forEach(field => {
    if (!deity[field]) {
      missing.push(field);
      errors.push(`Missing required deity field: ${field}`);
    } else if (!isValidType(field, deity[field])) {
      errors.push(`Invalid type for ${field}: expected ${FIELD_TYPES[field]}, got ${getType(deity[field])}`);
    }
  });

  // Validate subtitle length
  const subtitleValidation = validateSubtitle(deity.subtitle);
  if (!subtitleValidation.valid) {
    errors.push(subtitleValidation.message);
  }

  // Validate description length
  const descriptionValidation = validateDescription(deity.description);
  if (!descriptionValidation.valid) {
    warnings.push(descriptionValidation.message);
  }

  // Validate mythology consistency
  const mythologyErrors = validateMythologies(deity);
  errors.push(...mythologyErrors);

  // Validate relatedEntities structure
  const relatedEntitiesErrors = validateRelatedEntities(deity.relatedEntities);
  errors.push(...relatedEntitiesErrors);

  // Validate metadata structures
  const linguisticErrors = validateLinguistic(deity.linguistic);
  errors.push(...linguisticErrors);

  const geographicalErrors = validateGeographical(deity.geographical);
  errors.push(...geographicalErrors);

  const temporalErrors = validateTemporal(deity.temporal);
  errors.push(...temporalErrors);

  // Check recommended fields
  Object.values(RECOMMENDED_FIELDS).forEach(fieldList => {
    fieldList.forEach(field => {
      if (!deity[field] || (Array.isArray(deity[field]) && deity[field].length === 0)) {
        warnings.push(`Recommended field missing or empty: ${field}`);
      }
    });
  });

  // Calculate completeness
  const completeness = calculateCompleteness(deity);

  return {
    filename,
    valid: errors.length === 0,
    errors,
    warnings,
    missing,
    completeness
  };
}

/**
 * Main validation function
 */
async function validateAllDeities() {
  console.log('🔍 Validating Deities Against Universal Template\n');

  // Get all deity files
  const files = fs.readdirSync(DEITIES_DIR).filter(f => f.endsWith('.json'));
  stats.total = files.length;

  console.log(`📊 Found ${files.length} deity files\n`);

  const results = [];

  // Validate each deity
  for (const file of files) {
    try {
      const filePath = path.join(DEITIES_DIR, file);
      const deity = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      const result = validateDeity(deity, file);
      results.push(result);

      if (result.valid) {
        stats.passed++;
      } else {
        stats.failed++;
      }

      stats.warnings += result.warnings.length;
      stats.completeness[file] = result.completeness;

      // Track missing fields
      result.missing.forEach(field => {
        if (!stats.missingFields[field]) {
          stats.missingFields[field] = 0;
        }
        stats.missingFields[field]++;
      });

      // Display progress
      if (!ONLY_ERRORS || !result.valid) {
        const icon = result.valid ? '✅' : '❌';
        const score = `${result.completeness}%`;
        console.log(`${icon} ${file} - Completeness: ${score}`);

        if (VERBOSE || !result.valid) {
          if (result.errors.length > 0) {
            result.errors.forEach(error => console.log(`   ❌ ${error}`));
          }
          if (VERBOSE && result.warnings.length > 0) {
            result.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
          }
        }
      } else {
        process.stdout.write('.');
      }

    } catch (error) {
      console.error(`\n❌ Error processing ${file}:`, error.message);
      stats.errors.push({ file, error: error.message });
    }
  }

  // Calculate average completeness
  const avgCompleteness = Math.round(
    Object.values(stats.completeness).reduce((a, b) => a + b, 0) / stats.total
  );

  // Print summary
  console.log('\n\n📈 Validation Summary:\n');
  console.log(`Total deities: ${stats.total}`);
  console.log(`Passed: ${stats.passed} (${Math.round((stats.passed / stats.total) * 100)}%)`);
  console.log(`Failed: ${stats.failed} (${Math.round((stats.failed / stats.total) * 100)}%)`);
  console.log(`Total warnings: ${stats.warnings}`);
  console.log(`Average completeness: ${avgCompleteness}%`);

  // Most commonly missing fields
  console.log('\n📋 Most Commonly Missing Fields:');
  const sortedMissing = Object.entries(stats.missingFields)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedMissing.forEach(([field, count]) => {
    const percentage = Math.round((count / stats.total) * 100);
    console.log(`  ${field}: ${count} deities (${percentage}%)`);
  });

  // Completeness distribution
  console.log('\n📊 Completeness Distribution:');
  const ranges = {
    '90-100%': 0,
    '80-89%': 0,
    '70-79%': 0,
    '60-69%': 0,
    '50-59%': 0,
    '<50%': 0
  };

  Object.values(stats.completeness).forEach(score => {
    if (score >= 90) ranges['90-100%']++;
    else if (score >= 80) ranges['80-89%']++;
    else if (score >= 70) ranges['70-79%']++;
    else if (score >= 60) ranges['60-69%']++;
    else if (score >= 50) ranges['50-59%']++;
    else ranges['<50%']++;
  });

  Object.entries(ranges).forEach(([range, count]) => {
    const bar = '█'.repeat(Math.round((count / stats.total) * 20));
    console.log(`  ${range}: ${bar} ${count}`);
  });

  // Generate detailed JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: stats.total,
      passed: stats.passed,
      failed: stats.failed,
      warnings: stats.warnings,
      averageCompleteness: avgCompleteness
    },
    results,
    missingFields: stats.missingFields,
    completenessDistribution: ranges
  };

  // Save report
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n📝 Detailed report saved to: ${REPORT_PATH}`);

  // Return exit code based on validation
  process.exit(stats.failed > 0 ? 1 : 0);
}

// Run validation
validateAllDeities().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
