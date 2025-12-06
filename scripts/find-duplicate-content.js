const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Finds duplicate content across the website by:
 * - File names (similar entity names)
 * - Headings (H1, H2 content)
 * - Content similarity
 */

class DuplicateContentFinder {
  constructor() {
    this.files = [];
    this.duplicates = {
      byFilename: {},
      byHeading: {},
      byEntity: {},
      exactContent: {}
    };
  }

  // Scan directory recursively
  scanDirectory(dir, depth = 0) {
    if (depth > 6) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          this.scanDirectory(fullPath, depth + 1);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
          this.analyzeFile(fullPath);
        }
      });
    } catch (err) {
      // Skip inaccessible directories
    }
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(/\\/g, '/');

    // Extract metadata
    const fileName = path.basename(filePath, '.html');
    const headings = this.extractHeadings(content);
    const h1 = headings.h1[0] || '';

    // Calculate content hash (excluding scripts/styles)
    const cleanContent = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();

    const contentHash = crypto.createHash('md5').update(cleanContent).digest('hex');

    const fileData = {
      path: relativePath,
      fileName,
      h1,
      headings,
      contentHash,
      size: cleanContent.length
    };

    this.files.push(fileData);
  }

  extractHeadings(content) {
    const h1Pattern = /<h1[^>]*>(.*?)<\/h1>/gi;
    const h2Pattern = /<h2[^>]*>(.*?)<\/h2>/gi;

    const h1s = [];
    const h2s = [];

    let match;
    while ((match = h1Pattern.exec(content)) !== null) {
      h1s.push(this.stripHtml(match[1]));
    }

    while ((match = h2Pattern.exec(content)) !== null) {
      h2s.push(this.stripHtml(match[1]));
    }

    return { h1: h1s, h2: h2s };
  }

  stripHtml(html) {
    return html.replace(/<[^>]+>/g, '').trim();
  }

  findDuplicates() {
    console.log(`\n🔍 Analyzing ${this.files.length} HTML files...\n`);

    // 1. Find files with similar names (deity pages in different mythologies)
    this.findFilenamePatterns();

    // 2. Find pages with identical H1 headings
    this.findHeadingDuplicates();

    // 3. Find entity duplicates (deity/creature/etc pages)
    this.findEntityDuplicates();

    // 4. Find exact content duplicates
    this.findExactDuplicates();
  }

  findFilenamePatterns() {
    const patterns = {};

    this.files.forEach(file => {
      const normalized = file.fileName.toLowerCase()
        .replace(/_detailed|_enhanced|_old|_new/g, '')
        .replace(/[-_]/g, '');

      if (!patterns[normalized]) {
        patterns[normalized] = [];
      }
      patterns[normalized].push(file);
    });

    // Filter to only patterns with multiple files
    Object.entries(patterns).forEach(([pattern, files]) => {
      if (files.length > 1) {
        this.duplicates.byFilename[pattern] = files;
      }
    });
  }

  findHeadingDuplicates() {
    const headingMap = {};

    this.files.forEach(file => {
      if (file.h1) {
        const normalized = file.h1.toLowerCase().trim();
        if (!headingMap[normalized]) {
          headingMap[normalized] = [];
        }
        headingMap[normalized].push(file);
      }
    });

    Object.entries(headingMap).forEach(([heading, files]) => {
      if (files.length > 1) {
        this.duplicates.byHeading[heading] = files;
      }
    });
  }

  findEntityDuplicates() {
    // Look for deity/creature/item pages that might be duplicated
    const entityPages = this.files.filter(f =>
      f.path.includes('/deities/') ||
      f.path.includes('/creatures/') ||
      f.path.includes('/items/') ||
      f.path.includes('/heroes/')
    );

    const entityMap = {};

    entityPages.forEach(file => {
      const entityName = file.h1 || file.fileName;
      const normalized = entityName.toLowerCase().replace(/[^a-z]/g, '');

      if (!entityMap[normalized]) {
        entityMap[normalized] = [];
      }
      entityMap[normalized].push(file);
    });

    Object.entries(entityMap).forEach(([entity, files]) => {
      if (files.length > 1) {
        this.duplicates.byEntity[entity] = files;
      }
    });
  }

  findExactDuplicates() {
    const hashMap = {};

    this.files.forEach(file => {
      if (!hashMap[file.contentHash]) {
        hashMap[file.contentHash] = [];
      }
      hashMap[file.contentHash].push(file);
    });

    Object.entries(hashMap).forEach(([hash, files]) => {
      if (files.length > 1) {
        this.duplicates.exactContent[hash] = files;
      }
    });
  }

  generateReport() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         DUPLICATE CONTENT REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Exact duplicates (highest priority)
    console.log(`🎯 Exact Content Duplicates: ${Object.keys(this.duplicates.exactContent).length}`);
    if (Object.keys(this.duplicates.exactContent).length > 0) {
      console.log('   These files have identical content:\n');
      Object.entries(this.duplicates.exactContent).slice(0, 10).forEach(([hash, files]) => {
        console.log(`   Group (${files.length} files):`);
        files.forEach(f => console.log(`     - ${f.path}`));
        console.log('');
      });
    }

    // Heading duplicates
    console.log(`\n📝 Duplicate Headings: ${Object.keys(this.duplicates.byHeading).length}`);
    if (Object.keys(this.duplicates.byHeading).length > 0) {
      console.log('   Pages with same H1 heading:\n');
      Object.entries(this.duplicates.byHeading)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 15)
        .forEach(([heading, files]) => {
          console.log(`   "${heading}" (${files.length} pages):`);
          files.forEach(f => console.log(`     - ${f.path}`));
          console.log('');
        });
    }

    // Entity duplicates
    console.log(`\n👤 Entity Duplicates: ${Object.keys(this.duplicates.byEntity).length}`);
    if (Object.keys(this.duplicates.byEntity).length > 0) {
      console.log('   Same entity in multiple mythologies:\n');
      Object.entries(this.duplicates.byEntity)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 15)
        .forEach(([entity, files]) => {
          console.log(`   Entity: ${files[0].h1 || files[0].fileName} (${files.length} pages):`);
          files.forEach(f => console.log(`     - ${f.path}`));
          console.log('');
        });
    }

    // Filename patterns
    console.log(`\n📄 Similar Filenames: ${Object.keys(this.duplicates.byFilename).length}`);
    if (Object.keys(this.duplicates.byFilename).length > 0) {
      console.log('   Files with similar names:\n');
      Object.entries(this.duplicates.byFilename)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10)
        .forEach(([pattern, files]) => {
          if (files.length > 1) {
            console.log(`   Pattern: ${pattern} (${files.length} files):`);
            files.forEach(f => console.log(`     - ${f.path}`));
            console.log('');
          }
        });
    }

    // Save detailed report
    const report = {
      summary: {
        totalFiles: this.files.length,
        exactDuplicates: Object.keys(this.duplicates.exactContent).length,
        headingDuplicates: Object.keys(this.duplicates.byHeading).length,
        entityDuplicates: Object.keys(this.duplicates.byEntity).length,
        filenameDuplicates: Object.keys(this.duplicates.byFilename).length
      },
      duplicates: this.duplicates
    };

    fs.writeFileSync(
      'scripts/reports/duplicate-content.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n📝 Detailed report saved to scripts/reports/duplicate-content.json\n');

    // Generate recommendations
    this.generateRecommendations();
  }

  generateRecommendations() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════\n');

    const totalDuplicates =
      Object.keys(this.duplicates.exactContent).length +
      Object.keys(this.duplicates.byHeading).length +
      Object.keys(this.duplicates.byEntity).length;

    if (totalDuplicates === 0) {
      console.log('✅ No significant duplicates found!\n');
      return;
    }

    console.log('Action Items:\n');

    if (Object.keys(this.duplicates.exactContent).length > 0) {
      console.log(`1. 🔥 DELETE ${Object.keys(this.duplicates.exactContent).length} exact duplicate files (keep one, delete rest)`);
    }

    if (Object.keys(this.duplicates.byEntity).length > 0) {
      console.log(`2. 🔀 MERGE ${Object.keys(this.duplicates.byEntity).length} entity duplicates into unified entity system`);
      console.log('   - Add mythology tags to unified entities');
      console.log('   - Use entity panels/cards to display in multiple places');
    }

    if (Object.keys(this.duplicates.byHeading).length > 0) {
      console.log(`3. 📋 REVIEW ${Object.keys(this.duplicates.byHeading).length} heading duplicates`);
      console.log('   - Check if content differs despite same heading');
      console.log('   - Merge if identical, differentiate if distinct');
    }

    console.log('\n💡 Strategy: Use unified entity system + reusable components instead of duplicate pages\n');
  }

  run() {
    console.log('🔍 Scanning for duplicate content...\n');

    const dirs = ['mythos', 'magic', 'cosmology', 'archetypes', 'components'];
    dirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir);
      }
    });

    this.findDuplicates();
    this.generateReport();
  }
}

// Run finder
const finder = new DuplicateContentFinder();
finder.run();
