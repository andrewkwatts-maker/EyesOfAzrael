/**
 * Script to add event coordination to SPA Navigation
 * Adds 'first-render-complete' and 'render-error' events to all render methods
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'spa-navigation.js');
let content = fs.readFileSync(filePath, 'utf8');

// Helper function to add event emission after successful render
function wrapRenderWithEvents(methodName, routeType, params = []) {
    // Pattern to match the method
    const methodPattern = new RegExp(
        `async ${methodName}\\(([^)]*)\\) {\\s*([\\s\\S]*?)(?=\\n    async |\\n    renderError|\\n    showLoading|$)`,
        ''
    );

    const match = content.match(methodPattern);
    if (!match) {
        console.log(`❌ Could not find method: ${methodName}`);
        return false;
    }

    console.log(`✅ Found method: ${methodName}`);

    // Check if already has event coordination
    if (match[0].includes('first-render-complete') || match[0].includes('render-error')) {
        console.log(`   ⏭️  Already has event coordination, skipping`);
        return false;
    }

    const methodParams = match[1];
    const methodBody = match[2];

    // Build the event detail based on route type and params
    let eventDetail = `{
                    route: '${routeType}',`;

    params.forEach(param => {
        eventDetail += `\n                    ${param}: ${param},`;
    });

    eventDetail += `\n                    timestamp: Date.now()
                }`;

    // Build new method with try-catch and events
    const newMethod = `async ${methodName}(${methodParams}) {
        console.log('[SPA] ▶️  ${methodName}() called');

        try {
${methodBody.trimEnd()}

            console.log('[SPA] ✅ ${methodName}() rendered successfully');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: ${eventDetail}
            }));
        } catch (error) {
            console.error('[SPA] ❌ ${methodName}() render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: ${eventDetail.replace('timestamp: Date.now()', 'error: error.message,\n                    timestamp: Date.now()')}
            }));
            throw error;
        }
    }`;

    content = content.replace(methodPattern, newMethod);
    console.log(`   ✓ Added event coordination`);
    return true;
}

console.log('Starting event coordination implementation...\n');

// Apply to all render methods
const methods = [
    { name: 'renderMythology', route: 'mythology', params: ['mythologyId'] },
    { name: 'renderCategory', route: 'category', params: ['mythology', 'category'] },
    { name: 'renderEntity', route: 'entity', params: ['mythology', 'categoryType', 'entityId'] },
    { name: 'renderSearch', route: 'search', params: [] },
    { name: 'renderCompare', route: 'compare', params: [] },
    { name: 'renderDashboard', route: 'dashboard', params: [] },
    { name: 'render404', route: '404', params: [] }
];

let modified = 0;
methods.forEach(method => {
    if (wrapRenderWithEvents(method.name, method.route, method.params)) {
        modified++;
    }
});

// Handle renderHome separately due to its complexity
console.log('\n🏠 Handling renderHome() separately...');
if (content.includes('async renderHome()') && !content.match(/renderHome[\s\S]{0,100}first-render-complete/)) {
    // Add event at the early return point
    content = content.replace(
        /(\s+if \(!mainContent\) {\s+console\.error\('\[SPA\] ❌ CRITICAL: main-content element not found!'\);[\s\S]*?return;\s+})/,
        match => match.replace(
            'return;',
            `
            // Emit error event
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'home',
                    error: 'main-content element not found',
                    timestamp: Date.now()
                }
            }));
            return;`
        )
    );

    // Add events after each renderer path
    // PageAssetRenderer success
    content = content.replace(
        /(await renderer\.renderPage\('home', mainContent\);\s+console\.log\('\[SPA\] ✅ Home page rendered via PageAssetRenderer'\);)\s+return;/,
        `$1

                        // Emit success event
                        console.log('[SPA] 📡 Emitting first-render-complete event (PageAssetRenderer)');
                        document.dispatchEvent(new CustomEvent('first-render-complete', {
                            detail: {
                                route: 'home',
                                renderer: 'PageAssetRenderer',
                                timestamp: Date.now()
                            }
                        }));
                        return;`
    );

    // HomeView success
    content = content.replace(
        /(await homeView\.render\(mainContent\);\s+console\.log\('\[SPA\] ✅ Home page rendered via HomeView'\);)\s+return;/,
        `$1

                // Emit success event
                console.log('[SPA] 📡 Emitting first-render-complete event (HomeView)');
                document.dispatchEvent(new CustomEvent('first-render-complete', {
                    detail: {
                        route: 'home',
                        renderer: 'HomeView',
                        timestamp: Date.now()
                    }
                }));
                return;`
    );

    // Inline fallback - wrap the whole fallback section in try-catch if not already
    const homeMethodMatch = content.match(/async renderHome\(\) \{([\s\S]*?)(?=\n    async )/);
    if (homeMethodMatch && !homeMethodMatch[1].includes('try {')) {
        // Find the fallback section and add event emission at the end
        content = content.replace(
            /(console\.log\('\[SPA\] Home page rendered'\);)/,
            `console.log('[SPA] ✅ Home page rendered (inline fallback)');

            // Emit success event
            console.log('[SPA] 📡 Emitting first-render-complete event (inline)');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'home',
                    renderer: 'inline-fallback',
                    timestamp: Date.now()
                }
            }));`
        );
    }

    console.log('✅ Added event coordination to renderHome()');
    modified++;
} else {
    console.log('⏭️  renderHome() already has event coordination or not found');
}

// Write the modified content
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ EVENT COORDINATION IMPLEMENTATION COMPLETE`);
console.log(`${'='.repeat(50)}`);
console.log(`Modified ${modified} render methods`);
console.log(`File: ${filePath}`);
