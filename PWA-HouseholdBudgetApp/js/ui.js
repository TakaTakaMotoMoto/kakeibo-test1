// UI Management and Event Handlers
class UIManager {
    constructor() {
        this.currentView = 'transactions';
        this.currentTransactionView = 'list';
        this.editingTransaction = null;
        this.editingFundSource = null;
        this.editingSubcategory = null;
        this.selectedCategoryForSubcategory = null;
        
        this.initializeEventListeners();
        this.loadInitialData();
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

        // Category change handler for subcategory filtering
        document.getElementById('category').addEventListener('change', (e) => {
            this.updateSubcategoryOptions(e.target.value);
        });

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
        const fundSources = window.storage.getFundSources();

        if (fundSources.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💳</div>
                    <h3>資金元がありません</h3>
                    <p>資金元を追加してください</p>
                </div>
            `;
            return;
        }

        const html = fundSources.map(fundSource => {
            const canDelete = window.dataManager.canDeleteFundSource(fundSource.id);
            return `
                <div class="fundsource-item" data-id="${fundSource.id}">
                    <div class="fundsource-info">
                        <div class="fundsource-name">
                            ${this.getFundSourceIcon(fundSource.type)} ${fundSource.name}
                        </div>
                        <div class="fundsource-type">
                            ${this.getFundSourceTypeName(fundSource.type)}
                        </div>
                    </div>
                    <div class="fundsource-actions">
                        <div class="fundsource-balance">
                            ${window.dataManager.formatCurrency(fundSource.currentBalance)}
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

        container.innerHTML = html + `
            <div class="fundsource-item add-fundsource" style="border: 2px dashed var(--border-color); justify-content: center;">
                <div class="fundsource-info text-center">
                    <div class="fundsource-name">+ 資金元を追加</div>
                </div>
            </div>
        `;

        // Add click handler for add button
        container.querySelector('.add-fundsource').addEventListener('click', () => {
            this.openFundSourceModal();
        });

        // Add delete handlers for fund sources
        container.querySelectorAll('.fundsource-item .delete-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    this.confirmDeleteFundSource(id);
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
        
        if (!categoryId) {
            subcategorySelect.innerHTML = '<option value="">カテゴリを先に選択してください</option>';
            subcategorySelect.disabled = true;
            manageBtn.disabled = true;
            return;
        }

        const subcategories = window.dataManager.getSubcategories(categoryId);
        subcategorySelect.innerHTML = '<option value="">選択してください（任意）</option>' +
            subcategories.map(sc => `<option value="${sc.id}">${sc.name}</option>`).join('');
        
        subcategorySelect.disabled = false;
        manageBtn.disabled = false;
        this.selectedCategoryForSubcategory = categoryId;
    }

    updateSubcategoryOptions(categoryId) {
        const subcategorySelect = document.getElementById('subcategory');
        if (!subcategorySelect) return;

        if (!categoryId) {
            subcategorySelect.innerHTML = '<option value="">選択してください</option>';
            subcategorySelect.disabled = true;
            return;
        }

        const subcategories = window.dataManager.getSubcategories(categoryId);
        subcategorySelect.innerHTML = '<option value="">選択してください</option>' +
            subcategories.map(sc => `<option value="${sc.id}">${sc.name}</option>`).join('');
        subcategorySelect.disabled = false;
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

    openSubcategoryModal() {
        if (!this.selectedCategoryForSubcategory) {
            this.showNotification('カテゴリを先に選択してください', 'warning');
            return;
        }

        const category = window.storage.getCategories().find(c => c.id === this.selectedCategoryForSubcategory);
        if (category) {
            document.getElementById('selected-category-name').textContent = `${category.icon} ${category.name}`;
            this.renderSubcategoryManagement();
            this.showModal('subcategory-modal');
        }
    }

    openSubcategoryFormModal(subcategoryId = null) {
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

        this.showModal('subcategory-form-modal');
    }

    renderSubcategoryManagement() {
        const container = document.getElementById('subcategory-list');
        const subcategories = window.dataManager.getSubcategories(this.selectedCategoryForSubcategory);

        if (subcategories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>サブカテゴリがありません</p>
                    <p>上の「+ サブカテゴリ追加」ボタンから追加してください</p>
                </div>
            `;
            return;
        }

        const html = subcategories.map(subcategory => {
            const canDelete = window.dataManager.canDeleteSubcategory(subcategory.id);
            return `
                <div class="subcategory-item" data-id="${subcategory.id}">
                    <div class="subcategory-info">
                        <div class="subcategory-name">${subcategory.name}</div>
                    </div>
                    <div class="subcategory-actions">
                        <button class="edit-btn" data-id="${subcategory.id}" title="編集">
                            ✏️
                        </button>
                        <button class="delete-btn ${canDelete ? '' : 'disabled'}" 
                                data-id="${subcategory.id}" 
                                title="${canDelete ? '削除' : '使用中のため削除できません'}"
                                ${canDelete ? '' : 'disabled'}>
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Add event listeners
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.openSubcategoryFormModal(id);
            });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    this.confirmDeleteSubcategory(id);
                });
            }
        });
    }

    openFundSourceModal(fundSourceId = null) {
        this.editingFundSource = fundSourceId;
        const modal = document.getElementById('fundsource-modal');
        const title = document.getElementById('fundsource-modal-title');
        const form = document.getElementById('fundsource-form');

        if (fundSourceId) {
            const fundSource = window.storage.getFundSources().find(fs => fs.id === fundSourceId);
            if (fundSource) {
                title.textContent = '資金元を編集';
                document.getElementById('fs-name').value = fundSource.name;
                document.getElementById('fs-balance').value = fundSource.currentBalance;
            }
        } else {
            title.textContent = '資金元を追加';
            form.reset();
        }

        this.showModal('fundsource-modal');
    }

    openFilterModal() {
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
        
        // Set creator filter
        const creatorSelect = document.getElementById('filter-creator');
        if (creatorSelect) {
            if (filters.showOnlyMyTransactions) {
                creatorSelect.value = 'me';
            } else if (filters.showOnlySharedTransactions) {
                creatorSelect.value = 'shared';
            } else {
                creatorSelect.value = '';
            }
        }

        this.showModal('filter-modal');
    }

    openSubcategoryModal() {
        this.renderSubcategoryManagement();
        this.showModal('subcategory-modal');
    }

    openSubcategoryFormModal(subcategoryId = null) {
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

        this.showModal('subcategory-form-modal');
    }

    renderSubcategoryManagement() {
        const categories = window.storage.getCategories();
        const container = document.getElementById('subcategory-list');
        
        if (categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <h3>カテゴリがありません</h3>
                    <p>まずカテゴリを作成してください</p>
                </div>
            `;
            return;
        }

        const html = categories.map(category => {
            const subcategories = window.dataManager.getSubcategories(category.id);
            return `
                <div class="category-section" data-category-id="${category.id}">
                    <div class="category-header">
                        <div class="category-info">
                            <span class="category-icon">${category.icon}</span>
                            <span class="category-name">${category.name}</span>
                            <span class="subcategory-count">(${subcategories.length}個)</span>
                        </div>
                        <button class="btn primary small add-subcategory-btn" data-category-id="${category.id}">
                            + 追加
                        </button>
                    </div>
                    <div class="subcategory-items">
                        ${subcategories.length === 0 ? 
                            '<div class="no-subcategories">サブカテゴリがありません</div>' :
                            subcategories.map(sc => `
                                <div class="subcategory-item" data-subcategory-id="${sc.id}">
                                    <div class="subcategory-info">
                                        <span class="subcategory-name">${sc.name}</span>
                                        <span class="usage-count">${this.getSubcategoryUsageCount(sc.id)}回使用</span>
                                    </div>
                                    <div class="subcategory-actions">
                                        <button class="btn secondary small edit-subcategory-btn" data-subcategory-id="${sc.id}">
                                            編集
                                        </button>
                                        <button class="btn danger small delete-subcategory-btn" 
                                                data-subcategory-id="${sc.id}"
                                                ${window.dataManager.canDeleteSubcategory(sc.id) ? '' : 'disabled'}>
                                            削除
                                        </button>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Add event listeners
        container.querySelectorAll('.add-subcategory-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedCategoryForSubcategory = e.target.dataset.categoryId;
                this.openSubcategoryFormModal();
            });
        });

        container.querySelectorAll('.edit-subcategory-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subcategoryId = e.target.dataset.subcategoryId;
                const subcategory = window.storage.getSubcategories().find(sc => sc.id === subcategoryId);
                if (subcategory) {
                    this.selectedCategoryForSubcategory = subcategory.categoryId;
                    this.openSubcategoryFormModal(subcategoryId);
                }
            });
        });

        container.querySelectorAll('.delete-subcategory-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', (e) => {
                    const subcategoryId = e.target.dataset.subcategoryId;
                    this.confirmDeleteSubcategory(subcategoryId);
                });
            }
        });
    }

    getSubcategoryUsageCount(subcategoryId) {
        const transactions = window.storage.getTransactions();
        return transactions.filter(t => t.subcategoryId === subcategoryId).length;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        modal.querySelector('.modal-content').classList.add('slide-up');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        
        // Reset editing states
        if (modalId === 'transaction-modal') {
            this.editingTransaction = null;
        } else if (modalId === 'fundsource-modal') {
            this.editingFundSource = null;
        } else if (modalId === 'subcategory-form-modal') {
            this.editingSubcategory = null;
            this.selectedCategoryForSubcategory = null;
        }
    }

    // Form Handlers
    handleTransactionSubmit(e) {
        const formData = new FormData(e.target);
        const amount = parseFloat(formData.get('amount'));
        const isExpense = document.querySelector('input[name="type"]:checked')?.value !== 'income';
        
        const transactionData = {
            amount: isExpense ? -Math.abs(amount) : Math.abs(amount),
            categoryId: formData.get('category'),
            subcategoryId: formData.get('subcategory') || null,
            fundSourceId: formData.get('fundSource'),
            date: new Date(formData.get('date')),
            note: formData.get('note') || nullrmData.get('note') || null
        };

        const errors = window.dataManager.validateTransaction(transactionData);
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }

        if (this.editingTransaction) {
            window.dataManager.updateTransaction(this.editingTransaction, transactionData);
        } else {
            window.dataManager.addTransaction(transactionData);
        }

        this.closeModal('transaction-modal');
        this.renderTransactions();
        this.renderFundSources();
        
        if (this.currentTransactionView === 'calendar') {
            window.calendarManager.renderCalendar();
        }
    }

    handleFundSourceSubmit(e) {
        const formData = new FormData(e.target);
        const fundSourceData = {
            name: formData.get('name'),
            initialBalance: parseFloat(formData.get('balance')),
            type: 'bank' // Default type
        };

        const errors = window.dataManager.validateFundSource(fundSourceData);
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }

        if (this.editingFundSource) {
            // Update existing fund source
            const fundSources = window.storage.getFundSources();
            const index = fundSources.findIndex(fs => fs.id === this.editingFundSource);
            if (index !== -1) {
                fundSources[index] = { ...fundSources[index], ...fundSourceData };
                window.storage.setFundSources(fundSources);
            }
        } else {
            window.storage.addFundSource(fundSourceData);
        }

        this.closeModal('fundsource-modal');
        this.renderFundSources();
        this.populateSelects();
    }

    handleSubcategorySubmit(e) {
        const formData = new FormData(e.target);
        const subcategoryData = {
            name: formData.get('name').trim(),
            categoryId: this.selectedCategoryForSubcategory
        };

        try {
            if (this.editingSubcategory) {
                window.dataManager.updateSubcategory(this.editingSubcategory, subcategoryData);
                this.showNotification('サブカテゴリを更新しました', 'success');
            } else {
                window.dataManager.addSubcategory(subcategoryData);
                this.showNotification('サブカテゴリを追加しました', 'success');
            }

            this.closeModal('subcategory-form-modal');
            this.renderSubcategoryManagement();
            this.populateSelects();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    handleSubcategorySubmit(e) {
        const formData = new FormData(e.target);
        const name = formData.get('name').trim();

        if (!name) {
            alert('サブカテゴリ名を入力してください');
            return;
        }

        if (!this.selectedCategoryForSubcategory) {
            alert('カテゴリが選択されていません');
            return;
        }

        try {
            const subcategoryData = {
                name: name,
                categoryId: this.selectedCategoryForSubcategory
            };

            if (this.editingSubcategory) {
                window.dataManager.updateSubcategory(this.editingSubcategory, subcategoryData);
                this.showNotification('サブカテゴリを更新しました', 'success');
            } else {
                window.dataManager.addSubcategory(subcategoryData);
                this.showNotification('サブカテゴリを追加しました', 'success');
            }

            this.closeModal('subcategory-form-modal');
            this.renderSubcategoryManagement();
            this.populateSelects();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    editTransaction(id) {
        this.openTransactionModal(id);
    }

    // Delete confirmation methods
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

    confirmDeleteSubcategory(id) {
        const subcategory = window.storage.getSubcategories().find(sc => sc.id === id);
        if (!subcategory) return;

        const canDelete = window.dataManager.canDeleteSubcategory(id);
        if (!canDelete) {
            this.showNotification('このサブカテゴリは取引で使用されているため削除できません', 'error');
            return;
        }

        const usageCount = this.getSubcategoryUsageCount(id);
        const message = `サブカテゴリを削除しますか？\n\n${subcategory.name}\n使用回数: ${usageCount}回\n\nこの操作は取り消せません。`;
        
        if (confirm(message)) {
            try {
                window.dataManager.deleteSubcategory(id);
                this.renderSubcategoryManagement();
                this.populateSelects();
                this.showNotification('サブカテゴリを削除しました', 'success');
            } catch (error) {
                this.showNotification('削除に失敗しました: ' + error.message, 'error');
            }
        }
    }

    showNotification(message, type = 'info') {
        // Use the same notification system as the main app
        if (window.budgetApp) {
            window.budgetApp.showNotification(message, type);
        } else {
            // Fallback to alert if notification system is not available
            alert(message);
        }
    }

    // Filter Management
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

    // Data Management
    exportData() {
        const data = window.storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
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
                            alert('データのインポートが完了しました');
                            this.loadInitialData();
                        } else {
                            alert('データのインポートに失敗しました');
                        }
                    } catch (error) {
                        alert('無効なファイル形式です');
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
            alert('すべてのデータが削除されました');
        }
    }

    installApp() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                window.deferredPrompt = null;
            });
        } else {
            alert('このアプリは既にインストールされているか、インストールできません');
        }
    }

    // Sharing management methods
    showSharingManagement() {
        const fundSources = window.storage.getFundSources();
        const sharedUsers = window.dataManager.getSharedUsers();
        
        let content = '<h3>資金元の共有設定</h3>';
        
        if (fundSources.length === 0) {
            content += '<p>資金元がありません</p>';
        } else {
            content += '<div class="sharing-list">';
            fundSources.forEach(fs => {
                const sharedCount = fs.sharedWith ? fs.sharedWith.length : 0;
                content += `
                    <div class="sharing-item">
                        <div class="sharing-info">
                            <div class="fund-source-name">${this.getFundSourceIcon(fs.type)} ${fs.name}</div>
                            <div class="sharing-status">
                                ${fs.isShared ? `${sharedCount}人と共有中` : '共有されていません'}
                            </div>
                        </div>
                        <button class="btn secondary small" onclick="uiManager.toggleFundSourceSharing('${fs.id}')">
                            ${fs.isShared ? '共有停止' : '共有開始'}
                        </button>
                    </div>
                `;
            });
            content += '</div>';
        }
        
        this.showInfoModal('共有管理', content);
    }

    showSharedUsers() {
        const sharedUsers = window.dataManager.getSharedUsers();
        
        let content = '<h3>共有ユーザー一覧</h3>';
        
        if (sharedUsers.length === 0) {
            content += '<p>共有ユーザーはいません</p>';
        } else {
            content += '<div class="shared-users-list">';
            sharedUsers.forEach(user => {
                content += `
                    <div class="shared-user-item">
                        <div class="user-info">
                            <div class="user-name">👤 ${user.username}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                        <div class="user-status">
                            <span class="status-indicator active">アクティブ</span>
                        </div>
                    </div>
                `;
            });
            content += '</div>';
        }
        
        this.showInfoModal('共有ユーザー', content);
    }

    toggleFundSourceSharing(fundSourceId) {
        const fundSources = window.storage.getFundSources();
        const fundSource = fundSources.find(fs => fs.id === fundSourceId);
        
        if (fundSource) {
            fundSource.isShared = !fundSource.isShared;
            if (!fundSource.isShared) {
                fundSource.sharedWith = [];
            } else {
                // For demo purposes, share with mock users
                fundSource.sharedWith = ['user1', 'user2'];
            }
            
            window.storage.setFundSources(fundSources);
            this.showSharingManagement(); // Refresh the modal
            this.showNotification(
                fundSource.isShared ? '共有を開始しました' : '共有を停止しました', 
                'success'
            );
        }
    }

    showInfoModal(title, content) {
        // Create a simple info modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// Initialize UI Manager when DOM is loaded and dependencies are ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for dependencies to be ready
    const initUI = () => {
        if (window.storage && window.dataManager) {
            window.uiManager = new UIManager();
        } else {
            setTimeout(initUI, 100);
        }
    };
    initUI();
});

// Add methods to UIManager prototype
UIManager.prototype.updateAuthDependentUI = function() {
    // Update user info in settings
    this.updateUserInfoDisplay();
    
    // Refresh data displays
    this.loadInitialData();
    
    // Update navigation if needed
    this.updateNavigationState();
};

UIManager.prototype.updateUserInfoDisplay = function() {
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    const showLoginBtn = document.getElementById('show-login');
    const sharingSection = document.getElementById('sharing-section');

    if (!userInfo) return;

    if (window.authManager && window.authManager.getIsLoggedIn()) {
        const user = window.authManager.getCurrentUser();
        if (user) {
            userInfo.innerHTML = `
                <div class="user-avatar">👤</div>
                <div class="user-details">
                    <div class="user-name">${user.username}</div>
                    <div class="user-email">${user.email}</div>
                    ${user.lastLoginDate ? `<div class="user-last-login">最終ログイン: ${new Date(user.lastLoginDate).toLocaleDateString('ja-JP')}</div>` : ''}
                </div>
            `;
            
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (showLoginBtn) showLoginBtn.style.display = 'none';
            if (sharingSection) sharingSection.style.display = 'block';
        }
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
};

UIManager.prototype.updateNavigationState = function() {
    // Enable/disable certain features based on auth state
    const addBtn = document.getElementById('add-btn');
    const filterBtn = document.getElementById('filter-btn');
    
    const isLoggedIn = window.authManager && window.authManager.getIsLoggedIn();
    
    if (addBtn) {
        addBtn.disabled = !isLoggedIn;
        addBtn.style.opacity = isLoggedIn ? '1' : '0.5';
    }
    
    if (filterBtn) {
        filterBtn.disabled = !isLoggedIn;
        filterBtn.style.opacity = isLoggedIn ? '1' : '0.5';
    }
};

UIManager.prototype.showAuthRequiredMessage = function() {
    if (window.budgetApp) {
        window.budgetApp.showNotification('この機能を使用するにはログインが必要です', 'warning');
    }
    
    // Show login modal
    if (window.authManager) {
        window.authManager.showAuthModal('login');
    }
};

UIManager.prototype.checkAuthForAction = function(action) {
    if (!window.authManager || !window.authManager.getIsLoggedIn()) {
        this.showAuthRequiredMessage();
        return false;
    }
    return true;
};