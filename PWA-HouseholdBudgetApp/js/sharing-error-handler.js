// Sharing Error Handler - Comprehensive error handling for sharing functionality
// Task 11.1: 包括的エラーハンドリング

class SharingErrorHandler {
    constructor(storage, uiUtils = null) {
        this.storage = storage;
        this.uiUtils = uiUtils || window.UIUtils;
        
        // Error categories and their configurations
        this.errorCategories = {
            PERMISSION_DENIED: {
                severity: 'high',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'warn'
            },
            INVALID_TOKEN: {
                severity: 'medium',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'info'
            },
            EXPIRED_TOKEN: {
                severity: 'medium',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'info'
            },
            DATA_INTEGRITY: {
                severity: 'high',
                userFriendly: true,
                autoRetry: true,
                logLevel: 'error'
            },
            VALIDATION_ERROR: {
                severity: 'medium',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'warn'
            },
            NETWORK_ERROR: {
                severity: 'medium',
                userFriendly: true,
                autoRetry: true,
                logLevel: 'warn'
            },
            FUND_SOURCE_NOT_FOUND: {
                severity: 'high',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'error'
            },
            USER_NOT_FOUND: {
                severity: 'medium',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'warn'
            },
            INVITATION_NOT_FOUND: {
                severity: 'medium',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'warn'
            },
            DUPLICATE_INVITATION: {
                severity: 'low',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'info'
            },
            INVALID_EMAIL: {
                severity: 'low',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'info'
            },
            SELF_INVITATION: {
                severity: 'low',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'info'
            },
            SYNC_ERROR: {
                severity: 'medium',
                userFriendly: true,
                autoRetry: true,
                logLevel: 'warn'
            },
            GENERIC_ERROR: {
                severity: 'medium',
                userFriendly: true,
                autoRetry: false,
                logLevel: 'error'
            }
        };

        // User-friendly error messages
        this.errorMessages = {
            PERMISSION_DENIED: 'この操作を実行する権限がありません。資金元の所有者にお問い合わせください。',
            INVALID_TOKEN: '無効な招待リンクです。招待を送信した方に新しいリンクを依頼してください。',
            EXPIRED_TOKEN: '招待の有効期限が切れています。招待を送信した方に新しい招待を依頼してください。',
            DATA_INTEGRITY: 'データの不整合が検出されました。自動修復を試行します。',
            VALIDATION_ERROR: '入力内容に問題があります。内容を確認して再度お試しください。',
            NETWORK_ERROR: 'ネットワーク接続に問題があります。接続を確認して再度お試しください。',
            FUND_SOURCE_NOT_FOUND: '指定された資金元が見つかりません。削除された可能性があります。',
            USER_NOT_FOUND: '指定されたユーザーが見つかりません。',
            INVITATION_NOT_FOUND: '指定された招待が見つかりません。既に処理済みの可能性があります。',
            DUPLICATE_INVITATION: 'このユーザーには既に招待を送信済みです。',
            INVALID_EMAIL: '有効なメールアドレスを入力してください。',
            SELF_INVITATION: '自分自身を招待することはできません。',
            SYNC_ERROR: 'データの同期中にエラーが発生しました。再度お試しください。',
            GENERIC_ERROR: '予期しないエラーが発生しました。しばらく待ってから再度お試しください。'
        };

        // Recovery actions
        this.recoveryActions = {
            PERMISSION_DENIED: 'LOGIN_CHECK',
            INVALID_TOKEN: 'REQUEST_NEW_INVITATION',
            EXPIRED_TOKEN: 'REQUEST_NEW_INVITATION',
            DATA_INTEGRITY: 'AUTO_REPAIR',
            VALIDATION_ERROR: 'USER_INPUT_CORRECTION',
            NETWORK_ERROR: 'RETRY_LATER',
            FUND_SOURCE_NOT_FOUND: 'REFRESH_DATA',
            USER_NOT_FOUND: 'VERIFY_EMAIL',
            INVITATION_NOT_FOUND: 'REFRESH_INVITATIONS',
            DUPLICATE_INVITATION: 'CHECK_EXISTING',
            INVALID_EMAIL: 'CORRECT_EMAIL',
            SELF_INVITATION: 'CHANGE_EMAIL',
            SYNC_ERROR: 'RETRY_SYNC',
            GENERIC_ERROR: 'RETRY_LATER'
        };

        // Initialize error statistics
        this.errorStats = {
            totalErrors: 0,
            errorsByCategory: {},
            recentErrors: [],
            recoveryAttempts: 0,
            successfulRecoveries: 0
        };

        this.loadErrorStats();
    }

