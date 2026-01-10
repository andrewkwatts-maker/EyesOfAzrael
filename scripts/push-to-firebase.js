/**
 * Firebase Asset Upload Script with Schema Validation
 *
 * Validates all assets against the connection schema before uploading to Firebase.
 * Only uploads assets that pass validation, ensuring data quality.
 *
 * Usage:
 *   node push-to-firebase.js [options]
 *
 * Options:
 *   --dry-run        Validate without uploading
 *   --force          Upload even with warnings (still blocks on errors)
 *   --category=X     Only upload specific category (deities, heroes, etc.)
 *   --id=X           Only upload specific asset by ID
 *   --skip-validation Skip validation (use with caution!)
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const admin = require('firebase-admin');

class FirebaseUploader {
  findAssetsPath() {
    // Prefer firebase-assets-downloaded in project root
    const projectDir = path.join(__dirname, '..');
    const mainAssetsPath = path.join(projectDir, 'firebase-assets-downloaded');

    if (fsSync.existsSync(path.join(mainAssetsPath, 'deities'))) {
      return mainAssetsPath;
    }

    // Fallback to backups directory
    const backupsDir = path.join(projectDir, 'backups');

    try {
      const dirs = fsSync.readdirSync(backupsDir);
      const assetDirs = dirs
        .filter(d => d.startsWith('firebase-assets'))
        .sort()
        .reverse();

      for (const dir of assetDirs) {
        const fullPath = path.join(backupsDir, dir);
        const deitiesPath = path.join(fullPath, 'deities');
        if (fsSync.existsSync(deitiesPath)) {
          return fullPath;
        }
      }
    } catch (e) {
      // Fallback
    }

    return path.join(backupsDir, 'firebase-assets-pre-enrichment');
  }

  constructor(options = {}) {
    this.assetsPath = options.assetsPath || this.findAssetsPath();
    this.dryRun = options.dryRun || false;
    this.force = options.force || false;
    this.skipValidation = options.skipValidation || false;
    this.targetCategory = options.category || null;
    this.targetId = options.id || null;

    this.allAssets = new Map();
    this.validationResults = {
      passed: [],
      failed: [],
      warnings: []
    };

    // Schema definitions
    this.validRelationshipTypes = [
      'parent', 'father', 'mother', 'child', 'son', 'daughter',
      'sibling', 'brother', 'sister', 'spouse', 'consort', 'lover',
      'offspring', 'ancestor', 'descendant', 'ally', 'enemy', 'rival',
      'companion', 'friend', 'servant', 'master', 'worshipper', 'devotee',
      'mentor', 'student', 'teacher', 'creator', 'creation', 'created_by',
      'slayer', 'victim', 'slain_by', 'aspect', 'avatar', 'incarnation',
      'syncretism', 'equivalent', 'parallel', 'derived', 'influenced',
      'contrasts', 'similar', 'related', 'historical', 'thematic', 'symbolic',
      'wielder', 'wielded_by', 'ruler', 'ruled_by', 'guardian', 'guarded_by',
      'associated', 'linked', 'connected', 'origin', 'destination',
      'contains', 'contained_in', 'member', 'group', 'other'
    ];

    this.validEntityTypes = [
      'deity', 'hero', 'creature', 'item', 'place', 'text',
      'ritual', 'symbol', 'herb', 'cosmology', 'concept',
      'event', 'archetype', 'magic', 'mythology', 'being'
    ];

    this.categoryToCollection = {
      'deities': 'deities',
      'heroes': 'heroes',
      'creatures': 'creatures',
      'items': 'items',
      'places': 'places',
      'texts': 'texts',
      'cosmology': 'cosmology',
      'rituals': 'rituals',
      'herbs': 'herbs',
      'symbols': 'symbols',
      'events': 'events',
      'concepts': 'concepts',
      'archetypes': 'archetypes',
      'magic': 'magic',
      'mythologies': 'mythologies',
      'beings': 'beings',
      'figures': 'figures',
      'angels': 'angels'
    };

    this.db = null;
  }

  async initializeFirebase() {
    if (this.dryRun) {
      console.log('DRY RUN MODE - Firebase not initialized');
      return;
    }

    try {
      // Try to load service account
      const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      this.db = admin.firestore();
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error.message);
      console.log('Running in validation-only mode');
      this.dryRun = true;
    }
  }

  async loadAllAssets() {
    console.log('Loading assets from:', this.assetsPath);

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
      'events', 'concepts', 'archetypes', 'magic', 'angels',
      'beings', 'figures', 'mythologies'
    ];

    for (const category of categories) {
      if (this.targetCategory && category !== this.targetCategory) continue;

      const categoryPath = path.join(this.assetsPath, category);
      await this.loadCategory(category, categoryPath);
    }

    console.log(`Loaded ${this.allAssets.size} assets`);
  }

  async loadCategory(category, categoryPath) {
    try {
      const stats = await fs.stat(categoryPath);
      if (!stats.isDirectory()) return;
    } catch {
      return;
    }

    const entries = await fs.readdir(categoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

      const entryPath = path.join(categoryPath, entry.name);

      if (entry.isDirectory()) {
        await this.loadSubdirectory(category, entryPath);
      } else if (entry.name.endsWith('.json')) {
        await this.loadAssetFile(entryPath, category);
      }
    }
  }

  async loadSubdirectory(category, dirPath) {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        await this.loadAssetFile(path.join(dirPath, file), category);
      }
    }
  }

  async loadAssetFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const asset = JSON.parse(content);

      if (asset.id) {
        if (this.targetId && asset.id !== this.targetId) return;

        asset._category = category;
        asset._filePath = filePath;
        this.allAssets.set(asset.id, asset);
      }
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error.message);
    }
  }

  validateAsset(asset) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!asset.id) {
      errors.push({ field: 'id', message: 'Missing required field: id' });
    } else if (!/^[a-z0-9_-]+$/.test(asset.id)) {
      errors.push({ field: 'id', message: 'ID must be lowercase alphanumeric with hyphens/underscores' });
    }

    if (!asset.name) {
      errors.push({ field: 'name', message: 'Missing required field: name' });
    }

    // Validate family structure
    if (asset.family) {
      this.validateFamily(asset, errors, warnings);
    }

    // Validate relatedEntities
    if (asset.relatedEntities) {
      this.validateRelatedEntities(asset, errors, warnings);
    }

    // Validate allies/enemies
    if (asset.allies) {
      this.validateEntityReferences(asset, 'allies', asset.allies, errors, warnings);
    }
    if (asset.enemies) {
      this.validateEntityReferences(asset, 'enemies', asset.enemies, errors, warnings);
    }

    // Validate corpus search
    if (asset.corpusSearch) {
      this.validateCorpusSearch(asset, errors, warnings);
    }

    // Validate sources
    if (asset.primarySources) {
      this.validateSources(asset, 'primarySources', asset.primarySources, errors, warnings);
    }
    if (asset.sources) {
      this.validateSources(asset, 'sources', asset.sources, errors, warnings);
    }

    return { errors, warnings };
  }

  validateFamily(asset, errors, warnings) {
    const family = asset.family;
    const familyFields = ['parents', 'children', 'siblings', 'consorts', 'ancestors', 'descendants'];

    for (const field of familyFields) {
      if (family[field] !== undefined) {
        if (typeof family[field] === 'string') {
          errors.push({
            field: `family.${field}`,
            message: 'Family field must be array of entityReferences, not string'
          });
        } else if (Array.isArray(family[field])) {
          this.validateEntityReferences(asset, `family.${field}`, family[field], errors, warnings);
        }
      }
    }
  }

  validateRelatedEntities(asset, errors, warnings) {
    const related = asset.relatedEntities;

    if (typeof related !== 'object' || related === null) {
      errors.push({ field: 'relatedEntities', message: 'Must be an object' });
      return;
    }

    for (const [category, entities] of Object.entries(related)) {
      if (!this.validEntityTypes.includes(category) &&
          !['symbols', 'events', 'deities', 'heroes', 'creatures', 'items', 'places', 'texts', 'rituals', 'concepts', 'archetypes'].includes(category)) {
        warnings.push({
          field: `relatedEntities.${category}`,
          message: `Unknown entity category: ${category}`
        });
      }

      if (Array.isArray(entities)) {
        this.validateEntityReferences(asset, `relatedEntities.${category}`, entities, errors, warnings);
      }
    }
  }

  validateEntityReferences(asset, field, references, errors, warnings) {
    if (!Array.isArray(references)) {
      errors.push({ field, message: 'Expected array of entity references' });
      return;
    }

    for (let i = 0; i < references.length; i++) {
      const ref = references[i];

      if (typeof ref === 'string') {
        warnings.push({
          field: `${field}[${i}]`,
          message: `String reference '${ref}' should be entityReference object`
        });
      } else if (typeof ref === 'object' && ref !== null) {
        this.validateEntityReference(asset, `${field}[${i}]`, ref, errors, warnings);
      } else {
        errors.push({
          field: `${field}[${i}]`,
          message: `Invalid reference type: ${typeof ref}`
        });
      }
    }
  }

  validateEntityReference(asset, field, ref, errors, warnings) {
    // Check for required fields
    if (!ref.id && !ref.name && !ref.link) {
      errors.push({
        field,
        message: 'Entity reference missing id, name, and link'
      });
      return;
    }

    // Warn if missing id (unless marked as unverified)
    if (!ref.id && (ref.name || ref.link) && !ref._unverified) {
      warnings.push({
        field,
        message: `Entity reference missing id field (name: ${ref.name})`
      });
    }

    // Warn if missing name
    if (!ref.name && ref.id) {
      warnings.push({
        field,
        message: `Entity reference missing name field (id: ${ref.id})`
      });
    }

    // Validate id format if present
    if (ref.id && !/^[a-z0-9_-]+$/i.test(ref.id)) {
      errors.push({
        field,
        message: `Invalid reference id format: ${ref.id}`
      });
    }

    // Validate relationship type if present
    if (ref.relationship && !this.validRelationshipTypes.includes(ref.relationship)) {
      warnings.push({
        field,
        message: `Unknown relationship type: ${ref.relationship}`
      });
    }

    // Check if referenced entity exists (warning only for non-unverified)
    if (ref.id && !ref._unverified) {
      const targetExists = this.allAssets.has(ref.id);
      if (!targetExists) {
        warnings.push({
          field,
          message: `Referenced entity '${ref.id}' not found in local assets`,
          severity: 'broken_link'
        });
      }
    }
  }

  validateCorpusSearch(asset, errors, warnings) {
    const corpus = asset.corpusSearch;

    if (typeof corpus !== 'object' || corpus === null) {
      errors.push({ field: 'corpusSearch', message: 'Must be an object' });
      return;
    }

    const validFields = ['canonical', 'variants', 'epithets', 'domains', 'symbols', 'places', 'concepts'];

    for (const [field, value] of Object.entries(corpus)) {
      if (value !== null && !Array.isArray(value)) {
        warnings.push({
          field: `corpusSearch.${field}`,
          message: 'Corpus search field must be an array'
        });
      }

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string') {
            warnings.push({
              field: `corpusSearch.${field}[${i}]`,
              message: 'Corpus search term must be a string'
            });
          }
        }
      }
    }
  }

  validateSources(asset, field, sources, errors, warnings) {
    if (!Array.isArray(sources)) {
      errors.push({ field, message: 'Sources must be an array' });
      return;
    }

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      if (typeof source !== 'object' || source === null) {
        errors.push({
          field: `${field}[${i}]`,
          message: 'Source must be an object'
        });
        continue;
      }

      if (!source.title && !source.text && !source.source) {
        warnings.push({
          field: `${field}[${i}]`,
          message: 'Source missing title/text identifier'
        });
      }

      if (source.url && !this.isValidUrl(source.url)) {
        errors.push({
          field: `${field}[${i}].url`,
          message: `Invalid URL: ${source.url}`
        });
      }
    }
  }

  isValidUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  async validateAll() {
    console.log('\nValidating assets...');

    for (const [id, asset] of this.allAssets) {
      const { errors, warnings } = this.validateAsset(asset);

      if (errors.length > 0) {
        this.validationResults.failed.push({
          id,
          name: asset.name,
          category: asset._category,
          errors,
          warnings
        });
      } else if (warnings.length > 0) {
        this.validationResults.warnings.push({
          id,
          name: asset.name,
          category: asset._category,
          warnings
        });

        // If force mode, treat warnings as passed
        if (this.force) {
          this.validationResults.passed.push({
            id,
            name: asset.name,
            category: asset._category,
            warnings
          });
        }
      } else {
        this.validationResults.passed.push({
          id,
          name: asset.name,
          category: asset._category
        });
      }
    }

    this.printValidationSummary();
  }

  printValidationSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total assets: ${this.allAssets.size}`);
    console.log(`Passed: ${this.validationResults.passed.length}`);
    console.log(`Warnings only: ${this.validationResults.warnings.length}`);
    console.log(`Failed: ${this.validationResults.failed.length}`);
    console.log('='.repeat(60));

    if (this.validationResults.failed.length > 0) {
      console.log('\nFAILED ASSETS (first 10):');
      for (const item of this.validationResults.failed.slice(0, 10)) {
        console.log(`\n  ${item.id} (${item.category}):`);
        for (const error of item.errors.slice(0, 3)) {
          console.log(`    ERROR: ${error.field} - ${error.message}`);
        }
      }
    }

    if (this.validationResults.warnings.length > 0 && !this.force) {
      console.log('\nASSETS WITH WARNINGS (first 10):');
      for (const item of this.validationResults.warnings.slice(0, 10)) {
        console.log(`\n  ${item.id} (${item.category}):`);
        for (const warning of item.warnings.slice(0, 3)) {
          console.log(`    WARNING: ${warning.field} - ${warning.message}`);
        }
      }
    }
  }

  cleanAssetForUpload(asset) {
    // Remove internal fields
    const cleaned = { ...asset };
    delete cleaned._category;
    delete cleaned._filePath;

    // Add upload metadata
    cleaned._uploadedAt = new Date().toISOString();
    cleaned._uploadedBy = 'push-to-firebase.js';

    return cleaned;
  }

  async uploadAssets() {
    if (this.dryRun) {
      console.log('\nDRY RUN - No assets uploaded');
      return;
    }

    if (this.validationResults.failed.length > 0 && !this.skipValidation) {
      console.log('\n❌ Cannot upload: validation failures detected');
      console.log('Use --skip-validation to override (not recommended)');
      return;
    }

    const assetsToUpload = this.force
      ? [...this.validationResults.passed]
      : this.validationResults.passed.filter(a => !a.warnings || a.warnings.length === 0);

    if (assetsToUpload.length === 0) {
      console.log('\nNo assets to upload');
      return;
    }

    console.log(`\nUploading ${assetsToUpload.length} assets to Firebase...`);

    const batch = this.db.batch();
    let batchCount = 0;
    let totalUploaded = 0;

    for (const item of assetsToUpload) {
      const asset = this.allAssets.get(item.id);
      const collection = this.categoryToCollection[asset._category] || asset._category;
      const cleaned = this.cleanAssetForUpload(asset);

      const docRef = this.db.collection(collection).doc(asset.id);
      batch.set(docRef, cleaned, { merge: true });

      batchCount++;

      // Firebase batch limit is 500
      if (batchCount >= 450) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} assets`);
        totalUploaded += batchCount;
        batchCount = 0;
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
      totalUploaded += batchCount;
      console.log(`  Committed final batch of ${batchCount} assets`);
    }

    console.log(`\n✅ Successfully uploaded ${totalUploaded} assets to Firebase`);
  }

  async generateReport() {
    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    const report = {
      timestamp: new Date().toISOString(),
      mode: this.dryRun ? 'dry-run' : 'upload',
      options: {
        force: this.force,
        skipValidation: this.skipValidation,
        category: this.targetCategory,
        id: this.targetId
      },
      summary: {
        total: this.allAssets.size,
        passed: this.validationResults.passed.length,
        warnings: this.validationResults.warnings.length,
        failed: this.validationResults.failed.length
      },
      failed: this.validationResults.failed,
      warnings: this.validationResults.warnings.slice(0, 100)
    };

    await fs.writeFile(
      path.join(reportDir, 'upload-validation-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\nReport saved to scripts/reports/upload-validation-report.json');
  }

  async run() {
    console.log('Firebase Asset Uploader with Validation');
    console.log('=======================================');
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'UPLOAD'}`);
    console.log(`Force: ${this.force}`);
    console.log(`Skip Validation: ${this.skipValidation}`);
    if (this.targetCategory) console.log(`Category: ${this.targetCategory}`);
    if (this.targetId) console.log(`Asset ID: ${this.targetId}`);
    console.log('');

    await this.initializeFirebase();
    await this.loadAllAssets();

    if (!this.skipValidation) {
      await this.validateAll();
    }

    await this.uploadAssets();
    await this.generateReport();
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: true, // Default to dry-run for safety
    force: false,
    skipValidation: false,
    category: null,
    id: null
  };

  for (const arg of args) {
    if (arg === '--upload') {
      options.dryRun = false;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--skip-validation') {
      options.skipValidation = true;
    } else if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (arg.startsWith('--id=')) {
      options.id = arg.split('=')[1];
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();
  const uploader = new FirebaseUploader(options);

  try {
    await uploader.run();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { FirebaseUploader };
