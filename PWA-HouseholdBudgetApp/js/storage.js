// Local Storage Management
class StorageManager {
    constructor() {
        this.keys = {
            transactions: 'budget_transactions',
            categories: 'budget_categories',
            subcategories: 'budget_subcategories',
            fundSources: 'budget_fund_sources',
            settings: 'budget_settings',
            sharingUsers: 'budget_sharing_users'
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

            // Initialize categories if empty
            if (userCategories.length === 0) {
                console.log('Creating default categories...');
                const defaultCategories = this.getDefaultCategories();
                this.setCategories(defaultCategories);
                console.log('Default categories created:', defaultCategories.length);
            }
            
            // Initialize subcategories if empty
            if (userSubcategories.length === 0) {
                console.log('Creating default subcategories...');
                const defaultSubcategories = this.getDefaultSubcategories();
                this.setSubcategories(defaultSubcategories);
                console.log('Default subcategories created:', defaultSubcategories.length);
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
            currentBalance: fundSource.initialBalance,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Perform integrity checks
        this.performIntegrityChecks('fundSource', 'create', newFundSource);
        
        fundSources.push(newFundSource);
        this.setFundSources(fundSources);
        
        // Update related data synchronously
        this.updateRelatedData('fundSource', 'create', newFundSource);
        
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
            
            // Trigger UI refresh if available
            if (window.uiManager) {
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
                { id: 'fs1', name: '現金', initialBalance: 0, currentBalance: 0, type: 'cash', isShared: false, sharedWith: [] }
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
            
            console.log('Force reinitialization completed');
            return true;
            
        } catch (error) {
            console.error('Error during force reinitialization:', error);
            return false;
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
                    if (!newData.name || newData.initialBalance === undefined) {
                        throw new Error('Fund source missing required fields');
                    }
                    
                    // Validate balance is a number
                    if (typeof newData.initialBalance !== 'number' || isNaN(newData.initialBalance)) {
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
                    fundSource.currentBalance = (fundSource.currentBalance || fundSource.initialBalance) + newData.amount;
                    fundSource.updatedAt = new Date();
                }
            } else if (action === 'update' && oldData) {
                // Revert old transaction amount and apply new amount
                if (oldData.fundSourceId === newData.fundSourceId) {
                    // Same fund source, just update the difference
                    const fundSource = fundSources.find(fs => fs.id === newData.fundSourceId);
                    if (fundSource) {
                        const difference = newData.amount - oldData.amount;
                        fundSource.currentBalance = (fundSource.currentBalance || fundSource.initialBalance) + difference;
                        fundSource.updatedAt = new Date();
                    }
                } else {
                    // Different fund sources, revert from old and add to new
                    const oldFundSource = fundSources.find(fs => fs.id === oldData.fundSourceId);
                    const newFundSource = fundSources.find(fs => fs.id === newData.fundSourceId);
                    
                    if (oldFundSource) {
                        oldFundSource.currentBalance = (oldFundSource.currentBalance || oldFundSource.initialBalance) - oldData.amount;
                        oldFundSource.updatedAt = new Date();
                    }
                    
                    if (newFundSource) {
                        newFundSource.currentBalance = (newFundSource.currentBalance || newFundSource.initialBalance) + newData.amount;
                        newFundSource.updatedAt = new Date();
                    }
                }
            } else if (action === 'delete' && oldData) {
                // Revert transaction amount from fund source
                const fundSource = fundSources.find(fs => fs.id === oldData.fundSourceId);
                if (fundSource) {
                    fundSource.currentBalance = (fundSource.currentBalance || fundSource.initialBalance) - oldData.amount;
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
        
        if (data.initialBalance === undefined || data.initialBalance === null || 
            typeof data.initialBalance !== 'number' || isNaN(data.initialBalance)) {
            errors.push('Valid initial balance is required');
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
                const totalTransactionAmount = relatedTransactions.reduce((sum, t) => sum + t.amount, 0);
                const calculatedBalance = fundSource.initialBalance + totalTransactionAmount;
                
                if (Math.abs(calculatedBalance - fundSource.currentBalance) > 0.01) {
                    console.log(`Correcting balance for ${fundSource.name}: ${fundSource.currentBalance} -> ${calculatedBalance}`);
                    fundSource.currentBalance = calculatedBalance;
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
        return newSubcategory;
    }

    updateSubcategory(id, updates) {
        const subcategories = this.getSubcategories();
        const index = subcategories.findIndex(sc => sc.id === id);
        if (index !== -1) {
            subcategories[index] = {
                ...subcategories[index],
                ...updates,
                updatedAt: new Date()
            };
            this.setSubcategories(subcategories);
            return subcategories[index];
        }
        return null;
    }

    deleteSubcategory(id) {
        const subcategories = this.getSubcategories();
        const filtered = subcategories.filter(sc => sc.id !== id);
        this.setSubcategories(filtered);
        return filtered.length < subcategories.length;
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

    getDefaultSubcategories() {
        return [
            { id: 'sub1', name: '食材', categoryId: 'cat1' },
            { id: 'sub2', name: '外食', categoryId: 'cat1' },
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
                initialBalance: 50000, 
                currentBalance: 50000, 
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
                initialBalance: 200000, 
                currentBalance: 200000, 
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
                initialBalance: 0, 
                currentBalance: 0, 
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
        
        return this.getItem(this.getUserKey(this.keys.sharingUsers), []);
    }

    setSharingUsers(sharingUsers) {
        if (!this.hasDataAccess()) return false;
        
        return this.setItem(this.getUserKey(this.keys.sharingUsers), sharingUsers);
    }

    // Sharing users management
    getSharingUsers() {
        if (!this.hasDataAccess()) return [];
        
        return this.getItem(this.getUserKey(this.keys.sharingUsers), []);
    }

    setSharingUsers(sharingUsers) {
        if (!this.hasDataAccess()) return false;
        
        return this.setItem(this.getUserKey(this.keys.sharingUsers), sharingUsers);
    }
}

// Create global instance
window.storage = new StorageManager();