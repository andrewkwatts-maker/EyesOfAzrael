/**
 * Analyze Broken Links
 * Categorizes broken links to identify fix strategies
 */

const fs = require('fs').promises;
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');
const REPORT_PATH = path.join(__dirname, '..', 'reports', 'broken-links.json');

async function loadAllAssetIds() {
  const assetIds = new Set();
  const categories = await fs.readdir(ASSETS_DIR);

  for (const category of categories) {
    const categoryPath = path.join(ASSETS_DIR, category);
    const stat = await fs.stat(categoryPath);
    if (!stat.isDirectory()) continue;

    const files = await fs.readdir(categoryPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        assetIds.add(file.replace('.json', ''));
      }
    }
  }
  return assetIds;
}

async function analyzeLinks() {
  console.log('Loading broken links report...');
  const report = JSON.parse(await fs.readFile(REPORT_PATH, 'utf8'));
  const existingIds = await loadAllAssetIds();

  console.log('Found ' + report.count + ' broken links');
  console.log('Database has ' + existingIds.size + ' assets\n');

  const uniqueTargets = new Map();

  for (const link of report.links) {
    const targetId = link.targetId;
    if (!uniqueTargets.has(targetId)) {
      uniqueTargets.set(targetId, { count: 0, sources: new Set(), examples: [] });
    }
    const entry = uniqueTargets.get(targetId);
    entry.count++;
    entry.sources.add(link.assetId);
    if (entry.examples.length < 2) {
      entry.examples.push({ source: link.assetId, field: link.field });
    }
  }

  // Categorize
  const malformed = [];
  const validMissing = [];

  for (const [targetId, data] of uniqueTargets) {
    const item = { targetId, count: data.count, sources: data.sources.size };
    
    if (targetId.includes('-lord-') || targetId.includes('-goddess-') ||
        targetId.includes('-god-of-') || targetId.includes('-sent-to-') ||
        targetId.includes('-some-traditions') || targetId.includes('-strength-') ||
        targetId.startsWith('s-') && targetId.length > 20 ||
        targetId.length > 40) {
      malformed.push(item);
    } else {
      validMissing.push(item);
    }
  }

  malformed.sort((a, b) => b.count - a.count);
  validMissing.sort((a, b) => b.count - a.count);

  console.log('='.repeat(60));
  console.log('ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  console.log('Unique broken targets: ' + uniqueTargets.size);
  console.log('Malformed IDs (to remove): ' + malformed.length);
  console.log('Valid missing entities: ' + validMissing.length);

  console.log('\nMALFORMED IDs (first 15):');
  malformed.slice(0, 15).forEach(m => console.log('  ' + m.targetId));

  console.log('\nVALID MISSING (first 30):');
  validMissing.slice(0, 30).forEach(m => console.log('  ' + m.targetId + ' (' + m.count + ' refs)'));

  // Save analysis
  const analysis = { malformed, validMissing, summary: { total: uniqueTargets.size, malformedCount: malformed.length, validCount: validMissing.length } };
  await fs.writeFile(path.join(__dirname, '..', 'reports', 'broken-link-analysis.json'), JSON.stringify(analysis, null, 2));
  console.log('\nAnalysis saved to reports/broken-link-analysis.json');
}

analyzeLinks().catch(console.error);
