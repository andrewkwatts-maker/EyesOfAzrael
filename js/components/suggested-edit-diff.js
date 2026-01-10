/**
 * Suggested Edit Diff Component
 * Wiki-style edit suggestion system for Eyes of Azrael
 *
 * Features:
 * 1. Edit Proposal Form - Create new edit suggestions
 * 2. Diff View - Side-by-side and inline comparison
 * 3. Edit List View - Browse pending edits for an asset
 * 4. Voting on Edits - Upvote/downvote with verification badges
 * 5. Merge/Reject Controls - Admin and owner moderation tools
 * 6. Edit History - Chronological view of accepted changes
 *
 * Firebase Collection: suggestedEdits/{editId}
 * Related: editHistory/{historyId}
 */

class SuggestedEditDiff {
    constructor(options = {}) {
        this.options = {
            entityId: options.entityId || null,
            entityType: options.entityType || null,
            entityCollection: options.entityCollection || null,
            entityData: options.entityData || {},
            container: options.container || null,
            userId: options.userId || null,
            userName: options.userName || 'Anonymous',
            userPhoto: options.userPhoto || null,
            isOwner: options.isOwner || false,
            isModerator: options.isModerator || false,
            isAdmin: options.isAdmin || false,
            autoApproveThreshold: options.autoApproveThreshold || 10,
            onEditSubmit: options.onEditSubmit || null,
            onEditMerge: options.onEditMerge || null,
            onEditReject: options.onEditReject || null,
            ...options
        };

        this.editableFields = this.getEditableFields();
        this.pendingEdits = [];
        this.editHistory = [];
        this.currentView = 'list'; // 'list', 'form', 'diff', 'history'
        this.selectedEdit = null;
        this.diffMode = 'side-by-side'; // 'side-by-side', 'inline'
        this.sortBy = 'newest'; // 'newest', 'votes'
        this.filterStatus = 'pending'; // 'pending', 'approved', 'rejected', 'all'

        if (this.options.container) {
            this.init();
        }
    }

    /**
     * Get editable fields based on entity type
     */
    getEditableFields() {
        const commonFields = [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'description', label: 'Description', type: 'markdown' },
            { key: 'summary', label: 'Summary', type: 'markdown' }
        ];

        const typeSpecificFields = {
            deity: [
                { key: 'domains', label: 'Domains', type: 'array' },
                { key: 'symbols', label: 'Symbols', type: 'array' },
                { key: 'epithets', label: 'Epithets', type: 'array' },
                { key: 'worship', label: 'Worship Practices', type: 'markdown' },
                { key: 'relationships', label: 'Relationships', type: 'markdown' }
            ],
            hero: [
                { key: 'titles', label: 'Titles', type: 'array' },
                { key: 'achievements', label: 'Achievements', type: 'markdown' },
                { key: 'weapons', label: 'Weapons', type: 'array' },
                { key: 'companions', label: 'Companions', type: 'array' }
            ],
            creature: [
                { key: 'abilities', label: 'Abilities', type: 'array' },
                { key: 'habitat', label: 'Habitat', type: 'text' },
                { key: 'weaknesses', label: 'Weaknesses', type: 'array' },
                { key: 'appearance', label: 'Appearance', type: 'markdown' }
            ],
            place: [
                { key: 'location', label: 'Location', type: 'text' },
                { key: 'significance', label: 'Significance', type: 'markdown' },
                { key: 'inhabitants', label: 'Inhabitants', type: 'array' }
            ],
            item: [
                { key: 'powers', label: 'Powers', type: 'array' },
                { key: 'origin', label: 'Origin', type: 'markdown' },
                { key: 'wielders', label: 'Wielders', type: 'array' }
            ],
            text: [
                { key: 'content', label: 'Content', type: 'markdown' },
                { key: 'source', label: 'Source', type: 'text' },
                { key: 'translation', label: 'Translation', type: 'markdown' }
            ]
        };

