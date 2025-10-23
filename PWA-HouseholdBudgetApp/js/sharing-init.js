// Sharing System Initialization
// This file initializes all sharing-related managers and makes them globally available

class SharingSystem {
    constructor() {
        this.isInitialized = false;
        this.sharingManager = null;
        this.invitationManager = null;
        this.permissionManager = null;
    }

    // Initialize the sharing system
    initialize() {
        try {
            console.log('Initializing sharing system...');

            // Check dependencies
            if (!window.storage) {
                throw new Error('StorageManager is required');
            }

            if (!window.authManager) {
                throw new Error('AuthManager is required');
            }

            // Initialize error handler first
            if (window.SharingErrorHandler) {
                this.errorHandler = new SharingErrorHandler(window.storage);
                window.sharingErrorHandler = this.errorHandler;
            }

            // Initialize managers
            this.permissionManager = new PermissionManager(window.storage);
            this.invitationManager = new InvitationManager(window.storage);
            this.sharingManager = new SharingManager(window.storage, window.authManager);

            // Initialize sharing manager with other managers
            this.sharingManager.initialize(this.invitationManager, this.permissionManager);

            // Make managers globally available
            window.sharingManager = this.sharingManager;
            window.invitationManager = this.invitationManager;
            window.permissionManager = this.permissionManager;
            window.sharingSystem = this;

            // Initialize performance monitoring if available
            if (window.PerformanceMonitor && !window.performanceMonitor) {
                window.performanceMonitor = new PerformanceMonitor();
                console.log('Performance monitoring initialized for sharing system');
            }

            // Perform initial maintenance
            this.performInitialMaintenance();

            this.isInitialized = true;
            console.log('Sharing system initialized successfully');

            return true;

        } catch (error) {
            console.error('Error initializing sharing system:', error);
            this.isInitialized = false;
            return false;
        }
    }

    // Perform initial maintenance tasks
    performInitialMaintenance() {
        try {
            // Clean up expired invitations
            if (this.invitationManager) {
                this.invitationManager.performMaintenance();
            }

            // Ensure fund source ownership is set
            this.ensureFundSourceOwnership();

            // Validate sharing data integrity
            this.validateSharingDataIntegrity();

        } catch (error) {
            console.error('Error during initial maintenance:', error);
        }
    }

    // Ensure all fund sources have proper ownership
    ensureFundSourceOwnership() {
        try {
            const currentUser = window.authManager.getCurrentUser();
            if (!currentUser) return;

            const fundSources = window.storage.getFundSources();
            let updated = false;

            for (const fundSource of fundSources) {
                // Set owner if not set
                if (!fundSource.ownerId) {
                    fundSource.ownerId = currentUser.id;
                    fundSource.updatedAt = new Date();
                    updated = true;
                }

                // Ensure sharing fields exist
                if (fundSource.isShared === undefined) {
                    fundSource.isShared = false;
                    updated = true;
                }

                if (!fundSource.sharedWith) {
                    fundSource.sharedWith = [];
                    updated = true;
                }

                if (!fundSource.permissions) {
                    fundSource.permissions = this.permissionManager.getDefaultPermissions();
                    updated = true;
                }
            }

            if (updated) {
                window.storage.setFundSources(fundSources);
                console.log('Fund source ownership updated');
            }

        } catch (error) {
            console.error('Error ensuring fund source ownership:', error);
        }
    }

    // Validate sharing data integrity
    validateSharingDataIntegrity() {
        try {
            const fundSources = window.storage.getFundSources();
            const invitations = this.invitationManager.getAllInvitations();
            let issuesFound = false;

            // Check for orphaned invitations
            for (const invitation of invitations) {
                const fundSource = fundSources.find(fs => fs.id === invitation.fundSourceId);
                if (!fundSource) {
                    console.warn(`Orphaned invitation found for fund source: ${invitation.fundSourceId}`);
                    issuesFound = true;
                }
            }

            // Check for invalid shared users
            for (const fundSource of fundSources) {
                if (fundSource.isShared && fundSource.sharedWith) {
                    for (const sharedUser of fundSource.sharedWith) {
                        if (!sharedUser.userId || !sharedUser.email) {
                            console.warn(`Invalid shared user in fund source: ${fundSource.id}`);
                            issuesFound = true;
                        }
                    }
                }
            }

            if (issuesFound) {
                console.log('Sharing data integrity issues found - consider running cleanup');
            } else {
                console.log('Sharing data integrity check passed');
            }

        } catch (error) {
            console.error('Error validating sharing data integrity:', error);
        }
    }

