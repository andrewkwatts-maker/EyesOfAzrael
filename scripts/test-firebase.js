const admin = require('firebase-admin');
const sa = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://eyesofazrael-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();

db.ref('assets/rituals').limitToFirst(1).once('value')
  .then(s => {
    console.log('✓ Connection successful');
    console.log('Found', s.numChildren(), 'rituals');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  });
