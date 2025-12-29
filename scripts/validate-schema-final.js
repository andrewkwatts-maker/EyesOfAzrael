const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'firebase-assets-enhanced');
const stats = {
  totalFiles: 0,
  totalEntities: 0,
  compliantFiles: 0,
  nonCompliantFiles: 0,
  entitiesWithIssues: 0,
  missingType: 0,
  missingId: 0,
  missingName: 0,
  issuesList: []
};

function validateEntity(entity, filePath, index = null) {
  let hasIssues = false;
  const issues = [];

  if (!entity.type) {
    issues.push('type');
    stats.missingType++;
    hasIssues = true;
  }
  if (!entity.id) {
    issues.push('id');
    stats.missingId++;
    hasIssues = true;
  }
  if (!entity.name) {
    issues.push('name');
    stats.missingName++;
    hasIssues = true;
  }

  if (hasIssues) {
    stats.entitiesWithIssues++;
    const relPath = path.relative(baseDir, filePath);
    stats.issuesList.push({
      file: relPath,
      index: index,
      missing: issues
    });
  }

  return !hasIssues;
}

function validateFile(filePath) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    stats.totalFiles++;

    let isFileCompliant = true;

    // Handle arrays of entities
    if (Array.isArray(content)) {
      content.forEach((entity, index) => {
        stats.totalEntities++;
        const isCompliant = validateEntity(entity, filePath, index);
        if (!isCompliant) {
          isFileCompliant = false;
        }
      });
    } else {
      // Handle single entity object
      stats.totalEntities++;
      const isCompliant = validateEntity(content, filePath);
      if (!isCompliant) {
        isFileCompliant = false;
      }
    }

    if (isFileCompliant) {
      stats.compliantFiles++;
    } else {
      stats.nonCompliantFiles++;
    }

  } catch (e) {
    console.error('Error parsing:', filePath, e.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.json') && !file.includes('summary') && !file.includes('report')) {
      validateFile(filePath);
    }
  });
}

walkDir(baseDir);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     FINAL SCHEMA COMPLIANCE VALIDATION                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('Files:');
console.log(`  ├─ Total files: ${stats.totalFiles}`);
console.log(`  ├─ Compliant files: ${stats.compliantFiles}`);
console.log(`  └─ Non-compliant files: ${stats.nonCompliantFiles}\n`);

console.log('Entities:');
console.log(`  ├─ Total entities: ${stats.totalEntities}`);
console.log(`  ├─ Compliant entities: ${stats.totalEntities - stats.entitiesWithIssues}`);
console.log(`  └─ Entities with issues: ${stats.entitiesWithIssues}\n`);

console.log('Missing Fields:');
console.log(`  ├─ Missing 'type': ${stats.missingType}`);
console.log(`  ├─ Missing 'id': ${stats.missingId}`);
console.log(`  └─ Missing 'name': ${stats.missingName}\n`);

const fileComplianceRate = ((stats.compliantFiles / stats.totalFiles) * 100).toFixed(2);
const entityComplianceRate = (((stats.totalEntities - stats.entitiesWithIssues) / stats.totalEntities) * 100).toFixed(2);

console.log('Compliance Rates:');
console.log(`  ├─ File level: ${fileComplianceRate}%`);
console.log(`  └─ Entity level: ${entityComplianceRate}%\n`);

if (stats.entitiesWithIssues === 0) {
  console.log('✅ ALL ENTITIES ARE 100% SCHEMA COMPLIANT! ✅\n');
  console.log(`🎉 Successfully validated ${stats.totalEntities} entities across ${stats.totalFiles} files`);
  process.exit(0);
} else {
  console.log('❌ SCHEMA COMPLIANCE ISSUES FOUND\n');
  console.log(`Found issues in ${stats.entitiesWithIssues} entities across ${stats.nonCompliantFiles} files\n`);

  // Show first 10 issues
  console.log('Sample of issues:\n');
  stats.issuesList.slice(0, 10).forEach(issue => {
    const location = issue.index !== null ? `[${issue.index}]` : '';
    console.log(`  ${issue.file}${location}: Missing ${issue.missing.join(', ')}`);
  });

  if (stats.issuesList.length > 10) {
    console.log(`\n  ... and ${stats.issuesList.length - 10} more issues`);
  }

  process.exit(1);
}
