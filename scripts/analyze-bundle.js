const fs = require('fs');
const path = require('path');
const glob = require('glob');

const OUTPUT_DIR = 'dist';
const REPORT_FILE = path.join(OUTPUT_DIR, 'bundle-analysis.json');

function analyzeBundle() {
  console.log('📊 Analyzing production bundle...\n');

  const analysis = {
    timestamp: new Date().toISOString(),
    javascript: analyzeJavaScript(),
    css: analyzeCSS(),
    html: analyzeHTML(),
    assets: analyzeAssets(),
    recommendations: []
  };

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);

  // Write analysis report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(analysis, null, 2));

  // Display summary
  displaySummary(analysis);

  console.log(`\n📄 Full report saved to: ${REPORT_FILE}`);
}

function analyzeJavaScript() {
  console.log('📦 Analyzing JavaScript...');

  const files = glob.sync(path.join(OUTPUT_DIR, 'js/**/*.js'), {
    ignore: ['**/*.map']
  });

  const fileAnalysis = files.map(file => {
    const stats = fs.statSync(file);
    const content = fs.readFileSync(file, 'utf8');

    return {
      path: file.replace(OUTPUT_DIR + path.sep, ''),
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
      lines: content.split('\n').length,
      hasSourceMap: fs.existsSync(file + '.map')
    };
  }).sort((a, b) => b.size - a.size);

  const totalSize = fileAnalysis.reduce((sum, f) => sum + f.size, 0);

  console.log(`  Found ${fileAnalysis.length} JavaScript files`);
  console.log(`  Total size: ${(totalSize / 1024).toFixed(1)}KB\n`);

  return {
    files: fileAnalysis,
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    count: fileAnalysis.length,
    largest: fileAnalysis.slice(0, 10)
  };
}

function analyzeCSS() {
  console.log('🎨 Analyzing CSS...');

  const files = glob.sync(path.join(OUTPUT_DIR, 'css/**/*.css'), {
    ignore: ['**/*.map']
  });

  const fileAnalysis = files.map(file => {
    const stats = fs.statSync(file);
    const content = fs.readFileSync(file, 'utf8');

    // Count selectors (rough approximation)
    const selectorCount = (content.match(/\{/g) || []).length;

    return {
      path: file.replace(OUTPUT_DIR + path.sep, ''),
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
      selectors: selectorCount,
      hasSourceMap: fs.existsSync(file + '.map')
    };
  }).sort((a, b) => b.size - a.size);

  const totalSize = fileAnalysis.reduce((sum, f) => sum + f.size, 0);

  console.log(`  Found ${fileAnalysis.length} CSS files`);
  console.log(`  Total size: ${(totalSize / 1024).toFixed(1)}KB\n`);

  return {
    files: fileAnalysis,
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    count: fileAnalysis.length,
    largest: fileAnalysis.slice(0, 10)
  };
}

function analyzeHTML() {
  console.log('📄 Analyzing HTML...');

  const files = glob.sync(path.join(OUTPUT_DIR, '**/*.html'));

  const fileAnalysis = files.map(file => {
    const stats = fs.statSync(file);

    return {
      path: file.replace(OUTPUT_DIR + path.sep, ''),
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2)
    };
  }).sort((a, b) => b.size - a.size);

  const totalSize = fileAnalysis.reduce((sum, f) => sum + f.size, 0);

  console.log(`  Found ${fileAnalysis.length} HTML files`);
  console.log(`  Total size: ${(totalSize / 1024).toFixed(1)}KB\n`);

  return {
    files: fileAnalysis,
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    count: fileAnalysis.length,
    largest: fileAnalysis.slice(0, 10)
  };
}

function analyzeAssets() {
  console.log('🖼️ Analyzing static assets...');

  const assetDirs = ['images', 'fonts', 'icons', 'mythos'];
  const assets = {};
  let totalSize = 0;

  assetDirs.forEach(dir => {
    const dirPath = path.join(OUTPUT_DIR, dir);

    if (fs.existsSync(dirPath)) {
      const files = glob.sync(path.join(dirPath, '**/*'), { nodir: true });
      const dirSize = files.reduce((sum, file) => {
        return sum + fs.statSync(file).size;
      }, 0);

      assets[dir] = {
        count: files.length,
        size: dirSize,
        sizeKB: (dirSize / 1024).toFixed(2),
        sizeMB: (dirSize / 1024 / 1024).toFixed(2)
      };

      totalSize += dirSize;

      console.log(`  ${dir}/: ${files.length} files, ${(dirSize / 1024).toFixed(1)}KB`);
    }
  });

  console.log(`  Total assets: ${(totalSize / 1024).toFixed(1)}KB\n`);

  return {
    directories: assets,
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
  };
}

