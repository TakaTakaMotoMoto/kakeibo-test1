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

        // Filter actions
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Subcategory management
        const manageSubcategoriesBtn = document.getElementById('manage-subcategories');
        if (manageSubcategoriesBtn) {
            manageSubcategoriesBtn.addEventListener('click', () => this.openSubcategoryModal());
        }

        const addSubcategoryBtn = document.getElementById('add-subcategory');
        if (addSubcategoryBtn) {
            addSubcategoryBtn.addEventListener('click', () => this.openSubcategoryFormModal());
        }

        const subcategoryForm = document.getElementById('subcategory-form');
        if (subcategoryForm) {
            subcategoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubcategorySubmit(e);
            });
        }

        // Category selection for subcategory management
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.updateSubcategoryOptions(e.target.value);
            });
        }

        // Settings actions
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }

        const importDataBtn = document.getElementById('import-data');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => this.importData());
        }

        const clearDataBtn = document.getElementById('clear-data');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }

        const installAppBtn = document.getElementById('install-app');
        if (installAppBtn) {
            installAppBtn.addEventListener('click', () => this.installApp());
        }

        // Sharing management
        const manageSharingBtn = document.getElementById('manage-sharing');
        if (manageSharingBtn) {
            manageSharingBtn.addEventListener('click', () => this.showSharingManagement());
        }

        const sharedUsersBtn = document.getElementById('shared-users');
        if (sharedUsersBtn) {
            sharedUsersBtn.addEventListener('click', () => this.showSharedUsers());
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

    // Placeholder methods for transaction actions
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

    // Additional functionality methods
    applyFilters() {
        try {
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
            this.modalManager.closeModal('filter-modal');
            this.renderTransactions();
            this.updateFilterButton();
        } catch (error) {
            console.error('Error applying filters:', error);
            UIUtils.showNotification('フィルターの適用に失敗しました', 'error');
        }
    }

    clearFilters() {
        try {
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
        } catch (error) {
            console.error('Error clearing filters:', error);
            UIUtils.showNotification('フィルターのクリアに失敗しました', 'error');
        }
    }

    updateFilterButton() {
        const filterBtn = document.getElementById('filter-btn');
        if (!filterBtn) return;

        const hasFilters = window.dataManager.hasActiveFilters();
        if (hasFilters) {
            filterBtn.style.opacity = '1';
            filterBtn.classList.add('filter-indicator');
        } else {
            filterBtn.style.opacity = '0.6';
            filterBtn.classList.remove('filter-indicator');
        }
    }

    // Subcategory management methods
    openSubcategoryModal() {
        try {
            const categorySelect = document.getElementById('category');
            const selectedCategoryId = categorySelect ? categorySelect.value : null;
            
            if (selectedCategoryId) {
                this.selectedCategoryForSubcategory = selectedCategoryId;
                const category = window.storage.getCategories().find(c => c.id === selectedCategoryId);
                document.getElementById('selected-category-name').textContent = 
                    category ? `${category.icon} ${category.name}` : 'カテゴリ';
                document.getElementById('add-subcategory').disabled = false;
            } else {
                this.selectedCategoryForSubcategory = null;
                document.getElementById('selected-category-name').textContent = 'カテゴリを選択してください';
                document.getElementById('add-subcategory').disabled = true;
            }

            this.renderSubcategoryManagement();
            this.modalManager.showModal('subcategory-modal');
        } catch (error) {
            console.error('Error opening subcategory modal:', error);
            UIUtils.showNotification('サブカテゴリモーダルを開けませんでした', 'error');
        }
    }

    openSubcategoryFormModal(subcategoryId = null) {
        try {
            this.editingSubcategory = subcategoryId;
            const title = document.getElementById('subcategory-form-title');
            const form = document.getElementById('subcategory-form');

            if (subcategoryId) {
                const subcategory = window.storage.getSubcategories().find(sc => sc.id === subcategoryId);
                if (subcategory) {
                    title.textContent = 'サブカテゴリを編集';
                    document.getElementById('subcategory-name').value = subcategory.name;
                }
            } else {
                title.textContent = 'サブカテゴリを追加';
                form.reset();
            }

            this.modalManager.showModal('subcategory-form-modal');
        } catch (error) {
            console.error('Error opening subcategory form modal:', error);
            UIUtils.showNotification('サブカテゴリフォームを開けませんでした', 'error');
        }
    }

    handleSubcategorySubmit(e) {
        try {
            if (!this.selectedCategoryForSubcategory) {
                UIUtils.showNotification('カテゴリが選択されていません', 'error');
                return;
            }

            const validationRules = {
                'subcategory-name': {
                    required: true,
                    requiredMessage: 'サブカテゴリ名を入力してください',
                    maxLength: 50,
                    custom: (value) => {
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

            if (!this.formValidator.validateForm('subcategory-form', validationRules)) {
                return;
            }

            const formData = new FormData(e.target);
            const name = formData.get('subcategory-name').trim();

            const subcategoryData = {
                name: name,
                categoryId: this.selectedCategoryForSubcategory
            };

            if (this.editingSubcategory) {
                window.dataManager.updateSubcategory(this.editingSubcategory, subcategoryData);
                UIUtils.showNotification('サブカテゴリを更新しました', 'success');
            } else {
                window.dataManager.addSubcategory(subcategoryData);
                UIUtils.showNotification('サブカテゴリを追加しました', 'success');
            }

            this.modalManager.closeModal('subcategory-form-modal');
            this.renderSubcategoryManagement();
            this.populateSelects();

            // Clear the form
            document.getElementById('subcategory-form').reset();
            this.editingSubcategory = null;
        } catch (error) {
            console.error('Error handling subcategory submit:', error);
            UIUtils.showNotification('サブカテゴリの保存に失敗しました: ' + error.message, 'error');
        }
    }

    renderSubcategoryManagement() {
        const container = document.getElementById('subcategory-list');
        if (!container || !this.selectedCategoryForSubcategory) {
            if (container) {
                container.innerHTML = '<p>カテゴリを選択してください</p>';
            }
            return;
        }

        try {
            const subcategories = window.dataManager.getSubcategories(this.selectedCategoryForSubcategory);
            
            if (subcategories.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>このカテゴリにはサブカテゴリがありません</p>
                        <p>「+ サブカテゴリ追加」ボタンから追加してください</p>
                    </div>
                `;
                return;
            }

            const html = subcategories.map(subcategory => {
                const usageCount = this.getSubcategoryUsageCount(subcategory.id);
                const canDelete = window.dataManager.canDeleteSubcategory(subcategory.id);

                return `
                    <div class="subcategory-item" data-id="${subcategory.id}">
                        <div class="subcategory-info">
                            <div class="subcategory-name">${UIUtils.escapeHtml(subcategory.name)}</div>
                            <div class="subcategory-usage">${usageCount}件の取引で使用中</div>
                        </div>
                        <div class="subcategory-actions">
                            <button class="btn secondary small" onclick="uiManager.editSubcategory('${subcategory.id}')">編集</button>
                            <button class="btn danger small ${canDelete ? '' : 'disabled'}" 
                                    onclick="uiManager.confirmDeleteSubcategory('${subcategory.id}')"
                                    ${canDelete ? '' : 'disabled'}
                                    title="${canDelete ? '削除' : '使用中のため削除できません'}">
                                削除
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
        } catch (error) {
            console.error('Error rendering subcategory management:', error);
            container.innerHTML = '<p>サブカテゴリの読み込みでエラーが発生しました</p>';
        }
    }

    editSubcategory(id) {
        this.openSubcategoryFormModal(id);
    }

    confirmDeleteSubcategory(id) {
        const subcategory = window.storage.getSubcategories().find(sc => sc.id === id);
        if (!subcategory) return;

        const usageCount = this.getSubcategoryUsageCount(id);
        if (usageCount > 0) {
            UIUtils.showNotification('このサブカテゴリは取引で使用されているため削除できません', 'warning');
            return;
        }

        if (confirm(`サブカテゴリ「${subcategory.name}」を削除しますか？\n\nこの操作は取り消せません。`)) {
            try {
                window.dataManager.deleteSubcategory(id);
                this.renderSubcategoryManagement();
                this.populateSelects();
                UIUtils.showNotification('サブカテゴリを削除しました', 'success');
            } catch (error) {
                console.error('Error deleting subcategory:', error);
                UIUtils.showNotification('削除に失敗しました: ' + error.message, 'error');
            }
        }
    }

    getSubcategoryUsageCount(subcategoryId) {
        try {
            const transactions = window.storage.getTransactions();
            return transactions.filter(t => t.subcategoryId === subcategoryId).length;
        } catch (error) {
            console.error('Error getting subcategory usage count:', error);
            return 0;
        }
    }

    // Settings methods
    exportData() {
        try {
            const data = window.storage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            URL.revokeObjectURL(url);
            UIUtils.showNotification('データをエクスポートしました', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            UIUtils.showNotification('エクスポートに失敗しました', 'error');
        }
    }

    importData() {
        try {
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
                                UIUtils.showNotification('データのインポートが完了しました', 'success');
                                this.loadInitialData();
                            } else {
                                UIUtils.showNotification('データのインポートに失敗しました', 'error');
                            }
                        } catch (error) {
                            UIUtils.showNotification('無効なファイル形式です', 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            };

            input.click();
        } catch (error) {
            console.error('Error importing data:', error);
            UIUtils.showNotification('インポートに失敗しました', 'error');
        }
    }

    clearAllData() {
        if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
            try {
                window.storage.clearAllData();
                this.loadInitialData();
                UIUtils.showNotification('すべてのデータが削除されました', 'success');
            } catch (error) {
                console.error('Error clearing data:', error);
                UIUtils.showNotification('データの削除に失敗しました', 'error');
            }
        }
    }

    installApp() {
        try {
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                window.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        UIUtils.showNotification('アプリをインストールしました', 'success');
                    }
                    window.deferredPrompt = null;
                });
            } else {
                UIUtils.showNotification('このアプリは既にインストールされているか、インストールできません', 'warning');
            }
        } catch (error) {
            console.error('Error installing app:', error);
            UIUtils.showNotification('インストールに失敗しました', 'error');
        }
    }

    // Sharing management methods
    showSharingManagement() {
        if (!this.checkAuthForAction('manage_sharing')) {
            return;
        }

        try {
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

                    content += `
                        <div class="shared-user-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 5px;">
                            <div class="user-info">
                                <div class="user-name">👤 ${UIUtils.escapeHtml(user.username)}</div>
                                <div class="user-email" style="font-size: 0.9em; color: #666;">${UIUtils.escapeHtml(user.email)}</div>
                            </div>
                            <div class="user-actions">
                                <span class="status-indicator" style="margin-right: 10px;">${statusText}</span>
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
                                <div class="fund-source-name" style="font-weight: bold;">${UIUtils.getFundSourceIcon(fs.type)} ${UIUtils.escapeHtml(fs.name)}</div>
                                <div class="sharing-status" style="font-size: 0.9em; color: #666;">
                                    ${sharingSettings.isShared ? `${sharedCount}人と共有中` : '共有されていません'}
                                </div>
                            </div>
                            <div class="sharing-actions">
                                <button class="btn ${sharingSettings.isShared ? 'danger' : 'primary'} small" onclick="uiManager.toggleFundSourceSharing('${fs.id}')">
                                    ${sharingSettings.isShared ? '共有停止' : '共有開始'}
                                </button>
                            </div>
                        </div>
                    `;
                });
                content += '</div>';
            }

            this.modalManager.showInfoModal('共有管理', content);
        } catch (error) {
            console.error('Error showing sharing management:', error);
            UIUtils.showNotification('共有管理の表示に失敗しました', 'error');
        }
    }

    showSharedUsers() {
        if (!this.checkAuthForAction('view_shared_users')) {
            return;
        }

        try {
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

                    content += `
                        <div class="shared-user-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                            <div class="user-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div class="user-info">
                                    <div class="user-name" style="font-weight: bold;">👤 ${UIUtils.escapeHtml(user.username)}</div>
                                    <div class="user-email" style="color: #666; font-size: 0.9em;">${UIUtils.escapeHtml(user.email)}</div>
                                </div>
                                <div class="user-status">
                                    <span class="status-indicator">${statusText}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });
                content += '</div>';
            }

            this.modalManager.showInfoModal('共有ユーザー', content);
        } catch (error) {
            console.error('Error showing shared users:', error);
            UIUtils.showNotification('共有ユーザーの表示に失敗しました', 'error');
        }
    }

    addSharedUser() {
        const emailInput = document.getElementById('new-user-email');
        if (!emailInput) return;

        const email = emailInput.value.trim();
        if (!email) {
            UIUtils.showNotification('メールアドレスを入力してください', 'warning');
            return;
        }

        try {
            window.dataManager.addSharedUser(email);
            emailInput.value = '';
            UIUtils.showNotification('ユーザーを招待しました', 'success');
            this.showSharingManagement(); // Refresh the modal
        } catch (error) {
            console.error('Error adding shared user:', error);
            UIUtils.showNotification('ユーザーの追加に失敗しました: ' + error.message, 'error');
        }
    }

    removeSharedUser(userId) {
        try {
            if (confirm('このユーザーとの共有を停止しますか？')) {
                window.dataManager.removeSharedUser(userId);
                UIUtils.showNotification('共有ユーザーを削除しました', 'success');
                this.showSharingManagement(); // Refresh the view
            }
        } catch (error) {
            console.error('Error removing shared user:', error);
            UIUtils.showNotification('ユーザーの削除に失敗しました: ' + error.message, 'error');
        }
    }

    toggleFundSourceSharing(fundSourceId) {
        try {
            const fundSources = window.storage.getFundSources();
            const fundSource = fundSources.find(fs => fs.id === fundSourceId);
            
            if (!fundSource) {
                UIUtils.showNotification('資金元が見つかりません', 'error');
                return;
            }

            const newSharingState = !fundSource.isShared;
            
            // Update fund source sharing
            window.dataManager.updateFundSourceSharing(fundSourceId, {
                isShared: newSharingState,
                sharedWith: newSharingState ? fundSource.sharedWith || [] : []
            });

            UIUtils.showNotification(
                newSharingState ? '共有を開始しました' : '共有を停止しました', 
                'success'
            );
            
            // Refresh the sharing management view
            this.showSharingManagement();
            
        } catch (error) {
            console.error('Error toggling fund source sharing:', error);
            UIUtils.showNotification('共有設定の変更に失敗しました: ' + error.message, 'error');
        }
    }

    // Auth-dependent UI updates
    updateAuthDependentUI() {
        try {
            // Update user info display
            this.updateUserInfoDisplay();
            
            // Update navigation state
            this.updateNavigationState();
            
            // Load initial data
            this.loadInitialData();
            
            console.log('Auth-dependent UI update completed');
        } catch (error) {
            console.error('Error in updateAuthDependentUI:', error);
            UIUtils.showNotification('UI更新でエラーが発生しました', 'error');
        }
    }

    updateUserInfoDisplay() {
        try {
            const userInfo = document.getElementById('user-info');
            const logoutBtn = document.getElementById('logout-btn');
            const showLoginBtn = document.getElementById('show-login');
            const sharingSection = document.getElementById('sharing-section');

            if (!userInfo) return;

            const isLoggedIn = window.authManager && window.authManager.getIsLoggedIn();
            const user = isLoggedIn ? window.authManager.getCurrentUser() : null;

            if (isLoggedIn && user) {
                userInfo.innerHTML = `
                    <div class="user-avatar">👤</div>
                    <div class="user-details">
                        <div class="user-name">${UIUtils.escapeHtml(user.username)}</div>
                        <div class="user-email">${UIUtils.escapeHtml(user.email)}</div>
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
        }
    }

    updateNavigationState() {
        try {
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
}