import SwiftUI
import SwiftData

struct FundSourceListView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: FundSourceViewModel
    @State private var showingAddFundSource = false
    @State private var showingBalanceAdjustment = false
    @State private var selectedFundSource: FundSource?
    
    init() {
        // This will be properly initialized when the view appears
        self._viewModel = State(initialValue: FundSourceViewModel(modelContext: ModelContext(try! ModelContainer(for: FundSource.self))))
    }
    
    var body: some View {
        NavigationView {
            VStack {
                if viewModel.fundSources.isEmpty {
                    ContentUnavailableView(
                        "fundSource.noFundSources".localized,
                        systemImage: "creditcard",
                        description: Text("fundSource.addFundSourceHint".localized)
                    )
                } else {
                    List {
                        // Total balance section
                        Section {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text("fundSource.totalBalance".localized)
                                        .font(.caption)
                                        .foregroundColor(ColorManager.secondaryText)
                                    Text(formatCurrency(viewModel.getTotalBalance()))
                                        .font(.title2)
                                        .fontWeight(.semibold)
                                }
                                Spacer()
                                Image(systemName: "chart.line.uptrend.xyaxis")
                                    .foregroundColor(.green)
                                    .accessibilityHidden(true)
                            }
                            .padding(.vertical, 4)
                            .accessibilityElement(children: .combine)
                            .accessibilityLabel("accessibility.value.totalExpense".localized(with: formatCurrency(viewModel.getTotalBalance())))
                        }
                        
                        // Fund sources list
                        Section("fundSource.list".localized) {
                            ForEach(viewModel.fundSources, id: \.id) { fundSource in
                                FundSourceRowView(
                                    fundSource: fundSource,
                                    onBalanceAdjust: {
                                        selectedFundSource = fundSource
                                        showingBalanceAdjustment = true
                                    }
                                )
                            }
                            .onDelete(perform: deleteFundSources)
                        }
                    }
                }
            }
            .navigationTitle("nav.fundSources".localized)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddFundSource = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("accessibility.addFundSource".localized)
                    .accessibilityHint("accessibility.hint.addCategory".localized)
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
        }
        .onAppear {
            // Initialize viewModel with the correct modelContext
            viewModel = FundSourceViewModel(modelContext: modelContext)
        }
    }
    
    private func deleteFundSources(offsets: IndexSet) {
        for index in offsets {
            let fundSource = viewModel.fundSources[index]
            viewModel.deleteFundSource(fundSource)
        }
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        return CurrencyFormatter.shared.string(from: amount)
    }
}

struct FundSourceRowView: View {
    let fundSource: FundSource
    let onBalanceAdjust: () -> Void
    
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
                        .font(.caption)
                        .fontWeight(.medium)
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
                Button("action.adjust".localized) {
                    onBalanceAdjust()
                }
                .font(.caption)
                .buttonStyle(.bordered)
                .controlSize(.small)
                .accessibilityLabel("accessibility.adjustBalance".localized)
                .accessibilityHint("accessibility.hint.adjustBalance".localized)
                
                Text("fundSource.created".localized(with: formatDate(fundSource.createdAt)))
                    .font(.caption2)
                    .foregroundColor(ColorManager.secondaryText)
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(fundSource.name), \("accessibility.value.balance".localized(with: formatCurrency(fundSource.currentBalance)))\(fundSource.isShared ? ", \("fundSource.shared".localized)" : "")")
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        return CurrencyFormatter.shared.string(from: amount)
    }
    
    private func formatDate(_ date: Date) -> String {
        return DateFormatter.shortDate(from: date)
    }
}

#Preview {
    FundSourceListView()
        .modelContainer(for: [FundSource.self, Transaction.self, UserAccount.self])
}