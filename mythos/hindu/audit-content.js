/**
 * Hindu Mythology - Content Completeness Audit
 * Checks for stub pages, missing content, and completeness
 */

const fs = require('fs');
const path = require('path');

const findings = {
    total: 0,
    complete: [],
    stubs: [],
    redirects: [],
    missing: {
        deities: [],
        avatars: [],
        concepts: []
    }
};

function getAllHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getAllHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function analyzeContent(filePath) {
    findings.total++;
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);

    // Check if redirect page
    if (content.includes('http-equiv="refresh"')) {
        findings.redirects.push({
            file: relativePath,
            type: 'redirect'
        });
        return;
    }

    // Check if stub/under development
    if (content.includes('Under Development') || content.includes('under development')) {
        findings.stubs.push({
            file: relativePath,
            type: 'stub',
            reason: 'Under Development banner'
        });
        return;
    }

    // Check content length (excluding HTML tags)
    const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').length;

    if (wordCount < 200) {
        findings.stubs.push({
            file: relativePath,
            type: 'minimal',
            wordCount,
            reason: `Only ${wordCount} words`
        });
        return;
    }

    // Has substantial content
    findings.complete.push({
        file: relativePath,
        wordCount
    });
}

function checkMissingDeities() {
    // Major deities that should have pages
    const majorDeities = [
        'vishnu', 'shiva', 'brahma', 'lakshmi', 'saraswati', 'parvati',
        'ganesha', 'hanuman', 'krishna', 'rama', 'durga', 'kali',
        'indra', 'agni', 'yama', 'surya', 'varuna'
    ];

    const deitiesDir = path.join(__dirname, 'deities');
    const existingFiles = fs.readdirSync(deitiesDir).filter(f => f.endsWith('.html'));

    majorDeities.forEach(deity => {
        if (!existingFiles.includes(`${deity}.html`)) {
            findings.missing.deities.push(deity);
        }
    });
}

function auditContent() {
    console.log('📋 HINDU MYTHOLOGY - CONTENT COMPLETENESS AUDIT\n');
    console.log('=' .repeat(60));

    const hinduDir = path.resolve(__dirname);
    const htmlFiles = getAllHtmlFiles(hinduDir);

    console.log(`\n📄 Analyzing ${htmlFiles.length} HTML files\n`);

    htmlFiles.forEach(file => analyzeContent(file));
    checkMissingDeities();

    console.log('\n' + '='.repeat(60));
    console.log('📊 CONTENT ANALYSIS\n');
    console.log(`Total Files: ${findings.total}`);
    console.log(`Complete Pages: ${findings.complete.length}`);
    console.log(`Stub/Minimal Pages: ${findings.stubs.length}`);
    console.log(`Redirect Pages: ${findings.redirects.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPLETE PAGES:\n');
    findings.complete.slice(0, 10).forEach(item => {
        console.log(`   ${item.file} (${item.wordCount} words)`);
    });
    if (findings.complete.length > 10) {
        console.log(`   ... and ${findings.complete.length - 10} more`);
    }

    if (findings.stubs.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('⚠️  STUB/MINIMAL PAGES:\n');
        findings.stubs.forEach(item => {
            console.log(`   ${item.file}`);
            console.log(`      Type: ${item.type} - ${item.reason}`);
        });
    }

    if (findings.redirects.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('🔀 REDIRECT PAGES:\n');
        findings.redirects.forEach(item => {
            console.log(`   ${item.file}`);
        });
    }

    if (findings.missing.deities.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ MISSING MAJOR DEITY PAGES:\n');
        findings.missing.deities.forEach(deity => {
            console.log(`   ${deity}.html`);
        });
    }

    // Calculate completion percentage
    const completionRate = ((findings.complete.length / (findings.total - findings.redirects.length)) * 100).toFixed(1);
    console.log('\n' + '='.repeat(60));
    console.log(`📈 COMPLETION RATE: ${completionRate}%`);
    console.log('=' .repeat(60));

    const reportPath = path.join(__dirname, 'audit-report-content.json');
    fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2));
    console.log(`\n💾 Report saved to: ${path.relative(process.cwd(), reportPath)}`);
}

auditContent();
