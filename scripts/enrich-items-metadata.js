#!/usr/bin/env node

/**
 * Sacred Items Metadata Enrichment Script
 *
 * This script enriches item entities with rich metadata including:
 * - powers: Magical abilities
 * - wielders: Famous users of the item
 * - origin: How it was created
 * - materials: What it's made of
 * - symbolism: What it represents
 * - currentLocation: Where it resides (if applicable)
 *
 * Usage: node scripts/enrich-items-metadata.js [--dry-run] [--upload]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ITEMS_DIR = path.join(__dirname, '../firebase-assets-downloaded/items');
const OUTPUT_DIR = path.join(__dirname, '../firebase-assets-enriched/items');
const DRY_RUN = process.argv.includes('--dry-run');
const UPLOAD = process.argv.includes('--upload');

// Create output directory if needed
if (!DRY_RUN && !fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Extracts metadata fields from item content
 */
function extractMetadata(item) {
  const metadata = {
    powers: extractPowers(item),
    wielders: extractWielders(item),
    origin: extractOrigin(item),
    materials: item.materials || [],
    symbolism: item.symbolism || '',
    currentLocation: extractCurrentLocation(item)
  };

  return metadata;
}

/**
 * Extract magical powers/abilities from item
 */
function extractPowers(item) {
  const powers = [];

  // Use existing powers field if available
  if (item.powers && Array.isArray(item.powers)) {
    powers.push(...item.powers);
  }

  // Extract from symbolism
  if (item.symbolism) {
    const symbolismLower = item.symbolism.toLowerCase();

    const powerKeywords = [
      { keyword: 'never miss', power: 'Unerring accuracy' },
      { keyword: 'always return', power: 'Self-returning' },
      { keyword: 'immortal', power: 'Immortality' },
      { keyword: 'resurrection', power: 'Resurrection' },
      { keyword: 'heal', power: 'Healing' },
      { keyword: 'protection', power: 'Protection' },
      { keyword: 'invincib', power: 'Invincibility' },
      { keyword: 'indestructib', power: 'Indestructibility' },
      { keyword: 'eternal life', power: 'Eternal life' },
      { keyword: 'bind', power: 'Binding oaths' },
      { keyword: 'fate', power: 'Determination of fate' },
      { keyword: 'transform', power: 'Transformation' },
      { keyword: 'flight', power: 'Flight' },
      { keyword: 'invisib', power: 'Invisibility' },
      { keyword: 'wisdom', power: 'Grant wisdom' },
      { keyword: 'magic', power: 'Magical enhancement' },
      { keyword: 'divine', power: 'Divine power' },
      { keyword: 'curse', power: 'Cursing' },
      { keyword: 'blessing', power: 'Blessing' },
      { keyword: 'multiply', power: 'Multiplication' }
    ];

    for (const { keyword, power } of powerKeywords) {
      if (symbolismLower.includes(keyword) && !powers.includes(power)) {
        powers.push(power);
      }
    }
  }

  // Extract from description
  if (item.description || item.shortDescription) {
    const descText = (item.description || item.shortDescription || '').toLowerCase();

    if (descText.includes('never miss') && !powers.includes('Unerring accuracy')) {
      powers.push('Unerring accuracy');
    }
    if (descText.includes('return') && !powers.includes('Self-returning')) {
      powers.push('Self-returning');
    }
  }

  return [...new Set(powers)]; // Remove duplicates
}

/**
 * Extract wielders/users from item data
 */
function extractWielders(item) {
  const wielders = [];

  // Use existing wielders field
  if (item.wielders && Array.isArray(item.wielders)) {
    wielders.push(...item.wielders);
  }

  // Extract from deity associations
  if (item.mythologyContexts && Array.isArray(item.mythologyContexts)) {
    for (const context of item.mythologyContexts) {
      if (context.associatedDeities && Array.isArray(context.associatedDeities)) {
        for (const deity of context.associatedDeities) {
          const deityName = deity.name || deity.id;
          if (deityName && !wielders.includes(deityName)) {
            wielders.push(deityName);
          }
        }
      }
    }
  }

  // Extract from extended content
  if (item.extendedContent && Array.isArray(item.extendedContent)) {
    for (const section of item.extendedContent) {
      if (section.title && section.title.toLowerCase().includes('wielder')) {
        // This section describes wielders
      }
    }
  }

  return [...new Set(wielders)]; // Remove duplicates
}

