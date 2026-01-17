/**
 * Validate Generated Entities
 *
 * Ensures all generated entities pass schema validation
 * and are ready for integration into the database.
 *
 * Input: generated-entities-preview/ directory
 * Output: reports/generation-validation.json
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const PREVIEW_DIR = path.join(__dirname, '..', 'generated-entities-preview');
const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

// Valid mythologies
const VALID_MYTHOLOGIES = new Set([
  'greek', 'norse', 'egyptian', 'hindu', 'buddhist', 'christian', 'islamic',
  'babylonian', 'sumerian', 'persian', 'roman', 'celtic', 'chinese', 'japanese',
  'aztec', 'mayan', 'yoruba', 'native_american', 'jewish', 'tarot', 'apocryphal',
  'comparative', 'african', 'polynesian', 'slavic', 'finnish', 'mesopotamian',
  'tibetan', 'shinto', 'zoroastrian', 'general', 'korean', 'vietnamese',
  'indonesian', 'philippine', 'australian', 'oceanic', 'inuit', 'siberian'
]);

// Valid entity types
const VALID_TYPES = new Set([
  'deity', 'hero', 'creature', 'place', 'item', 'ritual',
  'text', 'symbol', 'concept', 'cosmology', 'archetype', 'mythology'
]);

// Required fields for all entities
const REQUIRED_FIELDS = ['id', 'name', 'type', 'mythology', 'description', 'shortDescription'];

// Type-specific required fields
const TYPE_REQUIRED_FIELDS = {
  deity: ['domains'],
  hero: ['quests', 'abilities'],
  creature: ['classification', 'abilities'],
  place: ['category'],
  concept: ['category']
};

class EntityValidator {
  constructor() {
    this.entities = [];
    this.existingIds = new Set();
    this.results = {
      valid: [],
      warnings: [],
      errors: []
    };
    this.stats = {
      total: 0,
      valid: 0,
      withWarnings: 0,
      withErrors: 0
    };
  }

  async loadExistingIds() {
    try {
      const categories = await fs.readdir(ASSETS_DIR);
      for (const category of categories) {
        const categoryPath = path.join(ASSETS_DIR, category);
        try {
          const stat = await fs.stat(categoryPath);
          if (!stat.isDirectory()) continue;

          const files = await fs.readdir(categoryPath);
          for (const file of files) {
            if (file.endsWith('.json')) {
              this.existingIds.add(file.replace('.json', ''));
            }
          }
        } catch {
          continue;
        }
      }
      console.log('Loaded ' + this.existingIds.size + ' existing entity IDs');
    } catch (error) {
      console.log('Warning: Could not load existing IDs: ' + error.message);
    }
  }

  async loadGeneratedEntities() {
    try {
      const categories = await fs.readdir(PREVIEW_DIR);
      for (const category of categories) {
        const categoryPath = path.join(PREVIEW_DIR, category);
        try {
          const stat = await fs.stat(categoryPath);
          if (!stat.isDirectory()) continue;

          const files = await fs.readdir(categoryPath);
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(categoryPath, file);
              try {
                const content = await fs.readFile(filePath, 'utf8');
                const entity = JSON.parse(content);
                this.entities.push({
                  entity,
                  filePath,
                  category,
                  fileName: file
                });
              } catch (error) {
                this.results.errors.push({
                  file: path.join(category, file),
                  error: 'Parse error: ' + error.message
                });
              }
            }
          }
        } catch {
          continue;
        }
      }
      console.log('Loaded ' + this.entities.length + ' generated entities');
    } catch (error) {
      console.error('Error loading generated entities: ' + error.message);
    }
  }

  validateEntity(item) {
    const { entity, filePath, category, fileName } = item;
    const entityId = fileName.replace('.json', '');
    const issues = [];
    const warnings = [];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!entity[field]) {
        issues.push('Missing required field: ' + field);
      }
    }

    // Check ID matches filename
    if (entity.id && entity.id !== entityId) {
      issues.push('ID mismatch: entity.id="' + entity.id + '" vs filename="' + entityId + '"');
    }

    // Check type validity
    if (entity.type && !VALID_TYPES.has(entity.type)) {
      issues.push('Invalid type: ' + entity.type);
    }

    // Check mythology validity
    if (entity.mythology && !VALID_MYTHOLOGIES.has(entity.mythology)) {
      warnings.push('Unknown mythology: ' + entity.mythology + ' (may need to add to valid list)');
    }

    // Check description length
    if (entity.description) {
      if (entity.description.length < 200) {
        warnings.push('Description too short: ' + entity.description.length + ' chars (recommend 500+)');
      } else if (entity.description.length < 500) {
        warnings.push('Description below recommended length: ' + entity.description.length + ' chars');
      }
    }

    // Check for duplicate with existing assets
    if (this.existingIds.has(entityId)) {
      issues.push('Duplicate ID: Entity already exists in database');
    }

    // Check type-specific required fields
    const typeFields = TYPE_REQUIRED_FIELDS[entity.type];
    if (typeFields) {
      for (const field of typeFields) {
        if (!entity[field] || (Array.isArray(entity[field]) && entity[field].length === 0)) {
          warnings.push('Missing recommended field for ' + entity.type + ': ' + field);
        }
      }
    }

    // Check relatedEntities structure
    if (entity.relatedEntities) {
      if (typeof entity.relatedEntities !== 'object') {
        issues.push('relatedEntities must be an object');
      } else {
        for (const [category, entities] of Object.entries(entity.relatedEntities)) {
          if (!Array.isArray(entities)) {
            issues.push('relatedEntities.' + category + ' must be an array');
          } else {
            for (const related of entities) {
              if (!related.id || !related.name) {
                warnings.push('relatedEntities.' + category + ' entry missing id or name');
              }
            }
          }
        }
      }
    }

    // Check sources structure
    if (entity.sources) {
      if (!Array.isArray(entity.sources)) {
        issues.push('sources must be an array');
      } else {
        for (const source of entity.sources) {
          if (!source.title) {
            warnings.push('Source missing title');
          }
        }
      }
    }

    // Check for empty arrays that should have content
    const arrayFields = ['domains', 'symbols', 'epithets', 'quests', 'abilities'];
    for (const field of arrayFields) {
      if (entity[field] && Array.isArray(entity[field]) && entity[field].length === 0) {
        warnings.push('Empty array: ' + field);
      }
    }

    return { issues, warnings };
  }

  async validate() {
    await this.loadExistingIds();
    await this.loadGeneratedEntities();

    console.log('\n' + '='.repeat(60));
    console.log('VALIDATING GENERATED ENTITIES');
    console.log('='.repeat(60));

    for (const item of this.entities) {
      const { issues, warnings } = this.validateEntity(item);
      const entityPath = path.join(item.category, item.fileName);

      this.stats.total++;

      if (issues.length > 0) {
        this.stats.withErrors++;
        this.results.errors.push({
          file: entityPath,
          id: item.entity.id,
          type: item.entity.type,
          mythology: item.entity.mythology,
          issues
        });
      } else if (warnings.length > 0) {
        this.stats.withWarnings++;
        this.results.warnings.push({
          file: entityPath,
          id: item.entity.id,
          type: item.entity.type,
          mythology: item.entity.mythology,
          warnings
        });
      } else {
        this.stats.valid++;
        this.results.valid.push({
          file: entityPath,
          id: item.entity.id,
          type: item.entity.type,
          mythology: item.entity.mythology,
          descriptionLength: (item.entity.description || '').length
        });
      }
    }

    await this.saveReport();
    this.printSummary();
  }

  async saveReport() {
    try {
      await fs.mkdir(REPORTS_DIR, { recursive: true });
    } catch {}

    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      summary: {
        totalEntities: this.stats.total,
        passedValidation: this.stats.valid,
        withWarnings: this.stats.withWarnings,
        withErrors: this.stats.withErrors,
        successRate: this.stats.total > 0
          ? ((this.stats.valid + this.stats.withWarnings) / this.stats.total * 100).toFixed(1) + '%'
          : '0%'
      },
      errors: this.results.errors,
      warnings: this.results.warnings.slice(0, 50), // Limit warnings in report
      validSample: this.results.valid.slice(0, 20)
    };

    await fs.writeFile(
      path.join(REPORTS_DIR, 'generation-validation.json'),
      JSON.stringify(report, null, 2)
    );
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION COMPLETE');
    console.log('='.repeat(60));
    console.log('Total entities: ' + this.stats.total);
    console.log('Passed (no issues): ' + this.stats.valid);
    console.log('With warnings: ' + this.stats.withWarnings);
    console.log('With errors: ' + this.stats.withErrors);

    const successRate = this.stats.total > 0
      ? ((this.stats.valid + this.stats.withWarnings) / this.stats.total * 100).toFixed(1)
      : 0;
    console.log('Success rate: ' + successRate + '%');

    if (this.results.errors.length > 0) {
      console.log('\n--- ERRORS (require fixing) ---');
      for (const error of this.results.errors.slice(0, 10)) {
        console.log('\n' + error.file + ':');
        for (const issue of error.issues) {
          console.log('  - ' + issue);
        }
      }
      if (this.results.errors.length > 10) {
        console.log('\n... and ' + (this.results.errors.length - 10) + ' more errors');
      }
    }

    if (this.results.warnings.length > 0) {
      console.log('\n--- WARNINGS (review recommended) ---');
      // Group warnings by type
      const warningCounts = {};
      for (const warning of this.results.warnings) {
        for (const w of warning.warnings) {
          const key = w.split(':')[0];
          warningCounts[key] = (warningCounts[key] || 0) + 1;
        }
      }
      for (const [warning, count] of Object.entries(warningCounts).sort((a, b) => b[1] - a[1])) {
        console.log('  ' + warning + ': ' + count + ' entities');
      }
    }

    console.log('\nReport saved to: reports/generation-validation.json');
  }
}

async function main() {
  const validator = new EntityValidator();
  await validator.validate();
}

main().catch(console.error);
