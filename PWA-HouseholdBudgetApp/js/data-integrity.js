// Data Integrity Management System
class DataIntegrityManager {
    constructor(storage, dataManager) {
        this.storage = storage;
        this.dataManager = dataManager;
        this.validationRules = this.initializeValidationRules();
        this.dependencyMap = this.initializeDependencyMap();
        this.transactionQueue = [];
        this.isProcessingTransaction = false;
        
        console.log('DataIntegrityManager initialized');
    }

    // Initialize validation rules for all data types
    initializeValidationRules() {
        return {
            transaction: {
                required: ['amount', 'categoryId', 'fundSourceId', 'date'],
                types: {
                    amount: 'number',
                    categoryId: 'string',
                    fundSourceId: 'string',
                    date: 'date',
                    note: 'string'
                },
                constraints: {
                    amount: { min: -10000000, max: 10000000, notZero: true },
                    note: { maxLength: 500 }
                }
            },
            fundSource: {
                required: ['name', 'balance', 'type'],
                types: {
                    name: 'string',
                    balance: 'number',
                    type: 'string'
                },
                constraints: {
                    name: { minLength: 1, maxLength: 50, unique: true },
                    balance: { min: -10000000, max: 10000000 },
                    type: { enum: ['cash', 'bank', 'credit', 'savings', 'investment'] }
                }
            },
            category: {
                required: ['name', 'icon'],
                types: {
                    name: 'string',
                    icon: 'string',
                    color: 'string'
                },
                constraints: {
                    name: { minLength: 1, maxLength: 30, unique: true },
                    icon: { maxLength: 10 },
                    color: { pattern: /^#[0-9A-Fa-f]{6}$/ }
                }
            },
            subcategory: {
                required: ['name', 'categoryId'],
                types: {
                    name: 'string',
                    categoryId: 'string'
                },
                constraints: {
                    name: { minLength: 1, maxLength: 30, uniqueWithinCategory: true },
                    categoryId: { exists: 'categories' }
                }
            }
        };
    }

    // Initialize dependency mapping
    initializeDependencyMap() {
        return {
            categories: {
                dependents: ['subcategories', 'transactions'],
                cascadeDelete: false // Prevent deletion if dependents exist
            },
            subcategories: {
                dependents: ['transactions'],
                cascadeDelete: false
            },
            fundSources: {
                dependents: ['transactions'],
                cascadeDelete: false,
                updateCascade: ['transactions'] // Update related transactions when fund source changes
            },
            transactions: {
                dependencies: ['categories', 'fundSources', 'subcategories'],
                updateTriggers: ['fundSource.balance'] // Update fund source balance
            }
        };
    }

    // Main validation method
    validateData(dataType, data, options = {}) {
        const errors = [];
        const rules = this.validationRules[dataType];
        
        if (!rules) {
            errors.push(`Unknown data type: ${dataType}`);
            return { isValid: false, errors };
        }

        try {
            // Check required fields
            for (const field of rules.required) {
                if (data[field] === undefined || data[field] === null || data[field] === '') {
                    errors.push(`${field} is required`);
                }
            }

            // Check data types
            for (const [field, expectedType] of Object.entries(rules.types)) {
                if (data[field] !== undefined && data[field] !== null) {
                    if (!this.validateType(data[field], expectedType)) {
                        errors.push(`${field} must be of type ${expectedType}`);
                    }
                }
            }

            // Check constraints
            if (rules.constraints) {
                for (const [field, constraints] of Object.entries(rules.constraints)) {
                    if (data[field] !== undefined && data[field] !== null) {
                        const fieldErrors = this.validateConstraints(field, data[field], constraints, dataType, options);
                        errors.push(...fieldErrors);
                    }
                }
            }

            // Check dependencies
            const dependencyErrors = this.validateDependencies(dataType, data);
            errors.push(...dependencyErrors);

        } catch (error) {
            console.error('Validation error:', error);
            errors.push('Validation process failed');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Type validation
    validateType(value, expectedType) {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'date':
                return value instanceof Date || !isNaN(Date.parse(value));
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            default:
                return true;
        }
    }

    // Constraint validation
    validateConstraints(field, value, constraints, dataType, options) {
        const errors = [];

        try {
            // Min/Max for numbers
            if (constraints.min !== undefined && value < constraints.min) {
                errors.push(`${field} must be at least ${constraints.min}`);
            }
            if (constraints.max !== undefined && value > constraints.max) {
                errors.push(`${field} must be at most ${constraints.max}`);
            }

            // Not zero constraint
            if (constraints.notZero && value === 0) {
                errors.push(`${field} cannot be zero`);
            }

            // String length constraints
            if (constraints.minLength !== undefined && value.length < constraints.minLength) {
                errors.push(`${field} must be at least ${constraints.minLength} characters`);
            }
            if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
                errors.push(`${field} must be at most ${constraints.maxLength} characters`);
            }

            // Enum constraint
            if (constraints.enum && !constraints.enum.includes(value)) {
                errors.push(`${field} must be one of: ${constraints.enum.join(', ')}`);
            }

            // Pattern constraint
            if (constraints.pattern && !constraints.pattern.test(value)) {
                errors.push(`${field} format is invalid`);
            }

            // Uniqueness constraints
            if (constraints.unique) {
                const uniqueError = this.validateUniqueness(field, value, dataType, options.excludeId);
                if (uniqueError) errors.push(uniqueError);
            }

            if (constraints.uniqueWithinCategory) {
                const uniqueError = this.validateUniquenessWithinCategory(field, value, options.categoryId, options.excludeId);
                if (uniqueError) errors.push(uniqueError);
            }

            // Existence constraint
            if (constraints.exists) {
                const existsError = this.validateExistence(field, value, constraints.exists);
                if (existsError) errors.push(existsError);
            }

        } catch (error) {
            console.error('Constraint validation error:', error);
            errors.push(`Constraint validation failed for ${field}`);
        }

        return errors;
    }

    // Validate uniqueness
    validateUniqueness(field, value, dataType, excludeId = null) {
        try {
            let existingItems = [];
            
            switch (dataType) {
                case 'fundSource':
                    existingItems = this.storage.getFundSources();
                    break;
                case 'category':
                    existingItems = this.storage.getCategories();
                    break;
                default:
                    return null;
            }

            const duplicate = existingItems.find(item => 
                item[field] && item[field].toLowerCase() === value.toLowerCase() && 
                item.id !== excludeId
            );

            return duplicate ? `${field} '${value}' already exists` : null;
        } catch (error) {
            console.error('Uniqueness validation error:', error);
            return `Uniqueness check failed for ${field}`;
        }
    }

    // Validate uniqueness within category (for subcategories)
    validateUniquenessWithinCategory(field, value, categoryId, excludeId = null) {
        try {
            if (!categoryId) return `Category ID is required for ${field} uniqueness check`;

            const subcategories = this.storage.getSubcategories();
            const duplicate = subcategories.find(sc => 
                sc.categoryId === categoryId &&
                sc[field] && sc[field].toLowerCase() === value.toLowerCase() && 
                sc.id !== excludeId
            );

            return duplicate ? `${field} '${value}' already exists in this category` : null;
        } catch (error) {
            console.error('Category uniqueness validation error:', error);
            return `Category uniqueness check failed for ${field}`;
        }
    }

    // Validate existence of referenced data
    validateExistence(field, value, referenceType) {
        try {
            let referenceItems = [];
            
            switch (referenceType) {
                case 'categories':
                    referenceItems = this.storage.getCategories();
                    break;
                case 'fundSources':
                    referenceItems = this.storage.getFundSources();
                    break;
                case 'subcategories':
                    referenceItems = this.storage.getSubcategories();
                    break;
                default:
                    return `Unknown reference type: ${referenceType}`;
            }

            const exists = referenceItems.some(item => item.id === value);
            return exists ? null : `Referenced ${referenceType.slice(0, -1)} '${value}' does not exist`;
        } catch (error) {
            console.error('Existence validation error:', error);
            return `Existence check failed for ${field}`;
        }
    }

    // Validate dependencies
    validateDependencies(dataType, data) {
        const errors = [];
        const dependencies = this.dependencyMap[dataType]?.dependencies;

        if (!dependencies) return errors;

        try {
            for (const dependency of dependencies) {
                switch (dependency) {
                    case 'categories':
                        if (data.categoryId && !this.storage.getCategories().some(c => c.id === data.categoryId)) {
                            errors.push('Referenced category does not exist');
                        }
                        break;
                    case 'fundSources':
                        if (data.fundSourceId && !this.storage.getFundSources().some(fs => fs.id === data.fundSourceId)) {
                            errors.push('Referenced fund source does not exist');
                        }
                        break;
                    case 'subcategories':
                        if (data.subcategoryId && !this.storage.getSubcategories().some(sc => sc.id === data.subcategoryId)) {
                            errors.push('Referenced subcategory does not exist');
                        }
                        break;
                }
            }
        } catch (error) {
            console.error('Dependency validation error:', error);
            errors.push('Dependency validation failed');
        }

        return errors;
    }

    // Check if item can be deleted (no dependents)
    canDelete(dataType, itemId) {
        const dependencyInfo = this.dependencyMap[dataType];
        if (!dependencyInfo || !dependencyInfo.dependents) return true;

        try {
            for (const dependentType of dependencyInfo.dependents) {
                if (this.hasDependents(dataType, itemId, dependentType)) {
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Delete check error:', error);
            return false;
        }
    }

    // Check if item has dependents
    hasDependents(dataType, itemId, dependentType) {
        try {
            let dependentItems = [];
            
            switch (dependentType) {
                case 'transactions':
                    dependentItems = this.storage.getTransactions();
                    break;
                case 'subcategories':
                    dependentItems = this.storage.getSubcategories();
                    break;
                default:
                    return false;
            }

            // Check different reference patterns
            switch (dataType) {
                case 'categories':
                    return dependentItems.some(item => item.categoryId === itemId);
                case 'subcategories':
                    return dependentItems.some(item => item.subcategoryId === itemId);
                case 'fundSources':
                    return dependentItems.some(item => item.fundSourceId === itemId);
                default:
                    return false;
            }
        } catch (error) {
            console.error('Dependent check error:', error);
            return true; // Err on the side of caution
        }
    }

    // Transaction-like operations for data consistency
    async executeTransaction(operations) {
        if (this.isProcessingTransaction) {
            throw new Error('Another transaction is already in progress');
        }

        this.isProcessingTransaction = true;
        const rollbackData = {};

        try {
            // Validate all operations first
            for (const operation of operations) {
                const validation = this.validateOperation(operation);
                if (!validation.isValid) {
                    throw new Error(`Operation validation failed: ${validation.errors.join(', ')}`);
                }
            }

            // Create rollback data
            for (const operation of operations) {
                rollbackData[operation.type] = this.createRollbackData(operation);
            }

            // Execute operations
            const results = [];
            for (const operation of operations) {
                const result = await this.executeOperation(operation);
                results.push(result);
            }

            // Update related data
            await this.updateRelatedData(operations);

            this.isProcessingTransaction = false;
            return { success: true, results };

        } catch (error) {
            console.error('Transaction failed, rolling back:', error);
            
            // Rollback changes
            try {
                await this.rollbackChanges(rollbackData);
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError);
            }

            this.isProcessingTransaction = false;
            throw error;
        }
    }

    // Validate operation
    validateOperation(operation) {
        const { type, action, data, id } = operation;
        
        switch (action) {
            case 'create':
                return this.validateData(type, data);
            case 'update':
                return this.validateData(type, data, { excludeId: id });
            case 'delete':
                if (!this.canDelete(type, id)) {
                    return { isValid: false, errors: ['Item cannot be deleted due to dependencies'] };
                }
                return { isValid: true, errors: [] };
            default:
                return { isValid: false, errors: ['Unknown operation action'] };
        }
    }

    // Create rollback data
    createRollbackData(operation) {
        const { type, action, id } = operation;
        
        try {
            switch (type) {
                case 'transaction':
                    if (action === 'update' || action === 'delete') {
                        return this.storage.getTransactions().find(t => t.id === id);
                    }
                    break;
                case 'fundSource':
                    if (action === 'update' || action === 'delete') {
                        return this.storage.getFundSources().find(fs => fs.id === id);
                    }
                    break;
                case 'category':
                    if (action === 'update' || action === 'delete') {
                        return this.storage.getCategories().find(c => c.id === id);
                    }
                    break;
                case 'subcategory':
                    if (action === 'update' || action === 'delete') {
                        return this.storage.getSubcategories().find(sc => sc.id === id);
                    }
                    break;
            }
            return null;
        } catch (error) {
            console.error('Error creating rollback data:', error);
            return null;
        }
    }

    // Execute single operation
    async executeOperation(operation) {
        const { type, action, data, id } = operation;
        
        switch (action) {
            case 'create':
                return this.createItem(type, data);
            case 'update':
                return this.updateItem(type, id, data);
            case 'delete':
                return this.deleteItem(type, id);
            default:
                throw new Error(`Unknown operation action: ${action}`);
        }
    }

    // Create item with validation
    createItem(type, data) {
        switch (type) {
            case 'transaction':
                return this.storage.addTransaction(data);
            case 'fundSource':
                return this.storage.addFundSource(data);
            case 'category':
                return this.storage.addCategory(data);
            case 'subcategory':
                return this.storage.addSubcategory(data);
            default:
                throw new Error(`Unknown item type: ${type}`);
        }
    }

    // Update item with validation
    updateItem(type, id, data) {
        switch (type) {
            case 'transaction':
                return this.storage.updateTransaction(id, data);
            case 'fundSource':
                const fundSources = this.storage.getFundSources();
                const fsIndex = fundSources.findIndex(fs => fs.id === id);
                if (fsIndex === -1) throw new Error('Fund source not found');
                fundSources[fsIndex] = { ...fundSources[fsIndex], ...data, updatedAt: new Date() };
                this.storage.setFundSources(fundSources);
                return fundSources[fsIndex];
            case 'category':
                const categories = this.storage.getCategories();
                const catIndex = categories.findIndex(c => c.id === id);
                if (catIndex === -1) throw new Error('Category not found');
                categories[catIndex] = { ...categories[catIndex], ...data, updatedAt: new Date() };
                this.storage.setCategories(categories);
                return categories[catIndex];
            case 'subcategory':
                return this.storage.updateSubcategory(id, data);
            default:
                throw new Error(`Unknown item type: ${type}`);
        }
    }

    // Delete item
    deleteItem(type, id) {
        switch (type) {
            case 'transaction':
                return this.storage.deleteTransaction(id);
            case 'fundSource':
                return this.storage.deleteFundSource(id);
            case 'category':
                const categories = this.storage.getCategories();
                const filtered = categories.filter(c => c.id !== id);
                this.storage.setCategories(filtered);
                return filtered.length < categories.length;
            case 'subcategory':
                return this.storage.deleteSubcategory(id);
            default:
                throw new Error(`Unknown item type: ${type}`);
        }
    }

    // Update related data after operations
    async updateRelatedData(operations) {
        for (const operation of operations) {
            await this.updateCascadingData(operation);
        }
    }

    // Update cascading data
    async updateCascadingData(operation) {
        const { type, action, data, id } = operation;
        const dependencyInfo = this.dependencyMap[type];
        
        if (!dependencyInfo || !dependencyInfo.updateCascade) return;

        try {
            // Update fund source balance when transaction changes
            if (type === 'transaction' && (action === 'create' || action === 'update' || action === 'delete')) {
                await this.updateFundSourceBalances();
            }

            // Update transaction sharing status when fund source sharing changes
            if (type === 'fundSource' && action === 'update' && data.isShared !== undefined) {
                await this.updateTransactionSharingStatus(id, data.isShared);
            }
        } catch (error) {
            console.error('Error updating cascading data:', error);
            // Don't throw here as the main operation succeeded
        }
    }

    // Update fund source balances based on transactions
    async updateFundSourceBalances() {
        try {
            const fundSources = this.storage.getFundSources();
            const transactions = this.storage.getTransactions();

            for (const fundSource of fundSources) {
                const relatedTransactions = transactions.filter(t => t.fundSourceId === fundSource.id);
                const totalTransactionAmount = relatedTransactions.reduce((sum, t) => sum + t.amount, 0);
                fundSource.balance = totalTransactionAmount;
            }

            this.storage.setFundSources(fundSources);
        } catch (error) {
            console.error('Error updating fund source balances:', error);
            throw error;
        }
    }

    // Update transaction sharing status
    async updateTransactionSharingStatus(fundSourceId, isShared) {
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
            }
        } catch (error) {
            console.error('Error updating transaction sharing status:', error);
            throw error;
        }
    }

