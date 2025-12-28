#!/usr/bin/env node

/**
 * Gzip Size Checker
 * Checks gzipped bundle sizes to ensure under 500KB budget
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Get all minified JavaScript files
 */
function getMinifiedFiles(dir) {
  const files = [];

  function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory() && !fullPath.includes('node_modules')) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.min.js')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

/**
 * Get gzipped size of file
 */
function getGzippedSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content, { level: 9 });
  return gzipped.length;
}

/**
 * Main process
 */
function main() {
  console.log('📦 Gzip Size Analysis');
  console.log('═'.repeat(60));
  console.log('');

  console.log('📂 Scanning for minified files in: js/');
  const files = getMinifiedFiles('js');
  console.log(`📊 Found ${files.length} minified files`);
  console.log('');

  const results = [];
  let totalOriginal = 0;
  let totalGzipped = 0;

  console.log('⚙️  Analyzing files...');
  console.log('─'.repeat(60));

  for (const file of files) {
    const originalSize = fs.statSync(file).size;
    const gzippedSize = getGzippedSize(file);

    totalOriginal += originalSize;
    totalGzipped += gzippedSize;

    const compression = ((originalSize - gzippedSize) / originalSize * 100).toFixed(1);

    results.push({
      file,
      originalSize,
      gzippedSize,
      compression
    });

    const relativePath = path.relative(process.cwd(), file);
    console.log(`${relativePath}`);
    console.log(`  Original: ${formatBytes(originalSize)}`);
    console.log(`  Gzipped:  ${formatBytes(gzippedSize)} (${compression}% compression)`);
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 Gzip Summary');
  console.log('═'.repeat(60));
  console.log('');
  console.log(`Total minified size:  ${formatBytes(totalOriginal)}`);
  console.log(`Total gzipped size:   ${formatBytes(totalGzipped)}`);

  const overallCompression = ((totalOriginal - totalGzipped) / totalOriginal * 100).toFixed(1);
  console.log(`Overall compression:  ${overallCompression}%`);
  console.log('');

  // Top 10 largest gzipped files
  console.log('📈 Largest Gzipped Files (Top 10):');
  console.log('─'.repeat(60));

  const sortedByGzipped = results
    .sort((a, b) => b.gzippedSize - a.gzippedSize)
    .slice(0, 10);

  sortedByGzipped.forEach((result, index) => {
    const relativePath = path.relative(process.cwd(), result.file);
    console.log(`${index + 1}. ${relativePath}`);
    console.log(`   ${formatBytes(result.gzippedSize)} (${result.compression}% compression)`);
  });

  console.log('');
  console.log('═'.repeat(60));

  // Check budget
  const budgetKB = 500;
  const budgetBytes = budgetKB * 1024;

  if (totalGzipped <= budgetBytes) {
    console.log('✅ Bundle size is within budget!');
    console.log(`   Budget:      ${formatBytes(budgetBytes)}`);
    console.log(`   Actual:      ${formatBytes(totalGzipped)}`);
    console.log(`   Under by:    ${formatBytes(budgetBytes - totalGzipped)}`);
    console.log(`   Utilization: ${((totalGzipped / budgetBytes) * 100).toFixed(1)}%`);
  } else {
    console.log('⚠️  Bundle size exceeds budget');
    console.log(`   Budget:   ${formatBytes(budgetBytes)}`);
    console.log(`   Actual:   ${formatBytes(totalGzipped)}`);
    console.log(`   Over by:  ${formatBytes(totalGzipped - budgetBytes)}`);
    console.log('');
    console.log('💡 Consider implementing code splitting to reduce bundle size');
  }

  console.log('');

  // Save results
  const reportPath = 'gzip-size-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    filesAnalyzed: files.length,
    totalMinifiedSize: totalOriginal,
    totalGzippedSize: totalGzipped,
    compressionRatio: overallCompression,
    budgetBytes: budgetBytes,
    budgetMet: totalGzipped <= budgetBytes,
    files: results.map(r => ({
      file: path.relative(process.cwd(), r.file),
      originalSize: r.originalSize,
      gzippedSize: r.gzippedSize,
      compression: r.compression
    }))
  }, null, 2));

  console.log(`📄 Full report saved to: ${reportPath}`);
  console.log('');

  // Exit with error if over budget
  if (totalGzipped > budgetBytes) {
    process.exit(1);
  }
}

// Run
try {
  main();
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
