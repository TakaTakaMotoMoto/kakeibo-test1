// Performance Cache Manager for Sharing System
class PerformanceCache {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
        this.maxCacheSize = 100; // Maximum number of cached items
        
        // Performance metrics
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalRequests: 0
        };
        
        // Auto-cleanup expired entries every minute
        setInterval(() => this.cleanupExpired(), 60000);
    }

    // Get cached data
    get(key) {
        this.metrics.totalRequests++;
        
        if (!this.cache.has(key)) {
            this.metrics.misses++;
            return null;
        }

        const expiry = this.cacheExpiry.get(key);
        if (expiry && Date.now() > expiry) {
            this.delete(key);
            this.metrics.misses++;
            return null;
        }

        this.metrics.hits++;
        return this.cache.get(key);
    }

    // Set cached data
    set(key, value, ttl = this.defaultTTL) {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            this.evictOldest();
        }

        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + ttl);
    }

    // Delete cached data
    delete(key) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
    }

    // Clear all cache
    clear() {
        this.cache.clear();
        this.cacheExpiry.clear();
    }

    // Evict oldest entry
    evictOldest() {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
            this.delete(firstKey);
            this.metrics.evictions++;
        }
    }

    // Clean up expired entries
    cleanupExpired() {
        const now = Date.now();
        const expiredKeys = [];

        for (const [key, expiry] of this.cacheExpiry.entries()) {
            if (expiry && now > expiry) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.delete(key));
    }

    // Get cache statistics
    getStats() {
        const hitRate = this.metrics.totalRequests > 0 
            ? (this.metrics.hits / this.metrics.totalRequests * 100).toFixed(2)
            : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: `${hitRate}%`,
            ...this.metrics
        };
    }

    // Invalidate cache entries by pattern
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern);
        const keysToDelete = [];

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.delete(key));
        return keysToDelete.length;
    }

    // Preload frequently accessed data
    preload(key, dataLoader, ttl = this.defaultTTL) {
        if (!this.cache.has(key)) {
            try {
                const data = dataLoader();
                this.set(key, data, ttl);
                return data;
            } catch (error) {
                console.error(`Error preloading cache key ${key}:`, error);
                return null;
            }
        }
        return this.get(key);
    }
}

// Data Access Optimizer for Sharing System
class DataAccessOptimizer {
    constructor(storage, cache) {
        this.storage = storage;
        this.cache = cache || new PerformanceCache();
        this.batchOperations = [];
        this.batchTimeout = null;
        this.batchDelay = 100; // 100ms batch delay
    }

    // Optimized fund source retrieval with caching
    getFundSources(useCache = true) {
        const cacheKey = 'fundSources';
        
        if (useCache) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const fundSources = this.storage.getFundSources();
        
        if (useCache) {
            this.cache.set(cacheKey, fundSources, 2 * 60 * 1000); // 2 minutes TTL
        }
        
        return fundSources;
    }

    // Optimized sharing data retrieval with caching
    getSharingData(useCache = true) {
        const cacheKey = 'sharingData';
        
        if (useCache) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const sharingData = {
            invitations: this.storage.getInvitations ? this.storage.getInvitations() : [],
            sharingSettings: this.storage.getSharingSettings ? this.storage.getSharingSettings() : [],
            sharedUsers: this.storage.getSharedUsers ? this.storage.getSharedUsers() : []
        };
        
        if (useCache) {
            this.cache.set(cacheKey, sharingData, 1 * 60 * 1000); // 1 minute TTL for sharing data
        }
        
        return sharingData;
    }

    // Optimized shared fund sources retrieval
    getSharedFundSources(userId, useCache = true) {
        const cacheKey = `sharedFundSources_${userId}`;
        
        if (useCache) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const fundSources = this.getFundSources(useCache);
        const sharedFundSources = fundSources.filter(fs => 
            fs.isShared && 
            fs.sharedWith && 
            fs.sharedWith.some(user => user.userId === userId)
        );
        
        if (useCache) {
            this.cache.set(cacheKey, sharedFundSources, 2 * 60 * 1000); // 2 minutes TTL
        }
        
        return sharedFundSources;
    }

