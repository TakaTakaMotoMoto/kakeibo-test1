import SwiftUI

struct iPadSettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var userAccountViewModel: UserAccountViewModel
    @State private var categoryViewModel: CategoryViewModel
    @State private var selectedSettingsSection: SettingsSection = .account
    
    init() {
        // These will be properly initialized in onAppear
        self._userAccountViewModel = State(initialValue: UserAccountViewModel(modelContext: ModelContext(try! ModelContainer(for: UserAccount.self))))
        self._categoryViewModel = State(initialValue: CategoryViewModel(modelContext: ModelContext(try! ModelContainer(for: Category.self))))
    }
    
    var body: some View {
        NavigationSplitView {
            // Master: Settings Sections
            List(SettingsSection.allCases, id: \.self, selection: $selectedSettingsSection) { section in
                NavigationLink(value: section) {
                    HStack {
                        Image(systemName: section.iconName)
                            .foregroundColor(section.color)
                            .frame(width: 24)
                        
                        Text(section.title)
                            .font(.body)
                    }
                    .padding(.vertical, 4)
                }
                .accessibilityLabel(section.accessibilityLabel)
            }
            .navigationTitle("nav.settings".localized)
            .navigationBarTitleDisplayMode(.large)
            .listStyle(SidebarListStyle())
            .navigationSplitViewColumnWidth(min: 250, ideal: 300, max: 350)
        } detail: {
            // Detail: Settings Content
            settingsDetailView(for: selectedSettingsSection)
        }
        .onAppear {
            setupViewModels()
        }
    }
    
    // MARK: - View Components
    
    @ViewBuilder
    private func settingsDetailView(for section: SettingsSection) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text(section.title)
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text(section.description)
                        .font(.subheadline)
                        .foregroundColor(ColorManager.secondaryText)
                }
                
                Divider()
                
                // Content
                switch section {
                case .account:
                    accountSettingsView
                case .categories:
                    categoriesSettingsView
                case .sharing:
                    sharingSettingsView
                case .appearance:
                    appearanceSettingsView
                case .accessibility:
                    accessibilitySettingsView
                case .about:
                    aboutSettingsView
                }
                
                Spacer()
            }
            .padding()
        }
    }
    
    private var accountSettingsView: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Current Account
            if let currentAccount = userAccountViewModel.currentAccount {
                VStack(alignment: .leading, spacing: 12) {
                    Text("settings.currentAccount".localized)
                        .font(.headline)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("settings.username".localized)
                                .foregroundColor(ColorManager.secondaryText)
                            Spacer()
                            Text(currentAccount.username)
                                .fontWeight(.medium)
                        }
                        
                        HStack {
                            Text("settings.email".localized)
                                .foregroundColor(ColorManager.secondaryText)
                            Spacer()
                            Text(currentAccount.email)
                                .fontWeight(.medium)
                        }
                        
                        HStack {
                            Text("settings.memberSince".localized)
                                .foregroundColor(ColorManager.secondaryText)
                            Spacer()
                            Text(DateFormatter.shortDate(from: currentAccount.createdAt))
                                .fontWeight(.medium)
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }
            } else {
                // No Account
                VStack(alignment: .leading, spacing: 12) {
                    Text("settings.noAccount".localized)
                        .font(.headline)
                    
                    Text("settings.createAccountHint".localized)
                        .font(.body)
                        .foregroundColor(ColorManager.secondaryText)
                    
                    NavigationLink(destination: UserAccountFormView(viewModel: userAccountViewModel)) {
                        Text("settings.createAccount".localized)
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
            
            // Account Actions
            VStack(alignment: .leading, spacing: 12) {
                Text("settings.accountActions".localized)
                    .font(.headline)
                
                VStack(spacing: 8) {
                    NavigationLink(destination: UserAccountListView(viewModel: userAccountViewModel)) {
                        HStack {
                            Image(systemName: "person.2")
                            Text("settings.manageAccounts".localized)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(ColorManager.secondaryText)
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    if userAccountViewModel.currentAccount != nil {
                        Button(action: {
                            // Sign out action
                        }) {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                Text("settings.signOut".localized)
                                Spacer()
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .foregroundColor(.red)
                    }
                }
            }
        }
    }
    
    private var categoriesSettingsView: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("settings.categoriesDescription".localized)
                .font(.body)
                .foregroundColor(ColorManager.secondaryText)
            
            NavigationLink(destination: CategoryListView(viewModel: categoryViewModel)) {
                HStack {
                    Image(systemName: "folder")
                    Text("settings.manageCategories".localized)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundColor(ColorManager.secondaryText)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }
            .buttonStyle(PlainButtonStyle())
            
            // Category Statistics
            VStack(alignment: .leading, spacing: 12) {
                Text("settings.categoryStats".localized)
                    .font(.headline)
                
                HStack {
                    VStack(alignment: .leading) {
                        Text("settings.totalCategories".localized)
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                        Text("\(categoryViewModel.categories.count)")
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing) {
                        Text("settings.customCategories".localized)
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                        Text("\(categoryViewModel.categories.filter { $0.isCustom }.count)")
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }
        }
    }
    
    private var sharingSettingsView: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("settings.sharingDescription".localized)
                .font(.body)
                .foregroundColor(ColorManager.secondaryText)
            
            NavigationLink(destination: SharingSettingsView(viewModel: userAccountViewModel)) {
                HStack {
                    Image(systemName: "person.2")
                    Text("settings.manageSharingSettings".localized)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundColor(ColorManager.secondaryText)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
    
    private var appearanceSettingsView: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("settings.appearanceDescription".localized)
                .font(.body)
                .foregroundColor(ColorManager.secondaryText)
            
            // Color Scheme
            VStack(alignment: .leading, spacing: 12) {
                Text("settings.colorScheme".localized)
                    .font(.headline)
                
                Text("settings.colorSchemeNote".localized)
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
            
            // Language
            VStack(alignment: .leading, spacing: 12) {
                Text("settings.language".localized)
                    .font(.headline)
                
                Text("settings.languageNote".localized)
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
        }
    }
    
    private var accessibilitySettingsView: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("settings.accessibilityDescription".localized)
                .font(.body)
                .foregroundColor(ColorManager.secondaryText)
            
            // Dynamic Type
            VStack(alignment: .leading, spacing: 12) {
                Text("settings.dynamicType".localized)
                    .font(.headline)
                
                Text("settings.dynamicTypeNote".localized)
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
            
            // VoiceOver
            VStack(alignment: .leading, spacing: 12) {
                Text("settings.voiceOver".localized)
                    .font(.headline)
                
                Text("settings.voiceOverNote".localized)
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
        }
    }
    
    private var aboutSettingsView: some View {
        VStack(alignment: .leading, spacing: 20) {
            // App Info
            VStack(alignment: .leading, spacing: 12) {
                Text("settings.appInfo".localized)
                    .font(.headline)
                
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("settings.version".localized)
                            .foregroundColor(ColorManager.secondaryText)
                        Spacer()
                        Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0")
                            .fontWeight(.medium)
                    }
                    
                    HStack {
                        Text("settings.build".localized)
                            .foregroundColor(ColorManager.secondaryText)
                        Spacer()
                        Text(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1")
                            .fontWeight(.medium)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }
            
            // Support
            VStack(alignment: .leading, spacing: 12) {
                Text("settings.support".localized)
                    .font(.headline)
                
                Text("settings.supportDescription".localized)
                    .font(.body)
                    .foregroundColor(ColorManager.secondaryText)
            }
            
            // Legal
            VStack(alignment: .leading, spacing: 12) {
                Text("settings.legal".localized)
                    .font(.headline)
                
                Text("settings.legalDescription".localized)
                    .font(.body)
                    .foregroundColor(ColorManager.secondaryText)
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func setupViewModels() {
        userAccountViewModel = UserAccountViewModel(modelContext: modelContext)
        categoryViewModel = CategoryViewModel(modelContext: modelContext)
    }
}

// MARK: - Settings Section Enum
enum SettingsSection: String, CaseIterable {
    case account = "account"
    case categories = "categories"
    case sharing = "sharing"
    case appearance = "appearance"
    case accessibility = "accessibility"
    case about = "about"
    
    var title: String {
        switch self {
        case .account:
            return "settings.account".localized
        case .categories:
            return "settings.categories".localized
        case .sharing:
            return "settings.sharing".localized
        case .appearance:
            return "settings.appearance".localized
        case .accessibility:
            return "settings.accessibility".localized
        case .about:
            return "settings.about".localized
        }
    }
    
    var description: String {
        switch self {
        case .account:
            return "settings.accountDescription".localized
        case .categories:
            return "settings.categoriesDescription".localized
        case .sharing:
            return "settings.sharingDescription".localized
        case .appearance:
            return "settings.appearanceDescription".localized
        case .accessibility:
            return "settings.accessibilityDescription".localized
        case .about:
            return "settings.aboutDescription".localized
        }
    }
    
    var iconName: String {
        switch self {
        case .account:
            return "person.circle"
        case .categories:
            return "folder"
        case .sharing:
            return "person.2"
        case .appearance:
            return "paintbrush"
        case .accessibility:
            return "accessibility"
        case .about:
            return "info.circle"
        }
    }
    
    var color: Color {
        switch self {
        case .account:
            return .blue
        case .categories:
            return .orange
        case .sharing:
            return .green
        case .appearance:
            return .purple
        case .accessibility:
            return .indigo
        case .about:
            return .gray
        }
    }
    
    var accessibilityLabel: String {
        return title
    }
}

#Preview {
    iPadSettingsView()
        .modelContainer(for: [UserAccount.self, Category.self, FundSource.self])
}