import SwiftUI
import SwiftData

struct TransactionListView: View {
    @Environment(\.modelContext) private var modelContext
    
    @State private var transactionViewModel: TransactionViewModel
    @State private var categoryViewModel: CategoryViewModel
    @State private var fundSourceViewModel: FundSourceViewModel
    
    @State private var showingTransactionForm = false
    @State private var editingTransaction: Transaction?
    @State private var showingFilters = false
    
    // View mode states
    @State private var viewMode: ViewMode = .list
    @State private var selectedCalendarDate = Date()
    
    // Filter states
    @State private var selectedFilterCategory: Category?
    @State private var selectedFilterFundSource: FundSource?
    @State private var filterStartDate: Date = Calendar.current.date(byAdding: .month, value: -1, to: Date()) ?? Date()
    @State private var filterEndDate: Date = Date()
    @State private var isFilterActive = false
    
    enum ViewMode: CaseIterable {
        case list
        case calendar
        
        var title: String {
            switch self {
            case .list:
                return "リスト"
            case .calendar:
                return "カレンダー"
            }
        }
        
        var icon: String {
            switch self {
            case .list:
                return "list.bullet"
            case .calendar:
                return "calendar"
            }
        }
    }
    
    init() {
        // These will be properly initialized in onAppear
        self._transactionViewModel = State(initialValue: TransactionViewModel(modelContext: ModelContext(try! ModelContainer(for: Transaction.self)), fundSourceViewModel: FundSourceViewModel(modelContext: ModelContext(try! ModelContainer(for: FundSource.self)))))
        self._categoryViewModel = State(initialValue: CategoryViewModel(modelContext: ModelContext(try! ModelContainer(for: Category.self))))
        self._fundSourceViewModel = State(initialValue: FundSourceViewModel(modelContext: ModelContext(try! ModelContainer(for: FundSource.self))))
    }
    
