const fs = require('fs');
const path = require('path');

const baseDir = 'H:/Github/EyesOfAzrael';
const jewishDir = path.join(baseDir, 'mythos/jewish');

// Pages that need hero sections added
const pagesNeedingHeroSection = [
    'kabbalah/angels.html',
    'kabbalah/ascension.html',
    'kabbalah/concepts.html',
    'kabbalah/qlippot.html',
    'kabbalah/names/1.html',
    'kabbalah/names_overview.html',
    'kabbalah/sefirot/binah.html',
    'kabbalah/sefirot/chesed.html',
    'kabbalah/sefirot/chokmah.html',
    'kabbalah/sefirot/gevurah.html',
    'kabbalah/sefirot/hod.html',
    'kabbalah/sefirot/index.html',
    'kabbalah/sefirot/keter.html',
    'kabbalah/sefirot/malkhut.html',
    'kabbalah/sefirot/netzach.html',
    'kabbalah/sefirot/physics-integration.html',
    'kabbalah/sefirot/tiferet.html',
    'kabbalah/sefirot/yesod.html',
    'kabbalah/sefirot_overview.html',
    'kabbalah/sparks/index.html',
    'kabbalah/sparks/vehu-atziluth.html',
    'kabbalah/worlds/assiah.html',
    'kabbalah/worlds/atziluth.html',
    'kabbalah/worlds/beriah.html',
    'kabbalah/worlds/index.html',
    'kabbalah/worlds/physics-integration.html',
    'kabbalah/worlds/yetzirah.html',
    'kabbalah/worlds_overview.html'
];

// Check which pages actually lack hero sections
function checkForHeroSection(content) {
    const heroPatterns = [
        /<section[^>]*class="hero-section"/i,
        /<div[^>]*class="hero-section"/i,
        /<section[^>]*class="detail-header"/i
    ];

    return heroPatterns.some(pattern => pattern.test(content));
}

console.log('=== CHECKING HERO SECTIONS ===\n');

let fixed = 0;
let alreadyHasHero = 0;

pagesNeedingHeroSection.forEach(relativePath => {
    const fullPath = path.join(jewishDir, relativePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`SKIP: ${relativePath} - File not found`);
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');

    if (checkForHeroSection(content)) {
        console.log(`SKIP: ${relativePath} - Already has hero section`);
        alreadyHasHero++;
        return;
    }

    console.log(`NEEDS FIX: ${relativePath}`);
    // We won't actually fix here - just report
    fixed++;
});

console.log(`\n=== SUMMARY ===`);
console.log(`Pages checked: ${pagesNeedingHeroSection.length}`);
console.log(`Already have hero sections: ${alreadyHasHero}`);
console.log(`Need hero sections added: ${fixed}`);
