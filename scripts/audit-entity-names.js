#!/usr/bin/env node
/**
 * Audit the baked entity base for records that will mislead a reader.
 *
 * Prompted by deities/greek_eros, whose name is "Greek Mythology" and whose
 * description is Persephone's. The routing that surfaces it is correct; the
 * record is wrong. This asks how many more there are.
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'static', 'entities');

const MYTH_NAME = /^[A-Z][a-z]+\s+(Mythology|Myth|Pantheon|Tradition)$/;
const VERB_ISH = /^(advises|antagonizes|assists|becomes|creates|defeats|guides|marries|opposes|protects|rules|serves|teaches|transforms)/i;

const findings = { mythologyAsName: [], verbAsName: [], sentenceName: [], emptyName: [], nameIdMismatch: [] };
let total = 0;

function collectionsIn(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
}

for (const coll of collectionsIn(BASE)) {
    const dir = path.join(BASE, coll);
    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.json')) continue;
        if (file === '_all.json' || file === '_cards.json') continue; // duplicates of the shards
        let parsed;
        try { parsed = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); } catch { continue; }
        const arr = Array.isArray(parsed) ? parsed
            : (parsed.entities || Object.values(parsed).find(v => Array.isArray(v)));
        if (!Array.isArray(arr)) continue;

        for (const e of arr) {
            if (!e || typeof e !== 'object') continue;
            total++;
            const name = (e.name || '').trim();
            const id = e.id || '';
            const where = `${coll}/${id}`;

            if (!name) { findings.emptyName.push(where); continue; }
            if (MYTH_NAME.test(name)) findings.mythologyAsName.push(`${where}  name="${name}"`);
            else if (VERB_ISH.test(name)) findings.verbAsName.push(`${where}  name="${name}"`);
            else if (name.length > 60 || name.split(',').length > 2) findings.sentenceName.push(`${where}  name="${name.slice(0, 60)}..."`);
        }
    }
}

console.log(`scanned ${total} entity records\n`);
for (const [k, v] of Object.entries(findings)) {
    if (!v.length) continue;
    console.log(`${k}: ${v.length}`);
    v.slice(0, 5).forEach(x => console.log('   ' + x));
    if (v.length > 5) console.log(`   ... and ${v.length - 5} more`);
    console.log('');
}
const bad = Object.values(findings).reduce((a, v) => a + v.length, 0);
console.log(`${bad} suspect records (${(bad / total * 100).toFixed(2)}% of ${total})`);

// Non-zero exit when suspect records exist, so this can gate a re-bake.
process.exit(bad > 0 ? 1 : 0);
