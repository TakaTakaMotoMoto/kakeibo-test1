import SwiftUI
import SwiftData

struct TransactionFormView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @State private var transactionViewModel: TransactionViewModel
    @State private var categoryViewModel: CategoryViewModel
    @State private var fundSourceViewModel: FundSourceViewModel
    
    private let editingTransaction: Transaction?
    
    init(editingTransaction: Transaction? = nil) {
        self.editingTransaction = editingTransaction
        
        // These will be properly initialized in the initializer
        self._transactionViewModel = State(initialValue: TransactionViewModel(modelContext: ModelContext(try! ModelContainer(for: Transaction.self)), fundSourceViewModel: FundSourceViewModel(modelContext: ModelContext(try! ModelContainer(for: FundSource.self)))))
        self._categoryViewModel = State(initialValue: CategoryViewModel(modelContext: ModelContext(try! ModelContainer(for: Category.self))))
        self._fundSourceViewModel = State(initialValue: FundSourceViewModel(modelContext: ModelContext(try! ModelContainer(for: FundSource.self))))
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("transaction.info".localized) {
                    // Amount field
                    HStack {
                        Text("transaction.amount".localized)
                            .font(.body)
                        Spacer()
                        TextField("0", text: $transactionViewModel.amount)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .foregroundColor(transactionViewModel.isAmountValid ? ColorManager.primaryText : ColorManager.errorColor)
                            .font(.body)
                            .accessibilityLabel("accessibility.enterAmount".localized)
                            .accessibilityHint("accessibility.hint.formField".localized)
                            .accessibilityValue(transactionViewModel.amount.isEmpty ? "accessibility.value.notSelected".localized : "accessibility.value.amount".localized(with: transactionViewModel.amount))
                    }
                    .formFieldValidation(
                        isValid: transactionViewModel.isAmountValid,
                        errorMessage: transactionViewModel.getValidationError(for: .amount)
                    )
                    
                    // Date picker
                    DatePicker("transaction.date".localized, selection: $transactionViewModel.selectedDate, displayedComponents: .date)
                        .font(.body)
                        .accessibilityLabel("accessibility.selectDate".localized)
                        .accessibilityValue("accessibility.value.date".localized(with: DateFormatter.shortDate(from: transactionViewModel.selectedDate)))
                    
                    // Note field
                    TextField("transaction.note".localized, text: $transactionViewModel.note)
                        .font(.body)
                        .accessibilityLabel("accessibility.enterNote".localized)
                        .accessibilityHint("accessibility.hint.formField".localized)
                }
                
                Section("transaction.category".localized) {
                    // Category picker
                    Picker("transaction.category".localized, selection: $transactionViewModel.selectedCategory) {
                        Text("transaction.selectPlaceholder".localized).tag(Category?.none)
                        ForEach(categoryViewModel.categories, id: \.id) { category in
                            HStack {
                                if let iconName = category.iconName {
                                    Image(systemName: iconName)
                                        .foregroundColor(Color(hex: category.colorHex))
                                }
                                Text(category.name)
                                    .font(.body)
                            }
                            .tag(Category?.some(category))
                        }
                    }
                    .foregroundColor(transactionViewModel.isCategorySelected ? ColorManager.primaryText : ColorManager.errorColor)
                    .accessibilityLabel("accessibility.selectCategory".localized)
                    .accessibilityValue(transactionViewModel.selectedCategory?.name ?? "accessibility.value.notSelected".localized)
                    .inlineError(transactionViewModel.getValidationError(for: .category))
                    
                    // Subcategory picker (only shown if category is selected and has subcategories)
                    if let selectedCategory = transactionViewModel.selectedCategory,
                       !selectedCategory.subcategories.isEmpty {
                        Picker("transaction.subcategory".localized, selection: $transactionViewModel.selectedSubcategory) {
                            Text("transaction.selectPlaceholder".localized).tag(Subcategory?.none)
                            ForEach(transactionViewModel.getAvailableSubcategories(), id: \.id) { subcategory in
                                Text(subcategory.name)
                                    .font(.body)
                                    .tag(Subcategory?.some(subcategory))
                            }
                        }
                        .accessibilityLabel("accessibility.selectSubcategory".localized)
                        .accessibilityValue(transactionViewModel.selectedSubcategory?.name ?? "accessibility.value.notSelected".localized)
                    }
                }
                
                Section("transaction.fundSource".localized) {
                    Picker("transaction.fundSource".localized, selection: $transactionViewModel.selectedFundSource) {
                        Text("transaction.selectPlaceholder".localized).tag(FundSource?.none)
                        ForEach(fundSourceViewModel.fundSources, id: \.id) { fundSource in
                            VStack(alignment: .leading) {
                                Text(fundSource.name)
                                    .font(.body)
                                Text("transaction.balance".localized(with: CurrencyFormatter.shared.string(from: fundSource.currentBalance)))
                                    .font(.caption)
                                    .foregroundColor(ColorManager.secondaryText)
                            }
                            .tag(FundSource?.some(fundSource))
                        }
                    }
                    .foregroundColor(transactionViewModel.isFundSourceSelected ? ColorManager.primaryText : ColorManager.errorColor)
                    .accessibilityLabel("accessibility.selectFundSource".localized)
                    .accessibilityValue(transactionViewModel.selectedFundSource?.name ?? "accessibility.value.notSelected".localized)
                    .inlineError(transactionViewModel.getValidationError(for: .fundSource))
                }
                

            }
            .navigationTitle(editingTransaction == nil ? "nav.newTransaction".localized : "nav.editTransaction".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                    .accessibilityLabel("action.cancel".localized)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(editingTransaction == nil ? "action.create".localized : "action.update".localized) {
                        if editingTransaction == nil {
                            transactionViewModel.createTransaction()
                        } else if let transaction = editingTransaction {
                            transactionViewModel.updateTransaction(transaction)
                        }
                        
                        if transactionViewModel.currentError == nil {
                            dismiss()
                        }
                    }
                    .disabled(!transactionViewModel.isFormValid)
                    .accessibilityLabel(editingTransaction == nil ? "accessibility.addTransaction".localized : "accessibility.editTransaction".localized)
                    .accessibilityHint(editingTransaction == nil ? "accessibility.hint.addTransaction".localized : "accessibility.hint.editTransaction".localized)
                }
            }
        }
        .onAppear {
            setupViewModels()
            if let transaction = editingTransaction {
                transactionViewModel.loadTransaction(transaction)
            }
        }
        .onChange(of: transactionViewModel.selectedCategory) { _, _ in
            transactionViewModel.updateSubcategoryOptions()
        }
        .errorAlert($transactionViewModel.currentError)
    }
    
    private func setupViewModels() {
        transactionViewModel = TransactionViewModel(modelContext: modelContext, fundSourceViewModel: fundSourceViewModel)
        categoryViewModel = CategoryViewModel(modelContext: modelContext)
        fundSourceViewModel = FundSourceViewModel(modelContext: modelContext)
    }
}



#Preview {
    TransactionFormView()
        .modelContainer(for: [Transaction.self, Category.self, FundSource.self])
}