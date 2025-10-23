// Permission Manager - Handles permission management for sharing
class PermissionManager {
    constructor(storage = null) {
        // Error handling
        this.errorHandler = storage ? new SharingErrorHandler(storage) : null;
        
        // Define permission levels
        this.permissionLevels = {
            OWNER: 'owner',
            EDITOR: 'editor',
            VIEWER: 'viewer'
        };

        // Define default permissions for each level
        this.defaultPermissions = {
            [this.permissionLevels.OWNER]: {
                canView: true,
                canEdit: true,
                canDelete: true,
                canManage: true,
                canInvite: true
            },
            [this.permissionLevels.EDITOR]: {
                canView: true,
                canEdit: true,
                canDelete: false,
                canManage: false,
                canInvite: false
            },
            [this.permissionLevels.VIEWER]: {
                canView: true,
                canEdit: false,
                canDelete: false,
                canManage: false,
                canInvite: false
            }
        };
    }

    // 権限チェック
    canViewFundSource(userId, fundSourceId, fundSources = null) {
        try {
            const fundSource = this.getFundSource(fundSourceId, fundSources);
            if (!fundSource) {
                return false;
            }

            // Owner can always view
            if (fundSource.ownerId === userId) {
                return true;
            }

            // Check if user is in shared users with view permission
            if (fundSource.isShared && fundSource.sharedWith) {
                const sharedUser = fundSource.sharedWith.find(user => user.userId === userId);
                return sharedUser && sharedUser.permissions && sharedUser.permissions.canView;
            }

            return false;

        } catch (error) {
            console.error('Error checking view permission:', error);
            return false;
        }
    }

    canEditTransaction(userId, transactionId, transactions = null, fundSources = null) {
        try {
            const transaction = this.getTransaction(transactionId, transactions);
            if (!transaction) {
                return false;
            }

            // User can edit their own transactions
            if (transaction.createdBy === userId) {
                return true;
            }

            // Check fund source permissions for shared transactions
            if (transaction.isShared && transaction.fundSourceId) {
                const fundSource = this.getFundSource(transaction.fundSourceId, fundSources);
                if (fundSource) {
                    // Owner can edit all transactions in their fund source
                    if (fundSource.ownerId === userId) {
                        return true;
                    }

                    // Check shared user permissions
                    if (fundSource.sharedWith) {
                        const sharedUser = fundSource.sharedWith.find(user => user.userId === userId);
                        return sharedUser && sharedUser.permissions && sharedUser.permissions.canEdit;
                    }
                }
            }

            return false;

        } catch (error) {
            console.error('Error checking edit transaction permission:', error);
            return false;
        }
    }

    canManageFundSource(userId, fundSourceId, fundSources = null) {
        try {
            const fundSource = this.getFundSource(fundSourceId, fundSources);
            if (!fundSource) {
                return false;
            }

            // Only owner can manage fund source
            return fundSource.ownerId === userId;

        } catch (error) {
            console.error('Error checking manage permission:', error);
            return false;
        }
    }

    canDeleteTransaction(userId, transactionId, transactions = null, fundSources = null) {
        try {
            const transaction = this.getTransaction(transactionId, transactions);
            if (!transaction) {
                return false;
            }

            // User can delete their own transactions
            if (transaction.createdBy === userId) {
                return true;
            }

            // Check fund source permissions for shared transactions
            if (transaction.isShared && transaction.fundSourceId) {
                const fundSource = this.getFundSource(transaction.fundSourceId, fundSources);
                if (fundSource) {
                    // Owner can delete all transactions in their fund source
                    if (fundSource.ownerId === userId) {
                        return true;
                    }

                    // Check shared user permissions
                    if (fundSource.sharedWith) {
                        const sharedUser = fundSource.sharedWith.find(user => user.userId === userId);
                        return sharedUser && sharedUser.permissions && sharedUser.permissions.canDelete;
                    }
                }
            }

            return false;

        } catch (error) {
            console.error('Error checking delete transaction permission:', error);
            return false;
        }
    }

