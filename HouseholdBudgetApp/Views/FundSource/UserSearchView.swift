import SwiftUI

struct UserSearchView: View {
    @Environment(\.dismiss) private var dismiss
    let fundSource: FundSource
    @ObservedObject var sharingViewModel: SharingViewModel
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    
    @State private var searchText = ""
    @State private var selectedPermission: SharePermission = .readWrite
    @State private var selectedUser: UserAccount?
    @State private var showingPermissionSelector = false
    @State private var isSearching = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                VStack(spacing: 12) {
                    SearchBar(text: $searchText, onSearchButtonClicked: performSearch)
                    
                    if isSearching {
                        ProgressView("sharing.searching".localized)
                            .frame(maxWidth: .infinity)
                            .padding()
                    }
                }
                .padding()
                .background(Color(.systemGroupedBackground))
                
                // Search Results
                List {
                    if sharingViewModel.searchResults.isEmpty && !searchText.isEmpty && !isSearching {
                        Section {
                            VStack(spacing: 12) {
                                Image(systemName: "person.slash")
                                    .font(.system(size: 32))
                                    .foregroundColor(ColorManager.secondaryText)
                                
                                Text("sharing.noUsersFound".localized)
                                    .font(.headline)
                                    .foregroundColor(ColorManager.primaryText)
                                
                                Text("sharing.noUsersFound.description".localized)
                                    .font(.body)
                                    .foregroundColor(ColorManager.secondaryText)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 32)
                        }
                    } else {
                        ForEach(filteredSearchResults, id: \.id) { user in
                            UserSearchResultRow(
                                user: user,
                                isAlreadyShared: isUserAlreadyShared(user),
                                onSelect: {
                                    selectedUser = user
                                    showingPermissionSelector = true
                                }
                            )
                        }
                    }
                }
                .listStyle(PlainListStyle())
                
                // Instructions
                if searchText.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 48))
                            .foregroundColor(ColorManager.secondaryText)
                        
                        Text("sharing.searchInstructions".localized)
                            .font(.headline)
                            .foregroundColor(ColorManager.primaryText)
                        
                        Text("sharing.searchInstructions.description".localized)
                            .font(.body)
                            .foregroundColor(ColorManager.secondaryText)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()
                }
            }
            .navigationTitle("sharing.addUser".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingPermissionSelector) {
            if let user = selectedUser {
                PermissionSelectorView(
                    user: user,
                    fundSource: fundSource,
                    selectedPermission: $selectedPermission,
                    sharingViewModel: sharingViewModel,
                    onComplete: {
                        dismiss()
                    }
                )
            }
        }
    }
    
    private var filteredSearchResults: [UserAccount] {
        // Filter out current user and users already sharing this fund source
        let currentUserId = userAccountViewModel.currentAccount?.id
        let existingSharedUserIds = sharingViewModel.getShares(for: fundSource).map { $0.sharedAccountId }
        
        return sharingViewModel.searchResults.filter { user in
            user.id != currentUserId && !existingSharedUserIds.contains(user.id)
        }
    }
    
    private func isUserAlreadyShared(_ user: UserAccount) -> Bool {
        let existingSharedUserIds = sharingViewModel.getShares(for: fundSource).map { $0.sharedAccountId }
        return existingSharedUserIds.contains(user.id)
    }
    
    private func performSearch() {
        guard !searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        isSearching = true
        
        Task {
            // Search by email first, then by username if no results
            await sharingViewModel.searchUsers(by: searchText)
            
            if sharingViewModel.searchResults.isEmpty {
                await sharingViewModel.searchUsersByUsername(searchText)
            }
            
            await MainActor.run {
                isSearching = false
            }
        }
    }
}

struct SearchBar: View {
    @Binding var text: String
    let onSearchButtonClicked: () -> Void
    
    var body: some View {
        HStack {
            TextField("sharing.searchPlaceholder".localized, text: $text)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .onSubmit {
                    onSearchButtonClicked()
                }
            
            Button("action.search".localized) {
                onSearchButtonClicked()
            }
            .buttonStyle(.bordered)
            .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
    }
}

struct UserSearchResultRow: View {
    let user: UserAccount
    let isAlreadyShared: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                // Avatar placeholder
                Circle()
                    .fill(Color.blue.opacity(0.2))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text(String(user.username.prefix(1)).uppercased())
                            .font(.headline)
                            .foregroundColor(.blue)
                    )
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(user.username)
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    Text(user.email)
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
                
                Spacer()
                
                if isAlreadyShared {
                    Text("sharing.alreadyShared".localized)
                        .font(.caption)
                        .foregroundColor(.orange)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.orange.opacity(0.2))
                        .cornerRadius(4)
                } else {
                    Image(systemName: "plus.circle")
                        .foregroundColor(.blue)
                        .font(.title3)
                }
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(isAlreadyShared)
    }
}

struct PermissionSelectorView: View {
    @Environment(\.dismiss) private var dismiss
    let user: UserAccount
    let fundSource: FundSource
    @Binding var selectedPermission: SharePermission
    @ObservedObject var sharingViewModel: SharingViewModel
    let onComplete: () -> Void
    
    @State private var isCreatingShare = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // User Info
                VStack(spacing: 12) {
                    Circle()
                        .fill(Color.blue.opacity(0.2))
                        .frame(width: 60, height: 60)
                        .overlay(
                            Text(String(user.username.prefix(1)).uppercased())
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                        )
                    
                    VStack(spacing: 4) {
                        Text(user.username)
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(ColorManager.primaryText)
                        
                        Text(user.email)
                            .font(.body)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                    
                    Text("sharing.selectPermissionFor".localized(with: fundSource.name))
                        .font(.body)
                        .foregroundColor(ColorManager.secondaryText)
                        .multilineTextAlignment(.center)
                }
                .padding(.top)
                
                // Permission Selection
                VStack(alignment: .leading, spacing: 12) {
                    Text("sharing.permissions".localized)
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    ForEach(SharePermission.allCases, id: \.self) { permission in
                        PermissionSelectionRow(
                            permission: permission,
                            isSelected: selectedPermission == permission,
                            onSelect: {
                                selectedPermission = permission
                            }
                        )
                    }
                }
                .padding(.horizontal)
                
                Spacer()
                
                // Create Share Button
                Button(action: createShare) {
                    HStack {
                        if isCreatingShare {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "person.badge.plus")
                        }
                        Text("sharing.addUser".localized)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isCreatingShare)
                .padding(.horizontal)
                
                // Error Display
                if let error = sharingViewModel.currentError {
                    Text(error.localizedDescription)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding(.horizontal)
                }
            }
            .navigationTitle("sharing.addUser".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func createShare() {
        isCreatingShare = true
        
        Task {
            let success = await sharingViewModel.createDirectShare(
                for: fundSource,
                with: user.id,
                permissions: selectedPermission
            )
            
            await MainActor.run {
                isCreatingShare = false
                if success {
                    onComplete()
                }
            }
        }
    }
}

#Preview {
    UserSearchView(
        fundSource: FundSource(name: "Sample Fund", initialBalance: 10000),
        sharingViewModel: SharingViewModel(modelContext: PreviewContainer.shared.mainContext),
        userAccountViewModel: UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext)
    )
}