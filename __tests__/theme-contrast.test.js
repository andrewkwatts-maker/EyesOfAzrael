/**
 * Theme palette contrast guard.
 *
 * js/shader-theme-picker.js is the theme system the site actually loads — the
 * THEMES table there is what paints the page. Eight of its seventeen palettes
 * shipped text below the WCAG AA 4.5:1 minimum against their own backgrounds,
 * including the default `night`, and nothing caught it: the palettes are plain
 * data, and no test read them.
 *
 * Pinning hex values would not have helped. The previous values were stable and
 * wrong. This asserts the property instead, so any future palette edit has to
 * stay readable to pass.
 *
 * Static analysis of the source — no browser, no DOM.
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'js', 'shader-theme-picker.js');

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

describe('Theme palette contrast', () => {
    let themes;

    beforeAll(() => {
        themes = parseThemes(fs.readFileSync(SOURCE, 'utf8'));
    });

    test('the THEMES table is parseable and non-trivial', () => {
        // Guards the parser itself: if the table's shape changes and this stops
        // finding themes, every contrast assertion below would vacuously pass.
        expect(Object.keys(themes).length).toBeGreaterThanOrEqual(10);
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
