// Greek Mythology Section - Content Completeness Audit
// Checks for stub pages and missing content

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname);
const results = {
    totalFiles: 0,
    stubPages: [],
    shortPages: [],
    missingContent: [],
    wellDocumented: [],
    statistics: {}
};

// Minimum content thresholds
const MIN_CONTENT_LENGTH = 500; // characters of actual content
const STUB_INDICATORS = [
    'TODO',
    'Coming soon',
    'Under construction',
    'To be written',
    'Placeholder',
    '[Add content]',
    'More content coming'
];

// Get all HTML files recursively
function getHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html') && !file.endsWith('.bak')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Extract text content from HTML (strip tags)
function extractTextContent(html) {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&[a-z]+;/gi, ' ');

    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}

// Check content completeness
function checkContent(file) {
    const html = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(baseDir, file);
    const textContent = extractTextContent(html);
    const issues = [];

    // Check for stub indicators
    const hasStubIndicator = STUB_INDICATORS.some(indicator =>
        html.toLowerCase().includes(indicator.toLowerCase())
    );

    if (hasStubIndicator) {
        issues.push('Contains stub indicator (TODO, Coming soon, etc.)');
        results.stubPages.push({
            file: relativePath,
            contentLength: textContent.length
        });
    }

    // Check content length
    if (textContent.length < MIN_CONTENT_LENGTH) {
        issues.push(`Short content (${textContent.length} chars)`);
        results.shortPages.push({
            file: relativePath,
            contentLength: textContent.length
        });
    }

    // Check for essential sections in deity/hero/creature pages
    if (relativePath.includes('deities/') ||
        relativePath.includes('heroes/') ||
        relativePath.includes('creatures/')) {

        const hasDescription = html.match(/<p[^>]*>[\s\S]{100,}<\/p>/);
        const hasAttributes = html.toLowerCase().includes('attribute') ||
                             html.toLowerCase().includes('domain') ||
                             html.toLowerCase().includes('symbol');
        const hasMyths = html.toLowerCase().includes('myth') ||
                        html.toLowerCase().includes('story') ||
                        html.toLowerCase().includes('tale');

        if (!hasDescription) {
            issues.push('Missing substantial description paragraphs');
        }
        if (!hasAttributes && relativePath.includes('deities/')) {
            issues.push('Missing attributes/domains section');
        }
        if (!hasMyths && !relativePath.includes('index.html')) {
            issues.push('Missing associated myths/stories');
        }
    }

    // Track statistics
    const category = relativePath.split(path.sep)[0] || 'root';
    if (!results.statistics[category]) {
        results.statistics[category] = {
            count: 0,
            avgLength: 0,
            totalLength: 0
        };
    }
    results.statistics[category].count++;
    results.statistics[category].totalLength += textContent.length;

    // Classify page
    if (issues.length > 0) {
        results.missingContent.push({
            file: relativePath,
            issues: issues,
            contentLength: textContent.length
        });
    } else if (textContent.length >= MIN_CONTENT_LENGTH * 2) {
        results.wellDocumented.push({
            file: relativePath,
            contentLength: textContent.length
        });
    }
}

// Main audit function
function auditContent() {
    console.log('Starting Greek Mythology Content Audit...\n');

    const htmlFiles = getHtmlFiles(baseDir);
    results.totalFiles = htmlFiles.length;

    console.log(`Found ${htmlFiles.length} HTML files\n`);

    htmlFiles.forEach(file => {
        checkContent(file);
    });

    // Calculate averages
    Object.keys(results.statistics).forEach(category => {
        const stats = results.statistics[category];
        stats.avgLength = Math.round(stats.totalLength / stats.count);
    });

    // Print results
    console.log('='.repeat(80));
    console.log('CONTENT COMPLETENESS AUDIT RESULTS');
    console.log('='.repeat(80));
    console.log(`\nTotal HTML files scanned: ${results.totalFiles}`);
    console.log(`Well-documented pages: ${results.wellDocumented.length}`);
    console.log(`Pages with issues: ${results.missingContent.length}`);
    console.log(`\n📊 ISSUES BREAKDOWN:\n`);
    console.log(`Stub pages (with TODO/Coming soon): ${results.stubPages.length}`);
    console.log(`Short pages (<${MIN_CONTENT_LENGTH} chars): ${results.shortPages.length}`);

    console.log('\n' + '='.repeat(80));
    console.log('STATISTICS BY CATEGORY:');
    console.log('='.repeat(80));
    Object.keys(results.statistics).sort().forEach(category => {
        const stats = results.statistics[category];
        console.log(`\n📁 ${category}`);
        console.log(`   Files: ${stats.count}`);
        console.log(`   Avg content length: ${stats.avgLength} chars`);
    });

    if (results.missingContent.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('PAGES NEEDING CONTENT EXPANSION:');
        console.log('='.repeat(80));

        // Sort by content length (shortest first)
        results.missingContent.sort((a, b) => a.contentLength - b.contentLength);

        results.missingContent.forEach(item => {
            console.log(`\n📄 ${item.file} (${item.contentLength} chars)`);
            item.issues.forEach(issue => {
                console.log(`   ❌ ${issue}`);
            });
        });
    }

    // Save detailed report
    const reportPath = path.join(baseDir, 'audit-report-content.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n\nDetailed report saved to: ${reportPath}`);
}

// Run the audit
auditContent();