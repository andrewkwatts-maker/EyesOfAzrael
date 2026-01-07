/**
 * Render Helpers - Shared utility functions for icon rendering and text truncation
 *
 * @fileoverview Provides common rendering utilities used across components
 * for consistent icon display, text handling, and truncation.
 */

/* ============================================
   ICON RENDERING
   ============================================ */

/**
 * Render icon based on type (inline SVG, URL, or emoji/text)
 * @param {string} icon - The icon value
 * @param {string} [cssClass='entity-icon'] - CSS class for the wrapper
 * @returns {string} HTML string
 */
function renderIcon(icon, cssClass = 'entity-icon') {
    if (!icon) return '';

    const trimmed = String(icon).trim();

    // Inline SVG - render directly without escaping
    if (trimmed.toLowerCase().startsWith('<svg')) {
        return `<span class="${cssClass}-svg" aria-hidden="true">${icon}</span>`;
    }

    // URL - use img tag
    const isUrl = trimmed.startsWith('http://') ||
                  trimmed.startsWith('https://') ||
                  trimmed.startsWith('/') ||
                  trimmed.startsWith('./') ||
                  /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(trimmed);

    if (isUrl) {
        return `<img src="${escapeHtml(trimmed)}" alt="" class="${cssClass}" loading="lazy">`;
    }

    // Text/emoji - escape and render
    return `<span class="${cssClass}">${escapeHtml(icon)}</span>`;
}

/* ============================================
   HTML ESCAPING
   ============================================ */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ============================================
   TEXT TRUNCATION UTILITIES
   ============================================ */

/**
 * Truncate text to max characters with customizable suffix
 * @param {string} text - Text to truncate
 * @param {number} maxChars - Maximum characters (default: 200)
 * @param {string} suffix - Suffix to append when truncated (default: '...')
 * @returns {string} Truncated text
 */
function truncateText(text, maxChars = 200, suffix = '...') {
    if (!text || typeof text !== 'string') return '';

    // Normalize whitespace
    const clean = text.replace(/\s+/g, ' ').trim();

    if (clean.length <= maxChars) return clean;

    // Find a good break point (word boundary)
    let truncated = clean.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');

    // If we found a space within the last 20% of the string, break there
    if (lastSpace > maxChars * 0.8) {
        truncated = truncated.substring(0, lastSpace);
    }

    return truncated.trim() + suffix;
}

/**
 * Truncate HTML content safely without breaking tags
 * @param {string} html - HTML content to truncate
 * @param {number} maxChars - Maximum visible characters (default: 200)
 * @param {string} suffix - Suffix to append (default: '...')
 * @returns {string} Safely truncated HTML
 */
