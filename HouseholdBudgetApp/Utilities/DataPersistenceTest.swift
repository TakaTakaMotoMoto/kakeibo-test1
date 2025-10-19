import Foundation
import SwiftData
import OSLog

/// Test utility for verifying data persistence and migration functionality
final class DataPersistenceTest {
    private let logger = Logger(subsystem: "com.householdbudget.app", category: "DataPersistenceTest")
    
    /// Runs comprehensive tests for data persistence and migration
    func runTests() async throws {
        logger.info("Starting data persistence tests")
        
        // Test 1: Model Container Creation
        try await testModelContainerCreation()
        
        // Test 2: Data Integrity Service
        try await testDataIntegrityService()
        
        // Test 3: Data Validation
        try await testDataValidation()
        
        // Test 4: Backup and Recovery
        try await testBackupAndRecovery()
        
        logger.info("All data persistence tests completed successfully")
    }
    
    // MARK: - Test Cases
    
    private func testModelContainerCreation() async throws {
        logger.info("Testing model container creation")
        
        let container = try DataMigrationManager.createModelContainer()
        let context = ModelContext(container)
        
        // Verify that we can create and save a simple transaction
        let category = Category(name: "Test Category", colorHex: "#FF0000", isCustom: true)
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000)
        let transaction = Transaction(
            amount: 100,
            date: Date(),
            note: "Test transaction",
            category: category,
            subcategory: nil,
            fundSource: fundSource
        )
        
        context.insert(category)
        context.insert(fundSource)
        context.insert(transaction)
        
        try context.save()
        
        // Verify data was saved
        let descriptor = FetchDescriptor<Transaction>()
        let savedTransactions = try context.fetch(descriptor)
        
        guard !savedTransactions.isEmpty else {
            throw NSError(domain: "DataPersistenceTest", code: 1001, userInfo: [
                NSLocalizedDescriptionKey: "Failed to save transaction"
            ])
        }
        
        logger.info("Model container creation test passed")
    }
    
    private func testDataIntegrityService() async throws {
        logger.info("Testing data integrity service")
        
        let container = try DataMigrationManager.createModelContainer()
        let integrityService = DataIntegrityService()
        
        // Test integrity check
        try await integrityService.performIntegrityCheck(container: container)
        
        // Test that the service tracks check dates
        guard integrityService.lastIntegrityCheckDate != nil else {
            throw NSError(domain: "DataPersistenceTest", code: 1002, userInfo: [
                NSLocalizedDescriptionKey: "Integrity check date not recorded"
            ])
        }
        
        logger.info("Data integrity service test passed")
    }
    
    private func testDataValidation() async throws {
        logger.info("Testing data validation")
        
        let integrityService = DataIntegrityService()
        
        // Test valid transaction
        let validCategory = Category(name: "Valid Category", colorHex: "#00FF00", isCustom: true)
        let validFundSource = FundSource(name: "Valid Fund", initialBalance: 1000)
        let validTransaction = Transaction(
            amount: 50,
            date: Date(),
            note: "Valid transaction",
            category: validCategory,
            subcategory: nil,
            fundSource: validFundSource
        )
        
        try integrityService.validateTransaction(validTransaction)
        
        // Test invalid transaction (no category)
        let invalidTransaction = Transaction(
            amount: 50,
            date: Date(),
            note: "Invalid transaction",
            category: nil,
            subcategory: nil,
            fundSource: validFundSource
        )
        
        do {
            try integrityService.validateTransaction(invalidTransaction)
            throw NSError(domain: "DataPersistenceTest", code: 1003, userInfo: [
                NSLocalizedDescriptionKey: "Validation should have failed for transaction without category"
            ])
        } catch BudgetAppError.missingCategory {
            // Expected error
        }
        
        // Test invalid category (empty name)
        let invalidCategory = Category(name: "", colorHex: "#FF0000", isCustom: true)
        
        do {
            try integrityService.validateCategory(invalidCategory)
            throw NSError(domain: "DataPersistenceTest", code: 1004, userInfo: [
                NSLocalizedDescriptionKey: "Validation should have failed for category with empty name"
            ])
        } catch BudgetAppError.formValidation {
            // Expected error
        }
        
        logger.info("Data validation test passed")
    }
    
    private func testBackupAndRecovery() async throws {
        logger.info("Testing backup and recovery")
        
        let container = try DataMigrationManager.createModelContainer()
        let integrityService = DataIntegrityService()
        
        // Create some test data
        let context = ModelContext(container)
        let category = Category(name: "Backup Test Category", colorHex: "#0000FF", isCustom: true)
        let fundSource = FundSource(name: "Backup Test Fund", initialBalance: 500)
        
        context.insert(category)
        context.insert(fundSource)
        try context.save()
        
        // Test backup creation
        let backupURL = try await integrityService.createBackup(container: container)
        
        // Verify backup file exists
        guard FileManager.default.fileExists(atPath: backupURL.path) else {
            throw NSError(domain: "DataPersistenceTest", code: 1005, userInfo: [
                NSLocalizedDescriptionKey: "Backup file was not created"
            ])
        }
        
        // Verify backup contains data
        let backupData = try Data(contentsOf: backupURL)
        let backupJSON = try JSONSerialization.jsonObject(with: backupData) as? [String: Any]
        
        guard let categories = backupJSON?["categories"] as? [[String: Any]],
              !categories.isEmpty else {
            throw NSError(domain: "DataPersistenceTest", code: 1006, userInfo: [
                NSLocalizedDescriptionKey: "Backup does not contain expected data"
            ])
        }
        
        // Clean up backup file
        try FileManager.default.removeItem(at: backupURL)
        
        logger.info("Backup and recovery test passed")
    }
}

// MARK: - Test Runner Extension
extension DataPersistenceTest {
    /// Convenience method to run tests and handle errors
    static func runAllTests() async {
        let test = DataPersistenceTest()
        
        do {
            try await test.runTests()
            print("✅ All data persistence tests passed")
        } catch {
            print("❌ Data persistence test failed: \(error.localizedDescription)")
        }
    }
}