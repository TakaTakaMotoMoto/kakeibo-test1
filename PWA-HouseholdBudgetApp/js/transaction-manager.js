// Transaction Manager - Handles all transaction-related operations
class TransactionManager {
    constructor(storage, permissionManager) {
        this.storage = storage;
        this.permissionManager = permissionManager;
        
        // Performance optimizations
        this.cache = new PerformanceCache();
        this.dataOptimizer = new DataAccessOptimizer(storage, this.cache);
        
        // Initialize performance features
        this.initializePerformanceOptimizations();
    }

    // Initialize performance optimizations
    initializePerformanceOptimizations() {
        // Preload commonly accessed data
        if (this.dataOptimizer) {
            this.dataOptimizer.preloadCommonData();
        }

        // Set up optimized filter state management
        this.optimizedFilterState = {
            lastApplied: null,
            cachedResults: new Map(),
            filterHash: null
        };
    }

    // Core transaction operations
    getTransactions(filtered = false, filters = null) {
        // Use optimized data access
        let transactions = this.dataOptimizer ?
            this.dataOptimizer.getTransactions() :
            this.storage.getTransactions();

        if (filtered && filters && this.hasActiveFilters(filters)) {
            transactions = this.applyFiltersOptimized(transactions, filters);
        }

        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    addTransaction(transactionData) {
        // Check permission to create transaction in the fund source
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (currentUser && transactionData.fundSourceId) {
            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === transactionData.fundSourceId);

            if (fundSource && fundSource.isShared) {
                if (!this.permissionManager.canViewFundSource(currentUser.id, transactionData.fundSourceId, fundSources)) {
                    throw new Error('この資金元にアクセスする権限がありません');
                }

                // For shared fund sources, check if user has edit permission
                const userPermissions = this.permissionManager.getUserPermissions(currentUser.id, transactionData.fundSourceId, fundSources);
                if (userPermissions && !userPermissions.canEdit) {
                    throw new Error('この資金元で取引を作成する権限がありません');
                }
            }
        }

        // Validate transaction data
        const validationErrors = this.validateTransaction(transactionData);
        if (validationErrors.length > 0) {
            throw new Error(`Transaction validation failed: ${validationErrors.join(', ')}`);
        }

        // Add sharing-related fields
        if (currentUser) {
            transactionData.createdBy = currentUser.id;
            transactionData.createdByUsername = currentUser.username || currentUser.email;
        }

        // Check if transaction should be marked as shared
        if (transactionData.fundSourceId) {
            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === transactionData.fundSourceId);
            if (fundSource && fundSource.isShared) {
                transactionData.isShared = true;
            }
        }

