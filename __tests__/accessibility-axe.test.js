/**
 * Automated Accessibility Testing with jest-axe
 * Test Polish Agent 4 - Comprehensive Accessibility Validation
 *
 * This suite uses axe-core to automatically detect WCAG violations
 * across all major components.
 *
 * Test Coverage:
 * - Component-level accessibility scans
 * - WCAG 2.1 Level AA compliance
 * - Automatic violation detection
 */

const { axe, toHaveNoViolations } = require('jest-axe');

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Automated Accessibility Testing with axe-core', () => {
    let container;

    beforeEach(() => {
        document.body.innerHTML = '';
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Component Accessibility Scans', () => {
        test('should have no accessibility violations in search form', async () => {
            // Arrange
            container.innerHTML = `
                <form role="search">
                    <label for="search-input">Search entities</label>
                    <input
                        id="search-input"
                        type="search"
                        aria-label="Search mythological entities"
                        placeholder="Search..."
                    />
                    <button type="submit">Search</button>
                </form>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should have no accessibility violations in entity card', async () => {
            // Arrange
            container.innerHTML = `
                <article class="entity-card">
                    <img src="zeus.jpg" alt="Zeus, king of the Greek gods" />
                    <h3>Zeus</h3>
                    <p>King of the Greek gods and ruler of Mount Olympus</p>
                    <a href="/deities/zeus" aria-label="View Zeus deity profile">
                        View Details
                    </a>
                </article>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should have no accessibility violations in navigation', async () => {
            // Arrange
            container.innerHTML = `
                <nav role="navigation" aria-label="Main navigation">
                    <ul>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#explore">Explore</a></li>
                        <li><a href="#compare">Compare</a></li>
                        <li><a href="#about">About</a></li>
                    </ul>
                </nav>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should have no accessibility violations in modal dialog', async () => {
            // Arrange
            container.innerHTML = `
                <div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
                    <h2 id="dialog-title">Edit Entity</h2>
                    <form>
                        <label for="entity-name">Name</label>
                        <input id="entity-name" type="text" required aria-required="true" />

                        <label for="entity-desc">Description</label>
                        <textarea id="entity-desc" aria-describedby="desc-help"></textarea>
                        <span id="desc-help">Provide a detailed description</span>

                        <button type="submit">Save</button>
                        <button type="button" aria-label="Close dialog">Cancel</button>
                    </form>
                </div>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should have no accessibility violations in data table', async () => {
            // Arrange
            container.innerHTML = `
                <table>
                    <caption>Greek Deities</caption>
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Domain</th>
                            <th scope="col">Symbol</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">Zeus</th>
                            <td>Sky & Thunder</td>
                            <td>Thunderbolt</td>
                        </tr>
                        <tr>
                            <th scope="row">Poseidon</th>
                            <td>Sea</td>
                            <td>Trident</td>
                        </tr>
                    </tbody>
                </table>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should have no accessibility violations in form with validation', async () => {
            // Arrange
            container.innerHTML = `
                <form>
                    <fieldset>
                        <legend>Entity Information</legend>

                        <label for="name">
                            Name <span aria-label="required">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            aria-required="true"
                            aria-invalid="false"
                        />
                        <span id="name-error" role="alert" hidden></span>

                        <label for="mythology">Mythology</label>
                        <select id="mythology">
                            <option value="">Select...</option>
                            <option value="greek">Greek</option>
                            <option value="norse">Norse</option>
                        </select>

                        <label for="importance">Importance (1-5)</label>
                        <input
                            id="importance"
                            type="range"
                            min="1"
                            max="5"
                            aria-valuemin="1"
                            aria-valuemax="5"
                            aria-valuenow="3"
                        />
                    </fieldset>

                    <button type="submit">Submit</button>
                </form>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should have no accessibility violations in breadcrumb navigation', async () => {
            // Arrange
            container.innerHTML = `
                <nav aria-label="Breadcrumb">
                    <ol>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#mythology">Mythology</a></li>
                        <li><a href="#greek">Greek</a></li>
                        <li aria-current="page">Zeus</li>
                    </ol>
                </nav>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should have no accessibility violations in accordion', async () => {
            // Arrange
            container.innerHTML = `
                <div class="accordion">
                    <h3>
                        <button
                            id="accordion-1"
                            aria-expanded="false"
                            aria-controls="panel-1"
                        >
                            Powers and Abilities
                        </button>
                    </h3>
                    <div id="panel-1" role="region" aria-labelledby="accordion-1" hidden>
                        <p>Zeus wields the power of lightning and thunder.</p>
                    </div>

                    <h3>
                        <button
                            id="accordion-2"
                            aria-expanded="false"
                            aria-controls="panel-2"
                        >
                            Symbols and Attributes
                        </button>
                    </h3>
                    <div id="panel-2" role="region" aria-labelledby="accordion-2" hidden>
                        <p>Thunderbolt, eagle, and oak tree.</p>
                    </div>
                </div>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should have no accessibility violations in alert messages', async () => {
            // Arrange
            container.innerHTML = `
                <div role="alert" aria-live="assertive">
                    <strong>Error:</strong> Failed to save entity
                </div>
                <div role="status" aria-live="polite">
                    <strong>Success:</strong> Entity saved successfully
                </div>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should have no accessibility violations in pagination', async () => {
            // Arrange
            container.innerHTML = `
                <nav aria-label="Pagination">
                    <ul>
                        <li>
                            <a href="#page-1" aria-label="Go to previous page" aria-disabled="true">
                                Previous
                            </a>
                        </li>
                        <li>
                            <a href="#page-1" aria-current="page" aria-label="Page 1, current page">
                                1
                            </a>
                        </li>
                        <li>
                            <a href="#page-2" aria-label="Go to page 2">
                                2
                            </a>
                        </li>
                        <li>
                            <a href="#page-3" aria-label="Go to page 3">
                                3
                            </a>
                        </li>
                        <li>
                            <a href="#page-2" aria-label="Go to next page">
                                Next
                            </a>
                        </li>
                    </ul>
                </nav>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });
    });

    describe('WCAG 2.1 Specific Rules', () => {
        test('should pass WCAG 2.1 Level A rules', async () => {
            // Arrange
            container.innerHTML = `
                <main>
                    <h1>Mythology Explorer</h1>
                    <p>Explore deities, heroes, and creatures from world mythologies.</p>
                    <a href="#explore">Explore Now</a>
                </main>
            `;

            // Act
            const results = await axe(container, {
                runOnly: {
                    type: 'tag',
                    values: ['wcag2a']
                }
            });

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should pass WCAG 2.1 Level AA rules', async () => {
            // Arrange
            container.innerHTML = `
                <article>
                    <h2>Zeus</h2>
                    <img src="zeus.jpg" alt="Zeus holding a thunderbolt" />
                    <p style="color: #000000; background: #FFFFFF;">
                        Zeus is the sky and thunder god in ancient Greek religion.
                    </p>
                </article>
            `;

            // Act
            const results = await axe(container, {
                runOnly: {
                    type: 'tag',
                    values: ['wcag2aa']
                }
            });

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should pass best practices rules', async () => {
            // Arrange
            container.innerHTML = `
                <header>
                    <nav role="navigation">
                        <ul>
                            <li><a href="#home">Home</a></li>
                            <li><a href="#about">About</a></li>
                        </ul>
                    </nav>
                </header>
            `;

            // Act
            const results = await axe(container, {
                runOnly: {
                    type: 'tag',
                    values: ['best-practice']
                }
            });

            // Assert
            expect(results).toHaveNoViolations();
        });
    });

    describe('Common Accessibility Issues', () => {
        test('should detect missing alt text on images', async () => {
            // Arrange
            container.innerHTML = `
                <img src="zeus.jpg" />
            `;

            // Act
            const results = await axe(container);

            // Assert - Should have violations
            expect(results.violations.length).toBeGreaterThan(0);
            expect(results.violations.some(v => v.id === 'image-alt')).toBe(true);
        });

        test('should detect missing form labels', async () => {
            // Arrange
            container.innerHTML = `
                <form>
                    <input type="text" />
                </form>
            `;

            // Act
            const results = await axe(container);

            // Assert - Should have violations
            expect(results.violations.length).toBeGreaterThan(0);
            expect(results.violations.some(v => v.id === 'label')).toBe(true);
        });

        test('should detect insufficient color contrast', async () => {
            // Arrange
            container.innerHTML = `
                <p style="color: #cccccc; background-color: #ffffff;">
                    This text has poor contrast
                </p>
            `;

            // Act
            const results = await axe(container);

            // Assert - Should have violations
            expect(results.violations.length).toBeGreaterThan(0);
            expect(results.violations.some(v => v.id === 'color-contrast')).toBe(true);
        });

        test('should detect empty links', async () => {
            // Arrange
            container.innerHTML = `
                <a href="#"></a>
            `;

            // Act
            const results = await axe(container);

            // Assert - Should have violations
            expect(results.violations.length).toBeGreaterThan(0);
            expect(results.violations.some(v => v.id === 'link-name')).toBe(true);
        });

        test('should detect missing page language', async () => {
            // Arrange
            // Note: In real scenario, this would check <html lang="en">
            document.documentElement.removeAttribute('lang');

            // Act
            const results = await axe(document);

            // Assert - Should have violations for missing lang attribute
            expect(results.violations.some(v => v.id === 'html-has-lang')).toBe(true);

            // Cleanup
            document.documentElement.setAttribute('lang', 'en');
        });
    });

    describe('Complex Component Accessibility', () => {
        test('should validate complete entity page structure', async () => {
            // Arrange
            container.innerHTML = `
                <div class="entity-page">
                    <header>
                        <nav aria-label="Breadcrumb">
                            <ol>
                                <li><a href="#home">Home</a></li>
                                <li><a href="#greek">Greek</a></li>
                                <li aria-current="page">Zeus</li>
                            </ol>
                        </nav>
                    </header>

                    <main>
                        <article>
                            <h1>Zeus</h1>
                            <img src="zeus.jpg" alt="Statue of Zeus" />

                            <section aria-labelledby="description-heading">
                                <h2 id="description-heading">Description</h2>
                                <p>Zeus is the sky and thunder god in ancient Greek religion.</p>
                            </section>

                            <section aria-labelledby="powers-heading">
                                <h2 id="powers-heading">Powers</h2>
                                <ul>
                                    <li>Lightning manipulation</li>
                                    <li>Weather control</li>
                                    <li>Shapeshifting</li>
                                </ul>
                            </section>
                        </article>
                    </main>

                    <aside aria-label="Related entities">
                        <h2>Related Deities</h2>
                        <ul>
                            <li><a href="#hera">Hera</a></li>
                            <li><a href="#poseidon">Poseidon</a></li>
                        </ul>
                    </aside>
                </div>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });

        test('should validate search interface with filters', async () => {
            // Arrange
            container.innerHTML = `
                <div class="search-interface">
                    <form role="search">
                        <label for="search">Search entities</label>
                        <input id="search" type="search" />
                        <button type="submit">Search</button>
                    </form>

                    <aside aria-label="Search filters">
                        <h2>Filters</h2>

                        <fieldset>
                            <legend>Mythology</legend>
                            <label>
                                <input type="checkbox" name="mythology" value="greek" />
                                Greek
                            </label>
                            <label>
                                <input type="checkbox" name="mythology" value="norse" />
                                Norse
                            </label>
                        </fieldset>

                        <fieldset>
                            <legend>Entity Type</legend>
                            <label>
                                <input type="radio" name="type" value="deity" />
                                Deity
                            </label>
                            <label>
                                <input type="radio" name="type" value="hero" />
                                Hero
                            </label>
                        </fieldset>
                    </aside>

                    <div role="region" aria-live="polite" aria-label="Search results">
                        <p>10 results found</p>
                    </div>
                </div>
            `;

            // Act
            const results = await axe(container);

            // Assert
            expect(results).toHaveNoViolations();
        });
    });

    describe('Performance and Custom Rules', () => {
        test('should complete accessibility scan quickly', async () => {
            // Arrange
            container.innerHTML = `
                <main>
                    <h1>Performance Test</h1>
                    ${Array.from({ length: 100 }, (_, i) => `
                        <article>
                            <h2>Entity ${i}</h2>
                            <p>Description for entity ${i}</p>
                        </article>
                    `).join('')}
                </main>
            `;

            // Act
            const startTime = performance.now();
            const results = await axe(container);
            const endTime = performance.now();

            // Assert - Should complete in reasonable time (< 5 seconds)
            expect(endTime - startTime).toBeLessThan(5000);
            expect(results).toHaveNoViolations();
        });

        test('should support custom rule configuration', async () => {
            // Arrange
            container.innerHTML = `
                <button>Click me</button>
            `;

            // Act - Run with specific rules only
            const results = await axe(container, {
                rules: {
                    'color-contrast': { enabled: true },
                    'button-name': { enabled: true }
                }
            });

            // Assert
            expect(results).toHaveNoViolations();
        });
    });
});
