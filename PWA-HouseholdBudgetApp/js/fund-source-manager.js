// Fund Source Manager - Handles all fund source-related operations
class FundSourceManager {
    constructor(storage, permissionManager) {
        this.storage = storage;
        this.permissionManager = permissionManager;
        
        // Performance optimizations
        this.cache = new PerformanceCache();
        this.dataOptimizer = new DataAccessOptimizer(storage, this.cache);
    }

    // Core fund source operations
    getFundSources() {
        return this.dataOptimizer ? 
            this.dataOptimizer.getFundSources() : 
            this.storage.getFundSources();
    }

    addFundSource(fundSourceData) {
        const operationId = 'addFundSource';
        
        try {
            // Show loading indicator
            if (window.loadingManager) {
                window.loadingManager.showOperationLoading(operationId, {
                    message: '資金元を追加中...',
                    showOverlay: false
                });
            }
            
            // Validate fund source data
            const validationErrors = this.validateFundSource(fundSourceData);
        if (validationErrors.length > 0) {
            throw new Error(`Fund source validation failed: ${validationErrors.join(', ')}`);
        }

        // Validate type selection (requirement 5.1, 5.2, 5.3)
        if (!fundSourceData.type) {
            throw new Error('資金元タイプを選択してください');
        }

        // Set owner
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (currentUser) {
            fundSourceData.ownerId = currentUser.id;
        }

        // Initialize sharing properties
        fundSourceData.isShared = false;
        fundSourceData.sharedWith = [];
        fundSourceData.permissions = this.permissionManager ? 
            this.permissionManager.getDefaultPermissions() : 
            { canView: true, canEdit: false, canDelete: false };

            // Add fund source to storage
            const result = this.storage.addFundSource(fundSourceData);
            
            // Trigger UI update (requirement 6.1, 6.2, 6.3)
            if (result && window.uiUpdateManager) {
                window.uiUpdateManager.notifyDataChange('fundSource', 'add', result);
            }

            return result;
            
        } finally {
            // Hide loading indicator
            if (window.loadingManager) {
                window.loadingManager.hideLoading(operationId);
            }
        }
    }

    updateFundSource(id, updates) {
        const operationId = 'updateFundSource';
        
        try {
            // Show loading indicator
            if (window.loadingManager) {
                window.loadingManager.showOperationLoading(operationId, {
                    message: '資金元を更新中...',
                    showOverlay: false
                });
            }
            
            // Check permission to manage fund source
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (currentUser) {
            const fundSources = this.getFundSources();
            if (!this.permissionManager.canManageFundSource(currentUser.id, id, fundSources)) {
                throw new Error('この資金元を編集する権限がありません');
            }
        }

        // Get existing fund source
        const fundSources = this.getFundSources();
        const existingFundSource = fundSources.find(fs => fs.id === id);
        if (!existingFundSource) {
            throw new Error('Fund source not found');
        }

        // Validate updated data
        const updatedData = { ...existingFundSource, ...updates };
        const validationErrors = this.validateFundSource(updatedData);
        if (validationErrors.length > 0) {
            throw new Error(`Fund source validation failed: ${validationErrors.join(', ')}`);
        }

        // Add update tracking
        updates.updatedAt = new Date();
        if (currentUser) {
            updates.updatedBy = currentUser.id;
        }

        // Update fund source
        const index = fundSources.findIndex(fs => fs.id === id);
        if (index !== -1) {
            fundSources[index] = { ...fundSources[index], ...updates };
            this.storage.setFundSources(fundSources);
            
            // Notify data change
            this.storage.notifyDataChange('fundSource', 'update', fundSources[index]);
            
                // Trigger UI update (requirement 6.1, 6.2, 6.3)
                if (window.uiUpdateManager) {
                    window.uiUpdateManager.notifyDataChange('fundSource', 'update', fundSources[index]);
                }
                
                return fundSources[index];
            }
            
            return null;
            
        } finally {
            // Hide loading indicator
            if (window.loadingManager) {
                window.loadingManager.hideLoading(operationId);
            }
        }
    }

    deleteFundSource(id) {
        const operationId = 'deleteFundSource';
        
        try {
            // Show loading indicator
            if (window.loadingManager) {
                window.loadingManager.showOperationLoading(operationId, {
                    message: '資金元を削除中...',
                    showOverlay: false
                });
            }
            
            // Check permission to manage fund source
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (currentUser) {
            const fundSources = this.getFundSources();
            if (!this.permissionManager.canManageFundSource(currentUser.id, id, fundSources)) {
                throw new Error('この資金元を削除する権限がありません');
            }
        }

        // Check if deletion is allowed
        if (!this.canDeleteFundSource(id)) {
            throw new Error('この資金元は取引で使用されているため削除できません');
        }

            // Direct storage operation
            const result = this.storage.deleteFundSource(id);
            
            // Trigger UI update
            if (result && window.uiUpdateManager) {
                window.uiUpdateManager.notifyDataChange('fundSource', 'delete', { id });
            }
            
            return result;
            
        } finally {
            // Hide loading indicator
            if (window.loadingManager) {
                window.loadingManager.hideLoading(operationId);
            }
        }
    }

