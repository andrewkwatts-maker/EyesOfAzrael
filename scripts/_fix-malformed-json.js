// One-shot fix: extract first valid JSON object from concatenated files
const fs = require('fs');
const path = require('path');

const FILES = [
    'deities/greek_deity_semele.json',
    'deities/greek_entity_aether.json',
    'deities/greek_entity_arges.json',
];

const BASE = path.join(__dirname, '..', 'firebase-assets-downloaded');

for (const rel of FILES) {
    const filePath = path.join(BASE, rel);
    const s = fs.readFileSync(filePath, 'utf8');

    let depth = 0, inStr = false, esc = false, end = -1;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (esc) { esc = false; continue; }
        if (c === '\\' && inStr) { esc = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === '{') depth++;
        else if (c === '}') {
            depth--;
            if (depth === 0) { end = i; break; }
        }
    }

    if (end === -1) { console.error(`No end found in ${rel}`); continue; }

    const obj = JSON.parse(s.slice(0, end + 1));
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
    console.log(`Fixed: ${rel}`);
}
console.log('Done.');
