/**
 * Badge Display Component - Polished Edition
 *
 * Displays user badges and achievements with premium animations and tooltips.
 * Used on user profiles, contribution cards, and leaderboards.
 *
 * Features:
 * - Badge showcase with tier-based styling (Bronze, Silver, Gold, Platinum, Special)
 * - Rich hover tooltips with badge details, earned date, and points
 * - Pinned badges (up to 3) shown first
 * - Achievement unlock animations with celebration effects
 * - Compact and expanded views
 * - Badge modal for viewing all badges by category
 * - Full accessibility support (ARIA, keyboard nav)
 */

class BadgeDisplay {
    constructor(options = {}) {
        this.container = null;
        this.badges = [];
        this.userId = null;

        // Options
        this.options = {
            maxDisplay: options.maxDisplay || 6,
            showTooltips: options.showTooltips !== false,
            compact: options.compact || false,
            allowPin: options.allowPin || false,
            showPoints: options.showPoints !== false,
            animateIn: options.animateIn !== false,
            onBadgeClick: options.onBadgeClick || null,
            onPinChange: options.onPinChange || null,
            ...options
        };

        // Badge definitions with icons and point values
        this.badgeDefinitions = {
            // ==================== CONTRIBUTION BADGES ====================
            'first-word': {
                name: 'First Word',
                description: 'Posted your first note',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
                tier: 'bronze',
                category: 'contribution',
                points: 10
            },
            'scholar': {
                name: 'Scholar',
                description: 'Posted 10 notes',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
                tier: 'silver',
                category: 'contribution',
                points: 50
            },
            'sage': {
                name: 'Sage',
                description: 'Posted 50 notes',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M12 6v7"/><path d="M9 9.5l3-3 3 3"/></svg>',
                tier: 'gold',
                category: 'contribution',
                points: 200
            },
            'creator': {
                name: 'Creator',
                description: 'Submitted your first entity',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
                tier: 'bronze',
                category: 'creation',
                points: 25
            },
            'archivist': {
                name: 'Archivist',
                description: 'Submitted 10 entities',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
                tier: 'silver',
                category: 'creation',
                points: 100
            },
            'mythkeeper': {
                name: 'Mythkeeper',
                description: 'Submitted 50 entities',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M6 21V10a3 3 0 0 1 6 0v11M18 21V10a3 3 0 0 0-6 0"/><path d="M6 7V4a1 1 0 0 1 1-1h4"/><path d="M18 7V4a1 1 0 0 0-1-1h-4"/><circle cx="12" cy="4" r="2"/></svg>',
                tier: 'gold',
                category: 'creation',
                points: 500
            },

            // ==================== ENGAGEMENT BADGES ====================
            'well-received': {
                name: 'Well Received',
                description: 'Got 10+ upvotes on a single piece',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
                tier: 'silver',
                category: 'engagement',
                points: 75
            },
            'popular': {
                name: 'Popular',
                description: 'Got 50+ upvotes on a single piece',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
                tier: 'gold',
                category: 'engagement',
                points: 250
            },
            'influencer': {
                name: 'Influencer',
                description: 'Got 100+ upvotes on a single piece',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6v6l4 2"/></svg>',
                tier: 'platinum',
                category: 'engagement',
                points: 1000
            },

            // ==================== RELATIONSHIP BADGES ====================
            'mythweaver': {
                name: 'Mythweaver',
                description: '5 accepted relationship suggestions',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
                tier: 'silver',
                category: 'relationships',
                points: 100
            },
            'connector': {
                name: 'Connector',
                description: '25 accepted relationship suggestions',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>',
                tier: 'gold',
                category: 'relationships',
                points: 350
            },

            // ==================== PERSPECTIVE BADGES ====================
            'lens-crafter': {
                name: 'Lens Crafter',
                description: 'Created your first perspective',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
                tier: 'bronze',
                category: 'perspectives',
                points: 15
            },
            'visionary': {
                name: 'Visionary',
                description: '10 perspectives with 5+ followers',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
                tier: 'gold',
                category: 'perspectives',
                points: 400
            },

            // ==================== MYTHOLOGY BADGES ====================
            'olympian-scholar': {
                name: 'Olympian Scholar',
                description: '20+ contributions to Greek mythology',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
                tier: 'silver',
                category: 'mythology',
                points: 150
            },
            'norse-sage': {
                name: 'Norse Sage',
                description: '20+ contributions to Norse mythology',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
                tier: 'silver',
                category: 'mythology',
                points: 150
            },
            'egyptian-adept': {
                name: 'Egyptian Adept',
                description: '20+ contributions to Egyptian mythology',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
                tier: 'silver',
                category: 'mythology',
                points: 150
            },
            'hindu-devotee': {
                name: 'Hindu Devotee',
                description: '20+ contributions to Hindu mythology',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20 10 10 0 1 0 0-20"/><path d="M12 7v10"/><path d="M7 12h10"/></svg>',
                tier: 'silver',
                category: 'mythology',
                points: 150
            },
            'celtic-druid': {
                name: 'Celtic Druid',
                description: '20+ contributions to Celtic mythology',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>',
                tier: 'silver',
                category: 'mythology',
                points: 150
            },
            'pantheon-master': {
                name: 'Pantheon Master',
                description: 'Earned badges from 5+ mythologies',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
                tier: 'platinum',
                category: 'mythology',
                points: 750
            },

            // ==================== STREAK BADGES ====================
            'dedicated': {
                name: 'Dedicated',
                description: '7-day contribution streak',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 0 1-5 5 5 5 0 0 1-5-5c0-1.5.5-3 1.5-4.5 1.5-2 2.5-3.5 3.5-3.5z"/><path d="M12 16v6"/><path d="M8 19h8"/></svg>',
                tier: 'bronze',
                category: 'streak',
                points: 35
            },
            'committed': {
                name: 'Committed',
                description: '30-day contribution streak',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>',
                tier: 'silver',
                category: 'streak',
                points: 150
            },
            'unstoppable': {
                name: 'Unstoppable',
                description: '100-day contribution streak',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
                tier: 'gold',
                category: 'streak',
                points: 500
            },

            // ==================== SPECIAL BADGES ====================
            'early-adopter': {
                name: 'Early Adopter',
                description: 'Joined during beta',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
                tier: 'special',
                category: 'special',
                points: 100
            },
            'verified': {
                name: 'Verified Expert',
                description: 'Verified mythology expert',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>',
                tier: 'special',
                category: 'special',
                points: 500
            },
            'moderator': {
                name: 'Moderator',
                description: 'Community moderator',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
                tier: 'special',
                category: 'special',
                points: 0
            },
            'founding-member': {
                name: 'Founding Member',
                description: 'One of the first 100 members',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="m6.8 14-3.5 2"/><path d="m20.7 16-3.5-2"/><path d="M6.8 10 3.3 8"/><path d="m20.7 8-3.5 2"/><circle cx="12" cy="12" r="4"/></svg>',
                tier: 'special',
                category: 'special',
                points: 250
            }
        };

        // Tier colors with enhanced gradients and effects
        this.tierColors = {
            bronze: {
                bg: 'rgba(205, 127, 50, 0.12)',
                border: '#cd7f32',
                text: '#cd7f32',
                gradient: 'linear-gradient(135deg, #cd7f32 0%, #b87333 50%, #8b5a2b 100%)',
                glow: 'rgba(205, 127, 50, 0.4)',
                shimmer: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                rank: 1
            },
            silver: {
                bg: 'rgba(192, 192, 192, 0.12)',
                border: '#c0c0c0',
                text: '#c0c0c0',
                gradient: 'linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)',
                glow: 'rgba(192, 192, 192, 0.45)',
                shimmer: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                rank: 2
            },
            gold: {
                bg: 'rgba(255, 215, 0, 0.12)',
                border: '#ffd700',
                text: '#ffd700',
                gradient: 'linear-gradient(135deg, #ffd700 0%, #f0a500 50%, #cc8800 100%)',
                glow: 'rgba(255, 215, 0, 0.5)',
                shimmer: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                rank: 3
            },
            platinum: {
                bg: 'rgba(229, 228, 226, 0.12)',
                border: '#e5e4e2',
                text: '#e5e4e2',
                gradient: 'linear-gradient(135deg, #e5e4e2 0%, #a0c4e8 50%, #b8d4e8 100%)',
                glow: 'rgba(229, 228, 226, 0.55)',
                shimmer: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
                rank: 4
            },
            special: {
                bg: 'rgba(147, 112, 219, 0.12)',
                border: '#9370db',
                text: '#9370db',
                gradient: 'linear-gradient(135deg, #9370db 0%, #7b68ee 50%, #6a5acd 100%)',
                glow: 'rgba(147, 112, 219, 0.55)',
                shimmer: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                rank: 5
            }
        };

        // Tier display names
        this.tierNames = {
            bronze: 'Bronze',
            silver: 'Silver',
            gold: 'Gold',
            platinum: 'Platinum',
            special: 'Legendary'
        };

        // Category labels
        this.categoryNames = {
            contribution: 'Contributions',
            creation: 'Creations',
            engagement: 'Engagement',
            relationships: 'Relationships',
            perspectives: 'Perspectives',
            mythology: 'Mythology Expertise',
            streak: 'Streaks',
            special: 'Special',
            other: 'Other'
        };
    }

