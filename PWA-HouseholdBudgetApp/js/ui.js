// UI Management and Event Handlers
class UIManager {
    constructor() {
        this.currentView = 'transactions';
        this.currentTransactionView = 'list';
        this.editingTransaction = null;
        this.editingFundSource = null;
        this.editingSubcategory = null;
        this.selectedCategoryForSubcategory = null;
        this.currentModalEscapeHandler = null;

        this.initializeEventListeners();
        this.loadInitialData();
        this.initializeEnhancedInteractions();
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // View mode selector
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchTransactionView(mode);
            });
        });

        // Header buttons
        document.getElementById('add-btn').addEventListener('click', () => {
            this.openTransactionModal();
        });

        document.getElementById('filter-btn').addEventListener('click', () => {
            this.openFilterModal();
        });

        // Auth-related buttons
        const showLoginBtn = document.getElementById('show-login');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => {
                window.authManager.showAuthModal('login');
            });
        }

        // Modal close buttons
        document.querySelectorAll('.close-btn, [data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-btn') || e.target.hasAttribute('data-modal')) {
                    const modalId = e.target.dataset.modal || e.target.closest('.modal').id;
                    this.closeModal(modalId);
                }
            });
        });

        // Forms
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionSubmit(e);
        });

        document.getElementById('fundsource-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFundSourceSubmit(e);
        });

        // Filter actions
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Subcategory management
        document.getElementById('manage-subcategories').addEventListener('click', () => {
            this.openSubcategoryModal();
        });

        document.getElementById('add-subcategory').addEventListener('click', () => {
            this.openSubcategoryFormModal();
        });

        document.getElementById('subcategory-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubcategorySubmit(e);
        });

        // Category selection for subcategory management
        document.getElementById('category').addEventListener('change', (e) => {
            this.updateSubcategoryOptions(e.target.value);
        });

        // Settings actions
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data').addEventListener('click', () => {
            this.importData();
        });

        document.getElementById('clear-data').addEventListener('click', () => {
            this.clearAllData();
        });

        document.getElementById('install-app').addEventListener('click', () => {
            this.installApp();
        });

        // Sharing management
        const manageSharingBtn = document.getElementById('manage-sharing');
        if (manageSharingBtn) {
            manageSharingBtn.addEventListener('click', () => {
                this.showSharingManagement();
            });
        }

        const sharedUsersBtn = document.getElementById('shared-users');
        if (sharedUsersBtn) {
            sharedUsersBtn.addEventListener('click', () => {
                this.showSharedUsers();
            });
        }

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    loadInitialData() {
        this.renderTransactions();
        this.renderFundSources();
        this.populateSelects();
        this.updatePageTitle();
    }

    // View Management
    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}-view`);
        });

        this.currentView = viewName;
        this.updatePageTitle();

        // Load view-specific data
        if (viewName === 'charts') {
            window.chartManager.renderCategoryChart();
        }
    }

    switchTransactionView(mode) {
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        const listView = document.getElementById('list-view');
        const calendarView = document.getElementById('calendar-view');

        if (mode === 'list') {
            listView.style.display = 'block';
            calendarView.style.display = 'none';
        } else {
            listView.style.display = 'none';
            calendarView.style.display = 'block';
            window.calendarManager.renderCalendar();
        }

        this.currentTransactionView = mode;
    }

    updatePageTitle() {
        const titles = {
            transactions: '取引',
            charts: 'グラフ',
            fundsources: '資金元',
            settings: '設定'
        };
        document.getElementById('page-title').textContent = titles[this.currentView] || '取引';
    }

    // Transaction Management
    renderTransactions() {
        const container = document.getElementById('list-view');
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
                            ${window.dataManager.formatDate(transaction.date)}
                            ${fundSource ? `・${fundSource.name}` : ''}
                        </div>
                        <div class="transaction-creator">
                            👤 ${creatorDisplay}
                        </div>
                        ${transaction.note ? `<div class="transaction-note">${transaction.note}</div>` : ''}
                    </div>
                    <div class="transaction-actions">
                        <div class="transaction-amount ${transaction.amount < 0 ? 'expense' : 'income'}">
                            ${window.dataManager.formatCurrency(transaction.amount)}
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

        // Add click handlers
        container.querySelectorAll('.transaction-item').forEach(item => {
            // Edit transaction on item click (but not on delete button)
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn') && !e.target.classList.contains('readonly-indicator')) {
                    const id = item.dataset.id;
                    const transaction = window.storage.getTransactions().find(t => t.id === id);

                    if (transaction && window.dataManager.canEditTransaction(transaction)) {
                        this.editTransaction(id);
                    } else {
                        this.showNotification('この取引は編集できません', 'warning');
                    }
                }
            });
        });

        // Add delete handlers
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.confirmDeleteTransaction(id);
            });
        });
    }

    renderFundSources() {
        const container = document.getElementById('fundsources-list');
        if (!container) {
            console.error('Fund sources container not found');
            return;
        }

        let fundSources = [];
        try {
            fundSources = window.storage.getFundSources() || [];
        } catch (error) {
            console.error('Error getting fund sources:', error);
            fundSources = [];
        }

        // Always show the add button first
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
                let canDelete = false;
                try {
                    canDelete = window.dataManager ? window.dataManager.canDeleteFundSource(fundSource.id) : true;
                } catch (error) {
                    console.error('Error checking fund source deletion:', error);
                    canDelete = false;
                }

                // Get sharing information
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
                                ${this.getFundSourceIcon(fundSource.type)} ${fundSource.name}
                                ${sharingIndicator}
                            </div>
                            <div class="fundsource-type">
                                ${this.getFundSourceTypeName(fundSource.type)}
                                ${sharingSettings.isShared ? '<span class="shared-status">共有中</span>' : ''}
                            </div>
                        </div>
                        <div class="fundsource-actions">
                            <div class="fundsource-balance">
                                ${window.dataManager ? window.dataManager.formatCurrency(fundSource.currentBalance) : '¥' + fundSource.currentBalance.toLocaleString()}
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

        // Add click handler for add button
        const addButton = container.querySelector('.add-fundsource');
        if (addButton) {
            addButton.addEventListener('click', () => {
                try {
                    this.openFundSourceModal();
                } catch (error) {
                    console.error('Error opening fund source modal:', error);
                    this.showNotification('資金元追加モーダルを開けませんでした', 'error');
                }
            });
        }

        // Add delete handlers for fund sources
        container.querySelectorAll('.fundsource-item .delete-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    try {
                        this.confirmDeleteFundSource(id);
                    } catch (error) {
                        console.error('Error deleting fund source:', error);
                        this.showNotification('資金元の削除に失敗しました', 'error');
                    }
                });
            }
        });
    }

    getFundSourceIcon(type) {
        const icons = {
            cash: '💰',
            bank: '🏦',
            credit: '💳',
            savings: '🏛️',
            investment: '📈'
        };
        return icons[type] || '💳';
    }

    getFundSourceTypeName(type) {
        const names = {
            cash: '現金',
            bank: '銀行口座',
            credit: 'クレジットカード',
            savings: '貯金口座',
            investment: '投資口座'
        };
        return names[type] || 'その他';
    }

    populateSelects() {
        const categories = window.storage.getCategories();
        const fundSources = window.storage.getFundSources();

        // Transaction form selects
        const categorySelect = document.getElementById('category');
        const fundSourceSelect = document.getElementById('fundSource');

        categorySelect.innerHTML = '<option value="">選択してください</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('');

        fundSourceSelect.innerHTML = '<option value="">選択してください</option>' +
            fundSources.map(fs => `<option value="${fs.id}">${this.getFundSourceIcon(fs.type)} ${fs.name}</option>`).join('');

        // Filter form selects
        const filterCategorySelect = document.getElementById('filter-category');
        const filterFundSourceSelect = document.getElementById('filter-fund-source');

        filterCategorySelect.innerHTML = '<option value="">すべて</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('');

        if (filterFundSourceSelect) {
            filterFundSourceSelect.innerHTML = '<option value="">すべて</option>' +
                fundSources.map(fs => `<option value="${fs.id}">${this.getFundSourceIcon(fs.type)} ${fs.name}</option>`).join('');
        }

        // Update subcategory options for currently selected category
        const selectedCategoryId = categorySelect.value;
        if (selectedCategoryId) {
            this.updateSubcategoryOptions(selectedCategoryId);
        } else {
            this.updateSubcategoryOptions('');
        }
    }

    updateSubcategoryOptions(categoryId) {
        const subcategorySelect = document.getElementById('subcategory');
        const manageBtn = document.getElementById('manage-subcategories');

        if (!subcategorySelect) {
            console.warn('Subcategory select element not found');
            return;
        }

        if (!categoryId) {
            subcategorySelect.innerHTML = '<option value="">カテゴリを先に選択してください</option>';
            subcategorySelect.disabled = true;
            if (manageBtn) {
                manageBtn.disabled = true;
            }
            this.selectedCategoryForSubcategory = null;
            return;
        }

        try {
            const subcategories = window.dataManager.getSubcategories(categoryId);
            subcategorySelect.innerHTML = '<option value="">選択してください（任意）</option>' +
                subcategories.map(sc => `<option value="${sc.id}">${this.escapeHtml(sc.name)}</option>`).join('');

            subcategorySelect.disabled = false;
            if (manageBtn) {
                manageBtn.disabled = false;
            }
            this.selectedCategoryForSubcategory = categoryId;

            console.log(`Updated subcategory options for category ${categoryId}: ${subcategories.length} subcategories`);
        } catch (error) {
            console.error('Error updating subcategory options:', error);
            subcategorySelect.innerHTML = '<option value="">エラーが発生しました</option>';
            subcategorySelect.disabled = true;
            if (manageBtn) {
                manageBtn.disabled = true;
            }
            this.showNotification('サブカテゴリの読み込みでエラーが発生しました', 'error');
        }
    }

    // Enhanced UI interaction methods
    initializeEnhancedInteractions() {
        // Add enhanced button feedback to all buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('button:not(.no-feedback)') || e.target.closest('button:not(.no-feedback)')) {
                const button = e.target.matches('button') ? e.target : e.target.closest('button');
                this.addButtonClickFeedback(button);
            }
        });

        // Add form field validation on blur
        document.addEventListener('blur', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.validateFieldOnBlur(e.target);
            }
        }, true);

        // Add enhanced focus management
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
        });
    }

    addButtonClickFeedback(button) {
        if (!button || button.disabled || button.classList.contains('loading')) {
            return;
        }

        // Add ripple effect
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        const x = rect.left + rect.width / 2 - size / 2;
        const y = rect.top + rect.height / 2 - size / 2;

        ripple.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            z-index: 9999;
        `;

        document.body.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);

        // Add CSS animation if not already present
        if (!document.getElementById('ripple-animation')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    validateFieldOnBlur(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        const value = field.value.trim();

        // Basic validation based on field attributes
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field.id, 'この項目は必須です');
            return;
        }

        if (field.type === 'email' && value && !this.isValidEmail(value)) {
            this.showFieldError(field.id, '有効なメールアドレスを入力してください');
            return;
        }

        if (field.type === 'number' && value) {
            const num = parseFloat(value);
            if (isNaN(num)) {
                this.showFieldError(field.id, '有効な数値を入力してください');
                return;
            }

            const min = field.getAttribute('min');
            const max = field.getAttribute('max');

            if (min !== null && num < parseFloat(min)) {
                this.showFieldError(field.id, `${min}以上の値を入力してください`);
                return;
            }

            if (max !== null && num > parseFloat(max)) {
                this.showFieldError(field.id, `${max}以下の値を入力してください`);
                return;
            }
        }

        // If we get here, the field is valid
        this.clearFieldError(field.id);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    handleTabNavigation(e) {
        // Enhanced tab navigation for better accessibility
        const focusableElements = document.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        const focusableArray = Array.from(focusableElements);
        const currentIndex = focusableArray.indexOf(document.activeElement);

        if (currentIndex === -1) return;

        let nextIndex;
        if (e.shiftKey) {
            nextIndex = currentIndex === 0 ? focusableArray.length - 1 : currentIndex - 1;
        } else {
            nextIndex = currentIndex === focusableArray.length - 1 ? 0 : currentIndex + 1;
        }

        const nextElement = focusableArray[nextIndex];
        if (nextElement) {
            e.preventDefault();
            nextElement.focus();

            // Add visual feedback for keyboard navigation
            nextElement.style.outline = '2px solid var(--primary-color)';
            nextElement.style.outlineOffset = '2px';

            setTimeout(() => {
                nextElement.style.outline = '';
                nextElement.style.outlineOffset = '';
            }, 1000);
        }
    }

    // Helper method for HTML escaping
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper method to get subcategory usage count
    getSubcategoryUsageCount(subcategoryId) {
        try {
            const transactions = window.storage.getTransactions();
            return transactions.filter(t => t.subcategoryId === subcategoryId).length;
        } catch (error) {
            console.error('Error getting subcategory usage count:', error);
            return 0;
        }
    }

    // Enhanced error handling for UI operations
    handleUIError(error, context = '') {
        console.error(`UI Error in ${context}:`, error);
        this.showNotification(`UI操作でエラーが発生しました${context ? ` (${context})` : ''}: ${error.message}`, 'error');
    }

    // Method to safely update DOM elements
    safeUpdateElement(elementId, updateFunction) {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                updateFunction(element);
            } else {
                console.warn(`Element with ID '${elementId}' not found`);
            }
        } catch (error) {
            console.error(`Error updating element '${elementId}':`, error);
            this.showNotification(`要素の更新でエラーが発生しました: ${elementId}`, 'warning');
        }
    }

    // Notification system
    showNotification(message, type = 'info') {
        // Use the enhanced notification system
        if (window.budgetApp) {
            window.budgetApp.showNotification(message, type);
        } else {
            // Enhanced fallback notification
            this.createFallbackNotification(message, type);
        }
    }

    createFallbackNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.ui-notification');
        existingNotifications.forEach(n => n.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `ui-notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            maxWidth: '300px',
            wordWrap: 'break-word',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)'
        });

        // Set background color based on type
        const colors = {
            success: 'linear-gradient(135deg, #34C759, #30D158)',
            warning: 'linear-gradient(135deg, #FF9500, #FF9F0A)',
            error: 'linear-gradient(135deg, #FF3B30, #FF453A)',
            info: 'linear-gradient(135deg, #007AFF, #0A84FF)'
        };
        notification.style.background = colors[type] || colors.info;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Authentication check
    checkAuthForAction(action) {
        try {
            if (!window.authManager || !window.authManager.getIsLoggedIn()) {
                this.showAuthRequiredMessage();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking auth for action:', error);
            this.showNotification('認証確認でエラーが発生しました', 'error');
            return false;
        }
    }

    showAuthRequiredMessage() {
        if (window.budgetApp) {
            window.budgetApp.showNotification('この機能を使用するにはログインが必要です', 'warning');
        }

        // Show login modal
        if (window.authManager) {
            window.authManager.showAuthModal('login');
        }
    }

    // Modal Management
    openTransactionModal(transactionId = null) {
        // Check authentication first
        if (!this.checkAuthForAction('add_transaction')) {
            return;
        }

        this.editingTransaction = transactionId;
        const modal = document.getElementById('transaction-modal');
        const title = document.getElementById('transaction-modal-title');
        const form = document.getElementById('transaction-form');

        if (transactionId) {
            const transaction = window.storage.getTransactions().find(t => t.id === transactionId);
            if (transaction) {
                // Check if user can edit this transaction
                if (!window.dataManager.canEditTransaction(transaction)) {
                    this.showNotification('この取引は編集できません', 'warning');
                    return;
                }

                title.textContent = '取引を編集';
                document.getElementById('amount').value = Math.abs(transaction.amount);
                document.getElementById('category').value = transaction.categoryId;
                document.getElementById('fundSource').value = transaction.fundSourceId;
                document.getElementById('date').value = transaction.date.toISOString().split('T')[0];
                document.getElementById('note').value = transaction.note || '';

                // Update subcategory options and set value
                this.updateSubcategoryOptions(transaction.categoryId);
                if (transaction.subcategoryId) {
                    document.getElementById('subcategory').value = transaction.subcategoryId;
                }

                // Set transaction type
                const typeRadio = transaction.amount < 0 ? 'type-expense' : 'type-income';
                document.getElementById(typeRadio).checked = true;
            }
        } else {
            title.textContent = '取引を追加';
            form.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            document.getElementById('type-expense').checked = true;
            this.updateSubcategoryOptions(''); // Clear subcategory options
        }

        this.showModal('transaction-modal');
    }

    openFilterModal() {
        if (!this.checkAuthForAction('filter_transactions')) {
            return;
        }

        const filters = window.dataManager.getFilters();

        if (filters.startDate) {
            document.getElementById('filter-start-date').value = filters.startDate;
        }
        if (filters.endDate) {
            document.getElementById('filter-end-date').value = filters.endDate;
        }
        if (filters.category) {
            document.getElementById('filter-category').value = filters.category;
        }
        if (filters.fundSource) {
            const fundSourceSelect = document.getElementById('filter-fund-source');
            if (fundSourceSelect) {
                fundSourceSelect.value = filters.fundSource;
            }
        }

        this.showModal('filter-modal');
    }

    openFundSourceModal(fundSourceId = null) {
        // Check authentication first
        if (!this.checkAuthForAction('manage_fund_source')) {
            return;
        }

        this.editingFundSource = fundSourceId;
        const modal = document.getElementById('fundsource-modal');
        const title = document.getElementById('fundsource-modal-title');
        const form = document.getElementById('fundsource-form');

        if (!modal || !title || !form) {
            console.error('Fund source modal elements not found');
            this.showNotification('モーダルを開けませんでした', 'error');
            return;
        }

        if (fundSourceId) {
            const fundSource = window.storage.getFundSources().find(fs => fs.id === fundSourceId);
            if (fundSource) {
                title.textContent = '資金元を編集';
                document.getElementById('fs-name').value = fundSource.name;
                document.getElementById('fs-type').value = fundSource.type;
                document.getElementById('fs-balance').value = fundSource.currentBalance;
            }
        } else {
            title.textContent = '資金元を追加';
            form.reset();
        }

        this.showModal('fundsource-modal');
    }

    openSubcategoryModal() {
        // Check if a category is selected in the transaction form
        const categorySelect = document.getElementById('category');
        if (categorySelect && categorySelect.value) {
            this.selectedCategoryForSubcategory = categorySelect.value;
        }

        if (!this.selectedCategoryForSubcategory) {
            this.showNotification('カテゴリを先に選択してください', 'warning');
            return;
        }

        try {
            const category = window.storage.getCategories().find(c => c.id === this.selectedCategoryForSubcategory);
            if (!category) {
                this.showNotification('選択されたカテゴリが見つかりません', 'error');
                return;
            }

            // Update the modal title and enable the add button
            const categoryNameElement = document.getElementById('selected-category-name');
            const addButton = document.getElementById('add-subcategory');

            if (categoryNameElement) {
                categoryNameElement.textContent = `${category.icon} ${category.name}`;
            }

            if (addButton) {
                addButton.disabled = false;
            }

            this.renderSubcategoryManagement();
            this.showModal('subcategory-modal');

            console.log(`Opened subcategory modal for category: ${category.name} (ID: ${category.id})`);
        } catch (error) {
            console.error('Error opening subcategory modal:', error);
            this.showNotification('サブカテゴリ管理モーダルを開けませんでした', 'error');
        }
    }

    openSubcategoryFormModal(subcategoryId = null) {
        if (!this.selectedCategoryForSubcategory) {
            this.showNotification('カテゴリが選択されていません', 'error');
            return;
        }

        this.editingSubcategory = subcategoryId;
        const title = document.getElementById('subcategory-form-title');
        const form = document.getElementById('subcategory-form');
        const nameInput = document.getElementById('subcategory-name');

        if (!title || !form || !nameInput) {
            console.error('Subcategory form elements not found');
            this.showNotification('フォーム要素が見つかりません', 'error');
            return;
        }

        try {
            if (subcategoryId) {
                const subcategory = window.storage.getSubcategories().find(sc => sc.id === subcategoryId);
                if (subcategory) {
                    title.textContent = 'サブカテゴリを編集';
                    nameInput.value = subcategory.name;
                    console.log(`Editing subcategory: ${subcategory.name} (ID: ${subcategoryId})`);
                } else {
                    this.showNotification('編集対象のサブカテゴリが見つかりません', 'error');
                    return;
                }
            } else {
                title.textContent = 'サブカテゴリを追加';
                form.reset();
                console.log(`Adding new subcategory for category: ${this.selectedCategoryForSubcategory}`);
            }

            this.showModal('subcategory-form-modal');

            // Focus on the name input
            setTimeout(() => {
                nameInput.focus();
            }, 100);

        } catch (error) {
            console.error('Error opening subcategory form modal:', error);
            this.showNotification('サブカテゴリフォームを開けませんでした', 'error');
        }
    }

    handleTransactionSubmit(e) {
        const submitButton = e.target.querySelector('button[type="submit"]');

        // Add button feedback
        this.addButtonFeedback(submitButton, () => {
            // Clear previous errors
            this.clearFormErrors('transaction-form');

            // Enhanced form validation
            const validationRules = {
                'amount': {
                    required: true,
                    requiredMessage: '金額を入力してください',
                    custom: (value) => {
                        const num = parseFloat(value);
                        if (isNaN(num) || num <= 0) {
                            return '有効な金額を入力してください';
                        }
                        if (num > 10000000) {
                            return '金額が大きすぎます';
                        }
                        return true;
                    }
                },
                'category': {
                    required: true,
                    requiredMessage: 'カテゴリを選択してください'
                },
                'fundSource': {
                    required: true,
                    requiredMessage: '資金元を選択してください'
                },
                'date': {
                    required: true,
                    requiredMessage: '日付を入力してください'
                }
            };

            if (!this.validateForm('transaction-form', validationRules)) {
                throw new Error('入力内容を確認してください');
            }

            const formData = new FormData(e.target);
            const amount = parseFloat(formData.get('amount'));
            const isExpense = formData.get('type') === 'expense';

            const transactionData = {
                amount: isExpense ? -amount : amount,
                categoryId: formData.get('category'),
                subcategoryId: formData.get('subcategory') || null,
                fundSourceId: formData.get('fundSource'),
                date: formData.get('date'),
                note: formData.get('note') || ''
            };

            if (this.editingTransaction) {
                window.dataManager.updateTransaction(this.editingTransaction, transactionData);
                this.showNotification('取引を更新しました', 'success');
            } else {
                window.dataManager.addTransaction(transactionData);
                this.showNotification('取引を追加しました', 'success');
            }

            this.closeModal('transaction-modal');
            this.renderTransactions();
            this.renderFundSources();

            if (this.currentTransactionView === 'calendar') {
                window.calendarManager.renderCalendar();
            }
        });
    }

    handleFundSourceSubmit(e) {
        const submitButton = e.target.querySelector('button[type="submit"]');

        // Add button feedback
        this.addButtonFeedback(submitButton, () => {
            // Clear previous errors
            this.clearFormErrors('fundsource-form');

            // Enhanced form validation
            const validationRules = {
                'fs-name': {
                    required: true,
                    requiredMessage: '資金元名を入力してください',
                    maxLength: 50,
                    custom: (value) => {
                        // Check for duplicate names (excluding current editing item)
                        const existingFundSources = window.storage.getFundSources();
                        const duplicate = existingFundSources.find(fs =>
                            fs.name.toLowerCase() === value.toLowerCase() &&
                            fs.id !== this.editingFundSource
                        );
                        if (duplicate) {
                            return 'この名前の資金元は既に存在します';
                        }
                        return true;
                    }
                },
                'fs-balance': {
                    required: true,
                    requiredMessage: '初期残高を入力してください',
                    custom: (value) => {
                        const num = parseFloat(value);
                        if (isNaN(num)) {
                            return '有効な金額を入力してください';
                        }
                        if (num < -10000000 || num > 10000000) {
                            return '金額の範囲が無効です';
                        }
                        return true;
                    }
                }
            };

            if (!this.validateForm('fundsource-form', validationRules)) {
                throw new Error('入力内容を確認してください');
            }

            const formData = new FormData(e.target);
            const fundSourceData = {
                name: formData.get('fs-name').trim(),
                initialBalance: parseFloat(formData.get('fs-balance')),
                type: formData.get('fs-type') || 'bank'
            };

            // Additional validation through data manager
            const errors = window.dataManager.validateFundSource(fundSourceData);
            if (errors.length > 0) {
                throw new Error(errors.join('\n'));
            }

            if (this.editingFundSource) {
                // Update existing fund source
                const fundSources = window.storage.getFundSources();
                const index = fundSources.findIndex(fs => fs.id === this.editingFundSource);
                if (index !== -1) {
                    fundSources[index] = { ...fundSources[index], ...fundSourceData };
                    window.storage.setFundSources(fundSources);
                    this.showNotification('資金元を更新しました', 'success');
                }
            } else {
                window.storage.addFundSource(fundSourceData);
                this.showNotification('資金元を追加しました', 'success');
            }

            this.closeModal('fundsource-modal');
            this.renderFundSources();
            this.populateSelects();
        });
    }

    handleSubcategorySubmit(e) {
        const submitButton = e.target.querySelector('button[type="submit"]');

        // Add button feedback
        this.addButtonFeedback(submitButton, () => {
            // Clear previous errors
            this.clearFormErrors('subcategory-form');

            if (!this.selectedCategoryForSubcategory) {
                throw new Error('カテゴリが選択されていません');
            }

            // Enhanced form validation
            const validationRules = {
                'subcategory-name': {
                    required: true,
                    requiredMessage: 'サブカテゴリ名を入力してください',
                    maxLength: 50,
                    custom: (value) => {
                        // Check for duplicate names within the same category
                        const existingSubcategories = window.dataManager.getSubcategories(this.selectedCategoryForSubcategory);
                        const duplicate = existingSubcategories.find(sc =>
                            sc.name.toLowerCase() === value.toLowerCase() &&
                            sc.id !== this.editingSubcategory
                        );
                        if (duplicate) {
                            return 'このカテゴリ内に同じ名前のサブカテゴリが既に存在します';
                        }
                        return true;
                    }
                }
            };

            if (!this.validateForm('subcategory-form', validationRules)) {
                throw new Error('入力内容を確認してください');
            }

            const formData = new FormData(e.target);
            const name = formData.get('subcategory-name').trim();

            const subcategoryData = {
                name: name,
                categoryId: this.selectedCategoryForSubcategory
            };

            if (this.editingSubcategory) {
                window.dataManager.updateSubcategory(this.editingSubcategory, subcategoryData);
                this.showNotification('サブカテゴリを更新しました', 'success');
                console.log(`Updated subcategory: ${name} (ID: ${this.editingSubcategory})`);
            } else {
                const newSubcategory = window.dataManager.addSubcategory(subcategoryData);
                this.showNotification('サブカテゴリを追加しました', 'success');
                console.log(`Added new subcategory: ${name} (ID: ${newSubcategory.id})`);
            }

            this.closeModal('subcategory-form-modal');
            this.renderSubcategoryManagement();
            this.populateSelects();

            // Clear the form
            document.getElementById('subcategory-form').reset();
            this.editingSubcategory = null;
        });
    }

    editTransaction(id) {
        this.openTransactionModal(id);
    }

    confirmDeleteTransaction(id) {
        const transaction = window.storage.getTransactions().find(t => t.id === id);
        if (!transaction) return;

        // Check if user can delete this transaction
        if (!window.dataManager.canEditTransaction(transaction)) {
            this.showNotification('この取引は削除できません', 'warning');
            return;
        }

        const category = window.storage.getCategories().find(c => c.id === transaction.categoryId);
        const creatorDisplay = window.dataManager.getTransactionCreatorDisplay(transaction);
        const message = `取引を削除しますか？\n\n${category ? category.name : 'カテゴリなし'}\n${window.dataManager.formatCurrency(transaction.amount)}\n${window.dataManager.formatDate(transaction.date)}\n登録者: ${creatorDisplay}\n\nこの操作は取り消せません。`;

        if (confirm(message)) {
            try {
                window.dataManager.deleteTransaction(id);
                this.renderTransactions();
                this.renderFundSources();

                if (this.currentTransactionView === 'calendar') {
                    window.calendarManager.renderCalendar();
                }

                this.showNotification('取引を削除しました', 'success');
            } catch (error) {
                this.showNotification('削除に失敗しました: ' + error.message, 'error');
            }
        }
    }

    confirmDeleteFundSource(id) {
        const fundSource = window.storage.getFundSources().find(fs => fs.id === id);
        if (!fundSource) return;

        const canDelete = window.dataManager.canDeleteFundSource(id);
        if (!canDelete) {
            this.showNotification('この資金元は取引で使用されているため削除できません', 'error');
            return;
        }

        const message = `資金元を削除しますか？\n\n${fundSource.name}\n残高: ${window.dataManager.formatCurrency(fundSource.currentBalance)}\n\nこの操作は取り消せません。`;

        if (confirm(message)) {
            try {
                window.dataManager.deleteFundSource(id);
                this.renderFundSources();
                this.populateSelects();
                this.showNotification('資金元を削除しました', 'success');
            } catch (error) {
                this.showNotification('削除に失敗しました: ' + error.message, 'error');
            }
        }
    }

    applyFilters() {
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;
        const category = document.getElementById('filter-category').value;
        const fundSource = document.getElementById('filter-fund-source')?.value;
        const creator = document.getElementById('filter-creator')?.value;

        const filterData = {
            startDate: startDate || null,
            endDate: endDate || null,
            category: category || null,
            fundSource: fundSource || null,
            showOnlyMyTransactions: creator === 'me',
            showOnlySharedTransactions: creator === 'shared'
        };

        window.dataManager.setAdvancedFilters(filterData);

        this.closeModal('filter-modal');
        this.renderTransactions();
        this.updateFilterButton();
    }

    clearFilters() {
        window.dataManager.clearFilters();
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        document.getElementById('filter-category').value = '';

        const fundSourceSelect = document.getElementById('filter-fund-source');
        if (fundSourceSelect) {
            fundSourceSelect.value = '';
        }

        const creatorSelect = document.getElementById('filter-creator');
        if (creatorSelect) {
            creatorSelect.value = '';
        }

        this.renderTransactions();
        this.updateFilterButton();
    }

    updateFilterButton() {
        const filterBtn = document.getElementById('filter-btn');
        const hasFilters = window.dataManager.hasActiveFilters();

        if (hasFilters) {
            filterBtn.style.opacity = '1';
            filterBtn.classList.add('filter-indicator');
        } else {
            filterBtn.style.opacity = '0.6';
            filterBtn.classList.remove('filter-indicator');
        }
    }

    exportData() {
        const data = window.storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showNotification('データをエクスポートしました', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (window.storage.importData(data)) {
                            this.showNotification('データのインポートが完了しました', 'success');
                            this.loadInitialData();
                        } else {
                            this.showNotification('データのインポートに失敗しました', 'error');
                        }
                    } catch (error) {
                        this.showNotification('無効なファイル形式です', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    clearAllData() {
        if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
            window.storage.clearAllData();
            this.loadInitialData();
            this.showNotification('すべてのデータが削除されました', 'success');
        }
    }

    installApp() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    this.showNotification('アプリをインストールしました', 'success');
                }
                window.deferredPrompt = null;
            });
        } else {
            this.showNotification('このアプリは既にインストールされているか、インストールできません', 'warning');
        }
    }

    showSharingManagement() {
        if (!this.checkAuthForAction('manage_sharing')) {
            return;
        }

        const fundSources = window.storage.getFundSources();
        const sharedUsers = window.dataManager.getSharedUsers();

        let content = '<h3>資金元の共有設定</h3>';

        // Add user management section
        content += `
            <div class="sharing-user-management">
                <h4>共有ユーザー管理</h4>
                <div class="add-user-form">
                    <input type="email" id="new-user-email" placeholder="共有するユーザーのメールアドレス" style="width: 70%; margin-right: 10px;">
                    <button class="btn primary small" onclick="uiManager.addSharedUser()">追加</button>
                </div>
                <div class="shared-users-list" style="margin-top: 15px;">
        `;

        if (sharedUsers.length === 0) {
            content += '<p style="color: #666; font-style: italic;">共有ユーザーはいません</p>';
        } else {
            sharedUsers.forEach(user => {
                const statusText = user.status === 'pending' ? '招待中' :
                    user.status === 'accepted' ? 'アクティブ' : '無効';
                const statusClass = user.status === 'pending' ? 'pending' :
                    user.status === 'accepted' ? 'active' : 'inactive';

                content += `
                    <div class="shared-user-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 5px;">
                        <div class="user-info">
                            <div class="user-name">👤 ${this.escapeHtml(user.username)}</div>
                            <div class="user-email" style="font-size: 0.9em; color: #666;">${this.escapeHtml(user.email)}</div>
                        </div>
                        <div class="user-actions">
                            <span class="status-indicator ${statusClass}" style="margin-right: 10px;">${statusText}</span>
                            <button class="btn danger small" onclick="uiManager.removeSharedUser('${user.id}')">削除</button>
                        </div>
                    </div>
                `;
            });
        }

        content += '</div></div><hr style="margin: 20px 0;">';

        // Fund source sharing section
        if (fundSources.length === 0) {
            content += '<p>資金元がありません</p>';
        } else {
            content += '<div class="sharing-list">';
            fundSources.forEach(fs => {
                const sharingSettings = window.dataManager.getFundSourceSharingSettings(fs.id);
                const sharedCount = sharingSettings.sharedWith.length;

                content += `
                    <div class="sharing-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;">
                        <div class="sharing-info">
                            <div class="fund-source-name" style="font-weight: bold;">${this.getFundSourceIcon(fs.type)} ${this.escapeHtml(fs.name)}</div>
                            <div class="sharing-status" style="font-size: 0.9em; color: #666;">
                                ${sharingSettings.isShared ? `${sharedCount}人と共有中` : '共有されていません'}
                            </div>
                        </div>
                        <div class="sharing-actions">
                            ${sharingSettings.isShared ? `
                                <button class="btn secondary small" onclick="uiManager.showFundSourceSharingDetail('${fs.id}')" style="margin-right: 5px;">設定</button>
                            ` : ''}
                            <button class="btn ${sharingSettings.isShared ? 'danger' : 'primary'} small" onclick="uiManager.toggleFundSourceSharing('${fs.id}')">
                                ${sharingSettings.isShared ? '共有停止' : '共有開始'}
                            </button>
                        </div>
                    </div>
                `;
            });
            content += '</div>';
        }

        this.showInfoModal('共有管理', content);
    }

    showSharedUsers() {
        if (!this.checkAuthForAction('view_shared_users')) {
            return;
        }

        const sharedUsers = window.dataManager.getSharedUsers();

        let content = '<h3>共有ユーザー一覧</h3>';

        if (sharedUsers.length === 0) {
            content += `
                <div class="empty-state" style="text-align: center; padding: 40px;">
                    <div class="empty-icon" style="font-size: 3em; margin-bottom: 15px;">👥</div>
                    <h4>共有ユーザーはいません</h4>
                    <p style="color: #666;">共有管理から新しいユーザーを招待してください</p>
                    <button class="btn primary" onclick="uiManager.showSharingManagement()" style="margin-top: 15px;">共有管理を開く</button>
                </div>
            `;
        } else {
            content += '<div class="shared-users-list">';
            sharedUsers.forEach(user => {
                const statusText = user.status === 'pending' ? '招待中' :
                    user.status === 'accepted' ? 'アクティブ' : '無効';
                const statusClass = user.status === 'pending' ? 'pending' :
                    user.status === 'accepted' ? 'active' : 'inactive';

                // Get shared fund sources for this user
                const fundSources = window.storage.getFundSources();
                const sharedFundSources = fundSources.filter(fs =>
                    fs.sharedWith && fs.sharedWith.includes(user.id)
                );

                content += `
                    <div class="shared-user-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <div class="user-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div class="user-info">
                                <div class="user-name" style="font-weight: bold;">👤 ${this.escapeHtml(user.username)}</div>
                                <div class="user-email" style="color: #666; font-size: 0.9em;">${this.escapeHtml(user.email)}</div>
                            </div>
                            <div class="user-status">
                                <span class="status-indicator ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                        <div class="shared-resources">
                            <div style="font-size: 0.9em; color: #666;">
                                共有資金元: ${sharedFundSources.length > 0 ?
                        sharedFundSources.map(fs => `${this.getFundSourceIcon(fs.type)} ${fs.name}`).join(', ') :
                        'なし'
                    }
                            </div>
                            ${user.invitedAt ? `<div style="font-size: 0.8em; color: #999; margin-top: 5px;">招待日: ${new Date(user.invitedAt).toLocaleDateString('ja-JP')}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            content += '</div>';
        }

        this.showInfoModal('共有ユーザー', content);
    }

    // Additional sharing methods
    addSharedUser() {
        const emailInput = document.getElementById('new-user-email');
        if (!emailInput) return;

        const email = emailInput.value.trim();
        if (!email) {
            this.showNotification('メールアドレスを入力してください', 'warning');
            return;
        }

        try {
            window.dataManager.addSharedUser(email);
            emailInput.value = '';
            this.showNotification('ユーザーを招待しました', 'success');
            this.showSharingManagement(); // Refresh the modal
        } catch (error) {
            this.showNotification('ユーザーの追加に失敗しました: ' + error.message, 'error');
        }
    }

    // Form validation methods
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field?.closest('.form-group');

        if (!formGroup) return;

        // Remove existing error
        this.clearFieldError(fieldId);

        // Add error class
        formGroup.classList.add('error');
        formGroup.classList.remove('success');

        // Create error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        formGroup.appendChild(errorMessage);

        // Animate in
        setTimeout(() => {
            errorMessage.classList.add('show');
        }, 10);

        // Focus the field
        field.focus();
    }

    showFieldSuccess(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field?.closest('.form-group');

        if (!formGroup) return;

        // Remove existing error
        this.clearFieldError(fieldId);

        // Add success class
        formGroup.classList.add('success');
        formGroup.classList.remove('error');
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field?.closest('.form-group');

        if (!formGroup) return;

        formGroup.classList.remove('error', 'success');

        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const formGroups = form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('error', 'success');
            const errorMessage = group.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    }

    // Enhanced form validation
    validateForm(formId, validationRules) {
        const form = document.getElementById(formId);
        if (!form) return false;

        let isValid = true;

        for (const [fieldId, rules] of Object.entries(validationRules)) {
            const field = document.getElementById(fieldId);
            if (!field) continue;

            const value = field.value.trim();

            // Required validation
            if (rules.required && !value) {
                this.showFieldError(fieldId, rules.requiredMessage || 'この項目は必須です');
                isValid = false;
                continue;
            }

            // Skip other validations if field is empty and not required
            if (!value && !rules.required) {
                this.clearFieldError(fieldId);
                continue;
            }

            // Length validation
            if (rules.minLength && value.length < rules.minLength) {
                this.showFieldError(fieldId, `${rules.minLength}文字以上で入力してください`);
                isValid = false;
                continue;
            }

            if (rules.maxLength && value.length > rules.maxLength) {
                this.showFieldError(fieldId, `${rules.maxLength}文字以内で入力してください`);
                isValid = false;
                continue;
            }

            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
                this.showFieldError(fieldId, rules.patternMessage || '入力形式が正しくありません');
                isValid = false;
                continue;
            }

            // Custom validation
            if (rules.custom && typeof rules.custom === 'function') {
                const customResult = rules.custom(value);
                if (customResult !== true) {
                    this.showFieldError(fieldId, customResult || '入力値が無効です');
                    isValid = false;
                    continue;
                }
            }

            // If we get here, the field is valid
            this.showFieldSuccess(fieldId);
        }

        return isValid;
    }

    // Enhanced button feedback methods
    addButtonFeedback(button, action = null) {
        if (!button) return;

        const originalText = button.textContent;
        const originalDisabled = button.disabled;

        // Add loading state
        button.classList.add('loading');
        button.disabled = true;

        // Execute action if provided
        if (action && typeof action === 'function') {
            try {
                const result = action();

                // Handle promise
                if (result && typeof result.then === 'function') {
                    result
                        .then(() => {
                            this.removeButtonFeedback(button, originalText, originalDisabled);
                        })
                        .catch((error) => {
                            this.removeButtonFeedback(button, originalText, originalDisabled);
                            this.showNotification(`操作に失敗しました: ${error.message}`, 'error');
                        });
                } else {
                    // Synchronous action
                    setTimeout(() => {
                        this.removeButtonFeedback(button, originalText, originalDisabled);
                    }, 500);
                }
            } catch (error) {
                this.removeButtonFeedback(button, originalText, originalDisabled);
                this.showNotification(`操作に失敗しました: ${error.message}`, 'error');
            }
        } else {
            // Just show feedback for a short time
            setTimeout(() => {
                this.removeButtonFeedback(button, originalText, originalDisabled);
            }, 500);
        }
    }

    removeButtonFeedback(button, originalText, originalDisabled) {
        if (!button) return;

        button.classList.remove('loading');
        button.textContent = originalText;
        button.disabled = originalDisabled;
    }

    // Modal management methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID '${modalId}' not found`);
            return;
        }

        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.classList.add('modal-open');

        // Set up escape key handler
        this.currentModalEscapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modalId);
            }
        };
        document.addEventListener('keydown', this.currentModalEscapeHandler);

        // Focus management
        const firstFocusable = modal.querySelector('input, select, textarea, button');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('show');
        document.body.classList.remove('modal-open');

        // Remove escape key handler
        if (this.currentModalEscapeHandler) {
            document.removeEventListener('keydown', this.currentModalEscapeHandler);
            this.currentModalEscapeHandler = null;
        }

        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);

        // Clear editing states
        if (modalId === 'transaction-modal') {
            this.editingTransaction = null;
        } else if (modalId === 'fundsource-modal') {
            this.editingFundSource = null;
        } else if (modalId === 'subcategory-form-modal') {
            this.editingSubcategory = null;
        }
    }

    // Auth-dependent UI update method
    updateAuthDependentUI() {
        try {
            console.log('Updating auth-dependent UI...');
            
            // Update user info display
            try {
                this.updateUserInfoDisplay();
            } catch (userInfoError) {
                console.error('Error updating user info display:', userInfoError);
                this.showNotification('ユーザー情報の更新でエラーが発生しました', 'warning');
            }
            
            // Update navigation state
            try {
                this.updateNavigationState();
            } catch (navError) {
                console.error('Error updating navigation state:', navError);
                this.showNotification('ナビゲーション状態の更新でエラーが発生しました', 'warning');
            }
            
            // Load initial data
            try {
                this.loadInitialData();
            } catch (dataError) {
                console.error('Error loading initial data:', dataError);
                this.showNotification('データの読み込みでエラーが発生しました', 'warning');
            }
            
            console.log('Auth-dependent UI update completed');
        } catch (error) {
            console.error('Error in updateAuthDependentUI:', error);
            this.showNotification('UI更新でエラーが発生しました', 'error');
        }
    }

    updateUserInfoDisplay() {
        try {
            const userInfo = document.getElementById('user-info');
            const logoutBtn = document.getElementById('logout-btn');
            const showLoginBtn = document.getElementById('show-login');
            const sharingSection = document.getElementById('sharing-section');

            if (!userInfo) {
                console.warn('User info element not found');
                return;
            }

            const isLoggedIn = window.authManager && window.authManager.getIsLoggedIn();
            const user = isLoggedIn ? window.authManager.getCurrentUser() : null;

            if (isLoggedIn && user) {
                userInfo.innerHTML = `
                    <div class="user-avatar">👤</div>
                    <div class="user-details">
                        <div class="user-name">${this.escapeHtml(user.username)}</div>
                        <div class="user-email">${this.escapeHtml(user.email)}</div>
                        ${user.lastLoginDate ? `<div class="user-last-login">最終ログイン: ${new Date(user.lastLoginDate).toLocaleDateString('ja-JP')}</div>` : ''}
                    </div>
                `;

                if (logoutBtn) logoutBtn.style.display = 'block';
                if (showLoginBtn) showLoginBtn.style.display = 'none';
                if (sharingSection) sharingSection.style.display = 'block';
            } else {
                userInfo.innerHTML = `
                    <div class="user-avatar">👤</div>
                    <div class="user-details">
                        <div class="user-name">ゲストユーザー</div>
                        <div class="user-email">ログインしてデータを保存</div>
                    </div>
                `;

                if (logoutBtn) logoutBtn.style.display = 'none';
                if (showLoginBtn) showLoginBtn.style.display = 'block';
                if (sharingSection) sharingSection.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating user info display:', error);
            this.showNotification('ユーザー情報の表示更新でエラーが発生しました', 'warning');
        }
    }

    updateNavigationState() {
        try {
            // Enable/disable certain features based on auth state
            const addBtn = document.getElementById('add-btn');
            const filterBtn = document.getElementById('filter-btn');

            const isLoggedIn = window.authManager && window.authManager.getIsLoggedIn();

            if (addBtn) {
                addBtn.disabled = !isLoggedIn;
                addBtn.style.opacity = isLoggedIn ? '1' : '0.5';
                addBtn.title = isLoggedIn ? '取引を追加' : 'ログインが必要です';
            }

            if (filterBtn) {
                filterBtn.disabled = !isLoggedIn;
                filterBtn.style.opacity = isLoggedIn ? '1' : '0.5';
                filterBtn.title = isLoggedIn ? 'フィルター' : 'ログインが必要です';
            }

            // Update other navigation elements if needed
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                const view = item.dataset.view;
                if (view === 'fundsources' || view === 'charts') {
                    item.style.opacity = isLoggedIn ? '1' : '0.7';
                    if (!isLoggedIn) {
                        item.title = 'ログインが必要です';
                    } else {
                        item.removeAttribute('title');
                    }
                }
            });
        } catch (error) {
            console.error('Error updating navigation state:', error);
            this.showNotification('ナビゲーション状態の更新でエラーが発生しました', 'warning');
        }
    }
}

// Initialize UI Manager when DOM is loaded and dependencies are ready
document.addEventListener('DOMContentLoaded', () => {
    const initUI = () => {
        if (window.storage && window.dataManager) {
            window.uiManager = new UIManager();
            console.log('UI Manager initialized');
        } else {
            setTimeout(initUI, 100);
        }
    };
    initUI();
});

// Export UIManager for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}