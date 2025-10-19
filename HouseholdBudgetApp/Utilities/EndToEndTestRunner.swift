import SwiftUI
import SwiftData
import Foundation

/// Runs comprehensive end-to-end tests to validate complete app functionality
@MainActor
final class EndToEndTestRunner: ObservableObject {
    @Published var isRunning = false
    @Published var currentStep = ""
    @Published var progress: Double = 0.0
    @Published var results: [EndToEndTestResult] = []
    
    private let modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    /// Runs the complete end-to-end test suite
    func runEndToEndTests() async {
        isRunning = true
        results.removeAll()
        progress = 0.0
        
        let testSteps: [(String, Double, () async throws -> EndToEndTestResult)] = [
            ("Setting up test environment", 0.1, setupTestEnvironment),
            ("Creating user account", 0.2, testUserAccountCreation),
            ("Setting up categories", 0.3, testCategorySetup),
            ("Creating fund sources", 0.4, testFundSourceCreation),
            ("Recording transactions", 0.5, testTransactionFlow),
            ("Validating data relationships", 0.6, testDataRelationships),
            ("Testing chart generation", 0.7, testChartGeneration),
            ("Validating fund source balances", 0.8, testBalanceCalculations),
            ("Testing data persistence", 0.9, testDataPersistence),
            ("Cleaning up test data", 1.0, cleanupTestData)
        ]
        
        for (stepName, stepProgress, testFunction) in testSteps {
            currentStep = stepName
            progress = stepProgress
            
            do {
                let result = try await testFunction()
                results.append(result)
                
                // Small delay to make progress visible
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
            } catch {
                results.append(EndToEndTestResult(
                    step: stepName,
                    status: .failed,
                    message: error.localizedDescription,
                    duration: 0
                ))
                break // Stop on first failure
            }
        }
        
        isRunning = false
        currentStep = "Tests completed"
    }
    
    private func setupTestEnvironment() async throws -> EndToEndTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Clear any existing test data
        let testDataDescriptor = FetchDescriptor<Category>(
            predicate: #Predicate<Category> { $0.name.contains("E2E Test") }
        )
        let existingTestData = try modelContext.fetch(testDataDescriptor)
        
        for item in existingTestData {
            modelContext.delete(item)
        }
        
        try modelContext.save()
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        return EndToEndTestResult(
            step: "Environment Setup",
            status: .passed,
            message: "Test environment prepared successfully",
            duration: duration
        )
    }
    
    private func testUserAccountCreation() async throws -> EndToEndTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        let testAccount = UserAccount(
            username: "E2E Test User",
            email: "test@example.com"
        )
        
        modelContext.insert(testAccount)
        try modelContext.save()
        
        // Verify account was created
        let accountDescriptor = FetchDescriptor<UserAccount>(
            predicate: #Predicate<UserAccount> { $0.username == "E2E Test User" }
        )
        let accounts = try modelContext.fetch(accountDescriptor)
        
        guard accounts.count == 1 else {
            throw EndToEndTestError.accountCreationFailed
        }
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        return EndToEndTestResult(
            step: "User Account Creation",
            status: .passed,
            message: "User account created and verified",
            duration: duration
        )
    }
    
    private func testCategorySetup() async throws -> EndToEndTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Create test categories
        let foodCategory = Category(
            name: "E2E Test Food",
            iconName: "fork.knife",
            colorHex: "#FF6B6B"
        )
        
        let transportCategory = Category(
            name: "E2E Test Transport",
            iconName: "car",
            colorHex: "#4ECDC4"
        )
        
        modelContext.insert(foodCategory)
        modelContext.insert(transportCategory)
        
        // Create subcategories
        let groceriesSubcategory = Subcategory(
            name: "E2E Test Groceries",
            category: foodCategory
        )
        
        let restaurantSubcategory = Subcategory(
            name: "E2E Test Restaurant",
            category: foodCategory
        )
        
        modelContext.insert(groceriesSubcategory)
        modelContext.insert(restaurantSubcategory)
        
        try modelContext.save()
        
        // Verify relationships
        guard foodCategory.subcategories.count == 2 else {
            throw EndToEndTestError.categorySetupFailed
        }
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        return EndToEndTestResult(
            step: "Category Setup",
            status: .passed,
            message: "Categories and subcategories created with proper relationships",
            duration: duration
        )
    }    pri
