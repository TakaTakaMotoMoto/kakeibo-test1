import Foundation
import SwiftData

@Model
final class FundSource {
    var id: UUID
    var name: String
    var currentBalance: Decimal
    var initialBalance: Decimal
    var isShared: Bool
    var ownerAccountId: UUID?
    var createdAt: Date
    var updatedAt: Date
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \Transaction.fundSource)
    var transactions: [Transaction] = []
    
    @Relationship(deleteRule: .nullify, inverse: \UserAccount.sharedFundSources)
    var sharedWithAccounts: [UserAccount] = []
    
    @Relationship(deleteRule: .cascade, inverse: \FundSourceShare.fundSource)
    var shares: [FundSourceShare] = []
    
    init(name: String, initialBalance: Decimal, ownerAccountId: UUID? = nil, isShared: Bool = false) {
        self.id = UUID()
        self.name = name
        self.initialBalance = initialBalance
        self.currentBalance = initialBalance
        self.ownerAccountId = ownerAccountId
        self.isShared = isShared
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    /// Updates the fund source and sets the updated timestamp
    func updateBalance(_ newBalance: Decimal) {
        self.currentBalance = newBalance
        self.updatedAt = Date()
    }
    
    /// Checks if a user has access to this fund source
    func hasAccess(userId: UUID) -> Bool {
        // Owner always has access
        if ownerAccountId == userId {
            return true
        }
        
        // Check if user has an accepted share
        return shares.contains { share in
            share.sharedAccountId == userId && share.isAccepted
        }
    }
    
    /// Gets the permission level for a specific user
    func getPermission(for userId: UUID) -> SharePermission? {
        // Owner has admin permission
        if ownerAccountId == userId {
            return .admin
        }
        
        // Find the user's share
        return shares.first { share in
            share.sharedAccountId == userId && share.isAccepted
        }?.permissions
    }
    
    /// Gets all users who have access to this fund source
    func getAccessibleUserIds() -> [UUID] {
        var userIds: [UUID] = []
        
        // Add owner
        if let ownerId = ownerAccountId {
            userIds.append(ownerId)
        }
        
        // Add shared users
        let sharedUserIds = shares.compactMap { share in
            share.isAccepted ? share.sharedAccountId : nil
        }
        userIds.append(contentsOf: sharedUserIds)
        
        return Array(Set(userIds)) // Remove duplicates
    }
}