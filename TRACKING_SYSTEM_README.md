# Migration Tracking System - User Guide

## Overview

The Eyes of Azrael migration tracking system provides comprehensive real-time monitoring of the migration process across all 582 content files through 6 distinct stages.

---

## System Components

### 1. MIGRATION_TRACKER.json
**Purpose:** Central data store for all tracking information

**Contents:**
- Total file count
- Stage completion statistics
- Per-mythology breakdowns
- Per-entity-type breakdowns
- Individual file tracking with stages and issues
- Timestamps (start time, last update)

**Location:** `./MIGRATION_TRACKER.json`

### 2. progress-dashboard.html
**Purpose:** Real-time visual dashboard for monitoring progress

**Features:**
- Overall progress visualization
- Stage-by-stage completion tracking
- Mythology breakdown with mini progress bars
- Entity type statistics
- Recent activity log
- Issues and blockers display
- Estimated completion time
- Auto-refresh every 30 seconds

**How to Use:**
```bash
# Open in your browser
start progress-dashboard.html
# or
open progress-dashboard.html
```

**Location:** `./progress-dashboard.html`

### 3. scripts/update-tracker.js
**Purpose:** CLI utility for updating tracking data

**Available Commands:**

```bash
# Mark a specific file stage as complete
node scripts/update-tracker.js mark "mythos/greek/deities/zeus.html" extracted

# Mark a file stage as incomplete (rollback)
node scripts/update-tracker.js mark "mythos/greek/deities/zeus.html" extracted false

# Mark all files in a mythology at a specific stage
node scripts/update-tracker.js mark-batch greek uploaded

# Log an issue for a file
node scripts/update-tracker.js issue "mythos/greek/deities/zeus.html" "Missing family section" warning

# Log an error
node scripts/update-tracker.js issue "mythos/greek/deities/zeus.html" "File corrupted" error

# Clear all issues for a file
node scripts/update-tracker.js clear-issues "mythos/greek/deities/zeus.html"

# Log an activity
node scripts/update-tracker.js log "Started extraction phase" "Extraction Agent 1"

# Print progress report to console
node scripts/update-tracker.js report

# Get statistics as JSON
node scripts/update-tracker.js stats
```

**Location:** `./scripts/update-tracker.js`

### 4. scripts/initialize-tracker.js
**Purpose:** Initialize tracker from content inventory

**Usage:**
```bash
# WARNING: This resets all progress!
node scripts/initialize-tracker.js
```

**When to Use:**
- Initial setup (already done)
- If tracker.json becomes corrupted
- If you need to restart tracking from scratch

**Location:** `./scripts/initialize-tracker.js`

### 5. MIGRATION_LOG.md
**Purpose:** Human-readable activity log with timestamps

**Contents:**
- Timestamped activity entries
- Agent assignments
- Milestone tracking
- Issue tracking
- Daily progress reports
- Phase progress tracking
- Statistics snapshots

**Auto-Updated By:**
- All tracking utilities
- Agent activities

**Location:** `./MIGRATION_LOG.md`

---

## Migration Stages

Each file goes through 6 stages:

1. **Extracted** - Data extracted from HTML to JSON
2. **Validated** - JSON validated against schema
3. **Uploaded** - Data uploaded to Firebase
4. **Converted** - HTML page converted to dynamic template
5. **Tested** - Visual fidelity and functionality tested
6. **Deployed** - Live and accessible

---

## Quick Start Guide

### For Monitoring Progress

1. Open the dashboard:
   ```bash
   start progress-dashboard.html
   ```

2. The dashboard will show:
   - Overall progress percentage
   - Stage-by-stage completion
   - Mythology breakdowns
   - Recent activities
   - Any issues or blockers

3. Dashboard auto-refreshes every 30 seconds

### For Updating Progress

**Example: You've extracted Zeus entity**
```bash
node scripts/update-tracker.js mark "mythos/greek/deities/zeus.html" extracted
```

**Example: You've completed all stages up to upload for Odin**
```javascript
const tracker = require('./scripts/update-tracker.js');
tracker.markStagesUpTo('mythos/norse/deities/odin.html', 'uploaded');
```

