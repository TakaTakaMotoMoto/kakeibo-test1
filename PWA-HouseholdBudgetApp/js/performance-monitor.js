// Performance Monitoring and Optimization Manager
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: null,
            sharingOperations: [],
            cacheHitRates: [],
            memoryUsage: [],
            uiResponsiveness: []
        };
        
        this.thresholds = {
            slowOperation: 1000, // 1 second
            slowFrame: 16, // 16ms for 60fps
            highMemoryUsage: 50 * 1024 * 1024, // 50MB
            lowCacheHitRate: 0.7 // 70%
        };
        
        this.optimizations = {
            cacheEnabled: true,
            batchingEnabled: true,
            virtualScrollingEnabled: true,
            lazyLoadingEnabled: true
        };
        
        this.startMonitoring();
    }

    // Start performance monitoring
    startMonitoring() {
        // Monitor page load performance
        this.monitorPageLoad();
        
        // Monitor sharing operations
        this.monitorSharingOperations();
        
        // Monitor memory usage periodically
        setInterval(() => {
            this.recordMemoryUsage();
        }, 30000); // Every 30 seconds
        
        // Monitor cache performance
        setInterval(() => {
            this.recordCachePerformance();
        }, 60000); // Every minute
        
        // Monitor UI responsiveness
        this.monitorUIResponsiveness();
    }

    // Monitor page load performance
    monitorPageLoad() {
        if (performance.timing) {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            
            this.metrics.pageLoad = {
                totalTime: loadTime,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstPaint: this.getFirstPaintTime(),
                timestamp: Date.now()
            };
        }
    }

    // Get first paint time
    getFirstPaintTime() {
        if (performance.getEntriesByType) {
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            return firstPaint ? firstPaint.startTime : null;
        }
        return null;
    }

    // Monitor sharing operations performance
    monitorSharingOperations() {
        // Wrap sharing manager methods to monitor performance
        if (window.sharingManager) {
            this.wrapMethod(window.sharingManager, 'shareFundSource', 'shareFundSource');
            this.wrapMethod(window.sharingManager, 'sendInvitation', 'sendInvitation');
            this.wrapMethod(window.sharingManager, 'acceptInvitation', 'acceptInvitation');
            this.wrapMethod(window.sharingManager, 'updateUserPermissions', 'updateUserPermissions');
        }
    }

    // Wrap method to monitor performance
    wrapMethod(object, methodName, operationName) {
        const originalMethod = object[methodName];
        
        object[methodName] = (...args) => {
            const startTime = performance.now();
            
            try {
                const result = originalMethod.apply(object, args);
                
                // Handle both sync and async results
                if (result && typeof result.then === 'function') {
                    return result.then(
                        (value) => {
                            this.recordOperation(operationName, performance.now() - startTime, true);
                            return value;
                        },
                        (error) => {
                            this.recordOperation(operationName, performance.now() - startTime, false, error);
                            throw error;
                        }
                    );
                } else {
                    this.recordOperation(operationName, performance.now() - startTime, true);
                    return result;
                }
            } catch (error) {
                this.recordOperation(operationName, performance.now() - startTime, false, error);
                throw error;
            }
        };
    }

    // Record operation performance
    recordOperation(operationName, duration, success, error = null) {
        const record = {
            operation: operationName,
            duration: duration,
            success: success,
            error: error ? error.message : null,
            timestamp: Date.now()
        };
        
        this.metrics.sharingOperations.push(record);
        
        // Keep only last 100 operations
        if (this.metrics.sharingOperations.length > 100) {
            this.metrics.sharingOperations.shift();
        }
        
        // Check for slow operations
        if (duration > this.thresholds.slowOperation) {
            console.warn(`Slow sharing operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
            this.suggestOptimizations(operationName, duration);
        }
    }

    // Monitor memory usage
    recordMemoryUsage() {
        if (performance.memory) {
            const memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
            };
            
            this.metrics.memoryUsage.push(memory);
            
            // Keep only last 50 records
            if (this.metrics.memoryUsage.length > 50) {
                this.metrics.memoryUsage.shift();
            }
            
            // Check for high memory usage
            if (memory.used > this.thresholds.highMemoryUsage) {
                console.warn(`High memory usage detected: ${(memory.used / 1024 / 1024).toFixed(2)}MB`);
                this.suggestMemoryOptimizations();
            }
        }
    }

    // Monitor cache performance
    recordCachePerformance() {
        if (window.dataManager && window.dataManager.cache) {
            const stats = window.dataManager.cache.getStats();
            const hitRate = stats.totalRequests > 0 ? stats.hits / stats.totalRequests : 0;
            
            const record = {
                hitRate: hitRate,
                hits: stats.hits,
                misses: stats.misses,
                size: stats.size,
                timestamp: Date.now()
            };
            
            this.metrics.cacheHitRates.push(record);
            
            // Keep only last 50 records
            if (this.metrics.cacheHitRates.length > 50) {
                this.metrics.cacheHitRates.shift();
            }
            
            // Check for low cache hit rate
            if (hitRate < this.thresholds.lowCacheHitRate && stats.totalRequests > 10) {
                console.warn(`Low cache hit rate detected: ${(hitRate * 100).toFixed(1)}%`);
                this.suggestCacheOptimizations();
            }
        }
    }

    // Monitor UI responsiveness
    monitorUIResponsiveness() {
        let frameCount = 0;
        let slowFrames = 0;
        let lastTime = performance.now();
        
        const checkFrame = () => {
            const currentTime = performance.now();
            const frameTime = currentTime - lastTime;
            
            frameCount++;
            if (frameTime > this.thresholds.slowFrame) {
                slowFrames++;
            }
            
            // Record metrics every 60 frames (approximately 1 second at 60fps)
            if (frameCount >= 60) {
                const responsiveness = {
                    averageFrameTime: frameTime,
                    slowFramePercentage: (slowFrames / frameCount) * 100,
                    timestamp: Date.now()
                };
                
                this.metrics.uiResponsiveness.push(responsiveness);
                
                // Keep only last 50 records
                if (this.metrics.uiResponsiveness.length > 50) {
                    this.metrics.uiResponsiveness.shift();
                }
                
                // Reset counters
                frameCount = 0;
                slowFrames = 0;
            }
            
            lastTime = currentTime;
            requestAnimationFrame(checkFrame);
        };
        
        requestAnimationFrame(checkFrame);
    }

    // Suggest optimizations based on performance data
    suggestOptimizations(operationName, duration) {
        const suggestions = [];
        
        switch (operationName) {
            case 'shareFundSource':
                if (duration > 2000) {
                    suggestions.push('Consider enabling batch operations for multiple fund source sharing');
                    suggestions.push('Enable caching for fund source data');
                }
                break;
                
            case 'sendInvitation':
                if (duration > 1500) {
                    suggestions.push('Consider batching multiple invitations');
                    suggestions.push('Enable optimistic UI updates for invitation sending');
                }
                break;
                
            case 'acceptInvitation':
                if (duration > 1000) {
                    suggestions.push('Preload invitation data to reduce processing time');
                    suggestions.push('Enable progressive loading for invitation acceptance');
                }
                break;
        }
        
        if (suggestions.length > 0) {
            console.log(`Performance suggestions for ${operationName}:`, suggestions);
        }
    }

    // Suggest memory optimizations
    suggestMemoryOptimizations() {
        const suggestions = [
            'Clear unused caches periodically',
            'Reduce cache TTL for less frequently accessed data',
            'Enable virtual scrolling for large lists',
            'Implement lazy loading for sharing components'
        ];
        
        console.log('Memory optimization suggestions:', suggestions);
        
        // Auto-apply some optimizations
        if (window.dataManager && window.dataManager.cache) {
            window.dataManager.cache.cleanupExpired();
        }
    }

    // Suggest cache optimizations
    suggestCacheOptimizations() {
        const suggestions = [
            'Increase cache TTL for stable data',
            'Preload frequently accessed sharing data',
            'Implement smarter cache invalidation strategies',
            'Add more granular caching for filtered data'
        ];
        
        console.log('Cache optimization suggestions:', suggestions);
    }

    // Get performance report
    getPerformanceReport() {
        const report = {
            summary: this.getPerformanceSummary(),
            pageLoad: this.metrics.pageLoad,
            recentOperations: this.metrics.sharingOperations.slice(-10),
            memoryTrend: this.getMemoryTrend(),
            cacheTrend: this.getCacheTrend(),
            uiResponsiveness: this.getUIResponsivenessSummary(),
            optimizations: this.optimizations,
            recommendations: this.getRecommendations()
        };
        
        return report;
    }

    // Get performance summary
    getPerformanceSummary() {
        const recentOps = this.metrics.sharingOperations.slice(-20);
        const avgDuration = recentOps.length > 0 
            ? recentOps.reduce((sum, op) => sum + op.duration, 0) / recentOps.length 
            : 0;
        
        const successRate = recentOps.length > 0
            ? recentOps.filter(op => op.success).length / recentOps.length
            : 1;
        
        return {
            averageOperationTime: Math.round(avgDuration),
            operationSuccessRate: Math.round(successRate * 100),
            totalOperations: this.metrics.sharingOperations.length,
            performanceGrade: this.getPerformanceGrade()
        };
    }

    // Get memory trend
    getMemoryTrend() {
        const recent = this.metrics.memoryUsage.slice(-10);
        if (recent.length < 2) return 'stable';
        
        const first = recent[0].used;
        const last = recent[recent.length - 1].used;
        const change = ((last - first) / first) * 100;
        
        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }

    // Get cache trend
    getCacheTrend() {
        const recent = this.metrics.cacheHitRates.slice(-10);
        if (recent.length < 2) return 'stable';
        
        const avgRecent = recent.slice(-5).reduce((sum, r) => sum + r.hitRate, 0) / 5;
        const avgOlder = recent.slice(0, 5).reduce((sum, r) => sum + r.hitRate, 0) / 5;
        
        if (avgRecent > avgOlder + 0.1) return 'improving';
        if (avgRecent < avgOlder - 0.1) return 'declining';
        return 'stable';
    }

    // Get UI responsiveness summary
    getUIResponsivenessSummary() {
        const recent = this.metrics.uiResponsiveness.slice(-10);
        if (recent.length === 0) return { grade: 'unknown', avgFrameTime: 0 };
        
        const avgFrameTime = recent.reduce((sum, r) => sum + r.averageFrameTime, 0) / recent.length;
        const avgSlowFrames = recent.reduce((sum, r) => sum + r.slowFramePercentage, 0) / recent.length;
        
        let grade = 'excellent';
        if (avgFrameTime > 16 || avgSlowFrames > 10) grade = 'good';
        if (avgFrameTime > 32 || avgSlowFrames > 25) grade = 'fair';
        if (avgFrameTime > 50 || avgSlowFrames > 50) grade = 'poor';
        
        return {
            grade: grade,
            avgFrameTime: Math.round(avgFrameTime),
            slowFramePercentage: Math.round(avgSlowFrames)
        };
    }

    // Get overall performance grade
    getPerformanceGrade() {
        const summary = this.getPerformanceSummary();
        const uiSummary = this.getUIResponsivenessSummary();
        
        let score = 100;
        
        // Deduct points for slow operations
        if (summary.averageOperationTime > 1000) score -= 20;
        else if (summary.averageOperationTime > 500) score -= 10;
        
        // Deduct points for low success rate
        if (summary.operationSuccessRate < 90) score -= 20;
        else if (summary.operationSuccessRate < 95) score -= 10;
        
        // Deduct points for poor UI responsiveness
        if (uiSummary.grade === 'poor') score -= 30;
        else if (uiSummary.grade === 'fair') score -= 15;
        else if (uiSummary.grade === 'good') score -= 5;
        
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'fair';
        return 'poor';
    }

    // Get recommendations
    getRecommendations() {
        const recommendations = [];
        const summary = this.getPerformanceSummary();
        const uiSummary = this.getUIResponsivenessSummary();
        
        if (summary.averageOperationTime > 1000) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: 'Sharing operations are slow. Consider enabling batch processing and caching.'
            });
        }
        
        if (summary.operationSuccessRate < 95) {
            recommendations.push({
                type: 'reliability',
                priority: 'high',
                message: 'Some sharing operations are failing. Check error handling and network conditions.'
            });
        }
        
        if (uiSummary.grade === 'poor' || uiSummary.grade === 'fair') {
            recommendations.push({
                type: 'ui',
                priority: 'medium',
                message: 'UI responsiveness is poor. Enable virtual scrolling and reduce DOM updates.'
            });
        }
        
        const memoryTrend = this.getMemoryTrend();
        if (memoryTrend === 'increasing') {
            recommendations.push({
                type: 'memory',
                priority: 'medium',
                message: 'Memory usage is increasing. Clear unused caches and optimize data structures.'
            });
        }
        
        const cacheTrend = this.getCacheTrend();
        if (cacheTrend === 'declining') {
            recommendations.push({
                type: 'cache',
                priority: 'low',
                message: 'Cache hit rate is declining. Review cache strategies and TTL settings.'
            });
        }
        
        return recommendations;
    }

    // Enable/disable optimizations
    toggleOptimization(name, enabled) {
        if (this.optimizations.hasOwnProperty(name)) {
            this.optimizations[name] = enabled;
            console.log(`${name} optimization ${enabled ? 'enabled' : 'disabled'}`);
            
            // Apply the optimization change
            this.applyOptimizationChange(name, enabled);
        }
    }

    // Apply optimization changes
    applyOptimizationChange(name, enabled) {
        switch (name) {
            case 'cacheEnabled':
                if (window.dataManager && window.dataManager.cache) {
                    if (!enabled) {
                        window.dataManager.cache.clear();
                    }
                }
                break;
                
            case 'batchingEnabled':
                if (window.dataManager && window.dataManager.dataOptimizer) {
                    window.dataManager.dataOptimizer.batchDelay = enabled ? 100 : 0;
                }
                break;
                
            case 'virtualScrollingEnabled':
                // This would be applied when creating new scrollable lists
                console.log(`Virtual scrolling ${enabled ? 'enabled' : 'disabled'} for new lists`);
                break;
                
            case 'lazyLoadingEnabled':
                // This would be applied when creating new lazy-loaded components
                console.log(`Lazy loading ${enabled ? 'enabled' : 'disabled'} for new components`);
                break;
        }
    }

    // Export performance data
    exportPerformanceData() {
        return {
            metrics: this.metrics,
            report: this.getPerformanceReport(),
            exportedAt: new Date().toISOString()
        };
    }
}

// Initialize performance monitor
window.PerformanceMonitor = PerformanceMonitor;

// Auto-initialize if not in test environment
if (typeof window !== 'undefined' && !window.isTestEnvironment) {
    window.performanceMonitor = new PerformanceMonitor();
}