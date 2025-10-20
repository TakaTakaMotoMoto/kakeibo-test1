import SwiftUI

struct TransactionDetailView: View {
    let transaction: Transaction
    @ObservedObject var transactionViewModel: TransactionViewModel
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @State private var showingEditForm = false
    @State private var showingDeleteConfirmation = false
    @State private var createdByUser: UserAccount?
    
    var body: some View {
        List {
            // Transaction Info Section
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        if let category = transaction.category,
                           let iconName = category.iconName {
                            Image(systemName: iconName)
                                .foregroundColor(Color(hex: category.colorHex))
                                .font(.title2)
                        } else {
                            Image(systemName: "questionmark.circle")
                                .foregroundColor(ColorManager.secondaryText)
                                .font(.title2)
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(transaction.category?.name ?? "category.unknown".localized)
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(ColorManager.primaryText)
                            
                            if let subcategory = transaction.subcategory {
                                Text(subcategory.name)
                                    .font(.body)
                                    .foregroundColor(ColorManager.secondaryText)
                            }
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing, spacing: 4) {
                            Text(CurrencyFormatter.shared.string(from: transaction.amount as NSDecimalNumber) ?? "¥0")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(ColorManager.primaryText)
                            
                            Text(transaction.type.localizedName)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(transaction.type == .expense ? Color.red.opacity(0.2) : Color.green.opacity(0.2))
                                .foregroundColor(transaction.type == .expense ? .red : .green)
                                .cornerRadius(4)
                        }
                    }
                }
                .padding(.vertical, 8)
            }
            
            // Details Section
            Section("transaction.details".localized) {
                DetailRowView(
                    title: "transaction.date".localized,
                    value: DateFormatter.longDate.string(from: transaction.date),
                    icon: "calendar"
                )
                
                if let fundSource = transaction.fundSource {
                    DetailRowView(
                        title: "transaction.fundSource".localized,
                        value: fundSource.name,
                        icon: "creditcard"
                    )
                }
                
                if let note = transaction.note, !note.isEmpty {
                    DetailRowView(
                        title: "transaction.note".localized,
                        value: note,
                        icon: "note.text"
                    )
                }
            }
            
            // Sharing Info Section
            if transaction.isShared {
                Section("sharing.info".localized) {
                    HStack {
                        Image(systemName: "person.2.fill")
                            .foregroundColor(.green)
                            .frame(width: 24)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("transaction.sharedTransaction".localized)
                                .font(.body)
                                .foregroundColor(ColorManager.primaryText)
                            
                            if let createdByUser = createdByUser {
                                Text("transaction.createdBy".localized(with: createdByUser.username))
                                    .font(.caption)
                                    .foregroundColor(ColorManager.secondaryText)
                            }
                        }
                        
                        Spacer()
                    }
                    .padding(.vertical, 4)
                }
            }
            
            // Metadata Section
            Section("transaction.metadata".localized) {
                DetailRowView(
                    title: "transaction.createdAt".localized,
                    value: DateFormatter.longDateTime.string(from: transaction.createdAt),
                    icon: "clock"
                )
                
                DetailRowView(
                    title: "transaction.updatedAt".localized,
                    value: DateFormatter.longDateTime.string(from: transaction.updatedAt),
                    icon: "clock.arrow.circlepath"
                )
            }
            
            // Actions Section
            if transactionViewModel.canEditTransaction(transaction) || transactionViewModel.canDeleteTransaction(transaction) {
                Section("transaction.actions".localized) {
                    if transactionViewModel.canEditTransaction(transaction) {
                        Button(action: {
                            showingEditForm = true
                        }) {
                            Label("action.edit".localized, systemImage: "pencil")
                        }
                        .accessibilityLabel("action.edit".localized)
                    }
                    
                    if transactionViewModel.canDeleteTransaction(transaction) {
                        Button(action: {
                            showingDeleteConfirmation = true
                        }) {
                            Label("action.delete".localized, systemImage: "trash")
                                .foregroundColor(.red)
                        }
                        .accessibilityLabel("action.delete".localized)
                    }
                }
            }
        }
        .navigationTitle("transaction.details".localized)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadCreatedByUser()
        }
        .sheet(isPresented: $showingEditForm) {
            TransactionFormView(editingTransaction: transaction)
        }
        .alert("transaction.deleteConfirmation".localized, isPresented: $showingDeleteConfirmation) {
            Button("action.cancel".localized, role: .cancel) { }
            Button("action.delete".localized, role: .destructive) {
                transactionViewModel.confirmDeleteTransaction(transaction)
                dismiss()
            }
        } message: {
            Text("transaction.deleteMessage".localized)
        }
    }
    
    private func loadCreatedByUser() {
        guard let createdByAccountId = transaction.createdByAccountId else { return }
        
        do {
            let descriptor = FetchDescriptor<UserAccount>(
                predicate: #Predicate<UserAccount> { account in
                    account.id == createdByAccountId
                }
            )
            
            let users = try modelContext.fetch(descriptor)
            createdByUser = users.first
        } catch {
            print("Failed to load created by user: \(error)")
        }
    }
}

struct DetailRowView: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(ColorManager.secondaryText)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
                
                Text(value)
                    .font(.body)
                    .foregroundColor(ColorManager.primaryText)
            }
            
            Spacer()
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    NavigationView {
        TransactionDetailView(
            transaction: Transaction(
                amount: 1500,
                date: Date(),
                note: "Sample transaction",
                category: nil,
                subcategory: nil,
                fundSource: nil
            ),
            transactionViewModel: TransactionViewModel(
                modelContext: PreviewContainer.shared.mainContext,
                fundSourceViewModel: FundSourceViewModel(modelContext: PreviewContainer.shared.mainContext)
            )
        )
    }
    .modelContainer(PreviewContainer.shared.container)
}