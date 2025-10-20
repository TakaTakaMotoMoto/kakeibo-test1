import SwiftUI

struct FundSourceSharingDetailView: View {
    let fundSource: FundSource
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    @ObservedObject var fundSourceViewModel: FundSourceViewModel
    @StateObject private var sharingViewModel: SharingViewModel
    
    @State private var showingInviteGenerator = false
    @State private var showingUserSearch = false
    @State private var showingPermissionEditor = false
    @State private var selectedShare: FundSourceShare?
    @State private var showingDeleteConfirmation = false
    @State private var shareToDelete: FundSourceShare?
    
    init(fundSource: FundSource, userAccountViewModel: UserAccountViewModel, fundSourceViewModel: FundSourceViewModel) {
        self.fundSource = fundSource
        self.userAccountViewModel = userAccountViewModel
        self.fundSourceViewModel = fundSourceViewModel
        self._sharingViewModel = StateObject(wrappedValue: SharingViewModel(modelContext: fundSourceViewModel.modelContext))
    }
    
    var body: some View {
        List {
            // Fund Source Info Section
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(fundSource.name)
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(ColorManager.primaryText)
                        
                        Spacer()
                        
                        Text(CurrencyFormatter.shared.string(from: fundSource.currentBalance as NSDecimalNumber) ?? "¥0")
                            .font(.title3)
                            .fontWeight(.medium)
                            .foregroundColor(ColorManager.primaryText)
                    }
                    
                    if let ownerAccount = userAccountViewModel.getAccount(by: fundSource.ownerAccountId ?? UUID()) {
                        Text("fundSource.owner".localized(with: ownerAccount.username))
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                }
                .padding(.vertical, 4)
            }
            
            // Current Shares Section
            let currentShares = sharingViewModel.getShares(for: fundSource)
            if !currentShares.isEmpty {
                Section("sharing.currentShares".localized) {
                    ForEach(currentShares, id: \.id) { share in
                        ShareRowView(
                            share: share,
                            userAccountViewModel: userAccountViewModel,
                            onEditPermissions: {
                                selectedShare = share
                                showingPermissionEditor = true
                            },
                            onRemoveShare: {
                                shareToDelete = share
                                showingDeleteConfirmation = true
                            }
                        )
                    }
                }
            }
            
            // Pending Invitations Section
            let pendingInvites = sharingViewModel.pendingInvitations.filter { $0.fundSource?.id == fundSource.id }
            if !pendingInvites.isEmpty {
                Section("sharing.pendingInvitations".localized) {
                    ForEach(pendingInvites, id: \.id) { invitation in
                        PendingInvitationRowView(
                            invitation: invitation,
                            onCancel: {
                                shareToDelete = invitation
                                showingDeleteConfirmation = true
                            }
                        )
                    }
                }
            }
            
            // Actions Section
            if canManageSharing {
                Section("sharing.actions".localized) {
                    Button(action: {
                        showingInviteGenerator = true
                    }) {
                        Label("sharing.generateInvite".localized, systemImage: "plus.circle")
                    }
                    .accessibilityLabel("sharing.generateInvite".localized)
                    
                    Button(action: {
                        showingUserSearch = true
                    }) {
                        Label("sharing.addUser".localized, systemImage: "person.badge.plus")
                    }
                    .accessibilityLabel("sharing.addUser".localized)
                }
            }
            
            // Sharing History Section
            Section("sharing.history".localized) {
                SharingHistoryView(fundSource: fundSource, sharingViewModel: sharingViewModel)
            }
            
