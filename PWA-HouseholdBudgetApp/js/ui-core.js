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
        console.log('Initializing ModalManager...');
        this.modalManager = new ModalManager();
        console.log('ModalManager initialized:', this.modalManager);
        console.log('showModal method:', typeof this.modalManager.showModal);
        this.formValidator = new FormValidator();
        this.renderer = new UIRenderer();

        this.initialize();
    }

    initialize() {
        try {
            this.initializeEventListeners();
            this.initializeAuthStateListener();
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
        console.log('Addbtn:', addBtn);
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openTransactionModal());
        }

        const filterBtn = document.getElementById('filter-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.openFilterModal());
        }

        // Filter modal buttons
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
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

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.logout();
                }
            });
        }

        // Sharing-related buttons
        const manageSharingBtn = document.getElementById('manage-sharing');
        if (manageSharingBtn) {
            manageSharingBtn.addEventListener('click', () => this.openSharingManagementModal());
        }

        const sharedUsersBtn = document.getElementById('shared-users');
        if (sharedUsersBtn) {
            sharedUsersBtn.addEventListener('click', () => this.openSharedUsersModal());
        }

        // Data management buttons
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
            clearDataBtn.addEventListener('click', () => this.confirmClearData());
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

        // Category change handler for subcategory updates
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.updateSubcategoryOptions(e.target.value);
            });
        }

        // Subcategory management button
        const manageSubcategoriesBtn = document.getElementById('manage-subcategories');
        if (manageSubcategoriesBtn) {
            manageSubcategoriesBtn.addEventListener('click', () => {
                const selectedCategory = document.getElementById('category').value;
                if (selectedCategory) {
                    this.openSubcategoryModal(selectedCategory);
                } else {
                    UIUtils.showNotification('先にカテゴリを選択してください', 'warning');
                }
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

    initializeAuthStateListener() {
        // Listen for authentication state changes
        window.addEventListener('authStateChange', (event) => {
            try {
                console.log('UI Manager received auth state change:', event.detail);
                
                // Update auth-dependent UI elements
                setTimeout(() => {
                    this.updateAuthDependentUI();
                    
                    // Refresh data display
                    this.loadInitialData();
                    
                    // Show appropriate notification
                    if (event.detail.type === 'login') {
                        UIUtils.showNotification(`${event.detail.user.username}さん、おかえりなさい！`, 'success');
                    } else if (event.detail.type === 'logout') {
                        UIUtils.showNotification('ログアウトしました', 'info');
                    }
                }, 100);
                
            } catch (error) {
                console.error('Error handling auth state change in UI Manager:', error);
                UIUtils.showNotification('認証状態の更新でエラーが発生しました', 'warning');
            }
        });
    }

    loadInitialData() {
        try {
            // Load saved filter state
            const filtersLoaded = window.dataManager.loadFilterState();
            if (filtersLoaded) {
                this.updateFilterButtonState();
            }
            
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

            let result;
            if (this.editingTransaction) {
                result = window.dataManager.updateTransaction(this.editingTransaction, transactionData);
                if (result) {
                    UIUtils.showNotification('取引を更新しました', 'success');
                } else {
                    UIUtils.showNotification('取引の更新に失敗しました', 'error');
                    return;
                }
            } else {
                result = window.dataManager.addTransaction(transactionData);
                if (result) {
                    UIUtils.showNotification('取引を追加しました', 'success');
                } else {
                    UIUtils.showNotification('取引の追加に失敗しました', 'error');
                    return;
                }
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
            const name = formData.get('name')?.trim();
            const balance = formData.get('balance');

            // Validation
            if (!name) {
                UIUtils.showNotification('資金元名を入力してください', 'error');
                return;
            }

            if (!balance || isNaN(parseFloat(balance))) {
                UIUtils.showNotification('有効な初期残高を入力してください', 'error');
                return;
            }

            const fundSourceData = {
                name: name,
                initialBalance: parseFloat(balance),
                type: formData.get('type') || 'bank'
            };

            if (this.editingFundSource) {
                // Check permission to manage fund source
                if (!window.dataManager.canManageFundSource(this.editingFundSource)) {
                    UIUtils.showNotification('この資金元を編集する権限がありません', 'error');
                    return;
                }

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
        console.log('openTransactionModal start.');
        try {
            // Check authentication first
            console.log('認証：', this.checkAuthForAction('add_transaction'));
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
            console.log('ここまで', transactionId);

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
                console.log('ここはOK');
                this.updateSubcategoryOptions('');
            }

            console.log('About to call showModal');
            console.log('this.modalManager:', this.modalManager);
            console.log('showModal method exists:', typeof this.modalManager.showModal);
            this.modalManager.showModal('transaction-modal');
            console.log('showModal called');
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

            // Check permission to manage specific fund source if editing
            if (fundSourceId) {
                if (!window.dataManager.canManageFundSource(fundSourceId)) {
                    UIUtils.showNotification('この資金元を編集する権限がありません', 'warning');
                    return;
                }
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

            // Populate creator dropdown
            this.populateCreatorFilter();

            if (filters.createdBy) {
                document.getElementById('filter-creator').value = filters.createdBy;
            }

            // Set checkbox states
            document.getElementById('filter-only-my-transactions').checked = filters.showOnlyMyTransactions || false;
            document.getElementById('filter-only-shared-transactions').checked = filters.showOnlySharedTransactions || false;

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
            // Allow basic actions for guest users
            const guestAllowedActions = ['add_transaction', 'filter_transactions', 'view_data', 'manage_subcategories', 'export_data', 'import_data', 'clear_data'];

            if (guestAllowedActions.includes(action)) {
                return true;
            }

            // Actions that require authentication
            const authRequiredActions = ['manage_sharing', 'manage_fund_source'];

            if (authRequiredActions.includes(action)) {
                if (!window.authManager || !window.authManager.getIsLoggedIn()) {
                    UIUtils.showNotification('この機能を使用するにはログインが必要です', 'warning');
                    if (window.authManager) {
                        window.authManager.showAuthModal('login');
                    }
                    return false;
                }
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
                const result = window.dataManager.deleteTransaction(id);
                if (result) {
                    this.renderTransactions();
                    this.renderFundSources();
                    UIUtils.showNotification('取引を削除しました', 'success');
                } else {
                    UIUtils.showNotification('取引の削除に失敗しました', 'error');
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
                UIUtils.showNotification(error.message || '削除に失敗しました', 'error');
            }
        }
    }

    confirmDeleteFundSource(id) {
        if (confirm('この資金元を削除しますか？')) {
            try {
                const result = window.dataManager.deleteFundSource(id);
                if (result) {
                    this.renderFundSources();
                    this.populateSelects();
                    UIUtils.showNotification('資金元を削除しました', 'success');
                } else {
                    UIUtils.showNotification('資金元の削除に失敗しました', 'error');
                }
            } catch (error) {
                console.error('Error deleting fund source:', error);
                UIUtils.showNotification(error.message || '削除に失敗しました', 'error');
            }
        }
    }

    // Subcategory management methods
    openSubcategoryModal(categoryId) {
        try {
            if (!this.checkAuthForAction('manage_subcategories')) {
                return;
            }

            const categories = window.storage.getCategories();
            const category = categories.find(c => c.id === categoryId);
            const subcategories = window.dataManager.getSubcategories(categoryId);

            if (!category) {
                UIUtils.showNotification('カテゴリが見つかりません', 'error');
                return;
            }

            this.selectedCategoryForSubcategory = categoryId;

            const content = `
                <div class="subcategory-management">
                    <div class="category-info">
                        <h4>${category.icon} ${UIUtils.escapeHtml(category.name)}</h4>
                        <p>このカテゴリのサブカテゴリを管理できます。</p>
                    </div>
                    
                    <div class="add-subcategory-section">
                        <div class="form-group">
                            <input type="text" id="new-subcategory-name" placeholder="サブカテゴリ名を入力" class="form-control" maxlength="30">
                            <button id="add-subcategory-btn" class="btn primary">追加</button>
                        </div>
                    </div>
                    
                    <div class="subcategory-list">
                        ${subcategories.length === 0 ?
                    '<div class="empty-state"><p>サブカテゴリはありません</p></div>' :
                    subcategories.map(sc => `
                                <div class="subcategory-item" data-id="${sc.id}">
                                    <div class="subcategory-info">
                                        <div class="subcategory-name">${UIUtils.escapeHtml(sc.name)}</div>
                                    </div>
                                    <div class="subcategory-actions">
                                        <button class="btn secondary small edit-subcategory" data-id="${sc.id}">編集</button>
                                        <button class="btn secondary small delete-subcategory" data-id="${sc.id}" 
                                                ${window.dataManager.canDeleteSubcategory(sc.id) ? '' : 'disabled'}>削除</button>
                                    </div>
                                </div>
                            `).join('')
                }
                    </div>
                </div>
            `;

            this.modalManager.showInfoModal('サブカテゴリ管理', content);

            // Add event listeners
            setTimeout(() => {
                const addBtn = document.getElementById('add-subcategory-btn');
                const nameInput = document.getElementById('new-subcategory-name');

                if (addBtn && nameInput) {
                    const addSubcategory = () => {
                        const name = nameInput.value.trim();
                        if (name) {
                            this.addSubcategory(categoryId, name);
                        } else {
                            UIUtils.showNotification('サブカテゴリ名を入力してください', 'warning');
                        }
                    };

                    addBtn.addEventListener('click', addSubcategory);
                    nameInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            addSubcategory();
                        }
                    });
                }

                document.querySelectorAll('.edit-subcategory').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const subcategoryId = e.target.dataset.id;
                        this.editSubcategory(subcategoryId);
                    });
                });

                document.querySelectorAll('.delete-subcategory').forEach(btn => {
                    if (!btn.disabled) {
                        btn.addEventListener('click', (e) => {
                            const subcategoryId = e.target.dataset.id;
                            this.deleteSubcategory(subcategoryId);
                        });
                    }
                });
            }, 100);

        } catch (error) {
            console.error('Error opening subcategory modal:', error);
            UIUtils.showNotification('サブカテゴリモーダルを開けませんでした', 'error');
        }
    }

    addSubcategory(categoryId, name) {
        try {
            window.dataManager.addSubcategory({
                name: name,
                categoryId: categoryId
            });

            UIUtils.showNotification('サブカテゴリを追加しました', 'success');

            // Refresh the modal and update selects
            this.modalManager.closeModal('info-modal');
            setTimeout(() => {
                this.openSubcategoryModal(categoryId);
                this.populateSelects();
            }, 100);

        } catch (error) {
            console.error('Error adding subcategory:', error);
            UIUtils.showNotification('サブカテゴリの追加に失敗しました: ' + error.message, 'error');
        }
    }

    editSubcategory(subcategoryId) {
        try {
            const subcategories = window.storage.getSubcategories();
            const subcategory = subcategories.find(sc => sc.id === subcategoryId);

            if (!subcategory) {
                UIUtils.showNotification('サブカテゴリが見つかりません', 'error');
                return;
            }

            const newName = prompt('新しいサブカテゴリ名を入力してください:', subcategory.name);

            if (newName && newName.trim() !== subcategory.name) {
                window.dataManager.updateSubcategory(subcategoryId, {
                    name: newName.trim()
                });

                UIUtils.showNotification('サブカテゴリを更新しました', 'success');

                // Refresh the modal and update selects
                this.modalManager.closeModal('info-modal');
                setTimeout(() => {
                    this.openSubcategoryModal(subcategory.categoryId);
                    this.populateSelects();
                }, 100);
            }

        } catch (error) {
            console.error('Error editing subcategory:', error);
            UIUtils.showNotification('サブカテゴリの編集に失敗しました: ' + error.message, 'error');
        }
    }

    deleteSubcategory(subcategoryId) {
        try {
            const subcategories = window.storage.getSubcategories();
            const subcategory = subcategories.find(sc => sc.id === subcategoryId);

            if (!subcategory) {
                UIUtils.showNotification('サブカテゴリが見つかりません', 'error');
                return;
            }

            if (confirm(`「${subcategory.name}」を削除しますか？`)) {
                window.dataManager.deleteSubcategory(subcategoryId);
                UIUtils.showNotification('サブカテゴリを削除しました', 'success');

                // Refresh the modal and update selects
                this.modalManager.closeModal('info-modal');
                setTimeout(() => {
                    this.openSubcategoryModal(subcategory.categoryId);
                    this.populateSelects();
                }, 100);
            }

        } catch (error) {
            console.error('Error deleting subcategory:', error);
            UIUtils.showNotification('サブカテゴリの削除に失敗しました: ' + error.message, 'error');
        }
    }

    // Filter management methods
    populateCreatorFilter() {
        try {
            const creatorSelect = document.getElementById('filter-creator');
            if (!creatorSelect) return;

            // Clear existing options except "すべて"
            creatorSelect.innerHTML = '<option value="">すべて</option>';

            // Get available creators
            const creators = window.dataManager.getAvailableCreators();
            
            creators.forEach(creator => {
                const option = document.createElement('option');
                option.value = creator.id;
                option.textContent = creator.username;
                creatorSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error populating creator filter:', error);
        }
    }

    applyFilters() {
        try {
            const filters = {
                startDate: document.getElementById('filter-start-date').value || null,
                endDate: document.getElementById('filter-end-date').value || null,
                category: document.getElementById('filter-category').value || null,
                fundSource: document.getElementById('filter-fund-source').value || null,
                createdBy: document.getElementById('filter-creator').value || null,
                showOnlyMyTransactions: document.getElementById('filter-only-my-transactions').checked,
                showOnlySharedTransactions: document.getElementById('filter-only-shared-transactions').checked
            };

            // Validate mutual exclusivity of checkboxes
            if (filters.showOnlyMyTransactions && filters.showOnlySharedTransactions) {
                UIUtils.showNotification('「自分の取引のみ」と「共有取引のみ」は同時に選択できません', 'warning');
                return;
            }

            window.dataManager.setAdvancedFilters(filters);
            this.updateFilterButtonState();
            this.renderTransactions();
            this.modalManager.closeModal('filter-modal');

            // Show notification about active filters
            const filterSummary = window.dataManager.getFilterSummary();
            if (filterSummary.length > 0) {
                UIUtils.showNotification(`${filterSummary.length}個のフィルターが適用されました`, 'success');
            } else {
                UIUtils.showNotification('フィルターをクリアしました', 'info');
            }

        } catch (error) {
            console.error('Error applying filters:', error);
            UIUtils.showNotification('フィルターの適用に失敗しました', 'error');
        }
    }

    clearFilters() {
        try {
            // Clear form fields
            document.getElementById('filter-start-date').value = '';
            document.getElementById('filter-end-date').value = '';
            document.getElementById('filter-category').value = '';
            document.getElementById('filter-fund-source').value = '';
            document.getElementById('filter-creator').value = '';
            document.getElementById('filter-only-my-transactions').checked = false;
            document.getElementById('filter-only-shared-transactions').checked = false;

            // Clear filters in data manager
            window.dataManager.clearFilters();
            this.updateFilterButtonState();
            this.renderTransactions();
            this.modalManager.closeModal('filter-modal');

            UIUtils.showNotification('フィルターをクリアしました', 'info');

        } catch (error) {
            console.error('Error clearing filters:', error);
            UIUtils.showNotification('フィルターのクリアに失敗しました', 'error');
        }
    }

    updateFilterButtonState() {
        try {
            const filterBtn = document.getElementById('filter-btn');
            if (!filterBtn) return;

            const hasActiveFilters = window.dataManager.hasActiveFilters();
            
            if (hasActiveFilters) {
                filterBtn.classList.add('filter-active');
                filterBtn.title = 'フィルター適用中 - クリックして編集';
                
                // Add filter summary to header if not already present
                this.showFilterSummary();
            } else {
                filterBtn.classList.remove('filter-active');
                filterBtn.title = 'フィルター';
                
                // Remove filter summary
                this.hideFilterSummary();
            }

        } catch (error) {
            console.error('Error updating filter button state:', error);
        }
    }

    showFilterSummary() {
        try {
            // Remove existing summary
            this.hideFilterSummary();
            
            const filterSummary = window.dataManager.getFilterSummary();
            if (filterSummary.length === 0) return;

            const header = document.querySelector('.app-header');
            if (!header) return;

            const summaryElement = document.createElement('div');
            summaryElement.className = 'filter-summary';
            summaryElement.innerHTML = `
                <div class="filter-status">
                    <span class="icon">🔍</span>
                    <span>${filterSummary.length}個のフィルター適用中</span>
                </div>
            `;

            header.appendChild(summaryElement);

        } catch (error) {
            console.error('Error showing filter summary:', error);
        }
    }

    hideFilterSummary() {
        try {
            const existingSummary = document.querySelector('.filter-summary');
            if (existingSummary) {
                existingSummary.remove();
            }
        } catch (error) {
            console.error('Error hiding filter summary:', error);
        }
    }

    // Settings-related methods
    openSharingManagementModal() {
        try {
            // Check authentication first
            if (!this.checkAuthForAction('manage_sharing')) {
                return;
            }

            // Try to initialize sharing UI if not available
            if (!window.sharingUIManager) {
                console.log('SharingUIManager not available, attempting automatic initialization...');
                
                // Show loading message
                UIUtils.showNotification('共有管理機能を初期化中...', 'info');
                
                // Attempt multiple initialization strategies
                this.attemptSharingInitialization(() => {
                    if (window.sharingUIManager && typeof window.sharingUIManager.openSharingManagementModal === 'function') {
                        window.sharingUIManager.openSharingManagementModal();
                    } else {
                        UIUtils.showNotification('共有管理機能が一時的に利用できません。ページを再読み込みしてください。', 'warning');
                    }
                });
                return;
            }

            if (window.sharingUIManager && typeof window.sharingUIManager.openSharingManagementModal === 'function') {
                window.sharingUIManager.openSharingManagementModal();
            } else {
                console.log('Sharing UI Manager status:', {
                    exists: !!window.sharingUIManager,
                    hasMethod: window.sharingUIManager ? typeof window.sharingUIManager.openSharingManagementModal : 'N/A',
                    sharingManager: !!window.sharingManager,
                    invitationManager: !!window.invitationManager,
                    permissionManager: !!window.permissionManager
                });
                
                // Show helpful message with alternative
                this.showSharingUnavailableMessage('共有管理');
            }
        } catch (error) {
            console.error('Error opening sharing management modal:', error);
            UIUtils.showNotification('共有管理モーダルを開けませんでした', 'error');
        }
    }

    openSharedUsersModal() {
        try {
            // Check authentication first
            if (!this.checkAuthForAction('manage_sharing')) {
                return;
            }

            // Try to initialize sharing UI if not available
            if (!window.sharingUIManager) {
                console.log('SharingUIManager not available, attempting automatic initialization...');
                
                // Show loading message
                UIUtils.showNotification('共有ユーザー管理機能を初期化中...', 'info');
                
                // Attempt multiple initialization strategies
                this.attemptSharingInitialization(() => {
                    if (window.sharingUIManager && typeof window.sharingUIManager.openSharedUsersModal === 'function') {
                        window.sharingUIManager.openSharedUsersModal();
                    } else {
                        UIUtils.showNotification('共有ユーザー管理機能が一時的に利用できません。ページを再読み込みしてください。', 'warning');
                    }
                });
                return;
            }

            if (window.sharingUIManager && typeof window.sharingUIManager.openSharedUsersModal === 'function') {
                window.sharingUIManager.openSharedUsersModal();
            } else {
                console.log('Sharing UI Manager status:', {
                    exists: !!window.sharingUIManager,
                    hasMethod: window.sharingUIManager ? typeof window.sharingUIManager.openSharedUsersModal : 'N/A',
                    sharingManager: !!window.sharingManager,
                    invitationManager: !!window.invitationManager,
                    permissionManager: !!window.permissionManager
                });
                
                // Show helpful message with alternative
                this.showSharingUnavailableMessage('共有ユーザー管理');
            }
        } catch (error) {
            console.error('Error opening shared users modal:', error);
            UIUtils.showNotification('共有ユーザーモーダルを開けませんでした', 'error');
        }
    }

    exportData() {
        try {
            // Check authentication first
            if (!this.checkAuthForAction('export_data')) {
                return;
            }

            const data = {
                transactions: window.storage.getTransactions(),
                fundSources: window.storage.getFundSources(),
                subcategories: window.storage.getSubcategories(),
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };

            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            UIUtils.showNotification('データをエクスポートしました', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            UIUtils.showNotification('データのエクスポートに失敗しました', 'error');
        }
    }

    importData() {
        try {
            // Check authentication first
            if (!this.checkAuthForAction('import_data')) {
                return;
            }

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        // Validate data structure
                        if (!data.transactions || !data.fundSources) {
                            throw new Error('無効なデータ形式です');
                        }

                        if (confirm('現在のデータを上書きしますか？この操作は元に戻せません。')) {
                            // Import data
                            if (data.transactions) window.storage.setTransactions(data.transactions);
                            if (data.fundSources) window.storage.setFundSources(data.fundSources);
                            if (data.subcategories) window.storage.setSubcategories(data.subcategories);

                            // Refresh UI
                            this.loadInitialData();
                            UIUtils.showNotification('データをインポートしました', 'success');
                        }
                    } catch (error) {
                        console.error('Error importing data:', error);
                        UIUtils.showNotification('データのインポートに失敗しました: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            };
            
            input.click();
        } catch (error) {
            console.error('Error importing data:', error);
            UIUtils.showNotification('データのインポートに失敗しました', 'error');
        }
    }

    confirmClearData() {
        try {
            // Check authentication first
            if (!this.checkAuthForAction('clear_data')) {
                return;
            }

            const confirmMessage = 'すべてのデータを削除しますか？この操作は元に戻せません。\n\n削除されるデータ:\n- すべての取引\n- すべての資金元\n- すべてのサブカテゴリ\n- 共有設定';
            
            if (confirm(confirmMessage)) {
                if (confirm('本当にすべてのデータを削除しますか？')) {
                    // Clear all data
                    window.storage.clearAllData();
                    
                    // Refresh UI
                    this.loadInitialData();
                    UIUtils.showNotification('すべてのデータを削除しました', 'info');
                }
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            UIUtils.showNotification('データの削除に失敗しました', 'error');
        }
    }

    // Update auth-dependent UI elements
    updateAuthDependentUI() {
        try {
            const sharingSection = document.getElementById('sharing-section');
            const userInfo = document.getElementById('user-info');
            const loginBtn = document.getElementById('show-login');
            const logoutBtn = document.getElementById('logout-btn');
            const manageSharingBtn = document.getElementById('manage-sharing');
            const sharedUsersBtn = document.getElementById('shared-users');

            const isLoggedIn = window.authManager && window.authManager.getIsLoggedIn();
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;

            if (isLoggedIn && currentUser) {
                // Show sharing section for logged in users
                if (sharingSection) {
                    sharingSection.style.display = 'block';
                    
                    // Update sharing buttons state
                    if (manageSharingBtn) {
                        manageSharingBtn.style.opacity = '1';
                        manageSharingBtn.style.pointerEvents = 'auto';
                        manageSharingBtn.title = '資金元の共有設定を管理';
                    }
                    
                    if (sharedUsersBtn) {
                        sharedUsersBtn.style.opacity = '1';
                        sharedUsersBtn.style.pointerEvents = 'auto';
                        sharedUsersBtn.title = '共有ユーザーを管理';
                    }
                }
                
                // Update user info
                if (userInfo) {
                    userInfo.innerHTML = `
                        <div class="user-avatar">👤</div>
                        <div class="user-details">
                            <div class="user-name">${UIUtils.escapeHtml(currentUser.username)}</div>
                            <div class="user-email">${UIUtils.escapeHtml(currentUser.email)}</div>
                            ${currentUser.lastLoginDate ? `<div class="user-last-login">最終ログイン: ${new Date(currentUser.lastLoginDate).toLocaleDateString('ja-JP')}</div>` : ''}
                        </div>
                    `;
                }
                
                // Show logout button, hide login button
                if (logoutBtn) logoutBtn.style.display = 'block';
                if (loginBtn) loginBtn.style.display = 'none';
                
            } else {
                // Hide sharing section for guest users
                if (sharingSection) {
                    sharingSection.style.display = 'none';
                }
                
                // Show guest user info
                if (userInfo) {
                    userInfo.innerHTML = `
                        <div class="user-avatar">👤</div>
                        <div class="user-details">
                            <div class="user-name">ゲストユーザー</div>
                            <div class="user-email">ログインしてデータを保存</div>
                            <div class="user-note">共有機能を使用するにはログインが必要です</div>
                        </div>
                    `;
                }
                
                // Hide logout button, show login button
                if (logoutBtn) logoutBtn.style.display = 'none';
                if (loginBtn) loginBtn.style.display = 'block';
            }

            // Update page title to reflect auth state
            this.updatePageTitleWithAuthState();

            // Update sharing-related UI elements
            if (window.sharingUIManager && typeof window.sharingUIManager.updateAuthDependentUI === 'function') {
                window.sharingUIManager.updateAuthDependentUI();
            }

            // Update fund sources display to show sharing indicators
            this.renderFundSources();

            // Update transaction display to show sharing information
            this.renderTransactions();

        } catch (error) {
            console.error('Error updating auth-dependent UI:', error);
        }
    }

    updatePageTitleWithAuthState() {
        try {
            const pageTitle = document.getElementById('page-title');
            if (!pageTitle) return;

            const isLoggedIn = window.authManager && window.authManager.getIsLoggedIn();
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;

            if (this.currentView === 'settings' && pageTitle) {
                if (isLoggedIn && currentUser) {
                    pageTitle.textContent = `設定 - ${currentUser.username}`;
                } else {
                    pageTitle.textContent = '設定 - ゲスト';
                }
            }
        } catch (error) {
            console.error('Error updating page title with auth state:', error);
        }
    }

    // Attempt sharing initialization with multiple strategies
    attemptSharingInitialization(callback) {
        let attempts = 0;
        const maxAttempts = 5;
        
        const tryInitialization = () => {
            attempts++;
            console.log(`Sharing initialization attempt ${attempts}/${maxAttempts}`);
            
            // Strategy 1: Try normal initialization
            if (window.initializeSharingUI) {
                const success = window.initializeSharingUI();
                if (success && window.sharingUIManager) {
                    console.log('Sharing initialization successful');
                    callback();
                    return;
                }
            }
            
            // Strategy 2: Try force reinitialization
            if (window.reinitializeSharing) {
                console.log('Attempting force reinitialization...');
                window.reinitializeSharing();
            }
            
            // Strategy 3: Manual initialization
            if (!window.sharingUIManager && window.SharingUIManager && 
                window.uiManager && window.sharingManager && 
                window.invitationManager && window.permissionManager) {
                
                try {
                    console.log('Attempting manual SharingUIManager creation...');
                    window.sharingUIManager = new SharingUIManager(
                        window.uiManager,
                        window.sharingManager,
                        window.invitationManager,
                        window.permissionManager
                    );
                    
                    if (window.sharingUIManager) {
                        console.log('Manual SharingUIManager creation successful');
                        callback();
                        return;
                    }
                } catch (error) {
                    console.error('Manual initialization failed:', error);
                }
            }
            
            // If still not successful and we have attempts left, try again
            if (attempts < maxAttempts) {
                setTimeout(tryInitialization, 500 * attempts); // Increasing delay
            } else {
                console.error('All sharing initialization attempts failed');
                callback(); // Call callback anyway to show error message
            }
        };
        
        tryInitialization();
    }

    // Show user-friendly message when sharing is unavailable
    showSharingUnavailableMessage(featureName) {
        const message = `${featureName}機能が一時的に利用できません。\n\n以下をお試しください：\n• ページを再読み込み\n• ログアウト後に再ログイン\n• しばらく時間をおいて再試行`;
        
        if (confirm(message + '\n\n今すぐページを再読み込みしますか？')) {
            window.location.reload();
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