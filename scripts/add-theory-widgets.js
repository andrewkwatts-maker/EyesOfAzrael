/**
 * Add Theory Widgets to All Pages
 *
 * This script automatically adds theory widgets and auth system to all mythology pages
 *
 * Usage: node scripts/add-theory-widgets.js [--dry-run] [--verbose]
 */

const fs = require('fs');
const path = require('path');

class TheoryWidgetInstaller {
    constructor(options = {}) {
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
        this.stats = {
            scanned: 0,
            modified: 0,
            skipped: 0,
            errors: 0
        };
    }

    /**
     * Main installation function
     */
    async install() {
        console.log('🚀 Starting theory widget installation...\n');

        const directories = [
            'mythos',
            'spiritual-items',
            'spiritual-places',
            'magic',
            'archetypes'
        ];

        for (const dir of directories) {
            await this.processDirectory(dir);
        }

        this.printSummary();
    }

    /**
     * Process a directory recursively
     */
    async processDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            if (this.verbose) console.log(`⚠️  Directory not found: ${dirPath}`);
            return;
        }

        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                await this.processDirectory(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                await this.processFile(fullPath);
            }
        }
    }

    /**
     * Process a single HTML file
     */
    async processFile(filePath) {
        this.stats.scanned++;

        try {
            let content = fs.readFileSync(filePath, 'utf8');

            // Skip if already has theory widget
            if (content.includes('data-theory-widget') || content.includes('user-auth.js')) {
                if (this.verbose) console.log(`⏭️  Skipped (already has widget): ${filePath}`);
                this.stats.skipped++;
                return;
            }

            // Skip index pages (they don't need individual theory widgets)
            if (filePath.endsWith('index.html') && !filePath.includes('kabbalah/index.html')) {
                if (this.verbose) console.log(`⏭️  Skipped (index page): ${filePath}`);
                this.stats.skipped++;
                return;
            }

            // Extract page information
            const pageInfo = this.extractPageInfo(filePath, content);

            // Add scripts to head
            content = this.addScriptsToHead(content, filePath);

            // Add auth modal before </body>
            content = this.addAuthModal(content);

            // Add theory widget before footer or at end of main content
            content = this.addTheoryWidget(content, pageInfo);

            if (!this.dryRun) {
                fs.writeFileSync(filePath, content, 'utf8');
            }

            console.log(`✅ Modified: ${filePath}`);
            this.stats.modified++;

        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
            this.stats.errors++;
        }
    }

    /**
     * Extract page information for theory widget
     */
    extractPageInfo(filePath, content) {
        // Get page ID from file path
        const pageId = filePath
            .replace(/\\/g, '/')
            .replace('.html', '')
            .replace(/^(mythos|spiritual-items|spiritual-places|magic|archetypes)\//, '');

        // Try to extract title from page
        const titleMatch = content.match(/<title>(.*?)<\/title>/);
        let pageTitle = titleMatch ? titleMatch[1] : 'This Page';

        // Clean up title
        pageTitle = pageTitle
            .replace(' - Eyes of Azrael', '')
            .replace(' | Eyes of Azrael', '')
            .trim();

        // Try to get H1 if title is not descriptive
        if (!titleMatch || pageTitle.includes('Eyes of Azrael')) {
            const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/);
            if (h1Match) {
                pageTitle = h1Match[1].replace(/<[^>]*>/g, '').trim();
            }
        }

        return { pageId, pageTitle };
    }

    /**
     * Add scripts to <head>
     */
    addScriptsToHead(content, filePath) {
        // Calculate relative path to root
        const depth = (filePath.match(/[\\\/]/g) || []).length;
        const rootPath = '../'.repeat(depth);

        const scripts = `
    <!-- User Auth & Theory System -->
    <link rel="stylesheet" href="${rootPath}css/user-auth.css">
    <script defer src="${rootPath}js/user-auth.js"></script>
    <script defer src="${rootPath}js/user-theories.js"></script>
    <script defer src="${rootPath}js/components/theory-widget.js"></script>
`;

        // Add before </head>
        if (content.includes('</head>')) {
            return content.replace('</head>', scripts + '</head>');
        }

        return content;
    }

    /**
     * Add auth modal before </body>
     */
    addAuthModal(content) {
        const authModal = `
    <!-- Authentication System (Auto-added by script) -->
    <div id="auth-modal" class="auth-modal">
        <div class="auth-modal-content">
            <button class="auth-modal-close" onclick="window.userAuth?.hideAuthModal()">&times;</button>
            <h2 id="auth-modal-title" class="auth-modal-title">Login to Your Account</h2>
            <div id="auth-message" class="auth-message"></div>

            <form id="login-form" class="auth-form" onsubmit="handleLogin(event)">
                <div class="auth-form-group">
                    <label for="login-username">Username</label>
                    <input type="text" id="login-username" name="username" required autocomplete="username">
                </div>
                <div class="auth-form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" name="password" required autocomplete="current-password">
                </div>
                <button type="submit" class="auth-submit-btn">Login</button>
                <div class="auth-switch">
                    Don't have an account?
                    <a class="auth-switch-link" onclick="window.userAuth?.switchAuthMode('signup')">Sign up</a>
                </div>
            </form>

            <form id="signup-form" class="auth-form" style="display: none;" onsubmit="handleSignup(event)">
                <div class="auth-form-group">
                    <label for="signup-username">Username</label>
                    <input type="text" id="signup-username" name="username" required minlength="3" autocomplete="username">
                </div>
                <div class="auth-form-group">
                    <label for="signup-email">Email</label>
                    <input type="email" id="signup-email" name="email" required autocomplete="email">
                </div>
                <div class="auth-form-group">
                    <label for="signup-password">Password</label>
                    <input type="password" id="signup-password" name="password" required minlength="6" autocomplete="new-password">
                </div>
                <button type="submit" class="auth-submit-btn">Create Account</button>
                <div class="auth-switch">
                    Already have an account?
                    <a class="auth-switch-link" onclick="window.userAuth?.switchAuthMode('login')">Login</a>
                </div>
            </form>
        </div>
    </div>

    <div id="user-nav" style="position: fixed; top: 1rem; right: 1rem; z-index: 1000;">
        <div data-auth-show="loggedOut" style="display: flex; gap: 0.5rem;">
            <button class="auth-submit-btn" onclick="window.userAuth?.showLoginModal()" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Login</button>
            <button class="auth-submit-btn" onclick="window.userAuth?.showSignupModal()" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: linear-gradient(135deg, #22c55e, #16a34a);">Sign Up</button>
        </div>
        <div data-auth-show="loggedIn" style="display: none;">
            <div class="user-display" onclick="toggleUserDropdown()">
                <img data-auth-avatar src="" alt="User Avatar" class="user-avatar">
                <span data-auth-username class="user-username"></span>
                <span>▼</span>
            </div>
            <div id="user-dropdown" class="user-dropdown">
                <a href="/theories/user-submissions/index.html" class="user-dropdown-item">My Theories</a>
                <div style="border-top: 1px solid rgba(147, 51, 234, 0.3); margin: 0.5rem 0;"></div>
                <button class="user-logout-btn" onclick="window.userAuth?.logout()">Logout</button>
            </div>
        </div>
    </div>

    <script>
    function handleLogin(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const result = window.userAuth.login(formData.get('username'), formData.get('password'));
        if (result.success) {
            window.userAuth.showAuthMessage(result.message, 'success');
            setTimeout(() => window.userAuth.hideAuthModal(), 1000);
        } else {
            window.userAuth.showAuthMessage(result.error, 'error');
        }
    }

    function handleSignup(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const result = window.userAuth.signup(formData.get('username'), formData.get('email'), formData.get('password'));
        if (result.success) {
            window.userAuth.showAuthMessage(result.message + ' You can now login.', 'success');
            setTimeout(() => {
                window.userAuth.switchAuthMode('login');
                window.userAuth.clearAuthMessages();
            }, 2000);
        } else {
            window.userAuth.showAuthMessage(result.error, 'error');
        }
    }

    function toggleUserDropdown() {
        document.getElementById('user-dropdown')?.classList.toggle('show');
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-display') && !e.target.closest('#user-dropdown')) {
            document.getElementById('user-dropdown')?.classList.remove('show');
        }
    });
    </script>

`;

        if (content.includes('</body>')) {
            return content.replace('</body>', authModal + '</body>');
        }

        return content + authModal;
    }

    /**
     * Add theory widget to content area
     */
    addTheoryWidget(content, pageInfo) {
        const widget = `
        <!-- User Theory Widget (Auto-added by script) -->
        <div data-theory-widget
             data-page="${pageInfo.pageId}"
             data-title="${pageInfo.pageTitle.replace(/"/g, '&quot;')}"
             data-mode="inline"
             style="margin-top: 3rem;"></div>
`;

        // Try to add before footer
        if (content.includes('<footer')) {
            return content.replace('<footer', widget + '\n<footer');
        }

        // Try to add before closing main/article/div.container
        if (content.includes('</main>')) {
            return content.replace('</main>', widget + '\n</main>');
        }

        if (content.includes('</article>')) {
            return content.replace('</article>', widget + '\n</article>');
        }

        if (content.includes('</div><!-- .container -->') || content.includes('</div> <!-- .container -->')) {
            return content.replace(/(<\/div>\s*(?:<!--\s*)?\.container(?:\s*-->)?)/,widget + '\n$1');
        }

        // Fallback: add before </body>
        if (content.includes('</body>')) {
            return content.replace('</body>', widget + '\n</body>');
        }

        return content + widget;
    }

    /**
     * Print summary statistics
     */
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Installation Summary');
        console.log('='.repeat(60));
        console.log(`Files scanned:  ${this.stats.scanned}`);
        console.log(`Files modified: ${this.stats.modified} ✅`);
        console.log(`Files skipped:  ${this.stats.skipped} ⏭️`);
        console.log(`Errors:         ${this.stats.errors} ❌`);
        console.log('='.repeat(60));

        if (this.dryRun) {
            console.log('\n⚠️  DRY RUN MODE - No files were actually modified');
            console.log('Remove --dry-run flag to apply changes\n');
        } else {
            console.log('\n✨ Installation complete!\n');
        }
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v')
};

// Run installation
const installer = new TheoryWidgetInstaller(options);
installer.install().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
