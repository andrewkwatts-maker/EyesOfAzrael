const fs = require('fs');
const path = require('path');

const baseDir = 'H:/Github/EyesOfAzrael';
const jewishDir = path.join(baseDir, 'mythos/jewish');

function getAllHtmlFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files = files.concat(getAllHtmlFiles(fullPath));
        } else if (item.endsWith('.html')) {
            files.push(fullPath);
        }
    }

    return files;
}

function checkStyles(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];

    // Check for styles.css import
    if (!content.includes('styles.css')) {
        issues.push('Missing styles.css import');
    }

    // Check for theme picker integration
    if (!content.includes('theme-picker.js') && !content.includes('updateTheme')) {
        issues.push('Missing theme picker integration');
    }

    // Check for glass morphism classes
    const hasGlassMorphism = content.includes('glass-morphism') ||
                            content.includes('glassmorphism') ||
                            content.includes('glass-card');
    if (!hasGlassMorphism) {
        issues.push('No glass morphism styling detected');
    }

    // Check for hero section
    const hasHeroSection = content.includes('hero-section') ||
                          content.includes('hero-banner') ||
                          content.includes('class="hero');
    if (!hasHeroSection) {
        issues.push('No hero section detected');
    }

    // Check for ASCII art (common patterns)
    const asciiPatterns = [
        /\+---+\+/,  // Box drawing
        /\|[^\|]*\|[^\|]*\|/,  // Pipe tables
        /<pre>[^<]*[\+\|\-]{5,}[^<]*<\/pre>/s  // ASCII diagrams in pre tags
    ];

    for (const pattern of asciiPatterns) {
        if (pattern.test(content)) {
            issues.push('Contains ASCII art (should use SVG)');
            break;
        }
    }

    // Check for old-style inline CSS
    const hasInlineStyles = /<style>[^<]*(?:body|\.content|\.card)[^<]*<\/style>/s.test(content);
    if (hasInlineStyles) {
        issues.push('Contains old inline styles (should use styles.css)');
    }

    return issues;
}

console.log('=== STYLE AUDIT ===\n');

const files = getAllHtmlFiles(jewishDir);
let totalIssues = 0;
let filesWithIssues = 0;

const issueStats = {
    'Missing styles.css import': 0,
    'Missing theme picker integration': 0,
    'No glass morphism styling detected': 0,
    'No hero section detected': 0,
    'Contains ASCII art (should use SVG)': 0,
    'Contains old inline styles (should use styles.css)': 0
};

files.forEach(file => {
    const issues = checkStyles(file);
    if (issues.length > 0) {
        filesWithIssues++;
        const relativePath = path.relative(baseDir, file);
        console.log(`\n${relativePath}:`);
        issues.forEach(issue => {
            console.log(`  - ${issue}`);
            issueStats[issue]++;
            totalIssues++;
        });
    }
});

console.log(`\n\n=== SUMMARY ===`);
console.log(`Total files checked: ${files.length}`);
console.log(`Files with style issues: ${filesWithIssues}`);
console.log(`Total issues: ${totalIssues}`);

console.log(`\n=== ISSUE BREAKDOWN ===`);
Object.entries(issueStats).forEach(([issue, count]) => {
    if (count > 0) {
        console.log(`${issue}: ${count} files`);
    }
});
