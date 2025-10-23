// Sharing UI Manager - Handles sharing-related UI components
class SharingUIManager {
    constructor(uiManager, sharingManager, invitationManager, permissionManager) {
        this.uiManager = uiManager;
        this.sharingManager = sharingManager;
        this.invitationManager = invitationManager;
        this.permissionManager = permissionManager;

        this.currentFundSourceId = null;
        this.currentInvitationToken = null;

        // Initialize invitation token display manager
        this.invitationTokenDisplay = new InvitationTokenDisplayManager();

        // Enhanced UI responsiveness (Task 12.2)
        this.uiEnhancer = window.UIResponsivenessEnhancer ? new UIResponsivenessEnhancer() : null;
        this.loadingStates = new Map();

        this.initializeEventListeners();
        this.initializeEnhancedUI();
        
        // Process URL invitation if present
        setTimeout(() => {
            this.invitationTokenDisplay.processUrlInvitation();
        }, 1000);
    }

    // Initialize enhanced UI features (Task 12.2)
    initializeEnhancedUI() {
        if (!this.uiEnhancer) return;

        // Create optimistic UI updater for sharing operations
        this.optimisticUpdater = this.uiEnhancer.optimisticUI;

        // Set up performance monitoring for sharing UI
        this.performanceTracker = new PerformanceTracker();

        // Initialize async operation helpers
        this.asyncHelper = this.uiEnhancer.asyncOptimizer;
    }

    initializeEventListeners() {
        // Settings page sharing buttons
        const manageSharingBtn = document.getElementById('manage-sharing');
        if (manageSharingBtn) {
            manageSharingBtn.addEventListener('click', () => {
                this.openSharingManagementModal();
            });
        }

        const sharedUsersBtn = document.getElementById('shared-users');
        if (sharedUsersBtn) {
            sharedUsersBtn.addEventListener('click', () => {
                this.openSharedUsersModal();
            });
        }
    }

    // 6.1 共有管理モーダルの実装
    openSharingManagementModal() {
        try {
            // Check authentication
            if (!window.authManager || !window.authManager.getIsLoggedIn()) {
                UIUtils.showNotification('共有機能を使用するにはログインが必要です', 'warning');
                if (window.authManager) {
                    window.authManager.showAuthModal('login');
                }
                return;
            }

            const currentUser = window.authManager.getCurrentUser();
            if (!currentUser) {
                UIUtils.showNotification('ユーザー情報を取得できませんでした', 'error');
                return;
            }

            // Get owned fund sources
            const fundSources = window.storage.getFundSources();
            const ownedFundSources = fundSources.filter(fs =>
                !fs.ownerId || fs.ownerId === currentUser.id
            );

            if (ownedFundSources.length === 0) {
                UIUtils.showNotification('共有可能な資金元がありません', 'info');
                return;
            }

            const content = this.generateSharingManagementContent(ownedFundSources);
            this.uiManager.modalManager.showInfoModal('資金元の共有管理', content);

            // Add event listeners after modal is shown
            setTimeout(() => {
                this.attachSharingManagementListeners();
            }, 100);

        } catch (error) {
            console.error('Error opening sharing management modal:', error);
            UIUtils.showNotification('共有管理画面を開けませんでした', 'error');
        }
    }