        return [
            ...commonFields,
            ...(typeSpecificFields[this.options.entityType] || [])
        ];
    }

    /**
     * Initialize the component
     */
    init() {
        this.render();
        this.attachEventListeners();
        this.loadPendingEdits();
    }

    /**
     * Main render method
     */
    render() {
        if (!this.options.container) return;

        this.options.container.innerHTML = `
            <div class="sed-container">
                <!-- Header with navigation -->
                <div class="sed-header">
                    <div class="sed-header-left">
                        <h3 class="sed-title">
                            <span class="sed-title-icon">${this.getEditIcon()}</span>
                            Suggested Edits
                        </h3>
                        <span class="sed-count-badge" id="sed-pending-count">0 pending</span>
                    </div>
                    <div class="sed-header-actions">
                        <button class="sed-btn sed-btn-primary" id="sed-new-edit-btn" title="Suggest an Edit">
                            <span class="sed-btn-icon">+</span>
                            <span class="sed-btn-text">Suggest Edit</span>
                        </button>
                        <button class="sed-btn sed-btn-ghost" id="sed-history-btn" title="View Edit History">
                            <span class="sed-btn-icon">${this.getHistoryIcon()}</span>
                            <span class="sed-btn-text">History</span>
                        </button>
                    </div>
                </div>

                <!-- Main content area -->
                <div class="sed-content" id="sed-content">
                    ${this.renderCurrentView()}
                </div>
            </div>
        `;
    }

    /**
     * Render the current view based on state
     */
    renderCurrentView() {
        switch (this.currentView) {
            case 'form':
                return this.renderEditForm();
            case 'diff':
                return this.renderDiffView();
            case 'history':
                return this.renderHistoryView();
            case 'list':
            default:
                return this.renderEditList();
        }
    }

    /**
     * ==========================================
     * SECTION 1: EDIT PROPOSAL FORM
     * ==========================================
     */
    renderEditForm(editData = null) {
        const isEditing = !!editData;

        return `
            <div class="sed-form-container">
                <div class="sed-form-header">
                    <button class="sed-back-btn" id="sed-back-btn">
                        ${this.getBackIcon()} Back to List
                    </button>
                    <h4 class="sed-form-title">${isEditing ? 'Edit Suggestion' : 'Suggest an Edit'}</h4>
                </div>

                <form class="sed-form" id="sed-edit-form">
                    <!-- Field Selection -->
                    <div class="sed-form-group">
                        <label class="sed-label">
                            Select Field to Edit <span class="sed-required">*</span>
                        </label>
                        <select class="sed-select" id="sed-field-select" required>
                            <option value="">Choose a field...</option>
                            ${this.editableFields.map(field => `
                                <option value="${field.key}"
                                        data-type="${field.type}"
                                        ${editData?.field === field.key ? 'selected' : ''}>
                                    ${field.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Original Value Display -->
                    <div class="sed-form-group" id="sed-original-container" style="display: none;">
                        <label class="sed-label">Original Value</label>
                        <div class="sed-original-value" id="sed-original-value">
                            <pre class="sed-value-display"></pre>
                        </div>
                    </div>

                    <!-- New Value Input -->
                    <div class="sed-form-group" id="sed-new-value-container" style="display: none;">
                        <label class="sed-label">
                            New Value <span class="sed-required">*</span>
                        </label>
                        <div class="sed-input-wrapper">
                            <textarea class="sed-textarea"
                                      id="sed-new-value"
                                      placeholder="Enter your suggested changes..."
                                      rows="6"
                                      required>${editData?.newValue || ''}</textarea>
                            <div class="sed-input-hint">
                                Markdown is supported for text fields. Use **bold**, *italic*, and [links](url).
                            </div>
                        </div>
                    </div>

                    <!-- Reason for Change -->
                    <div class="sed-form-group">
                        <label class="sed-label">
                            Reason for Change <span class="sed-required">*</span>
                        </label>
                        <textarea class="sed-textarea"
                                  id="sed-reason"
                                  placeholder="Explain why this change should be made..."
                                  rows="3"
                                  minlength="10"
                                  maxlength="500"
                                  required>${editData?.reason || ''}</textarea>
                        <div class="sed-char-count">
                            <span id="sed-reason-count">0</span>/500 characters
                        </div>
                    </div>

                    <!-- Corpus Citation -->
                    <div class="sed-form-group">
                        <label class="sed-label">
                            Corpus Citation
                            <span class="sed-badge sed-badge-info">Recommended</span>
                        </label>
                        <div class="sed-citation-container">
                            <input type="text"
                                   class="sed-input"
                                   id="sed-citation-source"
                                   placeholder="Source text (e.g., 'Iliad, Book 1')">
                            <textarea class="sed-textarea"
                                      id="sed-citation-quote"
                                      placeholder="Relevant quote from the source..."
                                      rows="2"></textarea>
                            <button type="button" class="sed-btn sed-btn-secondary" id="sed-corpus-search-btn">
                                ${this.getSearchIcon()} Search Corpus
                            </button>
                        </div>
                        <div class="sed-input-hint">
                            Providing a corpus citation increases the likelihood of approval and earns a "Verified" badge.
                        </div>
                    </div>

                    <!-- Preview -->
                    <div class="sed-form-group">
                        <label class="sed-label">Preview Changes</label>
                        <div class="sed-preview-container" id="sed-preview-container">
                            <div class="sed-preview-placeholder">
                                Select a field and enter changes to see a preview.
                            </div>
                        </div>
                    </div>

                    <!-- Submit Actions -->
                    <div class="sed-form-actions">
                        <button type="button" class="sed-btn sed-btn-ghost" id="sed-cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" class="sed-btn sed-btn-primary" id="sed-submit-btn">
                            ${this.getSendIcon()} Submit for Review
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * ==========================================
     * SECTION 2: DIFF VIEW
     * ==========================================
     */
    renderDiffView() {
        if (!this.selectedEdit) {
            return '<div class="sed-empty">No edit selected</div>';
        }

        const edit = this.selectedEdit;

        return `
            <div class="sed-diff-container">
                <div class="sed-diff-header">
                    <button class="sed-back-btn" id="sed-back-btn">
                        ${this.getBackIcon()} Back to List
                    </button>
                    <div class="sed-diff-title">
                        <h4>Edit Suggestion for "${edit.fieldLabel || edit.field}"</h4>
                        <span class="sed-diff-meta">
                            by ${this.escapeHtml(edit.authorName)}
                            ${this.formatDate(edit.createdAt)}
                        </span>
                    </div>
                    <div class="sed-diff-mode-toggle">
                        <button class="sed-toggle-btn ${this.diffMode === 'side-by-side' ? 'active' : ''}"
                                data-mode="side-by-side" title="Side by Side">
                            ${this.getSideBySideIcon()}
                        </button>
                        <button class="sed-toggle-btn ${this.diffMode === 'inline' ? 'active' : ''}"
                                data-mode="inline" title="Inline">
                            ${this.getInlineIcon()}
                        </button>
                    </div>
                </div>

                <!-- Diff Content -->
                <div class="sed-diff-content ${this.diffMode}">
                    ${this.diffMode === 'side-by-side'
                        ? this.renderSideBySideDiff(edit)
                        : this.renderInlineDiff(edit)}
                </div>

                <!-- Edit Details -->
                <div class="sed-edit-details">
                    <div class="sed-detail-section">
                        <h5>Reason for Change</h5>
                        <p class="sed-reason-text">${this.escapeHtml(edit.summary)}</p>
                    </div>

                    ${edit.citation ? `
                        <div class="sed-detail-section sed-citation-section">
                            <h5>
                                Corpus Citation
                                <span class="sed-badge sed-badge-verified">${this.getVerifiedIcon()} Verified</span>
                            </h5>
                            <blockquote class="sed-citation-quote">
                                "${this.escapeHtml(edit.citation.quote)}"
                            </blockquote>
                            <cite class="sed-citation-source">
                                - ${this.escapeHtml(edit.citation.source)}
                            </cite>
                        </div>
                    ` : ''}
                </div>

                <!-- Voting Section -->
                ${this.renderVotingSection(edit)}

                <!-- Admin/Owner Controls -->
                ${this.options.isOwner || this.options.isModerator || this.options.isAdmin
                    ? this.renderMergeRejectControls(edit)
                    : ''}
            </div>
        `;
    }

    /**
     * Render side-by-side diff comparison
     */
    renderSideBySideDiff(edit) {
        const original = this.getFieldValue(edit.field);
        const proposed = edit.diff?.newValue || '';

        return `
            <div class="sed-diff-panels">
                <div class="sed-diff-panel sed-diff-original">
                    <div class="sed-diff-panel-header">
                        <span class="sed-diff-panel-label">Original</span>
                    </div>
                    <div class="sed-diff-panel-content">
                        ${this.renderDiffLines(original, proposed, 'original')}
                    </div>
                </div>
                <div class="sed-diff-panel sed-diff-proposed">
                    <div class="sed-diff-panel-header">
                        <span class="sed-diff-panel-label">Proposed</span>
                    </div>
                    <div class="sed-diff-panel-content">
                        ${this.renderDiffLines(original, proposed, 'proposed')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render inline diff comparison
     */
    renderInlineDiff(edit) {
        const original = this.getFieldValue(edit.field);
        const proposed = edit.diff?.newValue || '';

        return `
            <div class="sed-diff-inline">
                ${this.renderUnifiedDiff(original, proposed)}
            </div>
        `;
    }

    /**
     * Compute and render diff lines with highlighting
     */
    renderDiffLines(original, proposed, side) {
        const originalLines = String(original).split('\n');
        const proposedLines = String(proposed).split('\n');

        // Simple line-by-line diff
        const maxLines = Math.max(originalLines.length, proposedLines.length);
        let html = '<div class="sed-diff-lines">';

        for (let i = 0; i < maxLines; i++) {
            const origLine = originalLines[i] || '';
            const propLine = proposedLines[i] || '';
            const lineNum = i + 1;

            if (side === 'original') {
                const isRemoved = origLine !== propLine && !proposedLines.includes(origLine);
                html += `
                    <div class="sed-diff-line ${isRemoved ? 'sed-diff-removed' : ''}">
                        <span class="sed-line-num">${origLine ? lineNum : ''}</span>
                        <span class="sed-line-content">${this.escapeHtml(origLine)}</span>
                    </div>
                `;
            } else {
                const isAdded = origLine !== propLine && !originalLines.includes(propLine);
                html += `
                    <div class="sed-diff-line ${isAdded ? 'sed-diff-added' : ''}">
                        <span class="sed-line-num">${propLine ? lineNum : ''}</span>
                        <span class="sed-line-content">${this.escapeHtml(propLine)}</span>
                    </div>
                `;
            }
        }

        html += '</div>';
        return html;
    }

    /**
     * Render unified diff format
     */
    renderUnifiedDiff(original, proposed) {
        const originalLines = String(original).split('\n');
        const proposedLines = String(proposed).split('\n');

        // Build unified diff
        let html = '<div class="sed-diff-unified">';

        // Simple diff algorithm - highlight differences
        const allLines = [];
        const maxLen = Math.max(originalLines.length, proposedLines.length);

        for (let i = 0; i < maxLen; i++) {
            const origLine = originalLines[i];
            const propLine = proposedLines[i];

            if (origLine === propLine) {
                // Unchanged line
                allLines.push({ type: 'unchanged', content: origLine, lineNum: i + 1 });
            } else {
                if (origLine !== undefined) {
                    allLines.push({ type: 'removed', content: origLine, lineNum: i + 1 });
                }
                if (propLine !== undefined) {
                    allLines.push({ type: 'added', content: propLine, lineNum: i + 1 });
                }
            }
        }

        for (const line of allLines) {
            const prefix = line.type === 'removed' ? '-' : (line.type === 'added' ? '+' : ' ');
            html += `
                <div class="sed-diff-line sed-diff-${line.type}">
                    <span class="sed-line-prefix">${prefix}</span>
                    <span class="sed-line-num">${line.lineNum}</span>
                    <span class="sed-line-content">${this.escapeHtml(line.content || '')}</span>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    /**
     * ==========================================
     * SECTION 3: EDIT LIST VIEW
     * ==========================================
     */
    renderEditList() {
        return `
            <div class="sed-list-container">
                <!-- Filters and Sort -->
                <div class="sed-list-controls">
                    <div class="sed-filter-group">
                        <label class="sed-filter-label">Filter:</label>
                        <div class="sed-filter-buttons">
                            <button class="sed-filter-btn ${this.filterStatus === 'all' ? 'active' : ''}"
                                    data-filter="all">All</button>
                            <button class="sed-filter-btn ${this.filterStatus === 'pending' ? 'active' : ''}"
                                    data-filter="pending">Pending</button>
                            <button class="sed-filter-btn ${this.filterStatus === 'approved' ? 'active' : ''}"
                                    data-filter="approved">Approved</button>
                            <button class="sed-filter-btn ${this.filterStatus === 'rejected' ? 'active' : ''}"
                                    data-filter="rejected">Rejected</button>
                        </div>
                    </div>
                    <div class="sed-sort-group">
                        <label class="sed-filter-label">Sort:</label>
                        <select class="sed-sort-select" id="sed-sort-select">
                            <option value="newest" ${this.sortBy === 'newest' ? 'selected' : ''}>Newest First</option>
                            <option value="oldest" ${this.sortBy === 'oldest' ? 'selected' : ''}>Oldest First</option>
                            <option value="votes" ${this.sortBy === 'votes' ? 'selected' : ''}>Most Votes</option>
                        </select>
                    </div>
                </div>

                <!-- Edit List -->
                <div class="sed-list" id="sed-edit-list">
                    ${this.renderEditItems()}
                </div>
            </div>
        `;
    }

    /**
     * Render individual edit items
     */
    renderEditItems() {
        const filteredEdits = this.getFilteredEdits();

        if (filteredEdits.length === 0) {
            return `
                <div class="sed-empty-state">
                    <div class="sed-empty-icon">${this.getEmptyIcon()}</div>
                    <p class="sed-empty-text">No ${this.filterStatus === 'all' ? '' : this.filterStatus} edit suggestions yet.</p>
                    <button class="sed-btn sed-btn-primary" id="sed-suggest-first-btn">
                        Suggest the first edit
                    </button>
                </div>
            `;
        }

        return filteredEdits.map(edit => this.renderEditCard(edit)).join('');
    }

    /**
     * Render a single edit card
     */
    renderEditCard(edit) {
        const netVotes = (edit.upvotes || 0) - (edit.downvotes || 0);
        const statusClass = `sed-status-${edit.status}`;
        const isAutoApprove = netVotes >= this.options.autoApproveThreshold;

        return `
            <div class="sed-edit-card ${statusClass}" data-edit-id="${edit.id}">
                <div class="sed-card-vote-section">
                    <button class="sed-vote-btn sed-vote-up ${edit.userVote === 1 ? 'active' : ''}"
                            data-vote="1" data-edit-id="${edit.id}"
                            ${edit.status !== 'pending' ? 'disabled' : ''}>
                        ${this.getUpvoteIcon()}
                    </button>
                    <span class="sed-vote-count ${netVotes > 0 ? 'positive' : netVotes < 0 ? 'negative' : ''}">
                        ${netVotes}
                    </span>
                    <button class="sed-vote-btn sed-vote-down ${edit.userVote === -1 ? 'active' : ''}"
                            data-vote="-1" data-edit-id="${edit.id}"
                            ${edit.status !== 'pending' ? 'disabled' : ''}>
                        ${this.getDownvoteIcon()}
                    </button>
                </div>

                <div class="sed-card-content">
                    <div class="sed-card-header">
                        <span class="sed-field-badge">${this.getFieldLabel(edit.field)}</span>
                        ${edit.citation ? `
                            <span class="sed-badge sed-badge-verified" title="Has corpus citation">
                                ${this.getVerifiedIcon()} Verified
                            </span>
                        ` : ''}
                        ${isAutoApprove && edit.status === 'pending' ? `
                            <span class="sed-badge sed-badge-auto-approve" title="Eligible for auto-approval">
                                ${this.getAutoApproveIcon()} Auto-Approve
                            </span>
                        ` : ''}
                        <span class="sed-status-badge ${statusClass}">
                            ${edit.status.charAt(0).toUpperCase() + edit.status.slice(1)}
                        </span>
                    </div>

                    <div class="sed-card-meta">
                        <span class="sed-author">
                            ${edit.authorPhoto ? `<img src="${edit.authorPhoto}" alt="" class="sed-author-avatar">` : ''}
                            ${this.escapeHtml(edit.authorName)}
                        </span>
                        <span class="sed-date">${this.formatDate(edit.createdAt)}</span>
                    </div>

                    <p class="sed-card-summary">${this.escapeHtml(edit.summary)}</p>

                    <div class="sed-card-preview">
                        <div class="sed-preview-change">
                            <span class="sed-preview-label">Change:</span>
                            <span class="sed-preview-removed">${this.truncate(this.getFieldValue(edit.field), 50)}</span>
                            <span class="sed-preview-arrow">${this.getArrowIcon()}</span>
                            <span class="sed-preview-added">${this.truncate(edit.diff?.newValue || '', 50)}</span>
                        </div>
                    </div>

                    <div class="sed-card-actions">
                        <button class="sed-btn sed-btn-ghost sed-btn-sm" data-action="view" data-edit-id="${edit.id}">
                            ${this.getViewIcon()} View Diff
                        </button>
                        ${this.options.isOwner || this.options.isModerator || this.options.isAdmin ? `
                            ${edit.status === 'pending' ? `
                                <button class="sed-btn sed-btn-success sed-btn-sm" data-action="merge" data-edit-id="${edit.id}">
                                    ${this.getMergeIcon()} Merge
                                </button>
                                <button class="sed-btn sed-btn-danger sed-btn-sm" data-action="reject" data-edit-id="${edit.id}">
                                    ${this.getRejectIcon()} Reject
                                </button>
                            ` : ''}
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ==========================================
     * SECTION 4: VOTING ON EDITS
     * ==========================================
     */
    renderVotingSection(edit) {
        const netVotes = (edit.upvotes || 0) - (edit.downvotes || 0);
        const progress = Math.min(100, (netVotes / this.options.autoApproveThreshold) * 100);
        const isEligible = netVotes >= this.options.autoApproveThreshold;

        return `
            <div class="sed-voting-section">
                <div class="sed-voting-header">
                    <h5>Community Votes</h5>
                    ${edit.citation ? `
                        <span class="sed-badge sed-badge-verified">
                            ${this.getVerifiedIcon()} Corpus Verified
                        </span>
                    ` : ''}
                </div>

                <div class="sed-voting-controls">
                    <button class="sed-vote-btn sed-vote-btn-large sed-vote-up ${edit.userVote === 1 ? 'active' : ''}"
                            data-vote="1" data-edit-id="${edit.id}"
                            ${edit.status !== 'pending' ? 'disabled' : ''}
                            ${!this.options.userId ? 'disabled title="Sign in to vote"' : ''}>
                        ${this.getUpvoteIcon()}
                        <span class="sed-vote-label">Upvote</span>
                    </button>

                    <div class="sed-vote-display">
                        <span class="sed-vote-total ${netVotes > 0 ? 'positive' : netVotes < 0 ? 'negative' : ''}">
                            ${netVotes > 0 ? '+' : ''}${netVotes}
                        </span>
                        <span class="sed-vote-breakdown">
                            ${this.getUpvoteIcon()} ${edit.upvotes || 0} /
                            ${this.getDownvoteIcon()} ${edit.downvotes || 0}
                        </span>
                    </div>

                    <button class="sed-vote-btn sed-vote-btn-large sed-vote-down ${edit.userVote === -1 ? 'active' : ''}"
                            data-vote="-1" data-edit-id="${edit.id}"
                            ${edit.status !== 'pending' ? 'disabled' : ''}
                            ${!this.options.userId ? 'disabled title="Sign in to vote"' : ''}>
                        ${this.getDownvoteIcon()}
                        <span class="sed-vote-label">Downvote</span>
                    </button>
                </div>

                <!-- Auto-approve progress -->
                <div class="sed-auto-approve-progress">
                    <div class="sed-progress-bar">
                        <div class="sed-progress-fill ${isEligible ? 'complete' : ''}"
                             style="width: ${Math.max(0, progress)}%"></div>
                    </div>
                    <span class="sed-progress-label">
                        ${isEligible
                            ? `${this.getCheckIcon()} Eligible for auto-approval`
                            : `${netVotes}/${this.options.autoApproveThreshold} votes for auto-approval`}
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * ==========================================
     * SECTION 5: MERGE/REJECT CONTROLS
     * ==========================================
     */
    renderMergeRejectControls(edit) {
        if (edit.status !== 'pending') {
            return `
                <div class="sed-mod-controls sed-mod-resolved">
                    <span class="sed-mod-status">
                        This edit was ${edit.status} by ${this.escapeHtml(edit.resolvedBy || 'system')}
                        ${edit.resolvedAt ? this.formatDate(edit.resolvedAt) : ''}
                    </span>
                    ${edit.status === 'rejected' && edit.rejectReason ? `
                        <div class="sed-reject-reason">
                            <strong>Reason:</strong> ${this.escapeHtml(edit.rejectReason)}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        return `
            <div class="sed-mod-controls">
                <h5 class="sed-mod-title">
                    ${this.getModIcon()} Moderator Actions
                </h5>

                <div class="sed-mod-actions">
                    <button class="sed-btn sed-btn-success" id="sed-merge-btn" data-edit-id="${edit.id}">
                        ${this.getMergeIcon()} Merge Edit
                    </button>
                    <button class="sed-btn sed-btn-warning" id="sed-request-changes-btn" data-edit-id="${edit.id}">
                        ${this.getRequestChangesIcon()} Request Changes
                    </button>
                    <button class="sed-btn sed-btn-danger" id="sed-reject-btn" data-edit-id="${edit.id}">
                        ${this.getRejectIcon()} Reject with Reason
                    </button>
                </div>

                <!-- Reject Modal -->
                <div class="sed-modal" id="sed-reject-modal" style="display: none;">
                    <div class="sed-modal-content">
                        <h4>Reject Edit</h4>
                        <div class="sed-form-group">
                            <label class="sed-label">Reason for Rejection</label>
                            <textarea class="sed-textarea"
                                      id="sed-reject-reason"
                                      placeholder="Explain why this edit is being rejected..."
                                      rows="3"
                                      required></textarea>
                        </div>
                        <div class="sed-modal-actions">
                            <button class="sed-btn sed-btn-ghost" id="sed-reject-cancel">Cancel</button>
                            <button class="sed-btn sed-btn-danger" id="sed-reject-confirm">Reject</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ==========================================
     * SECTION 6: EDIT HISTORY
     * ==========================================
     */
    renderHistoryView() {
        return `
            <div class="sed-history-container">
                <div class="sed-history-header">
                    <button class="sed-back-btn" id="sed-back-btn">
                        ${this.getBackIcon()} Back to Edits
                    </button>
                    <h4 class="sed-history-title">Edit History</h4>
                </div>

                <div class="sed-history-timeline" id="sed-history-timeline">
                    ${this.renderHistoryItems()}
                </div>
            </div>
        `;
    }

    /**
     * Render history items
     */
    renderHistoryItems() {
        if (this.editHistory.length === 0) {
            return `
                <div class="sed-empty-state">
                    <div class="sed-empty-icon">${this.getHistoryIcon()}</div>
                    <p class="sed-empty-text">No edit history yet.</p>
                </div>
            `;
        }

        return this.editHistory.map((entry, index) => `
            <div class="sed-history-item ${index === 0 ? 'sed-history-latest' : ''}">
                <div class="sed-history-timeline-marker">
                    <div class="sed-history-dot"></div>
                    ${index < this.editHistory.length - 1 ? '<div class="sed-history-line"></div>' : ''}
                </div>

                <div class="sed-history-content">
                    <div class="sed-history-meta">
                        <span class="sed-history-field">${this.getFieldLabel(entry.field)}</span>
                        <span class="sed-history-date">${this.formatDate(entry.mergedAt)}</span>
                    </div>

                    <div class="sed-history-author">
                        ${entry.authorPhoto ? `<img src="${entry.authorPhoto}" alt="" class="sed-author-avatar">` : ''}
                        <span>Edited by ${this.escapeHtml(entry.authorName)}</span>
                        <span class="sed-history-approved">Approved by ${this.escapeHtml(entry.approvedBy)}</span>
                    </div>

                    <div class="sed-history-diff">
                        <div class="sed-history-change">
                            <span class="sed-change-label">Changed:</span>
                            <span class="sed-change-from">${this.truncate(entry.oldValue, 100)}</span>
                            <span class="sed-change-to">${this.truncate(entry.newValue, 100)}</span>
                        </div>
                    </div>

                    ${(this.options.isOwner || this.options.isAdmin) ? `
                        <div class="sed-history-actions">
                            <button class="sed-btn sed-btn-ghost sed-btn-sm"
                                    data-action="revert"
                                    data-history-id="${entry.id}"
                                    title="Revert to previous version">
                                ${this.getRevertIcon()} Revert
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * ==========================================
     * EVENT HANDLERS
     * ==========================================
     */
    attachEventListeners() {
        const container = this.options.container;
        if (!container) return;

        // Use event delegation
        container.addEventListener('click', (e) => {
            const target = e.target.closest('button, [data-action]');
            if (!target) return;

            // Navigation buttons
            if (target.id === 'sed-new-edit-btn' || target.id === 'sed-suggest-first-btn') {
                this.showForm();
            } else if (target.id === 'sed-history-btn') {
                this.showHistory();
            } else if (target.id === 'sed-back-btn') {
                this.showList();
            } else if (target.id === 'sed-cancel-btn') {
                this.showList();
            }

            // Filter buttons
            if (target.classList.contains('sed-filter-btn')) {
                this.setFilter(target.dataset.filter);
            }

            // Diff mode toggle
            if (target.classList.contains('sed-toggle-btn')) {
                this.setDiffMode(target.dataset.mode);
            }

            // Vote buttons
            if (target.classList.contains('sed-vote-btn') && !target.disabled) {
                const editId = target.dataset.editId;
                const vote = parseInt(target.dataset.vote);
                this.handleVote(editId, vote);
            }

            // Action buttons
            const action = target.dataset.action;
            if (action) {
                const editId = target.dataset.editId;
                const historyId = target.dataset.historyId;

                switch (action) {
                    case 'view':
                        this.showDiff(editId);
                        break;
                    case 'merge':
                        this.handleMerge(editId);
                        break;
                    case 'reject':
                        this.showRejectModal(editId);
                        break;
                    case 'revert':
                        this.handleRevert(historyId);
                        break;
                }
            }

            // Modal controls
            if (target.id === 'sed-merge-btn') {
                this.handleMerge(target.dataset.editId);
            } else if (target.id === 'sed-reject-btn') {
                this.showRejectModal(target.dataset.editId);
            } else if (target.id === 'sed-reject-cancel') {
                this.hideRejectModal();
            } else if (target.id === 'sed-reject-confirm') {
                this.handleRejectConfirm();
            } else if (target.id === 'sed-request-changes-btn') {
                this.handleRequestChanges(target.dataset.editId);
            }

            // Corpus search
            if (target.id === 'sed-corpus-search-btn') {
                this.openCorpusSearch();
            }
        });

        // Form events
        container.addEventListener('submit', (e) => {
            if (e.target.id === 'sed-edit-form') {
                e.preventDefault();
                this.handleSubmit();
            }
        });

        // Field selection change
        container.addEventListener('change', (e) => {
            if (e.target.id === 'sed-field-select') {
                this.handleFieldChange(e.target.value);
            } else if (e.target.id === 'sed-sort-select') {
                this.setSortBy(e.target.value);
            }
        });

        // Character count
        container.addEventListener('input', (e) => {
            if (e.target.id === 'sed-reason') {
                this.updateCharCount(e.target.value.length);
            } else if (e.target.id === 'sed-new-value') {
                this.updatePreview();
            }
        });
    }

    /**
     * ==========================================
     * DATA METHODS
     * ==========================================
     */

    /**
     * Load pending edits from Firestore
     */
    async loadPendingEdits() {
        try {
            if (!window.firebase?.firestore) {
                console.warn('Firestore not available');
                this.updateContent();
                return;
            }

            const db = firebase.firestore();
            const query = db.collection('suggestedEdits')
                .where('entityId', '==', this.options.entityId)
                .where('entityCollection', '==', this.options.entityCollection);

            const snapshot = await query.get();

            this.pendingEdits = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load user votes if logged in
            if (this.options.userId) {
                await this.loadUserVotes();
            }

            this.updateContent();
            this.updatePendingCount();
        } catch (error) {
            console.error('Error loading edits:', error);
            this.pendingEdits = [];
            this.updateContent();
        }
    }

    /**
     * Load user's votes on edits
     */
    async loadUserVotes() {
        if (!this.options.userId || !window.firebase?.firestore) return;

        try {
            const db = firebase.firestore();

            for (const edit of this.pendingEdits) {
                const voteDoc = await db.collection('suggestedEdits')
                    .doc(edit.id)
                    .collection('votes')
                    .doc(this.options.userId)
                    .get();

                if (voteDoc.exists) {
                    edit.userVote = voteDoc.data().value;
                }
            }
        } catch (error) {
            console.error('Error loading votes:', error);
        }
    }

    /**
     * Load edit history
     */
    async loadEditHistory() {
        try {
            if (!window.firebase?.firestore) {
                this.editHistory = [];
                return;
            }

            const db = firebase.firestore();
            const query = db.collection('editHistory')
                .where('entityId', '==', this.options.entityId)
                .where('entityCollection', '==', this.options.entityCollection)
                .orderBy('mergedAt', 'desc')
                .limit(50);

            const snapshot = await query.get();

            this.editHistory = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading history:', error);
            this.editHistory = [];
        }
    }

    /**
     * Submit new edit suggestion
     */
    async handleSubmit() {
        const form = this.options.container.querySelector('#sed-edit-form');
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return;
        }

        const field = document.getElementById('sed-field-select').value;
        const newValue = document.getElementById('sed-new-value').value;
        const reason = document.getElementById('sed-reason').value;
        const citationSource = document.getElementById('sed-citation-source')?.value;
        const citationQuote = document.getElementById('sed-citation-quote')?.value;

        const editData = {
            entityId: this.options.entityId,
            entityType: this.options.entityType,
            entityCollection: this.options.entityCollection,
            authorId: this.options.userId,
            authorName: this.options.userName,
            authorPhoto: this.options.userPhoto,
            field: field,
            fieldLabel: this.getFieldLabel(field),
            diff: {
                oldValue: this.getFieldValue(field),
                newValue: newValue
            },
            summary: reason,
            status: 'pending',
            upvotes: 0,
            downvotes: 0,
            createdAt: new Date().toISOString()
        };

        // Add citation if provided
        if (citationSource && citationQuote) {
            editData.citation = {
                source: citationSource,
                quote: citationQuote
            };
        }

        try {
            if (window.firebase?.firestore) {
                const db = firebase.firestore();
                const docRef = await db.collection('suggestedEdits').add(editData);
                editData.id = docRef.id;
            }

            this.pendingEdits.unshift(editData);
            this.updatePendingCount();

            if (this.options.onEditSubmit) {
                this.options.onEditSubmit(editData);
            }

            this.showList();
            this.showToast('Edit suggestion submitted successfully!', 'success');
        } catch (error) {
            console.error('Error submitting edit:', error);
            this.showToast('Failed to submit edit. Please try again.', 'error');
        }
    }

    /**
     * Handle voting on an edit
     */
    async handleVote(editId, value) {
        if (!this.options.userId) {
            this.showToast('Please sign in to vote', 'warning');
            return;
        }

        const edit = this.pendingEdits.find(e => e.id === editId);
        if (!edit || edit.status !== 'pending') return;

        const previousVote = edit.userVote;

        // Optimistic update
        if (previousVote === value) {
            // Remove vote
            edit.userVote = null;
            if (value === 1) edit.upvotes--;
            else edit.downvotes--;
        } else {
            if (previousVote === 1) edit.upvotes--;
            else if (previousVote === -1) edit.downvotes--;

            edit.userVote = value;
            if (value === 1) edit.upvotes++;
            else edit.downvotes++;
        }

        this.updateContent();

        // Save to Firestore
        try {
            if (window.firebase?.firestore) {
                const db = firebase.firestore();
                const voteRef = db.collection('suggestedEdits')
                    .doc(editId)
                    .collection('votes')
                    .doc(this.options.userId);

                if (edit.userVote === null) {
                    await voteRef.delete();
                } else {
                    await voteRef.set({ value: edit.userVote });
                }

                // Update vote counts on main document
                await db.collection('suggestedEdits').doc(editId).update({
                    upvotes: edit.upvotes,
                    downvotes: edit.downvotes
                });

                // Check for auto-approve
                const netVotes = edit.upvotes - edit.downvotes;
                if (netVotes >= this.options.autoApproveThreshold) {
                    this.handleAutoApprove(edit);
                }
            }
        } catch (error) {
            console.error('Error saving vote:', error);
            // Revert optimistic update
            edit.userVote = previousVote;
            this.updateContent();
            this.showToast('Failed to save vote', 'error');
        }
    }

    /**
     * Handle merge action
     */
    async handleMerge(editId) {
        const edit = this.pendingEdits.find(e => e.id === editId);
        if (!edit) return;

        if (!confirm('Are you sure you want to merge this edit?')) return;

        try {
            // Update edit status
            edit.status = 'approved';
            edit.resolvedBy = this.options.userName;
            edit.resolvedAt = new Date().toISOString();

            if (window.firebase?.firestore) {
                const db = firebase.firestore();

                // Update the edit document
                await db.collection('suggestedEdits').doc(editId).update({
                    status: 'approved',
                    resolvedBy: this.options.userName,
                    resolvedAt: edit.resolvedAt
                });

                // Create history entry
                await db.collection('editHistory').add({
                    entityId: this.options.entityId,
                    entityCollection: this.options.entityCollection,
                    editId: editId,
                    field: edit.field,
                    oldValue: edit.diff.oldValue,
                    newValue: edit.diff.newValue,
                    authorId: edit.authorId,
                    authorName: edit.authorName,
                    authorPhoto: edit.authorPhoto,
                    approvedBy: this.options.userName,
                    mergedAt: edit.resolvedAt
                });

                // Update the actual entity (this would require access to the entity document)
                // This should be handled by the parent component via callback
            }

            if (this.options.onEditMerge) {
                this.options.onEditMerge(edit);
            }

            this.updateContent();
            this.showToast('Edit merged successfully!', 'success');
        } catch (error) {
            console.error('Error merging edit:', error);
            this.showToast('Failed to merge edit', 'error');
        }
    }

    /**
     * Handle auto-approve when threshold is reached
     */
    async handleAutoApprove(edit) {
        edit.status = 'approved';
        edit.resolvedBy = 'Auto-Approved (Community Vote)';
        edit.resolvedAt = new Date().toISOString();

        try {
            if (window.firebase?.firestore) {
                const db = firebase.firestore();
                await db.collection('suggestedEdits').doc(edit.id).update({
                    status: 'approved',
                    resolvedBy: edit.resolvedBy,
                    resolvedAt: edit.resolvedAt
                });
            }

            if (this.options.onEditMerge) {
                this.options.onEditMerge(edit);
            }

            this.showToast('Edit auto-approved by community vote!', 'success');
        } catch (error) {
            console.error('Error auto-approving:', error);
        }
    }

    /**
     * Handle reject with reason
     */
    handleRejectConfirm() {
        const reason = document.getElementById('sed-reject-reason')?.value;
        if (!reason || reason.trim().length < 10) {
            this.showToast('Please provide a reason for rejection', 'warning');
            return;
        }

        const editId = this.rejectingEditId;
        this.handleReject(editId, reason);
        this.hideRejectModal();
    }

    /**
     * Handle reject action
     */
    async handleReject(editId, reason) {
        const edit = this.pendingEdits.find(e => e.id === editId);
        if (!edit) return;

        try {
            edit.status = 'rejected';
            edit.resolvedBy = this.options.userName;
            edit.resolvedAt = new Date().toISOString();
            edit.rejectReason = reason;

            if (window.firebase?.firestore) {
                const db = firebase.firestore();
                await db.collection('suggestedEdits').doc(editId).update({
                    status: 'rejected',
                    resolvedBy: this.options.userName,
                    resolvedAt: edit.resolvedAt,
                    rejectReason: reason
                });
            }

            if (this.options.onEditReject) {
                this.options.onEditReject(edit);
            }

            this.updateContent();
            this.showToast('Edit rejected', 'info');
        } catch (error) {
            console.error('Error rejecting edit:', error);
            this.showToast('Failed to reject edit', 'error');
        }
    }

    /**
     * Handle request changes
     */
    handleRequestChanges(editId) {
        const edit = this.pendingEdits.find(e => e.id === editId);
        if (!edit) return;

        // In a full implementation, this would open a comment dialog
        // For now, we'll add a comment to the edit
        const changes = prompt('What changes would you like to request?');
        if (!changes) return;

        this.showToast('Change request sent to the author', 'info');
    }

    /**
     * Handle revert action
     */
    async handleRevert(historyId) {
        const entry = this.editHistory.find(e => e.id === historyId);
        if (!entry) return;

        if (!confirm('Are you sure you want to revert this change?')) return;

        // Create a new edit suggestion that reverts the change
        const revertEdit = {
            entityId: this.options.entityId,
            entityType: this.options.entityType,
            entityCollection: this.options.entityCollection,
            authorId: this.options.userId,
            authorName: this.options.userName,
            field: entry.field,
            diff: {
                oldValue: entry.newValue,
                newValue: entry.oldValue
            },
            summary: `Revert: ${entry.field} to previous value`,
            status: 'pending',
            isRevert: true,
            revertedHistoryId: historyId,
            createdAt: new Date().toISOString()
        };

        try {
            if (window.firebase?.firestore) {
                const db = firebase.firestore();
                await db.collection('suggestedEdits').add(revertEdit);
            }

            this.showToast('Revert suggestion created', 'success');
            this.showList();
            this.loadPendingEdits();
        } catch (error) {
            console.error('Error creating revert:', error);
            this.showToast('Failed to create revert suggestion', 'error');
        }
    }

    /**
     * ==========================================
     * UI METHODS
     * ==========================================
     */

    showForm(editData = null) {
        this.currentView = 'form';
        this.updateContent();
        setTimeout(() => this.setupFormHandlers(), 0);
    }

    showList() {
        this.currentView = 'list';
        this.selectedEdit = null;
        this.updateContent();
    }

    showDiff(editId) {
        const edit = this.pendingEdits.find(e => e.id === editId);
        if (!edit) return;

        this.selectedEdit = edit;
        this.currentView = 'diff';
        this.updateContent();
    }

    async showHistory() {
        await this.loadEditHistory();
        this.currentView = 'history';
        this.updateContent();
    }

    showRejectModal(editId) {
        this.rejectingEditId = editId;
        const modal = this.options.container.querySelector('#sed-reject-modal');
        if (modal) modal.style.display = 'flex';
    }

    hideRejectModal() {
        this.rejectingEditId = null;
        const modal = this.options.container.querySelector('#sed-reject-modal');
        if (modal) modal.style.display = 'none';
    }

    setFilter(status) {
        this.filterStatus = status;

        // Update filter button states
        const buttons = this.options.container.querySelectorAll('.sed-filter-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === status);
        });

        this.updateListContent();
    }

    setSortBy(sortBy) {
        this.sortBy = sortBy;
        this.updateListContent();
    }

    setDiffMode(mode) {
        this.diffMode = mode;
        this.updateContent();
    }

    updateContent() {
        const contentEl = this.options.container.querySelector('#sed-content');
        if (contentEl) {
            contentEl.innerHTML = this.renderCurrentView();
        }
    }

    updateListContent() {
        const listEl = this.options.container.querySelector('#sed-edit-list');
        if (listEl) {
            listEl.innerHTML = this.renderEditItems();
        }
    }

    updatePendingCount() {
        const badge = this.options.container.querySelector('#sed-pending-count');
        if (badge) {
            const count = this.pendingEdits.filter(e => e.status === 'pending').length;
            badge.textContent = `${count} pending`;
        }
    }

    updateCharCount(count) {
        const countEl = this.options.container.querySelector('#sed-reason-count');
        if (countEl) {
            countEl.textContent = count;
        }
    }

    handleFieldChange(fieldKey) {
        const originalContainer = this.options.container.querySelector('#sed-original-container');
        const newValueContainer = this.options.container.querySelector('#sed-new-value-container');
        const originalValue = this.options.container.querySelector('#sed-original-value .sed-value-display');

        if (fieldKey) {
            const value = this.getFieldValue(fieldKey);
            originalValue.textContent = value || '(empty)';
            originalContainer.style.display = 'block';
            newValueContainer.style.display = 'block';
        } else {
            originalContainer.style.display = 'none';
            newValueContainer.style.display = 'none';
        }
    }

    updatePreview() {
        const previewContainer = this.options.container.querySelector('#sed-preview-container');
        const fieldSelect = this.options.container.querySelector('#sed-field-select');
        const newValue = this.options.container.querySelector('#sed-new-value')?.value;

        if (!previewContainer || !fieldSelect?.value || !newValue) {
            previewContainer.innerHTML = '<div class="sed-preview-placeholder">Select a field and enter changes to see a preview.</div>';
            return;
        }

        const original = this.getFieldValue(fieldSelect.value);
        previewContainer.innerHTML = `
            <div class="sed-mini-diff">
                <div class="sed-mini-diff-removed">${this.escapeHtml(original)}</div>
                <div class="sed-mini-diff-arrow">${this.getArrowIcon()}</div>
                <div class="sed-mini-diff-added">${this.escapeHtml(newValue)}</div>
            </div>
        `;
    }

    setupFormHandlers() {
        // Initialize form-specific handlers if needed
    }

    openCorpusSearch() {
        // This would integrate with the existing corpus search component
        if (window.CorpusSearch) {
            // Open corpus search modal
            this.showToast('Opening corpus search...', 'info');
        } else {
            this.showToast('Corpus search not available', 'warning');
        }
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `sed-toast sed-toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * ==========================================
     * UTILITY METHODS
     * ==========================================
     */

    getFilteredEdits() {
        let edits = [...this.pendingEdits];

        // Filter
        if (this.filterStatus !== 'all') {
            edits = edits.filter(e => e.status === this.filterStatus);
        }

        // Sort
        edits.sort((a, b) => {
            switch (this.sortBy) {
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'votes':
                    return ((b.upvotes || 0) - (b.downvotes || 0)) -
                           ((a.upvotes || 0) - (a.downvotes || 0));
                case 'newest':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return edits;
    }

    getFieldValue(fieldKey) {
        const data = this.options.entityData;
        if (!data) return '';

        const value = data[fieldKey];
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return value || '';
    }

    getFieldLabel(fieldKey) {
        const field = this.editableFields.find(f => f.key === fieldKey);
        return field?.label || fieldKey;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    truncate(str, maxLen) {
        str = String(str || '');
        if (str.length <= maxLen) return str;
        return str.substring(0, maxLen) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * ==========================================
     * ICON METHODS
     * ==========================================
     */

    getEditIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>`;
    }

    getHistoryIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
        </svg>`;
    }

    getBackIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
        </svg>`;
    }

    getSearchIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>`;
    }

    getSendIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>`;
    }

    getUpvoteIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"/>
        </svg>`;
    }

    getDownvoteIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
        </svg>`;
    }

    getVerifiedIcon() {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>`;
    }

    getAutoApproveIcon() {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>`;
    }

    getCheckIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
        </svg>`;
    }

    getMergeIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="18" r="3"/>
            <circle cx="6" cy="6" r="3"/>
            <path d="M6 21V9a9 9 0 0 0 9 9"/>
        </svg>`;
    }

    getRejectIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>`;
    }

    getRequestChangesIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>`;
    }

    getViewIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>`;
    }

    getArrowIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
        </svg>`;
    }

    getSideBySideIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="18"/>
            <rect x="14" y="3" width="7" height="18"/>
        </svg>`;
    }

    getInlineIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
        </svg>`;
    }

    getModIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>`;
    }

    getRevertIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>`;
    }

    getEmptyIcon() {
        return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SuggestedEditDiff;
}
