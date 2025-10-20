import Foundation
import SwiftData

@Observable
final class CategoryViewModel {
    private let modelContext: ModelContext
    private let dataIntegrityService: DataIntegrityService
    
    var categories: [Category] = []
    var predefinedCategories: [Category] = []
    var currentError: BudgetAppError?
    
    // Deletion confirmation
    var showingDeleteConfirmation = false
    var categoryToDelete: Category?
    var subcategoryToDelete: Subcategory?
    
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
            // Check if category is in use
            if !category.transactions.isEmpty {
                throw BudgetAppError.categoryInUse
            }
            
            modelContext.delete(category)
            try modelContext.save()
            fetchCategories()
        } catch let budgetError as BudgetAppError {
            currentError = budgetError
        } catch {
            currentError = BudgetAppError.from(error, context: .categoryDelete)
        }
    }
    
    func confirmDeleteCategory(_ category: Category) {
        categoryToDelete = category
        showingDeleteConfirmation = true
    }
    
    func executeDeleteCategory() {
        guard let category = categoryToDelete else { return }
        deleteCategory(category)
        categoryToDelete = nil
        showingDeleteConfirmation = false
    }
    
    func cancelDeleteCategory() {
        categoryToDelete = nil
        showingDeleteConfirmation = false
    }
    
    func canDeleteCategory(_ category: Category) -> Bool {
        return category.transactions.isEmpty
    }
    
    // MARK: - Subcategory Operations
    
    func createSubcategory(name: String, for category: Category) {
        do {
            // Check for duplicate name within the same category
            if validateSubcategoryName(name, in: category) {
                throw BudgetAppError.duplicateSubcategoryName
            }
            
            let subcategory = Subcategory(name: name, category: category)
            modelContext.insert(subcategory)
            try modelContext.save()
            fetchCategories()
        } catch let budgetError as BudgetAppError {
            currentError = budgetError
        } catch {
            currentError = BudgetAppError.from(error, context: .subcategoryCreate)
        }
    }
    
    func updateSubcategory(_ subcategory: Subcategory, name: String) {
        do {
            // Check for duplicate name within the same category (excluding current subcategory)
            if let category = subcategory.category,
               validateSubcategoryName(name, in: category, excluding: subcategory) {
                throw BudgetAppError.duplicateSubcategoryName
            }
            
            subcategory.name = name
            try modelContext.save()
            fetchCategories()
        } catch let budgetError as BudgetAppError {
            currentError = budgetError
        } catch {
            currentError = BudgetAppError.from(error, context: .subcategoryUpdate)
        }
    }
    
    func deleteSubcategory(_ subcategory: Subcategory) {
        do {
            // Check if subcategory is in use
            if !subcategory.transactions.isEmpty {
                throw BudgetAppError.subcategoryInUse
            }
            
            modelContext.delete(subcategory)
            try modelContext.save()
            fetchCategories()
        } catch let budgetError as BudgetAppError {
            currentError = budgetError
        } catch {
            currentError = BudgetAppError.from(error, context: .subcategoryDelete)
        }
    }
    
    func confirmDeleteSubcategory(_ subcategory: Subcategory) {
        subcategoryToDelete = subcategory
        showingDeleteConfirmation = true
    }
    
    func executeDeleteSubcategory() {
        guard let subcategory = subcategoryToDelete else { return }
        deleteSubcategory(subcategory)
        subcategoryToDelete = nil
        showingDeleteConfirmation = false
    }
    
    func cancelDeleteSubcategory() {
        subcategoryToDelete = nil
        showingDeleteConfirmation = false
    }
    
    func canDeleteSubcategory(_ subcategory: Subcategory) -> Bool {
        return subcategory.transactions.isEmpty
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
    
    /// Validates if a subcategory name already exists within a category
    /// Returns true if duplicate exists, false if name is unique
    func validateSubcategoryName(_ name: String, in category: Category, excluding: Subcategory? = nil) -> Bool {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        
        return category.subcategories.contains { subcategory in
            // Skip the subcategory we're excluding (for updates)
            if let excluding = excluding, subcategory.id == excluding.id {
                return false
            }
            return subcategory.name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == trimmedName
        }
    }
    
    func clearError() {
        currentError = nil
    }
}