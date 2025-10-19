import SwiftUI
import SwiftData
import Foundation

/// Manages end-to-end integration testing and performance validation
@MainActor
final class IntegrationTestManager: ObservableObject {
    @Published var isRunningTests = false
    @Published var testResults: [IntegrationTestResult] = []
    @Published var performanceMetrics: PerformanceMetrics?
    
    private let modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    /// Runs comprehensive integration tests
    func runIntegrationTests() async {
        isRunningTests = true
        testResults.removeAll()
        
        let tests: [(String, () async throws -> Void)] = [
            ("End-to-End Transaction Flow", testTransactionFlow),
            ("Category Management Integration", testCategoryIntegration),
            ("Fund Source Balance Consistency", testFundSourceIntegration),
            ("Chart Data Accuracy", testChartDataIntegration),
            ("Data Persistence Integrity", testDataPersistence),
            ("Memory Usage Validation", testMemoryUsage),
            ("Large Dataset Performance", testLargeDatasetPerformance)
        ]
        
        for (testName, testFunction) in tests {
            do {
                let startTime = CFAbsoluteTimeGetCurrent()
                try await testFunction()
                let duration = CFAbsoluteTimeGetCurrent() - startTime
                
                testResults.append(IntegrationTestResult(
                    name: testName,
                    status: .passed,
                    duration: duration,
                    message: "Test completed successfully"
                ))
            } catch {
                testResults.append(IntegrationTestResult(
                    name: testName,
                    status: .failed,
                    duration: 0,
                    message: error.localizedDescription
                ))
            }
        }
        
        isRunningTests = false
    }
}   
 // MARK: - Integration Tests
    
    private func testTransactionFlow() async throws {
        // Create test category and fund source
        let category = Category(name: "Test Category", colorHex: "#FF0000")
        let subcategory = Subcategory(name: "Test Subcategory", category: category)
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000.0)
        
        modelContext.insert(category)
        modelContext.insert(subcategory)
        modelContext.insert(fundSource)
        
        // Create transaction
        let transaction = Transaction(
            amount: 50.0,
            date: Date(),
            note: "Integration test transaction",
            category: category,
            subcategory: subcategory,
            fundSource: fundSource
        )
        
        modelContext.insert(transaction)
        
        // Update fund source balance
        fundSource.currentBalance -= transaction.amount
        
        try modelContext.save()
        
        // Verify relationships and data consistency
        guard transaction.category?.id == category.id,
              transaction.subcategory?.id == subcategory.id,
              transaction.fundSource?.id == fundSource.id,
              fundSource.currentBalance == 950.0 else {
            throw IntegrationTestError.dataInconsistency
        }
    }
    
    private func testCategoryIntegration() async throws {
        let category = Category(name: "Integration Category", colorHex: "#00FF00")
        let subcategory1 = Subcategory(name: "Sub 1", category: category)
        let subcategory2 = Subcategory(name: "Sub 2", category: category)
        
        modelContext.insert(category)
        modelContext.insert(subcategory1)
        modelContext.insert(subcategory2)
        
        try modelContext.save()
        
        // Verify cascade relationships
        guard category.subcategories.count == 2 else {
            throw IntegrationTestError.relationshipError
        }
    }
    
    private func testFundSourceIntegration() async throws {
        let fundSource = FundSource(name: "Balance Test Fund", initialBalance: 500.0)
        modelContext.insert(fundSource)
        
        // Create multiple transactions
        for i in 1...5 {
            let transaction = Transaction(
                amount: Decimal(i * 10),
                date: Date(),
                fundSource: fundSource
            )
            modelContext.insert(transaction)
            fundSource.currentBalance -= transaction.amount
        }
        
        try modelContext.save()
        
        // Verify balance calculation (500 - (10+20+30+40+50) = 350)
        guard fundSource.currentBalance == 350.0 else {
            throw IntegrationTestError.balanceCalculationError
        }
    }    pr
