const fs = require('fs');
const path = require('path');

const parsedDir = path.join(__dirname, '..', 'parsed_data');
const newContentTypes = ['texts', 'symbols', 'concepts', 'events', 'myths'];

console.log('🔍 Validating JSON Structure and Data Integrity\n');
console.log('═'.repeat(70));

let totalErrors = 0;
let totalWarnings = 0;
let totalValidated = 0;

newContentTypes.forEach(type => {
  const filePath = path.join(parsedDir, `${type}_parsed.json`);

  console.log(`\n📦 Validating ${type}...`);

  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ ERROR: File not found`);
      totalErrors++;
      return;
    }

    // Parse JSON
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Validate structure
    const errors = [];
    const warnings = [];

    // Check required top-level fields
    if (!data.contentType) errors.push('Missing contentType');
    if (data.count === undefined) errors.push('Missing count');
    if (!data.parsedAt) errors.push('Missing parsedAt');
    if (!data.items || !Array.isArray(data.items)) errors.push('Missing or invalid items array');

    // Check count matches items length
    if (data.items && data.count !== data.items.length) {
      warnings.push(`Count mismatch: ${data.count} vs ${data.items.length} actual items`);
    }

    // Validate each item
    if (data.items) {
      data.items.forEach((item, index) => {
        const itemErrors = [];

        // Required fields
        if (!item.id) itemErrors.push(`Item ${index}: Missing id`);
        if (!item.name) itemErrors.push(`Item ${index}: Missing name`);
        if (!item.displayName) itemErrors.push(`Item ${index}: Missing displayName`);
        if (!item.mythology) itemErrors.push(`Item ${index}: Missing mythology`);
        // contentType is optional at item level (set at file level)
        if (!item.filename) itemErrors.push(`Item ${index}: Missing filename`);

        // Check metadata
        if (!item.metadata) {
          itemErrors.push(`Item ${index}: Missing metadata`);
        } else {
          if (!item.metadata.createdAt) itemErrors.push(`Item ${index}: Missing metadata.createdAt`);
          if (!item.metadata.updatedAt) itemErrors.push(`Item ${index}: Missing metadata.updatedAt`);
          if (!item.metadata.sourceFile) itemErrors.push(`Item ${index}: Missing metadata.sourceFile`);
        }

        // Check ID format
        if (item.id && !item.id.includes('_')) {
          warnings.push(`Item ${index} (${item.id}): ID should contain mythology prefix`);
        }

        errors.push(...itemErrors);
      });
    }

    // Report results
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`   ✅ VALID: ${data.count} items, no issues found`);
      totalValidated++;
    } else {
      if (errors.length > 0) {
        console.log(`   ❌ ${errors.length} ERRORS:`);
        errors.slice(0, 5).forEach(e => console.log(`      - ${e}`));
        if (errors.length > 5) console.log(`      ... and ${errors.length - 5} more`);
        totalErrors += errors.length;
      }
      if (warnings.length > 0) {
        console.log(`   ⚠️  ${warnings.length} WARNINGS:`);
        warnings.slice(0, 5).forEach(w => console.log(`      - ${w}`));
        if (warnings.length > 5) console.log(`      ... and ${warnings.length - 5} more`);
        totalWarnings += warnings.length;
      }
    }

  } catch (error) {
    console.log(`   ❌ CRITICAL ERROR: ${error.message}`);
    totalErrors++;
  }
});

console.log('\n' + '═'.repeat(70));
console.log('\n📊 VALIDATION SUMMARY\n');
console.log(`   Files Validated: ${newContentTypes.length}`);
console.log(`   Fully Valid: ${totalValidated}`);
console.log(`   Total Errors: ${totalErrors}`);
console.log(`   Total Warnings: ${totalWarnings}`);

if (totalErrors === 0) {
  console.log('\n✅ ALL FILES PASSED VALIDATION!\n');
  process.exit(0);
} else {
  console.log('\n❌ VALIDATION FAILED - Fix errors before upload\n');
  process.exit(1);
}
