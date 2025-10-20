import SwiftUI

struct SharingManagementView: View {
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    @ObservedObject var fundSourceViewModel: FundSourceViewModel
    @StateObject private var sharingViewModel: SharingViewModel
    @StateObject private var syncService: DataSynchronizationService
    
    @State private var showingInviteAcceptance = false
    @State private var selectedFundSource: FundSource?
    @State private var showingFundSourceDetail = false
    
    init(userAccountViewModel: UserAccountViewModel, fundSourceViewModel: FundSourceViewModel) {
        self.userAccountViewModel = userAccountViewModel
        self.fundSourceViewModel = fundSourceViewModel
        self._sharingViewModel = StateObject(wrappedValue: SharingViewModel(modelContext: fundSourceViewModel.modelContext))
        self._syncService = StateObject(wrappedValue: DataSynchronizationService(modelContext: fundSourceViewModel.modelContext))
    }
    
    var body: some View {
        NavigationView {
            List {
                // Sync Status Section
                Section("sharing.syncStatus".localized) {
                    SyncStatusRow(syncService: syncService)
                }
                
                // My Fund Sources Section
                if !ownedFundSources.isEmpty {
                    Section("sharing.myFundSources".localized) {
                        ForEach(ownedFundSources, id: \.id) { fundSource in
                            FundSourceSharingRow(
                                fundSource: fundSource,
                                sharingViewModel: sharingViewModel,
                                onTap: {
                                    selectedFundSource = fundSource
                                    showingFundSourceDetail = true
                                }
                            )
                        }
                    }
                }
                
                // Shared With Me Section
                if !sharedFundSources.isEmpty {
                    Section("sharing.sharedWithMe".localized) {
                        ForEach(sharedFundSources, id: \.id) { fundSource in
                            SharedFundSourceRow(
                                fundSource: fundSource,
                                sharingViewModel: sharingViewModel,
                                userAccountViewModel: userAccountViewModel
                            )
                        }
                    }
                }
                
                // Pending Invitations Section
                if !sharingViewModel.pendingInvitations.isEmpty {
                    Section("sharing.pendingInvitations".localized) {
                        ForEach(sharingViewModel.pendingInvitations, id: \.id) { invitation in
                            PendingInvitationRow(
                                invitation: invitation,
                                onAccept: {
                                    acceptInvitation(invitation)
                                },
                                onDecline: {
                                    declineInvitation(invitation)
                                }
                            )
                        }
                    }
                }
                
                // Actions Section
                Section("sharing.actions".localized) {
                    Button(action: {
                        showingInviteAcceptance = true
                    }) {
                        Label("sharing.acceptInvitation".localized, systemImage: "plus.circle")
                    }
                    
                    Button(action: {
                        Task {
                            await syncService.performFullSync()
                        }
                    }) {
                        Label("sharing.syncNow".localized, systemImage: "arrow.clockwise")
                    }
                    .disabled(syncService.isSyncing)
                }
                
                // Empty State
                if ownedFundSources.isEmpty && sharedFundSources.isEmpty {
                    Section {
                        VStack(spacing: 16) {
                            Image(systemName: "person.2.slash")
                                .font(.system(size: 48))
                                .foregroundColor(ColorManager.secondaryText)
                            
                            Text("sharing.noSharedFundSources".localized)
                                .font(.headline)
                                .foregroundColor(ColorManager.primaryText)
                            
                            Text("sharing.noSharedFundSources.description".localized)
                                .font(.body)
                                .foregroundColor(ColorManager.secondaryText)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                    }
                }
            }
            .navigationTitle("sharing.management".localized)
            .refreshable {
                await syncService.performFullSync()
            }
        }
        .sheet(isPresented: $showingInviteAcceptance) {
            InviteAcceptanceView(
                sharingViewModel: sharingViewModel,
                userAccountViewModel: userAccountViewModel
            )
        }
        .sheet(isPresented: $showingFundSourceDetail) {
            if let fundSource = selectedFundSource {
                FundSourceSharingDetailView(
                    fundSource: fundSource,
                    userAccountViewModel: userAccountViewModel,
                    fundSourceViewModel: fundSourceViewModel
                )
            }
        }
        .task {
            await syncService.syncIfNeeded()
        }
    }
    
    private var ownedFundSources: [FundSource] {
        guard let currentUserId = userAccountViewModel.currentAccount?.id else { return [] }
        return sharingViewModel.getOwnedFundSources(for: currentUserId)
    }
    
    private var sharedFundSources: [FundSource] {
        guard let currentUserId = userAccountViewModel.currentAccount?.id else { return [] }
        return sharingViewModel.getSharedFundSources(for: currentUserId)
    }
    
    private func acceptInvitation(_ invitation: FundSourceShare) {
        guard let currentAccount = userAccountViewModel.currentAccount else { return }
        
        Task {
            let success = await sharingViewModel.processInvitationAcceptance(
                token: invitation.inviteToken ?? "",
                accountId: currentAccount.id
            )
            
            if success {
                await syncService.performFullSync()
            }
        }
    }
    
    private func declineInvitation(_ invitation: FundSourceShare) {
        Task {
            await sharingViewModel.removeShare(invitation)
        }
    }
}

struct SyncStatusRow: View {
    @ObservedObject var syncService: DataSynchronizationService
    
