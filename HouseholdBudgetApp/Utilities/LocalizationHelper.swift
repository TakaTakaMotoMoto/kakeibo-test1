import Foundation

// MARK: - Localization Helper

func NSLocalizedString(_ key: String, comment: String = "") -> String {
    return Bundle.main.localizedString(forKey: key, value: nil, table: nil)
}

// MARK: - Convenience Extensions

extension String {
    var localized: String {
        return NSLocalizedString(self)
    }
    
    func localized(with arguments: CVarArg...) -> String {
        return String(format: NSLocalizedString(self), arguments: arguments)
    }
}

// MARK: - Localized Category Names

struct LocalizedCategoryNames {
    static let food = "category.food".localized
    static let transportation = "category.transportation".localized
    static let utilities = "category.utilities".localized
    static let entertainment = "category.entertainment".localized
    static let medical = "category.medical".localized
    
    static let foodGroceries = "subcategory.food.groceries".localized
    static let foodBeverages = "subcategory.food.beverages".localized
}