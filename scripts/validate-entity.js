/**
 * Entity Validator
 * Validates entity JSON files against the v2.0 schema
 *
 * Usage:
 *   node scripts/validate-entity.js <path-to-entity.json>
 *   node scripts/validate-entity.js --all
 */

const fs = require('fs');
const path = require('path');

// Load schema
const schemaPath = path.join(__dirname, '../data/schemas/entity-schema-v2.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

// Validation results
let totalFiles = 0;
let validFiles = 0;
let errors = [];
let warnings = [];

/**
 * Validate an entity object
 */
function validateEntity(entity, filePath) {
  const entityErrors = [];
  const entityWarnings = [];

  // Required fields
  if (!entity.id) entityErrors.push('Missing required field: id');
  if (!entity.type) entityErrors.push('Missing required field: type');
  if (!entity.name) entityErrors.push('Missing required field: name');
  if (!entity.mythologies || entity.mythologies.length === 0) {
    entityErrors.push('Missing required field: mythologies (must have at least one)');
  }

  // ID format validation
  if (entity.id && !/^[a-z0-9-]+$/.test(entity.id)) {
    entityErrors.push(`Invalid ID format: "${entity.id}" (must be kebab-case: lowercase with hyphens)`);
  }

  // Type validation
  const validTypes = ['deity', 'item', 'place', 'concept', 'magic', 'creature', 'hero', 'archetype'];
  if (entity.type && !validTypes.includes(entity.type)) {
    entityErrors.push(`Invalid type: "${entity.type}" (must be one of: ${validTypes.join(', ')})`);
  }

  // Mythology validation
  const validMythologies = [
    'greek', 'norse', 'egyptian', 'hindu', 'buddhist', 'jewish', 'christian', 'islamic',
    'japanese', 'chinese', 'celtic', 'roman', 'mesopotamian', 'persian', 'zoroastrian',
    'aztec', 'babylonian', 'slavic', 'native_american', 'universal'
  ];
  if (entity.mythologies) {
    entity.mythologies.forEach(myth => {
      if (!validMythologies.includes(myth)) {
        entityWarnings.push(`Unknown mythology: "${myth}"`);
      }
    });
  }

  // Color validation
  if (entity.colors) {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (entity.colors.primary && !hexPattern.test(entity.colors.primary)) {
      entityErrors.push(`Invalid hex color for primary: "${entity.colors.primary}"`);
    }
    if (entity.colors.secondary && !hexPattern.test(entity.colors.secondary)) {
      entityErrors.push(`Invalid hex color for secondary: "${entity.colors.secondary}"`);
    }
    if (entity.colors.accent && !hexPattern.test(entity.colors.accent)) {
      entityErrors.push(`Invalid hex color for accent: "${entity.colors.accent}"`);
    }
  }

  // Coordinates validation
  if (entity.geographical?.primaryLocation?.coordinates) {
    const { latitude, longitude, elevation } = entity.geographical.primaryLocation.coordinates;
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      entityErrors.push(`Invalid latitude: ${latitude} (must be between -90 and 90)`);
    }
    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      entityErrors.push(`Invalid longitude: ${longitude} (must be between -180 and 180)`);
    }
  }

  // Recommended fields
  if (!entity.shortDescription) {
    entityWarnings.push('Missing recommended field: shortDescription');
  } else if (entity.shortDescription.length > 200) {
    entityWarnings.push(`shortDescription too long: ${entity.shortDescription.length} chars (max 200)`);
  }

  if (!entity.fullDescription && !entity.longDescription) {
    entityWarnings.push('Missing recommended field: fullDescription or longDescription');
  }

  if (!entity.icon) {
    entityWarnings.push('Missing recommended field: icon');
  }

  if (!entity.colors || !entity.colors.primary) {
    entityWarnings.push('Missing recommended field: colors.primary');
  }

  if (!entity.sources || entity.sources.length === 0) {
    entityWarnings.push('No sources provided - consider adding ancient text references');
  }

  // Completeness score
  const totalPossibleFields = 20;
  let filledFields = 0;

  if (entity.id) filledFields++;
  if (entity.type) filledFields++;
  if (entity.name) filledFields++;
  if (entity.mythologies?.length) filledFields++;
  if (entity.shortDescription) filledFields++;
  if (entity.fullDescription || entity.longDescription) filledFields++;
  if (entity.icon) filledFields++;
  if (entity.colors?.primary) filledFields++;
  if (entity.sources?.length) filledFields++;
  if (entity.tags?.length) filledFields++;
  if (entity.linguistic?.originalName) filledFields++;
  if (entity.geographical?.primaryLocation) filledFields++;
  if (entity.temporal?.firstAttestation) filledFields++;
  if (entity.cultural?.worshipPractices?.length) filledFields++;
  if (entity.metaphysicalProperties?.primaryElement) filledFields++;
  if (entity.archetypes?.length) filledFields++;
  if (entity.relatedEntities && Object.keys(entity.relatedEntities).length) filledFields++;
  if (entity.mediaReferences) filledFields++;

  const completeness = Math.round((filledFields / totalPossibleFields) * 100);

  return {
    valid: entityErrors.length === 0,
    errors: entityErrors,
    warnings: entityWarnings,
    completeness: completeness,
    filePath: filePath
  };
}

/**
 * Validate a single file
 */
function validateFile(filePath) {
  totalFiles++;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const entity = JSON.parse(content);

    const result = validateEntity(entity, filePath);

    if (result.valid) {
      validFiles++;
      console.log(`✅ ${path.basename(filePath)} - Valid (${result.completeness}% complete)`);
    } else {
      console.log(`❌ ${path.basename(filePath)} - Invalid`);
      result.errors.forEach(err => console.log(`   ERROR: ${err}`));
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warn => console.log(`   ⚠️  ${warn}`));
    }

    errors.push(...result.errors.map(e => ({ file: filePath, error: e })));
    warnings.push(...result.warnings.map(w => ({ file: filePath, warning: w })));

    return result;

  } catch (error) {
    console.log(`❌ ${path.basename(filePath)} - Error reading file`);
    console.log(`   ERROR: ${error.message}`);
    errors.push({ file: filePath, error: error.message });
    return { valid: false, errors: [error.message], warnings: [] };
  }
}

/**
 * Validate all entities in a directory
 */
function validateDirectory(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });

  files.forEach(file => {
    const fullPath = path.join(dirPath, file.name);

    if (file.isDirectory()) {
      validateDirectory(fullPath);
    } else if (file.name.endsWith('.json')) {
      validateFile(fullPath);
    }
  });
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);

  console.log('\n=== Entity Validator v2.0 ===\n');

  if (args.includes('--all')) {
    const entitiesDir = path.join(__dirname, '../data/entities');
    if (fs.existsSync(entitiesDir)) {
      validateDirectory(entitiesDir);
    } else {
      console.error('Entities directory not found:', entitiesDir);
      process.exit(1);
    }
  } else if (args.length > 0) {
    args.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        validateFile(filePath);
      } else {
        console.error('File not found:', filePath);
      }
    });
  } else {
    console.error('Usage:');
    console.error('  node validate-entity.js <path-to-entity.json>');
    console.error('  node validate-entity.js --all');
    process.exit(1);
  }

  // Summary
  console.log('\n=== Validation Summary ===');
  console.log(`Total files: ${totalFiles}`);
  console.log(`Valid: ${validFiles}`);
  console.log(`Invalid: ${totalFiles - validFiles}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n=== Critical Errors ===');
    errors.forEach(({ file, error }) => {
      console.log(`${path.basename(file)}: ${error}`);
    });
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