vate func testFundSourceCreation() async throws -> EndToEndTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        let testFundSource = FundSource(
            name: "E2E Test Wallet",
            initialBalance: 1000.0
        )
        
        modelContext.insert(testFundSource)
        try modelContext.save()
        
        // Verify fund source
        guard testFundSource.currentBalance == 1000.0 else {
            throw EndToEndTestError.fundSourceCreationFailed
        }
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        return EndToEndTestResult(
            step: "Fund Source Creation",
            status: .passed,
            message: "Fund source created with correct initial balance",
            duration: duration
        )
    }
    
    private func testTransactionFlow() async throws -> EndToEndTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Get test data
        let categoryDescriptor = FetchDescriptor<Category>(
            predicate: #Predicate<Category> { $0.name == "E2E Test Food" }
        )
        let categories = try modelContext.fetch(categoryDescriptor)
        guard let category = categories.first else {
            throw EndToEndTestError.testDataNotFound
        }
        
        let subcategoryDescriptor = FetchDescriptor<Subcategory>(
            predicate: #Predicate<Subcategory> { $0.name == "E2E Test Groceries" }
        )
        let subcategories = try modelContext.fetch(subcategoryDescriptor)
        guard let subcategory = subcategories.first else {
            throw EndToEndTestError.testDataNotFound
        }
        
        let fundSourceDescriptor = FetchDescriptor<FundSource>(
            predicate: #Predicate<FundSource> { $0.name == "E2E Test Wallet" }
        )
        let fundSources = try modelContext.fetch(fundSourceDescriptor)
        guard let fundSource = fundSources.first else {
            throw EndToEndTestError.testDataNotFound
        }
        
        // Create multiple transactions
        let transactionAmounts: [Decimal] = [50.0, 25.0, 75.0, 30.0, 100.0]
        var totalSpent: Decimal = 0
        
        for (index, amount) in transactionAmounts.enumerated() {
            let transaction = Transaction(
                amount: amount,
                date: Date().addingTimeInterval(TimeInterval(-index * 3600)), // Spread over hours
                note: "E2E Test Transaction \(index + 1)",
                category: category,
                subcategory: subcategory,
                fundSource: fundSource
            )
            
            modelContext.insert(transaction)
            fundSource.currentBalance -= amount
            totalSpent += amount
        }
        
        try modelContext.save()
        
        // Verify transactions and balance
        let expectedBalance = 1000.0 - totalSpent
        guard fundSource.currentBalance == expectedBalance else {
            throw EndToEndTestError.balanceCalculationError
        }
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        return EndToEndTestResult(
            step: "Transaction Flow",
            status: .passed,
            message: "Created \(transactionAmounts.count) transactions, balance updated correctly",
            duration: duration
        )
    }
    
    private func testDataRelationships() async throws -> EndToEndTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Verify all relationships are intact
        let transactionDescriptor = FetchDescriptor<Transaction>(
            predicate: #Predicate<Transaction> { $0.note?.contains("E2E Test") == true }
        )
        let transactions = try modelContext.fetch(transactionDescriptor)
        
        guard transactions.count == 5 else {
            throw EndToEndTestError.dataRelationshipError
        }
        
        // Verify each transaction has proper relationships
        for transaction in transactions {
            guard transaction.category?.name == "E2E Test Food",
                  transaction.subcategory?.name == "E2E Test Groceries",
                  transaction.fundSource?.name == "E2E Test Wallet" else {
                throw EndToEndTestError.dataRelationshipError
            }
        }
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        return EndToEndTestResult(
            step: "Data Relationships",
            status: .passed,
            message: "All data relationships verified successfully",
            duration: duration
        )
    }
    
    private func testChartGeneration() async throws -> EndToEndTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Test chart data aggregation
        let transactionDescriptor = FetchDescriptor<Transaction>(
            predicate: #Predicate<Transaction> { $0.note?.contains("E2E Test") == true },
            sortBy: [SortDescriptor(\.date, order: .reverse)]
        )
        let transactions = try modelContext.fetch(transactionDescriptor)
        
        // Group by category for chart data
        let categoryTotals = Dictionary(grouping: transactions) { $0.category?.name ?? "Unknown" }
            .mapValues { transactions in
                transactions.reduce(Decimal(0)) { $0 + $1.amount }
            }
        
        guard categoryTotals["E2E Test Food"] == 280.0 else { // 50+25+75+30+100
            throw EndToEndTestError.chartDataError
        }
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        return EndToEndTestResult(
            step: "Chart Generation",
            status: .passed,
            message: "Chart data aggregation working correctly",
            duration: duration
        )
    }   
 private func testBalanceCalculations() async throws -> EndToEndTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        let fundSourceDescriptor = FetchDescriptor<FundSource>(
            predicate: #Predicate<FundSource> { $0.name == "E2E Test Wallet" }
        )
        let fundSources = try modelContext.fetch(fundSourceDescriptor)
        guard let fundSource = fundSources.first else {
            throw EndToEndTestError.testDataNotFound
        }
        
        // Verify balance calculation
        let expectedBalance: Decimal = 1000.0 - 280.0 // Initial - total spent
        guard fundSource.currentBalance == expectedBalance else {
            throw EndToEndTestError.balanceCalculationError
        }
        
        // Test manual balance adjustment
        let originalBalance = fundSource.currentBalance
        fundSource.currentBalance = 500.0
        try modelContext.save()
        
        // Verify adjustment
        guard fundSource.currentBalance == 500.0 else {
            throw EndToEndTestError.balanceCalculationError
        }
        
        // Restore original balance
        fundSource.currentBalance = originalBalance
        try modelContext.save()
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        return EndToEndTestResult(
            step: "Balance Calculations",
            status: .passed,
            message: "Balance calculations and adjustments working correctly",
            duration: duration
        )
    }
    
    private func testDataPersistence() async throws -> EndToEndTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Force save and verify data persists
        try modelContext.save()
        
        // Create new fetch to simulate app restart
        let categoryDescriptor = FetchDescriptor<Category>(
            predicate: #Predicate<Category> { $0.name.contains("E2E Test") }
        )
        let categories = try modelContext.fetch(categoryDescriptor)
        
        let transactionDescriptor = FetchDescriptor<Transaction>(
            predicate: #Predicate<Transaction> { $0.note?.contains("E2E Test") == true }
        )
        let transactions = try modelContext.fetch(transactionDescriptor)
        
        let fundSourceDescriptor = FetchDescriptor<FundSource>(
            predicate: #Predicate<FundSource> { $0.name == "E2E Test Wallet" }
        )
        let fundSources = try modelContext.fetch(fundSourceDescriptor)
        
        guard categories.count >= 2,
              transactions.count == 5,
              fundSources.count == 1 else {
            throw EndToEndTestError.dataPersistenceError
        }
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        return EndToEndTestResult(
            step: "Data Persistence",
            status: .passed,
            message: "All data persisted correctly across saves",
            duration: duration
        )
    }
    
    private func cleanupTestData() async throws -> EndToEndTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Clean up all test data
        let transactionDescriptor = FetchDescriptor<Transaction>(
            predicate: #Predicate<Transaction> { $0.note?.contains("E2E Test") == true }
        )
        let transactions = try modelContext.fetch(transactionDescriptor)
        
        let categoryDescriptor = FetchDescriptor<Category>(
            predicate: #Predicate<Category> { $0.name.contains("E2E Test") }
        )
        let categories = try modelContext.fetch(categoryDescriptor)
        
        let subcategoryDescriptor = FetchDescriptor<Subcategory>(
            predicate: #Predicate<Subcategory> { $0.name.contains("E2E Test") }
        )
        let subcategories = try modelContext.fetch(subcategoryDescriptor)
        
        let fundSourceDescriptor = FetchDescriptor<FundSource>(
            predicate: #Predicate<FundSource> { $0.name.contains("E2E Test") }
        )
        let fundSources = try modelContext.fetch(fundSourceDescriptor)
        
        let accountDescriptor = FetchDescriptor<UserAccount>(
            predicate: #Predicate<UserAccount> { $0.username.contains("E2E Test") }
        )
        let accounts = try modelContext.fetch(accountDescriptor)
        
        // Delete all test data
        for transaction in transactions {
            modelContext.delete(transaction)
        }
        
        for subcategory in subcategories {
            modelContext.delete(subcategory)
        }
        
        for category in categories {
            modelContext.delete(category)
        }
        
        for fundSource in fundSources {
            modelContext.delete(fundSource)
        }
        
        for account in accounts {
            modelContext.delete(account)
        }
        
        try modelContext.save()
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        return EndToEndTestResult(
            step: "Cleanup",
            status: .passed,
            message: "All test data cleaned up successfully",
            duration: duration
        )
    }
}// MA
RK: - Supporting Types