    /**
     * Set badges to display
     * @param {Array} badges - Array of badge objects { badgeId, awardedAt, isPinned, points }
     */
    setBadges(badges) {
        this.badges = badges || [];

        // Sort: pinned first, then by tier, then by date
        this.badges.sort((a, b) => {
            // Pinned badges first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            // Then by tier
            const tierOrder = { special: 0, platinum: 1, gold: 2, silver: 3, bronze: 4 };
            const defA = this.badgeDefinitions[a.badgeId] || {};
            const defB = this.badgeDefinitions[b.badgeId] || {};
            const tierDiff = (tierOrder[defA.tier] || 5) - (tierOrder[defB.tier] || 5);
            if (tierDiff !== 0) return tierDiff;

            // Then by date (newest first)
            const dateA = a.awardedAt?.toMillis?.() || a.awardedAt || 0;
            const dateB = b.awardedAt?.toMillis?.() || b.awardedAt || 0;
            return dateB - dateA;
        });
    }

    /**
     * Set user ID for pin operations
     */
    setUserId(userId) {
        this.userId = userId;
    }

    /**
     * Render the badge display
     * @param {HTMLElement} targetContainer - Container to render into
     * @returns {HTMLElement} The rendered container
     */
    render(targetContainer) {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.container = document.createElement('div');
        this.container.className = `badge-display ${this.options.compact ? 'badge-display--compact' : ''}`;

        if (this.badges.length === 0) {
            this.container.innerHTML = this._getEmptyStateHTML();
        } else {
            this.container.innerHTML = this._getBadgesHTML();
            this._bindEvents();

            // Animate in if enabled
            if (this.options.animateIn) {
                this._animateIn();
            }
        }

        if (targetContainer) {
            targetContainer.appendChild(this.container);
        }

        return this.container;
    }

