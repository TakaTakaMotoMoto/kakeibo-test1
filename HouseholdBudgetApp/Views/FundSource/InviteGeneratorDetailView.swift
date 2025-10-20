import SwiftUI

struct InviteGeneratorDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let fundSource: FundSource
    @ObservedObject var sharingViewModel: SharingViewModel
    
    @State private var selectedPermission: SharePermission = .readWrite
    @State private var generatedToken: String?
    @State private var isGenerating = false
    @State private var showingQRCode = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "person.badge.plus")
                        .font(.system(size: 48))
                        .foregroundColor(.blue)
                    
                    Text("sharing.generateInvite".localized)
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("sharing.generateInvite.description".localized(with: fundSource.name))
                        .font(.body)
                        .foregroundColor(ColorManager.secondaryText)
                        .multilineTextAlignment(.center)
                }
                .padding(.top)
                
                // Permission Selection
                VStack(alignment: .leading, spacing: 12) {
                    Text("sharing.selectPermission".localized)
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
                
                // Generated Token Display
                if let token = generatedToken {
                    VStack(spacing: 12) {
                        Text("sharing.inviteGenerated".localized)
                            .font(.headline)
                            .foregroundColor(.green)
                        
                        VStack(spacing: 8) {
                            Text("sharing.inviteCode".localized)
                                .font(.caption)
                                .foregroundColor(ColorManager.secondaryText)
                            
                            Text(token)
                                .font(.title3)
                                .fontWeight(.bold)
                                .padding()
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(8)
                                .textSelection(.enabled)
                        }
                        
                        HStack(spacing: 16) {
                            Button("sharing.copyCode".localized) {
                                UIPasteboard.general.string = token
                            }
                            .buttonStyle(.bordered)
                            
                            Button("sharing.showQR".localized) {
                                showingQRCode = true
                            }
                            .buttonStyle(.bordered)
                        }
                        
                        Text("sharing.inviteExpiry".localized)
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                
                Spacer()
                
                // Generate Button
                if generatedToken == nil {
                    Button(action: generateInvite) {
                        HStack {
                            if isGenerating {
                                ProgressView()
                                    .scaleEffect(0.8)
                            } else {
                                Image(systemName: "plus.circle.fill")
                            }
                            Text("sharing.generateInvite".localized)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isGenerating)
                    .padding(.horizontal)
                }
                
                // Error Display
                if let error = sharingViewModel.currentError {
                    Text(error.localizedDescription)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding(.horizontal)
                }
            }
            .navigationTitle("sharing.generateInvite".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("action.done".localized) {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingQRCode) {
            if let token = generatedToken {
                QRCodeView(token: token)
            }
        }
    }
    
    private func generateInvite() {
        isGenerating = true
        
        Task {
            let token = await sharingViewModel.createShareInvitation(
                for: fundSource,
                permissions: selectedPermission
            )
            
            await MainActor.run {
                isGenerating = false
                generatedToken = token
            }
        }
    }
}

struct PermissionSelectionRow: View {
    let permission: SharePermission
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .blue : ColorManager.secondaryText)
                    .font(.title3)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(permission.displayName)
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    Text(permission.description)
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
                
                Spacer()
            }
            .padding()
            .background(isSelected ? Color.blue.opacity(0.1) : Color.clear)
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct QRCodeView: View {
    @Environment(\.dismiss) private var dismiss
    let token: String
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("sharing.qrCode".localized)
                    .font(.title2)
                    .fontWeight(.semibold)
                
                // QR Code would be generated here
                // For now, showing placeholder
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 200, height: 200)
                    .overlay(
                        VStack {
                            Image(systemName: "qrcode")
                                .font(.system(size: 48))
                                .foregroundColor(ColorManager.secondaryText)
                            Text("QR Code")
                                .font(.caption)
                                .foregroundColor(ColorManager.secondaryText)
                        }
                    )
                
                Text("sharing.qrCode.description".localized)
                    .font(.body)
                    .foregroundColor(ColorManager.secondaryText)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Text(token)
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
                
                Spacer()
            }
            .padding()
            .navigationTitle("sharing.qrCode".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("action.done".localized) {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    InviteGeneratorDetailView(
        fundSource: FundSource(name: "Sample Fund", initialBalance: 10000),
        sharingViewModel: SharingViewModel(modelContext: PreviewContainer.shared.mainContext)
    )
}