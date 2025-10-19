import Foundation
import SwiftData

@Model
final class FundSource {
    var id: UUID
    var name: String
    var currentBalance: Decimal
    var initialBalance: Decimal
    var isShared: Bool
    var createdAt: Date
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \Transaction.fundSource)
    var transactions: [Transaction] = []
    
    @Relationship(deleteRule: .nullify, inverse: \UserAccount.sharedFundSources)
    var sharedWithAccounts: [UserAccount] = []
    
    init(name: String, initialBalance: Decimal, isShared: Bool = false) {
        self.id = UUID()
        self.name = name
        self.initialBalance = initialBalance
        self.currentBalance = initialBalance
        self.isShared = isShared
        self.createdAt = Date()
    }
}