/**
 * Privacy Policy Page Component
 * GDPR-compliant privacy policy
 */

class PrivacyPage {
    render(container) {
        console.log('[PrivacyPage] Rendering Privacy Policy page');

        container.innerHTML = `
            <div class="legal-page privacy-page">
                <div class="page-header">
                    <h1>Privacy Policy</h1>
                    <p class="subtitle">How we collect, use, and protect your data</p>
                </div>

                <div class="page-content">
                    <section class="legal-section">
                        <h2>Information We Collect</h2>
                        <h3>Account Information</h3>
                        <p>
                            When you sign in with Google, we collect:
                        </p>
                        <ul>
                            <li>Your name</li>
                            <li>Your email address</li>
                            <li>Your profile picture</li>
                            <li>Unique user ID from Google</li>
                        </ul>

                        <h3>Usage Data</h3>
                        <p>We automatically collect:</p>
                        <ul>
                            <li>Pages visited</li>
                            <li>Entities viewed</li>
                            <li>Search queries</li>
                            <li>Device and browser information</li>
                            <li>IP address (anonymized)</li>
                        </ul>

                        <h3>User Contributions</h3>
                        <p>When you submit entities, we store:</p>
                        <ul>
                            <li>Entity data you provide</li>
                            <li>Submission timestamp</li>
                            <li>Your user ID (linked to submission)</li>
                        </ul>
                    </section>

                    <section class="legal-section">
                        <h2>How We Use Your Data</h2>
                        <ul>
                            <li><strong>Authentication:</strong> To verify your identity and provide access</li>
                            <li><strong>Personalization:</strong> To track your contributions and preferences</li>
                            <li><strong>Analytics:</strong> To improve the site and understand usage patterns</li>
                            <li><strong>Communication:</strong> To notify you about your submissions</li>
                        </ul>
                    </section>

                    <section class="legal-section">
                        <h2>Data Storage & Security</h2>
                        <p>
                            Your data is stored securely using Firebase (Google Cloud Platform) with:
                        </p>
                        <ul>
                            <li>Encryption in transit (HTTPS/TLS)</li>
                            <li>Encryption at rest</li>
                            <li>Regular security audits</li>
                            <li>Access controls and authentication</li>
                        </ul>
                    </section>

                    <section class="legal-section">
                        <h2>Third-Party Services</h2>
                        <p>We use the following third-party services:</p>
                        <ul>
                            <li><strong>Google Analytics:</strong> Usage analytics (IP anonymization enabled)</li>
                            <li><strong>Firebase Auth:</strong> Google sign-in authentication</li>
                            <li><strong>Firebase Hosting:</strong> Website hosting and delivery</li>
                            <li><strong>Firestore:</strong> Database storage</li>
                        </ul>
                    </section>

                    <section class="legal-section">
                        <h2>Your Rights (GDPR)</h2>
                        <p>Under GDPR, you have the right to:</p>
                        <ul>
                            <li><strong>Access:</strong> Request a copy of your data</li>
                            <li><strong>Correction:</strong> Update inaccurate data</li>
                            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                            <li><strong>Portability:</strong> Export your data in machine-readable format</li>
                            <li><strong>Withdraw Consent:</strong> Opt out of data collection</li>
                        </ul>
                    </section>

                    <section class="legal-section">
                        <h2>Cookies & Local Storage</h2>
                        <p>
                            We use localStorage and cookies for:
                        </p>
                        <ul>
                            <li>Authentication tokens</li>
                            <li>Theme preferences</li>
                            <li>Search history</li>
                            <li>Performance caching</li>
                        </ul>
                        <p>
                            You can clear localStorage at any time through your browser settings.
                        </p>
                    </section>

                    <section class="legal-section">
                        <h2>Children's Privacy</h2>
                        <p>
                            This site is not directed to children under 13. We do not knowingly collect
                            data from children under 13. If you believe a child has provided us with
                            personal information, please contact us.
                        </p>
                    </section>

                    <section class="legal-section">
                        <h2>Changes to This Policy</h2>
                        <p>
                            We may update this privacy policy from time to time. Changes will be posted
                            on this page with an updated "Last Modified" date.
                        </p>
                    </section>

                    <section class="legal-section">
                        <h2>Contact</h2>
                        <p>
                            For privacy questions or to exercise your rights, contact us at:
                            privacy@eyesofazrael.com
                        </p>
                    </section>

                    <div class="page-footer">
                        <p class="last-updated">Last modified: December 28, 2024</p>
                    </div>
                </div>
            </div>
        `;

        console.log('[PrivacyPage] Privacy Policy page rendered successfully');
    }
}

// Global export for non-module script loading
if (typeof window !== 'undefined') {
    window.PrivacyPage = PrivacyPage;
}
