#!/usr/bin/env node

/**
 * Entity Validation Script
 * Validates all entity JSON files against the schema
 */

const fs = require('fs');
const path = require('path');

const ENTITIES_DIR = './data/entities';
const SCHEMA_PATH = './data/schemas/entity-schema.json';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEntity(entityPath, entityData) {
  const errors = [];
  const warnings = [];

  // Required fields
  const required = ['id', 'type', 'name', 'mythologies'];
  required.forEach(field => {
    if (!entityData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate type
  const validTypes = ['item', 'place', 'deity', 'concept', 'archetype', 'magic', 'creature', 'hero'];
  if (entityData.type && !validTypes.includes(entityData.type)) {
    errors.push(`Invalid type: ${entityData.type}. Must be one of: ${validTypes.join(', ')}`);
  }

  // Validate mythologies array
  if (entityData.mythologies && !Array.isArray(entityData.mythologies)) {
    errors.push('mythologies must be an array');
  }

  // Validate shortDescription length
  if (entityData.shortDescription && entityData.shortDescription.length > 200) {
    warnings.push(`shortDescription too long (${entityData.shortDescription.length} chars, max 200)`);
  }

  // Check for relationships
  if (entityData.relatedEntities) {
    Object.entries(entityData.relatedEntities).forEach(([type, entities]) => {
      if (!Array.isArray(entities)) {
        errors.push(`relatedEntities.${type} must be an array`);
      } else {
        entities.forEach((entity, idx) => {
          if (!entity.id || !entity.name) {
            errors.push(`relatedEntities.${type}[${idx}] missing id or name`);
          }
        });
      }
    });
  }

  // Check mythology contexts
  if (entityData.mythologyContexts) {
    if (!Array.isArray(entityData.mythologyContexts)) {
      errors.push('mythologyContexts must be an array');
    } else {
      entityData.mythologyContexts.forEach((context, idx) => {
        if (!context.mythology) {
          errors.push(`mythologyContexts[${idx}] missing mythology field`);
        }
        if (!context.usage) {
          warnings.push(`mythologyContexts[${idx}] missing usage description`);
        }
      });
    }
  }

  // Check sources
  if (entityData.sources) {
    if (!Array.isArray(entityData.sources)) {
      errors.push('sources must be an array');
    }
  }

  return { errors, warnings };
}

function scanEntities() {
  let totalFiles = 0;
  let validFiles = 0;
  let errorFiles = 0;
  let allErrors = [];
  let allWarnings = [];

  log('\n🔍 Scanning Entity Files...\n', 'cyan');

  const entityTypes = fs.readdirSync(ENTITIES_DIR);

  entityTypes.forEach(type => {
    const typePath = path.join(ENTITIES_DIR, type);
    if (!fs.statSync(typePath).isDirectory()) return;

    const files = fs.readdirSync(typePath).filter(f => f.endsWith('.json'));

    if (files.length > 0) {
      log(`\n📁 ${type.toUpperCase()} (${files.length} files)`, 'blue');
    }

    files.forEach(file => {
      totalFiles++;
      const filePath = path.join(typePath, file);

      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const { errors, warnings } = validateEntity(filePath, data);

        if (errors.length > 0) {
          errorFiles++;
          log(`  ❌ ${file}`, 'red');
          errors.forEach(err => {
            log(`     - ${err}`, 'red');
            allErrors.push({ file, error: err });
          });
        } else {
          validFiles++;
          log(`  ✅ ${file}`, 'green');
        }

        if (warnings.length > 0) {
          warnings.forEach(warn => {
            log(`     ⚠️  ${warn}`, 'yellow');
            allWarnings.push({ file, warning: warn });
          });
        }

      } catch (error) {
        errorFiles++;
        log(`  ❌ ${file} - JSON parse error`, 'red');
        log(`     - ${error.message}`, 'red');
        allErrors.push({ file, error: error.message });
      }
    });
  });

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('VALIDATION SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');

  log(`\nTotal Files: ${totalFiles}`, 'blue');
  log(`Valid: ${validFiles}`, 'green');
  log(`Errors: ${errorFiles}`, errorFiles > 0 ? 'red' : 'green');
  log(`Warnings: ${allWarnings.length}`, allWarnings.length > 0 ? 'yellow' : 'green');

  if (errorFiles === 0 && allWarnings.length === 0) {
    log('\n✨ All entities are valid! ✨\n', 'green');
  } else if (errorFiles === 0) {
    log('\n✅ All entities valid, but review warnings above.\n', 'yellow');
  } else {
    log('\n❌ Some entities have errors. Please fix them.\n', 'red');
  }

  return {
    total: totalFiles,
    valid: validFiles,
    errors: errorFiles,
    errorList: allErrors,
    warningList: allWarnings
  };
}

// Run validation
const results = scanEntities();

// Exit with error code if there are errors
process.exit(results.errors > 0 ? 1 : 0);