    /**
     * Main error handling method
     * 要件 2.4, 3.4, 7.4 に対応
     */
    handleError(error, context = {}) {
        try {
            // Create comprehensive error info
            const errorInfo = this.createErrorInfo(error, context);
            
            // Log the error
            this.logError(errorInfo);
            
            // Update statistics
            this.updateErrorStats(errorInfo);
            
            // Determine recovery strategy
            const recoveryResult = this.attemptRecovery(errorInfo);
            
            // Show user-friendly message
            this.displayUserMessage(errorInfo, recoveryResult);
            
            // Return structured error response
            return this.createErrorResponse(errorInfo, recoveryResult);

        } catch (handlingError) {
            console.error('Error in error handler:', handlingError);
            return this.createFallbackErrorResponse(error);
        }
    }

    /**
     * Create comprehensive error information
     */
    createErrorInfo(error, context) {
        const errorType = this.categorizeError(error);
        const errorConfig = this.errorCategories[errorType];
        
        return {
            id: this.generateErrorId(),
            timestamp: new Date(),
            type: errorType,
            originalError: error,
            message: error.message,
            stack: error.stack,
            context: {
                ...context,
                userAgent: navigator.userAgent,
                url: window.location.href,
                userId: context.userId || this.getCurrentUserId()
            },
            severity: errorConfig.severity,
            category: errorType,
            userFriendly: errorConfig.userFriendly,
            autoRetry: errorConfig.autoRetry,
            logLevel: errorConfig.logLevel
        };
    }

    /**
     * Categorize error based on message and context
     */
    categorizeError(error) {
        const message = error.message.toLowerCase();
        
        // Permission-related errors
        if (message.includes('権限') || message.includes('permission') || 
            message.includes('unauthorized') || message.includes('forbidden')) {
            return 'PERMISSION_DENIED';
        }
        
        // Token-related errors
        if (message.includes('無効') && message.includes('トークン') || 
            message.includes('invalid') && message.includes('token')) {
            return 'INVALID_TOKEN';
        }
        
        if (message.includes('期限切れ') || message.includes('expired')) {
            return 'EXPIRED_TOKEN';
        }
        
        // Data integrity errors
        if (message.includes('整合性') || message.includes('integrity') || 
            message.includes('不整合') || message.includes('orphaned')) {
            return 'DATA_INTEGRITY';
        }
        
        // Validation errors
        if (message.includes('validation') || message.includes('バリデーション') || 
            message.includes('invalid') || message.includes('無効')) {
            return 'VALIDATION_ERROR';
        }
        
        // Network errors
        if (message.includes('network') || message.includes('ネットワーク') || 
            message.includes('connection') || message.includes('接続')) {
            return 'NETWORK_ERROR';
        }
        
        // Specific entity not found errors
        if (message.includes('資金元') && message.includes('見つかりません') ||
            message.includes('fund source') && message.includes('not found')) {
            return 'FUND_SOURCE_NOT_FOUND';
        }
        
        if (message.includes('ユーザー') && message.includes('見つかりません') ||
            message.includes('user') && message.includes('not found')) {
            return 'USER_NOT_FOUND';
        }
        
        if (message.includes('招待') && message.includes('見つかりません') ||
            message.includes('invitation') && message.includes('not found')) {
            return 'INVITATION_NOT_FOUND';
        }
        
        // Duplicate invitation
        if (message.includes('既に招待') || message.includes('duplicate') && message.includes('invitation')) {
            return 'DUPLICATE_INVITATION';
        }
        
        // Email validation
        if (message.includes('メールアドレス') || message.includes('email')) {
            return 'INVALID_EMAIL';
        }
        
        // Self invitation
        if (message.includes('自分自身') || message.includes('self')) {
            return 'SELF_INVITATION';
        }
        
        // Sync errors
        if (message.includes('同期') || message.includes('sync')) {
            return 'SYNC_ERROR';
        }
        
        return 'GENERIC_ERROR';
    }

