// UI Responsiveness Enhancer for Sharing System
// Task 12.2: UI応答性の向上

class UIResponsivenessEnhancer {
    constructor() {
        this.progressIndicators = new Map();
        this.optimisticUpdates = new Map();
        this.asyncOperations = new Map();
        this.loadingStates = new Map();
        
        // Performance monitoring
        this.performanceTracker = new PerformanceTracker();
        
        // Initialize enhanced UI patterns
        this.initializeProgressSystem();
        this.initializeOptimisticUI();
        this.initializeAsyncOptimizations();
    }

    // Initialize progress indication system
    initializeProgressSystem() {
        this.progressSystem = {
            // Create progress indicator
            create: (id, options = {}) => {
                const config = {
                    type: options.type || 'spinner', // 'spinner', 'bar', 'dots'
                    message: options.message || '処理中...',
                    cancellable: options.cancellable || false,
                    position: options.position || 'center',
                    overlay: options.overlay !== false,
                    ...options
                };

                const indicator = this.createProgressIndicator(id, config);
                this.progressIndicators.set(id, indicator);
                return indicator;
            },

            // Update progress
            update: (id, progress, message) => {
                const indicator = this.progressIndicators.get(id);
                if (indicator) {
                    indicator.update(progress, message);
                }
            },

            // Complete progress
            complete: (id, message) => {
                const indicator = this.progressIndicators.get(id);
                if (indicator) {
                    indicator.complete(message);
                    setTimeout(() => {
                        this.progressSystem.remove(id);
                    }, 1000);
                }
            },

            // Remove progress indicator
            remove: (id) => {
                const indicator = this.progressIndicators.get(id);
                if (indicator) {
                    indicator.remove();
                    this.progressIndicators.delete(id);
                }
            },

            // Show error state
            error: (id, message) => {
                const indicator = this.progressIndicators.get(id);
                if (indicator) {
                    indicator.error(message);
                    setTimeout(() => {
                        this.progressSystem.remove(id);
                    }, 3000);
                }
            }
        };
    }

    // Create progress indicator element
    createProgressIndicator(id, config) {
        const container = document.createElement('div');
        container.className = `progress-indicator ${config.type}`;
        container.id = `progress-${id}`;
        
        if (config.overlay) {
            container.classList.add('with-overlay');
        }

        let progressElement;
        let messageElement;

        // Create different types of progress indicators
        switch (config.type) {
            case 'bar':
                progressElement = this.createProgressBar();
                break;
            case 'dots':
                progressElement = this.createProgressDots();
                break;
            case 'spinner':
            default:
                progressElement = this.createProgressSpinner();
                break;
        }

        messageElement = document.createElement('div');
        messageElement.className = 'progress-message';
        messageElement.textContent = config.message;

        container.appendChild(progressElement);
        container.appendChild(messageElement);

        // Add cancel button if cancellable
        if (config.cancellable) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'progress-cancel-btn';
            cancelBtn.textContent = 'キャンセル';
            cancelBtn.onclick = () => {
                if (config.onCancel) {
                    config.onCancel();
                }
                this.progressSystem.remove(id);
            };
            container.appendChild(cancelBtn);
        }

        // Position the indicator
        this.positionProgressIndicator(container, config.position);

        // Add to DOM
        document.body.appendChild(container);

        // Animate in
        requestAnimationFrame(() => {
            container.classList.add('visible');
        });