    canInviteUsers(userId, fundSourceId, fundSources = null) {
        try {
            const fundSource = this.getFundSource(fundSourceId, fundSources);
            if (!fundSource) {
                return false;
            }

            // Owner can always invite
            if (fundSource.ownerId === userId) {
                return true;
            }

            // Check if shared user has invite permission
            if (fundSource.sharedWith) {
                const sharedUser = fundSource.sharedWith.find(user => user.userId === userId);
                return sharedUser && sharedUser.permissions && sharedUser.permissions.canInvite;
            }

            return false;

        } catch (error) {
            console.error('Error checking invite permission:', error);
            return false;
        }
    }

    // 権限設定
    setUserPermissions(userId, fundSourceId, permissions, fundSources = null) {
        try {
            // Validate permissions object
            const validationErrors = this.validatePermissions(permissions);
            if (validationErrors.length > 0) {
                throw new Error(`権限設定が無効です: ${validationErrors.join(', ')}`);
            }

            return {
                userId: userId,
                fundSourceId: fundSourceId,
                permissions: permissions,
                updatedAt: new Date()
            };

        } catch (error) {
            console.error('Error setting user permissions:', error);
            throw error;
        }
    }

    getUserPermissions(userId, fundSourceId, fundSources = null) {
        try {
            const fundSource = this.getFundSource(fundSourceId, fundSources);
            if (!fundSource) {
                return null;
            }

            // Owner has full permissions
            if (fundSource.ownerId === userId) {
                return this.defaultPermissions[this.permissionLevels.OWNER];
            }

            // Get shared user permissions
            if (fundSource.sharedWith) {
                const sharedUser = fundSource.sharedWith.find(user => user.userId === userId);
                if (sharedUser && sharedUser.permissions) {
                    return sharedUser.permissions;
                }
            }

            return null;

        } catch (error) {
            console.error('Error getting user permissions:', error);
            return null;
        }
    }

    // デフォルト権限
    getDefaultPermissions(level = 'viewer') {
        return { ...this.defaultPermissions[level] } || { ...this.defaultPermissions.viewer };
    }

    getPermissionLevels() {
        return { ...this.permissionLevels };
    }

    getPermissionsByLevel(level) {
        return { ...this.defaultPermissions[level] } || null;
    }

    // 権限レベルの判定
    getUserPermissionLevel(userId, fundSourceId, fundSources = null) {
        try {
            const fundSource = this.getFundSource(fundSourceId, fundSources);
            if (!fundSource) {
                return null;
            }

            // Check if user is owner
            if (fundSource.ownerId === userId) {
                return this.permissionLevels.OWNER;
            }

            // Check shared user permissions
            if (fundSource.sharedWith) {
                const sharedUser = fundSource.sharedWith.find(user => user.userId === userId);
                if (sharedUser && sharedUser.permissions) {
                    const permissions = sharedUser.permissions;
                    
                    // Determine level based on permissions
                    if (permissions.canEdit && permissions.canDelete) {
                        return this.permissionLevels.EDITOR;
                    } else if (permissions.canView) {
                        return this.permissionLevels.VIEWER;
                    }
                }
            }

            return null;

        } catch (error) {
            console.error('Error getting user permission level:', error);
            return null;
        }
    }

    // 権限の比較
    hasHigherPermission(userLevel, requiredLevel) {
        const levels = [
            this.permissionLevels.VIEWER,
            this.permissionLevels.EDITOR,
            this.permissionLevels.OWNER
        ];

        const userIndex = levels.indexOf(userLevel);
        const requiredIndex = levels.indexOf(requiredLevel);

        return userIndex >= requiredIndex;
    }

