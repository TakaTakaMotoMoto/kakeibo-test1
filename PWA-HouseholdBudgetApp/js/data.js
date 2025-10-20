// Data Processing and Business Logic
class DataManager {
    constructor(storage) {
        this.storage = storage;
        this.filters = {
            startDate: null,
            endDate: null,
            category: null,
            fundSource: null
        };
    }

    // Transaction methods
    getTransactions(filtered = false) {
        let transactions = this.storage.getTransactions();
        
        if (filtered && this.hasActiveFilters()) {
            transactions = this.applyFilters(transactions);
        }
        
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    addTransaction(transactionData) {
        const transaction = this.storage.addTransaction(transactionData);
        
        // Update fund source balance
        if (transaction.fundSourceId) {
            this.storage.updateFundSourceBalance(transaction.fundSourceId, transaction.amount);
            
            // Mark transaction as shared if fund source is shared
            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
            if (fundSource && fundSource.isShared) {
                transaction.isShared = true;
                // Update the transaction in storage
                const transactions = this.storage.getTransactions();
                const index = transactions.findIndex(t => t.id === transaction.id);
                if (index !== -1) {
                    transactions[index] = transaction;
                    this.storage.setTransactions(transactions);
                }
            }
        }
        
        return transaction;
    }

    updateTransaction(id, updates) {
        const oldTransaction = this.storage.getTransactions().find(t => t.id === id);
        const updatedTransaction = this.storage.updateTransaction(id, updates);
        
        if (updatedTransaction && oldTransaction) {
            // Revert old balance change
            if (oldTransaction.fundSourceId) {
                this.storage.updateFundSourceBalance(oldTransaction.fundSourceId, -oldTransaction.amount);
            }
            
            // Apply new balance change
            if (updatedTransaction.fundSourceId) {
                this.storage.updateFundSourceBalance(updatedTransaction.fundSourceId, updatedTransaction.amount);
            }
        }
        
        return updatedTransaction;
    }

    deleteTransaction(id) {
        const transaction = this.storage.getTransactions().find(t => t.id === id);
        const deleted = this.storage.deleteTransaction(id);
        
        if (deleted && transaction && transaction.fundSourceId) {
            // Revert balance change
            this.storage.updateFundSourceBalance(transaction.fundSourceId, -transaction.amount);
        }
        
        return deleted;
    }

    // Fund source deletion with validation
    deleteFundSource(id) {
        const transactions = this.getTransactions();
        const hasTransactions = transactions.some(t => t.fundSourceId === id);
        
        if (hasTransactions) {
            throw new Error('この資金元は取引で使用されているため削除できません');
        }
        
        return this.storage.deleteFundSource(id);
    }

    canDeleteFundSource(id) {
        const transactions = this.getTransactions();
        return !transactions.some(t => t.fundSourceId === id);
    }

    // Subcategory management
    getSubcategories(categoryId = null) {
        const subcategories = this.storage.getSubcategories();
        if (categoryId) {
            return subcategories.filter(sc => sc.categoryId === categoryId);
        }
        return subcategories;
    }

    addSubcategory(subcategoryData) {
        // Check for duplicate names within the same category
        const existingSubcategories = this.getSubcategories(subcategoryData.categoryId);
        const isDuplicate = existingSubcategories.some(sc => 
            sc.name.toLowerCase() === subcategoryData.name.toLowerCase()
        );
        
        if (isDuplicate) {
            throw new Error('同じカテゴリ内に同じ名前のサブカテゴリが既に存在します');
        }
        
        return this.storage.addSubcategory(subcategoryData);
    }

    updateSubcategory(id, updates) {
        // Check for duplicate names if name is being updated
        if (updates.name) {
            const subcategory = this.storage.getSubcategories().find(sc => sc.id === id);
            if (subcategory) {
                const existingSubcategories = this.getSubcategories(subcategory.categoryId);
                const isDuplicate = existingSubcategories.some(sc => 
                    sc.id !== id && sc.name.toLowerCase() === updates.name.toLowerCase()
                );
                
                if (isDuplicate) {
                    throw new Error('同じカテゴリ内に同じ名前のサブカテゴリが既に存在します');
                }
            }
        }
        
        return this.storage.updateSubcategory(id, updates);
    }

    deleteSubcategory(id) {
        const transactions = this.getTransactions();
        const hasTransactions = transactions.some(t => t.subcategoryId === id);
        
        if (hasTransactions) {
            throw new Error('このサブカテゴリは取引で使用されているため削除できません');
        }
        
        return this.storage.deleteSubcategory(id);
    }

    canDeleteSubcategory(id) {
        const transactions = this.getTransactions();
        return !transactions.some(t => t.subcategoryId === id);
    }

    // Filter methods
    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
    }

