/**
 * Contribution Size Indicator Component
 * Eyes of Azrael Project
 *
 * Visual indicator showing content richness and completeness.
 * Displays contribution level badges, progress rings, and improvement suggestions.
 *
 * Features:
 * - 5 contribution levels: Stub, Basic, Standard, Rich, Comprehensive
 * - Color-coded badges (red to green gradient)
 * - Animated progress ring display
 * - Detailed breakdown tooltip
 * - Improvement suggestions panel
 * - Contributor leaderboard widget
 *
 * Usage:
 * const indicator = new ContributionIndicator(container, {
 *   asset: assetData,
 *   mode: 'badge' // 'badge', 'ring', 'inline', 'full'
 * });
 */

class ContributionIndicator {
    /**
     * Contribution level definitions
     * Thresholds based on ContentFilterService scoring (max ~145 points)
     */
    static LEVELS = {
        STUB: { min: 0, max: 19, label: 'Stub', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', icon: 'edit_note' },
        BASIC: { min: 20, max: 39, label: 'Basic', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', icon: 'article' },
        STANDARD: { min: 40, max: 69, label: 'Standard', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)', icon: 'description' },
        RICH: { min: 70, max: 99, label: 'Rich', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', icon: 'library_books' },
        COMPREHENSIVE: { min: 100, max: Infinity, label: 'Comprehensive', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', icon: 'auto_stories' }
    };

    /**
     * Score component weights and max values (from ContentFilterService)
     */
    static SCORE_COMPONENTS = {
        textLength: { label: 'Text Content', maxScore: 50, pointsPer: 100, unit: 'characters' },
        sectionCount: { label: 'Sections', maxScore: 25, pointsPer: 1, multiplier: 5 },
        relationshipCount: { label: 'Relationships', maxScore: 15, pointsPer: 1, multiplier: 3 },
        sourceCount: { label: 'Sources', maxScore: 25, pointsPer: 1, multiplier: 5 },
        imageCount: { label: 'Images', maxScore: 20, pointsPer: 1, multiplier: 4 },
        corpusQueryCount: { label: 'Corpus Queries', maxScore: 10, pointsPer: 1, multiplier: 2 }
    };

    /**
     * Max total score (sum of all maxScores)
     */
    static MAX_SCORE = 145;

    /**
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Configuration options
     * @param {Object} options.asset - Asset/content object to analyze
     * @param {string} options.mode - Display mode: 'badge', 'ring', 'inline', 'full'
     * @param {boolean} options.showTooltip - Show detailed breakdown on hover
     * @param {boolean} options.showSuggestions - Show improvement suggestions
     * @param {boolean} options.animated - Animate progress ring fill
     * @param {Function} options.onEditClick - Callback when edit suggestion clicked
     * @param {string} options.entityId - Entity ID for leaderboard
     * @param {string} options.entityType - Entity type for leaderboard
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            asset: null,
            mode: 'badge',
            showTooltip: true,
            showSuggestions: false,
            animated: true,
            onEditClick: null,
            entityId: null,
            entityType: null,
            ...options
        };

        this.breakdown = null;
        this.level = null;
        this.filterService = null;

        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        // Get ContentFilterService instance
        this.filterService = window.contentFilterService || new ContentFilterService();

        // Calculate breakdown if asset provided
        if (this.options.asset) {
            this.breakdown = this.filterService.getContributionBreakdown(this.options.asset);
            this.level = this.getLevel(this.breakdown.totalScore);
        }

        // Render based on mode
        this.render();
    }

    /**
     * Get contribution level for a score
     * @param {number} score - Total contribution score
     * @returns {Object} Level object
     */
    getLevel(score) {
        const levels = ContributionIndicator.LEVELS;
        if (score >= levels.COMPREHENSIVE.min) return levels.COMPREHENSIVE;
        if (score >= levels.RICH.min) return levels.RICH;
        if (score >= levels.STANDARD.min) return levels.STANDARD;
        if (score >= levels.BASIC.min) return levels.BASIC;
        return levels.STUB;
    }

    /**
     * Get percentage completeness (0-100)
     * @param {number} score - Total score
     * @returns {number} Percentage
     */
    getPercentage(score) {
        return Math.min(100, Math.round((score / ContributionIndicator.MAX_SCORE) * 100));
    }

    /**
     * Render the component
     */
    render() {
        if (!this.container) return;

        switch (this.options.mode) {
            case 'badge':
                this.renderBadge();
                break;
            case 'ring':
                this.renderProgressRing();
                break;
            case 'inline':
                this.renderInlineBadge();
                break;
            case 'full':
                this.renderFullPanel();
                break;
            default:
                this.renderBadge();
        }

        // Attach event listeners
        this.attachEventListeners();
    }

    /**
     * Render contribution size badge
     */
    renderBadge() {
        if (!this.level || !this.breakdown) {
            this.container.innerHTML = '';
            return;
        }

        const percentage = this.getPercentage(this.breakdown.totalScore);

        this.container.innerHTML = `
            <div class="contribution-badge contribution-badge--${this.level.label.toLowerCase()}"
                 data-score="${this.breakdown.totalScore}"
                 ${this.options.showTooltip ? 'data-tooltip="true"' : ''}>
                <span class="contribution-badge__icon material-icons">${this.level.icon}</span>
                <span class="contribution-badge__label">${this.level.label}</span>
                <span class="contribution-badge__score">${this.breakdown.totalScore}</span>
                ${this.options.showTooltip ? this.renderTooltipHTML() : ''}
            </div>
        `;
    }

    /**
     * Render circular progress ring
     */
    renderProgressRing() {
        if (!this.level || !this.breakdown) {
            this.container.innerHTML = '';
            return;
        }

        const percentage = this.getPercentage(this.breakdown.totalScore);
        const circumference = 2 * Math.PI * 45; // radius = 45
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        this.container.innerHTML = `
            <div class="contribution-ring"
                 data-score="${this.breakdown.totalScore}"
                 ${this.options.showTooltip ? 'data-tooltip="true"' : ''}>
                <svg class="contribution-ring__svg" viewBox="0 0 100 100">
                    <circle
                        class="contribution-ring__bg"
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        stroke-width="6"
                    />
                    <circle
                        class="contribution-ring__progress"
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="${this.level.color}"
                        stroke-width="6"
                        stroke-linecap="round"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${this.options.animated ? circumference : strokeDashoffset}"
                        transform="rotate(-90 50 50)"
                        data-target-offset="${strokeDashoffset}"
                    />
                </svg>
                <div class="contribution-ring__center">
                    <span class="contribution-ring__percentage">${percentage}%</span>
                    <span class="contribution-ring__label">${this.level.label}</span>
                </div>
                ${this.options.showTooltip ? this.renderTooltipHTML() : ''}
            </div>
        `;

        // Animate if needed
        if (this.options.animated) {
            requestAnimationFrame(() => {
                const progressCircle = this.container.querySelector('.contribution-ring__progress');
                if (progressCircle) {
                    progressCircle.style.transition = 'stroke-dashoffset 1s ease-out';
                    progressCircle.style.strokeDashoffset = strokeDashoffset;
                }
            });
        }
    }

    /**
     * Render inline badge for entity cards
     */
    renderInlineBadge() {
        if (!this.level || !this.breakdown) {
            this.container.innerHTML = '';
            return;
        }

        this.container.innerHTML = `
            <div class="contribution-inline"
                 data-score="${this.breakdown.totalScore}"
                 ${this.options.showTooltip ? 'data-tooltip="true"' : ''}>
                <span class="contribution-inline__dot" style="background: ${this.level.color}"></span>
                <span class="contribution-inline__level">${this.level.label}</span>
                ${this.options.showTooltip ? this.renderTooltipHTML() : ''}
            </div>
        `;
    }

    /**
     * Render full panel with all features
     */
    renderFullPanel() {
        if (!this.level || !this.breakdown) {
            this.container.innerHTML = '<div class="contribution-panel contribution-panel--empty">No data available</div>';
            return;
        }

        const percentage = this.getPercentage(this.breakdown.totalScore);
        const suggestions = this.generateSuggestions();
        const circumference = 2 * Math.PI * 45;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        this.container.innerHTML = `
            <div class="contribution-panel">
                <div class="contribution-panel__header">
                    <h3 class="contribution-panel__title">Content Completeness</h3>
                    <div class="contribution-panel__badge contribution-badge--${this.level.label.toLowerCase()}">
                        <span class="material-icons">${this.level.icon}</span>
                        <span>${this.level.label}</span>
                    </div>
                </div>

                <div class="contribution-panel__main">
                    <div class="contribution-panel__ring-container">
                        <svg class="contribution-ring__svg" viewBox="0 0 100 100">
                            <circle
                                class="contribution-ring__bg"
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.1)"
                                stroke-width="8"
                            />
                            <circle
                                class="contribution-ring__progress"
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="${this.level.color}"
                                stroke-width="8"
                                stroke-linecap="round"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${this.options.animated ? circumference : strokeDashoffset}"
                                transform="rotate(-90 50 50)"
                                data-target-offset="${strokeDashoffset}"
                            />
                        </svg>
                        <div class="contribution-ring__center">
                            <span class="contribution-ring__score">${this.breakdown.totalScore}</span>
                            <span class="contribution-ring__max">/ ${ContributionIndicator.MAX_SCORE}</span>
                        </div>
                    </div>

                    <div class="contribution-panel__breakdown">
                        ${this.renderBreakdownBars()}
                    </div>
                </div>

                ${this.options.showSuggestions && suggestions.length > 0 ? `
                    <div class="contribution-panel__suggestions">
                        <h4 class="contribution-suggestions__title">
                            <span class="material-icons">lightbulb</span>
                            Improve This Entry
                        </h4>
                        <ul class="contribution-suggestions__list">
                            ${suggestions.map(s => `
                                <li class="contribution-suggestion" data-section="${s.section}">
                                    <span class="contribution-suggestion__icon material-icons">${s.icon}</span>
                                    <span class="contribution-suggestion__text">${s.text}</span>
                                    ${s.section ? `
                                        <button class="contribution-suggestion__btn" data-action="edit" data-section="${s.section}">
                                            <span class="material-icons">edit</span>
                                        </button>
                                    ` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${this.options.entityId ? `
                    <div class="contribution-panel__leaderboard" data-entity-id="${this.options.entityId}">
                        <h4 class="contribution-leaderboard__title">
                            <span class="material-icons">emoji_events</span>
                            Top Contributors
                        </h4>
                        <div class="contribution-leaderboard__loading">
                            <span class="material-icons spinning">autorenew</span>
                            Loading...
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Animate progress ring
        if (this.options.animated) {
            requestAnimationFrame(() => {
                const progressCircle = this.container.querySelector('.contribution-ring__progress');
                if (progressCircle) {
                    progressCircle.style.transition = 'stroke-dashoffset 1s ease-out';
                    progressCircle.style.strokeDashoffset = strokeDashoffset;
                }
            });
        }

        // Load leaderboard if entity ID provided
        if (this.options.entityId) {
            this.loadLeaderboard();
        }
    }

    /**
     * Render breakdown bars HTML
     * @returns {string} HTML string
     */
    renderBreakdownBars() {
        if (!this.breakdown) return '';

        const components = ContributionIndicator.SCORE_COMPONENTS;
        const bars = [];

        for (const [key, config] of Object.entries(components)) {
            const value = this.breakdown[key] || 0;
            let score;

            if (key === 'textLength') {
                score = Math.min(config.maxScore, Math.floor(value / config.pointsPer));
            } else {
                score = Math.min(config.maxScore, value * config.multiplier);
            }

            const percentage = (score / config.maxScore) * 100;
            const level = this.getLevelForBar(percentage);

            bars.push(`
                <div class="contribution-bar">
                    <div class="contribution-bar__header">
                        <span class="contribution-bar__label">${config.label}</span>
                        <span class="contribution-bar__value">${score}/${config.maxScore}</span>
                    </div>
                    <div class="contribution-bar__track">
                        <div class="contribution-bar__fill"
                             style="width: ${percentage}%; background: ${level.color}"
                             data-percentage="${percentage}">
                        </div>
                    </div>
                </div>
            `);
        }

        return bars.join('');
    }

    /**
     * Get level color for progress bar
     * @param {number} percentage - Fill percentage
     * @returns {Object} Level object
     */
    getLevelForBar(percentage) {
        if (percentage >= 80) return ContributionIndicator.LEVELS.COMPREHENSIVE;
        if (percentage >= 60) return ContributionIndicator.LEVELS.RICH;
        if (percentage >= 40) return ContributionIndicator.LEVELS.STANDARD;
        if (percentage >= 20) return ContributionIndicator.LEVELS.BASIC;
        return ContributionIndicator.LEVELS.STUB;
    }

    /**
     * Render tooltip HTML
     * @returns {string} HTML string
     */
    renderTooltipHTML() {
        if (!this.breakdown) return '';

        const components = ContributionIndicator.SCORE_COMPONENTS;

        return `
            <div class="contribution-tooltip">
                <div class="contribution-tooltip__header">
                    <span class="contribution-tooltip__level" style="color: ${this.level.color}">
                        ${this.level.label}
                    </span>
                    <span class="contribution-tooltip__score">
                        ${this.breakdown.totalScore} / ${ContributionIndicator.MAX_SCORE} pts
                    </span>
                </div>
                <div class="contribution-tooltip__breakdown">
                    ${Object.entries(components).map(([key, config]) => {
                        const value = this.breakdown[key] || 0;
                        let score;
                        let display;

                        if (key === 'textLength') {
                            score = Math.min(config.maxScore, Math.floor(value / config.pointsPer));
                            display = `${value.toLocaleString()} chars`;
                        } else {
                            score = Math.min(config.maxScore, value * config.multiplier);
                            display = value;
                        }

                        return `
                            <div class="contribution-tooltip__row">
                                <span class="contribution-tooltip__label">${config.label}</span>
                                <span class="contribution-tooltip__value">${display}</span>
                                <span class="contribution-tooltip__points">${score} pts</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Generate improvement suggestions based on breakdown
     * @returns {Array} Array of suggestion objects
     */
    generateSuggestions() {
        if (!this.breakdown) return [];

        const suggestions = [];
        const components = ContributionIndicator.SCORE_COMPONENTS;

        // Check text length
        if (this.breakdown.textLength < 2000) {
            suggestions.push({
                section: 'description',
                icon: 'edit',
                text: 'Add more detailed descriptions to enrich this entry',
                priority: 1
            });
        }

        // Check sections
        if (this.breakdown.sectionCount < 3) {
            suggestions.push({
                section: 'sections',
                icon: 'add_box',
                text: `Add more content sections (currently ${this.breakdown.sectionCount})`,
                priority: 2
            });
        }

        // Check sources
        if (this.breakdown.sourceCount < 2) {
            suggestions.push({
                section: 'sources',
                icon: 'library_books',
                text: 'Add sources or citations to improve credibility',
                priority: 3
            });
        }

        // Check relationships
        if (this.breakdown.relationshipCount < 3) {
            suggestions.push({
                section: 'relationships',
                icon: 'account_tree',
                text: 'Link related entities to build the mythology network',
                priority: 4
            });
        }

        // Check images
        if (this.breakdown.imageCount === 0) {
            suggestions.push({
                section: 'images',
                icon: 'add_photo_alternate',
                text: 'Add images or artwork to illustrate this entry',
                priority: 5
            });
        }

        // Check corpus queries
        if (this.breakdown.corpusQueryCount === 0) {
            suggestions.push({
                section: 'corpus',
                icon: 'auto_fix_high',
                text: 'Add corpus queries to connect with sacred texts',
                priority: 6
            });
        }

        // Sort by priority
        return suggestions.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Load contributor leaderboard for entity
     */
    async loadLeaderboard() {
        const leaderboardContainer = this.container.querySelector('.contribution-panel__leaderboard');
        if (!leaderboardContainer) return;

        try {
            const db = window.firebase?.firestore?.();
            if (!db || !this.options.entityId) {
                leaderboardContainer.innerHTML = '<p class="contribution-leaderboard__empty">Leaderboard unavailable</p>';
                return;
            }

            // Query contributions for this entity
            const contributionsRef = db.collection('contributions')
                .where('entityId', '==', this.options.entityId)
                .orderBy('points', 'desc')
                .limit(5);

            const snapshot = await contributionsRef.get();

            if (snapshot.empty) {
                leaderboardContainer.innerHTML = `
                    <h4 class="contribution-leaderboard__title">
                        <span class="material-icons">emoji_events</span>
                        Top Contributors
                    </h4>
                    <p class="contribution-leaderboard__empty">No contributions yet. Be the first!</p>
                `;
                return;
            }

            const contributors = [];
            snapshot.forEach(doc => {
                contributors.push({ id: doc.id, ...doc.data() });
            });

            // Get current user rank
            const currentUser = window.firebase?.auth?.()?.currentUser;
            let userRank = null;
            if (currentUser) {
                const userContrib = contributors.find(c => c.userId === currentUser.uid);
                if (userContrib) {
                    userRank = contributors.indexOf(userContrib) + 1;
                }
            }

            leaderboardContainer.innerHTML = `
                <h4 class="contribution-leaderboard__title">
                    <span class="material-icons">emoji_events</span>
                    Top Contributors
                </h4>
                <ul class="contribution-leaderboard__list">
                    ${contributors.map((contrib, index) => `
                        <li class="contribution-leaderboard__item ${currentUser && contrib.userId === currentUser.uid ? 'is-current-user' : ''}">
                            <span class="contribution-leaderboard__rank">${this.getRankIcon(index + 1)}</span>
                            <span class="contribution-leaderboard__name">${contrib.displayName || 'Anonymous'}</span>
                            <span class="contribution-leaderboard__points">${contrib.points || 0} pts</span>
                        </li>
                    `).join('')}
                </ul>
                ${userRank ? `
                    <div class="contribution-leaderboard__user-rank">
                        Your rank: #${userRank}
                    </div>
                ` : ''}
            `;
        } catch (error) {
            console.error('[ContributionIndicator] Error loading leaderboard:', error);
            leaderboardContainer.innerHTML = '<p class="contribution-leaderboard__empty">Error loading leaderboard</p>';
        }
    }

    /**
     * Get rank display icon
     * @param {number} rank - Rank number
     * @returns {string} HTML string
     */
    getRankIcon(rank) {
        switch (rank) {
            case 1:
                return '<span class="contribution-rank contribution-rank--gold">1</span>';
            case 2:
                return '<span class="contribution-rank contribution-rank--silver">2</span>';
            case 3:
                return '<span class="contribution-rank contribution-rank--bronze">3</span>';
            default:
                return `<span class="contribution-rank">${rank}</span>`;
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Tooltip hover events
        const tooltipTriggers = this.container.querySelectorAll('[data-tooltip="true"]');
        tooltipTriggers.forEach(trigger => {
            trigger.addEventListener('mouseenter', () => this.showTooltip(trigger));
            trigger.addEventListener('mouseleave', () => this.hideTooltip(trigger));
            trigger.addEventListener('focus', () => this.showTooltip(trigger));
            trigger.addEventListener('blur', () => this.hideTooltip(trigger));
        });

        // Suggestion edit buttons
        const editButtons = this.container.querySelectorAll('[data-action="edit"]');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (this.options.onEditClick && typeof this.options.onEditClick === 'function') {
                    this.options.onEditClick(section);
                }
                this.dispatchEditEvent(section);
            });
        });
    }

    /**
     * Show tooltip
     * @param {HTMLElement} trigger - Trigger element
     */
    showTooltip(trigger) {
        const tooltip = trigger.querySelector('.contribution-tooltip');
        if (tooltip) {
            tooltip.classList.add('is-visible');
        }
    }

    /**
     * Hide tooltip
     * @param {HTMLElement} trigger - Trigger element
     */
    hideTooltip(trigger) {
        const tooltip = trigger.querySelector('.contribution-tooltip');
        if (tooltip) {
            tooltip.classList.remove('is-visible');
        }
    }

    /**
     * Dispatch edit event
     * @param {string} section - Section to edit
     */
    dispatchEditEvent(section) {
        window.dispatchEvent(new CustomEvent('contributionEditRequested', {
            detail: {
                section,
                entityId: this.options.entityId,
                entityType: this.options.entityType
            }
        }));
    }

    /**
     * Update the indicator with new asset data
     * @param {Object} asset - New asset data
     */
    update(asset) {
        this.options.asset = asset;
        if (asset) {
            this.breakdown = this.filterService.getContributionBreakdown(asset);
            this.level = this.getLevel(this.breakdown.totalScore);
        } else {
            this.breakdown = null;
            this.level = null;
        }
        this.render();
    }

    /**
     * Get current breakdown data
     * @returns {Object} Breakdown data
     */
    getBreakdown() {
        return this.breakdown;
    }

    /**
     * Get current level
     * @returns {Object} Level object
     */
    getLevel() {
        return this.level;
    }

    /**
     * Destroy component and clean up
     */
    destroy() {
        this.container.innerHTML = '';
        this.breakdown = null;
        this.level = null;
    }
}

/**
 * Static factory method for creating inline badges
 * @param {Object} asset - Asset to analyze
 * @returns {string} HTML string for inline badge
 */
ContributionIndicator.createInlineBadge = function(asset) {
    const filterService = window.contentFilterService || new ContentFilterService();
    const breakdown = filterService.getContributionBreakdown(asset);
    const score = breakdown.totalScore;

    let level;
    if (score >= 100) level = ContributionIndicator.LEVELS.COMPREHENSIVE;
    else if (score >= 70) level = ContributionIndicator.LEVELS.RICH;
    else if (score >= 40) level = ContributionIndicator.LEVELS.STANDARD;
    else if (score >= 20) level = ContributionIndicator.LEVELS.BASIC;
    else level = ContributionIndicator.LEVELS.STUB;

    return `
        <span class="contribution-inline contribution-inline--static"
              style="--level-color: ${level.color}; --level-bg: ${level.bgColor}"
              title="${level.label} (${score} points)">
            <span class="contribution-inline__dot"></span>
            <span class="contribution-inline__level">${level.label}</span>
        </span>
    `;
};

/**
 * Static method to get level for a score
 * @param {number} score - Contribution score
 * @returns {Object} Level object
 */
ContributionIndicator.getLevelForScore = function(score) {
    const levels = ContributionIndicator.LEVELS;
    if (score >= levels.COMPREHENSIVE.min) return levels.COMPREHENSIVE;
    if (score >= levels.RICH.min) return levels.RICH;
    if (score >= levels.STANDARD.min) return levels.STANDARD;
    if (score >= levels.BASIC.min) return levels.BASIC;
    return levels.STUB;
};

// ES Module Export
export { ContributionIndicator };

// Legacy global export
if (typeof window !== 'undefined') {
    window.ContributionIndicator = ContributionIndicator;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Simple badge display:
 *    const container = document.getElementById('contribution-badge');
 *    const indicator = new ContributionIndicator(container, {
 *      asset: entityData,
 *      mode: 'badge'
 *    });
 *
 * 2. Progress ring:
 *    const indicator = new ContributionIndicator(container, {
 *      asset: entityData,
 *      mode: 'ring',
 *      animated: true
 *    });
 *
 * 3. Inline badge for cards:
 *    const indicator = new ContributionIndicator(container, {
 *      asset: entityData,
 *      mode: 'inline'
 *    });
 *
 * 4. Full panel with suggestions and leaderboard:
 *    const indicator = new ContributionIndicator(container, {
 *      asset: entityData,
 *      mode: 'full',
 *      showSuggestions: true,
 *      entityId: 'zeus-123',
 *      entityType: 'deities',
 *      onEditClick: (section) => {
 *        openEditor(section);
 *      }
 *    });
 *
 * 5. Static inline badge HTML:
 *    const badgeHTML = ContributionIndicator.createInlineBadge(entityData);
 *    card.querySelector('.metadata').innerHTML += badgeHTML;
 *
 * 6. Get level for score:
 *    const level = ContributionIndicator.getLevelForScore(75);
 *    console.log(level.label); // "Rich"
 *
 * 7. Update with new data:
 *    indicator.update(newEntityData);
 *
 * 8. Listen for edit requests:
 *    window.addEventListener('contributionEditRequested', (e) => {
 *      const { section, entityId, entityType } = e.detail;
 *      openEntityEditor(entityId, entityType, section);
 *    });
 */
