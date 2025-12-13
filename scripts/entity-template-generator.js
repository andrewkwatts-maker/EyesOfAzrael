/**
 * Entity Template Generator
 * Creates standardized entity templates following the v2.0 schema
 *
 * Usage:
 *   node scripts/entity-template-generator.js --type deity --id zeus --mythology greek
 *   node scripts/entity-template-generator.js --interactive
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load schema
const schemaPath = path.join(__dirname, '../data/schemas/entity-schema-v2.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

// Valid entity types
const ENTITY_TYPES = ['deity', 'item', 'place', 'concept', 'magic', 'creature', 'hero', 'archetype'];

// Valid mythologies
const MYTHOLOGIES = [
  'greek', 'norse', 'egyptian', 'hindu', 'buddhist', 'jewish', 'christian', 'islamic',
  'japanese', 'chinese', 'celtic', 'roman', 'mesopotamian', 'persian', 'zoroastrian',
  'aztec', 'babylonian', 'slavic', 'native_american', 'universal'
];

/**
 * Generate a minimal template with required fields only
 */
function generateMinimalTemplate(type, id, mythology) {
  return {
    id: id,
    type: type,
    name: capitalize(id.replace(/-/g, ' ')),
    mythologies: [mythology],
    primaryMythology: mythology,
    shortDescription: '',
    fullDescription: '',
    icon: '',
    tags: [id, mythology],
    colors: {
      primary: '#9370DB',
      secondary: '#DAA520'
    },
    sources: [],
    relatedEntities: {},
    archetypes: [],
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '2.0',
      completeness: 'minimal'
    }
  };
}

/**
 * Generate a complete template with all recommended fields
 */
function generateCompleteTemplate(type, id, mythology) {
  const template = generateMinimalTemplate(type, id, mythology);

  // Add linguistic data
  template.linguistic = {
    originalName: '',
    originalScript: '',
    transliteration: '',
    pronunciation: '',
    alternativeNames: [],
    etymology: {
      rootLanguage: '',
      meaning: '',
      derivation: ''
    },
    languageCode: ''
  };

  // Add geographical data
  template.geographical = {
    primaryLocation: {
      name: '',
      coordinates: {
        latitude: 0,
        longitude: 0,
        accuracy: 'approximate'
      },
      type: 'temple',
      description: '',
      significance: ''
    },
    region: '',
    culturalArea: '',
    modernCountries: []
  };

  // Add temporal data
  template.temporal = {
    mythologicalDate: {
      display: ''
    },
    historicalDate: {
      display: ''
    },
    firstAttestation: {
      date: { year: 0, circa: true },
      source: '',
      type: 'literary',
      confidence: 'probable'
    },
    culturalPeriod: ''
  };

  // Add cultural data
  template.cultural = {
    worshipPractices: [],
    festivals: [],
    socialRole: '',
    demographicAppeal: [],
    modernLegacy: {}
  };

  // Add metaphysical properties
  template.metaphysicalProperties = {
    primaryElement: 'air',
    secondaryElements: [],
    planets: [],
    zodiac: [],
    sefirot: [],
    chakras: [],
    yinYang: 'balanced',
    polarity: 'neutral'
  };

  template.metadata.completeness = 'complete';

  return template;
}

/**
 * Generate a Firebase-optimized template
 */
function generateFirebaseTemplate(type, id, mythology) {
  const template = generateCompleteTemplate(type, id, mythology);

  // Firebase-specific fields
  template.category = type;
  template.mythology = mythology; // Single primary mythology for queries
  template.displayName = template.name;
  template.searchTerms = [id, mythology, template.name.toLowerCase()];
  template.visibility = 'public';
  template.status = 'draft';
  template.contributors = [];

  return template;
}

/**
 * Capitalize first letter of each word
 */
function capitalize(str) {
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Interactive mode
 */
async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  console.log('\n=== Entity Template Generator ===\n');

  // Entity type
  console.log('Available types:', ENTITY_TYPES.join(', '));
  const type = await question('Entity type: ');
  if (!ENTITY_TYPES.includes(type)) {
    console.error('Invalid entity type');
    rl.close();
    return;
  }

  // Entity ID
  const id = await question('Entity ID (kebab-case): ');
  if (!/^[a-z0-9-]+$/.test(id)) {
    console.error('Invalid ID format. Use kebab-case (lowercase with hyphens)');
    rl.close();
    return;
  }

  // Mythology
  console.log('\nAvailable mythologies:', MYTHOLOGIES.join(', '));
  const mythology = await question('Primary mythology: ');
  if (!MYTHOLOGIES.includes(mythology)) {
    console.error('Invalid mythology');
    rl.close();
    return;
  }

  // Template type
  console.log('\nTemplate types:');
  console.log('  1. Minimal (required fields only)');
  console.log('  2. Complete (all recommended fields)');
  console.log('  3. Firebase (optimized for Firestore)');
  const templateType = await question('Choose template type (1/2/3): ');

  let template;
  switch(templateType) {
    case '1':
      template = generateMinimalTemplate(type, id, mythology);
      break;
    case '2':
      template = generateCompleteTemplate(type, id, mythology);
      break;
    case '3':
      template = generateFirebaseTemplate(type, id, mythology);
      break;
    default:
      console.error('Invalid template type');
      rl.close();
      return;
  }

  // Save location
  const outputDir = path.join(__dirname, '../data/entities', type);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));

  console.log(`\n✅ Template created: ${outputPath}`);
  console.log('\nNext steps:');
  console.log('  1. Edit the template and fill in the fields');
  console.log('  2. Validate: node scripts/validate-entity.js ' + outputPath);
  console.log('  3. Upload to Firebase: node scripts/upload-to-firebase.js ' + outputPath);

  rl.close();
}

/**
 * Command-line mode
 */
function commandLineMode() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    params[key] = value;
  }

  const { type, id, mythology, output, template: templateType } = params;

  if (!type || !id || !mythology) {
    console.error('Usage: node entity-template-generator.js --type <type> --id <id> --mythology <mythology> [--template <minimal|complete|firebase>] [--output <path>]');
    console.error('\nOr run in interactive mode: node entity-template-generator.js --interactive');
    process.exit(1);
  }

  if (!ENTITY_TYPES.includes(type)) {
    console.error('Invalid entity type. Must be one of:', ENTITY_TYPES.join(', '));
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/.test(id)) {
    console.error('Invalid ID format. Use kebab-case (lowercase with hyphens)');
    process.exit(1);
  }

  if (!MYTHOLOGIES.includes(mythology)) {
    console.error('Invalid mythology. Must be one of:', MYTHOLOGIES.join(', '));
    process.exit(1);
  }

  let template;
  switch(templateType || 'firebase') {
    case 'minimal':
      template = generateMinimalTemplate(type, id, mythology);
      break;
    case 'complete':
      template = generateCompleteTemplate(type, id, mythology);
      break;
    case 'firebase':
    default:
      template = generateFirebaseTemplate(type, id, mythology);
      break;
  }

  const outputPath = output || path.join(__dirname, '../data/entities', type, `${id}.json`);
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
  console.log('✅ Template created:', outputPath);
}

// Main
if (process.argv.includes('--interactive')) {
  interactiveMode();
} else {
  commandLineMode();
}
