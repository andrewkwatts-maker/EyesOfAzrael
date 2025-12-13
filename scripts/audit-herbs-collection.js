/**
 * Audit Herbs Collection in Firebase
 * Verifies all herbs are present and properly cross-referenced
 */

const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function auditHerbs() {
  console.log('HERBALISM COLLECTION AUDIT');
  console.log('='.repeat(70));

  const snapshot = await db.collection('herbs').get();
  console.log(`Total herbs in Firebase: ${snapshot.size}`);
  console.log('Target: 28 herbs');
  console.log(`Status: ${snapshot.size >= 28 ? '✅ COMPLETE (100%)' : '⚠️  INCOMPLETE'}`);
  console.log('');

  // Group by mythology
  const byMythology = {};
  const allHerbs = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const herb = {
      id: doc.id,
      name: data.name,
      mythologies: data.mythologies || [],
      primaryMythology: data.primaryMythology,
      associatedDeities: data.associatedDeities || []
    };

    allHerbs.push(herb);

    const primary = data.primaryMythology || (data.mythologies && data.mythologies[0]) || 'unknown';
    if (!byMythology[primary]) {
      byMythology[primary] = [];
    }
    byMythology[primary].push(herb);
  });

  console.log('HERBS BY PRIMARY MYTHOLOGY:');
  console.log('='.repeat(70));

  Object.keys(byMythology).sort().forEach(mythology => {
    console.log('');
    console.log(`${mythology.toUpperCase()} (${byMythology[mythology].length}):`);
    byMythology[mythology].forEach(herb => {
      const deities = herb.associatedDeities.length > 0
        ? ` → ${herb.associatedDeities.slice(0, 3).join(', ')}${herb.associatedDeities.length > 3 ? '...' : ''}`
        : '';
      console.log(`  • ${herb.name}${deities}`);
    });
  });

  console.log('');
  console.log('='.repeat(70));
  console.log('KEY SACRED HERBS VERIFICATION:');
  console.log('='.repeat(70));

  // Check for key sacred herbs mentioned in requirements
  const keyHerbs = {
    'Lotus (Buddhist/Hindu/Egyptian)': allHerbs.filter(h => h.name.toLowerCase().includes('lotus')),
    'Soma (Hindu divine drink)': allHerbs.filter(h => h.name.toLowerCase().includes('soma')),
    'Frankincense (Universal)': allHerbs.filter(h => h.name.toLowerCase().includes('frankincense')),
    'Myrrh (Universal)': allHerbs.filter(h => h.name.toLowerCase().includes('myrrh')),
    'Tulsi (Hindu)': allHerbs.filter(h => h.name.toLowerCase().includes('tulsi') || h.id.includes('tulsi')),
    'Mistletoe (Norse/Celtic)': allHerbs.filter(h => h.name.toLowerCase().includes('mistletoe')),
    'Tea (Buddhist)': allHerbs.filter(h => h.name.toLowerCase().includes('tea') || h.id.includes('tea')),
    'Hyssop (Jewish)': allHerbs.filter(h => h.name.toLowerCase().includes('hyssop') || h.id.includes('hyssop')),
    'Mandrake (Jewish)': allHerbs.filter(h => h.name.toLowerCase().includes('mandrake')),
    'Yew (Norse)': allHerbs.filter(h => h.name.toLowerCase().includes('yew')),
    'Ash (Norse - Yggdrasil)': allHerbs.filter(h => h.name.toLowerCase().includes('ash') || h.id.includes('ash')),
    'Bodhi Tree (Buddhist)': allHerbs.filter(h => h.name.toLowerCase().includes('bodhi')),
    'Sandalwood (Buddhist)': allHerbs.filter(h => h.name.toLowerCase().includes('sandalwood'))
  };

  for (const [requirement, found] of Object.entries(keyHerbs)) {
    const status = found.length > 0 ? '✅' : '❌';
    const details = found.length > 0
      ? found.map(h => h.id).join(', ')
      : 'NOT FOUND';
    console.log(`${status} ${requirement.padEnd(40)} ${details}`);
  }

  // Cross-reference audit
  console.log('');
  console.log('='.repeat(70));
  console.log('DEITY CROSS-REFERENCES:');
  console.log('='.repeat(70));

  const deityHerbMap = {};
  allHerbs.forEach(herb => {
    if (herb.associatedDeities) {
      herb.associatedDeities.forEach(deity => {
        if (!deityHerbMap[deity]) {
          deityHerbMap[deity] = [];
        }
        deityHerbMap[deity].push(herb.name);
      });
    }
  });

  Object.keys(deityHerbMap).sort().slice(0, 15).forEach(deity => {
    console.log(`${deity}: ${deityHerbMap[deity].join(', ')}`);
  });

  if (Object.keys(deityHerbMap).length > 15) {
    console.log(`... and ${Object.keys(deityHerbMap).length - 15} more deities`);
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('✅ AUDIT COMPLETE');
  console.log('='.repeat(70));

  process.exit(0);
}

auditHerbs().catch(error => {
  console.error('Audit error:', error);
  process.exit(1);
});
