// Invitation Manager - Handles invitation system
class InvitationManager {
    constructor(storage) {
        this.storage = storage;
        this.errorHandler = new SharingErrorHandler(storage);
    }

    // 招待トークン管理
    generateInvitationToken(fundSourceId, inviterUserId, inviteeEmail) {
        try {
            // Generate UUID v4-like token with better entropy
            const timestamp = Date.now().toString(36);
            const randomPart1 = Math.random().toString(36).substr(2, 9);
            const randomPart2 = Math.random().toString(36).substr(2, 9);
            const token = `inv_${timestamp}_${randomPart1}_${randomPart2}`;
            
            // Ensure token uniqueness by checking existing tokens
            const existingInvitations = this.getAllInvitations();
            const existingToken = existingInvitations.find(inv => inv.token === token);
            
            if (existingToken) {
                // Recursively generate new token if collision occurs
                return this.generateInvitationToken(fundSourceId, inviterUserId, inviteeEmail);
            }
            
            return token;
        } catch (error) {
            console.error('Error generating invitation token:', error);
            throw new Error('招待トークンの生成に失敗しました');
        }
    }

    validateToken(token) {
        try {
            if (!token || typeof token !== 'string') {
                return null;
            }

            const invitations = this.getAllInvitations();
            const invitation = invitations.find(inv => inv.token === token);

            if (!invitation) {
                return null;
            }

            // Check if invitation is still valid
            if (invitation.status !== 'pending') {
                return null;
            }

            // Check if invitation has expired
            const now = new Date();
            const expiresAt = new Date(invitation.expiresAt);
            
            if (now > expiresAt) {
                // Mark as expired
                this.updateInvitationStatus(invitation.id, 'expired');
                return null;
            }

            return invitation;

        } catch (error) {
            console.error('Error validating token:', error);
            return null;
        }
    }

    expireToken(token) {
        try {
            const invitations = this.getAllInvitations();
            const invitation = invitations.find(inv => inv.token === token);

            if (invitation) {
                return this.updateInvitationStatus(invitation.id, 'expired');
            }

            return false;

        } catch (error) {
            console.error('Error expiring token:', error);
            return false;
        }
    }

    // 招待状態管理
    createInvitation(invitationData) {
        try {
            // Enhanced validation with detailed security checks
            const validationResult = this.validateInvitationDataDetailed(invitationData);
            
            if (!validationResult.isValid) {
                throw new Error(validationResult.errors[0] || '招待データが無効です');
            }

            // Log warnings if any
            if (validationResult.warnings.length > 0) {
                console.warn('Invitation validation warnings:', validationResult.warnings);
            }

            // Security level check
            if (validationResult.securityLevel === 'low') {
                throw new Error('セキュリティレベルが低すぎるため招待を作成できません');
            }

            // Additional security validation
            if (window.SharingSecurityValidator) {
                const securityValidator = new window.SharingSecurityValidator();
                const securityResult = securityValidator.validateInvitationSecurity(invitationData);
                
                if (!securityResult.isSecure) {
                    throw new Error(securityResult.violations[0] || 'セキュリティ検証に失敗しました');
                }
            }

            const invitations = this.getAllInvitations();
            
            // Check for duplicate pending invitations
            const existingInvitation = invitations.find(inv => 
                inv.fundSourceId === invitationData.fundSourceId &&
                inv.inviteeEmail === invitationData.inviteeEmail &&
                inv.status === 'pending'
            );

            if (existingInvitation) {
                throw new Error('このユーザーには既に招待を送信済みです');
            }

            // Generate invitation
            // Ensure all required data is properly initialized
            if (!invitationData || typeof invitationData !== 'object') {
                throw new Error('招待データが無効です');
            }

            if (!invitationData.fundSourceId) {
                throw new Error('資金元IDが必要です');
            }

            if (!invitationData.inviterUserId) {
                throw new Error('招待者IDが必要です');
            }

            if (!invitationData.inviteeEmail) {
                throw new Error('招待先メールアドレスが必要です');
            }

            // Ensure storage is available and has required methods
            if (!this.storage || typeof this.storage.generateId !== 'function') {
                throw new Error('ストレージシステムが正しく初期化されていません');
            }

            const now = new Date();
            const invitation = {
                id: this.storage.generateId(),
                token: this.generateInvitationToken(
                    invitationData.fundSourceId, 
                    invitationData.inviterUserId, 
                    invitationData.inviteeEmail
                ),
                fundSourceId: invitationData.fundSourceId,
                inviterUserId: invitationData.inviterUserId,
                inviterUsername: invitationData.inviterUsername || 'ユーザー',
                inviteeEmail: invitationData.inviteeEmail,
                permissions: invitationData.permissions || {
                    canView: true,
                    canEdit: false,
                    canDelete: false
                },
                status: 'pending',
                createdAt: now,
                expiresAt: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes instead of 24 hours
                acceptedAt: null,
                updatedAt: now
            };

            invitations.push(invitation);
            this.setAllInvitations(invitations);

            return invitation;

        } catch (error) {
            const errorResult = this.errorHandler.handleError(error, {
                operation: 'createInvitation',
                fundSourceId: invitationData.fundSourceId,
                inviteeEmail: invitationData.inviteeEmail
            });
            
            // Re-throw if not recoverable
            if (!errorResult.recovery.successful) {
                throw error;
            }
            
            return errorResult;
        }
    }