    /**
     * Attempt error recovery based on error type
     */
    attemptRecovery(errorInfo) {
        const recoveryAction = this.recoveryActions[errorInfo.type];
        const recoveryResult = {
            attempted: false,
            successful: false,
            action: recoveryAction,
            details: null,
            retryable: errorInfo.autoRetry
        };

        if (!errorInfo.autoRetry) {
            return recoveryResult;
        }

        recoveryResult.attempted = true;
        this.errorStats.recoveryAttempts++;

        try {
            switch (recoveryAction) {
                case 'AUTO_REPAIR':
                    recoveryResult.details = this.attemptDataRepair(errorInfo);
                    recoveryResult.successful = recoveryResult.details.success;
                    break;
                    
                case 'RETRY_SYNC':
                    recoveryResult.details = this.attemptSyncRetry(errorInfo);
                    recoveryResult.successful = recoveryResult.details.success;
                    break;
                    
                case 'REFRESH_DATA':
                    recoveryResult.details = this.attemptDataRefresh(errorInfo);
                    recoveryResult.successful = recoveryResult.details.success;
                    break;
                    
                default:
                    recoveryResult.attempted = false;
            }

            if (recoveryResult.successful) {
                this.errorStats.successfulRecoveries++;
            }

        } catch (recoveryError) {
            console.error('Recovery attempt failed:', recoveryError);
            recoveryResult.details = { 
                success: false, 
                error: recoveryError.message 
            };
        }

        return recoveryResult;
    }

