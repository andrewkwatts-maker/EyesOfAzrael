#!/usr/bin/env node

/**
 * Relationship Population Script
 * Analyzes entities and populates influence/relationship data
 */

const fs = require('fs');
const path = require('path');

class RelationshipPopulator {
  constructor() {
    this.entityDir = path.join(__dirname, '..', 'data', 'entities');
    this.entities = [];
    this.relationships = [];
  }

  async init() {
    console.log('📚 Loading all entities...\n');
    await this.loadAllEntities();
    console.log(`Loaded ${this.entities.length} entities\n`);

    console.log('🔍 Analyzing relationships...\n');
    this.analyzeRelationships();

    console.log('\n📊 Relationship Statistics:');
    this.printStatistics();

    console.log('\n💾 Saving relationship data...\n');
    this.saveRelationships();
  }

  loadAllEntities() {
    const categories = fs.readdirSync(this.entityDir).filter(f =>
      fs.statSync(path.join(this.entityDir, f)).isDirectory()
    );

    categories.forEach(category => {
      const categoryPath = path.join(this.entityDir, category);
      const files = fs.readdirSync(categoryPath).filter(f =>
        f.endsWith('.json') && !f.includes('.backup')
      );

      files.forEach(file => {
        try {
          const filePath = path.join(categoryPath, file);
          const entity = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          this.entities.push({
            ...entity,
            category,
            filePath
          });
        } catch (error) {
          console.error(`Error loading ${category}/${file}:`, error.message);
        }
      });
    });
  }

  analyzeRelationships() {
    this.entities.forEach((entity, index) => {
      if (index % 20 === 0) {
        process.stdout.write(`\rAnalyzing entity ${index + 1}/${this.entities.length}...`);
      }

      // Find temporal relationships (entities from similar time periods)
      this.findTemporalRelationships(entity);

      // Find geographical relationships (entities from same region)
      this.findGeographicalRelationships(entity);

      // Find cultural relationships (same mythology)
      this.findCulturalRelationships(entity);

      // Find cross-cultural parallels (similar concepts in different mythologies)
      this.findCrossculturalParallels(entity);

      // Find etymological relationships (shared linguistic roots)
      this.findEtymologicalRelationships(entity);
    });

    console.log('\r' + ' '.repeat(60) + '\r');
  }

  findTemporalRelationships(entity) {
    if (!entity.temporal?.firstAttestation?.date?.year) return;

    const entityYear = entity.temporal.firstAttestation.date.year;

    this.entities.forEach(other => {
      if (entity.id === other.id) return;
      if (!other.temporal?.firstAttestation?.date?.year) return;

      const otherYear = other.temporal.firstAttestation.date.year;
      const yearDiff = Math.abs(entityYear - otherYear);

      // Entities within 100 years and same mythology
      if (yearDiff <= 100 && entity.mythology === other.mythology) {
        this.addRelationship(entity, other, {
          type: 'temporal',
          strength: 'moderate',
          description: `Contemporary entities (within ${yearDiff} years)`,
          mechanism: 'parallel-development'
        });
      }
    });
  }

  findGeographicalRelationships(entity) {
    if (!entity.geographical?.originPoint?.coordinates) return;

    const coords1 = entity.geographical.originPoint.coordinates;

    this.entities.forEach(other => {
      if (entity.id === other.id) return;
      if (!other.geographical?.originPoint?.coordinates) return;

      const coords2 = other.geographical.originPoint.coordinates;
      const distance = this.calculateDistance(
        coords1.latitude, coords1.longitude,
        coords2.latitude, coords2.longitude
      );

      // Within 500km
      if (distance < 500) {
        let strength = 'weak';
        if (distance < 100) strength = 'strong';
        else if (distance < 300) strength = 'moderate';

        this.addRelationship(entity, other, {
          type: 'geographical',
          strength,
          description: `Geographic proximity (~${Math.round(distance)}km apart)`,
          mechanism: 'cultural-diffusion',
          distance_km: Math.round(distance)
        });
      }
    });
  }

  findCulturalRelationships(entity) {
    this.entities.forEach(other => {
      if (entity.id === other.id) return;
      if (entity.mythology !== other.mythology) return;
      if (entity.category !== other.category) return;

      // Same mythology and category = cultural continuity
      this.addRelationship(entity, other, {
        type: 'cultural',
        strength: 'moderate',
        description: `Part of ${entity.mythology} ${entity.category} tradition`,
        mechanism: 'cultural-diffusion'
      });
    });
  }

