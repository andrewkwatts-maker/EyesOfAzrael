/**
 * Gemini Project Needs Analysis
 * Asks Gemini to analyze the project and recommend next steps
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const https = require('https');

// Load .env
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
    } catch (error) {}
}

loadEnv();

async function askGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found');
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
                    resolve(response.candidates?.[0]?.content?.parts?.[0]?.text);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(120000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.write(data);
        req.end();
    });
}

async function getProjectStats() {
    const stats = {
        jsFiles: 0,
        cssFiles: 0,
        testFiles: 0,
        assetFiles: 0,
        totalLines: 0
    };

    // Count JS files
    try {
        const jsDir = path.join(__dirname, '..', 'js');
        const countFiles = async (dir, ext) => {
            let count = 0;
            const files = await fs.readdir(dir, { withFileTypes: true });
            for (const file of files) {
                if (file.isDirectory()) {
                    count += await countFiles(path.join(dir, file.name), ext);
                } else if (file.name.endsWith(ext)) {
                    count++;
                }
            }
            return count;
        };
        stats.jsFiles = await countFiles(jsDir, '.js');
    } catch (e) {}

    // Count CSS files
    try {
        const cssDir = path.join(__dirname, '..', 'css');
        const files = await fs.readdir(cssDir);
        stats.cssFiles = files.filter(f => f.endsWith('.css')).length;
    } catch (e) {}

    // Count test files
    try {
        const testDir = path.join(__dirname, '..', '__tests__');
        const countTests = async (dir) => {
            let count = 0;
            const files = await fs.readdir(dir, { withFileTypes: true });
            for (const file of files) {
                if (file.isDirectory()) {
                    count += await countTests(path.join(dir, file.name));
                } else if (file.name.endsWith('.test.js')) {
                    count++;
                }
            }
            return count;
        };
        stats.testFiles = await countTests(testDir);
    } catch (e) {}

    // Count asset files
    try {
        const assetDir = path.join(__dirname, '..', 'firebase-assets-downloaded');
        const countAssets = async (dir) => {
            let count = 0;
            const files = await fs.readdir(dir, { withFileTypes: true });
            for (const file of files) {
                if (file.isDirectory()) {
                    count += await countAssets(path.join(dir, file.name));
                } else if (file.name.endsWith('.json')) {
                    count++;
                }
            }
            return count;
        };
        stats.assetFiles = await countAssets(assetDir);
    } catch (e) {}

    return stats;
}

async function getRecentChanges() {
    const { execSync } = require('child_process');
    try {
        return execSync('git log --oneline -10', {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf8'
        });
    } catch (e) {
        return 'Could not get git log';
    }
}

async function getRoutes() {
    try {
        const spaNav = await fs.readFile(
            path.join(__dirname, '..', 'js', 'spa-navigation.js'),
            'utf8'
        );
        // Extract route patterns
        const routeMatches = spaNav.match(/registerRoute\(['"]([^'"]+)['"]/g) || [];
        return routeMatches.map(r => r.match(/['"]([^'"]+)['"]/)[1]).slice(0, 20);
    } catch (e) {
        return [];
    }
}

async function getViewClasses() {
    try {
        const viewDir = path.join(__dirname, '..', 'js', 'views');
        const files = await fs.readdir(viewDir);
        return files.filter(f => f.endsWith('.js')).map(f => f.replace('.js', ''));
    } catch (e) {
        return [];
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('GEMINI PROJECT NEEDS ANALYSIS');
    console.log('='.repeat(60));
    console.log();

    const stats = await getProjectStats();
    const recentChanges = await getRecentChanges();
    const routes = await getRoutes();
    const views = await getViewClasses();

    console.log('Project Statistics:');
    console.log(`  - JS Files: ${stats.jsFiles}`);
    console.log(`  - CSS Files: ${stats.cssFiles}`);
    console.log(`  - Test Files: ${stats.testFiles}`);
    console.log(`  - Asset Files: ${stats.assetFiles}`);
    console.log();

    const prompt = `You are analyzing the "Eyes of Azrael" mythology encyclopedia web application.

## Project Statistics
- JavaScript files: ${stats.jsFiles}
- CSS files: ${stats.cssFiles}
- Test files: ${stats.testFiles}
- Asset JSON files: ${stats.assetFiles}

## Recent Git Commits
${recentChanges}

## Registered Routes
${routes.join(', ')}

## View Classes
${views.join(', ')}

## Recent Improvements Made
1. Router modularization - Extracted 8 modules from spa-navigation.js
2. CSS architecture documentation with BEM conventions
3. 138 unit tests covering router modules and rendering logic
4. Admin-only categories (concepts, conspiracies) for the landing page
5. PDF download feature for entity pages
6. HTML entity encoding fixes in asset data

## Your Task
As a senior web developer, analyze this project and provide:

1. **Critical Issues** - What bugs or problems likely exist based on the architecture?

2. **Navigation UX** - What issues might users encounter when navigating?
   - Consider: route handling, loading states, error recovery, back button behavior

3. **Data Display** - What rendering issues might occur?
   - Consider: missing fields, HTML entities, truncation, responsive design

4. **Performance** - What bottlenecks likely exist?
   - Consider: 111 CSS files, large asset count, no bundling

5. **Missing Features** - What would improve the user experience?
   - Consider: search, filtering, bookmarks, sharing, offline support

6. **Security** - What vulnerabilities should be checked?

7. **Top 5 Priority Actions** - Rank the most important things to fix/add

Be specific and actionable. Focus on likely real issues, not hypothetical concerns.`;

    console.log('Consulting Gemini...\n');

    try {
        const response = await askGemini(prompt);
        console.log('GEMINI RESPONSE:');
        console.log('='.repeat(60));
        console.log(response);
        console.log('='.repeat(60));

        // Save response
        const reportPath = path.join(__dirname, '..', 'reports', `gemini-needs-${Date.now()}.md`);
        await fs.writeFile(reportPath, `# Gemini Project Needs Analysis\n\nDate: ${new Date().toISOString()}\n\n${response}`);
        console.log(`\nReport saved to: ${reportPath}`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main().catch(console.error);
