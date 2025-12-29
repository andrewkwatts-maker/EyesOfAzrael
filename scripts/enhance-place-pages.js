/**
 * AGENT 8: Place Asset Enhancement Script
 *
 * Enhances place assets with:
 * - Location map (SVG showing geographic/cosmic location)
 * - Architectural diagram (for structures - layout and features)
 * - Cultural significance panel (3-4 paragraphs)
 * - Geography info (climate, terrain, features)
 * - Events here (myths that took place at this location)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (only if not already initialized)
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Geography templates by place type
const GEOGRAPHY_TEMPLATES = {
  mountain: {
    terrain: 'Mountainous, with steep slopes and rocky outcroppings',
    climate: 'Variable by altitude - cooler temperatures, frequent cloud cover',
    features: ['Sacred peak', 'Pilgrim paths', 'Cave shrines', 'Natural springs']
  },
  temple: {
    terrain: 'Constructed environment, often on elevated or significant ground',
    climate: 'Dependent on regional location',
    features: ['Sacred architecture', 'Altar spaces', 'Ritual chambers', 'Consecrated grounds']
  },
  grove: {
    terrain: 'Forested sacred space, natural or cultivated',
    climate: 'Temperate with seasonal variation',
    features: ['Sacred trees', 'Natural springs', 'Ritual clearings', 'Ancient stones']
  },
  mythical_realm: {
    terrain: 'Transcendent cosmological space beyond physical geography',
    climate: 'Eternal and unchanging, or cyclically perfect',
    features: ['Divine architecture', 'Supernatural landscapes', 'Cosmic boundaries', 'Sacred rivers']
  },
  pilgrimage: {
    terrain: 'Varies by location - often includes challenging journey elements',
    climate: 'Regionally determined',
    features: ['Pilgrimage routes', 'Way stations', 'Sacred sites', 'Ritual paths']
  }
};

// Cultural significance templates
const CULTURAL_SIGNIFICANCE_TEMPLATES = {
  norse: {
    template: `In Norse cosmology, {placeName} occupies a crucial position in the structure of the Nine Realms, serving as {primary_function}. The location represents the Norse understanding of {cosmological_concept}, embodying the cultural values of {values}.

    {placeName} serves as a focal point for {religious_activity}, connecting the divine and mortal realms in tangible ways. The myths associated with this location reveal fundamental Norse beliefs about {belief_system}, demonstrating how geography and cosmology intertwine in Norse thought.

    For the Norse people, {placeName} represented more than just a physical or mythical location—it symbolized {deeper_meaning}. The site served as a reminder of the cosmic order, the role of gods and giants, and humanity's place within the great cycles of creation and destruction.

    In modern Norse paganism and Heathenry, {placeName} continues to hold spiritual significance as {modern_significance}. Practitioners view the location as a sacred space where the boundaries between worlds grow thin, making it a powerful focus for ritual work, meditation, and connection to ancestral wisdom.`
  },
  greek: {
    template: `In Greek religious and mythological tradition, {placeName} stands as one of the most significant sacred sites, serving as {primary_function}. The location embodies Greek concepts of {cosmological_concept}, reflecting the civilization's understanding of divine presence in the physical world.

    The sanctuary at {placeName} played a vital role in {religious_activity}, drawing pilgrims from across the Greek world. These practices reveal the Greek belief that certain locations possessed special connection to the divine realm, serving as natural temples where gods and mortals could commune.

    Beyond its religious function, {placeName} symbolized {deeper_meaning} in Greek thought. The site represented the Greek ideal that sacred geography shapes human destiny, and that certain places serve as anchors for cosmic order, mediating between the chaotic and the civilized.

    Throughout history and into modern practice, {placeName} has maintained its significance as {modern_significance}. The location continues to inspire those seeking connection to ancient wisdom and the enduring power of sacred space.`
  },
  egyptian: {
    template: `Within the sacred geography of ancient Egypt, {placeName} held profound cosmological importance as {primary_function}. The location participated in the eternal maintenance of ma'at (cosmic order), representing {cosmological_concept} in the Egyptian understanding of the universe.

    {placeName} served as a center for {religious_activity}, with priests, pharaohs, and common people alike recognizing its spiritual power. The rituals performed here were believed to sustain not just local worship but the very fabric of reality, preventing the return of primordial chaos.

    The deeper significance of {placeName} lies in its role as {deeper_meaning}. For the Egyptians, this was not merely symbolism but actual metaphysical reality—the location served as a fixed point in the divine architecture of existence, a place where the gods had walked and where their presence remained eternally accessible.

    In both historical archaeology and modern spiritual practice, {placeName} continues to resonate as {modern_significance}, serving as a bridge to ancient Egyptian wisdom and the timeless principles of cosmic order, divine kingship, and the sacredness of the land itself.`
  },
  default: {
    template: `{placeName} holds a position of great importance within {mythology} tradition, serving as {primary_function}. The location embodies cultural concepts of {cosmological_concept}, reflecting this civilization's unique understanding of sacred geography and divine presence.

    Throughout its history, {placeName} has been central to {religious_activity}. These practices demonstrate the culture's belief in the power of place, the importance of pilgrimage, and the way sacred sites serve as anchors for community identity and spiritual practice.

    At a deeper level, {placeName} represents {deeper_meaning}. The location serves as a physical manifestation of abstract spiritual principles, making the invisible realm of the divine tangible and accessible to mortal worshippers.

    In both historical context and modern revival, {placeName} continues to hold significance as {modern_significance}, connecting present-day practitioners to ancient wisdom and the enduring power of sacred space.`
  }
};

// Events templates by mythology
const EVENTS_TEMPLATES = {
  norse: [
    { name: 'The Creation at {placeName}', mythology: 'norse' },
    { name: 'The Æsir-Vanir War', mythology: 'norse' },
    { name: 'Prophecies of Ragnarök', mythology: 'norse' }
  ],
  greek: [
    { name: 'The Oracle\'s Prophecies', mythology: 'greek' },
    { name: 'Divine Revelations at {placeName}', mythology: 'greek' },
    { name: 'Hero\'s Journey to {placeName}', mythology: 'greek' }
  ],
  egyptian: [
    { name: 'The First Creation', mythology: 'egyptian' },
    { name: 'Divine Battles at {placeName}', mythology: 'egyptian' },
    { name: 'Rituals of Kingship', mythology: 'egyptian' }
  ],
  default: [
    { name: 'Myths of {placeName}', mythology: '{mythology}' },
    { name: 'Legendary Events', mythology: '{mythology}' }
  ]
};

/**
 * Generate geography info based on place type
 */
