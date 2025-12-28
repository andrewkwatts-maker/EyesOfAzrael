/**
 * Validation Upload Modal
 * User interface for uploading and validating entity data
 */

class ValidationUploadModal {
    constructor(validatedCrudManager) {
        this.crudManager = validatedCrudManager;
        this.modal = null;
        this.uploadedData = null;
        this.validationResults = null;
    }

    /**
     * Open upload modal
     */
    open() {
        this.createModal();
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     */
    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
            this.uploadedData = null;
            this.validationResults = null;
        }
    }

    /**
     * Create modal DOM
     */
    createModal() {
        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'modal-overlay validation-upload-modal';
        this.modal.innerHTML = `
            <div class="modal-container" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>Upload & Validate Entities</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').dispatchEvent(new CustomEvent('close'))">&times;</button>
                </div>

                <div class="modal-body">
                    <!-- Upload Section -->
                    <div class="upload-section">
                        <div class="upload-instructions">
                            <h3>📤 Upload Entity Data</h3>
                            <p>Upload a JSON file containing entity data. The file will be validated against our schemas before import.</p>
                            <ul>
                                <li>Supports single entity or array of entities</li>
                                <li>All entities must conform to their respective schemas</li>
                                <li>Required fields: id, name, type, mythology</li>
                            </ul>
                        </div>

                        <div class="upload-controls">
                            <input type="file" id="entity-file-upload" accept=".json" style="display: none;">
                            <button class="btn-primary" id="select-file-btn">
                                📁 Select JSON File
                            </button>
                            <span id="file-name-display" style="margin-left: 1rem; color: #666;"></span>
                        </div>

                        <div class="validation-mode-selector" style="margin-top: 1rem;">
                            <label>Validation Mode:</label>
                            <select id="validation-mode">
                                <option value="strict">Strict (reject invalid entities)</option>
                                <option value="warn" selected>Warn (import with warnings)</option>
                                <option value="off">Off (no validation)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Validation Results Section -->
                    <div id="validation-results" style="display: none; margin-top: 2rem;">
                        <h3>Validation Results</h3>
                        <div id="validation-summary"></div>
                        <div id="validation-details"></div>
                    </div>

                    <!-- Import Actions -->
                    <div id="import-actions" style="display: none; margin-top: 2rem;">
                        <button class="btn-primary" id="import-all-btn">
                            ✓ Import All Valid Entities
                        </button>
                        <button class="btn-secondary" id="import-valid-only-btn">
                            Import Valid Only
                        </button>
                        <button class="btn-secondary" id="cancel-import-btn">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close modal
        this.modal.addEventListener('close', () => this.close());

        // File selection
        const fileInput = this.modal.querySelector('#entity-file-upload');
        const selectBtn = this.modal.querySelector('#select-file-btn');
        const fileNameDisplay = this.modal.querySelector('#file-name-display');

        selectBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            fileNameDisplay.textContent = file.name;

            try {
                const content = await this.readFile(file);
                this.uploadedData = JSON.parse(content);

                // Ensure data is an array
                if (!Array.isArray(this.uploadedData)) {
                    this.uploadedData = [this.uploadedData];
                }

                // Validate uploaded data
                await this.validateUploadedData();
            } catch (error) {
                this.showError('Failed to read or parse file: ' + error.message);
            }
        });

        // Validation mode change
        const modeSelector = this.modal.querySelector('#validation-mode');
        modeSelector.addEventListener('change', (e) => {
            this.crudManager.setValidationMode(e.target.value);
        });

        // Import buttons
        const importAllBtn = this.modal.querySelector('#import-all-btn');
        const importValidBtn = this.modal.querySelector('#import-valid-only-btn');
        const cancelBtn = this.modal.querySelector('#cancel-import-btn');

        if (importAllBtn) {
            importAllBtn.addEventListener('click', () => this.importEntities('all'));
        }

        if (importValidBtn) {
            importValidBtn.addEventListener('click', () => this.importEntities('valid-only'));
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
    }

    /**
     * Read file as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Validate uploaded data
     */
    async validateUploadedData() {
        const resultsSection = this.modal.querySelector('#validation-results');
        const summaryDiv = this.modal.querySelector('#validation-summary');
        const detailsDiv = this.modal.querySelector('#validation-details');
        const actionsSection = this.modal.querySelector('#import-actions');

        // Show loading state
        summaryDiv.innerHTML = '<div class="loading-spinner">Validating...</div>';
        resultsSection.style.display = 'block';

        try {
            // Validate all entities
            this.validationResults = await this.crudManager.validateUpload(this.uploadedData);

            // Display summary
            const { totalEntities, validCount, invalidCount, canImport } = this.validationResults;

            summaryDiv.innerHTML = `
                <div class="validation-summary ${canImport ? 'valid' : 'invalid'}">
                    <div class="summary-stat">
                        <span class="stat-label">Total Entities:</span>
                        <span class="stat-value">${totalEntities}</span>
                    </div>
                    <div class="summary-stat valid">
                        <span class="stat-label">✓ Valid:</span>
                        <span class="stat-value">${validCount}</span>
                    </div>
                    <div class="summary-stat invalid">
                        <span class="stat-label">✗ Invalid:</span>
                        <span class="stat-value">${invalidCount}</span>
                    </div>
                    <div class="summary-status">
                        ${canImport
                            ? '<span class="status-badge success">✓ Ready to import</span>'
                            : '<span class="status-badge error">⚠ Contains validation errors</span>'
                        }
                    </div>
                </div>
            `;

            // Display detailed results
            detailsDiv.innerHTML = this.renderValidationDetails(this.validationResults.results);

            // Show import actions
            actionsSection.style.display = 'block';

        } catch (error) {
            this.showError('Validation failed: ' + error.message);
        }
    }

    /**
     * Render validation details
     */
    renderValidationDetails(results) {
        return `
            <div class="validation-details">
                ${results.map((result, index) => this.renderEntityResult(result, index)).join('')}
            </div>
        `;
    }

    /**
     * Render individual entity result
     */
    renderEntityResult(result, index) {
        const { id, name, type, isValid, errors, warnings } = result;
        const statusClass = isValid ? 'valid' : 'invalid';
        const statusIcon = isValid ? '✓' : '✗';

        return `
            <div class="entity-result ${statusClass}">
                <div class="entity-header">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="entity-name">${name || id}</span>
                    <span class="entity-type">${type}</span>
                    ${errors.length > 0 ? `<span class="error-count">${errors.length} error${errors.length > 1 ? 's' : ''}</span>` : ''}
                    ${warnings.length > 0 ? `<span class="warning-count">${warnings.length} warning${warnings.length > 1 ? 's' : ''}</span>` : ''}
                </div>

                ${errors.length > 0 ? `
                    <div class="entity-errors">
                        <strong>Errors:</strong>
                        <ul>
                            ${errors.map(e => `<li><strong>${e.field}:</strong> ${e.message}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${warnings.length > 0 ? `
                    <div class="entity-warnings">
                        <strong>Warnings:</strong>
                        <ul>
                            ${warnings.map(w => `<li><strong>${w.field}:</strong> ${w.message}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Import entities
     */
    async importEntities(mode) {
        if (!this.validationResults) {
            this.showError('No validation results available');
            return;
        }

        const entitiesToImport = mode === 'valid-only'
            ? this.uploadedData.filter((_, index) => this.validationResults.results[index].isValid)
            : this.uploadedData;

        if (entitiesToImport.length === 0) {
            this.showError('No valid entities to import');
            return;
        }

        // Show loading
        const actionsSection = this.modal.querySelector('#import-actions');
        actionsSection.innerHTML = `
            <div class="loading-spinner">Importing ${entitiesToImport.length} entities...</div>
        `;

        try {
            let successCount = 0;
            let failCount = 0;

            for (const entity of entitiesToImport) {
                try {
                    // Determine collection from entity type
                    const collection = this.getCollectionName(entity.type, entity.mythology);

                    await this.crudManager.create(collection, entity, { showWarnings: false });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to import ${entity.id}:`, error);
                    failCount++;
                }
            }

            // Show results
            this.showSuccess(`Import complete: ${successCount} succeeded, ${failCount} failed`);

            // Close modal after delay
            setTimeout(() => this.close(), 2000);

            // Refresh page to show new entities
            if (successCount > 0) {
                setTimeout(() => window.location.reload(), 2500);
            }

        } catch (error) {
            this.showError('Import failed: ' + error.message);
        }
    }

    /**
     * Get collection name from entity type and mythology
     */
    getCollectionName(type, mythology) {
        // Format: {mythology}_{type}s
        const plural = type === 'hero' ? 'heroes' : `${type}s`;
        return `${mythology}_${plural}`;
    }

    /**
     * Show error message
     */
    showError(message) {
        const summaryDiv = this.modal.querySelector('#validation-summary');
        summaryDiv.innerHTML = `
            <div class="error-message" style="color: #ef4444; padding: 1rem; background: #fee; border-radius: 8px;">
                ⚠️ ${message}
            </div>
        `;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const actionsSection = this.modal.querySelector('#import-actions');
        actionsSection.innerHTML = `
            <div class="success-message" style="color: #10b981; padding: 1rem; background: #d1fae5; border-radius: 8px;">
                ✓ ${message}
            </div>
        `;
    }
}

// Export for both module and global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationUploadModal;
}

if (typeof window !== 'undefined') {
    window.ValidationUploadModal = ValidationUploadModal;
}