/**
 * Extract origin/creation story
 */
function extractOrigin(item) {
  // Check for origin in extended content
  if (item.extendedContent && Array.isArray(item.extendedContent)) {
    for (const section of item.extendedContent) {
      if (section.title && (
        section.title.toLowerCase().includes('creation') ||
        section.title.toLowerCase().includes('origin') ||
        section.title.toLowerCase().includes('craft') ||
        section.title.toLowerCase().includes('made') ||
        section.title.toLowerCase().includes('forged') ||
        section.title.toLowerCase().includes('forging')
      )) {
        return section.content || '';
      }
    }
  }

  // Check for creation/crafting info in interpretation
  if (item.interpretations && Array.isArray(item.interpretations)) {
    for (const interp of item.interpretations) {
      if (interp.tradition && (
        interp.tradition.toLowerCase().includes('creation') ||
        interp.tradition.toLowerCase().includes('origin')
      )) {
        return interp.description || '';
      }
    }
  }

  return '';
}

/**
 * Extract current location/resting place
 */
function extractCurrentLocation(item) {
  // Check for location in extended content
  if (item.extendedContent && Array.isArray(item.extendedContent)) {
    for (const section of item.extendedContent) {
      if (section.title && (
        section.title.toLowerCase().includes('location') ||
        section.title.toLowerCase().includes('resting') ||
        section.title.toLowerCase().includes('current') ||
        section.title.toLowerCase().includes('kept') ||
        section.title.toLowerCase().includes('housed') ||
        section.title.toLowerCase().includes('resides')
      )) {
        return section.content || '';
      }
    }
  }

  // Check symbolism/usage sections
  if (item.symbolism && item.symbolism.includes('kept')) {
    const locationMatch = item.symbolism.match(/kept (?:in|at|inside|within|on|at)\s+([^.]+)/i);
    if (locationMatch) {
      return locationMatch[1].trim();
    }
  }

  return '';
}

/**
 * Enrich a single item with metadata
 */
function enrichItem(item) {
  const enriched = { ...item };
  const metadata = extractMetadata(item);

  // Add or update metadata fields
  if (!enriched.powers || enriched.powers.length === 0) {
    enriched.powers = metadata.powers;
  }

  if (!enriched.wielders || enriched.wielders.length === 0) {
    enriched.wielders = metadata.wielders;
  }

  if (!enriched.origin || enriched.origin.trim() === '') {
    enriched.origin = metadata.origin;
  }

  if (!enriched.materials || enriched.materials.length === 0) {
    enriched.materials = metadata.materials;
  }

  if (!enriched.symbolism || enriched.symbolism.trim() === '') {
    enriched.symbolism = metadata.symbolism;
  }

  if (!enriched.currentLocation || enriched.currentLocation.trim() === '') {
    enriched.currentLocation = metadata.currentLocation;
  }

  // Add enrichment metadata
  enriched._metadata_enriched = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    fields: {
      powers: enriched.powers ? enriched.powers.length > 0 : false,
      wielders: enriched.wielders ? enriched.wielders.length > 0 : false,
      origin: enriched.origin ? enriched.origin.length > 0 : false,
      materials: enriched.materials ? enriched.materials.length > 0 : false,
      symbolism: enriched.symbolism ? enriched.symbolism.length > 0 : false,
      currentLocation: enriched.currentLocation ? enriched.currentLocation.length > 0 : false
    }
  };

  return enriched;
}

/**
 * Process all items
 */
