const admin = require('firebase-admin');
const serviceAccount = require('../FIREBASE/firebase-service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function verifyCollections() {
    const collections = [
        'mythologies',
        'deities',
        'heroes',
        'creatures',
        'items',
        'places',
        'concepts',
        'magic_systems',
        'user_theories',
        'submissions',
        'users',
        'herbs',
        'rituals',
        'texts',
        'symbols',
        'cosmology'
    ];

    console.log('\n' + '='.repeat(80));
    console.log('FIRESTORE DATA VERIFICATION');
    console.log('='.repeat(80) + '\n');

    const results = {};

    for (const collectionName of collections) {
        try {
            const snapshot = await db.collection(collectionName).count().get();
            const count = snapshot.data().count;
            results[collectionName] = count;

            const status = count > 0 ? '✅' : '⚠️ ';
            console.log(`${status} ${collectionName.padEnd(25)} ${count.toString().padStart(5)} documents`);
        } catch (error) {
            results[collectionName] = 'ERROR';
            console.log(`❌ ${collectionName.padEnd(25)} Error: ${error.message}`);
        }
    }

    const totalDocs = Object.values(results)
        .filter(v => typeof v === 'number')
        .reduce((sum, count) => sum + count, 0);

    console.log('\n' + '='.repeat(80));
    console.log(`Total Documents: ${totalDocs}`);
    console.log('='.repeat(80) + '\n');

    return results;
}

verifyCollections()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
