// Local Storage Management
class StorageManager {
    constructor() {
        this.keys = {
            transactions: 'budget_transactions',
            categories: 'budget_categories',
            subcategories: 'budget_subcategories',
            fundSources: 'budget_fund_sources',
            settings: 'budget_settings',
            sharingUsers: 'budget_sharing_users',
            invitations: 'budget_invitations',
            sharingSettings: 'budget_sharing_settings'
        };
        
        // Initialize default data after a short delay to ensure auth manager is ready
        setTimeout(() => {
            this.initializeDefaultData();
        }, 100);
    }

    // Get user-specific storage key
    getUserKey(baseKey) {
        try {
            if (window.authManager && window.authManager.getCurrentUser()) {
                const userId = window.authManager.getCurrentUser().id;
                if (userId) {
                    return `${baseKey}_${userId}`;
                }
            }
        } catch (error) {
            console.warn('Error getting user key, falling back to base key:', error);
        }
        return baseKey;
    }

    // Check if user has data access
    hasDataAccess() {
        try {
            // If no auth manager exists, allow access (guest mode)
            if (!window.authManager) {
                return true;
            }
            
            // If auth manager exists, check login status
            return window.authManager.getIsLoggedIn();
        } catch (error) {
            console.warn('Error checking data access, allowing access:', error);
            return true; // Fallback to allowing access
        }
    }

    // Initialize default data if not exists
    initializeDefaultData() {
        try {
            console.log('Initializing default data...');
            
            // Check current auth state
            const isLoggedIn = window.authManager && window.authManager.getIsLoggedIn();
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
            
            console.log('Auth state:', { isLoggedIn, userId: currentUser?.id });
            
            // Use user-specific keys to check for existing data
            const userCategories = this.getCategories();
            const userSubcategories = this.getSubcategories();
            const userFundSources = this.getFundSources();

            console.log('Current data counts:', {
                categories: userCategories.length,
                subcategories: userSubcategories.length,
                fundSources: userFundSources.length
            });

            // Initialize categories if empty or migrate existing categories
            if (userCategories.length === 0) {
                console.log('Creating default categories...');
                const defaultCategories = this.getDefaultCategories();
                this.setCategories(defaultCategories);
                console.log('Default categories created:', defaultCategories.length);
            } else {
                // Check if income categories exist, if not add them
                const hasIncomeCategories = userCategories.some(cat => cat.type === 'income');
                if (!hasIncomeCategories) {
                    console.log('Adding income categories to existing data...');
                    const defaultCategories = this.getDefaultCategories();
                    const incomeCategories = defaultCategories.filter(cat => cat.type === 'income');
                    
                    // Add type property to existing categories (mark as expense)
                    const updatedCategories = userCategories.map(cat => ({
                        ...cat,
                        type: cat.type || 'expense'
                    }));
                    
                    // Add new income categories
                    const allCategories = [...updatedCategories, ...incomeCategories];
                    this.setCategories(allCategories);
                    console.log('Income categories added:', incomeCategories.length);
                }
            }
            
            // Initialize subcategories if empty or add income subcategories
            if (userSubcategories.length === 0) {
                console.log('Creating default subcategories...');
                const defaultSubcategories = this.getDefaultSubcategories();
                this.setSubcategories(defaultSubcategories);
                console.log('Default subcategories created:', defaultSubcategories.length);
            } else {
                // Check if income subcategories exist, if not add them
                const hasIncomeSubcategories = userSubcategories.some(sub => sub.id.startsWith('inc_'));
                if (!hasIncomeSubcategories) {
                    console.log('Adding income subcategories to existing data...');
                    const defaultSubcategories = this.getDefaultSubcategories();
                    const incomeSubcategories = defaultSubcategories.filter(sub => sub.id.startsWith('inc_'));
                    
                    const allSubcategories = [...userSubcategories, ...incomeSubcategories];
                    this.setSubcategories(allSubcategories);
                    console.log('Income subcategories added:', incomeSubcategories.length);
                }
            }
            
            // Initialize fund sources if empty
            if (userFundSources.length === 0) {
                console.log('Creating default fund sources...');
                const defaultFundSources = this.getDefaultFundSources();
                this.setFundSources(defaultFundSources);
                console.log('Default fund sources created:', defaultFundSources.length);
            }
            
            console.log('Default data initialization completed');
            
        } catch (error) {
            console.error('Error initializing default data:', error);
            // Fallback: try to create minimal default data
            this.createMinimalDefaults();
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
        if (!this.hasDataAccess()) return [];
        
        return this.getItem(this.getUserKey(this.keys.transactions), []).map(t => ({
            ...t,
            date: new Date(t.date),
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt)
        }));
    }

    setTransactions(transactions) {
        if (!this.hasDataAccess()) return false;
        
        return this.setItem(this.getUserKey(this.keys.transactions), transactions);
    }

    addTransaction(transaction) {
        // Validate data integrity if manager is available
        if (window.dataIntegrityManager) {
            const validation = window.dataIntegrityManager.validateData('transaction', transaction);
            if (!validation.isValid) {
                throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
            }
        }

        const transactions = this.getTransactions();
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        const newTransaction = {
            id: this.generateId(),
            ...transaction,
            createdBy: currentUser ? currentUser.id : null,
            createdByUsername: currentUser ? currentUser.username : 'ゲスト',
            isShared: false, // Will be determined by fund source sharing settings
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Perform integrity checks
        this.performIntegrityChecks('transaction', 'create', newTransaction);
        
        transactions.push(newTransaction);
        this.setTransactions(transactions);
        
        // Update related data synchronously
        this.updateRelatedData('transaction', 'create', newTransaction);
        
        // Notify UI update system
        this.notifyDataChange('transaction', 'create', newTransaction);
        
        return newTransaction;
    }

    updateTransaction(id, updates) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index === -1) return null;