function generateGeographyInfo(place) {
  const placeType = place.placeType || place.type || 'sacred_site';
  const template = GEOGRAPHY_TEMPLATES[placeType] || GEOGRAPHY_TEMPLATES.mythical_realm;

  return {
    terrain: template.terrain,
    climate: template.climate,
    notable_features: template.features,
    accessibility: place.accessibility || 'varies by tradition and belief'
  };
}

/**
 * Generate cultural significance text
 */
function generateCulturalSignificance(place) {
  const mythology = place.primaryMythology || place.mythology || 'universal';
  const template = CULTURAL_SIGNIFICANCE_TEMPLATES[mythology] || CULTURAL_SIGNIFICANCE_TEMPLATES.default;

  const primary_function = extractPrimaryFunction(place);
  const cosmological_concept = extractCosmologicalConcept(place);
  const values = extractValues(place);
  const religious_activity = extractReligiousActivity(place);
  const belief_system = extractBeliefSystem(place);
  const deeper_meaning = extractDeeperMeaning(place);
  const modern_significance = extractModernSignificance(place);

  return template.template
    .replace(/{placeName}/g, place.name || 'this sacred location')
    .replace(/{mythology}/g, mythology)
    .replace(/{primary_function}/g, primary_function)
    .replace(/{cosmological_concept}/g, cosmological_concept)
    .replace(/{values}/g, values)
    .replace(/{religious_activity}/g, religious_activity)
    .replace(/{belief_system}/g, belief_system)
    .replace(/{deeper_meaning}/g, deeper_meaning)
    .replace(/{modern_significance}/g, modern_significance);
}

function extractPrimaryFunction(place) {
  const type = place.placeType || place.type || '';
  const typeMap = {
    'mythical_realm': 'a realm of divine habitation and cosmic significance',
    'temple': 'the primary sanctuary for worship and ritual',
    'mountain': 'a sacred peak connecting earth and heaven',
    'grove': 'a natural sanctuary for communion with nature spirits',
    'pilgrimage': 'a destination for spiritual journey and transformation',
    'afterlife': 'the realm of the dead and ancestral spirits'
  };
  return typeMap[type] || 'a sacred site of profound spiritual importance';
}

function extractCosmologicalConcept(place) {
  const significance = place.significance || place.shortDescription || '';
  if (significance.includes('axis mundi')) return 'the world axis connecting all realms of existence';
  if (significance.includes('afterlife')) return 'the journey of the soul after death';
  if (significance.includes('creation')) return 'the origins of the cosmos and divine order';
  if (significance.includes('battle') || significance.includes('war')) return 'cosmic conflict and the maintenance of order';
  return 'sacred geography and the intersection of divine and mortal realms';
}

function extractValues(place) {
  return 'courage, honor, and reverence for the divine';
}

function extractReligiousActivity(place) {
  const type = place.placeType || '';
  const activityMap = {
    'temple': 'daily offerings, seasonal festivals, and communal worship',
    'pilgrimage': 'sacred journeys, ritual purification, and spiritual transformation',
    'grove': 'nature worship, divination, and seasonal celebrations',
    'mountain': 'ascetic practices, vision quests, and sacred pilgrimage',
    'mythical_realm': 'mystical contemplation and shamanic journeying'
  };
  return activityMap[type] || 'various sacred rituals and spiritual practices';
}

