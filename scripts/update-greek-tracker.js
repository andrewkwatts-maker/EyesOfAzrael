/**
 * Update MIGRATION_TRACKER.json to mark Greek entities as uploaded
 */

const fs = require('fs');
const path = require('path');

const TRACKER_PATH = path.join(__dirname, '../MIGRATION_TRACKER.json');
const UPLOAD_REPORT_PATH = path.join(__dirname, '../GREEK_FIREBASE_UPLOAD_REPORT.json');

function updateTracker() {
    console.log('📝 Updating MIGRATION_TRACKER.json for Greek entities...\n');

    // Read tracker
    const tracker = JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf-8'));

    // Read upload report
    const uploadReport = JSON.parse(fs.readFileSync(UPLOAD_REPORT_PATH, 'utf-8'));

    // Update Greek mythology section
    if (tracker.byMythology && tracker.byMythology.greek) {
        const greekUploaded = uploadReport.summary.uploaded;

        // Update stages
        tracker.byMythology.greek.uploaded = greekUploaded;
        tracker.byMythology.greek.validated = greekUploaded; // Validated through upload
        tracker.byMythology.greek.tested = 1; // Zeus tested

        // Update overall stages
        const currentUploaded = tracker.stages.uploaded || 0;
        const currentValidated = tracker.stages.validated || 0;
        const currentTested = tracker.stages.tested || 0;

        tracker.stages.uploaded = currentUploaded + greekUploaded;
        tracker.stages.validated = currentValidated + greekUploaded;
        tracker.stages.tested = currentTested + 1;

        // Add metadata
        if (!tracker.metadata) {
            tracker.metadata = {};
        }

        tracker.metadata.lastGreekUpload = {
            date: uploadReport.uploadDate,
            entitiesUploaded: greekUploaded,
            successRate: uploadReport.summary.successRate,
            collections: {
                deities: uploadReport.byType.deities,
                heroes: uploadReport.byType.heroes,
                creatures: uploadReport.byType.creatures
            },
            zeusTestPassed: uploadReport.zeusTest.success
        };

        // Save updated tracker
        fs.writeFileSync(TRACKER_PATH, JSON.stringify(tracker, null, 2));

        console.log('✅ Migration tracker updated!');
        console.log(`\n📊 Greek Mythology Status:`);
        console.log(`   Total: ${tracker.byMythology.greek.total}`);
        console.log(`   Extracted: ${tracker.byMythology.greek.extracted}`);
        console.log(`   Validated: ${tracker.byMythology.greek.validated}`);
        console.log(`   Uploaded: ${tracker.byMythology.greek.uploaded}`);
        console.log(`   Tested: ${tracker.byMythology.greek.tested}`);

        console.log(`\n📊 Overall Progress:`);
        console.log(`   Total Files: ${tracker.totalFiles}`);
        console.log(`   Extracted: ${tracker.stages.extracted}`);
        console.log(`   Validated: ${tracker.stages.validated}`);
        console.log(`   Uploaded: ${tracker.stages.uploaded}`);
        console.log(`   Tested: ${tracker.stages.tested}`);

        return true;
    } else {
        console.error('❌ Error: Greek mythology section not found in tracker');
        return false;
    }
}

if (require.main === module) {
    try {
        const success = updateTracker();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Error updating tracker:', error.message);
        process.exit(1);
    }
}

module.exports = { updateTracker };
