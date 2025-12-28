#!/usr/bin/env node

/**
 * Assign Domain-Based SVG Icons to Deities
 *
 * This script assigns SVG icons to deities based on their primary domain.
 * Priority order: war > death > love > wisdom > trickster > sky > sea > sun > moon > earth > fire > healing > fertility > justice > creator
 */

const fs = require('fs');
const path = require('path');

// Domain to icon mapping (from deity-domain-icons.json)
const DOMAIN_ICON_MAP = {
  // War domain (highest priority)
  'war': 'icons/deity-domains/war.svg',
  'battle': 'icons/deity-domains/war.svg',
  'combat': 'icons/deity-domains/war.svg',
  'warrior': 'icons/deity-domains/war.svg',

  // Death domain
  'death': 'icons/deity-domains/death.svg',
  'underworld': 'icons/deity-domains/death.svg',
  'afterlife': 'icons/deity-domains/death.svg',
  'necromancy': 'icons/deity-domains/death.svg',

  // Love domain
  'love': 'icons/deity-domains/love.svg',
  'beauty': 'icons/deity-domains/love.svg',
  'desire': 'icons/deity-domains/love.svg',
  'romance': 'icons/deity-domains/love.svg',

  // Wisdom domain
  'wisdom': 'icons/deity-domains/wisdom.svg',
  'knowledge': 'icons/deity-domains/wisdom.svg',
  'learning': 'icons/deity-domains/wisdom.svg',
  'intelligence': 'icons/deity-domains/wisdom.svg',

  // Trickster domain
  'trickster': 'icons/deity-domains/trickster.svg',
  'mischief': 'icons/deity-domains/trickster.svg',
  'chaos': 'icons/deity-domains/trickster.svg',
  'cunning': 'icons/deity-domains/trickster.svg',

  // Sky domain
  'sky': 'icons/deity-domains/sky.svg',
  'thunder': 'icons/deity-domains/sky.svg',
  'lightning': 'icons/deity-domains/sky.svg',
  'storm': 'icons/deity-domains/sky.svg',
  'weather': 'icons/deity-domains/sky.svg',

  // Sea domain
  'sea': 'icons/deity-domains/sea.svg',
  'water': 'icons/deity-domains/sea.svg',
  'ocean': 'icons/deity-domains/sea.svg',
  'rivers': 'icons/deity-domains/sea.svg',

  // Sun domain
  'sun': 'icons/deity-domains/sun.svg',
  'solar': 'icons/deity-domains/sun.svg',
  'light': 'icons/deity-domains/sun.svg',
  'day': 'icons/deity-domains/sun.svg',

  // Moon domain
  'moon': 'icons/deity-domains/moon.svg',
  'lunar': 'icons/deity-domains/moon.svg',
  'night': 'icons/deity-domains/moon.svg',

  // Earth domain
  'earth': 'icons/deity-domains/earth.svg',
  'nature': 'icons/deity-domains/earth.svg',
  'agriculture': 'icons/deity-domains/earth.svg',
  'harvest': 'icons/deity-domains/earth.svg',
  'mountains': 'icons/deity-domains/earth.svg',

  // Fire domain
  'fire': 'icons/deity-domains/fire.svg',
  'forge': 'icons/deity-domains/fire.svg',
  'smithing': 'icons/deity-domains/fire.svg',
  'crafts': 'icons/deity-domains/fire.svg',

  // Healing domain
  'healing': 'icons/deity-domains/healing.svg',
  'medicine': 'icons/deity-domains/healing.svg',
  'health': 'icons/deity-domains/healing.svg',
  'plague': 'icons/deity-domains/healing.svg',

  // Fertility domain
  'fertility': 'icons/deity-domains/fertility.svg',
  'abundance': 'icons/deity-domains/fertility.svg',
  'growth': 'icons/deity-domains/fertility.svg',
  'prosperity': 'icons/deity-domains/fertility.svg',

  // Justice domain
  'justice': 'icons/deity-domains/justice.svg',
  'law': 'icons/deity-domains/justice.svg',
  'order': 'icons/deity-domains/justice.svg',
  'judgment': 'icons/deity-domains/justice.svg',
  'truth': 'icons/deity-domains/justice.svg',

  // Creator domain (lowest priority)
  'creator': 'icons/deity-domains/creator.svg',
  'creation': 'icons/deity-domains/creator.svg',
  'primordial': 'icons/deity-domains/creator.svg',
  'origin': 'icons/deity-domains/creator.svg'
};

// Priority order for domain matching
const DOMAIN_PRIORITY = [
  'war', 'battle', 'combat', 'warrior',
  'death', 'underworld', 'afterlife', 'necromancy',
  'love', 'beauty', 'desire', 'romance',
  'wisdom', 'knowledge', 'learning', 'intelligence',
  'trickster', 'mischief', 'chaos', 'cunning',
  'sky', 'thunder', 'lightning', 'storm', 'weather',
  'sea', 'water', 'ocean', 'rivers',
  'sun', 'solar', 'light', 'day',
  'moon', 'lunar', 'night',
  'earth', 'nature', 'agriculture', 'harvest', 'mountains',
  'fire', 'forge', 'smithing', 'crafts',
  'healing', 'medicine', 'health', 'plague',
  'fertility', 'abundance', 'growth', 'prosperity',
  'justice', 'law', 'order', 'judgment', 'truth',
  'creator', 'creation', 'primordial', 'origin'
];

const GENERIC_DEITY_ICON = 'icons/deities/generic-deity.svg';

/**
 * Find all deity JSON files
 */
function findDeityFiles(baseDir) {
  const deityFiles = [];

  function traverse(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.json') && !item.includes('agent') && !item.includes('summary')) {
        deityFiles.push(fullPath);
      }
    }
  }

  traverse(baseDir);
  return deityFiles;
}

