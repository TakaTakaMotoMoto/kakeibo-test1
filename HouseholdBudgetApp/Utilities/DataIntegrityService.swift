import Foundation
import SwiftData
import OSLog

/// Service for maintaining data integrity throughout the app lifecycle
final class DataIntegrityService: ObservableObject {
    private let logger = Logger(subsystem: "com.householdbudget.app", category: "DataIntegrity")
    private let migrationManager = DataMigrationManager()
    
    @Published var isPerformingIntegrityCheck = false
    @Published var lastIntegrityCheckDate: Date?
    @Published var integrityIssuesFound = 0
    
    // MARK: - Initialization
    init() {
        loadLastCheckDate()
    }
    
    // MARK: - Public Methods
    
    /// Performs a comprehensive data integrity check
    func performIntegrityCheck(container: ModelContainer) async throws {
        await MainActor.run {
            isPerformingIntegrityCheck = true
        }
        
        defer {
            Task { @MainActor in
                isPerformingIntegrityCheck = false
            }
        }
        
        do {
            try migrationManager.performDataIntegrityCheck(container: container)
            
            await MainActor.run {
                lastIntegrityCheckDate = Date()
                integrityIssuesFound = 0
                saveLastCheckDate()
            }
            
            logger.info("Data integrity check completed successfully")
        } catch {
            logger.error("Data integrity check failed: \(error.localizedDescription)")
            throw error
        }
    }
    
    /// Performs data recovery operations
    func performDataRecovery(container: ModelContainer) async throws {
        logger.info("Starting data recovery")
        
        do {
            try migrationManager.performDataRecovery(container: container)
            
            await MainActor.run {
                lastIntegrityCheckDate = Date()
                integrityIssuesFound = 0
                saveLastCheckDate()
            }
            
            logger.info("Data recovery completed successfully")
        } catch {
            logger.error("Data recovery failed: \(error.localizedDescription)")
            throw error
        }
    }
    
    /// Creates a backup of all data
    func createBackup(container: ModelContainer) async throws -> URL {
        logger.info("Creating data backup")
        
        do {
            let backupURL = try migrationManager.createBackup(container: container)
            logger.info("Backup created successfully")
            return backupURL
        } catch {
            logger.error("Backup creation failed: \(error.localizedDescription)")
            throw error
        }
    }
    
    /// Checks if an integrity check should be performed based on time elapsed
    func shouldPerformIntegrityCheck() -> Bool {
        guard let lastCheck = lastIntegrityCheckDate else {
            return true // Never performed, should check
        }
        
        let daysSinceLastCheck = Calendar.current.dateComponents([.day], from: lastCheck, to: Date()).day ?? 0
        return daysSinceLastCheck >= 7 // Check weekly
    }
    
    /// Validates a transaction before saving
    func validateTransaction(_ transaction: Transaction) throws {
        guard transaction.amount > 0 else {
            throw BudgetAppError.invalidAmount
        }
        
        guard transaction.category != nil else {
            throw BudgetAppError.missingCategory
        }
        
        guard transaction.fundSource != nil else {
            throw BudgetAppError.missingFundSource
        }
        
        // Validate subcategory belongs to category if both are set
        if let subcategory = transaction.subcategory,
           let category = transaction.category,
           subcategory.category?.id != category.id {
            throw BudgetAppError.dataIntegrityCheckFailed(
                NSError(domain: "DataIntegrity", code: 1001, userInfo: [
                    NSLocalizedDescriptionKey: "Subcategory does not belong to the selected category"
                ])
            )
        }
        
        // Validate fund source has sufficient balance
        if let fundSource = transaction.fundSource,
           fundSource.currentBalance < transaction.amount {
            throw BudgetAppError.insufficientBalance
        }
    }
    
    /// Validates a category before saving
    func validateCategory(_ category: Category) throws {
        guard !category.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw BudgetAppError.formValidation
        }
        
        // Validate color hex format
        let colorPattern = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
        let colorRegex = try NSRegularExpression(pattern: colorPattern)
        let colorRange = NSRange(location: 0, length: category.colorHex.count)
        
        if colorRegex.firstMatch(in: category.colorHex, options: [], range: colorRange) == nil {
            throw BudgetAppError.formValidation
        }
    }
    
    /// Validates a fund source before saving
    func validateFundSource(_ fundSource: FundSource) throws {
        guard !fundSource.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw BudgetAppError.formValidation
        }
        
        guard fundSource.initialBalance >= 0 else {
            throw BudgetAppError.invalidAmount
        }
    }
    
    /// Validates a subcategory before saving
    func validateSubcategory(_ subcategory: Subcategory) throws {
        guard !subcategory.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw BudgetAppError.formValidation
        }
        
        guard subcategory.category != nil else {
            throw BudgetAppError.missingCategory
        }
    }
    
    // MARK: - Private Methods
    
    private func loadLastCheckDate() {
        if let timestamp = UserDefaults.standard.object(forKey: "lastIntegrityCheckDate") as? TimeInterval {
            lastIntegrityCheckDate = Date(timeIntervalSince1970: timestamp)
        }
    }
    
    private func saveLastCheckDate() {
        if let date = lastIntegrityCheckDate {
            UserDefaults.standard.set(date.timeIntervalSince1970, forKey: "lastIntegrityCheckDate")
        }
    }
}

// MARK: - App Startup Extension
extension DataIntegrityService {
    /// Performs startup data integrity checks
    func performStartupChecks(container: ModelContainer) async {
        logger.info("Performing startup data integrity checks")
        
        do {
            // Only perform full check if needed
            if shouldPerformIntegrityCheck() {
                try await performIntegrityCheck(container: container)
            } else {
                // Perform lightweight validation
                try await performLightweightValidation(container: container)
            }
        } catch {
            logger.error("Startup integrity check failed: \(error.localizedDescription)")
            
            // Attempt recovery if integrity check fails
            do {
                try await performDataRecovery(container: container)
            } catch {
                logger.error("Data recovery also failed: \(error.localizedDescription)")
            }
        }
    }
    
    private func performLightweightValidation(container: ModelContainer) async throws {
        let context = ModelContext(container)
        
        // Quick check for basic data consistency
        let transactionDescriptor = FetchDescriptor<Transaction>()
        let transactions = try context.fetch(transactionDescriptor)
        
        var issueCount = 0
        for transaction in transactions {
            if transaction.category == nil || transaction.fundSource == nil {
                issueCount += 1
            }
        }
        
        await MainActor.run {
            integrityIssuesFound = issueCount
        }
        
        if issueCount > 0 {
            logger.warning("Found \(issueCount) data integrity issues during lightweight validation")
        }
    }
}