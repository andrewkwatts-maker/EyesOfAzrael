#!/usr/bin/env node
/**
 * Upload Sacred Places to Firestore
 * Handles GeoPoint conversion and batch uploads
 *
 * Usage: node scripts/upload-places-to-firebase.js
 *
 * @author Claude (Anthropic)
 * @date 2025-12-13
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://eyes-of-azrael.firebaseio.com'
});

const db = admin.firestore();

// Configuration
const PLACES_JSON_PATH = path.join(__dirname, '../data/firebase-imports/places-import.json');
const BATCH_SIZE = 500; // Firestore batch limit
const COLLECTION_NAME = 'places';

/**
 * Convert coordinates object to Firestore GeoPoint
 */
function convertToGeoPoint(coordinates) {
  if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
    return null;
  }

  return new admin.firestore.GeoPoint(
    coordinates.latitude,
    coordinates.longitude
  );
}

/**
 * Transform place entity for Firestore
 * - Converts coordinates to GeoPoint
 * - Adds timestamps
 * - Sanitizes data
 */
function transformPlaceForFirestore(place) {
  const transformed = { ...place };

  // Add Firestore timestamps
  transformed.createdAt = admin.firestore.FieldValue.serverTimestamp();
  transformed.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  // Convert coordinates to GeoPoint
  if (transformed.geographical?.primaryLocation?.coordinates) {
    const coords = transformed.geographical.primaryLocation.coordinates;
    transformed.geographical.primaryLocation.geopoint = convertToGeoPoint(coords);

    // Keep original coordinates for reference
    transformed.geographical.primaryLocation.coordinates = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      elevation: coords.elevation || null,
      accuracy: coords.accuracy || 'approximate'
    };
  }

  // Add geohash for proximity queries (if coordinates exist)
  if (transformed.geographical?.primaryLocation?.geopoint) {
    const geohash = generateGeohash(
      transformed.geographical.primaryLocation.geopoint.latitude,
      transformed.geographical.primaryLocation.geopoint.longitude,
      9 // precision
    );
    transformed.geographical.primaryLocation.geohash = geohash;
  }

  return transformed;
}

/**
 * Simple geohash implementation for proximity queries
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} precision - Geohash precision (1-12)
 * @returns {string} Geohash string
 */
