const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'firebase-assets-enhanced');
const missingFieldFiles = [];

function checkFile(filePath) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!content.type || !content.id || !content.name) {
      const relPath = path.relative(baseDir, filePath);
      missingFieldFiles.push({
        file: relPath,
        missing: {
          type: !content.type,
          id: !content.id,
          name: !content.name
        }
      });
    }
  } catch (e) {
    // Skip parse errors
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
      checkFile(filePath);
    }
  });
}

walkDir(baseDir);

console.log('Files still missing required fields:\n');
missingFieldFiles.slice(0, 30).forEach(item => {
  const missing = Object.entries(item.missing).filter(([k,v]) => v).map(([k]) => k).join(', ');
  console.log(`${item.file} - Missing: ${missing}`);
});

if (missingFieldFiles.length > 30) {
  console.log(`\n... and ${missingFieldFiles.length - 30} more files`);
}

console.log(`\n\nTotal files with missing fields: ${missingFieldFiles.length}`);
