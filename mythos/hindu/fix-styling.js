/**
 * Hindu Mythology - Automated Styling Fixer
 * Updates pages to use modern CSS variables and glass morphism patterns
 */

const fs = require('fs');
const path = require('path');

const fixes = {
    applied: 0,
    files: []
};

// Files to update with inline style fixes
const filesToFix = [
    'beings/yamadutas.html',
    'cosmology/karma.html',
    'cosmology/kshira-sagara.html',
    'creatures/garuda.html',
    'creatures/makara.html',
    'creatures/nagas.html',
    'deities/dhanvantari.html',
    'deities/dyaus.html',
    'deities/kartikeya.html',
    'deities/prithvi.html',
    'deities/rati.html',
    'deities/vritra.html',
    'figures/chitragupta.html',
    'herbs/soma.html',
    'heroes/krishna.html',
    'heroes/rama.html',
    'rituals/diwali.html',
    'rituals/index.html'
];

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fix common old color patterns
    const colorReplacements = [
        // Old hardcoded colors to CSS variables
        { old: /color:\s*#FF6347/gi, new: 'color: var(--color-primary)' },
        { old: /color:\s*#FFD700/gi, new: 'color: var(--color-secondary)' },
        { old: /color:\s*#8B4513/gi, new: 'color: var(--color-primary)' },
        { old: /color:\s*#DAA520/gi, new: 'color: var(--color-secondary)' },
        { old: /color:\s*orange/gi, new: 'color: var(--color-primary)' },
        { old: /color:\s*coral/gi, new: 'color: var(--color-primary)' },

        // Old mythos-specific colors
        { old: /var\(--mythos-primary\)/g, new: 'var(--color-primary)' },
        { old: /var\(--mythos-secondary\)/g, new: 'var(--color-secondary)' }
    ];

    colorReplacements.forEach(({ old, new: newVal }) => {
        if (old.test(content)) {
            content = content.replace(old, newVal);
            modified = true;
        }
    });

    // Ensure interlink-panel uses glass-card if it doesn't have proper styling
    if (content.includes('class="interlink-panel"') && !content.includes('interlink-panel glass-card')) {
        // Don't add glass-card to interlink-panel, it has its own styling
    }

    // Add glass-card class to related-concepts if missing
    if (content.includes('class="related-concepts"') && content.includes('<div class="grid">')) {
        content = content.replace(/<div class="grid">/g, '<div class="grid glass-card">');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
        fixes.applied++;
        fixes.files.push(path.relative(process.cwd(), filePath));
        return true;
    }

    return false;
}

function main() {
    console.log('🎨 HINDU MYTHOLOGY - AUTOMATED STYLING FIXES\n');
    console.log('=' .repeat(60));

    const hinduDir = path.resolve(__dirname);

    console.log(`\nProcessing ${filesToFix.length} files...\n`);

    filesToFix.forEach(file => {
        const fullPath = path.join(hinduDir, file);
        const relativePath = path.relative(process.cwd(), fullPath);

        if (fixFile(fullPath)) {
            console.log(`✅ Fixed: ${relativePath}`);
        } else {
            console.log(`   Skipped: ${relativePath} (no changes needed)`);
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY\n');
    console.log(`Files Processed: ${filesToFix.length}`);
    console.log(`Files Modified: ${fixes.applied}`);

    if (fixes.applied > 0) {
        console.log('\n✅ Modified Files:');
        fixes.files.forEach(file => console.log(`   ${file}`));
    }

    console.log('\n' + '='.repeat(60));
}

main();
