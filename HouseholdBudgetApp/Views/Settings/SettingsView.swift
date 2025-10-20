import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(UserAccountViewModel.self) private var userAccountViewModel
    @EnvironmentObject private var dataIntegrityService: DataIntegrityService
    @State private var showingIntegrityAlert = false
    @State private var showingBackupAlert = false
    @State private var showingRecoveryAlert = false
    @State private var alertMessage = ""
    @State private var isPerformingOperation = false
    @State private var showingAccountSettings = false
    @State private var showingSharingSettings = false
    @State private var showingIntegrationTests = false
    @State private var showingLogoutConfirmation = false
    
    @State private var fundSourceViewModel: FundSourceViewModel?
    
    // MARK: - App Information
    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }
    
    private var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
    
    private var appName: String {
        Bundle.main.infoDictionary?["CFBundleDisplayName"] as? String ?? 
        Bundle.main.infoDictionary?["CFBundleName"] as? String ?? "家計簿"
    }
    
    var body: some View {
        NavigationView {
            List {
                Section("settings.account".localized) {
                    if userAccountViewModel.isLoggedIn, let currentAccount = userAccountViewModel.currentAccount {
                        // Current Account Info
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "person.circle.fill")
                                    .foregroundColor(ColorManager.primaryAccent)
                                    .font(.title2)
                                    .accessibilityHidden(true)
                                VStack(alignment: .leading) {
                                    Text(currentAccount.username)
                                        .font(.headline)
                                        .foregroundColor(.primary)
                                    Text(currentAccount.email)
                                        .font(.caption)
                                        .foregroundColor(ColorManager.secondaryText)
                                    if let lastLogin = currentAccount.lastLoginDate {
                                        Text("Last login: \(DateFormatter.localizedString(from: lastLogin, dateStyle: .short, timeStyle: .short))")
                                            .font(.caption2)
                                            .foregroundColor(ColorManager.secondaryText)
                                    }
                                }
                                Spacer()
                            }
                        }
                        .padding(.vertical, 4)
                        
                        // Account Management
                        Button(action: { showingAccountSettings = true }) {
                            HStack {
                                Image(systemName: "person.badge.key")
                                    .foregroundColor(.blue)
                                    .accessibilityHidden(true)
                                Text("settings.manageAccounts")
                                    .font(.body)
                                    .foregroundColor(.primary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .foregroundColor(ColorManager.secondaryText)
                                    .font(.caption)
                            }
                        }
                        .padding(.vertical, 4)
                        
                        // Sign Out
                        Button(action: { showingLogoutConfirmation = true }) {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                    .foregroundColor(.red)
                                    .accessibilityHidden(true)
                                Text("settings.signOut")
                                    .font(.body)
                                    .foregroundColor(.red)
                                Spacer()
                            }
                        }
                        .padding(.vertical, 4)
                    } else {
                        // Not logged in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "person.circle")
                                    .foregroundColor(ColorManager.secondaryText)
                                    .font(.title2)
                                    .accessibilityHidden(true)
                                VStack(alignment: .leading) {
                                    Text("settings.noAccount")
                                        .font(.headline)
                                        .foregroundColor(.primary)
                                    Text("settings.createAccountHint")
                                        .font(.caption)
                                        .foregroundColor(ColorManager.secondaryText)
                                }
                                Spacer()
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
                
                Section("settings.sharing".localized) {
                    Button(action: { showingSharingSettings = true }) {
                        HStack {
                            Image(systemName: "person.2")
                                .foregroundColor(.green)
                                .accessibilityHidden(true)
                            VStack(alignment: .leading) {
                                Text("settings.budgetSharing".localized)
                                    .font(.body)
                                    .foregroundColor(.primary)
                                if let currentAccount = userAccountViewModel.currentAccount {
                                    let sharedCount = currentAccount.sharedFundSources.count
                                    Text(sharedCount > 0 ? "\(sharedCount)個の資金元を共有中" : "sharing.notShared".localized)
                                        .font(.caption)
                                        .foregroundColor(ColorManager.secondaryText)
                                } else {
                                    Text("account.noAccount".localized)
                                        .font(.caption)
                                        .foregroundColor(ColorManager.secondaryText)
                                }
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(ColorManager.secondaryText)
                                .font(.caption)
                        }
                    }
                    .disabled(!userAccountViewModel.isLoggedIn)
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("settings.budgetSharing".localized)
                }
                
                Section("settings.categories".localized) {
                    NavigationLink(destination: SubcategoryManagementView(viewModel: CategoryViewModel(modelContext: modelContext))) {
                        HStack {
                            Image(systemName: "folder.badge.gearshape")
                                .foregroundColor(.orange)
                                .accessibilityHidden(true)
                            VStack(alignment: .leading) {
                                Text("subcategory.management".localized)
                                    .font(.body)
                                    .foregroundColor(.primary)
                                Text("settings.categoriesDescription".localized)
                                    .font(.caption)
                                    .foregroundColor(ColorManager.secondaryText)
                            }
                            Spacer()
                        }
                    }
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("subcategory.management".localized)
                }
                
                Section("settings.dataManagement".localized) {
                    // Integration Tests
                    Button(action: { showingIntegrationTests = true }) {
                        HStack {
                            Image(systemName: "testtube.2")
                                .foregroundColor(.purple)
                                .accessibilityHidden(true)
                            Text("Integration Tests")
                                .font(.body)
                                .foregroundColor(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(ColorManager.secondaryText)
                                .font(.caption)
                        }
                    }
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Integration Tests")
                    
                    // Data Integrity Check
                    Button(action: performIntegrityCheck) {
                        HStack {
                            Image(systemName: "checkmark.shield")
                                .foregroundColor(.blue)
                                .accessibilityHidden(true)
                            VStack(alignment: .leading) {
                                Text("settings.integrityCheck".localized)
                                    .font(.body)
                                    .foregroundColor(.primary)
                                if let lastCheck = dataIntegrityService.lastIntegrityCheckDate {
                                    Text("settings.lastCheck".localized(with: DateFormatter.localizedString(from: lastCheck, dateStyle: .short, timeStyle: .short)))
                                        .font(.caption)
                                        .foregroundColor(ColorManager.secondaryText)
                                }
                            }
                            Spacer()
                            if dataIntegrityService.isPerformingIntegrityCheck {
                                ProgressView()
                                    .scaleEffect(0.8)
                            }
                        }
                    }
                    .disabled(dataIntegrityService.isPerformingIntegrityCheck || isPerformingOperation)
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("settings.integrityCheck".localized)
                    
                    // Create Backup
                    Button(action: createBackup) {
                        HStack {
                            Image(systemName: "doc.on.doc")
                                .foregroundColor(.green)
                                .accessibilityHidden(true)
                            Text("settings.createBackup".localized)
                                .font(.body)
                                .foregroundColor(.primary)
                            Spacer()
                            if isPerformingOperation {
                                ProgressView()
                                    .scaleEffect(0.8)
                            }
                        }
                    }
                    .disabled(dataIntegrityService.isPerformingIntegrityCheck || isPerformingOperation)
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("settings.createBackup".localized)
                    
                    // Data Recovery
                    Button(action: performDataRecovery) {
                        HStack {
                            Image(systemName: "arrow.clockwise.circle")
                                .foregroundColor(.orange)
                                .accessibilityHidden(true)
                            Text("settings.dataRecovery".localized)
                                .font(.body)
                                .foregroundColor(.primary)
                            Spacer()
                            if isPerformingOperation {
                                ProgressView()
                                    .scaleEffect(0.8)
                            }
                        }
                    }
                    .disabled(dataIntegrityService.isPerformingIntegrityCheck || isPerformingOperation)
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("settings.dataRecovery".localized)
                    
                    if dataIntegrityService.integrityIssuesFound > 0 {
                        HStack {
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundColor(.red)
                                .accessibilityHidden(true)
                            Text("integrity.issuesFound".localized(with: "\(dataIntegrityService.integrityIssuesFound)"))
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                        .padding(.vertical, 2)
                    }
                }
                
                Section("settings.appInfo".localized) {
                    // App Version
                    HStack {
                        Image(systemName: "info.circle")
                            .foregroundColor(ColorManager.secondaryText)
                            .accessibilityHidden(true)
                        Text("settings.version".localized)
                            .font(.body)
                        Spacer()
                        Text(appVersion)
                            .foregroundColor(ColorManager.secondaryText)
                            .font(.body)
                    }
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("settings.version".localized)
                    .accessibilityValue(appVersion)
                    
                    // Build Number
                    HStack {
                        Image(systemName: "hammer.circle")
                            .foregroundColor(ColorManager.secondaryText)
                            .accessibilityHidden(true)
                        Text("settings.buildNumber".localized)
                            .font(.body)
                        Spacer()
                        Text(buildNumber)
                            .foregroundColor(ColorManager.secondaryText)
                            .font(.body)
                    }
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("settings.buildNumber".localized)
                    .accessibilityValue(buildNumber)
                    
                    // App Name
                    HStack {
                        Image(systemName: "app.badge")
                            .foregroundColor(ColorManager.secondaryText)
                            .accessibilityHidden(true)
                        Text("settings.appName".localized)
                            .font(.body)
                        Spacer()
                        Text(appName)
                            .foregroundColor(ColorManager.secondaryText)
                            .font(.body)
                    }
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("settings.appName".localized)
                    .accessibilityValue(appName)
                    
                    // Help
                    HStack {
                        Image(systemName: "questionmark.circle")
                            .foregroundColor(.orange)
                            .accessibilityHidden(true)
                        Text("settings.help".localized)
                            .font(.body)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(ColorManager.secondaryText)
                            .font(.caption)
                    }
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("settings.help".localized)
                    .accessibilityHint("accessibility.hint.helpSection".localized)
                }
            }
            .navigationTitle("nav.settings".localized)
            .alert("Data Management", isPresented: $showingIntegrityAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
            .alert("Backup Created", isPresented: $showingBackupAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
            .alert("Data Recovery", isPresented: $showingRecoveryAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
            .sheet(isPresented: $showingAccountSettings) {
                UserAccountListView(viewModel: userAccountViewModel)
            }
            .sheet(isPresented: $showingSharingSettings) {
                if let fundSourceViewModel = fundSourceViewModel {
                    SharingSettingsView(
                        userAccountViewModel: userAccountViewModel,
                        fundSourceViewModel: fundSourceViewModel
                    )
                }
            }
            .confirmationDialog("Sign Out", isPresented: $showingLogoutConfirmation) {
                Button("settings.signOut", role: .destructive) {
                    userAccountViewModel.logout()
                }
                Button("common.cancel", role: .cancel) { }
            } message: {
                Text("Are you sure you want to sign out?")
            }
            .sheet(isPresented: $showingIntegrationTests) {
                IntegrationTestView(modelContext: modelContext)
            }
            .onAppear {
                // Initialize FundSourceViewModel with the actual modelContext
                if fundSourceViewModel == nil {
                    fundSourceViewModel = FundSourceViewModel(modelContext: modelContext)
                }
            }
        }
    }
    
    // MARK: - Actions
    
    private func performIntegrityCheck() {
        guard let container = modelContext.container else { return }
        
        Task {
            do {
                try await dataIntegrityService.performIntegrityCheck(container: container)
                
                await MainActor.run {
                    alertMessage = "integrity.checkCompleted".localized
                    showingIntegrityAlert = true
                }
            } catch {
                await MainActor.run {
                    alertMessage = error.localizedDescription
                    showingIntegrityAlert = true
                }
            }
        }
    }
    
    private func createBackup() {
        guard let container = modelContext.container else { return }
        
        isPerformingOperation = true
        
        Task {
            do {
                let backupURL = try await dataIntegrityService.createBackup(container: container)
                
                await MainActor.run {
                    isPerformingOperation = false
                    alertMessage = "backup.created".localized + "\n\(backupURL.lastPathComponent)"
                    showingBackupAlert = true
                }
            } catch {
                await MainActor.run {
                    isPerformingOperation = false
                    alertMessage = error.localizedDescription
                    showingBackupAlert = true
                }
            }
        }
    }
    
    private func performDataRecovery() {
        guard let container = modelContext.container else { return }
        
        isPerformingOperation = true
        
        Task {
            do {
                try await dataIntegrityService.performDataRecovery(container: container)
                
                await MainActor.run {
                    isPerformingOperation = false
                    alertMessage = "integrity.recoveryCompleted".localized
                    showingRecoveryAlert = true
                }
            } catch {
                await MainActor.run {
                    isPerformingOperation = false
                    alertMessage = error.localizedDescription
                    showingRecoveryAlert = true
                }
            }
        }
    }
}

#Preview {
    SettingsView()
}