    /**
     * Animate badges in with stagger
     */
    _animateIn() {
        const badges = this.container.querySelectorAll('.badge-display__badge');
        badges.forEach((badge, index) => {
            badge.style.opacity = '0';
            badge.style.transform = 'scale(0.8) translateY(10px)';

            setTimeout(() => {
                badge.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                badge.style.opacity = '1';
                badge.style.transform = 'scale(1) translateY(0)';
            }, index * 50);
        });
    }

    /**
     * Get empty state HTML
     */
    _getEmptyStateHTML() {
        return `
            <div class="badge-display__empty">
                <span class="badge-display__empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="8" r="6"/>
                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                    </svg>
                </span>
                <span class="badge-display__empty-text">No badges earned yet</span>
                <span class="badge-display__empty-hint">Complete activities to earn badges</span>
            </div>
        `;
    }

    /**
     * Get badges HTML
     */
    _getBadgesHTML() {
        const displayBadges = this.badges.slice(0, this.options.maxDisplay);
        const remainingCount = this.badges.length - this.options.maxDisplay;

        // Calculate total points
        const totalPoints = this.badges.reduce((sum, badge) => {
            const def = this.badgeDefinitions[badge.badgeId] || {};
            return sum + (def.points || badge.points || 0);
        }, 0);

        let html = '<div class="badge-display__list" role="list">';

        displayBadges.forEach((badge, index) => {
            const def = this.badgeDefinitions[badge.badgeId] || this._getDefaultBadge(badge.badgeId);
            const tierColors = this.tierColors[def.tier] || this.tierColors.bronze;
            const points = def.points || badge.points || 0;

            html += `
                <div class="badge-display__badge ${badge.isPinned ? 'badge-display__badge--pinned' : ''}"
                     data-badge-id="${badge.badgeId}"
                     data-index="${index}"
                     data-tier="${def.tier}"
                     role="listitem"
                     style="--badge-bg: ${tierColors.bg}; --badge-border: ${tierColors.border}; --badge-text: ${tierColors.text}; --badge-gradient: ${tierColors.gradient}; --badge-glow: ${tierColors.glow};"
                     ${this.options.showTooltips ? 'tabindex="0"' : ''}>
                    <span class="badge-display__icon" aria-hidden="true">${def.icon}</span>
                    ${!this.options.compact ? `<span class="badge-display__name">${def.name}</span>` : ''}
                    ${badge.isPinned ? '<span class="badge-display__pin" title="Pinned badge"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg></span>' : ''}

                    ${this.options.showTooltips ? `
                        <div class="badge-display__tooltip" role="tooltip">
                            <div class="badge-display__tooltip-header">
                                <span class="tooltip-icon">${def.icon}</span>
                                <div class="tooltip-info">
                                    <span class="tooltip-name">${def.name}</span>
                                    <span class="tooltip-tier tier-${def.tier}">
                                        <span class="tier-icon">${this._getTierIcon(def.tier)}</span>
                                        ${this.tierNames[def.tier] || def.tier}
                                    </span>
                                </div>
                            </div>
                            <div class="badge-display__tooltip-unlock">
                                <span class="unlock-label">How to unlock:</span>
                                <span class="unlock-criteria">${def.description}</span>
                            </div>
                            ${badge.awardedAt ? `
                                <p class="badge-display__tooltip-date badge-earned">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                        <polyline points="22 4 12 14.01 9 11.01"/>
                                    </svg>
                                    Unlocked ${this._formatDate(badge.awardedAt)}
                                </p>
                            ` : ''}
                            ${this.options.showPoints && points > 0 ? `
                                <p class="badge-display__tooltip-points">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                    </svg>
                                    +${points} points
                                </p>
                            ` : ''}
                            <div class="badge-display__tooltip-rarity">
                                <span class="rarity-bar">
                                    <span class="rarity-fill" style="width: ${this._getRarityPercent(def.tier)}%"></span>
                                </span>
                                <span class="rarity-text">${this._getRarityText(def.tier)}</span>
                            </div>
                            ${this.options.allowPin ? `
                                <button class="badge-display__tooltip-pin-btn" data-action="pin">
                                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="14" height="14">
                                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                                    </svg>
                                    ${badge.isPinned ? 'Unpin badge' : 'Pin to profile'}
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        });

        if (remainingCount > 0) {
            html += `
                <button class="badge-display__more" type="button" aria-label="View all ${this.badges.length} badges">
                    <span class="badge-display__more-count">+${remainingCount}</span>
                    <span class="badge-display__more-text">more</span>
                </button>
            `;
        }

        html += '</div>';

        // Add points summary if enabled
        if (this.options.showPoints && totalPoints > 0) {
            html += `
                <div class="badge-display__points-summary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span>${totalPoints.toLocaleString()} badge points</span>
                </div>
            `;
        }

        return html;
    }

    /**
     * Get default badge definition for unknown badges
     */
    _getDefaultBadge(badgeId) {
        return {
            name: badgeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: 'Achievement unlocked',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
            tier: 'bronze',
            category: 'other',
            points: 0
        };
    }

    /**
     * Get tier icon SVG
     */
    _getTierIcon(tier) {
        const icons = {
            bronze: '<svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10"><circle cx="8" cy="8" r="6"/></svg>',
            silver: '<svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10"><polygon points="8 1 10 6 16 6 11 9 13 15 8 11 3 15 5 9 0 6 6 6"/></svg>',
            gold: '<svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10"><polygon points="8 0 10.5 5 16 5.5 12 9.5 13 15 8 12 3 15 4 9.5 0 5.5 5.5 5"/></svg>',
            platinum: '<svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10"><path d="M8 0L10 4L14 2L12 6L16 8L12 10L14 14L10 12L8 16L6 12L2 14L4 10L0 8L4 6L2 2L6 4L8 0Z"/></svg>',
            special: '<svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10"><path d="M8 0l2 5h5l-4 3.5 1.5 5.5L8 11l-4.5 3 1.5-5.5L1 5h5l2-5z"/><circle cx="8" cy="8" r="2"/></svg>'
        };
        return icons[tier] || icons.bronze;
    }

    /**
     * Get rarity percentage for display
     */
    _getRarityPercent(tier) {
        const percents = {
            bronze: 45,
            silver: 25,
            gold: 12,
            platinum: 5,
            special: 2
        };
        return percents[tier] || 50;
    }

    /**
     * Get rarity text description
     */
    _getRarityText(tier) {
        const texts = {
            bronze: 'Common badge',
            silver: 'Uncommon badge',
            gold: 'Rare badge',
            platinum: 'Epic badge',
            special: 'Legendary badge'
        };
        return texts[tier] || 'Badge';
    }

    /**
     * Format date for display
     */
    _formatDate(timestamp) {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Bind event listeners
     */
    _bindEvents() {
        if (!this.container) return;

        // Badge clicks
        const badges = this.container.querySelectorAll('.badge-display__badge');
        badges.forEach(badge => {
            badge.addEventListener('click', (e) => this._handleBadgeClick(e));

            // Keyboard support
            badge.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this._handleBadgeClick(e);
                }
            });
        });

        // Pin buttons in tooltips
        const pinBtns = this.container.querySelectorAll('[data-action="pin"]');
        pinBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._handlePinClick(e);
            });
        });

        // "More" button
        const moreBtn = this.container.querySelector('.badge-display__more');
        if (moreBtn) {
            moreBtn.addEventListener('click', () => this._showAllBadges());
        }
    }

    /**
     * Handle badge click
     */
    _handleBadgeClick(e) {
        const badgeEl = e.currentTarget;
        const badgeId = badgeEl.dataset.badgeId;
        const index = parseInt(badgeEl.dataset.index, 10);
        const badge = this.badges[index];

        if (this.options.onBadgeClick) {
            this.options.onBadgeClick(badge, badgeEl);
        }
    }

    /**
     * Handle pin button click
     */
    _handlePinClick(e) {
        const btn = e.target;
        const badgeEl = btn.closest('.badge-display__badge');
        const badgeId = badgeEl.dataset.badgeId;
        const index = parseInt(badgeEl.dataset.index, 10);
        const badge = this.badges[index];
        const newPinnedState = !badge.isPinned;

        // Count currently pinned badges
        const pinnedCount = this.badges.filter(b => b.isPinned).length;

        // Check limit (max 3 pinned)
        if (newPinnedState && pinnedCount >= 3) {
            this._showPinLimitToast();
            return;
        }

        // Update state
        badge.isPinned = newPinnedState;

        // Re-sort and re-render
        this.setBadges(this.badges);
        this.render(this.container.parentNode);

        // Call callback
        if (this.options.onPinChange) {
            this.options.onPinChange(badge, newPinnedState);
        }
    }

    /**
     * Show pin limit toast
     */
    _showPinLimitToast() {
        let toast = document.querySelector('.badge-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'badge-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = 'You can only pin up to 3 badges';
        toast.classList.add('show');

        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    /**
     * Show all badges in a modal
     */
    _showAllBadges() {
        const modal = document.createElement('div');
        modal.className = 'badge-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'badge-modal-title');

        modal.innerHTML = `
            <div class="badge-modal__backdrop"></div>
            <div class="badge-modal__content">
                <header class="badge-modal__header">
                    <h3 id="badge-modal-title">All Badges (${this.badges.length})</h3>
                    <button type="button" class="badge-modal__close" aria-label="Close modal">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </header>
                <div class="badge-modal__body">
                    ${this._getFullBadgeListHTML()}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Animate in
        requestAnimationFrame(() => modal.classList.add('badge-modal--open'));

        // Close handlers
        const closeModal = () => {
            modal.classList.remove('badge-modal--open');
            document.body.style.overflow = '';
            setTimeout(() => modal.remove(), 200);
        };

        modal.querySelector('.badge-modal__backdrop').addEventListener('click', closeModal);
        modal.querySelector('.badge-modal__close').addEventListener('click', closeModal);
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        // Focus trap
        modal.querySelector('.badge-modal__close').focus();
    }

    /**
     * Get full badge list HTML for modal
     */
    _getFullBadgeListHTML() {
        // Group by category
        const grouped = {};
        this.badges.forEach(badge => {
            const def = this.badgeDefinitions[badge.badgeId] || this._getDefaultBadge(badge.badgeId);
            const category = def.category || 'other';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push({ ...badge, def });
        });

        let html = '';

        // Define category order
        const categoryOrder = ['special', 'mythology', 'contribution', 'creation', 'engagement', 'relationships', 'perspectives', 'streak', 'other'];

        categoryOrder.forEach(category => {
            if (!grouped[category]) return;

            const badges = grouped[category];
            html += `
                <div class="badge-modal__category">
                    <h4 class="badge-modal__category-title">${this.categoryNames[category] || category}</h4>
                    <div class="badge-modal__grid">
                        ${badges.map(badge => {
                            const tierColors = this.tierColors[badge.def.tier] || this.tierColors.bronze;
                            const points = badge.def.points || badge.points || 0;
                            return `
                                <div class="badge-modal__item"
                                     style="--badge-bg: ${tierColors.bg}; --badge-border: ${tierColors.border}; --badge-gradient: ${tierColors.gradient};">
                                    <div class="badge-modal__icon-wrapper">
                                        <span class="badge-modal__icon">${badge.def.icon}</span>
                                        ${badge.isPinned ? '<span class="badge-modal__pinned-indicator">Pinned</span>' : ''}
                                    </div>
                                    <div class="badge-modal__info">
                                        <span class="badge-modal__name">${badge.def.name}</span>
                                        <span class="badge-modal__desc">${badge.def.description}</span>
                                        <div class="badge-modal__meta">
                                            ${badge.awardedAt ? `
                                                <span class="badge-modal__date">${this._formatDate(badge.awardedAt)}</span>
                                            ` : ''}
                                            ${points > 0 ? `
                                                <span class="badge-modal__points">+${points} pts</span>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        return html;
    }

    /**
     * Show unlock animation for a new badge with celebration effects
     */
    showUnlockAnimation(badgeId) {
        const def = this.badgeDefinitions[badgeId] || this._getDefaultBadge(badgeId);
        const tierColors = this.tierColors[def.tier] || this.tierColors.bronze;
        const points = def.points || 0;
        const tierName = this.tierNames[def.tier] || def.tier;

        // Check for reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Create overlay for dramatic effect
        const overlay = document.createElement('div');
        overlay.className = 'badge-unlock-overlay';

        const toast = document.createElement('div');
        toast.className = 'badge-unlock-toast';
        toast.innerHTML = `
            <div class="badge-unlock-toast__content"
                 style="--badge-bg: ${tierColors.bg}; --badge-border: ${tierColors.border}; --badge-gradient: ${tierColors.gradient}; --badge-glow: ${tierColors.glow}; --badge-shimmer: ${tierColors.shimmer};">
                ${!prefersReducedMotion ? '<div class="badge-unlock-toast__rays"></div>' : ''}
                <div class="badge-unlock-toast__icon-container">
                    <div class="badge-unlock-toast__ring"></div>
                    <div class="badge-unlock-toast__ring badge-unlock-toast__ring--delay"></div>
                    <span class="badge-unlock-toast__icon">${def.icon}</span>
                    ${!prefersReducedMotion ? '<div class="badge-unlock-toast__sparkles"></div>' : ''}
                </div>
                <div class="badge-unlock-toast__text">
                    <span class="badge-unlock-toast__title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Achievement Unlocked!
                    </span>
                    <span class="badge-unlock-toast__name">${def.name}</span>
                    <span class="badge-unlock-toast__tier tier-${def.tier}">
                        ${this._getTierIcon(def.tier)}
                        ${tierName} Badge
                    </span>
                    ${points > 0 ? `
                        <span class="badge-unlock-toast__points">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            +${points} points earned
                        </span>
                    ` : ''}
                </div>
                <button class="badge-unlock-toast__dismiss" aria-label="Dismiss">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(toast);

        // Add sparkles and confetti if motion is allowed
        if (!prefersReducedMotion) {
            this._addSparkles(toast.querySelector('.badge-unlock-toast__sparkles'));
            this._addConfettiBurst(toast);
        }

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('badge-unlock-overlay--show');
            toast.classList.add('badge-unlock-toast--show');
        });

        // Play sound effect if available
        this._playUnlockSound(def.tier);

        // Dismiss handler
        const dismiss = () => {
            toast.classList.remove('badge-unlock-toast--show');
            overlay.classList.remove('badge-unlock-overlay--show');
            setTimeout(() => {
                toast.remove();
                overlay.remove();
            }, 300);
        };

        toast.querySelector('.badge-unlock-toast__dismiss').addEventListener('click', dismiss);
        overlay.addEventListener('click', dismiss);

        // Auto-dismiss after 5 seconds
        setTimeout(dismiss, 5000);
    }

    /**
     * Add confetti burst around the toast
     */
    _addConfettiBurst(toast) {
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'badge-confetti-container';
        toast.appendChild(confettiContainer);

        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'badge-confetti';
            confetti.style.setProperty('--angle', (Math.random() * 360) + 'deg');
            confetti.style.setProperty('--distance', (80 + Math.random() * 120) + 'px');
            confetti.style.setProperty('--rotation', (Math.random() * 720 - 360) + 'deg');
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = (Math.random() * 0.3) + 's';
            confettiContainer.appendChild(confetti);
        }

        setTimeout(() => confettiContainer.remove(), 2000);
    }

    /**
     * Play unlock sound based on tier
     */
    _playUnlockSound(tier) {
        // Web Audio API for tier-appropriate sounds
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different tones for different tiers
            const frequencies = {
                bronze: [523, 659],      // C5, E5
                silver: [523, 659, 784], // C5, E5, G5
                gold: [523, 659, 784, 1047], // C5, E5, G5, C6
                platinum: [523, 659, 784, 988, 1175], // C5, E5, G5, B5, D6
                special: [523, 659, 784, 988, 1175, 1319] // Full fanfare
            };

            const freqs = frequencies[tier] || frequencies.bronze;
            let time = audioContext.currentTime;

            freqs.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.1, time + i * 0.1);
                gain.gain.exponentialDecayTo?.(0.01, time + i * 0.1 + 0.3) ||
                    gain.gain.setValueAtTime(0.01, time + i * 0.1 + 0.3);
                osc.start(time + i * 0.1);
                osc.stop(time + i * 0.1 + 0.4);
            });
        } catch (e) {
            // Audio not supported or blocked, silent fail
        }
    }

    /**
     * Add sparkle effects to container
     */
    _addSparkles(container) {
        if (!container) return;

        const colors = ['#ffd700', '#fff', '#fbbf24', '#f59e0b'];

        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'badge-sparkle';
            sparkle.style.left = `${Math.random() * 100}%`;
            sparkle.style.top = `${Math.random() * 100}%`;
            sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
            sparkle.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            container.appendChild(sparkle);
        }
    }

    /**
     * Get total points from badges
     */
    getTotalPoints() {
        return this.badges.reduce((sum, badge) => {
            const def = this.badgeDefinitions[badge.badgeId] || {};
            return sum + (def.points || badge.points || 0);
        }, 0);
    }

    /**
     * Get badges by tier
     */
    getBadgesByTier(tier) {
        return this.badges.filter(badge => {
            const def = this.badgeDefinitions[badge.badgeId] || {};
            return def.tier === tier;
        });
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
}

