import Foundation
import SwiftData
import OSLog

/// Manages data migration and versioning for the household budget app
final class DataMigrationManager {
    private let logger = Logger(subsystem: "com.householdbudget.app", category: "DataMigration")
    
    // MARK: - Schema Versions
    enum SchemaVersion: Int, CaseIterable {
        case v1 = 1
        case v2 = 2
        // Add new versions here as needed
        
        static var current: SchemaVersion {
            return allCases.last ?? .v1
        }
    }
    
    // MARK: - Migration Plans
    static let migrationPlan = SchemaMigrationPlan([
        // Example migration stages for future schema changes
        // migrateV1toV2,
        // migrateV2toV3
    ])
    
    // MARK: - Example Migration Stages (for future use)
    /*
    static let migrateV1toV2 = SchemaMigrationPlan.Stage(
        "AddUserAccountFields",
        from: SchemaV1.self,
        to: SchemaV2.self
    ) { context in
        // Migration logic would go here
        // Example: Add new fields, transform data, etc.
        let userAccounts = try context.fetch(FetchDescriptor<UserAccount>())
        for account in userAccounts {
            // Perform migration operations
        }
    }
    */
    
    // MARK: - Model Container Creation
    static func createModelContainer() throws -> ModelContainer {
        let schema = Schema([
            Transaction.self,
            Category.self,
            Subcategory.self,
            FundSource.self,
            UserAccount.self
        ])
        
        let modelConfiguration = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false,
            allowsSave: true,
            groupContainer: .none,
            cloudKitDatabase: .none
        )
        
