import Foundation
import SwiftData

@Model
final class Category {
    var id: UUID
    var name: String
    var iconName: String?
    var colorHex: String
    var isCustom: Bool
    
    // Relationships
    @Relationship(deleteRule: .cascade, inverse: \Subcategory.category)
    var subcategories: [Subcategory] = []
    
    @Relationship(deleteRule: .nullify, inverse: \Transaction.category)
    var transactions: [Transaction] = []
    
    init(name: String, iconName: String? = nil, colorHex: String = "#007AFF", isCustom: Bool = true) {
        self.id = UUID()
        self.name = name
        self.iconName = iconName
        self.colorHex = colorHex
        self.isCustom = isCustom
    }
}