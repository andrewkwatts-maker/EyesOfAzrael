/**
 * Editable Panel System
 * Eyes of Azrael - User Submission & Edit System
 *
 * Features:
 * - Edit icon for user-created content (top-right)
 * - + button for new submissions
 * - Inline editing with frosted glass modal
 * - Firebase submission handling
 * - User authentication check
 * - Expandable submissions panel
 */

class EditablePanelSystem {
  constructor(firebaseApp) {
    this.app = firebaseApp;
    this.db = firebase.firestore();
    this.auth = firebase.auth();
    this.currentUser = null;
    this.editMode = false;

    // Track auth state
    this.auth.onAuthStateChanged(user => {
      this.currentUser = user;
      this.updateEditIcons();
    });
  }

  /**
   * Initialize editable panel on an existing panel
   * @param {HTMLElement} panel - The panel element
   * @param {Object} config - Configuration
   */
  initEditablePanel(panel, config = {}) {
    const {
      contentType, // 'deity', 'myth', 'ritual', etc.
      documentId,   // Firestore document ID
      canEdit = false, // User created this content
      canSubmitAppendment = true, // Can submit additional info
      collection = 'deities' // Firestore collection
    } = config;

    panel.classList.add('editable-panel');
    panel.dataset.contentType = contentType;
    panel.dataset.documentId = documentId;
    panel.dataset.collection = collection;

    // Add edit icon if user owns this content
    if (canEdit && this.currentUser) {
      this.addEditIcon(panel, config);
    }

    // Add submission button if appendments allowed
    if (canSubmitAppendment) {
      this.addSubmissionButton(panel, config);
    }

    // Add submissions display if any exist
    this.loadSubmissions(panel, config);
  }

