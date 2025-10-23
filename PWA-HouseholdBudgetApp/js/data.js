// Data Processing and Business Logic - Coordinating Manager
class DataManager {
    constructor(storage) {
        this.storage = storage;
        this.permissionManager = window.permissionManager || new PermissionManager();
        
        // Initialize specialized managers
        this.transactionManager = new TransactionManager(storage, this.permissionManager);
        this.fundSourceManager = new FundSourceManager(storage, this.permissionManager);
        this.subcategoryManager = new SubcategoryManager(storage);
        
        this.filters = {
            startDate: null,
            endDate: null,
            category: null,
            fundSource: null
        };

        // Performance optimizations
        this.cache = new PerformanceCache();
        this.dataOptimizer = new DataAccessOptimizer(storage, this.cache);
        this.uiOptimizer = new UIResponsivenessOptimizer();

        // Initialize performance features
        this.initializePerformanceOptimizations();
    }

    // Initialize performance optimizations
    initializePerformanceOptimizations() {
        // Preload commonly accessed data
        this.dataOptimizer.preloadCommonData();

        // Set up optimized filter state management
        this.optimizedFilterState = {
            lastApplied: null,
            cachedResults: new Map(),
            filterHash: null
        };
    }

    // Transaction methods (delegated to TransactionManager)
    getTransactions(filtered = false) {
        return this.transactionManager.getTransactions(filtered, this.filters);
    }

    // Optimized filter application with caching
    applyFiltersOptimized(transactions) {
        const filterHash = this.generateFilterHash();

        // Check if we have cached results for this filter combination
        if (this.optimizedFilterState.filterHash === filterHash &&
            this.optimizedFilterState.cachedResults.has(filterHash)) {
            return this.optimizedFilterState.cachedResults.get(filterHash);
        }

        // Apply filters efficiently
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        const filteredTransactions = transactions.filter(transaction => {
            // Date filters (most selective first)
            if (this.filters.startDate && new Date(transaction.date) < new Date(this.filters.startDate)) {
                return false;
            }
            if (this.filters.endDate && new Date(transaction.date) > new Date(this.filters.endDate)) {
                return false;
            }

            // ID-based filters (fast lookups)
            if (this.filters.category && transaction.categoryId !== this.filters.category) {
                return false;
            }
            if (this.filters.fundSource && transaction.fundSourceId !== this.filters.fundSource) {
                return false;
            }
            if (this.filters.createdBy && transaction.createdBy !== this.filters.createdBy) {
                return false;
            }

            // Boolean filters
            if (this.filters.showOnlyMyTransactions && currentUser) {
                if (transaction.createdBy !== currentUser.id) {
                    return false;
                }
            }
            if (this.filters.showOnlySharedTransactions) {
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
    generateFilterHash() {
        return JSON.stringify(this.filters);
    }

    addTransaction(transactionData) {
        return this.transactionManager.addTransaction(transactionData);
    }

    updateTransaction(id, updates) {
        return this.transactionManager.updateTransaction(id, updates);
    }

    deleteTransaction(id) {
        return this.transactionManager.deleteTransaction(id);
    }

    // Fund source methods (delegated to FundSourceManager)
    deleteFundSource(id) {
        return this.fundSourceManager.deleteFundSource(id);
    }

    canDeleteFundSource(id) {
        return this.fundSourceManager.canDeleteFundSource(id);
    }

    // Subcategory methods (delegated to SubcategoryManager)
    getSubcategories(categoryId = null) {
        return this.subcategoryManager.getSubcategories(categoryId);
    }

    addSubcategory(subcategoryData) {
        return this.subcategoryManager.addSubcategory(subcategoryData);
    }

    updateSubcategory(id, updates) {
        return this.subcategoryManager.updateSubcategory(id, updates);
    }

    deleteSubcategory(id) {
        return this.subcategoryManager.deleteSubcategory(id);
    }

    canDeleteSubcategory(id) {
        return this.subcategoryManager.canDeleteSubcategory(id);
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
        this.saveFilterState();
    }

    // Get available creators for filtering
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

    // Transaction query methods (delegated to TransactionManager)
    getTransactionsByCreator(creatorId) {
        return this.transactionManager.getTransactionsByCreator(creatorId);
    }

    getSharedTransactions() {
        return this.transactionManager.getSharedTransactions();
    }

    getMyTransactions() {
        return this.transactionManager.getMyTransactions();
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
        this.saveFilterState();
    }

    // Filter state persistence
    saveFilterState() {
        try {
            const filterState = {
                ...this.filters,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('budget_filter_state', JSON.stringify(filterState));
        } catch (error) {
            console.error('Error saving filter state:', error);
        }
    }

    loadFilterState() {
        try {
            const saved = localStorage.getItem('budget_filter_state');
            if (saved) {
                const filterState = JSON.parse(saved);
                // Only restore if saved within last 24 hours
                const savedAt = new Date(filterState.savedAt);
                const now = new Date();
                const hoursDiff = (now - savedAt) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    delete filterState.savedAt;
                    this.filters = { ...this.filters, ...filterState };
                    return true;
                }
            }
        } catch (error) {
            console.error('Error loading filter state:', error);
        }
        return false;
    }

    // Get filter summary for UI display
    getFilterSummary() {
        const activeFilters = [];

        if (this.filters.startDate || this.filters.endDate) {
            if (this.filters.startDate && this.filters.endDate) {
                activeFilters.push(`期間: ${this.filters.startDate} - ${this.filters.endDate}`);
            } else if (this.filters.startDate) {
                activeFilters.push(`開始日: ${this.filters.startDate}`);
            } else {
                activeFilters.push(`終了日: ${this.filters.endDate}`);
            }
        }

        if (this.filters.category) {
            const categories = this.storage.getCategories();
            const category = categories.find(c => c.id === this.filters.category);
            activeFilters.push(`カテゴリ: ${category ? category.name : 'Unknown'}`);
        }

        if (this.filters.fundSource) {
            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === this.filters.fundSource);
            activeFilters.push(`資金元: ${fundSource ? fundSource.name : 'Unknown'}`);
        }

        if (this.filters.createdBy) {
            const creators = this.getAvailableCreators();
            const creator = creators.find(c => c.id === this.filters.createdBy);
            activeFilters.push(`作成者: ${creator ? creator.username : 'Unknown'}`);
        }

        if (this.filters.showOnlyMyTransactions) {
            activeFilters.push('自分の取引のみ');
        }

        if (this.filters.showOnlySharedTransactions) {
            activeFilters.push('共有取引のみ');
        }

        return activeFilters;
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

    // Analytics methods (delegated to TransactionManager)
    getTransactionsByDate(date) {
        return this.transactionManager.getTransactionsByDate(date);
    }

    getTransactionsByMonth(year, month) {
        return this.transactionManager.getTransactionsByMonth(year, month);
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
        return fundSources.reduce((total, fs) => total + fs.balance, 0);
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

    // Transaction permission methods (delegated to TransactionManager)
    canEditTransaction(transaction) {
        return this.transactionManager.canEditTransaction(transaction);
    }

    canDeleteTransaction(transaction) {
        return this.transactionManager.canDeleteTransaction(transaction);
    }

    // Fund source permission methods (delegated to FundSourceManager)
    canViewFundSource(fundSourceId) {
        return this.fundSourceManager.canViewFundSource(fundSourceId);
    }

    canManageFundSource(fundSourceId) {
        return this.fundSourceManager.canManageFundSource(fundSourceId);
    }

    canInviteUsers(fundSourceId) {
        return this.fundSourceManager.canInviteUsers(fundSourceId);
    }

    getUserPermissions(fundSourceId) {
        return this.fundSourceManager.getUserPermissions(fundSourceId);
    }

    getUserPermissionLevel(fundSourceId) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return null;

        const fundSources = this.storage.getFundSources();
        return this.permissionManager.getUserPermissionLevel(currentUser.id, fundSourceId, fundSources);
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
        // Get actual shared users from storage
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) return [];

        // Get sharing data from storage
        const sharingData = this.storage.getSharingUsers();

        // Filter users that are sharing with current user
        return sharingData.filter(user =>
            user.sharedWith && user.sharedWith.includes(currentUser.id)
        );
    }

    // Add shared user management methods
    addSharedUser(userEmail, fundSourceIds = []) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) {
            throw new Error('ログインが必要です');
        }

        // Check permission to invite users for the specified fund sources
        const fundSources = this.storage.getFundSources();
        for (const fundSourceId of fundSourceIds) {
            if (!this.permissionManager.canInviteUsers(currentUser.id, fundSourceId, fundSources)) {
                throw new Error(`資金元 ${fundSourceId} にユーザーを招待する権限がありません`);
            }
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            throw new Error('有効なメールアドレスを入力してください');
        }

        const sharingData = this.storage.getSharingUsers();

        // Check if user already exists
        const existingUser = sharingData.find(user => user.email === userEmail);
        if (existingUser) {
            throw new Error('このユーザーは既に共有リストに存在します');
        }

        // Create new shared user entry
        const newSharedUser = {
            id: this.storage.generateId(),
            email: userEmail,
            username: userEmail.split('@')[0], // Use email prefix as username
            sharedWith: [currentUser.id],
            sharedFundSources: fundSourceIds,
            invitedBy: currentUser.id,
            invitedAt: new Date(),
            status: 'pending' // pending, accepted, declined
        };

        sharingData.push(newSharedUser);
        this.storage.setSharingUsers(sharingData);

        return newSharedUser;
    }

    removeSharedUser(userId) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) {
            throw new Error('ログインが必要です');
        }

