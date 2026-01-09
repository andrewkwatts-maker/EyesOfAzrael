/**
 * Form Utilities Module
 * Comprehensive form validation, submission handling, and UX enhancements
 * Eyes of Azrael - Polished Form System
 */

window.FormUtils = (function() {
    'use strict';

    // Validation patterns
    const PATTERNS = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        url: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/,
        phone: /^[\d\s\-+()]{7,}$/,
        password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
        slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        alphanumeric: /^[a-zA-Z0-9]+$/,
        noSpecialChars: /^[a-zA-Z0-9\s]+$/
    };

    // Validation messages
    const MESSAGES = {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        url: 'Please enter a valid URL',
        phone: 'Please enter a valid phone number',
        password: 'Password must be at least 8 characters with letters and numbers',
        minLength: (min) => `Must be at least ${min} characters`,
        maxLength: (max) => `Must be no more than ${max} characters`,
        pattern: 'Please enter a valid value',
        match: 'Values do not match',
        number: 'Please enter a valid number',
        min: (min) => `Must be at least ${min}`,
        max: (max) => `Must be no more than ${max}`,
        date: 'Please enter a valid date',
        futureDate: 'Date must be in the future',
        pastDate: 'Date must be in the past'
    };

    /**
     * FormValidator class
     * Handles real-time validation with visual feedback
     */
    class FormValidator {
        constructor(form, options = {}) {
            this.form = typeof form === 'string' ? document.querySelector(form) : form;
            if (!this.form) {
                console.warn('[FormValidator] Form not found');
                return;
            }

            this.options = {
                validateOnBlur: true,
                validateOnInput: true,
                showSuccessState: true,
                scrollToError: true,
                debounceMs: 300,
                ...options
            };

            this.rules = new Map();
            this.errors = new Map();
            this.validFields = new Set();
            this.submitBtn = this.form.querySelector('[type="submit"]');
            this.debounceTimers = new Map();

            this.init();
        }

        init() {
            if (this.options.validateOnBlur) {
                this.form.addEventListener('blur', (e) => this.handleBlur(e), true);
            }

            if (this.options.validateOnInput) {
                this.form.addEventListener('input', (e) => this.handleInput(e), true);
            }

            // Handle form submission
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            // Track field changes
            this.form.addEventListener('change', (e) => this.handleChange(e));
        }

        /**
         * Add validation rules for a field
         */
        addRule(fieldName, rules) {
            this.rules.set(fieldName, rules);
            return this;
        }

        /**
         * Add multiple rules at once
         */
        addRules(rulesObj) {
            Object.entries(rulesObj).forEach(([field, rules]) => {
                this.addRule(field, rules);
            });
            return this;
        }

        /**
         * Handle blur event
         */
        handleBlur(e) {
            const field = e.target;
            if (!this.isValidatableField(field)) return;

            this.validateField(field);
            this.updateSubmitButton();
        }

        /**
         * Handle input event with debounce
         */
        handleInput(e) {
            const field = e.target;
            if (!this.isValidatableField(field)) return;

            const fieldName = field.name || field.id;

            // Clear existing timer
            if (this.debounceTimers.has(fieldName)) {
                clearTimeout(this.debounceTimers.get(fieldName));
            }

            // Debounce validation
            const timer = setTimeout(() => {
                this.validateField(field);
                this.updateSubmitButton();
            }, this.options.debounceMs);

            this.debounceTimers.set(fieldName, timer);
        }

        /**
         * Handle change event
         */
        handleChange(e) {
            const field = e.target;
            if (!this.isValidatableField(field)) return;

            this.validateField(field);
            this.updateSubmitButton();
        }

        /**
         * Check if field should be validated
         */
        isValidatableField(field) {
            if (!field.name && !field.id) return false;
            const tagName = field.tagName.toLowerCase();
            return ['input', 'textarea', 'select'].includes(tagName) ||
                   field.getAttribute('contenteditable') === 'true';
        }

        /**
         * Validate a single field
         */
        validateField(field) {
            const fieldName = field.name || field.id;
            const value = this.getFieldValue(field);
            const rules = this.rules.get(fieldName) || this.getDefaultRules(field);

            const error = this.checkRules(value, rules, field);

            if (error) {
                this.setFieldError(field, error);
                return false;
            } else {
                this.setFieldValid(field);
                return true;
            }
        }

        /**
         * Get field value
         */
        getFieldValue(field) {
            if (field.getAttribute('contenteditable') === 'true') {
                return field.textContent.trim();
            }
            if (field.type === 'checkbox') {
                return field.checked;
            }
            if (field.type === 'file') {
                return field.files;
            }
            return field.value.trim();
        }

        /**
         * Get default rules based on field attributes
         */
        getDefaultRules(field) {
            const rules = {};

            if (field.required || field.hasAttribute('aria-required')) {
                rules.required = true;
            }

            if (field.type === 'email') {
                rules.email = true;
            }

            if (field.type === 'url') {
                rules.url = true;
            }

            if (field.type === 'tel') {
                rules.phone = true;
            }

            if (field.minLength > 0) {
                rules.minLength = field.minLength;
            }

            if (field.maxLength > 0 && field.maxLength < 999999) {
                rules.maxLength = field.maxLength;
            }

            if (field.min !== '') {
                rules.min = parseFloat(field.min);
            }

            if (field.max !== '') {
                rules.max = parseFloat(field.max);
            }

            if (field.pattern) {
                rules.pattern = new RegExp(field.pattern);
            }

            return rules;
        }

        /**
         * Check all rules for a value
         */
        checkRules(value, rules, field) {
            // Required check
            if (rules.required) {
                const isEmpty = value === '' || value === false ||
                              (value instanceof FileList && value.length === 0);
                if (isEmpty) {
                    return rules.requiredMessage || MESSAGES.required;
                }
            }

            // Skip other validations if empty and not required
            if (value === '' || value === null || value === undefined) {
                return null;
            }

            // Email validation
            if (rules.email && !PATTERNS.email.test(value)) {
                return rules.emailMessage || MESSAGES.email;
            }

            // URL validation
            if (rules.url && !PATTERNS.url.test(value)) {
                return rules.urlMessage || MESSAGES.url;
            }

            // Phone validation
            if (rules.phone && !PATTERNS.phone.test(value)) {
                return rules.phoneMessage || MESSAGES.phone;
            }

            // Password validation
            if (rules.password && !PATTERNS.password.test(value)) {
                return rules.passwordMessage || MESSAGES.password;
            }

            // Min length
            if (rules.minLength && value.length < rules.minLength) {
                return rules.minLengthMessage || MESSAGES.minLength(rules.minLength);
            }

            // Max length
            if (rules.maxLength && value.length > rules.maxLength) {
                return rules.maxLengthMessage || MESSAGES.maxLength(rules.maxLength);
            }

            // Pattern
            if (rules.pattern && !rules.pattern.test(value)) {
                return rules.patternMessage || MESSAGES.pattern;
            }

            // Numeric checks
            if (rules.number || rules.min !== undefined || rules.max !== undefined) {
                const num = parseFloat(value);
                if (isNaN(num)) {
                    return rules.numberMessage || MESSAGES.number;
                }
                if (rules.min !== undefined && num < rules.min) {
                    return rules.minMessage || MESSAGES.min(rules.min);
                }
                if (rules.max !== undefined && num > rules.max) {
                    return rules.maxMessage || MESSAGES.max(rules.max);
                }
            }

            // Match another field
            if (rules.match) {
                const matchField = this.form.querySelector(`[name="${rules.match}"], #${rules.match}`);
                if (matchField && this.getFieldValue(matchField) !== value) {
                    return rules.matchMessage || MESSAGES.match;
                }
            }

            // Custom validation function
            if (typeof rules.custom === 'function') {
                const customError = rules.custom(value, field);
                if (customError) {
                    return customError;
                }
            }

            return null;
        }

        /**
         * Set field error state
         */
        setFieldError(field, message) {
            const fieldName = field.name || field.id;
            this.errors.set(fieldName, message);
            this.validFields.delete(fieldName);

            // Update field classes
            field.classList.remove('valid', 'is-valid');
            field.classList.add('error', 'has-error', 'is-invalid');
            field.setAttribute('aria-invalid', 'true');

            // Find or create error element
            const fieldContainer = field.closest('.form-field, .ef-field, .auth-form-group, .field-group');
            if (fieldContainer) {
                fieldContainer.classList.add('has-error');
                fieldContainer.classList.remove('is-valid');

                let errorEl = fieldContainer.querySelector('.form-error, .ef-error-text, .field-error');
                if (!errorEl) {
                    errorEl = document.createElement('p');
                    errorEl.className = 'form-error';
                    errorEl.setAttribute('role', 'alert');
                    errorEl.id = `error-${fieldName}`;

                    const footer = fieldContainer.querySelector('.field-footer');
                    if (footer) {
                        footer.appendChild(errorEl);
                    } else {
                        fieldContainer.appendChild(errorEl);
                    }
                }

                errorEl.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M7 4v3M7 9v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <span>${message}</span>
                `;
                errorEl.style.display = 'flex';

                field.setAttribute('aria-describedby', errorEl.id);
            }

            // Trigger animation
            field.style.animation = 'none';
            field.offsetHeight; // Force reflow
            field.style.animation = 'inputErrorPulse 0.5s ease-out';
        }

        /**
         * Set field valid state
         */
        setFieldValid(field) {
            const fieldName = field.name || field.id;
            this.errors.delete(fieldName);
            this.validFields.add(fieldName);

            // Update field classes
            field.classList.remove('error', 'has-error', 'is-invalid');
            field.removeAttribute('aria-invalid');

            if (this.options.showSuccessState && field.value.trim()) {
                field.classList.add('valid', 'is-valid');
            }

            // Update container
            const fieldContainer = field.closest('.form-field, .ef-field, .auth-form-group, .field-group');
            if (fieldContainer) {
                fieldContainer.classList.remove('has-error');

                if (this.options.showSuccessState && field.value.trim()) {
                    fieldContainer.classList.add('is-valid');
                }

                // Hide error element
                const errorEl = fieldContainer.querySelector('.form-error, .ef-error-text, .field-error');
                if (errorEl) {
                    errorEl.style.display = 'none';
                }
            }
        }

        /**
         * Validate entire form
         */
        validateForm() {
            let isValid = true;
            const fields = this.form.querySelectorAll('input, textarea, select, [contenteditable="true"]');

            fields.forEach(field => {
                if (this.isValidatableField(field)) {
                    if (!this.validateField(field)) {
                        isValid = false;
                    }
                }
            });

            return isValid;
        }

        /**
         * Handle form submission
         */
        handleSubmit(e) {
            e.preventDefault();

            if (!this.validateForm()) {
                if (this.options.scrollToError) {
                    this.scrollToFirstError();
                }
                return false;
            }

            // Dispatch custom event for form handling
            this.form.dispatchEvent(new CustomEvent('validSubmit', {
                detail: { formData: new FormData(this.form) }
            }));

            return true;
        }

        /**
         * Scroll to first error
         */
        scrollToFirstError() {
            const firstError = this.form.querySelector('.has-error, .is-invalid');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const field = firstError.querySelector('input, textarea, select, [contenteditable="true"]');
                if (field) {
                    setTimeout(() => field.focus(), 300);
                }
            }
        }

        /**
         * Update submit button state
         */
        updateSubmitButton() {
            if (!this.submitBtn) return;

            const requiredFields = this.form.querySelectorAll('[required], [aria-required="true"]');
            let allValid = true;

            requiredFields.forEach(field => {
                const fieldName = field.name || field.id;
                if (this.errors.has(fieldName) || !this.getFieldValue(field)) {
                    allValid = false;
                }
            });

            this.submitBtn.disabled = !allValid;
            this.submitBtn.classList.toggle('disabled', !allValid);
        }

        /**
         * Get all errors
         */
        getErrors() {
            return Object.fromEntries(this.errors);
        }

        /**
         * Check if form is valid
         */
        isValid() {
            return this.errors.size === 0;
        }

        /**
         * Reset validation state
         */
        reset() {
            this.errors.clear();
            this.validFields.clear();

            this.form.querySelectorAll('.has-error, .is-valid').forEach(el => {
                el.classList.remove('has-error', 'is-valid', 'error', 'valid');
            });

            this.form.querySelectorAll('.form-error, .ef-error-text, .field-error').forEach(el => {
                el.style.display = 'none';
            });

            if (this.submitBtn) {
                this.submitBtn.disabled = false;
            }
        }
    }

    /**
     * FormSubmitHandler class
     * Handles form submission with loading states and feedback
     */
    class FormSubmitHandler {
        constructor(form, options = {}) {
            this.form = typeof form === 'string' ? document.querySelector(form) : form;
            if (!this.form) return;

            this.options = {
                submitUrl: null,
                method: 'POST',
                contentType: 'json',
                loadingText: 'Submitting...',
                successMessage: 'Form submitted successfully!',
                errorMessage: 'An error occurred. Please try again.',
                redirectOnSuccess: null,
                resetOnSuccess: true,
                preventDoubleSubmit: true,
                onBeforeSubmit: null,
                onSuccess: null,
                onError: null,
                ...options
            };

            this.submitBtn = this.form.querySelector('[type="submit"]');
            this.isSubmitting = false;
            this.originalBtnContent = this.submitBtn?.innerHTML;

            this.init();
        }

        init() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.form.addEventListener('validSubmit', (e) => this.processSubmit(e.detail.formData));
        }

        async handleSubmit(e) {
            e.preventDefault();

            if (this.options.preventDoubleSubmit && this.isSubmitting) {
                return;
            }

            // If there's a validator, let it handle validation first
            const validator = this.form._validator;
            if (validator) {
                if (!validator.validateForm()) {
                    return;
                }
            }

            await this.processSubmit(new FormData(this.form));
        }

        async processSubmit(formData) {
            if (this.options.preventDoubleSubmit && this.isSubmitting) {
                return;
            }

            // Before submit callback
            if (this.options.onBeforeSubmit) {
                const shouldContinue = await this.options.onBeforeSubmit(formData);
                if (shouldContinue === false) return;
            }

            this.setLoading(true);

            try {
                let data;
                if (this.options.contentType === 'json') {
                    data = {};
                    formData.forEach((value, key) => {
                        if (data[key]) {
                            if (!Array.isArray(data[key])) {
                                data[key] = [data[key]];
                            }
                            data[key].push(value);
                        } else {
                            data[key] = value;
                        }
                    });
                } else {
                    data = formData;
                }

                // If no URL, just call success callback
                if (!this.options.submitUrl) {
                    if (this.options.onSuccess) {
                        await this.options.onSuccess(data);
                    }
                    this.showSuccess();
                    return;
                }

                const response = await fetch(this.options.submitUrl, {
                    method: this.options.method,
                    headers: this.options.contentType === 'json'
                        ? { 'Content-Type': 'application/json' }
                        : {},
                    body: this.options.contentType === 'json'
                        ? JSON.stringify(data)
                        : data
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json().catch(() => ({}));

                if (this.options.onSuccess) {
                    await this.options.onSuccess(result, data);
                }

                this.showSuccess();

                if (this.options.redirectOnSuccess) {
                    setTimeout(() => {
                        window.location.href = this.options.redirectOnSuccess;
                    }, 1500);
                }

            } catch (error) {
                console.error('[FormSubmitHandler] Submit error:', error);

                if (this.options.onError) {
                    await this.options.onError(error);
                }

                this.showError(error.message || this.options.errorMessage);
            } finally {
                this.setLoading(false);
            }
        }

        setLoading(loading) {
            this.isSubmitting = loading;

            if (this.submitBtn) {
                this.submitBtn.disabled = loading;

                if (loading) {
                    this.submitBtn.innerHTML = `
                        <svg class="form-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="7" opacity="0.3"/>
                            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="21"/>
                        </svg>
                        <span>${this.options.loadingText}</span>
                    `;
                    this.submitBtn.classList.add('loading');
                } else {
                    this.submitBtn.innerHTML = this.originalBtnContent;
                    this.submitBtn.classList.remove('loading');
                }
            }

            // Disable all form fields during submission
            const fields = this.form.querySelectorAll('input, textarea, select, button');
            fields.forEach(field => {
                field.disabled = loading;
            });
        }

        showSuccess() {
            if (this.options.resetOnSuccess) {
                this.form.reset();
                const validator = this.form._validator;
                if (validator) validator.reset();
            }

            this.showMessage(this.options.successMessage, 'success');
        }

        showError(message) {
            this.showMessage(message || this.options.errorMessage, 'error');
        }

        showMessage(message, type = 'info') {
            let statusContainer = this.form.querySelector('.form-status-container');
            let statusEl = this.form.querySelector('.form-status');

            if (!statusContainer) {
                statusContainer = document.createElement('div');
                statusContainer.className = 'form-status-container';
                statusEl = document.createElement('div');
                statusEl.className = 'form-status';
                statusEl.setAttribute('role', 'status');
                statusEl.setAttribute('aria-live', 'polite');
                statusContainer.appendChild(statusEl);
                this.form.appendChild(statusContainer);
            }

            statusContainer.classList.add('visible');
            statusEl.className = `form-status ${type}`;
            statusEl.textContent = message;

            // Auto-hide after 5 seconds for success
            if (type === 'success') {
                setTimeout(() => {
                    statusContainer.classList.remove('visible');
                }, 5000);
            }
        }
    }

    /**
     * Password field enhancements
     */
    function enhancePasswordField(field) {
        const wrapper = document.createElement('div');
        wrapper.className = 'password-field-wrapper';
        wrapper.style.position = 'relative';

        field.parentNode.insertBefore(wrapper, field);
        wrapper.appendChild(field);

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
        toggleBtn.innerHTML = `
            <svg class="eye-open" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z"/>
                <circle cx="10" cy="10" r="3"/>
            </svg>
            <svg class="eye-closed" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" style="display:none;">
                <path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z"/>
                <path d="M3 17L17 3"/>
            </svg>
        `;

        toggleBtn.addEventListener('click', () => {
            const isPassword = field.type === 'password';
            field.type = isPassword ? 'text' : 'password';
            toggleBtn.querySelector('.eye-open').style.display = isPassword ? 'none' : 'block';
            toggleBtn.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
            toggleBtn.setAttribute('aria-pressed', isPassword);
        });

        wrapper.appendChild(toggleBtn);

        // Add styles if not already present
        if (!document.getElementById('password-toggle-styles')) {
            const style = document.createElement('style');
            style.id = 'password-toggle-styles';
            style.textContent = `
                .password-field-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .password-field-wrapper input {
                    padding-right: 48px;
                }
                .password-toggle-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    padding: 4px;
                    cursor: pointer;
                    color: var(--color-text-secondary, #adb5bd);
                    transition: color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                }
                .password-toggle-btn:hover {
                    color: var(--color-primary, #8b7fff);
                }
                .password-toggle-btn:focus-visible {
                    outline: 2px solid var(--color-primary, #8b7fff);
                    outline-offset: 2px;
                }
            `;
            document.head.appendChild(style);
        }

        return toggleBtn;
    }

    /**
     * Remember Me functionality
     */
    const RememberMe = {
        STORAGE_KEY: 'eoa_remember_email',

        init(emailField, rememberCheckbox) {
            if (!emailField || !rememberCheckbox) return;

            // Load saved email
            const savedEmail = localStorage.getItem(this.STORAGE_KEY);
            if (savedEmail) {
                emailField.value = savedEmail;
                rememberCheckbox.checked = true;
            }

            // Save on form submit or checkbox change
            const form = emailField.closest('form');
            if (form) {
                form.addEventListener('submit', () => {
                    if (rememberCheckbox.checked) {
                        localStorage.setItem(this.STORAGE_KEY, emailField.value);
                    } else {
                        localStorage.removeItem(this.STORAGE_KEY);
                    }
                });
            }
        },

        clear() {
            localStorage.removeItem(this.STORAGE_KEY);
        }
    };

    /**
     * Draft saving functionality
     */
    class DraftManager {
        constructor(form, options = {}) {
            this.form = typeof form === 'string' ? document.querySelector(form) : form;
            if (!this.form) return;

            this.options = {
                storageKey: `draft_${location.pathname}_${this.form.id || 'form'}`,
                autoSaveInterval: 30000, // 30 seconds
                showIndicator: true,
                excludeFields: ['password', 'confirm_password', 'csrf_token'],
                ...options
            };

            this.indicator = null;
            this.autoSaveTimer = null;
            this.lastSaveTime = null;

            this.init();
        }

        init() {
            // Create indicator
            if (this.options.showIndicator) {
                this.createIndicator();
            }

            // Load existing draft
            this.loadDraft();

            // Auto-save on input
            this.form.addEventListener('input', () => {
                this.scheduleSave();
            });

            // Save before leaving
            window.addEventListener('beforeunload', () => {
                this.saveDraft();
            });

            // Start auto-save interval
            this.startAutoSave();
        }

        createIndicator() {
            this.indicator = document.createElement('div');
            this.indicator.className = 'draft-save-indicator';
            this.indicator.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 8l4 4 8-8"/>
                </svg>
                <span class="draft-save-text">Draft saved</span>
                <span class="draft-save-time"></span>
            `;
            document.body.appendChild(this.indicator);
        }

        scheduleSave() {
            clearTimeout(this.saveTimer);
            this.saveTimer = setTimeout(() => {
                this.saveDraft();
            }, 2000);
        }

        saveDraft() {
            const data = {};
            const formData = new FormData(this.form);

            formData.forEach((value, key) => {
                if (!this.options.excludeFields.includes(key)) {
                    data[key] = value;
                }
            });

            // Also save contenteditable fields
            this.form.querySelectorAll('[contenteditable="true"]').forEach(el => {
                const name = el.dataset.field || el.id;
                if (name && !this.options.excludeFields.includes(name)) {
                    data[name] = el.innerHTML;
                }
            });

            try {
                localStorage.setItem(this.options.storageKey, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
                this.lastSaveTime = new Date();
                this.showIndicator();
            } catch (e) {
                console.warn('[DraftManager] Could not save draft:', e);
            }
        }

        loadDraft() {
            try {
                const saved = localStorage.getItem(this.options.storageKey);
                if (!saved) return false;

                const { data, timestamp } = JSON.parse(saved);

                // Check if draft is too old (24 hours)
                if (Date.now() - timestamp > 86400000) {
                    this.clearDraft();
                    return false;
                }

                // Populate form
                Object.entries(data).forEach(([key, value]) => {
                    const field = this.form.querySelector(`[name="${key}"], #${key}`);
                    if (field) {
                        if (field.getAttribute('contenteditable') === 'true') {
                            field.innerHTML = value;
                        } else {
                            field.value = value;
                        }
                    }
                });

                return true;
            } catch (e) {
                console.warn('[DraftManager] Could not load draft:', e);
                return false;
            }
        }

        clearDraft() {
            localStorage.removeItem(this.options.storageKey);
        }

        showIndicator() {
            if (!this.indicator) return;

            const timeEl = this.indicator.querySelector('.draft-save-time');
            if (timeEl && this.lastSaveTime) {
                timeEl.textContent = this.formatTime(this.lastSaveTime);
            }

            this.indicator.classList.add('show');
            setTimeout(() => {
                this.indicator.classList.remove('show');
            }, 3000);
        }

        formatTime(date) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        startAutoSave() {
            if (this.options.autoSaveInterval > 0) {
                this.autoSaveTimer = setInterval(() => {
                    this.saveDraft();
                }, this.options.autoSaveInterval);
            }
        }

        destroy() {
            clearInterval(this.autoSaveTimer);
            clearTimeout(this.saveTimer);
            if (this.indicator) {
                this.indicator.remove();
            }
        }
    }

    /**
     * Add tooltip to field
     */
    function addFieldTooltip(field, content) {
        const wrapper = field.closest('.form-field, .ef-field, .field-group') || field.parentElement;

        const tooltip = document.createElement('button');
        tooltip.type = 'button';
        tooltip.className = 'field-tooltip-trigger';
        tooltip.setAttribute('aria-label', 'More information');
        tooltip.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="8" cy="8" r="7"/>
                <path d="M8 11V8M8 5.5V5"/>
            </svg>
        `;

        const tooltipContent = document.createElement('div');
        tooltipContent.className = 'field-tooltip-content';
        tooltipContent.textContent = content;
        tooltipContent.setAttribute('role', 'tooltip');
        tooltipContent.id = `tooltip-${field.name || field.id || Math.random().toString(36).substr(2, 9)}`;

        tooltip.setAttribute('aria-describedby', tooltipContent.id);

        tooltip.addEventListener('mouseenter', () => {
            tooltipContent.classList.add('visible');
        });
        tooltip.addEventListener('mouseleave', () => {
            tooltipContent.classList.remove('visible');
        });
        tooltip.addEventListener('focus', () => {
            tooltipContent.classList.add('visible');
        });
        tooltip.addEventListener('blur', () => {
            tooltipContent.classList.remove('visible');
        });

        const label = wrapper.querySelector('label, .form-label, .ef-label');
        if (label) {
            label.appendChild(tooltip);
            label.appendChild(tooltipContent);
        }

        // Add styles if not present
        if (!document.getElementById('tooltip-styles')) {
            const style = document.createElement('style');
            style.id = 'tooltip-styles';
            style.textContent = `
                .field-tooltip-trigger {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 18px;
                    height: 18px;
                    margin-left: 6px;
                    padding: 0;
                    background: rgba(139, 127, 255, 0.15);
                    border: none;
                    border-radius: 50%;
                    color: var(--color-primary, #8b7fff);
                    cursor: help;
                    transition: all 0.2s;
                    vertical-align: middle;
                }
                .field-tooltip-trigger:hover {
                    background: rgba(139, 127, 255, 0.25);
                    transform: scale(1.1);
                }
                .field-tooltip-content {
                    position: absolute;
                    bottom: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    padding: 10px 14px;
                    background: var(--color-surface, #1a1f3a);
                    border: 1px solid rgba(139, 127, 255, 0.3);
                    border-radius: 8px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                    font-size: 0.85rem;
                    font-weight: 400;
                    text-transform: none;
                    letter-spacing: normal;
                    color: var(--color-text-primary, #f8f9fa);
                    line-height: 1.5;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(8px);
                    transition: all 0.2s;
                    z-index: 100;
                    pointer-events: none;
                }
                .field-tooltip-content::after {
                    content: '';
                    position: absolute;
                    bottom: -6px;
                    left: 20px;
                    width: 10px;
                    height: 10px;
                    background: var(--color-surface, #1a1f3a);
                    border-right: 1px solid rgba(139, 127, 255, 0.3);
                    border-bottom: 1px solid rgba(139, 127, 255, 0.3);
                    transform: rotate(45deg);
                }
                .field-tooltip-content.visible {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
        }

        return tooltip;
    }

    /**
     * Initialize all form enhancements on a page
     */
    function initForms(selector = 'form') {
        const forms = document.querySelectorAll(selector);

        forms.forEach(form => {
            // Skip if already initialized
            if (form.dataset.formUtilsInit) return;
            form.dataset.formUtilsInit = 'true';

            // Initialize validator
            const validator = new FormValidator(form);
            form._validator = validator;

            // Enhance password fields
            form.querySelectorAll('input[type="password"]').forEach(field => {
                enhancePasswordField(field);
            });

            // Look for remember me checkbox
            const rememberCheckbox = form.querySelector('[name="remember"], [name="remember_me"], #remember');
            const emailField = form.querySelector('[type="email"], [name="email"]');
            if (rememberCheckbox && emailField) {
                RememberMe.init(emailField, rememberCheckbox);
            }
        });
    }

    // Auto-initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initForms());
    } else {
        initForms();
    }

    // Public API
    return {
        FormValidator,
        FormSubmitHandler,
        DraftManager,
        RememberMe,
        enhancePasswordField,
        addFieldTooltip,
        initForms,
        PATTERNS,
        MESSAGES
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.FormUtils;
}
