import SwiftUI

struct PasswordResetView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(UserAccountViewModel.self) private var userAccountViewModel
    @State private var email = ""
    @State private var resetToken = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var showingAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @State private var resetStep: ResetStep = .requestToken
    @State private var generatedToken = ""
    
    enum ResetStep {
        case requestToken
        case enterToken
        case setNewPassword
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Text("auth.resetPassword")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text(stepSubtitle)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 20)
                
                // Form based on current step
                VStack(spacing: 16) {
                    switch resetStep {
                    case .requestToken:
                        requestTokenForm
                    case .enterToken:
                        enterTokenForm
                    case .setNewPassword:
                        setNewPasswordForm
                    }
                }
                .padding(.horizontal)
                
                // Action Button
                Button(action: primaryAction) {
                    HStack {
                        if userAccountViewModel.isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                        }
                        Text(primaryButtonTitle)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isPrimaryButtonEnabled ? Color.blue : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(!isPrimaryButtonEnabled || userAccountViewModel.isLoading)
                .padding(.horizontal)
                
                // Secondary Actions
                if resetStep != .requestToken {
                    Button("auth.backToEmailEntry") {
                        resetStep = .requestToken
                        resetToken = ""
                        newPassword = ""
                        confirmPassword = ""
                    }
                    .foregroundColor(.blue)
                }
                
                Spacer()
            }
            .navigationTitle("auth.resetPassword")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("common.cancel") {
                        dismiss()
                    }
                }
            }
        }
        .alert(alertTitle, isPresented: $showingAlert) {
            Button("common.ok") { }
        } message: {
            Text(alertMessage)
        }
    }
    
    // MARK: - Form Views
    
    @ViewBuilder
    private var requestTokenForm: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("auth.email")
                .font(.headline)
            
            TextField("auth.emailPlaceholder", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .accessibilityLabel("auth.email")
        }
    }
    
    @ViewBuilder
    private var enterTokenForm: some View {
        VStack(spacing: 16) {
            Text("auth.tokenSentMessage")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            if !generatedToken.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("auth.generatedToken")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(generatedToken)
                        .font(.monospaced(.body)())
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                        .textSelection(.enabled)
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("auth.resetToken")
                    .font(.headline)
                
                TextField("auth.resetTokenPlaceholder", text: $resetToken)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .accessibilityLabel("auth.resetToken")
            }
        }
    }
    
    @ViewBuilder
    private var setNewPasswordForm: some View {
        VStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("auth.newPassword")
                    .font(.headline)
                
                SecureField("auth.passwordPlaceholder", text: $newPassword)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .accessibilityLabel("auth.newPassword")
                
                if !newPassword.isEmpty && !userAccountViewModel.validatePassword(newPassword) {
                    Text("auth.passwordRequirements")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("auth.confirmPassword")
                    .font(.headline)
                
                SecureField("auth.confirmPasswordPlaceholder", text: $confirmPassword)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .accessibilityLabel("auth.confirmPassword")
                
                if !confirmPassword.isEmpty && newPassword != confirmPassword {
                    Text("auth.passwordMismatch")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var stepSubtitle: String {
        switch resetStep {
        case .requestToken:
            return "auth.resetPasswordSubtitle"
        case .enterToken:
            return "auth.enterTokenSubtitle"
        case .setNewPassword:
            return "auth.setNewPasswordSubtitle"
        }
    }
    
    private var primaryButtonTitle: String {
        switch resetStep {
        case .requestToken:
            return "auth.sendResetToken"
        case .enterToken:
            return "auth.verifyToken"
        case .setNewPassword:
            return "auth.updatePassword"
        }
    }
    
    private var isPrimaryButtonEnabled: Bool {
        switch resetStep {
        case .requestToken:
            return !email.isEmpty
        case .enterToken:
            return !resetToken.isEmpty
        case .setNewPassword:
            return !newPassword.isEmpty &&
                   !confirmPassword.isEmpty &&
                   newPassword == confirmPassword &&
                   userAccountViewModel.validatePassword(newPassword)
        }
    }
    
    // MARK: - Actions
    
    private func primaryAction() {
        switch resetStep {
        case .requestToken:
            requestResetToken()
        case .enterToken:
            verifyToken()
        case .setNewPassword:
            updatePassword()
        }
    }
    
    private func requestResetToken() {
        Task {
            do {
                let token = try await userAccountViewModel.resetPassword(email: email)
                generatedToken = token // For demo purposes - in real app this would be sent via email
                resetStep = .enterToken
                alertTitle = "auth.success"
                alertMessage = "auth.resetTokenSent"
                showingAlert = true
            } catch {
                alertTitle = "auth.error"
                alertMessage = error.localizedDescription
                showingAlert = true
            }
        }
    }
    
    private func verifyToken() {
        // In a real app, you would verify the token with the server
        // For this demo, we'll just check if it matches the generated token
        if resetToken == generatedToken {
            resetStep = .setNewPassword
        } else {
            alertTitle = "auth.error"
            alertMessage = "auth.invalidToken"
            showingAlert = true
        }
    }
    
    private func updatePassword() {
        Task {
            do {
                try await userAccountViewModel.resetPasswordWithToken(token: resetToken, newPassword: newPassword)
                alertTitle = "auth.success"
                alertMessage = "auth.passwordUpdated"
                showingAlert = true
                
                // Dismiss after successful password reset
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    dismiss()
                }
            } catch {
                alertTitle = "auth.error"
                alertMessage = error.localizedDescription
                showingAlert = true
            }
        }
    }
}

#Preview {
    PasswordResetView()
        .environment(UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext))
}