    updateInvitationStatus(invitationId, status) {
        try {
            const validStatuses = ['pending', 'accepted', 'declined', 'expired', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error('無効なステータスです');
            }

            const invitations = this.getAllInvitations();
            const invitationIndex = invitations.findIndex(inv => inv.id === invitationId);

            if (invitationIndex === -1) {
                throw new Error('指定された招待が見つかりません');
            }

            const invitation = invitations[invitationIndex];
            invitation.status = status;
            invitation.updatedAt = new Date();

            if (status === 'accepted') {
                invitation.acceptedAt = new Date();
            }

            invitations[invitationIndex] = invitation;
            this.setAllInvitations(invitations);

            return invitation;

        } catch (error) {
            console.error('Error updating invitation status:', error);
            throw error;
        }
    }

    getInvitationByToken(token) {
        try {
            const invitations = this.getAllInvitations();
            return invitations.find(inv => inv.token === token) || null;
        } catch (error) {
            console.error('Error getting invitation by token:', error);
            return null;
        }
    }

    getInvitationById(invitationId) {
        try {
            const invitations = this.getAllInvitations();
            return invitations.find(inv => inv.id === invitationId) || null;
        } catch (error) {
            console.error('Error getting invitation by ID:', error);
            return null;
        }
    }

    getInvitations(status = null) {
        try {
            const invitations = this.getAllInvitations();
            
            if (status) {
                return invitations.filter(inv => inv.status === status);
            }
            
            return invitations;

        } catch (error) {
            console.error('Error getting invitations:', error);
            return [];
        }
    }

    // Get invitations sent by a specific user
    getInvitationsBySender(userId) {
        try {
            const invitations = this.getAllInvitations();
            return invitations.filter(inv => inv.inviterUserId === userId);
        } catch (error) {
            console.error('Error getting invitations by sender:', error);
            return [];
        }
    }

    // Get invitations for a specific email
    getInvitationsByEmail(email) {
        try {
            const invitations = this.getAllInvitations();
            return invitations.filter(inv => inv.inviteeEmail === email);
        } catch (error) {
            console.error('Error getting invitations by email:', error);
            return [];
        }
    }

    // Get invitations for a specific fund source
    getInvitationsByFundSource(fundSourceId) {
        try {
            const invitations = this.getAllInvitations();
            return invitations.filter(inv => inv.fundSourceId === fundSourceId);
        } catch (error) {
            console.error('Error getting invitations by fund source:', error);
            return [];
        }
    }

