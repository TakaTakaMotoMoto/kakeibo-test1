import XCTest
import SwiftData
@testable import HouseholdBudgetApp

@MainActor
final class TransactionViewModelTests: XCTestCase {
    var modelContainer: ModelContainer!
    var modelContext: ModelContext!
    var transactionViewModel: TransactionViewModel!
    var fundSourceViewModel: FundSourceViewModel!
    var categoryViewModel: CategoryViewModel!
    var dataIntegrityService: DataIntegrityService!
    
    override func setUp() async throws {
        try await super.setUp()
        
        // Create in-memory model container for testing
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        modelContainer = try ModelContainer(for: Transaction.self, Category.self, Subcategory.self, FundSource.self, UserAccount.self, configurations: config)
        modelContext = ModelContext(modelContainer)
        
        // Initialize services and view models
        dataIntegrityService = DataIntegrityService()
        fundSourceViewModel = FundSourceViewModel(modelContext: modelContext, dataIntegrityService: dataIntegrityService)
        categoryViewModel = CategoryViewModel(modelContext: modelContext, dataIntegrityService: dataIntegrityService)
        transactionViewModel = TransactionViewModel(modelContext: modelContext, fundSourceViewModel: fundSourceViewModel, dataIntegrityService: dataIntegrityService)
        
        // Create test data
        await createTestData()
    }
    
    override func tearDown() async throws {
        modelContainer = nil
        modelContext = nil
        transactionViewModel = nil
        fundSourceViewModel = nil
        categoryViewModel = nil
        dataIntegrityService = nil
        try await super.tearDown()
    }
    
    private func createTestData() async {
        // Create test category
        let category = Category(name: "Test Category", iconName: "test.icon", colorHex: "#FF0000", isCustom: true)
        modelContext.insert(category)
        
        // Create test subcategory
        let subcategory = Subcategory(name: "Test Subcategory", category: category)
        modelContext.insert(subcategory)
        
        // Create test fund source
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0, currentBalance: 1000.0)
        modelContext.insert(fundSource)
        
