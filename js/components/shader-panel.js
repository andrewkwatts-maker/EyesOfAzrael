/**
 * ShaderPanel Web Component
 * Reusable panel component with automatic shader integration
 *
 * Usage:
 * <shader-panel theme="water" type="glass">
 *   <h2>Title</h2>
 *   <p>Content</p>
 * </shader-panel>
 */

class ShaderPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupStyles();
        this.applyAttributes();
    }

    static get observedAttributes() {
        return ['theme', 'type', 'mythology', 'intensity', 'border'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.applyAttributes();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <div class="shader-panel-wrapper">
                <div class="shader-panel-content">
                    <slot></slot>
                </div>
            </div>
        `;
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
            }

            .shader-panel-wrapper {
                position: relative;
                border-radius: var(--panel-radius, 1rem);
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Glass type (default) */
            :host([type="glass"]) .shader-panel-wrapper,
            :host(:not([type])) .shader-panel-wrapper {
                background: rgba(26, 31, 58, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(139, 127, 255, 0.3);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            }

            /* Entity type */
            :host([type="entity"]) .shader-panel-wrapper {
                background: rgba(26, 31, 58, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(139, 127, 255, 0.3);
                border-radius: 1rem;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            }

            /* Detail type */
            :host([type="detail"]) .shader-panel-wrapper {
                max-width: 900px;
                margin: 0 auto;
                background: rgba(26, 31, 58, 0.85);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border: 2px solid rgba(139, 127, 255, 0.4);
                border-radius: 1.5rem;
                box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
            }

            /* Modal type */
            :host([type="modal"]) .shader-panel-wrapper {
                background: rgba(26, 31, 58, 0.92);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 2px solid rgba(139, 127, 255, 0.5);
                box-shadow: 0 16px 64px rgba(0, 0, 0, 0.6);
            }

            /* Gradient overlay */
            .shader-panel-wrapper::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    135deg,
                    rgba(102, 126, 234, 0.05) 0%,
                    rgba(118, 75, 162, 0.05) 100%
                );
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 0;
            }

            :host(:hover) .shader-panel-wrapper::before {
                opacity: 1;
            }

            /* Border enhancement */
            :host([border="true"]) .shader-panel-wrapper {
                border-width: 2px;
                border-color: rgba(139, 127, 255, 0.6);
            }

            :host([border="gradient"]) .shader-panel-wrapper {
                padding: 2px;
                background: linear-gradient(135deg, #667eea, #764ba2);
            }

            :host([border="gradient"]) .shader-panel-content {
                background: rgba(26, 31, 58, 0.95);
                border-radius: calc(var(--panel-radius, 1rem) - 2px);
            }

            /* Content wrapper */
            .shader-panel-content {
                position: relative;
                padding: var(--panel-padding, 1.5rem);
                z-index: 1;
            }

            /* Hover effects */
            :host(:hover) .shader-panel-wrapper {
                transform: translateY(-2px);
                box-shadow:
                    0 12px 48px rgba(102, 126, 234, 0.3),
                    0 0 0 1px rgba(139, 127, 255, 0.2);
            }

            :host([type="detail"]:hover) .shader-panel-wrapper,
            :host([type="modal"]:hover) .shader-panel-wrapper {
                transform: none; /* Don't lift detail/modal panels */
            }

            /* Mythology-specific accent colors */
            :host([mythology="greek"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(255, 215, 0, 0.7);
            }

            :host([mythology="norse"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(100, 149, 237, 0.7);
            }

            :host([mythology="egyptian"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(218, 165, 32, 0.7);
            }

            :host([mythology="hindu"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(255, 99, 71, 0.7);
            }

            :host([mythology="buddhist"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(255, 255, 255, 0.7);
            }

            :host([mythology="christian"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(255, 255, 224, 0.7);
            }

            :host([mythology="celtic"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(34, 139, 34, 0.7);
            }

            :host([mythology="roman"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(220, 20, 60, 0.7);
            }

            :host([mythology="aztec"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(255, 140, 0, 0.7);
            }

            :host([mythology="chinese"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(255, 0, 0, 0.7);
            }

            :host([mythology="persian"]) .shader-panel-wrapper {
                border-left: 4px solid rgba(128, 0, 128, 0.7);
            }

            /* Mobile optimizations */
            @media (max-width: 768px) {
                .shader-panel-content {
                    padding: var(--panel-padding, 1rem);
                }

                :host([type="detail"]) .shader-panel-wrapper {
                    border-radius: 1rem;
                }
            }

            /* Print styles */
            @media print {
                .shader-panel-wrapper {
                    background: white !important;
                    border: 1px solid #ddd !important;
                    box-shadow: none !important;
                }

                .shader-panel-wrapper::before {
                    display: none !important;
                }
            }
        `;

        this.shadowRoot.appendChild(style);
    }

    applyAttributes() {
        // Apply data attributes to wrapper for CSS targeting
        const wrapper = this.shadowRoot.querySelector('.shader-panel-wrapper');
        if (!wrapper) return;

        // Apply custom CSS properties based on attributes
        const intensity = this.getAttribute('intensity');
        if (intensity) {
            const opacity = 0.7 + (parseFloat(intensity) * 0.25);
            wrapper.style.setProperty('background', `rgba(26, 31, 58, ${opacity})`);
        }
    }

    // Public methods
    setTheme(theme) {
        this.setAttribute('theme', theme);
    }

    setMythology(mythology) {
        this.setAttribute('mythology', mythology);
    }

    setType(type) {
        this.setAttribute('type', type);
    }

    setIntensity(intensity) {
        this.setAttribute('intensity', intensity);
    }
}

