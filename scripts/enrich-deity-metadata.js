#!/usr/bin/env node

/**
 * Deity Metadata Enrichment Script
 * Enriches deity entities in Firebase with comprehensive metadata
 *
 * This script extracts and augments metadata for Greek, Norse, and Egyptian deities,
 * ensuring all entities have properly populated:
 * - symbolism: Array of symbolic meanings
 * - domains: Array of areas of power/influence
 * - aliases: Alternative names
 * - festivals: Associated celebrations
 * - epithets: Titles and descriptive names
 * - attributes: Physical or characteristic descriptions
 */

const fs = require('fs');
const path = require('path');

// Deity metadata enrichment data
const deityMetadataMap = {
  // GREEK DEITIES
  'zeus': {
    symbolism: ['divine authority', 'sovereignty', 'justice', 'storm', 'eagle', 'thunderbolt', 'oak tree', 'power'],
    domains: ['Sky', 'Thunder', 'Lightning', 'Law', 'Order', 'Justice', 'Kingship', 'Oaths', 'Sky Father', 'Cloud Gatherer', 'Thunderer'],
    aliases: ['Jupiter (Roman)', 'Dias (Classical)', 'Theos Patrios'],
    festivals: ['Olympic Games (every 4 years, 776 BCE onwards)', 'Diasia (Athenian, early spring)', 'Anthesteria (February, Athenian)'],
    epithets: ['Sky Father', 'Cloud Gatherer', 'Thunderer', 'Aegis-Bearer', 'King of Gods'],
    attributes: ['bearded masculine figure', 'robed in light', 'carries thunderbolt', 'crowned with oak leaves', 'all-seeing', 'supreme authority'],
    iconography: 'Thunderbolt, Eagle, Oak tree, Bull',
    sacred_sites: ['Mount Olympus', 'Dodona (oracle)', 'Olympia (temple)', 'Delphi']
  },
  'aphrodite': {
    symbolism: ['love', 'beauty', 'desire', 'pleasure', 'procreation', 'charm', 'grace', 'passion'],
    domains: ['Love', 'Beauty', 'Desire', 'Sexuality', 'Pleasure', 'Procreation', 'Laughter', 'Grace'],
    aliases: ['Venus (Roman)', 'Ourania', 'Pandemos'],
    festivals: ['Anthesteria (February)', 'Aphrodisia (summer)', 'Ambarvalia (Roman equivalent)'],
    epithets: ['Foam-Born', 'Cyprian', 'Cytherea', 'Laughter-Loving', 'Golden Aphrodite'],
    attributes: ['supremely beautiful', 'enchanting', 'seductive', 'graceful', 'eternally youthful', 'radiant'],
    iconography: 'Dove, Rose, Myrtle, Mirror, Scallop shell',
    sacred_sites: ['Paphos (Cyprus)', 'Cythera', 'Corinth']
  },
  'athena': {
    symbolism: ['wisdom', 'strategy', 'warfare', 'crafts', 'justice', 'protection', 'intellect'],
    domains: ['Wisdom', 'Strategic Warfare', 'Crafts', 'Justice', 'Protector of Cities', 'Patron of Athens'],
    aliases: ['Minerva (Roman)', 'Pallas Athena', 'Glaucopis (Grey-eyed)'],
    festivals: ['Panathenaea (July, annual)', 'Plynteria (May)', 'Arrephoria (summer)'],
    epithets: ['Grey-Eyed', 'Owl-Eyed', 'Wise', 'Protector', 'Virgin Goddess'],
    attributes: ['grey-eyed', 'golden-haired', 'strong-armed', 'warrior maiden', 'wise counselor'],
    iconography: 'Owl, Olive tree, Aegis (shield), Spear, Helmet',
    sacred_sites: ['Parthenon (Athens)', 'Delphi', 'Sparta', 'Olympia']
  },
  'hades': {
    symbolism: ['death', 'underworld', 'wealth', 'finality', 'inevitability', 'darkness', 'the unknown'],
    domains: ['Underworld', 'Death', 'Wealth', 'Fertility of Earth', 'Judgment of Dead', 'Hidden Things'],
    aliases: ['Pluto (Roman)', 'Pluton', 'Aidoneus', 'Dis Pater'],
    festivals: ['Anthesteria (February, festival of the dead)', 'Chonia (autumn, secret rites)'],
    epithets: ['Lord of the Underworld', 'The Invisible One', 'Rich One', 'The Hospitable Host'],
    attributes: ['unseen', 'stern', 'just', 'impartial', 'dark-robed', 'crowned'],
    iconography: 'Helm of Invisibility, Cypress, Narcissus, Serpent, Black Ram',
    sacred_sites: ['Necropolis sites', 'Acheron (river)', 'Lake Avernus', 'Necromanteion']
  },
  'apollo': {
    symbolism: ['sun', 'light', 'music', 'poetry', 'prophecy', 'healing', 'order', 'harmony'],
    domains: ['Sun', 'Light', 'Music', 'Poetry', 'Prophecy', 'Healing', 'Archery', 'Youth', 'Law and Order'],
    aliases: ['Phoebus Apollo', 'Helios (sun god)', 'Hyperion'],
    festivals: ['Carneia (Sparta)', 'Pythia (Delphi, every 4 years)', 'Thargelia (May)', 'Delia (Delos)'],
    epithets: ['Phoebus (Bright)', 'Lykaios (Wolf God)', 'Karneios', 'Pythios (Pythian)'],
    attributes: ['young', 'eternally beardless', 'golden', 'radiant', 'beautiful', 'perfect proportions'],
    iconography: 'Lyre, Bow, Arrow, Laurel wreath, Sun chariot',
    sacred_sites: ['Delphi (oracle)', 'Mount Parnassus', 'Delos (birthplace)', 'Corinth']
  },

  // NORSE DEITIES
  'odin': {
    symbolism: ['wisdom', 'knowledge', 'war', 'death', 'poetry', 'magic', 'runes', 'prophecy'],
    domains: ['Wisdom', 'War', 'Death', 'Poetry', 'Magic', 'Runes', 'Prophecy', 'Knowledge', 'Battle Strategy'],
    aliases: ['Óðinn', 'Wodan (Germanic)', 'Wotan'],
    festivals: ['Blóts (sacrificial feasts)', 'Yule (winter solstice)', 'Midsummer'],
    epithets: ['Allfather', 'Valfather', 'Grimnir (Masked One)', 'Gangleri (Wanderer)', 'High One'],
    attributes: ['one-eyed', 'long-bearded', 'grey-robed', 'wise', 'mysterious', 'wandering'],
    iconography: 'Spear Gungnir, Valknut, Huginn/Muninn (ravens), Sleipnir (8-legged horse)',
    sacred_sites: ['Asgard', 'Valhalla', 'Yggdrasil (World Tree)', 'Mimir\'s Well']
  },
  'thor': {
    symbolism: ['thunder', 'lightning', 'storms', 'strength', 'protection', 'fertility', 'honor'],
    domains: ['Thunder', 'Lightning', 'Storms', 'Strength', 'Protection', 'Fertility (rain)', 'Midgard', 'Agriculture'],
    aliases: ['Þórr', 'Donar (Germanic)', 'Thunor (Anglo-Saxon)'],
    festivals: ['Blóts (especially during storms)', 'Yule', 'Midsummer', 'harvest celebrations'],
    epithets: ['Thunder God', 'Defender of Midgard', 'Slayer of Giants', 'Charioteer', 'Vingthor (Hallower)'],
    attributes: ['red-bearded', 'powerfully built', 'muscular', 'strong-jawed', 'hot-tempered', 'noble-hearted'],
    iconography: 'Hammer Mjolnir, Goats Tanngrisnir/Tanngnjóstr, Lightning bolt, Oak tree',
    sacred_sites: ['Asgard', 'Midgard (realm of humans)', 'Jotunheim (giants\' realm)', 'Bilskirnir (hall)']
  },
  'freyja': {
    symbolism: ['love', 'beauty', 'fertility', 'abundance', 'war (valkyries)', 'sensuality', 'wealth'],
    domains: ['Love', 'Beauty', 'Fertility', 'Abundance', 'War', 'Death', 'Magic', 'Wealth'],
    aliases: ['Freyja', 'Freya (Old English)'],
    festivals: ['Yule', 'Midsummer', 'fertility rites'],
    epithets: ['Lady of the Vanir', 'Brisingamen Wearer', 'Gold Goddess'],
    attributes: ['beautiful', 'golden-haired', 'graceful', 'sensual', 'warrior maiden', 'passionate'],
    iconography: 'Brisingamen (necklace), Falcon cloak, Boar, Gold',
    sacred_sites: ['Folkvangr (her hall)', 'Asgard', 'Vanaheim']
  },
  'loki': {
    symbolism: ['chaos', 'trickery', 'fire', 'cunning', 'mischief', 'change', 'boundary-crossing'],
    domains: ['Chaos', 'Trickery', 'Fire', 'Cunning', 'Mischief', 'Shapeshifting', 'Deception'],
    aliases: ['Logi (fire)', 'Lie (Norse mythology)'],
    festivals: ['Ragnarok-related rituals (apocalyptic)'],
    epithets: ['Sky Traveler', 'Trickster', 'Shape-Shifter', 'Lie-Smith'],
    attributes: ['constantly changing', 'handsome but treacherous', 'clever', 'quick-witted', 'untrustworthy'],
    iconography: 'Fire, Serpents, Chains (Gleipnir), Salmon form',
    sacred_sites: ['Jotunheim (giants\' realm)', 'boundaries between worlds']
  },

  // EGYPTIAN DEITIES
  'osiris': {
    symbolism: ['resurrection', 'afterlife', 'agriculture', 'kingship', 'judgment', 'fertility', 'eternity'],
    domains: ['Underworld', 'Death', 'Afterlife', 'Resurrection', 'Rebirth', 'Agriculture', 'Fertility', 'Judgment of Dead', 'Kingship'],
    aliases: ['Asar', 'Wesir', 'Ausar'],
    festivals: ['Khoiak Festival (November-December)', 'Festival of the Valley (April-May)', 'Sed Festival (jubilee)'],
    epithets: ['Lord of the Dead', 'King of the Underworld', 'Lord of Eternity', 'Foremost of the Westerners', 'Lord of Abydos'],
    attributes: ['mummified', 'bearded', 'wears atef crown', 'green-skinned (vegetation god)', 'serene', 'just'],
    iconography: 'Crook and Flail, Atef crown, Djed pillar, Grain/Wheat',
    sacred_sites: ['Abydos (primary cult center)', 'Busiris', 'Philae', 'Memphis', 'Duat (underworld)']
  },
  'isis': {
    symbolism: ['magic', 'motherhood', 'healing', 'protection', 'resurrection', 'throne', 'wisdom'],
    domains: ['Magic (heka)', 'Motherhood', 'Healing', 'Protection', 'Wisdom', 'Throne/Kingship', 'Resurrection', 'Marriage', 'Navigation'],
    aliases: ['Aset', 'Iset', 'Eset'],
    festivals: ['Isia (October 28-November 3)', 'Navigium Isidis (March 5)', 'Lychnapsia (August 12)'],
    epithets: ['Queen of Heaven', 'Great of Magic', 'Mother of the Gods', 'The Divine Mother', 'Lady of Ten Thousand Names'],
    attributes: ['beautiful', 'compassionate', 'powerful magician', 'devoted mother', 'wise', 'protective'],
    iconography: 'Throne headdress, Tyet knot, Wings, Sistrum, Solar disk with horns',
    sacred_sites: ['Philae (primary temple)', 'Behbeit el-Hagar', 'Giza', 'Dendera', 'Mediterranean temples']
  },
  'ra': {
    symbolism: ['sun', 'light', 'creation', 'order', 'power', 'royalty', 'daily renewal'],
    domains: ['Sun', 'Light', 'Creation', 'Order (Ma\'at)', 'Power', 'Royalty', 'Day and Rebirth', 'Justice'],
    aliases: ['Re', 'Aten (Akhenaten period)', 'Amun-Ra (syncretic form)'],
    festivals: ['Daily worship (sunrise and sunset)', 'Opet Festival', 'Wag Festival'],
    epithets: ['King of Gods', 'Eye of Ra', 'Lord of the Two Lands', 'Creator God', 'Khepri (scarab, morning)', 'Horakhty (Horus of the Horizon)'],
    attributes: ['golden', 'radiant', 'falcon-headed', 'powerful', 'all-seeing', 'eternally young'],
    iconography: 'Solar disk, Falcon head, Eye of Ra (Wedjat eye), Scarab beetle',
    sacred_sites: ['Heliopolis (On)', 'Abydos', 'Karnak', 'Dendera', 'Solar barque (sacred boat)']
  },
  'thoth': {
    symbolism: ['wisdom', 'writing', 'magic', 'knowledge', 'time', 'measurement', 'divine wisdom'],
    domains: ['Wisdom', 'Writing', 'Magic', 'Knowledge', 'Measurement', 'Time', 'Divine Words', 'Scribes', 'Learning'],
    aliases: ['Djehuti', 'Djehuty'],
    festivals: ['Unut Festival', 'Month of Thoth (first month, new year)'],
    epithets: ['Lord of the Divine Words', 'Twice Great (Hermes Trismegistus)', 'Keeper of the Divine Books', 'Heart of Ra'],
    attributes: ['ibis-headed or baboon-headed', 'wise', 'scribe-like', 'precise', 'mysterious', 'magical'],
    iconography: 'Ibis bird, Baboon, Stylus and palette (scribe tools), Crescent moon',
    sacred_sites: ['Hermopolis (Khemenu)', 'Karnak', 'Dendera', 'Libraries and scriptoriums']
  },
  'horus': {
    symbolism: ['falcon', 'sky', 'protection', 'justice', 'kingship', 'vengeance', 'royal power'],
    domains: ['Sky', 'Protection', 'Justice', 'Kingship', 'Vengeance', 'Royal Power', 'Divine Justice', 'Warfare'],
    aliases: ['Hor', 'Horakhty (Horus of the Horizon)', 'Haroeris (Elder Horus)'],
    festivals: ['Horus Festival (coronation)', 'Sed Festival (jubilee)'],
    epithets: ['Lord of the Sky', 'The Avenger', 'Falcon God', 'The Strong One', 'Junior Horus'],
    attributes: ['falcon-headed', 'golden', 'powerful', 'just', 'protective', 'royal bearing'],
    iconography: 'Falcon, Eye of Horus (Wedjat eye), Crescent and disk crown, Winged sun disk',
    sacred_sites: ['Edfu', 'Dendera', 'Karnak', 'Behdet (falcon city)']
  },
  'set': {
    symbolism: ['chaos', 'storm', 'wilderness', 'disorder', 'strength', 'foreign lands', 'conflict'],
    domains: ['Chaos', 'Storms', 'Disorder', 'Wilderness', 'Strength', 'Foreign Lands', 'Conflict', 'The Desert'],
    aliases: ['Seth', 'Seteh', 'Sutekh'],
    festivals: ['Set festivals (protective nature)', 'Victory festivals against chaos'],
    epithets: ['Lord of Chaos', 'Stormer', 'Strength of the Desert', 'Shatterer of Obstacles'],
    attributes: ['animal-headed (Set animal)', 'red-skinned', 'aggressive', 'powerful', 'wild', 'fearsome'],
    iconography: 'Set animal (aardvark-like), Chaos serpent, Storm clouds, Desert',
    sacred_sites: ['Avaris (Hyksos capital)', 'Tanis', 'Thebes (protective role)', 'Desert regions']
  },

  // SHARED/SYNCRETIZED DEITIES
  'amun': {
    symbolism: ['hidden', 'invisible', 'creation', 'abundance', 'fertility', 'wind', 'secret knowledge'],
    domains: ['Hidden/Invisible', 'Creation', 'Fertility', 'Abundance', 'Kings and Kingdom', 'Wind and Air'],
    aliases: ['Amen', 'Amun-Ra (syncretic)'],
    festivals: ['Opet Festival', 'Beautiful Festival of Amun'],
    epithets: ['King of Gods', 'The Hidden One', 'Lord of All Gods', 'The Secret One'],
    attributes: ['anthropomorphic', 'blue-skinned (sky)', 'crowned with ostrich feathers', 'mysterious', 'powerful'],
    iconography: 'Ostrich feathers, Ram\'s head, Cartouches, Blue coloration',
    sacred_sites: ['Karnak (Amun temple)', 'Luxor', 'Thebes (Waset)', 'Siwa Oasis']
  }
};