// ==================== BADGE DISPLAY STYLES (Injected) ====================

const badgeDisplayStyles = `
/* Badge Display Container */
.badge-display {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.badge-display__list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
}

/* Individual Badge */
.badge-display__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--badge-bg);
    border: 1.5px solid var(--badge-border);
    border-radius: 24px;
    cursor: pointer;
    position: relative;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.2s ease,
                border-color 0.2s ease;
}

.badge-display__badge:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 6px 20px var(--badge-glow, rgba(0, 0, 0, 0.2));
    border-color: var(--badge-text);
}

.badge-display__badge:focus-visible {
    outline: 2px solid var(--badge-border);
    outline-offset: 2px;
}

.badge-display__badge--pinned {
    order: -1;
    border-width: 2px;
    background: var(--badge-gradient);
}

.badge-display__badge--pinned .badge-display__icon,
.badge-display__badge--pinned .badge-display__name {
    color: white;
}

/* Badge Icon */
.badge-display__icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--badge-text);
}

.badge-display__icon svg {
    width: 100%;
    height: 100%;
}

/* Badge Name */
.badge-display__name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--badge-text);
    white-space: nowrap;
}

/* Pin Indicator */
.badge-display__pin {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 16px;
    height: 16px;
    background: var(--badge-border);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1a2e;
}

.badge-display__pin svg {
    width: 10px;
    height: 10px;
}

/* Compact Mode */
.badge-display--compact .badge-display__badge {
    padding: 5px 10px;
    gap: 5px;
}

.badge-display--compact .badge-display__icon {
    width: 16px;
    height: 16px;
}

.badge-display--compact .badge-display__name {
    font-size: 0.6875rem;
}

/* Tooltip */
.badge-display__tooltip {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    background: rgba(17, 24, 39, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 14px 16px;
    min-width: 200px;
    max-width: 280px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s, transform 0.2s ease;
    z-index: 1000;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    pointer-events: none;
}

.badge-display__badge:hover .badge-display__tooltip,
.badge-display__badge:focus .badge-display__tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
}

/* Tooltip arrow */
.badge-display__tooltip::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border: 8px solid transparent;
    border-top-color: rgba(17, 24, 39, 0.98);
}

.badge-display__tooltip-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.badge-display__tooltip-header .tooltip-icon {
    width: 28px;
    height: 28px;
    color: var(--badge-text);
}

.badge-display__tooltip-header .tooltip-icon svg {
    width: 100%;
    height: 100%;
}

.badge-display__tooltip-header .tooltip-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.badge-display__tooltip-header .tooltip-name {
    font-weight: 700;
    font-size: 0.9375rem;
    color: white;
}

.badge-display__tooltip-header .tooltip-tier {
    display: inline-block;
    padding: 2px 8px;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 4px;
    width: fit-content;
}

.tooltip-tier.tier-bronze { background: rgba(205, 127, 50, 0.25); color: #cd7f32; }
.tooltip-tier.tier-silver { background: rgba(192, 192, 192, 0.25); color: #c0c0c0; }
.tooltip-tier.tier-gold { background: rgba(255, 215, 0, 0.25); color: #ffd700; }
.tooltip-tier.tier-platinum { background: rgba(229, 228, 226, 0.25); color: #e5e4e2; }
.tooltip-tier.tier-special { background: rgba(147, 112, 219, 0.25); color: #9370db; }

/* Unlock criteria section */
.badge-display__tooltip-unlock {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    margin-bottom: 12px;
}

.badge-display__tooltip-unlock .unlock-label {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
}

.badge-display__tooltip-unlock .unlock-criteria {
    font-size: 0.8125rem;
    color: #d1d5db;
    line-height: 1.4;
}

.badge-display__tooltip-date,
.badge-display__tooltip-points {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #6b7280;
    margin: 6px 0 0;
}

.badge-display__tooltip-date.badge-earned {
    color: #10b981;
}

.badge-display__tooltip-points {
    color: #fbbf24;
}

/* Rarity indicator */
.badge-display__tooltip-rarity {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.badge-display__tooltip-rarity .rarity-bar {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
}

.badge-display__tooltip-rarity .rarity-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--badge-border), var(--badge-text));
    border-radius: 2px;
    transition: width 0.3s ease;
}

.badge-display__tooltip-rarity .rarity-text {
    font-size: 0.6875rem;
    color: #9ca3af;
    white-space: nowrap;
}

.badge-display__tooltip-pin-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    margin-top: 12px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #d1d5db;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.badge-display__tooltip-pin-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.badge-display__tooltip-pin-btn svg {
    flex-shrink: 0;
}

/* Tier icon in tooltip */
.tooltip-tier .tier-icon {
    display: inline-flex;
    margin-right: 4px;
}

.tooltip-tier .tier-icon svg {
    width: 10px;
    height: 10px;
}

/* More Button */
.badge-display__more {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.06);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    color: #9ca3af;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.badge-display__more:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

.badge-display__more-count {
    font-size: 0.875rem;
    font-weight: 700;
}

.badge-display__more-text {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Points Summary */
.badge-display__points-summary {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #fbbf24;
    padding: 6px 12px;
    background: rgba(251, 191, 36, 0.1);
    border-radius: 6px;
    width: fit-content;
}

.badge-display__points-summary svg {
    width: 14px;
    height: 14px;
}

/* Empty State */
.badge-display__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 32px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #6b7280;
    text-align: center;
}

.badge-display__empty-icon {
    width: 40px;
    height: 40px;
    opacity: 0.5;
}

.badge-display__empty-icon svg {
    width: 100%;
    height: 100%;
    stroke: currentColor;
}

.badge-display__empty-text {
    font-size: 0.9375rem;
    font-weight: 500;
}

.badge-display__empty-hint {
    font-size: 0.75rem;
    opacity: 0.7;
}

/* Badge Modal */
.badge-modal {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s;
}

.badge-modal--open {
    opacity: 1;
    visibility: visible;
}

.badge-modal__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
}

.badge-modal__content {
    position: relative;
    background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    width: 100%;
    max-width: 640px;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
    transform: scale(0.95) translateY(20px);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.badge-modal--open .badge-modal__content {
    transform: scale(1) translateY(0);
}

.badge-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.badge-modal__header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
}

.badge-modal__close {
    width: 40px;
    height: 40px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    color: #9ca3af;
    cursor: pointer;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.badge-modal__close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.badge-modal__close svg {
    width: 20px;
    height: 20px;
}

.badge-modal__body {
    padding: 24px;
    overflow-y: auto;
}

.badge-modal__category {
    margin-bottom: 28px;
}

.badge-modal__category:last-child {
    margin-bottom: 0;
}

.badge-modal__category-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 14px;
}

.badge-modal__grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.badge-modal__item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--badge-bg);
    border: 1px solid var(--badge-border);
    border-radius: 14px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.badge-modal__item:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.badge-modal__icon-wrapper {
    position: relative;
}

.badge-modal__icon {
    width: 40px;
    height: 40px;
    color: var(--badge-border);
}

.badge-modal__icon svg {
    width: 100%;
    height: 100%;
}

.badge-modal__pinned-indicator {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 6px;
    background: var(--badge-gradient);
    border-radius: 4px;
    font-size: 0.5625rem;
    font-weight: 700;
    text-transform: uppercase;
    color: white;
    white-space: nowrap;
}

.badge-modal__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.badge-modal__name {
    font-weight: 700;
    font-size: 0.9375rem;
    color: white;
}

.badge-modal__desc {
    font-size: 0.8125rem;
    color: #9ca3af;
    line-height: 1.4;
}

.badge-modal__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 4px;
}

.badge-modal__date {
    font-size: 0.6875rem;
    color: #6b7280;
}

.badge-modal__points {
    font-size: 0.6875rem;
    color: #fbbf24;
    font-weight: 600;
}

/* Unlock Overlay */
.badge-unlock-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 10999;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s;
}

.badge-unlock-overlay--show {
    opacity: 1;
    visibility: visible;
}

/* Unlock Toast */
.badge-unlock-toast {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    z-index: 11000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.badge-unlock-toast--show {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    visibility: visible;
}

.badge-unlock-toast__content {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px 32px;
    background: linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.98));
    border: 2px solid var(--badge-border);
    border-radius: 20px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5),
                0 0 60px var(--badge-glow),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
    animation: badgeUnlockPulse 0.8s ease-out;
    position: relative;
    overflow: hidden;
    min-width: 320px;
}

/* Shimmer effect on toast */
.badge-unlock-toast__content::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: var(--badge-shimmer);
    animation: badgeShimmer 2s ease-in-out infinite;
    pointer-events: none;
}

@keyframes badgeShimmer {
    0% { left: -100%; }
    50%, 100% { left: 100%; }
}

/* Light rays behind icon */
.badge-unlock-toast__rays {
    position: absolute;
    left: 50px;
    top: 50%;
    transform: translateY(-50%);
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, var(--badge-glow) 0%, transparent 70%);
    animation: raysPulse 1.5s ease-in-out infinite;
    pointer-events: none;
}

@keyframes raysPulse {
    0%, 100% { opacity: 0.3; transform: translateY(-50%) scale(1); }
    50% { opacity: 0.6; transform: translateY(-50%) scale(1.2); }
}

@keyframes badgeUnlockPulse {
    0% { transform: scale(0.9); }
    30% { transform: scale(1.03); }
    60% { transform: scale(0.98); }
    100% { transform: scale(1); }
}

.badge-unlock-toast__icon-container {
    position: relative;
    width: 64px;
    height: 64px;
    flex-shrink: 0;
}

/* Expanding rings */
.badge-unlock-toast__ring {
    position: absolute;
    inset: -10px;
    border: 2px solid var(--badge-border);
    border-radius: 50%;
    opacity: 0;
    animation: ringExpand 1.5s ease-out infinite;
}

.badge-unlock-toast__ring--delay {
    animation-delay: 0.5s;
}

@keyframes ringExpand {
    0% {
        transform: scale(0.5);
        opacity: 0.8;
    }
    100% {
        transform: scale(2);
        opacity: 0;
    }
}

.badge-unlock-toast__icon {
    width: 100%;
    height: 100%;
    color: var(--badge-border);
    animation: badgeIconReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 0 12px var(--badge-glow));
}

@keyframes badgeIconReveal {
    0% { transform: rotate(-30deg) scale(0); opacity: 0; }
    40% { transform: rotate(15deg) scale(1.3); opacity: 1; }
    70% { transform: rotate(-5deg) scale(0.9); }
    100% { transform: rotate(0) scale(1); }
}

.badge-unlock-toast__icon svg {
    width: 100%;
    height: 100%;
}

.badge-unlock-toast__sparkles {
    position: absolute;
    inset: -20px;
    pointer-events: none;
}

.badge-sparkle {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: badgeSparkle 0.8s ease-out forwards;
    box-shadow: 0 0 8px 2px currentColor;
}

@keyframes badgeSparkle {
    0% { transform: scale(0); opacity: 1; }
    40% { transform: scale(1.8); opacity: 1; }
    100% { transform: scale(0); opacity: 0; }
}

.badge-unlock-toast__text {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
}

.badge-unlock-toast__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #fbbf24;
    animation: titleFadeIn 0.5s ease-out 0.2s both;
}

.badge-unlock-toast__title svg {
    flex-shrink: 0;
    animation: starSpin 2s linear infinite;
}

@keyframes starSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes titleFadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.badge-unlock-toast__name {
    font-size: 1.375rem;
    font-weight: 800;
    color: white;
    animation: nameFadeIn 0.5s ease-out 0.3s both;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

@keyframes nameFadeIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
}

.badge-unlock-toast__tier {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 6px;
    width: fit-content;
    animation: tierFadeIn 0.5s ease-out 0.4s both;
}

.badge-unlock-toast__tier.tier-bronze { background: rgba(205, 127, 50, 0.2); color: #cd7f32; }
.badge-unlock-toast__tier.tier-silver { background: rgba(192, 192, 192, 0.2); color: #c0c0c0; }
.badge-unlock-toast__tier.tier-gold { background: rgba(255, 215, 0, 0.2); color: #ffd700; }
.badge-unlock-toast__tier.tier-platinum { background: rgba(229, 228, 226, 0.2); color: #e5e4e2; }
.badge-unlock-toast__tier.tier-special { background: rgba(147, 112, 219, 0.2); color: #9370db; }

@keyframes tierFadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

.badge-unlock-toast__points {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    color: #fbbf24;
    font-weight: 700;
    animation: pointsFadeIn 0.5s ease-out 0.5s both;
}

.badge-unlock-toast__points svg {
    animation: pointsStar 0.8s ease-out 0.6s;
}

@keyframes pointsStar {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
}

@keyframes pointsFadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Dismiss button */
.badge-unlock-toast__dismiss {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    color: #6b7280;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.badge-unlock-toast__dismiss:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

/* Confetti container for badge unlock */
.badge-confetti-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
}

.badge-confetti {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    animation: badgeConfettiBurst 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes badgeConfettiBurst {
    0% {
        opacity: 1;
        transform: translate(-50%, -50%) rotate(0deg) scale(0);
    }
    20% {
        opacity: 1;
        transform: translate(
            calc(-50% + cos(var(--angle)) * var(--distance) * 0.4),
            calc(-50% + sin(var(--angle)) * var(--distance) * 0.4)
        ) rotate(calc(var(--rotation) * 0.3)) scale(1.2);
    }
    100% {
        opacity: 0;
        transform: translate(
            calc(-50% + cos(var(--angle)) * var(--distance)),
            calc(-50% + sin(var(--angle)) * var(--distance) + 100px)
        ) rotate(var(--rotation)) scale(0.5);
    }
}

/* Fallback for browsers without cos/sin */
@supports not (transform: translate(calc(cos(45deg) * 10px), 0)) {
    @keyframes badgeConfettiBurst {
        0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(0);
        }
        20% {
            opacity: 1;
            transform: translateY(-40px) rotate(180deg) scale(1.2);
        }
        100% {
            opacity: 0;
            transform: translateY(100px) rotate(720deg) scale(0.5);
        }
    }
}

/* Generic Toast */
.badge-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: rgba(17, 24, 39, 0.95);
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 10000;
}

.badge-toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
    visibility: visible;
}

/* Accessibility - Reduced Motion */
@media (prefers-reduced-motion: reduce) {
    .badge-display__badge,
    .badge-display__tooltip,
    .badge-modal__content,
    .badge-unlock-toast,
    .badge-unlock-toast__content,
    .badge-unlock-toast__icon,
    .badge-sparkle {
        transition: none !important;
        animation: none !important;
    }
}

/* Responsive */
@media (max-width: 640px) {
    .badge-display__list {
        gap: 8px;
    }

    .badge-display__badge {
        padding: 6px 10px;
    }

    .badge-display__icon {
        width: 16px;
        height: 16px;
    }

    .badge-display__name {
        font-size: 0.75rem;
    }

    .badge-display__tooltip {
        display: none;
    }

    .badge-modal__content {
        max-height: 90vh;
        border-radius: 16px 16px 0 0;
        position: fixed;
        bottom: 0;
        max-width: none;
    }

    .badge-unlock-toast {
        right: 12px;
        left: 12px;
        transform: translateY(-100%);
    }

    .badge-unlock-toast--show {
        transform: translateY(0);
    }

    .badge-unlock-toast__content {
        width: 100%;
        padding: 14px 18px;
    }
}
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('badge-display-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'badge-display-styles';
    styleSheet.textContent = badgeDisplayStyles;
    document.head.appendChild(styleSheet);
}

// ==================== EXPORTS ====================

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BadgeDisplay };
}

if (typeof window !== 'undefined') {
    window.BadgeDisplay = BadgeDisplay;
}