  /**
   * Add edit icon to panel (top-right)
   */
  addEditIcon(panel, config) {
    const existingIcon = panel.querySelector('.panel-edit-icon');
    if (existingIcon) return;

    const editIcon = document.createElement('button');
    editIcon.className = 'panel-edit-icon';
    editIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `;
    editIcon.title = 'Edit your submission';

    editIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      this.enterEditMode(panel, config);
    });

    // Position in top-right
    panel.style.position = 'relative';
    panel.appendChild(editIcon);
  }

  /**
   * Add submission button (+ icon)
   */
  addSubmissionButton(panel, config) {
    const existingBtn = panel.querySelector('.panel-submission-btn');
    if (existingBtn) return;

    const submissionBtn = document.createElement('button');
    submissionBtn.className = 'panel-submission-btn';
    submissionBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Add Submission</span>
    `;
    submissionBtn.title = 'Submit additional information';

    submissionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.currentUser) {
        this.showLoginPrompt();
        return;
      }
      this.openSubmissionModal(panel, config);
    });

    panel.appendChild(submissionBtn);
  }

  /**
   * Enter edit mode for panel
   */
  async enterEditMode(panel, config) {
    if (!this.currentUser) {
      this.showLoginPrompt();
      return;
    }

    // Get current content from Firestore
    const doc = await this.db.collection(config.collection)
      .doc(config.documentId)
      .get();

    if (!doc.exists) {
      this.showError('Content not found');
      return;
    }

    const data = doc.data();

    // Create edit modal
    this.showEditModal(panel, data, config);
  }

  /**
   * Show edit modal with form
   */
  showEditModal(panel, currentData, config) {
    const modal = this.createModal('Edit Content');

    const form = document.createElement('form');
    form.className = 'edit-panel-form';
    form.innerHTML = this.generateFormHTML(currentData, config);

    // Submit handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveEdit(form, config, modal);
    });

    modal.querySelector('.modal-body').appendChild(form);
    document.body.appendChild(modal);
  }

  /**
   * Open submission modal for new content
   */
  openSubmissionModal(panel, config) {
    const modal = this.createModal('Submit Additional Information');

    const form = document.createElement('form');
    form.className = 'submission-panel-form';
    form.innerHTML = this.generateSubmissionFormHTML(config);

    // Submit handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveSubmission(form, config, modal);
    });

    modal.querySelector('.modal-body').appendChild(form);
    document.body.appendChild(modal);
  }

  /**
   * Generate form HTML based on content type
   */
  generateFormHTML(data, config) {
    const fields = this.getFieldsForContentType(config.contentType);

    let html = '';
    fields.forEach(field => {
      const value = data[field.key] || '';

      if (field.type === 'textarea') {
        html += `
          <div class="form-group">
            <label for="${field.key}">${field.label}</label>
            <textarea id="${field.key}" name="${field.key}" rows="4" required>${value}</textarea>
          </div>
        `;
      } else if (field.type === 'array') {
        html += `
          <div class="form-group">
            <label for="${field.key}">${field.label}</label>
            <input type="text" id="${field.key}" name="${field.key}"
                   value="${Array.isArray(value) ? value.join(', ') : value}"
                   placeholder="Comma-separated values">
          </div>
        `;
      } else {
        html += `
          <div class="form-group">
            <label for="${field.key}">${field.label}</label>
            <input type="${field.type || 'text'}" id="${field.key}" name="${field.key}"
                   value="${value}" ${field.required ? 'required' : ''}>
          </div>
        `;
      }
    });

    html += `
      <div class="form-actions">
        <button type="button" class="btn-cancel">Cancel</button>
        <button type="submit" class="btn-submit">Save Changes</button>
      </div>
    `;

    return html;
  }

  /**
   * Generate submission form HTML
   */
  generateSubmissionFormHTML(config) {
    return `
      <div class="form-group">
        <label for="submission-title">Title</label>
        <input type="text" id="submission-title" name="title" required placeholder="Brief title for your submission">
      </div>
      <div class="form-group">
        <label for="submission-content">Content</label>
        <textarea id="submission-content" name="content" rows="6" required placeholder="Your additional information, insights, or corrections..."></textarea>
      </div>
      <div class="form-group">
        <label for="submission-sources">Sources (optional)</label>
        <input type="text" id="submission-sources" name="sources" placeholder="Citations or references">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-cancel">Cancel</button>
        <button type="submit" class="btn-submit">Submit</button>
      </div>
    `;
  }

  /**
   * Save edited content to Firebase
   */
  async saveEdit(form, config, modal) {
    if (!this.currentUser) {
      this.showError('You must be logged in to edit');
      return;
    }

    const formData = new FormData(form);
    const updates = {};

    // Convert form data to object
    for (const [key, value] of formData.entries()) {
      // Handle arrays (comma-separated)
      if (value.includes(',')) {
        updates[key] = value.split(',').map(v => v.trim());
      } else {
        updates[key] = value;
      }
    }

    // Add metadata
    updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    updates.updatedBy = this.currentUser.uid;

    try {
      // Update Firestore
      await this.db.collection(config.collection)
        .doc(config.documentId)
        .update(updates);

      this.showSuccess('Content updated successfully!');
      this.closeModal(modal);

      // Reload page to show changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error updating content:', error);
      this.showError('Failed to update content: ' + error.message);
    }
  }

  /**
   * Save submission to Firebase
   */
  async saveSubmission(form, config, modal) {
    if (!this.currentUser) {
      this.showError('You must be logged in to submit');
      return;
    }

    const formData = new FormData(form);
    const submission = {
      title: formData.get('title'),
      content: formData.get('content'),
      sources: formData.get('sources'),
      parentCollection: config.collection,
      parentDocumentId: config.documentId,
      contentType: config.contentType,
      submittedBy: this.currentUser.uid,
      submittedByEmail: this.currentUser.email,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending', // Admin approval required
      upvotes: 0,
      downvotes: 0
    };

    try {
      // Add to submissions collection
      const docRef = await this.db.collection('submissions').add(submission);

      this.showSuccess('Submission received! It will be reviewed by moderators.');
      this.closeModal(modal);

      // Reload to show in submissions panel
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error saving submission:', error);
      this.showError('Failed to submit: ' + error.message);
    }
  }

  /**
   * Load and display submissions for this content
   */
  async loadSubmissions(panel, config) {
    try {
      const submissions = await this.db.collection('submissions')
        .where('parentCollection', '==', config.collection)
        .where('parentDocumentId', '==', config.documentId)
        .where('status', '==', 'approved')
        .orderBy('submittedAt', 'desc')
        .get();

      if (submissions.empty) return;

      // Create submissions panel
      const submissionsPanel = this.createSubmissionsPanel(submissions.docs);
      panel.appendChild(submissionsPanel);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  }

  /**
   * Create expandable submissions panel
   */
  createSubmissionsPanel(submissions) {
    const panel = document.createElement('div');
    panel.className = 'submissions-panel expandable';

    const header = document.createElement('div');
    header.className = 'submissions-header';
    header.innerHTML = `
      <h4>Community Submissions (${submissions.length})</h4>
      <svg class="expand-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    const content = document.createElement('div');
    content.className = 'submissions-content';

    submissions.forEach(doc => {
      const data = doc.data();
      const submissionCard = this.createSubmissionCard(doc.id, data);
      content.appendChild(submissionCard);
    });

    header.addEventListener('click', () => {
      panel.classList.toggle('expanded');
    });

    panel.appendChild(header);
    panel.appendChild(content);

    return panel;
  }

  /**
   * Create individual submission card
   */
  createSubmissionCard(id, data) {
    const card = document.createElement('div');
    card.className = 'submission-card frosted-glass';

    const isOwnSubmission = this.currentUser && data.submittedBy === this.currentUser.uid;

    card.innerHTML = `
      <div class="submission-header">
        <h5>${data.title}</h5>
        ${isOwnSubmission ? `<button class="edit-submission-btn" data-id="${id}">✎</button>` : ''}
      </div>
      <div class="submission-body">
        <p>${data.content}</p>
        ${data.sources ? `<p class="submission-sources"><strong>Sources:</strong> ${data.sources}</p>` : ''}
      </div>
      <div class="submission-meta">
        <span class="submitted-by">By ${data.submittedByEmail || 'Anonymous'}</span>
        <span class="submitted-date">${this.formatDate(data.submittedAt)}</span>
      </div>
    `;

    // Add edit handler for own submissions
    if (isOwnSubmission) {
      card.querySelector('.edit-submission-btn').addEventListener('click', () => {
        this.editSubmission(id, data);
      });
    }

    return card;
  }

  /**
   * Edit existing submission
   */
  async editSubmission(id, currentData) {
    const modal = this.createModal('Edit Submission');

    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-group">
        <label for="edit-title">Title</label>
        <input type="text" id="edit-title" name="title" value="${currentData.title}" required>
      </div>
      <div class="form-group">
        <label for="edit-content">Content</label>
        <textarea id="edit-content" name="content" rows="6" required>${currentData.content}</textarea>
      </div>
      <div class="form-group">
        <label for="edit-sources">Sources</label>
        <input type="text" id="edit-sources" name="sources" value="${currentData.sources || ''}">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-cancel">Cancel</button>
        <button type="submit" class="btn-submit">Save Changes</button>
      </div>
    `;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      try {
        await this.db.collection('submissions').doc(id).update({
          title: formData.get('title'),
          content: formData.get('content'),
          sources: formData.get('sources'),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        this.showSuccess('Submission updated!');
        this.closeModal(modal);
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        this.showError('Failed to update: ' + error.message);
      }
    });

    modal.querySelector('.modal-body').appendChild(form);
    document.body.appendChild(modal);
  }

  /**
   * Create modal container
   */
  createModal(title) {
    const modal = document.createElement('div');
    modal.className = 'editable-panel-modal frosted-glass';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body"></div>
      </div>
    `;

    // Close handlers
    modal.querySelector('.modal-close').addEventListener('click', () => {
      this.closeModal(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal(modal);
    });

    // Cancel button handler
    setTimeout(() => {
      const cancelBtn = modal.querySelector('.btn-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.closeModal(modal));
      }
    }, 100);

    return modal;
  }

  /**
   * Close modal
   */
  closeModal(modal) {
    modal.classList.add('closing');
    setTimeout(() => modal.remove(), 300);
  }

  /**
   * Update edit icons based on auth state
   */
  updateEditIcons() {
    const panels = document.querySelectorAll('.editable-panel');
    panels.forEach(panel => {
      // Re-initialize based on current user
      const config = {
        contentType: panel.dataset.contentType,
        documentId: panel.dataset.documentId,
        collection: panel.dataset.collection
      };

      // Check if user owns this content
      this.checkOwnership(panel, config);
    });
  }

  /**
   * Check if current user owns content
   */
  async checkOwnership(panel, config) {
    if (!this.currentUser) return;

    try {
      const doc = await this.db.collection(config.collection)
        .doc(config.documentId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        if (data.createdBy === this.currentUser.uid) {
          this.addEditIcon(panel, config);
        }
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  }

  /**
   * Get fields for content type
   */
  getFieldsForContentType(contentType) {
    const fields = {
      deity: [
        { key: 'displayName', label: 'Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        { key: 'domains', label: 'Domains', type: 'array' },
        { key: 'symbols', label: 'Symbols', type: 'array' },
        { key: 'mythology', label: 'Mythology', type: 'text', required: true }
      ],
      myth: [
        { key: 'displayName', label: 'Title', type: 'text', required: true },
        { key: 'description', label: 'Story', type: 'textarea', required: true },
        { key: 'characters', label: 'Characters', type: 'array' },
        { key: 'themes', label: 'Themes', type: 'array' }
      ],
      ritual: [
        { key: 'displayName', label: 'Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        { key: 'purpose', label: 'Purpose', type: 'text' },
        { key: 'steps', label: 'Steps', type: 'textarea' }
      ]
    };

    return fields[contentType] || [
      { key: 'displayName', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true }
    ];
  }

  /**
   * Show login prompt
   */
  showLoginPrompt() {
    const modal = this.createModal('Login Required');
    modal.querySelector('.modal-body').innerHTML = `
      <p>You must be logged in to edit or submit content.</p>
      <div class="form-actions">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-submit" onclick="window.location.href='/login.html'">Login</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} frosted-glass`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Format date for display
   */
  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

// Export for use in other scripts
window.EditablePanelSystem = EditablePanelSystem;