    // Optimized invitation retrieval with filtering
    getInvitations(status = null, userId = null, useCache = true) {
        const cacheKey = `invitations_${status || 'all'}_${userId || 'all'}`;
        
        if (useCache) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const sharingData = this.getSharingData(useCache);
        let invitations = sharingData.invitations;
        
        // Apply filters efficiently
        if (status) {
            invitations = invitations.filter(inv => inv.status === status);
        }
        
        if (userId) {
            invitations = invitations.filter(inv => 
                inv.inviterUserId === userId || inv.inviteeEmail === userId
            );
        }
        
        if (useCache) {
            this.cache.set(cacheKey, invitations, 30 * 1000); // 30 seconds TTL for filtered data
        }
        
        return invitations;
    }

    // Optimized transaction retrieval with caching and filtering
    getTransactions(filters = null, useCache = true) {
        const cacheKey = filters ? `transactions_${JSON.stringify(filters)}` : 'transactions';
        
        if (useCache) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        let transactions = this.storage.getTransactions();
        
        // Apply filters efficiently
        if (filters) {
            transactions = this.applyFiltersOptimized(transactions, filters);
        }

        if (useCache) {
            const ttl = filters ? 1 * 60 * 1000 : 3 * 60 * 1000; // Shorter TTL for filtered data
            this.cache.set(cacheKey, transactions, ttl);
        }
        
        return transactions;
    }

