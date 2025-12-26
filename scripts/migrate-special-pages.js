/**
 * Migration Script for Special Pages with Hardcoded Tables
 * Agent 3 - Migrating comparative and theological pages
 *
 * These pages contain research content in table format that should remain static.
 * We add Firebase SDK so they work with the new system, but keep the tables.
 */

const fs = require('fs');
const path = require('path');

// Firebase SDK snippet to inject
const FIREBASE_SDK = `
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

    <!-- Firebase Config -->
    <script src="/js/firebase-config.js"></script>

    <!-- Auth Guard -->
    <script src="/js/auth-guard.js"></script>
    <script src="/js/components/google-signin-button.js"></script>`;

// Static content notice to add before main content
const STATIC_CONTENT_NOTICE = `
    <!-- Static Content Notice -->
    <div class="info-notice" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
         border: 2px solid var(--color-primary, #667eea); border-radius: 12px; padding: 1rem 1.5rem;
         margin: 1.5rem 0; display: flex; align-items: center; gap: 1rem;">
        <span style="font-size: 1.5rem;">&#128214;</span>
        <p style="margin: 0; line-height: 1.6;">
            <strong>Research Content:</strong> This page contains static comparative and theological research.
            The content may be migrated to the Firebase database in a future update for enhanced features.
        </p>
    </div>`;

// Responsive grid CSS to ensure tables work on mobile
const RESPONSIVE_TABLE_CSS = `
    <style>
        /* Responsive table styling */
        @media (max-width: 768px) {
            table {
                display: block;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }

            .comparison-table, .contrast-table {
                font-size: 0.85rem;
            }

            .comparison-table th,
            .comparison-table td,
            .contrast-table th,
            .contrast-table td {
                padding: 0.5rem;
            }
        }

        /* Info notice responsive */
        @media (max-width: 640px) {
            .info-notice {
                flex-direction: column;
                text-align: center;
            }
        }
    </style>`;

/**
 * Check if page already has Firebase SDK
 */
function hasFirebaseSDK(content) {
    return content.includes('firebase-app-compat.js') ||
           content.includes('firebase.firestore');
}

/**
 * Check if page already has static content notice
 */
function hasStaticNotice(content) {
    return content.includes('Static Content Notice') ||
           content.includes('Research Content:');
}

/**
 * Check if page already has responsive table CSS
 */
function hasResponsiveCSS(content) {
    return content.includes('Responsive table styling') ||
           content.includes('@media (max-width: 768px)');
}

/**
 * Inject Firebase SDK into <head> section
 */
function injectFirebaseSDK(content) {
    // Find the best place to inject - before </head>
    if (content.includes('</head>')) {
        return content.replace('</head>', `${FIREBASE_SDK}\n</head>`);
    }

    console.warn('  Warning: Could not find </head> tag');
    return content;
}

/**
 * Inject static content notice after opening <main> or first <section>
 */
function injectStaticNotice(content) {
    // Try to inject after <main> opening tag
    if (content.match(/<main[^>]*>/)) {
        return content.replace(/(<main[^>]*>)/, `$1${STATIC_CONTENT_NOTICE}`);
    }

    // Try to inject after first section or article
    if (content.match(/<(section|article)[^>]*>/)) {
        return content.replace(/(<(?:section|article)[^>]*>)/, `$1${STATIC_CONTENT_NOTICE}`);
    }

    // Try to inject after container div
    if (content.match(/<div[^>]*class="[^"]*container[^"]*"[^>]*>/)) {
        return content.replace(/(<div[^>]*class="[^"]*container[^"]*"[^>]*>)/, `$1${STATIC_CONTENT_NOTICE}`);
    }

    console.warn('  Warning: Could not find appropriate place for static notice');
    return content;
}

/**
 * Inject responsive table CSS into <head> section
 */
function injectResponsiveCSS(content) {
    // Inject before </head>
    if (content.includes('</head>')) {
        return content.replace('</head>', `${RESPONSIVE_TABLE_CSS}\n</head>`);
    }

    console.warn('  Warning: Could not find </head> tag for responsive CSS');
    return content;
}

