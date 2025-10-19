import Foundation
import SwiftData

@Model
final class UserAccount {
    var id: UUID
    var username: String
    var email: String
    var createdAt: Date
    
    // Relationships
    var sharedFundSources: [FundSource] = []
    
    init(username: String, email: String) {
        self.id = UUID()
        self.username = username
        self.email = email
        self.createdAt = Date()
    }
}