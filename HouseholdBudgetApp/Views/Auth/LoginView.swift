import SwiftUI

struct LoginView: View {
    @Environment(UserAccountViewModel.self) private var userAccountViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var showingRegistration = false
    @State private var showingPasswordReset = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // App Logo/Title
                VStack(spacing: 8) {
                    Image(systemName: "chart.pie.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)
                    
                    Text("auth.appTitle")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("auth.loginSubtitle")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)
                
                // Login Form
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
                        Text("auth.password")
                            .font(.headline)
                        
                        SecureField("auth.passwordPlaceholder", text: $password)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .accessibilityLabel("auth.password")
                    }
                }
                .padding(.horizontal)
                
                // Login Button
                Button(action: loginAction) {
                    HStack {
                        if userAccountViewModel.isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                        }
                        Text("auth.login")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(email.isEmpty || password.isEmpty || userAccountViewModel.isLoading)
                .padding(.horizontal)
                
                // Additional Actions
                VStack(spacing: 12) {
                    Button("auth.forgotPassword") {
                        showingPasswordReset = true
                    }
                    .foregroundColor(.blue)
                    
                    HStack {
                        Text("auth.noAccount")
                        Button("auth.signUp") {
                            showingRegistration = true
                        }
                        .foregroundColor(.blue)
                    }
                }
                
                Spacer()
            }
            .navigationTitle("auth.login")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showingRegistration) {
            RegisterView()
        }
        .sheet(isPresented: $showingPasswordReset) {
            PasswordResetView()
        }
        .alert("auth.error", isPresented: $showingAlert) {
            Button("common.ok") { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private func loginAction() {
        Task {
            do {
                try await userAccountViewModel.login(email: email, password: password)
            } catch {
                alertMessage = error.localizedDescription
                showingAlert = true
            }
        }
    }
}

#Preview {
    LoginView()
        .environment(UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext))
}