        const originalTransaction = { ...transactions[index] };
        const updatedData = { ...originalTransaction, ...updates, updatedAt: new Date() };

        // Validate data integrity if manager is available
        if (window.dataIntegrityManager) {
            const validation = window.dataIntegrityManager.validateData('transaction', updatedData, { excludeId: id });
            if (!validation.isValid) {
                throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
            }
        }

        // Perform integrity checks
        this.performIntegrityChecks('transaction', 'update', updatedData, originalTransaction);

        transactions[index] = updatedData;
        this.setTransactions(transactions);
        
        // Update related data synchronously
        this.updateRelatedData('transaction', 'update', updatedData, originalTransaction);
        
        // Notify UI update system
        this.notifyDataChange('transaction', 'update', updatedData);
        
        return transactions[index];
    }

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const transactionToDelete = transactions.find(t => t.id === id);
        
        if (!transactionToDelete) return false;

        // Perform integrity checks
        this.performIntegrityChecks('transaction', 'delete', null, transactionToDelete);

        const filtered = transactions.filter(t => t.id !== id);
        this.setTransactions(filtered);
        
        // Update related data synchronously
        this.updateRelatedData('transaction', 'delete', null, transactionToDelete);
        
        // Notify UI update system
        this.notifyDataChange('transaction', 'delete', transactionToDelete);
        
        return filtered.length < transactions.length;
    }

    // Categories
    getCategories() {
        if (!this.hasDataAccess()) return [];
        
        return this.getItem(this.getUserKey(this.keys.categories), []);
    }

    setCategories(categories) {
        if (!this.hasDataAccess()) return false;
        
        return this.setItem(this.getUserKey(this.keys.categories), categories);
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
        if (!this.hasDataAccess()) return [];
        
        return this.getItem(this.getUserKey(this.keys.fundSources), []);
    }

    setFundSources(fundSources) {
        if (!this.hasDataAccess()) return false;
        
        return this.setItem(this.getUserKey(this.keys.fundSources), fundSources);
    }

    addFundSource(fundSource) {
        // Validate data integrity if manager is available
        if (window.dataIntegrityManager) {
            const validation = window.dataIntegrityManager.validateData('fundSource', fundSource);
            if (!validation.isValid) {
                throw new Error(`Fund source validation failed: ${validation.errors.join(', ')}`);
            }
        }

        const fundSources = this.getFundSources();
        const newFundSource = {
            id: this.generateId(),
            ...fundSource,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Perform integrity checks
        this.performIntegrityChecks('fundSource', 'create', newFundSource);
        
        fundSources.push(newFundSource);
        this.setFundSources(fundSources);
        
        // Update related data synchronously
        this.updateRelatedData('fundSource', 'create', newFundSource);
        
        // Notify UI update system
        this.notifyDataChange('fundSource', 'create', newFundSource);
        
        return newFundSource;
    }

    updateFundSourceBalance(id, amount) {
        const fundSources = this.getFundSources();
        const index = fundSources.findIndex(fs => fs.id === id);
        if (index !== -1) {
            fundSources[index].balance += amount;
            this.setFundSources(fundSources);
            return fundSources[index];
        }
        return null;
    }

    deleteFundSource(id) {
        const fundSources = this.getFundSources();
        const fundSourceToDelete = fundSources.find(fs => fs.id === id);
        
        if (!fundSourceToDelete) return false;

        // Check if deletion is allowed (no dependent transactions)
        if (window.dataIntegrityManager && !window.dataIntegrityManager.canDelete('fundSources', id)) {
            throw new Error('Cannot delete fund source: it is being used by existing transactions');
        }

        // Perform integrity checks
        this.performIntegrityChecks('fundSource', 'delete', null, fundSourceToDelete);

        const filtered = fundSources.filter(fs => fs.id !== id);
        this.setFundSources(filtered);
        
        // Update related data synchronously
        this.updateRelatedData('fundSource', 'delete', null, fundSourceToDelete);
        
        // Notify UI update system
        this.notifyDataChange('fundSource', 'delete', fundSourceToDelete);
        
        return filtered.length < fundSources.length;
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
            subcategories: this.getSubcategories(),
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
            if (data.subcategories) this.setSubcategories(data.subcategories);
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

    // Reinitialize data for current user (called when auth state changes)
    reinitializeUserData() {
        console.log('Reinitializing user data due to auth state change...');
        
        // Clear any cached data that might be from previous user
        this.clearUserDataCache();
        
        // Wait a moment for auth state to stabilize, then initialize
        setTimeout(() => {
            this.initializeDefaultData();
            
            // Notify UI update system for full refresh
            this.notifyDataChange('all', 'auth_change', null);
            
            // Fallback for older UI system
            if (window.uiManager && !window.uiUpdateManager) {
                window.uiManager.loadInitialData();
            }
        }, 200);
    }

    // Clear any cached user data (internal method)
    clearUserDataCache() {
        // This method can be extended if we add caching in the future
        console.log('Clearing user data cache...');
    }

    // Create minimal default data as fallback
    createMinimalDefaults() {
        try {
            console.log('Creating minimal default data as fallback...');
            
            // Minimal categories
            const minimalCategories = [
                { id: 'cat1', name: '食費', icon: '🍽️', color: '#FF6B6B' },
                { id: 'cat8', name: 'その他', icon: '📦', color: '#A8A8A8' }
            ];
            
            // Minimal fund sources
            const minimalFundSources = [
                { id: 'fs1', name: '現金', balance: 0, type: 'cash', isShared: false, sharedWith: [] }
            ];
            
            // Force set minimal data
            this.setItem(this.getUserKey(this.keys.categories), minimalCategories);
            this.setItem(this.getUserKey(this.keys.fundSources), minimalFundSources);
            this.setItem(this.getUserKey(this.keys.subcategories), []);
            
            console.log('Minimal default data created successfully');
            
        } catch (error) {
            console.error('Failed to create minimal defaults:', error);
        }
    }

    // Check if storage system is properly initialized
    isInitialized() {
        try {
            const categories = this.getCategories();
            const fundSources = this.getFundSources();
            
            return categories.length > 0 && fundSources.length > 0;
        } catch (error) {
            console.error('Error checking initialization status:', error);
            return false;
        }
    }

    // Force re-initialization (useful for debugging or recovery)
    forceReinitialize() {
        console.log('Force reinitializing storage system...');
        
        try {
            // Clear current user data
            const userKeys = [
                this.getUserKey(this.keys.categories),
                this.getUserKey(this.keys.subcategories),
                this.getUserKey(this.keys.fundSources),
                this.getUserKey(this.keys.transactions)
            ];
            
            userKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Reinitialize
            this.initializeDefaultData();
            
            // Notify UI update system
            this.notifyDataChange('all', 'reinitialize', null);
            
            console.log('Force reinitialization completed');
            return true;
            
        } catch (error) {
            console.error('Error during force reinitialization:', error);
            return false;
        }
    }

    // Notify UI update system of data changes
    notifyDataChange(type, action, data = null) {
        try {
            if (window.uiUpdateManager) {
                window.uiUpdateManager.notifyDataChange(type, action, data);
            }
        } catch (error) {
            console.error('Error notifying data change:', error);
        }
    }

    // Data integrity check methods
    performIntegrityChecks(dataType, action, newData, oldData = null) {
        try {
            // Check data consistency
            this.checkDataConsistency(dataType, action, newData, oldData);
            
            // Check dependencies
            this.checkDependencies(dataType, action, newData, oldData);
            
            // Log integrity check
            console.log(`Integrity check passed for ${dataType} ${action}`);
            
        } catch (error) {
            console.error(`Integrity check failed for ${dataType} ${action}:`, error);
            throw error;
        }
    }

    checkDataConsistency(dataType, action, newData, oldData) {
        switch (dataType) {
            case 'transaction':
                if (action === 'create' || action === 'update') {
                    // Ensure required fields are present
                    if (!newData.amount || !newData.categoryId || !newData.fundSourceId || !newData.date) {
                        throw new Error('Transaction missing required fields');
                    }
                    
                    // Validate amount is a number
                    if (typeof newData.amount !== 'number' || isNaN(newData.amount)) {
                        throw new Error('Transaction amount must be a valid number');
                    }
                    
                    // Validate date
                    if (!(newData.date instanceof Date) && isNaN(Date.parse(newData.date))) {
                        throw new Error('Transaction date must be a valid date');
                    }
                }
                break;
                
            case 'fundSource':
                if (action === 'create' || action === 'update') {
                    // Ensure required fields are present
                    if (!newData.name || newData.balance === undefined) {
                        throw new Error('Fund source missing required fields');
                    }
                    
                    // Validate balance is a number
                    if (typeof newData.balance !== 'number' || isNaN(newData.balance)) {
                        throw new Error('Fund source balance must be a valid number');
                    }
                    
                    // Check for duplicate names
                    const existingFundSources = this.getFundSources();
                    const duplicate = existingFundSources.find(fs => 
                        fs.name.toLowerCase() === newData.name.toLowerCase() && 
                        fs.id !== newData.id
                    );
                    if (duplicate) {
                        throw new Error(`Fund source name '${newData.name}' already exists`);
                    }
                }
                break;
        }
    }

    checkDependencies(dataType, action, newData, oldData) {
        switch (dataType) {
            case 'transaction':
                if (action === 'create' || action === 'update') {
                    // Check if category exists
                    const categories = this.getCategories();
                    if (!categories.some(c => c.id === newData.categoryId)) {
                        throw new Error(`Referenced category '${newData.categoryId}' does not exist`);
                    }
                    
                    // Check if fund source exists
                    const fundSources = this.getFundSources();
                    if (!fundSources.some(fs => fs.id === newData.fundSourceId)) {
                        throw new Error(`Referenced fund source '${newData.fundSourceId}' does not exist`);
                    }
                    
                    // Check if subcategory exists (if specified)
                    if (newData.subcategoryId) {
                        const subcategories = this.getSubcategories();
                        if (!subcategories.some(sc => sc.id === newData.subcategoryId)) {
                            throw new Error(`Referenced subcategory '${newData.subcategoryId}' does not exist`);
                        }
                    }
                }
                break;
                
            case 'fundSource':
                if (action === 'delete') {
                    // Check if any transactions reference this fund source
                    const transactions = this.getTransactions();
                    const dependentTransactions = transactions.filter(t => t.fundSourceId === oldData.id);
                    if (dependentTransactions.length > 0) {
                        throw new Error(`Cannot delete fund source: ${dependentTransactions.length} transactions depend on it`);
                    }
                }
                break;
        }
    }

    updateRelatedData(dataType, action, newData, oldData = null) {
        try {
            switch (dataType) {
                case 'transaction':
                    this.updateFundSourceBalances(action, newData, oldData);
                    this.updateTransactionSharingStatus(newData);
                    break;
                    
                case 'fundSource':
                    if (action === 'update' && newData.isShared !== undefined) {
                        this.updateRelatedTransactionSharing(newData.id, newData.isShared);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error updating related data:', error);
            // Don't throw here as the main operation succeeded
        }
    }

    updateFundSourceBalances(action, newData, oldData) {
        try {
            const fundSources = this.getFundSources();
            
            if (action === 'create') {
                // Update fund source balance for new transaction
                const fundSource = fundSources.find(fs => fs.id === newData.fundSourceId);
                if (fundSource) {
                    fundSource.balance += newData.amount;
                    fundSource.updatedAt = new Date();
                }
            } else if (action === 'update' && oldData) {
                // Revert old transaction amount and apply new amount
                if (oldData.fundSourceId === newData.fundSourceId) {
                    // Same fund source, just update the difference
                    const fundSource = fundSources.find(fs => fs.id === newData.fundSourceId);
                    if (fundSource) {
                        const difference = newData.amount - oldData.amount;
                        fundSource.balance += difference;
                        fundSource.updatedAt = new Date();
                    }
                } else {
                    // Different fund sources, revert from old and add to new
                    const oldFundSource = fundSources.find(fs => fs.id === oldData.fundSourceId);
                    const newFundSource = fundSources.find(fs => fs.id === newData.fundSourceId);
                    
                    if (oldFundSource) {
                        oldFundSource.balance -= oldData.amount;
                        oldFundSource.updatedAt = new Date();
                    }
                    
                    if (newFundSource) {
                        newFundSource.balance += newData.amount;
                        newFundSource.updatedAt = new Date();
                    }
                }
            } else if (action === 'delete' && oldData) {
                // Revert transaction amount from fund source
                const fundSource = fundSources.find(fs => fs.id === oldData.fundSourceId);
                if (fundSource) {
                    fundSource.balance -= oldData.amount;
                    fundSource.updatedAt = new Date();
                }
            }
            
            this.setFundSources(fundSources);
        } catch (error) {
            console.error('Error updating fund source balances:', error);
        }
    }

    updateTransactionSharingStatus(transactionData) {
        try {
            if (!transactionData || !transactionData.fundSourceId) return;
            
            const fundSources = this.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === transactionData.fundSourceId);
            
            if (fundSource && transactionData.isShared !== fundSource.isShared) {
                // Update transaction sharing status based on fund source
                transactionData.isShared = fundSource.isShared || false;
            }
        } catch (error) {
            console.error('Error updating transaction sharing status:', error);
        }
    }

    updateRelatedTransactionSharing(fundSourceId, isShared) {
        try {
            const transactions = this.getTransactions();
            let updated = false;
            
            for (const transaction of transactions) {
                if (transaction.fundSourceId === fundSourceId) {
                    transaction.isShared = isShared;
                    transaction.updatedAt = new Date();
                    updated = true;
                }
            }
            
            if (updated) {
                this.setTransactions(transactions);
            }
        } catch (error) {
            console.error('Error updating related transaction sharing:', error);
        }
    }

    // Data validation methods
    validateTransactionData(data) {
        const errors = [];
        
        if (!data.amount || typeof data.amount !== 'number' || isNaN(data.amount)) {
            errors.push('Valid amount is required');
        }
        
        if (!data.categoryId) {
            errors.push('Category is required');
        }
        
        if (!data.fundSourceId) {
            errors.push('Fund source is required');
        }
        
        if (!data.date) {
            errors.push('Date is required');
        }
        
        return errors;
    }

    validateFundSourceData(data) {
        const errors = [];
        
        if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
            errors.push('Name is required');
        }
        
        if (data.balance === undefined || data.balance === null || 
            typeof data.balance !== 'number' || isNaN(data.balance)) {
            errors.push('Valid balance is required');
        }
        
        return errors;
    }

    // Data synchronization methods
    synchronizeData() {
        try {
            console.log('Starting data synchronization...');
            
            // Recalculate all fund source balances
            this.recalculateFundSourceBalances();
            
            // Update transaction sharing statuses
            this.synchronizeTransactionSharing();
            
            // Clean up orphaned data
            this.cleanupOrphanedData();
            
            console.log('Data synchronization completed');
            return true;
            
        } catch (error) {
            console.error('Error during data synchronization:', error);
            return false;
        }
    }

    recalculateFundSourceBalances() {
        try {
            const fundSources = this.getFundSources();
            const transactions = this.getTransactions();
            
            for (const fundSource of fundSources) {
                const relatedTransactions = transactions.filter(t => t.fundSourceId === fundSource.id);
                // 残高は取引の累積で計算される（初期値は0として扱う）
                const calculatedBalance = relatedTransactions.reduce((sum, t) => sum + t.amount, 0);
                
                if (Math.abs(calculatedBalance - fundSource.balance) > 0.01) {
                    console.log(`Correcting balance for ${fundSource.name}: ${fundSource.balance} -> ${calculatedBalance}`);
                    fundSource.balance = calculatedBalance;
                    fundSource.updatedAt = new Date();
                }
            }
            
            this.setFundSources(fundSources);
        } catch (error) {
            console.error('Error recalculating fund source balances:', error);
        }
    }

    synchronizeTransactionSharing() {
        try {
            const transactions = this.getTransactions();
            const fundSources = this.getFundSources();
            let updated = false;
            
            for (const transaction of transactions) {
                const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
                if (fundSource) {
                    const shouldBeShared = fundSource.isShared || false;
                    if (transaction.isShared !== shouldBeShared) {
                        transaction.isShared = shouldBeShared;
                        transaction.updatedAt = new Date();
                        updated = true;
                    }
                }
            }
            
            if (updated) {
                this.setTransactions(transactions);
            }
        } catch (error) {
            console.error('Error synchronizing transaction sharing:', error);
        }
    }

    cleanupOrphanedData() {
        try {
            const transactions = this.getTransactions();
            const categories = this.getCategories();
            const fundSources = this.getFundSources();
            const subcategories = this.getSubcategories();
            
            let cleanedTransactions = false;
            let cleanedSubcategories = false;
            
            // Clean up transactions with invalid references
            const validTransactions = transactions.filter(transaction => {
                const hasValidCategory = categories.some(c => c.id === transaction.categoryId);
                const hasValidFundSource = fundSources.some(fs => fs.id === transaction.fundSourceId);
                const hasValidSubcategory = !transaction.subcategoryId || 
                    subcategories.some(sc => sc.id === transaction.subcategoryId);
                
                const isValid = hasValidCategory && hasValidFundSource && hasValidSubcategory;
                
                if (!isValid) {
                    console.log(`Removing orphaned transaction: ${transaction.id}`);
                    cleanedTransactions = true;
                }
                
                return isValid;
            });
            
            if (cleanedTransactions) {
                this.setTransactions(validTransactions);
            }
            
            // Clean up subcategories with invalid category references
            const validSubcategories = subcategories.filter(subcategory => {
                const hasValidCategory = categories.some(c => c.id === subcategory.categoryId);
                
                if (!hasValidCategory) {
                    console.log(`Removing orphaned subcategory: ${subcategory.name}`);
                    cleanedSubcategories = true;
                }
                
                return hasValidCategory;
            });
            
            if (cleanedSubcategories) {
                this.setSubcategories(validSubcategories);
            }
            
        } catch (error) {
            console.error('Error cleaning up orphaned data:', error);
        }
    }

    // Subcategories
    getSubcategories() {
        if (!this.hasDataAccess()) return [];
        
        return this.getItem(this.getUserKey(this.keys.subcategories), []);
    }

    setSubcategories(subcategories) {
        if (!this.hasDataAccess()) return false;
        
        return this.setItem(this.getUserKey(this.keys.subcategories), subcategories);
    }

    addSubcategory(subcategory) {
        const subcategories = this.getSubcategories();
        const newSubcategory = {
            id: this.generateId(),
            ...subcategory,
            createdAt: new Date()
        };
        subcategories.push(newSubcategory);
        this.setSubcategories(subcategories);
        
        // Notify UI update system
        this.notifyDataChange('subcategory', 'create', newSubcategory);
        
        return newSubcategory;
    }

    updateSubcategory(id, updates) {
        const subcategories = this.getSubcategories();
        const index = subcategories.findIndex(sc => sc.id === id);
        if (index !== -1) {
            const originalSubcategory = { ...subcategories[index] };
            subcategories[index] = {
                ...subcategories[index],
                ...updates,
                updatedAt: new Date()
            };
            this.setSubcategories(subcategories);
            
            // Notify UI update system
            this.notifyDataChange('subcategory', 'update', subcategories[index]);
            
            return subcategories[index];
        }
        return null;
    }

    deleteSubcategory(id) {
        const subcategories = this.getSubcategories();
        const subcategoryToDelete = subcategories.find(sc => sc.id === id);
        const filtered = subcategories.filter(sc => sc.id !== id);
        this.setSubcategories(filtered);
        
        // Notify UI update system
        if (subcategoryToDelete) {
            this.notifyDataChange('subcategory', 'delete', subcategoryToDelete);
        }
        
        return filtered.length < subcategories.length;
    }

    // Default data
    getDefaultCategories() {
        return [
            // 支出カテゴリ
            { id: 'cat1', name: '食費', icon: '🍽️', color: '#FF6B6B', type: 'expense' },
            { id: 'cat2', name: '交通費', icon: '🚃', color: '#4ECDC4', type: 'expense' },
            { id: 'cat3', name: '娯楽', icon: '🎮', color: '#45B7D1', type: 'expense' },
            { id: 'cat4', name: '日用品', icon: '🛒', color: '#96CEB4', type: 'expense' },
            { id: 'cat5', name: '医療費', icon: '🏥', color: '#FFEAA7', type: 'expense' },
            { id: 'cat6', name: '光熱費', icon: '💡', color: '#DDA0DD', type: 'expense' },
            { id: 'cat7', name: '通信費', icon: '📱', color: '#98D8C8', type: 'expense' },
            { id: 'cat8', name: 'その他', icon: '📦', color: '#A8A8A8', type: 'expense' },
            // 収入カテゴリ
            { id: 'inc1', name: '給与', icon: '💰', color: '#2ECC71', type: 'income' },
            { id: 'inc2', name: 'ボーナス', icon: '🎁', color: '#27AE60', type: 'income' },
            { id: 'inc3', name: '副業', icon: '💼', color: '#16A085', type: 'income' },
            { id: 'inc4', name: '投資収益', icon: '📈', color: '#1ABC9C', type: 'income' },
            { id: 'inc5', name: 'その他収入', icon: '💵', color: '#52C41A', type: 'income' }
        ];
    }

    getDefaultSubcategories() {
        return [
            // 支出サブカテゴリ
            { id: 'sub1', name: '食材', categoryId: 'cat1' },
            { id: 'sub2', name: '外食', categoryId: 'cat1' },
            // 収入サブカテゴリ
            { id: 'inc_sub1', name: '基本給', categoryId: 'inc1' },
            { id: 'inc_sub2', name: '残業代', categoryId: 'inc1' },
            { id: 'inc_sub3', name: '手当', categoryId: 'inc1' },
            { id: 'inc_sub4', name: '年末賞与', categoryId: 'inc2' },
            { id: 'inc_sub5', name: '夏季賞与', categoryId: 'inc2' },
            { id: 'inc_sub6', name: '成果賞与', categoryId: 'inc2' },
            { id: 'sub3', name: '電車', categoryId: 'cat2' },
            { id: 'sub4', name: 'バス', categoryId: 'cat2' },
            { id: 'sub5', name: 'タクシー', categoryId: 'cat2' }
        ];
    }

    getDefaultFundSources() {
        return [
            { 
                id: 'fs1', 
                name: '現金', 
                balance: 50000, 
                type: 'cash', 
                isShared: false, 
                sharedWith: [],
                permissions: {
                    canView: true,
                    canEdit: false,
                    canDelete: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { 
                id: 'fs2', 
                name: '銀行口座', 
                balance: 200000, 
                type: 'bank', 
                isShared: false, 
                sharedWith: [],
                permissions: {
                    canView: true,
                    canEdit: false,
                    canDelete: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { 
                id: 'fs3', 
                name: 'クレジットカード',
                balance: 0, 
                type: 'credit', 
                isShared: false, 
                sharedWith: [],
                permissions: {
                    canView: true,
                    canEdit: false,
                    canDelete: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
    }

    // Sharing users management
    getSharingUsers() {
        if (!this.hasDataAccess()) return [];
        
        return this.getItem(this.getUserKey(this.keys.sharingUsers), []).map(user => ({
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
            sharedFundSources: user.sharedFundSources ? user.sharedFundSources.map(fs => ({
                ...fs,
                joinedAt: new Date(fs.joinedAt)
            })) : []
        }));
    }

    setSharingUsers(sharingUsers) {
        if (!this.hasDataAccess()) return false;
        
        return this.setItem(this.getUserKey(this.keys.sharingUsers), sharingUsers);
    }

    addSharingUser(user) {
        // Validate shared user data
        if (window.SharingValidation) {
            const validation = window.SharingValidation.validateSharedUser(user);
            if (!validation.isValid) {
                throw new Error(`Shared user validation failed: ${validation.errors.join(', ')}`);
            }
        }

        const sharingUsers = this.getSharingUsers();
        
        // Check for duplicate email
        const existingUser = sharingUsers.find(u => u.email === user.email);
        if (existingUser) {
            throw new Error('このメールアドレスのユーザーは既に存在します');
        }

        const newUser = {
            id: this.generateId(),
            ...user,
            sharedFundSources: user.sharedFundSources || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        sharingUsers.push(newUser);
        this.setSharingUsers(sharingUsers);
        
        return newUser;
    }

    updateSharingUser(id, updates) {
        const sharingUsers = this.getSharingUsers();
        const index = sharingUsers.findIndex(user => user.id === id);
        
        if (index === -1) return null;

        const updatedUser = {
            ...sharingUsers[index],
            ...updates,
            updatedAt: new Date()
        };

        // Validate updated user
        if (window.SharingValidation) {
            const validation = window.SharingValidation.validateSharedUser(updatedUser);
            if (!validation.isValid) {
                throw new Error(`Shared user validation failed: ${validation.errors.join(', ')}`);
            }
        }

        sharingUsers[index] = updatedUser;
        this.setSharingUsers(sharingUsers);
        
        return sharingUsers[index];
    }

    deleteSharingUser(id) {
        const sharingUsers = this.getSharingUsers();
        const filtered = sharingUsers.filter(user => user.id !== id);
        
        if (filtered.length < sharingUsers.length) {
            this.setSharingUsers(filtered);
            return true;
        }
        
        return false;
    }

    getSharingUserByEmail(email) {
        const sharingUsers = this.getSharingUsers();
        return sharingUsers.find(user => user.email === email) || null;
    }

    getSharingUserById(id) {
        const sharingUsers = this.getSharingUsers();
        return sharingUsers.find(user => user.id === id) || null;
    }

    addFundSourceToUser(userId, fundSourceData) {
        const sharingUsers = this.getSharingUsers();
        const userIndex = sharingUsers.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            throw new Error('ユーザーが見つかりません');
        }

        const user = sharingUsers[userIndex];
        
        // Check if fund source already exists for this user
        const existingFundSource = user.sharedFundSources.find(fs => fs.fundSourceId === fundSourceData.fundSourceId);
        if (existingFundSource) {
            throw new Error('このユーザーは既にこの資金元を共有しています');
        }

        const newFundSourceEntry = {
            ...fundSourceData,
            joinedAt: new Date()
        };

        user.sharedFundSources.push(newFundSourceEntry);
        user.updatedAt = new Date();

        sharingUsers[userIndex] = user;
        this.setSharingUsers(sharingUsers);
        
        return user;
    }

    removeFundSourceFromUser(userId, fundSourceId) {
        const sharingUsers = this.getSharingUsers();
        const userIndex = sharingUsers.findIndex(user => user.id === userId);
        
        if (userIndex === -1) return false;

        const user = sharingUsers[userIndex];
        const originalLength = user.sharedFundSources.length;
        
        user.sharedFundSources = user.sharedFundSources.filter(fs => fs.fundSourceId !== fundSourceId);
        
        if (user.sharedFundSources.length < originalLength) {
            user.updatedAt = new Date();
            sharingUsers[userIndex] = user;
            this.setSharingUsers(sharingUsers);
            return true;
        }
        
        return false;
    }

    // Invitations management
    getInvitations() {
        if (!this.hasDataAccess()) return [];
        
        return this.getItem(this.getUserKey(this.keys.invitations), []).map(invitation => ({
            ...invitation,
            createdAt: new Date(invitation.createdAt),
            expiresAt: new Date(invitation.expiresAt),
            acceptedAt: invitation.acceptedAt ? new Date(invitation.acceptedAt) : null,
            updatedAt: new Date(invitation.updatedAt)
        }));
    }

    setInvitations(invitations) {
        if (!this.hasDataAccess()) return false;
        
        return this.setItem(this.getUserKey(this.keys.invitations), invitations);
    }

    addInvitation(invitation) {
        // Validate invitation data
        if (window.SharingValidation) {
            const validation = window.SharingValidation.validateInvitation(invitation);
            if (!validation.isValid) {
                throw new Error(`Invitation validation failed: ${validation.errors.join(', ')}`);
            }
        }

        const invitations = this.getInvitations();
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        const newInvitation = {
            id: this.generateId(),
            token: window.SharingUtils ? window.SharingUtils.generateInvitationToken() : `inv_${this.generateId()}`,
            ...invitation,
            inviterUserId: currentUser ? currentUser.id : null,
            inviterUsername: currentUser ? currentUser.username : 'ユーザー',
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            updatedAt: new Date()
        };

        invitations.push(newInvitation);
        this.setInvitations(invitations);
        
        return newInvitation;
    }

    updateInvitation(id, updates) {
        const invitations = this.getInvitations();
        const index = invitations.findIndex(inv => inv.id === id);
        
        if (index === -1) return null;

        const updatedInvitation = {
            ...invitations[index],
            ...updates,
            updatedAt: new Date()
        };

        // Validate updated invitation
        if (window.SharingValidation) {
            const validation = window.SharingValidation.validateInvitation(updatedInvitation);
            if (!validation.isValid) {
                throw new Error(`Invitation validation failed: ${validation.errors.join(', ')}`);
            }
        }

        invitations[index] = updatedInvitation;
        this.setInvitations(invitations);
        
        return invitations[index];
    }

    deleteInvitation(id) {
        const invitations = this.getInvitations();
        const filtered = invitations.filter(inv => inv.id !== id);
        
        if (filtered.length < invitations.length) {
            this.setInvitations(filtered);
            return true;
        }
        
        return false;
    }

    getInvitationByToken(token) {
        const invitations = this.getInvitations();
        return invitations.find(inv => inv.token === token) || null;
    }

    getInvitationsByStatus(status) {
        const invitations = this.getInvitations();
        return invitations.filter(inv => inv.status === status);
    }

    getInvitationsByFundSource(fundSourceId) {
        const invitations = this.getInvitations();
        return invitations.filter(inv => inv.fundSourceId === fundSourceId);
    }

    cleanupExpiredInvitations() {
        const invitations = this.getInvitations();
        const now = new Date();
        let cleaned = 0;

        const validInvitations = invitations.filter(invitation => {
            const isExpired = new Date(invitation.expiresAt) <= now;
            if (isExpired && invitation.status === 'pending') {
                invitation.status = 'expired';
                cleaned++;
            }
            return true; // Keep all invitations, just update status
        });

        if (cleaned > 0) {
            this.setInvitations(validInvitations);
        }

        return cleaned;
    }

    // Sharing settings management
    getSharingSettings() {
        if (!this.hasDataAccess()) return [];
        
        return this.getItem(this.getUserKey(this.keys.sharingSettings), []).map(setting => ({
            ...setting,
            createdAt: new Date(setting.createdAt),
            updatedAt: new Date(setting.updatedAt)
        }));
    }

    setSharingSettings(settings) {
        if (!this.hasDataAccess()) return false;
        
        return this.setItem(this.getUserKey(this.keys.sharingSettings), settings);
    }

    addSharingSettings(settings) {
        // Validate sharing settings data
        if (window.SharingValidation) {
            const validation = window.SharingValidation.validateSharingSettings(settings);
            if (!validation.isValid) {
                throw new Error(`Sharing settings validation failed: ${validation.errors.join(', ')}`);
            }
        }

        const allSettings = this.getSharingSettings();
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        const newSettings = {
            ...settings,
            ownerId: currentUser ? currentUser.id : null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        allSettings.push(newSettings);
        this.setSharingSettings(allSettings);
        
        return newSettings;
    }

    updateSharingSettings(fundSourceId, updates) {
        const allSettings = this.getSharingSettings();
        const index = allSettings.findIndex(setting => setting.fundSourceId === fundSourceId);
        
        if (index === -1) {
            // Create new settings if not found
            return this.addSharingSettings({ fundSourceId, ...updates });
        }

        const updatedSettings = {
            ...allSettings[index],
            ...updates,
            updatedAt: new Date()
        };

        // Validate updated settings
        if (window.SharingValidation) {
            const validation = window.SharingValidation.validateSharingSettings(updatedSettings);
            if (!validation.isValid) {
                throw new Error(`Sharing settings validation failed: ${validation.errors.join(', ')}`);
            }
        }

        allSettings[index] = updatedSettings;
        this.setSharingSettings(allSettings);
        
        return allSettings[index];
    }

    deleteSharingSettings(fundSourceId) {
        const allSettings = this.getSharingSettings();
        const filtered = allSettings.filter(setting => setting.fundSourceId !== fundSourceId);
        
        if (filtered.length < allSettings.length) {
            this.setSharingSettings(filtered);
            return true;
        }
        
        return false;
    }

    getSharingSettingsByFundSource(fundSourceId) {
        const allSettings = this.getSharingSettings();
        return allSettings.find(setting => setting.fundSourceId === fundSourceId) || null;
    }

    // Sharing data synchronization methods
    synchronizeSharingData() {
        try {
            console.log('Starting sharing data synchronization...');
            
            // Clean up expired invitations
            const expiredCount = this.cleanupExpiredInvitations();
            if (expiredCount > 0) {
                console.log(`Cleaned up ${expiredCount} expired invitations`);
            }
            
            // Synchronize fund source sharing status with transactions
            this.synchronizeFundSourceSharing();
            
            // Clean up orphaned sharing data
            this.cleanupOrphanedSharingData();
            
            console.log('Sharing data synchronization completed');
            return true;
            
        } catch (error) {
            console.error('Error during sharing data synchronization:', error);
            return false;
        }
    }

    synchronizeFundSourceSharing() {
        try {
            const fundSources = this.getFundSources();
            const transactions = this.getTransactions();
            let updated = false;

            for (const transaction of transactions) {
                const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
                if (fundSource) {
                    const shouldBeShared = fundSource.isShared || false;
                    if (transaction.isShared !== shouldBeShared) {
                        transaction.isShared = shouldBeShared;
                        transaction.sharedFundSourceId = shouldBeShared ? fundSource.id : null;
                        transaction.updatedAt = new Date();
                        updated = true;
                    }
                }
            }

            if (updated) {
                this.setTransactions(transactions);
                console.log('Transaction sharing status synchronized');
            }
        } catch (error) {
            console.error('Error synchronizing fund source sharing:', error);
        }
    }

    cleanupOrphanedSharingData() {
        try {
            const fundSources = this.getFundSources();
            const fundSourceIds = new Set(fundSources.map(fs => fs.id));
            
            // Clean up sharing settings for non-existent fund sources
            const sharingSettings = this.getSharingSettings();
            const validSharingSettings = sharingSettings.filter(setting => 
                fundSourceIds.has(setting.fundSourceId)
            );
            
            if (validSharingSettings.length < sharingSettings.length) {
                this.setSharingSettings(validSharingSettings);
                console.log(`Cleaned up ${sharingSettings.length - validSharingSettings.length} orphaned sharing settings`);
            }
            
            // Clean up invitations for non-existent fund sources
            const invitations = this.getInvitations();
            const validInvitations = invitations.filter(invitation => 
                fundSourceIds.has(invitation.fundSourceId)
            );
            
            if (validInvitations.length < invitations.length) {
                this.setInvitations(validInvitations);
                console.log(`Cleaned up ${invitations.length - validInvitations.length} orphaned invitations`);
            }
            
            // Clean up shared fund sources from users
            const sharingUsers = this.getSharingUsers();
            let usersUpdated = false;
            
            for (const user of sharingUsers) {
                const originalLength = user.sharedFundSources.length;
                user.sharedFundSources = user.sharedFundSources.filter(fs => 
                    fundSourceIds.has(fs.fundSourceId)
                );
                
                if (user.sharedFundSources.length < originalLength) {
                    user.updatedAt = new Date();
                    usersUpdated = true;
                }
            }
            
            if (usersUpdated) {
                this.setSharingUsers(sharingUsers);
                console.log('Cleaned up orphaned fund sources from shared users');
            }
            
        } catch (error) {
            console.error('Error cleaning up orphaned sharing data:', error);
        }
    }

    // Get sharing statistics
    getSharingStatistics() {
        try {
            const invitations = this.getInvitations();
            const sharingUsers = this.getSharingUsers();
            const sharingSettings = this.getSharingSettings();
            const fundSources = this.getFundSources();
            const sharedFundSources = fundSources.filter(fs => fs.isShared);
            
            return {
                totalInvitations: invitations.length,
                pendingInvitations: invitations.filter(inv => inv.status === 'pending').length,
                acceptedInvitations: invitations.filter(inv => inv.status === 'accepted').length,
                expiredInvitations: invitations.filter(inv => inv.status === 'expired').length,
                totalSharedUsers: sharingUsers.length,
                totalSharingSettings: sharingSettings.length,
                totalSharedFundSources: sharedFundSources.length,
                totalFundSources: fundSources.length,
                sharingPercentage: fundSources.length > 0 ? 
                    Math.round((sharedFundSources.length / fundSources.length) * 100) : 0
            };
        } catch (error) {
            console.error('Error getting sharing statistics:', error);
            return null;
        }
    }

    // Clear all user data
    clearAllData() {
        try {
            console.log('Clearing all user data...');
            
            // Clear all user-specific data
            this.setTransactions([]);
            this.setFundSources([]);
            this.setSubcategories([]);
            this.setSharingUsers([]);
            this.setInvitations([]);
            this.setSharingSettings([]);
            
            // Reinitialize default data
            this.initializeDefaultData();
            
            console.log('All user data cleared and defaults restored');
            return true;
            
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    }

    // Reinitialize user data (called on auth state changes)
    reinitializeUserData() {
        try {
            console.log('Reinitializing user data...');
            
            // Initialize default data for current user context
            this.initializeDefaultData();
            
            // Synchronize sharing data
            this.synchronizeSharingData();
            
            console.log('User data reinitialized successfully');
            return true;
            
        } catch (error) {
            console.error('Error reinitializing user data:', error);
            return false;
        }
    }
}

// Create global instance
window.storage = new StorageManager();