/**
 * Extract or create enriched metadata for a deity
 * @param {Object} deityData - The deity document from Firebase
 * @param {string} deityId - The deity ID
 * @returns {Object} Enriched metadata object
 */
function enrichDeityMetadata(deityData, deityId) {
  const enriched = {};

  // Get template metadata if available
  const template = deityMetadataMap[deityId.toLowerCase()];

  // Ensure all metadata fields exist with meaningful values
  enriched.symbolism = template?.symbolism || deityData.symbols || deityData.symbolism || [];
  enriched.domains = template?.domains || deityData.domains || [];
  enriched.aliases = template?.aliases || deityData.aliases || [];
  enriched.festivals = template?.festivals || (deityData.worship?.festivals?.map(f =>
    typeof f === 'string' ? f : f.name || f.description
  )) || [];
  enriched.epithets = template?.epithets || deityData.epithets || [];
  enriched.attributes = template?.attributes || deityData.attributes || [];

  // Add additional fields from template
  if (template) {
    enriched.iconography = template.iconography;
    enriched.sacred_sites = template.sacred_sites;
  }

  return enriched;
}

/**
 * Process all deity files in the directory
 * @param {string} dirPath - Path to deities directory
 */
function processDeities(dirPath) {
  const results = {
    processed: 0,
    enriched: 0,
    errors: 0,
    details: []
  };

  try {
    const files = fs.readdirSync(dirPath);
    const deityFiles = files.filter(f =>
      f.endsWith('.json') &&
      f !== '_all.json' &&
      !f.includes('_detailed')
    );

    console.log(`Found ${deityFiles.length} deity files to process\n`);

    // Focus on Greek, Norse, and Egyptian deities first
    const targetMythologies = ['greek', 'norse', 'egyptian'];
    const targetFiles = deityFiles.filter(f => {
      const content = fs.readFileSync(path.join(dirPath, f), 'utf8');
      const data = JSON.parse(content);
      return targetMythologies.some(m =>
        (data.mythology === m || f.includes(m)) &&
        data.type === 'deity'
      );
    });

    console.log(`Processing ${targetFiles.length} Greek, Norse, and Egyptian deity files\n`);

    targetFiles.forEach(file => {
      try {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const deityData = JSON.parse(content);

        // Extract deity ID from filename or document
        const deityId = deityData.id || file.replace('.json', '');

        // Enrich metadata
        const enrichedMetadata = enrichDeityMetadata(deityData, deityId);

        // Merge enriched metadata into deity data
        const enrichedData = {
          ...deityData,
          ...enrichedMetadata,
          metadata: {
            ...(deityData.metadata || {}),
            enrichment_type: 'metadata_enrichment',
            enriched_at: new Date().toISOString(),
            enriched_by: 'enrich-deity-metadata-script'
          }
        };

        // Save enriched data back
        fs.writeFileSync(filePath, JSON.stringify(enrichedData, null, 2));

        results.processed++;
        results.enriched++;

        const symbolCount = enrichedMetadata.symbolism?.length || 0;
        const domainCount = enrichedMetadata.domains?.length || 0;
        const festivalCount = enrichedMetadata.festivals?.length || 0;

        results.details.push({
          deity: deityData.name || deityData.displayName || deityId,
          mythology: deityData.mythology,
          symbolism_count: symbolCount,
          domains_count: domainCount,
          festivals_count: festivalCount,
          status: 'enriched'
        });

        console.log(`✓ ${deityData.name || deityId} (${deityData.mythology})`);
        console.log(`  Symbolism: ${symbolCount} items, Domains: ${domainCount} items, Festivals: ${festivalCount} items\n`);

      } catch (error) {
        results.errors++;
        console.error(`✗ Error processing ${file}: ${error.message}\n`);
        results.details.push({
          file,
          status: 'error',
          error: error.message
        });
      }
    });

  } catch (error) {
    console.error(`Error reading directory: ${error.message}`);
    process.exit(1);
  }

  return results;
}

