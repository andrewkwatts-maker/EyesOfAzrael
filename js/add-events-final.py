#!/usr/bin/env python3
import re

with open('spa-navigation.js', 'r', encoding='utf-8') as f:
    content = f.read()

# renderHome - add event at early return error
content = content.replace(
    """        if (!mainContent) {
            console.error('[SPA] ❌ CRITICAL: main-content element not found!');
            console.error('[SPA] 💡 DOM may not be ready or element ID is wrong');
            return;
        }""",
    """        if (!mainContent) {
            console.error('[SPA] ❌ CRITICAL: main-content element not found!');
            console.error('[SPA] 💡 DOM may not be ready or element ID is wrong');

            // Emit error event
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'home',
                    error: 'main-content element not found',
                    timestamp: Date.now()
                }
            }));
            return;
        }"""
)

# renderHome - add event for PageAssetRenderer success
content = content.replace(
    """                    console.log('[SPA] ✅ Home page rendered via PageAssetRenderer');
                    return;""",
    """                    console.log('[SPA] ✅ Home page rendered via PageAssetRenderer');

                    // Emit success event
                    console.log('[SPA] 📡 Emitting first-render-complete event (PageAssetRenderer)');
                    document.dispatchEvent(new CustomEvent('first-render-complete', {
                        detail: {
                            route: 'home',
                            renderer: 'PageAssetRenderer',
                            timestamp: Date.now()
                        }
                    }));
                    return;"""
)

# renderHome - add event for HomeView success
content = content.replace(
    """            console.log('[SPA] ✅ Home page rendered via HomeView');
            return;""",
    """            console.log('[SPA] ✅ Home page rendered via HomeView');

            // Emit success event
            console.log('[SPA] 📡 Emitting first-render-complete event (HomeView)');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'home',
                    renderer: 'HomeView',
                    timestamp: Date.now()
                }
            }));
            return;"""
)

# renderHome - add event for inline fallback
content = content.replace(
    """        console.log('[SPA] Home page rendered');
    }""",
    """        console.log('[SPA] ✅ Home page rendered (inline fallback)');

        // Emit success event
        console.log('[SPA] 📡 Emitting first-render-complete event (inline)');
        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: {
                route: 'home',
                renderer: 'inline-fallback',
                timestamp: Date.now()
            }
        }));
    }"""
)

# renderMythology
content = content.replace(
    """    async renderMythology(mythologyId) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="mythology-page"><h1>${mythologyId} Mythology</h1><p>Coming soon...</p></div>`;
    }""",
    """    async renderMythology(mythologyId) {
        console.log('[SPA] ▶️  renderMythology() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div class="mythology-page"><h1>${mythologyId} Mythology</h1><p>Coming soon...</p></div>`;

            console.log('[SPA] ✅ Mythology page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'mythology',
                    mythologyId: mythologyId,
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Mythology page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'mythology',
                    mythologyId: mythologyId,
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }"""
)

# renderCategory
content = content.replace(
    """    async renderCategory(mythology, category) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="category-page"><h1>${category} - ${mythology}</h1><p>Coming soon...</p></div>`;
    }""",
    """    async renderCategory(mythology, category) {
        console.log('[SPA] ▶️  renderCategory() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div class="category-page"><h1>${category} - ${mythology}</h1><p>Coming soon...</p></div>`;

            console.log('[SPA] ✅ Category page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'category',
                    mythology: mythology,
                    category: category,
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Category page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'category',
                    mythology: mythology,
                    category: category,
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }"""
)

# renderEntity
content = content.replace(
    """    async renderEntity(mythology, categoryType, entityId) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="entity-page"><h1>${entityId}</h1><p>Coming soon...</p></div>`;
    }""",
    """    async renderEntity(mythology, categoryType, entityId) {
        console.log('[SPA] ▶️  renderEntity() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div class="entity-page"><h1>${entityId}</h1><p>Coming soon...</p></div>`;

            console.log('[SPA] ✅ Entity page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'entity',
                    mythology: mythology,
                    categoryType: categoryType,
                    entityId: entityId,
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Entity page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'entity',
                    mythology: mythology,
                    categoryType: categoryType,
                    entityId: entityId,
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }"""
)

# renderSearch
content = content.replace(
    """    async renderSearch() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div id="search-container"></div>';
    }""",
    """    async renderSearch() {
        console.log('[SPA] ▶️  renderSearch() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = '<div id="search-container"></div>';

            console.log('[SPA] ✅ Search page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'search',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Search page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'search',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }"""
)

# renderCompare
content = content.replace(
    """    async renderCompare() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="compare-page"><h1>Compare Entities</h1><p>Coming soon...</p></div>`;
    }""",
    """    async renderCompare() {
        console.log('[SPA] ▶️  renderCompare() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div class="compare-page"><h1>Compare Entities</h1><p>Coming soon...</p></div>`;

            console.log('[SPA] ✅ Compare page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'compare',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Compare page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'compare',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }"""
)

# renderDashboard
content = content.replace(
    """    async renderDashboard() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="dashboard-page"><h1>My Contributions</h1><p>Coming soon...</p></div>`;
    }""",
    """    async renderDashboard() {
        console.log('[SPA] ▶️  renderDashboard() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div class="dashboard-page"><h1>My Contributions</h1><p>Coming soon...</p></div>`;

            console.log('[SPA] ✅ Dashboard page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'dashboard',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Dashboard page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'dashboard',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }"""
)

# render404
content = content.replace(
    """    async render404() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="error-page">
                <h1>404</h1>
                <p>Page not found</p>
                <a href="#/" class="btn-primary">Return Home</a>
            </div>
        `;
    }""",
    """    async render404() {
        console.log('[SPA] ▶️  render404() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>404</h1>
                    <p>Page not found</p>
                    <a href="#/" class="btn-primary">Return Home</a>
                </div>
            `;

            console.log('[SPA] ✅ 404 page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: '404',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ 404 page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: '404',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }"""
)

with open('spa-navigation.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Event coordination added successfully!")