        const sharingData = this.storage.getSharingUsers();
        const userIndex = sharingData.findIndex(user => user.id === userId);

        if (userIndex === -1) {
            throw new Error('指定されたユーザーが見つかりません');
        }

        const user = sharingData[userIndex];

        // Check if current user has permission to remove this user
        if (!user.sharedWith.includes(currentUser.id) && user.invitedBy !== currentUser.id) {
            throw new Error('このユーザーを削除する権限がありません');
        }

        // Remove user from sharing data
        sharingData.splice(userIndex, 1);
        this.storage.setSharingUsers(sharingData);

        // Remove user from all fund source sharing with permission checks
        const fundSources = this.storage.getFundSources();
        let fundSourcesUpdated = false;

        fundSources.forEach(fs => {
            if (fs.sharedWith) {
                // Check if current user can manage this fund source
                if (this.permissionManager.canManageFundSource(currentUser.id, fs.id, fundSources)) {
                    // Handle both old format (array of IDs) and new format (array of user objects)
                    const originalLength = fs.sharedWith.length;
                    fs.sharedWith = fs.sharedWith.filter(sharedUser => {
                        if (typeof sharedUser === 'object') {
                            return sharedUser.userId !== userId;
                        } else {
                            return sharedUser !== userId;
                        }
                    });

                    if (fs.sharedWith.length !== originalLength) {
                        fundSourcesUpdated = true;
                        if (fs.sharedWith.length === 0) {
                            fs.isShared = false;
                        }
                        fs.updatedAt = new Date();
                    }
                }
            }
        });

        if (fundSourcesUpdated) {
            this.storage.setFundSources(fundSources);
        }

        // Cancel any pending invitations for this user
        if (window.sharingManager && window.sharingManager.invitationManager) {
            try {
                const pendingInvitations = window.sharingManager.invitationManager
                    .getInvitationsByEmail(user.email)
                    .filter(inv => inv.status === 'pending');

                for (const invitation of pendingInvitations) {
                    window.sharingManager.invitationManager.updateInvitationStatus(invitation.id, 'cancelled');
                }
            } catch (error) {
                console.warn('Error cancelling related invitations:', error);
            }
        }

