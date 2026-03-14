/**
 * Generates js/shaders/shader-sources.js with all GLSL shaders inlined
 * Run: node scripts/generate-shader-sources.js
 */
const fs = require('fs');
const path = require('path');

const shaderDir = path.join(__dirname, '..', 'js', 'shaders');
const files = fs.readdirSync(shaderDir).filter(f => f.endsWith('.glsl'));

let output = `/**
 * Inline Shader Sources - Auto-generated
 * Eliminates fetch dependency for Firebase Hosting compatibility
 * Generated: ${new Date().toISOString()}
 */
window.SHADER_SOURCES = {};
`;

files.forEach(file => {
    const src = fs.readFileSync(path.join(shaderDir, file), 'utf8');
    // JSON.stringify handles all escaping correctly
    output += `\nwindow.SHADER_SOURCES[${JSON.stringify(file)}] = ${JSON.stringify(src)};\n`;
});

const outPath = path.join(shaderDir, 'shader-sources.js');
fs.writeFileSync(outPath, output);
const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`Created shader-sources.js: ${files.length} shaders, ${sizeKB}KB`);
