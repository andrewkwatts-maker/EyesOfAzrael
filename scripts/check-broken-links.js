const fs = require('fs');
const path = require('path');

/**
 * Checks for broken internal links across the website
 * Validates:
 * 1. Relative links to HTML files
 * 2. Links to entity pages
 * 3. Links to assets (CSS, JS, images)
 * 4. Anchor links within pages
 */

class BrokenLinkChecker {
  constructor() {
    this.allFiles = new Set();
    this.brokenLinks = [];
    this.warnings = [];
    this.stats = {
      totalFiles: 0,
      totalLinks: 0,
      brokenLinks: 0,
      warnings: 0
    };
  }

  // Build index of all files
  indexFiles(dir, baseDir = dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        if (!['node_modules', '.git', '.vscode'].includes(entry.name)) {
          this.indexFiles(fullPath, baseDir);
        }
      } else {
        this.allFiles.add(relativePath.replace(/\\/g, '/'));
      }
    });
  }

  checkHtmlFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    // Extract all href and src attributes
    const linkPattern = /(?:href|src)=["']([^"']+)["']/g;
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
      const link = match[1];
      this.stats.totalLinks++;

      // Skip external links, mailto, tel, and hash-only anchors
      if (link.startsWith('http://') ||
          link.startsWith('https://') ||
          link.startsWith('mailto:') ||
          link.startsWith('tel:') ||
          link.startsWith('#') ||
          link.startsWith('data:')) {
        continue;
      }

      // Remove hash/query params for file checking
      const linkWithoutHash = link.split('#')[0].split('?')[0];
      if (!linkWithoutHash) continue; // Was just a hash

      // Resolve the link relative to the current file
      const fileDir = path.dirname(filePath);
      const resolvedPath = path.resolve(fileDir, linkWithoutHash);
      const relativeResolved = path.relative(process.cwd(), resolvedPath).replace(/\\/g, '/');

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        this.brokenLinks.push({
          file: relPath,
          link: link,
          resolvedPath: relativeResolved,
          type: this.getLinkType(link)
        });
        this.stats.brokenLinks++;
      } else {
        // File exists - check for hash anchor if present
        if (link.includes('#')) {
          const hash = link.split('#')[1];
          if (hash && this.getLinkType(link) === 'html') {
            this.checkAnchor(resolvedPath, hash, relPath, link);
          }
        }
      }
    }
  }

  checkAnchor(targetFile, anchor, sourceFile, fullLink) {
    const content = fs.readFileSync(targetFile, 'utf8');

    // Check for id="anchor" or name="anchor"
    const idPattern = new RegExp(`id=["']${anchor}["']`, 'i');
    const namePattern = new RegExp(`name=["']${anchor}["']`, 'i');

    if (!idPattern.test(content) && !namePattern.test(content)) {
      this.warnings.push({
        file: sourceFile,
        link: fullLink,
        issue: `Anchor #${anchor} not found in target file`,
        type: 'missing-anchor'
      });
      this.stats.warnings++;
    }
  }

  getLinkType(link) {
    if (link.endsWith('.html')) return 'html';
    if (link.endsWith('.css')) return 'css';
    if (link.endsWith('.js')) return 'js';
    if (link.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) return 'image';
    if (link.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (link.match(/\.(json)$/i)) return 'data';
    return 'other';
  }

  scanAllHtmlFiles(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!['node_modules', '.git', '.vscode'].includes(entry.name)) {
          this.scanAllHtmlFiles(fullPath);
        }
      } else if (entry.name.endsWith('.html')) {
        this.stats.totalFiles++;
        this.checkHtmlFile(fullPath);
      }
    });
  }

  generateReport() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('           BROKEN LINKS REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📊 Statistics:`);
    console.log(`   HTML files scanned: ${this.stats.totalFiles}`);
    console.log(`   Total links checked: ${this.stats.totalLinks}`);
    console.log(`   Broken links: ${this.stats.brokenLinks}`);
    console.log(`   Warnings: ${this.stats.warnings}\n`);

    // Group broken links by type
    if (this.brokenLinks.length > 0) {
      const byType = {};
      this.brokenLinks.forEach(link => {
        if (!byType[link.type]) byType[link.type] = [];
        byType[link.type].push(link);
      });

      console.log(`❌ BROKEN LINKS (${this.brokenLinks.length})`);
      console.log('─────────────────────────────────────────────────────────\n');

      Object.entries(byType).forEach(([type, links]) => {
        console.log(`📁 ${type.toUpperCase()} (${links.length}):\n`);

        links.slice(0, 20).forEach(link => {
          console.log(`   File: ${link.file}`);
          console.log(`   Link: ${link.link}`);
          console.log(`   Expected: ${link.resolvedPath}`);
          console.log();
        });

        if (links.length > 20) {
          console.log(`   ... and ${links.length - 20} more\n`);
        }
      });
    } else {
      console.log('✅ No broken links found!\n');
    }

    // Show warnings
    if (this.warnings.length > 0) {
      console.log(`⚠️  WARNINGS (${this.warnings.length})`);
      console.log('─────────────────────────────────────────────────────────\n');

      const groupedWarnings = {};
      this.warnings.forEach(w => {
        if (!groupedWarnings[w.type]) groupedWarnings[w.type] = [];
        groupedWarnings[w.type].push(w);
      });

      Object.entries(groupedWarnings).forEach(([type, warns]) => {
        console.log(`🔸 ${type.toUpperCase()} (${warns.length}):\n`);

        warns.slice(0, 10).forEach(w => {
          console.log(`   File: ${w.file}`);
          console.log(`   Link: ${w.link}`);
          console.log(`   Issue: ${w.issue}`);
          console.log();
        });

        if (warns.length > 10) {
          console.log(`   ... and ${warns.length - 10} more\n`);
        }
      });
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      brokenLinks: this.brokenLinks,
      warnings: this.warnings,
      summary: {
        healthScore: Math.round((1 - this.stats.brokenLinks / Math.max(this.stats.totalLinks, 1)) * 100),
        criticalIssues: this.brokenLinks.length,
        minorIssues: this.warnings.length
      }
    };

    fs.writeFileSync(
      'scripts/reports/broken-links.json',
      JSON.stringify(report, null, 2)
    );
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📝 Detailed report saved to scripts/reports/broken-links.json`);
    console.log(`🏥 Link Health Score: ${report.summary.healthScore}%\n`);
  }

  run() {
    console.log('🔍 Indexing all files...\n');
    this.indexFiles(process.cwd());

    console.log('🔗 Checking links in HTML files...\n');
    this.scanAllHtmlFiles(process.cwd());

    this.generateReport();
  }
}

// Run the checker
const checker = new BrokenLinkChecker();
checker.run();
