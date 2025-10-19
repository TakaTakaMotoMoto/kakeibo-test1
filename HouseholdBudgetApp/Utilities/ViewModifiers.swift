import SwiftUI

// MARK: - Card Style Modifier
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(ColorManager.cardBackground)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
}

// MARK: - Error Text Style Modifier
struct ErrorTextStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .foregroundColor(ColorManager.errorColor)
            .font(.caption)
    }
}

// MARK: - Secondary Text Style Modifier
struct SecondaryTextStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .foregroundColor(ColorManager.secondaryText)
    }
}

// MARK: - Primary Text Style Modifier
struct PrimaryTextStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .foregroundColor(ColorManager.primaryText)
    }
}

// MARK: - Error Alert Modifier
struct ErrorAlert: ViewModifier {
    @Binding var error: BudgetAppError?
    
    func body(content: Content) -> some View {
        content
            .alert("error.title".localized, isPresented: .constant(error != nil)) {
                Button("action.ok".localized) {
                    error = nil
                }
            } message: {
                if let error = error {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(error.localizedDescription)
                        
                        if let recoverySuggestion = error.recoverySuggestion {
                            Text(recoverySuggestion)
                                .font(.caption)
                        }
                    }
                }
            }
    }
}

// MARK: - Inline Error Message Modifier
struct InlineErrorMessage: ViewModifier {
    let errorMessage: String?
    
    func body(content: Content) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            content
            
            if let errorMessage = errorMessage {
                Text(errorMessage)
                    .errorTextStyle()
                    .transition(.opacity.combined(with: .move(edge: .top)))
                    .animation(.easeInOut(duration: 0.3), value: errorMessage)
            }
        }
    }
}

// MARK: - Form Field Validation Modifier
struct FormFieldValidation: ViewModifier {
    let isValid: Bool
    let errorMessage: String?
    
    func body(content: Content) -> some View {
        content
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(
                        isValid ? Color.clear : ColorManager.errorColor,
                        lineWidth: 1
                    )
            )
            .modifier(InlineErrorMessage(errorMessage: isValid ? nil : errorMessage))
    }
}

// MARK: - View Extensions
extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
    
    func errorTextStyle() -> some View {
        modifier(ErrorTextStyle())
    }
    
    func secondaryTextStyle() -> some View {
        modifier(SecondaryTextStyle())
    }
    
    func primaryTextStyle() -> some View {
        modifier(PrimaryTextStyle())
    }
    
    /// Shows an error alert when the error is not nil
    func errorAlert(_ error: Binding<BudgetAppError?>) -> some View {
        modifier(ErrorAlert(error: error))
    }
    
    /// Shows an inline error message below the view
    func inlineError(_ errorMessage: String?) -> some View {
        modifier(InlineErrorMessage(errorMessage: errorMessage))
    }
    
    /// Adds form field validation styling and inline error message
    func formFieldValidation(isValid: Bool, errorMessage: String?) -> some View {
        modifier(FormFieldValidation(isValid: isValid, errorMessage: errorMessage))
    }
}