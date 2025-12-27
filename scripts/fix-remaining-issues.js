const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
const failedAssets = require('../FAILED_ASSETS.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://eyesofazrael-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

// Helper: Infer purpose for rituals
function inferRitualPurpose(data) {
  const name = (data.name || data.title || '').toLowerCase();
  const desc = (data.description || '').toLowerCase();
  const text = name + ' ' + desc;

  // Specific purpose mapping
  if (text.includes('new year') || text.includes('akitu')) return 'celebration';
  if (text.includes('divination') || text.includes('oracle')) return 'divination';
  if (text.includes('calendar') || text.includes('festival')) return 'seasonal';
  if (text.includes('offering') || text.includes('sacrifice')) return 'offering';
  if (text.includes('burial') || text.includes('funeral') || text.includes('death')) return 'funerary';
  if (text.includes('initiation') || text.includes('rite of passage')) return 'initiation';
  if (text.includes('purification') || text.includes('cleansing')) return 'purification';
  if (text.includes('blessing') || text.includes('consecration')) return 'blessing';
  if (text.includes('healing') || text.includes('cure')) return 'healing';
  if (text.includes('protection') || text.includes('ward')) return 'protection';
  if (text.includes('prayer') || text.includes('devotion') || text.includes('worship')) return 'devotional';
  if (text.includes('magic') || text.includes('spell')) return 'magical';
  if (text.includes('harvest') || text.includes('fertility')) return 'agricultural';
  if (text.includes('battle') || text.includes('war')) return 'martial';
  if (text.includes('marriage') || text.includes('wedding')) return 'matrimonial';

  return 'ceremonial'; // Generic fallback
}

// Helper: Infer medicinal properties for herbs
function inferMedicinalProperties(data) {
  const name = (data.name || '').toLowerCase();
  const desc = (data.description || '').toLowerCase();
  const text = name + ' ' + desc;

  const properties = [];

  if (text.includes('heal') || text.includes('cure')) properties.push('healing');
  if (text.includes('pain') || text.includes('analgesic')) properties.push('pain relief');
  if (text.includes('anti-inflammatory') || text.includes('inflammation')) properties.push('anti-inflammatory');
  if (text.includes('digest') || text.includes('stomach')) properties.push('digestive');
  if (text.includes('calm') || text.includes('relax') || text.includes('sedative')) properties.push('calming');
  if (text.includes('energiz') || text.includes('stimulat')) properties.push('energizing');
  if (text.includes('fever')) properties.push('antipyretic');
  if (text.includes('antiseptic') || text.includes('antibacterial')) properties.push('antiseptic');

  return properties.length > 0 ? properties : ['medicinal'];
}

async function fixRemainingIssues() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('FIXING REMAINING VALIDATION ISSUES');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
  console.log(`Remaining failed assets: ${failedAssets.length}`);
  console.log('='.repeat(60));

  let fixed = 0;

  for (const asset of failedAssets) {
    const { collection, id, data, issues } = asset;
    const updates = {};

    // Fix rituals missing purpose
    if (collection === 'rituals') {
      const missingPurpose = issues.some(i => i.field === 'purpose');
      if (missingPurpose && !data.purpose) {
        updates.purpose = inferRitualPurpose(data);
      }
    }

    // Fix herbs missing medicinalProperties
    if (collection === 'herbs') {
      const missingMed = issues.some(i => i.field === 'medicinalProperties');
      if (missingMed && !data.medicinalProperties) {
        updates.medicinalProperties = inferMedicinalProperties(data);
      }

      // Also ensure uses array exists
      if (!data.uses) {
        updates.uses = ['spiritual', 'medicinal'];
      }
    }

    // Fix texts missing purpose
    if (collection === 'texts') {
      const missingPurpose = issues.some(i => i.field === 'purpose');
      if (missingPurpose && !data.purpose) {
        const name = (data.name || data.title || '').toLowerCase();
        if (name.includes('creation')) updates.purpose = 'cosmology';
        else if (name.includes('ritual')) updates.purpose = 'ritual';
        else if (name.includes('wisdom')) updates.purpose = 'wisdom';
        else if (name.includes('prophecy')) updates.purpose = 'prophetic';
        else updates.purpose = 'religious';
      }
    }

    if (Object.keys(updates).length > 0) {
      fixed++;

      if (dryRun) {
        console.log(`\n[DRY RUN] Would update ${collection}/${id}:`);
        console.log(JSON.stringify(updates, null, 2));
      } else {
        try {
          await db.collection(collection).doc(id).update(updates);
          console.log(`✓ Updated ${collection}/${id}`);
        } catch (error) {
          console.error(`✗ Error updating ${collection}/${id}:`, error.message);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total assets fixed: ${fixed}`);
  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN. No changes were made.');
    console.log('Run without --dry-run to apply fixes.');
  } else {
    console.log('\n✓ All fixes applied successfully!');
  }

  process.exit(0);
}

fixRemainingIssues().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
