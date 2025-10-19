import Foundation
import SwiftData

@Observable
final class CategoryViewModel {
    private let modelContext: ModelContext
    private let dataIntegrityService: DataIntegrityService
    
    var categories: [Category] = []
    var predefinedCategories: [Category] = []
    var currentError: BudgetAppError?
    
    init(modelContext: ModelContext, dataIntegrityService: DataIntegrityService = DataIntegrityService()) {
        self.modelContext = modelContext
        self.dataIntegrityService = dataIntegrityService
        fetchCategories()
        initializePredefinedCategoriesIfNeeded()
    }
    
    // MARK: - Category CRUD Operations
    
    func createCategory(name: String, iconName: String? = nil, colorHex: String = ColorManager.chartColorHex(for: 0)) {
        do {
            let category = Category(name: name, iconName: iconName, colorHex: colorHex, isCustom: true)
            
            // Validate category using data integrity service
            try dataIntegrityService.validateCategory(category)
            
            modelContext.insert(category)
            try modelContext.save()
            fetchCategories()
        } catch {
            currentError = BudgetAppError.from(error, context: .categoryCreate)
        }
    }
    
    func updateCategory(_ category: Category, name: String, iconName: String?, colorHex: String) {
        do {
            category.name = name
            category.iconName = iconName
            category.colorHex = colorHex
            
            // Validate updated category using data integrity service
            try dataIntegrityService.validateCategory(category)
            
            try modelContext.save()
            fetchCategories()
        } catch {
            currentError = BudgetAppError.from(error, context: .categoryUpdate)
        }
    }
    
    func deleteCategory(_ category: Category) {
        do {
            modelContext.delete(category)
            try modelContext.save()
            fetchCategories()
        } catch {
            currentError = BudgetAppError.from(error, context: .categoryDelete)
        }
    }
    
    // MARK: - Subcategory Operations
    
    func createSubcategory(name: String, for category: Category) {
        do {
            let subcategory = Subcategory(name: name, category: category)
            modelContext.insert(subcategory)
            try modelContext.save()
            fetchCategories()
        } catch {
            currentError = BudgetAppError.from(error, context: .subcategoryCreate)
        }
    }
    
    func deleteSubcategory(_ subcategory: Subcategory) {
        do {
            modelContext.delete(subcategory)
            try modelContext.save()
            fetchCategories()
        } catch {
            currentError = BudgetAppError.from(error, context: .subcategoryDelete)
        }
    }
    
    // MARK: - Data Fetching
    
    func fetchCategories() {
        do {
            let descriptor = FetchDescriptor<Category>(
                sortBy: [SortDescriptor(\.name)]
            )
            categories = try modelContext.fetch(descriptor)
        } catch {
            currentError = BudgetAppError.from(error, context: .categoryFetch)
        }
    }
    
    // MARK: - Predefined Categories Initialization
    
    private func initializePredefinedCategoriesIfNeeded() {
        // Check if predefined categories already exist
        let predefinedDescriptor = FetchDescriptor<Category>(
            predicate: #Predicate<Category> { !$0.isCustom }
        )
        
        do {
            let existingPredefined = try modelContext.fetch(predefinedDescriptor)
            if existingPredefined.isEmpty {
                initializePredefinedCategories()
            }
        } catch {
            currentError = BudgetAppError.categoryPredefinedCheckFailed(error)
        }
    }
    
    func initializePredefinedCategories() {
        let predefinedData: [(name: String, iconName: String, colorHex: String, subcategories: [String])] = [
            (LocalizedCategoryNames.food, "fork.knife", ColorManager.chartColorHex(for: 0), [LocalizedCategoryNames.foodGroceries, LocalizedCategoryNames.foodBeverages]),
            (LocalizedCategoryNames.transportation, "car.fill", ColorManager.chartColorHex(for: 1), []),
            (LocalizedCategoryNames.utilities, "bolt.fill", ColorManager.chartColorHex(for: 2), []),
            (LocalizedCategoryNames.entertainment, "gamecontroller.fill", ColorManager.chartColorHex(for: 3), []),
            (LocalizedCategoryNames.medical, "cross.fill", ColorManager.chartColorHex(for: 4), [])
        ]
        
        for data in predefinedData {
            let category = Category(
                name: data.name,
                iconName: data.iconName,
                colorHex: data.colorHex,
                isCustom: false
            )
            
            modelContext.insert(category)
            
            // Add subcategories if any
            for subcategoryName in data.subcategories {
                let subcategory = Subcategory(name: subcategoryName, category: category)
                modelContext.insert(subcategory)
            }
        }
        
        do {
            try modelContext.save()
            fetchCategories()
        } catch {
            currentError = BudgetAppError.categoryPredefinedInitFailed(error)
        }
    }
    
    // MARK: - Helper Methods
    
    func getSubcategories(for category: Category) -> [Subcategory] {
        return category.subcategories.sorted { $0.name < $1.name }
    }
    
    func clearError() {
        currentError = nil
    }
}