    // Enhanced permission validation with security checks
    validatePermissions(permissions) {
        const errors = [];

        if (!permissions || typeof permissions !== 'object') {
            errors.push('権限オブジェクトが必要です');
            return errors;
        }

        const requiredPermissions = ['canView', 'canEdit', 'canDelete'];
        const optionalPermissions = ['canManage', 'canInvite'];
        const allPermissions = [...requiredPermissions, ...optionalPermissions];

        // Check required permissions
        for (const perm of requiredPermissions) {
            if (typeof permissions[perm] !== 'boolean') {
                errors.push(`${perm} は boolean 値である必要があります`);
            }
        }

        // Check optional permissions
        for (const perm of optionalPermissions) {
            if (permissions.hasOwnProperty(perm) && typeof permissions[perm] !== 'boolean') {
                errors.push(`${perm} は boolean 値である必要があります`);
            }
        }

        // Check for unknown permissions
        for (const perm in permissions) {
            if (!allPermissions.includes(perm)) {
                errors.push(`未知の権限: ${perm}`);
            }
        }

        // Logical validation
        if (permissions.canEdit && !permissions.canView) {
            errors.push('編集権限には閲覧権限が必要です');
        }

        if (permissions.canDelete && !permissions.canEdit) {
            errors.push('削除権限には編集権限が必要です');
        }

        if (permissions.canManage && !permissions.canDelete) {
            errors.push('管理権限には削除権限が必要です');
        }

        return errors;
    }

    // Enhanced permission validation with detailed security analysis
    validatePermissionsDetailed(permissions) {
        const errors = [];
        const warnings = [];
        const securityIssues = [];

        if (!permissions || typeof permissions !== 'object') {
            errors.push('権限オブジェクトが必要です');
            return { errors, warnings, securityIssues };
        }

        const requiredPermissions = ['canView', 'canEdit', 'canDelete'];
        const optionalPermissions = ['canManage', 'canInvite'];
        const allPermissions = [...requiredPermissions, ...optionalPermissions];

        // Type validation
        for (const perm of requiredPermissions) {
            if (typeof permissions[perm] !== 'boolean') {
                errors.push(`${perm} は boolean 値である必要があります`);
            }
        }

        for (const perm of optionalPermissions) {
            if (permissions.hasOwnProperty(perm) && typeof permissions[perm] !== 'boolean') {
                errors.push(`${perm} は boolean 値である必要があります`);
            }
        }

        // Unknown permissions check
        for (const perm in permissions) {
            if (!allPermissions.includes(perm)) {
                errors.push(`未知の権限: ${perm}`);
            }
        }

        // Logical validation
        if (permissions.canEdit && !permissions.canView) {
            errors.push('編集権限には閲覧権限が必要です');
        }

        if (permissions.canDelete && !permissions.canEdit) {
            errors.push('削除権限には編集権限が必要です');
        }

        if (permissions.canManage && !permissions.canDelete) {
            errors.push('管理権限には削除権限が必要です');
        }

        // Security analysis
        if (permissions.canManage && permissions.canDelete && permissions.canEdit) {
            securityIssues.push('フル管理権限が付与されています');
        }

        if (permissions.canDelete && !permissions.canManage) {
            warnings.push('削除権限がありますが管理権限がありません');
        }

        if (permissions.canInvite && !permissions.canManage) {
            warnings.push('招待権限がありますが管理権限がありません');
        }

        // Permission level assessment
        const permissionLevel = this.assessPermissionLevel(permissions);
        if (permissionLevel === 'excessive') {
            securityIssues.push('権限レベルが過度に高く設定されています');
        }

        return { errors, warnings, securityIssues };
    }

    // Assess permission level for security analysis
    assessPermissionLevel(permissions) {
        if (!permissions) return 'none';

        const highRiskPermissions = ['canManage', 'canDelete', 'canInvite'];
        const activeHighRisk = highRiskPermissions.filter(perm => permissions[perm]).length;

        if (activeHighRisk >= 3) return 'excessive';
        if (activeHighRisk >= 2) return 'high';
        if (permissions.canEdit) return 'medium';
        if (permissions.canView) return 'low';
        
        return 'none';
    }