    canDeleteFundSource(id) {
        // Use integrity manager if available
        if (window.dataIntegrityManager) {
            return window.dataIntegrityManager.canDelete('fundSources', id);
        }

        // Fallback check
        const transactions = this.storage.getTransactions();
        return !transactions.some(t => t.fundSourceId === id);
    }

    // Fund source validation
    validateFundSource(fundSourceData) {
        const errors = [];

        // Required fields validation
        if (!fundSourceData.name || typeof fundSourceData.name !== 'string' || fundSourceData.name.trim() === '') {
            errors.push('資金元名を入力してください');
        }

        if (fundSourceData.balance === undefined || fundSourceData.balance === null || 
            typeof fundSourceData.balance !== 'number' || isNaN(fundSourceData.balance)) {
            errors.push('有効な残高を入力してください');
        }

        // Type validation (requirement 5.1, 5.2, 5.3)
        if (!fundSourceData.type || typeof fundSourceData.type !== 'string' || fundSourceData.type.trim() === '') {
            errors.push('資金元タイプを選択してください');
        } else {
            const validTypes = ['bank', 'cash', 'credit', 'digital'];
            if (!validTypes.includes(fundSourceData.type)) {
                errors.push('無効な資金元タイプです');
            }
        }

        // Business logic validation
        if (fundSourceData.name && fundSourceData.name.trim().length > 50) {
            errors.push('資金元名は50文字以内で入力してください');
        }

        if (fundSourceData.balance !== undefined && Math.abs(fundSourceData.balance) > 100000000) {
            errors.push('残高が大きすぎます');
        }

        // Check for duplicate names
        if (fundSourceData.name) {
            const existingFundSources = this.getFundSources();
            const duplicate = existingFundSources.find(fs => 
                fs.name.toLowerCase().trim() === fundSourceData.name.toLowerCase().trim() && 
                fs.id !== fundSourceData.id
            );
            if (duplicate) {
                errors.push(`資金元名「${fundSourceData.name}」は既に存在します`);
            }
        }

        return errors;
    }

    // Balance management
    updateFundSourceBalance(id, amount) {
        const fundSources = this.getFundSources();
        const index = fundSources.findIndex(fs => fs.id === id);
        if (index !== -1) {
            fundSources[index].balance += amount;
            fundSources[index].updatedAt = new Date();
            this.storage.setFundSources(fundSources);
            
            // Notify data change
            this.storage.notifyDataChange('fundSource', 'update', fundSources[index]);
            
            return fundSources[index];
        }
        return null;
    }

    getTotalBalance() {
        const fundSources = this.getFundSources();
        return fundSources.reduce((total, fs) => total + fs.balance, 0);
    }

    // Sharing-related methods
    getFundSourceSharingStatus(fundSourceId) {
        const fundSources = this.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === fundSourceId);
        
        if (!fundSource) {
            return null;
        }

