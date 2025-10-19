import SwiftUI

struct FundSourceFormView: View {
    @Environment(\.dismiss) private var dismiss
    let viewModel: FundSourceViewModel
    
    @State private var name: String = ""
    @State private var initialBalanceText: String = ""
    @State private var isShared: Bool = false
    @State private var showingValidationError = false
    @State private var validationErrorMessage = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("fundSource.name".localized, text: $name)
                        .textFieldStyle(.roundedBorder)
                        .font(.body)
                        .accessibilityLabel("fundSource.name".localized)
                        .accessibilityHint("accessibility.hint.formField".localized)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("fundSource.initialBalance".localized)
                            .font(.headline)
                        
                        TextField("0", text: $initialBalanceText)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.decimalPad)
                            .font(.body)
                            .accessibilityLabel("fundSource.initialBalance".localized)
                            .accessibilityHint("accessibility.hint.formField".localized)
                        
                        Text("例: 100000 (10万円)")
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                } header: {
                    Text("資金元情報")
                        .font(.body)
                } footer: {
                    Text("資金元は家計、お小遣い、銀行口座などの資金の出所を表します。")
                        .font(.caption)
                }
                
                Section {
                    Toggle("fundSource.shared".localized, isOn: $isShared)
                        .accessibilityLabel("fundSource.shared".localized)
                        .accessibilityHint("共有設定を切り替えます")
                } footer: {
                    Text("共有を有効にすると、他のユーザーとこの資金元を共有できます。")
                        .font(.caption)
                }
                
                Section {
                    Button("action.create".localized) {
                        createFundSource()
                    }
                    .frame(maxWidth: .infinity)
                    .disabled(name.isEmpty || initialBalanceText.isEmpty)
                    .accessibilityLabel("accessibility.addFundSource".localized)
                    .accessibilityHint("accessibility.hint.addCategory".localized)
                }
            }
            .navigationTitle("新しい資金元")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                    .accessibilityLabel("action.cancel".localized)
                }
            }
            .alert("入力エラー", isPresented: $showingValidationError) {
                Button("OK") { }
            } message: {
                Text(validationErrorMessage)
            }
        }
    }
    
    private func createFundSource() {
        // Validate input
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            validationErrorMessage = "資金元名を入力してください"
            showingValidationError = true
            return
        }
        
        guard let initialBalance = Decimal(string: initialBalanceText.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            validationErrorMessage = "有効な金額を入力してください"
            showingValidationError = true
            return
        }
        
        guard initialBalance >= 0 else {
            validationErrorMessage = "初期残高は0以上である必要があります"
            showingValidationError = true
            return
        }
        
        // Create fund source
        viewModel.createFundSource(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            initialBalance: initialBalance,
            isShared: isShared
        )
        
        dismiss()
    }
}

#Preview {
    FundSourceFormView(viewModel: FundSourceViewModel(modelContext: ModelContext(try! ModelContainer(for: FundSource.self))))
}