        do {
            let container = try ModelContainer(
                for: schema,
                migrationPlan: migrationPlan,
                configurations: [modelConfiguration]
            )
            
            // Perform data integrity check after container creation
            let migrationManager = DataMigrationManager()
            try migrationManager.performDataIntegrityCheck(container: container)
            
            return container
        } catch {
            Logger(subsystem: "com.householdbudget.app", category: "DataMigration")
                .error("Failed to create ModelContainer: \(error.localizedDescription)")
            throw BudgetAppError.migrationFailed(error)
        }
    }
    
    // MARK: - Data Integrity Checks
    func performDataIntegrityCheck(container: ModelContainer) throws {
        logger.info("Starting data integrity check")
        
        let context = ModelContext(container)
        
        do {
            // Check for orphaned transactions
            try checkOrphanedTransactions(context: context)
            
            // Check for invalid relationships
            try checkInvalidRelationships(context: context)
            
            // Check for data consistency
            try checkDataConsistency(context: context)
            
            // Verify fund source balances
            try verifyFundSourceBalances(context: context)
            
            logger.info("Data integrity check completed successfully")
        } catch {
            logger.error("Data integrity check failed: \(error.localizedDescription)")
            throw BudgetAppError.dataIntegrityCheckFailed(error)
        }
    }
    
    private func checkOrphanedTransactions(context: ModelContext) throws {
        let descriptor = FetchDescriptor<Transaction>()
        let transactions = try context.fetch(descriptor)
        
        var orphanedCount = 0
        for transaction in transactions {
            if transaction.category == nil || transaction.fundSource == nil {
                logger.warning("Found orphaned transaction: \(transaction.id)")
                orphanedCount += 1
            }
        }
        
        if orphanedCount > 0 {
            logger.info("Found \(orphanedCount) orphaned transactions")
        }
    }
    
    private func checkInvalidRelationships(context: ModelContext) throws {
        // Check category-subcategory relationships
        let subcategoryDescriptor = FetchDescriptor<Subcategory>()
        let subcategories = try context.fetch(subcategoryDescriptor)
        
        for subcategory in subcategories {
            if subcategory.category == nil {
                logger.warning("Found subcategory without parent category: \(subcategory.id)")
            }
        }
        
        // Check transaction-subcategory relationships
        let transactionDescriptor = FetchDescriptor<Transaction>()
        let transactions = try context.fetch(transactionDescriptor)
        
        for transaction in transactions {
            if let subcategory = transaction.subcategory,
               let category = transaction.category,
               subcategory.category?.id != category.id {
                logger.warning("Found transaction with mismatched category-subcategory relationship: \(transaction.id)")
            }
        }
    }
    
    private func checkDataConsistency(context: ModelContext) throws {
        // Check for duplicate categories
        let categoryDescriptor = FetchDescriptor<Category>()
        let categories = try context.fetch(categoryDescriptor)
        
        let categoryNames = categories.map { $0.name.lowercased() }
        let uniqueNames = Set(categoryNames)
        
        if categoryNames.count != uniqueNames.count {
            logger.warning("Found duplicate category names")
        }
        
        // Check for duplicate fund sources
        let fundSourceDescriptor = FetchDescriptor<FundSource>()
        let fundSources = try context.fetch(fundSourceDescriptor)
        
        let fundSourceNames = fundSources.map { $0.name.lowercased() }
        let uniqueFundSourceNames = Set(fundSourceNames)
        
        if fundSourceNames.count != uniqueFundSourceNames.count {
            logger.warning("Found duplicate fund source names")
        }
    }
    
    private func verifyFundSourceBalances(context: ModelContext) throws {
        let fundSourceDescriptor = FetchDescriptor<FundSource>()
        let fundSources = try context.fetch(fundSourceDescriptor)
        
        for fundSource in fundSources {
            let transactionDescriptor = FetchDescriptor<Transaction>(
                predicate: #Predicate<Transaction> { $0.fundSource?.id == fundSource.id }
            )
            let transactions = try context.fetch(transactionDescriptor)
            
            let totalSpent = transactions.reduce(Decimal.zero) { $0 + $1.amount }
            let expectedBalance = fundSource.initialBalance - totalSpent
            
            if abs(fundSource.currentBalance.doubleValue - expectedBalance.doubleValue) > 0.01 {
                logger.warning("Fund source balance mismatch for \(fundSource.name): expected \(expectedBalance), actual \(fundSource.currentBalance)")
                
                // Auto-correct the balance
                fundSource.currentBalance = expectedBalance
                logger.info("Auto-corrected balance for fund source: \(fundSource.name)")
            }
        }
        
        try context.save()
    }
    
    // MARK: - Data Recovery
    func performDataRecovery(container: ModelContainer) throws {
        logger.info("Starting data recovery process")
        
        let context = ModelContext(container)
        
        do {
            // Clean up orphaned data
            try cleanupOrphanedData(context: context)
            
            // Repair broken relationships
            try repairBrokenRelationships(context: context)
            
            // Recalculate fund source balances
            try recalculateFundSourceBalances(context: context)
            
            try context.save()
            logger.info("Data recovery completed successfully")
        } catch {
            logger.error("Data recovery failed: \(error.localizedDescription)")
            throw BudgetAppError.dataIntegrityCheckFailed(error)
        }
    }
    
    private func cleanupOrphanedData(context: ModelContext) throws {
        // Remove transactions without category or fund source
        let transactionDescriptor = FetchDescriptor<Transaction>()
        let transactions = try context.fetch(transactionDescriptor)
        
        var removedCount = 0
        for transaction in transactions {
            if transaction.category == nil || transaction.fundSource == nil {
                context.delete(transaction)
                removedCount += 1
            }
        }
        
        if removedCount > 0 {
            logger.info("Removed \(removedCount) orphaned transactions")
        }
        
        // Remove subcategories without parent category
        let subcategoryDescriptor = FetchDescriptor<Subcategory>()
        let subcategories = try context.fetch(subcategoryDescriptor)
        
        var removedSubcategories = 0
        for subcategory in subcategories {
            if subcategory.category == nil {
                context.delete(subcategory)
                removedSubcategories += 1
            }
        }
        
        if removedSubcategories > 0 {
            logger.info("Removed \(removedSubcategories) orphaned subcategories")
        }
    }
    
    private func repairBrokenRelationships(context: ModelContext) throws {
        let transactionDescriptor = FetchDescriptor<Transaction>()
        let transactions = try context.fetch(transactionDescriptor)
        
        var repairedCount = 0
        for transaction in transactions {
            if let subcategory = transaction.subcategory,
               let category = transaction.category,
               subcategory.category?.id != category.id {
                // Reset subcategory to nil if it doesn't belong to the selected category
                transaction.subcategory = nil
                repairedCount += 1
            }
        }
        
        if repairedCount > 0 {
            logger.info("Repaired \(repairedCount) broken category-subcategory relationships")
        }
    }
    
    private func recalculateFundSourceBalances(context: ModelContext) throws {
        let fundSourceDescriptor = FetchDescriptor<FundSource>()
        let fundSources = try context.fetch(fundSourceDescriptor)
        
        for fundSource in fundSources {
            let transactionDescriptor = FetchDescriptor<Transaction>(
                predicate: #Predicate<Transaction> { $0.fundSource?.id == fundSource.id }
            )
            let transactions = try context.fetch(transactionDescriptor)
            
            let totalSpent = transactions.reduce(Decimal.zero) { $0 + $1.amount }
            let correctBalance = fundSource.initialBalance - totalSpent
            
            if fundSource.currentBalance != correctBalance {
                fundSource.currentBalance = correctBalance
                logger.info("Recalculated balance for fund source: \(fundSource.name)")
            }
        }
    }
    
    // MARK: - Backup and Restore
    func createBackup(container: ModelContainer) throws -> URL {
        logger.info("Creating data backup")
        
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let backupURL = documentsPath.appendingPathComponent("backup_\(Date().timeIntervalSince1970).json")
        
        let context = ModelContext(container)
        
        do {
            let backupData = try exportAllData(context: context)
            let jsonData = try JSONSerialization.data(withJSONObject: backupData, options: .prettyPrinted)
            try jsonData.write(to: backupURL)
            
            logger.info("Backup created successfully at: \(backupURL.path)")
            return backupURL
        } catch {
            logger.error("Backup creation failed: \(error.localizedDescription)")
            throw BudgetAppError.migrationFailed(error)
        }
    }
    
    private func exportAllData(context: ModelContext) throws -> [String: Any] {
        var exportData: [String: Any] = [:]
        
        // Export transactions
        let transactionDescriptor = FetchDescriptor<Transaction>()
        let transactions = try context.fetch(transactionDescriptor)
        exportData["transactions"] = transactions.map { transaction in
            [
                "id": transaction.id.uuidString,
                "amount": transaction.amount.doubleValue,
                "date": transaction.date.timeIntervalSince1970,
                "note": transaction.note ?? "",
                "categoryId": transaction.category?.id.uuidString ?? "",
                "subcategoryId": transaction.subcategory?.id.uuidString ?? "",
                "fundSourceId": transaction.fundSource?.id.uuidString ?? "",
                "createdAt": transaction.createdAt.timeIntervalSince1970,
                "updatedAt": transaction.updatedAt.timeIntervalSince1970
            ]
        }
        
        // Export categories
        let categoryDescriptor = FetchDescriptor<Category>()
        let categories = try context.fetch(categoryDescriptor)
        exportData["categories"] = categories.map { category in
            [
                "id": category.id.uuidString,
                "name": category.name,
                "iconName": category.iconName ?? "",
                "colorHex": category.colorHex,
                "isCustom": category.isCustom
            ]
        }
        
        // Export subcategories
        let subcategoryDescriptor = FetchDescriptor<Subcategory>()
        let subcategories = try context.fetch(subcategoryDescriptor)
        exportData["subcategories"] = subcategories.map { subcategory in
            [
                "id": subcategory.id.uuidString,
                "name": subcategory.name,
                "categoryId": subcategory.category?.id.uuidString ?? ""
            ]
        }
        
        // Export fund sources
        let fundSourceDescriptor = FetchDescriptor<FundSource>()
        let fundSources = try context.fetch(fundSourceDescriptor)
        exportData["fundSources"] = fundSources.map { fundSource in
            [
                "id": fundSource.id.uuidString,
                "name": fundSource.name,
                "currentBalance": fundSource.currentBalance.doubleValue,
                "initialBalance": fundSource.initialBalance.doubleValue,
                "isShared": fundSource.isShared,
                "createdAt": fundSource.createdAt.timeIntervalSince1970
            ]
        }
        
        // Export user accounts
        let userAccountDescriptor = FetchDescriptor<UserAccount>()
        let userAccounts = try context.fetch(userAccountDescriptor)
        exportData["userAccounts"] = userAccounts.map { account in
            [
                "id": account.id.uuidString,
                "username": account.username,
                "email": account.email,
                "createdAt": account.createdAt.timeIntervalSince1970
            ]
        }
        
        exportData["version"] = SchemaVersion.current.rawValue
        exportData["exportDate"] = Date().timeIntervalSince1970
        
        return exportData
    }
}