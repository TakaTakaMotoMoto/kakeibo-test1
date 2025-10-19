import Foundation
import SwiftData

@Model
final class Transaction {
    var id: UUID
    var amount: Decimal
    var date: Date
    var note: String?
    var createdAt: Date
    var updatedAt: Date
    
    // Relationships
    var category: Category?
    var subcategory: Subcategory?
    var fundSource: FundSource?
    
    init(amount: Decimal, date: Date, note: String? = nil, category: Category? = nil, subcategory: Subcategory? = nil, fundSource: FundSource? = nil) {
        self.id = UUID()
        self.amount = amount
        self.date = date
        self.note = note
        self.category = category
        self.subcategory = subcategory
        self.fundSource = fundSource
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}