    // Rollback changes
    async rollbackChanges(rollbackData) {
        for (const [type, data] of Object.entries(rollbackData)) {
            if (data) {
                try {
                    // Restore the original data
                    switch (type) {
                        case 'transaction':
                            const transactions = this.storage.getTransactions();
                            const tIndex = transactions.findIndex(t => t.id === data.id);
                            if (tIndex >= 0) {
                                transactions[tIndex] = data;
                            } else {
                                transactions.push(data);
                            }
                            this.storage.setTransactions(transactions);
                            break;
                        // Add other types as needed
                    }
                } catch (error) {
                    console.error(`Error rolling back ${type}:`, error);
                }
            }
        }
    }

    // Data consistency check
    async performConsistencyCheck() {
        const issues = [];

        try {
            // Check orphaned transactions
            const orphanedTransactions = await this.findOrphanedTransactions();
            if (orphanedTransactions.length > 0) {
                issues.push({
                    type: 'orphaned_transactions',
                    count: orphanedTransactions.length,
                    items: orphanedTransactions
                });
            }

            // Check orphaned subcategories
            const orphanedSubcategories = await this.findOrphanedSubcategories();
            if (orphanedSubcategories.length > 0) {
                issues.push({
                    type: 'orphaned_subcategories',
                    count: orphanedSubcategories.length,
                    items: orphanedSubcategories
                });
            }

            // Check fund source balance consistency
            const balanceIssues = await this.checkFundSourceBalances();
            if (balanceIssues.length > 0) {
                issues.push({
                    type: 'balance_inconsistencies',
                    count: balanceIssues.length,
                    items: balanceIssues
                });
            }

            // Check duplicate names
            const duplicates = await this.findDuplicateNames();
            if (duplicates.length > 0) {
                issues.push({
                    type: 'duplicate_names',
                    count: duplicates.length,
                    items: duplicates
                });
            }

        } catch (error) {
            console.error('Error during consistency check:', error);
            issues.push({
                type: 'check_error',
                message: error.message
            });
        }

        return {
            hasIssues: issues.length > 0,
            issues: issues,
            checkedAt: new Date()
        };
    }

