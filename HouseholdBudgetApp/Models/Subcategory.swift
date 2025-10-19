import Foundation
import SwiftData

@Model
final class Subcategory {
    var id: UUID
    var name: String
    
    // Relationships
    var category: Category?
    
    @Relationship(deleteRule: .nullify, inverse: \Transaction.subcategory)
    var transactions: [Transaction] = []
    
    init(name: String, category: Category? = nil) {
        self.id = UUID()
        self.name = name
        self.category = category
    }
}