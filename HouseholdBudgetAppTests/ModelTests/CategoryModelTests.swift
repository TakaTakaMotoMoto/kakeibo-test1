import XCTest
import SwiftData
@testable import HouseholdBudgetApp

@MainActor
final class CategoryModelTests: XCTestCase {
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
    
    // MARK: - Category Model Tests
    
    func testCategoryInitialization() {
        // Given
        let name = "Test Category"
        let iconName = "test.icon"
        let colorHex = "#FF0000"
        let isCustom = true
        
        // When
        let category = Category(name: name, iconName: iconName, colorHex: colorHex, isCustom: isCustom)
        
        // Then
        XCTAssertNotNil(category.id)
        XCTAssertEqual(category.name, name)
        XCTAssertEqual(category.iconName, iconName)
        XCTAssertEqual(category.colorHex, colorHex)
        XCTAssertEqual(category.isCustom, isCustom)
        XCTAssertTrue(category.subcategories.isEmpty)
        XCTAssertTrue(category.transactions.isEmpty)
    }
    
    func testCategoryDefaultValues() {
        // When
        let category = Category(name: "Default Category")
        
        // Then
        XCTAssertEqual(category.name, "Default Category")
        XCTAssertNil(category.iconName)
        XCTAssertEqual(category.colorHex, "#007AFF") // Default color
        XCTAssertTrue(category.isCustom) // Default is custom
    }
    
    func testCategorySubcategoryRelationship() {
        // Given
        let category = Category(name: "Parent Category", colorHex: "#FF0000")
        modelContext.insert(category)
        
        // When
        let subcategory1 = Subcategory(name: "Subcategory 1", category: category)
        let subcategory2 = Subcategory(name: "Subcategory 2", category: category)
        
        modelContext.insert(subcategory1)
        modelContext.insert(subcategory2)
        try? modelContext.save()
        
        // Then
        XCTAssertEqual(category.subcategories.count, 2)
        XCTAssertTrue(category.subcategories.contains(subcategory1))
        XCTAssertTrue(category.subcategories.contains(subcategory2))
        
        // Verify inverse relationship
        XCTAssertEqual(subcategory1.category, category)
        XCTAssertEqual(subcategory2.category, category)
    }
    
    func testCategoryTransactionRelationship() {
        // Given
        let category = Category(name: "Test Category", colorHex: "#FF0000")
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0, currentBalance: 1000.0)
        
        modelContext.insert(category)
        modelContext.insert(fundSource)
        
        // When
        let transaction1 = Transaction(amount: Decimal(100.0), date: Date(), category: category, fundSource: fundSource)
        let transaction2 = Transaction(amount: Decimal(200.0), date: Date(), category: category, fundSource: fundSource)
        
        modelContext.insert(transaction1)
        modelContext.insert(transaction2)
        try? modelContext.save()
        
        // Then
        XCTAssertEqual(category.transactions.count, 2)
        XCTAssertTrue(category.transactions.contains(transaction1))
        XCTAssertTrue(category.transactions.contains(transaction2))
        
