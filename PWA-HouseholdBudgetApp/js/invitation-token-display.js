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

    // Generate invitation and display token
    async generateAndDisplayInvitation(fundSourceId, userEmail, permissions = null) {
        try {
            // Generate invitation using sharing manager
            const invitation = window.sharingManager.sendInvitation(fundSourceId, userEmail, permissions);
            
            if (!invitation || !invitation.token) {
                throw new Error('招待の生成に失敗しました');
            }

            // Store invitation for reference
            this.currentInvitations.set(invitation.id, invitation);

            // Display invitation token
            this.displayInvitationToken(invitation);

            return invitation;

        } catch (error) {
            console.error('Error generating invitation:', error);
            UIUtils.showNotification('招待の生成に失敗しました: ' + error.message, 'error');
            throw error;
        }
    }

    // Display invitation token in modal
    displayInvitationToken(invitation) {
        const fundSources = window.storage.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === invitation.fundSourceId);
        const fundSourceName = fundSource ? fundSource.name : '不明な資金元';

        const content = this.generateInvitationTokenContent(invitation, fundSourceName);
        
        if (window.uiManager && window.uiManager.modalManager) {
            window.uiManager.modalManager.showInfoModal('招待トークン', content);
            
            // Attach event listeners after modal is shown
            setTimeout(() => {
                this.attachInvitationTokenListeners(invitation);
            }, 100);
        }
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
                            <span>${UIUtils.escapeHtml(fundSourceName)}</span>
                        </div>
                        <div class="detail-item">
                            <label>招待先:</label>
                            <span>${UIUtils.escapeHtml(invitation.inviteeEmail)}</span>
                        </div>
                        <div class="detail-item">
                            <label>有効期限:</label>
                            <span>${expiresAt}</span>
                        </div>
                    </div>
                </div>

                <div class="token-section">
                    <h5>招待トークン</h5>
                    <div class="token-display">
                        <div class="token-value" id="invitation-token-value">
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
                UIUtils.showNotification(successMessage, 'success');
            } else {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(text);
                UIUtils.showNotification(successMessage, 'success');
            }
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            UIUtils.showNotification('コピーに失敗しました', 'error');
            
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
                UIUtils.showNotification('QRコード機能は利用できません', 'warning');
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

            UIUtils.showNotification('QRコードを生成しました', 'success');

        } catch (error) {
            console.error('QR code generation failed:', error);
            UIUtils.showNotification('QRコードの生成に失敗しました', 'error');
        }
    }

    // Download QR code as image
    downloadQRCode(container) {
        try {
            const canvas = container.querySelector('canvas');
            if (!canvas) {
                UIUtils.showNotification('QRコードが見つかりません', 'error');
                return;
            }

            const link = document.createElement('a');
            link.download = `invitation-qr-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();

            UIUtils.showNotification('QRコードを保存しました', 'success');

        } catch (error) {
            console.error('QR code download failed:', error);
            UIUtils.showNotification('QRコードの保存に失敗しました', 'error');
        }
    }

    // Resend invitation
    async resendInvitation(invitation) {
        try {
            if (!confirm('招待を再送信しますか？\n\n新しいトークンが生成され、現在のトークンは無効になります。')) {
                return;
            }

            const result = window.sharingManager.resendInvitation(invitation.id);
            
            if (result && result.newInvitation) {
                // Close current modal
                if (window.uiManager && window.uiManager.modalManager) {
                    window.uiManager.modalManager.closeModal('info-modal');
                }

                // Show new invitation
                setTimeout(() => {
                    this.displayInvitationToken(result.newInvitation);
                }, 300);

                UIUtils.showNotification('招待を再送信しました', 'success');
            }

        } catch (error) {
            console.error('Resend invitation failed:', error);
            UIUtils.showNotification('招待の再送信に失敗しました: ' + error.message, 'error');
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

            UIUtils.showNotification('招待をキャンセルしました', 'success');

        } catch (error) {
            console.error('Cancel invitation failed:', error);
            UIUtils.showNotification('招待のキャンセルに失敗しました: ' + error.message, 'error');
        }
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