ivate func testChartDataIntegration() async throws {
        // Create test data for chart validation
        let category = Category(name: "Chart Test Category", colorHex: "#0000FF")
        let fundSource = FundSource(name: "Chart Test Fund", initialBalance: 1000.0)
        
        modelContext.insert(category)
        modelContext.insert(fundSource)
        
        let calendar = Calendar.current
        let now = Date()
        
        // Create transactions across different months
        for monthOffset in 0..<3 {
            guard let monthDate = calendar.date(byAdding: .month, value: -monthOffset, to: now) else { continue }
            
            for day in 1...5 {
                guard let transactionDate = calendar.date(byAdding: .day, value: -day, to: monthDate) else { continue }
                
                let transaction = Transaction(
                    amount: Decimal(100 + day * 10),
                    date: transactionDate,
                    category: category,
                    fundSource: fundSource
                )
                modelContext.insert(transaction)
            }
        }
        
        try modelContext.save()
        
        // Verify data can be fetched for chart display
        let descriptor = FetchDescriptor<Transaction>(
            sortBy: [SortDescriptor(\.date, order: .reverse)]
        )
        let transactions = try modelContext.fetch(descriptor)
        
        guard transactions.count == 15 else {
            throw IntegrationTestError.chartDataError
        }
    }
    
    private func testDataPersistence() async throws {
        // Test data survives context operations
        let testCategory = Category(name: "Persistence Test", colorHex: "#FF00FF")
        modelContext.insert(testCategory)
        try modelContext.save()
        
        let categoryId = testCategory.id
        
        // Simulate app restart by creating new fetch
        let descriptor = FetchDescriptor<Category>(
            predicate: #Predicate<Category> { $0.id == categoryId }
        )
        let fetchedCategories = try modelContext.fetch(descriptor)
        
        guard let retrievedCategory = fetchedCategories.first,
              retrievedCategory.name == "Persistence Test" else {
            throw IntegrationTestError.persistenceError
        }
    }
    
    private func testMemoryUsage() async throws {
        let startMemory = getMemoryUsage()
        
        // Create and delete many objects to test memory management
        for _ in 1...100 {
            let category = Category(name: "Memory Test \(UUID())", colorHex: "#AAAAAA")
            modelContext.insert(category)
        }
        
        try modelContext.save()
        
        // Delete all test categories
        let descriptor = FetchDescriptor<Category>(
            predicate: #Predicate<Category> { $0.name.contains("Memory Test") }
        )
        let testCategories = try modelContext.fetch(descriptor)
        
        for category in testCategories {
            modelContext.delete(category)
        }
        
        try modelContext.save()
        
        let endMemory = getMemoryUsage()
        let memoryIncrease = endMemory - startMemory
        
        // Memory increase should be reasonable (less than 10MB for this test)
        guard memoryIncrease < 10_000_000 else {
            throw IntegrationTestError.memoryLeakDetected
        }
    }  
  private func testLargeDatasetPerformance() async throws {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Create large dataset
        let category = Category(name: "Performance Test Category", colorHex: "#888888")
        let fundSource = FundSource(name: "Performance Test Fund", initialBalance: 100000.0)
        
        modelContext.insert(category)
        modelContext.insert(fundSource)
        
        // Create 1000 transactions
        for i in 1...1000 {
            let transaction = Transaction(
                amount: Decimal.random(in: 1...100),
                date: Date().addingTimeInterval(TimeInterval(-i * 3600)), // Spread over time
                category: category,
                fundSource: fundSource
            )
            modelContext.insert(transaction)
            
            // Batch save every 100 transactions
            if i % 100 == 0 {
                try modelContext.save()
            }
        }
        
        try modelContext.save()
        
        let creationTime = CFAbsoluteTimeGetCurrent() - startTime
        
        // Test fetch performance
        let fetchStartTime = CFAbsoluteTimeGetCurrent()
        let descriptor = FetchDescriptor<Transaction>(
            sortBy: [SortDescriptor(\.date, order: .reverse)]
        )
        let transactions = try modelContext.fetch(descriptor)
        let fetchTime = CFAbsoluteTimeGetCurrent() - fetchStartTime
        
        // Store performance metrics
        performanceMetrics = PerformanceMetrics(
            dataCreationTime: creationTime,
            dataFetchTime: fetchTime,
            transactionCount: transactions.count,
            memoryUsage: getMemoryUsage()
        )
        
        // Performance thresholds
        guard creationTime < 5.0 else { // Should create 1000 records in under 5 seconds
            throw IntegrationTestError.performanceThresholdExceeded("Data creation too slow: \(creationTime)s")
        }
        
        guard fetchTime < 1.0 else { // Should fetch 1000 records in under 1 second
            throw IntegrationTestError.performanceThresholdExceeded("Data fetch too slow: \(fetchTime)s")
        }
        
        // Clean up large dataset
        for transaction in transactions {
            modelContext.delete(transaction)
        }
        modelContext.delete(category)
        modelContext.delete(fundSource)
        try modelContext.save()
    }
    
    private func getMemoryUsage() -> UInt64 {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size)/4
        
        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_,
                         task_flavor_t(MACH_TASK_BASIC_INFO),
                         $0,
                         &count)
            }
        }
        
        if kerr == KERN_SUCCESS {
            return info.resident_size
        } else {
            return 0
        }
    }
}// MA
RK: - Supporting Types

struct IntegrationTestResult {
    let name: String
    let status: TestStatus
    let duration: TimeInterval
    let message: String
    
    enum TestStatus {
        case passed
        case failed
        case skipped
    }
}

struct PerformanceMetrics {
    let dataCreationTime: TimeInterval
    let dataFetchTime: TimeInterval
    let transactionCount: Int
    let memoryUsage: UInt64
    
    var formattedMemoryUsage: String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useMB, .useKB]
        formatter.countStyle = .memory
        return formatter.string(fromByteCount: Int64(memoryUsage))
    }
}

enum IntegrationTestError: LocalizedError {
    case dataInconsistency
    case relationshipError
    case balanceCalculationError
    case chartDataError
    case persistenceError
    case memoryLeakDetected
    case performanceThresholdExceeded(String)
    
    var errorDescription: String? {
        switch self {
        case .dataInconsistency:
            return "Data consistency check failed"
        case .relationshipError:
            return "Relationship integrity check failed"
        case .balanceCalculationError:
            return "Fund source balance calculation error"
        case .chartDataError:
            return "Chart data validation failed"
        case .persistenceError:
            return "Data persistence validation failed"
        case .memoryLeakDetected:
            return "Memory leak detected during testing"
        case .performanceThresholdExceeded(let details):
            return "Performance threshold exceeded: \(details)"
        }
    }
}