    var body: some View {
        HStack {
            Image(systemName: syncService.getSyncStatus().iconName)
                .foregroundColor(statusColor)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(syncService.getSyncStatus().displayText)
                    .font(.headline)
                    .foregroundColor(ColorManager.primaryText)
                
                if let lastSync = syncService.lastSyncDate {
                    Text("sharing.lastSync".localized(with: DateFormatter.shortDateTime.string(from: lastSync)))
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
            }
            
            Spacer()
            
            if syncService.isSyncing {
                ProgressView()
                    .scaleEffect(0.8)
            }
        }
    }
    
    private var statusColor: Color {
        switch syncService.getSyncStatus() {
        case .notSynced:
            return .orange
        case .syncing:
            return .blue
        case .synced:
            return .green
        case .error:
            return .red
        }
    }
}

struct FundSourceSharingRow: View {
    let fundSource: FundSource
    @ObservedObject var sharingViewModel: SharingViewModel
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(fundSource.name)
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    Text(CurrencyFormatter.shared.string(from: fundSource.currentBalance as NSDecimalNumber) ?? "¥0")
                        .font(.body)
                        .foregroundColor(ColorManager.secondaryText)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    if fundSource.isShared {
                        let shareCount = sharingViewModel.getShares(for: fundSource).count
                        Text("sharing.sharedWith".localized(with: "\(shareCount)"))
                            .font(.caption)
                            .foregroundColor(.blue)
                    } else {
                        Text("sharing.notShared".localized)
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                    
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct SharedFundSourceRow: View {
    let fundSource: FundSource
    @ObservedObject var sharingViewModel: SharingViewModel
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(fundSource.name)
                    .font(.headline)
                    .foregroundColor(ColorManager.primaryText)
                
                Text(CurrencyFormatter.shared.string(from: fundSource.currentBalance as NSDecimalNumber) ?? "¥0")
                    .font(.body)
                    .foregroundColor(ColorManager.secondaryText)
                
                if let ownerAccount = userAccountViewModel.getAccount(by: fundSource.ownerAccountId ?? UUID()) {
                    Text("fundSource.owner".localized(with: ownerAccount.username))
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                if let permission = getUserPermission() {
                    Text(permission.displayName)
                        .font(.caption)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(permissionColor.opacity(0.2))
                        .foregroundColor(permissionColor)
                        .cornerRadius(4)
                }
                
                Image(systemName: "person.2")
                    .font(.caption)
                    .foregroundColor(.blue)
            }
        }
    }
    
    private func getUserPermission() -> SharePermission? {
        guard let currentUserId = userAccountViewModel.currentAccount?.id else { return nil }
        return sharingViewModel.getUserPermission(for: fundSource, userId: currentUserId)
    }
    
    private var permissionColor: Color {
        switch getUserPermission() {
        case .readOnly:
            return .blue
        case .readWrite:
            return .green
        case .admin:
            return .orange
        case .none:
            return .gray
        }
    }
}

struct PendingInvitationRow: View {
    let invitation: FundSourceShare
    let onAccept: () -> Void
    let onDecline: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(invitation.fundSource?.name ?? "sharing.unknownFundSource".localized)
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    Text(invitation.permissions.displayName)
                        .font(.caption)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.orange.opacity(0.2))
                        .foregroundColor(.orange)
                        .cornerRadius(4)
                }
                
                Spacer()
                
                if let expiry = invitation.inviteExpiry {
                    Text("sharing.expires".localized(with: DateFormatter.shortDate.string(from: expiry)))
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
            }
            
            HStack(spacing: 12) {
                Button("sharing.accept".localized) {
                    onAccept()
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
                
                Button("sharing.decline".localized) {
                    onDecline()
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
        }
    }
}

#Preview {
    SharingManagementView(
        userAccountViewModel: UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext),
        fundSourceViewModel: FundSourceViewModel(modelContext: PreviewContainer.shared.mainContext)
    )
}