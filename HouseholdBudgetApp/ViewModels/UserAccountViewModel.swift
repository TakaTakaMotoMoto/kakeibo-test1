import Foundation
import SwiftData

@Observable
final class UserAccountViewModel {
    private let modelContext: ModelContext
    
    var currentAccount: UserAccount?
    var allAccounts: [UserAccount] = []
    var currentError: BudgetAppError?
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        fetchAccounts()
        loadCurrentAccount()
    }
    
    // MARK: - Account Management
    
    func createAccount(username: String, email: String) {
        do {
            // Validate input
            guard !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                currentError = .invalidInput(reason: "Username cannot be empty")
                return
            }
            
            guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                currentError = .invalidInput(reason: "Email cannot be empty")
                return
            }
            
            // Check if account with same email already exists
            let existingAccount = allAccounts.first { $0.email.lowercased() == email.lowercased() }
            if existingAccount != nil {
                currentError = .invalidInput(reason: "Account with this email already exists")
                return
            }
            
            let account = UserAccount(username: username.trimmingCharacters(in: .whitespacesAndNewlines), 
                                    email: email.trimmingCharacters(in: .whitespacesAndNewlines))
            
            modelContext.insert(account)
            try modelContext.save()
            
            // Set as current account if it's the first one
            if currentAccount == nil {
                currentAccount = account
                saveCurrentAccountId(account.id)
            }
            
            fetchAccounts()
        } catch {
            currentError = BudgetAppError.from(error, context: .userAccountCreate)
        }
    }
    
    func updateAccount(_ account: UserAccount, username: String, email: String) {
        do {
            // Validate input
            guard !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                currentError = .invalidInput(reason: "Username cannot be empty")
                return
            }
            
            guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                currentError = .invalidInput(reason: "Email cannot be empty")
                return
            }
            
            // Check if another account with same email already exists
            let existingAccount = allAccounts.first { $0.email.lowercased() == email.lowercased() && $0.id != account.id }
            if existingAccount != nil {
                currentError = .invalidInput(reason: "Another account with this email already exists")
                return
            }
            
            account.username = username.trimmingCharacters(in: .whitespacesAndNewlines)
            account.email = email.trimmingCharacters(in: .whitespacesAndNewlines)
            
            try modelContext.save()
            fetchAccounts()
        } catch {
            currentError = BudgetAppError.from(error, context: .userAccountUpdate)
        }
    }
    
    func deleteAccount(_ account: UserAccount) {
        do {
            // If deleting current account, clear current account
            if currentAccount?.id == account.id {
                currentAccount = nil
                clearCurrentAccountId()
            }
            
            modelContext.delete(account)
            try modelContext.save()
            fetchAccounts()
        } catch {
            currentError = BudgetAppError.from(error, context: .userAccountDelete)
        }
    }
    
    func setCurrentAccount(_ account: UserAccount) {
        currentAccount = account
        saveCurrentAccountId(account.id)
    }
    
    // MARK: - Sharing Management
    
    func shareFundSource(_ fundSource: FundSource, with account: UserAccount) {
        do {
            // Check if already shared
            if account.sharedFundSources.contains(where: { $0.id == fundSource.id }) {
                currentError = .invalidInput(reason: "Fund source is already shared with this account")
                return
            }
            
            // Add to shared fund sources
            account.sharedFundSources.append(fundSource)
            fundSource.isShared = true
            
            try modelContext.save()
            fetchAccounts()
        } catch {
            currentError = BudgetAppError.from(error, context: .fundSourceShare)
        }
    }
    
    func unshareFundSource(_ fundSource: FundSource, from account: UserAccount) {
        do {
            // Remove from shared fund sources
            account.sharedFundSources.removeAll { $0.id == fundSource.id }
            
            // Check if fund source is still shared with other accounts
            let stillShared = allAccounts.contains { otherAccount in
                otherAccount.id != account.id && otherAccount.sharedFundSources.contains { $0.id == fundSource.id }
            }
            
            if !stillShared {
                fundSource.isShared = false
            }
            
            try modelContext.save()
            fetchAccounts()
        } catch {
            currentError = BudgetAppError.from(error, context: .fundSourceUnshare)
        }
    }
    
    func getSharedAccounts(for fundSource: FundSource) -> [UserAccount] {
        return allAccounts.filter { account in
            account.sharedFundSources.contains { $0.id == fundSource.id }
        }
    }
    
    // MARK: - Data Fetching
    
    func fetchAccounts() {
        do {
            let descriptor = FetchDescriptor<UserAccount>(
                sortBy: [SortDescriptor(\.username)]
            )
            allAccounts = try modelContext.fetch(descriptor)
        } catch {
            currentError = BudgetAppError.from(error, context: .userAccountFetch)
        }
    }
    
    // MARK: - Helper Methods
    
    func clearError() {
        currentError = nil
    }
    
    // MARK: - Private Methods
    
    private func loadCurrentAccount() {
        guard let accountId = getCurrentAccountId() else { return }
        currentAccount = allAccounts.first { $0.id == accountId }
    }
    
    private func saveCurrentAccountId(_ id: UUID) {
        UserDefaults.standard.set(id.uuidString, forKey: "currentAccountId")
    }
    
    private func getCurrentAccountId() -> UUID? {
        guard let idString = UserDefaults.standard.string(forKey: "currentAccountId") else { return nil }
        return UUID(uuidString: idString)
    }
    
    private func clearCurrentAccountId() {
        UserDefaults.standard.removeObject(forKey: "currentAccountId")
    }
}