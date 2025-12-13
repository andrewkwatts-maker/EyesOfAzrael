const fs = require('fs');
const path = require('path');

const ENTITIES_PATH = 'H:/Github/EyesOfAzrael/data/entities';

// Buddhist entities to create
const buddhistEntities = {
  deities: [
    {
      id: 'manjushri',
      name: 'Manjushri',
      displayName: 'Manjushri (Monju/Jampal)',
      icon: '📚',
      shortDescription: 'Bodhisattva of transcendent wisdom who wields the sword of discriminating awareness',
      category: 'bodhisattva',
      subCategory: 'wisdom-deity',
      primaryColor: '#FFD700',
      element: 'fire',
      chakra: 'third-eye'
    },
    {
      id: 'yamantaka',
      name: 'Yamantaka',
      displayName: 'Yamantaka (Conqueror of Death)',
      icon: '⚔️',
      shortDescription: 'Wrathful manifestation of Manjushri who conquered Yama, the lord of death',
      category: 'wrathful-deity',
      subCategory: 'dharmapala',
      primaryColor: '#8B0000',
      element: 'fire',
      chakra: 'solar-plexus'
    },
    {
      id: 'guanyin',
      name: 'Guanyin',
      displayName: 'Guanyin (Goddess of Mercy)',
      icon: '🌸',
      shortDescription: 'East Asian feminine manifestation of Avalokiteshvara, goddess of mercy and compassion',
      category: 'bodhisattva',
      subCategory: 'compassion-deity',
      primaryColor: '#FFFFFF',
      element: 'water',
      chakra: 'heart'
    }
  ],
  heroes: [
    {
      id: 'nagarjuna',
      name: 'Nagarjuna',
      displayName: 'Nagarjuna (Second Buddha)',
      icon: '🐉',
      shortDescription: 'Founder of Madhyamaka philosophy, retrieved Prajnaparamita sutras from the nagas',
      era: 'c. 150-250 CE'
    },
    {
      id: 'shantideva',
      name: 'Shantideva',
      displayName: 'Shantideva',
      icon: '🧘',
      shortDescription: '8th century monk and author of Bodhicharyavatara (Guide to the Bodhisattva Way)',
      era: 'c. 685-763 CE'
    },
    {
      id: 'tsongkhapa',
      name: 'Tsongkhapa',
      displayName: 'Je Tsongkhapa',
      icon: '📿',
      shortDescription: 'Founder of Gelug school of Tibetan Buddhism, considered emanation of Manjushri',
      era: '1357-1419 CE'
    },
    {
      id: 'dalai-lama',
      name: 'Dalai Lama',
      displayName: 'Dalai Lama (Ocean of Wisdom)',
      icon: '🙏',
      shortDescription: 'Spiritual leader of Tibetan Buddhism, considered tulku of Avalokiteshvara',
      era: 'Institution began 1391 CE'
    },
    {
      id: 'songtsen-gampo',
      name: 'Songtsen Gampo',
      displayName: 'King Songtsen Gampo',
      icon: '👑',
      shortDescription: '7th century Tibetan king who introduced Buddhism to Tibet',
      era: 'c. 569-650 CE'
    }
  ],
  concepts: [
    {
      id: 'bodhisattva',
      name: 'Bodhisattva',
      icon: '🙏',
      shortDescription: 'Enlightened being who vows to delay nirvana to liberate all sentient beings',
      category: 'spiritual-ideal'
    },
    {
      id: 'karuna',
      name: 'Karuna',
      displayName: 'Karuna (Compassion)',
      icon: '💗',
      shortDescription: 'Universal compassion, the wish for all beings to be free from suffering',
      category: 'virtue'
    },
    {
      id: 'nirvana',
      name: 'Nirvana',
      icon: '✨',
      shortDescription: 'Liberation from suffering and the cycle of rebirth, extinction of greed, hatred, and delusion',
      category: 'soteriological-goal'
    },
    {
      id: 'klesha',
      name: 'Klesha',
      displayName: 'Klesha (Three Poisons)',
      icon: '🔥',
      shortDescription: 'Mental afflictions: greed, hatred, and delusion that bind beings to samsara',
      category: 'obstacle'
    },
    {
      id: 'dependent-origination',
      name: 'Pratītyasamutpāda',
      displayName: 'Dependent Origination',
      icon: '🔗',
      shortDescription: 'Fundamental doctrine that all phenomena arise through interconnected causes and conditions',
      category: 'philosophical-principle'
    }
  ],
  places: [
    {
      id: 'potala-palace',
      name: 'Potala Palace',
      icon: '🏰',
      shortDescription: 'Sacred abode of Avalokiteshvara and historic residence of Dalai Lama in Lhasa',
      location: 'Lhasa, Tibet',
      category: 'monastery'
    },
    {
      id: 'six-realms',
      name: 'Six Realms',
      displayName: 'Six Realms of Existence',
      icon: '🌀',
      shortDescription: 'Six destinations for rebirth: gods, asuras, humans, animals, hungry ghosts, hell beings',
      location: 'Cosmological',
      category: 'cosmology'
    },
    {
      id: 'bardo',
      name: 'Bardo',
      displayName: 'Bardo (Intermediate State)',
      icon: '🌫️',
      shortDescription: 'Transitional state between death and rebirth where consciousness experiences visions',
      location: 'Cosmological',
      category: 'cosmology'
    }
  ],
  items: [
    {
      id: 'bodhi-tree',
      name: 'Bodhi Tree',
      icon: '🌳',
      shortDescription: 'Sacred fig tree (Ficus religiosa) under which Buddha attained enlightenment',
      category: 'plant',
      subCategory: 'sacred-tree'
    },
    {
      id: 'sandalwood',
      name: 'Sandalwood',
      icon: '🌿',
      shortDescription: 'Fragrant wood used in incense and meditation, aids concentration and purification',
      category: 'plant',
      subCategory: 'sacred-herb'
    }
  ]
};