    // Add sharing-related filters
    setAdvancedFilters(filters) {
        this.filters = { 
            ...this.filters, 
            ...filters,
            createdBy: filters.createdBy || null,
            fundSource: filters.fundSource || null,
            showOnlyMyTransactions: filters.showOnlyMyTransactions || false,
            showOnlySharedTransactions: filters.showOnlySharedTransactions || false
        };
    }

    clearFilters() {
        this.filters = {
            startDate: null,
            endDate: null,
            category: null,
            fundSource: null,
            createdBy: null,
            showOnlyMyTransactions: false,
            showOnlySharedTransactions: false
        };
    }

    hasActiveFilters() {
        return Object.values(this.filters).some(filter => filter !== null);
    }

    applyFilters(transactions) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        return transactions.filter(transaction => {
            // Date filter
            if (this.filters.startDate && new Date(transaction.date) < new Date(this.filters.startDate)) {
                return false;
            }
            if (this.filters.endDate && new Date(transaction.date) > new Date(this.filters.endDate)) {
                return false;
            }
            
            // Category filter
            if (this.filters.category && transaction.categoryId !== this.filters.category) {
                return false;
            }
            
            // Fund source filter
            if (this.filters.fundSource && transaction.fundSourceId !== this.filters.fundSource) {
                return false;
            }
            
            // Creator filter
            if (this.filters.createdBy && transaction.createdBy !== this.filters.createdBy) {
                return false;
            }
            
            // Show only my transactions
            if (this.filters.showOnlyMyTransactions && currentUser) {
                if (transaction.createdBy !== currentUser.id) {
                    return false;
                }
            }
            
            // Show only shared transactions
            if (this.filters.showOnlySharedTransactions) {
                if (!transaction.isShared) {
                    return false;
                }
            }
            
            return true;
        });
    }

    // Analytics methods
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

    // Summary methods
    getTotalBalance() {
        const fundSources = this.storage.getFundSources();
        return fundSources.reduce((total, fs) => total + fs.currentBalance, 0);
    }

    getMonthlyExpenses() {
        const now = new Date();
        const monthTransactions = this.getTransactionsByMonth(now.getFullYear(), now.getMonth());
        return monthTransactions
            .filter(t => t.amount < 0)
            .reduce((total, t) => total + Math.abs(t.amount), 0);
    }

    getMonthlyIncome() {
        const now = new Date();
        const monthTransactions = this.getTransactionsByMonth(now.getFullYear(), now.getMonth());
        return monthTransactions
            .filter(t => t.amount > 0)
            .reduce((total, t) => total + t.amount, 0);
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

    // Sharing-related methods
    canEditTransaction(transaction) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return false;
        
        // User can edit their own transactions
        return transaction.createdBy === currentUser.id;
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

    getSharedUsers() {
        // For demo purposes, return mock shared users
        // In a real app, this would fetch from a server
        return [
            { id: 'user1', username: '田中太郎', email: 'tanaka@example.com' },
            { id: 'user2', username: '佐藤花子', email: 'sato@example.com' }
        ];
    }

    // Validation methods
    validateTransaction(data) {
        const errors = [];
        
        if (!data.amount || data.amount === 0) {
            errors.push('金額を入力してください');
        }
        
        if (!data.categoryId) {
            errors.push('カテゴリを選択してください');
        }
        
        if (!data.fundSourceId) {
            errors.push('資金元を選択してください');
        }
        
        if (!data.date) {
            errors.push('日付を選択してください');
        }
        
        return errors;
    }

    validateFundSource(data) {
        const errors = [];
        
        if (!data.name || data.name.trim() === '') {
            errors.push('名前を入力してください');
        }
        
        if (data.initialBalance === undefined || data.initialBalance === null) {
            errors.push('初期残高を入力してください');
        }
        
        return errors;
    }
}

// Create global instance when storage is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for storage to be initialized
    if (window.storage) {
        window.dataManager = new DataManager(window.storage);
    } else {
        // Retry after a short delay
        setTimeout(() => {
            window.dataManager = new DataManager(window.storage);
        }, 100);
    }
});