  findCrossculturalParallels(entity) {
    this.entities.forEach(other => {
      if (entity.id === other.id) return;
      if (entity.mythology === other.mythology) return;
      if (entity.category !== other.category) return;

      // Check for name similarities (potential parallels)
      const nameSimilarity = this.calculateStringSimilarity(
        entity.name.toLowerCase(),
        other.name.toLowerCase()
      );

      if (nameSimilarity > 0.6) {
        this.addRelationship(entity, other, {
          type: 'parallel',
          strength: 'possible',
          description: `Potential parallel concept across mythologies`,
          mechanism: 'parallel-development',
          similarity_score: nameSimilarity
        });
      }

      // Check for role/description similarities
      if (entity.shortDescription && other.shortDescription) {
        const descSimilarity = this.calculateStringSimilarity(
          entity.shortDescription.toLowerCase(),
          other.shortDescription.toLowerCase()
        );

        if (descSimilarity > 0.4) {
          this.addRelationship(entity, other, {
            type: 'parallel',
            strength: 'possible',
            description: `Similar roles or characteristics`,
            mechanism: 'parallel-development',
            similarity_score: descSimilarity
          });
        }
      }
    });
  }

  findEtymologicalRelationships(entity) {
    if (!entity.linguistic?.etymology?.cognates) return;

    entity.linguistic.etymology.cognates.forEach(cognate => {
      // Find entities with matching linguistic roots
      this.entities.forEach(other => {
        if (entity.id === other.id) return;

        if (other.linguistic?.originalName === cognate.word ||
            other.linguistic?.transliteration === cognate.word) {
          this.addRelationship(entity, other, {
            type: 'etymological',
            strength: 'strong',
            description: `Shared linguistic root: ${cognate.word}`,
            mechanism: 'literary'
          });
        }
      });
    });
  }

  addRelationship(from, to, details) {
    // Avoid duplicates
    const exists = this.relationships.some(rel =>
      rel.from === from.id && rel.to === to.id && rel.type === details.type
    );

    if (!exists) {
      this.relationships.push({
        from: from.id,
        fromName: from.name,
        fromMythology: from.mythology,
        to: to.id,
        toName: to.name,
        toMythology: to.mythology,
        ...details
      });
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * Math.PI / 180;
  }

  calculateStringSimilarity(str1, str2) {
    // Simple Levenshtein-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  printStatistics() {
    const byType = {};
    const byStrength = {};

    this.relationships.forEach(rel => {
      byType[rel.type] = (byType[rel.type] || 0) + 1;
      byStrength[rel.strength] = (byStrength[rel.strength] || 0) + 1;
    });

    console.log(`Total Relationships: ${this.relationships.length}`);
    console.log('\nBy Type:');
    Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`  ${type.padEnd(15)} ${count}`);
    });

    console.log('\nBy Strength:');
    Object.entries(byStrength).sort((a, b) => b[1] - a[1]).forEach(([strength, count]) => {
      console.log(`  ${strength.padEnd(15)} ${count}`);
    });
  }

  saveRelationships() {
    // Save to JSON file
    const outputPath = path.join(__dirname, '..', 'data', 'relationships.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.relationships, null, 2));
    console.log(`✅ Saved to ${outputPath}`);

    // Create index by entity
    const byEntity = {};
    this.relationships.forEach(rel => {
      if (!byEntity[rel.from]) byEntity[rel.from] = { outgoing: [], incoming: [] };
      if (!byEntity[rel.to]) byEntity[rel.to] = { outgoing: [], incoming: [] };

      byEntity[rel.from].outgoing.push(rel);
      byEntity[rel.to].incoming.push(rel);
    });

    const indexPath = path.join(__dirname, '..', 'data', 'relationships-by-entity.json');
    fs.writeFileSync(indexPath, JSON.stringify(byEntity, null, 2));
    console.log(`✅ Saved index to ${indexPath}`);

    // Save summary statistics
    const statsPath = path.join(__dirname, '..', 'data', 'relationship-stats.json');
    const stats = {
      total: this.relationships.length,
      totalEntities: this.entities.length,
      entitiesWithRelationships: Object.keys(byEntity).length,
      averageRelationshipsPerEntity: this.relationships.length / this.entities.length,
      generatedAt: new Date().toISOString()
    };
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    console.log(`✅ Saved stats to ${statsPath}`);
  }
}

// Run
if (require.main === module) {
  const populator = new RelationshipPopulator();
  populator.init().catch(console.error);
}

module.exports = { RelationshipPopulator };
