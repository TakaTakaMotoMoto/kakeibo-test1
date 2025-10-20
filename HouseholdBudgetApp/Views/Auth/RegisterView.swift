import SwiftUI

struct RegisterView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(UserAccountViewModel.self) private var userAccountViewModel
    @State private var email = ""
    @State private var username = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var passwordValidationMessage = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Text("auth.createAccount")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("auth.registerSubtitle")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 20)
                
                // Registration Form
                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("auth.email")
                            .font(.headline)
                        
                        TextField("auth.emailPlaceholder", text: $email)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .accessibilityLabel("auth.email")
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("auth.username")
                            .font(.headline)
                        
                        TextField("auth.usernamePlaceholder", text: $username)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .accessibilityLabel("auth.username")
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("auth.password")
                            .font(.headline)
                        
                        SecureField("auth.passwordPlaceholder", text: $password)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .accessibilityLabel("auth.password")
                            .onChange(of: password) { _, newValue in
                                validatePassword(newValue)
                            }
                        
                        if !passwordValidationMessage.isEmpty {
                            Text(passwordValidationMessage)
                                .font(.caption)
                                .foregroundColor(userAccountViewModel.validatePassword(password) ? .green : .red)
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("auth.confirmPassword")
                            .font(.headline)
                        
                        SecureField("auth.confirmPasswordPlaceholder", text: $confirmPassword)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .accessibilityLabel("auth.confirmPassword")
                        
                        if !confirmPassword.isEmpty && password != confirmPassword {
                            Text("auth.passwordMismatch")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                }
                .padding(.horizontal)
                
                // Register Button
                Button(action: registerAction) {
                    HStack {
                        if userAccountViewModel.isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                        }
                        Text("auth.createAccount")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isFormValid ? Color.blue : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(!isFormValid || userAccountViewModel.isLoading)
                .padding(.horizontal)
                
                Spacer()
            }
            .navigationTitle("auth.signUp")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("common.cancel") {
                        dismiss()
                    }
                }
            }
        }
        .alert("auth.error", isPresented: $showingAlert) {
            Button("common.ok") { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private var isFormValid: Bool {
        !email.isEmpty &&
        !username.isEmpty &&
        !password.isEmpty &&
        !confirmPassword.isEmpty &&
        password == confirmPassword &&
        userAccountViewModel.validatePassword(password)
    }
    
    private func validatePassword(_ password: String) {
        if password.isEmpty {
            passwordValidationMessage = ""
        } else if userAccountViewModel.validatePassword(password) {
            passwordValidationMessage = "auth.passwordValid"
        } else {
            passwordValidationMessage = "auth.passwordRequirements"
        }
    }
    
    private func registerAction() {
        Task {
            do {
                try await userAccountViewModel.register(email: email, username: username, password: password)
                dismiss()
            } catch {
                alertMessage = error.localizedDescription
                showingAlert = true
            }
        }
    }
}

#Preview {
    RegisterView()
        .environment(UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext))
}