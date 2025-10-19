import SwiftUI
import SwiftData

struct iPadTransactionView: View {
    @Environment(\.modelContext) private var modelContext
    
    @State private var transactionViewModel: TransactionViewModel
    @State private var categoryViewModel: CategoryViewModel
    @State private var fundSourceViewModel: FundSourceViewModel
    
    @State private var selectedTransaction: Transaction?
    @State private var showingTransactionForm = false
    @State private var editingTransaction: Transaction?
    @State private var showingFilters = false
    
    // Filter states
    @State private var selectedFilterCategory: Category?
    @State private var selectedFilterFundSource: FundSource?
    @State private var filterStartDate: Date = Calendar.current.date(byAdding: .month, value: -1, to: Date()) ?? Date()
    @State private var filterEndDate: Date = Date()
    @State private var isFilterActive = false
    
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
        NavigationSplitView {
            // Master: Transaction List
            VStack {
                // Filter summary (if active)
                if isFilterActive {
                    filterSummaryView
                }
                
                // Transaction list
                List(filteredTransactions, id: \.id, selection: $selectedTransaction) { transaction in
                    iPadTransactionRowView(transaction: transaction)
                        .tag(transaction)
                }
                .listStyle(SidebarListStyle())
                
                // Empty state
                if filteredTransactions.isEmpty {
                    emptyStateView
                }
            }
            .navigationTitle("nav.transactionHistory".localized)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: {
                        showingFilters = true
                    }) {
                        Image(systemName: isFilterActive ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                    }
                    .accessibilityLabel("accessibility.filterTransactions".localized)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        editingTransaction = nil
                        showingTransactionForm = true
                    }) {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("accessibility.addTransaction".localized)
                }
            }
            .navigationSplitViewColumnWidth(min: 300, ideal: 400, max: 500)
        } detail: {
            // Detail: Transaction Details or Form
            if let transaction = selectedTransaction {
                iPadTransactionDetailView(
                    transaction: transaction,
                    onEdit: {
                        editingTransaction = transaction
                        showingTransactionForm = true
                    },
                    onDelete: {
                        transactionViewModel.deleteTransaction(transaction)
                        selectedTransaction = nil
                    }
                )
            } else {
                ContentUnavailableView(
                    "transaction.selectTransaction".localized,
                    systemImage: "list.bullet.rectangle",
                    description: Text("transaction.selectTransactionHint".localized)
                )
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
    }
    
    // MARK: - View Components
    
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
        ContentUnavailableView(
            isFilterActive ? "transaction.noFilteredTransactions".localized : "transaction.noTransactions".localized,
            systemImage: "list.bullet.rectangle",
            description: Text(isFilterActive ? "" : "transaction.addTransactionHint".localized)
        )
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
        .frame(minWidth: 400, minHeight: 500)
    }
    
    // MARK: - Helper Methods
    
    private func setupViewModels() {
        transactionViewModel = TransactionViewModel(modelContext: modelContext, fundSourceViewModel: fundSourceViewModel)
        categoryViewModel = CategoryViewModel(modelContext: modelContext)
        fundSourceViewModel = FundSourceViewModel(modelContext: modelContext)
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

// MARK: - iPad Transaction Row View
struct iPadTransactionRowView: View {
    let transaction: Transaction
    
    var body: some View {
        HStack {
            // Category icon and color
            if let category = transaction.category {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(hex: category.colorHex))
                    .frame(width: 4, height: 40)
                
                if let iconName = category.iconName {
                    Image(systemName: iconName)
                        .foregroundColor(Color(hex: category.colorHex))
                        .frame(width: 24)
                }
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.category?.name ?? "category.uncategorized".localized)
                    .font(.headline)
                    .lineLimit(1)
                
                if let subcategory = transaction.subcategory {
                    Text(subcategory.name)
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
                
                Text(DateFormatter.shortDate(from: transaction.date))
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text(CurrencyFormatter.shared.string(from: transaction.amount))
                    .font(.headline)
                    .fontWeight(.semibold)
                
                if let fundSource = transaction.fundSource {
                    Text(fundSource.name)
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - iPad Transaction Detail View
struct iPadTransactionDetailView: View {
    let transaction: Transaction
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    @State private var showingDeleteAlert = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                HStack {
                    VStack(alignment: .leading) {
                        Text("transaction.details".localized)
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text(DateFormatter.longDate(from: transaction.date))
                            .font(.subheadline)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                    
                    Spacer()
                    
                    HStack {
                        Button("action.edit".localized) {
                            onEdit()
                        }
                        .buttonStyle(.bordered)
                        
                        Button("action.delete".localized) {
                            showingDeleteAlert = true
                        }
                        .buttonStyle(.bordered)
                        .foregroundColor(.red)
                    }
                }
                
                Divider()
                
                // Amount
                VStack(alignment: .leading, spacing: 8) {
                    Text("transaction.amount".localized)
                        .font(.headline)
                    
                    Text(CurrencyFormatter.shared.string(from: transaction.amount))
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(ColorManager.primaryAccent)
                }
                
                // Category
                if let category = transaction.category {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("transaction.category".localized)
                            .font(.headline)
                        
                        HStack {
                            if let iconName = category.iconName {
                                Image(systemName: iconName)
                                    .foregroundColor(Color(hex: category.colorHex))
                            }
                            
                            Text(category.name)
                                .font(.body)
                            
                            if let subcategory = transaction.subcategory {
                                Text("→ \(subcategory.name)")
                                    .font(.body)
                                    .foregroundColor(ColorManager.secondaryText)
                            }
                        }
                    }
                }
                
                // Fund Source
                if let fundSource = transaction.fundSource {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("transaction.fundSource".localized)
                            .font(.headline)
                        
                        Text(fundSource.name)
                            .font(.body)
                    }
                }
                
                // Note
                if let note = transaction.note, !note.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("transaction.note".localized)
                            .font(.headline)
                        
                        Text(note)
                            .font(.body)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                    }
                }
                
                // Metadata
                VStack(alignment: .leading, spacing: 8) {
                    Text("transaction.metadata".localized)
                        .font(.headline)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("transaction.createdAt".localized)
                                .foregroundColor(ColorManager.secondaryText)
                            Spacer()
                            Text(DateFormatter.longDateTime(from: transaction.createdAt))
                        }
                        
                        HStack {
                            Text("transaction.updatedAt".localized)
                                .foregroundColor(ColorManager.secondaryText)
                            Spacer()
                            Text(DateFormatter.longDateTime(from: transaction.updatedAt))
                        }
                    }
                    .font(.caption)
                }
                
                Spacer()
            }
            .padding()
        }
        .alert("transaction.deleteConfirmation".localized, isPresented: $showingDeleteAlert) {
            Button("action.cancel".localized, role: .cancel) { }
            Button("action.delete".localized, role: .destructive) {
                onDelete()
            }
        } message: {
            Text("transaction.deleteMessage".localized)
        }
    }
}

#Preview {
    iPadTransactionView()
        .modelContainer(for: [Transaction.self, Category.self, FundSource.self])
}