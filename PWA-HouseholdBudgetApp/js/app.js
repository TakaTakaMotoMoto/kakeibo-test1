// Main Application Controller
class BudgetApp {
    constructor() {
        this.isLoading = true;
        this.deferredPrompt = null;
        this.initialize();
    }

    async initialize() {
        // Show loading screen
        this.showLoadingScreen();
        
        // Initialize PWA features
        this.initializePWA();
        
        // Simulate loading time for better UX
        await this.delay(1500);
        
        // Initialize app
        this.hideLoadingScreen();
        this.initializeApp();
    }

    showLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        this.isLoading = false;
    }

    initializeApp() {
        // Check for URL parameters
        this.handleURLParameters();
        
        // Initialize theme
        this.initializeTheme();
        
        // Show install prompt if available
        this.checkInstallPrompt();
        
        // Initialize keyboard shortcuts
        this.initializeKeyboardShortcuts();
        
        // Initialize authentication UI
        this.initializeAuth();
        
        console.log('Budget App initialized successfully');
    }

    initializeAuth() {
        // Update auth UI after all components are loaded
        if (window.authManager) {
            window.authManager.updateAuthUI();
        }
        
        // Update UI manager auth-dependent components
        if (window.uiManager) {
            window.uiManager.updateAuthDependentUI();
        }
    }

    initializePWA() {
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            window.deferredPrompt = e;
            
            // Show install button
            const installBtn = document.getElementById('install-app');
            if (installBtn) {
                installBtn.style.display = 'flex';
            }
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.deferredPrompt = null;
            window.deferredPrompt = null;
            
            // Hide install button
            const installBtn = document.getElementById('install-app');
            if (installBtn) {
                installBtn.style.display = 'none';
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('オンラインに戻りました', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('オフラインモードです', 'warning');
        });
    }

    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action === 'add') {
            // Open add transaction modal
            setTimeout(() => {
                window.uiManager.openTransactionModal();
            }, 500);
        }
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'auto';
        this.applyTheme(savedTheme);
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.classList.add('dark-theme');
        } else if (theme === 'light') {
            root.classList.remove('dark-theme');
        } else {
            // Auto theme - follow system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark-theme', prefersDark);
        }
        
        localStorage.setItem('theme', theme);
    }

    checkInstallPrompt() {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            const installBtn = document.getElementById('install-app');
            if (installBtn) {
                installBtn.style.display = 'none';
            }
        }
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: New transaction
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                window.uiManager.openTransactionModal();
            }
            
            // Ctrl/Cmd + F: Open filters
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                window.uiManager.openFilterModal();
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    window.uiManager.closeModal(activeModal.id);
                }
            }
            
            // Number keys: Switch tabs (1-4)
            if (e.key >= '1' && e.key <= '4' && !e.ctrlKey && !e.metaKey) {
                const views = ['transactions', 'charts', 'fundsources', 'settings'];
                const viewIndex = parseInt(e.key) - 1;
                if (views[viewIndex]) {
                    window.uiManager.switchView(views[viewIndex]);
                }
            }
        });
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // Set background color based on type
        const colors = {
            success: '#34C759',
            warning: '#FF9500',
            error: '#FF3B30',
            info: '#007AFF'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        this.showNotification(`エラーが発生しました: ${error.message}`, 'error');
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    // Data validation
    validateAppState() {
        try {
            // Check if required data exists
            const transactions = window.storage.getTransactions();
            const categories = window.storage.getCategories();
            const fundSources = window.storage.getFundSources();
            
            console.log('App state validation:', {
                transactions: transactions.length,
                categories: categories.length,
                fundSources: fundSources.length
            });
            
            return true;
        } catch (error) {
            this.handleError(error, 'validateAppState');
            return false;
        }
    }

    // Export app state for debugging
    exportDebugInfo() {
        return {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            localStorage: { ...localStorage },
            appState: {
                currentView: window.uiManager?.currentView,
                currentTransactionView: window.uiManager?.currentTransactionView,
                isLoading: this.isLoading
            },
            dataState: {
                transactions: window.storage.getTransactions().length,
                categories: window.storage.getCategories().length,
                fundSources: window.storage.getFundSources().length
            }
        };
    }
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.budgetApp) {
        window.budgetApp.handleError(e.error, 'global');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (window.budgetApp) {
        window.budgetApp.handleError(e.reason, 'promise');
    }
});

// Initialize app when DOM is loaded and all dependencies are ready
document.addEventListener('DOMContentLoaded', () => {
    const initApp = () => {
        if (window.storage && window.authManager && window.dataManager && window.uiManager) {
            window.budgetApp = new BudgetApp();
        } else {
            setTimeout(initApp, 200);
        }
    };
    initApp();
});

// Add some CSS for notifications
const notificationStyles = `
    .notification {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
    }
    
    .notification-success {
        background: linear-gradient(135deg, #34C759, #30B955);
    }
    
    .notification-warning {
        background: linear-gradient(135deg, #FF9500, #FF8C00);
    }
    
    .notification-error {
        background: linear-gradient(135deg, #FF3B30, #FF2D1B);
    }
    
    .notification-info {
        background: linear-gradient(135deg, #007AFF, #0056CC);
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-secondary);
    }
    
    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    .empty-state h3 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .empty-date {
        text-align: center;
        padding: 2rem 1rem;
        color: var(--text-secondary);
    }
    
    .empty-date .empty-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
    
    .empty-chart {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-secondary);
    }
    
    .empty-chart .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    .monthly-summary {
        display: flex;
        justify-content: space-around;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .summary-item {
        text-align: center;
        flex: 1;
        min-width: 100px;
    }
    
    .summary-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
    }
    
    .summary-value {
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .legend-info {
        flex: 1;
    }
    
    .legend-name {
        font-weight: 500;
        margin-bottom: 0.25rem;
    }
    
    .legend-value {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .transaction-dot-more {
        font-size: 8px;
        color: var(--text-secondary);
        font-weight: bold;
    }
    
    .shared-indicator {
        font-size: 0.8em;
        margin-left: 4px;
        opacity: 0.7;
    }
    
    .transaction-creator {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-top: 2px;
    }
    
    .transaction-item.readonly {
        opacity: 0.8;
        background-color: var(--background-secondary);
    }
    
    .readonly-indicator {
        font-size: 0.8em;
        margin-left: 4px;
        opacity: 0.6;
    }
    
    .shared-dot, .mixed-dot {
        font-size: 8px;
        margin-left: 2px;
    }
    
    .shared-dot {
        color: #007AFF;
    }
    
    .mixed-dot {
        color: #FF9500;
    }
    
    .filter-indicator {
        position: relative;
    }
    
    .filter-indicator::after {
        content: '';
        position: absolute;
        top: -2px;
        right: -2px;
        width: 6px;
        height: 6px;
        background-color: #FF3B30;
        border-radius: 50%;
    }
    
    .sharing-list, .shared-users-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 16px;
    }
    
    .sharing-item, .shared-user-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--background-primary);
    }
    
    .sharing-info, .user-info {
        flex: 1;
    }
    
    .fund-source-name, .user-name {
        font-weight: 500;
        margin-bottom: 4px;
    }
    
    .sharing-status, .user-email {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .status-indicator {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .status-indicator.active {
        background-color: #34C759;
        color: white;
    }
    
    .user-status {
        display: flex;
        align-items: center;
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);