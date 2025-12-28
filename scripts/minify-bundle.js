#!/usr/bin/env node

/**
 * Bundle Minification Script
 * Minifies JavaScript files for production deployment
 * Target: Reduce 727KB bundle to ~500KB (227KB reduction)
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Configuration
const CONFIG = {
  sourceDir: 'js',
  ignorePatterns: [
    'js/**/*.min.js',
    'js/vendor/**',
    'js/lib/**',
    '**/node_modules/**'
  ],
  minifyOptions: {
    compress: {
      dead_code: true,
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.debug', 'console.info'],
      passes: 2,
      unsafe: false,
      unsafe_comps: false,
      warnings: false
    },
    mangle: {
      toplevel: false, // Keep class names for dynamic imports
      reserved: [
        'SPANavigation',
        'SearchViewComplete',
        'CompareView',
        'UserDashboard',
        'HomeView',
        'EntityEditor',
        'FirebaseCRUDManager',
        'PageAssetRenderer',
        'AboutPage',
        'PrivacyPage',
        'TermsPage'
      ]
    },
    format: {
      comments: false,
      beautify: false
    },
    sourceMap: false
  }
};

/**
 * Get all JavaScript files in directory
 */
function getJavaScriptFiles(dir) {
  const files = [];

  function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Skip ignored patterns
      if (CONFIG.ignorePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(fullPath);
      })) {
        continue;
      }

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
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
 * Minify a single file
 */
async function minifyFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const originalSize = code.length;

  try {
    const result = await minify(code, CONFIG.minifyOptions);

    if (result.error) {
      throw result.error;
    }

    const minifiedSize = result.code.length;
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

    // Write minified version
    const minPath = filePath.replace('.js', '.min.js');
    fs.writeFileSync(minPath, result.code, 'utf8');

    return {
      original: filePath,
      minified: minPath,
      originalSize,
      minifiedSize,
      savings
    };
  } catch (error) {
    console.error(`Error minifying ${filePath}:`, error.message);
    return {
      original: filePath,
      error: error.message,
      originalSize,
      minifiedSize: originalSize,
      savings: 0
    };
  }
}

/**
 * Main minification process
 */
async function main() {
  console.log('🔨 JavaScript Bundle Minification');
  console.log('═'.repeat(60));
  console.log('');

  console.log('📂 Scanning directory:', CONFIG.sourceDir);
  const files = getJavaScriptFiles(CONFIG.sourceDir);
  console.log(`📊 Found ${files.length} JavaScript files`);
  console.log('');

  let totalOriginal = 0;
  let totalMinified = 0;
  const results = [];

  console.log('⚙️  Minifying files...');
  console.log('─'.repeat(60));

  for (const file of files) {
    const result = await minifyFile(file);
    results.push(result);

    totalOriginal += result.originalSize;
    totalMinified += result.minifiedSize;

    if (result.error) {
      console.log(`❌ ${file}`);
      console.log(`   Error: ${result.error}`);
    } else {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`✓ ${relativePath}`);
      console.log(`  ${formatBytes(result.originalSize)} → ${formatBytes(result.minifiedSize)} (${result.savings}% reduction)`);
    }
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 Minification Summary');
  console.log('═'.repeat(60));
  console.log('');
  console.log(`Total files processed: ${files.length}`);
  console.log(`Original bundle size:  ${formatBytes(totalOriginal)}`);
  console.log(`Minified bundle size:  ${formatBytes(totalMinified)}`);

  const totalSavings = totalOriginal - totalMinified;
  const totalSavingsPercent = ((totalSavings / totalOriginal) * 100).toFixed(1);

  console.log(`Total reduction:       ${formatBytes(totalSavings)} (${totalSavingsPercent}%)`);
  console.log('');

  // Top 10 largest files
  console.log('📈 Largest Minified Files (Top 10):');
  console.log('─'.repeat(60));

  const sortedBySize = results
    .filter(r => !r.error)
    .sort((a, b) => b.minifiedSize - a.minifiedSize)
    .slice(0, 10);

  sortedBySize.forEach((result, index) => {
    const relativePath = path.relative(process.cwd(), result.minified);
    console.log(`${index + 1}. ${relativePath}`);
    console.log(`   ${formatBytes(result.minifiedSize)}`);
  });

  console.log('');
  console.log('═'.repeat(60));

  // Check if target met
  const targetSize = 500 * 1024; // 500KB
  if (totalMinified <= targetSize) {
    console.log('✅ Target bundle size achieved!');
    console.log(`   Target: ${formatBytes(targetSize)}`);
    console.log(`   Actual: ${formatBytes(totalMinified)}`);
    console.log(`   Under by: ${formatBytes(targetSize - totalMinified)}`);
  } else {
    console.log('⚠️  Target bundle size not yet achieved');
    console.log(`   Target: ${formatBytes(targetSize)}`);
    console.log(`   Actual: ${formatBytes(totalMinified)}`);
    console.log(`   Over by: ${formatBytes(totalMinified - targetSize)}`);
  }

  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Run: npm run gzip-check');
  console.log('   2. Check gzipped bundle size');
  console.log('   3. Consider code splitting for further optimization');
  console.log('');

  // Save results to JSON
  const reportPath = 'bundle-optimization-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    filesProcessed: files.length,
    originalSize: totalOriginal,
    minifiedSize: totalMinified,
    reduction: totalSavings,
    reductionPercent: totalSavingsPercent,
    targetSize: targetSize,
    targetMet: totalMinified <= targetSize,
    files: results
  }, null, 2));

  console.log(`📄 Full report saved to: ${reportPath}`);
  console.log('');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
