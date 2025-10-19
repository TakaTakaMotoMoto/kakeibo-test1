import SwiftUI
import SwiftData

struct iPadFundSourceView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: FundSourceViewModel
    @State private var selectedFundSource: FundSource?
    @State private var showingAddFundSource = false
    @State private var showingBalanceAdjustment = false
    
    init() {
        // This will be properly initialized when the view appears
        self._viewModel = State(initialValue: FundSourceViewModel(modelContext: ModelContext(try! ModelContainer(for: FundSource.self))))
    }
    
    var body: some View {
        NavigationSplitView {
            // Master: Fund Source List
            VStack {
                // Total balance section
                if !viewModel.fundSources.isEmpty {
                    totalBalanceCard
                        .padding()
                }
                
                // Fund sources list
                List(viewModel.fundSources, id: \.id, selection: $selectedFundSource) { fundSource in
                    iPadFundSourceRowView(fundSource: fundSource)
                        .tag(fundSource)
                }
                .listStyle(SidebarListStyle())
                
                // Empty state
                if viewModel.fundSources.isEmpty {
                    ContentUnavailableView(
                        "fundSource.noFundSources".localized,
                        systemImage: "creditcard",
                        description: Text("fundSource.addFundSourceHint".localized)
                    )
                }
            }
            .navigationTitle("nav.fundSources".localized)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddFundSource = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("accessibility.addFundSource".localized)
                }
            }
            .navigationSplitViewColumnWidth(min: 300, ideal: 400, max: 500)
        } detail: {
            // Detail: Fund Source Details
            if let fundSource = selectedFundSource {
                iPadFundSourceDetailView(
                    fundSource: fundSource,
                    viewModel: viewModel,
                    onBalanceAdjust: {
                        showingBalanceAdjustment = true
                    },
                    onDelete: {
                        viewModel.deleteFundSource(fundSource)
                        selectedFundSource = nil
                    }
                )
            } else {
                ContentUnavailableView(
                    "fundSource.selectFundSource".localized,
                    systemImage: "creditcard",
                    description: Text("fundSource.selectFundSourceHint".localized)
                )
            }
        }
        .sheet(isPresented: $showingAddFundSource) {
            FundSourceFormView(viewModel: viewModel)
        }
        .sheet(isPresented: $showingBalanceAdjustment) {
            if let fundSource = selectedFundSource {
                BalanceAdjustmentView(
                    fundSource: fundSource,
                    viewModel: viewModel
                )
            }
        }
        .errorAlert($viewModel.currentError)
        .onAppear {
            // Initialize viewModel with the correct modelContext
            viewModel = FundSourceViewModel(modelContext: modelContext)
        }
    }
    
    // MARK: - View Components
    
    private var totalBalanceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("fundSource.totalBalance".localized)
                    .font(.headline)
                    .foregroundColor(ColorManager.secondaryText)
                
                Spacer()
                
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .foregroundColor(.green)
                    .accessibilityHidden(true)
            }
            
            Text(formatCurrency(viewModel.getTotalBalance()))
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(viewModel.getTotalBalance() >= 0 ? ColorManager.primaryAccent : .red)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("accessibility.value.totalExpense".localized(with: formatCurrency(viewModel.getTotalBalance())))
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        return CurrencyFormatter.shared.string(from: amount)
    }
}

// MARK: - iPad Fund Source Row View
struct iPadFundSourceRowView: View {
    let fundSource: FundSource
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(fundSource.name)
                    .font(.headline)
                
                HStack {
                    Text("fundSource.currentBalance".localized)
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                    
                    Text(formatCurrency(fundSource.currentBalance))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(fundSource.currentBalance >= 0 ? .primary : .red)
                }
                
                if fundSource.isShared {
                    Label("fundSource.shared".localized, systemImage: "person.2")
                        .font(.caption2)
                        .foregroundColor(ColorManager.primaryAccent)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(formatCurrency(fundSource.currentBalance))
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(fundSource.currentBalance >= 0 ? ColorManager.primaryAccent : .red)
                
                Text("fundSource.created".localized(with: formatDate(fundSource.createdAt)))
                    .font(.caption2)
                    .foregroundColor(ColorManager.secondaryText)
            }
        }
        .padding(.vertical, 4)
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        return CurrencyFormatter.shared.string(from: amount)
    }
    
    private func formatDate(_ date: Date) -> String {
        return DateFormatter.shortDate(from: date)
    }
}

// MARK: - iPad Fund Source Detail View
struct iPadFundSourceDetailView: View {
    let fundSource: FundSource
    let viewModel: FundSourceViewModel
    let onBalanceAdjust: () -> Void
    let onDelete: () -> Void
    