            // Error Display
            if let error = sharingViewModel.currentError {
                Section {
                    Text(error.localizedDescription)
                        .foregroundColor(.red)
                        .font(.caption)
                }
            }
        }
        .navigationTitle("sharing.fundSourceDetail".localized)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingInviteGenerator) {
            InviteGeneratorDetailView(
                fundSource: fundSource,
                sharingViewModel: sharingViewModel
            )
        }
        .sheet(isPresented: $showingUserSearch) {
            UserSearchView(
                fundSource: fundSource,
                sharingViewModel: sharingViewModel,
                userAccountViewModel: userAccountViewModel
            )
        }
        .sheet(isPresented: $showingPermissionEditor) {
            if let share = selectedShare {
                PermissionEditorView(
                    share: share,
                    sharingViewModel: sharingViewModel
                )
            }
        }
        .alert("sharing.removeShare.title".localized, isPresented: $showingDeleteConfirmation) {
            Button("action.cancel".localized, role: .cancel) {
                shareToDelete = nil
            }
            Button("action.remove".localized, role: .destructive) {
                if let share = shareToDelete {
                    Task {
                        await sharingViewModel.removeShare(share)
                    }
                }
                shareToDelete = nil
            }
        } message: {
            Text("sharing.removeShare.message".localized)
        }
    }
    
    private var canManageSharing: Bool {
        guard let currentAccount = userAccountViewModel.currentAccount else { return false }
        return sharingViewModel.canUserPerformAction(.manageSharing, on: fundSource, userId: currentAccount.id)
    }
}

struct ShareRowView: View {
    let share: FundSourceShare
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    let onEditPermissions: () -> Void
    let onRemoveShare: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                if let sharedAccount = userAccountViewModel.getAccount(by: share.sharedAccountId) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(sharedAccount.username)
                            .font(.headline)
                            .foregroundColor(ColorManager.primaryText)
                        
                        Text(sharedAccount.email)
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                } else {
                    Text("sharing.unknownUser".localized)
                        .font(.headline)
                        .foregroundColor(ColorManager.secondaryText)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text(share.permissions.displayName)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(permissionColor.opacity(0.2))
                        .foregroundColor(permissionColor)
                        .cornerRadius(4)
                    
                    Text("sharing.since".localized(with: DateFormatter.shortDate.string(from: share.createdAt)))
                        .font(.caption2)
                        .foregroundColor(ColorManager.secondaryText)
                }
            }
            
            Text(share.permissions.description)
                .font(.caption)
                .foregroundColor(ColorManager.secondaryText)
        }
        .swipeActions(edge: .trailing) {
            Button("action.remove".localized, role: .destructive) {
                onRemoveShare()
            }
            
            Button("sharing.editPermissions".localized) {
                onEditPermissions()
            }
            .tint(.blue)
        }
        .contextMenu {
            Button("sharing.editPermissions".localized) {
                onEditPermissions()
            }
            
            Button("action.remove".localized, role: .destructive) {
                onRemoveShare()
            }
        }
    }
    
    private var permissionColor: Color {
        switch share.permissions {
        case .readOnly:
            return .blue
        case .readWrite:
            return .green
        case .admin:
            return .orange
        }
    }
}

struct PendingInvitationRowView: View {
    let invitation: FundSourceShare
    let onCancel: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("sharing.pendingInvitation".localized)
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    if let token = invitation.inviteToken {
                        Text("sharing.inviteCode".localized(with: token))
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text(invitation.permissions.displayName)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.orange.opacity(0.2))
                        .foregroundColor(.orange)
                        .cornerRadius(4)
                    
                    if let expiry = invitation.inviteExpiry {
                        Text("sharing.expires".localized(with: DateFormatter.shortDate.string(from: expiry)))
                            .font(.caption2)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                }
            }
            
            Text("sharing.waitingAcceptance".localized)
                .font(.caption)
                .foregroundColor(ColorManager.secondaryText)
        }
        .swipeActions(edge: .trailing) {
            Button("action.cancel".localized, role: .destructive) {
                onCancel()
            }
        }
    }
}

struct SharingHistoryView: View {
    let fundSource: FundSource
    @ObservedObject var sharingViewModel: SharingViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("sharing.recentActivity".localized)
                .font(.caption)
                .foregroundColor(ColorManager.secondaryText)
            
            // This would show recent sharing activities
            // For now, showing placeholder
            Text("sharing.noRecentActivity".localized)
                .font(.caption)
                .foregroundColor(ColorManager.secondaryText)
                .italic()
        }
    }
}

#Preview {
    NavigationView {
        FundSourceSharingDetailView(
            fundSource: FundSource(name: "Sample Fund", initialBalance: 10000),
            userAccountViewModel: UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext),
            fundSourceViewModel: FundSourceViewModel(modelContext: PreviewContainer.shared.mainContext)
        )
    }
}