    /**
     * Attempt to repair data integrity issues
     */
    attemptDataRepair(errorInfo) {
        try {
            // Use existing data manager repair functionality if available
            if (window.dataManager && window.dataManager.validateAndRepairSharingData) {
                const repairResult = window.dataManager.validateAndRepairSharingData();
                return {
                    success: repairResult.success,
                    details: repairResult,
                    message: 'データの自動修復を実行しました'
                };
            }

            // Fallback repair logic
            return this.performBasicDataRepair();

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'データ修復に失敗しました'
            };
        }
    }

    /**
     * Perform basic data repair operations
     */
    performBasicDataRepair() {
        try {
            let repaired = false;
            
            // Clean up orphaned sharing data
            const fundSources = this.storage.getFundSources();
            const transactions = this.storage.getTransactions();
            
            // Fix orphaned shared transactions
            let updatedTransactions = false;
            for (const transaction of transactions) {
                if (transaction.isShared && transaction.fundSourceId) {
                    const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
                    if (!fundSource || !fundSource.isShared) {
                        transaction.isShared = false;
                        delete transaction.sharedFundSourceId;
                        transaction.updatedAt = new Date();
                        updatedTransactions = true;
                        repaired = true;
                    }
                }
            }
            
            if (updatedTransactions) {
                this.storage.setTransactions(transactions);
            }

            return {
                success: repaired,
                message: repaired ? 'データの不整合を修復しました' : 'データに問題は見つかりませんでした',
                details: { orphanedTransactionsFixed: updatedTransactions }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'データ修復中にエラーが発生しました'
            };
        }
    }

    /**
     * Attempt to retry synchronization
     */
    attemptSyncRetry(errorInfo) {
        try {
            // Use sharing manager sync if available
            if (window.sharingManager && window.sharingManager.performManualSync) {
                const syncResult = window.sharingManager.performManualSync();
                return {
                    success: syncResult.success,
                    details: syncResult,
                    message: 'データ同期を再試行しました'
                };
            }

            return {
                success: false,
                message: '同期機能が利用できません'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '同期の再試行に失敗しました'
            };
        }
    }

    /**
     * Attempt to refresh data
     */
    attemptDataRefresh(errorInfo) {
        try {
            // Trigger data refresh if UI manager is available
            if (window.uiManager && window.uiManager.loadInitialData) {
                window.uiManager.loadInitialData();
                return {
                    success: true,
                    message: 'データを再読み込みしました'
                };
            }

            return {
                success: false,
                message: 'データ再読み込み機能が利用できません'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'データ再読み込みに失敗しました'
            };
        }
    }

    /**
     * Display user-friendly error message
     */
    displayUserMessage(errorInfo, recoveryResult) {
        if (!errorInfo.userFriendly || !this.uiUtils) {
            return;
        }

        let message = this.errorMessages[errorInfo.type] || this.errorMessages.GENERIC_ERROR;
        let notificationType = 'error';

        // Adjust message based on recovery result
        if (recoveryResult.attempted && recoveryResult.successful) {
            message = recoveryResult.details.message || '問題を自動修復しました。';
            notificationType = 'success';
        } else if (recoveryResult.attempted && !recoveryResult.successful) {
            message += ' 自動修復に失敗しました。';
        }

        // Add recovery suggestions for non-auto-retry errors
        if (!errorInfo.autoRetry) {
            const suggestion = this.getRecoverySuggestion(errorInfo.type);
            if (suggestion) {
                message += ` ${suggestion}`;
            }
        }

        // Show notification with appropriate type
        if (errorInfo.severity === 'low') {
            notificationType = 'warning';
        }

        this.uiUtils.showNotification(message, notificationType);
    }

    /**
     * Get recovery suggestion for user
     */
    getRecoverySuggestion(errorType) {
        const suggestions = {
            PERMISSION_DENIED: 'ログイン状態を確認してください。',
            INVALID_TOKEN: '招待を送信した方に連絡してください。',
            EXPIRED_TOKEN: '新しい招待を依頼してください。',
            VALIDATION_ERROR: '入力内容を確認してください。',
            FUND_SOURCE_NOT_FOUND: 'ページを更新してください。',
            USER_NOT_FOUND: 'メールアドレスを確認してください。',
            INVITATION_NOT_FOUND: '招待一覧を更新してください。',
            DUPLICATE_INVITATION: '既存の招待を確認してください。',
            INVALID_EMAIL: '正しいメールアドレス形式で入力してください。',
            SELF_INVITATION: '他のユーザーのメールアドレスを入力してください。'
        };

        return suggestions[errorType] || null;
    }

    /**
     * Create structured error response
     */
    createErrorResponse(errorInfo, recoveryResult) {
        return {
            success: false,
            error: {
                id: errorInfo.id,
                type: errorInfo.type,
                message: errorInfo.message,
                severity: errorInfo.severity,
                timestamp: errorInfo.timestamp,
                userMessage: this.errorMessages[errorInfo.type] || this.errorMessages.GENERIC_ERROR,
                context: errorInfo.context
            },
            recovery: recoveryResult,
            retryable: errorInfo.autoRetry && !recoveryResult.successful,
            suggestedAction: this.recoveryActions[errorInfo.type]
        };
    }

    /**
     * Create fallback error response when error handling fails
     */
    createFallbackErrorResponse(originalError) {
        return {
            success: false,
            error: {
                id: this.generateErrorId(),
                type: 'GENERIC_ERROR',
                message: originalError.message,
                severity: 'high',
                timestamp: new Date(),
                userMessage: 'システムエラーが発生しました。管理者にお問い合わせください。',
                context: { fallback: true }
            },
            recovery: { attempted: false, successful: false },
            retryable: false,
            suggestedAction: 'CONTACT_SUPPORT'
        };
    }

    /**
     * Log error with appropriate level
     */
    logError(errorInfo) {
        const logMessage = `[${errorInfo.type}] ${errorInfo.message}`;
        
        switch (errorInfo.logLevel) {
            case 'error':
                console.error(logMessage, errorInfo);
                break;
            case 'warn':
                console.warn(logMessage, errorInfo);
                break;
            case 'info':
                console.info(logMessage, errorInfo);
                break;
            default:
                console.log(logMessage, errorInfo);
        }

        // Store in persistent log
        this.storeErrorLog(errorInfo);
    }

    /**
     * Store error in persistent log
     */
    storeErrorLog(errorInfo) {
        try {
            const errorLog = this.storage.getItem('sharing_error_log', []);
            
            // Add new error
            errorLog.push({
                id: errorInfo.id,
                timestamp: errorInfo.timestamp,
                type: errorInfo.type,
                message: errorInfo.message,
                severity: errorInfo.severity,
                context: errorInfo.context,
                userId: errorInfo.context.userId
            });
            
            // Keep only last 100 errors
            if (errorLog.length > 100) {
                errorLog.splice(0, errorLog.length - 100);
            }
            
            this.storage.setItem('sharing_error_log', errorLog);

        } catch (error) {
            console.error('Failed to store error log:', error);
        }
    }

    /**
     * Update error statistics
     */
    updateErrorStats(errorInfo) {
        this.errorStats.totalErrors++;
        
        if (!this.errorStats.errorsByCategory[errorInfo.type]) {
            this.errorStats.errorsByCategory[errorInfo.type] = 0;
        }
        this.errorStats.errorsByCategory[errorInfo.type]++;
        
        // Keep recent errors (last 10)
        this.errorStats.recentErrors.unshift({
            id: errorInfo.id,
            type: errorInfo.type,
            timestamp: errorInfo.timestamp,
            severity: errorInfo.severity
        });
        
        if (this.errorStats.recentErrors.length > 10) {
            this.errorStats.recentErrors.pop();
        }
        
        this.saveErrorStats();
    }

    /**
     * Load error statistics from storage
     */
    loadErrorStats() {
        try {
            const savedStats = this.storage.getItem('sharing_error_stats', null);
            if (savedStats) {
                this.errorStats = { ...this.errorStats, ...savedStats };
            }
        } catch (error) {
            console.warn('Failed to load error statistics:', error);
        }
    }

    /**
     * Save error statistics to storage
     */
    saveErrorStats() {
        try {
            this.storage.setItem('sharing_error_stats', this.errorStats);
        } catch (error) {
            console.warn('Failed to save error statistics:', error);
        }
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        return { ...this.errorStats };
    }

    /**
     * Get recent error log
     */
    getErrorLog(limit = 50) {
        try {
            const errorLog = this.storage.getItem('sharing_error_log', []);
            return errorLog.slice(-limit).reverse(); // Most recent first
        } catch (error) {
            console.error('Failed to get error log:', error);
            return [];
        }
    }

    /**
     * Clear error log and statistics
     */
    clearErrorData() {
        try {
            this.storage.removeItem('sharing_error_log');
            this.storage.removeItem('sharing_error_stats');
            
            this.errorStats = {
                totalErrors: 0,
                errorsByCategory: {},
                recentErrors: [],
                recoveryAttempts: 0,
                successfulRecoveries: 0
            };
            
            return true;
        } catch (error) {
            console.error('Failed to clear error data:', error);
            return false;
        }
    }

    /**
     * Utility methods
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getCurrentUserId() {
        try {
            if (window.authManager && window.authManager.getCurrentUser) {
                const user = window.authManager.getCurrentUser();
                return user ? user.id : null;
            }
        } catch (error) {
            // Ignore error
        }
        return null;
    }

    /**
     * Test error handling with different error types
     */
    testErrorHandling() {
        const testErrors = [
            new Error('権限がありません'),
            new Error('無効なトークンです'),
            new Error('期限切れの招待です'),
            new Error('データの整合性に問題があります'),
            new Error('有効なメールアドレスを入力してください'),
            new Error('自分自身を招待することはできません')
        ];

        console.log('Testing error handling...');
        
        testErrors.forEach((error, index) => {
            setTimeout(() => {
                const result = this.handleError(error, { test: true, errorIndex: index });
                console.log(`Test ${index + 1} result:`, result);
            }, index * 1000);
        });
    }
}

// Export for use in other modules
window.SharingErrorHandler = SharingErrorHandler;