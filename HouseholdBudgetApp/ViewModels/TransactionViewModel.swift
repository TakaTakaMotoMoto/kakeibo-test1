import Foundation
import SwiftData

@Observable
final class TransactionViewModel {
    private let modelContext: ModelContext
    private let fundSourceViewModel: FundSourceViewModel
    private let dataIntegrityService: DataIntegrityService
    private var userAccountViewModel: UserAccountViewModel?
    
    var transactions: [Transaction] = []
    var currentError: BudgetAppError?
    
    // Deletion confirmation
    var showingDeleteConfirmation = false
    var transactionToDelete: Transaction?
    
    // Form properties
    var amount: String = ""
    var selectedDate: Date = Date()
    var note: String = ""
    var selectedTransactionType: TransactionType = .expense
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
        self.userAccountViewModel = UserAccountViewModel(modelContext: modelContext)
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
                type: selectedTransactionType,
                category: selectedCategory,
                subcategory: selectedSubcategory,
                fundSource: fundSource,
                createdByAccountId: userAccountViewModel?.currentAccount?.id
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
            transaction.type = selectedTransactionType
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
            // Restore balance to fund source (add back the amount since it was deducted)
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
    
    func confirmDeleteTransaction(_ transaction: Transaction) {
        transactionToDelete = transaction
        showingDeleteConfirmation = true
    }
    
    func executeDeleteTransaction() {
        guard let transaction = transactionToDelete else { return }
        deleteTransaction(transaction)
        transactionToDelete = nil
        showingDeleteConfirmation = false
    }
    
    func cancelDeleteTransaction() {
        transactionToDelete = nil
        showingDeleteConfirmation = false
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
        selectedTransactionType = transaction.type
        selectedCategory = transaction.category
        selectedSubcategory = transaction.subcategory
        selectedFundSource = transaction.fundSource
    }
    
    func clearForm() {
        amount = ""
        selectedDate = Date()
        note = ""
        selectedTransactionType = .expense
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

    // MARK: - Sharing and Permission Checking
    
    /// Checks if the current user can edit the given transaction
    func canEditTransaction(_ transaction: Transaction) -> Bool {
        guard let currentUserId = userAccountViewModel?.currentAccount?.id else {
            return false
        }
        
        return transaction.canBeEditedBy(userId: currentUserId)
    }
    
    /// Checks if the current user can delete the given transaction
    func canDeleteTransaction(_ transaction: Transaction) -> Bool {
        guard let currentUserId = userAccountViewModel?.currentAccount?.id else {
            return false
        }
        
        return transaction.canBeDeletedBy(userId: currentUserId)
    }
    
    /// Gets the creator of a transaction
    func getTransactionCreator(_ transaction: Transaction) -> UserAccount? {
        guard let createdByAccountId = transaction.createdByAccountId else {
            return nil
        }
        
        return userAccountViewModel?.getAccount(by: createdByAccountId)
    }
    
    /// Gets display name for transaction creator
    func getTransactionCreatorDisplay(_ transaction: Transaction) -> String {
        guard let creator = getTransactionCreator(transaction) else {
            return "transaction.creator.unknown".localized
        }
        
        if creator.id == userAccountViewModel?.currentAccount?.id {
            return "transaction.creator.you".localized
        }
        
        return creator.username
    }
    
    /// Filters transactions based on sharing criteria
    func getSharedTransactions() -> [Transaction] {
        return transactions.filter { $0.isShared }
    }
    
    /// Gets transactions created by the current user
    func getMyTransactions() -> [Transaction] {
        guard let currentUserId = userAccountViewModel?.currentAccount?.id else {
            return []
        }
        
        return transactions.filter { $0.createdByAccountId == currentUserId }
    }
    
    /// Gets transactions created by other users (shared)
    func getOthersTransactions() -> [Transaction] {
        guard let currentUserId = userAccountViewModel?.currentAccount?.id else {
            return []
        }
        
        return transactions.filter { 
            $0.isShared && $0.createdByAccountId != currentUserId 
        }
    }
    
    /// Synchronizes transaction data for shared fund sources
    func synchronizeSharedTransactions() async {
        // This would trigger synchronization of shared transaction data
        // For now, we'll just refresh the local data
        fetchTransactions()
    }
}

// MARK: - Validation Field Enum
enum ValidationField {
    case amount
    case category
    case fundSource
}