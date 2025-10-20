import Foundation
import SwiftData
import CryptoKit

@Model
final class UserAccount {
    var id: UUID
    var username: String
    var email: String
    var passwordHash: String
    var isLoggedIn: Bool
    var lastLoginDate: Date?
    var passwordResetToken: String?
    var passwordResetExpiry: Date?
    var createdAt: Date
    var updatedAt: Date
    
    // Relationships
    var sharedFundSources: [FundSource] = []
    
    init(username: String, email: String, password: String) {
        self.id = UUID()
        self.username = username
        self.email = email
        self.passwordHash = UserAccount.hashPassword(password)
        self.isLoggedIn = false
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    // Legacy initializer for existing accounts without password
    init(username: String, email: String) {
        self.id = UUID()
        self.username = username
        self.email = email
        self.passwordHash = ""
        self.isLoggedIn = false
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    // MARK: - Password Management
    
    static func hashPassword(_ password: String) -> String {
        let inputData = Data(password.utf8)
        let hashed = SHA256.hash(data: inputData)
        return hashed.compactMap { String(format: "%02x", $0) }.joined()
    }
    
    func verifyPassword(_ password: String) -> Bool {
        return passwordHash == UserAccount.hashPassword(password)
    }
    
    func updatePassword(_ newPassword: String) {
        self.passwordHash = UserAccount.hashPassword(newPassword)
        self.updatedAt = Date()
        // Clear reset token when password is updated
        self.passwordResetToken = nil
        self.passwordResetExpiry = nil
    }
    
    func generatePasswordResetToken() -> String {
        let token = UUID().uuidString
        self.passwordResetToken = UserAccount.hashPassword(token)
        self.passwordResetExpiry = Date().addingTimeInterval(3600) // 1 hour expiry
        self.updatedAt = Date()
        return token
    }
    
    func verifyPasswordResetToken(_ token: String) -> Bool {
        guard let expiry = passwordResetExpiry,
              let storedToken = passwordResetToken,
              expiry > Date() else {
            return false
        }
        return storedToken == UserAccount.hashPassword(token)
    }
    
    func login() {
        self.isLoggedIn = true
        self.lastLoginDate = Date()
        self.updatedAt = Date()
    }
    
    func logout() {
        self.isLoggedIn = false
        self.updatedAt = Date()
    }
}