        try? modelContext.save()
    }
    
    // MARK: - Form Validation Tests
    
    func testFormValidation_ValidForm() {
        // Given
        transactionViewModel.amount = "100.50"
        transactionViewModel.selectedCategory = getTestCategory()
        transactionViewModel.selectedFundSource = getTestFundSource()
        
        // Then
        XCTAssertTrue(transactionViewModel.isAmountValid)
        XCTAssertTrue(transactionViewModel.isCategorySelected)
        XCTAssertTrue(transactionViewModel.isFundSourceSelected)
        XCTAssertTrue(transactionViewModel.isFormValid)
    }
    
    func testFormValidation_InvalidAmount() {
        // Given
        transactionViewModel.amount = "invalid"
        transactionViewModel.selectedCategory = getTestCategory()
        transactionViewModel.selectedFundSource = getTestFundSource()
        
        // Then
        XCTAssertFalse(transactionViewModel.isAmountValid)
        XCTAssertFalse(transactionViewModel.isFormValid)
    }
    
    func testFormValidation_NegativeAmount() {
        // Given
        transactionViewModel.amount = "-50.00"
        transactionViewModel.selectedCategory = getTestCategory()
        transactionViewModel.selectedFundSource = getTestFundSource()
        
        // Then
        XCTAssertFalse(transactionViewModel.isAmountValid)
        XCTAssertFalse(transactionViewModel.isFormValid)
    }
    
    func testFormValidation_MissingCategory() {
        // Given
        transactionViewModel.amount = "100.50"
        transactionViewModel.selectedCategory = nil
        transactionViewModel.selectedFundSource = getTestFundSource()
        
        // Then
        XCTAssertFalse(transactionViewModel.isCategorySelected)
        XCTAssertFalse(transactionViewModel.isFormValid)
    }
    
    func testFormValidation_MissingFundSource() {
        // Given
        transactionViewModel.amount = "100.50"
        transactionViewModel.selectedCategory = getTestCategory()
        transactionViewModel.selectedFundSource = nil
        
        // Then
        XCTAssertFalse(transactionViewModel.isFundSourceSelected)
        XCTAssertFalse(transactionViewModel.isFormValid)
    }
    
    // MARK: - Transaction Creation Tests
    
    func testCreateTransaction_Success() {
        // Given
        transactionViewModel.amount = "100.50"
        transactionViewModel.selectedDate = Date()
        transactionViewModel.note = "Test transaction"
        transactionViewModel.selectedCategory = getTestCategory()
        transactionViewModel.selectedFundSource = getTestFundSource()
        
        let initialTransactionCount = transactionViewModel.transactions.count
        let initialBalance = getTestFundSource()?.currentBalance ?? 0
        
        // When
        transactionViewModel.createTransaction()
        
        // Then
        XCTAssertEqual(transactionViewModel.transactions.count, initialTransactionCount + 1)
        XCTAssertNil(transactionViewModel.currentError)
        
        // Verify transaction details
        let createdTransaction = transactionViewModel.transactions.first
        XCTAssertNotNil(createdTransaction)
        XCTAssertEqual(createdTransaction?.amount, Decimal(string: "100.50"))
        XCTAssertEqual(createdTransaction?.note, "Test transaction")
        XCTAssertEqual(createdTransaction?.category?.name, "Test Category")
        
        // Verify fund source balance was updated
        let updatedFundSource = getTestFundSource()
        XCTAssertEqual(updatedFundSource?.currentBalance, initialBalance - Decimal(string: "100.50")!)
    }
    
    func testCreateTransaction_InsufficientBalance() {
        // Given
        transactionViewModel.amount = "2000.00" // More than available balance
        transactionViewModel.selectedCategory = getTestCategory()
        transactionViewModel.selectedFundSource = getTestFundSource()
        
        let initialTransactionCount = transactionViewModel.transactions.count
        
        // When
        transactionViewModel.createTransaction()
        
        // Then
        XCTAssertEqual(transactionViewModel.transactions.count, initialTransactionCount)
        XCTAssertNotNil(transactionViewModel.currentError)
        XCTAssertEqual(transactionViewModel.currentError, .insufficientBalance)
    }
    
    // MARK: - Transaction Update Tests
    
    func testUpdateTransaction_Success() {
        // Given - Create initial transaction
        let transaction = createTestTransaction()
        transactionViewModel.loadTransaction(transaction)
        
        // Modify transaction data
        transactionViewModel.amount = "200.00"
        transactionViewModel.note = "Updated transaction"
        
        let initialBalance = getTestFundSource()?.currentBalance ?? 0
        
        // When
        transactionViewModel.updateTransaction(transaction)
        
        // Then
        XCTAssertNil(transactionViewModel.currentError)
        XCTAssertEqual(transaction.amount, Decimal(string: "200.00"))
        XCTAssertEqual(transaction.note, "Updated transaction")
        
        // Verify balance was adjusted correctly
        let updatedFundSource = getTestFundSource()
        let expectedBalance = initialBalance + Decimal(string: "100.50")! - Decimal(string: "200.00")!
        XCTAssertEqual(updatedFundSource?.currentBalance, expectedBalance)
    }
    
    // MARK: - Transaction Deletion Tests
    
    func testDeleteTransaction_Success() {
        // Given
        let transaction = createTestTransaction()
        let initialTransactionCount = transactionViewModel.transactions.count
        let initialBalance = getTestFundSource()?.currentBalance ?? 0
        
        // When
        transactionViewModel.deleteTransaction(transaction)
        
        // Then
        XCTAssertEqual(transactionViewModel.transactions.count, initialTransactionCount - 1)
        XCTAssertNil(transactionViewModel.currentError)
        
        // Verify balance was restored
        let updatedFundSource = getTestFundSource()
        XCTAssertEqual(updatedFundSource?.currentBalance, initialBalance + transaction.amount)
    }
    
    func testConfirmDeleteTransaction() {
        // Given
        let transaction = createTestTransaction()
        
        // When
        transactionViewModel.confirmDeleteTransaction(transaction)
        
        // Then
        XCTAssertTrue(transactionViewModel.showingDeleteConfirmation)
        XCTAssertEqual(transactionViewModel.transactionToDelete?.id, transaction.id)
    }
    
    func testExecuteDeleteTransaction() {
        // Given
        let transaction = createTestTransaction()
        transactionViewModel.transactionToDelete = transaction
        transactionViewModel.showingDeleteConfirmation = true
        let initialTransactionCount = transactionViewModel.transactions.count
        let initialBalance = getTestFundSource()?.currentBalance ?? 0
        
        // When
        transactionViewModel.executeDeleteTransaction()
        
        // Then
        XCTAssertEqual(transactionViewModel.transactions.count, initialTransactionCount - 1)
        XCTAssertFalse(transactionViewModel.showingDeleteConfirmation)
        XCTAssertNil(transactionViewModel.transactionToDelete)
        
        // Verify balance was restored
        let updatedFundSource = getTestFundSource()
        XCTAssertEqual(updatedFundSource?.currentBalance, initialBalance + transaction.amount)
    }
    
    func testCancelDeleteTransaction() {
        // Given
        let transaction = createTestTransaction()
        transactionViewModel.transactionToDelete = transaction
        transactionViewModel.showingDeleteConfirmation = true
        let initialTransactionCount = transactionViewModel.transactions.count
        
        // When
        transactionViewModel.cancelDeleteTransaction()
        
        // Then
        XCTAssertEqual(transactionViewModel.transactions.count, initialTransactionCount)
        XCTAssertFalse(transactionViewModel.showingDeleteConfirmation)
        XCTAssertNil(transactionViewModel.transactionToDelete)
    }
    
    // MARK: - Helper Methods
    
    private func getTestCategory() -> Category? {
        let descriptor = FetchDescriptor<Category>(predicate: #Predicate<Category> { $0.name == "Test Category" })
        return try? modelContext.fetch(descriptor).first
    }
    
    private func getTestFundSource() -> FundSource? {
        let descriptor = FetchDescriptor<FundSource>(predicate: #Predicate<FundSource> { $0.name == "Test Fund" })
        return try? modelContext.fetch(descriptor).first
    }
    
    private func createTestTransaction() -> Transaction {
        let transaction = Transaction(
            amount: Decimal(string: "100.50")!,
            date: Date(),
            note: "Test transaction",
            category: getTestCategory(),
            subcategory: nil,
            fundSource: getTestFundSource()
        )
        modelContext.insert(transaction)
        try? modelContext.save()
        transactionViewModel.fetchTransactions()
        return transaction
    }
}