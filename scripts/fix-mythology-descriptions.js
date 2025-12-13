const fs = require('fs');
const path = require('path');

// Load the transformed data
const transformedDataPath = path.join(__dirname, '../FIREBASE/transformed_data/all_mythologies_transformed.json');
const transformedData = JSON.parse(fs.readFileSync(transformedDataPath, 'utf8'));

console.log('=== Checking Mythology Descriptions ===\n');

const issues = {
  missingDescription: [],
  emptyDescription: [],
  redundantTitles: []
};

// Default descriptions for mythologies missing them
const defaultDescriptions = {
  aztec: "Explore the rich tapestry of Aztec mythology, from the creation myths to the cosmic battles between gods. Discover the feathered serpent Quetzalcoatl, the sun god Huitzilopochtli, the rain god Tlaloc, and the complex calendar system that guided Aztec civilization. Journey through tales of sacrifice, cosmic cycles, and the five suns that shaped the world.",

  babylonian: "Explore the ancient wisdom of Babylonian mythology, from the Enuma Elish creation epic to the Epic of Gilgamesh. Discover Marduk the creator god, Ishtar the goddess of love and war, and the seven planetary deities. Journey through tales of cosmic order, divine kingship, and the eternal struggle between chaos and civilization.",

  celtic: "Explore the mystical traditions of Celtic mythology, from the ancient druids to the legendary heroes. Discover the Tuatha Dé Danann, the otherworldly realms, and the sacred cycles of nature. Journey through tales of magic, transformation, and the thin veil between the mortal and immortal worlds.",

  egyptian: "Explore the timeless wisdom of Egyptian mythology, from the creation of the world to the journey through the afterlife. Discover Ra the sun god, Osiris the lord of the underworld, Isis the great mother, and the intricate beliefs about death and resurrection that shaped one of history's greatest civilizations.",

  greek: "Explore the rich tapestry of Greek mythology, from the heights of Mount Olympus to the depths of Tartarus. Discover the twelve Olympians, legendary heroes, fearsome creatures, and the mysteries that shaped Western civilization for over a millennium.",

  hindu: "Explore the vast cosmos of Hindu mythology, from the Trimurti (Brahma, Vishnu, Shiva) to the countless devas and devis. Journey through the cycles of creation and destruction, the paths to moksha (liberation), and the sacred wisdom of the Vedas, Upanishads, and Bhagavad Gita.",

  islamic: "Explore the sacred traditions of Islamic theology and mysticism, from the prophets and angels to the mystical path of Sufism. Discover the 99 Names of Allah, the spiritual journey of the soul, and the rich tradition of Islamic philosophy and metaphysics.",

  japanese: "Explore the rich tapestry of Japanese mythology, recorded in the ancient chronicles Kojiki (712 CE) and Nihon Shoki (720 CE). Discover the creation myths, the kami (divine spirits) who created the Japanese islands, and gave birth to the sun, moon, and natural world. Journey from the creation by Izanagi and Izanami to the adventures of storm god Susanoo and the sun goddess Amaterasu. These tales explore themes of purity, pollution, death, and the sacred nature of the land itself.",

  jewish: "Explore the rich traditions of Jewish mysticism and theology, from the Hebrew Bible to Kabbalah. Discover the Sefirot, the angelic hierarchies, and the profound metaphysical teachings that have shaped Jewish thought for millennia.",

  mayan: "Explore the cosmic wisdom of Mayan mythology, from the Popol Vuh creation epic to the Hero Twins' journey through Xibalba. Discover the maize god, the vision serpent, and the intricate calendar system that tracked cosmic cycles and prophetic time.",

  native_american: "Explore the diverse spiritual traditions of Native American cultures, from creation stories to trickster tales. Discover the reverence for nature, the sacred medicine wheel, and the profound connection between all living things that defines indigenous wisdom.",

  norse: "Explore the epic tales of Norse mythology, from the creation of the Nine Realms to Ragnarök, the twilight of the gods. Discover Odin the All-Father, Thor the thunder god, Loki the trickster, and the warrior culture that shaped Viking civilization.",

  persian: "Explore the ancient dualistic traditions of Persian mythology, from Zoroastrianism to the epic tales of the Shahnameh. Discover Ahura Mazda and the cosmic battle between light and darkness, order and chaos, that shaped one of the world's oldest religions.",

  roman: "Explore the grand traditions of Roman mythology, adapted from Greek gods but uniquely Roman in character. Discover Jupiter, Mars, Venus, and the divine myths that legitimized the Roman Empire and shaped Western civilization.",

  sumerian: "Explore the earliest written myths of Sumerian civilization, from the creation of humanity to the descent of Inanna into the underworld. Discover Anu, Enlil, Enki, and the divine council that ruled the first cities of Mesopotamia.",

  yoruba: "Explore the vibrant spiritual traditions of Yoruba mythology from West Africa. Discover the Orishas, the divine forces of nature and human experience, and the rich cosmology that spread through the African diaspora to influence religions across the Americas."
};