        return {
            isShared: fundSource.isShared || false,
            sharedWith: fundSource.sharedWith || [],
            permissions: fundSource.permissions || this.permissionManager.getDefaultPermissions(),
            ownerId: fundSource.ownerId
        };
    }

    shareFundSource(fundSourceId, userEmails, permissions = null) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) {
            throw new Error('ログインが必要です');
        }

        const fundSources = this.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === fundSourceId);
        
        if (!fundSource) {
            throw new Error('指定された資金元が見つかりません');
        }

        // Check if user owns this fund source
        if (fundSource.ownerId && fundSource.ownerId !== currentUser.id) {
            throw new Error('この資金元を共有する権限がありません');
        }

        // Set owner if not set
        if (!fundSource.ownerId) {
            fundSource.ownerId = currentUser.id;
        }

        // Update sharing settings
        fundSource.isShared = true;
        fundSource.sharedWith = fundSource.sharedWith || [];
        fundSource.permissions = permissions || this.permissionManager.getDefaultPermissions();
        fundSource.updatedAt = new Date();

        // Update fund source
        const fundSourceIndex = fundSources.findIndex(fs => fs.id === fundSourceId);
        fundSources[fundSourceIndex] = fundSource;
        this.storage.setFundSources(fundSources);

        // Update related transactions sharing status
        this.updateRelatedTransactionSharing(fundSourceId, true);

        return fundSource;
    }

    unshareFundSource(fundSourceId, userId = null) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) {
            throw new Error('ログインが必要です');
        }

        const fundSources = this.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === fundSourceId);
        
        if (!fundSource) {
            throw new Error('指定された資金元が見つかりません');
        }

        // Check permissions
        if (fundSource.ownerId !== currentUser.id) {
            throw new Error('この資金元の共有を解除する権限がありません');
        }

        if (userId) {
            // Remove specific user
            fundSource.sharedWith = fundSource.sharedWith.filter(user => user.userId !== userId);
            
            // If no more shared users, disable sharing
            if (fundSource.sharedWith.length === 0) {
                fundSource.isShared = false;
            }
        } else {
            // Remove all sharing
            fundSource.isShared = false;
            fundSource.sharedWith = [];
        }

        fundSource.updatedAt = new Date();

        // Update fund source
        const fundSourceIndex = fundSources.findIndex(fs => fs.id === fundSourceId);
        fundSources[fundSourceIndex] = fundSource;
        this.storage.setFundSources(fundSources);

        // Update related transactions sharing status
        this.updateRelatedTransactionSharing(fundSourceId, fundSource.isShared);

        return fundSource;
    }

    // Update transaction sharing status based on fund source
    updateRelatedTransactionSharing(fundSourceId, isShared) {
        try {
            const transactions = this.storage.getTransactions();
            let updated = false;

            for (const transaction of transactions) {
                if (transaction.fundSourceId === fundSourceId) {
                    transaction.isShared = isShared;
                    transaction.updatedAt = new Date();
                    updated = true;
                }
            }

            if (updated) {
                this.storage.setTransactions(transactions);
                this.storage.notifyDataChange('transaction', 'update_sharing', { fundSourceId, isShared });
            }
        } catch (error) {
            console.error('Error updating related transaction sharing:', error);
        }
    }

    // Permission checking methods
    canViewFundSource(fundSourceId) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return false;

        const fundSources = this.getFundSources();
        return this.permissionManager.canViewFundSource(currentUser.id, fundSourceId, fundSources);
    }

    canManageFundSource(fundSourceId) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return false;

        const fundSources = this.getFundSources();
        return this.permissionManager.canManageFundSource(currentUser.id, fundSourceId, fundSources);
    }

    canInviteUsers(fundSourceId) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return false;

        const fundSources = this.getFundSources();
        return this.permissionManager.canInviteUsers(currentUser.id, fundSourceId, fundSources);
    }

    getUserPermissions(fundSourceId) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return null;

        const fundSources = this.getFundSources();
        return this.permissionManager.getUserPermissions(currentUser.id, fundSourceId, fundSources);
    }

    getUserPermissionLevel(fundSourceId) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return null;

        const fundSources = this.getFundSources();
        return this.permissionManager.getUserPermissionLevel(currentUser.id, fundSourceId, fundSources);
    }

    // Query methods
    getOwnedFundSources() {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return [];

        const fundSources = this.getFundSources();
        return fundSources.filter(fs => !fs.ownerId || fs.ownerId === currentUser.id);
    }

    getSharedFundSources() {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return [];

        const fundSources = this.getFundSources();
        return fundSources.filter(fs => {
            if (!fs.isShared || !fs.sharedWith) return false;
            return fs.sharedWith.some(user => user.userId === currentUser.id);
        });
    }

    getAccessibleFundSources() {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return this.getFundSources();

        const fundSources = this.getFundSources();
        return fundSources.filter(fs => {
            // Own fund sources
            if (!fs.ownerId || fs.ownerId === currentUser.id) return true;
            
            // Shared fund sources
            if (fs.isShared && fs.sharedWith) {
                return fs.sharedWith.some(user => user.userId === currentUser.id);
            }
            
            return false;
        });
    }

    getFundSourcesByType(type) {
        const fundSources = this.getFundSources();
        return fundSources.filter(fs => fs.type === type);
    }

    // Statistics methods
    getFundSourceStatistics() {
        const fundSources = this.getFundSources();
        const transactions = this.storage.getTransactions();

        const stats = {
            total: fundSources.length,
            totalBalance: this.getTotalBalance(),
            byType: {},
            shared: 0,
            owned: 0,
            transactionCounts: {}
        };

        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;

        fundSources.forEach(fs => {
            // Count by type
            if (!stats.byType[fs.type]) {
                stats.byType[fs.type] = { count: 0, balance: 0 };
            }
            stats.byType[fs.type].count++;
            stats.byType[fs.type].balance += fs.balance;

            // Count shared/owned
            if (fs.isShared) {
                stats.shared++;
            }
            if (currentUser && (!fs.ownerId || fs.ownerId === currentUser.id)) {
                stats.owned++;
            }

            // Count transactions per fund source
            const transactionCount = transactions.filter(t => t.fundSourceId === fs.id).length;
            stats.transactionCounts[fs.id] = transactionCount;
        });

        return stats;
    }

    // Utility methods
    formatBalance(balance) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY'
        }).format(balance);
    }

    getFundSourceDisplayName(fundSourceId) {
        const fundSources = this.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === fundSourceId);
        return fundSource ? fundSource.name : '不明な資金元';
    }

    getFundSourceTypeDisplay(type) {
        const typeMap = {
            'cash': '現金',
            'bank': '銀行口座',
            'credit': 'クレジットカード',
            'debit': 'デビットカード',
            'electronic': '電子マネー',
            'other': 'その他'
        };
        return typeMap[type] || type;
    }
}

// Export for global use
window.FundSourceManager = FundSourceManager;