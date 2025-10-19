import SwiftUI

/// Helper utilities for accessibility features
struct AccessibilityHelper {
    
    /// Returns appropriate font size based on Dynamic Type settings
    static func dynamicFont(_ style: Font.TextStyle, maxSize: CGFloat? = nil) -> Font {
        if let maxSize = maxSize {
            return .system(style).weight(.regular)
        }
        return .system(style)
    }
    
    /// Creates an accessibility-friendly button with proper labels and hints
    static func accessibleButton<Content: View>(
        action: @escaping () -> Void,
        label: String,
        hint: String? = nil,
        @ViewBuilder content: () -> Content
    ) -> some View {
        Button(action: action) {
            content()
        }
        .accessibilityLabel(label)
        .accessibilityHint(hint ?? "")
    }
    
    /// Creates an accessibility-friendly picker with proper labels
    static func accessiblePicker<SelectionValue: Hashable, Content: View>(
        selection: Binding<SelectionValue>,
        label: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        Picker(label, selection: selection) {
            content()
        }
        .accessibilityLabel(label)
    }
    
    /// Formats accessibility values for currency amounts
    static func formatCurrencyForAccessibility(_ amount: Decimal) -> String {
        return CurrencyFormatter.shared.string(from: amount)
    }
    
    /// Formats accessibility values for dates
    static func formatDateForAccessibility(_ date: Date) -> String {
        return DateFormatter.shortDate(from: date)
    }
    
    /// Creates accessibility traits for different UI elements
    static func traitsFor(element: AccessibilityElement) -> AccessibilityTraits {
        switch element {
        case .button:
            return .isButton
        case .header:
            return .isHeader
        case .staticText:
            return .isStaticText
        case .adjustable:
            return .adjustsValue
        case .link:
            return .isLink
        case .image:
            return .isImage
        }
    }
}

enum AccessibilityElement {
    case button
    case header
    case staticText
    case adjustable
    case link
    case image
}

/// View modifier for consistent Dynamic Type support
struct DynamicTypeModifier: ViewModifier {
    let textStyle: Font.TextStyle
    let maxSize: CGFloat?
    
    init(_ textStyle: Font.TextStyle, maxSize: CGFloat? = nil) {
        self.textStyle = textStyle
        self.maxSize = maxSize
    }
    
    func body(content: Content) -> some View {
        content
            .font(.system(textStyle))
            .dynamicTypeSize(.medium...(.accessibility3))
    }
}

extension View {
    /// Applies Dynamic Type support with optional maximum size
    func dynamicType(_ textStyle: Font.TextStyle, maxSize: CGFloat? = nil) -> some View {
        self.modifier(DynamicTypeModifier(textStyle, maxSize: maxSize))
    }
    
    /// Makes an element accessible with proper label and hint
    func makeAccessible(label: String, hint: String? = nil, value: String? = nil) -> some View {
        self
            .accessibilityLabel(label)
            .accessibilityHint(hint ?? "")
            .accessibilityValue(value ?? "")
    }
    
    /// Combines child accessibility elements
    func combineAccessibility() -> some View {
        self.accessibilityElement(children: .combine)
    }
    
    /// Hides decorative elements from accessibility
    func hideFromAccessibility() -> some View {
        self.accessibilityHidden(true)
    }
}

/// String extension for localized accessibility strings
extension String {
    func localizedAccessibility(with arguments: CVarArg...) -> String {
        return String(format: NSLocalizedString(self, comment: ""), arguments: arguments)
    }
}