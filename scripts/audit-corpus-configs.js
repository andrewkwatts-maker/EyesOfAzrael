#!/usr/bin/env node

/**
 * Audit Corpus Configurations
 * Checks all corpus-config.json files and ensures language metadata is present
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Language code mapping for common ancient languages
const LANGUAGE_CODES = {
  'grc': { name: 'Ancient Greek', transliteration: false, needsTranslation: true },
  'egy': { name: 'Ancient Egyptian', transliteration: true, needsTranslation: true },
  'he': { name: 'Hebrew', transliteration: false, needsTranslation: true },
  'ar': { name: 'Arabic', transliteration: false, needsTranslation: true },
  'sa': { name: 'Sanskrit', transliteration: true, needsTranslation: true },
  'zh': { name: 'Chinese', transliteration: false, needsTranslation: true },
  'ja': { name: 'Japanese', transliteration: false, needsTranslation: true },
  'la': { name: 'Latin', transliteration: false, needsTranslation: true },
  'sga': { name: 'Old Irish', transliteration: false, needsTranslation: true },
  'non': { name: 'Old Norse', transliteration: false, needsTranslation: true },
  'akk': { name: 'Akkadian', transliteration: true, needsTranslation: true },
  'sux': { name: 'Sumerian', transliteration: true, needsTranslation: true },
  'en': { name: 'English', transliteration: false, needsTranslation: false },
  'enm': { name: 'Middle English', transliteration: false, needsTranslation: false }
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

function auditCorpusConfig(configPath) {
  const relativePath = path.relative(process.cwd(), configPath);
  const mythology = relativePath.split(path.sep)[1];

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    return {
      path: relativePath,
      mythology,
      valid: false,
      error: 'Invalid JSON: ' + e.message
    };
  }

  const issues = [];
  const warnings = [];
  const stats = {
    totalRepositories: 0,
    totalFiles: 0,
    languagesFound: new Set(),
    missingLanguage: 0,
    unknownLanguages: []
  };

  if (!config.repositories || !Array.isArray(config.repositories)) {
    issues.push('Missing or invalid "repositories" array');
  } else {
    stats.totalRepositories = config.repositories.length;

    config.repositories.forEach((repo, repoIdx) => {
      if (!repo.files || !Array.isArray(repo.files)) {
        issues.push(`Repository ${repo.id || repoIdx}: Missing "files" array`);
        return;
      }

      repo.files.forEach((file, fileIdx) => {
        stats.totalFiles++;

        if (!file.language) {
          issues.push(`Repository ${repo.id}, file ${file.name || fileIdx}: Missing "language" field`);
          stats.missingLanguage++;
        } else {
          stats.languagesFound.add(file.language);

          if (!LANGUAGE_CODES[file.language]) {
            warnings.push(`Repository ${repo.id}, file ${file.name}: Unknown language code "${file.language}"`);
            stats.unknownLanguages.push(file.language);
          }
        }

        // Check for format field
        if (!file.format) {
          warnings.push(`Repository ${repo.id}, file ${file.name || fileIdx}: Missing "format" field`);
        }
      });
    });
  }

  // Check for translation settings
  if (!config.translation_settings) {
    warnings.push('Missing "translation_settings" configuration for multilingual support');
  }

  return {
    path: relativePath,
    mythology,
    valid: issues.length === 0,
    issues,
    warnings,
    stats,
    config
  };
}

function generateReport(results) {
  log('\n' + '='.repeat(70), 'cyan');
  log('CORPUS CONFIGURATION AUDIT REPORT', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  const summary = {
    totalConfigs: results.length,
    validConfigs: 0,
    configsWithIssues: 0,
    configsWithWarnings: 0,
    totalRepositories: 0,
    totalFiles: 0,
    allLanguages: new Set(),
    missingLanguageCount: 0
  };

  results.forEach(result => {
    if (result.valid && result.issues.length === 0) summary.validConfigs++;
    if (result.issues.length > 0) summary.configsWithIssues++;
    if (result.warnings.length > 0) summary.configsWithWarnings++;
    if (result.stats) {
      summary.totalRepositories += result.stats.totalRepositories;
      summary.totalFiles += result.stats.totalFiles;
      result.stats.languagesFound.forEach(lang => summary.allLanguages.add(lang));
      summary.missingLanguageCount += result.stats.missingLanguage;
    }
  });

  log('Summary:', 'bright');
  log(`  Total Configs:     ${summary.totalConfigs}`, 'blue');
  log(`  Valid:             ${summary.validConfigs}`, summary.validConfigs === summary.totalConfigs ? 'green' : 'yellow');
  log(`  With Issues:       ${summary.configsWithIssues}`, summary.configsWithIssues > 0 ? 'red' : 'green');
  log(`  With Warnings:     ${summary.configsWithWarnings}`, summary.configsWithWarnings > 0 ? 'yellow' : 'green');
  log(`  Total Repositories: ${summary.totalRepositories}`, 'blue');
  log(`  Total Files:       ${summary.totalFiles}`, 'blue');
  log(`  Languages Found:   ${summary.allLanguages.size}`, 'blue');
  log(`  Missing Language:  ${summary.missingLanguageCount}`, summary.missingLanguageCount > 0 ? 'red' : 'green');

  if (summary.allLanguages.size > 0) {
    log('\n  Languages:', 'bright');
    Array.from(summary.allLanguages).sort().forEach(lang => {
      const info = LANGUAGE_CODES[lang];
      if (info) {
        log(`    ${lang.padEnd(6)} - ${info.name} ${info.needsTranslation ? '(needs translation)' : ''}`, 'cyan');
      } else {
        log(`    ${lang.padEnd(6)} - Unknown language code`, 'yellow');
      }
    });
  }

  log('\n' + '='.repeat(70) + '\n', 'cyan');

  // Detailed results by mythology
  results.forEach(result => {
    const statusIcon = result.valid && result.issues.length === 0 ? '✅' :
                      result.issues.length > 0 ? '❌' : '⚠️';

    log(`${statusIcon} ${result.mythology.toUpperCase()}`, result.valid && result.issues.length === 0 ? 'green' : 'yellow');
    log(`   ${result.path}`, 'blue');

    if (result.error) {
      log(`   ERROR: ${result.error}`, 'red');
    }

    if (result.stats) {
      log(`   Repositories: ${result.stats.totalRepositories}, Files: ${result.stats.totalFiles}, Languages: ${result.stats.languagesFound.size}`, 'cyan');
    }

    if (result.issues.length > 0) {
      log('   Issues:', 'red');
      result.issues.forEach(issue => log(`     - ${issue}`, 'red'));
    }

    if (result.warnings.length > 0) {
      log('   Warnings:', 'yellow');
      result.warnings.forEach(warning => log(`     - ${warning}`, 'yellow'));
    }

    log('');
  });

  return { summary, results };
}

function main() {
  log('\n🔍 Scanning for corpus configuration files...\n', 'bright');

  const configPaths = findCorpusConfigs();

  if (configPaths.length === 0) {
    log('❌ No corpus-config.json files found!', 'red');
    process.exit(1);
  }

  log(`Found ${configPaths.length} corpus configuration files\n`, 'green');

  const results = configPaths.map(auditCorpusConfig);
  const { summary } = generateReport(results);

  // Save detailed report
  const reportPath = 'corpus-config-audit.json';
  fs.writeFileSync(reportPath, JSON.stringify({ summary, results }, null, 2));
  log(`📄 Detailed report saved to: ${reportPath}\n`, 'green');

  // Exit code based on issues
  if (summary.configsWithIssues > 0) {
    log('⚠️  Some corpus configs have issues that need to be fixed', 'yellow');
    process.exit(1);
  } else if (summary.configsWithWarnings > 0) {
    log('✓ All corpus configs are valid, but some have warnings', 'yellow');
    process.exit(0);
  } else {
    log('✅ All corpus configs are valid!', 'green');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { auditCorpusConfig, LANGUAGE_CODES };