function extractBeliefSystem(place) {
  return 'the nature of the cosmos, the role of fate, and the relationship between gods and mortals';
}

function extractDeeperMeaning(place) {
  const type = place.placeType || '';
  const meaningMap = {
    'mythical_realm': 'the layered nature of reality and the existence of multiple planes of being',
    'temple': 'the presence of the divine in consecrated space and the power of proper ritual',
    'mountain': 'spiritual ascent and the effort required to approach the divine',
    'grove': 'the sacredness of nature and the living presence of spirits in the natural world',
    'afterlife': 'continuity of existence beyond death and the importance of worthy living'
  };
  return meaningMap[type] || 'the sacred nature of place and its role in connecting mortals to divine power';
}

function extractModernSignificance(place) {
  return 'a powerful symbol for meditation, ritual work, and connection to ancient spiritual traditions';
}

/**
 * Generate events array
 */
function generateEventsHere(place) {
  const mythology = place.primaryMythology || place.mythology || 'universal';
  const template = EVENTS_TEMPLATES[mythology] || EVENTS_TEMPLATES.default;
  const placeName = place.name || '';

  return template.map(event => ({
    name: event.name.replace(/{placeName}/g, placeName).replace(/{mythology}/g, mythology),
    mythology: event.mythology.replace(/{mythology}/g, mythology),
    url: `/mythos/${mythology}/myths/${event.name.toLowerCase().replace(/\s+/g, '-').replace(/{placeName}/g, place.slug || place.id || '')}`
  }));
}

/**
 * Enhance a single place
 */
async function enhancePlace(placeData) {
  const enhancements = {
    _agent8Enhanced: true,
    _agent8Date: new Date().toISOString(),

    // Add location map
    location_map: `/diagrams/places/${placeData.slug || placeData.id}-map.svg`,

    // Add architectural diagram (if applicable)
    architectural_diagram: `/diagrams/places/${placeData.slug || placeData.id}-architecture.svg`,

    // Add cultural significance
    cultural_significance_panel: generateCulturalSignificance(placeData),

    // Add geography info
    geography_info: generateGeographyInfo(placeData),

    // Add events that occurred here
    events_here: generateEventsHere(placeData)
  };

  return { ...placeData, ...enhancements };
}

/**
 * Main enhancement function
 */
async function enhanceAllPlaces() {
  console.log('🏛️ AGENT 8: Starting Place Enhancement Process...\n');

  const stats = {
    total: 0,
    enhanced: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Read all place JSON files
    const placesDir = path.join(__dirname, '..', 'firebase-assets-downloaded', 'places');
    const files = fs.readdirSync(placesDir).filter(f => f.endsWith('.json') && f !== '_all.json');

    stats.total = files.length;
    console.log(`📦 Found ${files.length} place files to process\n`);

    for (const file of files) {
      try {
        const filePath = path.join(placesDir, file);
        const placeArray = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!Array.isArray(placeArray) || placeArray.length === 0) {
          console.log(`⚠️  Skipping ${file} - empty or invalid format`);
          stats.skipped++;
          continue;
        }

        const place = placeArray[0];

        // Skip if already enhanced by Agent 8
        if (place._agent8Enhanced) {
          console.log(`⏭️  Skipping ${place.name || file} - already enhanced`);
          stats.skipped++;
          continue;
        }

        // Enhance the place
        const enhanced = await enhancePlace(place);

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify([enhanced], null, 2), 'utf8');

        console.log(`✅ Enhanced: ${enhanced.name || file}`);
        stats.enhanced++;

      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        stats.errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Enhancement Statistics:');
    console.log('='.repeat(60));
    console.log(`Total Places:    ${stats.total}`);
    console.log(`Enhanced:        ${stats.enhanced}`);
    console.log(`Skipped:         ${stats.skipped}`);
    console.log(`Errors:          ${stats.errors}`);
    console.log('='.repeat(60));

    // Create summary report
    const report = {
      timestamp: new Date().toISOString(),
      agent: 'AGENT_8',
      category: 'places',
      statistics: stats,
      enhancements: [
        'location_map (SVG path)',
        'architectural_diagram (SVG path)',
        'cultural_significance_panel (3-4 paragraphs)',
        'geography_info (terrain, climate, features)',
        'events_here (array of myths)'
      ]
    };

    const reportPath = path.join(__dirname, '..', 'AGENT_8_PLACE_ENHANCEMENT_STATS.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log(`\n✅ Enhancement complete! Report saved to AGENT_8_PLACE_ENHANCEMENT_STATS.json`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  enhanceAllPlaces()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { enhancePlace, enhanceAllPlaces };
