/**
 * render-helpers — SVG sanitising, list truncation, tooltips and smart clamping
 *
 * These utilities are shared by every card and detail panel in the app, and one
 * of them is a security boundary: `sanitizeSvg` is what stands between a
 * user-supplied entity icon and `innerHTML`. It was almost entirely untested.
 *
 * The rest are the truncation helpers the grids depend on to keep long entity
 * names and tag lists from breaking layout on a phone.
 */

const helpers = require('../../js/utils/render-helpers.js');

const {
    sanitizeSvg,
    renderIcon,
    truncateArray,
    createTruncatedList,
    createTooltipElement,
    positionTooltip,
    applySmartTruncation,
    estimateLineCount,
    initTruncatedTooltips,
    isOverflowing,
    getFullText,
} = helpers;

describe('sanitizeSvg', () => {
    test('strips inline event handlers', () => {
        const out = sanitizeSvg('<svg onload="alert(1)"><circle onclick=\'steal()\'/></svg>');
        expect(out).not.toContain('onload');
        expect(out).not.toContain('onclick');
        expect(out).toContain('<svg');
    });

    test('defuses a javascript: href rather than leaving it live', () => {
        const out = sanitizeSvg('<svg><a href="javascript:alert(1)">x</a></svg>');
        expect(out).not.toContain('javascript:');
        expect(out).toContain('href="#"');
    });

    test('removes a script element and its contents', () => {
        const out = sanitizeSvg('<svg><script>alert(1)</script><circle/></svg>');
        expect(out).not.toContain('alert(1)');
        expect(out).not.toContain('<script');
        expect(out).toContain('<circle/>');
    });

    test('removes foreignObject, which can smuggle arbitrary HTML', () => {
        const out = sanitizeSvg('<svg><foreignObject><iframe src="evil"></iframe></foreignObject></svg>');
        expect(out).not.toContain('iframe');
        expect(out).not.toContain('foreignObject');
    });

    test('is case-insensitive about the tags and attributes it strips', () => {
        const out = sanitizeSvg('<svg ONLOAD="x"><SCRIPT>y</SCRIPT></svg>');
        expect(out.toLowerCase()).not.toContain('onload');
        expect(out.toLowerCase()).not.toContain('<script');
    });

    test('returns empty for nothing', () => {
        expect(sanitizeSvg('')).toBe('');
        expect(sanitizeSvg(null)).toBe('');
        expect(sanitizeSvg(undefined)).toBe('');
    });

    test('leaves a clean svg intact', () => {
        const svg = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
        expect(sanitizeSvg(svg)).toBe(svg);
    });
});

describe('renderIcon', () => {
    test('sanitises an svg icon on the way through', () => {
        const out = renderIcon('<svg onload="alert(1)"><circle/></svg>');
        expect(out).not.toContain('onload');
    });

    test('renders an emoji icon as text', () => {
        expect(renderIcon('⚡')).toContain('⚡');
    });

    test('renders a url icon as an image', () => {
        expect(renderIcon('https://example.com/i.png')).toContain('<img');
    });

    test('handles a missing icon without throwing', () => {
        expect(() => renderIcon(null)).not.toThrow();
        expect(() => renderIcon(undefined)).not.toThrow();
    });
});

describe('truncateArray', () => {
    test('passes a short array through with no overflow', () => {
        expect(truncateArray([1, 2, 3], 5)).toEqual({ visible: [1, 2, 3], hidden: [], overflow: 0 });
    });

    test('splits a long array and counts the remainder', () => {
        const { visible, hidden, overflow } = truncateArray([1, 2, 3, 4, 5, 6, 7], 4);
        expect(visible).toEqual([1, 2, 3, 4]);
        expect(hidden).toEqual([5, 6, 7]);
        expect(overflow).toBe(3);
    });

    test('treats exactly-at-the-limit as no overflow', () => {
        expect(truncateArray([1, 2, 3], 3).overflow).toBe(0);
    });

    test('returns an empty result for a non-array rather than throwing', () => {
        expect(truncateArray(null)).toEqual({ visible: [], hidden: [], overflow: 0 });
        expect(truncateArray('nope')).toEqual({ visible: [], hidden: [], overflow: 0 });
    });
});

