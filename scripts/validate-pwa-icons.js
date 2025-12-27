#!/usr/bin/env node

/**
 * PWA Icon Validator for Eyes of Azrael
 * Validates that all required PWA icons exist and meet size requirements
 */

const fs = require('fs');
const path = require('path');

const config = {
  iconsDir: path.join(__dirname, '..', 'icons'),
  faviconPath: path.join(__dirname, '..', 'favicon.ico'),
  manifestPath: path.join(__dirname, '..', 'manifest.json'),
  requiredIcons: [
    { file: 'icon-72x72.png', minSize: 2000 },
    { file: 'icon-96x96.png', minSize: 3000 },
    { file: 'icon-128x128.png', minSize: 5000 },
    { file: 'icon-144x144.png', minSize: 6000 },
    { file: 'icon-152x152.png', minSize: 6000 },
    { file: 'icon-192x192.png', minSize: 9000 },
    { file: 'icon-384x384.png', minSize: 25000 },
    { file: 'icon-512x512.png', minSize: 35000 },
    { file: 'apple-touch-icon.png', minSize: 8000 },
    { file: 'favicon-16.png', minSize: 400 },
    { file: 'favicon-32.png', minSize: 900 },
    { file: 'favicon-48.png', minSize: 1500 },
    { file: 'favicon-64.png', minSize: 2000 },
    { file: 'shortcut-mythos.png', minSize: 3000 },
    { file: 'shortcut-magic.png', minSize: 3000 },
    { file: 'shortcut-herbs.png', minSize: 3000 }
  ]
};

function validateIcons() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     PWA Icon Validator - Eyes of Azrael               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const errors = [];

  // Check icons directory exists
  if (!fs.existsSync(config.iconsDir)) {
    console.log('✗ Icons directory does not exist:', config.iconsDir);
    return false;
  }
  console.log('✓ Icons directory exists\n');

  // Validate each required icon
  console.log('Validating icon files...\n');
  config.requiredIcons.forEach(icon => {
    const iconPath = path.join(config.iconsDir, icon.file);

    if (!fs.existsSync(iconPath)) {
      console.log(`✗ ${icon.file.padEnd(30)} - MISSING`);
      errors.push(`Missing: ${icon.file}`);
      failed++;
      return;
    }

    const stats = fs.statSync(iconPath);
    if (stats.size < icon.minSize) {
      console.log(`✗ ${icon.file.padEnd(30)} - TOO SMALL (${stats.size} bytes)`);
      errors.push(`Too small: ${icon.file} (${stats.size} bytes, expected ${icon.minSize}+)`);
      failed++;
      return;
    }

    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✓ ${icon.file.padEnd(30)} (${sizeKB} KB)`);
    passed++;
  });

  // Check favicon.ico
  console.log('\nValidating favicon.ico...');
  if (!fs.existsSync(config.faviconPath)) {
    console.log('✗ favicon.ico does not exist');
    errors.push('Missing: favicon.ico');
    failed++;
  } else {
    const stats = fs.statSync(config.faviconPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✓ favicon.ico exists (${sizeKB} KB)`);
    passed++;
  }

  // Validate manifest.json
  console.log('\nValidating manifest.json...');
  if (!fs.existsSync(config.manifestPath)) {
    console.log('✗ manifest.json does not exist');
    errors.push('Missing: manifest.json');
    failed++;
  } else {
    try {
      const manifest = JSON.parse(fs.readFileSync(config.manifestPath, 'utf8'));

      if (!manifest.icons || !Array.isArray(manifest.icons)) {
        console.log('✗ manifest.json does not contain icons array');
        errors.push('Invalid: manifest.json missing icons array');
        failed++;
      } else {
        console.log(`✓ manifest.json exists with ${manifest.icons.length} icon entries`);

        // Verify icon paths
        let iconPathErrors = 0;
        manifest.icons.forEach(icon => {
          const iconPath = path.join(__dirname, '..', icon.src.replace(/^\//, ''));
          if (!fs.existsSync(iconPath)) {
            iconPathErrors++;
            console.log(`  ✗ Referenced icon not found: ${icon.src}`);
          }
        });

        if (iconPathErrors === 0) {
          console.log('  ✓ All manifest icon references are valid');
          passed++;
        } else {
          errors.push(`${iconPathErrors} icon references in manifest.json point to missing files`);
          failed++;
        }
      }
    } catch (error) {
      console.log('✗ Error reading manifest.json:', error.message);
      errors.push('Invalid: manifest.json parse error');
      failed++;
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                   VALIDATION COMPLETE                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const total = passed + failed;
  const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  console.log(`Passed: ${passed}/${total} (${percentage}%)`);
  console.log(`Failed: ${failed}/${total}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach(error => console.log(`  - ${error}`));
    console.log('\n💡 Run: npm run generate-icons');
    return false;
  }

  console.log('\n✅ All PWA icons are valid and ready for deployment!');
  return true;
}

// Run validation
const success = validateIcons();
process.exit(success ? 0 : 1);
