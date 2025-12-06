const fs = require('fs');
const path = require('path');

/**
 * Merges duplicate content intelligently:
 * 1. Fix obvious duplicates (freya/freyja, apollo in greek/roman)
 * 2. Merge redirect pages into proper entity pages
 * 3. Merge detailed/regular versions of same entity
 */

class DuplicateMerger {
  constructor() {
    this.actions = [];
    this.deleted = [];
    this.merged = [];
  }

  // Fix obvious filename duplicates
  fixObviousDuplicates() {
    console.log('🔧 Fixing obvious duplicates...\n');

    const fixes = [
      {
        // Freyja vs Freya - keep freyja, delete freya
        from: 'mythos/norse/deities/freya.html',
        to: 'mythos/norse/deities/freyja.html',
        action: 'delete_duplicate'
      }
    ];

    fixes.forEach(fix => {
      if (fs.existsSync(fix.from) && fs.existsSync(fix.to)) {
        // Check if they're actually the same content
        const fromContent = fs.readFileSync(fix.from, 'utf8');
        const toContent = fs.readFileSync(fix.to, 'utf8');

        // Simple similarity check
        const similar = this.contentSimilarity(fromContent, toContent);

        if (similar > 0.8) {
          fs.unlinkSync(fix.from);
          console.log(`   🗑️  Deleted duplicate: ${fix.from}`);
          console.log(`      (kept: ${fix.to})\n`);
          this.deleted.push(fix.from);
        } else {
          console.log(`   ⚠️  Skipped ${fix.from} - content differs too much\n`);
        }
      }
    });
  }

  // Merge redirect pages (Brahma/Vishnu/Shiva in creatures → deities)
  mergeRedirects() {
    console.log('🔧 Merging redirect pages...\n');

    const redirects = [
      {
        redirect: 'mythos/hindu/creatures/brahma.html',
        target: 'mythos/hindu/deities/brahma.html',
        expectedTitle: 'Brahma'
      },
      {
        redirect: 'mythos/hindu/creatures/vishnu.html',
        target: 'mythos/hindu/deities/vishnu.html',
        expectedTitle: 'Vishnu'
      },
      {
        redirect: 'mythos/hindu/creatures/shiva.html',
        target: 'mythos/hindu/deities/shiva.html',
        expectedTitle: 'Shiva'
      }
    ];

    redirects.forEach(r => {
      if (fs.existsSync(r.redirect)) {
        const content = fs.readFileSync(r.redirect, 'utf8');

        // Check if it's a redirect page
        if (content.includes('Redirecting') || content.includes('redirect')) {
          fs.unlinkSync(r.redirect);
          console.log(`   🗑️  Deleted redirect: ${r.redirect}`);
          console.log(`      (points to: ${r.target})\n`);
          this.deleted.push(r.redirect);
        }
      }
    });
  }

  // Merge detailed/regular versions of same entity
  mergeDetailedVersions() {
    console.log('🔧 Merging detailed versions...\n');

    const merges = [
      {
        regular: 'mythos/buddhist/deities/avalokiteshvara.html',
        detailed: 'mythos/buddhist/deities/avalokiteshvara_detailed.html',
        keepDetailed: true
      },
      {
        regular: 'mythos/buddhist/deities/manjushri.html',
        detailed: 'mythos/buddhist/deities/manjushri_detailed.html',
        keepDetailed: true
      }
    ];

    merges.forEach(m => {
      if (fs.existsSync(m.regular) && fs.existsSync(m.detailed)) {
        const regularContent = fs.readFileSync(m.regular, 'utf8');
        const detailedContent = fs.readFileSync(m.detailed, 'utf8');

        // Keep the detailed version, delete regular
        if (m.keepDetailed) {
          // Rename detailed to regular filename
          fs.unlinkSync(m.regular);
          fs.renameSync(m.detailed, m.regular);

          console.log(`   ✅ Merged: ${path.basename(m.detailed)}`);
          console.log(`      → ${path.basename(m.regular)}`);
          console.log(`      (kept detailed content)\n`);

          this.merged.push({
            from: m.detailed,
            to: m.regular,
            type: 'detailed_to_regular'
          });
        }
      }
    });
  }

  // Merge cross-mythology duplicates (Apollo, Gilgamesh, etc.)
  mergeCrossMythologyEntities() {
    console.log('🔧 Analyzing cross-mythology entities...\n');

    const crossMythology = [
      {
        entities: [
          'mythos/greek/deities/apollo.html',
          'mythos/roman/deities/apollo.html'
        ],
        note: 'Apollo appears in both Greek and Roman - this is intentional (same god)'
      },
      {
        entities: [
          'mythos/buddhist/deities/guanyin.html',
          'mythos/chinese/deities/guanyin.html'
        ],
        note: 'Guanyin in Buddhist and Chinese - intentional overlap'
      },
      {
        entities: [
          'mythos/babylonian/heroes/gilgamesh.html',
          'mythos/sumerian/heroes/gilgamesh.html'
        ],
        note: 'Gilgamesh in Babylonian and Sumerian - consider unified entity'
      }
    ];

    console.log('   ℹ️  Cross-mythology entities detected:');
    console.log('      These entities appear in multiple mythologies.');
    console.log('      Consider using unified entity system with mythology tags.\n');

    crossMythology.forEach(cm => {
      console.log(`   📋 ${cm.note}`);
      cm.entities.forEach(e => {
        if (fs.existsSync(e)) {
          console.log(`      - ${e}`);
        }
      });
      console.log('');
    });

    console.log('   💡 Recommendation: Add these to unified entity system\n');
  }

  // Content similarity (simple Jaccard similarity)
  contentSimilarity(content1, content2) {
    const clean1 = this.cleanContent(content1);
    const clean2 = this.cleanContent(content2);

    const words1 = new Set(clean1.split(/\s+/));
    const words2 = new Set(clean2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  cleanContent(content) {
    return content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .toLowerCase();
  }

  generateReport() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         DUPLICATE MERGE REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📊 Summary:`);
    console.log(`   Deleted: ${this.deleted.length}`);
    console.log(`   Merged: ${this.merged.length}`);
    console.log(`   Total actions: ${this.deleted.length + this.merged.length}\n`);

    if (this.deleted.length > 0) {
      console.log(`🗑️  Deleted Files:`);
      this.deleted.forEach(f => console.log(`   - ${f}`));
      console.log('');
    }

    if (this.merged.length > 0) {
      console.log(`🔀 Merged Files:`);
      this.merged.forEach(m => console.log(`   ${m.from} → ${m.to}`));
      console.log('');
    }

    console.log('✅ Duplicate merge complete!\n');
  }

  run() {
    console.log('🔀 Starting duplicate merge process...\n');

    this.fixObviousDuplicates();
    this.mergeRedirects();
    this.mergeDetailedVersions();
    this.mergeCrossMythologyEntities();

    this.generateReport();
  }
}

// Run merger
const merger = new DuplicateMerger();
merger.run();
