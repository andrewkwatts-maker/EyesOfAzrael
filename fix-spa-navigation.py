#!/usr/bin/env python3
"""Fix SPA Navigation to properly fallback from PageAssetRenderer to HomeView"""

with open('js/spa-navigation.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the renderHome PageAssetRenderer section
old_code = '''        // Try PageAssetRenderer first (dynamic Firebase page loading)
        if (typeof PageAssetRenderer !== 'undefined') {
            console.log('[SPA] Using PageAssetRenderer for home page');
            const renderer = new PageAssetRenderer(this.db);
            await renderer.renderPage('home', mainContent);
            console.log('[SPA] Home page rendered via PageAssetRenderer');
            return;
        }

        // Fallback to HomeView class if PageAssetRenderer not available'''

new_code = '''        // Try PageAssetRenderer first (dynamic Firebase page loading)
        if (typeof PageAssetRenderer !== 'undefined') {
            console.log('[SPA] Trying PageAssetRenderer for home page...');
            try {
                const renderer = new PageAssetRenderer(this.db);
                const pageData = await renderer.loadPage('home');

                if (pageData) {
                    await renderer.renderPage('home', mainContent);
                    console.log('[SPA] Home page rendered via PageAssetRenderer');
                    return;
                } else {
                    console.log('[SPA] Home page not found in Firebase, falling back to HomeView');
                }
            } catch (error) {
                console.warn('[SPA] PageAssetRenderer failed, falling back to HomeView:', error);
            }
        }

        // Fallback to HomeView class'''

if old_code in content:
    content = content.replace(old_code, new_code)
    with open('js/spa-navigation.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated spa-navigation.js")
else:
    print("ERROR: Could not find old code pattern")