function generateRecommendations(analysis) {
  const recommendations = [];

  // Check for large JavaScript files
  const largeJS = analysis.javascript.files.filter(f => f.size > 100 * 1024);
  if (largeJS.length > 0) {
    recommendations.push({
      type: 'warning',
      category: 'JavaScript',
      message: `${largeJS.length} JavaScript files are larger than 100KB`,
      files: largeJS.map(f => f.path),
      suggestion: 'Consider code splitting or lazy loading for these files'
    });
  }

  // Check for large CSS files
  const largeCSS = analysis.css.files.filter(f => f.size > 50 * 1024);
  if (largeCSS.length > 0) {
    recommendations.push({
      type: 'warning',
      category: 'CSS',
      message: `${largeCSS.length} CSS files are larger than 50KB`,
      files: largeCSS.map(f => f.path),
      suggestion: 'Consider splitting CSS or removing unused styles'
    });
  }

  // Check for missing source maps
  const missingSourceMapsJS = analysis.javascript.files.filter(f => !f.hasSourceMap);
  if (missingSourceMapsJS.length > 0) {
    recommendations.push({
      type: 'info',
      category: 'Source Maps',
      message: `${missingSourceMapsJS.length} JavaScript files are missing source maps`,
      suggestion: 'Ensure all files have source maps for debugging'
    });
  }

  // Check total bundle size
  const totalMB = (analysis.javascript.totalSize + analysis.css.totalSize) / 1024 / 1024;
  if (totalMB > 5) {
    recommendations.push({
      type: 'warning',
      category: 'Bundle Size',
      message: `Total bundle size is ${totalMB.toFixed(2)}MB`,
      suggestion: 'Consider implementing code splitting and lazy loading'
    });
  } else if (totalMB < 1) {
    recommendations.push({
      type: 'success',
      category: 'Bundle Size',
      message: `Excellent! Total bundle size is only ${totalMB.toFixed(2)}MB`,
      suggestion: 'Bundle size is optimized'
    });
  }

  // Check asset optimization
  const assetsMB = parseFloat(analysis.assets.totalSizeMB);
  if (assetsMB > 20) {
    recommendations.push({
      type: 'warning',
      category: 'Assets',
      message: `Static assets are ${assetsMB}MB`,
      suggestion: 'Consider image optimization, compression, or lazy loading'
    });
  }

  return recommendations;
}

function displaySummary(analysis) {
  console.log('\n📊 Bundle Analysis Summary\n');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📦 JavaScript:');
  console.log(`   Files: ${analysis.javascript.count}`);
  console.log(`   Total: ${analysis.javascript.totalSizeKB}KB`);
  console.log(`   Largest: ${analysis.javascript.largest[0]?.path || 'N/A'} (${analysis.javascript.largest[0]?.sizeKB || 0}KB)\n`);

  console.log('🎨 CSS:');
  console.log(`   Files: ${analysis.css.count}`);
  console.log(`   Total: ${analysis.css.totalSizeKB}KB`);
  console.log(`   Largest: ${analysis.css.largest[0]?.path || 'N/A'} (${analysis.css.largest[0]?.sizeKB || 0}KB)\n`);

  console.log('📄 HTML:');
  console.log(`   Files: ${analysis.html.count}`);
  console.log(`   Total: ${analysis.html.totalSizeKB}KB\n`);

  console.log('🖼️ Static Assets:');
  console.log(`   Total: ${analysis.assets.totalSizeMB}MB`);
  Object.keys(analysis.assets.directories).forEach(dir => {
    const info = analysis.assets.directories[dir];
    console.log(`   ${dir}/: ${info.count} files (${info.sizeMB}MB)`);
  });

  console.log('\n═══════════════════════════════════════════════════════\n');

  if (analysis.recommendations.length > 0) {
    console.log('💡 Recommendations:\n');

    analysis.recommendations.forEach((rec, idx) => {
      const icon = rec.type === 'success' ? '✅' :
                   rec.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${idx + 1}. ${icon} ${rec.category}: ${rec.message}`);
      console.log(`   → ${rec.suggestion}\n`);
    });
  } else {
    console.log('✅ No issues found - bundle is well optimized!\n');
  }
}

// Run analysis
analyzeBundle();
