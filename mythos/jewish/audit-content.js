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

function checkContent(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];

    // Remove HTML tags and whitespace for word count
    const textContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .trim();

    const wordCount = textContent.split(/\s+/).length;

    // Check for minimal content
    if (wordCount < 100) {
        issues.push(`Very minimal content (${wordCount} words)`);
    } else if (wordCount < 300) {
        issues.push(`Light content (${wordCount} words)`);
    }

    // Check for placeholder text
    const placeholders = [
        'Lorem ipsum',
        'Coming soon',
        'TODO',
        'Under construction',
        '[Content here]',
        'placeholder'
    ];

    for (const placeholder of placeholders) {
        if (content.toLowerCase().includes(placeholder.toLowerCase())) {
            issues.push(`Contains placeholder: "${placeholder}"`);
        }
    }

    // Check for Metaphysica links
    const hasMetaphysicaLink = content.includes('principia-metaphysica') ||
                               content.includes('metaphysica.html');
    if (!hasMetaphysicaLink) {
        issues.push('No Metaphysica cross-reference found');
    }

    // Check for breadcrumb navigation
    if (!content.includes('breadcrumb') && !content.includes('nav-path')) {
        issues.push('Missing breadcrumb navigation');
    }

    return { issues, wordCount };
}

console.log('=== CONTENT AUDIT ===\n');

const files = getAllHtmlFiles(jewishDir);
let totalIssues = 0;
let filesWithIssues = 0;

const contentStats = {
    minimalContent: [],
    lightContent: [],
    placeholders: [],
    noMetaphysica: [],
    noBreadcrumbs: []
};

files.forEach(file => {
    const { issues, wordCount } = checkContent(file);
    if (issues.length > 0) {
        filesWithIssues++;
        const relativePath = path.relative(baseDir, file);
        console.log(`\n${relativePath}:`);
        issues.forEach(issue => {
            console.log(`  - ${issue}`);
            totalIssues++;

            if (issue.includes('Very minimal content')) {
                contentStats.minimalContent.push(relativePath);
            } else if (issue.includes('Light content')) {
                contentStats.lightContent.push(relativePath);
            } else if (issue.includes('placeholder')) {
                contentStats.placeholders.push(relativePath);
            } else if (issue.includes('No Metaphysica')) {
                contentStats.noMetaphysica.push(relativePath);
            } else if (issue.includes('breadcrumb')) {
                contentStats.noBreadcrumbs.push(relativePath);
            }
        });
    }
});

console.log(`\n\n=== SUMMARY ===`);
console.log(`Total files checked: ${files.length}`);
console.log(`Files with content issues: ${filesWithIssues}`);
console.log(`Total issues: ${totalIssues}`);

console.log(`\n=== ISSUE BREAKDOWN ===`);
console.log(`Very minimal content (< 100 words): ${contentStats.minimalContent.length} files`);
console.log(`Light content (< 300 words): ${contentStats.lightContent.length} files`);
console.log(`Contains placeholders: ${contentStats.placeholders.length} files`);
console.log(`No Metaphysica links: ${contentStats.noMetaphysica.length} files`);
console.log(`Missing breadcrumbs: ${contentStats.noBreadcrumbs.length} files`);