function truncateHTML(html, maxChars = 200, suffix = '...') {
    if (!html || typeof html !== 'string') return '';

    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Get text content length
    const textContent = temp.textContent || temp.innerText || '';

    if (textContent.length <= maxChars) {
        return html;
    }

    // Traverse and truncate
    let charCount = 0;
    const truncateNode = (node) => {
        if (charCount >= maxChars) {
            node.remove();
            return;
        }

        if (node.nodeType === Node.TEXT_NODE) {
            const remaining = maxChars - charCount;
            if (node.textContent.length > remaining) {
                // Find word boundary
                let truncated = node.textContent.substring(0, remaining);
                const lastSpace = truncated.lastIndexOf(' ');
                if (lastSpace > remaining * 0.7) {
                    truncated = truncated.substring(0, lastSpace);
                }
                node.textContent = truncated.trim() + suffix;
                charCount = maxChars;
            } else {
                charCount += node.textContent.length;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Clone children to avoid modification during iteration
            const children = Array.from(node.childNodes);
            children.forEach(child => truncateNode(child));
        }
    };

    Array.from(temp.childNodes).forEach(child => truncateNode(child));

    return temp.innerHTML;
}

/**
 * Get an excerpt from text with word boundaries
 * @param {string} text - Source text
 * @param {number} maxWords - Maximum number of words (default: 30)
 * @param {string} suffix - Suffix for truncated text (default: '...')
 * @returns {string} Text excerpt
 */
function getExcerpt(text, maxWords = 30, suffix = '...') {
    if (!text || typeof text !== 'string') return '';

    // Normalize whitespace and split into words
    const clean = text.replace(/\s+/g, ' ').trim();
    const words = clean.split(' ').filter(word => word.length > 0);

    if (words.length <= maxWords) {
        return clean;
    }

    return words.slice(0, maxWords).join(' ') + suffix;
}

/**
 * Check if an element's content is overflowing (truncated)
 * @param {HTMLElement} element - DOM element to check
 * @returns {boolean} True if content is overflowing
 */
function isOverflowing(element) {
    if (!element) return false;

    // Check horizontal overflow
    const horizontalOverflow = element.scrollWidth > element.clientWidth;

    // Check vertical overflow
    const verticalOverflow = element.scrollHeight > element.clientHeight;

    return horizontalOverflow || verticalOverflow;
}

/**
 * Get the visible text from an element (accounting for CSS truncation)
 * @param {HTMLElement} element - DOM element
 * @returns {string} Full text content
 */
function getFullText(element) {
    if (!element) return '';
    return element.textContent || element.innerText || '';
}

/* ============================================
   EXPANDABLE TEXT COMPONENT
   ============================================ */

/**
 * Create an expandable text component with show more/less toggle
 * @param {string} content - Text content to display
 * @param {number} maxLines - Maximum lines before truncation (default: 3)
 * @param {Object} options - Configuration options
 * @param {string} options.showMoreText - "Show more" button text
 * @param {string} options.showLessText - "Show less" button text
 * @param {string} options.className - Additional CSS class
 * @returns {string} HTML string for expandable text component
 */
function createExpandableText(content, maxLines = 3, options = {}) {
    if (!content || typeof content !== 'string') return '';

    const {
        showMoreText = 'Show more',
        showLessText = 'Show less',
        className = ''
    } = options;

    // Generate unique ID for this instance
    const uniqueId = 'expandable-' + Math.random().toString(36).substring(2, 9);

    // Escape content for safe HTML rendering
    const escapedContent = escapeHtml(content);

    // Calculate approximate line height (assuming ~1.5em per line)
    const maxHeight = maxLines * 1.5;

    return `
        <div class="expandable-text-container ${className}" data-expandable-id="${uniqueId}">
            <div class="expandable-text collapsed"
                 id="${uniqueId}-content"
                 style="--max-lines: ${maxLines}; --max-height: ${maxHeight}em;">
                ${escapedContent}
            </div>
            <button class="show-more-btn"
                    id="${uniqueId}-toggle"
                    type="button"
                    aria-expanded="false"
                    aria-controls="${uniqueId}-content"
                    onclick="window.RenderHelpers.toggleExpandableText('${uniqueId}')">
                <span class="show-more-text">${showMoreText}</span>
                <span class="show-less-text" style="display: none;">${showLessText}</span>
                <svg class="expand-icon" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `;
}

/**
 * Toggle expandable text state
 * @param {string} uniqueId - The unique ID of the expandable text component
 */
function toggleExpandableText(uniqueId) {
    const content = document.getElementById(`${uniqueId}-content`);
    const toggle = document.getElementById(`${uniqueId}-toggle`);

    if (!content || !toggle) return;

    const isExpanded = content.classList.contains('expanded');

    if (isExpanded) {
        // Collapse
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelector('.show-more-text').style.display = '';
        toggle.querySelector('.show-less-text').style.display = 'none';
    } else {
        // Expand
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.querySelector('.show-more-text').style.display = 'none';
        toggle.querySelector('.show-less-text').style.display = '';
    }
}

/**
 * Initialize expandable text components - hide toggle if content doesn't overflow
 * Call this after DOM is ready or after dynamically adding expandable text
 */
function initExpandableText() {
    const containers = document.querySelectorAll('.expandable-text-container');

    containers.forEach(container => {
        const content = container.querySelector('.expandable-text');
        const toggle = container.querySelector('.show-more-btn');

        if (!content || !toggle) return;

        // Check if content actually overflows
        const isOverflowingContent = content.scrollHeight > content.clientHeight;

        // Hide toggle if content fits
        toggle.style.display = isOverflowingContent ? '' : 'none';
    });
}

/* ============================================
   ARRAY TRUNCATION
   ============================================ */

/**
 * Truncate an array of items for display
 * @param {Array} items - Array of items to truncate
 * @param {number} maxVisible - Maximum items to show (default: 5)
 * @returns {Object} { visible: Array, hidden: Array, overflow: number }
 */
function truncateArray(items, maxVisible = 5) {
    if (!Array.isArray(items)) {
        return { visible: [], hidden: [], overflow: 0 };
    }

    if (items.length <= maxVisible) {
        return {
            visible: items,
            hidden: [],
            overflow: 0
        };
    }

    return {
        visible: items.slice(0, maxVisible),
        hidden: items.slice(maxVisible),
        overflow: items.length - maxVisible
    };
}

/**
 * Create HTML for a truncated list with overflow indicator
 * @param {Array<string>} items - Array of items to display
 * @param {number} maxVisible - Maximum visible items (default: 5)
 * @param {Object} options - Configuration options
 * @param {string} options.itemClass - CSS class for each item
 * @param {string} options.overflowClass - CSS class for overflow indicator
 * @param {Function} options.renderItem - Custom render function for items
 * @returns {string} HTML string
 */
function createTruncatedList(items, maxVisible = 5, options = {}) {
    const {
        itemClass = 'tag',
        overflowClass = 'tag-overflow',
        renderItem = (item) => `<span class="${itemClass}">${escapeHtml(String(item))}</span>`
    } = options;

    const { visible, overflow } = truncateArray(items, maxVisible);

    let html = visible.map(renderItem).join('');

    if (overflow > 0) {
        html += `<span class="${overflowClass}" title="${overflow} more items">+${overflow}</span>`;
    }

    return html;
}

/* ============================================
   TOOLTIP FOR TRUNCATED TEXT
   ============================================ */

/**
 * Initialize tooltips for truncated text elements
 * Shows full text on hover if content is truncated
 * @param {string} selector - CSS selector for elements to watch (default: '.truncate, [class*="line-clamp"]')
 */
function initTruncatedTooltips(selector = '.truncate, [class*="line-clamp"]') {
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
        // Skip if already initialized
        if (element.dataset.tooltipInit) return;
        element.dataset.tooltipInit = 'true';

        let tooltipTimeout;
        let tooltip;

        element.addEventListener('mouseenter', () => {
            // Only show tooltip if content is actually truncated
            if (!isOverflowing(element)) return;

            const fullText = getFullText(element);
            if (!fullText) return;

            // Delay before showing tooltip
            tooltipTimeout = setTimeout(() => {
                tooltip = createTooltipElement(fullText, element);
                document.body.appendChild(tooltip);

                // Position tooltip
                positionTooltip(tooltip, element);

                // Show with animation
                requestAnimationFrame(() => {
                    tooltip.classList.add('visible');
                });
            }, 300);
        });

        element.addEventListener('mouseleave', () => {
            clearTimeout(tooltipTimeout);
            if (tooltip) {
                tooltip.classList.remove('visible');
                setTimeout(() => {
                    tooltip.remove();
                    tooltip = null;
                }, 200);
            }
        });
    });
}

