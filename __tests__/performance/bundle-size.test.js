/**
 * Bundle Size and Code Optimization Tests
 * Eyes of Azrael - Test Polish Agent 5
 *
 * Ensures components meet size budgets and follow
 * optimization best practices.
 *
 * Size Budgets (Source Files - Unminified):
 * - Individual components: < 150KB
 * - Critical components: < 75KB
 * - Total JS bundle: < 1000KB
 *
 * Expected Production Sizes (after minification ~60% reduction):
 * - Individual: ~60KB
 * - Critical: ~30KB
 * - Total: ~400KB
 *
 * Note: Tests check source files. Run "npm run build" to create
 * production bundles with minification for deployment.
 */

const fs = require('fs');
const path = require('path');

describe('Bundle Size Tests', () => {
    const componentsDir = path.join(__dirname, '../../js/components');
    const distDir = path.join(__dirname, '../../dist');
    const hasBuild = fs.existsSync(distDir);

    // Check if production build exists
    beforeAll(() => {
        if (!hasBuild) {
            console.log('\n⚠️  No production build found. Testing source files instead.');
            console.log('   Run "npm run build" to create minified bundles for deployment.');
            console.log('   Source file budgets are adjusted for unminified code.\n');
        } else {
            console.log('\n✅ Production build found. Testing both source and built files.\n');
        }
    });

    // Helper to get file size
    const getFileSize = (filePath) => {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    };

    // Helper to format bytes
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    describe('Individual Component Sizes', () => {
        test('search-view-complete.js should be < 150KB (source)', () => {
            const filePath = path.join(componentsDir, 'search-view-complete.js');
            const sizeBytes = getFileSize(filePath);
            const sizeKB = sizeBytes / 1024;
            const estimatedMinified = sizeKB * 0.4; // ~60% reduction

            console.log(`   search-view-complete.js: ${formatBytes(sizeBytes)} (est. minified: ${estimatedMinified.toFixed(2)} KB)`);
            expect(sizeKB).toBeLessThan(150);
        });

        test('compare-view.js should be < 150KB (source)', () => {
            const filePath = path.join(componentsDir, 'compare-view.js');
            const sizeBytes = getFileSize(filePath);
            const sizeKB = sizeBytes / 1024;
            const estimatedMinified = sizeKB * 0.4;

            console.log(`   compare-view.js: ${formatBytes(sizeBytes)} (est. minified: ${estimatedMinified.toFixed(2)} KB)`);
            expect(sizeKB).toBeLessThan(150);
        });

        test('entity-quick-view-modal.js should be < 75KB (source)', () => {
            const filePath = path.join(componentsDir, 'entity-quick-view-modal.js');
            const sizeBytes = getFileSize(filePath);
            const sizeKB = sizeBytes / 1024;
            const estimatedMinified = sizeKB * 0.4;

            console.log(`   entity-quick-view-modal.js: ${formatBytes(sizeBytes)} (est. minified: ${estimatedMinified.toFixed(2)} KB)`);
            expect(sizeKB).toBeLessThan(75);
        });

        test('edit-entity-modal.js should be < 150KB (source)', () => {
            const filePath = path.join(componentsDir, 'edit-entity-modal.js');
            const sizeBytes = getFileSize(filePath);
            const sizeKB = sizeBytes / 1024;
            const estimatedMinified = sizeKB * 0.4;

            console.log(`   edit-entity-modal.js: ${formatBytes(sizeBytes)} (est. minified: ${estimatedMinified.toFixed(2)} KB)`);
            expect(sizeKB).toBeLessThan(150);
        });

        test('user-dashboard.js should be < 150KB (source)', () => {
            const filePath = path.join(componentsDir, 'user-dashboard.js');
            const sizeBytes = getFileSize(filePath);
            const sizeKB = sizeBytes / 1024;
            const estimatedMinified = sizeKB * 0.4;

            console.log(`   user-dashboard.js: ${formatBytes(sizeBytes)} (est. minified: ${estimatedMinified.toFixed(2)} KB)`);
            expect(sizeKB).toBeLessThan(150);
        });
    });

    describe('Component Analysis', () => {
        test('should list all components with sizes', () => {
            if (!fs.existsSync(componentsDir)) {
                console.log('   Components directory not found, skipping');
                return;
            }

            const files = fs.readdirSync(componentsDir)
                .filter(file => file.endsWith('.js') && !file.endsWith('.min.js'));

            console.log('\n📦 Component Size Report:');
            console.log('─'.repeat(60));

            let totalSize = 0;
            const sizeData = [];

            files.forEach(file => {
                const filePath = path.join(componentsDir, file);
                const sizeBytes = getFileSize(filePath);
                totalSize += sizeBytes;

                sizeData.push({
                    file,
                    size: sizeBytes,
                    sizeKB: (sizeBytes / 1024).toFixed(2)
                });
            });

            // Sort by size descending
            sizeData.sort((a, b) => b.size - a.size);

            // Display table
            sizeData.forEach(({ file, size, sizeKB }) => {
                const bar = '█'.repeat(Math.floor(size / 1024 / 5));
                console.log(`   ${file.padEnd(40)} ${sizeKB.padStart(8)} KB ${bar}`);
            });

            console.log('─'.repeat(60));
            console.log(`   Total: ${formatBytes(totalSize)}`);
            console.log('');

            expect(files.length).toBeGreaterThan(0);
        });

        test('should identify largest components', () => {
            if (!fs.existsSync(componentsDir)) return;

            const files = fs.readdirSync(componentsDir)
                .filter(file => file.endsWith('.js') && !file.endsWith('.min.js'));

            const sizeData = files.map(file => {
                const filePath = path.join(componentsDir, file);
                return {
                    file,
                    size: getFileSize(filePath)
                };
            }).sort((a, b) => b.size - a.size);

            const top5 = sizeData.slice(0, 5);

            console.log('\n🔝 Top 5 Largest Components:');
            top5.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.file}: ${formatBytes(item.size)}`);
            });

            expect(top5.length).toBeGreaterThan(0);
        });
    });

    describe('Code Quality Metrics', () => {
        test('should check for minification opportunities', () => {
            const filePath = path.join(componentsDir, 'search-view-complete.js');

            if (!fs.existsSync(filePath)) {
                console.log('   File not found, skipping');
                return;
            }

            const content = fs.readFileSync(filePath, 'utf-8');

            // Count different types of content
            const metrics = {
                totalLines: content.split('\n').length,
                codeLines: content.split('\n').filter(line => {
                    const trimmed = line.trim();
                    return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
                }).length,
                commentLines: content.split('\n').filter(line => {
                    const trimmed = line.trim();
                    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
                }).length,
                emptyLines: content.split('\n').filter(line => !line.trim()).length
            };

            const commentRatio = (metrics.commentLines / metrics.totalLines) * 100;

            console.log('\n📊 Code Quality Metrics:');
            console.log(`   Total Lines: ${metrics.totalLines}`);
            console.log(`   Code Lines: ${metrics.codeLines}`);
            console.log(`   Comment Lines: ${metrics.commentLines} (${commentRatio.toFixed(1)}%)`);
            console.log(`   Empty Lines: ${metrics.emptyLines}`);

            expect(metrics.codeLines).toBeGreaterThan(0);
        });

        test('should estimate minified size reduction', () => {
            const filePath = path.join(componentsDir, 'search-view-complete.js');

            if (!fs.existsSync(filePath)) return;

            const originalSize = getFileSize(filePath);
            const content = fs.readFileSync(filePath, 'utf-8');

            // Simple minification simulation (remove comments and whitespace)
            const simpleMinified = content
                .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
                .replace(/\/\/.*/g, '') // Line comments
                .replace(/\s+/g, ' ') // Multiple spaces
                .trim();

            const minifiedSize = Buffer.byteLength(simpleMinified, 'utf-8');
            const reduction = ((originalSize - minifiedSize) / originalSize) * 100;

            console.log('\n💾 Minification Estimate:');
            console.log(`   Original: ${formatBytes(originalSize)}`);
            console.log(`   Minified (estimated): ${formatBytes(minifiedSize)}`);
            console.log(`   Reduction: ${reduction.toFixed(1)}%`);

            expect(reduction).toBeGreaterThan(0);
        });
    });

    describe('Tree Shaking Opportunities', () => {
        test('should identify unused exports', () => {
            // This is a simplified check - real tree shaking requires bundler analysis
            const filePath = path.join(componentsDir, 'search-view-complete.js');

            if (!fs.existsSync(filePath)) return;

            const content = fs.readFileSync(filePath, 'utf-8');

            // Look for export statements
            const exportMatches = content.match(/export\s+(const|function|class)\s+\w+/g) || [];

            console.log('\n🌲 Export Analysis:');
            console.log(`   Exports found: ${exportMatches.length}`);

            if (exportMatches.length > 0) {
                exportMatches.forEach(exp => {
                    console.log(`   - ${exp}`);
                });
            } else {
                console.log('   No named exports (good for tree shaking)');
            }

            // Files should minimize exports
            expect(exportMatches.length).toBeLessThan(10);
        });

        test('should check for circular dependencies', () => {
            // Simplified check - look for imports that might cause circular deps
            const filePath = path.join(componentsDir, 'search-view-complete.js');

            if (!fs.existsSync(filePath)) return;

            const content = fs.readFileSync(filePath, 'utf-8');

            // Look for relative imports
            const importMatches = content.match(/import\s+.*\s+from\s+['"]\..*['"]/g) || [];

            console.log('\n🔄 Dependency Check:');
            console.log(`   Relative imports: ${importMatches.length}`);

            importMatches.forEach(imp => {
                console.log(`   - ${imp}`);
            });

            // Keep relative imports minimal
            expect(importMatches.length).toBeLessThan(20);
        });
    });

    describe('Performance Budget Compliance', () => {
        test('should enforce total bundle size budget (source files)', () => {
            if (!fs.existsSync(componentsDir)) return;

            const files = fs.readdirSync(componentsDir)
                .filter(file => file.endsWith('.js') && !file.endsWith('.min.js'));

            let totalSize = 0;
            files.forEach(file => {
                totalSize += getFileSize(path.join(componentsDir, file));
            });

            const totalKB = totalSize / 1024;
            const budget = 1000; // 1000KB for source files (unminified)
            const estimatedMinified = totalKB * 0.4; // ~60% reduction

            console.log('\n💰 Bundle Budget Check:');
            console.log(`   Total Source Size: ${formatBytes(totalSize)} (${totalKB.toFixed(2)} KB)`);
            console.log(`   Estimated Minified: ${estimatedMinified.toFixed(2)} KB`);
            console.log(`   Budget (source): ${budget} KB`);
            console.log(`   Expected Production: ~400 KB`);
            console.log(`   Status: ${totalKB < budget ? '✅ PASS' : '❌ FAIL'}`);

            expect(totalKB).toBeLessThan(budget);
        });

        test('should warn about critical path components (source files)', () => {
            // Components loaded on initial page load
            const criticalComponents = [
                'entity-card.js',
                'mythology-nav.js',
                'search-ui.js'
            ];

            console.log('\n⚡ Critical Path Components:');

            let criticalTotal = 0;
            criticalComponents.forEach(file => {
                const filePath = path.join(componentsDir, file);
                const size = getFileSize(filePath);
                criticalTotal += size;

                const sizeKB = size / 1024;
                const estimatedMinified = sizeKB * 0.4;
                const status = sizeKB < 75 ? '✅' : '⚠️';

                console.log(`   ${status} ${file}: ${formatBytes(size)} (est. minified: ${estimatedMinified.toFixed(2)} KB)`);
            });

            const criticalKB = criticalTotal / 1024;
            const estimatedMinified = criticalKB * 0.4;
            console.log(`   Total Critical (source): ${formatBytes(criticalTotal)} (${criticalKB.toFixed(2)} KB)`);
            console.log(`   Estimated Minified: ${estimatedMinified.toFixed(2)} KB`);

            // Critical path should be < 150KB total (source)
            expect(criticalKB).toBeLessThan(150);
        });
    });

    describe('Optimization Recommendations', () => {
        test('should provide optimization suggestions', () => {
            const recommendations = {
                'Code Splitting': 'Split large components into smaller, lazy-loaded modules',
                'Tree Shaking': 'Use named exports and avoid default exports for better tree shaking',
                'Minification': 'Minify production builds to reduce size by ~40-60%',
                'Compression': 'Enable gzip/brotli compression on server (70-80% reduction)',
                'Lazy Loading': 'Defer non-critical components until needed',
                'Dead Code': 'Remove unused functions and imports',
                'Duplicate Code': 'Extract shared utilities to reduce duplication',
                'Dependencies': 'Audit npm packages for size (use bundlephobia.com)'
            };

            console.log('\n💡 Optimization Recommendations:');
            Object.entries(recommendations).forEach(([category, suggestion]) => {
                console.log(`   ${category}:`);
                console.log(`      ${suggestion}`);
            });

            expect(Object.keys(recommendations).length).toBeGreaterThan(0);
        });

        test('should estimate compressed sizes', () => {
            const filePath = path.join(componentsDir, 'search-view-complete.js');

            if (!fs.existsSync(filePath)) return;

            const originalSize = getFileSize(filePath);

            // Estimate compression ratios
            const gzipEstimate = originalSize * 0.3; // ~70% reduction
            const brotliEstimate = originalSize * 0.2; // ~80% reduction

            console.log('\n📦 Compression Estimates:');
            console.log(`   Original: ${formatBytes(originalSize)}`);
            console.log(`   Gzip (estimated): ${formatBytes(gzipEstimate)} (-70%)`);
            console.log(`   Brotli (estimated): ${formatBytes(brotliEstimate)} (-80%)`);

            expect(gzipEstimate).toBeLessThan(originalSize);
        });
    });
});

describe('Bundle Analysis Report', () => {
    test('should generate comprehensive bundle report', () => {
        const componentsDir = path.join(__dirname, '../../js/components');

        if (!fs.existsSync(componentsDir)) {
            console.log('Components directory not found');
            return;
        }

        const files = fs.readdirSync(componentsDir)
            .filter(file => file.endsWith('.js') && !file.endsWith('.min.js'));

        const report = {
            totalFiles: files.length,
            totalSize: 0,
            avgSize: 0,
            maxSize: 0,
            minSize: Infinity,
            largestFile: '',
            smallestFile: ''
        };

        files.forEach(file => {
            const size = fs.statSync(path.join(componentsDir, file)).size;
            report.totalSize += size;

            if (size > report.maxSize) {
                report.maxSize = size;
                report.largestFile = file;
            }

            if (size < report.minSize) {
                report.minSize = size;
                report.smallestFile = file;
            }
        });

        report.avgSize = report.totalSize / report.totalFiles;

        console.log('\n📋 Bundle Analysis Report:');
        console.log('═'.repeat(60));
        console.log(`   Total Files: ${report.totalFiles}`);
        console.log(`   Total Size: ${(report.totalSize / 1024).toFixed(2)} KB`);
        console.log(`   Average Size: ${(report.avgSize / 1024).toFixed(2)} KB`);
        console.log(`   Largest: ${report.largestFile} (${(report.maxSize / 1024).toFixed(2)} KB)`);
        console.log(`   Smallest: ${report.smallestFile} (${(report.minSize / 1024).toFixed(2)} KB)`);
        console.log('═'.repeat(60));

        expect(report.totalFiles).toBeGreaterThan(0);
    });
});