function processAllItems() {
  console.log(`\nEnriching Sacred Items Metadata`);
  console.log(`================================`);
  console.log(`Items directory: ${ITEMS_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Upload: ${UPLOAD}\n`);

  const files = fs.readdirSync(ITEMS_DIR)
    .filter(f => f.endsWith('.json') && f !== '_all.json')
    .sort();

  console.log(`Found ${files.length} items to enrich\n`);

  let enrichedCount = 0;
  let powersCount = 0;
  let wieldersCount = 0;
  let originCount = 0;
  let materialsCount = 0;
  let symbolismCount = 0;
  let locationCount = 0;

  const results = [];

  for (const file of files) {
    const filePath = path.join(ITEMS_DIR, file);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const item = JSON.parse(content);
      const enriched = enrichItem(item);

      enrichedCount++;
      if (enriched.powers && enriched.powers.length > 0) powersCount++;
      if (enriched.wielders && enriched.wielders.length > 0) wieldersCount++;
      if (enriched.origin && enriched.origin.length > 0) originCount++;
      if (enriched.materials && enriched.materials.length > 0) materialsCount++;
      if (enriched.symbolism && enriched.symbolism.length > 0) symbolismCount++;
      if (enriched.currentLocation && enriched.currentLocation.length > 0) locationCount++;

      // Save enriched item
      if (!DRY_RUN) {
        const outputPath = path.join(OUTPUT_DIR, file);
        fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2), 'utf-8');
      }

      results.push({
        id: item.id,
        name: item.name || item.id,
        powers: enriched.powers ? enriched.powers.length : 0,
        wielders: enriched.wielders ? enriched.wielders.length : 0,
        origin: enriched.origin ? enriched.origin.length > 0 : false,
        materials: enriched.materials ? enriched.materials.length : 0,
        symbolism: enriched.symbolism ? enriched.symbolism.length > 0 : false,
        location: enriched.currentLocation ? enriched.currentLocation.length > 0 : false
      });

      // Print progress
      if (enrichedCount % 20 === 0) {
        console.log(`  Processed ${enrichedCount}/${files.length} items...`);
      }

    } catch (error) {
      console.error(`  Error processing ${file}: ${error.message}`);
    }
  }

  // Summary
  console.log(`\n\nEnrichment Summary`);
  console.log(`=================`);
  console.log(`Total items processed: ${enrichedCount}`);
  console.log(`Items with powers: ${powersCount} (${(powersCount/enrichedCount*100).toFixed(1)}%)`);
  console.log(`Items with wielders: ${wieldersCount} (${(wieldersCount/enrichedCount*100).toFixed(1)}%)`);
  console.log(`Items with origin: ${originCount} (${(originCount/enrichedCount*100).toFixed(1)}%)`);
  console.log(`Items with materials: ${materialsCount} (${(materialsCount/enrichedCount*100).toFixed(1)}%)`);
  console.log(`Items with symbolism: ${symbolismCount} (${(symbolismCount/enrichedCount*100).toFixed(1)}%)`);
  console.log(`Items with location: ${locationCount} (${(locationCount/enrichedCount*100).toFixed(1)}%)\n`);

  // Show sample results
  console.log(`\nSample Results (first 10 items)`);
  console.log(`==============================`);
  console.log(`${results.slice(0, 10).map(r =>
    `${r.name}:\n  Powers: ${r.powers}, Wielders: ${r.wielders}, Origin: ${r.origin}, Materials: ${r.materials}, Symbolism: ${r.symbolism}, Location: ${r.location}\n`
  ).join('')}`);

  if (DRY_RUN) {
    console.log(`\nDry run complete. No files were modified.`);
    console.log(`Remove --dry-run flag to save enriched items.`);
  } else {
    console.log(`\nEnriched items saved to: ${OUTPUT_DIR}`);
  }

  if (UPLOAD) {
    console.log(`\nFirebase upload instructions:`);
    console.log(`1. Backup current Firestore data`);
    console.log(`2. Run: firebase emulator:start`);
    console.log(`3. Run: node scripts/upload-items-to-firebase.js`);
  }

  return results;
}

// Run the enrichment
try {
  processAllItems();
} catch (error) {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
}