describe('createTruncatedList', () => {
    test('renders items and an overflow badge', () => {
        const html = createTruncatedList(['a', 'b', 'c', 'd', 'e', 'f'], 4);
        expect(html).toContain('>a<');
        expect(html).toContain('+2');
        expect(html).toContain('tag-overflow');
    });

    test('omits the badge when nothing overflows', () => {
        expect(createTruncatedList(['a', 'b'], 5)).not.toContain('tag-overflow');
    });

    test('escapes item text', () => {
        const html = createTruncatedList(['<img src=x onerror=alert(1)>'], 5);
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    test('honours a custom item class and renderer', () => {
        const html = createTruncatedList(['a'], 5, {
            itemClass: 'chip',
            renderItem: item => `<b>${item}</b>`,
        });
        expect(html).toBe('<b>a</b>');
    });
});

describe('estimateLineCount', () => {
    test('estimates from container width and font size', () => {
        // 400px wide at 16px font, 0.5 ratio → 50 chars per line.
        expect(estimateLineCount('x'.repeat(100), 400)).toBe(2);
        expect(estimateLineCount('x'.repeat(50), 400)).toBe(1);
    });

    test('returns zero when it has nothing to measure', () => {
        expect(estimateLineCount('', 400)).toBe(0);
        expect(estimateLineCount('text', 0)).toBe(0);
        expect(estimateLineCount(null, 400)).toBe(0);
    });

    test('a narrower container yields more lines', () => {
        const text = 'y'.repeat(200);
        expect(estimateLineCount(text, 200)).toBeGreaterThan(estimateLineCount(text, 800));
    });
});

describe('applySmartTruncation', () => {
    test('clamps only the elements past the character threshold', () => {
        const root = document.createElement('div');
        root.innerHTML = `<p id="long">${'x'.repeat(200)}</p><p id="short">short</p>`;

        applySmartTruncation(root, { charThreshold: 150, lineThreshold: 3 });

        expect(root.querySelector('#long').classList.contains('line-clamp-3')).toBe(true);
        expect(root.querySelector('#short').classList.contains('line-clamp-3')).toBe(false);
    });

    test('stashes the full text so a tooltip can recover it', () => {
        const root = document.createElement('div');
        root.innerHTML = `<p>${'x'.repeat(200)}</p>`;

        applySmartTruncation(root, { charThreshold: 10 });

        expect(root.querySelector('p').dataset.fullText).toHaveLength(200);
    });

    test('honours a custom selector and threshold', () => {
        const root = document.createElement('div');
        root.innerHTML = '<span class="bio">abcdefghij</span>';

        applySmartTruncation(root, { charThreshold: 5, lineThreshold: 2, selector: '.bio' });

        expect(root.querySelector('.bio').classList.contains('line-clamp-2')).toBe(true);
    });
});

describe('tooltips', () => {
    afterEach(() => { document.body.innerHTML = ''; });

    test('createTooltipElement produces a positioned tooltip carrying the text', () => {
        const tip = createTooltipElement('Full entity name');
        expect(tip.textContent).toBe('Full entity name');
        expect(tip.className).toContain('tooltip');
    });

    test('positionTooltip flips below the target when there is no room above', () => {
        const target = document.createElement('div');
        const tip = document.createElement('div');
        document.body.append(target, tip);

        // jsdom reports zero rects, so top lands under the 8px margin and the
        // "show below instead" branch is the one taken.
        positionTooltip(tip, target);

        expect(tip.style.position).toBe('fixed');
        expect(tip.classList.contains('tooltip-bottom')).toBe(true);
        expect(tip.style.zIndex).toBe('10000');
    });

    test('initTruncatedTooltips marks each element once', () => {
        document.body.innerHTML = '<p class="truncate">a</p><p class="truncate">b</p>';

        initTruncatedTooltips();
        initTruncatedTooltips();   // second pass must not re-initialise

        const marked = document.querySelectorAll('[data-tooltip-init="true"]');
        expect(marked).toHaveLength(2);
    });

    test('initTruncatedTooltips accepts a custom selector', () => {
        document.body.innerHTML = '<p class="clip">a</p>';
        initTruncatedTooltips('.clip');
        expect(document.querySelector('.clip').dataset.tooltipInit).toBe('true');
    });
});

describe('overflow detection', () => {
    test('isOverflowing is false for an element that fits', () => {
        // jsdom reports every dimension as 0, so nothing overflows — the value
        // here is that the guard clauses do not throw on a detached node.
        const el = document.createElement('div');
        expect(isOverflowing(el)).toBe(false);
    });

    test('isOverflowing tolerates a missing element', () => {
        expect(isOverflowing(null)).toBe(false);
        expect(isOverflowing(undefined)).toBe(false);
    });

    test('getFullText reads the element text, which clamping does not shorten', () => {
        // Truncation here is CSS (line-clamp), so the DOM still holds the whole
        // string — which is why the tooltip can read it back off the element
        // rather than needing the `data-full-text` copy applySmartTruncation
        // leaves behind.
        const el = document.createElement('p');
        el.textContent = 'the whole thing';
        el.dataset.fullText = 'the whole thing';

        expect(getFullText(el)).toBe('the whole thing');
    });

    test('getFullText falls back to the element text', () => {
        const el = document.createElement('p');
        el.textContent = 'visible text';
        expect(getFullText(el)).toBe('visible text');
    });
});
