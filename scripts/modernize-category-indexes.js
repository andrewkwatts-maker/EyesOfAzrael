/**
 * Modernize Category Index Pages
 * Systematically updates all category index pages across mythologies
 * to use modern Firebase panel card system
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Category configurations
const CATEGORIES = {
    creatures: { emoji: '🐉', title: 'Mythical Creatures & Beings', desc: 'Encounter the legendary creatures, monsters, and divine beasts.', category: 'creature' },
    heroes: { emoji: '🦸', title: 'Heroes & Legendary Figures', desc: 'Discover the legendary heroes, warriors, and mortal champions.', category: 'hero' },
    texts: { emoji: '📜', title: 'Sacred Texts & Scriptures', desc: 'Explore the ancient texts, scriptures, and sacred writings.', category: 'text' },
    rituals: { emoji: '🕯️', title: 'Rituals & Practices', desc: 'Learn about the sacred rituals, ceremonies, and practices.', category: 'ritual' },
    magic: { emoji: '✨', title: 'Magical Practices & Systems', desc: 'Explore the magical traditions, spells, and mystical practices.', category: 'magic' },
    cosmology: { emoji: '🌌', title: 'Cosmology & Worldview', desc: 'Understand the structure of the universe and cosmic order.', category: 'cosmology' },
    herbs: { emoji: '🌿', title: 'Sacred Plants & Herbs', desc: 'Discover the sacred plants, herbs, and botanical wonders used in ancient practices.', category: 'herb' }
};

// Mythology color schemes
const MYTHOLOGY_COLORS = {
    norse: { primary: '#4682B4', secondary: '#B0C4DE' },
    greek: { primary: '#4169E1', secondary: '#FFD700' },
    roman: { primary: '#8B0000', secondary: '#FFD700' },
    egyptian: { primary: '#DAA520', secondary: '#4169E1' },
    celtic: { primary: '#228B22', secondary: '#90EE90' },
    norse: { primary: '#4682B4', secondary: '#B0C4DE' },
    hindu: { primary: '#FF6347', secondary: '#FFD700' },
    buddhist: { primary: '#FF8C00', secondary: '#FFD700' },
    chinese: { primary: '#DC143C', secondary: '#FFD700' },
    babylonian: { primary: '#8B4513', secondary: '#DAA520' },
    sumerian: { primary: '#8B4513', secondary: '#DAA520' },
    persian: { primary: '#9370DB', secondary: '#FFD700' },
    jewish: { primary: '#1E90FF', secondary: '#FFD700' },
    christian: { primary: '#8B0000', secondary: '#FFD700' },
    islamic: { primary: '#008080', secondary: '#FFD700' },
    apocryphal: { primary: '#8B008B', secondary: '#DDA0DD' },
    tarot: { primary: '#4B0082', secondary: '#9370DB' }
};

function generateModernHTML(mythology, categoryKey, config) {
    const colors = MYTHOLOGY_COLORS[mythology] || { primary: '#4169E1', secondary: '#FFD700' };
    const capitalizedMythology = mythology.charAt(0).toUpperCase() + mythology.slice(1);
    const capitalizedCategory = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${capitalizedCategory} - ${capitalizedMythology} Mythology</title>

    <!-- Base Styles -->
    <link rel="stylesheet" href="../../../themes/theme-base.css">
    <link rel="stylesheet" href="../../../styles.css">
    <link rel="stylesheet" href="../../../themes/corpus-links.css">
    <link rel="stylesheet" href="../../../themes/smart-links.css">

    <!-- Entity System -->
    <link rel="stylesheet" href="../../../components/panels/panels.css">
    <link rel="stylesheet" href="../../../components/panels/entity-panel-enhanced.css">
    <link rel="stylesheet" href="../../../components/auto-populate.css">

    <!-- Theme System -->
    <script defer src="../../../themes/theme-picker.js"></script>
    <script defer src="../../../themes/theme-animations.js"></script>
    <script defer src="../../../themes/smart-links.js"></script>

    <!-- Entity Panel Components -->
    <script src="../../../components/panels/entity-panel-enhanced.js"></script>
    <script src="../../../components/auto-populate.js"></script>

    <style>
        :root {
            --mythos-primary: ${colors.primary};
            --mythos-secondary: ${colors.secondary};
        }

        .hero-section {
            background: linear-gradient(135deg, var(--mythos-primary), var(--mythos-secondary));
            color: white;
            padding: 3rem 2rem;
            border-radius: var(--radius-2xl);
            margin-bottom: 2rem;
            text-align: center;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .hero-section h2 {
            margin: 0 0 1rem 0;
            font-size: 2.5rem;
        }

        .hero-section p {
            font-size: 1.2rem;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
        }

        .section-divider {
            margin: 4rem 0 2rem;
            text-align: center;
        }

        .section-title {
            display: inline-block;
            padding: 1rem 2rem;
            background: linear-gradient(135deg,
                rgba(var(--color-primary-rgb), 0.1),
                rgba(var(--color-secondary-rgb), 0.1));
            border-radius: var(--radius-xl);
            border: 2px solid rgba(var(--color-border-rgb), 0.3);
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-text-primary);
        }

        .entity-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 2rem;
            margin: 2rem 0;
        }

        .loading-state {
            text-align: center;
            padding: 3rem;
            color: var(--color-text-secondary);
        }

        .loading-spinner {
            width: 48px;
            height: 48px;
            margin: 0 auto 1rem;
            border: 4px solid rgba(var(--color-primary-rgb), 0.2);
            border-top-color: var(--color-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="theme-picker-container"></div>

    <header>
        <div class="header-content">
            <h1>${config.emoji} ${capitalizedCategory}</h1>
        </div>
    </header>

    <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="../../../mythos/index.html">Home</a> →
        <a href="../index.html">${capitalizedMythology}</a> →
        <span>${capitalizedCategory}</span>
    </nav>

    <main>
        <!-- Hero Section -->
        <section class="hero-section">
            <h2>${config.title}</h2>
            <p>${config.desc}</p>
        </section>

        <!-- Main Entity Grid (Auto-Populated) -->
        <div
            data-auto-populate
            data-mythology="${mythology}"
            data-category="${config.category}"
            data-display-mode="compact"
            data-show-corpus="true">
            <!-- Loading state -->
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading ${capitalizedCategory}...</p>
            </div>
        </div>

        <!-- Optional: Filtered Sections -->
        <!-- Uncomment and customize as needed -->
        <!--
        <div class="section-divider">
            <div class="section-title">Sacred ${capitalizedCategory}</div>
        </div>
        <div
            data-auto-populate
            data-mythology="${mythology}"
            data-category="${config.category}"
            data-subcategory="sacred"
            data-display-mode="compact"
            class="entity-grid">
        </div>

        <div class="section-divider">
            <div class="section-title">Ritual ${capitalizedCategory}</div>
        </div>
        <div
            data-auto-populate
            data-mythology="${mythology}"
            data-category="${config.category}"
            data-subcategory="ritual"
            data-display-mode="compact"
            class="entity-grid">
        </div>
        -->

        <!-- Cross-Cultural Parallels -->
        <section class="interlink-panel" style="margin-top: 4rem;">
            <h3 class="interlink-header">
                <span class="interlink-icon">🔗</span>
                ${capitalizedCategory} Across Mythologies
            </h3>

            <div class="parallel-traditions glass-card">
                <h4>🌍 Explore Other Traditions</h4>
                <div class="parallel-grid">
                    <!-- Add links to similar categories in other mythologies -->

                    <a href="../../greek/${categoryKey}/index.html" class="parallel-card">
                        <span class="tradition-flag">🏛️</span>
                        <span class="parallel-name">Greek ${capitalizedCategory}</span>
                        <span class="tradition-label">Greek</span>
                    </a>
                    <a href="../../norse/${categoryKey}/index.html" class="parallel-card">
                        <span class="tradition-flag">⚔️</span>
                        <span class="parallel-name">Norse ${capitalizedCategory}</span>
                        <span class="tradition-label">Norse</span>
                    </a>
                    <a href="../../egyptian/${categoryKey}/index.html" class="parallel-card">
                        <span class="tradition-flag">𓂀</span>
                        <span class="parallel-name">Egyptian ${capitalizedCategory}</span>
                        <span class="tradition-label">Egyptian</span>
                    </a>
                    <a href="../../hindu/${categoryKey}/index.html" class="parallel-card">
                        <span class="tradition-flag">🕉️</span>
                        <span class="parallel-name">Hindu ${capitalizedCategory}</span>
                        <span class="tradition-label">Hindu</span>
                    </a>
                </div>
            </div>
        </section>

        <!-- See Also Section -->
        <div class="see-also-section" style="margin-top: 3rem;">
            <h4>📚 See Also</h4>
            <div class="see-also-links">
                <a href="../deities/index.html" class="see-also-link">
                    <span>⚡</span> Deities
                </a>
                <a href="../heroes/index.html" class="see-also-link">
                    <span>🦸</span> Heroes
                </a>
                <a href="../places/index.html" class="see-also-link">
                    <span>📍</span> Places
                </a>
                <a href="../index.html" class="see-also-link">
                    <span>🏛️</span> ${capitalizedMythology} Home
                </a>
            </div>
        </div>
    </main>

    <footer>
        <p>
            <strong>${capitalizedCategory}</strong> - ${capitalizedMythology} Mythology<br>
            <a href="../../../mythos/index.html">World Mythos Home</a> |
            <a href="../index.html">${capitalizedMythology} Tradition</a>
        </p>
    </footer>

    <!-- Initialize Auto-Populate -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const populator = new EntityAutoPopulator();
            populator.populatePage();
        });
    </script>
</body>
</html>
`;
}

function needsUpdate(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if already modernized
    if (content.includes('data-auto-populate') &&
        content.includes('entity-panel-enhanced.css') &&
        content.includes('loading-spinner') &&
        content.includes('EntityAutoPopulator')) {
        return false;
    }

    return true;
}

function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    return {
        hasAutoPop: content.includes('data-auto-populate'),
        hasEntityPanel: content.includes('entity-panel-enhanced'),
        hasSpinner: content.includes('loading-spinner'),
        hasGlassMorph: content.includes('glass-card'),
        hasFirebaseInit: content.includes('EntityAutoPopulator')
    };
}

async function main() {
    console.log('🔍 Scanning category index files...\n');

    const patterns = [
        'mythos/*/creatures/index.html',
        'mythos/*/heroes/index.html',
        'mythos/*/texts/index.html',
        'mythos/*/rituals/index.html',
        'mythos/*/magic/index.html',
        'mythos/*/cosmology/index.html',
        'mythos/*/herbs/index.html'
    ];

    let allFiles = [];
    patterns.forEach(pattern => {
        const files = glob.sync(pattern, { cwd: path.join(__dirname, '..') });
        allFiles = allFiles.concat(files.map(f => path.join(__dirname, '..', f)));
    });

    console.log(`📊 Found ${allFiles.length} category index files\n`);

    // Analyze all files
    const analysis = {
        alreadyModern: [],
        needsUpdate: [],
        total: allFiles.length
    };

    allFiles.forEach(filePath => {
        const relative = path.relative(path.join(__dirname, '..'), filePath);
        const status = analyzeFile(filePath);

        if (status.hasAutoPop && status.hasEntityPanel && status.hasSpinner && status.hasFirebaseInit) {
            analysis.alreadyModern.push({ path: relative, status });
        } else {
            analysis.needsUpdate.push({ path: relative, status });
        }
    });

    console.log('📈 Analysis Results:');
    console.log(`   ✅ Already Modern: ${analysis.alreadyModern.length}`);
    console.log(`   🔧 Needs Update: ${analysis.needsUpdate.length}`);
    console.log(`   📊 Total: ${analysis.total}\n`);

    // Show files that need updates
    if (analysis.needsUpdate.length > 0) {
        console.log('🔧 Files that need updates:');
        analysis.needsUpdate.forEach(({ path, status }) => {
            console.log(`   - ${path}`);
            const missing = [];
            if (!status.hasAutoPop) missing.push('auto-populate');
            if (!status.hasEntityPanel) missing.push('entity-panel');
            if (!status.hasSpinner) missing.push('spinner');
            if (!status.hasFirebaseInit) missing.push('firebase-init');
            console.log(`     Missing: ${missing.join(', ')}`);
        });
        console.log('');
    }

    // Ask for confirmation before updating
    console.log('⚠️  DRY RUN - No files will be modified');
    console.log('   To apply updates, set UPDATE_FILES=true\n');

    if (process.env.UPDATE_FILES === 'true') {
        console.log('🚀 Applying updates...\n');

        let updated = 0;
        analysis.needsUpdate.forEach(({ path: relativePath }) => {
            const fullPath = path.join(__dirname, '..', relativePath);
            const parts = relativePath.split(path.sep);
            const mythology = parts[1]; // mythos/MYTHOLOGY/category/index.html
            const categoryKey = parts[2];

            if (CATEGORIES[categoryKey]) {
                const newContent = generateModernHTML(mythology, categoryKey, CATEGORIES[categoryKey]);
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`   ✅ Updated: ${relativePath}`);
                updated++;
            }
        });

        console.log(`\n✨ Complete! Updated ${updated} files.`);
    }

    // Generate summary report
    const report = {
        timestamp: new Date().toISOString(),
        totalFiles: analysis.total,
        alreadyModern: analysis.alreadyModern.length,
        needsUpdate: analysis.needsUpdate.length,
        filesNeedingUpdate: analysis.needsUpdate.map(f => f.path),
        filesAlreadyModern: analysis.alreadyModern.map(f => f.path)
    };

    fs.writeFileSync(
        path.join(__dirname, '..', 'CATEGORY_INDEX_MODERNIZATION_REPORT.json'),
        JSON.stringify(report, null, 2)
    );

    console.log('📄 Report saved to CATEGORY_INDEX_MODERNIZATION_REPORT.json');
}

main().catch(console.error);
