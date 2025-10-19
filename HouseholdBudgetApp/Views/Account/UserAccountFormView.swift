import SwiftUI

struct UserAccountFormView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: UserAccountViewModel
    
    let account: UserAccount?
    
    @State private var username: String = ""
    @State private var email: String = ""
    @State private var showingError = false
    
    private var isEditing: Bool {
        account != nil
    }
    
    private var isFormValid: Bool {
        !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        email.contains("@")
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("account.username".localized) {
                    TextField("account.username".localized, text: $username)
                        .textContentType(.username)
                        .autocapitalization(.none)
                        .accessibilityLabel("account.username".localized)
                        .accessibilityHint("accessibility.hint.formField".localized)
                }
                
                Section("account.email".localized) {
                    TextField("account.email".localized, text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .accessibilityLabel("account.email".localized)
                        .accessibilityHint("accessibility.hint.formField".localized)
                }
                
                if let error = viewModel.currentError {
                    Section {
                        Text(error.localizedDescription)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle(isEditing ? "account.editAccount".localized : "account.createAccount".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("action.save".localized) {
                        saveAccount()
                    }
                    .disabled(!isFormValid)
                }
            }
            .onAppear {
                if let account = account {
                    username = account.username
                    email = account.email
                }
            }
            .onChange(of: viewModel.currentError) { _, error in
                showingError = error != nil
            }
        }
    }
    
    private func saveAccount() {
        viewModel.clearError()
        
        if let account = account {
            viewModel.updateAccount(account, username: username, email: email)
        } else {
            viewModel.createAccount(username: username, email: email)
        }
        
        if viewModel.currentError == nil {
            dismiss()
        }
    }
}

#Preview {
    UserAccountFormView(viewModel: UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext), account: nil)
}