/**
 * Generate summary report
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(70));
  console.log('DEITY METADATA ENRICHMENT REPORT');
  console.log('='.repeat(70) + '\n');

  console.log(`Total Processed: ${results.processed}`);
  console.log(`Successfully Enriched: ${results.enriched}`);
  console.log(`Errors: ${results.errors}\n`);

  if (results.details.length > 0) {
    console.log('Details:');
    console.log('-'.repeat(70));
    results.details.forEach(detail => {
      if (detail.status === 'enriched') {
        console.log(`${detail.deity.padEnd(30)} | ${detail.mythology.padEnd(12)} | Symbols: ${detail.symbolism_count} Domains: ${detail.domains_count} Festivals: ${detail.festivals_count}`);
      } else if (detail.status === 'error') {
        console.log(`${detail.file.padEnd(30)} | ERROR: ${detail.error}`);
      }
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('Enrichment complete! Files have been updated locally.');
  console.log('Next: Push changes to Firebase using your Firebase admin SDK.');
  console.log('='.repeat(70) + '\n');
}

// Main execution
const deityDir = path.join(__dirname, '../firebase-assets-downloaded/deities');

console.log('Starting Deity Metadata Enrichment...\n');
console.log(`Processing deities from: ${deityDir}\n`);

const results = processDeities(deityDir);
generateReport(results);

console.log(`\nMetadata enrichment template includes:`);
console.log(`  - Symbolism: Array of symbolic meanings`);
console.log(`  - Domains: Array of areas of power/influence`);
console.log(`  - Aliases: Alternative names`);
console.log(`  - Festivals: Associated celebrations with dates`);
console.log(`  - Epithets: Titles and descriptive names`);
console.log(`  - Attributes: Physical or characteristic descriptions`);
console.log(`  - Iconography: Sacred symbols and representations`);
console.log(`  - Sacred Sites: Locations of worship\n`);