        // Direct storage operation
        const transaction = this.storage.addTransaction(transactionData);
        return transaction;
    }

    updateTransaction(id, updates) {
        // Check permission to edit transaction
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        const existingTransaction = this.storage.getTransactions().find(t => t.id === id);
        if (!existingTransaction) {
            throw new Error('Transaction not found');
        }

        if (currentUser) {
            const transactions = this.storage.getTransactions();
            const fundSources = this.storage.getFundSources();

            if (!this.permissionManager.canEditTransaction(currentUser.id, id, transactions, fundSources)) {
                throw new Error('この取引を編集する権限がありません');
            }
        }

        const updatedData = { ...existingTransaction, ...updates };
        const validationErrors = this.validateTransaction(updatedData);
        if (validationErrors.length > 0) {
            throw new Error(`Transaction validation failed: ${validationErrors.join(', ')}`);
        }

        // Add update tracking
        updates.updatedAt = new Date();
        if (currentUser) {
            updates.updatedBy = currentUser.id;
        }

        // Direct storage operation
        return this.storage.updateTransaction(id, updates);
    }

    deleteTransaction(id) {
        // Check permission to delete transaction
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        const transaction = this.storage.getTransactions().find(t => t.id === id);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (currentUser) {
            const transactions = this.storage.getTransactions();
            const fundSources = this.storage.getFundSources();

            if (!this.permissionManager.canDeleteTransaction(currentUser.id, id, transactions, fundSources)) {
                throw new Error('この取引を削除する権限がありません');
            }
        }

        // Direct storage operation
        return this.storage.deleteTransaction(id);
    }

    // Transaction validation
    validateTransaction(transactionData) {
        const errors = [];

        // Required fields validation
        if (!transactionData.amount || typeof transactionData.amount !== 'number' || isNaN(transactionData.amount)) {
            errors.push('有効な金額を入力してください');
        }

        if (!transactionData.categoryId) {
            errors.push('カテゴリを選択してください');
        }

        if (!transactionData.fundSourceId) {
            errors.push('資金元を選択してください');
        }

        if (!transactionData.date) {
            errors.push('日付を入力してください');
        }

        // Business logic validation
        if (transactionData.amount === 0) {
            errors.push('金額は0以外を入力してください');
        }

        if (Math.abs(transactionData.amount) > 10000000) {
            errors.push('金額が大きすぎます');
        }

        // Date validation
        if (transactionData.date) {
            const transactionDate = new Date(transactionData.date);
            const now = new Date();
            const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            
            if (transactionDate > oneYearFromNow) {
                errors.push('未来の日付は1年以内にしてください');
            }
        }

        return errors;
    }

    // Filter operations
    applyFiltersOptimized(transactions, filters) {
        const filterHash = this.generateFilterHash(filters);

        // Check if we have cached results for this filter combination
        if (this.optimizedFilterState.filterHash === filterHash &&
            this.optimizedFilterState.cachedResults.has(filterHash)) {
            return this.optimizedFilterState.cachedResults.get(filterHash);
        }

        // Apply filters efficiently
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        const filteredTransactions = transactions.filter(transaction => {
            // Date filters (most selective first)
            if (filters.startDate && new Date(transaction.date) < new Date(filters.startDate)) {
                return false;
            }
            if (filters.endDate && new Date(transaction.date) > new Date(filters.endDate)) {
                return false;
            }

            // ID-based filters (fast lookups)
            if (filters.category && transaction.categoryId !== filters.category) {
                return false;
            }
            if (filters.fundSource && transaction.fundSourceId !== filters.fundSource) {
                return false;
            }
            if (filters.createdBy && transaction.createdBy !== filters.createdBy) {
                return false;
            }

            // Boolean filters
            if (filters.showOnlyMyTransactions && currentUser) {
                if (transaction.createdBy !== currentUser.id) {
                    return false;
                }
            }
            if (filters.showOnlySharedTransactions) {
                if (!transaction.isShared) {
                    return false;
                }
            }

            return true;
        });

        // Cache the results
        this.optimizedFilterState.filterHash = filterHash;
        this.optimizedFilterState.cachedResults.set(filterHash, filteredTransactions);
        this.optimizedFilterState.lastApplied = Date.now();

        // Clean up old cached results (keep only last 5)
        if (this.optimizedFilterState.cachedResults.size > 5) {
            const oldestKey = this.optimizedFilterState.cachedResults.keys().next().value;
            this.optimizedFilterState.cachedResults.delete(oldestKey);
        }

        return filteredTransactions;
    }

    // Generate hash for current filter state
    generateFilterHash(filters) {
        return JSON.stringify(filters);
    }

    hasActiveFilters(filters) {
        return Object.values(filters).some(filter => filter !== null && filter !== false);
    }

    // Specialized query methods
    getTransactionsByDate(date) {
        const targetDate = new Date(date);
        return this.getTransactions().filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.toDateString() === targetDate.toDateString();
        });
    }

    getTransactionsByMonth(year, month) {
        return this.getTransactions().filter(transaction => {
            const date = new Date(transaction.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    }

    getTransactionsByCreator(creatorId) {
        const transactions = this.storage.getTransactions();
        return transactions.filter(transaction => transaction.createdBy === creatorId);
    }

    getSharedTransactions() {
        const transactions = this.storage.getTransactions();
        return transactions.filter(transaction => transaction.isShared === true);
    }

    getMyTransactions() {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return [];

        const transactions = this.storage.getTransactions();
        return transactions.filter(transaction => transaction.createdBy === currentUser.id);
    }

    getAvailableCreators() {
        const transactions = this.storage.getTransactions();
        const creators = new Set();

        transactions.forEach(transaction => {
            if (transaction.createdBy && transaction.createdByUsername) {
                creators.add({
                    id: transaction.createdBy,
                    username: transaction.createdByUsername
                });
            }
        });

        return Array.from(creators);
    }

    // Analytics methods
    getCategoryTotals(transactions = null) {
        const txns = transactions || this.getTransactions();
        const categories = this.storage.getCategories();
        const totals = {};

        categories.forEach(category => {
            totals[category.id] = {
                category,
                total: 0,
                count: 0
            };
        });

        txns.forEach(transaction => {
            if (transaction.categoryId && totals[transaction.categoryId]) {
                totals[transaction.categoryId].total += Math.abs(transaction.amount);
                totals[transaction.categoryId].count += 1;
            }
        });

        return Object.values(totals).filter(item => item.total > 0);
    }

    getMonthlyTotals(months = 12) {
        const now = new Date();
        const monthlyData = [];

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const transactions = this.getTransactionsByMonth(date.getFullYear(), date.getMonth());
            const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

            monthlyData.push({
                month: date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' }),
                total,
                count: transactions.length
            });
        }

        return monthlyData;
    }

    getDailyTotals(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dailyData = {};

        // Initialize all days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            dailyData[day] = {
                date,
                total: 0,
                transactions: []
            };
        }

        // Add transaction data
        const monthTransactions = this.getTransactionsByMonth(year, month);
        monthTransactions.forEach(transaction => {
            const day = new Date(transaction.date).getDate();
            if (dailyData[day]) {
                dailyData[day].total += Math.abs(transaction.amount);
                dailyData[day].transactions.push(transaction);
            }
        });

        return dailyData;
    }

    // Permission checking methods
    canEditTransaction(transaction) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return false;

        const transactions = this.storage.getTransactions();
        const fundSources = this.storage.getFundSources();

        return this.permissionManager.canEditTransaction(currentUser.id, transaction.id, transactions, fundSources);
    }

    canDeleteTransaction(transaction) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return false;

        const transactions = this.storage.getTransactions();
        const fundSources = this.storage.getFundSources();

        return this.permissionManager.canDeleteTransaction(currentUser.id, transaction.id, transactions, fundSources);
    }

    getTransactionCreatorDisplay(transaction) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;

        if (!transaction.createdBy) {
            return 'ゲスト';
        }

        if (currentUser && transaction.createdBy === currentUser.id) {
            return '自分';
        }

        return transaction.createdByUsername || 'ユーザー';
    }

    isTransactionShared(transaction) {
        const fundSources = this.storage.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
        return fundSource ? fundSource.isShared : false;
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY'
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(date) {
        return new Date(date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Export for global use
window.TransactionManager = TransactionManager;