import Foundation
import SwiftData

/// Service responsible for synchronizing shared data across users
@Observable
final class DataSynchronizationService {
    private let modelContext: ModelContext
    
    var isSyncing: Bool = false
    var lastSyncDate: Date?
    var syncError: BudgetAppError?
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    // MARK: - Main Synchronization Methods
    
    /// Performs a full synchronization of all shared data
    func performFullSync() async {
        isSyncing = true
        defer { isSyncing = false }
        
        do {
            // Sync fund sources
            await syncSharedFundSources()
            
            // Sync transactions
            await syncSharedTransactions()
            
            // Update sync timestamp
            lastSyncDate = Date()
            syncError = nil
            
        } catch {
            syncError = BudgetAppError.from(error, context: .dataSync)
        }
    }
    
    /// Synchronizes shared fund sources
    private func syncSharedFundSources() async {
        do {
            let descriptor = FetchDescriptor<FundSource>(
                predicate: #Predicate<FundSource> { fundSource in
                    fundSource.isShared == true
                }
            )
            
            let sharedFundSources = try modelContext.fetch(descriptor)
            
            for fundSource in sharedFundSources {
                await syncFundSourceData(fundSource)
            }
            
        } catch {
            syncError = BudgetAppError.from(error, context: .dataSync)
        }
    }
    
    /// Synchronizes transactions for shared fund sources
    private func syncSharedTransactions() async {
        do {
            let descriptor = FetchDescriptor<Transaction>(
                predicate: #Predicate<Transaction> { transaction in
                    transaction.isShared == true
                }
            )
            
            let sharedTransactions = try modelContext.fetch(descriptor)
            
            for transaction in sharedTransactions {
                await syncTransactionData(transaction)
            }
            
        } catch {
            syncError = BudgetAppError.from(error, context: .dataSync)
        }
    }
    
    // MARK: - Individual Item Synchronization
    
    /// Synchronizes data for a specific fund source
    func syncFundSourceData(_ fundSource: FundSource) async {
        do {
            // Recalculate balance based on transactions
            let totalTransactionAmount = fundSource.transactions.reduce(Decimal(0)) { total, transaction in
                return total + transaction.amount
            }
            
            let expectedBalance = fundSource.initialBalance - totalTransactionAmount
            
            // Update balance if there's a discrepancy
            if fundSource.currentBalance != expectedBalance {
                fundSource.updateBalance(expectedBalance)
                try modelContext.save()
            }
            
            // Update the fund source's sync timestamp
            fundSource.updatedAt = Date()
            try modelContext.save()
            
        } catch {
            syncError = BudgetAppError.from(error, context: .dataSync)
        }
    }
    
    /// Synchronizes data for a specific transaction
    func syncTransactionData(_ transaction: Transaction) async {
        do {
            // Update the transaction's shared status based on fund source
            transaction.updateSharedStatus()
            
            // Update timestamp
            transaction.updatedAt = Date()
            try modelContext.save()
            
        } catch {
            syncError = BudgetAppError.from(error, context: .dataSync)
        }
    }
    
    // MARK: - Conflict Resolution
    
    /// Resolves conflicts when the same data is modified by multiple users
    func resolveDataConflicts() async {
        // In a real implementation, this would handle conflict resolution
        // For now, we'll use a simple "last write wins" approach
        
        do {
            // Find transactions with potential conflicts (same fund source, recent updates)
            let recentDate = Date().addingTimeInterval(-3600) // Last hour
            
            let descriptor = FetchDescriptor<Transaction>(
                predicate: #Predicate<Transaction> { transaction in
                    transaction.isShared == true && transaction.updatedAt >= recentDate
                },
                sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]
            )
            
            let recentTransactions = try modelContext.fetch(descriptor)
            
            // Group by fund source and resolve conflicts
            let groupedTransactions = Dictionary(grouping: recentTransactions) { $0.fundSource?.id }
            
            for (_, transactions) in groupedTransactions {
                await resolveTransactionConflicts(transactions)
            }
            
        } catch {
            syncError = BudgetAppError.from(error, context: .dataSync)
        }
    }
    
    /// Resolves conflicts for a group of transactions
    private func resolveTransactionConflicts(_ transactions: [Transaction]) async {
        // Simple conflict resolution: keep the most recently updated transaction
        // In a real implementation, this would be more sophisticated
        
        guard transactions.count > 1 else { return }
        
        let sortedTransactions = transactions.sorted { $0.updatedAt > $1.updatedAt }
        let mostRecent = sortedTransactions.first!
        
        // Update all other transactions to match the most recent one's fund source balance
        for transaction in sortedTransactions.dropFirst() {
            if let fundSource = transaction.fundSource {
                await syncFundSourceData(fundSource)
            }
        }
    }
    
    // MARK: - Data Validation
    
    /// Validates the integrity of shared data
    func validateSharedDataIntegrity() async -> Bool {
        do {
            // Check fund source balance consistency
            let sharedFundSources = try modelContext.fetch(
                FetchDescriptor<FundSource>(
                    predicate: #Predicate<FundSource> { $0.isShared == true }
                )
            )
            
            for fundSource in sharedFundSources {
                let calculatedBalance = calculateFundSourceBalance(fundSource)
                if abs(fundSource.currentBalance.doubleValue - calculatedBalance.doubleValue) > 0.01 {
                    // Balance mismatch detected
                    fundSource.updateBalance(calculatedBalance)
                    try modelContext.save()
                }
            }
            
            // Check transaction consistency
            let sharedTransactions = try modelContext.fetch(
                FetchDescriptor<Transaction>(
                    predicate: #Predicate<Transaction> { $0.isShared == true }
                )
            )
            
            for transaction in sharedTransactions {
                // Ensure transaction's shared status matches its fund source
                let expectedSharedStatus = transaction.fundSource?.isShared ?? false
                if transaction.isShared != expectedSharedStatus {
                    transaction.isShared = expectedSharedStatus
                    transaction.updatedAt = Date()
                    try modelContext.save()
                }
            }
            
            return true
            
        } catch {
            syncError = BudgetAppError.from(error, context: .dataSync)
            return false
        }
    }
    
    /// Calculates the expected balance for a fund source based on its transactions
    private func calculateFundSourceBalance(_ fundSource: FundSource) -> Decimal {
        let totalExpenses = fundSource.transactions.reduce(Decimal(0)) { total, transaction in
            return total + transaction.amount
        }
        
        return fundSource.initialBalance - totalExpenses
    }
    
    // MARK: - Utility Methods
    
    /// Checks if synchronization is needed
    func needsSync() -> Bool {
        guard let lastSync = lastSyncDate else { return true }
        
        // Sync if it's been more than 5 minutes since last sync
        return Date().timeIntervalSince(lastSync) > 300
    }
    
    /// Forces a sync if needed
    func syncIfNeeded() async {
        if needsSync() {
            await performFullSync()
        }
    }
    
    /// Clears sync errors
    func clearSyncError() {
        syncError = nil
    }
    
    /// Gets sync status information
    func getSyncStatus() -> SyncStatus {
        if isSyncing {
            return .syncing
        } else if syncError != nil {
            return .error
        } else if lastSyncDate != nil {
            return .synced
        } else {
            return .notSynced
        }
    }
}

// MARK: - Sync Status Enum
enum SyncStatus {
    case notSynced
    case syncing
    case synced
    case error
    
    var displayText: String {
        switch self {
        case .notSynced:
            return "sync.status.notSynced".localized
        case .syncing:
            return "sync.status.syncing".localized
        case .synced:
            return "sync.status.synced".localized
        case .error:
            return "sync.status.error".localized
        }
    }
    
    var iconName: String {
        switch self {
        case .notSynced:
            return "icloud.slash"
        case .syncing:
            return "icloud.and.arrow.up"
        case .synced:
            return "icloud.and.arrow.down"
        case .error:
            return "exclamationmark.icloud"
        }
    }
}