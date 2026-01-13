/**
 * PDF Download Service
 * Generates PDF exports of entity pages using browser print functionality
 *
 * Usage:
 *   PdfDownloadService.init();
 *   PdfDownloadService.downloadCurrentPage();
 */

const PdfDownloadService = {
    _button: null,
    _initialized: false,

    /**
     * Initialize the PDF download service
     */
    init() {
        if (this._initialized) return;

        this._button = document.getElementById('pdfDownloadBtn');
        if (!this._button) {
            console.warn('[PDF Service] Download button not found');
            return;
        }

        this._button.addEventListener('click', () => this.downloadCurrentPage());

        // Listen for route changes to show/hide button
        window.addEventListener('hashchange', () => this._updateButtonVisibility());
        this._updateButtonVisibility();

        this._initialized = true;
        console.log('[PDF Service] Initialized');
    },

    /**
     * Update button visibility based on current route
     * Shows on entity detail pages, hides elsewhere
     */
    _updateButtonVisibility() {
        const hash = window.location.hash;
        const isEntityPage = this._isEntityPage(hash);

        if (this._button) {
            this._button.style.display = isEntityPage ? 'flex' : 'none';
        }
    },

    /**
     * Check if current page is an entity detail page
     * @param {string} hash - Current URL hash
     * @returns {boolean}
     */
    _isEntityPage(hash) {
        // Match entity routes like #/mythology/greek/deities/zeus
        // or #/entity/deities/greek/zeus
        const entityPatterns = [
            /^#\/mythology\/[^\/]+\/[^\/]+\/[^\/]+/,
            /^#\/entity\/[^\/]+\/[^\/]+\/[^\/]+/,
            /^#\/browse\/[^\/]+\/[^\/]+/  // Also match browse detail pages
        ];

        return entityPatterns.some(pattern => pattern.test(hash));
    },

    /**
     * Download the current page as PDF
     */
    async downloadCurrentPage() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('[PDF Service] Main content not found');
            return;
        }

        // Get page title for filename
        const titleEl = mainContent.querySelector('h1, .entity-name, .entity-title');
        const title = titleEl?.textContent?.trim() || 'export';
        const filename = this._sanitizeFilename(title);

        // Show loading state
        this._button.disabled = true;
        this._button.classList.add('loading');

        try {
            await this._generatePdf(filename);
        } catch (error) {
            console.error('[PDF Service] Export failed:', error);
            this._showError('PDF export failed. Please try again.');
        } finally {
            this._button.disabled = false;
            this._button.classList.remove('loading');
        }
    },

    /**
     * Generate PDF using browser print with custom styles
     * @param {string} filename - Output filename (without extension)
     */
    async _generatePdf(filename) {
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');

        if (!printWindow) {
            throw new Error('Popup blocked. Please allow popups to download PDFs.');
        }

        // Get main content
        const mainContent = document.getElementById('main-content');
        const content = mainContent.innerHTML;

        // Get computed styles for the current theme
        const computedStyle = getComputedStyle(document.documentElement);
        const bgColor = computedStyle.getPropertyValue('--bg-primary') || '#ffffff';
        const textColor = computedStyle.getPropertyValue('--text-primary') || '#000000';

        // Build print document
        const printContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${this._escapeHtml(filename)} - Eyes of Azrael</title>
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #1a1a2e;
            background: #ffffff;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }

        /* Typography */
        h1 {
            font-size: 28px;
            margin-bottom: 16px;
            color: #1a1a2e;
            border-bottom: 2px solid #8b7fff;
            padding-bottom: 8px;
        }

        h2 {
            font-size: 20px;
            margin: 24px 0 12px;
            color: #2d3436;
        }

        h3 {
            font-size: 16px;
            margin: 16px 0 8px;
            color: #636e72;
        }

        p {
            margin-bottom: 12px;
        }

        /* Hide interactive elements */
        button, .btn, nav, .header, .footer, .skeleton,
        .loading, .spinner, .actions, [aria-hidden="true"],
        .pdf-download-btn, .sign-in, .sign-out, .user-info,
        .mobile-back-btn, .theme-toggle, .search-box,
        .edit-btn, .delete-btn, .share-btn {
            display: none !important;
        }

        /* Cards and sections */
        .entity-card, .card, .section {
            background: #f8f9fa;
            padding: 16px;
            margin: 12px 0;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }

        /* Lists */
        ul, ol {
            padding-left: 24px;
            margin-bottom: 12px;
        }

        li {
            margin-bottom: 4px;
        }

        /* Tags and chips */
        .tag, .chip, .domain-tag, .attribute-tag {
            display: inline-block;
            background: #e8e8ff;
            color: #5a5a8b;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin: 2px;
        }

        /* Images */
        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
        }

        /* Links */
        a {
            color: #6c5ce7;
            text-decoration: none;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
        }

        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }

        th {
            background: #f0f0f0;
            font-weight: 600;
        }

        /* Print-specific */
        @media print {
            body {
                padding: 20px;
            }

            .page-break {
                page-break-before: always;
            }
        }

        /* Footer */
        .pdf-footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #636e72;
            text-align: center;
        }
    </style>
</head>
<body>
    ${content}
    <div class="pdf-footer">
        <p>Exported from Eyes of Azrael - ${new Date().toLocaleDateString()}</p>
        <p>https://eyesofazrael.com${window.location.hash}</p>
    </div>
    <script>
        // Auto-print and close
        window.onload = function() {
            setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                    window.close();
                };
            }, 500);
        };
    </script>
</body>
</html>`;

        printWindow.document.write(printContent);
        printWindow.document.close();
    },

    /**
     * Sanitize filename for download
     * @param {string} name - Original name
     * @returns {string} Sanitized filename
     */
    _sanitizeFilename(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50) || 'export';
    },

    /**
     * Escape HTML for safe insertion
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    _showError(message) {
        // Use toast if available, otherwise alert
        if (window.ToastNotification) {
            window.ToastNotification.show(message, 'error');
        } else {
            alert(message);
        }
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PdfDownloadService;
}

// Export to window and auto-initialize
window.PdfDownloadService = PdfDownloadService;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PdfDownloadService.init());
} else {
    PdfDownloadService.init();
}