        // Verify inverse relationship
        XCTAssertEqual(transaction1.category, category)
        XCTAssertEqual(transaction2.category, category)
    }
    
    func testCategoryDeletion_CascadeSubcategories() {
        // Given
        let category = Category(name: "Category to Delete", colorHex: "#FF0000")
        modelContext.insert(category)
        
        let subcategory = Subcategory(name: "Subcategory", category: category)
        modelContext.insert(subcategory)
        try? modelContext.save()
        
        // Verify subcategory exists
        let subcategoryDescriptor = FetchDescriptor<Subcategory>()
        let subcategoriesBeforeDeletion = try? modelContext.fetch(subcategoryDescriptor)
        XCTAssertEqual(subcategoriesBeforeDeletion?.count, 1)
        
        // When
        modelContext.delete(category)
        try? modelContext.save()
        
        // Then - Subcategories should be deleted due to cascade rule
        let subcategoriesAfterDeletion = try? modelContext.fetch(subcategoryDescriptor)
        XCTAssertEqual(subcategoriesAfterDeletion?.count, 0)
    }
    
    func testCategoryDeletion_NullifyTransactions() {
        // Given
        let category = Category(name: "Category to Delete", colorHex: "#FF0000")
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0, currentBalance: 1000.0)
        
        modelContext.insert(category)
        modelContext.insert(fundSource)
        
        let transaction = Transaction(amount: Decimal(100.0), date: Date(), category: category, fundSource: fundSource)
        modelContext.insert(transaction)
        try? modelContext.save()
        
        // Verify transaction has category
        XCTAssertEqual(transaction.category, category)
        
        // When
        modelContext.delete(category)
        try? modelContext.save()
        
        // Then - Transaction should still exist but category should be nil
        let transactionDescriptor = FetchDescriptor<Transaction>()
        let transactionsAfterDeletion = try? modelContext.fetch(transactionDescriptor)
        XCTAssertEqual(transactionsAfterDeletion?.count, 1)
        XCTAssertNil(transactionsAfterDeletion?.first?.category)
    }
    
    func testCategoryValidation() {
        // Given
        let dataIntegrityService = DataIntegrityService()
        
        // Test valid category
        let validCategory = Category(name: "Valid Category", colorHex: "#FF0000")
        XCTAssertNoThrow(try dataIntegrityService.validateCategory(validCategory))
        
        // Test empty name
        let emptyNameCategory = Category(name: "", colorHex: "#FF0000")
        XCTAssertThrowsError(try dataIntegrityService.validateCategory(emptyNameCategory)) { error in
            XCTAssertEqual(error as? BudgetAppError, .formValidation)
        }
        
        // Test whitespace-only name
        let whitespaceNameCategory = Category(name: "   ", colorHex: "#FF0000")
        XCTAssertThrowsError(try dataIntegrityService.validateCategory(whitespaceNameCategory)) { error in
            XCTAssertEqual(error as? BudgetAppError, .formValidation)
        }
        
        // Test invalid color hex
        let invalidColorCategory = Category(name: "Invalid Color", colorHex: "invalid")
        XCTAssertThrowsError(try dataIntegrityService.validateCategory(invalidColorCategory)) { error in
            XCTAssertEqual(error as? BudgetAppError, .formValidation)
        }
        
        // Test valid 3-digit hex color
        let validShortHexCategory = Category(name: "Valid Short Hex", colorHex: "#F00")
        XCTAssertNoThrow(try dataIntegrityService.validateCategory(validShortHexCategory))
    }
    
    func testCategoryPersistence() {
        // Given
        let category = Category(name: "Persistence Test", iconName: "test.icon", colorHex: "#00FF00", isCustom: false)
        
        // When
        modelContext.insert(category)
        try? modelContext.save()
        
        // Fetch from database
        let descriptor = FetchDescriptor<Category>()
        let fetchedCategories = try? modelContext.fetch(descriptor)
        
        // Then
        XCTAssertNotNil(fetchedCategories)
        XCTAssertEqual(fetchedCategories?.count, 1)
        
        let fetchedCategory = fetchedCategories?.first
        XCTAssertEqual(fetchedCategory?.name, "Persistence Test")
        XCTAssertEqual(fetchedCategory?.iconName, "test.icon")
        XCTAssertEqual(fetchedCategory?.colorHex, "#00FF00")
        XCTAssertFalse(fetchedCategory?.isCustom ?? true)
    }
    
    // MARK: - Subcategory Model Tests
    
    func testSubcategoryInitialization() {
        // Given
        let category = Category(name: "Parent Category", colorHex: "#FF0000")
        let subcategoryName = "Test Subcategory"
        
        // When
        let subcategory = Subcategory(name: subcategoryName, category: category)
        
        // Then
        XCTAssertNotNil(subcategory.id)
        XCTAssertEqual(subcategory.name, subcategoryName)
        XCTAssertEqual(subcategory.category, category)
        XCTAssertTrue(subcategory.transactions.isEmpty)
    }
    
    func testSubcategoryValidation() {
        // Given
        let dataIntegrityService = DataIntegrityService()
        let category = Category(name: "Parent Category", colorHex: "#FF0000")
        
        // Test valid subcategory
        let validSubcategory = Subcategory(name: "Valid Subcategory", category: category)
        XCTAssertNoThrow(try dataIntegrityService.validateSubcategory(validSubcategory))
        
        // Test empty name
        let emptyNameSubcategory = Subcategory(name: "", category: category)
        XCTAssertThrowsError(try dataIntegrityService.validateSubcategory(emptyNameSubcategory)) { error in
            XCTAssertEqual(error as? BudgetAppError, .formValidation)
        }
        
        // Test missing category
        let missingCategorySubcategory = Subcategory(name: "No Category", category: nil)
        XCTAssertThrowsError(try dataIntegrityService.validateSubcategory(missingCategorySubcategory)) { error in
            XCTAssertEqual(error as? BudgetAppError, .missingCategory)
        }
    }
}