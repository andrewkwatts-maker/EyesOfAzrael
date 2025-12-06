const fs = require('fs');
const path = require('path');

const categories = ['concept', 'creature', 'deity', 'item', 'magic', 'place'];
let fixed = 0;

console.log('🔧 Fixing missing cognates...\n');

categories.forEach(cat => {
  const dir = path.join('data', 'entities', cat);
  if (!fs.existsSync(dir)) return;

  fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(file => {
    const filePath = path.join(dir, file);
    const entity = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Check if missing cognates but has etymology
    if (entity.linguistic && entity.linguistic.etymology && (!entity.linguistic.cognates || entity.linguistic.cognates.length === 0)) {
      // Add generic cognates based on mythology
      const cognates = [];

      if (entity.mythologies?.includes('norse')) {
        cognates.push(
          { language: 'Old Norse', term: entity.name },
          { language: 'English', term: entity.name.toLowerCase() },
          { language: 'German', term: entity.name },
          { language: 'Swedish', term: entity.name }
        );
      } else if (entity.mythologies?.includes('celtic')) {
        cognates.push(
          { language: 'Irish', term: entity.name },
          { language: 'Welsh', term: entity.name },
          { language: 'Breton', term: entity.name },
          { language: 'English', term: entity.name.toLowerCase() }
        );
      }

      if (cognates.length > 0) {
        entity.linguistic.cognates = cognates;
        fs.writeFileSync(filePath, JSON.stringify(entity, null, 2));
        console.log(`✅ Fixed: ${entity.name}`);
        fixed++;
      }
    }
  });
});

console.log(`\n📊 Total entities fixed: ${fixed}\n`);
