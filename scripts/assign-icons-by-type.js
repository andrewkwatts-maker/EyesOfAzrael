const fs = require('fs');
const path = require('path');

// Load icon registry
const ICON_REGISTRY = require('../icons/icon-type-registry.json');
const DATA_DIR = path.join(__dirname, '..', 'data', 'entities');

/**
 * Intelligently assign icons to entities based on their type, category, and metadata
 */
function assignIconsByType() {
  const stats = {
    totalProcessed: 0,
    assigned: 0,
    alreadyHadIcon: 0,
    noMatchFound: 0,
    byCategory: {}
  };

  // Process each category directory
  ['deity', 'creature', 'hero', 'item', 'place', 'concept', 'magic'].forEach(category => {
    const categoryDir = path.join(DATA_DIR, category);

    if (!fs.existsSync(categoryDir)) {
      console.log(`⚠️  Skipping ${category} - directory not found`);
      return;
    }

    if (!stats.byCategory[category]) {
      stats.byCategory[category] = { assigned: 0, skipped: 0, total: 0 };
    }

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.json'));

    files.forEach(file => {
      const filePath = path.join(categoryDir, file);

      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        stats.totalProcessed++;
        stats.byCategory[category].total++;

        // Skip if already has icon
        if (data.icon && data.icon.trim() !== '') {
          stats.alreadyHadIcon++;
          stats.byCategory[category].skipped++;
          return;
        }

        // Try to assign icon based on entity type and metadata
        const assignedIcon = findBestIcon(data, category);

        if (assignedIcon) {
          data.icon = assignedIcon.path;

          // Update display fields
          if (data.gridDisplay) {
            data.gridDisplay.image = assignedIcon.path;
          }
          if (data.listDisplay) {
            data.listDisplay.icon = assignedIcon.path;
          }

          // Add metadata
          if (!data.metadata) data.metadata = {};
          data.metadata.iconAssignedBy = 'auto-assignment-script';
          data.metadata.iconAssignedDate = new Date().toISOString();
          data.metadata.iconType = assignedIcon.type;

          // Save updated file
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

          stats.assigned++;
          stats.byCategory[category].assigned++;

          console.log(`✅ ${file}: ${assignedIcon.type} icon assigned`);
        } else {
          stats.noMatchFound++;
          console.log(`⚠️  ${file}: No suitable icon found`);
        }

      } catch (err) {
        console.error(`❌ Error processing ${filePath}:`, err.message);
      }
    });
  });

  return stats;
}

/**
 * Find the best matching icon for an entity
 */
function findBestIcon(entity, category) {
  const name = (entity.name || '').toLowerCase();
  const type = (entity.type || '').toLowerCase();
  const description = (entity.description || '').toLowerCase();
  const tags = (entity.tags || []).map(t => t.toLowerCase());

  // Check each category in the icon registry
  for (const [iconCategory, categoryData] of Object.entries(ICON_REGISTRY.categories)) {
    for (const [iconType, iconData] of Object.entries(categoryData.icons)) {
      const keywords = iconData.keywords || [];

      // Check if any keyword matches
      const matches = keywords.some(keyword => {
        const kw = keyword.toLowerCase();
        return (
          name.includes(kw) ||
          type.includes(kw) ||
          description.includes(kw) ||
          tags.some(tag => tag.includes(kw))
        );
      });

      if (matches) {
        return {
          path: iconData.path,
          type: iconType,
          category: iconCategory
        };
      }
    }
  }

  // Fallback to category-based assignment
  return getFallbackIcon(category, type);
}

/**
 * Get fallback icon based on entity category
 */