**Example: You've uploaded all Greek entities**
```bash
node scripts/update-tracker.js mark-batch greek uploaded
```

**Example: Log an issue**
```bash
node scripts/update-tracker.js issue "mythos/egyptian/deities/ra.html" "Hieroglyphs not rendering" warning
```

### For Viewing Reports

**Console Report:**
```bash
node scripts/update-tracker.js report
```

**JSON Stats:**
```bash
node scripts/update-tracker.js stats
```

**Activity Log:**
```bash
# View in text editor
code MIGRATION_LOG.md
```

---

## Programmatic Usage

### In Node.js Scripts

```javascript
const tracker = require('./scripts/update-tracker.js');

// Load tracker data
const data = tracker.loadTracker();

// Mark a stage complete
tracker.markStageComplete('mythos/greek/deities/zeus.html', 'extracted', true);

// Mark multiple stages
tracker.markStagesUpTo('mythos/greek/deities/zeus.html', 'uploaded');

// Mark all files in a mythology
tracker.markMythologyStage('greek', 'extracted', true);

// Log an issue
tracker.logIssue('mythos/greek/deities/zeus.html', 'Missing description', 'warning');

// Clear issues
tracker.clearIssues('mythos/greek/deities/zeus.html');

// Log activity
tracker.logActivity('Starting Greek extraction', 'Extraction Agent 1');

// Get statistics
const stats = tracker.getStats();
console.log(`Overall progress: ${stats.overallPercentage}%`);

// Print report
tracker.printReport();
```

### In Extraction Scripts

```javascript
const tracker = require('./scripts/update-tracker.js');
const fs = require('fs');

async function extractEntity(filePath) {
  try {
    // Extract data from HTML
    const data = await extractFromHTML(filePath);

    // Mark extracted
    tracker.markStageComplete(filePath, 'extracted', true);

    // Validate
    const isValid = await validateData(data);
    if (isValid) {
      tracker.markStageComplete(filePath, 'validated', true);
    } else {
      tracker.logIssue(filePath, 'Validation failed', 'error');
    }

    // Log activity
    tracker.logActivity(`Extracted and validated ${filePath}`, 'Extraction Agent');

  } catch (error) {
    tracker.logIssue(filePath, error.message, 'error');
  }
}
```

---

## Data Structure

### Tracker JSON Structure

```json
{
  "totalFiles": 582,
  "stages": {
    "extracted": 0,
    "validated": 0,
    "uploaded": 0,
    "converted": 0,
    "tested": 0,
    "deployed": 0
  },
  "byMythology": {
    "greek": {
      "total": 190,
      "extracted": 0,
      "validated": 0,
      "uploaded": 0,
      "converted": 0,
      "tested": 0,
      "deployed": 0
    }
  },
  "byEntityType": {
    "deity": {
      "total": 300,
      "extracted": 0,
      "validated": 0,
      "uploaded": 0,
      "converted": 0,
      "tested": 0,
      "deployed": 0
    }
  },
  "files": [
    {
      "path": "mythos/greek/deities/zeus.html",
      "entity": "zeus",
      "entityName": "Zeus",
      "mythology": "greek",
      "type": "deity",
      "stages": {
        "extracted": false,
        "validated": false,
        "uploaded": false,
        "converted": false,
        "tested": false,
        "deployed": false
      },
      "issues": []
    }
  ],
  "startTime": "2025-12-15T00:00:00.000Z",
  "lastUpdate": "2025-12-15T00:00:00.000Z"
}
```

### File Entry Structure

```json
{
  "path": "mythos/greek/deities/zeus.html",
  "entity": "zeus",
  "entityName": "Zeus",
  "mythology": "greek",
  "type": "deity",
  "stages": {
    "extracted": false,
    "validated": false,
    "uploaded": false,
    "converted": false,
    "tested": false,
    "deployed": false
  },
  "issues": [
    {
      "message": "Missing family section",
      "severity": "warning",
      "timestamp": "2025-12-15T12:00:00.000Z"
    }
  ]
}
```

---

## Statistics Available

### Overall Statistics
- Total files
- Overall completion percentage
- Completed stages / Total stages
- Files per stage
- Total issues

### Per-Mythology Statistics
- Total files
- Completion per stage
- Progress percentage
- Issues count