    generateSharingManagementContent(fundSources) {
        return `
            <div class="sharing-management">
                <div class="sharing-intro">
                    <p>資金元を他のユーザーと共有して、家計管理を協力して行うことができます。</p>
                </div>
                
                <div class="fund-sources-list">
                    ${fundSources.map(fs => {
            const sharingStatus = this.sharingManager.getFundSourceSharingStatus(fs.id);
            const sharedUsers = sharingStatus ? sharingStatus.sharedWith : [];
            const pendingInvitations = this.invitationManager.getInvitationsByFundSource(fs.id)
                .filter(inv => inv.status === 'pending');

            return `
                            <div class="fund-source-item" data-fund-source-id="${fs.id}">
                                <div class="fund-source-header">
                                    <div class="fund-source-info">
                                        <div class="fund-source-name">
                                            ${UIUtils.getFundSourceIcon(fs.type)} ${UIUtils.escapeHtml(fs.name)}
                                        </div>
                                        <div class="fund-source-status">
                                            ${sharingStatus && sharingStatus.isShared ?
                    `<span class="sharing-badge shared">共有中 (${sharedUsers.length}人)</span>` :
                    '<span class="sharing-badge not-shared">未共有</span>'
                }
                                            ${pendingInvitations.length > 0 ?
                    `<span class="invitation-badge">${pendingInvitations.length}件の招待中</span>` : ''
                }
                                        </div>
                                    </div>
                                    <div class="fund-source-actions">
                                        <button class="btn secondary small manage-sharing-btn" data-fund-source-id="${fs.id}">
                                            管理
                                        </button>
                                    </div>
                                </div>
                                
                                ${sharingStatus && sharingStatus.isShared ? `
                                    <div class="shared-users-preview">
                                        <div class="shared-users-list">
                                            ${sharedUsers.slice(0, 3).map(user => `
                                                <div class="shared-user-item">
                                                    <span class="user-name">${UIUtils.escapeHtml(user.username)}</span>
                                                    <span class="user-email">${UIUtils.escapeHtml(user.email)}</span>
                                                </div>
                                            `).join('')}
                                            ${sharedUsers.length > 3 ? `
                                                <div class="more-users">他 ${sharedUsers.length - 3}人</div>
                                            ` : ''}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    attachSharingManagementListeners() {
        document.querySelectorAll('.manage-sharing-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fundSourceId = e.target.dataset.fundSourceId;
                this.openFundSourceSharingModal(fundSourceId);
            });
        });
    }

    openFundSourceSharingModal(fundSourceId) {
        try {
            this.currentFundSourceId = fundSourceId;

            const fundSources = window.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);

            if (!fundSource) {
                UIUtils.showNotification('資金元が見つかりません', 'error');
                return;
            }

            const sharingStatus = this.sharingManager.getFundSourceSharingStatus(fundSourceId);
            const sharedUsers = sharingStatus ? sharingStatus.sharedWith : [];
            const invitations = this.invitationManager.getInvitationsByFundSource(fundSourceId);
            const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

            const content = this.generateFundSourceSharingContent(fundSource, sharedUsers, pendingInvitations);
            this.uiManager.modalManager.showInfoModal(`${fundSource.name} の共有設定`, content);

            // Add event listeners after modal is shown
            setTimeout(() => {
                this.attachFundSourceSharingListeners();
            }, 100);

        } catch (error) {
            console.error('Error opening fund source sharing modal:', error);
            UIUtils.showNotification('共有設定画面を開けませんでした', 'error');
        }
    }

    generateFundSourceSharingContent(fundSource, sharedUsers, pendingInvitations) {
        return `
            <div class="fund-source-sharing">
                <div class="fund-source-info-header">
                    <div class="fund-source-details">
                        <h4>${UIUtils.getFundSourceIcon(fundSource.type)} ${UIUtils.escapeHtml(fundSource.name)}</h4>
                        <p>現在の残高: ${UIUtils.formatCurrency(fundSource.balance || 0)}</p>
                    </div>
                </div>

                <!-- 招待送信フォーム -->
                <div class="invitation-form-section">
                    <h5>新しいユーザーを招待</h5>
                    <div class="invitation-form">
                        <div class="form-group">
                            <label for="invite-email">メールアドレス</label>
                            <input type="email" id="invite-email" placeholder="example@email.com" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>権限設定</label>
                            <div class="permission-options">
                                <label class="permission-option">
                                    <input type="checkbox" id="perm-view" checked disabled>
                                    <span>閲覧</span>
                                </label>
                                <label class="permission-option">
                                    <input type="checkbox" id="perm-edit" checked>
                                    <span>編集</span>
                                </label>
                                <label class="permission-option">
                                    <input type="checkbox" id="perm-delete">
                                    <span>削除</span>
                                </label>
                            </div>
                        </div>
                        <button id="send-invitation-btn" class="btn primary">招待を送信</button>
                    </div>
                </div>

                <!-- 共有ユーザー一覧 -->
                ${sharedUsers.length > 0 ? `
                    <div class="shared-users-section">
                        <h5>共有中のユーザー (${sharedUsers.length}人)</h5>
                        <div class="shared-users-list">
                            ${sharedUsers.map(user => `
                                <div class="shared-user-item" data-user-id="${user.userId}">
                                    <div class="user-info">
                                        <div class="user-name">${UIUtils.escapeHtml(user.username)}</div>
                                        <div class="user-email">${UIUtils.escapeHtml(user.email)}</div>
                                        <div class="user-permissions">
                                            ${user.permissions.canView ? '<span class="permission-tag">閲覧</span>' : ''}
                                            ${user.permissions.canEdit ? '<span class="permission-tag">編集</span>' : ''}
                                            ${user.permissions.canDelete ? '<span class="permission-tag">削除</span>' : ''}
                                        </div>
                                    </div>
                                    <div class="user-actions">
                                        <button class="btn secondary small edit-permissions-btn" data-user-id="${user.userId}">
                                            権限変更
                                        </button>
                                        <button class="btn secondary small remove-user-btn" data-user-id="${user.userId}">
                                            削除
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- 招待中のユーザー -->
                ${pendingInvitations.length > 0 ? `
                    <div class="pending-invitations-section">
                        <h5>招待中のユーザー (${pendingInvitations.length}件)</h5>
                        <div class="pending-invitations-list">
                            ${pendingInvitations.map(invitation => `
                                <div class="pending-invitation-item" data-invitation-id="${invitation.id}">
                                    <div class="invitation-info">
                                        <div class="invitation-email">${UIUtils.escapeHtml(invitation.inviteeEmail)}</div>
                                        <div class="invitation-date">送信日: ${UIUtils.formatDate(invitation.createdAt)}</div>
                                        <div class="invitation-expires">期限: ${UIUtils.formatDate(invitation.expiresAt)}</div>
                                    </div>
                                    <div class="invitation-actions">
                                        <button class="btn secondary small resend-invitation-btn" data-invitation-id="${invitation.id}">
                                            再送信
                                        </button>
                                        <button class="btn secondary small cancel-invitation-btn" data-invitation-id="${invitation.id}">
                                            取り消し
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- 共有停止 -->
                ${sharedUsers.length > 0 || pendingInvitations.length > 0 ? `
                    <div class="sharing-actions-section">
                        <button id="stop-sharing-btn" class="btn secondary">この資金元の共有を停止</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    attachFundSourceSharingListeners() {
        // 招待送信
        const sendInvitationBtn = document.getElementById('send-invitation-btn');
        if (sendInvitationBtn) {
            sendInvitationBtn.addEventListener('click', () => {
                this.handleSendInvitation();
            });
        }

        // 権限変更
        document.querySelectorAll('.edit-permissions-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.handleEditUserPermissions(userId);
            });
        });

        // ユーザー削除
        document.querySelectorAll('.remove-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.handleRemoveUser(userId);
            });
        });

        // 招待再送信
        document.querySelectorAll('.resend-invitation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invitationId = e.target.dataset.invitationId;
                this.handleResendInvitation(invitationId);
            });
        });

        // 招待取り消し
        document.querySelectorAll('.cancel-invitation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invitationId = e.target.dataset.invitationId;
                this.handleCancelInvitation(invitationId);
            });
        });

        // 共有停止
        const stopSharingBtn = document.getElementById('stop-sharing-btn');
        if (stopSharingBtn) {
            stopSharingBtn.addEventListener('click', () => {
                this.handleStopSharing();
            });
        }
    }

    async handleSendInvitation() {
        try {
            const emailInput = document.getElementById('invite-email');
            const email = emailInput.value.trim();

            if (!email) {
                UIUtils.showNotification('メールアドレスを入力してください', 'warning');
                return;
            }

            if (!UIUtils.isValidEmail(email)) {
                UIUtils.showNotification('有効なメールアドレスを入力してください', 'warning');
                return;
            }

            // Get permissions
            const permissions = {
                canView: true, // Always true
                canEdit: document.getElementById('perm-edit').checked,
                canDelete: document.getElementById('perm-delete').checked
            };

            console.log('Sending invitation...', { 
                fundSourceId: this.currentFundSourceId, 
                email, 
                permissions 
            });

            // Check if invitationTokenDisplay is available
            if (!this.invitationTokenDisplay) {
                console.error('InvitationTokenDisplayManager not initialized');
                UIUtils.showNotification('招待システムが初期化されていません', 'error');
                return;
            }

            // Generate and display invitation token
            const invitation = await this.invitationTokenDisplay.generateAndDisplayInvitation(
                this.currentFundSourceId,
                email,
                permissions
            );

            console.log('Invitation generated:', invitation);

            // Clear form
            emailInput.value = '';
            document.getElementById('perm-edit').checked = true;
            document.getElementById('perm-delete').checked = false;

            // Close current modal
            if (this.uiManager && this.uiManager.modalManager) {
                this.uiManager.modalManager.closeModal('info-modal');
            }

        } catch (error) {
            console.error('Error sending invitation:', error);
            UIUtils.showNotification(error.message || '招待の送信に失敗しました', 'error');
        }
    }

    handleEditUserPermissions(userId) {
        try {
            const sharedUsers = this.sharingManager.getSharedUsers(this.currentFundSourceId);
            const user = sharedUsers.find(u => u.userId === userId);

            if (!user) {
                UIUtils.showNotification('ユーザーが見つかりません', 'error');
                return;
            }

            const content = `
                <div class="permission-edit-form">
                    <h4>${UIUtils.escapeHtml(user.username)} の権限設定</h4>
                    <p>メール: ${UIUtils.escapeHtml(user.email)}</p>
                    
                    <div class="permission-options">
                        <label class="permission-option">
                            <input type="checkbox" id="edit-perm-view" checked disabled>
                            <span>閲覧 (必須)</span>
                        </label>
                        <label class="permission-option">
                            <input type="checkbox" id="edit-perm-edit" ${user.permissions.canEdit ? 'checked' : ''}>
                            <span>編集</span>
                        </label>
                        <label class="permission-option">
                            <input type="checkbox" id="edit-perm-delete" ${user.permissions.canDelete ? 'checked' : ''}>
                            <span>削除</span>
                        </label>
                    </div>
                    
                    <div class="form-actions">
                        <button id="save-permissions-btn" class="btn primary" data-user-id="${userId}">保存</button>
                        <button id="cancel-permissions-btn" class="btn secondary">キャンセル</button>
                    </div>
                </div>
            `;

            this.uiManager.modalManager.showInfoModal('権限設定', content);

            setTimeout(() => {
                const saveBtn = document.getElementById('save-permissions-btn');
                const cancelBtn = document.getElementById('cancel-permissions-btn');

                if (saveBtn) {
                    saveBtn.addEventListener('click', () => {
                        this.saveUserPermissions(userId);
                    });
                }

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        this.openFundSourceSharingModal(this.currentFundSourceId);
                    });
                }
            }, 100);

        } catch (error) {
            console.error('Error editing user permissions:', error);
            UIUtils.showNotification('権限編集画面を開けませんでした', 'error');
        }
    }

    saveUserPermissions(userId) {
        try {
            const permissions = {
                canView: true,
                canEdit: document.getElementById('edit-perm-edit').checked,
                canDelete: document.getElementById('edit-perm-delete').checked
            };

            this.sharingManager.updateUserPermissions(this.currentFundSourceId, userId, permissions);
            UIUtils.showNotification('権限を更新しました', 'success');

            // Return to fund source sharing modal
            setTimeout(() => {
                this.openFundSourceSharingModal(this.currentFundSourceId);
            }, 500);

        } catch (error) {
            console.error('Error saving user permissions:', error);
            UIUtils.showNotification(error.message || '権限の更新に失敗しました', 'error');
        }
    }

    handleRemoveUser(userId) {
        try {
            const sharedUsers = this.sharingManager.getSharedUsers(this.currentFundSourceId);
            const user = sharedUsers.find(u => u.userId === userId);

            if (!user) {
                UIUtils.showNotification('ユーザーが見つかりません', 'error');
                return;
            }

            if (confirm(`${user.username} (${user.email}) を共有から削除しますか？`)) {
                this.sharingManager.removeSharedUser(this.currentFundSourceId, userId);
                UIUtils.showNotification('ユーザーを削除しました', 'success');

                // Refresh modal
                setTimeout(() => {
                    this.openFundSourceSharingModal(this.currentFundSourceId);
                }, 500);
            }

        } catch (error) {
            console.error('Error removing user:', error);
            UIUtils.showNotification(error.message || 'ユーザーの削除に失敗しました', 'error');
        }
    }

    handleResendInvitation(invitationId) {
        try {
            if (confirm('この招待を再送信しますか？')) {
                const result = this.sharingManager.resendInvitation(invitationId);
                UIUtils.showNotification('招待を再送信しました', 'success');

                // Refresh modal
                setTimeout(() => {
                    this.openFundSourceSharingModal(this.currentFundSourceId);
                }, 1000);
            }

        } catch (error) {
            console.error('Error resending invitation:', error);
            UIUtils.showNotification(error.message || '招待の再送信に失敗しました', 'error');
        }
    }

    handleCancelInvitation(invitationId) {
        try {
            if (confirm('この招待を取り消しますか？')) {
                this.sharingManager.cancelInvitation(invitationId);
                UIUtils.showNotification('招待を取り消しました', 'success');

                // Refresh modal
                setTimeout(() => {
                    this.openFundSourceSharingModal(this.currentFundSourceId);
                }, 500);
            }

        } catch (error) {
            console.error('Error cancelling invitation:', error);
            UIUtils.showNotification(error.message || '招待の取り消しに失敗しました', 'error');
        }
    }

    handleStopSharing() {
        try {
            const fundSources = window.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === this.currentFundSourceId);

            if (!fundSource) {
                UIUtils.showNotification('資金元が見つかりません', 'error');
                return;
            }

            if (confirm(`${fundSource.name} の共有を完全に停止しますか？\n\n・すべての共有ユーザーのアクセスが削除されます\n・未処理の招待がすべて取り消されます`)) {
                // Cancel all pending invitations
                this.sharingManager.cancelAllInvitations(this.currentFundSourceId);

                // Remove all shared users
                this.sharingManager.unshareFundSource(this.currentFundSourceId);

                UIUtils.showNotification('共有を停止しました', 'success');

                // Close modal and refresh sharing management
                this.uiManager.modalManager.closeModal('info-modal');
                setTimeout(() => {
                    this.openSharingManagementModal();
                }, 500);
            }

        } catch (error) {
            console.error('Error stopping sharing:', error);
            UIUtils.showNotification(error.message || '共有の停止に失敗しました', 'error');
        }
    }

    openSharedUsersModal() {
        try {
            // Check authentication
            if (!window.authManager || !window.authManager.getIsLoggedIn()) {
                UIUtils.showNotification('この機能を使用するにはログインが必要です', 'warning');
                if (window.authManager) {
                    window.authManager.showAuthModal('login');
                }
                return;
            }

            const currentUser = window.authManager.getCurrentUser();
            if (!currentUser) {
                UIUtils.showNotification('ユーザー情報を取得できませんでした', 'error');
                return;
            }

            // Get shared fund sources (where current user is a shared user)
            const sharedFundSources = this.sharingManager.getSharedFundSources();

            // Get received invitations
            const receivedInvitations = this.sharingManager.getReceivedInvitations('pending');

            const content = this.generateSharedUsersContent(sharedFundSources, receivedInvitations);
            this.uiManager.modalManager.showInfoModal('共有ユーザー管理', content);

            // Add event listeners after modal is shown
            setTimeout(() => {
                this.attachSharedUsersListeners();
            }, 100);

        } catch (error) {
            console.error('Error opening shared users modal:', error);
            UIUtils.showNotification('共有ユーザー画面を開けませんでした', 'error');
        }
    }

    generateSharedUsersContent(sharedFundSources, receivedInvitations) {
        return `
            <div class="shared-users-management">
                <!-- 受信した招待 -->
                ${receivedInvitations.length > 0 ? `
                    <div class="received-invitations-section">
                        <h5>受信した招待 (${receivedInvitations.length}件)</h5>
                        <div class="received-invitations-list">
                            ${receivedInvitations.map(invitation => {
            const details = this.sharingManager.getInvitationDetails(invitation.token);
            return `
                                    <div class="received-invitation-item" data-invitation-token="${invitation.token}">
                                        <div class="invitation-info">
                                            <div class="invitation-from">
                                                <strong>${UIUtils.escapeHtml(invitation.inviterUsername)}</strong> からの招待
                                            </div>
                                            <div class="invitation-fund-source">
                                                資金元: ${details.valid ? UIUtils.escapeHtml(details.fundSource.name) : '不明'}
                                            </div>
                                            <div class="invitation-date">
                                                受信日: ${UIUtils.formatDate(invitation.createdAt)}
                                            </div>
                                            <div class="invitation-expires">
                                                期限: ${UIUtils.formatDate(invitation.expiresAt)}
                                            </div>
                                        </div>
                                        <div class="invitation-actions">
                                            <button class="btn primary small accept-invitation-btn" data-invitation-token="${invitation.token}">
                                                受諾
                                            </button>
                                            <button class="btn secondary small decline-invitation-btn" data-invitation-token="${invitation.token}">
                                                拒否
                                            </button>
                                        </div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- 共有中の資金元 -->
                ${sharedFundSources.length > 0 ? `
                    <div class="shared-fund-sources-section">
                        <h5>共有中の資金元 (${sharedFundSources.length}件)</h5>
                        <div class="shared-fund-sources-list">
                            ${sharedFundSources.map(fs => {
            const currentUser = window.authManager.getCurrentUser();
            const userInfo = fs.sharedWith.find(user => user.userId === currentUser.id);
            const owner = fs.sharedWith.find(user => user.userId === fs.ownerId) ||
                { username: '所有者', email: '' };

            return `
                                    <div class="shared-fund-source-item" data-fund-source-id="${fs.id}">
                                        <div class="fund-source-info">
                                            <div class="fund-source-name">
                                                ${UIUtils.getFundSourceIcon(fs.type)} ${UIUtils.escapeHtml(fs.name)}
                                            </div>
                                            <div class="fund-source-owner">
                                                所有者: ${UIUtils.escapeHtml(owner.username)}
                                            </div>
                                            <div class="fund-source-balance">
                                                残高: ${UIUtils.formatCurrency(fs.balance || 0)}
                                            </div>
                                            ${userInfo ? `
                                                <div class="user-permissions">
                                                    権限: 
                                                    ${userInfo.permissions.canView ? '<span class="permission-tag">閲覧</span>' : ''}
                                                    ${userInfo.permissions.canEdit ? '<span class="permission-tag">編集</span>' : ''}
                                                    ${userInfo.permissions.canDelete ? '<span class="permission-tag">削除</span>' : ''}
                                                </div>
                                            ` : ''}
                                        </div>
                                        <div class="fund-source-actions">
                                            <button class="btn secondary small leave-sharing-btn" data-fund-source-id="${fs.id}">
                                                共有を退出
                                            </button>
                                        </div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                ` : ''}

                ${receivedInvitations.length === 0 && sharedFundSources.length === 0 ? `
                    <div class="empty-state">
                        <p>共有中の資金元や招待はありません。</p>
                        <p>他のユーザーから招待を受けると、ここに表示されます。</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    attachSharedUsersListeners() {
        // 招待受諾
        document.querySelectorAll('.accept-invitation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const token = e.target.dataset.invitationToken;
                this.handleAcceptInvitation(token);
            });
        });

        // 招待拒否
        document.querySelectorAll('.decline-invitation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const token = e.target.dataset.invitationToken;
                this.handleDeclineInvitation(token);
            });
        });

        // 共有退出
        document.querySelectorAll('.leave-sharing-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fundSourceId = e.target.dataset.fundSourceId;
                this.handleLeaveSharing(fundSourceId);
            });
        });
    }

    handleAcceptInvitation(token) {
        try {
            if (confirm('この招待を受諾しますか？')) {
                const result = this.sharingManager.acceptInvitation(token);
                UIUtils.showNotification(`${result.fundSource.name} の共有に参加しました`, 'success');

                // Refresh modal and UI
                setTimeout(() => {
                    this.openSharedUsersModal();
                    // Refresh fund sources display
                    if (this.uiManager.renderFundSources) {
                        this.uiManager.renderFundSources();
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('Error accepting invitation:', error);
            UIUtils.showNotification(error.message || '招待の受諾に失敗しました', 'error');
        }
    }

    handleDeclineInvitation(token) {
        try {
            if (confirm('この招待を拒否しますか？')) {
                this.sharingManager.declineInvitation(token);
                UIUtils.showNotification('招待を拒否しました', 'success');

                // Refresh modal
                setTimeout(() => {
                    this.openSharedUsersModal();
                }, 500);
            }

        } catch (error) {
            console.error('Error declining invitation:', error);
            UIUtils.showNotification(error.message || '招待の拒否に失敗しました', 'error');
        }
    }

    handleLeaveSharing(fundSourceId) {
        try {
            const fundSources = window.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);

            if (!fundSource) {
                UIUtils.showNotification('資金元が見つかりません', 'error');
                return;
            }

            if (confirm(`${fundSource.name} の共有から退出しますか？\n\nこの資金元にアクセスできなくなります。`)) {
                const currentUser = window.authManager.getCurrentUser();
                this.sharingManager.removeSharedUser(fundSourceId, currentUser.id);
                UIUtils.showNotification('共有から退出しました', 'success');

                // Refresh modal and UI
                setTimeout(() => {
                    this.openSharedUsersModal();
                    // Refresh fund sources display
                    if (this.uiManager.renderFundSources) {
                        this.uiManager.renderFundSources();
                    }
                }, 500);
            }

        } catch (error) {
            console.error('Error leaving sharing:', error);
            UIUtils.showNotification(error.message || '共有の退出に失敗しました', 'error');
        }
    }

    // 6.2 招待受諾UIの実装
    openInvitationAcceptanceModal(invitationToken = null) {
        try {
            const content = this.generateInvitationAcceptanceContent(invitationToken);
            this.uiManager.modalManager.showInfoModal('招待の受諾', content);

            // Add event listeners after modal is shown
            setTimeout(() => {
                this.attachInvitationAcceptanceListeners();
            }, 100);

        } catch (error) {
            console.error('Error opening invitation acceptance modal:', error);
            UIUtils.showNotification('招待受諾画面を開けませんでした', 'error');
        }
    }

    generateInvitationAcceptanceContent(invitationToken) {
        return `
            <div class="invitation-acceptance">
                <div class="invitation-form-section">
                    <h5>招待トークンを入力</h5>
                    <p>他のユーザーから受け取った招待トークンを入力してください。</p>
                    
                    <div class="form-group">
                        <label for="invitation-token-input">招待トークン</label>
                        <input type="text" id="invitation-token-input" 
                               placeholder="inv_xxxxxxxxxx" 
                               class="form-control"
                               value="${invitationToken || ''}">
                        <small class="form-help">
                            招待トークンは「inv_」で始まる文字列です
                        </small>
                    </div>
                    
                    <div class="form-actions">
                        <button id="validate-token-btn" class="btn primary">招待内容を確認</button>
                    </div>
                </div>

                <div id="invitation-details-section" class="invitation-details-section" style="display: none;">
                    <!-- 招待内容がここに表示されます -->
                </div>
            </div>
        `;
    }

    attachInvitationAcceptanceListeners() {
        const validateBtn = document.getElementById('validate-token-btn');
        const tokenInput = document.getElementById('invitation-token-input');

        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                this.validateAndShowInvitationDetails();
            });
        }

        if (tokenInput) {
            // Auto-validate if token is pre-filled
            if (tokenInput.value.trim()) {
                setTimeout(() => {
                    this.validateAndShowInvitationDetails();
                }, 500);
            }

            // Validate on Enter key
            tokenInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.validateAndShowInvitationDetails();
                }
            });
        }
    }

    validateAndShowInvitationDetails() {
        try {
            const tokenInput = document.getElementById('invitation-token-input');
            const token = tokenInput.value.trim();

            if (!token) {
                UIUtils.showNotification('招待トークンを入力してください', 'warning');
                return;
            }

            // Validate token format
            if (!token.startsWith('inv_')) {
                UIUtils.showNotification('無効な招待トークン形式です', 'warning');
                return;
            }

            this.currentInvitationToken = token;

            // Get invitation details
            const details = this.sharingManager.getInvitationDetails(token);

            if (!details.valid) {
                UIUtils.showNotification(details.error || '無効な招待トークンです', 'error');
                this.hideInvitationDetails();
                return;
            }

            // Show invitation details
            this.showInvitationDetails(details);

        } catch (error) {
            console.error('Error validating invitation token:', error);
            UIUtils.showNotification('招待トークンの検証に失敗しました', 'error');
            this.hideInvitationDetails();
        }
    }

    showInvitationDetails(details) {
        try {
            const detailsSection = document.getElementById('invitation-details-section');
            if (!detailsSection) return;

            const invitation = details.invitation;
            const fundSource = details.fundSource;

            // Check if user can accept this invitation
            const canAccept = this.sharingManager.canAcceptInvitation(this.currentInvitationToken);

            detailsSection.innerHTML = `
                <div class="invitation-details">
                    <div class="invitation-header">
                        <h5>招待内容の確認</h5>
                        <div class="invitation-status ${canAccept.canAccept ? 'valid' : 'invalid'}">
                            ${canAccept.canAccept ? '✅ 受諾可能' : '❌ 受諾不可'}
                        </div>
                    </div>

                    <div class="invitation-info-card">
                        <div class="invitation-from">
                            <h6>招待者</h6>
                            <p><strong>${UIUtils.escapeHtml(invitation.inviterUsername)}</strong></p>
                        </div>

                        <div class="fund-source-details">
                            <h6>共有される資金元</h6>
                            <div class="fund-source-card">
                                <div class="fund-source-icon">
                                    ${UIUtils.getFundSourceIcon(fundSource.type)}
                                </div>
                                <div class="fund-source-info">
                                    <div class="fund-source-name">${UIUtils.escapeHtml(fundSource.name)}</div>
                                    <div class="fund-source-type">${UIUtils.getFundSourceTypeName(fundSource.type)}</div>
                                    <div class="fund-source-balance">
                                        現在の残高: ${UIUtils.formatCurrency(fundSource.balance)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="permissions-details">
                            <h6>付与される権限</h6>
                            <div class="permissions-list">
                                ${invitation.permissions.canView ? '<span class="permission-tag granted">✅ 閲覧</span>' : '<span class="permission-tag denied">❌ 閲覧</span>'}
                                ${invitation.permissions.canEdit ? '<span class="permission-tag granted">✅ 編集</span>' : '<span class="permission-tag denied">❌ 編集</span>'}
                                ${invitation.permissions.canDelete ? '<span class="permission-tag granted">✅ 削除</span>' : '<span class="permission-tag denied">❌ 削除</span>'}
                            </div>
                        </div>

                        <div class="invitation-dates">
                            <div class="invitation-date">
                                <strong>招待日:</strong> ${UIUtils.formatDate(invitation.createdAt)}
                            </div>
                            <div class="invitation-expires">
                                <strong>有効期限:</strong> ${UIUtils.formatDate(invitation.expiresAt)}
                            </div>
                        </div>
                    </div>

                    ${!canAccept.canAccept ? `
                        <div class="invitation-error">
                            <p><strong>受諾できない理由:</strong></p>
                            <p>${canAccept.reason}</p>
                        </div>
                    ` : ''}

                    <div class="invitation-actions">
                        ${canAccept.canAccept ? `
                            <button id="accept-invitation-final-btn" class="btn primary">
                                招待を受諾する
                            </button>
                            <button id="decline-invitation-final-btn" class="btn secondary">
                                招待を拒否する
                            </button>
                        ` : `
                            <button id="close-invitation-btn" class="btn secondary">
                                閉じる
                            </button>
                        `}
                    </div>
                </div>
            `;

            detailsSection.style.display = 'block';

            // Add event listeners for action buttons
            setTimeout(() => {
                this.attachInvitationActionListeners();
            }, 100);

        } catch (error) {
            console.error('Error showing invitation details:', error);
            UIUtils.showNotification('招待内容の表示に失敗しました', 'error');
        }
    }

    hideInvitationDetails() {
        const detailsSection = document.getElementById('invitation-details-section');
        if (detailsSection) {
            detailsSection.style.display = 'none';
            detailsSection.innerHTML = '';
        }
    }

    attachInvitationActionListeners() {
        const acceptBtn = document.getElementById('accept-invitation-final-btn');
        const declineBtn = document.getElementById('decline-invitation-final-btn');
        const closeBtn = document.getElementById('close-invitation-btn');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.handleFinalAcceptInvitation();
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                this.handleFinalDeclineInvitation();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.uiManager.modalManager.closeModal('info-modal');
            });
        }
    }

    handleFinalAcceptInvitation() {
        try {
            if (!this.currentInvitationToken) {
                UIUtils.showNotification('招待トークンが見つかりません', 'error');
                return;
            }

            // Show confirmation dialog
            const details = this.sharingManager.getInvitationDetails(this.currentInvitationToken);
            if (!details.valid) {
                UIUtils.showNotification('無効な招待です', 'error');
                return;
            }

            const confirmMessage = `以下の招待を受諾しますか？\n\n` +
                `招待者: ${details.invitation.inviterUsername}\n` +
                `資金元: ${details.fundSource.name}\n` +
                `権限: ${details.invitation.permissions.canEdit ? '編集可能' : '閲覧のみ'}`;

            if (confirm(confirmMessage)) {
                const result = this.sharingManager.acceptInvitation(this.currentInvitationToken);

                UIUtils.showNotification(
                    `${result.fundSource.name} の共有に参加しました！`,
                    'success'
                );

                // Close modal and refresh UI
                this.uiManager.modalManager.closeModal('info-modal');

                // Refresh fund sources display
                setTimeout(() => {
                    if (this.uiManager.renderFundSources) {
                        this.uiManager.renderFundSources();
                    }
                    if (this.uiManager.populateSelects) {
                        this.uiManager.populateSelects();
                    }
                }, 500);

                // Show success message with next steps
                setTimeout(() => {
                    UIUtils.showNotification(
                        '共有資金元が資金元リストに追加されました。取引の作成や編集ができます。',
                        'info'
                    );
                }, 2000);
            }

        } catch (error) {
            console.error('Error accepting invitation:', error);
            UIUtils.showNotification(error.message || '招待の受諾に失敗しました', 'error');
        }
    }

    handleFinalDeclineInvitation() {
        try {
            if (!this.currentInvitationToken) {
                UIUtils.showNotification('招待トークンが見つかりません', 'error');
                return;
            }

            if (confirm('この招待を拒否しますか？\n\n拒否した招待は元に戻せません。')) {
                this.sharingManager.declineInvitation(this.currentInvitationToken);

                UIUtils.showNotification('招待を拒否しました', 'success');

                // Close modal
                this.uiManager.modalManager.closeModal('info-modal');
            }

        } catch (error) {
            console.error('Error declining invitation:', error);
            UIUtils.showNotification(error.message || '招待の拒否に失敗しました', 'error');
        }
    }

    // Utility method to open invitation acceptance with a specific token
    // This can be called from external sources (e.g., URL parameters, QR codes)
    processInvitationToken(token) {
        try {
            if (!token || !token.startsWith('inv_')) {
                UIUtils.showNotification('無効な招待トークンです', 'error');
                return;
            }

            // Check if user is logged in
            if (!window.authManager || !window.authManager.getIsLoggedIn()) {
                // Store token for after login
                sessionStorage.setItem('pendingInvitationToken', token);
                UIUtils.showNotification('招待を受諾するにはログインが必要です', 'warning');
                if (window.authManager) {
                    window.authManager.showAuthModal('login');
                }
                return;
            }

            // Open invitation acceptance modal with pre-filled token
            this.openInvitationAcceptanceModal(token);

        } catch (error) {
            console.error('Error processing invitation token:', error);
            UIUtils.showNotification('招待トークンの処理に失敗しました', 'error');
        }
    }

    // Check for pending invitation token after login
    checkPendingInvitationToken() {
        try {
            const pendingToken = sessionStorage.getItem('pendingInvitationToken');
            if (pendingToken) {
                sessionStorage.removeItem('pendingInvitationToken');

                // Small delay to ensure UI is ready
                setTimeout(() => {
                    this.processInvitationToken(pendingToken);
                }, 1000);
            }
        } catch (error) {
            console.error('Error checking pending invitation token:', error);
        }
    }

    // Method to add invitation acceptance button to settings
    addInvitationAcceptanceButton() {
        try {
            const sharingSection = document.getElementById('sharing-section');
            if (!sharingSection) return;

            // Check if button already exists
            if (document.getElementById('accept-invitation-btn')) return;

            const acceptInvitationItem = document.createElement('div');
            acceptInvitationItem.className = 'settings-item';
            acceptInvitationItem.id = 'accept-invitation-btn';
            acceptInvitationItem.innerHTML = `
                <span class="icon">📨</span>
                <span>招待を受諾</span>
                <span class="arrow">›</span>
            `;

            acceptInvitationItem.addEventListener('click', () => {
                this.openInvitationAcceptanceModal();
            });

            // Insert after shared users button
            const sharedUsersBtn = document.getElementById('shared-users');
            if (sharedUsersBtn && sharedUsersBtn.parentNode) {
                sharedUsersBtn.parentNode.insertBefore(acceptInvitationItem, sharedUsersBtn.nextSibling);
            } else {
                sharingSection.appendChild(acceptInvitationItem);
            }

        } catch (error) {
            console.error('Error adding invitation acceptance button:', error);
        }
    }

    // Enhanced UI methods for Task 12.2: UI応答性の向上

    // Enhanced share fund source with optimistic UI and progress indicators
    async shareFundSourceEnhanced(fundSourceId, userEmails, permissions) {
        if (!this.uiEnhancer) {
            // Fallback to original method
            return this.sharingManager.shareFundSource(fundSourceId, userEmails, permissions);
        }

        const startTime = performance.now();

        try {
            const result = await this.sharingManager.shareFundSourceEnhanced(fundSourceId, userEmails, permissions);

            // Track performance
            const duration = performance.now() - startTime;
            this.performanceTracker.recordOperation('shareFundSource', duration);

            // Update UI with enhanced responsiveness
            this.updateSharingUIWithAnimation();

            return result;

        } catch (error) {
            console.error('Enhanced share fund source failed:', error);
            throw error;
        }
    }

    // Enhanced send invitation with progress tracking
    async sendInvitationEnhanced(fundSourceId, userEmail, permissions) {
        if (!this.uiEnhancer) {
            return this.sharingManager.sendInvitation(fundSourceId, userEmail, permissions);
        }

        const startTime = performance.now();

        try {
            const result = await this.sharingManager.sendInvitationEnhanced(fundSourceId, userEmail, permissions);

            const duration = performance.now() - startTime;
            this.performanceTracker.recordOperation('sendInvitation', duration);

            // Show success animation
            this.showInvitationSentAnimation(userEmail);

            return result;

        } catch (error) {
            console.error('Enhanced send invitation failed:', error);
            throw error;
        }
    }

    // Enhanced accept invitation with optimistic UI
    async acceptInvitationEnhanced(invitationToken) {
        if (!this.uiEnhancer) {
            return this.sharingManager.acceptInvitation(invitationToken);
        }

        const startTime = performance.now();

        try {
            const result = await this.sharingManager.acceptInvitationEnhanced(invitationToken);

            const duration = performance.now() - startTime;
            this.performanceTracker.recordOperation('acceptInvitation', duration);

            // Update UI with smooth transitions
            this.updateFundSourcesWithTransition();

            return result;

        } catch (error) {
            console.error('Enhanced accept invitation failed:', error);
            throw error;
        }
    }

    // Update sharing UI with smooth animations
    updateSharingUIWithAnimation() {
        if (!this.uiEnhancer) {
            // Fallback to immediate update
            if (this.uiManager.renderFundSources) {
                this.uiManager.renderFundSources();
            }
            return;
        }

        // Use UI optimizer for smooth updates
        this.uiEnhancer.uiOptimizer.queueUpdate(() => {
            // Add fade-out animation to existing elements
            const fundSourceItems = document.querySelectorAll('.fund-source-item');
            fundSourceItems.forEach(item => {
                item.classList.add('fade-out');
            });

            // Update content after animation
            setTimeout(() => {
                if (this.uiManager.renderFundSources) {
                    this.uiManager.renderFundSources();
                }

                // Add fade-in animation to new elements
                setTimeout(() => {
                    const newItems = document.querySelectorAll('.fund-source-item');
                    newItems.forEach(item => {
                        item.classList.add('fade-in');
                    });
                }, 50);
            }, 150);
        }, 'high');
    }

    // Update fund sources with smooth transition
    updateFundSourcesWithTransition() {
        if (!this.uiEnhancer) {
            if (this.uiManager.renderFundSources) {
                this.uiManager.renderFundSources();
            }
            if (this.uiManager.populateSelects) {
                this.uiManager.populateSelects();
            }
            return;
        }

        // Stagger updates for better UX
        this.uiEnhancer.uiOptimizer.queueUpdate(() => {
            if (this.uiManager.renderFundSources) {
                this.uiManager.renderFundSources();
            }
        }, 'high');

        setTimeout(() => {
            this.uiEnhancer.uiOptimizer.queueUpdate(() => {
                if (this.uiManager.populateSelects) {
                    this.uiManager.populateSelects();
                }
            }, 'normal');
        }, 100);
    }

    // Show invitation sent animation
    showInvitationSentAnimation(userEmail) {
        if (!this.uiEnhancer) return;

        // Create temporary success indicator
        const indicator = document.createElement('div');
        indicator.className = 'invitation-sent-indicator';
        indicator.innerHTML = `
            <div class="success-icon">✓</div>
            <div class="success-message">招待を送信しました<br>${userEmail}</div>
        `;

        document.body.appendChild(indicator);

        // Animate in
        requestAnimationFrame(() => {
            indicator.classList.add('visible');
        });

        // Remove after delay
        setTimeout(() => {
            indicator.classList.add('removing');
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }, 2000);
    }

    // Enhanced modal opening with loading states
    openSharingManagementModalEnhanced() {
        if (!this.uiEnhancer) {
            return this.openSharingManagementModal();
        }

        const loadingId = 'sharing-modal-load';

        // Show loading indicator
        this.uiEnhancer.progressSystem.create(loadingId, {
            type: 'spinner',
            message: '共有設定を読み込み中...',
            overlay: false,
            position: 'center'
        });

        // Simulate async loading for better UX
        setTimeout(() => {
            try {
                this.openSharingManagementModal();
                this.uiEnhancer.progressSystem.complete(loadingId, '読み込み完了');
            } catch (error) {
                this.uiEnhancer.progressSystem.error(loadingId, '読み込みに失敗しました');
                throw error;
            }
        }, 300);
    }

    // Enhanced batch operations with progress tracking
    async performBatchSharingOperations(operations) {
        if (!this.uiEnhancer) {
            // Fallback to sequential execution
            const results = [];
            for (const operation of operations) {
                try {
                    const result = await operation();
                    results.push({ success: true, result });
                } catch (error) {
                    results.push({ success: false, error: error.message });
                }
            }
            return results;
        }

        return this.uiEnhancer.asyncOptimizer.executeParallel(
            operations,
            {
                progressMessage: '複数の共有操作を実行中...',
                maxConcurrency: 2,
                showProgress: true
            }
        );
    }

    // Enhanced loading state management
    setLoadingState(elementId, isLoading, message = '処理中...') {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (isLoading) {
            this.loadingStates.set(elementId, {
                originalContent: element.innerHTML,
                originalDisabled: element.disabled
            });

            element.classList.add('processing');
            element.disabled = true;

            if (element.tagName === 'BUTTON') {
                element.textContent = message;
            }
        } else {
            const state = this.loadingStates.get(elementId);
            if (state) {
                element.classList.remove('processing');
                element.disabled = state.originalDisabled;
                element.innerHTML = state.originalContent;
                this.loadingStates.delete(elementId);
            }
        }
    }

    // Enhanced error handling with better UX
    handleSharingError(error, operation = 'operation') {
        console.error(`Sharing ${operation} error:`, error);

        if (this.uiEnhancer) {
            // Show error with retry option for certain errors
            if (error.message.includes('ネットワーク') || error.message.includes('タイムアウト')) {
                const retryMessage = `${error.message}\n\n再試行しますか？`;
                if (confirm(retryMessage)) {
                    // Implement retry logic based on operation
                    return true; // Indicates retry requested
                }
            }
        }

        UIUtils.showNotification(error.message || `${operation}でエラーが発生しました`, 'error');
        return false;
    }

    // Get enhanced performance metrics
    getEnhancedPerformanceMetrics() {
        const baseMetrics = {
            loadingStates: this.loadingStates.size,
            performanceTracker: this.performanceTracker ? this.performanceTracker.getMetrics() : null
        };

        if (this.uiEnhancer) {
            return {
                ...baseMetrics,
                uiEnhancer: this.uiEnhancer.getPerformanceMetrics()
            };
        }

        return baseMetrics;
    }

    // Update auth-dependent UI elements
    updateAuthDependentUI() {
        try {
            const isLoggedIn = window.authManager && window.authManager.getIsLoggedIn();
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;

            // Update sharing section visibility and state
            const sharingSection = document.getElementById('sharing-section');
            if (sharingSection) {
                if (isLoggedIn && currentUser) {
                    sharingSection.style.display = 'block';

                    // Ensure invitation acceptance button is present
                    this.addInvitationAcceptanceButton();
                } else {
                    sharingSection.style.display = 'none';
                }
            }

            // Check for pending invitation tokens if user just logged in
            if (isLoggedIn && currentUser) {
                setTimeout(() => {
                    this.checkPendingInvitationToken();
                }, 500);
            }

        } catch (error) {
            console.error('Error updating sharing auth-dependent UI:', error);
        }
    }

    // Cleanup enhanced UI resources
    cleanupEnhancedUI() {
        if (this.uiEnhancer) {
            this.uiEnhancer.cleanup();
        }

        this.loadingStates.clear();

        // Remove any temporary UI elements
        const tempElements = document.querySelectorAll('.invitation-sent-indicator, .optimistic-update');
        tempElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }
}

// Export for use in other modules
window.SharingUIManager = SharingUIManager;

// Debug function to check initialization status
window.checkSharingUIStatus = function () {
    console.log('Sharing UI Status:', {
        SharingUIManager: !!window.SharingUIManager,
        sharingUIManager: !!window.sharingUIManager,
        uiManager: !!window.uiManager,
        sharingManager: !!window.sharingManager,
        invitationManager: !!window.invitationManager,
        permissionManager: !!window.permissionManager,
        authManager: !!window.authManager,
        isLoggedIn: window.authManager ? window.authManager.getIsLoggedIn() : false
    });

    if (window.sharingUIManager) {
        console.log('SharingUIManager methods:', {
            openSharingManagementModal: typeof window.sharingUIManager.openSharingManagementModal,
            openSharedUsersModal: typeof window.sharingUIManager.openSharedUsersModal,
            updateAuthDependentUI: typeof window.sharingUIManager.updateAuthDependentUI
        });
    }
};