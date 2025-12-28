/**
 * Accessibility Testing Helper Utilities
 * Test Polish Agent 4
 *
 * Provides utility functions for accessibility testing
 */

/**
 * Calculate relative luminance of a color
 * Used for contrast ratio calculations
 */
function getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio between 1 and 21
 */
function getContrastRatio(rgb1, rgb2) {
    const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
function meetsContrastAA(ratio, isLargeText = false) {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
function meetsContrastAAA(ratio, isLargeText = false) {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container) {
    return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
}

/**
 * Check if element is keyboard accessible
 */
function isKeyboardAccessible(element) {
    const tabIndex = element.getAttribute('tabindex');
    return tabIndex !== '-1' && !element.disabled && !element.hasAttribute('aria-hidden');
}

/**
 * Validate heading hierarchy
 * Returns array of violations
 */
function validateHeadingHierarchy(container) {
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const violations = [];

    if (headings.length === 0) {
        return violations;
    }

    // Check for h1
    if (!container.querySelector('h1')) {
        violations.push({
            type: 'missing-h1',
            message: 'Page should have exactly one h1 element'
        });
    }

    // Check for skipped levels
    const levels = headings.map(h => parseInt(h.tagName.charAt(1)));
    for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
            violations.push({
                type: 'skipped-level',
                message: `Heading level skipped from h${levels[i - 1]} to h${levels[i]}`,
                element: headings[i]
            });
        }
    }

    return violations;
}

/**
 * Validate form accessibility
 */
function validateFormAccessibility(form) {
    const violations = [];
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        // Check for label
        const hasLabel =
            form.querySelector(`label[for="${input.id}"]`) ||
            input.closest('label') ||
            input.getAttribute('aria-label') ||
            input.getAttribute('aria-labelledby');

        if (!hasLabel) {
            violations.push({
                type: 'missing-label',
                message: 'Form input missing label',
                element: input
            });
        }

        // Check required fields
        if (input.required && !input.getAttribute('aria-required')) {
            violations.push({
                type: 'missing-aria-required',
                message: 'Required field should have aria-required="true"',
                element: input
            });
        }
    });

    return violations;
}

/**
 * Validate image accessibility
 */
function validateImageAccessibility(container) {
    const violations = [];
    const images = container.querySelectorAll('img');

    images.forEach(img => {
        const hasAlt = img.hasAttribute('alt');
        const isDecorative = img.getAttribute('role') === 'presentation' || img.getAttribute('aria-hidden') === 'true';

        if (!hasAlt) {
            violations.push({
                type: 'missing-alt',
                message: 'Image missing alt attribute',
                element: img
            });
        } else if (!isDecorative && img.alt === '') {
            violations.push({
                type: 'empty-alt',
                message: 'Non-decorative image has empty alt text',
                element: img
            });
        }
    });

    return violations;
}

/**
 * Validate link accessibility
 */
function validateLinkAccessibility(container) {
    const violations = [];
    const links = container.querySelectorAll('a');

    links.forEach(link => {
        const text = link.textContent.trim();
        const ariaLabel = link.getAttribute('aria-label');
        const title = link.getAttribute('title');

        if (!text && !ariaLabel && !title) {
            violations.push({
                type: 'empty-link',
                message: 'Link has no accessible text',
                element: link
            });
        }

        // Check for generic link text
        const genericTexts = ['click here', 'read more', 'link', 'here'];
        if (text && genericTexts.includes(text.toLowerCase()) && !ariaLabel) {
            violations.push({
                type: 'generic-link-text',
                message: `Link uses generic text: "${text}"`,
                element: link
            });
        }
    });

    return violations;
}

/**
 * Validate ARIA usage
 */
function validateARIA(container) {
    const violations = [];

    // Check for aria-expanded without corresponding controls
    const expandables = container.querySelectorAll('[aria-expanded]');
    expandables.forEach(el => {
        const controls = el.getAttribute('aria-controls');
        if (!controls || !document.getElementById(controls)) {
            violations.push({
                type: 'invalid-aria-controls',
                message: 'aria-expanded without valid aria-controls',
                element: el
            });
        }
    });

    // Check for aria-describedby pointing to non-existent elements
    const describedElements = container.querySelectorAll('[aria-describedby]');
    describedElements.forEach(el => {
        const describedBy = el.getAttribute('aria-describedby');
        if (!document.getElementById(describedBy)) {
            violations.push({
                type: 'invalid-aria-describedby',
                message: `aria-describedby points to non-existent element: ${describedBy}`,
                element: el
            });
        }
    });

    return violations;
}

/**
 * Generate accessibility report
 */
function generateAccessibilityReport(container) {
    return {
        headings: validateHeadingHierarchy(container),
        images: validateImageAccessibility(container),
        links: validateLinkAccessibility(container),
        aria: validateARIA(container),
        forms: Array.from(container.querySelectorAll('form'))
            .flatMap(form => validateFormAccessibility(form))
    };
}

/**
 * Simulate focus trap for testing
 */
function createFocusTrap(container) {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return null;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    return {
        activate: () => {
            firstElement.focus();
        },
        handleTab: (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        },
        deactivate: () => {
            // Return focus to original element
        }
    };
}

/**
 * Check if element has visible focus indicator
 */
function hasVisibleFocus(element) {
    const styles = window.getComputedStyle(element);
    return styles.outline !== 'none' && styles.outline !== '0px';
}

module.exports = {
    getLuminance,
    getContrastRatio,
    meetsContrastAA,
    meetsContrastAAA,
    getFocusableElements,
    isKeyboardAccessible,
    validateHeadingHierarchy,
    validateFormAccessibility,
    validateImageAccessibility,
    validateLinkAccessibility,
    validateARIA,
    generateAccessibilityReport,
    createFocusTrap,
    hasVisibleFocus
};