    // Get system status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            managers: {
                sharingManager: !!this.sharingManager,
                invitationManager: !!this.invitationManager,
                permissionManager: !!this.permissionManager
            },
            dependencies: {
                storage: !!window.storage,
                authManager: !!window.authManager
            }
        };
    }

    // Cleanup sharing data
    cleanup() {
        try {
            console.log('Performing sharing system cleanup...');

            // Clean up expired invitations
            if (this.invitationManager) {
                this.invitationManager.cleanupExpiredInvitations();
                this.invitationManager.deleteOldInvitations(30);
            }

            // Clean up orphaned sharing data
            this.cleanupOrphanedSharingData();

            console.log('Sharing system cleanup completed');
            return true;

        } catch (error) {
            console.error('Error during sharing system cleanup:', error);
            return false;
        }
    }

    // Clean up orphaned sharing data
    cleanupOrphanedSharingData() {
        try {
            const fundSources = window.storage.getFundSources();
            const invitations = this.invitationManager.getAllInvitations();
            let cleaned = false;

            // Remove invitations for non-existent fund sources
            const validInvitations = invitations.filter(invitation => {
                const fundSourceExists = fundSources.some(fs => fs.id === invitation.fundSourceId);
                if (!fundSourceExists) {
                    console.log(`Removing orphaned invitation: ${invitation.id}`);
                    cleaned = true;
                }
                return fundSourceExists;
            });

            if (cleaned) {
                this.invitationManager.setAllInvitations(validInvitations);
            }

            // Clean up invalid shared users in fund sources
            for (const fundSource of fundSources) {
                if (fundSource.sharedWith && fundSource.sharedWith.length > 0) {
                    const originalLength = fundSource.sharedWith.length;
                    fundSource.sharedWith = fundSource.sharedWith.filter(user => 
                        user.userId && user.email && user.permissions
                    );

                    if (fundSource.sharedWith.length !== originalLength) {
                        console.log(`Cleaned invalid shared users from fund source: ${fundSource.id}`);
                        cleaned = true;
                    }

                    // If no valid shared users remain, disable sharing
                    if (fundSource.sharedWith.length === 0 && fundSource.isShared) {
                        fundSource.isShared = false;
                        cleaned = true;
                    }
                }
            }

            if (cleaned) {
                window.storage.setFundSources(fundSources);
            }

        } catch (error) {
            console.error('Error cleaning up orphaned sharing data:', error);
        }
    }

    // Reset sharing system (for debugging)
    reset() {
        try {
            console.log('Resetting sharing system...');

            // Clear all sharing data
            if (window.storage) {
                window.storage.setInvitations([]);
                window.storage.setSharingSettings([]);
                window.storage.setSharingUsers([]);
            }

            // Reset fund sources sharing status
            const fundSources = window.storage.getFundSources();
            for (const fundSource of fundSources) {
                fundSource.isShared = false;
                fundSource.sharedWith = [];
                fundSource.updatedAt = new Date();
            }
            window.storage.setFundSources(fundSources);

            // Reset transactions sharing status
            const transactions = window.storage.getTransactions();
            for (const transaction of transactions) {
                transaction.isShared = false;
                transaction.updatedAt = new Date();
            }
            window.storage.setTransactions(transactions);

            console.log('Sharing system reset completed');
            return true;

        } catch (error) {
            console.error('Error resetting sharing system:', error);
            return false;
        }
    }

    // Get sharing statistics
    getStatistics() {
        try {
            const fundSources = window.storage.getFundSources();
            const transactions = window.storage.getTransactions();
            const invitations = this.invitationManager ? this.invitationManager.getAllInvitations() : [];

            const stats = {
                fundSources: {
                    total: fundSources.length,
                    shared: fundSources.filter(fs => fs.isShared).length,
                    private: fundSources.filter(fs => !fs.isShared).length
                },
                transactions: {
                    total: transactions.length,
                    shared: transactions.filter(t => t.isShared).length,
                    private: transactions.filter(t => !t.isShared).length
                },
                invitations: {
                    total: invitations.length,
                    pending: invitations.filter(i => i.status === 'pending').length,
                    accepted: invitations.filter(i => i.status === 'accepted').length,
                    declined: invitations.filter(i => i.status === 'declined').length,
                    expired: invitations.filter(i => i.status === 'expired').length
                },
                users: {
                    totalSharedUsers: this.getTotalSharedUsersCount()
                }
            };

            return stats;

        } catch (error) {
            console.error('Error getting sharing statistics:', error);
            return null;
        }
    }

    // Get total count of unique shared users
    getTotalSharedUsersCount() {
        try {
            const fundSources = window.storage.getFundSources();
            const uniqueUsers = new Set();

            for (const fundSource of fundSources) {
                if (fundSource.isShared && fundSource.sharedWith) {
                    for (const user of fundSource.sharedWith) {
                        uniqueUsers.add(user.userId);
                    }
                }
            }

            return uniqueUsers.size;

        } catch (error) {
            console.error('Error getting total shared users count:', error);
            return 0;
        }
    }
}

