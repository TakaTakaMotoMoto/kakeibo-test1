import XCTest
import SwiftData
@testable import HouseholdBudgetApp

@MainActor
final class CategoryViewModelTests: XCTestCase {
    var modelContainer: ModelContainer!
    var modelContext: ModelContext!
    var categoryViewModel: CategoryViewModel!
    var dataIntegrityService: DataIntegrityService!
    
    override func setUp() async throws {
        try await super.setUp()
        
        // Create in-memory model container for testing
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        modelContainer = try ModelContainer(for: Transaction.self, Category.self, Subcategory.self, FundSource.self, UserAccount.self, configurations: config)
        modelContext = ModelContext(modelContainer)
        
        // Initialize services and view models
        dataIntegrityService = DataIntegrityService()
        categoryViewModel = CategoryViewModel(modelContext: modelContext, dataIntegrityService: dataIntegrityService)
    }
    
    override func tearDown() async throws {
        modelContainer = nil
        modelContext = nil
        categoryViewModel = nil
        dataIntegrityService = nil
        try await super.tearDown()
    }
    
    // MARK: - Category Creation Tests
    
    func testCreateCategory_Success() {
        // Given
        let initialCategoryCount = categoryViewModel.categories.count
        let categoryName = "Test Category"
        let iconName = "test.icon"
        let colorHex = "#FF0000"
        
        // When
        categoryViewModel.createCategory(name: categoryName, iconName: iconName, colorHex: colorHex)
        
        // Then
        XCTAssertEqual(categoryViewModel.categories.count, initialCategoryCount + 1)
        XCTAssertNil(categoryViewModel.currentError)
        
        // Verify category details
        let createdCategory = categoryViewModel.categories.first { $0.name == categoryName }
        XCTAssertNotNil(createdCategory)
        XCTAssertEqual(createdCategory?.iconName, iconName)
        XCTAssertEqual(createdCategory?.colorHex, colorHex)
        XCTAssertTrue(createdCategory?.isCustom ?? false)
    }
    
    func testCreateCategory_EmptyName() {
        // Given
        let initialCategoryCount = categoryViewModel.categories.count
        
        // When
        categoryViewModel.createCategory(name: "", iconName: "test.icon", colorHex: "#FF0000")
        
        // Then
        XCTAssertEqual(categoryViewModel.categories.count, initialCategoryCount)
        XCTAssertNotNil(categoryViewModel.currentError)
    }
    
    // MARK: - Category Update Tests
    
    func testUpdateCategory_Success() {
        // Given - Create initial category
        categoryViewModel.createCategory(name: "Original Name", iconName: "original.icon", colorHex: "#FF0000")
        let category = categoryViewModel.categories.first { $0.name == "Original Name" }
        XCTAssertNotNil(category)
        
        let newName = "Updated Name"
        let newIconName = "updated.icon"
        let newColorHex = "#00FF00"
        
        // When
        categoryViewModel.updateCategory(category!, name: newName, iconName: newIconName, colorHex: newColorHex)
        
        // Then
        XCTAssertNil(categoryViewModel.currentError)
        XCTAssertEqual(category?.name, newName)
        XCTAssertEqual(category?.iconName, newIconName)
        XCTAssertEqual(category?.colorHex, newColorHex)
    }
    
    // MARK: - Category Deletion Tests
    
    func testDeleteCategory_Success() {
        // Given
        categoryViewModel.createCategory(name: "Category to Delete", iconName: "delete.icon", colorHex: "#FF0000")
        let category = categoryViewModel.categories.first { $0.name == "Category to Delete" }
        XCTAssertNotNil(category)
        
        let initialCategoryCount = categoryViewModel.categories.count
        
        // When
        categoryViewModel.deleteCategory(category!)
        
        // Then
        XCTAssertEqual(categoryViewModel.categories.count, initialCategoryCount - 1)
        XCTAssertNil(categoryViewModel.currentError)
        XCTAssertNil(categoryViewModel.categories.first { $0.name == "Category to Delete" })
    }
    
