import Foundation
import SwiftData

/// Represents the sharing relationship between a fund source and users
@Model
final class FundSourceShare {
    var id: UUID
    var ownerAccountId: UUID
    var sharedAccountId: UUID
    var permissions: SharePermission
    var inviteToken: String?
    var inviteExpiry: Date?
    var isAccepted: Bool
    var createdAt: Date
    var updatedAt: Date
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \FundSource.shares)
    var fundSource: FundSource?
    
    init(ownerAccountId: UUID, sharedAccountId: UUID, permissions: SharePermission = .readWrite) {
        self.id = UUID()
        self.ownerAccountId = ownerAccountId
        self.sharedAccountId = sharedAccountId
        self.permissions = permissions
        self.isAccepted = false
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    /// Creates a share with an invite token for pending invitations
    init(ownerAccountId: UUID, permissions: SharePermission = .readWrite, inviteToken: String) {
        self.id = UUID()
        self.ownerAccountId = ownerAccountId
        self.sharedAccountId = UUID() // Temporary ID until accepted
        self.permissions = permissions
        self.inviteToken = inviteToken
        self.inviteExpiry = Date().addingTimeInterval(7 * 24 * 3600) // 7 days expiry
        self.isAccepted = false
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    /// Accepts the invitation and sets the actual shared account ID
    func acceptInvitation(by accountId: UUID) {
        self.sharedAccountId = accountId
        self.isAccepted = true
        self.inviteToken = nil
        self.inviteExpiry = nil
        self.updatedAt = Date()
    }
    
    /// Checks if the invite token is valid and not expired
    func isInviteValid() -> Bool {
        guard let token = inviteToken,
              let expiry = inviteExpiry,
              !token.isEmpty,
              expiry > Date() else {
            return false
        }
        return !isAccepted
    }
    
    /// Updates the permissions for this share
    func updatePermissions(_ newPermissions: SharePermission) {
        self.permissions = newPermissions
        self.updatedAt = Date()
    }
}

/// Defines the permission levels for shared fund sources
enum SharePermission: String, CaseIterable, Codable {
    case readOnly = "read"
    case readWrite = "write"
    case admin = "admin"
    
    var displayName: String {
        switch self {
        case .readOnly:
            return "sharing.permission.readOnly".localized
        case .readWrite:
            return "sharing.permission.readWrite".localized
        case .admin:
            return "sharing.permission.admin".localized
        }
    }
    
    var description: String {
        switch self {
        case .readOnly:
            return "sharing.permission.readOnly.description".localized
        case .readWrite:
            return "sharing.permission.readWrite.description".localized
        case .admin:
            return "sharing.permission.admin.description".localized
        }
    }
    
    /// Checks if this permission level allows creating transactions
    var canCreateTransactions: Bool {
        return self == .readWrite || self == .admin
    }
    
    /// Checks if this permission level allows editing transactions
    var canEditTransactions: Bool {
        return self == .readWrite || self == .admin
    }
    
    /// Checks if this permission level allows deleting transactions
    var canDeleteTransactions: Bool {
        return self == .readWrite || self == .admin
    }
    
    /// Checks if this permission level allows managing sharing settings
    var canManageSharing: Bool {
        return self == .admin
    }
    
    /// Checks if this permission level allows adjusting fund source balance
    var canAdjustBalance: Bool {
        return self == .admin
    }
}