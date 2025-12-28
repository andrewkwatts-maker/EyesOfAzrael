const fs = require('fs');
const path = require('path');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHTML } = require('html-minifier');
const glob = require('glob');

const OUTPUT_DIR = 'dist';

async function buildProduction() {
  console.log('🚀 Building for production...\n');

  // Clean dist directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Minify JavaScript
  await minifyJavaScript();

  // Minify CSS
  await minifyCSS();

  // Minify HTML
  await minifyHTMLFiles();

  // Copy static assets
  copyStaticAssets();

  // Generate report
  generateBuildReport();

  console.log('\n✅ Production build complete!');
}

async function minifyJavaScript() {
  console.log('📦 Minifying JavaScript...');

  const files = glob.sync('js/**/*.js', {
    ignore: ['js/**/*.min.js', 'js/vendor/**']
  });

  let totalSavings = 0;

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const originalSize = code.length;

    const result = await minifyJS(code, {
      compress: {
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        pure_funcs: ['console.log', 'console.debug', 'console.info']
      },
      mangle: {
        toplevel: true,
        safari10: true
      },
      format: {
        comments: false,
        ecma: 2020
      },
      sourceMap: {
        filename: path.basename(file),
        url: path.basename(file) + '.map'
      }
    });

    const minifiedSize = result.code.length;
    totalSavings += originalSize - minifiedSize;

    // Write minified file
    const outPath = path.join(OUTPUT_DIR, file);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, result.code);
    fs.writeFileSync(outPath + '.map', result.map);

    const reduction = ((1 - minifiedSize/originalSize) * 100).toFixed(1);
    console.log(`  ✓ ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(minifiedSize/1024).toFixed(1)}KB (-${reduction}%)`);
  }

  console.log(`  Total JS savings: ${(totalSavings/1024).toFixed(1)}KB\n`);
}

async function minifyCSS() {
  console.log('🎨 Minifying CSS...');

  const files = glob.sync('css/**/*.css', {
    ignore: ['css/**/*.min.css']
  });

  const cleanCSS = new CleanCSS({
    level: 2,
    sourceMap: true
  });

  let totalSavings = 0;

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const originalSize = code.length;

    const result = cleanCSS.minify(code);
    const minifiedSize = result.styles.length;
    totalSavings += originalSize - minifiedSize;

    const outPath = path.join(OUTPUT_DIR, file);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, result.styles);

    if (result.sourceMap) {
      fs.writeFileSync(outPath + '.map', result.sourceMap.toString());
    }

    const reduction = ((1 - minifiedSize/originalSize) * 100).toFixed(1);
    console.log(`  ✓ ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(minifiedSize/1024).toFixed(1)}KB (-${reduction}%)`);
  }

  console.log(`  Total CSS savings: ${(totalSavings/1024).toFixed(1)}KB\n`);
}

async function minifyHTMLFiles() {
  console.log('📄 Minifying HTML...');

  const files = glob.sync('*.html');

  let totalSavings = 0;
  let errorCount = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const originalSize = html.length;

    try {
      const minified = minifyHTML(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyJS: false, // Disable inline JS minification to avoid parsing errors
        minifyCSS: false, // Disable inline CSS minification to avoid parsing errors
        removeAttributeQuotes: false, // Keep quotes to avoid breaking attributes
        removeRedundantAttributes: true,
        useShortDoctype: true,
        continueOnParseError: true // Continue even if parsing errors occur
      });

      const minifiedSize = minified.length;
      totalSavings += originalSize - minifiedSize;

      // Update script/link paths to point to dist/
      const updated = minified.replace(/src="(js\/[^"]+)"/g, 'src="dist/$1"')
                              .replace(/href="(css\/[^"]+)"/g, 'href="dist/$1"');

      fs.writeFileSync(path.join(OUTPUT_DIR, file), updated);

      const reduction = ((1 - minifiedSize/originalSize) * 100).toFixed(1);
      console.log(`  ✓ ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(minifiedSize/1024).toFixed(1)}KB (-${reduction}%)`);
    } catch (error) {
      errorCount++;
      console.log(`  ⚠ ${file}: Minification failed, copying original (${error.message.substring(0, 50)}...)`);

      // Copy original file if minification fails
      fs.mkdirSync(path.dirname(path.join(OUTPUT_DIR, file)), { recursive: true });
      fs.writeFileSync(path.join(OUTPUT_DIR, file), html);
    }
  }

  console.log(`  Total HTML savings: ${(totalSavings/1024).toFixed(1)}KB`);
  if (errorCount > 0) {
    console.log(`  ⚠ ${errorCount} files could not be minified and were copied as-is\n`);
  } else {
    console.log();
  }
}

function copyStaticAssets() {
  console.log('📁 Copying static assets...');

  const assetDirs = ['images', 'fonts', 'icons', 'mythos'];

  assetDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.cpSync(dir, path.join(OUTPUT_DIR, dir), { recursive: true });
      console.log(`  ✓ ${dir}/`);
    }
  });

  console.log();
}

function generateBuildReport() {
  const jsFiles = glob.sync(path.join(OUTPUT_DIR, 'js', '**', '*.js'), { nodir: true, ignore: ['**/*.map'] });
  const cssFiles = glob.sync(path.join(OUTPUT_DIR, 'css', '**', '*.css'), { nodir: true, ignore: ['**/*.map'] });
  const htmlFiles = glob.sync(path.join(OUTPUT_DIR, '*.html'), { nodir: true });

  const report = {
    buildDate: new Date().toISOString(),
    sizes: {
      js: calculateDirSize(path.join(OUTPUT_DIR, 'js')),
      css: calculateDirSize(path.join(OUTPUT_DIR, 'css')),
      html: calculateDirSize(OUTPUT_DIR, '*.html'),
      assets: calculateDirSize(path.join(OUTPUT_DIR, 'mythos')),
      total: calculateDirSize(OUTPUT_DIR)
    },
    files: {
      js: jsFiles.length,
      css: cssFiles.length,
      html: htmlFiles.length
    }
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'build-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('📊 Build Report:');
  console.log(`  JS: ${(report.sizes.js/1024).toFixed(1)}KB (${report.files.js} files)`);
  console.log(`  CSS: ${(report.sizes.css/1024).toFixed(1)}KB (${report.files.css} files)`);
  console.log(`  HTML: ${(report.sizes.html/1024).toFixed(1)}KB (${report.files.html} files)`);
  console.log(`  Assets: ${(report.sizes.assets/1024).toFixed(1)}KB`);
  console.log(`  Total: ${(report.sizes.total/1024/1024).toFixed(2)}MB`);
}

function calculateDirSize(dir) {
  if (!fs.existsSync(dir)) return 0;

  let size = 0;
  const files = glob.sync(path.join(dir, '**/*'), { nodir: true });

  files.forEach(file => {
    size += fs.statSync(file).size;
  });

  return size;
}

buildProduction().catch(console.error);
