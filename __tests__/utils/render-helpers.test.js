/**
 * Render Helpers Tests
 * Tests for js/utils/render-helpers.js
 */

describe('RenderHelpers', () => {
    let RenderHelpers;

    beforeEach(() => {
        document.body.innerHTML = '';
        // Reset module cache
        jest.resetModules();

        // Need to clear any auto-init timers
        jest.useFakeTimers();

        // Load the module - it attaches to window.RenderHelpers
        require('../../js/utils/render-helpers.js');
        RenderHelpers = window.RenderHelpers;

        jest.runAllTimers();
        jest.useRealTimers();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('escapeHtml', () => {
        test('should escape HTML special characters', () => {
            const result = RenderHelpers.escapeHtml('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
        });

        test('should return empty string for falsy input', () => {
            expect(RenderHelpers.escapeHtml(null)).toBe('');
            expect(RenderHelpers.escapeHtml(undefined)).toBe('');
            expect(RenderHelpers.escapeHtml('')).toBe('');
        });

        test('should pass through safe text', () => {
            expect(RenderHelpers.escapeHtml('Hello World')).toBe('Hello World');
        });
    });

    describe('renderIcon', () => {
        test('should return empty string for falsy icon', () => {
            expect(RenderHelpers.renderIcon(null)).toBe('');
            expect(RenderHelpers.renderIcon('')).toBe('');
        });

        test('should render SVG icons directly', () => {
            const svg = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
            const result = RenderHelpers.renderIcon(svg);
            expect(result).toContain('entity-icon-svg');
            expect(result).toContain('<svg');
        });

        test('should render URL icons as img tags', () => {
            const result = RenderHelpers.renderIcon('https://example.com/icon.png');
            expect(result).toContain('<img');
            expect(result).toContain('loading="lazy"');
        });

        test('should render file path URLs as img tags', () => {
            const result = RenderHelpers.renderIcon('/icons/deity.svg');
            expect(result).toContain('<img');
        });

        test('should render text/emoji icons in spans', () => {
            const result = RenderHelpers.renderIcon('⚡');
            expect(result).toContain('<span');
            expect(result).toContain('entity-icon');
        });

        test('should use custom CSS class', () => {
            const result = RenderHelpers.renderIcon('⚡', 'custom-class');
            expect(result).toContain('custom-class');
        });
    });

    describe('truncateText', () => {
        test('should return empty string for null/undefined', () => {
            expect(RenderHelpers.truncateText(null)).toBe('');
            expect(RenderHelpers.truncateText(undefined)).toBe('');
        });

        test('should not truncate short text', () => {
            expect(RenderHelpers.truncateText('Short text', 200)).toBe('Short text');
        });

        test('should truncate long text with ellipsis', () => {
            const longText = 'This is a very long text that should be truncated at some point because it exceeds the maximum character limit.';
            const result = RenderHelpers.truncateText(longText, 50);
            expect(result.length).toBeLessThanOrEqual(54); // 50 + '...'
            expect(result).toContain('...');
        });

        test('should use custom suffix', () => {
            const longText = 'a '.repeat(200);
            const result = RenderHelpers.truncateText(longText, 50, ' [more]');
            expect(result).toContain('[more]');
        });

        test('should normalize whitespace', () => {
            const result = RenderHelpers.truncateText('  hello   world  ', 200);
            expect(result).toBe('hello world');
        });
    });

    describe('truncateHTML', () => {
        test('should return empty string for null/undefined', () => {
            expect(RenderHelpers.truncateHTML(null)).toBe('');
            expect(RenderHelpers.truncateHTML(undefined)).toBe('');
        });

        test('should not truncate short HTML', () => {
            const html = '<p>Short</p>';
            expect(RenderHelpers.truncateHTML(html, 200)).toBe(html);
        });

        test('should truncate long HTML content', () => {
            const html = '<p>' + 'word '.repeat(100) + '</p>';
            const result = RenderHelpers.truncateHTML(html, 50);
            // Result should be shorter than original
            const temp = document.createElement('div');
            temp.innerHTML = result;
            const textLen = (temp.textContent || '').length;
            expect(textLen).toBeLessThanOrEqual(55); // 50 + suffix
        });
    });

    describe('getExcerpt', () => {
        test('should return empty string for null/undefined', () => {
            expect(RenderHelpers.getExcerpt(null)).toBe('');
            expect(RenderHelpers.getExcerpt(undefined)).toBe('');
        });

        test('should not truncate text under word limit', () => {
            expect(RenderHelpers.getExcerpt('One two three', 10)).toBe('One two three');
        });

        test('should truncate at word boundary', () => {
            const text = 'one two three four five six';
            const result = RenderHelpers.getExcerpt(text, 3);
            expect(result).toBe('one two three...');
        });

        test('should use custom suffix', () => {
            const text = 'one two three four five six';
            const result = RenderHelpers.getExcerpt(text, 2, ' [...]');
            expect(result).toBe('one two [...]');
        });
    });

    describe('isOverflowing', () => {
        test('should return false for null element', () => {
            expect(RenderHelpers.isOverflowing(null)).toBe(false);
        });

        test('should return false for non-overflowing element', () => {
            const el = document.createElement('div');
            // In jsdom scrollWidth/clientWidth are both 0
            expect(RenderHelpers.isOverflowing(el)).toBe(false);
        });
    });

    describe('getFullText', () => {
        test('should return empty string for null element', () => {
            expect(RenderHelpers.getFullText(null)).toBe('');
        });

        test('should return text content', () => {
            const el = document.createElement('div');
            el.textContent = 'Hello World';
            expect(RenderHelpers.getFullText(el)).toBe('Hello World');
        });
    });

    describe('truncateArray', () => {
        test('should handle non-array input', () => {
            const result = RenderHelpers.truncateArray(null);
            expect(result.visible).toEqual([]);
            expect(result.hidden).toEqual([]);
            expect(result.overflow).toBe(0);
        });

        test('should not truncate short arrays', () => {
            const result = RenderHelpers.truncateArray([1, 2, 3], 5);
            expect(result.visible).toEqual([1, 2, 3]);
            expect(result.overflow).toBe(0);
        });

        test('should truncate long arrays', () => {
            const result = RenderHelpers.truncateArray([1, 2, 3, 4, 5, 6, 7], 3);
            expect(result.visible).toEqual([1, 2, 3]);
            expect(result.hidden).toEqual([4, 5, 6, 7]);
            expect(result.overflow).toBe(4);
        });
    });

    describe('createTruncatedList', () => {
        test('should render visible items', () => {
            const result = RenderHelpers.createTruncatedList(['a', 'b', 'c'], 5);
            expect(result).toContain('a');
            expect(result).toContain('b');
            expect(result).toContain('c');
        });

        test('should show overflow indicator', () => {
            const result = RenderHelpers.createTruncatedList(['a', 'b', 'c', 'd', 'e', 'f'], 3);
            expect(result).toContain('+3');
        });
    });

    describe('createExpandableText', () => {
        test('should return empty string for null content', () => {
            expect(RenderHelpers.createExpandableText(null)).toBe('');
            expect(RenderHelpers.createExpandableText('')).toBe('');
        });

        test('should create expandable container', () => {
            const result = RenderHelpers.createExpandableText('Some content', 3);
            expect(result).toContain('expandable-text-container');
            expect(result).toContain('show-more-btn');
            expect(result).toContain('aria-expanded="false"');
        });

        test('should use custom button text', () => {
            const result = RenderHelpers.createExpandableText('Content', 3, {
                showMoreText: 'Read more',
                showLessText: 'Read less'
            });
            expect(result).toContain('Read more');
            expect(result).toContain('Read less');
        });
    });

    describe('toggleExpandableText', () => {
        test('should toggle expanded/collapsed state', () => {
            document.body.innerHTML = `
                <div id="test-content" class="expandable-text collapsed"></div>
                <button id="test-toggle" aria-expanded="false">
                    <span class="show-more-text">More</span>
                    <span class="show-less-text" style="display: none;">Less</span>
                </button>
            `;

            RenderHelpers.toggleExpandableText('test');

            const content = document.getElementById('test-content');
            const toggle = document.getElementById('test-toggle');
            expect(content.classList.contains('expanded')).toBe(true);
            expect(content.classList.contains('collapsed')).toBe(false);
            expect(toggle.getAttribute('aria-expanded')).toBe('true');
        });

        test('should handle missing elements gracefully', () => {
            expect(() => RenderHelpers.toggleExpandableText('nonexistent')).not.toThrow();
        });
    });

    describe('estimateLineCount', () => {
        test('should return 0 for empty text', () => {
            expect(RenderHelpers.estimateLineCount('', 300)).toBe(0);
            expect(RenderHelpers.estimateLineCount(null, 300)).toBe(0);
        });

        test('should return 0 for no container width', () => {
            expect(RenderHelpers.estimateLineCount('Hello', 0)).toBe(0);
        });

        test('should estimate line count', () => {
            // 100 chars, container 160px wide, 16px font, 0.5 ratio = 20 chars/line = 5 lines
            const result = RenderHelpers.estimateLineCount('a'.repeat(100), 160, 16, 0.5);
            expect(result).toBe(5);
        });
    });
});
