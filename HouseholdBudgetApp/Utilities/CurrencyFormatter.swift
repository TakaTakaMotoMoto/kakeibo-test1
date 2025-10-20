import Foundation

class CurrencyFormatter {
    static let shared = CurrencyFormatter()
    
    private let formatter: NumberFormatter
    
    private init() {
        formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale.current
        formatter.currencyCode = Locale.current.currency?.identifier ?? "JPY"
    }
    
    func string(from decimal: Decimal) -> String {
        return formatter.string(from: NSDecimalNumber(decimal: decimal)) ?? "¥0"
    }
    
    func string(from double: Double) -> String {
        return formatter.string(from: NSNumber(value: double)) ?? "¥0"
    }
    
    func decimal(from string: String) -> Decimal? {
        guard let number = formatter.number(from: string) else { return nil }
        return number.decimalValue
    }
}

extension DateFormatter {
    static let shortDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .none
        return formatter
    }()
    
    static let longDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .long
        formatter.timeStyle = .none
        return formatter
    }()
    
    static let longDateTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .long
        formatter.timeStyle = .short
        return formatter
    }()
    
    static func shortDate(from date: Date) -> String {
        return shortDate.string(from: date)
    }
    
    static func mediumDate(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
    
    static func fullDate(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
}