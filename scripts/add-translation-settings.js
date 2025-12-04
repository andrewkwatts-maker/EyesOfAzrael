#!/usr/bin/env node

/**
 * Add Translation Settings to Corpus Configs
 * Adds translation_settings configuration to all corpus-config.json files
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Default translation settings
const DEFAULT_TRANSLATION_SETTINGS = {
  enabled: true,
  api_provider: "mymemory",
  api_url: "https://api.mymemory.translated.net/get",
  fallback_providers: [
    {
      name: "libre-translate",
      url: "https://libretranslate.com/translate",
      enabled: false
    }
  ],
  cache_translations: true,
  cache_duration_days: 30,
  target_language: "en",
  transliteration: {
    enabled: true,
    script_detection: true,
    supported_scripts: [
      "grc", "he", "ar", "sa", "zh", "ja", "egy"
    ]
  },
  search_strategy: {
    try_original_first: true,
    try_translation_if_no_results: true,
    try_transliteration_if_available: true,
    combine_results: true
  }
};

function findCorpusConfigs() {
  const configs = [];
  const mythosDir = path.join(process.cwd(), 'mythos');

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name === 'corpus-config.json') {
        configs.push(fullPath);
      }
    }
  }

  scanDirectory(mythosDir);
  return configs;
}

function addTranslationSettings(configPath, dryRun = false) {
  const relativePath = path.relative(process.cwd(), configPath);

  let config;
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(content);
  } catch (e) {
    log(`❌ Error reading ${relativePath}: ${e.message}`, 'red');
    return { success: false, error: e.message };
  }

  // Check if translation_settings already exists
  if (config.translation_settings) {
    log(`⚠️  ${relativePath} already has translation_settings`, 'yellow');
    return { success: true, skipped: true, reason: 'already_exists' };
  }

  // Add translation_settings
  config.translation_settings = DEFAULT_TRANSLATION_SETTINGS;

  if (!dryRun) {
    try {
      // Write with proper formatting
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
      log(`✅ Added translation_settings to ${relativePath}`, 'green');
      return { success: true, updated: true };
    } catch (e) {
      log(`❌ Error writing ${relativePath}: ${e.message}`, 'red');
      return { success: false, error: e.message };
    }
  } else {
    log(`🔍 Would add translation_settings to ${relativePath}`, 'cyan');
    return { success: true, dryRun: true };
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');

  if (dryRun) {
    log('\n🔍 DRY RUN MODE - No files will be modified\n', 'yellow');
  }

  log('\n📝 Adding translation settings to corpus configs...\n', 'cyan');

  const configPaths = findCorpusConfigs();

  if (configPaths.length === 0) {
    log('❌ No corpus-config.json files found!', 'red');
    process.exit(1);
  }

  log(`Found ${configPaths.length} corpus configuration files\n`, 'blue');

  const results = {
    total: configPaths.length,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  configPaths.forEach(configPath => {
    const result = addTranslationSettings(configPath, dryRun);

    if (result.updated) results.updated++;
    if (result.skipped) results.skipped++;
    if (!result.success) results.errors++;
  });

  log('\n' + '='.repeat(60), 'cyan');
  log('SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Total Configs:  ${results.total}`, 'blue');
  log(`Updated:        ${results.updated}`, results.updated > 0 ? 'green' : 'yellow');
  log(`Skipped:        ${results.skipped}`, 'yellow');
  log(`Errors:         ${results.errors}`, results.errors > 0 ? 'red' : 'green');
  log('='.repeat(60) + '\n', 'cyan');

  if (dryRun && results.updated === 0 && results.skipped === 0) {
    log('Would update ' + results.total + ' configs', 'cyan');
    log('Run without --dry-run to apply changes\n', 'yellow');
  }

  if (!dryRun && results.updated > 0) {
    log('✅ Translation settings added successfully!\n', 'green');
  }

  process.exit(results.errors > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { addTranslationSettings, DEFAULT_TRANSLATION_SETTINGS };
