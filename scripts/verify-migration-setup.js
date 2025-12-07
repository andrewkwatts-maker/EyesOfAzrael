#!/usr/bin/env node

/**
 * Migration Setup Verification Script
 *
 * Verifies that all dependencies and configurations are in place
 * before running the migration.
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passed = 0;
let failed = 0;

/**
 * Add check result
 */
function check(name, condition, helpText) {
  const result = {
    name,
    passed: condition,
    help: helpText
  };

  checks.push(result);

  if (condition) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.log(`❌ ${name}`);
    if (helpText) {
      console.log(`   → ${helpText}`);
    }
  }
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Check if directory exists and count files
 */
function countHtmlFiles(dir) {
  try {
    let count = 0;
    const walk = (currentPath) => {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        const filePath = path.join(currentPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walk(filePath);
        } else if (file.endsWith('.html')) {
          count++;
        }
      });
    };
    walk(dir);
    return count;
  } catch {
    return 0;
  }
}

/**
 * Run all checks
 */
async function runChecks() {
  console.log('🔍 Verifying Migration Setup\n');
  console.log('='.repeat(60) + '\n');

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  check(
    'Node.js version (>=16)',
    majorVersion >= 16,
    `Current: ${nodeVersion}. Please upgrade to Node.js 16 or higher.`
  );

  // Check npm packages
  console.log('\n📦 Checking Dependencies:\n');

  const packageJson = path.join(__dirname, '..', 'package.json');
  check(
    'package.json exists',
    fileExists(packageJson),
    'Run: npm init in project root'
  );

  const nodeModules = path.join(__dirname, '..', 'node_modules');
  check(
    'node_modules exists',
    fileExists(nodeModules),
    'Run: npm install'
  );

  // Check specific dependencies
  const requiredPackages = ['cheerio', 'cli-progress', 'firebase-admin', 'glob'];
  requiredPackages.forEach(pkg => {
    const pkgPath = path.join(nodeModules, pkg);
    check(
      `${pkg} installed`,
      fileExists(pkgPath),
      `Run: npm install ${pkg}`
    );
  });

  // Check Firebase configuration
  console.log('\n🔥 Checking Firebase Setup:\n');

  const serviceAccountKey = path.join(__dirname, '..', 'firebase-service-account.json');
  check(
    'Firebase service account key exists',
    fileExists(serviceAccountKey),
    'Download from Firebase Console → Project Settings → Service Accounts'
  );

  // Check migration scripts
  console.log('\n📝 Checking Migration Scripts:\n');

  const migrationScript = path.join(__dirname, 'migrate-to-firebase-assets.js');
  check(
    'Migration script exists',
    fileExists(migrationScript),
    'Script should be in scripts/migrate-to-firebase-assets.js'
  );

  const configFile = path.join(__dirname, 'migration-config.js');
  check(
    'Configuration file exists',
    fileExists(configFile),
    'Config should be in scripts/migration-config.js'
  );

  // Check content to migrate
  console.log('\n📚 Checking Content:\n');

  const mythosDir = path.join(__dirname, '..', 'mythos');
  check(
    'mythos directory exists',
    fileExists(mythosDir),
    'Content directory missing'
  );

  const htmlCount = countHtmlFiles(mythosDir);
  check(
    `HTML files found (${htmlCount})`,
    htmlCount > 0,
    'No HTML files found in mythos directory'
  );

  console.log(`   Found ${htmlCount} HTML files to migrate`);

  // Check specific mythologies
  const mythologies = [
    'greek', 'norse', 'egyptian', 'babylonian', 'christian',
    'jewish', 'hindu', 'buddhist', 'celtic'
  ];

  console.log('\n🌍 Checking Mythologies:\n');

  mythologies.forEach(myth => {
    const mythPath = path.join(mythosDir, myth);
    const exists = fileExists(mythPath);
    const count = exists ? countHtmlFiles(mythPath) : 0;
    check(
      `${myth} (${count} files)`,
      exists && count > 0,
      null
    );
  });

  // Check .gitignore
  console.log('\n🔒 Checking Git Configuration:\n');

  const gitignore = path.join(__dirname, '..', '.gitignore');
  if (fileExists(gitignore)) {
    const content = fs.readFileSync(gitignore, 'utf-8');
    check(
      'migration-errors.log in .gitignore',
      content.includes('migration-errors.log'),
      'Add to .gitignore'
    );
    check(
      'migration-progress.json in .gitignore',
      content.includes('migration-progress.json'),
      'Add to .gitignore'
    );
    check(
      'firebase-service-account.json protected',
      content.includes('firebase-service-account.json') ||
      content.includes('*-firebase-adminsdk-*.json'),
      'Add to .gitignore to protect credentials'
    );
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary\n');
  console.log(`Total Checks: ${checks.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log('='.repeat(60) + '\n');

  if (failed === 0) {
    console.log('🎉 All checks passed! Ready to migrate.\n');
    console.log('Next steps:');
    console.log('  1. Test single page:');
    console.log('     npm run migrate:test');
    console.log('');
    console.log('  2. Dry run on one mythology:');
    console.log('     node scripts/migrate-to-firebase-assets.js --mythology greek --dry-run');
    console.log('');
    console.log('  3. Live migration:');
    console.log('     node scripts/migrate-to-firebase-assets.js --mythology greek');
    console.log('');
    console.log('  4. Full migration:');
    console.log('     npm run migrate');
    console.log('');
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above before migrating.\n');
    process.exit(1);
  }
}

// Run verification
runChecks().catch(error => {
  console.error('💥 Verification failed:', error);
  process.exit(1);
});
