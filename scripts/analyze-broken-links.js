const fs = require('fs');
const path = require('path');

/**
 * Analyzes broken links report and categorizes them
 */

class BrokenLinkAnalyzer {
  constructor() {
    this.categories = {
      templates: [],
      missingPages: [],
      fixableAbsolute: [],
      incorrectPaths: []
    };
  }

  analyze() {
    const report = JSON.parse(fs.readFileSync('scripts/reports/broken-links.json', 'utf8'));

    console.log('🔍 Analyzing broken links...\n');
    console.log(`Total broken links: ${report.brokenLinks.length}\n`);

    report.brokenLinks.forEach(link => {
      this.categorizeLink(link);
    });

    this.generateReport();
  }

  categorizeLink(link) {
    const { file, link: href, resolvedPath } = link;

    // Template placeholders
    if (href.includes('[') || href.includes('path/to/')) {
      this.categories.templates.push(link);
      return;
    }

    // Absolute paths that can be fixed
    if (href.startsWith('/')) {
      this.categories.fixableAbsolute.push(link);
      return;
    }

    // Check if it's just a missing page
    if (!fs.existsSync(resolvedPath)) {
      this.categories.missingPages.push(link);
      return;
    }

    // Incorrect relative path
    this.categories.incorrectPaths.push(link);
  }

  generateReport() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         BROKEN LINK ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📋 Template Placeholders: ${this.categories.templates.length}`);
    console.log('   (These are intentional - documentation examples)\n');

    console.log(`🔧 Fixable Absolute Paths: ${this.categories.fixableAbsolute.length}`);
    if (this.categories.fixableAbsolute.length > 0) {
      console.log('   Files with absolute paths:');
      const fileSet = new Set(this.categories.fixableAbsolute.map(l => l.file));
      fileSet.forEach(f => console.log(`   - ${f}`));
      console.log('');
    }

    console.log(`📄 Missing Pages: ${this.categories.missingPages.length}`);
    if (this.categories.missingPages.length > 0) {
      console.log('   Pages that need to be created:');
      const pageSet = new Set(this.categories.missingPages.map(l => l.resolvedPath));
      const pageCounts = {};
      this.categories.missingPages.forEach(l => {
        pageCounts[l.resolvedPath] = (pageCounts[l.resolvedPath] || 0) + 1;
      });

      Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([page, count]) => {
          console.log(`   - ${page} (${count} references)`);
        });

      if (Object.keys(pageCounts).length > 20) {
        console.log(`   ... and ${Object.keys(pageCounts).length - 20} more`);
      }
      console.log('');
    }

    console.log(`❓ Incorrect Paths: ${this.categories.incorrectPaths.length}\n`);

    // Save detailed report
    fs.writeFileSync(
      'scripts/reports/broken-links-analysis.json',
      JSON.stringify(this.categories, null, 2)
    );

    console.log('📝 Detailed report saved to scripts/reports/broken-links-analysis.json\n');

    // Generate action plan
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         ACTION PLAN');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (this.categories.fixableAbsolute.length > 0) {
      console.log(`✅ Fix ${this.categories.fixableAbsolute.length} absolute paths (high priority)`);
    }

    if (this.categories.missingPages.length > 0) {
      const uniquePages = new Set(this.categories.missingPages.map(l => l.resolvedPath));
      console.log(`📄 Create ${uniquePages.size} missing pages OR remove broken links (medium priority)`);
    }

    console.log(`✓  Ignore ${this.categories.templates.length} template placeholders (expected)\n`);
  }
}

// Run analyzer
const analyzer = new BrokenLinkAnalyzer();
analyzer.analyze();
