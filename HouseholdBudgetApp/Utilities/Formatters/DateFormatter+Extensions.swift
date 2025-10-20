import Foundation

extension DateFormatter {
    static let shared = DateFormatter()
    
    static let shortDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .none
        formatter.locale = Locale.current
        return formatter
    }()
    
    static let shortDateTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        formatter.locale = Locale.current
        return formatter
    }()
    
    static func localizedString(from date: Date, dateStyle: DateFormatter.Style = .medium, timeStyle: DateFormatter.Style = .none) -> String {
        shared.dateStyle = dateStyle
        shared.timeStyle = timeStyle
        shared.locale = Locale.current
        return shared.string(from: date)
    }
    
    static func shortDate(from date: Date) -> String {
        shared.dateStyle = .short
        shared.timeStyle = .none
        shared.locale = Locale.current
        return shared.string(from: date)
    }
    
    static func mediumDate(from date: Date) -> String {
        shared.dateStyle = .medium
        shared.timeStyle = .none
        shared.locale = Locale.current
        return shared.string(from: date)
    }
    
    static func longDate(from date: Date) -> String {
        shared.dateStyle = .long
        shared.timeStyle = .none
        shared.locale = Locale.current
        return shared.string(from: date)
    }
    
    static func longDateTime(from date: Date) -> String {
        shared.dateStyle = .long
        shared.timeStyle = .medium
        shared.locale = Locale.current
        return shared.string(from: date)
    }
    
    static func monthYear(from date: Date) -> String {
        shared.dateFormat = "MMMM yyyy"
        shared.locale = Locale.current
        return shared.string(from: date)
    }
}