    cleanupExpiredInvitations() {
        try {
            const invitations = this.getAllInvitations();
            const now = new Date();
            let cleaned = false;

            for (const invitation of invitations) {
                if (invitation.status === 'pending') {
                    const expiresAt = new Date(invitation.expiresAt);
                    if (now > expiresAt) {
                        invitation.status = 'expired';
                        invitation.updatedAt = new Date();
                        cleaned = true;
                    }
                }
            }

            if (cleaned) {
                this.setAllInvitations(invitations);
                console.log('Expired invitations cleaned up');
            }

            return cleaned;

        } catch (error) {
            console.error('Error cleaning up expired invitations:', error);
            return false;
        }
    }

    // Delete old invitations (older than 30 days)
    deleteOldInvitations(daysOld = 30) {
        try {
            const invitations = this.getAllInvitations();
            const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
            
            const filteredInvitations = invitations.filter(invitation => {
                const createdAt = new Date(invitation.createdAt);
                return createdAt > cutoffDate;
            });

            if (filteredInvitations.length < invitations.length) {
                this.setAllInvitations(filteredInvitations);
                const deletedCount = invitations.length - filteredInvitations.length;
                console.log(`Deleted ${deletedCount} old invitations`);
                return deletedCount;
            }

            return 0;

        } catch (error) {
            console.error('Error deleting old invitations:', error);
            return 0;
        }
    }

    // Get invitation statistics
    getInvitationStats(userId = null) {
        try {
            const invitations = userId 
                ? this.getInvitationsBySender(userId)
                : this.getAllInvitations();

            const stats = {
                total: invitations.length,
                pending: 0,
                accepted: 0,
                declined: 0,
                expired: 0,
                cancelled: 0
            };

            for (const invitation of invitations) {
                if (stats.hasOwnProperty(invitation.status)) {
                    stats[invitation.status]++;
                }
            }

            return stats;

        } catch (error) {
            console.error('Error getting invitation stats:', error);
            return {
                total: 0,
                pending: 0,
                accepted: 0,
                declined: 0,
                expired: 0,
                cancelled: 0
            };
        }
    }

    // Enhanced invitation data validation with security checks
    validateInvitationData(data) {
        const errors = [];
        const warnings = [];

        // Use enhanced validation from SharingValidation
        if (window.SharingValidation) {
            const validationResult = window.SharingValidation.validateInvitation(data);
            errors.push(...validationResult.errors);
            if (validationResult.warnings) {
                warnings.push(...validationResult.warnings);
            }
        } else {
            // Fallback to basic validation
            if (!data.fundSourceId) {
                errors.push('資金元IDが必要です');
            }

            if (!data.inviterUserId) {
                errors.push('招待者IDが必要です');
            }

            if (!data.inviteeEmail) {
                errors.push('招待先メールアドレスが必要です');
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.inviteeEmail)) {
                    errors.push('有効なメールアドレスを入力してください');
                }
            }

