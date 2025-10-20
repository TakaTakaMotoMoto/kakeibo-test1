import XCTest
import SwiftData
@testable import HouseholdBudgetApp

@MainActor
final class FundSourceViewModelTests: XCTestCase {
    var modelContainer: ModelContainer!
    var modelContext: ModelContext!
    var fundSourceViewModel: FundSourceViewModel!
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
    }
    
    override func tearDown() async throws {
        modelContainer = nil
        modelContext = nil
        fundSourceViewModel = nil
        dataIntegrityService = nil
        try await super.tearDown()
    }
    
    // MARK: - Fund Source Deletion Tests
    
    func testCanDeleteFundSource_WithoutTransactions() {
        // Given
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0)
        modelContext.insert(fundSource)
        try? modelContext.save()
        
        // When
        let canDelete = fundSourceViewModel.canDeleteFundSource(fundSource)
        
        // Then
        XCTAssertTrue(canDelete)
    }
    
    func testCanDeleteFundSource_WithTransactions() {
        // Given
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0)
        modelContext.insert(fundSource)
        
        let category = Category(name: "Test Category")
        modelContext.insert(category)
        
        let transaction = Transaction(amount: 100.0, date: Date(), category: category, fundSource: fundSource)
        modelContext.insert(transaction)
        
        try? modelContext.save()
        
        // When
        let canDelete = fundSourceViewModel.canDeleteFundSource(fundSource)
        
        // Then
        XCTAssertFalse(canDelete)
    }
    
    func testDeleteFundSource_Success() {
        // Given
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0)
        modelContext.insert(fundSource)
        try? modelContext.save()
        fundSourceViewModel.fetchFundSources()
        
        let initialCount = fundSourceViewModel.fundSources.count
        
        // When
        fundSourceViewModel.deleteFundSource(fundSource)
        
        // Then
        XCTAssertEqual(fundSourceViewModel.fundSources.count, initialCount - 1)
        XCTAssertNil(fundSourceViewModel.currentError)
    }
    
    func testDeleteFundSource_InUse() {
        // Given
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0)
        modelContext.insert(fundSource)
        
        let category = Category(name: "Test Category")
        modelContext.insert(category)
        
        let transaction = Transaction(amount: 100.0, date: Date(), category: category, fundSource: fundSource)
        modelContext.insert(transaction)
        
        try? modelContext.save()
        fundSourceViewModel.fetchFundSources()
        
        let initialCount = fundSourceViewModel.fundSources.count
        
        // When
        fundSourceViewModel.deleteFundSource(fundSource)
        
        // Then
        XCTAssertEqual(fundSourceViewModel.fundSources.count, initialCount)
        XCTAssertEqual(fundSourceViewModel.currentError, .fundSourceInUse)
    }
    
    func testConfirmDeleteFundSource() {
        // Given
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0)
        modelContext.insert(fundSource)
        try? modelContext.save()
        
        // When
        fundSourceViewModel.confirmDeleteFundSource(fundSource)
        
        // Then
        XCTAssertTrue(fundSourceViewModel.showingDeleteConfirmation)
        XCTAssertEqual(fundSourceViewModel.fundSourceToDelete?.id, fundSource.id)
    }
    
    func testExecuteDeleteFundSource() {
        // Given
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0)
        modelContext.insert(fundSource)
        try? modelContext.save()
        fundSourceViewModel.fetchFundSources()
        
        fundSourceViewModel.fundSourceToDelete = fundSource
        fundSourceViewModel.showingDeleteConfirmation = true
        let initialCount = fundSourceViewModel.fundSources.count
        
        // When
        fundSourceViewModel.executeDeleteFundSource()
        
        // Then
        XCTAssertEqual(fundSourceViewModel.fundSources.count, initialCount - 1)
        XCTAssertFalse(fundSourceViewModel.showingDeleteConfirmation)
        XCTAssertNil(fundSourceViewModel.fundSourceToDelete)
    }
    
    func testCancelDeleteFundSource() {
        // Given
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0)
        modelContext.insert(fundSource)
        try? modelContext.save()
        fundSourceViewModel.fetchFundSources()
        
        fundSourceViewModel.fundSourceToDelete = fundSource
        fundSourceViewModel.showingDeleteConfirmation = true
        let initialCount = fundSourceViewModel.fundSources.count
        
        // When
        fundSourceViewModel.cancelDeleteFundSource()
        
        // Then
        XCTAssertEqual(fundSourceViewModel.fundSources.count, initialCount)
        XCTAssertFalse(fundSourceViewModel.showingDeleteConfirmation)
        XCTAssertNil(fundSourceViewModel.fundSourceToDelete)
    }
}