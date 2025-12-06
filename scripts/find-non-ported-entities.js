const fs = require('fs');
const path = require('path');

/**
 * Scans the website for entity references that haven't been ported to the unified entity system
 * Checks:
 * 1. HTML files with entity content not in data/entities/
 * 2. References to old entity pages that should use auto-populate
 * 3. Hardcoded entity lists that should be dynamic
 */

class NonPortedEntityFinder {
  constructor() {
    this.entityIds = new Set();
    this.nonPortedEntities = [];
    this.hardcodedLists = [];
    this.oldStylePages = [];

    // Load all entity IDs from unified system
    this.loadEntityIds();
  }

  loadEntityIds() {
    const categories = ['concept', 'creature', 'deity', 'item', 'magic', 'place'];

    categories.forEach(category => {
      const categoryPath = path.join('data', 'entities', category);
      if (!fs.existsSync(categoryPath)) return;

      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
      files.forEach(file => {
        const entity = JSON.parse(fs.readFileSync(path.join(categoryPath, file), 'utf8'));
        this.entityIds.add(entity.id);
      });
    });

    console.log(`📊 Loaded ${this.entityIds.size} entities from unified system\n`);
  }

  scanDirectory(dir, mythologyFilter = null) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip certain directories
        if (['node_modules', '.git', 'themes', 'components'].includes(entry.name)) {
          return;
        }
        this.scanDirectory(fullPath, mythologyFilter);
      } else if (entry.name.endsWith('.html')) {
        this.scanHtmlFile(fullPath, mythologyFilter);
      }
    });
  }

  scanHtmlFile(filePath, mythologyFilter) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(process.cwd(), filePath);

    // Check for auto-populate usage
    const hasAutoPopulate = content.includes('data-auto-populate');

    // Check for hardcoded entity cards
    const entityCardPattern = /<div[^>]*class="entity-card"[^>]*>/g;
    const hardcodedCards = content.match(entityCardPattern);

    if (hardcodedCards && hardcodedCards.length > 0 && !hasAutoPopulate) {
      // Check if it's in mythos directory
      if (relPath.includes('mythos/')) {
        this.hardcodedLists.push({
          file: relPath,
          cardCount: hardcodedCards.length,
          hasAutoPopulate: false
        });
      }
    }

    // Check for old-style individual entity pages
    const isDetailPage = relPath.includes('mythos/') &&
                        !relPath.includes('/index.html') &&
                        !relPath.includes('/kabbalah/') &&
                        !relPath.includes('/heroes/');

    if (isDetailPage) {
      // Try to extract entity name from content
      const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : null;

      if (title) {
        // Check if this entity exists in unified system
        const slug = this.titleToSlug(title);
        if (!this.entityIds.has(slug)) {
          this.nonPortedEntities.push({
            file: relPath,
            title: title,
            suggestedSlug: slug
          });
        } else {
          this.oldStylePages.push({
            file: relPath,
            title: title,
            entityId: slug,
            note: 'Entity exists in system but has old standalone page'
          });
        }
      }
    }
  }

  titleToSlug(title) {
    return title.toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  scanForMissingEntities() {
    console.log('🔍 Scanning for non-ported entities...\n');

    // Scan mythos directory
    const mythologies = ['greek', 'norse', 'egyptian', 'hindu', 'celtic', 'chinese', 'japanese', 'jewish', 'roman'];

    mythologies.forEach(mythology => {
      const mythPath = path.join('mythos', mythology);
      if (fs.existsSync(mythPath)) {
        this.scanDirectory(mythPath, mythology);
      }
    });
  }

  generateReport() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         NON-PORTED ENTITIES REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Report 1: Non-ported entities
    if (this.nonPortedEntities.length > 0) {
      console.log(`❌ ENTITIES NOT IN UNIFIED SYSTEM (${this.nonPortedEntities.length})`);
      console.log('─────────────────────────────────────────────────────────\n');

      this.nonPortedEntities.forEach(entity => {
        console.log(`📄 ${entity.file}`);
        console.log(`   Title: ${entity.title}`);
        console.log(`   Suggested ID: ${entity.suggestedSlug}`);
        console.log();
      });
    } else {
      console.log('✅ All standalone entity pages are ported to unified system\n');
    }

    // Report 2: Hardcoded entity lists
    if (this.hardcodedLists.length > 0) {
      console.log(`⚠️  HARDCODED ENTITY LISTS (${this.hardcodedLists.length})`);
      console.log('─────────────────────────────────────────────────────────\n');
      console.log('These pages have hardcoded entity cards instead of auto-populate:\n');

      this.hardcodedLists.forEach(page => {
        console.log(`📄 ${page.file}`);
        console.log(`   Cards: ${page.cardCount}`);
        console.log(`   Action: Convert to data-auto-populate`);
        console.log();
      });
    } else {
      console.log('✅ No hardcoded entity lists found\n');
    }

    // Report 3: Old-style pages that could be removed
    if (this.oldStylePages.length > 0) {
      console.log(`🔄 OLD STANDALONE PAGES (${this.oldStylePages.length})`);
      console.log('─────────────────────────────────────────────────────────\n');
      console.log('These pages exist but entity is already in unified system:\n');

      this.oldStylePages.forEach(page => {
        console.log(`📄 ${page.file}`);
        console.log(`   Entity: ${page.title} (${page.entityId})`);
        console.log(`   Action: Can potentially be removed or redirected`);
        console.log();
      });
    } else {
      console.log('✅ No duplicate old-style pages found\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`Total entities in unified system: ${this.entityIds.size}`);
    console.log(`Non-ported entities found: ${this.nonPortedEntities.length}`);
    console.log(`Hardcoded lists to convert: ${this.hardcodedLists.length}`);
    console.log(`Old-style pages to review: ${this.oldStylePages.length}`);
    console.log();

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      totalEntitiesInSystem: this.entityIds.size,
      nonPortedEntities: this.nonPortedEntities,
      hardcodedLists: this.hardcodedLists,
      oldStylePages: this.oldStylePages,
      summary: {
        nonPortedCount: this.nonPortedEntities.length,
        hardcodedListsCount: this.hardcodedLists.length,
        oldStylePagesCount: this.oldStylePages.length
      }
    };

    fs.writeFileSync(
      'scripts/reports/non-ported-entities.json',
      JSON.stringify(report, null, 2)
    );
    console.log('📝 Detailed report saved to scripts/reports/non-ported-entities.json\n');
  }

  run() {
    // Ensure reports directory exists
    if (!fs.existsSync('scripts/reports')) {
      fs.mkdirSync('scripts/reports', { recursive: true });
    }

    this.scanForMissingEntities();
    this.generateReport();
  }
}

// Run the scanner
const finder = new NonPortedEntityFinder();
finder.run();