console.log('Creating remaining Buddhist entities...');
console.log('This script creates basic entity files that can be enhanced later.');
console.log('');

// Track created entities
let created = {
  deities: 0,
  heroes: 0,
  concepts: 0,
  places: 0,
  items: 0
};

// Create deity entities
for (const deity of buddhistEntities.deities) {
  const filePath = path.join(ENTITIES_PATH, 'deity', `${deity.id}.json`);

  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${deity.name} (already exists)`);
    continue;
  }

  const entity = {
    id: deity.id,
    type: 'deity',
    name: deity.name,
    displayName: deity.displayName || deity.name,
    icon: deity.icon,
    slug: deity.id,
    mythologies: ['buddhist', 'mahayana', 'vajrayana'],
    primaryMythology: 'buddhist',
    shortDescription: deity.shortDescription,
    category: deity.category,
    subCategory: deity.subCategory,
    colors: {
      primary: deity.primaryColor,
      secondary: '#FFFFFF',
      primaryRgb: deity.primaryColor.replace('#', '')
    },
    tags: [
      deity.id,
      'buddhist',
      'bodhisattva',
      'mahayana'
    ],
    metaphysicalProperties: {
      element: deity.element || 'aether',
      energyType: 'enlightened',
      chakra: deity.chakra || null
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(entity, null, 2));
  console.log(`✅ Created deity: ${deity.name}`);
  created.deities++;
}

// Create hero entities
for (const hero of buddhistEntities.heroes) {
  const filePath = path.join(ENTITIES_PATH, 'hero', `${hero.id}.json`);

  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${hero.name} (already exists)`);
    continue;
  }

  const entity = {
    id: hero.id,
    type: 'hero',
    name: hero.name,
    displayName: hero.displayName || hero.name,
    icon: hero.icon,
    slug: hero.id,
    mythologies: ['buddhist'],
    primaryMythology: 'buddhist',
    shortDescription: hero.shortDescription,
    category: 'historical-figure',
    tags: [
      hero.id,
      'buddhist',
      'teacher',
      'historical'
    ],
    temporal: {
      timelinePosition: 'historical',
      culturalPeriod: hero.era
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(entity, null, 2));
  console.log(`✅ Created hero: ${hero.name}`);
  created.heroes++;
}

// Create concept entities
for (const concept of buddhistEntities.concepts) {
  const filePath = path.join(ENTITIES_PATH, 'concept', `${concept.id}.json`);

  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${concept.name} (already exists)`);
    continue;
  }

  const entity = {
    id: concept.id,
    type: 'concept',
    name: concept.name,
    displayName: concept.displayName || concept.name,
    icon: concept.icon,
    slug: concept.id,
    mythologies: ['buddhist'],
    primaryMythology: 'buddhist',
    shortDescription: concept.shortDescription,
    category: concept.category,
    tags: [
      concept.id,
      'buddhist',
      'philosophy',
      'dharma'
    ],
    metaphysicalProperties: {
      element: 'aether',
      energyType: 'universal'
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(entity, null, 2));
  console.log(`✅ Created concept: ${concept.name}`);
  created.concepts++;
}

// Create place entities
for (const place of buddhistEntities.places) {
  const filePath = path.join(ENTITIES_PATH, 'place', `${place.id}.json`);

  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${place.name} (already exists)`);
    continue;
  }

  const entity = {
    id: place.id,
    type: 'place',
    name: place.name,
    displayName: place.displayName || place.name,
    icon: place.icon,
    slug: place.id,
    mythologies: ['buddhist'],
    primaryMythology: 'buddhist',
    shortDescription: place.shortDescription,
    category: place.category,
    tags: [
      place.id,
      'buddhist',
      'sacred-place'
    ],
    metaphysicalProperties: {
      element: 'earth',
      energyType: 'sacred'
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(entity, null, 2));
  console.log(`✅ Created place: ${place.name}`);
  created.places++;
}

// Create item entities
for (const item of buddhistEntities.items) {
  const filePath = path.join(ENTITIES_PATH, 'item', `${item.id}.json`);

  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${item.name} (already exists)`);
    continue;
  }

  const entity = {
    id: item.id,
    type: 'item',
    name: item.name,
    icon: item.icon,
    slug: item.id,
    mythologies: ['buddhist'],
    primaryMythology: 'buddhist',
    shortDescription: item.shortDescription,
    category: item.category,
    subCategory: item.subCategory,
    tags: [
      item.id,
      'buddhist',
      'sacred'
    ],
    metaphysicalProperties: {
      element: 'earth',
      energyType: 'sacred'
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(entity, null, 2));
  console.log(`✅ Created item: ${item.name}`);
  created.items++;
}

console.log('');
console.log('=== CREATION SUMMARY ===');
console.log(`Deities created: ${created.deities}`);
console.log(`Heroes created: ${created.heroes}`);
console.log(`Concepts created: ${created.concepts}`);
console.log(`Places created: ${created.places}`);
console.log(`Items created: ${created.items}`);
console.log(`Total entities created: ${Object.values(created).reduce((a, b) => a + b, 0)}`);
console.log('');
console.log('✅ All basic Buddhist entities created successfully!');
console.log('NOTE: These are basic entities. Enhance with fullDescription, sources, and relationships as needed.');
