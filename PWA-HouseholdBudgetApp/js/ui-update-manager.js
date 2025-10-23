// UI Update Manager - Centralized UI update system
class UIUpdateManager {
    constructor() {
        this.updateQueue = [];
        this.isUpdating = false;
        this.updateCallbacks = new Map();
        this.debounceTimers = new Map();
        
        // Initialize update system
        this.initialize();
    }

    initialize() {
        console.log('UIUpdateManager initialized');
        
        // Set up global event listeners for data changes
        this.setupDataChangeListeners();
        
        // Set up periodic cleanup
        setInterval(() => {
            this.cleanupCompletedUpdates();
        }, 30000); // Every 30 seconds
    }

    // Setup listeners for data changes
    setupDataChangeListeners() {
        // Listen for storage events (if multiple tabs)
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('budget_')) {
                this.scheduleFullUpdate('storage_change');
            }
        });

        // Listen for custom data change events
        document.addEventListener('dataChanged', (e) => {
            this.handleDataChange(e.detail);
        });
    }

    // Register update callback for specific data types
    registerUpdateCallback(dataType, callback) {
        if (!this.updateCallbacks.has(dataType)) {
            this.updateCallbacks.set(dataType, []);
        }
        this.updateCallbacks.get(dataType).push(callback);
    }

    // Handle data changes
    handleDataChange(changeInfo) {
        const { type, action, data } = changeInfo;
        
        console.log(`Data change detected: ${type} ${action}`, data);
        
        // Schedule appropriate updates based on data type
        switch (type) {
            case 'transaction':
                this.scheduleUpdate('transactions', 'high');
                this.scheduleUpdate('fundSources', 'medium'); // Balance might change
                this.scheduleUpdate('charts', 'low');
                break;
                
            case 'fundSource':
                this.scheduleUpdate('fundSources', 'high');
                this.scheduleUpdate('selects', 'high');
                this.scheduleUpdate('transactions', 'medium'); // Sharing status might change
                break;
                
            case 'category':
            case 'subcategory':
                this.scheduleUpdate('selects', 'high');
                this.scheduleUpdate('transactions', 'medium');
                break;
                
            case 'sharing':
                this.scheduleUpdate('fundSources', 'high');
                this.scheduleUpdate('transactions', 'high');
                this.scheduleUpdate('sharing', 'high');
                break;
                
            case 'all':
            case 'auth_change':
                this.scheduleFullUpdate(action || 'auth_change');
                break;
                
            default:
                this.scheduleFullUpdate('unknown_change');
        }
    }

    // Schedule a specific update
    scheduleUpdate(updateType, priority = 'medium') {
        const update = {
            type: updateType,
            priority: priority,
            timestamp: Date.now(),
            id: this.generateUpdateId()
        };

        // Remove existing updates of the same type to avoid duplicates
        this.updateQueue = this.updateQueue.filter(u => u.type !== updateType);
        
        // Add new update
        this.updateQueue.push(update);
        
        // Sort by priority
        this.sortUpdateQueue();
        
        // Process updates
        this.processUpdateQueue();
    }

    // Schedule full UI update
    scheduleFullUpdate(reason = 'manual') {
        console.log(`Scheduling full UI update: ${reason}`);
        
        // Clear existing queue
        this.updateQueue = [];
        
        // Add all update types
        const updateTypes = ['transactions', 'fundSources', 'selects', 'charts', 'sharing'];
        updateTypes.forEach(type => {
            this.updateQueue.push({
                type: type,
                priority: 'high',
                timestamp: Date.now(),
                id: this.generateUpdateId()
            });
        });
        
        this.processUpdateQueue();
    }

    // Sort update queue by priority
    sortUpdateQueue() {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        
        this.updateQueue.sort((a, b) => {
            const aPriority = priorityOrder[a.priority] || 1;
            const bPriority = priorityOrder[b.priority] || 1;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }
            
            return a.timestamp - b.timestamp; // Older first for same priority
        });
    }

    // Process update queue
    async processUpdateQueue() {
        if (this.isUpdating || this.updateQueue.length === 0) {
            return;
        }

        this.isUpdating = true;

        try {
            // Process updates in batches to avoid blocking UI
            const batchSize = 3;
            
            while (this.updateQueue.length > 0) {
                const batch = this.updateQueue.splice(0, batchSize);
                
                // Process batch
                await this.processBatch(batch);
                
                // Small delay between batches to keep UI responsive
                if (this.updateQueue.length > 0) {
                    await this.delay(10);
                }
            }
            
        } catch (error) {
            console.error('Error processing update queue:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    // Process a batch of updates
    async processBatch(batch) {
        const promises = batch.map(update => this.executeUpdate(update));
        
        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.error('Error in batch processing:', error);
        }
    }

    // Execute a single update
    async executeUpdate(update) {
        try {
            console.log(`Executing update: ${update.type}`);
            
            switch (update.type) {
                case 'transactions':
                    await this.updateTransactions();
                    break;
                    
                case 'fundSources':
                    await this.updateFundSources();
                    break;
                    
                case 'selects':
                    await this.updateSelects();
                    break;
                    
                case 'charts':
                    await this.updateCharts();
                    break;
                    
                case 'sharing':
                    await this.updateSharing();
                    break;
                    
                default:
                    console.warn(`Unknown update type: ${update.type}`);
            }
            
            // Execute registered callbacks
            const callbacks = this.updateCallbacks.get(update.type) || [];
            for (const callback of callbacks) {
                try {
                    await callback();
                } catch (error) {
                    console.error(`Error in update callback for ${update.type}:`, error);
                }
            }
            
        } catch (error) {
            console.error(`Error executing update ${update.type}:`, error);
        }
    }

    // Update methods
    async updateTransactions() {
        if (window.uiManager && window.uiManager.renderer) {
            window.uiManager.renderer.renderTransactions();
        }
        
        // Update calendar if visible
        if (window.uiManager && window.uiManager.currentTransactionView === 'calendar' && window.calendarManager) {
            window.calendarManager.renderCalendar();
        }
    }

    async updateFundSources() {
        if (window.uiManager && window.uiManager.renderer) {
            window.uiManager.renderer.renderFundSources();
        }
    }

    async updateSelects() {
        if (window.uiManager && window.uiManager.renderer) {
            window.uiManager.renderer.populateSelects();
        }
    }

    async updateCharts() {
        if (window.chartManager && window.uiManager && window.uiManager.currentView === 'charts') {
            window.chartManager.renderCategoryChart();
        }
    }

    async updateSharing() {
        if (window.uiSharing) {
            window.uiSharing.updateSharingIndicators();
        }
    }

    // Debounced update - useful for rapid changes
    debouncedUpdate(updateType, delay = 300) {
        const timerId = this.debounceTimers.get(updateType);
        
        if (timerId) {
            clearTimeout(timerId);
        }
        
        const newTimerId = setTimeout(() => {
            this.scheduleUpdate(updateType, 'medium');
            this.debounceTimers.delete(updateType);
        }, delay);
        
        this.debounceTimers.set(updateType, newTimerId);
    }

    // Immediate update - for critical changes
    immediateUpdate(updateType) {
        this.scheduleUpdate(updateType, 'high');
    }

    // Force refresh all UI components
    forceRefresh() {
        console.log('Force refreshing all UI components');
        this.scheduleFullUpdate('force_refresh');
    }

    // Utility methods
    generateUpdateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    cleanupCompletedUpdates() {
        // Clear old debounce timers
        const now = Date.now();
        for (const [key, timerId] of this.debounceTimers.entries()) {
            if (now - timerId > 60000) { // 1 minute old
                clearTimeout(timerId);
                this.debounceTimers.delete(key);
            }
        }
    }

    // Public API methods
    notifyDataChange(type, action, data = null) {
        const event = new CustomEvent('dataChanged', {
            detail: { type, action, data }
        });
        document.dispatchEvent(event);
    }

    // Get update queue status
    getStatus() {
        return {
            isUpdating: this.isUpdating,
            queueLength: this.updateQueue.length,
            registeredCallbacks: Array.from(this.updateCallbacks.keys())
        };
    }
}

// Export for global use
window.UIUpdateManager = UIUpdateManager;