// Sharing Security Validator - Enhanced security validation for sharing features
class SharingSecurityValidator {
    constructor() {
        this.securityRules = {
            maxInvitationsPerHour: 10,
            maxSharedUsersPerFundSource: 20,
            maxAdminUsersPerFundSource: 3,
            tokenExpirationHours: 24,
            minPasswordStrength: 3,
            maxEmailLength: 254,
            maxUsernameLength: 50
        };

        this.suspiciousPatterns = {
            email: [
                /[<>\"'&]/,  // HTML/Script injection
                /javascript:/i,
                /data:/i,
                /vbscript:/i,
                /on\w+=/i
            ],
            username: [
                /[<>\"'&]/,
                /javascript:/i,
                /data:/i,
                /vbscript:/i,
                /on\w+=/i,
                /admin/i,
                /root/i,
                /system/i
            ],
            token: [
                /[<>\"'&]/,
                /javascript:/i,
                /data:/i,
                /\.\./,
                /\/\//
            ]
        };
    }

    // Comprehensive security validation for invitation data
    validateInvitationSecurity(invitationData) {
        const results = {
            isSecure: true,
            securityLevel: 'high',
            violations: [],
            warnings: [],
            recommendations: []
        };

        try {
            // Rate limiting check
            const rateLimitCheck = this.checkInvitationRateLimit(invitationData.inviterUserId);
            if (!rateLimitCheck.allowed) {
                results.violations.push('招待送信の頻度制限に違反しています');
                results.isSecure = false;
            }

            // Email security validation
            const emailSecurity = this.validateEmailSecurity(invitationData.inviteeEmail);
            if (!emailSecurity.isSecure) {
                results.violations.push(...emailSecurity.violations);
                results.warnings.push(...emailSecurity.warnings);
                results.isSecure = false;
            }

            // Token security validation
            if (invitationData.token) {
                const tokenSecurity = this.validateTokenSecurity(invitationData.token);
                if (!tokenSecurity.isSecure) {
                    results.violations.push(...tokenSecurity.violations);
                    results.isSecure = false;
                }
            }

            // Permission security validation
            if (invitationData.permissions) {
                const permissionSecurity = this.validatePermissionSecurity(invitationData.permissions);
                if (!permissionSecurity.isSecure) {
                    results.warnings.push(...permissionSecurity.warnings);
                    if (permissionSecurity.violations.length > 0) {
                        results.violations.push(...permissionSecurity.violations);
                        results.isSecure = false;
                    }
                }
            }

            // Cross-reference validation
            const crossRefSecurity = this.validateInvitationCrossReference(invitationData);
            if (!crossRefSecurity.isSecure) {
                results.violations.push(...crossRefSecurity.violations);
                results.warnings.push(...crossRefSecurity.warnings);
                results.isSecure = false;
            }

            // Determine security level
            results.securityLevel = this.assessSecurityLevel(results.violations, results.warnings);

            // Generate recommendations
            results.recommendations = this.generateSecurityRecommendations(results);

        } catch (error) {
            results.violations.push('セキュリティ検証中にエラーが発生しました');
            results.isSecure = false;
            results.securityLevel = 'low';
        }

        return results;
    }

    // Comprehensive security validation for sharing settings
    validateSharingSettingsSecurity(sharingSettings) {
        const results = {
            isSecure: true,
            securityLevel: 'high',
            violations: [],
            warnings: [],
            recommendations: []
        };

        try {
            // Validate shared user count
            if (sharingSettings.sharedWith && sharingSettings.sharedWith.length > this.securityRules.maxSharedUsersPerFundSource) {
                results.violations.push(`共有ユーザー数が上限（${this.securityRules.maxSharedUsersPerFundSource}人）を超えています`);
                results.isSecure = false;
            }

            // Validate admin user count
            const adminCount = this.countAdminUsers(sharingSettings.sharedWith);
            if (adminCount > this.securityRules.maxAdminUsersPerFundSource) {
                results.warnings.push(`管理権限を持つユーザーが推奨数（${this.securityRules.maxAdminUsersPerFundSource}人）を超えています`);
            }

            // Validate each shared user
            if (sharingSettings.sharedWith) {
                for (let i = 0; i < sharingSettings.sharedWith.length; i++) {
                    const user = sharingSettings.sharedWith[i];
                    const userSecurity = this.validateSharedUserSecurity(user, i);
                    
                    if (!userSecurity.isSecure) {
                        results.violations.push(...userSecurity.violations);
                        results.warnings.push(...userSecurity.warnings);
                        results.isSecure = false;
                    }
                }
            }

            // Check for permission escalation risks
            const escalationRisk = this.assessPermissionEscalationRisk(sharingSettings);
            if (escalationRisk.hasRisk) {
                results.warnings.push(...escalationRisk.warnings);
            }

            // Validate data integrity
            const integrityCheck = this.validateSharingDataIntegrity(sharingSettings);
            if (!integrityCheck.isValid) {
                results.violations.push(...integrityCheck.violations);
                results.isSecure = false;
            }

            // Determine security level
            results.securityLevel = this.assessSecurityLevel(results.violations, results.warnings);

            // Generate recommendations
            results.recommendations = this.generateSharingSecurityRecommendations(results, sharingSettings);

        } catch (error) {
            results.violations.push('共有設定のセキュリティ検証中にエラーが発生しました');
            results.isSecure = false;
            results.securityLevel = 'low';
        }

        return results;
    }

    // Check invitation rate limiting
    checkInvitationRateLimit(userId) {
        try {
            if (!userId || !window.storage) {
                return { allowed: true, remaining: this.securityRules.maxInvitationsPerHour };
            }

            const invitations = window.storage.getItem('budget_invitations', []);
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            const recentInvitations = invitations.filter(inv => 
                inv.inviterUserId === userId &&
                inv.createdAt &&
                new Date(inv.createdAt) > oneHourAgo
            );

            const allowed = recentInvitations.length < this.securityRules.maxInvitationsPerHour;
            const remaining = Math.max(0, this.securityRules.maxInvitationsPerHour - recentInvitations.length);

            return { allowed, remaining, current: recentInvitations.length };

        } catch (error) {
            // On error, allow but log
            console.error('Rate limit check error:', error);
            return { allowed: true, remaining: 0 };
        }
    }

    // Validate email security
    validateEmailSecurity(email) {
        const results = {
            isSecure: true,
            violations: [],
            warnings: []
        };

        if (!email || typeof email !== 'string') {
            results.violations.push('メールアドレスが無効です');
            results.isSecure = false;
            return results;
        }

        // Check for suspicious patterns
        for (const pattern of this.suspiciousPatterns.email) {
            if (pattern.test(email)) {
                results.violations.push('メールアドレスに不正な文字が含まれています');
                results.isSecure = false;
                break;
            }
        }

        // Check for system accounts
        const systemPatterns = [
            /^(admin|administrator|root|system|noreply|no-reply)@/i,
            /@(localhost|127\.0\.0\.1|0\.0\.0\.0)/i
        ];

        for (const pattern of systemPatterns) {
            if (pattern.test(email)) {
                results.warnings.push('システムアカウントのようなメールアドレスです');
                break;
            }
        }

        // Check for disposable email services
        const disposablePatterns = [
            /10minutemail\.com$/i,
            /tempmail\.org$/i,
            /guerrillamail\.com$/i,
            /mailinator\.com$/i,
            /throwaway\.email$/i
        ];

        for (const pattern of disposablePatterns) {
            if (pattern.test(email)) {
                results.warnings.push('使い捨てメールサービスの可能性があります');
                break;
            }
        }

        return results;
    }

    // Validate token security
    validateTokenSecurity(token) {
        const results = {
            isSecure: true,
            violations: []
        };

        if (!token || typeof token !== 'string') {
            results.violations.push('トークンが無効です');
            results.isSecure = false;
            return results;
        }

        // Check for suspicious patterns
        for (const pattern of this.suspiciousPatterns.token) {
            if (pattern.test(token)) {
                results.violations.push('トークンに不正なパターンが含まれています');
                results.isSecure = false;
                break;
            }
        }

        // Check token format
        if (!token.startsWith('inv_')) {
            results.violations.push('トークンの形式が無効です');
            results.isSecure = false;
        }

        // Check token length
        if (token.length < 20 || token.length > 100) {
            results.violations.push('トークンの長さが不適切です');
            results.isSecure = false;
        }

        return results;
    }

    // Validate permission security
    validatePermissionSecurity(permissions) {
        const results = {
            isSecure: true,
            violations: [],
            warnings: []
        };

        if (!permissions || typeof permissions !== 'object') {
            results.violations.push('権限オブジェクトが無効です');
            results.isSecure = false;
            return results;
        }

        // Check for excessive permissions
        const highRiskPermissions = ['canManage', 'canDelete', 'canInvite'];
        const activeHighRisk = highRiskPermissions.filter(perm => permissions[perm]);

        if (activeHighRisk.length >= 3) {
            results.warnings.push('過度に高い権限が設定されています');
        }

        // Check for dangerous combinations
        if (permissions.canManage && permissions.canInvite) {
            results.warnings.push('管理権限と招待権限の組み合わせは権限昇格のリスクがあります');
        }

        if (permissions.canDelete && !permissions.canManage) {
            results.warnings.push('削除権限がありますが管理権限がないため、データ整合性のリスクがあります');
        }

        return results;
    }

    // Validate invitation cross-reference
    validateInvitationCrossReference(invitationData) {
        const results = {
            isSecure: true,
            violations: [],
            warnings: []
        };

        try {
            // Check if inviter exists and has permission
            if (invitationData.fundSourceId && invitationData.inviterUserId && window.storage) {
                const fundSources = window.storage.getFundSources();
                const fundSource = fundSources.find(fs => fs.id === invitationData.fundSourceId);

                if (!fundSource) {
                    results.violations.push('招待対象の資金元が存在しません');
                    results.isSecure = false;
                } else if (fundSource.ownerId !== invitationData.inviterUserId) {
                    // Check if inviter has invite permission
                    const hasInvitePermission = fundSource.sharedWith && 
                        fundSource.sharedWith.some(user => 
                            user.userId === invitationData.inviterUserId && 
                            user.permissions && 
                            user.permissions.canInvite
                        );

                    if (!hasInvitePermission) {
                        results.violations.push('招待者に招待権限がありません');
                        results.isSecure = false;
                    }
                }
            }

            // Check for duplicate invitations
            if (invitationData.fundSourceId && invitationData.inviteeEmail && window.storage) {
                const invitations = window.storage.getItem('budget_invitations', []);
                const existingInvitation = invitations.find(inv => 
                    inv.fundSourceId === invitationData.fundSourceId &&
                    inv.inviteeEmail.toLowerCase() === invitationData.inviteeEmail.toLowerCase() &&
                    inv.status === 'pending'
                );

                if (existingInvitation) {
                    results.warnings.push('同じユーザーへの未処理の招待が既に存在します');
                }
            }

        } catch (error) {
            results.warnings.push('クロスリファレンス検証中にエラーが発生しました');
        }

        return results;
    }

    // Validate shared user security
    validateSharedUserSecurity(user, index) {
        const results = {
            isSecure: true,
            violations: [],
            warnings: []
        };

        // Validate user ID
        if (!user.userId || typeof user.userId !== 'string') {
            results.violations.push(`ユーザー ${index + 1}: ユーザーIDが無効です`);
            results.isSecure = false;
        }

        // Validate email
        if (user.email) {
            const emailSecurity = this.validateEmailSecurity(user.email);
            if (!emailSecurity.isSecure) {
                results.violations.push(...emailSecurity.violations.map(v => `ユーザー ${index + 1}: ${v}`));
                results.isSecure = false;
            }
            results.warnings.push(...emailSecurity.warnings.map(w => `ユーザー ${index + 1}: ${w}`));
        }

        // Validate username
        if (user.username) {
            for (const pattern of this.suspiciousPatterns.username) {
                if (pattern.test(user.username)) {
                    results.violations.push(`ユーザー ${index + 1}: ユーザー名に不正な文字が含まれています`);
                    results.isSecure = false;
                    break;
                }
            }
        }

        // Validate permissions
        if (user.permissions) {
            const permissionSecurity = this.validatePermissionSecurity(user.permissions);
            if (!permissionSecurity.isSecure) {
                results.violations.push(...permissionSecurity.violations.map(v => `ユーザー ${index + 1}: ${v}`));
                results.isSecure = false;
            }
            results.warnings.push(...permissionSecurity.warnings.map(w => `ユーザー ${index + 1}: ${w}`));
        }

        return results;
    }

    // Count admin users
    countAdminUsers(sharedWith) {
        if (!sharedWith || !Array.isArray(sharedWith)) {
            return 0;
        }

        return sharedWith.filter(user => 
            user.permissions && user.permissions.canManage
        ).length;
    }

    // Assess permission escalation risk
    assessPermissionEscalationRisk(sharingSettings) {
        const results = {
            hasRisk: false,
            warnings: []
        };

        if (!sharingSettings.sharedWith) {
            return results;
        }

        // Check for users with invite permission
        const usersWithInvitePermission = sharingSettings.sharedWith.filter(user => 
            user.permissions && user.permissions.canInvite
        );

        if (usersWithInvitePermission.length > 1) {
            results.hasRisk = true;
            results.warnings.push('複数のユーザーに招待権限があります');
        }

        // Check for users with both manage and invite permissions
        const usersWithBothPermissions = sharingSettings.sharedWith.filter(user => 
            user.permissions && user.permissions.canManage && user.permissions.canInvite
        );

        if (usersWithBothPermissions.length > 0) {
            results.hasRisk = true;
            results.warnings.push('管理権限と招待権限の両方を持つユーザーがいます');
        }

        return results;
    }

    // Validate sharing data integrity
    validateSharingDataIntegrity(sharingSettings) {
        const results = {
            isValid: true,
            violations: []
        };

        try {
            // Check consistency between isShared flag and sharedWith array
            if (sharingSettings.isShared && (!sharingSettings.sharedWith || sharingSettings.sharedWith.length === 0)) {
                results.violations.push('共有フラグが有効ですが共有ユーザーが設定されていません');
                results.isValid = false;
            }

            if (!sharingSettings.isShared && sharingSettings.sharedWith && sharingSettings.sharedWith.length > 0) {
                results.violations.push('共有フラグが無効ですが共有ユーザーが設定されています');
                results.isValid = false;
            }

            // Check for owner in shared users list
            if (sharingSettings.sharedWith && sharingSettings.ownerId) {
                const ownerInSharedList = sharingSettings.sharedWith.some(user => 
                    user.userId === sharingSettings.ownerId
                );

                if (ownerInSharedList) {
                    results.violations.push('所有者が共有ユーザーリストに含まれています');
                    results.isValid = false;
                }
            }

        } catch (error) {
            results.violations.push('データ整合性検証中にエラーが発生しました');
            results.isValid = false;
        }

        return results;
    }

    // Assess overall security level
    assessSecurityLevel(violations, warnings) {
        if (violations.length > 0) {
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

    // Generate security recommendations
    generateSecurityRecommendations(results) {
        const recommendations = [];

        if (results.violations.length > 0) {
            recommendations.push('セキュリティ違反を修正してください');
        }

        if (results.warnings.length > 2) {
            recommendations.push('警告事項を確認し、必要に応じて設定を見直してください');
        }

        if (results.securityLevel === 'low') {
            recommendations.push('セキュリティレベルが低いため、設定の見直しを強く推奨します');
        }

        return recommendations;
    }

    // Generate sharing security recommendations
    generateSharingSecurityRecommendations(results, sharingSettings) {
        const recommendations = [];

        if (sharingSettings.sharedWith && sharingSettings.sharedWith.length > 10) {
            recommendations.push('共有ユーザー数を必要最小限に制限することを検討してください');
        }

        const adminCount = this.countAdminUsers(sharingSettings.sharedWith);
        if (adminCount > 2) {
            recommendations.push('管理権限を持つユーザー数を制限することを検討してください');
        }

        if (results.warnings.length > 0) {
            recommendations.push('定期的に共有設定とユーザー権限を見直してください');
        }

        return recommendations;
    }

    // Perform comprehensive security audit
    performSecurityAudit() {
        const auditResults = {
            timestamp: new Date(),
            overallSecurityLevel: 'unknown',
            issues: [],
            recommendations: [],
            statistics: {}
        };

        try {
            if (!window.storage) {
                auditResults.issues.push('ストレージにアクセスできません');
                return auditResults;
            }

            // Audit invitations
            const invitations = window.storage.getItem('budget_invitations', []);
            const invitationAudit = this.auditInvitations(invitations);
            auditResults.issues.push(...invitationAudit.issues);
            auditResults.recommendations.push(...invitationAudit.recommendations);

            // Audit sharing settings
            const fundSources = window.storage.getFundSources();
            const sharingAudit = this.auditSharingSettings(fundSources);
            auditResults.issues.push(...sharingAudit.issues);
            auditResults.recommendations.push(...sharingAudit.recommendations);

            // Compile statistics
            auditResults.statistics = {
                totalInvitations: invitations.length,
                pendingInvitations: invitations.filter(inv => inv.status === 'pending').length,
                expiredInvitations: invitations.filter(inv => inv.status === 'expired').length,
                sharedFundSources: fundSources.filter(fs => fs.isShared).length,
                totalSharedUsers: fundSources.reduce((total, fs) => 
                    total + (fs.sharedWith ? fs.sharedWith.length : 0), 0
                )
            };

            // Determine overall security level
            auditResults.overallSecurityLevel = this.assessOverallSecurityLevel(auditResults.issues);

        } catch (error) {
            auditResults.issues.push('セキュリティ監査中にエラーが発生しました');
            auditResults.overallSecurityLevel = 'low';
        }

        return auditResults;
    }

    // Audit invitations
    auditInvitations(invitations) {
        const results = {
            issues: [],
            recommendations: []
        };

        const now = new Date();
        let expiredCount = 0;
        let suspiciousCount = 0;

        for (const invitation of invitations) {
            // Check for expired invitations
            if (invitation.status === 'pending' && invitation.expiresAt) {
                const expiresAt = new Date(invitation.expiresAt);
                if (now > expiresAt) {
                    expiredCount++;
                }
            }

            // Check for suspicious patterns
            if (invitation.inviteeEmail) {
                const emailSecurity = this.validateEmailSecurity(invitation.inviteeEmail);
                if (!emailSecurity.isSecure) {
                    suspiciousCount++;
                }
            }
        }

        if (expiredCount > 0) {
            results.issues.push(`${expiredCount}件の期限切れ招待があります`);
            results.recommendations.push('期限切れの招待をクリーンアップしてください');
        }

        if (suspiciousCount > 0) {
            results.issues.push(`${suspiciousCount}件の疑わしい招待があります`);
            results.recommendations.push('疑わしい招待を確認してください');
        }

        return results;
    }

    // Audit sharing settings
    auditSharingSettings(fundSources) {
        const results = {
            issues: [],
            recommendations: []
        };

        let excessiveSharing = 0;
        let inconsistentSettings = 0;

        for (const fundSource of fundSources) {
            if (fundSource.isShared) {
                // Check for excessive sharing
                if (fundSource.sharedWith && fundSource.sharedWith.length > this.securityRules.maxSharedUsersPerFundSource) {
                    excessiveSharing++;
                }

                // Check for inconsistent settings
                if (!fundSource.sharedWith || fundSource.sharedWith.length === 0) {
                    inconsistentSettings++;
                }
            }
        }

        if (excessiveSharing > 0) {
            results.issues.push(`${excessiveSharing}件の資金元で過度な共有が設定されています`);
            results.recommendations.push('共有ユーザー数を制限してください');
        }

        if (inconsistentSettings > 0) {
            results.issues.push(`${inconsistentSettings}件の資金元で設定に不整合があります`);
            results.recommendations.push('共有設定の整合性を確認してください');
        }

        return results;
    }

    // Assess overall security level
    assessOverallSecurityLevel(issues) {
        if (issues.length === 0) {
            return 'high';
        }

        if (issues.length <= 2) {
            return 'medium-high';
        }

        if (issues.length <= 5) {
            return 'medium';
        }

        return 'low';
    }
}

// Export for global use
window.SharingSecurityValidator = SharingSecurityValidator;