    @Environment(\.modelContext) private var modelContext
    @State private var recentTransactions: [Transaction] = []
    @State private var showingDeleteAlert = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                HStack {
                    VStack(alignment: .leading) {
                        Text(fundSource.name)
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("fundSource.created".localized(with: DateFormatter.longDate(from: fundSource.createdAt)))
                            .font(.subheadline)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                    
                    Spacer()
                    
                    HStack {
                        Button("action.adjust".localized) {
                            onBalanceAdjust()
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
                
                // Balance Information
                VStack(alignment: .leading, spacing: 16) {
                    Text("fundSource.balanceInfo".localized)
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("fundSource.currentBalance".localized)
                                .font(.headline)
                            
                            Text(formatCurrency(fundSource.currentBalance))
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(fundSource.currentBalance >= 0 ? ColorManager.primaryAccent : .red)
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                        
                        Spacer()
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("fundSource.initialBalance".localized)
                                .font(.headline)
                            
                            Text(formatCurrency(fundSource.initialBalance))
                                .font(.title3)
                                .fontWeight(.medium)
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                    
                    // Balance change
                    let balanceChange = fundSource.currentBalance - fundSource.initialBalance
                    HStack {
                        Text("fundSource.balanceChange".localized)
                            .font(.subheadline)
                            .foregroundColor(ColorManager.secondaryText)
                        
                        Spacer()
                        
                        HStack {
                            Image(systemName: balanceChange >= 0 ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                                .foregroundColor(balanceChange >= 0 ? .green : .red)
                            
                            Text(formatCurrency(abs(balanceChange)))
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(balanceChange >= 0 ? .green : .red)
                        }
                    }
                }
                
                // Sharing Status
                VStack(alignment: .leading, spacing: 8) {
                    Text("fundSource.sharingStatus".localized)
                        .font(.title3)
                        .fontWeight(.semibold)
                    
                    HStack {
                        Image(systemName: fundSource.isShared ? "person.2.fill" : "person.fill")
                            .foregroundColor(fundSource.isShared ? ColorManager.primaryAccent : ColorManager.secondaryText)
                        
                        Text(fundSource.isShared ? "fundSource.shared".localized : "fundSource.private".localized)
                            .font(.body)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
                
                // Recent Transactions
                VStack(alignment: .leading, spacing: 12) {
                    Text("fundSource.recentTransactions".localized)
                        .font(.title3)
                        .fontWeight(.semibold)
                    
                    if recentTransactions.isEmpty {
                        Text("fundSource.noRecentTransactions".localized)
                            .font(.body)
                            .foregroundColor(ColorManager.secondaryText)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                    } else {
                        LazyVStack(spacing: 8) {
                            ForEach(recentTransactions.prefix(5), id: \.id) { transaction in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(transaction.category?.name ?? "category.uncategorized".localized)
                                            .font(.subheadline)
                                            .fontWeight(.medium)
                                        
                                        Text(DateFormatter.shortDate(from: transaction.date))
                                            .font(.caption)
                                            .foregroundColor(ColorManager.secondaryText)
                                    }
                                    
                                    Spacer()
                                    
                                    Text(formatCurrency(transaction.amount))
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                }
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(8)
                            }
                        }
                    }
                }
                
                Spacer()
            }
            .padding()
        }
        .alert("fundSource.deleteConfirmation".localized, isPresented: $showingDeleteAlert) {
            Button("action.cancel".localized, role: .cancel) { }
            Button("action.delete".localized, role: .destructive) {
                onDelete()
            }
        } message: {
            Text("fundSource.deleteMessage".localized)
        }
        .onAppear {
            loadRecentTransactions()
        }
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        return CurrencyFormatter.shared.string(from: amount)
    }
    
    private func loadRecentTransactions() {
        Task {
            do {
                let descriptor = FetchDescriptor<Transaction>(
                    predicate: #Predicate<Transaction> { transaction in
                        transaction.fundSource?.id == fundSource.id
                    },
                    sortBy: [SortDescriptor(\.date, order: .reverse)]
                )
                descriptor.fetchLimit = 10
                
                let transactions = try modelContext.fetch(descriptor)
                await MainActor.run {
                    self.recentTransactions = transactions
                }
            } catch {
                print("Failed to load recent transactions: \(error)")
            }
        }
    }
}

#Preview {
    iPadFundSourceView()
        .modelContainer(for: [FundSource.self, Transaction.self, UserAccount.self])
}