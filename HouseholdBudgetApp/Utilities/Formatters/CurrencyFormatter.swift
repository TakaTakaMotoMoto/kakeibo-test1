import Foundation

final class CurrencyFormatter {
    static let shared = CurrencyFormatter()
    
    private let formatter: NumberFormatter
    
    private init() {
        formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale.current
    }
    
    func string(from decimal: Decimal) -> String {
        return formatter.string(from: decimal as NSDecimalNumber) ?? "¥0"
    }
    
    func string(from double: Double) -> String {
        return formatter.string(from: NSNumber(value: double)) ?? "¥0"
    }
    
    func updateLocale(_ locale: Locale) {
        formatter.locale = locale
    }
}