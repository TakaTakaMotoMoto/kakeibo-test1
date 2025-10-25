// Sharing Data Models and Validation Functions

// Data Model Classes
class SharingModels {
    // Enhanced Transaction Model with sharing fields
    static extendTransactionModel(transaction) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        return {
            ...transaction,
            createdBy: transaction.createdBy || (currentUser ? currentUser.id : null),
            createdByUsername: transaction.createdByUsername || (currentUser ? currentUser.username : 'ゲスト'),
            isShared: transaction.isShared || false,
            sharedFundSourceId: transaction.sharedFundSourceId || null,
            updatedAt: transaction.updatedAt || new Date()
        };
    }

    // Enhanced FundSource Model with sharing fields
    static extendFundSourceModel(fundSource) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        return {
            ...fundSource,
            ownerId: fundSource.ownerId || (currentUser ? currentUser.id : null),
            isShared: fundSource.isShared || false,
            sharedWith: fundSource.sharedWith || [],
            permissions: fundSource.permissions || {
                canView: true,
                canEdit: false,
                canDelete: false
            },
            updatedAt: fundSource.updatedAt || new Date()
        };
    }
    // Invitation Data Model
    static createInvitation(data) {
        const invitation = {
            id: data.id || null,
            token: data.token || null,
            fundSourceId: data.fundSourceId || null,
            inviterUserId: data.inviterUserId || null,
            inviterUsername: data.inviterUsername || 'ユーザー',
            inviteeEmail: data.inviteeEmail || null,
            permissions: data.permissions || {
                canView: true,
                canEdit: false,
                canDelete: false
            },
            status: data.status || 'pending',
            createdAt: data.createdAt || new Date(),
            expiresAt: data.expiresAt || new Date(Date.now() + 10 * 60 * 1000), // 10 minutes instead of 24 hours
            acceptedAt: data.acceptedAt || null,
            updatedAt: data.updatedAt || new Date()
        };

        return invitation;
    }

    // SharingSettings Data Model
    static createSharingSettings(data) {
        const settings = {
            fundSourceId: data.fundSourceId || null,
            ownerId: data.ownerId || null,
            isShared: data.isShared || false,
            sharedWith: data.sharedWith || [],
            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || new Date()
        };

        return settings;
    }

    // SharedUser Data Model
    static createSharedUser(data) {
        const sharedUser = {
            id: data.id || null,
            email: data.email || null,
            username: data.username || null,
            sharedFundSources: data.sharedFundSources || [],
            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || new Date()
        };

        return sharedUser;
    }

    // SharedFundSource entry for SharedUser
    static createSharedFundSourceEntry(data) {
        const entry = {
            fundSourceId: data.fundSourceId || null,
            fundSourceName: data.fundSourceName || null,
            permissions: data.permissions || {
                canView: true,
                canEdit: false,
                canDelete: false
            },
            sharedBy: data.sharedBy || null,
            joinedAt: data.joinedAt || new Date()
        };

        return entry;
    }

    // SharedWith entry for FundSource
    static createSharedWithEntry(data) {
        const entry = {
            userId: data.userId || null,
            username: data.username || null,
            email: data.email || null,
            permissions: data.permissions || {
                canView: true,
                canEdit: false,
                canDelete: false
            },
            joinedAt: data.joinedAt || new Date()
        };

        return entry;
    }
}

