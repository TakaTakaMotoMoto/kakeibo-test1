import Foundation
import SwiftData
import CryptoKit

@Observable
final class SharingViewModel {
    private let modelContext: ModelContext
    
    var availableUsers: [UserAccount] = []
    var fundSourceShares: [FundSourceShare] = []
    var searchResults: [UserAccount] = []
    var pendingInvitations: [FundSourceShare] = []
    var currentError: BudgetAppError?
    var isLoading: Bool = false
    var searchQuery: String = ""
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        fetchAvailableUsers()
        fetchFundSourceShares()
        fetchPendingInvitations()
    }
    
    // MARK: - User Search
    
    /// Searches for users by email address
    func searchUsers(by email: String) async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            
            guard !trimmedEmail.isEmpty else {
                searchResults = []
                return
            }
            
            let descriptor = FetchDescriptor<UserAccount>(
                predicate: #Predicate<UserAccount> { account in
                    account.email.localizedStandardContains(trimmedEmail)
                },
                sortBy: [SortDescriptor(\.username)]
            )
            
            searchResults = try modelContext.fetch(descriptor)
            currentError = nil
        } catch {
            currentError = BudgetAppError.from(error, context: .userAccountFetch)
            searchResults = []
        }
    }
    
    /// Searches for users by username
    func searchUsersByUsername(_ username: String) async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let trimmedUsername = username.trimmingCharacters(in: .whitespacesAndNewlines)
            
            guard !trimmedUsername.isEmpty else {
                searchResults = []
                return
            }
            
            let descriptor = FetchDescriptor<UserAccount>(
                predicate: #Predicate<UserAccount> { account in
                    account.username.localizedStandardContains(trimmedUsername)
                },
                sortBy: [SortDescriptor(\.username)]
            )
            
            searchResults = try modelContext.fetch(descriptor)
            currentError = nil
        } catch {
            currentError = BudgetAppError.from(error, context: .userAccountFetch)
            searchResults = []
        }
    }
    
    // MARK: - Fund Source Sharing
    
    /// Creates a sharing invitation for a fund source
    func createShareInvitation(for fundSource: FundSource, permissions: SharePermission) async -> String? {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let inviteToken = generateInviteToken()
            let share = FundSourceShare(
                ownerAccountId: fundSource.ownerAccountId ?? UUID(),
                permissions: permissions,
                inviteToken: inviteToken
            )
            
            share.fundSource = fundSource
            modelContext.insert(share)
            try modelContext.save()
            
            // Update fund source sharing status
            fundSource.isShared = true
            fundSource.updatedAt = Date()
            try modelContext.save()
            
            fetchPendingInvitations()
            currentError = nil
            return inviteToken
        } catch {
            currentError = BudgetAppError.from(error, context: .shareCreation)
            return nil
        }
    }
    
    /// Creates a direct share with a specific user (no invitation needed)
    func createDirectShare(for fundSource: FundSource, with userId: UUID, permissions: SharePermission) async -> Bool {
        isLoading = true
        defer { isLoading = false }
        
        do {
            // Check if share already exists
            let existingShare = fundSourceShares.first { share in
                share.fundSource?.id == fundSource.id && share.sharedAccountId == userId
            }
            
            if existingShare != nil {
                currentError = BudgetAppError.shareAlreadyExists
                return false
            }
            
            let share = FundSourceShare(
                ownerAccountId: fundSource.ownerAccountId ?? UUID(),
                sharedAccountId: userId,
                permissions: permissions
            )
            
            share.fundSource = fundSource
            share.isAccepted = true // Direct share, no invitation needed
            modelContext.insert(share)
            
            // Update fund source sharing status
            fundSource.isShared = true
            fundSource.updatedAt = Date()
            
            try modelContext.save()
            
            fetchFundSourceShares()
            currentError = nil
            return true
        } catch {
            currentError = BudgetAppError.from(error, context: .shareCreation)
            return false
        }
    }
    
    /// Accepts a sharing invitation using an invite token
    func acceptInvitation(token: String, accountId: UUID) async -> Bool {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let descriptor = FetchDescriptor<FundSourceShare>(
                predicate: #Predicate<FundSourceShare> { share in
                    share.inviteToken == token
                }
            )
            
            let shares = try modelContext.fetch(descriptor)
            
            guard let share = shares.first,
                  share.isInviteValid() else {
                currentError = BudgetAppError.invalidInviteToken
                return false
            }
            
            share.acceptInvitation(by: accountId)
            try modelContext.save()
            
            fetchFundSourceShares()
            fetchPendingInvitations()
            currentError = nil
            return true
        } catch {
            currentError = BudgetAppError.from(error, context: .shareAcceptance)
            return false
        }
    }
    
    /// Updates permissions for an existing share
    func updateSharePermissions(_ share: FundSourceShare, permissions: SharePermission) async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            share.updatePermissions(permissions)
            try modelContext.save()
            
            fetchFundSourceShares()
            currentError = nil
        } catch {
            currentError = BudgetAppError.from(error, context: .shareUpdate)
        }
    }
    
    /// Removes a sharing relationship
    func removeShare(_ share: FundSourceShare) async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            modelContext.delete(share)
            try modelContext.save()
            
            fetchFundSourceShares()
            fetchPendingInvitations()
            currentError = nil
        } catch {
            currentError = BudgetAppError.from(error, context: .shareDeletion)
        }
    }
    
    /// Gets all shares for a specific fund source
    func getShares(for fundSource: FundSource) -> [FundSourceShare] {
        return fundSourceShares.filter { $0.fundSource?.id == fundSource.id }
    }
    
    /// Gets the user's permission level for a fund source
    func getUserPermission(for fundSource: FundSource, userId: UUID) -> SharePermission? {
        let shares = getShares(for: fundSource)
        return shares.first { $0.sharedAccountId == userId }?.permissions
    }
    
    /// Checks if a user can perform a specific action on a fund source
    func canUserPerformAction(_ action: ShareAction, on fundSource: FundSource, userId: UUID) -> Bool {
        // Owner can always perform any action
        if fundSource.ownerAccountId == userId {
            return true
        }
        
        guard let permission = getUserPermission(for: fundSource, userId: userId) else {
            return false
        }
        
        switch action {
        case .view:
            return true // All shared users can view
        case .createTransaction:
            return permission.canCreateTransactions
        case .editTransaction:
            return permission.canEditTransactions
        case .deleteTransaction:
            return permission.canDeleteTransactions
        case .adjustBalance:
            return permission.canAdjustBalance
        case .manageSharing:
            return permission.canManageSharing
        }
    }
    
    // MARK: - Private Methods
    
    private func fetchAvailableUsers() {
        do {
            let descriptor = FetchDescriptor<UserAccount>(
                sortBy: [SortDescriptor(\.username)]
            )
            availableUsers = try modelContext.fetch(descriptor)
        } catch {
            currentError = BudgetAppError.from(error, context: .userAccountFetch)
            availableUsers = []
        }
    }
    
    private func fetchFundSourceShares() {
        do {
            let descriptor = FetchDescriptor<FundSourceShare>(
                predicate: #Predicate<FundSourceShare> { share in
                    share.isAccepted == true
                },
                sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
            )
            fundSourceShares = try modelContext.fetch(descriptor)
        } catch {
            currentError = BudgetAppError.from(error, context: .shareFetch)
            fundSourceShares = []
        }
    }
    
    private func fetchPendingInvitations() {
        do {
            let descriptor = FetchDescriptor<FundSourceShare>(
                predicate: #Predicate<FundSourceShare> { share in
                    share.isAccepted == false && share.inviteToken != nil
                },
                sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
            )
            pendingInvitations = try modelContext.fetch(descriptor)
        } catch {
            currentError = BudgetAppError.from(error, context: .shareFetch)
            pendingInvitations = []
        }
    }
    
    private func generateInviteToken() -> String {
        let data = Data(UUID().uuidString.utf8)
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined().prefix(16).uppercased()
    }
    
    // MARK: - Data Synchronization
    
    /// Synchronizes shared fund source data across all users who have access
    func synchronizeSharedData(for fundSource: FundSource) async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            // Get all users who have access to this fund source
            let accessibleUserIds = fundSource.getAccessibleUserIds()
            
            // Update the fund source's updated timestamp to indicate sync
            fundSource.updatedAt = Date()
            try modelContext.save()
            
            // In a real implementation, this would trigger network sync
            // For now, we'll just ensure local data consistency
            await refreshSharedFundSourceData(fundSource)
            
            currentError = nil
        } catch {
            currentError = BudgetAppError.from(error, context: .dataSync)
        }
    }
    
    /// Refreshes shared fund source data to ensure consistency
    private func refreshSharedFundSourceData(_ fundSource: FundSource) async {
        // Recalculate fund source balance based on transactions
        let totalTransactionAmount = fundSource.transactions.reduce(Decimal(0)) { total, transaction in
            return total + transaction.amount
        }
        
        let expectedBalance = fundSource.initialBalance - totalTransactionAmount
        
        // Update balance if there's a discrepancy
        if fundSource.currentBalance != expectedBalance {
            fundSource.updateBalance(expectedBalance)
            
            do {
                try modelContext.save()
            } catch {
                currentError = BudgetAppError.from(error, context: .dataSync)
            }
        }
    }
    
    /// Gets all fund sources that are shared with the current user
    func getSharedFundSources(for userId: UUID) -> [FundSource] {
        do {
            let descriptor = FetchDescriptor<FundSource>(
                predicate: #Predicate<FundSource> { fundSource in
                    fundSource.shares.contains { share in
                        share.sharedAccountId == userId && share.isAccepted
                    }
                },
                sortBy: [SortDescriptor(\.name)]
            )
            
            return try modelContext.fetch(descriptor)
        } catch {
            currentError = BudgetAppError.from(error, context: .fundSourceFetch)
            return []
        }
    }
    
    /// Gets all fund sources owned by a specific user
    func getOwnedFundSources(for userId: UUID) -> [FundSource] {
        do {
            let descriptor = FetchDescriptor<FundSource>(
                predicate: #Predicate<FundSource> { fundSource in
                    fundSource.ownerAccountId == userId
                },
                sortBy: [SortDescriptor(\.name)]
            )
            
            return try modelContext.fetch(descriptor)
        } catch {
            currentError = BudgetAppError.from(error, context: .fundSourceFetch)
            return []
        }
    }
    
    /// Validates that a user has permission to perform an action on a transaction
    func validateTransactionPermission(transaction: Transaction, userId: UUID, action: ShareAction) -> Bool {
        guard let fundSource = transaction.fundSource else { return false }
        
        // Check if user has access to the fund source
        guard fundSource.hasAccess(userId: userId) else { return false }
        
        // Get user's permission level
        guard let permission = fundSource.getPermission(for: userId) else { return false }
        
        // Check specific action permissions
        switch action {
        case .view:
            return true // All users with access can view
        case .createTransaction:
            return permission.canCreateTransactions
        case .editTransaction:
            // Users can edit their own transactions, or if they have edit permissions
            return transaction.createdBy?.id == userId || permission.canEditTransactions
        case .deleteTransaction:
            // Users can delete their own transactions, or if they have delete permissions
            return transaction.createdBy?.id == userId || permission.canDeleteTransactions
        case .adjustBalance:
            return permission.canAdjustBalance
        case .manageSharing:
            return permission.canManageSharing
        }
    }
    
    /// Handles the acceptance of a sharing invitation and triggers data sync
    func processInvitationAcceptance(token: String, accountId: UUID) async -> Bool {
        let success = await acceptInvitation(token: token, accountId: accountId)
        
        if success {
            // Find the accepted share and sync data
            if let acceptedShare = fundSourceShares.first(where: { $0.inviteToken == token }),
               let fundSource = acceptedShare.fundSource {
                await synchronizeSharedData(for: fundSource)
            }
        }
        
        return success
    }
}

/// Defines the types of actions that can be performed on shared fund sources
enum ShareAction {
    case view
    case createTransaction
    case editTransaction
    case deleteTransaction
    case adjustBalance
    case manageSharing
}