// Register custom element
if (!customElements.get('shader-panel')) {
    customElements.define('shader-panel', ShaderPanel);
}

/**
 * ShaderPanelHeader Component
 * Header section for shader panels
 */
class ShaderPanelHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const icon = this.getAttribute('icon') || '';
        const title = this.getAttribute('title') || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .panel-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(139, 127, 255, 0.2);
                    margin-bottom: 1.5rem;
                }

                .panel-icon {
                    font-size: 2rem;
                    line-height: 1;
                }

                .panel-title {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                ::slotted(*) {
                    margin: 0;
                }
            </style>
            <div class="panel-header">
                ${icon ? `<span class="panel-icon">${icon}</span>` : ''}
                ${title ? `<h2 class="panel-title">${title}</h2>` : '<slot></slot>'}
            </div>
        `;
    }
}

if (!customElements.get('shader-panel-header')) {
    customElements.define('shader-panel-header', ShaderPanelHeader);
}

/**
 * ShaderPanelSection Component
 * Content section within shader panels
 */
class ShaderPanelSection extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const title = this.getAttribute('title') || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .panel-section {
                    margin: 2rem 0;
                    padding: 1.5rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 0.75rem;
                    border: 1px solid rgba(139, 127, 255, 0.1);
                }

                .section-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0 0 1rem 0;
                    color: #667eea;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .section-title::before {
                    content: '';
                    width: 4px;
                    height: 1.5rem;
                    background: linear-gradient(180deg, #667eea, #764ba2);
                    border-radius: 2px;
                }

                .section-content {
                    line-height: 1.6;
                }
            </style>
            <div class="panel-section">
                ${title ? `<h3 class="section-title">${title}</h3>` : ''}
                <div class="section-content">
                    <slot></slot>
                </div>
            </div>
        `;
    }
}

if (!customElements.get('shader-panel-section')) {
    customElements.define('shader-panel-section', ShaderPanelSection);
}

/**
 * ShaderTag Component
 * Tag/badge component for use in panels
 */
class ShaderTag extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const variant = this.getAttribute('variant') || 'default';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                }

                .tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.75rem;
                    background: rgba(102, 126, 234, 0.2);
                    border: 1px solid rgba(102, 126, 234, 0.4);
                    border-radius: 9999px;
                    font-size: 0.875rem;
                    color: #e5e7eb;
                    transition: all 0.2s ease;
                    cursor: default;
                }

                .tag:hover {
                    background: rgba(102, 126, 234, 0.3);
                    border-color: #667eea;
                    transform: translateY(-1px);
                }

                :host([variant="success"]) .tag {
                    background: rgba(34, 197, 94, 0.2);
                    border-color: rgba(34, 197, 94, 0.4);
                    color: #22c55e;
                }

                :host([variant="warning"]) .tag {
                    background: rgba(245, 158, 11, 0.2);
                    border-color: rgba(245, 158, 11, 0.4);
                    color: #f59e0b;
                }

                :host([variant="danger"]) .tag {
                    background: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.4);
                    color: #ef4444;
                }
            </style>
            <div class="tag">
                <slot></slot>
            </div>
        `;
    }
}

if (!customElements.get('shader-tag')) {
    customElements.define('shader-tag', ShaderTag);
}

/**
 * Utility Functions
 */

// Create a shader panel programmatically
function createShaderPanel(options = {}) {
    const {
        type = 'glass',
        mythology = null,
        theme = null,
        intensity = null,
        border = null,
        content = ''
    } = options;

    const panel = document.createElement('shader-panel');

    if (type) panel.setAttribute('type', type);
    if (mythology) panel.setAttribute('mythology', mythology);
    if (theme) panel.setAttribute('theme', theme);
    if (intensity) panel.setAttribute('intensity', intensity);
    if (border) panel.setAttribute('border', border);

    if (content) {
        panel.innerHTML = content;
    }

    return panel;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ShaderPanel,
        ShaderPanelHeader,
        ShaderPanelSection,
        ShaderTag,
        createShaderPanel
    };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ShaderPanel = ShaderPanel;
    window.ShaderPanelHeader = ShaderPanelHeader;
    window.ShaderPanelSection = ShaderPanelSection;
    window.ShaderTag = ShaderTag;
    window.createShaderPanel = createShaderPanel;
}
