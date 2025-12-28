/**
 * User Feedback Widget
 * Allows users to report issues and provide feedback
 */

import * as Sentry from '@sentry/browser';
import { captureMessage, addBreadcrumb } from '../error-monitoring.js';

export class FeedbackWidget {
  constructor() {
    this.isVisible = false;
    this.createWidget();
    this.setupEventListeners();
  }

  /**
   * Create the feedback button
   */
  createWidget() {
    // Create feedback button
    const button = document.createElement('button');
    button.id = 'feedback-button';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
      <span>Feedback</span>
    `;
    button.className = 'feedback-button';
    button.setAttribute('aria-label', 'Send Feedback');
    button.onclick = () => this.showFeedbackDialog();

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .feedback-button {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50px;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        cursor: pointer;
        font-weight: 600;
        font-size: 0.875rem;
        transition: all 0.3s ease;
        z-index: 9999;
      }

      .feedback-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 30px rgba(102, 126, 234, 0.5);
      }

      .feedback-button svg {
        width: 20px;
        height: 20px;
      }

      .feedback-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .feedback-content {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .feedback-content h2 {
        margin: 0 0 1rem 0;
        color: #1a1a1a;
        font-size: 1.5rem;
      }

      .feedback-content p {
        color: #666;
        margin-bottom: 1.5rem;
        line-height: 1.6;
      }

      .feedback-type-selector {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .feedback-type-button {
        padding: 1rem;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
      }

      .feedback-type-button:hover {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.05);
      }

      .feedback-type-button.active {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }

      .feedback-type-button .icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .feedback-type-button .label {
        font-weight: 600;
        color: #1a1a1a;
      }

      .feedback-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.875rem;
        margin-bottom: 1rem;
        transition: border-color 0.2s ease;
      }

      .feedback-input:focus {
        outline: none;
        border-color: #667eea;
      }

      .feedback-textarea {
        min-height: 120px;
        resize: vertical;
      }

      .feedback-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }

      .feedback-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .feedback-btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .feedback-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .feedback-btn-secondary {
        background: transparent;
        color: #666;
        border: 2px solid #e0e0e0;
      }

      .feedback-btn-secondary:hover {
        border-color: #667eea;
        color: #667eea;
      }

      .feedback-success {
        text-align: center;
        padding: 2rem;
      }

      .feedback-success .icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      @media (max-width: 768px) {
        .feedback-button span {
          display: none;
        }

        .feedback-button {
          width: 48px;
          height: 48px;
          padding: 0;
          justify-content: center;
          border-radius: 50%;
        }

        .feedback-type-selector {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(button);

    console.log('[FeedbackWidget] Widget created');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.closeFeedback();
      }
    });
  }

  /**
   * Show feedback dialog
   */
  showFeedbackDialog() {
    const eventId = Sentry.lastEventId();

    addBreadcrumb('user_interaction', 'Opened feedback dialog');

    if (eventId) {
      // Show Sentry's built-in error report dialog
      this.showSentryDialog(eventId);
    } else {
      // Show custom feedback form
      this.showGeneralFeedback();
    }
  }

  /**
   * Show Sentry's error report dialog
   * @param {string} eventId - Sentry event ID
   */
  showSentryDialog(eventId) {
    try {
      const user = window.firebase?.auth()?.currentUser;

      Sentry.showReportDialog({
        eventId,
        user: {
          email: user?.email || '',
          name: user?.displayName || ''
        },
        title: 'It looks like we\'re having issues.',
        subtitle: 'Our team has been notified.',
        subtitle2: 'If you\'d like to help, tell us what happened below.',
        labelName: 'Name',
        labelEmail: 'Email',
        labelComments: 'What happened?',
        labelClose: 'Close',
        labelSubmit: 'Submit',
        errorGeneric: 'An error occurred while submitting your report. Please try again.',
        errorFormEntry: 'Some fields were invalid. Please correct the errors and try again.',
        successMessage: 'Your feedback has been sent. Thank you!',
      });

      this.isVisible = true;
    } catch (error) {
      console.error('[FeedbackWidget] Error showing Sentry dialog:', error);
      this.showGeneralFeedback();
    }
  }

  /**
   * Show custom feedback form
   */
  showGeneralFeedback() {
    const modal = document.createElement('div');
    modal.className = 'feedback-modal';
    modal.id = 'feedback-modal';
    modal.innerHTML = `
      <div class="feedback-content">
        <h2>📣 Send Feedback</h2>
        <p>Help us improve Eyes of Azrael by sharing your thoughts.</p>

        <div class="feedback-type-selector">
          <button class="feedback-type-button active" data-type="general">
            <div class="icon">💬</div>
            <div class="label">General</div>
          </button>
          <button class="feedback-type-button" data-type="bug">
            <div class="icon">🐛</div>
            <div class="label">Bug Report</div>
          </button>
          <button class="feedback-type-button" data-type="feature">
            <div class="icon">✨</div>
            <div class="label">Feature Request</div>
          </button>
          <button class="feedback-type-button" data-type="content">
            <div class="icon">📚</div>
            <div class="label">Content</div>
          </button>
        </div>

        <input
          type="email"
          id="feedback-email"
          class="feedback-input"
          placeholder="Your email (optional)"
          value="${window.firebase?.auth()?.currentUser?.email || ''}"
        />

        <textarea
          id="feedback-text"
          class="feedback-input feedback-textarea"
          placeholder="Tell us what you think..."
          required
        ></textarea>

        <div class="feedback-actions">
          <button class="feedback-btn feedback-btn-secondary" onclick="window.feedbackWidget.closeFeedback()">
            Cancel
          </button>
          <button class="feedback-btn feedback-btn-primary" onclick="window.feedbackWidget.submitFeedback()">
            Send Feedback
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.isVisible = true;

    // Setup type selector
    modal.querySelectorAll('.feedback-type-button').forEach(button => {
      button.addEventListener('click', (e) => {
        modal.querySelectorAll('.feedback-type-button').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeFeedback();
      }
    });

    // Focus textarea
    setTimeout(() => {
      document.getElementById('feedback-text')?.focus();
    }, 100);
  }

  /**
   * Submit feedback
   */
  async submitFeedback() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;

    const email = document.getElementById('feedback-email')?.value || '';
    const text = document.getElementById('feedback-text')?.value || '';
    const type = modal.querySelector('.feedback-type-button.active')?.dataset.type || 'general';

    if (!text.trim()) {
      alert('Please enter your feedback.');
      return;
    }

    try {
      // Send to Sentry
      await captureMessage(`User Feedback (${type}): ${text}`, 'info', {
        tags: {
          type: 'user_feedback',
          feedback_type: type,
        },
        user: email ? { email } : undefined,
        extra: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }
      });

      addBreadcrumb('user_interaction', 'Submitted feedback', {
        type,
        hasEmail: !!email,
      });

      // Show success message
      this.showSuccessMessage();

    } catch (error) {
      console.error('[FeedbackWidget] Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;

    const content = modal.querySelector('.feedback-content');
    if (!content) return;

    content.innerHTML = `
      <div class="feedback-success">
        <div class="icon">✅</div>
        <h2>Thank you!</h2>
        <p>Your feedback has been sent. We appreciate your help in making Eyes of Azrael better.</p>
        <button class="feedback-btn feedback-btn-primary" onclick="window.feedbackWidget.closeFeedback()">
          Close
        </button>
      </div>
    `;

    // Auto-close after 3 seconds
    setTimeout(() => {
      this.closeFeedback();
    }, 3000);
  }

  /**
   * Close feedback modal
   */
  closeFeedback() {
    const modal = document.getElementById('feedback-modal');
    if (modal) {
      modal.remove();
      this.isVisible = false;

      addBreadcrumb('user_interaction', 'Closed feedback dialog');
    }
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.feedbackWidget = new FeedbackWidget();
}
