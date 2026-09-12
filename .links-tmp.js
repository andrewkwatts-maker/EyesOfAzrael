const { chromium } = require('playwright');

const SEED = ['#/', '#/mythologies', '#/browse/deities', '#/mythology/greek',
              '#/mythology/greek/deities', '#/entity/deity/greek_zeus', '#/search?q=zeus'];

(async () => {
    const b = await chromium.launch();

    // 1. Collect every distinct internal link target from the seed pages.
    const targets = new Set();
    for (const route of SEED) {
        const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
        await p.goto('http://localhost:8080/' + route, { waitUntil: 'load' }).catch(() => {});
        await p.waitForTimeout(11000);
        const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href^="#/"]')]
            .map(a => a.getAttribute('href')).filter(Boolean));
        hrefs.forEach(h => targets.add(h));
        await p.close();
    }

    // Collapse entity links to one representative — they all use one renderer.
    const byShape = new Map();
    for (const t of targets) {
        const shape = t.replace(/^#\//, '').split('/').map((seg, i) =>
            (i === 0 ? seg : (/^[a-z_]+$/.test(seg) ? seg : ':id'))).join('/');
        if (!byShape.has(shape)) byShape.set(shape, t);
    }

    console.log(`${targets.size} distinct links across ${SEED.length} pages, ${byShape.size} distinct shapes\n`);

    // 2. Visit one of each shape and see whether it resolves.
    const broken = [];
    for (const [shape, href] of [...byShape.entries()].sort()) {
        const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
        await p.goto('http://localhost:8080/' + href, { waitUntil: 'load' }).catch(() => {});
        await p.waitForTimeout(9000);
        const r = await p.evaluate(() => ({
            h1: (document.querySelector('h1') || {}).textContent?.trim().slice(0, 30) || '-',
            len: (document.body.innerText || '').trim().length,
            dead: /Page Not Found|404|Something Went Wrong/i.test(document.body.innerText || '')
        }));
        const ok = !r.dead && r.len > 1200;
        if (!ok) broken.push({ href, h1: r.h1 });
        console.log(`  ${ok ? 'OK  ' : 'DEAD'} ${href.padEnd(34)} h1="${r.h1}"`);
        await p.close();
    }

    console.log(broken.length ? `\n${broken.length} DEAD LINK TARGETS:` : '\nAll linked routes resolve.');
    broken.forEach(x => console.log(`   ${x.href}   -> "${x.h1}"`));
    await b.close();
})();
