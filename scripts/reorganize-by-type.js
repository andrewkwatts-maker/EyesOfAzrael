const fs = require('fs');
const path = require('path');

const transformedDir = path.join(__dirname, '../transformed_data');
const outputDir = path.join(transformedDir, 'by_type');
const files = fs.readdirSync(transformedDir).filter(f => f.endsWith('_transformed.json'));

// Use singular form for contentType (deity, hero, etc.)
const byContentType = {
  deity: [],
  hero: [],
  creature: [],
  cosmology: [],
  text: [],
  herb: [],
  ritual: [],
  symbol: [],
  concept: [],
  myth: [],
  event: []
};

// Mapping for output file names (plural collection names)
const typeToCollection = {
  deity: 'deities',
  hero: 'heroes',
  creature: 'creatures',
  cosmology: 'cosmology',
  text: 'texts',
  herb: 'herbs',
  ritual: 'rituals',
  symbol: 'symbols',
  concept: 'concepts',
  myth: 'myths',
  event: 'events'
};

let totalDocs = 0;

console.log('Reorganizing transformed data by content type...\n');

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(transformedDir, file), 'utf8'));

  // Handle content-type files (cosmology, texts, etc.)
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach(doc => {
      let type = doc.contentType || doc.type;

      // Normalize plural to singular
      const pluralToSingular = {
        texts: 'text',
        symbols: 'symbol',
        deities: 'deity',
        heroes: 'hero',
        creatures: 'creature',
        herbs: 'herb',
        rituals: 'ritual',
        concepts: 'concept',
        myths: 'myth',
        events: 'event'
      };

      if (pluralToSingular[type]) {
        type = pluralToSingular[type];
      }

      if (byContentType[type]) {
        byContentType[type].push(doc);
        totalDocs++;
      } else {
        console.warn(`Unknown content type: ${type} in file ${file}`);
      }
    });
  }
  // Handle mythology files (has deities array)
  else if (data.deities && Array.isArray(data.deities)) {
    data.deities.forEach(doc => {
      byContentType.deity.push(doc);
      totalDocs++;
    });
  }
});

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write files by content type
Object.keys(byContentType).forEach(type => {
  if (byContentType[type].length > 0) {
    const collectionName = typeToCollection[type] || type;
    const output = {
      contentType: type,
      count: byContentType[type].length,
      items: byContentType[type]
    };

    const outputFile = path.join(outputDir, `${collectionName}_transformed.json`);
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`✓ Created ${collectionName}: ${byContentType[type].length} docs`);
  }
});

console.log(`\n✓ Total documents reorganized: ${totalDocs}`);
console.log(`✓ Output directory: ${outputDir}`);