        return true;
    }

    // Bulk remove shared user access from multiple fund sources
    removeSharedUserFromMultipleFundSources(userId, fundSourceIds) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) {
            throw new Error('ログインが必要です');
        }

        const results = [];
        const errors = [];

        for (const fundSourceId of fundSourceIds) {
            try {
                const result = this.removeSharedUserFromFundSource(userId, fundSourceId);
                results.push({
                    fundSourceId: fundSourceId,
                    success: true,
                    result: result
                });
            } catch (error) {
                errors.push({
                    fundSourceId: fundSourceId,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            successful: results,
            failed: errors,
            totalProcessed: results.length,
            totalFailed: errors.length
        };
    }

    updateSharedUserStatus(userId, status) {
        const sharingData = this.storage.getSharingUsers();
        const userIndex = sharingData.findIndex(user => user.id === userId);

        if (userIndex === -1) {
            throw new Error('指定されたユーザーが見つかりません');
        }

        sharingData[userIndex].status = status;
        sharingData[userIndex].updatedAt = new Date();

        this.storage.setSharingUsers(sharingData);
        return sharingData[userIndex];
    }

    // Remove shared user access from specific fund source
    removeSharedUserFromFundSource(userId, fundSourceId) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) {
            throw new Error('ログインが必要です');
        }

        const fundSources = this.storage.getFundSources();

        // Check permission to manage this fund source
        if (!this.permissionManager.canManageFundSource(currentUser.id, fundSourceId, fundSources)) {
            throw new Error('この資金元の共有設定を変更する権限がありません');
        }

        const fundSourceIndex = fundSources.findIndex(fs => fs.id === fundSourceId);
        if (fundSourceIndex === -1) {
            throw new Error('指定された資金元が見つかりません');
        }

        const fundSource = fundSources[fundSourceIndex];

        // Check if user is in shared users list (new format with user objects)
        if (!fundSource.sharedWith) {
            throw new Error('この資金元は共有されていません');
        }

        const userIndex = fundSource.sharedWith.findIndex(user =>
            typeof user === 'object' ? user.userId === userId : user === userId
        );

        if (userIndex === -1) {
            throw new Error('指定されたユーザーはこの資金元を共有していません');
        }

        // Remove user from fund source sharing
        fundSource.sharedWith.splice(userIndex, 1);

        // If no more shared users, disable sharing
        if (fundSource.sharedWith.length === 0) {
            fundSource.isShared = false;
        }

        fundSource.updatedAt = new Date();
        fundSources[fundSourceIndex] = fundSource;
        this.storage.setFundSources(fundSources);

        // Update transaction sharing status
        this.updateTransactionSharingStatus(fundSourceId, fundSource.isShared);

        // Cancel any pending invitations for this user and fund source
        if (window.sharingManager && window.sharingManager.invitationManager) {
            try {
                const pendingInvitations = window.sharingManager.invitationManager
                    .getInvitationsByFundSource(fundSourceId)
                    .filter(inv => inv.status === 'pending' && inv.inviteeEmail === userId);

                for (const invitation of pendingInvitations) {
                    window.sharingManager.invitationManager.updateInvitationStatus(invitation.id, 'cancelled');
                }
            } catch (error) {
                console.warn('Error cancelling related invitations:', error);
            }
        }

        return fundSource;
    }

    // Get fund source sharing settings
    getFundSourceSharingSettings(fundSourceId) {
        const fundSources = this.storage.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === fundSourceId);

        if (!fundSource) {
            return null;
        }

        return {
            isShared: fundSource.isShared || false,
            sharedWith: fundSource.sharedWith || [],
            permissions: fundSource.permissions || {
                canView: true,
                canEdit: false,
                canDelete: false
            }
        };
    }

    // Update fund source sharing settings
    updateFundSourceSharing(fundSourceId, settings) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) {
            throw new Error('ログインが必要です');
        }

        const fundSources = this.storage.getFundSources();

        // Check permission to manage this fund source
        if (!this.permissionManager.canManageFundSource(currentUser.id, fundSourceId, fundSources)) {
            throw new Error('この資金元の共有設定を変更する権限がありません');
        }

        const fundSourceIndex = fundSources.findIndex(fs => fs.id === fundSourceId);

        if (fundSourceIndex === -1) {
            throw new Error('指定された資金元が見つかりません');
        }

        const fundSource = fundSources[fundSourceIndex];

        // Validate permissions if provided
        if (settings.permissions) {
            const validationErrors = this.permissionManager.validatePermissions(settings.permissions);
            if (validationErrors.length > 0) {
                throw new Error(`権限設定が無効です: ${validationErrors.join(', ')}`);
            }
        }

        // Update sharing settings
        fundSource.isShared = settings.isShared || false;
        fundSource.sharedWith = settings.sharedWith || [];
        fundSource.permissions = settings.permissions || {
            canView: true,
            canEdit: false,
            canDelete: false
        };
        fundSource.updatedAt = new Date();

        // If sharing is disabled, clear shared users
        if (!fundSource.isShared) {
            fundSource.sharedWith = [];
        }

        fundSources[fundSourceIndex] = fundSource;
        this.storage.setFundSources(fundSources);

        // Update related transactions sharing status
        this.updateTransactionSharingStatus(fundSourceId, fundSource.isShared);

        return fundSource;
    }

    // Update transaction sharing status based on fund source
    updateTransactionSharingStatus(fundSourceId, isShared) {
        const transactions = this.storage.getTransactions();
        let updated = false;

        transactions.forEach(transaction => {
            if (transaction.fundSourceId === fundSourceId) {
                transaction.isShared = isShared;
                transaction.updatedAt = new Date();
                updated = true;
            }
        });

        if (updated) {
            this.storage.setTransactions(transactions);
        }
    }

    // Enhanced validation methods
    validateTransaction(data) {
        const errors = [];

        // Amount validation
        if (!data.amount || data.amount === 0) {
            errors.push('金額を入力してください');
        } else if (typeof data.amount !== 'number' || isNaN(data.amount)) {
            errors.push('有効な金額を入力してください');
        } else if (Math.abs(data.amount) > 10000000) {
            errors.push('金額が範囲を超えています');
        }

        // Category validation
        if (!data.categoryId) {
            errors.push('カテゴリを選択してください');
        } else {
            const categories = this.storage.getCategories();
            if (!categories.some(c => c.id === data.categoryId)) {
                errors.push('選択されたカテゴリが存在しません');
            }
        }

        // Fund source validation
        if (!data.fundSourceId) {
            errors.push('資金元を選択してください');
        } else {
            const fundSources = this.storage.getFundSources();
            if (!fundSources.some(fs => fs.id === data.fundSourceId)) {
                errors.push('選択された資金元が存在しません');
            }
        }

        // Date validation
        if (!data.date) {
            errors.push('日付を選択してください');
        } else {
            const date = new Date(data.date);
            if (isNaN(date.getTime())) {
                errors.push('有効な日付を入力してください');
            } else if (date > new Date()) {
                errors.push('未来の日付は入力できません');
            }
        }

        // Subcategory validation (if provided)
        if (data.subcategoryId) {
            const subcategories = this.storage.getSubcategories();
            const subcategory = subcategories.find(sc => sc.id === data.subcategoryId);
            if (!subcategory) {
                errors.push('選択されたサブカテゴリが存在しません');
            } else if (subcategory.categoryId !== data.categoryId) {
                errors.push('サブカテゴリが選択されたカテゴリと一致しません');
            }
        }

        // Note validation (if provided)
        if (data.note && data.note.length > 500) {
            errors.push('メモは500文字以内で入力してください');
        }

        return errors;
    }

    validateFundSource(data) {
        const errors = [];

        // Name validation
        if (!data.name || data.name.trim() === '') {
            errors.push('名前を入力してください');
        } else if (data.name.trim().length > 50) {
            errors.push('名前は50文字以内で入力してください');
        } else {
            // Check for duplicate names
            const existingFundSources = this.storage.getFundSources();
            const duplicate = existingFundSources.find(fs =>
                fs.name.toLowerCase().trim() === data.name.toLowerCase().trim() &&
                fs.id !== data.id
            );
            if (duplicate) {
                errors.push('この名前の資金元は既に存在します');
            }
        }

        // Balance validation
        if (data.balance === undefined || data.balance === null) {
            errors.push('残高を入力してください');
        } else if (typeof data.balance !== 'number' || isNaN(data.balance)) {
            errors.push('有効な残高を入力してください');
        } else if (Math.abs(data.balance) > 10000000) {
            errors.push('残高が範囲を超えています');
        }

        // Type validation
        if (data.type) {
            const validTypes = ['cash', 'bank', 'credit', 'savings', 'investment'];
            if (!validTypes.includes(data.type)) {
                errors.push('無効な資金元タイプです');
            }
        }

        return errors;
    }

    validateSubcategory(data) {
        const errors = [];

        // Name validation
        if (!data.name || data.name.trim() === '') {
            errors.push('サブカテゴリ名を入力してください');
        } else if (data.name.trim().length > 30) {
            errors.push('サブカテゴリ名は30文字以内で入力してください');
        }

        // Category validation
        if (!data.categoryId) {
            errors.push('カテゴリが選択されていません');
        } else {
            const categories = this.storage.getCategories();
            if (!categories.some(c => c.id === data.categoryId)) {
                errors.push('選択されたカテゴリが存在しません');
            }

            // Check for duplicate names within the same category
            if (data.name && data.name.trim()) {
                const existingSubcategories = this.getSubcategories(data.categoryId);
                const duplicate = existingSubcategories.find(sc =>
                    sc.name.toLowerCase().trim() === data.name.toLowerCase().trim() &&
                    sc.id !== data.id
                );
                if (duplicate) {
                    errors.push('このカテゴリ内に同じ名前のサブカテゴリが既に存在します');
                }
            }
        }

        return errors;
    }

    // Data consistency check methods
    checkDataConsistency() {
        const issues = [];

        try {
            // Check for orphaned transactions
            const orphanedTransactions = this.findOrphanedTransactions();
            if (orphanedTransactions.length > 0) {
                issues.push({
                    type: 'orphaned_transactions',
                    count: orphanedTransactions.length,
                    description: '参照先が存在しない取引があります'
                });
            }

            // Check for orphaned subcategories
            const orphanedSubcategories = this.findOrphanedSubcategories();
            if (orphanedSubcategories.length > 0) {
                issues.push({
                    type: 'orphaned_subcategories',
                    count: orphanedSubcategories.length,
                    description: '参照先カテゴリが存在しないサブカテゴリがあります'
                });
            }

            // Check fund source balance consistency
            const balanceIssues = this.checkFundSourceBalanceConsistency();
            if (balanceIssues.length > 0) {
                issues.push({
                    type: 'balance_inconsistencies',
                    count: balanceIssues.length,
                    description: '資金元の残高に不整合があります'
                });
            }

            // Check for duplicate names
            const duplicateIssues = this.findDuplicateNames();
            if (duplicateIssues.length > 0) {
                issues.push({
                    type: 'duplicate_names',
                    count: duplicateIssues.length,
                    description: '重複する名前があります'
                });
            }

        } catch (error) {
            console.error('Error during consistency check:', error);
            issues.push({
                type: 'check_error',
                description: 'データ整合性チェック中にエラーが発生しました'
            });
        }

        return {
            hasIssues: issues.length > 0,
            issues: issues,
            checkedAt: new Date()
        };
    }

    findOrphanedTransactions() {
        const transactions = this.getTransactions();
        const categories = this.storage.getCategories();
        const fundSources = this.storage.getFundSources();
        const subcategories = this.storage.getSubcategories();

        return transactions.filter(transaction => {
            const hasValidCategory = categories.some(c => c.id === transaction.categoryId);
            const hasValidFundSource = fundSources.some(fs => fs.id === transaction.fundSourceId);
            const hasValidSubcategory = !transaction.subcategoryId ||
                subcategories.some(sc => sc.id === transaction.subcategoryId);

            return !hasValidCategory || !hasValidFundSource || !hasValidSubcategory;
        });
    }

    findOrphanedSubcategories() {
        const subcategories = this.storage.getSubcategories();
        const categories = this.storage.getCategories();

        return subcategories.filter(subcategory =>
            !categories.some(c => c.id === subcategory.categoryId)
        );
    }

    checkFundSourceBalanceConsistency() {
        const fundSources = this.storage.getFundSources();
        const transactions = this.getTransactions();
        const issues = [];

        for (const fundSource of fundSources) {
            const relatedTransactions = transactions.filter(t => t.fundSourceId === fundSource.id);
            // 残高は取引の累積で計算される（初期値は0として扱う）
            const calculatedBalance = relatedTransactions.reduce((sum, t) => sum + t.amount, 0);

            if (Math.abs(calculatedBalance - fundSource.balance) > 0.01) {
                issues.push({
                    fundSourceId: fundSource.id,
                    name: fundSource.name,
                    storedBalance: fundSource.balance,
                    calculatedBalance: calculatedBalance
                });
            }
        }

        return issues;
    }

    findDuplicateNames() {
        const duplicates = [];

        // Check fund source names
        const fundSources = this.storage.getFundSources();
        const fsNames = new Map();
        for (const fs of fundSources) {
            const lowerName = fs.name.toLowerCase().trim();
            if (fsNames.has(lowerName)) {
                duplicates.push({
                    type: 'fund_source',
                    name: fs.name,
                    ids: [fsNames.get(lowerName), fs.id]
                });
            } else {
                fsNames.set(lowerName, fs.id);
            }
        }

        // Check category names
        const categories = this.storage.getCategories();
        const catNames = new Map();
        for (const cat of categories) {
            const lowerName = cat.name.toLowerCase().trim();
            if (catNames.has(lowerName)) {
                duplicates.push({
                    type: 'category',
                    name: cat.name,
                    ids: [catNames.get(lowerName), cat.id]
                });
            } else {
                catNames.set(lowerName, cat.id);
            }
        }

        return duplicates;
    }

    // Auto-repair methods
    repairDataInconsistencies(issues) {
        const repairResults = [];

        for (const issue of issues) {
            try {
                switch (issue.type) {
                    case 'balance_inconsistencies':
                        const balanceFixed = this.repairBalanceInconsistencies();
                        repairResults.push({
                            type: issue.type,
                            success: true,
                            fixed: balanceFixed,
                            message: `${balanceFixed}件の残高不整合を修正しました`
                        });
                        break;

                    case 'orphaned_transactions':
                        const orphanedFixed = this.repairOrphanedTransactions();
                        repairResults.push({
                            type: issue.type,
                            success: true,
                            fixed: orphanedFixed,
                            message: `${orphanedFixed}件の孤立した取引を修正しました`
                        });
                        break;

                    case 'orphaned_subcategories':
                        const subcategoriesFixed = this.repairOrphanedSubcategories();
                        repairResults.push({
                            type: issue.type,
                            success: true,
                            fixed: subcategoriesFixed,
                            message: `${subcategoriesFixed}件の孤立したサブカテゴリを削除しました`
                        });
                        break;

                    default:
                        repairResults.push({
                            type: issue.type,
                            success: false,
                            fixed: 0,
                            message: '自動修復に対応していません'
                        });
                }
            } catch (error) {
                console.error(`Error repairing ${issue.type}:`, error);
                repairResults.push({
                    type: issue.type,
                    success: false,
                    fixed: 0,
                    message: `修復中にエラーが発生しました: ${error.message}`
                });
            }
        }

        return repairResults;
    }

    repairBalanceInconsistencies() {
        const fundSources = this.storage.getFundSources();
        const transactions = this.getTransactions();
        let fixed = 0;

        for (const fundSource of fundSources) {
            const relatedTransactions = transactions.filter(t => t.fundSourceId === fundSource.id);
            // 残高は取引の累積で計算される（初期値は0として扱う）
            const calculatedBalance = relatedTransactions.reduce((sum, t) => sum + t.amount, 0);

            if (Math.abs(calculatedBalance - fundSource.balance) > 0.01) {
                fundSource.balance = calculatedBalance;
                fundSource.updatedAt = new Date();
                fixed++;
            }
        }

        if (fixed > 0) {
            this.storage.setFundSources(fundSources);
        }

        return fixed;
    }

    repairOrphanedTransactions() {
        const transactions = this.getTransactions();
        const categories = this.storage.getCategories();
        const fundSources = this.storage.getFundSources();
        const subcategories = this.storage.getSubcategories();
        let fixed = 0;

        for (const transaction of transactions) {
            let modified = false;

            // Remove invalid subcategory references
            if (transaction.subcategoryId &&
                !subcategories.some(sc => sc.id === transaction.subcategoryId)) {
                transaction.subcategoryId = null;
                modified = true;
                fixed++;
            }

            if (modified) {
                transaction.updatedAt = new Date();
            }
        }

        if (fixed > 0) {
            this.storage.setTransactions(transactions);
        }

        return fixed;
    }

    repairOrphanedSubcategories() {
        const subcategories = this.storage.getSubcategories();
        const categories = this.storage.getCategories();

        const validSubcategories = subcategories.filter(subcategory =>
            categories.some(c => c.id === subcategory.categoryId)
        );

        const fixed = subcategories.length - validSubcategories.length;

        if (fixed > 0) {
            this.storage.setSubcategories(validSubcategories);
        }

        return fixed;
    }

    // ===== 共有取引管理機能 (Task 9.1) =====

    /**
     * 共有取引の作成処理
     * 要件 4.1, 4.2, 4.3 に対応
     */
    createSharedTransaction(transactionData) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) {
            throw new Error('共有取引を作成するにはログインが必要です');
        }

        // 権限検証
        if (!this.canCreateTransactionInFundSource(currentUser.id, transactionData.fundSourceId)) {
            throw new Error('この資金元で取引を作成する権限がありません');
        }

        // 共有フラグを設定
        transactionData.isShared = true;
        transactionData.createdBy = currentUser.id;
        transactionData.createdByUsername = currentUser.username || currentUser.email;
        transactionData.createdAt = new Date();

        // 通常の取引作成処理を使用
        const transaction = this.addTransaction(transactionData);

        // 共有状態の自動更新
        this.updateSharedTransactionStatus(transaction.id);

        return transaction;
    }

    /**
     * 共有取引の更新処理
     * 要件 4.2, 4.3 に対応
     */
    updateSharedTransaction(transactionId, updates) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) {
            throw new Error('共有取引を更新するにはログインが必要です');
        }

        const transaction = this.storage.getTransactions().find(t => t.id === transactionId);
        if (!transaction) {
            throw new Error('指定された取引が見つかりません');
        }

        // 共有取引の編集権限検証
        if (!this.canEditSharedTransaction(currentUser.id, transactionId)) {
            throw new Error('この共有取引を編集する権限がありません');
        }

        // 更新情報を追加
        updates.updatedAt = new Date();
        updates.updatedBy = currentUser.id;

        // 通常の更新処理を使用
        const updatedTransaction = this.updateTransaction(transactionId, updates);

        // 共有状態の自動更新
        this.updateSharedTransactionStatus(transactionId);

        return updatedTransaction;
    }

    /**
     * 共有取引の削除処理
     * 要件 4.3 に対応
     */
    deleteSharedTransaction(transactionId) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser) {
            throw new Error('共有取引を削除するにはログインが必要です');
        }

        const transaction = this.storage.getTransactions().find(t => t.id === transactionId);
        if (!transaction) {
            throw new Error('指定された取引が見つかりません');
        }

        // 共有取引の削除権限検証
        if (!this.canDeleteSharedTransaction(currentUser.id, transactionId)) {
            throw new Error('この共有取引を削除する権限がありません');
        }

        // 通常の削除処理を使用
        return this.deleteTransaction(transactionId);
    }

    /**
     * 取引編集権限の検証
     * 要件 4.2 に対応
     */
    canEditSharedTransaction(userId, transactionId) {
        const transactions = this.storage.getTransactions();
        const fundSources = this.storage.getFundSources();

        return this.permissionManager.canEditTransaction(userId, transactionId, transactions, fundSources);
    }

    /**
     * 取引削除権限の検証
     * 要件 4.3 に対応
     */
    canDeleteSharedTransaction(userId, transactionId) {
        const transactions = this.storage.getTransactions();
        const fundSources = this.storage.getFundSources();

        return this.permissionManager.canDeleteTransaction(userId, transactionId, transactions, fundSources);
    }

    /**
     * 資金元での取引作成権限の検証
     * 要件 4.1 に対応
     */
    canCreateTransactionInFundSource(userId, fundSourceId) {
        const fundSources = this.storage.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === fundSourceId);

        if (!fundSource) {
            return false;
        }

        // 所有者は常に作成可能
        if (fundSource.ownerId === userId) {
            return true;
        }

        // 共有ユーザーの場合は編集権限をチェック
        if (fundSource.isShared) {
            const userPermissions = this.permissionManager.getUserPermissions(userId, fundSourceId, fundSources);
            return userPermissions && userPermissions.canEdit;
        }

        return false;
    }

    /**
     * 共有状態の自動更新
     * 要件 4.1, 4.2, 4.3 に対応
     */
    updateSharedTransactionStatus(transactionId) {
        const transactions = this.storage.getTransactions();
        const transaction = transactions.find(t => t.id === transactionId);

        if (!transaction) {
            return false;
        }

        const fundSources = this.storage.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);

        if (!fundSource) {
            return false;
        }

        // 資金元の共有状態に基づいて取引の共有状態を更新
        const shouldBeShared = fundSource.isShared;

        if (transaction.isShared !== shouldBeShared) {
            transaction.isShared = shouldBeShared;
            transaction.updatedAt = new Date();

            this.storage.setTransactions(transactions);
            return true;
        }

        return false;
    }

    /**
     * 共有資金元の全取引の共有状態を一括更新
     * 要件 4.1 に対応
     */
    bulkUpdateSharedTransactionStatus(fundSourceId) {
        const transactions = this.storage.getTransactions();
        const fundSources = this.storage.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === fundSourceId);

        if (!fundSource) {
            throw new Error('指定された資金元が見つかりません');
        }

        let updatedCount = 0;
        const shouldBeShared = fundSource.isShared;

        transactions.forEach(transaction => {
            if (transaction.fundSourceId === fundSourceId && transaction.isShared !== shouldBeShared) {
                transaction.isShared = shouldBeShared;
                transaction.updatedAt = new Date();
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            this.storage.setTransactions(transactions);
        }

        return updatedCount;
    }

    /**
     * 共有取引の一覧取得（フィルタリング付き）
     * 要件 4.1, 4.2 に対応
     */
    getSharedTransactionsByFundSource(fundSourceId, userId = null) {
        const currentUser = userId || (window.authManager ? window.authManager.getCurrentUser()?.id : null);

        if (!currentUser) {
            return [];
        }

        // 資金元へのアクセス権限をチェック
        if (!this.canViewFundSource(fundSourceId)) {
            throw new Error('この資金元にアクセスする権限がありません');
        }

        const transactions = this.storage.getTransactions();
        return transactions.filter(transaction =>
            transaction.fundSourceId === fundSourceId &&
            transaction.isShared === true
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * ユーザーが編集可能な共有取引の一覧取得
     * 要件 4.2 に対応
     */
    getEditableSharedTransactions(userId = null) {
        const currentUser = userId || (window.authManager ? window.authManager.getCurrentUser()?.id : null);

        if (!currentUser) {
            return [];
        }

        const transactions = this.storage.getTransactions();
        const fundSources = this.storage.getFundSources();

        return transactions.filter(transaction => {
            if (!transaction.isShared) {
                return false;
            }

            return this.permissionManager.canEditTransaction(currentUser, transaction.id, transactions, fundSources);
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // ===== 共有データ検証機能 (Task 9.2) =====

    /**
     * 共有取引のデータ整合性チェック
     * 要件 7.3, 7.4 に対応
     */
    validateSharedTransactionIntegrity() {
        const issues = [];
        const transactions = this.storage.getTransactions();
        const fundSources = this.storage.getFundSources();
        const sharingUsers = this.storage.getSharingUsers();

        try {
            // 1. 共有フラグと資金元の共有状態の整合性チェック
            const flagMismatches = this.findSharedFlagMismatches(transactions, fundSources);
            if (flagMismatches.length > 0) {
                issues.push({
                    type: 'shared_flag_mismatch',
                    count: flagMismatches.length,
                    description: '取引の共有フラグと資金元の共有状態が一致しません',
                    items: flagMismatches
                });
            }

            // 2. 孤立した共有取引のチェック
            const orphanedSharedTransactions = this.findOrphanedSharedTransactions(transactions, fundSources);
            if (orphanedSharedTransactions.length > 0) {
                issues.push({
                    type: 'orphaned_shared_transactions',
                    count: orphanedSharedTransactions.length,
                    description: '共有されていない資金元に属する共有取引があります',
                    items: orphanedSharedTransactions
                });
            }

            // 3. 無効な作成者を持つ共有取引のチェック
            const invalidCreatorTransactions = this.findInvalidCreatorTransactions(transactions, sharingUsers);
            if (invalidCreatorTransactions.length > 0) {
                issues.push({
                    type: 'invalid_creator_transactions',
                    count: invalidCreatorTransactions.length,
                    description: '無効な作成者を持つ共有取引があります',
                    items: invalidCreatorTransactions
                });
            }

            // 4. 権限不整合のチェック
            const permissionIssues = this.findPermissionInconsistencies(transactions, fundSources, sharingUsers);
            if (permissionIssues.length > 0) {
                issues.push({
                    type: 'permission_inconsistencies',
                    count: permissionIssues.length,
                    description: '権限設定に不整合があります',
                    items: permissionIssues
                });
            }

        } catch (error) {
            console.error('Error during shared transaction integrity check:', error);
            issues.push({
                type: 'validation_error',
                description: '共有取引の整合性チェック中にエラーが発生しました',
                error: error.message
            });
        }

        return {
            hasIssues: issues.length > 0,
            issues: issues,
            checkedAt: new Date()
        };
    }

    /**
     * 共有フラグと資金元の共有状態の不整合を検出
     */
    findSharedFlagMismatches(transactions, fundSources) {
        const mismatches = [];

        transactions.forEach(transaction => {
            const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
            if (fundSource) {
                const shouldBeShared = fundSource.isShared;
                const isMarkedAsShared = transaction.isShared === true;

                if (shouldBeShared !== isMarkedAsShared) {
                    mismatches.push({
                        transactionId: transaction.id,
                        fundSourceId: fundSource.id,
                        fundSourceName: fundSource.name,
                        currentSharedFlag: isMarkedAsShared,
                        expectedSharedFlag: shouldBeShared,
                        date: transaction.date,
                        amount: transaction.amount
                    });
                }
            }
        });

        return mismatches;
    }

    /**
     * 孤立した共有取引を検出
     */
    findOrphanedSharedTransactions(transactions, fundSources) {
        const orphaned = [];

        transactions.forEach(transaction => {
            if (transaction.isShared) {
                const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
                if (!fundSource || !fundSource.isShared) {
                    orphaned.push({
                        transactionId: transaction.id,
                        fundSourceId: transaction.fundSourceId,
                        fundSourceExists: !!fundSource,
                        fundSourceShared: fundSource ? fundSource.isShared : false,
                        date: transaction.date,
                        amount: transaction.amount,
                        createdBy: transaction.createdBy
                    });
                }
            }
        });

        return orphaned;
    }

    /**
     * 無効な作成者を持つ共有取引を検出
     */
    findInvalidCreatorTransactions(transactions, sharingUsers) {
        const invalid = [];
        const validUserIds = new Set(sharingUsers.map(user => user.id));

        transactions.forEach(transaction => {
            if (transaction.isShared && transaction.createdBy) {
                if (!validUserIds.has(transaction.createdBy)) {
                    invalid.push({
                        transactionId: transaction.id,
                        createdBy: transaction.createdBy,
                        createdByUsername: transaction.createdByUsername,
                        date: transaction.date,
                        amount: transaction.amount,
                        fundSourceId: transaction.fundSourceId
                    });
                }
            }
        });

        return invalid;
    }

    /**
     * 権限設定の不整合を検出
     */
    findPermissionInconsistencies(transactions, fundSources, sharingUsers) {
        const inconsistencies = [];

        fundSources.forEach(fundSource => {
            if (fundSource.isShared && fundSource.sharedWith) {
                fundSource.sharedWith.forEach(sharedUser => {
                    const userId = typeof sharedUser === 'object' ? sharedUser.userId : sharedUser;
                    const userExists = sharingUsers.some(user => user.id === userId);

                    if (!userExists) {
                        inconsistencies.push({
                            type: 'missing_shared_user',
                            fundSourceId: fundSource.id,
                            fundSourceName: fundSource.name,
                            userId: userId,
                            description: '共有ユーザーが存在しません'
                        });
                    }
                });
            }
        });

        return inconsistencies;
    }

    /**
     * 孤立した共有データのクリーンアップ
     * 要件 7.3, 7.4 に対応
     */
    cleanupOrphanedSharingData() {
        const results = {
            cleanedTransactions: 0,
            cleanedFundSources: 0,
            cleanedUsers: 0,
            errors: []
        };

        try {
            // 1. 孤立した共有取引のクリーンアップ
            results.cleanedTransactions = this.cleanupOrphanedSharedTransactions();

            // 2. 無効な共有ユーザー参照のクリーンアップ
            results.cleanedFundSources = this.cleanupInvalidSharedUserReferences();

            // 3. 未使用の共有ユーザーのクリーンアップ
            results.cleanedUsers = this.cleanupUnusedSharedUsers();

        } catch (error) {
            console.error('Error during orphaned sharing data cleanup:', error);
            results.errors.push({
                type: 'cleanup_error',
                message: error.message
            });
        }

        return results;
    }

    /**
     * 孤立した共有取引のクリーンアップ
     */
    cleanupOrphanedSharedTransactions() {
        const transactions = this.storage.getTransactions();
        const fundSources = this.storage.getFundSources();
        let cleanedCount = 0;

        transactions.forEach(transaction => {
            if (transaction.isShared) {
                const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);

                // 資金元が存在しないか、共有されていない場合は共有フラグを削除
                if (!fundSource || !fundSource.isShared) {
                    transaction.isShared = false;
                    transaction.updatedAt = new Date();
                    cleanedCount++;
                }
            }
        });

        if (cleanedCount > 0) {
            this.storage.setTransactions(transactions);
        }

        return cleanedCount;
    }

    /**
     * 無効な共有ユーザー参照のクリーンアップ
     */
    cleanupInvalidSharedUserReferences() {
        const fundSources = this.storage.getFundSources();
        const sharingUsers = this.storage.getSharingUsers();
        const validUserIds = new Set(sharingUsers.map(user => user.id));
        let cleanedCount = 0;

        fundSources.forEach(fundSource => {
            if (fundSource.isShared && fundSource.sharedWith) {
                const originalLength = fundSource.sharedWith.length;

                fundSource.sharedWith = fundSource.sharedWith.filter(sharedUser => {
                    const userId = typeof sharedUser === 'object' ? sharedUser.userId : sharedUser;
                    return validUserIds.has(userId);
                });

                if (fundSource.sharedWith.length !== originalLength) {
                    cleanedCount++;
                    fundSource.updatedAt = new Date();

                    // 共有ユーザーがいなくなった場合は共有を無効化
                    if (fundSource.sharedWith.length === 0) {
                        fundSource.isShared = false;
                    }
                }
            }
        });

        if (cleanedCount > 0) {
            this.storage.setFundSources(fundSources);
        }

        return cleanedCount;
    }

    /**
     * 未使用の共有ユーザーのクリーンアップ
     */
    cleanupUnusedSharedUsers() {
        const sharingUsers = this.storage.getSharingUsers();
        const fundSources = this.storage.getFundSources();
        const usedUserIds = new Set();

        // 実際に使用されているユーザーIDを収集
        fundSources.forEach(fundSource => {
            if (fundSource.isShared && fundSource.sharedWith) {
                fundSource.sharedWith.forEach(sharedUser => {
                    const userId = typeof sharedUser === 'object' ? sharedUser.userId : sharedUser;
                    usedUserIds.add(userId);
                });
            }
        });

        const originalLength = sharingUsers.length;
        const activeUsers = sharingUsers.filter(user =>
            usedUserIds.has(user.id) || user.status === 'pending'
        );

        const cleanedCount = originalLength - activeUsers.length;

        if (cleanedCount > 0) {
            this.storage.setSharingUsers(activeUsers);
        }

        return cleanedCount;
    }

    /**
     * 共有関連エラーハンドリング - Enhanced with comprehensive error handler
     * 要件 7.4 に対応
     */
    handleSharingError(error, context = {}) {
        // Use the new comprehensive error handler if available
        if (window.SharingErrorHandler) {
            if (!this.sharingErrorHandler) {
                this.sharingErrorHandler = new SharingErrorHandler(this.storage);
            }
            return this.sharingErrorHandler.handleError(error, context);
        }

        // Fallback to original error handling
        const errorInfo = {
            timestamp: new Date(),
            message: error.message,
            context: context,
            type: this.categorizeSharingError(error)
        };

        // エラーログを記録
        this.logSharingError(errorInfo);

        // エラータイプに応じた処理
        switch (errorInfo.type) {
            case 'PERMISSION_DENIED':
                return this.handlePermissionError(errorInfo);

            case 'DATA_INTEGRITY':
                return this.handleDataIntegrityError(errorInfo);

            case 'VALIDATION_ERROR':
                return this.handleValidationError(errorInfo);

            case 'NETWORK_ERROR':
                return this.handleNetworkError(errorInfo);

            default:
                return this.handleGenericSharingError(errorInfo);
        }
    }

    /**
     * 共有エラーの分類
     */
    categorizeSharingError(error) {
        const message = error.message.toLowerCase();

        if (message.includes('権限') || message.includes('permission')) {
            return 'PERMISSION_DENIED';
        }

        if (message.includes('整合性') || message.includes('integrity') || message.includes('不整合')) {
            return 'DATA_INTEGRITY';
        }

        if (message.includes('validation') || message.includes('バリデーション') || message.includes('無効')) {
            return 'VALIDATION_ERROR';
        }

        if (message.includes('network') || message.includes('ネットワーク') || message.includes('接続')) {
            return 'NETWORK_ERROR';
        }

        return 'GENERIC_ERROR';
    }

    /**
     * 権限エラーの処理
     */
    handlePermissionError(errorInfo) {
        return {
            success: false,
            error: errorInfo,
            userMessage: 'この操作を実行する権限がありません。管理者にお問い合わせください。',
            suggestedAction: 'LOGIN_REQUIRED'
        };
    }

    /**
     * データ整合性エラーの処理
     */
    handleDataIntegrityError(errorInfo) {
        // 自動修復を試行
        try {
            const repairResult = this.cleanupOrphanedSharingData();
            return {
                success: true,
                error: errorInfo,
                userMessage: 'データの不整合を検出し、自動修復を実行しました。',
                repairResult: repairResult
            };
        } catch (repairError) {
            return {
                success: false,
                error: errorInfo,
                userMessage: 'データの不整合が検出されました。アプリを再起動してください。',
                suggestedAction: 'RESTART_REQUIRED'
            };
        }
    }

    /**
     * バリデーションエラーの処理
     */
    handleValidationError(errorInfo) {
        return {
            success: false,
            error: errorInfo,
            userMessage: '入力データに問題があります。内容を確認して再試行してください。',
            suggestedAction: 'USER_INPUT_REQUIRED'
        };
    }

    /**
     * ネットワークエラーの処理
     */
    handleNetworkError(errorInfo) {
        return {
            success: false,
            error: errorInfo,
            userMessage: 'ネットワーク接続に問題があります。接続を確認して再試行してください。',
            suggestedAction: 'RETRY_LATER'
        };
    }

    /**
     * 一般的な共有エラーの処理
     */
    handleGenericSharingError(errorInfo) {
        return {
            success: false,
            error: errorInfo,
            userMessage: '予期しないエラーが発生しました。しばらく待ってから再試行してください。',
            suggestedAction: 'RETRY_LATER'
        };
    }

    /**
     * 共有エラーのログ記録
     */
    logSharingError(errorInfo) {
        try {
            const errorLog = this.storage.getErrorLog() || [];
            errorLog.push(errorInfo);

            // ログサイズを制限（最新100件まで）
            if (errorLog.length > 100) {
                errorLog.splice(0, errorLog.length - 100);
            }

            this.storage.setErrorLog(errorLog);
        } catch (logError) {
            console.error('Failed to log sharing error:', logError);
        }
    }

    /**
     * 共有データの包括的な検証と修復
     * 要件 7.3, 7.4 に対応
     */
    validateAndRepairSharingData() {
        const results = {
            validationResults: null,
            repairResults: null,
            success: false,
            errors: []
        };

        try {
            // 1. データ整合性チェック
            results.validationResults = this.validateSharedTransactionIntegrity();

            // 2. 問題が見つかった場合は修復を実行
            if (results.validationResults.hasIssues) {
                results.repairResults = this.cleanupOrphanedSharingData();
            }

            // 3. 修復後に再度チェック
            const postRepairValidation = this.validateSharedTransactionIntegrity();
            results.success = !postRepairValidation.hasIssues;

            return results;

        } catch (error) {
            console.error('Error during sharing data validation and repair:', error);
            results.errors.push({
                type: 'validation_repair_error',
                message: error.message
            });
            return results;
        }
    }

    // Performance Optimization Methods

    // Optimized transaction retrieval with caching
    getTransactionsOptimized(filters = null, useCache = true) {
        return this.dataOptimizer ?
            this.dataOptimizer.getTransactions(filters, useCache) :
            this.getTransactions(filters ? true : false);
    }

    // Get performance metrics
    getPerformanceMetrics() {
        return {
            cache: this.cache ? this.cache.getStats() : null,
            dataOptimizer: this.dataOptimizer ? this.dataOptimizer.getCacheStats() : null,
            uiOptimizer: this.uiOptimizer ? this.uiOptimizer.getPerformanceMetrics() : null,
            filterCache: {
                size: this.optimizedFilterState.cachedResults.size,
                lastApplied: this.optimizedFilterState.lastApplied
            }
        };
    }

    // Clear performance caches
    clearPerformanceCache() {
        if (this.cache) {
            this.cache.clear();
        }
        if (this.dataOptimizer) {
            this.dataOptimizer.clearCache();
        }
        if (this.uiOptimizer) {
            this.uiOptimizer.clearPending();
        }

        // Clear filter cache
        this.optimizedFilterState.cachedResults.clear();
        this.optimizedFilterState.filterHash = null;
        this.optimizedFilterState.lastApplied = null;
    }
}

// Create global instance when storage is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for storage to be initialized
    if (window.storage) {
        // Ensure permission manager is available
        if (!window.permissionManager) {
            window.permissionManager = new PermissionManager();
        }
        window.dataManager = new DataManager(window.storage);
    } else {
        // Retry after a short delay
        setTimeout(() => {
            if (!window.permissionManager) {
                window.permissionManager = new PermissionManager();
            }
            window.dataManager = new DataManager(window.storage);
        }, 100);
    }
});