    // Find orphaned transactions
    async findOrphanedTransactions() {
        const transactions = this.storage.getTransactions();
        const categories = this.storage.getCategories();
        const fundSources = this.storage.getFundSources();
        const subcategories = this.storage.getSubcategories();
        
        const orphaned = [];

        for (const transaction of transactions) {
            const issues = [];
            
            if (!categories.some(c => c.id === transaction.categoryId)) {
                issues.push('missing_category');
            }
            
            if (!fundSources.some(fs => fs.id === transaction.fundSourceId)) {
                issues.push('missing_fund_source');
            }
            
            if (transaction.subcategoryId && !subcategories.some(sc => sc.id === transaction.subcategoryId)) {
                issues.push('missing_subcategory');
            }

            if (issues.length > 0) {
                orphaned.push({
                    id: transaction.id,
                    issues: issues
                });
            }
        }

        return orphaned;
    }

    // Find orphaned subcategories
    async findOrphanedSubcategories() {
        const subcategories = this.storage.getSubcategories();
        const categories = this.storage.getCategories();
        
        return subcategories.filter(sc => 
            !categories.some(c => c.id === sc.categoryId)
        ).map(sc => ({
            id: sc.id,
            name: sc.name,
            categoryId: sc.categoryId
        }));
    }

    // Check fund source balance consistency
    async checkFundSourceBalances() {
        const fundSources = this.storage.getFundSources();
        const transactions = this.storage.getTransactions();
        const issues = [];

        for (const fundSource of fundSources) {
            const relatedTransactions = transactions.filter(t => t.fundSourceId === fundSource.id);
            const calculatedBalance = relatedTransactions.reduce((sum, t) => sum + t.amount, 0);
            
            if (Math.abs(calculatedBalance - fundSource.balance) > 0.01) {
                issues.push({
                    id: fundSource.id,
                    name: fundSource.name,
                    storedBalance: fundSource.balance,
                    calculatedBalance: calculatedBalance,
                    difference: calculatedBalance - fundSource.balance
                });
            }
        }

        return issues;
    }