        return {
            element: container,
            update: (progress, message) => {
                if (config.type === 'bar' && typeof progress === 'number') {
                    const bar = progressElement.querySelector('.progress-bar-fill');
                    if (bar) {
                        bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
                    }
                }
                if (message) {
                    messageElement.textContent = message;
                }
            },
            complete: (message) => {
                container.classList.add('complete');
                if (message) {
                    messageElement.textContent = message;
                }
                progressElement.innerHTML = '<div class="success-icon">✓</div>';
            },
            error: (message) => {
                container.classList.add('error');
                if (message) {
                    messageElement.textContent = message;
                }
                progressElement.innerHTML = '<div class="error-icon">✗</div>';
            },
            remove: () => {
                container.classList.add('removing');
                setTimeout(() => {
                    if (container.parentNode) {
                        container.parentNode.removeChild(container);
                    }
                }, 300);
            }
        };
    }

    // Create progress bar
    createProgressBar() {
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        bar.innerHTML = '<div class="progress-bar-fill"></div>';
        return bar;
    }

    // Create progress spinner
    createProgressSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'progress-spinner';
        spinner.innerHTML = '<div class="spinner-ring"></div>';
        return spinner;
    }

    // Create progress dots
    createProgressDots() {
        const dots = document.createElement('div');
        dots.className = 'progress-dots';
        dots.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        return dots;
    }

    // Position progress indicator
    positionProgressIndicator(element, position) {
        switch (position) {
            case 'top':
                element.style.top = '20px';
                element.style.left = '50%';
                element.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                element.style.bottom = '20px';
                element.style.left = '50%';
                element.style.transform = 'translateX(-50%)';
                break;
            case 'center':
            default:
                element.style.top = '50%';
                element.style.left = '50%';
                element.style.transform = 'translate(-50%, -50%)';
                break;
        }
        element.style.position = 'fixed';
        element.style.zIndex = '10000';
    }

    // Initialize optimistic UI system
    initializeOptimisticUI() {
        this.optimisticUI = {
            // Apply optimistic update
            apply: (key, updateFunction, rollbackFunction, options = {}) => {
                const config = {
                    timeout: options.timeout || 30000,
                    showProgress: options.showProgress !== false,
                    progressMessage: options.progressMessage || '更新中...',
                    ...options
                };

                // Store rollback info
                this.optimisticUpdates.set(key, {
                    rollback: rollbackFunction,
                    timestamp: Date.now(),
                    timeout: config.timeout
                });

                // Apply optimistic update
                const result = updateFunction();

                // Show progress if requested
                if (config.showProgress) {
                    this.progressSystem.create(`optimistic-${key}`, {
                        type: 'spinner',
                        message: config.progressMessage,
                        overlay: false,
                        position: 'top'
                    });
                }

                // Set timeout for auto-rollback
                setTimeout(() => {
                    if (this.optimisticUpdates.has(key)) {
                        this.optimisticUI.rollback(key, '操作がタイムアウトしました');
                    }
                }, config.timeout);

                return result;
            },

            // Confirm optimistic update
            confirm: (key, successMessage) => {
                if (this.optimisticUpdates.has(key)) {
                    this.optimisticUpdates.delete(key);
                    
                    // Complete progress indicator
                    this.progressSystem.complete(`optimistic-${key}`, successMessage || '完了しました');
                }
            },

            // Rollback optimistic update
            rollback: (key, errorMessage) => {
                const update = this.optimisticUpdates.get(key);
                if (update) {
                    try {
                        update.rollback();
                        this.optimisticUpdates.delete(key);
                        
                        // Show error in progress indicator
                        this.progressSystem.error(`optimistic-${key}`, errorMessage || '操作を取り消しました');
                        
                        // Show notification
                        if (window.UIUtils) {
                            window.UIUtils.showNotification(errorMessage || '操作を取り消しました', 'warning');
                        }
                    } catch (error) {
                        console.error('Error during rollback:', error);
                    }
                }
            },

            // Cleanup old optimistic updates
            cleanup: () => {
                const now = Date.now();
                for (const [key, update] of this.optimisticUpdates.entries()) {
                    if (now - update.timestamp > update.timeout) {
                        this.optimisticUI.rollback(key, '操作がタイムアウトしました');
                    }
                }
            }
        };

        // Periodic cleanup
        setInterval(() => {
            this.optimisticUI.cleanup();
        }, 10000);
    }

    // Initialize async operation optimizations
    initializeAsyncOptimizations() {
        this.asyncOptimizer = {
            // Execute async operation with enhanced UX
            execute: async (operation, options = {}) => {
                const config = {
                    showProgress: options.showProgress !== false,
                    progressType: options.progressType || 'spinner',
                    progressMessage: options.progressMessage || '処理中...',
                    minDuration: options.minDuration || 500, // Minimum duration to show progress
                    timeout: options.timeout || 30000,
                    retries: options.retries || 0,
                    retryDelay: options.retryDelay || 1000,
                    ...options
                };

                const operationId = this.generateOperationId();
                const startTime = Date.now();

                try {
                    // Show progress indicator
                    if (config.showProgress) {
                        this.progressSystem.create(operationId, {
                            type: config.progressType,
                            message: config.progressMessage,
                            cancellable: config.cancellable,
                            onCancel: config.onCancel
                        });
                    }

                    // Track operation
                    this.asyncOperations.set(operationId, {
                        startTime,
                        config,
                        status: 'running'
                    });

                    // Execute operation with timeout
                    const result = await this.executeWithTimeout(operation, config.timeout);

                    // Ensure minimum duration for better UX
                    const elapsed = Date.now() - startTime;
                    if (elapsed < config.minDuration) {
                        await this.delay(config.minDuration - elapsed);
                    }

                    // Complete progress
                    if (config.showProgress) {
                        this.progressSystem.complete(operationId, config.successMessage || '完了しました');
                    }

                    // Update operation status
                    const opInfo = this.asyncOperations.get(operationId);
                    if (opInfo) {
                        opInfo.status = 'completed';
                        opInfo.result = result;
                    }

                    return result;

                } catch (error) {
                    // Handle retries
                    if (config.retries > 0) {
                        console.log(`Retrying operation (${config.retries} attempts left)...`);
                        
                        // Update progress message
                        if (config.showProgress) {
                            this.progressSystem.update(operationId, null, '再試行中...');
                        }

                        await this.delay(config.retryDelay);
                        
                        return this.asyncOptimizer.execute(operation, {
                            ...config,
                            retries: config.retries - 1
                        });
                    }

                    // Show error
                    if (config.showProgress) {
                        this.progressSystem.error(operationId, config.errorMessage || 'エラーが発生しました');
                    }

                    // Update operation status
                    const opInfo = this.asyncOperations.get(operationId);
                    if (opInfo) {
                        opInfo.status = 'failed';
                        opInfo.error = error;
                    }

                    throw error;

                } finally {
                    // Cleanup after delay
                    setTimeout(() => {
                        this.asyncOperations.delete(operationId);
                    }, 5000);
                }
            },

            // Execute multiple operations in parallel with progress
            executeParallel: async (operations, options = {}) => {
                const config = {
                    showProgress: options.showProgress !== false,
                    progressMessage: options.progressMessage || '並列処理中...',
                    maxConcurrency: options.maxConcurrency || 3,
                    ...options
                };

                const operationId = this.generateOperationId();
                let completed = 0;
                const total = operations.length;

                try {
                    // Show progress bar
                    if (config.showProgress) {
                        this.progressSystem.create(operationId, {
                            type: 'bar',
                            message: config.progressMessage
                        });
                    }

                    // Execute operations with concurrency limit
                    const results = await this.executeWithConcurrencyLimit(
                        operations,
                        config.maxConcurrency,
                        (result, index) => {
                            completed++;
                            const progress = (completed / total) * 100;
                            
                            if (config.showProgress) {
                                this.progressSystem.update(
                                    operationId,
                                    progress,
                                    `${completed}/${total} 完了`
                                );
                            }
                        }
                    );

                    // Complete progress
                    if (config.showProgress) {
                        this.progressSystem.complete(operationId, 'すべて完了しました');
                    }

                    return results;

                } catch (error) {
                    if (config.showProgress) {
                        this.progressSystem.error(operationId, '一部の処理でエラーが発生しました');
                    }
                    throw error;
                }
            },

            // Get operation status
            getStatus: (operationId) => {
                return this.asyncOperations.get(operationId);
            },

            // Cancel operation
            cancel: (operationId) => {
                const operation = this.asyncOperations.get(operationId);
                if (operation) {
                    operation.status = 'cancelled';
                    this.progressSystem.remove(operationId);
                }
            }
        };
    }

    // Execute operation with timeout
    executeWithTimeout(operation, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('操作がタイムアウトしました'));
            }, timeout);

            Promise.resolve(operation())
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    // Execute operations with concurrency limit
    async executeWithConcurrencyLimit(operations, maxConcurrency, onProgress) {
        const results = new Array(operations.length);
        const executing = [];

        for (let i = 0; i < operations.length; i++) {
            const operation = operations[i];
            
            const promise = Promise.resolve(operation())
                .then(result => {
                    results[i] = result;
                    if (onProgress) {
                        onProgress(result, i);
                    }
                    return result;
                });

            executing.push(promise);

            if (executing.length >= maxConcurrency) {
                await Promise.race(executing);
                executing.splice(executing.findIndex(p => p === promise), 1);
            }
        }

        await Promise.all(executing);
        return results;
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Generate unique operation ID
    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Enhanced sharing operation wrappers
    createSharingOperationWrappers() {
        return {
            // Share fund source with enhanced UX
            shareFundSource: async (fundSourceId, userEmails, permissions) => {
                const originalFundSources = window.storage.getFundSources();
                const fundSource = originalFundSources.find(fs => fs.id === fundSourceId);
                
                if (!fundSource) {
                    throw new Error('資金元が見つかりません');
                }

                // Optimistic update
                const optimisticKey = `share_${fundSourceId}`;
                
                this.optimisticUI.apply(
                    optimisticKey,
                    () => {
                        // Apply optimistic sharing state
                        fundSource.isShared = true;
                        fundSource.sharedWith = fundSource.sharedWith || [];
                        
                        // Add placeholder users
                        userEmails.forEach(email => {
                            if (!fundSource.sharedWith.some(u => u.email === email)) {
                                fundSource.sharedWith.push({
                                    userId: 'pending',
                                    email: email,
                                    username: email.split('@')[0],
                                    permissions: permissions,
                                    status: 'pending'
                                });
                            }
                        });

                        // Update UI immediately
                        if (window.uiManager) {
                            window.uiManager.renderFundSources();
                        }

                        return fundSource;
                    },
                    () => {
                        // Rollback function
                        const currentFundSources = window.storage.getFundSources();
                        const index = currentFundSources.findIndex(fs => fs.id === fundSourceId);
                        if (index !== -1) {
                            currentFundSources[index] = originalFundSources.find(fs => fs.id === fundSourceId);
                            window.storage.setFundSources(currentFundSources);
                            
                            if (window.uiManager) {
                                window.uiManager.renderFundSources();
                            }
                        }
                    },
                    {
                        progressMessage: '資金元を共有中...',
                        timeout: 15000
                    }
                );

                try {
                    // Execute actual sharing operation
                    const result = await this.asyncOptimizer.execute(
                        () => window.sharingManager.shareFundSource(fundSourceId, userEmails, permissions),
                        {
                            progressMessage: '招待を送信中...',
                            successMessage: '共有設定が完了しました',
                            errorMessage: '共有設定に失敗しました'
                        }
                    );

                    // Confirm optimistic update
                    this.optimisticUI.confirm(optimisticKey, '共有設定が完了しました');

                    return result;

                } catch (error) {
                    // Rollback optimistic update
                    this.optimisticUI.rollback(optimisticKey, error.message);
                    throw error;
                }
            },

            // Send invitation with enhanced UX
            sendInvitation: async (fundSourceId, userEmail, permissions) => {
                return this.asyncOptimizer.execute(
                    () => window.sharingManager.sendInvitation(fundSourceId, userEmail, permissions),
                    {
                        progressMessage: '招待を送信中...',
                        successMessage: '招待を送信しました',
                        errorMessage: '招待の送信に失敗しました',
                        minDuration: 800
                    }
                );
            },

            // Accept invitation with enhanced UX
            acceptInvitation: async (invitationToken) => {
                const optimisticKey = `accept_${invitationToken}`;

                // Get invitation details first
                const invitationDetails = window.sharingManager.getInvitationDetails(invitationToken);
                if (!invitationDetails.valid) {
                    throw new Error(invitationDetails.error);
                }

                // Optimistic update
                this.optimisticUI.apply(
                    optimisticKey,
                    () => {
                        // Add fund source to UI optimistically
                        const fundSources = window.storage.getFundSources();
                        const existingIndex = fundSources.findIndex(fs => fs.id === invitationDetails.fundSource.id);
                        
                        if (existingIndex === -1) {
                            fundSources.push({
                                ...invitationDetails.fundSource,
                                isShared: true,
                                status: 'accepting'
                            });
                            window.storage.setFundSources(fundSources);
                        }

                        if (window.uiManager) {
                            window.uiManager.renderFundSources();
                        }

                        return true;
                    },
                    () => {
                        // Rollback - remove the optimistically added fund source
                        const fundSources = window.storage.getFundSources();
                        const index = fundSources.findIndex(fs => fs.id === invitationDetails.fundSource.id && fs.status === 'accepting');
                        if (index !== -1) {
                            fundSources.splice(index, 1);
                            window.storage.setFundSources(fundSources);
                            
                            if (window.uiManager) {
                                window.uiManager.renderFundSources();
                            }
                        }
                    },
                    {
                        progressMessage: '招待を受諾中...',
                        timeout: 10000
                    }
                );

                try {
                    const result = await this.asyncOptimizer.execute(
                        () => window.sharingManager.acceptInvitation(invitationToken),
                        {
                            progressMessage: '共有設定を更新中...',
                            successMessage: '招待を受諾しました',
                            errorMessage: '招待の受諾に失敗しました'
                        }
                    );

                    this.optimisticUI.confirm(optimisticKey, '招待を受諾しました');
                    return result;

                } catch (error) {
                    this.optimisticUI.rollback(optimisticKey, error.message);
                    throw error;
                }
            },

            // Batch operations with progress
            batchOperations: async (operations) => {
                return this.asyncOptimizer.executeParallel(
                    operations,
                    {
                        progressMessage: '複数の操作を実行中...',
                        maxConcurrency: 2
                    }
                );
            }
        };
    }

    // Get performance metrics
    getPerformanceMetrics() {
        return {
            progressIndicators: this.progressIndicators.size,
            optimisticUpdates: this.optimisticUpdates.size,
            asyncOperations: this.asyncOperations.size,
            performanceTracker: this.performanceTracker.getMetrics()
        };
    }

    // Cleanup resources
    cleanup() {
        // Clear all progress indicators
        for (const [id, indicator] of this.progressIndicators.entries()) {
            indicator.remove();
        }
        this.progressIndicators.clear();

        // Rollback all optimistic updates
        for (const [key] of this.optimisticUpdates.entries()) {
            this.optimisticUI.rollback(key, 'クリーンアップによる取り消し');
        }

        // Cancel all async operations
        for (const [id] of this.asyncOperations.entries()) {
            this.asyncOptimizer.cancel(id);
        }
    }
}

