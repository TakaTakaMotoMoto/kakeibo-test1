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

                return `
                    <div class="transaction-item ${!canEdit ? 'readonly' : ''}" data-id="${transaction.id}">
                        <div class="transaction-info">
                            <div class="transaction-category">
                                ${category ? category.icon : '📦'} ${category ? category.name : 'カテゴリなし'}
                                ${subcategory ? ` > ${subcategory.name}` : ''}
                                ${isShared ? '<span class="shared-indicator">🔗</span>' : ''}
                            </div>
                            <div class="transaction-date">
                                ${UIUtils.formatDate(transaction.date)}
                                ${fundSource ? `・${fundSource.name}` : ''}
                            </div>
                            <div class="transaction-creator">
                                👤 ${creatorDisplay}
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
                    const canDelete = window.dataManager ? 
                        window.dataManager.canDeleteFundSource(fundSource.id) : true;

                    const sharingSettings = window.dataManager ?
                        window.dataManager.getFundSourceSharingSettings(fundSource.id) :
                        { isShared: fundSource.isShared || false, sharedWith: fundSource.sharedWith || [] };

                    const sharedCount = sharingSettings.sharedWith.length;
                    const sharingIndicator = sharingSettings.isShared ?
                        `<span class="sharing-indicator" title="${sharedCount}人と共有中">🔗 ${sharedCount}</span>` : '';

                    return `
                        <div class="fundsource-item" data-id="${fundSource.id}">
                            <div class="fundsource-info">
                                <div class="fundsource-name">
                                    ${UIUtils.getFundSourceIcon(fundSource.type)} ${UIUtils.escapeHtml(fundSource.name)}
                                    ${sharingIndicator}
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
                                <button class="delete-btn ${canDelete ? '' : 'disabled'}" 
                                        data-id="${fundSource.id}" 
                                        title="${canDelete ? '削除' : '使用中のため削除できません'}"
                                        ${canDelete ? '' : 'disabled'}>
                                    🗑️
                                </button>
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
            const fundSources = window.storage.getFundSources();

            // Transaction form selects
            const categorySelect = document.getElementById('category');
            const fundSourceSelect = document.getElementById('fundSource');

            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">選択してください</option>' +
                    categories.map(cat => `<option value="${cat.id}">${cat.icon} ${UIUtils.escapeHtml(cat.name)}</option>`).join('');
            }

            if (fundSourceSelect) {
                fundSourceSelect.innerHTML = '<option value="">選択してください</option>' +
                    fundSources.map(fs => `<option value="${fs.id}">${UIUtils.getFundSourceIcon(fs.type)} ${UIUtils.escapeHtml(fs.name)}</option>`).join('');
            }

            // Filter form selects
            const filterCategorySelect = document.getElementById('filter-category');
            const filterFundSourceSelect = document.getElementById('filter-fund-source');

            if (filterCategorySelect) {
                filterCategorySelect.innerHTML = '<option value="">すべて</option>' +
                    categories.map(cat => `<option value="${cat.id}">${cat.icon} ${UIUtils.escapeHtml(cat.name)}</option>`).join('');
            }

            if (filterFundSourceSelect) {
                filterFundSourceSelect.innerHTML = '<option value="">すべて</option>' +
                    fundSources.map(fs => `<option value="${fs.id}">${UIUtils.getFundSourceIcon(fs.type)} ${UIUtils.escapeHtml(fs.name)}</option>`).join('');
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
                        UIUtils.showNotification('この取引は編集できません', 'warning');
                    }
                }
            });
        });

        // Add delete handlers
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
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