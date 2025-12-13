const fs = require('fs');
const path = require('path');

const parsedDir = path.join(__dirname, '..', 'parsed_data');

// Quality metrics to track
const qualityMetrics = {
  totalItems: 0,
  itemsWithDescription: 0,
  itemsWithoutDescription: 0,
  itemsWithRelationships: 0,
  itemsWithAttributes: 0,
  itemsWithSources: 0,
  averageDescriptionLength: 0,
  byContentType: {}
};

// Read all parsed files
const files = fs.readdirSync(parsedDir).filter(f => f.endsWith('_parsed.json'));

console.log('📊 Analyzing parsed data quality...\n');

let allDescriptionLengths = [];

files.forEach(file => {
  const filePath = path.join(parsedDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const contentType = data.contentType;

  if (!qualityMetrics.byContentType[contentType]) {
    qualityMetrics.byContentType[contentType] = {
      total: 0,
      withDescription: 0,
      withoutDescription: 0,
      withRelationships: 0,
      withAttributes: 0,
      withSources: 0,
      emptyDescriptions: [],
      avgDescriptionLength: 0
    };
  }

  const metrics = qualityMetrics.byContentType[contentType];

  // Skip if data.items is not defined
  if (!data.items || !Array.isArray(data.items)) {
    console.log(`⚠️  Warning: ${file} has no items array`);
    return;
  }

  data.items.forEach(item => {
    qualityMetrics.totalItems++;
    metrics.total++;

    // Check description
    if (item.description && item.description.trim().length > 0) {
      qualityMetrics.itemsWithDescription++;
      metrics.withDescription++;
      const descLength = item.description.trim().length;
      allDescriptionLengths.push(descLength);
    } else {
      qualityMetrics.itemsWithoutDescription++;
      metrics.withoutDescription++;
      metrics.emptyDescriptions.push(item.id);
    }

    // Check relationships
    const hasRelationships = item.relationships &&
      Object.keys(item.relationships).length > 0 ||
      (item.relatedConcepts && item.relatedConcepts.length > 0);

    if (hasRelationships) {
      qualityMetrics.itemsWithRelationships++;
      metrics.withRelationships++;
    }

    // Check attributes
    if (item.attributes && item.attributes.length > 0) {
      qualityMetrics.itemsWithAttributes++;
      metrics.withAttributes++;
    }

    // Check sources
    if (item.primarySources && item.primarySources.length > 0) {
      qualityMetrics.itemsWithSources++;
      metrics.withSources++;
    }
  });

  // Calculate average description length for this type
  const typeDescLengths = allDescriptionLengths.slice(-metrics.withDescription);
  if (typeDescLengths.length > 0) {
    metrics.avgDescriptionLength = Math.round(
      typeDescLengths.reduce((a, b) => a + b, 0) / typeDescLengths.length
    );
  }
});

// Calculate overall average description length
if (allDescriptionLengths.length > 0) {
  qualityMetrics.averageDescriptionLength = Math.round(
    allDescriptionLengths.reduce((a, b) => a + b, 0) / allDescriptionLengths.length
  );
}

// Display results
console.log('═══════════════════════════════════════════════════');
console.log('                OVERALL METRICS                     ');
console.log('═══════════════════════════════════════════════════');
console.log(`Total Items Parsed: ${qualityMetrics.totalItems}`);
console.log(`Items with Description: ${qualityMetrics.itemsWithDescription} (${Math.round(qualityMetrics.itemsWithDescription/qualityMetrics.totalItems*100)}%)`);
console.log(`Items without Description: ${qualityMetrics.itemsWithoutDescription} (${Math.round(qualityMetrics.itemsWithoutDescription/qualityMetrics.totalItems*100)}%)`);
console.log(`Average Description Length: ${qualityMetrics.averageDescriptionLength} chars`);
console.log(`Items with Relationships: ${qualityMetrics.itemsWithRelationships} (${Math.round(qualityMetrics.itemsWithRelationships/qualityMetrics.totalItems*100)}%)`);
console.log(`Items with Attributes: ${qualityMetrics.itemsWithAttributes} (${Math.round(qualityMetrics.itemsWithAttributes/qualityMetrics.totalItems*100)}%)`);
console.log(`Items with Sources: ${qualityMetrics.itemsWithSources} (${Math.round(qualityMetrics.itemsWithSources/qualityMetrics.totalItems*100)}%)`);

console.log('\n═══════════════════════════════════════════════════');
console.log('            BY CONTENT TYPE                         ');
console.log('═══════════════════════════════════════════════════\n');

Object.entries(qualityMetrics.byContentType).forEach(([type, metrics]) => {
  console.log(`📦 ${type.toUpperCase()}`);
  console.log(`   Total: ${metrics.total}`);
  console.log(`   With Description: ${metrics.withDescription} (${Math.round(metrics.withDescription/metrics.total*100)}%)`);
  console.log(`   Without Description: ${metrics.withoutDescription} (${Math.round(metrics.withoutDescription/metrics.total*100)}%)`);
  console.log(`   Avg Description Length: ${metrics.avgDescriptionLength} chars`);
  console.log(`   With Relationships: ${metrics.withRelationships} (${Math.round(metrics.withRelationships/metrics.total*100)}%)`);
  console.log(`   With Attributes: ${metrics.withAttributes} (${Math.round(metrics.withAttributes/metrics.total*100)}%)`);
  console.log(`   With Sources: ${metrics.withSources} (${Math.round(metrics.withSources/metrics.total*100)}%)`);

  if (metrics.emptyDescriptions.length > 0 && metrics.emptyDescriptions.length <= 10) {
    console.log(`   ⚠️  Empty descriptions: ${metrics.emptyDescriptions.join(', ')}`);
  } else if (metrics.emptyDescriptions.length > 10) {
    console.log(`   ⚠️  ${metrics.emptyDescriptions.length} items with empty descriptions`);
  }
  console.log('');
});

console.log('═══════════════════════════════════════════════════');
console.log('                QUALITY ASSESSMENT                  ');
console.log('═══════════════════════════════════════════════════\n');

// Quality assessment
const descriptionRate = qualityMetrics.itemsWithDescription / qualityMetrics.totalItems;
const relationshipRate = qualityMetrics.itemsWithRelationships / qualityMetrics.totalItems;

if (descriptionRate >= 0.8) {
  console.log('✅ EXCELLENT: 80%+ items have descriptions');
} else if (descriptionRate >= 0.5) {
  console.log('⚠️  GOOD: 50-79% items have descriptions');
} else {
  console.log('❌ NEEDS WORK: Less than 50% items have descriptions');
}

if (relationshipRate >= 0.3) {
  console.log('✅ GOOD: 30%+ items have relationships defined');
} else {
  console.log('⚠️  Low relationship coverage - consider adding more links');
}

if (qualityMetrics.averageDescriptionLength >= 100) {
  console.log('✅ GOOD: Average description length is substantial');
} else if (qualityMetrics.averageDescriptionLength >= 50) {
  console.log('⚠️  FAIR: Descriptions are brief but present');
} else {
  console.log('⚠️  Descriptions are very brief');
}

console.log('\n✅ Quality check complete!\n');