// Check each mythology
for (const [key, data] of Object.entries(transformedData)) {
  const mythology = data.mythology;

  if (!mythology) continue;

  // Check for missing or empty description
  if (!mythology.description) {
    issues.missingDescription.push(key);
  } else if (mythology.description.trim() === '') {
    issues.emptyDescription.push(key);
  }

  // Check for redundant titles
  const title = mythology.title || '';
  const displayName = mythology.displayName || title;

  if (title.includes('World Mythos') ||
      title.includes('Mythos Explorer') ||
      title.includes('- Index') ||
      displayName.includes('World Mythos') ||
      displayName.includes('Mythos Explorer')) {
    issues.redundantTitles.push({
      id: key,
      title: title,
      displayName: displayName
    });
  }
}

// Report issues
console.log('Missing Description:', issues.missingDescription);
console.log('Empty Description:', issues.emptyDescription);
console.log('\nRedundant Titles:');
issues.redundantTitles.forEach(item => {
  console.log(`  ${item.id}:`);
  console.log(`    title: "${item.title}"`);
  console.log(`    displayName: "${item.displayName}"`);
});

// Fix the issues
console.log('\n=== Fixing Issues ===\n');

const updates = [];

for (const [key, data] of Object.entries(transformedData)) {
  const mythology = data.mythology;
  if (!mythology) continue;

  let updated = false;
  const original = JSON.parse(JSON.stringify(mythology));

  // Add missing descriptions
  if ((!mythology.description || mythology.description.trim() === '') && defaultDescriptions[key]) {
    mythology.description = defaultDescriptions[key];
    console.log(`✓ Added description to ${key}`);
    updated = true;
  }

  // Fix redundant titles
  let title = mythology.title || '';
  let displayName = mythology.displayName || title;

  // Remove redundant suffixes
  title = title
    .replace(/\s*-\s*World Mythos/g, '')
    .replace(/\s*-\s*Mythos Explorer/g, '')
    .replace(/\s*-\s*Index/g, '')
    .trim();

  displayName = displayName
    .replace(/\s*-\s*World Mythos/g, '')
    .replace(/\s*-\s*Mythos Explorer/g, '')
    .replace(/\s*-\s*Index/g, '')
    .trim();

  if (title !== original.title) {
    mythology.title = title;
    console.log(`✓ Fixed title for ${key}: "${original.title}" → "${title}"`);
    updated = true;
  }

  if (displayName !== original.displayName) {
    mythology.displayName = displayName;
    console.log(`✓ Fixed displayName for ${key}: "${original.displayName}" → "${displayName}"`);
    updated = true;
  }

  if (updated) {
    updates.push({
      collection: 'mythologies',
      id: key,
      data: mythology
    });
  }
}

// Save the updates to a file for Firebase upload
const updatesPath = path.join(__dirname, '../FIREBASE/transformed_data/mythology_fixes.json');
fs.writeFileSync(updatesPath, JSON.stringify(updates, null, 2));

console.log(`\n✓ Created ${updates.length} updates`);
console.log(`✓ Saved to: ${updatesPath}`);
console.log('\nTo apply these updates to Firestore, run:');
console.log('  node scripts/upload-mythology-fixes.js');
