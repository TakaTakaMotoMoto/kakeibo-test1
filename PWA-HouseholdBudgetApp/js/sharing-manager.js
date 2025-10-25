// Sharing Manager - Core sharing functionality
class SharingManager {
    constructor(storage, authManager) {
        this.storage = storage;
        this.authManager = authManager;
        this.invitationManager = null;
        this.permissionManager = null;
        
        // Processing state management to prevent duplicate operations
        this.processingStates = new Map();
        this.operationLocks = new Map();
        
        // Initialize optional performance optimizations
        try {
            this.cache = window.PerformanceCache ? new PerformanceCache() : null;
            this.dataOptimizer = (window.DataAccessOptimizer && this.cache) ? 
                new DataAccessOptimizer(storage, this.cache) : null;
            this.uiOptimizer = window.UIResponsivenessOptimizer ? 
                new UIResponsivenessOptimizer() : null;
            this.uiEnhancer = window.UIResponsivenessEnhancer ? 
                new UIResponsivenessEnhancer() : null;
            this.errorHandler = window.SharingErrorHandler ? 
                new SharingErrorHandler(storage) : null;
        } catch (error) {
            console.warn('Some performance optimizations not available:', error);
            this.cache = null;
            this.dataOptimizer = null;
            this.uiOptimizer = null;
            this.uiEnhancer = null;
            this.errorHandler = null;
        }
        
        // Performance monitoring
        this.performanceMonitor = window.performanceMonitor || null;
        
        // Preload common data if optimizer is available
        if (this.dataOptimizer) {
            this.preloadCommonData();
        }
    }

    // Initialize with other managers
    initialize(invitationManager, permissionManager) {
        this.invitationManager = invitationManager;
        this.permissionManager = permissionManager;
        
        // Initialize performance optimizations
        this.initializePerformanceOptimizations();
    }

    // Processing state management methods
    isOperationInProgress(operationType, resourceId) {
        const key = `${operationType}_${resourceId}`;
        return this.processingStates.has(key);
    }

    setOperationInProgress(operationType, resourceId, metadata = {}) {
        const key = `${operationType}_${resourceId}`;
        this.processingStates.set(key, {
            startTime: new Date(),
            metadata: metadata
        });
        return key;
    }

    clearOperationInProgress(operationType, resourceId) {
        const key = `${operationType}_${resourceId}`;
        return this.processingStates.delete(key);
    }

    acquireOperationLock(operationType, resourceId, timeout = 30000) {
        const key = `${operationType}_${resourceId}`;
        
        if (this.operationLocks.has(key)) {
            const lock = this.operationLocks.get(key);
            const now = Date.now();
            
            // Check if lock has expired
            if (now - lock.timestamp > timeout) {
                console.warn(`Operation lock expired for ${key}, releasing...`);
                this.operationLocks.delete(key);
            } else {
                throw new Error('この操作は既に実行中です。しばらくお待ちください。');
            }
        }

        this.operationLocks.set(key, {
            timestamp: Date.now(),
            timeout: timeout
        });
        
        return key;
    }

    releaseOperationLock(operationType, resourceId) {
        const key = `${operationType}_${resourceId}`;
        return this.operationLocks.delete(key);
    }

    // Initialize performance optimizations
    initializePerformanceOptimizations() {
        try {
            // Preload frequently accessed data
            this.preloadCommonData();
            
            // Set up cache invalidation patterns
            if (typeof this.setupCacheInvalidation === 'function') {
                this.setupCacheInvalidation();
            }
            
            // Initialize UI optimizations
            if (typeof this.initializeUIOptimizations === 'function') {
                this.initializeUIOptimizations();
            }
            
            // Warm cache with intelligent preloading
            if (this.dataOptimizer && typeof this.dataOptimizer.warmCache === 'function') {
                this.dataOptimizer.warmCache();
            }
            
            // Set up periodic performance cleanup
            if (typeof this.performPerformanceCleanup === 'function') {
                setInterval(() => {
                    this.performPerformanceCleanup();
                }, 5 * 60 * 1000); // Every 5 minutes
            }
        } catch (error) {
            console.warn('Error initializing performance optimizations:', error);
        }
    }

    // Preload commonly accessed data
    preloadCommonData() {
        try {
            if (this.dataOptimizer && typeof this.dataOptimizer.preloadCommonData === 'function') {
                this.dataOptimizer.preloadCommonData();
            }
        } catch (error) {
            console.warn('Error preloading common data:', error);
        }
    }

    // Set up cache invalidation patterns
    setupCacheInvalidation() {
        // Invalidate sharing-related cache when data changes
        const originalSetFundSources = this.storage.setFundSources.bind(this.storage);
        this.storage.setFundSources = (fundSources) => {
            const result = originalSetFundSources(fundSources);
            this.cache.invalidatePattern('fundSources');
            this.cache.invalidatePattern('sharing.*');
            return result;
        };

        const originalSetTransactions = this.storage.setTransactions.bind(this.storage);
        this.storage.setTransactions = (transactions) => {
            const result = originalSetTransactions(transactions);
            this.cache.invalidatePattern('transactions.*');
            return result;
        };
    }

    // Initialize UI optimizations
    initializeUIOptimizations() {
        // Set up debounced UI updates for sharing operations
        this.debouncedUpdateSharingUI = this.uiOptimizer.debounceUpdate.bind(
            this.uiOptimizer, 
            'sharing-ui', 
            () => this.updateSharingUI(), 
            200
        );
    }