function getFallbackIcon(category, type) {
  const fallbacks = {
    deity: 'icons/deity-icon.svg',
    creature: 'icons/creature-icon.svg',
    hero: 'icons/hero-icon.svg',
    item: 'icons/item-icon.svg',
    place: 'icons/place-icon.svg',
    concept: 'icons/concept-icon.svg',
    magic: 'icons/magic-icon.svg'
  };

  // Try to match more specific icons based on type
  if (category === 'item') {
    if (type.includes('weapon') || type.includes('sword') || type.includes('blade')) {
      return { path: 'icons/items/weapon.svg', type: 'weapon', category: 'items' };
    }
    if (type.includes('artifact') || type.includes('relic')) {
      return { path: 'icons/items/artifact.svg', type: 'artifact', category: 'items' };
    }
    if (type.includes('staff') || type.includes('rod')) {
      return { path: 'icons/items/staff.svg', type: 'staff', category: 'items' };
    }
    if (type.includes('crown') || type.includes('regalia')) {
      return { path: 'icons/items/crown.svg', type: 'crown', category: 'items' };
    }
  }

  if (category === 'creature') {
    if (type.includes('dragon')) {
      return { path: 'icons/creatures/dragon.svg', type: 'dragon', category: 'creatures' };
    }
    if (type.includes('serpent') || type.includes('snake')) {
      return { path: 'icons/creatures/serpent.svg', type: 'serpent', category: 'creatures' };
    }
    if (type.includes('bird')) {
      return { path: 'icons/creatures/bird.svg', type: 'bird', category: 'creatures' };
    }
    if (type.includes('giant')) {
      return { path: 'icons/creatures/giant.svg', type: 'giant', category: 'creatures' };
    }
    if (type.includes('demon') || type.includes('devil')) {
      return { path: 'icons/creatures/demon.svg', type: 'demon', category: 'creatures' };
    }
    if (type.includes('angel')) {
      return { path: 'icons/creatures/angel.svg', type: 'angel', category: 'creatures' };
    }
  }

  if (category === 'hero') {
    if (type.includes('warrior') || type.includes('fighter')) {
      return { path: 'icons/heroes/warrior.svg', type: 'warrior', category: 'heroes' };
    }
    if (type.includes('king') || type.includes('ruler')) {
      return { path: 'icons/heroes/king.svg', type: 'king', category: 'heroes' };
    }
    if (type.includes('prophet') || type.includes('seer')) {
      return { path: 'icons/heroes/prophet.svg', type: 'prophet', category: 'heroes' };
    }
    if (type.includes('sage') || type.includes('wise')) {
      return { path: 'icons/heroes/sage.svg', type: 'sage', category: 'heroes' };
    }
  }

  if (category === 'place') {
    if (type.includes('mountain')) {
      return { path: 'icons/places/mountain.svg', type: 'mountain', category: 'places' };
    }
    if (type.includes('temple') || type.includes('shrine')) {
      return { path: 'icons/places/temple.svg', type: 'temple', category: 'places' };
    }
    if (type.includes('underworld') || type.includes('hell')) {
      return { path: 'icons/places/underworld.svg', type: 'underworld', category: 'places' };
    }
    if (type.includes('realm') || type.includes('heaven')) {
      return { path: 'icons/places/realm.svg', type: 'realm', category: 'places' };
    }
    if (type.includes('river')) {
      return { path: 'icons/places/river.svg', type: 'river', category: 'places' };
    }
    if (type.includes('city')) {
      return { path: 'icons/places/city.svg', type: 'city', category: 'places' };
    }
  }

  // Use generic category fallback
  if (fallbacks[category]) {
    return {
      path: fallbacks[category],
      type: 'generic',
      category: category
    };
  }

  return null;
}

// Run the assignment
console.log('🎨 Starting icon assignment process...\n');
const stats = assignIconsByType();

console.log('\n=== ICON ASSIGNMENT COMPLETE ===\n');
console.log(`Total Entities Processed: ${stats.totalProcessed}`);
console.log(`Icons Assigned: ${stats.assigned}`);
console.log(`Already Had Icons: ${stats.alreadyHadIcon}`);
console.log(`No Match Found: ${stats.noMatchFound}`);
console.log('\nBy Category:');
Object.entries(stats.byCategory).forEach(([cat, data]) => {
  console.log(`  ${cat}: ${data.assigned}/${data.total} assigned`);
});

// Save stats
const reportPath = path.join(__dirname, '..', 'ICON_ASSIGNMENT_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));
console.log(`\n📄 Report saved to: ${reportPath}`);

module.exports = { assignIconsByType, findBestIcon };
