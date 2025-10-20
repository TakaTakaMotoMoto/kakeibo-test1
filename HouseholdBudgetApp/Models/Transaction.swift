import Foundation
import SwiftData

enum TransactionType: String, CaseIterable, Codable {
    case expense = "expense"
    case income = "income"
    
    var localizedName: String {
        switch self {
        case .expense:
            return "transaction.type.expense".localized
        case .income:
            return "transaction.type.income".localized
        }
    }
}

@Model
final class Transaction {
    var id: UUID
    var amount: Decimal
    var date: Date
    var note: String?
    var type: TransactionType
    var createdAt: Date
    var updatedAt: Date
    
    // Sharing properties
    var createdByAccountId: UUID?
    var isShared: Bool
    
    // Relationships
    var category: Category?
    var subcategory: Subcategory?
    var fundSource: FundSource?
    
    // Computed property to get the creator account
    var createdBy: UserAccount? {
        // This would need to be resolved through the model context
        // For now, we'll use the ID-based approach
        return nil
    }
    
    init(amount: Decimal, date: Date, note: String? = nil, type: TransactionType = .expense, category: Category? = nil, subcategory: Subcategory? = nil, fundSource: FundSource? = nil, createdByAccountId: UUID? = nil) {
        self.id = UUID()
        self.amount = amount
        self.date = date
        self.note = note
        self.type = type
        self.category = category
        self.subcategory = subcategory
        self.fundSource = fundSource
        self.createdByAccountId = createdByAccountId
        self.isShared = fundSource?.isShared ?? false
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    /// Updates the shared status based on the fund source
    func updateSharedStatus() {
        self.isShared = fundSource?.isShared ?? false
        self.updatedAt = Date()
    }
    
    /// Checks if the transaction can be edited by the given user
    func canBeEditedBy(userId: UUID) -> Bool {
        // Owner can always edit
        if createdByAccountId == userId {
            return true
        }
        
        // If not shared, only owner can edit
        guard isShared else {
            return false
        }
        
        // For shared transactions, check fund source permissions
        // This would need to be implemented with proper permission checking
        return true // Placeholder - should check actual permissions
    }
    
    /// Checks if the transaction can be deleted by the given user
    func canBeDeletedBy(userId: UUID) -> Bool {
        // Same logic as editing for now
        return canBeEditedBy(userId: userId)
    }
}