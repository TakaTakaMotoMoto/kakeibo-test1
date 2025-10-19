import Foundation
import SwiftData

@Observable
final class TransactionViewModel {
    private let modelContext: ModelContext
    private let fundSourceViewModel: FundSourceViewModel
    private let dataIntegrityService: DataIntegrityService
    
    var transactions: [Transaction] = []
    var currentError: BudgetAppError?
    
    // Form properties
    var amount: String = ""
    var selectedDate: Date = Date()
    var note: String = ""
    var selectedCategory: Category?
    var selectedSubcategory: Subcategory?
    var selectedFundSource: FundSource?
    
    // Validation properties
    var isAmountValid: Bool { 
        guard let decimal = Decimal(string: amount), decimal > 0 else { return false }
        return true
    }
    var isCategorySelected: Bool { selectedCategory != nil }
    var isFundSourceSelected: Bool { selectedFundSource != nil }
    var isFormValid: Bool { isAmountValid && isCategorySelected && isFundSourceSelected }
    
    init(modelContext: ModelContext, fundSourceViewModel: FundSourceViewModel, dataIntegrityService: DataIntegrityService = DataIntegrityService()) {
        self.modelContext = modelContext
        self.fundSourceViewModel = fundSourceViewModel
        self.dataIntegrityService = dataIntegrityService
        fetchTransactions()
    }
    
    // MARK: - Transaction CRUD Operations
    
    func createTransaction() {
        do {
            try validateForm()
            
            guard let amountDecimal = Decimal(string: amount) else {
                throw BudgetAppError.invalidAmountValue
            }
            
            guard let fundSource = selectedFundSource else {
                throw BudgetAppError.missingFundSource
            }
            
            // Check if fund source has sufficient balance
            if fundSource.currentBalance < amountDecimal {
                throw BudgetAppError.insufficientBalance
            }
            
            let transaction = Transaction(
                amount: amountDecimal,
                date: selectedDate,
                note: note.isEmpty ? nil : note,
                category: selectedCategory,
                subcategory: selectedSubcategory,
                fundSource: fundSource
            )
            
            // Validate transaction using data integrity service
            try dataIntegrityService.validateTransaction(transaction)
            
            modelContext.insert(transaction)
            
            try modelContext.save()
            
            // Update fund source balance
            fundSourceViewModel.updateBalance(for: fundSource, amount: amountDecimal)
            
            fetchTransactions()
            clearForm()
            
        } catch let budgetError as BudgetAppError {
            currentError = budgetError
        } catch {
            currentError = BudgetAppError.from(error, context: .transactionCreate)
        }
    }
    
    func updateTransaction(_ transaction: Transaction) {
        do {
            try validateForm()
            
            guard let amountDecimal = Decimal(string: amount) else {
                throw BudgetAppError.invalidAmountValue
            }
            
            // Calculate balance difference for fund source update
            let oldAmount = transaction.amount
            let oldFundSource = transaction.fundSource
            let newFundSource = selectedFundSource
            
            transaction.amount = amountDecimal
            transaction.date = selectedDate
            transaction.note = note.isEmpty ? nil : note
            transaction.category = selectedCategory
            transaction.subcategory = selectedSubcategory
            transaction.fundSource = newFundSource
            transaction.updatedAt = Date()
            
            // Validate updated transaction using data integrity service
            try dataIntegrityService.validateTransaction(transaction)
            
            try modelContext.save()
            
            // Update fund source balances
            if let oldFundSource = oldFundSource {
                // Restore old amount to old fund source
                fundSourceViewModel.updateBalance(for: oldFundSource, amount: -oldAmount)
            }
            
            if let newFundSource = newFundSource {
                // Deduct new amount from new fund source
                fundSourceViewModel.updateBalance(for: newFundSource, amount: amountDecimal)
            }
            
            fetchTransactions()
            clearForm()
            
        } catch let budgetError as BudgetAppError {
            currentError = budgetError
        } catch {
            currentError = BudgetAppError.from(error, context: .transactionUpdate)
        }
    }
    
    func deleteTransaction(_ transaction: Transaction) {
        do {
            // Restore balance to fund source
            if let fundSource = transaction.fundSource {
                fundSourceViewModel.updateBalance(for: fundSource, amount: -transaction.amount)
            }
            
            modelContext.delete(transaction)
            try modelContext.save()
            fetchTransactions()
            
        } catch {
            currentError = BudgetAppError.from(error, context: .transactionDelete)
        }
    }
    
    // MARK: - Data Fetching
    
    func fetchTransactions() {
        do {
            let descriptor = FetchDescriptor<Transaction>(
                sortBy: [SortDescriptor(\.date, order: .reverse)]
            )
            transactions = try modelContext.fetch(descriptor)
        } catch {
            currentError = BudgetAppError.from(error, context: .transactionFetch)
        }
    }
    
    func fetchTransactions(for period: DateInterval) {
        do {
            let descriptor = FetchDescriptor<Transaction>(
                predicate: #Predicate<Transaction> { transaction in
                    transaction.date >= period.start && transaction.date <= period.end
                },
                sortBy: [SortDescriptor(\.date, order: .reverse)]
            )
            transactions = try modelContext.fetch(descriptor)
        } catch {
            currentError = BudgetAppError.from(error, context: .transactionFetch)
        }
    }
    
    // MARK: - Form Management
    
    func loadTransaction(_ transaction: Transaction) {
        amount = transaction.amount.description
        selectedDate = transaction.date
        note = transaction.note ?? ""
        selectedCategory = transaction.category
        selectedSubcategory = transaction.subcategory
        selectedFundSource = transaction.fundSource
    }
    
    func clearForm() {
        amount = ""
        selectedDate = Date()
        note = ""
        selectedCategory = nil
        selectedSubcategory = nil
        selectedFundSource = nil
        clearError()
    }
    
    // MARK: - Category Management
    
    func updateSubcategoryOptions() {
        // Clear subcategory if it doesn't belong to selected category
        if let subcategory = selectedSubcategory,
           subcategory.category != selectedCategory {
            selectedSubcategory = nil
        }
    }
    
    func getAvailableSubcategories() -> [Subcategory] {
        return selectedCategory?.subcategories.sorted { $0.name < $1.name } ?? []
    }
    
    // MARK: - Validation
    
    private func validateForm() throws {
        if !isAmountValid {
            throw BudgetAppError.invalidAmount
        }
        if !isCategorySelected {
            throw BudgetAppError.missingCategory
        }
        if !isFundSourceSelected {
            throw BudgetAppError.missingFundSource
        }
    }
    
    func getValidationError(for field: ValidationField) -> String? {
        switch field {
        case .amount:
            return isAmountValid ? nil : BudgetAppError.invalidAmount.localizedDescription
        case .category:
            return isCategorySelected ? nil : BudgetAppError.missingCategory.localizedDescription
        case .fundSource:
            return isFundSourceSelected ? nil : BudgetAppError.missingFundSource.localizedDescription
        }
    }
    
    // MARK: - Helper Methods
    
    func clearError() {
        currentError = nil
    }
    
    func getTransactionsByCategory(_ category: Category) -> [Transaction] {
        return transactions.filter { $0.category == category }
    }
    
    func getTransactionsByFundSource(_ fundSource: FundSource) -> [Transaction] {
        return transactions.filter { $0.fundSource == fundSource }
    }
    
    func getTotalAmount() -> Decimal {
        return transactions.reduce(0) { $0 + $1.amount }
    }
}

// MARK: - Validation Field Enum
enum ValidationField {
    case amount
    case category
    case fundSource
}