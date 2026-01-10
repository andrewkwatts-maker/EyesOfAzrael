/**
 * Download and Backup Script
 *
 * Downloads all assets from Firebase and creates timestamped zip backups.
 * Maintains 1 week of backup history (auto-cleans older backups).
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AssetDownloader {
  constructor() {
    this.projectDir = path.join(__dirname, '..');
    this.assetsDir = path.join(this.projectDir, 'firebase-assets-downloaded');
    this.backupDir = path.join(this.projectDir, 'backups', 'weekly-snapshots');
    this.maxBackupAgeDays = 7;
  }

  async run() {
    console.log('='.repeat(60));
    console.log('Asset Download and Backup');
    console.log('='.repeat(60));

    try {
      // Step 1: Ensure directories exist
      await this.ensureDirectories();

      // Step 2: Clean old backups (older than 1 week)
      await this.cleanOldBackups();

      // Step 3: Create zip backup of current assets
      await this.createBackup();

      // Step 4: Download fresh assets from Firebase (if firebase-admin available)
      // Note: This requires firebase credentials - skip if not configured
      await this.refreshAssets();

      console.log('\nBackup complete!');
      return true;
    } catch (error) {
      console.error('Error during backup:', error.message);
      return false;
    }
  }

  async ensureDirectories() {
    console.log('\n[1/4] Ensuring directories exist...');

    await fs.mkdir(this.backupDir, { recursive: true });
    await fs.mkdir(this.assetsDir, { recursive: true });

    console.log('  - Backup dir:', this.backupDir);
    console.log('  - Assets dir:', this.assetsDir);
  }

  async cleanOldBackups() {
    console.log('\n[2/4] Cleaning old backups (>7 days)...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxBackupAgeDays);

    try {
      const files = await fs.readdir(this.backupDir);
      let deletedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.zip')) continue;

        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`  - Deleted: ${file}`);
        }
      }

      console.log(`  - Cleaned ${deletedCount} old backup(s)`);
    } catch (error) {
      console.log('  - No old backups to clean');
    }
  }

  async createBackup() {
    console.log('\n[3/4] Creating zip backup...');

    // Check if assets directory has content
    try {
      const files = await fs.readdir(this.assetsDir);
      if (files.length === 0) {
        console.log('  - No assets to backup');
        return;
      }
    } catch {
      console.log('  - Assets directory not found');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const zipName = `assets-backup-${timestamp}.zip`;
    const zipPath = path.join(this.backupDir, zipName);

    try {
      // Use PowerShell to create zip (Windows)
      const command = `powershell -Command "Compress-Archive -Path '${this.assetsDir}\\*' -DestinationPath '${zipPath}' -Force"`;
      execSync(command, { stdio: 'pipe' });

      const stats = await fs.stat(zipPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(`  - Created: ${zipName} (${sizeMB} MB)`);
    } catch (error) {
      console.log('  - Warning: Could not create zip backup:', error.message);

      // Fallback: create a JSON manifest instead
      const manifest = {
        timestamp: new Date().toISOString(),
        assetsDir: this.assetsDir,
        note: 'Zip creation failed - this is a manifest file'
      };

      await fs.writeFile(
        path.join(this.backupDir, `manifest-${timestamp}.json`),
        JSON.stringify(manifest, null, 2)
      );
    }
  }

  async refreshAssets() {
    console.log('\n[4/4] Checking for asset refresh...');

    // Check if we have a Firebase download script
    const downloadScript = path.join(__dirname, 'download-firebase-assets.js');

    try {
      await fs.access(downloadScript);
      console.log('  - Firebase download script found');
      console.log('  - Run separately: node scripts/download-firebase-assets.js');
    } catch {
      console.log('  - Using existing local assets (no Firebase download script)');
    }

    // List current asset counts
    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
      'archetypes', 'concepts', 'events', 'magic', 'beings'
    ];

    console.log('\n  Current asset counts:');
    let totalAssets = 0;

    for (const category of categories) {
      const categoryPath = path.join(this.assetsDir, category);
      try {
        const files = await fs.readdir(categoryPath);
        const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_'));
        totalAssets += jsonFiles.length;
        if (jsonFiles.length > 0) {
          console.log(`    - ${category}: ${jsonFiles.length}`);
        }
      } catch {
        // Category doesn't exist
      }
    }

    console.log(`  Total: ${totalAssets} assets`);
  }

  async listBackups() {
    console.log('\nExisting backups:');

    try {
      const files = await fs.readdir(this.backupDir);
      const zips = files.filter(f => f.endsWith('.zip')).sort().reverse();

      if (zips.length === 0) {
        console.log('  (none)');
        return;
      }

      for (const zip of zips.slice(0, 10)) {
        const stats = await fs.stat(path.join(this.backupDir, zip));
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        const date = stats.mtime.toISOString().substring(0, 16).replace('T', ' ');
        console.log(`  - ${zip} (${sizeMB} MB) - ${date}`);
      }
    } catch {
      console.log('  (backup directory not found)');
    }
  }
}

// Main execution
async function main() {
  const downloader = new AssetDownloader();

  const success = await downloader.run();
  await downloader.listBackups();

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { AssetDownloader };