/**
 * Create a tooltip DOM element
 * @param {string} text - Tooltip text content
 * @param {HTMLElement} target - Target element
 * @returns {HTMLElement} Tooltip element
 */
function createTooltipElement(text, target) {
    const tooltip = document.createElement('div');
    tooltip.className = 'truncate-tooltip';
    tooltip.textContent = text;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.style.maxWidth = '300px';
    return tooltip;
}

/**
 * Position a tooltip relative to its target element
 * @param {HTMLElement} tooltip - Tooltip element
 * @param {HTMLElement} target - Target element
 */
function positionTooltip(tooltip, target) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Default position: above the target, centered
    let top = targetRect.top - tooltipRect.height - 8;
    let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

    // Adjust if tooltip goes off screen
    if (top < 8) {
        // Show below instead
        top = targetRect.bottom + 8;
        tooltip.classList.add('tooltip-bottom');
    }

    if (left < 8) {
        left = 8;
    } else if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
    }

    tooltip.style.position = 'fixed';
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.zIndex = '10000';
}

/* ============================================
   SMART TRUNCATION DETECTION
   ============================================ */

/**
 * Add truncation class to elements that need it based on content length
 * @param {HTMLElement} element - Container element to process
 * @param {Object} options - Configuration
 * @param {number} options.charThreshold - Character threshold for truncation
 * @param {number} options.lineThreshold - Line count threshold
 */
function applySmartTruncation(element, options = {}) {
    const {
        charThreshold = 150,
        lineThreshold = 3,
        selector = 'p, .description, .content'
    } = options;

    const elements = element.querySelectorAll(selector);

    elements.forEach(el => {
        const text = el.textContent || '';

        if (text.length > charThreshold) {
            el.classList.add(`line-clamp-${lineThreshold}`);
            el.dataset.fullText = text;
        }
    });
}

/* ============================================
   UTILITY: LINE COUNT ESTIMATION
   ============================================ */

/**
 * Estimate the number of lines text will occupy
 * @param {string} text - Text to measure
 * @param {number} containerWidth - Container width in pixels
 * @param {number} fontSize - Font size in pixels (default: 16)
 * @param {number} avgCharWidth - Average character width ratio (default: 0.5)
 * @returns {number} Estimated line count
 */
function estimateLineCount(text, containerWidth, fontSize = 16, avgCharWidth = 0.5) {
    if (!text || !containerWidth) return 0;

    const charsPerLine = Math.floor(containerWidth / (fontSize * avgCharWidth));
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;

    // Rough estimation accounting for word wrapping
    return Math.ceil(charCount / charsPerLine);
}

/* ============================================
   INITIALIZATION
   ============================================ */

/**
 * Initialize all render helper features
 * Call this when DOM is ready or after dynamic content load
 */
function initRenderHelpers() {
    initExpandableText();
    initTruncatedTooltips();
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRenderHelpers);
} else {
    // DOM already ready, initialize with slight delay for dynamic content
    setTimeout(initRenderHelpers, 100);
}

/* ============================================
   EXPORT TO WINDOW
   ============================================ */

// Export all utilities to window for use across components
window.RenderHelpers = {
    // Icon rendering
    renderIcon,
    escapeHtml,

    // Text truncation
    truncateText,
    truncateHTML,
    getExcerpt,
    isOverflowing,
    getFullText,

    // Expandable text
    createExpandableText,
    toggleExpandableText,
    initExpandableText,

    // Array truncation
    truncateArray,
    createTruncatedList,

    // Tooltips
    initTruncatedTooltips,
    createTooltipElement,
    positionTooltip,

    // Smart truncation
    applySmartTruncation,
    estimateLineCount,

    // Initialization
    initRenderHelpers
};
