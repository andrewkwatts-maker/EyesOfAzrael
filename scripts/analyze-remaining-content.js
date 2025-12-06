const fs = require('fs');
const path = require('path');

/**
 * Analyzes remaining content sections for entity migration
 * Sections: spiritual-items/, spiritual-places/, magic/, archetypes/
 */

class ContentAnalyzer {
  constructor() {
    this.sections = {
      items: { dir: 'spiritual-items', files: [], entities: [] },
      places: { dir: 'spiritual-places', files: [], entities: [] },
      magic: { dir: 'magic', files: [], entities: [] },
      archetypes: { dir: 'archetypes', files: [], entities: [] }
    };
    this.mythologyContent = {};
  }

  scanDirectory(dir, section, depth = 0) {
    if (depth > 6 || !fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        this.scanDirectory(fullPath, section, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        this.analyzeFile(fullPath, section);
      }
    });
  }

  analyzeFile(filePath, section) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(/\\/g, '/');

    // Extract metadata
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const h1 = h1Match ? this.stripHtml(h1Match[1]) : '';

    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? this.stripHtml(titleMatch[1]) : '';

    // Detect mythology references
    const mythologies = this.detectMythologies(content);

    // Check if it's an index/category page
    const isIndex = filePath.includes('index.html');

    // Extract content type hints
    const type = this.detectEntityType(filePath, h1, content);

    const fileData = {
      path: relativePath,
      fileName: path.basename(filePath, '.html'),
      h1,
      title,
      mythologies,
      isIndex,
      type,
      hasMetadata: this.hasMetadata(content),
      size: content.length
    };

    this.sections[section].files.push(fileData);

    // Track as potential entity if not an index
    if (!isIndex && h1) {
      this.sections[section].entities.push(fileData);
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]+>/g, '').replace(/[🌟⚡🔮🏛️⚔️🌿✨🕯️📿🗡️⚖️🌙☀️💎🔥💧🌊🏔️🌳]/g, '').trim();
  }

  detectMythologies(content) {
    const mythologies = new Set();
    const mythologyKeywords = {
      greek: ['zeus', 'apollo', 'athena', 'olympus', 'greek'],
      norse: ['odin', 'thor', 'loki', 'asgard', 'norse', 'viking'],
      egyptian: ['ra', 'isis', 'osiris', 'egypt'],
      hindu: ['vishnu', 'shiva', 'brahma', 'hindu', 'vedic'],
      celtic: ['dagda', 'brigid', 'celtic', 'druid'],
      chinese: ['jade emperor', 'chinese', 'tao'],
      japanese: ['amaterasu', 'japanese', 'shinto'],
      jewish: ['yahweh', 'kabbalah', 'jewish', 'hebrew'],
      roman: ['jupiter', 'mars', 'roman'],
      christian: ['jesus', 'christ', 'christian', 'bible']
    };

    const lowerContent = content.toLowerCase();

    Object.entries(mythologyKeywords).forEach(([myth, keywords]) => {
      if (keywords.some(kw => lowerContent.includes(kw))) {
        mythologies.add(myth);
      }
    });

    return Array.from(mythologies);
  }

  detectEntityType(filePath, h1, content) {
    const lower = (filePath + ' ' + h1).toLowerCase();

    if (lower.includes('weapon') || lower.includes('sword') || lower.includes('spear')) return 'weapon';
    if (lower.includes('ritual') || lower.includes('ceremony')) return 'ritual-item';
    if (lower.includes('temple') || lower.includes('shrine')) return 'temple';
    if (lower.includes('mountain') || lower.includes('river')) return 'sacred-place';
    if (lower.includes('spell') || lower.includes('ritual')) return 'magical-practice';
    if (lower.includes('tradition')) return 'magical-tradition';
    if (lower.includes('archetype')) return 'archetype';

    return 'unknown';
  }

  hasMetadata(content) {
    // Check for common metadata patterns
    return content.includes('data-entity-id') ||
           content.includes('entity-panel') ||
           content.includes('"id"') ||
           content.includes('mythology:');
  }

  analyzeExistingEntities() {
    console.log('\n🔍 Analyzing existing entity system...\n');

    const entityDir = 'data/entities';
    const categories = ['item', 'place', 'magic', 'concept'];

    categories.forEach(category => {
      const categoryPath = path.join(entityDir, category);
      if (fs.existsSync(categoryPath)) {
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
        console.log(`   ${category}: ${files.length} entities`);
      }
    });
  }

  generateReport() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('         REMAINING CONTENT ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════\n');

    let totalFiles = 0;
    let totalEntities = 0;

    Object.entries(this.sections).forEach(([name, data]) => {
      totalFiles += data.files.length;
      totalEntities += data.entities.length;

      console.log(`📁 ${name.toUpperCase()} (${data.dir})`);
      console.log(`   Files: ${data.files.length}`);
      console.log(`   Potential entities: ${data.entities.length}`);
      console.log(`   Index pages: ${data.files.filter(f => f.isIndex).length}`);

      // Count by type
      const types = {};
      data.entities.forEach(e => {
        types[e.type] = (types[e.type] || 0) + 1;
      });

      if (Object.keys(types).length > 0) {
        console.log(`   Types:`);
        Object.entries(types).forEach(([type, count]) => {
          console.log(`     - ${type}: ${count}`);
        });
      }

      // Show mythology distribution
      const mythCounts = {};
      data.entities.forEach(e => {
        e.mythologies.forEach(m => {
          mythCounts[m] = (mythCounts[m] || 0) + 1;
        });
      });

      if (Object.keys(mythCounts).length > 0) {
        console.log(`   Mythologies referenced:`);
        Object.entries(mythCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([myth, count]) => {
            console.log(`     - ${myth}: ${count}`);
          });
      }

      console.log('');
    });

    console.log(`📊 TOTALS:`);
    console.log(`   Files: ${totalFiles}`);
    console.log(`   Entities to migrate: ${totalEntities}`);
    console.log(`   Index pages: ${totalFiles - totalEntities}\n`);

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles,
        totalEntities,
        indexPages: totalFiles - totalEntities
      },
      sections: this.sections
    };

    fs.writeFileSync(
      'scripts/reports/remaining-content-analysis.json',
      JSON.stringify(report, null, 2)
    );

    console.log('📝 Detailed report saved to scripts/reports/remaining-content-analysis.json\n');

    this.generateMigrationPlan();
  }

  generateMigrationPlan() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         MIGRATION PLAN');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('🎯 STRATEGY: Unified Entity System + Mythology Attribution\n');

    console.log('Phase 1: ITEMS Migration');
    console.log('  Action: Migrate spiritual-items/ to data/entities/item/');
    console.log('  Method: Create entity JSON for each item');
    console.log('  Metadata: Add mythology tags, type classification');
    console.log('  UI: Replace standalone pages with entity panel references');
    console.log(`  Entities: ~${this.sections.items.entities.length} items\n`);

    console.log('Phase 2: PLACES Migration');
    console.log('  Action: Migrate spiritual-places/ to data/entities/place/');
    console.log('  Method: Create entity JSON for each place');
    console.log('  Metadata: Add coordinates, mythology tags, significance');
    console.log('  UI: Use unified place cards across mythologies');
    console.log(`  Entities: ~${this.sections.places.entities.length} places\n`);

    console.log('Phase 3: MAGIC Migration');
    console.log('  Action: Migrate magic/ to data/entities/magic/');
    console.log('  Method: Create entity JSON for practices/traditions');
    console.log('  Metadata: Add mythology attribution, practice type');
    console.log('  UI: Standardized magic practice cards');
    console.log(`  Entities: ~${this.sections.magic.entities.length} practices\n`);

    console.log('Phase 4: ARCHETYPES Migration');
    console.log('  Action: Migrate archetypes/ to data/entities/concept/');
    console.log('  Method: Create entity JSON for each archetype');
    console.log('  Metadata: Cross-mythology examples, characteristics');
    console.log('  UI: Archetype cards with mythology-specific instances');
    console.log(`  Entities: ~${this.sections.archetypes.entities.length} archetypes\n`);

    console.log('🎯 BENEFITS:');
    console.log('  ✅ Single source of truth per entity');
    console.log('  ✅ Reusable across mythologies');
    console.log('  ✅ Standardized UI presentation');
    console.log('  ✅ Searchable/sortable metadata');
    console.log('  ✅ No content conflicts\n');

    console.log('⚙️  NEXT STEPS:');
    console.log('  1. Launch specialized agent for each section');
    console.log('  2. Agents create entity JSONs from HTML content');
    console.log('  3. Agents update mythology pages to reference entities');
    console.log('  4. Agents create/update UI components for display');
    console.log('  5. Validation: Ensure all content migrated correctly\n');
  }

  run() {
    console.log('🔍 Analyzing remaining content sections...\n');

    Object.entries(this.sections).forEach(([name, data]) => {
      if (fs.existsSync(data.dir)) {
        this.scanDirectory(data.dir, name);
      }
    });

    this.analyzeExistingEntities();
    this.generateReport();
  }
}

// Run analyzer
const analyzer = new ContentAnalyzer();
analyzer.run();
