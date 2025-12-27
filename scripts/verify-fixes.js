const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifySamples() {
  console.log('SAMPLE VERIFICATION\n');

  // Check a hero
  const hero = await db.collection('heroes').doc('babylonian_gilgamesh').get();
  console.log('HERO: babylonian_gilgamesh');
  console.log('  type:', hero.data().type);
  console.log('  icon:', hero.data().icon);
  console.log('  description length:', hero.data().description?.length || 0);
  console.log('  polishedBy:', hero.data().metadata?.polishedBy);

  // Check a creature
  const creature = await db.collection('creatures').doc('greek_creature_chimera').get();
  console.log('\nCREATURE: greek_creature_chimera');
  console.log('  type:', creature.data().type);
  console.log('  abilities:', creature.data().abilities?.length || 0);
  console.log('  description length:', creature.data().description?.length || 0);
  console.log('  polishedBy:', creature.data().metadata?.polishedBy);

  // Check a symbol
  const symbol = await db.collection('symbols').doc('persian_faravahar').get();
  console.log('\nSYMBOL: persian_faravahar');
  console.log('  type:', symbol.data().type);
  console.log('  icon:', symbol.data().icon);
  console.log('  meaning length:', symbol.data().meaning?.length || 0);
  console.log('  description length:', symbol.data().description?.length || 0);
  console.log('  polishedBy:', symbol.data().metadata?.polishedBy);

  process.exit(0);
}

verifySamples();
