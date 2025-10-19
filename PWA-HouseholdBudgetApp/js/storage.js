// Local Storage Management
class StorageManager {
    constructor() {
        this.keys = {
            transactions: 'budget_transactions',
            categories: 'budget_categories',
            fundSources: 'budget_fund_sources',
            settings: 'budget_settings'
        };
        this.initializeDefaultData();
    }

    // Initialize default data if not exists
    initializeDefaultData() {
        if (!this.getCategories().length) {
            this.setCategories(this.getDefaultCategories());
        }
        
        if (!this.getFundSources().length) {
            this.setFundSources(this.getDefaultFundSources());
        }
    }

    // Generic storage methods
    setItem(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    getItem(key, defaultValue = []) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage error:', error);
            return defaultValue;
        }
    }

    // Transactions
    getTransactions() {
        return this.getItem(this.keys.transactions, []).map(t => ({
            ...t,
            date: new Date(t.date),
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt)
        }));
    }

    setTransactions(transactions) {
        return this.setItem(this.keys.transactions, transactions);
    }

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        const newTransaction = {
            id: this.generateId(),
            ...transaction,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        transactions.push(newTransaction);
        this.setTransactions(transactions);
        return newTransaction;
    }

    updateTransaction(id, updates) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                ...updates,
                updatedAt: new Date()
            };
            this.setTransactions(transactions);
            return transactions[index];
        }
        return null;
    }

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        this.setTransactions(filtered);
        return filtered.length < transactions.length;
    }

    // Categories
    getCategories() {
        return this.getItem(this.keys.categories, []);
    }

    setCategories(categories) {
        return this.setItem(this.keys.categories, categories);
    }

    addCategory(category) {
        const categories = this.getCategories();
        const newCategory = {
            id: this.generateId(),
            ...category,
            createdAt: new Date()
        };
        categories.push(newCategory);
        this.setCategories(categories);
        return newCategory;
    }

    // Fund Sources
    getFundSources() {
        return this.getItem(this.keys.fundSources, []);
    }

    setFundSources(fundSources) {
        return this.setItem(this.keys.fundSources, fundSources);
    }

    addFundSource(fundSource) {
        const fundSources = this.getFundSources();
        const newFundSource = {
            id: this.generateId(),
            ...fundSource,
            currentBalance: fundSource.initialBalance,
            createdAt: new Date()
        };
        fundSources.push(newFundSource);
        this.setFundSources(fundSources);
        return newFundSource;
    }

    updateFundSourceBalance(id, amount) {
        const fundSources = this.getFundSources();
        const index = fundSources.findIndex(fs => fs.id === id);
        if (index !== -1) {
            fundSources[index].currentBalance -= amount;
            this.setFundSources(fundSources);
            return fundSources[index];
        }
        return null;
    }

    // Settings
    getSettings() {
        return this.getItem(this.keys.settings, {
            currency: 'JPY',
            language: 'ja',
            theme: 'auto'
        });
    }

    setSettings(settings) {
        return this.setItem(this.keys.settings, settings);
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Export data
    exportData() {
        return {
            transactions: this.getTransactions(),
            categories: this.getCategories(),
            fundSources: this.getFundSources(),
            settings: this.getSettings(),
            exportDate: new Date(),
            version: '1.0.0'
        };
    }

    // Import data
    importData(data) {
        try {
            if (data.transactions) this.setTransactions(data.transactions);
            if (data.categories) this.setCategories(data.categories);
            if (data.fundSources) this.setFundSources(data.fundSources);
            if (data.settings) this.setSettings(data.settings);
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.initializeDefaultData();
    }

    // Default data
    getDefaultCategories() {
        return [
            { id: 'cat1', name: '食費', icon: '🍽️', color: '#FF6B6B' },
            { id: 'cat2', name: '交通費', icon: '🚃', color: '#4ECDC4' },
            { id: 'cat3', name: '娯楽', icon: '🎮', color: '#45B7D1' },
            { id: 'cat4', name: '日用品', icon: '🛒', color: '#96CEB4' },
            { id: 'cat5', name: '医療費', icon: '🏥', color: '#FFEAA7' },
            { id: 'cat6', name: '光熱費', icon: '💡', color: '#DDA0DD' },
            { id: 'cat7', name: '通信費', icon: '📱', color: '#98D8C8' },
            { id: 'cat8', name: 'その他', icon: '📦', color: '#A8A8A8' }
        ];
    }

    getDefaultFundSources() {
        return [
            { id: 'fs1', name: '現金', initialBalance: 50000, currentBalance: 50000, type: 'cash' },
            { id: 'fs2', name: '銀行口座', initialBalance: 200000, currentBalance: 200000, type: 'bank' },
            { id: 'fs3', name: 'クレジットカード', initialBalance: 0, currentBalance: 0, type: 'credit' }
        ];
    }
}

// Create global instance
window.storage = new StorageManager();