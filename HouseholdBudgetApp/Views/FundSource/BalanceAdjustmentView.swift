import SwiftUI

struct BalanceAdjustmentView: View {
    @Environment(\.dismiss) private var dismiss
    let fundSource: FundSource
    let viewModel: FundSourceViewModel
    
    @State private var newBalanceText: String
    @State private var showingValidationError = false
    @State private var validationErrorMessage = ""
    
    init(fundSource: FundSource, viewModel: FundSourceViewModel) {
        self.fundSource = fundSource
        self.viewModel = viewModel
        self._newBalanceText = State(initialValue: String(describing: fundSource.currentBalance))
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("資金元")
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                        Text(fundSource.name)
                            .font(.headline)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("現在の残高")
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                        Text(formatCurrency(fundSource.currentBalance))
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(fundSource.currentBalance >= 0 ? .primary : .red)
                    }
                } header: {
                    Text("現在の状況")
                }
                
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("新しい残高")
                            .font(.headline)
                        
                        TextField("残高", text: $newBalanceText)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.decimalPad)
                        
                        if let newBalance = Decimal(string: newBalanceText.trimmingCharacters(in: .whitespacesAndNewlines)) {
                            let difference = newBalance - fundSource.currentBalance
                            HStack {
                                Text("変更額:")
                                    .font(.caption)
                                    .foregroundColor(ColorManager.secondaryText)
                                Text(formatCurrency(difference))
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(difference >= 0 ? .green : .red)
                            }
                        }
                    }
                } header: {
                    Text("残高調整")
                } footer: {
                    Text("手動で残高を調整します。取引履歴には反映されません。")
                }
                
                Section {
                    Button("残高を調整") {
                        adjustBalance()
                    }
                    .frame(maxWidth: .infinity)
                    .disabled(newBalanceText.isEmpty)
                }
            }
            .navigationTitle("残高調整")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("キャンセル") {
                        dismiss()
                    }
                }
            }
            .alert("入力エラー", isPresented: $showingValidationError) {
                Button("OK") { }
            } message: {
                Text(validationErrorMessage)
            }
        }
    }
    
    private func adjustBalance() {
        guard let newBalance = Decimal(string: newBalanceText.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            validationErrorMessage = "有効な金額を入力してください"
            showingValidationError = true
            return
        }
        
        viewModel.adjustBalance(for: fundSource, newBalance: newBalance)
        dismiss()
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale.current
        return formatter.string(from: amount as NSDecimalNumber) ?? "¥0"
    }
}

#Preview {
    let fundSource = FundSource(name: "家計", initialBalance: 100000)
    fundSource.currentBalance = 85000
    
    return BalanceAdjustmentView(
        fundSource: fundSource,
        viewModel: FundSourceViewModel(modelContext: ModelContext(try! ModelContainer(for: FundSource.self)))
    )
}