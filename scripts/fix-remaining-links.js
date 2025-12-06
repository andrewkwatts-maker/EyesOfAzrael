const fs = require('fs');
const path = require('path');

/**
 * Fixes remaining broken links after initial automated fixes
 * Focus: Template example paths and absolute paths in templates
 */

class RemainingLinkFixer {
  constructor() {
    this.fixes = 0;
  }

  // Fix components/nav.html absolute paths
  fixNavComponent() {
    console.log('🔧 Fixing components/nav.html...\n');

    const file = 'components/nav.html';
    if (!fs.existsSync(file)) return;

    let content = fs.readFileSync(file, 'utf8');

    // Fix all absolute paths to relative (components/ at root level)
    content = content.replace(/href="\/index\.html"/g, 'href="../index.html"');
    content = content.replace(/href="\/([a-z-]+)\.html"/g, 'href="../$1.html"');
    content = content.replace(/href="\/([a-z-]+)\//g, 'href="../$1/');

    fs.writeFileSync(file, content);
    console.log(`   ✅ Fixed: ${file}`);
    this.fixes++;
  }

  // Fix components/interlink-panel.html remaining absolute paths
  fixInterlinkPanelRemaining() {
    console.log('\n🔧 Fixing remaining interlink-panel.html paths...\n');

    const file = 'components/interlink-panel.html';
    if (!fs.existsSync(file)) return;

    let content = fs.readFileSync(file, 'utf8');

    // Fix herbalism paths
    content = content.replace(/href="\/herbalism\//g, 'href="../herbalism/');
    // Fix generic example paths
    content = content.replace(/href="\/path\/to\//g, 'href="../path/to/');

    fs.writeFileSync(file, content);
    console.log(`   ✅ Fixed: ${file}`);
    this.fixes++;
  }

  // Scan and fix all HTML files with absolute paths
  fixAllAbsolutePaths() {
    console.log('\n🔧 Scanning all HTML files for absolute paths...\n');

    const scanDir = (dir, depth = 0) => {
      if (depth > 5) return; // Prevent infinite recursion

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDir(fullPath, depth + 1);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
          this.fixFileAbsolutePaths(fullPath);
        }
      });
    };

    // Start from specific directories that have links
    const dirs = ['mythos', 'magic', 'cosmology', 'archetypes'];
    dirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        scanDir(dir);
      }
    });
  }

  fixFileAbsolutePaths(file) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Calculate depth based on path
    const depth = file.split(path.sep).length - 1;
    const prefix = '../'.repeat(depth);

    // Only fix absolute paths that start with / (not http://)
    const absolutePathPattern = /href="(\/[^"]+)"/g;
    const matches = content.match(absolutePathPattern);

    if (matches) {
      matches.forEach(match => {
        const link = match.match(/href="(\/[^"]+)"/)[1];

        // Skip external links and anchors
        if (link.startsWith('http') || link === '/' || link.startsWith('/#')) {
          return;
        }

        // Convert /path → ../path or ../../path etc based on depth
        const relativePath = prefix + link.substring(1);
        content = content.replace(match, `href="${relativePath}"`);
        modified = true;
      });
    }

    // Also check src attributes
    const absoluteSrcPattern = /src="(\/[^"]+)"/g;
    const srcMatches = content.match(absoluteSrcPattern);

    if (srcMatches) {
      srcMatches.forEach(match => {
        const link = match.match(/src="(\/[^"]+)"/)[1];

        if (link.startsWith('http')) {
          return;
        }

        const relativePath = prefix + link.substring(1);
        content = content.replace(match, `src="${relativePath}"`);
        modified = true;
      });
    }

    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`   ✅ Fixed: ${file}`);
      this.fixes++;
    }
  }

  generateReport() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('         REMAINING LINKS FIX REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📊 Total files fixed: ${this.fixes}\n`);
    console.log('✅ All remaining link fixes complete!\n');
    console.log('📝 Run check-broken-links.js to verify final status\n');
  }

  run() {
    console.log('🔧 Fixing remaining broken links...\n');

    this.fixNavComponent();
    this.fixInterlinkPanelRemaining();
    this.fixAllAbsolutePaths();

    this.generateReport();
  }
}

// Run fixer
const fixer = new RemainingLinkFixer();
fixer.run();
