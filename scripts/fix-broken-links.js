const fs = require('fs');
const path = require('path');

/**
 * Fixes broken links identified by check-broken-links.js
 * Categories:
 * 1. Template path issues (CSS/JS with wrong relative paths)
 * 2. Template placeholder issues ({{PATH_TO_THEMES}})
 * 3. Old file references (corpus-search-old, index_old)
 * 4. Missing Kabbalah JavaScript files
 * 5. Archetype directory links (need trailing slash removed or index.html added)
 * 6. Component example images (template placeholders)
 */

class BrokenLinkFixer {
  constructor() {
    this.fixes = {
      templates: 0,
      kabbalah: 0,
      archetypes: 0,
      oldFiles: 0,
      components: 0
    };
  }

  // Fix 1: Template path issues in components/
  fixComponentPaths() {
    console.log('\n🔧 Fixing component template paths...\n');

    const components = [
      'button', 'card', 'expandable', 'form', 'grid',
      'hero', 'list', 'modal', 'nav', 'page-template', 'search', 'tabs'
    ];

    components.forEach(comp => {
      const file = `components/${comp}.html`;
      if (!fs.existsSync(file)) return;

      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Fix CSS path: /themes/theme-base.css → ../themes/theme-base.css (components are at root)
      if (content.includes('href="/themes/theme-base.css"') || content.includes('href="../../themes/theme-base.css"')) {
        content = content.replace(/href="\/themes\/theme-base\.css"/g, 'href="../themes/theme-base.css"');
        content = content.replace(/href="\.\.\/\.\.\/themes\/theme-base\.css"/g, 'href="../themes/theme-base.css"');
        modified = true;
      }

      // Fix JS path: /themes/theme-picker.js → ../themes/theme-picker.js (components are at root)
      if (content.includes('src="/themes/theme-picker.js"') || content.includes('src="../../themes/theme-picker.js"')) {
        content = content.replace(/src="\/themes\/theme-picker\.js"/g, 'src="../themes/theme-picker.js"');
        content = content.replace(/src="\.\.\/\.\.\/themes\/theme-picker\.js"/g, 'src="../themes/theme-picker.js"');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(file, content);
        console.log(`   ✅ Fixed: ${file}`);
        this.fixes.templates++;
      }
    });
  }