/**
 * Migrate a single page
 */
function migratePage(filePath) {
    const relativePath = path.relative('H:\\Github\\EyesOfAzrael', filePath);
    console.log(`\nProcessing: ${relativePath}`);

    try {
        // Read file
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Check and inject Firebase SDK
        if (!hasFirebaseSDK(content)) {
            console.log('  + Adding Firebase SDK');
            content = injectFirebaseSDK(content);
            modified = true;
        } else {
            console.log('  ✓ Firebase SDK already present');
        }

        // Check and inject static content notice
        if (!hasStaticNotice(content)) {
            console.log('  + Adding static content notice');
            content = injectStaticNotice(content);
            modified = true;
        } else {
            console.log('  ✓ Static content notice already present');
        }

        // Check and inject responsive table CSS
        if (!hasResponsiveCSS(content)) {
            console.log('  + Adding responsive table CSS');
            content = injectResponsiveCSS(content);
            modified = true;
        } else {
            console.log('  ✓ Responsive table CSS already present');
        }

        // Write back if modified
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('  ✅ Page updated successfully');
            return { success: true, modified: true };
        } else {
            console.log('  ⏭️  No changes needed');
            return { success: true, modified: false };
        }

    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Main migration function
 */
function main() {
    console.log('='.repeat(80));
    console.log('Special Pages Migration - Agent 3');
    console.log('Migrating pages with hardcoded tables to work with Firebase system');
    console.log('='.repeat(80));

    // Read the list of pages to migrate
    const pagesListPath = 'H:\\Github\\EyesOfAzrael\\hardcoded_table_pages.txt';

    if (!fs.existsSync(pagesListPath)) {
        console.error('Error: hardcoded_table_pages.txt not found');
        console.error('Please ensure the file exists with the list of pages to migrate');
        process.exit(1);
    }

    const pagesList = fs.readFileSync(pagesListPath, 'utf8')
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

    console.log(`\nFound ${pagesList.length} pages to process\n`);

    // Process each page
    const results = {
        total: pagesList.length,
        successful: 0,
        modified: 0,
        skipped: 0,
        failed: 0,
        errors: []
    };

    pagesList.forEach((pagePath, index) => {
        const fullPath = path.join('H:\\Github\\EyesOfAzrael', pagePath);

        if (!fs.existsSync(fullPath)) {
            console.log(`\n[${index + 1}/${pagesList.length}] ⚠️  File not found: ${pagePath}`);
            results.failed++;
            results.errors.push({ path: pagePath, error: 'File not found' });
            return;
        }

        const result = migratePage(fullPath);

        if (result.success) {
            results.successful++;
            if (result.modified) {
                results.modified++;
            } else {
                results.skipped++;
            }
        } else {
            results.failed++;
            results.errors.push({ path: pagePath, error: result.error });
        }
    });

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total pages:        ${results.total}`);
    console.log(`✅ Successful:      ${results.successful}`);
    console.log(`📝 Modified:        ${results.modified}`);
    console.log(`⏭️  Already ready:   ${results.skipped}`);
    console.log(`❌ Failed:          ${results.failed}`);

    if (results.errors.length > 0) {
        console.log('\n' + '-'.repeat(80));
        console.log('ERRORS:');
        results.errors.forEach(err => {
            console.log(`  ${err.path}: ${err.error}`);
        });
    }

    console.log('\n' + '='.repeat(80));
    console.log('Migration complete!');
    console.log('='.repeat(80));

    // Save detailed report
    const reportPath = 'H:\\Github\\EyesOfAzrael\\SPECIAL_PAGES_MIGRATION_REPORT.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        results: results,
        pages: pagesList
    }, null, 2));

    console.log(`\nDetailed report saved to: ${reportPath}`);
}

// Run migration
if (require.main === module) {
    main();
}

module.exports = { migratePage };
