const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

// Create timestamped backup folder
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
const backupDir = path.join(__dirname, '..', 'backups', `backup-${timestamp}`);

console.log('Creating backup directory:', backupDir);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Backup metadata
const backupMetadata = {
  timestamp: new Date().toISOString(),
  project: 'eyesofazrael',
  collections: [],
  totalDocuments: 0,
  backupPath: backupDir
};

async function downloadCollection(collectionName) {
  console.log(`\nDownloading collection: ${collectionName}`);

  try {
    const snapshot = await db.collection(collectionName).get();
    const documents = [];

    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });

    console.log(`  - Found ${documents.length} documents`);

    // Save to JSON file
    const filePath = path.join(backupDir, `${collectionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

    // Update metadata
    backupMetadata.collections.push({
      name: collectionName,
      documentCount: documents.length,
      filePath: `${collectionName}.json`
    });
    backupMetadata.totalDocuments += documents.length;

    return {
      collection: collectionName,
      count: documents.length,
      success: true
    };
  } catch (error) {
    console.error(`  - ERROR: ${error.message}`);
    return {
      collection: collectionName,
      count: 0,
      success: false,
      error: error.message
    };
  }
}

async function getAllCollections() {
  console.log('Fetching all collections from Firestore...');
  const collections = await db.listCollections();
  return collections.map(col => col.id);
}

async function backupAllCollections() {
  console.log('='.repeat(80));
  console.log('FIRESTORE BACKUP STARTED');
  console.log('='.repeat(80));
  console.log('Timestamp:', backupMetadata.timestamp);
  console.log('Backup Directory:', backupDir);
  console.log('='.repeat(80));

  try {
    // Get all collection names
    const collectionNames = await getAllCollections();
    console.log(`\nFound ${collectionNames.length} collections:`, collectionNames.join(', '));

    const results = [];

    // Download each collection
    for (const collectionName of collectionNames) {
      const result = await downloadCollection(collectionName);
      results.push(result);
    }

    // Save metadata
    const metadataPath = path.join(backupDir, 'backup-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(backupMetadata, null, 2));

    // Create manifest
    const manifest = {
      backupDate: backupMetadata.timestamp,
      project: backupMetadata.project,
      totalCollections: backupMetadata.collections.length,
      totalDocuments: backupMetadata.totalDocuments,
      collections: backupMetadata.collections.map(c => ({
        name: c.name,
        documents: c.documentCount,
        file: c.filePath
      })),
      backupDirectory: backupDir
    };

    const manifestPath = path.join(backupDir, 'MANIFEST.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('BACKUP COMPLETE');
    console.log('='.repeat(80));
    console.log(`Total Collections: ${backupMetadata.collections.length}`);
    console.log(`Total Documents: ${backupMetadata.totalDocuments}`);
    console.log(`Backup Location: ${backupDir}`);
    console.log('\nCollection Summary:');

    results.forEach(r => {
      const status = r.success ? '✓' : '✗';
      console.log(`  ${status} ${r.collection}: ${r.count} documents`);
    });

    console.log('\nFiles created:');
    console.log(`  - backup-metadata.json`);
    console.log(`  - MANIFEST.json`);
    backupMetadata.collections.forEach(c => {
      console.log(`  - ${c.filePath}`);
    });

    console.log('='.repeat(80));

    return {
      success: true,
      backupDir,
      manifest
    };

  } catch (error) {
    console.error('\nBACKUP FAILED:', error);
    throw error;
  }
}

// Run backup
backupAllCollections()
  .then(result => {
    console.log('\nBackup completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nBackup failed:', error);
    process.exit(1);
  });
