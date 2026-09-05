/**
 * Theme palette contrast guard.
 *
 * TWO SOURCES, and the distinction matters more than it looks.
 *
 * themes/theme-config.json is what the site actually paints with:
 * shader-theme-picker.js fetches it at runtime. The DEFAULT_THEME_CONFIG object
 * inside that JS file is only the fallback used when the fetch fails.
 *
 * The first version of this test read only the JS constant. It passed while the
 * JSON — the live one — still had every original value, so eight of seventeen
 * palettes were shipping text below the WCAG AA 4.5:1 minimum against their own
 * backgrounds, including the default `night`, with a green test on top. A guard
 * pointed at the wrong file is worse than no guard, because it answers the
 * question you meant to ask with a result about something else.
 *
 * So both are checked, and they are checked against each other: a fallback that
 * has drifted from the live config will render differently the day the fetch
 * fails, which is exactly when nobody is watching.
 *
 * Pinning hex values would not have helped either — the wrong values were
 * stable. This asserts the property.
 *
 * Static analysis only — no browser, no DOM.
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'js', 'shader-theme-picker.js');
const LIVE_CONFIG = path.join(__dirname, '..', 'themes', 'theme-config.json');

// ---------------------------------------------------------------------------
// WCAG 2.1 relative luminance and contrast ratio
// ---------------------------------------------------------------------------

function channels(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance(hex) {
    const [r, g, b] = channels(hex).map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
    const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

// ---------------------------------------------------------------------------
// Parse the THEMES table out of the source
// ---------------------------------------------------------------------------

function parseThemes(src) {
    const themes = {};
    const lines = src.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        const header = /^\s*(\w+):\s*\{\s*$/.exec(lines[i]);
        if (!header) continue;

        // A theme's colours sit on a `colors: {...}` line within a few lines of
        // its opening brace.
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            if (/^\s*\w+:\s*\{\s*$/.test(lines[j])) break;
            const colorsLine = /^\s*colors:\s*\{(.*)\}/.exec(lines[j]);
            if (!colorsLine) continue;

            const colors = {};
            const pair = /'([\w-]+)':\s*'([^']+)'/g;
            let p;
            while ((p = pair.exec(colorsLine[1])) !== null) colors[p[1]] = p[2];
            if (Object.keys(colors).length) themes[header[1]] = colors;
            break;
        }
    }
    return themes;
}

const HEX = /^#[0-9a-f]{6}$/i;
const FOREGROUNDS = ['text-primary', 'text-secondary', 'text-muted'];
const BACKGROUNDS = ['bg-primary', 'bg-secondary', 'bg-card'];
const AA_NORMAL_TEXT = 4.5;

/**
 * The two palette sources, keyed by how they reach the browser.
 *
 * "live" is authoritative — it is fetched at runtime. "fallback" only applies
 * when that fetch fails, which makes it the copy most likely to rot unnoticed.
 */
function loadSources() {
    const liveRaw = JSON.parse(fs.readFileSync(LIVE_CONFIG, 'utf8'));
    const live = {};
    for (const [name, theme] of Object.entries(liveRaw.themes || {})) {
        if (theme && theme.colors) live[name] = theme.colors;
    }
    return {
        live,
        fallback: parseThemes(fs.readFileSync(SOURCE, 'utf8'))
    };
}