// Initialize sharing system when dependencies are ready
function initializeSharingSystem() {
    try {
        console.log('Attempting to initialize sharing system...');
        
        // Check if dependencies are available
        if (!window.storage || !window.authManager) {
            console.log('Dependencies not ready:', {
                storage: !!window.storage,
                authManager: !!window.authManager
            });
            setTimeout(initializeSharingSystem, 100);
            return false;
        }

        // Check if sharing classes are loaded
        if (!window.SharingManager || !window.InvitationManager || !window.PermissionManager) {
            console.log('Sharing classes not loaded:', {
                SharingManager: !!window.SharingManager,
                InvitationManager: !!window.InvitationManager,
                PermissionManager: !!window.PermissionManager
            });
            setTimeout(initializeSharingSystem, 100);
            return false;
        }

        // Initialize sharing system
        console.log('All dependencies ready, creating sharing system...');
        const sharingSystem = new SharingSystem();
        const success = sharingSystem.initialize();

        if (success) {
            console.log('Sharing system initialized successfully');
            
            // Trigger event for other components
            if (typeof window.CustomEvent !== 'undefined') {
                window.dispatchEvent(new CustomEvent('sharingSystemReady', {
                    detail: { sharingSystem }
                }));
            }
            return true;
        } else {
            console.error('Failed to initialize sharing system');
            return false;
        }
    } catch (error) {
        console.error('Error during sharing system initialization:', error);
        setTimeout(initializeSharingSystem, 1000);
        return false;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSharingSystem);
} else {
    // DOM is already ready
    setTimeout(initializeSharingSystem, 100);
}

// Ensure initialization happens even if other methods fail
let initializationAttempts = 0;
const maxInitializationAttempts = 10;

function ensureInitialization() {
    initializationAttempts++;
    
    if (window.sharingManager && window.invitationManager && 
        window.permissionManager && window.sharingUIManager) {
        console.log('Sharing system fully initialized');
        return;
    }
    
    if (initializationAttempts <= maxInitializationAttempts) {
        console.log(`Ensuring initialization attempt ${initializationAttempts}/${maxInitializationAttempts}`);
        
        // Try system initialization
        if (!window.sharingManager || !window.invitationManager || !window.permissionManager) {
            initializeSharingSystem();
        }
        
        // Try UI initialization
        if (!window.sharingUIManager) {
            setTimeout(() => {
                initializeSharingUI();
            }, 200);
        }
        
        // Schedule next check
        setTimeout(ensureInitialization, 1000 * initializationAttempts);
    } else {
        console.warn('Maximum initialization attempts reached');
    }
}

// Start ensuring initialization
setTimeout(ensureInitialization, 1000);
// Initialize sharing UI system
function initializeSharingUI() {
    try {
        console.log('Attempting to initialize sharing UI...');
        
        // Check if SharingUIManager class is available
        if (!window.SharingUIManager) {
            console.log('SharingUIManager class not available, retrying...');
            setTimeout(initializeSharingUI, 200);
            return false;
        }
        
        // Wait for all dependencies to be available
        const dependencies = {
            uiManager: !!window.uiManager,
            sharingManager: !!window.sharingManager,
            invitationManager: !!window.invitationManager,
            permissionManager: !!window.permissionManager
        };
        
        console.log('Checking UI dependencies:', dependencies);
        
        if (Object.values(dependencies).every(dep => dep)) {
            console.log('All UI dependencies ready, creating SharingUIManager instance...');
            
            // Create the instance
            window.sharingUIManager = new SharingUIManager(
                window.uiManager,
                window.sharingManager,
                window.invitationManager,
                window.permissionManager
            );
            
            // Verify the instance was created correctly
            const verification = {
                instance: !!window.sharingUIManager,
                hasOpenSharingManagementModal: typeof window.sharingUIManager.openSharingManagementModal,
                hasOpenSharedUsersModal: typeof window.sharingUIManager.openSharedUsersModal,
                hasUpdateAuthDependentUI: typeof window.sharingUIManager.updateAuthDependentUI
            };
            
            console.log('SharingUIManager verification:', verification);
            
            if (verification.instance && 
                verification.hasOpenSharingManagementModal === 'function' && 
                verification.hasOpenSharedUsersModal === 'function') {
                
                console.log('SharingUIManager created successfully');
                
                // Add invitation acceptance button to settings
                try {
                    if (typeof window.sharingUIManager.addInvitationAcceptanceButton === 'function') {
                        window.sharingUIManager.addInvitationAcceptanceButton();
                    }
                } catch (error) {
                    console.warn('Error adding invitation acceptance button:', error);
                }
                
                // Check for pending invitation tokens after login
                try {
                    if (window.authManager && window.authManager.getIsLoggedIn()) {
                        if (typeof window.sharingUIManager.checkPendingInvitationToken === 'function') {
                            window.sharingUIManager.checkPendingInvitationToken();
                        }
                    }
                } catch (error) {
                    console.warn('Error checking pending invitation token:', error);
                }
                
                // Trigger event for other components
                if (typeof window.CustomEvent !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('sharingUIReady', {
                        detail: { sharingUIManager: window.sharingUIManager }
                    }));
                }
                
                console.log('Sharing UI initialization completed successfully');
                return true;
                
            } else {
                console.error('SharingUIManager instance verification failed');
                return false;
            }
            
        } else {
            console.log('UI dependencies not ready, retrying...', dependencies);
            setTimeout(initializeSharingUI, 500);
            return false;
        }
        
    } catch (error) {
        console.error('Error initializing sharing UI:', error);
        setTimeout(initializeSharingUI, 1000);
        return false;
    }
}

