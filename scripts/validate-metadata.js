const fs = require('fs');
const path = require('path');

/**
 * Validates that all entities have complete metadata
 * Checks:
 * 1. Required fields presence
 * 2. Metadata schema v2.0 compliance
 * 3. Linguistic metadata (etymology, translations)
 * 4. Geographical metadata (coordinates, region)
 * 5. Temporal metadata (attestations, timeline)
 */

class MetadataValidator {
  constructor() {
    this.entities = [];
    this.issues = [];
    this.stats = {
      total: 0,
      complete: 0,
      incomplete: 0,
      missingFields: {}
    };

    // Define required metadata schema v2.0
    this.schema = {
      core: ['id', 'type', 'name', 'slug', 'mythologies', 'primaryMythology', 'shortDescription'],
      visual: ['icon', 'colors'],
      linguistic: ['linguistic.etymology', 'linguistic.cognates', 'linguistic.originalScript'],
      geographical: ['geographical.originPoint', 'geographical.region'],
      temporal: ['temporal.firstAttestation', 'temporal.timelinePosition'],
      relationships: ['relatedEntities', 'crossCulturalParallels'],
      categorization: ['category', 'tags']
    };
  }

  loadAllEntities() {
    const categories = ['concept', 'creature', 'deity', 'item', 'magic', 'place'];

    categories.forEach(category => {
      const categoryPath = path.join('data', 'entities', category);
      if (!fs.existsSync(categoryPath)) return;

      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));

      files.forEach(file => {
        try {
          const entity = JSON.parse(fs.readFileSync(path.join(categoryPath, file), 'utf8'));
          entity._file = path.join(category, file);
          this.entities.push(entity);
          this.stats.total++;
        } catch (error) {
          this.issues.push({
            file: path.join(category, file),
            type: 'parse-error',
            message: error.message
          });
        }
      });
    });

    console.log(`📊 Loaded ${this.stats.total} entities\n`);
  }

  checkField(obj, path) {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) return false;
      current = current[part];
    }

    return current !== undefined && current !== null;
  }

  validateEntity(entity) {
    const missing = [];
    const warnings = [];

    // Check core fields
    this.schema.core.forEach(field => {
      if (!this.checkField(entity, field)) {
        missing.push(field);
        this.trackMissingField(field);
      }
    });

    // Check visual fields
    this.schema.visual.forEach(field => {
      if (!this.checkField(entity, field)) {
        missing.push(field);
        this.trackMissingField(field);
      }
    });

    // Check linguistic metadata
    this.schema.linguistic.forEach(field => {
      if (!this.checkField(entity, field)) {
        missing.push(field);
        this.trackMissingField(field);
      }
    });

    // Check geographical metadata (only for place entities)
    if (entity.type === 'place') {
      this.schema.geographical.forEach(field => {
        if (!this.checkField(entity, field)) {
          missing.push(field);
          this.trackMissingField(field);
        }
      });
    }

    // Check temporal metadata
    this.schema.temporal.forEach(field => {
      if (!this.checkField(entity, field)) {
        missing.push(field);
        this.trackMissingField(field);
      }
    });

    // Check relationships
    this.schema.relationships.forEach(field => {
      if (!this.checkField(entity, field)) {
        warnings.push(field);
      }
    });

    // Additional validation
    if (entity.geographical?.originPoint?.coordinates) {
      const coords = entity.geographical.originPoint.coordinates;
      if (!coords.latitude || !coords.longitude) {
        warnings.push('geographical.coordinates incomplete');
      }
    }

    if (entity.temporal?.firstAttestation?.date) {
      const date = entity.temporal.firstAttestation.date;
      if (!date.year || !date.display) {
        warnings.push('temporal.date incomplete');
      }
    }

    // Check etymology structure
    if (entity.linguistic?.etymology) {
      const etym = entity.linguistic.etymology;
      if (!etym.origin || !etym.meaning) {
        warnings.push('linguistic.etymology incomplete');
      }
    }

    return {
      isComplete: missing.length === 0,
      missing,
      warnings
    };
  }

  trackMissingField(field) {
    if (!this.stats.missingFields[field]) {
      this.stats.missingFields[field] = 0;
    }
    this.stats.missingFields[field]++;
  }

  validateAll() {
    console.log('🔍 Validating entity metadata...\n');

    this.entities.forEach(entity => {
      const result = this.validateEntity(entity);

      if (result.isComplete) {
        this.stats.complete++;
      } else {
        this.stats.incomplete++;
        this.issues.push({
          file: entity._file,
          id: entity.id,
          name: entity.name,
          type: 'incomplete-metadata',
          missing: result.missing,
          warnings: result.warnings
        });
      }
    });
  }

  generateReport() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         METADATA VALIDATION REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    const completionRate = Math.round((this.stats.complete / this.stats.total) * 100);

    console.log(`📊 Overall Statistics:`);
    console.log(`   Total entities: ${this.stats.total}`);
    console.log(`   Complete metadata: ${this.stats.complete} (${completionRate}%)`);
    console.log(`   Incomplete metadata: ${this.stats.incomplete}`);
    console.log();

    // Most common missing fields
    console.log(`📋 Most Common Missing Fields:`);
    console.log('─────────────────────────────────────────────────────────\n');

    const sortedFields = Object.entries(this.stats.missingFields)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    sortedFields.forEach(([field, count]) => {
      const percentage = Math.round((count / this.stats.total) * 100);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`   ${field.padEnd(35)} ${count.toString().padStart(3)} (${percentage}%) ${bar}`);
    });
    console.log();

    // Entities with issues
    if (this.issues.length > 0) {
      const metadataIssues = this.issues.filter(i => i.type === 'incomplete-metadata');

      if (metadataIssues.length > 0) {
        console.log(`⚠️  ENTITIES WITH INCOMPLETE METADATA (${metadataIssues.length})`);
        console.log('─────────────────────────────────────────────────────────\n');

        // Group by mythology
        const byMythology = {};
        metadataIssues.forEach(issue => {
          const entity = this.entities.find(e => e.id === issue.id);
          const myth = entity?.primaryMythology || 'unknown';

          if (!byMythology[myth]) byMythology[myth] = [];
          byMythology[myth].push(issue);
        });

        Object.entries(byMythology).forEach(([mythology, issues]) => {
          console.log(`🏛️  ${mythology.toUpperCase()} (${issues.length} entities):`);

          issues.slice(0, 5).forEach(issue => {
            console.log(`\n   📄 ${issue.name} (${issue.id})`);
            console.log(`      File: ${issue.file}`);
            if (issue.missing.length > 0) {
              console.log(`      Missing: ${issue.missing.slice(0, 5).join(', ')}`);
              if (issue.missing.length > 5) {
                console.log(`               ...and ${issue.missing.length - 5} more`);
              }
            }
          });

          if (issues.length > 5) {
            console.log(`\n   ...and ${issues.length - 5} more entities`);
          }
          console.log();
        });
      }

      // Parse errors
      const parseErrors = this.issues.filter(i => i.type === 'parse-error');
      if (parseErrors.length > 0) {
        console.log(`❌ JSON PARSE ERRORS (${parseErrors.length})`);
        console.log('─────────────────────────────────────────────────────────\n');

        parseErrors.forEach(error => {
          console.log(`   File: ${error.file}`);
          console.log(`   Error: ${error.message}`);
          console.log();
        });
      }
    }

    // Recommendations
    console.log('═══════════════════════════════════════════════════════════');
    console.log('RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (completionRate >= 95) {
      console.log('✅ Excellent metadata coverage! Minor touch-ups needed.');
    } else if (completionRate >= 80) {
      console.log('👍 Good metadata coverage. Focus on filling common gaps.');
    } else if (completionRate >= 60) {
      console.log('⚠️  Moderate coverage. Systematic metadata completion needed.');
    } else {
      console.log('❌ Low metadata coverage. Major metadata work required.');
    }
    console.log();

    if (sortedFields.length > 0) {
      const topMissing = sortedFields[0][0];
      const topCount = sortedFields[0][1];
      console.log(`Priority: Address "${topMissing}" (missing in ${topCount} entities)`);
      console.log();
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      completionRate,
      issues: this.issues,
      topMissingFields: sortedFields,
      recommendations: this.generateRecommendations(completionRate)
    };

    fs.writeFileSync(
      'scripts/reports/metadata-validation.json',
      JSON.stringify(report, null, 2)
    );

    console.log('📝 Detailed report saved to scripts/reports/metadata-validation.json\n');
  }

  generateRecommendations(completionRate) {
    const recs = [];

    if (completionRate < 100) {
      recs.push('Run auto-populate script to fill missing metadata');
    }

    const topMissing = Object.entries(this.stats.missingFields)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topMissing.forEach(([field, count]) => {
      recs.push(`Focus on completing ${field} (${count} entities missing)`);
    });

    return recs;
  }

  run() {
    // Ensure reports directory exists
    if (!fs.existsSync('scripts/reports')) {
      fs.mkdirSync('scripts/reports', { recursive: true });
    }

    this.loadAllEntities();
    this.validateAll();
    this.generateReport();
  }
}

// Run validator
const validator = new MetadataValidator();
validator.run();
