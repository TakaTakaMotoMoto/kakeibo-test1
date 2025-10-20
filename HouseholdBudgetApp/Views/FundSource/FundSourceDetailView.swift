import SwiftUI

struct FundSourceDetailView: View {
    let fundSource: FundSource
    @ObservedObject var viewModel: FundSourceViewModel
    @Environment(\.modelContext) private var modelContext
    
    @StateObject private var userAccountViewModel: UserAccountViewModel
    @State private var showingBalanceAdjustment = false
    @State private var showingSharingDetail = false
    
    init(fundSource: FundSource, viewModel: FundSourceViewModel) {
        self.fundSource = fundSource
        self.viewModel = viewModel
        self._userAccountViewModel = StateObject(wrappedValue: UserAccountViewModel(modelContext: viewModel.modelContext))
    }
    
    var body: some View {
        List {
            // Fund Source Info Section
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text(fundSource.name)
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(ColorManager.primaryText)
                        
                        Spacer()
                        
                        if fundSource.isShared {
                            Image(systemName: "person.2.fill")
                                .foregroundColor(.green)
                                .accessibilityLabel("fundSource.shared".localized)
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("fundSource.currentBalance".localized)
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                        
                        Text(CurrencyFormatter.shared.string(from: fundSource.currentBalance as NSDecimalNumber) ?? "¥0")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(fundSource.currentBalance >= 0 ? ColorManager.primaryText : .red)
                    }
                    
                    HStack {
                        Text("fundSource.created".localized)
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                        
                        Text(DateFormatter.shortDate.string(from: fundSource.createdAt))
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                    
                    if let ownerAccount = userAccountViewModel.getAccount(by: fundSource.ownerAccountId ?? UUID()) {
                        HStack {
                            Text("fundSource.owner".localized)
                                .font(.caption)
                                .foregroundColor(ColorManager.secondaryText)
                            
                            Text(ownerAccount.username)
                                .font(.caption)
                                .foregroundColor(ColorManager.secondaryText)
                        }
                    }
                }
                .padding(.vertical, 8)
            }
            
            // Actions Section
            Section("fundSource.actions".localized) {
                Button(action: {
                    showingBalanceAdjustment = true
                }) {
                    Label("fundSource.adjustBalance".localized, systemImage: "plus.minus.circle")
                }
                .accessibilityLabel("fundSource.adjustBalance".localized)
                
                NavigationLink(destination: FundSourceSharingDetailView(
                    fundSource: fundSource,
                    userAccountViewModel: userAccountViewModel,
                    fundSourceViewModel: viewModel
                )) {
                    Label("sharing.manageSharingSettings".localized, systemImage: "person.2.circle")
                }
                .accessibilityLabel("sharing.manageSharingSettings".localized)
            }
            
            // Sharing Status Section
            if fundSource.isShared {
                Section("sharing.status".localized) {
                    SharingStatusView(
                        fundSource: fundSource,
                        userAccountViewModel: userAccountViewModel
                    )
                }
            }
            
            // Recent Transactions Section
            Section("transaction.recent".localized) {
                RecentTransactionsView(
                    fundSource: fundSource,
                    modelContext: modelContext
                )
            }
        }
        .navigationTitle(fundSource.name)
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showingBalanceAdjustment) {
            BalanceAdjustmentView(
                fundSource: fundSource,
                viewModel: viewModel
            )
        }
    }
}

struct SharingStatusView: View {
    let fundSource: FundSource
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "person.2.fill")
                    .foregroundColor(.green)
                
                Text("sharing.sharedFundSource".localized)
                    .font(.headline)
                    .foregroundColor(ColorManager.primaryText)
            }
            
            let sharedAccounts = userAccountViewModel.getSharedAccounts(for: fundSource)
            if !sharedAccounts.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("sharing.sharedWith".localized)
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                    
                    ForEach(sharedAccounts, id: \.id) { account in
                        HStack {
                            Circle()
                                .fill(Color.blue.opacity(0.2))
                                .frame(width: 24, height: 24)
                                .overlay(
                                    Text(String(account.username.prefix(1)).uppercased())
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(.blue)
                                )
                            
                            Text(account.username)
                                .font(.body)
                                .foregroundColor(ColorManager.primaryText)
                            
                            Spacer()
                            
                            // Show permission level if available
                            Text("sharing.permission.readWrite".localized)
                                .font(.caption)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.green.opacity(0.2))
                                .foregroundColor(.green)
                                .cornerRadius(4)
                        }
                    }
                }
            } else {
                Text("sharing.noActiveShares".localized)
                    .font(.body)
                    .foregroundColor(ColorManager.secondaryText)
            }
        }
    }
}

struct RecentTransactionsView: View {
    let fundSource: FundSource
    let modelContext: ModelContext
    
    @State private var recentTransactions: [Transaction] = []
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if recentTransactions.isEmpty {
                Text("transaction.noRecentTransactions".localized)
                    .font(.body)
                    .foregroundColor(ColorManager.secondaryText)
                    .italic()
            } else {
                ForEach(recentTransactions.prefix(5), id: \.id) { transaction in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(transaction.category?.name ?? "category.unknown".localized)
                                .font(.body)
                                .foregroundColor(ColorManager.primaryText)
                            
                            Text(DateFormatter.shortDate.string(from: transaction.date))
                                .font(.caption)
                                .foregroundColor(ColorManager.secondaryText)
                        }
                        
                        Spacer()
                        
                        Text(CurrencyFormatter.shared.string(from: transaction.amount as NSDecimalNumber) ?? "¥0")
                            .font(.body)
                            .fontWeight(.medium)
                            .foregroundColor(ColorManager.primaryText)
                    }
                    .padding(.vertical, 2)
                }
                
                if recentTransactions.count > 5 {
                    Text("transaction.andMore".localized(with: recentTransactions.count - 5))
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
            }
        }
        .onAppear {
            loadRecentTransactions()
        }
    }
    
    private func loadRecentTransactions() {
        do {
            let descriptor = FetchDescriptor<Transaction>(
                predicate: #Predicate<Transaction> { transaction in
                    transaction.fundSource?.id == fundSource.id
                },
                sortBy: [SortDescriptor(\.date, order: .reverse)]
            )
            
            recentTransactions = try modelContext.fetch(descriptor)
        } catch {
            print("Failed to load recent transactions: \(error)")
            recentTransactions = []
        }
    }
}

#Preview {
    NavigationView {
        FundSourceDetailView(
            fundSource: FundSource(name: "Sample Fund", initialBalance: 10000),
            viewModel: FundSourceViewModel(modelContext: PreviewContainer.shared.mainContext)
        )
    }
    .modelContainer(PreviewContainer.shared.container)
}