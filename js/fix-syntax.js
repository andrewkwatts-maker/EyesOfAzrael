/**
 * Fix syntax errors in spa-navigation.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'spa-navigation.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix pattern: Remove orphaned closing braces and fix indentation
// Pattern: try { \nconst mainContent... innerHTML = ...;\n    }\n\n            console.log
const fixes = [
    {
        pattern: /async renderMythology\(mythologyId\) \{\s+console\.log\('\[SPA\] ▶️  renderMythology\(\) called'\);\s+try \{\nconst mainContent[\s\S]*?mainContent\.innerHTML = `<div class="mythology-page">.*?<\/div>`;\n    \}\n\n/,
        replacement: `async renderMythology(mythologyId) {
        console.log('[SPA] ▶️  renderMythology() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = \`<div class="mythology-page"><h1>\${mythologyId} Mythology</h1><p>Coming soon...</p></div>\`;

`
    },
    {
        pattern: /async renderCategory\(mythology, category\) \{\s+console\.log\('\[SPA\] ▶️  renderCategory\(\) called'\);\s+try \{\nconst mainContent[\s\S]*?mainContent\.innerHTML = `<div class="category-page">.*?<\/div>`;\n    \}\n\n/,
        replacement: `async renderCategory(mythology, category) {
        console.log('[SPA] ▶️  renderCategory() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = \`<div class="category-page"><h1>\${category} - \${mythology}</h1><p>Coming soon...</p></div>\`;

`
    },
    {
        pattern: /async renderEntity\(mythology, categoryType, entityId\) \{\s+console\.log\('\[SPA\] ▶️  renderEntity\(\) called'\);\s+try \{\nconst mainContent[\s\S]*?mainContent\.innerHTML = `<div class="entity-page">.*?<\/div>`;\n    \}\n\n/,
        replacement: `async renderEntity(mythology, categoryType, entityId) {
        console.log('[SPA] ▶️  renderEntity() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = \`<div class="entity-page"><h1>\${entityId}</h1><p>Coming soon...</p></div>\`;

`
    },
    {
        pattern: /async renderSearch\(\) \{\s+console\.log\('\[SPA\] ▶️  renderSearch\(\) called'\);\s+try \{\nconst mainContent[\s\S]*?mainContent\.innerHTML = '<div id="search-container"><\/div>';\n    \}\n\n/,
        replacement: `async renderSearch() {
        console.log('[SPA] ▶️  renderSearch() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = '<div id="search-container"></div>';

`
    },
    {
        pattern: /async renderCompare\(\) \{\s+console\.log\('\[SPA\] ▶️  renderCompare\(\) called'\);\s+try \{\nconst mainContent[\s\S]*?mainContent\.innerHTML = `<div class="compare-page">.*?<\/div>`;\n    \}\n\n/,
        replacement: `async renderCompare() {
        console.log('[SPA] ▶️  renderCompare() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = \`<div class="compare-page"><h1>Compare Entities</h1><p>Coming soon...</p></div>\`;

`
    },
    {
        pattern: /async renderDashboard\(\) \{\s+console\.log\('\[SPA\] ▶️  renderDashboard\(\) called'\);\s+try \{\nconst mainContent[\s\S]*?mainContent\.innerHTML = `<div class="dashboard-page">.*?<\/div>`;\n    \}\n\n/,
        replacement: `async renderDashboard() {
        console.log('[SPA] ▶️  renderDashboard() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = \`<div class="dashboard-page"><h1>My Contributions</h1><p>Coming soon...</p></div>\`;

`
    },
    {
        pattern: /async render404\(\) \{\s+console\.log\('\[SPA\] ▶️  render404\(\) called'\);\s+try \{\nconst mainContent[\s\S]*?<a href="#\/" class="btn-primary">Return Home<\/a>\s+<\/div>\s+`;\n    \}\n\n/,
        replacement: `async render404() {
        console.log('[SPA] ▶️  render404() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = \`
                <div class="error-page">
                    <h1>404</h1>
                    <p>Page not found</p>
                    <a href="#/" class="btn-primary">Return Home</a>
                </div>
            \`;

`
    }
];

// Apply fixes
fixes.forEach((fix, index) => {
    if (content.match(fix.pattern)) {
        content = content.replace(fix.pattern, fix.replacement);
        console.log(`✅ Applied fix ${index + 1}`);
    } else {
        console.log(`⏭️  Fix ${index + 1} pattern not found, skipping`);
    }
});

// Write fixed content
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Syntax fixes completed!');
