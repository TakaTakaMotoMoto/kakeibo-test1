// UI Rendering Functions
class UIRenderer {
    constructor() {
        this.currentView = 'transactions';
        this.currentTransactionView = 'list';
    }

    renderTransactions() {
        const container = document.getElementById('list-view');
        if (!container) return;

        try {
            const transactions = window.dataManager.getTransactions(true);
            const categories = window.storage.getCategories();
            const fundSources = window.storage.getFundSources();

            if (transactions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <h3>取引がありません</h3>
                        <p>右上の + ボタンから取引を追加してください</p>
                    </div>
                `;
                return;
            }

            const html = transactions.map(transaction => {
                const category = categories.find(c => c.id === transaction.categoryId);
                const subcategory = transaction.subcategoryId ?
                    window.storage.getSubcategories().find(sc => sc.id === transaction.subcategoryId) : null;
                const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
                const creatorDisplay = window.dataManager.getTransactionCreatorDisplay(transaction);
                const canEdit = window.dataManager.canEditTransaction(transaction);
                const isShared = window.dataManager.isTransactionShared(transaction);
                const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
                const isOwnTransaction = currentUser && transaction.createdBy === currentUser.id;

                // Enhanced sharing indicator for transactions
                const sharingIndicator = isShared ? 
                    `<span class="shared-indicator" title="共有取引">🔗 共有</span>` : '';

                // Enhanced creator display with badge
                const creatorBadge = this.generateCreatorBadge(transaction, creatorDisplay, isOwnTransaction);

                return `
                    <div class="transaction-item ${!canEdit ? 'readonly' : ''} ${isShared ? 'shared-transaction' : ''}" data-id="${transaction.id}">
                        <div class="transaction-info">
                            <div class="transaction-category">
                                ${category ? category.icon : '📦'} ${category ? category.name : 'カテゴリなし'}
                                ${subcategory ? ` > ${subcategory.name}` : ''}
                                ${sharingIndicator}
                            </div>
                            <div class="transaction-date">
                                ${UIUtils.formatDate(transaction.date)}
                                ${fundSource ? `・${fundSource.name}` : ''}
                            </div>
                            <div class="transaction-creator">
                                ${creatorBadge}
                            </div>
                            ${transaction.note ? `<div class="transaction-note">${UIUtils.escapeHtml(transaction.note)}</div>` : ''}
                        </div>
                        <div class="transaction-actions">
                            <div class="transaction-amount ${transaction.amount < 0 ? 'expense' : 'income'}">
                                ${UIUtils.formatCurrency(transaction.amount)}
                            </div>
                            ${canEdit ? `
                                <button class="delete-btn" data-id="${transaction.id}" title="削除">
                                    🗑️
                                </button>
                            ` : `
                                <div class="readonly-indicator" title="編集権限がありません">
                                    🔒
                                </div>
                            `}
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
            this.attachTransactionEventListeners(container);

        } catch (error) {
            console.error('Error rendering transactions:', error);
            container.innerHTML = '<div class="error-state">取引の読み込みでエラーが発生しました</div>';
        }
    }

    renderFundSources() {
        const container = document.getElementById('fundsources-list');
        if (!container) return;

        try {
            let fundSources = window.storage.getFundSources() || [];

            let html = `
                <div class="fundsource-item add-fundsource" style="border: 2px dashed var(--border-color); justify-content: center; cursor: pointer;">
                    <div class="fundsource-info text-center">
                        <div class="fundsource-name">+ 資金元を追加</div>
                    </div>
                </div>
            `;

            if (fundSources.length === 0) {
                html += `
                    <div class="empty-state">
                        <div class="empty-icon">💳</div>
                        <h3>資金元がありません</h3>
                        <p>上の「+ 資金元を追加」ボタンから追加してください</p>
                    </div>
                `;
            } else {
                html += fundSources.map(fundSource => {
                    // Check permissions for fund source management
                    const canDelete = window.dataManager ? 
                        window.dataManager.canDeleteFundSource(fundSource.id) : true;
                    const canManage = window.dataManager ?
                        window.dataManager.canManageFundSource(fundSource.id) : true;
                    const canView = window.dataManager ?
                        window.dataManager.canViewFundSource(fundSource.id) : true;

                    // Skip fund sources user cannot view
                    if (!canView) {
                        return '';
                    }

                    const sharingSettings = window.dataManager ?
                        window.dataManager.getFundSourceSharingSettings(fundSource.id) :
                        { isShared: fundSource.isShared || false, sharedWith: fundSource.sharedWith || [] };

                    const sharedCount = sharingSettings.sharedWith.length;
                    
                    // Enhanced sharing indicator with tooltip
                    let sharingIndicator = '';
                    if (sharingSettings.isShared) {
                        const tooltipContent = this.generateSharingTooltip(sharingSettings);
                        sharingIndicator = `
                            <span class="sharing-indicator-enhanced" 
                                  data-tooltip="${tooltipContent}"
                                  title="${sharedCount}人と共有中">
                                <span class="sharing-icon">🔗</span>
                                <span class="sharing-count">${sharedCount}</span>
                            </span>
                        `;
                    }

                    // Get user permission level for display
                    const permissionLevel = window.dataManager ?
                        window.dataManager.getUserPermissionLevel(fundSource.id) : null;
                    const permissionDisplay = permissionLevel && permissionLevel !== 'owner' ?
                        `<span class="permission-level">${window.permissionManager.getPermissionLevelDisplayName(permissionLevel)}</span>` : '';

                    return `
                        <div class="fundsource-item ${!canManage ? 'readonly' : ''}" data-id="${fundSource.id}">
                            <div class="fundsource-info">
                                <div class="fundsource-name">
                                    ${UIUtils.getFundSourceIcon(fundSource.type)} ${UIUtils.escapeHtml(fundSource.name)}
                                    ${sharingIndicator}
                                    ${permissionDisplay}
                                </div>
                                <div class="fundsource-type">
                                    ${UIUtils.getFundSourceTypeName(fundSource.type)}
                                    ${sharingSettings.isShared ? '<span class="shared-status">共有中</span>' : ''}
                                </div>
                            </div>
                            <div class="fundsource-actions">
                                <div class="fundsource-balance">
                                    ${UIUtils.formatCurrency(fundSource.currentBalance)}
                                </div>
                                ${canManage ? `
                                    <button class="delete-btn ${canDelete ? '' : 'disabled'}" 
                                            data-id="${fundSource.id}" 
                                            title="${canDelete ? '削除' : '使用中のため削除できません'}"
                                            ${canDelete ? '' : 'disabled'}>
                                        🗑️
                                    </button>
                                ` : `
                                    <div class="readonly-indicator" title="管理権限がありません">
                                        🔒
                                    </div>
                                `}
                            </div>
                        </div>
                    `;
                }).join('');
            }

            container.innerHTML = html;
            this.attachFundSourceEventListeners(container);

        } catch (error) {
            console.error('Error rendering fund sources:', error);
            container.innerHTML = '<div class="error-state">資金元の読み込みでエラーが発生しました</div>';
        }
    }

    populateSelects() {
        try {
            const categories = window.storage.getCategories();
            let fundSources = window.storage.getFundSources();

            // Filter fund sources based on user permissions - only show fund sources user can view
            if (window.dataManager) {
                fundSources = fundSources.filter(fs => window.dataManager.canViewFundSource(fs.id));
            }

            // Transaction form selects
            const categorySelect = document.getElementById('category');
            const fundSourceSelect = document.getElementById('fundSource');

            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">選択してください</option>' +
                    categories.map(cat => `<option value="${cat.id}">${cat.icon} ${UIUtils.escapeHtml(cat.name)}</option>`).join('');
            }

            if (fundSourceSelect) {
                // For transaction form, only show fund sources where user can create transactions
                const editableFundSources = fundSources.filter(fs => {
                    if (!window.dataManager) return true;
                    
                    // Check if user has edit permission for this fund source
                    const permissions = window.dataManager.getUserPermissions(fs.id);
                    return permissions && permissions.canEdit;
                });

                fundSourceSelect.innerHTML = '<option value="">選択してください</option>' +
                    editableFundSources.map(fs => {
                        const permissionLevel = window.dataManager ? 
                            window.dataManager.getUserPermissionLevel(fs.id) : null;
                        const permissionIndicator = permissionLevel && permissionLevel !== 'owner' ? 
                            ` (${window.permissionManager.getPermissionLevelDisplayName(permissionLevel)})` : '';
                        
                        return `<option value="${fs.id}">${UIUtils.getFundSourceIcon(fs.type)} ${UIUtils.escapeHtml(fs.name)}${permissionIndicator}</option>`;
                    }).join('');
            }

            // Filter form selects - show all viewable fund sources for filtering
            const filterCategorySelect = document.getElementById('filter-category');
            const filterFundSourceSelect = document.getElementById('filter-fund-source');

            if (filterCategorySelect) {
                filterCategorySelect.innerHTML = '<option value="">すべて</option>' +
                    categories.map(cat => `<option value="${cat.id}">${cat.icon} ${UIUtils.escapeHtml(cat.name)}</option>`).join('');
            }

            if (filterFundSourceSelect) {
                filterFundSourceSelect.innerHTML = '<option value="">すべて</option>' +
                    fundSources.map(fs => {
                        const permissionLevel = window.dataManager ? 
                            window.dataManager.getUserPermissionLevel(fs.id) : null;
                        const permissionIndicator = permissionLevel && permissionLevel !== 'owner' ? 
                            ` (${window.permissionManager.getPermissionLevelDisplayName(permissionLevel)})` : '';
                        
                        return `<option value="${fs.id}">${UIUtils.getFundSourceIcon(fs.type)} ${UIUtils.escapeHtml(fs.name)}${permissionIndicator}</option>`;
                    }).join('');
            }

        } catch (error) {
            console.error('Error populating selects:', error);
        }
    }

