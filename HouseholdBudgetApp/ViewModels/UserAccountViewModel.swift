import Foundation
import SwiftData

@Observable
final class UserAccountViewModel {
    private let modelContext: ModelContext
    
    var currentAccount: UserAccount?
    var allAccounts: [UserAccount] = []
    var currentError: BudgetAppError?
    var isLoggedIn: Bool = false
    var isLoading: Bool = false
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        fetchAccounts()
        loadCurrentAccount()
        checkLoginStatus()
    }
    
    // MARK: - Authentication
    
    func register(email: String, username: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            // Validate input
            guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw BudgetAppError.invalidInput(reason: "Email cannot be empty")
            }
            
            guard !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw BudgetAppError.invalidInput(reason: "Username cannot be empty")
            }
            
            guard validatePassword(password) else {
                throw BudgetAppError.weakPassword
            }
            
            let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            let trimmedUsername = username.trimmingCharacters(in: .whitespacesAndNewlines)
            
            // Check if account with same email already exists
            let existingAccount = allAccounts.first { $0.email.lowercased() == trimmedEmail }
            if existingAccount != nil {
                throw BudgetAppError.emailAlreadyExists
            }
            
            let account = UserAccount(username: trimmedUsername, email: trimmedEmail, password: password)
            
            modelContext.insert(account)
            try modelContext.save()
            
            // Auto-login after registration
            currentAccount = account
            account.login()
            isLoggedIn = true
            saveLoginState(account.id)
            
            fetchAccounts()
            currentError = nil
        } catch {
            currentError = BudgetAppError.from(error, context: .registration)
            throw currentError!
        }
    }
    
    func login(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            
            guard let account = allAccounts.first(where: { $0.email.lowercased() == trimmedEmail }) else {
                throw BudgetAppError.userNotFound
            }
            
            guard account.verifyPassword(password) else {
                throw BudgetAppError.invalidCredentials
            }
            
            currentAccount = account
            account.login()
            isLoggedIn = true
            saveLoginState(account.id)
            
            try modelContext.save()
            currentError = nil
        } catch {
            currentError = BudgetAppError.from(error, context: .login)
            throw currentError!
        }
    }
    
    func logout() {
        currentAccount?.logout()
        do {
            try modelContext.save()
        } catch {
            currentError = BudgetAppError.from(error, context: .userAccountUpdate)
        }
        
        currentAccount = nil
        isLoggedIn = false
        clearLoginState()
    }
    
    func resetPassword(email: String) async throws -> String {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            
            guard let account = allAccounts.first(where: { $0.email.lowercased() == trimmedEmail }) else {
                throw BudgetAppError.userNotFound
            }
            
            let resetToken = account.generatePasswordResetToken()
            try modelContext.save()
            
            currentError = nil
            return resetToken
        } catch {
            currentError = BudgetAppError.from(error, context: .passwordReset)
            throw currentError!
        }
    }
    
    func resetPasswordWithToken(token: String, newPassword: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            guard validatePassword(newPassword) else {
                throw BudgetAppError.weakPassword
            }
            
            guard let account = allAccounts.first(where: { $0.verifyPasswordResetToken(token) }) else {
                throw BudgetAppError.passwordResetTokenInvalid
            }
            
            account.updatePassword(newPassword)
            try modelContext.save()
            
            currentError = nil
        } catch {
            currentError = BudgetAppError.from(error, context: .passwordReset)
            throw currentError!
        }
    }
    
    func validatePassword(_ password: String) -> Bool {
        // Password must be at least 8 characters and contain both letters and numbers
        guard password.count >= 8 else { return false }
        
        let hasLetter = password.rangeOfCharacter(from: .letters) != nil
        let hasNumber = password.rangeOfCharacter(from: .decimalDigits) != nil
        
        return hasLetter && hasNumber
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
    
    func getAccount(by id: UUID) -> UserAccount? {
        return allAccounts.first { $0.id == id }
    }
    
    // MARK: - Private Methods
    
    private func loadCurrentAccount() {
        guard let accountId = getCurrentAccountId() else { return }
        currentAccount = allAccounts.first { $0.id == accountId }
    }
    
    private func checkLoginStatus() {
        guard let accountId = getLoggedInAccountId(),
              let account = allAccounts.first(where: { $0.id == accountId }),
              account.isLoggedIn else {
            isLoggedIn = false
            return
        }
        
        currentAccount = account
        isLoggedIn = true
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
    
    private func saveLoginState(_ accountId: UUID) {
        UserDefaults.standard.set(accountId.uuidString, forKey: "loggedInAccountId")
        UserDefaults.standard.set(true, forKey: "isLoggedIn")
    }
    
    private func getLoggedInAccountId() -> UUID? {
        guard UserDefaults.standard.bool(forKey: "isLoggedIn"),
              let idString = UserDefaults.standard.string(forKey: "loggedInAccountId") else {
            return nil
        }
        return UUID(uuidString: idString)
    }
    
    private func clearLoginState() {
        UserDefaults.standard.removeObject(forKey: "loggedInAccountId")
        UserDefaults.standard.set(false, forKey: "isLoggedIn")
    }
}