    // 資金元共有管理 (Performance Optimized)
    shareFundSource(fundSourceId, userEmails, permissions = null) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            // Use optimized data access
            const fundSources = this.dataOptimizer ? 
                this.dataOptimizer.getFundSources() : 
                this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);
            
            if (!fundSource) {
                throw new Error('指定された資金元が見つかりません');
            }

            // Check if user owns this fund source
            if (fundSource.ownerId && fundSource.ownerId !== currentUser.id) {
                throw new Error('この資金元を共有する権限がありません');
            }

            // Set owner if not set
            if (!fundSource.ownerId) {
                fundSource.ownerId = currentUser.id;
            }

            // Update sharing settings
            fundSource.isShared = true;
            fundSource.sharedWith = fundSource.sharedWith || [];
            fundSource.permissions = permissions || this.permissionManager.getDefaultPermissions();
            fundSource.updatedAt = new Date();

            // Send invitations to new users
            const invitations = [];
            for (const email of userEmails) {
                if (!fundSource.sharedWith.some(user => user.email === email)) {
                    const invitation = this.invitationManager.createInvitation({
                        fundSourceId: fundSourceId,
                        inviterUserId: currentUser.id,
                        inviterUsername: currentUser.username,
                        inviteeEmail: email,
                        permissions: fundSource.permissions
                    });
                    invitations.push(invitation);
                }
            }

            // Batch update for performance
            if (this.dataOptimizer) {
                this.dataOptimizer.batchOperation({
                    type: 'updateFundSource',
                    fundSourceId: fundSourceId,
                    updates: {
                        isShared: fundSource.isShared,
                        sharedWith: fundSource.sharedWith,
                        permissions: fundSource.permissions,
                        updatedAt: fundSource.updatedAt
                    }
                });
            } else {
                // Fallback to direct storage update
                const fundSourceIndex = fundSources.findIndex(fs => fs.id === fundSourceId);
                fundSources[fundSourceIndex] = fundSource;
                this.storage.setFundSources(fundSources);
            }

            // Update related transactions sharing status
            this.updateRelatedTransactionSharing(fundSourceId, true);

            return {
                fundSource: fundSource,
                invitations: invitations
            };

        } catch (error) {
            const errorResult = this.errorHandler.handleError(error, {
                operation: 'shareFundSource',
                fundSourceId: fundSourceId,
                userEmails: userEmails,
                userId: this.authManager.getCurrentUser()?.id
            });
            
            // Re-throw if not recoverable
            if (!errorResult.recovery.successful) {
                throw error;
            }
            
            return errorResult;
        }
    }

    unshareFundSource(fundSourceId, userId = null) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);
            
            if (!fundSource) {
                throw new Error('指定された資金元が見つかりません');
            }

            // Check permissions
            if (fundSource.ownerId !== currentUser.id) {
                throw new Error('この資金元の共有を解除する権限がありません');
            }

            if (userId) {
                // Remove specific user
                fundSource.sharedWith = fundSource.sharedWith.filter(user => user.userId !== userId);
                
                // If no more shared users, disable sharing
                if (fundSource.sharedWith.length === 0) {
                    fundSource.isShared = false;
                }
            } else {
                // Remove all sharing
                fundSource.isShared = false;
                fundSource.sharedWith = [];
            }

            fundSource.updatedAt = new Date();

            // Update fund source
            const fundSourceIndex = fundSources.findIndex(fs => fs.id === fundSourceId);
            fundSources[fundSourceIndex] = fundSource;
            this.storage.setFundSources(fundSources);

            // Update related transactions sharing status
            this.updateRelatedTransactionSharing(fundSourceId, fundSource.isShared);

            return fundSource;

        } catch (error) {
            console.error('Error unsharing fund source:', error);
            throw error;
        }
    }

    getFundSourceSharingStatus(fundSourceId) {
        try {
            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);
            
            if (!fundSource) {
                return null;
            }

            return {
                isShared: fundSource.isShared || false,
                sharedWith: fundSource.sharedWith || [],
                permissions: fundSource.permissions || this.permissionManager.getDefaultPermissions(),
                ownerId: fundSource.ownerId
            };

        } catch (error) {
            console.error('Error getting fund source sharing status:', error);
            return null;
        }
    }

    // 招待管理 (Enhanced with detailed validation)
    sendInvitation(fundSourceId, userEmail, permissions = null) {
        const operationId = `sendInvitation_${fundSourceId}_${Date.now()}`;
        
        try {
            // Show loading indicator for server communication
            if (window.loadingManager) {
                window.loadingManager.showOperationLoading('sendInvitation', {
                    message: '招待を送信中...',
                    showOverlay: true
                });
            }
            
            // Validate input parameters to prevent null object errors
            if (!fundSourceId || typeof fundSourceId !== 'string') {
                throw new Error('有効な資金元IDが必要です');
            }

            if (!userEmail || typeof userEmail !== 'string') {
                throw new Error('有効なメールアドレスが必要です');
            }

            // Ensure required managers are initialized
            if (!this.authManager || typeof this.authManager.getCurrentUser !== 'function') {
                throw new Error('認証マネージャーが正しく初期化されていません');
            }

            if (!this.invitationManager || typeof this.invitationManager.createInvitation !== 'function') {
                throw new Error('招待マネージャーが正しく初期化されていません');
            }

            if (!this.storage || typeof this.storage.getFundSources !== 'function') {
                throw new Error('ストレージシステムが正しく初期化されていません');
            }

            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            // Ensure currentUser has required properties
            if (!currentUser.id || !currentUser.email) {
                throw new Error('ユーザー情報が不完全です');
            }

            // Enhanced email validation
            if (window.SharingValidation) {
                const emailValidation = window.SharingValidation.validateEmailDetailed(userEmail);
                if (!emailValidation.isValid) {
                    throw new Error(emailValidation.errors[0] || '有効なメールアドレスを入力してください');
                }
                
                // Log warnings if any
                if (emailValidation.warnings.length > 0) {
                    console.warn('Email validation warnings:', emailValidation.warnings);
                }
            } else {
                // Fallback validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(userEmail)) {
                    throw new Error('有効なメールアドレスを入力してください');
                }
            }

            // Normalize email to lowercase
            userEmail = userEmail.toLowerCase().trim();

            // Enhanced self-invitation check
            if (userEmail === currentUser.email.toLowerCase()) {
                throw new Error('自分自身を招待することはできません');
            }

            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);
            
            if (!fundSource) {
                throw new Error('指定された資金元が見つかりません');
            }

            // Check permissions
            if (fundSource.ownerId !== currentUser.id) {
                throw new Error('この資金元への招待を送信する権限がありません');
            }

            // Use InvitationManager's canInviteUser method for comprehensive checking
            const canInviteResult = this.invitationManager.canInviteUser(fundSourceId, userEmail);
            if (!canInviteResult.canInvite) {
                throw new Error(canInviteResult.reason);
            }

            // Create invitation
            const invitation = this.invitationManager.createInvitation({
                fundSourceId: fundSourceId,
                inviterUserId: currentUser.id,
                inviterUsername: currentUser.username,
                inviteeEmail: userEmail,
                permissions: permissions || fundSource.permissions || this.permissionManager.getDefaultPermissions()
            });

            // Log invitation sending
            console.log(`Invitation sent to ${userEmail} for fund source ${fundSource.name}`);

            // Hide loading indicator
            if (window.loadingManager) {
                window.loadingManager.hideLoading('sendInvitation');
            }

            return invitation;

        } catch (error) {
            // Hide loading indicator on error
            if (window.loadingManager) {
                window.loadingManager.hideLoading('sendInvitation');
            }
            
            const errorResult = this.errorHandler.handleError(error, {
                operation: 'sendInvitation',
                fundSourceId: fundSourceId,
                userEmail: userEmail,
                userId: this.authManager.getCurrentUser()?.id
            });
            
            // Re-throw if not recoverable
            if (!errorResult.recovery.successful) {
                throw error;
            }
            
            return errorResult;
        }
    }

    // Send multiple invitations at once
    sendMultipleInvitations(fundSourceId, userEmails, permissions = null) {
        try {
            const results = [];
            const errors = [];

            for (const email of userEmails) {
                try {
                    const invitation = this.sendInvitation(fundSourceId, email, permissions);
                    results.push({
                        email: email,
                        success: true,
                        invitation: invitation
                    });
                } catch (error) {
                    errors.push({
                        email: email,
                        success: false,
                        error: error.message
                    });
                }
            }

            return {
                successful: results,
                failed: errors,
                totalSent: results.length,
                totalFailed: errors.length
            };

        } catch (error) {
            console.error('Error sending multiple invitations:', error);
            throw error;
        }
    }

    // Resend invitation (creates new invitation and cancels old one)
    resendInvitation(invitationId) {
        let lockKey = null;
        
        try {
            // Show loading indicator for server communication
            if (window.loadingManager) {
                window.loadingManager.showOperationLoading('resendInvitation', {
                    message: '招待を再送信中...',
                    showOverlay: true
                });
            }
            
            // Validate input parameters
            if (!invitationId || typeof invitationId !== 'string') {
                throw new Error('有効な招待IDが必要です');
            }

            // Acquire operation lock to prevent duplicate execution
            lockKey = this.acquireOperationLock('resendInvitation', invitationId);

            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            // Ensure required managers are initialized
            if (!this.invitationManager || typeof this.invitationManager.getInvitationById !== 'function') {
                throw new Error('招待マネージャーが正しく初期化されていません');
            }

            const oldInvitation = this.invitationManager.getInvitationById(invitationId);
            if (!oldInvitation) {
                throw new Error('指定された招待が見つかりません');
            }

            // Check permissions
            if (oldInvitation.inviterUserId !== currentUser.id) {
                throw new Error('この招待を再送信する権限がありません');
            }

            // Validate invitation status - only allow resending pending invitations
            if (oldInvitation.status !== 'pending') {
                throw new Error('この招待は再送信できません（ステータス: ' + oldInvitation.status + '）');
            }

            // Check if invitation has expired
            const now = new Date();
            const expiresAt = new Date(oldInvitation.expiresAt);
            if (now > expiresAt) {
                // Mark as expired first
                this.invitationManager.updateInvitationStatus(invitationId, 'expired');
                throw new Error('期限切れの招待は再送信できません');
            }

            // Step 1: First invalidate the old token to prevent race conditions
            let cancelledInvitation;
            try {
                cancelledInvitation = this.invitationManager.updateInvitationStatus(invitationId, 'cancelled');
                console.log(`Old invitation ${invitationId} cancelled for resend`);
            } catch (cancelError) {
                console.error('Error cancelling old invitation:', cancelError);
                throw new Error('古い招待の無効化に失敗しました: ' + cancelError.message);
            }

            // Step 2: Create new invitation with enhanced error handling
            let newInvitation;
            try {
                // Ensure all required data is available for new invitation
                if (!oldInvitation.fundSourceId) {
                    throw new Error('資金元IDが見つかりません');
                }
                if (!oldInvitation.inviteeEmail) {
                    throw new Error('招待先メールアドレスが見つかりません');
                }

                newInvitation = this.sendInvitation(
                    oldInvitation.fundSourceId,
                    oldInvitation.inviteeEmail,
                    oldInvitation.permissions
                );

                if (!newInvitation || !newInvitation.token) {
                    throw new Error('新しい招待トークンの生成に失敗しました');
                }

                console.log(`New invitation ${newInvitation.id} created for resend to ${oldInvitation.inviteeEmail}`);

            } catch (createError) {
                console.error('Error creating new invitation:', createError);
                
                // Attempt to restore old invitation if new creation failed
                try {
                    this.invitationManager.updateInvitationStatus(invitationId, 'pending');
                    console.log('Restored old invitation status due to new invitation creation failure');
                } catch (restoreError) {
                    console.error('Failed to restore old invitation:', restoreError);
                }
                
                throw new Error('新しい招待の作成に失敗しました: ' + createError.message);
            }

            console.log(`Invitation successfully resent to ${oldInvitation.inviteeEmail}`);

            // Hide loading indicator
            if (window.loadingManager) {
                window.loadingManager.hideLoading('resendInvitation');
            }

            return {
                oldInvitation: cancelledInvitation,
                newInvitation: newInvitation,
                success: true
            };

        } catch (error) {
            // Hide loading indicator on error
            if (window.loadingManager) {
                window.loadingManager.hideLoading('resendInvitation');
            }
            
            const errorResult = this.errorHandler ? this.errorHandler.handleError(error, {
                operation: 'resendInvitation',
                invitationId: invitationId,
                userId: this.authManager.getCurrentUser()?.id
            }) : null;
            
            console.error('Error resending invitation:', error);
            
            // Re-throw if not recoverable
            if (!errorResult || !errorResult.recovery.successful) {
                throw error;
            }
            
            return errorResult;
        } finally {
            // Always release the operation lock
            if (lockKey) {
                this.releaseOperationLock('resendInvitation', invitationId);
            }
        }
    }

    cancelInvitation(invitationId) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            const invitation = this.invitationManager.getInvitationById(invitationId);
            if (!invitation) {
                throw new Error('指定された招待が見つかりません');
            }

            // Check permissions
            if (invitation.inviterUserId !== currentUser.id) {
                throw new Error('この招待を取り消す権限がありません');
            }

            // Only allow cancelling pending invitations
            if (invitation.status !== 'pending') {
                throw new Error('この招待は取り消すことができません');
            }

            const cancelledInvitation = this.invitationManager.updateInvitationStatus(invitationId, 'cancelled');
            
            console.log(`Invitation cancelled for ${invitation.inviteeEmail}`);
            
            return cancelledInvitation;

        } catch (error) {
            console.error('Error cancelling invitation:', error);
            throw error;
        }
    }

    // Cancel all pending invitations for a fund source
    cancelAllInvitations(fundSourceId) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);
            
            if (!fundSource) {
                throw new Error('指定された資金元が見つかりません');
            }

            // Check permissions
            if (fundSource.ownerId !== currentUser.id) {
                throw new Error('この資金元の招待を取り消す権限がありません');
            }

            const pendingInvitations = this.invitationManager.getInvitationsByFundSource(fundSourceId)
                .filter(inv => inv.status === 'pending');

            const cancelledInvitations = [];
            for (const invitation of pendingInvitations) {
                try {
                    const cancelled = this.invitationManager.updateInvitationStatus(invitation.id, 'cancelled');
                    cancelledInvitations.push(cancelled);
                } catch (error) {
                    console.error(`Error cancelling invitation ${invitation.id}:`, error);
                }
            }

            console.log(`Cancelled ${cancelledInvitations.length} invitations for fund source ${fundSource.name}`);

            return {
                cancelled: cancelledInvitations,
                totalCancelled: cancelledInvitations.length
            };

        } catch (error) {
            console.error('Error cancelling all invitations:', error);
            throw error;
        }
    }

    getInvitations(status = null) {
        try {
            return this.invitationManager.getInvitations(status);
        } catch (error) {
            console.error('Error getting invitations:', error);
            return [];
        }
    }

    // Get invitations sent by current user
    getSentInvitations(status = null) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                return [];
            }

            const allInvitations = this.invitationManager.getInvitationsBySender(currentUser.id);
            
            if (status) {
                return allInvitations.filter(inv => inv.status === status);
            }
            
            return allInvitations;

        } catch (error) {
            console.error('Error getting sent invitations:', error);
            return [];
        }
    }

    // Get invitations received by current user
    getReceivedInvitations(status = null) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                console.log('getReceivedInvitations: No current user');
                return [];
            }

            console.log('getReceivedInvitations: Current user email:', currentUser.email);

            if (!this.invitationManager) {
                console.error('getReceivedInvitations: Invitation manager not available');
                return [];
            }

            const allInvitations = this.invitationManager.getInvitationsByEmail(currentUser.email);
            console.log('getReceivedInvitations: All invitations for user:', allInvitations.length, allInvitations);
            
            if (status) {
                const filteredInvitations = allInvitations.filter(inv => inv.status === status);
                console.log(`getReceivedInvitations: Filtered invitations (status=${status}):`, filteredInvitations.length, filteredInvitations);
                return filteredInvitations;
            }
            
            return allInvitations;

        } catch (error) {
            console.error('Error getting received invitations:', error);
            return [];
        }
    }

    // Get invitation statistics for current user
    getInvitationStatistics() {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                return null;
            }

            const sentStats = this.invitationManager.getInvitationStats(currentUser.id);
            const receivedInvitations = this.getReceivedInvitations();
            
            const receivedStats = {
                total: receivedInvitations.length,
                pending: 0,
                accepted: 0,
                declined: 0,
                expired: 0,
                cancelled: 0
            };

            for (const invitation of receivedInvitations) {
                if (receivedStats.hasOwnProperty(invitation.status)) {
                    receivedStats[invitation.status]++;
                }
            }

            return {
                sent: sentStats,
                received: receivedStats
            };

        } catch (error) {
            console.error('Error getting invitation statistics:', error);
            return null;
        }
    }

    // 受諾管理
    acceptInvitation(invitationToken) {
        try {
            // Show loading indicator for server communication
            if (window.loadingManager) {
                window.loadingManager.showOperationLoading('acceptInvitation', {
                    message: '招待を受諾中...',
                    showOverlay: true
                });
            }
            
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('招待を受諾するにはログインが必要です');
            }

            // Validate token
            const invitation = this.invitationManager.validateToken(invitationToken);
            if (!invitation) {
                throw new Error('無効または期限切れの招待トークンです');
            }

            // Check if invitation is for current user (case-insensitive)
            if (invitation.inviteeEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
                throw new Error('この招待は別のユーザー宛です');
            }

            // Check if invitation is still pending
            if (invitation.status !== 'pending') {
                throw new Error('この招待は既に処理済みです');
            }

            // Get fund source
            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === invitation.fundSourceId);
            
            if (!fundSource) {
                throw new Error('招待対象の資金元が見つかりません');
            }

            // Check if user is already sharing this fund source
            fundSource.sharedWith = fundSource.sharedWith || [];
            const existingUser = fundSource.sharedWith.find(user => user.userId === currentUser.id);
            
            if (existingUser) {
                // Update existing user's permissions if they differ
                if (JSON.stringify(existingUser.permissions) !== JSON.stringify(invitation.permissions)) {
                    existingUser.permissions = invitation.permissions;
                    existingUser.updatedAt = new Date();
                }
            } else {
                // Add new user to shared users
                fundSource.sharedWith.push({
                    userId: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email,
                    permissions: invitation.permissions,
                    joinedAt: new Date()
                });
            }

            fundSource.isShared = true;
            fundSource.updatedAt = new Date();

            // Update fund source
            const fundSourceIndex = fundSources.findIndex(fs => fs.id === invitation.fundSourceId);
            fundSources[fundSourceIndex] = fundSource;
            this.storage.setFundSources(fundSources);

            // Update invitation status
            const acceptedInvitation = this.invitationManager.updateInvitationStatus(invitation.id, 'accepted');

            // Update related transactions sharing status
            this.updateRelatedTransactionSharing(invitation.fundSourceId, true);

            console.log(`Invitation accepted by ${currentUser.email} for fund source ${fundSource.name}`);

            // Hide loading indicator
            if (window.loadingManager) {
                window.loadingManager.hideLoading('acceptInvitation');
            }

            return {
                fundSource: fundSource,
                invitation: acceptedInvitation,
                userAdded: !existingUser
            };

        } catch (error) {
            // Hide loading indicator on error
            if (window.loadingManager) {
                window.loadingManager.hideLoading('acceptInvitation');
            }
            
            const errorResult = this.errorHandler.handleError(error, {
                operation: 'acceptInvitation',
                invitationToken: invitationToken,
                userId: this.authManager.getCurrentUser()?.id
            });
            
            // Re-throw if not recoverable
            if (!errorResult.recovery.successful) {
                throw error;
            }
            
            return errorResult;
        }
    }

    declineInvitation(invitationToken) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            
            // Validate token
            const invitation = this.invitationManager.validateToken(invitationToken);
            if (!invitation) {
                throw new Error('無効または期限切れの招待トークンです');
            }

            // Check if invitation is for current user (if logged in)
            if (currentUser && invitation.inviteeEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
                throw new Error('この招待は別のユーザー宛です');
            }

            // Check if invitation is still pending
            if (invitation.status !== 'pending') {
                throw new Error('この招待は既に処理済みです');
            }

            const declinedInvitation = this.invitationManager.updateInvitationStatus(invitation.id, 'declined');
            
            console.log(`Invitation declined for ${invitation.inviteeEmail}`);
            
            return declinedInvitation;

        } catch (error) {
            console.error('Error declining invitation:', error);
            throw error;
        }
    }

    validateInvitationToken(token) {
        try {
            return this.invitationManager.validateToken(token);
        } catch (error) {
            console.error('Error validating invitation token:', error);
            return null;
        }
    }

    // Get invitation details for display (without sensitive information)
    getInvitationDetails(invitationToken) {
        try {
            // Use read-only validation to avoid side effects
            const validationResult = this.invitationManager.checkTokenValidity(invitationToken);
            if (!validationResult.valid) {
                console.log('getInvitationDetails: Token validation failed:', validationResult.reason);
                return {
                    valid: false,
                    error: validationResult.reason === 'Invitation expired' ? 
                        '招待の有効期限が切れています' : 
                        '無効な招待トークンです'
                };
            }
            
            const invitation = validationResult.invitation;

            // Get fund source details
            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === invitation.fundSourceId);
            
            if (!fundSource) {
                return {
                    valid: false,
                    error: '招待対象の資金元が見つかりません'
                };
            }

            return {
                valid: true,
                invitation: {
                    id: invitation.id,
                    inviterUsername: invitation.inviterUsername,
                    inviteeEmail: invitation.inviteeEmail,
                    fundSourceName: fundSource.name,
                    fundSourceType: fundSource.type,
                    permissions: invitation.permissions,
                    createdAt: invitation.createdAt,
                    expiresAt: invitation.expiresAt,
                    status: invitation.status
                },
                fundSource: {
                    id: fundSource.id,
                    name: fundSource.name,
                    type: fundSource.type,
                    balance: fundSource.balance
                }
            };

        } catch (error) {
            console.error('Error getting invitation details:', error);
            return {
                valid: false,
                error: 'エラーが発生しました'
            };
        }
    }

    // Process invitation by token (accept or decline)
    processInvitation(invitationToken, action) {
        try {
            if (action === 'accept') {
                return this.acceptInvitation(invitationToken);
            } else if (action === 'decline') {
                return this.declineInvitation(invitationToken);
            } else {
                throw new Error('無効なアクションです');
            }

        } catch (error) {
            console.error('Error processing invitation:', error);
            throw error;
        }
    }

    // Check if current user can accept invitation
    canAcceptInvitation(invitationToken) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                return {
                    canAccept: false,
                    reason: 'ログインが必要です'
                };
            }

            const invitation = this.invitationManager.validateToken(invitationToken);
            if (!invitation) {
                return {
                    canAccept: false,
                    reason: '無効または期限切れの招待トークンです'
                };
            }

            if (invitation.inviteeEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
                return {
                    canAccept: false,
                    reason: 'この招待は別のユーザー宛です'
                };
            }

            if (invitation.status !== 'pending') {
                return {
                    canAccept: false,
                    reason: 'この招待は既に処理済みです'
                };
            }

            // Check if fund source still exists
            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === invitation.fundSourceId);
            
            if (!fundSource) {
                return {
                    canAccept: false,
                    reason: '招待対象の資金元が見つかりません'
                };
            }

            return {
                canAccept: true,
                reason: null
            };

        } catch (error) {
            console.error('Error checking if can accept invitation:', error);
            return {
                canAccept: false,
                reason: 'エラーが発生しました'
            };
        }
    }

    // 共有ユーザー管理
    getSharedUsers(fundSourceId) {
        try {
            const fundSource = this.storage.getFundSources().find(fs => fs.id === fundSourceId);
            return fundSource ? (fundSource.sharedWith || []) : [];
        } catch (error) {
            console.error('Error getting shared users:', error);
            return [];
        }
    }

    updateUserPermissions(fundSourceId, userId, permissions) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);
            
            if (!fundSource) {
                throw new Error('指定された資金元が見つかりません');
            }

            // Check permissions
            if (fundSource.ownerId !== currentUser.id) {
                throw new Error('権限を変更する権限がありません');
            }

            // Update user permissions
            const userIndex = fundSource.sharedWith.findIndex(user => user.userId === userId);
            if (userIndex !== -1) {
                fundSource.sharedWith[userIndex].permissions = permissions;
                fundSource.updatedAt = new Date();

                // Update fund source
                const fundSourceIndex = fundSources.findIndex(fs => fs.id === fundSourceId);
                fundSources[fundSourceIndex] = fundSource;
                this.storage.setFundSources(fundSources);

                return fundSource.sharedWith[userIndex];
            }

            throw new Error('指定されたユーザーが見つかりません');

        } catch (error) {
            console.error('Error updating user permissions:', error);
            throw error;
        }
    }

    removeSharedUser(fundSourceId, userId) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);
            
            if (!fundSource) {
                throw new Error('指定された資金元が見つかりません');
            }

            // Check permissions (owner or the user themselves)
            if (fundSource.ownerId !== currentUser.id && userId !== currentUser.id) {
                throw new Error('ユーザーを削除する権限がありません');
            }

            // Remove user
            fundSource.sharedWith = fundSource.sharedWith.filter(user => user.userId !== userId);
            
            // If no more shared users, disable sharing
            if (fundSource.sharedWith.length === 0) {
                fundSource.isShared = false;
            }

            fundSource.updatedAt = new Date();

            // Update fund source
            const fundSourceIndex = fundSources.findIndex(fs => fs.id === fundSourceId);
            fundSources[fundSourceIndex] = fundSource;
            this.storage.setFundSources(fundSources);

            return true;

        } catch (error) {
            console.error('Error removing shared user:', error);
            throw error;
        }
    }

    // Helper methods
    updateRelatedTransactionSharing(fundSourceId, isShared) {
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
            console.error('Error updating related transaction sharing:', error);
        }
    }

    // Get all fund sources shared with current user
    getSharedFundSources() {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                return [];
            }

            const fundSources = this.storage.getFundSources();
            return fundSources.filter(fs => 
                fs.isShared && 
                fs.sharedWith && 
                fs.sharedWith.some(user => user.userId === currentUser.id)
            );

        } catch (error) {
            console.error('Error getting shared fund sources:', error);
            return [];
        }
    }

    // Get all fund sources owned by current user
    getOwnedFundSources() {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                return [];
            }

            const fundSources = this.storage.getFundSources();
            return fundSources.filter(fs => fs.ownerId === currentUser.id);

        } catch (error) {
            console.error('Error getting owned fund sources:', error);
            return [];
        }
    }

    // 共有データ同期機能 (Task 5.2)
    
    // 共有取引の作成時同期処理
    syncSharedTransactionCreation(transactionData) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            // Check if transaction is for a shared fund source
            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === transactionData.fundSourceId);
            
            if (!fundSource || !fundSource.isShared) {
                // Not a shared fund source, no sync needed
                return { synced: false, reason: 'Not a shared fund source' };
            }

            // Validate user has permission to create transactions
            if (!this.permissionManager.canViewFundSource(currentUser.id, transactionData.fundSourceId)) {
                throw new Error('この資金元にアクセスする権限がありません');
            }

            const userPermissions = this.permissionManager.getUserPermissions(currentUser.id, transactionData.fundSourceId, fundSources);
            if (!userPermissions || !userPermissions.canEdit) {
                throw new Error('この資金元で取引を作成する権限がありません');
            }

            // Add sharing metadata to transaction
            const syncedTransactionData = {
                ...transactionData,
                isShared: true,
                sharedFundSourceId: transactionData.fundSourceId,
                createdBy: currentUser.id,
                createdByUsername: currentUser.username || currentUser.email,
                syncedAt: new Date(),
                lastSyncBy: currentUser.id
            };

            // Update fund source balance if needed
            this.updateFundSourceBalance(transactionData.fundSourceId, transactionData.amount);

            // Log sync activity
            this.logSyncActivity('transaction_created', {
                transactionId: transactionData.id,
                fundSourceId: transactionData.fundSourceId,
                userId: currentUser.id,
                amount: transactionData.amount
            });

            return {
                synced: true,
                transactionData: syncedTransactionData,
                syncedAt: new Date()
            };

        } catch (error) {
            console.error('Error syncing shared transaction creation:', error);
            throw error;
        }
    }

    // 共有設定変更時の同期処理
    syncSharingSettingsChange(fundSourceId, oldSettings, newSettings) {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            const fundSources = this.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);
            
            if (!fundSource) {
                throw new Error('指定された資金元が見つかりません');
            }

            // Check permission to modify sharing settings
            if (fundSource.ownerId !== currentUser.id) {
                throw new Error('共有設定を変更する権限がありません');
            }

            const syncResults = [];

            // Sync sharing status changes
            if (oldSettings.isShared !== newSettings.isShared) {
                const transactionSyncResult = this.syncTransactionSharingStatus(fundSourceId, newSettings.isShared);
                syncResults.push({
                    type: 'transaction_sharing_status',
                    result: transactionSyncResult
                });
            }

            // Sync shared user changes
            if (JSON.stringify(oldSettings.sharedWith) !== JSON.stringify(newSettings.sharedWith)) {
                const userSyncResult = this.syncSharedUserChanges(fundSourceId, oldSettings.sharedWith, newSettings.sharedWith);
                syncResults.push({
                    type: 'shared_users',
                    result: userSyncResult
                });
            }

            // Sync permission changes
            if (JSON.stringify(oldSettings.permissions) !== JSON.stringify(newSettings.permissions)) {
                const permissionSyncResult = this.syncPermissionChanges(fundSourceId, oldSettings.permissions, newSettings.permissions);
                syncResults.push({
                    type: 'permissions',
                    result: permissionSyncResult
                });
            }

            // Log sync activity
            this.logSyncActivity('sharing_settings_changed', {
                fundSourceId: fundSourceId,
                userId: currentUser.id,
                changes: syncResults.length,
                oldSettings: oldSettings,
                newSettings: newSettings
            });

            return {
                synced: true,
                syncResults: syncResults,
                syncedAt: new Date(),
                syncedBy: currentUser.id
            };

        } catch (error) {
            console.error('Error syncing sharing settings change:', error);
            throw error;
        }
    }

    // データ整合性チェック機能
    checkDataIntegrity() {
        try {
            const issues = [];
            const currentUser = this.authManager.getCurrentUser();
            
            if (!currentUser) {
                return { hasIssues: false, issues: [], checkedAt: new Date() };
            }

            // Check for orphaned shared transactions
            const orphanedTransactions = this.findOrphanedSharedTransactions();
            if (orphanedTransactions.length > 0) {
                issues.push({
                    type: 'orphaned_shared_transactions',
                    count: orphanedTransactions.length,
                    description: '共有資金元が存在しない共有取引があります',
                    severity: 'high',
                    transactions: orphanedTransactions
                });
            }

            // Check for inconsistent sharing flags
            const inconsistentTransactions = this.findInconsistentSharingFlags();
            if (inconsistentTransactions.length > 0) {
                issues.push({
                    type: 'inconsistent_sharing_flags',
                    count: inconsistentTransactions.length,
                    description: '共有フラグが不整合な取引があります',
                    severity: 'medium',
                    transactions: inconsistentTransactions
                });
            }

            // Check for invalid shared users
            const invalidSharedUsers = this.findInvalidSharedUsers();
            if (invalidSharedUsers.length > 0) {
                issues.push({
                    type: 'invalid_shared_users',
                    count: invalidSharedUsers.length,
                    description: '無効な共有ユーザーが存在します',
                    severity: 'medium',
                    users: invalidSharedUsers
                });
            }

            // Check for expired invitations that should be cleaned up
            const expiredInvitations = this.findExpiredInvitations();
            if (expiredInvitations.length > 0) {
                issues.push({
                    type: 'expired_invitations',
                    count: expiredInvitations.length,
                    description: '期限切れの招待が残っています',
                    severity: 'low',
                    invitations: expiredInvitations
                });
            }

            // Check for permission inconsistencies
            const permissionIssues = this.findPermissionInconsistencies();
            if (permissionIssues.length > 0) {
                issues.push({
                    type: 'permission_inconsistencies',
                    count: permissionIssues.length,
                    description: '権限設定に不整合があります',
                    severity: 'high',
                    issues: permissionIssues
                });
            }

            return {
                hasIssues: issues.length > 0,
                issues: issues,
                checkedAt: new Date(),
                checkedBy: currentUser.id
            };

        } catch (error) {
            console.error('Error checking data integrity:', error);
            return {
                hasIssues: true,
                issues: [{
                    type: 'integrity_check_error',
                    description: 'データ整合性チェック中にエラーが発生しました',
                    severity: 'high',
                    error: error.message
                }],
                checkedAt: new Date()
            };
        }
    }

    // Helper methods for data synchronization

    syncTransactionSharingStatus(fundSourceId, isShared) {
        try {
            const transactions = this.storage.getTransactions();
            let updatedCount = 0;

            for (const transaction of transactions) {
                if (transaction.fundSourceId === fundSourceId) {
                    transaction.isShared = isShared;
                    transaction.updatedAt = new Date();
                    if (isShared) {
                        transaction.sharedFundSourceId = fundSourceId;
                    } else {
                        delete transaction.sharedFundSourceId;
                    }
                    updatedCount++;
                }
            }

            if (updatedCount > 0) {
                this.storage.setTransactions(transactions);
            }

            return {
                success: true,
                updatedTransactions: updatedCount
            };

        } catch (error) {
            console.error('Error syncing transaction sharing status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    syncSharedUserChanges(fundSourceId, oldSharedWith, newSharedWith) {
        try {
            const results = {
                added: [],
                removed: [],
                updated: []
            };

            // Find added users
            const addedUsers = newSharedWith.filter(newUser => 
                !oldSharedWith.some(oldUser => 
                    (typeof oldUser === 'object' ? oldUser.userId : oldUser) === 
                    (typeof newUser === 'object' ? newUser.userId : newUser)
                )
            );

            // Find removed users
            const removedUsers = oldSharedWith.filter(oldUser => 
                !newSharedWith.some(newUser => 
                    (typeof oldUser === 'object' ? oldUser.userId : oldUser) === 
                    (typeof newUser === 'object' ? newUser.userId : newUser)
                )
            );

            // Process added users
            for (const user of addedUsers) {
                try {
                    this.notifyUserAdded(fundSourceId, user);
                    results.added.push(user);
                } catch (error) {
                    console.error('Error notifying added user:', error);
                }
            }

            // Process removed users
            for (const user of removedUsers) {
                try {
                    this.notifyUserRemoved(fundSourceId, user);
                    results.removed.push(user);
                } catch (error) {
                    console.error('Error notifying removed user:', error);
                }
            }

            return {
                success: true,
                results: results
            };

        } catch (error) {
            console.error('Error syncing shared user changes:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    syncPermissionChanges(fundSourceId, oldPermissions, newPermissions) {
        try {
            const changes = [];

            // Compare permissions
            const permissionKeys = ['canView', 'canEdit', 'canDelete'];
            for (const key of permissionKeys) {
                if (oldPermissions[key] !== newPermissions[key]) {
                    changes.push({
                        permission: key,
                        oldValue: oldPermissions[key],
                        newValue: newPermissions[key]
                    });
                }
            }

            // Update related data based on permission changes
            if (changes.some(c => c.permission === 'canEdit' && !c.newValue)) {
                // If edit permission was removed, ensure no pending edits
                this.cancelPendingEdits(fundSourceId);
            }

            return {
                success: true,
                changes: changes
            };

        } catch (error) {
            console.error('Error syncing permission changes:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper methods for data integrity checks

    findOrphanedSharedTransactions() {
        try {
            const transactions = this.storage.getTransactions();
            const fundSources = this.storage.getFundSources();
            
            return transactions.filter(transaction => {
                if (!transaction.isShared) return false;
                
                const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
                return !fundSource || !fundSource.isShared;
            });

        } catch (error) {
            console.error('Error finding orphaned shared transactions:', error);
            return [];
        }
    }

    findInconsistentSharingFlags() {
        try {
            const transactions = this.storage.getTransactions();
            const fundSources = this.storage.getFundSources();
            
            return transactions.filter(transaction => {
                const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
                if (!fundSource) return false;
                
                // Transaction should be shared if fund source is shared
                return fundSource.isShared !== (transaction.isShared || false);
            });

        } catch (error) {
            console.error('Error finding inconsistent sharing flags:', error);
            return [];
        }
    }

    findInvalidSharedUsers() {
        try {
            const fundSources = this.storage.getFundSources();
            const invalidUsers = [];
            
            for (const fundSource of fundSources) {
                if (!fundSource.isShared || !fundSource.sharedWith) continue;
                
                for (const user of fundSource.sharedWith) {
                    // Check if user object has required fields
                    if (typeof user === 'object') {
                        if (!user.userId || !user.email) {
                            invalidUsers.push({
                                fundSourceId: fundSource.id,
                                user: user,
                                reason: 'Missing required fields'
                            });
                        }
                    } else if (typeof user === 'string') {
                        // Old format - should be migrated
                        invalidUsers.push({
                            fundSourceId: fundSource.id,
                            user: user,
                            reason: 'Old format - needs migration'
                        });
                    }
                }
            }
            
            return invalidUsers;

        } catch (error) {
            console.error('Error finding invalid shared users:', error);
            return [];
        }
    }

    findExpiredInvitations() {
        try {
            if (!this.invitationManager) return [];
            
            const allInvitations = this.invitationManager.getInvitations();
            const now = new Date();
            
            return allInvitations.filter(invitation => {
                if (invitation.status !== 'pending') return false;
                
                const expiresAt = new Date(invitation.expiresAt);
                return expiresAt < now;
            });

        } catch (error) {
            console.error('Error finding expired invitations:', error);
            return [];
        }
    }

    findPermissionInconsistencies() {
        try {
            const fundSources = this.storage.getFundSources();
            const issues = [];
            
            for (const fundSource of fundSources) {
                if (!fundSource.isShared) continue;
                
                // Check if default permissions exist
                if (!fundSource.permissions) {
                    issues.push({
                        fundSourceId: fundSource.id,
                        issue: 'Missing default permissions'
                    });
                }
                
                // Check shared user permissions
                if (fundSource.sharedWith) {
                    for (const user of fundSource.sharedWith) {
                        if (typeof user === 'object' && user.permissions) {
                            const validationErrors = this.permissionManager.validatePermissions(user.permissions);
                            if (validationErrors.length > 0) {
                                issues.push({
                                    fundSourceId: fundSource.id,
                                    userId: user.userId,
                                    issue: 'Invalid user permissions',
                                    errors: validationErrors
                                });
                            }
                        }
                    }
                }
            }
            
            return issues;

        } catch (error) {
            console.error('Error finding permission inconsistencies:', error);
            return [];
        }
    }

    // Utility methods for synchronization

    updateFundSourceBalance(fundSourceId, transactionAmount) {
        try {
            const fundSources = this.storage.getFundSources();
            const fundSourceIndex = fundSources.findIndex(fs => fs.id === fundSourceId);
            
            if (fundSourceIndex !== -1) {
                fundSources[fundSourceIndex].balance += transactionAmount;
                fundSources[fundSourceIndex].updatedAt = new Date();
                this.storage.setFundSources(fundSources);
            }

        } catch (error) {
            console.error('Error updating fund source balance:', error);
        }
    }

    notifyUserAdded(fundSourceId, user) {
        // Placeholder for user notification logic
        console.log(`User ${user.email || user} added to fund source ${fundSourceId}`);
    }

    notifyUserRemoved(fundSourceId, user) {
        // Placeholder for user notification logic
        console.log(`User ${user.email || user} removed from fund source ${fundSourceId}`);
    }

    cancelPendingEdits(fundSourceId) {
        // Placeholder for cancelling pending edits
        console.log(`Cancelled pending edits for fund source ${fundSourceId}`);
    }

    logSyncActivity(activityType, details) {
        try {
            const logEntry = {
                id: this.storage.generateId(),
                type: activityType,
                details: details,
                timestamp: new Date(),
                userId: details.userId
            };

            // Store in sync log (if implemented)
            console.log('Sync activity:', logEntry);

        } catch (error) {
            console.error('Error logging sync activity:', error);
        }
    }

    // Auto-sync methods

    enableAutoSync() {
        this.autoSyncEnabled = true;
        console.log('Auto-sync enabled for sharing data');
    }

    disableAutoSync() {
        this.autoSyncEnabled = false;
        console.log('Auto-sync disabled for sharing data');
    }

    isAutoSyncEnabled() {
        return this.autoSyncEnabled || false;
    }

    // Manual sync trigger
    performManualSync() {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('ログインが必要です');
            }

            const syncResults = [];

            // Check and fix data integrity issues
            const integrityCheck = this.checkDataIntegrity();
            if (integrityCheck.hasIssues) {
                const fixResults = this.fixDataIntegrityIssues(integrityCheck.issues);
                syncResults.push({
                    type: 'integrity_fixes',
                    result: fixResults
                });
            }

            // Clean up expired invitations
            if (this.invitationManager) {
                const cleanupResult = this.invitationManager.cleanupExpiredInvitations();
                syncResults.push({
                    type: 'invitation_cleanup',
                    result: cleanupResult
                });
            }

            return {
                success: true,
                syncResults: syncResults,
                syncedAt: new Date(),
                syncedBy: currentUser.id
            };

        } catch (error) {
            console.error('Error performing manual sync:', error);
            return {
                success: false,
                error: error.message,
                syncedAt: new Date()
            };
        }
    }

    // Fix data integrity issues
    fixDataIntegrityIssues(issues) {
        const fixResults = [];

        for (const issue of issues) {
            try {
                switch (issue.type) {
                    case 'orphaned_shared_transactions':
                        const orphanedFix = this.fixOrphanedSharedTransactions(issue.transactions);
                        fixResults.push({ type: issue.type, result: orphanedFix });
                        break;
                        
                    case 'inconsistent_sharing_flags':
                        const flagFix = this.fixInconsistentSharingFlags(issue.transactions);
                        fixResults.push({ type: issue.type, result: flagFix });
                        break;
                        
                    case 'expired_invitations':
                        const expiredFix = this.fixExpiredInvitations(issue.invitations);
                        fixResults.push({ type: issue.type, result: expiredFix });
                        break;
                        
                    default:
                        console.log(`No automatic fix available for issue type: ${issue.type}`);
                }
            } catch (error) {
                console.error(`Error fixing issue ${issue.type}:`, error);
                fixResults.push({ 
                    type: issue.type, 
                    result: { success: false, error: error.message } 
                });
            }
        }

        return fixResults;
    }

    fixOrphanedSharedTransactions(orphanedTransactions) {
        try {
            const transactions = this.storage.getTransactions();
            let fixedCount = 0;

            for (const orphaned of orphanedTransactions) {
                const transactionIndex = transactions.findIndex(t => t.id === orphaned.id);
                if (transactionIndex !== -1) {
                    // Remove sharing flag from orphaned transactions
                    transactions[transactionIndex].isShared = false;
                    delete transactions[transactionIndex].sharedFundSourceId;
                    transactions[transactionIndex].updatedAt = new Date();
                    fixedCount++;
                }
            }

            if (fixedCount > 0) {
                this.storage.setTransactions(transactions);
            }

            return { success: true, fixedCount: fixedCount };

        } catch (error) {
            console.error('Error fixing orphaned shared transactions:', error);
            return { success: false, error: error.message };
        }
    }

    fixInconsistentSharingFlags(inconsistentTransactions) {
        try {
            const transactions = this.storage.getTransactions();
            const fundSources = this.storage.getFundSources();
            let fixedCount = 0;

            for (const inconsistent of inconsistentTransactions) {
                const transactionIndex = transactions.findIndex(t => t.id === inconsistent.id);
                const fundSource = fundSources.find(fs => fs.id === inconsistent.fundSourceId);
                
                if (transactionIndex !== -1 && fundSource) {
                    // Sync transaction sharing flag with fund source
                    transactions[transactionIndex].isShared = fundSource.isShared;
                    if (fundSource.isShared) {
                        transactions[transactionIndex].sharedFundSourceId = fundSource.id;
                    } else {
                        delete transactions[transactionIndex].sharedFundSourceId;
                    }
                    transactions[transactionIndex].updatedAt = new Date();
                    fixedCount++;
                }
            }

            if (fixedCount > 0) {
                this.storage.setTransactions(transactions);
            }

            return { success: true, fixedCount: fixedCount };

        } catch (error) {
            console.error('Error fixing inconsistent sharing flags:', error);
            return { success: false, error: error.message };
        }
    }

    fixExpiredInvitations(expiredInvitations) {
        try {
            if (!this.invitationManager) {
                return { success: false, error: 'Invitation manager not available' };
            }

            let fixedCount = 0;

            for (const expired of expiredInvitations) {
                try {
                    this.invitationManager.updateInvitationStatus(expired.id, 'expired');
                    fixedCount++;
                } catch (error) {
                    console.error(`Error expiring invitation ${expired.id}:`, error);
                }
            }

            return { success: true, fixedCount: fixedCount };

        } catch (error) {
            console.error('Error fixing expired invitations:', error);
            return { success: false, error: error.message };
        }
    }

    // Performance Optimization Methods

    // Periodic performance cleanup
    performPerformanceCleanup() {
        try {
            // Clean up caches
            if (this.cache) {
                this.cache.cleanupExpired();
            }
            
            if (this.dataOptimizer) {
                this.dataOptimizer.performMemoryCleanup();
            }
            
            // Clean up UI optimizer
            if (this.uiOptimizer) {
                // Clean up old performance metrics
                if (this.uiOptimizer.performanceMetrics.frameCount > 1000) {
                    this.uiOptimizer.performanceMetrics.frameCount = 0;
                    this.uiOptimizer.performanceMetrics.slowFrames = 0;
                }
            }
            
            // Log performance status
            if (this.performanceMonitor) {
                const report = this.performanceMonitor.getPerformanceReport();
                if (report.summary.performanceGrade === 'poor') {
                    console.warn('Sharing system performance is poor. Consider optimizations.');
                }
            }
            
        } catch (error) {
            console.error('Error during performance cleanup:', error);
        }
    }

    // Optimized transaction sharing update
    updateRelatedTransactionSharingOptimized(fundSourceId, isShared) {
        if (this.dataOptimizer) {
            // Use batch operation for better performance
            this.dataOptimizer.batchOperation({
                type: 'updateTransactionSharing',
                fundSourceId: fundSourceId,
                isShared: isShared,
                execute: () => this.updateRelatedTransactionSharing(fundSourceId, isShared)
            });
        } else {
            // Fallback to original method
            this.updateRelatedTransactionSharing(fundSourceId, isShared);
        }
    }

    // Optimized fund source retrieval with caching
    getFundSourcesOptimized(useCache = true) {
        return this.dataOptimizer ? 
            this.dataOptimizer.getFundSources(useCache) : 
            this.storage.getFundSources();
    }

    // Optimized shared user retrieval
    getSharedUsersOptimized(fundSourceId, useCache = true) {
        const cacheKey = `sharedUsers_${fundSourceId}`;
        
        if (useCache && this.cache) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const fundSources = this.getFundSourcesOptimized(useCache);
        const fundSource = fundSources.find(fs => fs.id === fundSourceId);
        const sharedUsers = fundSource ? (fundSource.sharedWith || []) : [];

        if (useCache && this.cache) {
            this.cache.set(cacheKey, sharedUsers, 2 * 60 * 1000); // 2 minutes TTL
        }

        return sharedUsers;
    }

    // Optimized invitation retrieval
    getInvitationsOptimized(status = null, useCache = true) {
        const cacheKey = status ? `invitations_${status}` : 'invitations_all';
        
        if (useCache && this.cache) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const invitations = this.invitationManager ? 
            this.invitationManager.getInvitations(status) : [];

        if (useCache && this.cache) {
            this.cache.set(cacheKey, invitations, 1 * 60 * 1000); // 1 minute TTL
        }

        return invitations;
    }

    // Batch sharing operations for better performance
    batchSharingOperations(operations) {
        if (!this.dataOptimizer) {
            // Fallback: execute operations individually
            return operations.map(op => op.execute());
        }

        // Group operations by type
        const groupedOps = {};
        operations.forEach(op => {
            if (!groupedOps[op.type]) {
                groupedOps[op.type] = [];
            }
            groupedOps[op.type].push(op);
        });

        const results = [];

        // Execute grouped operations
        Object.entries(groupedOps).forEach(([type, ops]) => {
            switch (type) {
                case 'shareFundSource':
                    results.push(...this.batchShareFundSources(ops));
                    break;
                case 'sendInvitation':
                    results.push(...this.batchSendInvitations(ops));
                    break;
                case 'updatePermissions':
                    results.push(...this.batchUpdatePermissions(ops));
                    break;
                default:
                    results.push(...ops.map(op => op.execute()));
            }
        });

        return results;
    }

    // Batch share multiple fund sources
    batchShareFundSources(operations) {
        const results = [];
        const fundSources = this.getFundSourcesOptimized(false); // Don't use cache for updates
        let fundSourcesUpdated = false;

        operations.forEach(op => {
            try {
                const fundSource = fundSources.find(fs => fs.id === op.fundSourceId);
                if (fundSource) {
                    // Apply sharing updates
                    fundSource.isShared = true;
                    fundSource.sharedWith = op.sharedWith || [];
                    fundSource.permissions = op.permissions;
                    fundSource.updatedAt = new Date();
                    fundSourcesUpdated = true;

                    results.push({
                        success: true,
                        fundSourceId: op.fundSourceId,
                        result: fundSource
                    });
                } else {
                    results.push({
                        success: false,
                        fundSourceId: op.fundSourceId,
                        error: '資金元が見つかりません'
                    });
                }
            } catch (error) {
                results.push({
                    success: false,
                    fundSourceId: op.fundSourceId,
                    error: error.message
                });
            }
        });

        // Save all changes at once
        if (fundSourcesUpdated) {
            this.storage.setFundSources(fundSources);
        }

        return results;
    }

    // Batch send multiple invitations
    batchSendInvitations(operations) {
        const results = [];

        operations.forEach(op => {
            try {
                const invitation = this.sendInvitation(op.fundSourceId, op.email, op.permissions);
                results.push({
                    success: true,
                    email: op.email,
                    invitation: invitation
                });
            } catch (error) {
                results.push({
                    success: false,
                    email: op.email,
                    error: error.message
                });
            }
        });

        return results;
    }

    // Batch update permissions
    batchUpdatePermissions(operations) {
        const results = [];
        const fundSources = this.getFundSourcesOptimized(false);
        let fundSourcesUpdated = false;

        operations.forEach(op => {
            try {
                const fundSource = fundSources.find(fs => fs.id === op.fundSourceId);
                if (fundSource && fundSource.sharedWith) {
                    const userIndex = fundSource.sharedWith.findIndex(user => user.userId === op.userId);
                    if (userIndex !== -1) {
                        fundSource.sharedWith[userIndex].permissions = op.permissions;
                        fundSource.updatedAt = new Date();
                        fundSourcesUpdated = true;

                        results.push({
                            success: true,
                            fundSourceId: op.fundSourceId,
                            userId: op.userId,
                            permissions: op.permissions
                        });
                    } else {
                        results.push({
                            success: false,
                            fundSourceId: op.fundSourceId,
                            userId: op.userId,
                            error: 'ユーザーが見つかりません'
                        });
                    }
                } else {
                    results.push({
                        success: false,
                        fundSourceId: op.fundSourceId,
                        userId: op.userId,
                        error: '資金元が見つかりません'
                    });
                }
            } catch (error) {
                results.push({
                    success: false,
                    fundSourceId: op.fundSourceId,
                    userId: op.userId,
                    error: error.message
                });
            }
        });

        if (fundSourcesUpdated) {
            this.storage.setFundSources(fundSources);
        }

        return results;
    }

    // Optimized UI update method
    updateSharingUI() {
        // This method would be implemented to update sharing-related UI elements
        // It's called through the debounced update mechanism
        if (window.uiManager && window.uiManager.updateSharingDisplay) {
            window.uiManager.updateSharingDisplay();
        }
    }

    // Performance monitoring methods
    getPerformanceMetrics() {
        return {
            cache: this.cache ? this.cache.getStats() : null,
            dataOptimizer: this.dataOptimizer ? this.dataOptimizer.getCacheStats() : null,
            uiOptimizer: this.uiOptimizer ? this.uiOptimizer.getPerformanceMetrics() : null
        };
    }

    // Enhanced sharing operations with improved UI responsiveness (Task 12.2)
    
    // Enhanced share fund source with optimistic UI and progress indicators
    async shareFundSourceEnhanced(fundSourceId, userEmails, permissions) {
        return this.enhancedOperations.shareFundSource(fundSourceId, userEmails, permissions);
    }

    // Enhanced send invitation with progress tracking
    async sendInvitationEnhanced(fundSourceId, userEmail, permissions) {
        return this.enhancedOperations.sendInvitation(fundSourceId, userEmail, permissions);
    }

    // Enhanced accept invitation with optimistic UI
    async acceptInvitationEnhanced(invitationToken) {
        return this.enhancedOperations.acceptInvitation(invitationToken);
    }

    // Batch operations with progress tracking
    async performBatchSharingOperations(operations) {
        return this.enhancedOperations.batchOperations(operations);
    }

    // Enhanced data sync with progress indication
    async performEnhancedSync(options = {}) {
        const progressId = 'enhanced-sync';
        
        try {
            // Show progress indicator
            this.uiEnhancer.progressSystem.create(progressId, {
                type: 'bar',
                message: 'データを同期中...',
                cancellable: false
            });

            let progress = 0;
            const steps = [
                { name: 'データ整合性チェック', weight: 30 },
                { name: '期限切れ招待のクリーンアップ', weight: 20 },
                { name: 'キャッシュの最適化', weight: 25 },
                { name: '関連データの同期', weight: 25 }
            ];

            const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
            let completedWeight = 0;

            // Step 1: Data integrity check
            this.uiEnhancer.progressSystem.update(progressId, progress, steps[0].name);
            const integrityCheck = await this.checkDataIntegrityOptimized();
            completedWeight += steps[0].weight;
            progress = (completedWeight / totalWeight) * 100;
            this.uiEnhancer.progressSystem.update(progressId, progress, `${steps[0].name} 完了`);

            // Step 2: Clean up expired invitations
            this.uiEnhancer.progressSystem.update(progressId, progress, steps[1].name);
            if (this.invitationManager) {
                await new Promise(resolve => {
                    setTimeout(() => {
                        this.invitationManager.cleanupExpiredInvitations();
                        resolve();
                    }, 100);
                });
            }
            completedWeight += steps[1].weight;
            progress = (completedWeight / totalWeight) * 100;
            this.uiEnhancer.progressSystem.update(progressId, progress, `${steps[1].name} 完了`);

            // Step 3: Optimize cache
            this.uiEnhancer.progressSystem.update(progressId, progress, steps[2].name);
            await new Promise(resolve => {
                setTimeout(() => {
                    if (this.cache) {
                        this.cache.cleanupExpired();
                    }
                    resolve();
                }, 100);
            });
            completedWeight += steps[2].weight;
            progress = (completedWeight / totalWeight) * 100;
            this.uiEnhancer.progressSystem.update(progressId, progress, `${steps[2].name} 完了`);

            // Step 4: Sync related data
            this.uiEnhancer.progressSystem.update(progressId, progress, steps[3].name);
            await new Promise(resolve => {
                setTimeout(() => {
                    if (this.dataOptimizer) {
                        this.dataOptimizer.preloadCommonData();
                    }
                    resolve();
                }, 100);
            });
            completedWeight += steps[3].weight;
            progress = 100;
            
            // Complete
            this.uiEnhancer.progressSystem.complete(progressId, 'データ同期が完了しました');

            return {
                success: true,
                integrityCheck,
                syncedAt: new Date()
            };

        } catch (error) {
            this.uiEnhancer.progressSystem.error(progressId, 'データ同期でエラーが発生しました');
            throw error;
        }
    }

    // Enhanced UI update with debouncing and optimization
    updateSharingUIEnhanced() {
        if (this.uiOptimizer) {
            this.uiOptimizer.debounceUpdate('sharing-ui-update', () => {
                this.updateSharingUI();
            }, 150);
        } else {
            this.updateSharingUI();
        }
    }

    // Get enhanced performance metrics
    getEnhancedPerformanceMetrics() {
        return {
            ...this.getPerformanceMetrics(),
            uiEnhancer: this.uiEnhancer ? this.uiEnhancer.getPerformanceMetrics() : null,
            responsiveness: {
                progressIndicators: this.uiEnhancer ? this.uiEnhancer.progressIndicators.size : 0,
                optimisticUpdates: this.uiEnhancer ? this.uiEnhancer.optimisticUpdates.size : 0,
                asyncOperations: this.uiEnhancer ? this.uiEnhancer.asyncOperations.size : 0
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
        if (this.uiEnhancer) {
            this.uiEnhancer.cleanup();
        }
    }

    // Optimize data integrity check for better performance
    checkDataIntegrityOptimized() {
        return new Promise((resolve) => {
            // Use UI optimizer to queue this potentially expensive operation
            this.uiOptimizer.queueUpdate(() => {
                try {
                    const result = this.checkDataIntegrity();
                    resolve(result);
                } catch (error) {
                    resolve({
                        hasIssues: true,
                        issues: [{
                            type: 'integrity_check_error',
                            description: 'データ整合性チェック中にエラーが発生しました',
                            severity: 'high',
                            error: error.message
                        }],
                        checkedAt: new Date()
                    });
                }
            }, 'low'); // Low priority to not block UI
        });
    }

    // Optimized manual sync with progress tracking
    performManualSyncOptimized(progressCallback = null) {
        return new Promise((resolve) => {
            const steps = [
                { name: 'データ整合性チェック', weight: 30 },
                { name: '期限切れ招待のクリーンアップ', weight: 20 },
                { name: 'キャッシュの最適化', weight: 25 },
                { name: '関連データの同期', weight: 25 }
            ];

            let completedWeight = 0;
            const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);

            const updateProgress = (stepName, stepWeight) => {
                completedWeight += stepWeight;
                const progress = Math.round((completedWeight / totalWeight) * 100);
                if (progressCallback) {
                    progressCallback(progress, stepName);
                }
            };

            // Execute sync steps with progress tracking
            this.uiOptimizer.queueUpdate(async () => {
                try {
                    const syncResults = [];

                    // Step 1: Data integrity check
                    updateProgress(steps[0].name, 0);
                    const integrityCheck = await this.checkDataIntegrityOptimized();
                    if (integrityCheck.hasIssues) {
                        const fixResults = this.fixDataIntegrityIssues(integrityCheck.issues);
                        syncResults.push({ type: 'integrity_fixes', result: fixResults });
                    }
                    updateProgress(steps[0].name, steps[0].weight);

                    // Step 2: Clean up expired invitations
                    if (this.invitationManager) {
                        const cleanupResult = this.invitationManager.cleanupExpiredInvitations();
                        syncResults.push({ type: 'invitation_cleanup', result: cleanupResult });
                    }
                    updateProgress(steps[1].name, steps[1].weight);

                    // Step 3: Optimize cache
                    if (this.cache) {
                        this.cache.cleanupExpired();
                    }
                    updateProgress(steps[2].name, steps[2].weight);

                    // Step 4: Sync related data
                    if (this.dataOptimizer) {
                        this.dataOptimizer.preloadCommonData();
                    }
                    updateProgress(steps[3].name, steps[3].weight);

                    const currentUser = this.authManager.getCurrentUser();
                    resolve({
                        success: true,
                        syncResults: syncResults,
                        syncedAt: new Date(),
                        syncedBy: currentUser ? currentUser.id : null
                    });

                } catch (error) {
                    console.error('Error performing optimized manual sync:', error);
                    resolve({
                        success: false,
                        error: error.message,
                        syncedAt: new Date()
                    });
                }
            }, 'low');
        });
    }
}

// Export for global use
window.SharingManager = SharingManager;