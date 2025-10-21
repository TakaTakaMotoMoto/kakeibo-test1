// Core UI Manager - Main Controller
class UIManager {
    constructor() {
        this.currentView = 'transactions';
        this.currentTransactionView = 'list';
        this.editingTransaction = null;
        this.editingFundSource = null;
        this.editingSubcategory = null;
        this.selectedCategoryForSubcategory = null;

        // Initialize components
        this.modalManager = new ModalManager();
        this.formValidator = new FormValidator();
        this.renderer = new UIRenderer();

        this.initialize();
    }

    initialize() {
        try {
            this.initializeEventListeners();
            this.formValidator.initializeFormValidation();
            this.loadInitialData();
            console.log('UI Manager initialized successfully');
        } catch (error) {
            console.error('Error initializing UI Manager:', error);
            UIUtils.showNotification('UIの初期化でエラーが発生しました', 'error');
        }
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
        const addBtn = document.getElementById('add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openTransactionModal());
        }

        const filterBtn = document.getElementById('filter-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.openFilterModal());
        }

        // Auth-related buttons
        const showLoginBtn = document.getElementById('show-login');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.showAuthModal('login');
                }
            });
        }

        // Modal close buttons
        document.querySelectorAll('.close-btn, [data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-btn') || e.target.hasAttribute('data-modal')) {
                    const modalId = e.target.dataset.modal || e.target.closest('.modal').id;
                    this.modalManager.closeModal(modalId);
                }
            });
        });

        // Forms
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransactionSubmit(e);
            });
        }

        const fundSourceForm = document.getElementById('fundsource-form');
        if (fundSourceForm) {
            fundSourceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFundSourceSubmit(e);
            });
        }

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.modalManager.closeModal(modal.id);
                }
            });
        });
    }

    loadInitialData() {
        try {
            this.renderer.renderTransactions();
            this.renderer.renderFundSources();
            this.renderer.populateSelects();
            this.renderer.updatePageTitle();
        } catch (error) {
            console.error('Error loading initial data:', error);
            UIUtils.showNotification('データの読み込みでエラーが発生しました', 'error');
        }
    }

    // View Management
    switchView(viewName) {
        try {
            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.view === viewName);
            });

            // Update views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.toggle('active', view.id === `${viewName}-view`);
            });

            this.currentView = viewName;
            this.renderer.currentView = viewName;
            this.renderer.updatePageTitle();

            // Load view-specific data
            if (viewName === 'charts' && window.chartManager) {
                window.chartManager.renderCategoryChart();
            }
        } catch (error) {
            console.error('Error switching view:', error);
            UIUtils.showNotification('ビューの切り替えでエラーが発生しました', 'error');
        }
    }

    switchTransactionView(mode) {
        try {
            document.querySelectorAll('.view-mode-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === mode);
            });

            const listView = document.getElementById('list-view');
            const calendarView = document.getElementById('calendar-view');

            if (mode === 'list') {
                if (listView) listView.style.display = 'block';
                if (calendarView) calendarView.style.display = 'none';
            } else {
                if (listView) listView.style.display = 'none';
                if (calendarView) calendarView.style.display = 'block';
                if (window.calendarManager) {
                    window.calendarManager.renderCalendar();
                }
            }

            this.currentTransactionView = mode;
            this.renderer.currentTransactionView = mode;
        } catch (error) {
            console.error('Error switching transaction view:', error);
            UIUtils.showNotification('表示モードの切り替えでエラーが発生しました', 'error');
        }
    }

    // Delegation methods to maintain compatibility
    showNotification(message, type = 'info') {
        UIUtils.showNotification(message, type);
    }

    showModal(modalId) {
        this.modalManager.showModal(modalId);
    }

    closeModal(modalId) {
        this.modalManager.closeModal(modalId);
    }

    showInfoModal(title, content) {
        this.modalManager.showInfoModal(title, content);
    }

    renderTransactions() {
        this.renderer.renderTransactions();
    }

    renderFundSources() {
        this.renderer.renderFundSources();
    }

    populateSelects() {
        this.renderer.populateSelects();
    }

    // Form handling methods
    handleTransactionSubmit(e) {
        try {
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

            if (!this.formValidator.validateForm('transaction-form', validationRules)) {
                return;
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
                UIUtils.showNotification('取引を更新しました', 'success');
            } else {
                window.dataManager.addTransaction(transactionData);
                UIUtils.showNotification('取引を追加しました', 'success');
            }

            this.modalManager.closeModal('transaction-modal');
            this.renderTransactions();
            this.renderFundSources();

            if (this.currentTransactionView === 'calendar' && window.calendarManager) {
                window.calendarManager.renderCalendar();
            }
        } catch (error) {
            console.error('Error handling transaction submit:', error);
            UIUtils.showNotification('取引の保存に失敗しました: ' + error.message, 'error');
        }
    }

    handleFundSourceSubmit(e) {
        try {
            const validationRules = {
                'fs-name': {
                    required: true,
                    requiredMessage: '資金元名を入力してください',
                    maxLength: 50,
                    custom: (value) => {
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

            if (!this.formValidator.validateForm('fundsource-form', validationRules)) {
                return;
            }

            const formData = new FormData(e.target);
            const fundSourceData = {
                name: formData.get('fs-name').trim(),
                initialBalance: parseFloat(formData.get('fs-balance')),
                type: formData.get('fs-type') || 'bank'
            };

            if (this.editingFundSource) {
                const fundSources = window.storage.getFundSources();
                const index = fundSources.findIndex(fs => fs.id === this.editingFundSource);
                if (index !== -1) {
                    fundSources[index] = { ...fundSources[index], ...fundSourceData, updatedAt: new Date() };
                    window.storage.setFundSources(fundSources);
                    UIUtils.showNotification('資金元を更新しました', 'success');
                }
            } else {
                window.storage.addFundSource(fundSourceData);
                UIUtils.showNotification('資金元を追加しました', 'success');
            }

            this.modalManager.closeModal('fundsource-modal');
            this.renderFundSources();
            this.populateSelects();
        } catch (error) {
            console.error('Error handling fund source submit:', error);
            UIUtils.showNotification('資金元の保存に失敗しました: ' + error.message, 'error');
        }
    }

    // Modal opening methods
    openTransactionModal(transactionId = null) {
        try {
            // Check authentication first
            if (!this.checkAuthForAction('add_transaction')) {
                return;
            }

            this.editingTransaction = transactionId;
            const modal = document.getElementById('transaction-modal');
            const title = document.getElementById('transaction-modal-title');
            const form = document.getElementById('transaction-form');

            if (!modal || !title || !form) {
                UIUtils.showNotification('モーダル要素が見つかりません', 'error');
                return;
            }

            if (transactionId) {
                const transaction = window.storage.getTransactions().find(t => t.id === transactionId);
                if (transaction) {
                    if (!window.dataManager.canEditTransaction(transaction)) {
                        UIUtils.showNotification('この取引は編集できません', 'warning');
                        return;
                    }
                    
                    title.textContent = '取引を編集';
                    
                    // Populate form with transaction data
                    document.getElementById('amount').value = Math.abs(transaction.amount);
                    document.querySelector(`input[name="type"][value="${transaction.amount < 0 ? 'expense' : 'income'}"]`).checked = true;
                    document.getElementById('category').value = transaction.categoryId;
                    document.getElementById('subcategory').value = transaction.subcategoryId || '';
                    document.getElementById('fundSource').value = transaction.fundSourceId;
                    document.getElementById('date').value = transaction.date.toISOString().split('T')[0];
                    document.getElementById('note').value = transaction.note || '';
                    
                    // Update subcategory options
                    this.updateSubcategoryOptions(transaction.categoryId);
                }
            } else {
                title.textContent = '取引を追加';
                form.reset();
                
                // Set default date to today
                document.getElementById('date').value = new Date().toISOString().split('T')[0];
                
                // Clear subcategory options
                this.updateSubcategoryOptions('');
            }

            this.modalManager.showModal('transaction-modal');
        } catch (error) {
            console.error('Error opening transaction modal:', error);
            UIUtils.showNotification('取引モーダルを開けませんでした', 'error');
        }
    }

    openFundSourceModal(fundSourceId = null) {
        try {
            // Check authentication first
            if (!this.checkAuthForAction('manage_fund_source')) {
                return;
            }

            this.editingFundSource = fundSourceId;
            const modal = document.getElementById('fundsource-modal');
            const title = document.getElementById('fundsource-modal-title');
            const form = document.getElementById('fundsource-form');

            if (!modal || !title || !form) {
                UIUtils.showNotification('モーダル要素が見つかりません', 'error');
                return;
            }

            if (fundSourceId) {
                const fundSource = window.storage.getFundSources().find(fs => fs.id === fundSourceId);
                if (fundSource) {
                    title.textContent = '資金元を編集';
                    document.getElementById('fs-name').value = fundSource.name;
                    document.getElementById('fs-balance').value = fundSource.initialBalance;
                }
            } else {
                title.textContent = '資金元を追加';
                form.reset();
            }

            this.modalManager.showModal('fundsource-modal');
        } catch (error) {
            console.error('Error opening fund source modal:', error);
            UIUtils.showNotification('資金元モーダルを開けませんでした', 'error');
        }
    }

    openFilterModal() {
        try {
            if (!this.checkAuthForAction('filter_transactions')) {
                return;
            }

            // Populate current filter values
            const filters = window.dataManager.filters;
            
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

            this.modalManager.showModal('filter-modal');
        } catch (error) {
            console.error('Error opening filter modal:', error);
            UIUtils.showNotification('フィルターモーダルを開けませんでした', 'error');
        }
    }

    // Helper methods
    updateSubcategoryOptions(categoryId) {
        const subcategorySelect = document.getElementById('subcategory');
        if (!subcategorySelect) return;

        if (!categoryId) {
            subcategorySelect.innerHTML = '<option value="">カテゴリを先に選択してください</option>';
            subcategorySelect.disabled = true;
            return;
        }

        try {
            const subcategories = window.dataManager.getSubcategories(categoryId);
            subcategorySelect.innerHTML = '<option value="">選択してください（任意）</option>' +
                subcategories.map(sc => `<option value="${sc.id}">${UIUtils.escapeHtml(sc.name)}</option>`).join('');
            subcategorySelect.disabled = false;
        } catch (error) {
            console.error('Error updating subcategory options:', error);
            subcategorySelect.innerHTML = '<option value="">エラーが発生しました</option>';
            subcategorySelect.disabled = true;
        }
    }

    checkAuthForAction(action) {
        try {
            if (!window.authManager || !window.authManager.getIsLoggedIn()) {
                UIUtils.showNotification('この機能を使用するにはログインが必要です', 'warning');
                if (window.authManager) {
                    window.authManager.showAuthModal('login');
                }
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking auth for action:', error);
            UIUtils.showNotification('認証確認でエラーが発生しました', 'error');
            return false;
        }
    }

    // Transaction actions
    editTransaction(id) {
        this.openTransactionModal(id);
    }

    confirmDeleteTransaction(id) {
        if (confirm('この取引を削除しますか？')) {
            try {
                window.dataManager.deleteTransaction(id);
                this.renderTransactions();
                this.renderFundSources();
                UIUtils.showNotification('取引を削除しました', 'success');
            } catch (error) {
                console.error('Error deleting transaction:', error);
                UIUtils.showNotification('削除に失敗しました', 'error');
            }
        }
    }

    confirmDeleteFundSource(id) {
        if (confirm('この資金元を削除しますか？')) {
            try {
                window.dataManager.deleteFundSource(id);
                this.renderFundSources();
                this.populateSelects();
                UIUtils.showNotification('資金元を削除しました', 'success');
            } catch (error) {
                console.error('Error deleting fund source:', error);
                UIUtils.showNotification('削除に失敗しました', 'error');
            }
        }
    }
}

// Initialize UI Manager when dependencies are ready
document.addEventListener('DOMContentLoaded', () => {
    const initUI = () => {
        if (window.storage && window.dataManager && window.UIUtils && window.ModalManager && window.FormValidator && window.UIRenderer) {
            window.uiManager = new UIManager();
            console.log('UI Manager initialized');
        } else {
            console.log('Waiting for dependencies...');
            setTimeout(initUI, 100);
        }
    };
    initUI();
});

// Export for use in other modules
window.UIManager = UIManager;