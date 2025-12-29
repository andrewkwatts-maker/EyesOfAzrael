/**
 * Cleanup Invalid Files Script
 *
 * Purpose: Identify and archive non-entity files from firebase-assets-enhanced directory
 * that are causing validation failures.
 *
 * Targets:
 * - *_SUMMARY.md, *_REPORT.md files
 * - *_summary.json, *_report.json files
 * - enhancement-report.json files
 * - polishing-summary.json files
 * - Other non-entity JSON/MD files
 *
 * Usage:
 *   node scripts/cleanup-invalid-files.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'firebase-assets-enhanced');
const ARCHIVE_DIR = path.join(__dirname, '..', '_archive', 'validation-cleanup');

// Patterns to identify invalid files
const INVALID_PATTERNS = [
  /_SUMMARY\.md$/i,
  /_REPORT\.md$/i,
  /_summary\.json$/i,
  /_report\.json$/i,
  /enhancement-report\.json$/i,
  /polishing-summary\.json$/i,
  /^agent\d+_summary\.json$/i,
  /^_enhancement_summary\.json$/i,
  /^_all_enhanced\.json$/i,
  /^all_.*_enhanced\.json$/i,
  // Special documentation files that shouldn't be in entity directories
  /^ENHANCED_FIELDS_REFERENCE\.md$/i,
  /^MESOPOTAMIAN_DEITIES_SUMMARY\.md$/i,
  /^INDEX\.md$/i,
  /^README\.md$/i,
];

// Entity file patterns (these should NOT be moved)
const VALID_ENTITY_PATTERNS = [
  /^[a-z0-9_-]+\.json$/i, // Simple entity files
];

// Directories that should only contain entity files
const ENTITY_DIRS = [
  'deities',
  'creatures',
  'heroes',
  'places',
  'items',
  'herbs',
  'rituals',
  'texts',
  'symbols',
  'cosmology',
  'concepts',
  'events',
];

class FileCleanup {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.filesToMove = [];
    this.stats = {
      scanned: 0,
      toMove: 0,
      moved: 0,
      errors: 0,
    };
  }

  /**
   * Check if a file should be moved based on invalid patterns
   */
  isInvalidFile(fileName, filePath) {
    // Check against invalid patterns
    for (const pattern of INVALID_PATTERNS) {
      if (pattern.test(fileName)) {
        return true;
      }
    }

    // Special case: JSON files in batch directories
    if (fileName.endsWith('.json')) {
      const dirName = path.basename(path.dirname(filePath));

      // Files like enhanced-greek-deities.json, buddhist_enhanced.json, etc.
      if (fileName.includes('enhanced') && !fileName.match(/^[a-z0-9_-]+\.json$/)) {
        return true;
      }

      // Batch files in subdirectories
      if (fileName.includes('_enhanced.json') || fileName.includes('_items.json') ||
          fileName.includes('_places.json') || fileName.includes('_creatures.json')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Recursively scan directory for invalid files
   */
  scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      this.stats.scanned++;

      if (entry.isDirectory()) {
        this.scanDirectory(fullPath);
      } else if (entry.isFile()) {
        if (this.isInvalidFile(entry.name, fullPath)) {
          const relativePath = path.relative(SOURCE_DIR, fullPath);
          this.filesToMove.push({
            source: fullPath,
            relative: relativePath,
            name: entry.name,
          });
          this.stats.toMove++;
        }
      }
    }
  }

  /**
   * Move files to archive directory
   */
  moveFiles() {
    if (!fs.existsSync(ARCHIVE_DIR)) {
      if (!this.dryRun) {
        fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
        console.log(`✓ Created archive directory: ${ARCHIVE_DIR}`);
      } else {
        console.log(`[DRY RUN] Would create: ${ARCHIVE_DIR}`);
      }
    }

    for (const file of this.filesToMove) {
      const destPath = path.join(ARCHIVE_DIR, file.relative);
      const destDir = path.dirname(destPath);

      try {
        if (!this.dryRun) {
          // Create destination directory if it doesn't exist
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }

          // Move the file
          fs.renameSync(file.source, destPath);
          console.log(`✓ Moved: ${file.relative}`);
          this.stats.moved++;
        } else {
          console.log(`[DRY RUN] Would move: ${file.relative}`);
          console.log(`           to: ${path.relative(process.cwd(), destPath)}`);
        }
      } catch (error) {
        console.error(`✗ Error moving ${file.relative}: ${error.message}`);
        this.stats.errors++;
      }
    }
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('FILE CLEANUP REPORT');
    console.log('='.repeat(70));
    console.log(`Mode: ${this.dryRun ? 'DRY RUN (no changes made)' : 'LIVE'}`);
    console.log(`\nFiles scanned: ${this.stats.scanned}`);
    console.log(`Invalid files found: ${this.stats.toMove}`);

    if (!this.dryRun) {
      console.log(`Files moved: ${this.stats.moved}`);
      console.log(`Errors: ${this.stats.errors}`);
    }

    console.log('\n' + '-'.repeat(70));
    console.log('INVALID FILES:');
    console.log('-'.repeat(70));

    // Group by type
    const byExtension = {};
    for (const file of this.filesToMove) {
      const ext = path.extname(file.name);
      if (!byExtension[ext]) {
        byExtension[ext] = [];
      }
      byExtension[ext].push(file.relative);
    }

    for (const [ext, files] of Object.entries(byExtension).sort()) {
      console.log(`\n${ext || 'no extension'} (${files.length}):`);
      files.forEach(f => console.log(`  - ${f}`));
    }

    console.log('\n' + '='.repeat(70));

    if (this.dryRun) {
      console.log('\n💡 Run without --dry-run to actually move these files');
    } else {
      console.log(`\n✓ Files archived to: ${ARCHIVE_DIR}`);
    }
  }

  /**
   * Run the cleanup
   */
  run() {
    console.log('\nStarting file cleanup...');
    console.log(`Source: ${SOURCE_DIR}`);
    console.log(`Archive: ${ARCHIVE_DIR}\n`);

    // Scan for invalid files
    this.scanDirectory(SOURCE_DIR);

    // Move files (or simulate if dry run)
    if (this.filesToMove.length > 0) {
      console.log(`\nFound ${this.filesToMove.length} invalid files\n`);
      this.moveFiles();
    } else {
      console.log('\n✓ No invalid files found!');
    }

    // Generate report
    this.generateReport();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run cleanup
const cleanup = new FileCleanup(dryRun);
cleanup.run();

// Exit with error code if there were errors
process.exit(cleanup.stats.errors > 0 ? 1 : 0);