            if (data.permissions) {
                if (typeof data.permissions !== 'object') {
                    errors.push('権限設定が無効です');
                } else {
                    const requiredPermissions = ['canView', 'canEdit', 'canDelete'];
                    for (const perm of requiredPermissions) {
                        if (typeof data.permissions[perm] !== 'boolean') {
                            errors.push(`権限設定 ${perm} が無効です`);
                        }
                    }
                }
            }
        }

        // Additional security validation
        if (window.SharingSecurityValidator) {
            const securityValidator = new window.SharingSecurityValidator();
            const securityResult = securityValidator.validateInvitationSecurity(data);
            
            if (!securityResult.isSecure) {
                errors.push(...securityResult.violations);
                warnings.push(...securityResult.warnings);
            }
        }

        return { errors, warnings };
    }

    // Enhanced validation with detailed results
    validateInvitationDataDetailed(data) {
        const result = this.validateInvitationData(data);
        
        return {
            isValid: result.errors.length === 0,
            errors: result.errors,
            warnings: result.warnings || [],
            securityLevel: this.assessInvitationSecurityLevel(data, result.errors, result.warnings)
        };
    }

    // Assess security level of invitation
    assessInvitationSecurityLevel(data, errors, warnings) {
        if (errors.length > 0) {
            return 'low';
        }

        if (warnings.length > 3) {
            return 'medium';
        }

        if (warnings.length > 0) {
            return 'medium-high';
        }

        return 'high';
    }

    // Storage helper methods
    getAllInvitations() {
        try {
            return this.storage.getItem(this.storage.getUserKey('budget_invitations'), []);
        } catch (error) {
            console.error('Error getting all invitations:', error);
            return [];
        }
    }

    setAllInvitations(invitations) {
        try {
            return this.storage.setItem(this.storage.getUserKey('budget_invitations'), invitations);
        } catch (error) {
            console.error('Error setting all invitations:', error);
            return false;
        }
    }

    // Cancel invitation by ID
    cancelInvitation(invitationId) {
        try {
            const invitation = this.getInvitationById(invitationId);
            if (!invitation) {
                throw new Error('指定された招待が見つかりません');
            }

            if (invitation.status !== 'pending') {
                throw new Error('この招待はキャンセルできません');
            }

            return this.updateInvitationStatus(invitationId, 'cancelled');

        } catch (error) {
            console.error('Error cancelling invitation:', error);
            throw error;
        }
    }

    // Delete invitation permanently
    deleteInvitation(invitationId) {
        try {
            const invitations = this.getAllInvitations();
            const filteredInvitations = invitations.filter(inv => inv.id !== invitationId);
            
            if (filteredInvitations.length < invitations.length) {
                this.setAllInvitations(filteredInvitations);
                return true;
            }
            
            return false;

        } catch (error) {
            console.error('Error deleting invitation:', error);
            return false;
        }
    }

    // Check if user can be invited to fund source
    canInviteUser(fundSourceId, userEmail) {
        try {
            const invitations = this.getAllInvitations();
            
            // Check for existing pending invitation
            const existingInvitation = invitations.find(inv => 
                inv.fundSourceId === fundSourceId &&
                inv.inviteeEmail === userEmail &&
                inv.status === 'pending'
            );

            if (existingInvitation) {
                return {
                    canInvite: false,
                    reason: 'このユーザーには既に招待を送信済みです'
                };
            }

            // Check for already accepted invitation
            const acceptedInvitation = invitations.find(inv => 
                inv.fundSourceId === fundSourceId &&
                inv.inviteeEmail === userEmail &&
                inv.status === 'accepted'
            );

            if (acceptedInvitation) {
                return {
                    canInvite: false,
                    reason: 'このユーザーは既にこの資金元を共有しています'
                };
            }

            return {
                canInvite: true,
                reason: null
            };

        } catch (error) {
            console.error('Error checking if user can be invited:', error);
            return {
                canInvite: false,
                reason: 'エラーが発生しました'
            };
        }
    }

    // Get invitation summary for a fund source
    getInvitationSummary(fundSourceId) {
        try {
            const invitations = this.getInvitationsByFundSource(fundSourceId);
            
            const summary = {
                total: invitations.length,
                pending: 0,
                accepted: 0,
                declined: 0,
                expired: 0,
                cancelled: 0,
                invitations: invitations
            };

            for (const invitation of invitations) {
                if (summary.hasOwnProperty(invitation.status)) {
                    summary[invitation.status]++;
                }
            }

            return summary;

        } catch (error) {
            console.error('Error getting invitation summary:', error);
            return {
                total: 0,
                pending: 0,
                accepted: 0,
                declined: 0,
                expired: 0,
                cancelled: 0,
                invitations: []
            };
        }
    }

    // Maintenance methods
    performMaintenance() {
        try {
            console.log('Performing invitation maintenance...');
            
            // Clean up expired invitations
            const expiredCleaned = this.cleanupExpiredInvitations();
            
            // Delete old invitations (older than 30 days)
            const oldDeleted = this.deleteOldInvitations(30);
            
            console.log('Invitation maintenance completed', {
                expiredCleaned,
                oldDeleted
            });

            return { expiredCleaned, oldDeleted };

        } catch (error) {
            console.error('Error during invitation maintenance:', error);
            return { expiredCleaned: false, oldDeleted: 0 };
        }
    }
}

// Export for global use
window.InvitationManager = InvitationManager;