    attachTransactionEventListeners(container) {
        // Add click handlers for transaction items
        container.querySelectorAll('.transaction-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn') && !e.target.classList.contains('readonly-indicator')) {
                    const id = item.dataset.id;
                    const transaction = window.storage.getTransactions().find(t => t.id === id);

                    if (transaction && window.dataManager.canEditTransaction(transaction)) {
                        window.uiManager.editTransaction(id);
                    } else {
                        // Enhanced error message for shared transactions
                        const isShared = window.dataManager.isTransactionShared(transaction);
                        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
                        const isOwnTransaction = currentUser && transaction.createdBy === currentUser.id;
                        
                        let message = 'この取引は編集できません';
                        if (isShared && !isOwnTransaction) {
                            message = '他のユーザーが作成した共有取引は編集できません';
                        } else if (isShared && !currentUser) {
                            message = '共有取引を編集するにはログインが必要です';
                        }
                        
                        UIUtils.showNotification(message, 'warning');
                    }
                }
            });
        });

        // Add delete handlers with enhanced permission checking
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const transaction = window.storage.getTransactions().find(t => t.id === id);
                
                if (transaction && window.dataManager.canDeleteTransaction && !window.dataManager.canDeleteTransaction(transaction)) {
                    const isShared = window.dataManager.isTransactionShared(transaction);
                    const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
                    const isOwnTransaction = currentUser && transaction.createdBy === currentUser.id;
                    
                    let message = 'この取引は削除できません';
                    if (isShared && !isOwnTransaction) {
                        message = '他のユーザーが作成した共有取引は削除できません';
                    }
                    
                    UIUtils.showNotification(message, 'warning');
                    return;
                }
                
                window.uiManager.confirmDeleteTransaction(id);
            });
        });
    }

    attachFundSourceEventListeners(container) {
        // Add click handler for add button
        const addButton = container.querySelector('.add-fundsource');
        if (addButton) {
            addButton.addEventListener('click', () => {
                window.uiManager.openFundSourceModal();
            });
        }

        // Add delete handlers for fund sources
        container.querySelectorAll('.fundsource-item .delete-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    window.uiManager.confirmDeleteFundSource(id);
                });
            }
        });

        // Add tooltip functionality for sharing indicators
        this.attachSharingTooltips(container);
    }

    attachSharingTooltips(container) {
        const sharingIndicators = container.querySelectorAll('.sharing-indicator-enhanced');
        
        sharingIndicators.forEach(indicator => {
            let tooltip = null;
            
            indicator.addEventListener('mouseenter', (e) => {
                const tooltipContent = e.target.dataset.tooltip;
                if (tooltipContent && !tooltip) {
                    tooltip = this.createTooltip(tooltipContent, e.target);
                    document.body.appendChild(tooltip);
                    this.positionTooltip(tooltip, e.target);
                }
            });
            
            indicator.addEventListener('mouseleave', () => {
                if (tooltip) {
                    document.body.removeChild(tooltip);
                    tooltip = null;
                }
            });
        });
    }

    createTooltip(content, target) {
        const tooltip = document.createElement('div');
        tooltip.className = 'sharing-tooltip';
        tooltip.innerHTML = content;
        return tooltip;
    }

    positionTooltip(tooltip, target) {
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Position above the target element
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
        tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
        tooltip.style.zIndex = '1000';
        
        // Adjust if tooltip goes off screen
        if (tooltip.offsetLeft < 0) {
            tooltip.style.left = '8px';
        }
        if (tooltip.offsetLeft + tooltipRect.width > window.innerWidth) {
            tooltip.style.left = `${window.innerWidth - tooltipRect.width - 8}px`;
        }
    }

    generateSharingTooltip(sharingSettings) {
        if (!sharingSettings.isShared || !sharingSettings.sharedWith.length) {
            return '';
        }

        const users = sharingSettings.sharedWith.slice(0, 3); // Show max 3 users
        const remainingCount = Math.max(0, sharingSettings.sharedWith.length - 3);
        
        let content = '<div class="tooltip-content">';
        content += '<div class="tooltip-title">共有ユーザー</div>';
        
        users.forEach(user => {
            const username = user.username || user.email || 'ユーザー';
            const permissions = this.formatPermissions(user.permissions);
            content += `
                <div class="tooltip-user">
                    <div class="tooltip-user-name">${UIUtils.escapeHtml(username)}</div>
                    <div class="tooltip-user-permissions">${permissions}</div>
                </div>
            `;
        });
        
        if (remainingCount > 0) {
            content += `<div class="tooltip-more">他 ${remainingCount}人</div>`;
        }
        
        content += '</div>';
        return content;
    }

    formatPermissions(permissions) {
        if (!permissions) return '権限なし';
        
        const perms = [];
        if (permissions.canView) perms.push('閲覧');
        if (permissions.canEdit) perms.push('編集');
        if (permissions.canDelete) perms.push('削除');
        
        return perms.length > 0 ? perms.join('・') : '権限なし';
    }

    generateCreatorBadge(transaction, creatorDisplay, isOwnTransaction) {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        if (!transaction.createdBy) {
            return `<span class="creator-badge guest">👤 ${creatorDisplay}</span>`;
        }
        
        if (isOwnTransaction) {
            return `<span class="creator-badge self">👤 ${creatorDisplay}</span>`;
        }
        
        // For shared transactions created by others
        const isShared = window.dataManager.isTransactionShared(transaction);
        if (isShared) {
            return `<span class="creator-badge other">👤 ${creatorDisplay}</span>`;
        }
        
        return `<span class="creator-badge">👤 ${creatorDisplay}</span>`;
    }

    updatePageTitle() {
        const titles = {
            transactions: '取引',
            charts: 'グラフ',
            fundsources: '資金元',
            settings: '設定'
        };
        const titleElement = document.getElementById('page-title');
        if (titleElement) {
            titleElement.textContent = titles[this.currentView] || '取引';
        }
    }
}

// Export for use in other modules
window.UIRenderer = UIRenderer;