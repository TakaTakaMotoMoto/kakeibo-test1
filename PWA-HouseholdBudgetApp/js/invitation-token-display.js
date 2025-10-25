// Invitation Token Display Manager - Handles invitation token display and sharing
class InvitationTokenDisplayManager {
    constructor() {
        this.currentInvitations = new Map();
        this.initialize();
    }

    initialize() {
        // Set up clipboard API support detection
        this.clipboardSupported = navigator.clipboard && window.isSecureContext;
        
        // Initialize QR code support (if available)
        this.qrCodeSupported = typeof QRCode !== 'undefined';
        
        console.log('InvitationTokenDisplayManager initialized', {
            clipboardSupported: this.clipboardSupported,
            qrCodeSupported: this.qrCodeSupported
        });
    }

    // Helper method to escape HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper method to show notifications
    showNotification(message, type = 'info') {
        // Try to use existing notification system
        if (window.UIUtils && window.UIUtils.showNotification) {
            window.UIUtils.showNotification(message, type);
        } else if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback to console and alert
            console.log(`[${type.toUpperCase()}] ${message}`);
            if (type === 'error') {
                alert(`エラー: ${message}`);
            } else if (type === 'success') {
                console.log(`成功: ${message}`);
            }
        }
    }

    // Generate invitation and display token
    async generateAndDisplayInvitation(fundSourceId, userEmail, permissions = null) {
        try {
            console.log('Generating invitation...', { fundSourceId, userEmail, permissions });

            // Check if sharing manager is available
            if (!window.sharingManager) {
                throw new Error('共有マネージャーが初期化されていません');
            }

                    // Ensure sharing manager is properly initialized
            if (!window.sharingManager || typeof window.sharingManager.sendInvitation !== 'function') {
                throw new Error('共有マネージャーが正しく初期化されていません');
            }

            // Validate input parameters to prevent null object errors
            if (!fundSourceId || typeof fundSourceId !== 'string') {
                throw new Error('有効な資金元IDが必要です');
            }

            if (!userEmail || typeof userEmail !== 'string') {
                throw new Error('有効なメールアドレスが必要です');
            }

            // Generate invitation using sharing manager
            const invitation = window.sharingManager.sendInvitation(fundSourceId, userEmail, permissions);
            
            console.log('Invitation created:', invitation);

            if (!invitation || !invitation.token) {
                throw new Error('招待の生成に失敗しました');
            }

            // Store invitation for reference
            this.currentInvitations.set(invitation.id, invitation);

            // Display invitation token immediately
            this.displayInvitationToken(invitation);

            this.showNotification('招待トークンを生成しました', 'success');

            return invitation;

        } catch (error) {
            console.error('Error generating invitation:', error);
            this.showNotification('招待の生成に失敗しました: ' + error.message, 'error');
            throw error;
        }
    }

    // Display invitation token in modal
    displayInvitationToken(invitation) {
        console.log('Displaying invitation token...', invitation);

        const fundSources = window.storage.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === invitation.fundSourceId);
        const fundSourceName = fundSource ? fundSource.name : '不明な資金元';

        const content = this.generateInvitationTokenContent(invitation, fundSourceName);
        
        console.log('Generated content for modal');

        // Try multiple ways to show the modal
        if (window.uiManager && window.uiManager.modalManager) {
            console.log('Using uiManager.modalManager');
            window.uiManager.modalManager.showInfoModal('招待トークン', content);
        } else if (window.modalManager) {
            console.log('Using global modalManager');
            window.modalManager.showInfoModal('招待トークン', content);
        } else {
            console.log('Using fallback modal display');
            this.showFallbackModal('招待トークン', content);
        }
        
        // Attach event listeners after modal is shown
        setTimeout(() => {
            this.attachInvitationTokenListeners(invitation);
        }, 200);
    }

    // Generate invitation token display content
    generateInvitationTokenContent(invitation, fundSourceName) {
        const invitationUrl = this.generateInvitationUrl(invitation.token);
        const expiresAt = new Date(invitation.expiresAt).toLocaleString('ja-JP');

        return `
            <div class="invitation-token-display">
                <div class="invitation-info">
                    <h4>招待が作成されました</h4>
                    <p>以下の招待トークンを相手に共有してください。</p>
                    
                    <div class="invitation-details">
                        <div class="detail-item">
                            <label>資金元:</label>
                            <span style="color: #000000 !important;">${this.escapeHtml(fundSourceName)}</span>
                        </div>
                        <div class="detail-item">
                            <label>招待先:</label>
                            <span style="color: #000000 !important;">${this.escapeHtml(invitation.inviteeEmail)}</span>
                        </div>
                        <div class="detail-item">
                            <label>有効期限:</label>
                            <span style="color: #000000 !important;">${expiresAt}</span>
                        </div>
                    </div>
                </div>

                <div class="token-section">
                    <h5>招待トークン</h5>
                    <div class="token-display">
                        <div class="token-value" id="invitation-token-value" style="color: #000000 !important;">
                            ${invitation.token}
                        </div>
                        <div class="token-actions">
                            <button class="btn primary small" id="copy-token-btn" title="トークンをコピー">
                                📋 コピー
                            </button>
                            <button class="btn secondary small" id="select-token-btn" title="トークンを選択">
                                📝 選択
                            </button>
                        </div>
                    </div>
                    <small class="token-help">
                        このトークンを相手に送信してください。相手はアプリで「招待を受諾」からこのトークンを入力できます。
                    </small>
                </div>

                <div class="url-section">
                    <h5>招待URL</h5>
                    <div class="url-display">
                        <div class="url-value" id="invitation-url-value">
                            ${invitationUrl}
                        </div>
                        <div class="url-actions">
                            <button class="btn primary small" id="copy-url-btn" title="URLをコピー">
                                📋 コピー
                            </button>
                            <button class="btn secondary small" id="open-url-btn" title="URLを開く">
                                🔗 開く
                            </button>
                        </div>
                    </div>
                    <small class="url-help">
                        このURLを相手に送信すると、クリックするだけで招待を受諾できます。
                    </small>
                </div>

                ${this.generateQRCodeSection(invitation.token, invitationUrl)}

                <div class="sharing-options">
                    <h5>共有方法</h5>
                    <div class="sharing-buttons">
                        <button class="btn success small" id="share-email-btn" title="メールで共有">
                            📧 メール
                        </button>
                        <button class="btn info small" id="share-sms-btn" title="SMSで共有">
                            💬 SMS
                        </button>
                        <button class="btn warning small" id="share-line-btn" title="LINEで共有">
                            💚 LINE
                        </button>
                        ${this.clipboardSupported ? `
                            <button class="btn secondary small" id="share-clipboard-btn" title="クリップボードに全情報をコピー">
                                📄 全コピー
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="invitation-management">
                    <h5>招待管理</h5>
                    <div class="management-buttons">
                        <button class="btn secondary small" id="resend-invitation-btn" title="招待を再送信">
                            🔄 再送信
                        </button>
                        <button class="btn danger small" id="cancel-invitation-btn" title="招待をキャンセル">
                            ❌ キャンセル
                        </button>
                    </div>
                    <small class="management-help">
                        招待をキャンセルすると、このトークンは無効になります。
                    </small>
                </div>
            </div>

            <style>
                .invitation-token-display {
                    max-width: 600px;
                }
                
                .invitation-details {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                }
                
                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .detail-item:last-child {
                    margin-bottom: 0;
                }
                
                .detail-item label {
                    font-weight: bold;
                    color: #666;
                }
                
                .detail-item span {
                    color: #000000 !important;
                }
                
                .token-section, .url-section {
                    margin: 20px 0;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background-color: #fafafa;
                }
                
                .token-display, .url-display {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 10px 0;
                }
                
                .token-value, .url-value {
                    flex: 1;
                    padding: 10px;
                    background-color: white;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 12px;
                    word-break: break-all;
                    user-select: all;
                    color: #000000 !important;
                }
                
                .token-actions, .url-actions {
                    display: flex;
                    gap: 5px;
                }
                
                .token-help, .url-help, .management-help {
                    color: #666;
                    font-size: 12px;
                    margin-top: 8px;
                    display: block;
                }
                
                .qr-code-section {
                    margin: 20px 0;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background-color: #fafafa;
                    text-align: center;
                }
                
                .qr-code-container {
                    margin: 15px 0;
                    display: flex;
                    justify-content: center;
                }
                
                .sharing-options, .invitation-management {
                    margin: 20px 0;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }
                
                .sharing-buttons, .management-buttons {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 10px;
                }
                
                .btn.small {
                    padding: 6px 12px;
                    font-size: 12px;
                }
                
                @media (max-width: 600px) {
                    .token-display, .url-display {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .token-actions, .url-actions {
                        justify-content: center;
                    }
                    
                    .sharing-buttons, .management-buttons {
                        justify-content: center;
                    }
                }
            </style>
        `;
    }

    // Generate QR code section if supported
    generateQRCodeSection(token, url) {
        if (!this.qrCodeSupported) {
            return `
                <div class="qr-code-section">
                    <h5>QRコード</h5>
                    <p>QRコード機能は利用できません。</p>
                    <small>QRコードライブラリが読み込まれていません。</small>
                </div>
            `;
        }

        return `
            <div class="qr-code-section">
                <h5>QRコード</h5>
                <p>相手にこのQRコードを読み取ってもらうことで、簡単に招待を共有できます。</p>
                <div class="qr-code-container" id="qr-code-container">
                    <!-- QR code will be generated here -->
                </div>
                <div class="qr-code-actions">
                    <button class="btn primary small" id="generate-qr-btn" data-url="${url}">
                        📱 QRコード生成
                    </button>
                    <button class="btn secondary small" id="download-qr-btn" style="display: none;">
                        💾 QRコード保存
                    </button>
                </div>
            </div>
        `;
    }

    // Generate invitation URL
    generateInvitationUrl(token) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?invitation=${encodeURIComponent(token)}`;
    }

    // Attach event listeners for invitation token display
    attachInvitationTokenListeners(invitation) {
        // Copy token button
        const copyTokenBtn = document.getElementById('copy-token-btn');
        if (copyTokenBtn) {
            copyTokenBtn.addEventListener('click', () => {
                this.copyToClipboard(invitation.token, 'トークンをコピーしました');
            });
        }

        // Select token button
        const selectTokenBtn = document.getElementById('select-token-btn');
        if (selectTokenBtn) {
            selectTokenBtn.addEventListener('click', () => {
                this.selectText('invitation-token-value');
            });
        }

        // Copy URL button
        const copyUrlBtn = document.getElementById('copy-url-btn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
                const url = this.generateInvitationUrl(invitation.token);
                this.copyToClipboard(url, 'URLをコピーしました');
            });
        }

        // Open URL button
        const openUrlBtn = document.getElementById('open-url-btn');
        if (openUrlBtn) {
            openUrlBtn.addEventListener('click', () => {
                const url = this.generateInvitationUrl(invitation.token);
                window.open(url, '_blank');
            });
        }

        // QR code generation
        const generateQrBtn = document.getElementById('generate-qr-btn');
        if (generateQrBtn) {
            generateQrBtn.addEventListener('click', () => {
                this.generateQRCode(invitation.token);
            });
        }

        // Sharing buttons
        this.attachSharingListeners(invitation);

        // Management buttons
        this.attachManagementListeners(invitation);
    }

    // Attach sharing method listeners
    attachSharingListeners(invitation) {
        const url = this.generateInvitationUrl(invitation.token);
        const fundSources = window.storage.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === invitation.fundSourceId);
        const fundSourceName = fundSource ? fundSource.name : '資金元';

        const shareText = `家計簿アプリの招待\n\n${fundSourceName}の共有に招待されました。\n\n招待トークン: ${invitation.token}\n\nまたは以下のURLをクリック:\n${url}`;

        // Email sharing
        const shareEmailBtn = document.getElementById('share-email-btn');
        if (shareEmailBtn) {
            shareEmailBtn.addEventListener('click', () => {
                const subject = encodeURIComponent(`家計簿アプリ - ${fundSourceName}の共有招待`);
                const body = encodeURIComponent(shareText);
                const mailtoUrl = `mailto:${invitation.inviteeEmail}?subject=${subject}&body=${body}`;
                window.open(mailtoUrl);
            });
        }

        // SMS sharing
        const shareSmsBtn = document.getElementById('share-sms-btn');
        if (shareSmsBtn) {
            shareSmsBtn.addEventListener('click', () => {
                const smsText = encodeURIComponent(shareText);
                const smsUrl = `sms:?body=${smsText}`;
                window.open(smsUrl);
            });
        }

        // LINE sharing
        const shareLineBtn = document.getElementById('share-line-btn');
        if (shareLineBtn) {
            shareLineBtn.addEventListener('click', () => {
                const lineText = encodeURIComponent(shareText);
                const lineUrl = `https://line.me/R/msg/text/?${lineText}`;
                window.open(lineUrl, '_blank');
            });
        }

        // Full clipboard copy
        const shareClipboardBtn = document.getElementById('share-clipboard-btn');
        if (shareClipboardBtn) {
            shareClipboardBtn.addEventListener('click', () => {
                this.copyToClipboard(shareText, '招待情報をクリップボードにコピーしました');
            });
        }
    }

    // Attach management listeners
    attachManagementListeners(invitation) {
        // Resend invitation
        const resendBtn = document.getElementById('resend-invitation-btn');
        if (resendBtn) {
            resendBtn.addEventListener('click', () => {
                this.resendInvitation(invitation);
            });
        }

        // Cancel invitation
        const cancelBtn = document.getElementById('cancel-invitation-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelInvitation(invitation);
            });
        }
    }

    // Copy text to clipboard
    async copyToClipboard(text, successMessage = 'コピーしました') {
        try {
            if (this.clipboardSupported) {
                await navigator.clipboard.writeText(text);
                this.showNotification(successMessage, 'success');
            } else {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(text);
                this.showNotification(successMessage, 'success');
            }
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            this.showNotification('コピーに失敗しました', 'error');
            
            // Show text in a prompt as fallback
            prompt('以下のテキストをコピーしてください:', text);
        }
    }

    // Fallback copy method for older browsers
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // Select text in element
    selectText(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            if (window.getSelection) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(element);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    // Generate QR code
    generateQRCode(token) {
        try {
            if (!this.qrCodeSupported) {
                this.showNotification('QRコード機能は利用できません', 'warning');
                return;
            }

            const container = document.getElementById('qr-code-container');
            const generateBtn = document.getElementById('generate-qr-btn');
            const downloadBtn = document.getElementById('download-qr-btn');

            if (!container) return;

            // Clear existing QR code
            container.innerHTML = '';

            const url = this.generateInvitationUrl(token);
            
            // Create QR code
            const qrCode = new QRCode(container, {
                text: url,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });

            // Show download button
            if (downloadBtn) {
                downloadBtn.style.display = 'inline-block';
                downloadBtn.onclick = () => this.downloadQRCode(container);
            }

            // Hide generate button
            if (generateBtn) {
                generateBtn.style.display = 'none';
            }

            this.showNotification('QRコードを生成しました', 'success');

        } catch (error) {
            console.error('QR code generation failed:', error);
            this.showNotification('QRコードの生成に失敗しました', 'error');
        }
    }

    // Download QR code as image
    downloadQRCode(container) {
        try {
            const canvas = container.querySelector('canvas');
            if (!canvas) {
                this.showNotification('QRコードが見つかりません', 'error');
                return;
            }

            const link = document.createElement('a');
            link.download = `invitation-qr-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();

            this.showNotification('QRコードを保存しました', 'success');

        } catch (error) {
            console.error('QR code download failed:', error);
            this.showNotification('QRコードの保存に失敗しました', 'error');
        }
    }

    // Resend invitation
    async resendInvitation(invitation) {
        // Check if operation is already in progress
        const operationKey = `resend_${invitation.id}`;
        if (this.processingOperations && this.processingOperations.has(operationKey)) {
            this.showNotification('招待の再送信は既に実行中です', 'warning');
            return;
        }

        try {
            if (!confirm('招待を再送信しますか？\n\n新しいトークンが生成され、現在のトークンは無効になります。')) {
                return;
            }

            // Initialize processing operations map if not exists
            if (!this.processingOperations) {
                this.processingOperations = new Map();
            }

            // Set operation in progress
            this.processingOperations.set(operationKey, {
                startTime: new Date(),
                type: 'resend'
            });

            const result = window.sharingManager.resendInvitation(invitation.id);
            
            if (result && result.success && result.newInvitation) {
                // Close current modal
                if (window.uiManager && window.uiManager.modalManager) {
                    window.uiManager.modalManager.closeModal('info-modal');
                }

                // Show new invitation
                setTimeout(() => {
                    this.displayInvitationToken(result.newInvitation);
                }, 300);

                this.showNotification('招待を再送信しました', 'success');
            } else {
                throw new Error('招待の再送信に失敗しました');
            }

        } catch (error) {
            console.error('Resend invitation failed:', error);
            this.showNotification('招待の再送信に失敗しました: ' + error.message, 'error');
        } finally {
            // Always clear operation state
            if (this.processingOperations) {
                this.processingOperations.delete(operationKey);
            }
        }
    }

    // Cancel invitation
    async cancelInvitation(invitation) {
        try {
            if (!confirm('この招待をキャンセルしますか？\n\nキャンセルした招待は元に戻せません。')) {
                return;
            }

            window.sharingManager.cancelInvitation(invitation.id);

            // Close modal
            if (window.uiManager && window.uiManager.modalManager) {
                window.uiManager.modalManager.closeModal('info-modal');
            }

            this.showNotification('招待をキャンセルしました', 'success');

        } catch (error) {
            console.error('Cancel invitation failed:', error);
            this.showNotification('招待のキャンセルに失敗しました: ' + error.message, 'error');
        }
    }

    // Fallback modal display method
    showFallbackModal(title, content) {
        // Create modal elements if they don't exist
        let modal = document.getElementById('invitation-token-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'invitation-token-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="invitation-token-modal-title">${title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal').style.display='none'">&times;</button>
                    </div>
                    <div class="modal-body" id="invitation-token-modal-body">
                        ${content}
                    </div>
                </div>
            `;
            
            // Add basic modal styles
            modal.style.cssText = `
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            `;
            
            const modalContent = modal.querySelector('.modal-content');
            modalContent.style.cssText = `
                background-color: white;
                margin: 5% auto;
                padding: 0;
                border-radius: 8px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
            `;
            
            const modalHeader = modal.querySelector('.modal-header');
            modalHeader.style.cssText = `
                padding: 20px;
                border-bottom: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const modalBody = modal.querySelector('.modal-body');
            modalBody.style.cssText = `
                padding: 20px;
            `;
            
            const closeBtn = modal.querySelector('.modal-close');
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            `;
            
            document.body.appendChild(modal);
        } else {
            // Update existing modal
            document.getElementById('invitation-token-modal-title').textContent = title;
            document.getElementById('invitation-token-modal-body').innerHTML = content;
        }
        
        // Show modal
        modal.style.display = 'block';
        
        // Close modal when clicking outside
        modal.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    // Process invitation from URL parameter
    processUrlInvitation() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const invitationToken = urlParams.get('invitation');

            if (invitationToken) {
                // Clear URL parameter
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);

                // Process invitation
                if (window.uiSharing) {
                    window.uiSharing.processInvitationToken(invitationToken);
                } else {
                    // Store for later processing
                    sessionStorage.setItem('pendingInvitationToken', invitationToken);
                }
            }

        } catch (error) {
            console.error('Error processing URL invitation:', error);
        }
    }
}