    // Find duplicate names
    async findDuplicateNames() {
        const duplicates = [];

        // Check fund sources
        const fundSources = this.storage.getFundSources();
        const fsNames = {};
        for (const fs of fundSources) {
            const lowerName = fs.name.toLowerCase();
            if (fsNames[lowerName]) {
                duplicates.push({
                    type: 'fund_source',
                    name: fs.name,
                    ids: [fsNames[lowerName], fs.id]
                });
            } else {
                fsNames[lowerName] = fs.id;
            }
        }

        // Check categories
        const categories = this.storage.getCategories();
        const catNames = {};
        for (const cat of categories) {
            const lowerName = cat.name.toLowerCase();
            if (catNames[lowerName]) {
                duplicates.push({
                    type: 'category',
                    name: cat.name,
                    ids: [catNames[lowerName], cat.id]
                });
            } else {
                catNames[lowerName] = cat.id;
            }
        }

        return duplicates;
    }

    // Auto-fix common issues
    async autoFixIssues(issues) {
        const fixResults = [];

        for (const issue of issues) {
            try {
                switch (issue.type) {
                    case 'balance_inconsistencies':
                        const balanceFixed = await this.fixBalanceInconsistencies(issue.items);
                        fixResults.push({ type: issue.type, fixed: balanceFixed, success: true });
                        break;
                    case 'orphaned_transactions':
                        const orphanedFixed = await this.fixOrphanedTransactions(issue.items);
                        fixResults.push({ type: issue.type, fixed: orphanedFixed, success: true });
                        break;
                    default:
                        fixResults.push({ type: issue.type, fixed: 0, success: false, reason: 'No auto-fix available' });
                }
            } catch (error) {
                console.error(`Error fixing ${issue.type}:`, error);
                fixResults.push({ type: issue.type, fixed: 0, success: false, reason: error.message });
            }
        }

        return fixResults;
    }

