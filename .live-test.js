const { chromium } = require('playwright');
const BASE = 'https://eyesofazrael.web.app/';
const CHECKS = [
    ['landing',            '#/',                              'Eyes of Azrael'],
    ['tradition',          '#/mythology/greek',               'Greek'],
    ['category',           '#/mythology/greek/deities',       'Deities'],
    ['topic',              '#/entity/deity/greek_zeus',       'Zeus'],
    ['browse',             '#/browse/deities',                'Deities'],
    ['search',             '#/search?q=zeus',                 'Search'],
    ['signup (was 404)',   '#/signup',                        'Sign in'],
    ['contribute (new)',   '#/contribute',                    'Contribute'],
    ['jupiter (was crash)','#/entity/deities/jupiter',        'Jupiter']
];
(async () => {
    const b = await chromium.launch();
    console.log('LIVE: ' + BASE + '\n');
    for (const [label, route, expect] of CHECKS) {
        const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
        const errs = [];
        p.on('pageerror', e => errs.push(e.message.slice(0, 40)));
        try { await p.goto(BASE + route, { waitUntil: 'load', timeout: 45000 }); } catch (e) {}
        await p.waitForTimeout(14000);
        const r = await p.evaluate(() => ({
            h1: (document.querySelector('h1') || {}).textContent?.trim().slice(0, 30) || '-',
            len: (document.body.innerText || '').trim().length,
            dead: /Page Not Found|Something Went Wrong/i.test(document.body.innerText || '')
        }));
        const ok = !r.dead && r.h1.toLowerCase().includes(expect.toLowerCase());
        console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${label.padEnd(20)} h1="${r.h1.padEnd(28)}" text=${String(r.len).padStart(6)} err=${errs.length}`);
        await p.close();
    }
    await b.close();
})();
