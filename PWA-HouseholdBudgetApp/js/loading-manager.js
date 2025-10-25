// Loading Manager - Centralized loading state management
class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
        this.loadingOverlay = null;
        this.loadingIndicators = new Map();
        this.defaultOptions = {
            message: 'データを処理中...',
            showOverlay: true,
            showSpinner: true,
            timeout: 30000, // 30 seconds default timeout
            cancellable: false
        };
        
        this.initialize();
    }

    initialize() {
        this.createLoadingOverlay();
        this.setupStyles();
        console.log('LoadingManager initialized');
    }

    // Create the main loading overlay
    createLoadingOverlay() {
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.id = 'loading-overlay';
        this.loadingOverlay.className = 'loading-overlay';
        this.loadingOverlay.style.display = 'none';
        
        this.loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">データを処理中...</div>
                <div class="loading-cancel-btn" style="display: none;">
                    <button type="button" class="btn btn-secondary">キャンセル</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.loadingOverlay);
        
        // Add cancel button listener
        const cancelBtn = this.loadingOverlay.querySelector('.loading-cancel-btn button');
        cancelBtn.addEventListener('click', () => {
            this.handleCancel();
        });
    }

    // Setup loading styles
    setupStyles() {
        const styles = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(2px);
            }
            
            .loading-content {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                max-width: 300px;
                width: 90%;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007AFF;
                border-radius: 50%;
                animation: loading-spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            @keyframes loading-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-message {
                font-size: 1rem;
                color: #333;
                margin-bottom: 1rem;
                font-weight: 500;
            }
            
            .loading-cancel-btn {
                margin-top: 1rem;
            }
            
            .loading-cancel-btn button {
                padding: 0.5rem 1rem;
                border: 1px solid #ccc;
                background: #f8f9fa;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.875rem;
            }
            
            .loading-cancel-btn button:hover {
                background: #e9ecef;
            }
            
            .loading-inline {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                color: #666;
            }
            
            .loading-inline .loading-spinner {
                width: 16px;
                height: 16px;
                border-width: 2px;
                margin: 0;
            }
            
            .loading-button {
                position: relative;
                overflow: hidden;
            }
            
            .loading-button.loading {
                pointer-events: none;
                opacity: 0.7;
            }
            
            .loading-button .loading-spinner {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                border-width: 2px;
                margin: 0;
            }
            
            .loading-button.loading .button-text {
                opacity: 0;
            }
            
            .dark-theme .loading-content {
                background: var(--background-primary);
                color: var(--text-primary);
            }
            
            .dark-theme .loading-message {
                color: var(--text-primary);
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Show loading with specified operation ID and options
    showLoading(operationId, options = {}) {
        try {
            const config = { ...this.defaultOptions, ...options };
            
            // Check if operation is already loading
            if (this.loadingStates.has(operationId)) {
                console.warn(`Loading already active for operation: ${operationId}`);
                return false;
            }
            
            const loadingState = {
                id: operationId,
                startTime: new Date(),
                message: config.message,
                timeout: config.timeout,
                cancellable: config.cancellable,
                timeoutId: null,
                cancelled: false
            };
            
            // Set timeout if specified
            if (config.timeout > 0) {
                loadingState.timeoutId = setTimeout(() => {
                    this.handleTimeout(operationId);
                }, config.timeout);
            }
            
            this.loadingStates.set(operationId, loadingState);
            
            // Show appropriate loading indicator
            if (config.showOverlay) {
                this.showOverlay(config.message, config.cancellable);
            }
            
            // Create inline indicator if target element specified
            if (config.targetElement) {
                this.showInlineLoading(config.targetElement, config.message);
            }
            
            // Create button loading if button specified
            if (config.button) {
                this.showButtonLoading(config.button);
            }
            
            console.log(`Loading started for operation: ${operationId}`);
            return true;
            
        } catch (error) {
            console.error('Error showing loading:', error);
            return false;
        }
    }

    // Hide loading for specified operation
    hideLoading(operationId) {
        try {
            const loadingState = this.loadingStates.get(operationId);
            
            if (!loadingState) {
                console.warn(`No loading state found for operation: ${operationId}`);
                return false;
            }
            
            // Clear timeout
            if (loadingState.timeoutId) {
                clearTimeout(loadingState.timeoutId);
            }
            
            // Remove loading state
            this.loadingStates.delete(operationId);
            
            // Hide overlay if no other operations are loading
            if (this.loadingStates.size === 0) {
                this.hideOverlay();
            }
            
            // Remove inline indicators for this operation
            this.hideInlineLoading(operationId);
            
            // Remove button loading indicators
            this.hideButtonLoading(operationId);
            
            const duration = new Date() - loadingState.startTime;
            console.log(`Loading completed for operation: ${operationId} (${duration}ms)`);
            return true;
            
        } catch (error) {
            console.error('Error hiding loading:', error);
            return false;
        }
    }

    // Show overlay loading
    showOverlay(message, cancellable = false) {
        if (!this.loadingOverlay) return;
        
        const messageEl = this.loadingOverlay.querySelector('.loading-message');
        const cancelBtn = this.loadingOverlay.querySelector('.loading-cancel-btn');
        
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        if (cancelBtn) {
            cancelBtn.style.display = cancellable ? 'block' : 'none';
        }
        
        this.loadingOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // Hide overlay loading
    hideOverlay() {
        if (!this.loadingOverlay) return;
        
        this.loadingOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Show inline loading indicator
    showInlineLoading(targetElement, message = '') {
        if (!targetElement) return;
        
        const loadingId = `inline-${Date.now()}`;
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-inline';
        loadingEl.dataset.loadingId = loadingId;
        
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <span>${message}</span>
        `;
        
        // Insert after target element
        targetElement.parentNode.insertBefore(loadingEl, targetElement.nextSibling);
        
        this.loadingIndicators.set(loadingId, {
            element: loadingEl,
            type: 'inline',
            targetElement: targetElement
        });
        
        return loadingId;
    }

    // Hide inline loading indicator
    hideInlineLoading(operationId) {
        this.loadingIndicators.forEach((indicator, id) => {
            if (indicator.type === 'inline' && id.includes(operationId)) {
                if (indicator.element && indicator.element.parentNode) {
                    indicator.element.parentNode.removeChild(indicator.element);
                }
                this.loadingIndicators.delete(id);
            }
        });
    }

    // Show button loading state
    showButtonLoading(button) {
        if (!button) return;
        
        const loadingId = `button-${Date.now()}`;
        
        // Store original button content
        const originalContent = button.innerHTML;
        button.dataset.originalContent = originalContent;
        button.dataset.loadingId = loadingId;
        
        // Add loading class and spinner
        button.classList.add('loading-button', 'loading');
        button.innerHTML = `
            <span class="button-text">${originalContent}</span>
            <div class="loading-spinner"></div>
        `;
        
        this.loadingIndicators.set(loadingId, {
            element: button,
            type: 'button',
            originalContent: originalContent
        });
        
        return loadingId;
    }

    // Hide button loading state
    hideButtonLoading(operationId) {
        this.loadingIndicators.forEach((indicator, id) => {
            if (indicator.type === 'button' && (id.includes(operationId) || !operationId)) {
                const button = indicator.element;
                if (button && button.dataset.originalContent) {
                    button.innerHTML = button.dataset.originalContent;
                    button.classList.remove('loading-button', 'loading');
                    delete button.dataset.originalContent;
                    delete button.dataset.loadingId;
                }
                this.loadingIndicators.delete(id);
            }
        });
    }

    // Check if operation is currently loading
    isLoading(operationId) {
        return this.loadingStates.has(operationId);
    }

    // Get all current loading operations
    getCurrentOperations() {
        return Array.from(this.loadingStates.keys());
    }

    // Check if any operation is currently loading
    hasActiveLoading() {
        return this.loadingStates.size > 0;
    }

    // Handle timeout
    handleTimeout(operationId) {
        console.warn(`Loading timeout for operation: ${operationId}`);
        
        const loadingState = this.loadingStates.get(operationId);
        if (loadingState) {
            // Show timeout message
            if (window.UIUtils && window.UIUtils.showNotification) {
                window.UIUtils.showNotification('処理がタイムアウトしました', 'warning');
            }
            
            // Hide loading
            this.hideLoading(operationId);
            
            // Emit timeout event
            document.dispatchEvent(new CustomEvent('loadingTimeout', {
                detail: { operationId, loadingState }
            }));
        }
    }

    // Handle cancel
    handleCancel() {
        // Cancel all current operations
        const operations = Array.from(this.loadingStates.keys());
        
        for (const operationId of operations) {
            const loadingState = this.loadingStates.get(operationId);
            if (loadingState && loadingState.cancellable) {
                loadingState.cancelled = true;
                this.hideLoading(operationId);
                
                // Emit cancel event
                document.dispatchEvent(new CustomEvent('loadingCancelled', {
                    detail: { operationId, loadingState }
                }));
            }
        }
        
        if (window.UIUtils && window.UIUtils.showNotification) {
            window.UIUtils.showNotification('処理をキャンセルしました', 'info');
        }
    }

    // Identify server communication operations
    isServerOperation(operation) {
        const serverOperations = [
            'sendInvitation',
            'resendInvitation',
            'acceptInvitation',
            'declineInvitation',
            'shareFundSource',
            'unshareFundSource',
            'syncData',
            'validateInvitation',
            'updatePermissions',
            'removeSharedUser',
            'dataIntegrityCheck',
            'performSync'
        ];
        
        return serverOperations.includes(operation) || 
               operation.includes('sync') || 
               operation.includes('server') ||
               operation.includes('invitation') ||
               operation.includes('sharing');
    }

    // Wrap async operations with loading
    async wrapWithLoading(operationId, asyncFunction, options = {}) {
        try {
            // Show loading
            this.showLoading(operationId, options);
            
            // Execute async function
            const result = await asyncFunction();
            
            // Hide loading
            this.hideLoading(operationId);
            
            return result;
            
        } catch (error) {
            // Hide loading on error
            this.hideLoading(operationId);
            
            // Show error notification
            if (window.UIUtils && window.UIUtils.showNotification) {
                window.UIUtils.showNotification(
                    `エラーが発生しました: ${error.message}`, 
                    'error'
                );
            }
            
            throw error;
        }
    }

    // Utility method to show loading for common operations
    showOperationLoading(operation, options = {}) {
        const operationMessages = {
            sendInvitation: '招待を送信中...',
            resendInvitation: '招待を再送信中...',
            acceptInvitation: '招待を受諾中...',
            declineInvitation: '招待を辞退中...',
            shareFundSource: '資金元を共有中...',
            unshareFundSource: '共有を解除中...',
            syncData: 'データを同期中...',
            validateInvitation: '招待を確認中...',
            updatePermissions: '権限を更新中...',
            removeSharedUser: 'ユーザーを削除中...',
            dataIntegrityCheck: 'データを確認中...',
            performSync: '同期を実行中...',
            addTransaction: '取引を追加中...',
            updateTransaction: '取引を更新中...',
            deleteTransaction: '取引を削除中...',
            addFundSource: '資金元を追加中...',
            updateFundSource: '資金元を更新中...',
            deleteFundSource: '資金元を削除中...'
        };
        
        const message = operationMessages[operation] || options.message || 'データを処理中...';
        const showOverlay = this.isServerOperation(operation);
        
        return this.showLoading(operation, {
            message,
            showOverlay,
            ...options
        });
    }

    // Clean up all loading states (emergency cleanup)
    cleanup() {
        try {
            // Clear all timeouts
            this.loadingStates.forEach(state => {
                if (state.timeoutId) {
                    clearTimeout(state.timeoutId);
                }
            });
            
            // Clear all states
            this.loadingStates.clear();
            
            // Hide overlay
            this.hideOverlay();
            
            // Remove all indicators
            this.loadingIndicators.forEach(indicator => {
                if (indicator.type === 'inline' && indicator.element && indicator.element.parentNode) {
                    indicator.element.parentNode.removeChild(indicator.element);
                } else if (indicator.type === 'button' && indicator.element) {
                    this.hideButtonLoading();
                }
            });
            
            this.loadingIndicators.clear();
            
            console.log('LoadingManager cleanup completed');
            
        } catch (error) {
            console.error('Error during LoadingManager cleanup:', error);
        }
    }

    // Get loading statistics
    getStats() {
        return {
            activeOperations: this.loadingStates.size,
            activeIndicators: this.loadingIndicators.size,
            operations: Array.from(this.loadingStates.keys()),
            indicators: Array.from(this.loadingIndicators.keys())
        };
    }
}

// Export for global use
window.LoadingManager = LoadingManager;