    // Validate permission consistency across fund source
    validateFundSourcePermissionConsistency(fundSourceId, fundSources = null) {
        const errors = [];
        const warnings = [];

        try {
            const fundSource = this.getFundSource(fundSourceId, fundSources);
            if (!fundSource) {
                errors.push('資金元が見つかりません');
                return { errors, warnings };
            }

            // Check if shared users have consistent permissions
            if (fundSource.sharedWith && fundSource.sharedWith.length > 0) {
                const permissionSets = new Set();
                
                for (const user of fundSource.sharedWith) {
                    if (user.permissions) {
                        const permString = JSON.stringify(user.permissions);
                        permissionSets.add(permString);
                    }
                }

                if (permissionSets.size > 3) {
                    warnings.push('共有ユーザー間で権限設定が大きく異なります');
                }

                // Check for users with no permissions
                const usersWithoutPermissions = fundSource.sharedWith.filter(user => 
                    !user.permissions || 
                    (!user.permissions.canView && !user.permissions.canEdit && !user.permissions.canDelete)
                );

                if (usersWithoutPermissions.length > 0) {
                    warnings.push(`${usersWithoutPermissions.length}人のユーザーに有効な権限が設定されていません`);
                }

                // Check for excessive admin users
                const adminUsers = fundSource.sharedWith.filter(user => 
                    user.permissions && user.permissions.canManage
                );

                if (adminUsers.length > Math.ceil(fundSource.sharedWith.length / 3)) {
                    warnings.push('管理権限を持つユーザーの割合が高すぎます');
                }
            }

        } catch (error) {
            errors.push('権限整合性チェック中にエラーが発生しました');
        }

        return { errors, warnings };
    }

    // Security audit for permissions
    performPermissionSecurityAudit(userId, fundSourceId, fundSources = null) {
        const auditResults = {
            securityLevel: 'unknown',
            issues: [],
            recommendations: [],
            riskScore: 0
        };

        try {
            const fundSource = this.getFundSource(fundSourceId, fundSources);
            if (!fundSource) {
                auditResults.issues.push('資金元が見つかりません');
                auditResults.riskScore = 100;
                return auditResults;
            }

            const userPermissions = this.getUserPermissions(userId, fundSourceId, fundSources);
            if (!userPermissions) {
                auditResults.securityLevel = 'secure';
                auditResults.riskScore = 0;
                return auditResults;
            }

            let riskScore = 0;

            // Analyze individual permissions
            if (userPermissions.canView) riskScore += 10;
            if (userPermissions.canEdit) riskScore += 20;
            if (userPermissions.canDelete) riskScore += 30;
            if (userPermissions.canManage) riskScore += 40;
            if (userPermissions.canInvite) riskScore += 25;

            // Check for permission escalation risks
            if (userPermissions.canManage && userPermissions.canInvite) {
                auditResults.issues.push('管理権限と招待権限の組み合わせは権限昇格のリスクがあります');
                riskScore += 20;
            }

            if (userPermissions.canDelete && !userPermissions.canManage) {
                auditResults.issues.push('削除権限がありますが管理権限がないため、データ整合性のリスクがあります');
                riskScore += 15;
            }

            // Determine security level
            if (riskScore >= 80) {
                auditResults.securityLevel = 'high-risk';
                auditResults.recommendations.push('権限を最小限に制限することを検討してください');
            } else if (riskScore >= 50) {
                auditResults.securityLevel = 'medium-risk';
                auditResults.recommendations.push('権限設定を定期的に見直してください');
            } else if (riskScore >= 20) {
                auditResults.securityLevel = 'low-risk';
                auditResults.recommendations.push('現在の権限設定は適切です');
            } else {
                auditResults.securityLevel = 'secure';
                auditResults.recommendations.push('最小権限の原則が適用されています');
            }

            auditResults.riskScore = Math.min(riskScore, 100);

        } catch (error) {
            auditResults.issues.push('セキュリティ監査中にエラーが発生しました');
            auditResults.riskScore = 50; // Default medium risk on error
        }

        return auditResults;
    }

    // Validate permission changes for security
    validatePermissionChange(userId, fundSourceId, oldPermissions, newPermissions, fundSources = null) {
        const errors = [];
        const warnings = [];
        const securityAlerts = [];

        try {
            // Basic validation
            const oldValidation = this.validatePermissionsDetailed(oldPermissions);
            const newValidation = this.validatePermissionsDetailed(newPermissions);

            errors.push(...newValidation.errors);
            warnings.push(...newValidation.warnings);

            // Change analysis
            const changes = this.analyzePermissionChanges(oldPermissions, newPermissions);
            
            // Security checks for permission escalation
            if (changes.escalated.length > 0) {
                securityAlerts.push(`権限が昇格されました: ${changes.escalated.join(', ')}`);
            }

            // Check for dangerous combinations
            if (newPermissions.canManage && newPermissions.canInvite && newPermissions.canDelete) {
                securityAlerts.push('危険な権限の組み合わせが検出されました');
            }

            // Check if user is trying to escalate their own permissions
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
            if (currentUser && currentUser.id === userId) {
                securityAlerts.push('ユーザーが自分自身の権限を変更しようとしています');
            }

        } catch (error) {
            errors.push('権限変更の検証中にエラーが発生しました');
        }

        return { errors, warnings, securityAlerts };
    }

