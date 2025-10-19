// UI Management and Event Handlers
class UIManager {
    constructor() {
        this.currentView = 'transactions';
        this.currentTransactionView = 'list';
        this.editingTransaction = null;
        this.editingFundSource = null;
        
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
            const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
            
            return `
                <div class="transaction-item" data-id="${transaction.id}">
                    <div class="transaction-info">
                        <div class="transaction-category">
                            ${category ? category.icon : '📦'} ${category ? category.name : 'カテゴリなし'}
                        </div>
                        <div class="transaction-date">
                            ${window.dataManager.formatDate(transaction.date)}
                            ${fundSource ? `・${fundSource.name}` : ''}
                        </div>
                        ${transaction.note ? `<div class="transaction-note">${transaction.note}</div>` : ''}
                    </div>
                    <div class="transaction-amount ${transaction.amount < 0 ? 'expense' : 'income'}">
                        ${window.dataManager.formatCurrency(transaction.amount)}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Add click handlers
        container.querySelectorAll('.transaction-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                this.editTransaction(id);
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

        const html = fundSources.map(fundSource => `
            <div class="fundsource-item" data-id="${fundSource.id}">
                <div class="fundsource-info">
                    <div class="fundsource-name">
                        ${this.getFundSourceIcon(fundSource.type)} ${fundSource.name}
                    </div>
                    <div class="fundsource-type">
                        ${this.getFundSourceTypeName(fundSource.type)}
                    </div>
                </div>
                <div class="fundsource-balance">
                    ${window.dataManager.formatCurrency(fundSource.currentBalance)}
                </div>
            </div>
        `).join('');

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
        filterCategorySelect.innerHTML = '<option value="">すべて</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('');
    }

    // Modal Management
    openTransactionModal(transactionId = null) {
        this.editingTransaction = transactionId;
        const modal = document.getElementById('transaction-modal');
        const title = document.getElementById('transaction-modal-title');
        const form = document.getElementById('transaction-form');

        if (transactionId) {
            const transaction = window.storage.getTransactions().find(t => t.id === transactionId);
            if (transaction) {
                title.textContent = '取引を編集';
                document.getElementById('amount').value = Math.abs(transaction.amount);
                document.getElementById('category').value = transaction.categoryId;
                document.getElementById('fundSource').value = transaction.fundSourceId;
                document.getElementById('date').value = transaction.date.toISOString().split('T')[0];
                document.getElementById('note').value = transaction.note || '';
            }
        } else {
            title.textContent = '取引を追加';
            form.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
        }

        this.showModal('transaction-modal');
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

        this.showModal('filter-modal');
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
            fundSourceId: formData.get('fundSource'),
            date: new Date(formData.get('date')),
            note: formData.get('note') || null
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

    editTransaction(id) {
        this.openTransactionModal(id);
    }

    // Filter Management
    applyFilters() {
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;
        const category = document.getElementById('filter-category').value;

        window.dataManager.setFilters({
            startDate: startDate || null,
            endDate: endDate || null,
            category: category || null
        });

        this.closeModal('filter-modal');
        this.renderTransactions();
        this.updateFilterButton();
    }

    clearFilters() {
        window.dataManager.clearFilters();
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        document.getElementById('filter-category').value = '';
        
        this.renderTransactions();
        this.updateFilterButton();
    }

    updateFilterButton() {
        const filterBtn = document.getElementById('filter-btn');
        const hasFilters = window.dataManager.hasActiveFilters();
        filterBtn.style.opacity = hasFilters ? '1' : '0.6';
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