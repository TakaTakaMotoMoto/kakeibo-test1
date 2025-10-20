import SwiftUI

struct ColorManager {
    // MARK: - App Colors
    static let primaryAccent = Color("PrimaryAccent", bundle: .main)
    static let cardBackground = Color("CardBackground", bundle: .main)
    static let errorColor = Color("ErrorColor", bundle: .main)
    
    // MARK: - Chart Colors
    private static let chartColors = [
        Color("ChartColor1", bundle: .main),
        Color("ChartColor2", bundle: .main),
        Color("ChartColor3", bundle: .main),
        Color("ChartColor4", bundle: .main),
        Color("ChartColor5", bundle: .main)
    ]
    
    // MARK: - Chart Color Methods
    static func chartColor(for index: Int) -> Color {
        return chartColors[index % chartColors.count]
    }
    
    static func chartColorHex(for index: Int) -> String {
        // Return hex values that work well in both light and dark modes
        let hexColors = [
            "#FF6B6B", // Red-ish
            "#4ECDC4", // Teal
            "#45B7D1", // Blue
            "#96CEB4", // Green
            "#FFEAA7"  // Yellow
        ]
        return hexColors[index % hexColors.count]
    }
    
    // MARK: - Category Colors
    static func categoryColor(from hex: String) -> Color {
        // Convert hex to Color, but ensure it works well in dark mode
        return Color(hex: hex)
    }
    
    // MARK: - Semantic Colors
    static let primaryColor = Color.accentColor
    static let primaryText = Color.primary
    static let secondaryText = Color.secondary
    static let tertiaryText = Color(UIColor.tertiaryLabel)
    static let borderColor = Color(UIColor.separator)
    static let background = Color(UIColor.systemBackground)
    static let secondaryBackground = Color(UIColor.secondarySystemBackground)
    static let groupedBackground = Color(UIColor.systemGroupedBackground)
}

// MARK: - Color Extension for Hex Support
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}