    // Optimized filter application
    applyFiltersOptimized(transactions, filters) {
        // Use early returns and efficient filtering
        return transactions.filter(transaction => {
            // Date filters (most selective first)
            if (filters.startDate && new Date(transaction.date) < new Date(filters.startDate)) {
                return false;
            }
            if (filters.endDate && new Date(transaction.date) > new Date(filters.endDate)) {
                return false;
            }
            
            // ID-based filters (fast lookups)
            if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
                return false;
            }
            if (filters.fundSourceId && transaction.fundSourceId !== filters.fundSourceId) {
                return false;
            }
            if (filters.createdBy && transaction.createdBy !== filters.createdBy) {
                return false;
            }
            
            // Boolean filters
            if (filters.showOnlyShared && !transaction.isShared) {
                return false;
            }
            if (filters.showOnlyOwn && transaction.createdBy !== filters.currentUserId) {
                return false;
            }
            
            return true;
        });
    }

    // Batch data operations
    batchOperation(operation) {
        this.batchOperations.push(operation);
        
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        this.batchTimeout = setTimeout(() => {
            this.executeBatch();
        }, this.batchDelay);
    }

    // Execute batched operations
    executeBatch() {
        if (this.batchOperations.length === 0) return;

        const operations = [...this.batchOperations];
        this.batchOperations = [];
        this.batchTimeout = null;

        try {
            // Group operations by type for efficiency
            const groupedOps = this.groupOperationsByType(operations);
            
            // Execute grouped operations
            for (const [type, ops] of Object.entries(groupedOps)) {
                this.executeGroupedOperations(type, ops);
            }
            
            // Invalidate relevant cache entries
            this.invalidateRelevantCache(operations);
            
        } catch (error) {
            console.error('Error executing batch operations:', error);
        }
    }

    // Group operations by type
    groupOperationsByType(operations) {
        const grouped = {};
        
        operations.forEach(op => {
            if (!grouped[op.type]) {
                grouped[op.type] = [];
            }
            grouped[op.type].push(op);
        });
        
        return grouped;
    }

    // Execute grouped operations
    executeGroupedOperations(type, operations) {
        switch (type) {
            case 'updateFundSource':
                this.batchUpdateFundSources(operations);
                break;
            case 'updateTransaction':
                this.batchUpdateTransactions(operations);
                break;
            case 'invalidateCache':
                operations.forEach(op => this.cache.delete(op.key));
                break;
            default:
                // Execute individual operations
                operations.forEach(op => op.execute());
        }
    }

    // Batch update fund sources
    batchUpdateFundSources(operations) {
        const fundSources = this.getFundSources(false); // Don't use cache for updates
        let updated = false;
        const updatedIds = new Set();
        
        operations.forEach(op => {
            const index = fundSources.findIndex(fs => fs.id === op.id);
            if (index !== -1) {
                Object.assign(fundSources[index], op.updates);
                fundSources[index].updatedAt = new Date();
                updatedIds.add(op.id);
                updated = true;
            }
        });
        
        if (updated) {
            this.storage.setFundSources(fundSources);
            
            // Invalidate related caches efficiently
            this.invalidateRelatedCaches('fundSources', Array.from(updatedIds));
        }
    }

    // Enhanced cache invalidation with granular control
    invalidateRelatedCaches(dataType, affectedIds = []) {
        switch (dataType) {
            case 'fundSources':
                this.cache.invalidatePattern('fundSources');
                this.cache.invalidatePattern('sharedFundSources.*');
                
                // Invalidate specific user caches if we know which fund sources changed
                if (affectedIds.length > 0) {
                    affectedIds.forEach(id => {
                        this.cache.invalidatePattern(`.*_${id}`);
                    });
                }
                break;
                
            case 'transactions':
                this.cache.invalidatePattern('transactions.*');
                this.cache.invalidatePattern('recentTransactions');
                this.cache.invalidatePattern('recentSharedTransactions');
                break;
                
            case 'sharing':
                this.cache.invalidatePattern('sharingData');
                this.cache.invalidatePattern('invitations.*');
                this.cache.invalidatePattern('sharedFundSources.*');
                break;
        }
    }

    // Optimized data synchronization with minimal cache invalidation
    syncDataChanges(changeType, data) {
        switch (changeType) {
            case 'fundSourceSharing':
                // Only invalidate specific sharing-related caches
                this.cache.delete('sharingData');
                this.cache.invalidatePattern(`sharedFundSources_.*`);
                break;
                
            case 'invitationStatus':
                // Only invalidate invitation caches
                this.cache.invalidatePattern('invitations.*');
                break;
                
            case 'transactionSharing':
                // Only invalidate transaction and sharing caches
                this.cache.invalidatePattern('transactions.*');
                this.cache.delete('recentSharedTransactions');
                break;
        }
    }

    // Batch update transactions
    batchUpdateTransactions(operations) {
        const transactions = this.getTransactions(null, false); // Don't use cache for updates
        let updated = false;
        
        operations.forEach(op => {
            const index = transactions.findIndex(t => t.id === op.id);
            if (index !== -1) {
                Object.assign(transactions[index], op.updates);
                transactions[index].updatedAt = new Date();
                updated = true;
            }
        });
        
        if (updated) {
            this.storage.setTransactions(transactions);
        }
    }

    // Invalidate relevant cache entries
    invalidateRelevantCache(operations) {
        const patterns = new Set();
        
        operations.forEach(op => {
            switch (op.type) {
                case 'updateFundSource':
                case 'addFundSource':
                case 'deleteFundSource':
                    patterns.add('fundSources');
                    patterns.add('transactions.*'); // Transactions might be affected
                    break;
                case 'updateTransaction':
                case 'addTransaction':
                case 'deleteTransaction':
                    patterns.add('transactions.*');
                    break;
                case 'updateSharing':
                    patterns.add('fundSources');
                    patterns.add('transactions.*');
                    patterns.add('sharing.*');
                    break;
            }
        });
        
        patterns.forEach(pattern => {
            this.cache.invalidatePattern(pattern);
        });
    }

    // Preload commonly accessed data
    preloadCommonData() {
        // Preload fund sources
        this.cache.preload('fundSources', () => this.storage.getFundSources());
        
        // Preload recent transactions
        this.cache.preload('transactions', () => this.storage.getTransactions());
        
        // Preload categories and subcategories
        this.cache.preload('categories', () => this.storage.getCategories());
        this.cache.preload('subcategories', () => this.storage.getSubcategories());
        
        // Preload sharing-related data
        this.cache.preload('sharingData', () => this.getSharingData(false));
        
        // Preload current user's shared fund sources if logged in
        if (window.authManager && window.authManager.getCurrentUser()) {
            const currentUser = window.authManager.getCurrentUser();
            this.cache.preload(`sharedFundSources_${currentUser.id}`, 
                () => this.getSharedFundSources(currentUser.id, false));
        }
    }

    // Intelligent cache warming based on usage patterns
    warmCache() {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        if (!currentUser) return;
        
        // Warm frequently accessed data
        setTimeout(() => {
            // Preload user's invitations
            this.getInvitations('pending', currentUser.id, false);
            this.getInvitations('accepted', currentUser.id, false);
            
            // Preload recent transactions with sharing info
            const recentTransactions = this.getTransactions(null, false)
                .slice(0, 50); // Last 50 transactions
            
            // Cache filtered views that are commonly used
            this.cache.set('recentTransactions', recentTransactions, 5 * 60 * 1000);
            
            // Preload shared transactions
            const sharedTransactions = recentTransactions.filter(t => t.isShared);
            this.cache.set('recentSharedTransactions', sharedTransactions, 3 * 60 * 1000);
            
        }, 1000); // Delay to avoid blocking initial load
    }

    // Get cache statistics
    getCacheStats() {
        return this.cache.getStats();
    }

    // Clear all caches
    clearCache() {
        this.cache.clear();
    }

    // Memory management - clean up unused caches
    performMemoryCleanup() {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        // Remove caches for users who are no longer logged in
        if (!currentUser) {
            this.cache.invalidatePattern('sharedFundSources_.*');
            this.cache.invalidatePattern('invitations_.*_(?!all).*');
        }
        
        // Clean up expired entries
        this.cache.cleanupExpired();
        
        // If cache is getting too large, clear least recently used items
        const stats = this.cache.getStats();
        if (stats.size > this.cache.maxCacheSize * 0.8) {
            console.log('Cache approaching limit, performing cleanup...');
            this.cache.evictOldest();
        }
    }

    // Performance monitoring
    getPerformanceMetrics() {
        const cacheStats = this.cache.getStats();
        const batchStats = {
            pendingOperations: this.batchOperations.length,
            batchDelay: this.batchDelay
        };
        
        return {
            cache: cacheStats,
            batch: batchStats,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    // Estimate memory usage of cached data
    estimateMemoryUsage() {
        let totalSize = 0;
        
        for (const [key, value] of this.cache.cache.entries()) {
            try {
                const serialized = JSON.stringify(value);
                totalSize += serialized.length * 2; // Rough estimate (UTF-16)
            } catch (error) {
                // Skip items that can't be serialized
            }
        }
        
        return {
            estimatedBytes: totalSize,
            estimatedKB: Math.round(totalSize / 1024),
            estimatedMB: Math.round(totalSize / (1024 * 1024))
        };
    }
}

// UI Responsiveness Optimizer
class UIResponsivenessOptimizer {
    constructor() {
        this.pendingUpdates = new Map();
        this.updateQueue = [];
        this.isProcessing = false;
        this.frameId = null;
        
        // Debounce timers
        this.debounceTimers = new Map();
        
        // Performance monitoring
        this.performanceMetrics = {
            averageFrameTime: 0,
            frameCount: 0,
            slowFrames: 0
        };
    }

    // Debounced UI update
    debounceUpdate(key, updateFunction, delay = 300) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            updateFunction();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }

    // Queue UI update for next animation frame
    queueUpdate(updateFunction, priority = 'normal') {
        const update = {
            function: updateFunction,
            priority: priority,
            timestamp: Date.now()
        };
        
        // Insert based on priority
        if (priority === 'high') {
            this.updateQueue.unshift(update);
        } else {
            this.updateQueue.push(update);
        }
        
        this.scheduleProcessing();
    }

    // Schedule update processing
    scheduleProcessing() {
        if (this.isProcessing || this.frameId) return;
        
        this.frameId = requestAnimationFrame(() => {
            this.processUpdates();
        });
    }

    // Process queued updates
    processUpdates() {
        const startTime = performance.now();
        const maxFrameTime = 16; // Target 60fps (16ms per frame)
        
        this.isProcessing = true;
        this.frameId = null;
        
        while (this.updateQueue.length > 0 && (performance.now() - startTime) < maxFrameTime) {
            const update = this.updateQueue.shift();
            
            try {
                update.function();
            } catch (error) {
                console.error('Error processing UI update:', error);
            }
        }
        
        const frameTime = performance.now() - startTime;
        this.updatePerformanceMetrics(frameTime);
        
        this.isProcessing = false;
        
        // If there are more updates, schedule next frame
        if (this.updateQueue.length > 0) {
            this.scheduleProcessing();
        }
    }

    // Update performance metrics
    updatePerformanceMetrics(frameTime) {
        this.performanceMetrics.frameCount++;
        
        // Update average frame time
        const alpha = 0.1; // Smoothing factor
        this.performanceMetrics.averageFrameTime = 
            (1 - alpha) * this.performanceMetrics.averageFrameTime + alpha * frameTime;
        
        // Count slow frames (>16ms)
        if (frameTime > 16) {
            this.performanceMetrics.slowFrames++;
        }
    }

    // Throttle function execution
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Virtual scrolling helper for large lists
    createVirtualScroller(container, itemHeight, renderItem) {
        let scrollTop = 0;
        let containerHeight = container.clientHeight;
        let totalItems = 0;
        let isScrolling = false;
        
        const updateVisibleItems = this.throttle(() => {
            const startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(
                startIndex + Math.ceil(containerHeight / itemHeight) + 2, // Extra buffer
                totalItems
            );
            
            this.queueUpdate(() => {
                renderItem(startIndex, endIndex);
            }, 'high');
        }, 16);
        
        // Optimized scroll handling with momentum detection
        let scrollTimeout;
        container.addEventListener('scroll', (e) => {
            scrollTop = e.target.scrollTop;
            
            if (!isScrolling) {
                isScrolling = true;
                // Reduce update frequency during fast scrolling
                updateVisibleItems();
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                updateVisibleItems(); // Final update when scrolling stops
            }, 150);
        });
        
        window.addEventListener('resize', this.throttle(() => {
            containerHeight = container.clientHeight;
            updateVisibleItems();
        }, 100));
        
        return {
            setTotalItems: (count) => {
                totalItems = count;
                updateVisibleItems();
            },
            refresh: updateVisibleItems,
            destroy: () => {
                clearTimeout(scrollTimeout);
            }
        };
    }

    // Progressive loading for sharing data
    createProgressiveLoader(loadFunction, batchSize = 20) {
        let currentBatch = 0;
        let isLoading = false;
        let allData = [];
        
        const loadNextBatch = () => {
            if (isLoading) return Promise.resolve([]);
            
            isLoading = true;
            
            return new Promise((resolve) => {
                this.queueUpdate(() => {
                    try {
                        const startIndex = currentBatch * batchSize;
                        const endIndex = startIndex + batchSize;
                        const batchData = loadFunction(startIndex, endIndex);
                        
                        allData = allData.concat(batchData);
                        currentBatch++;
                        isLoading = false;
                        
                        resolve(batchData);
                    } catch (error) {
                        console.error('Error in progressive loading:', error);
                        isLoading = false;
                        resolve([]);
                    }
                });
            });
        };
        
        return {
            loadNext: loadNextBatch,
            getAllLoaded: () => allData,
            reset: () => {
                currentBatch = 0;
                allData = [];
                isLoading = false;
            },
            hasMore: (totalCount) => currentBatch * batchSize < totalCount
        };
    }

    // Optimistic UI updates for sharing operations
    createOptimisticUpdater() {
        const pendingUpdates = new Map();
        
        return {
            // Apply optimistic update immediately
            applyOptimistic: (key, updateFunction, rollbackFunction) => {
                const originalState = updateFunction();
                pendingUpdates.set(key, {
                    rollback: rollbackFunction,
                    timestamp: Date.now()
                });
                
                return originalState;
            },
            
            // Confirm the update (remove from pending)
            confirm: (key) => {
                pendingUpdates.delete(key);
            },
            
            // Rollback the update
            rollback: (key) => {
                const update = pendingUpdates.get(key);
                if (update) {
                    update.rollback();
                    pendingUpdates.delete(key);
                }
            },
            
            // Auto-rollback old pending updates
            cleanup: () => {
                const now = Date.now();
                const timeout = 30000; // 30 seconds
                
                for (const [key, update] of pendingUpdates.entries()) {
                    if (now - update.timestamp > timeout) {
                        update.rollback();
                        pendingUpdates.delete(key);
                    }
                }
            }
        };
    }

    // Lazy loading helper
    createLazyLoader(threshold = 0.1) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const loadFunction = element.dataset.lazyLoad;
                    
                    if (loadFunction && window[loadFunction]) {
                        this.queueUpdate(() => {
                            window[loadFunction](element);
                        });
                    }
                    
                    observer.unobserve(element);
                }
            });
        }, { threshold });
        
        return {
            observe: (element) => observer.observe(element),
            unobserve: (element) => observer.unobserve(element),
            disconnect: () => observer.disconnect()
        };
    }

    // Get performance metrics
    getPerformanceMetrics() {
        const slowFramePercentage = this.performanceMetrics.frameCount > 0
            ? (this.performanceMetrics.slowFrames / this.performanceMetrics.frameCount * 100).toFixed(2)
            : 0;
            
        return {
            ...this.performanceMetrics,
            slowFramePercentage: `${slowFramePercentage}%`,
            queueLength: this.updateQueue.length,
            pendingDebounces: this.debounceTimers.size
        };
    }

    // Clear all pending operations
    clearPending() {
        this.updateQueue = [];
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        
        this.isProcessing = false;
    }

    // Smart batching for UI updates
    createSmartBatcher(batchFunction, options = {}) {
        const {
            maxBatchSize = 10,
            maxWaitTime = 100,
            priority = 'normal'
        } = options;
        
        let batch = [];
        let batchTimer = null;
        
        const processBatch = () => {
            if (batch.length === 0) return;
            
            const currentBatch = [...batch];
            batch = [];
            batchTimer = null;
            
            this.queueUpdate(() => {
                batchFunction(currentBatch);
            }, priority);
        };
        
        return (item) => {
            batch.push(item);
            
            // Process immediately if batch is full
            if (batch.length >= maxBatchSize) {
                if (batchTimer) {
                    clearTimeout(batchTimer);
                    batchTimer = null;
                }
                processBatch();
                return;
            }
            
            // Set timer for batch processing if not already set
            if (!batchTimer) {
                batchTimer = setTimeout(processBatch, maxWaitTime);
            }
        };
    }

    // Adaptive performance monitoring
    createPerformanceMonitor() {
        let frameTimings = [];
        let lastFrameTime = performance.now();
        
        const monitor = {
            startFrame: () => {
                lastFrameTime = performance.now();
            },
            
            endFrame: () => {
                const frameTime = performance.now() - lastFrameTime;
                frameTimings.push(frameTime);
                
                // Keep only last 60 frames
                if (frameTimings.length > 60) {
                    frameTimings.shift();
                }
                
                // Adjust batch sizes based on performance
                this.adaptBatchSizes(frameTime);
            },
            
            getAverageFrameTime: () => {
                if (frameTimings.length === 0) return 0;
                return frameTimings.reduce((sum, time) => sum + time, 0) / frameTimings.length;
            },
            
            getPerformanceGrade: () => {
                const avgFrameTime = monitor.getAverageFrameTime();
                if (avgFrameTime < 8) return 'excellent';
                if (avgFrameTime < 16) return 'good';
                if (avgFrameTime < 32) return 'fair';
                return 'poor';
            }
        };
        
        return monitor;
    }

    // Adaptive batch size adjustment based on performance
    adaptBatchSizes(frameTime) {
        if (frameTime > 32) { // Slow frame
            // Reduce batch sizes to improve responsiveness
            this.batchDelay = Math.min(this.batchDelay + 10, 200);
        } else if (frameTime < 8) { // Fast frame
            // Increase batch sizes for better efficiency
            this.batchDelay = Math.max(this.batchDelay - 5, 50);
        }
    }

    // Intersection observer for lazy loading sharing components
    createSharingComponentObserver() {
        const observedElements = new WeakMap();
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                const config = observedElements.get(element);
                
                if (entry.isIntersecting && config) {
                    this.queueUpdate(() => {
                        config.loadFunction(element);
                    }, 'low');
                    
                    observer.unobserve(element);
                    observedElements.delete(element);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        return {
            observe: (element, loadFunction) => {
                observedElements.set(element, { loadFunction });
                observer.observe(element);
            },
            
            unobserve: (element) => {
                observer.unobserve(element);
                observedElements.delete(element);
            },
            
            disconnect: () => {
                observer.disconnect();
                observedElements.clear();
            }
        };
    }

    // Memory-efficient event delegation for sharing UI
    createEventDelegator(container) {
        const handlers = new Map();
        
        const delegateHandler = (event) => {
            let target = event.target;
            
            // Bubble up to find matching selectors
            while (target && target !== container) {
                for (const [selector, handler] of handlers.entries()) {
                    if (target.matches && target.matches(selector)) {
                        this.queueUpdate(() => {
                            handler(event, target);
                        }, 'high');
                        return;
                    }
                }
                target = target.parentElement;
            }
        };
        
        container.addEventListener('click', delegateHandler);
        container.addEventListener('change', delegateHandler);
        
        return {
            on: (selector, handler) => {
                handlers.set(selector, handler);
            },
            
            off: (selector) => {
                handlers.delete(selector);
            },
            
            destroy: () => {
                container.removeEventListener('click', delegateHandler);
                container.removeEventListener('change', delegateHandler);
                handlers.clear();
            }
        };
    }
}

// Export classes for global use
window.PerformanceCache = PerformanceCache;
window.DataAccessOptimizer = DataAccessOptimizer;
window.UIResponsivenessOptimizer = UIResponsivenessOptimizer;