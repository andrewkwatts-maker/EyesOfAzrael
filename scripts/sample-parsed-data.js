const fs = require('fs');
const path = require('path');

const parsedDir = path.join(__dirname, '..', 'parsed_data');

const contentTypes = ['texts', 'symbols', 'concepts', 'events', 'myths'];

console.log('📋 Sampling Parsed Data\n');
console.log('═══════════════════════════════════════════════════\n');

contentTypes.forEach(type => {
  const filePath = path.join(parsedDir, `${type}_parsed.json`);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${type}: File not found`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`📦 ${type.toUpperCase()}`);
  console.log(`   Total Count: ${data.count}`);
  console.log(`   Parsed At: ${data.parsedAt}`);

  // Sample first 2 items
  const sampleCount = Math.min(2, data.items.length);

  for (let i = 0; i < sampleCount; i++) {
    const item = data.items[i];
    console.log(`\n   Sample ${i + 1}:`);
    console.log(`      ID: ${item.id}`);
    console.log(`      Name: ${item.name}`);
    console.log(`      Display: ${item.displayName}`);
    console.log(`      Mythology: ${item.mythology}`);
    console.log(`      Description: ${item.description ? item.description.substring(0, 100) + '...' : '(empty)'}`);
    console.log(`      Source File: ${item.metadata.sourceFile}`);

    // Check for relationships
    if (item.relatedConcepts && item.relatedConcepts.length > 0) {
      console.log(`      Related Concepts: ${item.relatedConcepts.length} items`);
    }
    if (item.relationships && Object.keys(item.relationships).length > 0) {
      console.log(`      Relationships: ${Object.keys(item.relationships).join(', ')}`);
    }
  }

  console.log('\n' + '─'.repeat(55) + '\n');
});

console.log('✅ Sampling complete!\n');
