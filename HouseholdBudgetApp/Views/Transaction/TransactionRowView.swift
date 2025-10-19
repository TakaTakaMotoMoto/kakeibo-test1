import SwiftUI

struct TransactionRowView: View {
    let transaction: Transaction
    
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
        
        return components.joined(separator: ", ")
    }
    
    private func buildAccessibilityValue() -> String {
        if let note = transaction.note, !note.isEmpty {
            return note
        }
        return ""
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