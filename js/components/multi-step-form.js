/**
 * Multi-Step Form Component
 * A reusable progress indicator and navigation system for multi-step forms
 * Eyes of Azrael - Polished Form System
 */

window.MultiStepForm = (function() {
    'use strict';

    /**
     * MultiStepForm class
     * Creates a polished multi-step form experience with progress tracking
     */
    class MultiStepForm {
        constructor(form, options = {}) {
            this.form = typeof form === 'string' ? document.querySelector(form) : form;
            if (!this.form) {
                console.warn('[MultiStepForm] Form not found');
                return;
            }

            this.options = {
                // Step configuration
                stepsSelector: '[data-step], .form-step',
                progressContainer: null, // Will be created if not provided
                validateBeforeNext: true,

                // Animation
                animateTransitions: true,
                transitionDuration: 300,

                // Navigation
                showPrevNext: true,
                allowStepClick: true, // Click on completed steps to navigate
                autoFocusFirst: true,

                // Callbacks
                onStepChange: null,
                onStepValidate: null,
                onComplete: null,

                // Draft saving
                enableDrafts: false,
                draftStorageKey: null,

                // Labels
                prevLabel: 'Previous',
                nextLabel: 'Next',
                submitLabel: 'Submit',

                ...options
            };

            this.steps = [];
            this.currentStep = 0;
            this.isAnimating = false;
            this.validator = this.form._validator || null;
            this.draftManager = null;

            this.init();
        }

        init() {
            this.discoverSteps();
            this.createProgressIndicator();
            this.createNavigation();
            this.showStep(0);

            // Initialize draft saving if enabled
            if (this.options.enableDrafts && window.FormUtils?.DraftManager) {
                this.draftManager = new window.FormUtils.DraftManager(this.form, {
                    storageKey: this.options.draftStorageKey || `multistep_${this.form.id || 'form'}`
                });
            }

            // Listen for form submission
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            // Keyboard navigation
            this.form.addEventListener('keydown', (e) => this.handleKeydown(e));
        }

        /**
         * Discover all steps in the form
         */
        discoverSteps() {
            const stepElements = this.form.querySelectorAll(this.options.stepsSelector);

            this.steps = Array.from(stepElements).map((el, index) => {
                const title = el.dataset.stepTitle ||
                             el.querySelector('.step-title, .step-header, legend')?.textContent ||
                             `Step ${index + 1}`;
                const icon = el.dataset.stepIcon || null;

                return {
                    element: el,
                    title: title.trim(),
                    icon: icon,
                    isValid: false,
                    isCompleted: false
                };
            });

            if (this.steps.length === 0) {
                console.warn('[MultiStepForm] No steps found');
            }
        }

        /**
         * Create the progress indicator
         */
        createProgressIndicator() {
            // Check if progress container exists
            let progressContainer = this.options.progressContainer
                ? document.querySelector(this.options.progressContainer)
                : this.form.querySelector('.form-progress, .steps-progress');

            if (!progressContainer) {
                progressContainer = document.createElement('div');
                progressContainer.className = 'multi-step-progress';
                progressContainer.setAttribute('role', 'navigation');
                progressContainer.setAttribute('aria-label', 'Form progress');
                this.form.insertBefore(progressContainer, this.form.firstChild);
            }

            this.progressContainer = progressContainer;
            this.renderProgress();
        }

        /**
         * Render progress indicator
         */
        renderProgress() {
            const progressHTML = this.steps.map((step, index) => {
                const isActive = index === this.currentStep;
                const isCompleted = step.isCompleted;
                const isAccessible = isCompleted || index === this.currentStep;

                return `
                    <button type="button"
                        class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
                        data-step="${index}"
                        ${!isAccessible ? 'disabled' : ''}
                        aria-current="${isActive ? 'step' : 'false'}"
                        aria-label="Step ${index + 1}: ${step.title}${isCompleted ? ' (completed)' : ''}"
                    >
                        <span class="progress-step-number">
                            ${isCompleted ? this.getCheckmarkSVG() : index + 1}
                        </span>
                        <span class="progress-step-title">${step.title}</span>
                    </button>
                `;
            }).join('<span class="progress-connector" aria-hidden="true"></span>');

            this.progressContainer.innerHTML = progressHTML;

            // Add click handlers
            if (this.options.allowStepClick) {
                this.progressContainer.querySelectorAll('.progress-step').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const stepIndex = parseInt(btn.dataset.step, 10);
                        if (!isNaN(stepIndex) && !btn.disabled) {
                            this.goToStep(stepIndex);
                        }
                    });
                });
            }
        }

        /**
         * Create navigation buttons
         */
        createNavigation() {
            if (!this.options.showPrevNext) return;

            // Check if navigation exists
            let navContainer = this.form.querySelector('.form-navigation, .step-navigation');

            if (!navContainer) {
                navContainer = document.createElement('div');
                navContainer.className = 'form-navigation';
                this.form.appendChild(navContainer);
            }

            navContainer.innerHTML = `
                <div class="nav-left">
                    <button type="button" class="nav-btn nav-prev" id="multistep-prev">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M10 12l-4-4 4-4"/>
                        </svg>
                        <span>${this.options.prevLabel}</span>
                    </button>
                </div>
                <div class="nav-center">
                    <span class="step-counter">Step <span class="current-step">1</span> of <span class="total-steps">${this.steps.length}</span></span>
                </div>
                <div class="nav-right">
                    <button type="button" class="nav-btn nav-next" id="multistep-next">
                        <span>${this.options.nextLabel}</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M6 4l4 4-4 4"/>
                        </svg>
                    </button>
                    <button type="submit" class="nav-btn nav-submit" id="multistep-submit" style="display: none;">
                        <span>${this.options.submitLabel}</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M3 8l3 3 7-7"/>
                        </svg>
                    </button>
                </div>
            `;

            this.navContainer = navContainer;
            this.prevBtn = navContainer.querySelector('#multistep-prev');
            this.nextBtn = navContainer.querySelector('#multistep-next');
            this.submitBtn = navContainer.querySelector('#multistep-submit');

            // Add event listeners
            this.prevBtn?.addEventListener('click', () => this.previousStep());
            this.nextBtn?.addEventListener('click', () => this.nextStep());

            this.updateNavigation();
        }

        /**
         * Update navigation button states
         */
        updateNavigation() {
            if (!this.navContainer) return;

            const isFirst = this.currentStep === 0;
            const isLast = this.currentStep === this.steps.length - 1;

            // Update previous button
            if (this.prevBtn) {
                this.prevBtn.disabled = isFirst;
                this.prevBtn.classList.toggle('hidden', isFirst);
            }

            // Update next/submit buttons
            if (this.nextBtn && this.submitBtn) {
                this.nextBtn.style.display = isLast ? 'none' : 'inline-flex';
                this.submitBtn.style.display = isLast ? 'inline-flex' : 'none';
            }

            // Update counter
            const currentEl = this.navContainer.querySelector('.current-step');
            if (currentEl) {
                currentEl.textContent = this.currentStep + 1;
            }
        }

        /**
         * Show a specific step
         */
        showStep(index, direction = 'forward') {
            if (index < 0 || index >= this.steps.length || this.isAnimating) return;

            const previousStep = this.currentStep;
            this.currentStep = index;

            // Update step visibility
            this.steps.forEach((step, i) => {
                const el = step.element;
                const isActive = i === index;

                if (this.options.animateTransitions && previousStep !== index) {
                    this.animateStepChange(el, isActive, direction);
                } else {
                    el.classList.toggle('active', isActive);
                    el.classList.toggle('visible', isActive);
                    el.setAttribute('aria-hidden', !isActive);

                    // Disable inputs in hidden steps
                    el.querySelectorAll('input, textarea, select, button:not([type="button"])').forEach(input => {
                        input.disabled = !isActive;
                    });
                }
            });

            // Update progress and navigation
            this.renderProgress();
            this.updateNavigation();

            // Auto-focus first input
            if (this.options.autoFocusFirst) {
                setTimeout(() => {
                    const firstInput = this.steps[index].element.querySelector(
                        'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])'
                    );
                    firstInput?.focus();
                }, this.options.animateTransitions ? this.options.transitionDuration : 0);
            }

            // Callback
            if (this.options.onStepChange) {
                this.options.onStepChange(index, previousStep, this.steps[index]);
            }

            // Announce to screen readers
            this.announceStep(index);
        }

        /**
         * Animate step change
         */
        animateStepChange(element, isActive, direction) {
            if (!this.options.animateTransitions) {
                element.classList.toggle('active', isActive);
                element.setAttribute('aria-hidden', !isActive);
                return;
            }

            this.isAnimating = true;

            if (isActive) {
                element.classList.add('active', 'entering');
                element.classList.add(direction === 'forward' ? 'from-right' : 'from-left');
                element.setAttribute('aria-hidden', 'false');

                // Enable inputs
                element.querySelectorAll('input, textarea, select').forEach(input => {
                    input.disabled = false;
                });

                requestAnimationFrame(() => {
                    element.classList.remove('from-right', 'from-left');
                    element.classList.add('entered');
                });

                setTimeout(() => {
                    element.classList.remove('entering', 'entered');
                    this.isAnimating = false;
                }, this.options.transitionDuration);
            } else {
                element.classList.add('exiting');
                element.classList.add(direction === 'forward' ? 'to-left' : 'to-right');

                setTimeout(() => {
                    element.classList.remove('active', 'exiting', 'to-left', 'to-right');
                    element.setAttribute('aria-hidden', 'true');

                    // Disable inputs
                    element.querySelectorAll('input, textarea, select').forEach(input => {
                        input.disabled = true;
                    });
                }, this.options.transitionDuration);
            }
        }

        /**
         * Go to next step
         */
        nextStep() {
            if (this.currentStep >= this.steps.length - 1) return;

            // Validate current step
            if (this.options.validateBeforeNext && !this.validateStep(this.currentStep)) {
                this.scrollToFirstError();
                return;
            }

            // Mark current step as completed
            this.steps[this.currentStep].isCompleted = true;

            this.showStep(this.currentStep + 1, 'forward');
        }

        /**
         * Go to previous step
         */
        previousStep() {
            if (this.currentStep <= 0) return;
            this.showStep(this.currentStep - 1, 'backward');
        }

        /**
         * Go to a specific step
         */
        goToStep(index) {
            if (index < 0 || index >= this.steps.length) return;

            // Can only go back or to current step, or to completed steps
            if (index > this.currentStep && !this.steps[index - 1]?.isCompleted) {
                return;
            }

            const direction = index > this.currentStep ? 'forward' : 'backward';
            this.showStep(index, direction);
        }

        /**
         * Validate current step
         */
        validateStep(stepIndex) {
            const step = this.steps[stepIndex];
            if (!step) return true;

            // Custom validation callback
            if (this.options.onStepValidate) {
                const result = this.options.onStepValidate(stepIndex, step);
                if (result === false) return false;
            }

            // Use form validator if available
            if (this.validator) {
                const stepFields = step.element.querySelectorAll(
                    'input:not([type="hidden"]), textarea, select'
                );

                let isValid = true;
                stepFields.forEach(field => {
                    if (!this.validator.validateField(field)) {
                        isValid = false;
                    }
                });

                step.isValid = isValid;
                return isValid;
            }

            // Basic HTML5 validation
            const invalidFields = step.element.querySelectorAll(':invalid');
            step.isValid = invalidFields.length === 0;
            return step.isValid;
        }

        /**
         * Scroll to first error in current step
         */
        scrollToFirstError() {
            const step = this.steps[this.currentStep];
            if (!step) return;

            const errorField = step.element.querySelector('.has-error, .is-invalid, :invalid');
            if (errorField) {
                errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });

                const input = errorField.querySelector('input, textarea, select') || errorField;
                setTimeout(() => input.focus(), 300);
            }
        }

        /**
         * Handle form submission
         */
        handleSubmit(e) {
            // Validate all steps
            let allValid = true;
            for (let i = 0; i < this.steps.length; i++) {
                if (!this.validateStep(i)) {
                    allValid = false;
                    this.goToStep(i);
                    this.scrollToFirstError();
                    e.preventDefault();
                    return;
                }
            }

            if (this.options.onComplete && allValid) {
                const formData = new FormData(this.form);
                this.options.onComplete(formData, e);
            }
        }

        /**
         * Handle keyboard navigation
         */
        handleKeydown(e) {
            // Alt + Arrow keys for step navigation
            if (e.altKey) {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.nextStep();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.previousStep();
                }
            }
        }

        /**
         * Announce step to screen readers
         */
        announceStep(index) {
            const step = this.steps[index];
            if (!step) return;

            let announcement = document.getElementById('step-announcement');
            if (!announcement) {
                announcement = document.createElement('div');
                announcement.id = 'step-announcement';
                announcement.setAttribute('aria-live', 'polite');
                announcement.setAttribute('aria-atomic', 'true');
                announcement.className = 'sr-only';
                document.body.appendChild(announcement);
            }

            announcement.textContent = `Step ${index + 1} of ${this.steps.length}: ${step.title}`;
        }

        /**
         * Get checkmark SVG for completed steps
         */
        getCheckmarkSVG() {
            return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 7l3 3 5-5"/></svg>`;
        }

        /**
         * Get current step index
         */
        getCurrentStep() {
            return this.currentStep;
        }

        /**
         * Get total steps
         */
        getTotalSteps() {
            return this.steps.length;
        }

        /**
         * Check if all steps are complete
         */
        isComplete() {
            return this.steps.every(step => step.isCompleted);
        }

        /**
         * Reset form to first step
         */
        reset() {
            this.steps.forEach(step => {
                step.isCompleted = false;
                step.isValid = false;
            });
            this.showStep(0);

            if (this.draftManager) {
                this.draftManager.clearDraft();
            }
        }

        /**
         * Destroy the multi-step form instance
         */
        destroy() {
            if (this.draftManager) {
                this.draftManager.destroy();
            }

            this.progressContainer?.remove();
            this.navContainer?.remove();
        }
    }

    // Add styles
    if (!document.getElementById('multi-step-form-styles')) {
        const style = document.createElement('style');
        style.id = 'multi-step-form-styles';
        style.textContent = `
            /* Multi-Step Progress Indicator */
            .multi-step-progress {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0;
                margin-bottom: 2rem;
                padding: 1rem;
                background: rgba(0, 0, 0, 0.15);
                border-radius: 1rem;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }

            .progress-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background: transparent;
                border: none;
                cursor: pointer;
                transition: all 0.25s ease;
                position: relative;
                min-width: 80px;
            }

            .progress-step:disabled {
                cursor: not-allowed;
                opacity: 0.5;
            }

            .progress-step-number {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.2);
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--color-text-secondary, #adb5bd);
                transition: all 0.25s ease;
            }

            .progress-step.active .progress-step-number {
                background: var(--color-primary, #8b7fff);
                border-color: var(--color-primary, #8b7fff);
                color: white;
                box-shadow: 0 0 0 4px rgba(139, 127, 255, 0.25);
                animation: stepPulse 2s ease-in-out infinite;
            }

            @keyframes stepPulse {
                0%, 100% { box-shadow: 0 0 0 4px rgba(139, 127, 255, 0.25); }
                50% { box-shadow: 0 0 0 8px rgba(139, 127, 255, 0.1); }
            }

            .progress-step.completed .progress-step-number {
                background: #22c55e;
                border-color: #22c55e;
                color: white;
            }

            .progress-step:not(:disabled):hover .progress-step-number {
                transform: scale(1.1);
            }

            .progress-step-title {
                font-size: 0.75rem;
                font-weight: 500;
                color: var(--color-text-muted, #6c757d);
                white-space: nowrap;
                transition: color 0.25s ease;
            }

            .progress-step.active .progress-step-title {
                color: var(--color-primary, #8b7fff);
            }

            .progress-step.completed .progress-step-title {
                color: #22c55e;
            }

            .progress-connector {
                width: 40px;
                height: 2px;
                background: rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
                flex-shrink: 0;
            }

            .progress-step.completed + .progress-connector::after {
                content: '';
                position: absolute;
                inset: 0;
                background: #22c55e;
                animation: connectorFill 0.4s ease-out forwards;
            }

            @keyframes connectorFill {
                from { transform: scaleX(0); transform-origin: left; }
                to { transform: scaleX(1); }
            }

            /* Step Content Animations */
            .form-step,
            [data-step] {
                display: none;
                opacity: 0;
            }

            .form-step.active,
            [data-step].active {
                display: block;
                opacity: 1;
            }

            .form-step.entering {
                animation: stepEnter 0.3s ease-out forwards;
            }

            .form-step.entering.from-right {
                --start-x: 30px;
            }

            .form-step.entering.from-left {
                --start-x: -30px;
            }

            @keyframes stepEnter {
                from {
                    opacity: 0;
                    transform: translateX(var(--start-x, 30px));
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            .form-step.exiting {
                animation: stepExit 0.3s ease-out forwards;
            }

            .form-step.exiting.to-left {
                --end-x: -30px;
            }

            .form-step.exiting.to-right {
                --end-x: 30px;
            }

            @keyframes stepExit {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(var(--end-x, -30px));
                }
            }

            /* Navigation */
            .form-navigation {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: 1.5rem 0;
                border-top: 1px solid rgba(139, 127, 255, 0.15);
                margin-top: 2rem;
            }

            .nav-left,
            .nav-right {
                display: flex;
                gap: 0.5rem;
            }

            .nav-center {
                flex: 1;
                text-align: center;
            }

            .step-counter {
                font-size: 0.85rem;
                color: var(--color-text-muted, #6c757d);
            }

            .step-counter .current-step {
                font-weight: 600;
                color: var(--color-primary, #8b7fff);
            }

            .nav-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.25rem;
                border: none;
                border-radius: 0.625rem;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .nav-prev {
                background: rgba(255, 255, 255, 0.05);
                color: var(--color-text-secondary, #adb5bd);
            }

            .nav-prev:hover:not(:disabled) {
                background: rgba(255, 255, 255, 0.1);
                color: var(--color-text-primary, #f8f9fa);
            }

            .nav-next {
                background: var(--color-primary, #8b7fff);
                color: white;
            }

            .nav-next:hover:not(:disabled) {
                background: var(--color-secondary, #9d8fff);
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(139, 127, 255, 0.35);
            }

            .nav-submit {
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
            }

            .nav-submit:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(34, 197, 94, 0.35);
            }

            .nav-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
                transform: none !important;
                box-shadow: none !important;
            }

            .nav-btn.hidden {
                visibility: hidden;
            }

            /* Screen reader only */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }

            /* Responsive */
            @media (max-width: 640px) {
                .multi-step-progress {
                    padding: 0.75rem 0.5rem;
                }

                .progress-step {
                    padding: 0.5rem;
                    min-width: 60px;
                }

                .progress-step-number {
                    width: 32px;
                    height: 32px;
                    font-size: 0.8rem;
                }

                .progress-step-title {
                    display: none;
                }

                .progress-connector {
                    width: 24px;
                }

                .form-navigation {
                    flex-direction: column;
                    gap: 1rem;
                }

                .nav-left,
                .nav-right {
                    width: 100%;
                }

                .nav-btn {
                    flex: 1;
                    justify-content: center;
                }

                .nav-center {
                    order: -1;
                }
            }

            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .progress-step.active .progress-step-number,
                .progress-step.completed + .progress-connector::after,
                .form-step.entering,
                .form-step.exiting,
                .nav-btn {
                    animation: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Public API
    return MultiStepForm;
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.MultiStepForm;
}