### Per-Entity-Type Statistics
- Total files
- Completion per stage
- Progress percentage

---

## Best Practices

### 1. Always Use Tracking Utilities
- Never manually edit MIGRATION_TRACKER.json
- Always use `update-tracker.js` functions
- Ensures data integrity and proper logging

### 2. Log Activities Regularly
```bash
node scripts/update-tracker.js log "Starting extraction" "Agent Name"
```

### 3. Report Issues Immediately
```bash
node scripts/update-tracker.js issue "path/to/file" "Issue description" "warning"
```

### 4. Monitor Dashboard Regularly
- Check for blockers
- Monitor progress velocity
- Identify slow stages

### 5. Backup Before Major Operations
```bash
cp MIGRATION_TRACKER.json MIGRATION_TRACKER.backup.json
```

### 6. Use Batch Operations for Efficiency
```bash
# Instead of marking 190 files individually
node scripts/update-tracker.js mark-batch greek extracted
```

---

## Troubleshooting

### Dashboard Not Loading
1. Check that MIGRATION_TRACKER.json exists
2. Check browser console for errors
3. Ensure file paths are correct
4. Try refreshing the page

### Tracker Out of Sync
1. Run progress report: `node scripts/update-tracker.js report`
2. Check for file system issues
3. Restore from backup if needed:
   ```bash
   cp MIGRATION_TRACKER.backup.json MIGRATION_TRACKER.json
   ```

### Stats Don't Match Visual Inspection
1. Re-initialize tracker (WARNING: loses progress):
   ```bash
   node scripts/initialize-tracker.js
   ```
2. Or manually audit and correct specific entries

### Performance Issues
- Dashboard is lightweight and should load instantly
- If slow, check file size of tracker.json
- Consider archiving old log entries

---

## Advanced Features

### Custom Reports

```javascript
const tracker = require('./scripts/update-tracker.js');

// Get detailed mythology breakdown
const data = tracker.loadTracker();
const mythStats = data.byMythology;

Object.entries(mythStats).forEach(([myth, stats]) => {
  const progress = (stats.deployed / stats.total * 100).toFixed(1);
  console.log(`${myth}: ${progress}% complete`);
});
```

### Issue Analysis

```javascript
const tracker = require('./scripts/update-tracker.js');
const data = tracker.loadTracker();

// Find all files with errors
const filesWithErrors = data.files.filter(file =>
  file.issues.some(issue => issue.severity === 'error')
);

console.log(`Files with errors: ${filesWithErrors.length}`);
filesWithErrors.forEach(file => {
  console.log(`- ${file.path}`);
  file.issues.forEach(issue => {
    if (issue.severity === 'error') {
      console.log(`  ERROR: ${issue.message}`);
    }
  });
});
```

### Progress Velocity Tracking

```javascript
// Add to daily cron job
const tracker = require('./scripts/update-tracker.js');
const stats = tracker.getStats();

const dailyReport = {
  date: new Date().toISOString(),
  progress: stats.overallPercentage,
  deployed: stats.stages.deployed,
  issues: stats.issueCount
};

// Log to tracking database
console.log(JSON.stringify(dailyReport));
```

---

## File Locations Summary

```
h:\Github\EyesOfAzrael\
├── MIGRATION_TRACKER.json           # Main tracking data
├── MIGRATION_TRACKER.backup.json    # Backup
├── MIGRATION_LOG.md                 # Activity log
├── progress-dashboard.html          # Visual dashboard
├── TRACKING_SYSTEM_README.md        # This file
├── CONTENT_INVENTORY.csv            # Source inventory
└── scripts/
    ├── initialize-tracker.js        # Initialize tracker
    └── update-tracker.js            # Update utilities
```

---

## Support

For issues or questions about the tracking system:
1. Check this README
2. Review MIGRATION_LOG.md for recent activities
3. Run diagnostic: `node scripts/update-tracker.js report`
4. Check dashboard for visual status

---

**System Version:** 1.0
**Last Updated:** 2025-12-15
**Status:** OPERATIONAL ✅

---

*This tracking system is designed to provide complete visibility into the migration process and ensure no file or stage is overlooked.*