// Performance Tracker for monitoring UI responsiveness
class PerformanceTracker {
    constructor() {
        this.metrics = {
            operationTimes: [],
            frameDrops: 0,
            memoryUsage: [],
            lastUpdate: Date.now()
        };
        
        this.startMonitoring();
    }

    startMonitoring() {
        // Monitor frame rate
        let lastFrameTime = performance.now();
        const monitorFrame = (currentTime) => {
            const frameDuration = currentTime - lastFrameTime;
            
            if (frameDuration > 16.67) { // Dropped frame (60fps = 16.67ms)
                this.metrics.frameDrops++;
            }
            
            lastFrameTime = currentTime;
            requestAnimationFrame(monitorFrame);
        };
        
        requestAnimationFrame(monitorFrame);

        // Monitor memory usage periodically
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memoryUsage.push({
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    timestamp: Date.now()
                });
                
                // Keep only last 100 measurements
                if (this.metrics.memoryUsage.length > 100) {
                    this.metrics.memoryUsage.shift();
                }
            }, 5000);
        }
    }

    recordOperation(name, duration) {
        this.metrics.operationTimes.push({
            name,
            duration,
            timestamp: Date.now()
        });
        
        // Keep only last 1000 operations
        if (this.metrics.operationTimes.length > 1000) {
            this.metrics.operationTimes.shift();
        }
    }

    getMetrics() {
        const now = Date.now();
        const timeSinceLastUpdate = now - this.metrics.lastUpdate;
        
        return {
            ...this.metrics,
            frameDropRate: this.metrics.frameDrops / (timeSinceLastUpdate / 1000),
            averageOperationTime: this.getAverageOperationTime(),
            memoryTrend: this.getMemoryTrend()
        };
    }

    getAverageOperationTime() {
        if (this.metrics.operationTimes.length === 0) return 0;
        
        const total = this.metrics.operationTimes.reduce((sum, op) => sum + op.duration, 0);
        return total / this.metrics.operationTimes.length;
    }

    getMemoryTrend() {
        if (this.metrics.memoryUsage.length < 2) return 'stable';
        
        const recent = this.metrics.memoryUsage.slice(-10);
        const first = recent[0].used;
        const last = recent[recent.length - 1].used;
        
        const change = ((last - first) / first) * 100;
        
        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }
}

// Export for global use
window.UIResponsivenessEnhancer = UIResponsivenessEnhancer;
window.PerformanceTracker = PerformanceTracker;