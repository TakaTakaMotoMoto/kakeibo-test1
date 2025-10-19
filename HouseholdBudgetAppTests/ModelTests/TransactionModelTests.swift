import XCTest
import SwiftData
@testable import HouseholdBudgetApp

@MainActor
final class TransactionModelTests: XCTestCase {
    var modelContainer: ModelContainer!
    var modelContext: ModelContext!
    
    override func setUp() async throws {
        try await super.setUp()
        
        // Create in-memory model container for testing
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        modelContainer = try ModelContainer(for: Transaction.self, Category.self, Subcategory.self, FundSource.self, UserAccount.self, configurations: config)
        modelContext = ModelContext(modelContainer)
    }
    
    override func tearDown() async throws {
        modelContainer = nil
        modelContext = nil
        try await super.tearDown()
    }
    
    // MARK: - Transaction Model Tests
    
    func testTransactionInitialization() {
        // Given
        let amount = Decimal(100.50)
        let date = Date()
        let note = "Test transaction"
        
        // When
        let transaction = Transaction(amount: amount, date: date, note: note)
        
        // Then
        XCTAssertNotNil(transaction.id)
        XCTAssertEqual(transaction.amount, amount)
        XCTAssertEqual(transaction.date, date)
        XCTAssertEqual(transaction.note, note)
        XCTAssertNotNil(transaction.createdAt)
        XCTAssertNotNil(transaction.updatedAt)
        XCTAssertNil(transaction.category)
        XCTAssertNil(transaction.subcategory)
        XCTAssertNil(transaction.fundSource)
    }
    
    func testTransactionWithRelationships() {
        // Given
        let category = Category(name: "Test Category", colorHex: "#FF0000")
        let subcategory = Subcategory(name: "Test Subcategory", category: category)
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0, currentBalance: 1000.0)
        
        modelContext.insert(category)
        modelContext.insert(subcategory)
        modelContext.insert(fundSource)
        
        // When
        let transaction = Transaction(
            amount: Decimal(100.50),
            date: Date(),
            note: "Test transaction",
            category: category,
            subcategory: subcategory,
            fundSource: fundSource
        )
        
        modelContext.insert(transaction)
        try? modelContext.save()
        
        // Then
        XCTAssertEqual(transaction.category?.name, "Test Category")
        XCTAssertEqual(transaction.subcategory?.name, "Test Subcategory")
        XCTAssertEqual(transaction.fundSource?.name, "Test Fund")
        
        // Verify relationships are bidirectional
        XCTAssertTrue(category.transactions.contains(transaction))
        XCTAssertTrue(fundSource.transactions.contains(transaction))
    }
    
    func testTransactionPersistence() {
        // Given
        let transaction = Transaction(
            amount: Decimal(250.75),
            date: Date(),
            note: "Persistence test"
        )
        
        // When
        modelContext.insert(transaction)
        try? modelContext.save()
        
        // Fetch from database
        let descriptor = FetchDescriptor<Transaction>()
        let fetchedTransactions = try? modelContext.fetch(descriptor)
        
        // Then
        XCTAssertNotNil(fetchedTransactions)
        XCTAssertEqual(fetchedTransactions?.count, 1)
        
        let fetchedTransaction = fetchedTransactions?.first
        XCTAssertEqual(fetchedTransaction?.amount, Decimal(250.75))
        XCTAssertEqual(fetchedTransaction?.note, "Persistence test")
    }
    
    func testTransactionValidation() {
        // Given
        let dataIntegrityService = DataIntegrityService()
        let category = Category(name: "Test Category", colorHex: "#FF0000")
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0, currentBalance: 1000.0)
        
        // Test valid transaction
        let validTransaction = Transaction(
            amount: Decimal(100.0),
            date: Date(),
            category: category,
            fundSource: fundSource
        )
        
        // When/Then - Valid transaction should not throw
        XCTAssertNoThrow(try dataIntegrityService.validateTransaction(validTransaction))
        
        // Test invalid amount
        let invalidAmountTransaction = Transaction(
            amount: Decimal(-50.0),
            date: Date(),
            category: category,
            fundSource: fundSource
        )
        
        XCTAssertThrowsError(try dataIntegrityService.validateTransaction(invalidAmountTransaction)) { error in
            XCTAssertEqual(error as? BudgetAppError, .invalidAmount)
        }
        
        // Test missing category
        let missingCategoryTransaction = Transaction(
            amount: Decimal(100.0),
            date: Date(),
            fundSource: fundSource
        )
        
        XCTAssertThrowsError(try dataIntegrityService.validateTransaction(missingCategoryTransaction)) { error in
            XCTAssertEqual(error as? BudgetAppError, .missingCategory)
        }
        
        // Test missing fund source
        let missingFundSourceTransaction = Transaction(
            amount: Decimal(100.0),
            date: Date(),
            category: category
        )
        
        XCTAssertThrowsError(try dataIntegrityService.validateTransaction(missingFundSourceTransaction)) { error in
            XCTAssertEqual(error as? BudgetAppError, .missingFundSource)
        }
    }
    
    func testTransactionSubcategoryValidation() {
        // Given
        let dataIntegrityService = DataIntegrityService()
        let category1 = Category(name: "Category 1", colorHex: "#FF0000")
        let category2 = Category(name: "Category 2", colorHex: "#00FF00")
        let subcategory = Subcategory(name: "Subcategory", category: category1)
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0, currentBalance: 1000.0)
        
        // Test transaction with mismatched subcategory
        let mismatchedTransaction = Transaction(
            amount: Decimal(100.0),
            date: Date(),
            category: category2, // Different category than subcategory's parent
            subcategory: subcategory,
            fundSource: fundSource
        )
        
        // When/Then
        XCTAssertThrowsError(try dataIntegrityService.validateTransaction(mismatchedTransaction)) { error in
            if case .dataIntegrityCheckFailed = error as? BudgetAppError {
                // Expected error type
            } else {
                XCTFail("Expected dataIntegrityCheckFailed error")
            }
        }
    }
    
    func testTransactionInsufficientBalance() {
        // Given
        let dataIntegrityService = DataIntegrityService()
        let category = Category(name: "Test Category", colorHex: "#FF0000")
        let fundSource = FundSource(name: "Test Fund", initialBalance: 100.0, currentBalance: 50.0)
        
        // Test transaction with amount greater than available balance
        let insufficientBalanceTransaction = Transaction(
            amount: Decimal(100.0), // More than current balance
            date: Date(),
            category: category,
            fundSource: fundSource
        )
        
        // When/Then
        XCTAssertThrowsError(try dataIntegrityService.validateTransaction(insufficientBalanceTransaction)) { error in
            XCTAssertEqual(error as? BudgetAppError, .insufficientBalance)
        }
    }
}