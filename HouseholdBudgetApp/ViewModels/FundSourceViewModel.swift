import Foundation
import SwiftData

@Observable
final class FundSourceViewModel {
    private let modelContext: ModelContext
    private let dataIntegrityService: DataIntegrityService
    
    var fundSources: [FundSource] = []
    var currentError: BudgetAppError?
    
    init(modelContext: ModelContext, dataIntegrityService: DataIntegrityService = DataIntegrityService()) {
        self.modelContext = modelContext
        self.dataIntegrityService = dataIntegrityService
        fetchFundSources()
    }
    
    // MARK: - FundSource CRUD Operations
    
    func createFundSource(name: String, initialBalance: Decimal, isShared: Bool = false) {
        do {
            let fundSource = FundSource(name: name, initialBalance: initialBalance, isShared: isShared)
            
            // Validate fund source using data integrity service
            try dataIntegrityService.validateFundSource(fundSource)
            
            modelContext.insert(fundSource)
            try modelContext.save()
            fetchFundSources()
        } catch {
            currentError = BudgetAppError.from(error, context: .fundSourceCreate)
        }
    }
    
    func updateFundSource(_ fundSource: FundSource, name: String, isShared: Bool? = nil) {
        do {
            fundSource.name = name
            if let isShared = isShared {
                fundSource.isShared = isShared
            }
            try modelContext.save()
            fetchFundSources()
        } catch {
            currentError = BudgetAppError.from(error, context: .fundSourceUpdate)
        }
    }
    
    func deleteFundSource(_ fundSource: FundSource) {
        do {
            modelContext.delete(fundSource)
            try modelContext.save()
            fetchFundSources()
        } catch {
            currentError = BudgetAppError.from(error, context: .fundSourceDelete)
        }
    }
    
    // MARK: - Balance Management
    
    /// Updates the balance when a transaction is created (automatic deduction)
    func updateBalance(for fundSource: FundSource, amount: Decimal) {
        do {
            fundSource.currentBalance -= amount
            try modelContext.save()
            fetchFundSources()
        } catch {
            currentError = BudgetAppError.from(error, context: .fundSourceBalanceUpdate)
        }
    }
    
    /// Manually adjusts the balance to a specific amount
    func adjustBalance(for fundSource: FundSource, newBalance: Decimal) {
        do {
            fundSource.currentBalance = newBalance
            try modelContext.save()
            fetchFundSources()
        } catch {
            currentError = BudgetAppError.from(error, context: .fundSourceBalanceAdjust)
        }
    }
    
    // MARK: - Data Fetching
    
    func fetchFundSources() {
        do {
            let descriptor = FetchDescriptor<FundSource>(
                sortBy: [SortDescriptor(\.name)]
            )
            fundSources = try modelContext.fetch(descriptor)
        } catch {
            currentError = BudgetAppError.from(error, context: .fundSourceFetch)
        }
    }
    
    // MARK: - Helper Methods
    
    func getTotalBalance() -> Decimal {
        return fundSources.reduce(0) { $0 + $1.currentBalance }
    }
    
    func getFundSource(by id: UUID) -> FundSource? {
        return fundSources.first { $0.id == id }
    }
    
    func clearError() {
        currentError = nil
    }
}