    // Fix balance inconsistencies
    async fixBalanceInconsistencies(balanceIssues) {
        let fixed = 0;
        const fundSources = this.storage.getFundSources();

        for (const issue of balanceIssues) {
            const fsIndex = fundSources.findIndex(fs => fs.id === issue.id);
            if (fsIndex >= 0) {
                fundSources[fsIndex].balance = issue.calculatedBalance;
                fixed++;
            }
        }

        if (fixed > 0) {
            this.storage.setFundSources(fundSources);
        }

        return fixed;
    }

    // Fix orphaned transactions (remove invalid references)
    async fixOrphanedTransactions(orphanedTransactions) {
        let fixed = 0;
        const transactions = this.storage.getTransactions();

        for (const orphaned of orphanedTransactions) {
            const tIndex = transactions.findIndex(t => t.id === orphaned.id);
            if (tIndex >= 0) {
                const transaction = transactions[tIndex];
                
                // Remove invalid subcategory reference
                if (orphaned.issues.includes('missing_subcategory')) {
                    transaction.subcategoryId = null;
                    fixed++;
                }
                
                // For missing category or fund source, we might need to delete the transaction
                // or assign to a default category/fund source
                if (orphaned.issues.includes('missing_category') || orphaned.issues.includes('missing_fund_source')) {
                    // For now, we'll just log this - manual intervention might be needed
                    console.warn(`Transaction ${transaction.id} has missing critical references and needs manual review`);
                }
            }
        }

        if (fixed > 0) {
            this.storage.setTransactions(transactions);
        }

        return fixed;
    }

    // Get data integrity status
    getIntegrityStatus() {
        return {
            isProcessingTransaction: this.isProcessingTransaction,
            queueLength: this.transactionQueue.length,
            lastCheck: this.lastConsistencyCheck || null
        };
    }
}

// Create global instance when dependencies are ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.storage && window.dataManager) {
        window.dataIntegrityManager = new DataIntegrityManager(window.storage, window.dataManager);
    } else {
        // Retry after a short delay
        setTimeout(() => {
            if (window.storage && window.dataManager) {
                window.dataIntegrityManager = new DataIntegrityManager(window.storage, window.dataManager);
            }
        }, 200);
    }
});