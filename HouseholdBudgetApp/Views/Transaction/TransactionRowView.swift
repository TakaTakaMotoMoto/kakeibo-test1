import SwiftUI

struct TransactionRowView: View {
    let transaction: Transaction
    @Environment(\.modelContext) private var modelContext
    @State private var createdByUser: UserAccount?
    
    var body: some View {
        HStack {
            // Category icon and color
            VStack {
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
            }
            .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 4) {
                // Category and subcategory
                HStack {
                    Text(transaction.category?.name ?? "未分類")
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    if let subcategory = transaction.subcategory {
                        Text("・\(subcategory.name)")
                            .font(.subheadline)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                }
                
                // Date and fund source
                HStack {
                    Text(transaction.date, style: .date)
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                    
                    if let fundSource = transaction.fundSource {
                        Text("・\(fundSource.name)")
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                    
                    // Show shared indicator and creator
                    if transaction.isShared {
                        Text("・")
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                        
                        Image(systemName: "person.2.fill")
                            .font(.caption)
                            .foregroundColor(.green)
                        
                        if let createdByUser = createdByUser {
                            Text(createdByUser.username)
                                .font(.caption)
                                .foregroundColor(.green)
                        } else {
                            Text("transaction.sharedTransaction".localized)
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                    }
                }
                
                // Note (if exists)
                if let note = transaction.note, !note.isEmpty {
                    Text(note)
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                        .lineLimit(2)
                }
            }
            
            Spacer()
            
            // Amount
            VStack(alignment: .trailing) {
                Text("¥\(transaction.amount.formatted())")
                    .font(.headline)
                    .foregroundColor(ColorManager.primaryText)
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(buildAccessibilityLabel())
        .accessibilityValue(buildAccessibilityValue())
        .onAppear {
            loadCreatedByUser()
        }
    }
    
    private func buildAccessibilityLabel() -> String {
        var components: [String] = []
        
        if let category = transaction.category {
            components.append("accessibility.value.category".localized(with: category.name))
        }
        
        if let subcategory = transaction.subcategory {
            components.append("accessibility.value.subcategory".localized(with: subcategory.name))
        }
        
        components.append("accessibility.value.amount".localized(with: CurrencyFormatter.shared.string(from: transaction.amount)))
        components.append("accessibility.value.date".localized(with: DateFormatter.shortDate(from: transaction.date)))
        
        if let fundSource = transaction.fundSource {
            components.append("accessibility.value.fundSource".localized(with: fundSource.name))
        }
        
        if transaction.isShared {
            if let createdByUser = createdByUser {
                components.append("transaction.createdBy".localized(with: createdByUser.username))
            } else {
                components.append("transaction.sharedTransaction".localized)
            }
        }
        
        return components.joined(separator: ", ")
    }
    
    private func buildAccessibilityValue() -> String {
        if let note = transaction.note, !note.isEmpty {
            return note
        }
        return ""
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

#Preview {
    let sampleTransaction = Transaction(
        amount: 1500,
        date: Date(),
        note: "ランチ代",
        category: nil,
        subcategory: nil,
        fundSource: nil
    )
    
    return TransactionRowView(transaction: sampleTransaction)
        .padding()
}