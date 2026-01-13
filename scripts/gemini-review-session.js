/**
 * Gemini Review Session
 * Reviews recent changes and provides feedback
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Load .env file
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '..', '.env');
        const envContent = fsSync.readFileSync(envPath, 'utf8');
        for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                const value = valueParts.join('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            }
        }
    } catch (error) {
        console.error('Could not load .env file');
    }
}

loadEnv();

async function askGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found in environment');
        process.exit(1);
    }

    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                topP: 0.95
            }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.error) {
                        reject(new Error(response.error.message));
                        return;
                    }
                    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
                    resolve(text);
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(120000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(data);
        req.end();
    });
}

async function getGitDiff() {
    try {
        // Get diff of recent changes (staged and unstaged)
        const diff = execSync('git diff HEAD~5 --stat', {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 10
        });
        return diff.substring(0, 5000); // Limit size
    } catch (error) {
        return 'Could not get git diff';
    }
}

async function getRecentFiles() {
    const routerFiles = [
        'js/router/navigation-metrics.js',
        'js/router/scroll-manager.js',
        'js/router/route-matcher.js',
        'js/router/render-utilities.js',
        'js/router/route-preloader.js',
        'js/router/accessibility-manager.js',
        'js/router/history-manager.js',
        'js/router/index.js'
    ];

    const contents = [];
    for (const file of routerFiles) {
        try {
            const content = await fs.readFile(path.join(__dirname, '..', file), 'utf8');
            contents.push(`\n=== ${file} ===\n${content.substring(0, 1500)}...`);
        } catch (e) {
            // File not found
        }
    }
    return contents.join('\n');
}

async function main() {
    console.log('='.repeat(60));
    console.log('GEMINI CODE REVIEW SESSION');
    console.log('='.repeat(60));
    console.log();

    const diff = await getGitDiff();
    const routerCode = await getRecentFiles();

    // Read CSS architecture
    let cssArchitecture = '';
    try {
        cssArchitecture = await fs.readFile(
            path.join(__dirname, '..', 'css', 'CSS_ARCHITECTURE.md'),
            'utf8'
        );
    } catch (e) {}

    // Read test files
    let testCode = '';
    try {
        const testFiles = await fs.readdir(path.join(__dirname, '..', '__tests__', 'router'));
        for (const file of testFiles.slice(0, 2)) {
            const content = await fs.readFile(
                path.join(__dirname, '..', '__tests__', 'router', file),
                'utf8'
            );
            testCode += `\n=== ${file} ===\n${content.substring(0, 1000)}...\n`;
        }
    } catch (e) {}

    const prompt = `You are a senior software architect reviewing recent changes to the "Eyes of Azrael" mythology encyclopedia project.

## Recent Git Changes Summary
${diff}

## New Router Modules Created
${routerCode.substring(0, 4000)}

## CSS Architecture Document Created
${cssArchitecture.substring(0, 2000)}

## Test Files Created
${testCode}

## Review Request
Please analyze these changes and provide:

1. **Code Quality Assessment** (1-10 score with justification)
2. **Architecture Concerns** - Any issues with the modular router approach?
3. **Test Coverage Gaps** - What's missing from the test suite?
4. **CSS Architecture** - Is the BEM approach well-documented?
5. **Security Concerns** - Any XSS or injection risks?
6. **Performance Issues** - Any concerns with the implementations?
7. **Recommended Next Steps** - What should be done next?

Be specific and actionable in your feedback. Focus on real issues, not style preferences.`;

    console.log('Consulting Gemini...\n');

    try {
        const response = await askGemini(prompt);
        console.log('GEMINI REVIEW RESPONSE:');
        console.log('='.repeat(60));
        console.log(response);
        console.log('='.repeat(60));

        // Save response
        await fs.writeFile(
            path.join(__dirname, '..', 'reports', 'gemini-review-' + Date.now() + '.md'),
            `# Gemini Code Review\n\nDate: ${new Date().toISOString()}\n\n${response}`
        );
        console.log('\nReview saved to reports/gemini-review-*.md');

    } catch (error) {
        console.error('Gemini review failed:', error.message);
    }
}

main().catch(console.error);