    // Analyze permission changes
    analyzePermissionChanges(oldPermissions, newPermissions) {
        const changes = {
            escalated: [],
            reduced: [],
            unchanged: []
        };

        if (!oldPermissions || !newPermissions) {
            return changes;
        }

        const permissions = ['canView', 'canEdit', 'canDelete', 'canManage', 'canInvite'];

        for (const perm of permissions) {
            const oldValue = oldPermissions[perm] || false;
            const newValue = newPermissions[perm] || false;

            if (oldValue && !newValue) {
                changes.reduced.push(perm);
            } else if (!oldValue && newValue) {
                changes.escalated.push(perm);
            } else {
                changes.unchanged.push(perm);
            }
        }

        return changes;
    }

    // 権限の正規化
    normalizePermissions(permissions) {
        try {
            const normalized = {
                canView: Boolean(permissions.canView),
                canEdit: Boolean(permissions.canEdit),
                canDelete: Boolean(permissions.canDelete),
                canManage: Boolean(permissions.canManage),
                canInvite: Boolean(permissions.canInvite)
            };

            // Apply logical constraints
            if (!normalized.canView) {
                normalized.canEdit = false;
                normalized.canDelete = false;
                normalized.canManage = false;
                normalized.canInvite = false;
            }

            if (!normalized.canEdit) {
                normalized.canDelete = false;
                normalized.canManage = false;
            }

            if (!normalized.canDelete) {
                normalized.canManage = false;
            }

            return normalized;

        } catch (error) {
            console.error('Error normalizing permissions:', error);
            return this.getDefaultPermissions();
        }
    }

    // Helper methods
    getFundSource(fundSourceId, fundSources = null) {
        try {
            if (fundSources) {
                return fundSources.find(fs => fs.id === fundSourceId);
            }

            // Fallback to storage if available
            if (window.storage) {
                const allFundSources = window.storage.getFundSources();
                return allFundSources.find(fs => fs.id === fundSourceId);
            }

            return null;

        } catch (error) {
            console.error('Error getting fund source:', error);
            return null;
        }
    }

    getTransaction(transactionId, transactions = null) {
        try {
            if (transactions) {
                return transactions.find(t => t.id === transactionId);
            }

            // Fallback to storage if available
            if (window.storage) {
                const allTransactions = window.storage.getTransactions();
                return allTransactions.find(t => t.id === transactionId);
            }

            return null;

        } catch (error) {
            console.error('Error getting transaction:', error);
            return null;
        }
    }

    // Utility methods for UI
    getPermissionDisplayName(permission) {
        const displayNames = {
            canView: '閲覧',
            canEdit: '編集',
            canDelete: '削除',
            canManage: '管理',
            canInvite: '招待'
        };

        return displayNames[permission] || permission;
    }

    getPermissionLevelDisplayName(level) {
        const displayNames = {
            [this.permissionLevels.OWNER]: '所有者',
            [this.permissionLevels.EDITOR]: '編集者',
            [this.permissionLevels.VIEWER]: '閲覧者'
        };

        return displayNames[level] || level;
    }

    // Get permissions summary for display
    getPermissionsSummary(permissions) {
        try {
            if (!permissions) {
                return '権限なし';
            }

            const activePermissions = [];
            
            if (permissions.canView) activePermissions.push('閲覧');
            if (permissions.canEdit) activePermissions.push('編集');
            if (permissions.canDelete) activePermissions.push('削除');
            if (permissions.canManage) activePermissions.push('管理');
            if (permissions.canInvite) activePermissions.push('招待');

            return activePermissions.length > 0 ? activePermissions.join('、') : '権限なし';

        } catch (error) {
            console.error('Error getting permissions summary:', error);
            return '権限なし';
        }
    }
}