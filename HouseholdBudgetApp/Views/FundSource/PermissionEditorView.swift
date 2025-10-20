import SwiftUI

struct PermissionEditorView: View {
    @Environment(\.dismiss) private var dismiss
    let share: FundSourceShare
    @ObservedObject var sharingViewModel: SharingViewModel
    
    @State private var selectedPermission: SharePermission
    @State private var isUpdating = false
    @State private var showingConfirmation = false
    
    init(share: FundSourceShare, sharingViewModel: SharingViewModel) {
        self.share = share
        self.sharingViewModel = sharingViewModel
        self._selectedPermission = State(initialValue: share.permissions)
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "person.badge.key")
                        .font(.system(size: 48))
                        .foregroundColor(.blue)
                    
                    Text("sharing.editPermissions".localized)
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    if let fundSource = share.fundSource {
                        Text("sharing.editPermissionsFor".localized(with: fundSource.name))
                            .font(.body)
                            .foregroundColor(ColorManager.secondaryText)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.top)
                
                // Current Permission Display
                VStack(spacing: 8) {
                    Text("sharing.currentPermission".localized)
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    HStack {
                        Text(share.permissions.displayName)
                            .font(.body)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(currentPermissionColor.opacity(0.2))
                            .foregroundColor(currentPermissionColor)
                            .cornerRadius(8)
                        
                        Image(systemName: "arrow.right")
                            .foregroundColor(ColorManager.secondaryText)
                        
                        Text(selectedPermission.displayName)
                            .font(.body)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(newPermissionColor.opacity(0.2))
                            .foregroundColor(newPermissionColor)
                            .cornerRadius(8)
                    }
                }
                .padding()
                .background(Color(.systemGroupedBackground))
                .cornerRadius(12)
                .padding(.horizontal)
                
                // Permission Selection
                VStack(alignment: .leading, spacing: 12) {
                    Text("sharing.selectNewPermission".localized)
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
                
                // Permission Comparison
                if selectedPermission != share.permissions {
                    PermissionComparisonView(
                        currentPermission: share.permissions,
                        newPermission: selectedPermission
                    )
                    .padding(.horizontal)
                }
                
                Spacer()
                
                // Update Button
                Button(action: {
                    if selectedPermission != share.permissions {
                        showingConfirmation = true
                    } else {
                        dismiss()
                    }
                }) {
                    HStack {
                        if isUpdating {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: selectedPermission != share.permissions ? "checkmark.circle" : "xmark.circle")
                        }
                        Text(selectedPermission != share.permissions ? "sharing.updatePermissions".localized : "action.noChanges".localized)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(selectedPermission != share.permissions ? Color.blue : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isUpdating)
                .padding(.horizontal)
                
                // Error Display
                if let error = sharingViewModel.currentError {
                    Text(error.localizedDescription)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding(.horizontal)
                }
            }
            .navigationTitle("sharing.editPermissions".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                }
            }
        }
        .alert("sharing.confirmPermissionChange".localized, isPresented: $showingConfirmation) {
            Button("action.cancel".localized, role: .cancel) { }
            Button("sharing.updatePermissions".localized) {
                updatePermissions()
            }
        } message: {
            Text("sharing.confirmPermissionChange.message".localized(
                with: share.permissions.displayName,
                selectedPermission.displayName
            ))
        }
    }
    
    private var currentPermissionColor: Color {
        switch share.permissions {
        case .readOnly: return .blue
        case .readWrite: return .green
        case .admin: return .orange
        }
    }
    
    private var newPermissionColor: Color {
        switch selectedPermission {
        case .readOnly: return .blue
        case .readWrite: return .green
        case .admin: return .orange
        }
    }
    
    private func updatePermissions() {
        isUpdating = true
        
        Task {
            await sharingViewModel.updateSharePermissions(share, permissions: selectedPermission)
            
            await MainActor.run {
                isUpdating = false
                if sharingViewModel.currentError == nil {
                    dismiss()
                }
            }
        }
    }
}

struct PermissionComparisonView: View {
    let currentPermission: SharePermission
    let newPermission: SharePermission
    
    var body: some View {
        VStack(spacing: 12) {
            Text("sharing.permissionChanges".localized)
                .font(.headline)
                .foregroundColor(ColorManager.primaryText)
            
            VStack(spacing: 8) {
                PermissionChangeRow(
                    title: "sharing.createTransactions".localized,
                    current: currentPermission.canCreateTransactions,
                    new: newPermission.canCreateTransactions
                )
                
                PermissionChangeRow(
                    title: "sharing.editTransactions".localized,
                    current: currentPermission.canEditTransactions,
                    new: newPermission.canEditTransactions
                )
                
                PermissionChangeRow(
                    title: "sharing.deleteTransactions".localized,
                    current: currentPermission.canDeleteTransactions,
                    new: newPermission.canDeleteTransactions
                )
                
                PermissionChangeRow(
                    title: "sharing.adjustBalance".localized,
                    current: currentPermission.canAdjustBalance,
                    new: newPermission.canAdjustBalance
                )
                
                PermissionChangeRow(
                    title: "sharing.manageSharing".localized,
                    current: currentPermission.canManageSharing,
                    new: newPermission.canManageSharing
                )
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
    }
}

struct PermissionChangeRow: View {
    let title: String
    let current: Bool
    let new: Bool
    
    var body: some View {
        HStack {
            Text(title)
                .font(.body)
                .foregroundColor(ColorManager.primaryText)
            
            Spacer()
            
            HStack(spacing: 8) {
                Image(systemName: current ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .foregroundColor(current ? .green : .red)
                
                Image(systemName: "arrow.right")
                    .foregroundColor(ColorManager.secondaryText)
                    .font(.caption)
                
                Image(systemName: new ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .foregroundColor(new ? .green : .red)
            }
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    let share = FundSourceShare(
        ownerAccountId: UUID(),
        sharedAccountId: UUID(),
        permissions: .readWrite
    )
    
    return PermissionEditorView(
        share: share,
        sharingViewModel: SharingViewModel(modelContext: PreviewContainer.shared.mainContext)
    )
}