    var filteredTransactions: [Transaction] {
        var transactions = transactionViewModel.transactions
        
        if isFilterActive {
            transactions = transactions.filter { transaction in
                var matchesFilter = true
                
                // Date filter
                matchesFilter = matchesFilter && transaction.date >= filterStartDate && transaction.date <= filterEndDate
                
                // Category filter
                if let filterCategory = selectedFilterCategory {
                    matchesFilter = matchesFilter && transaction.category == filterCategory
                }
                
                // Fund source filter
                if let filterFundSource = selectedFilterFundSource {
                    matchesFilter = matchesFilter && transaction.fundSource == filterFundSource
                }
                
                return matchesFilter
            }
        }
        
        return transactions
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // View mode selector
                viewModeSelector
                
                // Filter summary (if active)
                if isFilterActive {
                    filterSummaryView
                }
                
                // Content based on view mode
                switch viewMode {
                case .list:
                    listView
                case .calendar:
                    calendarView
                }
            }
            .navigationTitle("nav.transactionHistory".localized)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: {
                        showingFilters = true
                    }) {
                        Image(systemName: isFilterActive ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                    }
                    .accessibilityLabel("accessibility.filterTransactions".localized)
                    .accessibilityHint("accessibility.hint.filterTransactions".localized)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        editingTransaction = nil
                        showingTransactionForm = true
                    }) {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("accessibility.addTransaction".localized)
                    .accessibilityHint("accessibility.hint.addTransaction".localized)
                }
            }
            .sheet(isPresented: $showingTransactionForm) {
                TransactionFormView(editingTransaction: editingTransaction)
            }
            .sheet(isPresented: $showingFilters) {
                filterView
            }
            .onAppear {
                setupViewModels()
            }
            .errorAlert($transactionViewModel.currentError)
            .refreshable {
                transactionViewModel.fetchTransactions()
            }
            .alert("transaction.deleteConfirmation".localized, isPresented: $transactionViewModel.showingDeleteConfirmation) {
                Button("transaction.deleteButton".localized, role: .destructive) {
                    transactionViewModel.executeDeleteTransaction()
                }
                Button("transaction.cancelDelete".localized, role: .cancel) {
                    transactionViewModel.cancelDeleteTransaction()
                }
            } message: {
                Text("transaction.deleteMessage".localized)
            }
        }
    }
    
    private var viewModeSelector: some View {
        HStack(spacing: 0) {
            ForEach(ViewMode.allCases, id: \.self) { mode in
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        viewMode = mode
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: mode.icon)
                            .font(.system(size: 14))
                        Text(mode.title)
                            .font(.system(size: 14, weight: .medium))
                    }
                    .foregroundColor(viewMode == mode ? .white : .primary)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(viewMode == mode ? Color.blue : Color.clear)
                    )
                }
                .accessibilityLabel("\(mode.title)ビュー")
                .accessibilityAddTraits(viewMode == mode ? .isSelected : [])
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }
    
    private var listView: some View {
        VStack {
            // Transaction list
            List {
                ForEach(filteredTransactions, id: \.id) { transaction in
                    NavigationLink(destination: TransactionDetailView(transaction: transaction, transactionViewModel: transactionViewModel)) {
                        TransactionRowView(transaction: transaction)
                    }
                    .accessibilityLabel("accessibility.viewTransaction".localized)
                    .accessibilityHint("accessibility.hint.viewTransaction".localized)
                    .accessibilityValue("\("accessibility.value.amount".localized(with: CurrencyFormatter.shared.string(from: transaction.amount))), \("accessibility.value.category".localized(with: transaction.category?.name ?? "")), \("accessibility.value.date".localized(with: DateFormatter.shortDate(from: transaction.date)))")
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        if transactionViewModel.canDeleteTransaction(transaction) {
                            Button("action.delete".localized, role: .destructive) {
                                transactionViewModel.confirmDeleteTransaction(transaction)
                            }
                            .accessibilityLabel("accessibility.deleteTransaction".localized)
                        }
                        
                        if transactionViewModel.canEditTransaction(transaction) {
                            Button("action.edit".localized) {
                                editingTransaction = transaction
                                showingTransactionForm = true
                            }
                            .tint(.blue)
                            .accessibilityLabel("accessibility.editTransaction".localized)
                        }
                    }
                }
                .onDelete(perform: deleteTransactions)
                .accessibilityHint("accessibility.hint.deleteTransaction".localized)
            }
            .listStyle(PlainListStyle())
            
            // Empty state
            if filteredTransactions.isEmpty {
                emptyStateView
            }
        }
    }
    
    private var calendarView: some View {
        TransactionCalendarView(
            transactions: filteredTransactions,
            onDateSelected: { date in
                selectedCalendarDate = date
            },
            onTransactionTapped: { transaction in
                editingTransaction = transaction
                showingTransactionForm = true
            }
        )
    }
    
    private var filterSummaryView: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("transaction.filterActive".localized)
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
                
                Spacer()
                
                Button("action.clear".localized) {
                    clearFilters()
                }
                .font(.caption)
                .foregroundColor(ColorManager.primaryAccent)
                .accessibilityLabel("accessibility.clearFilters".localized)
            }
            
            HStack {
                Text("\(filterStartDate, style: .date) - \(filterEndDate, style: .date)")
                    .font(.caption2)
                    .foregroundColor(ColorManager.secondaryText)
                
                if let category = selectedFilterCategory {
                    Text("・\(category.name)")
                        .font(.caption2)
                        .foregroundColor(ColorManager.secondaryText)
                }
                
                if let fundSource = selectedFilterFundSource {
                    Text("・\(fundSource.name)")
                        .font(.caption2)
                        .foregroundColor(ColorManager.secondaryText)
                }
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "list.bullet.rectangle")
                .font(.system(size: 50))
                .foregroundColor(ColorManager.secondaryText)
                .accessibilityHidden(true)
            
            Text(isFilterActive ? "transaction.noFilteredTransactions".localized : "transaction.noTransactions".localized)
                .font(.headline)
                .foregroundColor(ColorManager.secondaryText)
            
            if !isFilterActive {
                Text("transaction.addTransactionHint".localized)
                    .font(.subheadline)
                    .foregroundColor(ColorManager.secondaryText)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var filterView: some View {
        NavigationView {
            Form {
                Section("filter.period".localized) {
                    DatePicker("filter.startDate".localized, selection: $filterStartDate, displayedComponents: .date)
                    DatePicker("filter.endDate".localized, selection: $filterEndDate, displayedComponents: .date)
                }
                
                Section("filter.category".localized) {
                    Picker("filter.category".localized, selection: $selectedFilterCategory) {
                        Text("filter.all".localized).tag(Category?.none)
                        ForEach(categoryViewModel.categories, id: \.id) { category in
                            HStack {
                                if let iconName = category.iconName {
                                    Image(systemName: iconName)
                                        .foregroundColor(Color(hex: category.colorHex))
                                }
                                Text(category.name)
                            }
                            .tag(Category?.some(category))
                        }
                    }
                }
                
                Section("filter.fundSource".localized) {
                    Picker("filter.fundSource".localized, selection: $selectedFilterFundSource) {
                        Text("filter.all".localized).tag(FundSource?.none)
                        ForEach(fundSourceViewModel.fundSources, id: \.id) { fundSource in
                            Text(fundSource.name).tag(FundSource?.some(fundSource))
                        }
                    }
                }
            }
            .navigationTitle("nav.filter".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.reset".localized) {
                        resetFilters()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("action.apply".localized) {
                        applyFilters()
                        showingFilters = false
                    }
                }
            }
        }
    }
    
    private func setupViewModels() {
        transactionViewModel = TransactionViewModel(modelContext: modelContext, fundSourceViewModel: fundSourceViewModel)
        categoryViewModel = CategoryViewModel(modelContext: modelContext)
        fundSourceViewModel = FundSourceViewModel(modelContext: modelContext)
    }
    
    private func deleteTransactions(offsets: IndexSet) {
        for index in offsets {
            let transaction = filteredTransactions[index]
            transactionViewModel.confirmDeleteTransaction(transaction)
        }
    }
    
    private func applyFilters() {
        isFilterActive = true
    }
    
    private func clearFilters() {
        isFilterActive = false
        resetFilters()
    }
    
    private func resetFilters() {
        selectedFilterCategory = nil
        selectedFilterFundSource = nil
        filterStartDate = Calendar.current.date(byAdding: .month, value: -1, to: Date()) ?? Date()
        filterEndDate = Date()
    }
}

#Preview {
    TransactionListView()
        .modelContainer(for: [Transaction.self, Category.self, FundSource.self])
}