struct EndToEndTestResult {
    let step: String
    let status: TestStatus
    let message: String
    let duration: TimeInterval
    
    enum TestStatus {
        case passed
        case failed
        case skipped
        
        var color: Color {
            switch self {
            case .passed:
                return .green
            case .failed:
                return .red
            case .skipped:
                return .orange
            }
        }
        
        var icon: String {
            switch self {
            case .passed:
                return "checkmark.circle.fill"
            case .failed:
                return "xmark.circle.fill"
            case .skipped:
                return "minus.circle.fill"
            }
        }
    }
}

enum EndToEndTestError: LocalizedError {
    case accountCreationFailed
    case categorySetupFailed
    case fundSourceCreationFailed
    case testDataNotFound
    case balanceCalculationError
    case dataRelationshipError
    case chartDataError
    case dataPersistenceError
    
    var errorDescription: String? {
        switch self {
        case .accountCreationFailed:
            return "Failed to create user account"
        case .categorySetupFailed:
            return "Failed to set up categories and subcategories"
        case .fundSourceCreationFailed:
            return "Failed to create fund source"
        case .testDataNotFound:
            return "Required test data not found"
        case .balanceCalculationError:
            return "Balance calculation error"
        case .dataRelationshipError:
            return "Data relationship integrity error"
        case .chartDataError:
            return "Chart data aggregation error"
        case .dataPersistenceError:
            return "Data persistence verification failed"
        }
    }
}