/**
 * Get icon path based on deity domains
 */
function getIconForDomains(domains) {
  if (!domains || !Array.isArray(domains) || domains.length === 0) {
    return null; // No domains, use generic
  }

  // Normalize domains to lowercase for matching
  const normalizedDomains = domains.map(d =>
    typeof d === 'string' ? d.toLowerCase().trim() : ''
  ).filter(d => d);

  // Find the highest priority domain
  for (const priorityDomain of DOMAIN_PRIORITY) {
    if (normalizedDomains.includes(priorityDomain)) {
      return DOMAIN_ICON_MAP[priorityDomain];
    }
  }

  return null; // No matching domain
}

/**
 * Check if deity needs an icon assignment
 */
function needsIconAssignment(deity) {
  // Check if icon is missing or is an emoji
  if (!deity.icon) return true;
  if (typeof deity.icon === 'string' && deity.icon.match(/[\u{1F300}-\u{1F9FF}]/u)) return true;
  if (deity.icon.endsWith('.svg')) return false; // Already has SVG icon

  return true; // Needs assignment
}

/**
 * Update deity with icon
 */
function updateDeityIcon(filePath, iconPath) {
  const deity = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Update icon
  deity.icon = iconPath;

  // Update gridDisplay if present
  if (deity.gridDisplay) {
    deity.gridDisplay.image = iconPath;
  }

  // Update listDisplay if present
  if (deity.listDisplay) {
    deity.listDisplay.icon = iconPath;
  }

  // Update metadata
  if (!deity.metadata) deity.metadata = {};
  deity.metadata.iconAssignedBy = 'domain_icon_system';
  deity.metadata.iconAssignedAt = new Date().toISOString();

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(deity, null, 2), 'utf8');

  return deity;
}

/**
 * Main execution
 */
function main() {
  const baseDir = path.join(__dirname, '..', 'firebase-assets-enhanced', 'deities');

  console.log('🎨 Deity Domain Icon Assignment System');
  console.log('=====================================\n');

  // Find all deity files
  const deityFiles = findDeityFiles(baseDir);
  console.log(`📊 Found ${deityFiles.length} deity files\n`);

  // Statistics
  const stats = {
    total: 0,
    hadIcon: 0,
    needsIcon: 0,
    assigned: 0,
    noDomainsFound: 0,
    skipped: 0,
    domainDistribution: {}
  };

  // Process each deity
  for (const filePath of deityFiles) {
    try {
      const deity = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      stats.total++;

      // Check if needs icon
      if (!needsIconAssignment(deity)) {
        stats.hadIcon++;
        continue;
      }

      stats.needsIcon++;

      // Get domains
      const domains = deity.domains || deity.rawMetadata?.domains || [];

      // Find appropriate icon
      const iconPath = getIconForDomains(domains);

      if (iconPath) {
        // Assign icon
        updateDeityIcon(filePath, iconPath);
        stats.assigned++;

        // Track domain distribution
        const normalizedDomains = domains.map(d =>
          typeof d === 'string' ? d.toLowerCase().trim() : ''
        );

        for (const priorityDomain of DOMAIN_PRIORITY) {
          if (normalizedDomains.includes(priorityDomain)) {
            const iconName = path.basename(DOMAIN_ICON_MAP[priorityDomain], '.svg');
            stats.domainDistribution[iconName] = (stats.domainDistribution[iconName] || 0) + 1;
            break; // Only count highest priority
          }
        }

        console.log(`✓ ${deity.name || deity.id}: ${iconPath}`);
      } else {
        // No matching domain, use generic
        updateDeityIcon(filePath, GENERIC_DEITY_ICON);
        stats.noDomainsFound++;
        stats.assigned++;
        stats.domainDistribution['generic-deity'] = (stats.domainDistribution['generic-deity'] || 0) + 1;
        console.log(`○ ${deity.name || deity.id}: ${GENERIC_DEITY_ICON} (no matching domain)`);
      }

    } catch (error) {
      console.error(`✗ Error processing ${filePath}:`, error.message);
      stats.skipped++;
    }
  }

  // Print summary
  console.log('\n=====================================');
  console.log('📊 Summary Statistics');
  console.log('=====================================\n');
  console.log(`Total deities processed: ${stats.total}`);
  console.log(`Already had SVG icons: ${stats.hadIcon}`);
  console.log(`Needed icon assignment: ${stats.needsIcon}`);
  console.log(`Successfully assigned: ${stats.assigned}`);
  console.log(`No matching domains: ${stats.noDomainsFound}`);
  console.log(`Skipped (errors): ${stats.skipped}`);

  const finalCoverage = ((stats.hadIcon + stats.assigned) / stats.total * 100).toFixed(1);
  const initialCoverage = (stats.hadIcon / stats.total * 100).toFixed(1);

  console.log(`\n📈 Icon Coverage:`);
  console.log(`  Before: ${initialCoverage}% (${stats.hadIcon}/${stats.total})`);
  console.log(`  After:  ${finalCoverage}% (${stats.hadIcon + stats.assigned}/${stats.total})`);
  console.log(`  Improvement: +${(finalCoverage - initialCoverage).toFixed(1)}%`);

  console.log(`\n🎨 Domain Distribution:`);
  const sortedDomains = Object.entries(stats.domainDistribution)
    .sort((a, b) => b[1] - a[1]);

  for (const [domain, count] of sortedDomains) {
    const percentage = (count / stats.assigned * 100).toFixed(1);
    console.log(`  ${domain}: ${count} (${percentage}%)`);
  }

  console.log('\n✓ Icon assignment complete!\n');

  // Return stats for reporting
  return stats;
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main, getIconForDomains, DOMAIN_ICON_MAP, DOMAIN_PRIORITY };
