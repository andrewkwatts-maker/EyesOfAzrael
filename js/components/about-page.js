/**
 * About Page Component
 * Displays information about Eyes of Azrael project
 */

class AboutPage {
    render(container) {
        console.log('[AboutPage] Rendering About page');

        container.innerHTML = `
            <div class="legal-page about-page">
                <div class="page-header">
                    <h1>About Eyes of Azrael</h1>
                    <p class="subtitle">Exploring World Mythologies Through Digital Innovation</p>
                </div>

                <div class="page-content">
                    <section class="about-section">
                        <h2>Our Mission</h2>
                        <p>
                            Eyes of Azrael is a comprehensive digital encyclopedia dedicated to preserving
                            and sharing the rich tapestry of world mythologies. We believe that understanding
                            ancient stories, deities, and spiritual traditions helps us better understand
                            humanity's collective cultural heritage.
                        </p>
                    </section>

                    <section class="about-section">
                        <h2>What We Offer</h2>
                        <ul class="feature-list">
                            <li>
                                <strong>16+ Mythologies</strong> - Explore Greek, Norse, Egyptian, Hindu,
                                Buddhist, Christian, Islamic, and many more traditions
                            </li>
                            <li>
                                <strong>850+ Entities</strong> - Comprehensive database of deities, heroes,
                                creatures, cosmology concepts, sacred texts, and rituals
                            </li>
                            <li>
                                <strong>Cross-Cultural Analysis</strong> - Compare entities across different
                                mythologies to discover universal themes
                            </li>
                            <li>
                                <strong>Community Contributions</strong> - Share your knowledge and help
                                expand the database
                            </li>
                            <li>
                                <strong>Advanced Search</strong> - Find entities by name, attributes, or
                                associated concepts
                            </li>
                        </ul>
                    </section>

                    <section class="about-section">
                        <h2>Technology</h2>
                        <p>
                            Built with modern web technologies including Firebase for real-time data,
                            WebGL shaders for immersive backgrounds, and a progressive web app architecture
                            for offline access.
                        </p>
                    </section>

                    <section class="about-section">
                        <h2>Academic Integrity</h2>
                        <p>
                            All content is researched and sourced from academic texts, primary sources,
                            and scholarly interpretations. We strive for accuracy while acknowledging
                            the diversity of interpretations across different traditions and time periods.
                        </p>
                    </section>

                    <section class="about-section">
                        <h2>Contact</h2>
                        <p>
                            For questions, corrections, or collaboration inquiries, please reach out
                            through our GitHub repository or contact form.
                        </p>
                    </section>

                    <div class="page-footer">
                        <p class="last-updated">Last updated: December 2024</p>
                    </div>
                </div>
            </div>
        `;

        console.log('[AboutPage] About page rendered successfully');
    }
}

// Global export for non-module script loading
if (typeof window !== 'undefined') {
    window.AboutPage = AboutPage;
}