// Enhanced Validation Functions
class SharingValidation {
    // Enhanced Invitation data validation with detailed security checks
    static validateInvitation(data) {
        const errors = [];
        const warnings = [];

        // Required fields validation
        if (!data.fundSourceId) {
            errors.push('資金元IDが必要です');
        } else {
            // Enhanced fund source ID validation
            if (!this.validateFundSourceId(data.fundSourceId)) {
                errors.push('資金元IDの形式が無効です');
            }
        }

        if (!data.inviterUserId) {
            errors.push('招待者IDが必要です');
        } else {
            // Enhanced user ID validation
            if (!this.validateUserId(data.inviterUserId)) {
                errors.push('招待者IDの形式が無効です');
            }
        }

        if (!data.inviteeEmail) {
            errors.push('招待先メールアドレスが必要です');
        } else {
            // Enhanced email validation
            const emailValidation = this.validateEmailDetailed(data.inviteeEmail);
            if (!emailValidation.isValid) {
                errors.push(...emailValidation.errors);
            }
            if (emailValidation.warnings.length > 0) {
                warnings.push(...emailValidation.warnings);
            }

            // Security check: prevent self-invitation
            if (data.inviterUserId && data.inviteeEmail) {
                const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
                if (currentUser && currentUser.email && 
                    data.inviteeEmail.toLowerCase() === currentUser.email.toLowerCase()) {
                    errors.push('自分自身を招待することはできません');
                }
            }
        }

        // Enhanced inviter username validation
        if (data.inviterUsername) {
            const usernameValidation = this.validateUsername(data.inviterUsername);
            if (!usernameValidation.isValid) {
                errors.push(...usernameValidation.errors);
            }
        }

        // Enhanced status validation
        if (data.status) {
            const validStatuses = ['pending', 'accepted', 'declined', 'expired', 'cancelled'];
            if (!validStatuses.includes(data.status)) {
                errors.push('無効なステータスです');
            }

            // Status transition validation
            if (data.id && data.status) {
                const statusValidation = this.validateStatusTransition(data.id, data.status);
                if (!statusValidation.isValid) {
                    errors.push(...statusValidation.errors);
                }
            }
        }

        // Enhanced permissions validation
        if (data.permissions) {
            const permissionErrors = this.validatePermissionsDetailed(data.permissions);
            errors.push(...permissionErrors.errors);
            warnings.push(...permissionErrors.warnings);
        }

        // Enhanced date validation
        if (data.expiresAt) {
            const dateValidation = this.validateExpirationDate(data.expiresAt);
            if (!dateValidation.isValid) {
                errors.push(...dateValidation.errors);
            }
            if (dateValidation.warnings.length > 0) {
                warnings.push(...dateValidation.warnings);
            }
        }

        // Enhanced token validation
        if (data.token) {
            const tokenValidation = this.validateInvitationTokenDetailed(data.token);
            if (!tokenValidation.isValid) {
                errors.push(...tokenValidation.errors);
            }
        }

        // Cross-field validation
        const crossFieldValidation = this.validateInvitationCrossFields(data);
        errors.push(...crossFieldValidation.errors);
        warnings.push(...crossFieldValidation.warnings);

        // Security validation
        const securityValidation = this.validateInvitationSecurity(data);
        errors.push(...securityValidation.errors);
        warnings.push(...securityValidation.warnings);

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            securityLevel: this.assessInvitationSecurityLevel(data, errors, warnings)
        };
    }

    // Enhanced SharingSettings validation with integrity checks
    static validateSharingSettings(data) {
        const errors = [];
        const warnings = [];

        // Enhanced required fields validation
        if (!data.fundSourceId) {
            errors.push('資金元IDが必要です');
        } else {
            if (!this.validateFundSourceId(data.fundSourceId)) {
                errors.push('資金元IDの形式が無効です');
            }
        }

        if (!data.ownerId) {
            errors.push('所有者IDが必要です');
        } else {
            if (!this.validateUserId(data.ownerId)) {
                errors.push('所有者IDの形式が無効です');
            }
        }

        // Enhanced boolean validation
        if (typeof data.isShared !== 'boolean') {
            errors.push('共有フラグはboolean値である必要があります');
        }

        // Enhanced SharedWith validation
        if (data.sharedWith && !Array.isArray(data.sharedWith)) {
            errors.push('共有ユーザーリストは配列である必要があります');
        } else if (data.sharedWith) {
            // Check for duplicate users
            const userIds = new Set();
            const emails = new Set();
            
            for (let i = 0; i < data.sharedWith.length; i++) {
                const user = data.sharedWith[i];
                const userValidation = this.validateSharedWithEntryDetailed(user, i);
                
                errors.push(...userValidation.errors);
                warnings.push(...userValidation.warnings);

                // Check for duplicates
                if (user.userId) {
                    if (userIds.has(user.userId)) {
                        errors.push(`重複したユーザーID: ${user.userId}`);
                    }
                    userIds.add(user.userId);
                }

                if (user.email) {
                    const normalizedEmail = user.email.toLowerCase();
                    if (emails.has(normalizedEmail)) {
                        errors.push(`重複したメールアドレス: ${user.email}`);
                    }
                    emails.add(normalizedEmail);
                }

                // Check if user is trying to share with owner
                if (user.userId === data.ownerId) {
                    errors.push('所有者を共有ユーザーリストに含めることはできません');
                }
            }

            // Validate sharing consistency
            if (data.isShared && data.sharedWith.length === 0) {
                warnings.push('共有が有効ですが、共有ユーザーが設定されていません');
            }

            if (!data.isShared && data.sharedWith.length > 0) {
                errors.push('共有が無効ですが、共有ユーザーが設定されています');
            }
        }

        // Integrity checks
        const integrityValidation = this.validateSharingSettingsIntegrity(data);
        errors.push(...integrityValidation.errors);
        warnings.push(...integrityValidation.warnings);

        // Security validation
        const securityValidation = this.validateSharingSettingsSecurity(data);
        errors.push(...securityValidation.errors);
        warnings.push(...securityValidation.warnings);

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            integrityLevel: this.assessSharingSettingsIntegrity(data, errors, warnings)
        };
    }

    // Validate SharedUser data
    static validateSharedUser(data) {
        const errors = [];

        // Required fields
        if (!data.id) {
            errors.push('ユーザーIDが必要です');
        }

        if (!data.email) {
            errors.push('メールアドレスが必要です');
        } else {
            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                errors.push('有効なメールアドレスを入力してください');
            }
        }

        if (!data.username) {
            errors.push('ユーザー名が必要です');
        } else {
            // Username length validation
            if (data.username.length > 50) {
                errors.push('ユーザー名は50文字以内である必要があります');
            }
        }

        // SharedFundSources validation
        if (data.sharedFundSources && !Array.isArray(data.sharedFundSources)) {
            errors.push('共有資金元リストは配列である必要があります');
        } else if (data.sharedFundSources) {
            for (let i = 0; i < data.sharedFundSources.length; i++) {
                const fundSource = data.sharedFundSources[i];
                const fundSourceErrors = this.validateSharedFundSourceEntry(fundSource);
                if (fundSourceErrors.length > 0) {
                    errors.push(`共有資金元 ${i + 1}: ${fundSourceErrors.join(', ')}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate SharedFundSource entry
    static validateSharedFundSourceEntry(data) {
        const errors = [];

        if (!data.fundSourceId) {
            errors.push('資金元IDが必要です');
        }

        if (!data.fundSourceName) {
            errors.push('資金元名が必要です');
        }

        if (!data.sharedBy) {
            errors.push('共有者IDが必要です');
        }

        // Permissions validation
        if (data.permissions) {
            const permissionErrors = this.validatePermissions(data.permissions);
            errors.push(...permissionErrors);
        }

        // Date validation
        if (data.joinedAt) {
            const joinedAt = new Date(data.joinedAt);
            if (isNaN(joinedAt.getTime())) {
                errors.push('参加日時が無効です');
            }
        }

        return errors;
    }

    // Validate SharedWith entry
    static validateSharedWithEntry(data) {
        const errors = [];

        if (!data.userId) {
            errors.push('ユーザーIDが必要です');
        }

        if (!data.username) {
            errors.push('ユーザー名が必要です');
        }

        if (!data.email) {
            errors.push('メールアドレスが必要です');
        } else {
            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                errors.push('有効なメールアドレスを入力してください');
            }
        }

        // Permissions validation
        if (data.permissions) {
            const permissionErrors = this.validatePermissions(data.permissions);
            errors.push(...permissionErrors);
        }

        // Date validation
        if (data.joinedAt) {
            const joinedAt = new Date(data.joinedAt);
            if (isNaN(joinedAt.getTime())) {
                errors.push('参加日時が無効です');
            }
        }

        return errors;
    }

    // Validate Permissions object
    static validatePermissions(permissions) {
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
                errors.push(`${perm} はboolean値である必要があります`);
            }
        }

        // Check optional permissions
        for (const perm of optionalPermissions) {
            if (permissions.hasOwnProperty(perm) && typeof permissions[perm] !== 'boolean') {
                errors.push(`${perm} はboolean値である必要があります`);
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

    // Enhanced email validation with detailed checks
    static validateEmailDetailed(email) {
        const errors = [];
        const warnings = [];

        if (!email || typeof email !== 'string') {
            errors.push('メールアドレスが必要です');
            return { isValid: false, errors, warnings };
        }

        // Trim whitespace
        email = email.trim();

        // Length validation
        if (email.length === 0) {
            errors.push('メールアドレスが空です');
            return { isValid: false, errors, warnings };
        }

        if (email.length > 254) {
            errors.push('メールアドレスが長すぎます（254文字以内）');
        }

        // Basic format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('メールアドレスの形式が無効です');
            return { isValid: false, errors, warnings };
        }

        // Enhanced format validation
        const [localPart, domain] = email.split('@');

        // Local part validation
        if (localPart.length > 64) {
            errors.push('メールアドレスのローカル部が長すぎます（64文字以内）');
        }

        if (localPart.startsWith('.') || localPart.endsWith('.')) {
            errors.push('メールアドレスのローカル部がピリオドで始まるか終わることはできません');
        }

        if (localPart.includes('..')) {
            errors.push('メールアドレスのローカル部に連続するピリオドは使用できません');
        }

        // Domain validation
        if (domain.length > 253) {
            errors.push('メールアドレスのドメイン部が長すぎます（253文字以内）');
        }

        if (domain.startsWith('.') || domain.endsWith('.')) {
            errors.push('メールアドレスのドメイン部がピリオドで始まるか終わることはできません');
        }

        if (domain.includes('..')) {
            errors.push('メールアドレスのドメイン部に連続するピリオドは使用できません');
        }

        // Security checks
        const suspiciousPatterns = [
            /[<>\"'&]/,  // HTML/Script injection characters
            /javascript:/i,  // JavaScript protocol
            /data:/i,  // Data protocol
            /vbscript:/i  // VBScript protocol
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(email)) {
                errors.push('メールアドレスに不正な文字が含まれています');
                break;
            }
        }

        // Common typo detection
        const commonTypos = [
            { pattern: /@gmai\.com$/i, suggestion: '@gmail.com' },
            { pattern: /@yahooo\.com$/i, suggestion: '@yahoo.com' },
            { pattern: /@hotmial\.com$/i, suggestion: '@hotmail.com' },
            { pattern: /@outlok\.com$/i, suggestion: '@outlook.com' }
        ];

        for (const typo of commonTypos) {
            if (typo.pattern.test(email)) {
                warnings.push(`メールアドレスにタイポの可能性があります。${typo.suggestion} ではありませんか？`);
                break;
            }
        }

        // Disposable email detection (basic)
        const disposableDomains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'throwaway.email', 'temp-mail.org'
        ];

        if (disposableDomains.some(disposable => domain.toLowerCase().includes(disposable))) {
            warnings.push('使い捨てメールアドレスの可能性があります');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Basic email validation (backward compatibility)
    static validateEmail(email) {
        const result = this.validateEmailDetailed(email);
        return result.isValid;
    }

    // Validate user ID format
    static validateUserId(userId) {
        if (!userId || typeof userId !== 'string') {
            return false;
        }

        // Basic validation - should be non-empty string
        return userId.trim().length > 0 && userId.length <= 100;
    }

    // Validate fund source ID format
    static validateFundSourceId(fundSourceId) {
        if (!fundSourceId || typeof fundSourceId !== 'string') {
            return false;
        }

        // Basic validation - should be non-empty string
        return fundSourceId.trim().length > 0 && fundSourceId.length <= 100;
    }

    // Enhanced invitation token validation
    static validateInvitationTokenDetailed(token) {
        const errors = [];

        if (!token || typeof token !== 'string') {
            errors.push('招待トークンが必要です');
            return { isValid: false, errors };
        }

        // Length validation
        if (token.length < 10) {
            errors.push('招待トークンが短すぎます');
        }

        if (token.length > 100) {
            errors.push('招待トークンが長すぎます');
        }

        // Format validation
        if (!token.startsWith('inv_')) {
            errors.push('招待トークンの形式が無効です（inv_で始まる必要があります）');
        }

        // Character validation
        const validTokenRegex = /^inv_[a-zA-Z0-9_-]+$/;
        if (!validTokenRegex.test(token)) {
            errors.push('招待トークンに無効な文字が含まれています');
        }

        // Security validation
        if (token.includes('..') || token.includes('//')) {
            errors.push('招待トークンに不正なパターンが含まれています');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Basic token validation (backward compatibility)
    static validateInvitationToken(token) {
        const result = this.validateInvitationTokenDetailed(token);
        return result.isValid;
    }

    // Validate extended Transaction model
    static validateExtendedTransaction(data) {
        const errors = [];

        // Basic transaction validation would be done by DataManager
        // Here we validate sharing-specific fields

        if (data.createdBy && !this.validateUserId(data.createdBy)) {
            errors.push('作成者IDが無効です');
        }

        if (data.createdByUsername && typeof data.createdByUsername !== 'string') {
            errors.push('作成者名は文字列である必要があります');
        }

        if (typeof data.isShared !== 'boolean') {
            errors.push('共有フラグはboolean値である必要があります');
        }

        if (data.sharedFundSourceId && !this.validateFundSourceId(data.sharedFundSourceId)) {
            errors.push('共有資金元IDが無効です');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate extended FundSource model
    static validateExtendedFundSource(data) {
        const errors = [];

        // Basic fund source validation would be done by DataManager
        // Here we validate sharing-specific fields

        if (data.ownerId && !this.validateUserId(data.ownerId)) {
            errors.push('所有者IDが無効です');
        }

        if (typeof data.isShared !== 'boolean') {
            errors.push('共有フラグはboolean値である必要があります');
        }

        if (data.sharedWith && !Array.isArray(data.sharedWith)) {
            errors.push('共有ユーザーリストは配列である必要があります');
        } else if (data.sharedWith) {
            for (const userId of data.sharedWith) {
                if (!this.validateUserId(userId)) {
                    errors.push(`無効なユーザーID: ${userId}`);
                }
            }
        }

        if (data.permissions) {
            const permissionErrors = this.validatePermissions(data.permissions);
            errors.push(...permissionErrors);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Enhanced detailed validation methods

    // Validate username with security checks
    static validateUsername(username) {
        const errors = [];

        if (!username || typeof username !== 'string') {
            errors.push('ユーザー名が必要です');
            return { isValid: false, errors };
        }

        username = username.trim();

        if (username.length === 0) {
            errors.push('ユーザー名が空です');
        }

        if (username.length > 50) {
            errors.push('ユーザー名は50文字以内である必要があります');
        }

        if (username.length < 2) {
            errors.push('ユーザー名は2文字以上である必要があります');
        }

        // Security checks
        const suspiciousPatterns = [
            /[<>\"'&]/,  // HTML/Script injection
            /javascript:/i,
            /data:/i,
            /vbscript:/i,
            /on\w+=/i  // Event handlers
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(username)) {
                errors.push('ユーザー名に不正な文字が含まれています');
                break;
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate status transition
    static validateStatusTransition(invitationId, newStatus) {
        const errors = [];

        try {
            // Get current invitation status
            const invitations = window.storage ? window.storage.getItem('budget_invitations', []) : [];
            const invitation = invitations.find(inv => inv.id === invitationId);

            if (!invitation) {
                errors.push('招待が見つかりません');
                return { isValid: false, errors };
            }

            const currentStatus = invitation.status;
            const validTransitions = {
                'pending': ['accepted', 'declined', 'expired', 'cancelled'],
                'accepted': [],  // Cannot change from accepted
                'declined': [],  // Cannot change from declined
                'expired': [],   // Cannot change from expired
                'cancelled': []  // Cannot change from cancelled
            };

            if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
                errors.push(`ステータスを ${currentStatus} から ${newStatus} に変更することはできません`);
            }

        } catch (error) {
            errors.push('ステータス遷移の検証中にエラーが発生しました');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate expiration date with warnings
    static validateExpirationDate(expiresAt) {
        const errors = [];
        const warnings = [];

        if (!expiresAt) {
            errors.push('有効期限が必要です');
            return { isValid: false, errors, warnings };
        }

        const expiration = new Date(expiresAt);
        const now = new Date();

        if (isNaN(expiration.getTime())) {
            errors.push('有効期限の日付が無効です');
            return { isValid: false, errors, warnings };
        }

        if (expiration <= now) {
            errors.push('有効期限は現在時刻より後である必要があります');
        }

        // Warning for very short expiration times
        const timeDiff = expiration.getTime() - now.getTime();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * oneHour;

        if (timeDiff < oneHour) {
            warnings.push('有効期限が1時間未満です');
        } else if (timeDiff > 7 * oneDay) {
            warnings.push('有効期限が7日を超えています');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Enhanced permissions validation with warnings
    static validatePermissionsDetailed(permissions) {
        const errors = [];
        const warnings = [];

        if (!permissions || typeof permissions !== 'object') {
            errors.push('権限オブジェクトが必要です');
            return { errors, warnings };
        }

        const requiredPermissions = ['canView', 'canEdit', 'canDelete'];
        const optionalPermissions = ['canManage', 'canInvite'];
        const allPermissions = [...requiredPermissions, ...optionalPermissions];

        // Check required permissions
        for (const perm of requiredPermissions) {
            if (typeof permissions[perm] !== 'boolean') {
                errors.push(`${perm} はboolean値である必要があります`);
            }
        }

        // Check optional permissions
        for (const perm of optionalPermissions) {
            if (permissions.hasOwnProperty(perm) && typeof permissions[perm] !== 'boolean') {
                errors.push(`${perm} はboolean値である必要があります`);
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

        // Security warnings
        if (permissions.canDelete && permissions.canManage) {
            warnings.push('削除および管理権限の両方が付与されています');
        }

        if (!permissions.canView && !permissions.canEdit && !permissions.canDelete) {
            warnings.push('すべての権限が無効になっています');
        }

        return { errors, warnings };
    }

    // Validate SharedWith entry with detailed checks
    static validateSharedWithEntryDetailed(data, index = 0) {
        const errors = [];
        const warnings = [];

        if (!data.userId) {
            errors.push('ユーザーIDが必要です');
        } else {
            if (!this.validateUserId(data.userId)) {
                errors.push('ユーザーIDの形式が無効です');
            }
        }

        if (!data.username) {
            errors.push('ユーザー名が必要です');
        } else {
            const usernameValidation = this.validateUsername(data.username);
            if (!usernameValidation.isValid) {
                errors.push(...usernameValidation.errors.map(err => `ユーザー名: ${err}`));
            }
        }

        if (!data.email) {
            errors.push('メールアドレスが必要です');
        } else {
            const emailValidation = this.validateEmailDetailed(data.email);
            if (!emailValidation.isValid) {
                errors.push(...emailValidation.errors.map(err => `メールアドレス: ${err}`));
            }
            warnings.push(...emailValidation.warnings.map(warn => `メールアドレス: ${warn}`));
        }

        // Permissions validation
        if (data.permissions) {
            const permissionValidation = this.validatePermissionsDetailed(data.permissions);
            errors.push(...permissionValidation.errors.map(err => `権限: ${err}`));
            warnings.push(...permissionValidation.warnings.map(warn => `権限: ${warn}`));
        } else {
            warnings.push('権限が設定されていません');
        }

        // Date validation
        if (data.joinedAt) {
            const joinedAt = new Date(data.joinedAt);
            if (isNaN(joinedAt.getTime())) {
                errors.push('参加日時が無効です');
            } else if (joinedAt > new Date()) {
                errors.push('参加日時が未来の日付です');
            }
        }

        return { errors, warnings };
    }

    // Cross-field validation for invitations
    static validateInvitationCrossFields(data) {
        const errors = [];
        const warnings = [];

        // Check if expiration date is consistent with creation date
        if (data.createdAt && data.expiresAt) {
            const created = new Date(data.createdAt);
            const expires = new Date(data.expiresAt);
            
            if (!isNaN(created.getTime()) && !isNaN(expires.getTime())) {
                const timeDiff = expires.getTime() - created.getTime();
                const expectedDiff = 24 * 60 * 60 * 1000; // 24 hours
                
                if (Math.abs(timeDiff - expectedDiff) > 60 * 60 * 1000) { // More than 1 hour difference
                    warnings.push('有効期限が標準の24時間と異なります');
                }
            }
        }

        // Check if accepted date is after creation date
        if (data.createdAt && data.acceptedAt && data.status === 'accepted') {
            const created = new Date(data.createdAt);
            const accepted = new Date(data.acceptedAt);
            
            if (!isNaN(created.getTime()) && !isNaN(accepted.getTime())) {
                if (accepted < created) {
                    errors.push('受諾日時が作成日時より前です');
                }
            }
        }

        return { errors, warnings };
    }

    // Security validation for invitations
    static validateInvitationSecurity(data) {
        const errors = [];
        const warnings = [];

        // Check for suspicious patterns in email
        if (data.inviteeEmail) {
            const suspiciousPatterns = [
                /admin/i,
                /root/i,
                /system/i,
                /noreply/i,
                /no-reply/i
            ];

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(data.inviteeEmail)) {
                    warnings.push('システムアカウントのようなメールアドレスです');
                    break;
                }
            }
        }

        // Check for rate limiting (if multiple invitations from same user)
        if (data.inviterUserId) {
            try {
                const invitations = window.storage ? window.storage.getItem('budget_invitations', []) : [];
                const recentInvitations = invitations.filter(inv => 
                    inv.inviterUserId === data.inviterUserId &&
                    inv.createdAt &&
                    new Date(inv.createdAt) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
                );

                if (recentInvitations.length > 10) {
                    warnings.push('短時間で多数の招待が送信されています');
                }
            } catch (error) {
                // Ignore storage errors in validation
            }
        }

        return { errors, warnings };
    }

    // Integrity validation for sharing settings
    static validateSharingSettingsIntegrity(data) {
        const errors = [];
        const warnings = [];

        try {
            // Check if fund source exists
            if (data.fundSourceId && window.storage) {
                const fundSources = window.storage.getFundSources();
                const fundSource = fundSources.find(fs => fs.id === data.fundSourceId);
                
                if (!fundSource) {
                    errors.push('指定された資金元が存在しません');
                } else {
                    // Check consistency with fund source data
                    if (fundSource.ownerId !== data.ownerId) {
                        errors.push('所有者IDが資金元の所有者と一致しません');
                    }

                    if (fundSource.isShared !== data.isShared) {
                        warnings.push('共有フラグが資金元の設定と一致しません');
                    }
                }
            }

            // Check for orphaned shared users
            if (data.sharedWith && data.sharedWith.length > 0) {
                for (const user of data.sharedWith) {
                    if (user.userId === data.ownerId) {
                        errors.push('所有者が共有ユーザーリストに含まれています');
                    }
                }
            }

        } catch (error) {
            warnings.push('整合性チェック中にエラーが発生しました');
        }

        return { errors, warnings };
    }

    // Security validation for sharing settings
    static validateSharingSettingsSecurity(data) {
        const errors = [];
        const warnings = [];

        // Check for excessive sharing
        if (data.sharedWith && data.sharedWith.length > 20) {
            warnings.push('共有ユーザー数が多すぎます（20人以上）');
        }

        // Check for suspicious permission patterns
        if (data.sharedWith) {
            let adminCount = 0;
            for (const user of data.sharedWith) {
                if (user.permissions && user.permissions.canManage) {
                    adminCount++;
                }
            }

            if (adminCount > 3) {
                warnings.push('管理権限を持つユーザーが多すぎます');
            }
        }

        return { errors, warnings };
    }

    // Assess security level of invitation
    static assessInvitationSecurityLevel(data, errors, warnings) {
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

    // Assess integrity level of sharing settings
    static assessSharingSettingsIntegrity(data, errors, warnings) {
        if (errors.length > 0) {
            return 'poor';
        }

        if (warnings.length > 2) {
            return 'fair';
        }

        if (warnings.length > 0) {
            return 'good';
        }

        return 'excellent';
    }
}

// Utility Functions
class SharingUtils {
    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Generate invitation token
    static generateInvitationToken() {
        return 'inv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Format date for display
    static formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        return d.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Get status display name
    static getStatusDisplayName(status) {
        const statusNames = {
            pending: '送信済み',
            accepted: '受諾済み',
            declined: '拒否済み',
            expired: '期限切れ',
            cancelled: '取り消し済み'
        };

        return statusNames[status] || status;
    }

    // Get permission display name
    static getPermissionDisplayName(permission) {
        const permissionNames = {
            canView: '閲覧',
            canEdit: '編集',
            canDelete: '削除',
            canManage: '管理',
            canInvite: '招待'
        };

        return permissionNames[permission] || permission;
    }

    // Get permissions summary
    static getPermissionsSummary(permissions) {
        if (!permissions) return '権限なし';

        const activePermissions = [];
        
        if (permissions.canView) activePermissions.push('閲覧');
        if (permissions.canEdit) activePermissions.push('編集');
        if (permissions.canDelete) activePermissions.push('削除');
        if (permissions.canManage) activePermissions.push('管理');
        if (permissions.canInvite) activePermissions.push('招待');

        return activePermissions.length > 0 ? activePermissions.join('、') : '権限なし';
    }

    // Check if invitation is expired
    static isInvitationExpired(invitation) {
        if (!invitation || !invitation.expiresAt) return true;
        
        const now = new Date();
        const expiresAt = new Date(invitation.expiresAt);
        
        return now > expiresAt;
    }

    // Calculate time until expiration
    static getTimeUntilExpiration(invitation) {
        if (!invitation || !invitation.expiresAt) return null;
        
        const now = new Date();
        const expiresAt = new Date(invitation.expiresAt);
        const diff = expiresAt.getTime() - now.getTime();
        
        if (diff <= 0) return null;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}時間${minutes}分`;
        } else {
            return `${minutes}分`;
        }
    }

    // Sanitize user input
    static sanitizeString(str) {
        if (!str || typeof str !== 'string') return '';
        
        return str.trim().replace(/[<>\"'&]/g, '');
    }

    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        
        return cloned;
    }
}

// Export classes for global use
window.SharingModels = SharingModels;
window.SharingValidation = SharingValidation;
window.SharingUtils = SharingUtils;