describe('Theme palette contrast', () => {
    let sources;
    let themes;

    beforeAll(() => {
        sources = loadSources();
        themes = sources.fallback;
    });

    test('the THEMES table is parseable and non-trivial', () => {
        // Guards the parser itself: if the table's shape changes and this stops
        // finding themes, every contrast assertion below would vacuously pass.
        expect(Object.keys(themes).length).toBeGreaterThanOrEqual(10);
    });

    test('the live theme config is parseable and non-trivial', () => {
        expect(Object.keys(sources.live).length).toBeGreaterThanOrEqual(10);
    });

    test('LIVE config: every text colour meets WCAG AA against its own backgrounds', () => {
        // This is the one that matters — themes/theme-config.json is fetched at
        // runtime and is what actually paints the page.
        const failures = [];
        for (const [name, colors] of Object.entries(sources.live)) {
            for (const fg of FOREGROUNDS) {
                for (const bg of BACKGROUNDS) {
                    if (!HEX.test(colors[fg] || '') || !HEX.test(colors[bg] || '')) continue;
                    const ratio = contrastRatio(colors[fg], colors[bg]);
                    if (ratio < AA_NORMAL_TEXT) {
                        failures.push(
                            `${name}: ${fg} (${colors[fg]}) on ${bg} (${colors[bg]}) ` +
                            `= ${ratio.toFixed(2)}:1`
                        );
                    }
                }
            }
        }
        expect(failures).toEqual([]);
    });

    test('the fallback palettes match the live config', () => {
        // Drift here is silent until the config fetch fails, at which point the
        // site renders a different palette than the one that was reviewed.
        const drift = [];
        for (const [name, liveColors] of Object.entries(sources.live)) {
            const fb = sources.fallback[name];
            if (!fb) { drift.push(`${name}: present in live config, missing from the JS fallback`); continue; }
            for (const token of [...FOREGROUNDS, ...BACKGROUNDS]) {
                if (liveColors[token] && fb[token] && liveColors[token] !== fb[token]) {
                    drift.push(`${name}.${token}: live ${liveColors[token]} vs fallback ${fb[token]}`);
                }
            }
        }
        expect(drift).toEqual([]);
    });

    test('every theme defines the text and background tokens', () => {
        const incomplete = [];
        for (const [name, colors] of Object.entries(themes)) {
            for (const token of [...FOREGROUNDS, ...BACKGROUNDS]) {
                if (!HEX.test(colors[token] || '')) {
                    incomplete.push(`${name}.${token} = ${colors[token] || '(missing)'}`);
                }
            }
        }
        expect(incomplete).toEqual([]);
    });

    test('every text colour meets WCAG AA against its own backgrounds', () => {
        const failures = [];

        for (const [name, colors] of Object.entries(themes)) {
            for (const fg of FOREGROUNDS) {
                for (const bg of BACKGROUNDS) {
                    if (!HEX.test(colors[fg] || '') || !HEX.test(colors[bg] || '')) continue;
                    const ratio = contrastRatio(colors[fg], colors[bg]);
                    if (ratio < AA_NORMAL_TEXT) {
                        failures.push(
                            `${name}: ${fg} (${colors[fg]}) on ${bg} (${colors[bg]}) ` +
                            `= ${ratio.toFixed(2)}:1`
                        );
                    }
                }
            }
        }

        expect(failures).toEqual([]);
    });

    test('every colour token has a matching -rgb companion with the same value', () => {
        // The -rgb forms exist so stylesheets can compose their own alpha. When
        // the two drift, rgba(var(--color-x-rgb), a) silently paints a different
        // colour than var(--color-x) — which is exactly how the Day theme ended
        // up painting near-black text on the night theme's navy.
        const mismatched = [];

        for (const [name, colors] of Object.entries(themes)) {
            for (const [key, value] of Object.entries(colors)) {
                if (key.endsWith('-rgb') || !HEX.test(value)) continue;
                const rgbKey = `${key}-rgb`;
                if (!(rgbKey in colors)) {
                    mismatched.push(`${name}.${rgbKey} is missing`);
                    continue;
                }
                const expected = channels(value).join(', ');
                if (colors[rgbKey].replace(/\s+/g, ' ').trim() !== expected) {
                    mismatched.push(
                        `${name}.${rgbKey} = "${colors[rgbKey]}" but ${key} = ${value} ` +
                        `which is "${expected}"`
                    );
                }
            }
        }

        expect(mismatched).toEqual([]);
    });
});