    // MARK: - Subcategory Tests
    
    func testCreateSubcategory_Success() {
        // Given
        categoryViewModel.createCategory(name: "Parent Category", iconName: "parent.icon", colorHex: "#FF0000")
        let parentCategory = categoryViewModel.categories.first { $0.name == "Parent Category" }
        XCTAssertNotNil(parentCategory)
        
        let subcategoryName = "Test Subcategory"
        
        // When
        categoryViewModel.createSubcategory(name: subcategoryName, for: parentCategory!)
        
        // Then
        XCTAssertNil(categoryViewModel.currentError)
        
        // Refresh categories to get updated subcategories
        categoryViewModel.fetchCategories()
        let updatedCategory = categoryViewModel.categories.first { $0.name == "Parent Category" }
        XCTAssertEqual(updatedCategory?.subcategories.count, 1)
        XCTAssertEqual(updatedCategory?.subcategories.first?.name, subcategoryName)
    }
    
    func testDeleteSubcategory_Success() {
        // Given - Create category with subcategory
        categoryViewModel.createCategory(name: "Parent Category", iconName: "parent.icon", colorHex: "#FF0000")
        let parentCategory = categoryViewModel.categories.first { $0.name == "Parent Category" }
        categoryViewModel.createSubcategory(name: "Subcategory to Delete", for: parentCategory!)
        
        categoryViewModel.fetchCategories()
        let updatedCategory = categoryViewModel.categories.first { $0.name == "Parent Category" }
        let subcategory = updatedCategory?.subcategories.first
        XCTAssertNotNil(subcategory)
        
        // When
        categoryViewModel.deleteSubcategory(subcategory!)
        
        // Then
        XCTAssertNil(categoryViewModel.currentError)
        
        // Refresh and verify subcategory was deleted
        categoryViewModel.fetchCategories()
        let finalCategory = categoryViewModel.categories.first { $0.name == "Parent Category" }
        XCTAssertEqual(finalCategory?.subcategories.count, 0)
    }
    
    // MARK: - Predefined Categories Tests
    
    func testInitializePredefinedCategories() {
        // Given - Clear any existing categories
        for category in categoryViewModel.categories {
            categoryViewModel.deleteCategory(category)
        }
        
        // When
        categoryViewModel.initializePredefinedCategories()
        
        // Then
        XCTAssertNil(categoryViewModel.currentError)
        XCTAssertGreaterThan(categoryViewModel.categories.count, 0)
        
        // Verify predefined categories exist
        let predefinedCategories = categoryViewModel.categories.filter { !$0.isCustom }
        XCTAssertGreaterThan(predefinedCategories.count, 0)
        
        // Check for specific predefined categories
        let foodCategory = categoryViewModel.categories.first { $0.name.contains("食費") || $0.name.contains("Food") }
        XCTAssertNotNil(foodCategory)
        XCTAssertFalse(foodCategory?.isCustom ?? true)
    }
    
    // MARK: - Helper Methods Tests
    
    func testGetSubcategories() {
        // Given
        categoryViewModel.createCategory(name: "Test Category", iconName: "test.icon", colorHex: "#FF0000")
        let category = categoryViewModel.categories.first { $0.name == "Test Category" }
        categoryViewModel.createSubcategory(name: "Subcategory B", for: category!)
        categoryViewModel.createSubcategory(name: "Subcategory A", for: category!)
        
        categoryViewModel.fetchCategories()
        let updatedCategory = categoryViewModel.categories.first { $0.name == "Test Category" }
        
        // When
        let subcategories = categoryViewModel.getSubcategories(for: updatedCategory!)
        
        // Then
        XCTAssertEqual(subcategories.count, 2)
        // Verify they are sorted alphabetically
        XCTAssertEqual(subcategories[0].name, "Subcategory A")
        XCTAssertEqual(subcategories[1].name, "Subcategory B")
    }
}