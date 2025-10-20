import XCTest
import SwiftData
@testable import HouseholdBudgetApp

final class SharingViewModelTests: XCTestCase {
    var modelContext: ModelContext!
    var sharingViewModel: SharingViewModel!
    var userAccountViewModel: UserAccountViewModel!
    var fundSourceViewModel: FundSourceViewModel!
    
    override func setUpWithError() throws {
        // Create in-memory model container for testing
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: Transaction.self, Category.self, Subcategory.self, FundSource.self, UserAccount.self, FundSourceShare.self, configurations: config)
        modelContext = container.mainContext
        
        sharingViewModel = SharingViewModel(modelContext: modelContext)
        userAccountViewModel = UserAccountViewModel(modelContext: modelContext)
        fundSourceViewModel = FundSourceViewModel(modelContext: modelContext)
    }
    
    override func tearDownWithError() throws {
        modelContext = nil
        sharingViewModel = nil
        userAccountViewModel = nil
        fundSourceViewModel = nil
    }
    
    func testCreateShareInvitation() async throws {
        // Create test users
        let owner = UserAccount(username: "owner", email: "owner@test.com", password: "password123")
        modelContext.insert(owner)
        
        // Create test fund source
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000, ownerAccountId: owner.id)
        modelContext.insert(fundSource)
        
        try modelContext.save()
        
        // Create share invitation
        let inviteToken = await sharingViewModel.createShareInvitation(for: fundSource, permissions: .readWrite)
        
        XCTAssertNotNil(inviteToken)
        XCTAssertEqual(inviteToken?.count, 16)
        XCTAssertTrue(fundSource.isShared)
        XCTAssertFalse(sharingViewModel.pendingInvitations.isEmpty)
    }
    
    func testAcceptInvitation() async throws {
        // Create test users
        let owner = UserAccount(username: "owner", email: "owner@test.com", password: "password123")
        let invitee = UserAccount(username: "invitee", email: "invitee@test.com", password: "password123")
        modelContext.insert(owner)
        modelContext.insert(invitee)
        
        // Create test fund source
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000, ownerAccountId: owner.id)
        modelContext.insert(fundSource)
        
        try modelContext.save()
        
        // Create share invitation
        guard let inviteToken = await sharingViewModel.createShareInvitation(for: fundSource, permissions: .readWrite) else {
            XCTFail("Failed to create invite token")
            return
        }
        
        // Accept invitation
        let success = await sharingViewModel.acceptInvitation(token: inviteToken, accountId: invitee.id)
        
        XCTAssertTrue(success)
        XCTAssertFalse(sharingViewModel.fundSourceShares.isEmpty)
        
        // Verify the share exists and is accepted
        let share = sharingViewModel.fundSourceShares.first
        XCTAssertNotNil(share)
        XCTAssertEqual(share?.sharedAccountId, invitee.id)
        XCTAssertEqual(share?.permissions, .readWrite)
        XCTAssertTrue(share?.isAccepted ?? false)
    }
    
    func testDirectShare() async throws {
        // Create test users
        let owner = UserAccount(username: "owner", email: "owner@test.com", password: "password123")
        let sharedUser = UserAccount(username: "shared", email: "shared@test.com", password: "password123")
        modelContext.insert(owner)
        modelContext.insert(sharedUser)
        
        // Create test fund source
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000, ownerAccountId: owner.id)
        modelContext.insert(fundSource)
        
        try modelContext.save()
        
        // Create direct share
        let success = await sharingViewModel.createDirectShare(for: fundSource, with: sharedUser.id, permissions: .readOnly)
        
        XCTAssertTrue(success)
        XCTAssertTrue(fundSource.isShared)
        XCTAssertFalse(sharingViewModel.fundSourceShares.isEmpty)
        
        // Verify the share exists and is accepted
        let share = sharingViewModel.fundSourceShares.first
        XCTAssertNotNil(share)
        XCTAssertEqual(share?.sharedAccountId, sharedUser.id)
        XCTAssertEqual(share?.permissions, .readOnly)
        XCTAssertTrue(share?.isAccepted ?? false)
    }
    
    func testUserSearch() async throws {
        // Create test users
        let user1 = UserAccount(username: "john", email: "john@test.com", password: "password123")
        let user2 = UserAccount(username: "jane", email: "jane@test.com", password: "password123")
        let user3 = UserAccount(username: "bob", email: "bob@example.com", password: "password123")
        
        modelContext.insert(user1)
        modelContext.insert(user2)
        modelContext.insert(user3)
        
        try modelContext.save()
        
        // Search by email
        await sharingViewModel.searchUsers(by: "test.com")
        XCTAssertEqual(sharingViewModel.searchResults.count, 2)
        
        // Search by username
        await sharingViewModel.searchUsersByUsername("john")
        XCTAssertEqual(sharingViewModel.searchResults.count, 1)
        XCTAssertEqual(sharingViewModel.searchResults.first?.username, "john")
    }
    
    func testPermissionChecking() async throws {
        // Create test users
        let owner = UserAccount(username: "owner", email: "owner@test.com", password: "password123")
        let readOnlyUser = UserAccount(username: "readonly", email: "readonly@test.com", password: "password123")
        let readWriteUser = UserAccount(username: "readwrite", email: "readwrite@test.com", password: "password123")
        
        modelContext.insert(owner)
        modelContext.insert(readOnlyUser)
        modelContext.insert(readWriteUser)
        
        // Create test fund source
        let fundSource = FundSource(name: "Test Fund", initialBalance: 1000, ownerAccountId: owner.id)
        modelContext.insert(fundSource)
        
        try modelContext.save()
        
        // Create shares with different permissions
        let _ = await sharingViewModel.createDirectShare(for: fundSource, with: readOnlyUser.id, permissions: .readOnly)
        let _ = await sharingViewModel.createDirectShare(for: fundSource, with: readWriteUser.id, permissions: .readWrite)
        
        // Test permission checking
        XCTAssertTrue(sharingViewModel.canUserPerformAction(.view, on: fundSource, userId: owner.id))
        XCTAssertTrue(sharingViewModel.canUserPerformAction(.manageSharing, on: fundSource, userId: owner.id))
        
        XCTAssertTrue(sharingViewModel.canUserPerformAction(.view, on: fundSource, userId: readOnlyUser.id))
        XCTAssertFalse(sharingViewModel.canUserPerformAction(.createTransaction, on: fundSource, userId: readOnlyUser.id))
        
        XCTAssertTrue(sharingViewModel.canUserPerformAction(.view, on: fundSource, userId: readWriteUser.id))
        XCTAssertTrue(sharingViewModel.canUserPerformAction(.createTransaction, on: fundSource, userId: readWriteUser.id))
        XCTAssertFalse(sharingViewModel.canUserPerformAction(.manageSharing, on: fundSource, userId: readWriteUser.id))
    }
    
    func testFundSourceAccessMethods() async throws {
        // Create test users
        let owner = UserAccount(username: "owner", email: "owner@test.com", password: "password123")
        let sharedUser = UserAccount(username: "shared", email: "shared@test.com", password: "password123")
        
        modelContext.insert(owner)
        modelContext.insert(sharedUser)
        
        // Create test fund sources
        let ownedFundSource = FundSource(name: "Owned Fund", initialBalance: 1000, ownerAccountId: owner.id)
        let sharedFundSource = FundSource(name: "Shared Fund", initialBalance: 2000, ownerAccountId: owner.id)
        
        modelContext.insert(ownedFundSource)
        modelContext.insert(sharedFundSource)
        
        try modelContext.save()
        
        // Share one fund source
        let _ = await sharingViewModel.createDirectShare(for: sharedFundSource, with: sharedUser.id, permissions: .readWrite)
        
        // Test access methods
        XCTAssertTrue(ownedFundSource.hasAccess(userId: owner.id))
        XCTAssertFalse(ownedFundSource.hasAccess(userId: sharedUser.id))
        
        XCTAssertTrue(sharedFundSource.hasAccess(userId: owner.id))
        XCTAssertTrue(sharedFundSource.hasAccess(userId: sharedUser.id))
        
        // Test permission retrieval
        XCTAssertEqual(ownedFundSource.getPermission(for: owner.id), .admin)
        XCTAssertNil(ownedFundSource.getPermission(for: sharedUser.id))
        
        XCTAssertEqual(sharedFundSource.getPermission(for: owner.id), .admin)
        XCTAssertEqual(sharedFundSource.getPermission(for: sharedUser.id), .readWrite)
    }
}