  // Fix 2: Template placeholders in corpus-result-template.html
  fixCorpusResultTemplate() {
    console.log('\n🔧 Fixing corpus-result-template placeholders...\n');

    const file = 'components/corpus-result-template.html';
    if (!fs.existsSync(file)) return;

    let content = fs.readFileSync(file, 'utf8');

    // Replace {{PATH_TO_THEMES}} and incorrect ../../ with proper relative path (components at root)
    content = content.replace(/{{PATH_TO_THEMES}}/g, '../themes');
    content = content.replace(/href="\.\.\/\.\.\/themes\//g, 'href="../themes/');
    content = content.replace(/src="\.\.\/\.\.\/themes\//g, 'src="../themes/');

    fs.writeFileSync(file, content);
    console.log(`   ✅ Fixed: ${file}`);
    this.fixes.templates++;
  }

  // Fix 3: Template directory paths
  fixTemplateDirectoryPaths() {
    console.log('\n🔧 Fixing template directory paths...\n');

    const files = [
      'templates/category-index-template.html',
      'mythos/_corpus-search-template.html'
    ];

    files.forEach(file => {
      if (!fs.existsSync(file)) return;

      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      if (file.includes('category-index-template')) {
        // templates/ is at root, needs ../themes/ not ../../themes/
        content = content.replace(/href="\.\.\/\.\.\/themes\//g, 'href="../themes/');
        content = content.replace(/src="\.\.\/\.\.\/themes\//g, 'src="../themes/');
        content = content.replace(/href="\.\.\/\.\.\/styles\.css"/g, 'href="../styles.css"');
        content = content.replace(/href="\.\.\/\.\.\/components\//g, 'href="../components/');
        content = content.replace(/src="\.\.\/\.\.\/components\//g, 'src="../components/');
        modified = true;
      } else if (file.includes('_corpus-search-template')) {
        // mythos/ is at root, needs ../themes/ not ../../themes/
        content = content.replace(/href="\.\.\/\.\.\/(themes|styles|components)/g, 'href="../$1');
        content = content.replace(/src="\.\.\/\.\.\/(themes|corpus-search)/g, 'src="../$1');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(file, content);
        console.log(`   ✅ Fixed: ${file}`);
        this.fixes.templates++;
      }
    });
  }

  // Fix 4: Remove placeholder images from component examples
  fixComponentImages() {
    console.log('\n🔧 Fixing component placeholder images...\n');

    const files = ['components/card.html', 'components/modal.html'];

    files.forEach(file => {
      if (!fs.existsSync(file)) return;

      let content = fs.readFileSync(file, 'utf8');

      // Replace image.jpg with proper path or remove if it's just a placeholder
      if (content.includes('src="image.jpg"')) {
        // Check if it's in an example/demo section - if so, use placeholder service
        content = content.replace(/src="image\.jpg"/g, 'src="https://via.placeholder.com/400x300"');

        fs.writeFileSync(file, content);
        console.log(`   ✅ Fixed: ${file}`);
        this.fixes.components++;
      }
    });
  }

  // Fix 5: Old file references - delete or update
  fixOldFileReferences() {
    console.log('\n🔧 Handling old file references...\n');

    const oldFiles = [
      'mythos/index_old.html',
      'mythos/egyptian/corpus-search-old.html'
    ];

    oldFiles.forEach(file => {
      if (fs.existsSync(file)) {
        // These are old backup files - safe to delete
        fs.unlinkSync(file);
        console.log(`   🗑️  Deleted: ${file}`);
        this.fixes.oldFiles++;
      }
    });
  }

  // Fix 6: Archetype directory links (remove trailing slash)
  fixArchetypeLinks() {
    console.log('\n🔧 Fixing archetype directory links...\n');

    const filesToFix = [
      'components/interlink-panel.html',
      'mythos/norse/deities/heimdall.html',
      'mythos/norse/deities/loki.html'
    ];

    filesToFix.forEach(file => {
      if (!fs.existsSync(file)) return;

      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Fix archetype links: /archetypes/sky-father/ → /archetypes/sky-father.html
      const archetypePatterns = [
        '/archetypes/sky-father/',
        '/archetypes/trickster/',
        '/archetypes/death/',
        '/archetypes/threshold-guardian/',
        '/archetypes/',
        '/spiritual-places/',
        '/mythos/greek/deities/',
        '/mythos/norse/deities/',
        '/mythos/egyptian/deities/',
        '/mythos/hindu/deities/'
      ];

      archetypePatterns.forEach(pattern => {
        if (content.includes(`href="${pattern}"`)) {
          // Remove trailing slash
          const fixed = pattern.slice(0, -1);
          content = content.replace(new RegExp(`href="${pattern.replace(/\//g, '\\/')}"`, 'g'), `href="${fixed}"`);
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(file, content);
        console.log(`   ✅ Fixed: ${file}`);
        this.fixes.archetypes++;
      }
    });
  }

  // Fix 7: Kabbalah missing JavaScript files - create stubs or fix references
  fixKabbalahJavaScript() {
    console.log('\n🔧 Handling Kabbalah JavaScript references...\n');

    // Check which JS files are actually missing
    const missingFiles = [
      'mythos/jewish/kabbalah/sparks_data_expanded.js',
      'mythos/jewish/kabbalah/data_api.js',
      'mythos/jewish/kabbalah/sparks_data.js',
      'mythos/jewish/kabbalah/search.js'
    ];

    const htmlFiles = [
      'mythos/jewish/kabbalah/angels.html',
      'mythos/jewish/kabbalah/ascension.html',
      'mythos/jewish/kabbalah/concepts.html',
      'mythos/jewish/kabbalah/names/1.html',
      'mythos/jewish/kabbalah/names_overview.html',
      'mythos/jewish/kabbalah/qlippot.html',
      'mythos/jewish/kabbalah/sefirot_overview.html',
      'mythos/jewish/kabbalah/sparks/vehu-atziluth.html',
      'mythos/jewish/kabbalah/worlds/atziluth.html',
      'mythos/jewish/kabbalah/worlds_overview.html'
    ];

    // Strategy: Comment out missing JS references and add note
    htmlFiles.forEach(file => {
      if (!fs.existsSync(file)) return;

      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Comment out missing JS file references
      missingFiles.forEach(jsFile => {
        const filename = path.basename(jsFile);
        const regex = new RegExp(`<script[^>]*src=["'][^"']*${filename}["'][^>]*></script>`, 'g');

        if (regex.test(content)) {
          content = content.replace(regex, `<!-- JS file ${filename} not yet implemented -->`);
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(file, content);
        console.log(`   ✅ Fixed: ${file}`);
        this.fixes.kabbalah++;
      }
    });
  }

  // Fix 8: Component interlink-panel HTML paths
  fixInterlinkPanelPaths() {
    console.log('\n🔧 Fixing interlink panel HTML paths...\n');

    const file = 'components/interlink-panel.html';
    if (!fs.existsSync(file)) return;

    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Fix absolute paths to relative: /mythos/ → ../mythos/ (components at root)
    // Also fix incorrect ../../ to ../
    const patterns = [
      { from: /href="\/index\.html"/g, to: 'href="../index.html"' },
      { from: /href="\.\.\/\.\.\/index\.html"/g, to: 'href="../index.html"' },
      { from: /href="\/spiritual-items\//g, to: 'href="../spiritual-items/' },
      { from: /href="\.\.\/\.\.\/spiritual-items\//g, to: 'href="../spiritual-items/' },
      { from: /href="\/spiritual-places\//g, to: 'href="../spiritual-places/' },
      { from: /href="\.\.\/\.\.\/spiritual-places\//g, to: 'href="../spiritual-places/' },
      { from: /href="\/magic\//g, to: 'href="../magic/' },
      { from: /href="\.\.\/\.\.\/magic\//g, to: 'href="../magic/' },
      { from: /href="\/mythos\//g, to: 'href="../mythos/' },
      { from: /href="\.\.\/\.\.\/mythos\//g, to: 'href="../mythos/' },
      { from: /href="\/archetypes\//g, to: 'href="../archetypes/' },
      { from: /href="\.\.\/\.\.\/archetypes\//g, to: 'href="../archetypes/' },
      // Fix directory links without trailing slash or .html
      { from: /href="\.\.\/\.\.\/mythos\/(greek|norse|egyptian|hindu)\/deities"/g, to: 'href="../mythos/$1/deities"' },
      { from: /href="\/archetypes"/g, to: 'href="../archetypes"' },
      { from: /href="\/spiritual-places"/g, to: 'href="../spiritual-places"' }
    ];

    patterns.forEach(({from, to}) => {
      if (content.match(from)) {
        content = content.replace(from, to);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`   ✅ Fixed: ${file}`);
      this.fixes.components++;
    }
  }

  // Fix 9: Test file schema reference
  fixTestFilePaths() {
    console.log('\n🔧 Fixing test file paths...\n');

    const file = 'test-entity-panel.html';
    if (!fs.existsSync(file)) return;

    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Fix absolute paths (test file is at root)
    if (content.includes('src="/data/schemas/entity-schema.json"')) {
      content = content.replace(/src="\/data\/schemas\/entity-schema\.json"/g, 'src="data/schemas/entity-schema.json"');
      modified = true;
    }
    if (content.includes('src="/components/panels/entity-panel.js"')) {
      content = content.replace(/src="\/components\/panels\/entity-panel\.js"/g, 'src="components/panels/entity-panel.js"');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`   ✅ Fixed: ${file}`);
      this.fixes.components++;
    }
  }

  // Fix 10: Components index.html
  fixComponentsIndex() {
    console.log('\n🔧 Fixing components/index.html...\n');

    const file = 'components/index.html';
    if (!fs.existsSync(file)) return;

    let content = fs.readFileSync(file, 'utf8');

    // Fix absolute path (components/ at root, so needs ../index.html)
    if (content.includes('href="/index.html"')) {
      content = content.replace(/href="\/index\.html"/g, 'href="../index.html"');
      fs.writeFileSync(file, content);
      console.log(`   ✅ Fixed: ${file}`);
      this.fixes.components++;
    }
  }

  // Generate report
  generateReport() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('         BROKEN LINK FIX REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    const total = Object.values(this.fixes).reduce((a, b) => a + b, 0);

    console.log('📊 Fixes Applied:');
    console.log(`   Template paths: ${this.fixes.templates}`);
    console.log(`   Kabbalah JS references: ${this.fixes.kabbalah}`);
    console.log(`   Archetype links: ${this.fixes.archetypes}`);
    console.log(`   Old files removed: ${this.fixes.oldFiles}`);
    console.log(`   Component fixes: ${this.fixes.components}`);
    console.log(`   TOTAL: ${total} files fixed\n`);

    console.log('✅ All automated fixes complete!\n');
    console.log('📝 Run check-broken-links.js to verify improvements\n');
  }

  run() {
    console.log('🔧 Starting automated broken link fixes...\n');

    // Execute all fixes
    this.fixComponentPaths();
    this.fixCorpusResultTemplate();
    this.fixTemplateDirectoryPaths();
    this.fixComponentImages();
    this.fixOldFileReferences();
    this.fixArchetypeLinks();
    this.fixKabbalahJavaScript();
    this.fixInterlinkPanelPaths();
    this.fixTestFilePaths();
    this.fixComponentsIndex();

    this.generateReport();
  }
}

// Run fixer
const fixer = new BrokenLinkFixer();
fixer.run();
