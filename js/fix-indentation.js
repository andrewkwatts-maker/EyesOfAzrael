/**
 * Fix indentation issues in spa-navigation.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'spa-navigation.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the misaligned mainContent lines
content = content.replace(/\ntry {\nconst mainContent/g, '\n        try {\n            const mainContent');

// Fix the misplaced closing brace followed by new line
content = content.replace(/mainContent\.innerHTML = (.*?);\n    }\n\n            console\.log/g,
    (match, p1) => `mainContent.innerHTML = ${p1};\n\n            console.log`);

// Write fixed content
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Indentation fixed!');
