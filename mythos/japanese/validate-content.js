const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = __dirname;
const RESULTS = {
    emptyPages: [],
    stubPages: [],
    missingDeities: [],
    missingMyths: [],
    totalPages: 0
};

// Expected deities based on index.html
const EXPECTED_DEITIES = [
    'amaterasu',
    'susanoo',
    'tsukuyomi',
    'izanagi',
    'izanami',
    'inari',
    'okuninushi',
    'hachiman',
    'raijin',
    'fujin'
];

// Expected myths
const EXPECTED_MYTHS = [
    'creation-of-japan',
    'izanagi-yomi',
    'amaterasu-cave',
    'susanoo-orochi'
];

// Helper: Find all HTML files recursively
function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Check if page is empty or stub
function checkPageContent(content, filePath) {
    const bodyContent = content.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    if (!bodyContent) {
        return { empty: true, stub: false, wordCount: 0 };
    }

    // Remove HTML tags and count words
    const textContent = bodyContent[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const wordCount = textContent.split(/\s+/).length;

    // Check for stub indicators
    const isStub = /coming soon|under construction|placeholder|TODO/i.test(content) ||
                   wordCount < 100;

    return {
        empty: wordCount < 10,
        stub: isStub,
        wordCount
    };
}

// Main validation function
function validateContent() {
    console.log('\n=== Japanese Mythology Content Validator ===\n');

    const htmlFiles = findHtmlFiles(BASE_DIR);
    RESULTS.totalPages = htmlFiles.length;

    console.log(`Found ${htmlFiles.length} HTML files to check\n`);

    // Check all pages for content
    htmlFiles.forEach(filePath => {
        const relativePath = path.relative(BASE_DIR, filePath);
        const content = fs.readFileSync(filePath, 'utf8');

        const contentCheck = checkPageContent(content, filePath);

        if (contentCheck.empty) {
            RESULTS.emptyPages.push({
                file: relativePath,
                wordCount: contentCheck.wordCount
            });
        } else if (contentCheck.stub) {
            RESULTS.stubPages.push({
                file: relativePath,
                wordCount: contentCheck.wordCount
            });
        }
    });

    // Check for expected deity pages
    const deitiesDir = path.join(BASE_DIR, 'deities');
    if (fs.existsSync(deitiesDir)) {
        EXPECTED_DEITIES.forEach(deity => {
            const deityPath = path.join(deitiesDir, `${deity}.html`);
            if (!fs.existsSync(deityPath)) {
                RESULTS.missingDeities.push(deity);
            }
        });
    }

    // Check for expected myth pages
    const mythsDir = path.join(BASE_DIR, 'myths');
    if (fs.existsSync(mythsDir)) {
        EXPECTED_MYTHS.forEach(myth => {
            const mythPath = path.join(mythsDir, `${myth}.html`);
            if (!fs.existsSync(mythPath)) {
                RESULTS.missingMyths.push(myth);
            }
        });
    }

    // Print results
    console.log('=== RESULTS ===\n');
    console.log(`Total pages scanned: ${RESULTS.totalPages}\n`);

    console.log(`Empty pages (< 10 words): ${RESULTS.emptyPages.length}`);
    if (RESULTS.emptyPages.length > 0) {
        RESULTS.emptyPages.forEach(page => {
            console.log(`  - ${page.file} (${page.wordCount} words)`);
        });
        console.log('');
    }

    console.log(`Stub/incomplete pages: ${RESULTS.stubPages.length}`);
    if (RESULTS.stubPages.length > 0) {
        RESULTS.stubPages.forEach(page => {
            console.log(`  - ${page.file} (${page.wordCount} words)`);
        });
        console.log('');
    }

    console.log(`Missing expected deity pages: ${RESULTS.missingDeities.length}`);
    if (RESULTS.missingDeities.length > 0) {
        RESULTS.missingDeities.forEach(deity => {
            console.log(`  - ${deity}.html`);
        });
        console.log('');
    }

    console.log(`Missing expected myth pages: ${RESULTS.missingMyths.length}`);
    if (RESULTS.missingMyths.length > 0) {
        RESULTS.missingMyths.forEach(myth => {
            console.log(`  - ${myth}.html`);
        });
        console.log('');
    }

    // Save results to JSON
    const reportPath = path.join(BASE_DIR, 'content-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(RESULTS, null, 2));
    console.log(`Full report saved to: ${reportPath}\n`);

    const hasIssues = RESULTS.emptyPages.length > 0 ||
                     RESULTS.missingDeities.length > 0 ||
                     RESULTS.missingMyths.length > 0;

    if (!hasIssues) {
        console.log('✓ All expected content is present!\n');
    }

    return !hasIssues;
}

// Run validation
const success = validateContent();
process.exit(success ? 0 : 1);
