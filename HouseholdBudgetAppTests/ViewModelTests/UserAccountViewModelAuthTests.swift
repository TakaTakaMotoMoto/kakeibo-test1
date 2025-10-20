import XCTest
import SwiftData
@testable import HouseholdBudgetApp

final class UserAccountViewModelAuthTests: XCTestCase {
    var modelContext: ModelContext!
    var viewModel: UserAccountViewModel!
    
    override func setUp() {
        super.setUp()
        
        // Create in-memory model container for testing
        let schema = Schema([UserAccount.self, Transaction.self, Category.self, Subcategory.self, FundSource.self])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try! ModelContainer(for: schema, configurations: [configuration])
        modelContext = container.mainContext
        
        viewModel = UserAccountViewModel(modelContext: modelContext)
    }
    
    override func tearDown() {
        viewModel = nil
        modelContext = nil
        super.tearDown()
    }
    
    // MARK: - Password Validation Tests
    
    func testPasswordValidation() {
        // Test valid passwords
        XCTAssertTrue(viewModel.validatePassword("password123"))
        XCTAssertTrue(viewModel.validatePassword("mypassword1"))
        XCTAssertTrue(viewModel.validatePassword("Test1234"))
        
        // Test invalid passwords
        XCTAssertFalse(viewModel.validatePassword("short"))  // Too short
        XCTAssertFalse(viewModel.validatePassword("password"))  // No numbers
        XCTAssertFalse(viewModel.validatePassword("12345678"))  // No letters
        XCTAssertFalse(viewModel.validatePassword(""))  // Empty
    }
    
    // MARK: - Registration Tests
    
    func testSuccessfulRegistration() async throws {
        let email = "test@example.com"
        let username = "testuser"
        let password = "password123"
        
        try await viewModel.register(email: email, username: username, password: password)
        
        XCTAssertTrue(viewModel.isLoggedIn)
        XCTAssertNotNil(viewModel.currentAccount)
        XCTAssertEqual(viewModel.currentAccount?.email, email)
        XCTAssertEqual(viewModel.currentAccount?.username, username)
        XCTAssertTrue(viewModel.currentAccount?.verifyPassword(password) ?? false)
    }
    
    func testRegistrationWithExistingEmail() async {
        let email = "test@example.com"
        let username1 = "user1"
        let username2 = "user2"
        let password = "password123"
        
        // Register first user
        try! await viewModel.register(email: email, username: username1, password: password)
        
        // Try to register second user with same email
        do {
            try await viewModel.register(email: email, username: username2, password: password)
            XCTFail("Should have thrown emailAlreadyExists error")
        } catch BudgetAppError.emailAlreadyExists {
            // Expected error
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
    
    func testRegistrationWithWeakPassword() async {
        let email = "test@example.com"
        let username = "testuser"
        let weakPassword = "weak"
        
        do {
            try await viewModel.register(email: email, username: username, password: weakPassword)
            XCTFail("Should have thrown weakPassword error")
        } catch BudgetAppError.weakPassword {
            // Expected error
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
    
    // MARK: - Login Tests
    
    func testSuccessfulLogin() async throws {
        let email = "test@example.com"
        let username = "testuser"
        let password = "password123"
        
        // First register a user
        try await viewModel.register(email: email, username: username, password: password)
        
        // Logout
        viewModel.logout()
        XCTAssertFalse(viewModel.isLoggedIn)
        
        // Login again
        try await viewModel.login(email: email, password: password)
        
        XCTAssertTrue(viewModel.isLoggedIn)
        XCTAssertNotNil(viewModel.currentAccount)
        XCTAssertEqual(viewModel.currentAccount?.email, email)
    }
    
    func testLoginWithInvalidCredentials() async {
        let email = "test@example.com"
        let username = "testuser"
        let password = "password123"
        let wrongPassword = "wrongpassword123"
        
        // First register a user
        try! await viewModel.register(email: email, username: username, password: password)
        viewModel.logout()
        
        // Try to login with wrong password
        do {
            try await viewModel.login(email: email, password: wrongPassword)
            XCTFail("Should have thrown invalidCredentials error")
        } catch BudgetAppError.invalidCredentials {
            // Expected error
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
        
        XCTAssertFalse(viewModel.isLoggedIn)
    }
    
    func testLoginWithNonexistentUser() async {
        let email = "nonexistent@example.com"
        let password = "password123"
        
        do {
            try await viewModel.login(email: email, password: password)
            XCTFail("Should have thrown userNotFound error")
        } catch BudgetAppError.userNotFound {
            // Expected error
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
        
        XCTAssertFalse(viewModel.isLoggedIn)
    }
    
    // MARK: - Password Reset Tests
    
    func testPasswordReset() async throws {
        let email = "test@example.com"
        let username = "testuser"
        let oldPassword = "oldpassword123"
        let newPassword = "newpassword123"
        
        // Register user
        try await viewModel.register(email: email, username: username, password: oldPassword)
        viewModel.logout()
        
        // Request password reset
        let resetToken = try await viewModel.resetPassword(email: email)
        XCTAssertFalse(resetToken.isEmpty)
        
        // Reset password with token
        try await viewModel.resetPasswordWithToken(token: resetToken, newPassword: newPassword)
        
        // Try to login with new password
        try await viewModel.login(email: email, password: newPassword)
        XCTAssertTrue(viewModel.isLoggedIn)
        
        // Old password should not work
        viewModel.logout()
        do {
            try await viewModel.login(email: email, password: oldPassword)
            XCTFail("Old password should not work")
        } catch BudgetAppError.invalidCredentials {
            // Expected
        }
    }
    
    // MARK: - Logout Tests
    
    func testLogout() async throws {
        let email = "test@example.com"
        let username = "testuser"
        let password = "password123"
        
        // Register and login
        try await viewModel.register(email: email, username: username, password: password)
        XCTAssertTrue(viewModel.isLoggedIn)
        
        // Logout
        viewModel.logout()
        
        XCTAssertFalse(viewModel.isLoggedIn)
        XCTAssertNil(viewModel.currentAccount)
    }
}