// Export for global use
window.InvitationTokenDisplayManager = InvitationTokenDisplayManager;

// Create global instance for immediate use
window.invitationTokenDisplay = new InvitationTokenDisplayManager();

// Debug function for testing
window.testInvitationTokenDisplay = function() {
    console.log('Testing invitation token display...');
    
    if (!window.invitationTokenDisplay) {
        window.invitationTokenDisplay = new InvitationTokenDisplayManager();
    }
    
    const mockInvitation = {
        id: 'debug-test-' + Date.now(),
        token: 'inv_debug_' + Date.now() + '_test',
        fundSourceId: 'debug-fund-source',
        inviterUserId: 'debug-user',
        inviterUsername: 'デバッグユーザー',
        inviteeEmail: 'debug@example.com',
        permissions: {
            canView: true,
            canEdit: true,
            canDelete: false
        },
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    
    window.invitationTokenDisplay.displayInvitationToken(mockInvitation);
    console.log('Debug invitation token displayed');
};

// Debug function for checking system status
window.checkSharingSystemStatus = function() {
    console.log('=== Sharing System Status ===');
    console.log('Storage:', !!window.storage);
    console.log('AuthManager:', !!window.authManager);
    console.log('PermissionManager:', !!window.permissionManager);
    console.log('InvitationManager:', !!window.invitationManager);
    console.log('SharingManager:', !!window.sharingManager);
    console.log('InvitationTokenDisplayManager:', !!window.invitationTokenDisplay);
    console.log('SharingUIManager:', !!window.sharingUIManager);
    
    if (window.storage) {
        console.log('Fund Sources:', window.storage.getFundSources().length);
        console.log('Categories:', window.storage.getCategories().length);
    }
    
    console.log('=== Class Availability ===');
    console.log('StorageManager:', typeof window.StorageManager);
    console.log('AuthManager:', typeof window.AuthManager);
    console.log('PermissionManager:', typeof window.PermissionManager);
    console.log('InvitationManager:', typeof window.InvitationManager);
    console.log('SharingManager:', typeof window.SharingManager);
    console.log('InvitationTokenDisplayManager:', typeof window.InvitationTokenDisplayManager);
    console.log('SharingUIManager:', typeof window.SharingUIManager);
    
    return {
        storage: !!window.storage,
        authManager: !!window.authManager,
        permissionManager: !!window.permissionManager,
        invitationManager: !!window.invitationManager,
        sharingManager: !!window.sharingManager,
        invitationTokenDisplay: !!window.invitationTokenDisplay,
        sharingUIManager: !!window.sharingUIManager
    };
};

// Debug function for manual sharing system initialization
window.initializeSharingSystemManually = function() {
    console.log('Manually initializing sharing system...');
    
    try {
        if (!window.storage) window.storage = new StorageManager();
        if (!window.authManager) window.authManager = new AuthManager();
        if (!window.permissionManager) window.permissionManager = new PermissionManager();
        if (!window.invitationManager) window.invitationManager = new InvitationManager(window.storage);
        if (!window.sharingManager) {
            window.sharingManager = new SharingManager(window.storage, window.authManager);
            window.sharingManager.initialize(window.invitationManager, window.permissionManager);
        }
        if (!window.invitationTokenDisplay) window.invitationTokenDisplay = new InvitationTokenDisplayManager();
        
        console.log('Manual initialization completed');
        return window.checkSharingSystemStatus();
        
    } catch (error) {
        console.error('Manual initialization failed:', error);
        return { error: error.message };
    }
};