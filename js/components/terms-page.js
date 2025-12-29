/**
 * Terms of Service Page Component
 * User agreement and terms of use
 */

class TermsPage {
    render(container) {
        console.log('[TermsPage] Rendering Terms of Service page');

        container.innerHTML = `
            <div class="legal-page terms-page">
                <div class="page-header">
                    <h1>Terms of Service</h1>
                    <p class="subtitle">User Agreement for Eyes of Azrael</p>
                </div>

                <div class="page-content">
                    <section class="legal-section">
                        <h2>Acceptance of Terms</h2>
                        <p>
                            By accessing and using Eyes of Azrael ("the Service"), you accept and agree
                            to be bound by these Terms of Service. If you do not agree, please do not
                            use the Service.
                        </p>
                    </section>

                    <section class="legal-section">
                        <h2>User Accounts</h2>
                        <ul>
                            <li>You must use a valid Google account to contribute content</li>
                            <li>You are responsible for maintaining account security</li>
                            <li>You may not share your account credentials</li>
                            <li>We reserve the right to suspend accounts that violate these terms</li>
                        </ul>
                    </section>

                    <section class="legal-section">
                        <h2>User Contributions</h2>
                        <p>When submitting entities or content, you agree that:</p>
                        <ul>
                            <li>Content must be accurate and properly sourced</li>
                            <li>Content must not infringe copyright or intellectual property rights</li>
                            <li>Content must be respectful and non-discriminatory</li>
                            <li>Content becomes part of the public database (CC BY-SA 4.0 license)</li>
                            <li>We may moderate, edit, or remove submissions at our discretion</li>
                        </ul>
                    </section>

                    <section class="legal-section">
                        <h2>Prohibited Uses</h2>
                        <p>You may not:</p>
                        <ul>
                            <li>Use the Service for any illegal purpose</li>
                            <li>Upload malicious code or spam</li>
                            <li>Attempt to breach security or authentication</li>
                            <li>Scrape or copy content for commercial purposes without permission</li>
                            <li>Impersonate others or provide false information</li>
                            <li>Post offensive, discriminatory, or hate speech content</li>
                        </ul>
                    </section>

                    <section class="legal-section">
                        <h2>Intellectual Property</h2>
                        <p>
                            <strong>Database Content:</strong> Licensed under Creative Commons
                            Attribution-ShareAlike 4.0 International (CC BY-SA 4.0). You may share and
                            adapt with proper attribution.
                        </p>
                        <p>
                            <strong>Website Code & Design:</strong> Copyright &copy; Eyes of Azrael.
                            All rights reserved unless otherwise specified.
                        </p>
                    </section>

                    <section class="legal-section">
                        <h2>Disclaimer of Warranties</h2>
                        <p>
                            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
                            IMPLIED. WE DO NOT GUARANTEE ACCURACY, COMPLETENESS, OR AVAILABILITY OF CONTENT.
                        </p>
                    </section>

                    <section class="legal-section">
                        <h2>Limitation of Liability</h2>
                        <p>
                            IN NO EVENT SHALL EYES OF AZRAEL BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                            SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM USE OF THE SERVICE.
                        </p>
                    </section>

                    <section class="legal-section">
                        <h2>Termination</h2>
                        <p>
                            We reserve the right to terminate or suspend access to the Service immediately,
                            without prior notice, for conduct that violates these Terms or is harmful to
                            other users.
                        </p>
                    </section>

                    <section class="legal-section">
                        <h2>Changes to Terms</h2>
                        <p>
                            We may revise these Terms at any time. Continued use after changes constitutes
                            acceptance of the new Terms.
                        </p>
                    </section>

                    <section class="legal-section">
                        <h2>Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of the United States, without regard
                            to conflict of law provisions.
                        </p>
                    </section>

                    <section class="legal-section">
                        <h2>Contact</h2>
                        <p>
                            For questions about these Terms, contact: legal@eyesofazrael.com
                        </p>
                    </section>

                    <div class="page-footer">
                        <p class="last-updated">Effective date: December 28, 2024</p>
                    </div>
                </div>
            </div>
        `;

        console.log('[TermsPage] Terms of Service page rendered successfully');
    }
}

// Global export for non-module script loading
if (typeof window !== 'undefined') {
    window.TermsPage = TermsPage;
}