// Listen for sharing system ready event to initialize UI
window.addEventListener('sharingSystemReady', () => {
    // Small delay to ensure UI manager is ready
    setTimeout(initializeSharingUI, 100);
});

// Also try to initialize UI when DOM is ready (fallback)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeSharingUI, 1000);
    });
} else {
    setTimeout(initializeSharingUI, 1000);
}

// Additional initialization attempts for robustness
setTimeout(() => {
    if (!window.sharingUIManager) {
        console.log('Sharing UI not initialized yet, attempting additional initialization...');
        initializeSharingUI();
    }
}, 2000);

setTimeout(() => {
    if (!window.sharingUIManager) {
        console.log('Final attempt to initialize sharing UI...');
        initializeSharingUI();
    }
}, 5000);

// Force initialization when auth state changes
window.addEventListener('authStateChange', (event) => {
    console.log('Auth state changed, checking sharing UI initialization...');
    setTimeout(() => {
        if (!window.sharingUIManager) {
            console.log('Initializing sharing UI after auth state change...');
            initializeSharingUI();
        } else if (window.sharingUIManager.updateAuthDependentUI) {
            window.sharingUIManager.updateAuthDependentUI();
        }
    }, 100);
});

// Export initialization functions for manual triggering
window.initializeSharingSystem = initializeSharingSystem;
window.initializeSharingUI = initializeSharingUI;

// Global function to force complete reinitialization
window.reinitializeSharing = function() {
    console.log('Force reinitializing sharing system...');
    
    // Clear existing instances
    window.sharingManager = null;
    window.invitationManager = null;
    window.permissionManager = null;
    window.sharingUIManager = null;
    
    // Reinitialize
    const systemSuccess = initializeSharingSystem();
    if (systemSuccess) {
        setTimeout(() => {
            initializeSharingUI();
        }, 100);
    }
};

// Debug function to check all sharing components
window.debugSharingSystem = function() {
    console.log('=== Sharing System Debug Info ===');
    console.log('Classes loaded:', {
        SharingManager: !!window.SharingManager,
        InvitationManager: !!window.InvitationManager,
        PermissionManager: !!window.PermissionManager,
        SharingUIManager: !!window.SharingUIManager
    });
    
    console.log('Instances created:', {
        sharingManager: !!window.sharingManager,
        invitationManager: !!window.invitationManager,
        permissionManager: !!window.permissionManager,
        sharingUIManager: !!window.sharingUIManager
    });
    
    console.log('Dependencies:', {
        storage: !!window.storage,
        authManager: !!window.authManager,
        uiManager: !!window.uiManager,
        isLoggedIn: window.authManager ? window.authManager.getIsLoggedIn() : false
    });
    
    if (window.sharingUIManager) {
        console.log('SharingUIManager methods:', {
            openSharingManagementModal: typeof window.sharingUIManager.openSharingManagementModal,
            openSharedUsersModal: typeof window.sharingUIManager.openSharedUsersModal,
            updateAuthDependentUI: typeof window.sharingUIManager.updateAuthDependentUI
        });
    }
    
    console.log('=== End Debug Info ===');
};