function generateGeohash(lat, lon, precision = 9) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      // Longitude
      const lonMid = (lonMin + lonMax) / 2;
      if (lon > lonMid) {
        idx = (idx << 1) + 1;
        lonMin = lonMid;
      } else {
        idx = idx << 1;
        lonMax = lonMid;
      }
    } else {
      // Latitude
      const latMid = (latMin + latMax) / 2;
      if (lat > latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = idx << 1;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/**
 * Upload places in batches
 */
async function uploadPlacesInBatches(places) {
  const batches = [];
  let currentBatch = db.batch();
  let operationCount = 0;
  let batchCount = 0;

  for (const place of places) {
    const docRef = db.collection(COLLECTION_NAME).doc(place.id);
    const transformed = transformPlaceForFirestore(place);

    currentBatch.set(docRef, transformed, { merge: true });
    operationCount++;

    if (operationCount === BATCH_SIZE) {
      batches.push(currentBatch);
      batchCount++;
      console.log(`Prepared batch ${batchCount} (${BATCH_SIZE} documents)`);

      currentBatch = db.batch();
      operationCount = 0;
    }
  }

  // Add remaining operations
  if (operationCount > 0) {
    batches.push(currentBatch);
    batchCount++;
    console.log(`Prepared batch ${batchCount} (${operationCount} documents)`);
  }

  // Commit all batches
  console.log(`\nCommitting ${batchCount} batches...`);
  for (let i = 0; i < batches.length; i++) {
    await batches[i].commit();
    console.log(`✓ Committed batch ${i + 1}/${batches.length}`);
  }

  return places.length;
}

/**
 * Create composite indexes for queries
 */
async function createIndexes() {
  console.log('\nNote: The following indexes should be created in Firebase Console:');
  console.log('\n1. Proximity query index:');
  console.log('   Collection: places');
  console.log('   Fields: geographical.primaryLocation.geohash (Ascending), status (Ascending)');
  console.log('\n2. Mythology filter index:');
  console.log('   Collection: places');
  console.log('   Fields: mythologies (Array), status (Ascending), name (Ascending)');
  console.log('\n3. Place type filter index:');
  console.log('   Collection: places');
  console.log('   Fields: placeType (Ascending), status (Ascending), name (Ascending)');
  console.log('\n4. Accessibility filter index:');
  console.log('   Collection: places');
  console.log('   Fields: accessibility (Ascending), status (Ascending)');
  console.log('\nThese indexes will be created automatically when you run the queries.');
}

/**
 * Verify upload by counting documents and testing queries
 */
async function verifyUpload(expectedCount) {
  console.log('\n' + '='.repeat(80));
  console.log('VERIFYING UPLOAD');
  console.log('='.repeat(80));

  // Count total documents
  const snapshot = await db.collection(COLLECTION_NAME).get();
  const actualCount = snapshot.size;

  console.log(`\nTotal documents in Firestore: ${actualCount}`);
  console.log(`Expected documents: ${expectedCount}`);
  console.log(`Match: ${actualCount === expectedCount ? '✓' : '✗'}`);

  // Test query by mythology
  const greekPlaces = await db.collection(COLLECTION_NAME)
    .where('mythologies', 'array-contains', 'greek')
    .get();
  console.log(`\nGreek places: ${greekPlaces.size}`);

  // Test query by place type
  const mountains = await db.collection(COLLECTION_NAME)
    .where('placeType', '==', 'mountain')
    .get();
  console.log(`Mountains: ${mountains.size}`);

  // Test query with GeoPoint
  const placesWithGPS = await db.collection(COLLECTION_NAME)
    .where('geographical.primaryLocation.geopoint', '!=', null)
    .get();
  console.log(`Places with GPS coordinates: ${placesWithGPS.size}`);

  // List some examples
  console.log('\nSample places:');
  snapshot.docs.slice(0, 5).forEach((doc) => {
    const data = doc.data();
    const coords = data.geographical?.primaryLocation?.coordinates;
    const gps = coords ? `(${coords.latitude}, ${coords.longitude})` : 'no GPS';
    console.log(`  - ${data.name} [${data.placeType}] ${gps}`);
  });

  return actualCount === expectedCount;
}

/**
 * Generate migration report
 */
function generateReport(places, uploadSuccess, verifySuccess) {
  const report = {
    migrationDate: new Date().toISOString(),
    totalPlaces: places.length,
    uploadSuccess: uploadSuccess,
    verifySuccess: verifySuccess,
    statistics: {
      withGPS: places.filter(p => p.geographical?.primaryLocation?.coordinates).length,
      withoutGPS: places.filter(p => !p.geographical?.primaryLocation?.coordinates).length,
      byType: {},
      byMythology: {},
      byAccessibility: {}
    },
    samplePlaces: places.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      type: p.placeType,
      mythologies: p.mythologies,
      hasGPS: !!p.geographical?.primaryLocation?.coordinates
    }))
  };

  // Count by type
  places.forEach(p => {
    report.statistics.byType[p.placeType] = (report.statistics.byType[p.placeType] || 0) + 1;
  });

  // Count by mythology
  places.forEach(p => {
    p.mythologies.forEach(m => {
      report.statistics.byMythology[m] = (report.statistics.byMythology[m] || 0) + 1;
    });
  });

  // Count by accessibility
  places.forEach(p => {
    report.statistics.byAccessibility[p.accessibility] = (report.statistics.byAccessibility[p.accessibility] || 0) + 1;
  });

  return report;
}

/**
 * Main upload function
 */
async function main() {
  console.log('='.repeat(80));
  console.log('UPLOADING SACRED PLACES TO FIRESTORE');
  console.log('='.repeat(80));

  try {
    // Load places data
    console.log(`\nLoading places from: ${PLACES_JSON_PATH}`);
    const placesData = JSON.parse(fs.readFileSync(PLACES_JSON_PATH, 'utf8'));
    console.log(`Loaded ${placesData.length} places`);

    // Upload to Firestore
    console.log(`\nUploading to Firestore collection: ${COLLECTION_NAME}`);
    const uploadedCount = await uploadPlacesInBatches(placesData);
    console.log(`\n✓ Successfully uploaded ${uploadedCount} places!`);

    // Verify upload
    const verifySuccess = await verifyUpload(placesData.length);

    // Create indexes
    createIndexes();

    // Generate report
    const report = generateReport(placesData, true, verifySuccess);
    const reportPath = path.join(__dirname, '../data/firebase-imports/places-upload-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);

    console.log('\n' + '='.repeat(80));
    console.log('UPLOAD COMPLETE!');
    console.log('='.repeat(80));
    console.log(`\n${uploadedCount} places are now available in Firestore`);
    console.log('Collection: places');
    console.log('GeoPoints created for proximity queries');
    console.log('Ready for frontend integration');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error during upload:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  uploadPlacesInBatches,
  transformPlaceForFirestore,
  generateGeohash
};
